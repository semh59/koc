package com.neowell.app;

import java.util.List;

public class QuickMathTest {
    static int bad = 0;

    static void ok(String n, boolean c) {
        System.out.println((c ? "PASS " : "FAIL ") + n);
        if (!c) bad++;
    }

    public static void main(String[] a) {
        ok("miktar: extra içindeki v okunur", QuickMath.amount("{\"id\":200,\"extra\":{\"act\":\"su\",\"v\":250}}") == 250);
        ok("miktar: alan sırası önemli değil", QuickMath.amount("{\"extra\":{\"v\":300,\"act\":\"su\"}}") == 300);
        ok("miktar: extra dışındaki v sayılmaz", QuickMath.amount("{\"v\":999,\"extra\":{\"act\":\"su\",\"v\":150}}") == 150);
        ok("miktar: extra yoksa 0", QuickMath.amount("{\"id\":200}") == 0 && QuickMath.amount(null) == 0 && QuickMath.amount("") == 0);
        ok("miktar: sınır dışı 0", QuickMath.amount("{\"extra\":{\"v\":0}}") == 0 && QuickMath.amount("{\"extra\":{\"v\":1501}}") == 0 && QuickMath.amount("{\"extra\":{\"v\":99999}}") == 0);
        ok("miktar: sınır değerler geçerli", QuickMath.amount("{\"extra\":{\"v\":1}}") == 1 && QuickMath.amount("{\"extra\":{\"v\":1500}}") == 1500);
        ok("miktar: sayı olmayan ya da ondalık v 0", QuickMath.amount("{\"extra\":{\"v\":\"abc\"}}") == 0 && QuickMath.amount("{\"extra\":{\"v\":2.5}}") == 0);

        ok("ilaç: kimlik ve saat okunur", "m12_0800".equals(QuickMath.medKey("{\"extra\":{\"act\":\"med\",\"m\":12,\"s\":\"08:00\"}}")));
        ok("ilaç: alan sırası önemli değil", "m5_2330".equals(QuickMath.medKey("{\"extra\":{\"s\":\"23:30\",\"act\":\"med\",\"m\":5}}")));
        ok("ilaç: eksik alan null", QuickMath.medKey("{\"extra\":{\"m\":12}}") == null && QuickMath.medKey("{\"extra\":{\"s\":\"08:00\"}}") == null && QuickMath.medKey(null) == null && QuickMath.medKey("{}") == null);
        ok("ilaç: bozuk saat ve sınır dışı kimlik null", QuickMath.medKey("{\"extra\":{\"m\":1,\"s\":\"25:00\"}}") == null && QuickMath.medKey("{\"extra\":{\"m\":1,\"s\":\"8:00\"}}") == null && QuickMath.medKey("{\"extra\":{\"m\":0,\"s\":\"08:00\"}}") == null && QuickMath.medKey("{\"extra\":{\"m\":1000,\"s\":\"08:00\"}}") == null);
        ok("ilaç: su bildirimi ilaç anahtarı üretmez", QuickMath.medKey("{\"extra\":{\"act\":\"su\",\"v\":250}}") == null);

        ok("ilaç: atla anahtarı k ile başlar", "k12_0800".equals(QuickMath.medKey("{\"extra\":{\"act\":\"med\",\"m\":12,\"s\":\"08:00\"}}", true)));

        String sec = "0123456789abcdef0123456789abcdef";
        ok("anahtar: extra.tk eşitse imzalı", QuickMath.signed("{\"extra\":{\"act\":\"su\",\"v\":250,\"tk\":\"" + sec + "\"}}", sec));
        ok("anahtar: tk yok, yanlış, extra dışında ya da gizli anahtar yoksa imzasız",
            !QuickMath.signed("{\"extra\":{\"act\":\"su\",\"v\":250}}", sec)
                && !QuickMath.signed("{\"extra\":{\"tk\":\"00000000000000000000000000000000\"}}", sec)
                && !QuickMath.signed("{\"tk\":\"" + sec + "\",\"extra\":{\"act\":\"su\"}}", sec)
                && !QuickMath.signed("{\"extra\":{\"tk\":\"" + sec.substring(1) + "\"}}", sec.substring(1))
                && !QuickMath.signed(null, sec) && !QuickMath.signed("{\"extra\":{\"tk\":\"" + sec + "\"}}", null));

        String s = QuickMath.append("", "250", 1000L);
        s = QuickMath.append(s, "m12_0800", 2000L);
        List<String[]> l = QuickMath.parse(s);
        ok("ekleme: iki kayıt sırayla", l.size() == 2 && l.get(0)[0].equals("250") && l.get(0)[1].equals("1000") && l.get(1)[0].equals("m12_0800"));
        ok("ekleme: null başlangıç", QuickMath.parse(QuickMath.append(null, "250", 5L)).size() == 1);

        String big = "";
        for (int i = 1; i <= 250; i++) big = QuickMath.append(big, "100", i);
        List<String[]> bl = QuickMath.parse(big);
        ok("sınır: en çok 200 kayıt, en eskiler atılır", bl.size() == 200 && bl.get(0)[1].equals("51") && bl.get(199)[1].equals("250"));

        List<String[]> m = QuickMath.parse("250,1000;abc;,5;100,;0,50;5000,70;300,0;-5,10;200,3000;;300,4000,9;m7_0900,10;k7_0900,11;m7_9,10;mx_0800,10;m1000_0800,10;");
        ok("ayrıştırma: bozuk ve sınır dışı parçalar atlanır", m.size() == 4 && m.get(0)[0].equals("250") && m.get(1)[0].equals("200") && m.get(2)[0].equals("m7_0900") && m.get(3)[0].equals("k7_0900"));
        ok("ayrıştırma: boş ve null", QuickMath.parse("").isEmpty() && QuickMath.parse(null).isEmpty());

        String n = "{\"id\":200,\"schedule\":{\"at\":\"2026-10-02T08:00\"},\"extra\":{\"act\":\"su\",\"v\":250,\"at\":1790928000000}}";
        ok("imza: extra.at okunur, schedule.at karışmaz", "1790928000000".equals(QuickMath.token(n)) && QuickMath.amount(n) == 250);
        ok("imza: at yoksa ya da kısaysa null (eski bildirim, tekrar denetimi yok)", QuickMath.token("{\"extra\":{\"act\":\"su\",\"v\":250}}") == null && QuickMath.token("{\"extra\":{\"at\":123}}") == null);
        String sn = QuickMath.remember("", "200@1790928000000");
        ok("tekrar: aynı bildirim görülmüş, aynı saatteki başka bildirim ve önek eşleşmesi görülmemiş",
            QuickMath.seen(sn, "200@1790928000000") && !QuickMath.seen(sn, "201@1790928000000") && !QuickMath.seen(sn, "0@1790928000000") && !QuickMath.seen("", "200@1"));
        String many = "";
        for (int i = 0; i < 60; i++) many = QuickMath.remember(many, i + "@1790928000000");
        ok("tekrar: son 50 imza tutulur", QuickMath.seen(many, "59@1790928000000") && QuickMath.seen(many, "10@1790928000000") && !QuickMath.seen(many, "9@1790928000000"));
        System.exit(bad == 0 ? 0 : 1);
    }
}
