package com.neowell.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.os.Build;

/** Uyandıran alarm: tam alarm izni varsa tam saatte, yoksa Doze'da dakikalarca gecikebilen yaklaşık saatte kurulur. */
final class Alarms {
    static void set(Context c, long at, PendingIntent pi) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        try {
            if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    /** Tam saat gerekmeyen alarm (hareket kontrol noktası): Play tam alarmı yalnız ilaç hatırlatması gibi çekirdek işlev için kabul eder. */
    static void setInexact(Context c, long at, PendingIntent pi) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
    }
}
