/* Calorie target suggestion from the weight trend: pace, limits, brakes, muting, insufficient data. */
const {ok,finish}=require("./ok");
const G=require("../www/modules/insights/goallib.js"),A=require("../www/kernel/algo.js");
const T="2026-10-06",day=n=>{const d=new Date(Date.UTC(2026,9,6)+n*864e5);return d.toISOString().slice(0,10)};
/* weekly slope sl (kg/week), a weigh-in every 3 days over the last 21 days */
const wts=(sl,kg0=80)=>{const w={};for(let i=-21;i<=0;i+=3)w[day(i)]=kg0+sl*(i/7);return w};
const eat=(k,n=14)=>{const o={};for(let i=1;i<=n;i++)o[day(-i)]=k;return o};
const base=(o={})=>({w:wts(-1),kcal:2000,tdee:2600,bmr:1700,ri:{kg:80,goalKg:75,age:35,sex:"m",cm:178,healthNote:"",meds:0,today:T},intake:eat(2000),today:T,at:"",...o});
const s=o=>G.suggest(base(o));
{ const g=s();
  ok("target pace about -0.4 kg/week, actual -1: suggestion capped at +250 kcal",g&&g.kcal===2250&&g.delta===250&&Math.abs(g.slope+1)<0.01&&g.rate<0,g);
  const h=s({w:wts(-0.4)});ok("pace close to the target (deviation under 0.15): no suggestion",h===null,h);
  const y=s({w:wts(0)});ok("weight flat, goal is loss: suggests cutting calories",y&&y.delta<0&&y.kcal>=1950,y);
  const k=s({w:wts(0),kcal:2230,intake:eat(2230)});ok("suggestion is at most 250 kcal and rounded to 10",k&&k.delta===-250&&k.kcal===1980,k);
}
{ ok("lower limit (men 1500, 75% of TDEE): the suggestion is clamped to it",s({w:wts(0),kcal:2100,intake:eat(2100)})?.kcal===Math.max(1500,2600*0.75));
  ok("already at the floor: no further cut",s({w:wts(0),kcal:1950,intake:eat(1950)})===null);
  const hi=s({w:wts(-2),kcal:3300,tdee:2600,intake:eat(3300)});ok("upper limit TDEE x 1.3: the suggestion is clamped to it",hi?.kcal===2600*1.3,hi);
}
{ ok("under 18: no suggestion",s({ri:{...base().ri,age:16}})===null);
  ok("eating-disorder marker: no suggestion",s({ri:{...base().ri,healthNote:"yeme bozukluğum var"}})===null);
  ok("pregnancy: no suggestion",s({ri:{...base().ri,healthNote:"hamileyim"}})===null);
  ok("BMI under 18.5: no suggestion",s({ri:{...base().ri,kg:50}})===null);
  ok("soft brake (doctor note) and a cut direction: no suggestion",s({w:wts(0),ri:{...base().ri,healthNote:"tansiyon"}})===null);
  ok("soft brake: a suggestion that would go below maintenance (kcalBlocked) is blocked",s({w:wts(-1),ri:{...base().ri,healthNote:"tansiyon"}})===null);
  const up=s({w:wts(-1),kcal:2400,intake:eat(2400),ri:{...base().ri,healthNote:"tansiyon"}});ok("soft brake: a suggestion up to maintenance still passes",up&&up.kcal>=2550,up);
}
{ ok("under 14 days of data: no suggestion",s({w:Object.fromEntries(Object.entries(wts(-1)).filter(([k])=>k>=day(-9)))})===null);
  ok("last weigh-in older than 7 days: no suggestion",s({w:Object.fromEntries(Object.entries(wts(-1)).map(([k,v])=>[day(A.dayNum(k)-A.dayNum(T)-9),v]))})===null);
  ok("fewer fully logged days than MIN_AVG_DAYS: no suggestion",s({intake:eat(2000,A.MIN_AVG_DAYS-1)})===null);
  ok("half-logged days (under 800) do not count",s({intake:eat(600)})===null);
  ok("target not followed (average outside 15%): no suggestion",s({intake:eat(2600)})===null);
  ok("no goal weight: no suggestion",s({ri:{...base().ri,goalKg:0}})===null);
}
{ ok("less than 7 days since the last decision: quiet",s({at:day(-6)})===null);
  ok("suggests again after 7 days (the dismissal mute ends)",s({at:day(-7)})!==null);
}
finish();
