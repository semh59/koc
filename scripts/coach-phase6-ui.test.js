const { ok, finish } = require("./ok");
const { boot, flush } = require("./html");

boot(w=>{
  w.Capacitor={Plugins:{Speech:{addListener:async()=>({remove:()=>{}}),removeAllListeners:async()=>{},listen:async()=>({started:false,reason:"permission"}),stopListening:async()=>{}}}};
}).then(async w=>{
  const clean=w.eval("cleanSettings({foodVoiceConsent:true,foodVoiceConsentVersion:1,foodVoiceConsentAt:'2026-10-06T07:00:00.000Z',coachVoiceConsent:true,coachVoiceConsentVersion:1,coachVoiceConsentAt:'2026-10-06T07:00:00.000Z'})");
  ok("food and Coach voice consent keep complete current tuples",clean.foodVoiceConsent===true&&clean.foodVoiceConsentVersion===1&&clean.foodVoiceConsentAt.endsWith("Z")&&clean.coachVoiceConsent===true&&clean.coachVoiceConsentVersion===1&&clean.coachVoiceConsentAt.endsWith("Z"));
  const bad=w.eval("cleanSettings({foodVoiceConsent:true,foodVoiceConsentVersion:1,foodVoiceConsentAt:'2026-02-30T07:00:00.000Z',coachVoiceConsent:true,coachVoiceConsentVersion:1,coachVoiceConsentAt:'2026-10-06T07:00:00.000Z'})");
  ok("impossible food consent date is cleared while valid Coach consent remains",bad.foodVoiceConsent===false&&bad.foodVoiceConsentVersion===0&&bad.coachVoiceConsent===true);
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;tab='coach';render();");
  ok("Coach has no voice food recording UI",!w.document.querySelector('[data-c="entryvoice"]')&&!w.document.body.textContent.includes("Sesle yemek kaydı"));
  ok("Coach keeps local food entry",!!w.document.querySelector('[data-c="entrylocal"]'));
  w.eval("sheetFood();");
  ok("food sheet owns microphone control",!!w.document.querySelector('[data-fvoice="start"]')&&!!w.document.querySelector('#fq'));
  w.document.querySelector('[data-fvoice="start"]').click();
  ok("first use shows food-search disclosure, not Coach consent",w.document.querySelector('[data-fvoice="consent"]')!==null&&w.document.body.textContent.includes("Sesle yemek ara"));
  w.document.querySelector('[data-fvoice="consent"]').click();
  await flush();
  ok("permission failure keeps food sheet open",w.document.querySelector('#fq')!==null&&w.document.querySelector('#sheet').classList.contains('on'));
  w.eval("Object.assign(S.settings,{foodVoiceConsent:true,foodVoiceConsentVersion:1,foodVoiceConsentAt:new Date().toISOString(),coachVoiceConsent:true,coachVoiceConsentVersion:1,coachVoiceConsentAt:new Date().toISOString()});sheetPrivacy()");
  w.document.querySelector('[data-pv="foodvoice-revoke"]').click();
  await flush();
  ok("food voice revocation clears only its consent tuple",w.eval("S.settings.foodVoiceConsent===false&&S.settings.foodVoiceConsentVersion===0&&S.settings.coachVoiceConsent===true"));
  w.document.querySelector('[data-pv="coachvoice-revoke"]').click();
  await flush();
  ok("Coach voice revocation clears only its consent tuple",w.eval("S.settings.coachVoiceConsent===false&&S.settings.coachVoiceConsentVersion===0&&S.settings.foodVoiceConsent===false"));
  finish();
}).catch(e=>{console.error(e);process.exit(1)});
