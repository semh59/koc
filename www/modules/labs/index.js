"use strict";
Data.privacy.push(["Tahlil",()=>S.labs.length,()=>{S.labs=[]},6]);
const labVal=r=>`${r.q||""}${LabLib.fmtN(r.v)}${r.u?" "+r.u:""}`;
Data.csv.push(["tahlil","Tahlil sonuçları",()=>["tarih","test","değer","işaret","birim","rapor_alt","rapor_üst"],({S,by})=>by(S.labs,r=>r.day,r=>r.n).map(r=>[r.day,r.n,r.v,r.q,r.u,r.lo,r.hi]),10]);
Data.hist.push((S,{add})=>{for(const r of S.labs)add(r.day,"labs",1)});
Data.histSearch.push((S,{n,norm,out})=>{for(const r of S.labs)if(norm(r.n).includes(n))out.push({day:r.day,time:"",type:"lab",kind:"Tahlil",text:r.n,sub:labVal(r)})});
Data.dayRows.push([6,k=>S.labs.filter(r=>r.day===k).map(r=>hgRow("file",esc(r.n),esc(labVal(r)))).join("")]);
const Labs={count:()=>S.labs.length,pages:()=>labPdfPages(),all:()=>S.labs,latest:k=>S.labs.reduce((b,l)=>l.k===k&&(!b||l.day>b.day)?l:b,undefined)};
