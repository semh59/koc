const {ok,finish}=require("./ok");
const {boot}=require("./html");

boot().then(w=>{
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;S.settings.entryConsentSeen=true;S.settings.entryConsentVersion=1;S.settings.entryConsentAt='2026-10-06T07:00:00.000Z';S.settings.entryConsentChoice='text_only';tab='coach';render();");
  ok("Coach renders local food entry without voice capture",!!w.document.querySelector('[data-c="entrylocal"]')&&!w.document.querySelector('[data-c="entryvoice"]')&&!w.document.body.textContent.includes("Sesle yemek kaydı"));
  ok("trend API exposes uncertainty and data sufficiency",typeof w.eval("Algo.goalEta")==="function");
  ok("existing plateau remains available",typeof w.eval("cWhy")==="function");
  finish();
}).catch(e=>{console.error(e);process.exitCode=1});
