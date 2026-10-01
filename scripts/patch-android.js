// Bildirim izinlerini Android manifest'ine ekler ve NeoWell simgelerini yerleştirir (tekrar çalıştırılırsa bir şey bozmaz).
const fs = require("fs");
const p = "android/app/src/main/AndroidManifest.xml";
let x = fs.readFileSync(p, "utf8");
for (const perm of ["POST_NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "VIBRATE", "SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM", "CAMERA", "FLASHLIGHT", "ACTIVITY_RECOGNITION"]) {
  if (!x.includes(`android.permission.${perm}`)) {
    x = x.replace("</manifest>", `    <uses-permission android:name="android.permission.${perm}" />\n</manifest>`);
  }
}
// Adım sayacı: gece yarısı ve açılışta sayacı kaydeden alıcı.
if (!x.includes("StepSnapshotReceiver")) {
  x = x.replace("</application>", '    <receiver android:name=".StepSnapshotReceiver" android:exported="false"><intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/></intent-filter></receiver>\n    </application>');
}
// Barkod tarayıcı modülü uygulama kurulurken indirilsin (Google ML Kit).
if (!x.includes("com.google.mlkit.vision.DEPENDENCIES")) {
  x = x.replace("</application>", '    <meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui"/>\n    </application>');
}
fs.writeFileSync(p, x);
console.log("Manifest güncellendi.");
const res="android/app/src/main/res";
fs.cpSync("assets/android/res",res,{recursive:true});
console.log("Simgeler yerleştirildi.");

// API anahtarı kasası: Keystore eklentisini kopyala, MainActivity'ye kaydet. Keystore AES-GCM için API 23 gerekir.
const jdir="android/app/src/main/java/com/neowell/app";
for(const f of ["KeyVaultPlugin","DeviceHelpPlugin","StepCounterPlugin","StepStore","StepMath","StepSnapshotReceiver","OcrPlugin","QuickMath","QuickLogPlugin"])fs.copyFileSync(`assets/android/${f}.java`,`${jdir}/${f}.java`);
fs.writeFileSync(`${jdir}/MainActivity.java`,`package com.neowell.app;

import android.content.Intent;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Bildirimdeki "+250 ml" düğmesi: kayıt arka planda yazılır, ekran açık kalmaz. savedInstanceState != null ise yeniden oluşturmadır, tekrar sayılmaz.
        boolean quick = savedInstanceState == null && QuickLogPlugin.handle(this, getIntent());
        registerPlugin(KeyVaultPlugin.class);
        registerPlugin(DeviceHelpPlugin.class);
        registerPlugin(StepCounterPlugin.class);
        registerPlugin(OcrPlugin.class);
        registerPlugin(QuickLogPlugin.class);
        super.onCreate(savedInstanceState);
        medChannel();
        if (quick) moveTaskToBack(true);
    }

    // İlaç hatırlatıcısı alarm gibi çalar: alarm sesi kanalı, yüksek önem, titreşim. Sessiz modda da çalması kullanıcının telefon ayarına bağlıdır.
    private void medChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel("nw_med") != null) return;
        NotificationChannel ch = new NotificationChannel("nw_med", "İlaç alarmı", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("İlaç saatinde alarm gibi çalan hatırlatıcı");
        ch.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[] {0, 600, 300, 600, 300, 600});
        ch.setLockscreenVisibility(1);
        nm.createNotificationChannel(ch);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        if (QuickLogPlugin.handle(this, intent)) {
            moveTaskToBack(true);
            return;
        }
        super.onNewIntent(intent);
    }
}
`);
const vg="android/variables.gradle";
fs.writeFileSync(vg,fs.readFileSync(vg,"utf8").replace("minSdkVersion = 22","minSdkVersion = 23"));
console.log("Anahtar kasası eklendi.");

// Sabit imza: depodaki anahtarı doğrudan debug imzası yap, yoksa her derleme yeni anahtar üretir ve güncellemeler kurulamaz.
const bg="android/app/build.gradle";
let g=fs.readFileSync(bg,"utf8");
if(!g.includes("koc-debug.keystore")){
  g=g.replace(/android \{/,`android {
    signingConfigs {
        debug {
            storeFile file("../../signing/koc-debug.keystore")
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
    }`);
  fs.writeFileSync(bg,g);
}
if(!g.includes("dataBinding")){
  g=fs.readFileSync(bg,"utf8").replace(/android \{/,`android {
    buildFeatures {
        dataBinding true
    }`);
  fs.writeFileSync(bg,g);
}
// Etiket ve tahlil fotoğrafı için ML Kit yazı tanıma (model uygulamanın içinde, internet gerekmez).
g=fs.readFileSync(bg,"utf8");
if(!g.includes("mlkit:text-recognition")){
  g=g.replace(/dependencies \{/,m=>m+'\n    implementation "com.google.mlkit:text-recognition:16.0.1"');
  fs.writeFileSync(bg,g);
}
console.log("Sabit imza, data binding ve yazı tanıma ayarlandı.");
