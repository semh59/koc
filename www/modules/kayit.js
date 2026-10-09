"use strict";
/* Kayıt modülü: yemek, su, kilo, spor, not ve adım kayıtları (S.entries, S.nextId). Başka modüller bu veriye yalnız bu API ile dokunur. */
const Kayit={
  where:f=>S.entries.filter(f),
  find:f=>S.entries.find(f),
  all:()=>S.entries,
  byDay:type=>{const m={};for(const e of S.entries)if(e.type===type&&e.v)m[e.day]=(m[e.day]||0)+e.v;return m}, // gün -> toplam değer (yemek: kcal)
  remove:f=>{const r=S.entries.filter(f);S.entries=S.entries.filter(e=>!f(e));return r},
  restore:list=>{S.entries.push(...list);S.entries.sort((a,b)=>a.id-b.id)},
  count:(...t)=>S.entries.filter(e=>t.includes(e.type)).length,
  drop:(...t)=>{S.entries=S.entries.filter(e=>!t.includes(e.type))}
};
Data.privacy.push(["Yemek ve su kayıtları",()=>Kayit.count("yemek","su"),()=>Kayit.drop("yemek","su"),0],
  ["Kilo",()=>Kayit.count("kilo"),()=>Kayit.drop("kilo"),1],
  ["Notlar",()=>Kayit.count("not"),()=>Kayit.drop("not"),9]);
const UNIT={yemek:"kcal",su:"ml",kilo:"kg",spor:"dk",adim:"adım",not:""};
Data.csv.push(["kayitlar","Kayıtlar (yemek, su, kilo, ölçü, spor, adım, not)",({gu})=>["tarih","saat","tür","değer","birim","açıklama","protein_g","karbonhidrat_g","yağ_g","lif_g","şeker_g","sodyum_mg"],({S,by,day,time,conv,wu,gu,h,iso})=>by([...S.entries,...Data.csvKayit.flatMap(f=>f(S))],day,time).map(e=>[e.day,e.time,e.type==="adim"?"adım":e.type,e.type==="not"?null:e.type==="kilo"?conv.w(e.v,wu):e.v,e.type.startsWith("ölçü")?"cm":e.type==="kilo"?wu:UNIT[e.type],e.text,e.p,e.c,e.f,e.fb,e.sg,e.na]),0]);
Data.hist.push((S,{add,get})=>{
  const isWater=e=>e.type==="su"&&(!e.dr||e.dr==="su"||e.dr==="maden");
  for(const e of S.entries||[]){
    if(e.type==="yemek"){add(e.day,"yemek",1);if(e.v>0)add(e.day,"kcal",e.v)}
    else if(e.type==="su"){if(isWater(e))add(e.day,"su",e.v||0);else add(e.day,"icecek",1)}
    else if(e.type==="spor")add(e.day,"spor",e.v||0);
    else if(e.type==="kilo")get(e.day).kilo=e.v;
    else if(e.type==="adim")add(e.day,"adim",e.v||0);
    else if(e.type==="not")add(e.day,"not",1);
  }
});
Data.histSearch.push((S,{n,norm,out})=>{
  for(const e of S.entries||[]){
    if(e.type!=="yemek"&&e.type!=="not"&&e.type!=="spor")continue;
    if(norm(e.text).includes(n))out.push({day:e.day,time:e.time,type:e.type,text:e.text||"",v:e.v,id:e.id});
  }
});
Data.dayRows.push([0,k=>{const ad=Kayit.where(e=>e.type==="adim"&&e.day===k).reduce((s,e)=>s+(e.v||0),0);return ad?hgRow("adim","Adım",Math.round(ad).toLocaleString("tr-TR")):""}]);
