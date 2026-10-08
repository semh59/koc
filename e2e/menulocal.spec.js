"use strict";
const {test,expect,state,entry}=require("./fixtures");

test.describe("Anahtarsız yerel menü",()=>{
  test("anahtar ve izin yok: cihazda menü -> Bugüne ekle -> Alışveriş listesi; ağ isteği yok",async({app,page,fake})=>{
    await app.open({seed:state({kcal:2200})});await app.tab("koc");
    await expect(page.locator('[data-c="menu"]')).toHaveText("Menü oluştur (cihazda)");
    await page.click('[data-c="menu"]');
    await expect(page.locator('#sheet [data-c="menuask"]')).toBeDisabled();
    await page.fill("#mnote","fıstık alerjisi");
    await page.click('#sheet [data-c="menulocal"]');
    const card=page.locator("[data-mid] .lcard").filter({hasText:"Haftalık menü"});
    await expect(card).toBeVisible();
    await expect(card.locator(".lhead b")).toHaveCount(8);
    const mc=(await app.state()).chat.find(m=>m.card&&m.card.kind==="menu").card;
    expect(mc.days.length).toBe(7);expect(mc.days.every(d=>!d.off&&Math.abs(d.k-2200)<=154)).toBe(true);
    expect(JSON.stringify(mc)).not.toContain("ıstık");
    const items=mc.days[0].meals.flatMap(b=>b.items);
    await card.locator('[data-c^="menuday:"]').first().click();
    await page.click('#sheet [data-c^="menuadd:"]');
    await expect(app.toast).toContainText(`${items.length} yemek bugüne eklendi`);
    expect((await app.state()).entries.filter(e=>e.type==="yemek").length).toBe(items.length);
    await card.locator('[data-c^="shop:"]').click();
    await expect(page.locator("#sheet .prow").first()).toBeVisible();
    expect(fake.chats().length).toBe(0);
  });
});

test.describe("Kilo trendine göre hedef önerisi",()=>{
  /* 21 gün sabit 80 kg, 14 gün 2200 kcal: hedef 75 kg (haftada ~-0,4) ama kilo düşmüyor. */
  const seed=(o={})=>state({kcal:2200,goalKg:75,...o},{entries:[...[0,3,6,9,12,15,18,21].map(d=>entry("kilo",80,"",{d:-d,time:"07:00"})),...Array.from({length:14},(_,i)=>entry("yemek",2200,"gün",{d:-(i+1),time:"13:00"}))]});
  test("öneri kartı çıkar, Şimdi değil 7 gün susturur ve kalıcıdır",async({app,page})=>{
    await app.open({seed:seed()});await app.tab("trend");
    const card=page.locator("#view .card").filter({hasText:"Kalori hedefini ayarlayalım mı?"});
    await expect(card).toContainText("2200 kcal yerine 1950 kcal");
    await page.click('[data-gs="no"]');
    await expect(card).toHaveCount(0);
    const st=(await app.state()).settings;expect(st.kcal).toBe(2200);expect(st.goalSugAt).toBe("2026-10-06");
    await page.reload();await app.tab("trend");await expect(card).toHaveCount(0);
  });
  test("Uygula hedefi değiştirir; onay olmadan değişmez",async({app,page})=>{
    await app.open({seed:seed()});await app.tab("trend");
    expect((await app.state()).settings.kcal).toBe(2200);
    await page.click('[data-gs="ok"]');
    await expect(app.toast).toContainText("1950");
    const st=(await app.state()).settings;expect(st.kcal).toBe(1950);expect(st.goalSugAt).toBe("2026-10-06");
  });
  test("yeme düzeni işareti varsa kart yok",async({app,page})=>{
    await app.open({seed:seed({healthNote:"yeme bozukluğum var"})});await app.tab("trend");
    await expect(page.locator("#view")).toContainText("Kilo");
    await expect(page.locator('[data-gs]')).toHaveCount(0);
  });
});
