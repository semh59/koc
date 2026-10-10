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

/** Automatic walk/run detection: permissions, on/off, the user's height and weight, collecting finished intervals, and the GPS window of a manual walk. There is no background location permission. */
@CapacitorPlugin(
    name = "Motion",
    permissions = {
        @Permission(strings = { Manifest.permission.ACTIVITY_RECOGNITION }, alias = "activity"),
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION }, alias = "fine")
    }
)
public class MotionPlugin extends Plugin {
    private boolean has(String alias) {
        if (Build.VERSION.SDK_INT < 29 && !alias.equals("fine")) return true; // activity recognition became a runtime permission in Android 10
        return getPermissionState(alias) == PermissionState.GRANTED;
    }

    private JSObject status() {
        JSObject r = new JSObject();
        r.put("activity", has("activity"));
        r.put("fine", has("fine"));
        r.put("on", MotionStore.enabled(getContext()));
        MotionMath.Model m = MotionStore.model(getContext());
        r.put("fw", m.f[MotionMath.WALK]);
        r.put("fr", m.f[MotionMath.RUN]);
        return r;
    }

    @PluginMethod
    public void status(PluginCall call) {
        call.resolve(status());
    }

    /** Automatic detection asks only for the physical-activity permission; the location permission is requested with requestPermissions when a manual walk starts. */
    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (!has("activity")) requestPermissionForAlias("activity", call, "afterActivity");
        else status(call);
    }

    @PermissionCallback
    private void afterActivity(PluginCall call) {
        status(call);
    }

    /** Opens the GPS window when a manual walk starts (the app is visible) and closes it when the walk ends. Does not open without the location permission. */
    @PluginMethod
    public void walkGps(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false)) && has("fine");
        if (on) MotionGpsService.start(getContext());
        else MotionGpsService.stop(getContext());
        JSObject r = new JSObject();
        r.put("gps", on);
        call.resolve(r);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        MotionStore.profile(getContext(), call.getDouble("cm", 0.0), call.getDouble("kg", 0.0));
        call.resolve();
    }

    /** The reject messages are shown to the user. */
    @PluginMethod
    public void start(final PluginCall call) {
        final Context c = getContext();
        if (!has("activity")) {
            call.reject("izin yok");
            return;
        }
        try {
            MotionStore.setEnabled(c, true);
            MotionReceiver.register(c).addOnSuccessListener(v -> call.resolve(status())).addOnFailureListener(e -> {
                MotionStore.setEnabled(c, false);
                call.reject("Bu telefonda etkinlik tanıma (Google Play hizmetleri) kullanılamıyor");
            });
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
        try {
            MotionReceiver.unregister(c);
        } catch (Exception e) {
            // without Google Play services nothing was registered
        }
        call.resolve(status());
    }

    @PluginMethod
    public void take(PluginCall call) {
        JSArray items = new JSArray();
        for (String[] f : MotionStore.takePending(getContext())) {
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
                // malformed record: skipped
            }
        }
        JSObject r = new JSObject();
        r.put("items", items);
        call.resolve(r);
    }
}
