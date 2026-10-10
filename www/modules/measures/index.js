"use strict";
const MNAME={waist:"Bel",hip:"Kalça",chest:"Göğüs",arm:"Kol",thigh:"Uyluk"};
Data.privacy.push(["Vücut ölçüleri (bel, kalça…)",()=>S.measures.length,()=>{S.measures=[]},10]);
// adds measure rows to the CSV "Kayıtlar" file
Data.csvEntries.push(S=>S.measures.map(m=>({day:m.day,time:"",type:"ölçü_"+MNAME[m.k].toLowerCase(),v:m.v})));
Data.hist.push((S,{add})=>{for(const x of S.measures)add(x.day,"measures",1)});
Data.dayRows.push([8,k=>S.measures.filter(x=>x.day===k).map(x=>hgRow("weight",`Ölçü: ${MNAME[x.k]}`,`${fmt(x.v)} cm`)).join("")]);
