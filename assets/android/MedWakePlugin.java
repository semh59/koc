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
    @Override
    public void load() {
        MedWakeReceiver.channel(getContext());
    }

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
        MedWakeReceiver.arm(getContext(), t, "APP");
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
        if (open(fsiIntent())) call.resolve();
        else call.reject("ayar açılamadı");
    }

    private Intent fsiIntent() {
        Uri pkg = Uri.parse("package:" + getContext().getPackageName());
        return Build.VERSION.SDK_INT >= 34 ? new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, pkg) : new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
    }

    private boolean open(Intent i) {
        try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /** Tanıdaki sorunun ayar ekranı: to = channel (id: ekran ya da ilaç kanalı), notif, battery, exact, fsi. Açılamazsa uygulama ayrıntıları. */
    @PluginMethod
    public void settings(PluginCall call) {
        String to = call.getString("to", ""), pkgName = getContext().getPackageName();
        Uri pkg = Uri.parse("package:" + pkgName);
        Intent i = null;
        if ("channel".equals(to) && Build.VERSION.SDK_INT >= 26) {
            MedWakeReceiver.channel(getContext());
            String id = "nw_med".equals(call.getString("id")) ? "nw_med" : MedWakeReceiver.CH;
            i = new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, pkgName).putExtra(Settings.EXTRA_CHANNEL_ID, id);
        } else if ("notif".equals(to) && Build.VERSION.SDK_INT >= 26) {
            i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, pkgName);
        } else if ("battery".equals(to)) {
            i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        } else if ("exact".equals(to) && Build.VERSION.SDK_INT >= 31) {
            i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg);
        } else if ("fsi".equals(to)) {
            i = fsiIntent();
        }
        if ((i != null && open(i)) || open(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg))) call.resolve();
        else call.reject("ayar açılamadı");
    }

    /** at (ms) verilirse o zamana, yoksa 15 sn sonraya ayrı test alarmı; en çok 5 dk ileri. */
    @PluginMethod
    public void test(PluginCall call) {
        long at = call.getData().optLong("at", 0), ms = at > 0 ? at - System.currentTimeMillis() : 15000;
        MedWakeReceiver.test(getContext(), Math.max(1000, Math.min(ms, 300000)));
        call.resolve();
    }

    /** Son alarm kayıtları (eskiden yeniye) ve şu anki izin/kanal durumu. */
    @PluginMethod
    public void log(PluginCall call) {
        JSObject r = new JSObject();
        r.put("items", MedWakeReceiver.log(getContext()));
        r.put("state", MedWakeReceiver.state(getContext(), "NOW"));
        r.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(r);
    }

    @PluginMethod
    public void clearLog(PluginCall call) {
        MedWakeReceiver.clearLog(getContext());
        call.resolve();
    }
}
