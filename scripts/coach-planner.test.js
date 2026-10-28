const {ok,finish}=require("./ok");
const C=require("../www/modules/coach/coachlib.js");

const make=()=>C.createPlanner({plans:[],checkins:[],actions:[]});
const plan={id:"plan-1",title:"Akşam yürüyüşü",kind:"activity",status:"active",priority:2,source:"user",steps:["20 dakika hafif yürüyüş"],idempotencyKey:"plan-seed-1"};

ok("planner factory exists",typeof C.createPlanner==="function");
const p=make();
ok("plan create returns a copy",(()=>{const x=p.upsertPlan(plan);const title=x.title;x.title="değişti";return x!==plan&&title==="Akşam yürüyüşü"&&x.title!==plan.title&&p.plan("plan-1").title==="Akşam yürüyüşü"})());
ok("plan update is idempotent by idempotency key",(()=>{const a=p.upsertPlan({...plan,title:"Güncellenmiş",idempotencyKey:"plan-save-1"});const b=p.upsertPlan({...plan,title:"Başka",idempotencyKey:"plan-save-1"});return a.ok&&b.ok&&b.duplicate===true&&p.plan("plan-1").title==="Güncellenmiş"})());
ok("plan CRUD rejects unsafe shape",(()=>{const x=p.upsertPlan({id:"x",title:"x",status:"active",steps:["x"],source:"model"});return x.ok===false})());
ok("all write mutators reject missing or invalid idempotency keys without mutation",(()=>{const before=JSON.stringify(p.snapshot());const missing=p.upsertPlan({id:"missing-key",title:"x",status:"active",source:"user",steps:[]});const invalid=p.checkIn({id:"bad-key",day:"2026-10-27",energy:2,reason:"x",idempotencyKey:"bad"});const action=p.confirmAction({id:"bad-action",planId:"plan-1",type:"plan_adjust",patch:{status:"paused"},idempotencyKey:"bad"});return !missing.ok&&!invalid.ok&&!action.ok&&JSON.stringify(p.snapshot())===before})());
ok("daily priority selects one local plan",(()=>{const x=p.dailyPriority({day:"2026-10-27"});return x&&x.planId==="plan-1"&&x.day==="2026-10-27"})());
ok("check-in is idempotent and copy-safe",(()=>{const a=p.checkIn({id:"ci-1",day:"2026-10-27",energy:2,reason:"uyku",idempotencyKey:"checkin-1"});const b=p.checkIn({id:"ci-1",day:"2026-10-27",energy:1,reason:"başka",idempotencyKey:"checkin-1"});const energy=a.record.energy;a.record.energy=9;return a.ok&&b.duplicate===true&&energy===2&&p.snapshot().checkins[0].energy===2})());
ok("adaptation is preview-only until confirmed",(()=>{const x=p.adapt({planId:"plan-1",checkinId:"ci-1",reason:"energy_low",idempotencyKey:"adapt-001"});return x.ok&&x.preview===true&&p.plan("plan-1").status==="active"})());
ok("adaptation preview is a no-op for okay energy",(()=>{const n=p.adapt({planId:"plan-1",checkinId:"ci-1",reason:"energy_ok",idempotencyKey:"adapt-ok-01"});return n.ok&&n.noop===true&&p.plan("plan-1").status==="active"})());
ok("action confirm is idempotent and undo restores prior state",(()=>{const x=p.confirmAction({id:"act-1",type:"plan_adjust",planId:"plan-1",idempotencyKey:"action-1",patch:{status:"paused"}});const y=p.confirmAction({...x.action,idempotencyKey:"action-1"});const u=p.undoAction("act-1","undo-action-1");return x.ok&&y.duplicate===true&&u.ok&&p.plan("plan-1").status==="active"})());
ok("offline planner never requires provider or network",(()=>{const x=p.dailyPriority({day:"2026-10-27",online:false});return x&&x.offline===true&&p.snapshot().network===undefined})());
ok("planner snapshot is isolated",(()=>{const x=p.snapshot();x.plans[0].steps[0]="leak";return p.plan("plan-1").steps[0]!=="leak"})());
const persisted=p.snapshot(),reloaded=C.createPlanner(persisted);
ok("reloaded planner preserves idempotency",(()=>{const x=reloaded.upsertPlan({...plan,title:"başka",idempotencyKey:"plan-save-1"});return x.ok&&x.duplicate===true&&reloaded.plan("plan-1").title==="Güncellenmiş"})());
ok("idempotency keys are scoped by operation type",(()=>{const x=C.createPlanner({plans:[],checkins:[],actions:[]}),a=x.upsertPlan({...plan,id:"scoped-plan",idempotencyKey:"same-key-1"}),b=x.checkIn({id:"scoped-checkin",day:"2026-10-27",energy:2,reason:"uyku",idempotencyKey:"same-key-1"});return a.ok&&b.ok&&!b.duplicate&&x.snapshot().checkins.length===1})());
ok("invalid calendar dates reject without mutation",(()=>{const x=C.createPlanner({plans:[],checkins:[],actions:[]}),base={id:"ci-date",energy:2,reason:"x",idempotencyKey:"ci-date-key"};return ["2026-99-99","2026-02-29","2025-02-29","2026-04-31"].every(day=>{const r=x.checkIn({...base,id:"ci-"+day,idempotencyKey:"key-"+day,day});return !r.ok})&&x.checkIn({...base,day:"2026-02-28"}).ok&&x.checkIn({...base,id:"leap",idempotencyKey:"leap-key",day:"2024-02-29"}).ok&&x.snapshot().checkins.length===2})());
ok("undo rejects missing or invalid keys without mutation",(()=>{const x=C.createPlanner({plans:[{id:"u-plan",title:"Plan",status:"active",source:"user",steps:[],idempotencyKey:"u-plan-key"}],checkins:[],actions:[]}),a=x.confirmAction({id:"u-action",planId:"u-plan",type:"plan_adjust",patch:{status:"paused"},idempotencyKey:"u-action-key"}),before=JSON.stringify(x.snapshot());return a.ok&&!x.undoAction("u-action").ok&&!x.undoAction("u-action","bad").ok&&JSON.stringify(x.snapshot())===before})());

finish();
