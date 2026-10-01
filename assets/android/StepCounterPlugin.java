package com.neowell.app;

import android.Manifest;
import android.os.Build;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.Map;

/** Telefonun adım sensörünü okur (Google hesabı ya da Health Connect gerekmez). */
@CapacitorPlugin(
    name = "StepCounter",
    permissions = { @Permission(strings = { Manifest.permission.ACTIVITY_RECOGNITION }, alias = "activity") }
)
public class StepCounterPlugin extends Plugin {
    private boolean granted() {
        return Build.VERSION.SDK_INT < 29 || getPermissionState("activity") == PermissionState.GRANTED;
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject r = new JSObject();
        r.put("available", StepStore.available(getContext()));
        r.put("granted", granted());
        call.resolve(r);
    }

    @PluginMethod
    public void requestAccess(PluginCall call) {
        if (granted()) {
            resolveGranted(call);
        } else {
            requestPermissionForAlias("activity", call, "permResult");
        }
    }

    @PermissionCallback
    private void permResult(PluginCall call) {
        resolveGranted(call);
    }

    private void resolveGranted(PluginCall call) {
        JSObject r = new JSObject();
        r.put("granted", granted());
        call.resolve(r);
    }

    @PluginMethod
    public void start(PluginCall call) {
        StepSnapshotReceiver.schedule(getContext());
        call.resolve();
    }

    @PluginMethod
    public void read(final PluginCall call) {
        if (!granted()) {
            call.reject("izin yok");
            return;
        }
        StepStore.read(getContext(), false, new StepStore.Callback() {
            public void done(Long steps, Map<String, Long> history) {
                JSObject r = new JSObject(), h = new JSObject();
                for (Map.Entry<String, Long> e : history.entrySet()) h.put(e.getKey(), e.getValue());
                if (steps != null) r.put("steps", steps);
                r.put("history", h);
                call.resolve(r);
            }
        });
    }
}
