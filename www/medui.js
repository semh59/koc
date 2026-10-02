"use strict";
/* İlaç hatırlatıcı arayüzü. index.html'deki S, save, toast, openSheet, closeSheet, esc, render, dayKey, scheduleReminders ile çalışır.
   Doz önermez, etkileşim denetlemez: yalnızca kullanıcının girdiği programı hatırlatır ve alındı/atlandı kaydı tutar. */
let medDraft=null;
const medNowHM=()=>{const d=new Date();return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")};
const medDays=["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"];
const medResched=()=>scheduleReminders().then(setNotif);

/* ---- Ayarlar ---- */
function medSettingsHtml(){
  const st=S.settings;
  return `<h2>İlaç hatırlatıcı</h2><div class="card">
    <p class="mut sm" style="margin:0 0 10px">İlaçlarını ve saatlerini gir, zamanı gelince bildirim al. Bildirimdeki "Aldım" düğmesiyle uygulamayı açmadan kaydet. Uygulama doz önermez ve ilaç etkileşimlerini denetlemez: doktorunun ve eczacının söylediği gibi kullan.</p>
    <button class="btn ghost" data-md="toggle" style="margin-bottom:8px">${st.medOn?"İlaç hatırlatıcıyı kapat":"İlaç hatırlatıcıyı aç"}</button>
    ${st.medOn?`<label style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" data-md="shown" ${st.medShowName?"checked":""} style="width:22px;height:22px">İlaç adı bildirimde görünsün (kilit ekranında da)</label><button class="btn ghost" data-tab="ilac">💊 İlaçlarımı düzenle</button>`:""}
  </div>`;
}
function medToggle(){
  const st=S.settings;st.medOn=!st.medOn;save();render();medResched();
  toast(st.medOn?"İlaç hatırlatıcı açık. İlaçlarını ekle":"Kapatıldı. İlaç kayıtların durur, bildirimler kesildi");
}

/* ---- Günün dozları (Bugün kartı ve İlaçlar ekranı) ---- */
function medRows(day){
  const doses=MedLib.dosesOn(S.meds,day);
  if(!doses.length)return `<p class="mut sm" style="margin:0">Bugün için ilaç yok.</p>`;
  return doses.map(({m,slot})=>{
    const st=MedLib.statusOf(S.medLog,m.id,day,slot),r=S.medLog.find(x=>x.m===m.id&&x.day===day&&x.slot===slot);
    const tail=st==="t"?`<span class="num" style="font-weight:700">✓ ${r&&r.at?r.at:""}</span><button class="chip" data-md="clear:${m.id}:${slot}" aria-label="${esc(m.n)} kaydını geri al">↩</button>`
      :st==="s"?`<span class="mut">Atlandı</span><button class="chip" data-md="clear:${m.id}:${slot}" aria-label="${esc(m.n)} kaydını geri al">↩</button>`
      :`${day===dayKey()&&slot<=medNowHM()?`<small class="mut">Gecikti</small>`:""}<button class="chip" data-md="take:${m.id}:${slot}" style="font-weight:700">✔ Aldım</button><button class="chip" data-md="skip:${m.id}:${slot}">Atla</button>`;
    return `<div class="row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line)"><span class="num" style="min-width:48px">${slot}</span><span style="flex:1;min-width:0">${esc(m.n)}${m.d?`<small class="mut"> ${esc(m.d)}</small>`:""}</span>${tail}</div>`;
  }).join("");
}
function medCard(){
  const st=S.settings;if(!st.medOn)return "";
  if(!S.meds.length)return `<div class="card"><div class="lbl">💊 İlaçlar</div><p class="mut sm" style="margin:0 0 8px">Henüz ilaç eklemedin.</p><button class="btn ghost" data-md="new">➕ İlaç ekle</button></div>`;
  return `<div class="card"><div class="row" style="display:flex;justify-content:space-between;align-items:baseline"><span class="mut">💊 İlaçlar</span><button class="chip" data-tab="ilac">Tümü ›</button></div>${medRows(dayKey())}</div>`;
}

/* ---- İlaçlar ekranı ---- */
function medWhen(m){
  const days=m.w?m.w.map(d=>medDays[d]).join(", "):"her gün";
  const course=m.e?`, ${m.e.slice(8)}.${m.e.slice(5,7)} tarihine kadar`:"";
  return `${m.t.join(", ")} · ${days}${course}`;
}
function viewIlac(){
  const t=dayKey(),nowT=medNowHM(),a7=MedLib.adherence(S.meds,S.medLog,keyOff(-6),t,t,nowT),a30=MedLib.adherence(S.meds,S.medLog,keyOff(-29),t,t,nowT);
  const pct=a=>a.pct==null?"–":"%"+a.pct,cnt=a=>a.total?`${a.taken} / ${a.total} doz alındı`:"doz yok";
  const low=S.meds.filter(m=>m.on&&MedLib.stockLeft(m)!=null&&MedLib.stockLeft(m)<=5).map(m=>`<div class="mut sm" style="padding:4px 0">${esc(m.n)}: yaklaşık ${MedLib.stockLeft(m)} doz kaldı. Yenisini almayı unutma.</div>`).join("");
  const days=[];for(let i=6;i>=0;i--){const k=keyOff(-i),a=MedLib.adherence(S.meds,S.medLog,k,k,t,nowT);if(a.total||a.late)days.push(`<div class="row" style="display:flex;justify-content:space-between;padding:6px 0;border-top:1px solid var(--line)"><span>${k.slice(8)}.${k.slice(5,7)}</span><span class="num">${a.taken} / ${a.total}${a.missed?` · kaçırılan ${a.missed}`:""}${a.late?` · gecikti ${a.late}`:""}${a.skipped?` · atlanan ${a.skipped}`:""}</span></div>`)}
  const list=S.meds.map(m=>`<div class="row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-top:1px solid var(--line)"><span style="flex:1;min-width:0"><b>${esc(m.n)}</b>${m.d?` <small class="mut">${esc(m.d)}</small>`:""}${m.on?"":` <small class="mut">(kapalı)</small>`}<div class="mut sm">${esc(medWhen(m))}${m.k!=null?` · stok ${m.k}`:""}</div></span><button class="chip" data-md="edit:${m.id}">Düzenle</button></div>`).join("");
  return `<div class="card"><div class="lbl">Bugün</div>${S.meds.length?medRows(t):`<p class="mut sm" style="margin:0">Henüz ilaç eklemedin.</p>`}</div>
  ${low?`<div class="card"><div class="lbl">Stok</div>${low}</div>`:""}
  ${a30.total?`<div class="stats"><div class="stat"><div class="k">Son 7 gün uyum</div><div class="v num">${pct(a7)}</div><div class="mut sm">${cnt(a7)}</div></div><div class="stat"><div class="k">Son 30 gün uyum</div><div class="v num">${pct(a30)}</div><div class="mut sm">${cnt(a30)}</div></div></div>`:""}
  ${days.length?`<div class="card"><div class="lbl">Son 7 gün</div>${days.join("")}</div>`:""}
  <div class="card"><div class="lbl">İlaçlarım</div>${list||`<p class="mut sm" style="margin:0">Liste boş.</p>`}<button class="btn" data-md="new" style="margin-top:10px">➕ İlaç ekle</button></div>
  <p class="hint">Uygulama doz önermez, ilaç etkileşimlerini denetlemez, tıbbi yorum yapmaz. Kayıt yalnızca senin hatırlatıcın ve günlüğündür. İlaçlarını doktorunun ve eczacının söylediği gibi kullan.</p>`;
}

/* ---- İlaç ekle / düzenle ---- */
function medCollect(){
  if(!medDraft)return;
  const g=id=>{const e=document.getElementById(id);return e?e.value:""};
  medDraft.n=g("mn");medDraft.d=g("md");medDraft.mc=g("mc");medDraft.k=g("mk");medDraft.p=g("mp");
  medDraft.t=medDraft.t.map((_,i)=>g("mt"+i));
  const on=document.getElementById("mon");if(on)medDraft.on=on.checked;
}
function medRender(){
  const d=medDraft;
  openSheet(`<h3>${d.id?"İlacı düzenle":"İlaç ekle"}</h3>
  <input class="in" id="mn" placeholder="İlaç adı" maxlength="40" value="${esc(d.n)}" autocomplete="off">
  <input class="in" id="md" placeholder="Doz (örn. 1 tablet, 10 mg)" maxlength="30" value="${esc(d.d)}" autocomplete="off">
  <div class="lbl">Saatler (günde en çok ${MedLib.MAXT})</div>
  ${d.t.map((v,i)=>`<div style="display:flex;gap:8px;align-items:center"><input class="in" type="time" id="mt${i}" value="${esc(v)}" style="flex:1">${d.t.length>1?`<button class="chip" data-md="rmtime:${i}" aria-label="Saati kaldır">✕</button>`:""}</div>`).join("")}
  ${d.t.length<MedLib.MAXT?`<button class="chip" data-md="addtime" style="margin-bottom:10px">＋ Saat ekle</button>`:""}
  <div class="lbl">Günler</div><div class="chips">${[1,2,3,4,5,6,0].map(w=>`<button class="chip" data-md="wd:${w}" aria-pressed="${d.w.includes(w)}">${medDays[w]}</button>`).join("")}</div>
  <div class="lbl">Kaç gün kullanılacak? (boş bırakırsan sürekli)</div><input class="in num" id="mc" inputmode="numeric" placeholder="örn. 7" value="${esc(d.mc)}">
  <div class="lbl">Stok takibi (isteğe bağlı)</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input class="in num" id="mk" inputmode="decimal" placeholder="Kutuda kaç adet" value="${esc(d.k)}"><input class="in num" id="mp" inputmode="decimal" placeholder="Her seferde kaç adet" value="${esc(d.p)}"></div>
  ${d.id?`<label style="display:flex;gap:8px;align-items:center;margin-bottom:10px"><input type="checkbox" id="mon" ${d.on?"checked":""} style="width:22px;height:22px">Hatırlatma açık</label>`:""}
  <div class="hint" id="mwarn" role="alert"></div>
  <button class="btn" data-md="save">Kaydet</button>${d.id?`<button class="btn danger" data-md="del" style="margin-top:8px">Sil</button>`:""}<button class="btn ghost" data-md="close" style="margin-top:8px">Vazgeç</button>`);
}
function medOpen(id){
  const m=id?S.meds.find(x=>x.id===id):null;
  if(!m&&S.meds.length>=MedLib.MAXM)return toast(`En çok ${MedLib.MAXM} ilaç eklenebilir`);
  medDraft=m?{id:m.id,n:m.n,d:m.d||"",t:m.t.slice(),w:m.w?m.w.slice():[0,1,2,3,4,5,6],on:m.on,mc:"",k:m.k==null?"":String(m.k).replace(".",","),p:m.p==null?"":String(m.p).replace(".",","),s:m.s,e:m.e}
    :{id:0,n:"",d:"",t:["08:00"],w:[0,1,2,3,4,5,6],on:true,mc:"",k:"",p:""};
  medRender();
}
function medSave(){
  medCollect();const d=medDraft,warn=m=>{const e=document.getElementById("mwarn");if(e)e.textContent=m};
  if(!d.n.trim())return warn("İlacın adını yaz");
  const times=[...new Set(d.t.filter(MedLib.timeOk))];
  if(!times.length||times.length!==d.t.filter(x=>x!=="").length)return warn("Saatleri doldur (boş ya da yinelenen saat var)");
  if(!d.w.length)return warn("En az bir gün seç");
  const num=s=>{const t=String(s).trim();return t===""?undefined:LabLib.toNum(t)};
  const k=num(d.k),p=num(d.p),c=num(d.mc);
  if((d.k.trim()!==""&&(k==null||k<0||k>99999))||(d.p.trim()!==""&&(p==null||p<=0||p>100)))return warn("Stok ve doz başına adet sayı olmalı");
  if(d.mc.trim()!==""&&(c==null||!Number.isInteger(c)||c<1||c>365))return warn("Gün sayısı 1 ile 365 arasında bir tam sayı olmalı");
  const o={id:d.id,n:d.n.trim(),d:d.d.trim(),t:times,w:d.w.length===7?undefined:d.w.slice().sort(),on:d.on!==false};
  if(k!=null)o.k=k;if(p!=null)o.p=p;
  if(c!=null){o.s=dayKey();o.e=MedLib.addDay(o.s,c-1)}else{if(d.s)o.s=d.s;if(d.e)o.e=d.e}
  const before=S.meds.slice();
  if(!o.id){for(let i=1;i<=999;i++)if(!S.meds.some(m=>m.id===i)){o.id=i;break}}
  const others=S.meds.filter(m=>m.id!==o.id);
  S.meds=MedLib.cleanMeds(others.concat([o]).sort((a,b)=>a.id-b.id));
  if(!S.meds.some(m=>m.id===o.id)){S.meds=before;return warn("İlaç kaydedilemedi")}
  S.medLog=MedLib.cleanLog(S.medLog,S.meds);
  if(!save()){S.meds=before;return toast("Kaydedilemedi, depolama dolu")}
  closeSheet();medDraft=null;render();medResched();toast("İlaç kaydedildi");
}
function medMark(mid,slot,st){
  const day=dayKey(),res=MedLib.mark(S,mid,day,slot,st,st==="t"?medNowHM():undefined);
  if(!res)return;
  save();render();medResched();
  const m=S.meds.find(x=>x.id===mid);
  toast(st==="t"?`${m.n} alındı olarak kaydedildi`:st==="s"?`${m.n} atlandı`:"Kayıt geri alındı",()=>{res.undo();save();render();medResched()});
}

/* Bildirimdeki "Aldım" düğmesinden gelen kayıtlar (quickui.js çağırır). Döner: işlenen sayısı. */
function medIngest(items){
  let n=0,names=[];
  for(const i of items){
    const m=S.meds.find(x=>x.id===i.m);
    if(!m||!MedLib.timeOk(i.s)||!m.t.includes(i.s))continue;
    const day=MedLib.dayForTap(i.s,i.t);
    if(MedLib.statusOf(S.medLog,m.id,day,i.s))continue;
    const d=new Date(i.t);
    if(MedLib.mark(S,m.id,day,i.s,i.k?"s":"t",String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"))){n++;names.push(`${m.n} (${i.s})`)}
  }
  return {n,names};
}

document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-md]");if(!el)return;
  const [a,...r]=el.dataset.md.split(":");
  if(a==="toggle")medToggle();
  else if(a==="shown"){S.settings.medShowName=el.checked;save();medResched()}
  else if(a==="new")medOpen(0);
  else if(a==="edit")medOpen(+r[0]);
  else if(a==="close"){closeSheet();medDraft=null}
  else if(a==="save")medSave();
  else if(a==="del"){
    const id=medDraft&&medDraft.id,m=S.meds.find(x=>x.id===id);if(!m)return;
    if(!confirm(`${m.n} silinecek. İlacın kayıtları da silinir. Devam edilsin mi?`))return;
    const bm=S.meds.slice(),bl=S.medLog.slice();
    S.meds=S.meds.filter(x=>x.id!==id);S.medLog=MedLib.cleanLog(S.medLog,S.meds);save();
    closeSheet();medDraft=null;render();medResched();
    toast("İlaç silindi",()=>{S.meds=bm;S.medLog=bl;save();render();medResched()});
  }
  else if(a==="addtime"){medCollect();if(medDraft.t.length<MedLib.MAXT){medDraft.t.push("");medRender()}}
  else if(a==="rmtime"){medCollect();medDraft.t.splice(+r[0],1);medRender()}
  else if(a==="wd"){const w=+r[0],i=medDraft.w.indexOf(w);if(i>=0)medDraft.w.splice(i,1);else medDraft.w.push(w);el.setAttribute("aria-pressed",String(i<0))}
  else if(a==="take")medMark(+r[0],r[1]+":"+r[2],"t");
  else if(a==="skip")medMark(+r[0],r[1]+":"+r[2],"s");
  else if(a==="clear")medMark(+r[0],r[1]+":"+r[2],null);
});
