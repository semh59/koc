package com.neowell.app;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Motion detection logic (no Android dependency, unit-testable): stride-length model, walk/run decision, MET calories. */
final class MotionMath {
    static final int WALK = 0, RUN = 1;
    static final double DEFAULT_CM = 170;
    /** Plausible step rate (steps per minute); outside it the samples are shaking or noise. */
    static final double MIN_CADENCE = 50, MAX_CADENCE = 220;
    private static final double SCALE_MIN = 0.7, SCALE_MAX = 1.3;

    /** Expected stride length (m) for a cadence: height x (a + b x cadence). A walk at 110 steps/min gives height x 0.41. */
    static double priorStride(int mode, double cm, double cad) {
        double h = (cm >= 120 && cm <= 230 ? cm : DEFAULT_CM) / 100.0;
        double c = Math.max(40, Math.min(MAX_CADENCE, cad));
        return mode == RUN ? h * (0.40 + 0.0017 * c) : h * (0.30 + 0.0010 * c);
    }

    /** Personal scale (f) and sample count (n), separate for walking and running. */
    static final class Model {
        final double[] f = {1, 1};
        final int[] n = new int[2];

        String enc() {
            return f[0] + "," + f[1] + "," + n[0] + "," + n[1];
        }

        static Model dec(String s) {
            Model m = new Model();
            if (s == null) return m;
            String[] p = s.split(",");
            if (p.length != 4) return m;
            try {
                double f0 = Double.parseDouble(p[0]), f1 = Double.parseDouble(p[1]);
                int n0 = Integer.parseInt(p[2]), n1 = Integer.parseInt(p[3]);
                if (!(f0 >= SCALE_MIN && f0 <= SCALE_MAX && f1 >= SCALE_MIN && f1 <= SCALE_MAX) || n0 < 0 || n1 < 0 || n0 > 100000 || n1 > 100000) return m;
                m.f[0] = f0; m.f[1] = f1; m.n[0] = n0; m.n[1] = n1;
            } catch (NumberFormatException e) {
                return new Model();
            }
            return m;
        }
    }

    static double stride(Model m, int mode, double cm, double cad) {
        return priorStride(mode, cm, cad) * m.f[mode];
    }

    /** Whether the stride length measured with GPS (speed / cadence) is plausible; if so it is blended into the model. */
    static boolean addSample(Model m, int mode, double cm, double cad, double strideObs) {
        double prior = priorStride(mode, cm, cad), r = strideObs / prior;
        if (!(cad >= MIN_CADENCE && cad <= MAX_CADENCE) || !(r >= 0.6 && r <= 1.5)) return false;
        double w = m.n[mode] < 10 ? 1.0 / (m.n[mode] + 2) : 0.12;
        m.f[mode] = Math.max(SCALE_MIN, Math.min(SCALE_MAX, m.f[mode] * (1 - w) + r * w));
        m.n[mode]++;
        return true;
    }

    /** Whether the Doppler speed is reliable: position accuracy <= 15 m, and speed accuracy <= 0.8 m/s when known. */
    static boolean goodFix(float acc, float speedAcc, float speed) {
        return acc > 0 && acc <= 15 && speed >= 0 && speed <= 15 && (speedAcc < 0 || speedAcc <= 0.8f);
    }

    static double median(double[] a, int n) {
        if (n == 0) return Double.NaN;
        double[] c = Arrays.copyOf(a, n);
        Arrays.sort(c);
        return n % 2 == 1 ? c[n / 2] : (c[n / 2 - 1] + c[n / 2]) / 2;
    }

    static double stdev(double[] a, int n) {
        if (n < 2) return 0;
        double s = 0, q = 0;
        for (int i = 0; i < n; i++) s += a[i];
        double mu = s / n;
        for (int i = 0; i < n; i++) q += (a[i] - mu) * (a[i] - mu);
        return Math.sqrt(q / (n - 1));
    }

    /** Vehicle: high speed with low cadence (or a speed impossible for a runner). */
    static boolean vehicle(double speed, double cad) {
        return speed > 7 || (speed > 4.2 && cad < 100);
    }

    /** Walk/run decision from the activity-recognition type, the cadence and (when known) the GPS speed. */
    static int classify(int arMode, double cad, double speed) {
        if (!Double.isNaN(speed)) {
            if (speed >= 2.3) return RUN;
            if (speed <= 1.9) return WALK;
        }
        if (cad >= 165) return RUN;
        if (cad < 120) return WALK;
        return arMode;
    }

    private static final double[] WK = {3.2, 4.0, 4.8, 5.6, 6.4, 7.2}, WM = {2.8, 3.0, 3.5, 4.3, 5.0, 7.0};
    private static final double[] RK = {8.0, 9.7, 11.3, 12.9, 14.5, 16.1}, RM = {8.3, 9.8, 11.0, 11.8, 12.8, 14.5};

    private static double interp(double[] x, double[] y, double v) {
        if (v <= x[0]) return y[0];
        for (int i = 1; i < x.length; i++)
            if (v <= x[i]) return y[i - 1] + (y[i] - y[i - 1]) * (v - x[i - 1]) / (x[i] - x[i - 1]);
        return y[y.length - 1];
    }

    /** Compendium MET values, linearly interpolated by speed. Brisk walking above 7.2 km/h is capped at 7 MET. */
    static double met(int mode, double kmh) {
        return mode == RUN ? interp(RK, RM, kmh) : interp(WK, WM, kmh);
    }

    /** Net energy (resting not included): (MET - 1) x kg x hours. Consistent with the 0.5 kcal/kg/km on the steps screen. */
    static double kcal(int mode, double kmh, double kg, double minutes) {
        return Math.max(0, (met(mode, kmh) - 1) * kg * minutes / 60.0);
    }

    static final class Bout {
        boolean ok;
        int mode, steps;
        long t0, t1;
        double minutes, km, kmh, kcal = -1;
    }

    private static boolean plausibleSpeed(int mode, double kmh) {
        return kmh <= 25 && !(mode == WALK && kmh > 11);
    }

    /** Summarizes a finished movement interval. Short or stepless intervals (shaking, vehicles) are dropped. gpsSpeed: m/s when measured in the window, otherwise NaN. kcal is -1 when kg <= 0. */
    static Bout bout(Model m, int arMode, double cm, double kg, double minutes, int steps, double gpsSpeed) {
        Bout b = new Bout();
        b.minutes = minutes;
        b.steps = steps;
        if (!(minutes >= 3) || steps < 150) return b;
        double cad = steps / minutes;
        if (cad < MIN_CADENCE || cad > MAX_CADENCE) return b;
        b.mode = classify(arMode, cad, gpsSpeed);
        double stride = stride(m, b.mode, cm, cad);
        b.km = steps * stride / 1000.0;
        b.kmh = b.km / (minutes / 60.0);
        if (!plausibleSpeed(b.mode, b.kmh)) return b;
        if (kg > 0) b.kcal = kcal(b.mode, b.kmh, kg, minutes);
        b.ok = true;
        return b;
    }

    /**
     * Slice-by-slice summary from checkpoints (time ms, daily steps): each slice gets its own stride length and speed from its own cadence,
     * so fatigue or a change of pace shows in the total distance and calories. Slices below the minimum cadence count as pauses (zero calories).
     * With a single slice the result equals bout().
     */
    static Bout path(Model m, int arMode, double cm, double kg, long[] t, long[] s, int n, double gpsSpeed) {
        if (n < 2) return new Bout();
        double minutes = (t[n - 1] - t[0]) / 60000.0;
        int steps = (int) (s[n - 1] - s[0]);
        if (n == 2) return bout(m, arMode, cm, kg, minutes, steps, gpsSpeed);
        Bout b = new Bout();
        b.minutes = minutes;
        b.steps = steps;
        if (!(minutes >= 3) || steps < 150) return b;
        double oc = steps / minutes;
        if (oc < MIN_CADENCE || oc > MAX_CADENCE) return b;
        double runKm = 0, walkKm = 0, kc = 0;
        for (int i = 0; i + 1 < n; i++) {
            double dt = (t[i + 1] - t[i]) / 60000.0, ds = s[i + 1] - s[i];
            if (dt <= 0 || ds < 0) continue;
            double cad = ds / dt, c = Math.max(MIN_CADENCE, Math.min(MAX_CADENCE, cad));
            int md = classify(arMode, c, Double.NaN);
            double km = ds * stride(m, md, cm, c) / 1000.0;
            if (md == RUN) runKm += km; else walkKm += km;
            if (cad >= MIN_CADENCE && kg > 0) kc += kcal(md, km / (dt / 60.0), kg, dt);
        }
        b.mode = runKm > walkKm ? RUN : WALK;
        b.km = runKm + walkKm;
        b.kmh = b.km / (minutes / 60.0);
        if (!plausibleSpeed(b.mode, b.kmh)) return b;
        if (kg > 0) b.kcal = kc;
        b.ok = true;
        return b;
    }

    /**
     * Splits the points into parts that lie on the same local day and whose steps never go backwards, summarizes each part with path() and returns the valid ones.
     * The daily counter resets at midnight, so the steps of the slice between two days are unknown: that slice is dropped, not shared proportionally.
     * d: local day number of each point.
     */
    static List<Bout> split(Model m, int arMode, double cm, double kg, long[] t, long[] s, int[] d, int n, double gpsSpeed) {
        List<Bout> out = new ArrayList<>();
        for (int a = 0, i = 1; i <= n; i++) {
            if (i < n && d[i] == d[a] && s[i] >= s[i - 1]) continue;
            if (i - a >= 2) {
                Bout b = path(m, arMode, cm, kg, Arrays.copyOfRange(t, a, i), Arrays.copyOfRange(s, a, i), i - a, gpsSpeed);
                b.t0 = t[a];
                b.t1 = t[i - 1];
                if (b.ok) out.add(b);
            }
            a = i;
        }
        return out;
    }

    static int dayOf(long t, int offsetMs) {
        return (int) ((t + offsetMs) / 86400000L);
    }

    /** The step value belongs to the day of the counter read at time "at" (the counter resets at midnight). If the event time t falls on another day, "at" is used: otherwise the interval would mix yesterday's large value with today's small one and the walk would vanish. */
    static long onCounterDay(long t, int offT, long at, int offAt) {
        return dayOf(t, offT) == dayOf(at, offAt) ? t : at;
    }
}
