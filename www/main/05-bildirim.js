/* ---------- bildirimler (yalnızca APK) ---------- */
const WATER_REM=[2,3,4],BACKUP_REM=10,WEEKLY_REM=12;
const SCHED_DAYS=30;let lastSched=0,exactOk=true,fsiOk=true;
const LN=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.LocalNotifications;
async function scheduleReminders(){
  const ln=LN();if(!ln||recovery)return "web";
  try{
    let p=await ln.checkPermissions();
    if(p.display!=="granted")p=await ln.requestPermissions();
    if(p.display!=="granted")return "denied";
    /* Android 14+ tam saat alarm iznini yeni kurulumda vermez; eklenti o zaman alarmı yaklaşık saate kurar, kullanıcıya söylenir. */
    try{const v=(await ln.checkExactNotificationSetting()).exact_alarm!=="denied";if(v!==exactOk){exactOk=v;if(tab==="bugun")render()}}catch(e){}
    /* Tam ekran bildirim izni (Android 14+): kapalıysa ilaç alarmı kilitli ekranı açmaz; kullanıcıya söylenir. */
    try{const w=MW();if(w){const v=(await w.fsi()).allowed!==false;if(v!==fsiOk){fsiOk=v;if(tab==="bugun")render()}}}catch(e){}
    try{
      const dl=await ln.getDeliveredNotifications(),t1=dayKey(),y=keyOff(-1),gone=[];
      for(const n of dl.notifications){
        if(n.id===9100&&!S.fast.t0)gone.push({id:9100});
        if(n.id===CycleLib.NID&&!cycNotif())gone.push({id:n.id});
        if(n.id<1000000)continue;
        const d=MedLib.doseOfId(S.meds,n.id);
        if(!d||MedLib.statusOf(S.medLog,d.m.id,t1,d.slot)||MedLib.statusOf(S.medLog,d.m.id,y,d.slot))gone.push({id:n.id});
      }
      if(gone.length)await ln.removeDeliveredNotifications({notifications:gone});
    }catch(e){}
    const pend=await ln.getPending();
    const pn=pend.notifications.filter(n=>n.id!==9001&&n.id!==9002&&n.id!==GD_NID&&n.id!==MED_TEST_NID&&n.id!==AlarmLib.SNOOZE_NID);if(pn.length)await ln.cancel({notifications:pn.map(n=>({id:n.id}))});
    /* Eklentinin günlük tekrarı ilk bildirimden sonra Doze'da ertelenen bir alarm kurar. Bu yüzden her günü ayrı, uyku modunu delen tek seferlik alarmla kuruyoruz. */
    try{await ln.registerActionTypes({types:[{id:"water",actions:[{id:"su",title:`+${S.settings.glass} ml`}]},{id:"med",actions:[{id:"med",title:"✔ Aldım"},{id:"medskip",title:"Atla"}]}]})}catch(e){}
    const list=[],now=Date.now(),lb=S.settings.lastBackup;
    const t0=dayKey(),waterDone=sum("su",t0,t0)>=S.settings.waterMl,fastBlock=!!risk().block;
    for(const r of S.settings.reminders.filter(r=>r.on&&!(r.id===11&&fastBlock))){
      const [h,m]=r.t.split(":").map(Number),water=WATER_REM.includes(r.id);
      for(let i=0;i<SCHED_DAYS;i++){
        if(i===0&&waterDone&&water)continue;
        const at=addDays(i);at.setHours(h,m,0,0);
        if(r.dow!=null&&at.getDay()!==r.dow)continue;
        if(r.id===BACKUP_REM&&(S.entries.length<10||(lb&&Algo.dayNum(dayKey(at))-Algo.dayNum(lb)<7)))continue;
        if(at.getTime()>now+5000)list.push(Object.assign({id:r.id*100+i,title:r.title,body:r.body,schedule:{at,allowWhileIdle:true}},water?{actionTypeId:"water",extra:{act:"su",v:S.settings.glass,at:at.getTime()}}:r.id===WEEKLY_REM?{extra:{act:"open",tab:"koc"}}:r.id===BACKUP_REM?{extra:{act:"open",tab:"ayar-veri"}}:{}));
      }
    }
    lastSched=now;
    if(S.settings.medOn){
      for(const n of MedLib.notifications(S.meds,S.medLog,new Date(),SCHED_DAYS,S.settings.medShowName))list.push({id:n.id,title:n.title,body:n.body,schedule:{at:n.at,allowWhileIdle:true},actionTypeId:n.actionTypeId,extra:n.extra,channelId:n.channelId,ongoing:n.ongoing});
    }
    const cn=cycNotif();if(cn)list.push(cn);
    if(S.fast.t0&&!fastBlock){const at=new Date(S.fast.t0+S.fast.plan*36e5);if(at.getTime()>now+5000)list.push({id:9100,title:"⏳ Oruç",body:"Oruç süren doldu. İstediğinde bitirebilirsin.",schedule:{at,allowWhileIdle:true}})}
    // Android uygulama başına eşzamanlı alarm sınırı (500): en yakın tarihliler korunur, uzaktakiler uygulama açılınca yeniden kurulur.
    list.sort((a,b)=>a.schedule.at-b.schedule.at);if(list.length>MedLib.BUDGET)list.length=MedLib.BUDGET;
    const tk=await quickToken();if(tk)for(const n of list)if(n.extra&&(n.extra.act==="su"||n.extra.act==="med"))n.extra.tk=tk;
    if(list.length)await ln.schedule({notifications:list});
    /* Bildirim eklentisi kilitli ekranı yakmaz: ilaç dozlarında (hatırlatma tekrarları hariç) ayrı alarm ekranı kısa süre uyandırır. */
    const mw=window.Capacitor.Plugins.MedWake;if(mw)await mw.set({times:MedLib.wakeTimes(list),doses:MedLib.wakeDoses(list)}).catch(()=>{});
    return "ok";
  }catch(e){return "Bildirimler kurulamadı: "+(e&&e.message||e)}
}
/* Yalnız bildirime dokunma ("tap"); su/ilaç düğmeleri QuickLogPlugin'de yerelde yakalanır. Koç izni yoksa haftalık özet Trend'de açılır, yedek hatırlatması Veri ve yedek'te. */
function notifTap(e){
  const x=e&&e.notification&&e.notification.extra;
  if(!e||e.actionId!=="tap"||!x||(x.act!=="open"&&x.act!=="med"))return;
  tab=x.act==="med"||x.tab==="ilac"?(S.settings.medOn?"ilac":"daha"):x.tab==="koc"&&S.settings.consent?"koc":x.tab==="dongu"&&S.settings.cycleOn?"dongu":x.tab==="ayar-veri"?x.tab:"trend";via=null;closeSheet();render();window.scrollTo(0,0);
  if(x.act==="med")setTimeout(()=>alarmOpen({quiet:true}),0);
}
function setNotif(s){notifStatus=s;if(tab==="ayar-hatir")render()}
/* İzin verilince önceki yaklaşık alarmlar kendiliğinden tam saate dönmez; yeniden kurulur. */
async function exactAsk(){
  const ln=LN();if(!ln)return;
  try{exactOk=(await ln.changeExactNotificationSetting()).exact_alarm!=="denied"}catch(e){return toast("Ayar ekranı açılamadı, telefon ayarlarında Alarmlar ve hatırlatıcılar'ı bul")}
  setNotif(await scheduleReminders());render();
  toast(exactOk?"Hatırlatmalar tam saatinde çalacak":"İzin verilmedi. Hatırlatmalar birkaç dakika gecikebilir");
}
const SC=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.StepCounter;
/* stepsRead: açılıştaki ilk sensör okuması bitmeden dünkü adım henüz yazılmamış olabilir, "sayım durdu" kartı yanlış çıkmasın. */
let stepToday=null,stepSnapAt=0,stepsRead=false;
/* Günün adımı 0'a inince kayıt silinir: kayıtlarda sıfır adım geçersizdir, yeniden açılışta "geçersiz kayıt atıldı" uyarısı verirdi. */
function stepZero(e){if(!(e.v>0))S.entries.splice(S.entries.indexOf(e),1)}
function setSteps(day,v){
  if(!(v>=0&&v<=200000)||day<S.settings.stepsFrom)return false; // silinen adımlar sensör geçmişinden geri yazılmaz
  const e=S.entries.find(x=>x.type==="adim"&&x.day===day&&x.text!=="elle");
  if(e){const m=Math.max(v,e.hc||0);if(e.v===m&&(e.ph===v||!e.hc))return false;e.ph=v;e.v=m;stepZero(e)} // 0 da geçerli: sayaç sıfırlanınca eski şişmiş kayıt düzelir
  else if(v>0)S.entries.push({id:S.nextId++,day,time:"00:00",type:"adim",v,ph:v,text:""});
  else return false;
  return true;
}
/* Health Connect (saat) günlük adımı: gün değeri telefon (ph) ile saatin (hc) büyüğüdür, asla toplamı değil. Eski kayıtta ph yoksa v telefon değeridir. */
function setHc(day,v){
  if(!(v>=0&&v<=200000)||day<S.settings.stepsFrom)return false;
  const e=S.entries.find(x=>x.type==="adim"&&x.day===day&&x.text!=="elle");
  if(e){if(e.hc===v)return false;const ph=e.ph!=null?e.ph:e.v;e.ph=ph;e.hc=v;e.v=Math.max(ph,v);stepZero(e)}
  else if(v>0)S.entries.push({id:S.nextId++,day,time:"00:00",type:"adim",v,ph:0,hc:v,text:""});
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
    if(ch){save();if((tab==="bugun"||tab==="adim")&&!$("#sheet").classList.contains("on")&&!viewBusy())render();else widgetPush()}
  }catch(e){}
}
/* Açıkken canlı adım: görünürken kısa aralıkla okunur; önceki okuma (sensör yanıtsızsa 4 sn sürer) bitmeden yenisi başlamaz. */
const STEP_POLL=3000;let stepBusy=false;
function stepsTick(){
  if(document.hidden||stepBusy||(tab!=="bugun"&&tab!=="adim"))return;
  stepBusy=true;return stepsSync().finally(()=>{stepBusy=false});
}
const manualSteps=()=>S.entries.filter(e=>e.type==="adim"&&e.text==="elle"&&e.day===dayKey()).reduce((s,e)=>s+e.v,0);
const stepsShown=()=>{const hn=hcNow(),t=Math.max(stepToday==null?-1:stepToday,hn==null?-1:hn);return t<0?null:t+manualSteps()};
function sheetAdim(){openSheet(`<h3>Adım ekle (elle)</h3><p class="flush hint">Telefonu taşımadığın adımlar için. Sensör değerine eklenir.</p><input class="in num" id="fv" inputmode="numeric" placeholder="Adım sayısı" autofocus>${dayOptions()}<button class="btn" data-go="adim">Ekle</button>`)}
function goAdim(){
  const n=num($("#fv").value,true);
  if(!(n>=1&&n<=100000))return toast("Adımı 1 ile 100.000 arasında yaz");
  const e=add("adim",n,"elle",fday());closeSheet();render();toast(`${Math.round(n).toLocaleString("tr-TR")} adım eklendi`,e.id);
}
function stepCard(){
  const g=S.settings.stepGoal,v=Math.round(stepsShown()||0),n=stepsShown()==null?null:v,f=x=>x.toLocaleString("tr-TR"),ok=n!=null&&n>=g;
  return `<button class="rbtn" data-tab="adim" aria-label="Adım raporunu aç">${ring(v/g,"var(--prim)",n==null?"–":ok?"✓":f(g-n),"Adım",`${n==null?"–":f(n)} / ${f(g)}`,ok?"Hedef tamam":n==null?"":"adım kaldı","mini"+(ok?" done":""))}</button>`;
}
let stepRange=14;
function viewAdim(){
  const st=S.settings,fm=x=>Math.round(x).toLocaleString("tr-TR"),L=120;
  const all=[];for(let i=L-1;i>=0;i--){const k=keyOff(-i);all.push({k,v:sum("adim",k,k),d:addDays(-i)})}
  const N=stepRange||new Date().getDate(),days=all.slice(-N),vals=days.map(d=>d.v);
  const today=stepsShown()==null?all[L-1].v:stepsShown(),max=Math.max(st.stepGoal,...vals,1);
  const g=st.stepGoal,sr=Algo.stepStats(vals,g),s7=Algo.stepStats(all.slice(-7).map(d=>d.v),g),s30=Algo.stepStats(all.slice(-30).map(d=>d.v),g),sl=Algo.stepStats(all.map(d=>d.v),g);
  const best=sr.best>=0?days[sr.best]:null;
  const W=320,H=130,pl=12,gap=N>14?2:6,bw=Math.min(16,(W-2*pl-gap*(N-1))/N),step=N>1?(W-2*pl-bw)/(N-1):0,Y=v=>H-18-(H-30)*(v/max);
  const bars=days.map((d,i)=>{const x=N>1?pl+i*step:(W-bw)/2,y=Y(d.v),hit=d.v>=g,cx=(x+bw/2).toFixed(1);
    const lbl=N<=7?GUNK[d.d.getDay()]:(i%7===0||i===N-1)&&(i===N-1||N-1-i>=4)?fd(d.k):"";
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,H-18-y).toFixed(1)}" rx="${bw>8?4:1.5}" fill="var(--su)" opacity="${hit?1:.45}"/>${lbl?`<text x="${cx}" y="${H-5}" text-anchor="${N<=7?"middle":i===0?"start":i===N-1?"end":"middle"}">${lbl}</text>`:""}${hit&&N<=14?`<text x="${cx}" y="${(y-3).toFixed(1)}" text-anchor="middle" style="fill:var(--ink)">✓</text>`:""}`}).join("");
  const seg=`<div class="seg" role="group" aria-label="Grafik aralığı">${[[7,"7 gün"],[14,"14 gün"],[30,"30 gün"],[0,"Bu ay"]].map(([n,l])=>`<button data-sr="${n}" aria-pressed="${stepRange===n}" style="padding:7px 12px">${l}</button>`).join("")}</div>`;
  const chartBody=sr.n?`<svg class="w100 bars" viewBox="0 0 ${W} ${H}" role="img" aria-label="Son ${N} günün adımları">${bars}<line x1="0" x2="${W}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" stroke="var(--kcal)" stroke-width="1.4" stroke-dasharray="4 3"/></svg><div class="mut sm">Kesik çizgi hedef. ${N<=14?"✓ ve koyu":"Koyu"} çubuk: hedefe ulaşılan gün.</div>`:`<p class="hint">Bu aralıkta adım kaydı yok.</p>`;
  const wAll=weights(),wd=Object.keys(wAll).sort(),kg=wd.length?Algo.trend(wAll)[wd[wd.length-1]]:null;
  const km=st.heightCm>0?today*st.heightCm*0.415/1e5:null;
  const extra=km!=null?`<div class="stat"><div class="k">Yaklaşık mesafe</div><div class="v num">${fmt(km,1)} km</div></div>${kg!=null?`<div class="stat"><div class="k">Yaklaşık enerji</div><div class="v num">${Math.round(0.5*kg*km)} kcal</div></div>`:""}`:"";
  const rows=all.slice(-7).reverse().map(d=>`<div class="row"><span>${d.k===dayKey()?"Bugün":GUNK[d.d.getDay()]+" "+fd(d.k)}</span><b class="num">${d.v?fm(d.v):"–"}</b></div>`).join("");
  const man=S.entries.filter(e=>e.type==="adim"&&e.text==="elle").sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id).map(e=>`<div class="row"><span>${fd(e.day)}</span><b class="num">+${fm(e.v)}</b><button class="del" data-del="${e.id}" aria-label="Kaydı sil">✕</button></div>`).join("");
  /* Hiç adım yokken sayaç ve istatistik duvarı yerine tek cümle ve yürüyüş başlatma. */
  if(!sl.n&&!today&&!S.walk)return `${emptyCard("adim","Henüz adım kaydı yok","Telefonu yanında taşıdıkça adımların burada görünür.",`<button class="btn" data-w="start">Yürüyüş başlat</button>`)}
  ${hcCard()}${motionCard()}
  <div class="card"><div class="lbl">Elle eklenenler</div>${man||'<p class="hint">Elle eklediğin adım yok.</p>'}<button class="lnk" data-act="adimekle">Adım ekle (elle)</button></div>`;
  return `<div class="tc card">${ring(today/st.stepGoal,"var(--su)",fm(today),"Bugün",`/ ${fm(st.stepGoal)} adım`,"adım")}</div>
  ${walkCard()}
  <div class="card"><div class="lbl">Adım grafiği</div>${seg}${chartBody}</div>
  <div class="stats"><div class="stat"><div class="k">7 gün ortalaması</div><div class="v num">${s7.n?fm(s7.avg):"–"}</div></div><div class="stat"><div class="k">30 gün ortalaması</div><div class="v num">${s30.n?fm(s30.avg):"–"}</div></div><div class="stat"><div class="k">En iyi gün</div><div class="v num">${best?fm(best.v):"–"}</div>${best?`<div class="mut sm">${fd(best.k)}</div>`:""}</div><div class="stat"><div class="k">Hedef serisi</div><div class="v num">${sl.streak} gün</div></div><div class="stat"><div class="k">Hedefe ulaşılan gün</div><div class="v num">${sr.hit} / ${N}</div></div>${extra}</div>
  ${motionCard()}
  <div class="card"><div class="lbl">Günler</div>${rows}</div>
  ${hcCard()}
  <div class="card"><div class="lbl">Elle eklenenler</div>${man||'<p class="hint">Elle eklediğin adım yok.</p>'}<button class="lnk" data-act="adimekle">Adım ekle (elle)</button></div>
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
  }catch(e){toast("Adım sayar açılamadı")}
}
let notifDiag="",oem="";
const DH=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.DeviceHelp;
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
    let ex="bilinmiyor";try{ex=(await ln.checkExactNotificationSetting()).exact_alarm}catch(e){}
    const pend=(await ln.getPending()).notifications.length;
    notifDiag=`Bildirim izni: ${p.display}. Tam saat alarmı: ${ex}. Kurulu hatırlatma: ${pend}.`;
    if(p.display!=="granted"){render();return toast("Bildirim izni yok. Telefon ayarlarından NeoWell için bildirimleri aç")}
    await ln.schedule({notifications:[{id:99,title:"NeoWell",body:"Test bildirimi çalışıyor",schedule:{at:new Date(Date.now()+5000),allowWhileIdle:true}}]});
    render();toast("5 saniye içinde bildirim gelmeli. İstersen uygulamadan çık");
  }catch(e){notifDiag="Hata: "+(e&&e.message||e);render()}
}

