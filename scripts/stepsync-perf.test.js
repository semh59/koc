/* Syncing a long step history is one pass over the entries, not a search per day. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s);
  ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.stepsFrom='';globalThis.__days=[];
    for(let i=0;i<1800;i++){const d=calOff(-i);__days.push(d);S.entries.push({id:i+1,day:d,time:'00:00',type:'steps',v:1000+i,ph:1000+i,text:''})}
    for(let i=0;i<20000;i++)S.entries.push({id:2000+i,day:calOff(-(i%1800)),time:'12:00',type:'water',v:250,text:''});S.nextId=30000`);
  const ms=ev("(()=>{const t=performance.now(),idx=stepIdx();let n=0;for(const d of __days)if(setSteps(d,5000,idx))n++;globalThis.__n=n;return performance.now()-t})()");
  ok("1800 days of history sync updates every day",ev("__n")===1800,ev("__n"));
  ok("and takes well under a second with 21 800 entries",ms<500,ms.toFixed(0)+" ms");
  finish();
})();
