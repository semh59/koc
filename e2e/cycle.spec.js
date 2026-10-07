"use strict";
const {test,expect,state,offscreen}=require("./fixtures");

const addPeriod=async(page,s,e)=>{
  await page.click('[data-cy="add"]');
  await page.fill("#cys",s);if(e)await page.fill("#cye",e);
  await page.click('[data-cy="save"]');
};

test.describe("Döngü takibi",()=>{
  test("kapalı gelir, Modüller'den açılır; dönem ekle, tahmin, sil ve Geri al; kapatınca ekran kapanır",async({app,page})=>{
    await app.open({seed:state()});
    await app.go("daha");
    await expect(page.locator(".prow.off",{hasText:"Döngü"})).toBeVisible();
    await app.go("ayar-modul");
    await page.click('[data-cy="toggle"]');
    expect((await app.state()).settings.cycleOn).toBe(true);
    await app.go("dongu");
    await expect(app.view).toContainText("Yeterli veri yok");
    await addPeriod(page,"2026-10-07");
    await expect(page.locator("#cywarn")).toContainText("bugünden ileri olamaz");
    await page.fill("#cys","2026-07-15");await page.fill("#cye","2026-07-10");
    await page.click('[data-cy="save"]');
    await expect(page.locator("#cywarn")).toContainText("Bitiş");
    await page.fill("#cye","2026-07-19");await page.click('[data-cyf="o"]');await page.click('[data-cyb="k"]');
    await page.click('[data-cy="save"]');
    await expect(app.toast).toHaveText("Dönem kaydedildi");
    await addPeriod(page,"2026-08-12");
    await addPeriod(page,"2026-08-12");
    await expect(page.locator("#cywarn")).toContainText("çakışıyor");
    await app.closeSheet();
    await expect(app.view).toContainText("Yeterli veri yok");
    await addPeriod(page,"2026-09-09");
    await expect(app.view).toContainText("Yaklaşık 5 Eki – 9 Eki");
    await expect(app.view).toContainText("tıbbi tavsiye değildir");
    await expect(page.locator(".cyd.cyt").first()).toBeVisible();
    const rows=page.locator('[data-cy^="del:"]');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toHaveAttribute("aria-label",/tarihli kaydı sil/);
    await rows.first().click();
    await expect(app.toast).toHaveText("Kayıt silindi");
    await expect(rows).toHaveCount(2);
    await page.click("#tundo");
    await expect(rows).toHaveCount(3);
    expect((await app.state()).cycle.length).toBe(3);
    // kapat: ekran kapanır, kayıtlar durur
    await app.go("ayar-modul");
    await page.click('[data-cy="toggle"]');
    expect((await app.state()).settings.cycleOn).toBe(false);
    await app.go("dongu");
    await expect(app.view).toContainText("Döngü takibi kapalı");
    await expect(app.view).not.toContainText("Yaklaşık");
    await app.go("daha");
    await expect(page.locator(".prow.off",{hasText:"Döngü"})).toBeVisible();
    expect((await app.state()).cycle.length).toBe(3);
  });

  test("hamilelik işaretinde tahmin yerine nötr bilgi",async({app,page})=>{
    const cycle=[{id:1,s:"2026-07-15"},{id:2,s:"2026-08-12"},{id:3,s:"2026-09-09"}];
    await app.open({seed:state({cycleOn:true,healthNote:"hamileyim"},{cycle})});
    await app.go("dongu");
    await expect(app.view).toContainText("tahmin gösterilmiyor");
    await expect(app.view).not.toContainText("Yaklaşık");
  });

  test("yatay mod: ekran ve ekleme penceresi taşmaz",async({app,page})=>{
    const cycle=[{id:1,s:"2026-07-15"},{id:2,s:"2026-08-12"},{id:3,s:"2026-09-09"}];
    await app.open({seed:state({cycleOn:true},{cycle})});
    const v=page.viewportSize();await page.setViewportSize({width:v.height,height:v.width});
    await app.go("dongu");
    const check=async what=>{
      const o=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,w:innerWidth}));
      expect(o.sw,what).toBeLessThanOrEqual(o.w);
      expect(await offscreen(page),what).toEqual([]);
    };
    await check("yatay Döngü");
    const small=await page.evaluate(()=>[...document.querySelectorAll("#view button")].filter(b=>b.getBoundingClientRect().height<44).map(b=>b.textContent.trim()||b.getAttribute("aria-label")));
    expect(small).toEqual([]);
    await page.click('[data-cy="add"]');
    await check("yatay Dönem ekle");
  });
});
