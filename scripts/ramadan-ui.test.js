// Ramadan mode in the app: reminders move out of the fast, the notes and the approval-only suggestions, the table end, the bayram row, the widget field.
const {ok,finish}=require("./ok");
const {boot,until,flush}=require("./html");
const R=require("../www/modules/habits/ramadanlib.js");
const LAT=39.93,LON=32.86,p2=n=>String(n).padStart(2,"0"),m=t=>+t.slice(0,2)*60+ +t.slice(3,5);
const local=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`,today=local(new Date()),tomorrow=local(new Date(Date.now()+864e5));
const seed={settings:{obDone:true,noticeOk:true,heightCm:178,age:40,sex:"m",goalKg:78,kcal:2200,stepsAsked:true,medOn:true,fastInfoOk:true,riskClearedAt:today,
  ramOn:true,ramLat:LAT,ramLon:LON,ramName:"Ankara",ramFrom:today,ramSahur:true,ramIftar:true,waterMl:2500},
  entries:[],meds:[{id:1,n:"Antibiyotik",t:["08:00","14:00","21:00"],q:{"14:00":{d:"2 tablet"}},on:true},{id:2,n:"Gece",t:["22:00"],on:true}]};
const calls=[],errs=[],delivered=[{id:7000000},{id:7000001},{id:1999000}];
const rec=(p,defs)=>new Proxy({},{get:(_,k)=>k==="then"?undefined:k==="addListener"?()=>({remove(){}}):async a=>{calls.push([p+"."+k,a]);const v=defs[k];return typeof v==="function"?v(a):v||{}}});
boot(w=>{
  Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.addEventListener("error",e=>errs.push(e.message));
  w.localStorage.setItem("nw_state",JSON.stringify(seed));
  w.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",Plugins:{
    Widget:rec("WG",{}),MedWake:rec("MW",{fsi:{allowed:true}}),App:rec("App",{}),
    LocalNotifications:rec("LN",{checkPermissions:{display:"granted"},checkExactNotificationSetting:{exact_alarm:"granted"},getDeliveredNotifications:()=>({notifications:delivered}),getPending:{notifications:[]}})}};
}).then(async w=>{
  const ev=s=>w.eval(s),$=s=>w.document.querySelector(s),n=k=>calls.filter(c=>c[0]===k),click=s=>$(s).dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
  const realNow=w.Date.now,at=(day,t)=>R.dayAt(day,t),trDay=R.tr(Date.now()).day,tt=R.times(trDay,LAT,LON);
  const clock=ms=>{w.Date.now=()=>ms};
  const mins=d=>new Date(d).getHours()*60+new Date(d).getMinutes();
  const sched=async()=>{const c=n("LN.schedule").length;await ev("scheduleReminders()");return n("LN.schedule").slice(c).pop()[1].notifications};
  ok("the page opens without errors",errs.length===0,errs);

  {
    const list=await sched(),im=R.times(tomorrow,LAT,LON),ft=m(im[1]),w1=x=>list.find(l=>l.id===x*100+1),mv=list.find(l=>l.id===501);
    ok("water reminders: none lands inside the fast, three are spread after iftar and keep the +bardak button",[2,3,4].every((x,k)=>{const l=w1(x);return l&&mins(l.schedule.at)===(m(R.shift(im,"water",{2:"11:30",3:"14:30",4:"17:30"}[x],k)))&&l.actionTypeId==="water"})&&mins(w1(2).schedule.at)===ft+30&&mins(w1(3).schedule.at)===ft+120,list.filter(l=>l.id<500).map(l=>[l.id,mins(l.schedule.at)]));
    ok("motion reminder: stays at 19:30 when iftar is earlier, otherwise an hour after iftar",mins(mv.schedule.at)===Math.max(19*60+30,ft+60),mins(mv.schedule.at));
    const sah=list.find(l=>l.id===7000002);
    ok("sahur and iftar notifications are scheduled (calculated mode says to compare with the official calendar)",sah&&sah.title==="Sahur"&&/Resmî takvimle karşılaştır/.test(sah.body),sah);
    ok("delivered sahur and iftar notifications are not cleaned like medication ones, a stale medication one is",!n("LN.removeDeliveredNotifications").some(c=>c[1].notifications.some(x=>R.isNid(x.id)))&&n("LN.removeDeliveredNotifications").some(c=>c[1].notifications.some(x=>x.id===1999000)),n("LN.removeDeliveredNotifications"));
  }
  { // inside the fast
    clock(at(trDay,p2(Math.floor((m(tt[0])+180)/60))+":"+p2((m(tt[0])+180)%60)));
    ev("tab='today';widgetLast='';render()");
    const note=$("#view").textContent;
    ok("Today: the water ring says water is not drunk in the fasting hours and offers to spread the goal; the goal itself is untouched",/Oruç saatinde su içilmiyor/.test(note)&&/Su hedefini iftar ile sahur arasına yay/.test(note)&&ev("S.settings.waterMl")===2500);
    click('#view [data-ram="water"]');
    ok("approving keeps the goal and shows the per-hour plan; the switch in Settings can undo it",ev("S.settings.ramWater")&&ev("S.settings.waterMl")===2500&&/saatte yaklaşık \d+ ml/.test($("#view").textContent)&&!/Su hedefini iftar ile sahur arasına yay/.test($("#view").textContent));
    ev("S.settings.ramWater=false;render()");
    const wc=n("WG.update").pop()[1];
    ok("widget: the iftar time is pushed while the fast runs",wc.iftarAt===at(trDay,tt[1]),wc);
    ok("gym: one neutral line while fasting",/Oruçluyken baş dönmesi olursa bırak, hekimine danış/.test(ev("Habits.fastNote()")));
    ev("tab='meds';render()");
    const mc=[...w.document.querySelectorAll("#view .card")].find(c=>/Ramazan ve ilaç saatleri/.test(c.textContent))?.textContent||"";
    ok("Meds: the suggestion lists the new times, only for the medication with times in the fast, and nothing is changed before the approval",/Antibiyotik/.test(mc)&&/08:00 → \d\d:\d\d/.test(mc)&&/14:00 → \d\d:\d\d/.test(mc)&&!/Gece/.test(mc)&&ev("S.meds[0].t.join()")==="08:00,14:00,21:00",mc);
    ev("S.settings.ramMedsNo=false");
    let shown=0;w.confirm=()=>{shown++;return true};
    click('[data-md="ramgo:1"]');await until(()=>ev("S.settings.ramMeds[1]"));await flush();
    const sa=R.medMap(["08:00","14:00"],tt);
    ok("approving moves the times, keeps the dose text of the moved time, remembers the old times",ev("S.meds[0].t.join()")===[...new Set(["08:00","14:00","21:00"].map(x=>sa[x]||x))].sort().join()&&ev("S.meds[0].q['"+sa["14:00"]+"'].d")==="2 tablet"&&JSON.stringify(ev("S.settings.ramMeds[1]"))===JSON.stringify(sa));
    ok("the other medication and the history stay as they were: the old schedule applies to earlier days",ev("S.meds[1].t.join()")==="22:00"&&ev("S.meds[0].h.length")===1&&ev("S.meds[0].h[0].t.join()")==="08:00,14:00,21:00");
    await flush();
    const after=await sched();
    ok("the reminders follow the new times",after.some(l=>l.id>=1e6&&l.id<2e6&&l.extra&&l.extra.s===sa["08:00"]));
    click('[data-md="ramback:1"]');await flush();
    ok("one medication goes back alone: old times return, the record is gone",ev("S.meds[0].t.join()")==="08:00,14:00,21:00"&&!ev("S.settings.ramMeds[1]")&&ev("S.meds[0].q['14:00'].d")==="2 tablet");
  }
  { // after the fast
    clock(at(trDay,p2(Math.floor((m(tt[1])+60)/60))+":"+p2((m(tt[1])+60)%60)));
    ev("tab='today';widgetLast='';render()");
    ok("after iftar: no fasting note, no iftar field in the widget",!/Oruç saatinde su içilmiyor/.test($("#view").textContent)&&!("iftarAt" in n("WG.update").pop()[1])&&ev("Habits.fastNote()")==="");
  }
  { // table that ends soon, then ended
    const il=R.CITIES.findIndex(c=>c[0]==="Ankara"),days={};
    for(let i=0;i<3;i++){const d=R.addDay(trDay,i),t=R.times(d,LAT,LON);days[d]=[t[0],"23:00"]}
    w.localStorage.setItem("nw_ram",JSON.stringify({il,at:Date.now()-3*864e5,max:50,n:3,days}));
    clock(realNow());ev("ramCache=undefined;S.settings.ramWater=true;tab='today';render()");
    const t0=[...w.document.querySelectorAll("#view .row")].map(r=>r.textContent).find(t=>/Diyanet|doğrula/i.test(t))||"";
    ok("a table that ends soon is announced with the last verification age",/Diyanet tablosu 2 gün sonra bitiyor/.test(t0)&&/son doğrulama 3 gün önce/.test(t0),t0.slice(0,400));
    const rem=ev("Habits.ramReminders(Date.now(),0,6)");
    ok("after the table the reminders continue from the calculation and say to compare",rem.length>=8&&rem.some(r=>/Resmî takvimle karşılaştır/.test(r.body))&&rem.some(r=>!/karşılaştır/.test(r.body)),rem.length);
    ev("ramCache=null;S.settings.ramWater=false");
  }
  { // bayram
    clock(Date.UTC(2027,2,12,9));ev("S.settings.ramFrom='2027-02-20';tab='today';render()");
    ok("after bayram starts the card suggests closing, and says the medication times come back by approval",/Ramazan bitti mi/.test($("#view").textContent)&&/eski saatlere dönmeyi önereceğim/.test($("#view").textContent));
    ev("S.settings.ramFrom='2027-03-12'");clock(Date.UTC(2027,2,13,9));ev("render()");
    ok("no bayram row when the mode was opened after Ramadan",!/Ramazan bitti mi/.test($("#view").textContent));
    clock(realNow());
    ev("S.settings.ramFrom='"+today+"';S.settings.ramMeds={1:{'08:00':'04:30'}};S.meds[0].t=['04:30','14:00','21:00'];S.meds[0].q={};S.settings.ramOn=false;tab='meds';render()");
    ok("when the mode is off the shifted medication offers to go back",/Ramazan bitti/.test($("#view").textContent)&&/08:00 → 04:30/.test($("#view").textContent)&&!!$('[data-md="ramback:1"]'));
    ev("tab='today';render()");
    ok("...and Today asks, only offering",/eski saatlerine döndürelim mi/.test($("#view").textContent)&&ev("S.meds[0].t[0]")==="04:30");
  }
  finish();
});
