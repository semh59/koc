"use strict";
/* Besin listesi: 100 g başına değerler. Bu dosya elle değil, tools/besin/uret.js ile üretilir (kaynaklar: tools/besin/*.tsv, tarif.txt).
   Satır: [ad, kcal, protein g, karbonhidrat g, yağ g, [[porsiyon etiketi, gram], ...], 1, [lo, hi]]. İlk porsiyon varsayılandır.
   Karbonhidrat tanımı: USDA "Carbohydrate, by difference" (toplam karbonhidrat, lif DAHİL) ve USDA ile tarif hesaplı satırların tümünde aynıdır; ilk 106 satırdan USDA ile karşılaştırılmamış (1 işaretsiz) elle girilmiş olanlar yaklaşık değerdir. Paket etiketi ve Open Food Facts değerleri lifi ayrı sayar (lifsiz); barkoddan gelen besinler etiket tanımıyla gösterilir.
   Sondaki 1: USDA FoodData Central SR Legacy (CC0) değerleri birebir ya da eski elle derlenmiş satırın USDA ile karşılaştırılıp uyumlu bulunması. 0 ya da yok: tarif ve markaya göre değişen tahmin; tarif hesaplı satırlar USDA malzeme değerlerinden hesaplanmıştır (tools/besin/tarif.txt).
   [lo, hi]: tarif hesaplı satırlarda az ve bol yağlı varyantın 100 g başına kcal değeri. */
const FOODS=(()=>{
  const R=[
/*SATIRLAR*/
  ];
  /* Eski elle derlenmiş ev yemekleri için kural tablosu (tarif hesaplı satırlar kendi [lo, hi] değerini taşır): yağlı ya da hamurlu yemekte ±%30, sade yemekte ±%15 (kcal, 100 g başına). */
  /*ALT*/
  const SPREAD={y:0.3,s:0.15},HOME={
    s:["Mercimek çorbası","Ezogelin çorbası","Domates çorbası","Tarhana çorbası","Yayla çorbası","Kuru fasulye yemeği","Nohut yemeği","Etli sebze yemeği","Zeytinyağlı taze fasulye"],
    y:["Menemen","Su böreği (peynirli)","Gözleme (peynirli)","Lahmacun","Mantı (haşlanmış)","Pirinç pilavı","Bulgur pilavı","Karnıyarık","İmam bayıldı","Zeytinyağlı yaprak sarma","Izgara köfte","İçli köfte"]};
  const cls=n=>HOME.s.includes(n)?"s":HOME.y.includes(n)?"y":null;
  return R.map(([n,k,p,c,f,u,s,r])=>{const sp=SPREAD[cls(n)];return Object.assign({n,k,p,c,f,u,s:s===1},r?{lo:r[0],hi:r[1]}:sp?{lo:Math.round(k*(1-sp)),hi:Math.round(k*(1+sp))}:{},ALT[n]?{a:ALT[n]}:{})});
})();

/* Koç menü kataloğu yalnız yemek odaklı ilk satırlardan örneklenir; ham besin ve tarif satırları isteği şişirmesin. */
const FOOD_CORE=/*CORE*/;
const foodLow=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase().replace(/ı/g,"i").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u");
/* Ada ve eş adlara göre ara (ç/ğ/ı/ö/ş/ü duyarsız): kelime başı eşleşmeleri önce gelir. En fazla `max` sonuç, FOODS indeksi döner. */
function foodSearch(q,max=8,list=FOODS){
  const t=foodLow(q).trim();if(!t)return [];
  const hit=[];
  list.forEach((f,i)=>{
    const n=foodLow(f.n),at=n.indexOf(t),al=f.a?foodLow(f.a):"";
    if(at<0&&!al.includes(t))return;
    hit.push({i,rank:(at<0?3:at===0?0:n.includes(" "+t)?1:2)-(f.my?1:0)}); // kendi besinlerim aynı eşleşmede öne geçer
  });
  return hit.sort((a,b)=>a.rank-b.rank||a.i-b.i).slice(0,max).map(h=>h.i);
}
if(typeof module!=="undefined")module.exports={FOODS,foodSearch};
