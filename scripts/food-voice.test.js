const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");

boot(w=>{
  const listeners={};
  const speech={
    addListener:async(type,fn)=>{(listeners[type]??=[]).push(fn);w.__foodVoiceResult=ev=>(listeners.result||[]).forEach(f=>f(ev));return {remove:()=>{}}},
    removeAllListeners:async type=>{delete listeners[type]},
    listen:async()=>({started:true}),
    stopListening:async()=>{speech.stopCalls++},
    stopCalls:0  };
  w.Capacitor={Plugins:{Speech:speech}};
}).then(async w=>{
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render();");
  w.eval("sheetFood();");
  ok("food sheet exposes one recognizable microphone control",w.document.querySelector('[data-fvoice="start"]')!==null&&w.document.querySelectorAll('[data-fvoice="start"]').length===1);
  ok("food microphone is attached to local food search",w.document.querySelector('[data-fvoice="start"]')?.getAttribute("aria-label")==="Yemek aramak için mikrofonu aç");
  w.document.querySelector('[data-fvoice="start"]').click();
  ok("first food voice use explains speech processing before listening",w.document.body.textContent.includes("Sesle yemek ara")&&w.document.querySelector('[data-fvoice="consent"]')!==null);
  w.document.querySelector('[data-fvoice="consent"]').click();
  await flush();
  ok("permission/listening sheet stays inside food add flow",w.document.querySelector("#sheet").classList.contains("on")&&w.document.querySelector("#food-voice-status")!==null);
  w.eval("S.settings.foodVoiceConsent=true;closeSheet();sheetFood();");
  w.document.querySelector('[data-fvoice="start"]').click();
  await flush();
  ok("already-approved microphone opens listening state without leaving food sheet",w.document.querySelector("#food-voice-status")!==null&&w.document.querySelector("#fq")!==null);
  w.eval("(window.__foodVoiceResult||(()=>{}))({text:'mercimek çorbası'});");
  ok("speech result becomes local search text",w.document.querySelector("#fq").value==="mercimek çorbası"&&w.document.querySelector("#flist").textContent.includes("mercimek"));
  w.eval("S.settings.foodVoiceConsent=true;closeSheet();sheetFood();");
  w.document.querySelector('[data-fvoice="start"]').click();
  await flush();
  const beforeReplace=w.eval("Capacitor.Plugins.Speech.stopCalls");
  w.eval("openSheet('<h3>Başka pencere</h3>')");
  ok("replacing the food sheet stops active recognition",w.eval("Capacitor.Plugins.Speech.stopCalls")>beforeReplace);
  w.eval("tab='coach';render();");
  ok("Coach no longer offers voice food recording",w.document.querySelector('[data-c="entryvoice"]')===null&&!w.document.body.textContent.includes("Sesle yemek kaydı"));
  finish();
}).catch(e=>{console.error(e);process.exit(1)});
