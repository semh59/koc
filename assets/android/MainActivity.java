package com.neowell.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.PluginMethod;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Notification water/medication button: the record is written in the background and the screen does not stay open. savedInstanceState != null means the activity
        // is recreated after process death and the intent is the old one; BridgeActivity.load() hands it to onNewIntent inside super.onCreate, so the extra is removed here.
        boolean quick = false;
        if (savedInstanceState == null) quick = QuickLogPlugin.handle(this, getIntent(), false);
        else getIntent().removeExtra(QuickLogPlugin.ACTION_KEY);
        registerPlugin(HealthPlugin.class);
        registerPlugin(MedWakePlugin.class);
        registerPlugin(AppLockPlugin.class);
        registerPlugin(KeyVaultPlugin.class);
        registerPlugin(DeviceHelpPlugin.class);
        registerPlugin(StepCounterPlugin.class);
        registerPlugin(OcrPlugin.class);
        registerPlugin(QuickLogPlugin.class);
        registerPlugin(MotionPlugin.class);
        registerPlugin(WidgetPlugin.class);
        registerPlugin(SpeechPlugin.class);
        registerPlugin(BackupFolderPlugin.class);
        super.onCreate(savedInstanceState);
        diag(getIntent());
        medChannel();
        if (quick) moveTaskToBack(true);
    }

    // Triggered only by the CI smoke test (am start --ez nw_diag true). The release build writes no console to logcat; this confirms that the plugins loaded and that
    // their @PluginMethod methods survived shrinking (R8). Only the plugin name and the method count are logged.
    private void diag(Intent in) {
        if (in == null || !in.getBooleanExtra("nw_diag", false)) return;
        StringBuilder sb = new StringBuilder();
        for (String n : new String[] {"LocalNotifications", "Share", "Filesystem", "App", "BarcodeScanner", "MedWake", "AppLock", "KeyVault", "DeviceHelp", "StepCounter", "Ocr", "QuickLog", "Motion", "Widget", "Speech", "BackupFolder", "Health"}) {
            PluginHandle h = getBridge() == null ? null : getBridge().getPlugin(n);
            int k = 0;
            if (h != null && h.getInstance() != null)
                for (java.lang.reflect.Method m : h.getInstance().getClass().getDeclaredMethods()) if (m.isAnnotationPresent(PluginMethod.class)) k++;
            sb.append(n).append('=').append(k).append(' ');
        }
        Log.i("NW-DIAG", sb.toString().trim());
    }

    // The medication reminder rings like an alarm: alarm-sound channel, high importance, vibration. Whether it sounds in silent mode depends on the phone's own settings.
    private void medChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel("nw_med") != null) return;
        NotificationChannel ch = new NotificationChannel("nw_med", "İlaç alarmı", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("İlaç saatinde alarm gibi çalan hatırlatıcı");
        ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[] {0, 600, 300, 600, 300, 600});
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        if (QuickLogPlugin.handle(this, intent, false)) {
            moveTaskToBack(true);
            return;
        }
        super.onNewIntent(intent);
    }
}
