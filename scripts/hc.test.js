/* Hourly steps (Health Connect): the day value is the larger of phone and watch, not their sum; reading, permission and off state with a fake Health plugin. */
const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path");
const {boot,until,flush,build}=require("./html");
const html=build();
function open(seed,fake){
  const calls=[];
  return boot(w=>{
    if(fake)w.Capacitor={isNativePlatform:()=>true,Plugins:{Health:{
      status:async()=>({available:fake.available!==false,granted:fake.granted,sleep:fake.granted&&!fake.noSleep,hr:fake.granted&&!fake.noHr}),
      daily:async o=>{calls.push("daily:"+o.days.length);return fake.daily?fake.daily(o.days):{sleep:{},hrAvg:{},hrMin:{}}},
      request:async()=>{calls.push("request");fake.granted=fake.grantOnRequest===true;return {}},
      manage:async()=>{calls.push("manage")},
      steps:async o=>{calls.push("steps:"+o.days.length);return {days:fake.days(o.days)}}}}};
    if(seed)w.localStorage.setItem("nw_state",JSON.stringify(seed));
  },html).then(w=>({w,calls}));
}
(async()=>{
  let {w}=await open({entries:[],settings:{}}),ev=s=>w.eval(s);
  const d=ev("dayKey()");
  ev(`setSteps("${d}",100)`);ev(`setHc("${d}",500)`);
  let e=ev(`JSON.stringify(S.entries.find(x=>x.type==="steps"))`);e=JSON.parse(e);
  ok("when the watch is larger than the phone the day value is the watch's; they are not added (500, not 100 + 500)",e.v===500&&e.ph===100&&e.hc===500,e);
  ev(`setSteps("${d}",700)`);
  ok("when the phone is larger than the watch the phone's value is used",ev(`S.entries.find(x=>x.type==="steps").v`)===700);
  ev(`setSteps("${d}",0)`);
  ok("when the phone counter resets (sensor zero) the watch value stays",ev(`S.entries.find(x=>x.type==="steps").v`)===500);
  ev(`setHc("${d}",200)`);
  ok("if the watch value drops the day value drops too (source correction)",ev(`S.entries.find(x=>x.type==="steps").v`)===200);
  ok("writing the same value a second time changes nothing",ev(`setHc("${d}",200)`)===false&&ev(`setSteps("${d}",0)`)===false);

  ({w}=await open({entries:[],settings:{}}));ev=s=>w.eval(s);
  ev(`S.entries.push({id:S.nextId++,day:"${d}",time:"00:00",type:"steps",v:300,text:""})`);
  ev(`setHc("${d}",100)`);
  e=JSON.parse(ev(`JSON.stringify(S.entries.find(x=>x.type==="steps"))`));
  ok("a record without ph counts v as the phone value (300, the watch's 100 is smaller)",e.v===300&&e.ph===300&&e.hc===100,e);
  ev(`S.entries=[]`);
  ok("no record is opened when the watch is zero and there is no record",ev(`setHc("${d}",0)`)===false&&ev(`S.entries.length`)===0);
  ok("without the watch a record carries no hc",(ev(`setSteps("${d}",50)`),JSON.parse(ev(`JSON.stringify(S.entries[0])`)).hc===undefined));
  ev(`stepToday=100;hcToday=400;hcDay=dayKey()`);
  ok("today's display is the larger of phone and watch; manual additions go on top",ev(`stepsShown()`)===400);
  ev(`stepToday=900`);ok("when the phone is larger, the phone",ev(`stepsShown()`)===900);
  ev(`stepToday=null;hcToday=null`);ok("null when neither exists",ev(`stepsShown()`)===null);
  const cl=ev(`JSON.stringify(cleanEntries([{id:1,day:"${d}",time:"00:00",type:"steps",v:500,ph:100,hc:500,text:""},{id:2,day:"${d}",time:"00:00",type:"steps",v:5,ph:-3,hc:"x",text:""}]).out)`);
  const co=JSON.parse(cl);
  ok("reading from a backup keeps ph and hc, a malformed value is dropped",co[0].ph===100&&co[0].hc===500&&co[1].ph===undefined&&co[1].hc===undefined,co);

  // plugin: reads when on, does not touch it when off
  const days=ds=>Object.fromEntries(ds.map((k,i)=>[k,i===0?4321:i===2?900:undefined]).filter(x=>x[1]!==undefined));
  let fake={granted:true,days};
  let o=await open({entries:[],settings:{hcOn:true}},fake);w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("when on, 8 days of steps are read",o.calls.includes("steps:8"),o.calls);
  ok("today's watch value enters the display, past days are saved",ev(`hcToday`)===4321&&ev(`S.entries.filter(x=>x.type==="steps").length`)===2,ev(`JSON.stringify(S.entries)`));
  ok("it writes not only today but every day with a watch record",ev(`S.entries.some(x=>x.type==="steps"&&x.day===keyOff(-2)&&x.v===900)`));
  const n=o.calls.length;await ev(`hcSync()`);
  ok("it does not re-read within 60 s",o.calls.length===n);

  o=await open({entries:[],settings:{hcOn:false}},{granted:true,days});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("the plugin is not touched when the setting is off",o.calls.length===0,o.calls);

  o=await open({entries:[],settings:{hcOn:true}},{granted:false,days});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("no read without permission",!o.calls.some(c=>c.startsWith("steps")),o.calls);

  o=await open({entries:[],settings:{}},{granted:false,grantOnRequest:true,days});w=o.w;ev=s=>w.eval(s);
  ev(`tab="steps";S.entries.push({id:S.nextId++,day:dayKey(),time:"00:00",type:"steps",v:10,text:""});render()`);
  const t=w.document.querySelector("[data-hc=toggle]");t.checked=true;t.dispatchEvent(new w.Event("change",{bubbles:true}));await until(()=>o.calls.includes("steps:8"));
  ok("turning the switch on asks for permission, once granted the setting stays on and it reads",o.calls.includes("request")&&ev(`S.settings.hcOn`)===true&&o.calls.includes("steps:8"),o.calls);

  o=await open({entries:[],settings:{}},{available:false,granted:false,days});w=o.w;ev=s=>w.eval(s);
  ev(`tab="steps";S.entries.push({id:S.nextId++,day:dayKey(),time:"00:00",type:"steps",v:10,text:""});render()`);await flush();
  ok("without Health Connect (below Android 13) an explanation is shown instead of the switch",!w.document.querySelector("[data-hc=toggle]")&&/Android 14/.test(w.document.body.textContent),0);

  o=await open({entries:[],settings:{hcOn:true}},{granted:true,days});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);ev(`hcDay="2000-01-01"`);
  ok("after midnight yesterday's watch value does not count as today",ev(`hcNow()`)===null&&ev(`stepsShown()`)===null);
  const fk={granted:true,days};o=await open({entries:[],settings:{hcOn:true}},fk);w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);ok("with permission there is a value",ev(`hcNow()`)===4321);
  fk.granted=false;await ev(`hcSync(true)`);
  ok("if permission is revoked the watch value leaves the display",ev(`hcNow()`)===null);
  fk.granted=true;await ev(`hcSync()`);
  ok("without permission it is not retried more often than every 5 s, it does not wait 60 s",ev(`hcNow()`)===null);
  ev(`hcAt=0`);await ev(`hcSync()`);
  ok("when permission returns reading continues",ev(`hcNow()`)===4321);

  // sleep and pulse
  const dl=ds=>({sleep:{[ds[0]]:431,[ds[1]]:30,[ds[2]]:455},hrAvg:{[ds[0]]:68,[ds[1]]:70},hrMin:{[ds[0]]:51}});
  o=await open({entries:[],settings:{hcOn:true},sleep:[{day:new Date(Date.now()-2*864e5).toLocaleDateString("sv"),min:300,q:4}]},{granted:true,days,daily:dl});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  const d0=ev(`keyOff(0)`),d2=ev(`keyOff(-2)`);
  ok("sleep is written from the watch (src hc), under 60 minutes is skipped",ev(`S.sleep.find(x=>x.day==="${d0}").min`)===431&&ev(`S.sleep.find(x=>x.day==="${d0}").src`)==="hc"&&!ev(`S.sleep.some(x=>x.day===keyOff(-1))`),ev(`JSON.stringify(S.sleep)`));
  ok("a manually entered sleep record is not overwritten by the watch",ev(`S.sleep.find(x=>x.day==="${d2}").min`)===300&&ev(`S.sleep.find(x=>x.day==="${d2}").src`)===undefined);
  ok("daily pulse: average and minimum are saved, empty when there is no minimum",ev(`S.hr.find(x=>x.day==="${d0}").a`)===68&&ev(`S.hr.find(x=>x.day==="${d0}").m`)===51&&ev(`S.hr.find(x=>x.day===keyOff(-1)).m`)===undefined);
  ev(`S.sleep=[];S.hr=[];S.settings.hcFrom=keyOff(1);hcAt=0`);await ev(`hcSync(true)`);
  ok("deleted data (hcFrom) is not written back from the watch",ev(`S.sleep.length`)===0&&ev(`S.hr.length`)===0);
  o=await open({entries:[],settings:{hcOn:true}},{granted:true,noSleep:true,noHr:true,days,daily:dl});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("without the sleep and pulse permission no daily data is requested, steps are still read",!o.calls.some(c=>c.startsWith("daily"))&&o.calls.includes("steps:8"),o.calls);
  ev(`S.sleep=HabitLib.cleanSleep([{day:keyOff(-3),min:400,src:"hc"}]);hcApplyDaily({sleep:{[keyOff(-3)]:410}},[keyOff(-3)])`);
  ok("if the watch's sleep changes it is updated",ev(`S.sleep[0].min`)===410);
  // camera measurement saving and deleting
  ev(`plBpm=71;plSave()`);
  ok("a camera measurement is saved (day, time, beats)",ev(`S.pulse.length`)===1&&ev(`S.pulse[0].bpm`)===71&&/^\d\d:\d\d$/.test(ev(`S.pulse[0].time`)),ev(`JSON.stringify(S.pulse)`));
  Object.defineProperty(w.navigator,"mediaDevices",{value:{getUserMedia:async()=>{throw new Error("izin yok")}},configurable:true});
  ev(`plSheet()`);
  ok("the Pulse screen lists camera measurements and the daily pulse from the watch",/71/.test(w.document.querySelector("#sheet").textContent)&&/Kamerayla ölç/.test(w.document.querySelector("#sheet").textContent));
  await ev(`plStart()`);
  ok("if camera permission is not given the measurement does not start, the Pulse screen returns and the camera stays off",ev(`pl`)===null&&/Kamerayla ölç/.test(w.document.querySelector("#sheet").textContent));
  w.document.querySelector('[data-pl^="del:"]').click();
  ok("a camera measurement is deleted",ev(`S.pulse.length`)===0);
  const bs=ev(`JSON.stringify(buildState({entries:[],settings:{},pulse:[{day:"2026-10-01",time:"07:30",bpm:64}],hr:[{day:"2026-10-01",a:62,m:48}]}).S)`);
  const bo=JSON.parse(bs);
  ok("pulse and watch pulse survive a backup round trip",bo.pulse.length===1&&bo.pulse[0].bpm===64&&bo.hr[0].a===62&&bo.hr[0].m===48,[bo.pulse,bo.hr]);
  ev(`S.pulse=PulseLib.clean([{day:"2026-10-01",time:"07:30",bpm:64}]);S.hr=PulseLib.cleanHr([{day:"2026-10-01",a:62}])`);
  const pc=ev(`PV_CATS.find(c=>/Nabız/.test(c[0]))`);
  ok("privacy: the Pulse category is counted and deleting it does not bring it back from the watch",pc&&ev(`PV_CATS.find(c=>/Nabız/.test(c[0]))[1]()`)===2&&(ev(`PV_CATS.find(c=>/Nabız/.test(c[0]))[2]()`),ev(`S.pulse.length+S.hr.length`)===0&&ev(`S.settings.hcFrom`)===ev(`keyOff(1)`)));
  const csv=ev(`JSON.stringify(CsvLib.files(Object.assign({},S,{pulse:[{day:"2026-10-01",time:"07:30",bpm:64}],hr:[{day:"2026-10-01",a:62,m:48}]}),{exName:()=>"",vctx:()=>""}).find(f=>f.key==="nabiz").n)`);
  ok("table export: the pulse file has the camera and watch rows",csv==="2");

  const hp=fs.readFileSync(path.join(__dirname,"../assets/android/HealthPlugin.java"),"utf8"),pa=fs.readFileSync(path.join(__dirname,"patch-android.js"),"utf8");
  ok("Android: read-only permissions (no write), the permission usage screen is declared, the plugin is copied and registered",/android\.permission\.health\.READ_STEPS/.test(hp)&&!/WRITE_/.test(hp+pa)&&/health\.READ_STEPS/.test(pa)&&/health\.READ_SLEEP/.test(pa)&&/health\.READ_HEART_RATE/.test(pa)&&/READ_SLEEP/.test(hp)&&/READ_HEART_RATE/.test(hp)&&/BPM_AVG/.test(hp)&&/HEALTH_PERMISSIONS/.test(pa)&&/registerPlugin\(HealthPlugin\.class\)/.test(fs.readFileSync(path.join(__dirname,"../assets/android/MainActivity.java"),"utf8")));
  ok("Android: no manager below version 34, days are limited and an invalid day is rejected",/SDK_INT >= 34/.test(hp)&&/MAX_DAYS = 40/.test(hp)&&/in\.length\(\) > MAX_DAYS/.test(hp)&&/LocalDate\.parse\(in\.getString\(k\)\)/.test(hp)&&/days == null\) \{\s*call\.reject/.test(hp));
  finish();
})();
