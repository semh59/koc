"use strict";
const {test,expect,state}=require("./fixtures");
const ENTRY_CONSENT={entryConsentSeen:true,entryConsentVersion:1,entryConsentAt:"2026-10-06T07:00:00.000Z",entryConsentChoice:"text_only"};

test.describe("Coach low-friction entry",()=>{
  test("consent, browser speech disclosure, keyboard dictation, pending proposal and explicit add",async({app,page})=>{
    const calls=[];page.on("request",r=>{if(!r.url().startsWith("http://127.0.0.1"))calls.push(r.url())});
    await app.open({seed:state(ENTRY_CONSENT)});await app.tab("coach");
    await page.click('[data-c="entryvoice"]');
    await expect(app.sheet).toContainText("Sesle kayıt izni");
    await page.click('[data-c="voiceconsentok"]');
    await expect(app.sheet).toContainText("klavyenin mikrofon tuşunu");
    await expect(app.sheet).toContainText(/tarayıcının|çevrimiçi/i);
    await page.fill("#voice-dictation-input","2 dilim ekmek");
    await page.click('[data-c="voicedictationsave"]');
    await expect(page.locator(".lcard")).toContainText("Öğüne ekle");
    const before=await page.evaluate(()=>Log.all().length);
    await expect(page.getByRole("button",{name:"Öğüne ekle",exact:true})).toBeVisible();
    await page.keyboard.press("Escape");
    expect(await page.evaluate(()=>Log.all().length)).toBe(before);
    await page.getByRole("button",{name:"Öğüne ekle",exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>Log.all().length)).toBeGreaterThan(before);
    expect(calls).toEqual([]);
  });

  test("photo consent disclosure, 44px controls, focus and no console errors at phone widths",async({app,page})=>{
    await app.open({seed:state(ENTRY_CONSENT)});await app.tab("coach");
    await page.click('[data-c="entryphoto"]');
    await expect(app.sheet).toContainText("Fotoğraf ve tarama izni");
    await expect(app.sheet).toContainText("GPS");
    await page.click('[data-c="photoconsentok"]');
    await expect(app.sheet).toContainText("Fotoğraf / Etiket tara");
    const sizes=await page.locator("#sheet button, [data-c^='entry']").evaluateAll(es=>es.map(e=>({n:e.textContent.trim(),h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width})));
    expect(sizes.filter(x=>x.h<44||x.w<44)).toEqual([]);
    await page.getByRole("button",{name:"Kapat",exact:true}).focus();
    await expect(page.getByRole("button",{name:"Kapat",exact:true})).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.locator("#sheet")).not.toHaveClass(/\bon\b/);
  });

  test("consent persists across reload and copy never promises on-device/no-server",async({app,page})=>{
    await app.open({seed:state(ENTRY_CONSENT)});await app.tab("coach");
    await page.click('[data-c="entryvoice"]');
    await expect(app.sheet).not.toContainText(/hiçbir sağlayıcıya veya sunucuya|yalnızca bu cihazda/i);
    await expect(app.sheet).toContainText(/tarayıcının|çevrimiçi/i);
    await page.click('[data-c="voiceconsentok"]');await app.closeSheet();
    await page.click('[data-c="entryphoto"]');await page.click('[data-c="photoconsentok"]');await app.closeSheet();
    expect((await app.state()).settings).toMatchObject({voiceConsent:true,photoConsent:true});
    await page.reload();
    expect(await page.evaluate(()=>[S.settings.voiceConsent,S.settings.photoConsent])).toEqual([true,true]);
  });

  for(const local of [false,true]){
    test(`supported SpeechRecognition engine discloses ${local?"confirmed local":"unconfirmed vendor"} processing`,async({app,page})=>{
      await page.addInitScript(l=>{window.__sr=[];window.SpeechRecognition=function(){this.processLocally=l;this.start=()=>window.__sr.push("start");this.stop=()=>window.__sr.push("stop");this.abort=()=>window.__sr.push("abort")}},local);
      await app.open({seed:state({...ENTRY_CONSENT,voiceConsent:true})});await app.tab("coach");
      await page.click('[data-c="entryvoice"]');
      await expect.poll(()=>page.evaluate(()=>window.__sr)).toContain("start");
      await expect(page.locator("#toast.on #tmsg")).toContainText(local?/cihazda işlediğini doğruladı/:/ses tanıması çevrimiçi.*doğrulanmadı/);
      expect(await page.evaluate(()=>document.querySelector("#view").textContent)).not.toMatch(/hiçbir sağlayıcıya veya sunucuya/);
      await page.evaluate(()=>cStopVoice(true));
      expect(await page.evaluate(()=>window.__sr)).toContain("abort");
    });
  }
});
