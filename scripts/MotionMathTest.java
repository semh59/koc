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
        ok("beklenen adım uzunluğu: yürüyüş 110/dk, boy 170", near(MotionMath.priorStride(MotionMath.WALK, 170, 110), 0.697, 0.001));
        ok("beklenen adım uzunluğu: koşu 170/dk", near(MotionMath.priorStride(MotionMath.RUN, 170, 170), 1.1713, 0.001));
        ok("boy bilinmiyorsa 170 varsayılır", near(MotionMath.priorStride(MotionMath.WALK, 0, 110), 0.697, 0.001) && near(MotionMath.priorStride(MotionMath.WALK, 999, 110), 0.697, 0.001));
        ok("ritim arttıkça adım uzar", MotionMath.priorStride(MotionMath.WALK, 170, 130) > MotionMath.priorStride(MotionMath.WALK, 170, 100));

        ok("ritim aralığı: sınırlar", MotionMath.bucket(110) == 4 && MotionMath.bucket(40) == 0 && MotionMath.bucket(10) == 0 && MotionMath.bucket(300) == 11);

        MotionMath.Model m = new MotionMath.Model();
        ok("örnek: makul GPS adımı modele girer", MotionMath.addSample(m, MotionMath.WALK, 170, 110, 0.766, 100) && near(m.f[0], 1.0495, 0.001) && m.n[0] == 1 && m.last[0] == 100 && m.bucket[0][4] == 1);
        ok("örnek: imkânsız adım uzunluğu reddedilir", !MotionMath.addSample(m, MotionMath.WALK, 170, 110, 1.6, 100) && m.n[0] == 1);
        ok("örnek: imkânsız ritim reddedilir", !MotionMath.addSample(m, MotionMath.WALK, 170, 30, 0.5, 100) && !MotionMath.addSample(m, MotionMath.WALK, 170, 250, 0.5, 100));
        ok("ölçek 0,7-1,3 aralığında kalır", (new Object() {
            boolean run() {
                MotionMath.Model x = new MotionMath.Model();
                for (int i = 0; i < 200; i++) MotionMath.addSample(x, MotionMath.RUN, 170, 170, 1.1713 * 1.45, 100);
                return x.f[1] <= 1.3 && x.f[1] > 1.25;
            }
        }).run());
        ok("öğrenilen ölçek adım uzunluğuna yansır", near(MotionMath.stride(m, MotionMath.WALK, 170, 110), 0.697 * 1.0495, 0.002));

        MotionMath.Model g = new MotionMath.Model();
        ok("GPS: yeni modelde istenir", MotionMath.gpsWanted(g, MotionMath.WALK, Double.NaN, 100, 0, 80, false));
        ok("GPS: pil azsa ya da tasarruf açıksa istenmez", !MotionMath.gpsWanted(g, MotionMath.WALK, Double.NaN, 100, 0, 19, false) && !MotionMath.gpsWanted(g, MotionMath.WALK, Double.NaN, 100, 0, 80, true));
        ok("GPS: günlük üst sınır 6", MotionMath.gpsWanted(g, MotionMath.WALK, Double.NaN, 100, 5, 80, false) && !MotionMath.gpsWanted(g, MotionMath.WALK, Double.NaN, 100, 6, 80, false));
        MotionMath.addSample(g, MotionMath.WALK, 170, 110, 0.70, 100);
        ok("GPS: o ritimde 1 örnek varken hâlâ istenir", MotionMath.gpsWanted(g, MotionMath.WALK, 110, 101, 0, 80, false));
        MotionMath.addSample(g, MotionMath.WALK, 170, 112, 0.70, 100);
        ok("GPS: o ritim aralığı dolunca istenmez", !MotionMath.gpsWanted(g, MotionMath.WALK, 110, 101, 0, 80, false));
        ok("GPS: başka ritim aralığında yine istenir", MotionMath.gpsWanted(g, MotionMath.WALK, 135, 101, 0, 80, false));
        ok("GPS: 14 günden eski modelde günde en çok 1 doğrulama", MotionMath.gpsWanted(g, MotionMath.WALK, 110, 120, 0, 80, false) && !MotionMath.gpsWanted(g, MotionMath.WALK, 110, 120, 1, 80, false));

        MotionMath.Model r = MotionMath.Model.dec(m.enc());
        ok("model: kodla ve çöz aynı", r.enc().equals(m.enc()) && r.n[0] == 1 && near(r.f[0], m.f[0], 1e-9));
        ok("model: bozuk metin varsayılana döner", MotionMath.Model.dec("x").n[0] == 0 && MotionMath.Model.dec(null).f[1] == 1 && MotionMath.Model.dec("1,1,0,0,-1,-1,a").f[0] == 1 && MotionMath.Model.dec("9,1,0,0,-1,-1" + ",0".repeat(24)).f[0] == 1);

        ok("GPS noktası: iyi", MotionMath.goodFix(10, 0.5f, 1.4f) && MotionMath.goodFix(10, -1f, 1.4f));
        ok("GPS noktası: kötü doğruluk ya da hız doğruluğu ya da hız reddedilir", !MotionMath.goodFix(20, 0.5f, 1.4f) && !MotionMath.goodFix(10, 1.2f, 1.4f) && !MotionMath.goodFix(10, 0.5f, -1f) && !MotionMath.goodFix(0, 0.5f, 1f) && !MotionMath.goodFix(10, 0.5f, 16f));

        ok("medyan ve sapma", MotionMath.median(new double[] {3, 1, 2, 100, 100}, 3) == 2 && MotionMath.median(new double[] {1, 2, 3, 4}, 4) == 2.5 && Double.isNaN(MotionMath.median(new double[0], 0)) && MotionMath.stdev(new double[] {2, 2, 2}, 3) == 0);

        ok("araç: yüksek hız ya da hızlı ama yavaş ritim", MotionMath.vehicle(10, 50) && MotionMath.vehicle(5, 60) && !MotionMath.vehicle(5, 160) && !MotionMath.vehicle(3, 120));

        ok("ayrım: GPS hızı baskın", MotionMath.classify(MotionMath.WALK, 100, 2.5) == MotionMath.RUN && MotionMath.classify(MotionMath.RUN, 170, 1.5) == MotionMath.WALK);
        ok("ayrım: belirsiz hızda ritim ve etkinlik tanıma", MotionMath.classify(MotionMath.WALK, 130, 2.0) == MotionMath.WALK && MotionMath.classify(MotionMath.RUN, 140, Double.NaN) == MotionMath.RUN && MotionMath.classify(MotionMath.WALK, 170, Double.NaN) == MotionMath.RUN && MotionMath.classify(MotionMath.RUN, 100, Double.NaN) == MotionMath.WALK);

        ok("MET: yürüyüş tablo ve ara değer", MotionMath.met(MotionMath.WALK, 4.8) == 3.5 && near(MotionMath.met(MotionMath.WALK, 5.2), 3.9, 1e-9) && MotionMath.met(MotionMath.WALK, 2) == 2.8 && MotionMath.met(MotionMath.WALK, 20) == 7.0);
        ok("MET: koşu tablo ve üst sınır", MotionMath.met(MotionMath.RUN, 9.7) == 9.8 && MotionMath.met(MotionMath.RUN, 20) == 14.5);
        ok("kalori: net enerji", near(MotionMath.kcal(MotionMath.WALK, 4.8, 70, 60), 175, 1e-9) && MotionMath.kcal(MotionMath.WALK, 4.8, 70, 0) == 0);
        ok("kalori: yürüyüşte 0,5 kcal/kg/km civarı", near(MotionMath.kcal(MotionMath.WALK, 5.0, 70, 60) / 70 / 5.0, 0.5, 0.06));

        MotionMath.Model f = new MotionMath.Model();
        MotionMath.Bout w = MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1100, Double.NaN);
        ok("aralık: yürüyüş özeti", w.ok && w.mode == MotionMath.WALK && near(w.km, 0.7667, 0.002) && near(w.kmh, 4.6, 0.02) && near(w.kcal, 27.7, 0.3));
        MotionMath.Bout k = MotionMath.bout(f, MotionMath.RUN, 170, 70, 10, 1700, Double.NaN);
        ok("aralık: koşu özeti", k.ok && k.mode == MotionMath.RUN && near(k.km, 1.991, 0.005) && near(k.kmh, 11.95, 0.05) && k.kcal > 100);
        ok("aralık: etkinlik tanıma yürüyüş dese de yüksek ritim koşudur", MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1700, Double.NaN).mode == MotionMath.RUN);
        ok("aralık: GPS hızı yürü/koş kararını düzeltir", MotionMath.bout(f, MotionMath.RUN, 170, 70, 10, 1300, 1.5).mode == MotionMath.WALK);
        ok("aralık: kısa süre ya da az adım elenir", !MotionMath.bout(f, MotionMath.WALK, 170, 70, 2.9, 400, Double.NaN).ok && !MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 149, Double.NaN).ok);
        ok("aralık: imkânsız ritim elenir (sarsıntı)", !MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 3000, Double.NaN).ok && !MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 400, Double.NaN).ok);
        ok("aralık: kilo yoksa kalori -1", MotionMath.bout(f, MotionMath.WALK, 170, 0, 10, 1100, Double.NaN).kcal == -1);
        ok("aralık: öğrenilmiş uzun adım mesafeyi büyütür", (new Object() {
            boolean run() {
                MotionMath.Model x = new MotionMath.Model();
                for (int i = 0; i < 6; i++) MotionMath.addSample(x, MotionMath.WALK, 170, 110, 0.697 * 1.2, 100);
                return MotionMath.bout(x, MotionMath.WALK, 170, 70, 10, 1100, Double.NaN).km > MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1100, Double.NaN).km * 1.15;
            }
        }).run());

        ok("sapma: ritim %20 düşünce ya da artınca", MotionMath.cadenceShift(120, 90) && MotionMath.cadenceShift(120, 150) && !MotionMath.cadenceShift(120, 110) && !MotionMath.cadenceShift(120, 130));
        ok("sapma: durma dilimi ve düşük referans sapma sayılmaz", !MotionMath.cadenceShift(120, 20) && !MotionMath.cadenceShift(60, 90));

        long[] t1 = {0, 300000, 600000};
        long[] s1 = {0, 500, 800};
        MotionMath.Bout pf = MotionMath.path(f, MotionMath.WALK, 170, 70, t1, s1, 3, Double.NaN);
        MotionMath.Bout av = MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 800, Double.NaN);
        ok("yol: yorulan yürüyüş (100/dk, sonra 60/dk) dilim dilim kalori", pf.ok && pf.steps == 800 && near(pf.kcal, 22.46, 0.1) && Math.abs(pf.kcal - av.kcal) > 0.5);
        ok("yol: dilim dilim mesafe elle hesapla", near(pf.km, 500 * MotionMath.priorStride(MotionMath.WALK, 170, 100) / 1000 + 300 * MotionMath.priorStride(MotionMath.WALK, 170, 60) / 1000, 1e-6));
        long[] t2 = {0, 300000, 600000};
        long[] s2 = {0, 600, 1200};
        ok("yol: tek tempoda ortalamayla aynı", near(MotionMath.path(f, MotionMath.WALK, 170, 70, t2, s2, 3, Double.NaN).km, MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1200, Double.NaN).km, 1e-6));
        long[] t3 = {0, 300000, 600000, 900000};
        long[] s3 = {0, 600, 600, 1200};
        MotionMath.Bout pa = MotionMath.path(f, MotionMath.WALK, 170, 70, t3, s3, 4, Double.NaN);
        ok("yol: ortadaki duraklama kaloriye girmez", pa.ok && near(pa.kcal, MotionMath.kcal(MotionMath.WALK, 600 * MotionMath.priorStride(MotionMath.WALK, 170, 120) / 1000 / (5.0 / 60), 70, 5) * 2, 0.5));
        long[] t4 = {0, 300000, 600000};
        long[] s4 = {0, 800, 1500};
        MotionMath.Bout pm = MotionMath.path(f, MotionMath.RUN, 170, 70, t4, s4, 3, Double.NaN);
        ok("yol: koşu ağırlıklı dilimlerde tür koşu", pm.ok && pm.mode == MotionMath.RUN && pm.kcal > 80);
        ok("yol: kısa ya da az adımlı ya da tek nokta elenir", !MotionMath.path(f, MotionMath.WALK, 170, 70, new long[] {0, 60000, 120000}, new long[] {0, 100, 200}, 3, Double.NaN).ok && !MotionMath.path(f, MotionMath.WALK, 170, 70, new long[] {0}, new long[] {0}, 1, Double.NaN).ok);
        ok("yol: iki nokta bout ile aynı", near(MotionMath.path(f, MotionMath.WALK, 170, 70, new long[] {0, 600000}, new long[] {0, 1100}, 2, Double.NaN).km, MotionMath.bout(f, MotionMath.WALK, 170, 70, 10, 1100, Double.NaN).km, 1e-9));
        System.exit(bad == 0 ? 0 : 1);
    }
}
