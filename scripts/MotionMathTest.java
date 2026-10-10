package com.neowell.app;

public class MotionMathTest {
    static int bad = 0;

    static void ok(String n, boolean c) {
        System.out.println((c ? "PASS " : "FAIL ") + n);
        if (!c) bad++;
    }

    static boolean near(double a, double b, double tol) {
        return Math.abs(a - b) <= tol;
    }

    public static void main(String[] a) {
        ok("expected stride: walk 110/min, height 170", near(MotionMath.priorStride(MotionMath.WALK, 170, 110), 0.697, 0.001));
        ok("expected stride: run 170/min", near(MotionMath.priorStride(MotionMath.RUN, 170, 170), 1.1713, 0.001));
        ok("unknown height defaults to 170", near(MotionMath.priorStride(MotionMath.WALK, 0, 110), 0.697, 0.001) && near(MotionMath.priorStride(MotionMath.WALK, 999, 110), 0.697, 0.001));
        ok("stride grows with cadence", MotionMath.priorStride(MotionMath.WALK, 170, 130) > MotionMath.priorStride(MotionMath.WALK, 170, 100));


        MotionMath.Model m = new MotionMath.Model();
        ok("sample: plausible GPS stride enters the model", MotionMath.addSample(m, MotionMath.WALK, 170, 110, 0.766) && near(m.f[0], 1.0495, 0.001) && m.n[0] == 1);
        ok("sample: impossible stride is rejected", !MotionMath.addSample(m, MotionMath.WALK, 170, 110, 1.6) && m.n[0] == 1);
        ok("sample: impossible cadence is rejected", !MotionMath.addSample(m, MotionMath.WALK, 170, 30, 0.5) && !MotionMath.addSample(m, MotionMath.WALK, 170, 250, 0.5));
        ok("scale stays within 0.7-1.3", (new Object() {
            boolean run() {
                MotionMath.Model x = new MotionMath.Model();
                for (int i = 0; i < 200; i++) MotionMath.addSample(x, MotionMath.RUN, 170, 170, 1.1713 * 1.45);
                return x.f[1] <= 1.3 && x.f[1] > 1.25;
            }
        }).run());
        ok("learned scale is reflected in stride", near(MotionMath.stride(m, MotionMath.WALK, 170, 110), 0.697 * 1.0495, 0.002));

        MotionMath.Model r = MotionMath.Model.dec(m.enc());
        ok("model: encode/decode round-trips", r.enc().equals(m.enc()) && r.n[0] == 1 && near(r.f[0], m.f[0], 1e-9));
        ok("model: corrupt text falls back to default", MotionMath.Model.dec("x").n[0] == 0 && MotionMath.Model.dec(null).f[1] == 1 && MotionMath.Model.dec("1,1,0,0,-1,-1,a").f[0] == 1 && MotionMath.Model.dec("9,1,0,0").f[0] == 1 && MotionMath.Model.dec("1,1,0").f[0] == 1);

        ok("GPS fix: good", MotionMath.goodFix(10, 0.5f, 1.4f) && MotionMath.goodFix(10, -1f, 1.4f));
        ok("GPS fix: bad accuracy, speed accuracy or speed is rejected", !MotionMath.goodFix(20, 0.5f, 1.4f) && !MotionMath.goodFix(10, 1.2f, 1.4f) && !MotionMath.goodFix(10, 0.5f, -1f) && !MotionMath.goodFix(0, 0.5f, 1f) && !MotionMath.goodFix(10, 0.5f, 16f));

        ok("median and deviation", MotionMath.median(new double[] {3, 1, 2, 100, 100}, 3) == 2 && MotionMath.median(new double[] {1, 2, 3, 4}, 4) == 2.5 && Double.isNaN(MotionMath.median(new double[0], 0)) && MotionMath.stdev(new double[] {2, 2, 2}, 3) == 0);

        ok("vehicle: high speed, or fast with slow cadence", MotionMath.vehicle(10, 50) && MotionMath.vehicle(5, 60) && !MotionMath.vehicle(5, 160) && !MotionMath.vehicle(3, 120));

        ok("classify: GPS speed dominates", MotionMath.classify(MotionMath.WALK, 100, 2.5) == MotionMath.RUN && MotionMath.classify(MotionMath.RUN, 170, 1.5) == MotionMath.WALK);
        ok("classify: ambiguous speed uses cadence and activity recognition", MotionMath.classify(MotionMath.WALK, 130, 2.0) == MotionMath.WALK && MotionMath.classify(MotionMath.RUN, 140, Double.NaN) == MotionMath.RUN && MotionMath.classify(MotionMath.WALK, 170, Double.NaN) == MotionMath.RUN && MotionMath.classify(MotionMath.RUN, 100, Double.NaN) == MotionMath.WALK);

        ok("MET: walk table and interpolation", MotionMath.met(MotionMath.WALK, 4.8) == 3.5 && near(MotionMath.met(MotionMath.WALK, 5.2), 3.9, 1e-9) && MotionMath.met(MotionMath.WALK, 2) == 2.8 && MotionMath.met(MotionMath.WALK, 20) == 7.0);
        ok("MET: run table and upper bound", MotionMath.met(MotionMath.RUN, 9.7) == 9.8 && MotionMath.met(MotionMath.RUN, 20) == 14.5);
        ok("kcal: net energy", near(MotionMath.kcal(MotionMath.WALK, 4.8, 70, 60), 175, 1e-9) && MotionMath.kcal(MotionMath.WALK, 4.8, 70, 0) == 0);
        ok("kcal: about 0.5 kcal/kg/km for walking", near(MotionMath.kcal(MotionMath.WALK, 5.0, 70, 60) / 70 / 5.0, 0.5, 0.06));

        MotionMath.Model f = new MotionMath.Model();
        MotionMath.Bout w = MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1100, Double.NaN);
        ok("bout: walk summary", w.ok && w.mode == MotionMath.WALK && near(w.km, 0.7667, 0.002) && near(w.kmh, 4.6, 0.02) && near(w.kcal, 27.7, 0.3));
        MotionMath.Bout k = MotionMath.bout(f, MotionMath.RUN, 170, 70, 10, 1700, Double.NaN);
        ok("bout: run summary", k.ok && k.mode == MotionMath.RUN && near(k.km, 1.991, 0.005) && near(k.kmh, 11.95, 0.05) && k.kcal > 100);
        ok("bout: high cadence is a run even if activity recognition says walk", MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1700, Double.NaN).mode == MotionMath.RUN);
        ok("bout: GPS speed corrects the walk/run decision", MotionMath.bout(f, MotionMath.RUN, 170, 70, 10, 1300, 1.5).mode == MotionMath.WALK);
        ok("bout: short duration or few steps is dropped", !MotionMath.bout(f, MotionMath.WALK, 170, 70, 2.9, 400, Double.NaN).ok && !MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 149, Double.NaN).ok);
        ok("bout: impossible cadence is dropped (shaking)", !MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 3000, Double.NaN).ok && !MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 400, Double.NaN).ok);
        ok("bout: no weight gives kcal -1", MotionMath.bout(f, MotionMath.WALK, 170, 0, 10, 1100, Double.NaN).kcal == -1);
        ok("bout: learned longer stride increases distance", (new Object() {
            boolean run() {
                MotionMath.Model x = new MotionMath.Model();
                for (int i = 0; i < 6; i++) MotionMath.addSample(x, MotionMath.WALK, 170, 110, 0.697 * 1.2);
                return MotionMath.bout(x, MotionMath.WALK, 170, 70, 10, 1100, Double.NaN).km > MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1100, Double.NaN).km * 1.15;
            }
        }).run());


        long[] t1 = {0, 300000, 600000};
        long[] s1 = {0, 500, 800};
        MotionMath.Bout pf = MotionMath.path(f, MotionMath.WALK, 170, 70, t1, s1, 3, Double.NaN);
        MotionMath.Bout av = MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 800, Double.NaN);
        ok("path: tiring walk (100/min, then 60/min) gives per-slice kcal", pf.ok && pf.steps == 800 && near(pf.kcal, 22.46, 0.1) && Math.abs(pf.kcal - av.kcal) > 0.5);
        ok("path: per-slice distance matches hand calculation", near(pf.km, 500 * MotionMath.priorStride(MotionMath.WALK, 170, 100) / 1000 + 300 * MotionMath.priorStride(MotionMath.WALK, 170, 60) / 1000, 1e-6));
        long[] t2 = {0, 300000, 600000};
        long[] s2 = {0, 600, 1200};
        ok("path: steady pace equals the average", near(MotionMath.path(f, MotionMath.WALK, 170, 70, t2, s2, 3, Double.NaN).km, MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1200, Double.NaN).km, 1e-6));
        long[] t3 = {0, 300000, 600000, 900000};
        long[] s3 = {0, 600, 600, 1200};
        MotionMath.Bout pa = MotionMath.path(f, MotionMath.WALK, 170, 70, t3, s3, 4, Double.NaN);
        ok("path: mid-way pause adds no kcal", pa.ok && near(pa.kcal, MotionMath.kcal(MotionMath.WALK, 600 * MotionMath.priorStride(MotionMath.WALK, 170, 120) / 1000 / (5.0 / 60), 70, 5) * 2, 0.5));
        long[] t4 = {0, 300000, 600000};
        long[] s4 = {0, 800, 1500};
        MotionMath.Bout pm = MotionMath.path(f, MotionMath.RUN, 170, 70, t4, s4, 3, Double.NaN);
        ok("path: run-dominated slices give mode run", pm.ok && pm.mode == MotionMath.RUN && pm.kcal > 80);
        ok("path: short, few-step or single-point is dropped", !MotionMath.path(f, MotionMath.WALK, 170, 70, new long[] {0, 60000, 120000}, new long[] {0, 100, 200}, 3, Double.NaN).ok && !MotionMath.path(f, MotionMath.WALK, 170, 70, new long[] {0}, new long[] {0}, 1, Double.NaN).ok);
        ok("path: two points equal bout", near(MotionMath.path(f, MotionMath.WALK, 170, 70, new long[] {0, 600000}, new long[] {0, 1100}, 2, Double.NaN).km, MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1100, Double.NaN).km, 1e-9));
        // Midnight: 23:50-00:10; day 1 goes 0->1100 (10 min), at 00:00:30 the new day's counter goes 40->1140 (10 min); the slice between is dropped.
        long M = 60000;
        long[] tn = {0, 5 * M, 10 * M, 10 * M + 30000, 20 * M + 30000};
        long[] sn = {0, 550, 1100, 40, 1140};
        int[] dn = {1, 1, 1, 2, 2};
        java.util.List<MotionMath.Bout> sp = MotionMath.split(f, MotionMath.WALK, 170, 70, tn, sn, dn, 5, Double.NaN);
        ok("split: a bout crossing midnight is split in two days, steps from each day's counter", sp.size() == 2 && sp.get(0).steps == 1100 && sp.get(1).steps == 1100 && sp.get(0).t0 == 0 && sp.get(0).t1 == 10 * M && sp.get(1).t0 == 10 * M + 30000 && sp.get(1).t1 == 20 * M + 30000);
        ok("split: the cross-day slice adds no kcal (no double counting)", near(sp.get(0).kcal + sp.get(1).kcal, 2 * w.kcal, 0.01));
        java.util.List<MotionMath.Bout> sq = MotionMath.split(f, MotionMath.WALK, 170, 70, new long[] {0, 5 * M, 10 * M, 12 * M}, new long[] {0, 550, 1100, 30}, new int[] {1, 1, 1, 2}, 4, Double.NaN);
        ok("split: no checkpoint in the new day drops that part, previous day is kept", sq.size() == 1 && sq.get(0).steps == 1100 && sq.get(0).t1 == 10 * M);
        ok("split: also splits when the counter goes backwards within a day", MotionMath.split(f, MotionMath.WALK, 170, 70, new long[] {0, 10 * M, 11 * M, 21 * M}, new long[] {5000, 6100, 10, 1110}, new int[] {1, 1, 1, 1}, 4, Double.NaN).size() == 2);
        java.util.List<MotionMath.Bout> one = MotionMath.split(f, MotionMath.WALK, 170, 70, t1, s1, new int[] {1, 1, 1}, 3, Double.NaN);
        ok("split: single day equals path", one.size() == 1 && near(one.get(0).kcal, pf.kcal, 1e-9) && one.get(0).t0 == 0 && one.get(0).t1 == 600000);
        ok("split: invalid piece is not listed", MotionMath.split(f, MotionMath.WALK, 170, 70, new long[] {0, M, 2 * M}, new long[] {0, 100, 10}, new int[] {1, 1, 2}, 3, Double.NaN).isEmpty());
        long mid = 20000L * 86400000L - 3 * 3600000L; // UTC+3 midnight
        ok("day: event time is kept when event and counter reading are on the same day", MotionMath.onCounterDay(mid - 60000, 10800000, mid - 2000, 10800000) == mid - 60000);
        ok("day: event before midnight and reading after uses the counter's time", MotionMath.onCounterDay(mid - 2000, 10800000, mid + 1000, 10800000) == mid + 1000);
        System.exit(bad == 0 ? 0 : 1);
    }
}
