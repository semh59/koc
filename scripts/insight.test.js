const {ok,finish}=require("./ok");
const I=require("../www/modules/coach/insightlib.js");
const T="2026-10-02",key=o=>new Date(Date.UTC(2026,9,2+o)).toISOString().slice(0,10);
const W=(offs,f)=>Object.fromEntries(offs.map((o,i)=>[key(o),Math.round(f(o,i)*10)/10]));
const D10=[-20,-18,-16,-14,-12,-9,-7,-5,-2,0],N=[0.2,-0.1,0.3,-0.2,0,0.1,-0.3,0.2,-0.1,0];

let p=I.plateau(W(D10,(o,i)=>80+N[i]),T);
ok("flat series (±0.3 kg, 21 days, 10 weigh-ins) -> plateau",p.ok&&p.enough,p);
p=I.plateau(W(D10,(o,i)=>80-o*0.5/7+N[i]),T);
ok("-0.5 kg/week series -> not a plateau",!p.ok&&p.slope<-0.4,p);
p=I.plateau(W([-20,-13,-6,0],()=>80),T);
ok("4 weigh-ins -> not enough data",!p.ok&&!p.enough);
ok("6 weigh-ins but a span under 14 days -> not enough",!I.plateau(W([-12,-10,-8,-6,-3,0],()=>80),T).enough);
ok("6 weigh-ins -> not enough for a noise estimate (at least 8)",!I.plateau(W([-20,-16,-12,-8,-4,0],()=>80),T).enough);
p=I.plateau(W([-15,-13,-11,-9,-6,-4,-2,0],(o,i)=>80+[1.6,-1.7,1.5,-1.4,1.8,-1.6,1.2,-1.5][i]),T);
ok("very noisy (±1.6) short series: wide confidence interval -> not a plateau",!p.ok&&p.enough&&p.ci>0.3,p);
ok("last weigh-in older than 7 days -> not enough",!I.plateau(W(D10.map(o=>o-8),(o,i)=>80+N[i]),T).enough);
ok("plateau returns the span in days",I.plateau(W(D10,(o,i)=>80+N[i]),T).days===20);
p=I.plateau(W([-20,-19,-18,-17,-16,-15,-1,0],(o,i)=>80+[0.1,-0.1,0,0.1,-0.1,0,0.1,-0.1][i]),T);
ok("clustered irregular spacing: weigh-ins at both ends, flat -> plateau",p.ok,p);
ok("an old flat series (last weigh-in 30 days ago) is not a plateau",!I.plateau(W(D10.map(o=>o-30),(o,i)=>80+N[i]),T).enough);
ok("no weigh-ins: not enough data, no noise estimate",!I.plateau({},T).enough&&I.noiseSd({},T)===null);
ok("noiseSd: small on a flat series, needs at least 8 weigh-ins",I.noiseSd(W(D10,(o,i)=>80+N[i]),T)<0.3&&I.noiseSd(W([-12,-10,-8,-6,-4,-2,0],(o,i)=>80+N[i]),T)===null);

// Seeded simulation: 49 days, weigh-in probability q per day (every day, 80%, 4 days a week), daily noise sd (normal).
{
  let seed=20261002;const rnd=()=>(seed=seed*16807%2147483647)/2147483647,gauss=()=>Math.sqrt(-2*Math.log(rnd()))*Math.cos(2*Math.PI*rnd());
  const rate=(f,sd,q,R=600)=>{let k=0;for(let r=0;r<R;r++){const w={};for(let o=-48;o<=0;o++)if(o===0||rnd()<q)w[key(o)]=80+f(o)+sd*gauss();if(I.plateau(w,T).ok)k++}return Math.round(k/R*100)};
  const S={flat:()=>0,k3:o=>-0.3*o/7,k5:o=>-0.5*o/7,a3:o=>0.3*o/7,fresh:o=>o<-21?0:-0.5*(o+21)/7},res=[];
  for(const q of [1,0.8,4/7])for(const sd of [0.4,0.7,1.0]){const r={q:Math.round(q*100),sd};for(const k in S)r[k]=rate(S[k],sd,q);res.push(r)}
  ok("simulation: sd 0.4 and 0.7 detect a flat series at 65% or more (every day, 80%, 4 days a week)",res.every(r=>r.flat>=65||r.sd===1),res);
  ok("simulation: even at sd 1.0 and 4 days a week a flat series is caught at least 50% (realistic limit)",res.every(r=>r.flat>=50),res);
  ok("simulation: false plateau at most 5% when losing 0.3 and 0.5 kg/week",res.every(r=>r.k3<=5&&r.k5<=5),res);
  ok("simulation: false plateau at most 5% when gaining 0.3 kg/week",res.every(r=>r.a3<=5),res);
  ok("simulation: false plateau at most 5% for 4 flat weeks then -0.5 kg/week for 3 weeks",res.every(r=>r.fresh<=5),res);
}
p=I.plateau(W([-45,-42,-38,-35,-31,-28,-24,-21,-17,-14,-10,-7,-3,0],(o,i)=>80+[0.9,-1,0.8,-0.9,1,-0.8,0.9,-1,0.8,-0.9,1,-0.8,0.9,-0.9][i]),T);
ok("a sparse noisy flat series does not decide at 35 days, extends to 49 days; the span is the real spread",p.ok&&p.days===45,p);

const day=(kcal,water,ad,sl)=>({kcal,water,ad,sl});
const days=Array.from({length:22},(_,i)=>i<14?day(2000,1500,9000):i<21?day(i%2?2100:300,2000,6000,i===20?420:null):day(400,250,500,null));
let w=I.weekWhy({days,goalKcal:1800,goalWater:2500,weights:W([-12,-5,-1],(o)=>o<-7?81:80.8),today:T});
const by=k=>(w.find(x=>x.k===k)||{}).t;
ok("weekWhy: counts incompletely logged days, does not count today as incomplete",by("kcal")==="Kalori: tam kayıtlı 3 günde ortalama 2100 kcal, hedefin 1800 kcal. 4 günün kaydı eksik ya da 800 kcal altında, ortalamaya katılmadı.",by("kcal"));
ok("weekWhy: water and steps (7 days vs the previous 14) numbers come from the app",by("water")==="Su: kayıtlı 7 günde ortalama 2000 ml, hedefin 2500 ml."&&by("steps")==="Adım: son 7 günde günlük ortalama 6000, önceki 14 günde 9000.",[by("water"),by("steps")]);
ok("weekWhy: average hours when sleep data exists",by("sleep")==="Uyku: 1 gecenin ortalaması 7 saat.",by("sleep"));
ok("weekWhy: weekly weight difference",by("tarti")&&by("tarti").startsWith("Tartı: haftalık fark -0,2 kg"),by("tarti"));
w=I.weekWhy({days:days.map(x=>Object.assign({},x,{sl:null})),goalKcal:0,weights:{},today:T});
ok("weekWhy: without a goal the calorie factor says \"no goal\"",by("kcal").startsWith("Kalori: hedef yok;"),by("kcal"));
ok("weekWhy: no sleep factor without sleep data",!w.some(x=>x.k==="sleep"));
ok("weekWhy: without weigh-ins it says two weeks of weigh-ins are needed",by("tarti").includes("iki haftada"));
const flat=W([-27,-24,-21,-18,-15,-12,-10,-8,-6,-4,-2,0],(o,i)=>80+[0.3,-0.4,0.5,-0.3,0.4,-0.5,0.2,-0.4,0.5,-0.3,0.1,0.3][i]);
w=I.weekWhy({days,goalKcal:1800,weights:flat,today:T});
ok("weekWhy: a difference under 2x the residual sd gets the weigh-in noise label",by("tarti").includes("tartı oynaması aralığında"),by("tarti"));
ok("weekWhy: no days and no weigh-ins still gives the calorie and weight factors",I.weekWhy({days:[],weights:{},today:T}).map(x=>x.k).join()==="kcal,tarti");
const BAN=/metabolizma|yavaşla|tanı|hastal|suç|başarısız|tembel|yapmadın|yemedin|kötü|hata/i;
const all=[...I.weekWhy({days,goalKcal:1800,goalWater:2500,weights:flat,today:T}),...I.weekWhy({days:[],weights:W([-10,-1],()=>80),today:T}),...I.weekWhy({days,today:T,weights:W([-9,0],o=>o?79:80)})];
ok("weekWhy texts: no blaming or medical wording, each at most 160 characters",all.every(x=>!BAN.test(x.t)&&x.t.length<=160),all.filter(x=>BAN.test(x.t)||x.t.length>160));
{const d1=Array.from({length:22},(_,i)=>day(i===16?2000:300,1500,9000)),t=(I.weekWhy({days:d1,goalKcal:1800,weights:{},today:T}).find(x=>x.k==="kcal")||{}).t;
ok("weekWhy: a single fully logged day is not an average, the minimum day count is stated",/yalnız 1 gün var, ortalama için en az 3 gün/.test(t)&&!/ortalama \d+ kcal/.test(t),t);}
finish();
