"use strict";
/* Uygulama kilidi: telefonun ekran kilidi (parmak izi, yüz, PIN, desen, parola) Android penceresiyle doğrulanır; uygulama parola ya da biyometrik veri saklamaz.
   Açılışta ve 30 sn'den uzun arka plandan dönüşte kilit ekranı görünür; içerik ancak doğrulamadan sonra gösterilir. S, save, toast, render index.html'dedir. */
const LOCK_GRACE=30000;
const AL=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.AppLock;
let lockHiddenAt=0,lockBusy=false;
/* İlk boyamadan önce: kilit açıksa içerik gizli başlar (ayar sayfa durumu yüklenmeden ham kayıttan okunur). */
try{const f=localStorage.getItem("nw_lockon");if(f==="1"||(f==null&&JSON.parse(localStorage.getItem("koc_v1")).settings.lockOn===true))document.documentElement.classList.add("locked")}catch(e){} // nw_lockon save() ile güncellenir; yoksa (eski sürümden) ham kayıttan
const lockUp=()=>document.documentElement.classList.contains("locked");
const lockSecure=on=>{const a=AL();if(a)a.setSecure({on}).catch(()=>{})};

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
  lockEl().hidden=false;document.documentElement.classList.add("locked");lockSecure(true);
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
  if(r&&r.none){ // telefonda ekran kilidi kalmadı: kullanıcı kendi verisinden kilitlenmesin
    S.settings.lockOn=false;save();lockSecure(false);lockOpen();toast("Telefonda ekran kilidi kalmadı, uygulama kilidi kapatıldı");return}
  lockMsg(r&&r.cancelled?"Kilidi açmak için doğrula.":"Doğrulanamadı, tekrar dene.");
}
/* Ayar: açarken doğrulama istenir (çalıştığı görülür, telefonda ekran kilidi yoksa açılmaz). */
async function lockToggle(el){
  const a=AL();
  if(!el.checked){S.settings.lockOn=false;save();lockSecure(false);render();toast("Uygulama kilidi kapatıldı");return}
  const fail=t=>{el.checked=false;toast(t)};
  if(!a)return fail("Uygulama kilidi yalnız telefondaki uygulamada çalışır");
  let st;try{st=await a.status()}catch(e){return fail("Kilit durumu okunamadı")}
  if(!st.secure)return fail("Önce telefonda bir ekran kilidi (PIN, desen ya da parmak izi) ayarla");
  lockBusy=true;let r;try{r=await a.authenticate({title:"Uygulama kilidini aç"})}catch(e){r={ok:false}}lockBusy=false;
  if(!r||!r.ok)return fail("Doğrulanamadı, kilit açılmadı");
  S.settings.lockOn=true;save();lockSecure(true);render();toast("Uygulama kilidi açıldı");
}
document.addEventListener("change",ev=>{const el=ev.target.closest&&ev.target.closest("[data-lk=toggle]");if(el)lockToggle(el)});
document.addEventListener("click",ev=>{if(ev.target.closest("[data-lk=ask]"))lockAsk()});
document.addEventListener("visibilitychange",()=>{
  if(lockBusy||!AL())return;
  if(document.hidden){lockHiddenAt=Date.now();if(S.settings.lockOn)lockSecure(true)}
  else if(S.settings.lockOn&&lockHiddenAt&&Date.now()-lockHiddenAt>=LOCK_GRACE)lockShow();
});
document.addEventListener("nw:boot",()=>{if(S.settings.lockOn&&AL())lockShow();else document.documentElement.classList.remove("locked")});
