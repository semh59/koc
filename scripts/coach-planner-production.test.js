const {ok,finish}=require("./ok");
const {boot}=require("./html");

boot().then(w=>{
  ok("production Coach exposes planner contract",w.eval("typeof Coach?.planner==='function'"));
  const r=JSON.parse(w.eval(`(()=>{if(typeof Coach?.planner!=="function")return JSON.stringify({});S=structuredClone(DEF);S.settings.obDone=true;const p=Coach.planner();const x=p.upsertPlan({id:"today-1",title:"Kısa yürüyüş",status:"active",priority:1,source:"user",steps:["10 dakika"],idempotencyKey:"today-1-seed"});return JSON.stringify({ok:x.ok,priority:p.dailyPriority({day:"2026-10-27",online:false}),stored:Array.isArray(S.coachPlans)})})()`));
  ok("production planner stores a local priority",r.ok&&r.priority?.planId==="today-1"&&r.priority?.offline===true&&r.stored===true,r);
  const c=JSON.parse(w.eval(`(()=>{if(typeof Coach?.planner!=="function")return JSON.stringify({});const p=Coach.planner(),a=p.checkIn({id:"today-ci",day:"2026-10-27",energy:2,reason:"uyku",idempotencyKey:"today-ci-1"}),b=p.adapt({planId:"today-1",checkinId:"today-ci",reason:"energy_low",idempotencyKey:"today-adapt-1"});return JSON.stringify({checkin:a.ok,preview:b.preview,unchanged:p.plan("today-1").status})})()`));
  ok("production check-in adapts only as preview",c.checkin&&c.preview===true&&c.unchanged==="active",c);
  const okay=JSON.parse(w.eval(`(()=>{const p=Coach.planner(),r=p.checkIn({id:"okay-ci",day:"2026-10-28",energy:4,reason:"iyi",idempotencyKey:"okay-ci-1"}),a=p.adapt({planId:"today-1",checkinId:"okay-ci",reason:"energy_ok",idempotencyKey:"okay-adapt-1"});return JSON.stringify({checkin:r.ok,noop:a.noop,status:p.plan("today-1").status})})()`));
  ok("production okay energy records check-in without pause",okay.checkin&&okay.noop===true&&okay.status==="active",okay);
  const d=JSON.parse(w.eval(`(()=>{const a=Coach.planner(),b=Coach.planner(),x=b.upsertPlan({id:"today-2",title:"İkinci plan",status:"active",priority:2,source:"user",steps:["5 dakika"],idempotencyKey:"today-2-seed"}),r=buildState({settings:{obDone:true},coachPlans:S.coachPlans,coachCheckins:S.coachCheckins,coachActions:S.coachActions});return JSON.stringify({stored:S.coachPlans.map(v=>v.id),reloaded:r.S.coachPlans.map(v=>v.id),second:x.ok})})()`));
  ok("production planner handles share state and reload preserves plans",d.second&&d.stored.includes("today-1")&&d.stored.includes("today-2")&&d.reloaded.includes("today-1")&&d.reloaded.includes("today-2"),d);
  finish();
});
