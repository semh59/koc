/* Audit round 2, section F (Gym): past-day rest, set timer survival, notification text, undo after finish, edit sheet of a finished workout, lb fill, PR toast, set delete, history more, short-screen layers. */
const fs=require("fs"),{ok,finish}=require("./ok");
const {boot,flush,www}=require("./html");
(async()=>{
  const lnLog=[];
  const w=await boot(w=>{w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async o=>{lnLog.push(["c",o.notifications.map(n=>n.id)])},schedule:async o=>{lnLog.push(["s",o.notifications.map(n=>n.id)])}}}}});
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s),qa=s=>[...w.document.querySelectorAll(s)],click=async s=>{q(s).click();await flush()};
  const fresh=(extra="")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.workouts=[];S.templates=[];S.entries=[];S.gid=1;restEnd=0;restTx="";gTim=null;gWe=null;tab='gym';${extra};render()`);
  const t12=d=>new Date(d+"T12:00:00").getTime();
  const hist=(id,day,kg,reps,ex="bench")=>`{id:${id},day:${JSON.stringify(day)},t0:${t12(day)},t1:${t12(day)+3e6},name:'A${id}',tpl:null,ex:[{id:'${ex}',note:'',sets:[{kg:${kg},reps:${reps},done:true}]}]}`;
  const fill=(ei,si,kg,reps)=>{q(`[data-gi="kg:${ei}:${si}"]`).value=kg;q(`[data-gi="reps:${ei}:${si}"]`).value=reps};

  /* a workout recorded for an earlier day has no real rest */
  fresh("gStart(null,keyOff(-3));gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:null,reps:null,done:false},{kg:null,reps:null,done:false}];render()");
  lnLog.length=0;fill(0,0,"50","8");await click('[data-g="done:0:0"]');await ev("gLnQ");
  ok("a past-day workout starts no rest counter and schedules no rest notification",ev("restEnd")===0&&!lnLog.some(l=>l[0]==="s"&&l[1].includes(9002)),lnLog);
  fresh("gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:null,reps:null,done:false},{kg:null,reps:null,done:false}];render()");
  fill(0,0,"50","8");await click('[data-g="done:0:0"]');
  ok("a workout of today still starts the counter",ev("restEnd")>Date.now());

  /* deleting a set elsewhere keeps the set timer; moving follows it */
  const two="gStart(null);gAddEx(gActive(),'bench');gAddEx(gActive(),'plank');const x=gActive();x.ex[0].sets=[{kg:50,reps:8,done:false},{kg:50,reps:8,done:false}];x.ex[1].sets=[{kg:null,reps:null,sec:60,done:false}];render()";
  fresh(two);ev("gTim={ei:1,si:0,end:Date.now()+60000,total:60,phase:'work'}");
  await click('[data-g="stype:0:1"]');await click('[data-g="setdelask:0:1"]');
  ok("deleting a set of another exercise leaves the timed-set timer running",!!ev("gTim")&&ev("gTim.ei")===1&&ev("gActive().ex[0].sets.length")===1);
  ev("gClick('mv:0:1')");
  ok("moving an exercise keeps the timer on its own exercise",!!ev("gTim")&&ev("gTim.ei")===0&&ev("gActive().ex[0].id")==="plank");
  fresh(two);ev("gTim={ei:0,si:1,end:Date.now()+60000,total:60,phase:'work'}");ev("gClick('setdel:0:0')");
  ok("deleting an earlier set of the same exercise moves the timer's set index",ev("gTim.ei")===0&&ev("gTim.si")===0);
  ev("gClick('setdel:0:0')");
  ok("deleting the timed set itself stops its timer",ev("gTim")===null);

  /* the rest notification names the exercise that is next now */
  fresh(two.replace("{kg:50,reps:8,done:false},{kg:50,reps:8,done:false}]","{kg:50,reps:8,done:true},{kg:50,reps:8,done:false}]"));
  ev("gRestSet(Date.now()+90000,'Sıradaki: Bench press')");
  ev("gClick('setdel:0:1')");
  ok("after the last open set of the next exercise is deleted the notification names the following one",/Sıradaki: Plank/.test(ev("restTx")),ev("restTx"));
  ev("gClick('setdel:1:0')");
  ok("with no set left the counter and its notification end",ev("restEnd")===0);

  /* undo after the workout was finished adds nothing */
  fresh("gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:50,reps:8,done:true},{kg:50,reps:8,done:false}];render()");
  ev("gClick('setdel:0:1')");
  ev("gFinishSave(gActive())");
  q("#tundo").click();
  ok("Geri al on a finished workout does not add the set back and says so",ev("S.workouts[0].ex[0].sets.length")===1&&/geri konulamadı/.test(q("#tmsg").textContent),q("#tmsg").textContent);

  /* lb: the filled kg is the stored kg, not a rounded round trip */
  fresh(`S.settings.wUnit='lb';S.workouts=[${hist(1,"2026-09-01",100,5)}];S.gid=5;gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:null,reps:null,done:false}];render()`);
  await click('[data-g="done:0:0"]');
  await click('[data-g="fillok:0:0"]');
  ok("Bu değerle tamamla stores the previous kg exactly in lb mode",ev("gActive().ex[0].sets[0].kg")===100&&ev("gActive().ex[0].sets[0].done")===true,ev("gActive().ex[0].sets[0].kg"));

  /* the record toast comes once per exercise and workout, also after a restart */
  fresh(`S.workouts=[${hist(1,"2026-09-01",100,5)}];S.gid=5;gStart(null);gAddEx(gActive(),'bench');gActive().ex[0].sets=[{kg:null,reps:null,done:false},{kg:null,reps:null,done:false}];render()`);
  fill(0,0,"110","5");await click('[data-g="done:0:0"]');
  ok("a new record toasts",/Yeni rekor/.test(q("#tmsg").textContent),q("#tmsg").textContent);
  q("#tmsg").textContent="";
  await click('[data-g="done:0:0"]');fill(0,0,"110","5");await click('[data-g="done:0:0"]');
  ok("unchecking and checking the same set does not repeat the record toast",!/Yeni rekor/.test(q("#tmsg").textContent),q("#tmsg").textContent);
  ok("the announced flag is stored with the exercise and survives loading",ev("cleanGym(JSON.parse(JSON.stringify({workouts:S.workouts}))).workouts.at(-1).ex[0].pr")===true);

  /* Seti sil is apart, behind a divider and a confirmation */
  fresh(two);
  await click('[data-g="stype:0:0"]');
  ok("Seti sil sits under a divider, apart from the set types, as a danger button",!!q('.sep .btn.danger[data-g="setdelask:0:0"]')&&!q('.plist [data-g^="setdel"]'));
  ev("window.confirm=()=>false");await click('[data-g="setdelask:0:0"]');
  ok("Vazgeç keeps the set",ev("gActive().ex[0].sets.length")===2);
  ev("window.confirm=()=>true");await click('[data-g="setdelask:0:0"]');
  ok("Sil removes it",ev("gActive().ex[0].sets.length")===1);

  /* edit sheet of a finished workout */
  const fin=`S.workouts=[{id:1,day:"2026-09-01",t0:${t12("2026-09-01")},t1:${t12("2026-09-01")+3e6},name:'Gün A',tpl:null,ex:[{id:'bench',note:'',sets:[{kg:40,reps:12,done:true,w:true},{kg:60,reps:8,done:true,t:'d'},{kg:60,reps:6,done:true}]},{id:'squat',note:'',sets:[{kg:80,reps:5,done:true}]}]}];S.gid=5;S.entries=[{id:1,type:'exercise',v:50,text:'Ağırlık, Gün A',day:'2026-09-01',time:'13:10',wid:1}];S.nextId=2`;
  fresh(fin);ev("gSheetSummary(1)");await click('[data-g="wedit:1"]');
  ok("warm-up and drop sets are labelled in the edit sheet",/1\. set, ısınma/.test(q("#sheet").textContent)&&/2\. set, drop set/.test(q("#sheet").textContent)&&!/3\. set,/.test(q("#sheet").textContent));
  q('[data-ge="kg:0:2"]').value="";await click('[data-g="wsave:1"]');
  ok("an emptied kg of a weighted exercise is an error, not a silent 0",ev("S.workouts[0].ex[0].sets[2].kg")===60&&/ağırlığı yaz/.test(q("#gwerr").textContent),q("#gwerr")?.textContent);
  q('[data-ge="kg:0:2"]').value="60";
  q("#gwn").value="Gün B";q("#gwd").value="2026-08-30";
  await click('[data-g="wexrm:1"]');
  ok("the typed name and day survive an exercise being taken out",q("#gwn").value==="Gün B"&&q("#gwd").value==="2026-08-30"&&qa("#sheet [data-ge^=kg]").length===3&&!q('[data-g="wexrm:1"]'));
  await click('[data-g="wexadd"]');
  ev("gQuery='plank';$('#glist').innerHTML=gPickHtml()");
  await click('[data-g="addex:plank"]');
  ok("an exercise is added from the picker and the edit sheet returns",!!q("#gwn")&&qa("#sheet [data-ge^=sec]").length===1);
  q('[data-ge="sec:1:0"]').value="45";
  await click('[data-g="wsave:1"]');
  const W1=ev("JSON.stringify(S.workouts[0])"),w1=JSON.parse(W1);
  ok("save keeps name, day, exercises and the sport entry in step",w1.name==="Gün B"&&w1.day==="2026-08-30"&&w1.ex.map(x=>x.id).join()==="bench,plank"&&w1.ex[1].sets[0].sec===45&&ev("S.entries[0].day")==="2026-08-30"&&ev("S.entries[0].text")==="Ağırlık, Gün B"&&new Date(w1.t0).getDate()===30,W1);
  q("#tundo").click();
  ok("Geri al restores name, day, exercises and the entry",ev("S.workouts[0].name")==="Gün A"&&ev("S.workouts[0].day")==="2026-09-01"&&ev("S.workouts[0].ex.length")===2&&ev("S.entries[0].day")==="2026-09-01");
  ev("closeSheet()");

  /* exercise history: more */
  const rows=()=>qa("#sheet table").find(t=>/Hacim/.test(t.textContent)).querySelectorAll("tbody tr").length;
  fresh(`S.workouts=[${[1,2,3,4,5,6,7,8].map(i=>hist(i,"2026-09-0"+i,50+i,5)).join(",")}];S.gid=20`);
  ev("gSheetHist('bench')");
  ok("history shows six sessions and a Daha fazla göster button",rows()===6&&!!q('[data-g="hmore:bench"]'));
  await click('[data-g="hmore:bench"]');
  ok("the button shows the rest",rows()===8&&!q('[data-g="hmore:bench"]'));

  const css=fs.readFileSync(www("app.css"),"utf8");
  ok("on short screens the sticky top bar and the rest timer are compact and the bar stays sticky",/@media \(max-height:640px\)\{[^@]*\.livebar b\{font-size[^@]*#grest\{padding/.test(css)&&!/max-height:640px\)\{[^@]*\.livetop\{position:static/.test(css));
  finish();
})();
