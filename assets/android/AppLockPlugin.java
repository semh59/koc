package com.neowell.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.os.Build;
import android.os.CancellationSignal;
import android.view.WindowManager;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Uygulama kilidi: telefonun kendi ekran kilidi doğrular (parmak izi, yüz, PIN, desen, parola). Uygulama parola ya da biyometrik veri saklamaz.
 * Android 11 ve üstü sistemin biyometrik penceresi (parola yedeğiyle), daha eskisi cihaz kimlik bilgisi ekranı.
 */
@CapacitorPlugin(name = "AppLock")
public class AppLockPlugin extends Plugin {
    private CancellationSignal pending;

    private boolean secure() {
        KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        return km != null && km.isDeviceSecure();
    }

    /** Cihazda ekran kilidi var mı: yoksa kilit kurulamaz. */
    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("secure", secure());
        call.resolve(r);
    }

    /** Sonuç: {ok} başarılı; {none} cihazda ekran kilidi yok; {cancelled} kullanıcı vazgeçti; aksi halde {code}. */
    @PluginMethod
    public void authenticate(final PluginCall call) {
        final Activity a = getActivity();
        final String title = call.getString("title", "NeoWell");
        if (a == null) {
            call.reject("etkinlik yok");
            return;
        }
        if (!secure()) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("none", true);
            call.resolve(r);
            return;
        }
        if (Build.VERSION.SDK_INT >= 30) {
            a.runOnUiThread(() -> prompt(a, call, title));
            return;
        }
        KeyguardManager km = (KeyguardManager) getContext().getSystemService(Context.KEYGUARD_SERVICE);
        Intent i = km.createConfirmDeviceCredentialIntent(title, null);
        if (i == null) {
            JSObject r = new JSObject();
            r.put("ok", false);
            r.put("none", true);
            call.resolve(r);
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

    @android.annotation.TargetApi(30)
    private void prompt(Activity a, final PluginCall call, String title) {
        if (pending != null) pending.cancel();
        pending = new CancellationSignal();
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
                // 14: cihazda ekran kilidi kalmadı (kullanıcı uygulama kilidi açıkken telefon kilidini kaldırdı).
                if (code == 14) r.put("none", true);
                else if (code == 10 || code == 5) r.put("cancelled", true); // 10: kullanıcı vazgeçti, 5: sistem iptal etti
                call.resolve(r);
            }
        });
    }

    /** Son uygulamalar önizlemesi ve ekran görüntüsü kapanır: kilit açıkken içerik arka planda görünmez. */
    @PluginMethod
    public void setSecure(PluginCall call) {
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
