"use strict";
/* Tam ekran ilaç alarm ekranı. Ekranı uyandıran alarm (MedWake) uygulamayı kilit ekranı üstünde açınca ya da ilaç bildirimine dokununca açılır.
   index.html'deki S, save, render, trap, toast, esc, MW, LN ve medui.js'teki medNowHM, medResched ile çalışır. */
const ALARM_TEST_KEY="nw_alarm_test";
let alarm=null;

function alarmEl(){
  let d=document.getElementById("alarm");
  if(!d){
    d=document.createElement("div");d.id="alarm";d.hidden=true;
    for(const [k,v] of [["role","alertdialog"],["aria-modal","true"],["aria-labelledby","alt"],["aria-describedby","allead"]])d.setAttribute(k,v);
    d.innerHTML=`<div class="alw" id="albody"></div><p class="vh" aria-live="polite" id="allive"></p>`;
    document.body.append(d);
  }
  return d;
}
const alarmShowName=()=>S.settings.medShowName!==false;

function alarmDraw(){
  const a=alarm,v=AlarmLib.view(a.items,alarmShowName()),done=AlarmLib.allDone(a.items);
  const st=i=>i.st==="t"?"Alındı":i.st==="s"?"Atlandı":"Test";
  const rows=v.rows.map((r,k)=>{
    const i=a.items[k],lab=alarmShowName()?`${r.name} ${r.slot}`:`${r.slot} dozu`;
    return `<div class="row wrap"><span class="grow"><b>${esc(r.name)}</b><small class="db mut"><span class="num">${r.slot}</span>${r.dose?" · "+esc(r.dose):""}</small></span>${i.st
      ?`<b class="alst">${Icons.svg("check")} ${st(i)}</b>`
      :`<span class="alact"><button class="btn" data-al="t:${k}" aria-label="${esc(lab)}: aldım">${Icons.svg("check")} Aldım</button><button class="btn ghost" data-al="s:${k}" aria-label="${esc(lab)}: atla">Atla</button></span>`}</div>`;
  }).join("");
  const left=a.items.filter(i=>!i.st).length;
  alarmEl();$("#allive").textContent=a.say||"";
  $("#albody").innerHTML=`
    <div class="alclk num" aria-hidden="true">${AlarmLib.hm(new Date())}</div>
    <h2 id="alt" tabindex="-1">${a.test?"İlaç zamanı (test)":"İlaç zamanı"}</h2>
    <p id="allead" class="allead">${esc(done&&a.items.length?(a.test?"Test tamam. Kayıtların değişmedi.":"Tüm dozlar alındı."):v.lead)}${v.count&&!done?` <span class="num">${v.count}</span>`:""}</p>
    ${rows?`<div class="card">${rows}</div>`:""}
    <div class="albar">${left>1?`<button class="btn ghost" data-al="all">Hepsini aldım</button>`:""}${left?`<button class="btn ghost" data-al="snooze">10 dk sonra hatırlat</button>`:""}<button class="lnk" data-al="open">Uygulamayı aç</button></div>`;
}

/* o.test: Ayarlar testi (gerçek kayda dokunmaz). o.quiet: gösterilecek doz yoksa hiç açılmaz (bildirime geç dokunma). */
function alarmOpen(o={}){
  if(typeof recovery!=="undefined"&&recovery)return;
  if(!o.test&&!S.settings.medOn)return alarmRelease();
  const now=new Date(),items=o.test?AlarmLib.testItems(S.meds,now):AlarmLib.due(S.meds,S.medLog,now);
  if(!items.length&&o.quiet&&!alarm)return;
  if(alarm){ // açıkken yeni uyandırma: liste tazelenir, işaretlenenler kalır
    const old=new Map(alarm.items.map(i=>[i.m+"|"+i.day+"|"+i.slot,i.st]));
    for(const i of items)i.st=old.get(i.m+"|"+i.day+"|"+i.slot);
    alarm.items=items.length?items:alarm.items;alarm.test=!!o.test;
  }else{
    alarm={items,test:!!o.test,from:document.activeElement,tick:setInterval(()=>{const c=document.querySelector("#alarm .alclk");if(c)c.textContent=AlarmLib.hm(new Date())},15000)};
  }
  const d=alarmEl();alarmDraw();d.hidden=false;document.body.classList.add("alon");trap();
  $("#alt").focus({preventScroll:true});
  if(!items.length||AlarmLib.allDone(alarm.items))alarmAuto();
}
function alarmAuto(){clearTimeout(alarm.auto);alarm.auto=setTimeout(alarmClose,1500)}
function alarmRelease(){const w=MW();if(w&&w.release)w.release().catch(()=>{})}
function alarmClose(){
  if(!alarm)return;
  const f=alarm.from;clearInterval(alarm.tick);clearTimeout(alarm.auto);alarm=null;
  const d=alarmEl();d.hidden=true;$("#albody").innerHTML="";$("#allive").textContent="";document.body.classList.remove("alon");trap();
  if(f&&f.isConnected)f.focus({preventScroll:true});
  alarmRelease();
}
/* İşaretleme bildirimdeki "Aldım" ile aynı kayıt: MedLib.mark + save + medResched (alınan dozun bekleyen tekrar bildirimleri iptal olur). */
function alarmMark(ks,st){
  const a=alarm,list=ks.map(k=>a.items[k]).filter(i=>i&&!i.st);if(!list.length)return;
  if(a.test)list.forEach(i=>{i.st="test"});
  else{
    const at=medNowHM(),undo=[];
    for(const i of list){const r=MedLib.mark(S,i.m,i.day,i.slot,st,st==="t"?at:undefined);if(r){undo.push(r);i.st=st}}
    if(!save()){undo.reverse().forEach(r=>r.undo());list.forEach(i=>{i.st=undefined});a.say="Kaydedilemedi, depolama dolu";alarmDraw();return}
    render();medResched();
  }
  a.say=list.length>1?"Hepsi kaydedildi":(alarmShowName()?list[0].n+" ":"")+(st==="t"?"alındı":"atlandı");
  alarmDraw();
  const next=document.querySelector('#alarm [data-al^="t:"]');(next||$("#alt")).focus({preventScroll:true});
  if(AlarmLib.allDone(a.items)){if(!a.test)alarmSnoozeCancel();alarmAuto()}
}
function alarmSnoozeCancel(){const ln=LN(),w=MW();if(ln)ln.cancel({notifications:[{id:AlarmLib.SNOOZE_NID}]}).catch(()=>{});if(w&&w.snooze)w.snooze({at:0}).catch(()=>{})}
/* Erteleme: doz işaretlenmez; 10 dk sonra tek seferlik ilaç bildirimi ve ekranı yeniden uyandıran alarm. */
async function alarmSnooze(){
  const a=alarm;if(!a)return;
  if(a.test){alarmClose();return toast("Test: gerçek ertelemede 10 dakika sonra yeniden hatırlatılır")}
  const at=AlarmLib.snoozeAt(Date.now()),ln=LN(),w=MW(),items=a.items.filter(i=>!i.st);
  try{
    if(ln)await ln.schedule({notifications:[AlarmLib.snoozeNote(items,alarmShowName(),at)]});
    if(w&&w.snooze)await w.snooze({at});
    alarmClose();toast("10 dakika sonra yeniden hatırlatacağım");
  }catch(e){a.say="Erteleme kurulamadı";alarmDraw()}
}
/* Android geri tuşu ve Escape: alarm ekranı kapanır, uygulama açılır (dozlar işaretlenmez, bildirimler sürer). */
function alarmBack(){if(!alarm)return false;alarmClose();return true}

/* Uyandırma: MainActivity imzalı intent'te zaman yazar, wakeLaunched bir kez okur. Ayarlar testine 2 dk içinde gelen uyandırma test modudur. */
async function alarmWake(){
  const w=MW();if(!w||!w.wakeLaunched)return;
  let r;try{r=await w.wakeLaunched()}catch(e){return}
  if(!r||r.launched!==true)return;
  let rec=null;try{rec=JSON.parse(localStorage.getItem(ALARM_TEST_KEY))}catch(e){}
  const test=AlarmLib.isTest(rec,Date.now());
  try{if(rec)localStorage.removeItem(ALARM_TEST_KEY)}catch(e){}
  alarmOpen({test});
}

document.addEventListener("click",ev=>{
  const t=ev.target.closest("[data-md=locktest],[data-md=realtest]");
  if(t)try{localStorage.setItem(ALARM_TEST_KEY,JSON.stringify({to:Date.now()+(t.dataset.md==="locktest"?15000:60000)+120000}))}catch(e){}
  const b=ev.target.closest("#alarm [data-al]");if(!b||!alarm)return;
  const [k,n]=b.dataset.al.split(":");
  if(k==="t"||k==="s")alarmMark([+n],k);
  else if(k==="all")alarmMark(alarm.items.map((_,i)=>i),"t");
  else if(k==="snooze")alarmSnooze();
  else if(k==="open"){alarmClose();widgetOpen()}
},true);
document.addEventListener("keydown",ev=>{if(alarm&&ev.key==="Escape"){ev.stopImmediatePropagation();alarmBack()}},true);
document.addEventListener("DOMContentLoaded",()=>{
  alarmWake();
  const P=window.Capacitor&&window.Capacitor.Plugins;if(!P)return;
  try{if(P.App&&P.App.addListener)P.App.addListener("appStateChange",s=>{if(s&&s.isActive)alarmWake()})}catch(e){}
});
