package com.neowell.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
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

    /** Sayaçtan tek okuma yapar. closeFirst: gece alarmında önce biten günü kapat. Sensör yanıt vermezse steps null döner. */
    static void read(final Context c, final boolean closeFirst, final Callback cb) {
        final Context app = c.getApplicationContext();
        final SensorManager sm = (SensorManager) app.getSystemService(Context.SENSOR_SERVICE);
        final Sensor sensor = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (sensor == null) {
            cb.done(null, new HashMap<String, Long>());
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

    private static synchronized long apply(Context c, float counter, boolean closeFirst) {
        SharedPreferences sp = prefs(c);
        StepMath.State s = new StepMath.State();
        s.day = sp.getString("day", "");
        s.base = sp.getFloat("base", 0);
        s.carry = sp.getFloat("carry", 0);
        s.last = sp.getFloat("last", -1);
        Map<String, Long> hist = new HashMap<>();
        String today = today();
        java.util.Calendar now = java.util.Calendar.getInstance();
        int minutes = now.get(java.util.Calendar.HOUR_OF_DAY) * 60 + now.get(java.util.Calendar.MINUTE);
        boolean closed = closeFirst && StepMath.closeDay(s, today, counter, minutes, hist);
        long steps = StepMath.update(s, today, counter, hist);
        SharedPreferences.Editor e = sp.edit();
        e.putString("day", s.day).putFloat("base", s.base).putFloat("carry", s.carry).putFloat("last", s.last);
        for (Map.Entry<String, Long> x : hist.entrySet()) e.putLong("h_" + x.getKey(), x.getValue());
        if (closed) e.putLong("snapAt", System.currentTimeMillis());
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
