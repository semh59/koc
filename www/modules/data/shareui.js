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
const sharePdf=(pdf,name,title)=>shareFile(name,title,"application/pdf",BackupLib.b64(pdf));
document.addEventListener("nw:boot",cacheClean);
