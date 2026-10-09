"use strict";
/* ---------- yardımcılar ---------- */
const $=s=>document.querySelector(s);
const pad=n=>String(n).padStart(2,"0");
const dayKey=(d=new Date())=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(n,from=new Date())=>new Date(from.getFullYear(),from.getMonth(),from.getDate()+n);
const keyOff=n=>dayKey(addDays(n));
Algo.setClock(dayKey);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(x,d=1)=>Number(x).toFixed(d).replace(".",",");
const fmtS=(x,d=1)=>(x>0.049?"+":x<-0.049?"−":"")+fmt(Math.abs(x),d);
/* Birim ayarı (kg/lb, mg/dL ya da mmol/L) yalnız giriş ve gösterimi dönüştürür; kayıt, hesap ve Koç kg ile mg/dL'de kalır. */
Units.src(()=>S.settings);
const {fw:dw,fwS:dwS,fg:dg}=Units,wlab=()=>Units.wu(),glab=()=>Units.gl();
/* Tüm metin bir sayı (+ isteğe bağlı birim) olmalı; "-30", "1e3", "12abc3", "1.5.2" sessizce başka sayıya dönmez, NaN olur.
   Son ayırıcı ondalıktır, öncekiler binliktir ("1.234,5"); int'te tek ayırıcı + 3 hane binliktir ("1.500"), ondalıklı sayı ("1,5") yuvarlanmaz, NaN olur. */
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
const AY=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const GUN=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
const GUNK=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
/* Ekran tarihi: bu yılsa yılsız. */
const fd=k=>Algo.fdate(k,k.slice(0,4)!==dayKey().slice(0,4));
const tr=s=>s.replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();

/* ---------- veri ---------- */
const DEF={
  settings:{goalKg:0,kcal:0,waterMl:2500,glass:250,sportWeek:150,heightCm:0,age:0,sex:"",act:1,healthNote:"",consent:false,consentV:0,consentAt:"",consentP:null,piiPrev:false,chatRisk:"",copyAt:"",lastPlateau:"",goalSugAt:"",lastBackup:"",oemDone:false,obDone:false,stepsOn:false,stepsAsked:false,bpOn:false,bsOn:false,medOn:false,medShowName:false,lockOn:false,hcOn:false,hcFrom:"",cycleOn:false,cycleRem:false,fastOn:false,awakeOn:true,gdVoice:true,gdVib:true,theme:"",rpeOn:false,motionOn:false,bpSysHi:0,bpDiaHi:0,bpSysLo:0,bpDiaLo:0,gFastLo:0,gFastHi:0,gPostLo:0,gPostHi:0,stepGoal:8000,moveKcalOn:false,stepWarnDay:"",stepsFrom:"",autoBk:false,lastAutoBk:"",riskClearedAt:"",fastInfoOk:false,fastLongOk:false,reminders:[
    {id:1,t:"09:00",on:true,name:"Sabah tartısı",title:"Günaydın ☀️",body:"Tartıl ve kilonu kaydet."},
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
const RANGES={...VR,goalKg:[20,400,false],kcal:[800,8000,true],waterMl:[500,10000,true],glass:[50,1500,true],sportWeek:[10,3000,true],stepGoal:[1000,100000,true],heightCm:[100,250,true],age:[10,100,true]};
const SETLBL={goalKg:"Hedef kilo",kcal:"Günlük kalori",waterMl:"Günlük su",glass:"Bir bardak",sportWeek:"Haftalık spor",stepGoal:"Günlük adım",heightCm:"Boy",age:"Yaş",bpSysHi:"Büyük tansiyon üst sınır",bpDiaHi:"Küçük tansiyon üst sınır",bpSysLo:"Büyük tansiyon alt sınır",bpDiaLo:"Küçük tansiyon alt sınır",gFastLo:"Açlık alt sınır",gFastHi:"Açlık üst sınır",gPostLo:"Yemek sonrası alt sınır",gPostHi:"Yemek sonrası üst sınır"};
const ZEROOK=["goalKg","kcal","heightCm","age",...Object.keys(VR)];
const {copyNutr,NUTR}=LogLib;
const NLBL={p:"protein",c:"karbonhidrat",f:"yağ",fb:"lif",sg:"şeker",na:"sodyum"},NUNIT=k=>k==="na"?"mg":"g";
const TYPES=["su","kilo","yemek","spor","not","adim"];
const dayOk=s=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+"T00:00Z").toJSON()?.slice(0,10)===s;
const timeOk=s=>typeof s==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
/* Koç onay metni değiştiğinde artırılır: eski sürümle verilmiş onay geçersiz sayılır ve yeniden sorulur. */
const CONSENT_V=2;
const MED_NOTE="NeoWell tıbbi cihaz değildir, tanı koymaz ve tedavi önermez; hekim yerine geçmez. Sağlık kararların için hekimine danış.";
function cleanSettings(raw){
  const d=structuredClone(DEF.settings),o=raw&&typeof raw==="object"?raw:{};
  for(const k in RANGES){
    const [lo,hi,int]=RANGES[k],v=o[k];
    if(ZEROOK.includes(k)&&v===0){d[k]=0;continue}
    if(typeof v==="number"&&isFinite(v)&&v>=lo&&v<=hi)d[k]=int?Math.round(v):v;
  }
  if(o.sex==="m"||o.sex==="f")d.sex=o.sex;
  if(o.act===0||o.act===1||o.act===2)d.act=o.act;
  if(typeof o.healthNote==="string")d.healthNote=o.healthNote.slice(0,500);
  if(o.consent===true&&o.consentV===CONSENT_V&&!(d.age>0&&d.age<18)){d.consent=true;d.consentV=CONSENT_V;if(dayOk(o.consentAt))d.consentAt=o.consentAt}
  if(d.consent&&typeof o.consentP==="string")d.consentP=o.consentP.slice(0,200);
  if(/^(ed|preg|ed,preg)$/.test(o.chatRisk))d.chatRisk=o.chatRisk;
  if(dayOk(o.copyAt))d.copyAt=o.copyAt;
  if(dayOk(o.lastPlateau))d.lastPlateau=o.lastPlateau;
  if(dayOk(o.goalSugAt))d.goalSugAt=o.goalSugAt;
  if(dayOk(o.lastBackup))d.lastBackup=o.lastBackup;
  if(o.autoBk===true)d.autoBk=true;
  if(dayOk(o.lastAutoBk))d.lastAutoBk=o.lastAutoBk;
  if(dayOk(o.riskClearedAt))d.riskClearedAt=o.riskClearedAt;
  if(o.oemDone===true)d.oemDone=true;
  /* Bayrak eklenmeden önceki yedek ve kayıtlar mevcut kullanıcıdır, onboarding görmez. */
  if(o.obDone===true)d.obDone=true;
  if(o.piiPrev===true)d.piiPrev=true;
  if(o.stepsOn===true)d.stepsOn=true;
  if(o.bpOn===true)d.bpOn=true;
  if(o.bsOn===true)d.bsOn=true;
  if(o.medOn===true)d.medOn=true;
  if(o.cycleOn===true){d.cycleOn=true;if(o.cycleRem===true)d.cycleRem=true}
  if(o.fastOn===true)d.fastOn=true;
  if(o.motionOn===true)d.motionOn=true;
  if(o.fastInfoOk===true)d.fastInfoOk=true;
  if(o.fastLongOk===true)d.fastLongOk=true;
  if(o.moveKcalOn===true)d.moveKcalOn=true;
  if(o.lockOn===true)d.lockOn=true;
  if(o.hcOn===true)d.hcOn=true;
  if(dayOk(o.hcFrom))d.hcFrom=o.hcFrom;
  if(o.medShowName===true)d.medShowName=true; // varsayılan gizli: ilaç adı kilit ekranında yalnız kullanıcı açarsa görünür
  if(o.awakeOn===false)d.awakeOn=false;
  if(o.gdVoice===false)d.gdVoice=false;
  if(o.gdVib===false)d.gdVib=false;
  if(o.rpeOn===true)d.rpeOn=true;
  if(o.theme==="light"||o.theme==="dark")d.theme=o.theme;
  if(o.wUnit==="lb")d.wUnit="lb";
  if(o.gUnit==="mmol")d.gUnit="mmol";
  if(o.stepsAsked===true)d.stepsAsked=true;
  if(dayOk(o.stepWarnDay))d.stepWarnDay=o.stepWarnDay;
  if(dayOk(o.stepsFrom))d.stepsFrom=o.stepsFrom;
  if(Array.isArray(o.reminders))for(const r of d.reminders){
    const x=o.reminders.find(y=>y&&y.id===r.id);
    if(x){if(timeOk(x.t))r.t=x.t;if(typeof x.on==="boolean")r.on=x.on;if(typeof x.body==="string"&&x.body.trim().length>=5&&x.body.length<=110)r.body=x.body.trim()}
  }
  return d;
}
let LOST=[];
/* Alan alan yalıtılır: biri bozuksa yalnız o alan varsayılana döner, kalan veri korunur. */
function cleanHealthState(r){
  r=r||{};const o={},f=(k,fn)=>{try{o[k]=fn()}catch(e){LOST.push(k)}};
  f("pulse",()=>PulseLib.clean(r.pulse));f("hr",()=>PulseLib.cleanHr(r.hr));
  f("meds",()=>MedLib.cleanMeds(r.meds));
  if(o.meds)f("medLog",()=>MedLib.cleanLog(r.medLog,o.meds));
  f("moves",()=>MotionLib.clean(r.moves));f("measures",()=>Algo.cleanMeasures(r.measures));f("walk",()=>Algo.cleanWalk(r.walk,Date.now()));
  f("favFoods",()=>LogLib.cleanFav(r.favFoods));f("recipes",()=>LogLib.cleanRecipes(r.recipes));f("mealTpl",()=>LogLib.cleanTpl(r.mealTpl));
  f("fast",()=>HabitLib.cleanFast(r.fast));f("sleep",()=>HabitLib.cleanSleep(r.sleep));f("mood",()=>HabitLib.cleanMood(r.mood));
  return o;
}
function cleanMyFoods(arr){
  const out=[],seen=new Set();
  for(const x of (Array.isArray(arr)?arr:[]).slice(0,200)){
    if(!x||typeof x.n!=="string"||!x.n.trim()||!(x.k>=0&&x.k<=5000))continue;
    const n=x.n.trim().slice(0,60),key=tr(n);if(seen.has(key))continue;seen.add(key);
    const f={n,k:Math.round(x.k*10)/10};
    for(const m of NUTR)if(Number.isFinite(x[m])&&x[m]>=0&&x[m]<=LogLib.PER100[m])f[m]=x[m];
    if(typeof x.b==="string"&&/^\d{8,14}$/.test(x.b))f.b=x.b;
    if(x.src==="off")f.src="off";
    if(x.por===true)f.por=true; // Koç kartından: değerler 1 porsiyon başına, gramı bilinmiyor
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
      (e.type==="kilo"&&!(v>=20&&v<=400))||(e.type==="su"&&!(v>0&&v<=10000))||
      (e.type==="spor"&&!(v>0&&v<=600))||(e.type==="adim"&&!(v>0&&v<=200000))||(e.type==="yemek"&&v!=null&&!(v>=0&&v<=20000));
    if(bad){drop++;continue}
    const id=Number.isInteger(e.id)&&e.id>0&&!seen.has(e.id)?e.id:0;
    if(id){seen.add(id);max=Math.max(max,id)}
    const ne={id,day:e.day,time:timeOk(e.time)?e.time:"00:00",type:e.type,v:e.type==="not"?null:v,text:typeof e.text==="string"?e.text.slice(0,500):""};
    if(Number.isFinite(e.qt)&&e.qt>0)ne.qt=e.qt; // bildirimden gelen su kaydının zamanı: aynı kayıt ikinci kez alınmasın
    if(Number.isInteger(e.wid))ne.wid=e.wid;
    if(e.type==="spor"){if(e.bt===true)ne.bt=true;if(Number.isInteger(e.kcal)&&e.kcal>=0&&e.kcal<=5000)ne.kcal=e.kcal;if(typeof e.km==="number"&&e.km>=0&&e.km<=100)ne.km=Math.round(e.km*100)/100}
    if(e.type==="adim"){for(const k of ["ph","hc"])if(Number.isFinite(e[k])&&e[k]>=0&&e[k]<=200000)ne[k]=e[k]}
    if(e.type==="su"&&drinkOk(e.dr))ne.dr=e.dr;
    if(e.type==="spor"&&CardioLib.kind(e.ck)){ne.ck=e.ck;if(typeof e.cn==="string"&&e.cn.trim())ne.cn=e.cn.trim().slice(0,80)}
    if(e.type==="yemek"){copyNutr(e,ne);if(LogLib.mealKey(e.meal))ne.meal=e.meal;if(ne.v!=null&&Number.isInteger(e.lo)&&Number.isInteger(e.hi)&&e.lo>=0&&e.lo<=ne.v&&ne.v<=e.hi&&e.hi<=20000){ne.lo=e.lo;ne.hi=e.hi}}
    out.push(ne);
  }
  for(const e of out)if(!e.id)e.id=++max;
  return {out,drop,next:max+1};
}
/* Yedek ve açılış aynı temizliği kullanır. Atılan öğe sayısı DROPS.n'de, okunamayıp varsayılana dönen alanlar LOST'ta toplanır. */
const DROPS={n:0};
function buildState(r){
  DROPS.n=0;LOST=[];
  const parts=[["ayarlar",()=>({settings:cleanSettings(r.settings)})],
    ["kayıtlar",()=>{const c=cleanEntries(r.entries);DROPS.n+=c.drop;return {entries:c.out,nextId:c.next}}],
    ["besinler",()=>({myFoods:cleanMyFoods(r.myFoods)})],["tahliller",()=>({labs:LabLib.cleanLabs(r.labs)})],["ölçümler",()=>({vitals:VitalsLib.clean(r.vitals)})],
    ["sağlık",()=>cleanHealthState(r)],["döngü",()=>({cycle:CycleLib.clean(r.cycle,dayKey())})],["antrenman",()=>cleanGym(r)],["Koç",()=>cleanCoach(r)]];
  const st=structuredClone(DEF);
  for(const [k,fn] of parts)try{Object.assign(st,fn())}catch(e){LOST.push(k)}
  const wids=new Set(st.workouts.map(w=>w.id));
  for(const e of st.entries)if(e.wid!=null&&!wids.has(e.wid))delete e.wid;
  return {S:st,drop:DROPS.n,lost:[...new Set(LOST)]};
}
/* Okunamayan kayıt silinmez: save() kilitlenir, kullanıcı ham veriyi dışa aktarır ya da bilerek boş başlar. */
let recovery=null,loadNote="";
const rawCopy=raw=>Store.set("koc_v1_bozuk",raw);
/* Parçalı depo: S modül başına ayrı metne bölünür (Shards, modules.js); kayıtta yalnız değişen parça yazılır. */
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
  if(rest.length)put("diger",Object.fromEntries(rest.map(k=>[k,st[k]])));
  return m;
};
/* Parçaları birleştirir; ay parçalarındaki diziler birleşir ve kimliğe göre sıralanır (kayıt sırası bozulmaz). */
const assemble=m=>{
  const r={};
  for(const j of Object.values(m))for(const [k,v] of Object.entries(JSON.parse(j))){
    if(Chunks[k]&&Array.isArray(v)&&Array.isArray(r[k]))r[k]=r[k].concat(v);else r[k]=v;
  }
  for(const k of Object.keys(Chunks))if(Array.isArray(r[k]))r[k].sort((a,b)=>(a.id||0)-(b.id||0));
  return r;
};
let lastShard={};
let S=load();
function load(){
  let r=null,raw;recovery=null;
  if(Store.sharded){
    const m=Store.getShards();lastShard={...m};
    try{if(Store.shardError)throw 0;r=assemble(m);raw=JSON.stringify(r)}catch(e){recovery={raw:Object.values(m).join("\n")||"parçalı depo okunamadı"};return structuredClone(DEF)}
  }else{
    raw=Store.get("koc_v1");
    if(raw==null)return structuredClone(DEF);
    try{r=JSON.parse(raw)}catch(e){}
  }
  if(!r||!Array.isArray(r.entries)){recovery={raw};return structuredClone(DEF)}
  const b=buildState(r);
  if(b.drop||b.lost.length){
    const kept=rawCopy(raw);
    loadNote=[b.drop?`${b.drop} geçersiz kayıt atıldı`:"",b.lost.length?`okunamayan alanlar varsayılana döndü (${b.lost.join(", ")})`:""].filter(Boolean).join("; ")+(kept?". Eski hali ayrı bir kopyada, Ayarlar > Veri ve yedek'ten alınabilir.":". Eski hali saklanamadı (depolama dolu).");
  }
  return b.S;
}
/* localStorage tarayıcıya göre 5-10 MB; JS dizesi UTF-16 olduğu için karakter başına 2 bayt sayılır. Yedek öncesi kopya gibi diğer anahtarlar da aynı kotadan yer. */
const STORE_WARN=Store.mode==="idb"?200e6:3.5e6; // IndexedDB kotası diskle sınırlı; 3,5 MB yalnız localStorage kipinde geçerli
const lsOther=()=>{let n=0;try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k!=="koc_v1")n+=(k.length+(localStorage.getItem(k)||"").length)*2}}catch(e){}return n};
let saveFail=false,otherBytes=lsOther(),storeBytes=otherBytes+JSON.stringify(S).length*2;
/* Yazılamazsa değişiklik bellekte kalır: her seferinde söylenir, Bugün ve Ayarlar'da kalıcı uyarı çıkar, yedek ekranı bellekteki hali alır. */
const ARC_MAX=1.5e6; // arşiv sohbetlerinin JSON karakter sınırı: 20 sohbet x 150 mesaj x 1500 karakter ~9,8 MB'a çıkabilir
let lastJ="";
/* Geri yüklemeden önceki güvenlik kopyası, kullanıcı gördüm diyene ya da 7 gün geçene kadar korunur; otomatik yedek gibi küçük yazımlar (save(true)) onu silerek yer açmaz. */
const copyHeld=()=>!!S.settings.copyAt&&(Date.parse(dayKey())-Date.parse(S.settings.copyAt))/864e5<7&&Store.get("koc_v1_onceki")!=null;
/* Kilit ekranı ilk boyamadan önce gerekir (lockui.js); büyük kayıt metnini ayrıştırmamak için küçük bir bayrak tutulur. */
let lockSeen=null;
function lockFlag(){const v=S.settings.lockOn===true?"1":"0";if(v!==lockSeen){lockSeen=v;try{localStorage.setItem("nw_lockon",v)}catch(e){}}}
lockFlag();
Store.onState(f=>{saveFail=f;if(f)toast("Son değişiklik kaydedilemedi. Uygulamayı kapatmadan yedek al.");else if(typeof render==="function")render()});
/* Yalnız değişen parçalar tek işlemde yazılır. İlk yazımda (eski tek metinden ya da temiz kurulumdan) hepsi yazılır; eski tek metin bu oturumda yedek kalır, sonraki açılışta silinir. */
function saveShards(m){
  const ids=Object.keys(m),first=!Store.sharded,ch={};
  for(const i of ids)if(first||m[i]!==lastShard[i])ch[i]=m[i];
  if(!first&&!Object.keys(ch).length&&ids.length===(Store.ids||[]).length)return true;
  if(first){const back=assemble(m),src=JSON.parse(JSON.stringify(S));if(Object.keys(src).some(k=>JSON.stringify(back[k])!==JSON.stringify(src[k])))return false}
  const ok=Store.putShards(ch,ids);lastShard=Object.fromEntries(ids.map(i=>[i,i in ch?ch[i]:lastShard[i]]));return ok; // boşalan parça kaydı da düşer
}
function save(soft){
  if(recovery)return false;
  const idb=Store.mode==="idb";
  let j=null,m=null,len;
  const meas=()=>{if(idb){m=shardOf(S);len=Object.values(m).reduce((a,x)=>a+x.length,0)}else{j=JSON.stringify(S);len=j.length}};
  meas();
  if(len>STORE_WARN/2&&S.chats.length){
    let n=0;while(S.chats.length&&JSON.stringify(S.chats).length>ARC_MAX){S.chats.pop();n++}
    if(n){meas();toast(`Depolama için en eski ${n} arşiv sohbeti silindi`)}
  }
  storeBytes=otherBytes+len*2;
  lockFlag();
  if(idb){
    if(saveShards(m)===false&&!Store.sharded){j=JSON.stringify(S);Store.set("koc_v1",j);lastJ=j} // parça doğrulaması tutmazsa eski tek metin düzeni sürer
    fastWatch();return !saveFail} // yazım başarısızlığı Store.onState ile saveFail'e yansır
  try{localStorage.setItem("koc_v1",j);saveFail=false}
  catch(e){
    if(soft&&copyHeld())return false;
    /* Dolu depoda önce yedek kopyaları (geri yükleme öncesi, okunamayan kayıt) gider, kullanıcı verisi değil. */
    let ok=false;
    for(const k of ["koc_v1_onceki","koc_v1_bozuk"])if(!ok&&Store.get(k)!=null){Store.del(k);try{localStorage.setItem("koc_v1",j);ok=true}catch(e2){}}
    otherBytes=lsOther();storeBytes=otherBytes+j.length*2;
    if(!ok){saveFail=true;toast("Son değişiklik kaydedilemedi: depolama dolu. Uygulamayı kapatmadan yedek al.");return false}
    saveFail=false;toast("Depolama doluydu: eski güvenlik kopyaları silindi");
  }
  lastJ=j;fastWatch();return true;
}
/* Açılışta: eski tek metinden parçalı düzene geçilir (tek işlemde); geçiş önceki oturumda olduysa eski tek metin silinir (silinen veri yedek kopyada kalmasın). */
document.addEventListener("nw:boot",()=>{
  if(Store.mode!=="idb"||recovery)return;
  if(!Store.sharded)save();
  else if(Store.get("koc_v1")!=null)Store.del("koc_v1");
});
/* Başka sekme (yalnız web) kaydettiyse onun durumu alınır; yoksa bu sekme sonraki kayıtta onu eski veriyle ezerdi. */
addEventListener("storage",ev=>{
  if(recovery||Store.mode==="idb"||ev.storageArea!==localStorage||ev.key!=="koc_v1"||!ev.newValue||ev.newValue===lastJ)return;
  let r=null;try{r=JSON.parse(ev.newValue)}catch(e){}
  if(!r||!Array.isArray(r.entries))return;
  S=buildState(r).S;lastJ=ev.newValue;logOff=0;render();toast("Başka bir sekmedeki değişiklik alındı");
});
/* IndexedDB kipinde başka sekme (yalnız web) kaydettiyse sıra numarasıyla haberleşilir. */
Store.onExternal(x=>{
  if(recovery)return;let r=null;try{r=typeof x==="string"?JSON.parse(x):assemble(x)}catch(e){}
  if(!r||!Array.isArray(r.entries))return;
  S=buildState(r).S;if(typeof x==="string")lastJ=x;else lastShard={...x};logOff=0;render();toast("Başka bir sekmedeki değişiklik alındı");
});
/* Oruç freni not, ilaç, ölçüm, sohbet işareti ya da onayla değişince oruç bildirimleri hangi ekrandan olursa olsun yeniden kurulur. */
let fastBlk=null;
function fastWatch(){const b=!!(S.settings.fastOn&&risk().block);if(fastBlk!=null&&b!==fastBlk)scheduleReminders().then(setNotif);fastBlk=b}
const storeMsg=()=>saveFail?["Son değişiklik kaydedilemedi","Depolama dolu; değişiklik yalnız açık uygulamada duruyor. Kapatmadan yedek al, sonra Koç sohbetini temizle ya da eski kayıtları sil."]
  :storeBytes>STORE_WARN?["Depolama dolmak üzere",`${fmt(storeBytes/1e6)} MB kullanılıyor. Yedek al, sonra Koç sohbetini temizle ya da eski kayıtları sil.`]:null;
const isNative=()=>!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

function add(type,v,text,day){
  const n=new Date();
  if(!day)logOff=0;
  const e={id:S.nextId++,day:day||dayKey(n),time:`${pad(n.getHours())}:${pad(n.getMinutes())}`,type,v:v==null?null:v,text:text||""};
  if(type==="spor"&&day&&day!==dayKey(n))e.bt=true; // geçmiş güne girildi: saat kayıt anıdır, egzersiz aralığı bilinmez (Algo.exerciseKcal)
  S.entries.push(e);save();return e;
}
const of=(type,day)=>S.entries.filter(e=>e.type===type&&e.day===day);
const sum=(type,a,b)=>S.entries.filter(e=>(type==="su"?WeeklyLib.isWater(e):e.type===type)&&e.day>=a&&e.day<=b).reduce((s,e)=>s+(e.v||0),0);
/* Hareket kalorisi ayarı açıksa o günün kalori hedefine eklenen kısım; kapalıysa 0. Ring, widget ve toast tek yerden okur. */
const moveAdd=day=>{
  if(!(S.settings.moveKcalOn&&S.settings.kcal>0))return 0;
  const dn=Algo.dayNum(day),near=x=>Math.abs(Algo.dayNum(x.day)-dn)<=1; // gece yarısını aşan egzersiz komşu günde de durur
  return Algo.moveBonus(Algo.exerciseKcal(S.entries.filter(e=>e.type==="spor"&&near(e)),S.moves.filter(near),day));
};
const kcalGoal=day=>S.settings.kcal>0?S.settings.kcal+moveAdd(day):0;
/* Güvenlik freninin girdisi tek yerde; kg verilmezse son trend kilo. */
/* Sohbet işareti (yeme bozukluğu): sohbetteki bayrak ya da güvenlik kartı kalıcı fren sayılır; kullanıcı kaldıramaz. */
const chatEd=()=>S.chat.some(m=>m.fl==="ed"||(m.card&&m.card.kind==="safety"&&m.card.level==="ed"));
function riskInput(kg){
  const st=S.settings,from=keyOff(-89),w=weights(),ks=Object.keys(w).sort(),n=k=>S.vitals.filter(v=>v.k===k&&v.day>=from).length;
  return {age:st.age,sex:st.sex,cm:st.heightCm,kg:kg!=null?kg:ks.length?Algo.trend(w)[ks[ks.length-1]]:0,goalKg:st.goalKg,healthNote:st.healthNote+((st.chatRisk||"").includes("preg")?" hamilelik":""),meds:S.meds.length,glucoseCount90d:n("s"),bpCount90d:n("t"),
    edFlag:(st.chatRisk||"").includes("ed")||chatEd(),clearedAt:st.riskClearedAt,today:dayKey()};
}
function risk(kg){return Algo.riskFlags(riskInput(kg))}
/* Elle yazılan kalori hedefinin reddedilme nedeni ("" ise uygun): öneri yolundaki fren ve cinsiyete göre taban elle girişte de geçerli. */
function kcalWhy(v){
  const st=S.settings,w=weights(),ks=Object.keys(w).sort(),kg=ks.length?w[ks[ks.length-1]]:0,p={kg,cm:st.heightCm,age:st.age,sex:st.sex,act:st.act},ok=kg>0&&p.cm>0&&p.age>0;
  return Algo.manualKcal({kcal:v,sex:st.sex,age:st.age,bmr:ok?Algo.bmrMifflin(p):0,tdee:ok?Algo.formulaTdee(p):0,block:risk(kg||null).block});
}
/* Fren açıklaması: sert engelde yalnız açıklama, yumuşakta 30 günlük "Hekimime danıştım" onayı. */
const riskBox=(r,title)=>r.block?`<div class="banner"><b>${title}</b><p>${esc((r.hard.length?r.hard:r.soft).join(". "))}. ${r.hard.length?"Hekimine ya da diyetisyenine danış. Bilgi yanlışsa Profil > Sağlık notların'dan düzelt.":"Önce hekimine danış; konuştuysan 30 gün için devam edebilirsin."}</p>${r.hard.length?"":`<button class="btn ghost" data-act="riskok">Hekimime danıştım, devam</button>`}</div>`:"";
function weights(a="0000",b="9999"){const m={};for(const e of S.entries)if(e.type==="kilo"&&e.day>=a&&e.day<=b)m[e.day]=e.v;return m}
const avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const vals=m=>Object.values(m);
function streak(){
  const ds=new Set(S.entries.filter(e=>e.type!=="adim").map(e=>e.day));let d=new Date();
  if(!ds.has(dayKey(d)))d=addDays(-1);
  let n=0;while(ds.has(dayKey(d))){n++;d=addDays(-1,d)}return n;
}

