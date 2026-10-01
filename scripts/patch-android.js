// Bildirim izinlerini Android manifest'ine ekler ve NeoWell simgelerini yerleştirir (tekrar çalıştırılırsa bir şey bozmaz).
const fs = require("fs");
const p = "android/app/src/main/AndroidManifest.xml";
let x = fs.readFileSync(p, "utf8");
for (const perm of ["POST_NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "VIBRATE", "SCHEDULE_EXACT_ALARM", "USE_EXACT_ALARM"]) {
  if (!x.includes(`android.permission.${perm}`)) {
    x = x.replace("</manifest>", `    <uses-permission android:name="android.permission.${perm}" />\n</manifest>`);
  }
}
fs.writeFileSync(p, x);
console.log("Manifest güncellendi.");
const res="android/app/src/main/res";
fs.cpSync("assets/android/res",res,{recursive:true});
console.log("Simgeler yerleştirildi.");

// API anahtarı kasası: Keystore eklentisini kopyala, MainActivity'ye kaydet. Keystore AES-GCM için API 23 gerekir.
const jdir="android/app/src/main/java/com/neowell/app";
fs.copyFileSync("assets/android/KeyVaultPlugin.java",`${jdir}/KeyVaultPlugin.java`);
fs.writeFileSync(`${jdir}/MainActivity.java`,`package com.neowell.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KeyVaultPlugin.class);
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
console.log("Sabit imza ayarlandı.");
