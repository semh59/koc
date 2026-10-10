"use strict";
const {test,expect,state}=require("./fixtures");

const step=page=>page.locator(".obp .mut");
async function fill(page,{cm="178",kg="84",age="35"}={}){
  await page.fill("#obcm",cm);await page.fill("#obkg",kg);await page.fill("#obage",age);
}

test.describe("Onboarding",()=>{
  test("age-18 gate: setup stops at 17 and nothing is saved, 18 passes",async({app,page})=>{
    await app.open();
    // Welcome: the only primary action is Başla, no step counter.
    await expect(page.locator("#view h2")).toHaveText("NeoWell'e hoş geldin");
    await expect(page.locator("#view .btn:not(.ghost)")).toHaveText(["Başla"]);
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

test("fixed notice: existing install sees it once until acknowledged; the welcome screen carries it too",async({app,page})=>{
  await app.open({seed:state({noticeOk:false})});
  await expect(app.sheet).toContainText("tıbbi cihaz değildir");
  await app.sheet.getByRole("button",{name:"Anladım"}).click();
  await expect(page.locator("#sheet.on")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#sheet.on")).toHaveCount(0);
});

test("welcome screen shows the fixed notice",async({app,page})=>{
  await app.open();
  await expect(page.locator(".banner")).toContainText("112");
});

test("Coach data choices: a switch stores the choice",async({app,page})=>{
  await app.open({seed:state({})});
  await app.go("settings-coach");
  await page.locator('[data-csh="Food"]').locator("xpath=..").click();
  expect(await page.evaluate(()=>S.settings.shareFood)).toBe(false);
});

test("what leaves the phone: the privacy sheet lists NeoWell's own requests and can clear them",async({app,page})=>{
  await app.open({seed:state({})});
  await page.evaluate(()=>sheetPrivacy());
  await expect(app.sheet).toContainText("internete hiçbir şey göndermedi");
  await page.evaluate(()=>NetLog.fetch("off",location.origin+"/index.html"));
  await page.evaluate(()=>sheetPrivacy());
  await expect(app.sheet).toContainText("1 istek gönderdi");
  await expect(app.sheet).toContainText("barkod numarası");
  await app.sheet.locator("summary",{hasText:"İnternete çıkanlar"}).click();
  await app.sheet.locator("summary",{hasText:"Ayrıntı"}).click();
  await app.sheet.getByRole("button",{name:"Defteri temizle"}).click();
  await expect(app.sheet).toContainText("internete hiçbir şey göndermedi");
});

test("welcome screen: restore a backup from the welcome screen without opening Settings",async({app,page})=>{
  await app.open();
  const file=await page.evaluate(async()=>JSON.stringify(await BackupLib.encrypt({S:{entries:[{id:1,day:dayKey(),time:"08:00",type:"food",v:300,text:"Mercimek çorbası"},{id:2,day:dayKey(),time:"09:00",type:"water",v:250,text:""}],settings:{heightCm:170,age:40}},keys:{}},"Mavi-Bulut-2026")));
  await page.click('[data-obr="open"]');
  await expect(app.sheet).toContainText("Yedeğini geri yükle");
  await page.setInputFiles("#obf",{name:"neowell-yedek.json",mimeType:"application/json",buffer:Buffer.from(file)});
  await page.fill("#obpw","Yanlis-Parola-2026");
  await page.click('[data-obr="go"]');
  await expect(app.toast).toContainText("Parola yanlış");
  await expect(page.locator('[data-ob="next"]')).toHaveCount(1);
  await page.fill("#obpw","Mavi-Bulut-2026");
  await page.click('[data-obr="go"]');
  await expect.poll(()=>app.dialogs.at(-1)).toMatch(/^Yedekten 2 kayıt yüklenecek\./);
  expect(app.dialogs.at(-1)).not.toContain("Mevcut veriler değişecek");
  await expect(app.toast).toContainText("Yedek yüklendi");
  await expect(page.locator("#view")).toContainText("Mercimek çorbası");
  expect(await page.evaluate(()=>[S.settings.obDone,S.settings.noticeOk,Boolean(S.settings.heightCm)])).toEqual([true,true,true]);
  await expect(page.locator("#sheet.on")).toHaveCount(0);
});
