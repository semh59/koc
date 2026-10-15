"use strict";
/* Shared fixtures: fixed clock, clean profile plus optional seed data, fake Capacitor, external network blocked, console error = test failure. */
const base=require("@playwright/test");
const {startFake}=require("./fake-provider");
const {expect}=base;
/* Tuesday 10:00 Istanbul: the base for daily entries, the default meal (breakfast) and weekly calculations. */
const NOW=new Date("2026-10-06T10:00:00+03:00");
const day=n=>{const d=new Date(NOW.getTime()+n*864e5);return d.toLocaleDateString("sv-SE",{timeZone:"Europe/Istanbul"})};
/* An adult user who has finished onboarding. */
const PROFILE={obDone:true,noticeOk:true,heightCm:178,age:35,sex:"m",act:1,goalKg:78,kcal:2200,stepsAsked:true};
const state=(settings={},rest={})=>({settings:{...PROFILE,...settings},entries:[],...rest});
/* Coach consent as already given for the four built-in providers. */
const CONSENT={consent:true,consentV:3,consentAt:"2026-10-06",consentP:"gemini,groq,nvidia,openrouter"};
const entry=(type,v,text="",o={})=>({day:day(o.d||0),time:o.time||"09:00",type,v,text,...o.x});

const test=base.test.extend({
  errs:[async({page},use)=>{
    const list=[],allow=[];
    page.on("pageerror",e=>list.push("pageerror: "+e.message));
    page.on("console",m=>{if(m.type()==="error")list.push("console.error: "+m.text())});
    await use({list,allow:re=>allow.push(re)});
    expect(list.filter(t=>!allow.some(re=>re.test(t))),"console error or uncaught exception").toEqual([]);
  },{auto:true}],
  /* External network blocked: local server only. Provider and Open Food Facts routes are set per test (the later route matches first). */
  context:async({context},use)=>{
    await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort("internetdisconnected"));
    await use(context);
  },
  fake:async({context},use)=>{const f=await startFake();await f.attach(context);await use(f);await f.close()},
  app:async({page},use)=>{
    const app={
      page,
      /* seed: state written to localStorage (only when empty, kept across reloads); native: fake Capacitor plugins. */
      /* dialogs: the app's confirm sheet (confirmSheet) is routed to the browser confirm(); the message lands in app.dialogs and onDialog answers.
         dialogs:false opens the real confirm sheet. */
      async open({seed,keys,native,time=NOW,dialogs=true}={}){
        await page.clock.install({time});
        if(dialogs)await page.addInitScript(()=>{window.__confirmAuto=m=>window.confirm(m)});
        await page.addInitScript(([s,k])=>{try{if(s&&localStorage.getItem("nw_state")==null)localStorage.setItem("nw_state",JSON.stringify(s));if(k&&localStorage.getItem("nw_keys")==null)localStorage.setItem("nw_keys",JSON.stringify(k))}catch(e){}},[seed||null,keys||null]);
        if(native)await page.addInitScript(nativeShim,native);
        if(dialogs)page.on("dialog",d=>{app.dialogs.push(d.message());(app.onDialog?app.onDialog(d):d.accept()).catch(()=>{})});
        const reload=page.reload.bind(page);page.reload=async o=>{const r=await reload(o);await page.waitForSelector("html[data-boot]",{state:"attached"});return r}; // ready once the main script parts have loaded
        await page.goto("/index.html");
        await expect(page.locator("#view")).not.toBeEmpty();
        return app;
      },
      dialogs:[],onDialog:null,
      view:page.locator("#view"),sheet:page.locator("#sheet.on"),toast:page.locator("#toast.on #tmsg"),
      async tab(name){await page.locator(`nav button[data-tab="${name}"]`).click()},
      async go(t){await page.waitForSelector("html[data-boot]",{state:"attached"});await page.evaluate(t=>{const b=document.createElement("button");b.dataset.tab=t;document.body.append(b);b.click();b.remove()},t);await app.settled()},
      settled:()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))),
      state:()=>page.evaluate(async()=>{await Store.whenIdle();return Store.sharded?assemble(Store.getShards()):JSON.parse(Store.get("nw_state"))}), // the real store is IndexedDB: read once the pending write finishes
      async closeSheet(){await page.keyboard.press("Escape");await expect(page.locator("#sheet")).not.toHaveClass(/\bon\b/)}
    };
    await use(app);
  }
});
/* Fake Capacitor: isNativePlatform and the given plugins. Only to drive phone-specific input such as the barcode scanner in a browser. */
function nativeShim(cfg){
  const P={};
  if(cfg.barcode)P.BarcodeScanner={isGoogleBarcodeScannerModuleAvailable:async()=>({available:true}),scan:async()=>({barcodes:[{rawValue:cfg.barcode}]})};
  if(cfg.steps!=null)P.StepCounter={isAvailable:async()=>({available:true}),requestAccess:async()=>({granted:true}),start:async()=>({}),read:async()=>({steps:cfg.steps,snapAt:Date.now(),history:{}})};
  /* Android back button: the listener the app registers is fired through window.__back; exit sets window.__exited. */
  P.App={addListener:(ev,fn)=>{if(ev==="backButton")window.__back=fn;return {remove(){}}},exitApp:()=>{window.__exited=true}};
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:P};
}
/* Are interactive elements inside the visible area (wide and short screen check). */
async function offscreen(page,root="body"){
  return page.evaluate(sel=>{
    const W=innerWidth,H=innerHeight,out=[];
    for(const el of document.querySelectorAll(`${sel} button, ${sel} a[href], ${sel} input:not([type=hidden]), ${sel} select, ${sel} textarea`)){
      const r=el.getBoundingClientRect(),cs=getComputedStyle(el);
      if(!r.width||!r.height||cs.visibility==="hidden"||el.closest("[hidden],.chiprow"))continue;
      if(r.left<-1||r.right>W+1)out.push((el.getAttribute("aria-label")||el.textContent||el.id||el.tagName).trim().slice(0,40)+` x:${Math.round(r.left)}-${Math.round(r.right)}`);
    }
    return out;
  },root);
}
/* Init script: when Capacitor is assigned, adds recording fakes of MedWake and LocalNotifications; calls land in window.__calls. cfg is the MedWake log. */
function medPlugins(cfg){
  window.__calls=[];
  const rec=(p,defs)=>new Proxy({},{get:(_,k)=>k==="then"?undefined:k==="addListener"?()=>({remove(){}}):async a=>{window.__calls.push([p+"."+k,a]);const v=defs[k];return typeof v==="function"?v():v||{}}});
  let C;
  Object.defineProperty(window,"Capacitor",{configurable:true,get:()=>C,set:v=>{C=v;
    v.Plugins.MedWake=rec("MedWake",{fsi:{allowed:true},log:cfg});
    v.Plugins.LocalNotifications=rec("LN",{checkPermissions:{display:"granted"},getPending:{notifications:[]},getDeliveredNotifications:{notifications:[]},checkExactNotificationSetting:{exact_alarm:"granted"}});
  }});
}
module.exports={test,expect,NOW,day,PROFILE,CONSENT,state,entry,offscreen,medPlugins};
