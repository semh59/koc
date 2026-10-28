"use strict";
const {test,expect,state}=require("./fixtures");

test.describe("Coach planner",()=>{
  test("Today opens local plan preview and explicit confirmation",async({app,page})=>{
    await app.open({seed:state()});
    await expect(page.locator('[data-testid="planner-card"]')).toContainText("Bugünün planı");
    await page.click('[data-c="planner"]');
    await expect(app.sheet).toContainText("çevrimdışı");
    await page.fill("#planner-title","Akşam yürüyüşü");
    await page.fill("#planner-steps","10 dakika");
    await page.click('[data-c="planpreview"]');
    await expect(app.sheet).toContainText("Planı onayla");
    await expect(app.sheet).toContainText("Onayla ve kaydet");
    await page.click('[data-c="planconfirm"]');
    await expect(app.view).toContainText("Akşam yürüyüşü");
  });

  test("check-in previews, confirms, and stays local",async({app,page})=>{
    await app.open({seed:state()});
    await page.click('[data-c="plannercheck"]');
    await page.selectOption("#planner-energy","1");
    await page.fill("#planner-reason","Az uyudum");
    await page.click('[data-c="checkpreview"]');
    await expect(app.sheet).toContainText("Check-in'i onayla");
    await page.click('[data-c="checkconfirm"]');
    await expect(app.toast).toContainText("Check-in kaydedildi");
  });
});
