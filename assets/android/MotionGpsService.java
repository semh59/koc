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

/**
 * Short GPS window: during a walk the user started by hand, the Doppler speed and the step cadence are measured together to update the stride-length model.
 * No location point is stored. With a good signal it takes about 45 s; for the first good point (leaving home) it waits at most 10 minutes.
 */
public class MotionGpsService extends Service implements LocationListener {
    private static final int NOTIF_ID = 7101, MAX_FIXES = 400, MIN_FIXES = 20;
    private static final long WINDOW_MS = 45000, HARD_MS = 600000, MIN_SPAN_MS = 30000, MAX_SIGNAL_GAP_MS = 5000;
    private static final double MIN_SPEED = 0.4, MAX_SPEED_SPREAD = 0.6;

    private final Handler h = new Handler(Looper.getMainLooper());
    private LocationManager lm;
    private boolean finished, started;
    private final double[] speeds = new double[MAX_FIXES];
    private int n;
    private long tFirst, tLast;
    private long stepsStart = -1;
    private final Runnable hard = this::finish;

    /**
     * Called only while the app is visible (on a user tap): a location service started in the foreground runs under the "while in use" permission
     * and keeps going when the screen turns off. startForegroundService is not used: if location is off or the permission is missing, the service stops without hitting the 5-second foreground rule.
     */
    static void start(Context c) {
        try {
            c.startService(new Intent(c, MotionGpsService.class));
        } catch (Exception e) {
            // could not start: the walk continues with the height-based stride
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
                // already in the foreground
            }
            return START_NOT_STICKY;
        }
        started = true;
        try {
            foreground();
            lm = getSystemService(LocationManager.class);
            lm.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000, 0, this, Looper.getMainLooper());
        } catch (Exception e) {
            stopSelf();
            return START_NOT_STICKY;
        }
        h.postDelayed(hard, HARD_MS);
        return START_NOT_STICKY;
    }

    private void foreground() {
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel("nw_motion") == null)
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
            StepStore.read(this, false, (steps, history) -> {
                // Without a counter reading the window would never close: close it safely (finish stops the service because stepsStart < 0).
                if (steps != null) stepsStart = steps;
                else finish();
            });
        }
        if (n < speeds.length) speeds[n++] = l.getSpeed();
        tLast = now;
        if (stepsStart >= 0 && now - tFirst >= WINDOW_MS) finish();
    }

    private void stopUpdates() {
        finished = true;
        h.removeCallbacks(hard);
        try {
            if (lm != null) lm.removeUpdates(this);
        } catch (Exception e) {
            // already stopped
        }
    }

    private void finish() {
        if (finished) return;
        stopUpdates();
        // If the signal was lost at the end of the window (building, tunnel), step and speed times do not match: the sample is dropped.
        if (n < MIN_FIXES || stepsStart < 0 || tLast - tFirst < MIN_SPAN_MS || SystemClock.elapsedRealtime() - tLast > MAX_SIGNAL_GAP_MS) {
            stopSelf();
            return;
        }
        final long span = tLast - tFirst;
        final int cnt = n;
        StepStore.read(this, false, (steps, history) -> {
            try {
                if (steps != null && steps > stepsStart) apply(cnt, span, steps - stepsStart);
            } finally {
                stopSelf();
            }
        });
    }

    private void apply(int cnt, long span, long steps) {
        double cad = steps * 60000.0 / span, speed = MotionMath.median(speeds, cnt);
        if (MotionMath.vehicle(speed, cad)) {
            MotionStore.discard(this);
            return;
        }
        if (cad < MotionMath.MIN_CADENCE || cad > MotionMath.MAX_CADENCE || speed < MIN_SPEED || MotionMath.stdev(speeds, cnt) > MAX_SPEED_SPREAD) return;
        MotionStore.hint(this, speed);
        MotionMath.Model m = MotionStore.model(this);
        int md = MotionMath.classify(MotionMath.WALK, cad, speed);
        if (MotionMath.addSample(m, md, MotionStore.cm(this), cad, speed * 60.0 / cad)) MotionStore.saveModel(this, m);
    }

    @Override
    public void onDestroy() {
        stopUpdates();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent i) {
        return null;
    }

    // Empty on purpose: before Android 11 these LocationListener callbacks are abstract and must be implemented.
    @Override
    public void onStatusChanged(String p, int s, Bundle b) {}

    @Override
    public void onProviderEnabled(String p) {}

    @Override
    public void onProviderDisabled(String p) {}
}
