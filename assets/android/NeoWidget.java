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
    /** Which sheet the app opens: "food", "weight", "exercise" or "water". Opens a sheet only; nothing is recorded on this path. */
    static final String GO = "nw_go";

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

    /** The app day: the calendar day shifted back by the day-start hour ("ds") the app pushed. Water and calories follow it; the step sensor stays on the calendar day. */
    private static String appDay(JSONObject o) {
        return StepStore.day(System.currentTimeMillis() - o.optInt("ds") * 3600000L);
    }

    /** The pushed steps still belong to today: by the sensor's calendar day once the widget has stamped one, otherwise by the app's own day. */
    private static boolean stepsFresh(JSONObject o) {
        return o.has("sday") ? StepStore.today().equals(o.optString("sday")) : appDay(o).equals(o.optString("day"));
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
        String today = appDay(o);
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
            long pushed = stepsFresh(o) && !o.isNull("steps") ? o.optLong("steps") : 0;
            o.put("steps", Math.max(steps, pushed));
            o.put("sday", StepStore.today());
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

    private static Intent go(Context c, String what) {
        return new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtra(OPEN, true).putExtra(GO, what);
    }

    private static RemoteViews views(Context c, JSONObject o) {
        boolean isToday = appDay(o).equals(o.optString("day"));
        // The app sets "hide" while the app lock is on or the user chose to hide numbers: the widget then shows no figures.
        boolean hide = o.optBoolean("hide");
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.nw_widget);
        String kcal;
        if (!isToday || !o.has("kcalLeft")) kcal = "– kcal";
        else if (o.isNull("kcalLeft")) kcal = "hedef yok";
        else {
            int left = o.optInt("kcalLeft");
            // The narrow widget cuts off at the end: the meaningful word and number come first, the unit last.
            kcal = (left >= 0 ? "Kalan " + num(left) : "Fazla " + num(-left)) + " kcal";
        }
        v.setTextViewText(R.id.nw_kcal, hide ? "NeoWell" : kcal);
        int goal = o.optInt("waterGoal");
        v.setTextViewText(R.id.nw_water, hide ? "" : (isToday ? liters(o.optInt("water")) : "–") + " / " + (goal > 0 ? liters(goal) : "–") + " L");
        boolean steps = !hide && o.has("steps") && !o.isNull("steps");
        v.setViewVisibility(R.id.nw_steps, steps ? View.VISIBLE : View.GONE);
        if (steps) v.setTextViewText(R.id.nw_steps, (stepsFresh(o) ? num(o.optLong("steps")) : "–") + " adım");
        // Ramadan: the app pushes today's iftar time while the daytime fast runs; the remaining time is worked out here, at every refresh.
        long left = !hide && isToday && o.has("iftarAt") && !o.isNull("iftarAt") ? o.optLong("iftarAt") - System.currentTimeMillis() : 0;
        v.setViewVisibility(R.id.nw_iftar, left > 0 ? View.VISIBLE : View.GONE);
        if (left > 0) {
            long m = Math.max(1, left / 60000);
            v.setTextViewText(R.id.nw_iftar, "İftara " + (m >= 60 ? (m / 60) + " sa" + (m % 60 > 0 ? " " + (m % 60) + " dk" : "") : m + " dk"));
        }
        int glass = o.optInt("glass", 250);
        v.setTextViewText(R.id.nw_add, "+" + glass);
        int flags = PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT;
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK).putExtra(OPEN, true);
        v.setOnClickPendingIntent(R.id.nw_root, PendingIntent.getActivity(c, 7201, open, flags));
        v.setOnClickPendingIntent(R.id.nw_food, PendingIntent.getActivity(c, 7203, go(c, "food"), flags));
        v.setOnClickPendingIntent(R.id.nw_weight, PendingIntent.getActivity(c, 7204, go(c, "weight"), flags));
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
