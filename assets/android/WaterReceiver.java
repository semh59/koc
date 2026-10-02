package com.neowell.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Widget "+su" düğmesi: ekran açılmadan kayıt yazar. Yayın, activity intent'i gibi yeniden teslim edilmez. */
public class WaterReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        QuickLogPlugin.handle(c, i);
    }
}
