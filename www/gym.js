"use strict";
/* Salon: veri modeli, ekranlar ve etkileşim. index.html'deki global yardımcıları kullanır. */
const GROUPS=["Bacak","İtiş","Çekiş","Omuz","Kol","Karın"];
const EXLIB=[
  {id:"squat",n:"Squat",g:"Bacak",inc:2.5},{id:"legpress",n:"Leg press",g:"Bacak",inc:5},
  {id:"rdl",n:"Romanian deadlift",g:"Bacak",inc:2.5},{id:"legcurl",n:"Leg curl",g:"Bacak",inc:2.5},
  {id:"legext",n:"Leg extension",g:"Bacak",inc:2.5},{id:"calf",n:"Calf raise",g:"Bacak",inc:2.5},
  {id:"bench",n:"Bench press",g:"İtiş",inc:2.5},{id:"incdb",n:"Incline dumbbell press",g:"İtiş",inc:2},
  {id:"tri",n:"Triceps pushdown",g:"İtiş",inc:2.5},{id:"ohp",n:"Omuz press",g:"Omuz",inc:2.5},
  {id:"lat",n:"Lateral raise",g:"Omuz",inc:1},{id:"pullup",n:"Barfiks",g:"Çekiş",inc:2.5},
  {id:"pulldown",n:"Lat pulldown",g:"Çekiş",inc:2.5},{id:"row",n:"Kürek çekme",g:"Çekiş",inc:2.5},
  {id:"curl",n:"Biceps curl",g:"Kol",inc:2},{id:"crunch",n:"Crunch",g:"Karın",inc:2.5}
];
const REST_SEC=90;
let gPgF={d:0,lv:""},gPgD=0,gTe=null,gTeOn=false,gHistMax=20,gTim=null,gPickMax=40,restEnd=0,gQuery="",gGroup="Tümü",gNew=false;

/* Kütüphane (exlib.js) + eski 16 egzersiz: eski kimlikler ve adlar aynen korunur, kütüphane alanları (bölge, tür, şekil) eklenir. */
const EXREG=["Göğüs","Sırt","Omuz","Biseps","Triseps","Ön kol","Karın","Bel","Kalça","Ön bacak","Arka bacak","Baldır","İç-dış bacak","Trapez","Boyun","Tüm vücut"];
const EXMERGED=(()=>{
  const old=new Map(EXLIB.map(e=>[e.id,e])),out=(typeof EXDB!=="undefined"?EXDB:[]).map(x=>old.has(x.id)?Object.assign({},x,old.get(x.id)):x);
  for(const e of EXLIB)if(!out.some(x=>x.id===e.id))out.push(e);
  return out;
})();
/* Kendi egzersizi: bölgeden eski 6'lı grup türetilir (özet ve eski ekranlar g okur). */
const GREG={"Göğüs":"İtiş","Triseps":"İtiş","Sırt":"Çekiş","Bel":"Çekiş","Omuz":"Omuz","Trapez":"Omuz","Boyun":"Omuz","Biseps":"Kol","Ön kol":"Kol","Karın":"Karın"};
const GNEWK={w:"Ağırlık × tekrar",b:"Tekrar",t:"Süreli",c:"Kardiyo"},GNEWQ=["Ağırlıksız","Ev tipi","Salon"];
const GFIG={squat:"Çömelme",hinge:"Kalça menteşesi",lunge:"Hamle",stepup:"Basamağa çıkış",legext:"Bacak açma",legcurl:"Bacak bükme",legpress:"Leg press",bridge:"Kalça köprüsü",calf:"Baldır kaldırma",legspread:"Yana adım",pushup:"Şınav",bench:"Yatarak itiş",incline:"Eğimli itiş",fly:"Açma (fly)",dips:"Dips",ohp:"Omuz press",latraise:"Yana kaldırma",frontraise:"Öne kaldırma",skull:"Yatarak triceps",row:"Öne eğilip çekiş",pullup:"Barfiks",pulldown:"Yukarıdan çekiş",seatedrow:"Oturarak çekiş",backext:"Bel ekstansiyonu",shrug:"Omuz silkme",curl:"Biceps curl",pushdown:"Triceps pushdown",kickback:"Triceps kickback",overheadext:"Baş üstü triceps",crunch:"Mekik",situp:"Tam mekik",legraise:"Ters mekik",hangraise:"Asılı bacak kaldırma",plank:"Plank",climber:"Dağcı",sidebend:"Yan eğilme",woodchop:"Gövde bükme",jack:"Açılıp kapanma",run:"Koşu",highknees:"Yüksek diz",walk:"Yürüyüş",jumprope:"İp atlama",cycle:"Bisiklet",qstretch:"Ön bacak esnetme",hamstretch:"Arka bacak esnetme",armstretch:"Göğüs esnetme",neckstretch:"Boyun",twiststretch:"Gövde döndürme"};
let gNewS={n:"",k:"w",r:"Ön bacak",q:"Salon",tp:""};
const gExAll=()=>EXMERGED.concat(S.customEx);
const gKind=id=>gEx(id).k||"w";
const gTimed=id=>"tic".includes(gKind(id));
const gSetOk=s=>!s.w&&(s.reps>0||s.sec>0); // w: ısınma seti, hiçbir hesaba girmez
const gEx=id=>gExAll().find(e=>e.id===id)||{id,n:"Silinmiş egzersiz",g:"Diğer",inc:2.5};
const gActive=()=>S.workouts.find(w=>w.t1==null)||null;
const gDone=w=>w.t1!=null;
/* Ağır bileşik hareketlerde toparlanma daha uzun sürer (ACSM: 2-3 dk), izolasyonda 1-2 dk yeter. Süreli 30 sn ve kardiyo 0 eski davranış;
   şekli olmayan (kendi) egzersiz eski 90 sn'de kalır. */
const GREST_BIG=new Set(["squat","lunge","legpress","hinge","bench","incline","ohp","row","seatedrow","pullup","pulldown","dips"]);
const gRestDef=id=>{const e=gEx(id),k=gKind(id);return k==="c"?0:"ti".includes(k)?30:!e.tp?REST_SEC:GREST_BIG.has(e.tp)?150:75};
const gRestSec=id=>{const c=S.exCfg[id];return c&&c.rest!=null?c.rest:gRestDef(id)};
const gRestTx=s=>s?gClock(s*1000):"kapalı";
function gCfg(id,patch){
  const c=Object.assign({},S.exCfg[id],patch);for(const k in c)if(c[k]==null)delete c[k];
  if(Object.keys(c).length)S.exCfg[id]=c;else delete S.exCfg[id];
}
/* Dinlenme bitişi yerel bildirimle de duyurulur: JS sayacı ekran kapalıyken ya da uygulama arkadayken çalışmaz. */
function gRestSet(end,exId){
  restEnd=end>Date.now()?end:0;
  if(restEnd)gNotify(restEnd,"⏱ Dinlenme bitti",exId?`Sıradaki set: ${gEx(exId).n}`:"Sıradaki sete geç",9002);else gNotifyCancel(9002);
}
const gRpeTx=s=>s&&s.rpe?` @${fkg(s.rpe)}`:"";
const fkg=x=>x==null||x===""?"":String(Math.round(x*100)/100).replace(".",",");

/* ---- doğrulama (yükleme ve geri yükleme için) ---- */
function cleanGym(r){
  const out={workouts:[],templates:[],customEx:[],gid:1,bar:r.bar>=5&&r.bar<=50?+r.bar:20,exCfg:{}};
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
  const known=new Set(EXMERGED.map(e=>e.id).concat(out.customEx.map(e=>e.id)));
  const cfg=r.exCfg&&typeof r.exCfg==="object"?r.exCfg:{};
  for(const id of Object.keys(cfg)){
    const c=cfg[id],o={};
    if(!known.has(id)||!c)continue;
    if(Number.isInteger(c.lo)&&c.lo>=1&&c.lo<=30&&Number.isInteger(c.hi)&&c.hi>c.lo&&c.hi<=50)Object.assign(o,{lo:c.lo,hi:c.hi});
    if(Number.isInteger(c.rest)&&c.rest>=0&&c.rest<=600)o.rest=c.rest;
    if(Object.keys(o).length)out.exCfg[id]=o;
  }
  for(const w of (Array.isArray(r.workouts)?r.workouts:[])){
    if(!w||!idOk(w.id)||!dayOk(w.day)||!Number.isFinite(w.t0))continue;
    const ex=[];
    for(const x of (Array.isArray(w.ex)?w.ex:[])){
      if(!x||typeof x.id!=="string"||!known.has(x.id))continue;
      const sets=[];
      for(const s of (Array.isArray(x.sets)?x.sets:[])){
        if(!s)continue;
        const kg=s.kg==null?null:Number(s.kg),reps=s.reps==null?null:Number(s.reps),sec=s.sec==null?null:Number(s.sec);
        if((kg!=null&&!(kg>=0&&kg<=1000))||(reps!=null&&!(reps>=0&&reps<=200))||(sec!=null&&!(sec>=0&&sec<=7200)))continue;
        const o=sec==null?{kg,reps,done:s.done===true}:{kg,reps,sec:Math.round(sec),done:s.done===true};
        if(s.w===true)o.w=true;
        if(typeof s.rpe==="number"&&s.rpe>=6&&s.rpe<=10&&s.rpe*2===Math.round(s.rpe*2))o.rpe=s.rpe;
        sets.push(o);
      }
      ex.push({id:x.id,note:typeof x.note==="string"?x.note.slice(0,300):"",sets});
    }
    out.workouts.push({id:w.id,day:w.day,t0:w.t0,t1:Number.isFinite(w.t1)?w.t1:null,name:typeof w.name==="string"?w.name.slice(0,60):"Antrenman",tpl:idOk(w.tpl)?w.tpl:null,ex});
    maxId=Math.max(maxId,w.id);
  }
  // en fazla bir etkin antrenman
  let seen=false;for(const w of out.workouts)if(w.t1==null){if(seen)w.t1=w.t0;seen=true}
  for(const t of (Array.isArray(r.templates)?r.templates:[])){
    if(!t||!idOk(t.id)||typeof t.name!=="string"||!Array.isArray(t.ex))continue;
    const ex=t.ex.filter(i=>known.has(i)),tg={},g=t.tg&&typeof t.tg==="object"?t.tg:{},iv=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
    for(const i of ex){
      const a=g[i],o={};if(!a||typeof a!=="object")continue;
      if(iv(a.sets,1,10))o.sets=a.sets;
      if(iv(a.reps,1,200)){o.reps=a.reps;if(iv(a.hi,a.reps+1,200))o.hi=a.hi}
      if(iv(a.sec,1,7200))o.sec=a.sec;
      if(Object.keys(o).length)tg[i]=o;
    }
    const o={id:t.id,name:t.name.slice(0,60),ex};if(Object.keys(tg).length)o.tg=tg;
    out.templates.push(o);maxId=Math.max(maxId,t.id);
  }
  out.gid=Math.max(maxId+1,idOk(r.gid)?r.gid:1);
  return out;
}

/* ---- geçmiş ve öneri ---- */
function gHistory(exId,beforeT=Infinity){
  return S.workouts.filter(w=>gDone(w)&&w.t0<beforeT).sort((a,b)=>b.t0-a.t0)
    .map(w=>({w,sets:(w.ex.find(x=>x.id===exId)||{sets:[]}).sets.filter(s=>s.done&&gSetOk(s))})).filter(h=>h.sets.length);
}
function gSuggest(exId){
  if(gKind(exId)!=="w")return null;
  const [h,...old]=gHistory(exId);if(!h)return null;
  return Algo.nextTarget(h.sets,Object.assign({lo:8,hi:12,inc:gEx(exId).inc,prev:old.slice(0,2).map(x=>x.sets)},S.exCfg[exId]));
}
const GSEC={t:30,i:30,c:600};
/* tg: şablon hedefi {sets,reps,sec}. Varsa set sayısı, tekrar ve süre ondan gelir; kg yine önceki seanstan/öneriden. */
function gAddEx(w,exId,tg){
  const kind=gKind(exId),t=tg||{},h=gHistory(exId)[0],sets=[];
  if(kind==="t"||kind==="i"||kind==="c"){
    const sec=t.sec||h&&h.sets[0].sec||GSEC[kind],n=kind==="c"?1:t.sets||(h?Math.min(h.sets.length,6):kind==="i"?4:3);
    for(let i=0;i<n;i++)sets.push({kg:null,reps:null,sec,done:false});
  }else{
    const sug=gSuggest(exId),n=t.sets||(h?Math.min(Math.max(h.sets.length,1),6):3);
    for(let i=0;i<n;i++)sets.push({kg:sug?sug.kg:null,reps:t.reps||(sug?sug.reps:null),done:false});
  }
  w.ex.push({id:exId,note:"",sets});
}
function gBest(w,exId){
  let b=0;const x=w.ex.find(e=>e.id===exId);
  if(x&&gKind(exId)==="w")for(const s of x.sets)if(s.done&&!s.w)b=Math.max(b,Algo.est1RM(s.kg,s.reps));
  return b;
}
function gIsPR(w,exId){
  const cur=gBest(w,exId);if(!cur)return null;
  const prev=gHistory(exId,w.t0).reduce((m,h)=>Math.max(m,gBest(h.w,exId)),0);
  if(!(prev>0&&cur>prev+0.05))return null;
  let top=null;for(const s of w.ex.find(e=>e.id===exId).sets)if(s.done&&gSetOk(s)&&(!top||Algo.est1RM(s.kg,s.reps)>Algo.est1RM(top.kg,top.reps)))top=s;
  return {ex:gEx(exId),kg:top.kg,reps:top.reps,e1:cur,prev};
}
const gPRs=w=>w.ex.map(x=>gIsPR(w,x.id)).filter(Boolean);
const gSeenPR=new Set();
/* Set anında rekor: o set rekoru getirmiş olmalı, aynı antrenmanda egzersiz başına bir kez. */
function gNewPR(w,exId,s){
  const p=gIsPR(w,exId),k=w.id+":"+exId;
  if(!p||gSeenPR.has(k)||Algo.est1RM(s.kg,s.reps)<p.e1)return null;
  gSeenPR.add(k);return p;
}
const gWorkVol=w=>w.ex.reduce((s,x)=>s+Algo.volume(x.sets.filter(t=>t.done)),0);
const gWorkSets=w=>w.ex.reduce((s,x)=>s+x.sets.filter(t=>t.done&&gSetOk(t)).length,0);
function gWeekSets(){
  const from=Date.now()-7*864e5,m={};
  for(const w of S.workouts)if(gDone(w)&&w.t0>=from)for(const x of w.ex){
    const g=gEx(x.id).g;m[g]=(m[g]||0)+x.sets.filter(t=>t.done&&gSetOk(t)).length;
  }
  return m;
}
function gWeekRegions(){
  const from=Date.now()-7*864e5,m={};
  for(const w of S.workouts)if(gDone(w)&&w.t0>=from)for(const x of w.ex){
    const e=gEx(x.id),g=e.r||e.g;m[g]=(m[g]||0)+x.sets.filter(t=>t.done&&gSetOk(t)).length;
  }
  return m;
}
const GBIG=["Göğüs","Sırt","Omuz","Ön bacak","Arka bacak"];
/* Kural tabanlı haftalık not (yapay zekâsız): bölge → set sayısı. 10-20 set/hafta genel bir kılavuz aralığıdır, hedef ya da tıbbi iddia değil. */
function gWeekNote(regs,hasHistory){
  const n=r=>regs[r]||0,low=EXREG.filter(r=>n(r)>0&&n(r)<10).sort((a,b)=>n(a)-n(b)).slice(0,3),miss=GBIG.filter(r=>!n(r));
  if(!EXREG.some(n))return hasHistory?["Son 7 günde antrenman kaydı yok. İstediğinde bir şablonla küçük bir seansla başlayabilirsin."]:[];
  const out=[];
  if(low.length)out.push(`${low.map(r=>`${r} ${n(r)}`).join(", ")} set, önerilen haftalık 10-20 aralığının altında.`);
  if(miss.length)out.push(`Bu hafta henüz set girmediğin büyük kas grupları: ${miss.join(", ")}.`);
  return out.length?out:["Kaydettiğin bölgelerin hepsi haftalık 10 set ve üstünde."];
}
const gTimedSec=w=>w.ex.reduce((s,x)=>s+(gTimed(x.id)?x.sets.filter(t=>t.done&&gSetOk(t)).reduce((a,t)=>a+(t.sec||0),0):0),0);
const gSecTx=s=>s>=120?Math.round(s/60)+" dk":s+" sn";
const gVolTx=w=>{const v=gWorkVol(w),t=gTimedSec(w);return [v>0&&`${Math.round(v).toLocaleString("tr-TR")} kg`,t>0&&gSecTx(t)].filter(Boolean).join(", ")};
const gStats=w=>[`${gWorkSets(w)} set`,`${gDur(w)} dk`,gVolTx(w)].filter(Boolean).join(" · ");
const gNames=(w,n)=>{const a=w.ex.map(x=>gEx(x.id).n);return a.slice(0,n).join(", ")+(a.length>n?` +${a.length-n}`:"")};
const gDur=w=>Math.min(600,Math.max(1,Math.round(((w.t1||Date.now())-w.t0)/60000))); // 600: spor kaydı üst sınırı
const gClock=ms=>{const s=Math.max(0,Math.floor(ms/1000));return `${pad(Math.floor(s/60))}:${pad(s%60)}`};
const gDate=d=>`${+d.slice(8)} ${AY[+d.slice(5,7)-1].slice(0,3)}`;

/* ---- ekranlar ---- */
function viewSalon(){
  const w=gActive();
  return w?gLive(w):gHome();
}
function gHome(){
  const done=S.workouts.filter(gDone).sort((a,b)=>b.t0-a.t0);
  const tpl=S.templates.map(t=>{
    const last=done.find(w=>w.tpl===t.id);
    return `<div class="card trow"><button class="tmain" data-g="start:${t.id}"><b>${esc(t.name)}</b><span class="mut">${esc(t.ex.map(i=>gEx(i).n).join(", ")||"Egzersiz yok")}</span><span class="mut">${last?"Son: "+gDate(last.day):"Henüz yapılmadı"}</span></button><button class="del" data-g="tedit:${t.id}" aria-label="Şablonu düzenle">✎</button><button class="del" data-g="tdel:${t.id}" aria-label="Şablonu sil">✕</button></div>`;
  }).join("");
  const wk=gWeekSets(),mx=Math.max(14,...Object.values(wk));
  const bars=Object.keys(wk).length?`<h2>Bu hafta, kas grubuna göre set</h2><div class="card">${GROUPS.concat(["Diğer"]).filter(g=>wk[g]).map(g=>`<div class="gbar"><span>${g}</span><span class="bar"><i style="width:${(wk[g]/mx*100).toFixed(0)}%"></i></span><span class="num">${wk[g]}</span></div>`).join("")}<p class="hint">Kas grubu başına haftada 10 ile 20 set çoğu kişi için makul bir aralıktır.</p></div>`:"";
  const note=gWeekNote(gWeekRegions(),done.length>0).map(l=>`<p class="hint">${l}</p>`).join("");
  const rec=gHistHtml(done);
  return `<button class="btn" data-g="start:">Boş antrenman başlat</button>
  <button class="btn ghost" data-g="lib" style="margin-top:8px">📚 Egzersiz kütüphanesi (${EXMERGED.length}, animasyonlu)</button>
  <button class="btn ghost" data-c="prog" style="margin-top:8px">Koç'tan program iste</button>
  <h2>Şablonlarım</h2>${tpl||`<p class="hint">Şablon yok. "Yeni şablon" ile kur ya da bir antrenmanı bitirince "Şablon olarak kaydet" de.</p>`}<button class="btn ghost" data-g="tedit:">+ Yeni şablon</button>
  ${gPgHtml()}
  ${bars}${note?`<div class="card" id="wknote">${note}</div>`:""}
  <h2>Antrenman geçmişi</h2><div class="card">${rec||`<p class="hint">Henüz antrenman yok.</p>`}</div>`;
}
/* Bugün ekranı: bitmemiş antrenman yalnız Salon'da görünüyordu, bitenler de yalnız Salon'da. */
function gTodayCard(){
  const a=gActive(),d=S.workouts.filter(w=>gDone(w)&&w.day===dayKey()).sort((x,y)=>y.t0-x.t0);
  if(!a&&!d.length)return "";
  const row=(w,k,l)=>`<button class="rrow" data-g="${k}"><span class="tx" style="min-width:0;overflow-wrap:anywhere"><b>${esc(w.name)}</b><span class="mut sm">${esc(gNames(w,4))||"Egzersiz yok"}</span><span class="mut sm num">${l}</span></span>${k==="start:"?`<span class="tag">Devam et</span>`:""}</button>`;
  const ws=a?a.ex.reduce((s,x)=>s+x.sets.filter(t=>!t.w).length,0):0;
  return `<div class="card">${a?row(a,"start:",`Devam ediyor, ${a.ex.length} egzersiz, ${a.ex.reduce((s,x)=>s+x.sets.filter(t=>t.done&&gSetOk(t)).length,0)}/${ws} set işaretli`):""}${d.map(w=>row(w,"sum:"+w.id,gStats(w))).join("")}</div>`;
}
function gHistHtml(done){
  const rows=done.slice(0,gHistMax);let ym="";
  return rows.map(x=>{
    const h=x.day.slice(0,7)===ym?"":`<div class="lbl">${AY[+x.day.slice(5,7)-1]} ${x.day.slice(0,4)}</div>`;ym=x.day.slice(0,7);
    return `${h}<button class="rrow" data-g="sum:${x.id}"><span class="num mut">${gDate(x.day)}</span><span class="tx" style="min-width:0;overflow-wrap:anywhere"><b>${esc(x.name)}</b><span class="mut sm">${esc(gNames(x,3))}</span><span class="mut sm num">${gStats(x)}</span></span></button>`;
  }).join("")+(done.length>rows.length?`<button class="lnk" data-g="histmore">Daha fazla göster (${done.length-rows.length})</button>`:"");
}
/* Sıradaki set: antrenmanın ilk işaretsiz seti. Satırı vurgulanır, ± paneli onun altında açılır. */
function gNext(w){
  for(let ei=0;ei<w.ex.length;ei++){const si=w.ex[ei].sets.findIndex(s=>!s.done);if(si>=0)return {ei,si}}
  return null;
}
/* Panel: kg ve tekrar için ± (adım egzersizin inc'i) ve önceki seanstaki aynı sıradaki setle tek dokunuşla doldurma. */
function gStepPanel(w,ei,si,prev){
  const x=w.ex[ei],s=x.sets[si],st=(f,l,v)=>`<div class="stp"><button data-g="${f}m:${ei}:${si}" aria-label="${l} azalt">−</button><span class="num" aria-label="${l}">${v}</span><button data-g="${f}p:${ei}:${si}" aria-label="${l} artır">+</button></div>`;
  const ps=!s.w&&prev&&(prev.sets[x.sets.slice(0,si).filter(t=>!t.w).length]||prev.sets[prev.sets.length-1]);
  const same=ps&&(ps.kg||0)!==(s.kg||0)||ps&&ps.reps!==s.reps;
  return `<div class="sx">${st("kg","Ağırlık",s.kg==null?"–":fkg(s.kg))}${st("rp","Tekrar",s.reps==null?"–":s.reps)}
  ${same?`<button class="lnk sxs" data-g="same:${ei}:${si}">Önceki seansla aynı: ${ps.kg?fkg(ps.kg)+" × ":""}${ps.reps}</button>`:""}</div>`;
}
function gLive(w){
  const nx=gNext(w);
  const cards=w.ex.map((x,ei)=>{
    const ex=gEx(x.id),prev=gHistory(x.id,w.t0)[0],sug=gSuggest(x.id);
    const kind=gKind(x.id),tm=kind==="t"||kind==="i"||kind==="c",unit=kind==="c"?60:1,rpe=S.settings.rpeOn&&!tm;
    let wi=0;
    const rows=x.sets.map((s,si)=>{
      const ps=!s.w&&prev&&prev.sets[wi++],p=s.w?"ısınma":!ps?"–":tm?`${kind==="c"?Math.round(ps.sec/60)+" dk":ps.sec+" sn"}`:`${ps.kg?fkg(ps.kg)+" × ":""}${ps.reps}`;
      const tick=`<button class="ok${s.done?" on":""}" data-g="done:${ei}:${si}" aria-label="${si+1}. set ${s.done?"geri al":"tamamlandı"}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>`;
      const on=nx&&nx.ei===ei&&nx.si===si;
      if(tm)return `<div class="srow${s.done?" dn":""}${on?" nx":""}"><span class="sn">${si+1}</span><span class="sp num">${p}</span>
      <input class="sin num" inputmode="numeric" aria-label="${si+1}. set ${kind==="c"?"dakika":"saniye"}" data-gi="sec:${ei}:${si}" value="${s.sec==null?"":Math.round(s.sec/unit)}" placeholder="${kind==="c"?"dk":"sn"}">
      <button class="sin tgo" data-g="tstart:${ei}:${si}" aria-label="${si+1}. set zamanlayıcıyı başlat">${gTim&&gTim.ei===ei&&gTim.si===si?"⏸":"▶"}</button>${tick}</div>`;
      return `<div class="srow${rpe?" r":""}${s.done?" dn":""}${on?" nx":""}"><span class="sn">${si+1}</span><span class="sp num">${p}</span>
      <input class="sin num" inputmode="decimal" aria-label="${si+1}. set kg" data-gi="kg:${ei}:${si}" value="${s.kg==null?"":fkg(s.kg)}" placeholder="${kind==="b"?"ek kg":"kg"}">
      <input class="sin num" inputmode="numeric" aria-label="${si+1}. set tekrar" data-gi="reps:${ei}:${si}" value="${s.reps==null?"":s.reps}" placeholder="tek">${rpe?`<input class="sin num" inputmode="decimal" aria-label="${si+1}. set zorluk (RPE)" data-gi="rpe:${ei}:${si}" value="${s.rpe==null?"":fkg(s.rpe)}" placeholder="RPE">`:""}${tick}</div>${on?gStepPanel(w,ei,si,prev):""}`;
    }).join("");
    return `<div class="card ex"><div class="exh"><button class="exn" data-g="hist:${x.id}"><b>${esc(ex.n)}</b><span class="mut">${ex.r||ex.g}</span></button><button class="del" data-g="exinfo:${x.id}" aria-label="Egzersiz bilgisi">ⓘ</button><button class="del" data-g="menu:${ei}" aria-label="Egzersiz menüsü">⋮</button></div>
    ${sug?`<div class="sug">Öneri: ${fkg(sug.kg)||0} kg × ${sug.reps}. ${sug.why}.${sug.note?` <span class="mut">${sug.note}</span>`:""}</div>`:""}${x.note?`<div class="note">${esc(x.note)}</div>`:""}
    <div class="shead${rpe?" r":""}"><span>Set</span><span>Önceki</span>${tm?`<span>${kind==="c"?"Dakika":"Süre (sn)"}</span><span>Süre</span>`:`<span>${kind==="b"?"Ek kg":"kg"}</span><span>Tekrar</span>${rpe?"<span>RPE</span>":""}`}<span></span></div>${rows}
    <button class="lnk" data-g="addset:${ei}">Set ekle</button></div>`;
  }).join("");
  return `<div class="livebar"><div><b>${esc(w.name)}</b><div class="mut num" id="gstat">${gClock(Date.now()-w.t0)} süre, ${Math.round(gWorkVol(w)).toLocaleString("tr-TR")} kg hacim</div></div><button class="btn fin" data-g="finish">Bitir</button></div>
  ${gTimBar()}
  <div class="rest" id="grest"${restEnd>Date.now()?"":" hidden"}><div><span class="mut">Dinlenme</span><b class="num" id="gr">${restEnd>Date.now()?gClock(restEnd-Date.now()):""}</b></div><button data-g="rest:-15">−15</button><button data-g="rest:15">+15</button><button data-g="rest:0">Atla</button></div>
  ${cards||`<p class="hint">Henüz egzersiz yok. Aşağıdan ekle.</p>`}
  <button class="btn ghost" data-g="pick">Egzersiz ekle</button>
  <button class="lnk dng" data-g="cancel">Antrenmanı iptal et</button>`;
}
/* Yerel pencere bayrağı (DeviceHelp.keepAwake): navigator.wakeLock'un Android WebView desteği belgelerde yalnız Chrome'dan çıkarım. */
let gAwakeOn=false;
function gAwake(force){
  const on=!!(S.settings.awakeOn&&gActive()&&tab==="salon"&&!document.hidden),d=DH();
  if((on===gAwakeOn&&!force)||!d||!d.keepAwake)return;
  gAwakeOn=on;d.keepAwake({on}).catch(()=>{});
}
document.addEventListener("visibilitychange",()=>gAwake(true));
function gTick(){
  gAwake();
  const w=gActive();if(!w||tab!=="salon")return;
  const st=$("#gstat");if(st)st.textContent=`${gClock(Date.now()-w.t0)} süre, ${Math.round(gWorkVol(w)).toLocaleString("tr-TR")} kg hacim`;
  const r=$("#grest");if(!r)return;
  const left=restEnd-Date.now();
  if(left>0){r.hidden=false;$("#gr").textContent=gClock(left)}
  else{
    if(restEnd&&!r.hidden){try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
    // 9002 burada iptal edilmez: iptal teslim edilmiş bildirimi de siler, arkadaki gecikmeli tik onu kullanıcı görmeden kaldırırdı.
    r.hidden=true;restEnd=0;
  }
}

/* ---- alt sayfalar ---- */
function gPickHtml(){
  const q=tr(gQuery),w=gActive();
  const all=gExAll().filter(e=>(gGroup==="Tümü"||(e.r||e.g)===gGroup)&&(!q||tr(e.n).includes(q))),list=all.slice(0,gPickMax);
  const inW=new Set(gTeOn?gTe.ex:w?w.ex.map(x=>x.id):[]);
  return list.map(e=>{
    const h=gHistory(e.id)[0],last=h?(gTimed(e.id)?`son ${h.sets[0].sec} sn`:`son ${fkg(Math.max(...h.sets.map(s=>s.kg||0)))||0} kg × ${h.sets[0].reps}`):"henüz yok";
    return `<button class="prow" data-g="addex:${e.id}"><span><b>${esc(e.n)}</b><span class="mut sm">${e.r||e.g}${e.q?", "+e.q.toLowerCase():""}, ${last}</span></span>${inW.has(e.id)?`<span class="tag">Eklendi</span>`:`<span class="plus">+</span>`}</button>`;
  }).join("")+(all.length>list.length?`<button class="lnk" data-g="pickmore">${all.length-list.length} egzersiz daha göster</button>`:"")||`<p class="hint">Sonuç yok.</p>`;
}
function gSheetPick(te){
  gTeOn=!!te;gQuery="";gGroup="Tümü";gNew=false;gPickMax=40;
  openSheet(`<h3>Egzersiz ekle</h3><input class="in" id="gq" placeholder="Egzersiz ara" autocomplete="off">
  <div class="chips" id="gchips">${["Tümü"].concat(EXREG).map(g=>`<button class="chip" data-g="grp:${g}" aria-pressed="${g==="Tümü"}">${g}</button>`).join("")}</div>
  <div id="glist" class="plist">${gPickHtml()}</div>
  <button class="lnk" data-g="newex">Yeni egzersiz oluştur</button><div id="gnew"></div>
  <button class="btn" data-g="${te?"teback":"closesheet"}">Tamam</button>`);
}
function gNewRead(){const n=$("#gnn"),t=$("#gntp");if(n)gNewS.n=n.value;if(t)gNewS.tp=t.value}
function gNewHtml(){
  const ch=(f,vals,lbl)=>`<div class="chips">${vals.map(v=>`<button class="chip" data-g="nf:${f}:${v}" aria-pressed="${gNewS[f]===v}">${lbl(v)}</button>`).join("")}</div>`;
  return `<div class="card" style="margin-top:8px"><input class="in" id="gnn" placeholder="Egzersiz adı" maxlength="60" value="${esc(gNewS.n)}">
  <div class="lbl">Tür</div>${ch("k",Object.keys(GNEWK),v=>GNEWK[v])}<div class="lbl">Bölge</div>${ch("r",EXREG,v=>v)}<div class="lbl">Ekipman</div>${ch("q",GNEWQ,v=>v)}
  <div class="lbl">Hareket şekli (figür)</div><select class="in" id="gntp" aria-label="Hareket şekli"><option value="">Figür yok</option>${Object.keys(GFIG).map(k=>`<option value="${k}"${k===gNewS.tp?" selected":""}>${GFIG[k]}</option>`).join("")}</select>
  <button class="btn" data-g="mkex">Oluştur ve ekle</button></div>`;
}
function gMenu(ei){
  const w=gActive(),x=w.ex[ei];
  openSheet(`<h3>${esc(gEx(x.id).n)}</h3><div class="plist">
   <button class="prow" data-g="note:${ei}"><span><b>Egzersiz notu</b><span class="mut sm">Örn. bar yüksekliği, ağrı</span></span></button>
   ${gKind(x.id)==="w"?`<button class="prow" data-g="plate:${ei}"><span><b>Plaka ve ısınma</b><span class="mut sm">Bar başına plaka, ısınma setleri</span></span></button>`:""}
   ${gKind(x.id)==="w"?`<button class="prow" data-g="rng:${ei}"><span><b>Tekrar aralığı</b><span class="mut sm">${(c=>c.lo+"-"+c.hi)(Object.assign({lo:8,hi:12},S.exCfg[x.id]))}, öneri bu aralığa göre</span></span></button>`:""}
   <button class="prow" data-g="rst:${ei}"><span><b>Dinlenme süresi</b><span class="mut sm">${gRestTx(gRestSec(x.id))}, set ✓ sonrası sayaç ve bildirim</span></span></button>
   <button class="prow" data-g="mv:${ei}:-1"><span><b>Yukarı taşı</b></span></button>
   <button class="prow" data-g="mv:${ei}:1"><span><b>Aşağı taşı</b></span></button>
   <button class="prow dng" data-g="rmex:${ei}"><span><b>Egzersizi sil</b><span class="mut sm">${x.sets.length} set silinir</span></span></button></div>
   <button class="btn ghost" data-g="closesheet">Kapat</button>`);
}
function gSheetNote(ei){
  const x=gActive().ex[ei];
  openSheet(`<h3>Egzersiz notu</h3><textarea class="in" id="gnote" maxlength="300" autofocus>${esc(x.note)}</textarea><button class="btn" data-g="savenote:${ei}">Kaydet</button>`);
}
function gSheetHist(exId){
  const ex=gEx(exId),h=gHistory(exId);
  if(gKind(exId)!=="w")return gSheetHistSimple(exId,h);
  if(!h.length)return openSheet(`<h3>${esc(ex.n)}</h3><p class="hint">Henüz tamamlanmış set yok.</p><button class="btn" data-g="closesheet">Kapat</button>`);
  const per=h.map(x=>({d:x.w.day,e:gBest(x.w,exId),vol:Algo.volume(x.sets),top:x.sets.reduce((a,s)=>Algo.est1RM(s.kg,s.reps)>Algo.est1RM(a.kg,a.reps)?s:a,x.sets[0])}));
  const best=per.reduce((a,b)=>b.e>a.e?b:a,per[0]);
  openSheet(`<h3>${esc(ex.n)}</h3><div class="two"><div class="stat"><div class="k">En iyi set</div><div class="v num">${fkg(best.top.kg)||0} kg × ${best.top.reps}</div></div><div class="stat"><div class="k">Tahmini 1TM</div><div class="v num">${Math.round(best.e)} kg</div></div></div>
  ${exCharts(exId)}
  <table><thead><tr><th>Tarih</th><th>En iyi set</th><th>Hacim</th></tr></thead><tbody>${per.slice(0,6).map(p=>`<tr><td>${gDate(p.d)}</td><td class="num">${fkg(p.top.kg)||0} × ${p.top.reps}${gRpeTx(p.top)}</td><td class="num">${Math.round(p.vol).toLocaleString("tr-TR")} kg</td></tr>`).join("")}</tbody></table>
  <button class="btn" data-g="closesheet">Kapat</button>`);
}
function gSheetSummary(id){
  const w=S.workouts.find(x=>x.id===id);if(!w)return;
  const prs=gPRs(w),sets={};
  for(const x of w.ex)sets[gEx(x.id).g]=(sets[gEx(x.id).g]||0)+x.sets.filter(s=>s.done&&gSetOk(s)).length;
  openSheet(`<h3>${esc(w.name)}</h3><div class="mut sm">${gDate(w.day)}, ${gDur(w)} dk</div>
  ${gWorkVol(w)>0?`<div class="sumv num">${Math.round(gWorkVol(w)).toLocaleString("tr-TR")} <small>kg hacim</small></div>`:gTimedSec(w)>0?`<div class="sumv num">${gSecTx(gTimedSec(w))} <small>toplam süre</small></div>`:""}
  <div class="two"><div class="stat"><div class="k">Set</div><div class="v num">${gWorkSets(w)}</div></div><div class="stat"><div class="k">Egzersiz</div><div class="v num">${w.ex.length}</div></div></div>
  ${prs.length?`<div class="pr"><b>${prs.length} yeni rekor</b>${prs.map(p=>`<div>${esc(p.ex.n)}, ${fkg(p.kg)||0} kg × ${p.reps}<div class="mut sm">Tahmini 1TM ${Math.round(p.e1)} kg, önceki ${Math.round(p.prev)} kg</div></div>`).join("")}</div>`:""}
  <div class="mut sm" style="margin:8px 0">${Object.keys(sets).map(g=>`${g} ${sets[g]}`).join(", ")}</div>
  <div class="btns">${w.tpl==null?`<button class="btn ghost" data-g="savetpl:${w.id}">Şablon olarak kaydet</button>`:S.templates.some(t=>t.id===w.tpl)?`<button class="btn ghost" data-g="tplupd:${w.id}">Şablonu bu seansa göre güncelle</button>`:""}<button class="btn ghost" data-g="closesheet">Kapat</button><button class="btn danger" data-g="delw:${w.id}">Antrenmanı sil</button></div>`);
}

/* ---- hazır programlar (programs.js) ---- */
const gPgMatch=p=>(!gPgF.d||(gPgF.d>=p.d[0]&&gPgF.d<=p.d[1]))&&(!gPgF.lv||p.lv===gPgF.lv);
const gPgMeta=p=>`${p.d[0]===p.d[1]?p.d[0]:p.d[0]+"-"+p.d[1]} gün · ${p.q==="Ağırlıksız"?"ekipmansız":"salon"} · ${p.lv.toLowerCase()}`;
const gPgNote="Genel bilgidir, kişisel antrenman ya da tıbbi tavsiye değildir. Ağrı veya sakatlığın varsa başlamadan hekime ya da fizyoterapiste danış.";
function gPgHtml(){
  const chips=(k,vals,lbl)=>`<div class="chips">${vals.map(v=>`<button class="chip" data-g="pgf:${k}:${v}" aria-pressed="${gPgF[k]===v}">${lbl(v)}</button>`).join("")}</div>`;
  const list=PrgLib.PROGRAMS.filter(gPgMatch);
  return `<h2>Hazır programlar</h2><div class="card"><div class="lbl">Haftada gün</div>${chips("d",[0,3,4,5,6],v=>v||"Hepsi")}<div class="lbl">Seviye</div>${chips("lv",["","Başlangıç","Orta"],v=>v||"Hepsi")}
  ${list.map(p=>`<button class="rrow" data-g="pg:${p.id}"><span class="tx"><b>${p.n}</b><span class="mut sm">${gPgMeta(p)}</span></span><span class="plus">›</span></button>`).join("")||`<p class="hint">Bu seçime uyan program yok.</p>`}
  <p class="hint">${gPgNote}</p></div>`;
}
function gPgSheet(id){
  const p=PrgLib.PROGRAMS.find(x=>x.id===id);if(!p)return;
  if(p.d[0]<p.d[1])gPgD=Math.max(p.d[0],Math.min(p.d[1],gPgD||gPgF.d||p.d[0]));else gPgD=p.d[0];
  const ds=PrgLib.days(p,gPgD);
  openSheet(`<h3>${p.n}</h3><div class="mut sm">${gPgMeta(p)}</div><p class="hint" style="padding:6px 0">${p.about}</p>
  ${p.d[0]<p.d[1]?`<div class="lbl">Gün sayısı</div><div class="chips">${Array.from({length:p.d[1]-p.d[0]+1},(_,i)=>p.d[0]+i).map(n=>`<button class="chip" data-g="pgd:${p.id}:${n}" aria-pressed="${n===gPgD}">${n}</button>`).join("")}</div>`:""}
  ${ds.map(d=>`<div class="lbl">${d.n}</div><div style="margin-bottom:8px">${d.ex.map(r=>{const t=PrgLib.tg(r);return `${esc(gEx(r[0]).n)} <span class="mut num" style="white-space:nowrap">${t.sets}×${t.sec?t.sec+" sn":gRepsTx(t)}</span>`}).join(", ")}</div>`).join("")}
  <p class="hint">${gPgNote}</p>
  <div class="btns"><button class="btn" data-g="pgadd:${p.id}">Şablonlarıma ekle</button><button class="btn ghost" data-g="closesheet">Kapat</button></div>`);
}
/* Koç programı ve hazır program aynı yoldan eklenir; günler "Ad – Gün" adlı şablon olur. */
function gTplAdd(name,ds){
  const ids=ds.map(d=>{
    const t={id:S.gid++,name:`${name} – ${d.n}`.slice(0,60),ex:d.ex.slice()};if(d.tg)t.tg=d.tg;
    S.templates.push(t);return t.id;
  });
  return ids;
}

/* ---- şablon editörü ---- */
const gRepsTx=a=>a.reps?a.reps+(a.hi?"-"+a.hi:""):"";
function gTgDef(id){
  const k=gKind(id);
  return k==="c"?{sets:1,sec:600}:k==="t"?{sets:3,sec:30}:k==="i"?{sets:4,sec:30}:{sets:3,reps:8,hi:12};
}
function gTePush(id){gTe.ex.push(id);gTe.tg[id]=gTgDef(id)}
/* Seanstaki çalışma setlerinden hedef: tekrar alt sınırı en az tekrarın kendisi, eski üst sınır korunur. */
function gTgFrom(w,prev){
  const tg={};
  for(const x of w.ex){
    const s=x.sets.filter(t=>t.done&&gSetOk(t)&&!t.w);if(!s.length)continue;
    const o={sets:Math.min(10,s.length)};
    if(gTimed(x.id))o.sec=Math.min(7200,s[0].sec);
    else{o.reps=Math.min(200,Math.min(...s.map(t=>t.reps)));const h=prev&&prev[x.id]&&prev[x.id].hi;if(h>o.reps)o.hi=h}
    tg[x.id]=o;
  }
  return tg;
}
function gTeOpen(id){
  const t=id?S.templates.find(x=>x.id===id):null;
  gTe={id:t?t.id:null,name:t?t.name:"",ex:t?t.ex.slice():[],tg:t?structuredClone(t.tg||{}):{}};
  for(const i of gTe.ex)if(!gTe.tg[i])gTe.tg[i]=gTgDef(i);
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
  ${rows||`<p class="hint">Henüz egzersiz yok.</p>`}
  <button class="btn ghost" data-g="teadd" style="margin-bottom:8px">+ Egzersiz ekle</button>
  <div class="btns"><button class="btn" data-g="tesave">Kaydet</button><button class="btn ghost" data-g="closesheet">Vazgeç</button></div>`);
}
/* Yeniden çizimden önce yazılanlar taslağa alınır. Geçersiz alan eski değeri korur. */
function gTeSync(){
  const n=$("#gten");if(!n)return;
  gTe.name=n.value;
  for(const el of document.querySelectorAll("#sheet [data-te]")){
    const [f,i]=el.dataset.te.split(":"),id=gTe.ex[+i],a=id&&gTe.tg[id];if(!a)continue;
    const v=el.value.trim();
    if(f==="reps"){
      const m=/^(\d{1,3})(?:\s*-\s*(\d{1,3}))?$/.exec(v);
      if(m&&+m[1]>=1&&+m[1]<=200){a.reps=+m[1];if(m[2]&&+m[2]>a.reps&&+m[2]<=200)a.hi=+m[2];else delete a.hi}
    }else{
      const x=num(v,true),u=f==="sec"&&gKind(id)==="c"?60:1;
      if(f==="sets"&&x>=1&&x<=10)a.sets=x;
      if(f==="sec"&&x>=1&&x*u<=7200)a.sec=x*u;
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

/* ---- eylemler ---- */
function gStart(tplId){
  if(gActive()){tab="salon";return render()}
  const t=tplId?S.templates.find(x=>x.id===tplId):null;
  const w={id:S.gid++,day:dayKey(),t0:Date.now(),t1:null,name:t?t.name:"Antrenman",tpl:t?t.id:null,ex:[]};
  if(t)for(const i of t.ex)gAddEx(w,i,t.tg&&t.tg[i]);
  S.workouts.push(w);save();tab="salon";render();
}
function gFinish(){
  const w=gActive();if(!w)return;
  gTimStop();
  const open=w.ex.reduce((s,x)=>s+x.sets.filter(t=>!t.done&&gSetOk(t)).length,0);
  if(open){
    if(!confirm(`${open} set işaretlenmemiş. Tamamlandı sayılıp kaydedilsin mi?
Tamam: sayılır, İptal: antrenmana dön`))return;
    for(const x of w.ex)for(const t of x.sets)if(gSetOk(t))t.done=true;
  }
  if(!w.ex.some(x=>x.sets.some(t=>t.done&&gSetOk(t))))return toast(w.ex.length?"Kaydedilmedi: değeri girilmiş set yok. Tekrar ya da süre gir, ✓ koy; vazgeçtiysen Antrenmanı iptal et":"Kaydedilmedi: antrenmanda egzersiz yok. Egzersiz ekle ya da Antrenmanı iptal et");
  for(const x of w.ex)x.sets=x.sets.filter(s=>s.done);
  w.ex=w.ex.filter(x=>x.sets.length);
  w.t1=Date.now();
  const e=add("spor",gDur(w),`Ağırlık, ${w.name}`,w.day);e.wid=w.id;
  save();gRestSet(0);render();gSheetSummary(w.id);
}
function gRestore(w,entries){
  S.workouts.push(w);for(const e of entries)S.entries.push(e);
  S.entries.sort((a,b)=>a.id-b.id);save();render();
}
function gClick(v,el){
  const [a,p1,p2]=v.split(":"),w=gActive();
  const ei=+p1,si=+p2;
  switch(a){
    case "start":return gStart(p1?+p1:null);
    case "pick":return gSheetPick();
    case "closesheet":return closeSheet();
    case "histmore":gHistMax+=20;return render();
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
    case "mv":{gTimStop();const j=ei+si;if(j<0||j>=w.ex.length){return}[w.ex[ei],w.ex[j]]=[w.ex[j],w.ex[ei]];save();closeSheet();render();return}
    case "rmex":{gTimStop();const rm=w.ex[ei];w.ex.splice(ei,1);save();closeSheet();render();toast("Egzersiz silindi",()=>{w.ex.splice(ei,0,rm);save();render()});return}
    case "addset":{const s=w.ex[ei].sets,l=s[s.length-1];s.push({kg:l?l.kg:null,reps:l?l.reps:null,done:false});save();render();return}
    case "done":{
      const s=w.ex[ei].sets[si],row=el.closest(".srow");
      if(gTimed(w.ex[ei].id)){
        if(!s.done){if(!(s.sec>0))return toast("Önce süreyi yaz");s.done=true;if(gTim&&gTim.ei===ei&&gTim.si===si)gTimStop();gRestSet(Date.now()+gRestSec(w.ex[ei].id)*1000,w.ex[ei].id)}
        else s.done=false;
        save();render();gTick();return;
      }
      const kg=num(row.querySelector("[data-gi^=kg]").value),reps=num(row.querySelector("[data-gi^=reps]").value,true);
      let pr=null;
      if(!s.done){
        if(!(reps>0&&reps<=200))return toast("Önce tekrar sayısını yaz");
        s.kg=isNaN(kg)?0:kg;s.reps=reps;s.done=true;gRestSet(Date.now()+gRestSec(w.ex[ei].id)*1000,w.ex[ei].id);
        pr=!s.w&&gNewPR(w,w.ex[ei].id,s);
      }else s.done=false;
      save();render();gTick();
      if(s.done){const n=document.querySelector(".srow.nx");if(n)n.scrollIntoView({block:"center",behavior:"smooth"})}
      if(pr){toast(`Yeni rekor: ${pr.ex.n}, ${fkg(pr.kg)||0} kg × ${pr.reps}`);try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
      return;
    }
    case "kgm":case "kgp":case "rpm":case "rpp":{
      const x=w.ex[ei],s=x.sets[si],up=a[2]==="p";
      if(a[0]==="k")s.kg=Math.min(1000,Math.max(0,Math.round(((s.kg||0)+(up?1:-1)*gEx(x.id).inc)*100)/100));
      else s.reps=Math.min(200,Math.max(1,(s.reps||0)+(up?1:-1)));
      save();return render();
    }
    case "same":{
      const x=w.ex[ei],s=x.sets[si],prev=gHistory(x.id,w.t0)[0];
      const ps=prev&&(prev.sets[x.sets.slice(0,si).filter(t=>!t.w).length]||prev.sets[prev.sets.length-1]);
      if(!ps)return;s.kg=ps.kg;s.reps=ps.reps;save();return render();
    }
    case "rest":{const d=+p1;gRestSet(d&&Math.max(Date.now(),restEnd)+d*1000);gTick();return}
    case "finish":return gFinish();
    case "cancel":{
      if(!confirm("Bu antrenman kaydedilmeden silinsin mi?"))return;
      gTimStop();S.workouts=S.workouts.filter(x=>x!==w);save();gRestSet(0);render();return;
    }
    case "hist":return gSheetHist(p1);
    default:return typeof exClick==="function"&&exClick(a,p1,p2,el,w);
    case "sum":return gSheetSummary(+p1);
    case "savetpl":{
      const x=S.workouts.find(y=>y.id===+p1);if(!x)return;
      const name=(prompt("Şablon adı",x.name)||"").trim();if(!name)return;
      const t={id:S.gid++,name:name.slice(0,60),ex:x.ex.map(e=>e.id)};S.templates.push(t);x.tpl=t.id;save();closeSheet();render();toast("Şablon kaydedildi");return;
    }
    case "tdel":{
      const t=S.templates.find(x=>x.id===+p1);if(!t)return;
      if(!confirm(`"${t.name}" şablonu silinsin mi?`))return;
      S.templates=S.templates.filter(x=>x!==t);save();render();toast("Şablon silindi",()=>{S.templates.push(t);save();render()});return;
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
      const ents=S.entries.filter(e=>e.wid===x.id);
      S.workouts=S.workouts.filter(y=>y!==x);S.entries=S.entries.filter(e=>e.wid!==x.id);save();closeSheet();render();
      toast("Antrenman silindi",()=>gRestore(x,ents));return;
    }
  }
}
function gInput(t){
  const [f,ei,si]=t.dataset.gi.split(":"),w=gActive();if(!w)return;
  const s=w.ex[+ei]&&w.ex[+ei].sets[+si];if(!s)return;
  const raw=t.value.trim();
  if(f==="sec"){
    const unit=gKind(w.ex[+ei].id)==="c"?60:1,max=unit===60?120:7200;
    if(raw===""){s.sec=null}
    else{const v=num(raw,true);if(isNaN(v)||v<1||v>max){t.value=s.sec==null?"":Math.round(s.sec/unit);return toast(unit===60?"Süre 1 ile 120 dakika arasında olmalı":"Süre 1 ile 7200 saniye arasında olmalı")}s.sec=v*unit;t.value=v}
  }else if(f==="rpe"){
    if(raw===""){delete s.rpe}
    else{const v=num(raw);if(isNaN(v)||v<6||v>10||v*2!==Math.round(v*2)){t.value=s.rpe==null?"":fkg(s.rpe);return toast("Zorluk 6 ile 10 arasında, 0,5 adımla olmalı")}s.rpe=v;t.value=fkg(v)}
  }else if(f==="kg"){
    if(raw===""){s.kg=null}
    else{const v=num(raw);if(isNaN(v)||v<0||v>1000){t.value=s.kg==null?"":fkg(s.kg);return toast("Ağırlık 0 ile 1000 kg arasında olmalı")}s.kg=v;t.value=fkg(v)}
  }else{
    if(raw===""){s.reps=null}
    else{const v=num(raw,true);if(isNaN(v)||v<1||v>200){t.value=s.reps==null?"":s.reps;return toast("Tekrar 1 ile 200 arasında olmalı")}s.reps=v;t.value=v}
  }
  save();gTick();
}

/* ---- enerji ve hedef kartı (Trend) ---- */
function gEnergy(){
  const st=S.settings,wAll=weights(),days=Object.keys(wAll).sort();
  if(!days.length)return "";
  const kg=Algo.trend(wAll)[days[days.length-1]];
  if(!(st.heightCm>0&&st.age>0))return `<h2>Enerji dengesi</h2><div class="card"><p class="hint" style="padding:0 0 8px">Harcamanı ve kalori hedefini hesaplamak için boy ve yaş gerekli.</p><button class="btn ghost" data-act="profil">Profili doldur</button></div>`;
  const profile={kg,cm:st.heightCm,age:st.age,sex:st.sex||"",act:st.act};
  const intake={};for(const e of S.entries)if(e.type==="yemek"&&e.v)intake[e.day]=(intake[e.day]||0)+e.v;
  const r=Algo.adaptiveTdee({weights:wAll,intake,profile});
  if(!r.tdee)return "";
  const bmr=Algo.bmrMifflin(profile),sg=Algo.suggestTarget({tdee:r.tdee,kg,goalKg:st.goalKg,bmr,age:st.age,cm:st.heightCm,health:!!st.healthNote.trim()});
  const pr=Algo.proteinRange(kg);
  const src=r.source==="formül"?"Formül tahmini. Veri biriktikçe kendini ayarlar.":`Gerçek verinden hesaplandı, güven %${Math.round(r.confidence*100)}.`;
  const cells=[["Tahmini harcama",`${Math.round(r.tdee/10)*10} kcal`]];
  if(sg)cells.push(["Önerilen hedef",`${sg.kcal} kcal`]);
  cells.push(["Protein aralığı",`${pr[0]}–${pr[1]} g`]);
  return `<h2>Enerji dengesi</h2><div class="card"><div class="stats">${cells.map(c=>`<div class="stat"><div class="k">${c[0]}</div><div class="v num">${c[1]}</div></div>`).join("")}</div>
  <p class="hint" style="padding:8px 0 0">${src}${sg&&sg.limited?" Hedef güvenli alt sınırda tutuldu.":""}${sg&&sg.blocked?` ${esc(sg.blocked)}. Öneri bakım düzeyinde tutuldu.`:""}</p>
  ${sg&&sg.kcal!==st.kcal?`<div class="btns"><button class="btn ghost" data-act="uygula:${sg.kcal}">Hedefi ${sg.kcal} kcal yap</button></div>`:""}</div>`;
}
