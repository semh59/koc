"use strict";
/* Pulse screen: camera measurement (fingertip on the rear camera and torch) and the daily pulse that comes from the watch. Not a medical device; never interprets the number.
   The algorithm is in pulselib.js. */
const PL_SEC=30,PL_PX=16;
const PL_WAIT="Parmağını kameraya ve flaşa koy",PL_GO="Ölçülüyor, kıpırdama";
let pl=null; // running measurement: {stream,video,raf,samples,t0,torch}
let plBpm=0; // result waiting to be saved
const plHave=()=>!!navigator.mediaDevices?.getUserMedia;
const plNext=(video,tick)=>video.requestVideoFrameCallback?video.requestVideoFrameCallback(tick):requestAnimationFrame(tick);

function plStop(){
  const p=pl;pl=null;if(!p)return;
  if(p.raf)p.video.cancelVideoFrameCallback?p.video.cancelVideoFrameCallback(p.raf):cancelAnimationFrame(p.raf);
  for(const t of p.stream.getTracks()){
    if(p.torch)t.applyConstraints({advanced:[{torch:false}]}).catch(()=>{});
    t.stop();
  }
  p.video.srcObject=null;
}
function plStats(){
  const h=S.hr.slice(-7).reverse();
  return h.length?`<div class="lbl">Saatten günlük nabız</div>${h.map(x=>`<div class="row"><span>${fd(x.day)}</span><b class="num">${x.a}${x.m?` <span class="mut sm">en düşük ${x.m}</span>`:""}</b></div>`).join("")}`:"";
}
function plSheet(){
  plStop();plBpm=0;
  const list=S.pulse.slice().reverse().map(x=>`<div class="row"><span>${fd(x.day)} ${x.time}</span><b class="num">${x.bpm}</b><button class="del" data-pl="del:${x.id}" aria-label="Kaydı sil">✕</button></div>`).join("");
  openSheet(`<h3>Nabız</h3>
  <p class="flush hint">Parmağını arka kameranın ve flaşın üstüne hafifçe koy. Ölçüm ${PL_SEC} saniye sürer; kıpırdama.</p>
  ${plHave()?`<button class="btn" data-pl="start">Kamerayla ölç</button>`:`<p class="hint">Bu cihazda kamera ölçümü kullanılamıyor.</p>`}
  <p class="hint">Sağlık cihazı değildir; sonuç sapabilir. Tıbbi karar için kullanma, şikâyetin varsa hekime başvur.</p>
  ${list?`<div class="lbl">Kamera ölçümlerin</div>${list}`:""}${plStats()}
  ${!S.hr.length&&!S.settings.hcOn?`<p class="hint">Saatinin nabzı için Adım raporunda <b>Saat verilerini al</b>'ı aç.</p>`:""}`);
}
/* The countdown is role=timer (screen readers do not read it every second), the instruction is role=status (read only when it changes). */
function plScreen(hint,pct){
  openSheet(`<h3>Nabız ölçülüyor</h3><div class="tc"><div class="big num" id="plmsg" role="timer" aria-live="off">${PL_SEC} sn</div><p class="hint" id="plhint" role="status">${hint}</p><div class="bar" aria-hidden="true"><i id="plbar" style="width:${pct}%"></i></div></div><button class="lnk" data-pl="cancel">Vazgeç</button>`);
}
function plProgress(msg,hint,pct){
  for(const [id,txt] of [["plmsg",msg],["plhint",hint]]){const e=document.getElementById(id);if(e&&e.textContent!==txt)e.textContent=txt}
  const b=$("#plbar");if(b)b.style.width=pct+"%";
}
function plResult(r){
  plStop();
  if(r.ok){
    plBpm=r.bpm;
    openSheet(`<h3>Nabız</h3><div class="tc"><div class="big num" id="plbpm">${r.bpm}</div><div class="mut">atım / dk</div></div>
    <button class="btn" data-pl="save">Kaydet</button><button class="lnk" data-pl="again">Tekrar ölç</button>
    <p class="hint">Sağlık cihazı değildir; sonuç sapabilir. Yorum yapılmaz.</p>`);
  }else{
    const why=r.reason==="finger"?"Parmağın kameraya ve flaşa tam oturmadı.":r.reason==="short"?"Ölçüm kesildi.":"Ölçüm net değil; parmağını sabit tut, hafif bastır.";
    const dg=r.dg?`<p class="hint sm" aria-label="Teknik ayrıntı">Teknik: ${r.reason} · ${Object.entries(r.dg).map(([k,v])=>k+" "+v).join(" · ")}</p>`:"";
    openSheet(`<h3>Nabız</h3><p class="hint" role="alert">${why} Sayı verilmedi.</p>${dg}<button class="btn" data-pl="start">Tekrar dene</button><button class="lnk" data-pl="back">Geri</button>`);
  }
}
async function plStart(){
  plStop();
  let pick;
  try{pick=await PulseLib.pickTorchCamera(navigator.mediaDevices,{width:{ideal:320},height:{ideal:240},frameRate:{ideal:30}})}
  catch(e){plSheet();return toast("Kamera izni verilmedi. Telefon ayarlarından aç")}
  const {stream,track}=pick;
  let torch=false;
  try{if(!pick.noTorch){await track.applyConstraints({advanced:[{torch:true}]});torch=true}}catch(e){}
  const video=document.createElement("video");video.muted=true;video.playsInline=true;video.srcObject=stream;
  try{await video.play()}catch(e){stream.getTracks().forEach(t=>t.stop());plSheet();return toast("Kamera açılamadı")}
  const ctx=Object.assign(document.createElement("canvas"),{width:PL_PX,height:PL_PX}).getContext("2d",{willReadFrequently:true});
  const me=pl={stream,video,raf:0,samples:[],t0:0,torch};
  plScreen(PL_WAIT,0);
  const tick=()=>{
    if(pl!==me)return;
    try{
      ctx.drawImage(video,0,0,PL_PX,PL_PX);
      const d=ctx.getImageData(0,0,PL_PX,PL_PX).data;let r=0,g=0;
      for(let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1]}
      r/=PL_PX*PL_PX;g/=PL_PX*PL_PX;const t=performance.now();
      if(PulseLib.finger(r,g)){
        if(!me.t0)me.t0=t;
        me.samples.push({t,r,g});
        const el=t-me.t0;
        plProgress(`${Math.max(0,PL_SEC-Math.floor(el/1000))} sn`,PL_GO,Math.min(100,Math.round(el/(PL_SEC*10))));
        if(el>=PL_SEC*1000)return plResult(PulseLib.analyze(me.samples));
      }else if(me.t0){ // finger lifted: the recording must be unbroken, start over
        me.t0=0;me.samples=[];
        plProgress(PL_SEC+" sn",PL_WAIT,0);
      }
    }catch(e){}
    me.raf=plNext(video,tick);
  };
  me.raf=plNext(video,tick);
  if(!torch)toast(`Flaş açılamadı (${pick.tried} kamera denendi); parmağını parlak bir ışığa karşı kameraya koy`);
}
function plSave(){
  if(!plBpm)return;
  S.pulse=PulseLib.clean(S.pulse.concat({day:dayKey(),time:MedLib.hm(new Date()),bpm:plBpm}));
  plBpm=0;save();closeSheet();render();toast("Nabız kaydedildi");
}
document.addEventListener("click",ev=>{
  const b=ev.target.closest?.("[data-pl]");if(!b)return;
  const a=b.dataset.pl;
  if(a==="open"||a==="cancel"||a==="back")plSheet();
  else if(a==="start"||a==="again")plStart();
  else if(a==="save")plSave();
  else if(a.startsWith("del:")){
    const id=+a.slice(4),was=S.pulse;
    S.pulse=PulseLib.clean(was.filter(x=>x.id!==id));
    if(!commit(()=>{S.pulse=was}))return;
    plSheet();render();toast("Nabız kaydı silindi",()=>{S.pulse=was;save();render();plSheet()});
  }
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&pl)plSheet()});
