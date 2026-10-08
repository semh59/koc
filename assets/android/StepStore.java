package com.neowell.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Adım sensörünü okur, durumu SharedPreferences'ta tutar. Mantık StepMath'te. */
final class StepStore {
    interface Callback {
        void done(Long steps, Map<String, Long> history);
    }

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("nw_steps", Context.MODE_PRIVATE);
    }

    static String today() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    static boolean available(Context c) {
        SensorManager sm = (SensorManager) c.getSystemService(Context.SENSOR_SERVICE);
        return sm != null && sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null;
    }

    private static SensorEventListener live;
    private static volatile float liveCounter = -1;

    /** Uygulama açıkken sensörü sürekli dinler. Tek seferlik kayıtta bazı telefonlar ilk olayı geciktirir ya da eski (toplu) değeri verir; açıkken adım sayısı donar. */
    static synchronized void live(Context c, boolean on) {
        SensorManager sm = (SensorManager) c.getApplicationContext().getSystemService(Context.SENSOR_SERVICE);
        Sensor sensor = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (sensor == null || on == (live != null)) return;
        if (on) {
            live = new SensorEventListener() {
                public void onSensorChanged(SensorEvent e) {
                    liveCounter = e.values[0];
                }

                public void onAccuracyChanged(Sensor s, int a) {}
            };
            // maxReportLatency 0: olaylar toplu bekletilmeden gelsin.
            sm.registerListener(live, sensor, SensorManager.SENSOR_DELAY_NORMAL, 0, new Handler(Looper.getMainLooper()));
        } else {
            sm.unregisterListener(live);
            live = null;
            liveCounter = -1;
        }
    }

    /** Sayaçtan tek okuma yapar. closeFirst: gece alarmında önce biten günü kapat. Sensör yanıt vermezse steps null döner. */
    static void read(final Context c, final boolean closeFirst, final Callback cb) {
        final Context app = c.getApplicationContext();
        final SensorManager sm = (SensorManager) app.getSystemService(Context.SENSOR_SERVICE);
        final Sensor sensor = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (sensor == null) {
            cb.done(null, new HashMap<String, Long>());
            return;
        }
        float v = liveCounter;
        if (v >= 0) {
            boolean flushed;
            synchronized (StepStore.class) {
                flushed = live != null && sm.flush(live);
            }
            // Telefon adımları donanım kuyruğunda biriktirir; boşaltma isteğinin yanıtı kısa süre sonra gelir, eski değeri göstermek yerine beklenir (okuma eklenti iş parçacığında).
            for (int k = 0; flushed && k < 8 && liveCounter == v; k++) {
                try {
                    Thread.sleep(50);
                } catch (InterruptedException x) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
            cb.done(apply(app, liveCounter, closeFirst), history(app));
            return;
        }
        final Handler h = new Handler(Looper.getMainLooper());
        final boolean[] finished = {false};
        final SensorEventListener[] ref = new SensorEventListener[1];
        final Runnable timeout = new Runnable() {
            public void run() {
                if (finished[0]) return;
                finished[0] = true;
                sm.unregisterListener(ref[0]);
                cb.done(null, history(app));
            }
        };
        ref[0] = new SensorEventListener() {
            public void onSensorChanged(SensorEvent e) {
                if (finished[0]) return;
                finished[0] = true;
                h.removeCallbacks(timeout);
                sm.unregisterListener(this);
                cb.done(apply(app, e.values[0], closeFirst), history(app));
            }

            public void onAccuracyChanged(Sensor s, int a) {}
        };
        sm.registerListener(ref[0], sensor, SensorManager.SENSOR_DELAY_NORMAL, h);
        h.postDelayed(timeout, 4000);
    }

    /** Okuma iş parçacığına özel: canlı değer eklenti iş parçacığında, sensör olayı ana iş parçacığında işlenir; ortak statik başka okumanın anını gösterebilirdi. */
    private static final ThreadLocal<Long> sampledAt = new ThreadLocal<>();

    /** Geri çağrının kendi okumasının günü belirleyen anı (geri çağrı okumayla aynı iş parçacığında, hemen ardından çalışır). */
    static long sampledAt() {
        Long t = sampledAt.get();
        return t != null ? t : System.currentTimeMillis();
    }

    private static synchronized long apply(Context c, float counter, boolean closeFirst) {
        SharedPreferences sp = prefs(c);
        StepMath.State s = new StepMath.State();
        s.day = sp.getString("day", "");
        s.base = sp.getFloat("base", 0);
        s.carry = sp.getFloat("carry", 0);
        s.last = sp.getFloat("last", -1);
        s.sampled = sp.getBoolean("sampled", false);
        // elapsedRealtime yalnız yeniden başlatmada sıfırlanır (saat ayarından etkilenmez): küçüldüyse sayaç sıfırlanmıştır.
        long el = SystemClock.elapsedRealtime();
        s.rebooted = el < sp.getLong("el", 0L);
        Map<String, Long> hist = new HashMap<>();
        // Gün anahtarı, dakika ve geri çağrıya verilen an tek örnekten: gece yarısında ayrı ayrı alınırsa adım dünün, zaman bugünün olur.
        long at = System.currentTimeMillis();
        sampledAt.set(at);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(at));
        java.util.Calendar now = java.util.Calendar.getInstance();
        now.setTimeInMillis(at);
        int minutes = now.get(java.util.Calendar.HOUR_OF_DAY) * 60 + now.get(java.util.Calendar.MINUTE);
        long prevAt = sp.getLong("at", 0L), before = s.day.equals(today) && s.last >= 0 ? StepMath.total(s, s.last) : -1;
        boolean closed = closeFirst && StepMath.closeDay(s, today, counter, minutes, hist);
        long steps = StepMath.update(s, today, counter, minutes, hist);
        if (before >= 0 && prevAt > 0 && !StepMath.plausible(before, steps, at - prevAt)) return before; // bayat/hatalı okuma: durum değişmez, sonraki okuma devam eder
        if (steps > StepMath.MAX_DAY) { // bozulmuş sayaç durumu: bugün bu okumadan yeniden sayılır
            s.carry = 0;
            s.base = counter;
            steps = 0;
        }
        SharedPreferences.Editor e = sp.edit();
        e.putString("day", s.day).putFloat("base", s.base).putFloat("carry", s.carry).putFloat("last", s.last).putBoolean("sampled", s.sampled).putLong("el", el).putLong("at", at);
        for (Map.Entry<String, Long> x : hist.entrySet()) e.putLong("h_" + x.getKey(), x.getValue());
        if (closed) e.putLong("snapAt", at);
        e.apply();
        return steps;
    }

    /** Gece alarmının günü gerçekten kapattığı son zaman (ms), hiç olmadıysa 0. */
    static long snapAt(Context c) {
        return prefs(c).getLong("snapAt", 0L);
    }

    /** Biten günlerin adımları. */
    static Map<String, Long> history(Context c) {
        Map<String, Long> out = new HashMap<>();
        for (Map.Entry<String, ?> x : prefs(c).getAll().entrySet())
            if (x.getKey().startsWith("h_") && x.getValue() instanceof Long)
                out.put(x.getKey().substring(2), (Long) x.getValue());
        return out;
    }
}
