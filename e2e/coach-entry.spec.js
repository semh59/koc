"use strict";
const {test,expect,state}=require("./fixtures");
const ENTRY_CONSENT={entryConsentSeen:true,entryConsentVersion:1,entryConsentAt:"2026-10-06T07:00:00.000Z",entryConsentChoice:"text_only"};

test.describe("Coach low-friction entry",()=>{
  test("Coach sends local food entry to the food sheet, not voice capture",async({app,page})=>{
    await app.open({seed:state(ENTRY_CONSENT)});await app.tab("coach");
    await expect(page.locator('[data-c="entryvoice"]')).toHaveCount(0);
    await expect(page.locator('[data-c="entrylocal"]')).toHaveCount(1);
    await page.click('[data-c="entrylocal"]');
    await expect(app.sheet).toContainText("Hızlı yemek / porsiyon");
    await page.keyboard.press("Escape");
  });

  test("local entry controls have 44px targets and no console errors at phone widths",async({app,page})=>{
    await app.open({seed:state(ENTRY_CONSENT)});await app.tab("coach");
    const sizes=await page.locator("[data-c^='entry']").evaluateAll(es=>es.map(e=>({n:e.textContent.trim(),h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width})));
    expect(sizes.filter(x=>x.h<44||x.w<44)).toEqual([]);
    await page.locator('[data-c="entrylocal"]').click();
    await expect(page.locator("#sheet")).toContainText("Hızlı yemek / porsiyon");
    await page.keyboard.press("Escape");
  });

  test("Coach microphone dictates into composer without sending and keeps typed fallback on error",async({app,page})=>{
    await app.open({seed:state(ENTRY_CONSENT)});await app.tab("coach");
    await page.evaluate(()=>{
      const listeners={};
      window.Capacitor={Plugins:{Speech:{
        addListener:async(type,fn)=>{(listeners[type]??=[]).push(fn);return {remove(){}}},
        removeAllListeners:async type=>{delete listeners[type]},
        listen:async()=>({started:true}),
        stopListening:async()=>{}
      }}};
      window.__voiceEvent=(type,data)=>(listeners[type]||[]).forEach(fn=>fn(data));
    });
    await page.click('[data-c="coachvoice"]');
    await expect(page.locator('[data-c="coachvoiceconsent"]')).toBeVisible();
    await page.click('[data-c="coachvoiceconsent"]');
    await expect(page.locator('#cvoice-status')).toContainText("Dinliyorum");
    await page.evaluate(()=>window.__voiceEvent("result",{text:"Bugün ne kadar su içmeliyim"}));
    await expect(page.locator("#cmsg")).toHaveValue("Bugün ne kadar su içmeliyim");
    await expect(page.locator("#cvoice-status")).toContainText("Göndermeye hazır");
    expect(await page.evaluate(()=>S.chat.filter(m=>m.role==="user").length)).toBe(0);
    await page.click('[data-c="coachvoice"]');
    await expect(page.locator('#cvoice-status')).toContainText("Dinliyorum");
    await page.evaluate(()=>window.__voiceEvent("error",{error:"permission"}));
    await expect(page.locator("#cmsg")).toHaveValue("Bugün ne kadar su içmeliyim");
    await expect(page.locator("#cvoice-status")).toContainText("Yazarak devam");
    await expect(page.locator("#composer")).toBeVisible();
  });
});
