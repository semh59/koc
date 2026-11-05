"use strict";
const {test,expect,state}=require("./fixtures");

test("encrypted backup text cannot execute in day, history, or edit views",async({app,page})=>{
  const marker="NW_SECURITY_PROBE_7f3c";
  await page.addInitScript(()=>{
    window.__nativeCalls=[];
    let cap;
    Object.defineProperty(window,"Capacitor",{configurable:true,get:()=>cap,set:v=>{
      cap=v;
      for(const [name,plugin] of Object.entries(v?.Plugins||{}))if(plugin&&typeof plugin==="object")v.Plugins[name]=new Proxy(plugin,{get(target,key){const fn=target[key];if(typeof fn!=="function")return fn;return (...args)=>{window.__nativeCalls.push({name,key,args});return fn.apply(target,args)}}});
    }});
  });
  await app.open({seed:state(),dialogs:false,native:{}});
  const payload={S:{entries:[
    {id:1,day:"2026-10-06",time:"09:00",type:"note",v:null,text:`<img src=x onerror=window.__probe='${marker}'>`},
    {id:2,day:"2026-10-06",time:"10:00",type:"food",v:100,text:`</button><img src=x onerror=window.__probe='${marker}_food'>`}
  ]},keys:{},at:"2026-10-06",app:"security-probe"};
  const encrypted=await page.evaluate(async({payload,pw})=>JSON.stringify(await BackupLib.encrypt(payload,pw)),{payload,pw:"Probe-Blue-2026"});
  await app.go("settings-data");await page.click('[data-obr="open"]');
  await page.fill("#obt",encrypted);await page.fill("#obpw","Probe-Blue-2026");await page.click('[data-obr="go"]');
  await expect(page.locator("#cfm")).toBeVisible();
  const confirmation=await page.locator("#cfm").textContent();
  expect(confirmation.replace(/\s+/g," ")).toContain("Yedekten 2 kayıt yüklenecek");
  await page.click('#cfm [data-cf="1"]');
  await expect(app.toast).toContainText("Yedek yüklendi");

  await app.go("day");
  const dayObserved=await page.evaluate(()=>({
    dangerous:[...document.querySelectorAll("#view [onerror],#view [onclick],#view [onload],#view script")].length,
    marker:window.__probe||null,
    escaped:document.querySelector("#view")?.innerHTML.includes("&lt;img")||false
  }));
  await page.click('[data-tab="history"]');await page.click('[data-hg="seg:search"]');
  await page.fill("#hgq","NW_SECURITY_PROBE");await expect(page.locator("#hgres")).toContainText("kayıt");
  const historyObserved=await page.evaluate(()=>({
    dangerous:[...document.querySelectorAll("#hgres [onerror],#hgres [onclick],#hgres [onload],#hgres script")].length,
    marker:window.__probe||null,
    escaped:document.querySelector("#hgres")?.innerHTML.includes("&lt;img")||false
  }));
  await page.click('[data-hg="day:2026-10-06"]');await page.click('[data-edit="1"]');
  const editObserved=await page.evaluate(()=>({
    dangerous:[...document.querySelectorAll("#sheet [onerror],#sheet [onclick],#sheet [onload],#sheet script")].length,
    marker:window.__probe||null,
    textarea:document.querySelector("#sheet textarea")?.value||""
  }));
  const result={confirmation:confirmation.replace(/\s+/g," ").trim(),dayObserved,historyObserved,editObserved,nativeCalls:await page.evaluate(()=>window.__nativeCalls||[])};
  console.log("SECURITY_REDTEAM_BACKUP="+JSON.stringify(result));
  expect(result.nativeCalls.every(c=>!JSON.stringify(c.args).includes(marker))).toBe(true);
  expect(dayObserved.dangerous).toBe(0);expect(dayObserved.marker).toBeNull();expect(dayObserved.escaped).toBe(true);
  expect(historyObserved.dangerous).toBe(0);expect(historyObserved.marker).toBeNull();expect(historyObserved.escaped).toBe(true);
  expect(editObserved.dangerous).toBe(0);expect(editObserved.marker).toBeNull();expect(editObserved.textarea).toContain("onerror=window.__probe");
});
