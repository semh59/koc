"use strict";
const {test,expect,state}=require("./fixtures");

test.describe("No-Coach release",()=>{
  test("boots without Coach UI, provider globals or console errors",async({app,page})=>{
    await app.open({seed:state()});
    await expect(page.locator("html[data-boot]")).toBeAttached();
    await expect(page.locator('nav button[data-tab="coach"]')).toHaveCount(0);
    await expect(page.locator("#composer,#cmsg,#cvoice,#csend")).toHaveCount(0);
    expect(await page.evaluate(()=>[typeof callProvider,typeof fetchModels,typeof viewCoach])).toEqual(["undefined","undefined","undefined"]);
    await expect(page.locator("#view")).not.toBeEmpty();
  });

  test("exercise details show NeoWell figures without unverified photos",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("gym");
    for(const id of ["squat","onefoot","fastwalk"]){
      await page.evaluate(id=>exSheet(id),id);
      await expect(page.locator("#sheet .exfig svg")).toHaveCount(1);
      await expect(page.locator("#sheet img,#sheet .exph")).toHaveCount(0);
      await expect(page.locator("#sheet")).not.toContainText("kamu malı");
    }
    expect(await page.evaluate(()=>performance.getEntriesByType("resource").some(x=>/\/ex\/[^/]+\/\d+\.webp/.test(x.name)))).toBe(false);
  });

  test("single-leg hold keeps support planted in real exercise detail",async({app,page})=>{
    await page.emulateMedia({reducedMotion:"no-preference"});
    await app.open({seed:state()});await app.tab("gym");
    await page.evaluate(()=>exSheet("onefoot"));
    const svg=page.locator("#sheet .exfig svg");await expect(svg).toBeVisible();
    const observation=await svg.evaluate(el=>{
      el.pauseAnimations();
      const legs=el.querySelectorAll("path.fg-near"),support=legs[0],toe=legs[1],free=el.querySelectorAll("path.fg-far")[1];
      const anchor=support.getPointAtLength(support.getTotalLength()),samples=[];
      for(let i=0;i<=12;i++){
        el.setCurrentTime(i*2.6/12);
        const a=support.getPointAtLength(support.getTotalLength()),t=toe.getPointAtLength(toe.getTotalLength()),f=free.getPointAtLength(free.getTotalLength());
        samples.push({drift:Math.hypot(a.x-anchor.x,a.y-anchor.y),y:a.y,toeY:t.y,freeY:f.y});
      }
      el.setCurrentTime(0);return samples;
    });
    expect(observation.every(x=>x.drift<.01&&Math.abs(x.y-136)<.01&&Math.abs(x.toeY-136)<.01&&x.freeY<128)).toBe(true);
    await page.emulateMedia({reducedMotion:"reduce"});await page.evaluate(()=>exSheet("onefoot"));
    await expect(svg).toHaveAttribute("data-fig-motion","static");await expect(svg.locator("animate")).toHaveCount(0);
    await page.screenshot({path:test.info().outputPath("onefoot.png")});
  });

  test("figure pilot gallery renders 9 families cleanly with opt-in volume and ghost",async({page})=>{
    await page.goto("/figure-pilot.html");
    await expect(page.locator("h1")).toContainText("NeoWell Çöp Adam 2.5D Görsel Pilot Matrisi");
    const cards=page.locator("section.card");
    await expect(cards).toHaveCount(9);
    const volSvgs=page.locator('svg[data-fig-variant="volume"]');
    await expect(volSvgs).toHaveCount(9);
    for(let i=0;i<9;i++){
      const s=volSvgs.nth(i);
      await expect(s.locator('[data-ground-shadow="fixed"]')).toBeVisible();
      await expect(s.locator('[data-ghost="start"]')).toBeAttached();
      await expect(s.locator('[data-ghost="end"]')).toBeAttached();
    }
  });

  test("all shipped navigation tabs open real screens",async({app,page})=>{
    await app.open({seed:state()});
    for(const tab of ["today","gym","trend","more"]){
      await app.tab(tab);
      await expect(page.locator("#view")).not.toBeEmpty();
    }
    for(const tab of ["settings-profile","settings-modules","settings-data"]){
      await app.go(tab);
      await expect(page.locator("#view")).not.toBeEmpty();
    }
  });

  test("food search stays local and selecting food keeps explicit save flow",async({app,page})=>{
    await app.open({seed:state({kcal:2200})});
    await page.click('.act[data-act="food"]');
    await page.fill("#fq","mercimek corbasi");
    await expect(page.locator("#flist [data-food]").first()).toContainText("Mercimek çorbası");
    await page.locator("#flist [data-food]").first().click();
    await expect(page.locator("#sheet h3")).toHaveText("Mercimek çorbası");
    expect(await page.evaluate(()=>performance.getEntriesByType("resource").some(x=>/^https?:\/\/(?!127\.0\.0\.1)/.test(x.name)))).toBe(false);
  });

  test("Food voice writes only local search text, never auto-saves",async({app,page})=>{
    await page.addInitScript(()=>{window.Capacitor={Plugins:{Speech:{addListener:async()=>({remove(){}}),removeAllListeners:async()=>{},listen:async()=>({started:true}),stopListening:async()=>{}}}}});
    await app.open({seed:state()});await page.click('.act[data-act="food"]');
    await page.click('[data-fvoice="start"]');
    if(await page.locator('[data-fvoice="consent"]').count())await page.click('[data-fvoice="consent"]');
    await page.evaluate(()=>foodVoiceHandleTranscript("mercimek corbasi"));
    await expect(page.locator("#fq")).toHaveValue("mercimek corbasi");
    expect((await app.state()).entries.filter(e=>e.type==="food")).toHaveLength(0);
  });

  test("OCR and local menu assets are loaded in shipped page",async({app,page})=>{
    await app.open({seed:state()});
    expect(await page.evaluate(()=>[typeof MenuLocal,typeof ocrBtn,typeof LABEL_FIELDS])).toEqual(["object","function","object"]);
    await app.tab("today");await page.click('.act[data-act="food"]');
    await expect(page.locator("#sheet")).toContainText("Yemek ekle");
  });

  test("data and privacy screens contain no provider or Coach controls",async({app,page})=>{
    await app.open({seed:state()});await app.go("settings-data");
    await expect(page.locator("#view")).toContainText("Yedek al");
    await expect(page.locator("#view")).not.toContainText(/Coach|Rehber anahtar|sağlayıcı|model seç/);
    await page.evaluate(()=>sheetPrivacy());
    await expect(page.locator("#sheet")).not.toContainText(/Coach|sağlayıcı|model seç/);
  });

  test("reset deletes local records and returns to empty Today",async({app,page})=>{
    await app.open({seed:state({},{entries:[{id:1,day:"2026-10-06",time:"09:00",type:"water",v:250,text:""}]}),dialogs:false});
    await app.go("settings-data");await page.click('[data-act="reset"]');await page.click('#cfm [data-cf="1"]');
    await expect(app.toast).toContainText("Tüm veriler silindi");
    expect((await app.state()).entries).toEqual([]);
  });
});
