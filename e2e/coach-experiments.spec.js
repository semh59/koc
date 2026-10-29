"use strict";
const {test,expect,state}=require("./fixtures");
const ENTRY_CONSENT={entryConsentSeen:true,entryConsentVersion:1,entryConsentAt:"2026-10-06T07:00:00.000Z",entryConsentChoice:"text_only"};
const {axe,targets}=require("./a11y");

test.describe("Coach experiments",()=>{
  test("experiment UI is hidden while local records remain available",async({app,page})=>{
    await app.open({seed:state(ENTRY_CONSENT)});await app.tab("coach");
    await expect(page.locator('[data-c="experimentnew"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="experiment-card"]')).toHaveCount(0);
    expect(await page.evaluate(()=>typeof Coach.experimentList)).toBe("function");
    expect(await page.evaluate(()=>typeof Coach.experimentExport)).toBe("function");
    expect((await app.state()).coachExperiments).toEqual([]);
  });
});
