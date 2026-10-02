package com.neowell.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Otomatik yedek klasörü: kullanıcı Storage Access Framework ile bir klasör seçer, kalıcı izin yalnız o klasöre alınır.
 * Klasör adresi yalnız burada saklanır, JS'e verilmez ve loglanmaz. Yalnız yedek adındaki dosyalar yazılır ve silinir.
 */
@CapacitorPlugin(name = "BackupFolder")
public class BackupFolderPlugin extends Plugin {
    private static final String NAME_RE = "neowell-yedek-\\d{4}-\\d{2}-\\d{2}\\.json";
    private static final int FLAGS = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences("nw_backup", Context.MODE_PRIVATE);
    }

    /** Kayıtlı ve yazma izni hâlâ geçerli klasör, yoksa null (klasör silinmiş ya da izin kaldırılmış). */
    private Uri tree() {
        String s = prefs().getString("tree", null);
        if (s == null) return null;
        Uri u = Uri.parse(s);
        for (UriPermission p : getContext().getContentResolver().getPersistedUriPermissions())
            if (p.getUri().equals(u) && p.isWritePermission()) return u;
        return null;
    }

    private String folderName(Uri t) {
        Uri doc = DocumentsContract.buildDocumentUriUsingTree(t, DocumentsContract.getTreeDocumentId(t));
        try (Cursor c = getContext().getContentResolver().query(doc, new String[] { DocumentsContract.Document.COLUMN_DISPLAY_NAME }, null, null, null)) {
            if (c != null && c.moveToFirst()) return c.getString(0);
        } catch (Exception e) {
            // klasör erişilemez: ad boş döner, yazma denemesi hatayı gösterir
        }
        return "";
    }

    @PluginMethod
    public void status(PluginCall call) {
        Uri t = tree();
        JSObject r = new JSObject();
        r.put("set", t != null);
        r.put("name", t != null ? folderName(t) : "");
        call.resolve(r);
    }

    @PluginMethod
    public void pick(PluginCall call) {
        Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).addFlags(FLAGS | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        startActivityForResult(call, i, "picked");
    }

    @ActivityCallback
    private void picked(PluginCall call, ActivityResult res) {
        Uri u = res.getData() == null ? null : res.getData().getData();
        if (res.getResultCode() != Activity.RESULT_OK || u == null) {
            call.reject("canceled");
            return;
        }
        ContentResolver cr = getContext().getContentResolver();
        try {
            cr.takePersistableUriPermission(u, FLAGS);
        } catch (SecurityException e) {
            call.reject("izin alınamadı");
            return;
        }
        release(u);
        prefs().edit().putString("tree", u.toString()).apply();
        JSObject r = new JSObject();
        r.put("name", folderName(u));
        call.resolve(r);
    }

    /** Eski klasörün kalıcı iznini bırakır (keep dışındaki); keep null ise hepsini. */
    private void release(Uri keep) {
        ContentResolver cr = getContext().getContentResolver();
        for (UriPermission p : cr.getPersistedUriPermissions()) {
            if (p.getUri().equals(keep)) continue;
            try {
                cr.releasePersistableUriPermission(p.getUri(), FLAGS);
            } catch (SecurityException e) {
                // izin zaten yok
            }
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        release(null);
        prefs().edit().remove("tree").apply();
        call.resolve();
    }

    /** Klasördeki yedek adlı dosyalar: ad → belge adresi. */
    private java.util.Map<String, Uri> list(Uri t) {
        java.util.Map<String, Uri> out = new java.util.TreeMap<>();
        Uri kids = DocumentsContract.buildChildDocumentsUriUsingTree(t, DocumentsContract.getTreeDocumentId(t));
        String[] cols = { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor c = getContext().getContentResolver().query(kids, cols, null, null, null)) {
            while (c != null && c.moveToNext()) {
                String n = c.getString(1);
                if (n != null && n.matches(NAME_RE)) out.put(n, DocumentsContract.buildDocumentUriUsingTree(t, c.getString(0)));
            }
        }
        return out;
    }

    /** Yedeği yazar (aynı adlı dosya varsa üzerine), klasördeki yedek adlarını döndürür. */
    @PluginMethod
    public void write(PluginCall call) {
        String name = call.getString("name", ""), data = call.getString("data", "");
        Uri t = tree();
        if (t == null) {
            call.reject("klasör yok");
            return;
        }
        if (!name.matches(NAME_RE) || data.isEmpty()) {
            call.reject("geçersiz");
            return;
        }
        try {
            ContentResolver cr = getContext().getContentResolver();
            Uri doc = list(t).get(name);
            if (doc == null) doc = DocumentsContract.createDocument(cr, DocumentsContract.buildDocumentUriUsingTree(t, DocumentsContract.getTreeDocumentId(t)), "application/json", name);
            if (doc == null) throw new IllegalStateException("oluşturulamadı");
            try (OutputStream os = cr.openOutputStream(doc, "wt")) {
                if (os == null) throw new IllegalStateException("açılamadı");
                os.write(data.getBytes(StandardCharsets.UTF_8));
            }
            JSArray names = new JSArray();
            for (String n : list(t).keySet()) names.put(n);
            JSObject r = new JSObject();
            r.put("names", names);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("yazılamadı");
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        Uri t = tree();
        if (t == null) {
            call.reject("klasör yok");
            return;
        }
        try {
            java.util.Map<String, Uri> have = list(t);
            JSArray names = call.getArray("names", new JSArray());
            for (int i = 0; i < names.length(); i++) {
                Uri doc = have.get(names.getString(i));
                if (doc != null) DocumentsContract.deleteDocument(getContext().getContentResolver(), doc);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("silinemedi");
        }
    }
}
