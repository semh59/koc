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
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(s.n)} grafiği" class="lsv">${bd}<rect x="8" y="8" width="${W-16}" height="${H-28}" fill="none" stroke="var(--line)"/>${line}${dots}<text x="8" y="${H-6}">${fd(first)}</text>${s.pts.length>1?`<text x="${W-8}" y="${H-6}" text-anchor="end">${fd(last)}</text>`:""}</svg>`;
}
const labFlagTxt=f=>f==="high"?"▲ Raporda yazan aralığın üstünde":f==="low"?"▼ Raporda yazan aralığın altında":"";
/* Durum her zaman işaret ve metinle: renk tek başına anlam taşımaz. */
const labStat=(p,rt)=>{const f=LabLib.flag(p);return f?`<div class="b7 sm">${labFlagTxt(f)}</div>`:rt&&p.lo!=null&&p.hi!=null?`<div class="mut sm">✓ Raporda yazan aralıkta</div>`:""};
/* Aralık şeridi: ortadaki yarı raporda yazan aralık, işaret değerin konumu (iki uç da biliniyorsa). */
const labBar=p=>{if(p.lo==null||p.hi==null||!(p.hi>p.lo))return "";const w=p.hi-p.lo,x=Math.max(0,Math.min(100,(p.v-p.lo+w/2)/(2*w)*100));return `<span class="lbar" aria-hidden="true"><i style="left:${x.toFixed(1)}%"></i></span>`};
/* Tanım: yalnız sözlükteki kalemlerde, yalnız testin ne olduğu; yorum yok. */
const labInfoBox=(k,id,hid)=>{const d=LabLib.info(k);return d?`<div id="${id}" class="helpx" ${hid?"hidden":""}><b class="db">${esc(d.n)} nedir</b>${esc(d.e)}</div>`:""};

function labCard(s,i){
  const last=s.pts[s.pts.length-1],rt=LabLib.rangeText(last),d=LabLib.info(s.k);
  return `<div class="card labc"><button class="labo" data-lab="open:${esc(s.id)}"><span class="labh"><b>${esc(s.n)}</b><small class="db mut sm">${d?esc(d.c)+" · ":""}${fd(last.day)}</small></span>
  <span class="db t-h2 b7 num">${last.q||""}${labFmt(last.v)} <small class="mut">${esc(s.u)}</small></span>${labStat(last,rt)}${labBar(last)}${rt?`<span class="db mut sm num">Rapor aralığı: ${esc(rt)}</span>`:""}${s.pts.length>1?`<span class="db mt-2">${labSvg(s,300,80)}</span>`:""}</button>
  ${d?`<button class="help" data-lab="info:${i}" aria-expanded="false" aria-controls="li${i}" aria-label="${esc(s.n)} nedir">${Icons.svg("info")}</button>${labInfoBox(s.k,"li"+i,1)}`:""}</div>`;
}
function viewTahlil(){
  const list=LabLib.series(S.labs).sort((a,b)=>a.pts[a.pts.length-1].day<b.pts[b.pts.length-1].day?1:-1),txt=S.labs.filter(r=>r.t);
  const isOut=s=>!!LabLib.flag(s.pts[s.pts.length-1]),out=list.filter(isOut),rest=list.filter(s=>!isOut(s));
  let i=0;const cards=a=>a.map(s=>labCard(s,i++)).join("");
  const body=out.length?`<div class="grp">Raporda yazan aralığın dışında (${out.length})</div>${cards(out)}${rest.length?`<div class="grp">Diğer sonuçlar</div>${cards(rest)}`:""}`:cards(rest);
  const nTxt=txt.length?`<p class="hint">${txt.length} yazılı sonuç (ör. Negatif) kayıtlı. Bunlar grafikte gösterilmez, PDF'e eklenmez.</p>`:"";
  return `<div class="card"><div class="lbl">Tahlil sonuçları</div>
    <p class="m0 mb-3 mut sm">PDF'ten okut ya da elle ekle. Veriler yalnızca bu telefonda kalır. Raporda yazan aralık olduğu gibi gösterilir; uygulama yorum yapmaz. Bu değerleri hekiminle değerlendir.</p>
    <div class="btns"><label class="tc btn">${Icons.svg("file")} PDF'ten oku<input id="labfile" type="file" accept="application/pdf,.pdf" hidden></label>
    ${ocrBtn("tahlil",Icons.svg("camera")+" Fotoğraftan oku")}<button class="btn ghost" data-lab="add">${Icons.svg("plus")} Elle ekle</button></div></div>
  ${body||`${emptyCard("file","Henüz tahlil sonucu yok","İlk PDF'ini okutarak başla.")}`}${nTxt}
  ${S.labs.length?`<button class="mt-2 btn danger" data-lab="delall">Tüm tahlil kayıtlarını sil</button>`:""}`;
}
function labTrendCard(){
  const n=LabLib.series(S.labs).length,d=S.labs.length?S.labs.map(r=>r.day).sort().pop():"";
  return navRow('data-tab="tahlil"',"file","Tahlil takibi",n?`Son sonuç: ${fd(d)}`:"PDF'ten okut ya da elle ekle");
}

function labDetail(id){
  const s=LabLib.series(S.labs).find(x=>x.id===id);
  if(!s){closeSheet();return render()}
  const last=s.pts[s.pts.length-1],rt=LabLib.rangeText(last);
  const rows=[...s.pts].reverse().map(p=>{const pf=LabLib.flag(p),r=LabLib.rangeText(p);return `<div class="row"><span class="grow">${fd(p.day)}${r?`<small class="db mut num">Aralık ${esc(r)}</small>`:""}</span><span class="ta-r"><b class="num">${p.q||""}${labFmt(p.v)}</b>${pf?`<small class="db b7">${pf==="high"?"▲ Üstünde":"▼ Altında"}</small>`:""}</span><button class="del" data-lab="del:${p.id}" aria-label="${fd(p.day)} sonucunu sil">${Icons.svg("x")}</button></div>`}).join("");
  openSheet(`<h3>${esc(s.n)}</h3><div class="ink sumv num">${last.q||""}${labFmt(last.v)} <small>${esc(s.u)}</small></div>${labStat(last,rt)}<div class="mut sm">${fd(last.day)}${rt?" · Rapor aralığı: "+esc(rt):""}</div>
  <div class="mt-3">${labInfoBox(s.k,"lid",0)}</div><div class="my-2">${s.pts.length>1?labSvg(s,320,150):`<p class="hint">Grafik için aynı testten en az iki sonuç gerekir.</p>`}</div>
  <p class="hint">${s.pts.length>1&&rt?"Gölgeli bölge raporda yazan aralıktır. ":""}Tanım yalnızca testin ne olduğunu anlatır; tanı veya yorum değildir.</p><div class="grp">Sonuçlar</div>${rows}<button class="mt-3 btn ghost" data-lab="close">Kapat</button>`);
}

function labRowHtml(r,i){
  const inp=(id,v,ph,cls,mode)=>`<input class="in ${cls||""}" id="${id}${i}" value="${esc(v==null?"":v)}" placeholder="${ph}" ${mode?`inputmode="${mode}"`:""} autocomplete="off">`;
  const f=(lab,h)=>`<label class="labf"><span>${lab}</span>${h}</label>`;
  return `<div class="card labr"><div class="dl mb-2"><label class="grow labf"><span>Test adı</span>${inp("ln",r.n,"örn. Glukoz","","")}</label><label class="sw" aria-label="Satırı kaydet"><input type="checkbox" id="lc${i}" ${r.off?"":"checked"}><span></span></label></div>
  <div class="labg">${f("Değer",inp("lv",(r.q||"")+(r.v==null?"":labFmt(r.v)),"","num","decimal"))}${f("Birim",inp("lu",r.u,"",""))}${f("Alt sınır",inp("ll",r.lo==null?"":labFmt(r.lo),"","num","decimal"))}${f("Üst sınır",inp("lh",r.hi==null?"":labFmt(r.hi),"","num","decimal"))}</div>${r.guess?`<div class="mt-1 b7 sm">${Icons.svg("info")} Emin değilim: satırı PDF'inle karşılaştır.</div>`:""}</div>`;
}
function labRender(){
  const dl=`<datalist id="labnames">${LabLib.DICT.map(d=>`<option value="${esc(d.n)}">`).join("")}</datalist>`;
  openSheet(`<h3>${labManual?"Tahlil ekle":"Okunan sonuçlar"}</h3>
  <div class="lbl">Numune tarihi${labDate?"":" (bulunamadı, seç)"}</div><input class="in" type="date" id="ld" value="${labDate}" max="${dayKey()}">
  <div class="mb-2 mut sm">${labManual?"":"Kaydetmeden önce her satırı PDF'inle karşılaştır. Yanlış satırın işaretini kaldır ya da düzelt."}</div>
  <div class="lscroll">${labRows.map(labRowHtml).join("")}</div>${dl}
  <div class="lbtns"><button class="btn ghost" data-lab="addrow">＋ Satır</button><button class="btn" data-lab="save">Kaydet</button></div><button class="mt-2 btn ghost" data-lab="close">Vazgeç</button>`);
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
  const lib=await import("../../vendor/pdfjs/pdf.min.js");
  lib.GlobalWorkerOptions.workerSrc=new URL("vendor/pdfjs/pdf.worker.min.js",document.baseURI).href;
  return lib;
}
let labCancel=false;
/* Taranmış PDF: sayfa sayfa tuvale çizilip yalnız yerel ML Kit'e verilir (en çok 6 sayfa, bellek için sırayla). */
const labOcr=()=>{
  const P=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Ocr;
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
  let ex;
  const ocr=labOcr();labCancel=false;
  try{
    const lib=await labLoadPdf(),ex1=await LabLib.extract(lib,data.slice(),password);
    ex=ex1;
    if(ex1.scanned&&ocr){
      openSheet(`<h3>Taranmış PDF</h3><p class="mut sm">Yazı telefonda okunur, hiçbir yere gönderilmez. En çok ilk 6 sayfa okunur.</p><p id="labprog" role="status">Hazırlanıyor…</p><button class="btn ghost" data-lab="cancel">Vazgeç</button>`);
      ex=await LabLib.extract(lib,data.slice(),password,ocr);
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
  if(ex.limited)toast(`Taranmış PDF: yalnız ilk ${ex.limited.read} sayfa okundu (toplam ${ex.limited.total})`);
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
/* Paylaşım için önbelleğe yazılan dosyalar (yedek, rapor, CSV) paylaşım bitince de kalmasın: hedef uygulama dosyayı geç okuyabileceği için hemen değil,
   bir sonraki yazımdan önce ve her açılışta silinir. Şifreli de olsa yedek dosyası telefonda gereksiz durmaz. */
async function cacheClean(){
  const fs=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Filesystem;if(!fs)return;
  try{const r=await fs.readdir({path:"",directory:"CACHE"});for(const f of r.files||[]){const n=f.name||f;if(/^neowell-.+\.(json|pdf|csv|txt|zip)$/.test(n))await fs.deleteFile({path:n,directory:"CACHE"}).catch(()=>{})}}catch(e){}
}
document.addEventListener("nw:boot",cacheClean);
async function shareFile(name,title,mime,data,utf8){
  const P=window.Capacitor&&window.Capacitor.Plugins,fs=P&&P.Filesystem,sh=P&&P.Share;
  if(fs&&sh){
    try{await cacheClean();const f=await fs.writeFile(utf8?{path:name,data,directory:"CACHE",encoding:"utf8"}:{path:name,data,directory:"CACHE"});await sh.share({title,files:[f.uri]})}
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
  else if(a==="info"){const b=document.getElementById("li"+arg),on=b.hidden;b.hidden=!on;el.setAttribute("aria-expanded",on)}
  else if(a==="close")closeSheet();
  else if(a==="cancel"){labCancel=true;closeSheet()}
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
  else if(a==="delall")confirmSheet({title:"Tüm tahlil kayıtları silinsin mi?",body:"Tüm tahlil kayıtları silinecek. Bu geri alınamaz. Devam edilsin mi?",ok:"Hepsini sil",danger:true}).then(ok=>{if(ok){S.labs=[];save();render();toast("Tahlil kayıtları silindi")}});
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
