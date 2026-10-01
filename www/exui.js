"use strict";
/* Egzersiz kütüphanesi arayüzü, çizgi-adam/foto ayrıntı ekranı ve süreli set zamanlayıcısı.
   gym.js ve index.html'deki S, tab, render, openSheet, closeSheet, toast, esc, tr, gEx, gActive, gAddEx, gStart, gClock ile çalışır. */
let gLQ="",gLReg="Tümü",gLCat="Tümü",gLEq="Tümü",gLN=40;
const EXCAT={g:"Güç",e:"Esneme",k:"Kardiyo",p:"Pliyometrik"},EXKIND={w:"Ağırlık × tekrar",b:"Tekrar (vücut ağırlığı)",t:"Süreli tutuş",i:"Aralıklı (tur)",c:"Süre (dakika)"};

function exDef(e){
  const d=Object.assign({},FigTpl[e.tp]);if(!d.frames)return null;
  if(e.o)d.o=e.o;
  if(e.pr==="-")delete d.prop;
  else if(e.pr)d.prop={k:e.pr.split("@")[0],at:e.pr.split("@")[1]==="sh"?"shoulder":"wrist"};
  return d;
}
const exFig=(e,anim)=>{const d=exDef(e);return d?FigLib.svg(d,{anim,label:e.n}):""};

/* ---- kütüphane ekranı ---- */
function exFiltered(){
  const q=tr(gLQ);
  return gExAll().filter(e=>(gLReg==="Tümü"||(e.r||e.g)===gLReg)&&(gLCat==="Tümü"||EXCAT[e.c]===gLCat)&&(gLEq==="Tümü"||e.q===gLEq)&&(!q||tr(e.n).includes(q)));
}
function exListHtml(){
  const all=exFiltered(),list=all.slice(0,gLN);
  return `<p class="hint" style="padding:0 0 6px">${all.length} egzersiz</p>`+list.map(e=>`<button class="prow exrow" data-g="exinfo:${e.id}"><span class="exthumb" aria-hidden="true">${e.tp?exFig(e,false):""}</span><span style="flex:1;min-width:0"><b>${esc(e.n)}</b><span class="mut sm">${e.r||e.g}${e.q?" · "+e.q.toLowerCase():""}${e.l?" · "+e.l.toLowerCase():""}</span></span><span class="plus">›</span></button>`).join("")
    +(all.length>list.length?`<button class="lnk" data-g="lmore">${all.length-list.length} egzersiz daha göster</button>`:"")+(all.length?"":`<p class="hint">Sonuç yok.</p>`);
}
const exChips=(arr,cur,act)=>arr.map(x=>`<button class="chip" data-g="${act}:${x}" aria-pressed="${x===cur}">${x}</button>`).join("");
function viewEgz(){
  return `<button class="btn" data-g="lback" style="margin:0 0 12px">‹ Salon</button>
  <input class="in" id="glq" placeholder="Egzersiz ara" autocomplete="off" value="${esc(gLQ)}">
  <div class="chips" id="glreg" style="margin-top:10px">${exChips(["Tümü"].concat(EXREG),gLReg,"lreg")}</div>
  <div class="chips" id="glcat">${exChips(["Tümü","Güç","Esneme","Kardiyo","Pliyometrik"],gLCat,"lcat")}</div>
  <div class="chips" id="gleq">${exChips(["Tümü","Ağırlıksız","Ev tipi","Salon"],gLEq,"leq")}</div>
  <div id="gllist" class="plist">${exListHtml()}</div>
  <p class="hint">Hareketler genel bilgi amaçlıdır, kişisel antrenman ya da tıbbi tavsiye değildir. Fotoğraflar free-exercise-db (kamu malı) kaynaklıdır.</p>`;
}
const exRefreshChips=()=>{
  for(const [id,arr,cur,act] of [["glreg",["Tümü"].concat(EXREG),gLReg,"lreg"],["glcat",["Tümü","Güç","Esneme","Kardiyo","Pliyometrik"],gLCat,"lcat"],["gleq",["Tümü","Ağırlıksız","Ev tipi","Salon"],gLEq,"leq"]]){const el=$("#"+id);if(el)el.innerHTML=exChips(arr,cur,act)}
  const l=$("#gllist");if(l)l.innerHTML=exListHtml();
};

/* ---- ayrıntı ekranı ---- */
function exHistLine(e){
  const h=gHistory(e.id).slice(0,3);if(!h.length)return "";
  const t=gTimed(e.id);
  return `<div class="mut sm" style="margin:8px 0">Son: ${h.map(x=>`${gDate(x.w.day)} ${t?x.sets.map(s=>s.sec).join("/")+" sn":x.sets.map(s=>(s.kg?fkg(s.kg)+"×":"")+s.reps).join(", ")}`).join(" · ")}</div>`;
}
function exSheet(id){
  const e=gEx(id),d=e.tp?exDef(e):null;
  const photos=e.im>0?`<span class="exph" aria-hidden="true"><img src="ex/${e.id}/0.webp" alt="" loading="lazy">${e.im>1?`<img class="b" src="ex/${e.id}/1.webp" alt="" loading="lazy">`:""}</span>`:"";
  const cues=(EXCUE[e.tp]||[]).map(c=>`<li>${esc(c)}</li>`).join("");
  const w=gActive(),inW=w&&w.ex.some(x=>x.id===id);
  openSheet(`<h3>${esc(e.n)}</h3><div class="mut sm">${e.r||e.g}${e.q?" · "+e.q:""}${e.l?" · "+e.l:""}${e.c?" · "+EXCAT[e.c]:""}</div>
  ${d||photos?`<div class="exvis">${d?`<div class="exfig">${FigLib.svg(d,{anim:true,label:e.n})}</div>`:""}${photos}</div>`:""}
  ${cues?`<ul class="cues">${cues}</ul>`:""}
  <div class="mut sm">Kayıt türü: ${EXKIND[e.k||"w"]}</div>${exHistLine(e)}
  <div class="btns" style="margin-top:12px"><button class="btn" data-g="exadd:${id}">${inW?"Antrenmanda ekli":"Antrenmana ekle"}</button><button class="btn ghost" data-g="closesheet">Kapat</button></div>`);
}
function gSheetHistSimple(exId,h){
  const ex=gEx(exId),t=gTimed(exId);
  openSheet(`<h3>${esc(ex.n)}</h3>${h.length?`<table><thead><tr><th>Tarih</th><th>Setler</th></tr></thead><tbody>${h.slice(0,8).map(x=>`<tr><td>${gDate(x.w.day)}</td><td class="num">${t?x.sets.map(s=>exKindSec(exId,s.sec)).join(" · "):x.sets.map(s=>(s.kg?fkg(s.kg)+" × ":"")+s.reps).join(" · ")}</td></tr>`).join("")}</tbody></table>`:`<p class="hint">Henüz tamamlanmış set yok.</p>`}<button class="btn" data-g="closesheet">Kapat</button>`);
}
const exKindSec=(id,sec)=>gKind(id)==="c"?Math.round(sec/60)+" dk":sec+" sn";

/* ---- süreli set zamanlayıcısı ---- */
const LNP=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.LocalNotifications;
async function gNotify(at,title,body){
  const ln=LNP();if(!ln)return;
  try{await ln.cancel({notifications:[{id:9001}]});await ln.schedule({notifications:[{id:9001,title,body,schedule:{at:new Date(at),allowWhileIdle:true}}]})}catch(e){}
}
async function gNotifyCancel(){const ln=LNP();if(ln)try{await ln.cancel({notifications:[{id:9001}]})}catch(e){}}
function gTimStop(){if(gTim){gTim=null;gNotifyCancel()}}
function gTimStart(ei,si){
  const w=gActive();if(!w)return;
  const x=w.ex[ei],s=x&&x.sets[si];if(!s)return;
  if(gTim&&gTim.ei===ei&&gTim.si===si&&gTim.phase==="work"){gTimStop();return render()}
  if(!(s.sec>0))return toast("Önce süreyi yaz");
  gTimStop();restEnd=0;
  gTim={ei,si,end:Date.now()+s.sec*1000,total:s.sec,phase:"work"};
  gNotify(gTim.end,"⏱ Süre doldu",gEx(x.id).n);
  render();exTick();
}
function gTimBar(){
  const t=gTim;
  if(!t)return `<div class="rest tim" id="gtim" hidden><div><span class="mut" id="gtl"></span><b class="num" id="gtv"></b></div><button data-g="tadd:-10">−10</button><button data-g="tadd:10">+10</button><button data-g="tstop">Bitir</button></div>`;
  return `<div class="rest tim" id="gtim"><div><span class="mut" id="gtl">${exTimLabel()}</span><b class="num" id="gtv">${gClock(t.end-Date.now())}</b></div><button data-g="tadd:-10">−10</button><button data-g="tadd:10">+10</button><button data-g="tstop">${t.phase==="rest"?"Atla":"Bitir"}</button></div>`;
}
function exTimLabel(){
  const t=gTim,w=gActive(),x=w&&w.ex[t.ei];
  return t.phase==="rest"?"Dinlenme":`${x?gEx(x.id).n:""}, ${t.si+1}. set`;
}
function gTimDone(skip){
  const w=gActive(),t=gTim;gTim=null;
  if(!w||!t)return;
  const x=w.ex[t.ei],s=x&&x.sets[t.si];if(!s)return;
  if(!skip)try{navigator.vibrate&&navigator.vibrate([300,120,300,120,300])}catch(e){}
  const kind=gKind(x.id);
  if(t.phase==="work"){
    s.done=true;save();
    const nx=x.sets[t.si+1];
    if(kind==="i"&&nx&&!nx.done&&nx.sec>0){
      gTim={ei:t.ei,si:t.si+1,end:Date.now()+20000,total:20,phase:"rest"};
      gNotify(gTim.end,"Sıradaki tur başlıyor",gEx(x.id).n);
    }else{gNotifyCancel();if(kind!=="c")restEnd=Date.now()+30000}
    toast(`${gEx(x.id).n}: ${t.si+1}. set tamamlandı`);
  }else{
    const nx=x.sets[t.si];
    if(nx&&!nx.done&&nx.sec>0){gTim={ei:t.ei,si:t.si,end:Date.now()+nx.sec*1000,total:nx.sec,phase:"work"};gNotify(gTim.end,"⏱ Süre doldu",gEx(x.id).n)}
    else gNotifyCancel();
  }
  render();
}
function exTick(){
  const bar=$("#gtim");if(!bar)return;
  const t=gTim;
  if(!t){bar.hidden=true;return}
  if(tab!=="salon"||!gActive()){return}
  const left=t.end-Date.now();
  if(left<=0)return gTimDone();
  bar.hidden=false;$("#gtl").textContent=exTimLabel();$("#gtv").textContent=gClock(left);
}
setInterval(exTick,1000);

/* ---- plaka ve ısınma ---- */
const exPlateIn=()=>({kg:num($("#pk").value),bar:num($("#pb").value)});
function exPlateCalc(){
  const {kg,bar}=exPlateIn(),box=$("#pres");
  if(!(kg>0&&bar>=5&&bar<=50)){box.innerHTML=`<p class="hint">Hedef kg ve bar ağırlığı yaz (bar 5-50 kg).</p>`;return}
  if(S.bar!==bar){S.bar=bar;save()}
  const p=Algo.plates(kg,bar),wu=Algo.warmup(kg,bar);
  box.innerHTML=`<div class="stat"><div class="k">Bir tarafa</div><div class="v num">${p.side.join(" + ")||"yalnız bar"} kg</div></div>
  ${p.made!==kg?`<p class="hint">Tam yapılamıyor, en yakın: ${fkg(p.made)} kg</p>`:""}
  ${wu.length?`<div class="lbl">Isınma</div><div class="num">${wu.map(x=>`${fkg(x.kg)} × ${x.reps}`).join(", ")}</div>`:""}`;
}
function exPlateSheet(ei){
  const x=gActive().ex[ei],sug=gSuggest(x.id),w=x.sets.find(s=>!s.w&&s.kg>0),kg=w?w.kg:sug?sug.kg:"";
  openSheet(`<h3>${esc(gEx(x.id).n)}</h3><div class="lbl">Hedef ağırlık (kg)</div><input class="in num" id="pk" inputmode="decimal" value="${fkg(kg)}">
  <div class="lbl">Bar (kg)</div><input class="in num" id="pb" inputmode="decimal" value="${fkg(S.bar)}"><div id="pres"></div>
  <div class="btns"><button class="btn" data-g="wadd:${ei}">Isınmayı antrenmana ekle</button><button class="btn ghost" data-g="closesheet">Kapat</button></div>`);
  $("#pk").oninput=$("#pb").oninput=exPlateCalc;exPlateCalc();
}
function exWarmAdd(ei){
  const {kg,bar}=exPlateIn(),x=gActive().ex[ei],wu=Algo.warmup(kg,bar);
  if(!wu.length)return toast("Isınma için hedef barın üstünde olmalı");
  x.sets=wu.map(t=>({kg:t.kg,reps:t.reps,done:false,w:true})).concat(x.sets.filter(s=>!(s.w&&!s.done)));
  save();closeSheet();render();toast("Isınma setleri eklendi");
}

/* ---- tıklamalar (gClick'in bilinmeyen eylemleri) ---- */
function exClick(a,p1,p2,el,w){
  const ei=+p1;
  switch(a){
    case "lib":tab="egz";return render();
    case "lback":tab="salon";return render();
    case "lreg":gLReg=p1;gLN=40;return exRefreshChips();
    case "lcat":gLCat=p1;gLN=40;return exRefreshChips();
    case "leq":gLEq=p1;gLN=40;return exRefreshChips();
    case "lmore":gLN+=60;{const l=$("#gllist");if(l)l.innerHTML=exListHtml()}return;
    case "exinfo":return exSheet(p1);
    case "exadd":{
      let wk=gActive();
      if(!wk){gStart(null);wk=gActive()}
      if(!wk)return;
      if(wk.ex.some(x=>x.id===p1)){closeSheet();tab="salon";return render()}
      gAddEx(wk,p1);save();closeSheet();tab="salon";render();toast(`${gEx(p1).n} antrenmana eklendi`);return;
    }
    case "plate":return exPlateSheet(ei);
    case "wadd":return exWarmAdd(ei);
    case "tstart":return gTimStart(+p1,+p2);
    case "tstop":{
      if(!gTim)return;
      if(gTim.phase==="rest"){gTimDone(true);return}
      gTimDone(true);return;
    }
    case "tadd":{
      if(!gTim)return;
      const d=+p1*1000;gTim.end=Math.max(Date.now()+1000,gTim.end+d);gNotify(gTim.end,"⏱ Süre doldu","");exTick();return;
    }
  }
}
