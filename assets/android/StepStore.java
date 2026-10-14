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
import android.provider.Settings;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** Reads the step sensor and keeps the state in SharedPreferences. The logic is in StepMath. */
final class StepStore {
    interface Callback {
        void done(Long steps, Map<String, Long> history);
    }

    private static final int FLUSH_WAIT_TRIES = 8;
    private static final long FLUSH_WAIT_MS = 50, READ_TIMEOUT_MS = 4000;

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("nw_steps", Context.MODE_PRIVATE);
    }

    static String day(long at) {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(at));
    }

    static String today() {
        return day(System.currentTimeMillis());
    }

    static boolean available(Context c) {
        SensorManager sm = c.getSystemService(SensorManager.class);
        return sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null;
    }

    private static SensorEventListener live;
    private static volatile float liveCounter = -1;

    /** Listens to the sensor continuously while the app is open. With a one-shot registration some phones delay the first event or deliver an old (batched) value, and the step count freezes while the app is open. */
    static synchronized void live(Context c, boolean on) {
        SensorManager sm = c.getApplicationContext().getSystemService(SensorManager.class);
        Sensor sensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (sensor == null || on == (live != null)) return;
        if (on) {
            live = new SensorEventListener() {
                public void onSensorChanged(SensorEvent e) {
                    liveCounter = e.values[0];
                }

                public void onAccuracyChanged(Sensor s, int a) {}
            };
            // maxReportLatency 0: events arrive without batching delay.
            sm.registerListener(live, sensor, SensorManager.SENSOR_DELAY_NORMAL, 0, new Handler(Looper.getMainLooper()));
        } else {
            sm.unregisterListener(live);
            live = null;
            liveCounter = -1;
        }
    }

    /** Takes one reading from the counter. closeFirst: at the night alarm, close the finished day first. steps is null when the sensor does not answer. */
    static void read(final Context c, final boolean closeFirst, final Callback cb) {
        final Context app = c.getApplicationContext();
        final SensorManager sm = app.getSystemService(SensorManager.class);
        final Sensor sensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
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
            // The phone batches steps in a hardware queue; the answer to the flush request arrives shortly, so wait for it instead of showing the old value.
            // Only off the main thread: sensor events are delivered on the main looper, so waiting there could never see the new value.
            boolean main = Looper.myLooper() == Looper.getMainLooper();
            for (int k = 0; flushed && !main && k < FLUSH_WAIT_TRIES && liveCounter == v; k++) {
                try {
                    Thread.sleep(FLUSH_WAIT_MS);
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
        final Runnable timeout = () -> {
            if (finished[0]) return;
            finished[0] = true;
            sm.unregisterListener(ref[0]);
            cb.done(null, history(app));
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
        h.postDelayed(timeout, READ_TIMEOUT_MS);
    }

    /** Per reading thread: the live value is handled on the plugin thread and the sensor event on the main thread, so a shared static could hold another reading's time. */
    private static final ThreadLocal<Long> sampledAt = new ThreadLocal<>();

    /** The moment that fixed the day of the callback's own reading (the callback runs right after the reading, on the same thread). */
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
        // elapsedRealtime resets only at boot (a clock change does not affect it): if it shrank, the counter was reset.
        long el = SystemClock.elapsedRealtime();
        int boot = Settings.Global.getInt(c.getContentResolver(), Settings.Global.BOOT_COUNT, -1), lastBoot = sp.getInt("boot", -1);
        s.bootKnown = boot >= 0 && lastBoot >= 0;
        s.rebooted = el < sp.getLong("el", 0L) || (s.bootKnown && boot != lastBoot);
        Map<String, Long> hist = new HashMap<>();
        // Day key, minute and the time handed to the callback come from one sample: taken separately around midnight, the steps would belong to yesterday and the time to today.
        long at = System.currentTimeMillis();
        sampledAt.set(at);
        String today = day(at);
        Calendar now = Calendar.getInstance();
        now.setTimeInMillis(at);
        int minutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
        boolean closed = closeFirst && StepMath.closeDay(s, today, counter, minutes, hist);
        long steps = StepMath.update(s, today, counter, minutes, hist);
        if (steps > StepMath.MAX_DAY) { // corrupt state: count today again from this reading
            s.carry = 0;
            s.base = counter;
            steps = 0;
        }
        SharedPreferences.Editor e = sp.edit();
        e.putString("day", s.day).putFloat("base", s.base).putFloat("carry", s.carry).putFloat("last", s.last).putBoolean("sampled", s.sampled).putLong("el", el).putInt("boot", boot);
        // A day key that comes round again (flight west) never lowers a total already written.
        for (Map.Entry<String, Long> x : hist.entrySet()) e.putLong("h_" + x.getKey(), Math.max(x.getValue(), sp.getLong("h_" + x.getKey(), 0L)));
        if (closed) e.putLong("snapAt", at);
        e.apply();
        return steps;
    }

    /** The last time (ms) the night alarm really closed a day, 0 if never. */
    static long snapAt(Context c) {
        return prefs(c).getLong("snapAt", 0L);
    }

    /** "Delete all data": the finished-day history and the night-alarm mark go; today's counter state stays so counting continues. */
    static synchronized void wipe(Context c) {
        SharedPreferences sp = prefs(c);
        SharedPreferences.Editor e = sp.edit().remove("snapAt");
        for (String k : sp.getAll().keySet()) if (k.startsWith("h_")) e.remove(k);
        e.commit();
    }

    /** Steps of the finished days. */
    static Map<String, Long> history(Context c) {
        Map<String, Long> out = new HashMap<>();
        for (Map.Entry<String, ?> x : prefs(c).getAll().entrySet())
            if (x.getKey().startsWith("h_") && x.getValue() instanceof Long)
                out.put(x.getKey().substring(2), (Long) x.getValue());
        return out;
    }
}
