package com.neowell.app;

import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Quick log from notification buttons (water, medication): pure logic (no Android dependency, unit-testable). */
final class QuickMath {
    static final int MAX = 200;
    private static final int MAX_SEEN = 50, MAX_WATER_ML = 1500, MAX_MED_ID = 999;
    private static final Pattern EXTRA = Pattern.compile("\"extra\"\\s*:\\s*\\{([^}]*)\\}");
    private static final Pattern V = Pattern.compile("\"v\"\\s*:\\s*(\\d{1,5})(?![\\d.])");
    private static final Pattern M = Pattern.compile("\"m\"\\s*:\\s*(\\d{1,5})(?![\\d.])");
    private static final Pattern S = Pattern.compile("\"s\"\\s*:\\s*\"([01]\\d|2[0-3]):([0-5]\\d)\"");
    private static final Pattern AT = Pattern.compile("\"at\"\\s*:\\s*(\\d{10,15})(?![\\d.])");
    private static final Pattern TK = Pattern.compile("\"tk\"\\s*:\\s*\"([0-9a-f]{32})\"");
    private static final Pattern KEY = Pattern.compile("(\\d{1,4})|([mk]\\d{1,3}_\\d{4})");

    private static String extra(String json) {
        if (json == null) return null;
        Matcher m = EXTRA.matcher(json);
        return m.find() ? m.group(1) : null;
    }

    /** Water amount (ml) in the notification's "extra". 0 when absent or outside 1-1500. */
    static int amount(String json) {
        String e = extra(json);
        if (e == null) return 0;
        Matcher m = V.matcher(e);
        if (!m.find()) return 0;
        int v = Integer.parseInt(m.group(1));
        return v >= 1 && v <= MAX_WATER_ML ? v : 0;
    }

    /** Medication key such as "m12_0800" from the medication id (1-999) and the dose time in "extra"; "k12_0800" when skip is true (skipped), "m..." when taken. Null when missing, malformed or the id is out of range (the caller logs). */
    static String medKey(String json, boolean skip) {
        String e = extra(json);
        if (e == null) return null;
        Matcher m = M.matcher(e), s = S.matcher(e);
        if (!m.find() || !s.find()) return null;
        int id = Integer.parseInt(m.group(1));
        if (id < 1 || id > MAX_MED_ID) return null;
        return (skip ? "k" : "m") + id + "_" + s.group(1) + s.group(2);
    }

    /** The time (ms, "extra.at") the notification was scheduled for: different for every notification instance, the same in a redelivered intent. Null when absent. */
    static String token(String json) {
        String e = extra(json);
        if (e == null) return null;
        Matcher m = AT.matcher(e);
        return m.find() ? m.group(1) : null;
    }

    /** Whether the app itself posted the notification: "extra.tk" equals the app's secret. */
    static boolean signed(String json, String secret) {
        String e = extra(json);
        if (e == null || secret == null) return false;
        Matcher m = TK.matcher(e);
        return m.find() && same(m.group(1), secret);
    }

    /** Constant-time comparison; both must be non-null. */
    static boolean same(String a, String b) {
        return a != null && b != null && MessageDigest.isEqual(a.getBytes(), b.getBytes());
    }

    static boolean seen(String list, String sig) {
        return (";" + list).contains(";" + sig + ";");
    }

    /** Adds to the processed notification signatures, keeping the last 50. */
    static String remember(String list, String sig) {
        return tail(list + sig + ";", MAX_SEEN);
    }

    /** Appends "key,time;" to the pending records, keeping at most MAX (the oldest are dropped). */
    static String append(String pending, String key, long t) {
        return tail((pending == null ? "" : pending) + key + "," + t + ";", MAX);
    }

    /** The last max records of a ";"-separated list (also used by MotionStore). */
    static String tail(String joined, int max) {
        String[] p = joined.split(";");
        int from = Math.max(0, p.length - max);
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < p.length; i++) if (!p[i].isEmpty()) sb.append(p[i]).append(';');
        return sb.toString();
    }

    /** Parses the pending records into {key, time}. Malformed and out-of-range parts are skipped. */
    static List<String[]> parse(String pending) {
        List<String[]> out = new ArrayList<>();
        if (pending == null) return out;
        for (String part : pending.split(";")) {
            String[] f = part.split(",");
            if (f.length != 2 || !KEY.matcher(f[0]).matches()) continue;
            try {
                long t = Long.parseLong(f[1]);
                if (t <= 0) continue;
                if (f[0].charAt(0) != 'm' && f[0].charAt(0) != 'k') {
                    int v = Integer.parseInt(f[0]);
                    if (v < 1 || v > MAX_WATER_ML) continue;
                }
                out.add(new String[] {f[0], f[1]});
            } catch (NumberFormatException e) {
                // malformed part: skipped
            }
        }
        return out;
    }
}
