"use strict";
/* Gym: data model, screens and interaction. Uses the global helpers of the main shell. */
const GPLATE_DEF=[25,20,15,10,5,2.5,1.25],GPLATE_ALL=[25,20,15,10,5,2.5,2,1.25,1,0.5];
const GROUPS=["Bacak","İtiş","Çekiş","Omuz","Kol","Karın"];
const KG_MAX=1000,REPS_MAX=200,SEC_MAX=7200,WORKOUT_MIN_MAX=600,WEEK_MS=7*864e5;
// Exercises the Coach catalog lists first.
const CORE_EX=["squat","legpress","rdl","legcurl","legext","calf","bench","incdb","tri","ohp","lat","pullup","pulldown","row","curl","crunch"];
const REST_SEC=90;
let gPgF={d:0,lv:""},gPgD=0,gTe=null,gTeOn=false,gHistMax=20,gRecMax=5,gTim=null,gPickMax=40,restEnd=0,restTx="",gQuery="",gGroup="Tümü",gNew=false;

const EXREG=["Göğüs","Sırt","Omuz","Biseps","Triseps","Ön kol","Karın","Bel","Kalça","Ön bacak","Arka bacak","Baldır","İç-dış bacak","Trapez","Boyun","Tüm vücut"];
const EXBY=new Map(EXDB.map(e=>[e.id,e]));
// A custom exercise derives its coarse group (used by the summary and the Coach) from its region.
const GREG={"Göğüs":"İtiş","Triseps":"İtiş","Sırt":"Çekiş","Bel":"Çekiş","Omuz":"Omuz","Trapez":"Omuz","Boyun":"Omuz","Biseps":"Kol","Ön kol":"Kol","Karın":"Karın"};
const GNEWK={w:"Ağırlık × tekrar",b:"Tekrar",t:"Süreli",c:"Kardiyo"},GNEWQ=["Ağırlıksız","Ev tipi","Salon"];
const GFIG={squat:"Çömelme",hinge:"Kalça menteşesi",lunge:"Hamle",stepup:"Basamağa çıkış",legext:"Bacak açma",legcurl:"Bacak bükme",legpress:"Leg press",bridge:"Kalça köprüsü",calf:"Baldır kaldırma",legspread:"Yana adım",pushup:"Şınav",bench:"Yatarak itiş",incline:"Eğimli itiş",fly:"Açma (fly)",dips:"Dips",ohp:"Omuz press",latraise:"Yana kaldırma",frontraise:"Öne kaldırma",skull:"Yatarak triceps",row:"Öne eğilip çekiş",pullup:"Barfiks",pulldown:"Yukarıdan çekiş",seatedrow:"Oturarak çekiş",backext:"Bel ekstansiyonu",shrug:"Omuz silkme",curl:"Biceps curl",pushdown:"Triceps pushdown",kickback:"Triceps kickback",overheadext:"Baş üstü triceps",crunch:"Mekik",situp:"Tam mekik",legraise:"Ters mekik",hangraise:"Asılı bacak kaldırma",plank:"Plank",climber:"Dağcı",sidebend:"Yan eğilme",woodchop:"Gövde bükme",jack:"Açılıp kapanma",run:"Koşu",highknees:"Yüksek diz",walk:"Yürüyüş",jumprope:"İp atlama",cycle:"Bisiklet",qstretch:"Ön bacak esnetme",hamstretch:"Arka bacak esnetme",armstretch:"Göğüs esnetme",neckstretch:"Boyun",twiststretch:"Gövde döndürme"};
let gNewS={n:"",k:"w",r:"Ön bacak",q:"Salon",tp:""};
const gExAll=()=>EXDB.concat(S.customEx);
const gKind=id=>gEx(id).k||"w";
const gTimed=id=>"tic".includes(gKind(id));
const gSetOk=s=>!s.w&&(s.reps>0||s.sec>0); // w: warm-up set, excluded from every calculation
const gDoneSets=x=>x.sets.filter(t=>t.done&&gSetOk(t));
const gOpenSets=w=>w.ex.reduce((s,x)=>s+x.sets.filter(t=>!t.done&&gSetOk(t)).length,0);
const gCompleteAll=w=>{for(const x of w.ex)for(const t of x.sets)if(gSetOk(t))t.done=true};
const gVib=p=>{try{navigator.vibrate?.(p)}catch{}};
/* Record and progression rule in one place: a drop set (t:"d") counts toward volume, but its light weight with many reps must not skew the 1RM estimate or the suggestion, so it is excluded from both. */
const gRecOk=s=>gSetOk(s)&&s.t!=="d";
const gWork=a=>{const r=a.filter(gRecOk);return r.length?r:a};
const gSetTx=s=>s.w?"ısınma":s.t==="d"?"drop set":s.t==="f"?"başarısızlığa kadar":"normal";
/* Superset: consecutive exercises with the same ss. Grouping looks at neighbours only; a lone ss is removed. */
function gSsNorm(l){for(let i=0;i<l.length;i++){const v=l[i].ss;if(v&&!(i&&l[i-1].ss===v)&&!(i<l.length-1&&l[i+1].ss===v))delete l[i].ss}}
function gGrp(w,ei){
  const v=w.ex[ei].ss;if(!v)return null;let a=ei,b=ei;
  while(a>0&&w.ex[a-1].ss===v)a--;while(b<w.ex.length-1&&w.ex[b+1].ss===v)b++;
  return b>a?{a,b,n:b-a+1,i:ei-a+1}:null;
}
const gSsLast=(w,ei)=>{const g=gGrp(w,ei);return !g||ei===g.b};
const gSsGroups=w=>w.ex.map((x,i)=>gGrp(w,i)).filter((g,i)=>g&&g.a===i).map(g=>w.ex.slice(g.a,g.b+1));
const gDrops=w=>w.ex.reduce((n,x)=>n+x.sets.filter(t=>t.done&&t.t==="d").length,0);
const gEx=id=>EXBY.get(id)||S.customEx.find(e=>e.id===id)||{id,n:"Silinmiş egzersiz",g:"Diğer",inc:2.5};
const gActive=()=>S.workouts.find(w=>w.t1==null)||null;
const gDone=w=>w.t1!=null;
/* Heavy compound lifts need longer recovery (ACSM: 2-3 min), isolation 1-2 min. Timed work gets 30 s, cardio 0; an exercise without a figure (custom) stays at 90 s. */
const GREST_BIG=new Set(["squat","lunge","legpress","hinge","bench","incline","ohp","row","seatedrow","pullup","pulldown","dips"]);
const gRestDef=id=>{const e=gEx(id),k=gKind(id);return k==="c"?0:"ti".includes(k)?30:!e.tp?REST_SEC:GREST_BIG.has(e.tp)?150:75};
const gRestSec=id=>{const c=S.exCfg[id];return c&&c.rest!=null?c.rest:gRestDef(id)};
const gRestTx=s=>s?gClock(s*1000):"kapalı";
function gCfg(id,patch){
  const c=Object.assign({},S.exCfg[id],patch);for(const k in c)if(c[k]==null)delete c[k];
  if(Object.keys(c).length)S.exCfg[id]=c;else delete S.exCfg[id];
}
/* The rest end is also announced by a local notification: the JS timer does not run while the screen is off or the app is in the background. */
/* With no unchecked set left there is nothing to rest for: no counter and no notification. */
const gRestStart=(w,ei)=>gRestSet(gNext(w)?Date.now()+gRestSec(w.ex[ei].id)*1000:0,gNextTx(w,ei));
const gRestGo=(w,ei)=>{if(gSsLast(w,ei))gRestStart(w,ei)};
/* What the rest notification names: the first exercise with a set left, counted from this one (a superset round goes back to its first exercise), or the end. */
function gNextTx(w,ei){
  const g=gGrp(w,ei),a=g?g.a:ei,x=[...w.ex.slice(a),...w.ex.slice(0,a)].find(e=>e.sets.some(s=>!s.done));
  return x?`Sıradaki: ${gEx(x.id).n}`:"Tüm setler tamam, antrenmanı bitirebilirsin";
}
/* tx is the line for the notification; without it (the +30 s buttons) the last one stays. */
function gRestSet(end,tx){
  restEnd=end>Date.now()?end:0;
  if(tx!=null)restTx=tx;
  if(restEnd)gNotify(restEnd,"⏱ Dinlenme bitti",restTx||"Sıradaki sete geç",9002);else{restTx="";gNotifyCancel(9002)}
  const w=gActive(),r=restEnd?{end:restEnd,tx:restTx}:null;
  if(w&&(w.rest?.end!==r?.end||w.rest?.tx!==r?.tx)){if(r)w.rest=r;else delete w.rest;save()}
}
/* The rest end is stored on the active workout, so a restart or an app killed in the background keeps the counter. */
function gRestLoad(){const r=(gActive()||{}).rest;if(r&&!restEnd&&r.end>Date.now()){restEnd=r.end;restTx=r.tx}}
const gRpeTx=s=>s&&s.rpe?` @${fkg(s.rpe)}`:"";
const fkg=x=>x==null||x===""?"":String(Math.round(x*100)/100).replace(".",",");
/* Weight shown in the unit of the settings; storage and calculations stay in kg. */
const gW=kg=>kg==null?"":fkg(Units.w(kg));
/* The ± step in lb: the exercise's kg step rounded to a plate-like 2,5 / 5 / 10 lb. */
const gLbStep=inc=>{const l=inc*2.20462;return Math.max(2.5,l<7.5?Math.round(l/2.5)*2.5:Math.round(l/5)*5)};
/* A set's stored field as the text of its input (the cardio duration in minutes). */
const gShow=(f,s,id)=>{const v=s[f];return v==null?"":f==="sec"?Math.round(v/(gKind(id)==="c"?60:1)):f==="kg"?gW(v):f==="rpe"?fkg(v):v};
/* One typed set field: {v} to store (null = empty) or {err} with the message. A text equal to what the stored value shows is not parsed again, so a lb round trip does not drift. */
function gField(f,raw,s,id){
  raw=raw.trim();
  if(raw===gShow(f,s,id))return {v:s[f]==null?null:s[f]};
  if(raw==="")return {v:null};
  if(f==="sec"){
    const u=gKind(id)==="c"?60:1,max=u===60?120:SEC_MAX,v=num(raw,true);
    return v>=1&&v<=max?{v:v*u}:{err:u===60?"Süre 1 ile 120 dakika arasında olmalı":"Süre 1 ile 7200 saniye arasında olmalı"};
  }
  if(f==="rpe"){const v=num(raw);return v>=6&&v<=10&&v*2===Math.round(v*2)?{v}:{err:"Zorluk 6 ile 10 arasında, 0,5 adımla olmalı"}}
  if(f==="kg"){const v=Units.wIn(num(raw));return v>=0&&v<=KG_MAX?{v}:{err:`Ağırlık 0 ile ${fkg(Units.w(KG_MAX))} ${Units.wu()} arasında olmalı`}}
  const v=num(raw,true);
  return v>=1&&v<=REPS_MAX?{v}:{err:"Tekrar 1 ile 200 arasında olmalı"};
}
/* One done set as text: "60 × 8", "8 tekrar" (no weight), "45 sn" / "20 dk" (timed). */
const gSetLine=(id,s)=>gTimed(id)?exKindSec(id,s.sec):s.kg?`${gW(s.kg)} × ${s.reps}`:`${s.reps} tekrar`;
const gSetsLine=x=>gDoneSets(x).map(s=>gSetLine(x.id,s)).join(", ");

/* ---- validation (load and restore) ---- */
function cleanGym(r){
  const pl=Array.isArray(r.plates)?GPLATE_ALL.filter(p=>r.plates.includes(p)):[];
  const out={workouts:[],templates:[],customEx:[],gid:1,bar:r.bar>=5&&r.bar<=50?+r.bar:20,dbStep:[1,2,2.5].includes(r.dbStep)?r.dbStep:0,plates:pl.length?pl:GPLATE_DEF.slice(),exCfg:{}};
  const idOk=x=>Number.isInteger(x)&&x>0;
  let maxId=0;
  const ce=Array.isArray(r.customEx)?r.customEx:[];
  for(const e of ce){
    if(!e||typeof e.id!=="string"||!/^c\d+$/.test(e.id)||typeof e.n!=="string"||!GROUPS.includes(e.g))continue;
    const o={id:e.id,n:e.n.slice(0,60),g:e.g,inc:2.5};
    if(EXREG.includes(e.r))o.r=e.r;
    if(typeof e.k==="string"&&e.k.length===1&&"wbtc".includes(e.k)){o.k=e.k;o.c=e.k==="c"?"k":"g"}
    if(GNEWQ.includes(e.q))o.q=e.q;
    if(typeof e.tp==="string"&&GFIG[e.tp]&&FigTpl[e.tp]&&FigTpl[e.tp].frames)o.tp=e.tp;
    out.customEx.push(o);maxId=Math.max(maxId,+e.id.slice(1));
  }
  const known=new Set(EXDB.map(e=>e.id).concat(out.customEx.map(e=>e.id)));
  const cfg=r.exCfg&&typeof r.exCfg==="object"?r.exCfg:{};
  for(const id of Object.keys(cfg)){
    const c=cfg[id],o={};
    if(!known.has(id)||!c)continue;
    if(Number.isInteger(c.lo)&&c.lo>=1&&c.lo<=30&&Number.isInteger(c.hi)&&c.hi>c.lo&&c.hi<=50)Object.assign(o,{lo:c.lo,hi:c.hi});
    if(Number.isInteger(c.rest)&&c.rest>=0&&c.rest<=600)o.rest=c.rest;
    if(dayOk(c.flag))o.flag=c.flag;
    if(Object.keys(o).length)out.exCfg[id]=o;
  }
  for(const w of (Array.isArray(r.workouts)?r.workouts:[])){
    if(!w||!idOk(w.id)||!dayOk(w.day)||!Number.isFinite(w.t0)){DROPS.n++;continue}
    const ex=[];
    for(const x of (Array.isArray(w.ex)?w.ex:[])){
      if(!x||typeof x.id!=="string"||!/^[\w.-]{1,80}$/.test(x.id)){DROPS.n++;continue} // ids missing from the library are kept: the history shows them as "Silinmiş egzersiz"
      const sets=[];
      for(const s of (Array.isArray(x.sets)?x.sets:[])){
        if(!s){DROPS.n++;continue}
        const kg=s.kg==null?null:Number(s.kg),reps=s.reps==null?null:Number(s.reps),sec=s.sec==null?null:Number(s.sec);
        if((kg!=null&&!(kg>=0&&kg<=KG_MAX))||(reps!=null&&!(reps>=0&&reps<=REPS_MAX))||(sec!=null&&!(sec>=0&&sec<=SEC_MAX))){DROPS.n++;continue}
        const o=sec==null?{kg,reps,done:s.done===true}:{kg,reps,sec:Math.round(sec),done:s.done===true};
        if(s.w===true)o.w=true;else if(s.t==="d"||s.t==="f")o.t=s.t;
        if(typeof s.rpe==="number"&&s.rpe>=6&&s.rpe<=10&&s.rpe*2===Math.round(s.rpe*2))o.rpe=s.rpe;
        sets.push(o);
      }
      const o={id:x.id,note:typeof x.note==="string"?x.note.slice(0,300):"",sets};
      if(Number.isInteger(x.ss)&&x.ss>0&&x.ss<1000)o.ss=x.ss;
      ex.push(o);
    }
    gSsNorm(ex);
    const o={id:w.id,day:w.day,t0:w.t0,t1:Number.isFinite(w.t1)?w.t1:null,name:typeof w.name==="string"?w.name.slice(0,60):"Antrenman",tpl:idOk(w.tpl)?w.tpl:null,ex};
    if(o.t1==null&&w.rest&&Number.isFinite(w.rest.end))o.rest={end:w.rest.end,tx:typeof w.rest.tx==="string"?w.rest.tx.slice(0,120):""};
    out.workouts.push(o);
    maxId=Math.max(maxId,w.id);
  }
  // at most one active workout
  let seen=false;for(const w of out.workouts)if(w.t1==null){if(seen){w.t1=w.t0;delete w.rest}seen=true}
  for(const t of (Array.isArray(r.templates)?r.templates:[])){
    if(!t||!idOk(t.id)||typeof t.name!=="string"||!Array.isArray(t.ex))continue;
    const ex=t.ex.filter(i=>known.has(i)),tg={},g=t.tg&&typeof t.tg==="object"?t.tg:{},iv=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
    for(const i of ex){
      const a=g[i],o={};if(!a||typeof a!=="object")continue;
      if(iv(a.sets,1,10))o.sets=a.sets;
      if(iv(a.reps,1,REPS_MAX)){o.reps=a.reps;if(iv(a.hi,a.reps+1,REPS_MAX))o.hi=a.hi}
      if(iv(a.sec,1,SEC_MAX))o.sec=a.sec;
      if(iv(a.ss,1,999))o.ss=a.ss;
      if(Object.keys(o).length)tg[i]=o;
    }
    const sl=ex.map(i=>tg[i]||{});gSsNorm(sl);ex.forEach((i,k)=>{if(tg[i]&&!sl[k].ss)delete tg[i].ss;if(tg[i]&&!Object.keys(tg[i]).length)delete tg[i]});
    const o={id:t.id,name:t.name.slice(0,60),ex};if(Object.keys(tg).length)o.tg=tg;
    out.templates.push(o);maxId=Math.max(maxId,t.id);
  }
  out.gid=Math.max(maxId+1,idOk(r.gid)?r.gid:1);
  return out;
}

/* ---- history and suggestion ---- */
function gHistory(exId,beforeT=Infinity){
  return S.workouts.filter(w=>gDone(w)&&w.t0<beforeT).sort((a,b)=>b.t0-a.t0)
    .map(w=>({w,sets:(w.ex.find(x=>x.id===exId)||{sets:[]}).sets.filter(s=>s.done&&gSetOk(s))})).filter(h=>h.sets.length);
}
/* Increments and suggestions follow the inventory at hand: the dumbbell step (if set), twice the smallest plate for barbell lifts; otherwise the exercise's own step. */
const gPr=id=>(gEx(id).pr||"").split("@")[0];
function gInc(id){
  const inc=gEx(id).inc,p=gPr(id);
  return p==="db"&&S.dbStep?S.dbStep:p==="bar"?Math.max(inc,2*Math.min(...S.plates)):inc;
}
/* "This move bothered me": for 14 days the weight suggestion for the move does not go up. A mark is only a day; no text about what bothered. */
const GFLAG_DAYS=14;
const gFlagged=id=>{const c=S.exCfg[id];return !!(c&&c.flag&&Algo.dayNum(dayKey())-Algo.dayNum(c.flag)<GFLAG_DAYS)};
function gSuggest(exId){
  if(gKind(exId)!=="w")return null;
  const [h,...old]=gHistory(exId);if(!h)return null;
  const ws=gWork(h.sets),top=Math.max(...ws.map(x=>x.kg||0));
  const hard=!!S.settings.rpeOn&&ws.some(x=>(x.kg||0)===top&&x.rpe>=9.5); // a hard top set rated by the user
  const r=Algo.nextTarget(ws,Object.assign({lo:8,hi:12,inc:gInc(exId),prev:old.slice(0,2).map(x=>gWork(x.sets)),gapDays:Algo.dayNum(dayKey())-Algo.dayNum(h.w.day),hard},S.exCfg[exId])),p=gPr(exId);
  if(!r)return r;
  if(p==="bar"&&r.kg>=S.bar)r.kg=Algo.plates(r.kg,S.bar,S.plates).made;
  else if(p==="db"&&S.dbStep)r.kg=Algo.roundTo(r.kg,S.dbStep);
  if(gFlagged(exId)&&r.kg>top){r.kg=top;r.why="Bu egzersizi rahatsız etti diye işaretledin; ağırlığı artırmıyorum"}
  return r;
}
function gGearHtml(){
  return `<div class="mt-2 lbl">Dambıl adımı</div><div class="chips">${[0,1,2,2.5].map(v=>`<button class="chip" data-g="gdb:${v}" aria-pressed="${S.dbStep===v}">${v?fkg(v)+" kg":"Varsayılan"}</button>`).join("")}</div>
  <div class="lbl">Eldeki plakalar (kg)</div><div class="chips">${GPLATE_ALL.map(v=>`<button class="chip" data-g="gpl:${v}" aria-pressed="${S.plates.includes(v)}">${fkg(v)}</button>`).join("")}</div>
  <p class="hint">Ağırlık önerileri ve plaka hesabı eldeki dambıl adımına ve plakalara yuvarlanır. Bar ağırlığı plaka hesabı sayfasında ayarlanır.</p>`;
}
const GSEC={t:30,i:30,c:600},GSETS={t:3,i:4,c:1};
/* tg: template target {sets,reps,sec}. When present it sets the set count, reps and duration; kg still comes from the previous session or the suggestion. */
function gAddEx(w,exId,tg){
  const kind=gKind(exId),t=tg||{},h=gHistory(exId)[0],sets=[];
  if(gTimed(exId)){
    const sec=t.sec||h&&h.sets[0].sec||GSEC[kind],n=kind==="c"?1:t.sets||(h?Math.min(h.sets.length,6):GSETS[kind]);
    for(let i=0;i<n;i++)sets.push({kg:null,reps:null,sec,done:false});
  }else{
    const sug=gSuggest(exId),n=t.sets||(h?Math.min(Math.max(h.sets.length,1),6):3);
    for(let i=0;i<n;i++)sets.push({kg:sug?sug.kg:null,reps:t.reps||(sug?sug.reps:null),done:false});
  }
  w.ex.push({id:exId,note:"",sets});
  if(t.ss)w.ex[w.ex.length-1].ss=t.ss;
}
/* Personal best per weight exercise (best estimated 1RM set), newest first; ties go to the newer session because `done` is sorted newest first. */
function gRecords(done){
  const m=new Map();
  for(const w of done)for(const x of w.ex){
    if(gKind(x.id)!=="w")continue;
    for(const s of x.sets){
      if(!(s.done&&gRecOk(s)))continue;
      const e=Algo.est1RM(s.kg,s.reps),r=m.get(x.id);
      if(e>0&&(!r||e>r.e1))m.set(x.id,{ex:gEx(x.id),kg:s.kg,reps:s.reps,e1:e,day:w.day});
    }
  }
  return [...m.values()].sort((a,b)=>b.day.localeCompare(a.day)||b.e1-a.e1);
}
function gBest(w,exId){
  let b=0;const x=w.ex.find(e=>e.id===exId);
  if(x&&gKind(exId)==="w")for(const s of x.sets)if(s.done&&gRecOk(s))b=Math.max(b,Algo.est1RM(s.kg,s.reps));
  return b;
}
function gIsPR(w,exId){
  const cur=gBest(w,exId);if(!cur)return null;
  const prev=S.workouts.reduce((m,h)=>gDone(h)&&h.t0<w.t0?Math.max(m,gBest(h,exId)):m,0);
  if(!(prev>0&&cur>prev+0.05))return null;
  let top=null;for(const s of w.ex.find(e=>e.id===exId).sets)if(s.done&&gRecOk(s)&&(!top||Algo.est1RM(s.kg,s.reps)>Algo.est1RM(top.kg,top.reps)))top=s;
  return {ex:gEx(exId),kg:top.kg,reps:top.reps,e1:cur,prev};
}
const gPRs=w=>w.ex.map(x=>gIsPR(w,x.id)).filter(Boolean);
const gSeenPR=new Set();
/* Record at set time: that set must have produced the record, once per exercise per workout. */
function gNewPR(w,exId,s){
  const p=gIsPR(w,exId),k=w.id+":"+exId;
  if(!p||gSeenPR.has(k)||Algo.est1RM(s.kg,s.reps)<p.e1)return null;
  gSeenPR.add(k);return p;
}
const gWorkVol=w=>w.ex.reduce((s,x)=>s+Algo.volume(x.sets.filter(t=>t.done)),0);
const gWorkSets=w=>w.ex.reduce((s,x)=>s+gDoneSets(x).length,0);
function gWeekRegions(){
  const from=Date.now()-WEEK_MS,m={};
  for(const w of S.workouts)if(gDone(w)&&w.t0>=from)for(const x of w.ex){
    const e=gEx(x.id),g=e.r||e.g,n=gDoneSets(x).length;if(n)m[g]=(m[g]||0)+n; // a region with only warm-up sets must not open a 0 row
  }
  return m;
}
const GBIG=["Göğüs","Sırt","Omuz","Ön bacak","Arka bacak"];
/* Rule-based weekly note (no AI): region -> set count. 10-20 sets/week is a general guide range, not a target or a medical claim. */
function gWeekNote(regs,hasHistory){
  const n=r=>regs[r]||0,low=EXREG.filter(r=>n(r)>0&&n(r)<MuscleMap.LO).sort((a,b)=>n(a)-n(b)).slice(0,3),miss=GBIG.filter(r=>!n(r));
  if(!EXREG.some(n))return hasHistory?["Son 7 günde antrenman kaydı yok. İstediğinde bir şablonla küçük bir seansla başlayabilirsin."]:[];
  const out=[];
  if(low.length)out.push(`${low.map(r=>`${r} ${n(r)}`).join(", ")} set, önerilen haftalık 10-20 aralığının altında.`);
  if(miss.length)out.push(`Bu hafta henüz set girmediğin büyük kas grupları: ${miss.join(", ")}.`);
  return out.length?out:["Kaydettiğin bölgelerin hepsi haftalık 10 set ve üstünde."];
}
const gTimedSec=w=>w.ex.reduce((s,x)=>s+(gTimed(x.id)?gDoneSets(x).reduce((a,t)=>a+(t.sec||0),0):0),0);
const gSecTx=s=>s>=120?Math.round(s/60)+" dk":s+" sn";
const gVolTx=w=>{const v=gWorkVol(w),t=gTimedSec(w);return [v>0&&`${fint(Units.w(v))} ${Units.wu()}`,t>0&&gSecTx(t)].filter(Boolean).join(", ")};
const gStats=w=>[`${gWorkSets(w)} set`,`${gDur(w)} dk`,gVolTx(w),gSsGroups(w).length&&`${gSsGroups(w).length} süperset`,gDrops(w)&&`${gDrops(w)} drop set`].filter(Boolean).join(" · ");
const gNames=(w,n)=>{const a=w.ex.map(x=>gEx(x.id).n);return a.slice(0,n).join(", ")+(a.length>n?` +${a.length-n}`:"")};
const gDur=w=>Math.min(WORKOUT_MIN_MAX,Math.max(1,Math.round(((w.t1||Date.now())-w.t0)/60000)));
/* A workout older than the longest possible one has no running clock: it was added for a past day or left open. */
const gAged=w=>Date.now()-w.t0>WORKOUT_MIN_MAX*6e4;
const gStat=w=>`${gAged(w)?fd(w.day)+" günü":gClock(Date.now()-w.t0)+" süre"}, ${fint(Units.w(gWorkVol(w)))} ${Units.wu()} hacim`;
const gClock=ms=>{const s=Math.max(0,Math.floor(ms/1000));return `${pad(Math.floor(s/60))}:${pad(s%60)}`};

/* ---- screens ---- */
function viewGym(){
  const w=gActive();
  return w?gLive(w):gHome();
}
function gHome(){
  const done=S.workouts.filter(gDone).sort((a,b)=>b.t0-a.t0),from=Date.now()-WEEK_MS,wk7=done.filter(w=>w.t0>=from),last=done[0];
  const vol=wk7.reduce((s,w)=>s+gWorkVol(w),0),sets=wk7.reduce((s,w)=>s+gWorkSets(w),0);
  // Summary: weekly count and the last workout; one primary action.
  const sum=`<div class="card"><div class="stats"><div class="stat"><div class="k">Bu hafta</div><div class="v num">${wk7.length} <small>antrenman</small></div></div><div class="stat"><div class="k">Hacim</div><div class="v num">${fint(Units.w(vol))} <small>${Units.wu()}</small></div></div><div class="stat"><div class="k">Set</div><div class="v num">${sets}</div></div></div>
  <p class="mut sm">${last?`Son antrenman: ${esc(last.name)}, ${fd(last.day)}`:"Henüz antrenman yok. İlk antrenmanını başlat ya da bir şablon seç."}</p><button class="mt-2 btn" data-g="start:">${Icons.svg("play")} Antrenmanı başlat</button><button class="lnk" data-g="startday">Geçmiş bir güne kaydet</button></div>`;
  const tpl=S.templates.map(t=>{
    const lt=done.find(w=>w.tpl===t.id);
    return `<div class="card trow"><button class="tmain" data-g="startgo:${t.id}"><b>${esc(t.name)}</b><span class="mut tex">${esc(t.ex.map(i=>gEx(i).n).join(", ")||"Egzersiz yok")}</span><span class="mut">${lt?"Son: "+fd(lt.day):"Yeni"}</span></button><span class="tact"><button class="del" data-g="start:${t.id}" aria-label="${esc(t.name)} şablonunu önizle">${Icons.svg("info")}</button><button class="del" data-g="tedit:${t.id}" aria-label="${esc(t.name)} şablonunu düzenle">${Icons.svg("note")}</button><button class="del" data-g="tdel:${t.id}" aria-label="${esc(t.name)} şablonunu sil">${Icons.svg("trash")}</button></span></div>`;
  }).join("");
  const recs=gRecords(done),rl=recs.slice(0,gRecMax);
  const rec=done.length?`<h2>Rekorlar</h2><div class="card">${rl.map(p=>`<div class="row"><span class="grow"><b>${esc(p.ex.n)}</b><span class="mut sm num">${gW(p.kg)||0} ${Units.wu()} × ${p.reps} · tahmini 1TM ${fint(Units.w(p.e1))} ${Units.wu()}</span></span><span class="tag">${fd(p.day)}</span></div>`).join("")||`<p class="m0 hint">Ağırlıklı bir egzersizi tamamlayınca en iyi setin burada görünür.</p>`}${recs.length>rl.length?`<button class="lnk" data-g="recmore">Tüm rekorlar (${recs.length-rl.length} daha)</button>`:""}</div>`:"";
  const wk=gWeekRegions(),rk=Object.keys(wk).sort((a,b)=>wk[b]-wk[a]),mx=Math.max(14,...Object.values(wk));
  const note=gWeekNote(wk,done.length>0).map(l=>`<p class="hint">${l}</p>`).join("");
  const bars=`<h2>Bu hafta, bölgeye göre set</h2><div class="card">${rk.map(g=>`<div class="gbar"><span>${g}</span><span class="bar"><i style="width:${(wk[g]/mx*100).toFixed(0)}%"></i></span><span class="num">${wk[g]}</span></div>`).join("")||`<p class="m0 hint">Bu hafta set yok.</p>`}${note?`<div id="wknote">${note}</div>`:""}
  <details class="acc" id="mmacc"><summary>Kas haritası</summary>${MuscleMap.html(wk)}<p class="hint">Bölge başına haftada 10 ile 20 set çoğu kişi için makul bir aralıktır.</p></details></div>`;
  return `${sum}
  <h2>Şablonlarım</h2>${tpl?`<div class="hscroll">${tpl}</div>`:emptyCard("gym","","Sık yaptığın antrenmanı şablon olarak kaydet, tek dokunuşla başlat.")}<button class="btn ghost" data-g="tedit:">${Icons.svg("plus")} Yeni şablon</button>
  <div class="mt-3 card">${navRow('data-g="gdpick"',"clock","Rehberli antrenman","Esneme, ısınma ve Tabata; sesli komutla")}${navRow('data-g="lib"',"book","Egzersiz kütüphanesi","Egzersizleri ara, incele, antrenmana ekle")}${navRow('data-c="prog"',"coach","Rehber'den program iste","Hedefine ve ekipmanına göre")}</div>
  ${rec}
  <details class="acc more"><summary>Haftalık dağılım</summary>${bars}</details>
  ${gPgHtml()}
  <details class="acc more"><summary>Antrenman geçmişi</summary><div class="card">${gHistHtml(done)||`<p class="m0 hint">Bitirdiğin antrenmanlar burada listelenir.</p>`}</div>${gQuickHtml()}</details>`;
}
/* Sports without a workout record (quick log, a bike ride or walk added by the Coach, ...): the last 20 entries, newest first. */
function gQuickHtml(){
  const l=Log.where(e=>e.type==="exercise"&&!e.wid).sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id).slice(0,20);
  if(!l.length)return "";
  return `<h2>Diğer sporlar</h2><div class="card">${l.map(e=>`<div class="row"><span class="num mut">${fd(e.day)}</span><span class="grow tx"><b>${esc(e.text||"Spor")}</b></span><span class="num">${e.v} dk${e.kcal!=null?` · ${e.kcal} kcal`:""}</span></div>`).join("")}</div>`;
}
/* Today screen card: the active workout and today's finished ones. */
function gTodayCard(){
  const a=gActive(),d=S.workouts.filter(w=>gDone(w)&&w.day===dayKey()).sort((x,y)=>y.t0-x.t0);
  if(!a&&!d.length)return "";
  const row=(w,k,l)=>`<button class="rrow" data-g="${k}"><span class="grow tx"><b>${esc(w.name)}</b><span class="mut sm">${esc(gNames(w,4))||"Egzersiz yok"}</span><span class="mut sm num">${l}</span></span>${k==="start:"?`<span class="tag">Devam et</span>`:""}</button>`;
  const ws=a?a.ex.reduce((s,x)=>s+x.sets.filter(t=>!t.w).length,0):0;
  const old=a&&a.day!==dayKey(); // left over from an earlier day: never finished, duration unknown
  const stale=old?`<div class="btns"><button class="btn ghost" data-g="stalefin">Bitir ve kaydet</button><button class="btn ghost" data-g="cancel">Antrenmanı sil</button></div>`:"";
  return `<div class="card">${a?row(a,"start:",old?`${fd(a.day)} başladı, bitirilmedi, ${a.ex.length} egzersiz`:`Devam ediyor, ${a.ex.length} egzersiz, ${gWorkSets(a)}/${ws} set işaretli`)+stale:""}${d.map(w=>row(w,"sum:"+w.id,gStats(w))).join("")}</div>`;
}
function gHistHtml(done){
  const rows=done.slice(0,gHistMax);let ym="";
  return rows.map(x=>{
    const h=x.day.slice(0,7)===ym?"":`<div class="lbl">${MONTHS[+x.day.slice(5,7)-1]} ${x.day.slice(0,4)}</div>`;ym=x.day.slice(0,7);
    return `${h}<button class="rrow" data-g="sum:${x.id}"><span class="num mut">${fd(x.day)}</span><span class="grow tx"><b>${esc(x.name)}</b><span class="mut sm">${esc(gNames(x,3))}</span><span class="mut sm num">${gStats(x)}</span></span></button>`;
  }).join("")+(done.length>rows.length?`<button class="lnk" data-g="histmore">Daha fazla göster (${done.length-rows.length})</button>`:"");
}
/* Next set: the first unchecked set of the workout. Its row is highlighted and the ± panel opens below it. */
function gNext(w){
  for(let ei=0;ei<w.ex.length;ei++){const si=w.ex[ei].sets.findIndex(s=>!s.done);if(si>=0)return {ei,si}}
  return null;
}
/* The same-position working set of the previous session; a warm-up set has no counterpart. */
const gPrevSet=(w,x,si,prev=gHistory(x.id,w.t0)[0])=>!x.sets[si].w&&prev&&(prev.sets[x.sets.slice(0,si).filter(t=>!t.w).length]||prev.sets[prev.sets.length-1]);
/* Template preview: the sets that starting will create (gAddEx), one target per exercise. */
function gTplPreview(id){
  const t=S.templates.find(x=>x.id===id);if(!t)return;
  const tmp={ex:[]};for(const i of t.ex)gAddEx(tmp,i,t.tg&&t.tg[i]);
  const row=x=>{
    const s=x.sets[0],hi=t.tg&&t.tg[x.id]&&t.tg[x.id].hi,k=gKind(x.id);
    const tg=s.sec!=null?(k==="c"?`${Math.round(s.sec/60)} dk`:`${s.sec} sn`):s.reps?`${s.kg?gW(s.kg)+" "+Units.wu()+" × ":""}${s.reps}${hi>s.reps?"–"+hi:""} tekrar`:"hedef yok, antrenmanda girersin";
    return `<div class="prow"><span><b>${esc(gEx(x.id).n)}</b><span class="mut sm">${x.sets.length} set · ${tg}</span></span></div>`;
  };
  openSheet(`<h3>${esc(t.name)}</h3><div class="plist">${tmp.ex.map(row).join("")||`<p class="hint">Bu şablonda egzersiz yok. Başlatınca egzersizi sen eklersin.</p>`}</div><button class="btn" data-g="startgo:${id}">Başlat</button>${t.ex.length?`<button class="mt-2 btn ghost" data-g="gdgo:t:${id}">Rehberli başlat</button>`:""}<button class="mt-2 btn ghost" data-g="closesheet">Kapat</button>`);
}
/* ✓ with an empty kg or reps: offer the previous session's value, otherwise warn clearly; never write a silent 0. */
function gEmptySet(w,ei,si,kgIn,repsIn,kind){
  const x=w.ex[ei],ps=gPrevSet(w,x,si);
  const need=[!repsIn&&"tekrar",!kgIn&&kind==="w"&&"kg"].filter(Boolean);
  if(!need.length)return false;
  if(!ps||(need.includes("tekrar")&&!ps.reps)||(need.includes("kg")&&ps.kg==null)){toast(need.includes("tekrar")?"Önce tekrar sayısını yaz":"Ağırlığı yaz, ağırlıksızsa 0 yaz");return true}
  openSheet(`<h3>Set boş</h3><p>${need.join(" ve ")} girilmedi. Önceki seansta bu set: <b class="num">${ps.kg?gW(ps.kg)+" "+Units.wu()+" × ":""}${ps.reps} tekrar</b>.</p><button class="btn" data-g="fillok:${ei}:${si}">Bu değerle tamamla</button><button class="mt-2 btn ghost" data-g="closesheet">Kendim yazayım</button>`);
  return true;
}
/* Panel: ± for kg and reps (step = the exercise's inc) and one-tap fill from the same set of the previous session. */
function gStepPanel(w,ei,si,prev){
  const x=w.ex[ei],s=x.sets[si],st=(f,l,v)=>`<div class="stp"><button data-g="${f}m:${ei}:${si}" aria-label="${l} azalt">−</button><span class="num" aria-label="${l}">${v}</span><button data-g="${f}p:${ei}:${si}" aria-label="${l} artır">+</button></div>`;
  const ps=gPrevSet(w,x,si,prev);
  const same=ps&&(ps.kg||0)!==(s.kg||0)||ps&&ps.reps!==s.reps;
  return `<div class="sx">${st("kg","Ağırlık",s.kg==null?"–":gW(s.kg))}${st("rp","Tekrar",s.reps==null?"–":s.reps)}
  ${same?`<button class="lnk sxs" data-g="same:${ei}:${si}">Önceki seansla aynı: ${ps.kg?gW(ps.kg)+" × ":""}${ps.reps}</button>`:""}</div>`;
}
function gLive(w){
  gRestLoad();
  const nx=gNext(w);
  const cards=w.ex.map((x,ei)=>{
    const ex=gEx(x.id),prev=gHistory(x.id,w.t0)[0],sug=gSuggest(x.id);
    const kind=gKind(x.id),tm=gTimed(x.id),unit=kind==="c"?60:1,rpe=S.settings.rpeOn&&!tm;
    let wi=0;
    const g=gGrp(w,ei),rows=x.sets.map((s,si)=>{
      const ps=!s.w&&prev&&prev.sets[wi++],p=s.w?"ısınma":!ps?"–":tm?`${kind==="c"?Math.round(ps.sec/60)+" dk":ps.sec+" sn"}`:`${ps.kg?gW(ps.kg)+" × ":""}${ps.reps}`;
      const tick=`<button class="ok${s.done?" on":""}" data-g="done:${ei}:${si}" aria-label="${si+1}. set ${s.done?"geri al":"tamamlandı"}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>`;
      const on=nx&&nx.ei===ei&&nx.si===si;
      if(tm)return `<div class="srow${s.done?" dn":""}${on?" nx":""}"><button class="sn tb" data-g="stype:${ei}:${si}" aria-label="${si+1}. set seçenekleri">${si+1}</button><span class="sp num">${p}</span>
      <input class="sin num" inputmode="numeric" aria-label="${si+1}. set ${kind==="c"?"dakika":"saniye"}" data-gi="sec:${ei}:${si}" value="${gShow("sec",s,x.id)}" placeholder="${kind==="c"?"dk":"sn"}">
      <button class="sin tgo" data-g="tstart:${ei}:${si}" aria-label="${si+1}. set zamanlayıcıyı başlat">${Icons.svg(gTim&&gTim.ei===ei&&gTim.si===si?"pause":"play")}</button>${tick}</div>`;
      return `<div class="srow${rpe?" r":""}${s.done?" dn":""}${on?" nx":""}"><button class="sn tb" data-g="stype:${ei}:${si}" aria-label="${si+1}. set türü: ${gSetTx(s)}">${si+1}${s.t?`<b class="tbd">${s.t.toUpperCase()}</b>`:""}</button><span class="sp num">${rpe&&!s.w?"Önceki: "+p:p}</span>
      <input class="sin num" inputmode="decimal" aria-label="${si+1}. set ağırlık (${Units.wu()})" data-gi="kg:${ei}:${si}" value="${gShow("kg",s,x.id)}" placeholder="${kind==="b"?"ek "+Units.wu():Units.wu()}">
      <input class="sin num" inputmode="numeric" aria-label="${si+1}. set tekrar" data-gi="reps:${ei}:${si}" value="${gShow("reps",s,x.id)}" placeholder="tekrar">${rpe?`<input class="sin num" inputmode="decimal" aria-label="${si+1}. set zorluk (RPE)" data-gi="rpe:${ei}:${si}" value="${gShow("rpe",s,x.id)}" placeholder="RPE">`:""}${tick}</div>${on?gStepPanel(w,ei,si,prev):""}`;
    }).join("");
    return `<div class="card ex${g?" ssg":""}"><div class="exh"><button class="exn" data-g="hist:${x.id}"><b>${esc(ex.n)}</b><span class="mut">${ex.r||ex.g}${g?` · Süperset ${g.i}/${g.n}`:""}</span></button><button class="del" data-g="exinfo:${x.id}" aria-label="Egzersiz bilgisi">ⓘ</button><button class="del" data-g="menu:${ei}" aria-label="Egzersiz menüsü">⋮</button></div>
    ${sug?`<div class="sug">Öneri: ${gW(sug.kg)||0} ${Units.wu()} × ${sug.reps}. ${sug.why}.${sug.note?` <span class="mut">${sug.note}</span>`:""}</div>`:""}${x.note?`<div class="note">${esc(x.note)}</div>`:""}
    <div class="shead${rpe?" r":""}"><span>Set</span><span>Önceki</span>${tm?`<span>${kind==="c"?"Dakika":"Süre (sn)"}</span><span>Süre</span>`:`<span>${kind==="b"?"Ek "+Units.wu():Units.wu()}</span><span>Tekrar</span>${rpe?"<span>RPE</span>":""}`}<span></span></div>${rows}
    <button class="lnk" data-g="addset:${ei}">Set ekle</button></div>`;
  }).join("");
  return `<div class="livetop"><div class="livebar"><button class="chip" data-g="cancel" aria-label="Antrenmanı sil, kaydetmeden vazgeç">${Icons.svg("trash")} Antrenmanı sil</button><div><b>${esc(w.name)}</b><div class="mut num" id="gstat">${gStat(w)}</div></div><button class="btn fin" data-g="finish">Bitir</button></div>
  ${gTimBar()}</div>
  <div class="rest" id="grest" role="timer" aria-label="Dinlenme"${restEnd>Date.now()?"":" hidden"}><div><span class="mut sm">Dinlenme</span><b class="num" id="gr">${restEnd>Date.now()?gClock(restEnd-Date.now()):""}</b></div><button data-g="rest:-15" aria-label="15 saniye azalt">−15</button><button data-g="rest:15" aria-label="15 saniye ekle">+15</button><button class="rsk" data-g="rest:0">Atla</button></div>
  ${Habits.fastNote()}
  ${cards||`<p class="hint">Aşağıdan egzersiz ekleyerek başla.</p>`}
  <button class="btn ghost" data-g="pick">Egzersiz ekle</button>
  <p class="hint">${gPainNote}</p>`;
}
/* Native window flag (DeviceHelp.keepAwake): the Android WebView support of navigator.wakeLock is only inferred from Chrome documentation. */
let gAwakeOn=false;
function gAwake(force){
  const on=!!(S.settings.awakeOn&&(gActive()&&tab==="gym"||gdOn())&&!document.hidden),d=DH();
  if((on===gAwakeOn&&!force)||!d||!d.keepAwake)return;
  gAwakeOn=on;d.keepAwake({on}).catch(()=>{});
}
document.addEventListener("visibilitychange",()=>gAwake(true));
function gTick(){
  gAwake();
  const w=gActive();if(!w||tab!=="gym")return;
  const st=$("#gstat");if(st)st.textContent=gStat(w);
  const r=$("#grest");if(!r)return;
  const left=restEnd-Date.now();
  if(left>0){r.hidden=false;$("#gr").textContent=gClock(left)}
  else{
    if(restEnd&&!r.hidden)gVib([200,100,200]);
    // 9002 is not cancelled here: a cancel also removes an already delivered notification, and a late background tick would remove it before the user sees it.
    r.hidden=true;restEnd=0;
  }
}

/* ---- sheets ---- */
function gPickHtml(){
  const q=tr(gQuery),w=gActive();
  const all=gExAll().filter(e=>(gGroup==="Tümü"||(e.r||e.g)===gGroup)&&(!q||tr(e.n).includes(q))),list=all.slice(0,gPickMax);
  const inW=new Set(gTeOn?gTe.ex:w?w.ex.map(x=>x.id):[]);
  return list.map(e=>{
    const h=gHistory(e.id)[0],last=h?(gTimed(e.id)?`son ${h.sets[0].sec} sn`:`son ${gW(Math.max(...h.sets.map(s=>s.kg||0)))||0} ${Units.wu()} × ${h.sets[0].reps}`):"henüz yok";
    return `<button class="prow" data-g="addex:${e.id}"><span><b>${esc(e.n)}</b><span class="mut sm">${e.r||e.g}${e.q?", "+e.q.toLowerCase():""}, ${last}</span></span>${inW.has(e.id)?`<span class="tag">Eklendi</span>`:`<span class="plus">+</span>`}</button>`;
  }).join("")+(all.length>list.length?`<button class="lnk" data-g="pickmore">Daha fazla göster</button>`:"")||`<p class="hint">Eşleşen egzersiz yok. Başka bir ad dene.</p>`;
}
function gSheetPick(te){
  gTeOn=!!te;gQuery="";gGroup="Tümü";gNew=false;gPickMax=40;
  openSheet(`<h3>Egzersiz ekle</h3><input class="in" id="gq" type="search" enterkeyhint="search" aria-label="Egzersiz ara" placeholder="Egzersiz ara" autocomplete="off">
  <div class="chips" id="gchips">${["Tümü"].concat(EXREG).map(g=>`<button class="chip" data-g="grp:${g}" aria-pressed="${g==="Tümü"}">${g}</button>`).join("")}</div>
  <div id="glist" class="plist">${gPickHtml()}</div>
  <button class="lnk" data-g="newex">Yeni egzersiz oluştur</button><div id="gnew"></div>
  <button class="btn" data-g="${te?"teback":"closesheet"}">Tamam</button>`);
}
function gNewRead(){const n=$("#gnn"),t=$("#gntp");if(n)gNewS.n=n.value;if(t)gNewS.tp=t.value}
function gNewHtml(){
  const ch=(f,vals,lbl)=>`<div class="chips">${vals.map(v=>`<button class="chip" data-g="nf:${f}:${v}" aria-pressed="${gNewS[f]===v}">${lbl(v)}</button>`).join("")}</div>`;
  return `<div class="mt-2 card"><input class="in" id="gnn" placeholder="Egzersiz adı" maxlength="60" value="${esc(gNewS.n)}">
  <div class="lbl">Tür</div>${ch("k",Object.keys(GNEWK),v=>GNEWK[v])}<div class="lbl">Bölge</div>${ch("r",EXREG,v=>v)}<div class="lbl">Ekipman</div>${ch("q",GNEWQ,v=>v)}
  <div class="lbl">Egzersiz şekli (figür)</div><select class="in" id="gntp" aria-label="Egzersiz şekli"><option value="">Figür yok</option>${Object.keys(GFIG).map(k=>`<option value="${k}"${k===gNewS.tp?" selected":""}>${GFIG[k]}</option>`).join("")}</select>
  <button class="btn" data-g="mkex">Oluştur ve ekle</button></div>`;
}
function gMenu(ei){
  const w=gActive(),x=w.ex[ei];
  openSheet(`<h3>${esc(gEx(x.id).n)}</h3><div class="plist">
   <button class="prow" data-g="note:${ei}"><span><b>Egzersiz notu</b><span class="mut sm">Örn. bar yüksekliği, ağrı</span></span></button>
   ${gKind(x.id)==="w"?`<button class="prow" data-g="plate:${ei}"><span><b>Plaka ve ısınma</b><span class="mut sm">Bar başına plaka, ısınma setleri</span></span></button>`:""}
   ${gKind(x.id)==="w"?`<button class="prow" data-g="rng:${ei}"><span><b>Tekrar aralığı</b><span class="mut sm">${(c=>c.lo+"-"+c.hi)(Object.assign({lo:8,hi:12},S.exCfg[x.id]))}, öneri bu aralığa göre</span></span></button>`:""}
   <button class="prow" data-g="flag:${ei}"><span><b>${gFlagged(x.id)?"Rahatsızlık işaretini kaldır":"Bu egzersiz rahatsız etti"}</b><span class="mut sm">${gFlagged(x.id)?"İşaret 14 gün sonra kendiliğinden kalkar":"14 gün ağırlık artırma önerisi kapanır"}</span></span></button>
   ${gFlagged(x.id)?`<button class="prow" data-g="alt:${ei}"><span><b>Benzer egzersizler</b><span class="mut sm">Aynı bölge ve ekipman</span></span></button>`:""}
   <button class="prow" data-g="rst:${ei}"><span><b>Dinlenme süresi</b><span class="mut sm">${gRestTx(gRestSec(x.id))}, set ✓ sonrası sayaç ve bildirim</span></span></button>
   ${ei>0?(x.ss&&w.ex[ei-1].ss===x.ss?`<button class="prow" data-g="ssu:${ei}"><span><b>Süpersetten çıkar</b></span></button>`:`<button class="prow" data-g="ssl:${ei}"><span><b>Önceki egzersizle süperset yap</b><span class="mut sm">${esc(gEx(w.ex[ei-1].id).n)} ile arka arkaya, dinlenme grubun sonunda</span></span></button>`):""}
   <button class="prow" data-g="mv:${ei}:-1"><span><b>Yukarı taşı</b></span></button>
   <button class="prow" data-g="mv:${ei}:1"><span><b>Aşağı taşı</b></span></button>
   <button class="prow dng" data-g="rmex:${ei}"><span><b>Egzersizi sil</b><span class="mut sm">${x.sets.length} set silinir</span></span></button></div>
   <button class="btn ghost" data-g="closesheet">Kapat</button>`);
}
function gSheetNote(ei){
  const x=gActive().ex[ei];
  openSheet(`<h3>Egzersiz notu</h3><textarea class="in" id="gnote" maxlength="300" autofocus>${esc(x.note)}</textarea><button class="btn" data-g="savenote:${ei}">Kaydet</button><button class="mt-2 btn ghost" data-g="closesheet">Vazgeç</button>`);
}
function gSheetHist(exId){
  const ex=gEx(exId),h=gHistory(exId);
  if(gKind(exId)!=="w")return gSheetHistSimple(exId,h);
  if(!h.length)return openSheet(`<h3>${esc(ex.n)}</h3><p class="hint">Bu egzersizle tamamladığın setler burada görünür.</p><button class="btn" data-g="closesheet">Kapat</button>`);
  const per=h.map(x=>({d:x.w.day,e:gBest(x.w,exId),vol:Algo.volume(x.sets),top:gWork(x.sets).reduce((a,s)=>Algo.est1RM(s.kg,s.reps)>Algo.est1RM(a.kg,a.reps)?s:a,gWork(x.sets)[0])}));
  const best=per.reduce((a,b)=>b.e>a.e?b:a,per[0]);
  openSheet(`<h3>${esc(ex.n)}</h3><div class="two"><div class="stat"><div class="k">En iyi set</div><div class="v num">${gW(best.top.kg)||0} ${Units.wu()} × ${best.top.reps}</div></div><div class="stat"><div class="k">Tahmini 1TM</div><div class="v num">${fint(Units.w(best.e))} ${Units.wu()}</div></div></div>
  ${exCharts(exId)}
  <table><thead><tr><th>Tarih</th><th>Setler</th><th>Hacim</th></tr></thead><tbody>${h.slice(0,6).map((x,i)=>`<tr><td>${fd(x.w.day)}</td><td class="num">${x.sets.map(t=>gSetLine(exId,t)+gRpeTx(t)).join(", ")}</td><td class="num">${fint(Units.w(per[i].vol))} ${Units.wu()}</td></tr>`).join("")}</tbody></table>
  <button class="btn" data-g="closesheet">Kapat</button>`);
}
function gSheetSummary(id){
  const w=S.workouts.find(x=>x.id===id);if(!w)return;
  const prs=gPRs(w),sets={};
  for(const x of w.ex){const g=gEx(x.id).g;sets[g]=(sets[g]||0)+gDoneSets(x).length}
  openSheet(`<h3>${esc(w.name)}</h3><div class="mut sm">${fd(w.day)}, ${gDur(w)} dk</div>
  ${gWorkVol(w)>0?`<div class="sumv num">${fint(Units.w(gWorkVol(w)))} <small>${Units.wu()} hacim</small></div>`:gTimedSec(w)>0?`<div class="sumv num">${gSecTx(gTimedSec(w))} <small>toplam süre</small></div>`:""}
  <div class="two"><div class="stat"><div class="k">Set</div><div class="v num">${gWorkSets(w)}</div></div><div class="stat"><div class="k">Egzersiz</div><div class="v num">${w.ex.length}</div></div></div>
  ${prs.length?`<div class="pr"><b>${prs.length} yeni rekor</b>${prs.map(p=>`<div>${esc(p.ex.n)}, ${gW(p.kg)||0} ${Units.wu()} × ${p.reps}<div class="mut sm">Tahmini 1TM ${fint(Units.w(p.e1))} ${Units.wu()}, önceki ${fint(Units.w(p.prev))} ${Units.wu()}</div></div>`).join("")}</div>`:""}
  ${(k=>k?`<div class="mt-2 mut sm">Tahmini ~${k} kcal (dinlenme hariç, tahmindir)</div>`:"")((Log.find(e=>e.wid===w.id)||{}).kcal)}
  <div class="my-2 mut sm">${Object.keys(sets).map(g=>`${g} ${sets[g]}`).join(", ")}</div>
  <div class="lbl">Egzersizler</div>${w.ex.map(x=>`<div class="row"><span class="grow"><b>${esc(gEx(x.id).n)}</b><span class="mut sm num">${gSetsLine(x)||"–"}</span></span></div>`).join("")}
  ${gSsGroups(w).map(g=>`<div class="mut sm">Süperset: ${esc(g.map(x=>gEx(x.id).n).join(" + "))}</div>`).join("")}${gDrops(w)?`<div class="mut sm">${gDrops(w)} drop set (hacme girer, rekor hesabına girmez)</div>`:""}
  <div class="btns">${w.tpl==null?`<button class="btn ghost" data-g="savetpl:${w.id}">Şablon olarak kaydet</button>`:S.templates.some(t=>t.id===w.tpl)?`<button class="btn ghost" data-g="tplupd:${w.id}">Şablonu bu seansa göre güncelle</button>`:""}<button class="btn ghost" data-g="wedit:${w.id}">Setleri düzenle</button><button class="btn ghost" data-g="closesheet">Kapat</button><button class="btn danger" data-g="delw:${w.id}">Antrenmanı sil</button></div>`);
}
/* Edit sheet of a finished workout: kg, reps and duration of every set; set count, exercises and the day stay. */
function gEditSheet(id){
  const w=S.workouts.find(x=>x.id===id&&gDone(x));if(!w)return;
  const wu=Units.wu();
  const rows=w.ex.map((x,ei)=>{
    const k=gKind(x.id),tm=gTimed(x.id),inp=(f,si,lbl,ph)=>`<input class="in num" inputmode="${f==="kg"||f==="rpe"?"decimal":"numeric"}" data-ge="${f}:${ei}:${si}" aria-label="${esc(gEx(x.id).n)} ${si+1}. set ${lbl}" placeholder="${ph}" value="${gShow(f,x.sets[si],x.id)}">`;
    return `<div class="lbl">${esc(gEx(x.id).n)}</div>${x.sets.map((s,si)=>`<div class="two">${tm?inp("sec",si,k==="c"?"dakika":"saniye",k==="c"?"dk":"sn"):inp("kg",si,"ağırlık ("+wu+")",wu)+inp("reps",si,"tekrar","tekrar")}</div>`).join("")}`;
  }).join("");
  openSheet(`<h3>${esc(w.name)}: setleri düzenle</h3><div class="mut sm">${fd(w.day)}</div>${rows}<div class="ferr" id="gwerr" role="alert"></div>
  <button class="btn" data-g="wsave:${w.id}">Kaydet</button><button class="mt-2 btn ghost" data-g="closesheet">Vazgeç</button>`);
}
function gEditSave(id){
  const w=S.workouts.find(x=>x.id===id&&gDone(x));if(!w)return;
  const next=structuredClone(w.ex);
  for(const el of document.querySelectorAll("#sheet [data-ge]")){
    const [f,ei,si]=el.dataset.ge.split(":"),x=next[+ei],s=x.sets[+si];
    if(el.value.trim()===gShow(f,s,x.id))continue;
    const r=gField(f,el.value,s,x.id);
    if(r.err||(r.v==null&&f!=="kg"))return ferr("gwerr",`${gEx(x.id).n}, ${+si+1}. set: ${r.err||(f==="sec"?"süreyi yaz":"tekrar sayısını yaz")}`);
    s[f]=r.v==null?0:r.v;
  }
  const old=w.ex;w.ex=next;
  if(!commit(()=>{w.ex=old}))return;
  closeSheet();render();gSheetSummary(id);
  toast("Antrenman güncellendi",()=>{w.ex=old;if(commit(()=>{w.ex=next}))render()});
}

/* ---- ready-made programs (programs.js) ---- */
const gPgMatch=p=>(!gPgF.d||(gPgF.d>=p.d[0]&&gPgF.d<=p.d[1]))&&(!gPgF.lv||p.lv===gPgF.lv);
const gPgMeta=p=>`${p.d[0]===p.d[1]?p.d[0]:p.d[0]+"-"+p.d[1]} gün · ${p.q==="Ağırlıksız"?"ekipmansız":"gym"} · ${p.lv.toLowerCase()}`;
const gPainNote="Ağrı olursa hareketi bırak; sürerse hekime ya da fizyoterapiste danış.";
const gPgNote="Genel bilgidir, kişisel antrenman ya da tıbbi tavsiye değildir. Ağrın, sakatlığın, gebeliğin, yakın zamanda ameliyatın ya da sağlık sorunun varsa başlamadan hekime ya da fizyoterapiste danış. Antrenmanda ağrı olursa hareketi bırak.";
function gPgHtml(){
  const chips=(k,vals,lbl)=>`<div class="chips">${vals.map(v=>`<button class="chip" data-g="pgf:${k}:${v}" aria-pressed="${gPgF[k]===v}">${lbl(v)}</button>`).join("")}</div>`;
  const list=PrgLib.PROGRAMS.filter(gPgMatch);
  return `<div class="card"><details class="acc" id="pgacc"${gPgF.d||gPgF.lv?" open":""}><summary>Hazır programlar</summary><div class="lbl">Haftada gün</div>${chips("d",[0,3,4,5,6],v=>v||"Hepsi")}<div class="lbl">Seviye</div>${chips("lv",["","Başlangıç","Orta"],v=>v||"Hepsi")}
  ${list.map(p=>`<button class="rrow" data-g="pg:${p.id}"><span class="tx"><b>${p.n}</b><span class="mut sm">${gPgMeta(p)}</span></span><span class="plus">›</span></button>`).join("")||`<p class="hint">Bu seçime uyan program yok.</p>`}
  <p class="hint">${gPgNote}</p></details></div>`;
}
function gPgSheet(id){
  const p=PrgLib.PROGRAMS.find(x=>x.id===id);if(!p)return;
  if(p.d[0]<p.d[1])gPgD=Math.max(p.d[0],Math.min(p.d[1],gPgD||gPgF.d||p.d[0]));else gPgD=p.d[0];
  const ds=PrgLib.days(p,gPgD);
  openSheet(`<h3>${p.n}</h3><div class="mut sm">${gPgMeta(p)}</div><p class="pv-2 hint">${p.about}</p>
  ${p.d[0]<p.d[1]?`<div class="lbl">Gün sayısı</div><div class="chips">${Array.from({length:p.d[1]-p.d[0]+1},(_,i)=>p.d[0]+i).map(n=>`<button class="chip" data-g="pgd:${p.id}:${n}" aria-pressed="${n===gPgD}">${n}</button>`).join("")}</div>`:""}
  ${ds.map(d=>`<div class="lbl">${d.n}</div><div class="mb-2">${d.ex.map(r=>{const t=PrgLib.tg(r);return `${esc(gEx(r[0]).n)} <span class="nw mut num">${t.sets}×${t.sec?t.sec+" sn":gRepsTx(t)}</span>`}).join(", ")}</div>`).join("")}
  <p class="hint">${gPgNote}</p>
  <div class="lbl">Rehberli başlat</div><div class="chips">${ds.map((d,i)=>`<button class="chip" data-g="gdgo:p:${p.id}-${i}">${d.n}</button>`).join("")}</div>
  <div class="btns"><button class="btn" data-g="pgadd:${p.id}">Şablonlarıma ekle</button><button class="btn ghost" data-g="closesheet">Kapat</button></div>`);
}
/* Coach programs and ready-made programs are added the same way; each day becomes a template named "Name – Day". */
function gTplAdd(name,ds){
  return ds.map(d=>{
    const t={id:S.gid++,name:`${name} – ${d.n}`.slice(0,60),ex:d.ex.slice()};if(d.tg)t.tg=d.tg;
    S.templates.push(t);return t.id;
  });
}

/* ---- template editor ---- */
const gRepsTx=a=>a.reps?a.reps+(a.hi?"-"+a.hi:""):"";
function gTgDef(id){
  const k=gKind(id);
  return k in GSEC?{sets:GSETS[k],sec:GSEC[k]}:{sets:3,reps:8,hi:12};
}
function gTePush(id){gTe.ex.push(id);gTe.tg[id]=gTgDef(id)}
/* Target from the session's working sets: lower rep bound = fewest reps done; the previous upper bound is kept when it is still above it. */
function gTgFrom(w,prev){
  const tg={};
  for(const x of w.ex){
    const s=gDoneSets(x);if(!s.length)continue;
    const o={sets:Math.min(10,s.length)};if(x.ss)o.ss=x.ss;
    if(gTimed(x.id))o.sec=Math.min(SEC_MAX,s[0].sec);
    else{o.reps=Math.min(REPS_MAX,Math.min(...s.map(t=>t.reps)));const h=prev&&prev[x.id]&&prev[x.id].hi;if(h>o.reps)o.hi=h}
    tg[x.id]=o;
  }
  return tg;
}
function gTeOpen(id){
  const t=id?S.templates.find(x=>x.id===id):null;
  gTe={id:t?t.id:null,name:t?t.name:"",ex:t?t.ex.slice():[],tg:t?structuredClone(t.tg||{}):{}};
  for(const i of gTe.ex){const a=gTe.tg[i];if(!a||!(a.sets||a.reps||a.sec))gTe.tg[i]=Object.assign(gTgDef(i),a)}
  gTeSheet();
}
function gTeSheet(){
  const rows=gTe.ex.map((id,i)=>{
    const e=gEx(id),a=gTe.tg[id]||{},k=gKind(id),tm=gTimed(id),u=k==="c"?60:1;
    return `<div class="card ex"><div class="exh"><div class="exn"><b>${esc(e.n)}</b><span class="mut">${e.r||e.g}</span></div><button class="del" data-g="temv:${i}:-1" aria-label="Yukarı taşı">▲</button><button class="del" data-g="temv:${i}:1" aria-label="Aşağı taşı">▼</button><button class="del" data-g="term:${i}" aria-label="Çıkar">✕</button></div>
    <div class="two"><div><div class="lbl">Set</div><input class="in num" inputmode="numeric" data-te="sets:${i}" value="${a.sets||""}" ${k==="c"?"disabled":""} aria-label="${esc(e.n)} set sayısı"></div>
    <div><div class="lbl">${tm?k==="c"?"Süre (dk)":"Süre (sn)":"Tekrar"}</div><input class="in num" inputmode="${tm?"numeric":"text"}" data-te="${tm?"sec":"reps"}:${i}" value="${tm?a.sec?Math.round(a.sec/u):"":gRepsTx(a)}" placeholder="${tm?"":"8-12"}" aria-label="${esc(e.n)} ${tm?"süre":"tekrar"}"></div></div></div>`;
  }).join("");
  openSheet(`<h3>${gTe.id?"Şablonu düzenle":"Yeni şablon"}</h3><div class="lbl">Ad</div><input class="in" id="gten" maxlength="60" value="${esc(gTe.name)}" placeholder="Örn. İtiş günü">
  ${rows||`<p class="hint">Egzersiz ekleyerek başla.</p>`}
  <button class="mb-2 btn ghost" data-g="teadd">+ Egzersiz ekle</button>
  <div class="btns"><button class="btn" data-g="tesave">Kaydet</button><button class="btn ghost" data-g="closesheet">Vazgeç</button></div>`);
}
/* Capture what was typed into the draft before a re-render. An invalid field keeps its old value. */
function gTeSync(){
  const n=$("#gten");if(!n)return;
  gTe.name=n.value;
  for(const el of document.querySelectorAll("#sheet [data-te]")){
    const [f,i]=el.dataset.te.split(":"),id=gTe.ex[+i],a=id&&gTe.tg[id];if(!a)continue;
    const v=el.value.trim();
    if(f==="reps"){
      const m=/^(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/.exec(v);
      if(m&&+m[1]>=1&&+m[1]<=REPS_MAX){a.reps=+m[1];if(m[2]&&+m[2]>a.reps&&+m[2]<=REPS_MAX)a.hi=+m[2];else delete a.hi}
    }else{
      const x=num(v,true),u=f==="sec"&&gKind(id)==="c"?60:1;
      if(f==="sets"&&x>=1&&x<=10)a.sets=x;
      if(f==="sec"&&x>=1&&x*u<=SEC_MAX)a.sec=x*u;
    }
  }
}
function gTeSave(){
  gTeSync();
  const name=gTe.name.trim().slice(0,60);
  if(!name)return toast("Şablona ad yaz");
  if(!gTe.ex.length)return toast("En az bir egzersiz ekle");
  const o={name,ex:gTe.ex.slice(),tg:structuredClone(gTe.tg)},t=gTe.id&&S.templates.find(x=>x.id===gTe.id);
  if(t)Object.assign(t,o);else S.templates.push(Object.assign({id:S.gid++},o));
  gTe=null;save();closeSheet();render();toast("Şablon kaydedildi");
}

/* ---- actions ---- */
/* A past day starts at noon of that day, so its order among the sessions (previous session, records) is right. */
function gStart(tplId,day=dayKey()){
  if(gActive()){tab="gym";return render()}
  const t=tplId?S.templates.find(x=>x.id===tplId):null;
  const w={id:S.gid++,day,t0:day===dayKey()?Date.now():new Date(day+"T12:00:00").getTime(),t1:null,name:t?t.name:"Antrenman",tpl:t?t.id:null,ex:[]};
  if(t)for(const i of t.ex)gAddEx(w,i,t.tg&&t.tg[i]);
  S.workouts.push(w);save();tab="gym";render();
}
const gOpenAsk=(open,y,n)=>`<p>${open} set işaretlenmemiş. Sayılsın mı, yoksa antrenmandan çıkarılsın mı?</p><button class="btn" data-g="${y}">Sayılsın, bitir</button><button class="mt-2 btn ghost" data-g="${n}">İşaretsizleri at, bitir</button><button class="mt-2 btn ghost" data-g="closesheet">Antrenmana dön</button>`;
function gDaySheet(){
  openSheet(`<h3>Geçmiş bir güne antrenman</h3><label class="lbl" for="gdday">Gün</label><input class="in" type="date" id="gdday" value="${keyOff(-1)}" max="${dayKey()}">
  <label class="lbl" for="gdtpl">Şablon</label><select class="in" id="gdtpl"><option value="">Boş antrenman</option>${S.templates.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("")}</select>
  <div class="ferr" id="gdderr" role="alert"></div><button class="btn" data-g="startdaygo">Başlat</button><button class="mt-2 btn ghost" data-g="closesheet">Vazgeç</button>`);
}
function gDayGo(){
  const day=$("#gdday").value,t=+$("#gdtpl").value||null;
  if(!/^\d{4}-\d\d-\d\d$/.test(day)||!dayOk(day)||day>dayKey())return ferr("gdderr","Geçerli bir gün seç, gelecek günler olmaz");
  closeSheet();gStart(t,day);
}
function gFinish(){
  const w=gActive();if(!w)return;
  if(gAged(w))return gStaleAsk();
  const open=gOpenSets(w);
  if(open)return openSheet(`<h3>Antrenman bitirilsin mi?</h3>${gOpenAsk(open,"finall","finskip")}`);
  gFinishSave(w);
}
/* The real duration of a workout left over from an earlier day is unknown: taking "now" as the end would write a bogus 10-hour entry, so the user is asked. */
function gStaleAsk(){
  const w=gActive();if(!w)return;
  const open=gOpenSets(w);
  openSheet(`<h3>Antrenman kaç dakika sürdü?</h3><p class="hint">${fd(w.day)} günü başlayan antrenman bitirilmemişti.</p><label class="lbl" for="gsd">Süre (dk)</label><input class="in" id="gsd" inputmode="numeric" value="60">
  ${open?gOpenAsk(open,"stalego","staleskip"):`<button class="btn" data-g="stalego">Bitir ve kaydet</button><button class="mt-2 btn ghost" data-g="closesheet">Vazgeç</button>`}`);
}
function gStaleGo(skip){
  const w=gActive(),m=Math.round(+($("#gsd")||{}).value);if(!w)return;
  if(!(m>=1&&m<=WORKOUT_MIN_MAX))return toast("Süreyi 1-600 dakika arası yaz");
  if(!skip)gCompleteAll(w);
  closeSheet();gFinishSave(w,w.t0+m*60000);
}
function gFinishSave(w,end){
  if(!w.ex.some(x=>x.sets.some(t=>t.done&&gSetOk(t))))return toast(w.ex.length?"Kaydedilmedi: değeri girilmiş set yok. Tekrar ya da süre gir, ✓ koy; vazgeçtiysen Antrenmanı sil":"Kaydedilmedi: antrenmanda egzersiz yok. Egzersiz ekle ya da Antrenmanı sil");
  gTimStop();
  for(const x of w.ex)x.sets=x.sets.filter(s=>s.done);
  w.ex=w.ex.filter(x=>x.sets.length);
  w.t1=end||Date.now();delete w.rest;
  gLogExercise(w,"Ağırlık");
  save();gRestSet(0);render();gSheetSummary(w.id);
}
/* Sport minutes and calorie estimate of a finished workout (finish and guided save). */
function gLogExercise(w,kind){
  const e=add("exercise",gDur(w),`${kind}, ${w.name}`,dayAt(w.t1||Date.now()));e.wid=w.id; // the time is the end time, so the day must be the end day
  const kc=Algo.gymKcal({min:gDur(w),sets:gWorkSets(w),kg:motionKg()});if(kc)e.kcal=kc;
}
function gRestore(w,entries){
  S.workouts.push(w);Log.restore(entries);save();render();
}
function gClick(v,el){
  const [a,p1,p2]=v.split(":"),w=gActive();
  const ei=+p1,si=+p2;
  switch(a){
    case "start":return p1?gTplPreview(+p1):gStart(null);
    case "startgo":closeSheet();return gStart(+p1);
    case "startday":return gDaySheet();
    case "startdaygo":return gDayGo();
    case "gdpick":return gdPick();
    case "gdgo":return gdStart(v.slice(5));
    case "fillok":{
      const x=w.ex[ei],ps=gPrevSet(w,x,si),k=document.querySelector(`[data-gi="kg:${ei}:${si}"]`),r=document.querySelector(`[data-gi="reps:${ei}:${si}"]`);
      if(!ps||!k||!r)return;
      if(!k.value.trim())k.value=gW(ps.kg||0)||"0";
      if(!r.value.trim())r.value=ps.reps;
      closeSheet();return document.querySelector(`[data-g="done:${ei}:${si}"]`).click();
    }
    case "pick":return gSheetPick();
    case "closesheet":return closeSheet();
    case "histmore":gHistMax+=20;return render();
    case "recmore":gRecMax=1e3;return render();
    case "pickmore":gPickMax+=60;$("#glist").innerHTML=gPickHtml();return;
    case "grp":gGroup=p1;gPickMax=40;document.querySelectorAll("#gchips .chip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.g==="grp:"+gGroup));$("#glist").innerHTML=gPickHtml();return;
    case "addex":{
      if(gTeOn){
        if(gTe.ex.includes(p1))return toast("Bu egzersiz zaten ekli");
        gTePush(p1);$("#glist").innerHTML=gPickHtml();return;
      }
      if(!w)return;const i=w.ex.findIndex(x=>x.id===p1);
      if(i>=0)return toast("Bu egzersiz zaten ekli");
      gAddEx(w,p1);save();$("#glist").innerHTML=gPickHtml();render();return;
    }
    case "newex":gNew=!gNew;$("#gnew").innerHTML=gNew?gNewHtml():"";return;
    case "nf":gNewRead();gNewS[p1]=p2;$("#gnew").innerHTML=gNewHtml();return;
    case "mkex":{
      gNewRead();const n=gNewS.n.trim();if(!n)return toast("Egzersiz adı yaz");
      if(gExAll().some(e=>tr(e.n)===tr(n)))return toast("Bu adda egzersiz var");
      const {k,r,q,tp}=gNewS,ex={id:"c"+(S.gid++),n,g:GREG[r]||"Bacak",inc:2.5,r,k,c:k==="c"?"k":"g",q};if(tp)ex.tp=tp;
      S.customEx.push(ex);gNewS.n="";gNewS.tp="";
      if(gTeOn){gTePush(ex.id);save();return gTeSheet()}
      if(w)gAddEx(w,ex.id);save();closeSheet();render();return;
    }
    case "menu":return gMenu(ei);
    case "note":return gSheetNote(ei);
    case "savenote":w.ex[ei].note=$("#gnote").value.trim().slice(0,300);save();closeSheet();render();return;
    case "mv":{gTimStop();const j=ei+si;if(j<0||j>=w.ex.length)return;[w.ex[ei],w.ex[j]]=[w.ex[j],w.ex[ei]];gSsNorm(w.ex);save();closeSheet();render();return}
    case "rmex":{
      gTimStop();const rm=w.ex[ei],ss=w.ex.map(x=>x.ss);w.ex.splice(ei,1);gSsNorm(w.ex);save();closeSheet();render();
      toast("Egzersiz silindi",()=>{w.ex.splice(ei,0,rm);w.ex.forEach((x,i)=>{if(ss[i])x.ss=ss[i];else delete x.ss});save();render()});return;
    }
    case "ssl":{
      const x=w.ex[ei],p=w.ex[ei-1],old=x.ss;if(!p)return;
      if(!p.ss)p.ss=Math.max(0,...w.ex.map(y=>y.ss||0))+1;
      for(let j=ei;j<w.ex.length&&(j===ei||(old&&w.ex[j].ss===old));j++)w.ex[j].ss=p.ss;
      save();closeSheet();render();return;
    }
    case "ssu":{
      const x=w.ex[ei],old=x.ss,nv=Math.max(0,...w.ex.map(y=>y.ss||0))+1;
      for(let j=ei+1;j<w.ex.length&&w.ex[j].ss===old;j++)w.ex[j].ss=nv;
      delete x.ss;gSsNorm(w.ex);save();closeSheet();render();return;
    }
    case "stype":{
      const s=w.ex[ei].sets[si];if(!s)return;
      const tm=gTimed(w.ex[ei].id),cur=s.w?"w":s.t||"n",o=(k,t,d)=>`<button class="prow" data-g="sty${k}:${ei}:${si}"><span><b>${t}</b><span class="mut sm">${d}</span></span>${cur===k?`<span class="tag">Seçili</span>`:""}</button>`;
      openSheet(`<h3>${si+1}. set${tm?"":" türü"}</h3><div class="plist">${tm?"":o("n","Normal","Çalışma seti")+o("w","Isınma","Hacme, öneriye ve rekora girmez")+o("d","Drop set","Ağırlığı düşürüp devam; hacme girer, rekora girmez")+o("f","Başarısızlığa kadar","Tekrar yapamayana dek; hacme ve rekora girer")}
      <button class="prow dng" data-g="setdel:${ei}:${si}"><span><b>Seti sil</b><span class="mut sm">Bu set antrenmandan çıkar</span></span></button></div><button class="btn ghost" data-g="closesheet">Kapat</button>`);
      return;
    }
    case "styn":case "styw":case "styd":case "styf":{
      const s=w.ex[ei].sets[si];if(!s)return;
      delete s.w;delete s.t;
      if(a==="styw")s.w=true;else if(a==="styd")s.t="d";else if(a==="styf")s.t="f";
      save();closeSheet();render();return;
    }
    case "addset":{
      const x=w.ex[ei],l=x.sets[x.sets.length-1],o={kg:l?l.kg:null,reps:l?l.reps:null,done:false};
      if(gTimed(x.id))o.sec=l&&l.sec!=null?l.sec:GSEC[gKind(x.id)];
      x.sets.push(o);save();render();return;
    }
    case "done":{
      const s=w.ex[ei].sets[si],row=el.closest(".srow");
      if(gTimed(w.ex[ei].id)){
        if(!s.done){if(!(s.sec>0))return toast("Önce süreyi yaz");s.done=true;if(gTim&&gTim.ei===ei&&gTim.si===si)gTimStop();gRestGo(w,ei)}
        else s.done=false;
        save();render();gTick();return;
      }
      const kgI=row.querySelector("[data-gi^=kg]").value.trim(),kg=kgI&&kgI===gShow("kg",s,w.ex[ei].id)?s.kg:Units.wIn(num(kgI)),reps=num(row.querySelector("[data-gi^=reps]").value,true);
      let pr=null;
      if(!s.done){
        if(gEmptySet(w,ei,si,kgI,!isNaN(reps),gKind(w.ex[ei].id)))return;
        if(!(reps>0&&reps<=REPS_MAX))return toast("Tekrar 1 ile 200 arasında olmalı");
        s.kg=isNaN(kg)?0:kg;s.reps=reps;s.done=true;gRestGo(w,ei);
        pr=gRecOk(s)&&gNewPR(w,w.ex[ei].id,s);
      }else s.done=false;
      save();render();gTick();
      if(s.done){const n=document.querySelector(".srow.nx");if(n)n.scrollIntoView({block:"center",behavior:"smooth"})}
      if(pr){toast(`Yeni rekor: ${pr.ex.n}, ${gW(pr.kg)||0} ${Units.wu()} × ${pr.reps}`);gVib([200,100,200])}
      return;
    }
    case "kgm":case "kgp":case "rpm":case "rpp":{
      const x=w.ex[ei],s=x.sets[si],up=a[2]==="p";
      if(a[0]==="k"){
        const r2=v=>Math.round(v*100)/100,step=Units.wu()==="lb"?gLbStep(gInc(x.id)):gInc(x.id);
        s.kg=Math.min(KG_MAX,Units.wIn(Math.max(0,r2(r2(Units.w(s.kg||0))+(up?1:-1)*step))));
      }
      else s.reps=Math.min(REPS_MAX,Math.max(1,(s.reps||0)+(up?1:-1)));
      save();return render();
    }
    case "same":{
      const x=w.ex[ei],s=x.sets[si],prev=gHistory(x.id,w.t0)[0];
      const ps=gPrevSet(w,x,si,prev);
      if(!ps)return;s.kg=ps.kg;s.reps=ps.reps;save();return render();
    }
    case "rest":{const d=+p1;gRestSet(d&&Math.max(Date.now(),restEnd)+d*1000);gTick();return}
    case "finish":return gFinish();
    case "stalefin":return gStaleAsk();
    case "stalego":return gStaleGo(false);
    case "staleskip":return gStaleGo(true);
    case "finall":case "finskip":{
      if(!w)return;closeSheet();
      if(a==="finall")gCompleteAll(w);
      return gFinishSave(w);
    }
    case "setdel":{
      const x=w.ex[ei],s=x&&x.sets[si];if(!s)return;
      gTimStop();x.sets.splice(si,1);
      if(!gNext(w)&&restEnd)gRestSet(0);
      if(!commit(()=>x.sets.splice(si,0,s)))return;
      closeSheet();render();
      toast("Set silindi",()=>{x.sets.splice(si,0,s);save();render()});return;
    }
    case "cancel":return void confirmSheet({title:"Bu antrenman kaydedilmeden silinsin mi?",ok:"Sil",danger:true}).then(ok=>{
      if(!ok)return;gTimStop();S.workouts=S.workouts.filter(x=>x!==w);save();gRestSet(0);render();
    });
    case "hist":return gSheetHist(p1);
    case "mm":{
      const i=$("#mminfo");if(!i)return;
      document.querySelectorAll(".mmwrap .on").forEach(e=>e.classList.remove("on"));
      document.querySelectorAll(".mmwrap [data-g]").forEach(e=>{const on=e.dataset.g==="mm:"+p1;if(on)e.classList.add("on");if(e.tagName==="BUTTON")e.setAttribute("aria-pressed",on)});
      i.textContent=MuscleMap.tx(p1,gWeekRegions()[p1]||0);return;
    }
    case "sum":return gSheetSummary(+p1);
    case "wedit":return gEditSheet(+p1);
    case "wsave":return gEditSave(+p1);
    case "savetpl":{
      const x=S.workouts.find(y=>y.id===+p1);if(!x)return;
      return openSheet(`<h3>Şablon olarak kaydet</h3><label class="lbl" for="gtn">Şablon adı</label><input class="in" id="gtn" maxlength="60" autocomplete="off" value="${esc(x.name)}" autofocus onfocus="this.select()"><div class="ferr" id="gterr" role="alert"></div><button class="btn" data-g="savetplgo:${x.id}">Kaydet</button><button class="mt-2 btn ghost" data-g="closesheet">Vazgeç</button>`);
    }
    case "savetplgo":{
      const x=S.workouts.find(y=>y.id===+p1),name=($("#gtn")||{value:""}).value.trim();if(!x)return;
      if(!name)return ferr("gterr","Şablona bir ad yaz");
      const t={id:S.gid++,name:name.slice(0,60),ex:x.ex.map(e=>e.id)},tg={};
      for(const e of x.ex)if(e.ss)tg[e.id]={ss:e.ss};
      if(Object.keys(tg).length)t.tg=tg;
      S.templates.push(t);x.tpl=t.id;save();closeSheet();render();toast("Şablon kaydedildi");return;
    }
    case "tdel":{
      const t=S.templates.find(x=>x.id===+p1);if(!t)return;
      return void confirmSheet({title:`"${t.name}" şablonu silinsin mi?`,ok:"Sil",danger:true}).then(ok=>{
        if(ok){S.templates=S.templates.filter(x=>x!==t);save();render();toast("Şablon silindi",()=>{S.templates.push(t);save();render()})}
      });
    }
    case "pgf":gPgF[p1]=p1==="d"?+p2:p2;return render();
    case "pg":gPgD=0;return gPgSheet(p1);
    case "pgd":gPgD=+p2;return gPgSheet(p1);
    case "pgadd":{
      const p=PrgLib.PROGRAMS.find(x=>x.id===p1);if(!p)return;
      const ids=gTplAdd(p.n,PrgLib.days(p,gPgD).map(PrgLib.toTpl));save();closeSheet();render();
      toast(`${ids.length} şablon eklendi`,()=>{S.templates=S.templates.filter(t=>!ids.includes(t.id));save();render()});return;
    }
    case "tedit":return gTeOpen(p1?+p1:null);
    case "teback":gTeSync();return gTeSheet();
    case "teadd":gTeSync();return gSheetPick(true);
    case "temv":case "term":{
      gTeSync();const j=ei+(a==="temv"?+p2:0);
      if(a==="term"){const id=gTe.ex.splice(ei,1)[0];delete gTe.tg[id]}
      else if(j>=0&&j<gTe.ex.length)[gTe.ex[ei],gTe.ex[j]]=[gTe.ex[j],gTe.ex[ei]];
      return gTeSheet();
    }
    case "tesave":return gTeSave();
    case "tplupd":{
      const x=S.workouts.find(y=>y.id===+p1),t=x&&S.templates.find(y=>y.id===x.tpl);if(!t)return;
      const old={ex:t.ex,tg:t.tg};
      t.ex=x.ex.map(e=>e.id);t.tg=gTgFrom(x,t.tg);save();closeSheet();render();
      toast("Şablon bu seansa göre güncellendi",()=>{t.ex=old.ex;if(old.tg)t.tg=old.tg;else delete t.tg;save();render()});return;
    }
    case "delw":{
      const x=S.workouts.find(y=>y.id===+p1);if(!x)return;
      S.workouts=S.workouts.filter(y=>y!==x);const ents=Log.remove(e=>e.wid===x.id);save();closeSheet();render();
      toast("Antrenman silindi",()=>gRestore(x,ents));return;
    }
    default:return exClick(a,p1,p2);
  }
}
function gInput(t){
  const [f,ei,si]=t.dataset.gi.split(":"),w=gActive();if(!w)return;
  const x=w.ex[+ei],s=x&&x.sets[+si];if(!s)return;
  const r=gField(f,t.value,s,x.id);
  if(r.err){t.value=gShow(f,s,x.id);return toast(r.err)}
  if(r.v==null&&f==="rpe")delete s.rpe;else s[f]=r.v;
  t.value=gShow(f,s,x.id);
  save();gTick();
}

/* The formula behind the energy card, with the user's own numbers. */
function energyHow({kg,cm,age,sex,act},bmr,sg){
  const k=Algo.ACT[act]||1.45,c=sex==="m"?"+ 5":sex==="f"?"− 161":"− 78",n=x=>Math.round(x).toLocaleString("tr-TR");
  return `<p class="p0 hint num">Bazal hız (Mifflin-St Jeor): 10 × ${fmt(kg)} kg + 6,25 × ${cm} cm − 5 × ${age} yaş ${c} = <b>${n(bmr)} kcal</b>${sex?"":" (cinsiyet belirtilmediği için ortalama sabit)"}.<br>
  Hareket çarpanı (${["Az","Orta","Çok"][act]||"Orta"}): × ${fmt(k,2)} = <b>${n(bmr*k)} kcal</b> formül harcaması.<br>
  Hedef: harcama ± haftalık kilo değişimi × ${Algo.KCAL_PER_KG} kcal/kg ÷ 7${sg?`; şimdi ${sg.note.toLowerCase()}, haftada ${fmt(Math.abs(sg.rateKgWk),2)} kg`:""}. Antrenman ayrıca eklenir.</p>`;
}
/* ---- energy and target card (Trend) ---- */
function gEnergy(){
  const st=S.settings,wAll=weights(),days=Object.keys(wAll).sort();
  if(!days.length)return "";
  const kg=Algo.trend(wAll)[days[days.length-1]];
  if(!(st.heightCm>0&&st.age>0))return `<h2>Enerji dengesi</h2><div class="card"><p class="flush hint">Harcamanı ve kalori hedefini hesaplamak için boy ve yaş gerekli.</p><button class="btn ghost" data-act="profile">Profili doldur</button></div>`;
  const profile={kg,cm:st.heightCm,age:st.age,sex:st.sex||"",act:st.act};
  const intake=Log.byDay("food");
  const r=Algo.adaptiveTdee({weights:wAll,intake,profile});
  if(!r.tdee)return "";
  const bmr=Algo.bmrMifflin(profile),pg=risk(kg).pregnant,sg=pg?null:Algo.suggestTarget({...riskInput(kg),tdee:r.tdee,bmr});
  const pr=Algo.protein(riskInput(kg)).range;
  const src=r.source==="formül"?"Formül tahmini. Veri biriktikçe kendini ayarlar.":`Gerçek verinden hesaplandı, güven %${Math.round(r.confidence*100)}.`;
  const cells=[["Tahmini harcama",pg?"Hekiminle belirle":`${Math.round(r.tdee/10)*10} kcal`]];
  if(sg)cells.push(["Önerilen hedef",`${sg.kcal} kcal`]);
  cells.push(["Protein aralığı",pr?`${pr[0]}–${pr[1]} g`:"Hekiminle belirle"]);
  return `<h2>Enerji dengesi</h2><div class="card">${sg&&sg.blocked?riskBox(risk(kg),"Kalori açığı önermiyorum"):""}<div class="stats">${cells.map(c=>`<div class="stat"><div class="k">${c[0]}</div><div class="v num">${c[1]}</div></div>`).join("")}</div>
  ${sg&&sg.kcal!==st.kcal?`<div class="btns"><button class="btn ghost" data-act="apply:${sg.kcal}">Hedefi ${sg.kcal} kcal yap</button></div>`:""}
  <details class="acc"><summary>Nasıl hesaplandı</summary>${energyHow(profile,bmr,sg)}<p class="p0 hint">${Algo.PROTEIN_NOTE} ${src}${sg&&sg.limited?" Hedef güvenli alt sınırda tutuldu.":""}${sg&&sg.blocked?" Öneri bakım düzeyinde tutuldu.":""}</p></details></div>`;
}
