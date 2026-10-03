"use strict";
/* Elle yürüyüş / koşu / bisiklet: başlat, süre sayacı, durdur, tek "spor" kaydı.
   Süre bitiş zamanından hesaplanır (arka planda kaymaz); başlangıç S.walk'ta durur, uygulama kapanıp açılınca devam eder.
   Adım kaydı yazılmaz: yürüyüş adımları sensör toplamında zaten var. */
const WKIND={w:["Yürüyüş"],r:["Koşu"],b:["Bisiklet"]};
const wMs=()=>(S.walk.t1||Date.now())-S.walk.t0;
const wClock=ms=>{const s=Math.max(0,Math.floor(ms/1000)),h=Math.floor(s/3600);return (h?h+":":"")+pad(Math.floor(s%3600/60))+":"+pad(s%60)};
const wMin=()=>Math.min(600,Math.max(1,Math.round(wMs()/60000)));
let wKind="w";

async function walkStart(){
  if(S.walk)return;
  await stepsSync();
  S.walk={t0:Date.now(),s0:stepToday==null?null:stepToday,t1:null,s1:null};save();render();
  walkGpsOn();
}
/* Durdur: bitiş zamanı ve sensör değeri hemen sabitlenir, kayıt sayfası kapansa da süre uzamaz. */
async function walkStop(){
  const w=S.walk;if(!w)return;
  if(!w.t1){w.t1=Date.now();save();walkGpsOff();await stepsSync();w.s1=stepToday==null?null:stepToday;save()}
  render();walkSheet();
}
/* Adım farkı yalnız aynı günün sensör sayacından; gece yarısını geçen ya da sayaç geriye giden yürüyüşte adım yok sayılır. */
function walkSteps(w){
  const d=s=>s!=null&&s>=0;
  return d(w.s0)&&d(w.s1)&&w.s1>=w.s0&&MotionLib.dayOf(w.t0)===MotionLib.dayOf(w.t1)?w.s1-w.s0:null;
}
function walkCalc(min){
  const w=S.walk;
  return Algo.moveSummary({kind:wKind,min,steps:walkSteps(w),cm:S.settings.heightCm,kg:motionKg()});
}
function walkPrev(){
  const min=num($("#wmin").value,true);
  if(!(min>=1&&min<=600)){$("#wprev").textContent="";return}
  const r=walkCalc(min),st=walkSteps(S.walk);
  $("#wprev").textContent=[st!=null&&wKind!=="b"?`${st.toLocaleString("tr-TR")} adım`:"",r.km!=null?`~${fmt(r.km,2)} km`:"",r.kcal!=null?`~${r.kcal} kcal`:""].filter(Boolean).join(" · ")||"Mesafe ve kalori için adım sayar, boy ve kilo gerekir.";
}
function walkSheet(){
  const w=S.walk;if(!w)return;
  openSheet(`<h3>${WKIND[wKind][0]} kaydı</h3><div class="mut sm">${MotionLib.hmOf(w.t0)} - ${MotionLib.hmOf(w.t1)}</div>
  <div class="chips" id="wk" style="margin-top:8px">${Object.keys(WKIND).map(k=>`<button class="chip" data-w="k:${k}" aria-pressed="${k===wKind}">${WKIND[k][0]}</button>`).join("")}</div>
  <div class="lbl">Süre (dakika)</div><input class="in num" id="wmin" inputmode="numeric" value="${wMin()}" oninput="walkPrev()">
  <div class="sumv num" id="wprev" style="font-size:20px"></div>
  <p class="hint" style="padding:4px 0 8px">Mesafe ve kalori tahmindir. Süreyi unuttuysan düzelt. Adımlar günlük sayaca zaten dahildir, ikinci kez eklenmez.</p>
  <div class="btns"><button class="btn" data-w="save">Kaydet</button><button class="btn ghost" data-w="close">Sonra</button><button class="btn danger" data-w="drop">Kaydetmeden at</button></div>`);
  walkPrev();
}
function walkSave(){
  const w=S.walk,min=num($("#wmin").value,true);
  if(!w)return;
  if(!(min>=1&&min<=600))return toast("Süreyi dakika olarak yaz, 1 ile 600 arası");
  const r=walkCalc(min),name=WKIND[wKind][0],e=add("spor",min,r.km!=null?`${name}, ~${fmt(r.km,2)} km`:name,MotionLib.dayOf(w.t1));
  e.time=MotionLib.hmOf(w.t1);if(r.kcal)e.kcal=r.kcal;if(r.km!=null)e.km=r.km;
  S.walk=null;save();closeSheet();render();
  toast(`${name} ${min} dk kaydedildi${r.kcal?`, ~${r.kcal} kcal (tahmini)`:""}`,e.id);
}
function walkCard(){
  const w=S.walk;
  if(!w)return `<div class="card"><div class="lbl">Yürüyüş, koşu, bisiklet</div><p class="mut sm" style="margin:0 0 8px">Tek bir çıkışın süresini, mesafesini ve kalorisini ölç. Adım sayar açıksa adım farkından hesaplanır.</p><button class="btn" data-w="start">Yürüyüş başlat</button></div>`;
  if(w.t1)return `<div class="card"><div class="lbl">Durdu, kaydedilmedi</div><div class="sumv num">${wClock(wMs())}</div><div class="btns"><button class="btn" data-w="sheet">Kaydet</button><button class="btn danger" data-w="drop">Kaydetmeden at</button></div></div>`;
  return `<div class="card"><div class="lbl">Sürüyor, ${MotionLib.hmOf(w.t0)}'de başladı</div><div class="sumv num" id="wclock" role="timer">${wClock(wMs())}</div><div class="btns"><button class="btn" data-w="stop">Bitir</button><button class="btn ghost" data-w="drop">Vazgeç</button></div></div>`;
}
setInterval(()=>{const el=document.getElementById("wclock");if(el&&S.walk&&!S.walk.t1)el.textContent=wClock(wMs())},1000);
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-w]");if(!el)return;
  const [a,p]=el.dataset.w.split(":");
  if(a==="start")walkStart();
  else if(a==="stop")walkStop();
  else if(a==="sheet")walkSheet();
  else if(a==="save")walkSave();
  else if(a==="close")closeSheet();
  else if(a==="drop"){if(confirm("Bu yürüyüş kaydedilmeden silinsin mi?")){S.walk=null;save();walkGpsOff();closeSheet();render()}}
  else if(a==="k"){wKind=p;document.querySelectorAll("#wk .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));document.querySelector("#sheet h3").textContent=`${WKIND[p][0]} kaydı`;walkPrev()}
});
