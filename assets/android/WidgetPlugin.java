package com.neowell.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Sends the app summary to the home-screen widget and tells JS when the widget was tapped. */
@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        NeoWidget.push(getContext(), call.getData().toString());
        call.resolve();
    }

    // Also called on a cold start (BridgeActivity.load); the event is retained when the JS listener does not exist yet.
    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (intent == null || !intent.getBooleanExtra(NeoWidget.OPEN, false)) return;
        intent.removeExtra(NeoWidget.OPEN);
        notifyListeners("open", new JSObject(), true);
    }
}
