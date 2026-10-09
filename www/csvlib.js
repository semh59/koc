"use strict";
/* CSV dışa aktarma (DOM yok). Türkçe Excel için: UTF-8 BOM, ; ayırıcı (TR bölgesinde , ondalık ayırıcı olduğundan), ondalık virgül, binlik ayırıcı yok, tarih ISO.
   Formül enjeksiyonu: metin hücresi = + - @ sekme ya da CR ile başlıyorsa başına ' konur; sayılara dokunulmaz. */
const CsvLib=(()=>{
  const num=v=>Number.isFinite(v)?String(Math.round(v*100)/100).replace(".",","):"";
  const txt=v=>{let s=v==null?"":String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[;"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const cell=v=>typeof v==="number"?num(v):txt(v);
  const csv=(head,rows)=>"﻿"+[head,...rows].map(r=>r.map(cell).join(";")).join("\r\n")+"\r\n";
  const by=(a,...k)=>a.slice().sort((x,y)=>{for(const f of k){const p=f(x),q=f(y);if(p!==q)return p<q?-1:1}return 0});
  const iso=t=>{const d=new Date(t),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
  /* h.exName(id): egzersiz adı, h.vctx(r): ölçüm bağlamı (açlık, sabah...). */
  function files(S,h){
    const day=x=>x.day,time=x=>x.time||"",st=S.settings||{},wu=st.wUnit==="lb"?"lb":"kg",gu=st.gUnit==="mmol"?"mmol":"mgdl",
      conv=typeof Units!=="undefined"?Units:require("./unitlib.js");
    const ctx={S,by,day,time,conv,wu,gu,h,iso};
    return Data.csv.slice().sort((x,y)=>x[4]-y[4]).map(([key,label,head,rows])=>[key,label,head(ctx),rows(ctx)]).map(([key,label,head,rows])=>({key,label,n:rows.length,build:()=>csv(head,rows)}));
  }
  return {cell,csv,files};
})();
if(typeof module!=="undefined"){
  module.exports=CsvLib;
  if(typeof Data==="undefined"){globalThis.Data=require("./kernel.js").Data;for(const m of ["kayit","salon","tansiyon","besin","aliskanlik","ilac","nabiz","olcu"])require("./modules/"+m+".js")} // Node testleri: veri modülleri CSV satırlarını kendileri ekler
}
