const {ok,finish}=require("./ok");
const {boot}=require("./html");

const plan=id=>({id,title:id,status:"active",priority:1,source:"user",steps:["10 dakika"],idempotencyKey:id+"-seed-1"});

(async()=>{
  const restored=await boot();
  const rebound=JSON.parse(restored.eval(`(()=>{
    const cached=Coach.planner();
    S=structuredClone(DEF);
    S.coachPlans=[${JSON.stringify(plan("restored-plan"))}];
    S.coachCheckins=[];S.coachActions=[];
    const afterRestore=Coach.planner();
    return JSON.stringify({plan:afterRestore.plan("restored-plan"),stale:afterRestore.plan("old-plan")});
  })()`));
  ok("planner rebinds after restore replaces S",rebound.plan?.id==="restored-plan"&&!rebound.stale,rebound);

  const failed=await boot();
  const persistence=JSON.parse(failed.eval(`(()=>{
    S=structuredClone(DEF);
    const p=Coach.planner();
    save=()=>false;
    const r=p.upsertPlan(${JSON.stringify(plan("not-persisted"))});
    return JSON.stringify({ok:r.ok,stored:S.coachPlans.some(x=>x.id==="not-persisted"),planner:p.plan("not-persisted")});
  })()`));
  ok("planner persistence failure is reported and rolled back",persistence.ok===false&&!persistence.stored&&!persistence.planner,persistence);
  const retry=JSON.parse(failed.eval(`(()=>{let calls=0;save=()=>++calls>1;const p=Coach.planner(),r=p.upsertPlan(${JSON.stringify(plan("retry-plan"))}),s=p.upsertPlan({...${JSON.stringify(plan("retry-plan"))},idempotencyKey:"retry-plan-2"});return JSON.stringify({first:r.ok,second:s.ok,stored:S.coachPlans.some(x=>x.id==="retry-plan"),calls})})()`));
  ok("planner persistence retry commits once storage recovers",retry.first===false&&retry.second===true&&retry.stored&&retry.calls===2,retry);
  const validPlan=plan("valid-plan");
  const invalid=plan("invalid-plan");invalid.status="not-a-status";
  const raw=JSON.stringify({entries:[],settings:{obDone:true},coachPlans:[validPlan,invalid],coachCheckins:[],coachActions:[]});
  const recovered=await boot(w=>w.localStorage.setItem("nw_state",raw));
  const recovery=JSON.parse(recovered.eval(`JSON.stringify({
    live:S.coachPlans.map(x=>x.id),
    raw:Store.get("nw_state_corrupt"),
    note:loadNote
  })`));
  ok("invalid planner records are retained in recovery and reported",recovery.live.length===1&&recovery.live[0]==="valid-plan"&&recovery.raw?.includes("invalid-plan")&&/geçersiz kayıt atıldı/.test(recovery.note),recovery);

  finish();
})();
