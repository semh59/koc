/* Offline local menu: calorie deviation, repeat limit, schema (cleanMenu), restrictions, properties. */
const {ok,finish}=require("./ok");
const M=require("../www/modules/nutrition/menulocal.js"),C=require("../www/modules/coach/coachlib.js"),{FOODS}=require("../www/modules/nutrition/foods.js");
let sd=7;const rng=()=>{sd=(sd*16807)%2147483647;return sd/2147483647};
const dayK=d=>d.meals.reduce((s,b)=>s+b.items.reduce((t,i)=>t+i.k,0),0),dayP=d=>d.meals.reduce((s,b)=>s+b.items.reduce((t,i)=>t+i.p,0),0);
const names=m=>m.days.flatMap(d=>d.meals.flatMap(b=>b.items.map(i=>i.n)));
const maxRep=m=>Math.max(...Object.values(names(m).reduce((o,n)=>(o[n]=(o[n]||0)+1,o),{})));

ok("every pool dish exists in the food database",[...Object.values(M.MAIN).flat(),...M.FRUIT,...M.LIGHT].every(n=>FOODS.some(f=>f.n===n)));
{ const m=M.make({kcal:2000,protein:[100,140],rng}),c=C.cleanMenu({days:m.days},null,2000);
  ok("cleanMenu accepts: 7 days, 4 meals per day, none marked off",c&&c.days.length===7&&c.days.every(d=>d.meals.length===4&&!d.off&&d.meals.map(b=>b.m).join()==="breakfast,lunch,dinner,snack"),c&&c.days.map(d=>d.off));
  ok("every day is within 7% of the target",m.days.every(d=>Math.abs(dayK(d)-2000)<=140),m.days.map(dayK));
  ok("protein is near the target range (every day at least 85% of the lower bound)",m.days.every(d=>dayP(d)>=85),m.days.map(dayP));
  ok("the same dish appears at most twice a week",maxRep(m)<=2);
  ok("variety: at least 20 distinct items",new Set(names(m)).size>=20);
  ok("items follow the schema: q is a multiple of 0.25, g and k are numbers",m.days.every(d=>d.meals.every(b=>b.items.every(i=>i.q%0.25===0&&i.q>=0.5&&i.q<=3&&i.g>0&&i.k>0))));
  ok("a shopping list is produced",C.shopList(c).length>=15);
  ok("no unk flag for a note without restrictions, nor for an empty note",!m.unk);
}
{ const bad2=[];
  for(let i=0;i<50;i++){
    const kcal=1200+Math.floor(rng()*23)*100,pr=i%2?[Math.round(kcal/25),Math.round(kcal/18)]:null,m=M.make({kcal,protein:pr,rng}),c=m&&C.cleanMenu({days:m.days},null,kcal);
    if(!c||c.days.length!==7||c.days.some(d=>Math.abs(dayK(d)-kcal)>kcal*0.07)||maxRep(m)>2)bad2.push([kcal,m&&m.days.map(dayK)]);
  }
  ok("50 random targets (1200-3400 kcal): each day within 7%, repeats at most 2, cleanMenu accepts",!bad2.length,bad2.slice(0,2));
}
{ const t=(note,re)=>{const m=M.make({kcal:2000,note,rng});return m&&!names(m).some(n=>re.test(n.toLowerCase()))&&!m.unk};
  ok("peanut allergy: no item with peanut",t("fıstık alerjisi",/fıstık/));
  ok("milk: no dairy item",t("süt ürünleri yiyemem",/yoğurt|peynir|ayran|kefir|süt|tereyağı|kaymak/));
  ok("egg allergy: no egg, omelette or menemen",t("yumurta alerjim var",/yumurta|omlet|menemen/));
  ok("vegetarian: no meat, chicken or fish",t("vejetaryenim",/tavuk|etli|köfte|kebab|kıyma|somon|levrek|balık|kuzu|dana|hindi|döner/));
  ok("a negated note (no peanut allergy) is not a restriction",M.filters("fıstık alerjim yok").length===0&&M.filters("fıstık alerjisi").length===1);
  ok("an unrecognized note sets unk",M.make({kcal:2000,note:"kereviz sevmem",rng}).unk===true);
  ok("null when restrictions shrink the pool below 4",M.make({kcal:2000,note:"vejetaryen, süt, yumurta, gluten, balık, fıstık, fındık, ceviz, badem",rng})===null);
}
ok("null for a target out of range (under 800)",M.make({kcal:500})===null&&M.make({})===null);
finish();
