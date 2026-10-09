"use strict";
/* Ortak fikstürler: sabit saat, temiz profil + isteğe bağlı tohum veri, sahte Capacitor, dış ağ kapalı, konsol hatası = test hatası. */
const base=require("@playwright/test");
const {startFake}=require("./fake-provider");
const {expect}=base;
/* Salı 10:00 İstanbul. Günlük kayıtların, öğün varsayılanının (kahvaltı) ve haftalık hesapların dayanağı. */
const NOW=new Date("2026-10-06T10:00:00+03:00");
const day=n=>{const d=new Date(NOW.getTime()+n*864e5);return d.toLocaleDateString("sv-SE",{timeZone:"Europe/Istanbul"})};
/* Onboarding'i geçmiş yetişkin kullanıcı. */
const PROFILE={obDone:true,heightCm:178,age:35,sex:"m",act:1,goalKg:78,kcal:2200,stepsAsked:true};
const state=(settings={},rest={})=>({settings:{...PROFILE,...settings},entries:[],...rest});
const entry=(type,v,text="",o={})=>({day:day(o.d||0),time:o.time||"09:00",type,v,text,...o.x});

const test=base.test.extend({
  errs:[async({page},use)=>{
    const list=[],allow=[];
    page.on("pageerror",e=>list.push("pageerror: "+e.message));
    page.on("console",m=>{if(m.type()==="error")list.push("console.error: "+m.text())});
    await use({list,allow:re=>allow.push(re)});
    expect(list.filter(t=>!allow.some(re=>re.test(t))),"konsol hatası ya da yakalanmamış istisna").toEqual([]);
  },{auto:true}],
  /* Dış ağ kapalı: yalnız yerel sunucu. Sağlayıcı ve Open Food Facts yolları testte ayrıca yönlendirilir (sonraki route önce eşleşir). */
  context:async({context},use)=>{
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort("internetdisconnected"));
    await use(context);
  },
  fake:async({context},use)=>{const f=await startFake();await f.attach(context);await use(f);await f.close()},
  app:async({page},use)=>{
    const app={
      page,
      /* seed: localStorage'a yazılacak durum (yalnız boşsa, yeniden yüklemede korunur); native: Capacitor eklentileri sahte. */
      /* dialogs: uygulamanın onay penceresi (confirmSheet) tarayıcı confirm()'üne yönlenir; mesaj app.dialogs'a düşer, onDialog yanıtlar.
         dialogs:false gerçek onay penceresini açar. */
      async open({seed,keys,native,time=NOW,dialogs=true}={}){
        await page.clock.install({time});
        if(dialogs)await page.addInitScript(()=>{window.__confirmAuto=m=>window.confirm(m)});
        await page.addInitScript(([s,k])=>{try{if(s&&localStorage.getItem("koc_v1")==null)localStorage.setItem("koc_v1",JSON.stringify(s));if(k&&localStorage.getItem("koc_keys")==null)localStorage.setItem("koc_keys",JSON.stringify(k))}catch(e){}},[seed||null,keys||null]);
        if(native)await page.addInitScript(nativeShim,native);
        if(dialogs)page.on("dialog",d=>{app.dialogs.push(d.message());(app.onDialog?app.onDialog(d):d.accept()).catch(()=>{})});
        await page.goto("/index.html");
        await expect(page.locator("#view")).not.toBeEmpty();
        return app;
      },
      dialogs:[],onDialog:null,
      view:page.locator("#view"),sheet:page.locator("#sheet.on"),toast:page.locator("#toast.on #tmsg"),
      async tab(name){await page.locator(`nav button[data-tab="${name}"]`).click()},
      async go(t){await page.evaluate(t=>{const b=document.createElement("button");b.dataset.tab=t;document.body.append(b);b.click();b.remove()},t)},
      state:()=>page.evaluate(async()=>{await Store.whenIdle();return JSON.parse(Store.get("koc_v1"))}), // asıl depo IndexedDB: bekleyen yazım bitince okunur
      async closeSheet(){await page.keyboard.press("Escape");await expect(page.locator("#sheet")).not.toHaveClass(/\bon\b/)}
    };
    await use(app);
  }
});
/* Sahte Capacitor: isNativePlatform ve verilen eklentiler. Yalnız barkod gibi telefona özgü giriş yolunu tarayıcıda sürmek için. */
function nativeShim(cfg){
  const P={};
  if(cfg.barcode)P.BarcodeScanner={isGoogleBarcodeScannerModuleAvailable:async()=>({available:true}),scan:async()=>({barcodes:[{rawValue:cfg.barcode}]})};
  if(cfg.steps!=null)P.StepCounter={isAvailable:async()=>({available:true}),requestAccess:async()=>({granted:true}),start:async()=>({}),read:async()=>({steps:cfg.steps,snapAt:Date.now(),history:{}})};
  /* Android geri tuşu: uygulamanın kaydettiği dinleyici window.__back ile tetiklenir; çıkış window.__exited. */
  P.App={addListener:(ev,fn)=>{if(ev==="backButton")window.__back=fn;return {remove(){}}},exitApp:()=>{window.__exited=true}};
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:P};
}
/* Etkileşimli öğeler görünür alanın içinde mi (yatay ve kısa ekran denetimi). */
async function offscreen(page,root="body"){
  return page.evaluate(sel=>{
    const W=innerWidth,H=innerHeight,out=[];
    for(const el of document.querySelectorAll(`${sel} button, ${sel} a[href], ${sel} input:not([type=hidden]), ${sel} select, ${sel} textarea`)){
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      if(!r.width||!r.height||cs.visibility==="hidden"||el.closest("[hidden]"))continue;
      if(r.left<-1||r.right>W+1)out.push((el.getAttribute("aria-label")||el.textContent||el.id||el.tagName).trim().slice(0,40)+` x:${Math.round(r.left)}-${Math.round(r.right)}`);
    }
    return out;
  },root);
}
module.exports={test,expect,NOW,day,PROFILE,state,entry,offscreen};
