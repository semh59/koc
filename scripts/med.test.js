const {ok,finish}=require("./ok");
const M=require("../www/modules/meds/medlib.js");
const med=(o)=>({id:1,n:"Ilac A",t:["08:00","20:00"],on:true,...o});

const cl=M.cleanMeds([med({}),med({id:1,n:"Aynı kimlik"}),{n:"",t:["08:00"]},{n:"Saatsiz",t:[]},{n:"Bozuk saat",t:["25:00","9:00"]},null,"x",med({id:2,n:"B",t:["22:00","08:00","08:00"]})]);
ok("cleanMeds: empty name, no times, bad time and null are dropped",cl.length===3&&cl.map(m=>m.n).join()==="Ilac A,Aynı kimlik,B",cl);
ok("cleanMeds: a clashing id gets a new unique id",new Set(cl.map(m=>m.id)).size===3&&cl[0].id===1);
ok("cleanMeds: times are sorted and unique",cl[2].t.join()==="08:00,22:00");
ok("cleanMeds: at most 20 medications, 6 times",M.cleanMeds(Array.from({length:30},(_,i)=>med({id:i+1,n:"M"+i}))).length===20&&M.cleanMeds([med({t:["01:00","02:00","03:00","04:00","05:00","06:00","07:00"]})])[0].t.length===6);
ok("cleanMeds: name 40 and dose 30 characters, blank dose dropped",(m=>m.n.length===40&&m.d.length===30)(M.cleanMeds([med({n:"a".repeat(80),d:"d".repeat(80)})])[0])&&M.cleanMeds([med({d:"  "})])[0].d===undefined);
ok("cleanMeds: weekdays; no field when all are selected, an invalid day is dropped",M.cleanMeds([med({w:[1,3,3,9,-1]})])[0].w.join()==="1,3"&&M.cleanMeds([med({w:[0,1,2,3,4,5,6]})])[0].w===undefined);
ok("cleanMeds: the end cannot be before the start",M.cleanMeds([med({s:"2026-09-10",e:"2026-09-01"})])[0].e===undefined&&M.cleanMeds([med({s:"2026-09-10",e:"2026-09-12"})])[0].e==="2026-09-12");
ok("cleanMeds: stock and per-dose amount limits",(m=>m.k===30&&m.p===0.5)(M.cleanMeds([med({k:30,p:0.5})])[0])&&M.cleanMeds([med({k:-1,p:0})])[0].k===undefined&&M.cleanMeds([med({k:-1,p:0})])[0].p===undefined);
ok("cleanMeds: on defaults to true, false is kept",M.cleanMeds([med({on:undefined})])[0].on===true&&M.cleanMeds([med({on:false})])[0].on===false);
ok("cleanMeds: cleaning its own output changes nothing",JSON.stringify(M.cleanMeds(cl))===JSON.stringify(cl));
ok("cleanMeds: non-array input returns empty",M.cleanMeds(null).length===0&&M.cleanMeds("x").length===0);

const meds=M.cleanMeds([med({}),med({id:2,n:"B",t:["09:00"]})]);
const lg=M.cleanLog([{m:1,day:"2026-09-10",slot:"08:00",st:"t",at:"08:05"},{m:1,day:"2026-09-10",slot:"08:00",st:"s"},{m:9,day:"2026-09-10",slot:"08:00",st:"t"},{m:1,day:"bozuk",slot:"08:00",st:"t"},{m:1,day:"2026-09-10",slot:"8:00",st:"t"},{m:1,day:"2026-09-10",slot:"20:00",st:"x"},null,{m:2,day:"2026-09-10",slot:"09:00",st:"t"}],meds);
ok("cleanLog: unknown medication and bad day/time/status are dropped; the latest entry wins for the same dose",lg.length===2&&lg[0].st==="s"&&lg[0].at===undefined&&lg[1].m===2,lg);
ok("cleanLog: deleting a medication deletes its log",M.cleanLog(lg,[meds[1]]).length===1);
ok("cleanLog: ids are 1..n",lg.map(x=>x.id).join()==="1,2");

const d1=M.dosesOn(meds,"2026-09-10");
ok("doses of the day are sorted by time",d1.map(x=>x.slot+x.m.id).join()==="08:001,09:002,20:001",d1.map(x=>x.slot));
ok("an off medication produces no doses",M.dosesOn(M.cleanMeds([med({on:false})]),"2026-09-10").length===0);
const wd=M.cleanMeds([med({w:[1]})]);// Monday only
ok("weekday filter (2026-09-14 Monday, 09-15 Tuesday)",M.dosesOn(wd,"2026-09-14").length===2&&M.dosesOn(wd,"2026-09-15").length===0);
const course=M.cleanMeds([med({s:"2026-09-10",e:"2026-09-12"})]);
ok("course: start and end days included, none outside",M.dosesOn(course,"2026-09-09").length===0&&M.dosesOn(course,"2026-09-10").length===2&&M.dosesOn(course,"2026-09-12").length===2&&M.dosesOn(course,"2026-09-13").length===0);

const mkS=()=>({meds:M.cleanMeds([med({k:10,p:2}),med({id:2,n:"Stoksuz",t:["09:00"]})]),medLog:[]});
let S=mkS();
M.mark(S,1,"2026-09-10","08:00","t","08:03");
ok("taken: an entry is added, stock drops by the per-dose amount",S.medLog.length===1&&S.medLog[0].st==="t"&&S.medLog[0].at==="08:03"&&S.meds[0].k===8);
M.mark(S,1,"2026-09-10","08:00","t","08:10");
ok("a second taken on the same dose does not lower stock again, one entry",S.medLog.length===1&&S.meds[0].k===8);
M.mark(S,1,"2026-09-10","08:00","s");
ok("taken to skipped: stock is restored",S.meds[0].k===10&&S.medLog[0].st==="s");
M.mark(S,1,"2026-09-10","08:00",null);
ok("the mark is removed (st=null)",S.medLog.length===0&&S.meds[0].k===10);
S=mkS();const u=M.mark(S,1,"2026-09-10","20:00","t");u.undo();
ok("undo: entry and stock return to the old state",S.medLog.length===0&&S.meds[0].k===10);
S=mkS();M.mark(S,1,"2026-09-10","20:00","s");const u2=M.mark(S,1,"2026-09-10","20:00","t");u2.undo();
ok("undo: returns to the previous skipped state",S.medLog.length===1&&S.medLog[0].st==="s"&&S.meds[0].k===10);
M.mark(S,2,"2026-09-10","09:00","t");
ok("no stock field is created for a medication without stock",S.meds[1].k===undefined);
S=mkS();for(let i=0;i<8;i++)M.mark(S,1,"2026-09-"+String(10+i).padStart(2,"0"),"08:00","t");
ok("stock does not go below zero",S.meds[0].k===0);
ok("a nonexistent medication cannot be marked",M.mark(S,77,"2026-09-10","08:00","t")===null);
ok("doses left: stock / per-dose amount",M.stockLeft({k:10,p:2})===5&&M.stockLeft({k:7})===7&&M.stockLeft({k:0.9,p:1})===0&&M.stockLeft({})===null);

const A=M.cleanMeds([med({})]);// 2 doses a day
const log=M.cleanLog([{m:1,day:"2026-09-10",slot:"08:00",st:"t"},{m:1,day:"2026-09-10",slot:"20:00",st:"s"},{m:1,day:"2026-09-11",slot:"08:00",st:"t"}],A);
let a=M.adherence(A,log,"2026-09-10","2026-09-11","2026-09-11","23:00");
ok("adherence: today's past-time unlogged dose is \"late\" until the day ends (not missed, not in the denominator)",a.total===3&&a.taken===2&&a.skipped===1&&a.missed===0&&a.late===1&&a.pct===67,a);
a=M.adherence(A,log,"2026-09-10","2026-09-12","2026-09-12","09:00");
ok("adherence: at 09:00 the next day yesterday's unlogged dose is missed, today's 08:00 is late",a.missed===1&&a.late===1&&a.total===4&&a.taken===2,a);
a=M.adherence(A,log,"2026-09-10","2026-09-11","2026-09-11","23:59");
ok("adherence: still late at 23:59",a.missed===0&&a.late===1,a);
const logLate=M.cleanLog([...log,{m:1,day:"2026-09-11",slot:"20:00",st:"t",at:"21:30"}],A);
a=M.adherence(A,logLate,"2026-09-10","2026-09-11","2026-09-11","23:00");
ok("adherence: once a late entry is added the dose counts as taken and late clears",a.late===0&&a.taken===3&&a.total===4&&a.pct===75,a);
ok("adherence: an old backup entry (without at) gives the same result",M.adherence(A,M.cleanLog(JSON.parse(JSON.stringify(log)),A),"2026-09-10","2026-09-11","2026-09-11","23:00").late===1);
a=M.adherence(A,log,"2026-09-10","2026-09-11","2026-09-11","12:00");
ok("adherence: a dose not yet due today is not counted",a.total===3&&a.taken===2&&a.missed===0&&a.pct===67,a);
a=M.adherence(A,log,"2026-09-10","2026-09-20","2026-09-11","08:00");
ok("adherence: future days and a dose exactly at its time",a.total===3&&a.taken===2,a);
ok("adherence: no percentage when there are no doses",M.adherence([],[],"2026-09-10","2026-09-11","2026-09-11","12:00").pct===null);
ok("adherence: days before the medication was added are not counted as missed (start date)",M.adherence(M.cleanMeds([med({s:"2026-09-11"})]),[],"2026-09-01","2026-09-12","2026-09-12","23:00").total===2);

const now=new Date(2026,8,10,12,0,0);// 10 Sep 2026 12:00
const N=M.notifications(A,[],now,3,true);
ok("notifications: no past dose today, 3 days after (main + 2 repeats)",N.length===15&&N.filter(n=>n.title==="💊 İlaç zamanı").length===5&&N[0].at.getHours()===20&&N.every(n=>n.at>now),N.length);
ok("alarm: channel, ongoing notification and repeats 10 / 20 min later",N.every(n=>n.channelId==="nw_med"&&n.ongoing===true)&&N[1].title==="💊 İlacını aldın mı?"&&N[1].at-N[0].at===600000&&N[2].at-N[0].at===1200000);
ok("alarm: medication and time are found from the id (main and repeat)",N.slice(0,3).every(n=>{const d=M.doseOfId(A,n.id);return d&&d.m.id===1&&d.slot==="20:00"})&&M.doseOfId(A,5)===null&&M.doseOfId(A,1000000+500*1000)===null);
const late=M.notifications(A,[],new Date(2026,8,10,20,5,0),1,true);
ok("alarm: dose time passed but a repeat is near: no main, 2 repeats",late.length===2&&late.every(n=>n.title==="💊 İlacını aldın mı?"));
ok("alarm: repeats of a taken dose are not scheduled either",M.notifications(A,M.cleanLog([{m:1,day:"2026-09-10",slot:"20:00",st:"t"}],A),new Date(2026,8,10,20,5,0),1,true).length===0);
const midn=M.notifications(M.cleanMeds([med({t:["23:55"]})]),[],new Date(2026,8,11,0,3,0),1,true);
ok("alarm: a repeat past midnight belongs to yesterday's dose",midn.some(n=>n.extra.s==="23:55"&&n.title==="💊 İlacını aldın mı?"&&n.at.getDate()===11)&&midn.every(n=>n.at>new Date(2026,8,11,0,3,0)));
ok("notification content: name, dose, action type and extra data",(n=>n.title==="💊 İlaç zamanı"&&n.body==="Ilac A"&&n.actionTypeId==="med"&&n.extra.act==="med"&&n.extra.m===1&&n.extra.s==="20:00")(N[0]));
ok("a generic text when the name is hidden",M.notifications(A,[],now,1,false)[0].body==="İlaç saatin geldi."&&!JSON.stringify(M.notifications(A,[],now,1,false)).includes("Ilac A"));
ok("the dose shows next to the name in the notification",M.notifications(M.cleanMeds([med({d:"10 mg"})]),[],now,1,true)[0].body==="Ilac A · 10 mg");
ok("no notification for a dose that already has a log entry",M.notifications(A,M.cleanLog([{m:1,day:"2026-09-10",slot:"20:00",st:"t"}],A),now,1,true).length===0);
ok("notification ids are unique and in a large range",(ids=>new Set(ids).size===ids.length&&ids.every(i=>i>=1e6&&i<2**31))(M.notifications(M.cleanMeds([med({id:1}),med({id:2,t:["10:00","11:00","12:30"]}),med({id:999,t:["23:00"]})]),[],new Date(2026,8,10,0,0,0),30,true).map(n=>n.id)));
ok("ids do not clash with normal reminder ids (1-1100)",M.notifications(A,[],now,30,true).every(n=>n.id>1100));
ok("an off or off-weekday medication produces no notification",M.notifications(M.cleanMeds([med({on:false})]),[],now,5,true).length===0&&M.notifications(wd,[],new Date(2026,8,15,0,0,0),1,true).length===0);
ok("notification ids stay unique over 60 days and the id layout cap is respected",(ids=>new Set(ids).size===ids.length)(M.notifications(M.cleanMeds(Array.from({length:12},(_,i)=>med({id:i+1,n:"M"+i,t:["06:00","10:00","14:00","18:00","22:00","23:00"]}))),[],new Date(2026,8,10,0,0,0),60,true).map(n=>n.id)));
ok("daylight saving day: the time is still right (2026-03-29 switch)",(l=>l.length===2&&l[0].at.getHours()===8)(M.notifications(M.cleanMeds([med({t:["08:00"]})]),[],new Date(2026,2,27,12,0,0),3,true).slice(0,2)));

const T=(y,mo,d,h,mi)=>new Date(y,mo-1,d,h,mi).getTime();
ok("button: same day (08:00 dose at 08:05)",M.dayForTap("08:00",T(2026,9,10,8,5))==="2026-09-10");
ok("button: a late tap past midnight belongs to the previous day's dose (23:30 dose at 00:10)",M.dayForTap("23:30",T(2026,9,11,0,10))==="2026-09-10");
ok("button: the notification fires at dose time; a tap at 08:00 on a 15:00 dose is yesterday's, at 16:00 today's",M.dayForTap("15:00",T(2026,9,10,8,0))==="2026-09-09"&&M.dayForTap("15:00",T(2026,9,10,16,0))==="2026-09-10"&&M.dayForTap("20:00",T(2026,9,10,19,0))==="2026-09-09");
ok("button: 22:00 dose; taps at night and until 21:59 the next day are yesterday's, at 22:00 today's",M.dayForTap("22:00",T(2026,9,11,3,0))==="2026-09-10"&&M.dayForTap("22:00",T(2026,9,11,21,59))==="2026-09-10"&&M.dayForTap("22:00",T(2026,9,11,22,0))==="2026-09-11");

const sd=M.cleanMeds([med({s:"2026-09-10",t:["08:00","20:00"],ts:{"20:00":"2026-09-12","09:00":"2026-09-01","08:00":"bozuk"}})])[0];
ok("cleanMeds: ts keeps only the medication's times and valid days; its output is stable",JSON.stringify(sd.ts)==='{"20:00":"2026-09-12"}'&&JSON.stringify(M.cleanMeds([sd])[0])===JSON.stringify(sd)&&M.cleanMeds([med({})])[0].ts===undefined);
ok("sinceFor: a new time starts today, a passed time tomorrow, an old time is kept, no field when none",JSON.stringify(M.sinceFor(["08:00"],["08:00","12:00","20:00"],{"08:00":"2026-09-01"},"2026-09-10","14:00"))==='{"08:00":"2026-09-01","12:00":"2026-09-11","20:00":"2026-09-10"}'&&M.sinceFor(["08:00"],["08:00"],undefined,"2026-09-10","14:00")===undefined);
{
  const m=[med({s:"2026-09-10",t:["08:00","20:00"],ts:{"08:00":"2026-09-11"}})];
  ok("dosesOn: the day before a time's start does not produce that time",M.dosesOn(m,"2026-09-10").map(x=>x.slot).join()==="20:00"&&M.dosesOn(m,"2026-09-11").map(x=>x.slot).join()==="08:00,20:00");
  const a=M.adherence(m,[],"2026-09-01","2026-09-12","2026-09-12","23:59");
  ok("adherence: days and doses before the start do not count (on the 10th only 20:00, on the 11th two doses; today the 12th counts as late)",a.total===3&&a.missed===3&&a.late===2,a);
  ok("notification: not scheduled for a time before its start",M.notifications(m,[],new Date(2026,8,10,6,0),2,true).every(n=>!(n.extra.s==="08:00"&&new Date(n.extra.at).getDate()===10)));
  const old=[med({t:["08:00"]})];
  ok("a record without s and ts counts past days as before",M.adherence(old,[],"2026-09-01","2026-09-10","2026-09-10","23:59").total===9);
}
// history is stable: switching off, deleting a time and changing the day do not erase old doses
{
  const base=M.cleanMeds([med({s:"2026-09-01",t:["08:00","20:00"]})])[0],D="2026-09-10";
  const run=(n,chg,before,after)=>{
    const m=M.cleanMeds([M.revise(base,{...base,...chg},D)])[0],cnt=d=>M.dosesOn([m],d).length;
    ok(`history is fixed: ${n}`,cnt("2026-09-09")===before&&cnt(D)===after,[cnt("2026-09-09"),cnt(D)]);
  };
  run("medication switched off",{on:false},2,0);
  run("20:00 time deleted",{t:["08:00"]},2,1);
  run("times changed",{t:["09:00","21:00"]},2,2);
  run("weekdays changed (Saturday only)",{w:[6]},2,0);
  const off=M.cleanMeds([M.revise(base,{...base,on:false},D)])[0],a=M.adherence([off],[],"2026-09-05","2026-09-12","2026-09-12","23:59");
  ok("past doses of a switched-off medication stay in the adherence denominator (5 days x 2)",a.total===10&&a.missed===10,a);
  ok("no notification for an off medication",M.notifications([off],[],new Date(2026,8,12,9,0),3,true).length===0);
  const twice=M.revise(M.cleanMeds([M.revise(base,{...base,on:false},D)])[0],{...base,t:["08:00"],on:false},D);
  ok("on a second change the same day the first version is kept; an unchanged record has no history",twice.h.length===1&&twice.h[0].t.length===2&&M.revise(base,{...base,n:"Yeni ad"},D).h===undefined);
  const re=M.cleanMeds([M.revise(M.cleanMeds([M.revise(base,{...base,on:false},"2026-09-10")])[0],{...base,on:true},"2026-09-15")])[0];
  ok("off-period gap: off days are not counted after re-enabling, before and after are",[["2026-09-09",2],["2026-09-12",0],["2026-09-15",2]].every(([d,n])=>M.dosesOn([re],d).length===n)&&JSON.stringify(M.cleanMeds([re])[0])===JSON.stringify(re));
}
{
  const hs=n=>M.cleanMeds([med({h:Array.from({length:n},(_,i)=>({u:`2026-08-${String(i+1).padStart(2,"0")}`,t:["08:00"],on:true}))})])[0].h;
  ok("schedule history keeps at most 24 versions; beyond that the oldest is dropped",hs(24).length===24&&hs(26).length===24&&hs(26)[0].u==="2026-08-03"&&hs(26)[23].u==="2026-08-26");
}
// screen wake-up: only main doses; diagnostic log lines and likely problems
{
  const L=M.notifications([med({t:["08:00"]})],[],new Date(2026,9,7,6,0),2,true).map(n=>({id:n.id,extra:n.extra,schedule:{at:n.at}}));
  const W=M.wakeTimes(L.concat([{id:7149,extra:{},schedule:{at:new Date()}},{id:101,schedule:{at:new Date()}}]));
  ok("wakeTimes: main dose ids [1e6,2e6); repeats (>=2e6) and other notifications are ignored",L.length===6&&W.length===2&&W.every(t=>new Date(t).getHours()===8&&new Date(t).getMinutes()===0),W);
  const T=(h,m,s)=>new Date(2026,9,7,h,m,s).getTime();
  const wk={t:T(14,2,3),a:"WAKE",p:T(14,2,0),kl:true,ia:false,wl:true,fs:"ok",ne:true,fsi:true,ci:4,mi:4,bo:true,ex:true};
  ok("wakeLine: a fired alarm shows time, planned time, delay, lock, screen and full-screen result",M.wakeLine(wk)==="07.10 14:02:03 alarm çaldı (planlanan 14:02:00, +3 sn), ekran kilitli, ekran kapalıydı, tam ekran bildirimi gönderildi",M.wakeLine(wk));
  const l2=M.wakeLine({...wk,k:"T",p:T(13,58,0),kl:false,ia:true,fs:"skip",ci:2,bo:false,fsi:false});
  ok("wakeLine: test alarm, minute delay, unlocked, low channel, missing permission and battery problems",/test alarmı çaldı \(planlanan 13:58:00, \+4 dk\), kilit açık, ekran açıktı, tam ekran bildirimi gerekmedi, tam ekran izni yok, ekran kanalı düşük önemde, pil kısıtı var/.test(l2),l2);
  ok("wakeLine: full-screen failure and the setup record",/gönderilemedi$/.test(M.wakeLine({...wk,fs:"err:SecurityException: x"}))&&!/SecurityException|java/i.test(M.wakeLine({...wk,err:"java.lang.IllegalStateException: y"}))&&M.wakeLine({t:T(9,0,0),a:"APP",in:3,n:3,nx:[T(14,0,0)]})==="07.10 09:00:00 uygulama alarmları kurdu: 3 alarm, ilk: 07.10 14:00"&&/BOOT|telefon açıldı/.test(M.wakeLine({t:T(9,0,0),a:"BOOT",in:0,n:0,nx:[]})));
  const ok0={ne:true,fsi:true,ci:4,mi:4,bo:true,ex:true},to=(st,it)=>M.wakeIssues(st,it).map(i=>i.to||"-").join();
  ok("wakeIssues: no problem when everything is fine and an alarm has fired",M.wakeIssues(ok0,[wk]).length===0);
  ok("wakeIssues: with Xiaomi lock screen and background window permissions off it points to the miui setting; -1 (unreadable) is not a problem",to({...ok0,xl:1,xp:1},[wk])==="miui,miui"&&M.wakeIssues({...ok0,xl:-1,xp:-1},[wk]).length===0&&M.wakeIssues({...ok0,xl:0,xp:0},[wk]).length===0);
  ok("wakeIssues: off notifications, blocked/low channel, full screen, battery, exact alarm each point to the matching setting",to({ne:false,ci:0,mi:2,fsi:false,bo:false,ex:false},[wk])==="notif,channel,channel,fsi,battery,exact"&&M.wakeIssues({...ok0,mi:2},[wk])[0].id==="nw_med");
  ok("wakeIssues: a channel that does not exist yet (-1) is not a problem",M.wakeIssues({...ok0,ci:-1,mi:-1},[wk]).length===0);
  ok("wakeIssues: with no record 'alarm never fired' points to autostart; zero scheduled gives a separate warning",to(ok0,[])==="autostart"&&/hiç çalmadı/.test(M.wakeIssues(ok0,[])[0].t)&&/Kurulu ekran alarmı yok/.test(M.wakeIssues(ok0,[{a:"APP",in:0,n:0}])[0].t));
  { // double-dose guard: records of different slots of the same medication within an hour
    const D="2026-10-07",ms=(t,day=D)=>new Date(...day.split("-").map((x,k)=>k===1?x-1:+x),...t.split(":").map(Number)).getTime();
    const lg=(slot,at,extra={})=>({id:1,m:1,day:D,slot,st:"t",at,...extra});
    const r1=M.recentTaken([lg("08:00","08:05")],1,D,"10:00",ms("08:30"));
    ok("recentTaken: a different slot taken 25 minutes ago is reported with the minutes",r1&&r1.min===25&&r1.slot==="08:00",JSON.stringify(r1));
    ok("recentTaken: a record older than an hour is not reported",M.recentTaken([lg("08:00","08:05")],1,D,"10:00",ms("09:20"))===null);
    ok("recentTaken: marking the same slot again replaces it, no warning",M.recentTaken([lg("08:00","08:05")],1,D,"08:00",ms("08:10"))===null);
    ok("recentTaken: slots planned 30 minutes apart do not ask",M.recentTaken([lg("08:00","08:05")],1,D,"08:30",ms("08:10"))===null);
    ok("recentTaken: skipped records, records without a time and other medications do not count",M.recentTaken([lg("08:00","08:05",{st:"s"}),lg("08:00",undefined),lg("08:00","08:05",{m:2})],1,D,"10:00",ms("08:30"))===null);
    ok("recentTaken: a late-night slot tapped after midnight is placed on the next day",(r=>r&&r.min===10)(M.recentTaken([lg("23:00","00:05")],1,"2026-10-08","01:30",ms("00:15","2026-10-08"))),M.recentTaken([lg("23:00","00:05")],1,"2026-10-08","01:30",ms("00:15","2026-10-08")));
    ok("recentTaken: a record in the future of now is ignored",M.recentTaken([lg("08:00","09:30")],1,D,"10:00",ms("08:30"))===null);
    ok("recentText: states the fact and that only own records are compared, never calls it safe or dangerous",/25 dakika önce/.test(M.recentText({min:25}))&&!/güvenli|tehlike|aşırı/.test(M.recentText({min:25})));
  }
  { // alarm screen evidence (AS/AE records)
    const w2={...wk,v:2},as={t:wk.t+900,a:"AS",kl:true},ae={t:wk.t+9000,a:"AE",ms:8100};
    ok("wakeLine: alarm screen opened and closed lines",/alarm ekranı açıldı \(ekran kilitliydi\)/.test(M.wakeLine(as))&&/alarm ekranı kapandı \(8 sn açık kaldı\)/.test(M.wakeLine(ae)));
    ok("wakeIssues: a full-screen notification sent but no alarm screen opened within 20 s is reported (new records only)",to(ok0,[w2])==="channel"&&M.wakeIssues(ok0,[wk]).length===0);
    ok("wakeIssues: with the alarm screen opened there is no such problem; one that closed within 1.5 s is reported",M.wakeIssues(ok0,[w2,as,ae]).length===0&&/hemen kapandı/.test(M.wakeIssues(ok0,[w2,as,{...ae,ms:700}])[0].t));
    ok("wakeIssues: AS/AE records do not count as a schedule record",M.wakeIssues(ok0,[w2,as]).length===0);
  }
  const armAt=(t,nx)=>({t,a:"APP",in:1,n:1,nx:[nx]});
  ok("wakeIssues: if the first alarm time passed with no firing record it says 'did not fire'; a reschedule before its time or a firing in between is not a problem",/Planlanan 07\.10 14:00 alarmı çalmadı/.test(M.wakeIssues(ok0,[wk,armAt(T(9,0,0),T(14,0,0)),armAt(T(18,0,0),T(20,0,0))]).map(i=>i.t).join())&&M.wakeIssues(ok0,[wk,armAt(T(9,0,0),T(14,0,0)),armAt(T(13,0,0),T(14,0,0))]).length===0&&M.wakeIssues(ok0,[armAt(T(9,0,0),T(14,0,0)),{...wk,t:T(14,0,1),p:T(14,0,0)},armAt(T(18,0,0),T(20,0,0))]).length===0);
  ok("wakeIssues: firing more than 1 min late and a full-screen failure are reported",/geç çaldı \(en çok \+5 dk\)/.test(M.wakeIssues(ok0,[{...wk,t:wk.p+300000}])[0].t)&&/gönderilemedi/.test(M.wakeIssues(ok0,[{...wk,fs:"err:X"}]).pop().t));
}
const src=require("fs").readFileSync(require("path").join(__dirname,"../www/modules/meds/medlib.js"),"utf8").replace(/\/\*[\s\S]*?\*\//g,"");
ok("dose advice and comment language is not used",!/öner|tavsiye|etkileşim|yan etki|aşırı doz|tehlikeli/i.test(src));
ok("cleanMeds: an impossible calendar day is not kept as a start day",M.cleanMeds([med({s:"2026-02-31"})])[0].s===undefined&&M.cleanMeds([med({s:"2026-02-28"})])[0].s==="2026-02-28");
ok("stock: quarter doses are not rounded to one decimal by cleanMeds",(m=>M.cleanMeds([m])[0].k===29.75&&M.cleanMeds([M.cleanMeds([m])[0]])[0].k===29.75)(med({k:29.75,p:0.25})));
ok("stock: a per-dose amount that rounds to zero is dropped",M.cleanMeds([med({p:0.004})])[0].p===undefined&&M.cleanMeds([med({p:0.5})])[0].p===0.5);
{const S2={meds:M.cleanMeds([med({k:30,p:0.25})]),medLog:[]};M.mark(S2,1,"2026-09-10","08:00","t");M.mark(S2,1,"2026-09-10","20:00","t");
 ok("stock: marks and a reload keep the same value",S2.meds[0].k===29.5&&M.cleanMeds(S2.meds)[0].k===29.5);}
{const per=M.adherenceDays(A,log,"2026-09-10","2026-09-12","2026-09-12","09:00"),sum=M.sumAdherence(per);
 ok("adherenceDays: one entry per day, summed equals adherence",per.map(d=>d.day).join()==="2026-09-10,2026-09-11,2026-09-12"&&JSON.stringify(sum)===JSON.stringify(M.adherence(A,log,"2026-09-10","2026-09-12","2026-09-12","09:00"))&&per[0].taken===1&&per[0].skipped===1&&per[2].late===1,per);}
{const rec=M.logIndex(log,"2026-09-11");
 ok("logIndex: finds a row by medication, day and time; days before `from` are left out",rec(1,"2026-09-11","08:00").st==="t"&&rec(1,"2026-09-10","08:00")===undefined&&rec(2,"2026-09-11","08:00")===undefined);}
ok("freeId: smallest unused id",M.freeId(new Set([1,2,4]))===3&&M.freeId(new Set())===1);
ok("hm and slotAt: HH:MM of a date, local date of a day and time",M.hm(new Date(2026,8,10,7,5))==="07:05"&&(d=>d.getFullYear()===2026&&d.getMonth()===8&&d.getDate()===10&&d.getHours()===23&&d.getMinutes()===55)(M.slotAt("2026-09-10","23:55")));
ok("mark: new log ids stay unique",(S3=>{M.mark(S3,1,"2026-09-10","08:00","t");M.mark(S3,1,"2026-09-10","20:00","t");M.mark(S3,1,"2026-09-11","08:00","s");return new Set(S3.medLog.map(x=>x.id)).size===3})({meds:M.cleanMeds([med({})]),medLog:[]}));
{ // blood-pressure label: time since the recorded dose of a medication marked bp
  const ms=[med({id:1,bp:true}),med({id:2,n:"Vitamin"})],D="2026-10-06";
  const lg=(m,at,day=D,st="t")=>({m,day,slot:"08:00",st,at});
  ok("bp: cleanMeds keeps bp:true and drops anything else",M.cleanMeds([med({bp:true}),med({id:2,bp:"x"}),med({id:3,bp:false})]).map(m=>m.bp).join()==="true,,");
  ok("bp: 2 h 20 min after the nearest earlier recorded dose",M.sinceDose(ms,[lg(1,"07:00"),lg(1,"08:30")],D,"10:50")==="Son ilaç kaydından 2 sa 20 dk sonra");
  ok("bp: under an hour shows minutes only, a whole hour no minutes",M.sinceDose(ms,[lg(1,"10:10")],D,"10:50")==="Son ilaç kaydından 40 dk sonra"&&M.sinceDose(ms,[lg(1,"08:50")],D,"10:50")==="Son ilaç kaydından 2 sa sonra");
  ok("bp: a measurement before the day's first record says before",M.sinceDose(ms,[lg(1,"09:00")],D,"07:30")==="İlaç kaydından önce");
  ok("bp: no marked medication, no record that day, skipped or unmarked-med rows give no label",M.sinceDose([med({id:2})],[lg(2,"07:00")],D,"10:00")===""&&M.sinceDose(ms,[],D,"10:00")===""&&M.sinceDose(ms,[lg(1,"07:00","2026-10-05")],D,"10:00")===""&&M.sinceDose(ms,[lg(1,"07:00",D,"s"),lg(2,"07:00")],D,"10:00")==="");
  ok("bp: a record without a tap time gives no label",M.sinceDose(ms,[{m:1,day:D,slot:"08:00",st:"t"}],D,"10:00")==="");
}
finish();
