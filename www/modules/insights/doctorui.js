"use strict";
/* Trend > Hekime hazırlan: one PDF with the summary, your questions, and the blood pressure, glucose and lab pages of the period. The numbers come from the other reports; this file has the sheet and the page order. */
let docSt=null;
function docSheet(){
  const d=docSt;
  openSheet(`<h3>Hekime hazırlan</h3>
  <p class="mut sm">Seçtiğin dönemdeki kayıtların tek PDF'te toplanır. Kayıtlar olduğu gibi yazılır; yorum ve değerlendirme yoktur. PDF, aşağıdan şifrelemezsen şifresizdir ve paylaştığın yere gider. Tahlil sayfaları tüm sonuçları içerir.</p>
  <div class="lbl">Hangi dönem?</div><div class="chips">${[30,90].map(n=>`<button class="chip" data-doc="days:${n}" aria-pressed="${d.days===n}">Son ${n} gün</button>`).join("")}</div>
  <div class="lbl">Hekime sormak istediklerin (isteğe bağlı)</div>
  ${d.q.map((v,i)=>`<input class="in mb-2" id="dq${i}" maxlength="${DoctorLib.QLEN}" autocomplete="off" aria-label="${i+1}. soru" value="${esc(v)}">`).join("")}
  <p class="hint">Sorular kaydedilmez; PDF hazırlanınca biter.</p>
  ${swRow('data-doc="seal"',d.seal,"Parolayla şifrele","Dosyayı yalnız parolayı bilen açabilir; hekime vermek için şifresiz bırak")}
  <div class="btns"><button class="btn" data-doc="go">PDF hazırla</button><button class="btn ghost" data-doc="close">Vazgeç</button></div>`);
}
function docRead(){docSt.q=docSt.q.map((_,i)=>{const e=document.getElementById("dq"+i);return e?e.value:""})}
async function docGo(){
  docRead();const days=docSt.days,seal=docSt.seal,q=DoctorLib.cleanQuestions(docSt.q);docSt=null;closeSheet();
  const today=dayKey(),st=S.settings,D={settings:st,entries:Log.all(),vitals:Vitals.all(),meds:Meds.meds(),medLog:Meds.log()};
  let pdf;
  try{
    const data=WeeklyLib.build(D,today,days,medNowHM()),secs=[st.bpOn&&Vitals.pages("t",days),st.bsOn&&Vitals.pages("s",days),Labs.pages()].filter(Boolean);
    if(!secs.length&&!data.rows.some(r=>r.weight!=null||r.water||r.kcal||r.exercise||r.steps))return toast("Bu dönemde rapor için kayıt yok");
    const total=1+secs.reduce((a,s)=>a+s.count,0);
    if(total>DoctorLib.MAX_PAGES)return toast(`Rapor ${total} sayfa oluyor; daha kısa bir dönem seç (en çok ${DoctorLib.MAX_PAGES} sayfa)`);
    const info={today,days,questions:q,coverage:DoctorLib.coverage(D,data.from,today,days)};
    pdf=canvasPdf(total,(ctx,n)=>{
      if(n===0)return DoctorLib.drawCover(ctx,data,info);
      let k=n-1;for(const s of secs){if(k<s.count)return s.draw(ctx,k);k-=s.count}
    });
  }catch(e){return toast("PDF hazırlanamadı")}
  await sharePdf(pdf,`neowell-hekim-${today}.pdf`,"Hekime hazırlan",seal);
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-doc]");if(!el)return;
  const [a,arg]=el.dataset.doc.split(":");
  if(a==="open"){docSt={days:30,seal:false,q:["","","","",""]};docSheet()}
  else if(a==="days"){docRead();docSt.days=+arg;docSheet()}
  else if(a==="seal"){docRead();docSt.seal=el.checked;docSheet()}
  else if(a==="close"){docSt=null;closeSheet()}
  else if(a==="go")docGo();
});
