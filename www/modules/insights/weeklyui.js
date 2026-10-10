"use strict";
/* Last-7-days report PDF (sliding window): collects the records of the last 7 days and hands the PDF to the share sheet. */
async function weeklyPdf(){
  const today=dayKey(),data=WeeklyLib.build({settings:S.settings,entries:Log.all(),vitals:Vitals.all(),meds:Meds.meds(),medLog:Meds.log()},today,7,medNowHM());
  if(!data.rows.some(r=>r.weight!=null||r.water||r.kcal||r.exercise||r.steps))return toast("Bu hafta rapor için kayıt yok");
  let pdf;
  try{pdf=canvasPdf(1,ctx=>WeeklyLib.drawPage(ctx,data,{today}))}catch(e){return toast("PDF hazırlanamadı")}
  await sharePdf(pdf,`neowell-haftalik-${today}.pdf`,"Son 7 gün raporu");
}
document.addEventListener("click",ev=>{if(ev.target.closest('[data-wk="pdf"]'))weeklyPdf()});
