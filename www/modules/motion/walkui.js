"use strict";
/* Manual walk / run / bike: start, timer, stop, one "exercise" entry.
   The duration comes from the end time (no drift in the background); the start sits in S.walk and survives closing the app. No steps entry is written:
   the walk's steps are already in the sensor total. */
const WKIND={w:"Yürüyüş",r:"Koşu",b:"Bisiklet"},WALK_MAX_MIN=600;
const wMs=()=>(S.walk.t1||Date.now())-S.walk.t0;
const wClock=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600);return (h?h+":":"")+pad(Math.floor(s%3600/60))+":"+pad(s%60)};
const wMin=()=>Math.min(WALK_MAX_MIN,Math.max(1,Math.round(wMs()/60000)));
let wKind="w";

let wStarting=false;
async function walkStart(){
  if(S.walk||wStarting)return;
  wStarting=true;
  try{await stepsSync()}finally{wStarting=false}
  if(S.walk)return;
  S.walk={t0:Date.now(),s0:stepToday??null,t1:null,s1:null};save();render();
  walkGpsOn();
}
/* Stop: the end time and the sensor value are fixed at once, so the duration cannot grow even if the save sheet stays closed. */
async function walkStop(){
  const w=S.walk;if(!w)return;
  if(!w.t1){w.t1=Date.now();save();walkGpsOff();await stepsSync();w.s1=stepToday??null;save()}
  await motionStatus(); // the step length learned by GPS enters the distance
  render();walkSheet();
}
/* The step difference counts only within one day's sensor counter; a walk across midnight or a counter that went backwards has no steps. */
function walkSteps(w){
  const d=s=>s!=null&&s>=0;
  return d(w.s0)&&d(w.s1)&&w.s1>=w.s0&&MotionLib.dayOf(w.t0)===MotionLib.dayOf(w.t1)?w.s1-w.s0:null;
}
function walkCalc(min){
  return Algo.moveSummary({kind:wKind,min,steps:walkSteps(S.walk),cm:S.settings.heightCm,kg:motionKg(),f:motionPerm?.[wKind==="r"?"fr":"fw"]});
}
function walkPrev(){
  const min=num($("#wmin").value,true);
  if(!(min>=1&&min<=WALK_MAX_MIN)){$("#wprev").textContent="";return}
  const r=walkCalc(min),st=walkSteps(S.walk);
  $("#wprev").textContent=[st!=null&&wKind!=="b"?`${fint(st)} adım`:"",r.km!=null?`~${fmt(r.km,2)} km`:"",r.kcal!=null?`~${r.kcal} kcal`:""].filter(Boolean).join(" · ")||"Mesafe ve kalori için adım sayar, boy ve kilo gerekir.";
}
function walkSheet(){
  const w=S.walk;if(!w)return;
  openSheet(`<h3>${WKIND[wKind]} kaydı</h3><div class="mut sm">${MotionLib.hmOf(w.t0)} - ${MotionLib.hmOf(w.t1)}</div>
  <div class="mt-2 chips" id="wk">${Object.entries(WKIND).map(([k,name])=>`<button class="chip" data-w="k:${k}" aria-pressed="${k===wKind}">${name}</button>`).join("")}</div>
  <div class="lbl">Süre (dakika)</div><input class="in num" id="wmin" inputmode="numeric" value="${wMin()}">
  <div class="t-h2 sumv num" id="wprev"></div>
  <p class="hint flush">Mesafe ve kalori tahmindir. Süreyi unuttuysan düzelt. Adımlar günlük sayaca zaten dahildir, ikinci kez eklenmez.</p>
  <div class="btns"><button class="btn" data-w="save">Kaydet</button><button class="btn ghost" data-w="close">Sonra</button><button class="btn danger" data-w="drop">Kaydetmeden at</button></div>`);
  walkPrev();
}
function walkSave(){
  const w=S.walk,min=num($("#wmin").value,true);
  if(!w)return;
  if(!(min>=1&&min<=WALK_MAX_MIN))return toast(`Süreyi dakika olarak yaz, 1 ile ${WALK_MAX_MIN} arası`);
  const r=walkCalc(min),name=WKIND[wKind],e=add("exercise",min,r.km!=null?`${name}, ~${fmt(r.km,2)} km`:name,dayAt(w.t1));
  e.time=MotionLib.hmOf(w.t1);if(r.kcal)e.kcal=r.kcal;if(r.km!=null)e.km=r.km;
  S.walk=null;save();closeSheet();render();
  toast(`${name} ${min} dk kaydedildi${r.kcal?`, ~${r.kcal} kcal (tahmini)`:""}`,e.id);
}
function walkCard(){
  const w=S.walk;
  if(!w)return `<div class="card"><div class="lbl">Yürüyüş, koşu, bisiklet</div><p class="m0 mb-2 mut sm">Tek bir çıkışın süresini, mesafesini ve kalorisini ölç. Adım sayar açıksa adım farkından hesaplanır.</p><button class="btn" data-w="start">Yürüyüş başlat</button></div>`;
  if(w.t1)return `<div class="card"><div class="lbl">Durdu, kaydedilmedi</div><div class="sumv num">${wClock(wMs())}</div><div class="btns"><button class="btn" data-w="sheet">Kaydet</button><button class="btn danger" data-w="drop">Kaydetmeden at</button></div></div>`;
  return `<div class="card"><div class="lbl">Sürüyor, ${MotionLib.hmOf(w.t0)}'de başladı</div><div class="sumv num" id="wclock" role="timer">${wClock(wMs())}</div><div class="btns"><button class="btn" data-w="stop">Bitir</button><button class="btn ghost" data-w="drop">Vazgeç</button></div></div>`;
}
setInterval(()=>{const el=document.getElementById("wclock");if(el&&S.walk&&!S.walk.t1)el.textContent=wClock(wMs())},1000);
document.addEventListener("input",ev=>{if(ev.target.id==="wmin")walkPrev()});
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-w]");if(!el)return;
  const [a,p]=el.dataset.w.split(":");
  if(a==="start")walkStart();
  else if(a==="stop")walkStop();
  else if(a==="sheet")motionStatus().then(walkSheet);
  else if(a==="save")walkSave();
  else if(a==="close")closeSheet();
  else if(a==="drop")confirmSheet({title:"Bu yürüyüş kaydedilmeden silinsin mi?",ok:"Sil",danger:true}).then(ok=>{if(ok){S.walk=null;save();walkGpsOff();closeSheet();render()}});
  else if(a==="k"){wKind=p;document.querySelectorAll("#wk .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));document.querySelector("#sheet h3").textContent=`${WKIND[p]} kaydı`;walkPrev()}
});
