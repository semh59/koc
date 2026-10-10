package com.neowell.app;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.List;
import java.util.TimeZone;

/** Motion detection state (SharedPreferences): model, profile, open interval, pending intervals. The logic is in MotionMath. */
final class MotionStore {
    private static final int MAX_PENDING = 100, MAX_CHECKPOINTS = 150;
    private static final long MAX_BOUT_MS = 4L * 3600 * 1000;

    private static SharedPreferences p(Context c) {
        return c.getSharedPreferences("nw_motion", Context.MODE_PRIVATE);
    }

    static boolean enabled(Context c) {
        return p(c).getBoolean("on", false);
    }

    static void setEnabled(Context c, boolean on) {
        p(c).edit().putBoolean("on", on).commit();
    }

    static void profile(Context c, double cm, double kg) {
        p(c).edit().putFloat("cm", (float) cm).putFloat("kg", (float) kg).apply();
    }

    static double cm(Context c) {
        return p(c).getFloat("cm", 0);
    }

    static double kg(Context c) {
        return p(c).getFloat("kg", 0);
    }

    static int dayOf(long t) {
        return MotionMath.dayOf(t, TimeZone.getDefault().getOffset(t));
    }

    static synchronized MotionMath.Model model(Context c) {
        return MotionMath.Model.dec(p(c).getString("model", null));
    }

    static synchronized void saveModel(Context c, MotionMath.Model m) {
        p(c).edit().putString("model", m.enc()).apply();
    }

    /** Open interval: mode (MotionMath.WALK/RUN), start time, the daily step count at the start. */
    static synchronized void open(Context c, int mode, long t0, long steps0) {
        p(c).edit().putInt("bMode", mode).putLong("bT0", t0).putLong("bS0", steps0).putFloat("bSpeed", -1)
            .remove("bCp").remove("bLastT").remove("bLastS").remove("bCloseAt").apply();
    }

    /** Adds a checkpoint; skipped when time does not advance or the steps go backwards. */
    static synchronized void addCp(Context c, long t, long s) {
        SharedPreferences sp = p(c);
        long pt = sp.getLong("bLastT", sp.getLong("bT0", 0)), ps = sp.getLong("bLastS", sp.getLong("bS0", 0));
        if (t <= pt || s < ps) return;
        String all = QuickMath.tail(sp.getString("bCp", "") + t + ":" + s + ";", MAX_CHECKPOINTS);
        sp.edit().putString("bCp", all).putLong("bLastT", t).putLong("bLastS", s).apply();
    }

    /** Last movement of the open interval: the last checkpoint, else the start time. */
    static synchronized long lastActivityAt(Context c) {
        SharedPreferences sp = p(c);
        return Math.max(sp.getLong("bT0", 0), sp.getLong("bLastT", 0));
    }

    static synchronized long openedAt(Context c) {
        return p(c).getLong("bT0", 0);
    }

    static synchronized boolean isOpen(Context c) {
        return p(c).getLong("bT0", 0) > 0;
    }

    static synchronized int openMode(Context c) {
        return p(c).getInt("bMode", 0);
    }

    static synchronized void hint(Context c, double speed) {
        if (isOpen(c)) p(c).edit().putFloat("bSpeed", (float) speed).apply();
    }

    static synchronized void discard(Context c) {
        p(c).edit().remove("bT0").remove("bCloseAt").apply();
    }

    /** An exit event arrived but the step counter could not be read: the interval stays open and the close time is applied by the next successful read (the first event wins). */
    static synchronized void deferClose(Context c, long t) {
        if (p(c).getLong("bCloseAt", 0) == 0) p(c).edit().putLong("bCloseAt", t).apply();
    }

    /** The deferred close time, or 0; removed once read. */
    static synchronized long takeDeferredClose(Context c) {
        long t = p(c).getLong("bCloseAt", 0);
        if (t != 0) p(c).edit().remove("bCloseAt").apply();
        return t;
    }

    /** Closes the open interval, appends its valid parts (split at day boundaries) to the pending list and returns how many parts were added. */
    static synchronized int close(Context c, long t1, long steps1) {
        SharedPreferences sp = p(c);
        long t0 = sp.getLong("bT0", 0), s0 = sp.getLong("bS0", 0);
        int mode = sp.getInt("bMode", 0);
        double speed = sp.getFloat("bSpeed", -1);
        sp.edit().remove("bT0").remove("bCloseAt").apply();
        if (t0 <= 0 || t1 <= t0) return 0;
        long[] ts = new long[MAX_CHECKPOINTS + 2], ss = new long[MAX_CHECKPOINTS + 2];
        int n = 0;
        ts[n] = t0;
        ss[n++] = s0;
        for (String part : sp.getString("bCp", "").split(";")) {
            String[] f = part.split(":");
            if (f.length != 2 || n > MAX_CHECKPOINTS) continue;
            try {
                long t = Long.parseLong(f[0]), st = Long.parseLong(f[1]);
                if (t > ts[n - 1] && t < t1) {
                    ts[n] = t;
                    ss[n++] = st;
                }
            } catch (NumberFormatException e) {
                // malformed checkpoint: skipped
            }
        }
        ts[n] = t1;
        ss[n++] = steps1;
        int[] ds = new int[n];
        for (int i = 0; i < n; i++) ds[i] = dayOf(ts[i]);
        StringBuilder rec = new StringBuilder();
        int added = 0;
        for (MotionMath.Bout b : MotionMath.split(model(c), mode, cm(c), kg(c), ts, ss, ds, n, speed >= 0 ? speed : Double.NaN)) {
            if (b.t1 - b.t0 > MAX_BOUT_MS) continue;
            rec.append(b.t0).append(',').append(b.t1).append(',').append(b.mode == MotionMath.RUN ? "r" : "w").append(',').append(b.steps).append(',').append(Math.round(b.km * 100)).append(',')
                .append(Math.round(b.kmh * 10)).append(',').append(Math.round(b.kcal)).append(',').append(speed >= 0 ? 1 : 0).append(';');
            added++;
        }
        if (added == 0) return 0;
        sp.edit().putString("pend", QuickMath.tail(sp.getString("pend", "") + rec, MAX_PENDING)).commit();
        return added;
    }

    /** Pending intervals: {t0, t1, mode, steps, km x 100, km/h x 10, kcal, gps}. Malformed parts are skipped. */
    static synchronized List<String[]> takePending(Context c) {
        String s = p(c).getString("pend", "");
        if (!s.isEmpty()) p(c).edit().remove("pend").commit();
        List<String[]> out = new ArrayList<>();
        for (String part : s.split(";")) {
            String[] f = part.split(",");
            if (f.length == 8 && (f[2].equals("w") || f[2].equals("r"))) out.add(f);
        }
        return out;
    }
}
