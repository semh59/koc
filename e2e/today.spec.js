"use strict";
const {test,expect,state,entry}=require("./fixtures");

const ring=(page,label)=>page.locator(".ring",{has:page.locator(".rl",{hasText:label})});

test.describe("Bugün",()=>{
  test("kalori halkası öğünle güncellenir",async({app,page})=>{
    await app.open({seed:state({kcal:2000})});
    await expect(ring(page,"Kalori").locator(".rc")).toContainText("2000");
    await page.click('.act[data-act="food"]');
    await page.click('[data-act="own"]');
    await page.fill("#ft","Ev yemeği");await page.fill("#fv","650");
    await page.click('[data-go="food"]');
    // Kabul: halka ortası kalan kaloriyi, alt satır yapılan / hedefi gösterir.
    await expect(app.toast).toHaveText("Kaydedildi. Bugün 650 / 2000 kcal");
    await expect(ring(page,"Kalori").locator(".rc")).toContainText("1350");
    await expect(ring(page,"Kalori").locator(".rs")).toHaveText("650 / 2000 kcal");
  });

  test("su ekle: halka ve günlük toplam, Geri al",async({app,page})=>{
    await app.open({seed:state()});
    await page.click('.act[data-act="water"]');
    await expect(app.toast).toHaveText("+250 ml, bugün 250 / 2500 ml");
    await page.click('.act[data-act="water"]');
    await expect(ring(page,"Su").locator(".rs")).toHaveText("0,5 / 2,5 L");
    await expect(page.locator('[data-suall]')).toHaveText("Su: 500 ml, 2 kez");
    await page.click("#tundo");
    await expect(ring(page,"Su").locator(".rs")).toHaveText("0,3 / 2,5 L");
  });

  test("tartı girişi: kayıt, büyük fark uyarısı, hatalı değer",async({app,page})=>{
    await app.open({seed:state({},{entries:[entry("weight",84,"",{d:-1})]})});
    await page.click('.act[data-act="weight"]');
    await expect(page.locator("#fv")).toHaveValue("84,0");
    await page.fill("#fv","abc");await page.click('[data-go="weight"]');
    await expect(page.locator("#kerr")).toHaveText("Kiloyu kg olarak yaz, örneğin 84,3");
    await page.fill("#fv","90");await page.click('[data-go="weight"]');
    await expect(page.locator("#kwarn")).toContainText("+6,0 kg fark var");
    await page.fill("#fv","83,6");await page.click('[data-go="weight"]');
    // Kabul: kayıt sonrası toast farkı, kart bugünkü tartıyı gösterir.
    await expect(app.toast).toHaveText("83,6 kg kaydedildi, öncekine göre −0,4 kg");
    await expect(page.locator(".stepcard .wv")).toContainText("83,6");
    await expect(page.locator(".stepcard").first()).toContainText("Bugünkü tartı");
  });

  test("adım: sensör kartı ve elle adım ekleme",async({app,page})=>{
    await app.open({seed:state({stepsOn:true,stepGoal:8000}),native:{steps:4321}});
    const card=page.locator('#view .rbtn[data-tab="steps"]');
    await expect(card).toContainText("4.321");
    await card.click();
    await expect(page.locator("#ttl")).toHaveText("Adım raporu");
    await page.click('[data-act="stepsadd"]');
    await page.fill("#fv","1500");await page.click('[data-go="steps"]');
    await expect(app.toast).toHaveText("1.500 adım eklendi");
    // Kabul: elle eklenen adım sensör değerine eklenir.
    await expect(page.locator(".ring .rc").first()).toContainText("5.821");
    await page.click("#back");
    await expect(card).toContainText("5.821");
  });

  test("spor ve not hızlı kaydı",async({app,page})=>{
    await app.open({seed:state()});
    await page.click('.act[data-act="exercise"]');
    await page.click('[data-sp="Koşu"]');
    await page.fill("#fv","30");await page.click('[data-go="exercise"]');
    await expect(app.toast).toHaveText("Koşu 30 dk kaydedildi. Hafta: 30 / 150 dk");
    await page.click('.act[data-act="note"]');
    await page.fill("#fv","Bugün enerjim yüksek");await page.click('[data-go="note"]');
    await expect(page.locator(".log")).toContainText("Bugün enerjim yüksek");
    await expect(page.locator(".log")).toContainText("Koşu");
  });
});

test.describe("Günlük",()=>{
  test("kayıt silme ve Geri al; önceki güne geçiş",async({app,page})=>{
    await app.open({seed:state({},{entries:[entry("food",300,"Menemen",{x:{meal:"breakfast"}}),entry("note",null,"Dünkü not",{d:-1})]})});
    const row=page.locator(".log li",{hasText:"Menemen"});
    await row.locator(".del").click();
    await expect(app.toast).toHaveText("Kayıt silindi");
    await expect(page.locator(".log li",{hasText:"Menemen"})).toHaveCount(0);
    await page.click("#tundo");
    // Kabul: Geri al kaydı aynı yere döndürür ve kalıcıdır.
    await expect(page.locator(".log li",{hasText:"Menemen"})).toHaveCount(1);
    expect((await app.state()).entries.some(e=>e.text==="Menemen")).toBe(true);
    await page.click('[data-lo="1"]');
    await expect(page.locator(".dnav h2")).toHaveText("Dün");
    await expect(page.locator(".log")).toContainText("Dünkü not");
    await expect(page.locator('[data-lo="-1"]')).toBeEnabled();
    await page.click('[data-lo="-1"]');
    await expect(page.locator('[data-lo="-1"]')).toBeDisabled();
  });

  test("öğün değiştirme",async({app,page})=>{
    await app.open({seed:state({},{entries:[entry("food",300,"Mercimek çorbası",{x:{meal:"breakfast"}})]})});
    await expect(page.locator(".log .gh").first()).toContainText("Kahvaltı");
    await page.click('[data-meal]');
    await page.click('[data-mset$=":dinner"]');
    await expect(page.locator(".log .gh").first()).toContainText("Akşam");
  });

  test("çay su ilerlemesini değiştirmez ve Diğer içecekler satırında görünür; su değiştirir",async({app,page})=>{
    await app.open({seed:state()});
    await page.click('[data-dk="open"]');
    await expect(page.locator("#sheet")).toContainText("Su hedefine yalnız su ve sade maden suyu sayılır.");
    await page.click('[data-dr="tea"]');await page.fill("#fv","200");
    await page.click('[data-dk="go"]');
    await expect(ring(page,"Su").locator(".rs")).toHaveText("0,0 / 2,5 L");
    await expect(page.locator(".log")).toContainText("Diğer içecekler: 200 ml, 1 kez");
    await page.click('.act[data-act="water"]');
    await expect(ring(page,"Su").locator(".rs")).toHaveText("0,3 / 2,5 L");
  });
});
