"use strict";
const {test,expect,state,entry}=require("./fixtures");

test.describe("Birimler",()=>{
  test("lb ve mmol/L seçilir; giriş ve gösterim dönüşür, depolama kg ve mg/dL kalır",async({app,page})=>{
    await app.open({seed:state({bsOn:true},{entries:[entry("weight",84.1,"",{d:-1})]})});
    await app.go("settings-profile");
    await page.click('[data-wun="lb"]');await page.click('[data-gun="mmol"]');
    const st=await app.state();expect(st.settings.wUnit).toBe("lb");expect(st.settings.gUnit).toBe("mmol");
    await expect(page.locator("label[for=goalKg]")).toContainText("lb");
    await expect(page.locator("#goalKg")).toHaveValue("172");
    await page.fill("#goalKg","1");await page.locator("#goalKg").blur();
    await expect(app.toast).toContainText("lb arasında olmalı");
    await page.fill("#goalKg","165");await page.locator("#goalKg").blur();
    expect((await app.state()).settings.goalKg).toBe(74.843);
    await app.tab("today");
    await expect(app.view).toContainText("185,4");
    await page.click('[data-act="weight"]');
    await page.fill("#fv","190");await page.click('[data-go="weight"]');
    await expect(app.toast).toContainText("190,0 lb kaydedildi");
    expect((await app.state()).entries.filter(e=>e.type==="weight").pop().v).toBe(86.183);
    await app.go("glucose");
    await page.click('[data-vt="addbs"]');
    await expect(page.locator("#sheet")).toContainText("Şeker (mmol/L)");
    await page.fill("#gv","5,3");await page.click('[data-vt="savebs"]');
    await expect(app.toast).toContainText("5,3 mmol/L");
    expect((await app.state()).vitals.at(-1).g).toBe(95.5);
    await expect(app.view).toContainText("5,3");
    await app.go("settings-profile");
    await page.click('[data-wun="kg"]');await page.click('[data-gun="mgdl"]');
    await app.go("glucose");
    await expect(app.view).toContainText("95,5");
    expect((await app.state()).settings.wUnit).toBeUndefined();
  });
});

test.describe("İçecek türü",()=>{
  test("çay eklenir, su hedefine sayılmaz, geçmişte türüyle görünür; hızlı +250 su kalır",async({app,page})=>{
    await app.open({seed:state()});
    await page.click('[data-act="water"]');
    await page.click('[data-dk="open"]');
    await page.click('[data-dr="tea"]');await page.fill("#fv","200");await page.click('[data-dk="go"]');
    await expect(app.toast).toContainText("Çay 200 ml kaydedildi, su hedefine sayılmaz");
    const water=(await app.state()).entries.filter(e=>e.type==="water");
    expect(water.map(e=>[e.v,e.dr])).toEqual([[250,undefined],[200,"tea"]]);
    await page.locator('[data-suall="1"]').first().click();
    await expect(page.locator("#sheet")).toContainText("200 ml · Çay");
  });
});

test.describe("Kardiyo",()=>{
  test("koşu kaydı: tempo, kcal, haftalık özet; hatalı hız reddedilir; çift kayıt uyarısı; silme ve Geri al",async({app,page})=>{
    await app.open({seed:state({},{entries:[entry("weight",80)]})});
    await app.tab("trend");
    await page.click('[data-tsec="motion"]');await page.click('[data-ckg="open"]');
    await page.fill("#fv","30");await page.fill("#ckm","20");await page.click('[data-ckg="go"]');
    await expect(page.locator("#cerr")).toContainText("olağan dışı");
    await page.fill("#ckm","5");await page.fill("#cnote","sabah koşusu");await page.fill("#ctm","09:30");await page.click('[data-ckg="go"]');
    await expect(app.toast).toContainText("Koşu 30 dk kaydedildi, 5 km, 6:00 dk/km, ~");
    const e=(await app.state()).entries.find(x=>x.ck==="run");
    expect(e).toMatchObject({type:"exercise",v:30,km:5,text:"Koşu",cn:"sabah koşusu",time:"09:30"});
    expect(e.kcal).toBeGreaterThan(100);
    await expect(app.view).toContainText("Son 7 gün");
    await expect(app.view).toContainText("6:00 dk/km");
    await expect(app.view).toContainText("sabah koşusu");
    app.onDialog=d=>d.dismiss();
    await page.click('[data-ckg="open"]');await page.fill("#fv","20");await page.click('[data-ckg="go"]');
    expect(app.dialogs.at(-1)).toContain("iki kez sayılır");
    expect((await app.state()).entries.filter(x=>x.ck==="run").length).toBe(1);
    await app.closeSheet();
    await page.locator("[data-ckd]").first().click();
    expect((await app.state()).entries.filter(x=>x.ck==="run").length).toBe(0);
    await page.click("#tundo");
    expect((await app.state()).entries.filter(x=>x.ck==="run").length).toBe(1);
  });
});

/* 2000x1000 PNG üretir (sayfada çizilir). */
const png=page=>page.evaluate(()=>{const c=document.createElement("canvas");c.width=2000;c.height=1000;const x=c.getContext("2d");x.fillStyle="#08c";x.fillRect(0,0,2000,1000);return c.toDataURL("image/png").split(",")[1]});

test.describe("İlerleme fotoğrafı",()=>{
  test("ekle (900 px JPEG), etiket, karşılaştır, sil (onay), yedeğe girmez, gizlilikten silinir",async({app,page})=>{
    await app.open({seed:state({},{entries:[entry("weight",84.3)]})});
    await app.tab("trend");
    await expect(app.view).toContainText("İlerleme fotoğrafları");
    await expect(app.view).toContainText("yedeğe girmez");
    const add=async()=>{
      await page.click('[data-ph="add"]');
      await page.setInputFiles('input[data-phf]',{name:"a.png",mimeType:"image/png",buffer:Buffer.from(await png(page),"base64")});
    };
    await add();
    await expect(app.toast).toHaveText("Fotoğraf eklendi");
    await page.click('[data-ph="add"]');await page.fill("#phkg","999");
    await page.setInputFiles('input[data-phf]',{name:"a.png",mimeType:"image/png",buffer:Buffer.from(await png(page),"base64")});
    await expect(page.locator("#pherr")).toContainText("arası olmalı");
    await page.fill("#phkg","");
    await page.setInputFiles('input[data-phf]',{name:"b.png",mimeType:"image/png",buffer:Buffer.from(await png(page),"base64")});
    await expect(page.locator('[data-ph^="view:"]')).toHaveCount(2);
    const dim=await page.evaluate(async()=>{const u=await phUrl(phList[0].id),i=new Image();i.src=u;await i.decode();return [i.naturalWidth,i.naturalHeight,phList[0].kg,phList[1].kg]});
    expect(dim).toEqual([900,450,84.3,null]);
    // koç/yedek/localStorage'a girmez
    const ls=await page.evaluate(()=>JSON.stringify(localStorage));
    expect(ls).not.toContain("data:image");expect(ls).not.toContain("thumb");
    // karşılaştır
    await page.click('[data-ph="cmp"]');
    await expect(page.locator("#phgap")).toContainText("gün arayla");
    await app.closeSheet();
    // sil: onay reddedilirse kalır, kabul edilirse gider
    await page.locator('[data-ph^="view:"]').first().click();
    app.onDialog=d=>d.dismiss();
    await page.click('[data-ph^="del:"]');
    expect(app.dialogs.at(-1)).toContain("geri alınamaz");
    expect(await page.evaluate(()=>phList.length)).toBe(2);
    app.onDialog=d=>d.accept();
    await page.click('[data-ph^="del:"]');
    await expect(app.toast).toHaveText("Fotoğraf silindi");
    expect(await page.evaluate(()=>phList.length)).toBe(1);
    // yeniden yüklemede kalıcı
    await page.reload();
    await expect(page.locator("#view")).not.toBeEmpty();
    await app.tab("trend");
    await expect(page.locator('[data-ph^="view:"]')).toHaveCount(1);
    // gizlilikten sil
    await app.go("settings-data");await page.click('[data-pv="open"]');
    await page.locator('[aria-label="İlerleme fotoğrafları sil"]').click();
    await expect(app.toast).toContainText("İlerleme fotoğrafları silindi");
    expect(await page.evaluate(async()=>{const db=await phDb();return phReq(db.transaction("m").objectStore("m").count())})).toBe(0);
  });

  test("en çok 24 fotoğraf; Tüm verileri sil fotoğrafları da siler",async({app,page})=>{
    await app.open({seed:state()});
    await app.tab("trend");
    await page.evaluate(async()=>{for(let i=0;i<24;i++)await phPut({id:"x"+i,day:"2026-10-0"+(1+i%6),t:i,kg:null,thumb:"data:image/gif;base64,R0lGODlhAQABAAAAACw="},new Blob(["a"]));await phLoad()});
    await expect(page.locator('[data-ph^="view:"]')).toHaveCount(24);
    await expect(page.locator('[data-ph="add"]')).toBeDisabled();
    await expect(page.locator('[data-ph="add"]')).toContainText("24/24");
    expect(await page.evaluate(()=>{sheetPhoto();return document.querySelector("#sheet.on")===null})).toBe(true);
    await app.go("settings-data");
    await page.click('[data-act="reset"]');
    await expect(app.toast).toHaveText("Tüm veriler silindi");
    await expect.poll(()=>page.evaluate(async()=>{const db=await phDb();return phReq(db.transaction("f").objectStore("f").count())})).toBe(0);
    expect(await page.evaluate(()=>phList.length)).toBe(0);
  });

  test("Android ekran görüntüsü kilidi: fotoğraf varken Trend'de açılır, başka sekmede kalkar",async({app,page})=>{
    await app.open({seed:state(),native:{}});
    await page.evaluate(()=>{window.__sec=[];window.Capacitor.Plugins.DeviceHelp={secure:async o=>{window.__sec.push(o.on)}}});
    await app.tab("trend");
    await page.evaluate(async()=>{await phPut({id:"s1",day:"2026-10-01",t:1,kg:null,thumb:"data:image/gif;base64,R0lGODlhAQABAAAAACw="},new Blob(["a"]));await phLoad()});
    await expect.poll(()=>page.evaluate(()=>window.__sec)).toEqual([true]);
    await app.tab("today");
    await expect.poll(()=>page.evaluate(()=>window.__sec)).toEqual([true,false]);
  });
});
