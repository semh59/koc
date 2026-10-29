// Copies the native sources into the generated Capacitor project (android/) and patches its manifest, resources and Gradle files.
// Every patch is guarded by a marker, so running the script twice adds nothing twice.
const fs = require("fs");
const path = require("path");
process.chdir(path.join(__dirname, ".."));

const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = fs.readFileSync(manifestPath, "utf8");
// No USE_EXACT_ALARM: Play grants it only to alarm and calendar apps. Without the exact-alarm permission the plugin sets an inexact alarm and the UI says so.
// No ACCESS_BACKGROUND_LOCATION: the location service runs only in a walk started by hand while the app is visible, so the "while in use" permission is enough.
for (const perm of ["POST_NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "VIBRATE", "SCHEDULE_EXACT_ALARM", "USE_FULL_SCREEN_INTENT", "CAMERA", "ACTIVITY_RECOGNITION", "ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "FOREGROUND_SERVICE", "FOREGROUND_SERVICE_LOCATION", "health.READ_STEPS", "health.READ_SLEEP", "health.READ_HEART_RATE", "USE_BIOMETRIC"]) {
  if (!manifest.includes(`android.permission.${perm}`)) {
    manifest = manifest.replace("</manifest>", `    <uses-permission android:name="android.permission.${perm}" />\n</manifest>`);
  }
}

const addToApp = (marker, ...elements) => {
  if (!manifest.includes(marker)) manifest = manifest.replace("</application>", elements.map(e => `        ${e}\n`).join("") + "    </application>");
};
const filter = (...actions) => `<intent-filter>${actions.map(a => `<action android:name="${a}"/>`).join("")}</intent-filter>`;

// Step counter: the receiver records the counter at midnight and at boot. An update or a clock, date or time-zone change deletes or shifts the night alarms
// (7001, 7003), so they are set again and the widget is refreshed.
addToApp("StepSnapshotReceiver", `<receiver android:name=".StepSnapshotReceiver" android:exported="false">${filter("android.intent.action.BOOT_COMPLETED", "android.intent.action.MY_PACKAGE_REPLACED", "android.intent.action.TIME_SET", "android.intent.action.TIMEZONE_CHANGED", "android.intent.action.DATE_CHANGED")}</receiver>`);
// Automatic walk/run detection: activity-transition receiver; and a location-type foreground service for the short GPS window of a walk started by hand.
addToApp("MotionReceiver",
  `<receiver android:name=".MotionReceiver" android:exported="false">${filter("android.intent.action.BOOT_COMPLETED", "android.intent.action.MY_PACKAGE_REPLACED")}</receiver>`,
  '<service android:name=".MotionGpsService" android:exported="false" android:foregroundServiceType="location"/>');
// Medication dose: the alarm screen shows over the lock screen (the notification plugin cannot wake the screen). The receiver sets the stored doses again after
// boot, update, and clock, time-zone or exact-alarm-permission changes.
addToApp("AlarmActivity", '<activity android:name=".AlarmActivity" android:exported="false" android:showWhenLocked="true" android:turnScreenOn="true" android:launchMode="singleTask" android:taskAffinity="" android:excludeFromRecents="true" android:theme="@android:style/Theme.Material.Light.NoActionBar"/>');
addToApp("MedWakeReceiver", `<receiver android:name=".MedWakeReceiver" android:exported="false">${filter("android.intent.action.BOOT_COMPLETED", "android.intent.action.MY_PACKAGE_REPLACED", "android.intent.action.TIME_SET", "android.intent.action.TIMEZONE_CHANGED", "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED")}</receiver>`);
// Health Connect (Android 14+): without the permission-usage screen the system grants no read permission.
addToApp("HEALTH_PERMISSIONS", '<activity-alias android:name=".HealthPermissionUsage" android:targetActivity=".MainActivity" android:exported="true" android:permission="android.permission.START_VIEW_PERMISSION_USAGE"><intent-filter><action android:name="android.intent.action.VIEW_PERMISSION_USAGE"/><category android:name="android.intent.category.HEALTH_PERMISSIONS"/></intent-filter></activity-alias>');
// The barcode scanner module is downloaded when the app is installed (Google ML Kit).
addToApp("com.google.mlkit.vision.DEPENDENCIES", '<meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui"/>');
// Home-screen widget: the system sends APPWIDGET_UPDATE, so exported=true is required; the water button is not handled here but in WaterReceiver.
addToApp("NeoWidget", '<receiver android:name=".NeoWidget" android:exported="true"><intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE"/></intent-filter><meta-data android:name="android.appwidget.provider" android:resource="@xml/nw_widget_info"/></receiver>');
// Widget "+water": exported=false keeps other apps out; it works because the widget's PendingIntent is sent in the app's name.
// The notification water and medication buttons go through the exported MainActivity; there a record is written only from a notification that carries the app's secret (extra.tk), see QuickLogPlugin.handle.
addToApp("WaterReceiver", '<receiver android:name=".WaterReceiver" android:exported="false"/>');

// Health data must not go to the Google backup or a phone-to-phone transfer; the user's own encrypted backup is not affected.
if (!manifest.includes('android:allowBackup="false"')) {
  if (!manifest.includes('android:allowBackup="true"')) throw new Error("allowBackup not found: the template changed, backup could not be disabled");
  manifest = manifest.replace('android:allowBackup="true"', 'android:allowBackup="false"');
}
if (!manifest.includes('android:fullBackupContent="@xml/nw_backup_rules"') || !manifest.includes('android:dataExtractionRules="@xml/nw_data_rules"')) {
  manifest = manifest.replace(/(android:allowBackup="false")/, '$1\n        android:fullBackupContent="@xml/nw_backup_rules"\n        android:dataExtractionRules="@xml/nw_data_rules"');
}
if (manifest.includes('android:allowBackup="true"') || !manifest.includes('android:fullBackupContent="@xml/nw_backup_rules"') || !manifest.includes('android:dataExtractionRules="@xml/nw_data_rules"')) throw new Error("backup policy postcondition failed");
// Android 11+ package visibility: without declaring the TTS engine query, TextToSpeech finds no engine and guided mode stays silent.
if (!manifest.includes("android.intent.action.TTS_SERVICE")) {
  manifest = manifest.replace("</manifest>", '    <queries><intent><action android:name="android.intent.action.TTS_SERVICE"/></intent></queries>\n</manifest>');
}
// The WebView shrinks when the keyboard opens; the UI also adjusts with visualViewport.
if (!manifest.includes("windowSoftInputMode")) manifest = manifest.replace('android:name=".MainActivity"', 'android:name=".MainActivity" android:windowSoftInputMode="adjustResize"');
// Launcher long-press shortcuts (Su, Yemek, Kilo, Antrenman): the shortcut file only opens entry sheets and adds no permission.
if (!manifest.includes("android.app.shortcuts")) {
  const at = manifest.indexOf('android:name=".MainActivity"'), end = manifest.indexOf("</activity>", at);
  if (at < 0 || end < 0) throw new Error("MainActivity not found: the template changed, shortcuts could not be added");
  manifest = manifest.slice(0, end) + '<meta-data android:name="android.app.shortcuts" android:resource="@xml/nw_shortcuts"/>\n        ' + manifest.slice(end);
}
fs.writeFileSync(manifestPath, manifest);
console.log("Manifest patched.");

const res = "android/app/src/main/res";
const sourceRes = "assets/android/res";
const removeOwned = name => {
  const src=`${sourceRes}/${name}`,dst=`${res}/${name}`;
  if(fs.statSync(src).isDirectory()) for(const child of fs.readdirSync(src)) removeOwned(`${name}/${child}`);
  else if(fs.existsSync(dst)) fs.rmSync(dst);
};
for(const name of fs.readdirSync(sourceRes)) removeOwned(name);
fs.cpSync(sourceRes,res,{recursive:true});
// From Android 12 the system draws the splash screen: without a background and icon in the theme it shows a white screen and the default icon.
const stylesPath = `${res}/values/styles.xml`;
let styles = fs.readFileSync(stylesPath, "utf8");
if (!styles.includes("windowSplashScreenBackground")) {
  const anchor = '<item name="android:background">@drawable/splash</item>';
  if (!styles.includes(anchor)) throw new Error("launch theme not found: the template changed");
  styles = styles.replace(anchor, `${anchor}\n        <item name="windowSplashScreenBackground">@color/ic_launcher_background</item>\n        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>\n        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>`);
  fs.writeFileSync(stylesPath, styles);
}
console.log("Icons and splash screen installed.");

const signingSrc = "signing";
const signingDst = "android/signing";
if (fs.existsSync(signingSrc)) {
  if (fs.existsSync(signingDst)) fs.rmSync(signingDst, { recursive: true });
  fs.cpSync(signingSrc, signingDst, { recursive: true });
  console.log("Signing directory copied.");
} else {
  console.warn("Signing source directory not found, skipping.");
}

const javaDir = "android/app/src/main/java/com/neowell/app";
const javaFiles = fs.readdirSync("assets/android").filter(f => f.endsWith(".java")).map(f => f.slice(0, -5)).sort();
for (const f of javaFiles) {
  const source = `assets/android/${f}.java`, target = `${javaDir}/${f}.java`;
  fs.copyFileSync(source, target);
  if (!fs.readFileSync(source).equals(fs.readFileSync(target))) throw new Error(`native source sync failed: ${f}.java`);
}
console.log("Native sources copied.");
const testPath="android/app/src/androidTest/java/com/getcapacitor/myapp/ExampleInstrumentedTest.java";
if(fs.existsSync(testPath)){
  let test=fs.readFileSync(testPath,"utf8").replace(/assertEquals\("com\.[^"]+",\s*appContext\.getPackageName\(\)\);/, 'assertEquals("com.neowell.app", appContext.getPackageName());');
  if(!test.includes('assertEquals("com.neowell.app", appContext.getPackageName());')) throw new Error("instrumentation package assertion not found");
  fs.writeFileSync(testPath,test);
}

// The debug build is only for the CI smoke test (it needs run-as, so it is debuggable) and is signed with the publicly known key in the repository.
// The published release build is signed with the key CI decodes from its secrets; without the key the signature is missing and CI stops.
const gradlePath = "android/app/build.gradle";
let gradle = fs.readFileSync(gradlePath, "utf8");
const patchGradle = (marker, pattern, replacement) => {
  if (!gradle.includes(marker)) gradle = gradle.replace(pattern, replacement);
};
patchGradle("signingConfigs", /android \{/, `android {
    signingConfigs {
        debug {
            storeFile file("../signing/known-debug-smoke-only.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
        release {
            if (System.getenv("RELEASE_KEYSTORE_FILE")) {
                storeFile file(System.getenv("RELEASE_KEYSTORE_FILE"))
                storePassword System.getenv("RELEASE_KEYSTORE_PASSWORD")
                keyAlias System.getenv("RELEASE_KEY_ALIAS")
                keyPassword System.getenv("RELEASE_KEY_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
    lint {
        // lintVitalRelease does not know the documented device_* domains in nw_data_rules.xml (false positive).
        disable "FullBackupContent"
    }`);
patchGradle("dataBinding", /android \{/, `android {
    buildFeatures {
        dataBinding true
    }`);
// ML Kit text recognition for label and lab photos (the model ships inside the app, no internet needed).
patchGradle("mlkit:text-recognition", /dependencies \{/, m => m + '\n    implementation "com.google.mlkit:text-recognition:16.0.1"');
// Google Play services location library for the activity-recognition transitions (walk/run detection).
patchGradle("play-services-location", /dependencies \{/, m => m + '\n    implementation "com.google.android.gms:play-services-location:21.3.0"');
// APK size: there are no 32-bit x86 phones; x86_64 stays for the emulator smoke test (text recognition included).
patchGradle("abiFilters", /defaultConfig \{/, m => m + '\n        ndk { abiFilters "arm64-v8a", "armeabi-v7a", "x86_64" }');
// The barcode is read with Google's scanner screen (scan); the plugin's embedded barcode engine (startScan, readBarcodesFromImage) is never called, so it is not packaged.
patchGradle("libbarhopper_v3.so", /android \{/, `android {
    packaging {
        jniLibs {
            excludes += ["**/libbarhopper_v3.so"]
        }
    }`);
// Play rejects a second upload with the same versionCode: the CI run number grows with every build. The user-visible version changes too (Settings > About).
const run = process.env.GITHUB_RUN_NUMBER;
if (run && !gradle.includes(`versionName "1.0.${run}"`)) {
  gradle = gradle.replace(/versionCode \d+/, `versionCode ${run}`).replace(/versionName "[^"]*"/, `versionName "1.0.${run}"`);
}
fs.writeFileSync(gradlePath, gradle);
console.log("Gradle configured.");
