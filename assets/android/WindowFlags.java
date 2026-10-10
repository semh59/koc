package com.neowell.app;

import android.app.Activity;
import android.view.Window;
import android.view.WindowManager;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import java.util.function.Consumer;

/** Window flags toggled from JS. FLAG_SECURE has two independent owners (app lock, progress photos) and stays set while either holds it. */
final class WindowFlags {
    static final int LOCK = 1, PHOTO = 2;
    private static int secureOwners; // UI thread only

    private static void window(Plugin p, PluginCall call, Consumer<Window> change) {
        final Activity a = p.getActivity();
        if (a == null) {
            call.reject("no activity");
            return;
        }
        a.runOnUiThread(() -> {
            change.accept(a.getWindow());
            call.resolve();
        });
    }

    private static void flag(Window w, int flag, boolean on) {
        if (on) w.addFlags(flag);
        else w.clearFlags(flag);
    }

    static void keepAwake(Plugin p, PluginCall call) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        window(p, call, w -> flag(w, WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON, on));
    }

    static void secure(Plugin p, PluginCall call, int owner) {
        final boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        window(p, call, w -> {
            secureOwners = on ? secureOwners | owner : secureOwners & ~owner;
            flag(w, WindowManager.LayoutParams.FLAG_SECURE, secureOwners != 0);
        });
    }
}
