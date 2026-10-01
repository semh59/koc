package com.neowell.app;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Bildirimden hızlı su kaydı: saf mantık (Android'e bağımlı değil, test edilebilir). */
final class QuickMath {
    static final int MAX = 200;
    private static final Pattern EXTRA_V = Pattern.compile("\"extra\"\\s*:\\s*\\{[^}]*\"v\"\\s*:\\s*(\\d{1,5})");

    /** Bildirimin JSON'undaki "extra":{"v":250} miktarı. Yoksa ya da 1-1500 dışındaysa 0. */
    static int amount(String json) {
        if (json == null) return 0;
        Matcher m = EXTRA_V.matcher(json);
        if (!m.find()) return 0;
        int v = Integer.parseInt(m.group(1));
        return v >= 1 && v <= 1500 ? v : 0;
    }

    /** Bekleyen kayıtlara "miktar,zaman;" ekler, en çok MAX kayıt tutar (en eskiler atılır). */
    static String append(String pending, int v, long t) {
        String[] p = ((pending == null ? "" : pending) + v + "," + t + ";").split(";");
        int from = Math.max(0, p.length - MAX);
        StringBuilder sb = new StringBuilder();
        for (int i = from; i < p.length; i++) if (!p[i].isEmpty()) sb.append(p[i]).append(';');
        return sb.toString();
    }

    /** "miktar,zaman;" dizisini ayrıştırır, bozuk parçaları atlar. */
    static List<long[]> parse(String pending) {
        List<long[]> out = new ArrayList<>();
        if (pending == null) return out;
        for (String part : pending.split(";")) {
            String[] f = part.split(",");
            if (f.length != 2) continue;
            try {
                long v = Long.parseLong(f[0]), t = Long.parseLong(f[1]);
                if (v >= 1 && v <= 1500 && t > 0) out.add(new long[] {v, t});
            } catch (NumberFormatException e) {
                // bozuk parça atlanır
            }
        }
        return out;
    }
}
