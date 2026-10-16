"use strict";
/* Units (no DOM). Storage always stays kg and mg/dL; only input and display convert, calculations and the Coach context use kg and mg/dL.
   The settings source is given with Units.src(() => S.settings); without u the unit from settings is used. */
const Units=(()=>{
  const LB=2.20462,MG=18.016;
  let src=()=>({});
  const cur=()=>src()||{};
  let ov={}; // one entry sheet's temporary unit: a tap on the unit label flips it, closing the sheet drops it
  const wu=()=>ov.w||(cur().wUnit==="lb"?"lb":"kg"),gu=()=>ov.g||(cur().gUnit==="mmol"?"mmol":"mgdl");
  const w=(kg,u=wu())=>u==="lb"?kg*LB:kg;
  /* lb input converts to kg with 3 decimals: 0.1 lb = 0.045 kg, so the typed number comes back unchanged on display. */
  const wIn=(v,u=wu())=>u==="lb"?Math.round(v/LB*1000)/1000:v;
  const g=(mg,u=gu())=>u==="mmol"?mg/MG:mg;
  /* mmol/L input rounds to 0.1 mg/dL (the stored form; 0.1 mmol/L = 1.8 mg/dL, so the display round-trips). */
  const gIn=(v,u=gu())=>u==="mmol"?Math.round(v*MG*10)/10:v;
  const f=(x,d)=>Number(x).toFixed(d).replace(".",",");
  const fw=(kg,d=1,u)=>f(w(kg,u),d);
  const fwS=(dkg,d=1,u)=>{const x=w(dkg,u);const e=0.5*Math.pow(10,-d)-1e-9;return (x>e?"+":x<-e?"−":"")+f(Math.abs(x),d)};
  const fg=(mg,u=gu())=>u==="mmol"?f(mg/MG,1):String(Math.round(mg*10)/10).replace(".",",");
  const gl=(u=gu())=>u==="mmol"?"mmol/L":"mg/dL";
  return {src:fn=>{src=fn},flip:k=>{ov[k]=k==="w"?(wu()==="kg"?"lb":"kg"):(gu()==="mgdl"?"mmol":"mgdl")},reset:()=>{ov={}},wu,gu,w,wIn,g,gIn,fw,fwS,fg,gl};
})();
if(typeof module!=="undefined")module.exports=Units;
