/* Privacy round 2: opening a sealed shared file, lock-screen detail, widget hiding, hide-numbers coverage, archive list, restore and reset notes. */
const {ok,finish}=require("./ok");
const {boot,until,flush,read}=require("./html");
const fs=require("fs");
const BackupLib=require("../www/modules/data/backuplib.js");
const ArchiveLib=require("../www/modules/data/archivelib.js");
const nodeCrypto=require("node:crypto");
const rd=f=>fs.readFileSync(require("path").join(__dirname,"..",f),"utf8");
async function open({settings={},state={},plugins={}}={}){
  const wr=[],ln=[],mw=[],wg=[];
  const w=await boot(w=>{
    Object.defineProperty(w,"crypto",{value:nodeCrypto.webcrypto,configurable:true});
    w.Capacitor={isNativePlatform:()=>true,Plugins:{
      Filesystem:{readdir:async()=>({files:[]}),deleteFile:async()=>{},writeFile:async o=>{wr.push(o);return {uri:"file:///"+o.path}}},
      Share:{share:async()=>{}},
      LocalNotifications:{checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async o=>{ln.push(...o.notifications)}},
      MedWake:{set:async o=>{mw.push(o)},fsi:async()=>({allowed:true}),log:async()=>({items:[]})},
      Widget:{update:async o=>{wg.push(o)},wipe:async()=>{}},
      ...plugins}};
    w.localStorage.setItem("nw_state",JSON.stringify({entries:[],...state,settings:{obDone:true,noticeOk:true,age:30,...settings}}));
  });
  return {w,wr,ln,mw,wg};
}
const fileOf=(w,text)=>({size:text.length,text:async()=>text});
async function openSealed(w,text,pw){
  w.eval("sheetSealed()");
  const inp=w.document.querySelector("#slf");
  Object.defineProperty(inp,"files",{value:[fileOf(w,text)],configurable:true});
  w.document.querySelector("#slp").value=pw;
  w.document.querySelector('[data-sl="go"]').click();
  await until(()=>!w.document.querySelector("#slw")||w.document.querySelector("#slw").textContent!==""&&w.document.querySelector("#slw").textContent!=="Açılıyor…"||w.document.querySelector('[data-sl="share"]'));
  return w.document.querySelector("#slw")?.textContent||"";
}
(async()=>{
  // --- opening a sealed shared file
  {const {w,wr}=await open();
  const env=JSON.stringify(await BackupLib.encrypt({file:{name:"neowell-rapor-2026-10-14.pdf",mime:"application/pdf",utf8:false,data:Buffer.from("%PDF-1.4").toString("base64")}},"parola-12345"));
  w.eval("tab='settings-data';render()");
  ok("Veri ve yedek has the open-sealed-file row",!!w.document.querySelector('[data-sl="open"]'));
  let m=await openSealed(w,env,"yanlis-parola");
  ok("a wrong password gets its own message and nothing is shown",/Parola yanlış/.test(m)&&!w.document.querySelector('[data-sl="share"]'),m);
  m=await openSealed(w,JSON.stringify({...JSON.parse(env),iv:"abc"}),"parola-12345");
  ok("a damaged file gets a message that differs from the wrong-password one",/bozuk/.test(m)&&!/Parola yanlış/.test(m),m);
  m=await openSealed(w,"{ bu json degil","parola-12345");
  ok("text that is not JSON is reported as unreadable",/okunamadı/.test(m),m);
  const bk=JSON.stringify(await BackupLib.encrypt({S:{entries:[]},at:"2026-10-01"},"parola-12345"));
  m=await openSealed(w,bk,"parola-12345");
  ok("a backup file is told apart from a shared file and sent to restore",/yedek dosyası/.test(m)&&/Yedekten geri yükle/.test(m),m);
  m=await openSealed(w,env,"parola-12345");
  ok("the right password shows the file name and offers share or save",!!w.document.querySelector('[data-sl="share"]')&&/neowell-rapor-2026-10-14\.pdf/.test(w.document.body.textContent)&&/PDF raporu/.test(w.document.body.textContent),m);
  w.document.querySelector('[data-sl="share"]').click();await flush();
  ok("sharing hands the original bytes and type over under the same name",wr.length===1&&wr[0].path==="neowell-rapor-2026-10-14.pdf"&&wr[0].data===Buffer.from("%PDF-1.4").toString("base64")&&!wr[0].encoding,wr[0]);
  ok("the shared file's name cannot leave the share folder",(n=>n.startsWith("neowell-")&&!/\//.test(n))(BackupLib.sharedFile({file:{name:"../../x.pdf",mime:"application/pdf",utf8:true,data:"a"}}).name));
  w.eval("closeSheet()");
  const r=await w.eval(`openBackup(${JSON.stringify(env)},"parola-12345")`);
  ok("a shared file given to restore is refused with a pointer to the open screen",r===null&&/Şifreli dosyayı aç/.test(w.document.querySelector("#tmsg").textContent),w.document.querySelector("#tmsg").textContent);}

  // --- shared file names and sealing of reports
  {const {w,wr}=await open({settings:{sealOut:false}});
  w.eval("tab='settings-data';render()");
  w.eval("sheetExport()");
  const sw=w.document.querySelector('[data-pv="seal"]');
  ok("the seal switch sits above the PDF reports and is a saved setting",!!sw&&sw.checked===false);
  sw.checked=true;sw.dispatchEvent(new w.Event("click",{bubbles:true}));
  ok("turning it on is stored",w.eval("S.settings.sealOut")===true);
  w.eval("closeSheet();sharePdf(new Uint8Array([37,80,68,70]),'neowell-rapor-2026-10-14.pdf','Rapor')");
  await until(()=>w.document.querySelector("#shp1"));
  ok("with sealing on, a plain PDF share asks for a password first",!!w.document.querySelector("#shp1")&&wr.length===0);
  ok("report, list and table file names carry no condition name",[["modules/insights/weeklyui.js"],["modules/labs/labui.js"],["modules/vitals/vitalsui.js"],["modules/insights/doctorui.js"]].every(([f])=>/neowell-rapor-/.test(rd("www/"+f))&&!/neowell-(tansiyon|seker|tahlil|hekim|haftalik)/.test(rd("www/"+f)))&&/neowell-liste-/.test(rd("www/modules/coach/coach.js")));}

  // --- archive list
  {const S={settings:{kcal:2000,ramOn:true,ramSahur:true,ramIftar:true,ramFrom:"2026-09-01",ramMeds:{1:{"08:00":"04:00"}},ramMedsNo:true,ramWater:true,fastEdOk:true,ramLat:39,ramLon:32,ramName:"Ankara"}},d=JSON.parse(ArchiveLib.build(S,"2026-10-14").json);
  ok("the archive leaves out the Ramadan settings and the eating-disorder consent, keeps ordinary settings",["ramOn","ramSahur","ramIftar","ramFrom","ramMeds","ramMedsNo","ramWater","fastEdOk","ramLat","ramName"].every(k=>!(k in d.settings))&&d.settings.kcal===2000);
  const p=rd("www/modules/data/privacyui.js");
  ok("the archive and bundle rows say they are not restored and do not replace a backup",(p.match(/Uygulamaya geri yüklenmez, yedek yerine geçmez/g)||[]).length===2);}

  // --- lock-screen detail
  {const {w,ln,mw}=await open({settings:{bpOn:true,medOn:true,reminders:undefined},state:{meds:[{id:1,n:"Aspirin",d:"100 mg",t:["08:00"],on:true}]}});
  w.eval("S.settings.reminders.find(r=>r.id===7).on=true;S.settings.reminders.find(r=>r.id===2).on=true;S.settings.medOn=true");
  await w.eval("scheduleReminders()");
  const bp=ln.find(n=>n.id>=700&&n.id<730),water=ln.find(n=>n.id>=200&&n.id<230),med=ln.find(n=>n.id>=1e6);
  ok("with lock detail off (default) measurement and medication notifications carry the generic title and the private channel twin",bp&&bp.title==="NeoWell: hatırlatma"&&!/ölç/.test(bp.body)&&med&&med.title==="NeoWell: hatırlatma"&&med.channelId==="nw_medp"&&!/Aspirin/.test(JSON.stringify(med)),[bp,med]);
  ok("water reminders keep their own title",water&&/Su molası/.test(water.title),water);
  ok("the screen-alarm plugin is told the setting",mw.at(-1).detail===false,mw.at(-1));
  ln.length=0;w.eval("S.settings.lockDetail=true");await w.eval("scheduleReminders()");
  const bp2=ln.find(n=>n.id>=700&&n.id<730),med2=ln.find(n=>n.id>=1e6);
  ok("with it on the descriptive titles and the public channel come back",/Tansiyon ölçümü/.test(bp2.title)&&med2.channelId==="nw_med"&&mw.at(-1).detail===true,[bp2,med2]);
  w.eval("tab='settings-data';render()");
  ok("Veri ve yedek has the lock-screen detail switch",!!w.document.querySelector("[data-ld]"));
  const mr=rd("assets/android/MedWakeReceiver.java"),mp=rd("assets/android/MedWakePlugin.java"),mn=rd("assets/android/MainActivity.java"),lt=rd("assets/android/LockText.java");
  ok("native: channels are created with the setting's visibility and the full-screen notification is private with generic text when it is off",/setLockscreenVisibility\(vis\)/.test(mr)&&!/VISIBILITY_PUBLIC\)\s*;\s*\n\s*nm\./.test(mr)&&/LockText\.TITLE/.test(mr)&&/on \? Notification\.VISIBILITY_PUBLIC : Notification\.VISIBILITY_PRIVATE/.test(mr)&&/setDetail\(getContext\(\), call\.getBoolean\("detail", false\)\)/.test(mp)&&!/setLockscreenVisibility\(Notification\.VISIBILITY_PUBLIC\)/.test(mn+mr)&&/MedWakeReceiver\.channel\(this\)/.test(mn)&&/id \+ "p"/.test(lt));
  ok("native: LockText is copied to the project and its test runs in CI",/"LockText"/.test(rd("scripts/patch-android.js"))&&/LockText\.java[^\n]*LockTextTest\.java/.test(rd(".github/workflows/apk.yml"))&&/LockTextTest/.test(rd(".github/workflows/apk.yml")));}

  // --- widget
  {const {w,wg}=await open({settings:{lockOn:false}});
  w.eval("widgetPush()");await flush();
  ok("the widget gets figures by default",wg.length&&wg.at(-1).hide===undefined,wg.at(-1));
  w.eval("S.settings.widgetHide=true;widgetPush()");await flush();
  ok("with the widget switch on the push says hide",wg.at(-1).hide===true,wg.at(-1));
  w.eval("S.settings.widgetHide=false;S.settings.lockOn=true;widgetPush()");await flush();
  ok("with the app lock on the widget hides too",wg.at(-1).hide===true,wg.at(-1));
  const nw=rd("assets/android/NeoWidget.java");
  ok("native: the widget shows no figures when hide is set",/o\.optBoolean\("hide"\)/.test(nw)&&/hide \? "Rakamlar gizli" : kcal/.test(nw)&&/"Uygulama kilidi açık" : "Ayarlarda gizli"\) : unit/.test(nw)&&/hide \? "" : \(isToday \? liters/.test(nw)&&/hide \? View\.GONE : View\.VISIBLE/.test(nw)&&/!hide && o\.has\("steps"\)/.test(nw));}

  // --- hide numbers
  {const {w}=await open({settings:{hideNums:true,kcal:2000,waterMl:2500,moveKcalOn:true,heightCm:170}});
  w.eval("add('weight',82);add('weight',80.5);const f=add('food',1900,'Yoğurt');f.p=20;f.c=30;f.f=10;f.fb=5;f.sg=4;f.na=100");
  w.eval("tab='today';render()");
  const t=w.document.querySelector(".rings").closest(".card").textContent;
  ok("hide numbers: no macros, fibre, sugar, kcal range or movement bonus, no kcal figure",!/Protein/.test(t)&&!/Lif/.test(t)&&!/Şeker/.test(t)&&!/Hedefe hareketten/.test(t)&&!/Tarif farkına/.test(t)&&!/\d{3,}/.test(t),t);
  ok("hide numbers: the calorie ring is drawn without an arc and without 'kcal hedefin üstünde'",!w.document.querySelector(".rings .ring.main .rp")&&!/kcal hedefin üstünde/.test(t),t);
  w.eval("tab='trend';render()");
  const cells=()=>w.document.querySelector(".stats.kp").textContent;
  ok("hide numbers: Trend start, now, total change and rate are masked, one tap shows them",/Başlangıç/.test(cells())&&!/\d/.test(cells())&&!!w.document.querySelector('[data-act="shownums"]'),cells());
  w.document.querySelector('[data-act="shownums"]').click();await flush();
  ok("the show button reveals the figures",/80,5|82/.test(cells()),cells());
  w.eval("openSheet('<input id=\"fv\" value=\"81,0\"><div id=\"kerr\"></div><div id=\"kwarn\"></div>');goWeight()");
  const tm=w.document.querySelector("#tmsg").textContent;
  ok("hide numbers: the weigh-in toast names no weight or difference",/Tartı kaydedildi/.test(tm)&&!/81|fark|öncekine/.test(tm),tm);
  const so=rd("www/modules/motion/stepsui.js");
  ok("hide numbers: the step best day and streak are hidden, and the hide-streak setting also hides the step streak",/st\.hideNums\?"":`<div class="stat"><div class="k">En iyi gün/.test(so)&&/st\.hideNums\|\|st\.hideStreak\?"":`<div class="stat"><div class="k">Hedef serisi/.test(so)&&/adım serisini/.test(rd("www/main/03-screens.js")));}

  // --- hide recents suggestion
  {const {w}=await open({settings:{lockOn:true,hideRecents:false}});
  w.eval("tab='settings-data';render()");
  ok("an existing lock user without hide-recents gets a one-time suggestion",!!w.document.querySelector('[data-act="recentson"]'));
  w.document.querySelector('[data-act="recentson"]').click();await flush();
  ok("accepting turns hide-recents on and the suggestion goes",w.eval("S.settings.hideRecents")===true&&!w.document.querySelector('[data-act="recentson"]'));
  const n=await open({settings:{lockOn:true,hideRecents:false}});
  n.w.eval("tab='settings-data';render()");n.w.document.querySelector('[data-act="recentsno"]').click();await flush();
  n.w.eval("render()");
  ok("declining is remembered and the suggestion does not return",n.w.eval("S.settings.recentsAsked")===true&&!n.w.document.querySelector('[data-act="recentson"]'));}

  // --- reset and restore notes
  {const {w}=await open();
  w.localStorage.setItem("nw_ocrok","1");
  w.eval("window.confirm=m=>{window.__m=m;return true}");
  w.document.body.insertAdjacentHTML("beforeend",'<button data-act="reset" id="rs"></button>');w.document.querySelector("#rs").click();
  await until(()=>w.localStorage.getItem("nw_ocrok")===null,2000);
  body=w.eval("window.__m||''");
  ok("delete-all says that shared and backup-folder files stay",/Paylaştığın dosyalar/.test(body)&&/yedek klasöründeki dosyalar silinmez/.test(body),body);
  ok("delete-all removes the OCR check flag",w.localStorage.getItem("nw_ocrok")===null);}
  {const sh=rd("www/main/04-sheets.js");
  ok("restore toast says hide-recents stays off and that the Ramadan verification is not in the backup",/lostRecents\?"\. Son uygulamalarda gizleme bu telefonda kapalı kaldı/.test(sh)&&/Ramazan vakit doğrulaması yedekte yoktur/.test(sh));}
  finish();
})();
