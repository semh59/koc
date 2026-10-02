"use strict";
/* CSV dışa aktarma (DOM yok). Türkçe Excel için: UTF-8 BOM, ; ayırıcı (TR bölgesinde , ondalık ayırıcı olduğundan), ondalık virgül, binlik ayırıcı yok, tarih ISO.
   Formül enjeksiyonu: metin hücresi = + - @ sekme ya da CR ile başlıyorsa başına ' konur; sayılara dokunulmaz. */
const CsvLib=(()=>{
  const num=v=>Number.isFinite(v)?String(Math.round(v*100)/100).replace(".",","):"";
  const txt=v=>{let s=v==null?"":String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[;"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const cell=v=>typeof v==="number"?num(v):txt(v);
  const csv=(head,rows)=>"﻿"+[head,...rows].map(r=>r.map(cell).join(";")).join("\r\n")+"\r\n";
  const by=(a,...k)=>a.slice().sort((x,y)=>{for(const f of k){const p=f(x),q=f(y);if(p!==q)return p<q?-1:1}return 0});
  const UNIT={yemek:"kcal",su:"ml",kilo:"kg",spor:"dk",adim:"adım",not:""};
  const iso=t=>{const d=new Date(t),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
  /* h.exName(id): egzersiz adı, h.vctx(r): ölçüm bağlamı (açlık, sabah...). */
  function files(S,h){
    const day=x=>x.day,time=x=>x.time||"";
    return [
      ["kayitlar","Kayıtlar (yemek, su, kilo, spor, adım, not)",["tarih","saat","tür","değer","birim","açıklama","protein_g","karbonhidrat_g","yağ_g","lif_g","şeker_g","sodyum_mg"],
        by(S.entries,day,time).map(e=>[e.day,e.time,e.type==="adim"?"adım":e.type,e.type==="not"?null:e.v,UNIT[e.type],e.text,e.p,e.c,e.f,e.fb,e.sg,e.na])],
      ["antrenman","Antrenman setleri",["tarih","antrenman","egzersiz","set","kg","tekrar","süre_sn","rpe","ısınma"],
        by(S.workouts,day,x=>x.t0).flatMap(w=>w.ex.flatMap(x=>x.sets.map((s,i)=>s.done&&[w.day,w.name,h.exName(x.id),i+1,s.kg,s.reps,s.sec,s.rpe,s.w?"evet":""]).filter(Boolean)))],
      ["saglik","Sağlık ölçümleri (tansiyon, şeker)",["tarih","saat","tür","sistolik","diyastolik","nabız","şeker_mgdl","ölçüm_zamanı","not"],
        by(S.vitals,day,time).map(r=>[r.day,r.time,r.k==="t"?"tansiyon":"şeker",r.sys,r.dia,r.nabiz,r.g,h.vctx(r),r.not])],
      ["uyku","Uyku",["tarih","süre_dk","süre_saat","kalite_1_5"],S.sleep.map(r=>[r.day,r.min,r.min/60,r.q])],
      ["ruh","Ruh hali",["tarih","ruh_hali_1_5","not"],S.mood.map(r=>[r.day,r.v,r.t])],
      ["oruc","Oruç",["başlangıç","bitiş","süre_saat"],S.fast.log.map(r=>[iso(r.t0),iso(r.t1),(r.t1-r.t0)/36e5])],
      ["ilac","İlaç alımı",["tarih","saat","ilaç","doz","durum","alım_saati"],
        by(S.medLog,day,x=>x.slot).map(r=>{const m=S.meds.find(x=>x.id===r.m)||{};return [r.day,r.slot,m.n,m.d,r.st==="t"?"alındı":"atlandı",r.at]})]
    ].map(([key,label,head,rows])=>({key,label,n:rows.length,build:()=>csv(head,rows)}));
  }
  return {cell,csv,files};
})();
if(typeof module!=="undefined")module.exports=CsvLib;
