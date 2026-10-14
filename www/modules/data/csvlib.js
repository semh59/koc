"use strict";
/* CSV export (no DOM). Made for Turkish Excel: UTF-8 BOM, ; separator (the TR locale uses , as the decimal separator), decimal comma, no thousands separator, ISO dates.
   Formula injection: a text cell that starts with = + - @ tab or CR gets a leading ' ; numbers are left alone. */
const CsvLib=(()=>{
  const num=v=>Number.isFinite(v)?String(Math.round(v*100)/100).replace(".",","):"";
  const txt=v=>{let s=v==null?"":String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return /[;"\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const cell=v=>typeof v==="number"?num(v):txt(v);
  const csv=(head,rows)=>"\uFEFF"+[head,...rows].map(r=>r.map(cell).join(";")).join("\r\n")+"\r\n";
  /* Sorted copy; each key function gives one level of the ordering. */
  const by=(a,...k)=>a.slice().sort((x,y)=>{for(const f of k){const p=f(x),q=f(y);if(p!==q)return p<q?-1:1}return 0});
  const iso=t=>{const d=new Date(t),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
  /* The files come from the data modules (Data.csv rows: key, label, head(ctx), rows(ctx), order). h.exName(id): exercise name, h.vctx(r): measurement context (fasting, morning...). */
  function files(S,h){
    const st=S.settings||{},ctx={S,by,day:x=>x.day,time:x=>x.time||"",conv:typeof Units!=="undefined"?Units:require("../../kernel/unitlib.js"),wu:st.wUnit==="lb"?"lb":"kg",gu:st.gUnit==="mmol"?"mmol":"mgdl",h,iso};
    return Data.csv.slice().sort((x,y)=>x[4]-y[4]).map(([key,label,head,rows])=>{
      const header=head(ctx),body=rows(ctx);
      return {key,label,n:body.length,build:()=>csv(header,body)};
    });
  }
  return {cell,csv,files};
})();
if(typeof module!=="undefined"){
  module.exports=CsvLib;
  if(typeof Data==="undefined"){globalThis.Data=require("../../kernel/kernel.js").Data;for(const m of ["log","gym","vitals","nutrition","habits","meds","pulse","measures","motion","labs"])require("../"+m+"/index.js")} // Node tests: the data modules add their own CSV rows
}
