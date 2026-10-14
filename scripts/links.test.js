const {ok,finish}=require("./ok");
const B=require("../www/modules/insights/linkslib.js");
const T="2026-10-06",key=o=>new Date(Date.UTC(2026,9,6+o)).toISOString().slice(0,10);
const offs=n=>Array.from({length:n},(_,i)=>-i-1);
/* Sleep is stored on the wake-up day, so each night pairs with the same day's mood. */
const mk=(n,f)=>{const sleep=[],mood=[];offs(n).forEach((o,i)=>{const s=f(i);sleep.push({day:key(o),min:s[0]});mood.push({day:key(o),v:s[1]})});return {today:T,sleep,mood}};
const nz=i=>(i%5-2)*0.25,hl=i=>i%2?[480,4+nz(i)]:[360,2+nz(i)];
let r=B.analyze(mk(20,hl));
ok("sleep: 7 h and above gives next-day mood about 4 vs 2 below, with a clear-hint label and the day count",r.length===1&&/7 sa ve üstü.*ortalama [34],\d.*daha kısa.* [12],\d /.test(r[0].text)&&/\(belirgin ipucu\), 20 günlük kayıttan\.$/.test(r[0].text),r);
ok("sleep: 13 pairs are not enough",B.analyze(mk(13,hl)).length===0);
ok("sleep: a group with fewer than 4 days is hidden",B.analyze(mk(20,i=>i<3?[360,2+nz(i)]:[480,4+nz(i)])).length===0);
ok("sleep: only the last 60 days count",B.analyze(mk(80,hl))[0].n<=60);
{const q=B.analyze(mk(20,i=>[i%2?480:360,3+nz(i)]));ok("sleep: no difference gives no sentence, only the quiet count",q.length===0&&q.quiet===1,q);
const w=B.analyze(mk(30,i=>[i%2?480:360,3+(i%2?0.25:-0.25)+((i*7)%11-5)*0.2]));ok("sleep: a moderate difference is labelled a weak hint, never clear",w.length===1&&w[0].grade==='weak'&&/zayıf ipucu, tesadüf olabilir/.test(w[0].text),w);
ok("sleep: zero spread gives no label",B.analyze(mk(20,i=>i%2?[480,4]:[360,2])).length===0);}
const steps={},mood=[];offs(20).forEach((o,i)=>{steps[key(o)]=i%2?9000:3000;mood.push({day:key(o),v:(i%2?5:3)+nz(i)})});
r=B.analyze({today:T,sleep:[],mood,steps});
ok("steps: above-median days 5.0 vs below-median 3.0",r.length===1&&/6\.000/.test(r[0].text)&&/[45],\d/.test(r[0].text)&&/[23],\d/.test(r[0].text),r);
const kcal={},weights={};
for(let w=0;w<6;w++)for(let i=0;i<7;i++){const o=-(w*7+i);kcal[key(o)]=w%2?2600:1800}
for(let o=-42;o<=0;o+=3){const w=Math.floor(-o/7);weights[key(o)]=80+(o+42)*(w%2?0.02:-0.02)}
for(let i=0;i<42;i++)kcal[key(-i)]+=(i%7-3)*40;
r=B.analyze({today:T,sleep:[],mood:[],kcal,weights});
ok("calories vs weight trend in weekly blocks",r.length===1&&r[0].id==="calories"&&/kcal/.test(r[0].text),r);
{const ends={[key(-42)]:80,[key(0)]:78},old={};for(let i=43;i<1200;i+=3)old[key(-i)]=85;
ok("calories: weeks without a weigh-in inside them are skipped",B.analyze({today:T,sleep:[],mood:[],kcal,weights:ends}).length===0);
{const o=B.analyze({today:T,sleep:[],mood:[],kcal,weights:{...old,...weights}});ok("calories: years of older weigh-ins do not break the weekly blocks",o.length+o.quiet===1,o);}}
ok("no data and garbage input: empty result, no throw",B.analyze({today:T}).length===0&&B.analyze({today:T,sleep:[{day:key(-1),min:400}],mood:[],kcal:{},weights:{}}).length===0);
{const sl=[],stp={};offs(30).forEach((o,i)=>{sl.push({day:key(o),min:(i%2?300:480)+(i%5-2)*8});stp[key(o-1)]=i%2?2000:9000});
const z=B.analyze({today:T,sleep:sl,mood:[],steps:stp});ok("steps of the day before vs that night's sleep",z.length===1&&z[0].id==='stepsleep'&&/Önceki gün/.test(z[0].text)&&/\(belirgin ipucu\)/.test(z[0].text),z);}
const all=JSON.stringify(B.analyze(mk(20,hl)).concat(r));
ok("wording: no diagnosis, score or cause-and-effect claim",!/depresyon|bozukluk|skor|tedavi|teşhis|neden olur|sebep|yüksek|düşük|normal/i.test(all),all);
{ // strength next to the weight trend
  const strong=id=>id!=="run",set=(kg,reps,o={})=>({kg,reps,done:true,...o});
  const wk=(o,kg)=>({day:key(o),t1:1,ex:["squat","bench","row"].map(id=>({id,sets:[set(kg,5),set(20,12,{w:true}),set(kg*2,15,{t:"d"})]}))});
  const early=[-26,-23,-20,-17].map(o=>wk(o,100)),late=[-10,-6,-2].map(o=>wk(o,104));
  const wts={};for(let o=-30;o<=0;o+=2)wts[key(o)]=82-(o+30)*0.04;
  const line=B.strength(early.concat(late),strong,wts,T);
  ok("strength line: weight trend change and the average 1RM change are shown side by side, with the no-cause note",/^Son 4 haftada kilo trendin -\d/.test(line)&&line.includes("3 ana egzersizde tahmini 1TM değişimi ortalama +%4.")&&/nedeni olmayabilir/.test(line),line);
  ok("strength line: warm-up sets and drop sets do not move the estimate (+4 %, not the drop set's 15 reps)",line.includes("+%4."));
  ok("strength line: under 6 sessions, under 3 shared lifts, no weigh-ins or no finished workouts give nothing",B.strength(early.slice(0,2).concat(late.slice(0,3)),strong,wts,T)===null&&B.strength(early.concat(late).map(w=>({...w,ex:w.ex.slice(0,2)})),strong,wts,T)===null&&B.strength(early.concat(late),strong,{},T)===null&&B.strength(early.concat(late).map(w=>({...w,t1:null})),strong,wts,T)===null);
  ok("strength line: weigh-ins months old give nothing",B.strength(early.concat(late),strong,Object.fromEntries(Object.entries(wts).map(([k,v])=>[key(-200+Number(k.slice(8))),v])),T)===null);
  ok("strength line: wording has no cause, advice or assessment",!/neden olur|sebep|öner|tavsiye|iyi|kötü|başarı|hedef/i.test(line.replace("nedeni olmayabilir","")),line);
}
finish();
