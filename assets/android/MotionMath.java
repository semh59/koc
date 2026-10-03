package com.neowell.app;

/** Hareket algılama mantığı (Android'e bağımlı değil, test edilebilir): adım uzunluğu modeli, yürü/koş ayrımı, MET kalori. */
final class MotionMath {
    static final int WALK = 0, RUN = 1;
    static final double DEFAULT_CM = 170;

    /** Ritme göre beklenen adım uzunluğu (m): boy × (a + b·ritim). 110 adım/dk yürüyüşte boy × 0,41. */
    static double priorStride(int mode, double cm, double cad) {
        double h = (cm >= 120 && cm <= 230 ? cm : DEFAULT_CM) / 100.0;
        double c = Math.max(40, Math.min(220, cad));
        return mode == RUN ? h * (0.40 + 0.0017 * c) : h * (0.30 + 0.0010 * c);
    }

    /** Kişiye özel ölçek (f) ve örnek sayısı (n), yürüyüş ve koşu için ayrı. */
    static final class Model {
        final double[] f = {1, 1};
        final int[] n = new int[2];

        String enc() {
            return f[0] + "," + f[1] + "," + n[0] + "," + n[1];
        }

        /** Eski biçim (30 alan: ardından gün ve ritim aralığı sayaçları) da okunur: öğrenilmiş ölçek güncellemede kaybolmaz. */
        static Model dec(String s) {
            Model m = new Model();
            if (s == null) return m;
            String[] p = s.split(",");
            if (p.length != 4 && p.length != 30) return m;
            try {
                double f0 = Double.parseDouble(p[0]), f1 = Double.parseDouble(p[1]);
                int n0 = Integer.parseInt(p[2]), n1 = Integer.parseInt(p[3]);
                if (!(f0 >= 0.7 && f0 <= 1.3 && f1 >= 0.7 && f1 <= 1.3) || n0 < 0 || n1 < 0 || n0 > 100000 || n1 > 100000) return m;
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

    /** GPS'ten ölçülen adım uzunluğu (hız ÷ ritim) makul mü ve modele eklenir mi. */
    static boolean addSample(Model m, int mode, double cm, double cad, double strideObs) {
        double prior = priorStride(mode, cm, cad), r = strideObs / prior;
        if (!(cad >= 50 && cad <= 220) || !(r >= 0.6 && r <= 1.5)) return false;
        double w = m.n[mode] < 10 ? 1.0 / (m.n[mode] + 2) : 0.12;
        m.f[mode] = Math.max(0.7, Math.min(1.3, m.f[mode] * (1 - w) + r * w));
        m.n[mode]++;
        return true;
    }

    /** Doppler hızı güvenilir mi: konum doğruluğu ≤ 15 m, hız doğruluğu biliniyorsa ≤ 0,8 m/s. */
    static boolean goodFix(float acc, float speedAcc, float speed) {
        return acc > 0 && acc <= 15 && speed >= 0 && speed <= 15 && (speedAcc < 0 || speedAcc <= 0.8f);
    }

    static double median(double[] a, int n) {
        if (n == 0) return Double.NaN;
        double[] c = java.util.Arrays.copyOf(a, n);
        java.util.Arrays.sort(c);
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

    /** Araç: hız yüksek ve ritim düşük (ya da koşucu için imkânsız hız). */
    static boolean vehicle(double speed, double cad) {
        return speed > 7 || (speed > 4.2 && cad < 100);
    }

    /** Etkinlik tanıma türü ile ritim ve (varsa) GPS hızından yürü/koş kararı. */
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

    /** Derleme (Compendium) MET değerleri, hızla doğrusal ara değer. Yürüyüşte 7,2 km/s üstü hızlı yürüyüş: 7 MET'te sınırlanır. */
    static double met(int mode, double kmh) {
        return mode == RUN ? interp(RK, RM, kmh) : interp(WK, WM, kmh);
    }

    /** Net enerji (dinlenme dahil değil): (MET − 1) × kg × saat. Adım ekranındaki 0,5 kcal/kg/km ile uyumlu. */
    static double kcal(int mode, double kmh, double kg, double minutes) {
        return Math.max(0, (met(mode, kmh) - 1) * kg * minutes / 60.0);
    }

    static final class Bout {
        boolean ok;
        int mode, steps;
        long t0, t1;
        double minutes, km, kmh, kcal = -1;
    }

    /** Biten bir hareket aralığını özetler. Kısa ya da adımsız (sarsıntı, araç) aralıklar elenir. gpsSpeed: pencerede ölçüldüyse m/s, yoksa NaN. kg ≤ 0 ise kcal −1. */
    static Bout bout(Model m, int arMode, double cm, double kg, double minutes, int steps, double gpsSpeed) {
        Bout b = new Bout();
        b.minutes = minutes;
        b.steps = steps;
        if (!(minutes >= 3) || steps < 150) return b;
        double cad = steps / minutes;
        if (cad < 50 || cad > 220) return b;
        b.mode = classify(arMode, cad, gpsSpeed);
        double stride = stride(m, b.mode, cm, cad);
        b.km = steps * stride / 1000.0;
        b.kmh = b.km / (minutes / 60.0);
        if (b.kmh > 25 || (b.mode == WALK && b.kmh > 11)) return b;
        if (kg > 0) b.kcal = kcal(b.mode, b.kmh, kg, minutes);
        b.ok = true;
        return b;
    }

    /**
     * Kontrol noktalarından (zaman ms, günlük adım) dilim dilim özet: her dilimin kendi ritminden adım uzunluğu ve hızı bulunur,
     * böylece yorulma ya da tempo değişimi toplam mesafeye ve kaloriye yansır. Ritmi 50'nin altındaki dilimler duraklama sayılır (kalori 0).
     * Tek dilimse bout() ile aynıdır.
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
        if (oc < 50 || oc > 220) return b;
        double runKm = 0, walkKm = 0, kc = 0;
        for (int i = 0; i + 1 < n; i++) {
            double dt = (t[i + 1] - t[i]) / 60000.0, ds = s[i + 1] - s[i];
            if (dt <= 0 || ds < 0) continue;
            double cad = ds / dt, c = Math.max(50, Math.min(220, cad));
            int md = classify(arMode, c, Double.NaN);
            double km = ds * stride(m, md, cm, c) / 1000.0;
            if (md == RUN) runKm += km; else walkKm += km;
            if (cad >= 50 && kg > 0) kc += kcal(md, km / (dt / 60.0), kg, dt);
        }
        b.mode = runKm > walkKm ? RUN : WALK;
        b.km = runKm + walkKm;
        b.kmh = b.km / (minutes / 60.0);
        if (b.kmh > 25 || (b.mode == WALK && b.kmh > 11)) return b;
        if (kg > 0) b.kcal = kc;
        b.ok = true;
        return b;
    }

    /**
     * Noktaları aynı yerel günde ve adımı geri gitmeyen parçalara böler, her parçayı path() ile özetler; geçerli parçalar döner.
     * Günlük sayaç gece sıfırlandığı için iki gün arasındaki dilimin adımı bilinmez: o dilim atılır, orantıyla paylaştırılmaz.
     * d: her noktanın yerel gün numarası.
     */
    static java.util.List<Bout> split(Model m, int arMode, double cm, double kg, long[] t, long[] s, int[] d, int n, double gpsSpeed) {
        java.util.List<Bout> out = new java.util.ArrayList<>();
        for (int a = 0, i = 1; i <= n; i++) {
            if (i < n && d[i] == d[a] && s[i] >= s[i - 1]) continue;
            if (i - a >= 2) {
                Bout b = path(m, arMode, cm, kg, java.util.Arrays.copyOfRange(t, a, i), java.util.Arrays.copyOfRange(s, a, i), i - a, gpsSpeed);
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

    /** Adım değeri at anında okunan günün sayacıdır (gece sıfırlanır). Olay zamanı t başka güne düşerse at kullanılır: yoksa aralık dünün büyük değeriyle bugünün küçük değerini karıştırır ve yürüyüş kaybolur. */
    static long onCounterDay(long t, int offT, long at, int offAt) {
        return dayOf(t, offT) == dayOf(at, offAt) ? t : at;
    }
}
