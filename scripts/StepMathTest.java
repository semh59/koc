package com.neowell.app;

import java.util.HashMap;
import java.util.Map;

public class StepMathTest {
    static int bad = 0;

    static void ok(String n, boolean c, Object x) {
        System.out.println((c ? "PASS " : "FAIL ") + n + (c ? "" : " -> " + x));
        if (!c) bad++;
    }

    public static void main(String[] a) {
        StepMath.State s = new StepMath.State();
        Map<String, Long> h = new HashMap<>();
        ok("ilk okuma 0 adım", StepMath.update(s, "d1", 1000, 720, h) == 0, s.base);
        ok("aynı gün artış", StepMath.update(s, "d1", 1350, 720, h) == 350, 0);
        ok("telefon yeniden başlayınca adımlar kaybolmaz", StepMath.update(s, "d1", 120, 720, h) == 470, s.carry);
        ok("yeniden başlama sonrası artış", StepMath.update(s, "d1", 200, 720, h) == 550, 0);
        ok("ikinci yeniden başlama", StepMath.update(s, "d1", 30, 720, h) == 580, 0);
        long t = StepMath.update(s, "d2", 90, 720, h);
        ok("yeni gün 0'dan başlar", t == 0, t);
        ok("eski gün geçmişe yazılır", h.get("d1") == 580, h);
        ok("yeni gün artışı", StepMath.update(s, "d2", 400, 720, h) == 310, 0);
        boolean closed = StepMath.closeDay(s, "d3", 1000, 0, h);
        ok("gece kapanışı eski günü tam yazar ve true döner", closed && h.get("d2") == 910, h);
        ok("kapanıştan sonra yeni gün 0", StepMath.update(s, "d3", 1000, 720, h) == 0, 0);
        ok("kapanış aynı günde bir şey yapmaz", doNothing(), 0);
        StepMath.State r = new StepMath.State();
        StepMath.update(r, "x", 500, 720, h);
        StepMath.update(r, "x", 800, 720, h);
        StepMath.closeDay(r, "y", 50, 1, h);
        ok("gece kapanışında yeniden başlama", h.get("x") == 350, h.get("x"));
        // Alarm sabah 07:00'de geç geldi: sayaç yeni günün adımlarını da içerir, eski güne yazılmamalı
        StepMath.State late = new StepMath.State();
        StepMath.update(late, "e1", 1000, 720, h);
        StepMath.update(late, "e1", 1600, 720, h); // akşam son okuma: 600 adım
        boolean lateClosed = StepMath.closeDay(late, "e2", 2500, 420, h); // 07:00'de geç alarm
        ok("07:00 alarmı eski günü kapatmaz, false döner (snapAt yazılmaz)", !lateClosed && !h.containsKey("e1"), h.get("e1"));
        long morning = StepMath.update(late, "e2", 2500, 720, h);
        ok("geç alarmda eski gün son okumaya kadar yazılır", h.get("e1") == 600, h.get("e1"));
        ok("geç alarmda sabah adımları eski güne geçmez, yeni gün 0'dan başlar", morning == 0, morning);
        // Alarm 02:30'da geç geldi: son okumadan (akşam) sonraki adımlar kaybolmaz, eski güne yazılır
        StepMath.State night = new StepMath.State();
        StepMath.update(night, "n1", 1000, 720, h);
        StepMath.update(night, "n1", 1600, 720, h); // 18:00 son okuma
        boolean nightClosed = StepMath.closeDay(night, "n2", 4600, 150, h); // akşam 3000 adım
        ok("02:30 geç alarmı akşam adımlarıyla eski günü kapatır", nightClosed && h.get("n1") == 3600, h.get("n1"));
        ok("02:30 kapanışından sonra yeni gün 0'dan başlar", StepMath.update(night, "n2", 4600, 720, h) == 0, 0);
        ok("aynı günde kapanış false döner", !StepMath.closeDay(night, "n2", 4700, 10, h), 0);
        // Telefon sabah açıldı: gün kapatması yapılmaz (alıcı closeFirst=false verir), sayaç sıfırdan başlar
        StepMath.State boot = new StepMath.State();
        StepMath.update(boot, "f1", 5000, 720, h);
        StepMath.update(boot, "f1", 5800, 720, h);
        long afterBoot = StepMath.update(boot, "f2", 30, 720, h);
        ok("açılış sabahı: eski gün son okumada kalır", h.get("f1") == 800, h.get("f1"));
        ok("açılış sabahı: yeni gün 0'dan başlar", afterBoot == 0, afterBoot);
        StepMath.State g = sampled(1000, 1500);
        ok("23:58 örneği varken 00:10 kapanışı günü örnekle kapatır", StepMath.closeDay(g, "g2", 1700, 10, h) && h.get("g1") == 500, h.get("g1"));
        ok("23:58 sonrası adımlar yeni güne yazılır", StepMath.update(g, "g2", 1700, 10, h) == 200, 0);
        StepMath.State g7 = sampled(1000, 1500);
        h.remove("g1");
        ok("23:58 örneği varken 07:00 geç kapanış da örnekle kapatır", StepMath.closeDay(g7, "g2", 4000, 420, h) && h.get("g1") == 500, h.get("g1"));
        ok("07:00 kapanışında gece ve sabah adımları yeni güne", StepMath.update(g7, "g2", 4000, 420, h) == 2500, 0);
        StepMath.State c = new StepMath.State();
        StepMath.update(c, "c1", 1000, 720, h);
        StepMath.update(c, "c1", 1600, 1080, h);
        ok("23:58 alarmı gece yarısından sonra geldiyse (örnek yok) eski kural: 00:05'e kadarki adımlar eski güne",
            StepMath.closeDay(c, "c2", 2600, 5, h) && h.get("c1") == 1600 && StepMath.update(c, "c2", 2600, 5, h) == 0, h.get("c1"));
        StepMath.State d = sampled(1000, 1500);
        h.remove("g1");
        long early = StepMath.update(d, "d2", 1800, 5, h);
        ok("gece kapanışından önce uygulama açıldı: eski gün örnekte, sonrası yeni günde", h.get("g1") == 500 && early == 300, early);
        ok("ardından gelen geç kapanış aynı günde bir şey yapmaz", !StepMath.closeDay(d, "d2", 1900, 8, h) && StepMath.update(d, "d2", 1900, 8, h) == 400, 0);
        StepMath.State e = sampled(1000, 1500);
        h.remove("g1");
        ok("örnekten sonra telefon yeniden başladı: eski gün örnekte, yeni gün sıfırlanan sayaçtan",
            StepMath.closeDay(e, "e2", 40, 10, h) && h.get("g1") == 500 && StepMath.update(e, "e2", 40, 10, h) == 40, h.get("g1"));
        System.exit(bad == 0 ? 0 : 1);
    }

    /** g1 günü: öğlen okuması ve 23:58 örneği. */
    static StepMath.State sampled(float noon, float at2358) {
        StepMath.State s = new StepMath.State();
        Map<String, Long> m = new HashMap<>();
        StepMath.update(s, "g1", noon, 720, m);
        StepMath.update(s, "g1", at2358, StepMath.SAMPLE_MINUTES, m);
        return s;
    }

    static boolean doNothing() {
        StepMath.State z = new StepMath.State();
        Map<String, Long> m = new HashMap<>();
        StepMath.update(z, "k", 10, 720, m);
        StepMath.closeDay(z, "k", 99, 0, m);
        return m.isEmpty() && z.day.equals("k");
    }
}
