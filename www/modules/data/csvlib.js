"use strict";
/* CSV export (no DOM). Made for Turkish Excel: UTF-8 BOM, ; separator (the TR locale uses , as the decimal separator), decimal comma, no thousands separator, ISO dates.
   intl switches to a decimal point and a , separator. Formula injection: a text cell that starts with = + - @ tab or CR gets a leading ' ; numbers are left alone. */
const CsvLib=(()=>{
  const num=(v,intl)=>{if(!Number.isFinite(v))return "";const s=String(Math.round(v*100)/100);return intl?s:s.replace(".",",")};
  const txt=(v,intl)=>{let s=v==null?"":String(v);if(/^[=+\-@\t\r]/.test(s))s="'"+s;return s.includes(intl?",":";")||/["\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};
  const cell=(v,intl)=>typeof v==="number"?num(v,intl):txt(v,intl);
  const csv=(head,rows,intl)=>"\uFEFF"+[head,...rows].map(r=>r.map(c=>cell(c,intl)).join(intl?",":";")).join("\r\n")+"\r\n";
  const fold=typeof foldTr!=="undefined"?foldTr:require("../../kernel/common.js").foldTr;
  /* Sorted copy; each key function gives one level of the ordering. */
  const by=(a,...k)=>a.slice().sort((x,y)=>{for(const f of k){const p=f(x),q=f(y);if(p!==q)return p<q?-1:1}return 0});
  const iso=t=>{const d=new Date(t),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
  /* The files come from the data modules (Data.csv rows: key, label, head(ctx), rows(ctx), order, kind column). h.exName(id): exercise name, h.vctx(r): measurement context (fasting, morning...).
     o.split: a file with a kind column becomes one file per kind (one unit per file); o.intl: decimal point and , separator. */
  function files(S,h,o={}){
    const st=S.settings||{},ctx={S,by,day:x=>x.day,time:x=>x.time||"",conv:typeof Units!=="undefined"?Units:require("../../kernel/unitlib.js"),wu:st.wUnit==="lb"?"lb":"kg",gu:st.gUnit==="mmol"?"mmol":"mgdl",h,iso};
    return Data.csv.slice().sort((x,y)=>x[4]-y[4]).flatMap(([key,label,head,rows,,col])=>{
      const header=head(ctx),body=rows(ctx),one=(k,l,b)=>({key:k,label:l,n:b.length,build:()=>csv(header,b,o.intl)});
      if(!o.split||col==null||!body.length)return [one(key,label,body)];
      return [...Map.groupBy(body,r=>r[col])].map(([kind,b])=>one(`${key}-${fold(kind).replace(/\W+/g,"_")}`,/^[^_]+_/.test(kind)?kind.replace("_",": ").replace(/^./,c=>c.toLocaleUpperCase("tr")):`${label.replace(/ \(.*/,"")}: ${kind}`,b));
    });
  }
  return {cell,csv,files};
})();
if(typeof module!=="undefined"){
  module.exports=CsvLib;
  if(typeof Data==="undefined"){globalThis.Data=require("../../kernel/kernel.js").Data;for(const m of ["log","gym","vitals","nutrition","habits","meds","pulse","measures","motion","labs"])require("../"+m+"/index.js")} // Node tests: the data modules add their own CSV rows
}
