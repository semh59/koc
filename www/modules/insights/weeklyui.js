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
/* This week next to last week (Trend). Only days that have records enter an average; a side without any shows a dash. */
function weekCompareCard(){
  const c=WeeklyLib.compare({settings:S.settings,entries:Log.all()},dayKey());
  if(!Object.values(c.prev).some(x=>x.n)||!Object.values(c.cur).some(x=>x.n))return "";
  const cell=(x,f)=>x.n?`${f(x.v)} <small class="mut sm">${x.n} gün</small>`:"—";
  const rows=[["Kalori (kcal)","kcal",x=>Math.round(x)],["Su (L)","water",x=>fmt(x/1000,1)],["Adım","steps",x=>Math.round(x).toLocaleString("tr-TR")]].filter(([,k])=>c.cur[k].n||c.prev[k].n);
  return `<h2>Bu hafta ve geçen hafta</h2><div class="card"><table><thead><tr><th>Günlük ortalama</th><th>Bu hafta</th><th>Geçen hafta</th></tr></thead><tbody>${rows.map(([l,k,f])=>`<tr><td>${l}</td><td class="num">${cell(c.cur[k],f)}</td><td class="num">${cell(c.prev[k],f)}</td></tr>`).join("")}</tbody></table></div>`;
}
