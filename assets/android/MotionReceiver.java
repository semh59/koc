package com.neowell.app;

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
import com.google.android.gms.tasks.Task;
import java.util.ArrayList;
import java.util.List;
import java.util.TimeZone;

/** Activity-recognition transitions (walking/running started or ended): opens and closes the interval. It never starts GPS, since no location is used in the background. Re-registers after boot. */
public class MotionReceiver extends BroadcastReceiver {
    private static final String ACTION = "com.neowell.app.MOTION", TICK = "com.neowell.app.MOTION_TICK";
    private static final long TICK_MS = 150000, ROLL_MS = 3L * 3600 * 1000, STALE_MS = 30L * 60000;
    /** A transition notification that arrives with at most this delay uses the event time; a later one uses the current time so it stays consistent with the step counter. */
    private static final long MAX_DELAY_MS = 90000;

    /** Activity recognition fills the result into the intent, so the PendingIntent must be mutable from Android 12. */
    private static PendingIntent intent(Context c) {
        Intent i = new Intent(c, MotionReceiver.class).setAction(ACTION);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
        return PendingIntent.getBroadcast(c, 7001, i, fl);
    }

    private static PendingIntent tickIntent(Context c) {
        Intent i = new Intent(c, MotionReceiver.class).setAction(TICK);
        return PendingIntent.getBroadcast(c, 7002, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** While an interval is open, a checkpoint is taken from the step counter every ~2.5 minutes: a drop in cadence (fatigue) or a change of pace shows in the distance and calories that way. */
    private static void scheduleTick(Context c) {
        Alarms.setInexact(c, System.currentTimeMillis() + TICK_MS, tickIntent(c));
    }

    static void cancelTick(Context c) {
        Alarms.manager(c).cancel(tickIntent(c));
    }

    private static void tick(Context c, long steps) {
        if (!MotionStore.isOpen(c)) return;
        long now = StepStore.sampledAt();
        closeDeferred(c, steps);
        if (!MotionStore.isOpen(c)) return;
        // The counter resets at night and a record cannot exceed 4 hours: at a day change, and every 3 hours, the interval is closed here and reopened.
        // A 3-hour part that turns out invalid means the exit event was missed: it is not reopened and the alarm stops.
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

    /** An exit event whose counter read failed: the interval stayed open, and the close time is applied with the current successful read. */
    private static void closeDeferred(Context c, long steps) {
        long t = MotionStore.takeDeferredClose(c);
        if (t > 0 && MotionStore.isOpen(c)) {
            cancelTick(c);
            MotionStore.close(c, t, steps);
        }
    }

    private static boolean foot(int type) {
        return type == DetectedActivity.WALKING || type == DetectedActivity.RUNNING;
    }

    private static int modeOf(int type) {
        return type == DetectedActivity.RUNNING ? MotionMath.RUN : MotionMath.WALK;
    }

    /** Whether the event closes the open interval: an exit of the same type or an entry of another type. */
    private static boolean closes(Context c, int type, boolean enter) {
        boolean same = foot(type) && modeOf(type) == MotionStore.openMode(c);
        return MotionStore.isOpen(c) && (!enter && same || enter && !same);
    }

    private static long eventTime(ActivityTransitionEvent e, long nowWall, long nowEl) {
        long delay = Math.max(0, (nowEl - e.getElapsedRealTimeNanos()) / 1000000L);
        return delay <= MAX_DELAY_MS ? nowWall - delay : nowWall;
    }

    /** Transition registration: enter and exit for walking and running, only enter for the other types (to close an open interval). */
    static Task<Void> register(Context c) {
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
            // The step counter resets at boot and an update deletes the alarms: an open interval is not trustworthy and is dropped.
            MotionStore.discard(c);
            if (MotionStore.enabled(c)) register(c);
            return;
        }
        final Context app = c.getApplicationContext();
        if (TICK.equals(a)) {
            if (!MotionStore.enabled(c) || !MotionStore.isOpen(c)) return;
            final PendingResult tr = goAsync();
            StepStore.read(app, false, (steps, history) -> {
                try {
                    if (steps != null) tick(app, steps);
                    else scheduleTick(app);
                } finally {
                    tr.finish();
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
        StepStore.read(app, false, (steps, history) -> {
            try {
                if (steps != null) {
                    closeDeferred(app, steps);
                    for (ActivityTransitionEvent e : ev) handle(app, e, steps, StepStore.sampledAt(), nowWall, nowEl);
                } else {
                    for (ActivityTransitionEvent e : ev) {
                        if (closes(app, e.getActivityType(), e.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER)) {
                            MotionStore.deferClose(app, eventTime(e, nowWall, nowEl));
                            break;
                        }
                    }
                }
            } finally {
                pr.finish();
            }
        });
    }

    private static void handle(Context c, ActivityTransitionEvent e, long steps, long at, long nowWall, long nowEl) {
        long t = eventTime(e, nowWall, nowEl);
        // The counter read takes up to 4 s; if the event and the read lie on either side of midnight, the time is moved to the counter's day.
        TimeZone z = TimeZone.getDefault();
        t = MotionMath.onCounterDay(t, z.getOffset(t), at, z.getOffset(at));
        int type = e.getActivityType();
        boolean enter = e.getTransitionType() == ActivityTransition.ACTIVITY_TRANSITION_ENTER;
        int mode = modeOf(type);
        // No checkpoint for 30 minutes means an exit event or the alarm was missed: the old interval is dropped and a new one opened.
        if (MotionStore.isOpen(c) && nowWall - MotionStore.lastActivityAt(c) > STALE_MS) {
            cancelTick(c);
            MotionStore.discard(c);
        }
        if (closes(c, type, enter)) {
            cancelTick(c);
            MotionStore.close(c, t, steps);
        }
        if (enter && foot(type) && !MotionStore.isOpen(c)) {
            MotionStore.open(c, mode, t, steps);
            scheduleTick(c);
        }
    }
}
