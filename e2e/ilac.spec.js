"use strict";
/* İlaç alarmı tanısı: Ayarlar > Modüller'de alarm kayıtları sayfası ve gerçek doz testi (sahte MedWake ve LocalNotifications). */
const {test,expect,NOW,state}=require("./fixtures");

/* Sahte Capacitor kurulurken MedWake ve LocalNotifications eklenir; çağrılar window.__calls'a düşer. */
function plugins(cfg){
  window.__calls=[];
  const rec=(p,defs)=>new Proxy({},{get:(_,k)=>k==="then"?undefined:k==="addListener"?()=>({remove(){}}):async a=>{window.__calls.push([p+"."+k,a]);return defs[k]||{}}});
  let C;
  Object.defineProperty(window,"Capacitor",{configurable:true,get:()=>C,set:v=>{C=v;
    v.Plugins.MedWake=rec("MedWake",{fsi:{allowed:true},log:cfg});
    v.Plugins.LocalNotifications=rec("LN",{checkPermissions:{display:"granted"},getPending:{notifications:[]},getDeliveredNotifications:{notifications:[]},checkExactNotificationSetting:{exact_alarm:"granted"}});
  }});
}
const T=NOW.getTime();
const LOG={sdk:35,state:{t:T,a:"NOW",kl:false,ia:true,ne:true,fsi:true,ci:2,mi:4,bo:false,ex:true},
  items:[{t:T-7200000,a:"APP",in:2,n:2,nx:[T-3600000,T+3600000]},{t:T-3597000,a:"WAKE",p:T-3600000,kl:true,ia:false,wl:true,fs:"ok",ne:true,fsi:true,ci:2,mi:4,bo:false,ex:true}]};

test("alarm kayıtları: olası sorunlar ilgili ayarı açar, satırlar Türkçe, kopyalanır, temizlenir",async({app,page})=>{
  await page.addInitScript(plugins,LOG);
  await app.open({seed:state({medOn:true}),native:{}});
  await app.go("ayar-modul");
  await page.locator("summary",{hasText:"Bildirim sorun giderme"}).click();
  await page.getByRole("button",{name:"Alarm kayıtları"}).click();
  await expect(app.sheet).toContainText("Ekran uyandırma kanalı düşük önemde");
  await expect(app.sheet).toContainText("Pil kısıtı var");
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

test("ilaç dozları ekran alarmına iletilir (tekrarlar hariç)",async({app,page})=>{
  await page.addInitScript(plugins,LOG);
  await app.open({seed:state({medOn:true},{meds:[{id:1,n:"A",t:["14:00"],on:true}]}),native:{}});
  await expect.poll(()=>page.evaluate(()=>(window.__calls.find(c=>c[0]==="MedWake.set")||[,{times:[]}])[1].times)).toHaveLength(30);
  const t=await page.evaluate(()=>window.__calls.find(c=>c[0]==="MedWake.set")[1].times);
  expect(t.every(x=>new Date(x).getMinutes()===0)).toBe(true);
});

test("gerçek doz testi: ilaç kanalında 7149 bildirimi ve ekran alarmı aynı zamana kurulur",async({app,page})=>{
  await page.addInitScript(plugins,LOG);
  await app.open({seed:state({medOn:true}),native:{}});
  await app.go("ayar-modul");
  await page.locator("summary",{hasText:"Bildirim sorun giderme"}).click();
  await page.getByRole("button",{name:"Gerçek doz testi (1 dk)"}).click();
  await expect(app.toast).toContainText("telefonu kilitle");
  const c=await page.evaluate(()=>({n:window.__calls.filter(c=>c[0]==="LN.schedule").map(c=>c[1].notifications).flat().find(n=>n.id===7149),w:window.__calls.find(c=>c[0]==="MedWake.test")[1]}));
  expect(c.n.channelId).toBe("nw_med");
  expect(c.n.actionTypeId).toBeUndefined();
  expect(c.n.body).toBe("Test");
  expect(new Date(c.n.schedule.at).getTime()).toBe(c.w.at);
  expect(c.w.at-T).toBeGreaterThanOrEqual(60000);
});
