"use strict";
/* Medication reminder screens. It gives no dose advice and checks no interactions: it only reminds the user's own schedule and records taken/skipped. */
let medDraft=null;
const medNowHM=()=>MedLib.hm(new Date());
const medResched=()=>scheduleReminders().then(setNotif);
const medNum=x=>x==null?"":String(x).replace(".",",");
const medClose=()=>{closeSheet();medDraft=null};
const MED_LOW_STOCK=5;

/* ---- Settings ---- */
function medSettingsHtml(){
  const st=S.settings;
  return modRow('data-md="toggle"',st.medOn,"İlaç hatırlatıcı","Saati gelince bildirim, tek dokunuşla kayıt.","hlpmd",`İlaçlarını ve saatlerini gir, zamanı gelince bildirim al. Bildirimdeki "Aldım" düğmesiyle uygulamayı açmadan kaydet. Uygulama doz önermez ve ilaç etkileşimlerini denetlemez: doktorunun ve eczacının söylediği gibi kullan.`,
    `${swRow('data-md="shown"',st.medShowName,"İlaç adı bildirimde görünsün (kilit ekranında da)")}<button class="btn ghost" data-tab="meds">${Icons.svg("meds")} İlaçlarımı düzenle</button>${isNative()?`<details class="acc mt-2"><summary>Bildirim sorun giderme</summary><p class="m0 hint">Kilitli ekran testinde düğmeye bas, telefonu kilitle ve ekranı kapat. 15 saniye sonra ekran yanıp ilaç ekranı açılmalı. Açılmazsa telefon ayarlarından uygulamaya kilit ekranında gösterme ve tam ekran bildirim izni ver.</p><div class="btns"><button class="btn ghost" data-md="locktest">Kilitli ekran testi</button><button class="btn ghost" data-md="realtest">Gerçek doz testi (1 dk)</button><button class="btn ghost" data-md="wakelog">Alarm kayıtları</button></div></details>`:""}`);
}
function medToggle(){
  const st=S.settings;st.medOn=!st.medOn;save();render();medResched();
  toast(st.medOn?"İlaç hatırlatıcı açık. İlaçlarını ekle":"Kapatıldı. İlaç kayıtların durur, bildirimler kesildi");
}

/* Real dose test: the medication notification (same channel, no buttons, no name) and the screen alarm are set for the same ms; dose log and stock are untouched. */
const MED_TEST_NID=7149;let medWakeText="";
async function medRealTest(){
  const w=MW(),ln=LN();if(!w||!ln)return toast("Yalnızca telefondaki uygulamada çalışır");
  const at=Date.now()+60000;
  try{
    await ln.schedule({notifications:[{id:MED_TEST_NID,title:MedLib.TITLE,body:"Test",schedule:{at:new Date(at),allowWhileIdle:true},channelId:"nw_med",ongoing:true,autoCancel:true}]});
    await w.test({at});
    toast("1 dakika sonra test alarmı çalacak: telefonu kilitle, ekranı kapat ve bekle");
  }catch(e){toast("Test kurulamadı")}
}
/* Alarm log: the last 20 alarm/setup entries and likely problems; Copy shares them for support. */
async function medWakeLog(){
  const w=MW();if(!w)return toast("Yalnızca telefondaki uygulamada çalışır");
  let r;try{r=await w.log()}catch(e){return toast("Kayıtlar okunamadı")}
  const items=r.items||[],st=r.state||{},issues=MedLib.wakeIssues(st,items),lines=items.map(MedLib.wakeLine).reverse();
  medWakeText=["NeoWell alarm kaydı (Android "+(r.sdk||"?")+")",...issues.map(i=>"Sorun: "+i.t),MedLib.wakeLine(st),...lines].join("\n");
  openSheet(`<h3>Alarm kayıtları</h3>
  <div class="lbl">Olası sorunlar</div>${issues.length?issues.map(i=>`<div class="row"><span class="grow sm">${esc(i.t)}</span>${i.to?`<button class="chip" data-md="wset:${i.to}:${i.id||""}">Ayarı aç</button>`:""}</div>`).join(""):`<p class="m0 mut sm">Görünür bir sorun yok.</p>`}
  <div class="lbl">Son kayıtlar (yeniden eskiye)</div><div id="wlog">${lines.length?lines.map(l=>`<div class="pv-1 sm">${esc(l)}</div>`).join(""):`<p class="m0 mut sm">Kayıt yok.</p>`}</div>
  <p class="hint">Kayıt yalnız bu telefonda tutulur, ilaç adı içermez.</p>
  <button class="btn" data-md="wcopy">Kopyala</button><button class="mt-2 btn ghost" data-md="wclear">Kayıtları temizle</button><button class="mt-2 btn ghost" data-md="close">Kapat</button>`);
}

/* ---- Today's doses (Today card and the Meds screen) ---- */
function medRows(){
  const day=dayKey(),doses=MedLib.dosesOn(S.meds,day);
  if(!doses.length)return `<p class="m0 mut sm">Bugün için ilaç yok.</p>`;
  const rec=MedLib.logIndex(S.medLog,day),now=medNowHM();
  return doses.map(({m,slot}) => {
    const r=rec(m.id,day,slot),st=r?.st;
    const late=!st&&slot<=now;
    const undo=`<button class="chip" data-md="clear:${m.id}:${slot}" aria-label="${esc(m.n)} kaydını geri al">${Icons.svg("undo")}</button>`;
    const tail=st==="t"?`<span class="b7 num">✓ ${r.at||""}</span>${undo}`
      :st==="s"?`<span class="mut">Atlandı</span>${undo}`
      :`<button class="b7 chip" data-md="take:${m.id}:${slot}">${Icons.svg("check")} Aldım</button><button class="chip" data-md="skip:${m.id}:${slot}">Atla</button>`;
    return `<div class="wrap row mdose"><span class="grow"><b>${esc(m.n)}</b><small class="db mut num">${slot}${m.d?" · "+esc(m.d):""}${late?" · Gecikti":""}</small></span><span class="mda">${tail}</span></div>`;
  }).join("");
}
/* Today's to-do: only doses whose time has come and that are neither taken nor skipped; later ones are on the Meds screen. A marked dose is undone from the toast or the Meds screen. */
function medTodo(){
  if(!S.settings.medOn)return [];
  if(!S.meds.length)return [`<div class="row"><span>${Icons.svg("meds")} Henüz ilaç eklemedin</span><button class="chip" data-md="new">${Icons.svg("plus")} Ekle</button></div>`];
  const t=dayKey(),now=medNowHM(),rec=MedLib.logIndex(S.medLog,t);
  return MedLib.dosesOn(S.meds,t).filter(({m,slot})=>slot<=now&&!rec(m.id,t,slot)).map(({m,slot})=>`<div class="row"><b class="num tm">${slot}</b><span>${esc(m.n)}<small class="mut sm">${[esc(m.d),"Gecikti"].filter(Boolean).join(" · ")}</small></span><div class="acts"><button class="b7 chip" data-md="take:${m.id}:${slot}">${Icons.svg("check")} Aldım</button><button class="chip" data-md="skip:${m.id}:${slot}">Atla</button></div></div>`);
}

/* ---- Meds screen ---- */
function medWhen(m){
  const days=m.w?m.w.map(d=>WEEKDAYS_SHORT[d]).join(", "):"her gün";
  const course=m.e?`, ${fd(m.e)} tarihine kadar`:"";
  return `${m.t.join(", ")} · ${days}${course}`;
}
function viewMeds(){
  const t=dayKey(),nowT=medNowHM(),per=MedLib.adherenceDays(S.meds,S.medLog,keyOff(-29),t,t,nowT),last7=per.slice(-7);
  const a7=MedLib.sumAdherence(last7),a30=MedLib.sumAdherence(per);
  const pct=a=>a.pct==null?"–":"%"+a.pct,cnt=a=>a.total?`${a.total} dozdan ${a.taken} alındı`:"doz yok";
  const low=S.meds.filter(m=>m.on&&MedLib.stockLeft(m)!=null&&MedLib.stockLeft(m)<=MED_LOW_STOCK).map(m=>`<div class="row"><span class="grow"><b>${esc(m.n)}</b><small class="db mut">Yaklaşık ${MedLib.stockLeft(m)} doz kaldı. Yenisini almayı unutma.</small></span></div>`).join("");
  /* One dot per day: ✓ all taken, – missed (not red), ! pending today, • some skipped; colour alone carries no meaning. */
  const days=last7.map((a,i)=>{
    const c=a.missed?["miss","–","kaçırıldı"]:a.late?["late","!","bekliyor"]:a.total&&a.taken===a.total?["ok","✓","hepsi alındı"]:a.total?["part","•","bazıları atlandı"]:["none","","doz yok"];
    const wd=WEEKDAYS_SHORT[addDays(i-6).getDay()];
    return {on:a.total||a.late,h:`<span class="dd" role="img" aria-label="${wd} ${fd(a.day)}: ${c[2]}"><i class="${c[0]}" aria-hidden="true">${c[1]}</i><small aria-hidden="true">${wd}</small></span>`};
  });
  const list=S.meds.map(m=>`<div class="row"><span class="grow"><b>${esc(m.n)}</b>${m.d?` <small class="mut">${esc(m.d)}</small>`:""}${m.on?"":` <small class="mut">(kapalı)</small>`}<div class="mut sm">${esc(medWhen(m))}${m.k!=null?` · Stok: ${medNum(m.k)} adet`:""}</div></span><button class="chip" data-md="edit:${m.id}">Düzenle</button></div>`).join("");
  return `${S.meds.length?`<div class="card"><div class="lbl">Bugün</div>${medRows()}</div>`:""}
  ${low?`<div class="card"><div class="lbl">Stok</div>${low}</div>`:""}
  ${a30.total?`<div class="card"><div class="lbl">Uyum</div><div class="stats"><div class="stat"><div class="k">Son 7 gün</div><div class="v num">${pct(a7)}</div><div class="mut sm">${cnt(a7)}</div></div><div class="stat"><div class="k">Son 30 gün</div><div class="v num">${pct(a30)}</div><div class="mut sm">${cnt(a30)}</div></div></div></div>`:""}
  ${days.some(d=>d.on)?`<div class="card"><div class="lbl">Son 7 gün</div><div class="dd7">${days.map(d=>d.h).join("")}</div></div>`:""}
  ${list?`<div class="card"><div class="lbl">İlaçlarım</div>${list}<button class="mt-3 btn" data-md="new">${Icons.svg("plus")} İlaç ekle</button></div>`:emptyCard("meds","Henüz ilaç eklemedin","İlk ilacını ekle; zamanı gelince hatırlatırız.",`<button class="btn" data-md="new">${Icons.svg("plus")} İlaç ekle</button>`)}
  <p class="hint">Uygulama doz önermez, ilaç etkileşimlerini denetlemez, tıbbi yorum yapmaz. Kayıt yalnızca senin hatırlatıcın ve günlüğündür. İlaçlarını doktorunun ve eczacının söylediği gibi kullan.</p>`;
}

/* ---- Add / edit a medication ---- */
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
  <label class="lbl" for="mn">İlaç adı</label><input class="in" id="mn" maxlength="40" value="${esc(d.n)}" autocomplete="off">
  <label class="lbl" for="md">Doz (isteğe bağlı)</label><input class="in" id="md" placeholder="örn. 1 tablet, 10 mg" maxlength="30" value="${esc(d.d)}" autocomplete="off">
  <div class="lbl">Saatler (günde en çok ${MedLib.MAXT})</div>
  ${d.t.map((v,i)=>`<div class="dl"><input class="grow in" type="time" id="mt${i}" value="${esc(v)}" aria-label="${i+1}. saat">${d.t.length>1?`<button class="del" data-md="rmtime:${i}" aria-label="${i+1}. saati kaldır">${Icons.svg("x")}</button>`:""}</div>`).join("")}
  ${d.t.length<MedLib.MAXT?`<button class="mb-3 chip" data-md="addtime">＋ Saat ekle</button>`:""}
  <div class="lbl">Günler</div><div class="chips days">${[1,2,3,4,5,6,0].map(w=>`<button class="chip" data-md="wd:${w}" aria-pressed="${d.w.includes(w)}">${WEEKDAYS_SHORT[w]}</button>`).join("")}</div>
  <label class="lbl" for="mc">Kaç gün kullanılacak? (boş bırakırsan sürekli)</label><input class="in num" id="mc" inputmode="numeric" placeholder="örn. 7" value="${esc(d.mc)}">
  <div class="lbl">Stok takibi (isteğe bağlı)</div>
  <div class="g2"><label class="labf"><span>Kutudaki adet</span><input class="in num" id="mk" inputmode="decimal" placeholder="örn. 30" value="${esc(d.k)}"></label><label class="labf"><span>Doz başına adet</span><input class="in num" id="mp" inputmode="decimal" placeholder="örn. 1" value="${esc(d.p)}"></label></div>
  ${d.id?swRow('id="mon"',d.on,"Hatırlatma açık"):""}
  <div class="ferr" id="mwarn" role="alert"></div>
  <button class="btn" data-md="save">Kaydet</button>${d.id?`<button class="mt-2 btn danger" data-md="del">Sil</button>`:""}<button class="mt-2 btn ghost" data-md="close">Vazgeç</button>`);
}
const ALL_DAYS=[0,1,2,3,4,5,6];
function medOpen(id){
  const m=id?S.meds.find(x=>x.id===id):null;
  if(!m&&S.meds.length>=MedLib.MAXM)return toast(`En çok ${MedLib.MAXM} ilaç eklenebilir`);
  medDraft=m?{id:m.id,n:m.n,d:m.d||"",t:m.t.slice(),w:m.w?m.w.slice():ALL_DAYS.slice(),on:m.on,mc:"",k:medNum(m.k),p:medNum(m.p),s:m.s,e:m.e,ts:m.ts,t0:m.t.slice()}
    :{id:0,n:"",d:"",t:["08:00"],w:ALL_DAYS.slice(),on:true,mc:"",k:"",p:"",t0:[]};
  medRender();
}
function medSave(){
  medCollect();const d=medDraft,warn=m=>{const e=document.getElementById("mwarn");if(e)e.textContent=m};
  if(!d.n.trim())return warn("İlacın adını yaz");
  const times=[...new Set(d.t.filter(timeOk))];
  if(!times.length||times.length!==d.t.filter(x=>x!=="").length)return warn("Saatleri doldur (boş ya da yinelenen saat var)");
  if(!d.w.length)return warn("En az bir gün seç");
  const k=LabLib.optNum(d.k),p=LabLib.optNum(d.p),c=LabLib.optNum(d.mc);
  if((d.k.trim()!==""&&(k==null||k<0||k>99999))||(d.p.trim()!==""&&(p==null||p<=0||p>100)))return warn("Stok ve doz başına adet sayı olmalı");
  if(d.mc.trim()!==""&&(c==null||!Number.isInteger(c)||c<1||c>365))return warn("Gün sayısı 1 ile 365 arasında bir tam sayı olmalı");
  const o={id:d.id,n:d.n.trim(),d:d.d.trim(),t:times,w:d.w.length===7?undefined:d.w.slice().sort(),on:d.on!==false};
  if(k!=null)o.k=k;if(p!=null)o.p=p;
  const today=dayKey();
  if(c!=null){o.s=today;o.e=MedLib.addDay(o.s,c-1)}else{if(d.s||!d.id)o.s=d.s||today;if(d.e)o.e=d.e}
  const ts=MedLib.sinceFor(d.t0,times,d.ts,today,medNowHM());if(ts)o.ts=ts;
  MedLib.revise(S.meds.find(m=>m.id===o.id),o,today);
  const before=S.meds.slice();
  if(!o.id)o.id=MedLib.freeId(new Set(S.meds.map(m=>m.id)));
  S.meds=MedLib.cleanMeds(S.meds.filter(m=>m.id!==o.id).concat([o]).sort((a,b)=>a.id-b.id));
  S.medLog=MedLib.cleanLog(S.medLog,S.meds);
  if(!save()){S.meds=before;return toast("Kaydedilemedi, depolama dolu")}
  medClose();render();medResched();toast("İlaç kaydedildi");
}
function medMark(mid,slot,st){
  const res=MedLib.mark(S,mid,dayKey(),slot,st,st==="t"?medNowHM():undefined);
  if(!res)return;
  if(!save()){res.undo();return toast("Kaydedilemedi, depolama dolu")}
  render();medResched();
  const m=S.meds.find(x=>x.id===mid);
  toast(st==="t"?`${m.n} alındı olarak kaydedildi`:st==="s"?`${m.n} atlandı`:"Kayıt geri alındı",()=>{res.undo();save();render();medResched()});
}

/* Taken/skipped taps from the notification buttons (quickui.js calls this). Returns the handled names. */
function medIngest(items){
  const names=[];
  for(const i of items){
    const m=S.meds.find(x=>x.id===i.m);
    if(!m||!timeOk(i.s)||!m.t.includes(i.s))continue;
    const day=MedLib.dayForTap(i.s,i.t);
    if(MedLib.statusOf(S.medLog,m.id,day,i.s))continue;
    if(MedLib.mark(S,m.id,day,i.s,i.k?"s":"t",MedLib.hm(new Date(i.t))))names.push(`${m.n} (${i.s})`);
  }
  return {n:names.length,names};
}

document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-md]");if(!el)return;
  const [a,...r]=el.dataset.md.split(":");
  if(a==="toggle")medToggle();
  else if(a==="locktest"){const w=MW();if(!w)return toast("Yalnızca telefondaki uygulamada çalışır");w.test().then(()=>toast("15 saniye sonra alarm çalacak: telefonu kilitle")).catch(()=>toast("Test kurulamadı"))}
  else if(a==="realtest")medRealTest();
  else if(a==="wakelog")medWakeLog();
  else if(a==="wset"){if(r[0]==="autostart")openDH("openAutostart");else MW()?.settings({to:r[0],id:r[1]}).catch(()=>toast("Ayar ekranı açılamadı"))}
  else if(a==="wcopy")(navigator.clipboard?navigator.clipboard.writeText(medWakeText):Promise.reject()).then(()=>toast("Kayıt panoya kopyalandı"),()=>{const s=getSelection(),g=document.createRange(),b=document.getElementById("wlog");if(b){g.selectNodeContents(b);s.removeAllRanges();s.addRange(g)}toast("Kopyalanamadı: metni seçtim, uzun basıp kopyala")});
  else if(a==="wclear")MW()?.clearLog().then(medWakeLog,()=>toast("Temizlenemedi"));
  else if(a==="shown"){S.settings.medShowName=el.checked;save();medResched()}
  else if(a==="new")medOpen(0);
  else if(a==="edit")medOpen(+r[0]);
  else if(a==="close")medClose();
  else if(a==="save")medSave();
  else if(a==="del"){
    const id=medDraft?.id,m=S.meds.find(x=>x.id===id);if(!m)return;
    confirmSheet({title:`${m.n} silinsin mi?`,body:`${m.n} silinecek. İlacın kayıtları da silinir. Devam edilsin mi?`,ok:"Sil",danger:true}).then(ok=>{
      if(!ok)return;
      const dl=S.medLog.filter(x=>x.m===id);
      S.meds=S.meds.filter(x=>x.id!==id);S.medLog=MedLib.cleanLog(S.medLog,S.meds);save();
      medClose();render();medResched();
      toast("İlaç silindi",()=>{
        if(S.meds.some(x=>x.id===id))return toast("Geri alınamadı: bu numarayı yeni bir ilaç aldı");
        S.meds=MedLib.cleanMeds(S.meds.concat([m]).sort((a,b)=>a.id-b.id));S.medLog=MedLib.cleanLog(S.medLog.concat(dl),S.meds);save();render();medResched();
      });
    });
  }
  else if(a==="addtime"){medCollect();if(medDraft.t.length<MedLib.MAXT){medDraft.t.push("");medRender()}}
  else if(a==="rmtime"){medCollect();medDraft.t.splice(+r[0],1);medRender()}
  else if(a==="wd"){const w=+r[0],i=medDraft.w.indexOf(w);if(i>=0)medDraft.w.splice(i,1);else medDraft.w.push(w);el.setAttribute("aria-pressed",String(i<0))}
  else if(a==="take")medMark(+r[0],r[1]+":"+r[2],"t");
  else if(a==="skip")medMark(+r[0],r[1]+":"+r[2],"s");
  else if(a==="clear")medMark(+r[0],r[1]+":"+r[2],null);
});
