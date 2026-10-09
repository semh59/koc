"use strict";
/* Workout history import screen (Strong/Hevy CSV). The logic is in importlib.js; this file has the file picker, the preview and the confirmation. */
const IMPORT_MAX_BYTES=8e6;
let impSt=null;
/* The plan to show: the full plan, or its newest part after the user chose to import only what fits. full: workout count of the full plan; fitN: how many fit (null when all fit). */
function impPlan(){
  const all=gExAll().map(e=>({id:e.id,n:e.n,k:e.k||"w"}));
  const base=ImportLib.plan(impSt.raw.workouts,{find:ImportLib.matcher(all),existing:Gym.workouts(),gid:Gym.gid()});
  const budget=STORE_WARN-storeBytes;
  const fitN=ImportLib.bytes(base)>budget?ImportLib.fit(base,budget):null;
  const p=impSt.keep!=null&&fitN!=null?ImportLib.cut(base,Math.min(impSt.keep,fitN)):base;
  return {...p,fitN,full:base.stats.workouts};
}
function impText(text,name){
  let raw;
  try{raw=ImportLib.read(text)}catch(e){return toast(e.message)}
  impSt={raw,text,name:name||"",unit:raw.unit,keep:null};impSheet();
}
function impSheet(){
  const s=impSt,p=impSt.p=impPlan(),t=p.stats,cut=impSt.keep!=null&&p.fitN!=null;
  const lines=[
    `Egzersiz: ${t.matched} kütüphanede eşleşti, ${t.created} yeni (kendi egzersizin olarak eklenir).`,
    t.dup?`${t.dup} antrenman zaten kayıtlı, atlanır.`:"",
    t.skippedSets||s.raw.skipped?`${t.skippedSets} set ve ${s.raw.skipped} satır okunamadı ya da sınır dışı, atlanır.`:"",
    t.over.length?`Yeni egzersiz sınırı (${ImportLib.MAX_NEW}) aşıldı; şu egzersizlerin setleri alınmaz: ${t.over.slice(0,5).map(esc).join(", ")}${t.over.length>5?" ...":""}.`:"",
    p.fitN!=null?`Depolama uyarısı: ${p.full} antrenman bu telefondaki boş yere sığmaz${p.fitN?`; en yeni ${p.fitN} antrenman sığar`:""}. Önce yedek al, Koç sohbetini temizle ya da eski kayıtları sil.`:""
  ].filter(Boolean).map(l=>`<p class="my-2 mut sm">${l}</p>`).join("");
  openSheet(`<h3>Antrenman geçmişini içe aktar</h3><div class="mut sm">${s.raw.format} dosyası${s.name?": "+esc(s.name):""}</div>
  ${s.raw.unitAsk?`<div class="lbl">Ağırlık birimi (dosyada yazmıyor)</div><div class="chips">${["kg","lbs"].map(u=>`<button class="chip" data-imp="unit:${u}" aria-pressed="${s.unit===u}">${u}</button>`).join("")}</div>`:""}
  <div class="two"><div class="stat"><div class="k">Antrenman</div><div class="v num">${t.workouts}</div></div><div class="stat"><div class="k">Set</div><div class="v num">${t.sets}</div></div></div>
  ${t.workouts?`<p class="my-2 mut sm num">${fd(t.from)} - ${fd(t.to)}</p>`:`<p class="hint">İçe aktarılacak yeni antrenman yok.</p>`}${lines}
  <p class="hint">Geçmiş antrenmanlar için spor ve kalori kaydı oluşturulmaz; günlük kalori ve dakika toplamların değişmez.</p>
  <div class="btns">${p.fitN!=null&&!cut?(p.fitN>0?`<button class="btn" data-imp="fit">En yeni ${p.fitN} antrenmanı içe aktar</button>`:""):`<button class="btn" data-imp="go" ${t.workouts?"":"disabled"}>Onayla ve içe aktar</button>`}<button class="btn ghost" data-imp="close">Vazgeç</button></div>`);
}
function impGo(){
  const p=impSt.p;if(!p||!p.workouts.length)return;
  const ids=new Set(p.workouts.map(w=>w.id)),cx=new Set(p.newEx.map(e=>e.id));
  Gym.addImported(p);impSt=null;
  save();closeSheet();render();
  toast(`${ids.size} antrenman içe aktarıldı`,()=>{Gym.removeImported(ids,cx);save();render()});
}
function impPick(){
  const i=document.createElement("input");i.type="file";i.accept=".csv,text/csv,text/plain,application/csv,application/vnd.ms-excel";i.hidden=true;
  i.addEventListener("change",()=>{
    const f=i.files&&i.files[0];i.remove();if(!f)return;
    if(f.size>IMPORT_MAX_BYTES)return toast("Dosya çok büyük (8 MB üstü)");
    impSt=null;f.text().then(x=>impText(x,f.name),()=>toast("Dosya okunamadı"));
  });
  document.body.appendChild(i);i.click();
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-imp]");if(!el)return;
  const [a,arg]=el.dataset.imp.split(":");
  if(a==="open")impPick();
  else if(a==="close"){impSt=null;closeSheet()}
  else if(a==="unit"){impSt.unit=arg;impSt.keep=null;impSt.raw=ImportLib.read(impSt.text,{unit:arg});impSheet()}
  else if(a==="fit"){impSt.keep=impSt.p.fitN;impSheet()}
  else if(a==="go")impGo();
});
