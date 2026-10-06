package com.neowell.app;

import com.getcapacitor.JSArray;
import com.getcapacitor.PluginCall;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;

/** JS, ilaç doz zamanlarını (ms) verir; dozda ekranı uyandıran alarmlar kurulur. */
@CapacitorPlugin(name = "MedWake")
public class MedWakePlugin extends Plugin {
    @PluginMethod
    public void set(PluginCall call) {
        JSArray a = call.getArray("times");
        long[] t = new long[a == null ? 0 : a.length()];
        try {
            for (int i = 0; i < t.length; i++) t[i] = a.getLong(i);
        } catch (JSONException e) {
            call.reject("times");
            return;
        }
        MedWakeReceiver.arm(getContext(), t);
        call.resolve();
    }
}
