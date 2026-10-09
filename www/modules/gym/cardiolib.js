"use strict";
/* Standalone cardio entry: kind, validation, pace/speed, MET and weekly summary (no DOM).
   An entry is an ordinary exercise entry (type "exercise", text = kind name, v = min, km, kcal) with the extra ck/cn fields, so it counts toward the weekly
   exercise minutes, the motion calories and the automatic walk/run overlap guard of Algo.exerciseKcal without creating a second total. */
const CardioLib=(()=>{
  /* [code, name, MET (without distance), highest plausible speed km/h] */
  const KINDS=[["run","Koşu",8.3,25],["walk","Yürüyüş",3.5,9],["bike","Bisiklet",6.8,60],["swim","Yüzme",6,6],["elliptical","Eliptik",5,20]];
  const kind=c=>KINDS.find(k=>k[0]===c);
  /* Same Compendium points as Algo.moveSummary (km/h -> MET). */
  const WK=[3.2,4,4.8,5.6,6.4,7.2,8],WM=[2.8,3,3.5,4.3,5,7,8.3],RK=[8,9.7,11.3,12.9,14.5,16.1],RM=[8.3,9.8,11,11.8,12.8,14.5];
  const interp=(x,y,v)=>{if(v<=x[0])return y[0];for(let i=1;i<x.length;i++)if(v<=x[i])return y[i-1]+(y[i]-y[i-1])*(v-x[i-1])/(x[i]-x[i-1]);return y[y.length-1]};
  const met=(c,kmh)=>c==="run"&&kmh?interp(RK,RM,kmh):c==="walk"&&kmh?(kmh>8?interp(RK,RM,kmh):interp(WK,WM,kmh)):kind(c)[2];
  /* Duration in whole minutes (1-600), distance in km (none, or 0.1-100). A duration/distance pair above the kind's plausible speed counts as a typo. */
  function check({kind:c,min,km}){
    const k=kind(c);
    if(!k)return {err:"Tür seç"};
    if(!(Number.isInteger(min)&&min>=1&&min<=600))return {err:"Süreyi dakika olarak yaz (1-600), örneğin 40"};
    if(km==null||km===0)return {name:k[1],min,km:0,kmh:null};
    if(!(km>=0.1&&km<=100))return {err:"Mesafeyi km olarak yaz (0,1-100), örneğin 5,2; yoksa boş bırak"};
    const kmh=km*60/min;
    if(kmh>k[3])return {err:`${k[1]} için ${r1(kmh)} km/sa olağan dışı; süreyi ve mesafeyi kontrol et`};
    return {name:k[1],min,km:Math.round(km*100)/100,kmh};
  }
  const r1=x=>String(Math.round(x*10)/10).replace(".",",");
  const mmss=m=>{const s=Math.round(m*60);return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`};
  /* min/km for run and walk, min/100 m for swim, km/h for bike and elliptical; null without distance. */
  function pace(c,min,km){
    if(!(km>0&&min>0))return null;
    if(c==="run"||c==="walk")return `${mmss(min/km)} dk/km`;
    if(c==="swim")return `${mmss(min/(km*10))} dk/100 m`;
    return `${r1(km*60/min)} km/sa`;
  }
  const isCardio=e=>e&&e.type==="exercise"&&!!kind(e.ck);
  /* The last 7 days (today included): total and per kind. */
  function week(entries,from,to){
    const L=entries.filter(e=>isCardio(e)&&e.day>=from&&e.day<=to),tot={n:L.length,min:0,km:0,kcal:0},by={};
    for(const e of L){
      const b=by[e.ck]||(by[e.ck]={n:0,min:0,km:0});
      b.n++;b.min+=e.v;b.km+=e.km||0;tot.min+=e.v;tot.km+=e.km||0;tot.kcal+=e.kcal||0;
    }
    tot.km=Math.round(tot.km*10)/10;
    return {tot,by};
  }
  return {KINDS,kind,met,check,pace,isCardio,week};
})();
if(typeof module!=="undefined")module.exports=CardioLib;
