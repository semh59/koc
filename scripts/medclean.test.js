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
  finish();
})();
