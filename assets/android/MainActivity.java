package com.neowell.app;

import android.content.Intent;
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
        MedWakeReceiver.channel(this);
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

    @Override
    protected void onNewIntent(Intent intent) {
        if (QuickLogPlugin.handle(this, intent, false)) {
            moveTaskToBack(true);
            return;
        }
        super.onNewIntent(intent);
    }
}
