package com.neowell.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.util.Calendar;
import java.util.Map;

/** Her gece yarısı ve telefon açılışında sayacı kaydeder, sonraki gece alarmını kurar. */
public class StepSnapshotReceiver extends BroadcastReceiver {
    static void schedule(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        Calendar t = Calendar.getInstance();
        t.add(Calendar.DAY_OF_YEAR, 1);
        t.set(Calendar.HOUR_OF_DAY, 0);
        t.set(Calendar.MINUTE, 0);
        t.set(Calendar.SECOND, 20);
        PendingIntent pi = PendingIntent.getBroadcast(c, 7001, new Intent(c, StepSnapshotReceiver.class),
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        try {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t.getTimeInMillis(), pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t.getTimeInMillis(), pi);
        }
    }

    @Override
    public void onReceive(final Context c, Intent i) {
        final PendingResult pr = goAsync();
        schedule(c);
        StepStore.read(c, true, new StepStore.Callback() {
            public void done(Long steps, Map<String, Long> history) {
                pr.finish();
            }
        });
    }
}
