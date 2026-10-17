package com.neowell.app;

import android.content.Intent;
import android.content.Context;
import android.content.pm.PackageManager;
import android.health.connect.AggregateRecordsRequest;
import android.health.connect.AggregateRecordsResponse;
import android.health.connect.HealthConnectException;
import android.health.connect.HealthConnectManager;
import android.health.connect.TimeInstantRangeFilter;
import android.health.connect.datatypes.HeartRateRecord;
import android.health.connect.datatypes.SleepSessionRecord;
import android.health.connect.datatypes.StepsRecord;
import android.os.Build;
import android.os.OutcomeReceiver;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Consumer;
import org.json.JSONException;

/**
 * Read-only access to Health Connect (built into Android 14+, no extra library).
 * Steps, sleep and heart rate: the watch writes its data there through Samsung Health, and Health Connect resolves double counting between sources by its own priority.
 * The app never writes to Health Connect.
 */
@CapacitorPlugin(name = "Health", permissions = { @Permission(strings = { "android.permission.health.READ_STEPS", "android.permission.health.READ_SLEEP", "android.permission.health.READ_HEART_RATE" }, alias = "health") })
public class HealthPlugin extends Plugin {
    private static final int MAX_DAYS = 40;
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    @Override
    protected void handleOnDestroy() {
        io.shutdown();
    }

    private boolean available() {
        return Build.VERSION.SDK_INT >= 34 && Hc.manager(getContext()) != null;
    }

    private boolean has(String perm) {
        return Build.VERSION.SDK_INT >= 34 && getContext().checkSelfPermission("android.permission.health." + perm) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean granted() {
        return has("READ_STEPS");
    }

    /** {available}: Health Connect exists on this phone (Android 14+); {granted}: steps permission; {sleep}, {hr}: sleep and heart-rate permissions (the three are granted separately). */
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", available());
        r.put("granted", granted());
        r.put("sleep", has("READ_SLEEP"));
        r.put("hr", has("READ_HEART_RATE"));
        call.resolve(r);
    }

    @PluginMethod
    public void request(PluginCall call) {
        if (!available() || (granted() && has("READ_SLEEP") && has("READ_HEART_RATE"))) {
            status(call);
            return;
        }
        requestPermissionForAlias("health", call, "permResult");
    }

    @PermissionCallback
    private void permResult(PluginCall call) {
        status(call);
    }

    /** Fallback when the permission dialog does not appear: Health Connect's own permission screen for NeoWell. */
    @PluginMethod
    public void manage(PluginCall call) {
        try {
            Intent i = new Intent("android.health.connect.action.MANAGE_HEALTH_PERMISSIONS").putExtra(Intent.EXTRA_PACKAGE_NAME, getContext().getPackageName());
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("cannot open");
        }
    }

    /** The "days" argument ("YYYY-MM-DD" strings), or null when it is missing, too long or contains a malformed date. Validated up front so a rejected call never receives late answers. */
    private static LocalDate[] days(PluginCall call) {
        JSArray in = call.getArray("days");
        if (in == null || in.length() == 0 || in.length() > MAX_DAYS) return null;
        LocalDate[] days = new LocalDate[in.length()];
        try {
            for (int k = 0; k < days.length; k++) days[k] = LocalDate.parse(in.getString(k));
        } catch (JSONException | RuntimeException e) {
            return null;
        }
        return days;
    }

    private static Instant min(Instant a, Instant b) {
        return a.isAfter(b) ? b : a;
    }

    /** Collects the answers of parallel aggregate calls into one result and resolves the call once, after the last answer. */
    private static final class Join {
        private final PluginCall call;
        private final JSObject result;
        private int left;
        private boolean failed;

        Join(PluginCall call, JSObject result) {
            this.call = call;
            this.result = result;
        }

        /** Stores v / div under the day when it is at least minValue (null means Health Connect has no data). */
        synchronized void put(JSObject to, String day, Long v, long div, long minValue) {
            if (v != null && v >= minValue) to.put(day, v / div);
        }

        void run(List<Runnable> jobs) {
            synchronized (this) {
                left = jobs.size() + 1; // +1: do not resolve before every job has started
            }
            for (Runnable j : jobs) j.run();
            tick();
        }

        synchronized void tick() {
            if (--left > 0) return;
            result.put("partial", failed);
            call.resolve(result);
        }

        synchronized void fail() {
            failed = true;
            tick();
        }
    }

    /** Total steps per local day (up to now for today). Result {days: {day: steps}, partial}. */
    @PluginMethod
    public void steps(final PluginCall call) {
        final LocalDate[] days = days(call);
        if (!granted() || days == null) {
            call.reject("unavailable");
            return;
        }
        Hc.steps(getContext(), io, call, days);
    }

    /**
     * Daily sleep and heart rate for the "days" argument. Sleep: total duration (minutes) of the sleep sessions between 18:00 the previous day and 18:00 that day,
     * so a night is written to the day the user woke up; heart rate: the local day's average and minimum. A type without permission comes back empty.
     * Result {sleep: {day: min}, hrAvg: {day: bpm}, hrMin: {day: bpm}, partial}.
     */
    @PluginMethod
    public void daily(final PluginCall call) {
        final LocalDate[] days = days(call);
        if (Build.VERSION.SDK_INT < 34 || days == null) {
            call.reject("unavailable");
            return;
        }
        Hc.daily(getContext(), io, call, days, has("READ_SLEEP"), has("READ_HEART_RATE"));
    }

    /** Every Health Connect type (Android 14+) lives here, not in the plugin's own methods or lambdas: Capacitor lists a plugin's declared methods at startup,
     *  and on Android 12 and 13 a signature naming a missing class crashes the app before it opens. */
    private static final class Hc {
        static HealthConnectManager manager(Context c) {
            return Build.VERSION.SDK_INT >= 34 ? c.getSystemService(HealthConnectManager.class) : null;
        }

        static AggregateRecordsRequest.Builder<Long> request(Instant from, Instant to) {
            return new AggregateRecordsRequest.Builder<Long>(new TimeInstantRangeFilter.Builder().setStartTime(from).setEndTime(to).build());
        }

        private static void aggregate(HealthConnectManager m, ExecutorService io, AggregateRecordsRequest<Long> req, Join j, Consumer<AggregateRecordsResponse<Long>> sink) {
            m.aggregate(req, io, new OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException>() {
                @Override
                public void onResult(AggregateRecordsResponse<Long> res) {
                    sink.accept(res);
                    j.tick();
                }

                @Override
                public void onError(HealthConnectException e) {
                    j.fail();
                }
            });
        }

        static void steps(Context c, ExecutorService io, final PluginCall call, final LocalDate[] days) {
            final HealthConnectManager m = manager(c);
            if (m == null) {
                call.reject("unavailable");
                return;
            }
            ZoneId z = ZoneId.systemDefault();
            Instant now = Instant.now();
            final JSObject out = new JSObject(), result = new JSObject();
            result.put("days", out);
            final Join j = new Join(call, result);
            List<Runnable> jobs = new ArrayList<>();
            for (LocalDate d : days) {
                Instant from = d.atStartOfDay(z).toInstant(), to = min(d.plusDays(1).atStartOfDay(z).toInstant(), now);
                if (to.isAfter(from))
                    jobs.add(() -> aggregate(m, io, request(from, to).addAggregationType(StepsRecord.STEPS_COUNT_TOTAL).build(), j,
                        res -> j.put(out, d.toString(), res.get(StepsRecord.STEPS_COUNT_TOTAL), 1L, 0L)));
            }
            j.run(jobs);
        }

        static void daily(Context c, ExecutorService io, final PluginCall call, final LocalDate[] days, boolean sl, boolean hr) {
            final HealthConnectManager m = manager(c);
            if (m == null) {
                call.reject("unavailable");
                return;
            }
            ZoneId z = ZoneId.systemDefault();
            Instant now = Instant.now();
            final JSObject sleep = new JSObject(), avg = new JSObject(), low = new JSObject(), result = new JSObject();
            result.put("sleep", sleep);
            result.put("hrAvg", avg);
            result.put("hrMin", low);
            final Join j = new Join(call, result);
            List<Runnable> jobs = new ArrayList<>();
            for (LocalDate d : days) {
                Instant s0 = d.minusDays(1).atTime(18, 0).atZone(z).toInstant(), s1 = min(d.atTime(18, 0).atZone(z).toInstant(), now);
                Instant h0 = d.atStartOfDay(z).toInstant(), h1 = min(d.plusDays(1).atStartOfDay(z).toInstant(), now);
                String day = d.toString();
                if (sl && s1.isAfter(s0))
                    jobs.add(() -> aggregate(m, io, request(s0, s1).addAggregationType(SleepSessionRecord.SLEEP_DURATION_TOTAL).build(), j,
                        res -> j.put(sleep, day, res.get(SleepSessionRecord.SLEEP_DURATION_TOTAL), 60000L, 1L)));
                if (hr && h1.isAfter(h0))
                    jobs.add(() -> aggregate(m, io, request(h0, h1).addAggregationType(HeartRateRecord.BPM_AVG).addAggregationType(HeartRateRecord.BPM_MIN).build(), j, res -> {
                        j.put(avg, day, res.get(HeartRateRecord.BPM_AVG), 1L, 1L);
                        j.put(low, day, res.get(HeartRateRecord.BPM_MIN), 1L, 1L);
                    }));
            }
            j.run(jobs);
        }
    }
}
