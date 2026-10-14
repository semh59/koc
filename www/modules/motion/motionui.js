"use strict";
/* Automatic walk/run detection UI: the settings block, the Movements card on the steps screen, taking records from the native side, GPS during a manual walk. */
const MO=()=>plugin("Motion");
let motionPerm=null;

function motionKg(){
  const t=Algo.trend(weights()),ks=Object.keys(t);
  return ks.length?t[ks[ks.length-1]]:0;
}
function motionConfigure(){MO()?.configure({cm:S.settings.heightCm||0,kg:motionKg()||0}).catch(()=>{})}

async function motionStatus(){
  const m=MO();if(!m)return;
  try{motionPerm=await m.status()}catch(e){}
}

function motionSettingsHtml(){
  if(!isNative()||!MO()||!S.settings.stepsOn)return "";
  const st=S.settings,p=motionPerm||{};
  const gps=p.fine?"Konum izni var: elle başlattığın yürüyüşte GPS kısa süre açılır.":"Konum izni yok: mesafe boyuna göre tahmin edilir.";
  return modRow('data-mo="toggle"',st.motionOn,"Hareket algılama","Yürüyüş ve koşuyu kendisi algılar.","hlpmo","Yürüyüş ve koşuyu kendisi algılar, süre, mesafe, hız ve kaloriyi (boy ve kilona göre) Adım ekranında listeler. Konum yalnız elle başlattığın yürüyüşlerde kullanılır: ölçüm uygulama açıkken başlar, sürdüğü kısa süre bildirim görünür. Arka planda konum kullanılmaz. Rota ve konum noktası kaydedilmez, her şey telefonda kalır.",
    `<p class="m0 mb-2 mut sm">${gps}</p>${p.fine?"":`<button class="btn ghost" data-mo="perm">Yürüyüşte konumu kullan</button>`}`);
}

async function motionToggle(){
  const m=MO(),st=S.settings;if(!m)return;
  if(st.motionOn){
    await motionIngest();
    st.motionOn=false;save();try{await m.stop()}catch(e){}await motionStatus();render();return toast("Hareket algılama kapatıldı. Eski kayıtların durur");
  }
  try{
    const p=await m.requestAccess();
    if(!p.activity)return toast("Fiziksel aktivite izni verilmedi");
    motionConfigure();
    await m.start();
    st.motionOn=true;save();motionPerm=p;render();
    toast("Hareket algılama açık");
  }catch(e){toast("Hareket algılama açılamadı. Bu telefonda etkinlik tanıma kullanılamıyor olabilir")}
}

/* Takes the intervals the native side has finished and stores them. */
async function motionIngest(){
  const m=MO();if(!m||!S.settings.motionOn)return;
  let r;try{r=await m.take()}catch(e){return}
  if(!MotionLib.ingest(S.moves,r?.items??[],Date.now()))return;
  save();
  if(tab==="steps"&&!$("#sheet").classList.contains("on"))render();
}
/* Motion detection hangs on the step counter: turning the counter off stops it too. */
async function motionStopAll(){
  if(!S.settings.motionOn)return;
  await motionIngest();S.settings.motionOn=false;save();
  try{await MO()?.stop()}catch(e){}
}
/* A restored backup or a revoked permission can leave the setting on while the native side is off: switch it off so it does not look active and do nothing. */
async function motionBoot(){
  const m=MO();if(!m||!S.settings.motionOn)return;
  await motionStatus();
  if(motionPerm&&!motionPerm.activity){S.settings.motionOn=false;save();render();return}
  motionConfigure();
  try{await m.start()}catch(e){S.settings.motionOn=false;save();render();return}
  motionIngest();
}

/* Card on the steps screen: the last 2 days. */
function motionCard(){
  if(!S.settings.motionOn)return "";
  const row=m=>`<div class="row"><span><b>${m.t0}</b> ${m.k==="r"?"Koşu":"Yürüyüş"} <small class="mut">${m.min} dk</small></span><span class="ta-r num">${fmt(m.km,1)} km · ${fmt(m.kmh,1)} km/s${m.kcal!=null?` · ${m.kcal} kcal`:""}</span></div>`;
  const tl=S.moves.filter(m=>m.day===dayKey()),yl=S.moves.filter(m=>m.day===keyOff(-1));
  const sum=l=>{const x=MotionLib.totals(l);return `${x.min} dk, ${fmt(x.km,1)} km${x.kcalN?`, ${x.kcal} kcal`:""}`};
  /* The day total is visible, single movements open on tap. */
  const grp=(name,l)=>`<details class="acc"><summary><b class="grow">${name}</b><span class="num mut">${sum(l)}</span></summary>${l.slice().reverse().map(row).join("")}</details>`;
  const body=tl.length||yl.length?`${tl.length?grp("Bugün",tl):`<p class="mut sm m0 mb-2">Bugün henüz algılanan yürüyüş ya da koşu yok.</p>`}${yl.length?grp("Dün",yl):""}`
    :`<p class="m0 mut sm">Henüz algılanan yürüyüş ya da koşu yok. En az 3 dakikalık, kesintisiz yürüyüşler listelenir.</p>`;
  return `<div class="card"><div class="lbl">Hareketler</div>${body}<p class="pt-2 hint">Algılama 1-2 dakika gecikebilir, süre ve mesafe yaklaşıktır.${S.settings.heightCm>0?"":" Mesafe için Ayarlar'dan boyunu gir."}</p></div>`;
}

/* GPS during a manual walk is the only way to learn the step length. The cadence comes from the step counter and the learned scale is used for automatic intervals and
   manual walk distance, so GPS runs only when both are on. The location permission is asked here; a refusal is remembered in a flag specific to this phone (not in the backup). */
const WGPS_NO="nw_walkgps_no";
async function walkGpsOn(){
  const st=S.settings;if(!MO()||!isNative()||!st.stepsOn||!st.motionOn)return;
  await motionStatus();
  if(motionPerm?.fine)walkGpsGo();
  else if(!lsGet(WGPS_NO))motionDisclose();
}
function walkGpsGo(){if(S.walk&&!S.walk.t1)MO()?.walkGps({on:true}).catch(()=>{})}
function walkGpsOff(){MO()?.walkGps({on:false}).catch(()=>{})}
async function walkGpsAsk(){
  const m=MO();if(!m)return;
  let ok=false;try{ok=(await m.requestPermissions({permissions:["fine"]})).fine==="granted"}catch(e){}
  await motionStatus();
  if(ok){lsDel(WGPS_NO);walkGpsGo();toast("Konum izni verildi")}
  else{lsSet(WGPS_NO,"1");toast("Hassas konum izni verilmedi. Mesafe boyuna göre tahmin edilir")}
  if(tab==="settings-modules")render();
}
function motionDisclose(){
  openSheet(`<h3>Yürüyüşte konum</h3><p class="flush hint">Hareket algılama açıkken NeoWell, adım uzunluğunu öğrenmek için <b>yalnız senin başlattığın yürüyüşte</b> GPS'i kısa süre açar: iyi sinyalde yaklaşık 1 dakika, en çok 10 dakika. Ölçüm sürerken bildirim görünür, ekranı kapatsan da bu süre içinde sürer. Öğrenilen adım uzunluğu yürüyüşlerinin (otomatik algılanan ve elle kaydedilen) mesafesini düzeltir.</p>
  <p class="flush hint">Arka planda konum istenmez. Konum noktası ve rota saklanmaz, telefondan çıkmaz, reklam için kullanılmaz. İzin vermezsen mesafe boyuna göre tahmin edilir.</p>
  <div class="btns"><button class="btn" data-mo="gps">İzin ver</button><button class="btn ghost" data-mo="nogps">Konumsuz devam</button></div>`);
}

document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-mo]");if(!el)return;
  const a=el.dataset.mo;
  if(a==="toggle")motionToggle();
  else if(a==="perm")motionDisclose();
  else if(a==="gps"){closeSheet();walkGpsAsk()}
  else if(a==="nogps"){closeSheet();lsSet(WGPS_NO,"1");toast("Tamam. Mesafe boyuna göre tahmin edilir")}
});
