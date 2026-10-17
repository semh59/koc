/* Medication page fixes: the 20-medication limit, edit keeps the start day, notification taps, double-dose day, stock, deletions, rescheduling order. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const M=require("../www/modules/meds/medlib.js");

(async()=>{
  const w=await boot(),ev=s=>w.eval(s),$=s=>w.document.querySelector(s),click=s=>$(s).click();
  const reset=(meds,log="[]")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.meds=MedLib.cleanMeds(${meds});S.medLog=MedLib.cleanLog(${log},S.meds);tab='meds';render()`);

  /* 1: a copy at the limit is refused instead of dropping a medication */
  for(const [name,ids] of [["ids 1-20",Array.from({length:20},(_,i)=>i+1)],["id 3 free",Array.from({length:20},(_,i)=>i<2?i+1:i+2)]]){
    reset(JSON.stringify(ids.map(id=>({id,n:"M"+id,t:["08:00"],on:true,s:"2026-01-01"}))),JSON.stringify(ids.map(id=>({m:id,day:"2026-01-02",slot:"08:00",st:"t"}))));
    const before=ev("JSON.stringify([S.meds,S.medLog])");
    ev(`medOpen(${ids[19]})`);click('[data-md="dup"]');
    ok(`20 medications (${name}): 'Aynı ilaçtan bir tane daha' warns and stays on the edit`,/En çok 20 ilaç/.test($("#mwarn").textContent)&&ev("medDraft.id")===ids[19]);
    ev("medDraft.id=0;medSave()");
    ok(`20 medications (${name}): saving a new one changes neither the list nor the log and warns`,ev("JSON.stringify([S.meds,S.medLog])")===before&&/En çok 20 ilaç/.test($("#mwarn").textContent));
    ev("medClose()");
  }

  finish();
})();
