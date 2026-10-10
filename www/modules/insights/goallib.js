"use strict";
/* Weekly calorie-target suggestion from the weight trend. It only suggests; the user applies it (goalui.js). */
const GoalLib=(()=>{
  const A=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const TOL=0.15,ADHERE=0.15,MAX_STEP=250,QUIET=7,INTAKE_DAYS=14,MIN_CHANGE=50,FLOOR_TDEE=0.75,CEIL_TDEE=1.3,ROUND=10;
  /* o: w {day:kg}, kcal (current target), tdee, bmr, ri (Algo.riskFlags input: kg, goalKg, age, sex...), intake {day:kcal}, today, at (day of the last decision).
     Quiet when the rate deviation |trend - target rate| is under TOL kg/week. If the last INTAKE_DAYS did not follow the target (average outside +-ADHERE), the deviation comes from
     adherence and not from the target: quiet. */
  function suggest({w,kcal,tdee,bmr,ri,intake,today,at}){
    if(!(kcal>0&&tdee>0&&ri&&ri.kg>0&&ri.goalKg>0))return null;
    const rk=A.riskFlags(ri);
    if(rk.hard.length)return null;
    if(at&&A.dayNum(today)-A.dayNum(at)<QUIET)return null;
    const slope=A.lossSlope(w,today);
    if(slope==null)return null;
    const t0=A.dayNum(today),days=Object.keys(intake||{}).filter(k=>{const d=t0-A.dayNum(k);return d>=1&&d<=INTAKE_DAYS&&A.fullKcal(intake[k],tdee)});
    if(days.length<A.MIN_AVG_DAYS)return null;
    if(Math.abs(days.reduce((s,k)=>s+intake[k],0)/days.length-kcal)>kcal*ADHERE)return null;
    const sg=A.suggestTarget({...ri,tdee,bmr});
    if(!sg)return null;
    const dev=slope-sg.rateKgWk;
    if(Math.abs(dev)<TOL)return null;
    const delta=Math.max(-MAX_STEP,Math.min(MAX_STEP,-dev*A.KCAL_PER_KG/7));
    const lo=Math.max(A.kcalFloor(ri.sex,bmr),tdee*FLOOR_TDEE),hi=tdee*CEIL_TDEE;
    const next=A.roundTo(Math.min(hi,Math.max(lo,kcal+delta)),ROUND);
    if(Math.abs(next-kcal)<MIN_CHANGE||Math.sign(next-kcal)!==Math.sign(delta))return null;
    if(rk.block&&next<tdee-MIN_CHANGE)return null;
    return {kcal:next,delta:next-kcal,slope,rate:sg.rateKgWk};
  }
  return {suggest};
})();
if(typeof module!=="undefined")module.exports=GoalLib;
