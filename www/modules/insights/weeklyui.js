"use strict";
/* Son 7 gün raporu PDF'i (kayan pencere): son 7 günün kayıtlarını derleyip paylaşım ekranına verir. */
async function weeklyPdf(){
  const today=dayKey(),data=WeeklyLib.build({settings:S.settings,entries:Log.all(),vitals:Vitals.all(),meds:Meds.meds(),medLog:Meds.log()},today,7,medNowHM());
  if(!data.rows.some(r=>r.weight!=null||r.water||r.kcal||r.exercise||r.steps))return toast("Bu hafta rapor için kayıt yok");
  let pdf;
  try{
    const c=document.createElement("canvas");c.width=WeeklyLib.RW;c.height=WeeklyLib.RH;
    WeeklyLib.drawPage(c.getContext("2d"),data,{today});
    pdf=LabLib.buildPdf([{data:labUnb64(c.toDataURL("image/jpeg",0.85).split(",")[1]),w:c.width,h:c.height}]);
  }catch(e){return toast("PDF hazırlanamadı")}
  await sharePdf(pdf,`neowell-haftalik-${today}.pdf`,"Son 7 gün raporu");
}
document.addEventListener("click",ev=>{if(ev.target.closest('[data-wk="pdf"]'))weeklyPdf()});
