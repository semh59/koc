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
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Otomatik yedek klasörü: kullanıcı Storage Access Framework ile bir klasör seçer, kalıcı izin yalnız o klasöre alınır.
 * Klasör adresi yalnız burada saklanır, JS'e verilmez ve loglanmaz. Yalnız otomatik yedek adındaki (neowell-oto-) dosyalar yazılır ve silinir; elle yedeklere dokunulmaz.
 */
@CapacitorPlugin(name = "BackupFolder")
public class BackupFolderPlugin extends Plugin {
    private static final String NAME_RE = "neowell-oto-\\d{4}-\\d{2}-\\d{2}\\.json";
    /** Yeni yedek önce bu adla yazılır ve doğrulanır; kalan eski geçici dosya sonraki yazmada silinir. */
    private static final String TMP = "neowell-oto-yeni.json";
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
        String old = prefs().getString("tree", null);
        if (old != null && !old.equals(u.toString())) release(Uri.parse(old));
        prefs().edit().putString("tree", u.toString()).apply();
        // @ActivityCallback ana iş parçacığında çalışır: klasör adı sorgusu (ContentResolver) arka planda yapılır.
        final Uri chosen = u;
        getBridge().execute(() -> {
            JSObject r = new JSObject();
            r.put("name", folderName(chosen));
            call.resolve(r);
        });
    }

    /** Yalnız bu klasörün kalıcı izni bırakılır; uygulamanın başka kalıcı izinleri varsa onlara dokunulmaz. */
    private void release(Uri u) {
        try {
            getContext().getContentResolver().releasePersistableUriPermission(u, FLAGS);
        } catch (SecurityException e) {
            // izin zaten yok
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        String old = prefs().getString("tree", null);
        if (old != null) release(Uri.parse(old));
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
                if (n != null && (n.matches(NAME_RE) || n.equals(TMP))) out.put(n, DocumentsContract.buildDocumentUriUsingTree(t, c.getString(0)));
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
            Uri dir = DocumentsContract.buildDocumentUriUsingTree(t, DocumentsContract.getTreeDocumentId(t));
            java.util.Map<String, Uri> have = list(t);
            if (have.get(TMP) != null) DocumentsContract.deleteDocument(cr, have.get(TMP));
            // Yeni dosya önce geçici adla yazılıp doğrulanır, eskisi ancak ondan sonra silinir: yazma yarıda kalırsa (disk dolu, bağlantı) mevcut yedek korunur.
            // Yeni dosyada "w" yeter (kısaltılacak eski bayt yok), "wt" desteklemeyen sağlayıcılar da çalışır.
            Uri tmp = create(cr, dir, TMP);
            try {
                put(cr, tmp, "w", data);
                if (!same(cr, tmp, data)) throw new IllegalStateException("doğrulanamadı");
            } catch (Exception e) {
                try {
                    DocumentsContract.deleteDocument(cr, tmp);
                } catch (Exception ignored) {
                    // kalan geçici dosya sonraki yazmada silinir
                }
                throw e;
            }
            if (have.get(name) != null) DocumentsContract.deleteDocument(cr, have.get(name));
            if (DocumentsContract.renameDocument(cr, tmp, name) == null) {
                put(cr, create(cr, dir, name), "w", data);
                DocumentsContract.deleteDocument(cr, tmp);
            }
            JSArray names = new JSArray();
            for (String n : list(t).keySet()) if (n.matches(NAME_RE)) names.put(n);
            JSObject r = new JSObject();
            r.put("names", names);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("yazılamadı");
        }
    }

    private static Uri create(ContentResolver cr, Uri dir, String name) throws Exception {
        Uri doc = DocumentsContract.createDocument(cr, dir, "application/json", name);
        if (doc == null) throw new IllegalStateException("oluşturulamadı");
        return doc;
    }

    private static void put(ContentResolver cr, Uri doc, String mode, String data) throws Exception {
        try (OutputStream os = cr.openOutputStream(doc, mode)) {
            if (os == null) throw new IllegalStateException("açılamadı");
            os.write(data.getBytes(StandardCharsets.UTF_8));
        }
    }

    private static boolean same(ContentResolver cr, Uri doc, String data) throws Exception {
        byte[] want = data.getBytes(StandardCharsets.UTF_8), got = new byte[want.length + 1];
        try (InputStream in = cr.openInputStream(doc)) {
            if (in == null) return false;
            int n = 0, k;
            while (n < got.length && (k = in.read(got, n, got.length - n)) > 0) n += k;
            return n == want.length && Arrays.equals(Arrays.copyOf(got, n), want);
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
