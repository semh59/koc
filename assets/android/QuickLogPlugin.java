package com.neowell.app;

import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;
import com.capacitorjs.plugins.localnotifications.NotificationStorage;
import com.capacitorjs.plugins.localnotifications.TimedNotificationPublisher;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.security.SecureRandom;
import java.util.List;

/** Bildirim düğmeleri ("+250 ml", "Aldım"): kayıt uygulama açılmadan SharedPreferences'a yazılır, uygulama bir sonraki açılışta alır. */
@CapacitorPlugin(name = "QuickLog")
public class QuickLogPlugin extends Plugin {
    static final String ACTION_KEY = "LocalNotificationUserAction";
    private static final String ID_KEY = "LocalNotificationId";
    private static final String OBJ_KEY = "LocalNotficationObject";

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("nw_quick", Context.MODE_PRIVATE);
    }

    /** Bildirimlere konan gizli anahtar (128 bit, ilk istekte üretilir). Kayıt yalnız bu anahtarı taşıyan bildirimden yazılır. */
    static synchronized String secret(Context c) {
        SharedPreferences p = prefs(c);
        String s = p.getString("tk", null);
        if (s != null) return s;
        byte[] b = new byte[16];
        new SecureRandom().nextBytes(b);
        StringBuilder sb = new StringBuilder();
        for (byte x : b) sb.append(Character.forDigit((x >> 4) & 15, 16)).append(Character.forDigit(x & 15, 16));
        s = sb.toString();
        p.edit().putString("tk", s).apply();
        return s;
    }

    /** Bildirim eklentisinin zamanlanmış alarmını (istek kodu = bildirim kimliği) ve kayıtlı kopyasını siler; kopya kalırsa açılışta yeniden kurulur. */
    private static void cancelPending(Context c, int id) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            PendingIntent pi = PendingIntent.getBroadcast(c, id, new Intent(c, TimedNotificationPublisher.class), Build.VERSION.SDK_INT >= 31 ? PendingIntent.FLAG_MUTABLE : 0);
            if (pi != null) am.cancel(pi);
        }
        new NotificationStorage(c).deleteNotification(Integer.toString(id));
    }

    /** İlaç: ana bildirim ve tekrar hatırlatmaları aynı dozun kardeşidir (ana kimlik 1.000.000-1.999.999; tekrarlar kimlik + 1.000.000 × sıra, sıra 1-2).
     *  Uygulama kapalıyken JS yeniden planlayamaz: bekleyen tekrar alarmları ve kayıtlı kopyaları burada iptal edilir. */
    private static void cancelSiblings(Context c, int id, boolean med) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        int base = id % 1000000, count = med ? 3 : 1;
        for (int k = 0; k < count; k++) {
            int sid = med ? base + 1000000 * (k + 1) : id;
            if (nm != null) nm.cancel(sid);
            if (med) cancelPending(c, sid);
        }
    }

    /** Alarm ekranından ilaç kaydı ("m12_0800" alındı, "k12_0800" atlandı): bildirim düğmeleriyle aynı kuyruğa yazılır, uygulama açılınca alınır. */
    static synchronized void recordMed(Context c, String key, int id) {
        SharedPreferences p = prefs(c);
        p.edit().putString("q", QuickMath.append(p.getString("q", ""), key, System.currentTimeMillis())).commit();
        cancelSiblings(c, id, true);
        MedWakeReceiver.drop(c, key);
    }

    /**
     * MainActivity ve WaterReceiver'dan çağrılır. Düğme "su" ya da "med" ise kaydı saklar, bildirimi kaldırır ve true döner.
     * MainActivity exported olduğu için her uygulama aynı ek alanlarla onu açabilir; o yoldan (widget=false) kayıt yalnız
     * gizli anahtarı taşıyan bildirimden yazılır. Widget alıcısı exported=false, yalnız uygulamanın PendingIntent'i ulaşır.
     */
    static synchronized boolean handle(Context c, Intent in, boolean widget) {
        if (in == null) return false;
        // Son uygulamalardan açılışta sistem ilk intent'i (ek alanlarıyla) yeniden verir; kayıt ilk seferde yazıldı.
        if ((in.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) {
            in.removeExtra(ACTION_KEY);
            return false;
        }
        String act = in.getStringExtra(ACTION_KEY), obj = in.getStringExtra(OBJ_KEY), key = null;
        int v = 0;
        boolean med = "med".equals(act) || "medskip".equals(act);
        if ("su".equals(act)) {
            v = QuickMath.amount(obj);
            if (v > 0) key = String.valueOf(v);
        } else if (med) {
            key = QuickMath.medKey(obj, "medskip".equals(act));
        }
        if (key == null) {
            if (med && (widget || QuickMath.signed(obj, secret(c)))) Log.w("NW-QUICK", "İlaç kaydı atlandı: kimlik 1-999 dışında ya da saat bozuk");
            return false;
        }
        if (!widget && !QuickMath.signed(obj, secret(c))) return false;
        int id = in.getIntExtra(ID_KEY, Integer.MIN_VALUE);
        SharedPreferences p = prefs(c);
        // Bildirim intent'ini sistem yeniden teslim edebilir (süreç ölümü, MIUI); aynı planlanmış bildirim iki kez yazılmaz.
        // Meşru ikinci dokunuş olamaz: bildirim ilk dokunuşta kaldırılır, her yeni bildirimin "at"ı farklıdır.
        String tok = QuickMath.token(obj), sig = tok == null ? null : id + "@" + tok, seen = p.getString("seen", "");
        if (sig != null && QuickMath.seen(seen, sig)) {
            in.removeExtra(ACTION_KEY);
            return false;
        }
        SharedPreferences.Editor e = p.edit().putString("q", QuickMath.append(p.getString("q", ""), key, System.currentTimeMillis()));
        if (sig != null) e.putString("seen", QuickMath.remember(seen, sig));
        // Kuyruk yazısı dayanıklı olmalı: kapalı uygulamada alıcı süreci hemen sonlanabilir, apply() asenkron yazmayı kaçırır.
        e.commit();
        if (v > 0) NeoWidget.bump(c, v);
        if (id != Integer.MIN_VALUE) cancelSiblings(c, id, med);
        if (med) MedWakeReceiver.drop(c, key);
        in.removeExtra(ACTION_KEY);
        return true;
    }

    /** Alınan kayıtlar "inflight"ta kalır, JS kalıcı yazdıktan sonra ack ile silinir: alma ile yazma arasında süreç ölürse kayıt kaybolmaz. */
    private static synchronized String takeAll(Context c) {
        SharedPreferences p = prefs(c);
        String q = p.getString("q", ""), inf = p.getString("inflight", ""), s = inf + q;
        if (!q.isEmpty()) p.edit().remove("q").putString("inflight", s).commit();
        return s;
    }

    /** upto (ms) ve öncesi kayıtları kalıcı yazıldı sayıp siler; sonrası (başka bir alışın kayıtları) kalır. */
    @PluginMethod
    public synchronized void ack(PluginCall call) {
        long upto = call.getLong("upto", 0L);
        SharedPreferences p = prefs(getContext());
        String left = "";
        for (String[] x : QuickMath.parse(p.getString("inflight", ""))) {
            try {
                long t = Long.parseLong(x[1]);
                if (t > upto) left = QuickMath.append(left, x[0], t);
            } catch (RuntimeException e) {
                // bozuk kayıt atılır
            }
        }
        if (left.isEmpty()) p.edit().remove("inflight").commit();
        else p.edit().putString("inflight", left).commit();
        call.resolve();
    }

    @PluginMethod
    public void getToken(PluginCall call) {
        JSObject r = new JSObject();
        r.put("tk", secret(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void take(PluginCall call) {
        JSArray items = new JSArray();
        List<String[]> list = QuickMath.parse(takeAll(getContext()));
        for (String[] x : list) {
            // Bozuk bir kayıt yalnız kendini atar, diğerleri kaybolmaz.
            try {
                JSObject o = new JSObject();
                if (x[0].charAt(0) == 'm' || x[0].charAt(0) == 'k') {
                    int us = x[0].indexOf('_');
                    o.put("m", Integer.parseInt(x[0].substring(1, us)));
                    o.put("s", x[0].substring(us + 1, us + 3) + ":" + x[0].substring(us + 3));
                    o.put("k", x[0].charAt(0) == 'k');
                } else {
                    o.put("v", Integer.parseInt(x[0]));
                }
                o.put("t", Long.parseLong(x[1]));
                items.put(o);
            } catch (RuntimeException e) {
                // bozuk kayıt atlanır
            }
        }
        JSObject r = new JSObject();
        r.put("items", items);
        call.resolve(r);
    }
}
