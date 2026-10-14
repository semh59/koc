"use strict";
const {test,expect,state,day}=require("./fixtures");

const fill=async(page,pairs)=>{for(const [id,v] of pairs)await page.fill("#"+id,String(v))};
const bp=async(page,pairs,time="09:30")=>{
  await page.click('[data-vt="addbp"]');
  await fill(page,[...pairs,["vtime",time]]);
  await page.click('[data-vt="savebp"]');
};

test.describe("Lab results",()=>{
  test("add a value, out-of-range flag, invalid input and deletion (Undo included)",async({app,page})=>{
    await app.open({seed:state()});
    await app.go("labs");
    await expect(app.view).toContainText("Henüz tahlil sonucu yok");
    const addLab=async(n,v,u,lo,hi,date)=>{
      await page.click('[data-lab="add"]');
      if(date)await page.fill("#ld",date);
      await fill(page,[["ln0",n],["lv0",v],["lu0",u],["ll0",lo],["lh0",hi]]);
      await page.click('[data-lab="save"]');
    };
    // invalid: name present, value not a number
    await page.click('[data-lab="add"]');
    await fill(page,[["ln0","Glukoz"],["lv0","abc"]]);
    await page.click('[data-lab="save"]');
    await expect(app.toast).toContainText("1 satırda ad ya da değer okunamadı");
    expect((await app.state()).labs||[]).toEqual([]);
    await app.closeSheet();

    await addLab("Glukoz","90","mg/dL","70","100","2026-10-01");
    await expect(app.toast).toHaveText("1 sonuç kaydedildi");
    await addLab("Glukoz","130","mg/dL","70","100");
    await addLab("Demir","20","µg/dL","50","170");
    const g=page.locator(".labc",{hasText:"Glukoz"}),d=page.locator(".labc",{hasText:"Demir"});
    await expect(g).toContainText("130");await expect(g).toContainText("▲ Raporda yazan aralığın üstünde");await expect(g).toContainText("Rapor aralığı: 70");
    await expect(d).toContainText("▼ Raporda yazan aralığın altında");
    // the same value on the same day is not added twice
    await addLab("Demir","20","µg/dL","50","170");
    await expect(app.toast).toContainText("zaten kayıtlıydı");
    expect((await app.state()).labs.length).toBe(3);

    // detail: two results, only the high one flagged; after deleting the high one the card shows the earlier (in-range) value
    await g.locator(".labo").click();
    const rows=page.locator("#sheet .prow");
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText("▲");await expect(rows.last()).not.toContainText("▲");
    await rows.first().locator('[data-lab^="del:"]').click();
    await expect(app.toast).toHaveText("Sonuç silindi");
    expect((await app.state()).labs.map(l=>l.v).sort((a,b)=>a-b)).toEqual([20,90]);
    await expect(g).toContainText("90");await expect(g).not.toContainText("▲");
    await page.click("#tundo");
    expect((await app.state()).labs.length).toBe(3);
    await expect(g).toContainText("130");

    await app.closeSheet();
    await page.click('[data-lab="delall"]');
    await expect(app.view).toContainText("Henüz tahlil sonucu yok");
    expect((await app.state()).labs).toEqual([]);
  });
});

test.describe("Blood pressure and glucose",()=>{
  test("blood pressure: add readings, two readings in the same minute stay two records (also after reopening), summary and deletion",async({app,page})=>{
    await app.open({seed:state({bpOn:true})});
    await app.go("bp");
    await expect(app.view).toContainText("Henüz ölçüm yok");
    await bp(page,[["bs1",120],["bd1",80],["bn1",70]]);
    await expect(app.toast).toHaveText("Kaydedildi: 120/80");
    await bp(page,[["bs1",120],["bd1",80],["bn1",70]]);
    const rows=page.locator('#view .prow:has([data-vt^="del:"])');
    await expect(rows).toHaveCount(2);
    const v=(await app.state()).vitals;
    expect(v.map(r=>[r.sys,r.dia,r.pulse,r.day,r.time])).toEqual([[120,80,70,day(0),"09:30"],[120,80,70,day(0),"09:30"]]);
    expect(new Set(v.map(r=>r.sid)).size).toBe(2);
    await expect(app.view).toContainText("2 ölçüm, 1 gün");
    await page.reload();await app.go("bp");
    expect((await app.state()).vitals.length).toBe(2);
    await expect(rows).toHaveCount(2);

    // a two-reading session is one row and averaged; the summary uses all raw readings
    await bp(page,[["bs1",130],["bd1",84],["bs2",134],["bd2",86]],"20:00");
    await expect(app.toast).toHaveText("Kaydedildi: 132/85 (ortalama)");
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText("132/85");await expect(rows.first()).toContainText("2 ölçüm");
    await expect(app.view).toContainText("4 ölçüm, 1 gün");
    await expect(app.view).toContainText("126/83"); // systolic (120+120+130+134)/4, diastolic (80+80+84+86)/4=82.5

    // invalid input is not saved
    await page.click('[data-vt="addbp"]');await fill(page,[["bs1",80],["bd1",90]]);await page.click('[data-vt="savebp"]');
    await expect(app.toast).toContainText("Sistolik (büyük tansiyon) diyastolikten büyük olmalı");
    await app.closeSheet();
    expect((await app.state()).vitals.length).toBe(4);

    // deletion: all raw readings of the session go, Undo restores them
    await rows.first().locator('[data-vt^="del:"]').click();
    await expect(rows).toHaveCount(2);
    expect((await app.state()).vitals.length).toBe(2);
    await page.click("#tundo");
    await expect(rows).toHaveCount(3);
    await rows.first().locator('[data-vt^="del:"]').click();
    await rows.first().locator('[data-vt^="del:"]').click();
    await rows.first().locator('[data-vt^="del:"]').click();
    await expect(app.view).toContainText("Bu dönemde ölçüm yok");
    expect((await app.state()).vitals).toEqual([]);
  });
  test("glucose: the same value in the same minute stays two records and does not merge on reopening",async({app,page})=>{
    await app.open({seed:state({bsOn:true})});
    await app.go("glucose");
    for(let i=0;i<2;i++){
      await page.click('[data-vt="addbs"]');await fill(page,[["gv",100],["vtime","08:00"]]);await page.click('[data-vt="savebs"]');
      await expect(app.toast).toContainText("Kaydedildi: 100 mg/dL");
    }
    await page.reload();await app.go("glucose");
    const v=(await app.state()).vitals;
    expect(v.map(r=>[r.g,r.time])).toEqual([[100,"08:00"],[100,"08:00"]]);
    expect(new Set(v.map(r=>r.sid)).size).toBe(2);
    await expect(page.locator('#view [data-vt^="del:"]')).toHaveCount(2);
  });
});
