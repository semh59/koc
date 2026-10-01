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

/** Bildirimdeki "+250 ml" düğmesi: kayıt uygulama açılmadan SharedPreferences'a yazılır, uygulama bir sonraki açılışta alır. */
@CapacitorPlugin(name = "QuickLog")
public class QuickLogPlugin extends Plugin {
    private static final String ACTION_KEY = "LocalNotificationUserAction";
    private static final String ID_KEY = "LocalNotificationId";
    private static final String OBJ_KEY = "LocalNotficationObject";

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("nw_quick", Context.MODE_PRIVATE);
    }

    /** MainActivity'den çağrılır. Bildirim düğmesi "su" ise kaydı saklar, bildirimi kaldırır ve true döner. */
    static synchronized boolean handle(Context c, Intent in) {
        if (in == null || !"su".equals(in.getStringExtra(ACTION_KEY))) return false;
        int v = QuickMath.amount(in.getStringExtra(OBJ_KEY));
        if (v == 0) return false;
        SharedPreferences p = prefs(c);
        p.edit().putString("q", QuickMath.append(p.getString("q", ""), v, System.currentTimeMillis())).commit();
        int id = in.getIntExtra(ID_KEY, Integer.MIN_VALUE);
        if (id != Integer.MIN_VALUE) {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(id);
        }
        in.removeExtra(ACTION_KEY);
        return true;
    }

    private static synchronized String take(Context c) {
        SharedPreferences p = prefs(c);
        String s = p.getString("q", "");
        if (!s.isEmpty()) p.edit().remove("q").commit();
        return s;
    }

    @PluginMethod
    public void take(PluginCall call) {
        JSArray items = new JSArray();
        List<long[]> list = QuickMath.parse(take(getContext()));
        for (long[] x : list) {
            JSObject o = new JSObject();
            o.put("v", x[0]);
            o.put("t", x[1]);
            items.put(o);
        }
        JSObject r = new JSObject();
        r.put("items", items);
        call.resolve(r);
    }
}
