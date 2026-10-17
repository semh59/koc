"use strict";
/* Medication alarm diagnostics: the alarm log page in Settings > Modules and the real dose test (fake MedWake and LocalNotifications). */
const {test,expect,NOW,state,day,medPlugins:plugins}=require("./fixtures");

const T=NOW.getTime();
const LOG={sdk:35,state:{t:T,a:"NOW",kl:false,ia:true,ne:true,fsi:true,ci:2,mi:4,bo:false,ex:true},
  items:[{t:T-7200000,a:"APP",in:2,n:2,nx:[T-3600000,T+3600000]},{t:T-3597000,a:"WAKE",p:T-3600000,kl:true,ia:false,wl:true,fs:"ok",ne:true,fsi:true,ci:2,mi:4,bo:false,ex:true}]};

test("alarm log: likely problems open the relevant setting, rows are in Turkish, copied and cleared",async({app,page})=>{
  await page.addInitScript(plugins,LOG);
  await app.open({seed:state({medOn:true}),native:{}});
  await app.go("settings-modules");
  await page.locator("summary",{hasText:"Bildirim sorun giderme"}).click();
  await page.getByRole("button",{name:"Alarm kayıtları"}).click();
  await expect(app.sheet).toContainText("Ekran uyandırma kanalı düşük önemde");
  await expect(app.sheet).toContainText("Pil kısıtlaması var");
  await expect(app.sheet).toContainText("alarm çaldı (planlanan 09:00:00, +3 sn), ekran kilitli, ekran kapalıydı, tam ekran bildirimi gönderildi");
  await expect(app.sheet).toContainText("uygulama alarmları kurdu: 2 alarm");
  await app.sheet.locator('[data-md="wset:channel:"]').click();
  await app.sheet.locator('[data-md="wset:battery:"]').click();
  const calls=await page.evaluate(()=>window.__calls.filter(c=>c[0]==="MedWake.settings").map(c=>c[1].to));
  expect(calls).toEqual(["channel","battery"]);
  await app.sheet.getByRole("button",{name:"Kopyala"}).click();
  await expect(app.toast).toContainText(/panoya kopyalandı|Kopyalanamadı/);
  await app.sheet.getByRole("button",{name:"Kayıtları temizle"}).click();
  await expect.poll(()=>page.evaluate(()=>window.__calls.some(c=>c[0]==="MedWake.clearLog"))).toBe(true);
});

test("medication doses are passed to the screen alarm (repeats excluded)",async({app,page})=>{
  await page.addInitScript(plugins,LOG);
  await app.open({seed:state({medOn:true},{meds:[{id:1,n:"A",t:["14:00"],on:true}]}),native:{}});
  await expect.poll(()=>page.evaluate(()=>(window.__calls.find(c=>c[0]==="MedWake.set")||[,{times:[]}])[1].times)).toHaveLength(30);
  const t=await page.evaluate(()=>window.__calls.find(c=>c[0]==="MedWake.set")[1].times);
  expect(t.every(x=>new Date(x).getMinutes()===0)).toBe(true);
});

test("real dose test: the 7149 notification on the medication channel and the screen alarm are set for the same time",async({app,page})=>{
  await page.addInitScript(plugins,LOG);
  await app.open({seed:state({medOn:true}),native:{}});
  await app.go("settings-modules");
  await page.locator("summary",{hasText:"Bildirim sorun giderme"}).click();
  await page.getByRole("button",{name:"Gerçek doz testi (1 dk)"}).click();
  await expect(app.toast).toContainText("telefonu kilitle");
  const c=await page.evaluate(()=>({n:window.__calls.filter(c=>c[0]==="LN.schedule").map(c=>c[1].notifications).flat().find(n=>n.id===7149),w:window.__calls.find(c=>c[0]==="MedWake.test")[1]}));
  expect(c.n.channelId).toBe("nw_medp");
  expect(c.n.actionTypeId).toBeUndefined();
  expect(c.n.body).toBe("Test");
  expect(new Date(c.n.schedule.at).getTime()).toBe(c.w.at);
  expect(c.w.at-T).toBeGreaterThanOrEqual(60000);
});

test("double-dose guard: a different slot taken 20 minutes ago asks first; No keeps the dose unmarked, Yes records it once",async({app,page})=>{
  const {day}=require("./fixtures");
  const seed=state({medOn:true},{meds:[{id:1,n:"Metformin",t:["07:00","12:00"],on:true,k:10}],medLog:[{id:1,m:1,day:day(0),slot:"07:00",st:"t",at:"09:40"}]});
  await app.open({seed,native:{}});
  app.onDialog=d=>d.dismiss();
  await page.evaluate("medMark(1,'12:00','t')");
  await expect.poll(()=>app.dialogs.length).toBe(1);
  expect(app.dialogs[0]).toContain("20 dakika önce");
  expect((await app.state()).medLog.length).toBe(1);
  app.onDialog=null;
  await page.evaluate("medMark(1,'12:00','t')");
  await expect.poll(async()=>(await app.state()).medLog.length).toBe(2);
  expect((await app.state()).meds[0].k).toBe(9);
});

test("blood pressure label: the dose-since line appears only after the medication is marked as a pressure medicine",async({app,page})=>{
  const seed=state({medOn:true,bpOn:true},{meds:[{id:1,n:"Amlodipin",t:["07:00"],on:true}],medLog:[{id:1,m:1,day:day(0),slot:"07:00",st:"t",at:"07:10"}],vitals:[{id:1,k:"t",day:day(0),time:"09:30",sys:128,dia:82,session:"morning"}]});
  await app.open({seed});await app.go("bp");
  await expect(app.view).toContainText("128/82");
  await expect(app.view).not.toContainText("Son ilaç kaydından");
  await app.go("meds");await page.locator('[data-md="edit:1"]').click();
  await page.locator("summary",{hasText:"Daha fazla seçenek"}).click();
  await page.locator('label:has(#mbp), #mbp').first().click({force:true});await page.locator('[data-md="save"]').click();
  expect((await app.state()).meds[0].bp).toBe(true);
  await app.go("bp");
  await expect(app.view).toContainText("Son ilaç kaydından 2 sa 20 dk sonra");
});
