package com.neowell.app;

import android.content.Intent;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Uygulama özetini ana ekran widget'ına gönderir; widget'a dokunulduğunu JS'e bildirir. */
@CapacitorPlugin(name = "Widget")
public class WidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        NeoWidget.push(getContext(), call.getData().toString());
        call.resolve();
    }

    // Soğuk açılışta da çağrılır (BridgeActivity.load), JS dinleyicisi henüz yoksa olay saklanır.
    @Override
    protected void handleOnNewIntent(Intent intent) {
        if (intent == null || !intent.getBooleanExtra(NeoWidget.OPEN, false)) return;
        intent.removeExtra(NeoWidget.OPEN);
        notifyListeners("open", new JSObject(), true);
    }
}
