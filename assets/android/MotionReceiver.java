package com.neowell.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
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
import java.util.TimeZone;

/** Etkinlik tanıma geçişleri (yürüme/koşma başladı-bitti): aralığı açar/kapatır. GPS açmaz: arka planda konum kullanılmaz. Açılışta kaydı yeniler. */
public class MotionReceiver extends BroadcastReceiver {
    static final String ACTION = "com.neowell.app.MOTION", TICK = "com.neowell.app.MOTION_TICK";
    private static final long TICK_MS = 150000, ROLL_MS = 3L * 3600 * 1000, STALE_MS = 30L * 60000;
    /** Geçiş bildirimi bu kadar gecikmeden geldiyse olay zamanı kullanılır, daha geçse adım sayacıyla tutarlı olması için şimdiki zaman. */
    private static final long MAX_DELAY_MS = 90000;

    static PendingIntent intent(Context c) {
        Intent i = new Intent(c, MotionReceiver.class).setAction(ACTION);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        return PendingIntent.getBroadcast(c, 7001, i, fl);
    }

    private static PendingIntent tickIntent(Context c) {
        Intent i = new Intent(c, MotionReceiver.class).setAction(TICK);
        return PendingIntent.getBroadcast(c, 7002, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Açık aralık sürerken her ~2,5 dk adım sayacından kontrol noktası alınır: ritim düşüşü (yorulma) ve değişimi mesafe ve kaloriye böyle yansır. */
    private static void scheduleTick(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, System.currentTimeMillis() + TICK_MS, tickIntent(c));
    }

    static void cancelTick(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(tickIntent(c));
    }

    private static void tick(Context c, long steps) {
        if (!MotionStore.isOpen(c)) return;
        long now = StepStore.sampledAt();
        // Gece sayaç sıfırlanır ve kayıt 4 saati aşamaz: gün dönünce ya da 3 saatte bir aralık bu noktada kapatılıp yeniden açılır.
        // Geçersiz 3 saatlik parça çıkış olayının kaçtığını gösterir: yeniden açılmaz, alarm durur.
        boolean newDay = MotionStore.dayOf(now) != MotionStore.dayOf(MotionStore.lastActivityAt(c));
        if (newDay || now - MotionStore.openedAt(c) >= ROLL_MS) {
            int mode = MotionStore.openMode(c);
            if (MotionStore.close(c, now, steps) == 0 && !newDay) return;
            MotionStore.open(c, mode, now, steps);
            scheduleTick(c);
            return;
        }
        MotionStore.addCp(c, now, steps);
        scheduleTick(c);
    }

    /** Geçiş kaydı: yürüme ve koşma giriş/çıkış, diğer türlerde yalnızca giriş (açık aralığı kapatmak için). */
    static com.google.android.gms.tasks.Task<Void> register(Context c) {
        List<ActivityTransition> l = new ArrayList<>();
        int[] foot = {DetectedActivity.WALKING, DetectedActivity.RUNNING};
        int[] other = {DetectedActivity.STILL, DetectedActivity.IN_VEHICLE, DetectedActivity.ON_BICYCLE};
        for (int t : foot) {
            l.add(new ActivityTransition.Builder().setActivityType(t).setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER).build());
            l.add(new ActivityTransition.Builder().setActivityType(t).setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT).build());
        }
        for (int t : other) l.add(new ActivityTransition.Builder().setActivityType(t).setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER).build());
        return ActivityRecognition.getClient(c).requestActivityTransitionUpdates(new ActivityTransitionRequest(l), intent(c));
    }

    static void unregister(Context c) {
        ActivityRecognition.getClient(c).removeActivityTransitionUpdates(intent(c));
    }

    @Override
    public void onReceive(final Context c, Intent in) {
        String a = in.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) {
            // Yeniden başlatmada adım sayacı sıfırlanır, güncellemede alarmlar silinir: açık aralık güvenilmez, atılır.
            MotionStore.discard(c);
            if (MotionStore.enabled(c)) register(c);
            return;
        }
        if (TICK.equals(a)) {
            if (!MotionStore.enabled(c) || !MotionStore.isOpen(c)) return;
            final PendingResult tr = goAsync();
            StepStore.read(c.getApplicationContext(), false, new StepStore.Callback() {
                public void done(Long steps, Map<String, Long> history) {
                    try {
                        if (steps != null) tick(c.getApplicationContext(), steps);
                        else scheduleTick(c.getApplicationContext());
                    } finally {
                        tr.finish();
                    }
                }
            });
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
                    if (steps != null) for (ActivityTransitionEvent e : ev) handle(app, e, steps, StepStore.sampledAt(), nowWall, nowEl);
                } finally {
                    pr.finish();
                }
            }
        });
    }

    private static void handle(Context c, ActivityTransitionEvent e, long steps, long at, long nowWall, long nowEl) {
        long delay = Math.max(0, (nowEl - e.getElapsedRealTimeNanos()) / 1000000L);
        long t = delay <= MAX_DELAY_MS ? nowWall - delay : nowWall;
        // Sayaç okuması 4 sn'ye kadar sürer; olay ile okuma gece yarısının iki yanındaysa zaman sayacın gününe çekilir.
        TimeZone z = TimeZone.getDefault();
        t = MotionMath.onCounterDay(t, z.getOffset(t), at, z.getOffset(at));
        int type = e.getActivityType();
        boolean enter = e.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER;
        boolean foot = type == DetectedActivity.WALKING || type == DetectedActivity.RUNNING;
        int mode = type == DetectedActivity.RUNNING ? MotionMath.RUN : MotionMath.WALK;
        // Kontrol noktası 30 dk'dır gelmediyse çıkış olayı ya da alarm kaçmıştır: eski aralık atılıp yenisi açılır.
        if (MotionStore.isOpen(c) && nowWall - MotionStore.lastActivityAt(c) > STALE_MS) {
            cancelTick(c);
            MotionStore.discard(c);
        }
        if (MotionStore.isOpen(c) && (!enter && foot && mode == MotionStore.openMode(c) || enter && !(foot && mode == MotionStore.openMode(c)))) {
            cancelTick(c);
            MotionStore.close(c, t, steps);
        }
        if (enter && foot && !MotionStore.isOpen(c)) {
            MotionStore.open(c, mode, t, steps);
            scheduleTick(c);
        }
    }

}
