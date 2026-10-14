"use strict";
/* Lab results screens. Only the saved result rows are stored: the PDF text, the patient name and ID are never written anywhere. */
let labRows=[],labDate="",labManual=false,labKeep=null,labCancel=false;
const PDF_MAX_BYTES=15e6;

function labSvg(s,W,H){
  const g=LabLib.geom(s,8,8,W-16,H-28),band=g.band;
  const bd=band?`<rect x="8" y="${Math.min(band.y1,band.y2).toFixed(1)}" width="${W-16}" height="${Math.abs(band.y2-band.y1).toFixed(1)}" fill="var(--prim)" opacity=".12"/>`:"";
  const line=g.pts.length>1?`<polyline points="${g.pts.map(q=>q.x.toFixed(1)+","+q.y.toFixed(1)).join(" ")}" fill="none" stroke="var(--prim)" stroke-width="2.2" stroke-linejoin="round"/>`:"";
  const dots=g.pts.map(q=>`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="4.2" fill="var(--prim)"/>`).join("");
  const first=s.pts[0].day,last=s.pts[s.pts.length-1].day;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.n)} grafiği" class="lsv">${bd}<rect x="8" y="8" width="${W-16}" height="${H-28}" fill="none" stroke="var(--line)"/>${line}${dots}<text x="8" y="${H-6}">${fd(first)}</text>${s.pts.length>1?`<text x="${W-8}" y="${H-6}" text-anchor="end">${fd(last)}</text>`:""}</svg>`;
}
/* A result value with its "<" or ">" qualifier. */
const labV=p=>esc(p.q||"")+LabLib.fmtN(p.v);
const labFlagTxt=f=>f==="high"?"▲ Raporda yazan aralığın üstünde":f==="low"?"▼ Raporda yazan aralığın altında":"";
/* The status is always a mark plus text: colour alone carries no meaning. */
const labStat=(p,rt)=>{const f=LabLib.flag(p);return f?`<div class="b7 sm">${labFlagTxt(f)}</div>`:rt&&p.lo!=null&&p.hi!=null?`<div class="mut sm">✓ Raporda yazan aralıkta</div>`:""};
/* Range strip: the middle half is the range the report wrote, the mark is the value's position (only when both ends are known). */
const labBar=p=>{if(p.lo==null||p.hi==null||!(p.hi>p.lo))return "";const w=p.hi-p.lo,x=Math.max(0,Math.min(100,(p.v-p.lo+w/2)/(2*w)*100));return `<span class="lbar" aria-hidden="true"><i style="left:${x.toFixed(1)}%"></i></span>`};
/* Definition: only for dictionary tests, only what the test is; no comment. */
const labInfoBox=(k,id,hid)=>{const d=LabLib.info(k);return d?`<div id="${id}" class="helpx" ${hid?"hidden":""}><b class="db">${esc(d.n)} nedir</b>${esc(d.e)}</div>`:""};

function labCard(s,i){
  const last=s.pts[s.pts.length-1],rt=LabLib.rangeText(last),d=LabLib.info(s.k);
  return `<div class="card labc"><button class="labo" data-lab="open:${esc(s.id)}"><span class="labh"><b>${esc(s.n)}</b><small class="db mut sm">${d?esc(d.c)+" · ":""}${fd(last.day)}</small></span>
  <span class="db t-h2 b7 num">${labV(last)} <small class="mut">${esc(s.u)}</small></span>${labStat(last,rt)}${labBar(last)}${rt?`<span class="db mut sm num">Rapor aralığı: ${esc(rt)}</span>`:""}${s.pts.length>1?`<span class="db mt-2">${labSvg(s,300,80)}</span>`:""}</button>
  ${d?`<button class="help" data-lab="info:${i}" aria-expanded="false" aria-controls="li${i}" aria-label="${esc(s.n)} nedir">${Icons.svg("info")}</button>${labInfoBox(s.k,"li"+i,1)}`:""}</div>`;
}
function viewLabs(){
  const lastDay=s=>s.pts[s.pts.length-1].day,list=LabLib.series(S.labs).sort((a,b)=>lastDay(a)<lastDay(b)?1:-1);
  const isOut=s=>!!LabLib.flag(s.pts[s.pts.length-1]),out=list.filter(isOut),rest=list.filter(s=>!isOut(s));
  let i=0;const cards=a=>a.map(s=>labCard(s,i++)).join("");
  const body=out.length?`<h2 class="grp">Raporda yazan aralığın dışında (${out.length})</h2>${cards(out)}${rest.length?`<h2 class="grp">Diğer sonuçlar</h2>${cards(rest)}`:""}`:cards(rest);
  return `<div class="card"><div class="lbl">Tahlil sonuçları</div>
    <p class="m0 mb-3 mut sm">PDF'ten okut ya da elle ekle. Veriler yalnızca bu telefonda kalır. Raporda yazan aralık olduğu gibi gösterilir; uygulama yorum yapmaz. Bu değerleri hekiminle değerlendir.</p>
    <div class="btns"><label class="tc btn">${Icons.svg("file")} PDF'ten oku<input id="labfile" type="file" accept="application/pdf,.pdf" hidden></label>
    ${ocrBtn("labs",Icons.svg("camera")+" Fotoğraftan oku")}<button class="btn ghost" data-lab="add">${Icons.svg("plus")} Elle ekle</button></div></div>
  ${body||emptyCard("file","Henüz tahlil sonucu yok","İlk PDF'ini okutarak başla.")}
  ${S.labs.length?`<button class="mt-2 btn danger" data-lab="delall">Tüm tahlil kayıtlarını sil</button>`:""}`;
}
function labTrendCard(){
  const n=LabLib.series(S.labs).length,d=S.labs.reduce((m,r)=>r.day>m?r.day:m,"");
  return navRow('data-tab="labs"',"file","Tahlil takibi",n?`Son sonuç: ${fd(d)}`:"PDF'ten okut ya da elle ekle");
}

function labDetail(id){
  const s=LabLib.series(S.labs).find(x=>x.id===id);
  if(!s){closeSheet();return render()}
  const last=s.pts[s.pts.length-1],rt=LabLib.rangeText(last),hm=Vitals.before(last.day,30);
  const home=hm.bp||hm.g?`<details class="mt-3"><summary>Ev ölçümlerin (bu sonuçtan önceki 30 gün)</summary><p class="hint num">${[hm.bp?`Tansiyon ortalaması ${hm.bp.sys}/${hm.bp.dia} (${hm.bp.n} ölçüm)`:"",hm.g?`Şeker ortalaması ${Units.fg(hm.g.avg)} ${Units.gl()} (${hm.g.n} ölçüm)`:""].filter(Boolean).join(" · ")}</p><p class="hint">Yan yana gösterilir; karşılaştırma ya da yorum değildir.</p></details>`:"";
  const rows=s.pts.slice().reverse().map(p=>{const pf=LabLib.flag(p),r=LabLib.rangeText(p);return `<div class="prow"><button class="grow pbtn" data-lab="edit:${p.id}" aria-label="${fd(p.day)} sonucunu düzenle"><span class="grow">${fd(p.day)}${r?`<small class="db mut num">Aralık ${esc(r)}</small>`:""}</span><span class="ta-r"><b class="num">${labV(p)}</b>${pf?`<small class="db b7">${pf==="high"?"▲ Üstünde":"▼ Altında"}</small>`:""}</span></button><button class="del" data-lab="del:${p.id}" aria-label="${fd(p.day)} sonucunu sil">${Icons.svg("x")}</button></div>`}).join("");
  openSheet(`<h3>${esc(s.n)}</h3><div class="ink sumv num">${labV(last)} <small>${esc(s.u)}</small></div>${labStat(last,rt)}<div class="mut sm">${fd(last.day)}${rt?" · Rapor aralığı: "+esc(rt):""}</div>
  <div class="mt-3">${labInfoBox(s.k,"lid",0)}</div><div class="my-2">${s.pts.length>1?labSvg(s,320,150):`<p class="hint">Grafik için aynı testten en az iki sonuç gerekir.</p>`}</div>
  <p class="hint">${s.pts.length>1&&rt?"Gölgeli bölge raporda yazan aralıktır. ":""}Tanım yalnızca testin ne olduğunu anlatır; tanı veya yorum değildir.</p>${home}<h4 class="grp">Sonuçlar</h4>${rows}<button class="mt-3 btn ghost" data-lab="close">Kapat</button>`);
}

function labRowHtml(r,i){
  const inp=(id,v,ph,cls,mode,extra)=>`<input class="in ${cls||""}" id="${id}${i}" value="${esc(v==null?"":v)}" placeholder="${ph}" ${mode?`inputmode="${mode}"`:""} ${extra||""} autocomplete="off">`;
  const f=(lab,h)=>`<label class="labf"><span>${lab}</span>${h}</label>`;
  return `<div class="card labr"><div class="dl mb-2"><label class="grow labf"><span>Test adı</span>${inp("ln",r.n,"örn. Glukoz","","",'list="labnames"')}</label><label class="sw"><input type="checkbox" id="lc${i}" aria-label="Satırı kaydet: ${esc(r.n||i+1)}" ${r.off?"":"checked"}><span></span></label></div>
  <div class="labg">${f("Değer",inp("lv",(r.q||"")+(r.v==null?"":LabLib.fmtN(r.v)),"","num","decimal"))}${f("Birim",inp("lu",r.u,"",""))}${f("Alt sınır",inp("ll",r.lo==null?"":LabLib.fmtN(r.lo),"","num","decimal"))}${f("Üst sınır",inp("lh",r.hi==null?"":LabLib.fmtN(r.hi),"","num","decimal"))}</div>${r.guess?`<div class="mt-1 b7 sm">${Icons.svg("info")} Emin değilim: satırı PDF'inle karşılaştır.</div>`:""}</div>`;
}
function labRender(){
  const dl=`<datalist id="labnames">${LabLib.DICT.map(d=>`<option value="${esc(d.n)}">`).join("")}</datalist>`;
  openSheet(`<h3>${labManual?"Tahlil ekle":"Okunan sonuçlar"}</h3>
  <div class="lbl">Numune tarihi${labDate?"":" (bulunamadı, seç)"}</div><input class="in" type="date" id="ld" value="${labDate}" max="${dayKey()}">
  <div class="mb-2 mut sm">${labManual?"":"Kaydetmeden önce her satırı PDF'inle karşılaştır. Yanlış satırın işaretini kaldır ya da düzelt."}</div>
  <div class="lscroll">${labRows.map(labRowHtml).join("")}</div>${dl}
  <div class="bgrid mt-3"><button class="btn ghost" data-lab="addrow">＋ Satır</button><button class="btn" data-lab="save">Kaydet</button></div><button class="mt-2 btn ghost" data-lab="close">Vazgeç</button>`);
}
/* Gathers the edits on screen into labRows (so they survive a redraw). vs/ls/hs are the raw value and range texts. */
function labCollect(){
  const g=id=>document.getElementById(id)?.value??"";
  const d=document.getElementById("ld");if(d)labDate=d.value;
  labRows=labRows.map((r,i)=>({...r,n:g("ln"+i),vs:g("lv"+i),u:g("lu"+i),ls:g("ll"+i),hs:g("lh"+i),off:!document.getElementById("lc"+i)?.checked}));
}
function labReview(parsed,manual){
  labManual=!!manual;labDate=parsed.date||"";
  labRows=parsed.rows.map(r=>({...r,orig:r.n,off:!!r.guess}));
  if(manual&&!labRows.length)labRows=[{n:"",v:undefined}];
  if(manual)labDate=dayKey();
  labRender();
}
/* Edit sheet for one stored result: value (with a leading < or >), sample date and the range the lab wrote. */
let labEditId=0;
function labEdit(id){
  const r=S.labs.find(x=>x.id===id);if(!r)return;
  labEditId=id;
  const f=(lab,i,v,mode="decimal")=>`<label class="labf"><span>${lab}</span><input class="in num" id="${i}" inputmode="${mode}" value="${esc(v)}" autocomplete="off"></label>`;
  openSheet(`<h3>${esc(r.n)}</h3>${f(`Değer${r.u?` (${esc(r.u)})`:""}`,"lev",(r.q||"")+LabLib.fmtN(r.v))}
  <label class="lbl" for="led">Numune tarihi</label><input class="in" type="date" id="led" max="${dayKey()}" value="${r.day}">
  <div class="labg">${f("Alt sınır","lel",r.lo==null?"":LabLib.fmtN(r.lo))}${f("Üst sınır","leh",r.hi==null?"":LabLib.fmtN(r.hi))}</div>
  <div class="ferr" id="leerr" role="alert"></div><button class="btn" data-lab="editgo">Kaydet</button><button class="mt-2 btn ghost" data-lab="close">Vazgeç</button>`);
}
function labEditSave(){
  const r=S.labs.find(x=>x.id===labEditId);if(!r)return closeSheet();
  const g=id=>document.getElementById(id).value,vs=g("lev"),q=/^\s*[<>]/.test(vs)?vs.trim()[0]:"",v=LabLib.optNum(vs.replace(/^\s*[<>]=?/,"")),lo=LabLib.optNum(g("lel")),hi=LabLib.optNum(g("leh")),day=g("led");
  const err=v==null?"Değeri sayı olarak yaz":!dayOk(day)||day>dayKey()?"Numune tarihini seç (bugünden ileri olamaz)":(g("lel")&&lo==null)||(g("leh")&&hi==null)?"Sınırı sayı olarak yaz":lo!=null&&hi!=null&&lo>hi?"Alt sınır üst sınırdan büyük olamaz":"";
  if(err)return ferr("leerr",err);
  const was=S.labs,next={...r,day,v,q,lo,hi};
  for(const k of ["q","lo","hi"])if(!next[k]&&next[k]!==0)delete next[k];
  S.labs=LabLib.cleanLabs(was.map(x=>x===r?next:x));
  if(!commit(()=>{S.labs=was}))return;
  closeSheet();render();
  toast("Sonuç güncellendi",()=>{S.labs=was;save();render()});
}
function labSave(){
  labCollect();
  if(!dayOk(labDate)||labDate>dayKey())return toast("Numune tarihini seç (bugünden ileri olamaz)");
  const out=[];let badN=0;
  for(const r of labRows){
    if(r.off)continue;
    const n=r.n.trim(),vs=r.vs;
    if(!n&&vs.trim()==="")continue;
    const q=/^\s*[<>]/.test(vs)?vs.trim()[0]:"",v=LabLib.optNum(vs.replace(/^\s*[<>]=?/,"")),lo=LabLib.optNum(r.ls),hi=LabLib.optNum(r.hs);
    if(!n||v==null||(r.ls&&lo==null)||(r.hs&&hi==null)||(lo!=null&&hi!=null&&lo>hi)){badN++;continue}
    const o={day:labDate,n,k:r.k&&n===r.orig?r.k:LabLib.keyFor(n),v};
    if(q)o.q=q;if(r.u.trim())o.u=r.u.trim();if(lo!=null)o.lo=lo;if(hi!=null)o.hi=hi;
    out.push(o);
  }
  if(badN)return toast(`${badN} satırda ad ya da değer okunamadı, düzelt ya da işaretini kaldır`);
  if(!out.length)return toast("Kaydedilecek satır seçili değil");
  const before=S.labs.length;
  S.labs=LabLib.cleanLabs(S.labs.concat(out));save();
  const added=S.labs.length-before;
  closeSheet();tab="labs";render();window.scrollTo(0,0);
  toast(added===out.length?`${added} sonuç kaydedildi`:`${added} sonuç kaydedildi, ${out.length-added} tanesi zaten kayıtlıydı`);
}

async function labLoadPdf(){
  if(window.__labPdfLib)return window.__labPdfLib; // test seam: a fake pdf.js
  const lib=await import("../../vendor/pdfjs/pdf.min.js");
  lib.GlobalWorkerOptions.workerSrc=new URL("vendor/pdfjs/pdf.worker.min.js",document.baseURI).href;
  return lib;
}
/* Scanned PDF: each page is drawn on a canvas and given only to the local ML Kit (pages one at a time to save memory). */
const labOcr=()=>{
  const P=plugin("Ocr");
  return P?{
    cancelled:()=>labCancel||!document.getElementById("labprog"),
    progress:(i,n)=>{const e=document.getElementById("labprog");if(e)e.textContent=`Sayfa ${i}/${n} okunuyor`},
    recognize:b=>P.recognize({image:b}),
    async render(pg){
      const vp=pg.getViewport({scale:2}),c=document.createElement("canvas");c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);
      const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,c.width,c.height);
      await pg.render({canvasContext:x,viewport:vp}).promise;
      const b=c.toDataURL("image/jpeg",0.9).split(",")[1];c.width=c.height=0;return b;
    }
  }:null;
};
async function labRead(data,password){
  toast("PDF okunuyor…");
  let ex,viaOcr=false;
  const ocr=labOcr();labCancel=false;
  try{
    const lib=await labLoadPdf();
    ex=await LabLib.extract(lib,data.slice(),password);
    if(ex.scanned&&ocr){
      openSheet(`<h3>Taranmış PDF</h3><p class="mut sm">Yazı telefonda okunur, hiçbir yere gönderilmez. En çok ilk 6 sayfa okunur.</p><p id="labprog" role="status">Hazırlanıyor…</p><button class="btn ghost" data-lab="cancel">Vazgeç</button>`);
      ex=await LabLib.extract(lib,data.slice(),password,ocr);
      viaOcr=true;
      closeSheet();
    }
  }catch(e){closeSheet();return toast("PDF okunamadı")}
  document.getElementById("toast").classList.remove("on");
  if(ex.cancelled)return toast("Okuma iptal edildi");
  if(ex.need==="password"){
    labKeep=data;
    return openSheet(`<h3>Korumalı PDF</h3><p class="mut sm">${ex.wrong?"Parola yanlış. ":""}Laboratuvarın verdiği PDF parolasını yaz. Parola saklanmaz.</p><input class="in" id="labpw" type="password" autocomplete="off" autofocus><button class="btn" data-lab="pw">Aç</button><button class="mt-2 btn ghost" data-lab="close">Vazgeç</button>`);
  }
  labKeep=null;
  if(ex.error)return toast(ex.error);
  if(ex.scanned)return openSheet(`<h3>Metin bulunamadı</h3><p class="mut">Bu PDF bir görüntü (taranmış ya da fotoğraf) olduğu için içindeki yazıyı okuyamıyorum. Değerleri elle ekleyebilirsin.</p><button class="btn" data-lab="add">${Icons.svg("plus")} Elle ekle</button><button class="mt-2 btn ghost" data-lab="close">Kapat</button>`);
  const parsed=LabLib.parseLines(ex.lines,dayKey());
  if(!parsed.rows.length)return openSheet(`<h3>Sonuç bulunamadı</h3><p class="mut">PDF'te tanıyabildiğim bir sonuç satırı yok. Rapor düzeni farklı olabilir. Değerleri elle ekleyebilirsin.</p><button class="btn" data-lab="add">${Icons.svg("plus")} Elle ekle</button><button class="mt-2 btn ghost" data-lab="close">Kapat</button>`);
  labReview(parsed,false);
  if(ex.limited)toast(`${viaOcr?"Taranmış PDF: yalnız":"PDF: yalnız"} ilk ${ex.limited.read} sayfa okundu (toplam ${ex.limited.total})`);
}
async function labFile(f){
  if(!f)return;
  if(f.size>PDF_MAX_BYTES)return toast("PDF çok büyük (en çok 15 MB)");
  let buf;try{buf=await f.arrayBuffer()}catch(e){return toast("Dosya okunamadı")}
  await labRead(new Uint8Array(buf));
}

function labBuildReport(){
  const list=LabLib.series(S.labs),pages=LabLib.paginate(list);
  const info={today:dayKey(),count:list.length,rows:list.reduce((a,s)=>a+s.pts.length,0),total:pages.length};
  return canvasPdf(pages.length,(ctx,i)=>LabLib.drawPage(ctx,pages[i],{...info,page:i+1}));
}
/* Pages of the lab report for the combined doctor report: {count, draw(ctx,n)}, or null without results. */
function labPdfPages(){
  const list=LabLib.series(S.labs);if(!list.length)return null;
  const pages=LabLib.paginate(list),info={today:dayKey(),count:list.length,rows:list.reduce((a,s)=>a+s.pts.length,0),total:pages.length};
  return {count:pages.length,draw:(ctx,i)=>LabLib.drawPage(ctx,pages[i],{...info,page:i+1})};
}
async function labExport(){
  let pdf;try{pdf=labBuildReport()}catch(e){return toast("PDF hazırlanamadı")}
  await sharePdf(pdf,`neowell-tahlil-${dayKey()}.pdf`,"Tahlil sonuçları");
}

document.addEventListener("change",ev=>{
  const t=ev.target;
  if(t.id==="labfile"){const f=t.files&&t.files[0];t.value="";labFile(f)}
});
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-lab]");if(!el)return;
  const [a,arg]=el.dataset.lab.split(/:(.*)/s);
  if(a==="open")labDetail(arg);
  else if(a==="info"){const b=document.getElementById("li"+arg),on=b.hidden;b.hidden=!on;el.setAttribute("aria-expanded",on)}
  else if(a==="close")closeSheet();
  else if(a==="cancel"){labCancel=true;closeSheet()}
  else if(a==="add")labReview({date:"",rows:[]},true);
  else if(a==="addrow"){labCollect();labRows.push({n:"",v:undefined});labRender();const e=document.getElementById("ln"+(labRows.length-1));if(e)e.focus()}
  else if(a==="save")labSave();
  else if(a==="edit")labEdit(+arg);
  else if(a==="editgo")labEditSave();
  else if(a==="pdf")labExport();
  else if(a==="pw"){const pw=document.getElementById("labpw").value;if(pw&&labKeep){const d=labKeep;closeSheet();labRead(d,pw)}}
  else if(a==="del"){
    const id=+arg,r=S.labs.find(x=>x.id===id);if(!r)return;
    const sid=r.k+"|"+(r.u||""),backup=S.labs.slice();
    S.labs=S.labs.filter(x=>x.id!==id);save();
    if(S.labs.some(x=>x.k+"|"+(x.u||"")===sid))labDetail(sid);else closeSheet();
    render();
    toast("Sonuç silindi",()=>{S.labs=backup;save();render()});
  }
  else if(a==="delall")confirmSheet({title:"Tüm tahlil kayıtları silinsin mi?",body:"Tüm tahlil kayıtları silinecek. Bu geri alınamaz. Devam edilsin mi?",ok:"Hepsini sil",danger:true}).then(ok=>{if(ok){S.labs=[];save();render();toast("Tahlil kayıtları silindi")}});
});

/* Once on the device: do canvas, JPEG, PDF generation and the embedded pdf.js (worker included) work? The result goes to the console and the smoke test reads it. */
async function labSelfTest(){
  if(window.__noSelfTest)return;
  try{if(localStorage.getItem("nw_pdfok"))return}catch(e){}
  try{
    const lib=await labLoadPdf(),doc=await lib.getDocument({data:labBuildReport(),isEvalSupported:false,verbosity:0}).promise;
    console.log("NW-PDF ok pages="+doc.numPages);
    try{localStorage.setItem("nw_pdfok","1")}catch(e){}
  }catch(e){console.log("NW-PDF hata "+(e&&e.message||e))}
}
document.addEventListener("nw:boot",()=>{if(isNative())setTimeout(labSelfTest,4000)});
