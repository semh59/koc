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

  /* 31: one adherence card with the dot legend, dots open their day, add button in the Dozlar header, one tap for a minute's doses, finished courses, the limit hint */
  reset(`[{id:1,n:'A',t:['00:00'],on:true,s:keyOff(-5)},{id:2,n:'B',t:['00:00'],on:true,s:keyOff(-5)},{id:3,n:'C',t:['00:00'],on:true,s:keyOff(-5)},{id:4,n:'Biten',t:['09:00'],on:true,s:keyOff(-5),e:keyOff(-1)}]`,`[{m:1,day:keyOff(-1),slot:'00:00',st:'t'}]`);
  const lbls=$$("#view .card>.lbl,#view .card .lhead>.lbl").map(e=>e.textContent);
  ok("31: one 'Uyum' card holds the 7 dots and the legend line; no separate 'Son 7 gün' card",lbls.filter(x=>x==="Uyum").length===1&&!lbls.includes("Son 7 gün")&&$$(".dd7 .dd").length===7&&$(".dd7").closest(".card").textContent.includes("✓ hepsi alındı · – işaretlenmedi · ! bekliyor · • bazıları atlandı"),lbls);
  ok("31: 'İlaç ekle' sits in the Dozlar header and is the only add button",!!$('#mdoses .lhead [data-md="new"] svg')&&$$('#view [data-md="new"]').length===1);
  $(`.dd7 [data-md="dday:${ev("keyOff(-3)")}"]`).click();
  ok("31: tapping the dot of 3 days ago shows that day's doses",ev("medViewDay()")===ev("keyOff(-3)")&&$("#mdoses").textContent.includes(ev("fd(keyOff(-3))")),$("#mdoses").textContent);
  $(`.dd7 [data-md="dday:${ev("calKey()")}"]`).click();
  ok("31: today's dot goes back to today",ev("medDay")==="");
  ok("31: three doses of the same minute get one 'Hepsini aldım' on the Meds screen",$$('#view [data-md="takeall:00:00"]').length===1);
  $('#view [data-md="takeall:00:00"]').click();
  const n3=ev("S.medLog.filter(r=>r.day===calKey()).length");$("#tundo").click();
  ok("31: one tap marks all three and one Geri al opens all three",n3===3&&ev("S.medLog.filter(r=>r.day===calKey()).length")===0,n3);
  ok("31: a medication whose end day has passed says '(bitti)'",[...$$("#view .card")].find(c=>c.textContent.startsWith("İlaçlarım")).textContent.includes("Biten (bitti)"));
  reset(`[${Array.from({length:20},(_,i)=>`{id:${i+1},n:'M${i}',t:['08:00'],on:true}`).join()}]`);ev("medOpen(0)");
  ok("31: at the 20 limit the message says finished medications can be deleted",$("#toast").textContent.includes("Biten ilaçları silebilirsin"),$("#toast").textContent);
  finish();
})();
