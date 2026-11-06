"use strict";
const assert=require("node:assert/strict");
const {FAMILIES,renderMatrix}=require("./render-figure-pilot");
const F=require("../www/modules/gym/figlib");

assert.equal(FAMILIES.length,9,"9 hareket ailesi eksiksiz olmalı");
const families=FAMILIES.map(f=>f.family);
for(const expected of ["squat","bench","hinge","lunge","row","carry","cardio","mobility","balance"]){
  assert.ok(families.includes(expected),"Aile bulunmalı: "+expected);
}

for(const item of FAMILIES){
  const lineSvg=F.svg(item.def,{variant:"line"});
  const volSvg=F.svg(item.def,{variant:"volume",ghost:true});

  assert.ok(lineSvg.includes('viewBox="0 0 160 150"'),"viewBox standart olmalı");
  assert.ok(volSvg.includes('viewBox="0 0 160 150"'),"viewBox standart olmalı");
  assert.ok(!lineSvg.includes('data-fig-variant="volume"'),"Varsayılan çizgi stili değişmemeli");
  assert.ok(volSvg.includes('data-fig-variant="volume"'),"Pilot stil hacimli olmalı");
  assert.ok(volSvg.includes('data-ground-shadow="fixed"'),"Zemin gölgesi bulunmalı");
  assert.ok(volSvg.includes('data-ghost="start"'),"Başlangıç ghost pozisyonu bulunmalı");
  assert.ok(volSvg.includes('data-ghost="end"'),"Bitiş ghost pozisyonu bulunmalı");
  assert.ok(!/id="[^"]*"/.test(volSvg),"Tekil ID çakışması olmamalı");
  assert.ok(!/NaN|undefined/.test(volSvg),"Geçersiz sayısal koordinat olmamalı");
}

const html=renderMatrix();
assert.ok(html.includes("data-family=\"squat\""));
assert.ok(html.includes("data-family=\"carry\""));
assert.ok(html.includes("figure-pilot.html")||html.includes("Figür Pilot Matrisi"));

console.log("PASS gym-figure-matrix: 9 aile, geriye dönük uyumluluk, 2.5D hacim ve ghost doğrulaması tamamlandı");
