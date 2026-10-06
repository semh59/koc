"use strict";
const {test,expect}=require("./fixtures");

const step=page=>page.locator(".obp .mut");
async function fill(page,{cm="178",kg="84",age="35"}={}){
  await page.fill("#obcm",cm);await page.fill("#obkg",kg);await page.fill("#obage",age);
}

test.describe("Onboarding",()=>{
  // Yaş kapısı başka bir çalışmada yazılıyor (onboardui.js); bugün 17 yaş ikinci adıma geçiyor.
  test.fixme("18 yaş kapısı: 17 reddedilir, 18 geçer",async({app,page})=>{
    await app.open();
    await expect(step(page)).toHaveText("Adım 1/3");
    await fill(page,{age:"17"});
    await page.click('[data-ob="next"]');
    // Kabul: 17 yaşta ikinci adıma geçilmez, alanın altında hata görünür.
    await expect(step(page)).toHaveText("Adım 1/3");
    await expect(page.locator("#oberr")).not.toBeEmpty();
    await expect(page.locator("#obage")).toHaveAttribute("aria-invalid","true");
    await page.fill("#obage","18");
    await page.click('[data-ob="next"]');
    await expect(step(page)).toHaveText("Adım 2/3");
  });

  test("profil ve hedef kaydedilir, ilerleme çubuğu adımı izler",async({app,page})=>{
    await app.open();
    const on=page.locator(".obbar i.on");
    await expect(on).toHaveCount(1);
    await fill(page);
    await page.click('[data-ob="dir:ver"]');
    await page.fill("#obgoal","90"); // şimdiki kilodan yüksek: reddedilir
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
    // Kabul: Bugün açılır, alt menü görünür, profil ve ilk tartı kayıtlı.
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator(".stepcard .wv")).toContainText("84,0");
    const s=await app.state();
    expect(s.settings).toMatchObject({heightCm:178,age:35,goalKg:76,bpOn:true,obDone:true});
    expect(s.settings.kcal).toBeGreaterThanOrEqual(1200);
    expect(s.entries.filter(e=>e.type==="kilo").map(e=>e.v)).toEqual([84]);
  });

  test("Şimdilik geç: profil boş kalır, bir daha sorulmaz",async({app,page})=>{
    await app.open();
    await page.click('[data-ob="skip"]');
    await expect(page.locator("nav")).toBeVisible();
    await page.reload();
    await expect(page.locator(".obp")).toHaveCount(0);
    expect((await app.state()).settings.heightCm).toBe(0);
  });
});
