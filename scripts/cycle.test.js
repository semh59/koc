/* Cycle tracking: cyclelib (validation, cleaning, prediction), backup round trip, privacy (Coach context, notification), notification ids. */
const {ok,finish}=require("./ok");
const {boot,until}=require("./html");
const C=require("../www/modules/cycle/cyclelib.js"),T="2026-10-06";
const add=(k,n)=>C.addDays(k,n);
const starts=(...ds)=>ds.map(s=>({s}));
const chain=lens=>{let d="2025-01-01";const r=[{s:d}];for(const l of lens){d=add(d,l);r.push({s:d})}return C.clean(r,T)};

{
  const e=x=>C.check(x,T).err,g=x=>C.check(x,T).row;
  ok("a valid start is accepted",!!g({s:"2026-09-10"})&&g({s:"2026-09-10"}).e===undefined);
  ok("a future start is rejected, today is accepted",!!e({s:"2026-10-07"})&&!!g({s:T}));
  ok("a malformed date is rejected",!!e({s:"2026-13-40"})&&!!e({s:"x"})&&!!e(null)&&!!e({s:"2026-02-30"}));
  ok("an end before the start, in the future or over 14 days is rejected",!!e({s:"2026-09-10",e:"2026-09-09"})&&!!e({s:"2026-10-05",e:"2026-10-07"})&&!!e({s:"2026-09-01",e:"2026-09-15"})&&!!g({s:"2026-09-01",e:"2026-09-14"}));
  ok("older than 5 years is rejected",!!e({s:"2021-01-01"})&&!!g({s:"2021-12-01"}));
  const r=g({s:"2026-09-10",flow:"heavy",sym:["cramp","zz","cramp","mood"],note:"  "+"a".repeat(200)});
  ok("flow and symptoms accept only known labels, the note is cut to 80 characters, an empty note is dropped",r.flow==="heavy"&&r.sym.join()==="cramp,mood"&&r.note.length===80&&g({s:T,note:" "}).note===undefined&&g({s:T,flow:"x"}).flow===undefined);
}
{
  const c=C.clean([{s:"2026-09-10",e:"2026-09-14"},{s:"2026-09-12"},{s:"2026-08-12"},{s:"2026-09-14"},{s:"2027-01-01"},null,"x",{s:"2026-09-20"}],T);
  ok("clean: overlapping, future and invalid are dropped, sorted, ids are 1..n",c.map(r=>r.s).join()==="2026-08-12,2026-09-10,2026-09-20"&&c.map(r=>r.id).join()==="1,2,3",c);
  ok("clean: non-array input returns empty, cleaning its own output changes nothing",C.clean(null,T).length===0&&C.clean({},T).length===0&&JSON.stringify(C.clean(c,T))===JSON.stringify(c));
  const many=Array.from({length:200},(_,i)=>({s:add("2021-12-01",i*20)})).filter(x=>x.s<=T);
  const m=C.clean(many,T);
  ok("clean: older than 5 years is pruned, at most 80 records",m.length<=80&&m.every(r=>C.diff(T,r.s)<=5*366)&&m.length>60,m.length);
  ok("overlap: true when a new record overlaps an existing one",C.overlap(c,{s:"2026-09-12"})&&C.overlap(c,{s:"2026-09-08",e:"2026-09-11"})&&!C.overlap(c,{s:"2026-09-15"}));
}
{
  ok("little data: no prediction with 0-1 cycle lengths",!C.predict([]).ok&&!C.predict(starts("2026-08-01")).ok&&!C.predict(starts("2026-08-01","2026-08-29")).ok);
  const p=C.predict(chain([28,28,28]));
  ok("regular 28 days: mean 28, deviation 0, plus or minus 2 days, not irregular",p.ok&&p.mean===28&&p.sd===0&&!p.irregular&&C.diff(p.to,p.from)===4,p);
  const last=chain([28,28,28]).pop().s;
  ok("the range is around the last start plus the mean",p.from===add(last,26)&&p.to===add(last,30));
  const q=C.predict(chain([26,30,26,30]));
  ok("mean and deviation are computed (28 +/- 2)",q.mean===28&&q.sd===2&&!q.irregular,q);
  const ir=C.predict(chain([21,40,24,45]));
  ok("an irregular cycle is flagged, the range widens",ir.irregular&&C.diff(ir.to,ir.from)>C.diff(p.to,p.from),ir);
  ok("only the last 6 cycles count",C.lengths(chain([40,40,40,28,28,28,28,28,28])).join()==="28,28,28,28,28,28");
  ok("a skipped record (over 60 days) does not spoil the mean",C.predict(chain([28,28,100,28])).mean===28);
  const f=C.fertile(p,last);
  ok("ovulation is 14 days before the next start, the window is -5/+1 days",f.ov===add(last,28-14)&&f.from===add(f.ov,-5)&&f.to===add(f.ov,1),f);
  ok("with deviation but regular (28 +/- 2): the next start comes from the mean",C.fertile(C.predict(chain([26,30,26,30])),chain([26,30,26,30]).pop().s).ov===add(chain([26,30,26,30]).pop().s,14));
  const g=C.fertile(p,T);
  ok("if the window is before today it shifts to the next cycle, no past date",f.to<T&&g.to>=T&&C.diff(g.ov,f.ov)%28===0&&C.diff(g.from,T)<28,g);
  ok("if the window is today or later it does not shift",C.fertile(p,f.to).ov===f.ov&&C.fertile(p,f.from).ov===f.ov);
  ok("little data: no ovulation and no window",C.fertile(C.predict([]))===null&&C.fertile(C.predict(starts("2026-08-01","2026-08-29")))===null&&C.fertile(null)===null);
  ok("irregular cycle: no dates are given, only irregular",JSON.stringify(C.fertile(ir))==='{"irregular":true}');
  ok("no ovulation from records older than 5 years",C.fertile(C.predict(C.clean(starts("2020-01-01","2020-01-29","2020-02-26"),T)))===null);
  ok("day of period: counted for an open last record newer than 14 days",C.dayOfPeriod([{s:"2026-10-04"}],T)===3&&C.dayOfPeriod([{s:"2026-10-04",e:"2026-10-05"}],T)===null&&C.dayOfPeriod([{s:"2026-09-01"}],T)===null);
  ok("reminder day: 2 days before the range, none if past or outside the window",(()=>{const pp={ok:true,from:"2026-10-20"};return C.remindDay(pp,T,30)==="2026-10-18"&&C.remindDay({ok:true,from:"2026-10-07"},T,30)===null&&C.remindDay({ok:true,from:"2026-12-20"},T,30)===null&&C.remindDay({ok:false},T,30)===null})());
}

boot().then(async w=>{
const ev=s=>w.eval(s);
ev("toast=()=>{}");
const SECRET="GIZLIDONGUNOTU";
const seed=()=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.cycleOn=true;S.settings.cycleRem=true;S.settings.age=30;S.cycle=CycleLib.clean([{s:'2026-07-01',e:'2026-07-05',flow:'heavy',sym:['cramp'],note:'${SECRET}'},{s:'2026-07-29'},{s:'2026-08-26'},{s:'2026-09-23',note:'${SECRET}'}],'2026-10-06')`);
{
  seed();
  const b=ev("buildState(JSON.parse(JSON.stringify(S)))");
  ok("backup round trip: cycle records and settings come back",JSON.stringify(b.S.cycle)===JSON.stringify(ev("S.cycle"))&&b.S.settings.cycleOn===true&&b.S.settings.cycleRem===true&&b.S.cycle.length===4);
  const bad2=ev(`JSON.stringify(buildState({entries:[],cycle:[{s:'2999-01-01'},{s:'2026-08-01',e:'2026-07-01'},{s:'zz'},{s:'2026-08-10'},{s:'2026-08-10'}],settings:{cycleRem:true}}).S)`);
  const o=JSON.parse(bad2);
  ok("restore validates: invalid and overlapping are dropped; without cycleOn the reminder is not enabled either",o.cycle.length===1&&o.cycle[0].s==="2026-08-10"&&o.settings.cycleOn===false&&o.settings.cycleRem===false,o);
  ok("off by default, a backup without the cycle field gives an empty list",ev("DEF.settings.cycleOn")===false&&ev("buildState({entries:[]}).S.cycle.length")===0);
}
{
  seed();ev("cConsent(true)");
  const msgs=JSON.stringify(ev("cMessages('merhaba')")),ctx=ev("CoachLib.contextText(cData())");
  ok("no cycle data in the Coach context and in the cMessages body",![msgs,ctx].some(t=>t.includes(SECRET)||/döngü|cycle|dönem/i.test(t)||t.includes("2026-07-29")),msgs.slice(0,300));
  ok("no ovulation or fertile window in the Coach context",![msgs,ctx].some(t=>/yumurtlama|doğurgan|fertil|ovul/i.test(t)));
  ok("it does not enter the widget or the CSV export",!/yumurtlama|doğurgan/i.test(JSON.stringify(ev("CsvLib.files(S,{exName:()=>'x',vctx:()=>'x'}).map(f=>f.build())")))&&!JSON.stringify(ev("CsvLib.files(S,{exName:()=>'x',vctx:()=>'x'}).map(f=>f.build())")).includes(SECRET));
}
{
  seed();
  const n=ev("cycNotif()");
  ok("the notification is set and its text is neutral (no topic or data)",n&&n.title==="Hatırlatma"&&!/adet|döngü|dönem|regl|cycle|period|yumurt|doğurgan|fertil|ovul/i.test(JSON.stringify([n.title,n.body]))&&n.schedule.at.getHours()===9,n);
  ev("S.settings.cycleRem=false");ok("no notification when the reminder is off",ev("cycNotif()")===null);
  ev("S.settings.cycleRem=true;S.settings.cycleOn=false");ok("no notification when the cycle is off",ev("cycNotif()")===null);
  ev("S.settings.cycleOn=true;S.settings.healthNote='hamileyim'");ok("no notification with a pregnancy marker",ev("cycNotif()")===null);
  const used=new Set(),rem=ev("S.settings.reminders.map(r=>r.id)");for(const id of rem)for(let i=0;i<30;i++)used.add(id*100+i);
  ok("id range: no clash with reminders (id*100+day), fasting 9100, guide 9001-9003 and medication (>=1e6)",!used.has(C.NID)&&![9001,9002,9003,9100].includes(C.NID)&&C.NID<1e6&&ev("Math.max(...S.settings.reminders.map(r=>r.id))")<90);
}
{
  seed();ev("S.settings.healthNote='';tab='cycle';render()");
  const v=()=>ev("document.querySelector('#view').textContent");
  ok("screen: prediction, note and calendar are visible",ev("!!document.querySelector('.cypr')")&&/tıbbi tavsiye değildir/.test(v())&&ev("document.querySelectorAll('.cyd').length")===31);
  ok("screen: without mood or sleep records there is no 'before the period' card",!/Dönemden önceki günler/.test(v()));
  {
    const sd=ev("S.cycle.map(r=>r.s).slice(-3)"),near=d=>sd.some(x=>[1,2,3,4,5].some(i=>ev("CycleLib.addDays('"+x+"',-"+i+")")===d)),mood=[];
    for(let d=ev("CycleLib.addDays('"+sd[0]+"',-5)");d<="2026-10-06";d=ev("CycleLib.addDays('"+d+"',1)"))mood.push({day:d,v:near(d)?2:4});
    ev("S.mood="+JSON.stringify(mood)+";render()");
    ok("screen: with mood records the card compares the 5 days before the period with the other days",/Dönemden önceki günler/.test(v())&&/ruh halin ortalama 2,0, diğer günlerde 4,0/.test(v()),v().slice(0,500));
    ev("S.mood=[]");
  }
  ev("S.settings.healthNote='hamileyim';render()");
  ok("with a pregnancy marker there is no prediction, a neutral note is shown",!ev("!!document.querySelector('.cypr')")&&/Hamilelik işareti/.test(v()));
  ev("S.settings.healthNote='';S.settings.cycleOn=false;render()");
  ok("when off the screen shows an off notice, no record list",/kapalı/.test(v())&&!/Geçmiş/.test(v()));
  ev("S.settings.cycleOn=true");
  ok("it is in the Privacy category list, deleting removes only the cycle",ev("PV_CATS.some(c=>c[0]==='Döngü kayıtları')")&&(ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Döngü kayıtları'))"),ev("S.cycle.length")===0));
}
{
  ev("localStorage.setItem('nw_state_usage','{\"x\":1}');localStorage.setItem('nw_bkpw_enc','xyz');tab='settings-data';render()");
  ev("document.querySelector('[data-act=\"reset\"]').click()");
  ok("Delete all data clears the nw_state_usage key",ev("localStorage.getItem('nw_state_usage')")===null);
  ok("Delete all data also clears the remembered backup password",ev("localStorage.getItem('nw_bkpw_enc')")===null);
}
{ // Privacy > Cycle records: only the records go, the setting stays, the pending cycle notification is cancelled
  seed();
  const log={cancel:[],sched:[]},old=w.Capacitor;
  w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[{id:9200}]}),getDeliveredNotifications:async()=>({notifications:[]}),cancel:async o=>{log.cancel.push(...o.notifications.map(n=>n.id))},schedule:async o=>{log.sched.push(...o.notifications.map(n=>n.id))}}}};
  await ev("scheduleReminders()");
  ok("the cycle notification is scheduled before deleting",log.sched.includes(9200),log.sched);
  log.cancel.length=0;log.sched.length=0;
  ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Döngü kayıtları'))");
  await until(()=>log.cancel.length);
  ok("deleting the category empties S.cycle, cycleOn and cycleRem are unchanged",ev("S.cycle.length")===0&&ev("S.settings.cycleOn")===true&&ev("S.settings.cycleRem")===true);
  ok("the pending cycle notification is cancelled and not rescheduled",log.cancel.includes(9200)&&!log.sched.includes(9200),log);
  w.Capacitor=old;
}
{ // daily symptoms, open period after 14 days, overdue note, skipped gaps, paused reminder
  const click=sel=>ev(`document.querySelector('${sel}').click()`),v=()=>ev("document.querySelector('#view').textContent");
  const cd=C.cleanDays([{day:"2026-10-05",sym:["nausea","zz","nausea"]},{day:"2026-10-05",sym:["cramp"]},{day:"2026-10-07",sym:["cramp"]},{day:"2026-10-01",sym:[]},{day:"2026-09-30",sym:["fatigue","breast"]},null,{day:"x",sym:["cramp"]}],T);
  ok("cleanDays: unknown, empty and future days dropped, one record per day (last wins), sorted",JSON.stringify(cd)==='[{"day":"2026-09-30","sym":["fatigue","breast"]},{"day":"2026-10-05","sym":["cramp"]}]'&&C.cleanDays(null,T).length===0,cd);
  ok("cleanDays: at most 800 days kept",C.cleanDays(Array.from({length:1000},(_,i)=>({day:C.addDays("2024-01-01",i%900),sym:["cramp"]})),"2027-01-01").length<=800);
  seed();ev("S.settings.healthNote='';tab='cycle';render()");
  const before=ev("JSON.stringify(S.cycle)");
  click('[data-cy="dsym:nausea"]');click('[data-cy="dsym:fatigue"]');
  ok("daily symptoms: saved for today without a period record, the period list is untouched",ev("JSON.stringify(S.cycleSym)")===`[{"day":"${ev("dayKey()")}","sym":["nausea","fatigue"]}]`&&ev("JSON.stringify(S.cycle)")===before&&ev("document.querySelector('[data-cy=\"dsym:nausea\"]').getAttribute('aria-pressed')")==="true");
  click('[data-cy="dsym:nausea"]');
  ok("daily symptoms: a second tap switches it off",ev("S.cycleSym[0].sym.join()")==="fatigue");
  ev("S.settings.healthNote='hamileyim';render()");click('[data-cy="dsym:smell"]');
  ok("daily symptoms: still works with a pregnancy marker",ev("S.cycleSym[0].sym.includes('smell')"));
  ev("S.settings.healthNote=''");
  const b=ev("buildState(JSON.parse(JSON.stringify(S)))");
  ok("daily symptoms: backup round trip",JSON.stringify(b.S.cycleSym)===ev("JSON.stringify(S.cycleSym)")&&ev("ArchiveLib.build(S,'2026-10-06').json.includes('cycleSym')")===false);
  ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Döngü kayıtları'))");
  ok("daily symptoms: deleting the cycle category removes them too",ev("S.cycleSym.length")===0&&ev("S.cycle.length")===0);
  // open period older than 14 days
  seed();ev("S.cycle=[{id:1,s:'2026-08-26',e:'2026-08-30'},{id:2,s:'2026-09-10'}];render()");
  ok("old open period: no 'bugün bitti', an end-date button and a hint on the row",!/Dönem bugün bitti/.test(v())&&/Bitiş tarihini gir/.test(v())&&/bitiş girilmedi, eklemek için dokun/.test(v()));
  click('[data-cy="edit:2"]');
  ok("old open period: the end picker is capped to 14 days from the start",ev("document.querySelector('#cye').max")==="2026-09-23");
  ev("document.querySelector('#cye').value='2026-09-14'");click('[data-cy="save"]');
  ok("old open period: the end date is saved",ev("S.cycle[1].e")==="2026-09-14");
  // overdue and skipped
  seed();ev("S.cycle=CycleLib.clean([{s:'2026-06-01'},{s:'2026-06-29'},{s:'2026-07-27'},{s:'2026-08-24'}],'2026-10-06');tab='cycle';render()");
  const late=ev("CycleLib.overdue(CycleLib.predict(S.cycle),dayKey())");
  ok("overdue: neutral note with the day count and 'hekimine danış', no interpretation",late>0&&v().includes(`Tahmin aralığı ${late} gün önce bitti; hekimine danış.`)&&!/hamile|gecik|test/i.test(v().match(/Tahmin aralığı[^.]*\./)[0]));
  ok("overdue: none when the range has not ended or there is no prediction",C.overdue({ok:true,to:"2026-10-10"},T)===0&&C.overdue({ok:false},T)===0&&C.overdue(null,T)===0);
  ev("S.settings.healthNote='hamileyim';render()");
  ok("overdue: never shown with a pregnancy marker",!/gün önce bitti/.test(v()));
  ev("S.settings.healthNote=''");
  ok("skipped gaps: counted over 60 days, the note shows with a prediction and with too little data",C.skipped(chain([28,100,28,28]))===1&&C.skipped(chain([28,28]))===0);
  ev("S.cycle=CycleLib.clean([{s:'2026-06-01'},{s:'2026-09-20'}],'2026-10-06');render()");
  ok("skipped gaps: note in the 'not enough data' branch",/Yeterli veri yok/.test(v())&&/1 aralık 15-60 gün dışında kaldığı için/.test(v()));
  ev("S.cycle=CycleLib.clean([{s:'2026-04-01'},{s:'2026-04-29'},{s:'2026-05-27'},{s:'2026-09-03'},{s:'2026-10-01'}],'2026-10-06');render()");
  ok("skipped gaps: note next to a prediction",ev("!!document.querySelector('.cypr')")&&/1 aralık 15-60 gün dışında/.test(v()));
  // paused reminder reason
  seed();ev("S.settings.healthNote='hamileyim';tab='settings-modules';render()");
  ok("paused reminder: the settings row says why",/Hamilelik işareti olduğu için hatırlatma durduruldu/.test(ev("document.querySelector('#view').textContent")));
  ev("S.settings.healthNote='';render()");
  ok("paused reminder: no such text without a pregnancy marker",!/hatırlatma durduruldu/.test(ev("document.querySelector('#view').textContent")));
}
finish();
});
