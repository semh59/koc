"use strict";
Data.privacy.push(["Sağlık ölçümleri (tansiyon, şeker)",()=>S.vitals.length,()=>{S.vitals=[]},5]);
Data.csv.push(["saglik","Sağlık ölçümleri (tansiyon, şeker)",({gu})=>["tarih","saat","tür","sistolik","diyastolik","nabız",gu==="mmol"?"şeker_mmoll":"şeker_mgdl","ölçüm_zamanı","not"],({S,by,day,time,conv,wu,gu,h,iso})=>by(S.vitals,day,time).map(r=>[r.day,r.time,r.k==="t"?"tansiyon":"şeker",r.sys,r.dia,r.nabiz,r.g==null?r.g:conv.g(r.g,gu),h.vctx(r),r.not]),2]);
Data.hist.push((S,{add})=>{for(const x of S.vitals||[])add(x.day,x.k==="t"?"tans":"seker",1)});
Data.dayRows.push([3,k=>{const f=(...a)=>a.filter(x=>x!=null&&x!=="").join(" ");
  return S.vitals.filter(x=>x.day===k).sort((a,b)=>a.time<b.time?-1:1).map(x=>hgRow("heart",f(x.time,x.k==="t"?"Tansiyon":"Şeker"),x.k==="t"?`${x.sys}/${x.dia}${x.nabiz?` · nabız ${x.nabiz}`:""}`:`${Units.fg(x.g)} ${Units.gl()}`)).join("")}]);
const Tansiyon={all:()=>S.vitals};
