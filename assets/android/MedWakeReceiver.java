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
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** İlaç dozunda kilitli ekranı yakar: bildirimle aynı anda kısa süre ekranı açan ayrı alarm. Bildirim eklentisi ekranı uyandırmaz. */
public class MedWakeReceiver extends BroadcastReceiver {
    static final int BASE = 7100, MAX = 40, LOG_MAX = 20;
    private static final String PREFS = "nw_medwake", KEY = "times", LOG = "log", TEST = "test", WAKE = "com.neowell.app.MED_WAKE";

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (WAKE.equals(a)) {
            wake(c);
            // 40'ı aşan dozlar sıra bekler: biri çalınca pencere kayar, sıradaki doz kurulur.
            arm(c, load(c), "AFTER");
        } else if (Intent.ACTION_BOOT_COMPLETED.equals(a) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(a) || Intent.ACTION_TIME_CHANGED.equals(a) || Intent.ACTION_TIMEZONE_CHANGED.equals(a)
            || AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED.equals(a)) arm(c, load(c), cause(a));
    }

    private static String cause(String a) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(a)) return "BOOT";
        if (Intent.ACTION_MY_PACKAGE_REPLACED.equals(a)) return "UPDATE";
        if (Intent.ACTION_TIME_CHANGED.equals(a)) return "TIME";
        if (Intent.ACTION_TIMEZONE_CHANGED.equals(a)) return "TZ";
        return "EXACT";
    }

    @SuppressWarnings("deprecation")
    private static void wake(Context c) {
        // Durum wake lock'tan önce okunur: ACQUIRE_CAUSES_WAKEUP ekranı açarsa isInteractive sonradan true döner.
        JSONObject e = state(c, "WAKE");
        long now = System.currentTimeMillis(), test = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getLong(TEST, 0), at = planned(load(c), test, now);
        put(e, "p", at);
        if (at != 0 && at == test) put(e, "k", "T");
        try {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            if (pm == null) {
                put(e, "err", "PowerManager yok");
                return;
            }
            KeyguardManager km = (KeyguardManager) c.getSystemService(Context.KEYGUARD_SERVICE);
            boolean locked = km != null && km.isKeyguardLocked(), dark = !pm.isInteractive();
            PowerManager.WakeLock wl = pm.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, "neowell:medwake");
            wl.acquire(20000);
            put(e, "wl", wl.isHeld());
            // Kilitliyken ya da ekran kapalıyken tam ekran bildirim: üreticiler (Xiaomi) yalnız wake lock'a güvenmez, alarm uygulamaları bunu kullanır.
            put(e, "fs", locked || dark ? fullScreen(c) : "skip");
        } catch (Exception x) {
            put(e, "err", String.valueOf(x));
        } finally {
            record(c, e);
        }
    }

    /** Çalan alarmın planlanan zamanı: şimdiye kadar gelmiş en geç kayıtlı doz ya da test (erken çalma payı 5 sn). */
    static long planned(long[] times, long test, long now) {
        long best = test <= now + 5000 ? test : 0;
        for (long t : times) if (t <= now + 5000 && t > best) best = t;
        return best;
    }

    static final int NID = 7150;
    // Kullanıcı ya da üretici eski kanalın önemini düşürmüş olabilir; aynı kimlikle silip açmak eski ayarları geri getirir, bu yüzden yeni kimlik.
    static final String CH = "nw_medwake2";
    private static final String OLD_CH = "nw_medwake";

    static void channel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (nm.getNotificationChannel(OLD_CH) != null) nm.deleteNotificationChannel(OLD_CH);
        if (nm.getNotificationChannel(CH) != null) return;
        NotificationChannel ch = new NotificationChannel(CH, "İlaç alarmı ekranı", NotificationManager.IMPORTANCE_HIGH);
        ch.setSound(null, null);
        ch.enableVibration(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    /** Sessiz, kısa ömürlü bildirim: asıl ses ve düğmeler eklentinin ilaç bildiriminde; bu yalnız MainActivity'yi kilit ekranı üstünde açar. Döner: "ok" ya da hata. */
    @SuppressWarnings("deprecation")
    private static String fullScreen(Context c) {
        try {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return "err:NotificationManager yok";
            channel(c);
            Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("nw_medwake", true).putExtra("nw_tk", QuickLogPlugin.secret(c));
            PendingIntent pi = PendingIntent.getActivity(c, NID, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CH) : new Notification.Builder(c).setPriority(Notification.PRIORITY_MAX);
            b.setSmallIcon(c.getApplicationInfo().icon).setContentTitle("İlaç zamanı").setContentText("İlaçlarını görmek için dokun")
                .setCategory(Notification.CATEGORY_ALARM).setVisibility(Notification.VISIBILITY_PUBLIC).setAutoCancel(true).setOnlyAlertOnce(false)
                .setContentIntent(pi).setFullScreenIntent(pi, true);
            if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(30000);
            nm.notify(NID, b.build());
            return "ok";
        } catch (Exception x) {
            return "err:" + x;
        }
    }

    /** Ayarlar'daki 'Kilitli ekran testi' ve 'Gerçek doz testi': gerçek doz alarmlarına dokunmadan ayrı kodla ms sonra aynı yolu çalıştırır. */
    static void test(Context c, long ms) {
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putLong(TEST, System.currentTimeMillis() + ms).commit();
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
    static void arm(Context c, long[] times, String why) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        channel(c);
        for (int n = 0; n < MAX; n++) {
            PendingIntent old = pi(c, n, PendingIntent.FLAG_NO_CREATE);
            if (old != null) am.cancel(old);
        }
        long now = System.currentTimeMillis();
        long[] t = java.util.Arrays.copyOf(times, times.length);
        java.util.Arrays.sort(t);
        StringBuilder keep = new StringBuilder();
        JSONArray first = new JSONArray();
        int n = 0;
        for (long at : t) {
            if (at <= now + 2000) continue;
            if (n < MAX) {
                Alarms.setClock(c, at, pi(c, n, PendingIntent.FLAG_UPDATE_CURRENT));
                if (first.length() < 3) first.put(at);
                n++;
            }
            if (keep.length() > 0) keep.append(',');
            keep.append(at);
        }
        SharedPreferences.Editor ed = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit();
        ed.putString(KEY, keep.toString()).apply();
        JSONObject e = new JSONObject();
        put(e, "t", now);
        put(e, "a", why);
        put(e, "in", times.length);
        put(e, "n", n);
        put(e, "nx", first);
        record(c, e);
    }

    /** Tanı için anlık durum; kişisel veri ya da ilaç adı içermez. */
    @SuppressWarnings("deprecation")
    static JSONObject state(Context c, String act) {
        JSONObject e = new JSONObject();
        put(e, "t", System.currentTimeMillis());
        put(e, "a", act);
        try {
            KeyguardManager km = (KeyguardManager) c.getSystemService(Context.KEYGUARD_SERVICE);
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            if (km != null) put(e, "kl", km.isKeyguardLocked());
            if (pm != null) {
                put(e, "ia", pm.isInteractive());
                put(e, "bo", pm.isIgnoringBatteryOptimizations(c.getPackageName()));
            }
            if (nm != null) {
                if (Build.VERSION.SDK_INT >= 24) put(e, "ne", nm.areNotificationsEnabled());
                if (Build.VERSION.SDK_INT >= 34) put(e, "fsi", nm.canUseFullScreenIntent());
                if (Build.VERSION.SDK_INT >= 26) {
                    NotificationChannel w = nm.getNotificationChannel(CH), m = nm.getNotificationChannel("nw_med");
                    put(e, "ci", w == null ? -1 : w.getImportance());
                    put(e, "mi", m == null ? -1 : m.getImportance());
                }
            }
            if (am != null) put(e, "ex", Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms());
        } catch (Exception x) {
            put(e, "err", String.valueOf(x));
        }
        return e;
    }

    private static void put(JSONObject o, String k, Object v) {
        try {
            o.put(k, v);
        } catch (JSONException ignored) {
        }
    }

    /** Son LOG_MAX kayıt; art arda gelen kurulum kayıtları tek satırda birleşir, böylece sık yeniden kurulum çalan alarm kayıtlarını itmez.
     *  Önceki kurulumun ilk alarm zamanı geçmişse birleşmez: çalmayan alarmın kanıtı kalır. */
    static synchronized void record(Context c, JSONObject e) {
        SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray a = log(c), out = new JSONArray();
        int len = a.length();
        JSONObject last = a.optJSONObject(len - 1);
        JSONArray nx = last == null ? null : last.optJSONArray("nx");
        long due = nx == null ? 0 : nx.optLong(0, 0);
        if (last != null && !"WAKE".equals(last.optString("a")) && !"WAKE".equals(e.optString("a")) && (due == 0 || due > e.optLong("t"))) len--;
        for (int k = Math.max(0, len - (LOG_MAX - 1)); k < len; k++) out.put(a.opt(k));
        out.put(e);
        // Alıcı süreci onReceive'den hemen sonra sonlanabilir: kayıt diske eşzamanlı yazılır.
        sp.edit().putString(LOG, out.toString()).commit();
    }

    static JSONArray log(Context c) {
        try {
            return new JSONArray(c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(LOG, "[]"));
        } catch (JSONException x) {
            return new JSONArray();
        }
    }

    static void clearLog(Context c) {
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().remove(LOG).commit();
    }
}
