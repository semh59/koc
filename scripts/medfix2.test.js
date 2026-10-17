/* Medication alarm and notification fixes: lock-screen names, app lock, the alarm screen, phone-side doses, notification taps, budget, permissions. */
const {ok,finish}=require("./ok");
const {boot,flush,until}=require("./html");
const M=require("../www/modules/meds/medlib.js");
const unclock=require("./clock").at;

(async()=>{
  const w=await boot(),ev=s=>w.eval(s),$=s=>w.document.querySelector(s),click=s=>$(s).click();
  const reset=(meds,log="[]")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.meds=MedLib.cleanMeds(${meds});S.medLog=MedLib.cleanLog(${log},S.meds);tab='meds';render()`);
  /* Fake phone: every plugin call is recorded; defs give the answers. */
  const native=(defs={})=>{
    const calls=[],rec=(p,d)=>new Proxy({},{get:(_,k)=>k==="then"?undefined:async a=>{calls.push([p+"."+k,a]);const v=d[k];return typeof v==="function"?v(a):v||{}}});
    w.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{MedWake:rec("MW",{fsi:{allowed:true},...defs.MW}),
      LocalNotifications:rec("LN",{checkPermissions:{display:"granted"},requestPermissions:{display:"granted"},checkExactNotificationSetting:{exact_alarm:"granted"},getDeliveredNotifications:{notifications:[]},getPending:{notifications:[]},...defs.LN}),
      ...(defs.QuickLog&&{QuickLog:rec("QL",defs.QuickLog)})}};
    calls.last=k=>calls.filter(c=>c[0]===k).pop()?.[1];
    return calls;
  };

  /* 4 + K9: the lock-screen alarm text names a medication only with lock-screen detail on, and never with the app lock on */
  {
    const restore=unclock(w,7);
    reset(`[{id:1,n:'Aspirin',d:'100 mg',t:['08:00'],on:true},{id:2,n:'Beta',t:['09:00'],on:true},{id:3,n:'Gama',t:['09:00'],on:true}]`);
    const calls=native(),doses=async st=>{ev(`Object.assign(S.settings,${st})`);await ev("scheduleReminders()");return JSON.stringify(calls.last("MW.set").doses)};
    const off=await doses("{medShowName:true,lockDetail:false,lockOn:false}");
    ok("name on, lock-screen detail off: no name in the alarm screen doses, single or group",/İlaç saatin geldi/.test(off)&&!/Aspirin|100 mg|Beta|Gama/.test(off),off);
    const on=await doses("{lockDetail:true}");
    ok("name on, detail on: single and group doses carry their names",/Aspirin · 100 mg/.test(on)&&/Beta/.test(on)&&/Gama/.test(on),on);
    const lk=await doses("{lockOn:true}");
    ok("app lock on: no name reaches the phone side even with name and detail on",!/Aspirin|Beta|Gama/.test(lk),lk);
    ev("S.settings.lockDetail=false;S.settings.lockOn=false;tab='settings-modules';render()");
    ok("settings label: 'Tüm ilaçlarda', with a link to the lock-screen detail setting while it is off",/Tüm ilaçlarda ad görünsün/.test($("#view").textContent)&&!!$('#view [data-tab="settings-data"].lnk'));
    ev("S.settings.lockDetail=true;render()");
    ok("with detail on the link is gone",!$('#view [data-tab="settings-data"].lnk'));
    delete w.Capacitor;restore();
  }

  finish();
})();
