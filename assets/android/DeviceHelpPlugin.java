package com.neowell.app;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;

/** Opens the vendor settings screens that restrict background work (Xiaomi autostart, battery) and toggles window flags. */
@CapacitorPlugin(name = "DeviceHelp")
public class DeviceHelpPlugin extends Plugin {
    @PluginMethod
    public void info(PluginCall call) {
        JSObject r = new JSObject();
        r.put("manufacturer", Build.MANUFACTURER.toLowerCase(Locale.ROOT));
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

    private void opened(PluginCall call, String what) {
        JSObject r = new JSObject();
        r.put("opened", what);
        call.resolve(r);
    }

    /** The app's own settings screen: where a permission denied twice can be turned on, since the system dialog no longer appears. */
    @PluginMethod
    public void openDetails(PluginCall call) {
        details(call);
    }

    /** Opens the messaging app with the number and the text filled in; the person presses send. No SMS permission is used. */
    @PluginMethod
    public void sms(PluginCall call) {
        String to = call.getString("to", "");
        Intent i = new Intent(Intent.ACTION_SENDTO, Uri.parse("smsto:" + Uri.encode(to)));
        i.putExtra("sms_body", call.getString("body", ""));
        opened(call, start(i) ? "sms" : "none");
    }

    private void details(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getContext().getPackageName()));
        opened(call, start(i) ? "details" : "none");
    }

    @PluginMethod
    public void openAutostart(PluginCall call) {
        Intent i = new Intent().setComponent(new ComponentName("com.miui.securitycenter", "com.miui.permcenter.autostart.AutoStartManagementActivity"));
        // The component name is unverified on HyperOS: the action name is the second attempt, the app details screen the last.
        if (start(i) || start(new Intent("miui.intent.action.OP_AUTO_START").addCategory(Intent.CATEGORY_DEFAULT))) opened(call, "autostart");
        else details(call);
    }

    @PluginMethod
    public void openBattery(PluginCall call) {
        Intent i = new Intent().setComponent(new ComponentName("com.miui.powerkeeper", "com.miui.powerkeeper.ui.HiddenAppsConfigActivity"));
        i.putExtra("package_name", getContext().getPackageName());
        i.putExtra("package_label", "NeoWell");
        if (start(i)) opened(call, "battery");
        else if (start(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS))) opened(call, "battery-generic");
        else details(call);
    }

    /** Keeps the screen on during a workout. A window flag needs no wake-lock permission and only acts while the window is visible. */
    @PluginMethod
    public void keepAwake(PluginCall call) {
        WindowFlags.keepAwake(this, call);
    }

    /** Blocks screenshots and the recents preview while the progress-photo screen is open (FLAG_SECURE). */
    @PluginMethod
    public void secure(PluginCall call) {
        WindowFlags.secure(this, call, WindowFlags.PHOTO);
    }
}
