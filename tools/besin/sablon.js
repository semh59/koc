"use strict";
/* Besin listesi: 100 g başına değerler. Bu dosya elle değil, tools/besin/uret.js ile üretilir (kaynaklar: tools/besin/*.tsv, tarif.txt).
   Satır: [ad, kcal, protein g, karbonhidrat g, yağ g, [[porsiyon etiketi, gram], ...], 1, [lo, hi], 1]. İlk porsiyon varsayılandır.
   Karbonhidrat tanımı: USDA "Carbohydrate, by difference" (toplam karbonhidrat, lif DAHİL) ve USDA ile tarif hesaplı satırların tümünde aynıdır. Paket etiketi ve Open Food Facts değerleri lifi ayrı sayar (lifsiz); barkoddan gelen besinler etiket tanımıyla gösterilir.
   Sondaki 1: USDA FoodData Central SR Legacy (CC0) değerleri birebir ya da eski elle derlenmiş satırın USDA ile karşılaştırılıp uyumlu bulunması. 0 ya da yok: tarif ve markaya göre değişen tahmin; tarif hesaplı satırlar USDA malzeme değerlerinden hesaplanmıştır (tools/besin/tarif.txt). Tüm satırların dayanağı belgelidir: ilk 106 satırın USDA ile birebir olanları tools/besin/eski.tsv'de, tarif ya da vekil hesabı olanları eski.txt'te (nedenleri vekil.tsv'de) tutulur; yalnız Et döner ve Sucuk (pişmiş) bilinçli ayarlı değerlerini ve vekil.tsv'deki çapraz kontrol notunu korur.
   Son 1 (o): öğün kaydı (tek tabak, menü, restoran porsiyonu; arayüzde "Öğün" etiketi). Öğünlerde [lo, hi]: tarif bileşeninin aralığı ya da restoran porsiyonu için ±%30.
   [lo, hi]: tarif hesaplı satırlarda az ve bol yağlı varyantın 100 g başına kcal değeri; vekil.txt satırlarında vekil/ev değişkenliği aralığı (±%15-45).
   v: vekil nedeni ya da çapraz kontrol notu (tools/besin/vekil.tsv); arayüzde "Tahmini değer." notundan sonra gösterilir. CIQUAL ve CoFID değerli satırlar da 0 işaretlidir (1 yalnız USDA). */
const FOODS=(()=>{
  const R=[
/*SATIRLAR*/
  ];
  /*ALT*/
  return R.map(([n,k,p,c,f,u,s,r,o])=>Object.assign({n,k,p,c,f,u,s:s===1},r?{lo:r[0],hi:r[1]}:{},ALT[n]?{a:ALT[n]}:{},VEK[n]?{v:VEK[n]}:{},o?{o:true}:{},PARCA[n]?{parts:PARCA[n]}:{}));
})();

/* Koç menü kataloğu yalnız yemek odaklı ilk satırlardan örneklenir; ham besin ve tarif satırları isteği şişirmesin. */
const FOOD_CORE=/*CORE*/;
const foodLow=s=>" "+String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase().replace(/ı/g,"i").replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u").replace(/[^\p{L}\p{N}]+/gu," ").trim()+" ";
/* Her tuşta yüzlerce adı yeniden çevirmemek için besin adları önbellekte. */
const foodKeys=new Map(),foodKey=s=>{let v=foodKeys.get(s);if(v==null)foodKeys.set(s,v=foodLow(s));return v};
/* Ada ve eş adlara göre ara (ç/ğ/ı/ö/ş/ü duyarsız). Sıra: tam ad, tam kelime (iyelik ekiyle: pilavı, peyniri), kelime başı, ad içi, sırasız kelimeler, eş ad.
   En fazla `max` sonuç, FOODS indeksi döner. */
function foodSearch(q,max=8,list=FOODS){
  const t=foodLow(q).trim();if(!t)return [];
  const ws=t.split(" "),whole=new RegExp(" "+t+"(s?[iu])? "),hit=[];
  list.forEach((f,i)=>{
    const n=foodKey(f.n),al=f.a?foodKey(f.a):"";
    const r=whole.test(n)?0:n.includes(" "+t)?1:n.includes(t)?2:ws.every(w=>n.includes(w))?3:ws.every(w=>n.includes(w)||al.includes(w))?4:-1;
    if(r>=0)hit.push({i,rank:r-(n===" "+t+" "?1:0)-(f.my?1:0)+(f.o?1:0)}); // kendi besinlerim öne geçer; öğün kayıtları aynı eşleşmede ham besinden sonra gelir
  });
  return hit.sort((a,b)=>a.rank-b.rank||a.i-b.i).slice(0,max).map(h=>h.i);
}
if(typeof module!=="undefined")module.exports={FOODS,foodSearch};
