"use strict";
/* Besin listesi: 100 g başına yaklaşık değerler (TürKomp ve USDA'dan derlenmiş yuvarlak sayılar).
   Satır: [ad, kcal, protein g, karbonhidrat g, yağ g, [[porsiyon etiketi, gram], ...], 1]. İlk porsiyon varsayılandır.
   Sondaki 1: USDA FoodData Central SR Legacy (CC0) ile karşılaştırılıp uyumlu bulunmuş. Diğerleri tarife ve markaya göre değişen tahmindir. */
const FOODS=(()=>{
  const R=[
    /* Kahvaltılık */
    ["Haşlanmış yumurta",155,13,1.1,11,[["1 adet (50 g)",50]],1],
    ["Sahanda yumurta",196,13.6,0.8,15,[["1 adet (46 g)",46]],1],
    ["Omlet",154,10,1,12,[["2 yumurtalı (120 g)",120]],1],
    ["Menemen",132,6.5,4,10,[["1 porsiyon (200 g)",200]]],
    ["Beyaz peynir",264,17,1.5,21,[["1 dilim (30 g)",30],["1 kibrit kutusu (40 g)",40]]],
    ["Kaşar peyniri",356,25,1,28,[["1 dilim (20 g)",20]],1],
    ["Lor peyniri",94,11,3.5,4,[["3 yemek kaşığı (60 g)",60]]],
    ["Zeytin",146,1,4,14,[["5 adet (20 g)",20],["10 adet (40 g)",40]]],
    ["Bal",304,0.3,82,0,[["1 yemek kaşığı (20 g)",20],["1 tatlı kaşığı (10 g)",10]],1],
    ["Reçel",250,0.4,65,0.1,[["1 yemek kaşığı (20 g)",20]]],
    ["Pekmez",293,1,73,0.1,[["1 yemek kaşığı (20 g)",20]]],
    ["Tahin",595,17,21,54,[["1 yemek kaşığı (15 g)",15]],1],
    ["Tereyağı",717,0.9,0.1,81,[["1 tatlı kaşığı (5 g)",5],["1 yemek kaşığı (14 g)",14]],1],
    ["Zeytinyağı",884,0,0,100,[["1 yemek kaşığı (10 g)",10],["1 tatlı kaşığı (5 g)",5]],1],
    ["Yulaf ezmesi (kuru)",389,17,66,7,[["4 yemek kaşığı (40 g)",40]]],
    ["Mısır gevreği",375,7,84,0.9,[["1 kase (30 g)",30]]],
    /* Ekmek ve hamur işi */
    ["Beyaz ekmek",261,9,49,3.2,[["1 dilim (30 g)",30],["1/4 somun (50 g)",50]]],
    ["Tam buğday ekmeği",244,10,43,3.5,[["1 dilim (30 g)",30]]],
    ["Simit",287,9,55,3.5,[["1 adet (120 g)",120]]],
    ["Lavaş",300,8,50,7,[["1 adet (60 g)",60]]],
    ["Tost (kaşarlı)",268,12,28,12,[["1 adet (130 g)",130]]],
    ["Gözleme (peynirli)",242,8,30,10,[["1 adet (150 g)",150]]],
    ["Su böreği (peynirli)",262,9,25,14,[["1 dilim (100 g)",100]]],
    ["Lahmacun",232,12,28,8,[["1 adet (120 g)",120]]],
    ["Pizza",266,11,33,10,[["1 dilim (110 g)",110]]],
    ["Hamburger",251,13,25,11,[["1 adet (180 g)",180]]],
    /* Çorbalar */
    ["Mercimek çorbası",61,3.5,8.5,1.5,[["1 kase (250 g)",250],["1 kepçe (150 g)",150]]],
    ["Ezogelin çorbası",62,2.5,9,1.8,[["1 kase (250 g)",250]]],
    ["Domates çorbası",50,1.2,8,1.5,[["1 kase (250 g)",250]]],
    ["Tarhana çorbası",55,2.5,8,1.5,[["1 kase (250 g)",250]]],
    ["Yayla çorbası",61,2.5,6,3,[["1 kase (250 g)",250]]],
    /* Pilav, makarna, baklagil */
    ["Pirinç pilavı",150,2.8,28,3,[["1 porsiyon (150 g)",150],["1 kepçe (100 g)",100]]],
    ["Bulgur pilavı",120,3.5,22,2,[["1 porsiyon (150 g)",150]]],
    ["Makarna (haşlanmış)",155,5.8,31,0.9,[["1 porsiyon (200 g)",200]],1],
    ["Mantı (haşlanmış)",170,7,22,6,[["1 porsiyon (200 g)",200]]],
    ["Kuru fasulye yemeği",112,6,13,4,[["1 porsiyon (250 g)",250]]],
    ["Nohut yemeği",140,7,18,4.5,[["1 porsiyon (250 g)",250]]],
    ["Mercimek (haşlanmış)",119,9,20,0.4,[["1 porsiyon (150 g)",150]],1],
    ["Nohut (haşlanmış)",167,9,27,2.6,[["1 porsiyon (150 g)",150]],1],
    ["Humus",178,8,14,10,[["3 yemek kaşığı (90 g)",90]]],
    /* Et, tavuk, balık */
    ["Izgara tavuk göğsü",160,31,0,3.6,[["1 porsiyon (150 g)",150]],1],
    ["Fırın tavuk but",205,26,0,11,[["1 adet (150 g)",150]]],
    ["Tavuk döner",190,24,1,10,[["1 porsiyon (150 g)",150]]],
    ["Et döner",218,22,1,14,[["1 porsiyon (150 g)",150]]],
    ["Adana kebap",247,17,2,19,[["1 porsiyon (150 g)",150]]],
    ["Izgara köfte",236,18,5,16,[["4 adet (120 g)",120]]],
    ["İçli köfte",240,8,25,12,[["1 adet (80 g)",80]]],
    ["Izgara et (biftek)",248,26,0,16,[["1 porsiyon (120 g)",120]]],
    ["Pişmiş kıyma",239,26,0,15,[["1 porsiyon (100 g)",100]]],
    ["Izgara balık (levrek, çipura)",138,22,0,5.5,[["1 porsiyon (150 g)",150]]],
    ["Izgara somon",196,22,0,12,[["1 porsiyon (150 g)",150]],1],
    ["Ton balığı (konserve, suda)",86,19.4,0,1,[["1 küçük kutu (80 g)",80]],1],
    ["Sucuk (pişmiş)",456,22,2,40,[["5 dilim (50 g)",50]]],
    ["Hindi salam",108,16,2,4,[["3 dilim (45 g)",45]]],
    /* Sebze yemekleri ve salatalar */
    ["Etli sebze yemeği",97,7,6,5,[["1 porsiyon (250 g)",250]]],
    ["Karnıyarık",133,6,7,9,[["1 adet (250 g)",250]]],
    ["İmam bayıldı",110,1.5,8,8,[["1 adet (200 g)",200]]],
    ["Zeytinyağlı taze fasulye",94,2,8,6,[["1 porsiyon (200 g)",200]]],
    ["Zeytinyağlı yaprak sarma",188,3,25,8.5,[["5 adet (150 g)",150]]],
    ["Çoban salatası",60,1,5,4,[["1 porsiyon (200 g)",200]]],
    ["Yeşil salata",15,1.4,2.9,0.2,[["1 kase (100 g)",100]],1],
    ["Domates",18,0.9,3.9,0.2,[["1 orta (120 g)",120]],1],
    ["Salatalık",15,0.7,3.6,0.1,[["1 adet (100 g)",100]],1],
    ["Havuç",41,0.9,9.6,0.2,[["1 orta (70 g)",70]],1],
    ["Brokoli (haşlanmış)",35,2.4,7,0.4,[["1 porsiyon (150 g)",150]],1],
    ["Haşlanmış patates",88,1.9,20,0.1,[["1 orta (150 g)",150]],1],
    ["Patates kızartması",312,3.4,41,15,[["1 porsiyon (150 g)",150]]],
    ["Haşlanmış mısır",96,3.4,21,1.5,[["1 koçan (150 g)",150]],1],
    /* Süt ürünleri ve içecekler */
    ["Süt (tam yağlı)",62,3.2,4.8,3.3,[["1 su bardağı (200 ml)",200],["1 çay bardağı (100 ml)",100]],1],
    ["Yoğurt (tam yağlı)",62,3.5,4.7,3.3,[["1 kase (150 g)",150],["1 yemek kaşığı (20 g)",20]],1],
    ["Ayran",34,1.7,2.4,1.9,[["1 bardak (200 ml)",200],["1 küçük şişe (250 ml)",250]]],
    ["Kefir",60,3.4,4.5,3.3,[["1 bardak (200 ml)",200]]],
    ["Kola",42,0,10.6,0,[["1 kutu (330 ml)",330]]],
    ["Meyve suyu",46,0.5,11,0.1,[["1 bardak (200 ml)",200]]],
    ["Şeker",387,0,100,0,[["1 çay kaşığı (5 g)",5],["1 küp (4 g)",4]],1],
    /* Meyve ve kuruyemiş */
    ["Elma",52,0.3,14,0.2,[["1 orta (180 g)",180]],1],
    ["Muz",89,1.1,23,0.3,[["1 orta (120 g)",120]],1],
    ["Portakal",47,0.9,12,0.1,[["1 orta (180 g)",180]],1],
    ["Mandalina",53,0.8,13,0.3,[["1 adet (80 g)",80]],1],
    ["Çilek",32,0.7,7.7,0.3,[["1 kase (150 g)",150]],1],
    ["Üzüm",69,0.7,18,0.2,[["1 avuç (100 g)",100]],1],
    ["Karpuz",30,0.6,7.6,0.2,[["1 dilim (300 g)",300]],1],
    ["Kavun",34,0.8,8,0.2,[["1 dilim (200 g)",200]],1],
    ["Şeftali",39,0.9,10,0.3,[["1 adet (150 g)",150]],1],
    ["Armut",57,0.4,15,0.1,[["1 adet (170 g)",170]],1],
    ["Kiraz",63,1.1,16,0.2,[["1 avuç (100 g)",100]],1],
    ["İncir (taze)",74,0.8,19,0.3,[["2 adet (100 g)",100]],1],
    ["Kivi",61,1.1,15,0.5,[["1 adet (75 g)",75]],1],
    ["Nar",83,1.7,19,1.2,[["1 kase (100 g)",100]],1],
    ["Kuru üzüm",299,3,79,0.5,[["1 avuç (30 g)",30]]],
    ["Kuru kayısı",241,3.4,63,0.5,[["5 adet (40 g)",40]],1],
    ["Fındık",628,15,17,61,[["1 avuç (30 g)",30]],1],
    ["Ceviz",654,15,14,65,[["3 adet (30 g)",30]],1],
    ["Badem",579,21,22,50,[["1 avuç (30 g)",30]],1],
    /* Tatlı ve atıştırmalık */
    ["Baklava",431,6,50,23,[["1 dilim (50 g)",50]]],
    ["Sütlaç",128,3.2,21,3.5,[["1 kase (150 g)",150]]],
    ["Kazandibi",140,4,22,4,[["1 porsiyon (150 g)",150]]],
    ["Künefe",324,7,38,16,[["1 porsiyon (150 g)",150]]],
    ["Aşure",142,3,28,2,[["1 kase (200 g)",200]]],
    ["Helva (tahin)",509,12,50,29,[["1 dilim (30 g)",30]]],
    ["Lokum",345,0.5,85,0.3,[["2 adet (30 g)",30]]],
    ["Sütlü çikolata",536,7.5,59,30,[["1 küçük bar (25 g)",25],["1 kare (5 g)",5]],1],
    ["Bisküvi (petibör)",436,7,75,12,[["4 adet (25 g)",25]]],
    ["Kek (sade)",382,5,50,18,[["1 dilim (60 g)",60]]],
    ["Dondurma",209,3.5,24,11,[["1 top (60 g)",60]],1],
    ["Cips",544,6.5,53,34,[["1 küçük paket (30 g)",30]],1]
  ];
  /* Ev yemeği kural tablosu: tarif farkı yağ ve hamur miktarına bağlıdır. Yağlı ya da hamurlu yemekte ±%30, sade yemekte ±%15 (kcal, 100 g başına). */
  const SPREAD={y:0.3,s:0.15},HOME={
    s:["Mercimek çorbası","Ezogelin çorbası","Domates çorbası","Tarhana çorbası","Yayla çorbası","Kuru fasulye yemeği","Nohut yemeği","Etli sebze yemeği","Zeytinyağlı taze fasulye"],
    y:["Menemen","Su böreği (peynirli)","Gözleme (peynirli)","Lahmacun","Mantı (haşlanmış)","Pirinç pilavı","Bulgur pilavı","Karnıyarık","İmam bayıldı","Zeytinyağlı yaprak sarma","Izgara köfte","İçli köfte"]};
  const cls=n=>HOME.s.includes(n)?"s":HOME.y.includes(n)?"y":null;
  return R.map(([n,k,p,c,f,u,s])=>{const sp=SPREAD[cls(n)];return Object.assign({n,k,p,c,f,u,s:s===1},sp?{lo:Math.round(k*(1-sp)),hi:Math.round(k*(1+sp))}:{})});
})();

const foodLow=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();
/* Ada göre ara: kelime başı eşleşmeleri önce gelir. En fazla `max` sonuç, FOODS indeksi döner. */
function foodSearch(q,max=8,list=FOODS){
  const t=foodLow(q).trim();if(!t)return [];
  const hit=[];
  list.forEach((f,i)=>{
    const n=foodLow(f.n),at=n.indexOf(t);
    if(at<0)return;
    hit.push({i,rank:(at===0?0:n.includes(" "+t)?1:2)-(f.my?1:0)}); // kendi besinlerim aynı eşleşmede öne geçer
  });
  return hit.sort((a,b)=>a.rank-b.rank||a.i-b.i).slice(0,max).map(h=>h.i);
}
if(typeof module!=="undefined")module.exports={FOODS,foodSearch};
