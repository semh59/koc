"use strict";
const {test,expect,state,entry,day}=require("./fixtures");

const ring=(page,label)=>page.locator(".ring",{has:page.locator(".rl",{hasText:label})});

test.describe("Today",()=>{
  test("the calorie ring updates with a meal",async({app,page})=>{
    await app.open({seed:state({kcal:2000})});
    await expect(ring(page,"Kalori").locator(".rc")).toContainText("0");
    await expect(app.view).toContainText("Bugün az yemek kayıtlı");
    await page.click('.act[data-act="food"]');
    await page.click('[data-act="own"]');
    await page.fill("#ft","Ev yemeği");await page.fill("#fv","650");
    await page.click('[data-go="food"]');
    // Under 800 kcal logged the ring centre shows the total, not a remainder; the line below shows done / target.
    await expect(app.toast).toHaveText("Kaydedildi. Bugün 650 / 2000 kcal");
    await expect(ring(page,"Kalori").locator(".rc")).toContainText("650");
    await expect(ring(page,"Kalori").locator(".rs")).toHaveText("650 / 2000 kcal");
  });

  test("the water and sport rings sit beside the calorie ring",async({app,page})=>{
    await app.open({seed:state({kcal:2000},{entries:[entry("food",1150,"Öğle")]})});
    const m=await page.locator(".rings>.rbtn").boundingBox(),s=await page.locator(".rmini").boundingBox();
    expect(s.x).toBeGreaterThanOrEqual(m.x+m.width);
    expect(s.y).toBeLessThan(m.y+m.height);
  });

  test("More tab opens the sleep and mood summary with the watch source",async({app,page})=>{
    await app.open({seed:state({},{sleep:[{day:day(-1),min:420,src:"hc"},{day:day(0),min:480,q:4}],mood:[{day:day(0),v:4,t:"Güzel"}]})});
    await app.go("more");
    await page.click('#view [data-hb="more"]');
    const sheet=page.locator("#sheet.on");
    await expect(sheet).toContainText("Son 2 gecenin ortalaması");
    await expect(sheet).toContainText("7 sa 30 dk");
    await expect(sheet).toContainText("Saatten (Health Connect)");
    await expect(sheet).toContainText("Güzel");
    await sheet.locator('[data-hb="sleep"]').click();
    await expect(page.locator("#sheet.on h3")).toHaveText("Uyku");
  });

  test("Today shows the day's calorie range when recipe-range foods are most of the day",async({app,page})=>{
    await app.open({seed:state({kcal:2000},{entries:[entry("food",600,"Karnıyarık",{x:{lo:500,hi:800}}),entry("food",400,"Ekmek")]})});
    await expect(page.locator("#view")).toContainText("Porsiyon tahminleri yaklaşık olduğu için bugünün toplamı ~900–1.200 kcal arasında olabilir.");
  });

  test("add water: ring and daily total, Undo",async({app,page})=>{
    await app.open({seed:state()});
    await page.click('.act[data-act="water"]');
    await expect(app.toast).toHaveText("+250 ml, bugün 250 / 2500 ml");
    await page.click('.act[data-act="water"]');
    await expect(ring(page,"Su").locator(".rs")).toHaveText("0,5 / 2,5 L");
    await expect(page.locator('[data-waterall]')).toHaveText("Su: 500 ml, 2 kez");
    await page.click("#tundo");
    await expect(ring(page,"Su").locator(".rs")).toHaveText("0,3 / 2,5 L");
  });

  test("weigh-in: save, large-difference warning, invalid value",async({app,page})=>{
    await app.open({seed:state({},{entries:[entry("weight",84,"",{d:-1})]})});
    await page.click('.act[data-act="weight"]');
    await expect(page.locator("#fv")).toHaveValue("84,0");
    await page.fill("#fv","abc");await page.click('[data-go="weight"]');
    await expect(page.locator("#kerr")).toHaveText("Kiloyu kg olarak yaz, örneğin 84,3");
    await page.fill("#fv","90");await page.click('[data-go="weight"]');
    await expect(page.locator("#kwarn")).toContainText("+6,0 kg fark var");
    await page.fill("#fv","83,6");await page.click('[data-go="weight"]');
    // Acceptance: after saving the toast shows the difference and the card shows today's weigh-in.
    await expect(app.toast).toHaveText("83,6 kg kaydedildi, öncekine göre −0,4 kg");
    await expect(page.locator(".stepcard .wv")).toContainText("83,6");
    await expect(page.locator(".stepcard").first()).toContainText("Bugünkü tartı");
  });

  test("steps: sensor card and manual step entry",async({app,page})=>{
    await app.open({seed:state({stepsOn:true,stepGoal:8000}),native:{steps:4321}});
    const card=page.locator('#view .rbtn[data-tab="steps"]');
    await expect(card).toContainText("4.321");
    await card.click();
    await expect(page.locator("#ttl")).toHaveText("Adım raporu");
    await page.click('[data-act="stepsadd"]');
    await page.fill("#fv","1500");await page.click('[data-go="steps"]');
    await expect(app.toast).toHaveText("1.500 adım eklendi");
    // Acceptance: manually added steps are added to the sensor value.
    await expect(page.locator(".ring .rc").first()).toContainText("5.821");
    await page.click("#back");
    await expect(card).toContainText("5.821");
  });

  test("quick sport and note entry",async({app,page})=>{
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

test("a due dose is one row: name on the left, Aldım and Atla beside it on the right; a long name is not split",async({app,page})=>{
  await app.open({seed:state({medOn:true},{meds:[{id:1,n:"Tansiyon",t:["08:00"],on:true},{id:2,n:"Şeker",t:["08:00"],on:true},{id:3,n:"Hidroklorotiyazid",t:["08:00"],on:true}]})});
  const r=await page.evaluate(()=>[...document.querySelectorAll('.todo .mrow:has([data-md^="take:"])')].map(x=>{
    const sp=x.querySelector("span"),s=sp.getBoundingClientRect(),a=x.querySelector(".acts").getBoundingClientRect(),t=[...sp.childNodes].find(n=>n.nodeType===3&&n.textContent.trim()),rg=document.createRange();
    rg.selectNodeContents(t);return {beside:a.left>=s.right-1&&a.top<s.bottom,lines:new Set([...rg.getClientRects()].map(q=>Math.round(q.top))).size}}));
  // At 360 px a wide system font (Aldım + the 24 px gap + Atla need about 210 px) puts the buttons under the name; from 400 px they sit beside it.
  if(page.viewportSize().width>=400)expect(r.slice(0,2).map(x=>x.beside)).toEqual([true,true]);
  expect(r[2].lines).toBe(1);
});

test.describe("Log",()=>{
  test("delete an entry and Undo; go to the previous day",async({app,page})=>{
    await app.open({seed:state({},{entries:[entry("food",300,"Menemen",{x:{meal:"breakfast"}}),entry("note",null,"Dünkü not",{d:-1})]})});
    const row=page.locator(".log li",{hasText:"Menemen"});
    await row.locator(".del").click();
    await expect(app.toast).toHaveText("Kayıt silindi");
    await expect(page.locator(".log li",{hasText:"Menemen"})).toHaveCount(0);
    await page.click("#tundo");
    // Acceptance: Undo puts the entry back in place and persists.
    await expect(page.locator(".log li",{hasText:"Menemen"})).toHaveCount(1);
    expect((await app.state()).entries.some(e=>e.text==="Menemen")).toBe(true);
    await page.click('[data-lo="1"]');
    await expect(page.locator(".dnav h2")).toHaveText("Dün");
    await expect(page.locator(".log")).toContainText("Dünkü not");
    await expect(page.locator('[data-lo="-1"]')).toBeEnabled();
    await page.click('[data-lo="-1"]');
    await expect(page.locator('[data-lo="-1"]')).toBeDisabled();
  });

  test("changing the meal",async({app,page})=>{
    await app.open({seed:state({},{entries:[entry("food",300,"Mercimek çorbası",{x:{meal:"breakfast"}})]})});
    await expect(page.locator(".log .gh").first()).toContainText("Kahvaltı");
    await page.click('[data-edit]');
    await page.click('#sheet [data-ml="dinner"]');
    await page.click('#sheet [data-go="entry"]');
    await expect(page.locator(".log .gh").first()).toContainText("Akşam");
  });

  test("tea does not change water progress and shows on the Other drinks line; water does",async({app,page})=>{
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
