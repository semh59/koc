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
  const sched=[];let items=[],tz=-180;
  const w=await boot(w=>{
    w.Capacitor={isNativePlatform:()=>true,Plugins:{
      LocalNotifications:{checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),registerActionTypes:async()=>{},cancel:async()=>{},schedule:async x=>{sched.push(x)}},
      MedWake:{log:async()=>({items,state:{}}),set:async()=>{},fsi:async()=>({allowed:true})}}};
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
  finish();
})();
