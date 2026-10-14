"use strict";
/* App lock: the phone's screen lock (fingerprint, face, PIN, pattern, password) is verified through the Android prompt; the app stores no password or biometric data.
   The lock screen shows at start and after returning from more than the chosen lockGrace seconds in the background; the content shows only after verification. */
const AL=()=>plugin("AppLock");
let lockHiddenAt=0,lockBusy=false;
/* Before the first paint: with the lock on, the content starts hidden. save() keeps the nw_lockon flag in sync, so the state is not parsed here. */
try{if(localStorage.getItem("nw_lockon")==="1")document.documentElement.classList.add("locked")}catch(e){}
const lockUp=()=>document.documentElement.classList.contains("locked");
/* Recent-apps preview and screenshots (FLAG_SECURE) are their own setting, independent of the lock. */
const recentsSync=()=>{const a=AL();if(a)a.setSecure({on:S.settings.hideRecents===true}).catch(()=>{})};

function lockEl(){
  let d=document.getElementById("lock");
  if(!d){
    d=document.createElement("div");d.id="lock";d.setAttribute("role","alertdialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-labelledby","lkt");d.hidden=true;
    d.innerHTML=`<img src="logo.png" alt="" width="72" height="72"><h2 id="lkt" tabindex="-1">NeoWell kilitli</h2><p id="lkm" class="mut" role="status">Kilidi açmak için telefonun ekran kilidini kullan.</p><button class="btn" data-lk="ask">Kilidi aç</button>`;
    document.body.append(d);
  }
  return d;
}
function lockShow(){
  lockEl().hidden=false;document.documentElement.classList.add("locked");
  lockAsk();
}
function lockOpen(){
  lockEl().hidden=true;document.documentElement.classList.remove("locked");
}
const lockMsg=t=>{lockEl().querySelector("#lkm").textContent=t};
async function lockAsk(){
  const a=AL();if(!a||lockBusy)return;
  lockBusy=true;
  let r;try{r=await a.authenticate({title:"NeoWell kilidi"})}catch(e){r={ok:false}}
  lockBusy=false;
  if(r&&r.ok)return lockOpen();
  if(r&&r.none){ // the phone has no screen lock left: the user must not be locked out of their own data
    S.settings.lockOn=false;save();lockOpen();toast("Telefonda ekran kilidi kalmadı, uygulama kilidi kapatıldı");return}
  lockMsg(r&&r.cancelled?"Kilidi açmak için doğrula.":"Doğrulanamadı, tekrar dene.");
}
/* Turning it on asks for verification (so it is seen working; it does not turn on without a phone screen lock). Returns the error text, or "" when it is on. */
async function lockEnable(){
  const a=AL();
  if(!a)return "Uygulama kilidi yalnız telefondaki uygulamada çalışır";
  let st;try{st=await a.status()}catch(e){return "Kilit durumu okunamadı"}
  if(!st.secure)return "Önce telefonda bir ekran kilidi (PIN, desen ya da parmak izi) ayarla";
  lockBusy=true;let r;try{r=await a.authenticate({title:"Uygulama kilidini aç"})}catch(e){r={ok:false}}lockBusy=false;
  if(!r||!r.ok)return "Doğrulanamadı, kilit açılmadı";
  S.settings.lockOn=true;save();
  return "";
}
async function lockToggle(el){
  if(!el.checked){S.settings.lockOn=false;save();render();toast("Uygulama kilidi kapatıldı");return}
  const e=await lockEnable();
  if(e){el.checked=false;return toast(e)}
  render();toast("Uygulama kilidi açıldı");
}
document.addEventListener("change",ev=>{
  const t=ev.target.closest?.("[data-lk=toggle]");if(t)return lockToggle(t);
  const h=ev.target.closest?.("[data-lk=recents]");
  if(h){S.settings.hideRecents=h.checked;save();recentsSync()}
});
document.addEventListener("click",ev=>{
  if(ev.target.closest("[data-lk=ask]"))lockAsk();
  const g=ev.target.closest("[data-lg]");if(g){S.settings.lockGrace=+g.dataset.lg;save();render()}
});
document.addEventListener("visibilitychange",()=>{
  if(lockBusy||!AL())return;
  if(document.hidden)lockHiddenAt=Date.now();
  else if(S.settings.lockOn&&lockHiddenAt&&Date.now()-lockHiddenAt>=S.settings.lockGrace*1000)lockShow();
});
document.addEventListener("nw:boot",()=>{recentsSync();if(S.settings.lockOn&&AL())lockShow();else document.documentElement.classList.remove("locked")});
