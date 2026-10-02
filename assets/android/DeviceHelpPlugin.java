package com.neowell.app;

import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Üretici kısıtlamaları (Xiaomi otomatik başlat, pil) için ilgili ayar ekranını doğrudan açar. */
@CapacitorPlugin(name = "DeviceHelp")
public class DeviceHelpPlugin extends Plugin {
    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        r.put("manufacturer", Build.MANUFACTURER.toLowerCase());
        call.resolve(r);
    }

    private boolean start(Intent i) {
        try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private void details(PluginCall call, String how) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
        JSObject r = new JSObject();
        r.put("opened", start(i) ? how : "none");
        call.resolve(r);
    }

    @PluginMethod
    public void openAutostart(PluginCall call) {
        Intent i = new Intent().setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
        if (start(i)) {
            JSObject r = new JSObject();
            r.put("opened", "autostart");
            call.resolve(r);
        } else details(call, "details");
    }

    @PluginMethod
    public void openBattery(PluginCall call) {
        Intent i = new Intent().setComponent(new ComponentName("com.miui.powerkeeper", "com.miui.powerkeeper.ui.HiddenAppsConfigActivity"));
        i.putExtra("package_name", getContext().getPackageName());
        i.putExtra("package_label", "NeoWell");
        if (start(i)) {
            JSObject r = new JSObject();
            r.put("opened", "battery");
            call.resolve(r);
        } else if (start(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))) {
            JSObject r = new JSObject();
            r.put("opened", "battery-generic");
            call.resolve(r);
        } else details(call, "details");
    }

    /** Antrenmanda ekranı açık tutar. Pencere bayrağı yalnız pencere görünürken etkilidir; Wake Lock izni ve pil kilidi gerekmez. */
    @PluginMethod
    public void keepAwake(PluginCall call) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        getActivity().runOnUiThread(() -> {
            if (on) getActivity().getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else getActivity().getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }
}
