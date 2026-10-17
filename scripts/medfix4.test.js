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

  /* 27: Meds screen dose buttons name the time (and the day on a past day); the ✓ chip says it was taken; the dots are one group */
  reset(`[{id:1,n:'A',t:['08:00','20:00'],on:true,s:keyOff(-5)}]`,`[{m:1,day:calKey(),slot:'08:00',st:'t',at:'08:05'}]`);
  ok("27: the ✓ chip is named 'A: alındı 08:05, saati değiştir'",$('[data-md^="at:1:08:00"]').getAttribute("aria-label")==="A: alındı 08:05, saati değiştir");
  ok("27: the 7 dots are a labelled group",$(".dd7").getAttribute("role")==="group"&&$(".dd7").getAttribute("aria-label")==="Son 7 gün");
  $('[data-md="dprev"]').click();
  const names=$$('#view [data-md^="take:1:"]').map(b=>b.getAttribute("aria-label"));
  ok("27: on a past day the two take buttons differ by time and name the day",names.length===2&&names[0]!==names[1]&&names.every(n=>n.includes(ev("fd(keyOff(-1))"))),names);

  /* 36: time column, one sub line, the state as a tag, icons instead of '＋', the day navigator */
  at(12,0);reset(`[{id:1,n:'A',d:'1 tablet',t:['00:00'],on:true,s:keyOff(-5)}]`);
  const row=$("#view .mdose");unclock();
  ok("36: the Meds screen dose row has the time column, one sub line and the state in a .tag",row.firstElementChild.matches("b.tm")&&row.querySelectorAll(".sub").length===1&&row.querySelector(".sub .tag")?.textContent==="Gecikti",row.outerHTML);
  ok("36: no full-width '＋' in the medication screens; the day navigator is .dnav",!read("modules/meds/medui.js").includes("＋")&&!!$('#mdoses .dnav [data-md="dprev"] svg'));

  /* 30: the adherence card states its formula; each medication shows its own 30-day share */
  reset(`[{id:1,n:'Hep',t:['09:00'],on:true,s:keyOff(-3)},{id:2,n:'Hiç',t:['09:00'],on:true,s:keyOff(-3)}]`,`[${[1,2,3].map(i=>`{m:1,day:keyOff(-${i}),slot:'09:00',st:'t'},{m:2,day:keyOff(-${i}),slot:'09:00',st:'s'}`).join()}]`);
  const rowOf=n=>$$("#view .row").find(r=>r.querySelector("b")?.textContent===n&&r.querySelector('[data-md^="edit:"]')).textContent;
  ok("30: one medication always taken shows %100, the always skipped one %0",rowOf("Hep").includes("son 30 gün %100")&&rowOf("Hiç").includes("son 30 gün %0"),[rowOf("Hep"),rowOf("Hiç")]);
  ok("30: the adherence card says how it is counted",$(".dd7").closest(".card").textContent.includes("alınan / (alınan + atlanan + işaretlenmeyen)"));

  /* 18: switching the reminder off can be undone; while off the Meds screen says so; switching on without medications opens the add sheet */
  reset(`[{id:1,n:'A',t:['09:00'],on:true}]`);ev("tab='settings-modules';render()");$('[data-md="toggle"]').click();
  ok("18: switching off leaves a 'Geri al' that switches it back on",ev("S.settings.medOn")===false&&($("#tundo").click(),ev("S.settings.medOn")===true));
  reset(`[{id:1,n:'A',t:['09:00'],on:true}]`,"[]","S.settings.medOn=false");ev("render()");
  ok("18: while off the Meds screen starts with 'Hatırlatıcı kapalı' and an 'Aç' button",ev("viewMeds()").includes("Hatırlatıcı kapalı")&&$("#view .card").textContent.includes("Hatırlatıcı kapalı")&&!!$('#view .card [data-md="toggle"]'));
  reset("[]","[]","S.settings.medOn=false");ev("tab='settings-modules';render()");$('[data-md="toggle"]').click();
  ok("18: switching on with no medications opens the add sheet",ev("S.settings.medOn")===true&&$("#sheet").classList.contains("on")&&!!$("#mn"));
  ev("medClose()");

  /* 25: the log limit warns once at 40 000 rows and trims the oldest days */
  {const L=require("../www/modules/meds/medlib.js"),meds=[{id:1,n:"A",t:["08:00"],on:true}],rows=[];
   for(let i=0;rows.length<L.MAXLOG;i++)rows.push({m:1,day:L.addDay("2020-01-01",Math.floor(i/1440)),slot:String(Math.floor(i%1440/60)).padStart(2,"0")+":"+String(i%60).padStart(2,"0"),st:"t"});
   rows.push({m:1,day:"2019-12-31",slot:"08:00",st:"s"});
   const out=L.cleanLog(rows,meds);
   ok("25: over the limit the oldest day goes first, even a row of it corrected later",out.length===L.MAXLOG&&!out.some(r=>r.day==="2019-12-31")&&out[0].day==="2020-01-01"&&out[0].slot==="00:00",out.length);}
  reset(`[{id:1,n:'A',t:['08:00'],on:true}]`);ev(`tab='today';S.medLog=Array.from({length:${40001}},(_,i)=>({id:i+1,m:1,day:MedLib.addDay('2000-01-01',i),slot:'08:00',st:'t'}));render()`);
  ok("25: at 40 001 rows Today says old medication records will be deleted, with a CSV button",$(".todo").textContent.includes("Eski ilaç kayıtları silinecek, CSV al")&&!!$('.todo [data-pv="export"]'));
  $('.todo [data-md="logok"]:not([data-pv])').click();
  ok("25: after 'Tamam' the warning does not come back",ev("S.settings.medLogWarn")===true&&!$(".todo")?.textContent.includes("Eski ilaç kayıtları"));
  finish();
})();
