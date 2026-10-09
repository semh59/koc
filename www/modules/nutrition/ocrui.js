"use strict";
/* Photo text reading UI: nutrition label and lab report. Reading runs on the phone (ML Kit); the photo is sent nowhere.
   Works with S, save, toast, openSheet, closeSheet, esc, dayKey, sheetPortion, myFoodPut, MYFOODS_MAX from the main shell. */
let labelWarned=false;

const ocrBtn=(kind,label)=>plugin("Ocr")?`<button class="mb-2 btn ghost" data-ocr="choose:${kind}">${label}</button>`:"";
function ocrChoose(kind){
  const tip=kind==="label"?"Etiketteki besin değerleri tablosunu düz tut, iyi ışıkta çek. Tablo çerçeveyi doldursun, parlama olmasın.":"Raporu düz bir zemine koy, sayfanın tamamı ve yazılar net görünsün. Çok sayfa varsa her sayfayı ayrı oku.";
  openSheet(`<h3>${kind==="label"?"Etiket oku":"Tahlil fotoğrafı"}</h3><p class="mut sm">${tip} Yazı telefonda okunur, fotoğraf hiçbir yere gönderilmez.</p>
  <button class="mb-2 btn" data-ocr="cam:${kind}">${Icons.svg("camera")} Fotoğraf çek</button><button class="btn ghost" data-ocr="gal:${kind}">${Icons.svg("image")} Galeriden seç</button><button class="mt-2 btn ghost" data-ocr="close">Vazgeç</button>`);
}
// Must be called synchronously inside the tap handler (the browser requires a user gesture).
function ocrPick(capture,kind){
  const i=document.createElement("input");i.type="file";i.accept="image/*";if(capture)i.setAttribute("capture","environment");i.hidden=true;
  i.addEventListener("change",()=>{const f=i.files?.[0];i.remove();if(f)ocrRun(kind,f)});
  document.body.appendChild(i);i.click();
}
// Returns the photo as base64 JPEG, longest side at most 1800 px.
async function ocrImage(file){
  let bmp;
  try{bmp=await createImageBitmap(file,{imageOrientation:"from-image"})}catch{bmp=await createImageBitmap(file)} // older WebViews reject the options argument
  const sc=Math.min(1,1800/Math.max(bmp.width,bmp.height)),c=document.createElement("canvas");
  c.width=Math.max(1,Math.round(bmp.width*sc));c.height=Math.max(1,Math.round(bmp.height*sc));
  c.getContext("2d").drawImage(bmp,0,0,c.width,c.height);
  return c.toDataURL("image/jpeg",0.9).split(",")[1];
}
async function ocrRun(kind,file){
  const P=plugin("Ocr");if(!P)return toast("Yazı okuma yalnızca telefondaki uygulamada çalışır");
  if(file.size>30e6)return toast("Fotoğraf çok büyük");
  closeSheet();toast("Yazı okunuyor…");
  let lines;
  try{lines=LabLib.ocrToLines(await P.recognize({image:await ocrImage(file)}))}
  catch{return toast("Fotoğraf okunamadı, daha net çekip tekrar dene")}
  document.getElementById("toast").classList.remove("on");
  if(!lines.length)return openSheet(`<h3>Yazı bulunamadı</h3><p class="mut">Fotoğrafta okunabilir yazı yok. Daha yakından, düz ve aydınlık çekip tekrar dene.</p>${ocrBtn(kind,Icons.svg("camera")+" Tekrar dene")}<button class="btn ghost" data-ocr="close">Kapat</button>`);
  if(kind==="labs"){
    const parsed=LabLib.parseLines(lines,dayKey());
    if(!parsed.rows.length)return openSheet(`<h3>Sonuç bulunamadı</h3><p class="mut">Fotoğraftaki yazıdan tahlil satırı çıkaramadım. Daha net çekip tekrar dene ya da değerleri elle ekle.</p>${ocrBtn("labs",Icons.svg("camera")+" Tekrar dene")}<button class="btn ghost" data-lab="add">${Icons.svg("plus")} Elle ekle</button>`);
    return labReview(parsed,false);
  }
  labelReview(LabelLib.parse(lines));
}

const labelNum=v=>v==null?"":String(Number(v.toFixed(1))).replace(".",",");
// [field, label, unit, maximum per 100 g]. The first four fill the main grid, the rest the extra row.
const KCAL_MAX=900;
const LABEL_FIELDS=[["k","Kalori","kcal",KCAL_MAX],["p","Protein","g",100],["c","Karbonhidrat","g",100],["f","Yağ","g",100],["fb","Lif","g",100],["sg","Şeker","g",100],["na","Sodyum","mg",40000]];
function labelReview(r){
  labelWarned=false;
  const f=r.food,miss=LABEL_FIELDS.slice(0,4).filter(([k])=>f[k]==null).map(x=>x[1].toLowerCase());
  const inp=(k,ph)=>`<input class="in num" id="e${k}" value="${labelNum(f[k])}" placeholder="${ph}" inputmode="decimal" autocomplete="off">`;
  openSheet(`<h3>Etiketten okunan</h3><input class="in" id="en" aria-label="Ürünün adı" placeholder="Ürünün adı (zorunlu)" autocomplete="off" autofocus>
  <div class="mb-2 mut sm">100 g başına değerler. ${miss.length?`Okunamayan: ${miss.join(", ")}. Etiketten bakıp yaz.`:"Etiketle karşılaştırıp kontrol et."}</div>
  <div class="g2">${LABEL_FIELDS.slice(0,4).map(([k,n,u])=>`<div><label class="lbl" for="e${k}">${n} (${u})</label>${inp(k,u)}</div>`).join("")}</div>
  <div class="g3 mt-2">${LABEL_FIELDS.slice(4).map(([k,n,u])=>`<div><label class="lbl" for="e${k}">${n}</label>${inp(k,u)}</div>`).join("")}</div>
  <div class="hint" id="ewarn" role="alert"></div><button class="btn" data-ocr="esave">Kaydet ve ekle</button><button class="mt-2 btn ghost" data-ocr="close">Vazgeç</button>`);
}
function labelSave(){
  const g=id=>document.getElementById(id)?.value.trim()??"",name=g("en").slice(0,60);
  if(!name)return toast("Ürünün adını yaz");
  const f={};
  for(const [k] of LABEL_FIELDS){
    const s=g("e"+k);if(s==="")continue;
    f[k]=LabLib.toNum(s.replace(/^[<>]\s*/,""));
    if(f[k]==null)return toast("Sayı olarak yaz, örneğin 8,5");
  }
  if(f.k==null)return toast("Kalori gerekli: etiketteki 100 g başına kcal değerini yaz");
  const ew=document.getElementById("ewarn");
  if(f.sg!=null&&f.c!=null&&f.sg>f.c+0.5){ew.textContent="Şeker, karbonhidrattan büyük olamaz: değerleri etiketle karşılaştır ya da şeker kutusunu boş bırak.";return}
  const big=LABEL_FIELDS.slice(1).find(([k,,,max])=>f[k]!=null&&!(f[k]>=0&&f[k]<=max));
  if(big){ew.textContent=`${big[1]} değeri 100 g için makul değil (0-${big[3].toLocaleString("tr-TR")} ${big[2]}).`;return}
  const c=LabelLib.check(name,f);
  if(c.status==="bad"&&!labelWarned){
    labelWarned=true;ew.textContent=`${c.why}. Fotoğraf yanlış okunmuş olabilir: değerleri etiketle karşılaştır. Doğruysa tekrar Kaydet'e dokun.`;return;
  }
  if(!(f.k>=0&&f.k<=KCAL_MAX))return toast("Kalori 100 g için 0-900 olmalı");
  const food={n:name,u:[["100 g",100]]};
  for(const [k] of LABEL_FIELDS)if(f[k]!=null)food[k]=Math.round(f[k]*10)/10;
  if(!myFoodPut(food))return toast(`Besin listesi dolu (en çok ${MYFOODS_MAX})`);
  save();
  const i=S.myFoods.findIndex(m=>m.n===name);
  closeSheet();sheetPortion(i);
}

document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ocr]");if(!el)return;
  const [a,arg]=el.dataset.ocr.split(/:(.*)/s);
  if(a==="choose")ocrChoose(arg);
  else if(a==="cam")ocrPick(true,arg);
  else if(a==="gal")ocrPick(false,arg);
  else if(a==="esave")labelSave();
  else if(a==="close")closeSheet();
});

/* Once per device: draw text on a canvas and have ML Kit read it. The result goes to the console, where the smoke test reads it. */
async function ocrSelfTest(){
  const P=plugin("Ocr");
  if(!P||window.__noSelfTest)return;
  try{if(localStorage.getItem("nw_ocrok"))return}catch{}
  try{
    const c=document.createElement("canvas");c.width=900;c.height=220;
    const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,900,220);x.fillStyle="#000";x.font="bold 80px sans-serif";x.textBaseline="middle";x.fillText("Enerji 440 kcal",40,110);
    const r=await P.recognize({image:c.toDataURL("image/jpeg",0.95).split(",")[1]});
    const txt=(r.lines||[]).map(l=>l.t).join(" ");
    if(/440/.test(txt)){console.log("NW-OCR ok");try{localStorage.setItem("nw_ocrok","1")}catch{}}
    else console.log("NW-OCR hata okunan="+txt);
  }catch(e){console.log("NW-OCR hata "+(e&&e.message||e))}
}
setTimeout(ocrSelfTest,6000);
