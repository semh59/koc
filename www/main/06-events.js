/* ---------- olaylar ---------- */
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-tab],[data-act],[data-del],[data-go],[data-range],[data-rc],[data-fv],[data-fva],[data-fvd],[data-tp],[data-tpd],[data-sp],[data-lo],[data-kd],[data-g],[data-sex],[data-actl],[data-thm],[data-c],[data-food],[data-fp],[data-ml],[data-meal],[data-mset],[data-suall]");
  if(ev.target.id==="scrim")return closeSheet();
  if(!el)return;
  const d=el.dataset;
  if(d.tab){via=!PARENT[tab]&&PARENT[d.tab]?{t:d.tab,p:tab}:null;tab=d.tab;render();window.scrollTo(0,0);return}
  if(d.c){cClick(d.c,el);return}
  if(d.g){gClick(d.g,el);return}
  if(d.sex!==undefined){S.settings.sex=d.sex;save();render();return}
  if(d.actl!==undefined){S.settings.act=+d.actl;save();render();return}
  if(d.thm!==undefined){S.settings.theme=d.thm;save();render();return}
  if(d.range){range=+d.range;render();return}
  if(d.kd){weightStep(+d.kd);return}
  if(d.lo){logOff=Math.max(0,Math.min(hgOldest(),logOff+(+d.lo)));render();return}
  if(d.ml){document.querySelectorAll("#fml .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));return}
  if(d.meal){sheetMeal(+d.meal);return}
  if(d.suall){sheetWater();return}
  if(d.mset){const [id,k]=d.mset.split(":"),e=S.entries.find(x=>x.id===+id);if(e){e.meal=k;save();closeSheet();render()}return}
  if(d.del){
    const id=+d.del,rm=S.entries.find(e=>e.id===id);if(!rm)return;
    const inWater=!!el.closest("#sheet");
    S.entries=S.entries.filter(e=>e.id!==id);save();render();if(inWater)sheetWater();
    toast("Kayıt silindi",()=>{S.entries.push(rm);S.entries.sort((a,b)=>a.id-b.id);save();render()});return;
  }
  if(d.sp){document.querySelectorAll("#sp .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));return}
  if(d.food!==undefined){sheetPortion(+d.food);return}
  if(d.fp!==undefined){curPor=+d.fp;document.querySelectorAll("#fpc .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));foodPreview();return}
  if(d.rc!==undefined||d.fv!==undefined){const x=d.rc!==undefined?recList[+d.rc]:S.favFoods[+d.fv];if(x)addFoods([x],fday(),`${x.text} eklendi`);return}
  if(d.fva!==undefined){
    const x=recList[+d.fva];if(!x)return;
    if(S.favFoods.length>=20)return toast("En fazla 20 favori");
    S.favFoods=LogLib.cleanFav([x,...S.favFoods]);save();$("#frl").innerHTML=favHtml();return;
  }
  if(d.tp!==undefined){const t=S.mealTpl[+d.tp];if(t)addFoods(t.items,fday(),`${t.n}: ${t.items.length} yemek eklendi`);return}
  if(d.tpd!==undefined){const t=S.mealTpl[+d.tpd];confirmSheet({title:"Şablon silinsin mi?",ok:"Sil",danger:true}).then(ok=>{const i=S.mealTpl.indexOf(t);if(ok&&i>=0){S.mealTpl.splice(i,1);save();const l=$("#frl");if(l)l.innerHTML=favHtml()}});return}
  if(d.fvd!==undefined){S.favFoods.splice(+d.fvd,1);save();$("#frl").innerHTML=favHtml();return}
  if(d.act)return Act.run(d.act);
  if(d.go){
    ({weight:goWeight,food:goFood,nutrition:goNutrition,mydel:goMyDelete,tpl:goTpl,steps:goSteps,exercise:goExercise,note:goNote,restore:goRestore,health:()=>{S.settings.healthNote=$("#hn").value.trim().slice(0,500);cNoteCheck();save();closeSheet();render();toast("Kaydedildi")}}[d.go]||(()=>{}))();
    if(d.go==="copy")backupText().then(v=>{if(!v)return;(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>toast("Panoya kopyalandı"),()=>{const b=$("#bk");b.value=v;b.select();document.execCommand&&document.execCommand("copy");toast("Metni seçtim, kopyala")})});
    if(d.go==="share")shareBackup();
    if(d.go==="download")backupText().then(v=>{if(!v)return;try{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([v],{type:"application/json"}));a.download=`neowell-yedek-${dayKey()}.json`;a.click();markBackup()}catch(e){toast("İndirme bu cihazda çalışmadı, Kopyala'yı kullan")}});
  }
});
$("#tundo").addEventListener("click",()=>{
  const u=lastUndo;lastUndo=null;
  if(typeof u==="function")u();
  else if(u!=null){S.entries=S.entries.filter(e=>e.id!==u);save();render()}
  $("#toast").classList.remove("on");
});
document.addEventListener("change",ev=>{
  const t=ev.target;
  if(t.id==="bkfile"){
    const f=t.files&&t.files[0];if(!f)return;
    if(f.size>5e6)return toast("Dosya çok büyük, bir NeoWell yedeği olmayabilir");
    f.text().then(x=>{$("#bk").value=x;toast("Dosya okundu. Devam etmek için geri yükle'ye dokun")},()=>toast("Dosya okunamadı"));
    return;
  }
  if(t.dataset.gi){gInput(t);return}
  if(t.dataset.mk!==undefined){S.settings.moveKcalOn=t.checked;save();return}
  if(t.dataset.rpe!==undefined){S.settings.rpeOn=t.checked;save();return}
  if(t.dataset.gdv!==undefined){S.settings.gdVoice=t.checked;save();return}
  if(t.dataset.gdb!==undefined){S.settings.gdVib=t.checked;save();return}
  if(t.dataset.aw!==undefined){S.settings.awakeOn=t.checked;save();gAwake();return}
  if(t.dataset.set){
    const k=t.dataset.set,st=S.settings,[lo,hi,int]=RANGES[k],raw=t.value.trim();
    const wk=k==="goalKg",show=x=>x?(wk?dw(x).replace(/,0$/,""):String(x).replace(".",",")):"";
    if(raw===""&&ZEROOK.includes(k)){st[k]=0;save();t.value="";toast(`${SETLBL[k]} kapatıldı`);return}
    const v=wk?Units.wIn(num(raw)):num(raw,int);
    if(isNaN(v)||v<lo||v>hi){t.value=show(st[k]);toast(wk&&wlab()==="lb"?`${SETLBL[k]} ${dw(lo,0)} ile ${dw(hi,0)} ${wlab()} arasında olmalı`:`${SETLBL[k]} ${String(lo).replace(".",",")} ile ${String(hi).replace(".",",")} arasında${int?" tam sayı":""} olmalı`);return}
    const why=k==="kcal"?kcalWhy(v):"";
    if(why){t.value=show(st[k]);toast(why);return}
    st[k]=v;if(k==="age")cAgeGuard();save();t.value=show(v);return;
  }
  if(t.dataset.rt||t.dataset.ro){
    const r=S.settings.reminders.find(x=>x.id===+(t.dataset.rt||t.dataset.ro));
    if(t.dataset.rt)r.t=t.value||r.t;else r.on=t.checked;
    save();scheduleReminders().then(setNotif);
  }
});
document.addEventListener("input",ev=>{
  const id=ev.target.id;
  if(id==="glq"){gLQ=ev.target.value;gLN=40;$("#gllist").innerHTML=exListHtml();return}
  if(id==="gq"){gQuery=ev.target.value;$("#glist").innerHTML=gPickHtml()}
  else if(id==="fq"){foodAskQ=ev.target.value;$("#flist").innerHTML=foodListHtml(ev.target.value)}
  else if(id==="fqty")foodPreview();
});
document.addEventListener("keydown",ev=>{
  if(ev.key==="Escape"){if(cfmDone)cfmDone(false);else if($("#sheet").classList.contains("on"))closeSheet();else if(!$("#guide").hidden)gdBack()}
  if(ev.key==="Tab"){
    const o=topLayer();
    if(o){
      const f=[...o.querySelectorAll("a[href],button,input,select,textarea,[tabindex]")].filter(e=>e.tabIndex>=0&&!e.disabled&&e.getClientRects().length),a=document.activeElement,i=f.indexOf(a);
      if(f.length&&(!o.contains(a)||(ev.shiftKey?i<=0:i===f.length-1))){ev.preventDefault();f[ev.shiftKey?f.length-1:0].focus()}
    }
  }
  if(ev.key==="Enter"&&ev.target.id==="cmsg"){ev.preventDefault();const i=ev.target,t=i.value;i.value="";cSend(t);return}
  if(ev.key==="Enter"&&ev.target.closest("#sheet")&&ev.target.tagName==="INPUT"&&ev.target.id!=="fq"){const b=$("#sheet [data-go]");if(b)b.click()}
});
document.addEventListener("click",ev=>{const b=ev.target.closest("[data-sr]");if(b){stepRange=+b.dataset.sr;render()}});
$("#sheet").addEventListener("click",ev=>{if(ev.target.closest("[data-shx]"))closeSheet()});
$("#cfm").addEventListener("click",ev=>{if(!cfmDone)return;const b=ev.target.closest("[data-cf]");if(b)cfmDone(b.dataset.cf==="1");else if(ev.target.id==="cfm")cfmDone(false)});
document.addEventListener("visibilitychange",()=>{if(!document.hidden){quickIngest();motionIngest();motionConfigure();motionStatus().then(()=>{if(tab==="settings-modules")render()});stepsSync();renderSoft();cPlateauCheck();abRun();if(Date.now()-lastSched>6*36e5||!exactOk)scheduleReminders().then(setNotif)}});

document.querySelectorAll("[data-ic]").forEach(e=>e.innerHTML=Icons.svg(e.dataset.ic));
render();
cPlateauCheck();
if(loadNote)toast(loadNote);
quickIngest();
scheduleReminders().then(setNotif);
setInterval(gTick,1000);
const keysP=keysInit().then(render);
abBoot();
if(S.settings.stepsOn&&SC()){SC().start().catch(()=>{});stepsSync();motionBoot()}
setInterval(stepsTick,STEP_POLL);
if(DH())DH().info().then(r=>{oem=String(r.manufacturer||"");render()},()=>{});
try{const P=window.Capacitor&&window.Capacitor.Plugins||{};console.log("NW-DIAG "+["LocalNotifications","Share","Filesystem","App","KeyVault","DeviceHelp","BarcodeScanner","StepCounter","Ocr","Motion","Speech","Widget","BackupFolder","MedWake","Health"].map(n=>n+"="+typeof P[n]).join(" "))}catch(e){}
setInterval(()=>{if(dayKey()!==lastDay&&!viewBusy()){lastDay=dayKey();logOff=0;render()}},60000);
try{const ln=LN();if(ln&&ln.addListener)ln.addListener("localNotificationActionPerformed",notifTap)}catch(e){}
function widgetOpen(){tab="today";logOff=0;closeSheet();render();window.scrollTo(0,0)}
try{const wg=WG();if(wg&&wg.addListener)wg.addListener("open",widgetOpen)}catch(e){}
try{
  const AP=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
  if(AP&&AP.addListener)AP.addListener("backButton",()=>{if(!backKey())AP.exitApp&&AP.exitApp()});
}catch(e){}
/* Android geri tuşu: sayfa, onboarding adımı, alt ekran, Bugün sırasıyla; false dönerse uygulamadan çıkılır. */
function backKey(){
  if(lockUp())return true;
  if(alarmBack())return true;
  if(cfmDone){cfmDone(false);return true}
  if(gdBack())return true;
  if($("#sheet").classList.contains("on")){closeSheet();return true}
  if(obNeeded()&&ob.step){ob.step--;render();return true}
  if(UP(tab)){goBack();return true}
  if(tab!=="today"||logOff){tab="today";logOff=0;render();return true}
  return false;
}
$("#back").addEventListener("click",goBack);
/* Koç sohbetinin alt boşluğu yazma alanının gerçek yüksekliğinden gelir: son mesaj alanın arkasında kalmaz (klavye, yatay ekran, büyük yazı tipi). */
function cmpSet(){const c=$("#composer");if(c.hidden)return;document.documentElement.style.setProperty("--cmp",Math.ceil(innerHeight-c.getBoundingClientRect().top)+12+"px")}
if(window.ResizeObserver)new ResizeObserver(cmpSet).observe($("#composer"));
addEventListener("resize",cmpSet);
/* Klavye: ekran küçülse de küçülmese de (kenardan kenara) alt çubuk gizlenir, sabit alanlar --kb kadar yükselir, odaktaki alan görünür kalır. */
{const vv=window.visualViewport;let base=0,lw=innerWidth;
  const kb=()=>{if(!vv)return;const h=vv.height;if(innerWidth!==lw){lw=innerWidth;base=0}base=Math.max(base,innerHeight,h);const open=base-h>120,b=Math.max(0,innerHeight-h-vv.offsetTop),d=document.documentElement.style;
    document.body.classList.toggle("kb",open);d.setProperty("--kb",open?b+"px":"0px");d.setProperty("--vh",h+"px");cmpSet()};
  if(vv){kb();vv.addEventListener("resize",kb);vv.addEventListener("scroll",kb);addEventListener("orientationchange",()=>{base=0;kb()})}
  document.addEventListener("focusin",e=>{if(e.target.matches("input,textarea,select"))setTimeout(()=>e.target.scrollIntoView({block:"center"}),250)});
}
addEventListener("popstate",()=>{if(cfmDone)cfmDone(false);else if($("#sheet").classList.contains("on"))closeSheet();else if(UP(tab))goBack()});
