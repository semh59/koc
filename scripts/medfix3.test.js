/* Medication add/edit sheet: the collapsed extras and the frequency choice, the first-dose day, field errors, focus, undo and close questions, wording. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");

(async()=>{
  const w=await boot(),ev=s=>w.eval(s),$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)],click=s=>$(s).click();
  const reset=(meds="[]",log="[]")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.meds=MedLib.cleanMeds(${meds});S.medLog=MedLib.cleanLog(${log},S.meds);tab='meds';medDay='';closeSheet();render()`);
  const shown=()=>$$("#sheet input:not([type=checkbox])").filter(e=>!e.closest("[hidden]")&&!e.closest("details:not([open])")).map(e=>e.id);

  /* 21: only name, dose and time are open on a new medication; a filled extra opens the fold on edit */
  reset();ev("medOpen(0)");
  ok("21: a new medication shows name, dose and time; the extras are folded",shown().join()==="mn,md,mt0"&&!$("#mmore").open&&$$('[data-md^="fq:"]').length===3,shown());
  click('[data-md="fq:n"]');
  ok("21: 'Her N günde' shows only the interval field and keeps the fold state",shown().join()==="mn,md,mt0,miv"&&!$("#mmore").open,shown());
  $("#mmore").open=true;click('[data-md="fq:w"]');
  ok("21: 'Belirli günler' shows the day chips; an opened fold stays open across the redraw",!$('[data-md="wd:1"]').closest("[hidden]")&&$("#miv").closest("[hidden]")&&$("#mmore").open);
  reset("[{id:1,n:'A',t:['08:00'],on:true,k:20}]");ev("medOpen(1)");
  ok("21: editing a medication with stock opens the fold",$("#mmore").open);
  ok("21: per-time dose and amount boxes carry visible labels",$("#mq0").closest(".labf")&&$("#mpa0").closest(".labf"));
  finish();
})();
