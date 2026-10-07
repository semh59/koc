// Bildirim izinlerini Android manifest'ine ekler ve NeoWell simgelerini yerleştirir (tekrar çalıştırılırsa bir şey bozmaz).
const fs = require("fs");
const p = "android/app/src/main/AndroidManifest.xml";
let x = fs.readFileSync(p, "utf8");
// USE_EXACT_ALARM yok: Play onu yalnız alarm/takvim uygulamalarına veriyor. İzin kapalıysa eklenti alarmı yaklaşık saate kurar, arayüz söyler.
// ACCESS_BACKGROUND_LOCATION yok: konum servisi yalnız uygulama görünürken elle başlatılan yürüyüşte açılır, "kullanırken" izni yeter.
for (const perm of ["POST_NOTIFICATIONS", "RECEIVE_BOOT_COMPLETED", "VIBRATE", "SCHEDULE_EXACT_ALARM", "CAMERA", "ACTIVITY_RECOGNITION", "ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "FOREGROUND_SERVICE", "FOREGROUND_SERVICE_LOCATION"]) {
  if (!x.includes(`android.permission.${perm}`)) {
    x = x.replace("</manifest>", `    <uses-permission android:name="android.permission.${perm}" />\n</manifest>`);
  }
}
// Adım sayacı: gece yarısı ve açılışta sayacı kaydeden alıcı.
// Güncelleme ve saat/tarih/saat dilimi değişiminde gece alarmları (7001, 7003) silinir ya da kayar: yeniden kurulur, widget tazelenir.
// Tam alarm izni verilince ya da alınınca alarm türü (tam/yaklaşık) yeniden seçilir.
if (!x.includes("StepSnapshotReceiver")) {
  const acts = ["android.intent.action.BOOT_COMPLETED", "android.intent.action.MY_PACKAGE_REPLACED", "android.intent.action.TIME_SET", "android.intent.action.TIMEZONE_CHANGED", "android.intent.action.DATE_CHANGED", "android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED"];
  x = x.replace("</application>", `    <receiver android:name=".StepSnapshotReceiver" android:exported="false"><intent-filter>${acts.map(a => `<action android:name="${a}"/>`).join("")}</intent-filter></receiver>\n    </application>`);
}
// Otomatik yürüyüş/koşu algılama için etkinlik geçişi alıcısı; elle yürüyüşteki kısa GPS penceresi için konum türünde ön plan servisi.
if (!x.includes("MotionReceiver")) {
  x = x.replace("</application>", '    <receiver android:name=".MotionReceiver" android:exported="false"><intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/><action android:name="android.intent.action.MY_PACKAGE_REPLACED"/></intent-filter></receiver>\n    <service android:name=".MotionGpsService" android:exported="false" android:foregroundServiceType="location"/>\n    </application>');
}
// İlaç dozunda kilitli ekranı uyandıran alarm alıcısı (bildirim eklentisi ekranı açmaz); açılışta ve güncellemede kayıtlı dozları yeniden kurar.
if (!x.includes("MedWakeReceiver")) {
  x = x.replace("</application>", '    <receiver android:name=".MedWakeReceiver" android:exported="false"><intent-filter><action android:name="android.intent.action.BOOT_COMPLETED"/><action android:name="android.intent.action.MY_PACKAGE_REPLACED"/><action android:name="android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED"/></intent-filter></receiver>\n    </application>');
}
// Barkod tarayıcı modülü uygulama kurulurken indirilsin (Google ML Kit).
if (!x.includes("com.google.mlkit.vision.DEPENDENCIES")) {
  x = x.replace("</application>", '    <meta-data android:name="com.google.mlkit.vision.DEPENDENCIES" android:value="barcode_ui"/>\n    </application>');
}
// Ana ekran widget'ı: APPWIDGET_UPDATE'i sistem gönderdiği için exported=true zorunlu; su ekleme bu alıcıda değil WaterReceiver'da.
if (!x.includes("NeoWidget")) {
  x = x.replace("</application>", '    <receiver android:name=".NeoWidget" android:exported="true"><intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE"/></intent-filter><meta-data android:name="android.appwidget.provider" android:resource="@xml/nw_widget_info"/></receiver>\n    </application>');
}
// Widget "+su": exported=false, bu alıcıya başka uygulama ulaşamaz; widget'ın PendingIntent'i uygulama adına gönderdiği için çalışır.
// Bildirim su/ilaç düğmeleri exported MainActivity'den geçer; orada kayıt yalnız uygulamanın gizli anahtarını (extra.tk) taşıyan bildirimden yazılır (QuickLogPlugin.handle).
if (!x.includes("WaterReceiver")) {
  x = x.replace("</application>", `    <receiver android:name=".WaterReceiver" android:exported="false"/>
    </application>`);
}
// Sağlık verisi Google yedeğine ve telefondan telefona aktarıma gitmesin; kullanıcının kendi şifreli yedeği bundan etkilenmez.
if (!x.includes('android:allowBackup="false"')) {
  if (!x.includes('android:allowBackup="true"')) throw new Error("allowBackup bulunamadı: şablon değişmiş, yedek kapatılamadı");
  x = x.replace('android:allowBackup="true"', 'android:allowBackup="false"\n        android:fullBackupContent="@xml/nw_backup_rules"\n        android:dataExtractionRules="@xml/nw_data_rules"');
}
// Android 11+ paket görünürlüğü: TTS motoru sorgusu bildirilmezse TextToSpeech motor bulamaz, rehberli mod sessiz kalır.
if (!x.includes("android.intent.action.TTS_SERVICE")) {
  x = x.replace("</manifest>", '    <queries><intent><action android:name="android.intent.action.TTS_SERVICE"/></intent></queries>\n</manifest>');
}
// Klavye açılınca WebView küçülsün; arayüz de visualViewport ile ayrıca ayarlanır.
if (!x.includes("windowSoftInputMode")) x = x.replace('android:name=".MainActivity"', 'android:name=".MainActivity" android:windowSoftInputMode="adjustResize"');
fs.writeFileSync(p, x);
console.log("Manifest güncellendi.");
const res="android/app/src/main/res";
fs.cpSync("assets/android/res",res,{recursive:true});
// Android 12+ açılış ekranını sistem çizer: arka plan ve simge temada verilmezse beyaz zemin ve varsayılan simge çıkar.
const sty=`${res}/values/styles.xml`;let sx=fs.readFileSync(sty,"utf8");
if(!sx.includes("windowSplashScreenBackground")){
  const anchor='<item name="android:background">@drawable/splash</item>';
  if(!sx.includes(anchor))throw new Error("açılış teması bulunamadı: şablon değişmiş");
  sx=sx.replace(anchor,`${anchor}\n        <item name="windowSplashScreenBackground">@color/ic_launcher_background</item>\n        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>\n        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>`);
  fs.writeFileSync(sty,sx);
}
console.log("Simgeler ve açılış ekranı yerleştirildi.");

// API anahtarı kasası: Keystore eklentisini kopyala, MainActivity'ye kaydet.
// KeyVault sözleşmesi: anahtar geçersizleştiyse ya da yoksa decrypt (ve reset olmadan encrypt) reject koduyla "KEY_INVALIDATED" döner; eski veri çözülemez.
// Yeni anahtar için encrypt({text, reset:true}) ya da resetKey() çağrılır.
const jdir="android/app/src/main/java/com/neowell/app";
for(const f of ["Alarms","MedWakeReceiver","MedWakePlugin","KeyVaultPlugin","DeviceHelpPlugin","StepCounterPlugin","StepStore","StepMath","StepSnapshotReceiver","OcrPlugin","QuickMath","QuickLogPlugin","MotionMath","MotionStore","MotionGpsService","MotionReceiver","MotionPlugin","NeoWidget","WidgetPlugin","WaterReceiver","SpeechPlugin","BackupFolderPlugin"])fs.copyFileSync(`assets/android/${f}.java`,`${jdir}/${f}.java`);
fs.writeFileSync(`${jdir}/MainActivity.java`,`package com.neowell.app;

import android.content.Intent;
import android.util.Log;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.PluginMethod;
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
        // Bildirim su/ilaç düğmesi: kayıt arka planda yazılır, ekran açık kalmaz. savedInstanceState != null ise süreç öldükten sonra
        // yeniden oluşturmadır ve intent eskisidir; BridgeActivity.load() super.onCreate içinde onu onNewIntent'e verdiği için ek alan burada silinir.
        boolean quick = false;
        if (savedInstanceState == null) quick = QuickLogPlugin.handle(this, getIntent(), false);
        else getIntent().removeExtra(QuickLogPlugin.ACTION_KEY);
        registerPlugin(MedWakePlugin.class);
        registerPlugin(KeyVaultPlugin.class);
        registerPlugin(DeviceHelpPlugin.class);
        registerPlugin(StepCounterPlugin.class);
        registerPlugin(OcrPlugin.class);
        registerPlugin(QuickLogPlugin.class);
        registerPlugin(MotionPlugin.class);
        registerPlugin(WidgetPlugin.class);
        registerPlugin(SpeechPlugin.class);
        registerPlugin(BackupFolderPlugin.class);
        super.onCreate(savedInstanceState);
        diag(getIntent());
        medChannel();
        if (quick) moveTaskToBack(true);
    }

    // Yalnız CI smoke testi tetikler (am start --ez nw_diag true). Release derlemede konsol logcata yazmaz; eklentilerin yüklendiği ve
    // @PluginMethod yöntemlerinin küçültmeden (R8) sağ çıktığı buradan doğrulanır. Yalnız eklenti adı ve yöntem sayısı loglanır.
    private void diag(Intent in) {
        if (in == null || !in.getBooleanExtra("nw_diag", false)) return;
        StringBuilder sb = new StringBuilder();
        for (String n : new String[] {"LocalNotifications", "Share", "Filesystem", "App", "BarcodeScanner", "MedWake", "KeyVault", "DeviceHelp", "StepCounter", "Ocr", "QuickLog", "Motion", "Widget", "Speech", "BackupFolder"}) {
            PluginHandle h = getBridge() == null ? null : getBridge().getPlugin(n);
            int k = 0;
            if (h != null && h.getInstance() != null)
                for (java.lang.reflect.Method m : h.getInstance().getClass().getDeclaredMethods()) if (m.isAnnotationPresent(PluginMethod.class)) k++;
            sb.append(n).append('=').append(k).append(' ');
        }
        Log.i("NW-DIAG", sb.toString().trim());
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
        if (QuickLogPlugin.handle(this, intent, false)) {
            moveTaskToBack(true);
            return;
        }
        super.onNewIntent(intent);
    }
}
`);
console.log("Anahtar kasası eklendi.");

// Debug derleme yalnız CI smoke testi içindir (run-as debuggable ister); depodaki herkesçe bilinen anahtarla imzalanır.
// Yayınlanan release derleme, CI'ın gizli değişkenlerden çözdüğü anahtarla imzalanır; anahtar yoksa imza eksik kalır ve CI durur.
const bg="android/app/build.gradle";
let g=fs.readFileSync(bg,"utf8");
if(!g.includes("signingConfigs")){
  g=g.replace(/android \{/,`android {
    signingConfigs {
        debug {
            storeFile file("../../signing/bilinen-debug-yalniz-smoke.keystore")
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
        // lintVitalRelease, nw_data_rules.xml'deki belgelenmiş device_* alanlarını tanımıyor (yanlış pozitif).
        disable "FullBackupContent"
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
// Etkinlik tanıma geçişleri (yürüme/koşma algısı) için Google Play hizmetleri konum kitaplığı.
g=fs.readFileSync(bg,"utf8");
if(!g.includes("play-services-location")){
  g=g.replace(/dependencies \{/,m=>m+'\n    implementation "com.google.android.gms:play-services-location:21.3.0"');
  fs.writeFileSync(bg,g);
}
// APK boyutu: 32 bit x86 telefon yok; x86_64 emülatör smoke testi (yazı tanıma dahil) için kalır.
g=fs.readFileSync(bg,"utf8");
if(!g.includes("abiFilters")){
  g=g.replace(/defaultConfig \{/,m=>m+'\n        ndk { abiFilters "arm64-v8a", "armeabi-v7a", "x86_64" }');
  fs.writeFileSync(bg,g);
}
// Play aynı versionCode'la ikinci yüklemeyi reddeder: CI çalışma numarası her derlemede artar.
g=fs.readFileSync(bg,"utf8");
if(process.env.GITHUB_RUN_NUMBER&&!g.includes('versionName "1.0.'+process.env.GITHUB_RUN_NUMBER+'"')){
  // Kullanıcıya görünen sürüm de her derlemede değişsin (Ayarlar > Hakkında).
  g=g.replace(/versionCode \d+/,"versionCode "+process.env.GITHUB_RUN_NUMBER).replace(/versionName "[^"]*"/,'versionName "1.0.'+process.env.GITHUB_RUN_NUMBER+'"');
  fs.writeFileSync(bg,g);
}
// Barkod Google'ın tarayıcı ekranıyla (scan) okunur; eklentinin gömülü barkod motoru (startScan, readBarcodesFromImage) çağrılmadığı için paketlenmez.
if(!g.includes("libbarhopper_v3.so")){
  g=g.replace(/android \{/,`android {
    packaging {
        jniLibs {
            excludes += ["**/libbarhopper_v3.so"]
        }
    }`);
  fs.writeFileSync(bg,g);
}
console.log("Sabit imza, data binding ve yazı tanıma ayarlandı.");
