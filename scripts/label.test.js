const LB=require("../www/labellib.js"),L=require("../www/lablib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const P=l=>LB.parse(l).food;
const eq=(a,b)=>["k","p","c","f"].every(x=>Math.abs((a[x]??-1)-(b[x]??-1))<0.6);

// [satırlar, beklenen {k,p,c,f}, ad]
const cases=[
  ["100 g sütunu önce, kJ ve kcal birlikte",["Besin Değerleri  100 g başına  Porsiyon (30 g) başına","Enerji  1840 kJ / 440 kcal  552 kJ / 132 kcal","Yağ  13 g  3,9 g","  - Doymuş yağ  6,1 g  1,8 g","Karbonhidrat  70 g  21 g","  - Şekerler 25 g 7,5 g","Protein  8,5 g  2,6 g","Tuz 1,2 g"],{k:440,p:8.5,c:70,f:13}],
  ["100 g sütunu ikinci (porsiyon önce)",["Nutrition facts per serving | per 100 g","Energy 132 kcal 440 kcal","Fat 3,9 g 13 g","Carbohydrate 21 g 70 g","Protein 2,6 g 8,5 g"],{k:440,p:8.5,c:70,f:13}],
  ["yalnızca kJ varsa kcal'e çevrilir",["Enerji 1840 kJ","Yağ 13 g","Karbonhidrat 70 g","Protein 8,5 g"],{k:439.8,p:8.5,c:70,f:13}],
  ["birim başlıkta, değerler birimsiz",["Enerji (kcal) 440","Protein 8,5","Karbonhidrat 70","Yağ 13"],{k:440,p:8.5,c:70,f:13}],
  ["Toplam yağ / Toplam karbonhidrat",["Enerji 120 kcal","Toplam Yağ 2 g","Toplam Karbonhidrat 20 g","Protein 5 g"],{k:120,p:5,c:20,f:2}],
  ["doymuş yağ satırı toplam yağ sayılmaz",["Enerji 100 kcal","Doymuş yağ 6 g","Yağ 4 g","Karbonhidrat 10 g","Protein 5 g"],{k:100,p:5,c:10,f:4}],
  ["tek sütun, noktalı ondalık",["Enerji 52 kcal","Yağ 0.2 g","Karbonhidrat 13.8 g","Protein 0.3 g"],{k:52,p:0.3,c:13.8,f:0.2}],
  ["< niteleyicisi sayıyı korur",["Enerji 30 kcal","Yağ <0,5 g","Karbonhidrat 6 g","Protein 1 g"],{k:30,p:1,c:6,f:0.5}],
  ["madde işareti ve girinti",["• Enerji 250 kcal","- Yağ 10 g","- Karbonhidrat 30 g","- Protein 8 g"],{k:250,p:8,c:30,f:10}]
];
for(const [n,lines,exp] of cases)ok("etiket: "+n,eq(P(lines),exp),P(lines));
ok("eksik satır boş kalır, uydurulmaz",(r=>r.p===undefined&&r.k===440)(P(["Enerji 440 kcal","Yağ 13 g","Karbonhidrat 70 g"])));
ok("alakasız metin hiçbir şey çıkarmaz",LB.parse(["Üretici: ABC Gıda","İçindekiler: un, şeker, tuz","Son tüketim 12.2027"]).found.length===0);

// tutarlılık
const chk=(f,n)=>LB.check(n||"Test",f).status;
ok("tutarlı etiket ok",chk({k:440,p:8.5,c:70,f:13})==="ok");
ok("OCR rakam hatası (kalori 140 yerine 440) tutarsız bulunur",chk({k:140,p:8.5,c:70,f:13})==="bad");
ok("makro toplamı 100 g'ı aşarsa reddedilir",chk({k:300,p:50,c:50,f:20})==="bad");
ok("eksik makro partial",chk({k:440,p:8.5,c:70})==="partial");
ok("kalori yoksa none",chk({p:8.5,c:70,f:13})==="none");

// OCR kutularından satır kurma: sütunlar ayrı blok olarak gelir, y yukarıdan aşağı artar
const box=(t,x,y,w=120,h=30)=>({t,x,y,w,h});
const lines=L.ocrToLines({lines:[
  box("Enerji",50,400),box("440 kcal",500,402),box("Yağ",50,450),box("13 g",500,449),box("Karbonhidrat",50,500),box("70 g",500,501),box("Protein",50,550),box("8,5 g",500,548),
  box("Besin Değerleri",50,350,400),box("100 g başına",500,352)
]});
ok("OCR kutuları tablo satırlarına dönüşür",lines.length===5&&lines[1].startsWith("Enerji")&&/440 kcal/.test(lines[1]),lines);
ok("OCR satırlarından etiket çıkar",eq(P(lines),{k:440,p:8.5,c:70,f:13}),P(lines));
ok("boş OCR sonucu güvenli",L.ocrToLines(null).length===0&&L.ocrToLines({lines:[]}).length===0&&L.ocrToLines({lines:[{t:"x",x:0,y:0,w:1,h:0}]}).length===0);
ok("OCR'dan tahlil satırı okunur",(()=>{const ls=L.ocrToLines({lines:[box("Glukoz",50,100),box("98",400,101,40),box("mg/dL",500,100),box("70 - 100",650,99)]});const r=L.parseLine(ls[0]);return r&&r.k==="glukoz"&&r.v===98&&r.hi===100})());
console.log(bad?"\n"+bad+" HATA":"\nTüm etiket testleri geçti");process.exit(bad?1:0);
