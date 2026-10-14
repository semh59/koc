"use strict";
/* Exercise library UI, stick-figure/photo detail sheet and the timed-set timer. Works with gym.js and the main-shell helpers. */
let gLQ="",gLReg="Tümü",gLCat="Tümü",gLEq="Tümü",gLN=40;
const EXCAT={g:"Güç",e:"Esneme",k:"Kardiyo",p:"Pliyometrik",d:"Denge"},EXKIND={w:"Ağırlık × tekrar",b:"Tekrar (vücut ağırlığı)",t:"Süreli tutuş",i:"Aralıklı (tur)",c:"Süre (dakika)"};

function exDef(e){
  const d=Object.assign({},FigTpl[e.tp]);if(!d.frames)return null;
  if(e.o)d.o=e.o;
  if(e.pr==="-")delete d.prop;
  else if(e.pr)d.prop={k:e.pr.split("@")[0],at:e.pr.split("@")[1]==="sh"?"shoulder":"wrist"};
  return d;
}
const exFig=(e,anim)=>{const d=exDef(e);return d?FigLib.svg(d,{anim,label:e.n}):""};

/* ---- library screen ---- */
function exFiltered(){
  const q=tr(gLQ);
  return gExAll().filter(e=>(gLReg==="Tümü"||(e.r||e.g)===gLReg)&&(gLCat==="Tümü"||EXCAT[e.c]===gLCat)&&(gLEq==="Tümü"||e.q===gLEq)&&(!q||tr(e.n).includes(q)));
}
function exListHtml(){
  const all=exFiltered(),list=all.slice(0,gLN);
  return (gLQ||exFilterN()?`<p class="hint flush">${all.length} sonuç</p>`:"")+list.map(e=>`<button class="prow exrow" data-g="exinfo:${e.id}"><span class="exthumb" aria-hidden="true">${e.tp?exFig(e,false):""}</span><span class="grow"><b>${esc(e.n)}</b><span class="mut sm">${e.r||e.g}${e.q?" · "+e.q.toLowerCase():""}${e.l?" · "+exLv(e.l):""}</span></span><span class="plus">›</span></button>`).join("")
    +(all.length>list.length?`<button class="lnk" data-g="lmore">Daha fazla göster</button>`:"")+(all.length?"":`<p class="hint">Eşleşen hareket yok. Başka bir ad dene ya da filtreleri temizle.</p>`);
}
const exChips=(arr,cur,act)=>arr.map(x=>`<button class="chip" data-g="${act}:${x}" aria-pressed="${x===cur}">${x}</button>`).join("");
/* A bare level ("başlangıç") reads ambiguously, so the word for level is added. */
const exLv=l=>l==="Başlangıç"?"başlangıç seviyesi":l.toLowerCase()+" seviye";
function viewExlib(){
  return `<div class="srch"><input class="in" id="glq" type="search" enterkeyhint="search" aria-label="Egzersiz ara" placeholder="Egzersiz ara" autocomplete="off" value="${esc(gLQ)}"><span id="glfb">${exFilterBtn()}</span></div>
  <div id="gllist" class="card exlist">${exListHtml()}</div>
  <p class="hint">Hareketler genel bilgi amaçlıdır, kişisel antrenman ya da tıbbi tavsiye değildir. Fotoğraflar free-exercise-db (kamu malı) kaynaklıdır.</p>`;
}
const exFilterN=()=>[gLReg,gLCat,gLEq].filter(x=>x!=="Tümü").length;
const exFilterBtn=()=>{const n=exFilterN();return `<button class="btn ghost" data-g="lfilter" aria-label="Filtre${n?`, ${n} etkin`:""}">Filtre${n?` <span class="badge num">${n}</span>`:""}</button>`};
/* [label, container id, action, options, current value] of the three filter chip groups. */
const exFilters=()=>[["Bölge","glreg","lreg",["Tümü",...EXREG],gLReg],["Tür","glcat","lcat",["Tümü",...Object.values(EXCAT)],gLCat],["Ekipman","gleq","leq",["Tümü",...GNEWQ],gLEq]];
function exFilterSheet(){
  openSheet(`<h3>Filtre</h3>${exFilters().map(([lbl,id,act,arr,cur])=>`<div class="lbl">${lbl}</div><div class="chips" id="${id}">${exChips(arr,cur,act)}</div>`).join("")}
  <button class="btn" data-g="closesheet" id="glok">${exFiltered().length} sonucu göster</button><button class="lnk" data-g="lclear">Filtreleri temizle</button>`);
}
const exRefreshChips=()=>{
  const fb=$("#glfb");if(fb)fb.innerHTML=exFilterBtn();const ok=$("#glok");if(ok)ok.textContent=`${exFiltered().length} sonucu göster`;
  for(const [,id,act,arr,cur] of exFilters()){const el=$("#"+id);if(el)el.innerHTML=exChips(arr,cur,act)}
  const l=$("#gllist");if(l)l.innerHTML=exListHtml();
};

/* ---- detail sheet ---- */
function exHistLine(e){
  const h=gHistory(e.id).slice(0,3);if(!h.length)return "";
  const t=gTimed(e.id);
  return `<div class="my-2 mut sm">Son: ${h.map(x=>`${fd(x.w.day)} ${t?x.sets.map(s=>s.sec).join("/")+" sn":x.sets.map(s=>(s.kg?gW(s.kg)+"×":"")+s.reps+gRpeTx(s)).join(", ")}`).join(" · ")}</div>`;
}
/* Whole-history charts: one point per session, x axis proportional to the real date. Warm-up and unchecked sets are already excluded by gHistory. */
const EXMET={e:["Tahmini 1TM","kg"],t:["En ağır set","kg"],v:["Hacim","kg"]};
let exChM="e",exChI=null,exChId=null;
const exChRefresh=()=>{const b=$("#xch");if(b)b.innerHTML=exChartBody(exChId)};
function exSeries(id){
  return gHistory(id).reverse().map(h=>{
    const ws=gWork(h.sets),top=ws.reduce((a,s)=>(s.kg||0)>(a.kg||0)||((s.kg||0)===(a.kg||0)&&s.reps>a.reps)?s:a,ws[0]);
    return {d:h.w.day,x:Algo.dayNum(h.w.day),e:gBest(h.w,id),t:top.kg||0,r:top.reps,v:Algo.volume(h.sets)};
  });
}
function exChartSvg(pts,m,sel){
  const W=340,H=150,pl=40,pr=10,pt=10,pb=24,vs=pts.map(p=>p[m]);
  let lo=Math.min(...vs),hi=Math.max(...vs);const pad=Math.max((hi-lo)*.1,hi*.02,1);lo=Math.max(0,lo-pad);hi+=pad;
  const x0=pts[0].x,x1=pts[pts.length-1].x,X=p=>pl+(W-pl-pr)*(x1>x0?(p.x-x0)/(x1-x0):.5),Y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
  const grid=[0,1,2].map(t=>{const v=lo+(hi-lo)*t/2,y=Y(v);return `<line x1="${pl}" x2="${W-pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/><text x="${pl-6}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${fint(Units.w(v))}</text>`}).join("");
  const line=pts.map((p,k)=>(k?"L":"M")+X(p).toFixed(1)+" "+Y(p[m]).toFixed(1)).join("");
  const hit=pts.map((p,k)=>{const a=k?(X(pts[k-1])+X(p))/2:pl,b=k<pts.length-1?(X(p)+X(pts[k+1]))/2:W-pr;
    return `<rect x="${a.toFixed(1)}" y="0" width="${(b-a).toFixed(1)}" height="${H}" fill="transparent" data-g="chp:${k}"/>`}).join("");
  const sp=pts[sel];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${EXMET[m][0]} grafiği">${grid}<path d="${line}" fill="none" stroke="var(--exercise)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  ${pts.length<=40?pts.map(p=>`<circle cx="${X(p).toFixed(1)}" cy="${Y(p[m]).toFixed(1)}" r="2.6" fill="var(--exercise)"/>`).join(""):""}
  <circle cx="${X(sp).toFixed(1)}" cy="${Y(sp[m]).toFixed(1)}" r="5" fill="var(--card)" stroke="var(--exercise)" stroke-width="2.6"/>
  <text x="${pl}" y="${H-6}" text-anchor="start">${fd(pts[0].d)}</text><text x="${W-pr}" y="${H-6}" text-anchor="end">${fd(pts[pts.length-1].d)}</text>${hit}</svg>`;
}
function exChartBody(id){
  const pts=exSeries(id);if(!pts.length)return "";
  const m=exChM,sel=exChI!=null&&exChI<pts.length?exChI:pts.length-1,p=pts[sel];
  const val=m==="t"?`${gW(p.t)||0} ${Units.wu()} × ${p.r}`:`${fint(Units.w(p[m]))} ${Units.wu()}`;
  const body=pts.length<2?`<p class="hint">Grafik için en az iki seans gerekir. Şimdilik tek seans var.</p>`:exChartSvg(pts,m,sel);
  return `<div class="chips my-2">${Object.keys(EXMET).map(k=>`<button class="chip" data-g="chm:${k}" aria-pressed="${k===m}">${EXMET[k][0]}</button>`).join("")}</div>
  <div class="num" aria-live="polite"><b>${val}</b> <span class="mut sm">${fd(p.d)}, ${sel+1}/${pts.length}. seans</span></div>${body}`;
}
function exCharts(id){
  if(gKind(id)!=="w"||!gHistory(id).length)return "";
  exChM="e";exChI=null;exChId=id;
  return `<div id="xch">${exChartBody(id)}</div><p class="hint">Tüm geçmiş. 1TM setten hesaplanan bir tahmindir (Epley). Grafiğe dokununca o seansın değeri görünür.</p>`;
}
function exSheet(id){
  const e=gEx(id),d=e.tp?exDef(e):null;
  const photos=e.im>0?`<span class="exph" aria-hidden="true"><img src="ex/${e.id}/0.webp" alt="" loading="lazy">${e.im>1?`<img class="b" src="ex/${e.id}/1.webp" alt="" loading="lazy">`:""}</span>`:"";
  const cues=(EXCUE[e.tp]||[]).map(c=>`<li>${esc(c)}</li>`).join("");
  const w=gActive(),inW=w&&w.ex.some(x=>x.id===id);
  openSheet(`<h3>${esc(e.n)}</h3><div class="mut sm">${e.r||e.g}${e.q?" · "+e.q:""}${e.l?" · "+exLv(e.l):""}${e.c?" · "+EXCAT[e.c]:""}</div>
  ${d||photos?`<div class="exvis">${d?`<div class="exfig">${FigLib.svg(d,{anim:true,label:e.n})}</div>`:""}${photos}</div>`:""}
  ${cues?`<ul class="cues">${cues}</ul>`:""}
  <div class="mut sm">Kayıt türü: ${EXKIND[e.k||"w"]}</div>${exHistLine(e)}${exCharts(id)}
  <div class="mt-3 btns"><button class="btn" data-g="exadd:${id}">${inW?"Antrenmanda ekli":"Antrenmana ekle"}</button><button class="btn ghost" data-g="closesheet">Kapat</button></div>`);
}
function gSheetHistSimple(exId,h){
  const ex=gEx(exId);
  openSheet(`<h3>${esc(ex.n)}</h3>${h.length?`<table><thead><tr><th>Tarih</th><th>Setler</th></tr></thead><tbody>${h.slice(0,8).map(x=>`<tr><td>${fd(x.w.day)}</td><td class="num">${x.sets.map(s=>gSetLine(exId,s)).join(" · ")}</td></tr>`).join("")}</tbody></table>`:`<p class="hint">Bu hareketle tamamladığın setler burada görünür.</p>`}<button class="btn" data-g="closesheet">Kapat</button>`);
}
const exKindSec=(id,sec)=>gKind(id)==="c"?Math.round(sec/60)+" dk":sec+" sn";

/* ---- timed-set timer ---- */
/* Queued so that a quick ✓ followed by Skip cannot run its cancel before the previous schedule and leave the notification armed. */
let gLnQ=Promise.resolve();
const gLn=f=>gLnQ=gLnQ.then(()=>{const ln=plugin("LocalNotifications");return ln&&f(ln)}).catch(()=>{});
const gNotify=(at,title,body,id=9001)=>gLn(async ln=>{await ln.cancel({notifications:[{id}]});await lnSchedule(ln,[{id,title,body,schedule:{at:new Date(at),allowWhileIdle:true},extra:{act:"open",tab:"gym"}}])});
const gNotifyCancel=(id=9001)=>gLn(ln=>ln.cancel({notifications:[{id}]}));
function gTimStop(){if(gTim){gTim=null;gNotifyCancel()}}
const gTimNotify=(t,name)=>gNotify(t.end,t.phase==="rest"?"Sıradaki tur başlıyor":"⏱ Süre doldu",name);
function gTimStart(ei,si){
  const w=gActive();if(!w)return;
  const x=w.ex[ei],s=x&&x.sets[si];if(!s)return;
  if(gTim&&gTim.ei===ei&&gTim.si===si&&gTim.phase==="work"){gTimStop();return render()}
  if(!(s.sec>0))return toast("Önce süreyi yaz");
  gTimStop();gRestSet(0);
  gTim={ei,si,end:Date.now()+s.sec*1000,total:s.sec,phase:"work"};
  gTimNotify(gTim,gEx(x.id).n);
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
  if(!skip)gVib([300,120,300,120,300]);
  const kind=gKind(x.id);
  if(t.phase==="work"){
    s.done=true;save();
    const nx=x.sets[t.si+1];
    if(kind==="i"&&nx&&!nx.done&&nx.sec>0){
      gTim={ei:t.ei,si:t.si+1,end:Date.now()+20000,total:20,phase:"rest"};
      gTimNotify(gTim,gEx(x.id).n);
    }else{gNotifyCancel();gRestStart(w,t.ei)}
    toast(`${gEx(x.id).n}: ${t.si+1}. set tamamlandı`);
  }else{
    const nx=x.sets[t.si];
    if(nx&&!nx.done&&nx.sec>0){gTim={ei:t.ei,si:t.si,end:Date.now()+nx.sec*1000,total:nx.sec,phase:"work"};gTimNotify(gTim,gEx(x.id).n)}
    else gNotifyCancel();
  }
  render();
}
function exTick(){
  // $ is defined in the main script; on a slow phone this interval can fire before it.
  const bar=document.getElementById("gtim");if(!bar)return;
  const t=gTim;
  if(!t){bar.hidden=true;return}
  if(tab!=="gym"||!gActive())return;
  const left=t.end-Date.now();
  if(left<=0)return gTimDone();
  bar.hidden=false;$("#gtl").textContent=exTimLabel();$("#gtv").textContent=gClock(left);
}
setInterval(exTick,1000);

/* ---- plates and warm-up ---- */
const exPlateIn=()=>({kg:num($("#pk").value),bar:num($("#pb").value)});
/* Upper bound: the Algo.plates loop is proportional to the target, so a huge number would freeze the page. */
const exPlateOk=({kg,bar})=>kg>0&&kg<=KG_MAX&&bar>=5&&bar<=50,EXPLATE_HINT="Hedef 1000 kg'a kadar, bar 5-50 kg olmalı";
function exPlateCalc(){
  const {kg,bar}=exPlateIn(),box=$("#pres");
  if(!exPlateOk({kg,bar})){box.innerHTML=`<p class="hint">${EXPLATE_HINT}.</p>`;return}
  if(S.bar!==bar){S.bar=bar;save()}
  const p=Algo.plates(kg,bar,S.plates),wu=Algo.warmup(kg,bar,S.plates);
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
/* Moves of the same region and equipment (and kind) as a flagged move, not flagged themselves and not already in the workout. */
function exAlternatives(w,id,max=8){
  const e=gEx(id),have=new Set(w.ex.map(x=>x.id));
  return gExAll().filter(a=>a.id!==id&&a.r===e.r&&a.q===e.q&&gKind(a.id)===gKind(id)&&!have.has(a.id)&&!gFlagged(a.id)).slice(0,max);
}
function exAltSheet(ei){
  const w=gActive(),id=w.ex[ei].id,list=exAlternatives(w,id);
  openSheet(`<h3>${esc(gEx(id).n)}: benzer hareketler</h3>${list.length?`<div class="plist">${list.map(a=>`<button class="prow" data-g="exadd:${a.id}"><span class="grow"><b>${esc(a.n)}</b></span></button>`).join("")}</div>`:`<p class="mut">Aynı bölge ve ekipmanda başka hareket bulunamadı.</p>`}
  <p class="hint">Yalnız aynı bölgeyi çalıştıran hareketlerin listesidir; ne olduğunu ya da ne yapman gerektiğini söylemez. Devam eden bir rahatsızlık için hekimine danış.</p><button class="btn ghost" data-g="closesheet">Kapat</button>`);
}
const EXRANGES=["5-8","8-12","12-15"];
function exRangeSheet(ei){
  const id=gActive().ex[ei].id,c=Object.assign({lo:8,hi:12},S.exCfg[id]);
  openSheet(`<h3>${esc(gEx(id).n)}</h3><div class="lbl">Tekrar aralığı</div><div class="chips">${EXRANGES.map(r=>`<button class="chip" data-g="rngset:${ei}:${r}" aria-pressed="${r===c.lo+"-"+c.hi}">${r}</button>`).join("")}</div>
  <p class="hint">Tüm setlerde üst tekrara ulaşınca öneri ağırlığı artırır.</p><button class="btn ghost" data-g="closesheet">Kapat</button>`);
}
function exRangeSet(ei,r){
  const id=gActive().ex[ei].id,[lo,hi]=r.split("-").map(Number);
  gCfg(id,r==="8-12"?{lo:null,hi:null}:{lo,hi});
  save();closeSheet();render();toast(`Tekrar aralığı ${r}`);
}
const EXRESTS=[0,30,45,60,75,90,120,150,180,240];
function exRestSheet(ei){
  const id=gActive().ex[ei].id,cur=S.exCfg[id]&&S.exCfg[id].rest,def=gRestDef(id);
  openSheet(`<h3>${esc(gEx(id).n)}</h3><div class="lbl">Dinlenme süresi</div><div class="chips"><button class="chip" data-g="rstset:${ei}:d" aria-pressed="${cur==null}">Varsayılan (${gRestTx(def)})</button>${EXRESTS.map(v=>`<button class="chip" data-g="rstset:${ei}:${v}" aria-pressed="${v===cur}">${gRestTx(v)}</button>`).join("")}</div>
  <p class="hint">Set ✓ sonrası sayaç bu süreyle başlar, bitince ekran kapalıyken de bildirim gelir. Sayaçta ±15 ve Atla her zaman var.</p><button class="btn ghost" data-g="closesheet">Kapat</button>`);
}
function exRestSet(ei,v){
  const id=gActive().ex[ei].id,sec=v==="d"?null:+v;
  if(sec!=null&&!EXRESTS.includes(sec))return;
  gCfg(id,{rest:sec});save();closeSheet();render();toast(`Dinlenme ${gRestTx(gRestSec(id))}`);
}
function exWarmAdd(ei){
  const v=exPlateIn(),x=gActive().ex[ei];
  if(!exPlateOk(v))return toast(EXPLATE_HINT);
  // Adding again refreshes the pending warm-ups; completed ones stay and their weights are not added twice.
  const done=x.sets.filter(s=>s.w&&s.done),wu=Algo.warmup(v.kg,v.bar,S.plates).filter(t=>!done.some(s=>s.kg===t.kg));
  if(!wu.length)return toast(done.length?"Isınma setleri zaten tamamlandı":"Isınma için hedef barın üstünde olmalı");
  x.sets=done.concat(wu.map(t=>({kg:t.kg,reps:t.reps,done:false,w:true}))).sort((a,b)=>a.kg-b.kg).concat(x.sets.filter(s=>!s.w));
  save();closeSheet();render();toast("Isınma setleri eklendi");
}

/* ---- clicks (the actions gClick does not handle) ---- */
function exClick(a,p1,p2){
  const ei=+p1;
  switch(a){
    case "gdb":S.dbStep=+p1;save();return render();
    case "gpl":{
      const v=+p1,on=S.plates.includes(v);
      if(on&&S.plates.length===1)return toast("En az bir plaka kalmalı");
      S.plates=GPLATE_ALL.filter(x=>x===v?!on:S.plates.includes(x));save();return render();
    }
    case "lib":tab="exlib";return render();
    case "lfilter":return exFilterSheet();
    case "lclear":gLReg=gLCat=gLEq="Tümü";gLN=40;return exRefreshChips();
    case "lreg":gLReg=p1;gLN=40;return exRefreshChips();
    case "lcat":gLCat=p1;gLN=40;return exRefreshChips();
    case "leq":gLEq=p1;gLN=40;return exRefreshChips();
    case "lmore":gLN+=60;{const l=$("#gllist");if(l)l.innerHTML=exListHtml()}return;
    case "exinfo":return exSheet(p1);
    case "exadd":{
      let wk=gActive();
      if(!wk){gStart(null);wk=gActive()}
      if(!wk)return;
      if(wk.ex.some(x=>x.id===p1)){closeSheet();tab="gym";return render()}
      gAddEx(wk,p1);save();closeSheet();tab="gym";render();toast(`${gEx(p1).n} antrenmana eklendi`);return;
    }
    case "chm":exChM=p1;exChI=null;return exChRefresh();
    case "chp":exChI=ei;return exChRefresh();
    case "plate":return exPlateSheet(ei);
    case "flag":{
      const id=gActive().ex[ei].id,was=gFlagged(id);
      gCfg(id,{flag:was?null:dayKey()});save();closeSheet();render();
      return toast(was?"İşaret kaldırıldı":"İşaretlendi; 14 gün ağırlık artırma önerisi kapalı");
    }
    case "alt":return exAltSheet(ei);
    case "rng":return exRangeSheet(ei);
    case "rngset":return exRangeSet(ei,p2);
    case "rst":return exRestSheet(ei);
    case "rstset":return exRestSet(ei,p2);
    case "wadd":return exWarmAdd(ei);
    case "tstart":return gTimStart(+p1,+p2);
    case "tstop":if(gTim)gTimDone(true);return;
    case "tadd":{
      if(!gTim)return;
      const x=gActive()?.ex[gTim.ei];
      gTim.end=Math.max(Date.now()+1000,gTim.end+p1*1000);gTimNotify(gTim,x?gEx(x.id).n:"");exTick();return;
    }
  }
}
