"use strict";
/* Kilo trendine göre haftalık kalori hedefi önerisi. Yalnız öner; uygulamayı kullanıcı onaylar (goalui.js). */
const GoalLib=(()=>{
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const TOL=0.15,MAX_STEP=250,QUIET=7,WIN=14;
  /* o: w {gün:kg}, kcal (mevcut hedef), tdee, bmr, ri (Algo.riskFlags girdisi: kg, goalKg, age, sex...), intake {gün:kcal}, today, at (son karar günü).
     Hız sapması |trend − hedef hız| < 0,15 kg/hafta ise sessiz. Önceki 14 günde hedefe uyulmamışsa (ortalama ±%15 dışı) sapma hedeften değil uyumdan gelir: sessiz. */
  function suggest({w,kcal,tdee,bmr,ri,intake,today,at}){
    if(!(kcal>0&&tdee>0&&ri&&ri.kg>0&&ri.goalKg>0))return null;
    const rk=A.riskFlags(ri);
    if(rk.hard.length)return null;
    if(at&&A.dayNum(today)-A.dayNum(at)<QUIET)return null;
    const slope=A.slopePerWeek(w,28,3,WIN,today);
    if(slope==null)return null;
    const t0=A.dayNum(today),days=Object.keys(intake||{}).filter(k=>{const d=t0-A.dayNum(k);return d>=1&&d<=WIN&&A.fullKcal(intake[k],tdee)});
    if(days.length<A.MIN_AVG_DAYS)return null;
    if(Math.abs(days.reduce((s,k)=>s+intake[k],0)/days.length-kcal)>kcal*0.15)return null;
    const sg=A.suggestTarget({...ri,tdee,bmr});
    if(!sg)return null;
    const dev=slope-sg.rateKgWk;
    if(Math.abs(dev)<TOL)return null;
    const delta=Math.max(-MAX_STEP,Math.min(MAX_STEP,-dev*A.KCAL_PER_KG/7));
    const lo=Math.max(A.kcalFloor(ri.sex,bmr),tdee*0.75),hi=tdee*1.3;
    const next=Math.round(Math.min(hi,Math.max(lo,kcal+delta))/10)*10;
    if(Math.abs(next-kcal)<50||Math.sign(next-kcal)!==Math.sign(delta))return null;
    if(rk.block&&next<tdee-50)return null;
    return {kcal:next,delta:next-kcal,slope,rate:sg.rateKgWk};
  }
  return {suggest,QUIET,TOL};
})();
if(typeof module!=="undefined")module.exports=GoalLib;
