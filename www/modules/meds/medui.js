"use strict";
/* Medication reminder screens. It gives no dose advice and checks no interactions: it only reminds the user's own schedule and records taken/skipped. */
let medDraft=null;
const medNowHM=()=>MedLib.hm(new Date());
const medResched=()=>scheduleReminders().then(setNotif);
const medNum=x=>x==null?"":String(x).replace(".",",");
const medClose=()=>{closeSheet();medDraft=null};
const MED_FED=MedLib.FED_TEXT;
const MED_BACK=90;
let medDay="";
const medViewDay=()=>medDay&&medDay<calKey()?medDay:calKey();

/* ---- Settings ---- */
function medSettingsHtml(){
  const st=S.settings;
  return modRow('data-md="toggle"',st.medOn,"İlaç hatırlatıcı","Saati gelince bildirim, tek dokunuşla kayıt.","hlpmd",`İlaçlarını ve saatlerini gir, zamanı gelince bildirim al. Bildirimdeki "Aldım" düğmesiyle uygulamayı açmadan kaydet. Uygulama doz önermez ve ilaç etkileşimlerini denetlemez: doktorunun ve eczacının söylediği gibi kullan.`,
    `${swRow('data-md="shown"',st.medShowName,"İlaç adı bildirimde görünsün (kilit ekranında da)")}<button class="btn ghost" data-md="near">${Icons.svg("heart")} ${st.medNear?"Yakınım: "+esc(st.medNear)+" · değiştir":"Yakınıma haber ver: numara ekle"}</button><button class="btn ghost" data-tab="meds">${Icons.svg("meds")} İlaçlarımı düzenle</button>${isNative()?`<details class="acc mt-2"><summary>Bildirim sorun giderme</summary><p class="m0 hint">Kilitli ekran testinde düğmeye bas, telefonu kilitle ve ekranı kapat. 15 saniye sonra ekran yanıp ilaç ekranı açılmalı. Açılmazsa telefon ayarlarından uygulamaya kilit ekranında gösterme ve tam ekran bildirim izni ver.</p><div class="btns"><button class="btn ghost" data-md="locktest">Kilitli ekran testi</button><button class="btn ghost" data-md="realtest">Gerçek doz testi (1 dk)</button><button class="btn ghost" data-md="wakelog">Alarm kayıtları</button></div></details>`:""}`);
}
/* "Yakınıma haber ver": the messaging app opens with the number and a short text (no medicine name); the person presses send. The number stays on the phone. */
const MED_NEAR_TEXT="Merhaba, ilaç saatimi kaçırmış olabilirim. Müsait olunca beni arar mısın?";
function medNearSheet(){
  const v=S.settings.medNear;
  openSheet(`<h3>Yakınıma haber ver</h3><p class="mut sm">Geciken bir dozda Bugün'de "Yakınıma haber ver" düğmesi çıkar. Mesaj uygulaması numara ve kısa bir metinle açılır, göndermek sana kalır. Mesajda ilaç adı yazmaz. Numara yalnız bu telefonda durur.</p>
  <input class="in" id="mdnear" type="tel" inputmode="tel" placeholder="Örn. +905551112233" aria-label="Yakınının telefon numarası" value="${esc(v)}"><div id="mdnearerr" class="mut sm"></div>
  <div class="btns"><button class="btn" data-md="nearsave">Kaydet</button>${v?'<button class="btn ghost" data-md="nearclear">Numarayı sil</button>':""}<button class="btn ghost" data-md="nearclose">Vazgeç</button></div>`);
}
function medNearSave(){
  const v=$("#mdnear").value.replace(/[\s()-]/g,"");
  if(!/^\+?\d{7,15}$/.test(v)){$("#mdnearerr").textContent="Numara 7-15 rakam olmalı, başında + olabilir.";return}
  S.settings.medNear=v;save();closeSheet();render();toast("Kaydedildi");
}
function medNearSend(){
  const p=DH();if(!p||!p.sms)return toast("Mesaj yalnızca telefondaki uygulamada açılır");
  p.sms({to:S.settings.medNear,body:MED_NEAR_TEXT}).then(r=>{if(r.opened==="none")toast("Mesaj uygulaması açılamadı")},()=>toast("Mesaj uygulaması açılamadı"));
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
    await lnSchedule(ln,[{id:MED_TEST_NID,title:MedLib.TITLE,body:"Test",schedule:{at:new Date(at),allowWhileIdle:true},channelId:"nw_med",ongoing:true,autoCancel:true}]);
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
function medRows(day=calKey()){
  const isToday=day===calKey(),doses=MedLib.dosesOn(S.meds,day);
  if(!doses.length)return `<p class="m0 mut sm">${isToday?"Bugün":fd(day)} için ilaç yok.</p>`;
  const rec=MedLib.logIndex(S.medLog,day),now=medNowHM(),sfx=isToday?"":":"+day;
  return doses.map(({m,slot}) => {
    const r=rec(m.id,day,slot),st=r?.st,tag=`${m.id}:${slot}`;
    const late=!st&&(!isToday||slot<=now);
    const undo=`<button class="chip" data-md="clear:${tag}${sfx}" aria-label="${esc(m.n)} kaydını geri al">${Icons.svg("undo")} Geri al</button>`;
    const tail=st==="t"?`<button class="chip num" data-md="at:${tag}:${day}" aria-label="${esc(m.n)} alınan saati düzenle">✓ ${r.at||"saat ekle"}</button>${undo}`
      :st==="s"?`<span class="mut">Atlandı</span><button class="b7 chip" data-md="take:${tag}${sfx}" aria-label="${isToday?"Şimdi aldım":"Aldım"}: ${esc(m.n)}">${isToday?"Şimdi aldım":"Aldım"}</button>${undo}`
      :`<button class="chip go" data-md="take:${tag}${sfx}" aria-label="Aldım: ${esc(m.n)}">${Icons.svg("check")} Aldım</button><button class="chip skip" data-md="skip:${tag}${sfx}" aria-label="Atla: ${esc(m.n)}">Atla</button>`;
    const sub=[slot,MedLib.doseText(m,slot,day)&&esc(MedLib.doseText(m,slot,day)),MED_FED[m.fed],late&&(isToday?"Gecikti":"Kaçırıldı")].filter(Boolean).join(" · ");
    return `<div class="wrap row mdose"><span class="grow"><b>${esc(m.n)}</b><small class="db mut num">${sub}</small></span><span class="mda">${tail}</span></div>`;
  }).join("");
}
/* One line for the Today card: how many of today's doses are marked and when the next one is due. */
function medInfo(){
  if(!S.settings.medOn||!S.meds.length)return "";
  const t=calKey(),now=medNowHM(),ds=MedLib.dosesOn(S.meds,t);
  if(!ds.length)return "";
  const st=ds.map(({m,slot})=>MedLib.statusOf(S.medLog,m.id,t,slot)),taken=st.filter(x=>x==="t").length,skipped=st.filter(x=>x==="s").length;
  const next=ds.filter((d,i)=>!st[i]&&d.slot>now).map(d=>d.slot).sort()[0];
  return `İlaç: bugün ${taken}/${ds.length} alındı${skipped?`, ${skipped} atlandı`:""}${next?`, sıradaki ${next}`:""}`;
}
/* Today's to-do: only doses whose time has come and that are neither taken nor skipped, and yesterday's unmarked doses ("Dün kaçırıldı", marked with that day); later ones are on the Meds screen. A marked dose is undone from the toast or the Meds screen. */
function medTodo(){
  if(!S.settings.medOn)return [];
  if(!S.meds.length)return S.settings.medNudgeOff?[]:[`<div class="row"><span>${Icons.svg("meds")} Henüz ilaç eklenmemiş</span><div class="acts"><button class="chip" data-md="new">${Icons.svg("plus")} Ekle</button><button class="chip" data-act="mednono">Şimdi değil</button></div></div>`];
  const t=calKey(),now=medNowHM(),y=MedLib.addDay(t,-1),rec=MedLib.logIndex(S.medLog,y);
  const ram=medRamTodo(),paused=S.meds.filter(m=>!m.on&&m.ou&&m.ou<=t).map(m=>`<div class="row"><span class="grow">${esc(m.n)}<small class="db mut sm">Ara verme süresi doldu</small></span><button class="b7 chip" data-md="resume:${m.id}" aria-label="Tekrar aç: ${esc(m.n)}">Tekrar aç</button></div>`);
  let near=0;
  const mins=hm=>+hm.slice(0,2)*60+ +hm.slice(3,5),night=S.settings.dayStart>0&&new Date().getHours()<S.settings.dayStart; // before the day start, last evening's unmarked dose is still "late", not "yesterday's"
  const grpN=new Map(),grpDone=new Set(),all=(day,slot)=>day===t&&(grpN.get(slot)||0)>1&&!grpDone.has(slot)&&grpDone.add(slot)?`<button class="chip" data-md="takeall:${slot}" aria-label="Hepsini aldım: ${slot}, ${grpN.get(slot)} ilaç">Hepsini aldım</button>`:"";
  const row=(day,{m,slot},tag,sfx)=>`<div class="row"><span>${Icons.svg("meds")} <b class="num tm">${slot}</b> ${esc(m.n)}<small class="mut sm">${[esc(MedLib.doseText(m,slot,day)),MED_FED[m.fed],tag].filter(Boolean).join(" · ")}</small></span><div class="acts"><button class="chip go" data-md="take:${m.id}:${slot}${sfx}" aria-label="Aldım: ${esc(m.n)}, ${slot}${day===t?"":", dün"}">${Icons.svg("check")} Aldım</button><button class="chip skip" data-md="skip:${m.id}:${slot}${sfx}" aria-label="Atla: ${esc(m.n)}, ${slot}${day===t?"":", dün"}">Atla</button>${all(day,slot)}${day===t&&S.settings.medNear&&tag==="Gecikti"&&!near++?`<button class="chip" data-md="nearsend">Yakınıma haber ver</button>`:""}</div></div>`;
  /* Doses of the same minute: the first row offers one button for all of them (the others stay one by one, nothing is marked unseen). */
  for(const {m,slot} of MedLib.dosesOn(S.meds,t))if(mins(slot)<=mins(now)+30&&!rec(m.id,t,slot))grpN.set(slot,(grpN.get(slot)||0)+1);
  return ram.concat(paused)
    .concat(MedLib.dosesOn(S.meds,y).filter(({m,slot})=>!rec(m.id,y,slot)).map(x=>row(y,x,night?"Gecikti":"Dün kaçırıldı",":"+y)))
    .concat(MedLib.dosesOn(S.meds,t).filter(({m,slot})=>mins(slot)<=mins(now)+30&&!rec(m.id,t,slot)).map(x=>row(t,x,mins(x.slot)>mins(now)?"Yaklaşıyor":mins(now)-mins(x.slot)<30?"Saati geldi":"Gecikti","")));
}

/* ---- Ramadan: moving the times inside the daytime fast ---- */
/* Only on the user's approval; settings.ramMeds keeps {medId: {from: to}} so each medication goes back to its old times alone. */
const medRamDone=m=>{const r=S.settings.ramMeds[m.id];return r&&Object.values(r).some(t=>m.t.includes(t))?r:null};
/* Still shifted from an earlier Ramadan: the mode was opened again (which forgets the anchors) and the shift was never taken back or recalculated. */
const medRamStale=m=>S.settings.ramOn&&medRamDone(m)&&!S.settings.ramMedsRef[m.id];
function medRamPlan(){
  const st=S.settings,d=st.ramMedsNo?null:Habits.dayTimes(calKey());
  return d?S.meds.filter(m=>m.on&&!medRamDone(m)).map(m=>{const map=RamadanLib.medMap(m.t,d);return {m,map,left:m.t.filter(t=>RamadanLib.inFast(t,d)&&!map[t]),im:d[0]}}).filter(x=>Object.keys(x.map).length||x.left.length):[];
}
/* Minutes the imsak has moved since the times were shifted; the shift is anchored to that day's imsak. */
function medRamDrift(m){
  const ref=S.settings.ramMedsRef[m.id],d=S.settings.ramOn&&medRamDone(m)&&Habits.dayTimes(calKey());
  return ref&&d?RamadanLib.mins(d[0])-RamadanLib.mins(ref):0;
}
const RAM_DRIFT=15;
const medRamBack=()=>S.settings.ramOn?[]:S.meds.filter(medRamDone);
const medRamPair=map=>Object.entries(map).map(([a,b])=>`${a} → ${b}`).join(", ");
function medRamTodo(){
  const k=medRamPlan().filter(x=>Object.keys(x.map).length).length,b=medRamBack().length,old=S.meds.some(medRamStale);
  const t=b?"Ramazan bitti; ilaç saatlerini eski saatlerine döndürelim mi?":old?"Geçen Ramazan'dan kalan kaydırılmış ilaç saatlerin var; eski saatlerine dönelim mi?":k?"İlaç saatlerini sahur ya da iftara kaydırmak ister misin?":"";
  return t?[`<div class="row"><span>${Icons.svg("meds")} ${t}<small class="mut sm">Sen onaylamadan hiçbir saat değişmez.</small></span><button class="chip" data-tab="meds">İncele</button></div>`]:[];
}
function medRamCard(){
  const plan=medRamPlan(),back=S.settings.ramOn?S.meds.filter(medRamDone):medRamBack();
  const fresh=m=>medRamStale(m)?" Geçen Ramazan'dan kalmış; bugünün imsağına göre yeniden hesaplayabilir ya da eski saatlere dönebilirsin.":"";
  if(!plan.length&&!back.length)return "";
  const row=(m,t,btn)=>`<div class="row"><span class="grow"><b>${esc(m.n)}</b><small class="db mut num">${t}</small></span>${btn}</div>`;
  return `<div class="card"><div class="lbl">${S.settings.ramOn?"Ramazan ve ilaç saatleri":"Ramazan bitti"}</div>
  ${plan.map(({m,map,left})=>row(m,(Object.keys(map).length?medRamPair(map):"")+(left.length?`${Object.keys(map).length?". ":""}${left.join(", ")} için boş saat bulunamadı, o doz kaydırılmadı; hekimine danış`:""),Object.keys(map).length?`<button class="chip" data-md="ramgo:${m.id}" aria-label="Kaydır: ${esc(m.n)}">Kaydır</button>`:"")).join("")}
  ${back.map(m=>{const dr=medRamDrift(m),old=medRamStale(m),late=Math.abs(dr)>=RAM_DRIFT;return row(m,"Kaydırıldı: "+medRamPair(S.settings.ramMeds[m.id])+(old?"."+fresh(m):"")+(late?`. İmsak kaydırdığından beri yaklaşık ${Math.abs(dr)} dk ${dr<0?"öne geldi":"geriye gitti"}; saatler eski imsağa göre`:""),`${late||old?`<button class="chip" data-md="ramredo:${m.id}" aria-label="Yeniden hesapla: ${esc(m.n)}">Yeniden hesapla</button>`:""}<button class="chip" data-md="ramback:${m.id}" aria-label="Eski saatlere dön: ${esc(m.n)}">Eski saatlere dön</button>`)}).join("")}
  <p class="hint">İlaç saatlerini hekimine sormadan değiştirme. Kaydırma yalnız senin onayınla yapılır; her ilaç ayrı geri alınır.${plan.length?` <button class="lnk" data-md="ramno">Gerek yok</button>`:""}</p></div>`;
}
/* Moves a medication's times by {from: to}: the same revise/since bookkeeping as an edit, so past days keep the old schedule. */
function medRetime(m,map,undo){
  const today=calKey(),t=[...new Set(m.t.map(x=>map[x]||x))].sort(),q={};
  for(const [x,v] of Object.entries(m.q||{}))q[map[x]||x]??=v;
  const log=S.medLog,o={...m,t,q};
  if(!Object.keys(q).length)delete o.q;
  const ts=MedLib.sinceFor(m.t,t,m.ts,today,medNowHM());
  const taken=new Set(log.filter(r=>r.m===m.id&&r.day===today&&map[r.slot]).map(r=>map[r.slot]));
  delete o.ts;if(ts||taken.size)o.ts={...ts,...Object.fromEntries([...taken].map(s=>[s,today]))};
  MedLib.revise(m,o,today);
  const before=S.meds.slice();
  S.meds=MedLib.cleanMeds(S.meds.map(x=>x.id===m.id?o:x));
  S.medLog=MedLib.cleanLog(log.map(r=>r.m===m.id&&r.day===today&&map[r.slot]?{...r,slot:map[r.slot]}:r),S.meds);
  return commit(()=>{S.meds=before;S.medLog=log;undo()});
}
function medRamGo(id){
  const p=medRamPlan().find(x=>x.m.id===id);if(!p)return;
  confirmSheet({title:`${p.m.n} saatleri kaydırılsın mı?`,body:`${medRamPair(p.map)}. İlaç saatini hekimine danışmadan değiştirme; danıştıysan kaydır. İstediğin zaman eski saatlere dönebilirsin.`,ok:"Kaydır"}).then(ok=>{
    const m=S.meds.find(x=>x.id===id);if(!ok||!m)return;
    const prev=S.settings.ramMeds,prevRef=S.settings.ramMedsRef;
    S.settings.ramMeds={...prev,[id]:p.map};S.settings.ramMedsRef={...prevRef,[id]:p.im};
    if(!medRetime(m,p.map,()=>{S.settings.ramMeds=prev;S.settings.ramMedsRef=prevRef}))return;
    render();medResched();toast(`${m.n}: saatler kaydırıldı`,()=>medRamUndo(id));
  });
}
function medRamUndo(id){
  const m=S.meds.find(x=>x.id===id),rec=S.settings.ramMeds[id];if(!m||!rec)return;
  const inv=Object.fromEntries(Object.entries(rec).filter(([,b])=>m.t.includes(b)).map(([a,b])=>[b,a]));
  const prev=S.settings.ramMeds,{[id]:_,...rest}=prev,prevRef=S.settings.ramMedsRef,{[id]:__,...restRef}=prevRef;
  S.settings.ramMeds=rest;S.settings.ramMedsRef=restRef;
  if(Object.keys(inv).length&&!medRetime(m,inv,()=>{S.settings.ramMeds=prev;S.settings.ramMedsRef=prevRef}))return;
  if(!Object.keys(inv).length)save();
  const n=Object.keys(rec).length,k=Object.keys(inv).length;
  render();medResched();toast(k===n?`${m.n}: eski saatlere döndü`:k?`${m.n}: ${k} saat eski yerine döndü, ${n-k} saat sen değiştirdiğin için aynı kaldı`:`${m.n}: saatleri sen değiştirdiğin için eski saatlere dönülecek bir şey kalmadı`);
}

/* Moves the shifted times to today's imsak and iftar in one step: current time -> its original -> its new target. */
function medRamRedo(id){
  const m=S.meds.find(x=>x.id===id),rec=S.settings.ramMeds[id],d=Habits.dayTimes(calKey());if(!m||!rec||!d)return;
  const inv=Object.fromEntries(Object.entries(rec).map(([a,b])=>[b,a])),orig=m.t.map(x=>inv[x]||x),map=RamadanLib.medMap(orig,d);
  const total=Object.fromEntries(m.t.map((c,i)=>[c,map[orig[i]]||orig[i]]));
  if(!Object.keys(map).length)return medRamUndo(id);
  const prev=S.settings.ramMeds,prevRef=S.settings.ramMedsRef;
  S.settings.ramMeds={...prev,[id]:map};S.settings.ramMedsRef={...prevRef,[id]:d[0]};
  if(!medRetime(m,total,()=>{S.settings.ramMeds=prev;S.settings.ramMedsRef=prevRef}))return;
  render();medResched();toast(`${m.n}: saatler bugünün imsağına göre yeniden hesaplandı`,()=>medRamUndo(id));
}

/* ---- Meds screen ---- */
function medWhen(m){
  const days=m.iv?`her ${m.iv} günde bir`:m.w?m.w.map(d=>WEEKDAYS_SHORT[d]).join(", "):"her gün";
  const course=m.e?`, ${fd(m.e)} tarihine kadar`:"";
  return `${m.t.join(", ")} · ${days}${course}${m.fed?" · "+MED_FED[m.fed].toLowerCase():""}${!m.on&&m.ou?`, ${fd(m.ou)} tarihine kadar ara`:""}`;
}
function viewMeds(){
  const t=calKey(),nowT=medNowHM(),per=MedLib.adherenceDays(S.meds,S.medLog,calOff(-29),t,t,nowT),last7=per.slice(-7);
  const a7=MedLib.sumAdherence(last7),a30=MedLib.sumAdherence(per);
  const pct=a=>a.pct==null?"–":"%"+a.pct,cnt=a=>a.total?`${a.total} dozdan ${a.taken} alındı`:"doz yok";
  const low=S.meds.filter(MedLib.stockLow).map(m=>`<div class="row"><span class="grow"><b>${esc(m.n)}</b><small class="db mut">Yaklaşık ${MedLib.stockDays(m)} günlük stok kaldı, tahmini bitiş ${fd(MedLib.addDay(t,MedLib.stockDays(m)))}. Yenisini almayı unutma.</small></span>${m.kb?`<button class="chip" data-md="boxadd:${m.id}" aria-label="Kutu ekle: ${esc(m.n)}">＋ Kutu ekle</button>`:""}</div>`).join("");
  const day=medViewDay(),isT=day===t;
  /* One dot per day: ✓ all taken, – missed (not red), ! pending today, • some skipped; colour alone carries no meaning. */
  const days=last7.map((a,i)=>{
    const c=a.missed?["miss","–","kaçırıldı"]:a.late?["late","!","bekliyor"]:a.total&&a.taken===a.total?["ok","✓","hepsi alındı"]:a.total?["part","•","bazıları atlandı"]:["none","","doz yok"];
    const wd=WEEKDAYS_SHORT[addDays(i-6,new Date()).getDay()];
    return {on:a.total||a.late,h:`<span class="dd" role="img" aria-label="${wd} ${fd(a.day)}: ${c[2]}"><i class="${c[0]}" aria-hidden="true">${c[1]}</i><small aria-hidden="true">${wd}</small></span>`};
  });
  const list=S.meds.map(m=>`<div class="row"><span class="grow"><b>${esc(m.n)}</b>${m.d?` <small class="mut">${esc(m.d)}</small>`:""}${m.on?"":` <small class="mut">(kapalı)</small>`}<div class="mut sm">${esc(medWhen(m))}${m.k!=null?` · Stok: ${medNum(m.k)} adet${MedLib.stockDays(m)!=null?`, yaklaşık ${MedLib.stockDays(m)} gün`:""}`:""}</div></span><button class="chip" data-md="edit:${m.id}" aria-label="Düzenle: ${esc(m.n)}">Düzenle</button></div>`).join("");
  return `${S.meds.length?`<div class="card"><div class="lbl">Dozlar</div><div class="row"><button class="chip" data-md="dprev" aria-label="Önceki gün">‹</button><span class="grow tc">${isT?"Bugün":WEEKDAYS_SHORT[new Date(day+"T12:00").getDay()]+" "+fd(day)}</span>${isT?"":`<button class="chip" data-md="dtoday">Bugün</button>`}<button class="chip" data-md="dnext" aria-label="Sonraki gün"${isT?" disabled":""}>›</button></div>${medRows(day)}</div>`:""}
  ${medRamCard()}
  ${low?`<div class="card"><div class="lbl">Stok</div>${low}</div>`:""}
  ${a30.total?`<div class="card"><div class="lbl">Uyum</div><div class="stats"><div class="stat"><div class="k">Son 7 gün</div><div class="v num">${pct(a7)}</div><div class="mut sm">${cnt(a7)}</div></div><div class="stat"><div class="k">Son 30 gün</div><div class="v num">${pct(a30)}</div><div class="mut sm">${cnt(a30)}</div></div></div></div>`:""}
  ${days.some(d=>d.on)?`<div class="card"><div class="lbl">Son 7 gün</div><div class="dd7">${days.map(d=>d.h).join("")}</div></div>`:""}
  ${list?`<div class="card"><div class="lbl">İlaçlarım</div>${list}<button class="mt-3 btn" data-md="new">${Icons.svg("plus")} İlaç ekle</button></div>`:emptyCard("meds","Henüz ilaç eklenmemiş","İlk ilacını ekle; zamanı gelince hatırlatırız.",`<button class="btn" data-md="new">${Icons.svg("plus")} İlaç ekle</button>`)}
  <p class="hint">Uygulama doz önermez, ilaç etkileşimlerini denetlemez, tıbbi yorum yapmaz. Kayıt yalnızca senin hatırlatıcın ve günlüğündür. İlaçlarını doktorunun ve eczacının söylediği gibi kullan.</p>`;
}

/* ---- Add / edit a medication ---- */
function medCollect(){
  if(!medDraft)return;
  const g=id=>{const e=document.getElementById(id);return e?e.value:""};
  const d=medDraft;
  d.n=g("mn");d.d=g("md");d.mc=g("mc");d.k=g("mk");d.p=g("mp");d.iv=g("miv");d.sd=g("msd");d.kb=g("mkb");
  if(d.id)d.ou=g("mou");
  d.t=d.t.map((_,i)=>g("mt"+i));
  d.q=d.q.map((_,i)=>({d:g("mq"+i),p:g("mpa"+i)}));
  if(d.id)d.e=g("me");
  for(const [k,id] of [["on","mon"],["bp","mbp"],["sh","mshow"]]){const e=document.getElementById(id);if(e)d[k]=e.checked}
}
function medRender(){
  const d=medDraft;
  openSheet(`<h3>${d.id?"İlacı düzenle":"İlaç ekle"}</h3>
  <label class="lbl" for="mn">İlaç adı</label><input class="in" id="mn" maxlength="${MedLib.NAME_MAX}" value="${esc(d.n)}" autocomplete="off">
  ${swRow('id="mshow"',!!d.sh,"Bildirimde ve kilit ekranında ilaç adı görünsün (kapalıyken yalnız “İlaç saatin geldi” yazar)")}
  <label class="lbl" for="md">Doz (isteğe bağlı)</label><input class="in" id="md" placeholder="örn. 1 tablet, 10 mg" maxlength="30" value="${esc(d.d)}" autocomplete="off">
  <div class="lbl">Saatler (günde en çok ${MedLib.MAXT}); her saatin kendi dozu ve adedi olabilir</div>
  ${d.t.map((v,i)=>`<div class="dl"><input class="grow in" type="time" id="mt${i}" value="${esc(v)}" aria-label="${i+1}. saat">${d.t.length>1?`<button class="del" data-md="rmtime:${i}" aria-label="${i+1}. saati kaldır">${Icons.svg("x")}</button>`:""}</div>
  <div class="g2"><input class="in" id="mq${i}" maxlength="30" placeholder="${esc(d.d||"Bu saatin dozu")}" value="${esc(d.q[i].d)}" aria-label="${i+1}. saatin dozu" autocomplete="off"><input class="in num" id="mpa${i}" inputmode="decimal" placeholder="Adet" value="${esc(d.q[i].p)}" aria-label="${i+1}. saatin adedi"></div>`).join("")}
  ${d.t.length<MedLib.MAXT?`<button class="mb-3 chip" data-md="addtime">＋ Saat ekle</button>`:""}
  <div class="lbl">Günler</div><div class="chips days">${[1,2,3,4,5,6,0].map(w=>`<button class="chip" data-md="wd:${w}" aria-pressed="${d.w.includes(w)}">${WEEKDAYS_SHORT[w]}</button>`).join("")}</div>
  <label class="lbl" for="miv">Her kaç günde bir? (isteğe bağlı; yazarsan günler yok sayılır, bugünden sayılır)</label><input class="in num" id="miv" inputmode="numeric" placeholder="örn. 2" value="${esc(d.iv)}">
  <div class="lbl" id="mfedl">Yemekle ilişkisi (isteğe bağlı)</div><div class="chips" role="group" aria-labelledby="mfedl">${MedLib.FED.map(k=>`<button class="chip" data-md="fed:${k}" aria-pressed="${d.fed===k}">${MED_FED[k]}</button>`).join("")}</div>
  <label class="lbl" for="mc">Kaç gün kullanılacak? (boş bırakırsan sürekli)</label><input class="in num" id="mc" inputmode="numeric" placeholder="örn. 7" value="${esc(d.mc)}">
  ${d.id?`<label class="lbl" for="me">Kullanım bitiş günü (boş bırakırsan sürekli)</label><input class="in" type="date" id="me" value="${esc(d.e||"")}">`:""}
  <div class="lbl">Stok takibi (isteğe bağlı)</div>
  <div class="g2"><label class="labf"><span>Kutudaki adet</span><input class="in num" id="mk" inputmode="decimal" placeholder="örn. 30" value="${esc(d.k)}"></label><label class="labf"><span>Doz başına adet</span><input class="in num" id="mp" inputmode="decimal" placeholder="örn. 1" value="${esc(d.p)}"></label></div>
  <div class="g2"><label class="labf"><span>Kutu başına adet</span><input class="in num" id="mkb" inputmode="decimal" placeholder="örn. 30" value="${esc(d.kb)}"></label><label class="labf"><span>Uyarı: kalan gün (varsayılan ${MedLib.STOCK_DAYS})</span><input class="in num" id="msd" inputmode="numeric" placeholder="${MedLib.STOCK_DAYS}" value="${esc(d.sd)}"></label></div>
  <button class="mb-3 chip" data-md="box">＋ Kutu ekle</button>
  ${swRow('id="mbp"',!!d.bp,"Tansiyon ilacı (ölçüm listesinde ve raporunda kayıtlı dozdan beri geçen süre görünsün)")}
  ${d.id?`${swRow('id="mon"',d.on,"Hatırlatma açık")}<label class="lbl" for="mou">Ara verdiysen: tekrar hatırlatılacağı gün (isteğe bağlı)</label><input class="in" type="date" id="mou" value="${esc(d.ou)}" min="${calKey()}">`:""}
  <div class="ferr" id="mwarn" role="alert"></div>
  <button class="btn" data-md="save">Kaydet</button>${d.id?`<button class="mt-2 btn ghost" data-md="dup">Aynı ilaçtan bir tane daha</button><button class="mt-2 btn danger" data-md="del">Sil</button>`:""}<button class="mt-2 btn ghost" data-md="close">Vazgeç</button>`);
}
const ALL_DAYS=[0,1,2,3,4,5,6];
function medOpen(id){
  const m=id?S.meds.find(x=>x.id===id):null;
  if(!m&&S.meds.length>=MedLib.MAXM)return toast(`En çok ${MedLib.MAXM} ilaç eklenebilir`);
  const sh=S.settings.medShowName===true;
  medDraft=m?{id:m.id,n:m.n,d:m.d||"",t:m.t.slice(),q:m.t.map(s=>({d:m.q?.[s]?.d||"",p:medNum(m.q?.[s]?.p)})),w:m.w?m.w.slice():ALL_DAYS.slice(),on:m.on,mc:"",k:medNum(m.k),p:medNum(m.p),s:m.s,e:m.e,e0:m.e,ts:m.ts,bp:!!m.bp,t0:m.t.slice(),iv:m.iv?String(m.iv):"",iv0:m.iv?String(m.iv):"",ia:m.ia,fed:m.fed||"",sd:m.sd?String(m.sd):"",kb:medNum(m.kb),ou:m.ou||"",sh}
    :{id:0,n:"",d:"",t:["08:00"],q:[{d:"",p:""}],w:ALL_DAYS.slice(),on:true,mc:"",k:"",p:"",t0:[],iv:"",iv0:"",fed:"",sd:"",kb:"",ou:"",sh};
  medRender();
}
function medSave(){
  medCollect();const d=medDraft,warn=m=>{const e=document.getElementById("mwarn");if(e)e.textContent=m};
  if(!d.n.trim())return warn("İlacın adını yaz");
  const times=[...new Set(d.t.filter(timeOk))];
  if(!times.length||times.length!==d.t.filter(x=>x!=="").length)return warn("Saatleri doldur (boş ya da yinelenen saat var)");
  if(!d.w.length)return warn("En az bir gün seç");
  const k=LabLib.optNum(d.k),p=LabLib.optNum(d.p),c=LabLib.optNum(d.mc),iv=LabLib.optNum(d.iv),sd=LabLib.optNum(d.sd),kb=LabLib.optNum(d.kb);
  if((d.k.trim()!==""&&(k==null||k<0||k>99999))||(d.p.trim()!==""&&(p==null||p<=0||p>100))||(d.kb.trim()!==""&&(kb==null||kb<=0||kb>99999)))return warn("Stok, kutu ve doz başına adet sayı olmalı");
  if(d.mc.trim()!==""&&(c==null||!Number.isInteger(c)||c<1||c>365))return warn("Gün sayısı 1 ile 365 arasında bir tam sayı olmalı");
  if(d.iv.trim()!==""&&(iv==null||!Number.isInteger(iv)||iv<2||iv>60))return warn("Aralık 2 ile 60 arasında bir tam sayı olmalı");
  if(d.sd.trim()!==""&&(sd==null||!Number.isInteger(sd)||sd<1||sd>90))return warn("Stok uyarısı 1 ile 90 arasında bir gün sayısı olmalı");
  const today=calKey(),q={};
  for(let i=0;i<d.t.length;i++){
    const a=d.q[i],pa=LabLib.optNum(a.p);
    if(a.p.trim()!==""&&(pa==null||pa<=0||pa>100))return warn("Saat başına adet 0'dan büyük bir sayı olmalı");
    if(timeOk(d.t[i])&&(a.d.trim()||pa!=null))q[d.t[i]]={...(a.d.trim()&&{d:a.d.trim()}),...(pa!=null&&{p:pa})};
  }
  if(!d.on&&d.ou&&d.ou<=today)return warn("Tekrar hatırlatma günü bugünden sonra olmalı");
  if(d.e&&d.e!==d.e0&&d.e<today)return warn("Bitiş günü bugünden önce olamaz");
  const o={id:d.id,n:d.n.trim(),d:d.d.trim(),t:times,q,w:d.w.length===7||iv?undefined:d.w.slice().sort(),on:d.on!==false,...(d.bp?{bp:true}:{}),...(d.fed?{fed:d.fed}:{}),...(sd?{sd}:{}),...(kb?{kb}:{}),...(!d.on&&d.ou?{ou:d.ou}:{})};
  if(iv){o.iv=iv;o.ia=d.ia&&d.iv===d.iv0?d.ia:today}
  if(k!=null)o.k=k;if(p!=null)o.p=p;
  if(c!=null){o.s=today;o.e=MedLib.addDay(o.s,c-1)}else{if(d.s||!d.id)o.s=d.s||today;if(d.e)o.e=d.e}
  const ts=MedLib.sinceFor(d.t0,times,d.ts,today,medNowHM());if(ts)o.ts=ts;
  const was=S.meds.find(m=>m.id===o.id),gone=d.t0.filter(s=>!times.includes(s)),added=times.filter(s=>!d.t0.includes(s));
  gone.forEach((s,i)=>{if(added[i]&&S.medLog.some(r=>r.m===o.id&&r.day===today&&r.slot===s))o.ts={...o.ts,[added[i]]:MedLib.addDay(today,1)}});
  MedLib.revise(was,o,today);
  const dropped=was?MedLib.keepToday(was,o,today):[],todayNew=added.filter(s=>o.ts?.[s]!==MedLib.addDay(today,1));
  const before=S.meds.slice(),shown=S.settings.medShowName;
  if(!o.id)o.id=MedLib.freeId(new Set(S.meds.map(m=>m.id)));
  S.meds=MedLib.cleanMeds(S.meds.filter(m=>m.id!==o.id).concat([o]).sort((a,b)=>a.id-b.id));
  S.medLog=MedLib.cleanLog(S.medLog,S.meds);
  S.settings.medShowName=d.sh===true;
  if(!commit(()=>{S.meds=before;S.settings.medShowName=shown}))return;
  medClose();render();medResched();
  toast(dropped.length?`İlaç kaydedildi. ${dropped.join(", ")} saati bugün için geçerli kalır${added.length?`; yeni saat ${todayNew.length?"bugün de":"yarından"} geçerli`:""}.`:"İlaç kaydedildi");
}
function medBoxAdd(id){
  const m=S.meds.find(x=>x.id===id);if(!m||!m.kb)return;
  const prev=m.k;m.k=Math.min(99999,Math.round(((m.k||0)+m.kb)*100)/100);
  if(!commit(()=>{m.k=prev}))return;
  render();medResched();toast(`${m.n}: kutu eklendi`,()=>{m.k=prev;save();render();medResched()});
}
function medResume(id){
  const m=S.meds.find(x=>x.id===id);if(!m)return;
  const before=S.meds.slice(),o={...m,on:true};delete o.ou;
  MedLib.revise(m,o,calKey());
  S.meds=MedLib.cleanMeds(S.meds.map(x=>x.id===id?o:x));
  if(!commit(()=>{S.meds=before}))return;
  render();medResched();toast(`${m.n} tekrar açıldı`,()=>{S.meds=before;save();render();medResched()});
}
const medUndoToast=(msg,res)=>toast(msg,()=>{res.undo();save();render();medResched()});
function medMark(mid,slot,st,force,day=calKey()){
  const isToday=day===calKey();
  /* A dose tapped on Today (also yesterday's unmarked one) was taken now; on the Meds screen's past-day list the user sets the time. */
  const live=isToday||tab==="today";
  if(st==="t"&&!force&&live){
    const r=MedLib.recentTaken(S.medLog,mid,day,slot,Date.now());
    if(r){confirmSheet({title:"Yine de kaydedilsin mi?",body:MedLib.recentText(r),ok:"Evet, kaydet",no:"Hayır, kaydetme"}).then(yes=>yes?medMark(mid,slot,st,true,day):toast(MedLib.NOT_SAVED));return}
  }
  const at=st==="t"&&live?medNowHM():undefined,res=MedLib.mark(S,mid,day,slot,st,at);
  if(!res)return;
  if(!commit(res.undo))return;
  render();medResched();
  const m=S.meds.find(x=>x.id===mid);
  medUndoToast(st==="t"?`${m.n} alındı olarak kaydedildi${isToday||!at?"":`, saat ${at}. Başka saatse İlaçlar ekranında düzelt`}`:st==="s"?`${m.n} atlandı`:"Kayıt geri alındı",res);
}
function medTakeAll(slot,force){
  const t=calKey(),ds=MedLib.dosesOn(S.meds,t).filter(d=>d.slot===slot&&!MedLib.statusOf(S.medLog,d.m.id,t,slot));
  if(ds.length<2)return;
  if(!force){
    const r=ds.map(d=>MedLib.recentTaken(S.medLog,d.m.id,t,slot,Date.now())).find(Boolean);
    if(r){confirmSheet({title:"Yine de kaydedilsin mi?",body:MedLib.recentText(r),ok:"Evet, kaydet",no:"Hayır, kaydetme"}).then(yes=>yes?medTakeAll(slot,true):toast(MedLib.NOT_SAVED));return}
  }
  const at=medNowHM(),rs=ds.map(d=>MedLib.mark(S,d.m.id,t,slot,"t",at)).filter(Boolean);
  if(!rs.length)return;
  const undo=()=>rs.slice().reverse().forEach(x=>x.undo());
  if(!commit(undo))return;
  render();medResched();
  medUndoToast(`${rs.length} ilaç alındı olarak kaydedildi`,{undo});
}
function medAtSheet(mid,slot,day){
  const r=S.medLog.find(x=>x.m===mid&&x.day===day&&x.slot===slot&&x.st==="t"),m=S.meds.find(x=>x.id===mid);
  if(!r||!m)return;
  openSheet(`<h3>Alınan saati düzenle</h3><p class="mut sm">${esc(m.n)}, ${slot} dozu, ${fd(day)}</p>
  <label class="lbl" for="mat">Alınan saat</label><input class="in" type="time" id="mat" value="${r.at||slot}"><div class="ferr" id="matw" role="alert"></div>
  <button class="btn" data-md="atsave:${mid}:${slot}:${day}">Kaydet</button><button class="mt-2 btn ghost" data-md="close">Vazgeç</button>`);
}
function medAtSave(mid,slot,day){
  const v=document.getElementById("mat").value;
  if(!timeOk(v)){document.getElementById("matw").textContent="Saati yaz, örneğin 08:30";return}
  const res=MedLib.mark(S,mid,day,slot,"t",v);
  if(!res||!commit(res.undo))return;
  closeSheet();render();medResched();medUndoToast("Alınan saat güncellendi",res);
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
  else if(a==="near")medNearSheet();
  else if(a==="nearsave")medNearSave();
  else if(a==="nearclear"){S.settings.medNear="";save();closeSheet();render();toast("Numara silindi")}
  else if(a==="nearclose")closeSheet();
  else if(a==="nearsend")medNearSend();
  else if(a==="locktest"){const w=MW();if(!w)return toast("Yalnızca telefondaki uygulamada çalışır");w.test().then(()=>toast("15 saniye sonra alarm çalacak: telefonu kilitle")).catch(()=>toast("Test kurulamadı"))}
  else if(a==="realtest")medRealTest();
  else if(a==="wakelog")medWakeLog();
  else if(a==="wset"){if(r[0]==="autostart")openDH("openAutostart");else MW()?.settings({to:r[0],id:r[1]}).catch(()=>toast("Ayar ekranı açılamadı"))}
  else if(a==="wcopy")(navigator.clipboard?navigator.clipboard.writeText(medWakeText):Promise.reject()).then(()=>toast("Kayıt panoya kopyalandı"),()=>{const s=getSelection(),g=document.createRange(),b=document.getElementById("wlog");if(b){g.selectNodeContents(b);s.removeAllRanges();s.addRange(g)}toast("Kopyalanamadı: metni seçtim, uzun basıp kopyala")});
  else if(a==="wclear")MW()?.clearLog().then(medWakeLog,()=>toast("Temizlenemedi"));
  else if(a==="shown"){S.settings.medShowName=el.checked;save();medResched()}
  else if(a==="ramgo")medRamGo(+r[0]);
  else if(a==="ramback")medRamUndo(+r[0]);
  else if(a==="ramredo")medRamRedo(+r[0]);
  else if(a==="ramno"){S.settings.ramMedsNo=true;save();render()}
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
  else if(a==="addtime"){medCollect();if(medDraft.t.length<MedLib.MAXT){medDraft.t.push("");medDraft.q.push({d:"",p:""});medRender()}}
  else if(a==="rmtime"){medCollect();medDraft.t.splice(+r[0],1);medDraft.q.splice(+r[0],1);medRender()}
  else if(a==="wd"){const w=+r[0],i=medDraft.w.indexOf(w);if(i>=0)medDraft.w.splice(i,1);else medDraft.w.push(w);el.setAttribute("aria-pressed",String(i<0))}
  else if(a==="takeall")medTakeAll(r[0]+":"+r[1]);
  else if(a==="take")medMark(+r[0],r[1]+":"+r[2],"t",false,r[3]);
  else if(a==="skip")medMark(+r[0],r[1]+":"+r[2],"s",false,r[3]);
  else if(a==="clear")medMark(+r[0],r[1]+":"+r[2],null,false,r[3]);
  else if(a==="at")medAtSheet(+r[0],r[1]+":"+r[2],r[3]);
  else if(a==="atsave")medAtSave(+r[0],r[1]+":"+r[2],r[3]);
  else if(a==="resume")medResume(+r[0]);
  else if(a==="boxadd")medBoxAdd(+r[0]);
  else if(a==="box"){
    medCollect();const kb=LabLib.optNum(medDraft.kb);
    if(!(kb>0&&kb<=99999))return document.getElementById("mwarn").textContent="Önce kutu başına adedi yaz";
    medDraft.k=medNum(Math.min(99999,Math.round(((LabLib.optNum(medDraft.k)||0)+kb)*100)/100));medRender();
  }
  else if(a==="fed"){medCollect();medDraft.fed=medDraft.fed===r[0]?"":r[0];medRender()}
  else if(a==="dup"){medCollect();Object.assign(medDraft,{id:0,k:"",mc:"",s:undefined,e:undefined,ts:undefined,t0:[],ia:undefined,iv0:"",ou:"",on:true});medRender()}
  else if(a==="dprev"){const d=MedLib.addDay(medViewDay(),-1);if(d<calOff(-MED_BACK))return toast("Daha eski güne gidilemez");medDay=d;render()}
  else if(a==="dnext"){const d=MedLib.addDay(medViewDay(),1);medDay=d<calKey()?d:"";render()}
  else if(a==="dtoday"){medDay="";render()}
});
