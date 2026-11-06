"use strict";
const F=require("../www/modules/gym/figlib"),T=require("../www/modules/gym/figtpl");
const FAMILIES=[
  {family:"squat",name:"Bodyweight Squat",def:T.squat},
  {family:"bench",name:"Push Up",def:T.pushup},
  {family:"hinge",name:"Barbell Deadlift",def:T.hinge},
  {family:"lunge",name:"Forward Lunge",def:T.lunge},
  {family:"row",name:"Dumbbell Row",def:T.row},
  {family:"carry",name:"Farmer Walk (Pilot Carry)",def:{frames:[{t:0,a1:8,a2:8,l1:16,l2:-10,m1:-16,m2:10},{t:0,a1:8,a2:8,l1:-16,l2:10,m1:16,m2:-10}],prop:{k:"db",at:"wrist"}}},
  {family:"cardio",name:"High Knees",def:T.highknees},
  {family:"mobility",name:"Hamstring Stretch",def:T.hamstretch},
  {family:"balance",name:"Single Leg Stand",def:T.onefoot}
];

function renderMatrix(){
  const cards=FAMILIES.map(item=>{
    const lineSvg=F.svg(item.def,{label:item.name+" (Klasik Çizgi)",anim:true,variant:"line"});
    const volSvg=F.svg(item.def,{label:item.name+" (2.5D Hacim & Ghost)",anim:true,variant:"volume",ghost:true});
    return [
      '<section class="card" data-family="'+item.family+'">',
      '  <h3>'+item.name+' <small>('+item.family+')</small></h3>',
      '  <div class="row">',
      '    <div class="box">',
      '      <b>Klasik (Çizgi)</b>',
      '      '+lineSvg,
      '    </div>',
      '    <div class="box vol">',
      '      <b>2.5D Pilot (Hacim & Ghost)</b>',
      '      '+volSvg,
      '    </div>',
      '  </div>',
      '</section>'
    ].join("\n");
  }).join("\n");

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>NeoWell B-4 Figür Pilot Matrisi</title>
<link rel="stylesheet" href="../app.css">
<style>
  body{margin:0;padding:24px;background:var(--bg,#0b0f19);color:var(--text,#f8fafc);font-family:system-ui,-apple-system,sans-serif}
  h1{margin:0 0 8px;font-size:24px}
  p{margin:0 0 24px;color:var(--mut,#94a3b8)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}
  .card{background:var(--card,#131d31);border:1px solid var(--line,#22324f);border-radius:12px;padding:16px}
  .card h3{margin:0 0 12px;font-size:16px;display:flex;justify-content:space-between;align-items:center}
  .card h3 small{color:var(--mut,#94a3b8);font-weight:400}
  .row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .box{background:var(--field,#1c2a44);border-radius:8px;padding:8px;text-align:center}
  .box b{display:block;margin-bottom:6px;font-size:12px;color:var(--mut,#94a3b8)}
  .box svg{max-width:140px;height:auto;margin:0 auto}
  .meta{margin-top:24px;font-size:13px;color:var(--mut,#94a3b8);border-top:1px solid var(--line,#22324f);padding-top:12px}
</style>
</head>
<body>
  <h1>NeoWell Çöp Adam 2.5D Görsel Pilot Matrisi (B-4)</h1>
  <p>9 hareket ailesi için klasik çizgi ve geriye dönük uyumlu 2.5D hacim/ghost karşılaştırması. Katalog genişletilmemiştir.</p>
  <div class="grid">
    ${cards}
  </div>
  <div class="meta">
    Doğrulama: viewBox sabit (160x150), SVG-SMIL animasyonu çalışır, kimlik çakışması yok, reduce-motion desteklenir.
  </div>
</body>
</html>`;
}

if(typeof module!=="undefined")module.exports={FAMILIES,renderMatrix};
if(require.main===module){
  const fs=require("fs"),path=require("path");
  const html=renderMatrix();
  const outWww=path.join(__dirname,"..","www","figure-pilot.html");
  const outAndroid=path.join(__dirname,"..","android","app","src","main","assets","public","figure-pilot.html");
  fs.writeFileSync(outWww,html,"utf-8");
  fs.writeFileSync(outAndroid,html,"utf-8");
  console.log("WROTE "+outWww+" and "+outAndroid);
}
