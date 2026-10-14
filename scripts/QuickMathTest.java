package com.neowell.app;

import java.util.List;

public class QuickMathTest {
    static int bad = 0;

    static void ok(String n, boolean c) {
        System.out.println((c ? "PASS " : "FAIL ") + n);
        if (!c) bad++;
    }

    public static void main(String[] a) {
        ok("amount: reads v inside extra", QuickMath.amount("{\"id\":200,\"extra\":{\"act\":\"water\",\"v\":250}}") == 250);
        ok("amount: field order does not matter", QuickMath.amount("{\"extra\":{\"v\":300,\"act\":\"water\"}}") == 300);
        ok("amount: v outside extra is ignored", QuickMath.amount("{\"v\":999,\"extra\":{\"act\":\"water\",\"v\":150}}") == 150);
        ok("amount: 0 without extra", QuickMath.amount("{\"id\":200}") == 0 && QuickMath.amount(null) == 0 && QuickMath.amount("") == 0);
        ok("amount: out of range is 0", QuickMath.amount("{\"extra\":{\"v\":0}}") == 0 && QuickMath.amount("{\"extra\":{\"v\":1501}}") == 0 && QuickMath.amount("{\"extra\":{\"v\":99999}}") == 0);
        ok("amount: boundary values are valid", QuickMath.amount("{\"extra\":{\"v\":1}}") == 1 && QuickMath.amount("{\"extra\":{\"v\":1500}}") == 1500);
        ok("amount: non-numeric or decimal v is 0", QuickMath.amount("{\"extra\":{\"v\":\"abc\"}}") == 0 && QuickMath.amount("{\"extra\":{\"v\":2.5}}") == 0);

        ok("med: reads id and time", "m12_0800".equals(QuickMath.medKey("{\"extra\":{\"act\":\"med\",\"m\":12,\"s\":\"08:00\"}}", false)));
        ok("med: field order does not matter", "m5_2330".equals(QuickMath.medKey("{\"extra\":{\"s\":\"23:30\",\"act\":\"med\",\"m\":5}}", false)));
        ok("med: missing field gives null", QuickMath.medKey("{\"extra\":{\"m\":12}}", false) == null && QuickMath.medKey("{\"extra\":{\"s\":\"08:00\"}}", false) == null && QuickMath.medKey(null, false) == null && QuickMath.medKey("{}", false) == null);
        ok("med: bad time and out-of-range id give null", QuickMath.medKey("{\"extra\":{\"m\":1,\"s\":\"25:00\"}}", false) == null && QuickMath.medKey("{\"extra\":{\"m\":1,\"s\":\"8:00\"}}", false) == null && QuickMath.medKey("{\"extra\":{\"m\":0,\"s\":\"08:00\"}}", false) == null && QuickMath.medKey("{\"extra\":{\"m\":1000,\"s\":\"08:00\"}}", false) == null);
        ok("med: id 999 is valid, 1000 and 5-digit ids are out of range (null)", "m999_0800".equals(QuickMath.medKey("{\"extra\":{\"m\":999,\"s\":\"08:00\"}}", false)) && QuickMath.medKey("{\"extra\":{\"m\":1000,\"s\":\"08:00\"}}", false) == null && QuickMath.medKey("{\"extra\":{\"m\":12345,\"s\":\"08:00\"}}", false) == null);
        ok("compare: equal strings match, different or null do not", QuickMath.same("ab", "ab") && !QuickMath.same("ab", "ac") && !QuickMath.same(null, "ab") && !QuickMath.same("ab", null) && !QuickMath.same(null, null));
        ok("med: a water notification yields no med key", QuickMath.medKey("{\"extra\":{\"act\":\"water\",\"v\":250}}", false) == null);

        ok("med group: every dose of extra.g becomes a key, a bad id or time is skipped", QuickMath.medKeys("{\"extra\":{\"act\":\"med\",\"g\":\"12_0800,13_0800\"}}", false).equals(List.of("m12_0800", "m13_0800")) && QuickMath.medKeys("{\"extra\":{\"g\":\"12_0800,0_0800\"}}", true).equals(List.of("k12_0800")) && QuickMath.medKeys("{\"extra\":{\"g\":\"12_2500\"}}", false).isEmpty());
        ok("med group: without g the single key is used", QuickMath.medKeys("{\"extra\":{\"m\":12,\"s\":\"08:00\"}}", false).equals(List.of("m12_0800")) && QuickMath.medKeys("{}", false).isEmpty());
        ok("med: skip key starts with k", "k12_0800".equals(QuickMath.medKey("{\"extra\":{\"act\":\"med\",\"m\":12,\"s\":\"08:00\"}}", true)));

        String sec = "0123456789abcdef0123456789abcdef";
        ok("key: signed when extra.tk matches", QuickMath.signed("{\"extra\":{\"act\":\"water\",\"v\":250,\"tk\":\"" + sec + "\"}}", sec));
        ok("key: unsigned when tk is missing, wrong, outside extra, or the secret is missing",
            !QuickMath.signed("{\"extra\":{\"act\":\"water\",\"v\":250}}", sec)
                && !QuickMath.signed("{\"extra\":{\"tk\":\"00000000000000000000000000000000\"}}", sec)
                && !QuickMath.signed("{\"tk\":\"" + sec + "\",\"extra\":{\"act\":\"water\"}}", sec)
                && !QuickMath.signed("{\"extra\":{\"tk\":\"" + sec.substring(1) + "\"}}", sec.substring(1))
                && !QuickMath.signed(null, sec) && !QuickMath.signed("{\"extra\":{\"tk\":\"" + sec + "\"}}", null));

        String s = QuickMath.append("", "250", 1000L, 180);
        s = QuickMath.append(s, "m12_0800", 2000L, -300);
        List<String[]> l = QuickMath.parse(s);
        ok("append: two records in order", l.size() == 2 && l.get(0)[0].equals("250") && l.get(0)[1].equals("1000") && l.get(1)[0].equals("m12_0800"));
        ok("append: null start", QuickMath.parse(QuickMath.append(null, "250", 5L, 0)).size() == 1);

        String big = "";
        for (int i = 1; i <= 250; i++) big = QuickMath.append(big, "100", i, 60);
        List<String[]> bl = QuickMath.parse(big);
        ok("limit: at most 200 records, oldest dropped", bl.size() == 200 && bl.get(0)[1].equals("51") && bl.get(199)[1].equals("250"));

        List<String[]> m = QuickMath.parse("250,1000,z180;abc;,5,z0;100,,z0;0,50,z0;5000,70,z0;300,0,z0;-5,10,z0;200,3000,z-120;;300,4000,9;m7_0900,10,z0;k7_0900,11,z60;m7_9,10,z0;mx_0800,10,z0;m1000_0800,10,z0;250,1000;300,5,zx;");
        ok("parse: corrupt and out-of-range pieces are skipped", m.size() == 4 && m.get(0)[0].equals("250") && m.get(1)[0].equals("200") && m.get(2)[0].equals("m7_0900") && m.get(3)[0].equals("k7_0900"));
        ok("parse: the zone offset (minutes, may be negative) is kept; a record without one is skipped", m.get(0)[2].equals("180") && m.get(1)[2].equals("-120") && m.get(3)[2].equals("60"));
        ok("append: the zone is written after the time", QuickMath.append("", "250", 1000L, -300).equals("250,1000,z-300;"));
        ok("widget tap: a second tap inside the gap is a repeat, the first, a later one and a clock that went back are not",
            !QuickMath.tooSoon(0, 5000) && QuickMath.tooSoon(10000, 10500) && QuickMath.tooSoon(10000, 11499) && !QuickMath.tooSoon(10000, 11500) && !QuickMath.tooSoon(10000, 9000));
        long day = 86400000L, h = 3600000L, im = 100000000L, ft = im + 14 * h;
        ok("iftar line: nothing before imsak, the time left while the fast runs, nothing from iftar to the next imsak",
            QuickMath.iftarLeft(im, ft, im - h) == 0 && QuickMath.iftarLeft(im, ft, im + h) == 13 * h && QuickMath.iftarLeft(im, ft, ft) == 0 && QuickMath.iftarLeft(im, ft, ft + h) == 0);
        ok("iftar line: with the app closed the pair rolls forward by whole days, for at most 3 days",
            QuickMath.iftarLeft(im, ft, im + day + 2 * h) == 12 * h && QuickMath.iftarLeft(im, ft, ft + 2 * day - h) == h && QuickMath.iftarLeft(im, ft, im + 3 * day + h) == 13 * h && QuickMath.iftarLeft(im, ft, ft + 5 * day) == 0);
        ok("iftar line: missing or inverted times give nothing", QuickMath.iftarLeft(0, ft, im + h) == 0 && QuickMath.iftarLeft(im, 0, im + h) == 0 && QuickMath.iftarLeft(ft, im, im + h) == 0);
        ok("parse: empty and null", QuickMath.parse("").isEmpty() && QuickMath.parse(null).isEmpty());

        String n = "{\"id\":200,\"schedule\":{\"at\":\"2026-10-02T08:00\"},\"extra\":{\"act\":\"water\",\"v\":250,\"at\":1790928000000}}";
        ok("token: reads extra.at, not schedule.at", "1790928000000".equals(QuickMath.token(n)) && QuickMath.amount(n) == 250);
        ok("token: null when at is missing or short (old notification, no duplicate check)", QuickMath.token("{\"extra\":{\"act\":\"water\",\"v\":250}}") == null && QuickMath.token("{\"extra\":{\"at\":123}}") == null);
        String sn = QuickMath.remember("", "200@1790928000000");
        ok("duplicate: same notification seen; another at the same time and prefix matches not seen",
            QuickMath.seen(sn, "200@1790928000000") && !QuickMath.seen(sn, "201@1790928000000") && !QuickMath.seen(sn, "0@1790928000000") && !QuickMath.seen("", "200@1"));
        String many = "";
        for (int i = 0; i < 60; i++) many = QuickMath.remember(many, i + "@1790928000000");
        ok("duplicate: last 50 tokens are kept", QuickMath.seen(many, "59@1790928000000") && QuickMath.seen(many, "10@1790928000000") && !QuickMath.seen(many, "9@1790928000000"));
        System.exit(bad == 0 ? 0 : 1);
    }
}
