package com.neowell.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import java.util.Locale;
import java.util.Map;
import org.json.JSONException;
import org.json.JSONObject;

/** Ana ekran widget'ı: uygulamanın gönderdiği özeti (SharedPreferences "nw_widget") gösterir. */
public class NeoWidget extends AppWidgetProvider {
    static final String OPEN = "nw_widget_open";

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("nw_widget", Context.MODE_PRIVATE);
    }

    private static JSONObject load(Context c) {
        try {
            return new JSONObject(prefs(c).getString("d", "{}"));
        } catch (JSONException e) {
            return new JSONObject();
        }
    }

    static synchronized void push(Context c, String json) {
        prefs(c).edit().putString("d", json).commit();
        refresh(c);
    }

    /** Bildirim/widget "+su" düğmesi: uygulama açılmadan önce de widget'taki su artsın. */
    static synchronized void bump(Context c, int v) {
        JSONObject o = load(c);
        String today = StepStore.today();
        try {
            if (today.equals(o.optString("day"))) {
                o.put("water", o.optInt("water") + v);
            } else {
                // Yeni gün: uygulama bugün hiç açılmadıysa bugünkü su yalnız bu bekleyen kayıtlardır; kalori bilinmez.
                o.put("sday", o.optString("sday", o.optString("day")));
                o.put("day", today);
                o.put("water", v);
                o.remove("kcalLeft");
            }
        } catch (JSONException e) {
            return;
        }
        prefs(c).edit().putString("d", o.toString()).commit();
        refresh(c);
    }

    private static synchronized void setSteps(Context c, long steps) {
        JSONObject o = load(c);
        try {
            o.put("steps", steps);
            o.put("sday", StepStore.today());
        } catch (JSONException e) {
            return;
        }
        prefs(c).edit().putString("d", o.toString()).commit();
    }

    static void refresh(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, NeoWidget.class));
        if (ids != null && ids.length > 0) m.updateAppWidget(ids, views(c, load(c)));
    }

    private static String num(long n) {
        return String.format(Locale.US, "%,d", n).replace(',', '.');
    }

    private static String liters(int ml) {
        return String.format(Locale.US, "%.1f", ml / 1000.0).replace('.', ',');
    }

    private static RemoteViews views(Context c, JSONObject o) {
        String today = StepStore.today();
        boolean isToday = today.equals(o.optString("day"));
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.nw_widget);
        String kcal;
        if (!isToday || !o.has("kcalLeft")) kcal = "– kcal";
        else if (o.isNull("kcalLeft")) kcal = "hedef yok";
        else {
            int left = o.optInt("kcalLeft");
            kcal = left >= 0 ? num(left) + " kcal kaldı" : num(-left) + " kcal fazla";
        }
        v.setTextViewText(R.id.nw_kcal, kcal);
        int goal = o.optInt("waterGoal");
        v.setTextViewText(R.id.nw_water, (isToday ? liters(o.optInt("water")) : "–") + " / " + (goal > 0 ? liters(goal) : "–") + " L");
        boolean steps = o.has("steps") && !o.isNull("steps");
        v.setViewVisibility(R.id.nw_steps, steps ? View.VISIBLE : View.GONE);
        if (steps) v.setTextViewText(R.id.nw_steps, (today.equals(o.optString("sday", o.optString("day"))) ? num(o.optLong("steps")) : "–") + " adım");
        int glass = o.optInt("glass", 250);
        v.setTextViewText(R.id.nw_add, "+" + glass);
        int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtra(OPEN, true);
        v.setOnClickPendingIntent(R.id.nw_root, PendingIntent.getActivity(c, 7201, open, flags));
        // Bildirimdeki "+250 ml" düğmesiyle aynı ek alanlar: kaydı QuickLogPlugin.handle yazar, ekran arkaya alınır.
        Intent add = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            .putExtra("LocalNotificationUserAction", "su")
            .putExtra("LocalNotficationObject", "{\"extra\":{\"act\":\"su\",\"v\":" + glass + "}}");
        v.setOnClickPendingIntent(R.id.nw_add, PendingIntent.getActivity(c, 7202, add, flags));
        return v;
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        final Context app = c.getApplicationContext();
        JSONObject o = load(app);
        if (!o.has("steps") || o.isNull("steps")) {
            refresh(app);
            return;
        }
        final PendingResult pr = goAsync();
        StepStore.read(app, false, new StepStore.Callback() {
            public void done(Long steps, Map<String, Long> history) {
                if (steps != null) setSteps(app, steps);
                refresh(app);
                pr.finish();
            }
        });
    }
}
