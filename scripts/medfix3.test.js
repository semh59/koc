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
  ok("21: 'Her N günde' shows only the interval and first-day fields and keeps the fold state",shown().join()==="mn,md,mt0,miv,mia"&&!$("#mmore").open,shown());
  $("#mmore").open=true;click('[data-md="fq:w"]');
  ok("21: 'Belirli günler' shows the day chips; an opened fold stays open across the redraw",!$('[data-md="wd:1"]').closest("[hidden]")&&$("#miv").closest("[hidden]")&&$("#mmore").open);
  reset("[{id:1,n:'A',t:['08:00'],on:true,k:20}]");ev("medOpen(1)");
  ok("21: editing a medication with stock opens the fold",$("#mmore").open);
  ok("21: per-time dose and amount boxes carry visible labels",$("#mq0").closest(".labf")&&$("#mpa0").closest(".labf"));

  /* 20: the interval counts from the chosen first-dose day */
  reset();ev("medOpen(0)");$("#mn").value="Gün aşırı";click('[data-md="fq:n"]');$("#miv").value="2";$("#mia").value=ev("keyOff(-1)");click('[data-md="save"]');
  ok("20: every 2 days with the first dose yesterday: no dose today, one tomorrow",ev("S.meds[0].ia")===ev("keyOff(-1)")&&ev("MedLib.dosesOn(S.meds,dayKey()).length")===0&&ev("MedLib.dosesOn(S.meds,keyOff(1)).length")===1,ev("JSON.stringify(S.meds)"));
  ok("20: the list says the next dose day",$("#view").textContent.includes("sıradaki: "+ev("fd(keyOff(1))")),$("#view").textContent);

  /* 22: the error is tied to its field */
  reset();ev("medOpen(0)");click('[data-md="save"]');
  ok("22: an empty name focuses the name field, marked invalid and described by the message",w.document.activeElement.id==="mn"&&$("#mn").getAttribute("aria-invalid")==="true"&&$("#mn").getAttribute("aria-describedby")==="mwarn");
  $("#mn").value="A";$("#mk").value="abc";click('[data-md="save"]');
  ok("22: a stock error opens the fold and moves the focus and the mark to the stock field",$("#mmore").open&&w.document.activeElement.id==="mk"&&!$("#mn").hasAttribute("aria-invalid"));
  reset();ev("medNearSheet()");$("#mdnear").value="12";click('[data-md="nearsave"]');
  ok("22: a wrong near number is an alert error on the field",$("#mdnearerr").getAttribute("role")==="alert"&&$("#mdnearerr").classList.contains("ferr")&&$("#mdnearerr").textContent.includes("rakam")&&w.document.activeElement.id==="mdnear");

  /* 23: the focus survives the redraws */
  reset("[{id:1,n:'A',t:['00:00'],on:true}]");$('[data-md="take:1:00:00"]').focus();click('[data-md="take:1:00:00"]');
  ok("23: after Aldım the focus stays inside the view",w.document.getElementById("view").contains(w.document.activeElement),w.document.activeElement.outerHTML);
  ev("medOpen(0)");click('[data-md="addtime"]');
  ok("23: 'Saat ekle' puts the focus on the new time field",w.document.activeElement.id==="mt1");
  $('[data-md="fq:w"]').focus();click('[data-md="fq:w"]');
  ok("23: a redraw keeps the focus on the control that was used",w.document.activeElement.dataset.md==="fq:w"&&w.document.activeElement.isConnected);

  /* 32: edit undo, close question, same name, delete hint, past-day time */
  reset("[{id:1,n:'A',t:['08:00'],on:true}]");ev("window.__rs=0;const rs0=scheduleReminders;scheduleReminders=(...a)=>{window.__rs++;return rs0(...a)}");
  ev("medOpen(1)");$("#mt0").value="09:00";click('[data-md="save"]');const rs1=ev("__rs");click("#tundo");
  ok("32: 'Geri al' after an edit brings the old time back and resets the reminders",ev("S.meds[0].t.join()")==="08:00"&&ev("__rs")>rs1,ev("JSON.stringify(S.meds)"));
  let asked="";ev("window.__confirmAuto=m=>{window.__asked=m;return false}");
  ev("medOpen(1)");click("#scrim");
  ok("32: an unchanged sheet closes on an outside tap without a question",!$("#sheet").classList.contains("on")&&!ev("window.__asked"));
  ev("medOpen(1)");$("#mn").value="B";click("#scrim");asked=ev("window.__asked")||"";
  ok("32: a changed sheet asks before an outside tap closes it",/kaydedilmez/.test(asked)&&$("#sheet").classList.contains("on"),asked);
  ev("window.__asked=''");click("#sheet [data-shx]");
  ok("32: the ✕ asks as well",/kaydedilmez/.test(ev("window.__asked"))&&$("#sheet").classList.contains("on"));
  ev("window.__asked='';medOpen(0)");$("#mn").value="a";click('[data-md="save"]');
  ok("32: a new medication named like an existing one asks first and saves nothing on no",/zaten var/.test(ev("window.__asked"))&&ev("S.meds.length")===1);
  ev("window.__asked='';medOpen(1)");click('[data-md="dup"]');click('[data-md="save"]');
  ok("32: a copy is not asked about the same name",!ev("window.__asked")&&ev("S.meds.length")===2);
  ev("medOpen(1)");click('[data-md="del"]');
  ok("32: the delete question tells how to keep the history",/Hatırlatma açık/.test(ev("window.__asked")));
  ev("delete window.__confirmAuto");
  const Y=ev("keyOff(-1)");reset(`[{id:1,n:'A',t:['00:00'],on:true,s:'${ev("keyOff(-5)")}'}]`);click('[data-md="dprev"]');ev("medTapAt=0");click(`[data-md="take:1:00:00:${Y}"]`);
  ok("32: Aldım on a past day opens the taken-time sheet",$("#sheet").classList.contains("on")&&!!$("#mat")&&ev(`S.medLog.some(r=>r.day==='${Y}'&&r.st==='t')`));
  finish();
})();
