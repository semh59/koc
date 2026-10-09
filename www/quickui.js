"use strict";
/* Bildirim düğmelerinden ("+250 ml", "Aldım") gelen kayıtlar: yerel taraf uygulama kapalıyken biriktirir, burada ana veriye eklenir. */
const QL=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.QuickLog;
/* Yerel taraf su/ilaç düğmesini yalnız bu anahtarı taşıyan bildirimden kaydeder (başka uygulama sahte kayıt yazdıramasın). Eklenti yoksa null. */
async function quickToken(){const q=QL();try{return q&&q.getToken&&(await q.getToken()).tk||null}catch(e){return null}}
/* take() kayıtları yerelde "yolda" tutar; kalıcı yazıldıktan sonra ack ile silinir. Yazma başarısızsa ya da süreç yazmadan ölürse
   kayıtlar sonraki açılışta yeniden gelir; su kaydı qt (bildirim zamanı) taşıdığından aynı kayıt ikinci kez eklenmez. */
async function quickIngest(){
  const q=QL();if(!q)return;
  let r;try{r=await q.take()}catch(e){return}
  const raw=(r&&r.items)||[],upto=raw.reduce((m,i)=>i&&Number.isFinite(i.t)?Math.max(m,i.t):m,0);
  const now=Date.now(),okT=i=>i&&Number.isFinite(i.t)&&i.t>0&&i.t<=now+6e4;
  const done=new Set(S.entries.filter(e=>e.qt).map(e=>e.qt));
  const all=raw.filter(okT);
  const water=all.filter(i=>Number.isFinite(i.v)&&i.v>=1&&i.v<=1500&&!done.has(i.t)),meds=all.filter(i=>Number.isInteger(i.m)&&typeof i.s==="string");
  const ack=async()=>{if(upto&&q.ack)try{await Store.whenIdle();if(!Store.failed)await q.ack({upto})}catch(e){}};
  if(!water.length&&!meds.length)return ack();
  const n0=S.entries.length,id0=S.nextId,log0=S.medLog,k0=S.meds.map(m=>m.k);
  for(const i of water){
    const d=new Date(i.t);
    S.entries.push({id:S.nextId++,day:dayKey(d),time:`${pad(d.getHours())}:${pad(d.getMinutes())}`,type:"su",v:Math.round(i.v),text:"",qt:i.t});
  }
  const md=meds.length?medIngest(meds):{n:0,names:[]};
  if(!save()){
    S.entries.length=n0;S.nextId=id0;S.medLog=log0;S.meds.forEach((m,i)=>{if(m.k!=null)m.k=k0[i]});
    return;
  }
  ack();
  if(!$("#sheet").classList.contains("on"))render();
  const msgs=[];
  if(water.length){const total=water.reduce((a,i)=>a+Math.round(i.v),0),t=dayKey();msgs.push(`Bildirimden ${total} ml eklendi, bugün ${Math.round(sum("su",t,t))} / ${S.settings.waterMl} ml`)}
  if(md.n)msgs.push(`İlaç kaydedildi: ${md.names.join(", ")}`);
  if(msgs.length)toast(msgs.join(". "));
  console.log("NW-QUICK ingested "+(water.length+md.n));
  const t=dayKey();
  if(md.n||(water.length&&sum("su",t,t)>=S.settings.waterMl))scheduleReminders().then(setNotif);
}
