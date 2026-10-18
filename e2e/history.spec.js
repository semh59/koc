"use strict";
/* History: calendar, months, search, day screen; with 3 years of data: accessibility (axe), touch targets, overflow and render time. */
const {test,expect,state}=require("./fixtures");
const {axe,small,scaleText,overflow}=require("./a11y");

const iso=(y,m,d)=>`${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
/* 2023-10-07 to 2026-10-06 (today), a few entries per day. */
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
  test(`History screens (${theme||"light"}): axe, touch targets, overflow`,async({app,page})=>{
    await app.open({seed:seed(theme)});
    for(const [name,show] of [["calendar",async()=>{await app.go("history")}],["months",async()=>{await page.locator('[data-hg="seg:months"]').click()}],["search",async()=>{await page.locator('[data-hg="seg:search"]').click();await page.fill("#hgq","mercimek")}],["day",async()=>{await page.locator('[data-hg="seg:cal"]').click();await page.locator('[data-hg^="day:2026-10-05"]').click()}]]){
      await show();await app.settled();
      expect(await axe(page),name+" axe").toEqual([]);
      expect(await small(page),name+" touch target").toEqual([]);
      expect(await overflow(page),name+" overflow").toEqual([]);
    }
  });
}
test("History: no overflow with large text (calendar and day)",async({app,page})=>{
  await app.open({seed:seed("")});
  await app.go("history");await scaleText(page,2);expect(await overflow(page)).toEqual([]);
  await page.locator('[data-hg^="day:2026-10-05"]').click();expect(await overflow(page)).toEqual([]);
});
test("History: the calendar reaches 3 years back and shows the entry there; search finds a food from 2 years ago and opens its day",async({app,page})=>{
  await app.open({seed:seed("")});
  await app.go("history");
  await page.selectOption("#hgy","2023");await page.selectOption("#hgm","11");
  await page.locator('[data-hg="day:2023-11-02"]').click();
  await expect(page.locator("#view")).toContainText("Tavuk pilav");
  await expect(page.locator("#ttl")).toContainText("Gün");
  await app.go("history");
  await page.locator('[data-hg="seg:search"]').click();await page.fill("#hgq","MERCİMEK");
  await expect(page.locator("#hgres")).toContainText("1 kayıt");
  await page.locator('#hgres [data-hg^="day:"]').click();
  await expect(page.locator("#view")).toContainText("Mercimek çorbası");
});
test("History: calendar, months and Trend All render fast with 3 years of data",async({app,page})=>{
  await app.open({seed:seed("")});
  const ms=await page.evaluate(()=>{const t=performance.now();tab="history";render();hg.seg="months";render();hg.seg="cal";render();tab="day";logOff=500;render();return performance.now()-t});
  expect(ms,"calendar+months+day render (ms)").toBeLessThan(1500);
  const tr=await page.evaluate(()=>{const t=performance.now();range=0;tab="trend";render();return performance.now()-t});
  expect(tr,"Trend All render (ms)").toBeLessThan(1500);
});
test("History: reachable from Today (through the day line) and More; Back from the day screen returns to the calendar",async({app,page})=>{
  await app.open({seed:seed("")});
  await page.click('[data-hg="focus:"]');
  await expect(page.locator('#view [data-tab="history"]').first()).toBeVisible();
  await app.go("more");await expect(page.locator('#view [data-tab="history"]')).toBeVisible();
  await page.locator('#view [data-tab="history"]').click();
  await page.locator('[data-hg^="day:2026-10-05"]').click();
  await page.locator("#back").click();
  await expect(page.locator('[data-hg="seg:cal"]')).toHaveAttribute("aria-pressed","true");
});
