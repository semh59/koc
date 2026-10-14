"use strict";
/* In-app medication alarm screen: opens when a medication notification is tapped (the lock-screen part is native: AlarmActivity.java). */
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
const alarmShowName=()=>S.settings.medShowName===true;

function alarmDraw(){
  const a=alarm,v=AlarmLib.view(a.items,alarmShowName()),done=AlarmLib.allDone(a.items);
  const st=i=>i.st==="t"?"Alındı":"Atlandı";
  const rows=v.rows.map((r,k)=>{
    const i=a.items[k],lab=alarmShowName()?`${r.name} ${r.slot}`:`${r.slot} dozu`;
    return `<div class="row wrap"><span class="grow"><b>${esc(r.name)}</b><small class="db mut"><span class="num">${r.slot}</span>${r.dose?" · "+esc(r.dose):""}</small></span>${i.st
      ?`<b class="alst">${Icons.svg("check")} ${st(i)}</b>`
      :`<span class="alact"><button class="btn" data-al="t:${k}" aria-label="${esc(lab)}: aldım">${Icons.svg("check")} Aldım</button><button class="btn ghost" data-al="s:${k}" aria-label="${esc(lab)}: atla">Atla</button></span>`}</div>`;
  }).join("");
  const left=a.items.filter(i=>!i.st).length;
  $("#allive").textContent=a.say||"";
  $("#albody").innerHTML=`
    <div class="alclk num" aria-hidden="true">${MedLib.hm(new Date())}</div>
    <h2 id="alt" tabindex="-1">İlaç zamanı</h2>
    <p id="allead" class="allead">${esc(done&&a.items.length?"Tüm dozlar alındı.":v.lead)}${v.count&&!done?` <span class="num">${v.count}</span>`:""}</p>
    ${rows?`<div class="card">${rows}</div>`:""}
    ${a.ask?`<div class="card alask" role="group" aria-label="Çift doz sorusu"><p>${esc(a.ask.text)}</p><div class="albar"><button class="btn" data-al="askno">Hayır, kaydetme</button><button class="btn ghost" data-al="askyes">Evet, kaydet</button></div></div>`:""}
    <div class="albar">${left>1?`<button class="btn ghost" data-al="all">Hepsini aldım</button>`:""}${left?`<button class="btn ghost" data-al="snooze">10 dk sonra hatırlat</button>`:""}<button class="lnk" data-al="open">Uygulamayı aç</button></div>`;
}

/* o.quiet: when there is no dose to show, nothing opens (late tap on a notification). */
function alarmOpen(o={}){
  if(recovery||!S.settings.medOn)return;
  const items=AlarmLib.due(S.meds,S.medLog,new Date());
  if(!items.length&&o.quiet&&!alarm)return;
  if(alarm){ // a new wake-up while open: the list is refreshed and marked doses stay marked
    const old=new Map(alarm.items.map(i=>[MedLib.doseKey(i.m,i.day,i.slot),i.st]));
    for(const i of items)i.st=old.get(MedLib.doseKey(i.m,i.day,i.slot));
    alarm.items=items.length?items:alarm.items;
  }else{
    alarm={items,from:document.activeElement,tick:setInterval(()=>{const c=document.querySelector("#alarm .alclk");if(c)c.textContent=MedLib.hm(new Date())},15000)};
  }
  const d=alarmEl();alarmDraw();d.hidden=false;document.body.classList.add("alon");trap();
  $("#alt").focus({preventScroll:true});
  if(!items.length||AlarmLib.allDone(alarm.items))alarmAuto();
}
function alarmAuto(){clearTimeout(alarm.auto);alarm.auto=setTimeout(alarmClose,1500)}
function alarmClose(){
  if(!alarm)return;
  const f=alarm.from;clearInterval(alarm.tick);clearTimeout(alarm.auto);alarm=null;
  const d=alarmEl();d.hidden=true;$("#albody").innerHTML="";$("#allive").textContent="";document.body.classList.remove("alon");trap();
  if(f&&f.isConnected)f.focus({preventScroll:true});
}
/* Same record as the notification's "taken" button: MedLib.mark + save + medResched (the pending repeats of a taken dose are cancelled). */
function alarmMark(ks,st,force){
  const a=alarm,list=ks.map(k=>a.items[k]).filter(i=>i&&!i.st);if(!list.length)return;
  a.ask=null;
  if(st==="t"&&!force){
    const r=list.map(i=>MedLib.recentTaken(S.medLog,i.m,i.day,i.slot,Date.now())).find(Boolean);
    if(r){a.ask={ks,st,text:MedLib.recentText(r)};a.say=a.ask.text;alarmDraw();$('#alarm [data-al="askno"]')?.focus({preventScroll:true});return}
  }
  const at=medNowHM(),undo=[];
  for(const i of list){const r=MedLib.mark(S,i.m,i.day,i.slot,st,st==="t"?at:undefined);if(r){undo.push(r);i.st=st}}
  if(!save()){undo.reverse().forEach(r=>r.undo());list.forEach(i=>{i.st=undefined});a.say=SAVE_FAIL;alarmDraw();return}
  render();medResched();
  a.say=list.length>1?"Hepsi kaydedildi":(alarmShowName()?list[0].n+" ":"")+(st==="t"?"alındı":"atlandı");
  alarmDraw();
  const next=document.querySelector('#alarm [data-al^="t:"]');(next||$("#alt")).focus({preventScroll:true});
  if(AlarmLib.allDone(a.items)){alarmSnoozeCancel();alarmAuto()}
}
function alarmSnoozeCancel(){LN()?.cancel({notifications:[{id:AlarmLib.SNOOZE_NID}]}).catch(()=>{});MW()?.snooze?.({at:0}).catch(()=>{})}
/* Snooze: the dose is not marked; 10 minutes later a one-shot medication notification and an alarm wake the screen again. */
async function alarmSnooze(){
  const a=alarm;if(!a)return;
  const at=AlarmLib.snoozeAt(Date.now()),ln=LN(),w=MW(),items=a.items.filter(i=>!i.st);
  try{
    if(ln)await lnSchedule(ln,[AlarmLib.snoozeNote(items,alarmShowName(),at)]);
    if(w?.snooze)await w.snooze({at});
    alarmClose();toast("10 dakika sonra yeniden hatırlatacağım");
  }catch(e){a.say="Erteleme kurulamadı";alarmDraw()}
}
/* Android back key and Escape: the alarm screen closes and the app shows (doses stay unmarked, notifications stay). */
function alarmBack(){if(!alarm)return false;alarmClose();return true}

document.addEventListener("click",ev=>{
  const b=ev.target.closest("#alarm [data-al]");if(!b||!alarm)return;
  const [k,n]=b.dataset.al.split(":");
  if(k==="t"||k==="s")alarmMark([+n],k);
  else if(k==="all")alarmMark(alarm.items.map((_,i)=>i),"t");
  else if(k==="askyes"){const q=alarm.ask;alarm.ask=null;if(q)alarmMark(q.ks,q.st,true)}
  else if(k==="askno"){alarm.ask=null;alarm.say=MedLib.NOT_SAVED;alarmDraw();$("#alt").focus({preventScroll:true})}
  else if(k==="snooze")alarmSnooze();
  else if(k==="open"){alarmClose();widgetOpen()}
},true);
document.addEventListener("keydown",ev=>{if(alarm&&ev.key==="Escape"){ev.stopImmediatePropagation();alarmBack()}},true);
