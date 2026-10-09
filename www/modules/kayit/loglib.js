const LogLib=(()=>{
  const WL=typeof WeeklyLib!=="undefined"?WeeklyLib:require("../analiz/weeklylib.js");
  const MAX={p:500,c:2000,f:1000,fb:500,sg:2000,na:100000},NUTR=Object.keys(MAX);
  const copyNutr=(src,dst)=>{for(const k of NUTR)if(Number.isFinite(src[k])&&src[k]>=0&&src[k]<=MAX[k])dst[k]=src[k];return dst};
  const key=s=>s.trim().replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();
  function item(x){
    if(!x||typeof x.text!=="string"||!x.text.trim())return null;
    const v=x.v==null?null:Number(x.v);
    if(v!=null&&!(v>=0&&v<=20000))return null;
    return copyNutr(x,{text:x.text.trim().slice(0,100),v});
  }
  function cleanFav(arr){
    const out=[],seen=new Set();
    for(const x of Array.isArray(arr)?arr:[]){
      const it=item(x);if(!it||seen.has(key(it.text)))continue;
      seen.add(key(it.text));out.push(it);
    }
    return out.slice(0,20);
  }
  function cleanTpl(arr){
    const out=[],ids=new Set();
    for(const t of Array.isArray(arr)?arr:[]){
      if(!t||typeof t.n!=="string"||!t.n.trim()||!Array.isArray(t.items))continue;
      const items=t.items.map(item).filter(Boolean).slice(0,15);
      if(!items.length)continue;
      const id=Number.isInteger(t.id)&&t.id>0&&!ids.has(t.id)?t.id:Math.max(0,...ids)+1;
      ids.add(id);out.push({id,n:t.n.trim().slice(0,40),items});
      if(out.length===20)break;
    }
    return out;
  }
  function recents(entries,today){
    const out=[],seen=new Set(),t=Date.parse(today);
    const src=entries.filter(e=>e.type==="yemek"&&e.day<=today&&(t-Date.parse(e.day))/864e5<=30).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);
    for(const e of src){
      const it=item(e);if(!it||seen.has(key(it.text)))continue;
      seen.add(key(it.text));out.push(it);if(out.length===8)break;
    }
    return out;
  }
  /* Tarif: kalemler 100 g başına değerlerin kopyasıdır; sonradan besin silinse ya da değişse tarif bozulmaz. */
  const PER100={p:300,c:100,f:100,fb:100,sg:100,na:40000},RLBL={k:"kalori",p:"protein",c:"karbonhidrat",f:"yağ",fb:"lif",sg:"şeker",na:"sodyum"};
  function recipeItem(x){
    if(!x||typeof x.n!=="string"||!x.n.trim()||!(x.g>0&&x.g<=5000)||!(x.k>=0&&x.k<=5000))return null;
    const o={n:x.n.trim().slice(0,60),g:Math.round(x.g*10)/10,k:x.k};
    for(const m of NUTR)if(Number.isFinite(x[m])&&x[m]>=0&&x[m]<=PER100[m])o[m]=x[m];
    if(x.por===true)o.por=true; // gramı bilinmeyen porsiyon besini: g = porsiyon × 100 (değerler porsiyon başına girilmişti)
    return o;
  }
  function cleanRecipes(arr){
    const out=[],ids=new Set(),names=new Set();
    for(const r of Array.isArray(arr)?arr:[]){
      if(!r||typeof r.n!=="string"||!r.n.trim()||!Array.isArray(r.items))continue;
      const n=r.n.trim().slice(0,60),items=r.items.map(recipeItem).filter(Boolean).slice(0,30);
      if(!items.length||names.has(key(n)))continue;
      names.add(key(n));
      const id=Number.isInteger(r.id)&&r.id>0&&!ids.has(r.id)?r.id:Math.max(0,...ids)+1,s=Math.round(r.s);
      ids.add(id);out.push({id,n,s:s>=1&&s<=50?s:1,items});
      if(out.length===50)break;
    }
    return out;
  }
  /* Bir besin için kalem toplamı yalnız TÜM kalemlerde veri varsa yazılır; kısmi toplam eksik değeri tam gibi gösterir. part: [besin, veri olan kalem sayısı]. */
  function recipeCalc(r){
    const g=r.items.reduce((s,i)=>s+i.g,0),tot={},part=[];
    for(const m of ["k",...NUTR]){
      const have=r.items.filter(i=>i[m]!=null).length;
      if(have===r.items.length)tot[m]=r.items.reduce((s,i)=>s+i[m]*i.g/100,0);else if(have)part.push([m,have]);
    }
    return {g,tot,part,n:r.items.length};
  }
  const recipeNote=c=>"Çiğ ağırlıklarla hesaplandı, pişince değişir; tahmindir."+c.part.map(([m,h])=>` ${RLBL[m][0].toUpperCase()+RLBL[m].slice(1)}: ${h}/${c.n} malzemede veri var, toplam yazılmadı.`).join("");
  /* Yemek arama listesindeki biçim (allFoods): tarif tek besin gibi aranır, porsiyon başı eklenir. */
  function recipeFood(r){
    const c=recipeCalc(r),pg=c.g/r.s,f={n:r.n,k:c.tot.k*100/c.g,my:true,src:"tarif",rec:r.id,hint:`Tarifim, ${r.s} porsiyon. ${recipeNote(c)}`,u:[[r.items.some(i=>i.por)?"1 porsiyon":`1 porsiyon (${Math.round(pg)} g)`,pg],["100 g",100]]};
    for(const m of NUTR)f[m]=c.tot[m]==null?null:c.tot[m]*100/c.g;
    return f;
  }
  const MEALS=[["kah","Kahvaltı"],["ogl","Öğle"],["aks","Akşam"],["atis","Atıştırmalık"]];
  const mealKey=k=>MEALS.some(m=>m[0]===k)?k:"";
  /* Eski kayıtta meal yok: saatten türer. */
  const mealOf=e=>{const h=+String(e.time).slice(0,2);return mealKey(e.meal)||(h>=5&&h<11?"kah":h>=11&&h<16?"ogl":h>=16&&h<21?"aks":"atis")};
  /* Günlük: öğün grupları (saat sırasıyla, alt toplam kcal), tek satıra inen su, kalanlar. */
  function dayLog(items){
    const meals=items.filter(e=>e.type==="yemek"),su=items.filter(WL.isWater),dr=items.filter(e=>e.type==="su"&&!WL.isWater(e));
    const groups=MEALS.map(([k,n])=>{const L=meals.filter(e=>mealOf(e)===k).sort((a,b)=>a.time.localeCompare(b.time)||a.id-b.id);return {k,n,items:L,kcal:L.reduce((s,e)=>s+(e.v||0),0)}}).filter(g=>g.items.length);
    return {groups,su,dr,suMl:su.reduce((s,e)=>s+(e.v||0),0),drMl:dr.reduce((s,e)=>s+(e.v||0),0),rest:items.filter(e=>e.type!=="yemek"&&e.type!=="su")};
  }
  const stalled=(snapAt,now,yest,prev7)=>(snapAt>0&&now-snapAt>26*36e5)||(yest===0&&prev7>1000);
  return {PER100,RLBL,cleanRecipes,recipeCalc,recipeNote,recipeFood,MEALS,mealKey,mealOf,dayLog,stalled,NUTR,MAX,copyNutr,key,cleanFav,cleanTpl,recents};
})();
if(typeof module!=="undefined")module.exports=LogLib;
