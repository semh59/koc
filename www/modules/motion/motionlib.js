"use strict";
/* Automatically detected walk and run intervals: validation and totals (no DOM). The native side computes the intervals; this side only stores them. */
const MotionLib=(()=>{
  const {dayOk,timeOk}=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const MAX_ROWS=20000,MAX_MS=4*3600*1000,CLOCK_SKEW_MS=6e4;
  const LIM={min:[1,240],steps:[150,60000],km:[0,100],kmh:[0,25],kcal:[0,5000]};
  const p2=n=>String(n).padStart(2,"0");
  const dayOf=ms=>{const d=new Date(ms);return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`};
  const hmOf=ms=>{const d=new Date(ms);return `${p2(d.getHours())}:${p2(d.getMinutes())}`};
  const num=(v,[lo,hi])=>typeof v==="number"&&Number.isFinite(v)&&v>=lo&&v<=hi;
  const keyOf=m=>m.day+m.t0+m.k;
  const kind=k=>k==="w"||k==="r";

  /* Native record -> stored record, null when invalid. */
  function fromNative(it,now){
    const span=[1,now+CLOCK_SKEW_MS];
    if(!it||!num(it.t0,span)||!num(it.t1,span)||it.t1<=it.t0||it.t1-it.t0>MAX_MS||!kind(it.k))return null;
    if(!num(it.steps,LIM.steps)||!num(it.km,LIM.km)||!num(it.kmh,LIM.kmh))return null;
    return {day:dayOf(it.t0),t0:hmOf(it.t0),min:Math.max(1,Math.round((it.t1-it.t0)/60000)),k:it.k,steps:Math.round(it.steps),km:Math.round(it.km*100)/100,kmh:Math.round(it.kmh*10)/10,kcal:num(it.kcal,LIM.kcal)?Math.round(it.kcal):null,gps:it.gps===true};
  }

  /* Drops invalid and duplicate (day+time+kind) rows, sorts by day and start time, keeps the newest MAX_ROWS. */
  function clean(raw){
    const out=[],seen=new Set();
    for(const x of Array.isArray(raw)?raw:[]){
      if(!x||!dayOk(x.day)||!timeOk(x.t0)||!kind(x.k)||!num(x.min,LIM.min)||!num(x.steps,LIM.steps)||!num(x.km,LIM.km)||!num(x.kmh,LIM.kmh))continue;
      const key=keyOf(x);if(seen.has(key))continue;seen.add(key);
      out.push({day:x.day,t0:x.t0,min:Math.round(x.min),k:x.k,steps:Math.round(x.steps),km:x.km,kmh:x.kmh,kcal:num(x.kcal,LIM.kcal)?Math.round(x.kcal):null,gps:x.gps===true});
    }
    out.sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.t0<b.t0?-1:a.t0>b.t0?1:0);
    return out.slice(-MAX_ROWS);
  }

  /* Adds new records in place (the same day+time+kind is not added twice) and returns how many were added. */
  function ingest(moves,items,now){
    let n=0;const seen=new Set(moves.map(keyOf));
    for(const it of items){
      const m=fromNative(it,now);if(!m||seen.has(keyOf(m)))continue;
      seen.add(keyOf(m));moves.push(m);n++;
    }
    if(n)moves.splice(0,moves.length,...clean(moves));
    return n;
  }

  function totals(list){
    const t={min:0,km:0,steps:0,kcal:0,kcalN:0};
    for(const m of list){t.min+=m.min;t.km+=m.km;t.steps+=m.steps;if(m.kcal!=null){t.kcal+=m.kcal;t.kcalN++}}
    return t;
  }
  return {fromNative,clean,ingest,totals,dayOf,hmOf};
})();
if(typeof module!=="undefined")module.exports=MotionLib;
