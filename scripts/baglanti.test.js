const B=require("../www/modules/analiz/baglantilib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const T="2026-10-06",key=o=>new Date(Date.UTC(2026,9,6+o)).toISOString().slice(0,10);
const offs=n=>Array.from({length:n},(_,i)=>-i-1);
const mk=(n,f)=>{const sleep=[],mood=[];offs(n).forEach((o,i)=>{const s=f(i);sleep.push({day:key(o-1),min:s[0]});mood.push({day:key(o),v:s[1]})});return {today:T,sleep,mood}};
let r=B.analyze(mk(20,i=>i%2?[480,4]:[360,2]));
ok("uyku: 7 sa üstü ertesi gün ruh hali 4,0 / altı 2,0",r.length===1&&/7 sa ve üstü.*ortalama 4,0.*daha kısa.* 2,0 /.test(r[0].text),r);
ok("uyku: 13 çift yetmez",B.analyze(mk(13,i=>i%2?[480,4]:[360,2])).length===0);
ok("uyku: bir grup 4'ten azsa gizli",B.analyze(mk(20,i=>i<3?[360,2]:[480,4])).length===0);
ok("uyku: yalnız son 60 gün sayılır",B.analyze(mk(80,i=>[i%2?480:360,3]))[0].n<=60);
ok("uyku: fark küçükse 'belirgin fark yok'",/belirgin bir fark görünmüyor/.test(B.analyze(mk(20,i=>[i%2?480:360,3]))[0].text));
const steps={},mood=[];offs(20).forEach((o,i)=>{steps[key(o)]=i%2?9000:3000;mood.push({day:key(o),v:i%2?5:3})});
r=B.analyze({today:T,sleep:[],mood,steps});
ok("adım: medyan üstü 5,0 / altı 3,0",r.length===1&&/6\.000/.test(r[0].text)&&/5,0/.test(r[0].text)&&/3,0/.test(r[0].text),r);
const kcal={},weights={};
for(let w=0;w<6;w++)for(let i=0;i<7;i++){const o=-(w*7+i);kcal[key(o)]=w%2?2600:1800}
for(let o=-42;o<=0;o+=3){const w=Math.floor(-o/7);weights[key(o)]=80+(o+42)*(w%2?0.02:-0.02)}
r=B.analyze({today:T,sleep:[],mood:[],kcal,weights});
ok("kalori ↔ kilo trendi haftalık bloklarla",r.length===1&&r[0].id==="kalori"&&/kcal/.test(r[0].text),r);
ok("veri yok ve çöp girdi: boş, hata atmaz",B.analyze({today:T}).length===0&&B.analyze({today:T,sleep:[{day:key(-1),min:400}],mood:[],kcal:{},weights:{}}).length===0);
const all=JSON.stringify(B.analyze(mk(20,i=>i%2?[480,4]:[360,2])).concat(r));
ok("dil: teşhis/skor/neden-sonuç iddiası yok",!/depresyon|bozukluk|skor|tedavi|teşhis|neden olur|sebep/i.test(all),all);
process.exit(bad?1:0);
