package com.neowell.app;

import android.app.AlarmManager;
import android.app.KeyguardManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.PowerManager;

/** İlaç dozunda kilitli ekranı yakar: bildirimle aynı anda kısa süre ekranı açan ayrı alarm. Bildirim eklentisi ekranı uyandırmaz. */
public class MedWakeReceiver extends BroadcastReceiver {
    static final int BASE = 7100, MAX = 40;
    private static final String PREFS = "nw_medwake", KEY = "times", WAKE = "com.neowell.app.MED_WAKE";

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (WAKE.equals(a)) {
            wake(c);
            // 40'ı aşan dozlar sıra bekler: biri çalınca pencere kayar, sıradaki doz kurulur.
            arm(c, load(c));
        } else if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a)
            || AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED.equals(a)) arm(c, load(c));
    }

    @SuppressWarnings("deprecation")
    private static void wake(Context c) {
        try {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm == null) return;
            PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, "neowell:medwake");
            wl.acquire(8000);
            KeyguardManager km = (KeyguardManager) c.getSystemService(Context.KEYGUARD_SERVICE);
            // Kilitliyken ya da ekran kapalıyken tam ekran bildirim: üreticiler (Xiaomi) yalnız wake lock'a güvenmez, alarm uygulamaları bunu kullanır.
            if ((km != null && km.isKeyguardLocked()) || !pm.isInteractive()) fullScreen(c);
        } catch (Exception ignored) {
        }
    }

    static final int NID = 7150;
    private static final String CH = "nw_medwake";

    /** Sessiz, kısa ömürlü bildirim: asıl ses ve düğmeler eklentinin ilaç bildiriminde; bu yalnız MainActivity'yi kilit ekranı üstünde açar. */
    @SuppressWarnings("deprecation")
    private static void fullScreen(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CH) == null) {
            NotificationChannel ch = new NotificationChannel(CH, "İlaç alarmı ekranı", NotificationManager.IMPORTANCE_HIGH);
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            nm.createNotificationChannel(ch);
        }
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("nw_medwake", true).putExtra("nw_tk", QuickLogPlugin.secret(c));
        PendingIntent pi = PendingIntent.getActivity(c, NID, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CH) : new Notification.Builder(c).setPriority(Notification.PRIORITY_MAX);
        b.setSmallIcon(c.getApplicationInfo().icon).setContentTitle("İlaç zamanı").setContentText("İlaçlarını görmek için dokun")
            .setCategory(Notification.CATEGORY_ALARM).setVisibility(Notification.VISIBILITY_PUBLIC).setAutoCancel(true)
            .setContentIntent(pi).setFullScreenIntent(pi, true);
        if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(30000);
        nm.notify(NID, b.build());
    }

    /** Ayarlar'daki 'Kilitli ekran testi': gerçek doz alarmlarına dokunmadan ayrı kodla ms sonra aynı yolu çalıştırır. */
    static void test(Context c, long ms) {
        Alarms.setClock(c, System.currentTimeMillis() + ms, pi(c, MAX, PendingIntent.FLAG_UPDATE_CURRENT));
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

    /** Önceki alarmları siler, gelecekteki en yakın MAX dozu kurar; gelecekteki tüm dozları (kurulmayanlar dahil) açılışta ve çalan alarmda yeniden kurmak için saklar. */
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
            if (at <= now + 2000) continue;
            if (n < MAX) {
                Alarms.setClock(c, at, pi(c, n, PendingIntent.FLAG_UPDATE_CURRENT));
                n++;
            }
            if (keep.length() > 0) keep.append(',');
            keep.append(at);
        }
        SharedPreferences.Editor ed = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        ed.putString(KEY, keep.toString()).apply();
    }
}
