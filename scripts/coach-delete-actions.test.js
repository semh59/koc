const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");

(async()=>{
  const w=await boot(x=>x.localStorage.setItem("nw_keys",JSON.stringify({groq:"DELETE-ME"})));
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  await ev("keysP");
  ev("S.settings.obDone=true;tab='settings-coach';render()");
  ok("settings exposes saved-key deletion",!!q('[data-c="deletekeys"]')&&q('[data-c="deletekeys"]').textContent.includes("Kayıtlı anahtarları sil"));
  ev("window.__confirmAuto=()=>false");q('[data-c="deletekeys"]').click();await flush();
  ok("saved-key deletion cancel preserves key",w.localStorage.getItem("nw_keys")!==null);
  ev("window.__confirmAuto=()=>true");q('[data-c="deletekeys"]').click();await flush();
  ok("saved-key deletion calls wipeKeys",w.localStorage.getItem("nw_keys")===null&&Object.keys(ev("getKeys()")).length===0);

  ev("delete window.__confirmAuto;S.settings.entryConsentSeen=true;S.settings.entryConsentVersion=1;S.settings.entryConsentAt='2026-10-06T07:00:00.000Z';S.settings.entryConsentChoice='text_only';S.coachExperiments=[{id:'exp-delete',status:'draft',hypothesis:'test',measurementWindow:{start:'2026-10-01',end:'2026-10-07'},baseline:{metric:'daily_value',value:1,unit:'değer'},targetBehavior:{description:'hedef',metric:'daily_value',target:2,direction:'at_least'},idempotencyKey:'experiment-delete'}];S.coachExperimentEvents=[];CoachExperimentRepo=null;CoachExperimentState=null;tab='coach';render()")
  ok("experiment data remains preserved without user-facing experiment screen",ev("Coach.experimentList().length")===1&&!q('[data-c="experimentnew"]'));
  finish();
})().catch(e=>{console.error(e);process.exitCode=1});
