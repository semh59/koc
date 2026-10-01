"use strict";
/* Bildirim düğmelerinden ("+250 ml", "Aldım") gelen kayıtlar: yerel taraf uygulama kapalıyken biriktirir, burada ana veriye eklenir. */
const QL=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.QuickLog;
async function quickIngest(){
  const q=QL();if(!q)return;
  let r;try{r=await q.take()}catch(e){return}
  const now=Date.now(),okT=i=>i&&Number.isFinite(i.t)&&i.t>0&&i.t<=now+6e4;
  const all=((r&&r.items)||[]).filter(okT);
  const water=all.filter(i=>Number.isFinite(i.v)&&i.v>=1&&i.v<=1500),meds=all.filter(i=>Number.isInteger(i.m)&&typeof i.s==="string");
  if(!water.length&&!meds.length)return;
  for(const i of water){
    const d=new Date(i.t);
    S.entries.push({id:S.nextId++,day:dayKey(d),time:`${pad(d.getHours())}:${pad(d.getMinutes())}`,type:"su",v:Math.round(i.v),text:""});
  }
  const md=meds.length?medIngest(meds):{n:0,names:[]};
  save();
  if(!$("#sheet").classList.contains("on"))render();
  const msgs=[];
  if(water.length){const total=water.reduce((a,i)=>a+Math.round(i.v),0),t=dayKey();msgs.push(`Bildirimden ${total} ml eklendi, bugün ${Math.round(sum("su",t,t))} / ${S.settings.waterMl} ml`)}
  if(md.n)msgs.push(`İlaç kaydedildi: ${md.names.join(", ")}`);
  if(msgs.length)toast(msgs.join(". "));
  console.log("NW-QUICK ingested "+(water.length+md.n));
  const t=dayKey();
  if(md.n||(water.length&&sum("su",t,t)>=S.settings.waterMl))scheduleReminders().then(setNotif);
}
