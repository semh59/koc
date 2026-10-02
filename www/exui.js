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
/* Tüm geçmiş grafikleri: seans başına bir nokta, x ekseni gerçek tarihe orantılı. Isınma ve işaretsiz setler gHistory'de zaten dışarıda. */
const EXMET={e:["Tahmini 1TM","kg"],t:["En ağır set","kg"],v:["Hacim","kg"]};
let exChM="e",exChI=null,exChId=null;
const exChRefresh=()=>{const b=$("#xch");if(b)b.innerHTML=exChartBody(exChId)};
function exSeries(id){
  return gHistory(id).reverse().map(h=>{
    const top=h.sets.reduce((a,s)=>(s.kg||0)>(a.kg||0)||((s.kg||0)===(a.kg||0)&&s.reps>a.reps)?s:a,h.sets[0]);
    return {d:h.w.day,x:Algo.dayNum(h.w.day),e:gBest(h.w,id),t:top.kg||0,r:top.reps,v:Algo.volume(h.sets)};
  });
}
function exChartSvg(pts,m,sel){
  const W=340,H=150,pl=40,pr=10,pt=10,pb=24,vs=pts.map(p=>p[m]);
  let lo=Math.min(...vs),hi=Math.max(...vs);const pad=Math.max((hi-lo)*.1,hi*.02,1);lo=Math.max(0,lo-pad);hi+=pad;
  const x0=pts[0].x,x1=pts[pts.length-1].x,X=p=>pl+(W-pl-pr)*(x1>x0?(p.x-x0)/(x1-x0):.5),Y=v=>pt+(H-pt-pb)*(1-(v-lo)/(hi-lo));
  const grid=[0,1,2].map(t=>{const v=lo+(hi-lo)*t/2,y=Y(v);return `<line x1="${pl}" x2="${W-pr}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)"/><text x="${pl-6}" y="${(y+3.5).toFixed(1)}" text-anchor="end">${Math.round(v).toLocaleString("tr-TR")}</text>`}).join("");
  const line=pts.map((p,k)=>(k?"L":"M")+X(p).toFixed(1)+" "+Y(p[m]).toFixed(1)).join("");
  const hit=pts.map((p,k)=>{const a=k?(X(pts[k-1])+X(p))/2:pl,b=k<pts.length-1?(X(p)+X(pts[k+1]))/2:W-pr;
    return `<rect x="${a.toFixed(1)}" y="0" width="${(b-a).toFixed(1)}" height="${H}" fill="transparent" data-g="chp:${k}"/>`}).join("");
  const sp=pts[sel];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${EXMET[m][0]} grafiği">${grid}<path d="${line}" fill="none" stroke="var(--spor)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  ${pts.length<=40?pts.map(p=>`<circle cx="${X(p).toFixed(1)}" cy="${Y(p[m]).toFixed(1)}" r="2.6" fill="var(--spor)"/>`).join(""):""}
  <circle cx="${X(sp).toFixed(1)}" cy="${Y(sp[m]).toFixed(1)}" r="5" fill="var(--card)" stroke="var(--spor)" stroke-width="2.6"/>
  <text x="${pl}" y="${H-6}" text-anchor="start">${gDate(pts[0].d)}</text><text x="${W-pr}" y="${H-6}" text-anchor="end">${gDate(pts[pts.length-1].d)}</text>${hit}</svg>`;
}
function exChartBody(id){
  const pts=exSeries(id);if(!pts.length)return "";
  const m=exChM,sel=exChI!=null&&exChI<pts.length?exChI:pts.length-1,p=pts[sel];
  const val=m==="t"?`${fkg(p.t)||0} kg × ${p.r}`:`${Math.round(p[m]).toLocaleString("tr-TR")} kg`;
  const body=pts.length<2?`<p class="hint">Grafik için en az iki seans gerekir. Şimdilik tek seans var.</p>`:exChartSvg(pts,m,sel);
  return `<div class="chips" style="margin:8px 0 4px">${Object.keys(EXMET).map(k=>`<button class="chip" data-g="chm:${k}" aria-pressed="${k===m}">${EXMET[k][0]}</button>`).join("")}</div>
  <div class="num" aria-live="polite"><b>${val}</b> <span class="mut sm">${gDate(p.d)}, ${sel+1}/${pts.length}. seans</span></div>${body}`;
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
  openSheet(`<h3>${esc(e.n)}</h3><div class="mut sm">${e.r||e.g}${e.q?" · "+e.q:""}${e.l?" · "+e.l:""}${e.c?" · "+EXCAT[e.c]:""}</div>
  ${d||photos?`<div class="exvis">${d?`<div class="exfig">${FigLib.svg(d,{anim:true,label:e.n})}</div>`:""}${photos}</div>`:""}
  ${cues?`<ul class="cues">${cues}</ul>`:""}
  <div class="mut sm">Kayıt türü: ${EXKIND[e.k||"w"]}</div>${exHistLine(e)}${exCharts(id)}
  <div class="btns" style="margin-top:12px"><button class="btn" data-g="exadd:${id}">${inW?"Antrenmanda ekli":"Antrenmana ekle"}</button><button class="btn ghost" data-g="closesheet">Kapat</button></div>`);
}
function gSheetHistSimple(exId,h){
  const ex=gEx(exId),t=gTimed(exId);
  openSheet(`<h3>${esc(ex.n)}</h3>${h.length?`<table><thead><tr><th>Tarih</th><th>Setler</th></tr></thead><tbody>${h.slice(0,8).map(x=>`<tr><td>${gDate(x.w.day)}</td><td class="num">${t?x.sets.map(s=>exKindSec(exId,s.sec)).join(" · "):x.sets.map(s=>(s.kg?fkg(s.kg)+" × ":"")+s.reps).join(" · ")}</td></tr>`).join("")}</tbody></table>`:`<p class="hint">Henüz tamamlanmış set yok.</p>`}<button class="btn" data-g="closesheet">Kapat</button>`);
}
const exKindSec=(id,sec)=>gKind(id)==="c"?Math.round(sec/60)+" dk":sec+" sn";

/* ---- süreli set zamanlayıcısı ---- */
const LNP=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.LocalNotifications;
/* Sıraya alınır: hızlı ✓ ardından Atla'da iptal, önceki kurmanın schedule'ından önce çalışıp bildirimi kurulu bırakmasın. */
let gLnQ=Promise.resolve();
const gLn=f=>gLnQ=gLnQ.then(()=>{const ln=LNP();return ln&&f(ln)}).catch(()=>{});
const gNotify=(at,title,body,id=9001)=>gLn(async ln=>{await ln.cancel({notifications:[{id}]});await ln.schedule({notifications:[{id,title,body,schedule:{at:new Date(at),allowWhileIdle:true}}]})});
const gNotifyCancel=(id=9001)=>gLn(ln=>ln.cancel({notifications:[{id}]}));
function gTimStop(){if(gTim){gTim=null;gNotifyCancel()}}
function gTimStart(ei,si){
  const w=gActive();if(!w)return;
  const x=w.ex[ei],s=x&&x.sets[si];if(!s)return;
  if(gTim&&gTim.ei===ei&&gTim.si===si&&gTim.phase==="work"){gTimStop();return render()}
  if(!(s.sec>0))return toast("Önce süreyi yaz");
  gTimStop();gRestSet(0);
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
    }else{gNotifyCancel();gRestSet(Date.now()+gRestSec(x.id)*1000,x.id)}
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
/* Üst sınır: Algo.plates plaka döngüsü hedefle orantılı, çok büyük sayı sayfayı kilitler. */
const exPlateOk=({kg,bar})=>kg>0&&kg<=1000&&bar>=5&&bar<=50,EXPLATE_HINT="Hedef 1000 kg'a kadar, bar 5-50 kg olmalı";
function exPlateCalc(){
  const {kg,bar}=exPlateIn(),box=$("#pres");
  if(!exPlateOk({kg,bar})){box.innerHTML=`<p class="hint">${EXPLATE_HINT}.</p>`;return}
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
  // Yeniden eklemede bekleyen eski ısınmalar yenilenir; tamamlananlar kalır ve aynı ağırlık yeniden eklenmez.
  const done=x.sets.filter(s=>s.w&&s.done),wu=Algo.warmup(v.kg,v.bar).filter(t=>!done.some(s=>s.kg===t.kg));
  if(!wu.length)return toast(done.length?"Isınma setleri zaten tamamlandı":"Isınma için hedef barın üstünde olmalı");
  x.sets=done.concat(wu.map(t=>({kg:t.kg,reps:t.reps,done:false,w:true}))).sort((a,b)=>a.kg-b.kg).concat(x.sets.filter(s=>!s.w));
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
    case "chm":exChM=p1;exChI=null;return exChRefresh();
    case "chp":exChI=ei;return exChRefresh();
    case "plate":return exPlateSheet(ei);
    case "rng":return exRangeSheet(ei);
    case "rngset":return exRangeSet(ei,p2);
    case "rst":return exRestSheet(ei);
    case "rstset":return exRestSet(ei,p2);
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
