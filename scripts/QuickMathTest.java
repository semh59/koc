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
        ok("miktar: v extra'dan önce gelen alanlarda değil extra içinde aranır", QuickMath.amount("{\"v\":999,\"extra\":{\"act\":\"su\",\"v\":150}}") == 150);
        ok("miktar: extra yoksa 0", QuickMath.amount("{\"id\":200}") == 0 && QuickMath.amount(null) == 0 && QuickMath.amount("") == 0);
        ok("miktar: sınır dışı 0", QuickMath.amount("{\"extra\":{\"v\":0}}") == 0 && QuickMath.amount("{\"extra\":{\"v\":1501}}") == 0 && QuickMath.amount("{\"extra\":{\"v\":99999}}") == 0);
        ok("miktar: sınır değerler geçerli", QuickMath.amount("{\"extra\":{\"v\":1}}") == 1 && QuickMath.amount("{\"extra\":{\"v\":1500}}") == 1500);
        ok("miktar: sayı olmayan v 0", QuickMath.amount("{\"extra\":{\"v\":\"abc\"}}") == 0);

        String s = QuickMath.append("", 250, 1000L);
        s = QuickMath.append(s, 200, 2000L);
        List<long[]> l = QuickMath.parse(s);
        ok("ekleme: iki kayıt sırayla", l.size() == 2 && l.get(0)[0] == 250 && l.get(0)[1] == 1000L && l.get(1)[0] == 200);
        ok("ekleme: null başlangıç", QuickMath.parse(QuickMath.append(null, 250, 5L)).size() == 1);

        String big = "";
        for (int i = 1; i <= 250; i++) big = QuickMath.append(big, 100, i);
        List<long[]> bl = QuickMath.parse(big);
        ok("sınır: en çok 200 kayıt, en eskiler atılır", bl.size() == 200 && bl.get(0)[1] == 51 && bl.get(199)[1] == 250);

        List<long[]> m = QuickMath.parse("250,1000;abc;,5;100,;0,50;5000,70;300,0;-5,10;200,3000;;300,4000,9;");
        ok("ayrıştırma: bozuk ve sınır dışı parçalar atlanır", m.size() == 2 && m.get(0)[0] == 250 && m.get(1)[0] == 200);
        ok("ayrıştırma: boş ve null", QuickMath.parse("").isEmpty() && QuickMath.parse(null).isEmpty());
        System.exit(bad == 0 ? 0 : 1);
    }
}
