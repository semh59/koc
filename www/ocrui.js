"use strict";
/* Fotoğraftan yazı okuma arayüzü: besin etiketi ve tahlil raporu. Okuma telefonda yapılır (ML Kit), fotoğraf hiçbir yere gönderilmez.
   index.html'deki S, save, toast, openSheet, closeSheet, esc, dayKey, sheetPorsiyon, myFoodPut ile birlikte çalışır. */
const ocrPlugin=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Ocr;
let ocrKind="",etiketOk=false;

function ocrBtn(kind,label,cls){
  return ocrPlugin()?`<button class="btn ${cls||"ghost"}" data-ocr="choose:${kind}" style="margin-bottom:8px">${label}</button>`:"";
}
function ocrChoose(kind){
  const tip=kind==="etiket"?"Etiketteki besin değerleri tablosunu düz tut, iyi ışıkta çek. Tablo çerçeveyi doldursun, parlama olmasın.":"Raporu düz bir zemine koy, sayfanın tamamı ve yazılar net görünsün. Çok sayfa varsa her sayfayı ayrı oku.";
  openSheet(`<h3>${kind==="etiket"?"Etiket oku":"Tahlil fotoğrafı"}</h3><p class="mut sm">${tip} Yazı telefonda okunur, fotoğraf hiçbir yere gönderilmez.</p>
  <button class="btn" data-ocr="cam:${kind}" style="margin-bottom:8px">📷 Fotoğraf çek</button><button class="btn ghost" data-ocr="gal:${kind}">🖼 Galeriden seç</button><button class="btn ghost" data-ocr="close" style="margin-top:8px">Vazgeç</button>`);
}
/* Dokunma işleyicisinin içinde eşzamanlı çağrılmalı (tarayıcı kullanıcı hareketi ister). */
function ocrPick(capture,kind){
  ocrKind=kind;
  const i=document.createElement("input");i.type="file";i.accept="image/*";if(capture)i.setAttribute("capture","environment");i.hidden=true;
  i.addEventListener("change",()=>{const f=i.files&&i.files[0];i.remove();if(f)ocrRun(kind,f)});
  document.body.appendChild(i);i.click();
}
async function ocrImage(file){
  let bmp;
  try{bmp=await createImageBitmap(file,{imageOrientation:"from-image"})}catch(e){bmp=await createImageBitmap(file)}
  const sc=Math.min(1,1800/Math.max(bmp.width,bmp.height)),c=document.createElement("canvas");
  c.width=Math.max(1,Math.round(bmp.width*sc));c.height=Math.max(1,Math.round(bmp.height*sc));
  c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
  return c.toDataURL("image/jpeg",0.9).split(",")[1];
}
async function ocrRun(kind,file){
  const P=ocrPlugin();if(!P)return toast("Yazı okuma yalnızca telefondaki uygulamada çalışır");
  if(file.size>30e6)return toast("Fotoğraf çok büyük");
  closeSheet();toast("Yazı okunuyor…");
  let lines;
  try{lines=LabLib.ocrToLines(await P.recognize({image:await ocrImage(file)}))}
  catch(e){return toast("Fotoğraf okunamadı, daha net çekip tekrar dene")}
  document.getElementById("toast").classList.remove("on");
  if(!lines.length)return openSheet(`<h3>Yazı bulunamadı</h3><p class="mut">Fotoğrafta okunabilir yazı yok. Daha yakından, düz ve aydınlık çekip tekrar dene.</p>${ocrBtn(kind,"📷 Tekrar dene","")}<button class="btn ghost" data-ocr="close">Kapat</button>`);
  if(kind==="tahlil"){
    const parsed=LabLib.parseLines(lines,dayKey());
    if(!parsed.rows.length)return openSheet(`<h3>Sonuç bulunamadı</h3><p class="mut">Fotoğraftaki yazıdan tahlil satırı çıkaramadım. Daha net çekip tekrar dene ya da değerleri elle ekle.</p>${ocrBtn("tahlil","📷 Tekrar dene","")}<button class="btn ghost" data-lab="add">➕ Elle ekle</button>`);
    return labReview(parsed,false);
  }
  etiketReview(LabelLib.parse(lines));
}

const etFmt=v=>v==null?"":String(Number(v.toFixed(1))).replace(".",",");
const ETX=[["fb","Lif","g"],["sg","Şeker","g"],["na","Sodyum","mg"]];
function etiketReview(r){
  etiketOk=false;
  const f=r.food,miss=[["k","kalori"],["p","protein"],["c","karbonhidrat"],["f","yağ"]].filter(([k])=>f[k]==null).map(x=>x[1]);
  const inp=(id,v,ph)=>`<input class="in num" id="${id}" value="${etFmt(v)}" placeholder="${ph}" inputmode="decimal" autocomplete="off">`;
  openSheet(`<h3>Etiketten okunan</h3><input class="in" id="en" placeholder="Ürünün adı (zorunlu)" autocomplete="off" autofocus>
  <div class="mut sm" style="margin-bottom:8px">100 g başına değerler. ${miss.length?`Okunamayan: ${miss.join(", ")}. Etiketten bakıp yaz.`:"Etiketle karşılaştırıp kontrol et."}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div class="lbl">Kalori (kcal)</div>${inp("ek",f.k,"kcal")}</div><div><div class="lbl">Protein (g)</div>${inp("ep",f.p,"g")}</div><div><div class="lbl">Karbonhidrat (g)</div>${inp("ec",f.c,"g")}</div><div><div class="lbl">Yağ (g)</div>${inp("ef",f.f,"g")}</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">${ETX.map(([k,n,u])=>`<div><div class="lbl">${n}</div>${inp("e"+k,f[k],u)}</div>`).join("")}</div>
  <div class="hint" id="ewarn" role="alert"></div><button class="btn" data-ocr="esave">Kaydet ve ekle</button><button class="btn ghost" data-ocr="close" style="margin-top:8px">Vazgeç</button>`);
}
function etiketSave(){
  const g=id=>{const e=document.getElementById(id);return e?e.value.trim():""},n=g("en").slice(0,60);
  if(!n)return toast("Ürünün adını yaz");
  const v=id=>{const s=g(id);return s===""?undefined:LabLib.toNum(s.replace(/^[<>]\s*/,""))};
  const f={k:v("ek"),p:v("ep"),c:v("ec"),f:v("ef")};
  for(const [k] of ETX)f[k]=v("e"+k);
  for(const [id,x] of [["ek",f.k],["ep",f.p],["ec",f.c],["ef",f.f],...ETX.map(([k])=>["e"+k,f[k]])])if(g(id)!==""&&x==null)return toast("Sayı olarak yaz, örneğin 8,5");
  if(f.k==null)return toast("Kalori gerekli: etiketteki 100 g başına kcal değerini yaz");
  const ew=document.getElementById("ewarn");
  if(f.sg!=null&&f.c!=null&&f.sg>f.c+0.5){ew.textContent="Şeker, karbonhidrattan büyük olamaz: değerleri etiketle karşılaştır ya da şeker kutusunu boş bırak.";return}
  const big=ETX.find(([k])=>f[k]!=null&&!(f[k]>=0&&f[k]<=(k==="na"?40000:100)));
  if(big){ew.textContent=`${big[1]} değeri 100 g için makul değil (${big[0]==="na"?"0-40.000 mg":"0-100 g"}).`;return}
  const c=LabelLib.check(n,f);
  if(c.status==="bad"&&!etiketOk){
    etiketOk=true;ew.textContent=`${c.why}. Fotoğraf yanlış okunmuş olabilir: değerleri etiketle karşılaştır. Doğruysa tekrar Kaydet'e dokun.`;return;
  }
  if(!(f.k>=0&&f.k<=900))return toast("Kalori 100 g için 0-900 olmalı");
  const food={n,k:Math.round(f.k*10)/10,u:[["100 g",100]]};
  for(const m of ["p","c","f"])if(f[m]!=null&&f[m]>=0&&f[m]<=100)food[m]=f[m];
  for(const [m] of ETX)if(f[m]!=null)food[m]=Math.round(f[m]*10)/10;
  if(!myFoodPut(food))return toast("Besin listesi dolu (en çok 200)");
  save();
  const i=S.myFoods.findIndex(m=>m.n===n);
  closeSheet();sheetPorsiyon(i);
}

document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ocr]");if(!el)return;
  const [a,arg]=el.dataset.ocr.split(/:(.*)/s);
  if(a==="choose")ocrChoose(arg);
  else if(a==="cam")ocrPick(true,arg);
  else if(a==="gal")ocrPick(false,arg);
  else if(a==="esave")etiketSave();
  else if(a==="close")closeSheet();
});

/* Cihazda bir kez: tuvale yazı çiz, ML Kit'e oku. Sonuç konsola yazılır, smoke testi okur. */
async function ocrSelfTest(){
  if(window.__noSelfTest)return;
  try{if(localStorage.getItem("nw_ocrok"))return}catch(e){}
  try{
    const c=document.createElement("canvas");c.width=900;c.height=220;
    const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,900,220);x.fillStyle="#000";x.font="bold 80px sans-serif";x.textBaseline="middle";x.fillText("Enerji 440 kcal",40,110);
    const r=await ocrPlugin().recognize({image:c.toDataURL("image/jpeg",0.95).split(",")[1]});
    const txt=(r.lines||[]).map(l=>l.t).join(" ");
    if(/440/.test(txt)){console.log("NW-OCR ok");try{localStorage.setItem("nw_ocrok","1")}catch(e){}}
    else console.log("NW-OCR hata okunan="+txt);
  }catch(e){console.log("NW-OCR hata "+(e&&e.message||e))}
}
if(ocrPlugin())setTimeout(ocrSelfTest,6000);
