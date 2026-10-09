/* ---------- notifications (APK only) ---------- */
const WATER_REM=[2,3,4],BACKUP_REM=10,WEEKLY_REM=12,FAST_NID=9100;
const SCHED_DAYS=30,LEAD_MS=5000,RESCHEDULE_MS=6*36e5;let lastSched=0,exactOk=true,fsiOk=true;
const LN=()=>plugin("LocalNotifications");
async function scheduleReminders(){
  const ln=LN();if(!ln||recovery)return "web";
  try{
    let p=await ln.checkPermissions();
    if(p.display!=="granted")p=await ln.requestPermissions();
    if(p.display!=="granted")return "denied";
    /* Android 14+ does not grant the exact-alarm permission on a fresh install; the plugin then sets the alarm to an approximate time, and the user is told. */
    try{const v=(await ln.checkExactNotificationSetting()).exact_alarm!=="denied";if(v!==exactOk){exactOk=v;if(tab==="today")render()}}catch{}
    /* Full-screen notification permission (Android 14+): when off, the medication alarm does not open the locked screen; the user is told. */
    try{const w=MW();if(w){const v=(await w.fsi()).allowed!==false;if(v!==fsiOk){fsiOk=v;if(tab==="today")render()}}}catch{}
    try{
      const dl=await ln.getDeliveredNotifications(),t1=dayKey(),y=keyOff(-1),gone=[];
      for(const n of dl.notifications){
        if(n.id===FAST_NID&&!S.fast.t0)gone.push({id:FAST_NID});
        if(n.id===CycleLib.NID&&!cycNotif())gone.push({id:n.id});
        if(n.id<1000000)continue;
        const d=MedLib.doseOfId(S.meds,n.id);
        if(!d||MedLib.statusOf(S.medLog,d.m.id,t1,d.slot)||MedLib.statusOf(S.medLog,d.m.id,y,d.slot))gone.push({id:n.id});
      }
      if(gone.length)await ln.removeDeliveredNotifications({notifications:gone});
    }catch{}
    const pend=await ln.getPending();
    /* Not ours to reset: the gym timers (9001 set, 9002 rest) and the guide, medication test and snooze notifications are scheduled elsewhere. */
    const keep=new Set([9001,9002,GD_NID,MED_TEST_NID,AlarmLib.SNOOZE_NID]);
    const pn=pend.notifications.filter(n=>!keep.has(n.id));if(pn.length)await ln.cancel({notifications:pn.map(n=>({id:n.id}))});
    /* The plugin's daily repeat sets an alarm that Doze defers after the first notification. So every day is scheduled as its own one-shot alarm that pierces idle mode. */
    try{await ln.registerActionTypes({types:[{id:"water",actions:[{id:"water",title:`+${S.settings.glass} ml`}]},{id:"med",actions:[{id:"med",title:"✔ Aldım"},{id:"medskip",title:"Atla"}]}]})}catch{}
    const list=[],now=Date.now(),lb=S.settings.lastBackup;
    const t0=dayKey(),waterDone=sum("water",t0,t0)>=S.settings.waterMl,fastBlock=!!risk().block;
    for(const r of S.settings.reminders.filter(r=>r.on&&!(r.id===11&&fastBlock))){
      const [h,m]=r.t.split(":").map(Number),water=WATER_REM.includes(r.id);
      for(let i=0;i<SCHED_DAYS;i++){
        if(i===0&&waterDone&&water)continue;
        const at=addDays(i);at.setHours(h,m,0,0);
        if(r.dow!=null&&at.getDay()!==r.dow)continue;
        if(r.id===BACKUP_REM&&(S.entries.length<10||(lb&&Algo.dayNum(dayKey(at))-Algo.dayNum(lb)<7)))continue;
        if(at.getTime()>now+LEAD_MS)list.push(Object.assign({id:r.id*100+i,title:r.title,body:r.body,schedule:{at,allowWhileIdle:true}},water?{actionTypeId:"water",extra:{act:"water",v:S.settings.glass,at:at.getTime()}}:r.id===WEEKLY_REM?{extra:{act:"open",tab:"coach"}}:r.id===BACKUP_REM?{extra:{act:"open",tab:"settings-data"}}:{}));
      }
    }
    lastSched=now;
    if(S.settings.medOn){
      for(const n of MedLib.notifications(S.meds,S.medLog,new Date(),SCHED_DAYS,S.settings.medShowName))list.push({id:n.id,title:n.title,body:n.body,schedule:{at:n.at,allowWhileIdle:true},actionTypeId:n.actionTypeId,extra:n.extra,channelId:n.channelId,ongoing:n.ongoing});
    }
    const cn=cycNotif();if(cn)list.push(cn);
    if(S.fast.t0&&!fastBlock){const at=new Date(S.fast.t0+S.fast.plan*36e5);if(at.getTime()>now+LEAD_MS)list.push({id:FAST_NID,title:"⏳ Oruç",body:"Oruç süren doldu. İstediğinde bitirebilirsin.",schedule:{at,allowWhileIdle:true}})}
    // Android caps simultaneous alarms per app (500): the nearest are kept, farther ones are rescheduled when the app opens.
    list.sort((a,b)=>a.schedule.at-b.schedule.at);if(list.length>MedLib.BUDGET)list.length=MedLib.BUDGET;
    const tk=await quickToken();if(tk)for(const n of list)if(n.extra&&(n.extra.act==="water"||n.extra.act==="med"))n.extra.tk=tk;
    if(list.length)await ln.schedule({notifications:list});
    /* The notification plugin does not light the locked screen: for medication doses (reminder repeats excluded) a separate alarm screen wakes it briefly. */
    const mw=MW();if(mw)await mw.set({times:MedLib.wakeTimes(list),doses:MedLib.wakeDoses(list)}).catch(()=>{});
    return "ok";
  }catch(e){return "Bildirimler kurulamadı: "+(e&&e.message||e)}
}
/* Only tapping a notification ("tap"); the water/medication buttons are caught natively in QuickLogPlugin. Without Coach consent the weekly summary opens in Trend, the backup reminder in Data and backup. */
function notifTap(e){
  const x=e&&e.notification&&e.notification.extra;
  if(!e||e.actionId!=="tap"||!x||(x.act!=="open"&&x.act!=="med"))return;
  tab=x.act==="med"||x.tab==="meds"?(S.settings.medOn?"meds":"more"):x.tab==="coach"&&S.settings.consent?"coach":x.tab==="cycle"&&S.settings.cycleOn?"cycle":x.tab==="settings-data"?x.tab:"trend";via=null;closeSheet();render();window.scrollTo(0,0);
  if(x.act==="med")setTimeout(()=>alarmOpen({quiet:true}),0);
}
function setNotif(s){notifStatus=s;if(tab==="settings-reminders")render()}
/* After the permission is granted the earlier approximate alarms do not turn exact by themselves; they are rescheduled. */
async function exactAsk(){
  const ln=LN();if(!ln)return;
  try{exactOk=(await ln.changeExactNotificationSetting()).exact_alarm!=="denied"}catch{return toast("Ayar ekranı açılamadı, telefon ayarlarında Alarmlar ve hatırlatıcılar'ı bul")}
  setNotif(await scheduleReminders());render();
  toast(exactOk?"Hatırlatmalar tam saatinde çalacak":"İzin verilmedi. Hatırlatmalar birkaç dakika gecikebilir");
}
const SC=()=>plugin("StepCounter");
/* stepsRead: until the first sensor read at startup finishes, yesterday's steps may not be written yet, so the "counting stopped" card must not show falsely. */
let stepToday=null,stepSnapAt=0,stepsRead=false;
/* When a day's steps drop to 0 the entry is deleted: a zero-step entry is invalid and would raise the "invalid entry dropped" warning on the next start. */
function stepZero(e){if(!(e.v>0))S.entries.splice(S.entries.indexOf(e),1)}
function setSteps(day,v){
  if(!(v>=0&&v<=200000)||day<S.settings.stepsFrom)return false; // steps the user deleted are not written back from the sensor history
  const e=S.entries.find(x=>x.type==="steps"&&x.day===day&&x.text!=="manual");
  if(e){const m=Math.max(v,e.hc||0);if(e.v===m&&(e.ph===v||!e.hc))return false;e.ph=v;e.v=m;stepZero(e)} // 0 is valid too: when the counter resets, an old inflated entry gets corrected
  else if(v>0)S.entries.push({id:S.nextId++,day,time:"00:00",type:"steps",v,ph:v,text:""});
  else return false;
  return true;
}
/* Health Connect (watch) daily steps: a day's value is the larger of the phone's (ph) and the watch's (hc), never their sum. When ph is missing (dropped as invalid by cleanEntries) v is the phone value. */
function setHc(day,v){
  if(!(v>=0&&v<=200000)||day<S.settings.stepsFrom)return false;
  const e=S.entries.find(x=>x.type==="steps"&&x.day===day&&x.text!=="manual");
  if(e){if(e.hc===v)return false;const ph=e.ph!=null?e.ph:e.v;e.ph=ph;e.hc=v;e.v=Math.max(ph,v);stepZero(e)}
  else if(v>0)S.entries.push({id:S.nextId++,day,time:"00:00",type:"steps",v,ph:0,hc:v,text:""});
  else return false;
  return true;
}
async function stepsSync(){
  hcSync();
  if(!S.settings.stepsOn||!SC())return;
  try{
    const r=await SC().read();let ch=!stepsRead;stepsRead=true;
    if(stepSnapAt!==(+r.snapAt||0)){stepSnapAt=+r.snapAt||0;ch=true}
    for(const d in (r.history||{}))if(dayOk(d)&&setSteps(d,r.history[d]))ch=true;
    if(typeof r.steps==="number"){if(stepToday!==r.steps){stepToday=r.steps;ch=true}if(setSteps(dayKey(),r.steps))ch=true}
    if(ch){save();if((tab==="today"||tab==="steps")&&!$("#sheet").classList.contains("on")&&!viewBusy())render();else widgetPush()}
  }catch{}
}
/* Live steps while open: read at a short interval when visible; a new read does not start before the previous one (4 s if the sensor is unresponsive) is done. */
const STEP_POLL=3000;let stepBusy=false;
function stepsTick(){
  if(document.hidden||stepBusy||(tab!=="today"&&tab!=="steps"))return;
  stepBusy=true;return stepsSync().finally(()=>{stepBusy=false});
}
const manualSteps=()=>S.entries.filter(e=>e.type==="steps"&&e.text==="manual"&&e.day===dayKey()).reduce((s,e)=>s+e.v,0);
const stepsShown=()=>{const hn=hcNow(),t=Math.max(stepToday==null?-1:stepToday,hn==null?-1:hn);return t<0?null:t+manualSteps()};
function sheetSteps(){openSheet(`<h3>Adım ekle (elle)</h3><p class="flush hint">Telefonu taşımadığın adımlar için. Sensör değerine eklenir.</p><input class="in num" id="fv" inputmode="numeric" placeholder="Adım sayısı" autofocus>${dayOptions()}<button class="btn" data-go="steps">Ekle</button>`)}
function goSteps(){
  const n=num($("#fv").value,true);
  if(!(n>=1&&n<=100000))return toast("Adımı 1 ile 100.000 arasında yaz");
  const e=add("steps",n,"manual",fday());closeSheet();render();toast(`${fint(n)} adım eklendi`,e.id);
}
function stepCard(){
  const g=S.settings.stepGoal,sh=stepsShown(),n=sh==null?null:Math.round(sh),ok=n!=null&&n>=g;
  return `<button class="rbtn" data-tab="steps" aria-label="Adım raporunu aç">${ring((n??0)/g,"var(--prim)",n==null?"–":ok?"✓":fint(g-n),"Adım",`${n==null?"–":fint(n)} / ${fint(g)}`,ok?"Hedef tamam":n==null?"":"adım kaldı","mini"+(ok?" done":""))}</button>`;
}
let stepRange=14;
function viewSteps(){
  const st=S.settings,L=120,stepsOf=dayTotal("steps");
  const all=[];for(let i=L-1;i>=0;i--){const k=keyOff(-i);all.push({k,v:stepsOf(k),d:addDays(-i)})}
  const N=stepRange||new Date().getDate(),days=all.slice(-N),vals=days.map(d=>d.v);
  const today=stepsShown()==null?all[L-1].v:stepsShown(),max=Math.max(st.stepGoal,...vals,1);
  const g=st.stepGoal,sr=Algo.stepStats(vals,g),s7=Algo.stepStats(all.slice(-7).map(d=>d.v),g),s30=Algo.stepStats(all.slice(-30).map(d=>d.v),g),sl=Algo.stepStats(all.map(d=>d.v),g);
  const best=sr.best>=0?days[sr.best]:null;
  const W=320,H=130,pl=12,gap=N>14?2:6,bw=Math.min(16,(W-2*pl-gap*(N-1))/N),step=N>1?(W-2*pl-bw)/(N-1):0,Y=v=>H-18-(H-30)*(v/max);
  const bars=days.map((d,i)=>{const x=N>1?pl+i*step:(W-bw)/2,y=Y(d.v),hit=d.v>=g,cx=(x+bw/2).toFixed(1);
    const lbl=N<=7?WEEKDAYS_SHORT[d.d.getDay()]:(i%7===0||i===N-1)&&(i===N-1||N-1-i>=4)?fd(d.k):"";
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,H-18-y).toFixed(1)}" rx="${bw>8?4:1.5}" fill="var(--water)" opacity="${hit?1:.45}"/>${lbl?`<text x="${cx}" y="${H-5}" text-anchor="${N<=7?"middle":i===0?"start":i===N-1?"end":"middle"}">${lbl}</text>`:""}${hit&&N<=14?`<text x="${cx}" y="${(y-3).toFixed(1)}" text-anchor="middle" style="fill:var(--ink)">✓</text>`:""}`}).join("");
  const seg=`<div class="seg" role="group" aria-label="Grafik aralığı">${[[7,"7 gün"],[14,"14 gün"],[30,"30 gün"],[0,"Bu ay"]].map(([n,l])=>`<button data-sr="${n}" aria-pressed="${stepRange===n}" style="padding:7px 12px">${l}</button>`).join("")}</div>`;
  const chartBody=sr.n?`<svg class="w100 bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="Son ${N} günün adımları">${bars}<line x1="0" x2="${W}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" stroke="var(--kcal)" stroke-width="1.4" stroke-dasharray="4 3"/></svg><div class="mut sm">Kesik çizgi hedef. ${N<=14?"✓ ve koyu":"Koyu"} çubuk: hedefe ulaşılan gün.</div>`:`<p class="hint">Bu aralıkta adım kaydı yok.</p>`;
  const wAll=weights(),wd=Object.keys(wAll).sort(),kg=wd.length?Algo.trend(wAll)[wd[wd.length-1]]:null;
  const km=st.heightCm>0?today*st.heightCm*0.415/1e5:null;
  const extra=km!=null?`<div class="stat"><div class="k">Yaklaşık mesafe</div><div class="v num">${fmt(km,1)} km</div></div>${kg!=null?`<div class="stat"><div class="k">Yaklaşık enerji</div><div class="v num">${Math.round(0.5*kg*km)} kcal</div></div>`:""}`:"";
  const rows=all.slice(-7).reverse().map(d=>`<div class="row"><span>${d.k===dayKey()?"Bugün":WEEKDAYS_SHORT[d.d.getDay()]+" "+fd(d.k)}</span><b class="num">${d.v?fint(d.v):"–"}</b></div>`).join("");
  const man=S.entries.filter(e=>e.type==="steps"&&e.text==="manual").sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id).map(e=>`<div class="row"><span>${fd(e.day)}</span><b class="num">+${fint(e.v)}</b><button class="del" data-del="${e.id}" aria-label="Kaydı sil">✕</button></div>`).join("");
  const manualCard=`<div class="card"><div class="lbl">Elle eklenenler</div>${man||'<p class="hint">Elle eklediğin adım yok.</p>'}<button class="lnk" data-act="stepsadd">Adım ekle (elle)</button></div>`;
  /* With no steps at all: one sentence and starting a walk instead of a wall of counters and statistics. */
  if(!sl.n&&!today&&!S.walk)return `${emptyCard("steps","Henüz adım kaydı yok","Telefonu yanında taşıdıkça adımların burada görünür.",`<button class="btn" data-w="start">Yürüyüş başlat</button>`)}
  ${hcCard()}${motionCard()}
  ${manualCard}`;
  return `<div class="tc card">${ring(today/st.stepGoal,"var(--water)",fint(today),"Bugün",`/ ${fint(st.stepGoal)} adım`,"adım")}</div>
  ${walkCard()}
  <div class="card"><div class="lbl">Adım grafiği</div>${seg}${chartBody}</div>
  <div class="stats"><div class="stat"><div class="k">7 gün ortalaması</div><div class="v num">${s7.n?fint(s7.avg):"–"}</div></div><div class="stat"><div class="k">30 gün ortalaması</div><div class="v num">${s30.n?fint(s30.avg):"–"}</div></div><div class="stat"><div class="k">En iyi gün</div><div class="v num">${best?fint(best.v):"–"}</div>${best?`<div class="mut sm">${fd(best.k)}</div>`:""}</div><div class="stat"><div class="k">Hedef serisi</div><div class="v num">${sl.streak} gün</div></div><div class="stat"><div class="k">Hedefe ulaşılan gün</div><div class="v num">${sr.hit} / ${N}</div></div>${extra}</div>
  ${motionCard()}
  <div class="card"><div class="lbl">Günler</div>${rows}</div>
  ${hcCard()}
  ${manualCard}
  ${km==null?`<p class="hint">Mesafe için Ayarlar'dan boyunu gir.</p>`:""}
  <p class="hint">Kaynak: telefonun adım sensörü. Yalnızca telefonu taşıdığın adımlar sayılır. Çok yavaş yürüyüşte az sayabilir, genelde sapma %5-10 civarıdır. ${S.settings.moveKcalOn?"Enerji ve mesafe yaklaşıktır. Adımlar kalori hedefine eklenmez; Profil'deki ayar açık olduğundan yalnız kayıtlı antrenman ve hareketler eklenir.":"Enerji ve mesafe yaklaşıktır ve günlük kalori hedefine eklenmez: harcama tahmini zaten gerçek kilo değişimine dayanır."} Ortalamalar yalnız adım kaydı olan günlerden hesaplanır.</p>`;
}
async function stepsOpen(){
  const p=SC();if(!p)return;
  try{
    const a=await p.isAvailable();
    if(!a.available)return toast("Bu telefonda adım sensörü yok");
    const g=await p.requestAccess();
    if(!g.granted){S.settings.stepsAsked=true;save();render();return toast("Fiziksel aktivite izni verilmedi. Telefon ayarlarından açabilirsin")}
    S.settings.stepsOn=true;S.settings.stepsAsked=true;save();await p.start();await stepsSync();render();toast("Adım sayar açık");
  }catch{toast("Adım sayar açılamadı")}
}
let notifDiag="",oem="";
const DH=()=>plugin("DeviceHelp");
const openDH=m=>{const p=DH();if(p)p[m]().then(r=>{if(r.opened==="none")toast("Ayar ekranı açılamadı, telefon ayarlarından NeoWell'i bul")},()=>toast("Ayar ekranı açılamadı"))};
const oemXiaomi=()=>/xiaomi|redmi|poco/.test(oem);
function sheetOem(){
  openSheet(`<h3>Hatırlatmalar için bir kez ayar</h3><p class="flush hint">Xiaomi telefonlar, uygulamayı son uygulamalardan kaydırınca hatırlatmaları siler. Bunun için birkaç izin gerekir. Düğmeler doğrudan ilgili ekranı açar.</p>
  <div class="btns"><button class="btn ghost" data-act="oem1">1. Otomatik başlat: NeoWell'i aç</button><button class="btn ghost" data-act="oem2">2. Pil: Kısıtlama yok seç</button></div>
  <p class="hint">3. Son uygulamalar ekranında NeoWell kartını basılı tutup kilitle (asma kilit simgesi). Bu en sağlam yoldur.</p>
  <p class="hint">4. İlaç alarmının kilitli ekranı açması için: Ayarlar > Uygulamalar > NeoWell > Diğer izinler bölümünde "Kilit ekranında göster" ve "Arka planda açılır pencere göster" izinlerini aç.</p>
  <div class="btns"><button class="btn" data-act="oemok">Yaptım</button></div>`);
}
async function notifTest(){
  const ln=LN();if(!ln)return toast("Bildirimler yalnızca telefondaki uygulamada çalışır");
  try{
    const p=await ln.checkPermissions();
    let ex="bilinmiyor";try{ex=(await ln.checkExactNotificationSetting()).exact_alarm}catch{}
    const pend=(await ln.getPending()).notifications.length;
    notifDiag=`Bildirim izni: ${p.display}. Tam saat alarmı: ${ex}. Kurulu hatırlatma: ${pend}.`;
    if(p.display!=="granted"){render();return toast("Bildirim izni yok. Telefon ayarlarından NeoWell için bildirimleri aç")}
    await ln.schedule({notifications:[{id:99,title:"NeoWell",body:"Test bildirimi çalışıyor",schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true}}]});
    render();toast("5 saniye içinde bildirim gelmeli. İstersen uygulamadan çık");
  }catch(e){notifDiag="Hata: "+(e&&e.message||e);render()}
}

