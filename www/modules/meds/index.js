"use strict";
Data.privacy.push(["İlaç",()=>S.meds.length+S.medLog.length,()=>chain(nativeWipe(["MedWake"]),ok=>{if(!ok)return toast(NATIVE_FAIL),false;S.meds=[];S.medLog=[];Object.assign(S.settings,{ramMeds:{},ramMedsRef:{},medNear:""})}),4,"yakınının numarası ve Ramazan saat kaydırmaları da silinir"]);
const ML=typeof MedLib!=="undefined"?MedLib:require("./medlib.js");
/* Marked doses plus the planned doses of past days that were never marked (from the start day, or the first record, to yesterday). */
Data.csv.push(["ilac","İlaç alımı",()=>["tarih","saat","ilaç","doz","adet","durum","alım_saati"],({S,by})=>{
  const meds=new Map(S.meds.map(m=>[m.id,m])),rec=ML.logIndex(S.medLog),y=ML.addDay(ML.key(new Date()),-1);
  const rows=S.medLog.map(r=>{const m=meds.get(r.m)||{};return [r.day,r.slot,m.n,m.n&&ML.doseText(m,r.slot,r.day),m.n&&ML.amt(m,r.slot,r.day),r.st==="t"?"alındı":"atlandı",r.at]});
  for(const m of S.meds){
    const from=m.s||S.medLog.reduce((a,r)=>r.m===m.id&&(!a||r.day<a)?r.day:a,"");
    if(from)for(let d=from;d<=y;d=ML.addDay(d,1))for(const {slot} of ML.dosesOn([m],d))if(!rec(m.id,d,slot))rows.push([d,slot,m.n,ML.doseText(m,slot,d),ML.amt(m,slot,d),"işaretlenmedi",""]);
  }
  return by(rows,r=>r[0],r=>r[1]);
},7]);
Data.csv.push(["ilac_listesi","İlaç listesi",()=>["ilaç","doz","saatler","günler","başlangıç","bitiş","stok","hatırlatma"],({S})=>S.meds.map(m=>[m.n,m.d,m.t.join(" "),m.iv?`her ${m.iv} günde bir`:m.w?m.w.map(d=>["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"][d]).join(" "):"her gün",m.s,m.e,m.k,m.on===false?"kapalı":"açık"]),7.5]);
Data.hist.push((S,{add})=>{for(const x of S.medLog)if(x.st==="t")add(x.day,"meds",1)});
Data.dayRows.push([6,k=>{const ml=S.medLog.filter(x=>x.day===k);if(!ml.length)return "";const t=ml.filter(x=>x.st==="t").length,s=ml.length-t;return hgRow("meds","İlaç",`${t} alındı${s?`, ${s} atlandı`:""}`)}]);
const Meds={
  count:()=>S.meds.length,bpSince:(day,time)=>MedLib.sinceDose(S.meds,S.medLog,day,time,S.settings.dayStart),meds:()=>S.meds,log:()=>S.medLog,
  snapshot:()=>({log:S.medLog,k:S.meds.map(m=>m.k)}),
  rollback:sn=>{S.medLog=sn.log;S.meds.forEach((m,i)=>{if(m.k!=null)m.k=sn.k[i]})}
};
