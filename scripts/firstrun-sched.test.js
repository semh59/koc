/* First run: nothing is scheduled (and no permission asked) before the intro; finishing or skipping it schedules the default reminders (smoke.sh relies on >= 100). */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const sched=[];
  const w=await boot(w=>{
    w.Capacitor={isNativePlatform:()=>true,Plugins:{
      LocalNotifications:{checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),registerActionTypes:async()=>{},cancel:async()=>{},schedule:async x=>{sched.push(...x.notifications)}},
      MedWake:{log:async()=>({items:[],state:{}}),set:async()=>{},fsi:async()=>({allowed:true})}}};
  });
  await new Promise(r=>setTimeout(r,200));
  ok("fresh install: the intro is showing and nothing is scheduled before it",w.eval("obNeeded()")&&sched.length===0);
  w.document.querySelector('[data-ob="skip"]').click();
  await new Promise(r=>setTimeout(r,300));
  const by={};for(const n of sched)by[Math.floor(n.id/100)]=(by[Math.floor(n.id/100)]||0)+1;
  ok("skipping the intro schedules at least 100 default reminders (water 2-4, meals 5, evening 6, weekly tartı 1, backup/summary)",sched.length>=100&&[2,3,4,5,6].every(k=>by[k]===30),by);
  finish();
})();
