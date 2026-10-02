const I=require("../www/insightlib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const T="2026-10-02",key=o=>new Date(Date.UTC(2026,9,2+o)).toISOString().slice(0,10);
const W=(offs,f)=>Object.fromEntries(offs.map((o,i)=>[key(o),Math.round(f(o,i)*10)/10]));
const D10=[-20,-18,-16,-14,-12,-9,-7,-5,-2,0],N=[0.2,-0.1,0.3,-0.2,0,0.1,-0.3,0.2,-0.1,0];

let p=I.plateau(W(D10,(o,i)=>80+N[i]),T);
ok("düz seri (±0,3 kg, 21 gün, 10 tartı) → plato",p.ok&&p.enough,p);
p=I.plateau(W(D10,(o,i)=>80-o*0.5/7+N[i]),T);
ok("-0,5 kg/hafta seri → plato değil",!p.ok&&p.slope<-0.4,p);
p=I.plateau(W([-20,-13,-6,0],()=>80),T);
ok("4 tartı → yetersiz veri",!p.ok&&!p.enough);
ok("6 tartı ama 14 günden kısa yayılım → yetersiz",!I.plateau(W([-12,-10,-8,-6,-3,0],()=>80),T).enough);
ok("6 tartı → gürültü tahmini için yetersiz (en az 8)",!I.plateau(W([-20,-16,-12,-8,-4,0],()=>80),T).enough);
p=I.plateau(W([-15,-13,-11,-9,-6,-4,-2,0],(o,i)=>80+[1.6,-1.7,1.5,-1.4,1.8,-1.6,1.2,-1.5][i]),T);
ok("çok gürültülü (±1,6) kısa seride güven aralığı geniş → plato değil",!p.ok&&p.enough&&p.ci>0.3,p);
ok("son tartı 7 günden eski → yetersiz",!I.plateau(W(D10.map(o=>o-8),(o,i)=>80+N[i]),T).enough);
ok("plato yayılım gününü döndürür",I.plateau(W(D10,(o,i)=>80+N[i]),T).days===20);
p=I.plateau(W([-20,-19,-18,-17,-16,-15,-1,0],(o,i)=>80+[0.1,-0.1,0,0.1,-0.1,0,0.1,-0.1][i]),T);
ok("kümelenmiş düzensiz aralık: iki uçta tartı, düz → plato",p.ok,p);
ok("eski düz seri (son tartı 30 gün önce) plato sayılmaz",!I.plateau(W(D10.map(o=>o-30),(o,i)=>80+N[i]),T).enough);
ok("çöp girdi hata atmaz",!I.plateau(null,T).ok&&!I.plateau({x:1,"2026-10-01":"a"},T).ok&&I.noiseSd(undefined,T)===null);
ok("noiseSd: düz seride küçük, en az 8 tartı ister",I.noiseSd(W(D10,(o,i)=>80+N[i]),T)<0.3&&I.noiseSd(W([-12,-10,-8,-6,-4,-2,0],(o,i)=>80+N[i]),T)===null);

// Sabit tohumlu benzetim: 35 gün, her gün tartı olasılığı q, günlük gürültü sd (normal). Hedef: düz seride ≥%60, gerçek −0,3 kg/hafta ve hızlı kayıpta ≤%5.
{
  let seed=20261002;const rnd=()=>(seed=seed*16807%2147483647)/2147483647,gauss=()=>Math.sqrt(-2*Math.log(rnd()))*Math.cos(2*Math.PI*rnd());
  const rate=(slope,sd,q,R=600)=>{let k=0;for(let r=0;r<R;r++){const w={};for(let o=-34;o<=0;o++)if(o===0||rnd()<q)w[key(o)]=80+slope*o/7+sd*gauss();if(I.plateau(w,T).ok)k++}return k/R};
  const res=[];
  for(const q of [1,0.8])for(const sd of [0.4,0.7,1.0])res.push([q,sd,rate(0,sd,q),rate(-0.3,sd,q),rate(-0.5,sd,q)]);
  ok("benzetim: düz seride tespit ≥%60 (sd 0,4/0,7/1,0; her gün ve %80 gün tartı)",res.every(r=>r[2]>=0.6),res);
  ok("benzetim: −0,3 ve −0,5 kg/hafta seride yanlış plato ≤%5",res.every(r=>r[3]<=0.05&&r[4]<=0.05),res);
}

const day=(kcal,su,ad,sl)=>({kcal,su,ad,sl});
const days=Array.from({length:22},(_,i)=>i<14?day(2000,1500,9000):i<21?day(i%2?2100:300,2000,6000,i===20?420:null):day(400,250,500,null));
let w=I.weekWhy({days,goalKcal:1800,goalWater:2500,weights:W([-12,-5,-1],(o)=>o<-7?81:80.8),today:T});
const by=k=>(w.find(x=>x.k===k)||{}).t;
ok("weekWhy: eksik kayıtlı günleri sayar, bugünü eksik saymaz",by("kcal")==="Kalori: tam kayıtlı 3 günde ortalama 2100 kcal, hedefin 1800 kcal. 4 günün kaydı eksik ya da 800 kcal altında, ortalamaya katılmadı.",by("kcal"));
ok("weekWhy: su ve adım (7 güne karşı önceki 14) rakamları uygulamadan",by("su")==="Su: kayıtlı 7 günde ortalama 2000 ml, hedefin 2500 ml."&&by("adim")==="Adım: son 7 günde günlük ortalama 6000, önceki 14 günde 9000.",[by("su"),by("adim")]);
ok("weekWhy: uyku verisi varken ortalama saat",by("uyku")==="Uyku: 1 gecenin ortalaması 7 saat.",by("uyku"));
ok("weekWhy: tartı farkı haftalık",by("tarti")&&by("tarti").startsWith("Tartı: haftalık fark -0,2 kg"),by("tarti"));
w=I.weekWhy({days:days.map(x=>Object.assign({},x,{sl:null})),goalKcal:0,weights:{},today:T});
ok("weekWhy: hedef yoksa kalori etmeni 'hedef yok' der",by("kcal").startsWith("Kalori: hedef yok;"),by("kcal"));
ok("weekWhy: uyku verisi yoksa uyku etmeni çıkmaz",!w.some(x=>x.k==="uyku"));
ok("weekWhy: tartı yoksa iki hafta tartı gerektiğini söyler",by("tarti").includes("iki haftada"));
const flat=W([-27,-24,-21,-18,-15,-12,-10,-8,-6,-4,-2,0],(o,i)=>80+[0.3,-0.4,0.5,-0.3,0.4,-0.5,0.2,-0.4,0.5,-0.3,0.1,0.3][i]);
w=I.weekWhy({days,goalKcal:1800,weights:flat,today:T});
ok("weekWhy: fark 2×artık sd'den küçükse tartı oynaması etiketi",by("tarti").includes("tartı oynaması aralığında"),by("tarti"));
ok("weekWhy: çöp girdi hata atmaz, kalori etmeni yine çıkar",I.weekWhy(null).length===1&&I.weekWhy({days:[null,"x",{kcal:"a"}]})[0].k==="kcal");
const BAN=/metabolizma|yavaşla|tanı|hastal|suç|başarısız|tembel|yapmadın|yemedin|kötü|hata/i;
const all=[...I.weekWhy({days,goalKcal:1800,goalWater:2500,weights:flat,today:T}),...I.weekWhy({days:[],weights:W([-10,-1],()=>80),today:T}),...I.weekWhy({days,today:T,weights:W([-9,0],o=>o?79:80)})];
ok("weekWhy metinleri: suçlayıcı/tıbbi ifade yok, her biri ≤160 karakter",all.every(x=>!BAN.test(x.t)&&x.t.length<=160),all.filter(x=>BAN.test(x.t)||x.t.length>160));
process.exit(bad?1:0);
