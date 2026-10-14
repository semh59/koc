/* "Delete all data" and category delete reach the phone-side copies and do not say "deleted" when something could not be cleared. */
const fs=require("fs"),{ok,finish}=require("./ok");
const {boot,until}=require("./html");
const J=f=>fs.readFileSync(__dirname+"/../assets/android/"+f,"utf8");
(async()=>{
  const calls=[];let fail="";
  const plug=n=>({wipe:async()=>{if(fail===n)throw new Error("native");calls.push(n)},set:async()=>{},update:async()=>{},status:async()=>({}),stop:async()=>{}});
  const w=await boot(w=>{
    w.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{Motion:plug("Motion"),MedWake:plug("MedWake"),Widget:plug("Widget"),QuickLog:plug("QuickLog")}};
    w.indexedDB={open(){throw new Error("idb")}};
  });
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s),msg=()=>q("#tmsg").textContent;
  const fresh=()=>{ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.stepsOn=true;S.moves=[{t0:1}];S.meds=[{id:1,n:'A'}];S.entries=[{id:1,type:'water',day:dayKey(),time:'08:00',v:250}];S.nextId=2;save();tab='today';render()");calls.length=0};
  const reset=async()=>{const b=w.document.createElement("button");b.dataset.act="reset";w.document.body.appendChild(b);b.click();await new Promise(r=>setTimeout(r,50))};

  fresh();
  w.indexedDB={open(){throw new Error("idb")}};
  await reset();
  ok("delete all: photo store that cannot be cleared keeps the data and does not say deleted",ev("S.entries.length")===1&&!/Tüm veriler silindi/.test(msg())&&/Fotoğraflar silinemedi/.test(msg()),msg());

  const cat0=()=>ev(`pvDeleteDo("Fotoğraflar",Data.privacy.find(c=>c[0]==="İlerleme fotoğrafları")[2])`);
  fresh();cat0();await until(()=>/silinemedi/.test(msg()));
  ok("photo category: a store that cannot be cleared does not say deleted",/Fotoğraflar silinemedi/.test(msg())&&!/silindi$/.test(msg()),msg());

  delete w.indexedDB;fresh();
  await reset();
  ok("delete all: asks Motion, MedWake, Widget and QuickLog to wipe, then clears the state",["Motion","MedWake","Widget","QuickLog"].every(n=>calls.includes(n))&&ev("S.entries.length")===0&&/Tüm veriler silindi/.test(msg()),[calls,msg()]);

  fresh();fail="Widget";
  await reset();
  ok("delete all: a native wipe that fails keeps the data and says so",ev("S.entries.length")===1&&/Telefondaki kayıtlar silinemedi/.test(msg())&&!/Tüm veriler silindi/.test(msg()),msg());
  fail="";

  const cat=name=>ev(`(()=>{const i=Data.privacy.findIndex(c=>c[0]==="${name}");pvDeleteDo(Data.privacy[i][0],Data.privacy[i][2]);return 1})()`);
  fresh();cat("Adım ve hareket");await until(()=>/silindi/.test(msg()));
  ok("steps category: wipes the Motion side and the records",calls.includes("Motion")&&ev("S.moves.length")===0&&/silindi/.test(msg()),[calls,msg()]);
  fresh();fail="Motion";cat("Adım ve hareket");await until(()=>/silinemedi/.test(msg()));
  ok("steps category: native failure keeps the records and does not say deleted",ev("S.moves.length")===1&&/Telefondaki kayıtlar silinemedi/.test(msg())&&!/silindi$/.test(msg()),msg());
  fail="";
  fresh();cat("İlaç");await until(()=>/silindi/.test(msg()));
  ok("medication category: wipes the MedWake dose list and log",calls.includes("MedWake")&&ev("S.meds.length")===0,[calls,msg()]);
  fresh();fail="MedWake";cat("İlaç");await until(()=>/silinemedi/.test(msg()));
  ok("medication category: native failure keeps the medications",ev("S.meds.length")===1&&!/silindi$/.test(msg()),msg());
  fail="";

  const ss=J("StepStore.java"),ms=J("MotionStore.java"),mw=J("MedWakeReceiver.java"),nw=J("NeoWidget.java"),ql=J("QuickLogPlugin.java");
  ok("StepStore.wipe removes every h_ day and snapAt, keeps the counter state",/static synchronized void wipe\(Context c\)[\s\S]{0,260}remove\("snapAt"\)[\s\S]{0,160}startsWith\("h_"\)[\s\S]{0,80}\.commit\(\)/.test(ss)&&!/wipe[\s\S]{0,200}remove\("base"\)/.test(ss));
  ok("MotionStore.wipe clears height, weight, model and intervals and keeps only the switch",/static synchronized void wipe\(Context c\)\s*\{\s*boolean on = enabled\(c\);\s*p\(c\)\.edit\(\)\.clear\(\)\.putBoolean\("on", on\)\.commit\(\)/.test(ms));
  ok("MedWakeReceiver.wipe cancels alarms and removes doses and log",/static synchronized void wipe\(Context c\)\s*\{\s*arm\(c, new long\[0\], "WIPE"\);\s*prefs\(c\)\.edit\(\)\.remove\(DOSES\)\.remove\(LOG\)\.commit\(\)/.test(mw));
  ok("NeoWidget.wipe clears the stored summary and redraws",/static synchronized void wipe\(Context c\)\s*\{\s*prefs\(c\)\.edit\(\)\.clear\(\)\.apply\(\);\s*refresh\(c\)/.test(nw));
  ok("QuickLog wipe drops the queue and the in-flight records, not the secret",/void wipe\(PluginCall call\)\s*\{\s*prefs\(getContext\(\)\)\.edit\(\)\.remove\("q"\)\.remove\("inflight"\)\.commit\(\)/.test(ql));
  ok("each plugin exposes wipe to JS",/StepStore\.wipe\(getContext\(\)\);\s*MotionStore\.wipe\(getContext\(\)\)/.test(J("MotionPlugin.java"))&&/MedWakeReceiver\.wipe\(getContext\(\)\)/.test(J("MedWakePlugin.java"))&&/NeoWidget\.wipe\(getContext\(\)\)/.test(J("WidgetPlugin.java")));
  finish();
})();
