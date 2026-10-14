"use strict";
const Motion={walk:()=>S.walk,moves:()=>S.moves};
Data.privacy.push(["Adım ve hareket",()=>S.moves.length+Log.count("steps"),()=>chain(nativeWipe(["Motion"]),ok=>{if(!ok)return toast(NATIVE_FAIL),false;S.moves=[];S.walk=null;S.settings.stepsFrom=keyOff(1);Log.drop("steps")}),3]);
Data.hist.push((S,{add})=>{for(const m of S.moves)add(m.day,"moves",1)});
Data.csv.push(["hareket","Algılanan yürüyüş ve koşu",()=>["tarih","başlangıç","tür","süre_dk","adım","mesafe_km","hız_kmsa","kcal"],({S})=>S.moves.map(m=>[m.day,m.t0,m.k==="r"?"koşu":"yürüyüş",m.min,m.steps,m.km,m.kmh,m.kcal]),11]);
Data.histSearch.push((S,{n,norm,out})=>{
  for(const m of S.moves){const t=m.k==="r"?"Koşu":"Yürüyüş";if(norm(t).includes(n))out.push({day:m.day,time:m.t0,type:"move",kind:"Hareket",text:t,sub:`${m.min} dk`})}
});
Data.dayRows.push([0.5,k=>S.moves.filter(m=>m.day===k).map(m=>`<div class="row"><span class="grow">${Icons.svg("exercise")} ${m.t0} ${m.k==="r"?"Koşu":"Yürüyüş"} <small class="mut">${m.min} dk</small></span><b class="num">${fmt(m.km,1)} km${m.kcal!=null?` · ${m.kcal} kcal`:""}</b><button class="del" data-mo="del:${m.day}|${m.t0}|${m.k}" aria-label="Kaydı sil">✕</button></div>`).join("")]);
