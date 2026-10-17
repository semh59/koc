/* Meds screen: record wording, dose states, the adherence card, the dot days, reminder switch, log limit, CSV, as-needed medications. */
const {ok,finish}=require("./ok");
const {boot,read}=require("./html");
const clock=require("./clock");

(async()=>{
  const w=await boot(),ev=s=>w.eval(s),$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];
  const reset=(meds="[]",log="[]",st="")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;${st};S.meds=MedLib.cleanMeds(${meds});S.medLog=MedLib.cleanLog(${log},S.meds);tab='meds';medDay='';closeSheet();render()`);
  const view=()=>$("#view").textContent;

  /* K4: an unmarked dose of a past day is "İşaretlenmedi" everywhere */
  reset(`[{id:1,n:'A',t:['08:00'],on:true,s:keyOff(-3)}]`);
  $('[data-md="dprev"]').click();
  ok("K4: a past day's unmarked dose on the Meds screen says 'İşaretlenmedi'",view().includes("İşaretlenmedi"),view());
  ok("K4: the unmarked day dot is labelled 'işaretlenmedi'",$$(".dd7 .dd").some(e=>/işaretlenmedi/.test(e.getAttribute("aria-label"))));
  ok("K4: no 'kaçırıl' wording left in the medication screens and the weekly report",!/[Kk]açırıl/.test(read("modules/meds/medui.js")+read("modules/insights/weeklylib.js")));
  finish();
})();
