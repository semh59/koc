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
  const sd=(a,m)=>Math.sqrt(a.reduce((s,x)=>s+(x-m)**2,0)/(a.length-1));
  function split(pairs,cut,g=4){
    const hi=pairs.filter(p=>p[0]>cut).map(p=>p[1]),lo=pairs.filter(p=>p[0]<=cut).map(p=>p[1]);
    if(hi.length<g||lo.length<g)return null;
    const m1=avg(hi),m2=avg(lo),s1=sd(hi,m1),s2=sd(lo,m2),pooled=Math.sqrt(((hi.length-1)*s1*s1+(lo.length-1)*s2*s2)/(hi.length+lo.length-2)),se=Math.sqrt(s1*s1/hi.length+s2*s2/lo.length);
    return {hi:m1,lo:m2,n:pairs.length,grade:grade(pooled>0&&se>0?(m1-m2)/pooled:0,se>0?(m1-m2)/se:0,Math.min(hi.length,lo.length))};
  }
  /* Welch t and Cohen d: a weak hint needs |d|>=0.5 and |t|>=2; a clear one |d|>=0.8, |t|>=2.8 and six days in each group. Zero spread gives no label. */
  const grade=(d,t,g)=>Math.abs(d)>=0.8&&Math.abs(t)>=2.8&&g>=6?"strong":Math.abs(d)>=0.5&&Math.abs(t)>=2?"weak":null;
  const tag=(r)=>r.grade==="strong"?" (belirgin ipucu)":" (zayıf ipucu, tesadüf olabilir)";
  const moodTxt=(hi,lo,b)=>`ruh halin ortalama ${f1(hi)}, ${b} ${f1(lo)} (5 üzerinden)`;
  /* d: {today, sleep:[{day,min}], mood:[{day,v}], steps:{day:steps}, kcal:{day:kcal}, weights:{day:kg}}. A sleep record sits on the wake-up day, so it pairs with that same day's mood. */
  function analyze(d){
    const t=dn(d.today),from=t-WIN+1,inWin=k=>{const n=dn(k);return n>=from&&n<=t},out=[];
    const mood={};for(const m of d.mood||[])if(inWin(m.day))mood[m.day]=m.v;
    const sp=[];
    for(const s of d.sleep||[]){const m=mood[s.day];if(m!=null&&inWin(s.day))sp.push([s.min,m])}
    let quiet=0;
    const add=(id,r,text)=>{if(r&&r.grade)out.push({id,n:r.n,grade:r.grade,text:`${text}${tag(r)}, ${r.n} günlük kayıttan.`});else if(r)quiet++};
    let r=sp.length>=MIN_PAIRS&&split(sp,419.5);
    add("sleep",r,`7 sa ve üstü uyuduğun gecelerin ertesi günü ${r&&moodTxt(r.hi,r.lo,"daha kısa uyuduğun gecelerin ertesi günü")}`);
    const ap=Object.keys(d.steps||{}).filter(k=>mood[k]!=null&&d.steps[k]>0&&inWin(k)).map(k=>[d.steps[k],mood[k]]);
    if(ap.length>=MIN_PAIRS){
      const med=median(ap.map(p=>p[0]));r=split(ap,med);
      add("steps",r,`Adımının ortancanın (${Math.round(med).toLocaleString("tr-TR")}) üstünde olduğu günlerde ${r&&moodTxt(r.hi,r.lo,"altında olduğu günlerde")}`);
    }
    /* Steps of the day before vs the minutes slept that night (the sleep record sits on the wake-up day). */
    const sn=[];for(const s of d.sleep||[]){const a=(d.steps||{})[dk(dn(s.day)-1)];if(inWin(s.day)&&a>0)sn.push([a,s.min])}
    if(sn.length>=MIN_PAIRS){
      const med=median(sn.map(p=>p[0]));r=split(sn,med);
      add("stepsleep",r,`Önceki gün adımının ortancanın (${Math.round(med).toLocaleString("tr-TR")}) üstünde olduğu gecelerde ortalama uyku ${r&&f1(r.hi/60)} sa, altında olduğu gecelerde ${r&&f1(r.lo/60)} sa`);
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
      if(r){r.n=kp.length*7;add("calories",r,`Kalorinin ortancanın (${Math.round(med)} kcal) üstünde olduğu haftalarda kilo trendi haftada ortalama ${sg(r.hi)} kg, altında olduğu haftalarda ${sg(r.lo)} kg değişmiş`)}
    }
    out.quiet=quiet;
    return out;
  }
  /* The last 28 days side by side, no comparison test: the weight-trend change and the average change of the estimated 1RM (Epley) of the lifts trained in both halves of the window.
     Needs 6 strength sessions, at least 3 such lifts and a weigh-in at both ends; drop sets and warm-ups do not count. Returns the sentence or null. */
  function strength(workouts,isStrength,weights,today){
    const t=dn(today),from=t-27,mid=t-13,days=new Set(),lifts={};
    for(const w of workouts||[]){
      if(w.t1==null)continue;const n=dn(w.day);if(n<from||n>t)continue;
      for(const x of w.ex||[]){
        if(!isStrength(x.id))continue;days.add(w.day);
        const best=Math.max(0,...(x.sets||[]).filter(s=>s.done&&!s.w&&s.t!=="d").map(s=>A.est1RM(s.kg||0,s.reps)));
        if(!best)continue;
        const l=lifts[x.id]||(lifts[x.id]=[0,0]),h=n>=mid?1:0;l[h]=Math.max(l[h],best);
      }
    }
    const ch=Object.values(lifts).filter(l=>l[0]>0&&l[1]>0).map(l=>l[1]/l[0]-1);
    if(days.size<6||ch.length<3)return null;
    const tr=A.trend(weights||{}),ks=Object.keys(tr).sort(),last=(n)=>{let r=null;for(const k of ks){if(dn(k)<=n)r=k;else break}return r};
    const a=last(from),b=last(t);
    if(a==null||b==null||a===b)return null;
    const sg=(x,u)=>(x>0?"+":x<0?"-":"")+(u==="%"?"%":"")+f1(Math.abs(x)).replace(/,0$/,""),kg=tr[b]-tr[a],pc=avg(ch)*100;
    return `Son 4 haftada kilo trendin ${sg(kg)} kg; ${ch.length} ana harekette tahmini 1TM değişimi ortalama ${sg(Math.round(pc),"%")}. İkisi yan yana gösterilir; biri diğerinin nedeni olmayabilir.`;
  }
  return {analyze,split,strength};
})();
if(typeof module!=="undefined")module.exports=LinksLib;
