"use strict";
/* Fast timer, sleep and mood records. */
const MOODS=["😞","😕","😐","🙂","😄"],MOODN=["Çok kötü","Kötü","Orta","İyi","Çok iyi"];
const HB_SHOWN=7,FAST_REMINDER=11,LONG_PLAN=18;
const hbDur=m=>`${Math.floor(m/60)} sa ${m%60} dk`;
const hbRow=(txt,act,sub="",edit="")=>{const t=`<span class="grow">${txt}${sub?`<small class="db mut ell">${sub}</small>`:""}</span>`;return `<div class="${edit?"prow":"row"}">${edit?`<button class="grow pbtn" data-hb="${edit}">${t}</button>`:t}<button class="del" data-hb="${act}" aria-label="Kaydı sil">${Icons.svg("x")}</button></div>`};
/* History: the newest HB_SHOWN records are open, the rest fold away. */
const hbHist=rows=>rows.length?`<div class="grp">Geçmiş</div>${rows.slice(0,HB_SHOWN).join("")}${rows.length>HB_SHOWN?`<details class="acc"><summary>Daha fazla göster (${rows.length-HB_SHOWN})</summary>${rows.slice(HB_SHOWN).join("")}</details>`:""}`:"";
let hbMood=0;
/* Sleep, mood and fast changes (deletes and re-entry for the same day included) are undone with one "Geri al". */
function hbSet(key,val,msg){
  const prev=S[key],apply=v=>{const was=S[key];S[key]=v;if(!commit(()=>{S[key]=was}))return false;render();if(key==="fast")scheduleReminders().then(setNotif);return true};
  if(apply(val))toast(msg,()=>apply(prev));
}
/* Sleep and mood: two equal tiles with today's value inside; with large text they stack in one column. */
function habitRow(){
  const t=dayKey(),sl=S.sleep.find(x=>x.day===t),mo=S.mood.find(x=>x.day===t);
  const tile=(a,ic,name,val)=>`<button class="hbt" data-hb="${a}">${Icons.svg(ic)}<span class="grow"><b>${name}</b><span class="db mut sm num">${val}</span></span></button>`;
  return `<div class="hrow">${tile("sleep","moon","Uyku",sl?hbDur(sl.min):"Ekle")}${tile("mood","smile","Ruh hali",mo?MOODN[mo.v-1]:"Ekle")}</div>`;
}
/* Today row: shows the running fast or the start button when fasting is on; plan and history are in Settings. Brake: a hard risk flag blocks starting (a running fast can still be ended),
   a soft one only after "Hekimime danıştım". */
function fastTodo(){
  const f=S.fast,st=S.settings;if(!st.fastOn)return [];
  const s=HabitLib.fastState(f,Date.now()),r=risk(),hard=r.hard.length;
  const warn=r.block?`<small class="mut sm">${esc((hard?r.hard:r.soft).join(". "))}. ${hard?"Oruç önerilmez, hekimine danış.":"Oruç öncesi hekimine danış."}</small>`:"";
  return [s?`<div class="row"><span>${Icons.svg("fast")} Oruç ${f.plan}:${24-f.plan} · <b class="num">${hbDur(s.elapsed)}</b> geçti<small class="mut sm num">${s.done?"Hedef doldu":hbDur(s.left)+" kaldı"}</small>${warn}</span><button class="chip" data-hb="fastend">Orucu bitir</button></div>`
    :`<div class="row"><span>${Icons.svg("fast")} Oruç ${f.plan}:${24-f.plan}${warn||`<small class="mut sm">Plan Ayarlar > Modüller'de değişir</small>`}</span>${hard?"":r.block?`<button class="chip" data-act="riskok">Hekimime danıştım</button>`:`<button class="chip" data-hb="fastgo">Orucu başlat</button>`}</div>`];
}
function fastInfo(){
  openSheet(`<h3>Oruç zamanlayıcısı</h3><div class="banner"><b>Aralıklı oruç herkes için uygun değildir.</b><p>Şu durumlarda yapma ya da önce hekimine danış: Hamilelik ya da emzirme, 18 yaş altı, yeme bozukluğu geçmişi, diyabet, insülin ya da şeker düşüren ilaç kullanımı, düşük kilo. Baş dönmesi, halsizlik ya da çarpıntı olursa orucu bitir ve hekimine danış.</p></div>
  <p class="hint">${MED_NOTE}</p>${swRow('id="fic"',false,"Okudum; bu durumlar bende yok ya da hekimime danıştım")}<button class="btn" data-hb="fastinfo">Oruç zamanlayıcısını aç</button>`);
}
function fastGo(){
  const st=S.settings;
  if(risk().block)return render();
  if(!st.fastInfoOk)return fastInfo();
  if(S.fast.plan>=LONG_PLAN&&!st.fastLongOk){
    confirmSheet({title:"Uzun oruç başlatılsın mı?",body:`${S.fast.plan} saatlik oruç uzun bir plandır. Hekiminle konuştuysan devam et. Başlatılsın mı?`,ok:"Başlat"}).then(ok=>{if(ok){st.fastLongOk=true;fastGo()}});
    return;
  }
  fastSet(Date.now(),"Oruç başladı");
}
function fastSettingsHtml(){
  const f=S.fast,on=S.settings.fastOn,last=f.log.slice(-HB_SHOWN).reverse().map(x=>hbRow(`${fd(dayKey(new Date(x.t1)))} ${hbDur(Math.round((x.t1-x.t0)/6e4))}`,"fdel:"+x.t0)).join("");
  return modRow('data-hb="fasttoggle"',on,"Oruç zamanlayıcısı","Aralıklı oruç süreni tutar.","hlpfs","Planı burada seçersin; orucu Bugün ekranından başlatıp bitirirsin. İlk açılışta kimlerin oruç tutmaması gerektiği gösterilir. Uzun planlar sağlık işaretinde kapanır.",
    `<div class="lbl">Plan (oruç:yeme saati)</div><div class="chiprow">${HabitLib.PLANS.map(p=>`<button class="chip" data-hb="plan:${p}" aria-pressed="${f.plan===p}"${p>=LONG_PLAN&&risk().hard.length?" disabled":""}>${p}:${24-p}</button>`).join("")}</div>`)
  +(last?`<div class="mt-2 mut sm">Son oruçlar</div>${last}`:"");
}
function fastToggle(){
  const st=S.settings;
  if(S.fast.t0)return toast("Önce orucu bitir");
  if(!st.fastOn&&!st.fastInfoOk)return fastInfo();
  st.fastOn=!st.fastOn;
  if(!st.fastOn)st.reminders.find(r=>r.id===FAST_REMINDER).on=false;
  save();render();scheduleReminders().then(setNotif);
}
function fastSet(t0,msg){
  S.fast.t0=t0;save();render();scheduleReminders().then(setNotif);toast(msg);
}
function fastEnd(){
  const r=HabitLib.endFast(S.fast,Date.now());
  hbSet("fast",r.fast,r.min<1?"Oruç 1 dakikadan kısa, geçmişe yazılmadı":r.capped?"Oruç bitti: 72 saatten uzun sürdüğü için 72 saat olarak kaydedildi":`Oruç bitti: ${hbDur(r.min)}`);
}
setInterval(()=>{if(S.fast.t0&&tab==="today"&&!document.hidden&&!$("#sheet").classList.contains("on"))render()},6e4);
function sheetSleep(day){
  const x=S.sleep.find(s=>s.day===day);
  openSheet(`<h3>Uyku</h3>${dayOptions(false,day).replace(">Gün<",">Kalkış günü<")}
  <label class="lbl" for="hbb">Yattığın saat</label><input class="in" type="time" id="hbb">
  <label class="lbl" for="hbw">Kalktığın saat</label><input class="in" type="time" id="hbw">
  <label class="lbl" for="hbh">Ya da toplam süre (saat)</label><input class="in num" id="hbh" inputmode="decimal" placeholder="örn. 7,5" value="${x?String(Math.round(x.min/6)/10).replace(".",","):""}" autocomplete="off">
  <label class="lbl" for="hbq">Uyku kalitesi (isteğe bağlı)</label><select class="in" id="hbq"><option value="">Seçilmedi</option>${MOODN.map((l,i)=>`<option value="${i+1}"${x&&x.q===i+1?" selected":""}>${i+1} · ${l}</option>`).join("")}</select>
  <div class="ferr" id="hberr" role="alert"></div><button class="btn" data-hb="sleepgo">Kaydet</button>${hbHist(S.sleep.slice().reverse().map(x=>hbRow(`<b class="num">${hbDur(x.min)}</b>`,"sdel:"+x.day,`${fd(x.day)}${x.q?` · Kalite: ${MOODN[x.q-1].toLowerCase()}`:""}`,"sedit:"+x.day)))}`);
}
/* More tab entry: weekly summary of the newest 7 sleep and mood records with the Health Connect source marked, and shortcuts to add either. */
function sheetSleepMood(){
  const sl=S.sleep.slice(-7),mo=S.mood.slice(-7),avg=a=>a.reduce((t,x)=>t+x,0)/a.length;
  const sq=sl.filter(x=>x.q);
  const sum=sl.length?`<div class="row"><span class="grow">Son ${sl.length} gecenin ortalaması<small class="db mut">${sq.length?`Ortalama kalite: ${MOODN[Math.round(avg(sq.map(x=>x.q)))-1].toLowerCase()}`:"Kalite girilmedi"}</small></span><b class="num">${hbDur(Math.round(avg(sl.map(x=>x.min))))}</b></div>`:`<p class="mut">Henüz uyku kaydı yok. Saatten alabilir ya da elle ekleyebilirsin.</p>`;
  const nights=sl.slice().reverse().map(x=>`<div class="prow"><button class="grow pbtn" data-hb="sedit:${x.day}"><span class="grow">${fd(x.day)}${x.src==="hc"?`<small class="db mut">Saatten (Health Connect)</small>`:x.q?`<small class="db mut">Kalite: ${MOODN[x.q-1].toLowerCase()}</small>`:""}</span><b class="num">${hbDur(x.min)}</b></button></div>`).join("");
  const moods=mo.length?`<div class="grp">Ruh hali</div>${mo.slice().reverse().map(x=>`<div class="prow"><button class="grow pbtn" data-hb="medit:${x.day}"><span class="grow"><span aria-hidden="true">${MOODS[x.v-1]}</span> ${MOODN[x.v-1]}<small class="db mut ell">${fd(x.day)}${x.t?" · "+esc(x.t):""}</small></span></button></div>`).join("")}`:"";
  openSheet(`<h3>Uyku ve ruh hali</h3>${sum}${nights?`<div class="grp">Geceler</div>${nights}`:""}${moods}<div class="hrow mt-2"><button class="btn" data-hb="sleep">Uyku ekle</button><button class="btn" data-hb="mood">Ruh hali ekle</button></div>`);
}
function sleepSave(){
  const b=$("#hbb").value,w=$("#hbw").value,h=num($("#hbh").value);
  const min=b&&w?HabitLib.sleepMin(b,w):isNaN(h)?null:Math.round(h*60);
  if(!(min>=HabitLib.SLEEP_LIM[0]&&min<=HabitLib.SLEEP_LIM[1]))return ferr("hberr","Süreyi kontrol et: 1 ile 18 saat arası olmalı");
  const day=fday(),old=S.sleep.some(x=>x.day===day),q=+$("#hbq").value;
  closeSheet();hbSet("sleep",HabitLib.cleanSleep(S.sleep.filter(x=>x.day!==day).concat({day,min,q})),`Uyku ${old?"güncellendi":"kaydedildi"}: ${hbDur(min)}`);
}
/* A face is picked, the note is optional, saving is with "Kaydet". If the chosen day already has a record, the face and note come filled in (a note can be added later). */
function moodFill(){
  const mo=S.mood.find(x=>x.day===fday()),n=$("#hbn");hbMood=mo?mo.v:0;
  document.querySelectorAll('[data-hb^="mood:"]').forEach(b=>b.setAttribute("aria-pressed",+b.dataset.hb.slice(5)===hbMood));
  if(n)n.value=mo&&mo.t||"";
}
function sheetMood(day){
  openSheet(`<h3>Ruh halin</h3>${dayOptions(false,day)}<div class="lbl" id="hbml">Nasıl hissediyorsun?</div><div class="moods" role="group" aria-labelledby="hbml">${MOODS.map((e,i)=>`<button class="chip" data-hb="mood:${i+1}" aria-pressed="false"><span class="t-h2" aria-hidden="true">${e}</span><small>${MOODN[i]}</small></button>`).join("")}</div>
  <label class="lbl" for="hbn">Kısa not (isteğe bağlı)</label><input class="in" id="hbn" maxlength="${HabitLib.NOTE_MAX}" placeholder="örn. Yoğun bir gündü" autocomplete="off">
  <div class="ferr" id="hberr" role="alert"></div><button class="btn" data-hb="moodgo">Kaydet</button>${hbHist(S.mood.slice().reverse().map(x=>hbRow(`<span aria-hidden="true">${MOODS[x.v-1]}</span> ${MOODN[x.v-1]}`,"mdel:"+x.day,fd(x.day)+(x.t?" · "+esc(x.t):""),"medit:"+x.day)))}`);
  moodFill();
}
function moodSave(v){
  if(!v)return ferr("hberr","Önce nasıl hissettiğini seç");
  const day=fday(),old=S.mood.some(x=>x.day===day),t=$("#hbn").value;
  closeSheet();hbSet("mood",HabitLib.cleanMood(S.mood.filter(x=>x.day!==day).concat({day,v,t})),`Ruh hali ${old?"güncellendi":"kaydedildi"}`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-hb]");if(!el)return;
  const a=el.dataset.hb;
  if(a==="more")sheetSleepMood();
  else if(a==="sleep")sheetSleep();
  else if(a.startsWith("sedit:"))sheetSleep(a.slice(6));
  else if(a.startsWith("medit:"))sheetMood(a.slice(6));
  else if(a==="fasttoggle")fastToggle();
  else if(a.startsWith("plan:")){S.fast.plan=+a.slice(5);save();render()}
  else if(a==="fastgo")fastGo();
  else if(a==="fastinfo"){if(!$("#fic").checked)return toast("Önce kutuyu işaretle");Object.assign(S.settings,{fastInfoOk:true,fastOn:true});save();closeSheet();render();scheduleReminders().then(setNotif)}
  else if(a==="fastend")fastEnd();
  else if(a==="sleepgo")sleepSave();
  else if(a==="mood")sheetMood();
  else if(a.startsWith("mood:")){hbMood=+a.slice(5);document.querySelectorAll('[data-hb^="mood:"]').forEach(b=>b.setAttribute("aria-pressed",b===el))}
  else if(a==="moodgo")moodSave(hbMood);
  else if(a.startsWith("sdel:")){closeSheet();hbSet("sleep",S.sleep.filter(x=>x.day!==a.slice(5)),"Uyku kaydı silindi")}
  else if(a.startsWith("mdel:")){closeSheet();hbSet("mood",S.mood.filter(x=>x.day!==a.slice(5)),"Ruh hali kaydı silindi")}
  else if(a.startsWith("fdel:"))hbSet("fast",{...S.fast,log:S.fast.log.filter(x=>x.t0!==+a.slice(5))},"Oruç kaydı silindi");
});
document.addEventListener("change",ev=>{if(ev.target.id==="fday"&&$("#hbn"))moodFill()});
