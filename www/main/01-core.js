"use strict";
/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,"0");
const dayKey=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(n,from=new Date())=>new Date(from.getFullYear(),from.getMonth(),from.getDate()+n);
const keyOff=n=>dayKey(addDays(n));
Algo.setClock(dayKey);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(x,d=1)=>Number(x).toFixed(d).replace(".",",");
const fmtS=(x,d=1)=>(x>0.049?"+":x<-0.049?"−":"")+fmt(Math.abs(x),d);
const fint=x=>Math.round(x).toLocaleString("tr-TR");
/* Units only convert input and display; storage, calculations and the Coach stay in kg and mg/dL. */
Units.src(()=>S.settings);
const {fw:dw,fwS:dwS,fg:dg}=Units,wlab=()=>Units.wu(),glab=()=>Units.gl();
/* The whole text must be one number (+ optional unit); "-30", "1e3", "12abc3", "1.5.2" give NaN instead of silently becoming another number.
   The last separator is the decimal one and earlier ones are thousands ("1.234,5"); with int, a single separator + 3 digits is thousands ("1.500") and a fraction ("1,5") is NaN, not rounded. */
const num=(s,int)=>{
  const m=String(s==null?"":s).trim().match(/^(\d[\d.,]*|[.,]\d+)\s*[^\d\s.,+\-]*\.?$/);if(!m)return NaN;
  const t=m[1].replace(/[.,]+$/,""),seps=t.match(/[.,]/g)||[],last=Math.max(t.lastIndexOf(","),t.lastIndexOf(".")),grp=/^\d{1,3}([.,]\d{3})*$/;
  let v;
  if(!seps.length)v=+t;
  else{
    const head=t.slice(0,last),tail=t.slice(last+1);
    if(seps.length>1&&new Set(seps).size===1)v=grp.test(t)?+t.replace(/[.,]/g,""):NaN;
    else if(seps.length===1&&int&&tail.length===3&&/^\d{1,3}$/.test(head))v=+(head+tail);
    else v=grp.test(head)||/^\d*$/.test(head)?+((head.replace(/[.,]/g,"")||"0")+"."+tail):NaN;
  }
  return isNaN(v)||(int&&!Number.isInteger(v))?NaN:v;
};
const MONTHS=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const WEEKDAYS=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const WEEKDAYS_SHORT=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
/* Month grid of the cycle and history calendars: Monday-first header, blanks before day 1, cell(dayKey,dayNumber) per day. ymShift moves a "YYYY-MM" month. */
const ymShift=(ym,n)=>{const d=new Date(+ym.slice(0,4),+ym.slice(5,7)-1+n,1);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`};
const calGrid=(ym,label,cell)=>{
  let cells="<span></span>".repeat((new Date(+ym.slice(0,4),+ym.slice(5,7)-1,1).getDay()+6)%7);
  for(let d=1,n=new Date(+ym.slice(0,4),+ym.slice(5,7),0).getDate();d<=n;d++)cells+=cell(`${ym}-${pad(d)}`,d);
  return `<div class="cyg" role="group" aria-label="${label} takvimi">${[...WEEKDAYS_SHORT.slice(1),WEEKDAYS_SHORT[0]].map(w=>`<span class="cyw" aria-hidden="true">${w}</span>`).join("")}${cells}</div>`;
};
/* Display date: the year is left out for the current year. */
const fd=k=>Algo.fdate(k,k.slice(0,4)!==dayKey().slice(0,4));
const tr=s=>s.replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();

/* ---------- data ---------- */
const DEF={
  settings:{medNear:"",trial:null,ramOn:false,ramLat:0,ramLon:0,ramName:"",ramSahur:false,ramIftar:false,ramFrom:"",comfy:false,pregnant:false,nursing:false,edFlag:false,riskOff:"",fastEdOk:false,hideStreak:false,hideNums:false,goalKg:0,kcal:0,waterMl:2500,glass:250,sportWeek:150,heightCm:0,age:0,sex:"",act:1,healthNote:"",consent:false,consentV:0,consentAt:"",consentP:null,shareProfile:true,noticeOk:false,lockGrace:30,piiPrev:false,piiPrevOwn:false,hideRecents:false,bkNoKeys:false,copyAt:"",lastPlateau:"",goalSugAt:"",lastBackup:"",oemDone:false,obDone:false,stepsOn:false,stepsAsked:false,bpOn:false,bsOn:false,medOn:false,medShowName:false,lockOn:false,hcOn:false,hcFrom:"",cycleOn:false,cycleRem:false,fastOn:false,awakeOn:true,gdVoice:true,gdVib:true,theme:"",rpeOn:false,motionOn:false,bpSysHi:0,bpDiaHi:0,bpSysLo:0,bpDiaLo:0,gFastLo:0,gFastHi:0,gPostLo:0,gPostHi:0,stepGoal:8000,moveKcalOn:false,stepWarnDay:"",stepsFrom:"",autoBk:false,lastAutoBk:"",riskClearedAt:"",fastInfoOk:false,fastLongOk:false,reminders:[
    {id:1,t:"09:00",on:true,dow:1,name:"Haftalık tartı (Pazartesi)",title:"Günaydın ☀️",body:"Tartıl ve kilonu kaydet."},
    {id:2,t:"11:30",on:true,name:"Su (öğle öncesi)",title:"💧 Su molası",body:"Bir bardak su iç ve kaydet."},
    {id:3,t:"14:30",on:true,name:"Su (öğleden sonra)",title:"💧 Su molası",body:"Bir bardak su iç ve kaydet."},
    {id:4,t:"17:30",on:true,name:"Su (akşamüstü)",title:"💧 Su molası",body:"Günlük su hedefine bir bak."},
    {id:5,t:"19:30",on:true,name:"Hareket",title:"🏃 Hareket zamanı",body:"20 dakikalık yürüyüş bile sayılır."},
    {id:6,t:"22:00",on:true,name:"Gün sonu",title:"🌙 Gün sonu",body:"Bugünün kayıtlarını kontrol et."},
    {id:7,t:"08:00",on:false,name:"Tansiyon (sabah)",title:"❤️ Tansiyon ölçümü",body:"5 dakika dinlen, tansiyonunu ölç ve kaydet."},
    {id:8,t:"20:00",on:false,name:"Tansiyon (akşam)",title:"❤️ Tansiyon ölçümü",body:"5 dakika dinlen, tansiyonunu ölç ve kaydet."},
    {id:9,t:"07:30",on:false,name:"Şeker ölçümü",title:"🩸 Şeker ölçümü",body:"Şekerini ölç ve ne zaman ölçtüğünle kaydet."},
    {id:10,t:"20:00",on:true,dow:0,name:"Haftalık yedek (Pazar)",title:"☁️ Yedek zamanı",body:"Yedeği Drive'a göndermek için dokun."},
    {id:11,t:"20:00",on:false,name:"Oruç başlangıcı",title:"⏳ Oruç başlangıcı",body:"Oruç penceren başlıyor, istersen Bugün'den başlat."},
    {id:12,t:"20:30",on:true,dow:0,name:"Haftalık özet (Pazar)",title:"📊 Haftalık özet",body:"Haftanı birlikte inceleyelim, bakmak için dokun."}
  ]},
  entries:[],nextId:1,workouts:[],templates:[],customEx:[],gid:1,bar:20,dbStep:0,plates:GPLATE_DEF.slice(),exCfg:{},providers:defProviders(),chat:[],chats:[],cid:1,myFoods:[],recipes:[],favFoods:[],mealTpl:[],fast:{plan:16,t0:null,log:[]},sleep:[],mood:[],labs:[],vitals:[],pulse:[],hr:[],meds:[],medLog:[],moves:[],measures:[],walk:null,cycle:[]
};
const VR={bpSysHi:[80,300,true],bpDiaHi:[40,200,true],bpSysLo:[50,300,true],bpDiaLo:[30,200,true],gFastLo:[20,600,true],gFastHi:[20,600,true],gPostLo:[20,600,true],gPostHi:[20,600,true]};
const RANGES={...VR,goalKg:[20,400,false],kcal:[800,8000,true],waterMl:[500,10000,true],glass:[50,1500,true],sportWeek:[10,3000,true],stepGoal:[1000,100000,true],heightCm:[100,250,true],age:[10,100,true],ramLat:[35.5,42.5,false],ramLon:[25.5,45,false]};
const SETLBL={goalKg:"Hedef kilo",kcal:"Günlük kalori",waterMl:"Günlük su",glass:"Bir bardak",sportWeek:"Haftalık spor",stepGoal:"Günlük adım",heightCm:"Boy",age:"Yaş",bpSysHi:"Büyük tansiyon üst sınır",bpDiaHi:"Küçük tansiyon üst sınır",bpSysLo:"Büyük tansiyon alt sınır",bpDiaLo:"Küçük tansiyon alt sınır",gFastLo:"Açlık alt sınır",gFastHi:"Açlık üst sınır",gPostLo:"Yemek sonrası alt sınır",gPostHi:"Yemek sonrası üst sınır"};
const ZEROOK=["goalKg","kcal","heightCm","age",...Object.keys(VR)];
const {copyNutr,NUTR}=LogLib;
const NLBL={p:"protein",c:"karbonhidrat",f:"yağ",fb:"lif",sg:"şeker",na:"sodyum"},NUNIT=k=>k==="na"?"mg":"g";
const TYPES=["water","weight","food","exercise","note","steps"];
const {dayOk,timeOk}=Algo;
/* Bumped when the Coach consent text changes: a consent given for an older text is void and asked again. */
const CONSENT_V=3;
const MED_NOTE="NeoWell tıbbi cihaz değildir, tanı koymaz ve tedavi önermez; hekim yerine geçmez. Sağlık kararların için hekimine danış.";
/* Seconds in the background before the app lock asks again. */
const LOCK_GRACES=[30,120,300];
const DAY_KEYS=["copyAt","lastPlateau","goalSugAt","lastBackup","lastAutoBk","riskClearedAt","hcFrom","stepWarnDay","stepsFrom","ramFrom"];
function cleanSettings(raw){
  const d=structuredClone(DEF.settings),o=raw&&typeof raw==="object"?raw:{};
  for(const k in RANGES){
    const [lo,hi,int]=RANGES[k],v=o[k];
    if(ZEROOK.includes(k)&&v===0){d[k]=0;continue}
    if(typeof v==="number"&&isFinite(v)&&v>=lo&&v<=hi)d[k]=int?Math.round(v):v;
  }
  for(const k in d)if(typeof d[k]==="boolean"&&typeof o[k]==="boolean")d[k]=o[k];
  for(const k of DAY_KEYS)if(dayOk(o[k]))d[k]=o[k];
  if(o.sex==="m"||o.sex==="f")d.sex=o.sex;
  if(o.act===0||o.act===1||o.act===2)d.act=o.act;
  if(LOCK_GRACES.includes(o.lockGrace))d.lockGrace=o.lockGrace;
  if(typeof o.healthNote==="string")d.healthNote=o.healthNote.slice(0,500);
  d.trial=TrialLib.clean(o.trial);
  if(typeof o.medNear==="string"&&/^\+?\d{7,15}$/.test(o.medNear))d.medNear=o.medNear;
  if(typeof o.ramName==="string")d.ramName=o.ramName.replace(/[\u0000-\u001F\u007F]/g,"").slice(0,40);
  d.consent=o.consent===true&&o.consentV===CONSENT_V&&!(d.age>0&&d.age<18);
  if(d.consent){d.consentV=CONSENT_V;if(dayOk(o.consentAt))d.consentAt=o.consentAt;if(typeof o.consentP==="string")d.consentP=o.consentP.slice(0,200)}
  if(!d.cycleOn)d.cycleRem=false;
  /* Old data kept one "chatRisk" string (ed, preg): its pregnancy sign stays a pregnancy flag, the eating-disorder sign an eating-disorder flag. */
  const cr=typeof o.chatRisk==="string"?o.chatRisk:"";
  d.pregnant=d.pregnant||/(^|,)preg($|,)/.test(cr);d.edFlag=d.edFlag||/(^|,)ed($|,)/.test(cr);
  d.riskOff=["preg","nurs"].filter(k=>String(o.riskOff).includes(k)).join(",");
  if(o.theme==="light"||o.theme==="dark")d.theme=o.theme;
  if(o.wUnit==="lb")d.wUnit="lb";
  if(o.gUnit==="mmol")d.gUnit="mmol";
  if(Array.isArray(o.reminders))for(const r of d.reminders){
    const x=o.reminders.find(y=>y&&y.id===r.id);
    if(x){if(timeOk(x.t))r.t=x.t;if(typeof x.on==="boolean")r.on=x.on;if(typeof x.body==="string"&&x.body.trim().length>=5&&x.body.length<=110)r.body=x.body.trim()}
  }
  return d;
}
let LOST=[];
/* Isolated field by field: a broken one falls back to its default, the rest is kept. */
function cleanHealthState(r){
  r=r||{};const o={},f=(k,fn)=>{try{o[k]=fn()}catch{LOST.push(k)}};
  f("pulse",()=>PulseLib.clean(r.pulse));f("hr",()=>PulseLib.cleanHr(r.hr));
  f("meds",()=>MedLib.cleanMeds(r.meds));
  if(o.meds)f("medLog",()=>MedLib.cleanLog(r.medLog,o.meds));
  f("moves",()=>MotionLib.clean(r.moves));f("measures",()=>Algo.cleanMeasures(r.measures));f("walk",()=>Algo.cleanWalk(r.walk,Date.now()));
  f("favFoods",()=>LogLib.cleanFav(r.favFoods));f("recipes",()=>LogLib.cleanRecipes(r.recipes));f("mealTpl",()=>LogLib.cleanTpl(r.mealTpl));
  f("fast",()=>HabitLib.cleanFast(r.fast));f("sleep",()=>HabitLib.cleanSleep(r.sleep));f("mood",()=>HabitLib.cleanMood(r.mood));
  return o;
}
const MYFOODS_MAX=200; // Nutrition.putMy refuses beyond this, so the cap never drops an accepted food
function cleanMyFoods(arr){
  const out=[],seen=new Set();
  for(const x of (Array.isArray(arr)?arr:[]).slice(0,MYFOODS_MAX)){
    if(!x||typeof x.n!=="string"||!x.n.trim()||!(x.k>=0&&x.k<=5000))continue;
    const n=x.n.trim().slice(0,60),key=tr(n);if(seen.has(key))continue;seen.add(key);
    const f={n,k:Math.round(x.k*10)/10};
    for(const m of NUTR)if(Number.isFinite(x[m])&&x[m]>=0&&x[m]<=LogLib.PER100[m])f[m]=x[m];
    if(typeof x.b==="string"&&/^\d{8,14}$/.test(x.b))f.b=x.b;
    if(x.src==="off")f.src="off";
    if(x.portion===true)f.portion=true; // from a Coach card: values are per 1 portion, grams unknown
    if(Array.isArray(x.u)){const u=x.u.filter(q=>Array.isArray(q)&&typeof q[0]==="string"&&q[1]>0&&q[1]<=5000).slice(0,4).map(q=>[q[0].slice(0,40),q[1]]);if(u.length)f.u=u}
    out.push(f);
  }
  return out;
}
function cleanEntries(arr){
  const out=[],seen=new Set();let drop=0,max=0;
  for(const e of arr){
    if(!e||typeof e!=="object"||!TYPES.includes(e.type)||!dayOk(e.day)){drop++;continue}
    const v=e.v==null?null:Number(e.v);
    const bad=(v!=null&&!isFinite(v))||
      (e.type==="weight"&&!(v>=20&&v<=400))||(e.type==="water"&&!(v>0&&v<=10000))||
      (e.type==="exercise"&&!(v>0&&v<=600))||(e.type==="steps"&&!(v>0&&v<=200000))||(e.type==="food"&&v!=null&&!(v>=0&&v<=20000));
    if(bad){drop++;continue}
    const id=Number.isInteger(e.id)&&e.id>0&&!seen.has(e.id)?e.id:0;
    if(id){seen.add(id);max=Math.max(max,id)}
    const ne={id,day:e.day,time:timeOk(e.time)?e.time:"00:00",type:e.type,v:e.type==="note"?null:v,text:typeof e.text==="string"?e.text.slice(0,500):""};
    if(Number.isFinite(e.qt)&&e.qt>0)ne.qt=e.qt; // time of a water entry that came from a notification, so the same one is not taken twice
    if(Number.isInteger(e.wid))ne.wid=e.wid;
    if(e.type==="exercise"){if(e.bt===true)ne.bt=true;if(Number.isInteger(e.kcal)&&e.kcal>=0&&e.kcal<=5000)ne.kcal=e.kcal;if(typeof e.km==="number"&&e.km>=0&&e.km<=100)ne.km=Math.round(e.km*100)/100}
    if(e.type==="steps"){for(const k of ["ph","hc"])if(Number.isFinite(e[k])&&e[k]>=0&&e[k]<=200000)ne[k]=e[k]}
    if(e.type==="water"&&drinkOk(e.dr))ne.dr=e.dr;
    if(e.type==="exercise"&&CardioLib.kind(e.ck)){ne.ck=e.ck;if(typeof e.cn==="string"&&e.cn.trim())ne.cn=e.cn.trim().slice(0,80)}
    if(e.type==="food"){copyNutr(e,ne);if(LogLib.mealKey(e.meal))ne.meal=e.meal;if(ne.v!=null&&Number.isInteger(e.lo)&&Number.isInteger(e.hi)&&e.lo>=0&&e.lo<=ne.v&&ne.v<=e.hi&&e.hi<=20000){ne.lo=e.lo;ne.hi=e.hi}}
    out.push(ne);
  }
  for(const e of out)if(!e.id)e.id=++max;
  return {out,drop,next:max+1};
}
/* Backup restore and boot use the same cleaning. The number of dropped items is counted in DROPS.n, fields that were unreadable and reset to defaults are collected in LOST. */
const DROPS={n:0};
function buildState(r){
  DROPS.n=0;LOST=[];
  const parts=[["ayarlar",()=>({settings:cleanSettings(r.settings)})],
    ["kayıtlar",()=>{const c=cleanEntries(r.entries);DROPS.n+=c.drop;return {entries:c.out,nextId:c.next}}],
    ["besinler",()=>({myFoods:cleanMyFoods(r.myFoods)})],["tahliller",()=>({labs:LabLib.cleanLabs(r.labs)})],["ölçümler",()=>({vitals:VitalsLib.clean(r.vitals)})],
    ["sağlık",()=>cleanHealthState(r)],["döngü",()=>({cycle:CycleLib.clean(r.cycle,dayKey())})],["antrenman",()=>cleanGym(r)],["Rehber",()=>cleanCoach(r)]];
  const st=structuredClone(DEF);
  for(const [k,fn] of parts)try{Object.assign(st,fn())}catch{LOST.push(k)}
  const wids=new Set(st.workouts.map(w=>w.id));
  for(const e of st.entries)if(e.wid!=null&&!wids.has(e.wid))delete e.wid;
  return {S:st,drop:DROPS.n,lost:[...new Set(LOST)]};
}
/* An unreadable record is never deleted: save() locks, and the user exports the raw data or deliberately starts empty. */
let recovery=null,loadNote="";
const rawCopy=raw=>Store.set("nw_state_corrupt",raw);
/* Sharded store: S is split into one text per module (Shards, modules.js); a save writes only the shards that changed. */
const shardOf=st=>{
  const m={},used=new Set();
  const put=(id,o)=>{m[id]=JSON.stringify(o)};
  for(const [id,keys] of Object.entries(Shards)){
    const base={};
    for(const k of keys){
      used.add(k);
      if(Chunks[k]&&Array.isArray(st[k])){
        const by={};for(const e of st[k])(by[Chunks[k](e)]??=[]).push(e);
        base[k]=[];for(const [c,list] of Object.entries(by))put(id+"/"+c,{[k]:list});
      }else base[k]=st[k];
    }
    put(id,base);
  }
  const rest=Object.keys(st).filter(k=>!used.has(k));
  if(rest.length)put("other",Object.fromEntries(rest.map(k=>[k,st[k]])));
  return m;
};
/* Joins the shards; arrays held in month shards are concatenated and sorted by id (entry order is preserved). */
const assemble=m=>{
  const r={};
  for(const j of Object.values(m))for(const [k,v] of Object.entries(JSON.parse(j))){
    if(Chunks[k]&&Array.isArray(v)&&Array.isArray(r[k]))r[k]=r[k].concat(v);else r[k]=v;
  }
  for(const k of Object.keys(Chunks))if(Array.isArray(r[k]))r[k].sort((a,b)=>a.id-b.id);
  return r;
};
let lastShard={};
let S=load();
function load(){
  let r=null,raw;recovery=null;
  if(Store.sharded){
    const m=Store.getShards();lastShard=m;
    try{if(Store.shardError)throw 0;r=assemble(m);raw=JSON.stringify(r)}catch{recovery={raw:Object.values(m).join("\n")||"parçalı depo okunamadı"};return structuredClone(DEF)}
  }else{
    raw=Store.get("nw_state");
    if(raw==null)return structuredClone(DEF);
    try{r=JSON.parse(raw)}catch{}
  }
  if(!r||!Array.isArray(r.entries)){recovery={raw};return structuredClone(DEF)}
  const b=buildState(r);
  if(b.drop||b.lost.length){
    const kept=rawCopy(raw);
    loadNote=[b.drop?`${b.drop} geçersiz kayıt atıldı`:"",b.lost.length?`okunamayan alanlar varsayılana döndü (${b.lost.join(", ")})`:""].filter(Boolean).join("; ")+(kept?". Eski hali ayrı bir kopyada, Ayarlar > Veri ve yedek'ten alınabilir.":". Eski hali saklanamadı (depolama dolu).");
  }
  return b.S;
}
/* localStorage holds 5-10 MB depending on the browser; a JS string is UTF-16, so a character counts as 2 bytes. Other keys such as the pre-restore copy use the same quota. */
const STORE_WARN=Store.mode==="idb"?200e6:3.5e6; // the IndexedDB quota is bound by disk; 3.5 MB applies to localStorage mode only
const lsOther=()=>{let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=="nw_state")n+=(k.length+(localStorage.getItem(k)||"").length)*2}}catch{}return n};
let saveFail=false,otherBytes=lsOther(),storeBytes=otherBytes+JSON.stringify(S).length*2;
const ARC_MAX=1.5e6; // JSON character cap of archived chats: 20 chats x 150 messages x 1500 characters could reach ~9.8 MB
let lastJ="";
/* The pre-restore safety copy is kept until the user says they saw it or 7 days pass; small writes such as the automatic backup (save(true)) never delete it to make room. */
const copyHeld=()=>!!S.settings.copyAt&&(Date.parse(dayKey())-Date.parse(S.settings.copyAt))/864e5<7&&Store.get("nw_state_previous")!=null;
/* The lock screen is needed before the first paint (lockui.js); a small flag avoids parsing the big state text. */
let lockSeen=null;
function lockFlag(){const v=S.settings.lockOn===true?"1":"0";if(v!==lockSeen){lockSeen=v;try{localStorage.setItem("nw_lockon",v)}catch{}}}
lockFlag();
/* A failed write keeps the change in memory: it is announced every time, Today and Settings show a permanent warning, the backup screen takes the in-memory state. */
const SAVE_FAIL="Son değişiklik kaydedilemedi. Depolama dolu olabilir; kapatmadan önce yedek al.";
Store.onState(f=>{saveFail=f;if(f)toast(SAVE_FAIL);else render()});
/* Only the changed shards are written, in one transaction (all of them on the first write). A shard that emptied is dropped from the store as well. */
function saveShards(m){
  const ids=Object.keys(m),ch=Object.fromEntries(ids.filter(i=>m[i]!==lastShard[i]).map(i=>[i,m[i]]));
  if(!Object.keys(ch).length&&ids.length===(Store.ids||[]).length)return;
  Store.putShards(ch,ids);lastShard=m;
}
function save(soft){
  if(recovery)return false;
  const idb=Store.mode==="idb";
  let j=null,m=null,len;
  const meas=()=>{if(idb){m=shardOf(S);len=Object.values(m).reduce((a,x)=>a+x.length,0)}else{j=JSON.stringify(S);len=j.length}};
  meas();
  if(len>STORE_WARN/2&&Coach.chats().length){
    let n=0;while(Coach.chats().length&&JSON.stringify(Coach.chats()).length>ARC_MAX){Coach.chats().pop();n++}
    if(n){meas();toast(`Depolama için en eski ${n} arşiv sohbeti silindi`)}
  }
  storeBytes=otherBytes+len*2;
  lockFlag();
  if(idb){saveShards(m);fastWatch();return !saveFail} // a failed write reaches saveFail through Store.onState
  try{localStorage.setItem("nw_state",j);saveFail=false}
  catch{
    if(soft&&copyHeld())return false;
    /* When storage is full the safety copies (pre-restore, unreadable record) go first, not the user's data. */
    let ok=false;
    for(const k of ["nw_state_previous","nw_state_corrupt"])if(!ok&&Store.get(k)!=null){Store.del(k);try{localStorage.setItem("nw_state",j);ok=true}catch{}}
    otherBytes=lsOther();storeBytes=otherBytes+j.length*2;
    if(!ok){saveFail=true;toast(SAVE_FAIL);return false}
    saveFail=false;toast("Depolama doluydu: eski güvenlik kopyaları silindi");
  }
  lastJ=j;fastWatch();return true;
}
/* Saves a change that is already applied in memory; when the write fails `undo` puts the old value back and the one message says what to do. */
function commit(undo){if(save())return true;undo();save();toast(SAVE_FAIL);return false}
/* First boot in IndexedDB mode: a state written in localStorage mode (no shards yet) is saved as shards, and the localStorage text is deleted once they are durable. */
document.addEventListener("nw:boot",()=>{
  if(Store.mode!=="idb"||recovery||Store.sharded)return;
  save();
  if(Store.get("nw_state")!=null)Store.whenIdle().then(()=>{if(!Store.failed)Store.del("nw_state")});
});
/* When the fasting brake changes (note, medication, measurement, chat flag or confirmation) the fasting notifications are rescheduled whatever screen is open. */
let fastBlk=null;
function fastWatch(){const b=!!(S.settings.fastOn&&risk().block);if(fastBlk!=null&&b!==fastBlk)scheduleReminders().then(setNotif);fastBlk=b}
const storeMsg=()=>saveFail?["Son değişiklik kaydedilemedi","Depolama dolu; değişiklik yalnız açık uygulamada duruyor. Kapatmadan yedek al, sonra Rehber sohbetini temizle ya da eski kayıtları sil."]
  :storeBytes>STORE_WARN?["Depolama dolmak üzere",`${fmt(storeBytes/1e6)} MB kullanılıyor. Yedek al, sonra Rehber sohbetini temizle ya da eski kayıtları sil.`]:null;
const isNative=()=>!!window.Capacitor?.isNativePlatform?.();
const plugin=name=>window.Capacitor?.Plugins?.[name];
/* Runs f with v, waiting only when v is a promise: delete flows stay synchronous where nothing is asynchronous (browser, no photo store). */
const chain=(v,f)=>v&&typeof v.then==="function"?v.then(f):f(v);
/* Deletes the phone-side copies (step history, motion model, widget, button queue, dose list) of the named plugins; false when one could not be cleared, so the caller does not say "deleted". */
const nativeWipe=names=>{
  const ps=names.map(n=>plugin(n)?.wipe?.()).filter(Boolean);
  return ps.length?Promise.all(ps).then(()=>true,()=>false):true;
};
const NATIVE_FAIL="Telefondaki kayıtlar silinemedi. Biraz sonra yeniden dene.";
navigator.storage?.persist?.()?.catch(()=>{});

/* Chat flag (eating disorder): a flag in the chat or a safety card is a permanent brake the user cannot lift. */
const chatEd=()=>Coach.chatEd();
/* The safety brake's input in one place; without kg the latest trend weight is used. */
/* A sign from the chat, the note, the setup or a question (k: ed, preg, nurs). ed stays; preg and nurs are lifted only by the user's own confirmation (liftRisk). */
/* Weigh-in and movement reminders (ids) that are not sent while a pregnancy sign is on. */
const PREG_OFF=[1,5];
const RISK_KEY={ed:"edFlag",preg:"pregnant",nurs:"nursing"};
function setRisk(k){
  const st=S.settings;st[RISK_KEY[k]]=true;st.riskOff=st.riskOff.split(",").filter(x=>x&&x!==k).join(",");
  if(k!=="ed")scheduleReminders().then(setNotif);
}
function liftRisk(k){const st=S.settings;st[RISK_KEY[k]]=false;st.riskOff=[...new Set(st.riskOff.split(",").concat(k))].filter(Boolean).join(",");scheduleReminders().then(setNotif)}
const weightNow=()=>{const w=weights(),ks=Object.keys(w).sort();return ks.length?Algo.trend(w)[ks[ks.length-1]]:0};
function riskInput(kg){
  const st=S.settings,from=keyOff(-89),n=k=>Vitals.all().filter(v=>v.k===k&&v.day>=from).length;
  return {age:st.age,sex:st.sex,cm:st.heightCm,kg:kg!=null?kg:weightNow(),goalKg:st.goalKg,healthNote:st.healthNote,pregnant:st.pregnant,nursing:st.nursing,off:st.riskOff,meds:Meds.count(),glucoseCount90d:n("s"),bpCount90d:n("t"),
    edFlag:st.edFlag||chatEd(),clearedAt:st.riskClearedAt,today:dayKey()};
}
function risk(kg){return Algo.riskFlags(riskInput(kg))}
/* Why a hand-typed calorie target is rejected ("" when fine): the brake of the suggestion path and the sex-based floor apply to manual entry too. */
function kcalWhy(v){
  const st=S.settings,w=weights(),ks=Object.keys(w).sort(),kg=ks.length?w[ks[ks.length-1]]:0,p={kg,cm:st.heightCm,age:st.age,sex:st.sex,act:st.act},ok=kg>0&&p.cm>0&&p.age>0;
  return Algo.manualKcal({kcal:v,sex:st.sex,age:st.age,bmr:ok?Algo.bmrMifflin(p):0,tdee:ok?Algo.formulaTdee(p):0,block:risk(kg||null).block});
}
/* Brake explanation: a hard block only explains, a soft one offers the 30-day "Hekimime danıştım" confirmation. */
const riskBox=(r,title)=>r.block?`<div class="banner"><b>${title}</b><p>${esc((r.hard.length?r.hard:r.soft).join(". "))}. ${r.hard.length?"Hekimine ya da diyetisyenine danış. Bilgi yanlışsa Profil > Sağlık notların'dan düzelt.":"Önce hekimine danış; konuştuysan 30 gün için devam edebilirsin."}</p>${r.hard.length?"":`<button class="btn ghost" data-act="riskok">Hekimime danıştım, devam</button>`}</div>`:"";

