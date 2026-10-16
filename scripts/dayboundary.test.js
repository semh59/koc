/* Day start setting: app day vs calendar day, rollover that keeps the viewed date, "Dünkü güne taşı", sensor/medication on the calendar day. */
const {ok,finish}=require("./ok");
const {boot,until}=require("./html");
const at=(d,h,m=0)=>new Date(2026,9,d,h,m).getTime();

boot(w=>{
  w.eval(`{const D=Date;let o=0;window.__setNow=ms=>{o=ms-D.now()};Date=class extends D{constructor(...a){super(...(a.length?a:[D.now()+o]))}static now(){return D.now()+o}}}`);
  w.__setNow(at(7,2));
}).then(async w=>{
const ev=s=>w.eval(s),now=(d,h,m)=>w.__setNow(at(d,h,m));
ev("toast=()=>{}");
const fresh=(extra="")=>{ev(`S=structuredClone(DEF);S.settings.obDone=true;logOff=0;tab='today';${extra}`);ev("lastDay=dayKey()")};
const key=d=>`2026-10-${String(d).padStart(2,"0")}`;

{ // calendar vs app day
  fresh();
  ok("default start 00:00: the app day is the calendar day",ev("dayKey()")===key(7)&&ev("keyOff(0)")===key(7)&&ev("S.settings.dayStart")===0);
  ev("S.settings.dayStart=4");
  ok("start 04:00 at 02:00: the app day is yesterday, keyOff(0) equals it, the calendar day is unchanged",ev("dayKey()")===key(6)&&ev("keyOff(0)")===key(6)&&ev("keyOff(-1)")===key(5)&&ev("calKey()")===key(7)&&ev("calOff(-1)")===key(6)&&ev("addDays(0).getDate()")===6);
  ok("a Date passed in is a calendar date; dayAt() shifts a timestamp",ev("dayKey(new Date(2026,9,7))")===key(7)&&ev(`dayAt(${at(7,3)})`)===key(6)&&ev(`dayAt(${at(7,4)})`)===key(7));
  now(7,5);ok("after the start hour the app day is the calendar day",ev("dayKey()")===key(7)&&ev("keyOff(0)")===key(7));
  now(7,2);
}
{ // setting field
  fresh("tab='settings-profile';render()");
  const inp=()=>w.document.querySelector("#dayStart");
  ok("the setting is a field in Settings",!!inp()&&/Gün başlangıcı/.test(w.document.querySelector("#view").textContent));
  inp().value="4";inp().dispatchEvent(new w.Event("change",{bubbles:true}));
  ok("a value of 0-6 is saved and the day key follows",ev("S.settings.dayStart")===4&&ev("dayKey()")===key(6));
  inp().value="9";inp().dispatchEvent(new w.Event("change",{bubbles:true}));
  ok("a value outside 0-6 is refused",ev("S.settings.dayStart")===4);
  ok("a stored out-of-range value is reset on load",ev("buildState({entries:[],settings:{dayStart:12}}).S.settings.dayStart")===0&&ev("buildState({entries:[],settings:{dayStart:3}}).S.settings.dayStart")===3);
}
{ // write paths follow the setting
  fresh("S.settings.dayStart=4");
  ev("add('water',250)");
  ok("a new entry at 02:00 goes to the previous app day and shows on Today",ev("S.entries[0].day")===key(6)&&ev("sum('water',dayKey(),dayKey())")===250);
  now(7,5);ev("add('water',250)");
  ok("after the start hour a new entry goes to the calendar day",ev("S.entries[1].day")===key(7));
  now(7,2);
  w.Capacitor={isNativePlatform:()=>true,Plugins:{QuickLog:{take:async()=>({items:[{t:at(7,1,30),v:200}]}),ack:async()=>{}}}};
  fresh("S.settings.dayStart=4");
  await ev("quickIngest()");
  ok("a notification water button uses the same day as the + button",ev("S.entries.length")===1&&ev("S.entries[0].day")===key(6),ev("JSON.stringify(S.entries)"));
  w.Capacitor.Plugins.QuickLog.take=async()=>({items:[]});
  ev("S.fast.log=[{t0:"+at(6,20)+",t1:"+at(7,1)+"}]");
  ok("a fast that ended at 01:00 counts for the previous app day (history and list)",ev("HistoryLib.index(S,d=>dayAt(d.getTime())).get('"+key(6)+"')")!==undefined&&ev(`dayAt(${at(7,1)})`)===key(6));
}
{ // calendar group
  w.Capacitor={isNativePlatform:()=>true,Plugins:{StepCounter:{read:async()=>({steps:500,history:{},snapAt:1}),start:async()=>{}}}};
  fresh("S.settings.dayStart=4;S.settings.stepsOn=true");
  await ev("stepsSync()");
  ok("sensor steps are written to the calendar day, not the shifted day",ev("S.entries.some(e=>e.type==='steps'&&e.day==='"+key(7)+"'&&e.v===500)")&&!ev("S.entries.some(e=>e.type==='steps'&&e.day==='"+key(6)+"')"));
  ev("S.entries.push({id:50,day:'"+key(6)+"',time:'00:00',type:'steps',v:7000,ph:7000,text:''});S.nextId=60");
  ok("between midnight and the start hour the finished day's total is added to the ring",ev("stepsShown()")===7500,ev("stepsShown()"));
  ev("S.settings.medOn=true");
  ok("medication day stays the calendar day (doses, notifications and taps share it)",ev("medViewDay()")===key(7)&&ev("dayKey()")===key(6));
  ev("S.settings.ramOn=false");
  ok("the Ramadan day times are asked for the calendar day",/Habits\.dayTimes\(calKey\(\)\)/.test(require("fs").readFileSync(require("path").join(__dirname,"../www/modules/meds/medui.js"),"utf8")));
}
{ // rollover
  fresh();
  ev("S.entries=[{id:1,day:'"+key(1)+"',time:'09:00',type:'water',v:250,text:''}];S.nextId=2");
  now(7,12);ev("lastDay=dayKey();logOff=2;tab='today';render()");
  const viewed=ev("keyOff(-logOff)");
  now(8,12);ev("document.dispatchEvent(new Event('visibilitychange'))");
  ok("visibilitychange: a new day while a past day is shown keeps the same date on screen",ev("logOff")===3&&ev("keyOff(-logOff)")===viewed&&viewed===key(5)&&ev("lastDay")===key(8));
  now(9,12);ev("logOff=0");ev("document.dispatchEvent(new Event('visibilitychange'))");
  ok("on Today the view stays Today and the key is updated",ev("logOff")===0&&ev("lastDay")===key(9));
  now(7,2);fresh();
  ev("logOff=1;S.entries=[{id:1,day:'"+key(1)+"',time:'09:00',type:'water',v:250,text:''}]");
  const k0=ev("keyOff(-logOff)");
  ev("S.settings.dayStart=4");ev("dayRoll()");
  ok("changing the day start re-keys without throwing the user to Today",ev("lastDay")===key(6)&&ev("keyOff(-logOff)")===k0&&k0===key(6)&&ev("logOff")===0);
}
{ // "Dünkü güne taşı"
  fresh();
  ev("S.entries=[{id:1,day:'"+key(6)+"',time:'01:00',type:'water',v:250,text:''},{id:2,day:'"+key(7)+"',time:'09:00',type:'water',v:250,text:''}];S.nextId=3");
  ev("add('food',300,'Gece atıştırması')");
  ev("render()");
  const txt=()=>w.document.querySelector("#view").textContent;
  ok("between 00:00 and 04:00 the Today list offers 'Dünkü güne taşı'",/Dünkü güne taşı/.test(txt())&&!!w.document.querySelector('[data-act="lateyest"]'));
  w.document.querySelector('[data-act="lateyest"]').click();
  ok("the night entries of today move to yesterday; other days are not touched",ev("S.entries.find(e=>e.text==='Gece atıştırması').day")===key(6)&&ev("S.entries.find(e=>e.id===1).day")===key(6)&&ev("S.entries.find(e=>e.id===2).day")===key(7));
  ok("the offer is gone afterwards",!/Dünkü güne taşı/.test(txt()));
  now(7,5);ev("S.entries.push({id:90,day:'"+key(7)+"',time:'02:10',type:'water',v:250,text:''});render()");
  ok("after 04:00 there is no offer",!/Dünkü güne taşı/.test(txt()));
  now(7,2);ev("S.settings.dayStart=4;S.entries=[];render()");ev("add('water',250)");ev("render()");
  ok("with a day start after the hour there is no offer (the entry is already on the previous day)",!/Dünkü güne taşı/.test(txt())&&ev("S.entries[0].day")===key(6));
}
finish();
});
