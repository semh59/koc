package com.neowell.app;

import android.Manifest;
import android.content.Context;
import android.os.Build;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.List;

/** Otomatik yürüyüş/koşu algılama: izinler, açma/kapama, kullanıcı boyu-kilosu ve biten aralıkların alınması. */
@CapacitorPlugin(
    name = "Motion",
    permissions = {
        @Permission(strings = { Manifest.permission.ACTIVITY_RECOGNITION }, alias = "activity"),
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION }, alias = "fine"),
        @Permission(strings = { Manifest.permission.ACCESS_BACKGROUND_LOCATION }, alias = "bg")
    }
)
public class MotionPlugin extends Plugin {
    private boolean has(String alias) {
        if (Build.VERSION.SDK_INT < 29 && !alias.equals("fine")) return true;
        return getPermissionState(alias) == PermissionState.GRANTED;
    }

    private JSObject status() {
        JSObject r = new JSObject();
        r.put("activity", has("activity"));
        r.put("fine", has("fine"));
        r.put("bg", has("bg"));
        r.put("on", MotionStore.enabled(getContext()));
        return r;
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status());
    }

    /** Sırayla: fiziksel aktivite, hassas konum, "her zaman" konum. Her biri ayrı sistem penceresidir. */
    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (!has("activity")) requestPermissionForAlias("activity", call, "afterActivity");
        else afterActivity(call);
    }

    @PermissionCallback
    private void afterActivity(PluginCall call) {
        if (!has("activity")) call.resolve(status());
        else if (!has("fine")) requestPermissionForAlias("fine", call, "afterFine");
        else afterFine(call);
    }

    @PermissionCallback
    private void afterFine(PluginCall call) {
        if (!has("fine") || has("bg")) call.resolve(status());
        else requestPermissionForAlias("bg", call, "afterBg");
    }

    @PermissionCallback
    private void afterBg(PluginCall call) {
        call.resolve(status());
    }

    @PluginMethod
    public void configure(PluginCall call) {
        MotionStore.profile(getContext(), call.getDouble("cm", 0.0), call.getDouble("kg", 0.0));
        call.resolve();
    }

    @PluginMethod
    public void start(final PluginCall call) {
        final Context c = getContext();
        if (!has("activity")) {
            call.reject("izin yok");
            return;
        }
        try {
            MotionStore.setEnabled(c, true);
            MotionReceiver.register(c);
            call.resolve(status());
        } catch (Exception e) {
            MotionStore.setEnabled(c, false);
            call.reject("Etkinlik tanıma kurulamadı: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Context c = getContext();
        MotionStore.setEnabled(c, false);
        MotionStore.discard(c);
        MotionReceiver.cancelTick(c);
        MotionGpsService.stop(c);
        try {
            MotionReceiver.unregister(c);
        } catch (Exception e) {
            // Google Play hizmetleri yoksa kayıt zaten yok
        }
        call.resolve(status());
    }

    @PluginMethod
    public void take(PluginCall call) {
        JSArray items = new JSArray();
        List<String[]> l = MotionStore.takePending(getContext());
        for (String[] f : l) {
            try {
                JSObject o = new JSObject();
                o.put("t0", Long.parseLong(f[0]));
                o.put("t1", Long.parseLong(f[1]));
                o.put("k", f[2]);
                o.put("steps", Integer.parseInt(f[3]));
                o.put("km", Integer.parseInt(f[4]) / 100.0);
                o.put("kmh", Integer.parseInt(f[5]) / 10.0);
                o.put("kcal", Integer.parseInt(f[6]));
                o.put("gps", "1".equals(f[7]));
                items.put(o);
            } catch (NumberFormatException e) {
                // bozuk kayıt atlanır
            }
        }
        JSObject r = new JSObject();
        r.put("items", items);
        call.resolve(r);
    }
}
