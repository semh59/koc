package com.getcapacitor.myapp;

import static org.junit.Assert.*;

import android.content.Context;
import android.content.Intent;
import android.app.Activity;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class ExampleInstrumentedTest {

    @Test
    public void useAppContext() throws Exception {
        // Context of the app under test.
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();

        assertEquals("com.neowell.app", appContext.getPackageName());
        Intent launch = appContext.getPackageManager().getLaunchIntentForPackage(appContext.getPackageName());
        assertNotNull("launcher activity", launch);
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        Activity activity = InstrumentationRegistry.getInstrumentation().startActivitySync(launch);
        assertNotNull(activity);
        InstrumentationRegistry.getInstrumentation().waitForIdleSync();
        assertTrue("activity remains alive after launch", activity.getWindow() != null);
        InstrumentationRegistry.getInstrumentation().runOnMainSync(activity::finish);
    }
}
