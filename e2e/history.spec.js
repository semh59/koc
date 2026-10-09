"use strict";
/* Geçmiş: takvim, aylar, ara, gün ekranı; 3 yıllık veriyle erişilebilirlik (axe), dokunma hedefi, taşma ve çizim süresi. */
const {test,expect,state}=require("./fixtures");
const {axe,small,scaleText,overflow}=require("./a11y");

const iso=(y,m,d)=>`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
/* 2023-10-07 → 2026-10-06 (bugün), her gün birkaç kayıt. */
function threeYears(){
  const entries=[],now=Date.UTC(2026,9,6);let id=1;
  for(let i=0;i<1095;i++){
    const t=new Date(now-i*864e5),day=iso(t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate());
    entries.push({id:id++,day,time:"08:00",type:"food",v:500,text:i===700?"Mercimek çorbası":"Yulaf"},{id:id++,day,time:"13:00",type:"food",v:700,text:"Tavuk pilav"},
      {id:id++,day,time:"10:00",type:"water",v:250,text:""});
    if(i%3===0)entries.push({id:id++,day,time:"18:00",type:"exercise",v:40,text:"Yürüyüş"});
    if(i%7===0)entries.push({id:id++,day,time:"07:00",type:"weight",v:90-i/60,text:""});
  }
  return {entries,nextId:id};
}
const seed=theme=>{const d=threeYears();return state({theme,stepsOn:false},{entries:d.entries,nextId:d.nextId})};

for(const theme of ["","dark"]){
  test(`Geçmiş ekranları (${theme||"açık"}): axe, dokunma hedefi, taşma`,async({app,page})=>{
    await app.open({seed:seed(theme)});
    for(const [steps,git] of [["takvim",async()=>{await app.go("history")}],["aylar",async()=>{await page.locator('[data-hg="seg:ay"]').click()}],["ara",async()=>{await page.locator('[data-hg="seg:ara"]').click();await page.fill("#hgq","mercimek")}],["gün",async()=>{await page.locator('[data-hg="seg:tak"]').click();await page.locator('[data-hg^="day:2026-10-05"]').click()}]]){
      await git();await page.waitForTimeout(150);
      expect(await axe(page),steps+" axe").toEqual([]);
      expect(await small(page),steps+" dokunma hedefi").toEqual([]);
      expect(await overflow(page),steps+" taşma").toEqual([]);
    }
  });
}
test("Geçmiş: büyük yazıda taşma yok (takvim ve gün)",async({app,page})=>{
  await app.open({seed:seed("")});
  await app.go("history");await scaleText(page,2);expect(await overflow(page)).toEqual([]);
  await page.locator('[data-hg^="day:2026-10-05"]').click();expect(await overflow(page)).toEqual([]);
});
test("Geçmiş: 3 yıl öncesine takvimden gidilir, oradaki kayıt görünür; arama 2 yıl önceki yemeği bulur ve güne götürür",async({app,page})=>{
  await app.open({seed:seed("")});
  await app.go("history");
  await page.selectOption("#hgy","2023");await page.selectOption("#hgm","11");
  await page.locator('[data-hg="day:2023-11-02"]').click();
  await expect(page.locator("#view")).toContainText("Tavuk pilav");
  await expect(page.locator("#ttl")).toContainText("Gün");
  await app.go("history");
  await page.locator('[data-hg="seg:ara"]').click();await page.fill("#hgq","MERCİMEK");
  await expect(page.locator("#hgres")).toContainText("1 kayıt");
  await page.locator('#hgres [data-hg^="day:"]').click();
  await expect(page.locator("#view")).toContainText("Mercimek çorbası");
});
test("Geçmiş: 3 yıllık veriyle takvim, aylar ve Trend Tümü çizimi hızlı",async({app,page})=>{
  await app.open({seed:seed("")});
  const ms=await page.evaluate(()=>{const t=performance.now();tab="history";render();hg.seg="ay";render();hg.seg="tak";render();tab="day";logOff=500;render();return performance.now()-t});
  expect(ms,"takvim+aylar+gün çizimi (ms)").toBeLessThan(1500);
  const tr=await page.evaluate(()=>{const t=performance.now();range=0;tab="trend";render();return performance.now()-t});
  expect(tr,"Trend Tümü çizimi (ms)").toBeLessThan(1500);
});
test("Geçmiş: Bugün ve Daha fazla'dan girilir, gün ekranından geri tuşu takvime döner",async({app,page})=>{
  await app.open({seed:seed("")});
  await expect(page.locator('#view [data-tab="history"]').first()).toBeVisible();
  await app.go("more");await expect(page.locator('#view [data-tab="history"]')).toBeVisible();
  await page.locator('#view [data-tab="history"]').click();
  await page.locator('[data-hg^="day:2026-10-05"]').click();
  await page.locator("#back").click();
  await expect(page.locator('[data-hg="seg:tak"]')).toHaveAttribute("aria-pressed","true");
});
