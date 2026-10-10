package com.neowell.app;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.util.Calendar;

/** Records the counter after midnight, at 23:58 and at boot; sets the alarms again after boot, app update and clock, date or time-zone changes. */
public class StepSnapshotReceiver extends BroadcastReceiver {
    static void schedule(Context c) {
        Calendar t = Calendar.getInstance();
        t.add(Calendar.DAY_OF_YEAR, 1);
        t.set(Calendar.HOUR_OF_DAY, 0);
        t.set(Calendar.MINUTE, 0);
        t.set(Calendar.SECOND, 20);
        Alarms.setInexact(c, t.getTimeInMillis(), pi(c, 7001));
        // If Doze delays the night alarm, the evening steps take the day total from this sample (StepMath.SAMPLE_MINUTES).
        Calendar s = Calendar.getInstance();
        s.set(Calendar.HOUR_OF_DAY, 23);
        s.set(Calendar.MINUTE, 58);
        s.set(Calendar.SECOND, 0);
        s.set(Calendar.MILLISECOND, 0);
        if (s.getTimeInMillis() <= System.currentTimeMillis()) s.add(Calendar.DAY_OF_YEAR, 1);
        Alarms.setInexact(c, s.getTimeInMillis(), pi(c, 7003));
    }

    private static PendingIntent pi(Context c, int code) {
        return PendingIntent.getBroadcast(c, code, new Intent(c, StepSnapshotReceiver.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    @Override
    public void onReceive(final Context c, Intent i) {
        schedule(c);
        // The alarm's own intent has no action. On other actions (update, clock or date change) the day is not closed; only the widget is refreshed.
        String a = i.getAction();
        if (a != null && !Intent.ACTION_BOOT_COMPLETED.equals(a)) {
            NeoWidget.refresh(c);
            return;
        }
        // At boot the counter has been reset and days are closed only by the alarm. The 23:58 alarm closes nothing on the same day (closeDay returns false);
        // if it slipped past midnight it acts like the night alarm.
        final PendingResult pr = goAsync();
        StepStore.read(c, a == null, (steps, history) -> {
            try {
                // At midnight the widget must not show yesterday's water and calories as today's (updatePeriodMillis is 30 minutes and runs late on MIUI).
                NeoWidget.refresh(c);
            } finally {
                pr.finish();
            }
        });
    }
}
