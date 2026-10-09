"use strict";
/* Depo (IndexedDB modül parçaları): taşıma, yeniden açılış, açılamama, bozuk parça, silme, yazma hatası. Gerçek Chromium IndexedDB'siyle. */
const {test,expect,state}=require("./fixtures");

const SEED=state({},{entries:[{id:1,day:"2026-10-05",time:"09:00",type:"kilo",v:81.5,text:""},{id:2,day:"2026-10-06",time:"09:30",type:"yemek",v:600,text:"Eski yemek"}],nextId:3});
/* Tohumu yalnız oturumda bir kez yazar: yeniden yüklemede localStorage'ı boşaltılmış hâliyle de denenebilsin. */
const seedOnce=(page,s)=>page.addInitScript(j=>{if(!sessionStorage.getItem("seeded")){localStorage.setItem("koc_v1",j);sessionStorage.setItem("seeded","1")}},JSON.stringify(s));
const idbRec=(page,k)=>page.evaluate(k=>new Promise((res,rej)=>{const r=indexedDB.open("neowell",1);r.onsuccess=()=>{const q=r.result.transaction("kv").objectStore("kv").get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)};r.onerror=()=>rej(r.error)}),k);
const shard=async(page,id)=>JSON.parse((await idbRec(page,"m:"+id)).v);
/* Kayıtlar ay ay ayrı parçada (m:kayit/<ay>): hepsini toplar. */
const entriesOf=page=>page.evaluate(()=>new Promise((res,rej)=>{const r=indexedDB.open("neowell",1);r.onsuccess=()=>{const st=r.result.transaction("kv").objectStore("kv"),q=st.getAll(IDBKeyRange.bound("m:kayit/","m:kayit/￿"));q.onsuccess=()=>res(q.result.flatMap(x=>JSON.parse(x.v).entries));q.onerror=()=>rej(q.error)};r.onerror=()=>rej(r.error)}));
const reopen=async(page)=>{await page.reload();await expect(page.locator("#view")).not.toBeEmpty()};

test("eski kullanıcı: tek metin kayıt modül parçalarına taşınır, ilk oturumda eski metin yedek kalır, sonraki açılışta silinir, kayıp yok",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>Store.whenIdle());
  const meta=JSON.parse((await idbRec(page,"m:meta")).v);
  expect(meta.v).toBe(2);expect(meta.ids).toEqual(expect.arrayContaining(["ayar","kayit","salon","ilac","nabiz","koc"]));
  expect((await entriesOf(page)).map(e=>e.text)).toContain("Eski yemek");
  expect(await idbRec(page,"koc_v1")).not.toBeNull(); // ilk oturumda eski metin yedek
  await reopen(page);await page.evaluate(()=>Store.whenIdle());
  expect((await app.state()).entries).toHaveLength(2);
  expect(await idbRec(page,"koc_v1")).toBeNull();
  expect(await page.evaluate(()=>[localStorage.getItem("koc_v1"),Store.sharded])).toEqual([null,true]);
});
test("yalnız değişen parça yazılır: su eklenince kayıt parçası güncellenir, diğerleri aynı kalır",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});await reopen(page);
  const before={};for(const id of ["kayit/2026-10","salon","ilac","koc","ayar"])before[id]=(await idbRec(page,"m:"+id)).rev;
  await page.evaluate(()=>{add("su",250)});await page.evaluate(()=>Store.whenIdle());
  const ay=await page.evaluate(()=>dayKey().slice(0,7));expect((await idbRec(page,"m:kayit/"+ay)).rev).toBeGreaterThan(before["kayit/2026-10"]-1);if(ay!=="2026-10")expect((await idbRec(page,"m:kayit/2026-10")).rev).toBe(before["kayit/2026-10"]);
  for(const id of ["salon","ilac","koc"])expect((await idbRec(page,"m:"+id)).rev).toBe(before[id]);
  expect((await entriesOf(page)).some(e=>e.type==="su")).toBe(true);
  await reopen(page);expect((await app.state()).entries.map(e=>e.type).sort()).toEqual(["kilo","su","yemek"]);
});
test("parçalı düzende localStorage aynası yazılmaz; veri IndexedDB parçalarından gelir",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});await reopen(page);
  await page.evaluate(()=>{add("su",250)});await page.evaluate(()=>Store.whenIdle());
  expect(await page.evaluate(()=>localStorage.getItem("koc_v1"))).toBeNull();
  await reopen(page);expect((await app.state()).entries.map(e=>e.type).sort()).toEqual(["kilo","su","yemek"]);
});
test("bir parça okunamıyorsa kurtarma kipi: yazılmaz, diğer parçalar ve bozuk parça olduğu gibi kalır",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});await reopen(page);
  await page.evaluate(()=>new Promise(res=>{const r=indexedDB.open("neowell",1);r.onsuccess=()=>{const tx=r.result.transaction("kv","readwrite");tx.objectStore("kv").put({v:"{bozuk",rev:99},"m:kayit/2026-10");tx.oncomplete=res}}));
  await reopen(page);
  expect(await page.evaluate(()=>[!!recovery,save()])).toEqual([true,false]);
  expect((await idbRec(page,"m:kayit/2026-10")).v).toBe("{bozuk");
});
test("IndexedDB açılamazsa uygulama localStorage ile çalışır, kayıt kaybolmaz",async({app,page})=>{
  await page.addInitScript(()=>{indexedDB.open=()=>{throw new Error("kapalı")}});
  await seedOnce(page,SEED);await app.open({});
  expect(await page.evaluate(()=>Store.mode)).toBe("ls");
  await page.evaluate(()=>{add("su",300)});
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  expect((await app.state()).entries.map(e=>e.type).sort()).toEqual(["kilo","su","yemek"]);
});
test("Tüm verileri sil: IndexedDB ve aynadaki kayıt gider, yeniden açılışta eski veri geri gelmez",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>{add("su",250)});
  await page.evaluate(()=>{document.body.insertAdjacentHTML("beforeend",'<button id="x" data-act="sifirla"></button>');document.getElementById("x").click()});
  await expect(page.locator("#toast.on #tmsg")).toContainText("Tüm veriler silindi");
  await page.evaluate(()=>Store.whenIdle());
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  expect((await app.state()).entries).toEqual([]);
  expect(await entriesOf(page)).toEqual([]);expect(await idbRec(page,"koc_v1")).toBeNull();
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
  expect((await entriesOf(page)).filter(e=>e.type==="su")).toHaveLength(2);
});
