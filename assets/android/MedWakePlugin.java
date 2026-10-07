package com.neowell.app;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;

/** JS, ilaç doz zamanlarını (ms) verir; dozda ekranı uyandıran alarmlar kurulur. */
@CapacitorPlugin(name = "MedWake")
public class MedWakePlugin extends Plugin {
    @PluginMethod
    public void set(PluginCall call) {
        JSArray a = call.getArray("times");
        long[] t = new long[a == null ? 0 : a.length()];
        try {
            for (int i = 0; i < t.length; i++) t[i] = a.getLong(i);
        } catch (JSONException e) {
            call.reject("times");
            return;
        }
        MedWakeReceiver.arm(getContext(), t);
        call.resolve();
    }

    /** Android 14+ tam ekran bildirimi varsayılan olarak yalnız alarm/arama uygulamalarına açık; kullanıcı Ayarlar'dan verir. */
    @PluginMethod
    public void fsi(PluginCall call) {
        boolean ok = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = (NotificationManager) getContext().getSystemService(Context.NOTIFICATION_SERVICE);
            ok = nm != null && nm.canUseFullScreenIntent();
        }
        JSObject r = new JSObject();
        r.put("allowed", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void fsiSettings(PluginCall call) {
        try {
            Uri pkg = Uri.parse("package:" + getContext().getPackageName());
            Intent i = Build.VERSION.SDK_INT >= 34 ? new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, pkg) : new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("ayar açılamadı");
        }
    }

    @PluginMethod
    public void test(PluginCall call) {
        MedWakeReceiver.test(getContext(), 15000);
        call.resolve();
    }
}
