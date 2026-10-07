"use strict";
/* Trend > Bağlantılar: iki grup ortalamasını karşılaştıran açıklayıcı örüntüler. Saf: DOM ve S yok. Nedensellik ya da değerlendirme iddiası taşımaz. */
const BaglantiLib=(()=>{
  const dn=k=>Math.round(Date.UTC(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10))/864e5);
  const dk=n=>new Date(n*864e5).toISOString().slice(0,10);
  const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
  const f1=x=>x.toFixed(1).replace(".",",");
  const median=a=>{const s=a.slice().sort((x,y)=>x-y);return (s[(s.length-1)>>1]+s[s.length>>1])/2};
  const AL=()=>typeof Algo!=="undefined"?Algo:require("./algo.js");
  const WIN=60,MIN_PAIRS=14;
  /* pairs [x,y]: x>cut üst grup. İki grupta da en az g çift yoksa null. */
  function split(pairs,cut,g=4){
    const hi=pairs.filter(p=>p[0]>cut).map(p=>p[1]),lo=pairs.filter(p=>p[0]<=cut).map(p=>p[1]);
    return hi.length>=g&&lo.length>=g?{hi:avg(hi),lo:avg(lo),n:pairs.length}:null;
  }
  const moodTxt=(hi,lo,b)=>`ruh halin ortalama ${f1(hi)}, ${b} ${f1(lo)} (5 üzerinden)${Math.abs(hi-lo)<0.2?"; belirgin bir fark görünmüyor":""}.`;
  /* d: {today, sleep:[{day,min}], mood:[{day,v}], steps:{gün:adım}, kcal:{gün:kcal}, weights:{gün:kg}}. */
  function analyze(d){
    const t=dn(d.today),from=t-WIN+1,inWin=k=>{const n=dn(k);return n>=from&&n<=t},out=[];
    const mood={};for(const m of d.mood||[])if(inWin(m.day))mood[m.day]=m.v;
    const sp=[];
    for(const s of d.sleep||[]){const m=mood[dk(dn(s.day)+1)];if(m!=null&&inWin(s.day))sp.push([s.min,m])}
    let r=sp.length>=MIN_PAIRS&&split(sp,419.5);
    if(r)out.push({id:"uyku",n:r.n,text:`7 sa ve üstü uyuduğun gecelerin ertesi günü ${moodTxt(r.hi,r.lo,"daha kısa uyuduğun gecelerin ertesi günü")}`});
    const ap=Object.keys(d.steps||{}).filter(k=>mood[k]!=null&&d.steps[k]>0&&inWin(k)).map(k=>[d.steps[k],mood[k]]);
    if(ap.length>=MIN_PAIRS){
      const med=median(ap.map(p=>p[0]));r=split(ap,med);
      if(r)out.push({id:"adim",n:r.n,text:`Adımının ortancanın (${Math.round(med).toLocaleString("tr-TR")}) üstünde olduğu günlerde ${moodTxt(r.hi,r.lo,"altında olduğu günlerde")}`});
    }
    /* Haftalık bloklar: haftanın ortalama kalorisi ↔ o haftadaki kilo trendi değişimi (tam girilmiş en az 4 gün, iki ucunda tartı). */
    const A=AL(),tr=A.trend(d.weights||{}),wk=Object.keys(tr).sort(),at=n=>{let v=null;for(const k of wk){if(dn(k)<=n)v=tr[k];else break}return v};
    const kp=[];
    for(let e=t;e-6>=from;e-=7){
      const ks=[];for(let i=e-6;i<=e;i++){const v=(d.kcal||{})[dk(i)];if(v!=null&&A.fullKcal(v))ks.push(v)}
      const a=at(e-7),b=at(e);if(ks.length>=4&&a!=null&&b!=null&&wk.some(k=>dn(k)>e-7&&dn(k)<=e))kp.push([avg(ks),b-a]);
    }
    if(kp.length>=4){
      const med=median(kp.map(p=>p[0]));r=split(kp,med,2);
      const sg=x=>(x>0?"+":x<0?"-":"")+f1(Math.abs(x));
      if(r)out.push({id:"kalori",n:kp.length*7,text:`Kalorinin ortancanın (${Math.round(med)} kcal) üstünde olduğu haftalarda kilo trendi haftada ortalama ${sg(r.hi)} kg, altında olduğu haftalarda ${sg(r.lo)} kg değişmiş.`});
    }
    return out;
  }
  return {analyze,split};
})();
if(typeof module!=="undefined")module.exports=BaglantiLib;
