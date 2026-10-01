package com.neowell.app;

import android.Manifest;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.SystemClock;
import com.google.android.gms.location.ActivityRecognition;
import com.google.android.gms.location.ActivityTransition;
import com.google.android.gms.location.ActivityTransitionEvent;
import com.google.android.gms.location.ActivityTransitionRequest;
import com.google.android.gms.location.ActivityTransitionResult;
import com.google.android.gms.location.DetectedActivity;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Etkinlik tanıma geçişleri (yürüme/koşma başladı-bitti): aralığı açar/kapatır, gerekirse kısa GPS penceresi başlatır. Açılışta kaydı yeniler. */
public class MotionReceiver extends BroadcastReceiver {
    static final String ACTION = "com.neowell.app.MOTION";
    /** Geçiş bildirimi bu kadar gecikmeden geldiyse olay zamanı kullanılır, daha geçse adım sayacıyla tutarlı olması için şimdiki zaman. */
    private static final long MAX_DELAY_MS = 90000;

    static PendingIntent intent(Context c) {
        Intent i = new Intent(c, MotionReceiver.class).setAction(ACTION);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        return PendingIntent.getBroadcast(c, 7001, i, fl);
    }

    /** Geçiş kaydı: yürüme ve koşma giriş/çıkış, diğer türlerde yalnızca giriş (açık aralığı kapatmak için). */
    static void register(Context c) {
        List<ActivityTransition> l = new ArrayList<>();
        int[] foot = {DetectedActivity.WALKING, DetectedActivity.RUNNING};
        int[] other = {DetectedActivity.STILL, DetectedActivity.IN_VEHICLE, DetectedActivity.ON_BICYCLE};
        for (int t : foot) {
            l.add(new ActivityTransition.Builder().setActivityType(t).setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER).build());
            l.add(new ActivityTransition.Builder().setActivityType(t).setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT).build());
        }
        for (int t : other) l.add(new ActivityTransition.Builder().setActivityType(t).setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER).build());
        ActivityRecognition.getClient(c).requestActivityTransitionUpdates(new ActivityTransitionRequest(l), intent(c));
    }

    static void unregister(Context c) {
        ActivityRecognition.getClient(c).removeActivityTransitionUpdates(intent(c));
    }

    @Override
    public void onReceive(final Context c, Intent in) {
        String a = in.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) {
            if (MotionStore.enabled(c)) register(c);
            return;
        }
        if (!MotionStore.enabled(c) || !ActivityTransitionResult.hasResult(in)) return;
        ActivityTransitionResult r = ActivityTransitionResult.extractResult(in);
        if (r == null) return;
        final List<ActivityTransitionEvent> ev = r.getTransitionEvents();
        final long nowWall = System.currentTimeMillis(), nowEl = SystemClock.elapsedRealtimeNanos();
        final PendingResult pr = goAsync();
        final Context app = c.getApplicationContext();
        StepStore.read(app, false, new StepStore.Callback() {
            public void done(Long steps, Map<String, Long> history) {
                try {
                    if (steps != null) for (ActivityTransitionEvent e : ev) handle(app, e, steps, nowWall, nowEl);
                } finally {
                    pr.finish();
                }
            }
        });
    }

    private static void handle(Context c, ActivityTransitionEvent e, long steps, long nowWall, long nowEl) {
        long delay = Math.max(0, (nowEl - e.getElapsedRealTimeNanos()) / 1000000L);
        long t = delay <= MAX_DELAY_MS ? nowWall - delay : nowWall;
        int type = e.getActivityType();
        boolean enter = e.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER;
        boolean foot = type == DetectedActivity.WALKING || type == DetectedActivity.RUNNING;
        int mode = type == DetectedActivity.RUNNING ? MotionMath.RUN : MotionMath.WALK;
        if (MotionStore.isOpen(c) && (!enter && foot && mode == MotionStore.openMode(c) || enter && !(foot && mode == MotionStore.openMode(c)))) {
            MotionGpsService.stop(c);
            MotionStore.close(c, t, steps);
        }
        if (enter && foot && !MotionStore.isOpen(c)) {
            MotionStore.open(c, mode, t, steps);
            if (canGps(c) && MotionMath.gpsWanted(MotionStore.model(c), mode, Double.NaN, MotionStore.dayNum(), MotionStore.gpsToday(c), MotionGpsService.battery(c), MotionGpsService.powerSave(c))) MotionGpsService.start(c, mode);
        }
    }

    /** Konum ön plan servisini arka plandan başlatmak "Her zaman izin ver" konum izni ister. */
    static boolean canGps(Context c) {
        if (c.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) return false;
        return Build.VERSION.SDK_INT < 29 || c.checkSelfPermission(Manifest.permission.ACCESS_BACKGROUND_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }
}
