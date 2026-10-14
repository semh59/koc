"use strict";
/* Settings > Veri ve yedek > Şifreli dosyayı aç: a file shared with "Parolayla şifrele" (<name>.enc.json) is decrypted with its password and handed to the share sheet or saved.
   A backup is not opened here (it has its own restore) and a shared file is not loaded into the app. */
let slFile=null;
const SL_KIND={"application/pdf":"PDF raporu","text/csv":"Tablo (CSV)","application/json":"JSON dosyası","text/plain":"Metin dosyası"};
function sheetSealed(){
  slFile=null;
  openSheet(`<h3>Şifreli dosyayı aç</h3><p class="mut sm">Paylaşırken parolayla şifrelediğin dosyayı (adı .enc.json ile biter) seç ve parolasını yaz. İçindeki PDF, tablo ya da paket çözülür; paylaşabilir ya da kaydedebilirsin.</p>
  <label class="lbl" for="slf">Şifreli dosya</label><input class="in" type="file" id="slf" accept=".json,application/json,text/plain">
  <label class="lbl" for="slp">Parola</label><input class="in" type="password" id="slp" autocomplete="off">
  <div class="hint" id="slw" role="alert"></div>
  <button class="btn" data-sl="go">Aç</button><button class="mt-2 btn ghost" data-sl="close">Vazgeç</button>`);
}
async function slOpen(btn){
  const f=$("#slf").files[0],pw=$("#slp").value;
  if(!f)return ferr("slw","Önce şifreli dosyayı seç");
  if(!pw)return ferr("slw","Parolayı yaz");
  if(bkTooBig(f))return;
  let env;
  try{env=JSON.parse(await f.text())}catch{return ferr("slw","Dosya okunamadı ya da bir NeoWell dosyası değil")}
  if(env?.neowell>1)return ferr("slw","Bu dosya NeoWell'in daha yeni bir sürümüyle şifrelenmiş. Önce uygulamayı güncelle");
  if(!(env&&env.neowell===1&&env.enc==="aes-gcm-pbkdf2"&&BackupLib.wellFormed(env)))return ferr("slw","Dosya bozuk ya da bir NeoWell dosyası değil");
  btn.disabled=true;ferr("slw","Açılıyor…");
  let p;
  try{p=await BackupLib.decrypt(env,pw)}
  catch(e){btn.disabled=false;return ferr("slw",e.message==="format"?"Dosya biçimi tanınmıyor":"Parola yanlış. Dosyayı şifrelerken yazdığın parolayı kullan")}
  btn.disabled=false;
  if(p&&p.S)return ferr("slw","Bu bir yedek dosyası, paylaşılan rapor değil. Yedekten geri yükle ile aç");
  slFile=BackupLib.sharedFile(p);
  if(!slFile)return ferr("slw","Dosyanın içeriği tanınmadı");
  const kb=Math.max(1,Math.round((slFile.utf8?slFile.data.length:slFile.data.length*0.75)/1024));
  openSheet(`<h3>Dosya açıldı</h3><div class="row"><span class="grow"><b>${esc(slFile.name)}</b><small class="db mut sm">${SL_KIND[slFile.mime]||"Dosya"}, yaklaşık ${kb} KB</small></span></div>
  <p class="mut sm">Dosya şifresiz olarak paylaştığın ya da kaydettiğin yere gider.</p>
  <button class="btn" data-sl="share">Paylaş ya da kaydet</button><button class="mt-2 btn ghost" data-sl="close">Kapat</button>`);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-sl]");if(!el)return;
  const a=el.dataset.sl;
  if(a==="open")sheetSealed();
  else if(a==="go")slOpen(el);
  else if(a==="share"&&slFile)shareFile(slFile.name,"NeoWell dosyası",slFile.mime,slFile.data,slFile.utf8);
  else if(a==="close"){slFile=null;closeSheet()}
});
