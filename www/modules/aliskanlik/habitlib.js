const HabitLib=(()=>{
  const PLANS=[14,16,18,20],H72=72*36e5;
  const dayOk=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+"T00:00Z").toJSON()?.slice(0,10)===s;
  const int=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
  const arr=a=>Array.isArray(a)?a:[];
  const perDay=(a,ok)=>{const m=new Map();for(const x of arr(a)){if(x&&dayOk(x.day)){const y=ok(x);if(y)m.set(y.day,y)}}return [...m.values()].sort((a,b)=>a.day<b.day?-1:1).slice(-20000)};
  function cleanFast(r){
    r=r&&typeof r==="object"?r:{};
    const log=arr(r.log).filter(x=>x&&Number.isFinite(x.t0)&&Number.isFinite(x.t1)&&x.t1>x.t0&&x.t1-x.t0<=H72).map(x=>({t0:x.t0,t1:x.t1})).slice(-5000);
    return {plan:PLANS.includes(r.plan)?r.plan:16,t0:Number.isFinite(r.t0)&&r.t0>0?r.t0:null,log};
  }
  const cleanSleep=a=>perDay(a,x=>{
    const min=Number.isFinite(x.min)?Math.round(x.min):0;if(!int(min,60,1080))return null;
    const o={day:x.day,min};if(int(x.q,1,5))o.q=x.q;if(x.src==="hc")o.src="hc";return o;
  });
  const cleanMood=a=>perDay(a,x=>{
    if(!int(x.v,1,5))return null;
    const o={day:x.day,v:x.v};if(typeof x.t==="string"&&x.t.trim())o.t=x.t.trim().slice(0,100);return o;
  });
  const hm=s=>{const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);return m?+m[1]*60+ +m[2]:null};
  function sleepMin(bed,wake){
    const a=hm(bed),b=hm(wake);if(a==null||b==null||a===b)return null;
    const m=(b-a+1440)%1440;return m>=60&&m<=1080?m:null;
  }
  function fastState(f,now){
    if(!f||!Number.isFinite(f.t0)||!PLANS.includes(f.plan))return null;
    const elapsed=Math.max(0,Math.floor((now-f.t0)/6e4)),left=Math.max(0,f.plan*60-elapsed);
    return {elapsed,left,done:left===0};
  }
  /* cleanFast 72 saati aşanı attığı için süre tavanda kırpılır (sessizce kaybolmasın); 1 dakikadan kısa, gelecekte başlamış ya da saati geri alınmış oruç geçmişe yazılmaz. */
  function endFast(f,now){
    const t1=Math.min(now,f.t0+H72),min=Math.floor((t1-f.t0)/6e4),log=min>=1?f.log.concat({t0:f.t0,t1}):f.log;
    return {fast:cleanFast({...f,t0:null,log}),min:Math.max(0,min),capped:now>f.t0+H72};
  }
  return {PLANS,cleanFast,cleanSleep,cleanMood,sleepMin,fastState,endFast};
})();
if(typeof module!=="undefined")module.exports=HabitLib;
