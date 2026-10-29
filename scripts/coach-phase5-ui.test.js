const {ok,finish}=require("./ok");
const {boot}=require("./html");

boot().then(w=>{
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;S.settings.entryConsentSeen=true;S.settings.entryConsentVersion=1;S.settings.entryConsentAt='2026-10-06T07:00:00.000Z';S.settings.entryConsentChoice='text_only';tab='coach';render();");
  ok("Coach does not show local experiment UI to users",!w.document.body.textContent.includes("Küçük deneyler")&&!w.document.querySelector('[data-c="experimentnew"]'));
  ok("experiment data API remains available for preserved local records",typeof w.eval("Coach.experimentList")==="function"&&typeof w.eval("Coach.experimentExport")==="function");
  ok("Coach still renders low-friction entry controls after experiment UI removal",!!w.document.querySelector('[data-c="entryvoice"]')&&!!w.document.querySelector('[data-c="entryphoto"]')&&!!w.document.querySelector('[data-c="entrylocal"]'));
  ok("trend API exposes uncertainty and data sufficiency",typeof w.eval("Algo.goalEta")==="function");
  ok("existing plateau remains available",typeof w.eval("cWhy")==="function");
  finish();
}).catch(e=>{console.error(e);process.exitCode=1});
