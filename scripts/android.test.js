// Android kaynaklarının derlenmeden doğrulanabilen kuralları (Java'yı CI derler).
const fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c)=>{console.log((c?"PASS ":"FAIL ")+n);if(!c)bad++};
const rd=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
const patch=rd("scripts/patch-android.js"),onCreate=patch.slice(patch.indexOf("public void onCreate"),patch.indexOf("super.onCreate(savedInstanceState)"));
ok("su intent'i: yeniden oluşturmada ek alan super.onCreate (load → onNewIntent) öncesi silinir",/else getIntent\(\)\.removeExtra\(QuickLogPlugin\.ACTION_KEY\)/.test(onCreate));
const ql=rd("assets/android/QuickLogPlugin.java"),h=ql.slice(ql.indexOf("static synchronized boolean handle"));
ok("su intent'i: son uygulamalardan açılış (LAUNCHED_FROM_HISTORY) yeniden yazmaz",h.indexOf("FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY")>0&&h.indexOf("FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY")<h.indexOf("QuickMath.amount"));
ok("su intent'i: işlenen intent'in eylem alanı silinir",/in\.removeExtra\(ACTION_KEY\);\s*return true;/.test(h));
const lay=rd("assets/android/res/layout/nw_widget.xml"),kc=lay.slice(lay.indexOf("nw_kcal"),lay.indexOf("/>",lay.indexOf("nw_kcal")));
ok("widget: kalori satırı sondan kesilir, 'Kalan/Fazla' ve sayı başta",/ellipsize="end"/.test(kc)&&/"Kalan " \+ num\(left\) : "Fazla " \+ num\(-left\)\) \+ " kcal"/.test(rd("assets/android/NeoWidget.java")));
ok("adım: snapAt yalnız gün gerçekten kapanınca yazılır",/boolean closed = closeFirst && StepMath\.closeDay\(/.test(rd("assets/android/StepStore.java"))&&/if \(closed\) e\.putLong\("snapAt"/.test(rd("assets/android/StepStore.java")));
const dh=rd("assets/android/DeviceHelpPlugin.java"),ka=dh.slice(dh.indexOf("public void keepAwake"));
ok("ekran açık: keepAwake eklenti metodu, UI iş parçacığında bayrak ekler/kaldırır ve çağrıyı çözer",/@PluginMethod\s+public void keepAwake\(PluginCall call\)/.test(dh)&&/import android\.view\.WindowManager;/.test(dh)&&/runOnUiThread\(/.test(ka)&&/addFlags\(WindowManager\.LayoutParams\.FLAG_KEEP_SCREEN_ON\)/.test(ka)&&/clearFlags\(WindowManager\.LayoutParams\.FLAG_KEEP_SCREEN_ON\)/.test(ka)&&/call\.resolve\(\)/.test(ka)&&rd("scripts/patch-android.js").includes('"DeviceHelpPlugin"'));
{ // B5: otomatik yedek ve cihaz aktarımı kapalı
  const dr=rd("assets/android/res/xml/nw_data_rules.xml"),fb=rd("assets/android/res/xml/nw_backup_rules.xml"),doms=["root","file","database","sharedpref","external"];
  const sec=t=>dr.slice(dr.indexOf(`<${t}>`),dr.indexOf(`</${t}>`)),all=(s,d)=>d.every(x=>s.includes(`<exclude domain="${x}" path="."/>`))&&!/<include/.test(s);
  ok("yedek: manifest allowBackup=false ve iki kural dosyası, şablon değişirse yama durur",patch.includes(`'android:allowBackup="false"\\n        android:fullBackupContent="@xml/nw_backup_rules"\\n        android:dataExtractionRules="@xml/nw_data_rules"'`)&&/throw new Error\("allowBackup bulunamadı/.test(patch));
  ok("yedek: Android 12+ bulut yedeği ve cihaz aktarımında tüm alanlar dışarıda",/^<\?xml[^>]*\?>\s*(<!--[\s\S]*?-->\s*)?<data-extraction-rules>/.test(dr)&&["cloud-backup","device-transfer"].every(t=>all(sec(t),[...doms,...doms.slice(0,4).map(d=>"device_"+d)])));
  ok("yedek: Android 11 ve altı tam yedek kuralı tüm alanları dışlar",/<full-backup-content>/.test(fb)&&all(fb,doms));
}
{ // B11: Play izin uyumu
  const perms=patch.slice(patch.indexOf("for (const perm of ["),patch.indexOf("]) {"));
  ok("izin: USE_EXACT_ALARM ve kullanılmayan FLASHLIGHT istenmez, SCHEDULE_EXACT_ALARM kalır",!/USE_EXACT_ALARM"|FLASHLIGHT/.test(perms)&&perms.includes('"SCHEDULE_EXACT_ALARM"'));
  const www=fs.readdirSync(path.join(__dirname,"../www")).filter(f=>/\.(js|html)$/.test(f)).map(f=>rd("www/"+f)).join("\n");
  ok("izin: fener (torch) kullanılmıyor, FLASHLIGHT gereksiz",!/enableTorch|toggleTorch/.test(www));
  // D-Veri3: APK boyutu
  ok("boyut: ABI arm64, armeabi-v7a ve smoke emülatörü için x86_64; 32 bit x86 yok",patch.includes('ndk { abiFilters "arm64-v8a", "armeabi-v7a", "x86_64" }')&&/arch: x86_64/.test(rd(".github/workflows/apk.yml")));
  ok("boyut: gömülü barkod motoru paketlenmez ve uygulama onu çağırmaz (yalnız scan)",patch.includes('excludes += ["**/libbarhopper_v3.so"]')&&!/startScan|readBarcodesFromImage/.test(www)&&/bs\.scan\(/.test(www));
}
process.exit(bad?1:0);
