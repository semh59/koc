"use strict";
/* Geçmiş: gün gün özet dizini, ay özeti ve arama (DOM yok). Veriyi değiştirmez; hiçbir kaydı kırpmaz. */
const HistoryLib=(()=>{
  const isWater=e=>e.type==="su"&&(!e.dr||e.dr==="su"||e.dr==="maden");
  const norm=s=>String(s==null?"":s).toLocaleLowerCase("tr").replace(/ı/g,"i").replace(/ş/g,"s").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ö/g,"o").replace(/ü/g,"u");
  const arr=a=>Array.isArray(a)?a:[];
  /* Gün -> {yemek,kcal,su,spor,kilo,adim,not,wo,uyku,ruh,tans,seker,nabiz,hr,ilac,oruc,olcu}. Tek geçiş. dk: ms -> gün anahtarı. */
  function index(S,dk){
    const m=new Map(),get=d=>{let o=m.get(d);if(!o)m.set(d,o={});return o},add=(d,k,v)=>{const o=get(d);o[k]=(o[k]||0)+v};
    for(const e of arr(S.entries)){
      if(e.type==="yemek"){add(e.day,"yemek",1);if(e.v>0)add(e.day,"kcal",e.v)}
      else if(e.type==="su"){if(isWater(e))add(e.day,"su",e.v||0);else add(e.day,"icecek",1)}
      else if(e.type==="spor")add(e.day,"spor",e.v||0);
      else if(e.type==="kilo")get(e.day).kilo=e.v;
      else if(e.type==="adim")add(e.day,"adim",e.v||0);
      else if(e.type==="not")add(e.day,"not",1);
    }
    for(const w of arr(S.workouts))if(w.t1!=null)add(w.day,"wo",1);
    for(const x of arr(S.sleep))get(x.day).uyku=x.min;
    for(const x of arr(S.mood))get(x.day).ruh=x.v;
    for(const x of arr(S.vitals))add(x.day,x.k==="t"?"tans":"seker",1);
    for(const x of arr(S.pulse))add(x.day,"nabiz",1);
    for(const x of arr(S.hr))get(x.day).hr=x.a;
    for(const x of arr(S.medLog))if(x.st==="t")add(x.day,"ilac",1);
    for(const x of arr(S.measures))add(x.day,"olcu",1);
    if(S.fast)for(const f of arr(S.fast.log))add(dk(new Date(f.t1)),"oruc",1);
    return m;
  }
  const MARKS=[["yemek","yemek"],["su","su"],["spor","spor"],["kilo","kilo"]];
  /* Takvim hücresinde görünen ana türler; kalan veriler "diğer" sayılır. */
  function marks(o){
    if(!o)return {main:[],other:false};
    const main=MARKS.filter(([k,t])=>(k==="spor"?o.spor>0||o.wo>0:k==="su"?o.su>0:k==="kilo"?o.kilo!=null:o[k]>0)).map(x=>x[1]);
    const other=["adim","icecek","not","uyku","ruh","tans","seker","nabiz","hr","ilac","olcu","oruc"].some(k=>o[k]!=null&&o[k]!==0);
    return {main,other};
  }
  /* Ay özeti (ym: "2026-10"). Ortalamalar yalnız o veriyi girdiğin günler üzerinden. */
  function month(idx,ym){
    let days=0,kd=0,kcal=0,sd=0,su=0,spor=0,sn=0,sa=0,adim=0,wo=0,first=null,last=null,fk=null,lk=null;
    for(const [d,o] of idx){
      if(d.slice(0,7)!==ym)continue;
      days++;
      if(o.kcal>=800){kd++;kcal+=o.kcal} // eksik günlük (800 altı) ortalamayı düşürmesin: Haftalık rapordaki kuralla aynı
      if(o.su>0){sd++;su+=o.su}
      spor+=o.spor||0;wo+=o.wo||0;
      if(o.adim>0){sn++;adim+=o.adim}
      if(o.kilo!=null&&(fk==null||d<fk)){fk=d;first=o.kilo}
      if(o.kilo!=null&&(lk==null||d>lk)){lk=d;last=o.kilo}
    }
    return {ym,days,kcalAvg:kd?Math.round(kcal/kd):null,suAvg:sd?Math.round(su/sd):null,spor,wo,adimAvg:sn?Math.round(adim/sn):null,
      kiloFirst:first,kiloLast:last,kiloN:fk&&lk&&fk!==lk?2:fk?1:0};
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
    for(const e of arr(S.entries)){
      if(e.type!=="yemek"&&e.type!=="not"&&e.type!=="spor")continue;
      if(norm(e.text).includes(n))out.push({day:e.day,time:e.time,type:e.type,text:e.text||"",v:e.v,id:e.id});
    }
    for(const w of arr(S.workouts)){
      if(w.t1==null)continue;
      const t=norm(w.name+" "+(wname?wname(w):""));
      if(t.includes(n))out.push({day:w.day,time:"",type:"wo",text:w.name,id:w.id});
    }
    out.sort((a,b)=>a.day<b.day?1:a.day>b.day?-1:(b.time||"").localeCompare(a.time||""));
    return {items:out.slice(0,max),total:out.length,days:new Set(out.map(x=>x.day)).size};
  }
  /* İlk ve son kayıt günü: takvim yıl seçicisi ve "en eski" sınırı. */
  function span(idx){let a=null,b=null;for(const d of idx.keys()){if(a==null||d<a)a=d;if(b==null||d>b)b=d}return {first:a,last:b}}
  return {index,marks,month,months,search,span,norm};
})();
if(typeof module!=="undefined")module.exports=HistoryLib;
