/* Guided mode UI, logging, notification, keep-awake, voice prompts and settings. */
const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");
const errs=[];
boot(w=>{Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.addEventListener("error",e=>errs.push(e.message))}).then(async w=>{
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s),click=s=>q(s).click(),sh=()=>q("#sheet").textContent,gt=()=>q("#guide").textContent;
  const said=[],awk=[],ln=[],stops=[];let pend=[];
  w.Capacitor={Plugins:{
    Speech:{speak:async o=>{said.push(o.text)},stop:async()=>{stops.push(1)}},
    DeviceHelp:{keepAwake:async o=>{awk.push(o.on)}},
    LocalNotifications:{checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:pend}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async o=>{ln.push(["c",o.notifications.map(n=>n.id)])},schedule:async o=>{ln.push(["s",o.notifications])}}}};
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.gid=50;tab='gym';render()");

  {
    ok("settings: voice prompts and vibration default to on, a missing field means on, an explicit off is kept",ev("DEF.settings.gdVoice&&DEF.settings.gdVib")&&ev("cleanSettings({kcal:1800}).gdVoice&&cleanSettings({kcal:1800}).gdVib")&&ev("cleanSettings({gdVoice:false,gdVib:false}).gdVoice")===false&&ev("cleanSettings({gdVoice:false,gdVib:false}).gdVib")===false);
    ev("tab='settings-modules';render()");const v=q("[data-gdv]"),b=q("[data-gdb]");
    ok("Settings > Gym: the \"voice prompts in guided mode\" and vibration switches",v&&b&&v.checked&&b.checked&&v.closest("label").textContent.includes("Rehberli modda sesli komut"));
    v.checked=false;v.dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("turning a switch off writes the setting",ev("S.settings.gdVoice")===false);
    ev("S.settings.gdVoice=true;tab='gym';render()");
  }
  {
    ev(`S.templates=[{id:1,name:'Ev',ex:['plank','pushup'],tg:{plank:{sets:2,sec:30},pushup:{sets:2,reps:8}}}];render()`);
    click('[data-g="gdpick"]');
    ok("gym home: Start guided, at least 3 ready flows and the templates, general info / pain / doctor note",["5 dk ısınma","10 dk tüm vücut esneme","4 dk Tabata"].every(t=>sh().includes(t))&&sh().includes("Ev")&&sh().includes("fizyoterapiste")&&sh().includes("Genel bilgidir"));
    ok("all flow exercises are in EXDB",ev("GuideLib.FLOWS.every(f=>f.steps.every(s=>EXDB.some(e=>e.id===s.ex)))"));
    ev("closeSheet();gTplPreview(1)");
    ok("the template preview has Start guided",!!q('#sheet [data-g="gdgo:t:1"]'));
    ev("closeSheet();gPgSheet('home3')");
    ok("a ready program has Start guided for each day",!!q('#sheet [data-g="gdgo:p:home3-0"]')&&!!q('#sheet [data-g="gdgo:p:home3-2"]'));
    ev("closeSheet()");
  }
  {
    ev("tab='today';render()");awk.length=0;said.length=0;ln.length=0;
    ev("gdStart('f:tabata4')");await flush();
    ok("the full-screen layer opens and survives a view re-render",!q("#guide").hidden&&(ev("render()"),!q("#guide").hidden)&&q("#guide").getAttribute("aria-modal")==="true");
    ok("screen: animated figure, name, form cue, ring, next preview, progress, remaining time",!!q("#guide svg.fig animate")&&gt().includes("Açılıp kapanma sıçraması")&&gt().includes(ev("EXCUE.jack[0]"))&&!!q("#gdpg")&&q(".gdnx").textContent.includes("Dağcı")&&!!q("#gdbar")&&q("#gdrem").textContent.includes("8 adım"));
    ok("keep-awake: turned on while a flow runs, also outside the gym screen",awk[awk.length-1]===true);
    ok("voice prompt in preparation: the next exercise (no duration in a short preparation)",said[0]==="Sıradaki: Açılıp kapanma sıçraması");
    const n=ln.filter(l=>l[0]==="s").map(l=>l[1][0]).find(x=>x.id===9003);
    ok("a local notification 9003 is set for the phase end (9001/9002 are untouched) at the exact end time",n&&+n.schedule.at===ev("gd.st.end")&&n.schedule.allowWhileIdle&&n.title.startsWith("Başla")&&!ln.some(l=>l[0]==="s"&&l[1].some(x=>x.id===9001||x.id===9002)));
    ev("gd.st.end=Date.now()+2500;gd.st.at=gd.st.end-5000;gdTick();gdTick()");
    ok("in the last 3 seconds of rest \"3, 2, 1, başla\" is said once",said.filter(s=>s==="3, 2, 1, başla").length===1);
    said.length=0;ev("const _d=Date.now()-gd.st.end+1;gd.st.end-=_d+20000+10000+5000;gd.st.at-=_d+35000;gdTick()");
    ok("returning from the background: phases are computed from the end time, only the current phase is spoken",ev("gd.st.i")===3&&said.length===1&&said[0].startsWith("Dağcı"),[ev("gd.st.i"),said]);
    said.length=0;ev("S.settings.gdVoice=false;gdClick('skip')");
    ok("no speech when voice prompts are off",said.length===0);
    ev("S.settings.gdVoice=true;gdClick('pause')");await flush();
    ok("pause: the notification is cancelled, a Resume button appears",ln[ln.length-1][0]==="c"&&ln[ln.length-1][1][0]===9003&&!!q('[data-gd="resume"]'));
    ev("gdClick('resume')");
    pend=[{id:9001},{id:9002},{id:9003},{id:5}];await flush();ln.length=0;await ev("scheduleReminders()");
    ok("scheduleReminders does not cancel 9003 (nor 9001/9002)",ln.some(l=>l[0]==="c"&&l[1].includes(5))&&!ln.some(l=>l[0]==="c"&&l[1].some(i=>i>=9001&&i<=9003)));
    ev("backKey()");
    ok("back key: the flow ends and the summary shows",gt().includes("Akış durduruldu")&&ev("gd.fin"));
    ok("summary: keep-awake is released",awk[awk.length-1]===false);
    const before=ev("JSON.stringify(S.workouts)");stops.length=0;
    ev("gd.st.done[1]=5");w.confirm=()=>false;ev("backKey()");
    ok("back key on the summary: with completed steps it does not discard without asking",!q("#guide").hidden&&ev("gd.fin"));
    w.confirm=()=>true;
    ev("backKey()");
    ok("close without saving: S.workouts unchanged, speech stops, layer hidden",ev("JSON.stringify(S.workouts)")===before&&stops.length===1&&q("#guide").hidden&&ev("gd")===null);
  }
  {
    const fin=v=>{ev(`gdStart('${v}');while(!GuideLib.over(gd.st)){const p=gd.st.ph[gd.st.i];p.reps?GuideLib.finish(gd.st,gd.st.at+20000):GuideLib.tick(gd.st,gd.st.end)}gdEnter()`)};
    ev("S.workouts=[];S.entries=[];render()");
    fin("f:stretch10");
    ok("natural finish: the summary and \"Bitti. Tebrikler\"",gt().includes("Akış bitti")&&said[said.length-1]==="Bitti. Tebrikler"&&!!q('[data-gd="save"]'));
    const vol0=ev("JSON.stringify(gWeekRegions())");
    click('[data-gd="save"]');
    const e=ev("S.workouts[0]");
    ok("warm-up/stretching log: completed sets are done:true, sec filled, marked warm-up",e&&e.t1>e.t0&&e.ex.length===16&&e.ex.every(x=>x.sets.length===1&&x.sets[0].done===true&&x.sets[0].sec===30&&x.sets[0].w===true));
    ok("warm-up/stretching does not count toward volume, weekly sets or exercise minutes",ev("gWorkVol(S.workouts[0])")===0&&ev("gWorkSets(S.workouts[0])")===0&&ev("JSON.stringify(gWeekRegions())")===vol0&&ev("S.entries.length")===0);
    fin("f:tabata4");click('[data-gd="save"]');
    const t=ev("S.workouts[1]");
    ok("Tabata log: interval sets are timed, done, sec 20; exercise minutes are added",t.ex.length===4&&t.ex.every(x=>x.sets.length===2&&x.sets.every(s=>s.done&&s.sec===20&&!s.w))&&ev("S.entries.filter(x=>x.wid===S.workouts[1].id&&x.type==='exercise').length")===1);
    // weighted template: kg comes from the previous real set (60), not the suggestion (62.5); the user can correct it
    ev(`S.workouts.push({id:3,day:dayKey(),t0:1000,t1:2000,name:'Eski',tpl:null,ex:[{id:'squat',note:'',sets:[{kg:60,reps:12,done:true}]}]});S.templates=[{id:7,name:'Bacak',ex:['squat'],tg:{squat:{sets:2,reps:12}}}]`);
    fin("t:7");
    ok("summary: for a weighted movement the kg field holds the previous session's real weight (not the 62.5 suggestion)",ev("gSuggest('squat').kg")===62.5&&q('[data-gdkg="squat"]').value==="60");
    const n0=ev("S.workouts.length");q('[data-gdkg="squat"]').value="";click('[data-gd="save"]');
    ok("saving with an empty kg is refused with a warning",ev("S.workouts.length")===n0&&q("#tmsg").textContent.includes("Ağırlığı"));
    q('[data-gdkg="squat"]').value="60";click('[data-gd="save"]');
    const sq=ev("S.workouts[S.workouts.length-1]");
    ok("weighted template: the typed kg, reps and duration are saved, linked to the template, no false record",sq.tpl===7&&sq.ex[0].sets.length===2&&sq.ex[0].sets.every(s=>s.kg===60&&s.reps===12&&s.sec===20&&s.done)&&ev("gPRs(S.workouts[S.workouts.length-1]).length")===0);
    ev(`gdStart('t:7');while(!GuideLib.over(gd.st)){const p=gd.st.ph[gd.st.i];p.reps?GuideLib.finish(gd.st,gd.st.at+3*36e5):GuideLib.tick(gd.st,gd.st.end)}gdEnter()`);
    q('[data-gdkg="squat"]').value="60";click('[data-gd="save"]');
    ok("waiting 3 hours and pressing Done on a rep-based movement caps the set duration at 7200 s (not dropped on the next open)",ev("S.workouts[S.workouts.length-1].ex[0].sets.every(s=>s.sec>0&&s.sec<=7200)")&&ev("cleanGym({workouts:JSON.parse(JSON.stringify(S.workouts))}).workouts.at(-1).ex[0].sets.length")===2);
    ev(`S.templates.push({id:8,name:'Kayıttan',ex:['plank','trail']})`);
    ok("a template without set/duration targets gets the kind's default (timed 3x30 s, cardio 1x10 min)",JSON.stringify(ev("gdTplSteps(S.templates[1]).map(s=>[s.n,s.sec])"))==="[[3,30],[1,600]]");
    ok("after a guided log the suggestion is a number (not NaN)",(r=>r&&Number.isFinite(r.kg)&&Number.isFinite(r.reps))(ev("gSuggest('squat')")));
    ok("cleanGym round trip: guided logs survive unchanged",JSON.stringify(ev("cleanGym(JSON.parse(JSON.stringify(S))).workouts"))===JSON.stringify(ev("S.workouts")));
    ev("gdStart('f:tabata4');gdClick('end')");
    ok("with nothing completed there is no save button",!q('[data-gd="save"]')&&gt().includes("Tamamlanan egzersiz yok"));
    ev("gdClick('close')");
  }
  ok("the page ran without errors",errs.length===0,errs);
  finish();
});
