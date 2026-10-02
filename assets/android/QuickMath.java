package com.neowell.app;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Bildirim düğmelerinden hızlı kayıt (su, ilaç): saf mantık (Android'e bağımlı değil, test edilebilir). */
final class QuickMath {
    static final int MAX = 200;
    private static final Pattern EXTRA = Pattern.compile("\"extra\"\\s*:\\s*\\{([^}]*)\\}");
    private static final Pattern V = Pattern.compile("\"v\"\\s*:\\s*(\\d{1,5})(?![\\d.])");
    private static final Pattern M = Pattern.compile("\"m\"\\s*:\\s*(\\d{1,3})(?![\\d.])");
    private static final Pattern S = Pattern.compile("\"s\"\\s*:\\s*\"([01]\\d|2[0-3]):([0-5]\\d)\"");
    private static final Pattern AT = Pattern.compile("\"at\"\\s*:\\s*(\\d{10,15})(?![\\d.])");
    private static final Pattern KEY = Pattern.compile("(\\d{1,4})|([mk]\\d{1,3}_\\d{4})");

    private static String extra(String json) {
        if (json == null) return null;
        Matcher m = EXTRA.matcher(json);
        return m.find() ? m.group(1) : null;
    }

    /** Bildirimin "extra" alanındaki su miktarı (ml). Yoksa ya da 1-1500 dışındaysa 0. */
    static int amount(String json) {
        String e = extra(json);
        if (e == null) return 0;
        Matcher m = V.matcher(e);
        if (!m.find()) return 0;
        int v = Integer.parseInt(m.group(1));
        return v >= 1 && v <= 1500 ? v : 0;
    }

    /** İlaç bildirimi: "extra" içindeki ilaç kimliği (1-999) ve doz saatinden "m12_0800" anahtarı. Eksik ya da bozuksa null. */
    static String medKey(String json) {
        return medKey(json, false);
    }

    /** skip true ise "k12_0800" (atlandı), değilse "m12_0800" (alındı). */
    static String medKey(String json, boolean skip) {
        String e = extra(json);
        if (e == null) return null;
        Matcher m = M.matcher(e), s = S.matcher(e);
        if (!m.find() || !s.find()) return null;
        int id = Integer.parseInt(m.group(1));
        if (id < 1 || id > 999) return null;
        return (skip ? "k" : "m") + id + "_" + s.group(1) + s.group(2);
    }

    /** Bildirimin planlandığı an (ms, "extra.at"): her bildirim oluşumunda farklı, yeniden teslim edilen intent'te aynı. Yoksa null. */
    static String token(String json) {
        String e = extra(json);
        if (e == null) return null;
        Matcher m = AT.matcher(e);
        return m.find() ? m.group(1) : null;
    }

    static boolean seen(String list, String sig) {
        return (";" + list).contains(";" + sig + ";");
    }

    /** İşlenen bildirim imzalarına ekler, son 50'yi tutar. */
    static String remember(String list, String sig) {
        return tail(list + sig + ";", 50);
    }

    /** Bekleyen kayıtlara "anahtar,zaman;" ekler, en çok MAX kayıt tutar (en eskiler atılır). */
    static String append(String pending, String key, long t) {
        return tail((pending == null ? "" : pending) + key + "," + t + ";", MAX);
    }

    private static String tail(String joined, int max) {
        String[] p = joined.split(";");
        int from = Math.max(0, p.length - max);
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < p.length; i++) if (!p[i].isEmpty()) sb.append(p[i]).append(';');
        return sb.toString();
    }

    /** Bekleyen kayıtları {anahtar, zaman} olarak ayrıştırır. Bozuk ve sınır dışı parçalar atlanır. */
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
                    if (v < 1 || v > 1500) continue;
                }
                out.add(new String[] {f[0], f[1]});
            } catch (NumberFormatException e) {
                // bozuk parça atlanır
            }
        }
        return out;
    }
}
