/* Anahtarsız yerel menü: kalori sapması, tekrar sınırı, şema (cleanMenu), kısıtlar, özellik testi. */
const M=require("../www/modules/nutrition/menulocal.js"),C=require("../www/modules/coach/coachlib.js"),{FOODS}=require("../www/modules/nutrition/foods.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
let sd=7;const rng=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
const dayK=d=>d.meals.reduce((s,b)=>s+b.items.reduce((t,i)=>t+i.k,0),0),dayP=d=>d.meals.reduce((s,b)=>s+b.items.reduce((t,i)=>t+i.p,0),0);
const names=m=>m.days.flatMap(d=>d.meals.flatMap(b=>b.items.map(i=>i.n)));
const maxRep=m=>Math.max(...Object.values(names(m).reduce((o,n)=>(o[n]=(o[n]||0)+1,o),{})));

ok("havuzdaki her yemek besin veritabanında var",[...Object.values(M.MAIN).flat(),...M.FRUIT,...M.LIGHT].every(n=>FOODS.some(f=>f.n===n)));
{ const m=M.make({kcal:2000,protein:[100,140],rng}),c=C.cleanMenu({days:m.days},null,2000);
  ok("cleanMenu kabul eder: 7 gün, günde 4 öğün, hiçbiri off değil",c&&c.days.length===7&&c.days.every(d=>d.meals.length===4&&!d.off&&d.meals.map(b=>b.m).join()==="breakfast,lunch,dinner,snack"),c&&c.days.map(d=>d.off));
  ok("her gün hedefin ±%7'si içinde",m.days.every(d=>Math.abs(dayK(d)-2000)<=140),m.days.map(dayK));
  ok("protein hedef aralığına yakın (her gün ≥ alt sınırın %85'i)",m.days.every(d=>dayP(d)>=85),m.days.map(dayP));
  ok("aynı yemek haftada en çok 2 kez",maxRep(m)<=2);
  ok("çeşitlilik: en az 20 farklı kalem",new Set(names(m)).size>=20);
  ok("kalemler şemaya uygun: q 0,25 katı, g ve k sayı",m.days.every(d=>d.meals.every(b=>b.items.every(i=>i.q%0.25===0&&i.q>=0.5&&i.q<=3&&i.g>0&&i.k>0))));
  ok("alışveriş listesi üretilir",C.shopList(c).length>=15);
  ok("kısıtsız notta unk yok, boş notta da yok",!m.unk);
}
{ const bad2=[];
  for(let i=0;i<50;i++){
    const kcal=1200+Math.floor(rng()*23)*100,pr=i%2?[Math.round(kcal/25),Math.round(kcal/18)]:null,m=M.make({kcal,protein:pr,rng}),c=m&&C.cleanMenu({days:m.days},null,kcal);
    if(!c||c.days.length!==7||c.days.some(d=>Math.abs(dayK(d)-kcal)>kcal*0.07)||maxRep(m)>2)bad2.push([kcal,m&&m.days.map(dayK)]);
  }
  ok("50 rastgele hedef (1200-3400 kcal): her gün ±%7, tekrar ≤2, cleanMenu kabul",!bad2.length,bad2.slice(0,2));
}
{ const t=(note,re)=>{const m=M.make({kcal:2000,note,rng});return m&&!names(m).some(n=>re.test(n.toLowerCase()))&&!m.unk};
  ok("fıstık alerjisi: fıstık geçen kalem yok",t("fıstık alerjisi",/fıstık/));
  ok("süt: süt ürünü yok",t("süt ürünleri yiyemem",/yoğurt|peynir|ayran|kefir|süt|tereyağı|kaymak/));
  ok("yumurta alerjisi: yumurta/omlet/menemen yok",t("yumurta alerjim var",/yumurta|omlet|menemen/));
  ok("vejetaryen: et, tavuk, balık yok",t("vejetaryenim",/tavuk|etli|köfte|kebab|kıyma|somon|levrek|balık|kuzu|dana|hindi|döner/));
  ok("olumsuz not (fıstık alerjim yok) kısıt sayılmaz",M.filters("fıstık alerjim yok").length===0&&M.filters("fıstık alerjisi").length===1);
  ok("tanınmayan not unk işaretler",M.make({kcal:2000,note:"kereviz sevmem",rng}).unk===true);
  ok("kısıtlar havuzu 4'ün altına indirirse null",M.make({kcal:2000,note:"vejetaryen, süt, yumurta, gluten, balık, fıstık, fındık, ceviz, badem",rng})===null);
}
ok("hedef aralık dışı (800 altı) null",M.make({kcal:500})===null&&M.make({})===null);
process.exit(bad?1:0);
