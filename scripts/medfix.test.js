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

  /* 7: an end day on an edit keeps the start day, so past adherence stays */
  reset(`[{id:1,n:'A',t:['08:00'],on:true,s:calOff(-9)}]`,`Array.from({length:10},(_,i)=>({m:1,day:calOff(-i),slot:'08:00',st:'t'}))`);
  ev("medOpen(1)");
  ok("edit sheet: no 'Kaç gün' field, the end day is there",!$("#mc")&&!!$("#me"));
  $("#me").value=ev("calOff(5)");click('[data-md="save"]');
  const adh=ev("JSON.stringify(MedLib.adherence(S.meds,S.medLog,calOff(-9),calKey(),calKey(),'23:59'))");
  ok("end day set on the edit: the start day and 10/10 of the last 10 days stay",ev("S.meds[0].s")===ev("calOff(-9)")&&ev("S.meds[0].e")===ev("calOff(5)")&&/"total":10,"taken":10/.test(adh),adh);
  ev("medOpen(0)");
  ok("new medication: the 'Kaç gün' field is there",!!$("#mc"));
  ev("medClose()");

  finish();
})();
