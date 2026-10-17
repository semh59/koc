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

  /* 24: the double-dose question names the medication and the dose time, and its body asks nothing */
  {
    const restore=unclock(w,10);
    reset(`[{id:1,n:'Aspirin',t:['08:00','10:00'],on:true,s:'2026-01-01'}]`,`[{m:1,day:calKey(),slot:'08:00',st:'t',at:'09:48',ad:calKey()}]`);
    ev("tab='today';render();globalThis.__body='';window.__confirmAuto=b=>{globalThis.__body=b;return false};medMark(1,'10:00','t')");
    const b=ev("globalThis.__body");
    ok("double-dose body: name and slot, no question mark",/^Aspirin için 08:00 dozuna \d+ dakika önce "Aldım" kaydı var\./.test(b)&&!b.includes("?"),b);
    ok("double-dose text: from an hour on it says hours",M.recentText({min:125,slot:"06:00"})==='06:00 dozuna 2 saat 5 dakika önce "Aldım" kaydı var. Bu yalnız kendi kayıtlarını karşılaştırır.');
    ev("delete window.__confirmAuto");restore();
  }

  /* 3: the alarm's "Hepsini aldım" covers only doses of the same day and minute */
  {
    let restore=unclock(w,8);
    reset(`[{id:1,n:'A',t:['06:00','08:00'],on:true,s:'2026-01-01'}]`);
    ev("S.settings.medShowName=true;alarmOpen()");
    ok("A at 06:00 and 08:00 open: no 'Hepsini aldım'",ev("alarm.items.length")===2&&!$('#alarm [data-al^="all"]'));
    ev("alarmClose()");
    reset(`[{id:1,n:'A',t:['06:00','08:00'],on:true,s:'2026-01-01'},{id:2,n:'B',t:['08:00'],on:true,s:'2026-01-01'}]`);
    ev("alarmOpen()");click('#alarm [data-al^="all"]');
    ok("A and B at 08:00: the button marks only those two",ev("JSON.stringify(S.medLog.map(x=>x.m+x.slot).sort())")==='["108:00","208:00"]'&&!ev("alarm.items.find(i=>i.slot==='06:00').st"),ev("JSON.stringify(S.medLog)"));
    ev("alarmClose()");restore();
    restore=unclock(w,0);
    reset(`[{id:1,n:'A',t:['23:30'],on:true,s:'2026-01-01'}]`);
    ev("alarmOpen()");
    ok("at midnight yesterday's 23:30 dose says 'dün'",/23:30 · dün/.test($("#albody").textContent)&&/dün/.test($('#alarm [data-al="t:0"]').getAttribute("aria-label")),$("#albody").textContent);
    ev("alarmClose()");restore();
  }

  /* K8: names hidden and two doses in one minute: "Adları göster" opens the names on this screen only */
  {
    const restore=unclock(w,8);
    reset(`[{id:1,n:'Aspirin',t:['08:00'],on:true,s:'2026-01-01'},{id:2,n:'Beta',t:['08:00'],on:true,s:'2026-01-01'}]`);
    ev("S.settings.medShowName=false;alarmOpen()");
    ok("names hidden, two doses at 08:00: 'Adları göster' is offered and no name is on the screen",!!$('#alarm [data-al="names"]')&&!/Aspirin|Beta/.test($("#alarm").innerHTML));
    click('#alarm [data-al="names"]');
    ok("after the tap the rows carry the names, the setting stays off",/Aspirin/.test($("#albody").textContent)&&/Beta/.test($("#albody").textContent)&&ev("S.settings.medShowName")===false&&!$('#alarm [data-al="names"]'));
    ev("alarmClose();alarmOpen()");
    ok("a new alarm screen is hidden again",!/Aspirin|Beta/.test($("#alarm").innerHTML));
    ev("alarmClose()");
    reset(`[{id:1,n:'Aspirin',t:['08:00'],on:true,s:'2026-01-01'}]`);
    ev("S.settings.medShowName=false;alarmOpen()");
    ok("a single dose offers no 'Adları göster'",!$('#alarm [data-al="names"]'));
    ev("alarmClose()");restore();
  }

  /* 27: with names hidden two markings in a row are announced differently (the dose time is said) */
  {
    const restore=unclock(w,8);
    reset(`[{id:1,n:'A',t:['06:00'],on:true,s:'2026-01-01'},{id:2,n:'B',t:['07:30'],on:true,s:'2026-01-01'}]`);
    ev("S.settings.medShowName=false;alarmOpen()");
    click('#alarm [data-al="t:0"]');const s1=$("#allive").textContent;
    click('#alarm [data-al="s:1"]');const s2=$("#allive").textContent;
    ok("names hidden: '06:00 dozu alındı' then '07:30 dozu atlandı'",s1==="06:00 dozu alındı"&&s2==="07:30 dozu atlandı",[s1,s2]);
    ev("alarmClose()");restore();
  }

  /* 9: a marking on the alarm screen can be taken back from the toast after the screen closes */
  {
    const restore=unclock(w,8),calls=native();
    reset(`[{id:1,n:'A',t:['08:00'],on:true,s:'2026-01-01'}]`);
    ev("S.settings.medShowName=true;alarmOpen()");click('#alarm [data-al="s:0"]');
    ok("alarm Atla: recorded, the toast offers 'Geri al'",ev("S.medLog.length")===1&&/08:00 dozu atlandı/.test($("#tmsg").textContent)&&!!$("#toast button"));
    await until(()=>$("#alarm").hidden,3000);
    const n0=calls.filter(c=>c[0]==="LN.schedule").length;
    ev("undoLast()");await until(()=>calls.filter(c=>c[0]==="LN.schedule").length>n0);
    ok("after the screen closed 'Geri al' removes the record and reschedules",ev("S.medLog.length")===0);
    delete w.Capacitor;restore();
  }

  finish();
})();
