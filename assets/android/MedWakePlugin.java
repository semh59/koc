package com.neowell.app;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.WindowManager;
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
        } else if ("miui".equals(to)) {
            i = new Intent("miui.intent.action.APP_PERM_EDITOR").setClassName("com.miui.securitycenter", "com.miui.permcenter.permissions.PermissionsEditorActivity").putExtra("extra_pkgname", pkgName);
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

    // MainActivity imzalı uyandırma intent'iyle açılınca zamanı yazar; JS açılışta ve öne gelişte bir kez okur, alarm ekranını açar.
    private static long wakeAt;
    static final long WAKE_TTL = 90000;
    static final int SNOOZE_RC = 7141;

    static synchronized void markWake() {
        wakeAt = System.currentTimeMillis();
    }

    /** Okuma bayrağı siler: iki kez okunmaz, 90 sn'den eski uyandırma sayılmaz. */
    static synchronized boolean takeWake(long now) {
        long at = wakeAt;
        wakeAt = 0;
        return at > 0 && now >= at && now - at <= WAKE_TTL;
    }

    @PluginMethod
    public void wakeLaunched(PluginCall call) {
        JSObject r = new JSObject();
        r.put("launched", takeWake(System.currentTimeMillis()));
        call.resolve(r);
    }

    /** Alarm ekranı kapanınca kilit ekranı üstünde gösterme bayrakları kalkar; kilit yeniden görünür. */
    @PluginMethod
    @SuppressWarnings("deprecation")
    public void release(PluginCall call) {
        final Activity a = getActivity();
        if (a == null) {
            call.resolve();
            return;
        }
        a.runOnUiThread(() -> {
            if (Build.VERSION.SDK_INT >= 27) {
                a.setShowWhenLocked(false);
                a.setTurnScreenOn(false);
            } else {
                a.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
            }
            call.resolve();
        });
    }

    /** Erteleme: at (ms) zamanında doz alarmlarından ayrı kodla ekranı yeniden uyandırır (en çok 1 saat ileri); at verilmezse ya da geçmişse iptal eder. */
    @PluginMethod
    public void snooze(PluginCall call) {
        Context c = getContext();
        long at = call.getData().optLong("at", 0), now = System.currentTimeMillis();
        Intent i = new Intent(c, MedWakeReceiver.class).setAction("com.neowell.app.MED_WAKE");
        PendingIntent pi = PendingIntent.getBroadcast(c, SNOOZE_RC, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        if (at <= now) {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            if (am != null) am.cancel(pi);
        } else {
            Alarms.setClock(c, Math.min(at, now + 3600000), pi);
        }
        call.resolve();
    }
}
