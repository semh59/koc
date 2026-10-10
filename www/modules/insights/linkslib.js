"use strict";
/* Trend > Bağlantılar: descriptive patterns that compare the averages of two groups. Pure: no DOM, no S. Makes no claim of causation or assessment. */
const LinksLib=(()=>{
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const dn=A.dayNum;
  const dk=n=>new Date(n*864e5).toISOString().slice(0,10);
  const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const f1=x=>x.toFixed(1).replace(".",",");
  const median=a=>{const s=a.slice().sort((x,y)=>x-y);return (s[(s.length-1)>>1]+s[s.length>>1])/2};
  const WIN=60,MIN_PAIRS=14;
  /* pairs [x,y]: x>cut is the upper group. null unless both groups have at least g pairs. */
  function split(pairs,cut,g=4){
    const hi=pairs.filter(p=>p[0]>cut).map(p=>p[1]),lo=pairs.filter(p=>p[0]<=cut).map(p=>p[1]);
    return hi.length>=g&&lo.length>=g?{hi:avg(hi),lo:avg(lo),n:pairs.length}:null;
  }
  const moodTxt=(hi,lo,b)=>`ruh halin ortalama ${f1(hi)}, ${b} ${f1(lo)} (5 üzerinden)${Math.abs(hi-lo)<0.2?"; belirgin bir fark görünmüyor":""}.`;
  /* d: {today, sleep:[{day,min}], mood:[{day,v}], steps:{day:steps}, kcal:{day:kcal}, weights:{day:kg}}. A sleep record sits on the wake-up day, so it pairs with that same day's mood. */
  function analyze(d){
    const t=dn(d.today),from=t-WIN+1,inWin=k=>{const n=dn(k);return n>=from&&n<=t},out=[];
    const mood={};for(const m of d.mood||[])if(inWin(m.day))mood[m.day]=m.v;
    const sp=[];
    for(const s of d.sleep||[]){const m=mood[s.day];if(m!=null&&inWin(s.day))sp.push([s.min,m])}
    let r=sp.length>=MIN_PAIRS&&split(sp,419.5);
    if(r)out.push({id:"sleep",n:r.n,text:`7 sa ve üstü uyuduğun gecelerin ertesi günü ${moodTxt(r.hi,r.lo,"daha kısa uyuduğun gecelerin ertesi günü")}`});
    const ap=Object.keys(d.steps||{}).filter(k=>mood[k]!=null&&d.steps[k]>0&&inWin(k)).map(k=>[d.steps[k],mood[k]]);
    if(ap.length>=MIN_PAIRS){
      const med=median(ap.map(p=>p[0]));r=split(ap,med);
      if(r)out.push({id:"steps",n:r.n,text:`Adımının ortancanın (${Math.round(med).toLocaleString("tr-TR")}) üstünde olduğu günlerde ${moodTxt(r.hi,r.lo,"altında olduğu günlerde")}`});
    }
    /* Weekly blocks: the week's average calories vs the weight-trend change in that week (at least 4 fully logged days, a weigh-in at either end). */
    const tr=A.trend(d.weights||{}),wk=Object.keys(tr).sort(),num=wk.map(dn);
    /* Number of weigh-ins on or before day n (binary search: the weeks below ask 16 times over years of weigh-ins). */
    const upTo=n=>{let lo=0,hi=num.length;while(lo<hi){const m=(lo+hi)>>1;if(num[m]<=n)lo=m+1;else hi=m}return lo},at=n=>{const i=upTo(n);return i?tr[wk[i-1]]:null};
    const kp=[];
    for(let e=t;e-6>=from;e-=7){
      const ks=[];for(let i=e-6;i<=e;i++){const v=(d.kcal||{})[dk(i)];if(v!=null&&A.fullKcal(v))ks.push(v)}
      const a=at(e-7),b=at(e);if(ks.length>=4&&a!=null&&b!=null&&upTo(e)>upTo(e-7))kp.push([avg(ks),b-a]);
    }
    if(kp.length>=4){
      const med=median(kp.map(p=>p[0]));r=split(kp,med,2);
      const sg=x=>(x>0?"+":x<0?"-":"")+f1(Math.abs(x));
      if(r)out.push({id:"calories",n:kp.length*7,text:`Kalorinin ortancanın (${Math.round(med)} kcal) üstünde olduğu haftalarda kilo trendi haftada ortalama ${sg(r.hi)} kg, altında olduğu haftalarda ${sg(r.lo)} kg değişmiş.`});
    }
    return out;
  }
  return {analyze,split};
})();
if(typeof module!=="undefined")module.exports=LinksLib;
