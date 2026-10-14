"use strict";
/* File sharing used across the app (backup, CSV, reports, Coach lists) and the canvas-to-PDF helper for report pages. */

/* Draws `count` pages (draw(ctx,pageIndex)) on canvases and puts them in a PDF as JPEGs. */
function canvasPdf(count,draw){
  return LabLib.buildPdf(Array.from({length:count},(_,i)=>{
    const c=document.createElement("canvas");c.width=LabLib.RW;c.height=LabLib.RH;
    draw(c.getContext("2d"),i);
    return {data:BackupLib.unb64(c.toDataURL("image/jpeg",0.85).split(",")[1]),w:c.width,h:c.height};
  }));
}
/* Files written to the cache for sharing (backup, report, CSV) must not stay after the share: the target app may read the file late, so they are not removed
   right away but before the next write and at every start. Even an encrypted backup file does not need to sit on the phone. */
async function cacheClean(){
  const fs=plugin("Filesystem");if(!fs)return;
  try{const r=await fs.readdir({path:"",directory:"CACHE"});for(const f of r.files||[]){const n=f.name||f;if(/^neowell-.+\.(json|pdf|csv|txt|zip)$/.test(n))await fs.deleteFile({path:n,directory:"CACHE"}).catch(()=>{})}}catch(e){}
}
/* Hands the file to the share sheet (on the phone) or downloads it (in a browser). data: text when utf8 is true, base64 otherwise.
   Returns whether the file was handed over; a cancelled share is silent, a failed one shows a toast. */
async function shareFile(name,title,mime,data,utf8){
  const fs=plugin("Filesystem"),sh=plugin("Share");
  if(fs&&sh){
    try{await cacheClean();const f=await fs.writeFile(utf8?{path:name,data,directory:"CACHE",encoding:"utf8"}:{path:name,data,directory:"CACHE"});await sh.share({title,files:[f.uri]});return true}
    catch(e){if(!/cancel/i.test(e?.message||""))toast("Paylaşılamadı");return false}
  }
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([utf8?data:BackupLib.unb64(data)],{type:mime}));a.download=name;document.body.appendChild(a);a.click();a.remove();
  return true;
}
/* Password-sealed share: the file goes into the backup's AES-GCM/PBKDF2 envelope ({file:{name,mime,utf8,data}}) and is shared as <name>.enc.json. */
function askSharePw(){
  return new Promise(res=>{
    openSheet(`<h3>Dosyayı parolayla şifrele</h3><p class="mut sm">Yedek parolanı yaz ya da yeni bir parola seç. Dosya yalnız bu parolayla açılır; parolayı unutursan kurtarma yolu yoktur.</p>
    <input class="in" id="shp1" type="password" placeholder="Parola (en az ${BackupLib.MINPW} karakter)" autocomplete="new-password"><input class="in" id="shp2" type="password" placeholder="Parolayı tekrar yaz" autocomplete="new-password">
    <div class="hint" id="shw" role="alert"></div><div class="two"><button class="btn" data-shp="ok">Şifrele ve paylaş</button><button class="btn ghost" data-shp="no">Vazgeç</button></div>`);
    sheetEnd=res;
  });
}
document.addEventListener("click",ev=>{
  const b=ev.target.closest("[data-shp]");if(!b)return;
  const pw=$("#shp1").value,bad=b.dataset.shp==="ok"&&(BackupLib.pwCheck(pw)||(pw!==$("#shp2").value?"Parolalar aynı değil":""));
  if(bad)return ferr("shw",bad);
  sheetDone(b.dataset.shp==="ok"?pw:false);closeSheet();
});
async function shareFileSealed(name,title,mime,data,utf8){
  const pw=await askSharePw();if(!pw)return false;
  let env;try{env=await BackupLib.encrypt({file:{name,mime,utf8,data}},pw)}catch(e){toast("Dosya şifrelenemedi");return false}
  return shareFile(name+".enc.json",title,"application/json",JSON.stringify(env),true);
}
const shareOut=(sealed,...a)=>(sealed?shareFileSealed:shareFile)(...a);
const sharePdf=(pdf,name,title,sealed)=>shareOut(sealed,name,title,"application/pdf",BackupLib.b64(pdf));
document.addEventListener("nw:boot",cacheClean);
