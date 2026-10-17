/* Medication model: per-time dose and amount, every N days, meal relation, pause end, stock days and notices, copy, past days and time edit. */
const {ok,finish}=require("./ok");
const M=require("../www/modules/meds/medlib.js");
const {boot}=require("./html");
const D0="2026-09-01";

/* Migration: a medication saved before these fields exist reads back unchanged and behaves as before. */
const legacy={id:3,n:"Eski ilaç",d:"1 tablet",t:["08:00","20:00"],on:true,w:[1,3],s:D0,e:"2026-12-01",ts:{"20:00":"2026-09-05"},bp:true,k:12,p:2,h:[{u:"2026-09-10",t:["08:00"],on:true,w:[1]}]};
const mig=M.cleanMeds([JSON.parse(JSON.stringify(legacy))])[0];
ok("migration: an old medication is read back with the same fields and no new ones",JSON.stringify(mig,Object.keys(mig).sort())===JSON.stringify(legacy,Object.keys(legacy).sort())&&["q","iv","ia","fed","sd","kb","ou"].every(k=>!(k in mig)),mig);
ok("migration: old doses, dose text and amount behave as before",M.dosesOn([mig],"2026-09-07").length===1&&M.dosesOn([mig],"2026-09-16").length===2&&M.doseText(mig,"08:00")==="1 tablet"&&M.amt(mig,"20:00")===2);
const S0={meds:[mig],medLog:[]};M.mark(S0,3,"2026-09-14","08:00","t","08:01");
ok("migration: marking a dose takes the old per-dose amount from stock",S0.meds[0].k===10);

/* Per-time dose and amount */
const pt=M.cleanMeds([{id:1,n:"A",d:"1 tablet",t:["08:00","20:00"],on:true,p:1,k:10,q:{"08:00":{d:"2 tablet",p:2},"09:00":{d:"x"},"20:00":{}}}])[0];
ok("per-time: own dose text and amount, default otherwise, unknown or empty times dropped",M.doseText(pt,"08:00")==="2 tablet"&&M.doseText(pt,"20:00")==="1 tablet"&&M.amt(pt,"08:00")===2&&M.amt(pt,"20:00")===1&&Object.keys(pt.q).join()==="08:00");
const S1={meds:[pt],medLog:[]};const u=M.mark(S1,1,"2026-09-14","08:00","t");
ok("per-time: stock drops by that time's amount and undo restores it",S1.meds[0].k===8&&(u.undo(),S1.meds[0].k===10));
const bodies=M.notifications([pt],[],new Date(2026,8,14,0,0),1,true).filter(n=>n.title===M.TITLE).map(n=>n.body);
ok("per-time: the notification body carries that time's dose",bodies.join()==="A · 2 tablet,A · 1 tablet",bodies);

/* Every N days */
const ev3=M.cleanMeds([{id:1,n:"B",t:["08:00"],on:true,iv:3,ia:D0,w:[1]}])[0];
ok("every N days: doses fall on the fixed start day and every 3rd day, weekdays ignored",!ev3.w&&[D0,"2026-09-04","2026-09-07","2026-08-29"].every(d=>M.dosesOn([ev3],d).length===1)&&["2026-09-02","2026-09-03","2026-09-05"].every(d=>M.dosesOn([ev3],d).length===0));
const daily=M.cleanMeds([{id:1,n:"B",t:["08:00"],on:true,s:D0}])[0],chg=M.cleanMeds([M.revise(daily,{...daily,iv:2,ia:"2026-09-10"},"2026-09-10")])[0];
ok("every N days: switching from daily keeps the earlier days counted and the interval applies after",M.dosesOn([chg],"2026-09-05").length===1&&M.dosesOn([chg],"2026-09-09").length===1&&M.dosesOn([chg],"2026-09-10").length===1&&M.dosesOn([chg],"2026-09-11").length===0&&M.dosesOn([chg],"2026-09-12").length===1);
ok("every N days: an out-of-range interval or one without a start day is dropped",M.cleanMeds([{id:1,n:"B",t:["08:00"],iv:1,ia:D0},{id:2,n:"C",t:["08:00"],iv:99,ia:D0},{id:3,n:"D",t:["08:00"],iv:2}]).every(m=>!m.iv));

/* Meal relation, stock threshold, box */
ok("meal relation, threshold and box size are kept only when valid",(m=>m.fed==="full"&&m.sd===3&&m.kb===30)(M.cleanMeds([{id:1,n:"A",t:["08:00"],fed:"full",sd:3,kb:30}])[0])&&(m=>!m.fed&&!m.sd&&!m.kb)(M.cleanMeds([{id:1,n:"A",t:["08:00"],fed:"x",sd:0,kb:-1}])[0]));
const now=new Date(2026,8,14,7,0),lowMed=o=>M.cleanMeds([{id:1,n:"Gizli",t:["08:00"],on:true,...o}])[0];
ok("stock days: stock / daily use, weekly and every-N schedules scale it",M.stockDays(lowMed({k:10}))===10&&M.stockDays(lowMed({k:10,w:[1,2]}))===35&&M.stockDays(lowMed({k:10,iv:2,ia:D0}))===20&&M.stockDays(lowMed({k:10,t:["08:00","20:00"]}))===5);
const n7=M.notices([lowMed({k:7})],now,true);
ok("stock notice: 7 days by default, own threshold when set, one 09:00 notice that opens the Meds screen",n7.length===1&&M.notices([lowMed({k:8})],now,true).length===0&&M.notices([lowMed({k:8,sd:10})],now,true).length===1&&n7[0].at.getHours()===9&&n7[0].extra.tab==="meds"&&n7[0].body.includes("7 günlük")&&n7[0].id===1001900,n7);
ok("stock notice: the name is hidden when the setting is off",!JSON.stringify(M.notices([lowMed({k:3})],now,false)).includes("Gizli"));
const pz=lowMed({on:false,ou:"2026-09-20"});
ok("pause end: kept while off, notice at 09:00 on that day, dropped once on",pz.ou==="2026-09-20"&&M.notices([pz],now,true)[0].at.getDate()===20&&lowMed({ou:"2026-09-20"}).ou===undefined);

/* UI */
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  const click=s=>q(s).click(),text=()=>q("#view").textContent;
  const setup=(meds,log=[])=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.meds=MedLib.cleanMeds(${JSON.stringify(meds)});S.medLog=${JSON.stringify(log)};tab='meds';medDay='';render()`);
  const Y=ev("keyOff(-1)"),T=ev("dayKey()");
  const base={id:1,n:"Vit",t:["00:00"],on:true,s:ev("keyOff(-10)")};

  setup([base]);
  click('[data-md="edit:1"]');
  ok("sheet: name limit 60, name-in-notification question visible and off by default",q("#mn").maxLength===60&&!!q("#mshow")&&q("#mshow").checked===false);
  q("#mshow").checked=true;q("#mq0").value="3 damla";q("#mpa0").value="2";click('[data-md="fed:with"]');
  ok("sheet: choosing a meal relation keeps what was typed",q("#mq0").value==="3 damla"&&q('[data-md="fed:with"]').getAttribute("aria-pressed")==="true");
  q("#miv").value="2";q("#msd").value="4";q("#mkb").value="30";click('[data-md="save"]');
  const m=JSON.parse(ev("JSON.stringify(S.meds[0])"));
  ok("save: per-time dose, amount, meal relation, interval, threshold and box size are stored; the name switch is saved",m.q["00:00"].d==="3 damla"&&m.q["00:00"].p===2&&m.fed==="with"&&m.iv===2&&m.ia===T&&m.sd===4&&m.kb===30&&!m.w&&ev("S.settings.medShowName")===true,m);

  setup([{...base,iv:2,ia:ev("keyOff(-2)"),fed:"with",q:{"00:00":{d:"3 damla"}}}]);
  ok("Today row shows the time's dose and the meal relation",text().includes("00:00 · 3 damla · Yemekle"),text().slice(0,300));

  setup([{...base,k:5,kb:30}]);
  ok("low stock card shows the estimate and a quick box button",text().includes("5 günlük stok")&&text().includes("tahmini bitiş")&&!!q('[data-md="boxadd:1"]'));
  click('[data-md="boxadd:1"]');
  ok("quick box button adds the box and undo takes it back",ev("S.meds[0].k")===35&&(ev("undoLast()"),ev("S.meds[0].k")===5));
  click('[data-md="edit:1"]');click('[data-md="box"]');
  ok("box button in the sheet adds one box to the stock field",q("#mk").value==="35");

  setup([{...base,k:9,p:1,bp:true}]);
  click('[data-md="edit:1"]');click('[data-md="dup"]');
  ok("copy: a new medication sheet with the same name and no stock",q("#mn").value==="Vit"&&!q('[data-md="del"]')&&q("#mk").value==="");
  click('[data-md="save"]');
  const c=JSON.parse(ev("JSON.stringify(S.meds)"));
  ok("copy: saved as a second medication with its own id and no history",c.length===2&&c[1].id!==c[0].id&&c[1].n==="Vit"&&!c[1].h&&c[1].bp===true,c);

  setup([base],[{id:1,m:1,day:Y,slot:"00:00",st:"s"}]);
  click('[data-md="dprev"]');
  ok("past day: yesterday's doses are listed with their state",text().includes("Atlandı")&&!!q(`[data-md="take:1:00:00:${Y}"]`));
  click(`[data-md="take:1:00:00:${Y}"]`);
  ok("past day: a skipped dose can be marked taken on that day",ev(`S.medLog.find(x=>x.day==='${Y}').st`)==="t"&&ev("S.medLog.length")===1);
  ev("medTapAt=0");click(`[data-md="at:1:00:00:${Y}"]`);q("#mat").value="07:45";click('[data-md^="atsave:1"]');
  ok("past day: the taken time can be edited and undone",ev("S.medLog[0].at")==="07:45"&&(ev("undoLast()"),ev("S.medLog[0].at")===undefined));
  click(`[data-md="clear:1:00:00:${Y}"]`);
  ok("past day: a missed dose of yesterday can be marked skipped afterwards",ev("S.medLog.length")===0&&(click(`[data-md="skip:1:00:00:${Y}"]`),ev("S.medLog[0].st")==="s"&&ev("S.medLog[0].day")===Y));

  setup([base],[{id:1,m:1,day:T,slot:"00:00",st:"s"}]);
  ev("medTapAt=0");click('[data-md="take:1:00:00"]');
  ok("today: a skipped dose becomes taken with the current time",ev("S.medLog[0].st")==="t"&&/^\d\d:\d\d$/.test(ev("S.medLog[0].at")));

  setup([{...base,on:false,ou:Y}]);
  ev("tab='today';render()");
  ok("pause end: the Today list shows the reminder",!!q('[data-md="resume:1"]'));
  click('[data-md="resume:1"]');
  ok("pause end: Tekrar aç turns it on and clears the pause date",ev("S.meds[0].on")===true&&ev("S.meds[0].ou")===undefined);
  finish();
})();
