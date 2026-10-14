"use strict";
const {test,expect,state,day,NOW}=require("./fixtures");

/* A bench session finished three days ago: for the suggestion, the "previous" column and the chart. */
const past={id:1,day:day(-3),t0:NOW.getTime()-3*864e5,t1:NOW.getTime()-3*864e5+40*60e3,name:"Antrenman",tpl:null,ex:[{id:"bench",sets:[{kg:55,reps:8,done:true},{kg:55,reps:8,done:true}]}]};
async function addEx(page,q,id){
  await page.fill("#gq",q);
  await page.click(`#glist [data-g="addex:${id}"]`);
  await expect(page.locator(`#glist [data-g="addex:${id}"] .tag`)).toHaveText("Eklendi");
}

test.describe("Gym",()=>{
  test("create, edit and delete a template",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("gym");
    await page.click('[data-g="tedit:"]');
    await page.click('[data-g="tesave"]');
    await expect(app.toast).toHaveText("Şablona ad yaz");
    await page.fill("#gten","İtiş günü");
    await page.click('[data-g="teadd"]');
    await addEx(page,"bench","bench");
    await addEx(page,"squat","squat");
    await page.click('[data-g="teback"]');
    await expect(page.locator("#sheet .card.ex")).toHaveCount(2);
    await page.fill('[data-te="sets:0"]',"4");
    await page.click('[data-g="tesave"]');
    await expect(app.toast).toHaveText("Şablon kaydedildi");
    // Acceptance: the template is listed, the target set count is kept, deletion comes back with Undo.
    const row=page.locator(".trow",{hasText:"İtiş günü"});
    await expect(row).toContainText("Bench press, Squat");
    await row.locator('[data-g^="start:"]').click();
    await expect(page.locator("#sheet .prow").first()).toContainText("4 set");
    await app.closeSheet();
    await row.locator('[data-g^="tdel:"]').click();
    await expect(page.locator(".trow",{hasText:"İtiş günü"})).toHaveCount(0);
    await page.click("#tundo");
    await expect(page.locator(".trow",{hasText:"İtiş günü"})).toHaveCount(1);
  });

  test("a ready-made program is added to templates and started",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("gym");
    await page.click("#pgacc summary");
    await page.click('[data-g="pgf:d:3"]');
    await page.click('[data-g="pg:gym3"]');
    await expect(page.locator("#sheet h3")).toHaveText("Salon tüm vücut");
    await page.click('[data-g="pgadd:gym3"]');
    await expect(app.toast).toContainText("şablon eklendi");
    const n=(await app.state()).templates.length;
    expect(n).toBeGreaterThanOrEqual(2);
    await expect(page.locator(".trow")).toHaveCount(n);
    await page.locator('.trow [data-g^="start:"]').first().click();
    await page.click('[data-g^="startgo:"]');
    await expect(page.locator(".livebar")).toContainText("Salon tüm vücut");
    expect(await page.locator(".card.ex").count()).toBeGreaterThanOrEqual(2);
  });

  test("workout: complete a set, rest timer, superset, unticked-set confirmation, history and chart",async({app,page})=>{
    await app.open({seed:state({},{workouts:[past]})});
    await app.tab("gym");
    await page.click('[data-g="start:"]');
    await expect(page.locator(".livebar")).toContainText("Antrenman");
    await page.click('[data-g="pick"]');
    await addEx(page,"bench","bench");
    await addEx(page,"squat","squat");
    await page.click('#sheet [data-g="closesheet"]');
    const bench=page.locator(".card.ex").nth(0);
    await expect(bench.locator(".srow .sp").first()).toHaveText("55 × 8");
    await expect(bench.locator(".sug")).toContainText("Öneri: 55 kg × 9");
    await page.fill('[data-gi="kg:0:0"]',"60");await page.fill('[data-gi="reps:0:0"]',"8");
    await bench.locator('[data-g="done:0:0"]').click();
    await expect(bench.locator('[data-g="done:0:0"]')).toHaveClass(/\bon\b/);
    await expect(app.toast).toContainText("Yeni rekor: Bench press, 60 kg × 8");
    // The rest timer is visible, counts down as the clock advances, and +15 and Skip work.
    const rest=page.locator("#grest");
    await expect(rest).toBeVisible();
    const t0=await page.locator("#gr").textContent();
    await page.clock.fastForward(5000);
    await expect(page.locator("#gr")).not.toHaveText(t0);
    await page.click('[data-g="rest:15"]');
    await page.click('[data-g="rest:0"]');
    await expect(rest).toBeHidden();
    // Tick with empty reps: 0 is not written silently, the previous session's value is offered.
    await page.fill('[data-gi="reps:0:1"]',"");
    await bench.locator('[data-g="done:0:1"]').click();
    await expect(app.sheet.locator("h3")).toHaveText("Set boş");
    await page.click('[data-g="fillok:0:1"]');
    await expect(bench.locator('[data-g="done:0:1"]')).toHaveClass(/\bon\b/);
    await page.click('[data-g="rest:0"]');
    // Superset: group squat with bench.
    await page.locator('[data-g="menu:1"]').click();
    await page.click('[data-g="ssl:1"]');
    await expect(page.locator(".card.ex.ssg")).toHaveCount(2);
    await expect(page.locator(".card.ex").nth(1)).toContainText("Süperset 2/2");
    // Exercise history and chart.
    await bench.locator(".exn").click();
    await expect(page.locator("#sheet")).toContainText("Tahmini 1TM");
    await expect(page.locator("#xch")).toContainText("Grafik için en az iki seans gerekir");
    await page.click('#sheet [data-g="closesheet"]');
    // A set with values but not ticked: Finish asks first; Cancel keeps the workout open.
    await bench.locator('[data-g="addset:0"]').click();
    await page.fill('[data-gi="kg:1:0"]',"80");await page.fill('[data-gi="reps:1:0"]',"5");
    await page.locator('.card.ex').nth(1).locator('[data-g="done:1:0"]').click();
    await page.click('[data-g="finish"]');
    await expect(app.sheet).toContainText(/set işaretlenmemiş/);
    await page.click('#sheet [data-g="closesheet"]');
    await expect(page.locator(".livebar")).toBeVisible();
    await page.click('[data-g="finish"]');
    await page.click('[data-g="finall"]');
    // Acceptance: the summary opens showing set count and superset; history and Today get a sport entry.
    await expect(page.locator("#sheet")).toContainText("kg hacim");
    await expect(page.locator("#sheet")).toContainText("Süperset: Bench press + Squat");
    await page.click('#sheet [data-g="closesheet"]');
    await expect(page.locator('.rrow[data-g^="sum:"]')).toHaveCount(2);
    await app.tab("today");
    await expect(page.locator(".log")).toContainText("Ağırlık, Antrenman");
  });

  test("cancelling a workout asks for confirmation",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("gym");
    await page.click('[data-g="start:"]');
    await page.click('[data-g="cancel"]');
    expect(app.dialogs.at(-1)).toBe("Bu antrenman kaydedilmeden silinsin mi?");
    await expect(page.locator('[data-g="start:"]')).toBeVisible();
    expect((await app.state()).workouts).toEqual([]);
  });
});
