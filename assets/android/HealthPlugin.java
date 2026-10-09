package com.neowell.app;

import android.content.Intent;
import android.health.connect.AggregateRecordsRequest;
import android.health.connect.AggregateRecordsResponse;
import android.health.connect.HealthConnectException;
import android.health.connect.HealthConnectManager;
import android.health.connect.TimeInstantRangeFilter;
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
 * Saatin adımları Samsung Health aracılığıyla oraya yazılır; kaynaklar arası çift sayımı Health Connect kendi önceliğiyle çözer.
 * Uygulama Health Connect'e hiçbir şey yazmaz.
 */
@CapacitorPlugin(name = "Health", permissions = { @Permission(strings = { "android.permission.health.READ_STEPS" }, alias = "steps") })
public class HealthPlugin extends Plugin {
    private final Executor io = Executors.newSingleThreadExecutor();

    private HealthConnectManager manager() {
        return Build.VERSION.SDK_INT >= 34 ? getContext().getSystemService(HealthConnectManager.class) : null;
    }

    private boolean granted() {
        return Build.VERSION.SDK_INT >= 34 && getContext().checkSelfPermission("android.permission.health.READ_STEPS") == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    /** {available}: bu telefonda Health Connect var (Android 14+); {granted}: adım okuma izni verilmiş. */
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", manager() != null);
        r.put("granted", granted());
        call.resolve(r);
    }

    @PluginMethod
    public void request(PluginCall call) {
        if (manager() == null || granted()) {
            status(call);
            return;
        }
        requestPermissionForAlias("steps", call, "permResult");
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
