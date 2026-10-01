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
for(const f of ["KeyVaultPlugin","DeviceHelpPlugin","StepCounterPlugin","StepStore","StepMath","StepSnapshotReceiver"])fs.copyFileSync(`assets/android/${f}.java`,`${jdir}/${f}.java`);
fs.writeFileSync(`${jdir}/MainActivity.java`,`package com.neowell.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KeyVaultPlugin.class);
        registerPlugin(DeviceHelpPlugin.class);
        registerPlugin(StepCounterPlugin.class);
        super.onCreate(savedInstanceState);
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
console.log("Sabit imza ve data binding ayarlandı.");
