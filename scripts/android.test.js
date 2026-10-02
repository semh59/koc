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
  const java=fs.readdirSync(path.join(__dirname,"../assets/android")).filter(f=>f.endsWith(".java")).map(f=>[f,rd("assets/android/"+f)]);
  ok("izin: USE_EXACT_ALARM olmadan tam alarm kuran Java kodu reddi yakalar (SecurityException ya da canScheduleExactAlarms)",java.filter(([,s])=>/setExact|setAlarmClock/.test(s)).every(([,s])=>/catch \(SecurityException|canScheduleExactAlarms/.test(s)));
  // D-Veri3: APK boyutu
  ok("boyut: ABI arm64, armeabi-v7a ve smoke emülatörü için x86_64; 32 bit x86 yok",patch.includes('ndk { abiFilters "arm64-v8a", "armeabi-v7a", "x86_64" }')&&/arch: x86_64/.test(rd(".github/workflows/apk.yml")));
  ok("boyut: gömülü barkod motoru paketlenmez ve uygulama onu çağırmaz (yalnız scan)",patch.includes('excludes += ["**/libbarhopper_v3.so"]')&&!/startScan|readBarcodesFromImage/.test(www)&&/bs\.scan\(/.test(www));
}
{ // D-Adım6: uzun aralık atılmaz, parça parça kaydedilir
  const mr=rd("assets/android/MotionReceiver.java"),tk=mr.slice(mr.indexOf("private static void tick"),mr.indexOf("double cad = MotionStore.addCp")),ms=rd("assets/android/MotionStore.java");
  ok("hareket: tick gün dönünce ya da 3 saatte aralığı kapatıp yeniden açar, atmaz",/ROLL_MS = 3L \* 3600 \* 1000/.test(mr)&&/MotionStore\.dayOf\(now\) != MotionStore\.dayOf\(MotionStore\.lastActivityAt\(c\)\)/.test(tk)&&/MotionStore\.close\(c, now, steps\) == 0 && !newDay\) return;\s*MotionStore\.open\(c, mode, now, steps\);/.test(tk)&&!/discard/.test(tk));
  ok("hareket: kapanış gün numarasıyla bölünür, parça başına 4 saat sınırı; yeniden başlatma ve 30 dk kuralı yerinde",/MotionMath\.split\(model\(c\), mode, cm\(c\), kg\(c\), ts, ss, ds, n,/.test(ms)&&/ds\[i\] = dayOf\(ts\[i\]\)/.test(ms)&&/b\.t1 - b\.t0 > MAX_BOUT_MS\) continue/.test(ms)&&/STALE_MS = 30L \* 60000/.test(mr)&&/ACTION_MY_PACKAGE_REPLACED\.equals\(a\)\) \{[\s\S]{0,200}MotionStore\.discard\(c\)/.test(mr));
}
{ // D-Veri2: otomatik yedek klasörü
  const bf=rd("assets/android/BackupFolderPlugin.java"),diag=rd("www/index.html").match(/NW-DIAG "\+\[([^\]]+)\]/)[1];
  ok("yedek klasörü: eklenti kopyalanır, kaydedilir, NW-DIAG ve smoke listesinde",/"BackupFolderPlugin"\]\)fs\.copyFileSync/.test(patch)&&/registerPlugin\(BackupFolderPlugin\.class\);\s*super\.onCreate/.test(patch)&&diag.includes('"BackupFolder"')&&/Widget BackupFolder; do/.test(rd("scripts/smoke.sh")));
  ok("yedek klasörü: SAF klasör seçimi, kalıcı izin yalnız seçilene, adres JS'e verilmez ve loglanmaz",/ACTION_OPEN_DOCUMENT_TREE/.test(bf)&&/takePersistableUriPermission\(u, FLAGS\)/.test(bf)&&/release\(u\);/.test(bf)&&!/Log\.|printStackTrace|System\.out/.test(bf)&&!/r\.put\("(uri|tree)"/.test(bf)&&!/getMessage/.test(bf));
  ok("yedek klasörü: yalnız yedek adlı dosyalar yazılır ve silinir",/NAME_RE = "neowell-yedek-\\\\d\{4\}-\\\\d\{2\}-\\\\d\{2\}\\\\\.json"/.test(bf)&&/!name\.matches\(NAME_RE\)/.test(bf)&&/n\.matches\(NAME_RE\)\) out\.put/.test(bf)&&/Uri doc = have\.get\(names\.getString\(i\)\)/.test(bf));
}
process.exit(bad?1:0);
