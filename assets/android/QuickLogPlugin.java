package com.neowell.app;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
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

    /** MainActivity'den çağrılır. Düğme "su" ya da "med" ise kaydı saklar, bildirimi kaldırır ve true döner. */
    static synchronized boolean handle(Context c, Intent in) {
        if (in == null) return false;
        // Son uygulamalardan açılışta sistem ilk intent'i (ek alanlarıyla) yeniden verir; kayıt ilk seferde yazıldı.
        if ((in.getFlags() & Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) != 0) {
            in.removeExtra(ACTION_KEY);
            return false;
        }
        String act = in.getStringExtra(ACTION_KEY), obj = in.getStringExtra(OBJ_KEY), key = null;
        int v = 0;
        if ("su".equals(act)) {
            v = QuickMath.amount(obj);
            if (v > 0) key = String.valueOf(v);
        } else if ("med".equals(act) || "medskip".equals(act)) {
            key = QuickMath.medKey(obj, "medskip".equals(act));
        }
        if (key == null) return false;
        SharedPreferences p = prefs(c);
        p.edit().putString("q", QuickMath.append(p.getString("q", ""), key, System.currentTimeMillis())).commit();
        if (v > 0) NeoWidget.bump(c, v);
        int id = in.getIntExtra(ID_KEY, Integer.MIN_VALUE);
        if (id != Integer.MIN_VALUE) {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(id);
                // İlaç: ana bildirim ve tekrar hatırlatmaları aynı dozun kardeşidir (kimlik + 1.000.000 × sıra); hepsi kalkar.
                if (id >= 1000000) for (int k = 0; k < 3; k++) nm.cancel(1000000 + (id - 1000000) % 1000000 + 1000000 * k);
            }
        }
        in.removeExtra(ACTION_KEY);
        return true;
    }

    private static synchronized String takeAll(Context c) {
        SharedPreferences p = prefs(c);
        String s = p.getString("q", "");
        if (!s.isEmpty()) p.edit().remove("q").commit();
        return s;
    }

    @PluginMethod
    public void take(PluginCall call) {
        JSArray items = new JSArray();
        List<String[]> list = QuickMath.parse(takeAll(getContext()));
        for (String[] x : list) {
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
        }
        JSObject r = new JSObject();
        r.put("items", items);
        call.resolve(r);
    }
}
