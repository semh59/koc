"use strict";
Data.privacy.push(["İlaç",()=>S.meds.length+S.medLog.length,()=>{S.meds=[];S.medLog=[]},4]);
Data.csv.push(["ilac","İlaç alımı",({gu})=>["tarih","saat","ilaç","doz","durum","alım_saati"],({S,by,day,time,conv,wu,gu,h,iso})=>by(S.medLog,day,x=>x.slot).map(r=>{const m=S.meds.find(x=>x.id===r.m)||{};return [r.day,r.slot,m.n,m.d,r.st==="t"?"alındı":"atlandı",r.at]}),7]);
Data.hist.push((S,{add})=>{for(const x of S.medLog||[])if(x.st==="t")add(x.day,"ilac",1)});
Data.dayRows.push([6,k=>{const ml=S.medLog.filter(x=>x.day===k);if(!ml.length)return "";const t=ml.filter(x=>x.st==="t").length,s=ml.length-t;return hgRow("ilac","İlaç",`${t} alındı${s?`, ${s} atlandı`:""}`)}]);
const Ilac={
  count:()=>S.meds.length,meds:()=>S.meds,log:()=>S.medLog,
  snapshot:()=>({log:S.medLog,k:S.meds.map(m=>m.k)}),
  rollback:sn=>{S.medLog=sn.log;S.meds.forEach((m,i)=>{if(m.k!=null)m.k=sn.k[i]})}
};
