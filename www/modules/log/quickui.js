"use strict";
/* Entries from notification buttons ("+250 ml", "Aldım"): the native side collects them while the app is closed, and they are added to the main data here. */
/* The native side records a water/medication button only from a notification carrying this token (so another app cannot write fake entries). null without the plugin. */
async function quickToken(){const q=plugin("QuickLog");try{return q?.getToken&&(await q.getToken()).tk||null}catch{return null}}
/* take() keeps the entries "in flight" natively until they are persisted and acked. If the write fails or the process dies first,
   they come back on the next launch; a water entry carries qt (the notification time), so it is never added twice. */
/* Runs one after another (scheduling waits for its own run): two take() calls at once would both get the in-flight entries. */
let quickRun=Promise.resolve();
const quickIngest=()=>quickRun=quickRun.catch(()=>{}).then(quickTake);
async function quickTake(){
  const q=plugin("QuickLog");if(!q)return;
  let r;try{r=await q.take()}catch{return}
  const raw=r?.items||[],upto=raw.reduce((m,i)=>i&&Number.isFinite(i.t)?Math.max(m,i.t):m,0);
  const now=Date.now(),okT=i=>i&&Number.isFinite(i.t)&&i.t>0&&i.t<=now+6e4;
  const done=new Set(S.entries.filter(e=>e.qt).map(e=>e.qt));
  /* z: the phone's UTC offset (minutes) when the button was tapped. If the zone changed since, the record still lands on the day and clock the person saw. */
  const wall=i=>Number.isFinite(i.z)?i.t+(i.z+new Date(i.t).getTimezoneOffset())*6e4:i.t;
  const all=raw.filter(okT);
  const water=all.filter(i=>Number.isFinite(i.v)&&i.v>=1&&i.v<=1500&&!done.has(i.t)),meds=all.filter(i=>Number.isInteger(i.m)&&typeof i.s==="string").map(i=>({...i,t:wall(i)}));
  const ack=async()=>{if(upto&&q.ack)try{await Store.whenIdle();if(!Store.failed)await q.ack({upto})}catch{}};
  if(!water.length&&!meds.length)return ack();
  const n0=S.entries.length,id0=S.nextId,med0=Meds.snapshot();
  const added=[];
  for(const i of water){
    const w=wall(i),d=new Date(w);
    added.push({id:S.nextId++,day:dayAt(w),time:`${pad(d.getHours())}:${pad(d.getMinutes())}`,type:"water",v:Math.round(i.v),text:"",qt:i.t});
  }
  S.entries.push(...added);
  const md=meds.length?medIngest(meds):{n:0,names:[]};
  if(!save()){
    S.entries.length=n0;S.nextId=id0;Meds.rollback(med0);
    return;
  }
  ack();
  if(!$("#sheet").classList.contains("on"))render();
  const msgs=[];
  if(water.length){const total=water.reduce((a,i)=>a+Math.round(i.v),0),t=dayKey();msgs.push(`Bildirimden ${total} ml eklendi, bugün ${Math.round(sum("water",t,t))} / ${S.settings.waterMl} ml`)}
  if(md.n)msgs.push(`İlaç kaydedildi: ${md.names.join(", ")}`);
  if(md.miss)msgs.push(`${md.miss} dokunuş kaydedilemedi, İlaçlar'dan işaretle`);
  const ids=new Set(added.map(e=>e.id)),undo=()=>{S.entries=S.entries.filter(e=>!ids.has(e.id));save();render();scheduleReminders().then(setNotif)};
  if(msgs.length)toast(msgs.join(". "),added.length?undo:undefined);
  console.log("NW-QUICK ingested "+(water.length+md.n));
  const t=dayKey();
  if(md.n||md.miss||(water.length&&sum("water",t,t)>=S.settings.waterMl))scheduleReminders().then(setNotif);
}
