const LogLib=(()=>{
  const WL=typeof WeeklyLib!=="undefined"?WeeklyLib:require("../insights/weeklylib.js");
  // Per-food caps: protein, carbs, fat, fibre, sugar in g, sodium in mg.
  const MAX={p:500,c:2000,f:1000,fb:500,sg:2000,na:100000},NUTR=Object.keys(MAX);
  const FAVS_MAX=20,TPL_MAX=20,TPL_ITEMS_MAX=15,RECENTS_MAX=8,RECENT_DAYS=30,RECIPES_MAX=50,RECIPE_ITEMS_MAX=30;
  const copyNutr=(src,dst)=>{for(const k of NUTR)if(Number.isFinite(src[k])&&src[k]>=0&&src[k]<=MAX[k])dst[k]=src[k];return dst};
  /* A recipe or portion estimate range (lo <= v <= hi) travels with repeated foods; anything else is dropped. */
  const copyRange=(src,dst)=>{if(dst.v!=null&&Number.isInteger(src.lo)&&Number.isInteger(src.hi)&&src.lo>=0&&src.lo<=dst.v&&dst.v<=src.hi&&src.hi<=20000){dst.lo=src.lo;dst.hi=src.hi}return dst};
  /* Day total as a range, only when the foods that carry a range make up at least half of the calories and the range is at least 10% wide; ends are summed, not combined statistically (they are scenarios, not confidence intervals). */
  function dayRange(foods){
    let v=0,lo=0,hi=0,ranged=0;
    for(const e of foods){
      if(!(e.v>0))continue;
      v+=e.v;
      if(e.lo!=null){lo+=e.lo;hi+=e.hi;ranged+=e.v}else{lo+=e.v;hi+=e.v}
    }
    return v>0&&ranged>=v/2&&(hi-lo)/v>=0.1?{lo:Math.round(lo),hi:Math.round(hi)}:null;
  }
  const key=s=>s.trim().replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();
  const nextId=(raw,ids)=>Number.isInteger(raw)&&raw>0&&!ids.has(raw)?raw:Math.max(0,...ids)+1;
  function item(x){
    if(!x||typeof x.text!=="string"||!x.text.trim())return null;
    const v=x.v==null?null:Number(x.v);
    if(v!=null&&!(v>=0&&v<=20000))return null;
    return copyRange(x,copyNutr(x,{text:x.text.trim().slice(0,100),v}));
  }
  function uniqueItems(xs,limit){
    const out=[],seen=new Set();
    for(const x of xs){
      const it=item(x);if(!it||seen.has(key(it.text)))continue;
      seen.add(key(it.text));out.push(it);if(out.length===limit)break;
    }
    return out;
  }
  const cleanFav=arr=>uniqueItems(Array.isArray(arr)?arr:[],FAVS_MAX);
  function cleanTpl(arr){
    const out=[],ids=new Set();
    for(const t of Array.isArray(arr)?arr:[]){
      if(!t||typeof t.n!=="string"||!t.n.trim()||!Array.isArray(t.items))continue;
      const items=t.items.map(item).filter(Boolean).slice(0,TPL_ITEMS_MAX);
      if(!items.length)continue;
      const id=nextId(t.id,ids);
      ids.add(id);out.push({id,n:t.n.trim().slice(0,40),items});
      if(out.length===TPL_MAX)break;
    }
    return out;
  }
  function recents(entries,today){
    const t=Date.parse(today);
    const src=entries.filter(e=>e.type==="food"&&e.day<=today&&(t-Date.parse(e.day))/864e5<=RECENT_DAYS).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);
    return uniqueItems(src,RECENTS_MAX);
  }
  // Recipe items copy the per-100 g values, so deleting or changing a food later does not alter the recipe.
  const PER100={p:300,c:100,f:100,fb:100,sg:100,na:40000},RLBL={k:"kalori",p:"protein",c:"karbonhidrat",f:"yağ",fb:"lif",sg:"şeker",na:"sodyum"};
  function recipeItem(x){
    const g=Math.round(x?.g*10)/10; // round first: 0.04 g would otherwise be stored as 0
    if(!x||typeof x.n!=="string"||!x.n.trim()||!(g>0&&g<=5000)||!(x.k>=0&&x.k<=5000))return null;
    const o={n:x.n.trim().slice(0,60),g,k:x.k};
    for(const m of NUTR)if(Number.isFinite(x[m])&&x[m]>=0&&x[m]<=PER100[m])o[m]=x[m];
    if(x.portion===true)o.portion=true; // food with unknown gram weight: g = portions x 100, values were entered per portion
    return o;
  }
  function cleanRecipes(arr){
    const out=[],ids=new Set(),names=new Set();
    for(const r of Array.isArray(arr)?arr:[]){
      if(!r||typeof r.n!=="string"||!r.n.trim()||!Array.isArray(r.items))continue;
      const n=r.n.trim().slice(0,60),items=r.items.map(recipeItem).filter(Boolean).slice(0,RECIPE_ITEMS_MAX);
      if(!items.length||names.has(key(n)))continue;
      names.add(key(n));
      const id=nextId(r.id,ids),s=Math.round(r.s);
      ids.add(id);out.push({id,n,s:s>=1&&s<=50?s:1,items});
      if(out.length===RECIPES_MAX)break;
    }
    return out;
  }
  /* A nutrient total is only written when ALL items have data; a partial total would pass a missing value off as complete.
     part: [nutrient, number of items that have data]. */
  function recipeCalc(r){
    const g=r.items.reduce((s,i)=>s+i.g,0),tot={},part=[];
    for(const m of ["k",...NUTR]){
      const have=r.items.filter(i=>i[m]!=null).length;
      if(have===r.items.length)tot[m]=r.items.reduce((s,i)=>s+i[m]*i.g/100,0);else if(have)part.push([m,have]);
    }
    return {g,tot,part,n:r.items.length};
  }
  const recipeNote=c=>"Çiğ ağırlıklarla hesaplandı, pişince değişir; tahmindir."+c.part.map(([m,h])=>` ${RLBL[m][0].toUpperCase()+RLBL[m].slice(1)}: ${h}/${c.n} malzemede veri var, toplam yazılmadı.`).join("");
  // Shape of a food in the search list (allFoods): a recipe is searched like one food, with a per-portion entry first.
  function recipeFood(r){
    const c=recipeCalc(r),pg=c.g/r.s,f={n:r.n,k:c.tot.k*100/c.g,my:true,src:"recipe",rec:r.id,hint:`Tarifim, ${r.s} porsiyon. ${recipeNote(c)}`,u:[[r.items.some(i=>i.portion)?"1 porsiyon":`1 porsiyon (${Math.round(pg)} g)`,pg],["100 g",100]]};
    for(const m of NUTR)f[m]=c.tot[m]==null?null:c.tot[m]*100/c.g;
    return f;
  }
  const MEALS=[["breakfast","Kahvaltı"],["lunch","Öğle"],["dinner","Akşam"],["snack","Atıştırmalık"]];
  const mealKey=k=>MEALS.some(m=>m[0]===k)?k:"";
  // An entry added without a meal gets one from its time of day.
  const mealOf=e=>{const h=+String(e.time).slice(0,2);return mealKey(e.meal)||(h>=5&&h<11?"breakfast":h>=11&&h<16?"lunch":h>=16&&h<21?"dinner":"snack")};
  // One day: meal groups (by time, with a kcal subtotal), plain water and other drinks (each collapsed to one row), everything else.
  function dayLog(items){
    const byMeal=new Map(MEALS.map(([k])=>[k,[]])),water=[],dr=[],rest=[];
    for(const e of items){
      if(e.type==="food")byMeal.get(mealOf(e)).push(e);
      else if(e.type==="water")(WL.isWater(e)?water:dr).push(e);
      else rest.push(e);
    }
    const total=L=>L.reduce((s,e)=>s+(e.v||0),0);
    const groups=MEALS.map(([k,n])=>{const L=byMeal.get(k).sort((a,b)=>a.time.localeCompare(b.time)||a.id-b.id);return {k,n,items:L,kcal:total(L)}}).filter(g=>g.items.length);
    return {groups,water,dr,waterTotal:total(water),drMl:total(dr),rest};
  }
  const stalled=(snapAt,now,yest,prev7)=>(snapAt>0&&now-snapAt>26*36e5)||(yest===0&&prev7>1000);
  return {PER100,RECIPES_MAX,RECIPE_ITEMS_MAX,recipeItem,cleanRecipes,recipeCalc,recipeNote,recipeFood,MEALS,mealKey,mealOf,dayLog,stalled,NUTR,copyNutr,dayRange,key,cleanFav,cleanTpl,recents};
})();
if(typeof module!=="undefined")module.exports=LogLib;
