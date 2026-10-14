// Ramadan medication shifting: no merged doses, a taken dose follows its slot, a full undo, an imsak drift note with a recalculation.
const {ok,finish}=require("./ok");
const {boot,until,flush,clockAt}=require("./html");
const CLOCK=clockAt("2026-10-06T10:00:00");(0,eval)(CLOCK);
const R=require("../www/modules/habits/ramadanlib.js");
const LAT=39.93,LON=32.86,p2=n=>String(n).padStart(2,"0"),hm=x=>p2(Math.floor(x/60))+":"+p2(x%60);
const local=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`,today=local(new Date());
const seed={settings:{obDone:true,noticeOk:true,heightCm:178,age:40,sex:"m",goalKg:78,kcal:2200,stepsAsked:true,medOn:true,fastInfoOk:true,riskClearedAt:today,
  ramOn:true,ramLat:LAT,ramLon:LON,ramName:"Ankara",ramFrom:today,waterMl:2500},entries:[],
  meds:[{id:1,n:"Antibiyotik",t:["08:00","08:30","21:00"],q:{"08:30":{d:"2 tablet"}},k:30,on:true}]};
const errs=[];
boot(w=>{
  Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.addEventListener("error",e=>errs.push(e.message));
  w.eval(CLOCK);w.localStorage.setItem("nw_state",JSON.stringify(seed));w.confirm=()=>true;
}).then(async w=>{
  const ev=s=>w.eval(s),$=s=>w.document.querySelector(s),json=s=>JSON.stringify(ev(s));
  const tt=R.times(R.tr(Date.now()).day,LAT,LON),im=R.mins(tt[0]);
  const before=json("S.meds[0]"),days0=ev("MedLib.stockDays(S.meds[0])");
  ev("S.medLog=[{id:1,m:1,day:calKey(),slot:'08:00',st:'t',at:'08:01'}]");

  const free=R.medMap(["09:00","10:00","11:00"],tt);
  ok("medMap: doses nearer the same side get different targets, 5 minutes apart",new Set(Object.values(free)).size===3&&Object.values(free).includes(hm(im-30))&&Object.values(free).includes(hm(im-25)),free);
  const crowded=R.medMap([...[30,25,20,15,10,5].map(d=>hm(im-d)),hm(im+30)],tt);
  ok("medMap: a dose that finds no free time before imsak is left out, not merged",!(hm(im+30) in crowded),crowded);

  ev("medRamGo(1)");await until(()=>ev("S.settings.ramMeds[1]"));await flush();
  const t=ev("S.meds[0].t"),map=ev("S.settings.ramMeds[1]");
  ok("two doses on one target both stay: the time count and the stock days are unchanged",t.length===3&&Object.keys(map).length===2&&new Set(Object.values(map)).size===2&&ev("MedLib.stockDays(S.meds[0])")===days0,t);
  ok("the dose taken today moves with its slot: no orphan row, the new slot reads as taken",ev(`MedLib.statusOf(S.medLog,1,calKey(),"${map["08:00"]}")`)==="t"&&ev(`MedLib.statusOf(S.medLog,1,calKey(),"08:00")`)===null&&ev(`MedLib.dosesOn(S.meds,calKey()).some(d=>d.slot==="${map["08:00"]}")`));
  await ev("tab='meds';render()");
  ok("the shift remembers the imsak it was based on",ev("S.settings.ramMedsRef[1]")===tt[0]);

  ev("medRamUndo(1)");await flush();
  ok("undo restores the times, the dose texts, the taken row and drops the record",json("S.meds[0].t")===JSON.stringify(["08:00","08:30","21:00"])&&ev("S.meds[0].q['08:30'].d")==="2 tablet"&&ev(`MedLib.statusOf(S.medLog,1,calKey(),"08:00")`)==="t"&&!ev("S.settings.ramMeds[1]")&&!ev("S.settings.ramMedsRef[1]"));
  ok("undo gives back the same stock days",ev("MedLib.stockDays(S.meds[0])")===days0);

  ev("medRamGo(1)");await until(()=>ev("S.settings.ramMeds[1]"));await flush();
  ev(`S.settings.ramMedsRef[1]="${hm(im-20)}";tab='meds';render()`);
  ok("imsak moved 15+ minutes since the shift: the card says so and offers a recalculation",/İmsak kaydırdığından beri yaklaşık 20 dk geriye gitti/.test($("#view").textContent)&&!!$('[data-md="ramredo:1"]'),$("#view").textContent.slice(0,300));
  ev("medRamRedo(1)");await flush();
  ok("recalculating re-anchors to today's imsak and keeps three distinct times",ev("S.settings.ramMedsRef[1]")===tt[0]&&new Set(ev("S.meds[0].t")).size===3&&ev("Object.keys(S.meds[0].q).length")===1&&ev("Object.values(S.meds[0].q)[0].d")==="2 tablet");
  ok("the page ran without errors",errs.length===0,errs);
  finish();
});
