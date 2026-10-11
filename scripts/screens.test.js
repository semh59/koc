/* Screens and actions driven through the real click and change handlers: history day rows, medication form, settings fields, recovery mode, safety copies, Coach cards and provider sheet, notification taps, deletes with undo, gym sheets. */
const {ok,finish}=require("./ok");
const {boot,build,flush}=require("./html");
process.on("unhandledRejection",e=>{console.log("FAIL unexpected error",e);process.exit(1)});
(async()=>{
  const w=await boot(w=>{Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto})},build());
  const ev=s=>w.eval(s),$q=s=>w.document.querySelector(s),text=s=>$q(s).textContent;
  /* The click handlers read data-* attributes of the target; this makes a target for any action without drawing the screen it lives on. */
  const clearToast=()=>{$q("#tmsg").textContent="";$q("#toast").classList.remove("on")};
  const tap=(attr,val,extra={})=>{clearToast();const b=w.document.createElement("button");b.dataset[attr]=val;Object.assign(b.dataset,extra);w.document.body.append(b);b.click();b.remove()};
  const reset=()=>{ev("closeSheet();S=structuredClone(DEF);S.settings.obDone=true;recovery=null;tab='today';logOff=0");w.localStorage.clear();ev("render()");clearToast()};
  const toastText=()=>text("#tmsg");

  reset();
  { // history day screen
    const k="2026-03-04",ms=Date.parse(k+"T10:00:00");
    ev(`S.sleep=[{day:'${k}',min:450,q:3}];S.mood=[{day:'${k}',v:4,t:''}];
      S.vitals=[{day:'${k}',time:'09:00',k:'t',sys:120,dia:80,pulse:70},{day:'${k}',time:'08:00',k:'s',g:95}];
      S.pulse=[{day:'${k}',time:'11:00',bpm:64}];S.hr=[{day:'${k}',a:61,m:52}];
      S.medLog=[{day:'${k}',m:1,slot:'08:00',st:'t'},{day:'${k}',m:1,slot:'20:00',st:'s'}];
      S.fast.log=[{t0:${ms},t1:${ms+4*36e5}}];S.measures=[{day:'${k}',k:'waist',v:84}]`);
    const rows=ev(`hgOther('${k}').rows`),at=s=>rows.indexOf(s);
    const order=["Uyku","Ruh hali","08:00 Şeker","09:00 Tansiyon","Nabız (kamera)","Nabız (saat), ortalama","İlaç","Oruç","Ölçü: Bel"].map(at);
    ok("history day lists the records of every module, in the fixed order",order.every(i=>i>=0)&&order.every((i,j)=>j===0||i>order[j-1]),order);
    ok("history day row values: blood pressure with pulse, lowest heart rate, medication counts, waist",rows.includes("120/80 · nabız 70")&&rows.includes("61 · en düşük 52")&&rows.includes("1 alındı, 1 atlandı")&&rows.includes("84,0 cm"));
    const idx=ev(`HistoryLib.marks(hgIndex().get('${k}')).other`);
    ok("calendar marks the day as having other records",idx===true);
  }

  reset();
  { // medication form
    ev("tab='meds';render()");
    ev("medOpen(0)");
    ok("new medication: empty name, one default time, close button but no delete",$q("#sheet.on")&&!!$q("#sheet [data-md=save]")&&!$q("#sheet [data-md=del]")&&ev("medDraft.t.join()")==="08:00"&&ev("medDraft.id")===0);
    ev("closeSheet();S.meds=[{id:7,n:'Metformin',d:'500 mg',t:['08:00','20:00'],w:[1,3],on:true,k:null,p:null,s:null,e:null,ts:null}];medOpen(7)");
    ok("editing a medication fills the form from it and offers delete",ev("medDraft.n")==="Metformin"&&ev("medDraft.t.join()")==="08:00,20:00"&&ev("medDraft.w.join()")==="1,3"&&!!$q("#sheet [data-md=del]"));
    ev("closeSheet();S.meds=Array.from({length:MedLib.MAXM},(_,i)=>({id:i+1,n:'M'+i,d:'',t:['08:00'],w:[0,1,2,3,4,5,6],on:true}));medOpen(0)");
    ok("at the limit a new medication is refused with a message",toastText().includes("En çok")&&!$q("#sheet.on"),toastText());
    ev("S.meds=[]");
  }

  reset();
  { // settings fields and reminders
    ev("tab='settings-profile';render()");
    const inp=$q('[data-set="kcal"]'),before=ev("S.settings.kcal");
    clearToast();inp.value="99999";inp.dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("an out-of-range number is refused: the field goes back to the stored value and a message is shown",ev("S.settings.kcal")===before&&inp.value.replace(/\D/g,"")===String(before||"").replace(/\D/g,"")&&toastText().includes("800 ile 8000"),[inp.value,toastText()]);
    inp.value="2100";inp.dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("a valid number is stored",ev("S.settings.kcal")===2100);
    ev("tab='settings-reminders';render()");
    const id=ev("S.settings.reminders.find(remShown).id"),t=$q(`[data-rt="${id}"]`),sw=$q(`[data-ro="${id}"]`),was=ev(`S.settings.reminders.find(x=>x.id===${id}).on`);
    t.value="07:45";t.dispatchEvent(new w.Event("change",{bubbles:true}));
    sw.checked=!was;sw.dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("reminder time and switch are stored",ev(`S.settings.reminders.find(x=>x.id===${id}).t`)==="07:45"&&ev(`S.settings.reminders.find(x=>x.id===${id}).on`)===!was);
    tap("act","riskok");
    ok("health risk acknowledgement is dated today",ev("S.settings.riskClearedAt")===ev("dayKey()")&&toastText().includes("30 gün"));
    tap("act","apply:1900");
    ok("a suggested calorie target is applied",ev("S.settings.kcal")===1900&&toastText().includes("1900"));
    tap("act","stepsno");
    ok("declining the step counter is remembered",ev("S.settings.stepsAsked")===true);
    ev("S.settings.stepsOn=true");tap("act","stepsoff");
    ok("turning the step counter off keeps old step records",ev("S.settings.stepsOn")===false&&toastText().includes("Eski adım kayıtların durur"));
  }

  reset();
  { // safety copies
    w.localStorage.setItem("nw_state_previous","{\"x\":1}");w.localStorage.setItem("nw_state_corrupt","bozuk");
    ev("S.settings.copyAt=dayKey()");
    tap("act","copyseen");
    ok("'I saw the copy' clears the hold date",ev("S.settings.copyAt")==="");
    tap("act","copydel:nw_state_corrupt");
    ok("a safety copy is deleted by its key",w.localStorage.getItem("nw_state_corrupt")===null&&w.localStorage.getItem("nw_state_previous")!==null);
    w.localStorage.setItem("nw_state","canli");tap("act","copydel:nw_state");
    ok("only the known safety copy keys can be deleted",w.localStorage.getItem("nw_state")==="canli");
  }

  reset();
  { // recovery mode
    const shared=[];
    ev("window.__shared=[];shareFile=async(...a)=>{window.__shared.push(a);return true}");
    w.localStorage.setItem("nw_state","{bozuk");ev("recovery={raw:'ham-veri'};render()");
    ok("recovery screen replaces the app and offers export, retry and fresh start",text("#view").includes("Kayıtların okunamadı")&&!!$q('[data-act="recexp"]')&&!!$q('[data-act="rectry"]')&&!!$q('[data-act="recnew"]'));
    tap("act","recexp");
    ok("export hands the raw record to the share sheet",ev("window.__shared.length")===1&&ev("window.__shared[0][3]")==="ham-veri");
    tap("act","rectry");
    ok("retry with a record that is still unreadable keeps recovery mode and says so",ev("recovery!==null")&&toastText().includes("hâlâ"),toastText());
    tap("act","recnew");await flush();
    ok("fresh start keeps the raw record as a safety copy, then clears recovery and starts empty",ev("recovery")===null&&w.localStorage.getItem("nw_state_corrupt")==="{bozuk"&&ev("S.entries.length")===0);
    ev("S.settings.obDone=true");
    // storage full: the raw copy cannot be kept, so the user must confirm
    const asked=[];let answer=false;w.confirm=m=>{asked.push(m);return answer};
    ev("recovery={raw:'x'.repeat(10)};const keep=Store.set;Store.set=()=>false;window.__keep=keep;render()");
    tap("act","recnew");await flush();
    ok("fresh start with a full disk asks first; declining keeps recovery mode",asked.length===1&&asked[0].includes("kaybolur")&&ev("recovery!==null"),asked);
    answer=true;tap("act","recnew");await flush();
    ok("confirming starts empty",ev("recovery")===null&&asked.length===2);
    ev("Store.set=window.__keep");
  }

  reset();
  { // workout delete with undo
    ev("S.workouts=[{id:5,day:'2026-09-01',t0:1000,t1:2000,name:'Eski',tpl:null,ex:[{id:'squat',note:'',sets:[{kg:100,reps:12,done:true}]}]}];S.gid=10");
    ev("Log.restore([{id:900,day:'2026-09-01',time:'10:00',type:'exercise',v:30,text:'Eski',wid:5}])");
    tap("g","delw:5");
    ok("deleting a workout removes it and its exercise entry",ev("S.workouts.length")===0&&ev("S.entries.some(e=>e.wid===5)")===false&&toastText().includes("Antrenman silindi"));
    $q("#tundo").click();
    ok("undo brings back the workout and its entry",ev("S.workouts.length")===1&&ev("S.entries.some(e=>e.wid===5)")===true);
    tap("g","delw:99");
    ok("deleting an unknown workout does nothing",ev("S.workouts.length")===1);
  }

  reset();
  { // onboarding goal range
    ev("S.settings.obDone=false;render()");
    const click=s=>$q(s).click(),set=(id,v)=>{$q("#ob"+id).value=v};
    click('[data-ob="next"]');
    set("cm","170");set("kg","80");set("age","30");click('[data-ob="dir:lose"]');set("goal","10");click('[data-ob="next"]');
    ok("a goal weight outside 20-400 kg is rejected on the profile step",text("#oberr").includes("20 ile 400")&&$q("#obgoal").getAttribute("aria-invalid")==="true",text("#oberr"));
  }
  reset();
  { // Coach cards
    const chat=(...cards)=>ev("S.chat="+JSON.stringify(cards.map((card,i)=>({id:i+1,role:"coach",text:"",card})))+";render()");
    const card=i=>ev("S.chat["+i+"].card");
    chat({kind:"food",f:{n:"Çiğköfte",k:210,p:6},state:"pending"});
    tap("c","addfood:1");
    ok("food card: 'add to my foods' stores the food and marks the card",card(0).state==="ok"&&ev("S.myFoods.some(f=>f.n==='Çiğköfte'&&f.k===210)")&&toastText().includes("Besin listene eklendi"));
    chat({kind:"food",f:{n:"Mercimek",k:120,p:8},state:"pending"});
    tap("c","nofood:1");
    ok("food card: 'no' closes the card without storing anything",card(0).state==="no"&&!ev("S.myFoods.some(f=>f.n==='Mercimek')"));
    chat({kind:"food",f:{n:"Ayran",k:60,p:3},state:"pending"});
    tap("c","fooddiary:1");
    ok("food card: 'add to diary' logs the food once for today",ev("S.entries.filter(e=>e.type==='food'&&e.text==='Ayran').length")===1&&card(0).logged===true);
    tap("c","fooddiary:1");
    ok("food card: a second tap does not log it again",ev("S.entries.filter(e=>e.text==='Ayran').length")===1);
    chat({kind:"log",state:"ok",items:[{type:"food",text:"Simit",kcal:280,p:9},{type:"food",text:"Çay",kcal:null},{type:"water",v:200}]});
    tap("c","savefood:1");
    ok("log card: 'save foods' stores only the foods that have calories, once",ev("S.myFoods.filter(f=>f.n==='Simit').length")===1&&!ev("S.myFoods.some(f=>f.n==='Çay')")&&card(0).saved===true&&toastText().includes("1 besin listene eklendi"));
    tap("c","savefood:1");
    ok("log card: saving twice does nothing",ev("S.myFoods.filter(f=>f.n==='Simit').length")===1);
    tap("c","no:1");
    ok("log card: 'no' marks the card declined",card(0).state==="no");
    ev("S.chat=[{id:3,role:'coach',text:'',card:{kind:'safety',level:'check'}},{id:4,role:'user',text:'merhaba'}];tab='coach';render()");
    $q('[data-mid="3"] [data-c="dismiss"]').click();
    ok("a safety notice is dismissed with its button; other messages stay",ev("S.chat.map(m=>m.id).join()")==="4");
    ev("S.chat=[{id:1,role:'user',text:'a'}];S.chats=[{id:1,t:1,title:'x',msgs:[]}];render()");
    tap("c","clearchat");await flush();
    ok("clear chat history asks, then empties the chat and the archive",ev("S.chat.length")===0&&ev("S.chats.length")===0);
  }
  reset();
  { // notification tap routing
    const go=(x,settings={},actionId="tap")=>{reset();ev("Object.assign(S.settings,"+JSON.stringify(settings)+");tab='today'");ev("window.alarmOpen=()=>{};notifTap("+JSON.stringify({actionId,notification:{extra:x}})+")");return ev("tab")};
    for(const [name,x,settings,want] of [
      ["medication, module on",{act:"med"},{medOn:true},"meds"],["medication, module off",{act:"med"},{medOn:false},"more"],
      ["Coach summary with consent",{act:"open",tab:"coach"},{consent:true},"coach"],["Coach summary without consent",{act:"open",tab:"coach"},{consent:false},"trend"],
      ["cycle reminder, module on",{act:"open",tab:"cycle"},{cycleOn:true},"cycle"],["cycle reminder, module off",{act:"open",tab:"cycle"},{cycleOn:false},"trend"],
      ["backup reminder",{act:"open",tab:"settings-data"},{},"settings-data"],["weekly report",{act:"open"},{},"trend"]])
      ok("notification tap: "+name,go(x,settings)===want,go(x,settings));
    ok("notification tap: other actions and foreign extras are ignored",go({act:"open",tab:"coach"},{consent:true},"water")==="today"&&go({act:"x"},{})==="today");
  }
  reset();
  { // Coach provider sheet
    ev("S.providers=defProviders();Object.assign(S.settings,{age:30});tab='settings-coach';render()");
    const val=(id,v)=>{$q("#"+id).value=v};
    tap("c","addprov");
    val("an","Benim");val("ab","http://acik.example");val("am","m1");tap("c","mkprov");
    ok("custom provider: an http address is refused",toastText().includes("https")&&!ev("S.providers.some(p=>p.name==='Benim')"));
    val("ab","https://api.example/v1");tap("c","mkprov");
    const id=ev("S.providers.find(p=>p.name==='Benim').id");
    ok("custom provider: valid input is added and its sheet opens with a remove button",/^u[0-9]+$/.test(id)&&!!$q('#sheet [data-c="pdel:'+id+'"]'),[id,text('#sheet').slice(0,60)]);
    val("pb","ftp://x");tap("c","psave:"+id);
    ok("saving a provider with a non-https address is refused",toastText().includes("https://")&&ev("S.providers.find(p=>p.id==='"+id+"').base")==="https://api.example/v1");
    val("pb","https://api.example/v2");val("pm","m2");val("pk","SECRET1");tap("c","psave:"+id);
    ok("saving a provider stores address, model and key",ev("S.providers.find(p=>p.id==='"+id+"').base")==="https://api.example/v2"&&ev("S.providers.find(p=>p.id==='"+id+"').model")==="m2"&&ev("getKeys()['"+id+"']")==="SECRET1");
    const idx=ev("S.providers.findIndex(p=>p.id==='"+id+"')");
    tap("c","pmove:"+id+":-1");
    ok("a provider moves one place up in the order",ev("S.providers.findIndex(p=>p.id==='"+id+"')")===idx-1);
    // the model list of a provider: fetched with the stored key, offered as a select with the saved model preselected
    const asked=[];w.fetch=async(u,o)=>{asked.push([u,o.headers]);return {ok:true,json:async()=>({data:[{id:"m1"},{id:"m2"}]})}};
    tap("c","prov:"+id);tap("c","pmodels:"+id);await flush();await flush();
    ok("'fetch models' asks the provider's /models with the key and lists the models",asked.length===1&&asked[0][0]==="https://api.example/v2/models"&&JSON.stringify(asked[0][1]).includes("SECRET1")&&$q("#pmsel")&&[...$q("#pmsel").options].map(o=>o.value).join()==="m1,m2"&&$q("#pmsel").value==="m2",asked);
    w.fetch=async()=>({ok:false,status:401,json:async()=>({}),text:async()=>""});
    tap("c","pmodels:"+id);await flush();await flush();
    ok("a rejected key (HTTP 401) on the model request ends in the key-rejected message, not in an exception",toastText().startsWith("Anahtar kabul edilmedi"),toastText());
    tap("c","prov:"+id);tap("c","pkeydel:"+id);
    ok("deleting the key keeps the provider",ev("getKeys()['"+id+"']")===undefined&&ev("S.providers.some(p=>p.id==='"+id+"')"));
    tap("c","prov:"+id);tap("c","pdel:"+id);
    ok("a custom provider can be removed",!ev("S.providers.some(p=>p.id==='"+id+"')"));
  }
  reset();
  { // delete with undo: cardio, body measure, recipe
    ev("Log.restore([{id:801,day:dayKey(),time:'07:00',type:'exercise',v:30,text:'Koşu',ck:'run'},{id:802,day:dayKey(),time:'18:00',type:'exercise',v:20,text:'Yürüyüş',ck:'walk'}]);sheetCardioAll()");
    $q('#sheet [data-ckd="801"]').click();
    ok("cardio history sheet: a deleted record leaves the list and the sheet stays open for the rest",ev("S.entries.some(e=>e.id===801)")===false&&!!$q('#sheet [data-ckd="802"]')&&!$q('#sheet [data-ckd="801"]'));
    $q("#tundo").click();
    ok("cardio: undo puts the record back",ev("S.entries.some(e=>e.id===801)")===true);
    ev("S.entries=S.entries.filter(e=>e.id!==801);sheetCardioAll()");
    $q('#sheet [data-ckd="802"]').click();
    ok("cardio history sheet: deleting the last record closes it",!$q("#sheet.on"));
    ev("S.measures=[{day:'2026-03-04',k:'waist',v:84},{day:'2026-03-05',k:'waist',v:83}];msel='waist'");
    tap("ms","del:2026-03-04");
    ok("body measure: delete removes that day's value of the selected measure",ev("S.measures.length")===1&&ev("S.measures[0].day")==="2026-03-05");
    $q("#tundo").click();
    ok("body measure: undo restores it",ev("S.measures.length")===2);
    ev("S.recipes=[{id:5,n:'Çorba',s:2,items:[]}];recipeDraft={id:5,n:'Çorba',s:'2',items:[]}");
    tap("rp","del");await flush();
    ok("recipe: delete asks, then removes the recipe",ev("S.recipes.length")===0&&toastText().includes("Tarif silindi"),toastText());
  }

  reset();
  { // medication schedule text, cycle chips, gym note and exercise list
    ev("S.settings.medOn=true;S.meds=[{id:1,n:'A',d:'',t:['08:00'],w:null,on:true},{id:2,n:'B',d:'',t:['09:00','21:00'],w:[1,3],e:'2026-12-31',on:true}];tab='meds';render()");
    const mt=text("#view");
    ok("medication list shows every day, chosen weekdays and the course end",mt.includes("08:00 · her gün")&&mt.includes("09:00, 21:00 · "+ev("WEEKDAYS_SHORT[1]+', '+WEEKDAYS_SHORT[3]"))&&/tarihine kadar/.test(mt),mt.slice(0,200));
    ev("S.settings.cycleOn=true;tab='cycle';cycSym=[];cycFlow='';sheetCycle()");
    const chip=a=>$q("#sheet ["+a+"]");
    chip("data-cyb").click();const first=chip("data-cyb").dataset.cyb;
    ok("cycle form: a symptom chip toggles on and off",chip("data-cyb").getAttribute("aria-pressed")==="true"&&ev("cycSym.join()")===first&&(chip("data-cyb").click(),ev("cycSym.length")===0));
    chip("data-cyf").click();
    ok("cycle form: the flow chip is exclusive and toggles off on a second tap",ev("cycFlow")!==""&&(chip("data-cyf").click(),ev("cycFlow")===""));
    ev("closeSheet();S.cycle=[{id:1,s:'2026-10-01',e:null}]");
    tap("cy","end");
    ok("ending a period sets today as its end",ev("S.cycle[0].e")===ev("dayKey()")&&toastText().includes("Dönem bitirildi"),[ev("S.cycle[0].e"),toastText()]);
    ev("S.cycle=[]");tap("cy","end");
    ok("ending a period with no period running is refused",toastText().includes("Bitiş kaydedilemedi"));
  }
  reset();
  { // gym: exercise sheet history, workout note, picker paging, guided program, undo of a guided workout
    ev("S.workouts=[{id:5,day:'2026-09-01',t0:1000,t1:2000,name:'Eski',tpl:null,ex:[{id:'squat',note:'',sets:[{kg:100,reps:12,done:true},{kg:100,reps:10,done:true}]},{id:'plank',note:'',sets:[{kg:null,reps:null,sec:40,done:true}]}]}];S.gid=10");
    ev("exSheet('squat')");
    ok("exercise sheet lists the last session's sets, timed exercises list seconds",text("#sheet").includes("100×12, 100×10"));
    ev("closeSheet();exSheet('plank')");
    ok("exercise sheet of a timed exercise shows the hold time",text("#sheet").includes("40 sn"));
    ev("closeSheet();gSheetHist('plank')");
    ok("exercise history sheet of a timed exercise prints seconds",text("#sheet").includes("40"));
    ev("closeSheet();S.workouts=[];gStart(null);gAddEx(gActive(),'squat');render()");
    tap("g","note:0");
    $q("#gnote").value="Dizi dik tut";tap("g","savenote:0");
    ok("a note on an exercise of the running workout is stored",ev("gActive().ex[0].note")==="Dizi dik tut"&&!$q("#sheet.on"));
    ev("gGroup='Tümü';gPickMax=40;gSheetPick(false)");
    const n0=w.document.querySelectorAll("#glist .prow").length;
    tap("g","pickmore");
    ok("the exercise picker shows 60 more entries on request",ev("gPickMax")===100&&w.document.querySelectorAll("#glist .prow").length>n0,[n0,w.document.querySelectorAll("#glist .prow").length]);
    tap("g","grp:Göğüs");
    ok("a muscle group chip filters the picker list and resets the paging",ev("gGroup")==="Göğüs"&&ev("gPickMax")===40&&w.document.querySelectorAll("#gchips .chip[aria-pressed=true]").length===1);
    ev("closeSheet();S.workouts=[];S.entries=[]");
    const prog=ev("PrgLib.PROGRAMS[0].id");
    tap("g","gdgo:p:"+prog+"-0");
    ok("a guided workout starts from a built-in program day",ev("!!gd")&&ev("gd.meta.n").length>0&&ev("gd.st.ph.length")>0,[ev("typeof gd")]);
  }
  finish();
})();
