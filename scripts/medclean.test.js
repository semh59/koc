/* A delivered dose notification is cleared only when its own day's dose (every dose of its minute) is marked. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const unclock=require("./clock").at;

(async()=>{
  const gone=[];let delivered=[];
  const w=await boot(w=>{w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:delivered}),removeDeliveredNotifications:async o=>{gone.push(...o.notifications.map(n=>n.id))},registerActionTypes:async()=>{},cancel:async()=>{},schedule:async()=>{}}}}});
  const ev=s=>w.eval(s),restore=unclock(w,8);
  const run=async(meds,marks,id)=>{
    gone.length=0;delivered=[{id}];
    ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.meds=MedLib.cleanMeds(${JSON.stringify(meds)});S.medLog=[];`);
    for(const [mid,off] of marks)ev(`MedLib.mark(S,${mid},calOff(${off}),'08:00','t','08:00')`);
    await ev("scheduleReminders()");
    return gone.includes(id);
  };
  const A={id:1,n:"A",t:["08:00"],on:true,s:"2026-01-01"},B={id:2,n:"B",t:["08:00"],on:true,s:"2026-01-01"};
  ok("yesterday's 08:00 dose taken, today's not: today's 08:00 notification stays",!(await run([A],[[1,-1]],1001000)));
  ok("today's dose taken: its notification is cleared",await run([A],[[1,0]],1001000));
  ok("two doses in the same minute: one taken, the group notification stays",!(await run([A,B],[[1,0]],1001000)));
  ok("two doses in the same minute: both taken, it is cleared",await run([A,B],[[1,0],[2,0]],1001000));
  restore();
  /* yesterday's unmarked 22:00 dose tapped on Today is stamped with the real time, so the double-dose check sees it */
  const restore7=unclock(w,7);
  ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.meds=MedLib.cleanMeds([{id:1,n:'A',t:['22:00','08:00'],on:true,s:'2026-01-01'}]);S.medLog=[];tab='today';render()`);
  ev("window.__confirmAuto=m=>{globalThis.__asked=(globalThis.__asked||0)+1;return false}");
  ev("medMark(1,'22:00','t',false,calOff(-1))");
  ok("yesterday's dose marked on Today gets the time of the tap",/^\d\d:\d\d$/.test(ev("S.medLog[0].at||''")),ev("JSON.stringify(S.medLog)"));
  ev("medMark(1,'08:00','t',false,calKey())");
  ok("the next dose right after it asks before saving",ev("globalThis.__asked")===1&&ev("S.medLog.length")===1,ev("globalThis.__asked"));
  restore7();
  /* a dose whose time has just come is "Saati geldi"; "Gecikti" and the near-contact button only after 30 minutes */
  const restore8=unclock(w,8);
  ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.settings.medNear='Ali';S.meds=MedLib.cleanMeds([{id:1,n:'A',t:['08:00'],on:true,s:'2026-01-01'}]);S.medLog=[];tab='today';render()`);
  const todo=()=>w.document.querySelector(".todo").textContent;
  ok("dose time just reached: 'Saati geldi', no 'Gecikti', no near-contact button",/Saati geldi/.test(todo())&&!/Gecikti/.test(todo())&&!w.document.querySelector('[data-md="nearsend"]'),todo());
  ev("S.meds=MedLib.cleanMeds([{id:1,n:'A',t:['07:00'],on:true,s:'2026-01-01'}]);render()");
  ok("an hour late: 'Gecikti' with the near-contact button",/Gecikti/.test(todo())&&!!w.document.querySelector('[data-md="nearsend"]'),todo());
  ev("MedLib.mark(S,1,calKey(),'07:00','s');render()");
  ok("a skipped dose is counted as skipped, not as done",/0\/1 alındı, 1 atlandı/.test(todo().replace(/\s+/g," "))||/0\/1 alındı, 1 atlandı/.test(w.document.querySelector(".todo .hint").textContent),w.document.querySelector(".todo")?.textContent);
  restore8();
  finish();
})();
