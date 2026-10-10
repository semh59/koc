"use strict";
const {test,expect,state,offscreen}=require("./fixtures");

const addPeriod=async(page,s,e)=>{
  await page.click('[data-cy="add"]');
  await page.fill("#cys",s);if(e)await page.fill("#cye",e);
  await page.click('[data-cy="save"]');
};

test.describe("Cycle tracking",()=>{
  test("off by default, enabled from Modules; add period, forecast, delete and Undo; turning off closes the screen",async({app,page})=>{
    await app.open({seed:state()});
    await app.go("more");
    await expect(page.locator('#view [data-tab="cycle"]')).toHaveCount(0);
    await page.click('#view [data-tab="settings-modules"]');
    await page.click('[data-cy="toggle"]');
    expect((await app.state()).settings.cycleOn).toBe(true);
    await app.go("cycle");
    await expect(app.view).toContainText("Yeterli veri yok");
    await addPeriod(page,"2026-10-07");
    await expect(page.locator("#cywarn")).toContainText("bugünden ileri olamaz");
    await page.fill("#cys","2026-07-15");await page.fill("#cye","2026-07-10");
    await page.click('[data-cy="save"]');
    await expect(page.locator("#cywarn")).toContainText("Bitiş");
    await page.fill("#cye","2026-07-19");await page.click('[data-cyf="medium"]');await page.click('[data-cyb="cramp"]');
    await page.click('[data-cy="save"]');
    await expect(app.toast).toHaveText("Dönem kaydedildi");
    await addPeriod(page,"2026-08-12");
    await addPeriod(page,"2026-08-12");
    await expect(page.locator("#cywarn")).toContainText("çakışıyor");
    await app.closeSheet();
    await expect(app.view).toContainText("Yeterli veri yok");
    await addPeriod(page,"2026-09-09");
    await expect(app.view).toContainText("5–9 Eki");
    await expect(app.view).toContainText("tıbbi tavsiye değildir");
    await expect(page.locator(".cyd.cyt").first()).toBeVisible();
    await expect(app.view).toContainText("16–22 Eki");
    await expect(app.view).toContainText("Tahmini yumurtlama: 21 Eki");
    await expect(page.locator(".cyd.cyo .vh")).toContainText("tahmini yumurtlama günü");
    await expect(page.locator(".cyd.cyf")).toHaveCount(6);
    await expect(app.view).toContainText("Tahmindir. Doğum kontrolü veya gebelik planlaması için güvenilir değildir; hekimine danış.");
    const rows=page.locator('[data-cy^="del:"]');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toHaveAttribute("aria-label",/tarihli kaydı sil/);
    await rows.first().click();
    await expect(app.toast).toHaveText("Kayıt silindi");
    await expect(rows).toHaveCount(2);
    await page.click("#tundo");
    await expect(rows).toHaveCount(3);
    expect((await app.state()).cycle.length).toBe(3);
    // turn off: the screen closes, the records stay
    await app.go("settings-modules");
    await page.click('[data-cy="toggle"]');
    expect((await app.state()).settings.cycleOn).toBe(false);
    await app.go("cycle");
    await expect(app.view).toContainText("Döngü takibi kapalı");
    await expect(page.locator(".cypr")).toHaveCount(0);
    await app.go("more");
    await expect(page.locator('#view [data-tab="cycle"]')).toHaveCount(0);
    expect((await app.state()).cycle.length).toBe(3);
  });

  test("a pregnancy note shows neutral info instead of a forecast",async({app,page})=>{
    const cycle=[{id:1,s:"2026-07-15"},{id:2,s:"2026-08-12"},{id:3,s:"2026-09-09"}];
    await app.open({seed:state({cycleOn:true,healthNote:"hamileyim"},{cycle})});
    await app.go("cycle");
    await expect(app.view).toContainText("tahmin gösterilmiyor");
    await expect(page.locator(".cypr")).toHaveCount(0);
    await expect(app.view).not.toContainText("yumurtlama");
    await expect(page.locator(".cyfw")).toHaveCount(0);
    await expect(page.locator(".cyd.cyo,.cyd.cyf")).toHaveCount(0);
  });

  test("an irregular cycle shows a warning and no fertile window",async({app,page})=>{
    const cycle=[{id:1,s:"2026-05-01"},{id:2,s:"2026-05-22"},{id:3,s:"2026-07-01"},{id:4,s:"2026-07-25"},{id:5,s:"2026-09-09"}];
    await app.open({seed:state({cycleOn:true},{cycle})});
    await app.go("cycle");
    await expect(app.view).toContainText("Düzensiz döngüde tahmin güvenilmez");
    await expect(page.locator(".cyfw")).toHaveCount(0);
    await expect(page.locator(".cyd.cyo,.cyd.cyf")).toHaveCount(0);
  });

  test("landscape: the screen and the add sheet do not overflow",async({app,page})=>{
    const cycle=[{id:1,s:"2026-07-15"},{id:2,s:"2026-08-12"},{id:3,s:"2026-09-09"}];
    await app.open({seed:state({cycleOn:true},{cycle})});
    const v=page.viewportSize();await page.setViewportSize({width:v.height,height:v.width});
    await app.go("cycle");
    const check=async what=>{
      const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth}));
      expect(o.sw,what).toBeLessThanOrEqual(o.w);
      expect(await offscreen(page),what).toEqual([]);
    };
    await check("landscape Cycle");
    const small=await page.evaluate(()=>[...document.querySelectorAll("#view button")].filter(b=>b.getBoundingClientRect().height<44).map(b=>b.textContent.trim()||b.getAttribute("aria-label")));
    expect(small).toEqual([]);
    await page.click('[data-cy="add"]');
    await check("landscape Add period");
  });
});
