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
 * Encrypts API keys with a non-exportable AES-GCM key in the Android Keystore.
 * Contract: when the key was invalidated (Keystore reset, key unusable) or does not exist, decrypt and encrypt (without reset) reject with the code "KEY_INVALIDATED";
 * the old ciphertext can no longer be decrypted. The UI asks the user for the keys again and calls encrypt with {reset:true} (or resetKey() first), which creates a new key.
 */
@CapacitorPlugin(name = "KeyVault")
public class KeyVaultPlugin extends Plugin {
    private static final String ALIAS = "neowell_keyvault", INVALIDATED = "KEY_INVALIDATED", TRANSFORM = "AES/GCM/NoPadding";
    private static final int IV_BYTES = 12, TAG_BITS = 128;

    private static KeyStore keyStore() throws Exception {
        KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
        ks.load(null);
        return ks;
    }

    /** create: generates the key if none exists. InvalidKeyException when the saved key is unreadable, or missing while create is false. */
    private static SecretKey key(boolean create) throws Exception {
        KeyStore ks = keyStore();
        if (ks.containsAlias(ALIAS)) {
            Key k = null;
            try {
                k = ks.getKey(ALIAS, null);
            } catch (UnrecoverableKeyException e) {
                // invalidated key: reported as INVALIDATED below
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

    private static void reset() throws Exception {
        KeyStore ks = keyStore();
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
            Cipher c = Cipher.getInstance(TRANSFORM);
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
            Cipher c = Cipher.getInstance(TRANSFORM);
            c.init(Cipher.DECRYPT_MODE, key(false), new GCMParameterSpec(TAG_BITS, in, 0, IV_BYTES));
            JSObject r = new JSObject();
            r.put("text", new String(c.doFinal(in, IV_BYTES, in.length - IV_BYTES), StandardCharsets.UTF_8));
            call.resolve(r);
        } catch (InvalidKeyException e) {
            call.reject("decrypt: " + INVALIDATED, INVALIDATED);
        } catch (Exception e) {
            call.reject("decrypt: " + e.getMessage());
        }
    }
}
