"use strict";
/* Full-screen medication alarm: opening via alarmOpen(), Taken, privacy, large text and narrow screen (fake MedWake and LocalNotifications). */
const {test,expect,state,offscreen,medPlugins:plugins}=require("./fixtures");
const path=require("path");
const {scaleText}=require("./a11y");
const MEDS={meds:[{id:1,n:"Metformin uzun salımlı",d:"1000 mg, yemekle",t:["09:55"],on:true},{id:2,n:"D vitamini",d:"1 damla",t:["09:30"],on:true},{id:3,n:"Akşam",t:["21:00"],on:true}]};
test("alarm screen opened by alarmOpen: due doses, Taken records and reschedules the repeats",async({app,page})=>{
  await page.addInitScript(plugins);
  await app.open({seed:state({medOn:true,medShowName:true},MEDS),native:{}});
  await page.evaluate("alarmOpen()");
  const al=page.getByRole("alertdialog",{name:"İlaç zamanı"});
  await expect(al).toBeVisible();
  await expect(al).toContainText("10:00");
  await expect(al).toContainText("Metformin uzun salımlı");
  await expect(al).toContainText("D vitamini");
  await expect(al).not.toContainText("Akşam");
  await al.getByRole("button",{name:"Metformin uzun salımlı 09:55: aldım"}).click();
  await expect(al).toContainText("Alındı");
  const s=await app.state();
  expect(s.medLog.map(x=>[x.m,x.slot,x.st])).toEqual([[1,"09:55","t"]]);
  await expect.poll(()=>page.evaluate(()=>window.__calls.some(c=>c[0]==="LN.cancel"||c[0]==="LN.schedule"))).toBe(true);
  await al.getByRole("button",{name:"D vitamini 09:30: atla"}).click();
  await expect(al).toBeHidden({timeout:3000});
});

test("with names hidden the alarm screen shows no medication name or dose",async({app,page})=>{
  await page.addInitScript(plugins);
  const same={meds:MEDS.meds.map(m=>m.id===2?{...m,t:["09:55"]}:m)}; // "Hepsini aldım" covers one minute only
  await app.open({seed:state({medOn:true,medShowName:false},same),native:{}});
  await page.evaluate("alarmOpen()");
  const al=page.getByRole("alertdialog");
  await expect(al).toContainText("İlaç saatin geldi.");
  await expect(al).toContainText("2 doz");
  expect(await al.innerHTML()).not.toMatch(/Metformin|vitamini|1000 mg/);
  await al.getByRole("button",{name:"Hepsini aldım"}).click();
  await expect(al).toBeHidden({timeout:3000});
  expect((await app.state()).medLog.length).toBe(2);
});

for(const k of [1,2])test(`alarm screen at ${k*100}% text: no overflow, touch targets >= 56 px`,async({app,page},ti)=>{
  await page.addInitScript(plugins);
  await app.open({seed:state({medOn:true,medShowName:true},MEDS),native:{}});
  await page.evaluate("alarmOpen()");
  await expect(page.locator("#alarm")).toBeVisible();
  if(k>1){await scaleText(page,k);await app.settled()}
  expect(await offscreen(page,"#alarm")).toEqual([]);
  const m=await page.evaluate(()=>{const a=document.querySelector("#alarm");return {sw:a.scrollWidth,cw:a.clientWidth,low:[...a.querySelectorAll("button")].filter(b=>b.getBoundingClientRect().height<56).map(b=>b.textContent.trim())}});
  expect(m.sw).toBeLessThanOrEqual(m.cw);
  expect(m.low).toEqual([]);
  if(process.env.ALARM_SHOTS){
    await page.screenshot({path:path.join(process.env.ALARM_SHOTS,`alarm-${ti.project.name}-${k*100}.png`)});
    await page.evaluate(()=>{const a=document.querySelector("#alarm");a.scrollTop=a.scrollHeight});
    await page.screenshot({path:path.join(process.env.ALARM_SHOTS,`alarm-${ti.project.name}-${k*100}-alt.png`)});
  }
});

test("alarm screen in landscape and dark theme: no overflow, buttons reachable, Open app returns to Today",async({app,page},ti)=>{
  await page.addInitScript(plugins);
  await page.emulateMedia({colorScheme:"dark"});
  await page.setViewportSize({width:ti.project.use.viewport.height,height:ti.project.use.viewport.width});
  await app.open({seed:state({medOn:true,medShowName:true},MEDS),native:{}});
  await page.evaluate("alarmOpen()");
  await expect(page.locator("#alarm")).toBeVisible();
  expect(await offscreen(page,"#alarm")).toEqual([]);
  expect(await page.evaluate(()=>{const a=document.querySelector("#alarm");return a.scrollWidth<=a.clientWidth})).toBe(true);
  if(process.env.ALARM_SHOTS)await page.screenshot({path:path.join(process.env.ALARM_SHOTS,`alarm-${ti.project.name}-yatay-koyu.png`)});
  await page.getByRole("button",{name:"Uygulamayı aç"}).click();
  await expect(page.locator("#alarm")).toBeHidden();
  await expect(page.locator('nav button[data-tab="today"]')).toHaveAttribute("aria-current",/page|true/);
});

test("alarm screen double-dose guard: the question sits inside the alarm, No keeps the dose open, Yes records it",async({app,page})=>{
  await page.addInitScript(plugins);
  const {day}=require("./fixtures");
  const seed=state({medOn:true,medShowName:true},{meds:[{id:1,n:"Metformin",t:["08:50","09:55"],on:true}],medLog:[{id:1,m:1,day:day(0),slot:"08:50",st:"t",at:"09:45"}]});
  await app.open({seed,native:{}});
  await page.evaluate("alarmOpen()");
  const al=page.getByRole("alertdialog",{name:"İlaç zamanı"});
  await al.getByRole("button",{name:"Metformin 09:55: aldım"}).click();
  await expect(al.getByRole("group",{name:"Çift doz sorusu"})).toContainText("15 dakika önce");
  expect((await app.state()).medLog.length).toBe(1);
  await al.getByRole("button",{name:"Hayır, kaydetme"}).click();
  await expect(al).toContainText("Kaydedilmedi");
  expect((await app.state()).medLog.length).toBe(1);
  await al.getByRole("button",{name:"Metformin 09:55: aldım"}).click();
  await al.getByRole("button",{name:"Evet, kaydet"}).click();
  await expect.poll(async()=>(await app.state()).medLog.length).toBe(2);
});
