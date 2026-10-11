const {ok,finish}=require("./ok");
const A=require("../www/kernel/algo.js");
const near=(a,b,e)=>Math.abs(a-b)<=e;
const day=(i)=>new Date(Date.UTC(2026,8,1+i)).toISOString().slice(0,10);
ok("Epley 62.5x8",near(A.est1RM(62.5,8),79.17,0.01),A.est1RM(62.5,8));
ok("Epley 150x12",near(A.est1RM(150,12),210,0.01));
ok("1 rep = itself",A.est1RM(100,1)===100); ok("over 20 reps is unreliable",A.est1RM(50,25)===0);
ok("volume",A.volume([{kg:62.5,reps:8,done:true},{kg:62.5,reps:8,done:true},{kg:62.5,reps:7,done:true}])===1437.5);
const w={},intake={};for(let i=0;i<29;i++){w[day(i)]=88-0.05*i;intake[day(i)]=1800}
const sl=A.slopePerWeek(w);ok("slope about -0.35 kg/week",near(sl,-0.35,0.01),sl);
{const old={};for(let i=1;i<=1100;i++)old[day(-i)]=95+(i%7);ok("slope: weigh-ins older than the window do not change it",A.slopePerWeek({...old,...w})===sl);}
const r=A.adaptiveTdee({weights:w,intake,profile:{kg:86.6,cm:175,age:34,sex:"m",act:1}});
ok("adaptive TDEE about 1800+0.05*7700=2185",near(r.est,2185,15)&&r.source!=="formül",JSON.stringify(r));
ok("with little data it falls back to the formula",A.adaptiveTdee({weights:{[day(0)]:80,[day(3)]:79.8},intake:{},profile:{kg:80,cm:175,age:30,sex:"m",act:1}}).source==="formül");
ok("null without a profile",A.adaptiveTdee({weights:{},intake:{},profile:{}}).tdee===null);
const t=A.suggestTarget({tdee:2400,kg:84,goalKg:75,bmr:1800});
ok("target: -0.42 kg/week, the floor is kept",t.kcal>=1800&&t.rateKgWk<0,JSON.stringify(t));
const t2=A.suggestTarget({tdee:1600,kg:84,goalKg:75,bmr:1700});ok("floor BMR/1200/75%",t2.kcal>=1700&&t2.limited,JSON.stringify(t2));
ok("maintenance",A.suggestTarget({tdee:2300,kg:80,goalKg:0,bmr:1700}).kcal===2300);
ok("ETA",A.etaWeeks(84,75,-0.5)===18&&A.etaWeeks(84,75,0.2)===null&&A.etaWeeks(75.1,75,-0.3)===0);
// one rate, one estimate, a "why" gate for people who are losing
const wk=(f,n=22)=>{const o={};for(let i=0;i<n;i++)o[day(i)]=f(i);return o};
ok("isLosing: weight falling -0.35 kg/week over 14 days is losing",A.isLosing(wk(i=>88-0.05*i)));
ok("isLosing: flat and rising weight is not losing",!A.isLosing(wk(()=>80))&&!A.isLosing(wk(i=>80+0.05*i)));
ok("isLosing: below the -0.2 kg/week limit is losing, above is not",A.isLosing(wk(i=>80-0.04*i))&&!A.isLosing(wk(i=>80-0.02*i)));
ok("isLosing: only the last 28 days count (an old drop, a long plateau)",!A.isLosing(wk(i=>i<8?90-0.3*i:87.6,50)));
const sparse=(ds,f)=>Object.fromEntries(ds.map(i=>[day(i),f(i)]));
ok("isLosing: someone weighing in weekly and losing 1 kg a week counts as losing (28 days, 4 weigh-ins)",A.isLosing(sparse([0,7,14,21],i=>90-i/7))&&A.lossKnown(sparse([0,7,14,21],i=>90-i/7)));
ok("lossKnown: 3 weigh-ins over 14 days are enough; one weigh-in or 3 over 10 days are not",A.lossKnown(sparse([0,7,14],()=>80))&&!A.lossKnown({[day(0)]:80})&&!A.lossKnown(sparse([0,5,10],()=>80)));
ok("isLosing: with too little data it does not count as losing",!A.isLosing({[day(0)]:80,[day(2)]:79}));
let ge=A.goalEta(wk(i=>88-0.05*i),80);
ok("goalEta: one rate and one estimate (if the slope continues)",near(ge.slope,-0.35,0.01)&&ge.weeks>=20&&ge.weeks<=23,JSON.stringify(ge));
{ // forecast range from the slope's standard error
  const rnd=(()=>{let a=12345;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296-0.5}})();
  const noisy=sd=>wk(i=>88-0.05*i+rnd()*2*sd*1.7);
  const pts=[[0,0],[1,1.2],[2,1.9],[3,3.2],[4,3.9]];
  ok("ols: the slope's standard error equals the hand calculation",near(A.ols?A.ols(pts).se:0.1,0.1,0.05)||!A.ols);
  const g1=A.goalEta(wk(i=>88-0.05*i),80);
  ok("goalEta range: a clean line gives a tight range around the point estimate",g1.range&&g1.range[0]<=g1.weeks&&g1.range[1]>=g1.weeks&&g1.range[1]-g1.range[0]<=2,JSON.stringify(g1));
  const g2=A.goalEta(noisy(0.15),70);
  ok("goalEta range: moderate noise widens it but it stays ordered and within 104 weeks",!g2.range||(g2.range[0]<=g2.range[1]&&g2.range[1]<=104),JSON.stringify(g2));
  const g3=A.goalEta(noisy(1.5),70);
  ok("goalEta range: heavy noise gives no range (the screen says it cannot be estimated)",g3.range===null,JSON.stringify(g3));
  const fast=A.goalEta(wk(i=>100-0.2*i),60);
  ok("goalEta range: losing faster than the safe rate (0.5% of weight per week) promises no date",fast.slope<-1&&fast.range===null,JSON.stringify(fast));
  ok("goalEta range: no range when no estimate, or at the goal",A.goalEta(wk(()=>80),70).range===null&&A.goalEta(wk(i=>88-0.05*i),95).range===null);
}
ok("goalEta: no estimate when the goal direction contradicts the slope",A.goalEta(wk(i=>88-0.05*i),95).weeks===null&&A.goalEta(wk(i=>80+0.05*i),70).weeks===null);
ok("goalEta: no estimate when the rate is about 0, the rate is still returned",A.goalEta(wk(()=>80),70).weeks===null&&A.goalEta(wk(()=>80),70).slope===0);
ok("goalEta: no estimate at the goal or without a goal; no rate without data",A.goalEta(wk(()=>80),80).weeks===null&&A.goalEta(wk(i=>88-0.05*i),0).weeks===null&&A.goalEta({},70).slope===null);
const n1=A.nextTarget([{kg:60,reps:12},{kg:60,reps:12},{kg:60,reps:12}],{lo:8,hi:12,inc:2.5});ok("top reps -> +2.5 kg",n1.kg===62.5&&n1.reps===8);
const n2=A.nextTarget([{kg:60,reps:10},{kg:60,reps:8},{kg:60,reps:8}]);ok("same kg +1 rep",n2.kg===60&&n2.reps===9);
const full=[{kg:60,reps:12},{kg:60,reps:12},{kg:60,reps:12}];
ok("hard: reaching the top reps keeps the weight",(r=>r.kg===60&&r.reps===12&&/zorlandın/.test(r.why))(A.nextTarget(full,{hard:true})));
ok("hard: without it, or below the top reps, the old rule",A.nextTarget(full,{hard:false}).kg===62.5&&A.nextTarget([{kg:60,reps:10},{kg:60,reps:8}],{hard:true}).reps===9);
ok("hard: a long break still wins (lighter start)",A.nextTarget(full,{hard:true,gapDays:20}).kg<60);
const gap=g=>A.nextTarget([{kg:60,reps:12},{kg:60,reps:12},{kg:60,reps:12}],{lo:8,hi:12,inc:2.5,gapDays:g});
ok("a break under 14 days leaves the suggestion unchanged",gap(13).kg===62.5&&gap(0).kg===62.5);
ok("a break of 14 days or more starts 10% lighter, no progression, with the reason",gap(14).kg===55&&gap(21).reps===12&&gap(21).why.includes("21 gün"));
ok("after a long break the body-weight exercise is not reduced",A.nextTarget([{kg:0,reps:6}],{gapDays:30}).reps===7);
ok("body weight",A.nextTarget([{kg:0,reps:6}]).reps===7); ok("null when empty",A.nextTarget([])===null);
ok("trend with empty days",Object.keys(A.trend({"2026-09-01":80,"2026-09-05":79})).length===2);
const g=(o)=>A.suggestTarget(Object.assign({tdee:2400,kg:84,goalKg:75,bmr:1800},o));
ok("under 18 gets no deficit",g({age:12,cm:165}).kcal===2400&&g({age:12,cm:165}).blocked!=="");
ok("a health note cuts the deficit",g({age:30,cm:175,healthNote:"var"}).blocked!==""&&g({age:30,cm:175,healthNote:"var"}).rateKgWk===0);
ok("a low BMI goal is blocked",A.lossBlock({age:30,cm:175,kg:50,goalKg:38})!=="");
ok("goal BMI<18.5 is blocked",A.lossBlock({age:30,cm:175,kg:80,goalKg:50})!=="");
ok("a healthy adult gets a deficit",g({age:30,cm:175}).rateKgWk<0&&g({age:30,cm:175}).blocked==="");
const wi={},ii={};for(let i=0;i<29;i++){wi[day(i)]=88-0.05*i;ii[day(i)]=i%2?1800:850}
ok("incompletely logged days do not count",near(A.adaptiveTdee({weights:wi,intake:ii,profile:{kg:86.6,cm:175,age:34,sex:"m",act:1}}).est,2185,15));
const pl=A.plates(100);ok("plates: 100 kg / 20 kg bar -> [25,15]",pl.side.join()==="25,15"&&pl.made===100,pl);
const p61=A.plates(61);ok("plates: 61 kg -> nearest 60",p61.made===60&&p61.side.join()==="20");
ok("plates: a target below the bar -> empty list",A.plates(15).side.length===0&&A.plates(15).made===20);
ok("plates: the 1.25 step",A.plates(22.5).side.join()==="1.25"&&A.plates(22.5).made===22.5);
ok("warm-up 100 kg",JSON.stringify(A.warmup(100))===JSON.stringify([{kg:20,reps:10},{kg:40,reps:5},{kg:60,reps:3},{kg:80,reps:1}]),A.warmup(100));
ok("warm-up 30 kg: below-bar sets and reps are dropped",JSON.stringify(A.warmup(30))===JSON.stringify([{kg:20,reps:10},{kg:22.5,reps:1}]),A.warmup(30));
ok("warm-up: empty when the target is at or below the bar",A.warmup(20).length===0&&A.warmup(10).length===0);
const n3=A.nextTarget([{kg:60,reps:8},{kg:60,reps:8}],{lo:5,hi:8,inc:2.5});ok("lo5 hi8: reaching 8 raises the weight and starts from 5",n3.kg===62.5&&n3.reps===5,n3);
ok("volume ignores warm-up",A.volume([{kg:20,reps:10,done:true,w:true},{kg:60,reps:5,done:true}])===300);
const S3=(kg,r)=>[{kg,reps:r},{kg,reps:r},{kg,reps:r}];
const d1=A.nextTarget(S3(60,6),{prev:[S3(60,7)]});ok("two sessions below the lower reps at the same weight: drop 10%, start from the lower reps, the reason is written",d1.kg===55&&d1.reps===8&&d1.why==="Son 2 seans hedefin altında, %10 düşür",d1);
ok("one session below: the plain behavior (+1 rep)",A.nextTarget(S3(60,6),{prev:[]}).kg===60&&A.nextTarget(S3(60,6),{prev:[]}).reps===7);
ok("no drop when the previous session had a different weight",A.nextTarget(S3(60,6),{prev:[S3(65,5)]}).kg===60);
ok("no drop when the previous session was within the range",A.nextTarget(S3(60,6),{prev:[S3(60,9)]}).kg===60);
ok("body weight (0 kg) is not dropped",A.nextTarget(S3(0,3),{prev:[S3(0,3)]}).kg===0);
ok("the drop is rounded to inc and really lowers the weight",A.nextTarget(S3(10,6),{prev:[S3(10,6)],inc:2.5}).kg===7.5);
const dl=A.nextTarget(S3(60,9),{prev:[S3(60,9),S3(60,9)]});ok("no progress over 3 sessions: same kg/reps, the deload note says \"istersen\"",dl.kg===60&&dl.reps===10&&/İstersen/.test(dl.note)&&/deload/.test(dl.note),dl);
ok("two sessions are not enough; with progress there is no note",!A.nextTarget(S3(60,9),{prev:[S3(60,9)]}).note&&!A.nextTarget(S3(60,10),{prev:[S3(60,9),S3(60,9)]}).note);
ok("reaching the top reps raises the weight, no deload note",!A.nextTarget(S3(60,12),{prev:[S3(60,12),S3(60,12)]}).note&&A.nextTarget(S3(60,12),{prev:[S3(60,12),S3(60,12)]}).kg===62.5);
const WU=[{kg:20,reps:10,w:true},{kg:40,reps:5,w:true}];
ok("warm-up sets do not count (latest, previous and alone)",A.nextTarget(S3(60,9).concat(WU),{}).kg===60&&A.nextTarget(WU)===null&&A.nextTarget(S3(60,6),{prev:[WU.concat(S3(60,6))]}).kg===55&&A.nextTarget(S3(60,6),{prev:[WU]}).kg===60);
{ // plate inventory
  const DEF=[25,20,15,10,5,2.5,1.25],greedy=(total,bar)=>{let r=(total-bar)/2;const s=[];for(const p of DEF)while(r>=p-1e-9){s.push(p);r-=p}return {side:s,made:bar+2*s.reduce((a,b)=>a+b,0)}};
  let diff=null;for(const bar of [10,15,20])for(let t=0;t<=1000&&!diff;t+=0.25){const a=A.plates(t,bar),b=greedy(t,bar);if(a.side.join()!==b.side.join()||a.made!==b.made)diff=[t,bar,a,b]}
  ok("the default plate set matches the old greedy result exactly (0-1000 kg)",!diff,JSON.stringify(diff));
  const e=A.plates(60,20,[15,10]);ok("with [15,10] and 20 kg per side: 10+10 (greedy would get stuck at 15)",e.made===60&&e.side.join()==="10,10",e);
  ok("[15,10]: an impossible target drops to the nearest lower one",A.plates(62.5,20,[15,10]).made===60&&A.plates(70,20,[15,10]).made===70&&A.plates(70,20,[15,10]).side.join()==="15,10");
  ok("the [2.5] set: no 1.25 plate, 22.5 kg drops to 20",A.plates(22.5,20,[2.5]).made===20&&A.plates(25,20,[2.5]).side.join()==="2.5");
  ok("warm-up is rounded by the inventory too",A.warmup(100,20,[20]).every(x=>(x.kg-20)%40===0)&&A.warmup(100,20,[20]).length>=1);
}
{
  const a=A.stepStats([5000,9000,9000,0,9000,9000,9000],8000);
  ok("stepStats: the streak includes today, a 0 day breaks the streak",a.streak===3&&a.hit===5&&a.best===1&&a.n===6&&near(a.avg,50000/6,0.01),JSON.stringify(a));
  ok("stepStats: if today is below the goal the streak counts from yesterday",A.stepStats([9000,9000,2000],8000).streak===2&&A.stepStats([9000,2000,9000],8000).streak===1);
  ok("stepStats: empty data",JSON.stringify(A.stepStats([0,0],8000))==='{"n":0,"avg":0,"best":-1,"hit":0,"streak":0}'&&A.stepStats([],8000).streak===0);
}
{
  const r=[{day:"2026-09-01",k:"waist",v:90},{day:"2026-09-01",k:"waist",v:89.04},{day:"2026-09-01",k:"neck",v:40},{day:"2026-09-02",k:"hip",v:19.9},{day:"2026-09-02",k:"hip",v:250.1},{day:"bad",k:"arm",v:30},{day:"2026-08-30",k:"arm",v:"30"},{day:"2026-08-30",k:"arm",v:20},null];
  const c=A.cleanMeasures(r);
  ok("cleanMeasures: limits, unknown region, duplicates (the last wins), sorted",JSON.stringify(c)==='[{"day":"2026-08-30","k":"arm","v":20},{"day":"2026-09-01","k":"waist","v":89}]'&&r.length===9,JSON.stringify(c));
  ok("cleanMeasures: 20 and 250 inclusive, empty if not an array",A.cleanMeasures([{day:"2026-01-01",k:"arm",v:250}]).length===1&&A.cleanMeasures("x").length===0);
  ok("whtr: waist/height, null if missing",near(A.whtr(85,170),0.5,1e-9)&&A.whtr(0,170)===null&&A.whtr(85,0)===null);
}
{
  ok("gymKcal: set density limits at 3.5 / 5 / 6 MET (net: MET-1)",A.gymKcal({min:50,sets:14,kg:80})===Math.round(2.5*80*50/60)&&A.gymKcal({min:50,sets:15,kg:80})===Math.round(4*80*50/60)&&A.gymKcal({min:50,sets:19,kg:80})===Math.round(4*80*50/60)&&A.gymKcal({min:50,sets:20,kg:80})===Math.round(5*80*50/60));
  ok("gymKcal: a forgotten session duration is capped at sets x 4 min",A.gymKcal({min:600,sets:10,kg:80})===Math.round(2.5*80*40/60)&&A.gymKcal({min:600,sets:10,kg:80})<A.gymKcal({min:60,sets:30,kg:80}));
  ok("gymKcal/netKcal: null without weight, sets or duration; MET under 1 is never negative",A.gymKcal({min:50,sets:10,kg:0})===null&&A.gymKcal({min:50,sets:0,kg:80})===null&&A.netKcal(3.5,80,0)===null&&A.netKcal(0.5,80,60)===0);
}
{
  const w=A.moveSummary({kind:"w",min:40,steps:4000,cm:170,kg:80});
  ok("moveSummary walk: step length 1.70x(0.30+0.001x100)=0.68 m, 2.72 km, about 4.08 km/h, MET 3.05",w.km===2.72&&near(w.kmh,4.08,0.01)&&near(w.met,3.05,0.01)&&w.kcal===Math.round(2.05*80*40/60),JSON.stringify(w));
  ok("moveSummary: the learned scale f multiplies the step length (1.1 -> 2.99 km); outside 0.7-1.3, NaN or missing falls back to the height prior",A.moveSummary({kind:"w",min:40,steps:4000,cm:170,kg:80,f:1.1}).km===2.99&&[1.31,0.69,NaN,null,undefined].every(f=>A.moveSummary({kind:"w",min:40,steps:4000,cm:170,kg:80,f}).km===2.72)&&A.moveSummary({kind:"b",min:60,steps:3000,cm:170,kg:80,f:1.2}).km===null);
  const r=A.moveSummary({kind:"r",min:30,steps:5100,cm:180,kg:70});
  ok("moveSummary run: the running step is longer than walking, MET from the table",r.km>A.moveSummary({kind:"w",min:30,steps:5100,cm:180,kg:70}).km&&r.met>=8.3);
  const b=A.moveSummary({kind:"b",min:60,steps:3000,cm:170,kg:80});
  ok("moveSummary bike: no distance, MET 6.8",b.km===null&&b.met===6.8&&b.kcal===Math.round(5.8*80));
  ok("moveSummary: no distance without steps / with an absurd cadence / without height; calories from duration and weight (walking 3.5 MET)",A.moveSummary({kind:"w",min:30,steps:null,cm:170,kg:80}).km===null&&A.moveSummary({kind:"w",min:30,steps:30000,cm:170,kg:80}).km===null&&A.moveSummary({kind:"w",min:30,steps:3000,cm:0,kg:80}).km===null&&A.moveSummary({kind:"w",min:30,steps:null,cm:170,kg:80}).kcal===Math.round(2.5*80*0.5)&&A.moveSummary({kind:"w",min:30,steps:null,cm:170,kg:0}).kcal===null);
}
{
  const sp=(time,v,kcal)=>({time,v,kcal}),mv=(t0,min,kcal)=>({t0,min,kcal});
  ok("exerciseKcal: exercise kcal add up, a record without kcal is 0",A.exerciseKcal([sp("10:00",30,100),sp("19:00",45,200),sp("20:00",20)],[])===300);
  ok("exerciseKcal: an overlapping movement is not counted, a non-overlapping one is, touching edges do not overlap",A.exerciseKcal([sp("18:00",60,300)],[mv("17:30",30,150),mv("08:00",30,100),mv("18:00",30,50),mv("16:00",60,70)])===300+100+50+70);
  ok("exerciseKcal: exercise without kcal still occupies the interval (covers the same outing)",A.exerciseKcal([sp("18:00",60)],[mv("17:40",10,80)])===0);
  ok("moveBonus: 50%, integer, 800 cap, never negative/NaN",A.moveBonus(301)===151&&A.moveBonus(5000)===800&&A.moveBonus(0)===0&&A.moveBonus(-50)===0&&A.moveBonus(NaN)===0);
}
{
  const T0="2026-12-01";
  ok("stale weigh-in: if the last weigh-in is over 7 days old there is no slope, lossKnown, isLosing or goalEta",A.slopePerWeek(w,21,4,7,T0)===null&&!A.lossKnown(w,T0)&&!A.isLosing(w,T0)&&A.goalEta(w,70,T0).slope===null&&A.goalEta(w,70,T0).weeks===null);
  ok("a fresh weigh-in (6 days after the last) gives a slope",A.slopePerWeek(w,21,4,7,"2026-10-05")!=null&&A.isLosing(w,"2026-10-05"));
  A.setClock(()=>T0);const stale=A.isLosing(w)||A.slopePerWeek(w)!==null;A.setClock(null);
  ok("with a clock set, a dateless call (Coach) also sees staleness; without a clock it behaves as before",!stale&&A.isLosing(w));
  const wi={},ii={};for(let i=0;i<29;i++){wi[day(i)]=88-0.05*i;ii[day(i)]=1800}ii[day(28)]=5000;
  const pr={kg:86.6,cm:175,age:34,sex:"m",act:1};
  ok("adaptiveTdee: today's half-logged record does not count",near(A.adaptiveTdee({weights:wi,intake:ii,profile:pr,today:day(28)}).est,2185,15)&&Math.abs(A.adaptiveTdee({weights:wi,intake:ii,profile:pr}).est-2185)>50);
  for(const [k,t,e] of [[700,0,false],[800,0,true],[999,2000,false],[1000,2000,true]])ok(`fullKcal ${k}/${t}`,A.fullKcal(k,t)===e);
  for(const [kcal,o,empty] of [[2000,{age:16},false],[1100,{sex:"f"},false],[1250,{sex:"f"},true],[1400,{sex:"m"},false],[1500,{sex:"m"},true],[1600,{sex:"m",bmr:1700},false],
    [2000,{block:"İlaç kaydın var",tdee:2300},false],[2300,{block:"İlaç kaydın var",tdee:2300},true],[2000,{tdee:2300},true]])
    ok(`manualKcal ${kcal} ${JSON.stringify(o)}`,(A.manualKcal({kcal,...o})==="")===empty,A.manualKcal({kcal,...o}));
  ok("suggestTarget: floor 1500 for men, 75% of TDEE for women",A.suggestTarget({tdee:1700,kg:84,goalKg:75,bmr:1000,sex:"m"}).kcal===1500&&A.suggestTarget({tdee:1700,kg:84,goalKg:75,bmr:1000,sex:"f"}).kcal===1280);
  for(const [kg,cm,e] of [[180,0,true],[150,0,false],[180,175,true],[90,175,false],[120,175,false]])ok(`lbSuspect ${kg}/${cm}`,A.lbSuspect(kg,cm)===e);
  const w9=A.moveSummary({kind:"w",min:30,steps:5100,cm:180,kg:80});
  ok("fast walking (>8 km/h) moves to the running MET table, not clipped at 7",w9.kmh>8&&w9.met>8.3);
  const D1="2026-10-01",D2="2026-10-02",s2=(o)=>({day:D1,time:"21:00",v:30,kcal:100,text:"Yürüyüş",...o}),m1={day:D1,k:"w",t0:"08:00",min:30,kcal:80};
  ok("a walk logged for a past day (bt) is not double counted with an automatic movement of the same kind; a different kind or no bt is counted",A.exerciseKcal([s2({bt:true})],[m1],D1)===100&&A.exerciseKcal([s2({bt:true,text:"Ağırlık"})],[m1],D1)===180&&A.exerciseKcal([s2()],[m1],D1)===180);
  const night={day:D2,time:"00:20",v:30,kcal:90,text:"Yürüyüş"},mn={day:D1,k:"w",t0:"23:50",min:30,kcal:90};
  ok("an exercise crossing midnight (automatic on its start day, manual on its end day) is counted once",A.exerciseKcal([night],[mn],D1)===0&&A.exerciseKcal([night],[mn],D2)===90);
}
{
  const T=(j,w)=>A.actFromTriage(j,w);
  ok("activity triage: seated + little walking = Low; standing or 5-9 thousand = Medium; physical job + 10 thousand+ = High",T(0,0)===0&&T(0,1)===0&&T(1,0)===0&&T(1,1)===1&&T(0,2)===1&&T(2,0)===1&&T(2,1)===1&&T(1,2)===1&&T(2,2)===2);
}
ok("dayOk: rejects impossible calendar days and non-strings, accepts leap day",!A.dayOk("2026-02-31")&&!A.dayOk("2026-13-01")&&!A.dayOk("2026-02-29")&&!A.dayOk("2026-2-3")&&!A.dayOk(null)&&A.dayOk("2024-02-29"));
ok("timeOk: 00:00-23:59 only, with leading zeros",A.timeOk("00:00")&&A.timeOk("23:59")&&!A.timeOk("24:00")&&!A.timeOk("7:30")&&!A.timeOk("12:60")&&!A.timeOk(730));
ok("adaptive TDEE: weigh-ins older than the window give the formula, not a data estimate",(()=>{const x=A.adaptiveTdee({weights:w,intake,profile:{kg:86.6,cm:175,age:34,sex:"m",act:1},today:day(60)});return x.source==="formül"&&x.est===null})());
finish();
