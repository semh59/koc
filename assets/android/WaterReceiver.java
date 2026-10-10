package com.neowell.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Widget "+water" button: writes the record without opening the screen. A broadcast is not redelivered like an activity intent. */
public class WaterReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        QuickLogPlugin.handle(c, i, true);
    }
}
