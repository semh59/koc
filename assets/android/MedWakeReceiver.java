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
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import java.util.Arrays;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Lights the locked screen at a medication dose: a separate alarm opens the screen at the same moment as the notification, which the notification plugin cannot do. */
public class MedWakeReceiver extends BroadcastReceiver {
    static final int NID = 7150;
    private static final int BASE = 7100, MAX = 40, LOG_MAX = 20, MAX_DOSES = 200;
    /** An alarm may fire this early relative to its planned time. */
    static final long EARLY_MS = 5000;
    private static final long FSI_GRACE_MS = 1200, WAKE_MS = 20000, TEST_VISIBLE_MS = 120000, NOTIFICATION_TIMEOUT_MS = 30000;
    private static final String PREFS = "nw_medwake", KEY = "times", DOSES = "doses", LOG = "log", TEST = "test", WAKE = "com.neowell.app.MED_WAKE";
    /** The id was bumped once because Android restores the old settings (including a lowered importance) when a deleted channel is recreated under the same id. */
    static final String CH = "nw_medwake2";

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (WAKE.equals(a)) {
            wake(c, goAsync());
            // Doses beyond MAX wait in line: when one rings the window slides on and the next dose is set.
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

    /** The full-screen notification goes first and the screen-lighting lock follows after FSI_GRACE_MS: when the lock turned the screen on before the notification, Samsung (One UI) treated the phone as in use and showed only a banner instead of opening AlarmActivity. The lock is skipped when the alarm screen is already up. */
    @SuppressWarnings("deprecation")
    private static void wake(Context c, BroadcastReceiver.PendingResult pr) {
        // The state is read before the wake lock: ACQUIRE_CAUSES_WAKEUP turns the screen on, so isInteractive would report true afterwards.
        JSONObject e = state(c, "WAKE");
        long now = System.currentTimeMillis(), test = prefs(c).getLong(TEST, 0), at = planned(load(c), test, now);
        put(e, "p", at);
        put(e, "v", 2);
        if (at != 0 && at == test) put(e, "k", "T");
        long grace = 0;
        PowerManager.WakeLock made = null;
        try {
            PowerManager pm = c.getSystemService(PowerManager.class);
            boolean locked = c.getSystemService(KeyguardManager.class).isKeyguardLocked(), dark = !pm.isInteractive();
            made = pm.newWakeLock(PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE, "neowell:medwake");
            // Full-screen notification while locked or dark: vendors (Xiaomi) do not rely on the wake lock alone, alarm apps use this.
            put(e, "fs", locked || dark ? fullScreen(c) : "skip");
            if (dark) grace = FSI_GRACE_MS;
        } catch (Exception x) {
            put(e, "err", String.valueOf(x));
        }
        final PowerManager.WakeLock wl = made;
        final JSONObject rec = e;
        Runnable light = () -> {
            try {
                if (wl != null && !AlarmActivity.visible) {
                    wl.acquire(WAKE_MS);
                    put(rec, "wl", wl.isHeld());
                } else put(rec, "wl", wl != null ? "up" : false);
            } catch (Exception x) {
                put(rec, "err", String.valueOf(x));
            } finally {
                record(c, rec);
                if (pr != null) pr.finish();
            }
        };
        if (grace > 0 && pr != null) new Handler(Looper.getMainLooper()).postDelayed(light, grace);
        else light.run();
    }

    /** Planned time of the alarm that just rang: the latest saved dose that is due, or the test (may fire EARLY_MS early). */
    private static long planned(long[] times, long test, long now) {
        long best = test <= now + EARLY_MS ? test : 0;
        for (long t : times) if (t <= now + EARLY_MS && t > best) best = t;
        return best;
    }

    static void channel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CH) != null) return;
        NotificationChannel ch = new NotificationChannel(CH, "İlaç alarmı ekranı", NotificationManager.IMPORTANCE_HIGH);
        ch.setSound(null, null);
        ch.enableVibration(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    /** Silent, short-lived notification: the sound and buttons come from the plugin's medication notification, this one only opens AlarmActivity over the lock screen. Returns "ok" or the error. */
    @SuppressWarnings("deprecation")
    private static String fullScreen(Context c) {
        try {
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            channel(c);
            Intent open = new Intent(c, AlarmActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(c, NID, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CH) : new Notification.Builder(c).setPriority(Notification.PRIORITY_MAX);
            b.setSmallIcon(c.getApplicationInfo().icon).setContentTitle("İlaç zamanı").setContentText("İlaçlarını görmek için dokun")
                .setCategory(Notification.CATEGORY_ALARM).setVisibility(Notification.VISIBILITY_PUBLIC).setAutoCancel(true).setOnlyAlertOnce(false)
                .setContentIntent(pi).setFullScreenIntent(pi, true);
            if (Build.VERSION.SDK_INT >= 26) b.setTimeoutAfter(NOTIFICATION_TIMEOUT_MS);
            nm.notify(NID, b.build());
            return "ok";
        } catch (Exception x) {
            return "err:" + x;
        }
    }

    /** Settings > "Lock screen test" and "Real dose test": runs the same path ms from now with its own request code, leaving the real dose alarms alone. */
    static void test(Context c, long ms) {
        prefs(c).edit().putLong(TEST, System.currentTimeMillis() + ms).commit();
        Alarms.setClock(c, System.currentTimeMillis() + ms, pi(c, MAX, PendingIntent.FLAG_UPDATE_CURRENT));
    }

    private static PendingIntent pi(Context c, int n, int flags) {
        Intent i = new Intent(c, MedWakeReceiver.class).setAction(WAKE);
        return PendingIntent.getBroadcast(c, BASE + n, i, flags | PendingIntent.FLAG_IMMUTABLE);
    }

    private static long[] load(Context c) {
        String s = prefs(c).getString(KEY, "");
        if (s.isEmpty()) return new long[0];
        String[] p = s.split(",");
        long[] t = new long[p.length];
        for (int k = 0; k < p.length; k++) {
            try { t[k] = Long.parseLong(p[k]); } catch (NumberFormatException e) { t[k] = 0; }
        }
        return t;
    }

    /** Cancels the previous alarms and sets the nearest MAX future doses; keeps every future dose (including the unset ones) to re-arm at boot and after an alarm rings. */
    static void arm(Context c, long[] times, String why) {
        AlarmManager am = Alarms.manager(c);
        channel(c);
        for (int n = 0; n < MAX; n++) {
            PendingIntent old = pi(c, n, PendingIntent.FLAG_NO_CREATE);
            if (old != null) am.cancel(old);
        }
        long now = System.currentTimeMillis();
        long[] t = Arrays.copyOf(times, times.length);
        Arrays.sort(t);
        StringBuilder keep = new StringBuilder();
        JSONArray first = new JSONArray();
        int n = 0;
        long prev = 0;
        for (long at : t) {
            // Two medications in the same minute give the same time: one alarm is enough (the alarm screen lists both), otherwise the limit of 40 is wasted.
            if (at <= now + 2000 || at == prev) continue;
            prev = at;
            if (n < MAX) {
                Alarms.setClock(c, at, pi(c, n, PendingIntent.FLAG_UPDATE_CURRENT));
                if (first.length() < 3) first.put(at);
                n++;
            }
            if (keep.length() > 0) keep.append(',');
            keep.append(at);
        }
        prefs(c).edit().putString(KEY, keep.toString()).apply();
        JSONObject e = new JSONObject();
        put(e, "t", now);
        put(e, "a", why);
        put(e, "in", times.length);
        put(e, "n", n);
        put(e, "nx", first);
        record(c, e);
    }

    /** Snapshot for the diagnosis; contains no personal data or medication names. */
    @SuppressWarnings("deprecation")
    static JSONObject state(Context c, String act) {
        JSONObject e = new JSONObject();
        put(e, "t", System.currentTimeMillis());
        put(e, "a", act);
        try {
            PowerManager pm = c.getSystemService(PowerManager.class);
            NotificationManager nm = c.getSystemService(NotificationManager.class);
            put(e, "kl", c.getSystemService(KeyguardManager.class).isKeyguardLocked());
            put(e, "ia", pm.isInteractive());
            put(e, "bo", pm.isIgnoringBatteryOptimizations(c.getPackageName()));
            put(e, "ne", nm.areNotificationsEnabled());
            if (Build.VERSION.SDK_INT >= 34) put(e, "fsi", nm.canUseFullScreenIntent());
            if (Build.VERSION.SDK_INT >= 26) {
                NotificationChannel w = nm.getNotificationChannel(CH), m = nm.getNotificationChannel("nw_med");
                put(e, "ci", w == null ? -1 : w.getImportance());
                put(e, "mi", m == null ? -1 : m.getImportance());
            }
            put(e, "ex", Build.VERSION.SDK_INT < 31 || Alarms.manager(c).canScheduleExactAlarms());
            if (isXiaomi()) {
                put(e, "xl", miuiOp(c, 10020));
                put(e, "xp", miuiOp(c, 10021));
            }
        } catch (Exception x) {
            put(e, "err", String.valueOf(x));
        }
        return e;
    }

    private static boolean isXiaomi() {
        String m = Build.MANUFACTURER.toLowerCase(Locale.ROOT);
        return m.contains("xiaomi") || m.contains("redmi") || m.contains("poco");
    }

    /** MIUI/HyperOS special permissions (10020 show on lock screen, 10021 open windows in the background): 0 allowed, 1+ denied, -1 unreadable. */
    private static int miuiOp(Context c, int op) {
        try {
            Object ops = c.getSystemService(Context.APP_OPS_SERVICE);
            return (Integer) ops.getClass().getMethod("checkOpNoThrow", int.class, int.class, String.class).invoke(ops, op, android.os.Process.myUid(), c.getPackageName());
        } catch (Exception x) {
            return -1;
        }
    }

    private static void put(JSONObject o, String k, Object v) {
        try {
            o.put(k, v);
        } catch (JSONException ignored) {
        }
    }

    /** Keeps the last LOG_MAX records; consecutive arm records merge into one line so frequent re-arming does not push out the alarm-ring records.
     *  They do not merge when the previous arm's first alarm time has passed: that is the evidence of an alarm that did not ring. */
    static synchronized void record(Context c, JSONObject e) {
        JSONArray a = log(c), out = new JSONArray();
        int len = a.length();
        JSONObject last = a.optJSONObject(len - 1);
        JSONArray nx = last == null ? null : last.optJSONArray("nx");
        long due = nx == null ? 0 : nx.optLong(0, 0);
        if (last != null && !ring(last.optString("a")) && !ring(e.optString("a")) && (due == 0 || due > e.optLong("t"))) len--;
        for (int k = Math.max(0, len - (LOG_MAX - 1)); k < len; k++) out.put(a.opt(k));
        out.put(e);
        // The receiver process can end right after onReceive: the record is written synchronously.
        prefs(c).edit().putString(LOG, out.toString()).commit();
    }

    /** Records that must never merge into a schedule line: an alarm ringing, the alarm screen opening (AS) and closing (AE). */
    static boolean ring(String a) {
        return "WAKE".equals(a) || "AS".equals(a) || "AE".equals(a);
    }

    static JSONArray log(Context c) {
        return json(c, LOG);
    }

    static JSONArray doses(Context c) {
        return json(c, DOSES);
    }

    private static JSONArray json(Context c, String key) {
        try {
            return new JSONArray(prefs(c).getString(key, "[]"));
        } catch (JSONException x) {
            return new JSONArray();
        }
    }

    /** Dose details from JS (time at, notification id nid, medication id m, clock s, display text b); the alarm screen is drawn from them. */
    static void saveDoses(Context c, JSONArray in) {
        JSONArray out = new JSONArray();
        for (int k = 0; k < in.length() && out.length() < MAX_DOSES; k++) {
            JSONObject d = in.optJSONObject(k), o = new JSONObject();
            if (d == null || d.optLong("at") <= 0 || d.optInt("nid") <= 0) continue;
            put(o, "at", d.optLong("at"));
            put(o, "nid", d.optInt("nid"));
            put(o, "m", d.optInt("m"));
            put(o, "s", d.optString("s"));
            put(o, "b", d.optString("b"));
            out.put(o);
        }
        prefs(c).edit().putString(DOSES, out.toString()).commit();
    }

    /** Removes a dose whose record was written (key "m12_0800" / "k12_0800") from the due list; the alarm screen no longer shows it. */
    static synchronized void drop(Context c, String key) {
        int us = key.indexOf('_');
        if (us < 2 || key.length() != us + 5) return;
        try {
            int m = Integer.parseInt(key.substring(1, us));
            String s = key.substring(us + 1, us + 3) + ":" + key.substring(us + 3);
            long now = System.currentTimeMillis();
            JSONArray a = doses(c), out = new JSONArray();
            for (int k = 0; k < a.length(); k++) {
                JSONObject d = a.optJSONObject(k);
                if (d != null && !(d.optInt("m") == m && s.equals(d.optString("s")) && d.optLong("at") <= now + EARLY_MS)) out.put(d);
            }
            prefs(c).edit().putString(DOSES, out.toString()).commit();
        } catch (NumberFormatException e) {
            // malformed key: ignored
        }
    }

    /** Whether the Settings test alarm rang within the last two minutes. */
    static boolean testActive(Context c, long now) {
        long t = prefs(c).getLong(TEST, 0);
        return t > 0 && t <= now + EARLY_MS && now - t <= TEST_VISIBLE_MS;
    }

    static void clearLog(Context c) {
        prefs(c).edit().remove(LOG).commit();
    }
}
