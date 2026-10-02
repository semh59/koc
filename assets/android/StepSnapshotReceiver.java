package com.neowell.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.util.Calendar;
import java.util.Map;

/** Her gece yarısı, 23:58'de ve telefon açılışında sayacı kaydeder, sonraki alarmları kurar. */
public class StepSnapshotReceiver extends BroadcastReceiver {
    static void schedule(Context c) {
        Calendar t = Calendar.getInstance();
        t.add(Calendar.DAY_OF_YEAR, 1);
        t.set(Calendar.HOUR_OF_DAY, 0);
        t.set(Calendar.MINUTE, 0);
        t.set(Calendar.SECOND, 20);
        set(c, 7001, t.getTimeInMillis());
        // Gece alarmı Doze'da gecikirse akşam adımları için gün toplamı bu örnekten alınır (StepMath.SAMPLE_MINUTES).
        Calendar s = Calendar.getInstance();
        s.set(Calendar.HOUR_OF_DAY, 23);
        s.set(Calendar.MINUTE, 58);
        s.set(Calendar.SECOND, 0);
        s.set(Calendar.MILLISECOND, 0);
        if (s.getTimeInMillis() <= System.currentTimeMillis()) s.add(Calendar.DAY_OF_YEAR, 1);
        set(c, 7003, s.getTimeInMillis());
    }

    private static void set(Context c, int code, long at) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = PendingIntent.getBroadcast(c, code, new Intent(c, StepSnapshotReceiver.class),
            PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        try {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    @Override
    public void onReceive(final Context c, Intent i) {
        final PendingResult pr = goAsync();
        schedule(c);
        // Açılışta sayaç sıfırlanmıştır, gün kapatması yalnızca alarmda yapılır. 23:58 alarmı aynı günde kapatma yapmaz (closeDay false);
        // gece yarısından sonraya kaydıysa gece alarmı gibi davranır.
        boolean boot = Intent.ACTION_BOOT_COMPLETED.equals(i.getAction());
        StepStore.read(c, !boot, new StepStore.Callback() {
            public void done(Long steps, Map<String, Long> history) {
                // Gece yarısı widget dünkü su/kaloriyi bugünmüş gibi göstermesin (updatePeriodMillis 30 dk ve MIUI'de gecikir).
                NeoWidget.refresh(c);
                pr.finish();
            }
        });
    }
}
