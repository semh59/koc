package com.neowell.app;

import android.annotation.TargetApi;
import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Intent;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * App lock: the phone's own screen lock verifies the user (fingerprint, face, PIN, pattern, password); the app stores no password or biometric data.
 * Android 11+ uses the system biometric prompt (with credential fallback), older versions the device-credential screen.
 */
@CapacitorPlugin(name = "AppLock")
public class AppLockPlugin extends Plugin {
    /** BiometricPrompt error codes (the framework constants are hidden). */
    private static final int ERR_CANCELED = 5, ERR_USER_CANCELED = 10, ERR_NO_DEVICE_CREDENTIAL = 14;
    private CancellationSignal pending;

    private boolean secure() {
        return getContext().getSystemService(KeyguardManager.class).isDeviceSecure();
    }

    /** {secure}: the device has a screen lock; without one the app lock cannot be turned on. */
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("secure", secure());
        call.resolve(r);
    }

    private static void none(PluginCall call) {
        JSObject r = new JSObject();
        r.put("ok", false);
        r.put("none", true);
        call.resolve(r);
    }

    /** Result: {ok} verified; {none} the device has no screen lock; {cancelled} the user gave up; otherwise {code}. */
    @PluginMethod
    public void authenticate(final PluginCall call) {
        final Activity a = getActivity();
        final String title = call.getString("title", "NeoWell");
        if (a == null) {
            call.reject("no activity");
            return;
        }
        if (!secure()) {
            none(call);
            return;
        }
        if (Build.VERSION.SDK_INT >= 30) {
            a.runOnUiThread(() -> prompt(a, call, title));
            return;
        }
        Intent i = getContext().getSystemService(KeyguardManager.class).createConfirmDeviceCredentialIntent(title, null);
        if (i == null) {
            none(call);
            return;
        }
        startActivityForResult(call, i, "credResult");
    }

    @ActivityCallback
    private void credResult(PluginCall call, ActivityResult res) {
        JSObject r = new JSObject();
        boolean ok = res != null && res.getResultCode() == Activity.RESULT_OK;
        r.put("ok", ok);
        if (!ok) r.put("cancelled", true);
        call.resolve(r);
    }

    @TargetApi(30)
    private void prompt(Activity a, final PluginCall call, String title) {
        if (pending != null) pending.cancel();
        pending = new CancellationSignal();
        try {
            BiometricPrompt p = new BiometricPrompt.Builder(a).setTitle(title)
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL).build();
            p.authenticate(pending, a.getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                    JSObject r = new JSObject();
                    r.put("ok", true);
                    call.resolve(r);
                }

                @Override
                public void onAuthenticationError(int code, CharSequence msg) {
                    JSObject r = new JSObject();
                    r.put("ok", false);
                    r.put("code", code);
                    // The user removed the phone's screen lock while the app lock was on.
                    if (code == ERR_NO_DEVICE_CREDENTIAL) r.put("none", true);
                    else if (code == ERR_USER_CANCELED || code == ERR_CANCELED) r.put("cancelled", true);
                    call.resolve(r);
                }
            });
        } catch (RuntimeException e) {
            // Permission or system failure (e.g. SecurityException): do not crash, count the verification as failed.
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("code", -1);
            call.resolve(r);
        }
    }

    /** Hides the recents preview and blocks screenshots while the lock is on, so content is not visible in the background. */
    @PluginMethod
    public void setSecure(PluginCall call) {
        WindowFlags.secure(this, call, WindowFlags.LOCK);
    }
}
