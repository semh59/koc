"use strict";
/* Progress photos: size calculation, limit, ordering and the comparison gap (no DOM). Photos never go to localStorage, the backup, the Coach or sharing. */
const PhotoLib=(()=>{
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const MAX=24,LONG=900,THUMB=160,QUALITY=0.75,KG=[20,400];
  /* Scales the longest side down to `long` px, never enlarges; null for an invalid size. */
  function fit(w,h,long=LONG){
    if(!(w>0&&h>0))return null;
    const s=Math.min(1,long/Math.max(w,h));
    return {w:Math.max(1,Math.round(w*s)),h:Math.max(1,Math.round(h*s))};
  }
  const canAdd=n=>n<MAX;
  /* The weight label is optional: empty gives null, a value outside 20-400 kg gives undefined (invalid). */
  const kgLabel=v=>v==null?null:typeof v==="number"&&v>=KG[0]&&v<=KG[1]?Math.round(v*1000)/1000:undefined;
  const order=list=>list.slice().sort((a,b)=>a.day<b.day?-1:a.day>b.day?1:a.t-b.t);
  /* a older, b newer: the day gap and, when both have a label, the kg gap. */
  const gap=(a,b)=>({days:A.dayNum(b.day)-A.dayNum(a.day),kg:a.kg!=null&&b.kg!=null?Math.round((b.kg-a.kg)*1000)/1000:null});
  return {MAX,LONG,THUMB,QUALITY,KG,fit,canAdd,kgLabel,order,gap};
})();
if(typeof module!=="undefined")module.exports=PhotoLib;
