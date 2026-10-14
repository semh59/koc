/* Medication notifications and reports: grouping, phone budget, doctor report medication table, button safety. */
const {ok,finish}=require("./ok");
const M=require("../www/modules/meds/medlib.js");
const {boot}=require("./html");
const mk=(id,n,t=["08:00"],o={})=>({id,n,t,on:true,...o});
const now=new Date(2026,8,14,7,0);

/* Grouping: the same minute is one notification */
const trio=M.cleanMeds([mk(3,"C"),mk(1,"A"),mk(2,"B"),mk(4,"D",["12:00"])]);
const g=M.notifications(trio,[],now,1,true),g0=g.find(n=>n.id===1001000);
ok("group: doses of one minute are one notification with the count and names, the lowest id carries it",g.length===6&&g0.title===M.TITLE&&g0.body==="3 ilaç: A, B, C"&&g0.actionTypeId==="medgrp"&&g0.extra.g==="1_0800,2_0800,3_0800"&&g0.extra.m===1&&g0.extra.s==="08:00",g.map(n=>n.body));
ok("group: repeat reminders are grouped the same way and a lone dose keeps its own button",g.filter(n=>n.id>=2e6).every(n=>n.body==="3 ilaç: A, B, C"||n.body==="D")&&g.find(n=>n.body==="D"&&n.id<2e6).actionTypeId==="med"&&!g.find(n=>n.body==="D").extra.g);
const hid=M.notifications(trio,[],now,1,false).find(n=>n.id===1001000);
ok("group: with the name hidden only the count is written",hid.body==="3 ilaç saati geldi."&&!JSON.stringify(hid).includes('"A"'));
const wd=M.wakeDoses(g.filter(n=>n.id<2e6).map(n=>({id:n.id,extra:n.extra,body:n.body,schedule:{at:n.at}})),trio,true);
ok("group: the alarm screen still gets every dose with its own name",wd.filter(d=>d.at===g0.at.getTime()).map(d=>d.b).join()==="A,B,C"&&wd.length===4);
const part=M.notifications(trio,M.cleanLog([{m:2,day:"2026-09-14",slot:"08:00",st:"t"}],trio),now,1,true).find(n=>n.id===1001000);
ok("group: a logged dose leaves the group, a group of two stays a group",part.body==="2 ilaç: A, C"&&part.extra.g==="1_0800,3_0800");

/* Budget */
const it=(id,at,act)=>({id,schedule:{at:new Date(at)},extra:{act}}),D=864e5,t0=now.getTime();
const med=[...Array.from({length:5},(_,i)=>it(1e6+i,t0+(i+1)*D,"med")),...Array.from({length:4},(_,i)=>it(2e6+i,t0+i*3600e3,"med"))],oth=Array.from({length:3},(_,i)=>it(100+i,t0+i*1000,"water"));
const a=M.fit(med,oth,7,t0);
ok("budget: medication doses first, then the others, repeats are dropped first",a.list.length===7&&a.list.filter(n=>n.id>=1e6&&n.id<2e6).length===5&&a.list.filter(n=>n.id<1e6).length===2&&a.nagCut===4&&a.mainCut===0&&a.list.every((n,i,l)=>!i||l[i-1].schedule.at<=n.schedule.at));
ok("budget: nothing is cut and no text when everything fits",(f=>f.list.length===12&&!f.mainCut&&!f.nagCut&&M.budgetText(f)==="")(M.fit(med,oth,440,t0)));
const b=M.fit(med,oth,3,t0);
ok("budget: when medication itself does not fit the nearest doses stay and the text says how far they reach",b.mainCut===2&&b.list.length===3&&b.days===3&&M.budgetText(b).includes("3 gün")&&M.budgetText(a).includes("tekrar hatırlatmaları"),M.budgetText(b));

(async()=>{
  const sched=[];
  const w=await boot(w=>{w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),registerActionTypes:async()=>{},schedule:async x=>{sched.push(x)}}}}});
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  const setMeds=m=>ev(`S.meds=MedLib.cleanMeds(${JSON.stringify(m)});render()`);
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.settings.medShowName=true;S.medLog=[];tab='today'");
  /* Same four times for 12 medications group into 4 notifications a day: medication fits, only some repeats do not. */
  setMeds(Array.from({length:12},(_,i)=>mk(i+1,"İlaç"+(i+1),["06:00","10:00","14:00","18:00"])));
  await ev("scheduleReminders()");
  let l=sched.pop().notifications;
  ok("schedule: 12 medications at the same times need 4 alarms a day; only the repeats are cut and the user is told",l.length===440&&(c=>c>=116&&c<=120)(l.filter(n=>n.id>=1e6&&n.id<2e6).length)&&l.some(n=>n.id>=2e6)&&q("#view").textContent.includes("bazı tekrar hatırlatmaları kurulmadı"),l.length);
  /* Distinct minutes: 1440 doses in 30 days, far over the budget. */
  setMeds(Array.from({length:12},(_,i)=>mk(i+1,"İlaç"+(i+1),["06","10","14","18"].map(h=>`${h}:${String(i*4).padStart(2,"0")}`))));
  await ev("scheduleReminders()");
  l=sched.pop().notifications;
  ok("schedule: at most 440 alarms, medication doses first, no repeats left, no water reminders",l.length===440&&l.every(n=>n.id>=1e6&&n.id<2e6),l.length);
  ok("schedule: the user sees a warning on Today when the phone limit cuts medication reminders",q("#view").textContent.includes("İlaç hatırlatmaların sınırlı")&&q("#view").textContent.includes("gün ilerisine kadar"));
  setMeds([mk(1,"Tek")]);
  await ev("scheduleReminders()");
  ok("schedule: the warning goes away when everything fits",!q("#view").textContent.includes("İlaç hatırlatmaların sınırlı"));
  finish();
})();
