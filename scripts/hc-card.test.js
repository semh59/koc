/* The Health Connect card is reachable without the phone step counter; the screen shows the watch value on Today. */
const {ok,finish}=require("./ok");
const {boot,build,flush}=require("./html");
(async()=>{
  const w=await boot(w=>{w.Capacitor={isNativePlatform:()=>true,Plugins:{Health:{status:async()=>({available:true,granted:true,sleep:true,hr:true}),daily:async()=>({sleep:{},hrAvg:{},hrMin:{}}),steps:async o=>({days:Object.fromEntries(o.days.map(d=>[d,4321]))}),request:async()=>({}),manage:async()=>({})}}}},build());
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.stepsOn=false;tab='more';render()");
  ok("More lists the step report row although the phone counter is off",[...w.document.querySelectorAll('#view .prow')].some(b=>b.textContent.includes('Adım raporu')),q('#view').textContent.slice(0,200));
  ev("tab='steps';render()");
  ok("the steps screen offers the watch data switch",!!q('[data-hc="toggle"]'));
  ev("S.settings.hcOn=true;hcAt=0");await ev("hcSync(true)");await flush();
  ev("tab='today';render()");
  ok("with only Health Connect on, Today shows the watch's steps",!!q('[data-tab="steps"].rbtn')&&q('[data-tab="steps"].rbtn').textContent.includes("4.321"),q('[data-tab="steps"].rbtn')?.textContent);
  finish();
})();
