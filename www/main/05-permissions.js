"use strict";
/* İzinler: every permission the app can use in one list, with its state and a button that opens the right system screen directly, and a "Sırayla ayarla" button that walks through the missing ones.
   The list refreshes by itself when the app returns from the system settings. States come from the plugins; the battery screen cannot be read (null). */
/* One wording per permission: t and why for the list, warn for the warning rows on Today and in Reminders; dnd is the note about silent mode. */
const PM_TEXT={
  exact:{t:"Tam saatli alarm",why:"Hatırlatmalar tam saatinde çalsın; yoksa birkaç dakika gecikebilir.",warn:"Tam saat alarm izni kapalı: hatırlatmalar ve ilaç alarmı birkaç dakika gecikebilir. İzin verirsen tam saatinde çalar."},
  fsi:{t:"Tam ekran bildirim",why:"İlaç alarmı kilitli ekranı açıp ekranı yaksın diye (Android 14 ve üstü).",warn:"Tam ekran bildirim izni kapalı: ilaç alarmı kilitli ekranı açmayabilir. İzin verirsen alarm ekranı yakar."},
  dnd:"Telefon sessizdeyken ya da Rahatsız Etme açıkken ilaç alarmının sesi telefonun kendi ayarına bağlıdır. Alarm sesini aç ve Rahatsız Etme ayarında alarmlara izin ver."
};
let pmNotif=null; // last known notification permission (true / false / null)
let bg={}; // background limits read from the alarm log (MedLib.bgState)
/* Items for the list. ok: true / false / null (cannot be checked). need: the person's current settings depend on it. */
function pmItems(){
  const st=S.settings,steps=!!(isNative()&&SC()),med=!!(st.medOn&&Meds.count()),p=motionPerm||{},items=[];
  items.push({id:"notif",t:"Bildirimler",why:"Su, ilaç ve diğer hatırlatmaların gelmesi için.",ok:pmNotif,need:true,go:async()=>{
    let r={display:"denied"};try{r=await LN().requestPermissions()}catch{}
    if(r.display!=="granted")openDH("openDetails")}});
  items.push({id:"exact",...PM_TEXT.exact,ok:exactOk,need:med,go:()=>exactAsk()});
  if(st.medOn)items.push({id:"fsi",...PM_TEXT.fsi,ok:fsiOk,need:med,go:()=>MW()?.fsiSettings().catch(()=>openDH("openDetails"))});
  if(steps)items.push({id:"act",t:"Fiziksel aktivite",why:"Adım sayar ve hareket algılama için; konum sormaz.",ok:st.stepsOn?p.activity===undefined?null:!!p.activity:false,need:st.stepsOn,go:async()=>{
    if(!st.stepsOn)return stepsOpen();
    let g={granted:false};try{g=await SC().requestAccess()}catch{}
    if(!g.granted)openDH("openDetails")}});
  if(steps&&st.stepsOn)items.push({id:"loc",t:"Konum (yalnız yürüyüşte)",why:"Elle başlattığın yürüyüşte mesafeyi daha doğru ölçmek için; vermezsen mesafe boyuna göre tahmin edilir.",ok:p.fine===undefined?null:!!p.fine,need:false,go:()=>walkGpsAsk()});
  if(isNative()){
    const xi=oemXiaomi(),why=bg.miss?"Planlanan bir alarm çalmadı. ":bg.slow?"Son alarm geç çaldı. ":bg.bo===false?"Pil kısıtlaması açık. ":"";
    const ok=bg.bo===false||bg.miss||bg.slow?false:bg.bo===true&&(bg.ontime||!xi)?true:null;
    items.push({id:"bat",t:"Pil ve otomatik başlatma",why:why+(xi?"Xiaomi telefonlarda bu iki ayar olmadan hatırlatmalar kaçabilir.":"Pil tasarrufu hatırlatmaları geciktiriyorsa uygulamayı kısıtlamadan çıkar.")+(ok===null?` Otomatik başlatma durumu okunamıyor, elle kontrol et: ${DH_PATH.openAutostart}.`:""),ok,need:xi||!!(bg.miss||bg.slow),go:batFix});
  }
  return items;
}
/* Items that matter for what is switched on and are missing: the Today row and the Settings summary use this. */
const pmMissing=()=>isNative()?pmItems().filter(i=>i.need&&i.ok===false):[];
/* Today shows one row instead of several separate permission rows when two or more are missing. */
const pmMany=()=>pmMissing().length>=2;
async function pmRefresh(){
  const ln=LN();
  if(ln){try{pmNotif=(await ln.checkPermissions()).display==="granted"}catch{}}
  try{const w=MW();if(w)fsiOk=(await w.fsi()).allowed!==false}catch{}
  try{if(ln)exactOk=(await ln.checkExactNotificationSetting()).exact_alarm!=="denied"}catch{}
  try{const w=MW();if(w){const r=await w.log();bg=MedLib.bgState(r.state||{},r.items||[],Date.now())}}catch{}
  await motionStatus();
  if(document.querySelector('#sheet [data-pm="wiz"]'))pmSheet();
  else if(tab==="today"||tab==="settings")render();
}
const PM_STATE={true:"✓ Tamam",false:"Kapalı",null:"Kontrol edilemiyor"};
function pmSheet(){
  if(!isNative()){openSheet(`<h3>İzinler</h3><p class="mut">İzinler yalnızca telefondaki uygulamada gösterilir.</p><button class="btn ghost" data-pm="close">Kapat</button>`);return}
  const items=pmItems(),miss=items.filter(i=>i.ok===false&&(i.need||i.id==="notif"));
  const rows=items.map(i=>`<div class="row"><span class="grow"><b>${esc(i.t)}</b><small class="db mut sm">${esc(i.why)}</small></span><span class="ta-r"><small class="db ${i.ok===false?"b7":"mut"} sm">${i.ok===null&&i.id==="bat"?"Elle kontrol et":PM_STATE[i.ok]}</small>${i.ok===true?"":`<button class="chip" data-pm="go:${i.id}" aria-label="${esc(i.t)}: ayarla">${i.ok===false?"İzin ver":"Aç"}</button>`}</span></div>`).join("");
  openSheet(`<h3>İzinler</h3><p class="mut sm">Her satırdaki düğme seni doğru ayar ekranına götürür. Geri dönünce liste kendiliğinden yenilenir.</p>
  <div data-pm="wiz">${miss.length?`<button class="mb-3 btn" data-pm="next">Sırayla ayarla (${miss.length} eksik, sonra otomatik başlatma)</button>`:`<p class="b7">Gereken izinlerin hepsi tamam.</p><button class="mb-3 btn ghost" data-pm="next">Otomatik başlatmayı kontrol et</button>`}</div>${rows}
  <p class="hint">${PM_TEXT.dnd}</p>
  <p class="hint">${bg.boot?`Telefon yeniden başlayınca ilaç alarmların kendiliğinden yeniden kurulur. Son kurulum: ${esc(MedLib.wakeLine(bg.boot))}.`:"Telefon yeniden başladıktan sonra NeoWell'i bir kez aç; alarmlar o zaman kurulur."}</p>
  <button class="mt-3 btn ghost" data-pm="close">Kapat</button>`);
}
function pmTodo(){
  const m=pmMissing(),r=(t,sub,btn)=>`<div class="row"><span>${Icons.svg("bell")} ${t}<small class="mut sm">${sub}</small></span><div class="acts">${btn}</div></div>`,open='<button class="chip" data-pm="open">Ayarla</button>';
  return [
    ...(isNative()&&bg.miss&&S.settings.medOn&&S.settings.alarmWarnDay!==dayKey()?[r("Bir ilaç alarmı çalmadı",`${MedLib.dhm(bg.miss)} alarmı çalmadı. Telefon NeoWell'i arka planda durdurmuş olabilir.`,open+'<button class="chip" data-pm="hidemiss">Kapat</button>')]:[]),
    ...(isNative()&&!bg.miss&&bg.off&&S.settings.medOn&&S.settings.alarmWarnDay!==dayKey()?[r("Telefon kapalıyken bir ilaç saati geçti",`${MedLib.dhm(bg.off)} alarmı telefon kapalıyken geçti. O dozu aldıysan İlaçlar'dan işaretle.`,'<button class="chip" data-pm="hidemiss">Kapat</button>')]:[]),
    /* Alone it gets its own row: without notifications the medication alarm is silent and nothing else says so. */
    ...(isNative()&&pmNotif===false&&m.length<2&&S.settings.medOn&&Meds.count()?[r("Bildirimler kapalı: ilaç hatırlatması gelmez","İzin vermezsen ilaç saatinde ne ses ne ekran gelir.",'<button class="chip" data-pm="go:notif">İzin ver</button>')]:[]),
    ...(m.length>=2?[r("İzinler eksik",`${esc(m.map(i=>i.t).join(", "))}. Hepsini tek yerden ayarla.`,open)]:[])
  ];
}
document.addEventListener("click",async ev=>{
  const el=ev.target.closest("[data-pm]");if(!el||el.dataset.pm==="wiz")return;
  const [a,arg]=el.dataset.pm.split(":");
  if(a==="open"){await pmRefresh();pmSheet()}
  else if(a==="close")closeSheet();
  else if(a==="hidemiss"){S.settings.alarmWarnDay=dayKey();save();render()}
  else if(a==="go"){const i=pmItems().find(x=>x.id===arg);if(i)await i.go()}
  else if(a==="next"){const i=pmItems().find(x=>x.ok===false&&(x.need||x.id==="notif"));if(i)await i.go();else openDH("openAutostart")}
});
document.addEventListener("visibilitychange",()=>{if(!document.hidden)pmRefresh()});
