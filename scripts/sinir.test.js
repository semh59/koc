/* Sınır değer testleri: formül katsayıları ve eşikler bir birim kayınca test kırılır (mutasyon taramasında yaşayan mutantlardan eklendi). */
const A=require("../www/algo.js"),C=require("../www/cyclelib.js"),L=require("../www/loglib.js"),P=require("../www/pulselib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const near=(a,b,e=0.01)=>Math.abs(a-b)<=e;
const day=i=>new Date(Date.UTC(2026,8,1+i)).toISOString().slice(0,10);

// Mifflin-St Jeor ve hareket çarpanları (bilinen elle hesap)
ok("BMR erkek 80 kg 170 cm 30 yaş = 1717,5",A.bmrMifflin({kg:80,cm:170,age:30,sex:"m"})===1717.5);
ok("BMR kadın 60 kg 165 cm 25 yaş = 1345,25",A.bmrMifflin({kg:60,cm:165,age:25,sex:"f"})===1345.25);
ok("BMR cinsiyet belirtilmeyen 70 kg 170 cm 40 yaş = 1484,5 (−78)",A.bmrMifflin({kg:70,cm:170,age:40,sex:""})===1484.5);
const p={kg:80,cm:170,age:30,sex:"m"};
ok("TDEE çarpanları 1,3 / 1,45 / 1,6, belirtilmeyen 1,45",near(A.formulaTdee({...p,act:0}),2232.75)&&near(A.formulaTdee({...p,act:1}),2490.375)&&near(A.formulaTdee({...p,act:2}),2748)&&near(A.formulaTdee(p),2490.375));

// Güvenlik freni sınırları
const rf=o=>A.riskFlags({age:30,cm:170,kg:70,goalKg:0,healthNote:"",today:"2026-10-09",...o});
ok("18 yaş altı engel: 17 engellenir, 18 engellenmez",rf({age:17}).hard.length===1&&rf({age:18}).hard.length===0&&rf({age:0}).hard.length===0);
ok("BMI 18,5 sınırı (170 cm): 53,4 kg engel, 53,5 kg değil",rf({kg:53.4}).hard.length===1&&rf({kg:53.5}).hard.length===0);
ok("hedef kilo BMI 18,5 sınırı: 53,4 hedef engel, 53,5 değil",rf({goalKg:53.4}).hard.length===1&&rf({goalKg:53.5}).hard.length===0);

// Uyarlanabilir harcama: 10 gün eşiği, güven 21 günde 1, formülün %70-130 sınırı
const W={};for(const i of [0,7,14,21,27])W[day(i)]=80;
const intake=n=>Object.fromEntries(Array.from({length:n},(_,i)=>[day(27-i),3000]));
const f=A.formulaTdee({...p,act:1}),run=n=>A.adaptiveTdee({weights:W,intake:intake(n),profile:{...p,act:1},today:"2026-12-01"});
ok("9 gün kayıtla veri tahmini yok (formül), 10 günle var",run(9).source==="formül"&&run(9).est===null&&run(10).est!==null);
ok("güven = gün sayısı / 21 (10 gün 0,476; 21 gün 1)",near(run(10).confidence,10/21,1e-6)&&run(21).confidence===1&&run(25).confidence===1);
ok("harcama = güven × tahmin + (1 − güven) × formül (10 gün, alım 3000, sabit kilo)",near(run(10).tdee,10/21*3000+(1-10/21)*f,0.01));
const hi=A.adaptiveTdee({weights:W,intake:Object.fromEntries(Array.from({length:21},(_,i)=>[day(27-i),6000])),profile:{...p,act:1},today:"2026-12-01"});
const lo=A.adaptiveTdee({weights:W,intake:Object.fromEntries(Array.from({length:21},(_,i)=>[day(27-i),1300])),profile:{...p,act:1},today:"2026-12-01"});
ok("tahmin formülün %130 ve %70 sınırıyla kırpılır",near(hi.est,f*1.3,0.01)&&near(lo.est,f*0.7,0.01),[hi.est,lo.est,f]);

// Döngü uzunluğu aralığı 15-60 gün
const rows=gaps=>{let d="2026-01-01";const r=[{s:d}];for(const g of gaps){d=C.addDays(d,g);r.push({s:d})}return r};
ok("döngü uzunluğu 15 ve 60 dahil, 14 ve 61 hariç",JSON.stringify(C.lengths(rows([15,60,14,61,28])))==="[15,60,28]");

// Kamerayla nabız: parmak eşiği
ok("parmak denetimi: kırmızı 90 altı ya da kırmızı/yeşil oranı 1,5 altı reddedilir",P.finger(90,30)&&!P.finger(89,20)&&!P.finger(200,150)&&P.finger(200,60));

// Son yenenler 30 gün penceresi
const ent=(d,id)=>({id,type:"yemek",day:d,text:"Menemen"+id,v:300});
const t0="2026-10-09";
ok("son yenenler: 30 gün öncesi dahil, 31 gün öncesi hariç",L.recents([ent("2026-09-09",1)],t0).length===1&&L.recents([ent("2026-09-08",2)],t0).length===0);

console.log(bad?"Başarısız: "+bad:"Tüm sınır testleri geçti");process.exit(bad?1:0);
