"use strict";
const {test,expect,state,entry}=require("./fixtures");
const {readFile}=require("fs/promises");

const PW="Kuzey-Yildiz-2026";
test("encrypted backup: create, wipe all data, rejected without or with a wrong password, restored with the right one plus a safety copy",async({app,page})=>{
  test.setTimeout(90000);
  await app.open({seed:state({},{entries:[entry("note",null,"Gizli sağlık notum"),entry("weight",81.5)]}),keys:{groq:"gsk_test"}});
  const toastIs=m=>expect(app.toast).toHaveText(m);
  const bk=async()=>{await app.go("settings-data");await page.click('[data-act="backup"]')};
  const rs=async()=>{await app.go("settings-data");await page.click('[data-obr="open"]')};
  const restore=async(t,pw)=>{await page.fill("#obt",t);await page.fill("#obpw",pw);await expect(page.locator('[data-obr="go"]')).toBeEnabled({timeout:10000});await page.click('[data-obr="go"]')};

  // Backup: a short or mismatched password is rejected, a valid one downloads an encrypted file
  await bk();
  await page.fill("#bkpw","kisa");
  await page.click('[data-go="download"]');
  await expect(page.locator("#bkw")).toContainText("en az 10 karakter");
  await page.fill("#bkpw",PW);
  await page.fill("#bkpw2",PW+"x");
  await page.click('[data-go="download"]');
  await expect(page.locator("#bkw")).toContainText("Parolalar aynı değil");
  await page.fill("#bkpw2",PW);
  const [dl]=await Promise.all([page.waitForEvent("download"),page.click('[data-go="download"]')]);
  expect(dl.suggestedFilename()).toBe("neowell-yedek-2026-10-06.json");
  const text=await readFile(await dl.path(),"utf8");
  expect(JSON.parse(text).enc).toBe("aes-gcm-pbkdf2");
  expect(text).not.toMatch(/Gizli sağlık|gsk_test|81\.5/);

  // Wipe everything; a note written afterwards must end up in the pre-restore safety copy
  await app.closeSheet();
  await app.go("settings-data");await page.click('[data-act="reset"]');
  await toastIs("Tüm veriler silindi");
  expect((await app.state()).entries).toEqual([]);
  expect(await page.evaluate("getKeys().groq")).toBeUndefined();
  await page.evaluate("add('note',null,'Sonradan yazılan',dayKey());save()");

  // Restoring with no password, a wrong password or plain text leaves the data untouched
  await rs();
  await restore(text,"");
  await toastIs("Şifreli yedek: önce parolayı yaz");
  await restore(text,"Yanlis-Parola-2026");
  await toastIs("Parola yanlış ya da yedek bozuk");
  await restore(JSON.stringify({entries:[]}),PW);
  await toastIs("Yalnız parolalı yedek geri yüklenir");
  expect((await app.state()).entries.map(e=>e.text)).toEqual(["Sonradan yazılan"]);
  expect(app.dialogs.length).toBeGreaterThanOrEqual(1); // reset confirmation plus any restore confirmation

  // Declining the confirmation changes nothing; the right password plus confirmation restores
  app.onDialog=d=>d.dismiss();
  await restore(text,PW);
  await expect.poll(()=>app.dialogs.length).toBeGreaterThanOrEqual(2);
  expect((await app.state()).entries.map(e=>e.text)).toEqual(["Sonradan yazılan"]);
  app.onDialog=d=>d.accept();
  await restore(text,PW);
  await expect(app.toast).toContainText("Yedek yüklendi");
  expect(app.dialogs.at(-1)).toContain("Yedekten 2 kayıt yüklenecek");
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
