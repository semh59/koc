"use strict";
const {test,expect,state,day}=require("./fixtures");

const fill=async(page,pairs)=>{for(const [id,v] of pairs)await page.fill("#"+id,String(v))};
const bp=async(page,pairs,time="09:30")=>{
  await page.click('[data-vt="addbp"]');
  await fill(page,[...pairs,["vtime",time]]);
  await page.click('[data-vt="savebp"]');
};

test.describe("Tahlil",()=>{
  test("değer ekle, aralık dışı işareti, geçersiz giriş ve silme (Geri al dahil)",async({app,page})=>{
    await app.open({seed:state()});
    await app.go("tahlil");
    await expect(app.view).toContainText("Henüz tahlil sonucu yok");
    const addLab=async(n,v,u,lo,hi,date)=>{
      await page.click('[data-lab="add"]');
      if(date)await page.fill("#ld",date);
      await fill(page,[["ln0",n],["lv0",v],["lu0",u],["ll0",lo],["lh0",hi]]);
      await page.click('[data-lab="save"]');
    };
    // geçersiz: ad var, değer sayı değil
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
    // aynı gün aynı değer ikinci kez eklenmez
    await addLab("Demir","20","µg/dL","50","170");
    await expect(app.toast).toContainText("zaten kayıtlıydı");
    expect((await app.state()).labs.length).toBe(3);

    // ayrıntı: iki sonuç, yalnız yüksek olanda işaret; yüksek olan silinince kart önceki (aralık içi) değeri gösterir
    await g.locator(".labo").click();
    const rows=page.locator("#sheet .row");
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

test.describe("Tansiyon ve şeker",()=>{
  test("tansiyon: ölçüm ekle, aynı dakikada iki ölçüm iki kayıt kalır (yeniden açılışta da), özet ve silme",async({app,page})=>{
    await app.open({seed:state({bpOn:true})});
    await app.go("tansiyon");
    await expect(app.view).toContainText("Henüz ölçüm yok");
    await bp(page,[["bs1",120],["bd1",80],["bn1",70]]);
    await expect(app.toast).toHaveText("Kaydedildi: 120/80");
    await bp(page,[["bs1",120],["bd1",80],["bn1",70]]);
    const rows=page.locator('#view .row:has([data-vt^="del:"])');
    await expect(rows).toHaveCount(2);
    const v=(await app.state()).vitals;
    expect(v.map(r=>[r.sys,r.dia,r.nabiz,r.day,r.time])).toEqual([[120,80,70,day(0),"09:30"],[120,80,70,day(0),"09:30"]]);
    expect(new Set(v.map(r=>r.sid)).size).toBe(2);
    await expect(app.view).toContainText("2 ölçüm, 1 gün");
    await page.reload();await app.go("tansiyon");
    expect((await app.state()).vitals.length).toBe(2);
    await expect(rows).toHaveCount(2);

    // iki ölçümlü seans tek satır, ortalaması alınır; özet tüm ham ölçümlerden
    await bp(page,[["bs1",130],["bd1",84],["bs2",134],["bd2",86]],"20:00");
    await expect(app.toast).toHaveText("Kaydedildi: 132/85 (ortalama)");
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText("132/85");await expect(rows.first()).toContainText("2 ölçüm");
    await expect(app.view).toContainText("4 ölçüm, 1 gün");
    await expect(app.view).toContainText("126/83"); // sistolik (120+120+130+134)/4, diyastolik (80+80+84+86)/4=82,5

    // geçersiz giriş kaydedilmez
    await page.click('[data-vt="addbp"]');await fill(page,[["bs1",80],["bd1",90]]);await page.click('[data-vt="savebp"]');
    await expect(app.toast).toContainText("Sistolik (büyük tansiyon) diyastolikten büyük olmalı");
    await app.closeSheet();
    expect((await app.state()).vitals.length).toBe(4);

    // silme: seansın tüm ham ölçümleri gider, Geri al döndürür
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
  test("şeker: aynı dakikada aynı değer iki kayıt kalır, yeniden açılışta birleşmez",async({app,page})=>{
    await app.open({seed:state({bsOn:true})});
    await app.go("seker");
    for(let i=0;i<2;i++){
      await page.click('[data-vt="addbs"]');await fill(page,[["gv",100],["vtime","08:00"]]);await page.click('[data-vt="savebs"]');
      await expect(app.toast).toContainText("Kaydedildi: 100 mg/dL");
    }
    await page.reload();await app.go("seker");
    const v=(await app.state()).vitals;
    expect(v.map(r=>[r.g,r.time])).toEqual([[100,"08:00"],[100,"08:00"]]);
    expect(new Set(v.map(r=>r.sid)).size).toBe(2);
    await expect(page.locator('#view [data-vt^="del:"]')).toHaveCount(2);
  });
});
