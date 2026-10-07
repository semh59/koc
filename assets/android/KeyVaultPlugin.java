package com.neowell.app;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.Key;
import java.security.KeyStore;
import java.security.UnrecoverableKeyException;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * API anahtarlarını Android Keystore'daki dışarı çıkarılamayan AES-GCM anahtarıyla şifreler.
 * Sözleşme: anahtar geçersizleştiyse (Keystore sıfırlandı, anahtar kullanılamıyor) ya da hiç yoksa decrypt, encrypt (reset olmadan) reject koduyla "KEY_INVALIDATED" döner;
 * eski şifreli veri artık çözülemez. Arayüz kullanıcıdan anahtarları yeniden ister ve encrypt'i {reset:true} ile çağırır (ya da önce resetKey()): yeni anahtar üretilir.
 */
@CapacitorPlugin(name = "KeyVault")
public class KeyVaultPlugin extends Plugin {
    private static final String ALIAS = "neowell_keyvault", INVALIDATED = "KEY_INVALIDATED";

    /** create: anahtar hiç yoksa üretir. Kayıtlı anahtar okunamıyorsa ya da (create değilse) yoksa InvalidKeyException. */
    private SecretKey key(boolean create) throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(ALIAS)) {
            Key k = null;
            try {
                k = ks.getKey(ALIAS, null);
            } catch (UnrecoverableKeyException e) {
                // geçersizleşmiş anahtar: aşağıda INVALIDATED
            }
            if (k instanceof SecretKey) return (SecretKey) k;
            throw new InvalidKeyException(INVALIDATED);
        }
        if (!create) throw new InvalidKeyException(INVALIDATED);
        KeyGenerator g = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        g.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return g.generateKey();
    }

    private void reset() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        if (ks.containsAlias(ALIAS)) ks.deleteEntry(ALIAS);
    }

    @PluginMethod
    public void resetKey(PluginCall call) {
        try {
            reset();
            call.resolve();
        } catch (Exception e) {
            call.reject("resetKey: " + e.getMessage());
        }
    }

    @PluginMethod
    public void encrypt(PluginCall call) {
        try {
            if (Boolean.TRUE.equals(call.getBoolean("reset", false))) reset();
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, key(true));
            byte[] iv = c.getIV();
            byte[] ct = c.doFinal(call.getString("text", "").getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            JSObject r = new JSObject();
            r.put("data", Base64.encodeToString(out, Base64.NO_WRAP));
            call.resolve(r);
        } catch (InvalidKeyException e) {
            call.reject("encrypt: " + INVALIDATED, INVALIDATED);
        } catch (Exception e) {
            call.reject("encrypt: " + e.getMessage());
        }
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        try {
            byte[] in = Base64.decode(call.getString("data", ""), Base64.NO_WRAP);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key(false), new GCMParameterSpec(128, in, 0, 12));
            JSObject r = new JSObject();
            r.put("text", new String(c.doFinal(in, 12, in.length - 12), StandardCharsets.UTF_8));
            call.resolve(r);
        } catch (InvalidKeyException e) {
            call.reject("decrypt: " + INVALIDATED, INVALIDATED);
        } catch (Exception e) {
            call.reject("decrypt: " + e.getMessage());
        }
    }
}
