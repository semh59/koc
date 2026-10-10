package com.neowell.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Alarm scheduling shared by the step, motion and medication receivers. */
final class Alarms {
    static AlarmManager manager(Context c) {
        return c.getSystemService(AlarmManager.class);
    }

    /** Exact wake-up alarm when the exact-alarm permission is granted (also in Doze), otherwise inexact: Doze can delay it by minutes. */
    private static void set(Context c, long at, PendingIntent pi) {
        AlarmManager am = manager(c);
        try {
            if (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms()) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    /** Alarm-clock alarm: fires on time in Doze and may open an activity from the background (medication screen wake-up). Falls back to {@link #set} when the system refuses it. */
    static void setClock(Context c, long at, PendingIntent pi) {
        PendingIntent show = PendingIntent.getActivity(c, 0, new Intent(c, MainActivity.class), PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        try {
            manager(c).setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), pi);
        } catch (SecurityException e) {
            set(c, at, pi);
        }
    }

    /** Alarm that does not need the exact minute (motion checkpoint, step snapshots): Play accepts exact alarms only for core features such as medication reminders. */
    static void setInexact(Context c, long at, PendingIntent pi) {
        manager(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
    }
}
