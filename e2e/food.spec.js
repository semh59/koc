"use strict";
const {test,expect,state,entry}=require("./fixtures");

const results=page=>page.locator('#flist [data-food] b');
async function openFood(app,page,seed=state()){await app.open({seed});await page.click('.act[data-act="food"]');await expect(page.locator("#fq")).toBeVisible()}

test.describe("Add food",()=>{
  for(const [q,first] of [["milk","Süt (tam yağlı)"],["sucuk","Sucuk (pişmiş)"],["doner","döner"]])
    test(`search '${q}': first result ${first}`,async({app,page})=>{
      await openFood(app,page);
      await page.fill("#fq",q);
      // Acceptance: searchable without typing Turkish characters, the most relevant food on top.
      await expect(results(page).first()).toContainText(first,{ignoreCase:true});
      await expect(page.locator('#flist [data-c="askfood"]')).toContainText(`"${q}" için Rehber'e sor`);
    });

  test("search 'kasarli tost': the exact name match comes first",async({app,page})=>{
    await openFood(app,page);
    await page.fill("#fq","kasarli tost");
    await expect(results(page).first()).toHaveText("Kaşarlı tost");
  });

  test("logging with a portion and meal choice, nutrient values",async({app,page})=>{
    await openFood(app,page,state({kcal:2000}));
    await page.fill("#fq","mercimek corbasi");
    await page.locator("#flist [data-food]").first().click();
    await expect(page.locator("#sheet h3")).toHaveText("Mercimek çorbası");
    await page.click('[data-fp="1"]'); // 1 ladle (150 g)
    await page.fill("#fqty","2");
    await expect(page.locator("#fprev")).toContainText("protein");
    await page.fill("#fqty","50");
    await expect(page.locator("#fprev")).toHaveText("Miktarı 0,1 ile 20 arasında yaz");
    await page.fill("#fqty","2");
    await page.click('[data-ml="lunch"]');
    await page.click('[data-go="nutrition"]');
    await expect(app.toast).toContainText("Kaydedildi. Bugün");
    // Acceptance: saved under the meal heading, with the portion text and protein.
    await expect(page.locator(".log .gh").first()).toContainText("Öğle");
    await expect(page.locator(".log")).toContainText("Mercimek çorbası, 2 × 1 kepçe (150 g)");
    const e=(await app.state()).entries.find(x=>x.type==="food");
    expect(e.meal).toBe("lunch");expect(e.p).toBeGreaterThan(0);expect(e.v).toBeGreaterThan(100);
  });

  test("write your own: rejected without a name and calories, saved with a name",async({app,page})=>{
    await openFood(app,page);
    await page.click('[data-act="own"]');
    await page.click('[data-go="food"]');
    await expect(page.locator("#yerr")).toHaveText("Yemeğin adını ya da kalorisini yaz");
    await page.fill("#fv","25000");await page.click('[data-go="food"]');
    await expect(page.locator("#yerr")).toHaveText("Kalori çok yüksek görünüyor, kontrol et");
    await page.fill("#ft","Annemin böreği");await page.fill("#fv","420");
    await page.click('[data-go="food"]');
    await expect(page.locator(".log")).toContainText("Annemin böreği");
    await expect(page.locator(".log")).toContainText("420 kcal");
  });

  test("quick buttons: repeat yesterday, favorite, recent, template",async({app,page})=>{
    const y=[entry("food",350,"Yulaf lapası",{d:-1,x:{meal:"breakfast"}}),entry("food",120,"Muz",{d:-1,x:{meal:"breakfast"}})];
    await openFood(app,page,state({},{entries:y}));
    await page.click('[data-act="yesterday"]');
    await expect(app.toast).toHaveText("Dünkü 2 yemek bugüne eklendi");
    await expect(page.locator(".log")).toContainText("Yulaf lapası");
    await page.click("#tundo");
    await expect(page.locator(".log li",{hasText:"Yulaf"})).toHaveCount(0);
    // Favorite a recent food, then add it from favorites with one tap.
    await page.click('.act[data-act="food"]');
    await page.locator('#frl [data-fva]').first().click();
    await expect(page.locator('#frl .lbl',{hasText:"Sık kullanılanlar"})).toBeVisible();
    await page.locator('#frl [data-fv="0"]').click();
    await expect(app.toast).toContainText("eklendi");
    // Template from today's meals, then add from the template.
    await page.click('[data-act="tplnew"]');
    await page.fill("#tpn","Kahvaltım");await page.click('[data-go="tpl"]');
    await expect(app.toast).toHaveText('"Kahvaltım" şablonu kaydedildi');
    await page.click('.act[data-act="food"]');
    await page.click('[data-tp="0"]');
    await expect(app.toast).toHaveText("Kahvaltım: 1 yemek eklendi");
    const s=await app.state();
    expect([s.favFoods.length,s.mealTpl.length]).toEqual([1,1]);
  });

  test("recipe: per-serving calories from ingredients, shows in search, added to the log",async({app,page})=>{
    await openFood(app,page);
    await page.click('[data-act="own"]');
    await page.click('[data-rp="new"]');
    await page.click('[data-rp="save"]');
    await expect(page.locator("#rerr")).toHaveText("Tarife bir ad yaz");
    await page.fill("#rn","Fırın makarna");await page.fill("#rs","4");
    for(const q of ["makarna","kasar peyniri"]){await page.fill("#rq",q);await page.locator('#rlist [data-rp^="pick"]').first().click()}
    await expect(page.locator("#rrows .prow")).toHaveCount(2);
    await expect(page.locator("#rsum")).toContainText("kcal");
    await page.click('[data-rp="save"]');
    await expect(app.toast).toHaveText('"Fırın makarna" tarifi kaydedildi');
    await page.click('.act[data-act="food"]');
    await page.fill("#fq","firin makarna");
    await expect(page.locator("#flist [data-food]").first()).toContainText("Tarifim, 1 porsiyon");
    await page.locator("#flist [data-food]").first().click();
    await page.click('[data-go="nutrition"]');
    await expect(page.locator(".log")).toContainText("Fırın makarna");
  });
});

test.describe("Barcode (fake scanner, fake Open Food Facts reply)",()=>{
  const CODE="8690000000017";
  const product={status:1,product:{code:CODE,product_name:"Tam Buğday Kraker",brands:"Örnek",serving_quantity:30,product_quantity:200,nutriments:{"energy-kcal_100g":420,proteins_100g:11,carbohydrates_100g:62,fat_100g:14,fiber_100g:8}}};
  async function scan(app,page,body,status=200){
    await page.context().route(/world\.openfoodfacts\.org\/api\/v2\/product\//,r=>body==null?r.abort("internetdisconnected"):r.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*"},body:JSON.stringify(body)}));
    await app.open({seed:state(),native:{barcode:CODE}});
    await page.click('.act[data-act="food"]');
    await page.click('[data-act="barcode"]');
  }
  test("a found product is saved to the list, added by portion and shown as 'Benim ürünüm' in search",async({app,page})=>{
    await scan(app,page,product);
    await expect(page.locator("#sheet h3")).toHaveText("Tam Buğday Kraker (Örnek)");
    await expect(page.locator("#fpc .chip").first()).toHaveText("1 porsiyon (30 g)");
    await expect(page.locator("#sheet")).toContainText("Open Food Facts");
    await page.click('[data-go="nutrition"]');
    await expect(page.locator(".log")).toContainText("Tam Buğday Kraker (Örnek), 1 porsiyon (30 g)");
    await expect(page.locator(".log")).toContainText("126 kcal");
    await page.click('.act[data-act="food"]');
    await page.fill("#fq","kraker");
    await expect(page.locator("#flist [data-food]").first()).toContainText("Benim ürünüm, 100 g: 420 kcal");
    // Deleting your own food from the list.
    await page.locator("#flist [data-food]").first().click();
    await page.click('[data-go="mydel"]');
    await expect(app.toast).toHaveText("Besin listenden silindi");
    expect((await app.state()).myFoods).toEqual([]);
  });
  test("a missing product falls back to manual entry",async({app,page})=>{
    await scan(app,page,{status:0});
    await expect(app.toast).toContainText("Ürün bulunamadı");
    await expect(page.locator("#ft")).toBeVisible();
  });
  test("no internet shows the Turkish error",async({app,page,errs})=>{
    errs.allow(/Failed to load resource|ERR_INTERNET_DISCONNECTED|ERR_FAILED/);
    await scan(app,page,null);
    await expect(app.toast).toHaveText("İnternete ulaşılamadı, barkod aranamadı");
  });
});

test.describe("Quick text entry",()=>{
  test("write several foods, preview, fix a measure, add all with one undo",async({app,page})=>{
    await openFood(app,page);
    await page.click('[data-qk="open"]');
    await page.fill("#qkt","2 dilim ekmek, yarım simit, 3 yemek kaşığı pilav, xyzqq");
    await page.click('[data-qk="prep"]');
    await expect(page.locator("#sheet, .sheet").first()).toContainText("Besin bulunamadı, eklenmez");
    await expect(page.locator("body")).toContainText("Beyaz ekmek, 2 × 1 dilim (30 g)");
    await expect(page.locator('[data-qk="add"]')).toBeDisabled();
    await page.click('[data-qk^="ack:"]');
    await expect(page.locator('[data-qk="add"]')).toBeEnabled();
    expect((await app.state()).entries.filter(e=>e.type==="food").length).toBe(0);
    await page.click('[data-qk="add"]');
    await expect(app.toast).toContainText("3 yemek eklendi");
    const food=(await app.state()).entries.filter(e=>e.type==="food");
    expect(food.length).toBe(3);
    expect(food.every(e=>e.v>0&&e.meal)).toBe(true);
    await page.click("#tundo");
    expect((await app.state()).entries.filter(e=>e.type==="food").length).toBe(0);
  });
});
