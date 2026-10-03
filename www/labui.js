"use strict";
/* Tahlil takibi arayüzü. index.html'deki S, save, toast, openSheet, closeSheet, esc, render, dayKey ile birlikte çalışır.
   Yalnızca kaydedilen sonuç satırları saklanır: PDF'in metni, hasta adı ya da kimlik bilgisi hiçbir yere yazılmaz. */
let labRows=[],labDate="",labManual=false,labKeep=null;
const labNum=s=>{const t=String(s==null?"":s).trim();return t===""?undefined:LabLib.toNum(t)};
const labFmt=v=>{const s=Number(v.toFixed(2));return String(s).replace(".",",")};

function labSvg(s,W,H){
  const g=LabLib.geom(s,8,8,W-16,H-28),band=g.band;
  const bd=band?`<rect x="8" y="${Math.min(band.y1,band.y2).toFixed(1)}" width="${W-16}" height="${Math.abs(band.y2-band.y1).toFixed(1)}" fill="var(--prim)" opacity=".12"/>`:"";
  const line=g.pts.length>1?`<polyline points="${g.pts.map(q=>q.x.toFixed(1)+","+q.y.toFixed(1)).join(" ")}" fill="none" stroke="var(--prim)" stroke-width="2.2" stroke-linejoin="round"/>`:"";
  const dots=g.pts.map(q=>`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="4.2" fill="var(--prim)"/>`).join("");
  const first=s.pts[0].day,last=s.pts[s.pts.length-1].day;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.n)} grafiği" style="width:100%;display:block">${bd}<rect x="8" y="8" width="${W-16}" height="${H-28}" fill="none" stroke="var(--line)"/>${line}${dots}<text x="8" y="${H-6}" style="font-size:10px;fill:var(--mut)">${fd(first)}</text>${s.pts.length>1?`<text x="${W-8}" y="${H-6}" text-anchor="end" style="font-size:10px;fill:var(--mut)">${fd(last)}</text>`:""}</svg>`;
}
const labFlagTxt=f=>f==="high"?"▲ Raporda yazan aralığın üstünde":f==="low"?"▼ Raporda yazan aralığın altında":"";
const labSid=s=>s.id;

function viewTahlil(){
  const list=LabLib.series(S.labs),txt=S.labs.filter(r=>r.t);
  const cards=list.map(s=>{
    const last=s.pts[s.pts.length-1],f=LabLib.flag(last),rt=LabLib.rangeText(last);
    return `<button class="stepcard" data-lab="open:${esc(s.id)}" aria-label="${esc(s.n)} ayrıntısı"><div class="row"><b>${esc(s.n)}</b><span class="mut sm">${fd(last.day)}</span></div><div class="row"><span class="big num">${last.q||""}${labFmt(last.v)} <small class="mut">${esc(s.u)}</small></span><span class="mut sm">${rt?"Raporda: "+esc(rt):""}</span></div>${f?`<div class="sm" style="font-weight:700">${labFlagTxt(f)}</div>`:""}${s.pts.length>1?`<div style="margin-top:6px">${labSvg(s,300,58)}</div>`:""}</button>`;
  }).join("");
  const nTxt=txt.length?`<p class="hint">${txt.length} yazılı sonuç (ör. Negatif) kayıtlı. Bunlar grafikte gösterilmez, PDF'e eklenmez.</p>`:"";
  return `<div class="card"><div class="lbl">Tahlil sonuçları</div>
    <p class="mut sm" style="margin:0 0 10px">PDF'ten okut ya da elle ekle. Veriler yalnızca bu telefonda kalır. Raporda yazan aralık olduğu gibi gösterilir; uygulama yorum yapmaz. Bu değerleri hekiminle değerlendir.</p>
    <div class="btns" style="display:grid;gap:8px"><label class="btn" style="text-align:center">${Icons.svg("file")} PDF'ten oku<input id="labfile" type="file" accept="application/pdf,.pdf" hidden></label>
    ${ocrBtn("tahlil",Icons.svg("camera")+" Fotoğraftan oku")}<button class="btn ghost" data-lab="add">${Icons.svg("plus")} Elle ekle</button></div></div>
  ${cards||`<div class="card"><p class="mut">Henüz tahlil sonucu yok. İlk PDF'ini okutarak başla.</p></div>`}${nTxt}
  ${S.labs.length?`<button class="btn danger" data-lab="delall" style="margin-top:8px">Tüm tahlil kayıtlarını sil</button>`:""}`;
}
function labTrendCard(){
  const n=LabLib.series(S.labs).length,d=S.labs.length?S.labs.map(r=>r.day).sort().pop():"";
  return `<button class="stepcard" data-tab="tahlil"><div class="row"><span class="mut">${Icons.svg("file")} Tahlil takibi</span><span class="mut sm">Aç ›</span></div><div class="row"><span class="mut sm">${n?`${n} test, son: ${fd(d)}`:"PDF'ten okut ya da elle ekle"}</span></div></button>`;
}

function labDetail(id){
  const s=LabLib.series(S.labs).find(x=>x.id===id);
  if(!s){closeSheet();return render()}
  const last=s.pts[s.pts.length-1],f=LabLib.flag(last);
  const rows=[...s.pts].reverse().map(p=>{const pf=LabLib.flag(p),rt=LabLib.rangeText(p);return `<div class="row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line)"><span style="flex:1">${fd(p.day)}</span><b class="num">${p.q||""}${labFmt(p.v)}</b><span class="mut sm" style="min-width:64px;text-align:right">${rt?esc(rt):""}</span><span aria-hidden="true">${pf==="high"?"▲":pf==="low"?"▼":""}</span><button class="chip" data-lab="del:${p.id}" aria-label="${fd(p.day)} sonucunu sil">✕</button></div>`}).join("");
  openSheet(`<h3>${esc(s.n)}</h3><div class="mut sm">${esc(s.u)}${f?" · "+labFlagTxt(f):""}</div><div style="margin:10px 0">${s.pts.length>1?labSvg(s,320,150):`<p class="hint">Grafik için aynı testten en az iki sonuç gerekir.</p>`}</div>
  <div class="mut sm">Gölgeli bölge raporda yazan aralıktır.</div><div style="max-height:34vh;overflow:auto">${rows}</div><button class="btn ghost" data-lab="close" style="margin-top:10px">Kapat</button>`);
}

function labRowHtml(r,i){
  const inp=(id,v,ph,cls,mode)=>`<input class="in ${cls||""}" id="${id}${i}" value="${esc(v==null?"":v)}" placeholder="${ph}" ${mode?`inputmode="${mode}"`:""} autocomplete="off" style="margin:0;padding:9px 10px;font-size:16px;min-width:0">`;
  return `<div class="card" style="padding:10px;margin-bottom:8px"><label style="min-height:44px;display:flex;align-items:center;gap:8px;margin-bottom:6px"><input type="checkbox" id="lc${i}" ${r.off?"":"checked"} style="width:22px;height:22px">${inp("ln",r.n,"Test adı","","")}</label>
  <div style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:6px">${inp("lv",(r.q||"")+(r.v==null?"":labFmt(r.v)),"Değer","num","decimal")}${inp("lu",r.u,"Birim","")}${inp("ll",r.lo==null?"":labFmt(r.lo),"Alt","num","decimal")}${inp("lh",r.hi==null?"":labFmt(r.hi),"Üst","num","decimal")}</div>${r.guess?`<div class="mut sm" style="margin-top:4px">Emin değilim: satırı kontrol et.</div>`:""}</div>`;
}
function labRender(){
  const dl=`<datalist id="labnames">${LabLib.DICT.map(d=>`<option value="${esc(d.n)}">`).join("")}</datalist>`;
  openSheet(`<h3>${labManual?"Tahlil ekle":"Okunan sonuçlar"}</h3>
  <div class="lbl">Numune tarihi${labDate?"":" (bulunamadı, seç)"}</div><input class="in" type="date" id="ld" value="${labDate}" max="${dayKey()}">
  <div class="mut sm" style="margin-bottom:8px">${labManual?"":"Kaydetmeden önce her satırı PDF'inle karşılaştır. Yanlış satırın işaretini kaldır ya da düzelt."}</div>
  <div style="max-height:46vh;overflow:auto">${labRows.map(labRowHtml).join("")}</div>${dl}
  <div class="lbtns"><button class="btn ghost" data-lab="addrow">＋ Satır</button><button class="btn" data-lab="save">Kaydet</button></div><button class="btn ghost" data-lab="close" style="margin-top:8px">Vazgeç</button>`);
  document.querySelectorAll('[id^="ln"]').forEach(e=>e.setAttribute("list","labnames"));
}
/* Ekrandaki düzenlemeleri labRows'a toplar (yeniden çizmeden önce kaybolmasın). */
function labCollect(){
  const g=id=>{const e=document.getElementById(id);return e?e.value:""};
  const d=document.getElementById("ld");if(d)labDate=d.value;
  labRows=labRows.map((r,i)=>({...r,n:g("ln"+i),vs:g("lv"+i),u:g("lu"+i),ls:g("ll"+i),hs:g("lh"+i),off:!(document.getElementById("lc"+i)||{}).checked}));
}
function labReview(parsed,manual){
  labManual=!!manual;labDate=parsed.date||"";
  labRows=parsed.rows.map(r=>({...r,orig:r.n,off:!!r.guess}));
  if(manual&&!labRows.length)labRows=[{n:"",v:undefined}];
  if(manual)labDate=dayKey();
  labRender();
}
function labSave(){
  labCollect();
  if(!LabLib.dayOk(labDate)||labDate>dayKey())return toast("Numune tarihini seç (bugünden ileri olamaz)");
  const out=[];let badN=0;
  for(const r of labRows){
    if(r.off)continue;
    const n=(r.n||"").trim(),vs=r.vs!=null?r.vs:((r.q||"")+(r.v==null?"":r.v));
    if(!n&&String(vs).trim()==="")continue;
    const q=/^\s*[<>]/.test(vs)?vs.trim()[0]:"",v=labNum(String(vs).replace(/^\s*[<>]=?/,"")),lo=labNum(r.ls!=null?r.ls:r.lo),hi=labNum(r.hs!=null?r.hs:r.hi);
    if(!n||v==null||(r.ls&&lo==null)||(r.hs&&hi==null)||(lo!=null&&hi!=null&&lo>hi)){badN++;continue}
    const o={day:labDate,n,k:n===(r.orig||r.n)&&r.k?r.k:LabLib.keyFor(n),v};
    if(q)o.q=q;if((r.u||"").trim())o.u=r.u.trim();if(lo!=null)o.lo=lo;if(hi!=null)o.hi=hi;
    out.push(o);
  }
  if(badN)return toast(`${badN} satırda ad ya da değer okunamadı, düzelt ya da işaretini kaldır`);
  if(!out.length)return toast("Kaydedilecek satır seçili değil");
  const before=S.labs.length;
  S.labs=LabLib.cleanLabs(S.labs.concat(out));save();
  const added=S.labs.length-before;
  closeSheet();tab="tahlil";render();window.scrollTo(0,0);
  toast(added===out.length?`${added} sonuç kaydedildi`:`${added} sonuç kaydedildi, ${out.length-added} tanesi zaten kayıtlıydı`);
}

async function labLoadPdf(){
  if(window.__labPdfLib)return window.__labPdfLib;
  const lib=await import("./vendor/pdfjs/pdf.min.js");
  lib.GlobalWorkerOptions.workerSrc=new URL("vendor/pdfjs/pdf.worker.min.js",document.baseURI).href;
  return lib;
}
async function labRead(data,password){
  toast("PDF okunuyor…");
  let ex;
  try{ex=await LabLib.extract(await labLoadPdf(),data.slice(),password)}catch(e){return toast("PDF okunamadı")}
  document.getElementById("toast").classList.remove("on");
  if(ex.need==="password"){
    labKeep=data;
    return openSheet(`<h3>Korumalı PDF</h3><p class="mut sm">${ex.wrong?"Parola yanlış. ":""}Laboratuvarın verdiği PDF parolasını yaz. Parola saklanmaz.</p><input class="in" id="labpw" type="password" autocomplete="off" autofocus><button class="btn" data-lab="pw">Aç</button><button class="btn ghost" data-lab="close" style="margin-top:8px">Vazgeç</button>`);
  }
  labKeep=null;
  if(ex.error)return toast(ex.error);
  if(ex.scanned)return openSheet(`<h3>Metin bulunamadı</h3><p class="mut">Bu PDF bir görüntü (taranmış ya da fotoğraf) olduğu için içindeki yazıyı okuyamıyorum. Değerleri elle ekleyebilirsin.</p><button class="btn" data-lab="add">${Icons.svg("plus")} Elle ekle</button><button class="btn ghost" data-lab="close" style="margin-top:8px">Kapat</button>`);
  const parsed=LabLib.parseLines(ex.lines,dayKey());
  if(!parsed.rows.length)return openSheet(`<h3>Sonuç bulunamadı</h3><p class="mut">PDF'te tanıyabildiğim bir sonuç satırı yok. Rapor düzeni farklı olabilir. Değerleri elle ekleyebilirsin.</p><button class="btn" data-lab="add">${Icons.svg("plus")} Elle ekle</button><button class="btn ghost" data-lab="close" style="margin-top:8px">Kapat</button>`);
  labReview(parsed,false);
}
async function labFile(f){
  if(!f)return;
  if(f.size>15e6)return toast("PDF çok büyük (en çok 15 MB)");
  let buf;try{buf=await f.arrayBuffer()}catch(e){return toast("Dosya okunamadı")}
  await labRead(new Uint8Array(buf));
}

const labB64=u8=>{let s="";for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s)};
const labUnb64=b=>{const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u};
/* Rapor sayfalarını tuvale çizip JPEG olarak PDF'e koyar. */
function labBuildReport(){
  const list=LabLib.series(S.labs),pages=LabLib.paginate(list);
  const info={today:dayKey(),count:list.length,rows:list.reduce((a,s)=>a+s.pts.length,0),total:pages.length};
  const jp=pages.map((items,i)=>{
    const c=document.createElement("canvas");c.width=LabLib.RW;c.height=LabLib.RH;
    LabLib.drawPage(c.getContext("2d"),items,{...info,page:i+1});
    return {data:labUnb64(c.toDataURL("image/jpeg",0.85).split(",")[1]),w:c.width,h:c.height};
  });
  return LabLib.buildPdf(jp);
}
/* Dosyayı paylaşım ekranına verir (telefonda), tarayıcıda indirir. data: utf8 true ise metin, değilse base64. */
async function shareFile(name,title,mime,data,utf8){
  const P=window.Capacitor&&window.Capacitor.Plugins,fs=P&&P.Filesystem,sh=P&&P.Share;
  if(fs&&sh){
    try{const f=await fs.writeFile(utf8?{path:name,data,directory:"CACHE",encoding:"utf8"}:{path:name,data,directory:"CACHE"});await sh.share({title,files:[f.uri]})}
    catch(e){if(!/cancel/i.test(e&&e.message||""))toast("Paylaşılamadı")}
    return;
  }
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([utf8?data:labUnb64(data)],{type:mime}));a.download=name;document.body.appendChild(a);a.click();a.remove();
}
const sharePdf=(pdf,name,title)=>shareFile(name,title,"application/pdf",labB64(pdf));
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
  else if(a==="close")closeSheet();
  else if(a==="add")labReview({date:"",rows:[]},true);
  else if(a==="addrow"){labCollect();labRows.push({n:"",v:undefined});labRender();const e=document.getElementById("ln"+(labRows.length-1));if(e)e.focus()}
  else if(a==="save")labSave();
  else if(a==="pdf")labExport();
  else if(a==="pw"){const pw=document.getElementById("labpw").value;if(pw&&labKeep){const d=labKeep;closeSheet();labRead(d,pw)}}
  else if(a==="del"){
    const id=+arg,r=S.labs.find(x=>x.id===id);if(!r)return;
    const sid=r.k+"|"+(r.u||""),backup=S.labs.slice();
    S.labs=S.labs.filter(x=>x.id!==id);save();
    if(S.labs.some(x=>x.k+"|"+(x.u||"")===sid))labDetail(sid);else{closeSheet()}
    render();
    toast("Sonuç silindi",()=>{S.labs=backup;save();render()});
  }
  else if(a==="delall"){if(confirm("Tüm tahlil kayıtları silinecek. Bu geri alınamaz. Devam edilsin mi?")){S.labs=[];save();render();toast("Tahlil kayıtları silindi")}}
});

/* Cihazda bir kez: tuval, JPEG, PDF üretimi ve gömülü pdf.js (işçi dahil) çalışıyor mu? Sonuç konsola yazılır, smoke testi okur. */
async function labSelfTest(){
  if(window.__noSelfTest)return;
  try{if(localStorage.getItem("nw_pdfok"))return}catch(e){}
  try{
    const lib=await labLoadPdf(),doc=await lib.getDocument({data:labBuildReport(),isEvalSupported:false,verbosity:0}).promise;
    console.log("NW-PDF ok pages="+doc.numPages);
    try{localStorage.setItem("nw_pdfok","1")}catch(e){}
  }catch(e){console.log("NW-PDF hata "+(e&&e.message||e))}
}
if(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())setTimeout(labSelfTest,4000);
