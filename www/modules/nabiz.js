"use strict";
Data.privacy.push(["Nabız (kamera, saat)",()=>S.pulse.length+S.hr.length,()=>{S.pulse=[];S.hr=[];S.settings.hcFrom=keyOff(1)},13]);
Data.csv.push(["nabiz","Nabız (kamera ölçümü ve saatten günlük)",({gu})=>["tarih","saat","kaynak","nabız","günün_en_düşüğü"],({S,by,day,time,conv,wu,gu,h,iso})=>[...(S.pulse||[]).map(r=>[r.day,r.time,"kamera",r.bpm,""]),...(S.hr||[]).map(r=>[r.day,"","saat (ortalama)",r.a,r.m])].sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:String(a[1])<String(b[1])?-1:1),8]);
Data.hist.push((S,{get,add})=>{for(const x of S.pulse||[])add(x.day,"nabiz",1);for(const x of S.hr||[])get(x.day).hr=x.a});
Data.dayRows.push([4,k=>S.pulse.filter(x=>x.day===k).map(x=>hgRow("heart",`${x.time} Nabız (kamera)`,`${x.bpm}`)).join("")],
  [5,k=>{const x=S.hr.find(y=>y.day===k);return x?hgRow("heart","Nabız (saat), ortalama",`${x.a}${x.m?` · en düşük ${x.m}`:""}`):""}]);
const Nabiz={hr:()=>S.hr,setHr:l=>{S.hr=PulseLib.cleanHr(l)}};
