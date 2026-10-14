/* App lock: lock at startup with a fake AppLock plugin, authentication results, enabling it in settings and returning from the background. */
const {ok,finish}=require("./ok");
const {boot,until,flush}=require("./html");
async function open(lockOn,plugin,auth={ok:true},hide=false){
  const calls=[],res={auth,secure:true};
  const w=await boot(w=>{
    if(plugin)w.Capacitor={isNativePlatform:()=>true,Plugins:{AppLock:{status:async()=>({secure:res.secure}),authenticate:async o=>{calls.push("auth:"+o.title);return res.auth},setSecure:async o=>{calls.push("secure:"+o.on)}}}};
    if(lockOn){w.localStorage.setItem("nw_lockon","1");w.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{lockOn:true,hideRecents:hide}}))}
  });
  return {w,calls,res};
}
const authCount=calls=>calls.filter(c=>c.startsWith("auth")).length;
const lockOnState=w=>JSON.parse(w.localStorage.getItem("nw_state")).settings.lockOn;
(async()=>{
  let {w,calls}=await open(true,true);
  const $=s=>w.document.querySelector(s),root=w.document.documentElement;
  await until(()=>calls.includes("auth:NeoWell kilidi")&&$("#lock").hidden);
  ok("with the lock on, startup asks for authentication; on success the lock screen goes away and the content shows",calls.includes("auth:NeoWell kilidi")&&$("#lock").hidden&&!root.classList.contains("locked"),calls);
  ok("the lock does not touch FLAG_SECURE: the recent-apps preview stays open unless its own setting is on",calls.includes("secure:false")&&!calls.includes("secure:true"),calls);
  {const h=await open(true,true,{ok:true},true);await until(()=>h.calls.includes("secure:true"));
  ok("with the hide-recents setting on, the preview is blocked at start (FLAG_SECURE), independent of the lock",h.calls.includes("secure:true"),h.calls);}
  ({w}=await open(true,false));
  ok("without the plugin (browser) no lock is applied and the content stays visible",!w.document.documentElement.classList.contains("locked"));

  const c=await open(true,true,{ok:false,cancelled:true}),d=c.w.document;
  await until(()=>authCount(c.calls)===1);await flush();
  ok("a cancelled authentication keeps the lock screen, hides the content and shows a message",!d.querySelector("#lock").hidden&&d.documentElement.classList.contains("locked")&&/doğrula/i.test(d.querySelector("#lkm").textContent));
  c.res.auth={ok:true};d.querySelector("[data-lk=ask]").click();
  ok("the unlock button authenticates again and unlocks",await until(()=>d.querySelector("#lock").hidden&&!d.documentElement.classList.contains("locked")&&authCount(c.calls)===2));

  const p=await open(true,true);
  await until(()=>authCount(p.calls)>=1);
  p.res.auth={ok:false,none:true};
  p.w.document.documentElement.classList.add("locked");
  p.w.eval("lockAsk()");
  ok("when the phone has no screen lock the user is not locked out: the app lock turns off and is saved",await until(()=>p.w.eval("S.settings.lockOn")===false&&!p.w.document.documentElement.classList.contains("locked")&&lockOnState(p.w)!==true));

  const t=await open(false,true);
  const toggle=()=>{const el=t.w.document.createElement("input");el.type="checkbox";el.checked=true;el.setAttribute("data-lk","toggle");t.w.document.body.append(el);el.dispatchEvent(new t.w.Event("change",{bubbles:true}));return el};
  t.res.secure=false;let el=toggle();await flush();
  ok("without a phone screen lock the app lock cannot be turned on",t.w.eval("S.settings.lockOn")===false&&el.checked===false);
  t.res.secure=true;t.res.auth={ok:false,cancelled:true};el=toggle();await flush();
  ok("the app lock is not turned on when authentication fails",t.w.eval("S.settings.lockOn")===false&&el.checked===false);
  t.res.auth={ok:true};toggle();
  ok("the app lock turns on and is saved when authentication succeeds",await until(()=>t.w.eval("S.settings.lockOn")===true&&lockOnState(t.w)===true));

  const g=await open(true,true);
  await until(()=>authCount(g.calls)>=1);
  const vis=hidden=>{Object.defineProperty(g.w.document,"hidden",{configurable:true,get:()=>hidden});g.w.document.dispatchEvent(new g.w.Event("visibilitychange"))};
  let clock=g.w.Date.now();g.w.Date.now=()=>clock;
  vis(true);clock+=10000;vis(false);await flush();
  ok("returning after 10 s does not ask for the lock",g.w.document.querySelector("#lock").hidden);
  vis(true);clock+=40000;vis(false);
  ok("returning after more than 30 s asks for the lock again",await until(()=>authCount(g.calls)===2));
  g.w.eval("S.settings.lockGrace=300");
  vis(true);clock+=200000;vis(false);await flush();
  ok("with a 5 minute grace, returning after 200 s does not ask again",authCount(g.calls)===2);
  vis(true);clock+=400000;vis(false);
  ok("with a 5 minute grace, returning after 400 s asks again",await until(()=>authCount(g.calls)===3));
  ok("an invalid lockGrace in saved settings falls back to 30 s",g.w.eval("cleanSettings({lockGrace:7}).lockGrace")===30&&g.w.eval("cleanSettings({lockGrace:120}).lockGrace")===120);
  finish();
})();
