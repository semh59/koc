const A=require("../www/algo.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+x));if(!c)bad++};
const near=(a,b,e)=>Math.abs(a-b)<=e;
const day=(i)=>new Date(Date.UTC(2026,8,1+i)).toISOString().slice(0,10);
ok("Epley 62,5x8",near(A.est1RM(62.5,8),79.17,0.01),A.est1RM(62.5,8));
ok("Epley 150x12",near(A.est1RM(150,12),210,0.01));
ok("1 tekrar = kendisi",A.est1RM(100,1)===100); ok("20+ tekrar güvenilmez",A.est1RM(50,25)===0);
ok("hacim",A.volume([{kg:62.5,reps:8,done:true},{kg:62.5,reps:8,done:true},{kg:62.5,reps:7,done:true}])===1437.5);
const w={},intake={};for(let i=0;i<29;i++){w[day(i)]=88-0.05*i;intake[day(i)]=1800}
const sl=A.slopePerWeek(w);ok("eğim ≈ -0,35 kg/hf",near(sl,-0.35,0.01),sl);
const r=A.adaptiveTdee({weights:w,intake,profile:{kg:86.6,cm:175,age:34,sex:"m",act:1}});
ok("uyarlanabilir TDEE ≈ 1800+0,05*7700=2185",near(r.est,2185,15)&&r.source!=="formül",JSON.stringify(r));
ok("veri azsa formüle düşer",A.adaptiveTdee({weights:{[day(0)]:80,[day(3)]:79.8},intake:{},profile:{kg:80,cm:175,age:30,sex:"m",act:1}}).source==="formül");
ok("profil yoksa null",A.adaptiveTdee({weights:{},intake:{},profile:{}}).tdee===null);
const t=A.suggestTarget({tdee:2400,kg:84,goalKg:75,bmr:1800});
ok("hedef: -0,42 kg/hf, taban korunur",t.kcal>=1800&&t.rateKgWk<0,JSON.stringify(t));
const t2=A.suggestTarget({tdee:1600,kg:84,goalKg:75,bmr:1700});ok("taban BMR/1200/%75",t2.kcal>=1700&&t2.limited,JSON.stringify(t2));
ok("bakım",A.suggestTarget({tdee:2300,kg:80,goalKg:0,bmr:1700}).kcal===2300);
ok("ETA",A.etaWeeks(84,75,-0.5)===18&&A.etaWeeks(84,75,0.2)===null&&A.etaWeeks(75.1,75,-0.3)===0);
// B3/B4: tek hız, tek tahmin, kilo veren için "neden" kapısı
const wk=(f,n=22)=>{const o={};for(let i=0;i<n;i++)o[day(i)]=f(i);return o};
ok("isLosing: 14 günde -0,35 kg/hf düşen kilo veriyor",A.isLosing(wk(i=>88-0.05*i)));
ok("isLosing: düz ve artan kilo vermiyor",!A.isLosing(wk(()=>80))&&!A.isLosing(wk(i=>80+0.05*i)));
ok("isLosing: -0,2 kg/hf sınırının altı veriyor, üstü vermiyor",A.isLosing(wk(i=>80-0.04*i))&&!A.isLosing(wk(i=>80-0.02*i)));
ok("isLosing: yalnız son 14 gün sayılır (eski düşüş, yeni plato)",!A.isLosing(wk(i=>i<8?90-0.3*i:87.6)));
ok("isLosing: veri yetersizse veriyor sayılmaz",!A.isLosing({[day(0)]:80,[day(2)]:79}));
let ge=A.goalEta(wk(i=>88-0.05*i),80);
ok("goalEta: tek hız ve tek tahmin (eğim sürerse)",near(ge.slope,-0.35,0.01)&&ge.weeks>=20&&ge.weeks<=23,JSON.stringify(ge));
ok("goalEta: hedef yönü eğimle çelişirse tahmin yok",A.goalEta(wk(i=>88-0.05*i),95).weeks===null&&A.goalEta(wk(i=>80+0.05*i),70).weeks===null);
ok("goalEta: hız ~0 ise tahmin yok, hızı yine verir",A.goalEta(wk(()=>80),70).weeks===null&&A.goalEta(wk(()=>80),70).slope===0);
ok("goalEta: hedefte ya da hedef yoksa tahmin yok, veri yoksa hız yok",A.goalEta(wk(()=>80),80).weeks===null&&A.goalEta(wk(i=>88-0.05*i),0).weeks===null&&A.goalEta({},70).slope===null);
const n1=A.nextTarget([{kg:60,reps:12},{kg:60,reps:12},{kg:60,reps:12}],{lo:8,hi:12,inc:2.5});ok("üst tekrar → +2,5 kg",n1.kg===62.5&&n1.reps===8);
const n2=A.nextTarget([{kg:60,reps:10},{kg:60,reps:8},{kg:60,reps:8}]);ok("aynı kg +1 tekrar",n2.kg===60&&n2.reps===9);
ok("vücut ağırlığı",A.nextTarget([{kg:0,reps:6}]).reps===7); ok("boşsa null",A.nextTarget([])===null);
ok("trend boş gün",Object.keys(A.trend({"2026-09-01":80,"2026-09-05":79})).length===2);
const g=(o)=>A.suggestTarget(Object.assign({tdee:2400,kg:84,goalKg:75,bmr:1800},o));
ok("18 yaş altı açık almaz",g({age:12,cm:165}).kcal===2400&&g({age:12,cm:165}).blocked!=="");
ok("sağlık notu açığı keser",g({age:30,cm:175,health:true}).blocked!==""&&g({age:30,cm:175,health:true}).rateKgWk===0);
ok("düşük BMI hedefi engellenir",A.lossBlock({age:30,cm:175,kg:50,goalKg:38})!=="");
ok("hedef BMI<18,5 engellenir",A.lossBlock({age:30,cm:175,kg:80,goalKg:50})!=="");
ok("sağlıklı yetişkin açık alır",g({age:30,cm:175}).rateKgWk<0&&g({age:30,cm:175}).blocked==="");
const wi={},ii={};for(let i=0;i<29;i++){wi[day(i)]=88-0.05*i;ii[day(i)]=i%2?1800:850}
ok("eksik girilmiş günler sayılmaz",near(A.adaptiveTdee({weights:wi,intake:ii,profile:{kg:86.6,cm:175,age:34,sex:"m",act:1}}).est,2185,15));
const pl=A.plates(100);ok("plaka: 100 kg/20 bar → [25,15]",pl.side.join()==="25,15"&&pl.made===100,pl);
const p61=A.plates(61);ok("plaka: 61 kg → en yakın 60",p61.made===60&&p61.side.join()==="20");
ok("plaka: bar altı hedef → boş liste",A.plates(15).side.length===0&&A.plates(15).made===20);
ok("plaka: 1,25 adımı",A.plates(22.5).side.join()==="1.25"&&A.plates(22.5).made===22.5);
ok("ısınma 100 kg",JSON.stringify(A.warmup(100))===JSON.stringify([{kg:20,reps:10},{kg:40,reps:5},{kg:60,reps:3},{kg:80,reps:1}]),A.warmup(100));
ok("ısınma 30 kg: bar altı ve tekrar atılır",JSON.stringify(A.warmup(30))===JSON.stringify([{kg:20,reps:10},{kg:22.5,reps:1}]),A.warmup(30));
ok("ısınma: hedef bar veya altındaysa boş",A.warmup(20).length===0&&A.warmup(10).length===0);
const n3=A.nextTarget([{kg:60,reps:8},{kg:60,reps:8}],{lo:5,hi:8,inc:2.5});ok("lo5 hi8: 8'e ulaşınca ağırlık artar, 5'ten başlar",n3.kg===62.5&&n3.reps===5,n3);
ok("hacim ısınmayı saymaz",A.volume([{kg:20,reps:10,done:true,w:true},{kg:60,reps:5,done:true}])===300);
const S3=(kg,r)=>[{kg,reps:r},{kg,reps:r},{kg,reps:r}];
const d1=A.nextTarget(S3(60,6),{prev:[S3(60,7)]});ok("aynı ağırlıkta 2 seans alt tekrarın altında: %10 düşür, alt tekrardan başla, neden yazılı",d1.kg===55&&d1.reps===8&&d1.why==="Son 2 seans hedefin altında, %10 düşür",d1);
ok("tek seans altında: eski davranış (+1 tekrar)",A.nextTarget(S3(60,6),{prev:[]}).kg===60&&A.nextTarget(S3(60,6),{prev:[]}).reps===7);
ok("önceki seans farklı ağırlıktaysa düşürülmez",A.nextTarget(S3(60,6),{prev:[S3(65,5)]}).kg===60);
ok("önceki seans aralıktaysa düşürülmez",A.nextTarget(S3(60,6),{prev:[S3(60,9)]}).kg===60);
ok("vücut ağırlığı (0 kg) düşürülmez",A.nextTarget(S3(0,3),{prev:[S3(0,3)]}).kg===0);
ok("düşürme inc'e yuvarlanır ve ağırlığı gerçekten azaltır",A.nextTarget(S3(10,6),{prev:[S3(10,6)],inc:2.5}).kg===7.5);
const dl=A.nextTarget(S3(60,9),{prev:[S3(60,9),S3(60,9)]});ok("3 seans gelişim yok: kg/tekrar aynı, deload notu 'istersen'",dl.kg===60&&dl.reps===10&&/İstersen/.test(dl.note)&&/deload/.test(dl.note),dl);
ok("2 seans yetmez, gelişim varsa not yok",!A.nextTarget(S3(60,9),{prev:[S3(60,9)]}).note&&!A.nextTarget(S3(60,10),{prev:[S3(60,9),S3(60,9)]}).note);
ok("üst tekrara çıkınca ağırlık artar, deload notu eklenmez",!A.nextTarget(S3(60,12),{prev:[S3(60,12),S3(60,12)]}).note&&A.nextTarget(S3(60,12),{prev:[S3(60,12),S3(60,12)]}).kg===62.5);
const WU=[{kg:20,reps:10,w:true},{kg:40,reps:5,w:true}];
ok("ısınma setleri hesaba girmez (en son, önceki ve tek başına)",A.nextTarget(S3(60,9).concat(WU),{}).kg===60&&A.nextTarget(WU)===null&&A.nextTarget(S3(60,6),{prev:[WU.concat(S3(60,6))]}).kg===55&&A.nextTarget(S3(60,6),{prev:[WU]}).kg===60);
{ // plaka envanteri (D-Ant14)
  const DEF=[25,20,15,10,5,2.5,1.25],greedy=(total,bar)=>{let r=(total-bar)/2;const s=[];for(const p of DEF)while(r>=p-1e-9){s.push(p);r-=p}return {side:s,made:bar+2*s.reduce((a,b)=>a+b,0)}};
  let diff=null;for(const bar of [10,15,20])for(let t=0;t<=1000&&!diff;t+=0.25){const a=A.plates(t,bar),b=greedy(t,bar);if(a.side.join()!==b.side.join()||a.made!==b.made)diff=[t,bar,a,b]}
  ok("varsayılan plaka seti eski açgözlü sonuçla birebir aynı (0-1000 kg)",!diff,JSON.stringify(diff));
  const e=A.plates(60,20,[15,10]);ok("[15,10] ile 20 kg/taraf: 10+10 (açgözlü 15'te takılırdı)",e.made===60&&e.side.join()==="10,10",e);
  ok("[15,10]: yapılamayan hedef en yakın alta iner",A.plates(62.5,20,[15,10]).made===60&&A.plates(70,20,[15,10]).made===70&&A.plates(70,20,[15,10]).side.join()==="15,10");
  ok("[2.5] seti: 1,25 plakası yok, 22,5 kg 20'ye iner",A.plates(22.5,20,[2.5]).made===20&&A.plates(25,20,[2.5]).side.join()==="2.5");
  ok("ısınma da envantere göre yuvarlanır",A.warmup(100,20,[20]).every(x=>(x.kg-20)%40===0)&&A.warmup(100,20,[20]).length>=1);
}
{ // D-Adım5
  const a=A.stepStats([5000,9000,9000,0,9000,9000,9000],8000);
  ok("stepStats: seri bugün dahil, 0'lı gün serisini böler",a.streak===3&&a.hit===5&&a.best===1&&a.n===6&&near(a.avg,50000/6,0.01),JSON.stringify(a));
  ok("stepStats: bugün hedefin altındaysa seri dünden sayılır",A.stepStats([9000,9000,2000],8000).streak===2&&A.stepStats([9000,2000,9000],8000).streak===1);
  ok("stepStats: boş veri",JSON.stringify(A.stepStats([0,0],8000))==='{"n":0,"avg":0,"best":-1,"hit":0,"streak":0}'&&A.stepStats([],8000).streak===0);
}
{ // D-Sağ1
  const r=[{day:"2026-09-01",k:"waist",v:90},{day:"2026-09-01",k:"waist",v:89.04},{day:"2026-09-01",k:"neck",v:40},{day:"2026-09-02",k:"hip",v:19.9},{day:"2026-09-02",k:"hip",v:250.1},{day:"bad",k:"arm",v:30},{day:"2026-08-30",k:"arm",v:"30"},{day:"2026-08-30",k:"arm",v:20},null];
  const c=A.cleanMeasures(r);
  ok("cleanMeasures: sınırlar, bilinmeyen bölge, tekrar (son kazanır), sıralı",JSON.stringify(c)==='[{"day":"2026-08-30","k":"arm","v":20},{"day":"2026-09-01","k":"waist","v":89}]'&&r.length===9,JSON.stringify(c));
  ok("cleanMeasures: 20 ve 250 dahil, dizi değilse boş",A.cleanMeasures([{day:"2026-01-01",k:"arm",v:250}]).length===1&&A.cleanMeasures("x").length===0);
  ok("whtr: bel/boy, eksikse null",near(A.whtr(85,170),0.5,1e-9)&&A.whtr(0,170)===null&&A.whtr(85,0)===null);
}
{ // D-Ant10
  ok("gymKcal: set yoğunluğu 3,5 / 5 / 6 MET sınırları (net: MET−1)",A.gymKcal({min:50,sets:14,kg:80})===Math.round(2.5*80*50/60)&&A.gymKcal({min:50,sets:15,kg:80})===Math.round(4*80*50/60)&&A.gymKcal({min:50,sets:19,kg:80})===Math.round(4*80*50/60)&&A.gymKcal({min:50,sets:20,kg:80})===Math.round(5*80*50/60));
  ok("gymKcal: unutulan seans süresi set×4 dk ile sınırlanır",A.gymKcal({min:600,sets:10,kg:80})===Math.round(2.5*80*40/60)&&A.gymKcal({min:600,sets:10,kg:80})<A.gymKcal({min:60,sets:30,kg:80}));
  ok("gymKcal/netKcal: kilo, set ya da süre yoksa null; MET 1 altı negatif olmaz",A.gymKcal({min:50,sets:10,kg:0})===null&&A.gymKcal({min:50,sets:0,kg:80})===null&&A.netKcal(3.5,80,0)===null&&A.netKcal(0.5,80,60)===0);
}
{ // D-Adım3
  const w=A.moveSummary({kind:"w",min:40,steps:4000,cm:170,kg:80});
  ok("moveSummary yürüyüş: adım uzunluğu 1,70×(0,30+0,001×100)=0,68 m, 2,72 km, ~4,08 km/s, MET 3,05",w.km===2.72&&near(w.kmh,4.08,0.01)&&near(w.met,3.05,0.01)&&w.kcal===Math.round(2.05*80*40/60),JSON.stringify(w));
  const r=A.moveSummary({kind:"r",min:30,steps:5100,cm:180,kg:70});
  ok("moveSummary koşu: koşu adımı yürüyüşten uzun, MET tablodan",r.km>A.moveSummary({kind:"w",min:30,steps:5100,cm:180,kg:70}).km&&r.met>=8.3);
  const b=A.moveSummary({kind:"b",min:60,steps:3000,cm:170,kg:80});
  ok("moveSummary bisiklet: mesafe yok, MET 6,8",b.km===null&&b.met===6.8&&b.kcal===Math.round(5.8*80));
  ok("moveSummary: adım yok / ritim saçma / boy yoksa mesafe yok, kalori süre ve kiloyla (yürüyüş 3,5 MET)",A.moveSummary({kind:"w",min:30,steps:null,cm:170,kg:80}).km===null&&A.moveSummary({kind:"w",min:30,steps:30000,cm:170,kg:80}).km===null&&A.moveSummary({kind:"w",min:30,steps:3000,cm:0,kg:80}).km===null&&A.moveSummary({kind:"w",min:30,steps:null,cm:170,kg:80}).kcal===Math.round(2.5*80*0.5)&&A.moveSummary({kind:"w",min:30,steps:null,cm:170,kg:0}).kcal===null);
}
{ // D-Adım4
  const sp=(time,v,kcal)=>({time,v,kcal}),mv=(t0,min,kcal)=>({t0,min,kcal});
  ok("exerciseKcal: spor kcal toplanır, kcal'siz kayıt 0",A.exerciseKcal([sp("10:00",30,100),sp("19:00",45,200),sp("20:00",20)],[])===300);
  ok("exerciseKcal: çakışan hareket sayılmaz, çakışmayan sayılır, kenar teması çakışma değil",A.exerciseKcal([sp("18:00",60,300)],[mv("17:30",30,150),mv("08:00",30,100),mv("18:00",30,50),mv("16:00",60,70)])===300+100+50+70);
  ok("exerciseKcal: kcal'siz spor da aralık sayılır (aynı çıkışı kaplar)",A.exerciseKcal([sp("18:00",60)],[mv("17:40",10,80)])===0);
  ok("moveBonus: %50, tamsayı, 800 üst sınır, asla negatif/NaN",A.moveBonus(301)===151&&A.moveBonus(5000)===800&&A.moveBonus(0)===0&&A.moveBonus(-50)===0&&A.moveBonus(NaN)===0&&A.moveBonus(200,1)===200);
}
process.exit(bad?1:0);
