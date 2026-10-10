"use strict";
/* Camera pulse: with a fingertip on the lens and the torch on, the red channel carries the pulse wave and the beat interval is read from it; record cleaning (no DOM).
   Not a medical device and never interprets: no thresholds, labels or colours, it only measures and stores. An unclear measurement gives no number. */
const PulseLib=(()=>{
  const {dayOk,timeOk}=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const LIM=[40,200],HZ=30,SKIP_MS=3000,MIN_MS=15000,MAX_ROWS=20000,HR_LIM=[25,250],MAX_CAMERAS=6,TORCH_WAIT_MS=250;
  const med=a=>{const s=a.slice().sort((x,y)=>x-y),n=s.length;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2};
  const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const byDayTime=(a,b)=>a.day<b.day?-1:a.day>b.day?1:a.time<b.time?-1:a.time>b.time?1:0;

  /* The finger covers the lens and torch: red is high and clearly above green. */
  const finger=(r,g)=>r>=90&&r/(g+1)>=1.5;

  /* Resamples to an even HZ grid: camera frames arrive irregularly. */
  function resample(s){
    const t0=s[0].t,n=Math.floor((s[s.length-1].t-t0)/1000*HZ),out=new Array(n);
    let j=0;
    for(let i=0;i<n;i++){
      const t=t0+i*1000/HZ;
      while(j<s.length-2&&s[j+1].t<t)j++;
      const a=s[j],b=s[j+1],f=b.t>a.t?Math.min(1,Math.max(0,(t-a.t)/(b.t-a.t))):0;
      out[i]=a.r+(b.r-a.r)*f;
    }
    return out;
  }
  /* Subtracts the moving average (slow light drift), then a short moving average (noise); both via prefix sums, O(n). */
  function band(x){
    const n=x.length,pre=[0];for(const v of x)pre.push(pre[pre.length-1]+v);
    const d=x.map((v,i)=>{const a=Math.max(0,i-HZ),b=Math.min(n,i+HZ+1);return v-(pre[b]-pre[a])/(b-a)});
    const pd=[0];for(const v of d)pd.push(pd[pd.length-1]+v);
    return d.map((v,i)=>{const a=Math.max(0,i-2),b=Math.min(n,i+3);return (pd[b]-pd[a])/(b-a)});
  }
  /* Autocorrelation over the 40-200 bpm lags (about 40 lags, so O(n) per call). The strongest peak wins, unless the shortest period reaches 85% of it:
     for a true period T the lag 2T is strong too and would give half the beat rate (octave error). */
  function autocorr(x){
    const n=x.length,m=mean(x),lo=Math.floor(HZ*60/LIM[1]),hi=Math.ceil(HZ*60/LIM[0]);
    const v0=x.reduce((s,a)=>s+(a-m)*(a-m),0);if(!v0)return null;
    const c=[];let best=0;
    for(let lag=lo-1;lag<=hi+1;lag++){
      let s=0;for(let i=0;i+lag<n;i++)s+=(x[i]-m)*(x[i+lag]-m);
      s/=v0*(n-lag)/n;c.push(s);if(lag>=lo&&lag<=hi&&s>best)best=s;
    }
    if(!(best>0))return null;
    for(let lag=lo;lag<=hi;lag++){
      const s=c[lag-lo+1];
      if(s>=0.85*best&&s>=c[lag-lo]&&s>=c[lag-lo+2]){
        const d=c[lag-lo]-2*s+c[lag-lo+2],l=lag+(d?0.5*(c[lag-lo]-c[lag-lo+2])/d:0); // parabola gives a fractional lag: a whole sample at 30 Hz would be off by up to 2.4%
        return {bpm:60*HZ/l,power:s};
      }
    }
    return null;
  }
  /* samples: [{t ms, r, g}] collected while the finger stayed on. Result {ok,bpm,n,dg} or {ok:false,reason,dg}; dg is the technical detail shown on failure. */
  function analyze(samples){
    if(samples.length<60)return {ok:false,reason:"short"};
    const t0=samples[0].t,use=samples.filter(s=>s.t-t0>=SKIP_MS);
    if(use.length<60||use[use.length-1].t-use[0].t<MIN_MS-SKIP_MS)return {ok:false,reason:"short"};
    const mr=mean(use.map(s=>s.r)),mg=mean(use.map(s=>s.g)),dg={fps:Math.round(use.length/((use[use.length-1].t-use[0].t)/1000)),r:Math.round(mr),g:Math.round(mg)};
    const fail=reason=>({ok:false,reason,dg});
    if(!finger(mr,mg))return fail("finger");
    const x=band(resample(use)),n=x.length;
    const sd=Math.sqrt(mean(x.map(v=>v*v)));dg.sd=+sd.toFixed(2);
    if(!(sd>0.05))return fail("flat");
    const minD=Math.floor(HZ*60/LIM[1]),cand=[];
    for(let i=3;i<n-3;i++){let top=true;for(let k=1;k<=3;k++)if(x[i]<=x[i-k]||x[i]<x[i+k]){top=false;break}if(top&&x[i]>0)cand.push(i)}
    cand.sort((a,b)=>x[b]-x[a]);
    const pk=[];for(const i of cand)if(pk.every(p=>Math.abs(p-i)>=minD))pk.push(i);
    pk.sort((a,b)=>a-b);
    /* At 30 Hz a whole-sample peak position rounds visibly at high rates: refine it with a parabola. */
    const pos=pk.map(i=>{const d=x[i-1]-2*x[i]+x[i+1];return i+(d?0.5*(x[i-1]-x[i+1])/d:0)});
    const ibi=[];for(let i=1;i<pos.length;i++)ibi.push((pos[i]-pos[i-1])/HZ);
    const inRange=ibi.filter(v=>v>=60/LIM[1]&&v<=60/LIM[0]);
    dg.pk=pk.length;dg.ibi=inRange.length;
    if(inRange.length<10)return fail("noisy");
    const m=med(inRange),kept=inRange.filter(v=>Math.abs(v-m)<=0.25*m);
    if(kept.length<10||kept.length<0.6*ibi.length)return fail("noisy");
    const mk=mean(kept),cv=Math.sqrt(mean(kept.map(v=>(v-mk)**2)))/mk;
    dg.cv=+cv.toFixed(2);
    if(cv>0.15)return fail("noisy");
    const peakBpm=60/mk,ac=autocorr(x);
    if(ac){dg.ac=+ac.power.toFixed(2);dg.acb=Math.round(ac.bpm)}
    /* Very regular beats lower the power threshold to 0.15 (at about 17 fps on some phones the autocorrelation power drops to 0.2); it must still agree with the peak count. */
    const regular=cv<=0.10&&kept.length>=20&&kept.length>=0.85*ibi.length;
    const agree=!!ac&&Math.abs(ac.bpm-peakBpm)/peakBpm<=0.12;
    if(!agree||ac.power<(regular?0.15:0.3))return fail("noisy");
    /* The number comes from the autocorrelation: averaging peak intervals drifted upward on noise peaks (7x more error in a synthetic test); peaks only check regularity. */
    const r=Math.round(ac.bpm);
    return r>=LIM[0]&&r<=LIM[1]?{ok:true,bpm:r,n:kept.length+1,dg}:fail("noisy");
  }

  /* Camera readings {day,time,bpm}: drops invalid and duplicate rows, sorts by date, keeps the newest MAX_ROWS, assigns ids. */
  function clean(arr){
    const out=[],seen=new Set();
    for(const x of Array.isArray(arr)?arr:[]){
      if(!x||!dayOk(x.day)||!timeOk(x.time)||!Number.isFinite(x.bpm)||x.bpm<LIM[0]||x.bpm>LIM[1])continue;
      const bpm=Math.round(x.bpm),k=x.day+"|"+x.time+"|"+bpm;if(seen.has(k))continue;seen.add(k);
      out.push({day:x.day,time:x.time,bpm});
    }
    return out.sort(byDayTime).slice(-MAX_ROWS).map((x,i)=>({id:i+1,...x}));
  }
  /* Daily heart rate from the watch {day,a average,m lowest}: one row per day (the last wins), newest MAX_ROWS days. */
  function cleanHr(arr){
    const m=new Map(),ok=v=>Number.isFinite(v)&&v>=HR_LIM[0]&&v<=HR_LIM[1];
    for(const x of Array.isArray(arr)?arr:[]){
      if(!x||!dayOk(x.day)||!ok(x.a))continue;
      const o={day:x.day,a:Math.round(x.a)};if(ok(x.m))o.m=Math.round(x.m);
      m.set(x.day,o);
    }
    return [...m.values()].sort((a,b)=>a.day<b.day?-1:1).slice(-MAX_ROWS);
  }
  /* Finds a rear camera with a torch. Phones with several rear cameras (wide, ultra-wide, tele) often have no torch on the default one; it sits on the main camera only.
     md: navigator.mediaDevices; base: video constraints. Returns {stream, track, tried, noTorch}; noTorch means no camera showed a torch capability (the default camera comes back open). */
  async function pickTorchCamera(md,base){
    const has=t=>{try{return !!t.getCapabilities?.().torch}catch(e){return false}};
    const open=extra=>md.getUserMedia({video:{...base,...extra},audio:false});
    const stop=s=>s.getTracks().forEach(t=>{try{t.stop()}catch(e){}});
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    let stream=await open({facingMode:{ideal:"environment"}}),track=stream.getVideoTracks()[0],tried=1;
    if(!has(track))await wait(TORCH_WAIT_MS); // some devices report the capability shortly after the stream starts
    if(has(track))return {stream,track,tried};
    const cur=track.getSettings?.().deviceId;
    let devs=[];
    try{devs=(await md.enumerateDevices()).filter(d=>d.kind==="videoinput"&&d.deviceId&&d.deviceId!==cur&&!/front|user/i.test(d.label||""))}catch(e){}
    stop(stream); // only one camera can be open at a time
    for(const d of devs.slice(0,MAX_CAMERAS)){
      tried++;
      try{
        const s=await open({deviceId:{exact:d.deviceId}}),t=s.getVideoTracks()[0];
        if(!has(t))await wait(TORCH_WAIT_MS);
        if(has(t))return {stream:s,track:t,tried};
        stop(s);
      }catch(e){}
    }
    stream=await open({facingMode:{ideal:"environment"}});
    return {stream,track:stream.getVideoTracks()[0],tried,noTorch:true};
  }
  return {finger,analyze,clean,cleanHr,pickTorchCamera};
})();
if(typeof module!=="undefined")module.exports=PulseLib;
