const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");

boot(w=>{
  const listeners={};
  const speech={
    addListener:async(type,fn)=>{(listeners[type]??=[]).push(fn);return {remove:()=>{}}},
    removeAllListeners:async type=>{delete listeners[type]},
    listen:async()=>({started:true}),
    stopListening:async()=>{}
  };
  w.Capacitor={Plugins:{Speech:speech}};
  w.__coachVoiceResult=ev=>(listeners.result||[]).forEach(fn=>fn(ev));
  w.__coachVoiceError=ev=>(listeners.error||[]).forEach(fn=>fn(ev));
}).then(async w=>{
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;tab='coach';render();");
  const mic=w.document.querySelector('[data-c="coachvoice"]');
  ok("Coach composer exposes a dictation microphone",!!mic&&!!w.document.querySelector("#cmsg")&&mic.getAttribute("aria-label")==="Mesajı sesle yaz");
  mic?.click();
  ok("first Coach voice use explains dictation before listening",w.document.querySelector('[data-c="coachvoiceconsent"]')!==null&&w.document.body.textContent.includes("Sesle mesaj yaz"));
  w.document.querySelector('[data-c="coachvoiceconsent"]')?.click();
  await flush();
  ok("Coach voice keeps the conversation screen and shows listening state",w.document.querySelector("#composer")&&!w.document.querySelector("#composer").hidden&&w.document.querySelector("#cvoice-status")?.textContent.includes("Dinliyorum"));
  w.eval("window.__coachVoiceResult({text:'Bugün ne kadar su içmeliyim'});");
  ok("Coach transcript fills the message field without sending",w.document.querySelector("#cmsg").value==="Bugün ne kadar su içmeliyim"&&w.eval("S.chat.length")===0&&w.document.querySelector("#cvoice-status").textContent.includes("Göndermeye hazır"));
  w.eval("S.settings.coachVoiceConsent=true;coachVoiceStart();window.__coachVoiceError({error:'permission'});");
  ok("Coach voice errors preserve typed chat fallback",w.document.querySelector("#composer").classList.contains("on")===false&&w.document.querySelector("#cmsg").value==="Bugün ne kadar su içmeliyim"&&w.document.querySelector("#cvoice-status").textContent.includes("Yazarak devam"));
  finish();
}).catch(e=>{console.error(e);process.exit(1)});
