/* A failed save puts the old value back and shows the one "kaydedilemedi" message. */
const {ok,finish}=require("./ok");
const {boot,full}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s),SP=w.Storage.prototype,set0=SP.setItem;
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;tab='today';render()");
  const full_=()=>{SP.setItem=function(k){if(k==="nw_state")throw new w.DOMException("dolu","QuotaExceededError");return set0.apply(this,arguments)}},free=()=>{SP.setItem=set0};
  const msg=()=>q("#tmsg").textContent;
  const id=ev("add('food',300,'Simit').id");
  full_();
  ev("tab='day';logOff=0;render()");
  q(`[data-del="${id}"]`).click();
  ok("a failed delete brings the entry back",ev(`Log.find(e=>e.id===${id})`)!=null&&/kaydedilemedi/.test(msg())&&!msg().includes("Kayıt silindi"),msg());
  free();
  ev("S.sleep=[{day:dayKey(),min:420,q:3}];tab='today';render()");
  full_();
  ev("hbSet('sleep',[],'Uyku kaydı silindi')");
  ok("a failed sleep delete keeps the record and says so",ev("S.sleep.length")===1&&/kaydedilemedi/.test(msg())&&!msg().includes("Uyku kaydı silindi"),msg());
  free();
  ev("S.sleep=[];save()");
  ok("every failed-save message is the one SAVE_FAIL text",!/Kaydedilemedi, depolama dolu/.test(full()),null);
  finish();
})();
