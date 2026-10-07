"use strict";
/* Döngü ekranı. index.html'deki S, save, toast, openSheet, closeSheet, esc, fd, render, dayKey, risk, scheduleReminders ile çalışır.
   Veri yalnız S.cycle'da durur; Koç bağlamına, bildirim gövdesine ve widget'a girmez. Kalori ya da diyet önerisi yapmaz. */
let cycMonth="",cycFlow="",cycSym=[];
const cycMonths=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const cycResched=()=>scheduleReminders().then(setNotif);
const cycNote="Bu bir tahmindir, tıbbi tavsiye değildir. Korunma ya da gebelik planlama aracı değildir.";

/* ---- Ayarlar (Modüller) ---- */
function cycSettingsHtml(){
  const st=S.settings;
  return `<h2>Döngü takibi</h2><div class="card">
    <p class="mut sm" style="margin:0 0 10px">Dönem günlerini kaydet, geçmişe bakarak tahmini sonraki dönemi gör. Veriler yalnız telefonda durur; Koç'a, widget'a ve bildirim metnine girmez. ${cycNote}</p>
    <button class="btn ghost" data-cy="toggle" style="margin-bottom:8px">${st.cycleOn?"Döngü takibini kapat":"Döngü takibini aç"}</button>
    ${st.cycleOn?`${swRow('data-cy="rem"',st.cycleRem,"Dönem yaklaşırken hatırlat","Bildirimde yalnız \"Hatırlatma\" yazar, kilit ekranında konu görünmez.")}<button class="btn ghost" data-tab="dongu">Döngü ekranını aç</button>`:""}
  </div>`;
}
function cycToggle(){
  const st=S.settings;st.cycleOn=!st.cycleOn;if(!st.cycleOn)st.cycleRem=false;
  save();render();cycResched();
  toast(st.cycleOn?"Döngü takibi açık. Daha fazla > Döngü'den kayıt ekle":"Kapatıldı. Kayıtlar telefonda durur, silmek için Gizlilik ve veri'yi kullan");
}
/* Bildirim: tahmin aralığından LEAD gün önce 09:00. Başlık ve gövde nötrdür; konu yalnız uygulama içinde görünür. Hamilelik işaretinde kurulmaz. */
function cycNotif(){
  const st=S.settings;if(!st.cycleOn||!st.cycleRem||risk().pregnant)return null;
  const d=CycleLib.remindDay(CycleLib.predict(S.cycle),dayKey(),SCHED_DAYS);if(!d)return null;
  const at=new Date(+d.slice(0,4),+d.slice(5,7)-1,+d.slice(8,10),9,0,0,0);
  return at.getTime()>Date.now()+5000?{id:CycleLib.NID,title:"Hatırlatma",body:"Planladığın hatırlatma zamanı.",schedule:{at,allowWhileIdle:true},extra:{act:"open",tab:"dongu"}}:null;
}

/* ---- Takvim: dolu kutu dönem günü, kesikli çerçeve tahmin aralığı (renge ek olarak biçim) ---- */
function cycCal(p,today){
  const ym=cycMonth||today.slice(0,7),y=+ym.slice(0,4),m=+ym.slice(5,7),first=`${ym}-01`,n=new Date(y,m,0).getDate();
  const lead=(new Date(y,m-1,1).getDay()+6)%7;
  const isP=k=>S.cycle.some(r=>k>=r.s&&k<=(r.e||CycleLib.addDays(r.s,Math.min(CycleLib.MAXLEN-1,Math.max(0,CycleLib.diff(today,r.s))))));
  let cells="<span></span>".repeat(lead);
  for(let d=1;d<=n;d++){
    const k=`${ym}-${String(d).padStart(2,"0")}`,pd=isP(k),pr=p&&k>=p.from&&k<=p.to;
    cells+=`<span class="cyd${pd?" cyp":""}${pr?" cyt":""}${k===today?" cyn":""}">${pd||pr||k===today?`<span class="vh">${d} ${cycMonths[m-1]}${pd?", dönem günü":""}${pr?", tahmini aralık":""}${k===today?", bugün":""}</span>`:""}<span aria-hidden="true">${d}</span></span>`;
  }
  return `<div class="card"><div class="cyh"><button class="chip" data-cy="mon:-1" aria-label="Önceki ay">‹</button><b role="status" aria-live="polite">${cycMonths[m-1]} ${y}</b><button class="chip" data-cy="mon:1" aria-label="Sonraki ay">›</button></div>
    <div class="cyg" role="group" aria-label="${cycMonths[m-1]} ${y} takvimi">${["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(s=>`<span class="cyw" aria-hidden="true">${s}</span>`).join("")}${cells}</div>
    <div class="legend"><span><i class="cyk cyp"></i>Dönem günü</span>${p?`<span><i class="cyk cyt"></i>Tahmini aralık</span>`:""}</div></div>`;
}

/* ---- Ekran ---- */
function viewDongu(){
  const st=S.settings,today=dayKey();
  if(!st.cycleOn)return `<div class="card"><p>Döngü takibi kapalı.</p><button class="btn" data-cy="toggle">Döngü takibini aç</button></div><p class="hint">Veriler yalnız telefonda durur. ${cycNote}</p>`;
  const preg=risk().pregnant,p=preg?{ok:false}:CycleLib.predict(S.cycle),dn=CycleLib.dayOfPeriod(S.cycle,today),lastRow=S.cycle[S.cycle.length-1];
  let pred;
  if(preg)pred=`<p class="mut">Sağlık notunda hamilelik ya da emzirme geçtiği için tahmin gösterilmiyor. Sorularını hekimine danış. Kayıtların durur.</p>`;
  else if(!p.ok)pred=`<p class="mut">Yeterli veri yok. Tahmin için en az 3 dönem başlangıcı kaydet.</p>`;
  else{
    const conf=p.irregular?"düşük":p.sd<=2?"yüksek":"orta";
    pred=`<div class="sumv num" style="color:var(--ink)">Yaklaşık ${fd(p.from)} – ${fd(p.to)}</div><div class="mut sm">Son ${p.n} döngünün ortalaması ${String(p.mean).replace(".",",")} gün, sapma ${String(p.sd).replace(".",",")} gün. Güven: ${conf}.</div>${p.irregular?`<div class="mut sm" role="note">Döngülerin düzensiz görünüyor; bu tahmin güvenilir değil.</div>`:""}`;
  }
  const rows=S.cycle.slice().reverse().map(r=>{
    const tags=[r.flow&&CycleLib.FLOW.find(f=>f[0]===r.flow)[1],...(r.sym||[]).map(k=>CycleLib.SYM.find(s=>s[0]===k)[1])].filter(Boolean).join(", ");
    return `<div class="row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line)"><span style="flex:1;min-width:0">${fd(r.s)}${r.e?" – "+fd(r.e):" –"}<small class="mut" style="display:block">${esc(tags)}${r.not?(tags?" · ":"")+esc(r.not):""}</small></span><button class="chip" data-cy="del:${r.id}" aria-label="${fd(r.s)} tarihli kaydı sil">✕</button></div>`;
  }).join("");
  return `<button class="btn" data-cy="add" style="margin-bottom:12px">${Icons.svg("plus")} Dönem ekle</button>
  <div class="card"><div class="lbl">Bu dönem</div>${dn?`<div class="sumv num" style="color:var(--ink)">${dn}. gün</div><button class="chip" data-cy="end">Bugün bitti</button>`:`<p class="mut">${lastRow?`Açık dönem yok. Son başlangıç: ${fd(lastRow.s)}.`:"Henüz kayıt yok."}</p>`}</div>
  <div class="card"><div class="lbl">Tahmini sonraki dönem</div>${pred}<div class="mut sm" style="margin-top:6px">${cycNote}</div></div>
  ${cycCal(p.ok?p:null,today)}
  <div class="card"><div class="lbl">Geçmiş</div>${rows||`<p class="mut">Henüz kayıt yok.</p>`}</div>
  <p class="hint">Veriler yalnız telefonda durur; Koç'a, bildirim metnine ve widget'a girmez. Silmek için Gizlilik ve veri'yi kullan.</p>`;
}

/* ---- Kayıt ekleme ---- */
const cycChips=(attr,list,sel)=>`<div class="chips">${list.map(([v,l])=>`<button class="chip" data-${attr}="${v}" aria-pressed="${sel.includes(v)}">${l}</button>`).join("")}</div>`;
function sheetCycle(){
  const t=dayKey();cycFlow="";cycSym=[];
  openSheet(`<h3>Dönem ekle</h3>
  <label class="lbl" for="cys">Başlangıç</label><input class="in" type="date" id="cys" max="${t}" value="${t}">
  <label class="lbl" for="cye">Bitiş (isteğe bağlı)</label><input class="in" type="date" id="cye" max="${t}">
  <div class="lbl">Akış (isteğe bağlı)</div>${cycChips("cyf",CycleLib.FLOW,"")}
  <div class="lbl">Belirtiler (isteğe bağlı)</div>${cycChips("cyb",CycleLib.SYM,"")}
  <input class="in" id="cynot" placeholder="Not (isteğe bağlı)" maxlength="80" autocomplete="off">
  <div class="hint" id="cywarn" role="alert"></div><button class="btn" data-cy="save">Kaydet</button>`);
}
function cycPut(next,msg){
  const prev=S.cycle;S.cycle=next;
  if(!save()){S.cycle=prev;return toast("Kaydedilemedi, depolama dolu")}
  closeSheet();render();cycResched();
  toast(msg,()=>{S.cycle=prev;save();render();cycResched()});
}
function cycSave(){
  const v=id=>(document.getElementById(id)||{}).value||"",t=dayKey(),warn=m=>{const e=document.getElementById("cywarn");if(e)e.textContent=m};
  const c=CycleLib.check({s:v("cys"),e:v("cye"),flow:cycFlow,sym:cycSym,not:v("cynot")},t);
  if(!c.row)return warn(c.err);
  if(CycleLib.overlap(S.cycle,c.row))return warn("Bu tarihler başka bir kayıtla çakışıyor");
  cycPut(CycleLib.clean([...S.cycle,c.row],t),"Dönem kaydedildi");
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
  else if(a==="save")cycSave();
  else if(a==="mon"){const t=dayKey(),ym=cycMonth||t.slice(0,7),d=new Date(+ym.slice(0,4),+ym.slice(5,7)-1+ +arg,1);cycMonth=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;render()}
  else if(a==="end"){const r=S.cycle[S.cycle.length-1],t=dayKey(),c=r&&CycleLib.check({...r,e:t},t);if(c&&c.row)cycPut(S.cycle.map(x=>x===r?{...c.row,id:r.id}:x),"Dönem bitirildi");else toast("Bitiş kaydedilemedi")}
  else if(a==="del"){const prev=S.cycle;S.cycle=prev.filter(r=>r.id!==+arg);save();render();cycResched();toast("Kayıt silindi",()=>{S.cycle=prev;save();render();cycResched()})}
});
PV_CATS.push(["Döngü kayıtları",()=>S.cycle.length,()=>{S.cycle=[]}]);
