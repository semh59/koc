"use strict";
/* Tam ekran ilaç alarm ekranı: alarmOpen() ile açılış, Aldım, gizlilik, büyük yazı ve dar ekran (sahte MedWake ve LocalNotifications). */
const {test,expect,state,offscreen}=require("./fixtures");
const path=require("path");

function plugins(){
  window.__calls=[];
  const rec=(p,defs)=>new Proxy({},{get:(_,k)=>k==="then"?undefined:k==="addListener"?()=>({remove(){}}):async a=>{window.__calls.push([p+"."+k,a]);const v=defs[k];return typeof v==="function"?v():v||{}}});
  let C;
  Object.defineProperty(window,"Capacitor",{configurable:true,get:()=>C,set:v=>{C=v;
    v.Plugins.MedWake=rec("MedWake",{fsi:{allowed:true}});
    v.Plugins.LocalNotifications=rec("LN",{checkPermissions:{display:"granted"},getPending:{notifications:[]},getDeliveredNotifications:{notifications:[]},checkExactNotificationSetting:{exact_alarm:"granted"}});
  }});
}
const MEDS={meds:[{id:1,n:"Metformin uzun salımlı",d:"1000 mg, yemekle",t:["09:55"],on:true},{id:2,n:"D vitamini",d:"1 damla",t:["09:30"],on:true},{id:3,n:"Akşam",t:["21:00"],on:true}]};
const scaleText=(page,k)=>page.evaluate(k=>{
  const m=v=>v.replace(/([\d.]+)px/,(a,b)=>b*k+"px");
  const walk=rs=>{for(const r of rs){if(r.cssRules&&!r.style)walk(r.cssRules);else if(r.style&&/^[\d.]+px$/.test(r.style.fontSize))r.style.fontSize=m(r.style.fontSize)}};
  for(const s of document.styleSheets)walk(s.cssRules);
  const de=document.documentElement,cs=getComputedStyle(de),names=new Set();
  for(const s of document.styleSheets)for(const r of s.cssRules)if(r.style)for(const p of r.style)if(p.startsWith("--fs-"))names.add(p);
  for(const p of names)de.style.setProperty(p,m(cs.getPropertyValue(p).trim()));
},k);

test("alarmOpen ile açılan alarm ekranı: vadesi gelen dozlar, Aldım kaydeder ve tekrarları yeniden kurar",async({app,page})=>{
  await page.addInitScript(plugins);
  await app.open({seed:state({medOn:true},MEDS),native:{}});
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

test("ad gizliyse alarm ekranında ilaç adı ve doz yok",async({app,page})=>{
  await page.addInitScript(plugins);
  await app.open({seed:state({medOn:true,medShowName:false},MEDS),native:{}});
  await page.evaluate("alarmOpen()");
  const al=page.getByRole("alertdialog");
  await expect(al).toContainText("İlaç saatin geldi.");
  await expect(al).toContainText("2 doz");
  expect(await al.innerHTML()).not.toMatch(/Metformin|vitamini|1000 mg/);
  await al.getByRole("button",{name:"Hepsini aldım"}).click();
  await expect(al).toBeHidden({timeout:3000});
  expect((await app.state()).medLog.length).toBe(2);
});

for(const k of [1,2])test(`alarm ekranı yazı %${k*100}: taşma yok, dokunma hedefleri ≥ 56 px`,async({app,page},ti)=>{
  await page.addInitScript(plugins);
  await app.open({seed:state({medOn:true},MEDS),native:{}});
  await page.evaluate("alarmOpen()");
  await expect(page.locator("#alarm")).toBeVisible();
  if(k>1){await scaleText(page,k);await page.waitForTimeout(100)}
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

test("alarm ekranı yatay ve koyu temada: taşma yok, düğmeler erişilebilir, Uygulamayı aç Bugün'e döner",async({app,page},ti)=>{
  await page.addInitScript(plugins);
  await page.emulateMedia({colorScheme:"dark"});
  await page.setViewportSize({width:ti.project.use.viewport.height,height:ti.project.use.viewport.width});
  await app.open({seed:state({medOn:true},MEDS),native:{}});
  await page.evaluate("alarmOpen()");
  await expect(page.locator("#alarm")).toBeVisible();
  expect(await offscreen(page,"#alarm")).toEqual([]);
  expect(await page.evaluate(()=>{const a=document.querySelector("#alarm");return a.scrollWidth<=a.clientWidth})).toBe(true);
  if(process.env.ALARM_SHOTS)await page.screenshot({path:path.join(process.env.ALARM_SHOTS,`alarm-${ti.project.name}-yatay-koyu.png`)});
  await page.getByRole("button",{name:"Uygulamayı aç"}).click();
  await expect(page.locator("#alarm")).toBeHidden();
  await expect(page.locator('nav button[data-tab="bugun"]')).toHaveAttribute("aria-current",/page|true/);
});
