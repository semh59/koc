"use strict";
/* Standalone cardio entry: Trend card, add sheet, history. Does not touch the Gym screen. An entry is an ordinary exercise entry (CardioLib). */
let ckSel="run";
const ckKm=km=>String(km).replace(".",",");
const ckRow=e=>{
  const k=CardioLib.kind(e.ck),p=CardioLib.pace(e.ck,e.v,e.km),bits=[`${Math.round(e.v)} dk`,e.km?`${ckKm(e.km)} km`:"",p,e.kcal?`~${e.kcal} kcal`:""].filter(Boolean);
  return `<div class="row"><span class="grow"><b>${k[1]}</b> <small class="mut">${fd(e.day)}${e.bt?"":" "+e.time}</small><span class="db mut sm num">${bits.join(" · ")}</span>${e.cn?`<span class="db mut sm">${esc(e.cn)}</span>`:""}</span><button class="del" data-ckd="${e.id}" aria-label="${k[1]} ${fd(e.day)} kaydını sil">✕</button></div>`;
};
const ckList=()=>Log.where(CardioLib.isCardio).sort((a,b)=>b.day.localeCompare(a.day)||b.time.localeCompare(a.time)||b.id-a.id);
function cardioCard(){
  const all=ckList(),w=CardioLib.week(Log.all(),keyOff(-6),dayKey()),addBtn=`<button class="btn ghost" data-ckg="open">Kardiyo ekle</button>`;
  if(!all.length)return `<h2>Kardiyo</h2><div class="card"><p class="flush hint">Koşu, yürüyüş, bisiklet, yüzme ve eliptiği süre, mesafe ve tempoyla ayrı kaydet. Salon antrenmanından ayrıdır; süre haftalık spor dakikana da girer.</p>${addBtn}</div>`;
  const by=CardioLib.KINDS.filter(k=>w.by[k[0]]).map(([c,n])=>{const b=w.by[c];return `<div class="row"><span>${n} <small class="mut">(${b.n})</small></span><b class="num">${Math.round(b.min)} dk${b.km?` · ${fmt(b.km,1)} km`:""}</b></div>`}).join("");
  return `<h2>Kardiyo</h2><div class="card"><div class="lbl">Son 7 gün</div>${w.tot.n?`<div class="stats"><div class="stat"><div class="k">Kayıt</div><div class="v num">${w.tot.n}</div></div><div class="stat"><div class="k">Süre</div><div class="v num">${Math.round(w.tot.min)} <small>dk</small></div></div>${w.tot.km?`<div class="stat"><div class="k">Mesafe</div><div class="v num">${fmt(w.tot.km,1)} <small>km</small></div></div>`:""}${w.tot.kcal?`<div class="stat"><div class="k">Tahmini enerji</div><div class="v num">~${w.tot.kcal} <small>kcal</small></div></div>`:""}</div>${by}`:`<p class="hint">Bu hafta kardiyo kaydı yok.</p>`}
  <div class="mt-2 lbl">Son kayıtlar</div>${all.slice(0,5).map(ckRow).join("")}
  ${all.length>5?`<button class="lnk" data-ckg="all">Tüm geçmiş (${all.length})</button>`:""}${addBtn}
  <p class="hint">Enerji MET ile tahmindir. Aynı antrenmanı hem hızlı Spor'dan hem buradan ekleme; yoksa iki kez sayılır.</p></div>`;
}
function sheetCardio(){
  ckSel="run";const n=new Date();
  openSheet(`<h3>Kardiyo ekle</h3><div class="chips" id="ck" role="group" aria-label="Tür">${CardioLib.KINDS.map(([c,nm])=>`<button class="chip" data-ckk="${c}" aria-pressed="${c===ckSel}">${nm}</button>`).join("")}</div>
  <input class="in num" id="fv" inputmode="numeric" placeholder="Süre (dakika)" aria-label="Süre (dakika)" autocomplete="off" autofocus>
  <input class="in num" id="ckm" inputmode="decimal" placeholder="Mesafe (km, isteğe bağlı)" aria-label="Mesafe (km, isteğe bağlı)" autocomplete="off">
  <label class="lbl" for="ctm">Bitiş saati</label><input class="in" type="time" id="ctm" value="${pad(n.getHours())}:${pad(n.getMinutes())}">
  <input class="in" id="cnote" placeholder="Not (isteğe bağlı)" maxlength="80" aria-label="Not" autocomplete="off">${dayOptions()}
  <div class="ferr" id="cerr" role="alert"></div><p class="hint">Bitiş saatini gerçeğe göre gir: o saatte telefonun otomatik yakaladığı yürüyüş ya da koşu varsa ikinci kez sayılmaz.</p><button class="btn" data-ckg="go">Kaydet</button>`);
}
function goCardio(){
  const min=num($("#fv").value,true),kr=$("#ckm").value.trim(),km=kr?num(kr):0,day=fday(),tm=$("#ctm").value,note=$("#cnote").value.trim();
  const c=CardioLib.check({kind:ckSel,min,km});
  if(c.err)return ferr("cerr",c.err);
  const n=new Date(),today=day===dayKey();
  if(today&&timeOk(tm)&&tm>`${pad(n.getHours())}:${pad(n.getMinutes())}`)return ferr("cerr","Bitiş saati gelecekte olamaz");
  const dup=Log.find(x=>x.type==="exercise"&&x.day===day&&x.text.startsWith(c.name));
  if(dup)return confirmSheet({title:"Yine de eklensin mi?",body:`Bu gün için ${c.name} kaydı var (${Math.round(dup.v)} dk). Aynı antrenmanı ikinci kez eklersen iki kez sayılır. Yine de eklensin mi?`,ok:"Ekle"}).then(ok=>{if(ok)ckSave(c,min,day,tm,note,today)});
  ckSave(c,min,day,tm,note,today);
}
function ckSave(c,min,day,tm,note,today){
  const e=add("exercise",min,c.name,day);e.ck=ckSel;
  if(c.km)e.km=c.km;
  if(note)e.cn=note;
  if(today&&timeOk(tm))e.time=tm;
  const kc=Algo.netKcal(CardioLib.met(ckSel,c.kmh),motionKg(),min);if(kc)e.kcal=kc;
  save();closeSheet();render();
  toast([`${c.name} ${min} dk kaydedildi`,c.km?`${ckKm(c.km)} km`:"",CardioLib.pace(ckSel,min,c.km),kc?`~${kc} kcal`:""].filter(Boolean).join(", "),e.id);
}
function sheetCardioAll(){
  openSheet(`<h3>Kardiyo geçmişi</h3>${ckList().slice(0,100).map(ckRow).join("")}`);
}
document.addEventListener("click",ev=>{
  const d=ev.target.closest("[data-ckd]");
  if(d){
    const id=+d.dataset.ckd,rm=Log.find(x=>x.id===id);if(!rm)return;
    const inSheet=!!d.closest("#sheet");
    Log.remove(x=>x.id===id);save();render();
    if(inSheet)ckList().length?sheetCardioAll():closeSheet();
    toast("Kayıt silindi",()=>{Log.restore([rm]);save();render()},true);return;
  }
  const k=ev.target.closest("[data-ckk]");
  if(k){ckSel=k.dataset.ckk;document.querySelectorAll("#ck .chip").forEach(c=>c.setAttribute("aria-pressed",c===k));return}
  const el=ev.target.closest("[data-ckg]");if(!el)return;
  if(el.dataset.ckg==="open")sheetCardio();
  else if(el.dataset.ckg==="go")goCardio();
  else sheetCardioAll();
});
