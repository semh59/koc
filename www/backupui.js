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
  <p class="mut sm" style="margin:0 0 10px">Verilerin parolayla şifrelenir. Paylaşım ekranında Google Drive'ı (ya da istediğin yeri) seç. Hesap bağlamak gerekmez.${lb?` Son yedek: ${lb.slice(8)}.${lb.slice(5,7)}.${lb.slice(0,4)}.`:""}</p>
  ${rem?`<p>Parola bu telefonda saklı.</p><button class="btn" data-bk="send">Şimdi gönder</button><button class="btn ghost" data-bk="forget" style="margin-top:8px">Parolayı unut</button>`
  :`<input class="in" id="bkp1" type="password" placeholder="Parola (en az 6 karakter)" autocomplete="new-password"><input class="in" id="bkp2" type="password" placeholder="Parolayı tekrar yaz" autocomplete="new-password">
  ${native?`<label style="min-height:44px;display:flex;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" id="bkrem" checked style="width:22px;height:22px">Parolayı bu telefonda sakla (Keystore ile şifreli)</label>`:""}
  <div class="hint" id="bkw" role="alert"></div><button class="btn" data-bk="send">Şifrele ve gönder</button>`}
  <p class="hint">Parolayı unutursan yedek açılmaz. Geri yüklemek için: Ayarlar > Yedekle veya geri yükle > Dosyadan oku (dosyayı Drive'dan seçebilirsin).</p>
  <button class="btn ghost" data-bk="close" style="margin-top:8px">Vazgeç</button>`);
}
async function bkSend(){
  const warn=m=>{const e=document.getElementById("bkw");if(e)e.textContent=m};
  let pw=await bkRemembered(),fresh=false;
  if(pw==null){
    pw=document.getElementById("bkp1").value;
    if(pw.length<6)return warn("Parola en az 6 karakter olmalı");
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
  else if(a==="forget"){lsDel(BKPW_LS);sheetDrive()}
  else if(a==="close")closeSheet();
});
