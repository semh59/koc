package com.neowell.app;

public class LockTextTest {
    static int bad = 0;

    static void ok(String n, boolean c) {
        System.out.println((c ? "PASS " : "FAIL ") + n);
        if (!c) bad++;
    }

    public static void main(String[] a) {
        ok("lock: with detail off the private twin channel is used", "nw_medp".equals(LockText.channel("nw_med", false)));
        ok("lock: with detail on the original channel is used", "nw_med".equals(LockText.channel("nw_med", true)));
        ok("lock: the generic title names no measurement or medication", LockText.TITLE.equals("NeoWell: hatırlatma") && !LockText.TEXT.toLowerCase().contains("ilaç"));
        if (bad > 0) System.exit(1);
    }
}
