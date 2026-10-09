"use strict";
/* Geçmiş: gün gün özet dizini, ay özeti ve arama (DOM yok). Veriyi değiştirmez; hiçbir kaydı kırpmaz. */
const HistoryLib=(()=>{
  const norm=s=>String(s==null?"":s).toLocaleLowerCase("tr").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ö/g,"o").replace(/ü/g,"u");
  /* Gün -> {yemek,kcal,su,spor,kilo,adim,not,wo,uyku,ruh,tans,seker,nabiz,hr,ilac,oruc,olcu}. Tek geçiş. dk: ms -> gün anahtarı. */
  function index(S,dk){
    const m=new Map(),get=d=>{let o=m.get(d);if(!o)m.set(d,o={});return o},add=(d,k,v)=>{const o=get(d);o[k]=(o[k]||0)+v};
    const ctx={add,get,dk};for(const f of Data.hist)f(S,ctx);
    return m;
  }
  const MARKS=[["food","food"],["water","water"],["exercise","exercise"],["weight","weight"]];
  /* Takvim hücresinde görünen ana türler; kalan veriler "diğer" sayılır. */
  function marks(o){
    if(!o)return {main:[],other:false};
    const main=MARKS.filter(([k,t])=>(k==="exercise"?o.exercise>0||o.wo>0:k==="water"?o.water>0:k==="weight"?o.weight!=null:o[k]>0)).map(x=>x[1]);
    const other=["steps","drink","note","sleep","mood","bp","glucose","pulse","hr","meds","measures","fast"].some(k=>o[k]!=null&&o[k]!==0);
    return {main,other};
  }
  /* Ay özeti (ym: "2026-10"). Ortalamalar yalnız o veriyi girdiğin günler üzerinden. */
  function month(idx,ym){
    let days=0,kd=0,kcal=0,sd=0,water=0,exercise=0,sn=0,sa=0,steps=0,wo=0,first=null,last=null,fk=null,lk=null;
    for(const [d,o] of idx){
      if(d.slice(0,7)!==ym)continue;
      days++;
      if(o.kcal>=800){kd++;kcal+=o.kcal} // eksik günlük (800 altı) ortalamayı düşürmesin: Haftalık rapordaki kuralla aynı
      if(o.water>0){sd++;water+=o.water}
      exercise+=o.exercise||0;wo+=o.wo||0;
      if(o.steps>0){sn++;steps+=o.steps}
      if(o.weight!=null&&(fk==null||d<fk)){fk=d;first=o.weight}
      if(o.weight!=null&&(lk==null||d>lk)){lk=d;last=o.weight}
    }
    return {ym,days,kcalAvg:kd?Math.round(kcal/kd):null,waterAvg:sd?Math.round(water/sd):null,exercise,wo,stepsAvg:sn?Math.round(steps/sn):null,
      weightFirst:first,weightLast:last,weightN:fk&&lk&&fk!==lk?2:fk?1:0};
  }
  /* Kaydı olan aylar, yeniden eskiye. */
  function months(idx){
    const s=new Set();for(const d of idx.keys())s.add(d.slice(0,7));
    return [...s].sort().reverse().map(ym=>month(idx,ym));
  }
  /* Yemek, not, spor ve antrenman adında arama: büyük/küçük harf ve Türkçe harf farkı gözetmez. */
  function search(S,q,max=300,wname){
    const n=norm(q).trim();if(n.length<2)return {items:[],total:0,days:0};
    const out=[];
    const ctx={n,norm,out,wname};for(const f of Data.histSearch)f(S,ctx);
    out.sort((a,b)=>a.day<b.day?1:a.day>b.day?-1:(b.time||"").localeCompare(a.time||""));
    return {items:out.slice(0,max),total:out.length,days:new Set(out.map(x=>x.day)).size};
  }
  /* İlk ve son kayıt günü: takvim yıl seçicisi ve "en eski" sınırı. */
  function span(idx){let a=null,b=null;for(const d of idx.keys()){if(a==null||d<a)a=d;if(b==null||d>b)b=d}return {first:a,last:b}}
  return {index,marks,month,months,search,span,norm};
})();
if(typeof module!=="undefined"){
  module.exports=HistoryLib;
  if(typeof Data==="undefined"){globalThis.Data=require("../../kernel/kernel.js").Data;for(const m of ["log","gym","vitals","habits","meds","pulse","measures"])require("../"+m+"/index.js")} // Node testleri
}
