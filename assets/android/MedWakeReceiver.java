package com.neowell.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PowerManager;

/** İlaç dozunda kilitli ekranı yakar: bildirimle aynı anda kısa süre ekranı açan ayrı alarm. Bildirim eklentisi ekranı uyandırmaz. */
public class MedWakeReceiver extends BroadcastReceiver {
    static final int BASE = 7100, MAX = 40;
    private static final String PREFS = "nw_medwake", KEY = "times", WAKE = "com.neowell.app.MED_WAKE";

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (WAKE.equals(a)) wake(c);
        else if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a) || AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED.equals(a)) arm(c, load(c));
    }

    @SuppressWarnings("deprecation")
    private static void wake(Context c) {
        try {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm == null) return;
            PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, "neowell:medwake");
            wl.acquire(8000);
        } catch (Exception ignored) {
        }
    }

    private static PendingIntent pi(Context c, int n, int flags) {
        Intent i = new Intent(c, MedWakeReceiver.class).setAction(WAKE);
        return PendingIntent.getBroadcast(c, BASE + n, i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    private static long[] load(Context c) {
        String s = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "");
        if (s.isEmpty()) return new long[0];
        String[] p = s.split(",");
        long[] t = new long[p.length];
        for (int k = 0; k < p.length; k++) {
            try { t[k] = Long.parseLong(p[k]); } catch (NumberFormatException e) { t[k] = 0; }
        }
        return t;
    }

    /** Önceki alarmları siler, gelecekteki en yakın MAX dozu kurar ve yeniden başlatma için saklar. */
    static void arm(Context c, long[] times) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        for (int n = 0; n < MAX; n++) {
            PendingIntent old = pi(c, n, PendingIntent.FLAG_NO_CREATE);
            if (old != null) am.cancel(old);
        }
        long now = System.currentTimeMillis();
        long[] t = java.util.Arrays.copyOf(times, times.length);
        java.util.Arrays.sort(t);
        StringBuilder keep = new StringBuilder();
        int n = 0;
        for (long at : t) {
            if (at <= now + 2000 || n >= MAX) continue;
            PendingIntent p = pi(c, n, PendingIntent.FLAG_UPDATE_CURRENT);
            Alarms.set(c, at, p);
            if (keep.length() > 0) keep.append(',');
            keep.append(at);
            n++;
        }
        SharedPreferences.Editor ed = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        ed.putString(KEY, keep.toString()).apply();
    }
}
