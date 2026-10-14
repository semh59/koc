/* Units (kg/lb, mg/dL / mmol/L), drink type, cardio and progress photos: pure libraries and the UI flow. */
const {ok,finish}=require("./ok");
const U=require("../www/kernel/unitlib.js"),V=require("../www/modules/vitals/vitalslib.js"),C=require("../www/modules/gym/cardiolib.js"),P=require("../www/modules/data/photolib.js"),Csv=require("../www/modules/data/csvlib.js");

{
  ok("kg: unchanged",U.w(84.3,"kg")===84.3&&U.wIn(84.3,"kg")===84.3);
  ok("lb: 1 kg = 2.20462 lb",Math.abs(U.w(1,"lb")-2.20462)<1e-9);
  let worst=0;for(let t=200;t<=8000;t++){const lb=t/10,back=U.w(U.wIn(lb,"lb"),"lb");if(U.fw(U.wIn(lb,"lb"),1,"lb")!==lb.toFixed(1).replace(".",","))worst++}
  ok("an lb entry converted to kg and shown back gives the typed number exactly (20-800 lb, 0.1 step)",worst===0,worst);
  worst=0;for(let t=11;t<=444;t++){const m=t/10,mg=U.gIn(m,"mmol");if(U.fg(mg,"mmol")!==m.toFixed(1).replace(".",","))worst++}
  ok("an mmol/L entry converted to mg/dL and shown back gives the same number (1.1-44.4)",worst===0,worst);
  ok("mg/dL / 18.016, one decimal when displayed",U.fg(95,"mmol")==="5,3"&&U.fg(95.5,"mgdl")==="95,5"&&U.fg(95,"mgdl")==="95"&&U.gl("mmol")==="mmol/L");
  ok("mmol input rounds to 0.1 mg/dL, lb input to 3 decimals of kg",U.gIn(5.3,"mmol")===95.5&&U.wIn(185.4,"lb")===84.096,[U.gIn(5.3,"mmol"),U.wIn(185.4,"lb")]);
  ok("signed difference and settings source",U.fwS(-1,1,"lb")==="−2,2"&&U.fwS(0.01,1,"kg")==="0,0"&&(U.src(()=>({wUnit:"lb",gUnit:"mmol"})),U.wu()==="lb"&&U.gu()==="mmol"&&U.fw(100)==="220,5")&&(U.src(()=>({})),U.wu()==="kg"));
}
{ // limits are unit independent: converted to kg first, then the same range
  const lim=(v,u)=>{const k=U.wIn(v,u);return k>=20&&k<=400};
  ok("weight limit 20-400 kg: in lb 44.1-881.8 lb is accepted, outside is rejected",lim(44.1,"lb")&&lim(881.8,"lb")&&!lim(44,"lb")&&!lim(882,"lb")&&lim(20,"kg")&&!lim(19.9,"kg"));
  const g=(v,u)=>V.check({k:"s",day:"2026-10-06",time:"08:00",g:U.gIn(v,u),ctx:"fasting"});
  ok("glucose limit 20-800 mg/dL: in mmol/L 1.2-44.4 is accepted, outside is rejected; stored as mg/dL",!!g(1.2,"mmol").row&&!!g(44.4,"mmol").row&&!!g(1.0,"mmol").err&&!!g(45,"mmol").err&&g(5.3,"mmol").row.g===95.5&&!!g(95,"mgdl").row);
  ok("the glucose \"are you sure\" prompt and the report row use the chosen unit",V.needsConfirm([{k:"s",ctx:"fasting",g:80,day:"2026-10-05",time:"08:00",id:1}],{k:"s",ctx:"fasting",g:300},"mmol").includes("16,7")&&V.reportRows([{k:"s",g:95,ctx:"fasting",day:"2026-10-06",time:"08:00",id:1}],"s","2026-10-01","2026-10-07","mmol")[0].v==="5,3 mmol/L"&&V.reportRows([{k:"s",g:95,ctx:"fasting",day:"2026-10-06",time:"08:00",id:1}],"s","2026-10-01","2026-10-07","mgdl")[0].v==="95 mg/dL");
}
{
  const S={settings:{wUnit:"lb",gUnit:"mmol"},entries:[{id:1,day:"2026-10-06",time:"08:00",type:"weight",v:100,text:""}],measures:[],moves:[],labs:[],workouts:[],vitals:[{id:1,k:"s",day:"2026-10-06",time:"08:00",g:95,ctx:"fasting"}],recipes:[],sleep:[],mood:[],pulse:[],hr:[],fast:{log:[]},medLog:[],meds:[]};
  const f=Csv.files(S,{exName:x=>x,vctx:()=>"Açlık"}),a=f.find(x=>x.key==="kayitlar").build(),s=f.find(x=>x.key==="saglik").build();
  ok("CSV: weight in the chosen unit with a unit column, glucose with an mmol/L header",a.includes("220,46;lb")&&s.includes("şeker_mmoll")&&s.includes(";5,27;"),[a,s]);
  const d=Csv.files({...S,settings:{}},{exName:x=>x,vctx:()=>""});
  ok("CSV: default kg and mg/dL",d.find(x=>x.key==="kayitlar").build().includes(";100;kg;")&&d.find(x=>x.key==="saglik").build().includes("şeker_mgdl"));
}
{
  const c=(kind,min,km)=>C.check({kind,min,km});
  ok("cardio: kind, duration (integer 1-600) and distance (empty or 0.1-100) are validated",c("x",30,0).err&&c("run",0,0).err&&c("run",601,0).err&&c("run",30.5,0).err&&c("run",30,NaN).err&&c("run",30,101).err&&c("run",30,0).name==="Koşu"&&c("run",30,5.234).km===5.23);
  ok("cardio: an unusual speed counts as a typo (run at 40 km/h), a sensible speed passes",!!c("run",30,20).err&&!c("run",30,5).err&&!!c("walk",60,12).err&&!c("bike",60,30).err);
  ok("pace: run min/km, swim min/100 m, bike km/h; none without a distance",C.pace("run",30,5)==="6:00 dk/km"&&C.pace("swim",30,1.5)==="2:00 dk/100 m"&&C.pace("bike",60,25.5)==="25,5 km/sa"&&C.pace("run",30,0)===null);
  ok("MET: the kind's value without a distance, with a speed the same Compendium points as Algo.moveSummary",C.met("run",null)===8.3&&C.met("walk",null)===3.5&&Math.abs(C.met("run",9.7)-9.8)<1e-9&&Math.abs(C.met("walk",4.8)-3.5)<1e-9&&C.met("elliptical",null)===5);
  const A=require("../www/kernel/algo.js");
  ok("kcal: same as netKcal, (MET-1) x kg x hours",A.netKcal(C.met("run",10),80,30)===Math.round((C.met("run",10)-1)*80*0.5));
  const e=(ck,day,v,km,kcal)=>({type:"exercise",ck,day,v,km,kcal,text:"x"});
  const w=C.week([e("run","2026-10-06",30,5,300),e("run","2026-10-05",20,3,200),e("bike","2026-10-01",60,20,400),{type:"exercise",day:"2026-10-06",v:40,text:"Ağırlık"}],"2026-10-02","2026-10-08");
  ok("weekly summary counts only cardio entries and days in the range (gym/other exercise excluded)",w.tot.n===2&&w.tot.min===50&&w.tot.km===8&&w.tot.kcal===500&&w.by.run.n===2&&!w.by.bike,w);
}
{
  ok("size: the longest side shrinks to 900, ratio kept, small images not enlarged, invalid gives null",JSON.stringify(P.fit(4000,3000))==='{"w":900,"h":675}'&&JSON.stringify(P.fit(1000,3000))==='{"w":300,"h":900}'&&JSON.stringify(P.fit(600,400))==='{"w":600,"h":400}'&&JSON.stringify(P.fit(900,900))==='{"w":900,"h":900}'&&P.fit(0,5)===null&&P.fit(10000,1).h===1);
  ok("limit: at most 24 photos",P.MAX===24&&P.canAdd(23)&&!P.canAdd(24)&&P.QUALITY===0.75&&P.LONG===900);
  ok("weight label is optional: empty gives null, outside 20-400 is invalid",P.kgLabel(null)===null&&P.kgLabel(84.3)===84.3&&P.kgLabel(10)===undefined&&P.kgLabel(NaN)===undefined);
  const l=P.order([{day:"2026-10-02",t:2},{day:"2026-09-01",t:9},{day:"2026-10-02",t:1}]);
  ok("order by date then time added; gap in days and kg",l.map(p=>p.t).join()==="9,1,2"&&P.gap({day:"2026-09-01",kg:90},{day:"2026-10-01",kg:87.5}).days===30&&P.gap({day:"2026-09-01",kg:90},{day:"2026-10-01",kg:87.5}).kg===-2.5&&P.gap({day:"2026-09-01"},{day:"2026-10-01",kg:1}).kg===null);
}
{ // UI (jsdom)
  require("./html").boot(w=>{w.ResizeObserver=class{observe(){}disconnect(){}}}).then(w=>{
    const ev=s=>w.eval(s);
    ev("S.settings.obDone=true;S.settings.heightCm=178;S.settings.age=35");
    ev("add('water',250,'','"+ev("dayKey()")+"');add('water',200,'');S.entries[S.entries.length-1].dr='tea';save()");
    ok("drink type: only a known type is stored (water has none), invalid is dropped, mineral kept",ev("(()=>{const r=buildState({entries:[{id:1,day:dayKey(),type:'water',v:200,dr:'tea'},{id:2,day:dayKey(),type:'water',v:100,dr:'water'},{id:3,day:dayKey(),type:'water',v:50,dr:'zehir'}]}).S.entries;return r.map(e=>e.dr||'-').join()})()")==="tea,-,-");
    ok("water total by type: water and mineral count; tea, coffee, soda, milk, other do not; an entry without a type is water",ev("(()=>{const d=dayKey(),E=(v,dr)=>({day:d,type:'water',v,dr});S.entries=[E(100),E(10,'water'),E(1000,'mineral'),E(2,'tea'),E(3,'coffee'),E(4,'soda'),E(5,'milk'),E(6,'other')];return sum('water',d,d)})()")===1110);
    ev("S.entries=[];add('water',250,'',dayKey());add('water',200,'');S.entries[S.entries.length-1].dr='tea';save()");
    ok("Coach context takes only the water ml (200 ml of tea is excluded); notification muting counts only water; the log has a separate row",(()=>{const c=JSON.stringify(ev("cData()")),d=ev("LogLib.dayLog(S.entries)");return !/ml/.test(c)&&d.waterTotal===250&&d.drMl===200&&ev("(()=>{S.settings.waterMl=400;const t=dayKey();return sum('water',t,t)>=S.settings.waterMl})()")===false&&ev("(()=>{S.settings.waterMl=250;const t=dayKey();return sum('water',t,t)>=S.settings.waterMl})()")===true})());
    ev("S.settings.waterMl=2500");
    ev("sheetDrink()");w.document.querySelector('[data-dr="coffee"]').click();w.document.querySelector("#fv").value="300";w.document.querySelector('[data-dk="go"]').click();
    const k=ev("S.entries[S.entries.length-1]");
    ok("add drink: type label and amount are saved, not counted in water, shown in the Other drinks row and in history",k.type==="water"&&k.v===300&&k.dr==="coffee"&&ev("sum('water',dayKey(),dayKey())")===250&&/Diğer içecekler: 500 ml/.test(w.document.querySelector("#view").textContent)&&(ev("sheetWater()"),w.document.querySelector("#sheet").textContent.includes("Kahve")));
    ev("closeSheet()");
    ev("S.settings.wUnit='lb';S.settings.gUnit='mmol';add('weight',84.1,'',dayKey());render();tab='today';render()");
    ok("lb setting: the Today card shows lb, storage stays kg",w.document.querySelector("#view").textContent.includes("185,4")&&ev("S.entries.find(e=>e.type==='weight').v")===84.1);
    ev("sheetWeight();document.querySelector('#fv').value='190,0'");w.document.querySelector('[data-go="weight"]').click();
    ok("an lb entry is saved converted to kg (190 lb = 86.183 kg)",ev("S.entries.filter(e=>e.type==='weight').pop().v")===86.183,ev("S.entries.filter(e=>e.type==='weight').map(e=>e.v)"));
    ev("closeSheet();tab='settings-profile';render()");
    ok("settings: the unit choice and the goal weight field are in lb",w.document.querySelector('[data-wun="lb"][aria-pressed="true"]')&&w.document.querySelector('[data-gun="mmol"][aria-pressed="true"]')&&w.document.querySelector("label[for=goalKg]").textContent.includes("lb"));
    const gi=w.document.querySelector("#goalKg");gi.value="150";gi.dispatchEvent(new w.Event("change",{bubbles:true}));
    ok("goal weight is entered in lb and stored in kg (150 lb = 68.039 kg); out-of-range is rejected",ev("S.settings.goalKg")===68.039&&(gi.value="20",gi.dispatchEvent(new w.Event("change",{bubbles:true})),ev("S.settings.goalKg")===68.039));
    ok("cleanSettings keeps only lb and mmol",ev("cleanSettings({wUnit:'lb',gUnit:'mmol'}).wUnit")==="lb"&&ev("cleanSettings({wUnit:'x',gUnit:'y'}).wUnit")===undefined&&ev("cleanSettings({gUnit:'y'}).gUnit")===undefined);
    ev("S.settings.bsOn=true;sheetBs();document.querySelector('#gv').value='5,3'");w.document.querySelector('[data-vt="savebs"]').click();
    ok("glucose is entered in mmol/L and stored in mg/dL (5.3 = 95.5)",ev("S.vitals.pop().g")===95.5);
    ev("S.settings.wUnit=undefined;sheetCardio()");w.document.querySelector('[data-ckk="run"]').click();
    w.document.querySelector("#fv").value="30";w.document.querySelector("#ckm").value="5";w.document.querySelector("#cnote").value="morning";w.document.querySelector('[data-ckg="go"]').click();
    const e=ev("S.entries.filter(e=>e.type==='exercise').pop()");
    ok("a cardio entry is an exercise entry (counts in weekly minutes), carries kind/distance/note/kcal, no double counting",e.text==="Koşu"&&e.v===30&&e.km===5&&e.ck==="run"&&e.cn==="morning"&&ev("sum('exercise',dayKey(),dayKey())")===30&&ev("Algo.exerciseKcal(S.entries.filter(e=>e.type==='exercise'),[{day:dayKey(),k:'r',t0:(m=>pad(Math.floor(m/60))+':'+pad(m%60))(Math.max(0,+S.entries.filter(e=>e.type==='exercise').pop().time.slice(0,2)*60+ +S.entries.filter(e=>e.type==='exercise').pop().time.slice(3)-10)),min:30,kcal:999}],dayKey())")===(e.kcal||0),e);
    ok("cardio card in Trend: weekly summary and pace",(ev("tab='trend';render()"),w.document.querySelector("#view").textContent.includes("Kardiyo")&&w.document.querySelector("#view").textContent.includes("6:00 dk/km")));
    ev("sheetCardio()");w.document.querySelector("#fv").value="30";w.document.querySelector('[data-ckg="go"]').click();
    ok("a same-day entry of the same kind asks for confirmation (nothing is added if confirm is declined)",(w.confirm=()=>false,ev("sheetCardio()"),w.document.querySelector("#fv").value="25",w.document.querySelector('[data-ckg="go"]').click(),ev("S.entries.filter(e=>e.ck==='run').length")===2));
    ok("photo card: a warning without IndexedDB, no crash; the delete category exists",w.document.querySelector("#view").textContent.includes("fotoğraf saklanamıyor")&&ev("PV_CATS.some(c=>c[0]==='İlerleme fotoğrafları')"));
    finish();
  });
}
