"use strict";
const {test,expect,state,day}=require("./fixtures");

const FILE=[`tarih;kilo`,`${day(-3)};82,4`,`${day(-2)};81,9`,`${day(0)};80`].join("\n");
const BP=[`tarih;saat;sistolik;diyastolik`,`${day(-3)};07:30;120;80`,`${day(-2)};07:30;400;80`].join("\n");

async function pick(app,page,text){
  await app.go("settings-data");
  const [fc]=await Promise.all([page.waitForEvent("filechooser"),page.click('[data-ci="open"]')]);
  await fc.setFiles({name:"olcum.csv",mimeType:"text/csv",buffer:Buffer.from(text)});
}

test.describe("Table import",()=>{
  test("preview, the user's own weight of the day wins, confirm adds, undo removes",async({app,page})=>{
    await app.open({seed:state({},{entries:[{id:1,day:day(0),time:"08:00",type:"weight",v:79,text:""}],nextId:2})});
    await pick(app,page,FILE);
    await expect(page.locator("body")).toContainText("Zaten kayıtlı, atlanacak: 1");
    await expect(page.locator("body")).toContainText("82,4 kg");
    await page.click('[data-ci="go"]');
    await expect(app.toast).toContainText("2 kayıt eklendi");
    const w=(await app.state()).entries.filter(e=>e.type==="weight");
    expect(w.map(e=>e.v).sort()).toEqual([79,81.9,82.4]);
    expect(new Set(w.map(e=>e.id)).size).toBe(3);
    await page.click("#tundo");
    expect((await app.state()).entries.filter(e=>e.type==="weight").map(e=>e.v)).toEqual([79]);
  });
  test("pressure rows: valid ones added, impossible ones listed with a reason; a second import adds nothing",async({app,page})=>{
    await app.open({seed:state({bpOn:true})});
    await pick(app,page,BP);
    await expect(page.locator("body")).toContainText("Okunamadı: 1");
    await expect(page.locator("body")).toContainText("3. satır");
    await page.click('[data-ci="go"]');
    await expect(app.toast).toContainText("1 kayıt eklendi");
    expect((await app.state()).vitals.map(r=>[r.sys,r.dia,r.time])).toEqual([[120,80,"07:30"]]);
    await pick(app,page,BP);
    await expect(page.locator('[data-ci="go"]')).toBeDisabled();
  });
  test("an unrecognised file is refused with an explanation and nothing changes",async({app,page})=>{
    await app.open({seed:state({})});
    await pick(app,page,"a,b\n1,2\n");
    await expect(page.locator("body")).toContainText("Bu dosyayı tanıyamadım");
    expect((await app.state()).entries.length).toBe(0);
  });
});
