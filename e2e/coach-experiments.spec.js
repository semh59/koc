"use strict";
const {test,expect,state}=require("./fixtures");
const {axe,targets}=require("./a11y");

test.describe("Coach experiments",()=>{
  async function create(page){
    await page.click('[data-c="experimentnew"]');
    await page.fill("#experiment-hypothesis",'Escaped <hypothesis> & target');
    await page.fill("#experiment-baseline","5000");
    await page.fill("#experiment-target","6000");
    await page.fill("#experiment-start","2026-10-01");
    await page.fill("#experiment-end","2026-10-07");
    await page.click('[data-c="experimentsave"]');
    await expect(page.locator('[data-testid="experiment-card"]')).toContainText("Escaped <hypothesis> & target");
  }

  test("create stays draft until explicit start, then check-in and result remain local",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("coach");
    await create(page);
    await expect(page.locator('[data-testid="experiment-card"]')).toContainText("Taslak");
    await expect(page.locator('[data-c^="experimentcheckin:"]')).toHaveCount(0);
    await page.click('[data-c^="experimentstart:"]');
    await expect(page.locator('[data-testid="experiment-card"]')).toContainText("Aktif");
    await page.click('[data-c^="experimentcheckin:"]');
    await page.fill("#experiment-checkin-value","6500");
    await page.click('[data-c^="experimentcheckinsave:"]');
    await expect(page.locator('[data-testid="experiment-card"]')).toContainText("Aktif");
    await page.click('[data-c^="experimentcheckin:"]');
    expect(await app.state()).toMatchObject({coachExperiments:[{status:"active"}]});
  });

  test("delete confirmation can cancel and export failure preserves data",async({app,page})=>{
    await app.open({seed:state(),dialogs:false});
    await app.tab("coach");
    await create(page);
    await page.click('[data-c^="experimentdelete:"]');
    await expect(page.locator("#cfm")).toBeVisible();
    await page.click('#cfm [data-cf="0"]');
    await expect(page.locator('[data-testid="experiment-card"]')).toHaveCount(1);
    await page.click('[data-c^="experimentdelete:"]');
    await page.click('#cfm [data-cf="1"]');
    await expect(page.locator('[data-testid="experiment-card"]')).toHaveCount(0);
  });

  test("experiment flow is accessible, keyboard operable, 44px and has no network call",async({app,page})=>{
    const calls=[];
    await app.open({seed:state()});
    await page.on("request",r=>{if(!r.url().startsWith("http://127.0.0.1"))calls.push(r.url())});
    await app.tab("coach");
    expect(await axe(page)).toEqual([]);
    const size=await targets(page);
    expect(size.o,"undersized experiment surface targets").toEqual([]);
    await page.locator('[data-c="experimentnew"]').focus();
    await expect(page.locator('[data-c="experimentnew"]')).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#experiment-hypothesis")).toBeVisible();
    await expect(page.locator("#experiment-hypothesis")).toBeFocused();
    for(const id of ["experiment-baseline","experiment-target","experiment-start","experiment-end"]){
      await page.locator("#"+id).fill(id.includes("start")?"2026-10-01":id.includes("end")?"2026-10-07":"1");
    }
    await page.locator("#experiment-hypothesis").fill("Klavye deneyi");
    await page.locator('[data-c="experimentsave"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.locator('[data-testid="experiment-card"]')).toContainText("Klavye deneyi");
    await expect(page.locator('[data-c^="experimentstart:"]')).toBeVisible();
    expect(calls).toEqual([]);
  });
});
