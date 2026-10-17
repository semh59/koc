"use strict";
Data.privacy.push(["İlaç",()=>S.meds.length+S.medLog.length,()=>chain(nativeWipe(["MedWake"]),ok=>{if(!ok)return toast(NATIVE_FAIL),false;S.meds=[];S.medLog=[];Object.assign(S.settings,{ramMeds:{},ramMedsRef:{},medNear:""})}),4,"yakınının numarası ve Ramazan saat kaydırmaları da silinir"]);
const medDoseText=typeof MedLib!=="undefined"?MedLib.doseText:require("./medlib.js").doseText;
Data.csv.push(["ilac","İlaç alımı",()=>["tarih","saat","ilaç","doz","durum","alım_saati"],({S,by,day})=>{
  const meds=new Map(S.meds.map(m=>[m.id,m]));
  return by(S.medLog,day,x=>x.slot).map(r=>{const m=meds.get(r.m)||{};return [r.day,r.slot,m.n,m.n&&medDoseText(m,r.slot,r.day),r.st==="t"?"alındı":"atlandı",r.at]});
},7]);
Data.hist.push((S,{add})=>{for(const x of S.medLog)if(x.st==="t")add(x.day,"meds",1)});
Data.dayRows.push([6,k=>{const ml=S.medLog.filter(x=>x.day===k);if(!ml.length)return "";const t=ml.filter(x=>x.st==="t").length,s=ml.length-t;return hgRow("meds","İlaç",`${t} alındı${s?`, ${s} atlandı`:""}`)}]);
const Meds={
  count:()=>S.meds.length,bpSince:(day,time)=>MedLib.sinceDose(S.meds,S.medLog,day,time,S.settings.dayStart),meds:()=>S.meds,log:()=>S.medLog,
  snapshot:()=>({log:S.medLog,k:S.meds.map(m=>m.k)}),
  rollback:sn=>{S.medLog=sn.log;S.meds.forEach((m,i)=>{if(m.k!=null)m.k=sn.k[i]})}
};
