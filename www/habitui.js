"use strict";
/* Oruç zamanlayıcısı, uyku ve ruh hali kayıtları. index.html'deki S, save, toast, openSheet, closeSheet, dayOptions, fday, dayKey, esc, num, render ile çalışır. */
const MOODS=["😞","😕","😐","🙂","😄"];
const hbDur=m=>`${Math.floor(m/60)} sa ${m%60} dk`;
function habitCard(){
  const t=dayKey(),sl=S.sleep.find(x=>x.day===t),mo=S.mood.find(x=>x.day===t);
  return `<div class="card"><div class="btns" style="grid-template-columns:1fr 1fr;margin:0"><button class="btn ghost" data-hb="sleep">😴 ${sl?hbDur(sl.min):"Uyku ekle"}</button><button class="btn ghost" data-hb="mood">${mo?MOODS[mo.v-1]+" Ruh hali":"🙂 Ruh hali"}</button></div></div>`;
}
function fastCard(){
  const f=S.fast,s=HabitLib.fastState(f,Date.now()),st=S.settings,last=f.log.slice(-7).reverse().map(x=>`${dm(dayKey(new Date(x.t1)))} ${hbDur(Math.round((x.t1-x.t0)/6e4))}`).join(" · ");
  const warn=Algo.lossBlock({age:st.age,cm:0,kg:0,goalKg:0,health:!!st.healthNote.trim()})?`<p class="hint">Oruç öncesi hekimine danış.</p>`:"";
  const body=s?`<div class="row"><span class="num"><b>${hbDur(s.elapsed)}</b> geçti</span><span class="mut sm">${s.done?"Hedef doldu":hbDur(s.left)+" kaldı"}</span></div><div class="btns"><button class="btn" data-hb="fastend">Orucu bitir</button></div>`
    :`<div class="chiprow">${HabitLib.PLANS.map(p=>`<button class="chip" data-hb="plan:${p}" aria-pressed="${f.plan===p}">${p}:${24-p}</button>`).join("")}</div><div class="btns"><button class="btn" data-hb="fastgo">Orucu başlat</button></div>`;
  return `<div class="card"><div class="lbl">⏳ Oruç${s?` ${f.plan}:${24-f.plan}`:""}</div>${body}${last?`<p class="hint">Son oruçlar: ${last}</p>`:""}${warn}</div>`;
}
function fastSet(t0,msg){
  S.fast.t0=t0;save();render();scheduleReminders().then(setNotif);toast(msg);
}
function fastEnd(){
  const f=S.fast;S.fast=HabitLib.cleanFast({...f,t0:null,log:f.log.concat({t0:f.t0,t1:Date.now()})});
  save();render();scheduleReminders().then(setNotif);toast("Oruç bitti");
}
setInterval(()=>{if(S.fast.t0&&tab==="bugun"&&!document.hidden&&!$("#sheet").classList.contains("on"))render()},6e4);
function sheetUyku(){
  openSheet(`<h3>Uyku</h3>${dayOptions().replace(">Gün<",">Kalkış günü<")}
  <div class="lbl">Yattığın saat</div><input class="in" type="time" id="hbb">
  <div class="lbl">Kalktığın saat</div><input class="in" type="time" id="hbw">
  <div class="lbl">Ya da süre (saat)</div><input class="in num" id="hbh" inputmode="decimal" placeholder="7,5" autocomplete="off">
  <div class="lbl">Kalite (isteğe bağlı)</div><select class="in" id="hbq"><option value="">–</option>${[1,2,3,4,5].map(i=>`<option>${i}</option>`).join("")}</select>
  <button class="btn" data-hb="sleepgo">Kaydet</button>`);
}
function sleepSave(){
  const b=$("#hbb").value,w=$("#hbw").value,h=num($("#hbh").value);
  const min=b&&w?HabitLib.sleepMin(b,w):isNaN(h)?null:Math.round(h*60);
  if(!(min>=60&&min<=1080))return toast("Süreyi kontrol et (1 ile 18 saat arası)");
  const day=fday();
  S.sleep=HabitLib.cleanSleep(S.sleep.filter(x=>x.day!==day).concat({day,min,q:+$("#hbq").value}));
  save();closeSheet();render();toast(`Uyku kaydedildi: ${hbDur(min)}`);
}
function sheetMood(){
  openSheet(`<h3>Ruh halin</h3>${dayOptions()}<div class="chiprow">${MOODS.map((e,i)=>`<button class="chip" data-hb="mood:${i+1}" aria-label="Ruh hali ${i+1} / 5" style="font-size:24px">${e}</button>`).join("")}</div>
  <input class="in" id="hbn" maxlength="100" placeholder="Kısa not (isteğe bağlı)" autocomplete="off">`);
}
function moodSave(v){
  const day=fday();
  S.mood=HabitLib.cleanMood(S.mood.filter(x=>x.day!==day).concat({day,v,t:$("#hbn").value}));
  save();closeSheet();render();toast("Ruh hali kaydedildi");
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-hb]");if(!el)return;
  const a=el.dataset.hb;
  if(a==="sleep")sheetUyku();
  else if(a.startsWith("plan:")){S.fast.plan=+a.slice(5);save();render()}
  else if(a==="fastgo")fastSet(Date.now(),"Oruç başladı");
  else if(a==="fastend")fastEnd();
  else if(a==="sleepgo")sleepSave();
  else if(a==="mood")sheetMood();
  else if(a.startsWith("mood:"))moodSave(+a.slice(5));
});
