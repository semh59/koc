"use strict";
const {test,expect,state,entry}=require("./fixtures");

const results=page=>page.locator('#flist [data-food] b');
async function openFood(app,page,seed=state()){await app.open({seed});await page.click('.act[data-act="food"]');await expect(page.locator("#fq")).toBeVisible()}

test.describe("Yemek ekle",()=>{
  for(const [q,first] of [["milk","Süt (tam yağlı)"],["sucuk","Sucuk (pişmiş)"],["doner","döner"]])
    test(`arama '${q}': ilk sonuç ${first}`,async({app,page})=>{
      await openFood(app,page);
      await page.fill("#fq",q);
      // Kabul: Türkçe karakter yazmadan aranır, en ilgili besin en üstte.
      await expect(results(page).first()).toContainText(first,{ignoreCase:true});
      await expect(page.locator('#flist [data-c="askfood"]')).toContainText(`"${q}" için Koç'a sor`);
    });

  test("arama 'kasarli tost': tam ad eşleşmesi ilk sırada",async({app,page})=>{
    await openFood(app,page);
    await page.fill("#fq","kasarli tost");
    await expect(results(page).first()).toHaveText("Kaşarlı tost");
  });

  test("porsiyon ve öğün seçimiyle kayıt, besin değerleri",async({app,page})=>{
    await openFood(app,page,state({kcal:2000}));
    await page.fill("#fq","mercimek corbasi");
    await page.locator("#flist [data-food]").first().click();
    await expect(page.locator("#sheet h3")).toHaveText("Mercimek çorbası");
    await page.click('[data-fp="1"]'); // 1 kepçe (150 g)
    await page.fill("#fqty","2");
    await expect(page.locator("#fprev")).toContainText("protein");
    await page.fill("#fqty","50");
    await expect(page.locator("#fprev")).toHaveText("Miktarı 0,1 ile 20 arasında yaz");
    await page.fill("#fqty","2");
    await page.click('[data-ml="lunch"]');
    await page.click('[data-go="nutrition"]');
    await expect(app.toast).toContainText("Kaydedildi. Bugün");
    // Kabul: öğün başlığı altında, porsiyon metniyle ve protein dahil kaydedilir.
    await expect(page.locator(".log .gh").first()).toContainText("Öğle");
    await expect(page.locator(".log")).toContainText("Mercimek çorbası, 2 × 1 kepçe (150 g)");
    const e=(await app.state()).entries.find(x=>x.type==="food");
    expect(e.meal).toBe("lunch");expect(e.p).toBeGreaterThan(0);expect(e.v).toBeGreaterThan(100);
  });

  test("kendin yaz: adsız ve kalorisiz reddedilir, adla kaydedilir",async({app,page})=>{
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

  test("hızlı düğmeler: dünkünü tekrarla, favori, son yenen, şablon",async({app,page})=>{
    const y=[entry("food",350,"Yulaf lapası",{d:-1,x:{meal:"breakfast"}}),entry("food",120,"Muz",{d:-1,x:{meal:"breakfast"}})];
    await openFood(app,page,state({},{entries:y}));
    await page.click('[data-act="yesterday"]');
    await expect(app.toast).toHaveText("Dünkü 2 yemek bugüne eklendi");
    await expect(page.locator(".log")).toContainText("Yulaf lapası");
    await page.click("#tundo");
    await expect(page.locator(".log li",{hasText:"Yulaf"})).toHaveCount(0);
    // Son yediklerinden favoriye al, favoriden tek dokunuşla ekle.
    await page.click('.act[data-act="food"]');
    await page.locator('#frl [data-fva]').first().click();
    await expect(page.locator('#frl .lbl',{hasText:"Sık kullanılanlar"})).toBeVisible();
    await page.locator('#frl [data-fv="0"]').click();
    await expect(app.toast).toContainText("eklendi");
    // Bugünün yemeklerinden şablon, şablondan ekleme.
    await page.click('[data-act="tplnew"]');
    await page.fill("#tpn","Kahvaltım");await page.click('[data-go="tpl"]');
    await expect(app.toast).toHaveText('"Kahvaltım" şablonu kaydedildi');
    await page.click('.act[data-act="food"]');
    await page.click('[data-tp="0"]');
    await expect(app.toast).toHaveText("Kahvaltım: 1 yemek eklendi");
    const s=await app.state();
    expect([s.favFoods.length,s.mealTpl.length]).toEqual([1,1]);
  });

  test("tarif: malzemelerden porsiyon kalorisi, aramada çıkar, günlüğe eklenir",async({app,page})=>{
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

test.describe("Barkod (sahte tarayıcı, Open Food Facts yanıtı sahte)",()=>{
  const CODE="8690000000017";
  const product={status:1,product:{code:CODE,product_name:"Tam Buğday Kraker",brands:"Örnek",serving_quantity:30,product_quantity:200,nutriments:{"energy-kcal_100g":420,proteins_100g:11,carbohydrates_100g:62,fat_100g:14,fiber_100g:8}}};
  async function scan(app,page,body,status=200){
    await page.context().route(/world\.openfoodfacts\.org\/api\/v2\/product\//,r=>body==null?r.abort("internetdisconnected"):r.fulfill({status,contentType:"application/json",headers:{"access-control-allow-origin":"*","access-control-allow-headers":"*"},body:JSON.stringify(body)}));
    await app.open({seed:state(),native:{barcode:CODE}});
    await page.click('.act[data-act="food"]');
    await page.click('[data-act="barcode"]');
  }
  test("bulunan ürün listeye kaydedilir, porsiyonla eklenir, aramada 'Benim ürünüm'",async({app,page})=>{
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
    // Kendi besinini listeden silme.
    await page.locator("#flist [data-food]").first().click();
    await page.click('[data-go="mydel"]');
    await expect(app.toast).toHaveText("Besin listenden silindi");
    expect((await app.state()).myFoods).toEqual([]);
  });
  test("ürün yoksa elle girişe döner",async({app,page})=>{
    await scan(app,page,{status:0});
    await expect(app.toast).toContainText("Ürün bulunamadı");
    await expect(page.locator("#ft")).toBeVisible();
  });
  test("internet yoksa Türkçe hata",async({app,page,errs})=>{
    errs.allow(/Failed to load resource|ERR_INTERNET_DISCONNECTED|ERR_FAILED/);
    await scan(app,page,null);
    await expect(app.toast).toHaveText("İnternete ulaşılamadı, barkod aranamadı");
  });
});
