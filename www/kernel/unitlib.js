"use strict";
/* Birimler (DOM yok). Depolama her zaman kg ve mg/dL kalır; yalnız giriş ve gösterim dönüşür, hesaplar ve Koç bağlamı kg/mg/dL ile çalışır.
   Ayar kaynağı Units.src(() => S.settings) ile verilir; u verilmezse ayardaki birim kullanılır. */
const Units=(()=>{
  const LB=2.20462,MG=18.016;
  let src=()=>({});
  const cur=()=>src()||{};
  const wu=()=>cur().wUnit==="lb"?"lb":"kg",gu=()=>cur().gUnit==="mmol"?"mmol":"mgdl";
  const w=(kg,u=wu())=>u==="lb"?kg*LB:kg;
  /* lb girişi 3 ondalıkla kg'a çevrilir: 0,1 lb = 0,045 kg olduğundan gösterimde yazılan sayı aynen geri gelir. */
  const wIn=(v,u=wu())=>u==="lb"?Math.round(v/LB*1000)/1000:v;
  const g=(mg,u=gu())=>u==="mmol"?mg/MG:mg;
  /* mmol/L girişi 0,1 mg/dL'ye yuvarlanır (kayıt biçimi bu; 0,1 mmol/L = 1,8 mg/dL olduğundan gösterim aynen geri gelir). */
  const gIn=(v,u=gu())=>u==="mmol"?Math.round(v*MG*10)/10:v;
  const f=(x,d)=>Number(x).toFixed(d).replace(".",",");
  const fw=(kg,d=1,u)=>f(w(kg,u),d);
  const fwS=(dkg,d=1,u)=>{const x=w(dkg,u);return (x>0.049?"+":x<-0.049?"−":"")+f(Math.abs(x),d)};
  const fg=(mg,u=gu())=>u==="mmol"?f(mg/MG,1):String(Math.round(mg*10)/10).replace(".",",");
  const gl=(u=gu())=>u==="mmol"?"mmol/L":"mg/dL";
  return {LB,MG,src:fn=>{src=fn},wu,gu,w,wIn,g,gIn,fw,fwS,fg,gl};
})();
if(typeof module!=="undefined")module.exports=Units;
