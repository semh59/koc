const {ok,finish}=require("./ok");
const {boot,build,until,flush}=require("./html"),canvas=require("./canvas");
const fs=require("fs"),path=require("path");
const www=f=>path.join(__dirname,"../www",f);
const html=build(),errs=[];
process.on("unhandledRejection",e=>{console.log("FAIL unexpected error",e);process.exit(1)});
(async()=>{
  const w=await boot(w=>{Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.addEventListener("error",e=>errs.push(e.message))},html);
  const sc=[];w.HTMLElement.prototype.scrollIntoView=function(){sc.push(this)};
  const loadBackup=require("./bkhelp.js")(()=>w);
  const ev=s=>w.eval(s),shown=()=>ev("S.settings.reminders.filter(remShown).map(r=>r.id)"),$q=s=>w.document.querySelector(s),macros=()=>ev("JSON.stringify(of('food',dayKey()).map(e=>[e.v,e.p,e.c,e.f]))");
  const calls=[];
  w.Capacitor={isNativePlatform:()=>true,Plugins:{LocalNotifications:{checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[1,2]}),schedule:async x=>{calls.push(x)}}}};
  w.Capacitor.Plugins.DeviceHelp={info:async()=>({manufacturer:"xiaomi"})};
  const reset=()=>{ev("closeSheet();S=structuredClone(DEF);S.settings.obDone=true;tab='today'");w.localStorage.clear();ev("render()")};
  ok("the page opens without errors",errs.length===0&&ev("document.querySelector('#view').innerHTML.length")>100,errs);
  { // onboarding
    const q=s=>$q(s),click=s=>q(s).click(),val=(id,v)=>{q("#ob"+id).value=v},v=()=>q("#view").textContent;
    const fill=(cm,kg,age)=>{val("cm",cm);val("kg",kg);val("age",age)};
    ok("first launch welcome: logo, one sentence, one primary Başla button, a skip link; no step counter",v().includes("hoş geldin")&&q('#view .btn[data-ob="next"]').textContent==="Başla"&&q("#view").querySelectorAll(".btn:not(.ghost)").length===1&&!!q('[data-obr="open"]')&&!!q('[data-ob="skip"]')&&!v().includes("Adım"));
    click('[data-ob="next"]');
    ok("first-launch onboarding: step 1/3, menu hidden, labelled fields",v().includes("Adım 1/3")&&w.document.body.classList.contains("ob")&&["cm","kg","age"].every(k=>q(`label[for="ob${k}"]`)&&q("#ob"+k)));
    ok("a settings state without the flag counts onboarding as done; it hides record and profile",ev("cleanSettings({kcal:1800}).obDone")===false&&ev("cleanSettings({obDone:false,kcal:1}).obDone")===false&&ev("cleanSettings(undefined).obDone")===false&&ev("(()=>{const r=[];const s0=S;for(const f of [()=>S.entries.push({}),()=>{S.settings.heightCm=170},()=>{S.settings.goalKg=70},()=>{S.settings.obDone=true}]){S=structuredClone(DEF);f();r.push(obNeeded())}S=s0;return r.join()})()")==="false,false,false,false");
    click('[data-ob="next"]');
    ok("an empty field is rejected: error under the field, aria-invalid",q("#oberr").textContent.includes("Boy")&&q("#obcm").getAttribute("aria-invalid")==="true"&&v().includes("Adım 1/3"));
    for(const [a,b,c,m] of [["99","80","30","Boy"],["251","80","30","Boy"],["170","19","30","Kilo"],["170","80","101","Yaş"]]){fill(a,b,c);click('[data-ob="next"]');ok(`out of range is rejected: ${a}/${b}/${c}`,q("#oberr").textContent.startsWith(m)&&v().includes("Adım 1/3"),q("#oberr").textContent)}
    fill("170","80","30");click('[data-ob="dir:lose"]');val("goal","85");click('[data-ob="next"]');
    ok("lose weight: a goal above the current weight is rejected and the values are kept",q("#oberr").textContent.includes("düşük")&&q("#obcm").value==="170"&&q("#obgoal").getAttribute("aria-invalid")==="true");
    val("goal","72");click('[data-ob="sex:m"]');click('[data-ob="next"]');
    ok("step 2: module options, all start off",v().includes("Adım 2/3")&&q("#view").querySelectorAll('[data-ob^="mod:"]').length===5&&q("#view").querySelectorAll('[data-ob^="mod:"][aria-pressed="true"]').length===0);
    click('[data-ob="mod:med"]');click('[data-ob="mod:fast"]');click('[data-ob="mod:steps"]');click('[data-ob="mod:fast"]');
    click('[data-ob="back"]');
    ok("back: values and choices are kept",v().includes("Adım 1/3")&&q("#obkg").value==="80"&&q("#obgoal").value==="72"&&q('[data-ob="sex:m"]').getAttribute("aria-pressed")==="true");
    click('[data-ob="next"]');click('[data-ob="next"]');
    const exp=ev("(()=>{const q={kg:80,cm:170,age:30,sex:'m'};return Algo.suggestTarget({tdee:Algo.formulaTdee({...q,act:1}),kg:80,goalKg:72,bmr:Algo.bmrMifflin(q),age:30,cm:170}).kcal})()");
    ok("summary: personal calorie and protein target from Algo",v().includes("Adım 3/3")&&v().includes(exp.toLocaleString("tr-TR"))&&v().includes("128–176")&&!v().includes("açığı önermiyorum"),[exp,v()]);
    click('[data-ob="next"]');
    const s=ev("S.settings");
    ok("Başla: values are written to the profile fields, lands on Today",s.heightCm===170&&s.age===30&&s.sex==="m"&&s.goalKg===72&&s.kcal===exp&&s.obDone&&ev("weights()[dayKey()]")===80&&ev("tab")==="today"&&!w.document.body.classList.contains("ob"),s);
    ok("modules: chosen ones on, others off; no permission prompt for the step",s.medOn&&!s.fastOn&&!s.bpOn&&!s.bsOn&&!s.stepsOn&&!s.stepsAsked&&!s.consent);
    // health flag and under 18: no calorie deficit is suggested, physician note
    ev("S=structuredClone(DEF);render()");
    click('[data-ob="next"]');fill("170","80","30");click('[data-ob="dir:lose"]');val("goal","70");click('[data-ob="next"]');q("#obhn").checked=true;click('[data-ob="next"]');
    const mt=ev("(()=>{const q={kg:80,cm:170,age:30,sex:''};return Math.round(Algo.formulaTdee({...q,act:1})/10)*10})()");
    ok("health flag: no deficit, maintenance level and a physician note",v().includes("açığı önermiyorum")&&v().includes("hekim")&&v().includes(mt.toLocaleString("tr-TR")),v());
    click('[data-ob="next"]');
    ok("the health flag is written to the health note",ev("S.settings.healthNote").includes("hekim kontrolü"));
    ev("S=structuredClone(DEF);render()");
    const ls0=w.localStorage.getItem("nw_state");
    click('[data-ob="next"]');fill("165","60","17");click('[data-ob="next"]');
    ok("age 17: setup stops with a gentle screen; no skip, back or continue; no draft and no record",v().includes("18 yaş ve üzeri için")&&v().includes("hekiminle ya da diyetisyeninle")&&!q('[data-ob="skip"]')&&!q('[data-ob="next"]')&&!q('[data-ob="back"]')&&ev("ob.age+ob.kg+ob.cm")===""&&ev("S.settings.age")===0&&!ev("S.settings.obDone")&&ev("S.entries.length")===0&&w.localStorage.getItem("nw_state")===ls0,v());
    for(const a of ["9","1"]){click('[data-ob="fixage"]');fill("165","60",a);click('[data-ob="next"]');ok(`age ${a}: the same screen instead of a range error`,v().includes("18 yaş ve üzeri için"))}
    click('[data-ob="fixage"]');
    ok("Yaşımı yanlış girdim: returns to an empty step 1",v().includes("Adım 1/3")&&q("#obage").value==="");
    fill("165","60","18");click('[data-ob="next"]');
    ok("age 18: setup continues",v().includes("Adım 2/3")&&!v().includes("18 yaş ve üzeri için"));
    click('[data-ob="skip"]');
    ok("Şimdilik geç: nothing is written and it never shows again",ev("S.settings.obDone")&&ev("S.entries.length")===0&&ev("S.settings.heightCm")===0&&ev("obNeeded()")===false&&ev("tab")==="today");
    ev("tab='settings-data';render()");
    ok("Data: automatic backup off, and it says a backup file is needed when changing phones",v().includes("Google otomatik yedeğine")&&v().includes("telefon değiştirirsen")&&v().includes("yedek dosyanı al"));
    click('[data-act="reset"]');
    ok("after Delete all data onboarding shows again",ev("obNeeded()")&&q("#view").textContent.includes("hoş geldin"));
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // template editor
    const q=s=>$q(s),sh=()=>q("#sheet").textContent,set=(sel,v)=>{q(sel).value=v};
    ev("closeSheet();S.workouts=[];S.templates=[];S.customEx=[];S.exCfg={};S.gid=1;tab='gym';render()");
    const T=JSON.parse(ev(`JSON.stringify((()=>{const src={templates:[{id:1,name:"Eski",ex:["squat","bench"]},{id:2,name:"Yeni",ex:["squat","plank","bilinmez"],tg:{squat:{sets:4,reps:6,hi:10},plank:{sets:3,sec:45},bilinmez:{sets:3},bench:{sets:3}}},{id:3,name:"Çöp",ex:["squat","row"],tg:{squat:{sets:0,reps:"x",hi:3,sec:-1},row:{sets:3,reps:8,hi:8}}},{id:4,name:"Biçim",ex:["squat"],tg:"x"}]},c=JSON.stringify(src);const o=cleanGym(src);return {o,same:c===JSON.stringify(src)}})())`));
    ok("cleanGym tg: a valid target is kept, unknown/removed exercises and junk values are dropped",JSON.stringify(T.o.templates[1].tg)==='{"squat":{"sets":4,"reps":6,"hi":10},"plank":{"sets":3,"sec":45}}'&&JSON.stringify(T.o.templates[2].tg)==='{"row":{"sets":3,"reps":8}}',T.o.templates);
    ok("an old template (no tg) keeps its shape, the cleaner does not touch the input",JSON.stringify(T.o.templates[0])==='{"id":1,"name":"Eski","ex":["squat","bench"]}'&&T.o.templates[3].tg===undefined&&T.same);
    // starting without tg is the old behaviour; starting with tg fills from the target, kg from the previous session
    ev(`S.workouts=[{id:5,day:dayKey(),t0:1000,t1:2000,name:'Eski',tpl:null,ex:[{id:'squat',note:'',sets:[{kg:100,reps:12,done:true},{kg:100,reps:12,done:true}]},{id:'plank',note:'',sets:[{kg:null,reps:null,sec:40,done:true}]}]}];S.gid=10;render()`);
    ev("S.templates=[{id:11,name:'Tg yok',ex:['squat','plank']},{id:12,name:'Hedefli',ex:['squat','plank','bwsquat'],tg:{squat:{sets:4,reps:6,hi:10},plank:{sets:2,sec:60},bwsquat:{sets:5,reps:15}}}];render()");
    ev("gStart(11)");let a=ev("JSON.stringify(gActive().ex.map(x=>[x.id,x.sets.length,x.sets[0].kg,x.sets[0].reps,x.sets[0].sec||0]))");
    ok("a template without tg starts as before: set count from history, kg and reps from the suggestion, duration from history",a==='[["squat",2,102.5,8,0],["plank",1,null,null,40]]',a);
    ev("S.workouts=S.workouts.filter(x=>x.t1!=null);gStart(12)");a=ev("JSON.stringify(gActive().ex.map(x=>[x.id,x.sets.length,x.sets[0].kg,x.sets[0].reps,x.sets[0].sec||0]))");
    ok("a template with tg: set count, reps and duration from the target; kg from the previous session/suggestion",a==='[["squat",4,102.5,6,0],["plank",2,null,null,60],["bwsquat",5,null,15,0]]',a);
    ev("S.workouts=S.workouts.filter(x=>x.t1!=null);render()");
    ev("S.gid=50"); // editor: new template
    q('[data-g="tedit:"]').click();
    ok("the New template page opens",sh().includes("Yeni şablon")&&q("#gten")&&q('[data-g="tesave"]'));
    q('[data-g="tesave"]').click();
    ok("an unnamed template is not saved",ev("S.templates.length")===2&&q("#toast").textContent.includes("ad"));
    set("#gten","İtiş günü");q('[data-g="tesave"]').click();
    ok("a template without exercises is not saved",ev("S.templates.length")===2&&q("#toast").textContent.includes("egzersiz"));
    q('[data-g="teadd"]').click();ev("gClick('addex:bench',document.body)");ev("gClick('addex:plank',document.body)");ev("gClick('addex:bench',document.body)");
    ok("in the picker the added ones are marked, the same one is not added twice, no live workout is created",ev("gTe.ex.join()")==="bench,plank"&&!ev("gActive()")&&(ev("gQuery='bench'"),ev("gPickHtml()").includes("Eklendi")));
    q('[data-g="teback"]').click();
    ok("returning from the picker keeps the editor's name and added exercises",q("#gten").value==="İtiş günü"&&q('[data-te="sets:1"]')&&q('[data-te="sec:1"]').value==="30"&&q('[data-te="reps:0"]').value==="8-12");
    set('[data-te="sets:0"]',"5");set('[data-te="reps:0"]',"5");set('[data-te="sec:1"]',"45");
    q('[data-g="temv:1:-1"]').click();
    ok("move up: the order changes, typed values survive the redraw",ev("gTe.ex.join()")==="plank,bench"&&q('[data-te="sec:0"]').value==="45"&&q('[data-te="reps:1"]').value==="5"&&q('[data-te="sets:1"]').value==="5");
    q('[data-g="temv:0:-1"]').click();
    ok("moving the first row up does nothing",ev("gTe.ex.join()")==="plank,bench");
    q('[data-g="teadd"]').click();ev("gClick('addex:squat',document.body)");q('[data-g="teback"]').click();q('[data-g="term:2"]').click();
    ok("remove: the exercise and its target leave the draft",ev("gTe.ex.join()")==="plank,bench"&&!("squat" in ev("gTe.tg")));
    set('[data-te="reps:1"]',"abc");set('[data-te="sets:1"]',"99");q('[data-g="temv:1:1"]').click();
    ok("an invalid set/reps value keeps the old value",ev("gTe.tg.bench.sets")===5&&ev("gTe.tg.bench.reps")===5&&ev("gTe.tg.bench.hi")===undefined);
    q('[data-g="tesave"]').click();
    let t=ev("S.templates.find(x=>x.name==='İtiş günü')");
    ok("save: name, order and targets are written to the template; the page closes",t&&t.ex.join()==="plank,bench"&&t.tg.bench.sets===5&&t.tg.bench.reps===5&&t.tg.plank.sec===45&&!q("#sheet").classList.contains("on"),t);
    ok("save round trip: tg persists, the template shows on the home screen",ev("cleanGym(JSON.parse(JSON.stringify(S))).templates.find(x=>x.name==='İtiş günü').tg.plank.sec")===45&&q("#view").textContent.includes("İtiş günü"));
    // edit: id and link are kept
    const id=t.id;ev(`S.workouts.push({id:20,day:dayKey(),t0:3000,t1:4000,name:'İtiş günü',tpl:${id},ex:[{id:'bench',note:'',sets:[{kg:60,reps:8,done:true},{kg:60,reps:7,done:true},{kg:20,reps:5,w:true,done:true}]},{id:'squat',note:'',sets:[{kg:80,reps:10,done:true}]}]});S.gid=30;render()`);
    q(`[data-g="tedit:${id}"]`).click();
    ok("edit: opens with the existing values",q("#gten").value==="İtiş günü"&&sh().includes("Şablonu düzenle")&&q('[data-te="sets:1"]').value==="5");
    set("#gten","İtiş B");q('[data-g="tesave"]').click();
    ok("the name changes, the id and workout link stay the same",ev(`S.templates.find(x=>x.id===${id}).name`)==="İtiş B"&&ev("S.workouts.find(x=>x.id===20).tpl")===id&&ev("S.templates.filter(x=>x.name.startsWith('İtiş')).length")===1);
    // update after a session (optional)
    ev("gSheetSummary(20)");
    ok("summary: a templated workout offers 'update template' and not 'save as template'",sh().includes("Şablonu bu seansa göre güncelle")&&!sh().includes("Şablon olarak kaydet"));
    ok("closing without updating does not change the template",ev(`S.templates.find(x=>x.id===${id}).ex.join()`)==="plank,bench");
    q(`[data-g="tplupd:20"]`).click();
    t=ev(`S.templates.find(x=>x.id===${id})`);
    ok("update: exercises as in the session, set count without warm-ups, reps at the minimum reps; the workout link stays",t.ex.join()==="bench,squat"&&t.tg.bench.sets===2&&t.tg.bench.reps===7&&t.tg.squat.sets===1&&t.tg.squat.reps===10&&ev("S.workouts.find(x=>x.id===20).tpl")===id,t);
    q("#tundo").click();
    ok("undo the update",ev(`S.templates.find(x=>x.id===${id}).ex.join()`)==="plank,bench"&&ev(`S.templates.find(x=>x.id===${id}).tg.bench.sets`)===5);
    ev("gSheetSummary(5)");
    ok("for a workout without a template the 'Save as template' flow stops and writes no tg",sh().includes("Şablon olarak kaydet")&&(()=>{q('[data-g="savetpl:5"]').click();q("#gtn").value="Kayıtlı";q('[data-g="savetplgo:5"]').click();const k=ev("S.templates.find(x=>x.name==='Kayıtlı')");return k&&k.ex.join()==="squat,plank"&&k.tg===undefined&&ev("S.workouts.find(x=>x.id===5).tpl")===k.id})());
    // deletion needs confirmation
    w.confirm=()=>false;const n0=ev("S.templates.length");q(`[data-g="tdel:${id}"]`).click();
    ok("delete: the template stays if not confirmed",ev("S.templates.length")===n0);
    w.confirm=()=>true;q(`[data-g="tdel:${id}"]`).click();
    ok("delete: confirmed deletes it, undo brings it back",ev("S.templates.length")===n0-1&&(q("#tundo").click(),ev("S.templates.length")===n0));
    ev("S.workouts=[];S.templates=[];closeSheet();render()");
  }
  { // ready-made programs
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],sh=()=>q("#sheet").textContent;
    ev("closeSheet();S.workouts=[];S.templates=[];S.customEx=[];S.exCfg={};S.gid=1;S.chat=[];S.settings.consent=false;gPgF={d:0,lv:''};tab='gym';render()");
    ok("all program ids are in EXDB",ev("PrgLib.PROGRAMS.every(p=>p.days.every(d=>d.ex.every(r=>EXDB.some(e=>e.id===r[0]))))"));
    ok("Gym home 'Hazır programlar': 5 programs, no key/Coach needed, short note",q("#view").textContent.includes("Hazır programlar")&&qa('[data-g^="pg:"]').length===5&&q("#view").textContent.includes("hekime ya da fizyoterapiste")&&ev("S.settings.consent")===false);
    q('[data-g="pgf:d:4"]').click();
    ok("day filter: 4-day programs (including the interval one)",qa('[data-g^="pg:"]').map(b=>b.dataset.g).join()==="pg:home4,pg:gym4,pg:ppl"&&q('[data-g="pgf:d:4"]').getAttribute("aria-pressed")==="true");
    q('[data-g="pgf:lv:Başlangıç"]').click();
    ok("the level filter combines; an explanation when none match",qa('[data-g^="pg:"]').length===0&&q("#view").textContent.includes("uyan program yok"));
    q('[data-g="pgf:d:0"]').click();q('[data-g="pgf:lv:"]').click();
    ok("Hepsi: 5 programs",qa('[data-g^="pg:"]').length===5);
    q('[data-g="pg:gym3"]').click();
    ok("program page: days, sets x reps, note and the add button",sh().includes("Salon tüm vücut")&&sh().includes("Squat 5×5")&&sh().includes("Gün C")&&sh().includes("fizyoterapiste")&&q('[data-g="pgadd:gym3"]')&&!q("#sheet [data-g^=pgd]"));
    q('[data-g="pgadd:gym3"]').click();
    const T=ev("S.templates"),t0=T[0];
    ok("Şablonlarıma ekle: one template per day, named 'Program – Day', targets filled",T.length===3&&t0.name==="Salon tüm vücut – Gün A"&&t0.ex.join()==="squat,bench,row,bbohp,tri,crunch"&&t0.tg.squat.sets===5&&t0.tg.squat.reps===5&&t0.tg.bbohp.hi===10&&!q("#sheet").classList.contains("on"),T);
    ok("the added templates keep their targets through a save round trip",ev("JSON.stringify(cleanGym(JSON.parse(JSON.stringify(S))).templates)")===JSON.stringify(T));
    ev("S.workouts=[];gStart(S.templates[0].id)");
    ok("workout from a template: set count and reps from the target",ev("gActive().ex.map(x=>x.sets.length+'x'+x.sets[0].reps).join()")==="5x5,5x5,5x5,3x8,3x10,3x12"&&ev("gActive().ex.find(x=>x.id==='bbohp').sets[0].reps")===8);
    ev("S.workouts=[];tab='gym';render()");
    q('[data-g="pg:ppl"]').click();
    ok("push-pull-legs: the day count is selectable (3-6), default 3",sh().includes("Bacak A")&&!sh().includes("İtiş B")&&q('[data-g="pgd:ppl:3"]').getAttribute("aria-pressed")==="true");
    q('[data-g="pgd:ppl:5"]').click();
    ok("5 days: the first 5 days are shown",sh().includes("Çekiş B")&&!sh().includes("Bacak B"));
    ev("S.templates=[]");q('[data-g="pgadd:ppl"]').click();
    ok("choosing 5 days adds 5 templates; undo removes all",ev("S.templates.length")===5&&ev("S.templates[4].name")==="Salon itiş-çekiş-bacak – Çekiş B"&&(q("#tundo").click(),ev("S.templates.length")===0));
    ev("S.templates=[];gPgF.d=6");ev("render()");q('[data-g="pg:ppl"]').click();
    ok("the day filter carries over to the selected program (6)",q('[data-g="pgd:ppl:6"]').getAttribute("aria-pressed")==="true"&&sh().includes("Bacak B"));
    ev("gPgF={d:0,lv:''};closeSheet();S.templates=[];render()");
  }
  { // custom exercise
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    ev("closeSheet();S.workouts=[];S.templates=[];S.customEx=[];S.exCfg={};S.gid=1;gNewS={n:'',k:'w',r:'Ön bacak',q:'Salon',tp:''};tab='gym';render()");
    const C=JSON.parse(ev(`JSON.stringify(cleanGym({customEx:[{id:"c1",n:"Eski",g:"Kol"},{id:"c2",n:"Yeni",g:"Karın",r:"Karın",k:"t",q:"Ev tipi",tp:"plank",c:"x"},{id:"c3",n:"Çöp",g:"Bacak",r:"Yok",k:"zz",q:"Uzay",tp:"yok"},{id:"c4",n:"Boş",g:"Bacak",r:5,k:"",q:null,tp:"__proto__"},{id:"c5",n:"Kardiyo",g:"Bacak",k:"c"},{id:"c6",n:"Aralık",g:"Bacak",k:"i"}]}).customEx)`));
    ok("an old custom exercise (only g) keeps its shape",JSON.stringify(C[0])==='{"id":"c1","n":"Eski","g":"Kol","inc":2.5}');
    ok("a valid type/region/equipment/figure is kept, the category is derived",JSON.stringify(C[1])==='{"id":"c2","n":"Yeni","g":"Karın","inc":2.5,"r":"Karın","k":"t","c":"g","q":"Ev tipi","tp":"plank"}'&&C[4].k==="c"&&C[4].c==="k");
    ok("invalid fields are dropped, the exercise stays",JSON.stringify(C[2])==='{"id":"c3","n":"Çöp","g":"Bacak","inc":2.5}'&&JSON.stringify(C[3])==='{"id":"c4","n":"Boş","g":"Bacak","inc":2.5}'&&JSON.stringify(C[5])==='{"id":"c6","n":"Aralık","g":"Bacak","inc":2.5}');
    ev("S.customEx=[{id:'c1',n:'Eski',g:'Kol',inc:2.5}];S.gid=5;gStart(null)");
    ev("gAddEx(gActive(),'c1');render()");
    ok("an old custom exercise works: weight x reps, group name as the region",ev("gKind('c1')")==="w"&&ev("gActive().ex[0].sets.length")===3&&q("#view").textContent.includes("Kol")&&ev("gEx('c1').r||gEx('c1').g")==="Kol");
    ev("S.workouts=[];S.customEx=[];gSheetPick()");
    q('[data-g="newex"]').click();
    ok("form: type, region (16), equipment and figure choice",qa('[data-g^="nf:k:"]').length===4&&qa('[data-g^="nf:r:"]').length===16&&qa('[data-g^="nf:q:"]').length===3&&q("#gntp").options.length>40);
    q("#gnn").value="Benim plankım";
    q('[data-g="nf:k:t"]').click();q('[data-g="nf:r:Karın"]').click();q('[data-g="nf:q:Ağırlıksız"]').click();
    ok("the selection stays marked on redraw, the typed name is not lost",q('[data-g="nf:k:t"]').getAttribute("aria-pressed")==="true"&&q('[data-g="nf:r:Karın"]').getAttribute("aria-pressed")==="true"&&q('[data-g="nf:r:Ön bacak"]').getAttribute("aria-pressed")==="false"&&q("#gnn").value==="Benim plankım");
    q("#gntp").value="plank";q('[data-g="mkex"]').click();
    const e=ev("S.customEx[0]");
    ok("create: type, region, equipment, figure and derived group are written",e&&e.n==="Benim plankım"&&e.k==="t"&&e.r==="Karın"&&e.g==="Karın"&&e.q==="Ağırlıksız"&&e.tp==="plank"&&e.c==="g",e);
    ok("the new exercise is timed, its figure is drawn, it is listed by region in the library",ev("gTimed(S.customEx[0].id)")===true&&ev("exFig(S.customEx[0],false)").includes("<svg")&&ev("exFiltered().some(x=>x.id===S.customEx[0].id)")===true&&(ev("gLReg='Karın'"),ev("exListHtml()").includes("Benim plankım")));
    ev("gLReg='Tümü'");
    ok("save round trip: the new fields persist",JSON.stringify(ev("cleanGym(JSON.parse(JSON.stringify(S))).customEx[0]"))===JSON.stringify(e));
    ev("S.workouts=[];gStart(null);gAddEx(gActive(),S.customEx[0].id)");
    ok("when added to a workout a timed set (seconds) arrives",ev("gActive().ex[0].sets[0].sec")===30&&ev("gActive().ex[0].sets[0].reps")===null);
    ev("S.workouts=[];gSheetPick()");q('[data-g="newex"]').click();
    ok("it is not created without a name, the same name is rejected",(q('[data-g="mkex"]').click(),ev("S.customEx.length")===1)&&(q("#gnn").value="benim plankım",q('[data-g="mkex"]').click(),ev("S.customEx.length")===1&&q("#toast").textContent.includes("var")));
    ev("closeSheet();S.customEx=[];S.workouts=[];render()");
  }
  { // home equipment profile
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    const H=(id,kg,reps,n=3)=>`S.workouts=[{id:5,day:dayKey(),t0:1000,t1:2000,name:'E',tpl:null,ex:[{id:'${id}',note:'',sets:[${Array(n).fill(`{kg:${kg},reps:${reps},done:true}`).join()}]}]}];`;
    ev("closeSheet();S.workouts=[];S.templates=[];S.customEx=[];S.exCfg={};S.gid=10;S.bar=20;S.dbStep=0;S.plates=GPLATE_DEF.slice();tab='gym';render()");
    const D=JSON.parse(ev("JSON.stringify(cleanGym({}))")),B=JSON.parse(ev("JSON.stringify(cleanGym({dbStep:3,plates:['x',99,25,25,10,0.5],bar:15}))")),Z=JSON.parse(ev("JSON.stringify([cleanGym({plates:[]}).plates,cleanGym({plates:'x',dbStep:'2'}),cleanGym({dbStep:2.5}).dbStep])"));
    ok("old backup (no fields): dumbbell step off, plate set default, bar kept",D.dbStep===0&&D.plates.join()==="25,20,15,10,5,2.5,1.25"&&D.bar===20&&B.bar===15);
    ok("junk values are dropped: an invalid step becomes 0, plates are filtered/sorted from the list, an empty or broken list becomes the default",B.dbStep===0&&B.plates.join()==="25,10,0.5"&&Z[0].join()==="25,20,15,10,5,2.5,1.25"&&Z[1].plates.length===7&&Z[1].dbStep===0&&Z[2]===2.5);
    ok("in the default inventory every exercise's increment equals the old one",ev("EXDB.every(e=>gInc(e.id)===e.inc)")&&ev("gInc('lat')")===1);
    ev("S.dbStep=2");
    ok("the dumbbell step applies only to dumbbell moves",ev("gInc('dbbench')")===2&&ev("gInc('squat')")===2.5&&ev("gInc('tri')")===2.5&&ev("gInc('lat')")===2);
    ev(H("dbbench",12,12));
    ok("the suggestion rounds to the dumbbell step (12 x 12 -> 14)",ev("gSuggest('dbbench').kg")===14,ev("gSuggest('dbbench')"));
    ev("S.dbStep=0;S.plates=[25,20,15,10,5]");
    ev(H("squat",100,12));
    ok("without 1.25 and 2.5 plates the barbell increment is 10 kg, the suggestion is an achievable weight",ev("gInc('squat')")===10&&ev("gSuggest('squat').kg")===110);
    ev(H("squat",102.5,8));
    ok("an unachievable kg suggestion drops down (102.5 -> 100)",ev("gSuggest('squat').kg")===100);
    ev("S.plates=GPLATE_DEF.slice()");ev(H("squat",102.5,8));
    ok("in the default inventory the suggestion is unchanged",ev("gSuggest('squat').kg")===102.5);
    { // a top set rated 9.5 or harder keeps the weight, only while the difficulty field is on
      ev(H("squat",100,12));ev("S.workouts[0].ex[0].sets.forEach(x=>x.rpe=9.5);S.settings.rpeOn=false");
      ok("RPE off: a hard rating is ignored, the weight goes up",ev("gSuggest('squat').kg")===102.5);
      ev("S.settings.rpeOn=true");
      ok("RPE on, top reps reached with a 9.5 set: same weight, with the reason",ev("gSuggest('squat').kg")===100&&/zorlandın/.test(ev("gSuggest('squat').why")));
      ev("S.workouts[0].ex[0].sets.forEach(x=>x.rpe=8);");
      ok("RPE on but not hard: the weight goes up",ev("gSuggest('squat').kg")===102.5);
      ev("S.settings.rpeOn=false");ev(H("squat",102.5,8));
    }
    ev("S.workouts[0].day=keyOff(-21)");
    ok("gSuggest after a 21 day break: 10% lighter, with the reason",ev("gSuggest('squat').kg")<ev("S.workouts[0].ex[0].sets[0].kg")&&ev("gSuggest('squat').why").includes("Uzun ara verdin (21 gün)"),ev("gSuggest('squat')"));
    ev("S.plates=[25,20,15,10,5];S.workouts=[];gStart(null);gAddEx(gActive(),'squat');gActive().ex[0].sets[0].kg=100;gClick('kgp:0:0',document.body)");
    ok("the +/- button steps by the inventory step",ev("gActive().ex[0].sets[0].kg")===110);
    ev("S.plates=[20,10];exPlateSheet(0)");
    q("#pk").value="100";q("#pk").dispatchEvent(new w.Event("input"));
    ok("plate math uses the plates on hand (100 kg, [20,10] -> 20 + 20)",q("#pres").textContent.includes("20 + 20 kg"),q("#pres").textContent);
    q("#pk").value="95";q("#pk").dispatchEvent(new w.Event("input"));
    ok("for an unachievable target the nearest lower weight is written",q("#pres").textContent.includes("en yakın: 80 kg"),q("#pres").textContent);
    ev("closeSheet();S.workouts=[];S.plates=GPLATE_DEF.slice();tab='settings-modules';render()");
    ok("Settings > Gym: dumbbell step and plate buttons",qa('[data-g^="gdb:"]').length===4&&qa('[data-g^="gpl:"]').length===10&&q('[data-g="gdb:0"]').getAttribute("aria-pressed")==="true"&&q('[data-g="gpl:25"]').getAttribute("aria-pressed")==="true"&&q('[data-g="gpl:2"]').getAttribute("aria-pressed")==="false");
    q('[data-g="gdb:2.5"]').click();q('[data-g="gpl:1.25"]').click();q('[data-g="gpl:0.5"]').click();
    ok("choices are saved, marks update, the list runs largest to smallest",ev("S.dbStep")===2.5&&ev("S.plates.join()")==="25,20,15,10,5,2.5,0.5"&&q('[data-g="gdb:2.5"]').getAttribute("aria-pressed")==="true"&&q('[data-g="gpl:1.25"]').getAttribute("aria-pressed")==="false");
    ev("S.plates=[25]");q('[data-g="gpl:25"]').click();
    ok("the last plate cannot be removed",ev("S.plates.join()")==="25"&&q("#toast").textContent.includes("En az bir plaka"));
    ok("save round trip: the inventory persists",ev("(()=>{const c=cleanGym(JSON.parse(JSON.stringify(S)));return c.dbStep===2.5&&c.plates.join()==='25'})()"));
    ev("S.dbStep=0;S.plates=GPLATE_DEF.slice();tab='today';render()");
  }
  { // Coach first impression
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],k=()=>ev("viewCoach()");
    ev("S.chat=[];S.settings.consent=false;offline=null");
    ok("without a key the intro: what it does, where data goes, offline, works without the Coach; no 'API'",k().includes("Rehber ne yapar")&&k().includes("Verin nereye gider")&&k().includes("çevrimdışı çalışmaz")&&k().includes("onay verirsen")&&k().includes("Rehber olmadan da uygulama tam çalışır")&&!/\bAPI\b/.test(k())&&!k().includes("Açık rızamı veriyorum"),k());
    ev("openSheet('x');cClick('guide',document.body)");
    const names=ev("S.providers.filter(p=>GUIDE[p.id]).map(p=>p.name)"),st=()=>q("#sheet").textContent;
    ok("setup: key field and 6 provider buttons; no 'API'",names.length===6&&names.every(n=>st().includes(n))&&!!q("#sk[type=password]")&&qa('[data-c^="sp:"]').length===6&&!/\bAPI\b/.test(st()),names);
    ok("each provider's guide has 3-4 steps and a button back to the key",ev("S.providers.filter(p=>GUIDE[p.id]).every(p=>{cGuide(p.id);const s=document.querySelector('#sheet');const n=s.querySelectorAll('ol li').length;return n>=3&&n<=4&&!!s.querySelector('[data-c=\"setup\"]')})"));
    const calls=[];let resp=null;w.fetch=async(u,o)=>{calls.push({u,o});if(!resp)throw new TypeError("Failed to fetch");return typeof resp==="function"?resp(u,o):resp};
    const R=(status,body)=>({ok:status<300,status,json:async()=>JSON.parse(body),text:async()=>body});
    const type=v=>{q("#sk").value=v;q("#sk").dispatchEvent(new w.Event("input",{bubbles:true}))};
    ev("S.settings.age=30;cSetup(true)");type("sk-proj-ornek12345");
    ok("sk-proj- is recognised as OpenAI; the paid note and the 'your health data does not go' sentence show",ev("su.id")==="openai"&&st().includes("kullandıkça ücret çıkabilir; kotayı sağlayıcı sitende sen belirlersin")&&st().includes("Anahtarını ve bir deneme cümlesini sağlayıcıya göndeririz; sağlık verin gitmez"));
    q('[data-c="sp:groq"]').click();type("sk-ant-api03-ornek");
    ok("sk-ant- is recognised as Anthropic (even when Groq was selected first)",ev("su.id")==="anthropic"&&!!q('[data-c="stest"]'));
    q('[data-c="sp:groq"]').click();ok("no price note on a free provider",!st().includes("kullandıkça ücret"));await ev("suTest()");
    ok("an Anthropic key is not sent even if Groq is selected by hand",calls.length===0&&st().includes("gönderilmedi"));
    type("kısa");q('[data-c="sp:groq"]').click();q('[data-c="stest"]').click();
    ok("missing key: no network call, nothing saved",calls.length===0&&ev("getKeys().groq")===undefined&&st().includes("eksik"));
    type("gsk_ornekanahtar123");
    ok("provider guess from the prefix: gsk_ selects Groq, changeable",q('[data-c="sp:groq"]').getAttribute("aria-pressed")==="true"&&st().includes("Groq anahtarı olarak tanındı"));
    ev("S.settings.age=16");await ev("suFetch()");
    ok("under 18: setup makes no network call",calls.length===0&&st().includes("18 yaş altında"));
    ev("S.settings.age=0");await ev("suFetch()");
    ok("age not entered: setup makes no network call, points to entering the age",calls.length===0&&st().includes("yaşını gir"));
    ev("setKey('groq','gsk_x12345678');cSheetProv('groq')");await ev("cProvClick('ptest','groq')");await ev("cProvClick('pmodels','groq')");
    ok("under 18: the test and model list on the next page make no network call either",calls.length===0);
    ev("setKey('groq','');cSetup(true)");type("gsk_ornekanahtar123");
    /* Real NVIDIA/Groq reply shapes: timeout, a model not on the account (404 Function), a thinking model with null content + reasoning_content. */
    const chatBy=f=>(u,o)=>u.endsWith("/models")?R(200,JSON.stringify({data:[{id:"whisper-large-v3"},{id:"llama-3.1-8b-instant"},{id:"llama-3.3-70b-versatile"},{id:"openai/gpt-oss-120b"}]})):f(JSON.parse(o.body).model);
    ev("S.settings.age=30");resp=chatBy(m=>{if(m==="llama-3.3-70b-versatile")throw Object.assign(new Error("x"),{name:"AbortError"});if(m==="openai/gpt-oss-120b")return R(404,'{"detail":"Function f: Not found for account a"}');return R(200,JSON.stringify({choices:[{message:{content:null,reasoning_content:"düşünüyor"},finish_reason:"length"}]}))});
    await ev("suFetch()");
    ok("models are fetched, non-chat ones dropped; a candidate that does not answer or is not on the account is skipped, the first working one is suggested",calls[0].u==="https://api.groq.com/openai/v1/models"&&calls.length===4&&ev("su.models.length")===3&&ev("su.model")==="llama-3.1-8b-instant"&&ev("su.ok")==="llama-3.1-8b-instant"&&st().includes("denendi")&&st().includes("Anahtar çalışıyor"));
    ok("the trial request is limited to 15 s and leaves room for a thinking model (200 tokens)",JSON.parse(calls[1].o.body).max_tokens===200);
    q('[data-c="sadv"]').click();q("#smsel").value="llama-3.3-70b-versatile";q("#smsel").dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("next: another model can be chosen",ev("su.model")==="llama-3.3-70b-versatile"&&!!q("#smfree"));
    resp=R(400,'{"error":{"message":"Please pass a valid API key"}}');await ev("suTest()");
    ok("the test error is readable Turkish (wrong key from a 400 body), not saved",st().includes("Anahtar kabul edilmedi")&&ev("getKeys().groq")===undefined&&!q('[data-c="ssave"]'));
    resp=null;await ev("suTest()");
    ok("no network: a separate message and a 'Denemeden kaydet' option",st().includes("İnternet yok")&&!!q('[data-c="ssave"]'));
    ev("S.settings.healthNote='gizli not'");calls.length=0;resp=R(200,JSON.stringify({choices:[{message:{content:"tamam"}}]}));await ev("suTest()");
    ok("the test request carries no health data, only a fixed sentence",calls.length===1&&!calls[0].o.body.includes("gizli not")&&JSON.parse(calls[0].o.body).messages.length===1);
    ok("successful test: key and chosen model are saved, the provider turns on, the intro yields to the consent notice",ev("getKeys().groq")==="gsk_ornekanahtar123"&&ev("S.providers.find(p=>p.id==='groq').model")==="llama-3.3-70b-versatile"&&ev("S.providers.find(p=>p.id==='groq').on")&&!k().includes("Rehber ne yapar")&&k().includes("Açık rızamı veriyorum")&&!q("#sheet").classList.contains("on"));
    ok("setup gives no consent: consent stays off, coachOn false",ev("S.settings.consent")===false&&ev("coachOn()")===false);
    ev("pFail('groq',Object.assign(new Error('x'),{status:429,body:'insufficient_quota'}));offline='fail'");
    ok("a chat error shows the reason (quota)",k().includes("Groq: Hesabının kotası"));
    ev("cSetup(true)");type("nvapi-ornekanahtar");calls.length=0;resp=(u)=>u.endsWith("/models")?R(200,JSON.stringify({data:[{id:"google/gemma-4-31b-it"},{id:"nvidia/nemotron-3-super-120b-a12b"}]})):R(403,'{"detail":"Authorization failed"}');await ev("suFetch()");
    ok("NVIDIA: the list comes even without a key; when a real request rejects the key the trials stop and say 'key'",calls.length===2&&ev("su.ok")===""&&st().includes("Anahtar kabul edilmedi"));
    ev("cSetup(true)");type("sk-ant-api03-ornekanahtar");calls.length=0;resp=(u)=>u.endsWith("/models?limit=1000")?R(200,JSON.stringify({data:[{id:"claude-sonnet-5-5"},{id:"claude-haiku-4-5"}]})):R(200,JSON.stringify({content:[{type:"text",text:"tamam"}]}));await ev("suFetch()");
    const ah=calls[0]&&calls[0].o.headers;
    ok("Anthropic model list: x-api-key, version and browser headers; no Bearer; Haiku recommended",calls[0].u==="https://api.anthropic.com/v1/models?limit=1000"&&ah["x-api-key"]==="sk-ant-api03-ornekanahtar"&&ah["anthropic-version"]==="2023-06-01"&&ah["anthropic-dangerous-direct-browser-access"]==="true"&&!ah.Authorization&&ev("su.model")==="claude-haiku-4-5");
    const ab=JSON.parse(calls[1].o.body);await ev("suTest()");
    ok("the Anthropic trial request goes to the local Messages API; a tried model is saved without another request, the provider turns on",calls.length===2&&calls[1].u==="https://api.anthropic.com/v1/messages"&&ab.model==="claude-haiku-4-5"&&ab.messages[0].role==="user"&&ev("getKeys().anthropic")==="sk-ant-api03-ornekanahtar"&&ev("S.providers.find(p=>p.id==='anthropic').on&&S.providers.find(p=>p.id==='anthropic').health"));
    ok("the consent text names Anthropic",k().includes("Anthropic Claude"));
    const b1=ev("JSON.stringify(pBody({id:'anthropic',model:'claude-sonnet-5-5'},[{role:'system',content:'S'},{role:'assistant',content:'a'},{role:'user',content:'u'}],700))"),b2=ev("JSON.stringify(pBody({id:'openai',model:'gpt-6-luna'},[{role:'user',content:'u'}],700))");
    ok("Anthropic body: system separate, first message user; no temperature on Sonnet, low effort",b1==='{"model":"claude-sonnet-5-5","max_tokens":2700,"messages":[{"role":"user","content":"u"}],"system":"S","output_config":{"effort":"low"}}',b1);
    {const full=ev("CoachLib.SYSTEM")+" PROFİL: x",ab=JSON.parse(ev("JSON.stringify(pBody({id:'anthropic',model:'claude-sonnet-5-5'},[{role:'system',content:"+JSON.stringify(full)+"},{role:'user',content:'u'}],700))")),gb=ev("JSON.stringify(pBody({id:'groq',model:'x'},[{role:'system',content:"+JSON.stringify(full)+"},{role:'user',content:'u'}],700))");
    ok("Anthropic: system as two blocks, cache_control on the fixed SYSTEM block, the union is the original text",Array.isArray(ab.system)&&ab.system.length===2&&ab.system[0].cache_control.type==="ephemeral"&&ab.system[0].text===ev("CoachLib.SYSTEM")&&!ab.system[1].cache_control&&ab.system.map(x=>x.text).join("")===full);
    ok("no cache_control on other providers, system is plain text",!gb.includes("cache_control")&&JSON.parse(gb).messages[0].content===full)}
    ok("OpenAI body: max_completion_tokens and low effort; no max_tokens and temperature",b2==='{"model":"gpt-6-luna","messages":[{"role":"user","content":"u"}],"max_completion_tokens":2100,"reasoning_effort":"low"}',b2);
    let n2=0;calls.length=0;resp=()=>++n2===1?R(200,JSON.stringify({choices:[{message:{content:null,reasoning_content:"x"},finish_reason:"length"}]})):R(200,JSON.stringify({choices:[{message:{content:"yanıt"}}]}));
    ok("in chat, if a thinking model hits the limit with no text it is asked again once with three times the limit",await ev("callProvider(S.providers.find(p=>p.id==='nvidia'),'k',[{role:'user',content:'x'}],700)")==="yanıt"&&JSON.parse(calls[1].o.body).max_tokens===2100);
    ev("setKey('anthropic','');Object.assign(S.providers.find(p=>p.id==='anthropic'),{on:false,health:false});delete pstat.anthropic");
    ev("delete pstat.groq;delete cool.groq;offline=null;S.providers.find(p=>p.id==='groq').model='llama-3.3-70b-versatile';S.settings.healthNote='';setKey('groq','');S.settings.consent=false");delete w.fetch;
  }
  for(const [s,int,e] of [["-30",true,NaN],["1,5",true,NaN],["17,9",true,NaN],["1e3",true,NaN],["1e3",false,NaN],["12abc3",false,NaN],["1.5.2",false,NaN],["30 dk",true,30],["83,7 kg",false,83.7],["1.500",true,1500],["1.234.567",true,1234567],[".5",false,0.5]])
    ok(`num(${JSON.stringify(s)},${int})`,Object.is(ev(`num(${JSON.stringify(s)},${int})`),e));
  ok("number parsing",ev("[num('83,7'),num('83.7'),num('1.234,5'),num('1.500',true),num('abc')]").slice(0,4).join()==="83.7,83.7,1234.5,1500"&&isNaN(ev("num('abc')")));
  ok("an invalid sport duration is dropped",ev("cleanEntries([{type:'exercise',day:'2026-01-01',v:1500},{type:'exercise',day:'2026-01-01',v:30}]).out.length")===1);
  ok("the notification text is kept",ev("cleanSettings({reminders:[{id:1,t:'09:00',on:true,body:'Bugün su içmeyi unutma'}]}).reminders[0].body")==="Bugün su içmeyi unutma");
  ok("workout duration is capped at 600 min",ev("gDur({t0:Date.now()-3e6*60,t1:null})")===600);
  ev("S.settings.consent=false;setKey('nvidia','K1')");
  const bk=ev("JSON.stringify(Object.assign({},S,{settings:Object.assign({},S.settings,{consent:true}),providers:S.providers.map(p=>Object.assign({},p,{base:'https://evil.example/v1',confirm:false}))}))");
  w.document.body.insertAdjacentHTML("beforeend",'<textarea id="bk"></textarea>');w.document.querySelector("#bk").value=bk;
  await loadBackup();
  ok("a backup cannot change a key's address",ev("S.providers.find(p=>p.id==='nvidia').base")==="https://integrate.api.nvidia.com/v1",ev("S.providers.map(p=>p.base)"));
  ok("a backup cannot change consent and permission",ev("S.settings.consent")===false&&ev("S.providers.find(p=>p.id==='gemini').confirm")===true);
  ok("a backup cannot change the address of a keyless built-in provider either (a key pasted later does not go to the wrong server)",ev("S.providers.every(p=>p.base===defProviders().find(d=>d.id===p.id).base)"),ev("S.providers.map(p=>p.base)"));
  ok("a custom provider's address is free; an id named like an Object.prototype member is dropped",ev("(()=>{const r=cleanCoach({providers:[{id:'u9',name:'X',base:'https://x.example/v1',model:'m',on:true,health:true},{id:'constructor',name:'Y',base:'https://y.example/v1',model:'m',on:true,health:true}]});return r.providers.find(p=>p.id==='u9').base==='https://x.example/v1'&&!r.providers.some(p=>p.id==='constructor')})()"));
  ev("Object.assign(S.settings,{age:30,consent:true,consentV:CONSENT_V,consentP:'nvidia'});S.providers.forEach(p=>{p.on=p.health=p.id==='nvidia'});setKey('nvidia','K1');setKey('openai','')");
  ev("S.settings.consentP=null");
  ok("consent: without consentP (old record) re-consent is asked",ev("coachOn()")===false);
  ev("S.settings.consentP='nvidia'");
  ok("consent: without an age the Coach does not open, with an age it does",ev("(S.settings.age=0,coachOn())")===false&&ev("(S.settings.age=30,coachOn())")===true);
  ev("(()=>{const o=S.providers.find(p=>p.id==='openai');o.on=o.health=true;setKey('openai','sk-x')})()");
  ok("consent: entering a key for a paid provider outside the consent-time set needs re-consent",ev("coachOn()")===false);
  ev("cConsent(true)");
  ok("re-consent: the provider set is saved and the Coach opens",ev("coachOn()")===true&&ev("S.settings.consentP").includes("openai"));
  ev("(()=>{const o=S.providers.find(p=>p.id==='openai');o.on=o.health=false;setKey('openai','');Object.assign(S.settings,{consent:false,consentP:null,age:0})})()");
  ok("archive: over the total message cap old chats are dropped, the newest stays",ev("(()=>{const c=i=>({id:i,t:i,title:'t'+i,msgs:Array.from({length:150},(_,j)=>({id:j+1,role:'user',text:'x',t:1}))});const r=trimChats([1,2,3,4,5,6].map(c));return r.length===4&&r[0].id===1})()"));
  ok("history: only an applied card goes with macros and meal; pending and rejected are empty",ev("(()=>{const m=st=>({card:{kind:'log',state:st,items:[{type:'food',text:'a',kcal:100,p:5,c:10,f:2,meal:'breakfast'}]}});const a=cHistLog(m('ok'))[0];return a.p===5&&a.c===10&&a.f===2&&a.meal==='breakfast'&&cHistLog(m('no')).length===0&&cHistLog(m('pending')).length===0})()"));
  ok("a stored provider list is kept as it is (no built-in is added back)",ev("JSON.stringify(cleanCoach({providers:[{id:'groq',name:'Groq',base:'https://api.groq.com/openai/v1',model:'m',on:true,health:true}]}).providers.map(p=>[p.id,p.model,p.on,p.health]))")==='[["groq","m",true,true]]');
  ok("provider names from one source: the privacy screen, policy, data safety and store text all list them",(()=>{const n=ev("defProviders().map(p=>p.name)"),rd=f=>require("fs").readFileSync(path.join(__dirname,"../docs/"+f),"utf8");ev("sheetPrivacy()");const pv=$q("#sheet").textContent;ev("closeSheet()");return n.length===6&&n.every(x=>pv.includes(x)&&["privacy-policy.md","play-data-safety.md","store-listing.md"].every(f=>rd(f).includes(x)))})());
  ev("setKey('groq','KEY-sirri-12345');S.settings.healthNote='gizli not'");
  ev("document.querySelector('#bkpw')||document.body.insertAdjacentHTML('beforeend','<input id=\"bkpw\">')");
  ev("document.querySelector('#bkpw2')||document.body.insertAdjacentHTML('beforeend','<input id=\"bkpw2\"><div id=\"bkw\"></div>')");
  const pw1=w.document.querySelector("#bkpw"),pw2=w.document.querySelector("#bkpw2");
  for(const [a,b,msg,n] of [["","","en az 10","parolasız"],["abc","abc","en az 10","kısa"],["abcdefgh1","abcdefgh1","en az 10","9 karakter"],["1234567890","1234567890","kolay","yalnız rakam"],["Password123!","Password123!","kolay","yaygın parola + rakam"],["mavi-bulut-77","mavi-bulut-78","aynı değil","uyuşmayan"]]){
    pw1.value=a;pw2.value=b;
    ok(`a passwordless/weak backup is rejected: ${n}`,await ev("backupText()")===null&&w.document.querySelector("#bkw").textContent.includes(msg),w.document.querySelector("#bkw").textContent);
  }
  w.document.querySelector("#bkw").remove();pw1.value="mavi-bulut-77";pw2.value="mavi-bulut-77";
  w.backupP=ev("backupText()");
  const enc=await w.backupP;{
    ok("an encrypted backup contains no plain text",!enc.includes("gizli not")&&!enc.includes("KEY-sirri-12345")&&JSON.parse(enc).enc==="aes-gcm-pbkdf2");
    ev("setKey('groq','');S.settings.healthNote=''");
    w.document.querySelector("#bk").value=enc;w.document.querySelector("#bkpw").value="yanlis";
    await ev("goRestore()");
    ok("a wrong password does not restore",ev("S.settings.healthNote")===""&&ev("getKeys().groq")===undefined);
    w.document.querySelector("#bkpw").value="mavi-bulut-77";
    await ev("goRestore()");
    ok("the right password brings back data and keys",ev("S.settings.healthNote")==="gizli not"&&ev("getKeys().groq")==="KEY-sirri-12345",[ev("S.settings.healthNote"),ev("getKeys().groq"),ev("document.querySelector('#toast').textContent")]);
    { // if the record cannot be written, keys are not written to the vault and data is rolled back
      ev("setKey('groq','');S.settings.healthNote='eski'");w.document.querySelector("#bk").value=enc;ev("recovery={}");
      await ev("goRestore()");const k=ev("getKeys().groq"),h=ev("S.settings.healthNote");ev("recovery=null");
      ok("restore: if saving fails the key is not written, the old data stays",k===undefined&&h==="eski",[k,h]);
      // if storage is full, the inability to take a safety copy is announced BEFORE confirmation
      const oc=w.confirm;let cm="";w.confirm=m=>(cm=m,false);const ob=ev("otherBytes");ev("otherBytes=4e6");
      ev("S.entries=[{id:1,day:dayKey(),time:'08:00',type:'note',v:null,text:'x'}]");await ev("goRestore()");ev("otherBytes="+ob+";S.entries=[]");w.confirm=oc;
      ok("restore confirmation: says in advance if a safety copy cannot be taken",/güvenlik kopyası ALINAMAYACAK/.test(cm),cm);
    }
  { // automatic refresh (visibility, day change) does not erase a filled form field
    ev("S.settings.obDone=true;tab='today';closeSheet();render()");const v=w.document.querySelector("#view");
    v.insertAdjacentHTML("beforeend",'<input id="zz" class="in">');w.document.querySelector("#zz").value="yazdım";w.document.activeElement.blur();
    ev("renderSoft()");const kept=!!w.document.querySelector("#zz")&&w.document.querySelector("#zz").value==="yazdım";
    w.document.querySelector("#zz").value=w.document.querySelector("#zz").defaultValue;ev("renderSoft()");
    ok("renderSoft: a filled field is kept, an empty one is refreshed",kept&&!w.document.querySelector("#zz"),kept);
  }
  {
    const {textPdf}=require("./pdfmaker.js");
    const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click();
    const lab=textPdf([
      [["Hasta Adi Soyadi: Ali Veli",40]],[["T.C. Kimlik No: 12345678901",40]],[["Numune Alim Tarihi: 12.09.2026",40]],
      [["Glukoz (Aclik)",40],["98",200],["mg/dL",260],["70 - 100",340]],
      [["Lökosit",40],["7,2",200],["10^3/uL",260],["4,0 - 10,0",340]],
      [["HbA1c",40],["5,4",200],["%",260],["4,0-5,6",340]],
      [["LDL-Kolesterol",40],["130",200],["mg/dL",260],["< 100",340]]
    ]);
    let needPw=false;
    w.__labPdfLib={getDocument:o=>{
      if(needPw&&o.password!=="x")return {promise:Promise.reject({name:"PasswordException",code:o.password?2:1})};
      return pdfjs.getDocument({...o,data:new Uint8Array(o.data)});
    }};
    const file=d=>({size:d.length,arrayBuffer:async()=>d.buffer.slice(d.byteOffset,d.byteOffset+d.length)});
    ev("S.labs=[];S.entries=[]");
    ok("Trend has a lab card",ev("viewTrend()").includes("Tahlil takibi")&&ev("viewTrend()").includes('data-tab="labs"'));
    ok("pdf.js is not loaded at startup (only when labs open)",!html.includes('<script src="vendor')&&!/<script src="[^"]*pdf/.test(require("./html").full()));
    ev("tab='labs';render()");
    ok("empty labs screen: scan and add-by-hand buttons",!!q("#labfile")&&!!q('[data-lab="add"]')&&!q('[data-lab="pdf"]')&&q("#ttl").textContent==="Tahlil takibi"&&q('nav [data-tab="trend"]').getAttribute("aria-current")==="page");

    await ev("labFile")(file(lab));
    ok("read results screen: 4 rows, date filled",qa('[id^="ln"]').length===4&&q("#ld").value==="2026-09-12",qa('[id^="ln"]').length);
    ok("patient details are in neither the screen nor the state",!q("#sheet").innerHTML.match(/Ali|Veli|12345678901/)&&!JSON.stringify(ev("S")).match(/Ali Veli|12345678901/));
    q("#lc1").checked=false;
    click('[data-lab="save"]');
    ok("an unchecked row is not saved",ev("S.labs.length")===3&&ev("S.labs.map(x=>x.k).join()")==="glukoz,hba1c,ldl",ev("S.labs.map(x=>x.k)"));
    ok("after saving it returns to the labs screen and the tests are listed",ev("tab")==="labs"&&q("#view").textContent.includes("Glukoz")&&q("#view").textContent.includes("LDL kolesterol")&&!q('[data-lab="pdf"]'));
    ok("an out-of-range value is flagged, a normal one is not",q("#view").textContent.includes("üstünde")&&(q("#view").textContent.match(/üstünde/g)||[]).length===1,q("#view").textContent);
    ok("a saved row has only the expected fields",ev("Object.keys(S.labs[0]).sort().join()")==="day,hi,id,k,lo,n,u,v");

    await ev("labFile")(file(lab));
    q("#lc1").checked=false;click('[data-lab="save"]');
    ok("reading the same PDF again creates no duplicate",ev("S.labs.length")===3&&q("#toast").textContent.includes("zaten"),q("#toast").textContent);

    ev("labReview({date:'',rows:[]},true)");
    ok("add by hand: date today, one empty row",qa('[id^="ln"]').length===1&&q("#ld").value===ev("dayKey()"));
    q("#ln0").value="Ferritin";q("#lv0").value="12";q("#lu0").value="ng/mL";q("#ll0").value="13";q("#lh0").value="150";
    click('[data-lab="save"]');
    ok("a hand-added result is saved with the dictionary key",ev("S.labs.some(x=>x.k==='ferritin'&&x.v===12&&x.lo===13&&x.hi===150&&x.u==='ng/mL')"));

    ev("labReview({date:'',rows:[]},true)");q("#ln0").value="Glukoz";q("#lv0").value="abc";click('[data-lab="save"]');
    ok("an unreadable value is not saved and warns",ev("S.labs.length")===4&&q("#toast").textContent.includes("okunamadı")&&!!q("#ld"),q("#toast").textContent);
    q("#lv0").value="<20";q("#lu0").value="mg/dL";q("#ll0").value="5";q("#lh0").value="3";click('[data-lab="save"]');
    ok("a lower bound above the upper bound is not saved",ev("S.labs.length")===4);
    q("#ll0").value="";q("#lh0").value="";q("#ld").value="2999-01-01";click('[data-lab="save"]');
    ok("a future date is not saved",ev("S.labs.length")===4&&q("#toast").textContent.includes("ileri"));
    q("#ld").value="2026-08-01";click('[data-lab="save"]');
    ok("the < qualifier and a second date are saved",ev("S.labs.some(x=>x.k==='glukoz'&&x.q==='<'&&x.v===20&&x.day==='2026-08-01')"));

    click('[data-lab="open:glukoz|mg/dL"]');
    ok("detail: chart and delete buttons for two results",!!q("#sheet svg")&&qa('#sheet [data-lab^="del:"]').length===2);
    {
      const last=ev("S.labs.filter(x=>x.k==='glukoz').map(x=>x.day).sort().pop()"),back=n=>new Date(Date.parse(last+"T00:00:00Z")-n*864e5).toISOString().slice(0,10),oldv=ev("S.vitals");
      ok("lab detail: no home readings, no home-readings block",!q("#sheet details"));
      ev("S.vitals=[{id:1,sid:'a',k:'t',day:'"+back(3)+"',time:'08:00',sys:130,dia:90,session:'morning'},{id:2,sid:'b',k:'s',day:'"+back(5)+"',time:'08:00',g:100,ctx:'fasting'}]");
      click('#sheet [data-lab="close"]');click('[data-lab="open:glukoz|mg/dL"]');
      const d=q("#sheet details");
      ok("lab detail: home readings of the 30 days before sit side by side without any comparison or judgement",!!d&&d.textContent.includes("Tansiyon ortalaması 130/90 (1 ölçüm)")&&/Şeker ortalaması 100/.test(d.textContent)&&/yorum değildir/.test(d.textContent)&&!/yüksek|düşük|normal|uyumlu/i.test(d.textContent),d&&d.textContent);
      ev("S.vitals=[]");
      click('#sheet [data-lab="close"]');click('[data-lab="open:glukoz|mg/dL"]');
    }
    click('#sheet [data-lab^="del:"]');
    ok("a single result is deleted, the undo button brings it back",ev("S.labs.filter(x=>x.k==='glukoz').length")===1);
    click("#tundo");
    ok("undo brings the deleted result back",ev("S.labs.filter(x=>x.k==='glukoz').length")===2);

    // PDF export (canvas and plugins faked)
    const {ctx,drawn}=canvas();let saved=null,shared=null;
    w.HTMLCanvasElement.prototype.getContext=()=>ctx;
    const jpgB64="/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
    w.HTMLCanvasElement.prototype.toDataURL=()=>"data:image/jpeg;base64,"+jpgB64;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/x.pdf"}}};
    w.Capacitor.Plugins.Share={share:async o=>{shared=o}};
    await ev("labExport()");
    const pdfBytes=Buffer.from(saved.data,"base64");
    const pd=await pdfjs.getDocument({data:new Uint8Array(pdfBytes),verbosity:0}).promise;
    ok("the PDF is exported: file name, valid PDF, share",/^neowell-tahlil-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&pdfBytes.slice(0,5).toString()==="%PDF-"&&pd.numPages===1&&shared.files[0]==="file:///cache/x.pdf",[saved.path,pd.numPages]);
    ok("tests and reference text are drawn into the PDF, no patient details",["Glukoz","LDL kolesterol","Ferritin","HbA1c"].every(n=>drawn.includes(n))&&drawn.some(t=>/Raporda yazan aralık: 70 – 100/.test(t))&&!drawn.join("|").match(/Ali|Veli|12345678901/),drawn);
    ok("an out-of-range value is stated plainly in the PDF",drawn.includes("▲ Raporda yazan aralığın üstünde")&&drawn.some(t=>/Bu değerleri hekiminle değerlendir\./.test(t)));
    ev("S.labs=S.labs.concat(Array.from({length:30},(_,i)=>({id:900+i,day:'2026-09-01',k:'t'+i,n:'Test '+i,v:i+1,u:'x'})))");
    drawn.length=0;await ev("labExport()");
    const pd2=await pdfjs.getDocument({data:new Uint8Array(Buffer.from(saved.data,"base64")),verbosity:0}).promise;
    ok("with many tests it splits into pages",pd2.numPages>=4&&drawn.some(t=>/sayfa 4\//.test(t)),pd2.numPages);
    ev("S.labs=S.labs.filter(x=>x.id<900)");

    // backup: lab data survives a backup-restore round trip
    const bkJ=ev("JSON.stringify(S)");
    ev("S.labs=[]");doc.querySelector("#bk").value=bkJ;
    await loadBackup();
    ok("restoring from a backup brings the lab records",ev("S.labs.length")>=4&&ev("S.labs.some(x=>x.k==='ferritin')"),ev("S.labs.length"));
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),labs:[{day:"bozuk",n:"x",v:1},{day:"2026-01-01",n:"Glukoz",v:90,u:"mg/dL"},"çöp",null]});
    await loadBackup();
    ok("broken lab rows are filtered out on load",ev("S.labs.length")===1&&ev("S.labs[0].v")===90);
    ok("a reset starts a new lab list",ev("DEF.labs.length")===0);

    // scanned PDF, non-PDF file, protected PDF
    await ev("labFile")(file(textPdf([[["Sayfa",40]]])));
    ok("scanned PDF: an explanation and add-by-hand are suggested",q("#sheet").textContent.includes("Metin bulunamadı")&&!!q('#sheet [data-lab="add"]'));
    await ev("labFile")(file(new Uint8Array([1,2,3,4])));
    ok("a non-PDF file: an error message, no crash",q("#toast").textContent.includes("açılamadı"),q("#toast").textContent);
    await ev("labFile")({size:2e7,arrayBuffer:async()=>new ArrayBuffer(1)});
    ok("a file over 15 MB is rejected",q("#toast").textContent.includes("büyük"));
    await ev("labFile")(file(textPdf([[["Numune Tarihi 01.09.2026",40]],[["Kontrol Metni",40]]])));
    ok("a PDF with no result rows: an explanation",q("#sheet").textContent.includes("Sonuç bulunamadı"));
    needPw=true;
    await ev("labFile")(file(lab));
    ok("protected PDF: a password is asked",!!q("#labpw"));
    q("#labpw").value="yanlis";click('[data-lab="pw"]');await flush();
    ok("wrong password: asked again",!!q("#labpw")&&q("#sheet").textContent.includes("yanlış"));
    q("#labpw").value="x";click('[data-lab="pw"]');await flush();
    ok("right password: the results open",qa('[id^="ln"]').length===4);
    needPw=false;ev("closeSheet()");

    // delete all
    ev("tab='labs';render()");click('[data-lab="delall"]');
    ok("all lab records are deleted",ev("S.labs.length")===0);
    ev("tab='today';render()");
  }
  {
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)],click=s=>q(s).click();
    const box=(t,x,y,wd=120,h=30)=>({t,x,y,w:wd,h});
    const table=(k,p,c,f)=>({lines:[box("Besin Değerleri",50,350,300),box("100 g başına",500,352,160),box("Enerji",50,400,100),box(k,500,402,160),box("Yağ",50,450,60),box(f,500,449,60),box("Karbonhidrat",50,500,200),box(c,500,501,60),box("Protein",50,550,100),box(p,500,548,60)]});
    let reply=table("1840 kJ / 440 kcal","8,5 g","70 g","13 g"),sent=null;
    w.createImageBitmap=async()=>({width:2400,height:1800});
    w.Capacitor.Plugins.Ocr={recognize:async o=>{sent=o;if(reply instanceof Error)throw reply;return reply}};
    ev("S.myFoods=[]");
    ev("sheetFood()");
    ok("the label-read button in Yemek ekle (when the plugin exists)",!!q('[data-ocr="choose:label"]'));
    q('[data-ocr="choose:label"]').click();
    ok("choice screen: take a photo and gallery",!!q('[data-ocr="cam:label"]')&&!!q('[data-ocr="gal:label"]')&&q("#sheet").textContent.includes("hiçbir yere gönderilmez"));
    const clicked=[];const oc=w.HTMLInputElement.prototype.click;
    w.HTMLInputElement.prototype.click=function(){clicked.push(this)};
    q('[data-ocr="cam:label"]').click();q('[data-ocr="gal:label"]').click();
    w.HTMLInputElement.prototype.click=oc;
    ok("the camera option needs capture, the gallery does not; only images are accepted",clicked.length===2&&clicked[0].getAttribute("capture")==="environment"&&!clicked[1].hasAttribute("capture")&&clicked.every(i=>i.type==="file"&&i.accept==="image/*"));
    clicked.forEach(i=>i.remove());

    await ev("ocrRun")("label",{size:1000});
    ok("the photo is shrunk and sent to the plugin",typeof sent.image==="string"&&sent.image.length>10);
    ok("label screen: values filled, name empty",q("#ek").value==="440"&&q("#ep").value==="8,5"&&q("#ec").value==="70"&&q("#ef").value==="13"&&q("#en").value==="");
    q('[data-ocr="esave"]').click();
    ok("it is not saved without a name",ev("S.myFoods.length")===0&&q("#toast").textContent.includes("adını"));
    q("#en").value="Test Bisküvi";q('[data-ocr="esave"]').click();
    ok("a food is saved from the label (per 100 g)",ev("S.myFoods.length")===1&&ev("S.myFoods[0].n")==="Test Bisküvi"&&ev("S.myFoods[0].k")===440&&ev("S.myFoods[0].p")===8.5&&ev("S.myFoods[0].c")===70&&ev("S.myFoods[0].f")===13&&ev("S.myFoods[0].u[0][1]")===100,ev("S.myFoods"));
    ok("after saving the portion screen opens",q("#sheet").textContent.includes("Test Bisküvi")&&q("#sheet").textContent.includes("Porsiyon"));
    ok("a food from the label goes through the 'Benim besinlerim' cleaning",ev("cleanMyFoods(S.myFoods).length")===1);

    ev("closeSheet()");reply=table("1840 kJ / 140 kcal","8,5 g","70 g","13 g");
    await ev("ocrRun")("label",{size:1000});q("#en").value="Hatalı Okuma";q('[data-ocr="esave"]').click();
    ok("an inconsistent read warns and does not save",ev("S.myFoods.length")===1&&q("#ewarn").textContent.includes("tutarlı değil"),q("#ewarn")&&q("#ewarn").textContent);
    q('[data-ocr="esave"]').click();
    ok("on the second tap (with the user's confirmation) it is saved",ev("S.myFoods.length")===2);

    ev("closeSheet()");reply={lines:[box("Yağ",50,450,60),box("13 g",500,449,60),box("Karbonhidrat",50,500,200),box("70 g",500,501,60),box("Protein",50,550,100),box("8,5 g",500,548,60)]};
    await ev("ocrRun")("label",{size:1000});
    ok("if calories are unreadable the field is empty and the unreadable ones are listed",q("#ek").value===""&&q("#sheet").textContent.includes("Okunamayan: kalori"));
    q("#en").value="Kalorisiz";q('[data-ocr="esave"]').click();
    ok("it is not saved without calories",ev("S.myFoods.length")===2&&q("#toast").textContent.includes("Kalori gerekli"));
    q("#ek").value="abc";q('[data-ocr="esave"]').click();
    ok("a non-numeric value is rejected",ev("S.myFoods.length")===2&&q("#toast").textContent.includes("Sayı olarak"));

    ev("closeSheet()");reply={lines:[]};
    await ev("ocrRun")("label",{size:1000});
    ok("with no text, an explanation and try again",q("#sheet").textContent.includes("Yazı bulunamadı")&&!!q('#sheet [data-ocr="choose:label"]'));
    reply=new Error("boom");
    await ev("ocrRun")("label",{size:1000});
    ok("if the plugin errors it does not crash, it shows a message",q("#toast").textContent.includes("okunamadı"));
    await ev("ocrRun")("label",{size:40e6});
    ok("a very large photo is rejected",q("#toast").textContent.includes("büyük"));

    // lab photo
    ev("S.labs=[]");reply={lines:[box("Numune Tarihi: 12.09.2026",50,100,500),box("Glukoz",50,200,100),box("98",400,201,40),box("mg/dL",500,200,80),box("70 - 100",650,199,100)]};
    await ev("ocrRun")("labs",{size:1000});
    ok("lab photo: confirmation screen, date and rows filled",q("#ld").value==="2026-09-12"&&qa('[id^="ln"]').length===1&&q("#ln0").value==="Glukoz"&&q("#lv0").value==="98",qa('[id^="ln"]').length);
    click('[data-lab="save"]');
    ok("a lab read from a photo is saved",ev("S.labs.length")===1&&ev("S.labs[0].k")==="glukoz");
    reply={lines:[box("Kontrol metni",50,100,300)]};
    await ev("ocrRun")("labs",{size:1000});
    ok("when no lab rows come out, an explanation",q("#sheet").textContent.includes("Sonuç bulunamadı"));
    ev("closeSheet();S.labs=[];S.myFoods=[]");
    delete w.Capacitor.Plugins.Ocr;
    ev("sheetFood()");
    ok("without the plugin (browser) the label button is not shown",!q('[data-ocr="choose:label"]'));
    ev("closeSheet()");
  }
  {
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click(),txt=()=>q("#sheet").textContent,toastT=()=>q("#toast").textContent;
    const unclock=require('./clock').at(w,12); // on Today the measurement row appears when the reminder time comes
    const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
    const BAN=/hipertansiyon|hipoglisemi|hiperglisemi|anormal|tehlikeli|diyabet/i;
    ev("S.vitals=[];S.labs=[];S.entries=[];S.settings.bpOn=false;S.settings.bsOn=false;tab='today';render()");
    ok("when the feature is off it does not show on Today and Trend",!ev("viewToday()").includes("Ölçümler")&&!ev("viewTrend()").includes("Tansiyon")&&!ev("viewTrend()").includes("Şeker"));
    ev("tab='settings-modules';render()");
    ok("in Settings the buttons to turn on blood pressure and sugar tracking, reminders hidden",!!q('[data-vt="bptoggle"]')&&!!q('[data-vt="bstoggle"]')&&!shown().includes(7)&&!shown().includes(9));
    click('[data-vt="bptoggle"]');
    ok("blood pressure tracking turns on: no threshold fields, no preset button, blood pressure reminders",ev("S.settings.bpOn")===true&&!q("#bpSysHi")&&!q('[data-vt="bppreset"]')&&shown().includes(7)&&shown().includes(8)&&!shown().includes(9));
    ev("tab='today';render()");
    ok("Today to-do: a blood pressure row (no measurement), no sugar row while sugar is off",qa('#view .todo [data-vt="addbp"]').length===1&&q(".todo").textContent.includes("ölçüm yok")&&!q('#view [data-vt="addbs"]'));
    ev("tab='trend';render()");
    ok("Trend has a blood pressure card, no sugar card",!!q('[data-tab="bp"]')&&!q('[data-tab="glucose"]'));

    // blood pressure entry
    ev("tab='today';render()");
    ev("sheetBp()");
    ok("blood pressure screen: two measurement fields, session, day, time",!!q("#bs1")&&!!q("#bs2")&&qa("[data-vsession]").length===3&&!!q("#fday")&&/^\d\d:\d\d$/.test(q("#vtime").value));
    click('[data-vsession="evening"]');
    ok("the session choice is marked",q('[data-vsession="evening"]').getAttribute("aria-pressed")==="true"&&q('[data-vsession="morning"]').getAttribute("aria-pressed")==="false");
    q("#bs1").value="80";q("#bd1").value="90";click('[data-vt="savebp"]');
    ok("the systolic must be larger than the diastolic",ev("S.vitals.length")===0&&toastT().includes("Sistolik"),toastT());
    q("#bs1").value="";q("#bd1").value="";click('[data-vt="savebp"]');
    ok("it is not saved if the 1st measurement is empty",ev("S.vitals.length")===0&&toastT().includes("1. ölçüm"));
    q("#bs1").value="128";q("#bd1").value="82";q("#bn1").value="70";q("#bs2").value="132";click('[data-vt="savebp"]');
    ok("it is not saved if the 2nd measurement is half entered",ev("S.vitals.length")===0&&toastT().includes("2. ölçüm"));
    q("#bd2").value="86";click('[data-vt="savebp"]');
    ok("two measurements are saved: same session, raw values separate, chosen session",ev("S.vitals.length")===2&&ev("S.vitals[0].sid")===ev("S.vitals[1].sid")&&ev("S.vitals[0].session")==="evening"&&ev("S.vitals[0].sys")===128&&ev("S.vitals[1].sys")===132&&ev("S.vitals[0].pulse")===70,ev("S.vitals"));
    ok("save notice: average and no target-range note (130/84 is in range)",toastT().includes("130/84 (ortalama)")&&!toastT().includes("üstünde"),toastT());
    ok("once measured today the Today blood pressure row goes away",!q('#view [data-vt="addbp"]'));

    // outlier and extreme value box
    ev("sheetBp()");
    q("#bs1").value="200";q("#bd1").value="100";click('[data-vt="savebp"]');
    ok("if it differs by more than 60 from the previous measurement it warns and does not save",ev("S.vitals.length")===2&&q("#vwarn").textContent.includes("Yanlış yazmış"),q("#vwarn").textContent);
    click('[data-vt="savebp"]');
    ok("on the second tap it is saved and for an extreme value dated today the 112 box appears",ev("S.vitals.length")===3&&txt().includes("acil yardım")&&txt().includes("kaydedildi")&&!txt().match(/teşhis|hasta/i),txt());
    click('#sheet [data-vt="close"]');
    ev("sheetBp()");
    q("#fday").value=ev("keyOff(-3)");q("#bs1").value="190";q("#bd1").value="125";click('[data-vt="savebp"]');
    ok("for a retroactive extreme value no emergency box appears, one record is added",ev("S.vitals.length")===4&&!txt().includes("acil yardım"),[ev("S.vitals.length"),txt().slice(0,80)]);
    ev("closeSheet()");

    // view
    ev("tab='bp';render()");
    const v=q("#view").textContent;
    ok("blood pressure view: home average, chart points, doctor report, delete buttons",v.includes("Ev ortalaması")&&v.includes("mmHg")&&qa("#view svg circle").length>=3&&!q('[data-vt="pdfmenu:t"]')&&qa('#view [data-vt^="del:"]').length>=2&&q("#ttl").textContent==="Tansiyon"&&q('nav [data-tab="trend"]').getAttribute("aria-current")==="page",v.slice(0,300));
    ok("average warning: fewer than 3 days",v.includes("en az 3 gün"));
    ok("diagnostic language is absent from the view",!BAN.test(v)&&!BAN.test(ev("viewToday()")),v.match(BAN));
    ok("a 200/100 session is not flagged, no comment",!/▲|▼|üstünde|altında/.test(v)&&v.includes("Bu değerleri hekiminle değerlendir."));
    const n0=ev("S.vitals.length");
    click('#view [data-vt^="del:"]');
    ok("a measurement is deleted, undo brings it back",ev("S.vitals.length")<n0);
    click("#tundo");
    ok("undo brings back the deleted one",ev("S.vitals.length")===n0);
    click('[data-vt="range:7"]');
    ok("the range button refreshes the chart",ev("vRange")===7&&q('[data-vt="range:7"]').getAttribute("aria-pressed")==="true");

    // sugar
    ev("tab='settings-modules';render()");click('[data-vt="bstoggle"]');
    ok("sugar tracking turns on, the reminder shows; no target field or ADA preset",ev("S.settings.bsOn")===true&&!q("#gFastHi")&&shown().includes(9)&&!q('[data-vt="gpreset"]')&&!/ADA 20|diyabet/i.test(q("#view").textContent));
    ev("tab='today';render()");
    ok("on Today to-do a sugar row, no blood pressure since it is measured",!!q('#view .todo [data-vt="addbs"]')&&q(".todo").textContent.includes("Şeker")&&!q('#view [data-vt="addbp"]'));
    const addG=(g,ctx,day)=>{ev("sheetBs()");q("#gv").value=String(g);click(`[data-vctx="${ctx}"]`);if(day)q("#fday").value=day;click('[data-vt="savebs"]')};
    addG(95,"fasting");
    ok("sugar is saved: context and value",ev("S.vitals.filter(r=>r.k==='s').length")===1&&ev("S.vitals.find(r=>r.k==='s').ctx")==="fasting"&&ev("S.vitals.find(r=>r.k==='s').g")===95&&toastT().includes("95 mg/dL")&&!toastT().includes("üstünde"),toastT());
    addG(160,"after");
    ok("160 after a meal: no flag",!toastT().includes("üstünde")&&ev("S.vitals.filter(r=>r.k==='s').length")===2,toastT());
    addG(150,"fasting");
    ok("160/150 fasting: no flag either, no comment is written",!/üstünde|altında|aralığ/.test(toastT())&&ev("S.vitals.filter(r=>r.k==='s').length")===3,toastT());
    addG(250,"after");
    ok("fasting 95 / after-meal 250: different contexts, no outlier warning",ev("S.vitals.filter(r=>r.k==='s').length")===4);
    addG(310,"fasting");
    ok("a difference over 150 in the same context warns and does not save",ev("S.vitals.filter(r=>r.k==='s').length")===4&&q("#vwarn").textContent.includes("Aynı bağlamdaki"),q("#vwarn")&&q("#vwarn").textContent);
    q("#gv").value="abc";click('[data-vt="savebs"]');
    ok("a non-numeric sugar is rejected",ev("S.vitals.filter(r=>r.k==='s').length")===4&&toastT().includes("mg/dL"));
    q("#gv").value="10";click('[data-vt="savebs"]');
    ok("a sugar below 20 is rejected",ev("S.vitals.filter(r=>r.k==='s').length")===4&&toastT().includes("20-800"));
    q("#gv").value="50";click('[data-vctx="random"]');click('[data-vt="savebs"]');
    ok("a very low value dated today shows the 112 box",ev("S.vitals.filter(r=>r.k==='s').length")===5&&txt().includes("acil yardım"));
    click('#sheet [data-vt="close"]');
    ev("S.labs=[{id:1,day:'2026-09-01',k:'hba1c',n:'HbA1c',v:5.4,u:'%'}]");
    ev("tab='glucose';render()");
    const sv=q("#view").textContent;
    ok("sugar view: last measurement, average, no target percentage, by context, chart, lab HbA1c",sv.includes("Son ölçüm")&&sv.includes("Ortalama")&&!sv.includes("Hedef aralığında")&&sv.includes("Bağlama göre ortalama")&&qa("#view svg circle").length>=5&&sv.includes("HbA1c")&&sv.includes("karıştırılmaz"),[sv.includes("Son ölçüm"),/Hedefaralığında%\d+/.test(sv.replace(/\s/g,"")),qa("#view svg circle").length,sv.includes("HbA1c"),sv.includes("karıştırılmaz"),ev("S.labs.length")]);
    ev("S.labs=[{id:1,day:'2025-03-04',k:'hba1c',n:'HbA1c',v:5.45,u:'%'}]");ev("tab='glucose';render()");
    ok("HbA1c row prints its date once, with the year, and the value to two decimals",q("#view").textContent.includes("HbA1c (4 Mar 2025)")&&q("#view").textContent.includes("5,45"),q("#view").textContent);
    ok("no diagnostic language in the sugar view",!BAN.test(sv),sv.match(BAN));
    ok("no interpretation labels appear on the blood pressure and sugar screens (normal/high/prediabetes/diabetes/hypertension)",!/normal|yüksek|prediyabet|diyabet|hipertansiyon/i.test(sv.replace(/En düşük \/ en yüksek/g,"")+v.replace(/En düşük \/ en yüksek/g,"")),[sv,v].map(x=>x.match(/normal|yüksek|prediyabet|diyabet|hipertansiyon/i)));

    // reminder setup
    const sched=[],exact=[];let perm="granted";const lnOld=w.Capacitor.Plugins.LocalNotifications;
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:perm}),getPending:async()=>({notifications:[]}),cancel:async()=>{},schedule:async o=>{sched.push(...o.notifications.map(n=>n.id));exact.push(...o.notifications.map(n=>n.isExactNotification))}};
    await ev("scheduleReminders()");
    ok("alarms are exact while the permission is granted, and inexact (no settings screen from the plugin) while it is denied",exact.length>0&&exact.every(Boolean)&&(perm="denied",exact.length=0,await ev("scheduleReminders()"),exact.length>0&&exact.every(x=>x===false)),exact.length);perm="granted";sched.length=0;await ev("scheduleReminders()");
    ok("blood pressure/sugar reminders are off by default: not scheduled",!sched.some(i=>i>=700&&i<1000));
    ev("S.settings.reminders.find(r=>r.id===7).on=true;S.settings.reminders.find(r=>r.id===9).on=true");
    sched.length=0;await ev("scheduleReminders()");
    ok("when turned on, 30 days of alarms are scheduled, ids do not clash",sched.some(i=>i>=701&&i<730)&&sched.some(i=>i>=901&&i<930)&&!sched.some(i=>i>=800&&i<830)&&new Set(sched).size===sched.length,[sched.length]);
    w.Capacitor.Plugins.LocalNotifications=lnOld;
    ev("vToggle('bp')");
    ok("turning the feature off turns its reminders off too, records stop",ev("S.settings.bpOn")===false&&ev("S.settings.reminders.find(r=>r.id===7).on")===false&&ev("S.vitals.filter(r=>r.k==='t').length")>=3);
    ev("vToggle('bp')");

    // backup round trip and cleanup
    const bkJ=ev("JSON.stringify(S)"),cnt=ev("S.vitals.length");
    ev("S.vitals=[]");doc.querySelector("#bk").value=bkJ;await loadBackup();
    ok("restoring from a backup brings the measurements",ev("S.vitals.length")===cnt&&ev("S.vitals.some(r=>r.k==='t'&&r.sid)"),[ev("S.vitals.length"),cnt]);
    ev("tab='today';render()");ev("sheetBp()");
    q("#fday").value=ev("keyOff(-1)");q("#bs1").value="128";q("#bd1").value="82";q("#bs2").value="128";q("#bd2").value="82";click('[data-vt="savebp"]');if(q("#vwarn")&&q("#vwarn").textContent.includes("Yanlış"))click('[data-vt="savebp"]');
    const twins=ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128&&r.dia===82).length");
    ok("two identical measurements (128/82 twice) are saved as two rows from the UI",twins===2&&ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128).every(r=>r.i===1||r.i===2)"),twins);
    doc.querySelector("#bk").value=ev("JSON.stringify(S)");await loadBackup();
    ok("two identical measurements are still two rows after a backup round trip",ev("S.vitals.filter(r=>r.day===keyOff(-1)&&r.sys===128&&r.dia===82).length")===2&&ev("VitalsLib.sessions(S.vitals).find(s=>s.day===keyOff(-1)&&s.sys===128).n")===2);
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),vitals:[{k:"t",day:"2026-09-10",time:"08:00",sys:300,dia:60},{k:"t",day:"2026-09-10",time:"08:01",sys:40,dia:60},{k:"s",day:"2026-09-10",time:"08:00",g:5},"çöp",null,{k:"s",day:"2026-09-10",time:"09:00",g:110,ctx:"fasting"}]});
    await loadBackup();
    ok("broken measurement rows are filtered out on load",ev("S.vitals.length")===2,ev("S.vitals"));
    ok("a reset starts an empty measurement list",ev("DEF.vitals.length")===0&&ev("DEF.settings.bpOn")===false);
    ev("S.settings.bpOn=true;S.settings.bsOn=true");

    // doctor report PDF
    const {ctx,drawn}=canvas();let saved=null,shared=null;
    w.HTMLCanvasElement.prototype.getContext=()=>ctx;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/r.pdf"}}};
    w.Capacitor.Plugins.Share={share:async o=>{shared=o}};
    ev("S.vitals=[];S.settings.bpSysHi=135;S.settings.bpDiaHi=85;S.settings.gFastLo=80;S.settings.gFastHi=130;S.settings.gPostHi=180");
    ev(`(()=>{const t=dayKey();S.vitals=[
      {id:1,k:'t',day:t,time:'07:30',sys:128,dia:82,pulse:70,session:'morning',sid:'a1',i:1},{id:2,k:'t',day:t,time:'07:32',sys:140,dia:90,session:'morning',sid:'a1',i:2},
      {id:3,k:'s',day:t,time:'07:00',g:95,ctx:'fasting'},{id:4,k:'s',day:t,time:'09:30',g:150,ctx:'after'}]})()`);
    ev("S.settings.bpOn=S.settings.bsOn=true;tab='trend';render()");click('[data-vt="pdfmenu:t"]');
    ok("report period choice: 7/14/30/90",qa('#sheet [data-vt^="pdf:t:"]').length===4);
    click('[data-vt="pdf:t:30"]');await flush();
    const pb=Buffer.from(saved.data,"base64"),pd=await pdfjs.getDocument({data:new Uint8Array(pb),verbosity:0}).promise;
    ok("blood pressure report: valid PDF, file name, share",/^neowell-tansiyon-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&pb.slice(0,5).toString()==="%PDF-"&&pd.numPages===1&&shared.files[0]==="file:///cache/r.pdf",[saved.path,pd.numPages]);
    ok("blood pressure report: two raw measurements on separate rows, average, warning note",drawn.includes("NeoWell · Tansiyon raporu")&&drawn.includes("128/82 mmHg  nabız 70")&&drawn.includes("140/90 mmHg")&&drawn.includes("Sabah, 1. ölçüm")&&drawn.includes("Sabah, 2. ölçüm")&&drawn.some(t=>/Bu değerleri hekiminle değerlendir\./.test(t))&&drawn.some(t=>/134\/86 mmHg/.test(t))&&drawn.some(t=>/^\d+ \S+ \d{4} - \d+ \S+ \d{4} \(30 gün\)$/.test(t)),drawn);
    ok("no diagnostic language in the report",!BAN.test(drawn.join(" ")));
    drawn.length=0;saved=null;
    ev("tab='trend';render()");click('[data-vt="pdfmenu:s"]');click('[data-vt="pdf:s:7"]');await flush();
    ok("sugar report: context and values, no target percentage",drawn.includes("NeoWell · Şeker raporu")&&drawn.includes("Açlık")&&drawn.includes("95 mg/dL")&&drawn.includes("Yemekten 2 saat sonra")&&!drawn.some(t=>/Hedef aralığ/.test(t)),drawn);
    ev(`(()=>{const t=dayKey();S.vitals=[];for(let i=0;i<120;i++)S.vitals.push({id:i+1,k:'s',day:keyOff(-(i%25)),time:String(6+(i%12)).padStart(2,'0')+':'+String(i%60).padStart(2,'0'),g:80+(i%60),ctx:'random'})})()`);
    drawn.length=0;saved=null;
    await ev("vPdf")("s",30);
    const pd2=await pdfjs.getDocument({data:new Uint8Array(Buffer.from(saved.data,"base64")),verbosity:0}).promise;
    ok("with many measurements the report splits into pages, page numbers are written",pd2.numPages>=3&&drawn.some(t=>new RegExp(`sayfa ${pd2.numPages}/${pd2.numPages}`).test(t)),pd2.numPages);
    ev("S.vitals=[]");saved=null;
    await ev("vPdf")("t",30);
    ok("no report is produced when there are no measurements",saved===null&&toastT().includes("Raporlanacak"));

    ev("S.vitals=[];S.labs=[];S.settings.bpOn=false;S.settings.bsOn=false;tab='today';render()");
    unclock();
  }
  {
    const doc=w.document,q=s=>doc.querySelector(s);
    const pdfjs=await import("pdfjs-dist/legacy/build/pdf.mjs");
    const {ctx,drawn}=canvas();let saved=null,shared=null;
    w.HTMLCanvasElement.prototype.getContext=()=>ctx;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/h.pdf"}}};
    w.Capacitor.Plugins.Share={share:async o=>{shared=o}};
    ev("S.entries=[];S.vitals=[];S.settings.bpOn=false;S.settings.bsOn=false;tab='trend';render()");
    ok("the weekly report button in Trend",!!q('[data-wk="pdf"]'));
    q('[data-wk="pdf"]').click();await flush();
    ok("no report is produced when there are no records, an explanation is given",saved===null&&q("#toast").textContent.includes("kayıt yok"));
    ev("add('weight',81.9,'');add('water',2000,'');add('food',1900,'Öğün');add('exercise',45,'Yürüyüş')");
    ev("S.settings.bpOn=true;S.vitals=[{id:1,k:'t',day:dayKey(),time:'08:00',sys:128,dia:82,session:'morning'}]");
    q('[data-wk="pdf"]').click();await flush();
    const pb=Buffer.from(saved.data,"base64"),pd=await pdfjs.getDocument({data:new Uint8Array(pb),verbosity:0}).promise;
    ok("weekly report: a valid single-page PDF, file name, share",/^neowell-haftalik-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&pb.slice(0,5).toString()==="%PDF-"&&pd.numPages===1&&shared.files[0]==="file:///cache/h.pdf",[saved.path,pd.numPages]);
    ok("report content: weight, water, calories, sport and (if tracking is on) blood pressure",drawn.includes("NeoWell · Son 7 gün raporu")&&drawn.some(t=>t.includes("81,9"))&&drawn.some(t=>/günlük ortalama 2,0 L/.test(t))&&drawn.some(t=>/1 gün kayıt var; ortalama için en az 3/.test(t))&&drawn.some(t=>/toplam 45 dk/.test(t))&&drawn.some(t=>/128\/82 mmHg/.test(t)),drawn);
    { // combined doctor report: cover + the blood pressure pages, the user's questions, no comments
      drawn.length=0;saved=null;
      ok("Hekime hazırlan row is the first one in the report list",!!q('[data-doc="open"]'));
      q('[data-doc="open"]').click();
      ok("the sheet asks for the period and five optional questions",w.document.querySelectorAll('[data-doc^="days"]').length===2&&w.document.querySelectorAll('#sheet input[id^="dq"]').length===5);
      q('[data-doc="days:90"]').click();q("#dq0").value="Tansiyon ilacımın saatini değiştirelim mi?";q("#dq1").value="  ";
      q('[data-doc="go"]').click();await flush();
      const db=Buffer.from(saved.data,"base64"),dd=await pdfjs.getDocument({data:new Uint8Array(db),verbosity:0}).promise;
      ok("doctor report: valid PDF with cover and the pressure page, file name",/^neowell-hekim-\d{4}-\d{2}-\d{2}\.pdf$/.test(saved.path)&&db.slice(0,5).toString()==="%PDF-"&&dd.numPages===2,[saved.path,dd.numPages]);
      ok("doctor report content: title, period, coverage, the question; empty question skipped",drawn.includes("NeoWell · Hekime hazırlan")&&drawn.some(t=>t.includes("son 90 gün"))&&drawn.some(t=>t==="Tansiyon ölçümü olan gün")&&drawn.some(t=>t.startsWith("1. Tansiyon ilacımın"))&&!drawn.some(t=>t.startsWith("2.")));
      ok("doctor report wording: no comment or rating words",!drawn.some(t=>/yüksek|düşük|normal|risk|iyi |kötü/i.test(t)),drawn.filter(t=>/yüksek|düşük|normal|risk/i.test(t)));
      ev("S.entries=[];S.vitals=[];S.labs=[]");saved=null;
      q('[data-doc="open"]').click();q('[data-doc="go"]').click();await flush();
      ok("doctor report: no records, no file, an explanation",saved===null&&q("#toast").textContent.includes("kayıt yok"));
    }
    ev("S.entries=[];S.vitals=[];S.settings.bpOn=false;tab='today';render()");
  }
  {
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click(),toastT=()=>q("#toast").textContent;
    const lnOld=w.Capacitor.Plugins.LocalNotifications;
    let types=null,list=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async o=>{types=o.types},schedule:async o=>{list=o.notifications}};
    ev("S.entries=[];S.vitals=[];S.settings.lastBackup='';S.settings.glass=250;S.settings.bpOn=false;S.settings.bsOn=false");

    // notification button definition
    await ev("scheduleReminders()");
    ok("the notification action type is registered: the 'water' button adds 250 ml",types&&types[0].id==="water"&&types[0].actions[0].id==="water"&&types[0].actions[0].title==="+250 ml",types);
    const water=list.filter(n=>[2,3,4].includes(Math.floor(n.id/100))),other=list.filter(n=>![2,3,4].includes(Math.floor(n.id/100)));
    ok("water notifications carry the action type and amount",water.length>0&&water.every(n=>n.actionTypeId==="water"&&n.extra.act==="water"&&n.extra.v===250),water[0]);
    ok("a water notification's extra.at is the planned instant (duplicate-check signature on redelivery), different on every notification",water.every(n=>n.extra.at===new Date(n.schedule.at).getTime())&&new Set(water.map(n=>n.extra.at)).size===water.length,water[0]);
    ok("other notifications have no button",other.length>0&&other.every(n=>n.actionTypeId===undefined&&(n.extra===undefined||n.extra.act==="open")));
    ev("S.settings.glass=330");await ev("scheduleReminders()");
    ok("when the cup size changes the button text and amount update",types[0].actions[0].title==="+330 ml"&&list.filter(n=>n.actionTypeId==="water").every(n=>n.extra.v===330));
    ev("S.settings.glass=250");

    // weekly backup reminder
    const bk=()=>list.filter(n=>Math.floor(n.id/100)===10);
    await ev("scheduleReminders()");
    ok("under 10 records the backup reminder is not scheduled",bk().length===0);
    ev("S.entries=Array.from({length:12},(_,i)=>({id:i+1,day:dayKey(),time:'08:00',type:'water',v:200,text:''}))");
    await ev("scheduleReminders()");
    ok("the backup reminder is scheduled on Sundays only (4-5 in 30 days)",bk().length>=3&&bk().length<=5&&bk().every(n=>new Date(n.schedule.at).getDay()===0),bk().map(n=>new Date(n.schedule.at).getDay()));
    ok("the backup notification text points to Drive",bk()[0].body.includes("Drive")&&bk()[0].title.includes("Yedek"));
    ev("S.settings.lastBackup=dayKey()");await ev("scheduleReminders()");
    const dayDiff=n=>Math.round((new Date(n.schedule.at).setHours(0,0,0,0)-new Date().setHours(0,0,0,0))/864e5);
    ok("within 7 days of a new backup the Sunday notification is skipped, later ones continue",bk().length>=2&&bk().every(n=>dayDiff(n)>=7),bk().map(dayDiff));
    ev("S.settings.lastBackup='2020-01-01'");await ev("scheduleReminders()");
    ok("with an old backup the reminder continues",bk().length>=3);
    ev("S.settings.reminders.find(r=>r.id===10).on=false");await ev("scheduleReminders()");
    ok("when turned off it is never scheduled",bk().length===0);
    ev("S.settings.reminders.find(r=>r.id===10).on=true;S.settings.lastBackup=''");
    w.Capacitor.Plugins.LocalNotifications=lnOld;

    // quick log: the native side accumulates, JS adds to the main data
    let pending=[];
    /* Native side: take keeps entries "in flight", ack(upto) deletes them after they are persisted (in-flight ones come again on back-to-back takes). */
    let inflight=[],acked=[];
    w.Capacitor.Plugins.QuickLog={take:async()=>{inflight=inflight.concat(pending);pending=[];return {items:inflight.slice()}},ack:async({upto})=>{acked.push(upto);inflight=inflight.filter(i=>i&&Number.isFinite(i.t)&&i.t>upto) /* the native side drops a malformed entry */}};
    const tms=(y,m,d,h,mi)=>new Date(y,m-1,d,h,mi).getTime();
    ev("S.entries=[];S.settings.waterMl=2500");
    pending=[{v:250,t:tms(2026,9,30,23,50)},{v:250,t:Date.now()-60000}];
    await ev("quickIngest()");
    ok("quick entries are added with the right day and time (an entry from before midnight belongs to yesterday)",ev("S.entries.length")===2&&ev("S.entries[0].day")==="2026-09-30"&&ev("S.entries[0].time")==="23:50"&&ev("S.entries[0].type")==="water"&&ev("S.entries[0].v")===250,ev("S.entries"));
    ok("the notification toast states the total amount",toastT().includes("500 ml")&&toastT().includes("bugün 250"),toastT());
    await ev("quickIngest()");
    ok("the same entries are not added a second time (take returns them once)",ev("S.entries.length")===2);
    pending=[{v:0,t:Date.now()},{v:1501,t:Date.now()},{v:250,t:Date.now()+36e5},{v:NaN,t:Date.now()},{v:250,t:0},{v:250},null,"x",{v:300,t:Date.now()-1000}];
    await ev("quickIngest()");
    ok("invalid entries (out of range, future, malformed) are dropped, a valid one is added",ev("S.entries.length")===3&&ev("S.entries[2].v")===300,ev("S.entries"));
    pending=[];await ev("quickIngest()");
    ok("empty list: no change",ev("S.entries.length")===3);
    { // if the record cannot be written (recovery mode) the queue is not lost and is retried later
      ev("S.entries=[]");pending=[{v:250,t:Date.now()-1000}];ev("recovery={}");await ev("quickIngest()");
      const held=ev("S.entries.length");ev("recovery=null");pending=[];await ev("quickIngest()");
      ok("quick log: if saving fails the memory is rolled back, it is added on the next attempt",held===0&&ev("S.entries.length")===1&&ev("S.entries[0].v")===250,[held,ev("S.entries")]);
      await ev("quickIngest()");ok("quick log: a retried item is added once",ev("S.entries.length")===1);
      await flush();
      ok("no ack is sent while writing fails (the entry stays in flight natively); once written the ack goes and the in-flight list empties",inflight.length===0&&acked.length>0);
      /* the process died between take and write: the entry stayed in flight and comes again on the next launch; the same notification is not added twice */
      ev("S.entries=[]");const tq=Date.now()-5000;inflight=[{v:250,t:tq}];await ev("quickIngest()");await flush();
      inflight=[{v:250,t:tq}];await ev("quickIngest()");await flush();
      ok("an in-flight water entry that comes again is added once (repeat blocked by qt) and emptied by ack",ev("S.entries.length")===1&&ev("S.entries[0].qt")===tq&&inflight.length===0,[ev("S.entries.length"),inflight]);
      ev("S.entries=[]");
    }
    ev("S.entries=[]");pending=[{v:250,t:Date.now()-1000}];
    const lnH=[];w.Capacitor.Plugins.LocalNotifications={checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async o=>{lnH.push(...o.notifications)}};
    ev("S.settings.waterMl=500;add('water',250,'')");
    await ev("quickIngest()");await flush();
    { // neowell-* files written to the cache for sharing are deleted, other files are untouched
      const del=[],old=w.Capacitor.Plugins.Filesystem;
      w.Capacitor.Plugins.Filesystem={readdir:async()=>({files:[{name:"neowell-yedek-2026-10-01.json"},{name:"neowell-tahlil-2026-10-01.pdf"},{name:"baska.txt"},{name:"neowell-x.exe"}]}),deleteFile:async o=>{del.push(o.path+"@"+o.directory)}};
      await ev("cacheClean()");
      ok("cache cleanup: only neowell-* backup/report files are deleted",del.join()==="neowell-yedek-2026-10-01.json@CACHE,neowell-tahlil-2026-10-01.pdf@CACHE",del);
      w.Capacitor.Plugins.Filesystem=old;
    }
    ok("if a quick log reaches the goal the notifications are rescheduled, today's water alarm is gone",lnH.length>0&&![200,300,400].some(i=>lnH.some(n=>n.id===i)),lnH.length);
    w.Capacitor.Plugins.LocalNotifications=lnOld;ev("S.settings.waterMl=2500");
    { // notification button key: pending ones without a key left from an update are cancelled at startup and rescheduled with the key
      const TK="0123456789abcdef0123456789abcdef",can=[],out=[],keep=ev("JSON.stringify({o:S.settings.medOn,m:S.meds,l:S.medLog,e:S.entries})");
      w.Capacitor.Plugins.QuickLog.getToken=async()=>({tk:TK});
      w.Capacitor.Plugins.LocalNotifications={checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[{id:200,extra:{act:"water",v:250,at:1}},{id:1001001,extra:{act:"med",m:1,s:"08:00",at:1}}]}),cancel:async o=>{can.push(...o.notifications.map(n=>n.id))},registerActionTypes:async()=>{},schedule:async o=>{out.push(...o.notifications)}};
      ev("S.entries=[];S.settings.medOn=true;S.meds=[{id:1,n:'A',t:['08:00'],on:true}];S.medLog=[]");
      await ev("scheduleReminders()");
      const btn=out.filter(n=>n.extra&&(n.extra.act==="water"||n.extra.act==="med"));
      ok("key: old pending water/medication notifications are cancelled; the rescheduled water and medication (including repeats) notifications carry extra.tk, the others do not",can.includes(200)&&can.includes(1001001)&&btn.some(n=>n.extra.act==="water")&&btn.some(n=>n.extra.act==="med"&&n.id>=2e6)&&btn.every(n=>n.extra.tk===TK)&&out.every(n=>!n.extra||n.extra.act==="water"||n.extra.act==="med"||!("tk" in n.extra)),can.slice(0,5));
      for(const g of [undefined,async()=>{throw new Error("yok")}]){
        if(g)w.Capacitor.Plugins.QuickLog.getToken=g;else delete w.Capacitor.Plugins.QuickLog.getToken;
        out.length=0;await ev("scheduleReminders()");
        ok(`key: ${g?"if getToken throws":"if the plugin has no getToken"} notifications are scheduled without a key`,out.some(n=>n.extra&&n.extra.act==="water")&&out.every(n=>!n.extra||!("tk" in n.extra)));
      }
      w.Capacitor.Plugins.LocalNotifications=lnOld;ev(`{const k=${keep};S.settings.medOn=k.o;S.meds=k.m;S.medLog=k.l;S.entries=k.e}`);
    }
    delete w.Capacitor.Plugins.QuickLog;
    ev("S.entries=[]");await ev("quickIngest()");
    ok("without the plugin (browser) it passes silently, no entry is added",ev("S.entries.length")===0);
    ev("S.entries=[]");

    // send to Drive
    let saved=null,shared=null,shareErr=null;
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{saved=o;return {uri:"file:///cache/y.json"}}};
    w.Capacitor.Plugins.Share={share:async o=>{if(shareErr)throw shareErr;shared=o}};
    ev("S.settings.healthNote='gizli sağlık notu';S.settings.lastBackup=''");
    ev("tab='settings-data';render()");
    ok("the Send to Drive button in Settings",!!q('[data-act="drive"]'));
    click('[data-act="drive"]');await flush();
    ok("backup screen: password fields, states that no account linking is needed",!!q("#bkp1")&&!!q("#bkp2")&&q("#sheet").textContent.includes("Hesap bağlamak gerekmez")&&!q("#bkrem"));
    q("#bkp1").value="abc";q("#bkp2").value="abc";click('[data-bk="send"]');await flush();
    ok("a short password is rejected",saved===null&&q("#bkw").textContent.includes("en az 10"));
    q("#bkp1").value="mavi-bulut-77";q("#bkp2").value="mavi-bulut-78";click('[data-bk="send"]');await flush();
    ok("mismatched passwords are not sent",saved===null&&q("#bkw").textContent.includes("aynı değil"));
    q("#bkp2").value="mavi-bulut-77";click('[data-bk="send"]');await until(()=>saved);await flush();
    ok("an encrypted backup is shared: file name, no plain text, share",saved&&/^neowell-yedek-\d{4}-\d{2}-\d{2}\.json$/.test(saved.path)&&JSON.parse(saved.data).enc==="aes-gcm-pbkdf2"&&!saved.data.includes("gizli sağlık notu")&&shared.files[0]==="file:///cache/y.json",saved&&saved.data.slice(0,120));
    ok("after sharing the last backup date is today, the notification text",ev("S.settings.lastBackup")===ev("dayKey()")&&toastT().includes("Drive"));
    // can it be restored (round trip)
    doc.body.insertAdjacentHTML("beforeend",'<textarea id="bk2"></textarea>');
    ev("S.settings.healthNote=''");
    const encJ=saved.data;
    ev("sheetBackup()");q("#bk").value=encJ;q("#bkpw").value="mavi-bulut-77";await ev("goRestore()");
    ok("the sent backup is restored with the same password",ev("S.settings.healthNote")==="gizli sağlık notu");
    ev("S.settings.healthNote='sonradan'");q("#bk").value=encJ;q("#bkpw").value="mavi-bulut-77";await ev("checkBackup()");
    ok("Yalnız denetle: the right password reports what is inside and loads nothing",ev("S.settings.healthNote")==="sonradan"&&/Parola doğru. Yedekte .*kayıt.*Hiçbir şey yüklenmedi/.test(toastT()),toastT());
    q("#bkpw").value="yanlis-parola-1";await ev("checkBackup()");
    ok("Yalnız denetle: a wrong password says so and loads nothing",ev("S.settings.healthNote")==="sonradan"&&toastT().includes("Parola yanlış"),toastT());
    ev("S.settings.healthNote='gizli sağlık notu'");
    // cancel
    shareErr=new Error("Share canceled");saved=null;ev("S.settings.lastBackup=''");
    ev("sheetDrive()");await flush();
    q("#bkp1").value="mavi-bulut-77";q("#bkp2").value="mavi-bulut-77";click('[data-bk="send"]');await until(()=>saved);await flush();
    ok("if sharing is cancelled the backup does not count as done",ev("S.settings.lastBackup")===""&&!toastT().includes("paylaşıldı"));
    shareErr=null;

    // storing the password with the Keystore
    w.Capacitor.Plugins.KeyVault={encrypt:async({text})=>({data:"ENC:"+Buffer.from(text).toString("base64")}),decrypt:async({data})=>({text:Buffer.from(data.slice(4),"base64").toString()})};
    ev("vaultOn=true");
    ev("sheetDrive()");await flush();
    ok("with the vault present the 'store password' box comes checked",!!q("#bkrem")&&q("#bkrem").checked);
    saved=null;q("#bkp1").value="mavi-bulut-77";q("#bkp2").value="mavi-bulut-77";click('[data-bk="send"]');await until(()=>saved);await flush();
    ok("the password is stored encrypted with the vault, not in plain text",!!ev("localStorage.getItem('nw_bkpw_enc')")&&!ev("localStorage.getItem('nw_bkpw_enc')").includes("mavi-bulut-77")&&ev("localStorage.getItem('nw_bkpw_enc')").startsWith("ENC:"));
    saved=null;ev("sheetDrive()");await flush();
    ok("one-tap sending with the stored password: no password field",!q("#bkp1")&&!!q('[data-bk="send"]')&&q("#sheet").textContent.includes("saklı"));
    click('[data-bk="send"]');await until(()=>saved);await flush();
    ok("the encrypted backup goes with the stored password",saved&&JSON.parse(saved.data).enc==="aes-gcm-pbkdf2");
    ev("sheetDrive()");await flush();click('[data-bk="forget"]');await flush();
    ok("forget password: the stored one is deleted, the fields come back",ev("localStorage.getItem('nw_bkpw_enc')")===null&&!!q("#bkp1"));

    // automatic encrypted backup
    ev("closeSheet()");
    ok("automatic backup: off by default, the cleaner accepts only true and a valid date",ev("DEF.settings.autoBk")===false&&ev("cleanSettings({autoBk:'evet',lastAutoBk:'x'}).autoBk")===false&&ev("cleanSettings({autoBk:'evet',lastAutoBk:'x'}).lastAutoBk")===""&&ev("cleanSettings({autoBk:true,lastAutoBk:'2026-09-01'}).lastAutoBk")==="2026-09-01");
    ev("tab='settings-data';render()");
    ok("automatic backup: without the plugin (browser) the setting is not shown",!q("[data-ab]"));
    const files={},bfLog=[];let bfFail=false;
    w.Capacitor.Plugins.BackupFolder={pick:async()=>{bfLog.push("pick");return {name:"NeoWell"}},status:async()=>({set:true,name:"NeoWell"}),clear:async()=>{bfLog.push("clear")},
      write:async({name,data})=>{bfLog.push("write");if(bfFail)throw new Error("write failed");files[name]=data;return {names:Object.keys(files)}},remove:async({names})=>{names.forEach(n=>delete files[n])}};
    ev("render()");
    ok("automatic backup: in Data and backup an off box and a 'turn on weekly' note",!!q('[data-ab="toggle"]')&&!q('[data-ab="toggle"]').checked&&q("#view").textContent.includes("en az haftada bir"));
    click('[data-ab="toggle"]');await flush();
    ok("automatic backup: turning on asks for a password, the box is not yet checked",!!q("#abp1")&&!!q("#abp2")&&ev("S.settings.autoBk")===false&&q("#sheet").textContent.includes("parolayla aç"));
    q("#abp1").value="abc";q("#abp2").value="abc";click('[data-ab="pick"]');await flush();
    ok("automatic backup: a short password is rejected, the folder is not asked",q("#abw").textContent.includes("en az 10")&&!bfLog.includes("pick"));
    const today=`neowell-oto-${ev("dayKey()")}.json`;
    const old=["2026-08-01","2026-08-08","2026-08-15","2026-08-22","2026-08-29"].map(d=>`neowell-oto-${d}.json`);old.forEach(n=>{files[n]="{}"});files["baska.txt"]="x";
    const manual=["2026-07-01","2026-08-02","2026-08-09",ev("dayKey()")].map(d=>`neowell-yedek-${d}.json`);manual.forEach(n=>{files[n]="elle "+n});
    ev("S.settings.lastBackup='';S.settings.healthNote='oto yedek notu'");
    q("#abp1").value="mavi-bulut-77";q("#abp2").value="mavi-bulut-77";click('[data-ab="pick"]');await until(()=>files[today]);await flush();
    const env=files[today]&&JSON.parse(files[today]);
    ok("automatic backup: once a folder is chosen it turns on, the password is kept in the vault, today's encrypted file is written",ev("S.settings.autoBk")===true&&ev("localStorage.getItem('nw_bkpw_enc')").startsWith("ENC:")&&env&&env.enc==="aes-gcm-pbkdf2"&&!files[today].includes("oto yedek notu"));
    ok("automatic backup: a format restorable with the same password (S and keys)",(await ev("BackupLib.decrypt")(env,"mavi-bulut-77")).S.settings.healthNote==="oto yedek notu");
    ok("automatic backup: the newest 4 automatic backups stay under a separate prefix; manual backups (including the same day's manual backup and old 'neowell-yedek-' ones) and other files are untouched",Object.keys(files).filter(n=>n.startsWith("neowell-oto-")).sort().join()===[...old.slice(2),today].join()&&manual.every(n=>files[n]==="elle "+n)&&files["baska.txt"]==="x");
    ok("automatic backup: the last automatic backup and last backup are today, the folder name shows on screen",ev("S.settings.lastAutoBk")===ev("dayKey()")&&ev("S.settings.lastBackup")===ev("dayKey()")&&q("#view").textContent.includes("Klasör: NeoWell")&&q('[data-ab="toggle"]').checked);
    bfLog.length=0;await ev("abRun()");
    ok("automatic backup: not rewritten before 7 days pass",!bfLog.includes("write"));
    bfFail=true;ev("S.settings.lastAutoBk='2026-01-01'");await ev("abRun()");
    ok("automatic backup: a write error is not silent (notification, Today row, suggestion to turn off in Data and backup)",toastT().includes("Otomatik yedek alınamadı")&&ev("viewToday()").includes("Otomatik yedek alınamadı")&&!!q('[data-ab="off"]')&&!!q('[data-ab="setup"]')&&ev("S.settings.lastAutoBk")==="2026-01-01");
    bfLog.length=0;await ev("abRun()");
    ok("automatic backup: after an error it is not retried in the same session",!bfLog.includes("write"));
    { // restoring does not change this phone's automatic backup setting
      const r=ev("JSON.parse(JSON.stringify(S))");r.settings.autoBk=false;r.settings.lastAutoBk="2025-01-01";
      ev("sheetBackup()");q("#bk").value=JSON.stringify(r);q("#bkpw").value="";ev("S.settings.healthNote='x'");
      await ev("goRestore()");
      ok("a passwordless (plain) backup is not restored, the toast says so",ev("S.settings.healthNote")==="x"&&ev("document.querySelector('#toast').textContent").includes("Yalnız parolalı"),ev("document.querySelector('#toast').textContent"));
      q("#bk").value=JSON.stringify(r);await loadBackup();
      ok("automatic backup: restoring keeps the local setting",ev("S.settings.autoBk")===true&&ev("S.settings.lastAutoBk")==="2026-01-01");
    }
    click('[data-ab="off"]');await flush();
    ok("automatic backup: turning off keeps the folder permission",ev("S.settings.autoBk")===false&&bfLog.includes("clear")&&!q('[data-ab="off"]'));
    ev("S.settings.autoBk=true");ev("sheetDrive()");await flush();click('[data-bk="forget"]');await flush();
    ok("automatic backup: forgetting the password also turns automatic backup off",ev("S.settings.autoBk")===false);
    bfFail=false;ev("abErr='';closeSheet()");delete w.Capacitor.Plugins.BackupFolder;
    ev("closeSheet();vaultOn=false");delete w.Capacitor.Plugins.KeyVault;
    ev("S.settings.healthNote='';S.settings.lastBackup='';tab='today';render()");
  }
  {
    const unclock=require('./clock').at(w,21); // on Today the dose row shows once its time comes: let both doses (08:00, 20:00) have come
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)];
    const click=s=>q(s).click(),toastT=()=>q("#toast").textContent,txt=()=>q("#sheet").textContent;
    ev("S.meds=[];S.medLog=[];S.settings.medOn=false;S.settings.medShowName=true;S.entries=[];S.vitals=[];tab='today';render()");
    ok("when the feature is off there is no medication card on Today",!ev("viewToday()").includes("💊"));
    ev("tab='settings-modules';render()");
    ok("in Settings the turn-on medication reminder button and the warning text",!!q('[data-md="toggle"]')&&q("#view").textContent.includes("doz önermez")&&!q('[data-md="shown"]'));
    click('[data-md="toggle"]');
    ok("once on, the medication name option and an edit link appear",ev("S.settings.medOn")===true&&!!q('[data-md="shown"]')&&q('[data-md="shown"]').checked&&!!q('#view [data-tab="meds"]'));
    ev("tab='today';render()");
    ok("with no medications the card suggests 'ilaç ekle'",q("#view").textContent.includes("Henüz ilaç eklemedin")&&!!q('[data-md="new"]'));

    // adding and validation
    click('[data-md="new"]');
    ok("medication screen: name, dose, time, days, stock",!!q("#mn")&&!!q("#md")&&!!q("#mt0")&&qa("[data-md^='wd:']").length===7&&!!q("#mk")&&!q('[data-md="del"]'));
    click('[data-md="save"]');
    ok("a medication without a name is not saved",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("adını"));
    q("#mn").value="Test İlaç";q("#md").value="1 tablet";
    click('[data-md="addtime"]');
    ok("adding a time keeps what was typed",q("#mn").value==="Test İlaç"&&!!q("#mt1"));
    q("#mt0").value="08:00";q("#mt1").value="08:00";click('[data-md="save"]');
    ok("a duplicate time is rejected",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("Saatleri"));
    q("#mt1").value="20:00";q("#mk").value="abc";click('[data-md="save"]');
    ok("a non-numeric stock is rejected",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("sayı"));
    q("#mk").value="10";q("#mp").value="1";q("#mc").value="0";click('[data-md="save"]');
    ok("a day count of 0 is rejected",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("Gün sayısı"));
    q("#mc").value="";
    for(const w_ of [0,1,2,3,4,5,6])click(`[data-md="wd:${w_}"]`);
    click('[data-md="save"]');
    ok("it is rejected if no day is selected",ev("S.meds.length")===0&&q("#mwarn").textContent.includes("bir gün"));
    for(const w_ of [0,1,2,3,4,5,6])click(`[data-md="wd:${w_}"]`);
    click('[data-md="save"]');
    ok("the medication is saved: name, dose, times, stock, every day",ev("S.meds.length")===1&&ev("S.meds[0].n")==="Test İlaç"&&ev("S.meds[0].d")==="1 tablet"&&ev("S.meds[0].t.join()")==="08:00,20:00"&&ev("S.meds[0].k")===10&&ev("S.meds[0].w")===undefined&&toastT().includes("kaydedildi"),ev("S.meds"));
    ev("delete S.meds[0].ts;tab='today';render()"); // if 08:00 has passed today's 08:00 dose starts from tomorrow; keep the test independent of the clock
    const rows=()=>qa("#view .row").filter(r=>r.textContent.includes("Test İlaç"));
    ok("the Today card shows two doses and their buttons",rows().length===2&&qa('[data-md^="take:1:"]').length===2&&qa('[data-md^="skip:1:"]').length===2);

    // taken / skipped / undo
    click('[data-md="take:1:08:00"]');
    ok("taken: entry, time, stock drops, toast",ev("S.medLog.length")===1&&ev("S.medLog[0].st")==="t"&&/^\d\d:\d\d$/.test(ev("S.medLog[0].at"))&&ev("S.meds[0].k")===9&&toastT().includes("alındı"),ev("S.medLog"));
    ok("a taken dose leaves the Today to-do, the pending one stays",!q('[data-md="take:1:08:00"]')&&!!q('.todo [data-md="take:1:20:00"]'));
    ev("tab='meds';render()");
    ok("the Medications screen shows ✓ and ↩",q("#view").textContent.includes("✓")&&!!q('[data-md="clear:1:08:00"]'));
    ev("tab='today';render()");click("#tundo");
    ok("undo restores the entry and the stock",ev("S.medLog.length")===0&&ev("S.meds[0].k")===10&&!!q('[data-md="take:1:08:00"]'));
    click('[data-md="skip:1:20:00"]');ev("tab='meds';render()");
    ok("skipped: entry, stock unchanged",ev("S.medLog[0].st")==="s"&&ev("S.meds[0].k")===10&&q("#view").textContent.includes("Atlandı"));
    click('[data-md="clear:1:20:00"]');
    ok("the mark is undone (↩)",ev("S.medLog.length")===0);
    ev("tab='today';render()");click('[data-md="take:1:08:00"]');

    // medications screen
    ev("tab='meds';render()");
    ok("medications screen: title, today's doses, medication list, warning text",q("#ttl").textContent==="İlaçlar"&&q("#view").textContent.includes("Test İlaç")&&q("#view").textContent.includes("08:00, 20:00 · her gün")&&q("#view").textContent.includes("doz önermez")&&q('nav [data-tab="more"]').getAttribute("aria-current")==="page"&&!q('nav [data-tab="today"]').getAttribute("aria-current"));
    ev("S.settings.medOn=false;render()");
    ok("with medications off the bottom menu has the same 5 tabs, no medication in the Coach context",qa("nav button").map(b=>b.dataset.tab).join()==="today,gym,trend,coach,more"&&!ev("CoachLib.contextText(cData())").includes("İLAÇLAR"));
    ev("S.settings.medOn=true;render()");
    ok("medication alarm: the Skip button writes the dose as skipped, it does not overwrite taken",ev("(()=>{const sv=JSON.stringify([S.meds,S.medLog]),m=S.meds[0],s=m.t[1],t=Date.now();const r1=medIngest([{m:m.id,s,t,k:true}]).n;const r2=medIngest([{m:m.id,s,t,k:false}]).n;return r1===1&&r2===0&&MedLib.statusOf(S.medLog,m.id,MedLib.dayForTap(s,t),s)==='s'&&(([a,b])=>{S.meds=a;S.medLog=b;return true})(JSON.parse(sv))})()"));
    ok("medMark: a failed save undoes the mark and tells the user",ev("(()=>{const sv=save,m=S.meds[0],s=m.t[0],b=JSON.stringify(S.medLog);save=()=>false;try{medMark(m.id,s,'s')}finally{save=sv}return JSON.stringify(S.medLog)===b})()")&&toastT().includes("Kaydedilemedi"),toastT());
    ev("S.meds[0].s=keyOff(-3);delete S.meds[0].ts"); // as if the medication was added 3 days ago
    ev("S.medLog.push({id:99,m:1,day:keyOff(-1),slot:'08:00',st:'t'},{id:100,m:1,day:keyOff(-1),slot:'20:00',st:'s'})");ev("render()");
    ok("adherence boxes: 7-day percentage and dose count, daily breakdown",q("#view").textContent.includes("Uyum")&&/%\d+/.test(q("#view").textContent)&&q("#view").textContent.includes("dozdan")&&qa(".dd7 .dd").length===7&&!q("#view").textContent.includes("kaçırılan"),q("#view").textContent.slice(0,400));
    ev("S.medLog=S.medLog.filter(x=>x.id!==99&&x.id!==100)");
    ev("S.meds[0].k=3");ev("render()");
    ok("a warning when stock runs low",q("#view").textContent.includes("Yaklaşık 3 doz kaldı"));
    ok("no diagnosis/advice language",!/etkileşim kontrol|dozu artır|doktora danış|yan etki/i.test(q("#view").textContent.replace("etkileşimlerini denetlemez","")));

    // edit, switch off, delete
    click('[data-md="edit:1"]');
    ok("edit: fields filled, a delete button exists",q("#mn").value==="Test İlaç"&&q("#mt0").value==="08:00"&&q("#mt1").value==="20:00"&&!!q('[data-md="del"]')&&q("#mon").checked);
    q("#mn").value="Yeni Ad";q("#mon").checked=false;click('[data-md="save"]');
    ok("the edit is saved; an off medication does not appear in the day's doses",ev("S.meds[0].n")==="Yeni Ad"&&ev("S.meds[0].on")===false&&ev("S.meds.length")===1&&ev("MedLib.dosesOn(S.meds,dayKey()).length")===0);
    click('[data-md="edit:1"]');q("#mon").checked=true;click('[data-md="save"]');
    ok("it turns on again",ev("S.meds[0].on")===true);
    click('[data-md="edit:1"]');click('[data-md="del"]');
    ok("on delete the medication and its log go, undo brings them back",ev("S.meds.length")===0&&ev("S.medLog.length")===0);
    ev("S.meds.push({id:2,n:'Diğer',t:['09:00'],on:true,k:10});MedLib.mark(S,2,dayKey(),'09:00','t','09:00')");
    click("#tundo");
    ok("undo brings back the medication and its log; another medication's dose log and stock in between are not broken",ev("S.meds.length")===2&&ev("S.medLog.length")===2&&ev("S.meds.find(m=>m.id===2).k")===9&&ev("S.medLog.some(x=>x.m===2&&x.st==='t')"));
    ev("S.meds=S.meds.filter(m=>m.id===1);S.medLog=S.medLog.filter(x=>x.m===1)");

    // course
    click('[data-md="new"]');q("#mn").value="Kür";q("#mc").value="3";click('[data-md="save"]');
    ok("course: start today, end on day 3",ev("S.meds.find(m=>m.n==='Kür').s")===ev("dayKey()")&&ev("S.meds.find(m=>m.n==='Kür').e")===ev("MedLib.addDay(dayKey(),2)")&&ev("MedLib.dosesOn(S.meds,MedLib.addDay(dayKey(),3)).filter(x=>x.m.n==='Kür').length")===0);
    ev("S.meds=S.meds.filter(m=>m.n!=='Kür')");

    // notification setup
    const lnOld=w.Capacitor.Plugins.LocalNotifications;let types=null,list=[];
    w.Capacitor.Plugins.LocalNotifications={checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async o=>{types=o.types},schedule:async o=>{list=o.notifications}};
    ev("S.medLog=[]");
    await ev("scheduleReminders()");
    const medN=()=>list.filter(n=>n.id>=1e6);
    ok("medication notifications are scheduled: large id, 'Aldım' action, extra data, name visible",medN().length>=40&&medN().every(n=>n.actionTypeId==="med"&&n.extra.act==="med"&&n.extra.m===1&&n.extra.at===new Date(n.schedule.at).getTime())&&medN()[0].body.includes("Yeni Ad"),medN()[0]);
    ok("action types: water and medication ('✔ Aldım')",types.some(t=>t.id==="med"&&t.actions[0].id==="med"&&t.actions[0].title==="✔ Aldım")&&types.some(t=>t.id==="water"));
    ok("normal reminders do not clash with medication ids, ids are unique",new Set(list.map(n=>n.id)).size===list.length);
    ev("S.settings.medShowName=false");await ev("scheduleReminders()");
    ok("when the name is hidden the notification has no medication name",medN().length>0&&medN().every(n=>!JSON.stringify(n).includes("Yeni Ad")&&n.body==="İlaç saatin geldi."));
    ev("S.settings.medShowName=true;S.settings.medOn=false");await ev("scheduleReminders()");
    ok("when the feature is off no medication notification is scheduled",medN().length===0);
    ev("S.settings.medOn=true");
    ev("S.medLog=[{id:1,m:1,day:dayKey(),slot:'20:00',st:'t'}]");await ev("scheduleReminders()");
    ok("no notification is scheduled for a dose taken today",!medN().some(n=>n.extra.s==="20:00"&&n.id===1000000+1*1000+1*40+0));
    ev("S.meds=Array.from({length:20},(_,i)=>({id:i+1,n:'M'+i,t:['06:00','10:00','14:00','18:00','22:00','23:00'],on:true}));S.medLog=[]");
    await ev("scheduleReminders()");
    ok("with many medications the total alarms are capped at 440 (Android's 500 limit)",list.length===440,list.length);
    ok("when capping, the nearest dates are kept (remaining alarms belong to at most 5 consecutive days)",(g=>Math.max(...g)-Math.min(...g)<=4)(list.filter(n=>n.id>=1e6).map(n=>n.id%40)),list.filter(n=>n.id>=1e6).map(n=>n.id%40).join());
    w.Capacitor.Plugins.LocalNotifications=lnOld;
    ev("S.meds=[{id:1,n:'Test İlaç',d:'1 tablet',t:['08:00','20:00'],on:true,k:10}];S.medLog=[]");

    // Aldım from the notification
    let pend=[];const sch=[];
    w.Capacitor.Plugins.QuickLog={take:async()=>{const r={items:pend};pend=[];return r}};
    w.Capacitor.Plugins.LocalNotifications={checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async o=>{sch.push(...o.notifications)}};
    const tapT=Date.now()-60000;
    pend=[{m:1,s:"08:00",t:tapT}];
    await ev("quickIngest()");await flush();
    ok("'Aldım' from the notification: the dose is recorded as taken for today, stock drops, the notification is rescheduled",ev("S.medLog.length")===1&&ev("S.medLog[0].st")==="t"&&ev("S.medLog[0].day")===ev("MedLib.dayForTap('08:00',"+tapT+")")&&ev("S.meds[0].k")===9&&toastT().includes("Test İlaç")&&sch.length>0,[ev("S.medLog"),toastT()]);
    pend=[{m:1,s:"08:00",t:Date.now()-1000}];
    await ev("quickIngest()");
    ok("if the same dose comes from the notification a second time it is not counted again, stock does not drop",ev("S.medLog.length")===1&&ev("S.meds[0].k")===9);
    pend=[{m:77,s:"08:00",t:Date.now()-1000},{m:1,s:"09:30",t:Date.now()-1000},{m:1,s:"bozuk",t:Date.now()-1000},{m:1.5,s:"08:00",t:Date.now()-1000}];
    await ev("quickIngest()");
    ok("an unknown medication, a time not in the schedule and malformed data are dropped",ev("S.medLog.length")===1);
    const t0=new Date();t0.setHours(0,0,0,0);
    ev("S.medLog=[];S.meds[0].t=['23:30'];S.meds[0].k=10");
    pend=[{m:1,s:"23:30",t:t0.getTime()}];await ev("quickIngest()");
    ok("a 23:30 dose pressed after midnight is written to the previous day",ev("S.medLog.length")===1&&ev("S.medLog[0].day")===ev("MedLib.addDay(dayKey(new Date("+t0.getTime()+")),-1)"),ev("S.medLog"));
    ev("S.meds[0].t=['08:00','20:00'];S.medLog=[];S.meds[0].k=10");
    w.Capacitor.Plugins.LocalNotifications=lnOld;delete w.Capacitor.Plugins.QuickLog;

    // backup and cleanup
    ev("S.medLog=[{id:1,m:1,day:dayKey(),slot:'08:00',st:'t',at:'08:03'}]");
    const bkJ=ev("JSON.stringify(S)");
    ev("S.meds=[];S.medLog=[]");doc.querySelector("#bk").value=bkJ;await loadBackup();
    ok("restoring from a backup brings the medications and logs",ev("S.meds.length")===1&&ev("S.meds[0].n")==="Test İlaç"&&ev("S.medLog.length")===1&&ev("S.medLog[0].at")==="08:03");
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(bkJ),meds:[{id:1,n:"İyi",t:["08:00"]},{id:2,n:"",t:["09:00"]},{id:3,n:"Saatsiz",t:[]},"çöp",null],medLog:[{m:1,day:"2026-09-10",slot:"08:00",st:"t"},{m:2,day:"2026-09-10",slot:"09:00",st:"t"},{m:1,day:"bozuk",slot:"08:00",st:"t"}]});
    await loadBackup();
    ok("broken medications and logs are filtered on load (also the log of a deleted medication)",ev("S.meds.length")===1&&ev("S.medLog.length")===1&&ev("S.medLog[0].m")===1,[ev("S.meds"),ev("S.medLog")]);
    ok("a reset starts an empty medication list",ev("DEF.meds.length")===0&&ev("DEF.medLog.length")===0&&ev("DEF.settings.medOn")===false);
    ev("S.meds=[];S.medLog=[];S.settings.medOn=false;tab='today';render()");
    unclock();
  }
  {
    // motion detection (walking/running automatic)
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click();
    const so=ev("S.settings.stepsOn"),mcalls=[];let mperm={activity:true,fine:false,on:false},mitems=[],mgrant=true;
    w.Capacitor.Plugins.Motion={status:async()=>mperm,requestAccess:async()=>{mcalls.push("req");return mperm},requestPermissions:async(o)=>{mcalls.push("perm:"+o.permissions.join());if(mgrant)mperm={...mperm,fine:true};return {...mperm,fine:mgrant?"granted":"denied"}},walkGps:async(o)=>{mcalls.push("gps:"+(o.on?"on":"off"));return {gps:o.on&&mperm.fine}},configure:async(o)=>{mcalls.push("cfg:"+o.cm)},start:async()=>{mcalls.push("start");return mperm},stop:async()=>{mcalls.push("stop");return mperm},take:async()=>{const r={items:mitems};mitems=[];return r}};
    ev("S.settings.stepsOn=true;S.settings.heightCm=170;S.settings.motionOn=false;S.moves=[];tab='settings-modules';render()");
    ok("motion: a block in settings, the turn-on button and the privacy text",q("#view").textContent.includes("Hareket algılama")&&q('[data-mo="toggle"]').checked===false&&q("#view").textContent.includes("kaydedilmez"));
    ok("motion: the setting text does not promise background location, it ties location to manual walks",q("#view").textContent.includes("Konum yalnız elle başlattığın yürüyüşlerde")&&q("#view").textContent.includes("Arka planda konum kullanılmaz")&&!/Her zaman/.test(q("#view").textContent));
    click('[data-mo="toggle"]');await flush();
    ok("motion: turning on asks only for physical activity (location is not asked, no explanation page), height is sent, detection starts",ev("S.settings.motionOn")===true&&mcalls.includes("req")&&!mcalls.some(c=>c.startsWith("perm:"))&&!q("#sheet").classList.contains("on")&&mcalls.includes("cfg:170")&&mcalls.includes("start"),mcalls);
    { // Location in a manual walk: permission only when a walk starts, with a "why" page
      const toastT=()=>q("#toast").textContent;
      ev("localStorage.removeItem('nw_walkgps_no');S.walk=null;tab='steps';render()");mcalls.length=0;
      await ev("walkStart()");await flush();
      const ws=q("#sheet").textContent;
      ok("walk location: without permission, starting shows the why page (only the walk you start, notification, no background), the walk continues, GPS does not open",q("#sheet").classList.contains("on")&&ws.includes("yalnız senin başlattığın yürüyüşte")&&ws.includes("bildirim")&&ws.includes("Arka planda konum istenmez")&&ev("S.walk&&!S.walk.t1")===true&&!mcalls.includes("gps:on"),ws);
      click('[data-mo="nogps"]');
      ok("walk location: Konumsuz devam asks no permission, a gentle note, never asked again",!mcalls.some(c=>c.startsWith("perm:"))&&toastT().includes("boyuna göre")&&ev("localStorage.getItem('nw_walkgps_no')")==="1"&&(ev("closeSheet()"),true));
      await ev("walkGpsOn()");await flush();
      ok("walk location: if refused, the page does not show on restart",!q("#sheet").classList.contains("on")&&!mcalls.includes("gps:on"));
      ev("tab='settings-modules';render()");
      ok("walk location: in Settings the no-permission state and a re-request button",q("#view").textContent.includes("mesafe boyuna göre")&&q('[data-mo="perm"]').textContent.includes("Yürüyüşte konumu kullan"));
      mgrant=false;click('[data-mo="perm"]');click('[data-mo="gps"]');await flush();
      ok("walk location: if the system permission is refused a note shows, GPS does not open",mcalls.includes("perm:fine")&&toastT().includes("verilmedi")&&!mcalls.includes("gps:on")&&ev("localStorage.getItem('nw_walkgps_no')")==="1",mcalls);
      mgrant=true;click('[data-mo="perm"]');click('[data-mo="gps"]');await flush();
      ok("walk location: when permission is granted GPS opens in the running walk, the refusal flag is cleared, Settings updates",mcalls.includes("gps:on")&&ev("localStorage.getItem('nw_walkgps_no')")===null&&q("#view").textContent.includes("Konum izni var")&&!q('[data-mo="perm"]'),mcalls);
      ev("tab='steps';render()");mcalls.length=0;await ev("walkStop()");
      ok("walk location: Bitir closes the GPS window",mcalls.includes("gps:off"),mcalls);
      ev("closeSheet();S.walk=null");mcalls.length=0;await ev("walkStart()");await flush();
      ok("walk location: with permission, starting opens GPS without a page",mcalls.includes("gps:on")&&!q("#sheet").classList.contains("on"),mcalls);
      ev("S.settings.motionOn=false;S.walk=null");mcalls.length=0;await ev("walkStart()");await flush();
      ok("walk location: with motion detection off GPS does not open and permission is not asked",!mcalls.includes("gps:on")&&!q("#sheet").classList.contains("on"),mcalls);
      ev("S.walk=null;S.settings.motionOn=true;localStorage.removeItem('nw_walkgps_no')");mperm={...mperm,fine:false};
    }
    const mt0=Date.now()-30*60000;
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true},{t0:mt0,t1:mt0+3*60000,k:"w",steps:50,km:0.1,kmh:2,kcal:5,gps:false}];
    await ev("motionIngest()");
    ev("tab='steps';render()");
    ok("motion: a valid interval is saved and listed on the Steps screen, an invalid one is dropped",ev("S.moves.length")===1&&q("#view").textContent.includes("Yürüyüş")&&q("#view").textContent.includes("22 dk")&&q("#view").textContent.includes("2,1 km")&&q("#view").textContent.includes("110 kcal"),ev("S.moves"));
    await ev("motionIngest()");
    ok("motion: the same interval is not added again",ev("S.moves.length")===1);
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionIngest()");
    ok("motion: the same day-time-type record is not added a second time",ev("S.moves.length")===1);
    const mbk=ev("JSON.stringify(S)");
    ev("S.moves=[]");doc.querySelector("#bk").value=mbk;await loadBackup();
    ok("motion: restoring from a backup brings the intervals",ev("S.moves.length")===1&&ev("S.moves[0].min")===22);
    doc.querySelector("#bk").value=JSON.stringify({...JSON.parse(mbk),moves:[{day:"bozuk",t0:"07:00",min:5,k:"w",steps:500,km:1,kmh:3},{day:"2026-09-01",t0:"07:00",min:5,k:"w",steps:500,km:1,kmh:3},"x"]});
    await loadBackup();
    ok("motion: broken intervals are filtered on load",ev("S.moves.length")===1&&ev("S.moves[0].day")==="2026-09-01");
    ev("S.moves=[]");mcalls.length=0;
    await ev("motionBoot()");
    ok("motion: detection is re-registered at app launch",mcalls.includes("start")&&mcalls.some(c=>c.startsWith("cfg:")),mcalls);
    ev("tab='settings-modules';render()");click('[data-mo="toggle"]');await flush();
    ok("motion: it is stopped when turned off",ev("S.settings.motionOn")===false&&mcalls.includes("stop"),mcalls);
    mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionIngest()");
    ok("motion: no records are taken while off",ev("S.moves.length")===0);
    mperm={activity:false,fine:false,on:false};ev("S.settings.motionOn=true");mcalls.length=0;
    await ev("motionBoot()");
    ok("motion: if permission was revoked (or came from a backup) the setting turns off, it is not started",ev("S.settings.motionOn")===false&&!mcalls.includes("start"),mcalls);
    mperm={activity:true,fine:true,on:true};ev("S.settings.motionOn=true");
    const st0=w.Capacitor.Plugins.Motion.start;w.Capacitor.Plugins.Motion.start=async()=>{throw new Error("gms yok")};
    await ev("motionBoot()");
    ok("motion: without Google Play services (if start fails) the setting turns off",ev("S.settings.motionOn")===false);
    w.Capacitor.Plugins.Motion.start=st0;
    ev("S.settings.motionOn=true;S.settings.stepsOn=true");mcalls.length=0;mitems=[{t0:mt0,t1:mt0+22*60000,k:"w",steps:2400,km:2.1,kmh:5.7,kcal:110,gps:true}];
    await ev("motionStopAll()");
    ok("motion: when the step counter turns off, motion detection stops and the pending record is taken",ev("S.settings.motionOn")===false&&mcalls.includes("stop")&&ev("S.moves.length")===1,mcalls);
    ev("S.moves=[]");
    delete w.Capacitor.Plugins.Motion;ev("tab='settings-modules';render()");
    ok("motion: without the plugin (browser) the block is hidden",!q("#view").textContent.includes("Hareket algılama"));
    ev("S.settings.stepsOn="+so+";S.settings.motionOn=false;S.moves=[];tab='today';render()");
  }
  {
    // exercise library, timed sets and timer
    const doc=w.document,q=s=>doc.querySelector(s),qa=s=>[...doc.querySelectorAll(s)],click=s=>q(s).click(),toastT=()=>q("#toast").textContent;
    const fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
    const lnOld2=w.Capacitor.Plugins.LocalNotifications,lnLog=[];
    w.Capacitor.Plugins.LocalNotifications={checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),getPending:async()=>({notifications:[{id:9001},{id:9002},{id:5}]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async o=>{lnLog.push(["c",o.notifications.map(n=>n.id)])},schedule:async o=>{lnLog.push(["s",o.notifications.map(n=>n.id),o.notifications[0].title])}};
    ev("S.workouts=[];S.templates=[];S.customEx=[];S.gid=1;tab='gym';render()");
    ok("library: at least 300 exercises, core ids keep their names, figure attached",ev("EXDB.length")>=300&&ev("gEx('squat').n")==="Squat"&&ev("gEx('squat').tp")==="squat"&&ev("gEx('ohp').n")==="Omuz press"&&ev("gEx('curl').inc")===2);
    ok("the Gym home shows the library button",!!q('[data-g="lib"]'));
    click('[data-g="lib"]');
    ok("the library screen opens: title, 40 rows, small figures, a show-more button",ev("tab")==="exlib"&&q("#ttl").textContent==="Egzersiz kütüphanesi"&&qa("#gllist .exrow").length===40&&!!q(".exthumb svg")&&!!q('[data-g="lmore"]'),qa("#gllist .exrow").length);
    click('[data-g="lfilter"]');
    click('[data-g="lreg:Biseps"]');
    const nb=ev("EXDB.filter(e=>e.r==='Biseps').length");
    ok("region filter: only that region",qa("#gllist .exrow").length===nb&&nb>=15&&!q("#gllist").textContent.includes("Bench press"),qa("#gllist .exrow").length);
    click('[data-g="lreg:Tümü"]');click('[data-g="leq:Ağırlıksız"]');click('[data-g="lcat:Esneme"]');
    ok("type and equipment filters work together",qa("#gllist .exrow").length===ev("EXDB.filter(e=>e.q==='Ağırlıksız'&&e.c==='e').length")&&qa("#gllist .exrow").length>=5);
    click('[data-g="leq:Tümü"]');click('[data-g="lcat:Tümü"]');
    q("#glq").value="plank";q("#glq").dispatchEvent(new w.Event("input",{bubbles:true}));
    ok("search: plank is found",q("#gllist").textContent.includes("Plank")&&qa("#gllist .exrow").length<10);
    click('[data-g="exinfo:plank"]');
    ok("detail: animated figure, form tip, photo, log type",q("#sheet .exfig svg animate")&&q("#sheet").textContent.includes("Vücut baştan topuğa")&&q('#sheet img[src="ex/plank/0.webp"]')&&q("#sheet").textContent.includes("Süreli tutuş"));
    click('[data-g="exadd:plank"]');
    ok("add to workout: the workout starts, plank 3 sets x 30 s",ev("S.workouts.length")===1&&ev("S.workouts[0].ex[0].id")==="plank"&&ev("S.workouts[0].ex[0].sets.length")===3&&ev("S.workouts[0].ex[0].sets[0].sec")===30&&ev("tab")==="gym"&&!!q('[data-gi="sec:0:0"]')&&!!q('[data-g="tstart:0:0"]'));
    click('[data-g="tstart:0:0"]');await flush();
    ok("the timer starts: the bar shows, notification 9001 is scheduled",ev("!!gTim&&gTim.phase==='work'&&gTim.total===30")&&!q("#gtim").hidden&&lnLog.some(l=>l[0]==="s"&&l[1].includes(9001)),lnLog);
    ev("render()");
    ok("the timer bar is kept on redraw",!q("#gtim").hidden&&q("#gtv").textContent.length>=4);
    ev("gTim.end=Date.now()-1;exTick()");
    ok("when time is up the set completes, rest starts, the timer closes",ev("S.workouts[0].ex[0].sets[0].done")===true&&ev("gTim")===null&&ev("restEnd")>Date.now()&&toastT().includes("1. set tamamlandı"),toastT());
    click('[data-g="tstart:0:1"]');click('[data-g="tstart:0:1"]');
    ok("pressing a running timer again stops it (the set is not completed)",ev("gTim")===null&&ev("S.workouts[0].ex[0].sets[1].done")===false);
    click('[data-g="done:0:1"]');
    ok("a timed set can be completed by hand",ev("S.workouts[0].ex[0].sets[1].done")===true);
    fire('[data-gi="sec:0:2"]',"0");
    ok("an invalid duration is rejected",ev("S.workouts[0].ex[0].sets[2].sec")===30&&toastT().includes("Süre"),toastT());
    // interval rounds
    ev("gAddEx(gActive(),'climber');save();render()");
    ok("interval: 4 rounds x 30 s",ev("S.workouts[0].ex[1].sets.length")===4&&ev("S.workouts[0].ex[1].sets[0].sec")===30);
    click('[data-g="tstart:1:0"]');ev("gTim.end=Date.now()-1;exTick()");
    ok("interval: when a round ends an automatic 20 s rest, then the next round",ev("S.workouts[0].ex[1].sets[0].done")&&ev("gTim.phase")==="rest"&&ev("gTim.si")===1&&ev("gTim.total")===20);
    ev("gTim.end=Date.now()-1;exTick()");
    ok("interval: when rest ends the 2nd round starts automatically",ev("gTim.phase")==="work"&&ev("gTim.si")===1&&ev("gTim.total")===30);
    click('[data-g="tstop"]');
    ok("Bitir: the round completes, moves to rest",ev("S.workouts[0].ex[1].sets[1].done")===true&&ev("gTim&&gTim.phase")==="rest");
    click('[data-g="tadd:10"]');await flush();
    ok("extending a rest keeps the round-start notification title",lnLog.filter(l=>l[0]==="s").pop()[2]==="Sıradaki tur başlıyor",lnLog.filter(l=>l[0]==="s").pop());
    ev("gTimStop()");
    // cardio (minutes)
    ev("gAddEx(gActive(),'treadjog');save();render()");
    ok("cardio: a single 10-minute set, shown as minutes",ev("S.workouts[0].ex[2].sets.length")===1&&ev("S.workouts[0].ex[2].sets[0].sec")===600&&q('[data-gi="sec:2:0"]').value==="10");
    fire('[data-gi="sec:2:0"]',"25");
    ok("cardio: minutes are converted to seconds and stored",ev("S.workouts[0].ex[2].sets[0].sec")===1500);
    fire('[data-gi="sec:2:0"]',"121");
    ok("cardio: longer than 120 minutes is rejected",ev("S.workouts[0].ex[2].sets[0].sec")===1500);
    // body weight
    ev("gAddEx(gActive(),'pushup');save();render()");
    ok("body weight: an 'ek kg' field",q('[data-gi="kg:3:0"]').placeholder==="ek kg");
    fire('[data-gi="reps:3:0"]',"12");
    click('[data-g="done:3:0"]');
    ok("body weight: completes by reps only",ev("S.workouts[0].ex[3].sets[0].done")===true&&ev("S.workouts[0].ex[3].sets[0].reps")===12&&ev("S.workouts[0].ex[3].sets[0].kg")===0);
    // persistence and old data
    const R=JSON.parse(ev("JSON.stringify(cleanGym(JSON.parse(JSON.stringify(S))))"));
    ok("save round trip: the duration field is kept",R.workouts[0].ex[0].sets[0].sec===30&&R.workouts[0].ex[2].sets[0].sec===1500&&R.workouts[0].ex.length===4);
    const old={workouts:[{id:5,day:"2026-09-01",t0:1,t1:2,name:"Eski",tpl:null,ex:[{id:"squat",note:"",sets:[{kg:100,reps:5,done:true}]},{id:"bench",note:"n",sets:[{kg:60,reps:8,done:true}]},{id:"silinmis_x",note:"",sets:[{kg:1,reps:1,done:true}]}]}],templates:[{id:6,name:"T",ex:["squat","row","bilinmeyen"]}],customEx:[{id:"c7",n:"Benim",g:"Kol"},{id:"c8",n:"Kötü",g:"Yok"}],gid:9};
    const O=JSON.parse(ev("JSON.stringify(cleanGym("+JSON.stringify(old)+"))"));
    ok("old records are not lost: an id missing from the library is not dropped (Silinmiş egzersiz), a malformed id is dropped; template, old grouped custom exercise",O.workouts.length===1&&O.workouts[0].ex.length===3&&O.workouts[0].ex[2].id==="silinmis_x"&&ev("gEx('silinmis_x').n")==="Silinmiş egzersiz"&&ev("cleanGym({workouts:[{id:1,day:'2026-09-01',t0:1,ex:[{id:'x y',sets:[]},{id:'a'.repeat(100),sets:[]}]}]}).workouts[0].ex.length")===0&&O.workouts[0].ex[0].sets[0].kg===100&&O.workouts[0].ex[0].sets[0].sec===undefined&&O.templates[0].ex.join()==="squat,row"&&O.customEx.length===1&&O.customEx[0].g==="Kol",O);
    ok("all library ids are valid in records",ev("EXDB.every(e=>cleanGym({workouts:[{id:1,day:'2026-09-01',t0:1,ex:[{id:e.id,sets:[{kg:1,reps:1,done:true}]}]}]}).workouts[0].ex.length===1)"));
    ev("S.workouts[0].t1=Date.now();render()");
    ok("weekly set count includes timed sets too (Karın)",ev("gWeekRegions()['Karın']")>=2,ev("gWeekRegions()"));
    click('[data-g="sum:1"]');
    ok("the workout summary is not broken by timed sets",q("#sheet").textContent.length>20&&!/NaN|undefined/.test(q("#sheet").textContent),q("#sheet").textContent.slice(0,200));
    ev("closeSheet();render()");
    ev("gSheetHist('plank')");
    ok("timed exercise history: seconds are listed",q("#sheet").textContent.includes("30 sn")&&!q("#sheet").textContent.includes("1TM"),q("#sheet").textContent.slice(0,120));
    ev("closeSheet();S.workouts[0].t1=null;tab='gym';render()");
    // rescheduling reminders does not delete the timer notification
    await ev("gLnQ");lnLog.length=0;ev("S.settings.reminders.forEach(r=>r.on=true)");await ev("scheduleReminders()");
    ok("when reminders are rescheduled the timer notification (9001) is not cancelled",lnLog.some(l=>l[0]==="c"&&l[1].includes(5))&&!lnLog.some(l=>l[0]==="c"&&l[1].includes(9001)),lnLog.filter(l=>l[0]==="c"));
    ok("when reminders are rescheduled the rest notification (9002) is not cancelled",!lnLog.some(l=>l[0]==="c"&&l[1].includes(9002)));
    ok("reminder ids do not clash with 9001/9002",ev("Math.max(...S.settings.reminders.map(r=>r.id))*100+SCHED_DAYS-1")<9001&&!lnLog.some(l=>l[0]==="s"&&(l[1].includes(9001)||l[1].includes(9002))));
    // rest notification 9002 (separate from the timed-set notification 9001)
    const lnAt=[];w.Capacitor.Plugins.LocalNotifications.schedule=async o=>{lnLog.push(["s",o.notifications.map(n=>n.id)]);lnAt.push(...o.notifications)};
    const has=(k,id)=>lnLog.some(l=>l[0]===k&&l[1].includes(id)),reset=async()=>{await ev("gLnQ");lnLog.length=0;lnAt.length=0},drain=()=>ev("gLnQ");
    ev("S.workouts[0].ex[3].sets[1].done=false;render()");await reset();
    fire('[data-gi="reps:3:1"]',"10");click('[data-g="done:3:1"]');await drain();
    const n2=lnAt.find(n=>n.id===9002);
    ok("set ✓: rest notification 9002 is scheduled at the exact end instant, 9001 is untouched",n2&&Math.abs(+n2.schedule.at-ev("restEnd"))<5&&n2.schedule.allowWhileIdle===true&&n2.body.includes("Şınav")&&!has("c",9001)&&!has("s",9001),lnLog);
    await reset();click('[data-g="rest:15"]');await drain();
    ok("+15: the notification is rescheduled to the new end",+lnAt.find(n=>n.id===9002).schedule.at===ev("restEnd"));
    await reset();click('[data-g="rest:0"]');await drain();
    ok("Atla: 9002 is cancelled, 9001 is not cancelled",has("c",9002)&&!has("s",9002)&&!has("c",9001)&&ev("restEnd")===0);
    await reset();ev("gRestSet(Date.now()+10000)");click('[data-g="rest:-15"]');await drain();
    ok("immediately followed by -15 (end in the past): the cancel runs after the schedule, no notification stays scheduled",ev("restEnd")===0&&JSON.stringify(lnLog.map(l=>l[0]).slice(-3))==='["c","s","c"]',lnLog);
    ev("gRestSet(Date.now()+65000);tab='today';render();tab='gym';render()");
    ok("on returning to the tab the rest bar shows with the remaining time without waiting for a tick",!q("#grest").hidden&&/^01:0[45]$/.test(q("#gr").textContent),q("#gr").textContent);
    ev("restEnd=Date.now()-1000;render()");await reset();ev("gTick()");await drain();
    ok("rest that ends in the background: the bar is hidden, the notification is not cancelled (a delivered one must not be deleted)",q("#grest").hidden&&ev("restEnd")===0&&!has("c",9002));
    ev("gRestSet(Date.now()+60000)");await reset();click('[data-g="tstart:0:0"]');await drain();
    ok("when a timed set starts, rest and 9002 are cancelled",ev("restEnd")===0&&has("c",9002)&&has("s",9001));
    await reset();ev("gTimStop()");await drain();
    ok("when the timer stops only 9001 is cancelled",has("c",9001)&&!has("c",9002));
    click('[data-g="tstart:0:0"]');
    click('[data-g="menu:0"]');click('[data-g="rmex:0"]');
    ok("when an exercise is deleted the timer stops",ev("gTim")===null);
    ev("S.workouts=[{id:50,day:dayKey(),t0:Date.now()-3600000,t1:Date.now(),name:'Test',tpl:null,ex:[{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:true},{kg:null,reps:null,sec:30,done:true}]},{id:'pushup',note:'',sets:[{kg:0,reps:12,done:true}]},{id:'treadjog',note:'',sets:[{kg:null,reps:null,sec:1500,done:true}]},{id:'squat',note:'',sets:[{kg:100,reps:5,done:true}]}]}]");
    ev("S.workouts=[];S.customEx=[];tab='today';render()");
    w.Capacitor.Plugins.LocalNotifications=lnOld2;
  }
  {
    // sleep, mood, fasting
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click(),hb=a=>click(`#view [data-hb="${a}"]`);
    ev("S.sleep=[];S.mood=[];tab='today';render()");
    hb("sleep");q("#hbb").value="23:30";q("#hbw").value="07:00";q("#hbq").value="4";click('[data-hb="sleepgo"]');
    ok("sleep: bedtime to wake across midnight is 450 min, quality is saved, shows on Today",JSON.stringify(ev("S.sleep"))===JSON.stringify([{day:ev("dayKey()"),min:450,q:4}])&&q("#toast").textContent.includes("7 sa 30 dk"),ev("S.sleep"));
    hb("sleep");q("#hbh").value="6,5";click('[data-hb="sleepgo"]');
    ok("sleep: re-entry for the same day overwrites (with a duration entry)",ev("S.sleep.length")===1&&ev("S.sleep[0].min")===390);
    hb("sleep");q("#hbb").value="07:00";q("#hbw").value="07:00";click('[data-hb="sleepgo"]');
    ok("sleep: an entry with identical times is rejected, the record is unchanged",ev("S.sleep[0].min")===390&&q("#sheet").classList.contains("on"));
    ev("closeSheet()");
    hb("mood");click('[data-hb="moodgo"]');
    ok("mood: it is not saved without choosing a face, the error is inside the page",ev("S.mood.length")===0&&q("#hberr").textContent.includes("seç")&&q("#sheet").classList.contains("on"));
    q("#hbn").value="yorgun";click('[data-hb="mood:2"]');
    ok("mood: tapping a face does not save, it only selects",ev("S.mood.length")===0&&q('[data-hb="mood:2"]').getAttribute("aria-pressed")==="true");
    click('[data-hb="moodgo"]');hb("mood");
    ok("mood: on reopening the choice and note come filled",q('[data-hb="mood:2"]').getAttribute("aria-pressed")==="true"&&q("#hbn").value==="yorgun");
    q("#hbn").value="";click('[data-hb="mood:4"]');click('[data-hb="moodgo"]');
    ok("mood: one record per day (last wins), the tile shows today's value",ev("S.mood.length")===1&&ev("S.mood[0].v")===4&&!ev("S.mood[0].t")&&q('#view [data-hb="mood"]').textContent.includes("İyi")&&!!q('#view [data-hb="sleep"]'),ev("S.mood"));
    hb("mood");q("#hbn").value="  iyi  ";click('[data-hb="mood:5"]');click('[data-hb="moodgo"]');
    ok("mood: the note is trimmed",ev("S.mood[0].t")==="iyi");
    hb("sleep");q("#hbh").value="8";click('[data-hb="sleepgo"]');
    ok("sleep: re-entry for the same day offers 'Geri al', undoing returns the old record",q("#tmsg").textContent.startsWith("Uyku güncellendi")&&!q("#tundo").hidden&&(click("#tundo"),ev("S.sleep[0].min")===390));
    hb("sleep");click('[data-hb^="sdel:"]');
    ok("sleep is deleted from history and can be undone",ev("S.sleep.length")===0&&(click("#tundo"),ev("S.sleep.length")===1));
    hb("mood");click('[data-hb^="mdel:"]');
    ok("mood is deleted from history and can be undone",ev("S.mood.length")===0&&(click("#tundo"),ev("S.mood[0].v")===5));
    ev("add('water',250)");const bk=ev("JSON.stringify(S)");ev("S.sleep=[];S.mood=[]");q("#bk")||ev("sheetBackup()");q("#bk").value=bk;await loadBackup();
    ok("sleep and mood come back from a backup",ev("S.sleep.length")===1&&ev("S.mood[0].v")===5);
    const old=JSON.parse(bk);delete old.sleep;delete old.mood;delete old.fast;q("#bk").value=JSON.stringify(old);await loadBackup();
    ok("an old backup without the fields loads: existing records stay, new fields empty",ev("S.entries.length")>0&&ev("S.sleep.length")===0&&ev("S.fast.t0")===null&&ev("S.fast.plan")===16);
    q("#bk").value=JSON.stringify({...JSON.parse(bk),sleep:"x",mood:{a:1},fast:7});await loadBackup();
    ok("with a junk sleep/mood/fasting value the other data loads completely",ev("S.entries.length")===JSON.parse(bk).entries.length&&ev("S.sleep.length")===0&&ev("S.fast.log.length")===0);
    ev("S.sleep=[{day:dayKey(),min:450}];S.mood=[]");
    ev("S.mood=[];render()");
    // fasting
    const lnO=w.Capacitor.Plugins.LocalNotifications,sc=[],rmv=[];
    w.Capacitor.Plugins.LocalNotifications={checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[{id:9100}]}),getDeliveredNotifications:async()=>({notifications:[{id:9100}]}),removeDeliveredNotifications:async o=>{rmv.push(...o.notifications.map(n=>n.id))},registerActionTypes:async()=>{},cancel:async()=>{},schedule:async o=>{sc.push(o.notifications)}};
    ev("S.fast={plan:16,t0:null,log:[]};S.settings.fastOn=false;S.settings.age=0;S.settings.healthNote='';tab='today';render()");
    ok("with fasting off there is no fasting row on Today",!q('[data-hb="fastgo"]')&&!q("#view").textContent.includes("Oruç"));
    ev("tab='settings-modules';render()");click('[data-hb="fasttoggle"]');
    ok("first time fasting is turned on, the at-risk groups notice (with a checkbox), it does not turn on yet",ev("S.settings.fastOn")===false&&["Hamilelik","18 yaş altı","yeme bozukluğu","insülin","düşük kilo"].every(x=>q("#sheet").textContent.includes(x))&&!!q("#fic"));
    click('[data-hb="fastinfo"]');ok("it does not turn on until the box is checked",ev("S.settings.fastOn")===false&&ev("S.settings.fastInfoOk")===false);
    q("#fic").checked=true;click('[data-hb="fastinfo"]');
    ok("fasting turns on in Settings: four plans, default 16:8 selected",ev("S.settings.fastOn")===true&&q("#view").textContent.includes("14:10")&&q("#view").textContent.includes("20:4")&&q('[data-hb="plan:16"]').getAttribute("aria-pressed")==="true");
    click('[data-hb="plan:18"]');ev("tab='today';render()");
    ok("a single fasting row in the Today to-do (no plan buttons), no physician note",!!q('.todo [data-hb="fastgo"]')&&q(".todo").textContent.includes("18:6")&&!q('#view [data-hb^="plan:"]')&&!q("#view").textContent.includes("hekimine danış"));
    w.confirm=()=>false;click('[data-hb="fastgo"]');w.confirm=()=>true;
    ok("extra confirmation for 18:6 and 20:4: if refused it does not start",ev("S.fast.t0")===null&&ev("S.settings.fastLongOk")===false);
    const t00=Date.now();click('[data-hb="fastgo"]');await flush();
    ok("the long-plan confirmation is asked once and stored (cleanSettings keeps it)",ev("S.settings.fastLongOk")===true&&ev("cleanSettings({fastLongOk:true,fastInfoOk:true}).fastLongOk")===true&&ev("cleanSettings({}).fastInfoOk")===false);
    const n9=(sc[sc.length-1]||[]).find(n=>n.id===9100);
    ok("when fasting starts 9100 is scheduled at the target time, id under 1,000,000",ev("S.fast.plan")===18&&ev("S.fast.t0")>=t00&&n9&&Math.abs(n9.schedule.at.getTime()-(ev("S.fast.t0")+18*36e5))<1000&&sc[sc.length-1].every(n=>n.id<1e6),n9);
    sc.length=0;await ev("scheduleReminders()");
    ok("while fasting runs, every reschedule rebuilds 9100 from the state; a delivered 9100 stays",sc[0].some(n=>n.id===9100)&&!rmv.includes(9100));
    ev("S.fast.t0=Date.now()-10*36e5;S.fast.plan=16;render()");
    ok("fasting card: elapsed and remaining time to the minute",q("#view").textContent.includes("10 sa 0 dk geçti")&&q("#view").textContent.includes("6 sa 0 dk kaldı")&&!!q('[data-hb="fastend"]')&&!q('[data-hb="plan:14"]'));
    ev("S.fast.t0=Date.now()-17*36e5;render()");
    ok("fasting card: 'Hedef doldu' once the goal is reached",q("#view").textContent.includes("Hedef doldu"));
    sc.length=0;click('[data-hb="fastend"]');await flush();
    ok("when fasting ends it is written to the log, 9100 is not scheduled, recent fasts are listed",ev("S.fast.t0")===null&&ev("S.fast.log.length")===1&&ev("S.fast.log[0].t1-S.fast.log[0].t0")>=16.9*36e5&&sc.length>0&&!sc[0].some(n=>n.id===9100)&&ev("fastSettingsHtml()").includes("Son oruçlar")&&ev("fastSettingsHtml()").includes("17 sa 0 dk")&&!!q('.todo [data-hb="fastgo"]'),ev("S.fast"));
    ok("when fasting ends the on-screen 'Oruç süren doldu' notification (9100) is removed",rmv.includes(9100),rmv);
    ev("S.fast.t0=Date.now()-80*36e5;render()");click('[data-hb="fastend"]');await flush();
    ok("a fast over 72 hours is not deleted: it is written as 72 hours and stated",ev("S.fast.log.length")===2&&ev("S.fast.log[1].t1-S.fast.log[1].t0")===72*36e5&&q("#tmsg").textContent.includes("72 saat"),q("#tmsg").textContent);
    ev("S.fast.t0=Date.now()-30e3;render()");click('[data-hb="fastend"]');await flush();
    ok("a fast under 1 minute is not written to history, the fast closes",ev("S.fast.log.length")===2&&ev("S.fast.t0")===null&&q("#tmsg").textContent.includes("1 dakikadan kısa"));
    ev("tab='settings-modules';render()");click('[data-hb^="fdel:"]');await flush();
    ok("a fast is deleted from the history (Settings), can be undone",ev("S.fast.log.length")===1&&(click("#tundo"),ev("S.fast.log.length")===2));
    ev("S.fast.t0=Date.now()-36e5;render()");click('[data-hb="fasttoggle"]');
    ok("the timer cannot be turned off while fasting runs",ev("S.settings.fastOn")===true&&q("#tmsg").textContent.includes("Önce orucu bitir"));
    ev("S.fast.t0=null;S.settings.reminders.find(r=>r.id===11).on=true;tab='settings-modules';render()");click('[data-hb="fasttoggle"]');
    ok("when fasting turns off the fasting reminder turns off and leaves the Settings list",ev("S.settings.fastOn")===false&&ev("S.settings.reminders.find(r=>r.id===11).on")===false&&!shown().includes(11));
    click('[data-hb="fasttoggle"]');
    ok("when fasting turns on the reminder shows on the Reminders screen",(ev("tab='settings-reminders';render()"),!!q('[data-rt="11"]')));
    ev("S.fast.t0=null;tab='today';render()");
    ok("fasting setting: on only if explicitly true (not derived from old data)",ev("cleanSettings({reminders:[{id:11,t:'20:00',on:true}]}).fastOn")===false&&ev("cleanSettings({}).fastOn")===false&&ev("cleanSettings({fastOn:false}).fastOn")===false&&ev("cleanSettings({fastOn:true}).fastOn")===true);
    ok("reminder 11 is off by default, off in old data too, id under 89",ev("cleanSettings({}).reminders.find(r=>r.id===11).on")===false&&ev("cleanSettings({reminders:[{id:1,t:'09:00',on:true}]}).reminders.find(r=>r.id===11).on")===false&&ev("S.settings.reminders.every(r=>r.id<=89)"));
    ev("S.settings.reminders.find(r=>r.id===11).on=false");sc.length=0;await ev("scheduleReminders()");
    ok("with reminder 11 off the 1100 series is not scheduled",!sc[0].some(n=>n.id>=1100&&n.id<=1129));
    ev("S.settings.reminders.find(r=>r.id===11).on=true");sc.length=0;await ev("scheduleReminders()");
    ok("when reminder 11 turns on the 1100+ ids are scheduled",sc[0].some(n=>n.id>=1100&&n.id<=1129)&&new Set(sc[0].map(n=>n.id)).size===sc[0].length);
    ev("S.settings.age=15;render()");
    ok("under 18: the fasting card shows an explanation instead of start, no confirm button",!q('[data-hb="fastgo"]')&&!q('.todo [data-act="riskok"]')&&q(".todo").textContent.includes("Oruç önerilmez")&&q(".todo").textContent.includes("18 yaş altındasın"));
    ev("S.settings.riskClearedAt=dayKey();render()");ok("under a hard block the 'Hekimime danıştım' confirmation does not unlock starting either",!q('[data-hb="fastgo"]'));
    ev("document.body.insertAdjacentHTML('beforeend','<button id=fx data-hb=fastgo></button>')");click("#fx");ev("document.querySelector('#fx').remove()");
    ok("under a block the start handler refuses too",ev("S.fast.t0")===null);
    ev("tab='settings-modules';render()");ok("under a hard block the 18:6 and 20:4 plans are disabled, short plans are enabled",q('[data-hb="plan:18"]').disabled&&q('[data-hb="plan:20"]').disabled&&!q('[data-hb="plan:16"]').disabled);
    sc.length=0;await ev("scheduleReminders()");
    ok("under a hard block the fasting reminder (11) is not scheduled",!sc[0].some(n=>n.id>=1100&&n.id<=1129));
    ev("S.fast.t0=Date.now()-36e5;tab='today';render()");sc.length=0;await ev("scheduleReminders()");
    ok("under a block a running fast can be ended, 9100 is not scheduled",!!q('[data-hb="fastend"]')&&!sc[0].some(n=>n.id===9100));
    click('[data-hb="fastend"]');await flush();
    ev("S.settings.age=0;S.settings.riskClearedAt='';S.settings.healthNote='tansiyon';render()");
    ok("soft block (health note): a warning and 'Hekimime danıştım', no start",!q('[data-hb="fastgo"]')&&!!q('.todo [data-act="riskok"]')&&q(".todo").textContent.includes("hekimine danış"));
    click('.todo [data-act="riskok"]');
    ok("after the confirmation it can start",!!q('[data-hb="fastgo"]')&&ev("S.settings.riskClearedAt")===ev("dayKey()"));
    ev("S.settings.healthNote='';S.settings.riskClearedAt='';render()");sc.length=0;
    ev("S.chat.push({id:999,t:1,role:'user',text:'x',fl:'ed'});save();render()");await flush();
    ok("when an ed flag appears in chat the card is blocked and fasting notifications reschedule themselves (no 11)",!q('[data-hb="fastgo"]')&&q(".todo").textContent.includes("Yeme düzeniyle")&&sc.length>0&&!sc[sc.length-1].some(n=>n.id>=1100&&n.id<=1129));
    ev("S.chat=S.chat.filter(m=>m.id!==999);S.settings.reminders.find(r=>r.id===11).on=false;save();S.fast={plan:16,t0:null,log:[]};render()");
    w.Capacitor.Plugins.LocalNotifications=lnO;
  }
  {
    // plates, warm-up, record at the moment of a set
    const doc=w.document,q=s=>doc.querySelector(s),click=s=>q(s).click(),toastT=()=>q("#tmsg").textContent;
    const fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
    const Wk=(id,t0,t1,sets)=>`{id:${id},day:dayKey(),t0:${t0},t1:${t1},name:'T',tpl:null,ex:[{id:'squat',note:'',sets:${sets}}]}`;
    ev(`S.bar=20;S.workouts=[${Wk(1,1000,2000,"[{kg:100,reps:5,done:true}]")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,done:false},{kg:null,reps:null,done:false}]")}];S.gid=3;tab='gym';render()`);
    click('[data-g="menu:0"]');click('[data-g="plate:0"]');
    fire("#pk","100");q("#pk").dispatchEvent(new w.Event("input"));
    ok("plate page: 100 kg -> 25 + 15 per side, warm-up list",q("#pres").textContent.includes("25 + 15")&&q("#pres").textContent.includes("40 × 5"),q("#pres").textContent);
    q("#pk").value="61";q("#pk").dispatchEvent(new w.Event("input"));
    ok("plate page: for a weight that cannot be made exactly, the nearest",q("#pres").textContent.includes("en yakın: 60 kg"),q("#pres").textContent);
    q("#pb").value="15";q("#pb").dispatchEvent(new w.Event("input"));
    ok("the bar can be changed and persists",ev("S.bar")===15);
    q("#pk").value="100";q("#pb").value="20";q("#pb").dispatchEvent(new w.Event("input"));
    click('[data-g="wadd:0"]');
    ok("warm-up sets are added to the front with w:true, done:false",ev("S.workouts[1].ex[0].sets.length")===6&&ev("S.workouts[1].ex[0].sets.slice(0,4).every(s=>s.w===true&&!s.done)")&&ev("S.workouts[1].ex[0].sets[3].kg")===80);
    ok("a warm-up row is labelled 'ısınma' and the working set pairs with the previous one by order",q(".srow .sp").textContent==="ısınma"&&[...doc.querySelectorAll(".srow .sp")][4].textContent==="100 × 5");
    fire('[data-gi="reps:0:3"]',"1");click('[data-g="done:0:3"]');
    ok("a warm-up set does not count toward volume or records",ev("gWorkVol(S.workouts[1])")===0&&ev("gBest(S.workouts[1],'squat')")===0&&!toastT().includes("rekor"));
    const sets=()=>JSON.parse(ev("JSON.stringify(S.workouts[1].ex[0].sets)"));
    click('[data-g="menu:0"]');click('[data-g="plate:0"]');q("#pk").value="100";q("#pb").value="20";click('[data-g="wadd:0"]');
    ok("adding the warm-up a second time refreshes pending ones, keeps completed ones, does not multiply",JSON.stringify(sets().filter(s=>s.w).map(s=>[s.kg,s.done]))==='[[20,false],[40,false],[60,false],[80,true]]'&&sets().length===6,sets());
    click('[data-g="menu:0"]');click('[data-g="plate:0"]');q("#pk").value="1500";click('[data-g="wadd:0"]');
    const bigT=toastT();q("#pk").value="100";q("#pb").value="0";click('[data-g="wadd:0"]');
    ok("warm-up: a target over 1000 kg and a 0 bar are rejected",bigT.includes("1000 kg")&&toastT().includes("bar 5-50")&&sets().length===6,[bigT,toastT()]);
    ev("closeSheet()");
    fire('[data-gi="kg:0:4"]',"100");fire('[data-gi="reps:0:4"]',"8");click('[data-g="done:0:4"]');
    ok("record toast at the moment of a set",toastT().startsWith("Yeni rekor: Squat, 100 kg × 8"),toastT());
    ok("volume counts only the working set",ev("gWorkVol(S.workouts[1])")===800);
    q("#tmsg").textContent="";
    fire('[data-gi="kg:0:5"]',"100");fire('[data-gi="reps:0:5"]',"9");click('[data-g="done:0:5"]');
    ok("no second toast for the same exercise in the same workout",toastT()==="",toastT());
    ok("gPRs does not count warm-ups, one record",ev("gPRs(S.workouts[1]).length")===1&&ev("gPRs(S.workouts[1])[0].kg")===100);
    ok("warm-ups do not enter the weekly set count",(ev("S.workouts[1].t1=Date.now();gWeekRegions()['Ön bacak']")||0)===2,ev("gWeekRegions()"));
    // persistence
    const C=JSON.parse(ev("JSON.stringify(cleanGym(JSON.parse(JSON.stringify(S))))"));
    ok("w:true and the bar are kept on reload",C.workouts[1].ex[0].sets[0].w===true&&C.workouts[1].ex[0].sets[4].w===undefined&&C.bar===20);
    ev(`S.workouts.push(${Wk(9,Date.now(),null,"[{kg:20,reps:10,done:true,w:true},{kg:null,reps:null,done:false}]")});S.entries=S.entries.filter(e=>e.type!=='exercise');gFinish()`);
    ok("a workout where only a warm-up set was completed is not saved, not deleted, no sport record is created, the reason is stated",ev("S.workouts.find(x=>x.id===9).t1")===null&&!ev("S.entries.some(e=>e.type==='exercise')")&&toastT().includes("Kaydedilmedi"),toastT());
    ev("S.workouts=S.workouts.filter(x=>x.id!==9)");
    const E=JSON.parse(ev(`JSON.stringify(cleanGym({workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    ok("an old backup without the fields loads: bar 20, records unchanged",E.bar===20&&E.workouts[0].ex[0].sets[0].kg===100&&E.workouts[0].ex[0].sets[0].w===undefined);
    const G=JSON.parse(ev(`JSON.stringify(cleanGym({bar:'abc',workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true,w:'x'}]}]}]}))`));
    ok("a junk bar/w value: the other data loads completely",G.bar===20&&G.workouts[0].ex[0].sets[0].kg===100&&G.workouts[0].ex[0].sets[0].w===undefined&&JSON.parse(ev("JSON.stringify(cleanGym({bar:99}))")).bar===20);
    // rep range per exercise
    ev(`S.exCfg={};S.workouts=[${Wk(1,1000,2000,"[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true}]")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];tab='gym';render()`);
    ok("if no range is chosen 8-12 (current behaviour)",ev("gSuggest('squat').reps")===9&&ev("gSuggest('squat').kg")===60);
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:5-8"]');
    ok("choosing 5-8 makes the suggestion follow that range: weight rises on reaching 8, starts from 5",ev("JSON.stringify(S.exCfg)")==='{"squat":{"lo":5,"hi":8}}'&&ev("gSuggest('squat').kg")===62.5&&ev("gSuggest('squat').reps")===5);
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:8-12"]');
    ok("choosing 8-12 returns to the default",ev("Object.keys(S.exCfg).length")===0);
    { // "this move bothered me"
      click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:5-8"]');
      click('[data-g="menu:0"]');click('[data-g="flag:0"]');
      ok("flagging stores only a day; the weight suggestion stops rising (62.5 would be next) and says why",ev("S.exCfg.squat.flag")===ev("dayKey()")&&ev("gSuggest('squat').kg")===60&&ev("gSuggest('squat').why").includes("işaretledin"),ev("JSON.stringify(S.exCfg)"));
      click('[data-g="menu:0"]');
      ok("the menu then offers to remove the mark and to show similar moves",q('[data-g="flag:0"]').textContent.includes("kaldır")&&!!q('[data-g="alt:0"]'));
      click('[data-g="alt:0"]');
      const alts=[...w.document.querySelectorAll('#sheet [data-g^="exadd:"]')].map(b=>b.dataset.g.slice(6));
      ok("similar moves: same region and equipment, not itself, not already in the workout, at most 8, no claim in the text",alts.length>0&&alts.length<=8&&!alts.includes("squat")&&alts.every(id=>ev("gEx('"+id+"').r")===ev("gEx('squat').r")&&ev("gEx('"+id+"').q")===ev("gEx('squat').q"))&&!/tedavi|iyileş|önler|tanı/i.test(q("#sheet").textContent),alts);
      click('#sheet [data-g="closesheet"]');
      click('[data-g="menu:0"]');click('[data-g="flag:0"]');
      ok("removing the mark brings the 62.5 suggestion back",ev("S.exCfg.squat.flag")===undefined&&ev("gSuggest('squat').kg")===62.5);
      ev("S.exCfg.squat.flag=keyOff(-15)");
      ok("a mark older than 14 days no longer counts",ev("gFlagged('squat')")===false&&ev("gSuggest('squat').kg")===62.5);
      ev("S.exCfg.squat.flag=keyOff(-13)");
      ok("a 13-day-old mark still counts",ev("gFlagged('squat')")===true);
      const F=JSON.parse(ev("JSON.stringify(cleanGym({exCfg:{squat:{flag:'2026-09-01'},bench:{flag:'x'},row:{flag:5}}}).exCfg)"));
      ok("a valid mark survives a reload, junk is dropped",JSON.stringify(F)==='{"squat":{"flag":"2026-09-01"}}',F);
      ev("S.exCfg={}");
    }
    const X=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:{squat:{lo:5,hi:8},bilinmeyen:{lo:5,hi:8},bench:{lo:9,hi:9},row:{lo:0,hi:5}}}))`));
    ok("exCfg is kept on reload, an unknown id and an invalid range are dropped",JSON.stringify(X.exCfg)==='{"squat":{"lo":5,"hi":8}}',X.exCfg);
    { // all-history charts
      const mk=(i,kg,r,extra="")=>`{id:${800+i},day:'${new Date(Date.now()-(60-i)*864e5).toISOString().slice(0,10)}',t0:${1000+i},t1:${2000+i},name:'T',tpl:null,ex:[{id:'squat',note:'',sets:[{kg:${kg},reps:${r},done:true},{kg:${kg},reps:${r},done:true}${extra}]}]}`;
      const open=()=>{ev("closeSheet();exSheet('squat')")};
      ev("S.workouts=[];tab='gym';render()");open();
      ok("chart: with no history no chart area appears",!q('#xch'));
      ev(`S.workouts=[${mk(0,60,8)}]`);open();
      ok("chart: with a single session an empty-state text, no SVG, the value shows",q('#xch').textContent.includes("en az iki seans")&&!q('#xch svg')&&q('#xch').textContent.includes("76 kg"),q('#xch').textContent);
      ev(`S.workouts=[${Array.from({length:30},(_,i)=>mk(i,60+i,8,i===29?",{kg:200,reps:10,done:true,w:true}":"")).join(",")}]`);open();
      ok("chart: all 30 sessions are drawn (not limited to 12), warm-up sets are not counted",q('#xch svg')&&q('#xch').querySelectorAll('rect[data-g^="chp:"]').length===30&&q("#xch").textContent.includes("113 kg")&&q('#xch').textContent.includes("30/30"),q('#xch').textContent);
      q('[data-g="chp:0"]').dispatchEvent(new w.MouseEvent("click",{bubbles:true})); // SVG elements have no click() in jsdom
      ok("chart: tapping shows that session's value",q('#xch').textContent.includes("76 kg")&&q('#xch').textContent.includes("1/30"),q('#xch').textContent);
      click('[data-g="chm:t"]');
      ok("chart: heaviest set and volume tabs",q('#xch').textContent.includes("89 kg × 8")&&(click('[data-g="chm:v"]'),/1.?424 kg/.test(q("#xch").textContent)),q('#xch').textContent);
      ev("closeSheet();tab='gym';render();gSheetHist('squat')");
      ok("chart: also on the history screen",!!q('#xch svg'));
      ev("closeSheet();S.workouts=[]");
    }
    { // quick set entry
      sc.length=0;
      const set=(kg,r,d)=>`{kg:${kg},reps:${r},done:${d}}`;
      ev(`S.exCfg={};S.workouts=[${Wk(1,1000,2000,`[${set(60,8,true)},${set(65,6,true)}]`)},${Wk(2,Date.now(),null,`[${set(60,8,true)},${set(null,null,false)},${set(60,8,false)}]`)}];tab='gym';render()`);
      const rows=()=>[...w.document.querySelectorAll(".srow")];
      ok("next set: only the first unmarked row is highlighted, one +/- panel under it",rows().filter(r=>r.classList.contains("nx")).length===1&&rows()[1].classList.contains("nx")&&rows()[1].nextElementSibling.classList.contains("sx")&&w.document.querySelectorAll(".sx").length===1);
      click('[data-g="kgp:0:1"]');
      ok("kg +: the step is the exercise's inc (squat 2.5), an empty value starts from 0",ev("S.workouts[1].ex[0].sets[1].kg")===2.5&&q('[data-gi="kg:0:1"]').value==="2,5");
      click('[data-g="kgm:0:1"]');click('[data-g="kgm:0:1"]');
      ok("kg -: does not go below 0",ev("S.workouts[1].ex[0].sets[1].kg")===0);
      click('[data-g="rpp:0:1"]');click('[data-g="rpp:0:1"]');click('[data-g="rpm:0:1"]');
      ok("reps +/-1, lower bound 1",ev("S.workouts[1].ex[0].sets[1].reps")===1&&(click('[data-g="rpm:0:1"]'),ev("S.workouts[1].ex[0].sets[1].reps")===1));
      ok("the same-as-previous-session button shows the same next set (2nd set: 65 x 6)",q('.sxs').textContent.includes("65 × 6"),q('.sxs').textContent);
      click('.sxs');
      ok("fills with one tap, the set is not marked done; once there is no difference the button goes away",ev("S.workouts[1].ex[0].sets[1].kg")===65&&ev("S.workouts[1].ex[0].sets[1].reps")===6&&ev("S.workouts[1].ex[0].sets[1].done")===false&&!q('.sxs'));
      sc.length=0;click('[data-g="done:0:1"]');
      ok("after the checkmark focus moves to the next unmarked set (scroll + highlight), the panel moves there",sc.length===1&&sc[0]===rows()[2]&&rows()[2].classList.contains("nx")&&!!rows()[2].nextElementSibling.classList.contains("sx"));
      sc.length=0;click('[data-g="done:0:1"]');
      ok("no scroll on undoing the checkmark",sc.length===0&&rows()[1].classList.contains("nx"));
      click('[data-g="addset:0"]');
      ok("a new set comes filled from the previous set (current behaviour kept)",ev("S.workouts[1].ex[0].sets[3].kg")===60&&ev("S.workouts[1].ex[0].sets[3].reps")===8);
      ev(`S.workouts[1].ex=[{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:false}]}];render()`);
      ok("no +/- panel on a timed exercise, the row is still highlighted",!q('.sx')&&!!q('.srow.nx'));
      ev("S.workouts=[]");
    }
    { // RPE
      const set=(kg,r,x="")=>`{kg:${kg},reps:${r},done:true${x}}`;
      ok("the RPE setting is off by default; an old setting without the flag and junk values stay off, true is on",ev("DEF.settings.rpeOn")===false&&ev("cleanSettings({kcal:1800}).rpeOn")===false&&ev("cleanSettings({rpeOn:'evet'}).rpeOn")===false&&ev("cleanSettings({rpeOn:true}).rpeOn")===true);
      ev(`S.settings.rpeOn=false;S.workouts=[${Wk(1,1000,2000,`[${set(60,8,",rpe:8")}]`)},${Wk(2,Date.now(),null,"[{kg:60,reps:8,done:false}]")}];tab='gym';render()`);
      ok("when off there is no RPE field on the set row, a stored RPE still shows in history",!q('[data-gi^="rpe"]')&&!q('.srow.r')&&ev("exHistLine(gEx('squat'))").includes("60×8 @8"),ev("exHistLine(gEx('squat'))"));
      ev("tab='settings-modules';render()");
      ok("Settings > Gym: the Zorluk (RPE) switch comes off",q('[data-rpe]')&&!q('[data-rpe]').checked);
      q('[data-rpe]').checked=true;q('[data-rpe]').dispatchEvent(new w.Event("change",{bubbles:true}));
      ev("tab='gym';render()");
      ok("when turned on every working row gets an RPE field and header",ev("S.settings.rpeOn")===true&&!!q('[data-gi="rpe:0:0"]')&&q('.shead.r')&&q('.srow.r'));
      fire('[data-gi="rpe:0:0"]',"8,5");
      ok("RPE 8.5 is saved",ev("S.workouts[1].ex[0].sets[0].rpe")===8.5&&q('[data-gi="rpe:0:0"]').value==="8,5");
      for(const bad of ["5","11","7.3","abc"]){fire('[data-gi="rpe:0:0"]',bad);}
      ok("an invalid RPE (5, 11, 7.3, abc) is rejected, the old value and kg/reps are kept",ev("S.workouts[1].ex[0].sets[0].rpe")===8.5&&ev("S.workouts[1].ex[0].sets[0].kg")===60&&ev("S.workouts[1].ex[0].sets[0].reps")===8);
      fire('[data-gi="rpe:0:0"]',"");
      ok("clearing the field removes the RPE",!("rpe" in ev("S.workouts[1].ex[0].sets[0]")));
      const sg=ev("JSON.stringify([gSuggest('squat'),gWorkVol(S.workouts[0])])");ev("S.workouts[0].ex[0].sets[0].rpe=10");
      ok("RPE does not enter suggestion or volume",ev("JSON.stringify([gSuggest('squat'),gWorkVol(S.workouts[0])])")===sg);
      const C=JSON.parse(ev(`JSON.stringify(cleanGym({workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[${[8.5,5,11,7.3,"'x'",null,10,6].map(r=>`{kg:100,reps:5,done:true,rpe:${r}}`).join(",")},{kg:100,reps:5,done:true}]}]}]}))`)).workouts[0].ex[0].sets;
      ok("cleanGym: only RPE 6-10 in 0.5 steps stays, sets and kg/reps are not lost; no field on old sets",JSON.stringify(C.map(x=>x.rpe))===JSON.stringify([8.5,undefined,undefined,undefined,undefined,undefined,10,6,undefined])&&C.length===9&&C.every(x=>x.kg===100&&x.reps===5),C);
      ev(`S.workouts[1].ex=[{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:false}]}];render()`);
      ok("no RPE field on a timed exercise",!q('[data-gi^="rpe"]'));
      ev("S.settings.rpeOn=false;S.workouts=[]");
    }
    { // weekly note
      const N=(r,h=true)=>JSON.stringify(ev(`gWeekNote(${JSON.stringify(r)},${h})`));
      ok("note: a region below the range is written with name, set count and range",N({Göğüs:6,Sırt:12,Omuz:10,"Ön bacak":10,"Arka bacak":10}).includes("Göğüs 6 set, önerilen haftalık 10-20 aralığının altında"),N({Göğüs:6}));
      ok("note: large muscle groups with no sets entered are counted, small ones (Biseps) are not",N({Göğüs:12}).includes("Sırt, Omuz, Ön bacak, Arka bacak")&&!N({Göğüs:12}).includes("Biseps"));
      ok("note: if all are 10+ and the large groups complete, a single positive line",N({Göğüs:10,Sırt:10,Omuz:10,"Ön bacak":10,"Arka bacak":14})==='["Kaydettiğin bölgelerin hepsi haftalık 10 set ve üstünde."]');
      ok("note: at most 3 low regions, starting from the lowest",N({Göğüs:9,Sırt:3,Omuz:5,Biseps:7,"Ön bacak":10,"Arka bacak":10}).includes("Sırt 3, Omuz 5, Biseps 7 set"));
      ok("note: with no workouts, a gentle note for a user with history, no note for one with none",N({}).includes("antrenman kaydı yok")&&!N({}).match(/ayıp|yapmadın|tembel/)&&N({},false)==="[]");
      ev(`S.workouts=[${Wk(1,Date.now()-864e5,Date.now()-8e7,"[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true},{kg:60,reps:8,done:true,w:true}]")}];tab='gym';render()`);
      ok("home: a note card appears under the 'this week' card (warm-up sets not counted)",ev("gWeekRegions()['Ön bacak']")===2&&q('#wknote').textContent.includes("Ön bacak 2 set")&&q('#wknote').closest(".card").textContent.includes("Bölge başına"),q('#wknote')&&q('#wknote').textContent);
      ev(`S.customEx=[{id:'c1',n:'Eski',g:'Kol',inc:2.5}];S.workouts=[{id:1,day:dayKey(),t0:Date.now()-1e6,t1:Date.now()-5e5,name:'B',tpl:null,ex:[{id:'bench',note:'',sets:[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true},{kg:60,reps:8,done:true}]},{id:'squat',note:'',sets:[{kg:60,reps:8,done:true},{kg:20,reps:8,done:true,w:true}]},{id:'c1',note:'',sets:[{kg:10,reps:8,done:true}]},{id:'plank',note:'',sets:[{kg:null,reps:null,sec:30,done:true}]}]}];render()`);
      const bl=[...w.document.querySelectorAll(".gbar")].map(b=>[b.children[0].textContent,+b.children[2].textContent]);
      ok("the week card is by region, most to least; warm-ups not counted, an old group-named custom exercise shows",q("#view").textContent.includes("Bu hafta, bölgeye göre set")&&JSON.stringify(bl)==='[["Göğüs",3],["Ön bacak",1],["Kol",1],["Karın",1]]',bl);
      ok("week card: no 6-item group names (İtiş, Çekiş) on the home screen, bars do not overflow",!bl.some(x=>["İtiş","Çekiş","Bacak"].includes(x[0]))&&[...w.document.querySelectorAll(".gbar .bar i")].every(i=>parseFloat(i.style.width)<=100));
      ev("S.customEx=[];S.workouts=[];render()");
      ev(`S.workouts=[${Wk(1,Date.now()-20*864e5,Date.now()-20*864e5+1e6,"[{kg:60,reps:8,done:true}]")}];render()`);
      ok("home: with no workout in the last 7 days the card still shows a gentle note",q('#wknote').textContent.includes("Son 7 günde antrenman kaydı yok"));
      ev("S.workouts=[];render()");
      ok("home: with no workout at all there is no note card",!q('#wknote'));
    }
    { // smart progression
      const set=(kg,r)=>`[{kg:${kg},reps:${r},done:true},{kg:${kg},reps:${r},done:true},{kg:${kg},reps:${r},done:true,w:false},{kg:20,reps:10,done:true,w:true}]`;
      ev(`S.exCfg={};S.workouts=[${Wk(1,1000,2000,set(60,7))},${Wk(2,3000,4000,set(60,6))},${Wk(3,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];tab='gym';render()`);
      ok("gSuggest looks at the last 2 sessions: below target at the same weight -> reduce, the card states the reason",ev("gSuggest('squat').kg")===55&&q('.sug').textContent.includes("Son 2 seans hedefin altında, %10 düşür."),q('.sug').textContent);
      ev(`S.workouts=[${Wk(0,500,600,set(60,9))},${Wk(1,1000,2000,set(60,9))},${Wk(2,3000,4000,set(60,9))},${Wk(3,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];render()`);
      ok("3 sessions without progress: a deload note on the card ('istersen')",/İstersen/.test(q('.sug').textContent)&&ev("gSuggest('squat').kg")===60,q('.sug').textContent);
      ev(`S.workouts=[${Wk(1,1000,2000,"[{kg:null,reps:null,sec:30,done:true}]").replace("id:'squat'","id:'plank'")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,sec:30,done:false}]").replace("id:'squat'","id:'plank'")}];render()`);
      ok("no suggestion for a timed exercise",ev("gSuggest('plank')")===null&&!q('.sug'));
      ev(`S.workouts=[${Wk(1,1000,2000,"[{kg:60,reps:8,done:true},{kg:60,reps:8,done:true}]")},${Wk(2,Date.now(),null,"[{kg:null,reps:null,done:false}]")}];render()`);
    }
    const Y=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:[1,2],workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    const Z=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:{squat:'x',bench:{lo:'5',hi:null},row:null},workouts:[{id:5,day:'2026-09-01',t0:1,t1:2,ex:[{id:'squat',sets:[{kg:100,reps:5,done:true}]}]}]}))`));
    ok("no exCfg (old backup) and junk values: records load completely",Object.keys(Y.exCfg).length===0&&Object.keys(Z.exCfg).length===0&&Y.workouts[0].ex[0].sets[0].kg===100&&Z.workouts[0].ex[0].sets[0].kg===100);
    // rest time per exercise
    ok("rest default by type: compound 150, isolation 75, timed 30, cardio 0, figureless custom exercise 90",JSON.stringify(["squat","bench","pullup","lat","curl","plank","treadjog"].map(i=>ev(`gRestSec('${i}')`)))==="[150,150,150,75,75,30,0]"&&ev("S.customEx.push({id:'c99',n:'K',g:'Kol',inc:2.5});const r=gRestSec('c99');S.customEx.pop();r")===90);
    ev("S.exCfg={};render()");click('[data-g="menu:0"]');
    ok("the exercise menu shows the rest time",q("#sheet").textContent.includes("Dinlenme süresi")&&q("#sheet").textContent.includes("02:30"));
    click('[data-g="rst:0"]');click('[data-g="rstset:0:90"]');
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:5-8"]');
    click('[data-g="menu:0"]');click('[data-g="rng:0"]');click('[data-g="rngset:0:8-12"]');
    ok("the chosen rest is saved, it is not deleted when the rep range changes",ev("JSON.stringify(S.exCfg)")==='{"squat":{"rest":90}}',ev("JSON.stringify(S.exCfg)"));
    fire('[data-gi="kg:0:0"]',"60");fire('[data-gi="reps:0:0"]',"8");click('[data-g="done:0:0"]');
    ok("after the set checkmark the counter starts with the exercise's duration",Math.abs(ev("restEnd-Date.now()")-90000)<1000);
    click('[data-g="rest:0"]');click('[data-g="menu:0"]');click('[data-g="rst:0"]');click('[data-g="rstset:0:d"]');
    ok("choosing Varsayılan deletes the record",ev("Object.keys(S.exCfg).length")===0);
    const RC=JSON.parse(ev(`JSON.stringify(cleanGym({exCfg:{squat:{rest:120},bench:{lo:5,hi:8,rest:601},row:{rest:'60'},curl:{rest:0},lat:{rest:1.5}}}).exCfg)`));
    ok("cleanGym: rest only an integer 0-600, the range is validated separately",JSON.stringify(RC)==='{"squat":{"rest":120},"bench":{"lo":5,"hi":8},"curl":{"rest":0}}',RC);
    // keep the screen on during a workout (native window flag)
    const dhOld=w.Capacitor.Plugins.DeviceHelp,awk=[],last=()=>awk[awk.length-1];
    w.Capacitor.Plugins.DeviceHelp={keepAwake:async o=>{awk.push(o.on)}};
    const vis=h=>{Object.defineProperty(doc,"hidden",{configurable:true,get:()=>h});doc.dispatchEvent(new w.Event("visibilitychange"))};
    ev("gAwakeOn=false;tab='gym';render();gTick()");
    ok("screen on: opens in Gym while a workout runs",last()===true);
    ev("tab='today';gTick()");const offTab=last();ev("tab='gym';gTick()");
    ok("screen on: released when the tab changes, reopened on return",offTab===false&&last()===true,awk);
    vis(true);const offBg=last();vis(false);
    ok("screen on: released when sent to the background, reapplied when brought forward",offBg===false&&last()===true,awk);
    const n0=awk.length;ev("gTick();gTick()");
    ok("screen on: the plugin is not called again unless the state changes",awk.length===n0);
    ev("tab='settings-modules';render()");q('[data-aw]').checked=false;q('[data-aw]').dispatchEvent(new w.Event("change",{bubbles:true}));ev("tab='gym';gTick()");
    ok("when the Settings switch is turned off it does not open in Gym either",ev("S.settings.awakeOn")===false&&last()===false);
    ev("S.settings.awakeOn=true;gTick()");const wid=ev("gActive().id");ev("gActive().t1=Date.now();gTick()");
    ok("screen on: released when the workout ends",last()===false);
    ev(`S.workouts.find(x=>x.id===${wid}).t1=null`);
    ok("setting: on by default, on in an old backup, only false turns it off",ev("cleanSettings({}).awakeOn")===true&&ev("cleanSettings({kcal:1800}).awakeOn")===true&&ev("cleanSettings({awakeOn:'x'}).awakeOn")===true&&ev("cleanSettings({awakeOn:false}).awakeOn")===false);
    if(dhOld)w.Capacitor.Plugins.DeviceHelp=dhOld;else delete w.Capacitor.Plugins.DeviceHelp;ev("gAwakeOn=false");
    // finishing, Today card, history
    const Tk=(id,name,t0,t1,exs,day)=>`{id:${id},day:${day||"dayKey()"},t0:${t0},t1:${t1},name:'${name}',tpl:null,ex:[${exs}]}`;
    const Ex=(id,sets)=>`{id:'${id}',note:'',sets:${sets}}`;
    const nowT=Date.now();
    ev(`S.entries=S.entries.filter(e=>e.type!=='exercise');S.workouts=[${Tk(20,"A",nowT,null,Ex("squat","[{kg:60,reps:5,done:true},{kg:60,reps:5,done:false},{kg:null,reps:null,done:false}]"))}];S.gid=30;tab='today';render()`);
    ok("Today: ongoing workout card, marked/total sets and Devam et",q('.rrow[data-g="start:"] .tag').textContent==="Devam et"&&q("#view").textContent.includes("1 egzersiz, 1/3 set işaretli"),q("#view").textContent.includes("Devam ediyor"));
    click('.rrow[data-g="start:"]');
    ok("Devam et opens Gym",ev("tab")==="gym");
    ev("gFinish()");
    ok("an unmarked set with values becomes done:true on confirm (Tamam) and is saved",ev("S.workouts[0].t1")!=null&&ev("S.workouts[0].ex[0].sets.length")===2&&ev("S.workouts[0].ex[0].sets.every(s=>s.done)")&&ev("S.entries.some(e=>e.type==='exercise'&&e.wid===20)"));
    ev("closeSheet();tab='today';render()");
    ok("Today: finished workout card with name, sets, duration, volume; tapping opens the summary",q("#view").textContent.includes("Squat")&&q("#view").textContent.includes("2 set")&&q("#view").textContent.includes("600 kg")&&(click('.rrow[data-g="sum:20"]'),q("#sheet").textContent.includes("600")));
    ev("closeSheet()");
    w.confirm=()=>false;
    ev(`S.entries=S.entries.filter(e=>e.type!=='exercise');S.workouts=[${Tk(21,"B",nowT,null,Ex("squat","[{kg:60,reps:5,done:true},{kg:70,reps:5,done:false}]"))}];gFinish()`);
    w.confirm=()=>true;
    ok("Cancel: the workout stays open, unmarked sets are not deleted",ev("S.workouts[0].t1")==null&&ev("S.workouts[0].ex[0].sets.length")===2);
    ok("the running duration counter does not stop on the Cancel and not-saved paths; it stops on save",(()=>{
      ev("gTim={ei:0,si:0,phase:'work'}");const a=ev("!!gTim");
      ev(`S.workouts=[${Tk(25,"E",nowT,null,Ex("squat","[{kg:null,reps:null,done:false}]"))}];gFinish()`);const b=ev("!!gTim");
      w.confirm=()=>false;ev(`S.workouts=[${Tk(26,"F",nowT,null,Ex("squat","[{kg:60,reps:5,done:true},{kg:70,reps:5,done:false}]"))}];gFinish()`);w.confirm=()=>true;const c=ev("!!gTim");
      ev(`S.workouts=[${Tk(27,"G",nowT,null,Ex("squat","[{kg:60,reps:5,done:true}]"))}];gFinish()`);const d=ev("!!gTim");ev("closeSheet()");
      return a&&b&&c&&!d})());
    { // a workout across midnight: the sport record is consistent with the end day and end time
      const t0=new Date();t0.setDate(t0.getDate()-1);t0.setHours(23,40,0,0);
      ev(`S.entries=S.entries.filter(e=>e.type!=='exercise');S.workouts=[{id:28,day:dayKey(new Date(${t0.getTime()})),t0:${t0.getTime()},t1:null,name:'Gece',tpl:null,ex:[${Ex("squat","[{kg:60,reps:5,done:true}]")}]}];gFinish()`);
      ok("a workout across midnight: the sport record's day is the end day",ev("S.entries.find(e=>e.type==='exercise').day")===ev("dayKey()")&&ev("S.entries.find(e=>e.type==='exercise').time")===ev("(()=>{const d=new Date(S.workouts[0].t1);return pad(d.getHours())+':'+pad(d.getMinutes())})()"));
      ev("closeSheet()");
    }
    ev(`S.workouts=[${Tk(22,"C",nowT,null,Ex("squat","[{kg:null,reps:null,done:false}]"))}];gFinish()`);
    ok("with no valued set it is not saved, the workout is not deleted, the toast states the reason",ev("S.workouts.length")===1&&ev("S.workouts[0].t1")===null&&toastT().startsWith("Kaydedilmedi"),toastT());
    ev(`S.workouts=[${Tk(23,"D",nowT,null,Ex("squat","[{kg:20,reps:10,done:false,w:true}]"))}];gFinish()`);
    ok("an unmarked warm-up set does not count as valued: the workout is not saved",ev("S.workouts[0].t1")===null);
    ev("S.workouts=[];tab='today';render()");
    // an unfinished workout left from yesterday: the card says 'bitirilmedi', the duration is asked, no fake 10-hour record is written
    ev(`S.entries=S.entries.filter(e=>e.type!=='exercise');S.workouts=[${Tk(40,"D",nowT-30*3600000,null,Ex("squat","[{kg:60,reps:5,done:true},{kg:60,reps:5,done:false}]"),"keyOff(-1)")}];tab='today';render()`);
    ok("workout left from yesterday: not 'Devam ediyor', bitirilmedi + Bitir/Sil",!q("#view").textContent.includes("Devam ediyor")&&q("#view").textContent.includes("bitirilmedi")&&!!q('[data-g="stalefin"]')&&!!q('.card [data-g="cancel"]'));
    click('[data-g="stalefin"]');ev("$('#gsd').value='45'");click('[data-g="stalego"]');
    ok("left from yesterday: the asked duration is saved (45 min), the card goes",ev("S.workouts[0].t1-S.workouts[0].t0")===45*60000&&ev("S.entries.find(e=>e.wid===40).v")===45&&!q('[data-g="stalefin"]'));
    // History: calendar, day screen, months, search; no 365-day limit
    const qa=s=>[...w.document.querySelectorAll(s)];
    ev(`S.workouts=[];S.entries=[];S.fast.log=[];S.mood=[];S.sleep=[];S.vitals=[];S.pulse=[];S.hr=[];S.medLog=[];S.measures=[];
      const o=keyOff(-800);S.entries.push({id:S.nextId++,day:o,time:"12:00",type:"food",v:600,text:"Eski ÇİĞKÖFTE"},{id:S.nextId++,day:keyOff(-20),time:"08:00",type:"weight",v:80,text:""});S.entries.push({id:S.nextId++,day:dayKey(),time:"09:00",type:"water",v:250,text:""});tab="more";render()`);
    ok("Daha fazla: History and calendar row",!!q('#view [data-tab="history"]'));
    click('#view [data-tab="history"]');
    ok("History: Calendar tab, this month's cells, today labelled, future days disabled",ev("tab")==="history"&&qa(".hgd").length>=28&&qa(".hgd").some(b=>/bugün/.test(b.getAttribute("aria-label")))&&q("#back").hidden===false);
    ok("Calendar: a recorded day's label names the types (not colour-dependent)",qa(".hgd").some(b=>/bugün.*su/.test(b.getAttribute("aria-label"))));
    const oldK=ev("keyOff(-800)");ev(`hg.ym="${oldK.slice(0,7)}";render()`);
    ok("moving to the month 2 years ago, that day's cell is recorded",/yemek/.test(q(`[data-hg="day:${oldK}"]`).getAttribute("aria-label"))&&q("#hgy").value===oldK.slice(0,4));
    click(`[data-hg="day:${oldK}"]`);
    ok("Day screen: a day older than 365 days can be opened, the record shows",ev("tab")==="day"&&ev("logOff")===800&&q("#view").textContent.includes("Eski ÇİĞKÖFTE")&&/Gün/.test(q("#ttl").textContent));
    click('[data-hg="add:water"]');
    ok("water from the Day screen is written to that day (not to today)",ev(`S.entries.filter(e=>e.type==="water"&&e.day==="${oldK}").length`)===1&&ev(`S.entries.filter(e=>e.type==="water"&&e.day===dayKey()).length`)===1);
    click('[data-hg="add:food"]');
    ok("when adding food to an old day the day picker comes with that day selected",q("#fday").value===oldK&&[...q("#fday").options].length===8);
    ev("closeSheet()");
    click(`#view [data-del="${ev('S.entries.find(e=>e.text==="Eski ÇİĞKÖFTE").id')}"]`);
    ok("a record is deleted from the Day screen",!q("#view").textContent.includes("Eski ÇİĞKÖFTE"));
    ev("S.entries.push({id:S.nextId++,day:keyOff(-800),time:'12:00',type:'food',v:600,text:'Eski ÇİĞKÖFTE'});logOff=0;tab='history';hg.seg='months';render()");
    ok("Months: the year heading and month row from 2 years ago",q("#view").textContent.includes(oldK.slice(0,4))&&!!q(`[data-hg="ym:${oldK.slice(0,7)}"]`));
    ev("hg.seg='search';render()");q("#hgq").value="cigkofte";q("#hgq").dispatchEvent(new w.Event("input",{bubbles:true}));
    ok("Search: ignores Turkish letters and case, takes you to the date",q("#hgres").textContent.includes("1 kayıt")&&!!q(`#hgres [data-hg="day:${oldK}"]`));
    ev("hg.q='';hg.seg='cal';hg.ym=null;logOff=800;tab='day';render()");click('[data-lo="1"]');
    ok("the previous-day button stops at the oldest record day (does not go further back)",ev("logOff")===800);
    ev("logOff=0;tab='today';render()");
    ok("Today: History and calendar link",!!q('#view [data-tab="history"]'));
    ev("S.entries.push({id:S.nextId++,day:keyOff(-790),time:'07:00',type:'weight',v:95,text:''},{id:S.nextId++,day:keyOff(-400),time:'07:00',type:'weight',v:88,text:''});range=365;tab='trend';render()");
    ok("Trend: 1 year and Tümü buttons, 1 year weekly bars",!!q('[data-range="365"]')&&!!q('[data-range="0"]')&&q('[data-range="365"]').getAttribute("aria-pressed")==="true"&&q("#view").innerHTML.includes("haftalık ortalamalar"));
    click('[data-range="0"]');
    ok("Trend Tümü: from the first record to today (monthly bars), chart 790+ days, no NaN",ev("range")===0&&q("#view").innerHTML.includes("aylık ortalamalar")&&q("#view").innerHTML.includes("Son")&&!/NaN|undefined/.test(q("#view").textContent)&&q(".chart").getAttribute("data-tip").includes("95"));
    ev("range=30;tab='today';render()");
    // Rings show today; tapping opens the Day screen, last 14 days and calendar
    ev(`S.workouts=[];S.entries=[{id:S.nextId++,day:keyOff(-1),time:"20:00",type:"exercise",v:45,text:"Cross bike"},{id:S.nextId++,day:dayKey(),time:"08:00",type:"exercise",v:20,text:"Yürüyüş"}];S.settings.sportWeek=150;logOff=0;tab="today";render()`);
    ok("the sport ring counts only today (yesterday's 45 min does not), daily share 21 min",q(".rings").textContent.includes("20 / 21 dk")&&!q(".rings").textContent.includes("65"));
    ok("rings are buttons: calories, water, sport",["kcal","water","exercise"].every(k=>!!q(`.rings [data-hg="focus:${k}"]`)));
    click('.rings [data-hg="focus:exercise"]');
    ok("tapping the sport ring opens the Day screen: today, last 14 days chart, calendar link",ev("tab")==="day"&&ev("logOff")===0&&q("#view").textContent.includes("Spor · son 14 gün")&&!!q('#view [data-tab="history"]')&&!!q("#view svg.bars"));
    ev("logOff=0;tab='today';render()");
    ok("with no workout the Today card does not show",!q('[data-g="start:"]')&&!q("#view").textContent.includes("Devam ediyor"));
    // timed: no 0 kg; 5 exercises: first 4 + "+1"
    ev(`S.workouts=[${Tk(24,"Süreli",nowT-1000,nowT,Ex("superman","[{kg:null,reps:null,sec:90,done:true}]")+","+Ex("squat","[{kg:20,reps:10,done:true,w:true}]")+","+Ex("bench","[{kg:50,reps:5,done:true}]")+","+Ex("row","[{kg:40,reps:5,done:true}]")+","+Ex("curl","[{kg:10,reps:5,done:true}]")+","+Ex("crunch","[{kg:0,reps:5,done:true}]"))}];tab='today';render()`);
    ok("Today card: at most 4 exercise names + '+N'",/ \+2/.test(q('.rrow[data-g="sum:24"]').textContent),q('.rrow[data-g="sum:24"]').textContent);
    ev(`S.workouts=[${Tk(25,"Süreli",nowT-1000,nowT,Ex("superman","[{kg:null,reps:null,sec:90,done:true},{kg:null,reps:null,sec:30,done:true,w:true}]"))}];tab='today';render()`);
    const card=q('.rrow[data-g="sum:25"]').textContent;
    click('.rrow[data-g="sum:25"]');const sm=q("#sheet").textContent;
    ev("closeSheet();tab='gym';render()");
    ok("timed exercise: the card, summary and history do not show '0 kg', they show the duration (warm-ups not counted)",!card.includes("0 kg")&&!sm.includes("0 kg")&&!q('.rrow[data-g="sum:25"]').textContent.includes("0 kg")&&card.includes("90 sn")&&sm.includes("90 sn")&&card.includes("1 set"),[card,sm]);
    // history: all, month headings, 20 + show more
    const many=[];for(let i=1;i<=25;i++)many.push(Tk(100+i,"H"+i,nowT-i*864e5*3,nowT-i*864e5*3+60000,Ex("squat","[{kg:50,reps:5,done:true}]"),`keyOff(-${i*3})`));
    ev(`S.workouts=[${many.join(",")}];gHistMax=20;tab='gym';render()`);
    const hr=()=>doc.querySelectorAll('.rrow[data-g^="sum:"]').length;
    ok("history: first 20 rows, month heading, 'Daha fazla göster'",hr()===20&&doc.querySelectorAll(".card .lbl").length>=2&&!!q('[data-g="histmore"]'));
    click('[data-g="histmore"]');
    ok("show more brings the rest (25), the button disappears, newest on top",hr()===25&&!q('[data-g="histmore"]')&&q('.rrow[data-g^="sum:"]').dataset.g==="sum:101");
    ok("the Recent workouts section was replaced by the history",q("#view").textContent.includes("Antrenman geçmişi")&&!q("#view").textContent.includes("Son antrenmanlar"));
    ev("S.workouts=[];S.bar=20;closeSheet();tab='today';render()");
  }
  {
    // Coach analysis: why card, plateau, program, weekly summary notification
    const doc=w.document,q=s=>doc.querySelector(s);
    let fetched=0,reply={reply:"Yorum",log:[]};
    w.fetch=async()=>{fetched++;return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}};
    ev("S.chat=[];S.cid=1;S.settings.consent=false;setKey('nvidia','K1');S.entries=[];S.sleep=[];Object.assign(S.settings,{kcal:1800,goalKg:0,age:0,healthNote:'',heightCm:175});for(let i=1;i<=7;i++)add('food',i%2?2000:300,'y',keyOff(-i));add('weight',80,'',keyOff(-1));tab='trend';render()");
    const whyBtn=()=>!!q('[data-c="why"]');
    ok("the why button is hidden without a weight-loss goal (Trend and Coach)",!whyBtn()&&(ev("tab='coach';render()"),!whyBtn()));
    ev("S.settings.goalKg=70;S.settings.age=16;render()");
    ok("the why button is hidden under 18, cWhy produces no card",!whyBtn()&&(ev("cWhy()"),!ev("S.chat.length")));
    ev("S.settings.age=0;S.chat=[{id:1,role:'user',text:'x',t:1,fl:'ed'}];render()");
    ok("the why button is hidden on an eating-disorder flag",!whyBtn());
    const setW=f=>ev(`S.entries=S.entries.filter(e=>e.type!=='weight');for(let i=0;i<=20;i+=2)add('weight',${f},'',keyOff(-i))`);
    const chipCoach=()=>(ev("tab='coach';render()"),!!q('.chips [data-c="why"]'));
    ev("S.chat=[];S.settings.goalKg=70");setW("80+0.07*i");ev("tab='trend';render()");
    ok("a user who is losing weight gets no 'neden kilo vermedim' button or Coach chip",!whyBtn()&&!chipCoach());
    setW("80");ev("tab='trend';render()");
    ok("when the trend is flat the button and Coach chip appear",whyBtn()&&chipCoach());
    ev("S.entries=S.entries.filter(e=>e.type!=='weight');add('weight',80,'');tab='trend';render()");
    ok("a new user with a single weigh-in gets no 'why' question (insufficient data)",!whyBtn()&&!chipCoach());
    ev("S.entries=S.entries.filter(e=>e.type!=='weight');for(const i of [0,7,14,21])add('weight',80+i/7,'',keyOff(-i));tab='trend';render()");
    ok("a user weighing weekly and losing 1 kg a week gets no 'why' question",!whyBtn()&&!chipCoach());
    setW("80-0.05*i");ev("tab='trend';render()");
    ok("the button appears when the trend is rising",whyBtn());
    const tv=()=>q("#view").textContent;
    ev("S.settings.goalKg=75");setW("80+0.07*i");ev("tab='trend';render()");
    ok("one speed and one forecast with its condition stated in Trend; no old 'Kaba tahmin' or 'Haftalık ortalama farkı'",/Kilo hızı/.test(tv())&&(tv().match(/Son 3 haftanın eğimi sürerse|tarihi kestirilemiyor/g)||[]).length===1&&/Son 3 haftanın eğimi sürerse (~\d+|\d+–\d+) hafta|hedef tarihi kestirilemiyor/.test(tv())&&!/Kaba tahmin|Haftalık ortalama farkı|Hedefe tahmini/.test(tv()),tv().slice(0,400));
    ev("S.settings.goalKg=90;render()");
    ok("if the goal direction contradicts the slope no forecast is shown",!/~\d+ hafta/.test(tv()));
    setW("80");ev("S.settings.goalKg=75;render()");
    ok("with speed ~0 no forecast is shown",!/~\d+ hafta/.test(tv()));
    ev("S.settings.goalKg=70;S.entries=S.entries.filter(e=>e.type!=='weight');[0,2,5,8,11,13,16,19,20].forEach((d,k)=>add('weight',[84,87.5,82,88,83,86.5,81,87,82.5][k]-d*0.05,'',keyOff(-20+d)));tab='trend';render()");
    ok("with a noisy slope the forecast says it cannot be estimated instead of a made-up date",/hedef tarihi kestirilemiyor/.test(tv())&&!/~\d+ hafta/.test(tv()),tv().slice(0,400));
    ev("S.settings.goalKg=70;S.entries=S.entries.filter(e=>e.type!=='weight');for(let i=0;i<=20;i+=2)add('weight',80,'',keyOff(-i));tab='trend';render()");
    ev("S.chat=[];tab='trend';render()");
    q('[data-c="why"]').click();await flush();
    const wc=ev("S.chat.find(m=>m.card&&m.card.kind==='why')");
    ok("without consent the why card is local, no fetch, no AI button",ev("tab")==="coach"&&wc&&wc.card.items[0].t.includes("hedefin 1800 kcal")&&fetched===0&&!q('[data-c^="whyai"]'),[wc,fetched]);
    const cc=JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))"));
    ok("the why card survives a reload",cc.chat.some(m=>m.card&&m.card.kind==="why"&&m.card.items.length===wc.card.items.length));
    const g=JSON.parse(ev(`JSON.stringify(cleanCoach({chat:[{id:1,role:'coach',text:'',t:1,card:{kind:'why',items:'x'}},{id:2,role:'coach',text:'',t:1,card:{kind:'why',items:[null,{k:'X!',t:1}]}},{id:3,role:'user',text:'merhaba',t:1}]}))`));
    ok("with a junk why card the other messages load completely",g.chat.length===3&&!g.chat[0].card&&!g.chat[1].card&&g.chat[2].text==="merhaba");
    // plateau
    const f0=fetched,pq=()=>ev("S.chat.filter(m=>m.kind==='plateau').length");
    ev("S.chat=[];S.settings.lastPlateau='';S.settings.goalKg=70;S.entries=[];[-20,-18,-16,-14,-12,-9,-7,-5,-2,0].forEach((o,i)=>add('weight',80+[0.2,-0.1,0.3,-0.2,0,0.1,-0.3,0.2,-0.1,0][i],'',keyOff(o)));cPlateauCheck()");
    ok("the plateau question drops, no AI call is made (even with consent and a key)",pq()===1&&ev("S.chat[0].text")==="Son 3 haftadır kilon düşmüyor. Birlikte bakalım mı?"&&fetched===f0&&ev("S.settings.lastPlateau")===ev("dayKey()"));
    ev("cPlateauCheck();S.settings.lastPlateau=keyOff(-13);cPlateauCheck()");
    ok("the plateau question does not drop again within 14 days",pq()===1);
    ev("S.settings.lastPlateau=keyOff(-14);cPlateauCheck()");
    ok("after 14 days it can drop again",pq()===2);
    ev("S.chat=[];S.settings.lastPlateau='';S.settings.healthNote='tansiyon';cPlateauCheck();S.settings.healthNote='';S.settings.goalKg=79.8;cPlateauCheck()");
    ok("under a restriction (lossBlock) or when the goal is near the trend there is no plateau question",pq()===0);
    ev("S.settings.goalKg=70;cPlateauCheck();tab='coach';render()");q(`[data-mid="${ev("S.chat[0].id")}"] [data-c="why"]`).click();await flush();
    ok("Bak opens the local why card, no fetch",ev("S.chat.some(m=>m.card&&m.card.kind==='why')")&&fetched===f0);
    ok("lastPlateau persists; empty for old and junk values",ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).lastPlateau")===ev("dayKey()")&&ev("cleanSettings({}).lastPlateau")===""&&ev("cleanSettings({lastPlateau:{a:1},kcal:1800}).lastPlateau")===""&&ev("cleanSettings({lastPlateau:7,kcal:1800}).kcal")===1800);
    ok("the plateau message survives a reload",JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.some(m=>m.kind==="plateau"));
    // program from the Coach
    ev("S.chat=[];S.templates=[];S.workouts=[];S.settings.consent=false;tab='gym';render()");
    q('[data-c="prog"]').click();q('[data-c="po:d:2"]').click();q('[data-c="po:q:Ev tipi"]').click();
    ok("program page: choices are marked",q('[data-c="po:d:2"]').getAttribute("aria-pressed")==="true"&&q('[data-c="po:q:Ev tipi"]').getAttribute("aria-pressed")==="true"&&ev("progOpt.q")==="Ev tipi");
    let f1=fetched;q('[data-c="progask"]').click();await flush();
    ok("the program request makes no call without consent",fetched===f1&&!ev("S.chat.length"));
    ev("S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';S.settings.age=30;progOpt={d:3,q:'Salon',m:45,l:'Başlangıç'}");
    reply={reply:"Program hazır",log:[],program:{name:"3 gün",days:[{n:"A",ex:["squat","bench","row"]},{n:"B",ex:["squat","uydurma"]},{n:"C",ex:["legpress","pulldown"]}]}};
    let sent;w.fetch=async(u,o)=>{fetched++;sent=JSON.parse(o.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}};
    await ev("cProgram(progOpt)");
    const pm=ev("S.chat.find(m=>m.card&&m.card.kind==='program')");
    ok("program card: ids outside the catalog and single-exercise days are dropped, JSON not written into the text",pm&&pm.card.days.length===2&&pm.text==="Program hazır"&&sent.max_tokens===900&&/KATALOG \(bölge: kimlik\|ad, \.\.\.\):\n(.+\n)*Ön bacak: .*squat\|Squat/.test(sent.messages[0].content)&&!/SON 14 GÜN|BUGÜN:|SON NOTLAR/.test(sent.messages[0].content.slice(sent.messages[0].content.indexOf("PROFİL:")))&&sent.messages[0].content.includes("PROFİL:"),[pm,sent&&sent.max_tokens]);
    ok("the Coach program card has the same safety note as ready-made programs",q(`[data-c="progadd:${pm.id}"]`).closest(".lcard").textContent.includes(ev("gPgNote"))&&ev("gPgNote").includes("gebeliğin")&&ev("gPgNote").includes("hareketi bırak"));
    q(`[data-c="progadd:${pm.id}"]`).click();
    ok("Şablon olarak ekle adds every day as a template",ev("S.templates.length")===2&&ev("S.templates[0].name")==="3 gün – A"&&ev("S.templates[0].ex.join()")==="squat,bench,row"&&!q('[data-c^="progadd"]'));
    const pc=JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.find(m=>m.card&&m.card.kind==="program");
    ok("the program card survives a reload (with its state)",pc&&pc.card.days.length===2&&pc.card.state==="ok");
    const gp=JSON.parse(ev(`JSON.stringify(cleanCoach({customEx:[{id:'c7'}],chat:[{id:1,role:'coach',text:'a',t:1,card:{kind:'program',name:'P',days:[{n:'X',ex:['c7','squat']}]}},{id:2,role:'coach',text:'b',t:1,card:{kind:'program',days:'x'}},{id:3,role:'coach',text:'c',t:1}]}))`));
    ok("the program card recognises a raw customEx id; with a junk card the other messages stay",gp.chat.length===3&&gp.chat[0].card.days[0].ex.join()==="c7,squat"&&!gp.chat[1].card);
    reply={reply:"bozuk",log:[]};ev("S.chat=[]");await ev("cProgram(progOpt)");
    ok("a malformed program reply gives no card, a warning",!ev("S.chat.some(m=>m.card)")&&q("#tmsg").textContent.includes("Program okunamadı"));
    // context size: filled 14 days + the largest catalog
    ev(`S.settings.healthNote='x'.repeat(300);S.entries=[];S.sleep=[];S.mood=[];for(let i=0;i<14;i++){const k=keyOff(-i);add('weight',80,'',k);for(let j=0;j<4;j++){const e=add('food',650,'öğün',k);e.p=35}add('water',2500,'',k);add('exercise',45,'Yürüyüş',k);add('steps',12345,'',k);add('note',null,'n'.repeat(100),k);S.sleep.push({day:k,min:450});S.mood.push({day:k,v:4})}S.workouts=[1,2,3].map(i=>({id:i,day:keyOff(-i),t0:i,t1:i+1,name:'Tam vücut',tpl:null,ex:['squat','bench','row','ohp','curl','legpress'].map(id=>({id,note:'',sets:[{kg:60,reps:10,done:true}]}))}))`);
    const big=ev("CoachLib.contextText(cData()).length+cCatalog({q:'Salon',l:'İleri'}).text.length"),sys=ev("cMessages('x',cCatalog({q:'Salon',l:'İleri'}).text)[0].content.length");
    ok("contextText + catalog < 9000 characters",big<9000,big);
    ev("S.entries=[];S.sleep=[];S.mood=[];S.workouts=[];S.templates=[];S.chat=[];S.settings.healthNote='';S.settings.consent=false;tab='today';render()");
    // weekly summary notification and tapping
    const r12=JSON.parse(ev("JSON.stringify(cleanSettings({reminders:[{id:1,t:'09:00',on:true}]}).reminders.find(r=>r.id===12))"));
    ok("reminder 12 exists in old data too: Sunday 20:30, on",r12&&r12.on===true&&r12.dow===0&&r12.t==="20:30");
    const b12=x=>ev(`cleanSettings({reminders:[{id:12,t:'20:30',on:true,body:${JSON.stringify(x)}}]}).reminders.find(r=>r.id===12).body`);
    ok("weekly notification: the user's text is kept",b12("Pazar kontrolü")==="Pazar kontrolü");
    const lnO=w.Capacitor.Plugins.LocalNotifications,sc=[],rmv=[];
    w.Capacitor.Plugins.LocalNotifications={checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),removeDeliveredNotifications:async()=>{},registerActionTypes:async()=>{},cancel:async()=>{},schedule:async o=>{sc.push(...o.notifications)}};
    await ev("scheduleReminders()");
    const n12=sc.filter(n=>n.id>=1200&&n.id<=1229);
    ok("reminder 12 is scheduled for Sunday 20:30 and carries extra.act==='open'; water reminders keep their own extra",n12.length>=4&&n12.every(n=>n.schedule.at.getDay()===0&&n.schedule.at.getHours()===20&&n.schedule.at.getMinutes()===30&&n.extra.act==="open")&&sc.filter(n=>n.id>=200&&n.id<500).every(n=>n.extra.act==="water"),n12.length);
    ev("S.settings.reminders.find(r=>r.id===12).on=false");sc.length=0;await ev("scheduleReminders()");
    ok("when reminder 12 is turned off it is not scheduled",sc.length>0&&!sc.some(n=>n.id>=1200&&n.id<=1229));
    ev("for(let i=0;i<10;i++)S.entries.push({id:9000+i,day:dayKey(),time:'00:00',type:'note',v:null,text:'x'});S.settings.lastBackup=''");sc.length=0;await ev("scheduleReminders()");
    ok("the backup reminder carries an extra that opens Data and backup",sc.some(n=>n.id>=1000&&n.id<1030&&n.extra&&n.extra.act==="open"&&n.extra.tab==="settings-data"));
    ev("S.entries=S.entries.filter(e=>e.id<9000)");
    ev("S.settings.reminders.find(r=>r.id===12).on=true");w.Capacitor.Plugins.LocalNotifications=lnO;
    const tap=(a,x)=>ev(`notifTap(${JSON.stringify({actionId:a,notification:{extra:x}})});tab`);
    ev("tab='today';S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter'");
    ok("listener: tapping opens the Coach when consent exists",tap("tap",{act:"open",tab:"coach"})==="coach");
    ev("tab='today';S.settings.consent=false");
    ok("listener: without consent Trend opens",tap("tap",{act:"open",tab:"coach"})==="trend");
    ev("tab='today'");
    ok("listener: the water button and a notification without act are ignored, an unknown tab falls back to Trend",tap("water",{act:"open",tab:"coach"})==="today"&&tap("tap",{act:"water"})==="today"&&tap("tap",{act:"open",tab:"settings"})==="trend");
    ok("listener: tapping the backup reminder opens Data and backup",tap("tap",{act:"open",tab:"settings-data"})==="settings-data");
    ev("tab='today';render()");
  }
  { // pain note in an active workout
    ev("gStart(null);tab='gym';render()");
    ok("pain note in an active workout",ev("!!gActive()")&&$q("#view").textContent.includes(ev("gPainNote"))&&ev("gPainNote").includes("fizyoterapist"));
    ev("S.workouts=S.workouts.filter(w=>gDone(w));tab='today';render()");
  }
  { // storage limit and quota error
    const v=()=>$q("#view").textContent,SP=w.Storage.prototype,set0=SP.setItem;
    ev("tab='today';S.entries=[];render()");
    ok("storage: no warning on small data, size is measured",!v().includes("Depolama dolmak üzere")&&ev("storeBytes")>=ev("JSON.stringify(S).length*2"));
    ev("storeBytes=4e6;render()");
    ok("storage: when the threshold is exceeded a backup suggestion on the Today to-do",$q(".todo").textContent.includes("Depolama dolmak üzere")&&$q(".todo").textContent.includes("4,0 MB")&&!!$q('.todo [data-act="databackup"]'));
    ev("tab='settings-data';render()");
    ok("storage: a warning and used space in Settings > Data",v().includes("Depolama dolmak üzere")&&v().includes("Kullanılan alan"));
    SP.setItem=function(k){if(k==="nw_state")throw new w.DOMException("dolu","QuotaExceededError");return set0.apply(this,arguments)};
    ev("tab='today';render()");
    $q('[data-act="water"]').click();const m1=$q("#tmsg").textContent;$q('[data-act="water"]').click();
    ok("quota error: every failed save says so in the visible message, the change stays in memory, a persistent warning",/kaydedilemedi/i.test(m1)&&/kaydedilemedi/i.test($q("#tmsg").textContent)&&ev("of('water',dayKey()).length")===2&&$q(".todo").textContent.includes("Son değişiklik kaydedilemedi"),[m1,$q("#tmsg").textContent]);
    ev("tab='gym';render()");
    ok("quota error: a persistent warning in other tabs too",$q("#view").textContent.includes("Son değişiklik kaydedilemedi"));
    ev("tab='today';render()");
    $q('.todo [data-act="databackup"]').click();
    ok("quota error: Yedek al goes to Data and backup, the backup screen includes the in-memory (unsaved) state",ev("tab")==="settings-data"&&(()=>{$q("#bkpw").value="mavi-bulut-77";$q("#bkpw2").value="mavi-bulut-77";return true})()&&(await (await ev("BackupLib.decrypt"))(JSON.parse(await ev("backupText()")),"mavi-bulut-77")).S.entries.filter(e=>e.type==="water").length===2);
    ev("closeSheet()");SP.setItem=set0;
    ev("save();render()");
    ok("once quota frees up the record is written and the warning goes",!v().includes("kaydedilemedi")&&JSON.parse(w.localStorage.getItem("nw_state")).entries.length===2);
    ev("S.entries=[];save();render()");
  }
  { // no crash when the exact-alarm permission is refused, the user is told, rescheduled after permission
    const P=w.Capacitor.Plugins,old=P.LocalNotifications;let ex="denied",n=0;
    P.LocalNotifications={checkPermissions:async()=>({display:"granted"}),checkExactNotificationSetting:async()=>({exact_alarm:ex}),changeExactNotificationSetting:async()=>{ex="granted";return {exact_alarm:ex}},getPending:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async()=>{n++}};
    ev("S.settings.medOn=true;S.meds=[{id:1,n:'İlaç',t:['08:00']}];tab='today';render()");
    const r=await ev("scheduleReminders()");
    ok("no exact-alarm permission: alarms are still scheduled, a warning in Today and Reminders",r==="ok"&&n===1&&$q("#view").textContent.includes("İlaç alarmı birkaç dakika gecikebilir")&&(ev("tab='settings-reminders';render()"),$q("#view").textContent.includes("Tam saat alarm izni kapalı")),r);
    $q('[data-act="fullalarm"]').click();await flush();
    ok("once permission is granted the warning goes and reminders are rescheduled",n===2&&!$q("#view").textContent.includes("Tam saat alarm izni kapalı"),n);
    P.LocalNotifications=old;ev("S.settings.medOn=false;S.meds=[];tab='today';render()");
  }
  }
  { // permissions centre: one list, one row in Today when two or more are missing, direct settings screens
    const P=w.Capacitor.Plugins,oldLN=P.LocalNotifications,oldDH=P.DeviceHelp,opened=[];let notif="denied",ex="denied";
    P.LocalNotifications={checkPermissions:async()=>({display:notif}),requestPermissions:async()=>({display:notif}),checkExactNotificationSetting:async()=>({exact_alarm:ex}),changeExactNotificationSetting:async()=>{ex="granted";return {exact_alarm:ex}},getPending:async()=>({notifications:[]}),getDeliveredNotifications:async()=>({notifications:[]}),cancel:async()=>{},registerActionTypes:async()=>{},schedule:async()=>{}};
    P.DeviceHelp={info:async()=>({manufacturer:"samsung"}),openDetails:async()=>{opened.push("details");return {opened:"details"}},openBattery:async()=>{opened.push("battery");return {opened:"battery"}}};
    const q=s=>$q(s),txt=()=>q("#view").textContent;
    ev("S.settings.medOn=true;S.meds=[{id:1,n:'İlaç',t:['08:00']}];oem='samsung';exactOk=false;fsiOk=true;S.settings.stepsOn=false;tab='today';render()");
    await ev("pmRefresh()");
    ok("permissions: notifications denied and exact alarm off give one 'İzinler eksik' row instead of separate rows",txt().includes("İzinler eksik")&&txt().includes("Bildirimler, Tam saatli alarm")&&!txt().includes("İlaç alarmı birkaç dakika gecikebilir"),txt().slice(0,300));
    ev("tab='settings';render()");
    ok("permissions: Settings home has an İzinler row with the missing count",txt().includes("İzinler")&&txt().includes("2 eksik"));
    ev("tab='today';render()");q('[data-pm="open"]').click();await flush();
    ok("permissions: the sheet lists each item with its state and a button; a wizard button shows the missing count",q("#sheet").textContent.includes("Sırayla ayarla (2 eksik)")&&q("#sheet").textContent.includes("Tam saatli alarm")&&!!q('[data-pm="go:notif"]')&&!!q('[data-pm="go:exact"]')&&!!q('[data-pm="go:bat"]'));
    q('[data-pm="next"]').click();await flush();
    ok("permissions: Sırayla ayarla asks for notifications and, as the system dialog is refused, opens the app's own settings screen",opened.join()==="details",opened);
    notif="granted";await ev("pmRefresh()");
    ok("permissions: after returning with notifications granted one missing item is left and the sheet refreshed itself",q("#sheet").textContent.includes("Sırayla ayarla (1 eksik)"));
    q('[data-pm="go:exact"]').click();await flush();await ev("pmRefresh()");
    ok("permissions: exact alarm granted from the list: nothing is missing",q("#sheet").textContent.includes("Gereken izinlerin hepsi tamam")&&ev("pmMissing().length")===0);
    q('[data-pm="go:bat"]').click();await flush();
    ok("permissions: the battery button opens the battery screen directly",opened[opened.length-1]==="battery");
    q('#sheet [data-pm="close"]').click();
    ev("exactOk=false;tab='today';render()");
    ok("permissions: a single missing item keeps its own explanatory row (no summary row)",txt().includes("İlaç alarmı birkaç dakika gecikebilir")&&!txt().includes("İzinler eksik"));
    P.LocalNotifications=oldLN;P.DeviceHelp=oldDH;ev("exactOk=true;oem='';pmNotif=null;S.settings.medOn=false;S.meds=[];tab='today';render()");
  }
  { // "Yakınıma haber ver": the messaging app opens with the number and a short text, nothing is sent by the app
    const P=w.Capacitor.Plugins,oldDH=P.DeviceHelp,sent=[];
    P.DeviceHelp={info:async()=>({manufacturer:"samsung"}),sms:async o=>{sent.push(o);return {opened:"sms"}}};
    const q=s=>$q(s);
    ev("S.settings.medOn=true;S.settings.medNear='';S.meds=[{id:1,n:'Gizli İlaç',t:['00:01'],d:'5 mg',on:true}];S.medLog=[];tab='today';render()");
    ok("near: without a saved number the late dose row has no 'Yakınıma haber ver' button",!q('[data-md="nearsend"]'));
    ev("tab='settings-modules';render()");q('[data-md="near"]').click();
    q("#mdnear").value="12ab";q('[data-md="nearsave"]').click();
    ok("near: a bad number is refused with the reason, nothing is saved",ev("S.settings.medNear")===""&&q("#mdnearerr").textContent.includes("7-15 rakam"));
    q("#mdnear").value="+90 (555) 111-22 33";q('[data-md="nearsave"]').click();
    ok("near: a valid number is cleaned to digits and saved",ev("S.settings.medNear")==="+905551112233");
    ev("tab='today';render()");
    ok("near: the late dose row now has the button",!!q('[data-md="nearsend"]'));
    q('[data-md="nearsend"]').click();await flush();
    ok("near: the messaging app is opened with the number and a text that names no medicine and no dose",sent.length===1&&sent[0].to==="+905551112233"&&!/Gizli|5 mg/.test(sent[0].body)&&sent[0].body.length>10,sent);
    ev("tab='settings-modules';render()");q('[data-md="near"]').click();q('[data-md="nearclear"]').click();
    ok("near: the number can be deleted; a broken stored number is dropped on load",ev("S.settings.medNear")===""&&ev("cleanSettings({medNear:'abc'}).medNear")===""&&ev("cleanSettings({medNear:'+905551112233'}).medNear")==="+905551112233");
    P.DeviceHelp=oldDH;ev("S.settings.medOn=false;S.meds=[];tab='today';render()");
  }
  reset();
  w.eval("oem='xiaomi';S.settings.oemDone=false");
  ok("on Xiaomi a settings warning appears",ev("viewToday()").includes("Hatırlatmalar için bir kez ayar"));
  w.eval("S.settings.oemDone=true");
  ok("when Yaptım is pressed the warning goes",!ev("viewToday()").includes("Hatırlatmalar için bir kez ayar"));
  w.eval("oem='google';S.settings.oemDone=false");
  ok("outside Xiaomi no warning appears",!ev("viewToday()").includes("Hatırlatmalar için bir kez ayar"));
  ev("sheetFood()");
  const fq=w.document.querySelector("#fq");fq.value="mercimek";fq.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("food is searched in the meal window",w.document.querySelector("#flist").innerHTML.includes("Mercimek çorbası")&&w.document.querySelector("#flist [data-food]"));
  ev("S.chat=[];S.cid=1;S.myFoods=[];cReply({reply:'~280 kcal',log:[],food:{name:'1 dilim pizza',kcal:280,protein:12}})");
  const fm=ev("S.chat.find(m=>m.card&&m.card.kind==='food')");
  ok("an AI food estimate becomes a card",fm&&fm.card.f.k===280,fm);
  ev(`cClick("addfood:${fm.id}",document.body)`);
  ok("Listeme ekle saves the food",ev("S.myFoods.length")===1&&ev("S.myFoods[0].n")==="1 dilim pizza");
  ev("cClick('addfood:'+S.chat.find(m=>m.card&&m.card.kind==='food').id,document.body)");
  ok("the same food is not added twice",ev("S.myFoods.length")===1);
  ev("sheetFood()");const fq2=w.document.querySelector("#fq");fq2.value="pizza";fq2.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("my food comes first in search",w.document.querySelector("#flist .prow").innerHTML.includes("1 dilim pizza"));
  ev("sheetPortion(0)");w.document.querySelector("#fqty").value="2";ev("foodPreview()");
  ok("my own food is computed by portion",w.document.querySelector("#fprev").textContent.startsWith("560 kcal"),w.document.querySelector("#fprev").textContent);
  ev("goNutrition()");
  ok("my own food becomes a record; if macros are missing carbs/fat are not written",ev("S.entries.some(e=>e.v===560&&e.p===24&&e.c===undefined)")&&!ev("viewToday()").includes("Karbonhidrat"));
  ok("the food list is kept in a backup",ev("cleanMyFoods(JSON.parse(JSON.stringify(S)).myFoods).length")===1);
  ev("sheetPortion(0)");ev("goMyDelete()");
  ok("delete from my list works",ev("S.myFoods.length")===0);
  ev("S.chat=[];S.cid=1;cReply({reply:'x',log:[{type:'food',text:'ev yapımı kek',kcal:300,protein:5}]})");
  ev("cClick('ok:'+S.chat.find(m=>m.card&&m.card.kind==='log').id,{closest:()=>document.body})");
  ev("cClick('savefood:'+S.chat.find(m=>m.card&&m.card.kind==='log').id,document.body)");
  ok("a saved meal enters the list",ev("S.myFoods.some(m=>m.n==='ev yapımı kek'&&m.k===300)"));
  ev("S.myFoods=[]");
  { // add to meal from chat: card, meal picker, row removal/correction, single button, repeat block, Undo
    const q=s=>$q(s),card=()=>ev("S.chat.find(m=>m.card&&m.card.kind==='log')"),cid=()=>card().id,n0=ev("S.entries.length");
    ev("S.chat=[];S.cid=1;tab='coach';cReply({reply:'Afiyet olsun',log:[{type:'food',text:'Menemen <b>x</b>',g:250,kcal:300,protein:15,carbs:10,fat:22,meal:'dinner'},{type:'food',text:'Simit',g:100,kcal:900,protein:9,carbs:55,fat:4},{type:'food',text:'Çay',kcal:5}]});render()");
    const v=()=>q("#view").innerHTML;
    ok("card: title 'Öğüne ekle', escaped name, grams and macros, total, meal chip selected from the block, a single 'Günlüğe ekle'",v().includes("Öğüne ekle")&&v().includes("Menemen &lt;b&gt;x&lt;/b&gt;")&&v().includes("250 g · P 15 · K 10 · Y 22")&&v().includes("Toplam ~1205 kcal")&&q(`[data-c="lml:${cid()}:dinner"]`).getAttribute("aria-pressed")==="true"&&q(`[data-c="ok:${cid()}"]`).textContent==="Günlüğe ekle");
    ok("a warning on a row whose calories do not match its macros",v().includes("Kalori makrolarla tutmuyor"));
    q(`[data-c="lml:${cid()}:lunch"]`).click();q('[data-ck="0"]').value="320";q(`[data-c="lrm:${cid()}:1"]`).click();
    ok("the meal changes, a row is removed, a calorie correction made before the removal is kept",card().card.meal==="lunch"&&card().card.items.length===2&&card().card.items[0].kcal===320);
    q(`[data-c="ok:${cid()}"]`).click();
    const added=ev("JSON.stringify(S.entries.slice(-2).map(e=>[e.type,e.text,e.v,e.p,e.c,e.f,e.meal,e.day===dayKey()]))");
    ok("one tap to the log: the existing record structure (v, p, c, f, meal), the chosen meal",ev("S.entries.length")===n0+2&&added==='[["food","Menemen <b>x</b>",320,15,10,22,"lunch",true],["food","Çay",5,null,null,null,"lunch",true]]',added);
    ev(`cClick('ok:${cid()}',document.body)`);
    ok("the same card cannot be added again (Kaydedildi state)",ev("S.entries.length")===n0+2&&card().card.state==="ok"&&!q(`[data-c="ok:${cid()}"]`));
    q("#toast button").click();
    ok("Undo deletes the records and reopens the card",ev("S.entries.length")===n0&&card().card.state==="pending");
    ok("card state and meal come back from a backup",ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))).chat.find(m=>m.card&&m.card.kind==='log').card.meal)")==='"lunch"');
    ev("S.chat=[];S.cid=1;cReply({reply:'Tahmin',food:{name:'1 dilim pizza',kcal:280,protein:12}});render()");
    const fid=ev("S.chat.find(m=>m.card&&m.card.kind==='food').id");q(`[data-c="fooddiary:${fid}"]`).click();
    ok("the calorie question card also adds to the log with one tap, once",ev("S.entries.length")===n0+1&&ev("S.entries[S.entries.length-1].text")==="1 dilim pizza"&&!q(`[data-c="fooddiary:${fid}"]`)&&q("#view").textContent.includes("Günlüğe eklendi"));
    ev("S.entries=S.entries.slice(0,"+n0+");S.chat=[];render()");
    // exercise: "yarım saat cross yaptım"
    const sk=()=>ev("S.chat.find(m=>m.card&&m.card.kind==='log')");
    ev("window.__keep=JSON.stringify(S.entries)");
    ev("S.entries=S.entries.filter(e=>e.type!=='weight');S.chat=[];S.cid=1;cReply({reply:'Harika',log:[{type:'exercise',min:30,name:'Cross',kcal:900}]});render()");
    ok("without weight the Coach's exercise estimate is capped at 15 kcal per minute",q("#view").textContent.includes("30 dk · ~450 kcal"));
    const nk=ev("S.entries.length");ev("add('weight',80,'',dayKey());render()");
    ok("exercise card: 'Egzersizi ekle', calories by weight and MET (cross 8 MET, 80 kg, 30 min = net 280), a warning for a deviating Coach estimate",q("#view").textContent.includes("Egzersizi ekle")&&q("#view").textContent.includes("30 dk · ~280 kcal")&&q("#view").textContent.includes("Rehber ~900 kcal dedi")&&q(`[data-c="ok:${sk().id}"]`).textContent==="Egzersizi ekle");
    q(`[data-c="ok:${sk().id}"]`).click();ev(`cClick('ok:${sk().id}',document.body)`);
    const se=ev("JSON.stringify(S.entries.filter(e=>e.type==='exercise').slice(-1).map(e=>[e.v,e.text,e.kcal,e.day===dayKey()]))");
    ok("one tap writes to the existing sport record (duration, name, calories), once; shows on Today",se==='[[30,"Cross",280,true]]'&&ev("S.entries.length")===nk+2&&ev("S.entries.filter(e=>e.type==='exercise'&&e.text==='Cross').length")===1&&ev("viewToday()").includes("Cross"),se);
    ok("exercise calories come back from a backup",ev("cleanEntries(JSON.parse(JSON.stringify(S.entries))).out.some(e=>e.type==='exercise'&&e.kcal===280)"));
    ev("S.entries=JSON.parse(window.__keep);S.chat=[];tab='today';render()");
  }
  ev("sheetFood()");const fq3=w.document.querySelector("#fq");fq3.value="ev yapımı mantı";fq3.dispatchEvent(new w.Event("input",{bubbles:true}));
  ok("for a food not in the list 'Rehber'e sor' appears",w.document.querySelector("#flist [data-c=askfood]")&&w.document.querySelector("#flist").innerHTML.includes("ev yapımı mantı"));
  ev("S.chat=[];cClick('askfood',document.body)");
  ok("'Rehber'e sor' sends the message",ev("S.chat.some(m=>m.role==='user'&&m.text.includes('ev yapımı mantı kaç kalori'))")&&ev("tab")==="coach");
  ev("tab='today';S.chat=[]");
  let stepGranted=false,stepSnap=0,stepSteps=4321,stepHist={"2026-09-30":9000};
  w.Capacitor.Plugins.StepCounter={isAvailable:async()=>({available:true,granted:stepGranted}),requestAccess:async()=>{stepGranted=true;return {granted:true}},start:async()=>{},read:async()=>({steps:stepSteps,history:stepHist,snapAt:stepSnap})};
  ev("S.entries=[];S.settings.stepsOn=false;S.settings.stepsAsked=false");
  ok("the step counter suggestion shows",ev("viewToday()").includes("data-act=\"stepsopen\""));
  await ev("stepsOpen()");
  ok("once permission is granted the step counter turns on and today's steps are written",ev("S.settings.stepsOn")===true&&ev("stepToday")===4321&&ev("S.entries.some(e=>e.type==='steps'&&e.day===dayKey()&&e.v===4321)"));
  ok("a finished day's steps are written to history",ev("S.entries.some(e=>e.type==='steps'&&e.day==='2026-09-30'&&e.v===9000)"));
  ok("the step ring shows on Today",ev("viewToday()").includes("Adım")&&ev("viewToday()").includes("4.321"));
  stepSteps=5000;await ev("stepsSync()");
  ok("the same day updates a single record",ev("S.entries.filter(e=>e.type==='steps'&&e.day===dayKey()).length")===1&&ev("S.entries.find(e=>e.type==='steps'&&e.day===dayKey()).v")===5000);
  { // live steps while open
    const doc=w.document,vis=h=>Object.defineProperty(doc,"hidden",{configurable:true,get:()=>h}),P=w.Capacitor.Plugins.StepCounter,r0=P.read;
    let reads=0;P.read=async()=>{reads++;return r0()};
    ev("tab='today';render()");vis(false);
    stepSteps=5020;await ev("stepsTick()");
    ok("when steps increase while open the Today card updates itself, interval <=5 s",$q('#view .rbtn[data-tab="steps"]').textContent.includes("5.020")&&ev("STEP_POLL")<=5000);
    ev("tab='steps';render()");stepSteps=5040;await ev("stepsTick()");
    ok("the Steps report updates while open too",$q("#view").textContent.includes("5.040"));
    ev("tab='today';render()");const v0=$q("#view").firstElementChild;await ev("stepsTick()");
    ok("no redraw if the value does not change",$q("#view").firstElementChild===v0);
    reads=0;const t1=ev("stepsTick()");ev("stepsTick()");await t1;
    ok("a second read does not start before the previous one finishes",reads===1);
    vis(true);stepSteps=5060;await ev("stepsTick()");
    ok("no read while the page is hidden",reads===1&&!$q('#view .rbtn[data-tab="steps"]').textContent.includes("5.060"));
    delete doc.hidden;P.read=r0;stepSteps=5000;await ev("stepsSync()");
  }
  ok("step records do not show in the day list and series",!ev("viewToday()").includes("class=\"del\"")&&ev("streak()")===0);
  ok("backup cleaning keeps the step record",ev("cleanEntries(S.entries).out.filter(e=>e.type==='steps').length")===2);
  ev("window.__se=[S.entries,S.settings.stepsFrom];S.settings.stepsFrom='2000-01-01';S.entries=[{id:1,day:dayKey(),time:'00:00',type:'steps',v:82000,text:''}]");
  ok("when the counter resets, today's inflated step record goes (a 0-step record is invalid: it must not warn on reopening), with no record no new one is opened for 0",ev("setSteps(dayKey(),0)")===true&&ev("S.entries.some(e=>e.type==='steps')")===false&&ev("buildState(JSON.parse(JSON.stringify(S))).drop")===0&&ev("S.entries=[],setSteps(dayKey(),0)")===false&&ev("S.entries.length")===0);
  ev("[S.entries,S.settings.stepsFrom]=window.__se");
  ev("window.__mv=[S.moves,S.settings.motionOn];S.settings.motionOn=true;S.moves=[{day:dayKey(),t0:'11:56',min:5,km:0.2,kmh:2.3,kcal:20,k:'w'},{day:dayKey(),t0:'12:29',min:6,km:0.3,kmh:2.8,kcal:26,k:'w'}]");
  const mh=(()=>{const d=w.document.createElement("div");d.innerHTML=ev("motionCard()");return d})();
  ok("movements: the day total shows in the summary, individual movements open in a closed details on tap",mh.querySelectorAll("details.acc").length===1&&/Bugün/.test(mh.querySelector("summary").textContent)&&/11 dk/.test(mh.querySelector("summary").textContent)&&/0,5 km/.test(mh.querySelector("summary").textContent)&&!mh.querySelector("details").open&&mh.querySelectorAll("details .row").length===2);
  ev("[S.moves,S.settings.motionOn]=window.__mv");
  ev("window.__qe=S.entries;S.entries=[{id:1,day:keyOff(-1),time:'18:00',type:'exercise',v:45,text:'Cross bisiklet',kcal:300},{id:2,day:dayKey(),time:'09:00',type:'exercise',v:30,text:'Salon, Üst',wid:5}]");
  const qh=ev("gQuickHtml()");
  ok("gym: a sport not tied to a workout (a bicycle added from the Coach) is in the 'Diğer sporlar' list, the workout record (wid) is not in the list",/Cross bisiklet/.test(qh)&&/45 dk · 300 kcal/.test(qh)&&!/Salon, Üst/.test(qh)&&ev("S.entries=[],gQuickHtml()")==="");
  ev("S.entries=window.__qe");
  ok("the medication name is hidden in notifications by default; if the user turned it on the choice is kept, the notification text follows it",ev("buildState({}).S.settings.medShowName")===false&&ev("buildState({settings:{medShowName:true}}).S.settings.medShowName")===true&&ev("buildState({settings:{medShowName:false}}).S.settings.medShowName")===false);
  ok("an impossible step value is dropped",ev("cleanEntries([{type:'steps',day:'2026-01-01',v:999999}]).out.length")===0&&ev("setSteps('2026-01-01',0)")===false);
  ok("Trend table has a steps column",ev("viewTrend()").includes("<th>Adım</th>"));
  ok("on Today the steps card leads to the report",ev("viewToday()").includes('data-tab="steps"')&&!ev("viewToday()").includes("r4"));
  ev("S.settings.heightCm=170;S.settings.stepsOn=true;tab='steps';render()");
  const as=w.document.querySelector("#view").textContent;
  ok("steps report: steps, average, distance and note show",as.includes("5.000")&&as.includes("7 gün ortalaması")&&as.includes("Yaklaşık mesafe")&&as.includes("kalori hedefine eklenmez"),as.slice(0,200));
  ok("steps report: 14 bars are drawn",w.document.querySelectorAll("#view svg.bars rect").length===14);
  { // range picker, streak, best day, average
    ev("window.__e=structuredClone(S.entries);window.__n=S.nextId;S.entries=S.entries.filter(e=>e.type!=='steps');S.settings.stepGoal=8000");
    const bars=()=>w.document.querySelectorAll("#view svg.bars rect").length,txt=()=>w.document.querySelector("#view").textContent;
    ev("tab='steps';stepRange=14;render()");
    ok("with no step records an empty state instead of a chart, average and streak dash/0",bars()===0&&txt().includes("Bu aralıkta adım kaydı yok")&&txt().includes("0 gün"));
    for(const [i,v] of [[0,9000],[1,9000],[2,3000],[3,9000],[4,10000],[5,12000]])ev(`add('steps',${v},'',keyOff(-${i}))`);
    ev("add('steps',500,'manual',keyOff(-3))");
    ev("tab='steps';render()");
    ok("streak counts back from today: today+yesterday above target, 3rd day below -> 2",ev("Algo.stepStats([1,9000,9000],8000).streak")===2&&txt().includes("Hedef serisi")&&/Hedef serisi2 gün/.test(txt()));
    ok("a hand-entered step is counted once: 9,500 three days ago, best day 12,000 (5 days ago)",ev("sum('steps',keyOff(-3),keyOff(-3))")===9500&&txt().includes("12.000"));
    ok("the 7-day average uses only recorded days: (9000+9000+3000+9500+10000+12000)/6",txt().includes("8.750"));
    const click=n=>{$q(`[data-sr="${n}"]`).click()};
    click(7);ok("7 days: 7 bars, Pzt..Paz abbreviations",bars()===7&&/Paz|Pzt|Sal|Çar|Per|Cum|Cmt/.test(w.document.querySelector("#view svg.bars").textContent));
    click(30);ok("30 days: 30 bars, no checkmark",bars()===30&&!w.document.querySelector("#view svg.bars").textContent.includes("✓"));
    click(0);ok("This month: as many bars as the day of the month",bars()===ev("new Date().getDate()")&&$q('[data-sr="0"]').getAttribute("aria-pressed")==="true");
    ev("S.entries=window.__e;S.nextId=window.__n;stepRange=14;S.settings.stepGoal=8000;render()");
  }
  ev("S.settings.heightCm=0;render()");
  ok("without a height the distance is hidden",!w.document.querySelector("#view").textContent.includes("Yaklaşık mesafe")&&w.document.querySelector("#view").textContent.includes("boyunu gir"));
  ev("tab='steps';render()");
  ok("the Steps screen has an add-by-hand button",$q('[data-act="stepsadd"]')!==null);
  ev("sheetSteps()");$q("#fv").value="0";$q('[data-go="steps"]').click();
  ok("an invalid hand-entered step is rejected",ev("S.entries.some(e=>e.text==='manual')")===false);
  $q("#fv").value="100001";$q('[data-go="steps"]').click();
  ok("a hand-entered step over 100,000 is rejected",ev("S.entries.some(e=>e.text==='manual')")===false);
  $q("#fv").value="1500";$q('[data-go="steps"]').click();
  stepSteps=5200;await ev("stepsSync()");
  ok("a hand-entered step is a separate record, a sensor sync does not overwrite it, the day total is sensor + manual",ev("S.entries.filter(e=>e.type==='steps'&&e.day===dayKey()).length")===2&&ev("S.entries.find(e=>e.text==='manual').v")===1500&&ev("sum('steps',dayKey(),dayKey())")===6700);
  ok("the step ring shows sensor + manual",ev("viewSteps()").includes("6.700"));
  ev("tab='today'");
  ok("the Today steps card shows sensor + manual",ev("stepCard()").includes("6.700"));
  ev("tab='steps';render()");
  ok("a hand-added step is listed on the Steps screen",ev("viewSteps()").includes("+1.500"));
  $q('#view [data-del="'+ev("S.entries.find(e=>e.text==='manual').id")+'"]').click();
  ok("a hand-entered step is deleted, the day returns to the sensor value",ev("sum('steps',dayKey(),dayKey())")===5200&&ev("stepsShown()")===5200);
  ev("add('steps',700,'manual',keyOff(-20));tab='steps';render()");
  const oldM=ev("S.entries.find(e=>e.text==='manual').id"),oldB=()=>$q('#view [data-del="'+oldM+'"]');
  ok("a hand-entered step older than 14 days is listed on the Steps screen and can be deleted",!!oldB()&&(oldB().click(),!ev("S.entries.some(e=>e.text==='manual')")));
  ev("tab='today';render()");
  const warn=()=>ev("viewToday()").includes('data-act="stepshide"');
  ev("S.entries=[];S.settings.stepsOn=true;S.settings.stepWarnDay='';oem='google'");stepHist={};
  stepSnap=Date.now()-3*36e5;await ev("stepsSync()");
  ok("if the nightly close is recent the counting-stopped card does not appear",!warn());
  stepSnap=Date.now()-27*36e5;await ev("stepsSync()");
  ok("if the nightly close is older than 26 hours the card appears",warn());
  let batt=0;w.Capacitor.Plugins.DeviceHelp.openBattery=async()=>{batt++;return {opened:"battery"}};
  $q('[data-act="stepsfix"]')||ev("tab='today';render()");
  w.document.body.insertAdjacentHTML("beforeend",'<button id="tduz" data-act="stepsfix"></button>');$q("#tduz").click();
  ok("outside Xiaomi Ayarla opens the battery setting",batt===1);
  ev("oem='xiaomi'");$q("#tduz").click();
  ok("on Xiaomi Ayarla opens the existing settings page",$q("#sheet").textContent.includes("Hatırlatmalar için bir kez ayar")&&batt===1);
  ev("closeSheet();render()");$q('[data-act="stepshide"]').click();
  ok("Kapat hides it for that day and writes it persistently",!warn()&&ev("S.settings.stepWarnDay")===ev("dayKey()")&&ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).stepWarnDay")===ev("dayKey()"));
  ok("a junk stepWarnDay value is dropped, empty in an old backup",ev("cleanSettings({stepWarnDay:'dün'}).stepWarnDay")===""&&ev("cleanSettings({}).stepWarnDay")==="");
  ev("S.settings.stepWarnDay=''");stepSnap=0;await ev("stepsSync()");
  ok("without snapAt (fresh install) and with empty history the card does not appear",!warn());
  ev("for(let i=2;i<=8;i++)add('steps',5000,'',keyOff(-i))");
  ok("if yesterday had 0 steps and the previous 7-day average is above 1000 the card appears",warn());
  ev("add('steps',3000,'',keyOff(-1))");
  ok("if yesterday has steps the card does not appear",!warn());
  ev("S.entries=S.entries.filter(e=>e.day!==keyOff(-1));stepsRead=false");
  ok("at startup the counting-stopped card does not appear before the first sensor read finishes",!warn());
  await ev("stepsSync()");
  ok("the card appears after the first read finishes",warn());
  ev("oem='google'");
  ev("S.entries=[];S.settings.stepsOn=false;S.nextId=1");
  ev("add('weight',80,'',keyOff(-1))");
  ev("sheetWeight()");w.document.querySelector("#fv").value="90";ev("goWeight()");
  ok("a difference of 3 kg or more shows an orange warning and 'Yine de kaydet' and does not save",ev("weights()[dayKey()]")===undefined&&w.document.querySelector("#kwarn .banner").textContent.includes("fark var")&&w.document.querySelector('#kwarn [data-go="weight"]').textContent==="Yine de kaydet");
  ev("goWeight()");
  ok("if the same value is confirmed a second time it is saved",ev("weights()[dayKey()]")===90);
  ev("S.entries=[]");ev("add('weight',80,'',keyOff(-1))");ev("sheetWeight()");w.document.querySelector("#fv").value="82,5";ev("goWeight()");
  ok("a small difference is saved without a warning",ev("weights()[dayKey()]")===82.5);
  { // weight entry
    ev("S.entries=[];add('weight',80,'',keyOff(-1));sheetWeight()");
    $q("#fv").focus();
    ok("in weight entry the last weigh-in comes filled and all is selected on focus",$q("#fv").value==="80,0"&&$q("#fv").selectionStart===0&&$q("#fv").selectionEnd===4);
    $q("#fv").value="80,085";ev("goWeight()");
    ok("an entry typed at the end of the old value (80,085) is rejected, not saved",$q("#kerr").textContent.includes("kg olarak")&&ev("weights()[dayKey()]")===undefined);
    $q("#fv").value="80,0";
    $q('[data-kd="1"]').click();$q('[data-kd="1"]').click();
    ok("+0.1 twice: 80.2",$q("#fv").value==="80,2",$q("#fv").value);
    $q('[data-kd="-1"]').click();$q('[data-kd="-1"]').click();$q('[data-kd="-1"]').click();
    ok("-0.1 three times: 79.9 (no floating-point error)",$q("#fv").value==="79,9",$q("#fv").value);
    $q("#fv").value="77";ev("goWeight()");
    ok("an exact 3.0 kg difference warns",ev("weights()[dayKey()]")===undefined&&!!$q("#kwarn .banner"));
    $q('#kwarn [data-go="weight"]').click();
    ok("'Yine de kaydet' saves",ev("weights()[dayKey()]")===77);
    ev("S.entries=[];add('weight',80,'',keyOff(-1));sheetWeight()");$q("#fv").value="82,9";ev("goWeight()");
    ok("a 2.9 kg difference is saved without a warning",ev("weights()[dayKey()]")===82.9);
    ev("S.entries=[];sheetWeight()");
    ok("with no weigh-in the field comes empty",$q("#fv").value==="");ev("closeSheet()");
  }
  { // touch targets and under-field errors
    const css=html.match(/<style>([\s\S]*?)<\/style>/)[1],rule=sel=>{const i=css.indexOf("\n"+sel+"{")>=0?css.indexOf("\n"+sel+"{")+1:css.indexOf("}"+sel+"{")+1;return i>0?css.slice(i+sel.length+1,css.indexOf("}",i)):""};
    ok("touch targets: general .del 44x44, .chip, .seg, toast button, fields at least 44 px",/width:44px;height:44px/.test(rule(".del"))&&/min-height:44px/.test(rule(".chip"))&&/min-width:44px/.test(rule(".chip"))&&/min-height:44px/.test(rule(".seg button"))&&/min-height:4[4-9]px/.test(rule("#toast button"))&&/height:44px/.test(rule(".sw input"))&&/min-height:44px/.test(rule("input.in,select.in,.chip>button")),[rule(".del"),rule(".chip"),rule(".sw input")]);
    ok("delete X buttons outside Today are .del too (44 px)",ev("hbRow('x','fdel:1')").includes('class="del"')&&ev("S.mealTpl=[{id:1,n:'K',items:[{text:'a',v:1}]}];favHtml()").includes('class="del" data-tpd="0"'));
    ev("S.mealTpl=[];toast('');sheetWeight()");$q("#fv").value="abc";ev("goWeight()");
    ok("the weight error is under the field, not in the toast",$q("#kerr").textContent.includes("kg olarak")&&!$q("#tmsg").textContent.includes("kg olarak")&&$q("#sheet").classList.contains("on"));
    ev("sheetFood()");$q("#ft").value="";$q("#fv").value="";ev("goFood()");
    ok("the food error is under the field",$q("#yerr").textContent.includes("adını")&&!$q("#tmsg").textContent.includes("adını"));
    $q("#fv").value="30000";ev("goFood()");
    ok("the excessive calorie error is under the field",$q("#yerr").textContent.includes("çok yüksek"));
    ev("sheetPortion(0,FOODS[0])");$q("#fqty").value="0";ev("goNutrition()");
    ok("the portion error is under the field",$q("#berr").textContent.includes("0,1 ile 20")&&!$q("#tmsg").textContent.includes("0,1 ile 20"));
    ev("closeSheet()");
  }
  ev("S.entries=[];add('food',200,'Menemen',keyOff(-1));add('food',90,'Ekmek',keyOff(-1))");
  ev("sheetFood()");
  ok("the repeat-yesterday button shows",w.document.querySelector('[data-act="yesterday"]')!==null);
  ev("repeatYesterday()");
  ok("yesterday's meals are copied to today",ev("of('food',dayKey()).length")===2&&ev("sum('food',dayKey(),dayKey())")===290);
  ev("S.entries=[];{const e=add('food',300,'Tavuk',keyOff(-1));e.p=30;e.c=5;e.f=12}repeatYesterday()");
  ok("repeat-yesterday carries macros, undo deletes",ev("JSON.stringify(of('food',dayKey()).map(e=>[e.p,e.c,e.f]))")==="[[30,5,12]]"&&(w.document.querySelector("#tundo").click(),ev("of('food',dayKey()).length")===0));
  ev("S.entries=[];S.favFoods=[];{const e=add('food',300,'Tavuk',keyOff(-2));e.p=30;e.c=5;e.f=12}sheetFood()");
  ok("recent foods are listed, no chips of the old Sık yediklerin",ev("recList.length")===1&&$q("[data-rc='0']")!==null&&$q("[data-fav]")===null);
  $q("[data-rc='0']").click();
  ok("tapping a recent food adds it to the selected day with macros",macros()==="[[300,30,5,12]]",macros());
  $q("#tundo").click();
  ok("undoing an add from recent deletes it",ev("of('food',dayKey()).length")===0);
  ev("sheetFood()");$q("[data-fva='0']").click();
  ok("the star adds to favorites, survives a reload",ev("S.favFoods.length")===1&&ev("cleanHealthState(JSON.parse(JSON.stringify(S))).favFoods[0].p")===30&&$q("[data-fv='0']")!==null&&$q("[data-fva='0']").disabled);
  ev("S.entries=[]");ev("sheetFood()");$q("[data-fv='0']").click();
  ok("a favorite stays even if the record is deleted, tapping adds it with macros",macros()==="[[300,30,5,12]]"&&ev("S.favFoods.length")===1,macros());
  ev("sheetFood()");$q("[data-fvd='0']").click();
  ok("removed from favorites",ev("S.favFoods.length")===0);
  ok("an old backup (no favFoods) loads, a junk favFoods does not break other data",ev("cleanHealthState({}).favFoods.length")===0&&ev("cleanHealthState({favFoods:'x',meds:[]}).favFoods.length")===0);
  ev("S.entries=[];S.mealTpl=[];S.favFoods=[];{const e=add('food',155,'Yumurta');e.p=13}{const e=add('food',90,'Ekmek');e.c=40}");
  ok("the make-template button shows in the day list",ev("viewToday()").includes('data-act="tplnew"'));
  ev("sheetTpl()");$q("#tpn").value="Kahvaltım";$q('[data-go="tpl"]').click();
  ok("the template saves all items as value copies",ev("S.mealTpl.length")===1&&ev("S.mealTpl[0].items.length")===2&&ev("S.mealTpl[0].id")===1&&ev("S.mealTpl[0].items[0].p")===13);
  ev("sheetTpl()");$q("#tc0").checked=false;$q("#tpn").value="Tek";$q('[data-go="tpl"]').click();
  ok("an unmarked meal does not enter the template, the id increases",ev("S.mealTpl[1].items.length")===1&&ev("S.mealTpl[1].id")===2&&ev("S.mealTpl[1].items[0].text")==="Ekmek");
  ev("sheetTpl()");$q("#tpn").value="";$q('[data-go="tpl"]').click();
  ok("an unnamed template is not saved",ev("S.mealTpl.length")===2);
  ev("S.entries=[]");ev("sheetFood()");$q("[data-tp='0']").click();
  ok("a template chip adds all items with one tap",ev("of('food',dayKey()).length")===2&&macros()==="[[155,13,null,null],[90,null,40,null]]",macros());
  $q("#tundo").click();
  ok("a single undo deletes the whole template add",ev("of('food',dayKey()).length")===0);
  ok("the template survives a reload, an old backup (no mealTpl) loads empty",ev("cleanHealthState(JSON.parse(JSON.stringify(S))).mealTpl.length")===2&&ev("cleanHealthState({}).mealTpl.length")===0&&ev("cleanHealthState({mealTpl:7}).mealTpl.length")===0);
  ev("sheetFood()");$q("[data-tpd='0']").click();
  ok("the template is deleted",ev("S.mealTpl.length")===1&&ev("S.mealTpl[0].n")==="Tek");
  ev("S.entries=[]");ev("sheetFood()");
  ok("with no meal yesterday there is no button",w.document.querySelector('[data-act="yesterday"]')===null);
  let cancelled=[],sched1=[];const lnOld=w.Capacitor.Plugins.LocalNotifications;
  w.Capacitor.Plugins.LocalNotifications={checkExactNotificationSetting:async()=>({exact_alarm:"granted"}),checkPermissions:async()=>({display:"granted"}),requestPermissions:async()=>({display:"granted"}),getPending:async()=>({notifications:[]}),cancel:async o=>{cancelled=o.notifications.map(n=>n.id)},schedule:async o=>{sched1=o.notifications.map(n=>n.id)}};
  await ev("scheduleReminders()");
  ok("water reminders are scheduled before the water goal is met",sched1.includes(201)&&sched1.includes(301));
  ev("S.entries=[];add('water',S.settings.waterMl-S.settings.glass,'')");sched1=[];
  w.document.body.insertAdjacentHTML("beforeend",'<button id="tsu" data-act="water"></button>');w.document.querySelector("#tsu").click();
  await flush();
  ok("when the water goal is met notifications reschedule, today's water alarm is gone",sched1.length>0&&![200,300,400].some(i=>sched1.includes(i))&&sched1.includes(201),sched1.length);
  await ev("scheduleReminders()");
  ok("on rescheduling after the goal there is no water alarm for today, there is one for tomorrow",![200,300,400].some(i=>sched1.includes(i))&&sched1.includes(201));
  w.Capacitor.Plugins.LocalNotifications=lnOld;
  ev("S.entries=[]");
  ev("S.settings.stepsOn=false;S.entries=[]");
  const offJ=n=>({status:1,product:{code:"8690526010113",product_name:"Crax sticks",brands:"Eti",product_quantity:40,nutriments:n}});
  let fetched=0,resp=offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13});
  w.fetch=async()=>{fetched++;return {ok:true,json:async()=>resp}};
  ev("S.myFoods=[]");
  await ev("barcodeFind('8690526010113')");
  ok("barcode: a consistent product is saved automatically and the portion opens",ev("S.myFoods.length")===1&&ev("S.myFoods[0].src")==="off"&&ev("S.myFoods[0].b")==="8690526010113"&&w.document.querySelector("#fprev").textContent.startsWith("176 kcal"),[ev("S.myFoods"),w.document.querySelector("#fprev")&&w.document.querySelector("#fprev").textContent]);
  ok("barcode: the source text is Open Food Facts",w.document.querySelector("#sheet").textContent.includes("Open Food Facts"));
  await ev("barcodeFind('8690526010113')");
  ok("barcode: the second scan does not go to the internet",fetched===1,fetched);
  ev("S.myFoods=[]");
  resp=offJ({"energy-kcal_100g":150,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13});
  await ev("barcodeFind('8690526010113')");
  ok("barcode: an inconsistent product is not saved",ev("S.myFoods.length")===0&&w.document.querySelector("#fq")!==null);
  resp=offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70});
  await ev("barcodeFind('8690526010113')");
  ok("barcode: a product with missing values is used but not saved",ev("S.myFoods.length")===0&&w.document.querySelector("#fprev").textContent.startsWith("176 kcal"));
  ev("S.myFoods=Array.from({length:200},(_,i)=>({n:'Ürün '+i,k:100}))");
  resp=offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13});
  await ev("barcodeFind('8690526010113')");
  ok("barcode: with a full food list the product opens unsaved instead of crashing",ev("S.myFoods.length")===200&&w.document.querySelector("#fprev").textContent.startsWith("176 kcal")&&w.document.querySelector("#sheet").textContent.includes("listen dolu"));
  ev("S.myFoods=[]");
  w.fetch=async()=>{throw new Error("no network")};
  await ev("barcodeFind('8690526010113')");
  ok("barcode: without internet it gives an error",w.document.querySelector("#tmsg").textContent.includes("İnternete ulaşılamadı"));
  await ev("barcodeFind('123')");
  ok("barcode: an invalid code is rejected",w.document.querySelector("#tmsg").textContent.includes("ürün barkodu değil"));
  w.Capacitor.Plugins.BarcodeScanner={isGoogleBarcodeScannerModuleAvailable:async()=>({available:true}),scan:async o=>{w.scanOpts=o;return {barcodes:[{rawValue:"8690526010113"}]}}};
  w.fetch=async()=>({ok:true,json:async()=>offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13})});
  ev("S.myFoods=[]");await ev("barcodeRead()");
  ok("barcode: when the scanner reads, the product is found",ev("S.myFoods.length")===1&&w.scanOpts.formats.includes("EAN_13"));
  ev("sheetFood()");
  ok("the barcode button shows in Yemek ekle",w.document.querySelector("#sheet [data-act=barcode]")!==null);
  { // the tip of the day follows the local calendar day, not the UTC day
    ev("S.entries=[];add('weight',80,'');add('water',S.settings.waterMl,'');add('exercise',30,'Yürüyüş')");
    const tipAt=h=>{const back=require('./clock').at(w,h),t=ev("dailyTip()");back();return t};
    const t1=tipAt(1),t23=tipAt(23);
    ok("tip of the day: the same quote at 01:00 and 23:00 of one local day",t1===t23&&ev("QUOTES").includes(t1),[t1,t23]);
    ev("S.entries=[]");
  }
  { // fiber, sugar, sodium
    const T=w.document.querySelector.bind(w.document),day=ev("dayKey()");
    w.fetch=async()=>({ok:true,json:async()=>offJ({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,fiber_100g:4,sugars_100g:20,sodium_100g:0.4})});
    ev("S.myFoods=[];S.entries=[];S.settings.oemDone=true");await ev("barcodeFind('8690526010113')");
    ok("barcode: fiber/sugar/sodium enter myFoods, the preview shows them",ev("[S.myFoods[0].fb,S.myFoods[0].sg,S.myFoods[0].na].join()")==="4,20,400"&&/lif 1,6 g · şeker 8,0 g · sodyum 160,0 mg/.test(T("#fprev").textContent),T("#fprev").textContent);
    ev("goNutrition()");
    ok("they pass into the record in portion proportion and survive a reload",ev("JSON.stringify(cleanEntries(S.entries).out.map(e=>[e.fb,e.sg,e.na]))")==="[[1.6,8,160]]",ev("JSON.stringify(S.entries)"));
    ev("add('food',100,'makrosuz',dayKey())");
    ev("add('food',50,'tuzlu',dayKey()).na=100");
    ok("the Today row with a coverage note per field",/Lif <b>2<\/b> g \(1\/3\) · Şeker <b>8<\/b> g \(1\/3\) · Sodyum <b>260<\/b> mg \(2\/3\)/.test(ev("viewToday()")),ev("viewToday()").match(/Lif.{0,160}/));
    ev("S.entries=S.entries.filter(e=>!/Crax/.test(e.text))");
    ok("a field with no data is not shown as 0",(v=>/Sodyum <b>100<\/b> mg \(1\/2\)/.test(v)&&!/Lif <b>/.test(v)&&!/Şeker <b>/.test(v))(ev("viewToday()")),ev("viewToday()").match(/Sodyum.{0,80}/));
    ev("S.entries=S.entries.filter(e=>e.text==='makrosuz')");
    ok("if no meal has data the row is hidden",!ev("viewToday()").includes("öğünde veri var"));
    ev("S.entries=[];S.myFoods=[]");
    const r=ev("JSON.parse(JSON.stringify({entries:[{day:dayKey(),type:'food',v:100,text:'a',fb:'x',sg:-1,na:1e9,p:5},{day:dayKey(),type:'food',v:50,text:'b',fb:3}],myFoods:[{n:'Z',k:10,fb:500,sg:5,na:100}]}))");
    ev(`window.__r=${JSON.stringify(r)}`);
    ok("records with junk fields: p is kept, no fb/sg/na",ev("(o=>o[0].p===5&&o[0].fb===undefined&&o[0].sg===undefined&&o[0].na===undefined&&o[1].fb===3)(cleanEntries(__r.entries).out)"));
    ok("myFoods: out-of-range fiber is dropped, sugar/sodium stay; an old record (no fields) unchanged",ev("(m=>m.fb===undefined&&m.sg===5&&m.na===100)(cleanMyFoods(__r.myFoods)[0])&&cleanMyFoods([{n:'Y',k:5,p:1}])[0].p===1"));
    ev("S.myFoods=[];labelReview({food:{k:440,p:8.5,c:70,f:13,fb:3,sg:12,na:480}})");
    ok("on the label screen fiber/sugar/sodium come filled",T("#efb").value==="3"&&T("#esg").value==="12"&&T("#ena").value==="480");
    T("#en").value="Etiketli";T('[data-ocr="esave"]').click();
    ok("a label save writes fiber/sugar/sodium to myFoods",ev("[S.myFoods[0].fb,S.myFoods[0].sg,S.myFoods[0].na].join()")==="3,12,480",ev("S.myFoods"));
    { // an unknown barcode is attached to the next label saved from a photo
      ev("closeSheet();S.myFoods=[]");w.fetch=async()=>({ok:true,json:async()=>({status:0})});
      await ev("barcodeFind('8690526010113')");
      ok("unknown barcode: the manual form opens and the barcode waits for the label",w.document.querySelector("#fown")&&ev("pendingBarcode")==="8690526010113");
      ev("labelReview({food:{k:440,p:8.5,c:70,f:13}})");T("#en").value="Paket kraker";T('[data-ocr="esave"]').click();
      ok("the saved label carries the barcode, the wait is cleared, and the next scan finds it without the internet",ev("S.myFoods[0].b")==="8690526010113"&&ev("pendingBarcode")===""&&await (async()=>{let f=0;w.fetch=async()=>{f++;return {ok:true,json:async()=>({status:0})}};await ev("barcodeFind('8690526010113')");return f===0})());
      ev("closeSheet();S.myFoods=[]");w.fetch=async()=>({ok:true,json:async()=>({status:0})});
      await ev("barcodeFind('8690526010113')");ev("labelReview({food:{k:100}})");T('[data-ocr="close"]').click();
      ev("labelReview({food:{k:440,p:8.5,c:70,f:13}})");T("#en").value="Başka";T('[data-ocr="esave"]').click();
      ok("dismissing the label sheet clears the waiting barcode: an unrelated label gets no barcode",ev("S.myFoods[0].b")===undefined);
      ev("S.myFoods=[]");
      ev("Nutrition.putMy({n:'Süt',k:60,b:'11111111'});Nutrition.putMy({n:'süt',k:62,b:'22222222'})");
      ok("two different barcoded products with the same name are both kept (the second gets a suffix)",ev("S.myFoods.length")===2&&ev("S.myFoods.map(m=>m.n).sort().join()")==="Süt,süt (2)",ev("S.myFoods.map(m=>m.n)"));
      ev("Nutrition.putMy({n:'Süt',k:61,b:'11111111'})");
      ok("the same barcode still replaces its entry",ev("S.myFoods.length")===2&&ev("S.myFoods.find(m=>m.b==='11111111').k")===61);
      ev("S.myFoods=[]");
    }
    ev("closeSheet();S.myFoods=[];labelReview({food:{k:300,p:5,c:40,f:10,sg:45}})");
    T("#en").value="Şekerli";T('[data-ocr="esave"]').click();
    ok("label: if sugar exceeds carbs it is not silently dropped, it warns and does not save",ev("S.myFoods.length")===0&&T("#ewarn").textContent.includes("Şeker, karbonhidrattan büyük"),T("#ewarn").textContent);
    T("#esg").value="35";T('[data-ocr="esave"]').click();
    ok("label: once corrected it saves with sugar",ev("S.myFoods.length")===1&&ev("S.myFoods[0].sg")===35);
    ev("closeSheet();S.myFoods=[];labelReview({food:{k:440,p:30,c:70,f:13,fb:3,sg:12,na:480}})");
    T("#en").value="Makul değil";T('[data-ocr="esave"]').click();T('[data-ocr="esave"]').click();
    ok("label: when 'makul değil' is confirmed fiber/sugar/sodium are not lost",ev("[S.myFoods[0].fb,S.myFoods[0].sg,S.myFoods[0].na].join()")==="3,12,480",ev("S.myFoods"));
    ev("closeSheet();S.myFoods=[];labelReview({food:{k:440,p:150,c:5,f:1}})");
    T("#en").value="Protein taşması";T('[data-ocr="esave"]').click();
    ok("label: protein above 100 per 100 g is not silently dropped, it warns and does not save",ev("S.myFoods.length")===0&&T("#ewarn").textContent.includes("Protein değeri 100 g için makul değil (0-100 g)"),T("#ewarn").textContent);
    ev("closeSheet();S.myFoods=[]");
  }
  ev("S.myFoods=[]");
  ev("S.entries=[];S.settings.oemDone=true");
  const yi=ev("allFoods().findIndex(f=>f.n==='Haşlanmış yumurta')");
  ev(`sheetPortion(${yi})`);w.document.querySelector("#fqty").value="2";ev("foodPreview()");
  ok("the portion preview is computed",w.document.querySelector("#fprev").textContent.startsWith("155 kcal"),w.document.querySelector("#fprev").textContent);
  ev("goNutrition()");
  const be=ev("S.entries.find(e=>e.type==='food')");
  ok("the food is saved with calories and macros",be&&be.v===155&&Math.abs(be.p-13)<0.1&&be.c>0&&be.f>10&&be.text.includes("2 ×"),be);
  ok("macros are kept on reload",ev("cleanEntries(S.entries).out[0].f")===be.f);
  ok("the macro row shows on Today",ev("viewToday()").includes("Karbonhidrat"));
  const sched=[];
  Object.assign(w.Capacitor.Plugins.LocalNotifications,{requestPermissions:async()=>({display:"granted"}),cancel:async()=>{},schedule:async x=>{sched.push(...x.notifications)}});
  ok("reminder status ok",await ev("scheduleReminders()")==="ok");
  ok("30 days of one-shot alarms are scheduled",sched.length>=150&&new Set(sched.map(n=>n.id)).size===sched.length&&sched.every(n=>n.schedule.at>new Date()&&n.schedule.allowWhileIdle&&!n.schedule.on),[sched.length]);
  await ev("notifTest()");
  ok("a test notification is scheduled and a diagnosis is written",sched.some(n=>n.id===99)&&ev("notifDiag").includes("granted")&&ev("notifDiag").includes("Kurulu hatırlatma: 2"),[sched.length,ev("notifDiag")]);
  ev("S.chat=[];S.cid=1;cReply({reply:'x',log:[],propose:null,flag:'safety'})");
  ok("a model safety flag produces a card",ev("S.chat.some(m=>m.card&&m.card.kind==='safety')"));
  ev("S.chat=[];Object.assign(S.settings,{age:12,heightCm:165,goalKg:45,healthNote:'',kcal:0});S.entries=[];for(let i=13;i>=0;i--)S.entries.push({id:100+i,day:keyOff(-i),time:'08:00',type:'weight',v:60-i*0.01,text:''})");
  ev("cReply({reply:'x',log:[],propose:{kcal:1300,why:'a'},flag:null})");
  ok("the Coach cannot propose a calorie target any more: a propose field in the reply makes no card",!ev("S.chat.some(m=>m.card&&m.card.kind==='propose')"));
  ev("S.entries=[];for(let i=0;i<10;i++)add('water',250)");ev("S.settings.lastBackup=''");
  ok("a warning appears if there is no backup",ev("viewToday()").includes("Verilerini yedekle"));
  ev("markBackup()");
  ok("once a backup is taken the warning goes",!ev("viewToday()").includes("Verilerini yedekle")&&ev("cleanSettings({lastBackup:S.settings.lastBackup}).lastBackup")===ev("dayKey()"));
  { // Today simplification
    const unclock=require('./clock').at(w,21); // dose and measurement rows appear when their time comes
    const st0=ev("JSON.stringify(S)");
    ev("S.entries=[];S.meds=[];S.medLog=[];S.vitals=[];S.workouts=S.workouts.filter(x=>x.t1);S.fast={plan:16,t0:null,log:[]};Object.assign(S.settings,{medOn:false,fastOn:false,bpOn:false,bsOn:false,stepsOn:false,stepsAsked:true,oemDone:true,waterMl:2500,kcal:1900,sportWeek:150,glass:250});oem='google';tab='today';logOff=0");
    ok("with nothing to do there is no 'Bugün yapılacaklar' card",!ev("viewToday()").includes("Bugün yapılacaklar"));
    ev("add('water',1000);add('food',1380,'Öğün');add('weight',86,'');add('weight',87,'',keyOff(-3));render()");
    const v=()=>ev("viewToday()"),at=s=>v().indexOf(s);
    ok("one primary action Yemek ekle, secondary quick records as chips: Su, Kilo, Spor, Not",$q(".actions>.btn").dataset.act==="food"&&$q(".actions .btn.ghost")===null&&[...$q(".actions .qa").querySelectorAll(".act")].map(b=>b.dataset.act).join()==="water,weight,exercise,note");
    ok("rings state the unit and the remainder",(t=>t.includes("520kcal kaldı")&&t.includes("1380 / 1900 kcal")&&t.includes("1,5L kaldı")&&t.includes("1,0 / 2,5 L")&&t.includes("21dk kaldı")&&t.includes("0 / 21 dk")&&!t.includes("7 gün"))($q(".rings").textContent),$q(".rings").textContent);
    ev("add('food',700,'Fazla');add('water',1500);add('exercise',150,'Yürüyüş');render()");
    ok("when the target is exceeded 'kcal fazla', water and sport 'tamam'",(t=>t.includes("180kcal fazla")&&(t.match(/✓Hedef tamam/g)||[]).length===2)($q(".rings").textContent),$q(".rings").textContent);
    ok("the weight card is small: no chart, a one-line summary, leads to Trend",!v().includes('class="weight"')&&!!$q('#view .stepcard[data-tab="trend"]')&&!$q('#view .stepcard[data-tab="trend"] svg:not(.i)')&&$q('#view .stepcard[data-tab="trend"]').textContent.includes("86,0"));
    ok("the Coach sentence is a Coach shortcut",!!$q('#view button.coach[data-tab="coach"]'));
    ev("S.settings.medOn=true;S.meds=[{id:1,n:'İlaç A',t:['08:00','20:00'],on:true}];S.settings.fastOn=true;S.settings.bpOn=true;render()");
    ok("medication, fasting and measurement are in the single 'Bugün yapılacaklar' card, no separate card",ev("document.querySelectorAll('#view .todo').length")===1&&$q(".todo").querySelectorAll('[data-md^="take:"]').length===2&&$q('.todo').textContent.includes('Oruç önerilmez')&&!!$q('.todo [data-vt="addbp"]')&&!v().includes("💊 İlaçlar")&&!v().includes("Ölçümler"));
    ok("to-do is compact: first 3 items shown, the rest under 'iş daha'; the time is a separate column on the medication row",$q(".todo").querySelectorAll(":scope>.row").length===3&&$q(".todo details.acc summary").textContent==="1 iş daha"&&$q(".todo details .row")&&$q('.todo .row .tm').textContent==="08:00");
    ok("information hierarchy: summary, record, to-do, Trend/Coach shortcut",at('class="bgL"')<at('class="rings"')&&at('class="rings"')<at('class="actions"')&&at('class="actions"')<at("Bugün yapılacaklar")&&at("Bugün yapılacaklar")<at('data-tab="trend"')&&at('data-tab="trend"')<at('class="coach"'));
    ev("S.settings.medOn=false;S.settings.fastOn=false;S.settings.bpOn=false;render()");
    ok("when modules are turned off the card goes",!v().includes("Bugün yapılacaklar"));
    ev(`S=Object.assign(S,JSON.parse(${JSON.stringify(st0)}));render()`);
    unclock();
  }
  { // home screen widget
    const wc=[];w.Capacitor.Plugins.Widget={update:async d=>{wc.push(d)}};
    ev("widgetLast='';tab='today';S.entries=[];add('water',250);add('food',400,'makarna');S.settings.kcal=1800;S.settings.waterMl=2500;S.settings.glass=250;S.settings.stepsOn=true;stepToday=3000;add('steps',500,'manual');render()");
    ok("widget: updated once after render with the right fields",wc.length===1&&JSON.stringify(wc[0])===JSON.stringify({day:ev("dayKey()"),water:250,waterGoal:2500,glass:250,kcalLeft:1400,steps:3500}),wc);
    ev("render()");
    ok("widget: not sent again when nothing changed",wc.length===1);
    ev("S.settings.kcal=0;S.settings.stepsOn=false;render()");
    ok("widget: kcalLeft when there is no target, steps null when steps are off",wc.length===2&&wc[1].kcalLeft===null&&wc[1].steps===null&&"kcalLeft" in wc[1]);
    ev("S.settings.stepsOn=true;tab='trend';render()");stepSteps=3200;await ev("stepsSync()");
    ok("widget: updated when steps change even outside Today",wc[wc.length-1].steps===3700,wc[wc.length-1]);
    ev("tab='coach';logOff=-2;widgetOpen()");
    ok("widget: tapping opens Today",ev("tab")==="today"&&ev("logOff")===0);
    const n0=wc.length;
    ev("widgetLast='';Object.assign(S.settings,{obDone:false,heightCm:0,age:0,goalKg:0,kcal:0,consent:false});S.entries=[];S.chat=[];S.meds=[];render()");
    ok("widget: updated after render while onboarding is open too",ev("obNeeded()")===true&&wc.length===n0+1&&wc[n0].water===0,[ev("obNeeded()"),wc.length,n0]);
    delete w.Capacitor.Plugins.Widget;
  }
  { // KVKK explicit consent, Privacy and data
    const q=s=>$q(s),k=()=>q("#view").textContent,sh=()=>q("#sheet").textContent;
    ev("closeSheet();S.settings.age=30;S.settings.consent=false;S.settings.consentV=0;S.settings.consentAt='';S.chat=[];S.entries=[];Object.assign(S.settings,{obDone:true});setKey('groq','K1');tab='coach';render()");
    const t=ev("document.querySelector('#view .chat>.card').textContent");
    ok("consent text: what is sent, to whom (provider name), transfer abroad, withdrawal, fully works without consent",["Ne gönderilir","Groq","yurt dışına aktarım","Geri alma","Onay vermezsen","uygulama tam çalışır"].every(x=>t.includes(x))&&!!q('[data-c="consent"]'),t);
    ev("cConsent(true)");
    ok("consent: consentV and consentAt are written, saved",ev("S.settings.consent&&S.settings.consentV===CONSENT_V&&S.settings.consentAt===dayKey()")&&JSON.parse(w.localStorage.getItem("nw_state")).settings.consentAt===ev("dayKey()"));
    ev("cConsent(false)");
    ok("withdrawal: consent, version and date are cleared",ev("!S.settings.consent&&S.settings.consentV===0&&S.settings.consentAt===''"));
    ok("an old consent (no version or a different version) is invalid, the current version is valid",ev("[cleanSettings({consent:true}).consent,cleanSettings({consent:true,consentV:CONSENT_V+1}).consent,cleanSettings({consent:true,consentV:CONSENT_V,consentAt:'2026-10-01'}).consentAt]").join()==="false,false,2026-10-01");
    ev("S.settings.consent=true;S.settings.consentV=CONSENT_V-1;save()");
    ok("on restart a consent given under an old version lapses",ev("load().settings.consent")===false);
    ev("cConsent(true);sheetBackup()");
    ev("(()=>{const x=JSON.parse(JSON.stringify(S));x.settings.consent=false;x.settings.consentV=0;x.settings.consentAt='';x.entries=[{id:1,day:'2026-09-01',time:'10:00',type:'water',v:250,text:''}];document.querySelector('#bk').value=JSON.stringify(x)})()");
    await loadBackup();
    ok("a backup restore keeps the consent version and date",ev("S.settings.consent&&S.settings.consentV===CONSENT_V&&S.settings.consentAt===dayKey()&&load().settings.consent"));
    ev("S.settings.age=16;cConsent(false);cConsent(true);tab='coach';render()");
    ok("under 18: consent cannot be given, no button, an explanation",!ev("S.settings.consent")&&!q('[data-c="consent"]')&&k().includes("18 yaş altı"));
    ev("S.settings.age=30;tab='settings-data';render()");
    q('[data-pv="open"]').click();
    const g=sh();
    ok("Privacy and data: where, Open Food Facts barcode only, ML Kit, Drive, the Coach consent text is the same, medical warning",["Verin nerede","Open Food Facts","yalnızca barkod numarası","Google barkod tarayıcı","Google Drive","Rehber ile veri paylaşımına açık rızan"].every(x=>g.includes(x))&&g.includes(ev("(()=>{const d=document.createElement(\"div\");d.innerHTML=consentHtml();return d.textContent})()"))&&g.includes(ev("MED_NOTE")),g.slice(0,200));
    q('[data-pv="consent"]').click();
    ok("consent from the sheet: the sheet stays open, the state updates, a withdraw button appears",ev("S.settings.consent")&&sh().includes("kabul edildi")&&!!q('[data-pv="revoke"]'));
    q('[data-pv="revoke"]').click();
    ok("withdrawal from the sheet",!ev("S.settings.consent")&&sh().includes("kabul edilmedi"));
    ev("closeSheet()");
    ok("medical warning: About MED_NOTE, blood pressure/sugar/labs one pattern 'Bu değerleri hekiminle değerlendir.'",(ev("tab='settings-about';render()"),k().includes(ev("MED_NOTE")))&&["bp","glucose","labs"].every(t=>{ev(`tab='${t}';render()`);return k().includes("Bu değerleri hekiminle değerlendir.")}));
    ev("Object.assign(S.settings,{obDone:false,heightCm:0,goalKg:0,kcal:0,age:0});S.entries=[];S.chat=[];S.meds=[];Object.assign(ob,{cm:'170',kg:'80',age:'30',step:2});render()");
    ok("onboarding last step: a short summary and link, the sheet opens",k().includes("yalnızca telefonunda durur")&&k().includes(ev("MED_NOTE"))&&(q('[data-pv="open"]').click(),sh().includes("Verin nerede")));
    ev("closeSheet()");
  }
  { // per-category deletion
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],sh=()=>q("#sheet").textContent;
    const wc=[];w.Capacitor.Plugins.Widget={update:async d=>{wc.push(d)}};
    ev("window.__sr=0;window.__osr=scheduleReminders;scheduleReminders=async()=>{__sr++;return 'web'}");
    const seed=()=>ev(`(()=>{closeSheet();S.entries=[];S.nextId=1;widgetLast='';
      add('food',300,'ekmek');add('water',250);add('weight',80);add('steps',3000);add('note',null,'kişisel not');add('note',null,'ikinci');
      const wk=add('exercise',40,'Ağırlık, A');wk.wid=7;add('exercise',20,'yürüyüş');
      S.workouts=[{id:7,day:dayKey(),t0:1,t1:2,name:'A',tpl:null,ex:[]},{id:8,day:dayKey(),t0:3,t1:null,name:'Etkin',tpl:null,ex:[]}];
      S.moves=[{day:dayKey(),t0:'10:00',min:20,k:'w',steps:2000,km:1.5,kmh:4.5,kcal:null,gps:false}];
      S.meds=[{id:1,n:'X',t:['09:00'],on:true}];S.medLog=[{id:1,m:1,day:dayKey(),slot:'09:00',st:'t'}];
      S.vitals=[{id:1,k:'t',day:dayKey(),time:'08:00',sys:120,dia:80,session:'morning'}];S.labs=[{id:1,day:dayKey(),k:'glu',n:'Glukoz',v:90,u:'mg/dL'}];
      S.sleep=[{day:dayKey(),min:420}];S.mood=[{day:dayKey(),v:4}];S.fast={plan:16,t0:Date.now()-36e5,log:[{t0:1,t1:2}]};
      S.chat=[{id:1,role:'user',text:'merhaba',t:1}];S.cid=2;S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';S.settings.consentV=CONSENT_V;S.settings.consentAt='2026-10-01';S.settings.lastBackup='2026-09-30';S.settings.obDone=true;
      sheetPrivacy()})()`);
    const cnt=()=>ev("JSON.stringify([S.entries.length,S.workouts.length,S.moves.length,S.meds.length+S.medLog.length,S.vitals.length,S.labs.length,S.sleep.length+S.mood.length+S.fast.log.length+(S.fast.t0?1:0),S.chat.length])");
    const del=i=>{q(`[data-pv="del:${i}"]`).click()};
    seed();const all=cnt();
    ok("list: 15 categories, each with a record count and a Sil button; backup reminder",qa('[data-pv^="del:"]').length===15&&sh().includes("Yemek ve su kayıtları")&&sh().includes("2 kayıt")&&sh().includes("Önce yedek al")&&sh().includes("Rehber sohbeti"));
    ev("window.confirm=()=>false");del(0);
    ok("nothing is deleted if not confirmed",cnt()===all);
    let msg="";w.confirm=m=>{msg=m;return true};
    del(0);
    ok("food and water: only they go; the warning has the count, cannot be undone, last backup date",ev("S.entries.filter(e=>e.type==='food'||e.type==='water').length")===0&&ev("S.entries.length")===6&&/geri alınamaz/.test(msg)&&msg.includes(ev("fd('2026-09-30')"))&&msg.includes("2 kayıt"),msg);
    ok("after deletion the widget updates (water 0)",wc.length&&wc[wc.length-1].water===0,wc[wc.length-1]);
    ok("after deletion the list refreshes, no undo button (lastUndo clean)",sh().includes("0 kayıt")&&q("#tundo").hidden===true);
    seed();del(1);
    ok("weight",ev("S.entries.some(e=>e.type==='weight')")===false&&ev("S.entries.length")===7&&ev("S.workouts.length")===2);
    seed();ev("render()");del(2);
    ok("sport and workouts: workouts (including active) and all sport records, the linked wid record is not orphaned",ev("S.workouts.length")===0&&ev("S.entries.some(e=>e.type==='exercise')")===false&&ev("S.entries.length")===6&&ev("S.entries.some(e=>e.wid!=null)")===false);
    ev("tab='gym';render()");
    ok("when the active workout is deleted Gym is not broken, no error",ev("gActive()")===null&&q("#view").textContent.length>50&&errs.length===0,errs);
    ev("closeSheet();sheetPrivacy()");
    seed();del(3);
    ok("steps and motion: step records and movements",ev("S.moves.length")===0&&ev("S.entries.some(e=>e.type==='steps')")===false&&ev("S.entries.length")===7);
    seed();ev("__sr=0");del(4);
    ok("medication: the medication and intake log go, notifications are rescheduled",ev("S.meds.length+S.medLog.length")===0&&ev("__sr")>=1);
    seed();del(5);ok("health measurements",ev("S.vitals.length")===0&&ev("S.labs.length")===1);
    seed();del(6);ok("labs",ev("S.labs.length")===0&&ev("S.vitals.length")===1);
    seed();ev("__sr=0");del(7);
    ok("sleep, mood, fasting: an active fast ends too, notifications are rescheduled",ev("S.sleep.length+S.mood.length+S.fast.log.length")===0&&ev("S.fast.t0")===null&&ev("S.fast.plan")===16&&ev("__sr")>=1);
    seed();del(8);
    ok("when the Coach chat is deleted consent, version and date are kept",ev("S.chat.length")===0&&ev("S.settings.consent&&S.settings.consentV===CONSENT_V&&S.settings.consentAt==='2026-10-01'"));
    seed();del(9);
    ok("notes: only notes",ev("S.entries.some(e=>e.type==='note')")===false&&ev("S.entries.length")===6);
    ok("no deletion touched another category: after deleting one by one the other counts are the same",(()=>{seed();const b=JSON.parse(cnt());del(4);const a=JSON.parse(cnt());return a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]&&a[4]===b[4]&&a[5]===b[5]&&a[6]===b[6]&&a[7]===b[7]&&a[3]===0})());
    const st=JSON.parse(w.localStorage.getItem("nw_state"));
    ok("deletion is permanent and the state read from the record is consistent (no medication after load, chat kept)",st.meds.length===0&&st.chat.length===1&&ev("load().meds.length")===0);
    ok("in an empty category the Sil button is disabled",(()=>{ev("S.entries=S.entries.filter(e=>e.type!=='note');sheetPrivacy()");return q('[data-pv="del:9"]').disabled})());
    ev("scheduleReminders=window.__osr;closeSheet();S.settings.consent=false;S.settings.consentV=0;S.settings.consentAt='';S.fast={plan:16,t0:null,log:[]};S.chat=[];S.entries=[];S.meds=[];S.workouts=[];tab='today';render()");
    delete w.Capacitor.Plugins.Widget;
  }
  { // CSV export
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],wr=[],shr=[];
    w.Capacitor.Plugins.Filesystem={writeFile:async o=>{wr.push(o);return {uri:"file:///cache/"+o.path}}};
    w.Capacitor.Plugins.Share={share:async o=>{shr.push(o)}};
    ev("closeSheet();S.entries=[];S.nextId=1;S.workouts=[];S.vitals=[];S.sleep=[];S.mood=[];S.fast={plan:16,t0:null,log:[]};S.meds=[];S.medLog=[];add('weight',80.5);add('note',null,'=1+1');S.settings.obDone=true;tab='settings-data';render()");
    q('[data-pv="csv"]').click();
    const sheet=()=>q("#sheet").textContent;
    ok("Settings > Data Tabloya aktar: 9 files, with row counts; the button of an empty one is disabled",sheet().includes("Kayıtlar (yemek, su, kilo, ölçü, spor, adım, not)")&&sheet().includes("2 satır")&&qa('[data-pv^="csvsh:"]').length===9&&qa('[data-pv^="csvsh:"]').filter(b=>b.disabled).length===8);
    q('[data-pv="csvsh:0"]').click();await flush();
    ok("share: a single file, UTF-8 text, BOM, ; separator, decimal comma, injection-safe, uri goes to the share sheet",wr.length===1&&wr[0].encoding==="utf8"&&wr[0].directory==="CACHE"&&/^neowell-kayitlar-\d{4}-\d\d-\d\d\.csv$/.test(wr[0].path)&&wr[0].data.startsWith("﻿tarih;saat;")&&wr[0].data.includes(";kilo;80,5;kg;")&&wr[0].data.includes("'=1+1")&&shr.length===1&&shr[0].files[0]==="file:///cache/"+wr[0].path,wr[0]);
    ok("full archive row: record total shown, button enabled",sheet().includes("Tüm verim (tek JSON dosyası)")&&sheet().includes("2 kayıt")&&!q('[data-pv="archive"]').disabled,sheet());
    q('[data-pv="archive"]').click();await flush();
    const ar=JSON.parse(wr[1].data);
    ok("archive share: a readable JSON file with the user's entries, no API key, file name with the date",/^neowell-arsiv-\d{4}-\d\d-\d\d\.json$/.test(wr[1].path)&&wr[1].encoding==="utf8"&&ar.schema===1&&ar.modules.log.entries.length===2&&!("providers" in ar.modules.coach),wr[1].path);
    ok("FHIR row: weight and blood pressure counts shown, button enabled with a weight record",sheet().includes("Tansiyon, kilo ve şeker (FHIR R4)")&&sheet().includes("0 tansiyon, 1 kilo, 0 şeker kaydı")&&!q('[data-pv="fhir"]').disabled,sheet());
    q('[data-pv="fhir"]').click();await flush();
    {const fj=JSON.parse(wr[2].data);ok("FHIR share: a Bundle file with the weight observation, dated file name, no other data",wr[2].path.startsWith("neowell-fhir-")&&wr[2].path.endsWith(".json")&&fj.resourceType==="Bundle"&&fj.entry.length===2&&fj.entry[1].resource.valueQuantity.value===80.5&&!wr[2].data.includes("=1+1"),wr[2].path)}
    wr.length=1;
    ev("S.nextId=1");
    await ev("sharePdf(new Uint8Array([37,80,68,70]),'x.pdf','PDF')");
    ok("PDF sharing takes the same path, base64 and without encoding (no regression)",wr.length===2&&wr[1].path==="x.pdf"&&wr[1].encoding===undefined&&wr[1].data==="JVBERg==",wr[1]);
    delete w.Capacitor.Plugins.Filesystem;delete w.Capacitor.Plugins.Share;ev("closeSheet();S.entries=[];tab='today';render()");
  }
  { // Settings sub-screens
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],v=()=>q("#view").textContent;
    ev("closeSheet();S.settings.obDone=true;S.settings.heightCm=170;S.settings.age=30;S.settings.goalKg=72;S.settings.medOn=true;S.settings.fastOn=true;S.settings.bpOn=true;S.settings.bsOn=true;S.settings.stepsOn=false;S.settings.lastBackup='';tab='settings';render()");
    const rows=qa('#view [data-tab^="settings-"]').map(b=>b.dataset.tab);
    ok("Settings home is a short list: 6 sections, summary value and ›, no fields (except the large-text switch), a ‹ in the header (to Daha fazla)",rows.join()==="settings-profile,settings-reminders,settings-coach,settings-modules,settings-data,settings-about"&&v().includes("170 cm · 30 yaş · hedef 72,0 kg")&&v().includes("İlaç, Oruç, Tansiyon, Şeker açık")&&v().includes("Henüz yedek dosyası yok")&&![...w.document.querySelectorAll("#view input")].some(i=>!i.hasAttribute("data-comfy"))&&!q("#back").hidden&&q('nav [data-tab="more"]').getAttribute("aria-current")==="page",v());
    const T={profile:"Profil ve hedefler",modules:"Modüller",reminders:"Hatırlatmalar",coach:"Rehber",data:"Veri ve yedek",about:"Hakkında"},seen=new Set();
    let titles=true;
    for(const k in T){
      q(`[data-tab="settings-${k}"]`).click();
      titles=titles&&q("#ttl").textContent===T[k]&&!q("#back").hidden&&q('nav [data-tab="more"]').getAttribute("aria-current")==="page";
      for(const e of qa("#view *"))for(const a of e.attributes)if(a.name.startsWith("data-")||a.name==="id")seen.add(a.name==="id"?"id="+a.value:a.name+"="+a.value);
      q("#back").click();titles=titles&&ev("tab")==="settings";
    }
    ok("each section is its own sub-screen: header, ‹ visible, Daha fazla tab active; ‹ returns to the list",titles);
    const need=["heightCm","age","goalKg","kcal","waterMl","glass","sportWeek","stepGoal"].map(k=>"data-set="+k)
      .concat([1,2,3,4,5,6,7,8,9,10,11,12].flatMap(i=>["data-rt="+i,"data-ro="+i]),["data-act=health","data-act=drive","data-act=backup","data-act=reset","data-pv=csv","data-pv=open","data-c=addprov","data-c=clearchat","data-g=gdb:2.5","data-g=gpl:25","data-hb=fasttoggle","data-hb=plan:16","data-md=toggle","data-md=shown","data-tab=meds","data-vt=bptoggle","data-vt=bstoggle","data-aw=","data-rpe=","data-sex=m","data-actl=2"]);
    ok("all ids of the old single page are kept in the sub-screens",need.every(x=>seen.has(x)),need.filter(x=>!seen.has(x)));
    ev("tab='settings-profile';render()");q('[data-help="hlpmk"]').click();
    ok("ⓘ detail: the explanation opens inside the card, aria-expanded updates",!q("#hlpmk").hidden&&q('[data-help="hlpmk"]').getAttribute("aria-expanded")==="true");
    ev("S.settings.fastOn=false;S.settings.fastInfoOk=false;S.fast.t0=null;tab='settings-modules';render()");q('[data-hb="fasttoggle"]').click();
    ok("a module switch does not look checked while awaiting confirmation",ev("S.settings.fastOn")===false&&q('[data-hb="fasttoggle"]').checked===false&&!!q("#fic"));
    ev("closeSheet();S.settings.fastOn=true");
    ev("tab='settings-modules';render()");ev("backKey()");const b1=ev("tab");ev("backKey()");
    const b2=ev("tab");ev("backKey()");
    ok("Android back: from a sub-screen to Settings, to Daha fazla, to Today",b1==="settings"&&b2==="more"&&ev("tab")==="today");
    ev("tab='settings-reminders';render()");w.dispatchEvent(new w.PopStateEvent("popstate"));
    ok("browser back (popstate): from a sub-screen to Settings, there was a history entry on the sub-screen",ev("tab")==="settings");
    ev("tab='settings-reminders';render();setNotif('denied')");
    ok("the Reminders screen refreshes the permission state",v().includes("Bildirim izni kapalı"));
    ev("tab='trend';render()");ev("document.body.insertAdjacentHTML('beforeend','<button id=\"pf\" data-act=\"profile\"></button>')");q("#pf").click();q("#pf").remove();
    ok("the profile link (Enerji dengesi) opens Profil ve hedefler",ev("tab")==="settings-profile"&&!!q("#heightCm"));
    ev("S.settings.medOn=false;S.settings.fastOn=false;S.settings.bpOn=false;S.settings.bsOn=false;S.settings.heightCm=0;S.settings.age=0;S.settings.goalKg=0;tab='today';render()");
  }
  { // 5 fixed tabs and Daha fazla
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],cur=()=>(q('nav [aria-current="page"]')||{dataset:{}}).dataset.tab,go=t=>ev(`closeSheet();tab='${t}';via=null;render()`);
    const tabs=()=>qa("nav button").map(b=>b.dataset.tab).join(),rowsOf=()=>qa('#view .prow');
    ev("S.settings.obDone=true;S.settings.medOn=false;S.settings.bpOn=false;S.settings.bsOn=false;S.settings.stepsOn=false");go("today");
    const closed=tabs();ev("S.settings.medOn=true;S.settings.bpOn=true;S.settings.bsOn=true;S.settings.stepsOn=true;S.settings.cycleOn=true");go("today");
    ok("the bottom menu is always the same 5 tabs (medication off or on): Bugün, Salon, Trend, Rehber, Daha fazla; opens on Today",closed==="today,gym,trend,coach,more"&&tabs()===closed&&/let tab="today"/.test(html)&&qa("nav button").pop().textContent.includes("Daha fazla"));
    go("more");
    ok("Daha fazla with modules open: 5 headed groups, header, no ‹, tab active",q("#ttl").textContent==="Daha fazla"&&q("#back").hidden&&cur()==="more"&&qa("#view h2.grp").map(h=>h.textContent).join()==="Geçmiş,Sağlık takibi,Beslenme ve hareket,Veri,Uygulama"&&rowsOf().length===(ev("phOk()")?19:18)&&!q(".prow.off")&&["meds","cycle","steps","labs","bp","glucose","exlib","settings","settings-about"].every(t=>!!q(`#view [data-tab="${t}"]`))&&!!q('#view [data-pv="open"]'));
    ev("S.settings.medOn=false;S.settings.bsOn=false;S.settings.stepsOn=false;S.settings.cycleOn=false;render()");
    ok("closed modules are not in the list: İlaç, Adım, Şeker, Döngü hidden, Tansiyon visible; rows 56 px",["meds","steps","glucose","cycle"].every(t=>!q(`#view [data-tab="${t}"]`))&&!!q('#view [data-tab="bp"]')&&/\.row,\.prow[^{]*\{[^}]*min-height:56px/.test(html));
    q('#view [data-tab="settings-modules"]').click();const viaMore=ev("tab")==="settings-modules"&&cur()==="more";q("#back").click();
    ok("the Modüller row: opens Settings > Modules, Daha fazla stays active, ‹ returns to Daha fazla",viaMore&&ev("tab")==="more");
    ev("S.settings.medOn=true;S.settings.stepsOn=true;render()");
    q('#view [data-tab="steps"]').click();
    ok("Adım from Daha fazla: header, Daha fazla active, ‹ returns to Daha fazla",q("#ttl").textContent==="Adım raporu"&&cur()==="more"&&!q("#back").hidden);
    q("#back").click();const a1=ev("tab")==="more";
    ev("S.meds=[{id:1,n:'Test İlaç',d:'1 tablet',t:['23:58'],on:true,k:10}];S.medLog=[]");go("today");{const b=w.document.createElement("button");b.dataset.tab="meds";w.document.body.append(b);b.click();b.remove()}
    ok("İlaç opened from Today: Daha fazla active, ‹ returns to Today (a sub-screen sits under where it was opened)",ev("tab")==="meds"&&cur()==="more"&&(q("#back").click(),ev("tab")==="today")&&a1);
    go("meds");const d1=cur();ev("backKey()");const d2=ev("tab");ev("backKey()");
    ok("deep link İlaç: Daha fazla active; Android back to Daha fazla, then Today",d1==="more"&&d2==="more"&&ev("tab")==="today");
    go("trend");q('#view [data-tab="bp"]').click();const t1=cur()==="trend";q("#back").click();
    const t2=ev("tab")==="trend";go("bp");const t3=cur();go("settings-about");
    ok("Tansiyon from Trend: Trend active and ‹ to Trend; deep Tansiyon Trend, About Daha fazla active",t1&&t2&&t3==="trend"&&cur()==="more");
    ev("S.meds=[];S.medLog=[]");
    go("today");const tap=(x,m)=>{ev(`S.settings.medOn=${m};S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';tab='today';notifTap(${JSON.stringify({actionId:"tap",notification:{extra:x}})})`);return ev("tab")};
    ok("notification tap: the ilac tab goes to İlaç (when medication is on) or Daha fazla; koc, settings-veri and old names are kept",tap({act:"open",tab:"meds"},true)==="meds"&&tap({act:"open",tab:"meds"},false)==="more"&&tap({act:"open",tab:"coach"},true)==="coach"&&tap({act:"open",tab:"settings-data"},true)==="settings-data"&&tap({act:"open",tab:"settings"},true)==="trend");
    ev("S.meds=[{id:1,n:'A',t:['08:00'],on:true}]");const mx=ev("MedLib.notifications(S.meds,[],new Date(),3,true)[0].extra");
    ok("tapping a real medication notification (act:med) opens İlaçlar, Daha fazla if medication is off",mx.act==="med"&&tap(mx,true)==="meds"&&tap(mx,false)==="more",mx);
    ev("S.meds=[]");
    ev("S.settings.consent=false;S.settings.medOn=false");go("coach");const c1=!q("#composer").hidden;go("more");
    ok("the Coach composer only on the Coach tab",c1&&q("#composer").hidden&&(go("gym"),q("#composer").hidden));
    go("today");
  }
  { // SVG icons
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],emo=/\p{Extended_Pictographic}/u;
    ev("closeSheet();S.settings.medOn=true;S.settings.obDone=true;tab='today';render()");
    const zones=()=>["nav","#view .actions","#view .hrow","#composer .chiprow","#csend","#back"].map(s=>q(s));
    const okZ=()=>zones().every(z=>z&&!emo.test(z.textContent)&&z.querySelectorAll("svg").length>0&&[...z.querySelectorAll("svg")].every(g=>g.getAttribute("aria-hidden")==="true"));
    const z1=okZ();ev("tab='settings';render()");
    ok("bottom menu, quick record, habit, Coach chips, send and back: no emoji, icons are SVG and aria-hidden; the text label stays",z1&&qa("nav button").every(b=>b.textContent.trim().length>1)&&qa('#view [data-tab^="settings-"] svg[aria-hidden="true"]').length===6&&!emo.test(q("#view").textContent));
    ok("the active tab icon has the same colour as the text (currentColor), the Icons object loads before index",/\.i\{[^}]*stroke:currentColor/.test(html)&&/nav button\[aria-current="page"\]\{color:var\(--prim\)/.test(html)&&html.indexOf("Icons={")<html.indexOf("const DEF="));
    ev("S.settings.medOn=false;tab='today';render()");
  }
  { // consistency pack
    const q=s=>$q(s),src=["index.html","kernel/algo.js","modules/gym/gym.js","modules/gym/exui.js","modules/labs/labui.js","modules/vitals/vitalsui.js","modules/habits/habitui.js","modules/meds/medui.js","modules/data/privacyui.js","modules/data/backupui.js","modules/coach/coach.js","modules/labs/lablib.js","modules/vitals/vitalslib.js","modules/insights/weeklylib.js"].map(f=>fs.readFileSync(www(f),"utf8")).join("\n");
    const y=ev("dayKey().slice(0,4)");
    ok("single date format: Algo.fdate day month (year), this year without a year on screen; no old helpers or gg.aa patterns",ev("Algo.fdate('2026-10-02')")==="2 Eki"&&ev("Algo.fdate('2026-01-09',true)")==="9 Oca 2026"&&ev(`fd('${y}-03-05')`)==="5 Mar"&&ev("fd('2019-12-31')")==="31 Ara 2019"&&!/\b(dm|gDate|vDayLbl|labDay)\(|slice\(8\)\+"\."|\.slice\(8\)\}\./.test(src)&&q("#view")&&ev("S.settings.lastBackup='2026-09-30';tab='settings';render();document.querySelector('#view').textContent").includes("Son yedek "+ev("fd('2026-09-30')")));
    let back=true;
    for(const [t,p,ttl,nv] of [["steps","today","Adım raporu","more"],["labs","trend","Tahlil takibi"],["bp","trend","Tansiyon"],["glucose","trend","Şeker"],["exlib","gym","Egzersiz kütüphanesi"]]){
      ev(`closeSheet();tab='${t}';render()`);
      back=back&&!q("#back").hidden&&q("#ttl").textContent===ttl&&![...w.document.querySelectorAll("#view .btn")].some(b=>b.textContent.trim().startsWith("‹"))&&q(`nav [data-tab="${nv||p}"]`).getAttribute("aria-current")==="page";
      q("#back").click();back=back&&ev("tab")===p&&q("#back").hidden;
    }
    ok("on sub-screens a small ‹ in the header (44 px, aria-label Geri): no big back button, returns to the parent screen",back&&q("#back").getAttribute("aria-label")==="Geri"&&/#back\{width:44px;height:44px/.test(html));
    ok("theme setting: default Sistem, only light/dark remain, Sistem in an old backup",ev("DEF.settings.theme")===""&&ev("cleanSettings({theme:'dark'}).theme")==="dark"&&ev("cleanSettings({theme:'mavi'}).theme")===""&&ev("cleanSettings({kcal:1800}).theme")==="");
    ev("tab='settings';render()");const de=w.document.documentElement;
    q('[data-thm="dark"]').click();const t1=de.dataset.theme,s1=ev("S.settings.theme"),p1=q('[data-thm="dark"]').getAttribute("aria-pressed");
    q('[data-thm="light"]').click();const t2=de.dataset.theme;
    q('[data-thm=""]').click();
    ok("theme picker Sistem/Açık/Koyu: data-theme is written, on Sistem the attribute goes, saved",t1==="dark"&&s1==="dark"&&p1==="true"&&t2==="light"&&!de.hasAttribute("data-theme")&&ev("S.settings.theme")===""&&ev("JSON.parse(localStorage.getItem('nw_state')).settings.theme")==="");
    ev("tab='today';render()");
  }
  { // daily meal groups, water merge, add-food order
    const q=s=>$q(s),lg=()=>q(".log").textContent,mk=(t,time,v,x)=>({id:0,day:ev("dayKey()"),time,type:t,v,text:t==="food"?"Menemen":"",...x});
    ev("closeSheet();tab='today';logOff=0;S.entries=[];S.nextId=1;render()");
    ok("cleanEntries: meal is on the allow list, invalid is dropped, no field on an old record",ev(`(()=>{const d=dayKey(),r=cleanEntries([{day:d,time:"09:00",type:"food",v:1,meal:"dinner"},{day:d,time:"09:00",type:"food",v:1,meal:"x"},{day:d,time:"09:00",type:"food",v:1},{day:d,time:"09:00",type:"water",v:1,meal:"dinner"}]).out;return r.map(e=>e.meal).join()})()`)==="dinner,,,");
    ev(`S.entries=cleanEntries([${JSON.stringify(mk("food","08:10",200))},${JSON.stringify(mk("food","13:00",300))},${JSON.stringify(mk("food","19:00",150,{meal:"snack"}))},${JSON.stringify(mk("water","09:00",250))},${JSON.stringify(mk("water","10:00",250))},${JSON.stringify(mk("water","11:00",500))}]).out;render()`);
    const heads=[...w.document.querySelectorAll(".log .gh")].map(h=>h.textContent);
    ok("grouped by daily meal, each group has a kcal subtotal; default meal from meal time, a record with meal stays in its chosen group",heads.join("|")==="Kahvaltı200 kcal|Öğle300 kcal|Atıştırmalık150 kcal",heads);
    ok("water records are a single row in the log: 'Su: 1,0 L, 3 kez' format",w.document.querySelectorAll(".log [data-waterall]").length===1&&lg().includes("Su: 1,0 L, 3 kez")&&!lg().includes("250 ml"),lg());
    q("[data-waterall]").click();
    ok("tapping the water row opens a detail page: each record with time and a 44 px delete button",q("#sheet").textContent.includes("09:00")&&q("#sheet").textContent.includes("500 ml")&&q("#sheet").querySelectorAll("[data-del]").length===3);
    q("#sheet [data-del]").click();
    ok("deleting from the detail removes the record, the summary updates, the page stays open",ev("S.entries.filter(e=>e.type==='water').length")===2&&lg().includes("2 kez")&&q("#sheet").classList.contains("on")&&q("#sheet").querySelectorAll("[data-del]").length===2);
    ev("closeSheet()");
    q('[data-meal="1"]').click();
    q('[data-mset="1:dinner"]').click();
    ok("the meal can be changed: the record gets meal, the group changes, the record is stored",ev("S.entries.find(e=>e.id===1).meal")==="dinner"&&[...w.document.querySelectorAll(".log .gh")].map(h=>h.querySelector("b").textContent).join()==="Öğle,Akşam,Atıştırmalık"&&JSON.parse(ev("localStorage.getItem('nw_state')")).entries.find(e=>e.id===1).meal==="dinner");
    ev("S.entries=[];render()");
    ok("with only water no meal header appears",(ev("add('water',250);render();1"),w.document.querySelectorAll(".log .gh").length===0&&lg().includes("Su: 250 ml, 1 kez")));
    ev("S.entries=[];render();sheetFood()");
    const ch=[...q("#sheet").children].filter(n=>!n.matches(".shx")).map(n=>n.id||n.className);
    ok("add food: the search box is right under the header, before the buttons and lists",ch.indexOf("fq")===2&&ch.indexOf("fq")<ch.indexOf("frl")&&q("#sheet").querySelector(".qrow")&&ch.indexOf("fq")<ch.indexOf("qrow"),ch);
    q("#ft").value="Simit";q('#fml [data-ml="dinner"]').click();q('[data-go="food"]').click();
    ok("add food: the chosen meal is written to the record, a single chip is selected",ev("S.entries[0].meal")==="dinner"&&ev("S.entries[0].text")==="Simit");
    ev("S.favFoods=[{text:'Elma',v:50}];sheetFood()");q('#fml [data-ml="breakfast"]').click();q("[data-fv]").click();
    ok("adding from a favorite uses the selected meal",ev("S.entries.find(e=>e.text==='Elma').meal")==="breakfast");
    ev("S.favFoods=[];S.entries=[];render()");
  }
  { // Trend: empty state, axis by data, value bubble, a single 'Daha fazla ölçüm' list
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.goalKg=0;closeSheet();tab='trend';render()");
    ok("with an empty trend: a single empty-state card, an add-weight button; no chart, range picker or empty table",q(".empty")&&q(".empty").textContent.includes("İlk tartını ekle")&&!q("svg.chart")&&!q("#view table")&&!q("[data-range]")&&!!q('.empty [data-act="weight"]'));
    q('.empty [data-act="weight"]').click();
    ok("the button in the empty state opens the add-weight page",q("#sheet").classList.contains("on")&&q("#sheet").textContent.includes("Kilo"));
    const wts=g=>ev(`closeSheet();S.settings.goalKg=${g};S.entries=[];for(let i=29;i>=0;i--)S.entries.push({id:i+1,day:keyOff(-i),time:"07:00",type:"weight",v:86+(i%7)*.5,text:""});range=30;render()`);
    const ticks=()=>qa("svg.chart text[text-anchor=end]").map(t=>t.textContent).filter(t=>/^\d+,\d$/.test(t)).map(t=>+t.replace(",","."));
    wts(60);
    ok("weight axis by data: a far target (60 kg) does not pull the axis to zero/target, it is shown at the edge with a down-arrow label",Math.min(...ticks())>84&&Math.max(...ticks())<91&&q("svg.chart").textContent.includes("▼ Hedef 60,0 kg")&&!q('svg.chart line[stroke="var(--kcal)"]'),ticks());
    wts(87);
    ok("if the target is within the data range the line is drawn, no edge label",!!q('svg.chart line[stroke="var(--kcal)"]')&&!q("svg.chart").textContent.includes("Hedef 87"));
    ev("S.entries=S.entries.filter(e=>e.day===keyOff(0));render()");
    ok("with a single weigh-in the axis does not collapse (at least a 2 kg span), the range picker stays",q("[data-range]")&&!/NaN/.test(q("#view").innerHTML));
    wts(0);
    const tipSvg=q("svg.chart"),P=JSON.parse(tipSvg.dataset.tip);
    ok("value bubble data: a point for every weigh-in, day, kg and trend",P.length===30&&/kg · trend/.test(P[0][2])&&P.every(p=>p[0]>=0&&p[1]>=0));
    tipSvg.dispatchEvent(Object.assign(new w.Event("pointerdown",{bubbles:true}),{clientX:P[10][0]}));
    const tp=q("svg.chart .tip");
    ok("tapping shows the nearest point's bubble (a single bubble), the bubble is inside the viewBox",!!tp&&tp.textContent===P[10][2]&&qa("svg.chart .tip").length===1&&+tp.querySelector("rect").getAttribute("x")>=2);
    tipSvg.dispatchEvent(Object.assign(new w.Event("pointerdown",{bubbles:true}),{clientX:P[29][0]}));
    ok("tapping another point moves the bubble, at the end it does not overflow the edge",qa("svg.chart .tip").length===1&&q("svg.chart .tip").textContent===P[29][2]&&+q("svg.chart .tip rect").getAttribute("x")+ +q("svg.chart .tip rect").getAttribute("width")<=340);
    q("#view h2, #view .seg").dispatchEvent(new w.Event("pointerdown",{bubbles:true}));
    ok("tapping outside the chart removes the bubble",!q("svg.chart .tip"));
    ev("for(let i=0;i<5;i++){add('food',1800,'Öğün',keyOff(-i));add('water',2000,'',keyOff(-i));add('exercise',30,'Yürüyüş',keyOff(-i))}tSec='weight';render()");
    ok("Trend tabs: Kilo, Beslenme, Hareket; only the selected panel shows, chart and summary above the tabs",qa('[role="tab"]').map(b=>b.dataset.tsec).join()==="weight,nutrition,motion"&&qa(".tpan:not([hidden])").length===1&&!q("#tp-weight").hidden&&ev("viewTrend()").indexOf("svg")<ev("viewTrend()").indexOf('role="tablist"'));
    q('[data-tsec="nutrition"]').click();
    ok("Nutrition tab: calorie and water bar chart, target line, value bubble data",!q("#tp-nutrition").hidden&&q("#tp-weight").hidden&&q('[data-tsec="nutrition"]').getAttribute("aria-selected")==="true"&&qa("#tp-nutrition svg.bars").length===2&&!!q("#tp-nutrition svg.bars line[stroke-dasharray]")&&JSON.parse(q("#tp-nutrition svg.bars").dataset.tip).length===30);
    ok("the Movement tab has the sport chart and cardio",qa("#tp-motion svg.bars").length>=1&&!!q('#tp-motion [data-ckg="open"]'));
    ev("tSec='weight'");
    // reports
    const rep=()=>qa("#view summary").filter(h=>h.textContent==="Daha fazla ölçüm").length;
    ev("S.settings.bpOn=false;S.settings.bsOn=false;S.labs=[];render()");
    ok("Daha fazla ölçüm: only the weekly report (no row for closed modules and empty labs)",rep()===1&&!!q('[data-wk="pdf"]')&&!q('[data-vt^="pdfmenu"]')&&!q('[data-lab="pdf"]'));
    ev("S.settings.bpOn=true;S.settings.bsOn=true;S.labs=[{id:1,day:keyOff(0),n:'Glukoz',v:90,u:'mg/dL'}];render()");
    ok("Daha fazla ölçüm: with open modules and lab data the reports are in the same list, 44 px rows",rep()===1&&!!q('[data-wk="pdf"]')&&!!q('[data-vt="pdfmenu:t"]')&&!!q('[data-vt="pdfmenu:s"]')&&!!q('[data-lab="pdf"]')&&/\.row,\.prow[^{]*\{[^}]*min-height:56px/.test(html));
    ok("the PDF button is gone from the sub-screens (blood pressure, sugar, labs)",["bp","glucose","labs"].every(t=>{ev(`tab='${t}';render()`);return !q('#view [data-vt^="pdfmenu"]')&&!q('#view [data-lab="pdf"]')}));
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // Gym: filter sheet, template preview, empty set, "tekrar"
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
    ev("S=structuredClone(DEF);S.settings.obDone=true;gLReg=gLCat=gLEq='Tümü';tab='exlib';render()");
    ok("library: no filter chips on the page, the Filtre button (no badge) and the search box are on the same row",!q("#glreg")&&!q("#glcat")&&!q("#gleq")&&q("#glfb .badge")===null&&q("#glfb").parentNode.contains(q("#glq")));
    q('[data-g="lfilter"]').click();
    ok("Filter sheet: region, type, equipment groups",!!q("#sheet #glreg")&&!!q("#sheet #glcat")&&!!q("#sheet #gleq"));
    q('[data-g="lreg:Biseps"]').click();
    ok("the active filter count is on the badge (1), list and button counts are current",q("#glfb .badge").textContent==="1"&&q("#glok").textContent===`${ev("exFiltered().length")} sonucu göster`&&qa("#gllist .exrow").length===ev("exFiltered().length"));
    q('[data-g="leq:Salon"]').click();
    ok("two filters: badge 2",q("#glfb .badge").textContent==="2");
    q('[data-g="lclear"]').click();
    ok("clear: all selected, the badge goes",q("#glfb .badge")===null&&q('#sheet [data-g="lreg:Tümü"]').getAttribute("aria-pressed")==="true"&&q('#sheet [data-g="leq:Tümü"]').getAttribute("aria-pressed")==="true");
    ev("closeSheet()");
    // template preview
    ev(`S.workouts=[];S.exCfg={};S.gid=1;S.templates=[{id:1,name:"Üst",ex:["squat","plank"],tg:{squat:{sets:4,reps:6,hi:10},plank:{sets:3,sec:45}}}];tab='gym';render()`);
    q(".tmain").click();
    ok("tapping a template shows a preview first: exercises and target sets, the workout does not start",ev("gActive()")==null&&q("#sheet h3").textContent==="Üst"&&q("#sheet").textContent.includes("Squat")&&q("#sheet").textContent.includes("4 set · 6–10 tekrar")&&q("#sheet").textContent.includes("3 set · 45 sn")&&!q("#sheet").textContent.includes("?"),q("#sheet").textContent);
    q('#sheet [data-g="closesheet"]').click();
    ok("Vazgeç: the workout does not start",ev("gActive()")==null&&!q("#sheet").classList.contains("on"));
    q(".tmain").click();q('[data-g="startgo:1"]').click();
    ok("Başlat: the workout opens with the template's set count",ev("gActive().ex[0].sets.length")===4&&ev("gActive().ex.length")===2);
    ok("the empty workout button starts without a preview",(ev("S.workouts=[];tab='gym';render()"),q('.btn[data-g="start:"]').click(),ev("gActive()")!=null));
    // empty set
    const bw=ev("EXDB.find(e=>e.k==='b').id");
    ev(`S.workouts=[{id:5,day:keyOff(-3),t0:1000,t1:2000,name:"Eski",tpl:null,ex:[{id:'squat',note:'',sets:[{kg:100,reps:8,done:true}]}]}];S.gid=10;gStart(null);gAddEx(gActive(),'squat');gAddEx(gActive(),'curl');gAddEx(gActive(),'${bw}');const a=gActive();a.ex[0].sets[0].kg=null;a.ex[0].sets[0].reps=null;a.ex[1].sets[0].kg=null;a.ex[1].sets[0].reps=null;a.ex[2].sets[0].kg=null;a.ex[2].sets[0].reps=null;render()`);
    ok("the reps box hint is 'tekrar' (no abbreviation)",q('[data-gi="reps:0:0"]').getAttribute("placeholder")==="tekrar"&&!/placeholder="tek"/.test(fs.readFileSync(www("modules/gym/gym.js"),"utf8")));
    q('[data-g="done:0:0"]').click();
    ok("empty set checkmark (previous session exists): does not save silently, asks to confirm with the previous value",ev("gActive().ex[0].sets[0].done")===false&&q("#sheet").textContent.includes("Önceki seansta")&&q("#sheet").textContent.includes("100 kg × 8 tekrar"),q("#sheet").textContent);
    q('[data-g="closesheet"]').click();
    ok("Kendim yazayım: the set stays empty, 0 is not written",ev("gActive().ex[0].sets[0].done")===false&&ev("gActive().ex[0].sets[0].kg")==null);
    q('[data-g="done:0:0"]').click();q('[data-g^="fillok"]').click();
    ok("Bu değerle tamamla: the previous session's kg and reps are written, the set is done",ev("JSON.stringify(gActive().ex[0].sets[0])")==='{"kg":100,"reps":8,"done":true}',ev("JSON.stringify(gActive().ex[0].sets[0])"));
    fire('[data-gi="reps:1:0"]',"10");q('[data-g="done:1:0"]').click();
    ok("with no previous session and an empty kg a clear warning, not saved",ev("gActive().ex[1].sets[0].done")===false&&q("#toast").textContent.includes("Ağırlığı yaz")&&!q("#sheet").classList.contains("on"),q("#toast").textContent);
    q('[data-g="done:1:0"]').click();
    fire('[data-gi="reps:2:0"]',"12");q('[data-g="done:2:0"]').click();
    ok("for a no-weight (body weight) move kg may be empty, saved as 0",ev("gActive().ex[2].sets[0].done")===true&&ev("gActive().ex[2].sets[0].kg")===0);
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // chart readability: blood pressure label/band/shape, step day abbreviations, sugar shapes
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.bpOn=true;S.settings.bsOn=true;S.settings.bpSysHi=0;S.settings.bpDiaHi=0;S.vitals=[];for(let i=0;i<5;i++){const d=keyOff(-i);S.vitals.push({id:i*3+1,k:'t',day:d,time:'08:00',sys:120+i*4,dia:78+i,session:'morning',sid:'a'+i},{id:i*3+2,k:'s',day:d,time:'07:00',g:90+i,ctx:'fasting'},{id:i*3+3,k:'s',day:d,time:'21:00',g:140+i,ctx:'after'})}vRange=14;tab='bp';render()`);
    let c=q("#view svg.chart");
    ok("blood pressure: the series name is in the description (no label overlapping the axis), axis numbers on the left; besides colour a shape: systolic circle, diastolic square + dashed line",!c.textContent.includes("Sistolik")&&c.parentNode.querySelector(".legend").textContent.includes("Sistolik")&&c.parentNode.querySelector(".legend").textContent.includes("Diyastolik")&&[...c.querySelectorAll('text[text-anchor="end"]')].filter(t=>+t.getAttribute("x")===34).length===4&&c.querySelectorAll("circle").length===5&&c.querySelectorAll("rect").length>=5&&!!c.querySelector("polyline[stroke-dasharray]"));
    ok("blood pressure: the legend draws a marker for every series (line + shape), not relying on colour names",qa("#view .legend span").length===2&&qa("#view .legend span").every(x=>x.querySelector("svg line")&&x.querySelector("svg circle,svg rect"))&&!q("#view").textContent.includes("Yeşil: büyük"));
    ok("blood pressure: no band, red marker or reference note; old stored thresholds produce no interpretation either",ev("S.settings.bpSysHi=135;S.settings.bpDiaHi=85;render();1")&&!q("#view svg.chart rect[opacity]")&&!/referans|Kırmızı|gölgeli/i.test(q("#view").textContent)&&!q("#view").innerHTML.includes("var(--warn)"));
    c=q("#view svg.chart");
    const P=JSON.parse(c.dataset.tip);
    c.dispatchEvent(Object.assign(new w.Event("pointerdown",{bubbles:true}),{clientX:P[0][0]}));
    ok("tapping the blood pressure chart shows a value bubble (day, time, series, value)",/Sistolik|Diyastolik/.test(q("#view svg.chart .tip").textContent)&&/\d{3}|\d{2}/.test(q("#view svg.chart .tip").textContent));
    ev("tab='glucose';render()");c=q("#view svg.chart");
    ok("sugar: a separate shape per context (circle, triangle), legend with name and marker",qa("#view .legend span").length===2&&!!c.querySelector("polygon")&&c.querySelectorAll("circle").length===5&&qa("#view .legend").pop().textContent.includes("Açlık")&&!q("#view").textContent.includes("Yeşil: açlık"));
    // steps
    ev(`S.settings.stepsOn=true;S.entries=[];for(let i=0;i<14;i++)S.entries.push({id:i+1,day:keyOff(-i),time:"20:00",type:"steps",v:i%2?4000:9000,text:""});S.settings.stepGoal=8000;tab='steps';render()`);
    const labs=qa("#view svg.bars text").map(t=>t.textContent).filter(t=>t!=="✓");
    ok("step chart: at 14 days labels do not overlap (at most 3 date labels), at 7 days all are Pzt/Sal/Çar/Per/Cum/Cmt/Paz",labs.length>=1&&labs.length<=3&&labs.every(t=>!/^(Pzt|Sal|Çar|Per|Cum|Cmt|Paz)$/.test(t))&&(ev(`stepRange=7;render()`),qa("#view svg.bars text").map(t=>t.textContent).filter(t=>t!=="✓").length===7&&(ev(`stepRange=14;render()`),true)));
    ok("step chart: days that reach the goal are marked with a checkmark besides colour, one colour",qa("#view svg.bars text").filter(t=>t.textContent==="✓").length===7&&new Set(qa("#view svg.bars rect").map(r=>r.getAttribute("fill"))).size===1&&q("#view").textContent.includes("✓ ve koyu çubuk"));
    ok("step chart labels are inside the viewBox (not clipped at the edge)",qa("#view svg.bars text").every(t=>+t.getAttribute("x")>=10&&+t.getAttribute("x")<=310));
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // body measurements
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)],txt=()=>q("#view").textContent;
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.heightCm=170;tab='today';render()");
    ev("tab='trend';render()");
    ok("Trend: the Vücut ölçüleri card has an Ölçü ekle button, none on Today",!!q('#view [data-ms="open"]')&&!ev("viewToday()").includes('data-ms="open"'));
    const add=(k,v,day)=>{ev("closeSheet();sheetMeasures()");q(`[data-ms="k:${k}"]`).click();q("#fv").value=v;if(day)q("#fday").value=day;q('[data-ms="go"]').click()};
    ev("sheetMeasures()");
    ok("page: 5 region chips, the first selected; labelled field placeholder",qa('#mk .chip').length===5&&q('#mk .chip').getAttribute("aria-pressed")==="true"&&q('label[for="fv"]').textContent.includes("cm")&&q("#fv").placeholder.startsWith("örn."));
    for(const v of ["19","251","abc",""]){q("#fv").value=v;q('[data-ms="go"]').click();}
    ok("outside 20-250 and non-numbers are rejected, the error is under the field, no record",ev("S.measures.length")===0&&q("#merr").textContent.includes("20 ile 250"));
    add("waist","88,4");add("waist","86,0",ev("keyOff(-6)"));add("hip","101");
    ok("record: waist 88.4 and 86.0, hip 101; goes through Algo cleaning",JSON.stringify(ev("S.measures.map(m=>m.k+m.v)"))==='["waist86","waist88.4","hip101"]',ev("JSON.stringify(S.measures)"));
    add("waist","87");
    ok("same day and region: the new replaces the old",ev("S.measures.filter(m=>m.k==='waist'&&m.day===dayKey()).length")===1&&ev("S.measures.find(m=>m.k==='waist'&&m.day===dayKey()).v")===87);
    ev("closeSheet();tab='trend';render()");
    ok("Trend: the measurement chart is a 2-point line, waist/height ratio with a general information note (no diagnosis/interpretation)",qa("#view svg.chart[aria-label='Bel ölçü grafiği'] circle").length===2&&txt().includes("0,51")&&txt().includes("tanı ya da yorum değildir")&&!/yüksek|riskli|obez|şişman/i.test(txt()));
    q('#view [data-ms="k:hip"]').click();
    ok("region chosen: hip has a single measurement so information instead of a chart",txt().includes("en az iki ölçü")&&q('#view [data-ms="k:hip"]').getAttribute("aria-pressed")==="true");
    ev("msel='waist';render()");
    // backup, cleanup, deletion, CSV, Coach
    const back=JSON.parse(ev("JSON.stringify(S)"));
    ok("backup: S.measures is in the backup and survives a restore; an old backup (no field) gives an empty array",ev(`Algo.cleanMeasures(${JSON.stringify(back.measures)}).length`)===3&&ev("cleanHealthState({}).measures.length")===0&&ev("cleanHealthState({measures:'x'}).measures.length")===0);
    const many=JSON.stringify(Array.from({length:450},(_,i)=>({day:new Date(Date.UTC(2024,0,1+i)).toISOString().slice(0,10),k:"waist",v:80})));
    ok("cleaner: a measurement beyond the old limit (400) is not lost, the input array is not changed",ev(`(()=>{const a=${many};const r=Algo.cleanMeasures(a);return r.length===450&&a.length===450&&r[449].day===a[449].day&&r[0].day===a[0].day})()`));
    ok("CSV: a measurement row in the kayitlar file (type ölçü_bel, unit cm, decimal comma), no new file",(()=>{const f=ev("pvCsv()");return f.length===9&&f[0].build().includes("ölçü_bel;87;cm")&&f[0].build().includes("ölçü_kalça;101;cm")})());
    ok("measurements do not enter the Coach context",!/ölçü|measure|87|101|bel/i.test(JSON.stringify(ev("cData()")).replace(/belirt|belki/gi,"")));
    ev("sheetPrivacy()");
    ok("category deletion: Vücut ölçüleri is in the list, deleting removes only measurements",ev("PV_CATS.some(c=>c[0].startsWith('Vücut ölçüleri'))")&&(ev("pvDelete(PV_CATS.findIndex(c=>c[0].startsWith('Vücut ölçüleri')))"),ev("S.measures.length")===0));
    ev("closeSheet();tab='trend';render()");
    ok("with no measurements the Trend card offers Ölçü ekle with an empty state",txt().includes("Vücut ölçüleri")&&!!q('#view [data-ms="open"]'));
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // workout calories
    const q=s=>$q(s),click=s=>q(s).click();
    ev("S=structuredClone(DEF);S.settings.obDone=true;add('weight',80);S.gid=50;tab='gym';render()");
    const sets=n=>"["+Array.from({length:n},()=>"{kg:50,reps:8,done:true}").join(",")+"]";
    const W=(id,min,n)=>`S.workouts=[{id:${id},day:dayKey(),t0:Date.now()-${min}*60000,t1:null,name:'Güç',tpl:null,ex:[{id:'squat',note:'',sets:${sets(n)}}]}];S.entries=S.entries.filter(e=>e.type!=='exercise');gFinish()`;
    ev(W(51,50,20));
    ok("when a session ends the sport record keeps the minute pattern, the kcal field is net MET 6: 5x80x50/60=333",ev("S.entries.find(e=>e.type==='exercise'&&e.wid===51).v")===50&&ev("S.entries.find(e=>e.wid===51).kcal")===333);
    ok("the workout summary shows the estimated calories with a label",q("#sheet").textContent.includes("~333 kcal")&&q("#sheet").textContent.includes("tahmin"));
    ev("closeSheet();tab='today';render()");
    ok("Today log: the sport record with estimated calories",q("#view").textContent.includes("~333 kcal tahmini"));
    ok("kcal survives reload/backup; an invalid kcal is dropped, an old record (no kcal) is valid",ev("cleanEntries(S.entries).out.find(e=>e.type==='exercise').kcal")===333&&ev("cleanEntries([{type:'exercise',day:'2026-01-01',v:30,kcal:-5},{type:'exercise',day:'2026-01-01',v:30,kcal:99999},{type:'exercise',day:'2026-01-01',v:30,kcal:1.5}]).out.every(e=>e.kcal===undefined)")&&ev("cleanEntries([{type:'exercise',day:'2026-01-01',v:30}]).out.length")===1);
    ev("S.entries=S.entries.filter(e=>e.type==='weight')");ev("S.entries=[];");
    ev(W(52,40,10));
    ok("with no weight record calories are not written and do not show in the summary",ev("S.entries.find(e=>e.wid===52).kcal")===undefined&&!q("#sheet").textContent.includes("kcal"));
    ev("closeSheet();add('weight',80);sheetExercise()");click('[data-sp="Koşu"]');q("#fv").value="30";click('[data-go="exercise"]');
    ok("Spor ekle: kcal with the type's MET (Koşu 30 min, 80 kg: 7.3x80x0.5=292)",ev("S.entries.filter(e=>e.type==='exercise').pop().kcal")===292);
  }
  { // manual walk
    const unclock=require('./clock').at(w,12); // working near midnight a walk crosses the day boundary and the step difference is lost
    const q=s=>$q(s),qa=s=>[...w.document.querySelectorAll(s)];
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.heightCm=170;S.settings.stepsOn=true;add('weight',80);stepToday=null;stepsRead=false;closeSheet();tab='steps';render()");
    stepSteps=1000;await ev("stepsSync()");ev("render()");
    ok("Start walk on the Steps screen; no counter when none is running",q('#view [data-w="start"]')!==null&&q("#wclock")===null);
    await ev("walkStart()");
    ok("start: S.walk start time and sensor value, the counter shows",ev("S.walk.s0")===1000&&Math.abs(ev("S.walk.t0")-Date.now())<5000&&q("#wclock")!==null&&q('#view [data-w="stop"]')!==null);
    ok("reopening: S.walk is read from the record (the cleaner keeps it)",ev("Algo.cleanWalk(JSON.parse(localStorage.getItem('nw_state')).walk,Date.now())").t0===ev("S.walk.t0"));
    ev("S.walk.t0=Date.now()-3725000");
    ok("duration is computed from the end time (1:02:0x), the counter does not hold it",/^1:02:0\d$/.test(ev("wClock(wMs())")));
    ev("tab='today';render()");
    ok("on Today the walk-in-progress row leads to the Steps report",q("#view").textContent.includes("Yürüyüş sürüyor")&&(ev("tab='steps';render()"),q("#wclock")!==null));
    ev("S.walk.t0=Date.now()-40*60000");stepSteps=5000;
    await ev("walkStop()");
    const m1=ev("wMs()");for(const t=Date.now();Date.now()-t<30;);
    ok("stop: end and sensor are frozen, the duration does not grow when the page opens; step difference 4000",ev("S.walk.t1")>0&&ev("wMs()")===m1&&ev("S.walk.s1")===5000&&ev("walkSteps(S.walk)")===4000&&q("#wmin").value==="40");
    const exp=ev("Algo.moveSummary({kind:'w',min:40,steps:4000,cm:170,kg:80})");
    ok("preview: steps, ~km and ~kcal (estimate)",q("#wprev").textContent.includes("4.000 adım")&&q("#wprev").textContent.includes("2,72 km")&&q("#wprev").textContent.includes("~"+exp.kcal+" kcal"),q("#wprev").textContent);
    const stepsBefore=ev("JSON.stringify(S.entries.filter(e=>e.type==='steps'))");
    const wt1=ev("S.walk.t1");
    q('[data-w="save"]').click();
    const e=ev("S.entries.find(e=>e.type==='exercise')");
    ok("record: a single sport record, minute pattern, type name, ~km, net kcal, km field; the walk is finished",ev("S.entries.filter(e=>e.type==='exercise').length")===1&&e.v===40&&e.text.startsWith("Yürüyüş, ~2,72 km")&&e.kcal===exp.kcal&&e.km===2.72&&ev("S.walk")===null,JSON.stringify(e));
    ok("not double counted in the daily step counter: no step record added/changed, no manual step",ev("JSON.stringify(S.entries.filter(e=>e.type==='steps'))")===stepsBefore&&!ev("S.entries.some(e=>e.text==='manual')")&&ev("sum('steps',dayKey(),dayKey())")===5000);
    ok("a manual walk is saved at its end time (range [time-duration, time])",e.time===ev(`MotionLib.hmOf(${wt1})`)&&e.day===ev(`MotionLib.dayOf(${wt1})`),[e.time,e.day]);
    { // learned stride length: refreshed from MotionPlugin.status on Bitir and when the Save page opens on a cold start
      let fw=1.1;w.Capacitor.Plugins.Motion={status:async()=>({activity:true,fine:true,on:true,fw,fr:1}),walkGps:async()=>({gps:false})};const keepE=ev("JSON.stringify(S.entries)");
      ev("S.entries=S.entries.filter(e=>e.type!=='exercise');motionPerm=null;S.walk={t0:Date.now()-40*60000,s0:1000,t1:null,s1:null};stepSteps=5000;wKind='w';tab='steps';render()");
      await ev("walkStop()");
      ok("manual walk km with the learned scale (1.1 -> 2.99 km)",q("#wprev").textContent.includes("2,99 km"),q("#wprev").textContent);
      ev("closeSheet();motionPerm=null;render()");q('#view [data-w="sheet"]').click();await flush();
      q('[data-w="save"]').click();
      ok("on a cold start (no state) the Save page takes the scale, the record km is 2.99",ev("S.entries.find(e=>e.type==='exercise').km")===2.99,ev("JSON.stringify(S.entries.find(e=>e.type==='exercise'))"));
      fw=0.5;ev("S.entries=S.entries.filter(e=>e.type!=='exercise');S.walk={t0:Date.now()-40*60000,s0:1000,t1:null,s1:null};render()");await ev("walkStop()");
      ok("an invalid scale (0.5) is ignored, the height prior gives 2.72 km",q("#wprev").textContent.includes("2,72 km"),q("#wprev").textContent);
      ev(`closeSheet();S.walk=null;motionPerm=null;S.entries=${keepE}`);delete w.Capacitor.Plugins.Motion;
    }
    // bicycle, duration correction, discard, midnight, old walk
    ev("S.walk={t0:Date.now()-30*60000,s0:5000,t1:null,s1:null};stepSteps=5400;tab='steps';render()");
    await ev("wKind='b';walkStop()");
    q("#wmin").value="25";q("#wmin").dispatchEvent(new w.Event("input",{bubbles:true}));
    ok("bicycle: no steps or km, MET 6.8: 5.8x80x25/60=193 kcal",!q("#wprev").textContent.includes("km")&&q("#wprev").textContent.includes("~193 kcal"),q("#wprev").textContent);
    q("#wmin").value="0";q('[data-w="save"]').click();
    ok("an invalid duration is rejected, the walk is kept",ev("S.walk")!==null&&ev("S.entries.filter(e=>e.type==='exercise').length")===1);
    q('[data-w="drop"]').click();
    ok("Kaydetmeden at: S.walk is deleted, no record is added",ev("S.walk")===null&&ev("S.entries.filter(e=>e.type==='exercise').length")===1);
    ok("for a walk across midnight the step difference is ignored (no wrong number is produced)",ev("(()=>{const d=new Date();d.setHours(0,10,0,0);const t1=d.getTime();return walkSteps({t0:t1-20*60000,t1,s0:100,s1:900})})()")===null);
    ok("if the sensor goes backwards or the step counter is off (no s0) there is no step difference",ev("walkSteps({t0:Date.now()-6e4,t1:Date.now(),s0:900,s1:100})")===null&&ev("walkSteps({t0:Date.now()-6e4,t1:Date.now(),s0:null,s1:100})")===null);
    ok("a half walk older than 24 hours or in the future is dropped in cleaning",ev("Algo.cleanWalk({t0:Date.now()-25*36e5},Date.now())")===null&&ev("Algo.cleanWalk({t0:Date.now()+1e7},Date.now())")===null&&ev("Algo.cleanWalk({t0:Date.now()-36e5,s0:-5,t1:5},Date.now())").s0===null);
    ev("S=structuredClone(DEF);S.settings.obDone=true;stepToday=null;tab='today';render()");
    unclock();
  }
  { // add movement calories to the target
    const q=s=>$q(s),txt=()=>q("#view").textContent,wc=[];
    w.Capacitor.Plugins.Widget={update:async d=>{wc.push(d)}};
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.kcal=2000;S.settings.heightCm=170;S.settings.age=30;add('weight',80);widgetLast='';tab='today'");
    ev("add('exercise',60,'Ağırlık, A').kcal=300;S.entries.find(e=>e.type==='exercise').time='18:00';render()");
    ok("default OFF: the setting is false, target 2000, ring without an addition",ev("DEF.settings.moveKcalOn")===false&&ev("cleanSettings({}).moveKcalOn")===false&&ev("kcalGoal(dayKey())")===2000&&txt().includes("/ 2000 kcal")&&!txt().includes("Hedefe hareketten"));
    ev("tab='settings-profile';render()");
    ok("in Profil ve hedefler the setting, 50% and 'tahmin hatalıdır' with the reason steps are excluded",txt().includes("Hareket kalorisini hedefe ekle")&&txt().includes("%50")&&txt().includes("tahmin hatalıdır")&&txt().includes("Adımlar sayılmaz")&&q("[data-mk]").checked===false);
    q("[data-mk]").checked=true;q("[data-mk]").dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("once on it persists (the cleaner keeps it): target 2000 + 300x0.5 = 2150",ev("S.settings.moveKcalOn")===true&&ev("cleanSettings(JSON.parse(JSON.stringify(S.settings))).moveKcalOn")===true&&ev("kcalGoal(dayKey())")===2150);
    ev("tab='today';render()");
    ok("Today: ring with the new target (remaining = 2150 - eaten), the added part and a 'tahmindir' note",txt().includes("/ 2150 kcal")&&txt().includes("+150 kcal")&&txt().includes("tahmindir"));
    ev("add('food',500,'x');render()");
    ok("remaining calories from the new target: 2150-500=1650",txt().includes("1.650")||txt().includes("1650"));
    ok("the widget's remaining calories from the same target",wc.length>0&&wc[wc.length-1].kcalLeft===1650,JSON.stringify(wc[wc.length-1]));
    ev("add('steps',30000,'')");
    ok("steps do not add to the target: 30,000 steps do not change the target",ev("kcalGoal(dayKey())")===2150);
    ev("S.moves=[{day:dayKey(),t0:'17:30',min:30,k:'w',steps:3000,km:2,kmh:4,kcal:150,gps:false},{day:dayKey(),t0:'08:00',min:30,k:'w',steps:3000,km:2,kmh:4,kcal:100,gps:false}]");
    ok("automatic movement overlapping a sport interval is not counted (17:30 in [17:00,18:00]), a non-overlapping one is: (300+100)x0.5=200",ev("kcalGoal(dayKey())")===2200);
    ev("S.settings.moveKcalOn=false");
    ok("when the setting is turned off everything returns to the old target (ring, widget)",ev("kcalGoal(dayKey())")===2000);
    // a calorie-deficit-blocked (under 18) user: the target only rises, never falls; with no workout it never changes
    ev("S.settings.moveKcalOn=true;S.settings.age=16;S.settings.goalKg=70");
    ok("on a lossBlock profile the target cannot be below the floor",ev("Algo.lossBlock")({age:16,cm:170,kg:80,goalKg:70})!==""&&ev("kcalGoal(dayKey())")>=2000);
    ev("S.entries=S.entries.filter(e=>e.type!=='exercise');S.moves=[]");
    ok("with no movement record the target does not change",ev("kcalGoal(dayKey())")===2000);
    ev("S.settings.kcal=0;add('exercise',60,'x').kcal=300");
    ok("with no calorie target there is no addition either (target stays 0)",ev("kcalGoal(dayKey())")===0&&ev("moveAdd(dayKey())")===0);
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render()");
  }
  { // my own recipe
    const q=s=>$q(s),click=s=>q(s).click(),sh=()=>q("#sheet").textContent,inp=(sel,v)=>{const e=q(sel);e.value=v;e.dispatchEvent(new w.Event("input",{bubbles:true}))};
    const pick=n=>{inp("#rq",n);click('#rlist [data-rp^="pick:"]')};
    ev("S=structuredClone(DEF);S.settings.obDone=true;S.myFoods=[{n:'Evin bulguru',k:340,p:11}];tab='today';render();sheetFood()");
    ok("the Tarif oluştur button in Yemek ekle",!!q('[data-rp="new"]')&&q('[data-rp="new"]').offsetHeight>=0);
    click('[data-rp="new"]');
    ok("editor: name, portions, ingredient search; cooking note",!!q("#rn")&&!!q("#rq")&&q("#rnote").textContent.includes("pişince değişir"));
    inp("#rn","Mercimek köftesi");inp("#rs","4");pick("mercimek (haş");pick("evin bulg");pick("zeytinyağı");
    const g=ev("recipeDraft.items.map(i=>i.n+':'+i.g).join()");
    ok("ingredients are added from FOODS and my foods, the default grams from the portion",g==="Mercimek (haşlanmış):150,Evin bulguru:100,Zeytinyağı:10",g);
    inp('[data-rg="0"]',"200");inp('[data-rg="1"]',"100");inp('[data-rg="2"]',"20");
    ok("total and per-portion live: (238+340+176.8)=754.8 kcal, 189 kcal per portion, 80 g",q("#rsum").textContent.includes("189 kcal")&&q("#rsum").textContent.includes("755 kcal")&&q("#rsum").textContent.includes("80 g"),q("#rsum").textContent);
    ok("an item with missing data has no partial total, the note states the ingredient count (bulgur has only protein)",!/karbonhidrat/.test(q("#rsum").textContent)&&q("#rnote").textContent.includes("Karbonhidrat: 2/3 malzemede veri var"),q("#rnote").textContent);
    click('[data-rp="save"]');
    ok("saved: in S.recipes, no copy in myFoods",ev("S.recipes.length")===1&&ev("S.recipes[0].s")===4&&ev("S.myFoods.length")===1&&ev("S.recipes[0].items.length")===3);
    ev("sheetFood()");
    ok("shows in the Tariflerim list (kcal per portion)",sh().includes("Tariflerim")&&sh().includes("Mercimek köftesi")&&sh().includes("189 kcal"));
    inp("#fq","mercimek kö");
    ok("appears as a single food in search, labelled 'Tarifim'",q("#flist").innerHTML.includes("Mercimek köftesi")&&q("#flist").textContent.includes("Tarifim, 1 porsiyon: 189 kcal"));
    click('#flist [data-food]');
    ok("portion window: recipe note, edit link, no 'besini sil'",sh().includes("pişince değişir")&&!!q('[data-rp^="edit:"]')&&!q('[data-go="mydel"]'),sh());
    q("#fqty").value="2";ev("foodPreview()");
    ok("2 portions = 377 kcal and only the value with full data (protein) in the preview",q("#fprev").textContent.startsWith("377 kcal")&&q("#fprev").textContent.includes("protein")&&!q("#fprev").textContent.includes("karbonhidrat"),q("#fprev").textContent);
    ev("goNutrition()");
    ok("added to the log with one tap (with the portion count)",ev("S.entries.some(e=>e.type==='food'&&e.v===377&&e.text.startsWith('Mercimek köftesi, 2 × 1 porsiyon'))"));
    ev("sheetRecipe(S.recipes[0])");inp('[data-rg="2"]',"40");click('[data-rp="save"]');
    ok("editing updates the same recipe (does not open a copy)",ev("S.recipes.length")===1&&ev("S.recipes[0].items[2].g")===40);
    ev("sheetRecipe(S.recipes[0])");click('[data-rp="dup"]');
    ok("duplicate: an independent recipe named '(kopya)'",ev("S.recipes.length")===2&&ev("S.recipes[1].n")==="Mercimek köftesi (kopya)"&&ev("S.recipes[1].id")!==ev("S.recipes[0].id"));
    click('[data-rp="save"]');
    ev("sheetRecipe()");inp("#rn","mercimek KÖFTESİ");inp("#rs","2");pick("domates");click('[data-rp="save"]');
    ok("the same name (case-insensitive) is rejected",q("#rerr").textContent.includes("Bu adda")&&ev("S.recipes.length")===2);
    inp("#rn","Salata");inp("#rs","0");click('[data-rp="save"]');
    ok("a portion of 0 is rejected",q("#rerr").textContent.includes("1 ile 50")&&ev("S.recipes.length")===2);
    inp("#rs","2");inp('[data-rg="0"]',"0");click('[data-rp="save"]');
    ok("an ingredient with 0 grams is rejected, name and ingredients are kept",q("#rerr").textContent.includes("gramı")&&q("#rn").value==="Salata"&&ev("recipeDraft.items.length")===1);
    click('[data-rp="rm:0"]');click('[data-rp="save"]');
    ok("a recipe without ingredients is rejected",q("#rerr").textContent.includes("En az bir malzeme"));
    ev("closeSheet();S.recipes=[];sheetRecipe();recipeDraft.items.push({n:'P',g:100,k:100,portion:true});$('#rrows').innerHTML=rpRows()");inp('[data-rg="0"]',"1,1");
    ok("per-portion ingredient: 1.1 portions is exactly 110 g (no floating-point residue)",ev("recipeDraft.items[0].g")===110);
    ev("closeSheet();S.recipes=[{id:1,n:'a',s:1,items:[{n:'a',g:1,k:1}]}]");
    ev("closeSheet();S.recipes[0].items.push(...Array.from({length:40},(_,i)=>({n:'x'+i,g:1,k:1})));S.recipes=LogLib.cleanRecipes(S.recipes)");
    ok("item cap of 30",ev("S.recipes[0].items.length")===30);
    ev("S.recipes=Array.from({length:50},(_,i)=>({id:i+1,n:'t'+i,s:1,items:[{n:'a',g:1,k:1}]}));sheetRecipe()");inp("#rn","Yeni");pick("elma");click('[data-rp="save"]');
    ok("the 51st recipe is rejected",q("#rerr").textContent.includes("En fazla 50")&&ev("S.recipes.length")===50);
    ev("S.recipes=[{id:1,n:'Mercimek köftesi',s:4,items:[{n:'Mercimek',g:200,k:119,p:9}]}];closeSheet()");
    ok("backup/restore: cleanHealthState keeps recipes, an old backup (no field) gives empty",ev("cleanHealthState(JSON.parse(JSON.stringify(S))).recipes.length")===1&&ev("cleanHealthState({}).recipes.length")===0);
    ok("CSV: the recipes file has a row per ingredient",(()=>{const f=ev("pvCsv()").find(x=>x.key==="tarifler");return f&&f.n===1&&f.build().includes("Mercimek köftesi;4;Mercimek;200;119;9")})());
    ok("privacy: Tariflerim is in the category list, deleting removes the recipes, foods stay",ev("PV_CATS.find(c=>c[0]==='Tariflerim')[1]()")===1&&(ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Tariflerim'))"),ev("S.recipes.length")===0&&ev("S.myFoods.length")===1));
    ok("recipes do not go to the Coach context",(ev("S.recipes=[{id:1,n:'GizliTarifAdi',s:1,items:[{n:'GizliMalzeme',g:5,k:5}]}]"),!JSON.stringify(ev("cMessages('merhaba')")).includes("Gizli")));
    { // identity masking: no raw name, phone, TC or e-mail goes to the model; the reply is translated back locally
      reset();await ev("setKey('nvidia','K1')");
      ev("Object.assign(S.settings,{age:34,consent:true,consentV:CONSENT_V,consentP:'gemini,groq,nvidia,openrouter',healthNote:'Dr. Kerim Ozan 0541 222 33 44 verdi, TC 12345678901'});S.chat=[{id:1,role:'user',text:'Eşim Ayşe, mail ayse@posta.com',t:1}];S.entries=[{id:2,day:dayKey(),time:'09:00',type:'note',v:0,text:'Ahmet Yılmaz aradı'}]");
      const bodies=[];w.fetch=async(u,o)=>{bodies.push(o.body);return {ok:true,json:async()=>({choices:[{message:{content:'{"reply":"[AD1] selam","log":[]}'}}]})}};
      const r=await ev("cAsk(cMessages('Ben Mehmet, 0532 123 45 67'),50)");
      ok("Coach request: no raw name, phone, TC or e-mail in the body",bodies.length===1&&!/Ahmet|Kerim|Ayşe|Mehmet|0532|0541|12345678901|posta\.com/.test(bodies[0])&&/\[TELEFON\d\]/.test(bodies[0]),bodies[0]&&bodies[0].slice(0,300));
      ok("the label in the reply is translated back locally, the masking notice shows",r.text.includes("selam")&&!r.text.includes("[AD")&&$q("#tmsg").textContent.includes("parça maskelendi"),[r.text,$q("#tmsg").textContent]);
      ok("the model gets an age range, the local calculation uses the exact age",ev("cData().profile.age")===34&&JSON.stringify(ev("cMessages('x')")).includes("30-34 yaş")&&!/[^-\d]34 yaş/.test(JSON.stringify(ev("cMessages('x')"))));
      ev("S.settings.healthNote=''");
    }
    ev("S=structuredClone(DEF);S.settings.obDone=true;closeSheet();tab='today';render()");
  }
  { // range in meals
    const q=s=>$q(s);
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='today';render();sheetPortion(allFoods().findIndex(f=>f.n==='Mantı (haşlanmış)'))");
    q("#fqty").value="2";ev("foodPreview()");
    ok("preview: ~range and mean (2 x 200 g mantı: 700 mean, +/-30%)",q("#fprev").textContent.startsWith("700 kcal")&&q("#fprev").textContent.includes("Aralık ~524-876 kcal")&&q("#fprev").textContent.includes("protein"),q("#fprev").textContent);
    ok("it is stated in a note that this is an estimate, not a measurement; add saves the mean",q("#sheet").textContent.includes("tarif farkını")&&q("#sheet").textContent.includes("ölçüm değildir")&&q("#sheet").textContent.includes("ortalamayı"));
    ev("goNutrition()");
    ok("the record keeps the mean, the range only on the row: ~700 kcal, 524-876 range below",ev("S.entries[0].v")===700&&ev("S.entries[0].lo")===524&&ev("S.entries[0].hi")===876&&ev("viewToday()").includes("~700 kcal")&&ev("viewToday()").includes("<small class=\"db mut sm\">524-876</small>"));
    ok("the daily total uses the mean without the range (700)",ev("sum('food',dayKey(),dayKey())")===700);
    ev("sheetPortion(allFoods().findIndex(f=>f.n==='Haşlanmış yumurta'))");
    ok("a food without a range is a single number as before, no rule note",q("#fprev").textContent.startsWith("78 kcal")&&!q("#sheet").textContent.includes("kural tabanlı"),q("#fprev").textContent);
    ev("goNutrition()");
    ok("a record without a range has no lo/hi, no '~' on the row",ev("S.entries[1].lo")===undefined&&!ev("viewToday()").includes("~78 kcal"));
    const r=ev("JSON.stringify(cleanEntries([{day:dayKey(),type:'food',v:100,text:'a',lo:80,hi:120},{day:dayKey(),type:'food',v:100,text:'b',lo:101,hi:120},{day:dayKey(),type:'food',v:100,text:'c',lo:'x',hi:120},{day:dayKey(),type:'food',v:100,text:'d'},{day:dayKey(),type:'food',v:null,text:'e',lo:1,hi:2}]).out.map(e=>[e.lo,e.hi]))");
    ok("cleanEntries: a consistent range is kept, one not containing the mean or non-numeric is dropped, an old record unchanged",r==="[[80,120],[null,null],[null,null],[null,null],[null,null]]",r);
    ev("S=structuredClone(DEF);S.settings.obDone=true;closeSheet();tab='today';render()");
  }
  { // delete, delete steps, restore storage
    const SP=w.Storage.prototype,set0=SP.setItem,ls=w.localStorage,seed=()=>{ls.setItem("nw_state_previous",'{"settings":{"healthNote":"gizli"}}');ls.setItem("nw_state_corrupt","x");ls.setItem("nw_keys",'{"groq":"K"}');ls.setItem("nw_keys_enc","z")};
    const gone=()=>["nw_state_previous","nw_state_corrupt","nw_keys","nw_keys_enc"].every(k=>ls.getItem(k)===null);
    reset();seed();let msg="";w.confirm=m=>{msg=m;return true};
    ev("tab='settings-data';render()");$q('[data-act="reset"]').click();
    ok("Delete all data: the safety copy, the corrupt copy and API keys go too; the confirm text mentions the keys",gone()&&Object.keys(ev("getKeys()")).length===0&&msg.includes("Rehber anahtar"),[msg,Object.keys(ls)]);
    reset();seed();ev("S.meds=[{id:1,n:'A',t:['08:00']}]");ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='İlaç'))");
    ok("deleting a category also deletes the safety copy (deleted data does not stay there)",ls.getItem("nw_state_previous")===null);
    // steps: deleted history does not return with a sensor sync, a running walk is deleted
    reset();ev("S.settings.stepsOn=true;S.walk={t0:Date.now()-6e4,s0:0,t1:null,s1:null}");
    const SCp=w.Capacitor.Plugins;SCp.StepCounter={read:async()=>({steps:500,snapAt:1,history:{[ev("keyOff(-2)")]:3000,[ev("keyOff(-1)")]:4000}})};
    await ev("stepsSync()");const n0=ev("S.entries.filter(e=>e.type==='steps').length");
    ev("pvDelete(PV_CATS.findIndex(c=>c[0]==='Adım ve hareket'))");await ev("stepsSync()");
    ok("when steps are deleted the sensor history is not written back, S.walk is cleared",n0===3&&ev("S.entries.filter(e=>e.type==='steps').length")===0&&ev("S.walk")===null&&ev("S.settings.stepsFrom")>ev("dayKey()"),[n0,ev("S.settings.stepsFrom")]);
    ok("stepsFrom is absent in an old backup: empty, junk is dropped",ev("cleanSettings({}).stepsFrom")===""&&ev("cleanSettings({stepsFrom:5}).stepsFrom")===""&&ev("cleanSettings({stepsFrom:'2026-09-01'}).stepsFrom")==="2026-09-01");
    delete SCp.StepCounter;reset();
    // restore: new data first, then the copy; if the copy does not fit it is skipped
    const big=n=>JSON.stringify({entries:Array.from({length:n},(_,i)=>({id:i+1,day:"2026-09-01",time:"08:00",type:"note",v:null,text:"x".repeat(200)})),settings:{obDone:true}});
    const load=async t=>{w.document.body.insertAdjacentHTML("beforeend",'<textarea id="bk2"></textarea>');w.document.querySelector("#bk").value=t;await loadBackup()};
    ev("S.entries=[];for(let i=0;i<100;i++)add('note',null,'x'.repeat(200));save()");
    const a=ls.getItem("nw_state").length;await load(big(150));const b=ls.getItem("nw_state").length;
    ev("S.entries=[];for(let i=0;i<100;i++)add('note',null,'x'.repeat(200));save()");ls.removeItem("nw_state_previous");
    const Q=2*a+(b-a)/2,used=k=>{let t=0;for(let i=0;i<ls.length;i++){const x=ls.key(i);if(x!==k)t+=ls.getItem(x).length}return t};
    SP.setItem=function(k,v){if(used(k)+v.length>Q)throw new w.DOMException("dolu","QuotaExceededError");return set0.apply(this,arguments)};
    await load(big(150));
    ok("restore: the new data is written while there is room, a safety copy that does not fit is skipped",ev("S.entries.length")===150&&ls.getItem("nw_state_previous")===null&&!ev("saveFail"),[a,b,Q]);
    SP.setItem=set0;ev("S.entries=[{id:1,day:dayKey(),time:'08:00',type:'note',v:null,text:'x'}];save()");await load(big(5));
    ok("restore: when it fits the safety copy is written; the storage measure counts the copy and the corrupt copy",ls.getItem("nw_state_previous")!==null&&(ls.setItem("nw_state_corrupt","y".repeat(1e5)),ev("lsOther()"))>=2e5);
    ls.removeItem("nw_state_corrupt");w.confirm=()=>true;reset();
  }
  { // the Coach food card survives a reload
    reset();ev("S.chat=[];cReply({reply:'x',log:[],food:{name:'Lahmacun',kcal:300,protein:12.5}})");
    const c1=ev("JSON.stringify(S.chat.find(m=>m.card&&m.card.kind==='food').card)"),c2=ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))).chat.find(m=>m.card&&m.card.kind==='food').card)");
    ok("the Coach food card does not disappear through the cleaner, values the same",c1===c2&&c2.includes("Lahmacun"),[c1,c2]);
    reset();
  }
  { // under-18 single gate
    reset();await ev("setKey('nvidia','K1')");ev("S.settings.age=30;cConsent(true)");
    let n=0;w.fetch=async()=>{n++;return {ok:true,json:async()=>({choices:[{message:{content:'{"reply":"x","log":[]}'}}]})}};
    w.document.body.insertAdjacentHTML("beforeend",'<input id="ageIn" data-set="age">');
    const inp=w.document.querySelector("#ageIn");inp.value="16";inp.dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("once consent is given, setting the age to 16 drops the consent",ev("S.settings.consent")===false&&ev("S.settings.consentV")===0);
    ev("S.settings.consent=true;S.settings.consentP='gemini,groq,nvidia,openrouter';S.settings.consentV=CONSENT_V"); // old/external state
    ev("cSend('merhaba')");await ev("cFlush()");ev("progOpt={d:3,q:'Salon',m:45,l:'Başlangıç'}");await ev("cProgram(progOpt)");await ev("cMenu()");
    let t="none";try{await ev("cAsk([{role:'user',content:'x'}],10)")}catch(e){t=e.message}
    ok("under 18: chat, program, menu and direct cAsk send no request",n===0&&t==="consent",[n,t]);
    ok("backup/startup cleaner: consent is invalid if age<18, kept if 18+",ev("cleanSettings({consent:true,consentV:CONSENT_V,age:16}).consent")===false&&ev("cleanSettings({consent:true,consentV:CONSENT_V,age:30}).consent")===true);
    ok("in old data an under-18 age is kept (the brake chain continues)",ev("cleanSettings({age:15}).age")===15&&ev("cleanSettings({age:17,consent:true,consentV:CONSENT_V}).consent")===false);
    reset();ev("Object.assign(S.settings,{age:16,fastOn:true,heightCm:165});S.entries=[{id:1,day:dayKey(),time:'08:00',type:'weight',v:60,text:''}];save();S=load();tab='today';render()");
    const vb=$q("#view").textContent;
    ok("old under-18 data: a notice at startup, Coach off, hard brake, fasting cannot start",vb.includes("18 yaş ve üzeri için")&&!ev("coachOn()")&&ev("risk().hard").includes("18 yaş altındasın")&&!$q('[data-hb="fastgo"]'),vb.slice(0,300));
    reset();ev("S.chat=[];S.settings.age=0");
  }
  { // a new medication is not counted as missed on past days
    reset();ev("S.settings.medOn=true;tab='meds';render()");
    const doc=w.document,q=s=>doc.querySelector(s);
    ev("medOpen(0)");q("#mn").value="D vitamini 1000 IU";q("#mt0").value="23:59";q('[data-md="addtime"]').click();q("#mt1").value="00:00";q('[data-md="save"]').click();
    const m=ev("S.meds[0]"),t=ev("dayKey()"),y=ev("keyOff(1)");
    ok("a medication added without a day count gets a start (today), a time already passed starts tomorrow",m.s===t&&m.ts["00:00"]===y&&m.ts["23:59"]===t,m);
    const a=ev("MedLib.adherence(S.meds,S.medLog,keyOff(-29),dayKey(),dayKey(),'23:59')");
    ok("new medication: the 30-day adherence history does not count as missed",a.missed===0&&a.pct===null,a);
    ok("medication screen: no 0% and 0/29 on a new medication",!ev("viewMeds()").includes("kaçırılan")&&!ev("viewMeds()").includes("/ 29"));
    ev("medOpen(1)");q('[data-md="addtime"]').click();q("#mt2").value="12:00";q('[data-md="save"]').click();
    ok("a new time added while editing starts from its own day, old times are kept",ev("S.meds[0].ts['12:00']")>=t&&ev("S.meds[0].ts['00:00']")===y&&ev("S.meds[0].s")===t);
    ev("S.meds=[{id:1,n:'Eski',t:['08:00'],on:true}];S.medLog=[]");ev("medOpen(1)");q("#mn").value="Eski2";q('[data-md="save"]').click();
    ok("editing an old record (no s) does not break its history",ev("S.meds[0].s")===undefined&&ev("MedLib.adherence(S.meds,S.medLog,keyOff(-5),dayKey(),dayKey(),'23:59')").missed>=5);
    reset();
  }
  { // the consent text matches the real data and the policy
    const doc=require("fs").readFileSync(path.join(__dirname,"../docs/privacy-policy.md"),"utf8"),sent=ev("CONSENT_SENT"),note=ev("CONSENT_NOT");
    ok("consent text version 3; consent of an old version lapses",ev("CONSENT_V")===3&&ev("cleanSettings({consent:true,consentV:2}).consent")===false);
    ok("the in-app consent text and policy section 5 carry the same sent/not-sent list",doc.includes("**Rehber'e gönderilenler** (uygulama içindeki onay metniyle aynıdır): "+sent+".")&&doc.includes("**Rehber'e ne zaman gider:** "+ev("CONSENT_WHEN"))&&ev("consentHtml()").includes(ev("CONSENT_WHEN"))&&doc.includes("**Rehber'e gönderilmeyenler:** "+note)&&ev("consentHtml()").includes(sent)&&ev("consentHtml()").includes(note));
    reset();ev("S.myFoods=[{n:'Kendi besinim',k:100,p:5}];Object.assign(S.settings,{heightCm:170,age:34,sex:'m',act:1,kcal:1900})");
    const ctx=ev("CoachLib.contextText(cData())"),cat=ev("cMenuCat().text");
    ok("every datum named in the text is really sent: profile, calorie goal, own food names; the list names nothing else",ctx.includes("170 cm")&&ctx.includes("1900")&&cat.includes("Kendi besinim")&&["boyun","kalori hedefin","kendi besin"].every(k=>sent.includes(k))&&!/sağlık notun;|ilaç adı|son 14 günün|bugünkü kayıtların/.test(sent.replace("sağlık notun, ilaçların","")));
    ok("policy: a password is required on all backups (at least 10); body measurements and recipes are in the table",doc.includes("parola zorunludur, en az 10 karakterdir")&&doc.includes("vücut ölçüleri (bel, kalça")&&doc.includes("kendi tarifleri"));
    reset();
  }
  { // missing-meal note in the carbohydrate/fat total
    reset();ev("S.entries=[];{const e=add('food',300,'A');e.p=10;e.c=40;e.f=8}{const e=add('food',200,'B');e.p=5}");
    ok("Today: if a meal has no value, carbs/fat carry an 'n/m öğünde veri var' note",ev("viewToday()").includes("Karbonhidrat 1/2, yağ 1/2 öğünde veri var"));
    ev("S.entries=[];{const e=add('food',300,'A');e.p=10;e.c=40;e.f=8}");
    ok("if all meals have data there is no note",!ev("viewToday()").includes("öğünde veri var; toplam"));
    reset();
  }
  { // the Coach's portion food does not count as 100 g in a recipe
    reset();ev("S.myFoods=[{n:'Rehber lahmacun',k:300,p:10,portion:true},{n:'Gramlı besin',k:200,u:[['1 adet (50 g)',50]]}];sheetRecipe()");
    const pick=name=>{const r=$q("#rq");r.value=name;r.dispatchEvent(new w.Event("input",{bubbles:true}));$q('[data-rp="pick:0"]').click()};
    pick("Rehber lahmacun");pick("Gramlı besin");ok("a food added from a Coach card is stored with the portion flag, the cleaner keeps it",ev("(()=>{S.myFoods=[];Nutrition.addMy('Test',250,5);return S.myFoods[0].portion===true&&cleanMyFoods(S.myFoods)[0].portion===true&&cleanMyFoods([{n:'a',k:1}])[0].portion===undefined})()"));ev("S.myFoods=[{n:'Rehber lahmacun',k:300,p:10,portion:true},{n:'Gramlı besin',k:200,u:[['1 adet (50 g)',50]]}];sheetRecipe()");pick("Rehber lahmacun");pick("Gramlı besin");
    ok("Nutrition.putMy: same name (Turkish case-insensitive) or barcode replaces, a new food goes first, a full list refuses",ev("(()=>{S.myFoods=[];const P=f=>Nutrition.putMy(f);P({n:'Işık Çorbası',k:100});P({n:'Bar',k:50,b:'123'});P({n:'IŞIK çorbası',k:120});P({n:'Başka ad',k:60,b:'123'});const a=S.myFoods.map(f=>f.n+':'+f.k).join();S.myFoods=Array.from({length:MYFOODS_MAX},(_,i)=>({n:'F'+i,k:1}));return a==='Başka ad:60,IŞIK çorbası:120'&&P({n:'Yeni',k:1})===false&&S.myFoods.length===MYFOODS_MAX&&P({n:'F3',k:9})===true})()"));
    const gi=()=>[...w.document.querySelectorAll("[data-rg]")],sh=()=>$q("#sheet").textContent;
    ok("a food with unknown grams (Coach) goes into a recipe by portion, a food with grams by grams",ev("recipeDraft.items[0].portion")===true&&ev("recipeDraft.items[1].portion")===undefined&&sh().includes("1 porsiyon: 300 kcal")&&sh().includes("100 g: 200 kcal"));
    gi()[0].value="2";gi()[0].dispatchEvent(new w.Event("input",{bubbles:true}));gi()[1].value="100";gi()[1].dispatchEvent(new w.Event("input",{bubbles:true}));
    ok("2 portions of a Coach food = 600 kcal (not 100 g x 2), 100 g with grams = 200 kcal; total 800",ev("recipeDraft.items[0].g")===200&&$q("#rsum").textContent.includes("800 kcal"),$q("#rsum").textContent);
    $q("#rn").value="Karışık";$q("#rs").value="2";$q('[data-rp="save"]').click();
    ok("a saved recipe keeps portion; an old recipe (no portion) is unchanged; the recipe portion is 400 kcal",ev("S.recipes[0].items[0].portion")===true&&ev("LogLib.cleanRecipes([{n:'a',items:[{n:'x',g:100,k:50}]}])[0].items[0].portion")===undefined&&Math.round(ev("LogLib.recipeFood(S.recipes[0]).k*LogLib.recipeFood(S.recipes[0]).u[0][1]/100"))===400);
    reset();
  }
  { // recipe: optional cooked pot weight
    reset();ev("S.recipes=[];sheetRecipe()");
    ev("recipeDraft.items=[{n:'Pirinç',g:500,k:360},{n:'Su ve sebze',g:500,k:40}]");
    $q("#rn").value="Pilav";$q("#rs").value="4";$q("#rcw").value="5";$q('[data-rp="save"]').click();
    ok("recipe: a cooked weight far outside the raw total is refused with an explanation, nothing is saved",ev("S.recipes.length")===0&&$q("#rerr").textContent.includes("0,2 ile 5 katı"),$q("#rerr").textContent);
    $q("#rcw").value="850";$q("#rcw").dispatchEvent(new w.Event("input",{bubbles:true}));
    ok("recipe: the preview switches to the cooked weight",$q("#rsum").textContent.includes("850 g, pişmiş")&&$q("#rnote").textContent.includes("Pişmiş ağırlığa göre"),$q("#rsum").textContent);
    $q('[data-rp="save"]').click();
    ok("recipe: a valid cooked weight is saved and the food shape uses it",ev("S.recipes[0].cw")===850&&Math.round(ev("LogLib.recipeFood(S.recipes[0]).k"))===235);
    const bk=JSON.parse(ev("JSON.stringify(LogLib.cleanRecipes(S.recipes))"));
    ok("recipe: the cooked weight survives the cleaner used by backup and restore",bk[0].cw===850);
    ev("S.recipes=[];closeSheet()");
  }
  { // Trend > Hareket: weekly movement card
    reset();ev("S.settings.sportWeek=150;S.settings.age=0;tSec='motion';tab='trend';render()");
    const card=()=>[...w.document.querySelectorAll("#view .card")].map(c=>c.textContent).find(t=>t.includes("Kuvvet çalışması"))||(w.document.querySelector("#view").textContent.includes("henüz spor kaydı yok")?"EMPTY":"");
    ok("movement card: without records it only invites, no bars",card()==="EMPTY");
    ev("add('exercise',45,'Yürüyüş');add('exercise',50,'Bisiklet');S.workouts=[{id:1,name:'A',day:dayKey(),t0:1,t1:2,ex:[{id:'squat',sets:[1,2,3].map(()=>({reps:8,kg:20,done:true}))}]}];render()");
    const t=card();
    ok("movement card: minutes against the user's own goal, one strength day of two, the walking note and the guideline",/95 \/ 150 dk/.test(t)&&/1 \/ 2 gün/.test(t)&&/algıladığı yürüyüşler bu süreye eklenmez/.test(t)&&/WHO/.test(t),t);
    ok("movement card: the 65+ sentence appears only for 65 and over",!/65 yaş üstü/.test(t)&&(ev("S.settings.age=70;render()"),/65 yaş üstü/.test(card()))&&(ev("S.settings.age=0;render()"),!/65 yaş üstü/.test(card())));
    ok("movement card wording: no verdict words",!/yeterli|yetersiz|riskli|tebrik|harika|başardın/i.test(t));
    ev("S.workouts=[];Log.drop('exercise');tab='today';render()");
  }
  { // comfortable mode
    reset();
    ok("comfortable mode: off by default, survives the settings cleaner, junk becomes off",ev("cleanSettings({}).comfy")===false&&ev("cleanSettings({comfy:true}).comfy")===true&&ev("cleanSettings({comfy:'yes'}).comfy")===false);
    ev("S.settings.comfy=true;render()");
    ok("the switch puts data-comfy on the page root and removing it takes it off",w.document.documentElement.hasAttribute("data-comfy")&&(ev("S.settings.comfy=false;render()"),!w.document.documentElement.hasAttribute("data-comfy")));
  }
  { // fibre bar on Today: only when every meal has fibre data, for adults
    reset();ev("S.settings.age=40;S.entries=[];add('food',200,'Ekmek');add('food',150,'Çorba')");
    const fb=(a,b)=>ev("(()=>{const m=S.entries.filter(e=>e.type==='food');m[0].fb="+a+";"+(b===null?"delete m[1].fb":"m[1].fb="+b)+";return viewToday()})()");
    let h=fb(5,9.5);
    ok("fibre bar: every meal has data -> 'Lif 15 / en az 25 g' with the guideline sentence, no verdict words",h.includes("Lif <b>15</b> / en az 25 g")&&h.includes("Dünya Sağlık Örgütü önerisi günde en az 25 g")&&!/yetersiz|yüksek|düşük|normal|riskli/.test(h.slice(h.indexOf("Lif <b>"),h.indexOf("Lif <b>")+400)),h.slice(h.indexOf("Lif"),h.indexOf("Lif")+120));
    h=fb(5,null);
    ok("fibre bar: a meal without fibre data -> no bar, the partial total with n/m stays",!h.includes("en az 25 g")&&h.includes("(1/2)"));
    ev("S.settings.age=17");h=fb(5,9);
    ok("fibre bar: under 18 -> no bar",!h.includes("en az 25 g"));
    ev("S.settings.age=0");h=fb(5,9);
    ok("fibre bar: age unknown -> no bar",!h.includes("en az 25 g"));
    ev("S.entries=[]");
  }
  { // Ramadan mode
    reset();const q=s=>$q(s);ev("S.settings.age=40;S.meds=[];S.vitals=[];S.settings.healthNote='';S.settings.riskClearedAt='';S.settings.fastInfoOk=false;S.settings.ramOn=false;S.settings.ramLat=0;S.settings.ramLon=0;S.settings.ramName='';tab='settings-modules';render()");
    const R={times:(d,la,lo)=>ev(`RamadanLib.times('${d}',${la},${lo})`)},rdays=ev("[0,1,2,3,4,5,6].map(n=>RamadanLib.addDay(RamadanLib.tr(Date.now()).day,n))"),calls=[],geo={n:0,ok:true,la:39.93,lo:32.86,off:0};
    const add=(t,k)=>{const x=+t.slice(0,2)*60+ +t.slice(3,5)+k;return String(Math.floor(x/60)).padStart(2,"0")+":"+String(x%60).padStart(2,"0")};
    const rows=()=>rdays.map(d=>{const t=R.times(d,39.93,32.86);return {MiladiTarihUzunIso8601:d+"T00:00:00",Imsak:t[0],Aksam:add(t[1],geo.off)}});
    let net=true;
    w.fetch=async u=>{calls.push(String(u));if(!net)throw new Error("offline");return {ok:true,json:async()=>rows()}};
    Object.defineProperty(w.navigator,"geolocation",{value:{getCurrentPosition:(good,bad)=>{geo.n++;if(geo.ok)good({coords:{latitude:geo.la,longitude:geo.lo}});else bad({})}},configurable:true});
    const card=()=>[...w.document.querySelectorAll("#view .row")].map(r=>r.textContent).find(t=>/İftara|Sahura|Ramazan modu/.test(t))||"";
    const verified=()=>/doğrulandı/.test(card());
    ok("Ramadan mode: off by default, the Settings row is there, no location request, no internet",!ev("S.settings.ramOn")&&!!q('[data-ram="toggle"]')&&calls.length===0&&geo.n===0);
    ev("S.settings.age=17;render()");q('[data-ram="toggle"]').click();
    ok("Ramadan mode: a hard risk flag (under 18) keeps it closed with a reason, no sheet, no location, no request",!ev("S.settings.ramOn")&&!q("#sheet.on, #sheet[open]")&&calls.length===0&&geo.n===0&&q("#toast").textContent.includes("kapalı"));
    ev("S.settings.age=40;render()");q('[data-ram="toggle"]').click();
    ok("Ramadan mode: the first opening shows the doctor note and needs the tick",!!q('[data-ram="infook"]')&&!ev("S.settings.ramOn"));
    q('[data-ram="infook"]').click();ok("no tick, no opening, no location",!ev("S.settings.ramOn")&&geo.n===0);
    q("#ric").checked=true;q('[data-ram="infook"]').click();await flush();
    ok("Ramadan mode: after the tick it is on, the start day is set and the phone is asked for the location once",ev("S.settings.ramOn")&&ev("S.settings.fastInfoOk")&&ev("S.settings.ramFrom")===ev("dayKey()")&&geo.n===1);
    ok("Ramadan mode: the place is stored rounded with the nearest province; only that centre's table is requested; the comparison is cached on the phone",Math.abs(ev("S.settings.ramLat")-39.93)<1e-9&&ev("S.settings.ramName")==="Ankara"&&calls.length===1&&/vakitler\/9206$/.test(calls[0])&&JSON.parse(w.localStorage.getItem("nw_ram")).il===ev("RamadanLib.nearest(39.93,32.86).i")&&!JSON.stringify(ev("S")).includes("\"days\""));
    ev("tab='today';render()");
    ok("Ramadan mode: the Today card counts down, says it was verified against the Diyanet table and that the times are approximate",/İftara \d|Sahura \d/.test(card())&&verified()&&/yaklaşık/.test(card())&&/Ankara civarı/.test(card())&&!/Doğrula/.test(card()),card());
    ev("S.settings.ramSahur=true;S.settings.ramIftar=true");
    const rem=ev("Habits.ramReminders(Date.now(),0,7)");
    ok("Ramadan mode: reminders come from the calculation and only when the switches are on",rem.length>=1&&rem.every(x=>/yaklaşık/.test(x.body))&&ev("(()=>{S.settings.ramSahur=false;S.settings.ramIftar=false;return Habits.ramReminders(Date.now(),0,7).length})()")===0);
    ev("S.settings.ramSahur=true;S.settings.ramIftar=true;S.meds=[{id:1,n:'A',t:['08:00'],on:true}];S.settings.riskClearedAt='';render()");
    ok("Ramadan mode: a soft flag (medication) hides the times and the reminders until 'Hekimime danıştım'",/Hekimime danıştım/.test(card())&&!/İftara \d/.test(card())&&ev("Habits.ramReminders(Date.now(),0,7).length")===0);
    ev("S.settings.riskClearedAt=dayKey();render()");
    ok("Ramadan mode: after the confirmation the card and the reminders are back",/İftara \d|Sahura \d/.test(card())&&ev("Habits.ramReminders(Date.now(),0,7).length")>=1);
    ev("S.settings.ramFrom=keyOff(-40);render()");
    ok("Ramadan mode: after 31 days the card asks whether it is over",/Ramazan bitti mi/.test([...w.document.querySelectorAll("#view .row")].map(r=>r.textContent).join()));
    q('[data-ram="off"]').click();
    ok("Ramadan mode: closing it removes the card and the start day; the place stays for next year",!ev("S.settings.ramOn")&&ev("S.settings.ramFrom")===""&&ev("S.settings.ramLat")>0&&card()==="");
    // offline: the clock works, it says it was not verified, and the verify button waits for a tap
    ev("S.meds=[];S.settings.ramOn=true;S.settings.ramFrom=dayKey();S.settings.ramLat=0;S.settings.ramLon=0;S.settings.ramName='';tab='settings-modules';render()");
    w.localStorage.removeItem("nw_ram");ev("ramCache=undefined");net=false;calls.length=0;
    q('[data-ram="gps"]').click();await flush();ev("tab='today';render()");
    ok("Ramadan mode offline: the times are calculated and the card says they were not verified; the failed comparison only gives a notice",/İftara \d|Sahura \d/.test(card())&&/internetle doğrulanmadı/.test(card())&&/Doğrula/.test(card())&&calls.length===1&&q("#toast").textContent.includes("Doğrulanamadı"),card());
    ev("S.settings.ramSahur=true;S.settings.ramIftar=true");
    ok("Ramadan mode offline: reminders still work",ev("Habits.ramReminders(Date.now(),0,7).length")>=1);
    net=true;calls.length=0;geo.off=15;q('[data-ram="verify"]').click();await flush();
    ok("Ramadan mode: a table that differs from the calculation is shown instead, and the card says so",/tablodan saptı/.test(card())&&!verified()&&calls.length===1,card());
    geo.off=0;q('[data-ram="verify"]').click();await flush();
    ok("Ramadan mode: a later agreeing comparison makes it verified again",verified()&&!/Doğrula/.test(card()),card());
    // the place choices
    const n0=geo.n;geo.ok=false;q('[data-ram="gps"]')||ev("tab='settings-modules';render()");ev("tab='settings-modules';render()");q('[data-ram="gps"]').click();
    ok("Ramadan mode: a refused location permission leaves the place as it was and points to the list",geo.n===n0+1&&ev("S.settings.ramName")==="Ankara"&&q("#toast").textContent.includes("listeden"));
    geo.ok=true;geo.la=48.85;geo.lo=2.35;q('[data-ram="gps"]').click();
    ok("Ramadan mode: a position outside Turkey is not used",ev("S.settings.ramName")==="Ankara"&&Math.abs(ev("S.settings.ramLat")-39.93)<1e-9&&q("#toast").textContent.includes("Türkiye dışında"));
    q('[data-ram="place"]').click();
    ok("Ramadan mode: the list has the 81 provinces offline and no request is made to open it",w.document.querySelectorAll("#ramlist .prow").length===81);
    calls.length=0;[...w.document.querySelectorAll("#ramlist .prow")].find(b=>/İzmir/.test(b.textContent)).click();
    ok("Ramadan mode: choosing a province from the list sets the place without any request",ev("S.settings.ramName")==="İzmir"&&calls.length===0&&ev("S.settings.ramLat")>38&&ev("S.settings.ramLon")<28);
    ev("tab='settings-modules';render()");q('[data-ram="forget"]').click();
    ok("Ramadan mode: 'Konumu sil' removes the place and the cached comparison",ev("S.settings.ramLat")===0&&ev("S.settings.ramLon")===0&&ev("S.settings.ramName")===""&&w.localStorage.getItem("nw_ram")===null&&ev("Habits.ramReminders(Date.now(),0,7).length")===0);
    ok("Ramadan mode settings cleaner: an out-of-range place becomes 0, a valid one stays, control characters leave the name, a bad start day is dropped",ev("cleanSettings({ramLat:10,ramLon:99})").ramLat===0&&ev("cleanSettings({ramLat:10,ramLon:99})").ramLon===0&&ev("cleanSettings({ramLat:39.93,ramLon:32.86})").ramLat===39.93&&ev("cleanSettings({ramName:'A\\u0000B'})").ramName==="AB"&&ev("cleanSettings({ramFrom:'x'})").ramFrom==="");
    ev("S.meds=[];S.settings.riskClearedAt='';S.settings.ramOn=false;S.settings.ramLat=0;S.settings.ramLon=0;S.settings.fastInfoOk=false;tab='today';render()");delete w.fetch;delete w.navigator.geolocation;
  }
  { // "Kendi deneyin" (14-night personal comparison)
    reset();const q=s=>$q(s);
    ev("S.settings.obDone=true;S.sleep=[];S.settings.trial=null;tab='trend';tSec='bag';render()");
    ok("trial: without sleep records the offer is not shown (no empty tab)",!q('[data-tr="start"]'));
    ev("S.sleep=[1,2,3,4,5,6].map(i=>({day:keyOff(-i),min:420}));render()");
    ok("trial: with a few sleep records the offer is shown with the no-certainty note",!!q('[data-tr="start"]')&&q("#view").textContent.includes("Kesin bir sonuç vermez"));
    q('[data-tr="start"]').click();
    ok("trial: starting stores a valid plan; the card names tonight's plan and no result",ev("TrialLib.clean(S.settings.trial)!==null")&&ev("S.settings.trial.start")===ev("dayKey()")&&/Bu gece/.test(q("#view").textContent)&&!/ortalama uyku/.test(q("#view").textContent));
    ev("S.settings.trial.start=keyOff(-1);tab='today';render()");
    const row=()=>[...w.document.querySelectorAll("#view .row")].map(r=>r.textContent).find(t=>t.includes("Dün geceki plana uydun mu"));
    ok("trial: the next day Today asks about last night with Evet / Hayır",!!row()&&!!q('[data-tr="ans:y"]'));
    q('[data-tr="ans:y"]').click();
    ok("trial: the answer is stored on that night and the question goes away",ev("Object.keys(S.settings.trial.ans).length")===1&&!row());
    ev("S.settings.trial.start=keyOff(-16);S.settings.trial.ans={};tab='trend';tSec='bag';render()");
    ok("trial: when the 14 nights are over without answers the card says there is no result and gives no averages",q("#view").textContent.includes("Sonuç yok")&&!/ortalama uyku/.test(q("#view").textContent));
    q('[data-tr="stop"]').click();
    ok("trial: closing removes it and Undo brings it back",ev("S.settings.trial")===null&&(q("#tundo").click(),ev("S.settings.trial!==null")));
    ok("trial settings cleaner: a broken trial becomes null, a valid one is kept",ev("cleanSettings({trial:{start:'x',plan:'y'}}).trial")===null&&ev("cleanSettings({trial:{start:'2026-10-01',plan:'ABBAABABBABAAB',ans:{}}}).trial.plan")==="ABBAABABBABAAB");
    ev("S.settings.trial=null;S.sleep=[];tab='today';render()");
  }
  { // safety brake from one source, with real data
    const MED="[{id:1,n:'Vitamin D',t:['08:00'],on:true}]";
    const prof=`S.entries=[];S.chat=[];S.meds=[];S.vitals=[];Object.assign(S.settings,{heightCm:175,age:35,goalKg:80,healthNote:'',riskClearedAt:'',kcal:0});for(let i=0;i<20;i++)add('weight',90+i*0.1,'',keyOff(-i));`;
    reset();ev(prof);
    ok("clean profile: no KISIT, no confirm button, the goal duration in Trend",!ev("cCalc().block")&&!ev("gEnergy()").includes("riskok")&&/hafta(\.| arası\.)<\/p>|kestirilemiyor\.<\/p>/.test(ev("viewTrend()")));
    ev(`S.meds=${MED}`);
    const ctx=()=>ev("(()=>{const c=cCalc();return c.block?'KISIT: '+c.why:''})()");
    ok("90 kg with no note, medication record: the Coach KISIT line with a reason",ctx().includes("KISIT: İlaç kaydın var"),ctx().split("\n").filter(l=>l.includes("KISIT")));
    const tdee=ev("Math.round(cCalc().tdee/10)*10");
    ok("medication record: the suggested target is maintenance level, a 'Hekimime danıştım' button",ev("cCalc().target")===tdee&&ev("gEnergy()").includes('data-act="riskok"'));
    ev("tab='trend';render()");$q('[data-act="riskok"]').click();
    ok("'Hekimime danıştım': saved today, the button goes, a calorie deficit is suggested, KISIT goes",ev("S.settings.riskClearedAt")===ev("dayKey()")&&!$q('[data-act="riskok"]')&&ev("cCalc().target")<tdee&&!ctx().includes("KISIT"));
    ev("S.settings.riskClearedAt=keyOff(-30)");ok("the confirmation lapses after 30 days",ctx().includes("KISIT"));
    ev("S.settings.riskClearedAt='';S.meds=[];S.vitals=[{id:1,k:'t',day:keyOff(-10),time:'08:00',sys:128,dia:82,session:'morning'}]");
    ok("a blood pressure measurement in the last 90 days opens the brake",ctx().includes("tansiyon ölçümün var"));
    ev("S.vitals=[{id:1,k:'s',day:keyOff(-95),time:'08:00',g:110,ctx:'ac'}]");ok("a sugar measurement from 95 days ago does not count",!ctx().includes("KISIT"));
    ev("S.vitals=[];S.settings.age=16;S.settings.riskClearedAt=dayKey();tab='trend';render()");
    ok("hard block (under 18): no confirm button, confirmation does not lift it, an explanation",!$q('[data-act="riskok"]')&&$q("#view").textContent.includes("18 yaş altındasın")&&ctx().includes("KISIT: 18 yaş altındasın"));
    ok("Trend: under a block there is no time-to-goal estimate",!/hafta(\.| arası\.)<\/p>|kestirilemiyor\./.test(ev("viewTrend()")));
    ev("S.settings.age=35;S.settings.heightCm=0;S.settings.healthNote='hamileyim';S.entries=[]");
    ok("the pregnancy KISIT line goes even without height and weigh-in",ctx().includes("KISIT: Sağlık notunda hamilelik"));
    ev("S.settings.healthNote='';S.chat=[{id:1,t:1,role:'user',text:'x',fl:'ed'}]");
    ok("the chat ed flag is a KISIT and a menu block",ctx().includes("Yeme düzeniyle")&&!!ev("cMenuPlan().why"));
    { // chat brake: every code path goes through a single risk(); the user cannot lift it
      const gates=()=>ev("(()=>{const c=cCalc();return [!!cMenuPlan().why,!!(risk().ed||risk().pregnant),!!risk().block]})()")
      const brake=(chat,cr)=>ev(`${prof}S.chat=${chat};S.cid=5;S.settings.chatRisk='${cr}'`);
      const view=()=>{ev("tab='settings-profile';render()");return $q("#view")};
      brake("[{id:1,t:1,role:'user',text:'x',fl:'ed'}]","ed");
      ok("under the brake menu, program, fasting and calorie target are off; Profil has an explanation, no Kaldır button",String(gates())==="true,true,true"&&view().textContent.includes("Sohbetten bir sağlık işareti algılandı")&&!$q('[data-act="riskclr"]'),gates());
      brake("[{id:1,t:1,role:'coach',text:'',card:{kind:'safety',level:'ed'}}]","");
      ok("a safety card (ed) is a permanent brake too",String(gates())==="true,true,true"&&(view(),!$q('[data-act="riskclr"]')));
      brake("[]","preg");
      ok("pregnancy flag: brake and explanation, no Kaldır",String(gates())==="false,true,true"&&view().textContent.includes("Sohbetten bir sağlık işareti algılandı")&&!$q('[data-act="riskclr"]'),gates());
      ok("the brake stays even if the chat is deleted (chatRisk)",(ev("S.chat=[]"),String(gates())==="false,true,true"));
    }
    ok("cleanSettings riskClearedAt: a valid day is kept, broken and missing are empty",ev("cleanSettings({riskClearedAt:'2026-09-01'}).riskClearedAt")==="2026-09-01"&&ev("cleanSettings({riskClearedAt:'dün'}).riskClearedAt")===""&&ev("cleanSettings({}).riskClearedAt")==="");
    reset();
  }
  { // onboarding: hard and soft flags are separate
    ev("S=structuredClone(DEF);Object.assign(ob,obFresh(),{step:0});render()");
    const q=s=>$q(s),val=(id,v)=>{q("#ob"+id).value=v},v=()=>q("#view").textContent;
    val("cm","170");val("kg","80");val("age","30");q('[data-ob="dir:lose"]').click();val("goal","70");q('[data-ob="next"]').click();q("#obhd").checked=true;q('[data-ob="next"]').click();
    ok("onboarding pregnancy/eating-disorder flag: hard, no confirm button",v().includes("açığı önermiyorum")&&!q('[data-act="riskok"]'));
    q('[data-ob="next"]').click();
    ok("a typed note counts as hard in riskFlags",ev("risk().hard.length")>0);
    ev("S=structuredClone(DEF);Object.assign(ob,obFresh(),{step:0});render()");
    val("cm","170");val("kg","80");val("age","30");q('[data-ob="dir:lose"]').click();val("goal","70");q('[data-ob="next"]').click();q("#obhn").checked=true;q('[data-ob="next"]').click();
    q('[data-act="riskok"]').click();
    ok("onboarding soft flag: 'Hekimime danıştım' works, a calorie deficit is suggested",ev("S.settings.riskClearedAt")===ev("dayKey()")&&!v().includes("açığı önermiyorum")&&v().includes("Adım 3/3"));
    q('[data-ob="next"]').click();
    reset();
  }
  { // protein with adjusted weight, physician referral and the footnote on every display
    reset();ev("S.entries=[];Object.assign(S.settings,{heightCm:180,age:35,goalKg:0,healthNote:''});for(let i=0;i<20;i++)add('weight',140,'',keyOff(-i));add('food',500,'Tavuk').p=40;tab='today';render()");
    const FOOT="Böbrek ya da karaciğer sorunun varsa hekimine danış";
    ok("Today: 140 kg/180 cm protein 153-200 g and the footnote",ev("viewToday()").includes("/ 153–200 g")&&ev("viewToday()").includes(FOOT),ev("viewToday()").match(/Protein.{0,80}/));
    ok("Energy card and menu plan: the same range, the footnote",ev("gEnergy()").includes("153–200 g")&&ev("gEnergy()").includes(FOOT)&&ev("cMenuPlan().protein").join("-")==="153-200");
    ev("S.settings.healthNote='diyalize giriyorum'");
    ok("kidney note: no range on Today, Energy and menu, 'hekiminle belirle'",ev("viewToday()").includes("hekiminle belirle")&&!ev("viewToday()").includes("153–200")&&ev("gEnergy()").includes("Hekiminle belirle")&&ev("cMenuPlan().protein")===null&&ev("cMenuPlan().pdoc"));
    ev("S.settings.healthNote='';S.settings.age=70;S.meds=[{id:1,n:'X',t:['08:00'],on:true}]");
    ok("age 70 + medication: no range",ev("viewToday()").includes("hekiminle belirle"));
    ev("S.meds=[]");reset();
  }
  finish();
})();
