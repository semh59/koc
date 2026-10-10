"use strict";
/* Store (IndexedDB module shards): migration, reopening, failure to open, a corrupt shard, deletion, write failure. With real Chromium IndexedDB. */
const {test,expect,state}=require("./fixtures");

const SEED=state({},{entries:[{id:1,day:"2026-10-05",time:"09:00",type:"weight",v:81.5,text:""},{id:2,day:"2026-10-06",time:"09:30",type:"food",v:600,text:"Eski yemek"}],nextId:3});
/* Writes the seed once per session so that a reload can also be tried with localStorage emptied. */
const seedOnce=(page,s)=>page.addInitScript(j=>{if(!sessionStorage.getItem("seeded")){localStorage.setItem("nw_state",j);sessionStorage.setItem("seeded","1")}},JSON.stringify(s));
const idbRec=(page,k)=>page.evaluate(k=>new Promise((res,rej)=>{const r=indexedDB.open("neowell",1);r.onsuccess=()=>{const q=r.result.transaction("kv").objectStore("kv").get(k);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)};r.onerror=()=>rej(r.error)}),k);
const shard=async(page,id)=>JSON.parse((await idbRec(page,"m:"+id)).v);
/* Entries live in one shard per month (m:log/<month>): collects them all. */
const entriesOf=page=>page.evaluate(()=>new Promise((res,rej)=>{const r=indexedDB.open("neowell",1);r.onsuccess=()=>{const st=r.result.transaction("kv").objectStore("kv"),q=st.getAll(IDBKeyRange.bound("m:log/","m:log/￿"));q.onsuccess=()=>res(q.result.flatMap(x=>JSON.parse(x.v).entries));q.onerror=()=>rej(q.error)};r.onerror=()=>rej(r.error)}));
const reopen=async(page)=>{await page.reload();await expect(page.locator("#view")).not.toBeEmpty()};

test("a state written in localStorage mode becomes shards on the first IndexedDB run; the localStorage text is deleted once they are durable, nothing is lost",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>Store.whenIdle());
  const meta=JSON.parse((await idbRec(page,"m:meta")).v);
  expect(meta.v).toBe(2);expect(meta.ids).toEqual(expect.arrayContaining(["settings","log","gym","meds","pulse","coach"]));
  expect((await entriesOf(page)).map(e=>e.text)).toContain("Eski yemek");
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem("nw_state"))).toBeNull();
  expect(await idbRec(page,"nw_state")).toBeNull();
  await reopen(page);await page.evaluate(()=>Store.whenIdle());
  expect((await app.state()).entries).toHaveLength(2);
  expect(await page.evaluate(()=>Store.sharded)).toBe(true);
});
test("only the changed shard is written: adding water updates the log shard, the others stay the same",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});await reopen(page);
  const before={};for(const id of ["log/2026-10","gym","meds","coach","settings"])before[id]=(await idbRec(page,"m:"+id)).rev;
  await page.evaluate(()=>{add("water",250)});await page.evaluate(()=>Store.whenIdle());
  const month=await page.evaluate(()=>dayKey().slice(0,7));expect((await idbRec(page,"m:log/"+month)).rev).toBeGreaterThan(before["log/2026-10"]-1);if(month!=="2026-10")expect((await idbRec(page,"m:log/2026-10")).rev).toBe(before["log/2026-10"]);
  for(const id of ["gym","meds","coach"])expect((await idbRec(page,"m:"+id)).rev).toBe(before[id]);
  expect((await entriesOf(page)).some(e=>e.type==="water")).toBe(true);
  await reopen(page);expect((await app.state()).entries.map(e=>e.type).sort()).toEqual(["food","water","weight"]);
});
test("in the sharded layout no localStorage mirror is written; data comes from the IndexedDB shards",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});await reopen(page);
  await page.evaluate(()=>{add("water",250)});await page.evaluate(()=>Store.whenIdle());
  expect(await page.evaluate(()=>localStorage.getItem("nw_state"))).toBeNull();
  await reopen(page);expect((await app.state()).entries.map(e=>e.type).sort()).toEqual(["food","water","weight"]);
});
test("an unreadable shard triggers recovery mode: nothing is written, the other shards and the corrupt one stay as they are",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});await reopen(page);
  await page.evaluate(()=>new Promise(res=>{const r=indexedDB.open("neowell",1);r.onsuccess=()=>{const tx=r.result.transaction("kv","readwrite");tx.objectStore("kv").put({v:"{corrupt",rev:99},"m:log/2026-10");tx.oncomplete=res}}));
  await reopen(page);
  expect(await page.evaluate(()=>[!!recovery,save()])).toEqual([true,false]);
  expect((await idbRec(page,"m:log/2026-10")).v).toBe("{corrupt");
});
test("if IndexedDB cannot open the app runs on localStorage and loses nothing",async({app,page})=>{
  await page.addInitScript(()=>{indexedDB.open=()=>{throw new Error("disabled")}});
  await seedOnce(page,SEED);await app.open({});
  expect(await page.evaluate(()=>Store.mode)).toBe("ls");
  await page.evaluate(()=>{add("water",300)});
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  expect((await app.state()).entries.map(e=>e.type).sort()).toEqual(["food","water","weight"]);
});
test("Delete all data: IndexedDB and the mirror are cleared, old data does not return after reopening",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>{add("water",250)});
  await page.evaluate(()=>{document.body.insertAdjacentHTML("beforeend",'<button id="x" data-act="reset"></button>');document.getElementById("x").click()});
  await expect(page.locator("#toast.on #tmsg")).toContainText("Tüm veriler silindi");
  await page.evaluate(()=>Store.whenIdle());
  await page.reload();await expect(page.locator("#view")).not.toBeEmpty();
  expect((await app.state()).entries).toEqual([]);
  expect(await entriesOf(page)).toEqual([]);expect(await idbRec(page,"nw_state")).toBeNull();
});
test("with the lock on a flag is written (lock screen before first paint)",async({app,page})=>{
  await seedOnce(page,state({lockOn:true},{entries:[]}));await app.open({});
  expect(await page.evaluate(()=>localStorage.getItem("nw_lockon"))).toBe("1");
});
test("if IndexedDB cannot write a lasting warning appears, the change stays in memory; the warning clears once writing works",async({app,page})=>{
  await seedOnce(page,SEED);await app.open({});
  await page.evaluate(()=>{window.__put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException("full","QuotaExceededError")}});
  await page.evaluate(()=>{add("water",250)});
  await expect(page.locator("#toast.on #tmsg")).toContainText("kaydedilemedi");
  expect(await page.evaluate(()=>S.entries.some(e=>e.type==="water"))).toBe(true);
  await page.evaluate(()=>{IDBObjectStore.prototype.put=window.__put;add("water",100)});
  await page.evaluate(()=>Store.whenIdle());
  expect(await page.evaluate(()=>Store.failed)).toBe(false);
  expect((await entriesOf(page)).filter(e=>e.type==="water")).toHaveLength(2);
});
