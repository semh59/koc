"use strict";
/* Oruç zamanlayıcısı, uyku ve ruh hali kayıtları. index.html'deki S, save, toast, openSheet, closeSheet, dayOptions, fday, dayKey, esc, num, render ile çalışır. */
const MOODS=["😞","😕","😐","🙂","😄"];
const hbDur=m=>`${Math.floor(m/60)} sa ${m%60} dk`;
const hbRow=(txt,act)=>`<div class="row" style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-top:1px solid var(--line)"><span>${txt}</span><button class="del" data-hb="${act}" aria-label="Kaydı sil">✕</button></div>`;
/* Uyku, ruh hali ve oruç değişiklikleri tek "Geri al" ile önceki duruma döner (silme ve aynı güne yeniden giriş dahil). */
function hbSet(key,val,msg){
  const prev=S[key],apply=v=>{S[key]=v;save();render();if(key==="fast")scheduleReminders().then(setNotif)};
  apply(val);toast(msg,()=>apply(prev));
}
function habitRow(){
  const t=dayKey(),sl=S.sleep.find(x=>x.day===t),mo=S.mood.find(x=>x.day===t);
  return `<div class="hrow"><button class="btn ghost" data-hb="sleep">😴 ${sl?hbDur(sl.min):"Uyku ekle"}</button><button class="btn ghost" data-hb="mood">${mo?MOODS[mo.v-1]+" Ruh hali":"🙂 Ruh hali"}</button></div>`;
}
/* Bugün yapılacaklar satırı: oruç açıksa sürüyor/başlat; plan ve geçmiş Ayarlar'da. */
function fastTodo(){
  const f=S.fast,st=S.settings;if(!st.fastOn)return [];
  const s=HabitLib.fastState(f,Date.now()),warn=Algo.lossBlock({age:st.age,cm:0,kg:0,goalKg:0,health:!!st.healthNote.trim()})?`<small class="mut sm">Oruç öncesi hekimine danış.</small>`:"";
  return [s?`<div class="row"><span>⏳ Oruç ${f.plan}:${24-f.plan} · <b class="num">${hbDur(s.elapsed)}</b> geçti<small class="mut sm num">${s.done?"Hedef doldu":hbDur(s.left)+" kaldı"}</small>${warn}</span><button class="chip" data-hb="fastend">Orucu bitir</button></div>`
    :`<div class="row"><span>⏳ Oruç ${f.plan}:${24-f.plan}<small class="mut sm">Plan Ayarlar'da değişir</small>${warn}</span><button class="chip" data-hb="fastgo">Orucu başlat</button></div>`];
}
function fastSettingsHtml(){
  const f=S.fast,on=S.settings.fastOn,last=f.log.slice(-7).reverse().map(x=>hbRow(`${dm(dayKey(new Date(x.t1)))} ${hbDur(Math.round((x.t1-x.t0)/6e4))}`,"fdel:"+x.t0)).join("");
  return `<h2>Oruç zamanlayıcısı</h2><div class="card"><button class="btn ghost" data-hb="fasttoggle">${on?"Oruç zamanlayıcısını kapat":"Oruç zamanlayıcısını aç"}</button>
  ${on?`<div class="lbl" style="margin-top:10px">Plan (oruç:yeme saati)</div><div class="chiprow">${HabitLib.PLANS.map(p=>`<button class="chip" data-hb="plan:${p}" aria-pressed="${f.plan===p}">${p}:${24-p}</button>`).join("")}</div>`:""}
  ${last?`<div class="mut sm" style="margin-top:8px">Son oruçlar</div>${last}`:""}</div>`;
}
function fastSet(t0,msg){
  S.fast.t0=t0;save();render();scheduleReminders().then(setNotif);toast(msg);
}
function fastEnd(){
  const r=HabitLib.endFast(S.fast,Date.now());
  hbSet("fast",r.fast,r.min<1?"Oruç 1 dakikadan kısa, geçmişe yazılmadı":r.capped?"Oruç bitti: 72 saatten uzun sürdüğü için 72 saat olarak kaydedildi":`Oruç bitti: ${hbDur(r.min)}`);
}
setInterval(()=>{if(S.fast.t0&&tab==="bugun"&&!document.hidden&&!$("#sheet").classList.contains("on"))render()},6e4);
function sheetUyku(){
  openSheet(`<h3>Uyku</h3>${dayOptions().replace(">Gün<",">Kalkış günü<")}
  <div class="lbl">Yattığın saat</div><input class="in" type="time" id="hbb">
  <div class="lbl">Kalktığın saat</div><input class="in" type="time" id="hbw">
  <div class="lbl">Ya da süre (saat)</div><input class="in num" id="hbh" inputmode="decimal" placeholder="7,5" autocomplete="off">
  <div class="lbl">Kalite (isteğe bağlı)</div><select class="in" id="hbq"><option value="">–</option>${[1,2,3,4,5].map(i=>`<option>${i}</option>`).join("")}</select>
  <button class="btn" data-hb="sleepgo">Kaydet</button>${S.sleep.slice().reverse().map(x=>hbRow(`${dm(x.day)} ${hbDur(x.min)}${x.q?` · kalite ${x.q}`:""}`,"sdel:"+x.day)).join("")}`);
}
function sleepSave(){
  const b=$("#hbb").value,w=$("#hbw").value,h=num($("#hbh").value);
  const min=b&&w?HabitLib.sleepMin(b,w):isNaN(h)?null:Math.round(h*60);
  if(!(min>=60&&min<=1080))return toast("Süreyi kontrol et (1 ile 18 saat arası)");
  const day=fday(),old=S.sleep.some(x=>x.day===day),q=+$("#hbq").value;
  closeSheet();hbSet("sleep",HabitLib.cleanSleep(S.sleep.filter(x=>x.day!==day).concat({day,min,q})),`Uyku ${old?"güncellendi":"kaydedildi"}: ${hbDur(min)}`);
}
function sheetMood(){
  openSheet(`<h3>Ruh halin</h3>${dayOptions()}<div class="chiprow">${MOODS.map((e,i)=>`<button class="chip" data-hb="mood:${i+1}" aria-label="Ruh hali ${i+1} / 5" style="font-size:24px">${e}</button>`).join("")}</div>
  <input class="in" id="hbn" maxlength="100" placeholder="Kısa not (isteğe bağlı)" autocomplete="off">${S.mood.slice().reverse().map(x=>hbRow(`${dm(x.day)} ${MOODS[x.v-1]}${x.t?" "+esc(x.t):""}`,"mdel:"+x.day)).join("")}`);
}
function moodSave(v){
  const day=fday(),old=S.mood.some(x=>x.day===day),t=$("#hbn").value;
  closeSheet();hbSet("mood",HabitLib.cleanMood(S.mood.filter(x=>x.day!==day).concat({day,v,t})),`Ruh hali ${old?"güncellendi":"kaydedildi"}`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-hb]");if(!el)return;
  const a=el.dataset.hb;
  if(a==="sleep")sheetUyku();
  else if(a==="fasttoggle"){if(S.fast.t0)return toast("Önce orucu bitir");S.settings.fastOn=!S.settings.fastOn;if(!S.settings.fastOn)S.settings.reminders.find(r=>r.id===11).on=false;save();render();scheduleReminders().then(setNotif)}
  else if(a.startsWith("plan:")){S.fast.plan=+a.slice(5);save();render()}
  else if(a==="fastgo")fastSet(Date.now(),"Oruç başladı");
  else if(a==="fastend")fastEnd();
  else if(a==="sleepgo")sleepSave();
  else if(a==="mood")sheetMood();
  else if(a.startsWith("mood:"))moodSave(+a.slice(5));
  else if(a.startsWith("sdel:")){closeSheet();hbSet("sleep",S.sleep.filter(x=>x.day!==a.slice(5)),"Uyku kaydı silindi")}
  else if(a.startsWith("mdel:")){closeSheet();hbSet("mood",S.mood.filter(x=>x.day!==a.slice(5)),"Ruh hali kaydı silindi")}
  else if(a.startsWith("fdel:"))hbSet("fast",{...S.fast,log:S.fast.log.filter(x=>x.t0!==+a.slice(5))},"Oruç kaydı silindi");
});
