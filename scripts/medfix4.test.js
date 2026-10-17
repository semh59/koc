/* Meds screen: record wording, dose states, the adherence card, the dot days, reminder switch, log limit, CSV, as-needed medications. */
const {ok,finish}=require("./ok");
const {boot,read}=require("./html");

(async()=>{
  const w=await boot(),ev=s=>w.eval(s),$=s=>w.document.querySelector(s),$$=s=>[...w.document.querySelectorAll(s)];
  const reset=(meds="[]",log="[]",st="")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;${st};S.meds=MedLib.cleanMeds(${meds});S.medLog=MedLib.cleanLog(${log},S.meds);tab='meds';medDay='';closeSheet();render()`);
  const view=()=>$("#view").textContent;
  /* Pins the window clock to h:m today; unclock() restores it. */
  const at=(h,m)=>{const t=new Date();t.setHours(h,m,0,0);ev(`{const D=globalThis.__D0||Date;globalThis.__D0=D;const o=${t-Date.now()};Date=class extends D{constructor(...a){super(...(a.length?a:[D.now()+o]))}static now(){return D.now()+o}}}`)},unclock=()=>ev("Date=globalThis.__D0||Date");

  /* K4: an unmarked dose of a past day is "İşaretlenmedi" everywhere */
  reset(`[{id:1,n:'A',t:['08:00'],on:true,s:keyOff(-3)}]`);
  $('[data-md="dprev"]').click();
  ok("K4: a past day's unmarked dose on the Meds screen says 'İşaretlenmedi'",view().includes("İşaretlenmedi"),view());
  ok("K4: the unmarked day dot is labelled 'işaretlenmedi'",$$(".dd7 .dd").some(e=>/işaretlenmedi/.test(e.getAttribute("aria-label"))));
  ok("K4: no 'kaçırıl' wording left in the medication screens and the weekly report",!/[Kk]açırıl/.test(read("modules/meds/medui.js")+read("modules/insights/weeklylib.js")));

  /* 13: the first 30 minutes of a dose are "Saati geldi" on both screens */
  const due=()=>{ev("tab='meds';render()");const m=$("#view .mdose").textContent;ev("tab='today';render()");return [m,$(".todo").textContent]};
  at(8,10);reset(`[{id:1,n:'A',t:['08:00'],on:true,s:keyOff(-3)}]`);
  ok("13: at 08:10 the 08:00 dose is 'Saati geldi' on the Meds screen and on Today",due().every(x=>x.includes("Saati geldi")&&!x.includes("Gecikti")),due());
  at(8,31);
  ok("13: at 08:31 it is 'Gecikti' on both",due().every(x=>x.includes("Gecikti")),due());
  unclock();
  finish();
})();
