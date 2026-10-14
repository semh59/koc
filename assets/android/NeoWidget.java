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
import org.json.JSONException;
import org.json.JSONObject;

/** Home-screen widget: shows the summary the app pushed (SharedPreferences "nw_widget"). */
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

    static synchronized void wipe(Context c) {
        prefs(c).edit().clear().apply();
        refresh(c);
    }

    static synchronized void push(Context c, String json) {
        prefs(c).edit().putString("d", json).apply();
        refresh(c);
    }

    /** Notification or widget "+water" button: the widget's water goes up even before the app is opened. */
    static synchronized void bump(Context c, int v) {
        JSONObject o = load(c);
        String today = StepStore.today();
        try {
            if (today.equals(o.optString("day"))) {
                o.put("water", o.optInt("water") + v);
            } else {
                // New day: if the app was not opened today, today's water is only these pending records, and the calories are unknown.
                o.put("sday", o.optString("sday", o.optString("day")));
                o.put("day", today);
                o.put("water", v);
                o.remove("kcalLeft");
            }
        } catch (JSONException e) {
            return;
        }
        prefs(c).edit().putString("d", o.toString()).apply();
        refresh(c);
    }

    private static synchronized void setSteps(Context c, long steps) {
        JSONObject o = load(c);
        try {
            // The value the app pushed today also includes watch steps and manual entries; a phone sensor reading alone must not lower it.
            String today = StepStore.today();
            long pushed = today.equals(o.optString("sday", o.optString("day"))) && !o.isNull("steps") ? o.optLong("steps") : 0;
            o.put("steps", Math.max(steps, pushed));
            o.put("sday", today);
        } catch (JSONException e) {
            return;
        }
        prefs(c).edit().putString("d", o.toString()).apply();
    }

    static void refresh(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, NeoWidget.class));
        if (ids.length > 0) m.updateAppWidget(ids, views(c, load(c)));
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
            // The narrow widget cuts off at the end: the meaningful word and number come first, the unit last.
            kcal = (left >= 0 ? "Kalan " + num(left) : "Fazla " + num(-left)) + " kcal";
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
        // The system can redeliver an activity intent (double water), so this is a broadcast: no screen opens and QuickLogPlugin.handle writes the record.
        Intent add = new Intent(c, WaterReceiver.class)
            .putExtra(QuickLogPlugin.ACTION_KEY, "water")
            .putExtra(QuickLogPlugin.OBJ_KEY, "{\"extra\":{\"v\":" + glass + "}}");
        v.setOnClickPendingIntent(R.id.nw_add, PendingIntent.getBroadcast(c, 7202, add, flags));
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
        StepStore.read(app, false, (steps, history) -> {
            try {
                if (steps != null) setSteps(app, steps);
                refresh(app);
            } finally {
                pr.finish();
            }
        });
    }
}
