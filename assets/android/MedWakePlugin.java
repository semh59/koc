package com.neowell.app;

import android.app.NotificationManager;
import android.app.PendingIntent;
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

/** JS passes the medication dose times (ms); this plugin sets the alarms that wake the screen at each dose. */
@CapacitorPlugin(name = "MedWake")
public class MedWakePlugin extends Plugin {
    static final int SNOOZE_RC = 7141;
    private static final long TEST_DEFAULT_MS = 15000, TEST_MIN_MS = 1000, TEST_MAX_MS = 300000, SNOOZE_MAX_MS = 3600000;

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
        JSArray doses = call.getArray("doses");
        MedWakeReceiver.setDetail(getContext(), call.getBoolean("detail", false));
        MedWakeReceiver.saveDoses(getContext(), doses == null ? new JSArray() : doses);
        MedWakeReceiver.arm(getContext(), t, "APP");
        call.resolve();
    }

    /** From Android 14 the full-screen notification is open only to alarm and calling apps by default; the user grants it in Settings. */
    @PluginMethod
    public void fsi(PluginCall call) {
        boolean ok = true;
        if (Build.VERSION.SDK_INT >= 34) ok = getContext().getSystemService(NotificationManager.class).canUseFullScreenIntent();
        JSObject r = new JSObject();
        r.put("allowed", ok);
        call.resolve(r);
    }

    @PluginMethod
    public void fsiSettings(PluginCall call) {
        if (open(fsiIntent())) call.resolve();
        else call.reject("cannot open settings");
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

    /** Settings screen for a problem found by the diagnosis: to = channel (id: wake-screen or medication channel), notif, battery, exact, fsi, miui. Falls back to the app details screen. */
    @PluginMethod
    public void settings(PluginCall call) {
        String to = call.getString("to", ""), pkgName = getContext().getPackageName();
        Uri pkg = Uri.parse("package:" + pkgName);
        Intent i = null;
        if ("channel".equals(to) && Build.VERSION.SDK_INT >= 26) {
            MedWakeReceiver.channel(getContext());
            String id = "nw_med".equals(call.getString("id")) ? MedWakeReceiver.medId(getContext()) : MedWakeReceiver.wakeId(getContext());
            i = new Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, pkgName).putExtra(Settings.EXTRA_CHANNEL_ID, id);
        } else if ("notif".equals(to) && Build.VERSION.SDK_INT >= 26) {
            i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, pkgName);
        } else if ("battery".equals(to)) {
            i = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
        } else if ("exact".equals(to) && Build.VERSION.SDK_INT >= 31) {
            i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg);
        } else if ("fsi".equals(to)) {
            i = fsiIntent();
        } else if ("miui".equals(to)) {
            i = new Intent("miui.intent.action.APP_PERM_EDITOR").setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity").putExtra("extra_pkgname", pkgName);
        }
        if ((i != null && open(i)) || open(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg))) call.resolve();
        else call.reject("cannot open settings");
    }

    /** Separate test alarm at "at" (ms), or 15 s from now when absent; at most 5 minutes ahead. */
    @PluginMethod
    public void test(PluginCall call) {
        long at = call.getData().optLong("at", 0), ms = at > 0 ? at - System.currentTimeMillis() : TEST_DEFAULT_MS;
        MedWakeReceiver.test(getContext(), Math.max(TEST_MIN_MS, Math.min(ms, TEST_MAX_MS)));
        call.resolve();
    }

    /** The latest alarm records (oldest first) and the current permission and channel state. */
    @PluginMethod
    public void log(PluginCall call) {
        JSObject r = new JSObject();
        r.put("items", MedWakeReceiver.log(getContext()));
        r.put("state", MedWakeReceiver.state(getContext(), "NOW"));
        r.put("sdk", Build.VERSION.SDK_INT);
        call.resolve(r);
    }

    @PluginMethod
    public void wipe(PluginCall call) {
        MedWakeReceiver.wipe(getContext());
        call.resolve();
    }

    @PluginMethod
    public void clearLog(PluginCall call) {
        MedWakeReceiver.clearLog(getContext());
        call.resolve();
    }

    /** Snooze: wakes the screen again at "at" (ms, at most 1 hour ahead) with a request code separate from the dose alarms; cancels when "at" is absent or past. The time is kept so a restart sets it again. */
    @PluginMethod
    public void snooze(PluginCall call) {
        snoozeAt(getContext(), call.getData().optLong("at", 0));
        call.resolve();
    }

    static void snoozeAt(Context c, long at) {
        long now = System.currentTimeMillis();
        Intent i = new Intent(c, MedWakeReceiver.class).setAction("com.neowell.app.MED_WAKE");
        PendingIntent pi = PendingIntent.getBroadcast(c, SNOOZE_RC, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (at <= now) {
            Alarms.manager(c).cancel(pi);
            MedWakeReceiver.saveSnooze(c, 0);
        } else {
            long t = Math.min(at, now + SNOOZE_MAX_MS);
            Alarms.setClock(c, t, pi);
            MedWakeReceiver.saveSnooze(c, t);
        }
    }
}
