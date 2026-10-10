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
import java.util.Map;
import java.util.TreeMap;

/**
 * Automatic backup folder: the user picks a folder with the Storage Access Framework and only that folder gets a persistent grant.
 * The folder address stays in this class: it is never given to JS or written to the system journal. Only files named like automatic backups (neowell-oto-) are written and deleted; manual backups are never touched.
 */
@CapacitorPlugin(name = "BackupFolder")
public class BackupFolderPlugin extends Plugin {
    private static final String NAME_RE = "neowell-oto-\\d{4}-\\d{2}-\\d{2}\\.json";
    /** A new backup is written under this name and verified first; a leftover temporary file is deleted by the next write. */
    private static final String TMP = "neowell-oto-yeni.json";
    private static final int FLAGS = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences("nw_backup", Context.MODE_PRIVATE);
    }

    /** The saved folder if its write grant is still valid, otherwise null (folder deleted or grant revoked). */
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
            // folder unreachable: the name stays empty and the next write reports the failure
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
            call.reject("permission denied");
            return;
        }
        String old = prefs().getString("tree", null);
        if (old != null && !old.equals(u.toString())) release(Uri.parse(old));
        prefs().edit().putString("tree", u.toString()).apply();
        // @ActivityCallback runs on the main thread: the folder name query (ContentResolver) goes to a background thread.
        final Uri chosen = u;
        getBridge().execute(() -> {
            JSObject r = new JSObject();
            r.put("name", folderName(chosen));
            call.resolve(r);
        });
    }

    /** Releases the persistent grant of this folder only; other persistent grants of the app stay. */
    private void release(Uri u) {
        try {
            getContext().getContentResolver().releasePersistableUriPermission(u, FLAGS);
        } catch (SecurityException e) {
            // the grant is already gone
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        String old = prefs().getString("tree", null);
        if (old != null) release(Uri.parse(old));
        prefs().edit().remove("tree").apply();
        call.resolve();
    }

    /** Backup-named files in the folder: name to document address. */
    private Map<String, Uri> list(Uri t) {
        Map<String, Uri> out = new TreeMap<>();
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

    /** Writes the backup (replacing a file of the same name) and returns the backup names in the folder. */
    @PluginMethod
    public void write(PluginCall call) {
        String name = call.getString("name", ""), data = call.getString("data", "");
        Uri t = tree();
        if (t == null) {
            call.reject("no folder");
            return;
        }
        if (!name.matches(NAME_RE) || data.isEmpty()) {
            call.reject("invalid");
            return;
        }
        try {
            ContentResolver cr = getContext().getContentResolver();
            Uri dir = DocumentsContract.buildDocumentUriUsingTree(t, DocumentsContract.getTreeDocumentId(t));
            Map<String, Uri> have = list(t);
            if (have.get(TMP) != null) DocumentsContract.deleteDocument(cr, have.get(TMP));
            // The new file is written under a temporary name and verified before the old one is deleted: if the write stops halfway (disk full, connection), the existing backup survives.
            // Plain "w" is enough for a new file (there are no old bytes to cut off) and also works with providers that lack the cutting mode.
            Uri tmp = create(cr, dir, TMP);
            try {
                put(cr, tmp, "w", data);
                if (!same(cr, tmp, data)) throw new IllegalStateException("verification failed");
            } catch (Exception e) {
                try {
                    DocumentsContract.deleteDocument(cr, tmp);
                } catch (Exception ignored) {
                    // a leftover temporary file is deleted by the next write
                }
                throw e;
            }
            if (have.get(name) != null) DocumentsContract.deleteDocument(cr, have.get(name));
            Uri renamed = null;
            try {
                renamed = DocumentsContract.renameDocument(cr, tmp, name);
            } catch (Exception e) {
                // The old file is gone and the rename failed: the fallback below still writes the new content, so the day's backup is not lost.
            }
            if (renamed == null) {
                put(cr, create(cr, dir, name), "w", data);
                DocumentsContract.deleteDocument(cr, tmp);
            }
            JSArray names = new JSArray();
            for (String n : list(t).keySet()) if (n.matches(NAME_RE)) names.put(n);
            JSObject r = new JSObject();
            r.put("names", names);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("write failed");
        }
    }

    private static Uri create(ContentResolver cr, Uri dir, String name) throws Exception {
        Uri doc = DocumentsContract.createDocument(cr, dir, "application/json", name);
        if (doc == null) throw new IllegalStateException("create failed");
        return doc;
    }

    private static void put(ContentResolver cr, Uri doc, String mode, String data) throws Exception {
        try (OutputStream os = cr.openOutputStream(doc, mode)) {
            if (os == null) throw new IllegalStateException("open failed");
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
            call.reject("no folder");
            return;
        }
        try {
            Map<String, Uri> have = list(t);
            JSArray names = call.getArray("names", new JSArray());
            for (int i = 0; i < names.length(); i++) {
                Uri doc = have.get(names.getString(i));
                if (doc != null) DocumentsContract.deleteDocument(getContext().getContentResolver(), doc);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("delete failed");
        }
    }
}
