const {ok,finish}=require("./ok");
const LB=require("../www/modules/nutrition/labellib.js"),L=require("../www/modules/labs/lablib.js");
const P=l=>LB.parse(l).food;
const eq=(a,b)=>["k","p","c","f"].every(x=>Math.abs((a[x]??-1)-(b[x]??-1))<0.6);

// [lines, expected {k,p,c,f}, name]
const cases=[
  ["100 g column first, kJ and kcal together",["Besin Değerleri  100 g başına  Porsiyon (30 g) başına","Enerji  1840 kJ / 440 kcal  552 kJ / 132 kcal","Yağ  13 g  3,9 g","  - Doymuş yağ  6,1 g  1,8 g","Karbonhidrat  70 g  21 g","  - Şekerler 25 g 7,5 g","Protein  8,5 g  2,6 g","Tuz 1,2 g"],{k:440,p:8.5,c:70,f:13}],
  ["100 g column second (serving first)",["Nutrition facts per serving | per 100 g","Energy 132 kcal 440 kcal","Fat 3,9 g 13 g","Carbohydrate 21 g 70 g","Protein 2,6 g 8,5 g"],{k:440,p:8.5,c:70,f:13}],
  ["with only kJ it is converted to kcal",["Enerji 1840 kJ","Yağ 13 g","Karbonhidrat 70 g","Protein 8,5 g"],{k:439.8,p:8.5,c:70,f:13}],
  ["unit in the header, values without units",["Enerji (kcal) 440","Protein 8,5","Karbonhidrat 70","Yağ 13"],{k:440,p:8.5,c:70,f:13}],
  ["Toplam yağ / Toplam karbonhidrat",["Enerji 120 kcal","Toplam Yağ 2 g","Toplam Karbonhidrat 20 g","Protein 5 g"],{k:120,p:5,c:20,f:2}],
  ["a saturated fat line is not total fat",["Enerji 100 kcal","Doymuş yağ 6 g","Yağ 4 g","Karbonhidrat 10 g","Protein 5 g"],{k:100,p:5,c:10,f:4}],
  ["single column, dot decimal",["Enerji 52 kcal","Yağ 0.2 g","Karbonhidrat 13.8 g","Protein 0.3 g"],{k:52,p:0.3,c:13.8,f:0.2}],
  ["the < qualifier keeps the number",["Enerji 30 kcal","Yağ <0,5 g","Karbonhidrat 6 g","Protein 1 g"],{k:30,p:1,c:6,f:0.5}],
  ["bullet and indentation",["• Enerji 250 kcal","- Yağ 10 g","- Karbonhidrat 30 g","- Protein 8 g"],{k:250,p:8,c:30,f:10}]
];
for(const [n,lines,exp] of cases)ok("label: "+n,eq(P(lines),exp),P(lines));
ok("a missing line stays empty, nothing is invented",(r=>r.p===undefined&&r.k===440)(P(["Enerji 440 kcal","Yağ 13 g","Karbonhidrat 70 g"])));
ok("unrelated text yields nothing",Object.values(LB.parse(["Üretici: ABC Gıda","İçindekiler: un, şeker, tuz","Son tüketim 12.2027"]).food).every(v=>v===undefined));

const X=l=>P(["Enerji 100 kcal",...l]);
ok("Tuz 1,2 g -> sodium 480 mg",X(["Tuz 1,2 g"]).na===480);
ok("Sodyum 400 mg -> 400",X(["Sodyum 400 mg"]).na===400);
ok("Şekerler 12 g -> sg 12",X(["  - Şekerler 12 g"]).sg===12);
ok("Diyet lifi 3 g -> fb 3",X(["Diyet lifi 3 g"]).fb===3);
ok("the 100 g column is chosen (fiber, sugar, salt)",(f=>f.fb===3&&f.sg===25&&f.na===480)(P(["Besin Değerleri 100 g başına Porsiyon (30 g) başına","Enerji 440 kcal 132 kcal","Karbonhidrat 70 g 21 g","Şekerler 25 g 7,5 g","Lif 3 g 0,9 g","Tuz 1,2 g 0,4 g"])));
ok("sugar/salt in the ingredients line is not a number",(f=>f.sg===undefined&&f.na===undefined)(X(["Şeker, tuz, un"])));
ok("check: fiber/sugar/sodium pass to the food, sugar above carbohydrate is dropped",(c=>c.food.na===480&&c.food.fb===3&&c.food.sg===undefined)(LB.check("T",{k:440,p:8.5,c:10,f:13,fb:3,sg:25,na:480})));

// realistic label texts (review regression): [name, lines, expected fields]
const reg=[
  ["carbohydrate and 'bunun şekere' on the same line",["Enerji 250 kcal","Karbonhidrat 12 g, bunun şekere 4 g"],{c:12,sg:4}],
  ["Tuz 0,5 g",["Enerji 250 kcal","Tuz 0,5 g"],{na:200}],
  ["Diyet lifi with a decimal comma",["Enerji 250 kcal","Diyet lifi 2,5 g"],{fb:2.5}],
  ["Sodyum 200 mg",["Enerji 250 kcal","Sodyum 200 mg"],{na:200}],
  ["Tuz <0,5 g",["Enerji 250 kcal","Tuz <0,5 g"],{na:200}],
  ["kJ/kcal and sugar",["Enerji 1046 kJ / 250 kcal","Şekerler 4 g"],{k:250,sg:4}],
  ["serving column first",["Besin öğeleri Porsiyon (25 g) 100 g","Enerji 125 kcal 500 kcal","Karbonhidrat 15 g 60 g","- Şekerler 10 g 40 g","Lif 1 g 4 g","Tuz 0,1 g 0,4 g"],{k:500,c:60,sg:40,fb:4,na:160}],
  ["English, dot decimal",["Energy 250 kcal","Sugars 4.5 g","Salt 0.75 g","Fibre 3.2 g"],{sg:4.5,na:300,fb:3.2}],
  ["saturated fat and sugars sub-line",["Enerji 500 kcal","Yağ 30 g","- Doymuş yağ 10 g","Karbonhidrat 50 g","- Şekerler 30 g","Protein 5 g"],{f:30,c:50,sg:30}],
  ["sodium in grams is converted to mg",["Enerji 250 kcal","Sodyum 0,2 g"],{na:200}],
  ["a wrapped ingredients line is not sugar/salt",["İçindekiler: un, bitkisel yağ,","şeker (%12), tuz (%1,5), maya","Enerji 400 kcal","Karbonhidrat 70 g","Şekerler 5 g","Tuz 0,8 g"],{c:70,sg:5,na:320}],
  ["an ingredients continuation starting with salt is ignored",["Enerji 400 kcal","tuz (%1,5), maya"],{na:undefined}],
  ["'bunlardan şekerler' line",["Enerji 400 kcal","Karbonhidrat 70 g","bunlardan şekerler 5 g"],{c:70,sg:5}],
  ["sugar alcohols are not sugar, the following Şekerler is read",["Enerji 230 kcal","Karbonhidrat 60 g","Şeker alkolleri (polioller) 55 g","Şekerler 0 g"],{sg:0}],
  ["the earlier sodium is kept",["Enerji 250 kcal","Sodyum 400 mg","Tuz 1 g"],{na:400}],
  ["a packaging claim is not fiber/sugar",["Lif kaynağı! %30 daha az şeker","Enerji 250 kcal","Lif 6 g","Şekerler 9 g"],{fb:6,sg:9}],
  ["salt without a unit counts as grams",["Enerji 250 kcal","Tuz 0,52"],{na:208}],
  ["sodium without a unit is not read",["Enerji 250 kcal","Sodyum 0,2"],{na:undefined}],
  ["two columns with 'bunun şekere': the 100 g column",["100 g'da Porsiyonda","Enerji 400 kcal 100 kcal","Karbonhidrat 12 g 3 g, bunun şekere 4 g 1 g"],{k:400,c:12,sg:4}],
  ["Tuz* 450 mg",["Enerji 250 kcal","Tuz* 450 mg"],{na:180}],
  ["Tuz 50 mg",["Enerji 250 kcal","Tuz 50 mg"],{na:20}],
  ["Sodyum ve %RI",["Enerji 250 kcal","Sodyum 200 mg %10"],{na:200}],
  ["%RI first on the sugar line",["Enerji 250 kcal","Şekerler %5 4 g"],{sg:4}]
];
for(const [n,l,exp] of reg){const f=P(l);ok("label: "+n,Object.keys(exp).every(k=>f[k]===exp[k]),f)}

const chk=(f,n)=>LB.check(n||"Test",f).status;
ok("a consistent label is ok",chk({k:440,p:8.5,c:70,f:13})==="ok");
ok("an OCR digit error (calories 140 instead of 440) is found inconsistent",chk({k:140,p:8.5,c:70,f:13})==="bad");
ok("rejected when the macro total exceeds 100 g",chk({k:300,p:50,c:50,f:20})==="bad");
ok("a missing macro gives partial",chk({k:440,p:8.5,c:70})==="partial");
ok("no calories gives none",chk({p:8.5,c:70,f:13})==="none");

// Building lines from OCR boxes: columns arrive as separate blocks, y grows downwards
const box=(t,x,y,w=120,h=30)=>({t,x,y,w,h});
const lines=L.ocrToLines({lines:[
  box("Enerji",50,400),box("440 kcal",500,402),box("Yağ",50,450),box("13 g",500,449),box("Karbonhidrat",50,500),box("70 g",500,501),box("Protein",50,550),box("8,5 g",500,548),
  box("Besin Değerleri",50,350,400),box("100 g başına",500,352)
]});
ok("OCR boxes become table rows",lines.length===5&&lines[1].startsWith("Enerji")&&/440 kcal/.test(lines[1]),lines);
ok("a label comes out of the OCR lines",eq(P(lines),{k:440,p:8.5,c:70,f:13}),P(lines));
ok("an empty OCR result is safe",L.ocrToLines(null).length===0&&L.ocrToLines({lines:[]}).length===0&&L.ocrToLines({lines:[{t:"x",x:0,y:0,w:1,h:0}]}).length===0);
ok("a lab line is read from OCR",(()=>{const ls=L.ocrToLines({lines:[box("Glukoz",50,100),box("98",400,101,40),box("mg/dL",500,100),box("70 - 100",650,99)]});const r=L.parseLine(ls[0]);return r&&r.k==="glukoz"&&r.v===98&&r.hi===100})());
finish();
