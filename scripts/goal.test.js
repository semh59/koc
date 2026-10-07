/* Kilo trendine göre kalori hedefi önerisi: hız, sınır, fren, susturma, yetersiz veri. */
const G=require("../www/goallib.js"),A=require("../www/algo.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const T="2026-10-06",day=n=>{const d=new Date(Date.UTC(2026,9,6)+n*864e5);return d.toISOString().slice(0,10)};
/* haftalık eğim sl (kg/hafta), son 21 günde her 3 günde bir tartı */
const wts=(sl,kg0=80)=>{const w={};for(let i=-21;i<=0;i+=3)w[day(i)]=kg0+sl*(i/7);return w};
const eat=(k,n=14)=>{const o={};for(let i=1;i<=n;i++)o[day(-i)]=k;return o};
const base=(o={})=>({w:wts(-1),kcal:2000,tdee:2600,bmr:1700,ri:{kg:80,goalKg:75,age:35,sex:"m",cm:178,healthNote:"",meds:0,today:T},intake:eat(2000),today:T,at:"",...o});
const s=o=>G.suggest(base(o));
{ const g=s();
  ok("hedef hız ~-0,4 kg/hafta, gerçek -1: +250 kcal tavanıyla öneri",g&&g.kcal===2250&&g.delta===250&&Math.abs(g.slope+1)<0.01&&g.rate<0,g);
  const h=s({w:wts(-0.4)});ok("hız hedefe yakınsa (sapma <0,15) öneri yok",h===null,h);
  const y=s({w:wts(0)});ok("kilo sabit, hedef verme: kalori azaltma önerisi",y&&y.delta<0&&y.kcal>=1950,y);
  const k=s({w:wts(0),kcal:2230,intake:eat(2230)});ok("öneri en çok 250 kcal ve 10'a yuvarlı",k&&k.delta===-250&&k.kcal===1980,k);
}
{ ok("sınır: alt taban (erkek 1500, tdee %75) altına inmez",(g=>g===null||g.kcal>=Math.max(1500,2600*0.75))(s({w:wts(0),kcal:1960,intake:eat(1960)})));
  ok("zaten tabandaysa daha da azaltma önerilmez",s({w:wts(0),kcal:1950,intake:eat(1950)})===null);
  const hi=s({w:wts(-2),kcal:3380,tdee:2600,intake:eat(3380)});ok("üst sınır tdee×1,3",hi===null||hi.kcal<=3380,hi);
}
{ ok("18 yaş altı: öneri yok",s({ri:{...base().ri,age:16}})===null);
  ok("yeme düzeni işareti: öneri yok",s({ri:{...base().ri,healthNote:"yeme bozukluğum var"}})===null);
  ok("hamilelik: öneri yok",s({ri:{...base().ri,healthNote:"hamileyim"}})===null);
  ok("BMI 18,5 altı: öneri yok",s({ri:{...base().ri,kg:50}})===null);
  ok("yumuşak fren (hekim notu) + açık yönünde öneri yok",s({w:wts(0),ri:{...base().ri,healthNote:"tansiyon"}})===null);
  ok("yumuşak fren varken bakım altına inen öneri (kcalBlocked) yok",s({w:wts(-1),ri:{...base().ri,healthNote:"tansiyon"}})===null);
  const up=s({w:wts(-1),kcal:2400,intake:eat(2400),ri:{...base().ri,healthNote:"tansiyon"}});ok("yumuşak fren varken bakım düzeyine çıkan öneri geçer",up&&up.kcal>=2550,up);
}
{ ok("14 günden az veri: öneri yok",s({w:Object.fromEntries(Object.entries(wts(-1)).filter(([k])=>k>=day(-9)))})===null);
  ok("son tartı 7 günden eski: öneri yok",s({w:Object.fromEntries(Object.entries(wts(-1)).map(([k,v])=>[A.fdate?day(A.dayNum(k)-A.dayNum(T)-9):k,v]))})===null);
  ok("tam kayıtlı gün MIN_AVG_DAYS'ten az: öneri yok",s({intake:eat(2000,A.MIN_AVG_DAYS-1)})===null);
  ok("yarım kayıtlı günler (<800) sayılmaz",s({intake:eat(600)})===null);
  ok("hedefe uyulmamış (ortalama ±%15 dışı): öneri yok",s({intake:eat(2600)})===null);
  ok("hedef kilo yok: öneri yok",s({ri:{...base().ri,goalKg:0}})===null);
}
{ ok("son karardan 7 günden az: sessiz",s({at:day(-6)})===null);
  ok("7 gün sonra tekrar önerir (reddetme susturması biter)",s({at:day(-7)})!==null);
}
process.exit(bad?1:0);
