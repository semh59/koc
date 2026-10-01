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
let gTim=null,gPickMax=40,restEnd=0,gQuery="",gGroup="Tümü",gNew=false,gNewGroup="Bacak";

/* Kütüphane (exlib.js) + eski 16 egzersiz: eski kimlikler ve adlar aynen korunur, kütüphane alanları (bölge, tür, şekil) eklenir. */
const EXREG=["Göğüs","Sırt","Omuz","Biseps","Triseps","Ön kol","Karın","Bel","Kalça","Ön bacak","Arka bacak","Baldır","İç-dış bacak","Trapez","Boyun","Tüm vücut"];
const EXMERGED=(()=>{
  const old=new Map(EXLIB.map(e=>[e.id,e])),out=(typeof EXDB!=="undefined"?EXDB:[]).map(x=>old.has(x.id)?Object.assign({},x,old.get(x.id)):x);
  for(const e of EXLIB)if(!out.some(x=>x.id===e.id))out.push(e);
  return out;
})();
const gExAll=()=>EXMERGED.concat(S.customEx);
const gKind=id=>gEx(id).k||"w";
const gTimed=id=>"tic".includes(gKind(id));
const gSetOk=s=>!s.w&&(s.reps>0||s.sec>0); // w: ısınma seti, hiçbir hesaba girmez
const gEx=id=>gExAll().find(e=>e.id===id)||{id,n:"Silinmiş egzersiz",g:"Diğer",inc:2.5};
const gActive=()=>S.workouts.find(w=>w.t1==null)||null;
const gDone=w=>w.t1!=null;
const fkg=x=>x==null||x===""?"":String(Math.round(x*100)/100).replace(".",",");

/* ---- doğrulama (yükleme ve geri yükleme için) ---- */
function cleanGym(r){
  const out={workouts:[],templates:[],customEx:[],gid:1,bar:r.bar>=5&&r.bar<=50?+r.bar:20,exCfg:{}};
  const idOk=x=>Number.isInteger(x)&&x>0;
  let maxId=0;
  const ce=Array.isArray(r.customEx)?r.customEx:[];
  for(const e of ce){
    if(!e||typeof e.id!=="string"||!/^c\d+$/.test(e.id)||typeof e.n!=="string"||!GROUPS.includes(e.g))continue;
    out.customEx.push({id:e.id,n:e.n.slice(0,60),g:e.g,inc:2.5});maxId=Math.max(maxId,+e.id.slice(1));
  }
  const known=new Set(EXMERGED.map(e=>e.id).concat(out.customEx.map(e=>e.id)));
  const cfg=r.exCfg&&typeof r.exCfg==="object"?r.exCfg:{};
  for(const id of Object.keys(cfg)){
    const c=cfg[id];
    if(known.has(id)&&c&&Number.isInteger(c.lo)&&c.lo>=1&&c.lo<=30&&Number.isInteger(c.hi)&&c.hi>c.lo&&c.hi<=50)out.exCfg[id]={lo:c.lo,hi:c.hi};
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
    out.templates.push({id:t.id,name:t.name.slice(0,60),ex:t.ex.filter(i=>known.has(i))});maxId=Math.max(maxId,t.id);
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
  const h=gHistory(exId)[0];if(!h)return null;
  return Algo.nextTarget(h.sets,Object.assign({lo:8,hi:12,inc:gEx(exId).inc},S.exCfg[exId]));
}
const GSEC={t:30,i:30,c:600};
function gAddEx(w,exId){
  const kind=gKind(exId);
  if(kind==="t"||kind==="i"||kind==="c"){
    const h=gHistory(exId)[0],sec=h&&h.sets[0].sec||GSEC[kind],sets=[];
    for(let i=0;i<(kind==="c"?1:h?Math.min(h.sets.length,6):kind==="i"?4:3);i++)sets.push({kg:null,reps:null,sec,done:false});
    w.ex.push({id:exId,note:"",sets});return;
  }
  const h=gHistory(exId)[0],sug=gSuggest(exId);
  const n=h?Math.min(Math.max(h.sets.length,1),6):3,sets=[];
  for(let i=0;i<n;i++)sets.push({kg:sug?sug.kg:null,reps:sug?sug.reps:null,done:false});
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
    return `<div class="card trow"><button class="tmain" data-g="start:${t.id}"><b>${esc(t.name)}</b><span class="mut">${esc(t.ex.map(i=>gEx(i).n).join(", ")||"Egzersiz yok")}</span><span class="mut">${last?"Son: "+gDate(last.day):"Henüz yapılmadı"}</span></button><button class="del" data-g="tdel:${t.id}" aria-label="Şablonu sil">✕</button></div>`;
  }).join("");
  const wk=gWeekSets(),mx=Math.max(14,...Object.values(wk));
  const bars=Object.keys(wk).length?`<h2>Bu hafta, kas grubuna göre set</h2><div class="card">${GROUPS.concat(["Diğer"]).filter(g=>wk[g]).map(g=>`<div class="gbar"><span>${g}</span><span class="bar"><i style="width:${(wk[g]/mx*100).toFixed(0)}%"></i></span><span class="num">${wk[g]}</span></div>`).join("")}<p class="hint">Kas grubu başına haftada 10 ile 20 set çoğu kişi için makul bir aralıktır.</p></div>`:"";
  const rec=done.slice(0,8).map(x=>`<button class="rrow" data-g="sum:${x.id}"><span class="num mut">${gDate(x.day)}</span><span class="tx">${esc(x.name)}</span><span class="num mut">${Math.round(gWorkVol(x)).toLocaleString("tr-TR")} kg</span></button>`).join("");
  return `<button class="btn" data-g="start:">Boş antrenman başlat</button>
  <button class="btn ghost" data-g="lib" style="margin-top:8px">📚 Egzersiz kütüphanesi (${EXMERGED.length}, animasyonlu)</button>
  <h2>Şablonlarım</h2>${tpl||`<p class="hint">Şablon yok. Bir antrenmanı bitirince "Şablon olarak kaydet" ile oluşur.</p>`}
  ${bars}
  <h2>Son antrenmanlar</h2><div class="card">${rec||`<p class="hint">Henüz antrenman yok.</p>`}</div>`;
}
function gLive(w){
  const cards=w.ex.map((x,ei)=>{
    const ex=gEx(x.id),prev=gHistory(x.id,w.t0)[0],sug=gSuggest(x.id);
    const kind=gKind(x.id),tm=kind==="t"||kind==="i"||kind==="c",unit=kind==="c"?60:1;
    let wi=0;
    const rows=x.sets.map((s,si)=>{
      const ps=!s.w&&prev&&prev.sets[wi++],p=s.w?"ısınma":!ps?"–":tm?`${kind==="c"?Math.round(ps.sec/60)+" dk":ps.sec+" sn"}`:`${ps.kg?fkg(ps.kg)+" × ":""}${ps.reps}`;
      const tick=`<button class="ok${s.done?" on":""}" data-g="done:${ei}:${si}" aria-label="${si+1}. set ${s.done?"geri al":"tamamlandı"}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>`;
      if(tm)return `<div class="srow${s.done?" dn":""}"><span class="sn">${si+1}</span><span class="sp num">${p}</span>
      <input class="sin num" inputmode="numeric" aria-label="${si+1}. set ${kind==="c"?"dakika":"saniye"}" data-gi="sec:${ei}:${si}" value="${s.sec==null?"":Math.round(s.sec/unit)}" placeholder="${kind==="c"?"dk":"sn"}">
      <button class="sin tgo" data-g="tstart:${ei}:${si}" aria-label="${si+1}. set zamanlayıcıyı başlat">${gTim&&gTim.ei===ei&&gTim.si===si?"⏸":"▶"}</button>${tick}</div>`;
      return `<div class="srow${s.done?" dn":""}"><span class="sn">${si+1}</span><span class="sp num">${p}</span>
      <input class="sin num" inputmode="decimal" aria-label="${si+1}. set kg" data-gi="kg:${ei}:${si}" value="${s.kg==null?"":fkg(s.kg)}" placeholder="${kind==="b"?"ek kg":"kg"}">
      <input class="sin num" inputmode="numeric" aria-label="${si+1}. set tekrar" data-gi="reps:${ei}:${si}" value="${s.reps==null?"":s.reps}" placeholder="tek">${tick}</div>`;
    }).join("");
    return `<div class="card ex"><div class="exh"><button class="exn" data-g="hist:${x.id}"><b>${esc(ex.n)}</b><span class="mut">${ex.r||ex.g}</span></button><button class="del" data-g="exinfo:${x.id}" aria-label="Egzersiz bilgisi">ⓘ</button><button class="del" data-g="menu:${ei}" aria-label="Egzersiz menüsü">⋮</button></div>
    ${sug?`<div class="sug">Öneri: ${fkg(sug.kg)||0} kg × ${sug.reps}. ${sug.why}.</div>`:""}${x.note?`<div class="note">${esc(x.note)}</div>`:""}
    <div class="shead"><span>Set</span><span>Önceki</span>${tm?`<span>${kind==="c"?"Dakika":"Süre (sn)"}</span><span>Süre</span>`:`<span>${kind==="b"?"Ek kg":"kg"}</span><span>Tekrar</span>`}<span></span></div>${rows}
    <button class="lnk" data-g="addset:${ei}">Set ekle</button></div>`;
  }).join("");
  return `<div class="livebar"><div><b>${esc(w.name)}</b><div class="mut num" id="gstat">${gClock(Date.now()-w.t0)} süre, ${Math.round(gWorkVol(w)).toLocaleString("tr-TR")} kg hacim</div></div><button class="btn fin" data-g="finish">Bitir</button></div>
  ${gTimBar()}
  <div class="rest" id="grest" hidden><div><span class="mut">Dinlenme</span><b class="num" id="gr"></b></div><button data-g="rest:-15">−15</button><button data-g="rest:15">+15</button><button data-g="rest:0">Atla</button></div>
  ${cards||`<p class="hint">Henüz egzersiz yok. Aşağıdan ekle.</p>`}
  <button class="btn ghost" data-g="pick">Egzersiz ekle</button>
  <button class="lnk dng" data-g="cancel">Antrenmanı iptal et</button>`;
}
function gTick(){
  const w=gActive();if(!w||tab!=="salon")return;
  const st=$("#gstat");if(st)st.textContent=`${gClock(Date.now()-w.t0)} süre, ${Math.round(gWorkVol(w)).toLocaleString("tr-TR")} kg hacim`;
  const r=$("#grest");if(!r)return;
  const left=restEnd-Date.now();
  if(left>0){r.hidden=false;$("#gr").textContent=gClock(left)}
  else{
    if(restEnd&&!r.hidden){try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
    r.hidden=true;restEnd=0;
  }
}

/* ---- alt sayfalar ---- */
function gPickHtml(){
  const q=tr(gQuery),w=gActive();
  const all=gExAll().filter(e=>(gGroup==="Tümü"||(e.r||e.g)===gGroup)&&(!q||tr(e.n).includes(q))),list=all.slice(0,gPickMax);
  const inW=new Set(w?w.ex.map(x=>x.id):[]);
  return list.map(e=>{
    const h=gHistory(e.id)[0],last=h?(gTimed(e.id)?`son ${h.sets[0].sec} sn`:`son ${fkg(Math.max(...h.sets.map(s=>s.kg||0)))||0} kg × ${h.sets[0].reps}`):"henüz yok";
    return `<button class="prow" data-g="addex:${e.id}"><span><b>${esc(e.n)}</b><span class="mut sm">${e.r||e.g}${e.q?", "+e.q.toLowerCase():""}, ${last}</span></span>${inW.has(e.id)?`<span class="tag">Eklendi</span>`:`<span class="plus">+</span>`}</button>`;
  }).join("")+(all.length>list.length?`<button class="lnk" data-g="pickmore">${all.length-list.length} egzersiz daha göster</button>`:"")||`<p class="hint">Sonuç yok.</p>`;
}
function gSheetPick(){
  gQuery="";gGroup="Tümü";gNew=false;gPickMax=40;
  openSheet(`<h3>Egzersiz ekle</h3><input class="in" id="gq" placeholder="Egzersiz ara" autocomplete="off">
  <div class="chips" id="gchips">${["Tümü"].concat(EXREG).map(g=>`<button class="chip" data-g="grp:${g}" aria-pressed="${g==="Tümü"}">${g}</button>`).join("")}</div>
  <div id="glist" class="plist">${gPickHtml()}</div>
  <button class="lnk" data-g="newex">Yeni egzersiz oluştur</button><div id="gnew"></div>
  <button class="btn" data-g="closesheet">Tamam</button>`);
}
function gMenu(ei){
  const w=gActive(),x=w.ex[ei];
  openSheet(`<h3>${esc(gEx(x.id).n)}</h3><div class="plist">
   <button class="prow" data-g="note:${ei}"><span><b>Egzersiz notu</b><span class="mut sm">Örn. bar yüksekliği, ağrı</span></span></button>
   ${gKind(x.id)==="w"?`<button class="prow" data-g="plate:${ei}"><span><b>Plaka ve ısınma</b><span class="mut sm">Bar başına plaka, ısınma setleri</span></span></button>`:""}
   ${gKind(x.id)==="w"?`<button class="prow" data-g="rng:${ei}"><span><b>Tekrar aralığı</b><span class="mut sm">${(c=>c.lo+"-"+c.hi)(Object.assign({lo:8,hi:12},S.exCfg[x.id]))}, öneri bu aralığa göre</span></span></button>`:""}
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
  const pts=per.slice(0,12).reverse().map((p,i)=>({i,v:p.e}));
  openSheet(`<h3>${esc(ex.n)}</h3><div class="two"><div class="stat"><div class="k">En iyi set</div><div class="v num">${fkg(best.top.kg)||0} kg × ${best.top.reps}</div></div><div class="stat"><div class="k">Tahmini 1TM</div><div class="v num">${Math.round(best.e)} kg</div></div></div>
  ${pts.length>1?`<div class="sparkbox" style="color:var(--spor)">${spark(pts)}</div>`:""}
  <p class="hint">1TM, setten hesaplanan bir tahmindir (Epley), gerçek bir 1 tekrar denemesi değildir.</p>
  <table><thead><tr><th>Tarih</th><th>En iyi set</th><th>Hacim</th></tr></thead><tbody>${per.slice(0,6).map(p=>`<tr><td>${gDate(p.d)}</td><td class="num">${fkg(p.top.kg)||0} × ${p.top.reps}</td><td class="num">${Math.round(p.vol).toLocaleString("tr-TR")} kg</td></tr>`).join("")}</tbody></table>
  <button class="btn" data-g="closesheet">Kapat</button>`);
}
function gSheetSummary(id){
  const w=S.workouts.find(x=>x.id===id);if(!w)return;
  const prs=gPRs(w),sets={};
  for(const x of w.ex)sets[gEx(x.id).g]=(sets[gEx(x.id).g]||0)+x.sets.filter(s=>s.done&&gSetOk(s)).length;
  openSheet(`<h3>${esc(w.name)}</h3><div class="mut sm">${gDate(w.day)}, ${gDur(w)} dk</div>
  <div class="sumv num">${Math.round(gWorkVol(w)).toLocaleString("tr-TR")} <small>kg hacim</small></div>
  <div class="two"><div class="stat"><div class="k">Set</div><div class="v num">${gWorkSets(w)}</div></div><div class="stat"><div class="k">Egzersiz</div><div class="v num">${w.ex.length}</div></div></div>
  ${prs.length?`<div class="pr"><b>${prs.length} yeni rekor</b>${prs.map(p=>`<div>${esc(p.ex.n)}, ${fkg(p.kg)||0} kg × ${p.reps}<div class="mut sm">Tahmini 1TM ${Math.round(p.e1)} kg, önceki ${Math.round(p.prev)} kg</div></div>`).join("")}</div>`:""}
  <div class="mut sm" style="margin:8px 0">${Object.keys(sets).map(g=>`${g} ${sets[g]}`).join(", ")}</div>
  <div class="btns">${w.tpl==null?`<button class="btn ghost" data-g="savetpl:${w.id}">Şablon olarak kaydet</button>`:""}<button class="btn ghost" data-g="closesheet">Kapat</button><button class="btn danger" data-g="delw:${w.id}">Antrenmanı sil</button></div>`);
}

/* ---- eylemler ---- */
function gStart(tplId){
  if(gActive()){tab="salon";return render()}
  const t=tplId?S.templates.find(x=>x.id===tplId):null;
  const w={id:S.gid++,day:dayKey(),t0:Date.now(),t1:null,name:t?t.name:"Antrenman",tpl:t?t.id:null,ex:[]};
  if(t)for(const i of t.ex)gAddEx(w,i);
  S.workouts.push(w);save();tab="salon";render();
}
function gFinish(){
  const w=gActive();if(!w)return;
  gTimStop();
  const open=w.ex.reduce((s,x)=>s+x.sets.filter(t=>!t.done&&gSetOk(t)).length,0);
  if(open&&!confirm(`${open} set tamamlanmadı olarak işaretli. Bunlar sayılmadan bitirilsin mi?`))return;
  for(const x of w.ex)x.sets=x.sets.filter(s=>s.done);
  w.ex=w.ex.filter(x=>x.sets.length);
  if(!w.ex.length){S.workouts=S.workouts.filter(x=>x!==w);save();restEnd=0;render();return toast("Tamamlanan set yok, antrenman kaydedilmedi")}
  w.t1=Date.now();
  const e=add("spor",gDur(w),`Ağırlık, ${w.name}`,w.day);e.wid=w.id;
  save();restEnd=0;render();gSheetSummary(w.id);
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
    case "pickmore":gPickMax+=60;$("#glist").innerHTML=gPickHtml();return;
    case "grp":gGroup=p1;gPickMax=40;document.querySelectorAll("#gchips .chip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.g==="grp:"+gGroup));$("#glist").innerHTML=gPickHtml();return;
    case "addex":{
      if(!w)return;const i=w.ex.findIndex(x=>x.id===p1);
      if(i>=0)return toast("Bu egzersiz zaten ekli");
      gAddEx(w,p1);save();$("#glist").innerHTML=gPickHtml();render();return;
    }
    case "newex":gNew=!gNew;$("#gnew").innerHTML=gNew?`<div class="card" style="margin-top:8px"><input class="in" id="gnn" placeholder="Egzersiz adı" maxlength="60"><div class="lbl">Kas grubu</div><div class="chips" id="gng">${GROUPS.map(g=>`<button class="chip" data-g="ng:${g}" aria-pressed="${g===gNewGroup}">${g}</button>`).join("")}</div><button class="btn" data-g="mkex">Oluştur ve ekle</button></div>`:"";return;
    case "ng":gNewGroup=p1;document.querySelectorAll("#gng .chip").forEach(c=>c.setAttribute("aria-pressed",c.dataset.g==="ng:"+gNewGroup));return;
    case "mkex":{
      const n=$("#gnn").value.trim();if(!n)return toast("Egzersiz adı yaz");
      if(gExAll().some(e=>tr(e.n)===tr(n)))return toast("Bu adda egzersiz var");
      const ex={id:"c"+(S.gid++),n,g:gNewGroup,inc:2.5};S.customEx.push(ex);
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
        if(!s.done){if(!(s.sec>0))return toast("Önce süreyi yaz");s.done=true;if(gTim&&gTim.ei===ei&&gTim.si===si)gTimStop();restEnd=Date.now()+(gKind(w.ex[ei].id)==="c"?0:30000)}
        else s.done=false;
        save();render();gTick();return;
      }
      const kg=num(row.querySelector("[data-gi^=kg]").value),reps=num(row.querySelector("[data-gi^=reps]").value,true);
      let pr=null;
      if(!s.done){
        if(!(reps>0&&reps<=200))return toast("Önce tekrar sayısını yaz");
        s.kg=isNaN(kg)?0:kg;s.reps=reps;s.done=true;restEnd=Date.now()+REST_SEC*1000;
        pr=!s.w&&gNewPR(w,w.ex[ei].id,s);
      }else s.done=false;
      save();render();gTick();
      if(pr){toast(`Yeni rekor: ${pr.ex.n}, ${fkg(pr.kg)||0} kg × ${pr.reps}`);try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}}
      return;
    }
    case "rest":{const d=+p1;if(d===0)restEnd=0;else restEnd=Math.max(Date.now(),restEnd)+d*1000;gTick();return}
    case "finish":return gFinish();
    case "cancel":{
      if(!confirm("Bu antrenman kaydedilmeden silinsin mi?"))return;
      gTimStop();S.workouts=S.workouts.filter(x=>x!==w);save();restEnd=0;render();return;
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
      S.templates=S.templates.filter(x=>x!==t);save();render();toast("Şablon silindi",()=>{S.templates.push(t);save();render()});return;
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
  const slope=Algo.slopePerWeek(wAll),eta=sg&&sg.blocked?null:Algo.etaWeeks(kg,st.goalKg,slope),pr=Algo.proteinRange(kg);
  const src=r.source==="formül"?"Formül tahmini. Veri biriktikçe kendini ayarlar.":`Gerçek verinden hesaplandı, güven %${Math.round(r.confidence*100)}.`;
  const cells=[["Tahmini harcama",`${Math.round(r.tdee/10)*10} kcal`]];
  if(slope!=null)cells.push(["Kilo hızı",`${fmtS(slope,2)} kg/hafta`]);
  if(sg)cells.push(["Önerilen hedef",`${sg.kcal} kcal`]);
  cells.push(["Protein aralığı",`${pr[0]}–${pr[1]} g`]);
  if(eta)cells.push(["Hedefe tahmini",`~${eta} hafta`]);
  return `<h2>Enerji dengesi</h2><div class="card"><div class="stats">${cells.map(c=>`<div class="stat"><div class="k">${c[0]}</div><div class="v num">${c[1]}</div></div>`).join("")}</div>
  <p class="hint" style="padding:8px 0 0">${src}${sg&&sg.limited?" Hedef güvenli alt sınırda tutuldu.":""}${sg&&sg.blocked?` ${esc(sg.blocked)}. Öneri bakım düzeyinde tutuldu.`:""}</p>
  ${sg&&sg.kcal!==st.kcal?`<div class="btns"><button class="btn ghost" data-act="uygula:${sg.kcal}">Hedefi ${sg.kcal} kcal yap</button></div>`:""}</div>`;
}
