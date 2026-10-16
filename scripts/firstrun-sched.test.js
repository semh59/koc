/* First run: nothing is scheduled (and no permission asked) before the intro; finishing or skipping it schedules the default reminders (smoke.sh relies on >= 100).
   Three permission states: already granted, never asked (the dialog is shown once and accepted), dialog refused. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function run(mode){
  const sched=[];let asked=0,state=mode==="prompt"?"prompt":mode==="denied"?"denied":"granted";
  const w=await boot(w=>{
    w.Capacitor={isNativePlatform:()=>true,Plugins:{
      LocalNotifications:{checkPermissions:async()=>({display:state}),requestPermissions:async()=>{asked++;state=mode==="prompt"?"granted":"denied";return {display:state}},checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),registerActionTypes:async()=>{},cancel:async()=>{},schedule:async x=>{sched.push(...x.notifications)}},
      MedWake:{log:async()=>({items:[],state:{}}),set:async()=>{},fsi:async()=>({allowed:true})}}};
  });
  await wait(200);
  ok(`${mode}: fresh install shows the intro, nothing scheduled and no dialog before it`,w.eval("obNeeded()")&&sched.length===0&&asked===0);
  w.document.querySelector('[data-ob="skip"]').click();
  await wait(300);
  ok(`${mode}: skipping writes the onboarding flag`,w.eval("S.settings.obDone&&!obNeeded()"));
  const by={};for(const n of sched)by[Math.floor(n.id/100)]=(by[Math.floor(n.id/100)]||0)+1;
  if(mode==="denied")ok("denied: nothing is scheduled, the dialog was shown once",sched.length===0&&asked===1,[sched.length,asked]);
  else ok(`${mode}: at least 100 default reminders (water 2-4, meals 5, evening 6)`,sched.length>=100&&[2,3,4,5,6].every(k=>by[k]>=29)&&asked===(mode==="prompt"?1:0),[sched.length,asked,by]);
}
(async()=>{for(const m of ["granted","prompt","denied"])await run(m);finish()})();
