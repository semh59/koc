/* ---------- notifications (APK only) ---------- */
const WATER_REM=[2,3,4],BACKUP_REM=10,WEEKLY_REM=12,FAST_NID=9100;
const SCHED_DAYS=30,LEAD_MS=5000,RESCHEDULE_MS=6*36e5;let lastSched=0,exactOk=true,fsiOk=true,medBudgetMsg="";
const LN=()=>plugin("LocalNotifications");
/* Plugin 8.3+ opens the system "Alarms & reminders" screen on every schedule() with an exact alarm while the permission is missing; the exact flag follows the permission so it never does. */
async function lnSchedule(ln,list){
  const isExactNotification=(await ln.checkExactNotificationSetting()).exact_alarm!=="denied";
  return ln.schedule({notifications:list.map(n=>({...n,isExactNotification}))});
}
let notifAsked=false; // the system dialog is shown once per app run; a refusal is handled from the permissions centre
async function scheduleReminders(){
  const ln=LN();if(!ln||recovery)return "web";
  try{
    let p=await ln.checkPermissions();
    if(p.display!=="granted"&&!notifAsked){notifAsked=true;p=await ln.requestPermissions()}
    if(p.display!=="granted")return "denied";
    /* Android 14+ does not grant the exact-alarm permission on a fresh install; the plugin then sets the alarm to an approximate time, and the user is told. */
    try{const v=(await ln.checkExactNotificationSetting()).exact_alarm!=="denied";if(v!==exactOk){exactOk=v;if(tab==="today")render()}}catch{}
    /* Full-screen notification permission (Android 14+): when off, the medication alarm does not open the locked screen; the user is told. */
    try{const w=MW();if(w){const v=(await w.fsi()).allowed!==false;if(v!==fsiOk){fsiOk=v;if(tab==="today")render()}}}catch{}
    try{
      const dl=await ln.getDeliveredNotifications(),t1=dayKey(),y=keyOff(-1),gone=[];
      for(const n of dl.notifications){
        if(n.id===FAST_NID&&!Habits.fast().t0)gone.push({id:FAST_NID});
        if(n.id===CycleLib.NID&&!cycNotif())gone.push({id:n.id});
        if(n.id<1000000)continue;
        const d=MedLib.doseOfId(Meds.meds(),n.id);
        if(!d||MedLib.statusOf(Meds.log(),d.m.id,t1,d.slot)||MedLib.statusOf(Meds.log(),d.m.id,y,d.slot))gone.push({id:n.id});
      }
      if(gone.length)await ln.removeDeliveredNotifications({notifications:gone});
    }catch{}
    const pend=await ln.getPending();
    /* Not ours to reset: the gym timers (9001 set, 9002 rest) and the guide, medication test and snooze notifications are scheduled elsewhere. */
    const keep=new Set([9001,9002,GD_NID,MED_TEST_NID,AlarmLib.SNOOZE_NID]);
    const pn=pend.notifications.filter(n=>!keep.has(n.id));if(pn.length)await ln.cancel({notifications:pn.map(n=>({id:n.id}))});
    /* The plugin's daily repeat sets an alarm that Doze defers after the first notification. So every day is scheduled as its own one-shot alarm that pierces idle mode. */
    try{await ln.registerActionTypes({types:[{id:"water",actions:[{id:"water",title:`+${S.settings.glass} ml`}]},{id:"med",actions:[{id:"med",title:"✓ Aldım"},{id:"medskip",title:"Atla"}]},{id:"medgrp",actions:[{id:"med",title:"✓ Hepsini aldım"}]}]})}catch{}
    let list=[];const medList=[],now=Date.now(),lb=S.settings.lastBackup;
    const t0=dayKey(),waterDone=sum("water",t0,t0)>=S.settings.waterMl,fastBlock=!!risk().block;
    const preg=risk().pregnant;
    for(const r of S.settings.reminders.filter(r=>r.on&&!(r.id===11&&fastBlock)&&!(preg&&PREG_OFF.includes(r.id)))){
      const [h,m]=r.t.split(":").map(Number),water=WATER_REM.includes(r.id);
      for(let i=0;i<SCHED_DAYS;i++){
        if(i===0&&waterDone&&water)continue;
        const at=addDays(i);at.setHours(h,m,0,0);
        if(r.dow!=null&&at.getDay()!==r.dow)continue;
        if(r.id===BACKUP_REM&&(Log.all().length<10||(lb&&Algo.dayNum(dayKey(at))-Algo.dayNum(lb)<7)))continue;
        if(at.getTime()>now+LEAD_MS)list.push(Object.assign({id:r.id*100+i,title:r.title,body:r.body,schedule:{at,allowWhileIdle:true}},water?{actionTypeId:"water",extra:{act:"water",v:S.settings.glass,at:at.getTime()}}:r.id===WEEKLY_REM?{extra:{act:"open",tab:"coach"}}:r.id===BACKUP_REM?{extra:{act:"open",tab:"settings-data"}}:{}));
      }
    }
    lastSched=now;
    if(S.settings.medOn){
      for(const n of MedLib.notifications(Meds.meds(),Meds.log(),new Date(),SCHED_DAYS,S.settings.medShowName))medList.push({id:n.id,title:n.title,body:n.body,schedule:{at:n.at,allowWhileIdle:true},actionTypeId:n.actionTypeId,extra:n.extra,channelId:n.channelId,ongoing:n.ongoing});
      for(const n of MedLib.notices(Meds.meds(),new Date(),S.settings.medShowName))medList.push({id:n.id,title:n.title,body:n.body,schedule:{at:n.at,allowWhileIdle:true},extra:n.extra});
    }
    for(const n of Habits.ramReminders(now,LEAD_MS,SCHED_DAYS))list.push({id:n.id,title:n.title,body:n.body,schedule:{at:new Date(n.at),allowWhileIdle:true}});
    const cn=cycNotif();if(cn)list.push(cn);
    if(Habits.fast().t0&&!fastBlock){const at=new Date(Habits.fast().t0+Habits.fast().plan*36e5);if(at.getTime()>now+LEAD_MS)list.push({id:FAST_NID,title:"⏳ Oruç",body:"Oruç süren doldu. İstediğinde bitirebilirsin.",schedule:{at,allowWhileIdle:true}})}
    /* Android caps simultaneous alarms per app (500): medication first, repeats last; farther ones are rescheduled when the app opens, and the user is told. */
    const fit=MedLib.fit(medList,list,MedLib.BUDGET,now),msg=S.settings.medOn?MedLib.budgetText(fit):"";
    list=fit.list;
    if(msg!==medBudgetMsg){medBudgetMsg=msg;if(tab==="today")render()}
    const tk=await quickToken();if(tk)for(const n of list)if(n.extra&&(n.extra.act==="water"||n.extra.act==="med"))n.extra.tk=tk;
    if(list.length)await lnSchedule(ln,list);
    /* The notification plugin does not light the locked screen: for medication doses (reminder repeats excluded) a separate alarm screen wakes it briefly. */
    const mw=MW();if(mw)await mw.set({times:MedLib.wakeTimes(list),doses:MedLib.wakeDoses(list,Meds.meds(),S.settings.medShowName)}).catch(()=>{});
    return "ok";
  }catch(e){return "Bildirimler kurulamadı. Bildirim iznini kontrol edip tekrar dene"}
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
    await lnSchedule(ln,[{id:99,title:"NeoWell",body:"Test bildirimi çalışıyor",schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true}}]);
    render();toast("5 saniye içinde bildirim gelmeli. İstersen uygulamadan çık");
  }catch(e){notifDiag="Bildirim denemesi yapılamadı. Bildirim iznini kontrol edip tekrar dene.";render()}
}

