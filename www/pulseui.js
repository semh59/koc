"use strict";
/* Nabız ekranı: kamerayla ölçüm (parmak arka kamera ve flaşın üstünde) ve saatten gelen günlük nabız. Sağlık cihazı değildir; sayıyı yorumlamaz.
   S, save, toast, render, openSheet, closeSheet, dayKey, fd, esc, $ index.html'dedir; algoritma pulselib.js'te. */
const PL_SEC=30;
let pl=null; // çalışan ölçüm: {stream,video,cv,ctx,raf,samples,t0,torch}
let plRes=null; // {bpm} sonuç, kaydedilmeyi bekler
const plPad=n=>String(n).padStart(2,"0");
const plNow=()=>{const d=new Date();return plPad(d.getHours())+":"+plPad(d.getMinutes())};
const plHave=()=>!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);

function plStop(){
  const p=pl;pl=null;if(!p)return;
  if(p.raf)p.video.cancelVideoFrameCallback?p.video.cancelVideoFrameCallback(p.raf):cancelAnimationFrame(p.raf);
  try{p.stream.getTracks().forEach(t=>{try{if(p.torch)t.applyConstraints({advanced:[{torch:false}]}).catch(()=>{})}catch(e){}t.stop()})}catch(e){}
  try{p.video.srcObject=null}catch(e){}
}
function plStats(){
  const h=S.hr.slice(-7).reverse();
  return h.length?`<div class="lbl">Saatten günlük nabız</div>${h.map(x=>`<div class="row"><span>${fd(x.day)}</span><b class="num">${x.a}${x.m?` <span class="mut sm">en düşük ${x.m}</span>`:""}</b></div>`).join("")}`:"";
}
function plSheet(){
  plStop();plRes=null;
  const list=S.pulse.slice(-8).reverse().map(x=>`<div class="row"><span>${fd(x.day)} ${x.time}</span><b class="num">${x.bpm}</b><button class="del" data-pl="del:${x.id}" aria-label="Kaydı sil">✕</button></div>`).join("");
  openSheet(`<h3>Nabız</h3>
  <p class="flush hint">Parmağını arka kameranın ve flaşın üstüne hafifçe koy. Ölçüm ${PL_SEC} saniye sürer; kıpırdama.</p>
  ${plHave()?`<button class="btn" data-pl="start">Kamerayla ölç</button>`:`<p class="hint">Bu cihazda kamera ölçümü kullanılamıyor.</p>`}
  <p class="hint">Sağlık cihazı değildir; sonuç sapabilir. Tıbbi karar için kullanma, şikâyetin varsa hekime başvur.</p>
  ${list?`<div class="lbl">Kamera ölçümlerin</div>${list}`:""}${plStats()}
  ${!S.hr.length&&!S.settings.hcOn?`<p class="hint">Saatinin nabzı için Adım raporunda <b>Saat verilerini al</b>'ı aç.</p>`:""}`);
}
const PL_WAIT="Parmağını kameraya ve flaşa koy",PL_GO="Ölçülüyor, kıpırdama";
/* Geri sayım role=timer (ekran okuyucu her saniye okumaz), yönerge role=status (yalnız değişince okunur). */
function plScreen(hint,pct){
  openSheet(`<h3>Nabız ölçülüyor</h3><div class="tc"><div class="big num" id="plmsg" role="timer" aria-live="off">${PL_SEC} sn</div><p class="hint" id="plhint" role="status">${hint}</p><div class="bar" aria-hidden="true"><i id="plbar" style="width:${pct}%"></i></div></div><button class="lnk" data-pl="cancel">Vazgeç</button>`);
}
const plSet=(id,txt)=>{const e=document.getElementById(id);if(e&&e.textContent!==txt)e.textContent=txt};
function plResult(r){
  plStop();
  if(r.ok){
    plRes={bpm:r.bpm};
    openSheet(`<h3>Nabız</h3><div class="tc"><div class="big num" id="plbpm">${r.bpm}</div><div class="mut">atım / dk</div></div>
    <button class="btn" data-pl="save">Kaydet</button><button class="lnk" data-pl="again">Tekrar ölç</button>
    <p class="hint">Sağlık cihazı değildir; sonuç sapabilir. Yorum yapılmaz.</p>`);
  }else{
    const why=r.reason==="finger"?"Parmağın kameraya ve flaşa tam oturmadı.":r.reason==="short"?"Ölçüm kesildi.":"Ölçüm net değil; parmağını sabit tut, hafif bastır.";
    openSheet(`<h3>Nabız</h3><p class="hint" role="alert">${why} Sayı verilmedi.</p><button class="btn" data-pl="start">Tekrar dene</button><button class="lnk" data-pl="back">Geri</button>`);
  }
}
async function plStart(){
  plStop();
  let stream;
  try{stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:320},height:{ideal:240},frameRate:{ideal:30}},audio:false})}
  catch(e){plSheet();return toast("Kamera izni verilmedi. Telefon ayarlarından aç")}
  const tr=stream.getVideoTracks()[0];let torch=false;
  try{const c=tr.getCapabilities&&tr.getCapabilities();if(c&&c.torch){await tr.applyConstraints({advanced:[{torch:true}]});torch=true}}catch(e){}
  const video=document.createElement("video");video.muted=true;video.playsInline=true;video.srcObject=stream;
  try{await video.play()}catch(e){stream.getTracks().forEach(t=>t.stop());plSheet();return toast("Kamera açılamadı")}
  const cv=document.createElement("canvas");cv.width=cv.height=16;
  const ctx=cv.getContext("2d",{willReadFrequently:true});
  pl={stream,video,cv,ctx,raf:0,samples:[],t0:0,torch};
  plScreen(PL_WAIT,0);
  const me=pl;
  const tick=()=>{
    if(pl!==me)return;
    try{
      ctx.drawImage(video,0,0,16,16);
      const d=ctx.getImageData(0,0,16,16).data;let r=0,g=0;
      for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1]}
      r/=256;g/=256;const t=performance.now();
      if(PulseLib.finger(r,g)){
        if(!me.t0)me.t0=t;
        me.samples.push({t,r,g});
        const el=t-me.t0,pct=Math.min(100,Math.round(el/(PL_SEC*10)));
        const b=$("#plbar");
        plSet("plmsg",`${Math.max(0,PL_SEC-Math.floor(el/1000))} sn`);plSet("plhint",PL_GO);
        if(b)b.style.width=pct+"%";
        if(el>=PL_SEC*1000)return plResult(PulseLib.analyze(me.samples));
      }else if(me.t0){ // parmak kalktı: kesintisiz kayıt gerekir, baştan
        me.t0=0;me.samples=[];
        const b=$("#plbar");plSet("plmsg",PL_SEC+" sn");plSet("plhint",PL_WAIT);if(b)b.style.width="0%";
      }
    }catch(e){}
    me.raf=video.requestVideoFrameCallback?video.requestVideoFrameCallback(tick):requestAnimationFrame(tick);
  };
  me.raf=video.requestVideoFrameCallback?video.requestVideoFrameCallback(tick):requestAnimationFrame(tick);
  if(!torch)toast("Flaş açılamadı; parmağını parlak bir ışığa karşı kameraya koy");
}
function plSave(){
  if(!plRes)return;
  S.pulse=PulseLib.clean(S.pulse.concat({day:dayKey(),time:plNow(),bpm:plRes.bpm}));
  plRes=null;save();closeSheet();render();toast("Nabız kaydedildi");
}
document.addEventListener("click",ev=>{
  const b=ev.target.closest&&ev.target.closest("[data-pl]");if(!b)return;
  const a=b.dataset.pl;
  if(a==="open")plSheet();
  else if(a==="start")plStart();
  else if(a==="cancel"||a==="back")plSheet();
  else if(a==="again")plStart();
  else if(a==="save")plSave();
  else if(a.startsWith("del:")){const id=+a.slice(4);S.pulse=PulseLib.clean(S.pulse.filter(x=>x.id!==id));save();plSheet();render()}
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&pl)plSheet()});
