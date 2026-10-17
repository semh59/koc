package com.neowell.app;

import android.app.Activity;
import android.app.NotificationManager;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextClock;
import android.widget.TextView;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Medication alarm screen. The show-when-locked and turn-screen-on flags are declared in the manifest so the system decides about the keyguard at launch
 * (setting them later from MainActivity came too late for an existing instance). Doses are recorded without opening the app, into the queue the notification buttons use.
 */
public class AlarmActivity extends Activity {
    private static final int TEAL = 0xFF0F5E55, INK = 0xFF16252B, SOFT = 0xFFE3EFEC;
    private static final long WINDOW = 30 * 60000L, SNOOZE = 10 * 60000L;
    /** True while an alarm screen is on top: the receiver then skips the screen-lighting lock. */
    static volatile boolean visible;
    private long shownAt;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getSystemService(NotificationManager.class).cancel(MedWakeReceiver.NID);
        draw();
        visible = true;
        shownAt = System.currentTimeMillis();
        MedWakeReceiver.record(this, MedWakeReceiver.state(this, "AS"));
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        setIntent(i);
        draw();
    }

    /** Closes when the screen turns off or another app comes up, so it never lingers over the lock screen; reminders continue as notifications. */
    @Override
    protected void onStop() {
        super.onStop();
        if (isChangingConfigurations()) return;
        visible = false;
        JSONObject e = MedWakeReceiver.state(this, "AE");
        try {
            e.put("ms", System.currentTimeMillis() - shownAt);
        } catch (org.json.JSONException ignored) {
        }
        MedWakeReceiver.record(this, e);
        finish();
    }

    private List<JSONObject> due() {
        long now = System.currentTimeMillis();
        List<JSONObject> out = new ArrayList<>();
        JSONArray a = MedWakeReceiver.doses(this);
        for (int k = 0; k < a.length(); k++) {
            JSONObject d = a.optJSONObject(k);
            if (d != null && d.optLong("at") <= now + MedWakeReceiver.EARLY_MS && d.optLong("at") >= now - WINDOW) out.add(d);
        }
        return out;
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private Button button(String s, boolean primary, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(s);
        b.setAllCaps(false);
        b.setTextSize(17);
        b.setTextColor(primary ? Color.WHITE : TEAL);
        GradientDrawable g = new GradientDrawable();
        g.setCornerRadius(dp(14));
        g.setColor(primary ? TEAL : SOFT);
        b.setBackground(g);
        b.setMinHeight(dp(52));
        b.setOnClickListener(l);
        return b;
    }

    private LinearLayout.LayoutParams full(int top) {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        p.topMargin = dp(top);
        return p;
    }

    private void draw() {
        final List<JSONObject> doses = due();
        boolean test = doses.isEmpty() && MedWakeReceiver.testActive(this, System.currentTimeMillis());
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(20), dp(48), dp(20), dp(24));
        root.setBackgroundColor(0xFFF1F4F3);
        TextClock clock = new TextClock(this);
        clock.setFormat24Hour("HH:mm");
        clock.setFormat12Hour("HH:mm");
        clock.setTextSize(56);
        clock.setTextColor(INK);
        clock.setGravity(Gravity.CENTER);
        root.addView(clock, full(0));
        TextView head = text(test ? "Test alarmı" : doses.isEmpty() ? "Bekleyen ilaç yok" : "İlaç zamanı", 22, TEAL, true);
        head.setGravity(Gravity.CENTER);
        root.addView(head, full(4));
        LinearLayout rows = new LinearLayout(this);
        rows.setOrientation(LinearLayout.VERTICAL);
        for (final JSONObject d : doses) {
            LinearLayout r = new LinearLayout(this);
            r.setOrientation(LinearLayout.VERTICAL);
            r.setPadding(dp(16), dp(14), dp(16), dp(14));
            GradientDrawable g = new GradientDrawable();
            g.setCornerRadius(dp(16));
            g.setColor(Color.WHITE);
            r.setBackground(g);
            r.addView(text(d.optString("s") + "  " + d.optString("b"), 18, INK, true));
            LinearLayout bar = new LinearLayout(this);
            bar.setOrientation(LinearLayout.HORIZONTAL);
            LinearLayout.LayoutParams left = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
            left.rightMargin = dp(6);
            bar.addView(button("Aldım", true, v -> mark(doses, d, false)), left);
            LinearLayout.LayoutParams right = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1);
            right.leftMargin = dp(6);
            bar.addView(button("Atla", false, v -> mark(doses, d, true)), right);
            r.addView(bar, full(10));
            rows.addView(r, full(12));
        }
        ScrollView sv = new ScrollView(this);
        sv.addView(rows);
        root.addView(sv, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));
        // "Hepsini aldım" covers the doses of one minute (same planned time), never doses of other times or days.
        final Map<Long, List<JSONObject>> byAt = new LinkedHashMap<>();
        for (JSONObject d : doses) byAt.computeIfAbsent(d.optLong("at"), k -> new ArrayList<>()).add(d);
        for (final List<JSONObject> g : byAt.values()) {
            if (g.size() < 2) continue;
            root.addView(button(byAt.size() > 1 ? "Hepsini aldım · " + g.get(0).optString("s") : "Hepsini aldım", true, v -> {
                for (JSONObject d : g) QuickLogPlugin.recordMed(this, key(d, false), d.optInt("nid"));
                if (g.size() == doses.size()) finish();
                else draw();
            }), full(12));
        }
        if (!doses.isEmpty()) {
            root.addView(button("10 dk sonra hatırlat", false, v -> {
                MedWakePlugin.snoozeAt(this, System.currentTimeMillis() + SNOOZE);
                finish();
            }), full(10));
        }
        root.addView(button(doses.isEmpty() ? "Kapat" : "Uygulamayı aç", false, v -> {
            if (!doses.isEmpty()) startActivity(new Intent(this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP));
            finish();
        }), full(10));
        setContentView(root);
    }

    private static String key(JSONObject d, boolean skip) {
        return (skip ? "k" : "m") + d.optInt("m") + "_" + d.optString("s").replace(":", "");
    }

    private void mark(List<JSONObject> doses, JSONObject d, boolean skip) {
        QuickLogPlugin.recordMed(this, key(d, skip), d.optInt("nid"));
        if (doses.size() <= 1) finish();
        else draw();
    }
}
