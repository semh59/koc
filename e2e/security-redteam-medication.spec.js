"use strict";
const {test,expect,state,medPlugins}=require("./fixtures");

test("malicious backup cannot enable medication names on lock-screen/native payload",async({app,page})=>{
  const marker="NW_MED_PROBE_91ab";
  await page.addInitScript(medPlugins,{});
  await app.open({seed:state({lockOn:true,lockDetail:false,medOn:false,medShowName:false}),dialogs:false,native:{}});
  const payload={S:{settings:{obDone:true,noticeOk:true,medOn:true,medShowName:true,lockOn:false,lockDetail:true},entries:[],meds:[{id:1,n:`${marker} <img src=x onerror=window.__probe='${marker}'>`,t:["11:00"],on:true,d:"10 mg"}],medLog:[]},keys:{},at:"2026-10-06",app:"security-probe"};
  const encrypted=await page.evaluate(async({payload,pw})=>JSON.stringify(await BackupLib.encrypt(payload,pw)),{payload,pw:"Probe-Blue-2026"});
  await app.go("settings-data");await page.click('[data-obr="open"]');
  await page.fill("#obt",encrypted);await page.fill("#obpw","Probe-Blue-2026");await page.click('[data-obr="go"]');
  await expect(page.locator("#cfm")).toBeVisible();
  const confirmation=(await page.locator("#cfm").textContent()).replace(/\s+/g," ");
  expect(confirmation).toContain("Yedekten 1 ilaç yüklenecek");
  await page.click('#cfm [data-cf="1"]');await expect(app.toast).toContainText("Yedek yüklendi");
  await page.evaluate(()=>{window.__calls=[]});
  await page.evaluate(async()=>{await scheduleReminders()});
  const observed=await page.evaluate(({marker})=>{
    const calls=window.__calls||[],ln=calls.find(x=>x[0]==="LN.schedule")?.[1]?.notifications||[],mw=calls.find(x=>x[0]==="MedWake.set")?.[1]||{};
    return {settings:{medOn:S.settings.medOn,medShowName:S.settings.medShowName,lockOn:S.settings.lockOn,lockDetail:S.settings.lockDetail},notification:ln.find(x=>x.extra?.act==="med")||null,dose:mw.doses?.[0]||null,leaked:calls.filter(x=>JSON.stringify(x).includes(marker)).length};
  },{marker});
  console.log("SECURITY_REDTEAM_MEDICATION="+JSON.stringify(observed));
  expect(observed.settings).toEqual({medOn:true,medShowName:false,lockOn:true,lockDetail:false});
  expect(observed.notification).toMatchObject({title:"NeoWell: hatırlatma",body:"Açmak için dokun",channelId:"nw_medp"});
  expect(observed.dose.b).toBe("İlaç saatin geldi.");
  expect(observed.leaked).toBe(0);
});
