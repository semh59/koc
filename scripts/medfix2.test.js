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

  /* 26: alarm screen small fixes */
  {
    const restore=unclock(w,8);
    reset(`[{id:1,n:'A',t:['07:00'],on:true,s:'2026-01-01'},{id:2,n:'B',t:['07:30'],on:true,s:'2026-01-01'}]`);
    ev("S.settings.medShowName=true;alarmOpen()");click('#alarm [data-al="s:0"]');click('#alarm [data-al="s:1"]');
    ok("both skipped: the lead says '2 doz işlendi.', never 'alındı'; a skipped row has no check icon",/2 doz işlendi\./.test($("#allead").textContent)&&!/alındı/.test($("#albody").textContent)&&!$("#alarm .alst svg"),$("#albody").textContent);
    const css=require("fs").readFileSync(require("path").join(__dirname,"../www/app.css"),"utf8");
    ok("the alarm buttons are at least 16 px apart and the lead is in --ink",/#alarm \.albar\{[^}]*gap:var\(--sp-4\)/.test(css)&&/#alarm \.allead\{[^}]*color:var\(--ink\)/.test(css));
    ev("alarmClose()");restore();
  }

  /* 8: the lock-screen alarm also gets the open doses of the last 3 hours, but never one still waiting in the button queue */
  {
    const restore=unclock(w,8);
    reset(`[{id:1,n:'A',t:['08:00'],on:true,s:'2026-01-01'},{id:2,n:'B',t:['08:00'],on:true,s:'2026-01-01'},{id:3,n:'C',t:['06:30'],on:true,s:'2026-01-01'}]`);
    let calls=native();
    ev("medMark(1,'08:00','t')");await until(()=>calls.last("MW.set"));
    const d=calls.last("MW.set").doses,past=d.filter(x=>x.at<=Date.now());
    ok("after A is marked in the app, B's 08:00 and C's 06:30 stay in the phone's list with their notification ids, A does not",past.some(x=>x.m===2&&x.s==="08:00"&&x.nid===M.doseNid({id:2,t:["08:00"]},"08:00",true))&&past.some(x=>x.m===3&&x.s==="06:30")&&!past.some(x=>x.m===1),past);
    ok("the list is sorted by time",d.every((x,i)=>!i||d[i-1].at<=x.at));
    reset(`[{id:1,n:'A',t:['08:00'],on:true,s:'2026-01-01'}]`);
    calls=native({QuickLog:{take:{items:[{m:1,s:"08:00",t:Date.now(),z:-new Date().getTimezoneOffset(),k:false}]},getToken:{tk:null}}});
    await ev("scheduleReminders()");
    ok("a dose waiting in the queue (m1_0800) is ingested first and not sent back as open",ev("MedLib.statusOf(S.medLog,1,calKey(),'08:00')")==="t"&&!calls.last("MW.set").doses.some(x=>x.at<=Date.now()),calls.last("MW.set").doses);
    delete w.Capacitor;restore();
  }

  /* 11: notification taps say "alındı" or "atlandı", can be taken back, and the double-dose guard runs on them too */
  {
    const restore=unclock(w,10),z=-new Date().getTimezoneOffset();
    reset(`[{id:1,n:'A',t:['08:00','09:30'],on:true,s:'2026-01-01'}]`);
    w.Capacitor={Plugins:{QuickLog:{take:async()=>({items:[{m:1,s:"08:00",t:Date.now()-60000,z,k:true}]})}}};
    await ev("quickIngest()");
    ok("a 'Atla' from the notification says 'atlandı', not 'kaydedildi'",/A \(08:00\) atlandı/.test($("#tmsg").textContent)&&!/kaydedildi/.test($("#tmsg").textContent),$("#tmsg").textContent);
    ev("undoLast()");
    ok("its 'Geri al' removes the medication record",ev("S.medLog.length")===0);
    w.Capacitor={Plugins:{QuickLog:{take:async()=>({items:[{m:1,s:"08:00",t:Date.now()-15*60000,z},{m:1,s:"09:30",t:Date.now()-5*60000,z}]})}}};
    await ev("quickIngest()");
    ok("08:00 and 09:30 'Aldım' 10 minutes apart: both recorded, the toast names the earlier dose and the minutes",ev("S.medLog.length")===2&&/A için 08:00 dozuna 10 dakika önce "Aldım" kaydı var/.test($("#tmsg").textContent),$("#tmsg").textContent);
    delete w.Capacitor;restore();
  }

  /* 5: notifications off alone gets its own row on Today */
  {
    reset(`[{id:1,n:'A',t:['23:59'],on:true}]`);native();
    const row=()=>/Bildirimler kapalı: ilaç hatırlatması gelmez/.test($("#view").textContent),common=()=>/İzinler eksik/.test($("#view").textContent);
    ev("pmNotif=false;exactOk=true;tab='today';render()");
    ok("only the notification permission off: its row shows with 'İzin ver'",row()&&!common()&&!!$('#view [data-pm="go:notif"]'));
    ev("pmNotif=true;render()");
    ok("permission given: the row goes",!row());
    ev("pmNotif=false;exactOk=false;render()");
    ok("two permissions missing: only the common row",common()&&!row());
    ev("pmNotif=null;exactOk=true");delete w.Capacitor;
  }

  /* 41: a snooze from the lock screen rings once on the medication channel (source check: no Android runtime here) */
  {
    const rd=f=>require("fs").readFileSync(require("path").join(__dirname,"../assets/android",f),"utf8"),aa=rd("AlarmActivity.java"),mw=rd("MedWakeReceiver.java"),mp=rd("MedWakePlugin.java");
    ok("lock-screen snooze: flagged in AlarmActivity, rung by the receiver on the medication channel with the app's snooze id, cleared by the app's own snooze",
      /snoozeAt\(this, [^;]+\);\s*MedWakeReceiver\.snoozeNote\(this, true\)/.test(aa)&&/if \(note\) snoozeNotify\(c\)/.test(mw)&&/new Notification\.Builder\(c, medId\(c\)\)/.test(mw)&&new RegExp("SNOOZE_NID = "+ev("AlarmLib.SNOOZE_NID")+";").test(mw)&&/snoozeNote\(getContext\(\), false\)/.test(mp));
  }

  finish();
})();
