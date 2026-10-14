/* ---------- events ---------- */
document.addEventListener("click",ev=>{
  const el=ev.target.closest("[data-tab],[data-act],[data-del],[data-go],[data-range],[data-rc],[data-fv],[data-fva],[data-fvd],[data-tp],[data-tpd],[data-sp],[data-lo],[data-kd],[data-g],[data-sex],[data-actl],[data-thm],[data-c],[data-food],[data-fadd],[data-fp],[data-ml],[data-edit],[data-waterall]");
  if(ev.target.id==="scrim"){
    const typed=[...document.querySelectorAll("#sheet input,#sheet textarea")].some(e=>!e.readOnly&&!["search","checkbox","file"].includes(e.type)&&e.value!==e.defaultValue);
    if(!typed)return closeSheet();
    return confirmSheet({title:"Yazdıkların kaydedilmedi",body:"Pencereyi kapatırsan girdiğin bilgiler silinir.",ok:"Kapat",no:"Yazmaya devam et",danger:true}).then(ok=>{if(ok)closeSheet()});
  }
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
  if(d.edit){sheetEntry(+d.edit);return}
  if(d.waterall){sheetWater();return}
  if(d.del){
    const id=+d.del,rm=Log.find(e=>e.id===id);if(!rm)return;
    const inWater=!!el.closest("#sheet");
    Log.remove(e=>e.id===id);
    if(!commit(()=>Log.restore([rm])))return;
    render();
    if(inWater){el.closest(".prow").remove();if(!$("#sheet [data-del]"))closeSheet()}
    toast("Kayıt silindi",()=>{
      Log.restore([rm]);
      if(!commit(()=>Log.remove(e=>e.id===id)))return;
      render();if(inWater&&$("#sheet").classList.contains("on"))sheetWater();
    });return;
  }
  if(d.sp){document.querySelectorAll("#sp .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));return}
  if(d.food!==undefined){sheetPortion(+d.food);return}
  if(d.fadd!==undefined){quickFood(+d.fadd);return}
  if(d.fp!==undefined){curPor=+d.fp;document.querySelectorAll("#fpc .chip").forEach(c=>c.setAttribute("aria-pressed",c===el));foodPreview();return}
  if(d.rc!==undefined||d.fv!==undefined){const x=d.rc!==undefined?recList[+d.rc]:Nutrition.fav()[+d.fv];if(x)addFoods([x],fday(),`${x.text} eklendi`);return}
  if(d.fva!==undefined){
    const x=recList[+d.fva];if(!x)return;
    if(Nutrition.fav().length>=20)return toast("En fazla 20 favori");
    Nutrition.setFav(LogLib.cleanFav([x,...Nutrition.fav()]));save();$("#frl").innerHTML=favHtml();return;
  }
  if(d.tp!==undefined){const t=Nutrition.tpl()[+d.tp];if(t)addFoods(t.items,fday(),`${t.n}: ${t.items.length} yemek eklendi`);return}
  if(d.tpd!==undefined){const t=Nutrition.tpl()[+d.tpd];confirmSheet({title:"Şablon silinsin mi?",ok:"Sil",danger:true}).then(ok=>{const i=Nutrition.tpl().indexOf(t);if(ok&&i>=0){Nutrition.tpl().splice(i,1);save();const l=$("#frl");if(l)l.innerHTML=favHtml()}});return}
  if(d.fvd!==undefined){Nutrition.fav().splice(+d.fvd,1);save();$("#frl").innerHTML=favHtml();return}
  if(d.act)return Act.run(d.act);
  if(d.go){
    ({cp:goCopy,entry:goEntry,weight:goWeight,food:goFood,nutrition:goNutrition,mydel:goMyDelete,tpl:goTpl,steps:goSteps,exercise:goExercise,note:goNote,restore:goRestore,checkbk:checkBackup,health:goHealth})[d.go]?.();
    if(d.go==="copy")backupText().then(v=>{if(!v)return;(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>toast("Panoya kopyalandı"),()=>{const b=$("#bk");b.value=v;b.select();document.execCommand&&document.execCommand("copy");toast("Metni seçtim, kopyala")})});
    if(d.go==="share"||d.go==="download")exportBackup();
  }
});
$("#tundo").addEventListener("click",undoLast);
document.addEventListener("click",ev=>{const c=ev.target.closest(".qa [data-chip]");if(c){const u=S.settings.chipUse,k=c.dataset.chip;u[k]=(u[k]||0)+1;save()}});
const TOGGLES={mk:"moveKcalOn",rpe:"rpeOn",gdv:"gdVoice",gdb:"gdVib",aw:"awakeOn",comfy:"comfy",hs:"hideStreak",hn:"hideNums"}; // data-<key> checkbox -> boolean setting
document.addEventListener("change",ev=>{
  const t=ev.target;
  if(t.id==="fday"){const sm=t.closest("details.acc")?.querySelector("summary");if(sm)sm.textContent=t.selectedOptions[0].textContent;return}
  if(t.dataset.gi){gInput(t);return}
  const tg=Object.keys(TOGGLES).find(k=>t.dataset[k]!==undefined);
  if(tg){S.settings[TOGGLES[tg]]=t.checked;save();if(tg==="aw")gAwake();if(tg==="comfy"||tg==="hs"||tg==="hn")render();return}
  if(t.dataset.set){
    const k=t.dataset.set,st=S.settings,[lo,hi,int]=RANGES[k],raw=t.value.trim();
    const wk=k==="goalKg",show=x=>x?(wk?dw(x).replace(/,0$/,""):String(x).replace(".",",")):"";
    if(raw===""&&ZEROOK.includes(k)){st[k]=0;save();t.value="";toast(`${SETLBL[k]} kapatıldı`);return}
    const v=wk?Units.wIn(num(raw)):num(raw,int);
    if(isNaN(v)||v<lo||v>hi){t.value=show(st[k]);toast(wk&&wlab()==="lb"?`${SETLBL[k]} ${dw(lo,0)} ile ${dw(hi,0)} ${wlab()} arasında olmalı`:`${SETLBL[k]} ${String(lo).replace(".",",")} ile ${String(hi).replace(".",",")} arasında${int?" tam sayı":""} olmalı`);return}
    const why=k==="kcal"?kcalWhy(v):k==="goalKg"?Algo.goalWhy(v,st.heightCm,weightNow()):k==="macroP"&&Algo.protein(riskInput(weightNow())).doc?"Protein hedefini hekiminle belirle":"";
    if(why){t.value=show(st[k]);toast(why);return}
    st[k]=v;if(k==="age")cAgeGuard();save();t.value=show(v);if(k==="dayStart")dayRoll();return;
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
/* The app day changed (midnight or the day start): a past date being viewed stays on that date, Today stays Today. */
function dayRoll(){
  const k=dayKey();if(k===lastDay)return;
  const n=Algo.dayNum(k)-Algo.dayNum(lastDay);lastDay=k;
  logOff=logOff>0?Math.max(0,Math.min(hgOldest(),logOff+n)):0;
  render();
}
document.addEventListener("visibilitychange",()=>{if(!document.hidden){if(!viewBusy())dayRoll();quickIngest();motionIngest();motionConfigure();motionStatus().then(()=>{if(tab==="settings-modules")render()});stepsSync();renderSoft();cPlateauCheck();abRun();schedDue().then(d=>d&&scheduleReminders().then(setNotif))}});

document.querySelectorAll("[data-ic]").forEach(e=>e.innerHTML=Icons.svg(e.dataset.ic));
render();
cPlateauCheck();
if(loadNote)toast(loadNote);
quickIngest();
if(!obNeeded())noticeGate();
if(!obNeeded())scheduleReminders().then(setNotif); // the first run asks for notifications only after the intro
setInterval(gTick,1000);
const keysP=keysInit().then(render);
abBoot();
if(S.settings.stepsOn&&SC()){SC().start().catch(()=>{});stepsSync();motionBoot()}
setInterval(stepsTick,STEP_POLL);
if(DH())DH().info().then(r=>{oem=String(r.manufacturer||"");render()},()=>{});
if(isNative())pmRefresh();
try{const P=window.Capacitor?.Plugins||{};console.log("NW-DIAG "+["LocalNotifications","Share","Filesystem","App","KeyVault","DeviceHelp","BarcodeScanner","StepCounter","Ocr","Motion","Speech","Widget","BackupFolder","MedWake","Health"].map(n=>n+"="+typeof P[n]).join(" "))}catch{}
setInterval(()=>{if(!viewBusy())dayRoll();if(lastTz&&tzKey()!==lastTz)scheduleReminders().then(setNotif)},60000);
LN()?.addListener?.("localNotificationActionPerformed",notifTap);
function widgetOpen(){tab="today";logOff=0;closeSheet();render();window.scrollTo(0,0)}
WG()?.addListener?.("open",widgetOpen);
const AP=plugin("App");
AP?.addListener?.("backButton",()=>{if(!backKey())AP.exitApp?.()});
/* Android back key: sheet, onboarding step, sub-screen, Today in that order; false exits the app. */
function backKey(){
  if(lockUp())return true;
  if(alarmBack())return true;
  if(cfmDone){cfmDone(false);return true}
  if(gdBack())return true;
  if($("#sheet").classList.contains("on")){closeSheet();return true}
  if(ob.redo&&!ob.step){Object.assign(ob,obFresh());render();return true}
  if(obNeeded()&&ob.step){ob.step--;render();return true}
  if(UP(tab)){goBack();return true}
  if(tab!=="today"||logOff){tab="today";logOff=0;render();return true}
  return false;
}
$("#back").addEventListener("click",goBack);
/* The Coach chat's bottom padding comes from the composer's real height, so the last message never hides behind it (keyboard, landscape, large font). */
function cmpSet(){const c=$("#composer");if(c.hidden)return;document.documentElement.style.setProperty("--cmp",Math.ceil(innerHeight-c.getBoundingClientRect().top)+12+"px")}
if(window.ResizeObserver)new ResizeObserver(cmpSet).observe($("#composer"));
addEventListener("resize",cmpSet);
/* Keyboard: whether or not the screen shrinks (edge to edge) the bottom bar is hidden, fixed areas rise by --kb, and the focused field stays visible. */
{const vv=window.visualViewport;let base=0,lw=innerWidth;
  const kb=()=>{if(!vv)return;const h=vv.height;if(innerWidth!==lw){lw=innerWidth;base=0}base=Math.max(base,innerHeight,h);const open=base-h>120,b=Math.max(0,innerHeight-h-vv.offsetTop),d=document.documentElement.style;
    document.body.classList.toggle("kb",open);d.setProperty("--kb",open?b+"px":"0px");d.setProperty("--vh",h+"px");cmpSet()};
  if(vv){kb();vv.addEventListener("resize",kb);vv.addEventListener("scroll",kb);addEventListener("orientationchange",()=>{base=0;kb()})}
  document.addEventListener("focusin",e=>{if(e.target.matches("input,textarea,select"))setTimeout(()=>e.target.scrollIntoView({block:"center"}),250)});
}
addEventListener("popstate",()=>{if(cfmDone)cfmDone(false);else if($("#sheet").classList.contains("on"))closeSheet();else if(UP(tab))goBack()});
