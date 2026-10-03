"use strict";
/* Otomatik yürüyüş/koşu algılama arayüzü: Ayarlar bloğu, Adım ekranındaki Hareketler kartı, yerel taraftan kayıt alma, elle yürüyüşte GPS.
   index.html'deki S, save, toast, esc, fmt, render, tab, isNative, weights, Algo ile çalışır. */
const MO=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Motion;
let motionPerm=null;

function motionKg(){
  const w=weights(),d=Object.keys(w).sort();
  return d.length?Algo.trend(w)[d[d.length-1]]:0;
}
function motionConfigure(){const m=MO();if(m)m.configure({cm:S.settings.heightCm||0,kg:motionKg()||0}).catch(()=>{})}

async function motionStatus(){
  const m=MO();if(!m)return;
  try{motionPerm=await m.status()}catch(e){}
}

function motionSettingsHtml(){
  if(!isNative()||!MO()||!S.settings.stepsOn)return "";
  const st=S.settings,p=motionPerm||{};
  const gps=p.fine?"Konum izni var: elle başlattığın yürüyüşte GPS kısa süre açılır.":"Konum izni yok: mesafe boyuna göre tahmin edilir.";
  return `<h2>Hareket algılama</h2><div class="card">
    <p class="mut sm" style="margin:0 0 10px">Yürüyüş ve koşuyu kendisi algılar, süre, mesafe, hız ve kaloriyi (boy ve kilona göre) Adım ekranında listeler. Konum yalnız elle başlattığın yürüyüşlerde kullanılır: ölçüm uygulama açıkken başlar, sürdüğü kısa süre bildirim görünür. Arka planda konum kullanılmaz. Rota ve konum noktası kaydedilmez, her şey telefonda kalır.</p>
    <button class="btn ghost" data-mo="toggle" style="margin-bottom:8px">${st.motionOn?"Hareket algılamayı kapat":"Hareket algılamayı aç"}</button>
    ${st.motionOn?`<p class="mut sm" style="margin:0 0 8px">${gps}</p>${p.fine?"":`<button class="btn ghost" data-mo="perm">Yürüyüşte konumu kullan</button>`}`:""}
  </div>`;
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
  }catch(e){toast("Hareket algılama açılamadı: "+(e&&e.message||e))}
}

/* Yerel taraftan biten aralıkları al, kaydet. */
async function motionIngest(){
  const m=MO();if(!m||!S.settings.motionOn)return;
  let r;try{r=await m.take()}catch(e){return}
  const n=MotionLib.ingest(S.moves,(r&&r.items)||[],Date.now());
  if(!n)return;
  save();
  if(tab==="adim"&&!$("#sheet").classList.contains("on"))render();
  console.log("NW-MOTION ingested "+n);
}
/* Adım sayar kapanınca hareket algılama da durur (ayar bloğu adım sayara bağlı). */
async function motionStopAll(){
  const m=MO();if(!S.settings.motionOn)return;
  await motionIngest();S.settings.motionOn=false;save();
  if(m)try{await m.stop()}catch(e){}
}
/* Yedekten gelen ya da izni geri alınmış ayarda yerel taraf kapalıysa ayarı düşür, kullanıcıya açık görünüp çalışmamasın. */
async function motionBoot(){
  const m=MO();if(!m||!S.settings.motionOn)return;
  await motionStatus();
  if(motionPerm&&!motionPerm.activity){S.settings.motionOn=false;save();render();return}
  motionConfigure();
  try{await m.start()}catch(e){S.settings.motionOn=false;save();render();return}
  motionIngest();
}

/* Adım ekranı kartı: son 2 gün. */
function motionCard(){
  if(!S.settings.motionOn)return "";
  const t=dayKey(),y=keyOff(-1),row=m=>`<div class="row" style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid var(--line)"><span><b>${m.t0}</b> ${m.k==="r"?"🏃 Koşu":"🚶 Yürüyüş"} <small class="mut">${m.min} dk</small></span><span class="num" style="text-align:right">${fmt(m.km,1)} km · ${fmt(m.kmh,1)} km/s${m.kcal!=null?` · ${m.kcal} kcal`:""}</span></div>`;
  const tl=S.moves.filter(m=>m.day===t),yl=S.moves.filter(m=>m.day===y),tt=MotionLib.totals(tl);
  const body=tl.length||yl.length?`${tl.length?`<div class="mut sm" style="margin-bottom:4px">Bugün ${tt.min} dk, ${fmt(tt.km,1)} km${tt.kcalN?`, ${tt.kcal} kcal`:""}</div>${tl.slice().reverse().map(row).join("")}`:`<p class="mut sm" style="margin:0 0 6px">Bugün henüz algılanan yürüyüş ya da koşu yok.</p>`}${yl.length?`<div class="mut sm" style="margin:10px 0 4px">Dün</div>${yl.slice().reverse().map(row).join("")}`:""}`
    :`<p class="mut sm" style="margin:0">Henüz algılanan yürüyüş ya da koşu yok. En az 3 dakikalık, kesintisiz yürüyüşler listelenir.</p>`;
  return `<div class="card"><div class="lbl">Hareketler</div>${body}<p class="hint" style="padding:8px 0 0">Algılama 1-2 dakika gecikebilir, süre ve mesafe yaklaşıktır.${S.settings.heightCm>0?"":" Mesafe için Ayarlar'dan boyunu gir."}</p></div>`;
}

/* Elle yürüyüşte GPS: adım uzunluğunu öğrenmenin tek yolu. Ritim adım sayacından gelir, öğrenilen ölçeği otomatik aralıklar ve elle yürüyüş mesafesi kullanır;
   bu yüzden yalnız ikisi de açıkken. Konum izni burada istenir, ret telefona özel bayrakla hatırlanır (yedeğe girmez). */
const WGPS_NO="nw_walkgps_no";
async function walkGpsOn(){
  const m=MO(),st=S.settings;if(!m||!isNative()||!st.stepsOn||!st.motionOn)return;
  await motionStatus();
  if(motionPerm&&motionPerm.fine)walkGpsGo();
  else if(!lsGet(WGPS_NO))motionDisclose();
}
function walkGpsGo(){const m=MO();if(m&&S.walk&&!S.walk.t1)m.walkGps({on:true}).catch(()=>{})}
function walkGpsOff(){const m=MO();if(m)m.walkGps({on:false}).catch(()=>{})}
async function walkGpsAsk(){
  const m=MO();if(!m)return;
  let ok=false;try{ok=(await m.requestPermissions({permissions:["fine"]})).fine==="granted"}catch(e){}
  await motionStatus();
  if(ok){lsDel(WGPS_NO);walkGpsGo();toast("Konum izni verildi")}
  else{lsSet(WGPS_NO,"1");toast("Hassas konum izni verilmedi. Mesafe boyuna göre tahmin edilir")}
  if(tab==="ayar-modul")render();
}
function motionDisclose(){
  openSheet(`<h3>Yürüyüşte konum</h3><p class="hint" style="padding:0 0 8px">Hareket algılama açıkken NeoWell, adım uzunluğunu öğrenmek için <b>yalnız senin başlattığın yürüyüşte</b> GPS'i kısa süre açar: iyi sinyalde yaklaşık 1 dakika, en çok 10 dakika. Ölçüm sürerken bildirim görünür, ekranı kapatsan da bu süre içinde sürer. Öğrenilen adım uzunluğu yürüyüşlerinin (otomatik algılanan ve elle kaydedilen) mesafesini düzeltir.</p>
  <p class="hint" style="padding:0 0 8px">Arka planda konum istenmez. Konum noktası ve rota saklanmaz, telefondan çıkmaz, reklam için kullanılmaz. İzin vermezsen mesafe boyuna göre tahmin edilir.</p>
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
