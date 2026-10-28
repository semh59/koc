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

  ev("delete window.__confirmAuto;S.coachExperiments=[{id:'exp-delete',status:'draft',hypothesis:'test',measurementWindow:{start:'2026-10-01',end:'2026-10-07'},baseline:{metric:'daily_value',value:1,unit:'değer'},targetBehavior:{description:'hedef',metric:'daily_value',target:2,direction:'at_least'},idempotencyKey:'experiment-delete'}];S.coachExperimentEvents=[];CoachExperimentRepo=null;CoachExperimentState=null;tab='coach';render()");
  ok("experiment screen exposes delete-all action",!!q('[data-c="experimentdeleteall"]')&&q('[data-c="experimentdeleteall"]').textContent.includes("Tüm deneyleri sil"));
  ev("window.__confirmAuto=()=>false");q('[data-c="experimentdeleteall"]').click();await flush();
  ok("experiment deletion cancel preserves records",ev("Coach.experimentList().length")===1);
  w.Capacitor={Plugins:{Filesystem:{writeFile:async()=>{throw new Error("export failed")}},Share:{share:async()=>{throw new Error("export failed")}}}};
  w.Capacitor.Plugins.Filesystem={writeFile:async()=>{throw new Error("export failed")}};
  w.Capacitor.Plugins.Share={share:async()=>{throw new Error("export failed")}};
  ev("window.__confirmAuto=()=>true");q('[data-c="experimentdeleteall"]').click();await flush();await flush();
  ok("failed experiment export preserves records",ev("Coach.experimentList().length")===1);
  w.Capacitor.Plugins.Filesystem={writeFile:async()=>({uri:"file:///cache/experiments.json"}),readdir:async()=>({files:[]}),deleteFile:async()=>{}};
  w.Capacitor.Plugins.Share={share:async()=>{}};
  q('[data-c="experimentdeleteall"]').click();await flush();await flush();await flush();
  ok("successful export then delete removes all experiments",ev("Coach.experimentList().length")===0);
  finish();
})().catch(e=>{console.error(e);process.exitCode=1});
