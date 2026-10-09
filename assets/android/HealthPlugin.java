package com.neowell.app;

import android.content.Intent;
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
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import org.json.JSONException;

/**
 * Health Connect'ten yalnız okuma (Android 14 ve üstünde sistemin içinde hazır gelir; ek kitaplık yok).
 * Adım, uyku ve nabız: saatin verisi Samsung Health aracılığıyla oraya yazılır; kaynaklar arası çift sayımı Health Connect kendi önceliğiyle çözer.
 * Uygulama Health Connect'e hiçbir şey yazmaz.
 */
@CapacitorPlugin(name = "Health", permissions = { @Permission(strings = { "android.permission.health.READ_STEPS", "android.permission.health.READ_SLEEP", "android.permission.health.READ_HEART_RATE" }, alias = "health") })
public class HealthPlugin extends Plugin {
    private final Executor io = Executors.newSingleThreadExecutor();

    private HealthConnectManager manager() {
        return Build.VERSION.SDK_INT >= 34 ? getContext().getSystemService(HealthConnectManager.class) : null;
    }

    private boolean has(String perm) {
        return Build.VERSION.SDK_INT >= 34 && getContext().checkSelfPermission("android.permission.health." + perm) == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    private boolean granted() {
        return has("READ_STEPS");
    }

    /** {available}: bu telefonda Health Connect var (Android 14+); {granted}: adım okuma izni; {sleep}, {hr}: uyku ve nabız okuma izinleri (üçü ayrı verilir). */
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", manager() != null);
        r.put("granted", granted());
        r.put("sleep", has("READ_SLEEP"));
        r.put("hr", has("READ_HEART_RATE"));
        call.resolve(r);
    }

    @PluginMethod
    public void request(PluginCall call) {
        if (manager() == null || (granted() && has("READ_SLEEP") && has("READ_HEART_RATE"))) {
            status(call);
            return;
        }
        requestPermissionForAlias("health", call, "permResult");
    }

    @PermissionCallback
    private void permResult(PluginCall call) {
        status(call);
    }

    /** İzin penceresi açılmazsa: Health Connect'in NeoWell izin ekranı. */
    @PluginMethod
    public void manage(PluginCall call) {
        try {
            Intent i = new Intent("android.health.connect.action.MANAGE_HEALTH_PERMISSIONS").putExtra(Intent.EXTRA_PACKAGE_NAME, getContext().getPackageName());
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("açılamadı");
        }
    }

    /** days: "YYYY-MM-DD" günleri; her gün için yerel gün başından (bugünse şimdiye kadar) toplam adım. Sonuç {days: {gün: adım}}. */
    @PluginMethod
    public void steps(final PluginCall call) {
        final HealthConnectManager m = manager();
        JSArray in = call.getArray("days");
        if (m == null || !granted() || in == null || in.length() == 0 || in.length() > 40) {
            call.reject("kullanılamaz");
            return;
        }
        final int n = in.length();
        final String[] day = new String[n];
        final Instant[] from = new Instant[n], to = new Instant[n];
        ZoneId z = ZoneId.systemDefault();
        Instant now = Instant.now();
        // Önce hepsi doğrulanır: yarıda reddedilen çağrıya sonradan gelen yanıtlar yazılmasın.
        for (int k = 0; k < n; k++) {
            try {
                day[k] = in.getString(k);
                LocalDate d = LocalDate.parse(day[k]);
                from[k] = d.atStartOfDay(z).toInstant();
                Instant end = d.plusDays(1).atStartOfDay(z).toInstant();
                to[k] = end.isAfter(now) ? now : end;
            } catch (JSONException | RuntimeException e) {
                call.reject("geçersiz gün");
                return;
            }
        }
        final JSObject out = new JSObject();
        final int[] left = { n };
        final boolean[] failed = { false };
        for (int k = 0; k < n; k++) {
            final String dk = day[k];
            if (!to[k].isAfter(from[k])) {
                finish(call, out, left, failed, dk, null);
                continue;
            }
            AggregateRecordsRequest<Long> req = new AggregateRecordsRequest.Builder<Long>(new TimeInstantRangeFilter.Builder().setStartTime(from[k]).setEndTime(to[k]).build())
                .addAggregationType(StepsRecord.STEPS_COUNT_TOTAL).build();
            m.aggregate(req, io, new OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException>() {
                @Override
                public void onResult(AggregateRecordsResponse<Long> res) {
                    finish(call, out, left, failed, dk, res.get(StepsRecord.STEPS_COUNT_TOTAL));
                }

                @Override
                public void onError(HealthConnectException e) {
                    synchronized (left) {
                        failed[0] = true;
                    }
                    finish(call, out, left, failed, dk, null);
                }
            });
        }
    }

    /** Günlük uyku ve nabız sonuçlarını toplar; son yanıt gelince çağrıyı tek kez çözer. */
    private static final class Daily {
        final PluginCall call;
        final JSObject sleep = new JSObject(), avg = new JSObject(), min = new JSObject();
        int left;
        boolean failed;

        Daily(PluginCall call) {
            this.call = call;
        }

        synchronized void put(JSObject to, String day, Long v, long div) {
            if (v != null && v > 0) to.put(day, v / div);
        }

        synchronized void tick() {
            if (--left > 0) return;
            JSObject r = new JSObject();
            r.put("sleep", sleep);
            r.put("hrAvg", avg);
            r.put("hrMin", min);
            r.put("partial", failed);
            call.resolve(r);
        }

        synchronized void fail() {
            failed = true;
            tick();
        }
    }

    private static TimeInstantRangeFilter range(Instant a, Instant b) {
        return new TimeInstantRangeFilter.Builder().setStartTime(a).setEndTime(b).build();
    }

    /** Günlük uyku ve nabız. days: "YYYY-MM-DD". Uyku: önceki gün 18:00 - o gün 18:00 arasındaki uyku oturumlarının toplam süresi (dakika), yani gün uyanılan güne yazılır;
     *  nabız: yerel gün ortalaması ve en düşüğü. İzni olmayan tür boş döner. Sonuç {sleep:{gün:dk}, hrAvg:{gün:bpm}, hrMin:{gün:bpm}}. */
    @PluginMethod
    public void daily(final PluginCall call) {
        final HealthConnectManager m = manager();
        JSArray in = call.getArray("days");
        if (m == null || in == null || in.length() == 0 || in.length() > 40) {
            call.reject("kullanılamaz");
            return;
        }
        final boolean sl = has("READ_SLEEP"), hr = has("READ_HEART_RATE");
        final int n = in.length();
        ZoneId z = ZoneId.systemDefault();
        Instant now = Instant.now();
        final String[] day = new String[n];
        final Instant[][] w = new Instant[n][4];
        // Önce hepsi doğrulanır: yarıda reddedilen çağrıya sonradan gelen yanıtlar yazılmasın.
        for (int k = 0; k < n; k++) {
            try {
                day[k] = in.getString(k);
                LocalDate d = LocalDate.parse(day[k]);
                w[k][0] = d.minusDays(1).atTime(18, 0).atZone(z).toInstant();
                w[k][1] = d.atTime(18, 0).atZone(z).toInstant();
                w[k][2] = d.atStartOfDay(z).toInstant();
                w[k][3] = d.plusDays(1).atStartOfDay(z).toInstant();
                if (w[k][1].isAfter(now)) w[k][1] = now;
                if (w[k][3].isAfter(now)) w[k][3] = now;
            } catch (JSONException | RuntimeException e) {
                call.reject("geçersiz gün");
                return;
            }
        }
        final Daily d = new Daily(call);
        final java.util.List<Runnable> jobs = new java.util.ArrayList<>();
        for (int k = 0; k < n; k++) {
            final String dk = day[k];
            final Instant s0 = w[k][0], s1 = w[k][1], h0 = w[k][2], h1 = w[k][3];
            if (sl && s1.isAfter(s0)) {
                jobs.add(() -> m.aggregate(new AggregateRecordsRequest.Builder<Long>(range(s0, s1)).addAggregationType(SleepSessionRecord.SLEEP_DURATION_TOTAL).build(), io,
                    new OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException>() {
                        @Override
                        public void onResult(AggregateRecordsResponse<Long> res) {
                            d.put(d.sleep, dk, res.get(SleepSessionRecord.SLEEP_DURATION_TOTAL), 60000L);
                            d.tick();
                        }

                        @Override
                        public void onError(HealthConnectException e) {
                            d.fail();
                        }
                    }));
            }
            if (hr && h1.isAfter(h0)) {
                jobs.add(() -> m.aggregate(new AggregateRecordsRequest.Builder<Long>(range(h0, h1)).addAggregationType(HeartRateRecord.BPM_AVG).addAggregationType(HeartRateRecord.BPM_MIN).build(), io,
                    new OutcomeReceiver<AggregateRecordsResponse<Long>, HealthConnectException>() {
                        @Override
                        public void onResult(AggregateRecordsResponse<Long> res) {
                            d.put(d.avg, dk, res.get(HeartRateRecord.BPM_AVG), 1L);
                            d.put(d.min, dk, res.get(HeartRateRecord.BPM_MIN), 1L);
                            d.tick();
                        }

                        @Override
                        public void onError(HealthConnectException e) {
                            d.fail();
                        }
                    }));
            }
        }
        d.left = jobs.size() + 1; // +1: tüm işler başlatılmadan çözülmesin
        for (Runnable j : jobs) j.run();
        d.tick();
    }

    private static void finish(PluginCall call, JSObject out, int[] left, boolean[] failed, String day, Long v) {
        boolean last;
        synchronized (left) {
            if (v != null) out.put(day, v.longValue());
            last = --left[0] == 0;
        }
        if (!last) return;
        JSObject r = new JSObject();
        r.put("days", out);
        r.put("partial", failed[0]);
        call.resolve(r);
    }
}
