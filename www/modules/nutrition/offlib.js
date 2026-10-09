"use strict";
/* Validates an Open Food Facts product response and turns it into a food record (no DOM, no network).
   Status: ok = calories and the three macros are present and consistent (saved automatically)
           partial = calories present, a macro missing (used, not saved)
           bad = values inconsistent or impossible (not used)
           none = no product or no calorie information */
const OffLib=(()=>{
  const FIELDS="code,product_name,product_name_tr,brands,nutriments,serving_quantity,product_quantity";
  const nm=x=>{const v=typeof x==="string"?parseFloat(x.replace(",",".")):x;return Number.isFinite(v)?v:null};
  const r1=x=>x==null?null:Math.round(x*10)/10;
  const within=(x,max)=>x!=null&&x>=0&&x<=max?x:null;
  function parse(json){
    if(!json||json.status!==1||!json.product)return {status:"none",why:"Ürün bulunamadı"};
    const p=json.product,n=p.nutriments||{};
    let k=nm(n["energy-kcal_100g"]);
    if(k==null){const kj=nm(n["energy-kj_100g"]!=null?n["energy-kj_100g"]:n.energy_100g);if(kj!=null)k=kj/4.184}
    const pr=nm(n.proteins_100g),c=nm(n.carbohydrates_100g),f=nm(n.fat_100g);
    const brand=String(p.brands||"").split(",")[0].trim(),base=String(p.product_name_tr||p.product_name||"").trim();
    if(!base||k==null)return {status:"none",why:"Üründe ad ya da kalori bilgisi yok"};
    const name=(brand&&!base.toLowerCase().includes(brand.toLowerCase())?`${base} (${brand})`:base).slice(0,60);
    if(!(k>=0&&k<=900))return {status:"bad",why:"Kalori değeri makul değil"};
    const macros=[pr,c,f];
    if(macros.some(x=>x!=null&&!(x>=0&&x<=100))||macros.reduce((s,x)=>s+(x||0),0)>100.5)return {status:"bad",why:"Besin değerleri makul değil"};
    const sod=nm(n.sodium_100g),salt=nm(n.salt_100g),sugar=nm(n.sugars_100g);
    const sub={fb:within(nm(n.fiber_100g),100),sg:within(sugar,c==null?100:Math.min(100,c+0.5)),na:within(sod!=null?sod*1000:salt!=null?salt*400:null,40000)};
    const sq=nm(p.serving_quantity),pq=nm(p.product_quantity),u=[];
    if(sq>=1&&sq<=2000)u.push([`1 porsiyon (${r1(sq)} g)`,sq]);
    if(pq>=1&&pq<=5000&&pq!==sq)u.push([`1 paket (${r1(pq)} g)`,pq]);
    u.push(["100 g",100]);
    const food={n:name,k:r1(k),p:r1(pr),c:r1(c),f:r1(f),u,b:String(p.code||"")};
    for(const m in sub)if(sub[m]!=null)food[m]=r1(sub[m]);
    if(macros.some(x=>x==null))return {status:"partial",why:"Bazı besin değerleri eksik",food};
    const a=4*pr+4*c+9*f;
    if(Math.abs(k-a)>Math.max(20,0.25*Math.max(k,a)))return {status:"bad",why:"Kalori, besin değerleriyle tutarlı değil",food};
    return {status:"ok",food};
  }
  return {FIELDS,parse};
})();
if(typeof module!=="undefined")module.exports=OffLib;
