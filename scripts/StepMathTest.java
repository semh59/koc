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
        StepMath.State b = new StepMath.State();
        b.bootKnown = true;
        StepMath.update(b, "d1", 60000, 720, h);
        StepMath.update(b, "d1", 60400, 720, h);
        ok("known boot count: a temporary counter drop is neither steps nor a reboot", StepMath.update(b, "d1", 100, 720, h) == 400, b.carry);
        ok("a correct read after a low read does not inflate today", StepMath.update(b, "d1", 60450, 720, h) == 450, b.carry);
        b.rebooted = true;
        ok("changed boot count means counter reset, steps are not lost", StepMath.update(b, "d1", 30, 720, h) == 480, b.carry);
        ok("first read is 0 steps", StepMath.update(s, "d1", 1000, 720, h) == 0, s.base);
        ok("same-day increase", StepMath.update(s, "d1", 1350, 720, h) == 350, 0);
        ok("steps are not lost when the phone reboots", StepMath.update(s, "d1", 120, 720, h) == 470, s.carry);
        ok("increase after reboot", StepMath.update(s, "d1", 200, 720, h) == 550, 0);
        ok("second reboot", StepMath.update(s, "d1", 30, 720, h) == 580, 0);
        long t = StepMath.update(s, "d2", 90, 720, h);
        ok("new day starts from 0", t == 0, t);
        ok("old day is written to history", h.get("d1") == 580, h);
        ok("new day increase", StepMath.update(s, "d2", 400, 720, h) == 310, 0);
        boolean closed = StepMath.closeDay(s, "d3", 1000, 0, h);
        ok("night close writes the old day fully and returns true", closed && h.get("d2") == 910, h);
        ok("new day is 0 after close", StepMath.update(s, "d3", 1000, 720, h) == 0, 0);
        ok("close does nothing on the same day", doNothing(), 0);
        StepMath.State r = new StepMath.State();
        StepMath.update(r, "x", 500, 720, h);
        StepMath.update(r, "x", 800, 720, h);
        StepMath.closeDay(r, "y", 50, 1, h);
        ok("reboot at night close", h.get("x") == 350, h.get("x"));
        // Alarm arrived late at 07:00: the counter includes the new day's steps, which must not go to the old day
        StepMath.State late = new StepMath.State();
        StepMath.update(late, "e1", 1000, 720, h);
        StepMath.update(late, "e1", 1600, 720, h); // last evening read: 600 steps
        boolean lateClosed = StepMath.closeDay(late, "e2", 2500, 420, h); // late alarm at 07:00
        ok("07:00 alarm does not close the old day, returns false (snapAt not written)", !lateClosed && !h.containsKey("e1"), h.get("e1"));
        long morning = StepMath.update(late, "e2", 2500, 720, h);
        ok("late alarm: old day is written up to the last read", h.get("e1") == 600, h.get("e1"));
        ok("late alarm: morning steps do not go to the old day, new day starts from 0", morning == 0, morning);
        // Alarm arrived late at 02:30: steps after the last (evening) read are not lost, they go to the old day
        StepMath.State night = new StepMath.State();
        StepMath.update(night, "n1", 1000, 720, h);
        StepMath.update(night, "n1", 1600, 720, h); // last read at 18:00
        boolean nightClosed = StepMath.closeDay(night, "n2", 4600, 150, h); // 3000 steps in the evening
        ok("02:30 late alarm closes the old day with the evening steps", nightClosed && h.get("n1") == 3600, h.get("n1"));
        ok("new day starts from 0 after 02:30 close", StepMath.update(night, "n2", 4600, 720, h) == 0, 0);
        ok("close on the same day returns false", !StepMath.closeDay(night, "n2", 4700, 10, h), 0);
        // Phone booted in the morning: no day close (the receiver passes closeFirst=false), counter starts from zero
        StepMath.State boot = new StepMath.State();
        StepMath.update(boot, "f1", 5000, 720, h);
        StepMath.update(boot, "f1", 5800, 720, h);
        long afterBoot = StepMath.update(boot, "f2", 30, 720, h);
        ok("boot morning: old day stays at the last read", h.get("f1") == 800, h.get("f1"));
        ok("boot morning: new day starts from 0", afterBoot == 0, afterBoot);
        StepMath.State g = sampled(1000, 1500);
        ok("with a 23:58 sample, the 00:10 close closes the day with the sample", StepMath.closeDay(g, "g2", 1700, 10, h) && h.get("g1") == 500, h.get("g1"));
        ok("steps after 23:58 go to the new day", StepMath.update(g, "g2", 1700, 10, h) == 200, 0);
        StepMath.State g7 = sampled(1000, 1500);
        h.remove("g1");
        ok("with a 23:58 sample, the late 07:00 close also uses the sample", StepMath.closeDay(g7, "g2", 4000, 420, h) && h.get("g1") == 500, h.get("g1"));
        ok("at the 07:00 close, night and morning steps go to the new day", StepMath.update(g7, "g2", 4000, 420, h) == 2500, 0);
        StepMath.State c = new StepMath.State();
        StepMath.update(c, "c1", 1000, 720, h);
        StepMath.update(c, "c1", 1600, 1080, h);
        ok("23:58 alarm arrived after midnight (no sample), old rule: steps up to 00:05 go to the old day",
            StepMath.closeDay(c, "c2", 2600, 5, h) && h.get("c1") == 1600 && StepMath.update(c, "c2", 2600, 5, h) == 0, h.get("c1"));
        StepMath.State d = sampled(1000, 1500);
        h.remove("g1");
        long early = StepMath.update(d, "d2", 1800, 5, h);
        ok("app opened before the night close: old day at the sample, the rest in the new day", h.get("g1") == 500 && early == 300, early);
        ok("a later close on the same day does nothing", !StepMath.closeDay(d, "d2", 1900, 8, h) && StepMath.update(d, "d2", 1900, 8, h) == 400, 0);
        StepMath.State e = sampled(1000, 1500);
        h.remove("g1");
        ok("phone rebooted after the sample: old day at the sample, new day from the reset counter",
            StepMath.closeDay(e, "e2", 40, 10, h) && h.get("g1") == 500 && StepMath.update(e, "e2", 40, 10, h) == 40, h.get("g1"));
        // Day rolled over without a sample, first read at 03:00: steps since the last read go to the old day
        StepMath.State m1 = new StepMath.State();
        StepMath.update(m1, "m1", 1000, 720, h);
        StepMath.update(m1, "m1", 1600, 1080, h);
        long m1t = StepMath.update(m1, "m2", 1900, 180, h);
        ok("rollover without sample, 03:00 read: steps in between go to the old day", h.get("m1") == 900 && m1t == 0, h.get("m1"));
        // Same case with first read at 09:00: the day of the gap is unknowable and not guessed; old day stays at the last read, new day starts from the counter
        StepMath.State m2 = new StepMath.State();
        StepMath.update(m2, "m3", 1000, 720, h);
        StepMath.update(m2, "m3", 1600, 1080, h);
        long m2t = StepMath.update(m2, "m4", 1900, 540, h);
        ok("rollover without sample, 09:00 read: old day at the last read, new day 0", h.get("m3") == 600 && m2t == 0, h.get("m3"));
        // Even if the counter exceeds the last value after a reboot, steps are not lost thanks to rebooted
        StepMath.State rb = new StepMath.State();
        StepMath.update(rb, "r1", 500, 720, h);
        StepMath.update(rb, "r1", 800, 720, h);
        rb.rebooted = true;
        ok("known reboot: total 300 + 900 even if the counter exceeds the last value", StepMath.update(rb, "r1", 900, 720, h) == 1200, rb.carry);
        ok("rebooted flag is consumed", !rb.rebooted && StepMath.update(rb, "r1", 950, 720, h) == 1250, 0);
        // Flying west: the clock's day key goes back; the later stored day is neither closed nor overwritten.
        StepMath.State w = new StepMath.State();
        StepMath.update(w, "2026-10-15", 1000, 720, h);
        StepMath.update(w, "2026-10-15", 1800, 720, h);
        ok("day key going back counts under the stored day", StepMath.update(w, "2026-10-14", 2000, 720, h) == 1000 && w.day.equals("2026-10-15"), w.day);
        ok("day key going back writes nothing to history", !h.containsKey("2026-10-15") && !h.containsKey("2026-10-14"), h);
        ok("close alarm ignores a day key that went back", !StepMath.closeDay(w, "2026-10-14", 2100, 0, h) && w.day.equals("2026-10-15"), w.day);
        System.exit(bad == 0 ? 0 : 1);
    }

    /** Day g1: noon read and 23:58 sample. */
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
