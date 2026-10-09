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
      if(hcToday!=null){hcToday=null;if(tab==="adim")render()}
      else if(was!==false&&hcInfo&&tab==="adim")render(); // kart "izin ver" durumuna geçsin
      return;
    }
    const days=[];for(let i=0;i<8;i++)days.push(keyOff(-i));
    const r=await p.steps({days}),m=(r&&r.days)||{};
    hcAt=Date.now();hcDay=dayKey();let ch=was===false;
    for(const d of days)if(typeof m[d]==="number"&&dayOk(d)&&setHc(d,m[d]))ch=true;
    const t=typeof m[dayKey()]==="number"?m[dayKey()]:null;
    if(hcToday!==t){hcToday=t;ch=true}
    if(ch){save();if((tab==="bugun"||tab==="adim")&&!$("#sheet").classList.contains("on")&&!viewBusy())render();else widgetPush()}
  }catch(e){}finally{hcBusy=false}
}
/* Adım raporunun alt kartı: açma anahtarı, izin durumu ve bugünkü saat değeri. */
function hcCard(){
  if(!HP()||!isNative())return "";
  if(!hcInfo&&!hcAsked){hcAsked=true;hcStatus().then(()=>{if(tab==="adim")render()})}
  const st=S.settings,i=hcInfo;
  if(i&&!i.available)return `<div class="card"><div class="lbl">Saatten adım</div><p class="hint">Bu özellik Android 14 ve üstünde, Health Connect ile çalışır.</p></div>`;
  const need=st.hcOn&&i&&!i.granted;
  const body=need?`<p class="hint">Health Connect adım izni verilmedi.</p><button class="btn" data-hc="perm">İzin ver</button><button class="lnk" data-hc="manage">Health Connect ayarlarını aç</button>`
    :st.hcOn&&i?`<p class="hint">${hcNow()==null?"Health Connect'te bugün için adım yok. Saatin Samsung Health ile eşleşip eşleşmediğine ve Samsung Health > Ayarlar > Health Connect'te adımın açık olduğuna bak.":`Health Connect bugün: ${Math.round(hcNow()||0).toLocaleString("tr-TR")} adım.`}</p>`:"";
  return `<div class="card"><div class="lbl">Saatten adım</div>${swRow('data-hc="toggle"',st.hcOn,"Saat adımlarını al (Health Connect)","Samsung Health üzerinden saatin adımları okunur. Telefon ve saatin büyük olanı alınır, toplanmaz. NeoWell Health Connect'e yazmaz.")}${body}</div>`;
}
async function hcToggle(el){
  const p=HP();
  if(!el.checked){S.settings.hcOn=false;hcToday=null;save();render();return}
  if(!p){el.checked=false;return toast("Yalnız telefondaki uygulamada çalışır")}
  const i=await hcStatus();
  if(!i||!i.available){el.checked=false;return toast("Bu telefonda Health Connect yok (Android 14 ve üstü gerekir)")}
  S.settings.hcOn=true;save();
  if(!i.granted)await hcAsk();
  hcAt=0;await hcSync(true);render();
}
async function hcAsk(){
  const p=HP();if(!p)return;
  try{await p.request()}catch(e){}
  const i=await hcStatus();
  if(i&&!i.granted)toast("İzin verilmedi. Health Connect ayarlarından NeoWell'e adım iznini aç");
}
document.addEventListener("change",ev=>{const el=ev.target.closest&&ev.target.closest("[data-hc=toggle]");if(el)hcToggle(el)});
document.addEventListener("click",async ev=>{
  const b=ev.target.closest&&ev.target.closest("[data-hc=perm],[data-hc=manage]");if(!b)return;
  if(b.dataset.hc==="manage"){const p=HP();if(p)p.manage().catch(()=>toast("Ayar ekranı açılamadı"));return}
  await hcAsk();hcAt=0;await hcSync(true);render();
});
