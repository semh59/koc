"use strict";
Data.privacy.push(["Vücut ölçüleri (bel, kalça…)",()=>S.measures.length,()=>{S.measures=[]},10]);
const MN={waist:"bel",hip:"kalça",chest:"göğüs",arm:"kol",thigh:"uyluk"};
Data.csvKayit.push(S=>(S.measures||[]).filter(m=>MN[m.k]).map(m=>({day:m.day,time:"",type:"ölçü_"+MN[m.k],v:m.v}))); // CSV "Kayıtlar" dosyasına ölçü satırı ekler
Data.hist.push((S,{add})=>{for(const x of S.measures||[])add(x.day,"olcu",1)});
Data.dayRows.push([8,k=>{const names={waist:"Bel",hip:"Kalça",chest:"Göğüs",arm:"Kol",thigh:"Uyluk"};
  return S.measures.filter(x=>x.day===k).map(x=>hgRow("kilo",`Ölçü: ${names[x.k]||x.k}`,`${fmt(x.v)} cm`)).join("")}]);
