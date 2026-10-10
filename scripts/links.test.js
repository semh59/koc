const {ok,finish}=require("./ok");
const B=require("../www/modules/insights/linkslib.js");
const T="2026-10-06",key=o=>new Date(Date.UTC(2026,9,6+o)).toISOString().slice(0,10);
const offs=n=>Array.from({length:n},(_,i)=>-i-1);
/* Sleep is stored on the wake-up day, so each night pairs with the same day's mood. */
const mk=(n,f)=>{const sleep=[],mood=[];offs(n).forEach((o,i)=>{const s=f(i);sleep.push({day:key(o),min:s[0]});mood.push({day:key(o),v:s[1]})});return {today:T,sleep,mood}};
let r=B.analyze(mk(20,i=>i%2?[480,4]:[360,2]));
ok("sleep: 7 h and above gives next-day mood 4.0 vs 2.0 below",r.length===1&&/7 sa ve üstü.*ortalama 4,0.*daha kısa.* 2,0 /.test(r[0].text),r);
ok("sleep: 13 pairs are not enough",B.analyze(mk(13,i=>i%2?[480,4]:[360,2])).length===0);
ok("sleep: a group with fewer than 4 days is hidden",B.analyze(mk(20,i=>i<3?[360,2]:[480,4])).length===0);
ok("sleep: only the last 60 days count",B.analyze(mk(80,i=>[i%2?480:360,3]))[0].n<=60);
ok("sleep: a small difference reads as \"no clear difference\"",/belirgin bir fark görünmüyor/.test(B.analyze(mk(20,i=>[i%2?480:360,3]))[0].text));
const steps={},mood=[];offs(20).forEach((o,i)=>{steps[key(o)]=i%2?9000:3000;mood.push({day:key(o),v:i%2?5:3})});
r=B.analyze({today:T,sleep:[],mood,steps});
ok("steps: above-median days 5.0 vs below-median 3.0",r.length===1&&/6\.000/.test(r[0].text)&&/5,0/.test(r[0].text)&&/3,0/.test(r[0].text),r);
const kcal={},weights={};
for(let w=0;w<6;w++)for(let i=0;i<7;i++){const o=-(w*7+i);kcal[key(o)]=w%2?2600:1800}
for(let o=-42;o<=0;o+=3){const w=Math.floor(-o/7);weights[key(o)]=80+(o+42)*(w%2?0.02:-0.02)}
r=B.analyze({today:T,sleep:[],mood:[],kcal,weights});
ok("calories vs weight trend in weekly blocks",r.length===1&&r[0].id==="calories"&&/kcal/.test(r[0].text),r);
{const ends={[key(-42)]:80,[key(0)]:78},old={};for(let i=43;i<1200;i+=3)old[key(-i)]=85;
ok("calories: weeks without a weigh-in inside them are skipped",B.analyze({today:T,sleep:[],mood:[],kcal,weights:ends}).length===0);
ok("calories: years of older weigh-ins change nothing for the weeks in the window",JSON.stringify(B.analyze({today:T,sleep:[],mood:[],kcal,weights:{...old,...weights}})).includes('"calories"'));}
ok("no data and garbage input: empty result, no throw",B.analyze({today:T}).length===0&&B.analyze({today:T,sleep:[{day:key(-1),min:400}],mood:[],kcal:{},weights:{}}).length===0);
const all=JSON.stringify(B.analyze(mk(20,i=>i%2?[480,4]:[360,2])).concat(r));
ok("wording: no diagnosis, score or cause-and-effect claim",!/depresyon|bozukluk|skor|tedavi|teşhis|neden olur|sebep/i.test(all),all);
finish();
