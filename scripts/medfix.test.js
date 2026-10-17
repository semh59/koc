/* Medication page fixes: the 20-medication limit, edit keeps the start day, notification taps, double-dose day, stock, deletions, rescheduling order. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
const M=require("../www/modules/meds/medlib.js");
const unclock=require("./clock").at;

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

  /* 6: the tap day is stored, so yesterday's 20:00 dose tapped today at 21:00 is seen by today's 20:00 dose */
  {
    const restore=unclock(w,21);
    reset(`[{id:1,n:'A',t:['20:00'],on:true,s:'2026-01-01'}]`);
    ev("tab='today';render();globalThis.__asked=0;window.__confirmAuto=()=>{globalThis.__asked++;return false}");
    ev("medMark(1,'20:00','t',false,calOff(-1))");
    ok("yesterday's dose tapped on Today stores the tap day",ev("S.medLog[0].ad")===ev("calKey()")&&ev("S.medLog[0].day")===ev("calOff(-1)"));
    ev("medMark(1,'20:00','t',false,calKey())");
    ok("today's 20:00 dose right after it asks 'Yine de kaydedilsin mi?'",ev("globalThis.__asked")===1&&ev("S.medLog.length")===1);
    ev("medAtSheet(1,'20:00',calOff(-1));document.getElementById('mat').value='21:00';medAtSave(1,'20:00',calOff(-1))");
    ok("after 'Alınan saati düzenle' the row has no tap day (the time is the dose's own day)",ev("S.medLog[0].at")==="21:00"&&ev("S.medLog[0].ad")===undefined);
    ev("medMark(1,'20:00','t',false,calKey())");
    ok("then today's 20:00 dose is saved without asking",ev("globalThis.__asked")===1&&ev("S.medLog.length")===2);
    ok("cleanLog keeps the tap day",M.cleanLog([{m:1,day:"2026-01-01",slot:"20:00",st:"t",at:"21:00",ad:"2026-01-02"}],[{id:1}])[0].ad==="2026-01-02");
    ev("delete window.__confirmAuto");restore();
  }

  /* 29: stock texts, undo of a stock that hit 0, a card button without box size */
  reset(`[{id:1,n:'A',t:['00:00'],on:true,s:'2026-01-01',k:0}]`);
  ok("stock 0: the card says 'Stok bitti', not '0 günlük', and offers 'Stoğu güncelle' without a box size",/Stok bitti, yenisini al/.test($("#view").textContent)&&!/0 günlük/.test($("#view").textContent)&&!!$('[data-md="edit:1"][aria-label^="Stoğu güncelle"]'));
  ok("stock 0: the 09:00 notice says it ran out",/stok bitti/.test(M.notices(M.cleanMeds([{id:1,n:"A",t:["08:00"],on:true,k:0}]),new Date(2026,0,1,7),true)[0].body));
  reset(`[{id:1,n:'A',t:['00:00'],on:true,s:'2026-01-01',k:0.5}]`);
  ev("medMark(1,'00:00','t');medMark(1,'00:00',null)");
  ok("stock 0.5: Aldım then Geri al on the Meds screen gives 0.5 back, not 1",ev("S.meds[0].k")===0.5,ev("S.meds[0].k"));
  ev("medOpen(1)");
  ok("stock set, amount per dose empty: the form says one is counted",/Boşsa her dozda 1 adet sayılır/.test($("#sheet").textContent));
  ev("medClose()");

  /* 38: the blood-pressure label compares moments, not an app day with a calendar day */
  reset(`[{id:1,n:'A',t:['22:00'],on:true,bp:true}]`,`[{m:1,day:'2026-10-05',slot:'22:00',st:'t',at:'22:05'}]`);
  ok("day start 4: a 22:05 record and a 00:30 measurement say '2 sa 25 dk sonra'",ev("S.settings.dayStart=4;Meds.bpSince('2026-10-05','00:30')")==="Son ilaç kaydından 2 sa 25 dk sonra");
  ev("S.settings.dayStart=0");

  /* 2: a dose moved today still takes the tap from its old time's notification */
  {
    let restore=unclock(w,7);
    reset(`[{id:1,n:'A',t:['08:00'],on:true,s:'2026-01-01'}]`);
    ev("medOpen(1)");$("#mt0").value="09:00";click('[data-md="save"]');
    restore();restore=unclock(w,8);
    const r=ev("JSON.stringify(medIngest([{m:1,s:'08:00',t:Date.now()+60000}]))");
    ok("08:00 moved to 09:00 at 07:00: the 08:00 notification's 'Aldım' marks today's 08:00 dose",ev("MedLib.statusOf(S.medLog,1,calKey(),'08:00')")==="t"&&/"n":1/.test(r),r);
    w.Capacitor={Plugins:{QuickLog:{take:async()=>({items:[{m:1,s:'10:00',t:Date.now()}]})}}};
    await ev("quickIngest()");
    ok("a tap that cannot be recorded is told: 'N dokunuş kaydedilemedi'",/1 dokunuş kaydedilemedi, İlaçlar'dan işaretle/.test($("#tmsg").textContent),$("#tmsg").textContent);
    delete w.Capacitor;restore();
  }

  /* 12: a new wake-up while the double-dose question is open drops the question and keeps the rows marked here */
  {
    const restore=unclock(w,8);
    reset(`[{id:1,n:'A',t:['06:00','07:50'],on:true,s:'2026-01-01'},{id:2,n:'B',t:['07:50'],on:true,s:'2026-01-01'}]`,`[{m:1,day:calKey(),slot:'06:00',st:'t',at:'07:30',ad:calKey()}]`);
    ev("S.settings.medShowName=true;alarmOpen()");
    click('#alarm [data-al="t:1"]');click('#alarm [data-al="t:0"]');
    ok("alarm: the double-dose question is open",!!$("#alarm .alask"));
    ev("alarmOpen()");
    ok("alarm refreshed: the question is gone, the row marked here stays as 'Alındı'",!$("#alarm .alask")&&ev("alarm.ask")===null&&/B/.test($("#albody").textContent)&&ev("alarm.items.find(i=>i.m===2).st")==="t");
    ev("alarmClose()");restore();
  }

  finish();
})();
