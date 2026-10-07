package com.neowell.app;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.util.Calendar;
import java.util.Map;

/** Her gece yarısı, 23:58'de ve telefon açılışında sayacı kaydeder; açılış, güncelleme, saat/tarih/saat dilimi değişimi ve tam alarm izni değişiminde alarmları yeniden kurar. */
public class StepSnapshotReceiver extends BroadcastReceiver {
    static void schedule(Context c) {
        Calendar t = Calendar.getInstance();
        t.add(Calendar.DAY_OF_YEAR, 1);
        t.set(Calendar.HOUR_OF_DAY, 0);
        t.set(Calendar.MINUTE, 0);
        t.set(Calendar.SECOND, 20);
        Alarms.setInexact(c, t.getTimeInMillis(), pi(c, 7001));
        // Gece alarmı Doze'da gecikirse akşam adımları için gün toplamı bu örnekten alınır (StepMath.SAMPLE_MINUTES).
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
        // Alarmın kendi intent'inin eylemi yoktur. Diğer eylemlerde (güncelleme, saat/tarih değişimi, izin) gün kapatılmaz; yalnız widget tazelenir.
        String a = i.getAction();
        if (a != null && !Intent.ACTION_BOOT_COMPLETED.equals(a)) {
            NeoWidget.refresh(c);
            return;
        }
        // Açılışta sayaç sıfırlanmıştır, gün kapatması yalnızca alarmda yapılır. 23:58 alarmı aynı günde kapatma yapmaz (closeDay false);
        // gece yarısından sonraya kaydıysa gece alarmı gibi davranır.
        final PendingResult pr = goAsync();
        StepStore.read(c, a == null, new StepStore.Callback() {
            public void done(Long steps, Map<String, Long> history) {
                try {
                    // Gece yarısı widget dünkü su/kaloriyi bugünmüş gibi göstermesin (updatePeriodMillis 30 dk ve MIUI'de gecikir).
                    NeoWidget.refresh(c);
                } finally {
                    pr.finish();
                }
            }
        });
    }
}
