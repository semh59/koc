"use strict";
/* Weekly movement card numbers: strength days from finished workouts (pure, no DOM, no S). Sport minutes come from the exercise entries, the same sum as the weekly sport row. */
const ActivityLib=(()=>{
  const MIN_SETS=3; // working sets of strength exercises that make a day a strength day (a rule of thumb, not from a guideline)
  /* workouts: finished ones (t1 set) inside from..to; isStrength(exerciseId) says whether an exercise is a strength exercise. Warm-up sets and undone sets do not count. */
  function strengthDays(workouts,isStrength,from,to){
    const sets={};
    for(const w of workouts){
      if(w.t1==null||w.day<from||w.day>to)continue;
      for(const x of w.ex||[])if(isStrength(x.id))sets[w.day]=(sets[w.day]||0)+(x.sets||[]).filter(s=>s.done&&!s.w&&(s.reps>0||s.sec>0)).length;
    }
    return Object.values(sets).filter(n=>n>=MIN_SETS).length;
  }
  return {strengthDays,MIN_SETS};
})();
if(typeof module!=="undefined")module.exports=ActivityLib;
