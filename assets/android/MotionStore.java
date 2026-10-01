package com.neowell.app;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.ArrayList;
import java.util.List;
import java.util.TimeZone;

/** Hareket algılama durumu (SharedPreferences): model, profil, açık aralık, bekleyen aralıklar. Mantık MotionMath'te. */
final class MotionStore {
    private static final int MAX_PENDING = 100;
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

    static int dayNum() {
        long now = System.currentTimeMillis();
        return (int) ((now + TimeZone.getDefault().getOffset(now)) / 86400000L);
    }

    static synchronized MotionMath.Model model(Context c) {
        return MotionMath.Model.dec(p(c).getString("model", null));
    }

    static synchronized void saveModel(Context c, MotionMath.Model m) {
        p(c).edit().putString("model", m.enc()).apply();
    }

    static synchronized int gpsToday(Context c) {
        SharedPreferences sp = p(c);
        return sp.getInt("gpsDay", -1) == dayNum() ? sp.getInt("gpsN", 0) : 0;
    }

    static synchronized void incGps(Context c) {
        int n = gpsToday(c) + 1;
        p(c).edit().putInt("gpsDay", dayNum()).putInt("gpsN", n).apply();
    }

    /** Açık aralık: tür (MotionMath.WALK/RUN), başlangıç zamanı, başlangıçtaki günlük adım. */
    static synchronized void open(Context c, int mode, long t0, long steps0) {
        p(c).edit().putInt("bMode", mode).putLong("bT0", t0).putLong("bS0", steps0).putFloat("bSpeed", -1).apply();
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
        p(c).edit().remove("bT0").apply();
    }

    /** Açık aralığı kapatır ve özetini bekleyenlere ekler. Çok eski, adımı geriye giden ya da elenen aralık atılır. */
    static synchronized boolean close(Context c, long t1, long steps1) {
        SharedPreferences sp = p(c);
        long t0 = sp.getLong("bT0", 0), s0 = sp.getLong("bS0", 0);
        int mode = sp.getInt("bMode", 0);
        double speed = sp.getFloat("bSpeed", -1);
        sp.edit().remove("bT0").apply();
        if (t0 <= 0 || t1 <= t0 || t1 - t0 > MAX_BOUT_MS || steps1 < s0) return false;
        MotionMath.Bout b = MotionMath.bout(model(c), mode, cm(c), kg(c), (t1 - t0) / 60000.0, (int) (steps1 - s0), speed >= 0 ? speed : Double.NaN);
        if (!b.ok) return false;
        String rec = t0 + "," + t1 + "," + (b.mode == MotionMath.RUN ? "r" : "w") + "," + b.steps + "," + Math.round(b.km * 100) + "," + Math.round(b.kmh * 10) + "," + Math.round(b.kcal) + "," + (speed >= 0 ? 1 : 0) + ";";
        String all = sp.getString("pend", "") + rec;
        String[] parts = all.split(";");
        if (parts.length > MAX_PENDING) {
            StringBuilder sb = new StringBuilder();
            for (int i = parts.length - MAX_PENDING; i < parts.length; i++) sb.append(parts[i]).append(';');
            all = sb.toString();
        }
        sp.edit().putString("pend", all).commit();
        return true;
    }

    /** Bekleyen aralıklar: {t0, t1, tür, adım, km×100, km/s×10, kcal, gps}. Bozuk parçalar atlanır. */
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
