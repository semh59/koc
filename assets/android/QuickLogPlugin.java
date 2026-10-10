package com.neowell.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import com.capacitorjs.plugins.localnotifications.NotificationStorage;
import com.capacitorjs.plugins.localnotifications.TimedNotificationPublisher;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.security.SecureRandom;

/** Notification buttons ("+250 ml", "Aldım"): the record is written to SharedPreferences without opening the app, and the app picks it up at its next start. */
@CapacitorPlugin(name = "QuickLog")
public class QuickLogPlugin extends Plugin {
    // Extra names written by the local-notifications plugin (the second one is spelled that way in the plugin).
    static final String ACTION_KEY = "LocalNotificationUserAction";
    static final String OBJ_KEY = "LocalNotficationObject";
    private static final String ID_KEY = "LocalNotificationId";

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("nw_quick", Context.MODE_PRIVATE);
    }

    /** Secret placed in the app's own notifications (128 bits, created on first request). A record is written only from a notification that carries it. */
    static synchronized String secret(Context c) {
        SharedPreferences p = prefs(c);
        String s = p.getString("tk", null);
        if (s != null) return s;
        byte[] b = new byte[16];
        new SecureRandom().nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(Character.forDigit((x >> 4) & 15, 16)).append(Character.forDigit(x & 15, 16));
        s = sb.toString();
        p.edit().putString("tk", s).apply();
        return s;
    }

    /** Cancels the notification plugin's scheduled alarm (request code = notification id) and its stored copy; a leftover copy would be rescheduled at the next start. */
    private static void cancelPending(Context c, int id) {
        AlarmManager am = Alarms.manager(c);
        PendingIntent pi = PendingIntent.getBroadcast(c, id, new Intent(c, TimedNotificationPublisher.class), PendingIntent.FLAG_NO_CREATE | (Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0));
        if (pi != null) am.cancel(pi);
        new NotificationStorage(c).deleteNotification(Integer.toString(id));
    }

    /** Medication: the main notification and its repeat reminders belong to the same dose (main id 1,000,000-1,999,999; repeats are id + 1,000,000 x n, n = 1-2).
     *  JS cannot reschedule while the app is closed, so the pending repeat alarms and their stored copies are cancelled here. */
    private static void cancelSiblings(Context c, int id, boolean med) {
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        int base = id % 1000000, count = med ? 3 : 1;
        for (int k = 0; k < count; k++) {
            int sid = med ? base + 1000000 * (k + 1) : id;
            nm.cancel(sid);
            if (med) cancelPending(c, sid);
        }
    }

    /** Medication record from the alarm screen ("m12_0800" taken, "k12_0800" skipped): written to the same queue as the notification buttons and picked up when the app opens. */
    static synchronized void recordMed(Context c, String key, int id) {
        SharedPreferences p = prefs(c);
        p.edit().putString("q", QuickMath.append(p.getString("q", ""), key, System.currentTimeMillis())).commit();
        cancelSiblings(c, id, true);
        MedWakeReceiver.drop(c, key);
    }

    /**
     * Called by MainActivity and WaterReceiver. If the button is "water" or "med", stores the record, removes the notification and returns true.
     * MainActivity is exported, so any app can open it with the same extras; on that path (widget=false) a record is written only
     * from a notification that carries the secret. The widget receiver is exported=false, only the app's own PendingIntent reaches it.
     */
    static synchronized boolean handle(Context c, Intent in, boolean widget) {
        if (in == null) return false;
        // Launching from recents makes the system hand over the first intent (with its extras) again; the record was written the first time.
        if ((in.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) {
            in.removeExtra(ACTION_KEY);
            return false;
        }
        String act = in.getStringExtra(ACTION_KEY), obj = in.getStringExtra(OBJ_KEY), key = null;
        int v = 0;
        boolean med = "med".equals(act) || "medskip".equals(act);
        if ("water".equals(act)) {
            v = QuickMath.amount(obj);
            if (v > 0) key = String.valueOf(v);
        } else if (med) {
            key = QuickMath.medKey(obj, "medskip".equals(act));
        }
        if (key == null) {
            if (med && (widget || QuickMath.signed(obj, secret(c)))) Log.w("NW-QUICK", "medication record skipped: id outside 1-999 or malformed time");
            return false;
        }
        if (!widget && !QuickMath.signed(obj, secret(c))) return false;
        int id = in.getIntExtra(ID_KEY, Integer.MIN_VALUE);
        SharedPreferences p = prefs(c);
        // The system can redeliver a notification intent (process death, MIUI); the same scheduled notification must not be recorded twice.
        // A legitimate second tap is impossible: the notification is removed on the first tap and every new notification has a different "at".
        String tok = QuickMath.token(obj), sig = tok == null ? null : id + "@" + tok, seen = p.getString("seen", "");
        if (sig != null && QuickMath.seen(seen, sig)) {
            in.removeExtra(ACTION_KEY);
            return false;
        }
        SharedPreferences.Editor e = p.edit().putString("q", QuickMath.append(p.getString("q", ""), key, System.currentTimeMillis()));
        if (sig != null) e.putString("seen", QuickMath.remember(seen, sig));
        // The queue write must be durable: with the app closed the receiver process can end at once and apply() would lose the asynchronous write.
        e.commit();
        if (v > 0) NeoWidget.bump(c, v);
        if (id != Integer.MIN_VALUE) cancelSiblings(c, id, med);
        if (med) MedWakeReceiver.drop(c, key);
        in.removeExtra(ACTION_KEY);
        return true;
    }

    /** Taken records stay in "inflight" until JS acknowledges them with ack after persisting: if the process dies between taking and writing, the record is not lost. */
    private static synchronized String takeAll(Context c) {
        SharedPreferences p = prefs(c);
        String q = p.getString("q", ""), inf = p.getString("inflight", ""), s = inf + q;
        if (!q.isEmpty()) p.edit().remove("q").putString("inflight", s).commit();
        return s;
    }

    /** Treats records up to and including upto (ms) as persisted and deletes them; later ones (from another take) stay. */
    @PluginMethod
    public synchronized void ack(PluginCall call) {
        long upto = call.getLong("upto", 0L);
        SharedPreferences p = prefs(getContext());
        String left = "";
        for (String[] x : QuickMath.parse(p.getString("inflight", ""))) {
            try {
                long t = Long.parseLong(x[1]);
                if (t > upto) left = QuickMath.append(left, x[0], t);
            } catch (RuntimeException e) {
                // malformed record: dropped
            }
        }
        if (left.isEmpty()) p.edit().remove("inflight").commit();
        else p.edit().putString("inflight", left).commit();
        call.resolve();
    }

    @PluginMethod
    public void getToken(PluginCall call) {
        JSObject r = new JSObject();
        r.put("tk", secret(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void take(PluginCall call) {
        JSArray items = new JSArray();
        for (String[] x : QuickMath.parse(takeAll(getContext()))) {
            // A malformed record drops only itself, the others are kept.
            try {
                JSObject o = new JSObject();
                if (x[0].charAt(0) == 'm' || x[0].charAt(0) == 'k') {
                    int us = x[0].indexOf('_');
                    o.put("m", Integer.parseInt(x[0].substring(1, us)));
                    o.put("s", x[0].substring(us + 1, us + 3) + ":" + x[0].substring(us + 3));
                    o.put("k", x[0].charAt(0) == 'k');
                } else {
                    o.put("v", Integer.parseInt(x[0]));
                }
                o.put("t", Long.parseLong(x[1]));
                items.put(o);
            } catch (RuntimeException e) {
                // malformed record: skipped
            }
        }
        JSObject r = new JSObject();
        r.put("items", items);
        call.resolve(r);
    }
}
