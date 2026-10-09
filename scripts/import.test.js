const I=require("../www/modules/gym/importlib.js"),fs=require("fs");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const EXDB=new Function(fs.readFileSync(__dirname+"/../www/modules/gym/exlib.js","utf8")+";return EXDB")();
const lib=EXDB.map(e=>({id:e.id,n:e.n,k:e.k||"w"}));
const find=I.matcher(lib);
const ctx=(o={})=>Object.assign({find,existing:[],gid:10},o);
const STRONG='Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE\n'
 +'2024-03-15 18:30:00,"Push, günü",1h 5m,Bench Press (Barbell),W,20,10,0,0,,,\n'
 +'2024-03-15 18:30:00,"Push, günü",1h 5m,Bench Press (Barbell),1,135,5,0,0,"ilk satır\nikinci satır ""tırnaklı""",,8.5\n'
 +'2024-03-15 18:30:00,"Push, günü",1h 5m,Bench Press (Barbell),Rest Timer,0,0,0,90,,,\n'
 +'2024-03-15 18:30:00,"Push, günü",1h 5m,Zarp Zurp Machine,1,50,12,0,0,,,\n'
 +'2024-03-15 18:30:00,"Push, günü",1h 5m,Wall Sit,1,0,0,0,60,,,\n'
 +'2024-03-17 07:00:00,Koşu,45m,Hover Run,1,0,0,5,1800,,,\n';
const HEVY='"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"\n'
 +'"Bacak","15 Mar 2024, 18:30","15 Mar 2024, 19:35","","Squat (Barbell)","","","0","warmup","40","8","","",""\n'
 +'"Bacak","15 Mar 2024, 18:30","15 Mar 2024, 19:35","","Squat (Barbell)","","","1","normal","100","5","","","9"\n'
 +'"Bacak","15 Mar 2024, 18:30","15 Mar 2024, 19:35","","Bench Press (Dumbbell)","","","0","normal","30","10","","",""\n';
const r=I.read("﻿"+STRONG,{unit:"lbs"});
ok("Strong tanınır, birim sorulur, BOM ve tırnaklı virgül/çok satırlı not",r.format==="Strong"&&r.unitAsk&&r.workouts.length===2&&r.workouts[0].name==="Push, günü"&&r.workouts[0].ex[0].note==='ilk satır\nikinci satır "tırnaklı"',r.workouts[0]);
ok("süre 1h 5m: t1 = t0 + 65 dk; yerel gün",r.workouts[0].t1-r.workouts[0].t0===65*60000&&r.workouts[0].day==="2024-03-15");
ok("lbs kg'a çevrilir (135 lbs = 61,23 kg); kg seçilirse dokunulmaz",r.workouts[0].ex[0].sets[1].kg===61.23&&I.read(STRONG,{unit:"kg"}).workouts[0].ex[0].sets[1].kg===135);
const p=I.plan(r.workouts,ctx());
const w0=p.workouts[0];
ok("kütüphane eşleşmesi, Rest Timer satırı yok sayılır, ısınma w:true, RPE korunur",w0.ex[0].id==="bench"&&w0.ex[0].sets.length===2&&w0.ex[0].sets[0].w===true&&w0.ex[0].sets[1].rpe===8.5&&w0.ex[0].sets.every(s=>s.done),w0);
ok("bilinmeyen egzersiz kendi egzersizi: ağırlık, süreli (saniye), kardiyo (mesafe) türü tahmini",JSON.stringify(p.newEx.map(e=>[e.n,e.k]))==='[["Zarp Zurp Machine","w"],["Wall Sit","t"],["Hover Run","c"]]'&&p.stats.created===3&&p.stats.matched===1,p.newEx);
ok("özet: 2 antrenman, set sayısı, tarih aralığı",p.stats.workouts===2&&p.stats.sets===5&&p.stats.from==="2024-03-15"&&p.stats.to==="2024-03-17",p.stats);
ok("süreli ve kardiyo setinde reps/kg yok, sec var",JSON.stringify(w0.ex[2].sets)==='[{"kg":null,"reps":null,"sec":60,"done":true}]'&&p.workouts[1].ex[0].sets[0].sec===1800);
const S2=p.workouts.concat();const again=I.plan(r.workouts,ctx({existing:S2,find:I.matcher(lib.concat(p.newEx.map(e=>({id:e.id,n:e.n,k:e.k})))),gid:p.gid}));
ok("çift içe aktarma: aynı dosya ikinci kez hiçbir şey eklemez, yeni egzersiz de üretmez",again.stats.workouts===0&&again.stats.dup===2&&again.newEx.length===0,again.stats);
const h=I.read(HEVY);
const hp=I.plan(h.workouts,ctx());
ok("Hevy tanınır, birim kg, ay adı tarihi, end_time ile süre, warmup, ekipman ayrımı",h.format==="Hevy"&&!h.unitAsk&&h.workouts[0].t1-h.workouts[0].t0===65*60000&&hp.workouts[0].ex[0].id==="squat"&&hp.workouts[0].ex[0].sets[0].w&&hp.workouts[0].ex[1].id==="dbbench",hp.workouts[0]);
ok("Hevy weight_lbs sütunu lbs sayılır",Math.abs(I.read(HEVY.replace("weight_kg","weight_lbs")).workouts[0].ex[0].sets[1].kg-45.36)<0.01);
const semi=STRONG.replace(/^(.*)$/m,l=>l.replace(/,/g,";")).split("\n").map((l,i)=>i?l:l).join("\n");
const sc=I.read('Date;Workout Name;Duration;Exercise Name;Set Order;Weight (kg);Reps;Distance;Seconds;Notes;Workout Notes;RPE\n2024-03-15 18:30:00;A;45m;Squat (Barbell);1;62,5;5;0;0;;;\n');
ok("noktalı virgül ayırıcı, ondalık virgül, başlıktaki birim (sorulmaz)",sc.workouts[0].ex[0].sets[0].kg===62.5&&!sc.unitAsk&&sc.unit==="kg");
ok("başlık toleransı: büyük/küçük harf ve boşluk",I.read('DATE,workout name,DURATION,exercise  name,set order,WEIGHT,Reps\n2024-03-15 18:30,A,30m,Squat,1,50,5\n').workouts.length===1);
for(const [n,t] of [["tanınmayan başlık","a,b,c\n1,2,3\n"],["boş","" ],["yalnız başlık","Date,Exercise Name,Reps\n"],["kapanmayan tırnak",STRONG+'2024-03-18 10:00,"x,A\n'],["ikili dosya","Date,Exercise Name,Reps\0\0\n1,2,3\n"],["tarih okunamaz","Date,Workout Name,Exercise Name,Set Order,Weight,Reps\nbugün,A,Squat,1,50,5\n"]])
  { let e="";try{I.read(t)}catch(x){e=x.message} ok("bozuk dosya reddedilir: "+n,e.length>5,e) }
ok("sınır dışı değerler atılır ve sayılır: 0 tekrar, 300 tekrar, 2000 kg",(q=>q.stats.sets===1&&q.stats.skippedSets===3)(I.plan(I.read('Date,Workout Name,Exercise Name,Set Order,Weight,Reps\n2024-03-15 18:30,A,Squat,1,50,5\n2024-03-15 18:30,A,Squat,2,50,0\n2024-03-15 18:30,A,Squat,3,50,300\n2024-03-15 18:30,A,Squat,4,2000,5\n').workouts,ctx())));
ok("CSV enjeksiyonu: =HYPERLINK adı yalnız kısaltılmış metin olarak kalır, kontrol karakteri atılır",(q=>q.newEx[0].n==="=HYPERLINK(\"x\")ab"&&q.newEx[0].n.length<=60)(I.plan(I.read('Date,Workout Name,Exercise Name,Set Order,Weight,Reps\n2024-03-15 18:30,A,"=HYPERLINK(""x"")\u0001ab",1,50,5\n').workouts,ctx({find:()=>null}))));
{const big=n=>{let s='Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps\n';for(let i=0;i<n;i++){const d=new Date(2020,0,1+Math.floor(i/10));s+=`${d.toISOString().slice(0,10)} 10:00:00,W,30m,${["Squat (Barbell)","Bench Press (Barbell)","Ex "+(i%7)][i%3]},${i%10+1},${50+i%30},${5+i%5}\n`}return s};
 const t0=Date.now(),R=I.read(big(5000)),P=I.plan(R.workouts,ctx());
 ok("5000 satır: 2 sn altında ayrıştırılır ve planlanır",Date.now()-t0<2000&&P.stats.sets===5000&&P.stats.workouts===500,[Date.now()-t0,P.stats]);
 const cut=I.cut(P,100);
 ok("sığmayan geçmişte kısmi içe aktarım: en yeni N antrenman, yalnız kullanılan yeni egzersizler",I.fit(P,I.bytes(P)/5)>80&&I.fit(P,I.bytes(P)/5)<120&&cut.workouts.length===100&&cut.workouts.every(w=>w.t0>=P.workouts[400].t0),I.fit(P,I.bytes(P)/5));
 ok("partial import: the stats follow the kept workouts, not the full plan",cut.stats.workouts===100&&cut.stats.sets===1000&&cut.stats.created===cut.newEx.length&&cut.stats.from>=P.stats.from&&cut.stats.to===P.stats.to,cut.stats);}
ok("yeni egzersiz sınırı: aşan egzersizler alınmaz ve adları bildirilir",(q=>q.newEx.length===I.MAX_NEW&&q.stats.over.length===5)(I.plan(I.read("Date,Workout Name,Exercise Name,Set Order,Weight,Reps\n"+Array.from({length:105},(_,i)=>`2024-03-15 18:30,A,Zz${i},1,5,5`).join("\n")+"\n").workouts,ctx({find:()=>null}))));
ok("tablo: her kimlik kütüphanede var",Object.entries(I.MAP).every(([k,id])=>lib.some(e=>e.id===id)),Object.entries(I.MAP).filter(([k,id])=>!lib.some(e=>e.id===id)));
{const hv='title,start_time,end_time,exercise_title,superset_id,set_index,set_type,weight_kg,reps\n'
 +'A,2024-03-15 18:30,2024-03-15 19:00,Squat (Barbell),7,0,normal,100,5\nA,2024-03-15 18:30,2024-03-15 19:00,Squat (Barbell),7,1,dropset,60,12\n'
 +'A,2024-03-15 18:30,2024-03-15 19:00,Bench Press (Barbell),7,0,failure,80,6\nA,2024-03-15 18:30,2024-03-15 19:00,Lat Pulldown (Cable),3,0,normal,40,10\n';
 const q=I.plan(I.read(hv).workouts,ctx()).workouts[0];
 ok("Hevy: dropset -> t:d, failure -> t:f, superset_id -> aynı ss (tek kalan ss atılır)",q.ex[0].sets[1].t==="d"&&q.ex[1].sets[0].t==="f"&&q.ex[0].ss>0&&q.ex[0].ss===q.ex[1].ss&&q.ex[2].ss===undefined,q);
 const sd=I.plan(I.read('Date,Workout Name,Exercise Name,Set Order,Weight,Reps\n2024-03-15 18:30,A,Squat (Barbell),1,50,5\n2024-03-15 18:30,A,Squat (Barbell),D,40,8\n2024-03-15 18:30,A,Squat (Barbell),F,40,3\n').workouts,ctx()).workouts[0].ex[0].sets;
 ok("Strong: Set Order D ve F set türü olur, atlanmaz",sd.length===3&&sd[1].t==="d"&&sd[2].t==="f");}
for(const [s,e] of [["1.234,5",1234.5],["1,234.5",1234.5],["62,5",62.5],["62.5",62.5],["1.234.567",1234567],["1,234,567",1234567],["-5",-5],["",null],["abc",null],["1e3",null],["1.2.3x",null]])
  ok(`ImportLib.num(${JSON.stringify(s)})`,I.num(s)===e,I.num(s));
process.exit(bad?1:0);
