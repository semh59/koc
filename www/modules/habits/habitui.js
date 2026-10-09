"use strict";
/* Oruç zamanlayıcısı, uyku ve ruh hali kayıtları. index.html'deki S, save, toast, openSheet, closeSheet, dayOptions, fday, dayKey, esc, num, render ile çalışır. */
const MOODS=["😞","😕","😐","🙂","😄"],MOODN=["Çok kötü","Kötü","Orta","İyi","Çok iyi"];
const hbDur=m=>`${Math.floor(m/60)} sa ${m%60} dk`;
const hbRow=(txt,act,sub="")=>`<div class="row"><span class="grow">${txt}${sub?`<small class="db mut ell">${sub}</small>`:""}</span><button class="del" data-hb="${act}" aria-label="Kaydı sil">${Icons.svg("x")}</button></div>`;
/* Geçmiş: son 7 kayıt açık, kalanı katlanır. */
const hbHist=rows=>rows.length?`<div class="grp">Geçmiş</div>${rows.slice(0,7).join("")}${rows.length>7?`<details class="acc"><summary>Daha fazla göster (${rows.length-7})</summary>${rows.slice(7).join("")}</details>`:""}`:"";
let hbMood=0;
/* Uyku, ruh hali ve oruç değişiklikleri tek "Geri al" ile önceki duruma döner (silme ve aynı güne yeniden giriş dahil). */
function hbSet(key,val,msg){
  const prev=S[key],apply=v=>{S[key]=v;save();render();if(key==="fast")scheduleReminders().then(setNotif)};
  apply(val);toast(msg,()=>apply(prev));
}
/* Uyku ve ruh hali: iki eşit karo, bugünkü değer karonun içinde; büyük yazıda tek sütuna iner. */
function habitRow(){
  const t=dayKey(),sl=S.sleep.find(x=>x.day===t),mo=S.mood.find(x=>x.day===t);
  const tile=(a,ic,name,val)=>`<button class="hbt" data-hb="${a}">${Icons.svg(ic)}<span class="grow"><b>${name}</b><span class="db mut sm num">${val}</span></span></button>`;
  return `<div class="hrow">${tile("sleep","moon","Uyku",sl?hbDur(sl.min):"Ekle")}${tile("mood","smile","Ruh hali",mo?MOODN[mo.v-1]:"Ekle")}</div>`;
}
/* Bugün yapılacaklar satırı: oruç açıksa sürüyor/başlat; plan ve geçmiş Ayarlar'da. Fren: sert engelde başlatılamaz (süren oruç bitirilebilir),
   yumuşakta "Hekimime danıştım" onayından sonra. */
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
  if(S.fast.plan>=18&&!st.fastLongOk){
    return void confirmSheet({title:"Uzun oruç başlatılsın mı?",body:`${S.fast.plan} saatlik oruç uzun bir plandır. Hekiminle konuştuysan devam et. Başlatılsın mı?`,ok:"Başlat"}).then(ok=>{if(ok){st.fastLongOk=true;fastGo()}});
  }
  fastSet(Date.now(),"Oruç başladı");
}
function fastSettingsHtml(){
  const f=S.fast,on=S.settings.fastOn,last=f.log.slice(-7).reverse().map(x=>hbRow(`${fd(dayKey(new Date(x.t1)))} ${hbDur(Math.round((x.t1-x.t0)/6e4))}`,"fdel:"+x.t0)).join("");
  return modRow('data-hb="fasttoggle"',on,"Oruç zamanlayıcısı","Aralıklı oruç süreni tutar.","hlpfs","Planı burada seçersin; orucu Bugün ekranından başlatıp bitirirsin. İlk açılışta kimlerin oruç tutmaması gerektiği gösterilir. Uzun planlar sağlık işaretinde kapanır.",
    `<div class="lbl">Plan (oruç:yeme saati)</div><div class="chiprow">${HabitLib.PLANS.map(p=>`<button class="chip" data-hb="plan:${p}" aria-pressed="${f.plan===p}"${p>=18&&risk().hard.length?" disabled":""}>${p}:${24-p}</button>`).join("")}</div>`)
  +(last?`<div class="mt-2 mut sm">Son oruçlar</div>${last}`:"");
}
function fastSet(t0,msg){
  S.fast.t0=t0;save();render();scheduleReminders().then(setNotif);toast(msg);
}
function fastEnd(){
  const r=HabitLib.endFast(S.fast,Date.now());
  hbSet("fast",r.fast,r.min<1?"Oruç 1 dakikadan kısa, geçmişe yazılmadı":r.capped?"Oruç bitti: 72 saatten uzun sürdüğü için 72 saat olarak kaydedildi":`Oruç bitti: ${hbDur(r.min)}`);
}
setInterval(()=>{if(S.fast.t0&&tab==="today"&&!document.hidden&&!$("#sheet").classList.contains("on"))render()},6e4);
function sheetSleep(){
  openSheet(`<h3>Uyku</h3>${dayOptions().replace(">Gün<",">Kalkış günü<")}
  <label class="lbl" for="hbb">Yattığın saat</label><input class="in" type="time" id="hbb">
  <label class="lbl" for="hbw">Kalktığın saat</label><input class="in" type="time" id="hbw">
  <label class="lbl" for="hbh">Ya da toplam süre (saat)</label><input class="in num" id="hbh" inputmode="decimal" placeholder="örn. 7,5" autocomplete="off">
  <label class="lbl" for="hbq">Uyku kalitesi (isteğe bağlı)</label><select class="in" id="hbq"><option value="">Seçilmedi</option>${MOODN.map((l,i)=>`<option value="${i+1}">${i+1} · ${l}</option>`).join("")}</select>
  <div class="ferr" id="hberr" role="alert"></div><button class="btn" data-hb="sleepgo">Kaydet</button>${hbHist(S.sleep.slice().reverse().map(x=>hbRow(`<b class="num">${hbDur(x.min)}</b>`,"sdel:"+x.day,`${fd(x.day)}${x.q?` · Kalite: ${MOODN[x.q-1].toLowerCase()}`:""}`)))}`);
}
function sleepSave(){
  const b=$("#hbb").value,w=$("#hbw").value,h=num($("#hbh").value);
  const min=b&&w?HabitLib.sleepMin(b,w):isNaN(h)?null:Math.round(h*60);
  if(!(min>=60&&min<=1080))return ferr("hberr","Süreyi kontrol et: 1 ile 18 saat arası olmalı");
  const day=fday(),old=S.sleep.some(x=>x.day===day),q=+$("#hbq").value;
  closeSheet();hbSet("sleep",HabitLib.cleanSleep(S.sleep.filter(x=>x.day!==day).concat({day,min,q})),`Uyku ${old?"güncellendi":"kaydedildi"}: ${hbDur(min)}`);
}
/* Yüz seçilir, not isteğe bağlı, kayıt "Kaydet" ile. Seçili günün kaydı varsa yüz ve not dolu gelir (sonradan not eklenebilir). */
function moodFill(){
  const mo=S.mood.find(x=>x.day===fday()),n=$("#hbn");hbMood=mo?mo.v:0;
  document.querySelectorAll('[data-hb^="mood:"]').forEach(b=>b.setAttribute("aria-pressed",+b.dataset.hb.slice(5)===hbMood));
  if(n)n.value=mo&&mo.t||"";
}
function sheetMood(){
  openSheet(`<h3>Ruh halin</h3>${dayOptions()}<div class="lbl" id="hbml">Nasıl hissediyorsun?</div><div class="moods" role="group" aria-labelledby="hbml">${MOODS.map((e,i)=>`<button class="chip" data-hb="mood:${i+1}" aria-pressed="false"><span class="t-h2" aria-hidden="true">${e}</span><small>${MOODN[i]}</small></button>`).join("")}</div>
  <label class="lbl" for="hbn">Kısa not (isteğe bağlı)</label><input class="in" id="hbn" maxlength="100" placeholder="örn. Yoğun bir gündü" autocomplete="off">
  <div class="ferr" id="hberr" role="alert"></div><button class="btn" data-hb="moodgo">Kaydet</button>${hbHist(S.mood.slice().reverse().map(x=>hbRow(`<span aria-hidden="true">${MOODS[x.v-1]}</span> ${MOODN[x.v-1]}`,"mdel:"+x.day,fd(x.day)+(x.t?" · "+esc(x.t):""))))}`);
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
  if(a==="sleep")sheetSleep();
  else if(a==="fasttoggle"){if(S.fast.t0)return toast("Önce orucu bitir");if(!S.settings.fastOn&&!S.settings.fastInfoOk)return fastInfo();S.settings.fastOn=!S.settings.fastOn;if(!S.settings.fastOn)S.settings.reminders.find(r=>r.id===11).on=false;save();render();scheduleReminders().then(setNotif)}
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
