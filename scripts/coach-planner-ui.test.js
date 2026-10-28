const {ok,finish}=require("./ok");
const {boot}=require("./html");

boot().then(w=>{
  const ev=sel=>w.document.querySelector(sel)?.dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render();");
  ok("Today exposes local planner entry",w.document.body.textContent.includes("Bugünün planı")&&w.document.body.textContent.includes("Check-in"));
  const plan=w.eval("(()=>{const p=Coach.planner();return p.upsertPlan({id:'ui-plan-1',title:'Akşam yürüyüşü',status:'active',priority:1,source:'user',steps:['10 dakika'],idempotencyKey:'ui-plan-01'})})()");
  w.eval("render()");
  ok("Today shows one daily priority",w.document.querySelectorAll('[data-testid="daily-priority"]').length===1&&w.document.body.textContent.includes("Akşam yürüyüşü"));
  ev('[data-c^="planner"]');
  ok("planner sheet states offline local operation",w.document.querySelector("#sheet")?.textContent.includes("çevrimdışı"));
  ev('[data-c="plannercheck"]');
  ok("check-in sheet has explicit preview action",w.document.querySelector('[data-c="checkpreview"]')!==null);
  finish();
}).catch(e=>{console.error(e);process.exitCode=1});
