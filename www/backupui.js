"use strict";
/* Yedeği paylaşım ekranıyla (Google Drive dahil) gönderme: hesap bağlamak gerekmez, veriler parolayla şifrelenir.
   Parola isteğe bağlı olarak yalnızca bu telefonun Keystore kasasıyla şifreli saklanır. */
const BKPW_LS="koc_bkpw_enc";
async function bkRemembered(){
  const kv=KV(),e=lsGet(BKPW_LS);
  if(!kv||!e)return null;
  try{return (await kv.decrypt({data:e})).text||null}catch(x){return null}
}
async function bkRemember(pw){
  const kv=KV();if(!kv||!vaultOn)return false;
  try{lsSet(BKPW_LS,(await kv.encrypt({text:pw})).data);return true}catch(x){return false}
}
async function sheetDrive(){
  const rem=await bkRemembered(),native=!!KV()&&vaultOn,lb=S.settings.lastBackup;
  openSheet(`<h3>Yedeği Drive'a gönder</h3>
  <p class="mut sm" style="margin:0 0 10px">Verilerin parolayla şifrelenir. Paylaşım ekranında Google Drive'ı (ya da istediğin yeri) seç. Hesap bağlamak gerekmez.${lb?` Son yedek: ${fd(lb)}.`:""}</p>
  ${rem?`<p>Parola bu telefonda saklı.</p><button class="btn" data-bk="send">Şimdi gönder</button><button class="btn ghost" data-bk="forget" style="margin-top:8px">Parolayı unut</button>`
  :`<input class="in" id="bkp1" type="password" placeholder="Parola (en az ${BackupLib.MINPW} karakter)" autocomplete="new-password"><input class="in" id="bkp2" type="password" placeholder="Parolayı tekrar yaz" autocomplete="new-password">
  ${native?swRow('id="bkrem"',true,"Parolayı bu telefonda sakla (Keystore ile şifreli)"):""}
  <div class="hint" id="bkw" role="alert"></div><button class="btn" data-bk="send">Şifrele ve gönder</button>`}
  <p class="hint">Parolayı unutursan yedeğini kimse açamaz, kurtarma yolu yoktur. Parolayı güvenli bir yere yaz. Geri yüklemek için: Ayarlar > Veri ve yedek > Yedekle veya geri yükle > Dosyadan oku (dosyayı Drive'dan seçebilirsin).</p>
  <button class="btn ghost" data-bk="close" style="margin-top:8px">Vazgeç</button>`);
}
async function bkSend(){
  const warn=m=>{const e=document.getElementById("bkw");if(e)e.textContent=m};
  let pw=await bkRemembered(),fresh=false;
  if(pw==null){
    pw=document.getElementById("bkp1").value;
    const bad=BackupLib.pwCheck(pw);if(bad)return warn(bad);
    if(pw!==document.getElementById("bkp2").value)return warn("Parolalar aynı değil");
    fresh=true;
  }
  let text;
  try{text=JSON.stringify(await BackupLib.encrypt({v:1,S,keys:getKeys()},pw))}catch(e){return toast("Yedek hazırlanamadı")}
  const rem=fresh&&document.getElementById("bkrem")&&document.getElementById("bkrem").checked;
  const P=window.Capacitor&&window.Capacitor.Plugins,fs=P&&P.Filesystem,sh=P&&P.Share,name=`neowell-yedek-${dayKey()}.json`;
  if(fs&&sh){
    try{
      const f=await fs.writeFile({path:name,data:text,directory:"CACHE",encoding:"utf8"});
      await sh.share({title:"NeoWell yedeği",files:[f.uri]});
    }catch(e){if(!/cancel/i.test(e&&e.message||""))toast("Paylaşılamadı");return}
  }else{
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"application/json"}));a.download=name;document.body.appendChild(a);a.click();a.remove();
  }
  if(rem)await bkRemember(pw);
  markBackup();closeSheet();render();scheduleReminders().then(setNotif);
  toast("Yedek paylaşıldı. Drive'da dosyanın göründüğünü kontrol et");
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-bk]");if(!el)return;
  const a=el.dataset.bk;
  if(a==="send")bkSend();
  else if(a==="forget"){lsDel(BKPW_LS);if(S.settings.autoBk){abOff();toast("Parola unutuldu, otomatik yedek de kapatıldı")}sheetDrive()}
  else if(a==="close")closeSheet();
});

/* Otomatik yedek: uygulama açılınca ve sekmeye dönünce, son otomatik yedek 7 günden eskiyse seçilen klasöre aynı şifreli biçimde yazar.
   Arka plan işi yok: veri WebView'da, yerel taraf okuyamaz. Parola, Drive yedeğindeki gibi Keystore ile şifreli saklanır;
   anahtar yalnız Keystore'da olsaydı telefon kaybolunca yedek açılamazdı, parola yeni telefonda da açar. */
const BF=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.BackupFolder;
let abErr="",abName="",abBusy=false;
function abHtml(){
  if(!BF())return "";
  const st=S.settings;
  return `<div class="card">${swRow('data-ab="toggle"',st.autoBk,"<b>Otomatik yedek</b>")}
  <p class="hint">${st.autoBk?`Klasör: ${esc(abName||"seçili")}. ${st.lastAutoBk?`Son otomatik yedek: ${fd(st.lastAutoBk)}.`:"İlk yedek birazdan yazılır."} `:"Seçtiğin klasöre haftada bir şifreli yedek yazar, en son 4 otomatik yedeği tutar. "}Arka planda çalışmaz: uygulamayı en az haftada bir açtığında yedek alınır.</p>
  ${abErr?`<p class="status" role="alert"><b>Otomatik yedek alınamadı.</b> ${esc(abErr)}</p><div class="btns"><button class="btn ghost" data-ab="setup">Klasörü yeniden seç</button><button class="btn ghost" data-ab="off">Otomatik yedeği kapat</button></div>`:""}</div>`;
}
async function abSetup(){
  if(!KV()||!vaultOn)return toast("Bu telefonda parola güvenle saklanamıyor, otomatik yedek kullanılamaz");
  const rem=await bkRemembered();
  openSheet(`<h3>Otomatik yedek</h3>
  <p class="mut sm" style="margin:0 0 10px">Uygulamayı açtığında son yedek 7 günden eskiyse seçeceğin klasöre şifreli yedek (neowell-oto-…) yazılır, en son 4 otomatik yedek kalır; elle aldığın yedeklere dokunulmaz. Uygulamayı en az haftada bir aç.</p>
  ${rem?`<p>Yedek parolası bu telefonda saklı, o kullanılır.</p>`:`<input class="in" id="abp1" type="password" placeholder="Yedek parolası (en az ${BackupLib.MINPW} karakter)" autocomplete="new-password"><input class="in" id="abp2" type="password" placeholder="Parolayı tekrar yaz" autocomplete="new-password">`}
  <p class="hint">Telefon değişirse dosyaları yeni telefona taşı ve Yedekle veya geri yükle > Dosyadan oku ile bu parolayla aç. Parolayı unutursan yedeğini kimse açamaz, kurtarma yolu yoktur. Parolayı güvenli bir yere yaz.</p>
  <div class="hint" id="abw" role="alert"></div><button class="btn" data-ab="pick">Klasör seç ve aç</button><button class="btn ghost" data-bk="close" style="margin-top:8px">Vazgeç</button>`);
}
async function abPick(){
  const warn=m=>{const e=document.getElementById("abw");if(e)e.textContent=m},p1=document.getElementById("abp1");
  let pw=null;
  if(p1){
    pw=p1.value;
    const bad=BackupLib.pwCheck(pw);if(bad)return warn(bad);
    if(pw!==document.getElementById("abp2").value)return warn("Parolalar aynı değil");
  }
  let r;
  try{r=await BF().pick()}catch(e){return warn(/cancel/i.test(e&&e.message||"")?"Klasör seçilmedi":"Klasör izni alınamadı")}
  if(pw!=null&&!await bkRemember(pw))return warn("Parola bu telefonda saklanamadı");
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
    if(!pw)throw new Error("parola");
    const name=BackupLib.autoName(dayKey()),r=await bf.write({name,data:JSON.stringify(await BackupLib.encrypt({v:1,S,keys:getKeys()},pw))});
    const old=BackupLib.autoPrune(r.names||[],name);
    if(old.length)await bf.remove({names:old}).catch(()=>{});
    st.lastAutoBk=dayKey();markBackup(true);
  }catch(e){
    abErr=e.message==="parola"?"Yedek parolası bu telefonda bulunamadı.":"Klasöre yazılamadı. Klasör silinmiş ya da izni kaldırılmış olabilir.";
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
