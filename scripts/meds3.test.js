/* Medication notifications and reports: grouping, phone budget, doctor report medication table, button safety. */
const {ok,finish}=require("./ok");
const M=require("../www/modules/meds/medlib.js");
const {boot}=require("./html");
const Doc=require("../www/modules/insights/doctorlib.js"),Cyc=require("../www/modules/cycle/cyclelib.js"),fakeCanvas=require("./canvas.js");
const mk=(id,n,t=["08:00"],o={})=>({id,n,t,on:true,...o});
const now=new Date(2026,8,14,7,0);

/* Grouping: the same minute is one notification */
const trio=M.cleanMeds([mk(3,"C"),mk(1,"A"),mk(2,"B"),mk(4,"D",["12:00"])]);
const g=M.notifications(trio,[],now,1,true),g0=g.find(n=>n.id===1001000);
ok("group: doses of one minute are one notification with the count and names, the lowest id carries it",g.length===6&&g0.title===M.TITLE&&g0.body==="3 ilaç: A, B, C"&&g0.actionTypeId==="medgrp"&&g0.extra.g==="1_0800,2_0800,3_0800"&&g0.extra.m===1&&g0.extra.s==="08:00",g.map(n=>n.body));
ok("group: repeat reminders are grouped the same way and a lone dose keeps its own button",g.filter(n=>n.id>=2e6).every(n=>n.body==="3 ilaç: A, B, C"||n.body==="D")&&g.find(n=>n.body==="D"&&n.id<2e6).actionTypeId==="med"&&!g.find(n=>n.body==="D").extra.g);
const hid=M.notifications(trio,[],now,1,false).find(n=>n.id===1001000);
ok("group: with the name hidden only the count is written",hid.body==="3 ilaç saati geldi."&&!JSON.stringify(hid).includes('"A"'));
const wd=M.wakeDoses(g.filter(n=>n.id<2e6).map(n=>({id:n.id,extra:n.extra,body:n.body,schedule:{at:n.at}})),trio,true);
ok("group: the alarm screen still gets every dose with its own name",wd.filter(d=>d.at===g0.at.getTime()).map(d=>d.b).join()==="A,B,C"&&wd.length===4);
const part=M.notifications(trio,M.cleanLog([{m:2,day:"2026-09-14",slot:"08:00",st:"t"}],trio),now,1,true).find(n=>n.id===1001000);
ok("group: a logged dose leaves the group, a group of two stays a group",part.body==="2 ilaç: A, C"&&part.extra.g==="1_0800,3_0800");

/* Budget */
const it=(id,at,act)=>({id,schedule:{at:new Date(at)},extra:{act}}),D=864e5,t0=now.getTime();
const med=[...Array.from({length:5},(_,i)=>it(1e6+i,t0+(i+1)*D,"med")),...Array.from({length:4},(_,i)=>it(2e6+i,t0+i*3600e3,"med"))],oth=Array.from({length:3},(_,i)=>it(100+i,t0+i*1000,"water"));
const a=M.fit(med,oth,7,t0);
ok("budget: the next 48 h of medication, then the next 48 h of the others, then farther medication; repeats are dropped first",a.list.length===7&&a.list.filter(n=>n.id>=1e6&&n.id<2e6).length===4&&a.list.filter(n=>n.id<1e6).length===3&&a.nagCut===4&&a.mainCut===1&&a.otherCut===0&&a.list.every((n,i,l)=>!i||l[i-1].schedule.at<=n.schedule.at));
ok("budget: nothing is cut and no text when everything fits",(f=>f.list.length===12&&!f.mainCut&&!f.nagCut&&M.budgetText(f)==="")(M.fit(med,oth,440,t0)));
const b=M.fit(med,[],3,t0);
ok("budget: when medication itself does not fit the nearest doses stay and the text says how far they reach",b.mainCut===2&&b.list.length===3&&b.days===3&&M.budgetText(b).includes("3 gün")&&M.budgetText(M.fit(med,oth,9,t0)).includes("tekrar hatırlatmaları"),M.budgetText(b));

/* Doctor report: medication table */
const rep=M.cleanMeds([mk(1,"Pause İlaç",["08:00","20:00"],{on:false,ou:"2026-10-01",d:"5 mg",fed:"with"}),mk(2,"Aktif",["07:30"],{d:"1 tablet",q:{"07:30":{d:"2 tablet",p:2}},w:[1,3],s:"2026-08-01",e:"2026-12-31"}),mk(3,"İki günde",["09:00"],{iv:2,ia:"2026-09-01"})]);
const rr=Doc.medRows(rep);
ok("report table: active medications first, then the paused ones with their pause end",rr.map(r=>r.name).join()==="Aktif,İki günde,Pause İlaç"&&rr[2].tag.join()==="Yemekle,Ara verildi, 1 Eki 2026 tarihine kadar");
ok("report table: times carry their own dose and amount, days and start/end are written out",rr[0].times.join()==="07:30 · 2 tablet, 2 adet"&&rr[0].days==="Pzt, Çar"&&rr[0].dates.join()==="Başlangıç: 1 Ağu 2026,Bitiş: 31 Ara 2026"&&rr[1].days==="her 2 günde bir"&&rr[2].times.join()==="08:00 · 5 mg,20:00 · 5 mg"&&rr[2].days==="her gün");
{
  const {ctx,drawn}=fakeCanvas(s=>s.length*12),pg=Doc.listPages(rep,null,ctx);
  pg.draw(ctx,0);
  ok("report table: one page for a short list, names, doses and the pause are on it, no cycle title",pg.count===1&&["Kullandığım ilaçlar","Aktif","İki günde","Pause İlaç","Pzt, Çar"].every(t=>drawn.includes(t))&&!drawn.some(t=>t.includes("döngü")),drawn.slice(0,12));
  const many=M.cleanMeds(Array.from({length:20},(_,i)=>mk(i+1,"İlaç "+(i+1),["06:00","10:00","14:00","18:00","20:00","22:00"],{d:"1 tablet"}))),big=fakeCanvas(s=>s.length*12),bp=Doc.listPages(many,null,big.ctx);
  for(let i=0;i<bp.count;i++)bp.draw(big.ctx,i);
  ok("report table: 20 medications with 6 times continue on more pages and every medication is drawn once, the header repeats",bp.count>=2&&Array.from({length:20},(_,i)=>big.drawn.filter(t=>t==="İlaç "+(i+1)).length).every(n=>n===1)&&big.drawn.filter(t=>t==="Saatler ve dozlar").length===bp.count);
  const cy=fakeCanvas(s=>s.length*12),cp=Doc.listPages([],[["Son dönem başlangıçları","2 Eki 2026"]],cy.ctx);cp.draw(cy.ctx,0);
  ok("report: a cycle section is drawn only when passed, alone it needs no medication table",cp.count===1&&cy.drawn.includes("2 Eki 2026")&&!cy.drawn.includes("Kullandığım ilaçlar"));
}
const cr=Cyc.report([{id:1,s:"2026-07-01",e:"2026-07-05"},{id:2,s:"2026-07-29",e:"2026-08-02"},{id:3,s:"2026-08-27"}]);
ok("cycle lines: last starts with their length and the mean cycle length, no prediction",cr[0][1]==="27 Ağu 2026, 29 Tem 2026 (5 gün), 1 Tem 2026 (5 gün)"&&cr[1][1]==="29 gün (2 döngü)"&&cr.length===2&&Cyc.report([])===null,cr);

(async()=>{
  const sched=[];
  const w=await boot(w=>{w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),registerActionTypes:async()=>{},schedule:async x=>{sched.push(x)}}}}});
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  /* Button safety: Aldım is the main button, Atla is a quiet text button set 24 px away, undo has text */
  const css=require("fs").readFileSync(require("path").join(__dirname,"../www/app.css"),"utf8"),html=require("fs").readFileSync(require("path").join(__dirname,"../www/index.html"),"utf8");
  const sp5=+(/--sp-5:\s*(\d+)px/.exec(html+css)||[])[1],rule=(sel)=>(css.split(sel+"{")[1]||"").split("}")[0];
  ok("spacing token: --sp-5 is 24 px, Atla sits that far from Aldım on the lists and on the alarm screen",sp5===24&&/margin-left:var\(--sp-5\)/.test(rule(".chip.skip"))&&/gap:var\(--sp-5\)/.test(rule(".alact")));
  ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.meds=MedLib.cleanMeds([{id:1,n:'Sabah',t:['00:00'],on:true,s:keyOff(-3)}]);S.medLog=[];tab='today';render()`);
  let b=[...q("#view .todo .acts").children].map(e=>e.dataset.md.split(":")[0]+"."+e.className.replace(/\s+/g,"."));
  ok("Today row: Aldım is the filled button and comes first, Atla is a quiet one after it",b[0].startsWith("take")&&b[0].includes("go")&&b[1].startsWith("skip")&&b[1].includes("skip")&&!b[1].includes("go"),b);
  ev("tab='meds';render()");
  b=[...q("#view .mda").children].map(e=>e.dataset.md.split(":")[0]+"."+e.className.replace(/\s+/g,"."));
  ok("Meds screen row: same order and classes",b.length===2&&b[0].startsWith("take")&&b[0].includes("go")&&b[1].startsWith("skip")&&b[1].includes("skip"),b);
  q('#view [data-md^="skip"]').click();
  ok("after marking, the undo button says Geri al in words",q("#view .mda [data-md^='clear']").textContent.includes("Geri al"));
  /* Doctor sheet and the vitals screens */
  const seedDoc=(extra="")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.settings.bpOn=true;S.settings.bsOn=true;S.meds=MedLib.cleanMeds([${JSON.stringify(mk(1,"A"))}]);S.medLog=[];${extra};tab='today';render()`);
  seedDoc();
  ev("tab='bp';render()");
  ok("blood pressure screen: a Doktora PDF button sits next to Ölçüm ekle and opens the report sheet",!!q('#view [data-doc="open"]')&&q('#view [data-doc="open"]').textContent.includes("Doktora PDF"));
  q('#view [data-doc="open"]').click();
  const chips=[...w.document.querySelectorAll('#sheet [data-doc^="days:"]')].map(e=>e.dataset.doc);
  ok("report sheet: 7, 14, 30 and 90 day periods, 30 selected",chips.join()==="days:7,days:14,days:30,days:90"&&q('[data-doc="days:30"]').getAttribute("aria-pressed")==="true");
  q('[data-doc="days:7"]').click();
  ok("report sheet: choosing 7 days is kept",q('[data-doc="days:7"]').getAttribute("aria-pressed")==="true");
  ok("report sheet: no cycle switch without a cycle record",!q('[data-doc="cycle"]'));
  ev("closeSheet();docSt=null");
  seedDoc("S.settings.cycleOn=true;S.cycle=[{id:1,s:'2026-09-01'}]");
  ev("tab='glucose';render()");
  ok("glucose screen has the same button",!!q('#view [data-doc="open"]'));
  q('#view [data-doc="open"]').click();
  const sw=q('[data-doc="cycle"]');
  ok("report sheet: the cycle switch exists, is off by default and is written down in privacy terms",!!sw&&sw.checked===false&&q("#sheet").textContent.includes("Varsayılan olarak rapora girmez"));
  sw.click();
  ok("report sheet: turning the cycle switch on is kept",q('[data-doc="cycle"]').checked===true);
  ev("closeSheet();docSt=null");
  /* Today list order: medication and measurement rows lead, backup warning after */
  seedDoc("S.settings.lastBackup=null;S.entries=Array.from({length:12},(_,i)=>({id:i+1,type:'water',day:dayKey(),v:200,t:'08:00'}));S.vitals=[];S.meds=MedLib.cleanMeds([{id:1,n:'Sabah',t:['00:00'],on:true,s:keyOff(-3)}])");
  const rows=[...q("#view .todo").querySelectorAll(".row")].map(r=>r.textContent);
  ok("Today: the medication row is the first job, before backup and other warnings",rows.length>0&&rows[0].includes("Sabah")&&rows.findIndex(r=>r.includes("Yedekle")||r.includes("yedek"))!==0,rows);
  const setMeds=m=>ev(`S.meds=MedLib.cleanMeds(${JSON.stringify(m)});render()`);
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.medOn=true;S.settings.medShowName=true;S.medLog=[];tab='today'");
  /* Same four times for 12 medications group into 4 notifications a day: medication fits, only some repeats do not. */
  setMeds(Array.from({length:12},(_,i)=>mk(i+1,"İlaç"+(i+1),["06:00","10:00","14:00","18:00"])));
  await ev("scheduleReminders()");
  let l=sched.pop().notifications;
  ok("schedule: 12 medications at the same times need 4 alarms a day; only the repeats are cut and the user is told",l.length===440&&(c=>c>=116&&c<=120)(l.filter(n=>n.id>=1e6&&n.id<2e6).length)&&l.some(n=>n.id>=2e6)&&q("#view").textContent.includes("bazı tekrar hatırlatmaları kurulmadı"),l.length);
  /* Distinct minutes: 1440 doses in 30 days, far over the budget. */
  setMeds(Array.from({length:12},(_,i)=>mk(i+1,"İlaç"+(i+1),["06","10","14","18"].map(h=>`${h}:${String(i*4).padStart(2,"0")}`))));
  await ev("scheduleReminders()");
  l=sched.pop().notifications;
  ok("schedule: at most 440 alarms, no repeats left; the other reminders only for the next 48 h, and Today says so",l.length===440&&!l.some(n=>n.id>=2e6)&&l.some(n=>n.id<1e6)&&l.filter(n=>n.id<1e6).every(n=>+new Date(n.schedule.at)-Date.now()<2*864e5)&&q("#view").textContent.includes("diğer hatırlatmaların yalnız önümüzdeki 2 günü"),l.length);
  ok("schedule: the user sees a warning on Today when the phone limit cuts medication reminders",q("#view").textContent.includes("İlaç hatırlatmaların sınırlı")&&q("#view").textContent.includes("gün ilerisine kadar"));
  setMeds([mk(1,"Tek")]);
  await ev("scheduleReminders()");
  ok("schedule: the warning goes away when everything fits",!q("#view").textContent.includes("İlaç hatırlatmaların sınırlı"));
  finish();
})();
