/* Salon for the gym user: set delete, finish choices, timed set copy, rest persistence, labels, template start, records, edit and breakdown, past day, units, layout. */
const fs=require("fs"),{ok,finish}=require("./ok");
const {boot,flush,www,quota}=require("./html");
(async()=>{
  const lnLog=[];
  const w=await boot(w=>{w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async o=>{lnLog.push(["c",o.notifications.map(n=>n.id)])},schedule:async o=>{lnLog.push(["s",o.notifications.map(n=>n.id)])}}}}});
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)],click=s=>q(s).click();
  const css=fs.readFileSync(www("app.css"),"utf8"),src=fs.readFileSync(www("modules/gym/gym.js"),"utf8");
  const drain=async()=>{await ev("gLnQ");await flush()};
  const fresh=(extra="")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.workouts=[];S.templates=[];S.gid=1;restEnd=0;restTx="";gTim=null;tab='gym';${extra};render()`);
  const text=()=>q("#sheet").textContent;

  { // 1 set delete and finish choices
    fresh("gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:50,reps:8,done:true},{kg:50,reps:8,done:false},{kg:50,reps:8,done:false}];render()");
    click('[data-g="stype:0:1"]');
    ok("the set number opens a sheet with a delete action",/Seti sil/.test(text())&&!!q('[data-g="setdel:0:1"]'));
    click('[data-g="setdel:0:1"]');
    ok("an unchecked set is deleted and the sheet closes",ev("gActive().ex[0].sets.length")===2&&!q("#sheet").classList.contains("on"));
    q("#tundo").click();
    ok("undo puts the set back in its place",ev("gActive().ex[0].sets.length")===3);
    fresh("gStart(null);gAddEx(gActive(),'plank');render()");
    click('[data-g="stype:0:0"]');
    ok("a timed set has a delete action and no type choices",!!q('[data-g="setdel:0:0"]')&&!q('[data-g="styw:0:0"]'));
    click('[data-g="setdel:0:0"]');
    ok("a timed set is deleted",ev("gActive().ex[0].sets.length")===2);
    fresh("gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:50,reps:8,done:true},{kg:50,reps:8,done:false},{kg:50,reps:8,done:false}];render()");
    click('[data-g="finish"]');
    ok("finish with unchecked sets offers count, discard and go back",/2 set işaretlenmemiş/.test(text())&&!!q('[data-g="finall"]')&&!!q('[data-g="finskip"]')&&/Antrenmana dön/.test(text()));
    click('[data-g="finskip"]');
    ok("discard: unchecked sets are dropped, the workout is saved with the checked one",ev("S.workouts[0].t1")!=null&&ev("S.workouts[0].ex[0].sets.length")===1);
    fresh("gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:50,reps:8,done:true},{kg:50,reps:8,done:false}];render()");
    click('[data-g="finish"]');click('[data-g="finall"]');
    ok("count: unchecked sets are completed and saved",ev("S.workouts[0].ex[0].sets.length")===2&&ev("S.workouts[0].ex[0].sets.every(s=>s.done)"));
    fresh("gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:50,reps:8,done:true},{kg:50,reps:8,done:false}];render()");
    click('[data-g="finish"]');click('#sheet [data-g="closesheet"]');
    ok("Antrenmana dön keeps the workout open",ev("gActive()")!=null&&!!q('[data-g="finish"]'));
  }
  { // 6 timed set copy
    fresh("gStart(null);gAddEx(gActive(),'plank');gActive().ex[0].sets[2].sec=75;render()");
    click('[data-g="addset:0"]');
    ok("a new timed set copies the last set's duration",ev("gActive().ex[0].sets.length")===4&&ev("gActive().ex[0].sets[3].sec")===75);
  }
  { // 7 rest persisted, not set on the last unchecked set
    fresh("gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:50,reps:8,done:false},{kg:50,reps:8,done:false}];render()");
    lnLog.length=0;
    click('[data-g="done:0:0"]');await drain();
    ok("a checked set starts the rest and stores its end on the workout",ev("restEnd")>Date.now()&&ev("gActive().rest.end")===ev("restEnd")&&/Sıradaki/.test(ev("gActive().rest.tx")));
    const end=ev("restEnd");
    ev("restEnd=0;restTx='';render()");
    ok("after a restart the counter continues from the stored end",ev("restEnd")===end&&!q("#grest").hidden);
    const back=JSON.parse(ev("JSON.stringify(cleanGym(JSON.parse(JSON.stringify(S))).workouts[0].rest)"));
    ok("the stored rest end survives the load cleaner",back.end===end);
    lnLog.length=0;
    click('[data-g="done:0:1"]');await drain();
    ok("the last unchecked set sets no counter and no notification; the old one is cancelled",ev("restEnd")===0&&ev("gActive().rest")==null&&!lnLog.some(l=>l[0]==="s"&&l[1].includes(9002))&&lnLog.some(l=>l[0]==="c"&&l[1].includes(9002)),lnLog);
    fresh("gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:50,reps:8,done:false},{kg:50,reps:8,done:false}];render()");
    click('[data-g="done:0:0"]');await drain();
    click('[data-g="finish"]');click('[data-g="finskip"]');await drain();
    ok("finishing cancels the rest and drops it from the saved workout",ev("restEnd")===0&&ev("S.workouts[0].rest")===undefined&&lnLog.some(l=>l[0]==="c"&&l[1].includes(9002)));
    ok("a finished workout never keeps a rest end",ev("cleanGym({workouts:[{id:1,day:'2026-09-01',t0:1,t1:2,rest:{end:9e12,tx:'x'},ex:[]}]}).workouts[0].rest")===undefined);
  }
  { // 9 labels
    fresh("gStart(null);render()");
    ok("the live bar button reads Antrenmanı sil and its aria-label starts with the same words",q('.livebar [data-g="cancel"]').textContent.trim()==="Antrenmanı sil"&&q('.livebar [data-g="cancel"]').getAttribute("aria-label").startsWith("Antrenmanı sil"));
    fresh("S.templates=[{id:3,name:'Üst',ex:['squat']}];S.workouts=[]");
    ev("gTplPreview(3)");
    ok("information-only template preview closes with Kapat",q('#sheet [data-g="closesheet"]').textContent==="Kapat");
    fresh("gStart(null);gAddEx(gActive(),'bench');render()");
    click('[data-g="menu:0"]');click('[data-g="note:0"]');
    ok("an unsaved form (note) closes with Vazgeç",q('#sheet [data-g="closesheet"]').textContent==="Vazgeç");
    ev("S.templates=[{id:3,name:'Üst',ex:['squat']}];gTeOpen(3)");
    ok("the template editor keeps Vazgeç",q('#sheet [data-g="closesheet"]').textContent==="Vazgeç");
  }
  { // 3 breakdown, 2 edit, 5 records
    const W=(id,day,t0,ex)=>`{id:${id},day:${JSON.stringify(day)},t0:${t0},t1:${t0+3e6},name:'A${id}',tpl:null,ex:[${ex}]}`;
    const X=(id,sets)=>`{id:'${id}',note:'',sets:[${sets}]}`;
    const set=(kg,r,extra="")=>`{kg:${kg},reps:${r},done:true${extra}}`;
    fresh(`S.workouts=[${W(1,"2026-09-01",1e12,X("bench",set(60,8)+","+set(60,6)+","+set(40,12,",w:true"))+","+X("plank","{kg:null,reps:null,sec:45,done:true}"))}];S.gid=5`);
    ev("gSheetSummary(1)");
    ok("summary lists every exercise with its sets as kg × reps (warm-up left out) and timed sets as seconds",/Bench press60 × 8, 60 × 6/.test(text())&&/Plank45 sn/.test(text()),text());
    ev("closeSheet();gSheetHist('bench')");
    ok("exercise history table shows every set of the session, not only the best",/Setler/.test(text())&&/60 × 8, 60 × 6/.test(text()),text());
    ev("gSheetSummary(1)");click('[data-g="wedit:1"]');
    ok("edit sheet: one kg and one reps box per weight set, one duration box per timed set",qa("#sheet [data-ge^=kg]").length===3&&qa("#sheet [data-ge^=reps]").length===3&&qa("#sheet [data-ge^=sec]").length===1);
    const set_=(sel,v)=>{q("#sheet "+sel).value=v};
    set_('[data-ge="kg:0:1"]',"62,5");set_('[data-ge="reps:0:1"]',"5");set_('[data-ge="sec:1:0"]',"60");
    click('[data-g="wsave:1"]');
    ok("save: kg, reps and duration of the finished workout change, the summary shows the new values",ev("S.workouts[0].ex[0].sets[1].kg")===62.5&&ev("S.workouts[0].ex[0].sets[1].reps")===5&&ev("S.workouts[0].ex[1].sets[0].sec")===60&&/62,5 × 5/.test(text()),text());
    ok("untouched fields keep their stored value (the warm-up set, set 1)",ev("S.workouts[0].ex[0].sets[0].kg")===60&&ev("S.workouts[0].ex[0].sets[2].w")===true);
    q("#tundo").click();
    ok("undo restores the old values",ev("S.workouts[0].ex[0].sets[1].kg")===60&&ev("S.workouts[0].ex[1].sets[0].sec")===45);
    ev("gEditSheet(1)");set_('[data-ge="reps:0:0"]',"500");click('[data-g="wsave:1"]');
    ok("an invalid value is refused under the field and nothing changes",ev("S.workouts[0].ex[0].sets[0].reps")===8&&/Bench press, 1. set/.test(q("#gwerr").textContent)&&q("#sheet").classList.contains("on"),q("#gwerr").textContent);
    set_('[data-ge="reps:0:0"]',"");click('[data-g="wsave:1"]');
    ok("an emptied reps box is refused",ev("S.workouts[0].ex[0].sets[0].reps")===8&&q("#gwerr").textContent!=="");
    const {full,free}=quota(w);
    set_('[data-ge="reps:0:0"]',"9");full();click('[data-g="wsave:1"]');
    ok("a failed save puts the old value back",ev("S.workouts[0].ex[0].sets[0].reps")===8&&/kaydedilemedi/.test(q("#tmsg").textContent));
    free();ev("closeSheet()");
    // records
    const ids=["bench","squat","row","curl","ohp","lat","legpress"];
    fresh(`S.workouts=[${ids.map((id,i)=>W(i+1,"2026-09-"+String(10+i).padStart(2,"0"),1e12+i*1e8,X(id,set(50+i,8)))).join(",")}];S.gid=20`);
    ev("render()");
    const recs=qa("#view .card .row").filter(r=>r.parentNode.previousElementSibling&&r.parentNode.previousElementSibling.textContent==="Rekorlar");
    ok("records: one row per exercise (best set), not limited to the last 3 events",recs.length===5&&ev("gRecords(S.workouts.filter(gDone)).length")===7);
    ok("records are not inside a collapsed section",!q("#view h2+.card").closest("details")&&![...qa("#view details")].some(d=>d.querySelector("summary").textContent.includes("Rekor")));
    click('[data-g="recmore"]');
    ok("Tüm rekorlar shows the remaining exercises",qa("#view .card .row .tag").length>=7);
  }
  finish();
})();
