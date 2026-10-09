"use strict";
const {test,expect,state,entry}=require("./fixtures");
const {readFile}=require("fs/promises");

const PW="Kuzey-Yildiz-2026";
test("şifreli yedek: al, tüm verileri sil, parolasız ve yanlış parolayla reddedilir, doğru parolayla güvenlik kopyasıyla geri yüklenir",async({app,page})=>{
  test.setTimeout(90000);
  await app.open({seed:state({},{entries:[entry("note",null,"Gizli sağlık notum"),entry("weight",81.5)]}),keys:{groq:"gsk_test"}});
  const toastIs=m=>expect(app.toast).toHaveText(m);
  const bk=async()=>{await app.go("settings-data");await page.click('[data-act="backup"]')};

  // Yedek alma: kısa/uyuşmayan parola reddedilir, geçerli parolayla şifreli dosya iner
  await bk();
  await page.fill("#bkpw","kisa");await page.fill("#bkpw2","kisa");
  await page.click('[data-go="download"]');
  await expect(page.locator("#bkw")).toContainText("en az 10 karakter");
  await page.fill("#bkpw",PW);await page.fill("#bkpw2",PW+"x");
  await page.click('[data-go="download"]');
  await expect(page.locator("#bkw")).toHaveText("Parolalar aynı değil");
  await page.fill("#bkpw2",PW);
  const [dl]=await Promise.all([page.waitForEvent("download"),page.click('[data-go="download"]')]);
  expect(dl.suggestedFilename()).toBe("neowell-yedek-2026-10-06.json");
  const text=await readFile(await dl.path(),"utf8");
  expect(JSON.parse(text).enc).toBe("aes-gcm-pbkdf2");
  expect(text).not.toMatch(/Gizli sağlık|gsk_test|81\.5/);

  // Tüm verileri sil; sonradan yazılan not geri yüklemeden önceki güvenlik kopyasına girmeli
  await app.closeSheet();
  await app.go("settings-data");await page.click('[data-act="reset"]');
  await toastIs("Tüm veriler silindi");
  expect((await app.state()).entries).toEqual([]);
  expect(await page.evaluate("getKeys().groq")).toBeUndefined();
  await page.evaluate("add('note',null,'Sonradan yazılan',dayKey());save()");

  // Parolasız, yanlış parolalı ve düz metin geri yükleme verilere dokunmaz
  await bk();
  await page.fill("#bk",text);
  await page.click('[data-go="restore"]');
  await toastIs("Şifreli yedek: önce parolayı yaz");
  await page.fill("#bkpw","Yanlis-Parola-2026");
  await page.click('[data-go="restore"]');
  await toastIs("Parola yanlış ya da yedek bozuk");
  await page.fill("#bk",JSON.stringify({entries:[]}));await page.fill("#bkpw",PW);
  await page.click('[data-go="restore"]');
  await toastIs("Yalnız parolalı yedek geri yüklenir");
  expect((await app.state()).entries.map(e=>e.text)).toEqual(["Sonradan yazılan"]);
  expect(app.dialogs.length).toBe(1); // yalnız sıfırlama onayı

  // Onay penceresinde vazgeçilirse değişmez; doğru parola ve onayla geri yüklenir
  await page.fill("#bk",text);
  app.onDialog=d=>d.dismiss();
  await page.click('[data-go="restore"]');
  await expect.poll(()=>app.dialogs.length).toBe(2);
  expect((await app.state()).entries.map(e=>e.text)).toEqual(["Sonradan yazılan"]);
  app.onDialog=null;
  await page.click('[data-go="restore"]');
  await toastIs("Yedek yüklendi");
  expect(app.dialogs[2]).toMatch(/^2 kayıt yüklenecek\. Mevcut veriler değişecek\./);
  const st=await app.state();
  expect(st.entries.map(e=>e.text).sort()).toEqual(["","Gizli sağlık notum"]);
  expect(st.entries.find(e=>e.type==="weight").v).toBe(81.5);
  expect(await page.evaluate("getKeys().groq")).toBe("gsk_test");
  const prev=await page.evaluate(()=>JSON.parse(Store.get("nw_state_previous")));
  expect(prev.entries.map(e=>e.text)).toEqual(["Sonradan yazılan"]);
  expect(st.settings.copyAt).toBe("2026-10-06");
  await app.go("settings-data");
  await expect(app.view).toContainText("Geri yüklemeden önceki güvenlik kopyası");
  await expect(page.locator('[data-act="copyseen"]')).toBeVisible();
});
