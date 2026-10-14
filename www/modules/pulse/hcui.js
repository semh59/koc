"use strict";
/* Health Connect: the watch's steps (through Samsung Health) are read. Read only; not added to the phone counter, the larger value of the day wins (setSteps/setHc). */
let hcToday=null,hcDay="",hcAt=0,hcBusy=false,hcInfo=null,hcAsked=false;
const HC_EVERY=60000,HC_RETRY=5000,HC_DAYS=8;
const HP=()=>plugin("Health");
/* After midnight yesterday's value must not count as today's (even when the read fails). */
const hcNow=()=>hcDay===calKey()?hcToday:null;

async function hcStatus(){
  const p=HP();if(!p)return null;
  try{hcInfo=await p.status()}catch(e){hcInfo={available:false,granted:false}}
  return hcInfo;
}
async function hcSync(force){
  const p=HP();if(!S.settings.hcOn||!p||hcBusy||(!force&&Date.now()-hcAt<HC_EVERY))return;
  hcBusy=true;
  try{
    const was=hcInfo?.granted,st=await hcStatus();
    if(!st?.available||!st.granted){
      hcAt=Date.now()-HC_EVERY+HC_RETRY; // until permission is given, look every HC_RETRY ms instead of every second
      if(hcToday!=null){hcToday=null;if(tab==="steps")render()}
      else if(was!==false&&hcInfo&&tab==="steps")render(); // the card switches to "grant permission"
      return;
    }
    const days=Array.from({length:HC_DAYS},(_,i)=>calOff(-i)),today=days[0];
    const m=(await p.steps({days}))?.days??{};
    hcAt=Date.now();hcDay=today;let ch=was===false;
    for(const d of days)if(typeof m[d]==="number"&&setHc(d,m[d]))ch=true;
    const t=typeof m[today]==="number"?m[today]:null;
    if(hcToday!==t){hcToday=t;ch=true}
    if(st.sleep||st.hr){try{if(hcApplyDaily(await p.daily({days}),days))ch=true}catch(e){}}
    if(ch){save();if((tab==="today"||tab==="steps")&&!$("#sheet").classList.contains("on")&&!viewBusy())render();else widgetPush()}
  }catch(e){}finally{hcBusy=false}
}
/* Sleep (time in bed, on the wake-up day) and daily pulse. A manually entered sleep record is not overwritten by the watch; days deleted by the user (before hcFrom) are not written back. */
function hcApplyDaily(q,days){
  const from=S.settings.hcFrom||"",sl=q?.sleep??{},ha=q?.hrAvg??{},hm=q?.hrMin??{};
  const sleep=new Map(Habits.sleep().map(x=>[x.day,x])),hr=new Map(Pulse.hr().map(x=>[x.day,x]));
  let ch=false;
  for(const d of days){
    if(from&&d<from)continue;
    const m=sl[d],old=sleep.get(d),min=Math.round(m);
    if(typeof m==="number"&&m>=HabitLib.SLEEP_LIM[0]&&m<=HabitLib.SLEEP_LIM[1]&&(!old||(old.src==="hc"&&old.min!==min))){sleep.set(d,{...old,day:d,min,src:"hc"});ch=true}
    const a=ha[d],o=hr.get(d),ra=Math.round(a),rm=typeof hm[d]==="number"?Math.round(hm[d]):undefined;
    if(typeof a==="number"&&(!o||o.a!==ra||o.m!==rm)){hr.set(d,{day:d,a:ra,m:rm});ch=true}
  }
  if(ch){Habits.setSleep([...sleep.values()]);Pulse.setHr([...hr.values()])}
  return ch;
}
/* The card under the steps report: the on switch, permission state and today's watch value. */
function hcCard(){
  if(!HP()||!isNative())return "";
  if(!hcInfo&&!hcAsked){hcAsked=true;hcStatus().then(()=>{if(tab==="steps")render()})}
  const st=S.settings,i=hcInfo;
  if(i&&!i.available)return `<div class="card"><div class="lbl">Saatten veri</div><p class="hint">Bu özellik Android 14 ve üstünde, Health Connect ile çalışır.</p></div>`;
  const need=st.hcOn&&i&&(!i.granted||!i.sleep||!i.hr),miss=i&&[!i.granted&&"adım",!i.sleep&&"uyku",!i.hr&&"nabız"].filter(Boolean).join(", ");
  const body=need?`<p class="hint">Health Connect izni verilmedi: ${miss}.</p><button class="btn" data-hc="perm">İzin ver</button><button class="lnk" data-hc="manage">Health Connect ayarlarını aç</button>`
    :st.hcOn&&i?`<p class="hint">${hcNow()==null?"Health Connect'te bugün için adım yok. Saatin Samsung Health ile eşleşip eşleşmediğine ve Samsung Health > Ayarlar > Health Connect'te adımın açık olduğuna bak.":`Health Connect bugün: ${fint(hcNow())} adım.`}</p>`:"";
  return `<div class="card"><div class="lbl">Saatten veri</div>${swRow('data-hc="toggle"',st.hcOn,"Saat verilerini al (Health Connect)","Adım, uyku ve nabız Samsung Health üzerinden okunur. Adımda telefon ve saatin büyük olanı alınır, toplanmaz. Uyku süresi yatakta geçen süredir. NeoWell Health Connect'e yazmaz.")}${body}</div>`;
}
async function hcToggle(el){
  if(!el.checked){S.settings.hcOn=false;hcToday=null;save();render();return}
  if(!HP()){el.checked=false;return toast("Yalnız telefondaki uygulamada çalışır")}
  const i=await hcStatus();
  if(!i?.available){el.checked=false;return toast("Bu telefonda Health Connect yok (Android 14 ve üstü gerekir)")}
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
document.addEventListener("change",ev=>{const el=ev.target.closest?.("[data-hc=toggle]");if(el)hcToggle(el)});
document.addEventListener("click",async ev=>{
  const b=ev.target.closest?.("[data-hc=perm],[data-hc=manage]");if(!b)return;
  if(b.dataset.hc==="manage"){HP()?.manage().catch(()=>toast("Ayar ekranı açılamadı"));return}
  await hcAsk();hcAt=0;await hcSync(true);render();
});
