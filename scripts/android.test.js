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
process.exit(bad?1:0);
