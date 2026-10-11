const {ok,finish}=require("./ok");
const A=require("../www/modules/insights/activitylib.js");
const set=(o={})=>({reps:8,kg:20,done:true,...o}),sets=n=>Array.from({length:n},()=>set());
const wo=(day,ex,t1=1)=>({id:1,day,t1,ex});
const strong=id=>id!=="stretch";
const F="2026-10-01",T="2026-10-07";

ok("a day with 3 working sets of strength exercises counts; 2 sets or only stretching does not",A.strengthDays([wo("2026-10-02",[{id:"squat",sets:sets(3)}]),wo("2026-10-03",[{id:"squat",sets:sets(2)}]),wo("2026-10-04",[{id:"stretch",sets:sets(6)}])],strong,F,T)===1);
ok("two workouts on the same day are one day (sets add up)",A.strengthDays([wo("2026-10-02",[{id:"squat",sets:sets(2)}]),wo("2026-10-02",[{id:"row",sets:sets(1)}])],strong,F,T)===1&&A.strengthDays([wo("2026-10-02",[{id:"squat",sets:sets(3)}]),wo("2026-10-02",[{id:"row",sets:sets(3)}])],strong,F,T)===1);
ok("warm-up sets, undone sets and empty sets do not count",A.strengthDays([wo("2026-10-02",[{id:"squat",sets:[set({w:true}),set({w:true}),set({w:true}),set({done:false}),set({reps:0})]}])],strong,F,T)===0);
ok("unfinished workouts and days outside the window do not count",A.strengthDays([wo("2026-10-02",[{id:"squat",sets:sets(4)}],null),wo("2026-09-30",[{id:"squat",sets:sets(4)}]),wo("2026-10-08",[{id:"squat",sets:sets(4)}])],strong,F,T)===0);
ok("garbage workouts do not throw",A.strengthDays([{day:"2026-10-02",t1:1},{day:"2026-10-02",t1:1,ex:[{id:"squat"}]}],strong,F,T)===0);
finish();
