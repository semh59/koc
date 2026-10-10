// Full-screen medication alarm: pure logic (AlarmLib) and, in jsdom, opening, marking, privacy and snooze.
const {ok,finish}=require("./ok");
const {boot,until,flush}=require("./html");
const A=require("../www/modules/meds/alarmlib.js"),M=require("../www/modules/meds/medlib.js");

{
  const now=new Date(2026,9,7,9,0),meds=M.cleanMeds([{id:1,n:"A",d:"1 tablet",t:["05:30","06:30","08:50","09:04","09:06","20:00"],on:true},{id:2,n:"B",t:["08:59"],on:false}]);
  const d=A.due(meds,[{m:1,day:"2026-10-07",slot:"08:50",st:"t"}],now).map(i=>i.slot);
  ok("due: unmarked doses between [now-3 h, now+5 min]; no disabled medication, no marked dose, sorted",d.join()==="06:30,09:04",d);
  const g=A.due(M.cleanMeds([{id:1,n:"A",t:["23:30"],on:true}]),[],new Date(2026,9,8,0,15));
  ok("due: a dose past midnight comes back with yesterday's day",g.length===1&&g[0].day==="2026-10-07"&&g[0].slot==="23:30",g);
  ok("due: a skipped dose is not shown either",A.due(meds,[{m:1,day:"2026-10-07",slot:"06:30",st:"s"},{m:1,day:"2026-10-07",slot:"08:50",st:"s"},{m:1,day:"2026-10-07",slot:"09:04",st:"t"}],now).length===0);
}
{
  const it=[{m:1,n:"Aspirin",d:"100 mg",slot:"08:00"},{m:2,n:"B",d:"",slot:"08:00"}];
  const on=A.view(it.slice(0,1),true),off=A.view(it,false);
  ok("view: with the name shown, name and dose for a single dose",on.lead==="Aspirin · 100 mg"&&on.rows[0].name==="Aspirin"&&on.count==="",on);
  ok("view: with the name hidden there is no name or dose, only 'İlaç saatin geldi.' and a count",off.lead==="İlaç saatin geldi."&&off.count==="2 doz"&&!JSON.stringify(off).match(/Aspirin|100 mg|"B"/),off);
  ok("view: with no dose 'Tüm dozlar alındı.'",A.view([],true).lead==="Tüm dozlar alındı.");
  ok("allDone: when every row is marked",A.allDone([{st:"t"},{st:"s"}])&&!A.allDone([{st:"t"},{}]));
}
{
  const t=Date.UTC(2026,9,7,6,0),n=A.snoozeNote([{n:"Aspirin"}],false,A.snoozeAt(t));
  ok("snooze: 10 minutes later, a one-time medication channel notification, no buttons, no name when hidden",A.snoozeAt(t)-t===600000&&n.id===7148&&+n.schedule.at===t+600000&&n.channelId==="nw_med"&&!n.actionTypeId&&n.body==="İlaç saatin geldi."&&n.extra.act==="med");
  ok("snooze: with the name shown, the pending medication names",A.snoozeNote([{n:"A"},{n:"B"}],true,t).body==="A, B");
}

// jsdom: opening with alarmOpen(), marking, privacy, snooze
const p2=n=>String(n).padStart(2,"0"),hm=d=>p2(d.getHours())+":"+p2(d.getMinutes());
const now=new Date(),slot=hm(new Date(now-600000)),later=hm(new Date(+now+7200000));
const seed={settings:{obDone:true,heightCm:178,age:35,sex:"m",goalKg:78,kcal:2200,stepsAsked:true,medOn:true},entries:[],meds:[{id:1,n:"Aspirin",d:"100 mg",t:[slot],on:true},{id:2,n:"Gece",t:[later],on:true}]};
const calls=[],errs=[];
const rec=(p,defs)=>new Proxy({},{get:(_,k)=>k==="then"?undefined:k==="addListener"?()=>({remove(){}}):async a=>{calls.push([p+"."+k,a]);const v=defs[k];return typeof v==="function"?v(a):v||{}}});
boot(w=>{
  Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.addEventListener("error",e=>errs.push(e.message));
  w.localStorage.setItem("nw_state",JSON.stringify(seed));
  w.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{
    MedWake:rec("MW",{fsi:{allowed:true}}),
    LocalNotifications:rec("LN",{checkPermissions:{display:"granted"},checkExactNotificationSetting:{exact_alarm:"granted"},getDeliveredNotifications:{notifications:[]},getPending:{notifications:[{id:2001000},{id:7148}]}}),
    App:rec("App",{})}};
}).then(async w=>{
const $=s=>w.document.querySelector(s),ev=s=>w.eval(s),txt=()=>$("#alarm").textContent,n=k=>calls.filter(c=>c[0]===k);
const inert=()=>[...w.document.body.children].some(e=>e.contains($("#view"))&&e.inert===true),click=s=>$(s).dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
  ok("the page opens without errors",errs.length===0,errs);ev("S.settings.medShowName=true;alarmOpen()");
  ok("alarmOpen(): the alarm screen is open, alertdialog, the due dose is there, the next dose is not",$("#alarm")&&!$("#alarm").hidden&&$("#alarm").getAttribute("role")==="alertdialog"&&txt().includes("Aspirin")&&txt().includes("100 mg")&&txt().includes(slot)&&!txt().includes("Gece"),txt&&$("#alarm")&&txt());
  ok("layer: background inert, focus on the title, clock visible",inert()&&w.document.activeElement.id==="alt"&&/^\d\d:\d\d$/.test($("#alarm .alclk").textContent));
  const c0=n("LN.cancel").length,s0=n("LN.schedule").length;
  click('#alarm [data-al="t:0"]');await until(()=>n("LN.schedule").length>s0);
  const log=ev("JSON.stringify(S.medLog)"),saved=JSON.parse(w.localStorage.getItem("nw_state"));
  ok("Aldım: the dose is recorded and saved as taken, the row says 'Alındı'",/"m":1/.test(log)&&/"st":"t"/.test(log)&&saved.medLog.some(x=>x.m===1&&x.slot===slot&&x.st==="t")&&txt().includes("Alındı"),log);
  const last=n("LN.schedule").slice(s0).pop(),sch=last?last[1].notifications:[];
  ok("Aldım: notifications are rescheduled, pending repeats are cancelled (the snooze id is kept), the taken dose is not rescheduled",n("LN.cancel").length>c0&&n("LN.cancel").slice(c0).some(c=>c[1].notifications.some(x=>x.id===2001000)&&!c[1].notifications.some(x=>x.id===7148))&&!sch.some(x=>x.extra&&x.extra.m===1&&+x.schedule.at<=+now+3600000),sch.map(x=>x.id));
  await until(()=>$("#alarm").hidden,3000);
  ok("closes 1.5 s after everything is done",$("#alarm").hidden&&!inert());
  ev("S.medLog=[];S.settings.medShowName=false;alarmOpen()");
  ok("medShowName=false: name and dose are hidden, 'İlaç saatin geldi.' and '1 doz'",!$("#alarm").hidden&&!/Aspirin|100 mg/.test($("#alarm").innerHTML)&&txt().includes("İlaç saatin geldi.")&&txt().includes("1 doz"),txt());
  const t0=Date.now();click('#alarm [data-al="snooze"]');await until(()=>n("MW.snooze").length&&$("#alarm").hidden);
  const sn=n("LN.schedule").pop()[1].notifications[0],mz=n("MW.snooze").pop();
  ok("snooze: a one-time notification 10 minutes later (name hidden) and a screen alarm, the dose is not marked, the screen closes",sn.id===7148&&Math.abs(+new Date(sn.schedule.at)-t0-600000)<5000&&sn.body==="İlaç saatin geldi."&&mz&&mz[1].at===+new Date(sn.schedule.at)&&ev("S.medLog.length")===0&&$("#alarm").hidden);
  ev("S.settings.medShowName=true;alarmOpen()");w.document.dispatchEvent(new w.KeyboardEvent("keydown",{key:"Escape",bubbles:true}));
  ok("Escape and the back key close the alarm screen (the dose is not marked)",$("#alarm").hidden&&ev("S.medLog.length")===0&&(ev("alarmOpen()"),ev("backKey()"))===true&&$("#alarm").hidden);
  ev("S.medLog=[{id:1,m:1,day:dayKey(new Date(Date.now()-600000)),slot:'"+slot+"',st:'t'}];alarmOpen()");
  ok("with no due dose it shows 'Tüm dozlar alındı' and closes",!$("#alarm").hidden&&txt().includes("Tüm dozlar alındı"));
  ok("...and closes after 1.5 s",await until(()=>$("#alarm").hidden,3000));
  ev("S.medLog=[];tab='meds';notifTap({actionId:'tap',notification:{id:1001000,extra:{act:'med',m:1,s:'"+slot+"'}}})");await until(()=>!$("#alarm").hidden);
  ok("tapping a medication notification opens the alarm screen",!$("#alarm").hidden&&txt().includes("Aspirin"));
  click('#alarm [data-al="t:0"]');await flush();
  ok("the live region is persistent and announces the marking",$("#allive").getAttribute("aria-live")==="polite"&&$("#allive").textContent==="Aspirin alındı");
  ev("S.medLog=[]");ev("alarmOpen()");click('#alarm [data-al="open"]');
  ok("Open app: the alarm closes, the home page (Today) opens",$("#alarm").hidden&&ev("tab")==="today");
  ev("S.medLog=[{id:1,m:1,day:dayKey(new Date(Date.now()-600000)),slot:'"+slot+"',st:'t'}];notifTap({actionId:'tap',notification:{id:1001000,extra:{act:'med'}}})");await flush();
  ok("a late tap with no due dose does not open the alarm screen",$("#alarm").hidden);
  finish();
});
