"use strict";
const {test,expect}=require("./fixtures");

const step=page=>page.locator(".obp .mut");
async function fill(page,{cm="178",kg="84",age="35"}={}){
  await page.fill("#obcm",cm);await page.fill("#obkg",kg);await page.fill("#obage",age);
}

test.describe("Onboarding",()=>{
  test("age-18 gate: setup stops at 17 and nothing is saved, 18 passes",async({app,page})=>{
    await app.open();
    // Welcome: the only primary action is Başla, no step counter.
    await expect(page.locator("#view h2")).toHaveText("NeoWell'e hoş geldin");
    await expect(page.locator("#view .btn")).toHaveText(["Başla"]);
    await expect(page.locator(".obp")).toHaveCount(0);
    await page.click('[data-ob="next"]');
    await expect(step(page)).toHaveText("Adım 1/3");
    await fill(page,{age:"17"});
    await page.click('[data-ob="next"]');
    // Acceptance: a polite screen; no skip, back or continue; no profile is written.
    await expect(page.locator("#view h2")).toHaveText("NeoWell 18 yaş ve üzeri için");
    await expect(page.locator('[data-ob="skip"],[data-ob="next"],[data-ob="back"]')).toHaveCount(0);
    const s=(await app.state())||{settings:{}};
    expect(s.settings.age||0).toBe(0);expect(s.entries||[]).toEqual([]);
    await page.click('[data-ob="fixage"]');
    await expect(step(page)).toHaveText("Adım 1/3");
    await fill(page,{age:"18"});
    await page.click('[data-ob="next"]');
    await expect(step(page)).toHaveText("Adım 2/3");
  });

  test("profile and goal are saved, the progress bar follows the step",async({app,page})=>{
    await app.open();await page.click('[data-ob="next"]');
    const on=page.locator(".obbar i.on");
    await expect(on).toHaveCount(1);
    await fill(page);
    await page.click('[data-ob="dir:lose"]');
    await page.fill("#obgoal","90"); // higher than the current weight: rejected
    await page.click('[data-ob="next"]');
    await expect(page.locator("#oberr")).toContainText("düşük olmalı");
    await page.fill("#obgoal","76");
    await page.click('[data-ob="next"]');
    await expect(on).toHaveCount(2);
    await page.click('[data-ob="mod:bp"]');
    await expect(page.locator('[data-ob="mod:bp"]')).toHaveAttribute("aria-pressed","true");
    await page.click('[data-ob="back"]');
    await expect(step(page)).toHaveText("Adım 1/3");
    await expect(page.locator("#obgoal")).toHaveValue("76");
    await page.click('[data-ob="next"]');await page.click('[data-ob="next"]');
    await expect(on).toHaveCount(3);
    await expect(page.locator(".sumv")).toContainText("kcal");
    await page.click('[data-ob="next"]');
    // Acceptance: Today opens, the bottom menu shows, the profile and first weigh-in are saved.
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator(".stepcard .wv")).toContainText("84,0");
    const s=await app.state();
    expect(s.settings).toMatchObject({heightCm:178,age:35,goalKg:76,bpOn:true,obDone:true});
    expect(s.settings.kcal).toBeGreaterThanOrEqual(1200);
    expect(s.entries.filter(e=>e.type==="weight").map(e=>e.v)).toEqual([84]);
  });

  test("activity-level triage: after two answers the level is saved and the calorie target follows it",async({app,page})=>{
    await app.open();await page.click('[data-ob="next"]');
    await fill(page);
    await page.click('[data-ob="job:0"]');await page.click('[data-ob="walk:0"]');
    await page.click('[data-ob="next"]');await page.click('[data-ob="next"]');
    const low=+(await page.locator(".sumv").innerText()).replace(/\D/g,"");
    await page.click('[data-ob="back"]');await page.click('[data-ob="back"]');
    await page.click('[data-ob="job:2"]');await page.click('[data-ob="walk:2"]');
    await page.click('[data-ob="next"]');await page.click('[data-ob="next"]');
    const high=+(await page.locator(".sumv").innerText()).replace(/\D/g,"");
    expect(high).toBeGreaterThan(low);
    await page.click('[data-ob="next"]');
    expect((await app.state()).settings.act).toBe(2);
  });

  test("Skip for now: the profile stays empty and is not asked again",async({app,page})=>{
    await app.open();
    await page.click('[data-ob="skip"]');
    await expect(page.locator("nav")).toBeVisible();
    await page.reload();
    await expect(page.locator(".obp")).toHaveCount(0);
    expect((await app.state()).settings.heightCm).toBe(0);
  });
});
