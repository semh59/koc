"use strict";
Data.privacy.push(["Sağlık ölçümleri (tansiyon, şeker)",()=>S.vitals.length,()=>{S.vitals=[]},5]);
Data.csv.push(["saglik","Sağlık ölçümleri (tansiyon, şeker)",({gu})=>["tarih","saat","tür","sistolik","diyastolik","nabız",gu==="mmol"?"şeker_mmoll":"şeker_mgdl","ölçüm_zamanı","not"],({S,by,day,time,conv,gu,h})=>by(S.vitals,day,time).map(r=>[r.day,r.time,r.k==="t"?"tansiyon":"şeker",r.sys,r.dia,r.pulse,r.g==null?r.g:conv.g(r.g,gu),h.vctx(r),r.note]),2]);
Data.hist.push((S,{add})=>{for(const x of S.vitals)add(x.day,x.k==="t"?"bp":"glucose",1)});
Data.dayRows.push([3,k=>S.vitals.filter(x=>x.day===k).sort((a,b)=>a.time<b.time?-1:1).map(x=>hgRow("heart",`${x.time} ${x.k==="t"?"Tansiyon":"Şeker"}`,x.k==="t"?`${x.sys}/${x.dia}${x.pulse?` · nabız ${x.pulse}`:""}`:`${Units.fg(x.g)} ${Units.gl()}`)).join("")]);
const Vitals={
  all:()=>S.vitals,pages:(kind,days)=>vPdfPages(kind,days),
  /* Appends checked rows (from a file import) with fresh ids and sids; returns the new ids, or null when the list would pass its limit. */
  addAll:rows=>{
    if(S.vitals.length+rows.length>VitalsLib.MAX_ROWS)return null;
    const id0=Math.max(0,...S.vitals.map(r=>r.id))+1,added=rows.map((r,i)=>({...r,sid:r.sid||VitalsLib.newSid(),id:id0+i}));
    S.vitals=S.vitals.concat(added);return added.map(r=>r.id);
  },
  remove:ids=>{const s=new Set(ids);S.vitals=S.vitals.filter(r=>!s.has(r.id))}
};
