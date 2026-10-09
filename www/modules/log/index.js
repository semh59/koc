"use strict";
/* Log module: food, water, weight, exercise, note and steps entries (S.entries, S.nextId). Other modules touch this data only through this API. */
const WL=typeof WeeklyLib!=="undefined"?WeeklyLib:require("../insights/weeklylib.js");
const Log={
  where:f=>S.entries.filter(f),
  find:f=>S.entries.find(f),
  all:()=>S.entries,
  byDay:type=>{const m={};for(const e of S.entries)if(e.type===type&&e.v)m[e.day]=(m[e.day]||0)+e.v;return m}, // day -> total value (food: kcal)
  remove:f=>{const r=S.entries.filter(f);S.entries=S.entries.filter(e=>!f(e));return r},
  restore:list=>{S.entries.push(...list);S.entries.sort((a,b)=>a.id-b.id)},
  count:(...t)=>S.entries.filter(e=>t.includes(e.type)).length,
  drop:(...t)=>{S.entries=S.entries.filter(e=>!t.includes(e.type))}
};
Data.privacy.push(["Yemek ve su kayıtları",()=>Log.count("food","water"),()=>Log.drop("food","water"),0],
  ["Kilo",()=>Log.count("weight"),()=>Log.drop("weight"),1],
  ["Notlar",()=>Log.count("note"),()=>Log.drop("note"),9]);
const CSV_TYPE={food:"yemek",water:"su",weight:"kilo",exercise:"spor",steps:"adım",note:"not"};
const UNIT={food:"kcal",water:"ml",weight:"kg",exercise:"dk",steps:"adım",note:""};
Data.csv.push(["kayitlar","Kayıtlar (yemek, su, kilo, ölçü, spor, adım, not)",()=>["tarih","saat","tür","değer","birim","açıklama","protein_g","karbonhidrat_g","yağ_g","lif_g","şeker_g","sodyum_mg"],({S,by,day,time,conv,wu})=>by([...S.entries,...Data.csvEntries.flatMap(f=>f(S))],day,time).map(e=>[e.day,e.time,CSV_TYPE[e.type]||e.type,e.type==="note"?null:e.type==="weight"?conv.w(e.v,wu):e.v,e.type.startsWith("ölçü")?"cm":e.type==="weight"?wu:UNIT[e.type],e.text==="manual"?"elle":e.text,e.p,e.c,e.f,e.fb,e.sg,e.na]),0]);
Data.hist.push((S,{add,get})=>{
  for(const e of S.entries||[]){
    if(e.type==="food"){add(e.day,"food",1);if(e.v>0)add(e.day,"kcal",e.v)}
    else if(e.type==="water"){if(WL.isWater(e))add(e.day,"water",e.v||0);else add(e.day,"drink",1)}
    else if(e.type==="exercise")add(e.day,"exercise",e.v||0);
    else if(e.type==="weight")get(e.day).weight=e.v;
    else if(e.type==="steps")add(e.day,"steps",e.v||0);
    else if(e.type==="note")add(e.day,"note",1);
  }
});
Data.histSearch.push((S,{n,norm,out})=>{
  for(const e of S.entries||[]){
    if(e.type!=="food"&&e.type!=="note"&&e.type!=="exercise")continue;
    if(norm(e.text).includes(n))out.push({day:e.day,time:e.time,type:e.type,text:e.text||"",v:e.v,id:e.id});
  }
});
Data.dayRows.push([0,k=>{const ad=Log.where(e=>e.type==="steps"&&e.day===k).reduce((s,e)=>s+(e.v||0),0);return ad?hgRow("steps","Adım",fint(ad)):""}]);
