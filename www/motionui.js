"use strict";
/* Otomatik yürüyüş/koşu algılama arayüzü: Ayarlar bloğu, Adım ekranındaki Hareketler kartı, yerel taraftan kayıt alma.
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
  const gps=p.bg?"Her zaman konum izni var: kısa GPS ölçümleri otomatik açılır.":p.fine?"Konum izni yalnız uygulama açıkken. Otomatik GPS ölçümü için \"Her zaman izin ver\" gerekir; yoksa hız yalnız adım ritminden hesaplanır.":"Konum izni yok: hız yalnız adım ritminden hesaplanır.";
  return `<h2>Hareket algılama</h2><div class="card">
    <p class="mut sm" style="margin:0 0 10px">Yürüyüş ve koşuyu kendisi algılar, süre, mesafe, hız ve kaloriyi (boy ve kilona göre) Adım ekranında listeler. Adım uzunluğunu öğrenmek için GPS'i arada kısa süre (yaklaşık 1 dk) açar. Rota ve konum noktası kaydedilmez, her şey telefonda kalır.</p>
    <button class="btn ghost" data-mo="toggle" style="margin-bottom:8px">${st.motionOn?"Hareket algılamayı kapat":"Hareket algılamayı aç"}</button>
    ${st.motionOn?`<p class="mut sm" style="margin:0 0 8px">${gps}</p>${p.bg?"":`<button class="btn ghost" data-mo="perm">Konum iznini ayarla</button>`}`:""}
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
    toast(p.bg?"Hareket algılama açık":"Açık. Otomatik GPS için konum iznini \"Her zaman\" yap");
  }catch(e){toast("Hareket algılama açılamadı: "+(e&&e.message||e))}
}
async function motionPermAsk(){
  const m=MO();if(!m)return;
  try{motionPerm=await m.requestAccess();render()}catch(e){toast("İzin istenemedi")}
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

document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-mo]");if(!el)return;
  const a=el.dataset.mo;
  if(a==="toggle")motionToggle();
  else if(a==="perm")motionPermAsk();
});
