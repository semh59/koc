"use strict";
/* Sending the backup through the share sheet (Google Drive included): no account to link, the data is encrypted with a password.
   The password can optionally be stored, encrypted with this phone's Keystore vault only. */
const BKPW_LS="nw_bkpw_enc";
const BF=()=>plugin("BackupFolder");
/* The one backup payload: settings and data plus the API keys (unless the user keeps them out), encrypted with the password into a JSON string. */
const backupJson=async pw=>JSON.stringify(await BackupLib.encrypt({S,keys:S.settings.bkNoKeys?{}:Coach.keys(),at:dayKey(),app:appVer},pw));
const BK_PHOTOS="Fotoğraflar yedeğe girmez; yeni telefona ayrıca taşı.";
const BK_SENT="Yedek paylaşıldı. Ulaştığını denetle: dosyayı yeni telefonda Geri yükle > Yalnız denetle ile sına";
const BK_MAX=2e7;
/* The share sheet closing is not proof of arrival, so the date says "shared" and asks for a check. */
const bkLast=()=>{const lb=S.settings.lastBackup;return lb?`Son yedek: ${fd(lb)} (paylaşıldı, ulaştığını denetle)`:"Hiç yedek alınmadı"};
const bkTooBig=f=>f.size>BK_MAX&&(toast("Dosya 20 MB'tan büyük, bir NeoWell yedeği olmayabilir"),true);
async function bkRemembered(){
  const kv=KV(),e=lsGet(BKPW_LS);
  if(!kv||!e)return null;
  try{return (await kv.decrypt({data:e})).text||null}catch{return null}
}
async function bkRemember(pw){
  const kv=KV();if(!kv||!Coach.vaultOn())return false;
  try{lsSet(BKPW_LS,(await kv.encrypt({text:pw})).data);return true}catch{return false}
}
/* A new password from two fields: the password and, when it is unusable, the warning to show. */
function bkNewPw(first,again){
  const pw=$("#"+first).value;
  return {pw,bad:BackupLib.pwCheck(pw)||(pw!==$("#"+again).value?"Parolalar aynı değil":"")};
}
async function sheetDrive(){
  const rem=await bkRemembered(),native=!!KV()&&Coach.vaultOn();
  openSheet(`<h3>Yedeği Drive'a gönder</h3>
  <p class="m0 mb-3 mut sm">Verilerin parolayla şifrelenir. Paylaşım ekranında Google Drive'ı (ya da istediğin yeri) seç. Hesap bağlamak gerekmez. ${bkLast()}. ${BK_PHOTOS}</p>
  <p class="hint">${S.settings.bkNoKeys?"Rehber anahtarların yedeğe girmez.":"Rehber anahtarların da yedeğe girer; istemezsen Ayarlar > Veri ve yedek'ten kapat."}${rem?"":" Eski yedeklerinle aynı parolayı kullan; parola değişirse eski dosyalar eski parolayla açılır."}</p>
  ${rem?`<p>Parola bu telefonda saklı.</p><button class="btn" data-bk="send">Şimdi gönder</button><button class="mt-2 btn ghost" data-bk="forget">Parolayı unut</button>`
  :`<input class="in" id="bkp1" type="password" placeholder="Parola (en az ${BackupLib.MINPW} karakter)" autocomplete="new-password"><input class="in" id="bkp2" type="password" placeholder="Parolayı tekrar yaz" autocomplete="new-password">
  ${native?swRow('id="bkrem"',true,"Parolayı bu telefonda sakla (Keystore ile şifreli)"):""}
  <div class="hint" id="bkw" role="alert"></div><button class="btn" data-bk="send">Şifrele ve gönder</button>`}
  <p class="hint">Parolayı unutursan yedeğini kimse açamaz, kurtarma yolu yoktur. Parolayı güvenli bir yere yaz. Geri yüklemek için: Ayarlar > Veri ve yedek > Yedekten geri yükle (dosyayı Drive'dan seçebilirsin).</p>
  <button class="mt-2 btn ghost" data-bk="close">Vazgeç</button>`);
}
async function bkSend(){
  let pw=await bkRemembered(),fresh=false;
  if(pw==null){
    const n=bkNewPw("bkp1","bkp2");if(n.bad)return ferr("bkw",n.bad);
    pw=n.pw;fresh=true;
  }
  let text;
  try{text=await backupJson(pw)}catch(e){return toast("Yedek hazırlanamadı")}
  const remember=fresh&&$("#bkrem")?.checked;
  if(!await shareFile(BackupLib.manualName(dayKey()),"NeoWell yedeği","application/json",text,true))return;
  if(remember)await bkRemember(pw);
  markBackup();closeSheet();render();scheduleReminders().then(setNotif);
  toast(BK_SENT);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-bk]");if(!el)return;
  const a=el.dataset.bk;
  if(a==="send")bkSend();
  else if(a==="forget")confirmSheet({title:"Parola unutulsun mu?",body:`Parola bu telefondan silinir${S.settings.autoBk?" ve otomatik yedek kapanır":""}. Yedeklerinin parolası değişmez; parolayı yazdığından emin ol, yoksa yedekler açılamaz.`,ok:"Unut",danger:true}).then(ok=>{
    if(!ok)return;
    lsDel(BKPW_LS);if(S.settings.autoBk){abOff();toast("Parola unutuldu, otomatik yedek de kapatıldı")}sheetDrive();
  });
  else if(a==="close")closeSheet();
  else if(a==="nokeys"){S.settings.bkNoKeys=el.checked;save()}
});

/* Automatic backup: when the app opens or the tab returns and the last automatic backup is older than 7 days, the same encrypted format is written to the chosen folder.
   There is no background job: the data lives in the WebView and the native side cannot read it. The password is stored Keystore-encrypted, as for the Drive backup;
   a key that lived only in the Keystore would make the backup unreadable after losing the phone, while the password also opens it on a new phone. */
let abErr="",abName="",abBusy=false;
function abHtml(){
  if(!BF())return "";
  const st=S.settings;
  return `<div class="card">${swRow('data-ab="toggle"',st.autoBk,"<b>Otomatik yedek</b>")}
  <p class="hint">${st.autoBk?`Klasör: ${esc(abName||"seçili")}. ${st.lastAutoBk?`Son otomatik yedek: ${fd(st.lastAutoBk)}.`:"İlk yedek birazdan yazılır."} `:"Seçtiğin klasöre haftada bir şifreli yedek yazar, en son 4 otomatik yedeği tutar. "}Arka planda çalışmaz: uygulamayı en az haftada bir açtığında yedek alınır.</p>
  ${abErr?`<p class="status" role="alert"><b>Otomatik yedek alınamadı.</b> ${esc(abErr)}</p><div class="btns"><button class="btn ghost" data-ab="setup">Klasörü yeniden seç</button><button class="btn ghost" data-ab="off">Otomatik yedeği kapat</button></div>`:""}</div>`;
}
async function abSetup(){
  if(!KV()||!Coach.vaultOn())return toast("Bu telefonda parola güvenle saklanamıyor, otomatik yedek kullanılamaz");
  const rem=await bkRemembered();
  openSheet(`<h3>Otomatik yedek</h3>
  <p class="m0 mb-3 mut sm">Uygulamayı açtığında son yedek 7 günden eskiyse seçeceğin klasöre şifreli yedek (neowell-oto-…) yazılır, en son 4 otomatik yedek kalır; elle aldığın yedeklere dokunulmaz. Uygulamayı en az haftada bir aç.</p>
  ${rem?`<p>Yedek parolası bu telefonda saklı, o kullanılır.</p>`:`<input class="in" id="abp1" type="password" placeholder="Yedek parolası (en az ${BackupLib.MINPW} karakter)" autocomplete="new-password"><input class="in" id="abp2" type="password" placeholder="Parolayı tekrar yaz" autocomplete="new-password">`}
  <p class="hint">Telefon değişirse dosyaları yeni telefona taşı ve Yedekten geri yükle ile bu parolayla aç. ${BK_PHOTOS} Parolayı unutursan yedeğini kimse açamaz, kurtarma yolu yoktur. Parolayı güvenli bir yere yaz.</p>
  <div class="hint" id="abw" role="alert"></div><button class="btn" data-ab="pick">Klasör seç ve aç</button><button class="mt-2 btn ghost" data-bk="close">Vazgeç</button>`);
}
async function abPick(){
  let pw=null;
  if($("#abp1")){
    const n=bkNewPw("abp1","abp2");if(n.bad)return ferr("abw",n.bad);
    pw=n.pw;
  }
  let r;
  try{r=await BF().pick()}catch(e){return ferr("abw",/cancel/i.test(e?.message||"")?"Klasör seçilmedi":"Klasör izni alınamadı")}
  if(pw!=null&&!await bkRemember(pw))return ferr("abw","Parola bu telefonda saklanamadı");
  Object.assign(S.settings,{autoBk:true,lastAutoBk:""});abName=r.name||"";abErr="";save();closeSheet();render();
  toast("Otomatik yedek açık");abRun();
}
async function abOff(){
  S.settings.autoBk=false;abErr="";save();
  try{await BF().clear()}catch(e){}
}
async function abBoot(){
  if(!S.settings.autoBk||!BF())return;
  try{abName=(await BF().status()).name||""}catch(e){}
  abRun();
}
async function abRun(){
  const st=S.settings,bf=BF();
  if(!st.autoBk||!bf||abBusy||abErr||!BackupLib.autoDue(st.lastAutoBk,dayKey()))return;
  abBusy=true;
  try{
    await keysP;
    const pw=await bkRemembered();
    if(!pw)throw new Error("no-password");
    const name=BackupLib.autoName(dayKey()),r=await bf.write({name,data:await backupJson(pw)});
    const old=BackupLib.autoPrune(r.names||[],name);
    if(old.length)await bf.remove({names:old}).catch(()=>{});
    st.lastAutoBk=dayKey();markBackup(true);
  }catch(e){
    abErr=e.message==="no-password"?"Yedek parolası bu telefonda bulunamadı.":"Klasöre yazılamadı. Klasör silinmiş ya da izni kaldırılmış olabilir.";
    toast("Otomatik yedek alınamadı. Ayarlar > Veri ve yedek'ten yeniden kurabilir ya da kapatabilirsin");
  }
  abBusy=false;render();
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ab]");if(!el)return;
  const a=el.dataset.ab;
  if(a==="toggle"){if(el.checked){el.checked=false;abSetup()}else{abOff().then(render);toast("Otomatik yedek kapatıldı. Klasördeki dosyalar duruyor")}}
  else if(a==="setup")abSetup();
  else if(a==="off"){abOff().then(render);toast("Otomatik yedek kapatıldı")}
  else if(a==="pick")abPick();
});
