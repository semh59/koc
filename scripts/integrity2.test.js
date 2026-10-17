/* Data integrity round 2: edit sheets keep stored values, moves between days, day start CSV and widget, medication dose versions, course end, yesterday's dose, time change. */
const {ok,finish}=require("./ok");
const {boot,flush,clockAt}=require("./html");
const M=require("../www/modules/meds/medlib.js");
const C=require("../www/modules/data/csvlib.js");
const mk=(o={})=>({id:1,n:"A",t:["08:00"],on:true,...o});
const D0="2026-09-14",D1="2026-09-13",D2="2026-09-15";
const doses=(m,day)=>M.dosesOn(M.cleanMeds([m]),day).map(x=>x.slot).join();

/* Dose versions */
{
  const was=mk({d:"10 mg",p:1}),o={...was,d:"20 mg",p:2};
  M.revise(was,o,D0);
  const m=M.cleanMeds([o])[0];
  ok("dose text change: past days keep the old dose, today the new one",M.doseText(m,"08:00",D1)==="10 mg"&&M.doseText(m,"08:00",D0)==="20 mg",m);
  ok("amount change: past days keep the old amount (stock and report)",M.amt(m,"08:00",D1)===1&&M.amt(m,"08:00",D0)===2);
  const old=M.cleanMeds([{...mk({d:"5 mg"}),t:["09:00"],h:[{u:D0,t:["08:00"],on:true}]}])[0];
  ok("an older version without dose fields shows the current dose (migration)",M.doseText(old,"08:00",D1)==="5 mg"&&!("q" in old.h[0]));
  const per=M.cleanMeds([mk({q:{"08:00":{d:"1 tablet",p:0.5}}})])[0],o2={...per,q:{"08:00":{d:"2 tablet",p:1}}};
  M.revise(per,o2,D0);
  const m2=M.cleanMeds([o2])[0];
  ok("per-time dose change is versioned too",M.doseText(m2,"08:00",D1)==="1 tablet"&&M.amt(m2,"08:00",D1)===0.5&&M.amt(m2,"08:00",D0)===1);
  const log=M.cleanLog([{m:1,day:D1,slot:"08:00",st:"t"}],[m]),S={meds:[{...m,k:10}],medLog:[]};
  M.mark(S,1,D1,"08:00","t");
  ok("stock follows the amount of that day",S.meds[0].k===9,S.meds[0].k);
}

/* Course end */
{
  const was=mk({s:"2026-09-01",e:"2026-09-10"}),o={...was};delete o.e;
  M.revise(was,o,D0);
  const m=M.cleanMeds([o])[0];
  ok("course end removed: the days before keep the old end, today and later have none",doses(m,"2026-09-12")===""&&doses(m,D0)==="08:00"&&doses(m,D2)==="08:00"&&doses(m,"2026-09-09")==="08:00",m);
  const ext=M.cleanMeds([{...was,e:"2026-09-30"}])[0];
  ok("a course end without versions still works (older record)",doses(ext,"2026-09-20")==="08:00"&&doses(ext,"2026-10-02")==="");
}

/* Time change keeps today's dose and reminder */
{
  const now=new Date(2026,8,14,7,0),was=mk({t:["08:00"]}),o={...was,t:["07:30"]};
  o.ts=M.sinceFor(was.t,o.t,was.ts,D0,"07:00");
  M.revise(was,o,D0);
  const dropped=M.keepToday(was,o,D0),m=M.cleanMeds([o])[0];
  ok("time moved: old time stays valid today, new time too (not passed yet), tomorrow only the new one",dropped.join()==="08:00"&&doses(m,D0)==="07:30,08:00"&&doses(m,D2)==="07:30"&&doses(m,D1)==="08:00",[dropped,m]);
  const n=M.notifications([m],[],now,2,true).filter(x=>x.id<2e6).map(x=>x.at.getHours()+":"+x.at.getMinutes()).join();
  ok("today's old time keeps its reminder",n==="7:30,8:0,7:30"||n.startsWith("7:30,8:0"),n);
  const o2={...m,t:["07:45"]};o2.ts=M.sinceFor(m.t,o2.t,m.ts,D0,"07:00");
  M.revise(m,o2,D0);M.keepToday(m,o2,D0);
  const m2=M.cleanMeds([o2])[0];
  ok("a second edit the same day drops the time added earlier today, keeps the original",doses(m2,D0)==="07:45,08:00"&&doses(m2,D1)==="08:00"&&doses(m2,D2)==="07:45",doses(m2,D0));
  const past=mk({t:["08:00"]}),p=({...past,t:["06:00"]});p.ts=M.sinceFor(past.t,p.t,undefined,D0,"07:00");
  M.revise(past,p,D0);M.keepToday(past,p,D0);
  const pm=M.cleanMeds([p])[0];
  ok("new time already past today starts tomorrow, today keeps the old time",doses(pm,D0)==="08:00"&&doses(pm,D2)==="06:00",doses(pm,D0));
}

/* CSV: day start, unit, exact numbers */
{
  const S={settings:{dayStart:3},entries:[{id:1,day:D0,time:"20:00",type:"food",v:100,text:"a"},{id:2,day:D0,time:"01:30",type:"food",v:50,text:"b"},{id:3,day:D0,time:"04:00",type:"water",v:200,text:""}],
    workouts:[],vitals:[],sleep:[],mood:[],fast:{log:[]},meds:[],medLog:[],moves:[],pulse:[],hr:[],measures:[{day:D0,k:"fat",v:24.5},{day:D0,k:"waist",v:90}],
    labs:[{id:1,day:D0,k:"x",n:"Test",v:0.012,u:"mg",lo:0.005,hi:0.5}]};
  const f=(k,o)=>C.files(S,{exName:x=>x,vctx:()=>""},o).find(x=>x.key===k).build().split("\r\n").slice(0,-1);
  const lg=f("kayitlar");
  ok("day start 3: the small hours sort after the evening of the same app day, header names the app day",lg[0].includes("tarih (uygulama günü);saat")&&lg.slice(1).map(r=>r.split(";")[1]).join()===",,04:00,20:00,01:30",lg);
  ok("body fat unit is %, other measures cm",lg.some(r=>/ölçü_yağ oranı;24,5;%;/.test(r))&&lg.some(r=>/ölçü_bel;90;cm;/.test(r)),lg);
  ok("lab value and range keep three decimals (point with intl)",f("tahlil")[1]===`${D0};Test;0,012;;mg;0,005;0,5`&&f("tahlil",{intl:true})[1]===`${D0},Test,0.012,,mg,0.005,0.5`,f("tahlil"));
  S.settings.dayStart=0;
  ok("day start 0: header unchanged",f("kayitlar")[0].includes("tarih;saat"));
}

(async()=>{
  const w=await boot(w=>{w.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{obDone:true,noticeOk:true,age:30}}));w.Capacitor={isNativePlatform:()=>true,Plugins:{}};w.eval(clockAt("2026-10-14T10:00:00"))});
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s),set=(s,v)=>{q(s).value=v},click=s=>q(s).click();
  const day=ev("dayKey()"),y=ev("keyOff(-1)"),y2=ev("keyOff(-2)");
  ev("S.settings.obDone=true;S.settings.noticeOk=true");

  /* Untouched edit keeps the stored value */
  const kilo=ev("add('weight',84.35).id");
  ev(`sheetEntry(${kilo})`);click('[data-go="entry"]');await flush();
  ok("weight edit saved untouched keeps 84.35",ev(`Log.find(x=>x.id===${kilo}).v`)===84.35);
  ev(`sheetEntry(${kilo})`);set("#ev","84,4");click('[data-go="entry"]');await flush();
  ok("weight edit with a typed value saves the typed value",ev(`Log.find(x=>x.id===${kilo}).v`)===84.4);

  ev("S.settings.gUnit='mmol';S.settings.bsOn=true;S.vitals=[{id:1,k:'s',day:'"+day+"',time:'08:00',g:126,ctx:'fasting',i:1}];tab='glucose';render()");
  click('[data-vt="edit:1"]');click('[data-vt="saveedit"]');await flush();
  ok("glucose edit untouched in mmol mode keeps 126 mg/dL",ev("S.vitals[0].g")===126,ev("S.vitals[0]"));
  ev("S.settings.gUnit=undefined;closeSheet()");

  ev("S.labs=[{id:1,day:'"+day+"',k:'x',n:'Test',v:0.012,u:'mg',lo:0.005,hi:0.5}];render()");
  ev("labEdit(1)");
  ok("lab edit sheet shows three decimals",q("#lev").value==="0,012"&&q("#lel").value==="0,005");
  click('[data-lab="editgo"]');await flush();
  ok("lab edit saved untouched keeps 0.012 and the range",ev("S.labs[0].v")===0.012&&ev("S.labs[0].lo")===0.005&&ev("S.labs[0].hi")===0.5,ev("S.labs[0]"));

  /* Sleep minutes, move removes the old day */
  ev(`S.sleep=[{day:'${y}',min:443,q:3}];S.mood=[{day:'${y}',v:2,t:'x'}];sheetSleep('${y}')`);
  click('[data-hb="sleepgo"]');await flush();
  ok("sleep edit untouched keeps 443 minutes",ev("S.sleep[0].min")===443,ev("S.sleep"));
  ev(`sheetSleep('${y}')`);set("#fday",y2);click('[data-hb="sleepgo"]');await flush();
  ok("sleep moved to another day: the old day record is gone",ev("JSON.stringify(S.sleep.map(x=>x.day))")===`["${y2}"]`,ev("S.sleep"));
  ev(`sheetMood('${y}')`);set("#fday",y2);click('[data-hb="moodgo"]');await flush();
  ok("mood moved to another day: the old day record is gone",ev("JSON.stringify(S.mood.map(x=>x.day))")===`["${y2}"]`,ev("S.mood"));

  /* Exercise bt flag */
  const sp=ev(`(()=>{const e=add('exercise',30,'Koşu',keyOff(-2));return e.id})()`);
  ok("exercise logged for a past day carries bt",ev(`Log.find(x=>x.id===${sp}).bt`)===true);
  ev(`sheetEntry(${sp})`);set("#eday",day);click('[data-go="entry"]');await flush();
  ok("exercise moved back to today loses bt",ev(`Log.find(x=>x.id===${sp}).bt`)===undefined);

  /* Second weight on a day */
  ev("S.entries=[]");
  const a=ev(`(()=>{const e=add('weight',80,'',keyOff(-1));e.time='08:00';return e.id})()`),b=ev(`(()=>{const e=add('weight',82);e.time='07:00';return e.id})()`);
  let asked=0;w.confirm=()=>{asked++;return false};
  ev(`sheetEntry(${b})`);set("#eday",y);click('[data-go="entry"]');await flush();
  ok("moving a weight onto a day that has one asks first; declined keeps it where it was",asked===1&&ev(`Log.find(x=>x.id===${b}).day`)===day);
  w.confirm=()=>true;
  ev(`sheetEntry(${b})`);set("#eday",y);set("#etime","09:00");click('[data-go="entry"]');await flush();
  ok("confirmed: the later time counts for the day",ev(`weights('${y}','${y}')['${y}']`)===82);

  /* Measure moved onto an existing one */
  ev(`S.measures=[{day:'${y}',k:'waist',v:90},{day:'${y2}',k:'waist',v:91}];msel='waist'`);
  asked=0;w.confirm=()=>{asked++;return false};
  ev(`sheetMeasures('${y2}')`);set("#fday",y);click('[data-ms="go"]');await flush();
  ok("moving a measure onto a day that has one asks; declined leaves both",asked===1&&ev("S.measures.length")===2&&ev(`S.measures.find(m=>m.day==='${y}').v`)===90);
  w.confirm=()=>true;
  ev(`sheetMeasures('${y2}')`);set("#fday",y);click('[data-ms="go"]');await flush();
  ok("confirmed: the moved value replaces that day's",ev("S.measures.length")===1&&ev(`S.measures[0].v`)===91);

  /* Barcode linked is covered in app.test; widget push carries the day start */
  const sent=[];w.Capacitor.Plugins.Widget={update:async d=>{sent.push(d)}};
  ev("S.settings.dayStart=3;widgetLast='';widgetPush()");
  ok("widget push carries the day start hour so the widget uses the app day",sent.length&&sent[sent.length-1].ds===3,sent);
  ev("S.settings.dayStart=0");

  /* Water reminders follow the app day */
  {
    const wb=await boot(x=>{x.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{obDone:true,noticeOk:true,age:30,dayStart:3,waterMl:2000}}));x.Capacitor={isNativePlatform:()=>true,Plugins:{}};x.eval(clockAt("2026-10-14T01:00:00"))});
    let list=[];
    wb.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},onTypes:async()=>{},schedule:async o=>{list=o.notifications}};
    const e=s=>wb.eval(s),yk=e("dayKey()");
    e(`add('water',2500,'','${yk}');S.settings.reminders.forEach(r=>{if([2,3,4].includes(r.id))r.on=true})`);
    await e("scheduleReminders()");
    const today=new Date(2026,9,14).toDateString();
    ok("at 01:00 with day start 3 the finished day's full water does not silence today's water reminders",list.some(n=>n.actionTypeId==="water"&&new Date(n.schedule.at).toDateString()===today),list.length);
  }

  /* Yesterday's unmarked dose in the Today list */
  ev(`S.settings.medOn=true;S.meds=[{id:1,n:'İlaç A',t:['08:00'],on:true,s:'${y2}'}];S.medLog=[];tab='today';render()`);
  const todo=ev("medTodo().join('')");
  ok("yesterday's unmarked dose is in the Today list as 'Dün işaretlenmedi' with the day on its buttons",todo.includes("Dün işaretlenmedi")&&todo.includes(`data-md="take:1:08:00:${y}"`)&&todo.includes(`data-md="skip:1:08:00:${y}"`),todo);
  ev(`medMark(1,'08:00','s',false,'${y}')`);
  ok("skipping it removes it from the list",!ev("medTodo().join('')").includes("Dün işaretlenmedi"));

  /* Course end cleared in the edit sheet; time change toast */
  ev(`S.meds=[{id:1,n:'İlaç A',t:['12:00'],on:true,s:'${y2}',e:'${y}'}];medOpen(1)`);
  ok("edit sheet has the course end field filled",q("#me").value===y);
  set("#me","");click('[data-md="save"]');await flush();
  ok("clearing the course end in the edit sheet removes it",ev("S.meds[0].e")===undefined&&ev("S.meds[0].h[0].e")===y,ev("S.meds[0]"));
  ev("medOpen(1)");set("#mt0","13:00");click('[data-md="save"]');await flush();
  ok("changing the time keeps today's old time and says so",ev("MedLib.dosesOn(S.meds,dayKey()).map(x=>x.slot).join()")==="12:00,13:00"&&q("#tmsg").textContent.includes("Eski 12:00 saati bugün de çalar, yarından kalkar"),q("#tmsg").textContent);
  finish();
})();
