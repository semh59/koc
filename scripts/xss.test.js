/* Injection scan: an HTML payload is written into every field that can hold user text, all tabs and sheets are rendered, and no payload may survive in the rendered DOM (img, svg onload, on* attributes). */
const {ok,finish}=require("./ok");
require("./html").boot().then(w=>{
  const ev=s=>w.eval(s);
  const found=JSON.parse(ev(`(()=>{
    const P='<img src=x onerror=alert(1)><svg onload=1>"<b>',d=dayKey();
    S=structuredClone(DEF);S.settings.obDone=true;
    Object.assign(S.settings,{medOn:true,bpOn:true,bsOn:true,cycleOn:true,fastOn:true,stepsOn:true,healthNote:P,heightCm:170,age:30,kcal:2000,goalKg:70,medShowName:true});
    for(const t of ["food","exercise","note","water","weight"])S.entries.push({id:S.nextId++,day:d,time:"09:00",type:t,v:t==="note"?null:70,text:P,meal:"ogle",cn:P});
    S.myFoods=[{n:P,k:100}];S.favFoods=[{text:P,v:100}];S.mealTpl=[{n:P,items:[{text:P,v:100}]}];
    S.recipes=[{id:1,n:P,s:2,items:[{n:P,g:100,k:100}]}];
    S.customEx=[{id:"c1",n:P,g:"Göğüs",inc:2.5}];
    S.templates=[{id:1,name:P,ex:["c1"],tg:{}}];
    S.workouts=[{id:1,day:d,t0:Date.now()-36e5,t1:Date.now(),name:P,tpl:1,ex:[{id:"c1",note:P,sets:[{kg:10,reps:5,done:true}]}]}];
    S.meds=[{id:1,n:P,d:P,t:["08:00"],days:[0,1,2,3,4,5,6],k:0}];
    S.labs=[{id:1,day:d,k:"x",n:P,v:5,u:P}];
    S.vitals=[{id:1,day:d,time:"08:00",k:"t",sys:120,dia:80,note:P,session:"morning"},{id:2,day:d,time:"08:00",k:"s",g:100,ctx:"fasting",note:P}];
    S.mood=[{day:d,v:3,t:P}];S.sleep=[{day:d,min:420}];
    S.chat=[{role:"user",text:P},{role:"assistant",text:P}];
    S.providers.forEach(p=>{p.name=P});
    const found=[];
    const scan=where=>{for(const el of ["#view","#sheet","#cfm","#ttl","#tmsg","#composer"].map(s=>document.querySelector(s))){if(!el)continue;
      if(el.querySelector('img[src="x"],svg[onload],[onerror],[onload]'))found.push(where);
      for(const e of el.querySelectorAll("*"))for(const a of e.attributes)if(/^on/i.test(a.name)&&!(a.name==="onfocus"&&a.value==="this.select()")&&!(a.name==="onclick"&&a.value==="if(!this.dataset.s){this.dataset.s=1;this.select()}")){found.push(where+" "+a.name);break}}};
    const tabs=["today","gym","trend","coach","more","settings","settings-about","settings-reminders","settings-modules","settings-data","steps","labs","bp","glucose","exlib","meds"];
    for(const t of tabs){try{tab=t;render();scan("tab:"+t)}catch(e){found.push("error "+t+": "+e.message)}}
    for(const s of ["sheetSteps","sheetBp","sheetBs","sheetCsv","sheetCycle","sheetCardio","sheetCardioAll","sheetWeight","sheetMeal","sheetMood","sheetNote","sheetMeasures","sheetPrivacy","sheetExercise","sheetWater","sheetRecipe","sheetTpl","sheetSleep","sheetBackup","sheetFood","sheetDrink"]){try{tab="today";render();eval(s+"()");scan("sheet:"+s)}catch(e){found.push("error "+s+": "+e.message)}closeSheet()}
    return JSON.stringify([...new Set(found)]);
  })()`));
  ok("the HTML payload produces no executable element in any tab or sheet",found.length===0,found);
  finish();
});
