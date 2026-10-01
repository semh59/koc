"use strict";
/* Bildirimdeki "+250 ml" düğmesinden gelen kayıtlar: yerel taraf uygulama kapalıyken biriktirir, burada ana veriye eklenir. */
const QL=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.QuickLog;
async function quickIngest(){
  const q=QL();if(!q)return;
  let r;try{r=await q.take()}catch(e){return}
  const now=Date.now(),items=((r&&r.items)||[]).filter(i=>i&&Number.isFinite(i.v)&&i.v>=1&&i.v<=1500&&Number.isFinite(i.t)&&i.t>0&&i.t<=now+6e4);
  if(!items.length)return;
  for(const i of items){
    const d=new Date(i.t);
    S.entries.push({id:S.nextId++,day:dayKey(d),time:`${pad(d.getHours())}:${pad(d.getMinutes())}`,type:"su",v:Math.round(i.v),text:""});
  }
  save();
  const total=items.reduce((a,i)=>a+Math.round(i.v),0),t=dayKey(),top=sum("su",t,t);
  if(!$("#sheet").classList.contains("on"))render();
  toast(`Bildirimden ${total} ml eklendi, bugün ${Math.round(top)} / ${S.settings.waterMl} ml`);
  console.log("NW-QUICK ingested "+items.length);
  if(top>=S.settings.waterMl)scheduleReminders().then(setNotif);
}
