"use strict";
/* Depo (IndexedDB asıl, localStorage ayna): taşıma, yeniden açılış, açılamama, çakışma, silme, yazma hatası. Gerçek Chromium IndexedDB'siyle. */
const {test,expect,state}=require("./fixtures");

const SEED=state({},{entries:[{id:1,day:"2026-10-05",time:"09:00",type:"kilo",v:81.5,text:""},{id:2,day:"2026-10-06",time:"09:30",type:"yemek",v:600,text:"Eski yemek"}],nextId:3});
/* Tohumu yalnız oturumda bir kez yazar: yeniden yüklemede localStorage'ı boşaltılmış hâliyle de denenebilsin. */
const seedOnce=(page,s)=>page.addInitScript(j=>{if(!sessionStorage.getItem("seeded")){localStorage.setItem("koc_v1",j);sessionStorage.setItem("seeded","1")}},JSON.stringify(s));
const idbMain=page=>page.evaluate(()=>new Promise((res,rej)=>{const r=indexedDB.open("neowell",1);r.onsuccess=()=>{const q=r.result.transaction("kv").objectStore("kv").get("koc_v1");q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)};r.onerror=()=>rej(r.error)}));

test("eski kullanıcı: localStorage'daki kayıt IndexedDB'ye taşınır, ayna kalır, yeniden açılışta kayıp yok",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>Store.whenIdle());
  const rec=await idbMain(page);
  expect(rec.rev).toBeGreaterThanOrEqual(1);expect(JSON.parse(rec.v).entries.map(e=>e.text)).toContain("Eski yemek");
  expect(await page.evaluate(()=>[Store.mode,localStorage.getItem("koc_v1_rev")!=null])).toEqual(["idb",true]);
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  expect((await app.state()).entries).toHaveLength(2);
});
test("asıl depo IndexedDB: localStorage aynası silinse de veri IndexedDB'den gelir",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>{add("su",250);});await page.evaluate(()=>Store.whenIdle());
  await page.evaluate(()=>{["koc_v1","koc_v1_rev","koc_v1_sum"].forEach(k=>localStorage.removeItem(k))});
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  const s=await app.state();expect(s.entries.map(e=>e.type).sort()).toEqual(["kilo","su","yemek"]);
  expect(await page.evaluate(()=>localStorage.getItem("koc_v1")!=null)).toBe(true); // ayna yeniden yazıldı
});
test("IndexedDB açılamazsa uygulama localStorage ile çalışır, kayıt kaybolmaz",async({app,page})=>{
  await page.addInitScript(()=>{indexedDB.open=()=>{throw new Error("kapalı")}});
  await seedOnce(page,SEED);await app.open({});
  expect(await page.evaluate(()=>Store.mode)).toBe("ls");
  await page.evaluate(()=>{add("su",300)});
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  expect((await app.state()).entries.map(e=>e.type).sort()).toEqual(["kilo","su","yemek"]);
});
test("çakışma: localStorage'a başka sürüm yazdıysa o alınır, IndexedDB'deki hal çakışma kopyasında kalır",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>{add("su",250)});await page.evaluate(()=>Store.whenIdle());
  await page.evaluate(()=>{const o=JSON.parse(localStorage.getItem("koc_v1"));o.entries=o.entries.filter(e=>e.type!=="su");o.entries.push({id:99,day:"2026-10-06",time:"10:00",type:"not",v:null,text:"Eski sürümden"});localStorage.setItem("koc_v1",JSON.stringify(o))});
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  const s=await app.state();expect(s.entries.map(e=>e.text)).toContain("Eski sürümden");
  const cf=await page.evaluate(()=>Store.get("koc_v1_catisma"));expect(JSON.parse(cf).entries.some(e=>e.type==="su")).toBe(true);
});
test("Tüm verileri sil: IndexedDB ve aynadaki kayıt gider, yeniden açılışta eski veri geri gelmez",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>{add("su",250)});
  await page.evaluate(()=>{document.body.insertAdjacentHTML("beforeend",'<button id="x" data-act="sifirla"></button>');document.getElementById("x").click()});
  await expect(page.locator("#toast.on #tmsg")).toContainText("Tüm veriler silindi");
  await page.evaluate(()=>Store.whenIdle());
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  expect((await app.state()).entries).toEqual([]);
  expect(JSON.parse((await idbMain(page)).v).entries).toEqual([]);
});
test("kilit açıkken bayrak yazılır (kilit ekranı ilk boyamadan önce)",async({app,page})=>{
  await seedOnce(page,state({lockOn:true},{entries:[]}));await app.open({});
  expect(await page.evaluate(()=>localStorage.getItem("nw_lockon"))).toBe("1");
});
test("IndexedDB yazamazsa kalıcı uyarı çıkar, değişiklik bellekte kalır; yazım düzelince uyarı kalkar",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>{window.__put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException("dolu","QuotaExceededError")}});
  await page.evaluate(()=>{add("su",250)});
  await expect(page.locator("#toast.on #tmsg")).toContainText("kaydedilemedi");
  expect(await page.evaluate(()=>S.entries.some(e=>e.type==="su"))).toBe(true);
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.__put;add("su",100)});
  await page.evaluate(()=>Store.whenIdle());
  expect(await page.evaluate(()=>Store.failed)).toBe(false);
  expect(JSON.parse((await idbMain(page)).v).entries.filter(e=>e.type==="su")).toHaveLength(2);
});
