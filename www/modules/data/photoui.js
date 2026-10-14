"use strict";
/* Progress photos (Trend). Photos live in IndexedDB (they do not eat the localStorage quota) and never reach the backup, the Coach or sharing.
   Store "m" holds the thumbnail and metadata, store "f" the JPEG scaled to 900 px on its longest side. On Android screenshots are blocked while this screen is open (DeviceHelp.secure). */
let phList=[],phDbP=null,phUrls=[],phSecure=false;
const phRevoke=()=>{if(URL.revokeObjectURL)phUrls.forEach(u=>URL.revokeObjectURL(u));phUrls=[]};
const phOk=()=>typeof indexedDB!=="undefined"&&!!indexedDB;
const phReq=r=>new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const phDone=t=>new Promise((ok,no)=>{t.oncomplete=ok;t.onerror=t.onabort=()=>no(t.error)});
const phDb=()=>phDbP||(phDbP=new Promise((ok,no)=>{
  const r=indexedDB.open("nw_photos",1);
  r.onupgradeneeded=()=>{r.result.createObjectStore("m",{keyPath:"id"});r.result.createObjectStore("f")};
  r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);
}));
async function phLoad(){
  if(!phOk())return;
  try{const db=await phDb();phList=PhotoLib.order(await phReq(db.transaction("m").objectStore("m").getAll()))}catch(e){phList=[]}
  render();
}
async function phPut(m,blob){
  const t=(await phDb()).transaction(["m","f"],"readwrite");
  t.objectStore("m").put(m);t.objectStore("f").put(blob,m.id);await phDone(t);
}
async function phDel(id){
  const t=(await phDb()).transaction(["m","f"],"readwrite");
  t.objectStore("m").delete(id);t.objectStore("f").delete(id);await phDone(t);
}
/* Delete-all and privacy delete: the list empties at once and the store is cleared behind it; on failure the list is read back and false is returned. */
function phClear(){
  phList=[];phRevoke();
  if(!phOk())return true;
  return phDb().then(db=>{const t=db.transaction(["m","f"],"readwrite");t.objectStore("m").clear();t.objectStore("f").clear();return phDone(t)})
    .then(()=>true,()=>{toast("Fotoğraflar silinemedi, Ayarlar > Gizlilik ve veri'den yeniden dene");phLoad();return false});
}
function phGuard(){
  const on=tab==="trend"&&phList.length>0,d=DH();
  if(on===phSecure||!d||!d.secure)return;
  phSecure=on;d.secure({on}).catch(()=>{});
}
const phImg=file=>new Promise((ok,no)=>{
  const u=URL.createObjectURL(file),i=new Image();
  i.onload=()=>{URL.revokeObjectURL(u);ok(i)};i.onerror=()=>{URL.revokeObjectURL(u);no(new Error("image"))};i.src=u;
});
/* Longest side 900 px, JPEG quality 0.75; thumbnail 160 px. A transparent PNG is drawn on a white background. */
async function phShrink(file){
  const img=await phImg(file),d=PhotoLib.fit(img.naturalWidth,img.naturalHeight);
  if(!d)throw new Error("size");
  const draw=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");x.fillStyle="#fff";x.fillRect(0,0,w,h);x.drawImage(img,0,0,w,h);return c};
  const blob=await new Promise(r=>draw(d.w,d.h).toBlob(r,"image/jpeg",PhotoLib.QUALITY));
  if(!blob)throw new Error("jpeg-encode");
  const t=PhotoLib.fit(d.w,d.h,PhotoLib.THUMB);
  return {blob,thumb:draw(t.w,t.h).toDataURL("image/jpeg",0.6),w:d.w,h:d.h};
}
async function phUrl(id){
  const b=await phReq((await phDb()).transaction("f").objectStore("f").get(id));
  if(!b)return "";
  const u=URL.createObjectURL(b);phUrls.push(u);return u;
}
const phCap=p=>`${fd(p.day)}${p.kg!=null?" · "+dw(p.kg)+" "+wlab():""}`,phKg=p=>p.kg!=null?dw(p.kg)+" "+wlab():"";
const phTxt="Fotoğraflar yalnız bu telefonda, uygulamanın özel alanında durur. Rehber'e, bir sunucuya ya da paylaşım ekranına gitmez. Otomatik ve şifreli yedeğe girmez (boyut): telefon değiştirirsen ya da uygulamayı silersen kaybolur. Bu ekran açıkken Android ekran görüntüsü almayı engeller.",phNote=`<details class="acc"><summary>Gizlilik</summary><p class="m0 hint">${phTxt}</p></details>`;
function photoCard(){
  if(!phOk())return `<h2>İlerleme fotoğrafları</h2><div class="card"><p class="hint">Bu cihazda fotoğraf saklanamıyor.</p></div>`;
  const btns=`<div class="btns"><button class="btn ghost" data-ph="add"${PhotoLib.canAdd(phList.length)?"":" disabled"}>Fotoğraf ekle${phList.length?` (${phList.length}/${PhotoLib.MAX})`:""}</button>${phList.length>1?`<button class="btn ghost" data-ph="cmp">Karşılaştır</button>`:""}</div>`;
  const grid=phList.length?`<div class="phg">${phList.map(p=>`<button class="lnk" data-ph="view:${p.id}" aria-label="${phCap(p)} fotoğrafı"><img src="${p.thumb}" alt=""><span class="db sm num">${fd(p.day)}</span>${p.kg!=null?`<small class="db mut num">${phKg(p)}</small>`:""}</button>`).join("")}</div>`:`<p class="flush hint">Aynı ışıkta, aynı yerde çekilen fotoğraflar farkı gösterir. En çok ${PhotoLib.MAX} fotoğraf tutulur.</p>`;
  return `<h2>İlerleme fotoğrafları</h2><div class="card">${grid}${btns}${phNote}</div>`;
}
function sheetPhoto(){
  if(!PhotoLib.canAdd(phList.length))return toast(`En fazla ${PhotoLib.MAX} fotoğraf tutulur. Yenisi için birini sil`);
  const w=weights(keyOff(-7)),ds=Object.keys(w).sort(),last=ds.length?dw(w[ds[ds.length-1]]).replace(/,0$/,""):"";
  openSheet(`<h3>İlerleme fotoğrafı ekle</h3>${dayOptions()}
  <label class="lbl" for="phkg">Kilo etiketi (${wlab()}, isteğe bağlı)</label><input class="in num" id="phkg" inputmode="decimal" value="${last}" autocomplete="off">
  <div class="ferr" id="pherr" role="alert"></div>
  <div class="two"><label class="tc btn">Fotoğraf çek<input type="file" accept="image/*" capture="environment" data-phf="1" hidden></label><label class="tc btn ghost">Galeriden seç<input type="file" accept="image/*" data-phf="1" hidden></label></div>
  <p class="hint">Fotoğraf telefonda küçültülür (en uzun kenar ${PhotoLib.LONG} px). ${phTxt}</p>`);
}
async function phAdd(file){
  const kr=$("#phkg").value.trim(),kg=kr?PhotoLib.kgLabel(Units.wIn(num(kr))):null,day=fday();
  if(kg===undefined)return ferr("pherr",`Kilo etiketi ${dw(PhotoLib.KG[0],0)} ile ${dw(PhotoLib.KG[1],0)} ${wlab()} arası olmalı ya da boş bırak`);
  try{
    const r=await phShrink(file);
    if(!PhotoLib.canAdd(phList.length))return ferr("pherr",`En fazla ${PhotoLib.MAX} fotoğraf tutulur`);
    const m={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),day,t:Date.now(),kg,thumb:r.thumb};
    await phPut(m,r.blob);
    phList=PhotoLib.order([...phList,m]);closeSheet();render();toast("Fotoğraf eklendi");
  }catch(e){ferr("pherr","Fotoğraf eklenemedi, başka bir görüntü dene")}
}
async function sheetPhotoView(id){
  const p=phList.find(x=>x.id===id);if(!p)return;
  openSheet(`<h3>${phCap(p)}</h3><img id="phbig" class="phbig" alt="İlerleme fotoğrafı, ${phCap(p)}"><div class="mt-3 two"><button class="btn ghost" data-ph="cmp:${id}"${phList.length>1?"":" disabled"}>Karşılaştır</button><button class="btn danger" data-ph="del:${id}">Sil</button></div>`);
  const u=await phUrl(id),im=$("#phbig");if(im&&u)im.src=u;
}
function phDelAsk(id){
  const p=phList.find(x=>x.id===id);if(!p)return;
  confirmSheet({title:"Fotoğraf silinsin mi?",body:`${phCap(p)} fotoğrafı silinecek. Bu geri alınamaz. Silinsin mi?`,ok:"Sil",danger:true}).then(ok=>{if(ok)phDelDo(id)});
}
function phDelDo(id){
  phDel(id).then(()=>{phList=phList.filter(x=>x.id!==id);closeSheet();render();toast("Fotoğraf silindi")}).catch(()=>toast("Fotoğraf silinemedi"));
}
async function phCmp(){
  const a=phList.find(x=>x.id===$("#pha").value),b=phList.find(x=>x.id===$("#phb").value);if(!a||!b)return;
  phRevoke();
  const [ua,ub]=await Promise.all([phUrl(a.id),phUrl(b.id)]);
  const ia=$("#phia"),ib=$("#phib");if(!ia||!ib)return;
  ia.src=ua;ib.src=ub;$("#phka").textContent=phKg(a);$("#phkb").textContent=phKg(b);
  const g=PhotoLib.gap(a,b);
  $("#phgap").textContent=`${Math.abs(g.days)} gün arayla${g.kg!=null?`, ${dwS(g.kg)} ${wlab()}`:""}`;
}
function sheetPhotoCmp(a){
  if(phList.length<2)return;
  const opt=sel=>phList.map(p=>`<option value="${p.id}"${p.id===sel?" selected":""}>${fd(p.day)}</option>`).join(""),
    first=a||phList[0].id,last=phList[phList.length-1].id,b=last===first?phList[phList.length-2].id:last;
  openSheet(`<h3>Karşılaştır</h3><div class="two"><div><label class="lbl" for="pha">Önce</label><select class="in" id="pha">${opt(first)}</select><img id="phia" alt="Önceki fotoğraf" class="w100 rxs mt-2"><div class="mut num" id="phka"></div></div>
  <div><label class="lbl" for="phb">Sonra</label><select class="in" id="phb">${opt(b)}</select><img id="phib" alt="Sonraki fotoğraf" class="w100 rxs mt-2"><div class="mut num" id="phkb"></div></div></div>
  <p class="mt-2 mut sm num" id="phgap" role="status"></p>`);
  phCmp();
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ph]");if(!el)return;
  const [a,id]=el.dataset.ph.split(":");
  if(a==="add")sheetPhoto();
  else if(a==="view")sheetPhotoView(id);
  else if(a==="cmp")sheetPhotoCmp(id);
  else if(a==="del")phDelAsk(id);
});
document.addEventListener("change",ev=>{
  const t=ev.target;
  if(t.dataset&&t.dataset.phf){const f=t.files&&t.files[0];t.value="";if(f)phAdd(f)}
  else if(t.id==="pha"||t.id==="phb")phCmp();
});
document.addEventListener("nw:boot",phLoad); // after the main script (render, S) has run
Data.privacy.push(["İlerleme fotoğrafları",()=>phList.length,()=>phClear(),11]);
