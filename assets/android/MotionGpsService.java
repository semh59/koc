package com.neowell.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import java.util.Map;

/**
 * Kısa GPS penceresi: kullanıcının elle başlattığı yürüyüşte Doppler hızını ve adım ritmini birlikte ölçüp adım uzunluğu modelini günceller.
 * Konum noktası saklanmaz. İyi sinyalde ≈ 45 sn; ilk iyi nokta için (evden çıkış) en çok 10 dk beklenir.
 */
public class MotionGpsService extends Service implements LocationListener {
    private static final int NOTIF_ID = 7101;
    private static final long WINDOW_MS = 45000, HARD_MS = 600000;

    private final Handler h = new Handler(Looper.getMainLooper());
    private LocationManager lm;
    private boolean finished, started;
    private final double[] speeds = new double[400];
    private int n;
    private long tFirst, tLast;
    private long stepsStart = -1;
    private final Runnable hard = new Runnable() {
        public void run() {
            finish();
        }
    };

    /**
     * Yalnız uygulama görünürken (kullanıcı dokunuşuyla) çağrılır: ön planda başlatılan konum servisi "kullanırken" izniyle çalışır,
     * ekran kapansa da sürer. startForegroundService değil: konum kapalı ya da izin yoksa servis 5 sn kuralına takılmadan kapanır.
     */
    static void start(Context c) {
        try {
            c.startService(new Intent(c, MotionGpsService.class));
        } catch (Exception e) {
            // başlatılamadı: yürüyüş boy önseliyle sürer
        }
    }

    static void stop(Context c) {
        c.stopService(new Intent(c, MotionGpsService.class));
    }

    @Override
    public int onStartCommand(Intent in, int flags, int startId) {
        if (started) {
            try {
                foreground();
            } catch (Exception e) {
                // zaten ön planda
            }
            return START_NOT_STICKY;
        }
        started = true;
        try {
            foreground();
            lm = (LocationManager) getSystemService(LOCATION_SERVICE);
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 0, this, Looper.getMainLooper());
        } catch (Exception e) {
            stopSelf();
            return START_NOT_STICKY;
        }
        h.postDelayed(hard, HARD_MS);
        return START_NOT_STICKY;
    }

    private void foreground() {
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm != null && nm.getNotificationChannel("nw_motion") == null)
            nm.createNotificationChannel(new NotificationChannel("nw_motion", "Hareket ölçümü", NotificationManager.IMPORTANCE_LOW));
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, "nw_motion") : new Notification.Builder(this);
        Notification n = b.setSmallIcon(android.R.drawable.ic_menu_mylocation).setContentTitle("NeoWell").setContentText("Yürüyüşte adım uzunluğu ölçülüyor (kısa süreli)").setOngoing(true).build();
        if (Build.VERSION.SDK_INT >= 29) startForeground(NOTIF_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
        else startForeground(NOTIF_ID, n);
    }

    @Override
    public void onLocationChanged(Location l) {
        if (finished) return;
        float sa = Build.VERSION.SDK_INT >= 26 && l.hasSpeedAccuracy() ? l.getSpeedAccuracyMetersPerSecond() : -1f;
        if (!l.hasSpeed() || !MotionMath.goodFix(l.getAccuracy(), sa, l.getSpeed())) return;
        long now = SystemClock.elapsedRealtime();
        if (n == 0) {
            tFirst = now;
            StepStore.read(this, false, new StepStore.Callback() {
                public void done(Long steps, Map<String, Long> history) {
                    if (steps != null) stepsStart = steps;
                }
            });
        }
        if (n < speeds.length) speeds[n++] = l.getSpeed();
        tLast = now;
        if (stepsStart >= 0 && now - tFirst >= WINDOW_MS) finish();
    }

    private void finish() {
        if (finished) return;
        finished = true;
        h.removeCallbacks(hard);
        try {
            if (lm != null) lm.removeUpdates(this);
        } catch (Exception e) {
            // zaten kapalı
        }
        // Sinyal pencerenin sonunda kesildiyse (bina, tünel) adım ve hız zamanları uyuşmaz: örnek atılır.
        if (n < 20 || stepsStart < 0 || tLast - tFirst < 30000 || SystemClock.elapsedRealtime() - tLast > 5000) {
            stopSelf();
            return;
        }
        final long span = tLast - tFirst;
        final int cnt = n;
        StepStore.read(this, false, new StepStore.Callback() {
            public void done(Long steps, Map<String, Long> history) {
                try {
                    if (steps != null && steps > stepsStart) apply(cnt, span, steps - stepsStart);
                } finally {
                    stopSelf();
                }
            }
        });
    }

    private void apply(int cnt, long span, long steps) {
        double cad = steps * 60000.0 / span, speed = MotionMath.median(speeds, cnt);
        if (MotionMath.vehicle(speed, cad)) {
            MotionStore.discard(this);
            return;
        }
        if (cad < 50 || cad > 220 || speed < 0.4 || MotionMath.stdev(speeds, cnt) > 0.6) return;
        MotionStore.hint(this, speed);
        MotionMath.Model m = MotionStore.model(this);
        int md = MotionMath.classify(MotionMath.WALK, cad, speed);
        if (MotionMath.addSample(m, md, MotionStore.cm(this), cad, speed * 60.0 / cad)) MotionStore.saveModel(this, m);
    }

    @Override
    public void onDestroy() {
        finished = true;
        h.removeCallbacks(hard);
        try {
            if (lm != null) lm.removeUpdates(this);
        } catch (Exception e) {
            // zaten kapalı
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent i) {
        return null;
    }

    @Override
    public void onStatusChanged(String p, int s, Bundle b) {}

    @Override
    public void onProviderEnabled(String p) {}

    @Override
    public void onProviderDisabled(String p) {}
}
