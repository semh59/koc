"use strict";
Data.privacy.push(["Sağlık ölçümleri (tansiyon, şeker)",()=>S.vitals.length,()=>{S.vitals=[]},5]);
Data.csv.push(["saglik","Sağlık ölçümleri (tansiyon, şeker)",({gu})=>["tarih","saat","tür","sistolik","diyastolik","nabız",gu==="mmol"?"şeker_mmoll":"şeker_mgdl","ölçüm_zamanı","not"],({S,by,day,time,conv,gu,h})=>by(S.vitals,day,time).map(r=>[r.day,r.time,r.k==="t"?"tansiyon":"şeker",r.sys,r.dia,r.pulse,r.g==null?r.g:conv.g(r.g,gu),h.vctx(r),r.note]),2]);
Data.hist.push((S,{add})=>{for(const x of S.vitals)add(x.day,x.k==="t"?"bp":"glucose",1)});
Data.dayRows.push([3,k=>S.vitals.filter(x=>x.day===k).sort((a,b)=>a.time<b.time?-1:1).map(x=>hgRow("heart",`${x.time} ${x.k==="t"?"Tansiyon":"Şeker"}`,x.k==="t"?`${x.sys}/${x.dia}${x.pulse?` · nabız ${x.pulse}`:""}`:`${Units.fg(x.g)} ${Units.gl()}`)).join("")]);
const Vitals={all:()=>S.vitals};
