/* Alarm reliability: time zone and clock changes, real battery and autostart state, missed alarm warning, wizard order, one text source, notification taps. */
const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path");
const rd=f=>fs.readFileSync(path.join(__dirname,"..",f),"utf8");
const M=require("../www/modules/meds/medlib.js");
const {boot,flush}=require("./html");

/* P3.1 time zone and clock */
const mw=rd("assets/android/MedWakeReceiver.java");
ok("clockMoved: a boot, time or zone record after the last app setup means the phone moved the alarms",M.clockMoved([{a:"APP"},{a:"TZ"}])&&M.clockMoved([{a:"APP"},{a:"TIME"}])&&M.clockMoved([{a:"APP"},{a:"BOOT"},{a:"WAKE"}]));
ok("clockMoved: nothing after the last app setup, or an empty log, is not a move",!M.clockMoved([{a:"BOOT"},{a:"APP"}])&&!M.clockMoved([{a:"APP"},{a:"WAKE"},{a:"AS"}])&&!M.clockMoved([]));
ok("clockMoved: a log without any app setup is rebuilt",M.clockMoved([{a:"WAKE"}]));
ok("native: a zone change moves the saved times and the alarm screen's doses, the zone id is stored at every arm",/arm\(c, rezone\(c, load\(c\)\), cause\(a\)\)/.test(mw)&&/ZoneMath\.move\(d\.optLong\("at"\), from, to\)/.test(mw)&&/return ZoneMath\.move\(times, from, to\)/.test(mw)&&/putString\(ZONE, TimeZone\.getDefault\(\)\.getID\(\)\)/.test(mw)&&/was\.isEmpty\(\) \|\| was\.equals\(to\.getID\(\)\)/.test(mw));
ok("native: boot, time and zone records are not merged into a following app setup",/!pinned\(last\.optString\("a"\)\) && !pinned\(e\.optString\("a"\)\)/.test(mw)&&/"BOOT"\.equals\(a\) \|\| "TIME"\.equals\(a\) \|\| "TZ"\.equals\(a\)/.test(mw));
ok("native: ZoneMath is copied to the project and compiled and run in CI",/"ZoneMath", "MedWakeReceiver"/.test(rd("scripts/patch-android.js"))&&/ZoneMath\.java[^\n]*ZoneMathTest\.java/.test(rd(".github/workflows/apk.yml"))&&/com\.neowell\.app\.ZoneMathTest/.test(rd(".github/workflows/apk.yml")));

(async()=>{
  const sched=[];let items=[],tz=-180,st={},dhRes={opened:"autostart"};
  const w=await boot(w=>{
    w.Capacitor={isNativePlatform:()=>true,Plugins:{
      LocalNotifications:{checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),registerActionTypes:async()=>{},cancel:async()=>{},schedule:async x=>{sched.push(x)}},
      MedWake:{log:async()=>({items,state:st}),set:async()=>{},fsi:async()=>({allowed:true})},
      DeviceHelp:{info:async()=>({manufacturer:"xiaomi"}),openAutostart:async()=>dhRes,openBattery:async()=>dhRes,openDetails:async()=>({opened:"details"})}}};
    w.Date.prototype.getTimezoneOffset=()=>tz;
  });
  const ev=s=>w.eval(s);
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true");
  await ev("scheduleReminders()");
  ok("resume: nothing changed, no rebuild",await ev("schedDue()")===false);
  tz=-120;
  ok("resume: a different zone offset rebuilds at once, without waiting 6 hours",await ev("schedDue()")===true);
  await ev("scheduleReminders()");
  ok("resume: after the rebuild it is quiet again",await ev("schedDue()")===false);
  items=[{a:"APP"},{a:"TIME",t:1}];
  ok("resume: the phone moved the clock by hand, the alarm log says so, rebuild",await ev("schedDue()")===true);

  /* P3.2 derived state */
  const T=Date.parse("2026-10-14T12:00:00Z"),H=36e5,arm={a:"APP",t:T-H,nx:[T-H/2],n:1},ring={a:"WAKE",t:T-H/2,p:T-H/2};
  const B=(st,it,now=T)=>M.bgState(st,it,now);
  ok("bgState: battery state comes from the phone, unknown stays null",B({bo:true},[]).bo===true&&B({bo:false},[]).bo===false&&B({},[]).bo===null);
  ok("bgState: an alarm that did not ring is a miss for 2 days and cleared by a later on-time ring",B({},[arm,{a:"APP",t:T-H/4}]).miss===T-H/2&&B({},[arm,{a:"APP",t:T-H/4}],T+3*864e5).miss===0&&B({},[arm,{a:"APP",t:T-H/4},{a:"WAKE",t:T-1e3,p:T-1e3}]).miss===0);
  ok("bgState: a ring more than a minute late is slow, an on-time one is on time, an empty log claims nothing",B({},[ring,{a:"WAKE",t:T,p:T-120000}]).slow===true&&B({},[ring]).ontime===true&&!B({},[]).ontime&&!B({},[]).slow&&B({},[]).miss===0);
  ok("bgState: the last boot setup is kept",B({},[{a:"BOOT",t:5,n:3},{a:"BOOT",t:9,n:4}]).boot.n===4);
  const bat=()=>ev("pmItems().find(i=>i.id==='bat')");
  ev("oem='xiaomi'");st={bo:true};items=[];await ev("pmRefresh()");
  ok("permissions centre: Xiaomi with the battery free but no alarm seen yet is 'cannot be checked', not Tamam",bat().ok===null);
  items=[ring];await ev("pmRefresh()");
  ok("permissions centre: the battery free and the last alarm on time is Tamam, no self-declaration involved",bat().ok===true);
  st={bo:false};await ev("pmRefresh()");
  ok("permissions centre: a restricted battery is Kapalı and counted as missing on Xiaomi",bat().ok===false&&ev("pmMissing().some(i=>i.id==='bat')"));
  ev("oem='google'");st={bo:false};items=[];await ev("pmRefresh()");
  ok("permissions centre: outside Xiaomi a restricted battery is shown but is not counted as missing without evidence",bat().ok===false&&!ev("pmMissing().some(i=>i.id==='bat')"));
  st={bo:true};items=[arm,{a:"APP",t:T+1}];ev("S.settings.medOn=true;S.meds=MedLib.cleanMeds([{id:1,n:'A',t:['08:00'],on:true}]);S.settings.alarmWarnDay=''");
  w.Date.now=()=>T+2;await ev("pmRefresh()");ev("tab='today';render()");
  const today=()=>w.document.querySelector("#view").textContent;
  ok("Today: a planned alarm that never rang shows a warning with its time",today().includes("Bir ilaç alarmı çalmadı")&&today().includes(M.dhm(T-H/2)));
  w.document.querySelector('[data-pm="hidemiss"]').click();
  ok("Today: Kapat hides the warning for the day and it is stored as a day key",!today().includes("Bir ilaç alarmı çalmadı")&&ev("S.settings.alarmWarnDay")===ev("dayKey()"));
  items=[{a:"BOOT",t:T-H,n:7,nx:[T+H],in:7},arm];await ev("pmRefresh()");ev("pmSheet()");
  ok("permissions sheet: says the alarms are rebuilt after a restart and shows the last such setup",w.document.querySelector("#sheet").textContent.includes("yeniden başlayınca")&&w.document.querySelector("#sheet").textContent.includes("telefon açıldı"));
  dhRes={opened:"details"};ev("openDH('openAutostart')");await flush();
  ok("autostart screen could not be opened: the path is written out",w.document.querySelector("#sheet").textContent.includes("Otomatik başlat > NeoWell"));
  dhRes={opened:"autostart"};ev("closeSheet()");ev("openDH('openAutostart')");await flush();
  ok("autostart screen opened: no path sheet",!w.document.querySelector("#sheet").classList.contains("on")||!w.document.querySelector("#sheet").textContent.includes("Otomatik başlat > NeoWell"));
  ok("oemDone self-declaration is gone",!/oemDone|oemok/.test(rd("www/main/01-core.js")+rd("www/main/07-actions.js")+rd("www/main/05-notifications.js")));

  /* P3.3 wizard and texts */
  ev("oem='xiaomi';sheetOem()");
  const wz=w.document.querySelector("#sheet").textContent;
  ok("Xiaomi wizard: locking in recents is the first step, then autostart, then battery",wz.indexOf("1. Son uygulamalarda kilitle")>0&&wz.indexOf("1. Son uygulamalarda kilitle")<wz.indexOf("2. Otomatik başlat")&&wz.indexOf("2. Otomatik başlat")<wz.indexOf("3. Pil"));
  ok("Xiaomi wizard: closes with Kapat, no self-declaration button",!!w.document.querySelector('#sheet [data-pm="close"]')&&!w.document.querySelector('#sheet [data-act="oemok"]'));
  ev("closeSheet();S.settings.medOn=true;S.meds=MedLib.cleanMeds([{id:1,n:'A',t:['08:00'],on:true}]);exactOk=false;fsiOk=true;pmNotif=true;bg={bo:true,ontime:true};tab='today';render()");
  const ex=ev("PM_TEXT.exact.warn"),fs=ev("PM_TEXT.fsi.warn"),t1=today().includes(ex);
  ev("exactOk=true;fsiOk=false;render()");
  ok("one text: the Today warning rows use the same sentence as PM_TEXT",t1&&today().includes(fs));
  ev("exactOk=false;fsiOk=true");
  ev("tab='settings-reminders';render()");
  ok("one text: the Reminders screen shows the same exact-alarm sentence, the silent mode note, and no Xiaomi button of its own",today().includes(ex)&&today().includes(ev("PM_TEXT.dnd"))&&!today().includes("Xiaomi hatırlatma ayarları"));
  ev("pmSheet()");
  ok("one text: the permissions sheet carries the silent mode note and the list sentences come from PM_TEXT",w.document.querySelector("#sheet").textContent.includes(ev("PM_TEXT.dnd"))&&w.document.querySelector("#sheet").textContent.includes(ev("PM_TEXT.exact.why")));
  const scr=rd("www/main/03-screens.js");
  ok("one text: 03-screens holds no second copy of the warnings, and names the app instead of Rehber for notification settings",!/Tam saat alarm izni kapalı/.test(scr)&&!/Tam ekran bildirim izni kapalı/.test(scr)&&!/Rehber için bildirimleri/.test(scr)&&/NeoWell için bildirimleri aç/.test(scr));
  w.Capacitor.Plugins.LocalNotifications.checkPermissions=async()=>({display:"denied"});
  await ev("notifTest()");
  ok("diagnosis line is Turkish: no granted/denied/prompt",/Bildirim izni: kapalı\. Tam saat alarmı: açık\./.test(ev("notifDiag"))&&!/granted|denied|prompt/.test(ev("notifDiag")),ev("notifDiag"));

  /* P3.4 notification actions */
  const tap=x=>ev(`notifTap(${JSON.stringify({actionId:"tap",notification:{extra:x}})});[tab,tSec].join()`);
  w.Capacitor.Plugins.LocalNotifications.checkPermissions=async()=>({display:"granted"});
  sched.length=0;ev("S.settings.reminders.find(r=>r.id===1).dow=null;S.settings.reminders.find(r=>r.id===1).on=true");await ev("scheduleReminders()");
  const wn=sched.flatMap(x=>x.notifications).find(n=>n.id>=100&&n.id<130);
  ok("weight reminder: the notification carries the weight page target",wn&&wn.extra&&wn.extra.tab==="weight",wn);
  ev("tab='today';tSec='nutrition'");
  ok("weight reminder: a tap opens Trend on the weight section",tap(wn.extra)==="trend,weight");
  ev("tab='today'");
  ok("rest notification: a tap goes to Salon",tap({act:"open",tab:"gym"})==="gym,weight");
  const wk=ex=>`({ex:${JSON.stringify(ex)}})`,st2=(n,d)=>Array.from({length:n},(_,i)=>({done:i<d}));
  const E=(id,n,d,ss)=>({id:"x"+id,sets:st2(n,d),...(ss?{ss}:{})});
  ev("S.customEx=[{id:'xa',n:'Squat',g:'Bacak',inc:2.5},{id:'xb',n:'Bench',g:'Göğüs',inc:2.5},{id:'xc',n:'Row',g:'Sırt',inc:2.5}]");
  const nt=(ex,ei)=>ev(`gNextTx(${wk(ex)},${ei})`);
  ok("rest text: sets left on the same exercise name that exercise",nt([E("a",3,1),E("b",3,0)],0)==="Sıradaki: Squat");
  ok("rest text: the last set of an exercise names the next exercise, not the one just done",nt([E("a",3,3),E("b",3,0)],0)==="Sıradaki: Bench");
  ok("rest text: the end of a superset round goes back to its first exercise",nt([E("a",3,2,7),E("b",3,2,7),E("c",3,0)],1)==="Sıradaki: Squat");
  ok("rest text: a skipped earlier exercise is found after the later ones are done",nt([E("a",3,1),E("b",3,3)],1)==="Sıradaki: Squat");
  ok("rest text: everything done says so",/antrenmanı bitirebilirsin/.test(nt([E("a",2,2),E("b",1,1)],1)));
  const body=[];w.Capacitor.Plugins.LocalNotifications.schedule=async x=>{body.push(...x.notifications)};
  ev("gRestSet(Date.now()+60000,'Sıradaki: Bench')");await flush();await flush();
  ev("gRestSet(Date.now()+90000)");await flush();await flush();
  ok("rest notification: the +30 s buttons keep the same line and the tap target is Salon",body.length===2&&body.every(n=>n.id===9002&&n.body==="Sıradaki: Bench"&&n.extra.tab==="gym"),body);
  finish();
})();
