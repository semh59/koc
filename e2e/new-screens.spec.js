"use strict";
/* Watch data card, Pulse sheet (start, measuring, result, error) and the app lock screen: accessibility (axe), touch targets and overflow at 200% text. */
const {test,expect,state}=require("./fixtures");
const {axe,small,scaleText,overflow}=require("./a11y");

const SEED=state({hcOn:true,stepsOn:true,lockOn:false},{pulse:[{day:"2026-10-05",time:"07:30",bpm:64},{day:"2026-10-06",time:"08:10",bpm:71}],hr:[{day:"2026-10-05",a:66,m:50}],entries:[{id:1,day:"2026-10-05",time:"00:00",type:"steps",v:5200,text:""}],nextId:2});
/* Fake Health, AppLock and camera: no camera stream, so the measuring screen stays on "place your finger". */
const shim=cfg=>{
  const P={
    Health:{status:async()=>({available:cfg.available!==false,granted:cfg.granted,sleep:cfg.granted,hr:cfg.granted}),request:async()=>({}),manage:async()=>{},
      steps:async o=>({days:{[o.days[0]]:4321}}),daily:async()=>({sleep:{},hrAvg:{},hrMin:{}})},
    AppLock:{status:async()=>({secure:true}),authenticate:async()=>new Promise(()=>{}),setSecure:async()=>{}},
    StepCounter:{isAvailable:async()=>({available:true}),requestAccess:async()=>({granted:true}),start:async()=>({}),read:async()=>({steps:3000,snapAt:Date.now(),history:{}})},
    App:{addListener:()=>({remove(){}}),exitApp(){}}
  };
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:P};
  navigator.mediaDevices.getUserMedia=async()=>{throw new Error("no camera")};
};
const show={
  pulseStart:async(app,page)=>{await page.evaluate(()=>plSheet());await expect(page.locator("#sheet.on")).toBeVisible()},
  pulseMeasure:async(app,page)=>{await page.evaluate(()=>plScreen("Parmağını kameraya ve flaşa koy",0));await expect(page.locator("#plmsg")).toBeVisible();await expect(page.locator("#plmsg")).toHaveAttribute("role","timer");await expect(page.locator("#plhint")).toHaveAttribute("role","status")},
  pulseResult:async(app,page)=>{await page.evaluate(()=>plResult({ok:true,bpm:72}));await expect(page.locator("#plbpm")).toBeVisible()},
  pulseError:async(app,page)=>{await page.evaluate(()=>plResult({ok:false,reason:"noisy"}));await expect(page.locator("#sheet [role=alert]")).toBeVisible()}
};
for(const [name,cfg] of [["granted",{granted:true}],["not granted",{granted:false}],["no Health Connect",{available:false,granted:false}],["granted, dark",{granted:true,theme:"dark"}]]){
  test(`watch data card (${name}): axe, touch targets, overflow`,async({app,page})=>{
    await page.addInitScript(shim,cfg);
    await app.open({seed:{...SEED,settings:{...SEED.settings,theme:cfg.theme||""}}});
    await app.go("steps");
    await expect(page.locator("#view")).toContainText("Saatten veri");
    expect(await axe(page)).toEqual([]);
    expect(await small(page)).toEqual([]);
    await scaleText(page,2);expect(await overflow(page)).toEqual([]);
  });
}
for(const [k,theme] of [["pulseStart",""],["pulseMeasure",""],["pulseResult",""],["pulseError",""],["pulseStart","dark"],["pulseResult","dark"],["pulseError","dark"]]){
  test(`Pulse sheet (${k}${theme?", dark":""}): axe, touch targets, overflow, focus inside`,async({app,page})=>{
    await app.open({seed:{...SEED,settings:{...SEED.settings,theme}}});
    await page.evaluate(()=>{Object.defineProperty(navigator,"mediaDevices",{value:{getUserMedia:async()=>{throw new Error("x")}},configurable:true})});
    await show[k](app,page);
    await expect(page.locator("#sheet")).toHaveAttribute("aria-labelledby","sht");
    expect(await axe(page)).toEqual([]);
    expect(await small(page)).toEqual([]);
    await scaleText(page,2);expect(await overflow(page)).toEqual([]);
    await page.keyboard.press("Escape");
  });
}
test("closing the Pulse sheet releases the camera (measuring stops)",async({app,page})=>{
  await app.open({seed:SEED});
  await page.evaluate(()=>{window.__stopped=0;pl={stream:{getTracks:()=>[{stop:()=>{window.__stopped++}}]},video:{cancelVideoFrameCallback:()=>{},srcObject:1},raf:1,torch:false}});
  await page.evaluate(()=>closeSheet());
  expect(await page.evaluate(()=>[window.__stopped,pl])).toEqual([1,null]);
});
test("app lock screen: axe, touch targets, overflow, role and focus",async({app,page})=>{
  await page.addInitScript(shim,{granted:true});
  await app.open({seed:{...SEED,settings:{...SEED.settings,lockOn:true}}});
  await page.evaluate(()=>lockShow());
  await expect(page.locator("#lock")).toBeVisible();
  await expect(page.locator("#lock")).toHaveAttribute("role","alertdialog");
  expect(await axe(page)).toEqual([]);
  expect(await small(page)).toEqual([]);
  await scaleText(page,2);expect(await overflow(page)).toEqual([]);
});
test("app lock screen in dark theme: axe",async({app,page})=>{
  await page.addInitScript(shim,{granted:true});
  await app.open({seed:{...SEED,settings:{...SEED.settings,lockOn:true,theme:"dark"}}});
  await page.evaluate(()=>lockShow());
  await expect(page.locator("#lock")).toBeVisible();
  expect(await axe(page)).toEqual([]);
});
