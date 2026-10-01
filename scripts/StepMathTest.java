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
        ok("ilk okuma 0 adım", StepMath.update(s, "d1", 1000, h) == 0, s.base);
        ok("aynı gün artış", StepMath.update(s, "d1", 1350, h) == 350, 0);
        ok("telefon yeniden başlayınca adımlar kaybolmaz", StepMath.update(s, "d1", 120, h) == 470, s.carry);
        ok("yeniden başlama sonrası artış", StepMath.update(s, "d1", 200, h) == 550, 0);
        ok("ikinci yeniden başlama", StepMath.update(s, "d1", 30, h) == 580, 0);
        long t = StepMath.update(s, "d2", 90, h);
        ok("yeni gün 0'dan başlar", t == 0, t);
        ok("eski gün geçmişe yazılır", h.get("d1") == 580, h);
        ok("yeni gün artışı", StepMath.update(s, "d2", 400, h) == 310, 0);
        StepMath.closeDay(s, "d3", 1000, h);
        ok("gece kapanışı eski günü tam yazar", h.get("d2") == 910, h);
        ok("kapanıştan sonra yeni gün 0", StepMath.update(s, "d3", 1000, h) == 0, 0);
        ok("kapanış aynı günde bir şey yapmaz", doNothing(), 0);
        StepMath.State r = new StepMath.State();
        StepMath.update(r, "x", 500, h);
        StepMath.update(r, "x", 800, h);
        StepMath.closeDay(r, "y", 50, h);
        ok("gece kapanışında yeniden başlama", h.get("x") == 350, h.get("x"));
        System.exit(bad == 0 ? 0 : 1);
    }

    static boolean doNothing() {
        StepMath.State z = new StepMath.State();
        Map<String, Long> m = new HashMap<>();
        StepMath.update(z, "k", 10, m);
        StepMath.closeDay(z, "k", 99, m);
        return m.isEmpty() && z.day.equals("k");
    }
}
