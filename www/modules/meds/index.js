"use strict";
Data.privacy.push(["İlaç",()=>S.meds.length+S.medLog.length,()=>{S.meds=[];S.medLog=[]},4]);
Data.csv.push(["ilac","İlaç alımı",()=>["tarih","saat","ilaç","doz","durum","alım_saati"],({S,by,day})=>{
  const meds=new Map(S.meds.map(m=>[m.id,m]));
  return by(S.medLog,day,x=>x.slot).map(r=>{const m=meds.get(r.m)||{};return [r.day,r.slot,m.n,m.d,r.st==="t"?"alındı":"atlandı",r.at]});
},7]);
Data.hist.push((S,{add})=>{for(const x of S.medLog)if(x.st==="t")add(x.day,"meds",1)});
Data.dayRows.push([6,k=>{const ml=S.medLog.filter(x=>x.day===k);if(!ml.length)return "";const t=ml.filter(x=>x.st==="t").length,s=ml.length-t;return hgRow("meds","İlaç",`${t} alındı${s?`, ${s} atlandı`:""}`)}]);
const Meds={
  count:()=>S.meds.length,bpSince:(day,time)=>MedLib.sinceDose(S.meds,S.medLog,day,time),meds:()=>S.meds,log:()=>S.medLog,
  snapshot:()=>({log:S.medLog,k:S.meds.map(m=>m.k)}),
  rollback:sn=>{S.medLog=sn.log;S.meds.forEach((m,i)=>{if(m.k!=null)m.k=sn.k[i]})}
};
