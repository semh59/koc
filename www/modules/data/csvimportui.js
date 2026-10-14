"use strict";
/* Settings > Data: add weight, blood pressure and glucose rows from a table (CSV). The reading is in csvreadlib.js; this file has the picker, the questions, the preview and the undo. */
let ciSt=null;
const CI_MAX_BYTES=8e6;
function ciRead(){
  const s=ciSt;s.res=CsvReadLib.read(s.text,{today:dayKey(),order:s.order,wUnit:s.wUnit,gUnit:s.gUnit});
  if(s.res.err)return;
  s.plan=CsvReadLib.plan(s.res,{
    wDays:new Set(Log.where(e=>e.type==="weight").map(e=>e.day)),
    t:new Set(Vitals.all().filter(r=>r.k==="t").map(r=>[r.day,r.time,r.sys,r.dia].join("|"))),
    s:Vitals.all().filter(r=>r.k==="s")
  });
}
const ciChips=(a,list,cur)=>`<div class="chips">${list.map(([v,t])=>`<button class="chip" data-ci="${a}:${v}" aria-pressed="${cur===v}">${t}</button>`).join("")}</div>`;
function ciSheet(){
  const s=ciSt,r=s.res;
  if(r.err)return openSheet(`<h3>Tablodan kayıt ekle</h3><p class="my-2">${esc(r.err)}</p><button class="btn" data-ci="close">Kapat</button>`);
  const p=s.plan,a=p.add,sample=r.askDate?s.text.match(/\d{1,2}[/-]\d{1,2}[/-]\d{4}/):null;
  const q=[
    r.askDate?`<div class="lbl">Dosyada ${esc(sample?sample[0]:"03/04/2024")} gibi tarihler var. İlk sayı ne?</div>${ciChips("order",[["dmy","Gün (3 Nisan)"],["mdy","Ay (4 Mart)"]],s.order||"dmy")}`:"",
    r.askW?`<div class="lbl">Kilolar hangi birimde? (dosyada yazmıyor)</div>${ciChips("wu",[["kg","kg"],["lb","lb"]],s.wUnit||"kg")}`:"",
    r.askG?`<div class="lbl">Şeker hangi birimde? (dosyada yazmıyor)</div>${ciChips("gu",[["mg","mg/dL"],["mmol","mmol/L"]],s.gUnit||"mg")}`:""
  ].join("");
  const line=[...a.w.slice(0,2).map(x=>`${fd(x.day)}, ${String(x.v).replace(".",",")} kg`),...a.t.slice(0,2).map(x=>`${fd(x.day)} ${x.time}, ${x.sys}/${x.dia} mmHg`),...a.s.slice(0,2).map(x=>`${fd(x.day)} ${x.time}, ${Units.fg(x.g)} ${Units.gl()}`)].slice(0,5);
  const bad=r.bad.slice(0,5).map(b=>`<li>${b.line}. satır: ${esc(b.why)}</li>`).join("");
  openSheet(`<h3>Tablodan kayıt ekle</h3><div class="mut sm">${s.name?esc(s.name):""}</div>
  ${q}
  <div class="two"><div class="stat"><div class="k">Kilo</div><div class="v num">${a.w.length}</div></div><div class="stat"><div class="k">Tansiyon</div><div class="v num">${a.t.length}</div></div><div class="stat"><div class="k">Şeker</div><div class="v num">${a.s.length}</div></div></div>
  ${line.length?`<ul class="my-2 mut sm num">${line.map(l=>`<li>${l}</li>`).join("")}</ul>`:`<p class="hint">Eklenecek yeni kayıt yok.</p>`}
  <p class="my-2 mut sm">Zaten kayıtlı, atlanacak: ${p.dup} · Okunamadı: ${r.bad.length}${r.noTime?` · Saati olmayan ${r.noTime} ölçüm 12:00 olarak eklenir (seans: Diğer)`:""}</p>
  ${bad?`<ul class="mut sm">${bad}</ul>`:""}
  <p class="hint">Bu dosyadaki ölçümleri telefondaki kayıtlarına ekler; aynı güne ait kendi kilon varsa dosyadakini atlar. Eklenenler hekim raporunda görünür. Dosya hiçbir yere gönderilmez. Emin olmak için önce yedek al.</p>
  <div class="btns"><button class="btn" data-ci="go" ${p.total?"":"disabled"}>Onayla ve ekle</button><button class="btn ghost" data-ci="close">Vazgeç</button></div>`);
}
function ciGo(){
  const a=ciSt.plan.add,ents=a.w.map(x=>Log.put({day:x.day,time:"12:00",type:"weight",v:x.v,text:""})),ids=Vitals.addAll([...a.t,...a.s]);
  if(ids===null){ents.forEach(e=>Log.remove(x=>x.id===e.id));return toast("Ölçüm listesi dolu, eklenemedi")}
  if(!commit(()=>{ents.forEach(e=>Log.remove(x=>x.id===e.id));Vitals.remove(ids)}))return;
  const n=ents.length+ids.length,eid=new Set(ents.map(e=>e.id));
  ciSt=null;closeSheet();render();
  toast(`${n} kayıt eklendi`,()=>{Log.remove(e=>eid.has(e.id));Vitals.remove(ids);save();render()});
}
function ciPick(){
  const i=document.createElement("input");i.type="file";i.accept=".csv,text/csv,text/plain,application/csv,application/vnd.ms-excel";i.hidden=true;
  i.addEventListener("change",()=>{
    const f=i.files&&i.files[0];i.remove();if(!f)return;
    if(f.size>CI_MAX_BYTES)return toast("Dosya çok büyük (8 MB üstü)");
    f.text().then(x=>{ciSt={text:x,name:f.name};ciRead();ciSheet()},()=>toast("Dosya okunamadı"));
  });
  document.body.appendChild(i);i.click();
}
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-ci]");if(!el)return;
  const [a,arg]=el.dataset.ci.split(":");
  if(a==="open")ciPick();
  else if(a==="close"){ciSt=null;closeSheet()}
  else if(a==="go")ciGo();
  else if(ciSt){ciSt[{order:"order",wu:"wUnit",gu:"gUnit"}[a]]=arg;ciRead();ciSheet()}
});
