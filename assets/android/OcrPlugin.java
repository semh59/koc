package com.neowell.app;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Rect;
import android.util.Base64;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/** Reads text in a photo on the phone (ML Kit, free, offline). Returns the text and position of every line. */
@CapacitorPlugin(name = "Ocr")
public class OcrPlugin extends Plugin {
    /** A photo whose long side exceeds this is decoded downscaled by a power of two: a full-resolution photo runs out of memory. Line positions refer to the returned w/h. */
    private static final int MAX_SIDE = 2560;

    @PluginMethod
    public void recognize(final PluginCall call) {
        String b64 = call.getString("image");
        if (b64 == null || b64.isEmpty()) { call.reject("no image"); return; }
        final Bitmap bm;
        try {
            byte[] d = Base64.decode(b64, Base64.DEFAULT);
            BitmapFactory.Options o = new BitmapFactory.Options();
            o.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(d, 0, d.length, o);
            int side = Math.max(o.outWidth, o.outHeight), k = 1;
            while (side / k > MAX_SIDE) k *= 2;
            o.inJustDecodeBounds = false;
            o.inSampleSize = k;
            bm = BitmapFactory.decodeByteArray(d, 0, d.length, o);
        } catch (Exception | OutOfMemoryError e) { call.reject("cannot decode image"); return; }
        if (bm == null) { call.reject("cannot decode image"); return; }
        final TextRecognizer rec = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        rec.process(InputImage.fromBitmap(bm, 0))
            .addOnSuccessListener(t -> {
                JSArray lines = new JSArray();
                for (Text.TextBlock b : t.getTextBlocks()) {
                    for (Text.Line l : b.getLines()) {
                        Rect r = l.getBoundingBox();
                        if (r == null) continue;
                        JSObject o = new JSObject();
                        o.put("t", l.getText());
                        o.put("x", r.left);
                        o.put("y", r.top);
                        o.put("w", r.width());
                        o.put("h", r.height());
                        lines.put(o);
                    }
                }
                JSObject res = new JSObject();
                res.put("lines", lines);
                res.put("w", bm.getWidth());
                res.put("h", bm.getHeight());
                rec.close();
                bm.recycle();
                call.resolve(res);
            })
            .addOnFailureListener(e -> { rec.close(); bm.recycle(); call.reject("recognition failed: " + e.getMessage()); });
    }
}
