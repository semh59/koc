/* ---------- notifications (APK only) ---------- */
const WATER_REM=[2,3,4],MEAS_REM=[7,8,9],MOVE_REM=5,BACKUP_REM=10,WEEKLY_REM=12,FAST_NID=9100;
const SCHED_DAYS=30,LEAD_MS=5000,RESCHEDULE_MS=6*36e5;let lastSched=0,lastTz="",exactOk=true,fsiOk=true,medBudgetMsg="";
const LN=()=>plugin("LocalNotifications");
/* Plugin 8.3+ opens the system "Alarms & reminders" screen on every schedule() with an exact alarm while the permission is missing; the exact flag follows the permission so it never does. */
async function lnSchedule(ln,list){
  const isExactNotification=(await ln.checkExactNotificationSetting()).exact_alarm!=="denied",priv=!S.settings.lockDetail,medPriv=!medLockDetail();
  /* With lock-screen detail off, measurement, medication and cycle notifications carry a generic title and the private channel twin (the channel id is
     MedWakeReceiver's: "nw_med" public, "nw_medp" private). Medication ones also with the app lock on: no medication name reaches the lock screen then. */
  const med=n=>n.channelId==="nw_med"||n.id>=1e6&&!RamadanLib.isNid(n.id);
  const sens=n=>n.id!==MED_TEST_NID&&(med(n)?medPriv:priv&&(n.id===CycleLib.NID||n.id<1000&&MEAS_REM.includes(Math.floor(n.id/100))));
  return ln.schedule({notifications:list.map(n=>({...n,...sens(n)&&{title:"NeoWell: hatırlatma",body:"Açmak için dokun"},...medPriv&&n.channelId==="nw_med"&&{channelId:"nw_medp"},isExactNotification}))});
}
/* Lock-screen detail for medication: the native channel twin follows the same flag (mw.set detail), so the JS channel choice always exists on the phone. */
const medLockDetail=()=>S.settings.lockDetail&&!S.settings.lockOn;
const tzKey=()=>new Date().getTimezoneOffset()+Intl.DateTimeFormat().resolvedOptions().timeZone;
/* A reminder is rebuilt when the zone offset changed, the phone moved the alarms (boot, clock or zone change after the last setup, from the alarm log) or 6 hours passed. */
async function schedDue(){
  if(Date.now()-lastSched>RESCHEDULE_MS||!exactOk||tzKey()!==lastTz)return true;
  try{return MedLib.clockMoved((await MW().log()).items||[],lastSched)}catch{return false}
}
let notifAsked=false; // the system dialog is shown once per app run; a refusal is handled from the permissions centre
/* One run at a time: a call that arrives during a run asks for one more run after it, so a cancel is never interleaved with another run's schedule. */
let schedRun=null,schedAgain=false;
function scheduleReminders(){
  if(schedRun){schedAgain=true;return schedRun}
  return schedRun=(async()=>{
    try{let r;do{schedAgain=false;r=await scheduleOnce()}while(schedAgain);console.log("NW-SCHED "+r);return r}
    finally{schedRun=null}
  })();
}
async function scheduleOnce(){
  const ln=LN();if(!ln||recovery)return "web";
  const t0=Date.now();
  try{
    await quickIngest(); // a dose marked on the lock screen still waits in the queue until then, and would be sent back as open
    let p=await ln.checkPermissions();
    if(p.display!=="granted"&&!notifAsked){notifAsked=true;p=await ln.requestPermissions()}
    if(p.display!=="granted")return "denied";
    /* Android 14+ does not grant the exact-alarm permission on a fresh install; the plugin then sets the alarm to an approximate time, and the user is told. */
    try{const v=(await ln.checkExactNotificationSetting()).exact_alarm!=="denied";if(v!==exactOk){exactOk=v;if(tab==="today")render()}}catch{}
    /* Full-screen notification permission (Android 14+): when off, the medication alarm does not open the locked screen; the user is told. */
    try{const w=MW();if(w){const v=(await w.fsi()).allowed!==false;if(v!==fsiOk){fsiOk=v;if(tab==="today")render()}}}catch{}
    try{
      const dl=await ln.getDeliveredNotifications(),gone=[];
      for(const n of dl.notifications){
        if(n.id===FAST_NID&&!Habits.fast().t0)gone.push({id:FAST_NID});
        if(n.id===CycleLib.NID&&!cycNotif())gone.push({id:n.id});
        if(n.id<1000000||RamadanLib.isNid(n.id)||(n.id-1e6)%1000>=900)continue; // the 09:00 stock and pause notices are no dose
        /* The notification stays until it is handled, so its dose day is the latest dose time before now; a notification is one minute's group, gone only when every dose in it is marked. */
        const d=MedLib.doseOfId(Meds.meds(),n.id);
        if(!d){gone.push({id:n.id});continue}
        const day=MedLib.dayForTap(d.slot,Date.now()),grp=MedLib.dosesOn(Meds.meds(),day).filter(x=>x.slot===d.slot&&x.m.id!==d.m.id).concat([d]);
        if(grp.every(x=>MedLib.statusOf(Meds.log(),x.m.id,day,x.slot)))gone.push({id:n.id});
      }
      if(gone.length)await ln.removeDeliveredNotifications({notifications:gone});
    }catch{}
    lastSched=0;
    /* The plugin's daily repeat sets an alarm that Doze defers after the first notification. So every day is scheduled as its own one-shot alarm that pierces idle mode. */
    try{await ln.registerActionTypes({types:[{id:"water",actions:[{id:"water",title:`+${S.settings.glass} ml`}]},{id:"med",actions:[{id:"med",title:"✓ Aldım"},{id:"medskip",title:"Atla"}]},{id:"medgrp",actions:[{id:"med",title:"✓ Hepsini aldım"}]}]})}catch{}
    let list=[];const medList=[],now=Date.now(),lb=S.settings.lastBackup;
    const fastBlock=!!risk().block;
    const preg=risk().pregnant;
    for(const r of S.settings.reminders.filter(r=>r.on&&!(r.id===11&&fastBlock)&&!(preg&&PREG_OFF.includes(r.id)))){
      const water=WATER_REM.includes(r.id),kind=water?"water":r.id===MOVE_REM?"move":"";
      for(let i=0;i<SCHED_DAYS;i++){
        const at=addDays(i,new Date()),[h,m]=(kind?Habits.ramShift(dayKey(at),r.t,kind,WATER_REM.indexOf(r.id)):r.t).split(":").map(Number);at.setHours(h,m,0,0);
        if(i===0&&water){const ad=dayAt(at.getTime());if(sum("water",ad,ad)>=S.settings.waterMl)continue}
        if(r.dow!=null&&at.getDay()!==r.dow)continue;
        if(r.id===BACKUP_REM&&(Log.all().length<10||(lb&&Algo.dayNum(dayKey(at))-Algo.dayNum(lb)<7)))continue;
        if(at.getTime()>now+LEAD_MS)list.push(Object.assign({id:r.id*100+i,title:r.title,body:r.body,schedule:{at,allowWhileIdle:true}},water?{actionTypeId:"water",extra:{act:"water",v:S.settings.glass,at:at.getTime()}}:r.id===WEEKLY_REM?{extra:{act:"open",tab:"coach"}}:r.id===BACKUP_REM?{extra:{act:"open",tab:"settings-data"}}:r.id===1?{extra:{act:"open",tab:"weight"}}:r.id===7||r.id===8?{extra:{act:"open",tab:"bp"}}:r.id===9?{extra:{act:"open",tab:"glucose"}}:{}));
      }
    }
    if(S.settings.medOn){
      for(const n of MedLib.notifications(Meds.meds(),Meds.log(),new Date(),SCHED_DAYS,S.settings.medShowName))medList.push({id:n.id,title:n.title,body:n.body,schedule:{at:n.at,allowWhileIdle:true},actionTypeId:n.actionTypeId,extra:n.extra,channelId:n.channelId,ongoing:n.ongoing});
      for(const n of MedLib.notices(Meds.meds(),new Date(),S.settings.medShowName,Meds.log()))medList.push({id:n.id,title:n.title,body:n.body,schedule:{at:n.at,allowWhileIdle:true},extra:n.extra});
    }
    for(const n of Habits.ramReminders(now,LEAD_MS,SCHED_DAYS))list.push({id:n.id,title:n.title,body:n.body,schedule:{at:new Date(n.at),allowWhileIdle:true}});
    const cn=cycNotif();if(cn)list.push(cn);
    if(Habits.fast().t0&&!fastBlock){const at=new Date(Habits.fast().t0+Habits.fast().plan*36e5);if(at.getTime()>now+LEAD_MS)list.push({id:FAST_NID,title:"⏳ Oruç",body:"Oruç süren doldu. İstediğinde bitirebilirsin.",schedule:{at,allowWhileIdle:true}})}
    /* Android caps simultaneous alarms per app (500): medication first, repeats last; farther ones are rescheduled when the app opens, and the user is told. */
    const fit=MedLib.fit(medList,list,MedLib.BUDGET,now),msg=S.settings.medOn?MedLib.budgetText(fit):"";
    list=fit.list;
    if(msg!==medBudgetMsg){medBudgetMsg=msg;if(tab==="today")render()}
    const tk=await quickToken();if(tk)for(const n of list)if(n.extra&&(n.extra.act==="water"||n.extra.act==="med"))n.extra.tk=tk;
    /* Only pending ids missing from the new list are cancelled, and before it is set (the same id is overwritten): a failed or killed run leaves the old reminders standing,
       and old and new lists never stand together past the phone's alarm limit (a dose id moves with the day offset). Not ours to reset: the gym timers (9001 set, 9002 rest)
       and the guide, medication test and snooze notifications are scheduled elsewhere. */
    const keep=new Set([9001,9002,GD_NID,MED_TEST_NID,AlarmLib.SNOOZE_NID,...list.map(n=>n.id)]);
    const pn=(await ln.getPending()).notifications.filter(n=>!keep.has(n.id));if(pn.length)await ln.cancel({notifications:pn.map(n=>({id:n.id}))});
    if(list.length)await lnSchedule(ln,list);
    /* The notification plugin does not light the locked screen: for medication doses (reminder repeats excluded) a separate alarm screen wakes it briefly.
       That screen draws over the lock screen, so a name goes there only with lock-screen detail on and never with the app lock on (no name reaches the phone side then).
       The unmarked doses of the last 3 hours go too (the in-app alarm's window): a minute partly marked or snoozed in the app keeps its open doses on the lock screen. */
    const st=S.settings,mw=MW();if(mw)await mw.set({times:MedLib.wakeTimes(list),doses:MedLib.wakeDoses(list,Meds.meds(),st.medShowName&&medLockDetail(),st.medOn?AlarmLib.due(Meds.meds(),Meds.log(),new Date()).filter(i=>i.at<=Date.now()+LEAD_MS):[]),detail:medLockDetail()}).catch(()=>{});
    lastSched=t0;lastTz=tzKey();
    return "ok";
  }catch(e){console.log("NW-SCHED error "+(e&&e.message||e));return "Bildirimler kurulamadı. Bildirim iznini kontrol edip tekrar dene"}
}
/* Only tapping a notification ("tap"); the water/medication buttons are caught natively in QuickLogPlugin. Without Coach consent the weekly summary opens in Trend, the backup reminder in Data and backup. */
function notifTap(e){
  const x=e&&e.notification&&e.notification.extra;
  if(!e||e.actionId!=="tap"||!x||(x.act!=="open"&&x.act!=="med"))return;
  tab=x.act==="med"||x.tab==="meds"?(S.settings.medOn?"meds":"more"):x.tab==="coach"&&S.settings.consent?"coach":x.tab==="cycle"&&S.settings.cycleOn?"cycle":x.tab==="bp"&&S.settings.bpOn||x.tab==="glucose"&&S.settings.bsOn?x.tab:x.tab==="settings-data"||x.tab==="gym"?x.tab:"trend";if(x.tab==="weight")tSec="weight";via=null;closeSheet();render();window.scrollTo(0,0);
  if(x.tab==="weight")sheetWeight();
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
let notifDiag="",oem="";
const DH=()=>plugin("DeviceHelp");
/* When the direct screen could not be opened the phone showed the app's details (or nothing): the written path is what is left. */
const DH_PATH={openAutostart:"Ayarlar > Uygulamalar > İzinler > Otomatik başlat > NeoWell'i aç",openBattery:"Ayarlar > Pil > Uygulama pil tasarrufu > NeoWell > Kısıtlama yok"};
const openDH=m=>{const p=DH();if(p)p[m]().then(r=>{
  if(DH_PATH[m]&&(r.opened==="none"||r.opened==="details"))openSheet(`<h3>Ayarı kendin aç</h3><p class="mut">Bu telefonda ayar ekranı doğrudan açılamadı. Şu yolu izle:</p><p><b>${DH_PATH[m]}</b></p><button class="btn" data-pm="close">Tamam</button>`);
  else if(r.opened==="none")toast("Ayar ekranı açılamadı, telefon ayarlarından NeoWell'i bul")},()=>toast("Ayar ekranı açılamadı"))};
const batFix=()=>oemXiaomi()?sheetOem():openDH("openBattery");
const oemXiaomi=()=>/xiaomi|redmi|poco/.test(oem);
function sheetOem(){
  openSheet(`<h3>Hatırlatmalar için bir kez ayar</h3><p class="flush hint">Xiaomi telefonlar, uygulamayı son uygulamalardan kaydırınca hatırlatmaları siler. Bunun için birkaç izin gerekir. Düğmeler doğrudan ilgili ekranı açar.</p>
  <p class="mb-3"><b>1. Son uygulamalarda kilitle.</b> Son uygulamalar ekranında NeoWell kartını basılı tutup kilitle (asma kilit simgesi). Bu en sağlam yoldur.</p>
  <div class="btns"><button class="btn ghost" data-act="oem1">2. Otomatik başlat: NeoWell'i aç</button><button class="btn ghost" data-act="oem2">3. Pil: Kısıtlama yok seç</button></div>
  <p class="hint">4. İlaç alarmının kilitli ekranı açması için: Ayarlar > Uygulamalar > NeoWell > Diğer izinler bölümünde "Kilit ekranında göster" ve "Arka planda açılır pencere göster" izinlerini aç.</p>
  <div class="btns"><button class="btn" data-pm="close">Kapat</button></div>`);
}
async function notifTest(){
  const ln=LN();if(!ln)return toast("Bildirimler yalnızca telefondaki uygulamada çalışır");
  try{
    const p=await ln.checkPermissions();
    let ex="bilinmiyor";try{ex=(await ln.checkExactNotificationSetting()).exact_alarm}catch{}
    const pend=(await ln.getPending()).notifications.length;
    const tr={granted:"açık",denied:"kapalı",prompt:"henüz sorulmadı","prompt-with-rationale":"henüz sorulmadı"};
    notifDiag=`Bildirim izni: ${tr[p.display]||"bilinmiyor"}. Tam saat alarmı: ${tr[ex]||"bilinmiyor"}. Kurulu hatırlatma: ${pend}.`;
    if(p.display!=="granted"){render();return toast("Bildirim izni yok. Telefon ayarlarından NeoWell için bildirimleri aç")}
    await lnSchedule(ln,[{id:99,title:"NeoWell",body:"Test bildirimi çalışıyor",schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true}}]);
    render();toast("5 saniye içinde bildirim gelmeli. İstersen uygulamadan çık");
  }catch(e){notifDiag="Bildirim denemesi yapılamadı. Bildirim iznini kontrol edip tekrar dene.";render()}
}

