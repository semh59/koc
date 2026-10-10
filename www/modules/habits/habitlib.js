"use strict";
const HabitLib=(()=>{
  const {dayOk}=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const PLANS=[14,16,18,20],H72=72*36e5,MAX_ROWS=20000,MAX_FASTS=5000,SLEEP_LIM=[60,1080],NOTE_MAX=100;
  const int=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
  const arr=a=>Array.isArray(a)?a:[];
  /* One row per day (the last wins), ok(x) returns the cleaned row or null; newest MAX_ROWS days. */
  const perDay=(a,ok)=>{const m=new Map();for(const x of arr(a)){if(x&&dayOk(x.day)){const y=ok(x);if(y)m.set(y.day,y)}}return [...m.values()].sort((a,b)=>a.day<b.day?-1:1).slice(-MAX_ROWS)};
  function cleanFast(r){
    r=r&&typeof r==="object"?r:{};
    const log=arr(r.log).filter(x=>x&&Number.isFinite(x.t0)&&Number.isFinite(x.t1)&&x.t1>x.t0&&x.t1-x.t0<=H72).map(x=>({t0:x.t0,t1:x.t1})).slice(-MAX_FASTS);
    return {plan:PLANS.includes(r.plan)?r.plan:16,t0:Number.isFinite(r.t0)&&r.t0>0?r.t0:null,log};
  }
  const cleanSleep=a=>perDay(a,x=>{
    const min=Number.isFinite(x.min)?Math.round(x.min):0;if(!int(min,...SLEEP_LIM))return null;
    const o={day:x.day,min};if(int(x.q,1,5))o.q=x.q;if(x.src==="hc")o.src="hc";return o;
  });
  const cleanMood=a=>perDay(a,x=>{
    if(!int(x.v,1,5))return null;
    const o={day:x.day,v:x.v};if(typeof x.t==="string"&&x.t.trim())o.t=x.t.trim().slice(0,NOTE_MAX);return o;
  });
  const hm=s=>{const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);return m?+m[1]*60+ +m[2]:null};
  /* Minutes from bedtime to wake time across midnight; null when either time is missing or the span is outside SLEEP_LIM. */
  function sleepMin(bed,wake){
    const a=hm(bed),b=hm(wake);if(a==null||b==null||a===b)return null;
    const m=(b-a+1440)%1440;return m>=SLEEP_LIM[0]&&m<=SLEEP_LIM[1]?m:null;
  }
  function fastState(f,now){
    if(!f||!Number.isFinite(f.t0)||!PLANS.includes(f.plan))return null;
    const elapsed=Math.max(0,Math.floor((now-f.t0)/6e4)),left=Math.max(0,f.plan*60-elapsed);
    return {elapsed,left,done:left===0};
  }
  /* cleanFast drops fasts over 72 h, so the duration is clamped to the cap (it must not vanish silently); a fast shorter than a minute, started in the future
     or after the clock was set back is not written to the history. */
  function endFast(f,now){
    const t1=Math.min(now,f.t0+H72),min=Math.floor((t1-f.t0)/6e4),log=min>=1?f.log.concat({t0:f.t0,t1}):f.log;
    return {fast:cleanFast({...f,t0:null,log}),min:Math.max(0,min),capped:now>f.t0+H72};
  }
  return {PLANS,SLEEP_LIM,NOTE_MAX,cleanFast,cleanSleep,cleanMood,sleepMin,fastState,endFast};
})();
if(typeof module!=="undefined")module.exports=HabitLib;
