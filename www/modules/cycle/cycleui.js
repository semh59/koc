"use strict";
/* Cycle screen. The data lives only in S.cycle; it never reaches the Coach context, a notification body or the widget. No calorie or diet advice. */
let cycMonth="",cycFlow="",cycSym=[],cycEditId=0,cycDay="";
/* Days past the forecast range before the note says "ask your doctor". */
const LATE_ASK=7;
const cycResched=()=>scheduleReminders().then(setNotif);
/* A range on one line: "21–25 Eki" within a month, "28 Eki – 2 Kas" across months. */
const cycRange=(a,b)=>a.slice(0,7)===b.slice(0,7)?`${+a.slice(8)}–${fd(b)}`:`${fd(a)} – ${fd(b)}`;
const cycNote="Bu bir tahmindir, tıbbi tavsiye değildir. Korunma ya da gebelik planlama aracı değildir.";

/* ---- Settings (Modules) ---- */
function cycSettingsHtml(){
  const st=S.settings;
  return modRow('data-cy="toggle"',st.cycleOn,"Döngü takibi","Dönem günleri ve tahmini sonraki dönem.","hlpcy",`Dönem günlerini kaydet, geçmişe bakarak tahmini sonraki dönemi gör. Veriler yalnız telefonda durur; Rehber'e, widget'a ve bildirim metnine girmez. ${cycNote}`,
    `${swRow('data-cy="rem"',st.cycleRem,"Dönem yaklaşırken hatırlat",st.cycleRem&&risk().pregnant?"Hamilelik işareti olduğu için hatırlatma durduruldu.":"Bildirimde yalnız \"Hatırlatma\" yazar, kilit ekranında konu görünmez.")}<button class="btn ghost" data-tab="cycle">Döngü ekranını aç</button>`);
}
function cycToggle(){
  const st=S.settings;st.cycleOn=!st.cycleOn;if(!st.cycleOn)st.cycleRem=false;
  save();render();cycResched();
  toast(st.cycleOn?"Döngü takibi açık. Daha fazla > Döngü'den kayıt ekle":"Kapatıldı. Kayıtlar telefonda durur, silmek için Gizlilik ve veri'yi kullan");
}
/* Notification 09:00, LEAD days before the predicted range. Title and body are neutral; the subject shows only inside the app. Not scheduled when pregnancy is flagged. */
function cycNotif(){
  const st=S.settings;if(!st.cycleOn||!st.cycleRem||risk().pregnant)return null;
  const d=CycleLib.remindDay(CycleLib.predict(S.cycle),dayKey(),SCHED_DAYS);if(!d)return null;
  const at=new Date(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10),9,0,0,0);
  return at.getTime()>Date.now()+5000?{id:CycleLib.NID,title:"Hatırlatma",body:"Planladığın hatırlatma zamanı.",schedule:{at,allowWhileIdle:true},extra:{act:"open",tab:"cycle"}}:null;
}

/* ---- Calendar: a filled box is a period day, a dashed frame is the predicted range (shape in addition to colour) ---- */
function cycCal(p,f,today){
  const ym=cycMonth||today.slice(0,7),m=+ym.slice(5,7),name=MONTHS[m-1];
  const spans=S.cycle.map(r=>[r.s,r.e||CycleLib.addDays(r.s,Math.min(CycleLib.MAXLEN-1,Math.max(0,CycleLib.diff(today,r.s))))]);
  const grid=calGrid(ym,`${name} ${ym.slice(0,4)}`,(k,d)=>{
    const pd=spans.some(([a,b])=>k>=a&&k<=b),pr=p&&k>=p.from&&k<=p.to,fw=f&&f.ov&&k>=f.from&&k<=f.to,fo=fw&&k===f.ov;
    return `<span class="cyd${pd?" cyp":""}${pr?" cyt":""}${fo?" cyo":fw?" cyf":""}${k===today?" cyn":""}">${pd||pr||fw||k===today?`<span class="vh">${d} ${name}${pd?", dönem günü":""}${pr?", tahmini aralık":""}${fo?", tahmini yumurtlama günü":fw?", tahmini doğurgan pencere":""}${k===today?", bugün":""}</span>`:""}<span aria-hidden="true">${d}</span></span>`;
  });
  return `<div class="card"><div class="cyh"><button class="chip" data-cy="mon:-1" aria-label="Önceki ay">‹</button><b role="status" aria-live="polite">${name} ${ym.slice(0,4)}</b><button class="chip" data-cy="mon:1" aria-label="Sonraki ay">›</button></div>
    ${grid}
    <div class="legend"><span><i class="cyk cyp"></i>Dönem günü</span>${p?`<span><i class="cyk cyt"></i>Tahmini aralık</span>`:""}${f&&f.ov?`<span><b aria-hidden="true">○</b> Doğurgan pencere</span><span><b aria-hidden="true">◆</b> Yumurtlama</span>`:""}</div></div>`;
}

/* ---- Screen ---- */
const cycFertNote="Tahmindir. Doğum kontrolü veya gebelik planlaması için güvenilir değildir; hekimine danış.";
const cycFertile=f=>`<div class="card"><div class="lbl">Tahmini doğurgan pencere</div>${f.irregular?`<p class="mut" role="note">Düzensiz döngüde tahmin güvenilmez.</p>`:`<div class="ink sumv cyv cyfw num">${cycRange(f.from,f.to)}</div><div class="mut sm">Tahmini yumurtlama: ${fd(f.ov)}. Takvim yöntemine göre: yumurtlama sonraki dönemden yaklaşık 14 gün önce, pencere yumurtlamadan 5 gün önce - 1 gün sonra.</div>`}<div class="mt-2 mut sm" role="note">${cycFertNote}</div></div>`;
/* Mood and sleep in the 5 days before the last 3 period starts against the other days; descriptive, hidden under 3 starts or too few values. */
function cycMood(){
  const b=CycleLib.beforeStart(S.cycle,Habits.mood(),Habits.sleep(),dayKey());
  if(!b)return "";
  const f1=x=>x.toFixed(1).replace(".",","),bits=[b.mood?`ruh halin ortalama ${f1(b.mood.pre)}, diğer günlerde ${f1(b.mood.other)} (5 üzerinden)`:"",b.sleep?`uyku ortalaman ${f1(b.sleep.pre/60)} sa, diğer günlerde ${f1(b.sleep.other/60)} sa`:""].filter(Boolean);
  return `<div class="card"><div class="lbl">Dönemden önceki günler</div><p class="m0">Son 3 dönemde dönem başlamadan önceki 5 günde ${bits.join("; ")}.</p><div class="mt-2 mut sm">Yalnız bir karşılaştırmadır; tahmin ya da tıbbi değerlendirme değildir.</div></div>`;
}
/* A day start after midnight makes "today" the previous calendar date until that hour; the person is told once on each entry point. */
const cycDsNote=()=>S.settings.dayStart>0?`<div class="mt-2 mut sm" role="note">Gün başlangıcın ${String(S.settings.dayStart).padStart(2,"0")}:00. O saate kadar "bugün" dünün tarihidir; farklı bir gün için tarihi değiştir.</div>`:"";
/* Symptoms of the chosen day (today by default), saved on tap, independent of a period record; the last days listed under the chips, each removable. */
function cycDaily(today){
  const day=cycDay>today?today:cycDay||today,cur=S.cycleSym.find(x=>x.day===day)?.sym||[],name=k=>CycleLib.DAILY.find(x=>x[0]===k)[1];
  const recent=S.cycleSym.slice(-5).reverse().map(x=>`<div class="prow"><span class="grow">${fd(x.day)}: ${esc(x.sym.map(name).join(", "))}</span><button class="del" data-cy="ddel:${x.day}" aria-label="${fd(x.day)} belirtilerini sil">${Icons.svg("x")}</button></div>`);
  return `<div class="card"><div class="lbl">${day===today?"Bugünkü belirtiler":fd(day)+" belirtileri"}</div><label class="lbl" for="cyd">Gün</label><input class="in" type="date" id="cyd" max="${today}" min="${CycleLib.addDays(today,-90)}" value="${day}"><div class="chips mt-2">${CycleLib.DAILY.map(([k,l])=>`<button class="chip" data-cy="dsym:${k}" aria-pressed="${cur.includes(k)}">${l}</button>`).join("")}</div>${recent.join("")}${cycDsNote()}<div class="mt-2 mut sm" role="note">Yalnız not tutar; yorum ya da tanı değildir.</div></div>`;
}
function viewCycle(){
  const st=S.settings,today=dayKey();
  if(!st.cycleOn)return `${emptyCard("data","Döngü takibi kapalı","Açarsan dönem günlerini kaydedip tahmini sonraki dönemi görebilirsin.",`<button class="btn" data-cy="toggle">Döngü takibini aç</button>`)}<p class="hint">Veriler yalnız telefonda durur. ${cycNote}</p>`;
  const preg=risk().pregnant,p=preg?{ok:false}:CycleLib.predict(S.cycle),f=CycleLib.fertile(p,today),dn=CycleLib.dayOfPeriod(S.cycle,today),lastRow=S.cycle[S.cycle.length-1],openRow=!dn&&lastRow&&!lastRow.e&&lastRow.s<=today?lastRow:null;
  let pred;
  if(preg)pred=`<p class="mut">Hamilelik işareti olduğu için tahmin gösterilmiyor. Sorularını hekimine danış. Kayıtların durur.</p><button class="lnk" data-act="health">İşareti Sağlık notların'dan kaldırabilirsin</button>`;
  else if(!p.ok)pred=`<p class="mut">Yeterli veri yok. Tahmin için en az 3 dönem başlangıcı kaydet.</p>`;
  else{
    const conf=p.irregular?"düşük":p.sd<=2?"yüksek":"orta";
    pred=`<div class="ink sumv cyv cypr num">${cycRange(p.from,p.to)}</div><div class="mut sm">Son ${p.n} döngünün ortalaması ${String(p.mean).replace(".",",")} gün, sapma ${String(p.sd).replace(".",",")} gün. Güven: ${conf}.</div>${p.irregular?`<div class="mut sm" role="note">Döngülerin düzensiz görünüyor; bu tahmin güvenilir değil.</div>`:""}`;
  }
  if(!preg&&risk().nursing)pred+=`<div class="mut sm" role="note">Emzirme döneminde döngü düzensiz olabilir; tahmin güvenilmez olabilir.</div>`;
  const skip=CycleLib.skipped(S.cycle),late=preg?0:CycleLib.overdue(p,today);
  if(late)pred+=`<div class="mut sm" role="note">Tahmin aralığı ${late} gün önce bitti${late>=LATE_ASK?"; hekimine danış.":". Dönemin başladıysa ekleyebilirsin."}</div>`;
  if(!preg&&skip)pred+=`<div class="mut sm" role="note">${skip} aralık 15-60 gün dışında kaldığı için ortalamaya katılmadı (atlanmış bir kayıt olabilir).</div>`;
  const label=(list,k)=>list.find(x=>x[0]===k)[1];
  const rows=S.cycle.slice().reverse().map(r=>{
    const tags=[r.flow&&label(CycleLib.FLOW,r.flow),...(r.sym||[]).map(k=>label(CycleLib.SYM,k))].filter(Boolean).join(", ");
    return `<div class="prow"><button class="grow pbtn" data-cy="edit:${r.id}"><span class="grow"><b class="num">${r.e?cycRange(r.s,r.e):fd(r.s)}</b>${r.e?"":`<span class="mut"> · bitiş girilmedi, eklemek için dokun</span>`}${tags||r.note?`<small class="db mut">${esc(tags)}${r.note?(tags?" · ":"")+esc(r.note):""}</small>`:""}</span></button><button class="del" data-cy="del:${r.id}" aria-label="${fd(r.s)} tarihli kaydı sil">${Icons.svg("x")}</button></div>`;
  }).join("");
  return `<button class="mb-3 btn" data-cy="add">${Icons.svg("plus")} Dönem ekle</button>
  <div class="card"><div class="lbl">Bu dönem</div>${dn?`<div class="ink sumv cyv num">${dn}. gün</div><button class="btn ghost" data-cy="end">Dönem bugün bitti</button>`:openRow?`<p class="m0 mut">${fd(openRow.s)} tarihinde başlayan dönemin bitişi girilmedi.</p><button class="btn ghost" data-cy="edit:${openRow.id}">Bitiş tarihini gir</button>`:`<p class="m0 mut">${lastRow?`Açık dönem yok. Son başlangıç: ${fd(lastRow.s)}.`:"Henüz kayıt yok. İlk dönemini eklediğinde burada görünür."}</p>`}</div>
  <div class="card"><div class="lbl">Tahmini sonraki dönem (yaklaşık)</div>${pred}<div class="mt-2 mut sm">${cycNote}</div></div>
  ${cycDaily(today)}
  ${p.ok?cycFertile(f):""}
  ${preg?"":cycMood()}
  ${cycCal(p.ok?p:null,f,today)}
  ${rows?`<div class="card"><div class="lbl">Geçmiş</div>${rows}</div>`:""}
  <p class="hint">Veriler yalnız telefonda durur; Rehber'e, bildirim metnine ve widget'a girmez. Silmek için Gizlilik ve veri'yi kullan.</p>`;
}

/* ---- Adding a record ---- */
const cycChips=(attr,list,on)=>`<div class="chips">${list.map(([v,l])=>`<button class="chip" data-${attr}="${v}" aria-pressed="${on.includes(v)}">${l}</button>`).join("")}</div>`;
/* `r` is the record being edited; without it a new period starts today. */
function sheetCycle(r){
  const t=dayKey();cycEditId=r?r.id:0;cycFlow=r?.flow||"";cycSym=r?.sym?[...r.sym]:[];
  openSheet(`<h3>${r?"Dönemi düzenle":"Dönem ekle"}</h3>
  <label class="lbl" for="cys">Başlangıç</label><input class="in" type="date" id="cys" max="${t}" value="${r?r.s:t}">${cycDsNote()}
  <label class="lbl" for="cye">Bitiş (isteğe bağlı)</label><input class="in" type="date" id="cye" max="${r?.s&&CycleLib.addDays(r.s,CycleLib.MAXLEN-1)<t?CycleLib.addDays(r.s,CycleLib.MAXLEN-1):t}" value="${r?.e||""}">
  <div class="lbl">Akış (isteğe bağlı)</div>${cycChips("cyf",CycleLib.FLOW,[cycFlow])}
  <div class="lbl">Belirtiler (isteğe bağlı)</div>${cycChips("cyb",CycleLib.SYM,cycSym)}
  <label class="lbl" for="cynot">Not (isteğe bağlı)</label><input class="in" id="cynot" maxlength="${CycleLib.NOTE_MAX}" value="${esc(r?.note||"")}" autocomplete="off">
  <div class="ferr" id="cywarn" role="alert"></div><button class="btn" data-cy="save">Kaydet</button>`);
}
/* Stores a new list; on a failed save the old list stays and the user is told. */
function cycPut(next,msg,del){
  const prev=S.cycle;S.cycle=next;
  if(!commit(()=>{S.cycle=prev}))return;
  closeSheet();render();cycResched();
  toast(msg,()=>{S.cycle=prev;save();render();cycResched()},del);
}
function cycSave(){
  const v=id=>$("#"+id)?.value||"",t=dayKey();
  const c=CycleLib.check({s:v("cys"),e:v("cye"),flow:cycFlow,sym:cycSym,note:v("cynot")},t);
  const rest=S.cycle.filter(r=>r.id!==cycEditId);
  const err=c.err||(CycleLib.overlap(rest,c.row)&&"Bu tarihler başka bir kayıtla çakışıyor");
  if(err)return ferr("cywarn",err);
  cycPut(CycleLib.clean([...rest,c.row],t),cycEditId?"Kayıt güncellendi":"Dönem kaydedildi");
}

document.addEventListener("click",ev=>{
  const f=ev.target.closest("[data-cyf],[data-cyb]");
  if(f){
    const d=f.dataset;
    if(d.cyf!=null)cycFlow=cycFlow===d.cyf?"":d.cyf;
    else cycSym=cycSym.includes(d.cyb)?cycSym.filter(x=>x!==d.cyb):[...cycSym,d.cyb];
    f.parentNode.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",String(c.dataset.cyf!=null?c.dataset.cyf===cycFlow:cycSym.includes(c.dataset.cyb))));return;
  }
  const el=ev.target.closest("[data-cy]");if(!el)return;
  const [a,arg]=el.dataset.cy.split(":");
  if(a==="toggle")cycToggle();
  else if(a==="rem"){S.settings.cycleRem=el.checked;save();cycResched()}
  else if(a==="add")sheetCycle();
  else if(a==="edit")sheetCycle(S.cycle.find(r=>r.id===+arg));
  else if(a==="save")cycSave();
  else if(a==="mon"){cycMonth=ymShift(cycMonth||dayKey().slice(0,7),+arg);render()}
  else if(a==="end"){const r=S.cycle[S.cycle.length-1],t=dayKey(),c=r&&CycleLib.check({...r,e:t},t);if(c?.row)cycPut(S.cycle.map(x=>x===r?{...c.row,id:r.id}:x),"Dönem bitirildi");else toast("Bitiş kaydedilemedi")}
  else if(a==="dsym"){const prev=S.cycleSym;S.cycleSym=CycleLib.toggleDay(prev,cycDay||dayKey(),arg);if(commit(()=>{S.cycleSym=prev}))render()}
  else if(a==="ddel"){const prev=S.cycleSym;S.cycleSym=prev.filter(x=>x.day!==arg);if(commit(()=>{S.cycleSym=prev})){render();toast("Günün belirtileri silindi",()=>{S.cycleSym=prev;save();render()})}}
  else if(a==="del")cycPut(S.cycle.filter(r=>r.id!==+arg),"Kayıt silindi",true);
});
document.addEventListener("change",ev=>{
  if(ev.target.id!=="cyd")return;
  const v=ev.target.value;if(CycleLib.diff(dayKey(),v)>=0&&CycleLib.diff(dayKey(),v)<=90){cycDay=v;render()}
});
