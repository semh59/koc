package com.neowell.app;

import android.app.Activity;
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
            Activity a = getActivity();
            if (a != null) a.startActivity(i);
            else getContext().startActivity(i);
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
        // Bileşen adı HyperOS'ta doğrulanmadı: eylem adı ikinci deneme, o da yoksa uygulama ayrıntıları ekranı.
        if (start(i) || start(new Intent("miui.intent.action.OP_AUTO_START").addCategory(Intent.CATEGORY_DEFAULT))) {
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
        final Activity a = getActivity();
        if (a == null) {
            call.reject("etkinlik yok");
            return;
        }
        a.runOnUiThread(() -> {
            if (on) a.getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            else a.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            call.resolve();
        });
    }

    /** İlerleme fotoğrafı ekranı açıkken ekran görüntüsü ve son uygulamalar önizlemesi kapanır (FLAG_SECURE). */
    @PluginMethod
    public void secure(PluginCall call) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        final Activity a = getActivity();
        if (a == null) {
            call.reject("etkinlik yok");
            return;
        }
        a.runOnUiThread(() -> {
            if (on) a.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
            else a.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
            call.resolve();
        });
    }
}
