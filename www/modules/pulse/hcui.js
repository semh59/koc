"use strict";
/* Health Connect: saatin adımları (Samsung Health aracılığıyla) okunur. Yalnız okuma; telefon sayacıyla toplanmaz, günün büyük değeri alınır (setSteps/setHc).
   S, save, toast, render, keyOff, dayKey, swRow index.html'dedir. */
const HP=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Health;
let hcToday=null,hcDay="",hcAt=0,hcBusy=false,hcInfo=null,hcAsked=false;
const HC_EVERY=60000,HC_RETRY=5000;
/* Gece yarısından sonra dünün değeri bugün sayılmasın (okuma başarısız olsa bile). */
const hcNow=()=>hcDay===dayKey()?hcToday:null;

async function hcStatus(){
  const p=HP();if(!p)return null;
  try{hcInfo=await p.status()}catch(e){hcInfo={available:false,granted:false}}
  return hcInfo;
}
async function hcSync(force){
  const p=HP();if(!S.settings.hcOn||!p||hcBusy||(!force&&Date.now()-hcAt<HC_EVERY))return;
  hcBusy=true;
  try{
    const was=hcInfo&&hcInfo.granted,st=await hcStatus();
    if(!st||!st.available||!st.granted){
      hcAt=Date.now()-HC_EVERY+HC_RETRY; // izin verilene kadar saniyede bir değil, 5 sn'de bir bakılır
      if(hcToday!=null){hcToday=null;if(tab==="steps")render()}
      else if(was!==false&&hcInfo&&tab==="steps")render(); // kart "izin ver" durumuna geçsin
      return;
    }
    const days=[];for(let i=0;i<8;i++)days.push(keyOff(-i));
    const r=await p.steps({days}),m=(r&&r.days)||{};
    hcAt=Date.now();hcDay=dayKey();let ch=was===false;
    for(const d of days)if(typeof m[d]==="number"&&dayOk(d)&&setHc(d,m[d]))ch=true;
    const t=typeof m[dayKey()]==="number"?m[dayKey()]:null;
    if(hcToday!==t){hcToday=t;ch=true}
    if(st.sleep||st.hr){try{if(hcApplyDaily(await p.daily({days}),days))ch=true}catch(e){}}
    if(ch){save();if((tab==="today"||tab==="steps")&&!$("#sheet").classList.contains("on")&&!viewBusy())render();else widgetPush()}
  }catch(e){}finally{hcBusy=false}
}
/* Uyku (yatakta geçen süre, uyanılan güne) ve günlük nabız. Elle girilen uyku kaydı saatinkini ezmez; silinen günler (hcFrom öncesi) geri yazılmaz. */
function hcApplyDaily(q,days){
  const from=S.settings.hcFrom||"",sl=(q&&q.sleep)||{},ha=(q&&q.hrAvg)||{},hm=(q&&q.hrMin)||{};
  let sleep=Habits.sleep().slice(),hr=Pulse.hr().slice(),ch=false;
  for(const d of days){
    if(from&&d<from)continue;
    const m=sl[d];
    if(typeof m==="number"&&m>=60&&m<=1080){
      const old=sleep.find(x=>x.day===d),min=Math.round(m);
      if(!old||(old.src==="hc"&&old.min!==min)){sleep=sleep.filter(x=>x.day!==d).concat({...old,day:d,min,src:"hc"});ch=true}
    }
    const a=ha[d];
    if(typeof a==="number"){
      const o=hr.find(x=>x.day===d),ra=Math.round(a),rm=typeof hm[d]==="number"?Math.round(hm[d]):undefined;
      if(!o||o.a!==ra||o.m!==rm){hr=hr.filter(x=>x.day!==d).concat({day:d,a:ra,m:rm});ch=true}
    }
  }
  if(ch){Habits.setSleep(sleep);Pulse.setHr(hr)}
  return ch;
}
/* Adım raporunun alt kartı: açma anahtarı, izin durumu ve bugünkü saat değeri. */
function hcCard(){
  if(!HP()||!isNative())return "";
  if(!hcInfo&&!hcAsked){hcAsked=true;hcStatus().then(()=>{if(tab==="steps")render()})}
  const st=S.settings,i=hcInfo;
  if(i&&!i.available)return `<div class="card"><div class="lbl">Saatten veri</div><p class="hint">Bu özellik Android 14 ve üstünde, Health Connect ile çalışır.</p></div>`;
  const need=st.hcOn&&i&&(!i.granted||!i.sleep||!i.hr),miss=i&&[!i.granted&&"adım",!i.sleep&&"sleep",!i.hr&&"nabız"].filter(Boolean).join(", ");
  const body=need?`<p class="hint">Health Connect izni verilmedi: ${miss}.</p><button class="btn" data-hc="perm">İzin ver</button><button class="lnk" data-hc="manage">Health Connect ayarlarını aç</button>`
    :st.hcOn&&i?`<p class="hint">${hcNow()==null?"Health Connect'te bugün için adım yok. Saatin Samsung Health ile eşleşip eşleşmediğine ve Samsung Health > Ayarlar > Health Connect'te adımın açık olduğuna bak.":`Health Connect bugün: ${Math.round(hcNow()||0).toLocaleString("tr-TR")} adım.`}</p>`:"";
  return `<div class="card"><div class="lbl">Saatten veri</div>${swRow('data-hc="toggle"',st.hcOn,"Saat verilerini al (Health Connect)","Adım, uyku ve nabız Samsung Health üzerinden okunur. Adımda telefon ve saatin büyük olanı alınır, toplanmaz. Uyku süresi yatakta geçen süredir. NeoWell Health Connect'e yazmaz.")}${body}</div>`;
}
async function hcToggle(el){
  const p=HP();
  if(!el.checked){S.settings.hcOn=false;hcToday=null;save();render();return}
  if(!p){el.checked=false;return toast("Yalnız telefondaki uygulamada çalışır")}
  const i=await hcStatus();
  if(!i||!i.available){el.checked=false;return toast("Bu telefonda Health Connect yok (Android 14 ve üstü gerekir)")}
  S.settings.hcOn=true;save();
  if(!i.granted||!i.sleep||!i.hr)await hcAsk();
  hcAt=0;await hcSync(true);render();
}
async function hcAsk(){
  const p=HP();if(!p)return;
  try{await p.request()}catch(e){}
  const i=await hcStatus();
  if(i&&!(i.granted&&i.sleep&&i.hr))toast("Bazı izinler verilmedi. Health Connect ayarlarından NeoWell'e adım, uyku ve nabız izinlerini aç");
}
document.addEventListener("change",ev=>{const el=ev.target.closest&&ev.target.closest("[data-hc=toggle]");if(el)hcToggle(el)});
document.addEventListener("click",async ev=>{
  const b=ev.target.closest&&ev.target.closest("[data-hc=perm],[data-hc=manage]");if(!b)return;
  if(b.dataset.hc==="manage"){const p=HP();if(p)p.manage().catch(()=>toast("Ayar ekranı açılamadı"));return}
  await hcAsk();hcAt=0;await hcSync(true);render();
});
