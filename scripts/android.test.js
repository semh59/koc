// Android kaynaklarının derlenmeden doğrulanabilen kuralları (Java'yı CI derler).
const fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c)=>{console.log((c?"PASS ":"FAIL ")+n);if(!c)bad++};
const rd=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
const patch=rd("scripts/patch-android.js"),onCreate=patch.slice(patch.indexOf("public void onCreate"),patch.indexOf("super.onCreate(savedInstanceState)"));
ok("su intent'i: yeniden oluşturmada ek alan super.onCreate (load → onNewIntent) öncesi silinir",/else getIntent\(\)\.removeExtra\(QuickLogPlugin\.ACTION_KEY\)/.test(onCreate));
const ql=rd("assets/android/QuickLogPlugin.java"),h=ql.slice(ql.indexOf("static synchronized boolean handle"));
ok("su intent'i: son uygulamalardan açılış (LAUNCHED_FROM_HISTORY) yeniden yazmaz",h.indexOf("FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY")>0&&h.indexOf("FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY")<h.indexOf("QuickMath.amount"));
ok("su intent'i: işlenen intent'in eylem alanı silinir",/in\.removeExtra\(ACTION_KEY\);\s*return true;/.test(h));
{ // sahte kayıt: exported MainActivity yolu gizli anahtarı ister, widget yolu (exported=false alıcı) istemez
  const chk=h.indexOf("if (key == null || (!widget && !QuickMath.signed(obj, secret(c)))) return false;"),nw=rd("assets/android/NeoWidget.java"),sm=rd("scripts/smoke.sh");
  ok("anahtar: denetim her yan etkiden (seen, q, widget, bildirim iptali) önce, reddedilen kayıt loglanmaz",chk>0&&["QuickMath.seen","putString(\"q\"","NeoWidget.bump","nm.cancel"].every(s=>h.indexOf(s)>chk)&&!/Log\./.test(ql));
  ok("anahtar: MainActivity iki yolda da widget=false, WaterReceiver true ve exported=false",(patch.match(/QuickLogPlugin\.handle\(this, (getIntent\(\)|intent), false\)/g)||[]).length===2&&/QuickLogPlugin\.handle\(c, i, true\);/.test(rd("assets/android/WaterReceiver.java"))&&patch.includes('<receiver android:name=".WaterReceiver" android:exported="false"/>'));
  ok("anahtar: SecureRandom 128 bit, commit ile saklanır, getToken JS'e verir",/new byte\[16\];\s*new SecureRandom\(\)\.nextBytes\(b\);/.test(ql)&&/putString\("tk", s\)\.commit\(\)/.test(ql)&&/public void getToken\(PluginCall call\)/.test(ql));
  ok("widget '+su' activity yolunu kullanmaz: yayınla WaterReceiver'a, activity intent'i yalnız OPEN taşır",/new Intent\(c, WaterReceiver\.class\)/.test(nw)&&/PendingIntent\.getBroadcast\(c, 7202, add, flags\)/.test(nw)&&(nw.match(/new Intent\(c, MainActivity\.class\)[^;]*;/g)||[]).every(s=>!s.includes("LocalNotificationUserAction")));
  ok("smoke: anahtar nw_quick.xml'den okunur, boşsa durur; anahtarsız ve yanlış anahtarlı su kayıt yazmaz; olumlu su/ilaç adımları anahtarlı",/TK=\$\(adb shell run-as com\.neowell\.app cat shared_prefs\/nw_quick\.xml[^\n]*grep -oE '\[0-9a-f\]\{32\}'/.test(sm)&&/\[ -n "\$TK" \] \|\|/.test(sm)&&sm.includes("SAHTE SU KAYDI YAZILDI")&&(sm.match(/--es LocalNotificationUserAction (su|med|medskip) --ei/g)||[]).length===(sm.match(/\\"tk\\":\\"\$TK\\"/g)||[]).length+2);
}
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
  ok("izin: arka plan konumu istenmez; ön plan konumu, konum servisi izni ve location türlü servis kalır; CI APK'da arka plan konumunu görürse durur",!/BACKGROUND_LOCATION"/.test(perms)&&["ACCESS_COARSE_LOCATION","ACCESS_FINE_LOCATION","FOREGROUND_SERVICE","FOREGROUND_SERVICE_LOCATION"].every(p=>perms.includes(`"${p}"`))&&patch.includes('<service android:name=".MotionGpsService" android:exported="false" android:foregroundServiceType="location"/>')&&/grep -qE "[^"]*ACCESS_BACKGROUND_LOCATION[^"]*" manifest\.txt; then echo "PLAY'E UYGUN OLMAYAN İZİN VAR"; exit 1/.test(rd(".github/workflows/apk.yml"))&&/grep -q "android\.permission\.FOREGROUND_SERVICE_LOCATION" manifest\.txt \|\|/.test(rd(".github/workflows/apk.yml")));
  ok("konum metinleri: uygulama ve politika arka plan konumu vaat etmez, Gizlilik ekranı ve politika konumu elle yürüyüşe bağlar",!/Her zaman izin ver|uygulama kapalıyken ya da kullanılmıyorken/.test(www)&&/Konum yalnız elle başlattığın yürüyüşte[^<]*Arka planda konum istenmez/.test(rd("www/privacyui.js"))&&/yalnız elle başlattığın yürüyüşte[^|]*arka planda konum istenmez/.test(rd("docs/gizlilik-politikasi.md"))&&/Background location is not requested/.test(rd("docs/gizlilik-politikasi.md")));
  ok("izin: fener (torch) kullanılmıyor, FLASHLIGHT gereksiz",!/enableTorch|toggleTorch/.test(www));
  const java=fs.readdirSync(path.join(__dirname,"../assets/android")).filter(f=>f.endsWith(".java")).map(f=>[f,rd("assets/android/"+f)]);
  ok("izin: USE_EXACT_ALARM olmadan tam alarm kuran Java kodu reddi yakalar (SecurityException ya da canScheduleExactAlarms)",java.filter(([,s])=>/setExact|setAlarmClock/.test(s)).every(([,s])=>/catch \(SecurityException|canScheduleExactAlarms/.test(s)));
  // D-Veri3: APK boyutu
  ok("boyut: ABI arm64, armeabi-v7a ve smoke emülatörü için x86_64; 32 bit x86 yok",patch.includes('ndk { abiFilters "arm64-v8a", "armeabi-v7a", "x86_64" }')&&/arch: x86_64/.test(rd(".github/workflows/apk.yml")));
  ok("boyut: gömülü barkod motoru paketlenmez ve uygulama onu çağırmaz (yalnız scan)",patch.includes('excludes += ["**/libbarhopper_v3.so"]')&&!/startScan|readBarcodesFromImage/.test(www)&&/bs\.scan\(/.test(www));
}
{ // D-Adım6: uzun aralık atılmaz, parça parça kaydedilir
  const mr=rd("assets/android/MotionReceiver.java"),tk=mr.slice(mr.indexOf("private static void tick"),mr.indexOf("MotionStore.addCp(c, now, steps);")),ms=rd("assets/android/MotionStore.java");
  ok("hareket: tick gün dönünce ya da 3 saatte aralığı kapatıp yeniden açar, atmaz",/ROLL_MS = 3L \* 3600 \* 1000/.test(mr)&&/MotionStore\.dayOf\(now\) != MotionStore\.dayOf\(MotionStore\.lastActivityAt\(c\)\)/.test(tk)&&/MotionStore\.close\(c, now, steps\) == 0 && !newDay\) return;\s*MotionStore\.open\(c, mode, now, steps\);/.test(tk)&&!/discard/.test(tk));
  ok("hareket: kapanış gün numarasıyla bölünür, parça başına 4 saat sınırı; yeniden başlatma ve 30 dk kuralı yerinde",/MotionMath\.split\(model\(c\), mode, cm\(c\), kg\(c\), ts, ss, ds, n,/.test(ms)&&/ds\[i\] = dayOf\(ts\[i\]\)/.test(ms)&&/b\.t1 - b\.t0 > MAX_BOUT_MS\) continue/.test(ms)&&/STALE_MS = 30L \* 60000/.test(mr)&&/ACTION_MY_PACKAGE_REPLACED\.equals\(a\)\) \{[\s\S]{0,200}MotionStore\.discard\(c\)/.test(mr));
}
{ // Dalga 11: adım değeri ile zamanı aynı örnekten (gece yarısı yarışı)
  const mr=rd("assets/android/MotionReceiver.java"),st=rd("assets/android/StepStore.java");
  ok("hareket: tick ve geçiş zamanı sayaç okumasının anından, gün anahtarı aynı örnekten",/long now = StepStore\.sampledAt\(\);/.test(mr)&&/handle\(app, e, steps, StepStore\.sampledAt\(\), nowWall, nowEl\)/.test(mr)&&/t = MotionMath\.onCounterDay\(t, z\.getOffset\(t\), at, z\.getOffset\(at\)\);/.test(mr)&&/sampledAt = at;[\s\S]{0,120}format\(new Date\(at\)\)[\s\S]{0,120}now\.setTimeInMillis\(at\);/.test(st)&&!/System\.currentTimeMillis\(\)/.test(mr.slice(mr.indexOf("private static void tick"),mr.indexOf("MotionStore.addCp(c, now, steps);"))));
}
{ // Arka planda otomatik GPS yok: alıcı konum servisine dokunmaz, karar mantığı silindi
  const mr=rd("assets/android/MotionReceiver.java"),mm=rd("assets/android/MotionMath.java"),gs=rd("assets/android/MotionGpsService.java");
  ok("hareket: etkinlik geçişi ve alarm GPS servisini başlatmaz ya da durdurmaz, arka plan konum izni okunmaz",!/MotionGpsService|LOCATION/.test(mr)&&/MotionStore\.addCp\(c, now, steps\);/.test(mr));
  const mp=rd("assets/android/MotionPlugin.java"),wg=mp.slice(mp.indexOf("public void walkGps"),mp.indexOf("public void configure"));
  ok("yürüyüş GPS: eklentide arka plan konum takma adı yok, walkGps yalnız konum izniyle açar, algılamayı kapatmak GPS'i kapatmaz",!/BACKGROUND|"bg"/.test(mp)&&/has\("fine"\)/.test(wg)&&/MotionGpsService\.start\(getContext\(\)\)/.test(wg)&&/MotionGpsService\.stop\(getContext\(\)\)/.test(wg)&&(mp.match(/MotionGpsService\./g)||[]).length===2);
  ok("yürüyüş GPS: servis ön planda startService ile başlar ve hemen konum türünde startForeground çağırır",/c\.startService\(new Intent\(c, MotionGpsService\.class\)\)/.test(gs)&&!/c\.startForegroundService\(/.test(gs)&&/startForeground\(NOTIF_ID, n, ServiceInfo\.FOREGROUND_SERVICE_TYPE_LOCATION\)/.test(gs));
  ok("hareket: otomatik GPS karar mantığı (gpsWanted, ritim aralığı, sapma, pil) kalmadı",!/gpsWanted|bucket|cadenceShift|BatteryManager|isPowerSaveMode|gpsToday/.test(mm+gs+rd("assets/android/MotionStore.java")));
}
{ // Dalga 11: smoke çökme denetimi
  const sm=rd("scripts/smoke.sh");
  ok("smoke: crash tamponunda uygulamanın çökmesi (Java ve yerel) aranır, her logcat temizliğinden önce ve sonda",/crashcheck\(\) \{ adb logcat -d -b crash > crash\.log; if grep -qE "Process: com\\.neowell\\.app\|>>> com\\.neowell\\.app <<<" crash\.log/.test(sm)&&/clr\(\) \{ crashcheck; adb logcat -c; \}/.test(sm)&&(sm.match(/adb logcat -c/g)||[]).length===1&&/crashcheck\r?\necho "Smoke testi geçti"/.test(sm));
}
{ // D-Veri2: otomatik yedek klasörü
  const bf=rd("assets/android/BackupFolderPlugin.java"),diag=rd("www/index.html").match(/NW-DIAG "\+\[([^\]]+)\]/)[1];
  ok("yedek klasörü: eklenti kopyalanır, kaydedilir, NW-DIAG ve smoke listesinde",/"BackupFolderPlugin"\]\)fs\.copyFileSync/.test(patch)&&/registerPlugin\(BackupFolderPlugin\.class\);\s*super\.onCreate/.test(patch)&&diag.includes('"BackupFolder"')&&/Widget BackupFolder; do/.test(rd("scripts/smoke.sh")));
  ok("yedek klasörü: SAF klasör seçimi, kalıcı izin yalnız seçilene, adres JS'e verilmez ve loglanmaz",/ACTION_OPEN_DOCUMENT_TREE/.test(bf)&&/takePersistableUriPermission\(u, FLAGS\)/.test(bf)&&!/Log\.|printStackTrace|System\.out/.test(bf)&&!/r\.put\("(uri|tree)"/.test(bf)&&!/getMessage/.test(bf));
  ok("yedek klasörü: seçimde ve kapatmada yalnız eski klasörün izni bırakılır, aynı klasör yeniden seçilince bırakılmaz",/String old = prefs\(\)\.getString\("tree", null\);\s*if \(old != null && !old\.equals\(u\.toString\(\)\)\) release\(Uri\.parse\(old\)\);\s*prefs\(\)\.edit\(\)\.putString\("tree"/.test(bf)&&/clear\(PluginCall call\) \{\s*String old = prefs\(\)\.getString\("tree", null\);\s*if \(old != null\) release\(Uri\.parse\(old\)\);/.test(bf)&&(bf.match(/releasePersistableUriPermission/g)||[]).length===1);
  ok("yedek klasörü: \"wt\" desteklenmezse dosya silinip yeniden oluşturulur ve \"w\" ile yazılır (kısaltmasız \"w\" eski baytları bırakmaz)",/put\(cr, doc, "wt", data\);\s*\} catch \(Exception e\) \{[\s\S]{0,200}DocumentsContract\.deleteDocument\(cr, doc\);\s*put\(cr, create\(cr, dir, name\), "w", data\);/.test(bf));
  ok("yedek klasörü: yalnız yedek adlı dosyalar yazılır ve silinir",/NAME_RE = "neowell-yedek-\\\\d\{4\}-\\\\d\{2\}-\\\\d\{2\}\\\\\.json"/.test(bf)&&/!name\.matches\(NAME_RE\)/.test(bf)&&/n\.matches\(NAME_RE\)\) out\.put/.test(bf)&&/Uri doc = have\.get\(names\.getString\(i\)\)/.test(bf));
}
{ // D-Ant15: rehberli mod sesli komutu
  const sp=rd("assets/android/SpeechPlugin.java"),diag=rd("www/index.html").match(/NW-DIAG "\+\[([^\]]+)\]/)[1],init=sp.slice(sp.indexOf("new TextToSpeech("),sp.indexOf("ready = true;"));
  ok("ses: eklenti kopyalanır, kaydedilir, NW-DIAG ve smoke listesinde",/"SpeechPlugin","BackupFolderPlugin"\]\)fs\.copyFileSync/.test(patch)&&/registerPlugin\(SpeechPlugin\.class\);/.test(onCreate)&&diag.includes('"Speech"')&&/ Speech Widget BackupFolder; do/.test(rd("scripts/smoke.sh"))&&/@CapacitorPlugin\(name = "Speech"\)/.test(sp));
  ok("ses: Android 11+ TTS motor sorgusu manifestte (paket görünürlüğü), bir kez eklenir",patch.includes(`if (!x.includes("android.intent.action.TTS_SERVICE"))`)&&patch.includes('<queries><intent><action android:name="android.intent.action.TTS_SERVICE"/></intent></queries>'));
  ok("ses: speak, stop, isAvailable eklenti metodu; hata yerine spoken:false, reject yok",["speak","stop","isAvailable"].every(m=>new RegExp(`@PluginMethod\\s+public void ${m}\\(PluginCall call\\)`).test(sp))&&/r\.put\("spoken", ok\)/.test(sp)&&!/call\.reject|throw /.test(sp));
  ok("ses: init asenkron, başarısızlıkta tts'e dokunulmaz, hazır olmadan konuşulmaz",/status != TextToSpeech\.SUCCESS \|\| tts == null\) return;/.test(init)&&/if \(ready && text != null/.test(sp)&&/if \(ready\) tts\.stop\(\)/.test(sp));
  ok("ses: Türkçe (tr-TR) varsa seçilir, yoksa motorun varsayılan dili",/Locale\.forLanguageTag\("tr-TR"\)/.test(init)&&/isLanguageAvailable\(tr\) >= TextToSpeech\.LANG_AVAILABLE\) turkish = tts\.setLanguage\(tr\)/.test(init));
  ok("ses: müzik kısa kısılır (GAIN_TRANSIENT_MAY_DUCK), son söz bitince odak bırakılır, API 26 ayrımı",(sp.match(/AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK/g)||[]).length===2&&/Build\.VERSION\.SDK_INT >= 26/.test(sp)&&/abandonAudioFocusRequest/.test(sp)&&/if \(lastId\.equals\(id\)\) abandonFocus\(\)/.test(sp)&&["onDone","onError","onStop"].every(m=>new RegExp(`public void ${m}\\(String id[^)]*\\) \\{ release\\(id\\); \\}`).test(sp)));
  ok("ses: kısa komut (≤20 karakter) sıraya eklenir, uzun evre cümlesi eskisini keser; guidelib kısa metinleri bu sınırda",/SHORT = 20;/.test(sp)&&/int mode = text\.length\(\) <= SHORT \? TextToSpeech\.QUEUE_ADD : TextToSpeech\.QUEUE_FLUSH;/.test(sp)&&/tts\.speak\(text, mode, null, id\)/.test(sp)&&/s\.length<=20/.test(rd("scripts/guide.test.js")));
  ok("ses: kapanışta motor kapatılır",/protected void handleOnDestroy\(\) \{\s*if \(tts != null\) tts\.shutdown\(\);/.test(sp));
}
process.exit(bad?1:0);
