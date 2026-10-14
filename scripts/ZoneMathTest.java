package com.neowell.app;

import java.util.TimeZone;

public class ZoneMathTest {
    static int bad = 0;

    static void ok(String n, boolean c) {
        System.out.println((c ? "PASS " : "FAIL ") + n);
        if (!c) bad++;
    }

    public static void main(String[] a) {
        TimeZone ist = TimeZone.getTimeZone("Europe/Istanbul"), ber = TimeZone.getTimeZone("Europe/Berlin"), nyc = TimeZone.getTimeZone("America/New_York");
        long at = 1791954000000L; // 2026-10-14 08:00 Istanbul (UTC+3)
        ok("zone: 08:00 Istanbul becomes 08:00 Berlin (Berlin is one hour behind Istanbul so the instant is one hour later)", ZoneMath.move(at, ist, ber) == at + 3600000L);
        ok("zone: the same zone changes nothing", ZoneMath.move(at, ist, ist) == at);
        ok("zone: there and back gives the same instant", ZoneMath.move(ZoneMath.move(at, ist, nyc), nyc, ist) == at);
        long[] m = ZoneMath.move(new long[] {0, at}, ist, ber);
        ok("zone: unset entries stay 0", m[0] == 0 && m[1] == at + 3600000L);
    }
}
