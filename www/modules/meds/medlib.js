"use strict";
/* Medication reminder logic (no DOM): validation, the doses of a day, taken/skipped log, adherence, stock, notification list.
   It gives no dose advice, checks no interactions and makes no medical comment: it only reminds the user's own schedule and records it. */
const MedLib=(()=>{
  const MAXM=20,MAXT=6,MAXLOG=50000,BUDGET=440,MAXH=24,MAXID=999,STOCK_MAX=99999,LEAD_MS=5000,NID_BASE=1e6,NID_DAYS=40;
  const TITLE="💊 İlaç zamanı",GENERIC_BODY="İlaç saatin geldi.";
  const {dayOk,timeOk}=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
  const p2=n=>String(n).padStart(2,"0");
  const hm=d=>p2(d.getHours())+":"+p2(d.getMinutes());
  const key=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
  const parseDay=k=>new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10));
  const addDay=(k,n)=>{const d=parseDay(k);d.setDate(d.getDate()+n);return key(d)};
  const slotAt=(day,slot)=>{const d=parseDay(day);d.setHours(+slot.slice(0,2),+slot.slice(3,5),0,0);return d};
  const fin=x=>typeof x==="number"&&Number.isFinite(x);
  const r2=x=>Math.round(x*100)/100;
  const doseKey=(mid,day,slot)=>`${mid}|${day}|${slot}`;
  const freeId=used=>{for(let i=1;i<=MAXID;i++)if(!used.has(i))return i;return 0};

  /* Schedule: times (t), weekdays (w), on/off (on), per-time start day (ts). The record and its history versions are cleaned the same way. */
  function cleanSched(x){
    const t=[...new Set((Array.isArray(x.t)?x.t:[]).filter(timeOk))].sort().slice(0,MAXT);
    if(!t.length)return null;
    const o={t,on:x.on!==false};
    const w=[...new Set((Array.isArray(x.w)?x.w:[]).filter(v=>Number.isInteger(v)&&v>=0&&v<=6))].sort();
    if(w.length&&w.length<7)o.w=w;
    const ts={};for(const sl of t)if(x.ts&&dayOk(x.ts[sl]))ts[sl]=x.ts[sl];
    if(Object.keys(ts).length)o.ts=ts;
    return o;
  }
  /* Ids are kept because log rows refer to them (1-999, unique). */
  function cleanMeds(arr){
    const out=[],ids=new Set();
    for(const x of (Array.isArray(arr)?arr:[]).slice(0,MAXM)){
      if(!x||typeof x.n!=="string"||!x.n.trim())continue;
      const c=cleanSched(x);
      if(!c)continue;
      const id=Number.isInteger(x.id)&&x.id>=1&&x.id<=MAXID&&!ids.has(x.id)?x.id:freeId(ids);
      ids.add(id);
      const o={id,n:x.n.trim().slice(0,40),t:c.t,on:c.on};
      if(typeof x.d==="string"&&x.d.trim())o.d=x.d.trim().slice(0,30);
      if(c.w)o.w=c.w;
      if(dayOk(x.s))o.s=x.s;
      if(dayOk(x.e)&&(!o.s||x.e>=o.s))o.e=x.e;
      if(c.ts)o.ts=c.ts;
      if(x.bp===true)o.bp=true;
      const h=(Array.isArray(x.h)?x.h:[]).filter(q=>q&&dayOk(q.u)).sort((a,b)=>a.u.localeCompare(b.u)).slice(-MAXH).map(q=>{const s=cleanSched(q);return s&&{u:q.u,...s}}).filter(Boolean);
      if(h.length)o.h=h;
      if(fin(x.k)&&x.k>=0&&x.k<=STOCK_MAX)o.k=r2(x.k);
      const p=fin(x.p)?r2(x.p):0;
      if(p>0&&p<=100)o.p=p;
      out.push(o);
    }
    return out;
  }
  /* Blood-pressure label: time between the nearest earlier recorded dose of a medication marked bp on that same day and the measurement. Records are tap times, so the wording says "kayıt". */
  function sinceDose(meds,log,day,time){
    const bp=new Set(meds.filter(m=>m.bp).map(m=>m.id));
    if(!bp.size||!timeOk(time))return "";
    const at=log.filter(x=>bp.has(x.m)&&x.day===day&&x.st==="t"&&timeOk(x.at)).map(x=>x.at).sort();
    if(!at.length)return "";
    const mins=t=>+t.slice(0,2)*60+ +t.slice(3,5),prev=at.filter(t=>t<=time).pop();
    if(!prev)return "İlaç kaydından önce";
    const d=mins(time)-mins(prev),h=Math.floor(d/60),m=d%60;
    return `Son ilaç kaydından ${d<1?"az":h?`${h} sa${m?` ${m} dk`:""}`:`${m} dk`} sonra`;
  }
  /* Log: only rows of existing medications, one row per (medication, day, time); the last one written wins. */
  function cleanLog(arr,meds){
    const ok=new Set(meds.map(m=>m.id)),rows=new Map();
    for(const x of (Array.isArray(arr)?arr:[]).slice(-MAXLOG*2)){
      if(!x||!ok.has(x.m)||!dayOk(x.day)||!timeOk(x.slot)||(x.st!=="t"&&x.st!=="s"))continue;
      const o={m:x.m,day:x.day,slot:x.slot,st:x.st};
      if(timeOk(x.at))o.at=x.at;
      const k=doseKey(o.m,o.day,o.slot);rows.delete(k);rows.set(k,o);
    }
    return [...rows.values()].slice(-MAXLOG).map((o,i)=>Object.assign({id:i+1},o));
  }
  /* Past days are judged by the schedule of that day: when times, weekdays or on/off change, the old version is pushed to h (u: valid before this day),
     so switching a medication off or deleting a time does not remove old doses from the adherence denominator. h is ascending by u; the first match is the oldest version that applies. */
  const sched=(m,day)=>(m.h||[]).find(q=>day<q.u)||m;
  const active=(m,day)=>{const c=sched(m,day);return c.on&&(!m.s||day>=m.s)&&(!m.e||day<=m.e)&&(!c.w||c.w.includes(parseDay(day).getDay()))};
  /* A time added later, or one already past today, is not counted as missed on earlier days (ts: first day the time applies). */
  const slotOn=(m,day,slot)=>{const c=sched(m,day);return c.t.includes(slot)&&!(c.ts&&c.ts[slot]&&day<c.ts[slot])};
  /* On save, a changed schedule pushes the previous version to history; a second change on the same day keeps the first version, which describes the days before today. */
  function revise(prev,o,today){
    const sig=a=>JSON.stringify([[...a.t].sort(),a.w||null,a.on]),h=prev&&prev.h?prev.h.slice():[];
    if(prev&&sig(prev)!==sig(o)&&!(h.length&&h[h.length-1].u===today)){const {t,w,ts,on}=prev;h.push({u:today,t,on,...(w&&{w}),...(ts&&{ts})})}
    if(h.length)o.h=h;
    return o;
  }
  /* On save: a time the medication did not have starts today, or tomorrow when today's time has already passed. */
  function sinceFor(prevT,t,ts,today,nowT){
    const o={};
    for(const sl of t){
      const since=prevT.includes(sl)?ts?.[sl]:(sl<=nowT?addDay(today,1):today);
      if(since)o[sl]=since;
    }
    return Object.keys(o).length?o:undefined;
  }
  /* The doses of a day, sorted by time. */
  function dosesOn(meds,day){
    const out=[];
    for(const m of meds)if(active(m,day))for(const slot of sched(m,day).t)if(slotOn(m,day,slot))out.push({m,slot});
    return out.sort((a,b)=>a.slot<b.slot?-1:a.slot>b.slot?1:a.m.id-b.m.id);
  }
  const statusOf=(log,mid,day,slot)=>log.find(x=>x.m===mid&&x.day===day&&x.slot===slot)?.st??null;
  /* Lookup of log rows by (medication, day, time) for loops over many doses; `from` leaves out older days. */
  function logIndex(log,from=""){
    const m=new Map();
    for(const x of log)if(x.day>=from)m.set(doseKey(x.m,x.day,x.slot),x);
    return (mid,day,slot)=>m.get(doseKey(mid,day,slot));
  }

  /* Mark a dose: updates S.medLog and (when taken) the stock. Returns the undo handle. */
  function mark(S,mid,day,slot,st,at){
    const med=S.meds.find(m=>m.id===mid);if(!med)return null;
    const prev=S.medLog.find(x=>x.m===mid&&x.day===day&&x.slot===slot),prevSt=prev?prev.st:null,prevK=med.k;
    S.medLog=S.medLog.filter(x=>x!==prev);
    if(st)S.medLog.push(Object.assign({id:S.medLog.reduce((a,x)=>Math.max(a,x.id),0)+1,m:mid,day,slot,st},timeOk(at)?{at}:{}));
    if(med.k!=null){
      if(st==="t"&&prevSt!=="t")med.k=Math.max(0,r2(med.k-(med.p||1)));
      else if(st!=="t"&&prevSt==="t")med.k=Math.min(STOCK_MAX,r2(med.k+(med.p||1)));
    }
    return {undo:()=>{
      S.medLog=S.medLog.filter(x=>!(x.m===mid&&x.day===day&&x.slot===slot));
      if(prev)S.medLog.push(prev);
      if(med.k!=null)med.k=prevK;
    }};
  }

  /* Double-dose guard (records only, no dose advice): the same medication has a taken record for a DIFFERENT slot within the last hour and the two slots are planned more than an hour apart.
     `at` is the moment of the tap, so a tap after midnight on the previous day's slot counts as the next day. Returns {min, slot} of the most recent such record or null. */
  const WIN=3600000;
  const slotMs=(day,t)=>{const [y,m,d]=day.split("-").map(Number),[h,mi]=t.split(":").map(Number);return new Date(y,m-1,d,h,mi).getTime()};
  function recentTaken(log,mid,day,slot,nowMs){
    let best=null;
    for(const x of log){
      if(x.m!==mid||x.st!=="t"||!timeOk(x.at)||(x.day===day&&x.slot===slot))continue;
      const sm=slotMs(x.day,x.slot);let am=slotMs(x.day,x.at);if(am<sm-WIN)am+=864e5;
      const age=nowMs-am;
      if(age<0||age>WIN||Math.abs(slotMs(day,slot)-sm)<=WIN)continue;
      if(!best||age<best.age)best={age,min:Math.max(1,Math.round(age/60000)),slot:x.slot};
    }
    return best;
  }
  const recentText=r=>`Bu ilaç için ${r.min} dakika önce de "Aldım" kaydı var. Bu yalnız kendi kayıtlarını karşılaştırır. Yine de kaydedilsin mi?`;
  const NOT_SAVED="Kaydedilmedi. Hatırlatma, aldığını işaretleyene kadar sürebilir.";

  /* Adherence has one definition (PDF, weekly report, Coach and screens use it). The user can log today's dose late until the day ends,
     so today's unlogged dose whose time has passed is "late", neither "missed" nor in the denominator. "Missed" is only an unlogged dose of a finished day. */
  function adherenceDays(meds,log,from,to,nowDay,nowTime){
    const rec=logIndex(log,from),out=[];
    for(let d=from;d<=to&&d<=nowDay;d=addDay(d,1)){
      const a={day:d,total:0,taken:0,skipped:0,missed:0,late:0};
      for(const {m,slot} of dosesOn(meds,d)){
        if(d===nowDay&&slot>nowTime)continue;
        const st=rec(m.id,d,slot)?.st;
        if(!st&&d===nowDay){a.late++;continue}
        a.total++;
        if(st==="t")a.taken++;else if(st==="s")a.skipped++;else a.missed++;
      }
      out.push(a);
    }
    return out;
  }
  function sumAdherence(days){
    const r={total:0,taken:0,skipped:0,missed:0,late:0};
    for(const a of days)for(const k in r)r[k]+=a[k];
    r.pct=r.total?Math.round(100*r.taken/r.total):null;
    return r;
  }
  const adherence=(...args)=>sumAdherence(adherenceDays(...args));
  /* Doses left, when a stock is entered. */
  const stockLeft=m=>m.k==null?null:Math.floor((m.k+1e-9)/(m.p||1));

  /* Notification id: 1e6 + med id * 1000 + time index * 40 + day offset (yesterday takes the last slot). Reminder repeats add 1e6 per repeat. */
  const nid=(m,ti,off)=>NID_BASE+m.id*1000+ti*NID_DAYS+off;
  const NAGS=[10,20];
  /* Finds the medication and the dose time from a notification id (main or repeat). */
  function doseOfId(meds,id){
    const b=(id-NID_BASE)%NID_BASE;if(!(b>=0))return null;
    const m=meds.find(x=>x.id===Math.floor(b/1000)),slot=m&&m.t[Math.floor((b%1000)/NID_DAYS)];
    return slot?{m,slot}:null;
  }
  /* Notifications for the next `days` days; doses already logged are skipped. Title and body follow the display setting. */
  function notifications(meds,log,now,days,showName){
    const out=[],today=key(now),nowT=now.getTime()+LEAD_MS,rec=logIndex(log,addDay(today,-1)),body=m=>showName?`${m.n}${m.d?" · "+m.d:""}`:GENERIC_BODY;
    for(let off=-1;off<days&&off<NID_DAYS-1;off++){
      const day=addDay(today,off);
      for(const m of meds){
        if(!m.on||!active(m,day))continue;
        m.t.forEach((slot,ti)=>{
          if(rec(m.id,day,slot)||!slotOn(m,day,slot))return;
          const at=slotAt(day,slot);
          const id=nid(m,ti,off<0?NID_DAYS-1:off),extra={act:"med",m:m.id,s:slot};
          if(at.getTime()>nowT)out.push({id,title:TITLE,body:body(m),at,extra:{...extra,at:at.getTime()}});
          NAGS.forEach((min,k)=>{
            const t=new Date(at.getTime()+min*60000);
            if(t.getTime()>nowT)out.push({id:id+NID_BASE*(k+1),title:"💊 İlacını aldın mı?",body:body(m),at:t,extra:{...extra,at:t.getTime()}});
          });
        });
      }
    }
    return out.map(n=>Object.assign(n,{actionTypeId:"med",channelId:"nw_med",ongoing:true}));
  }

  /* The day of a "taken" button tap on a notification: the notification fires at the dose time, so the dose is the latest dose time before the tap
     (a tap at 08:00 on the 15:00 dose belongs to yesterday: the notification stayed until morning; a tap at 16:00 on the 15:00 dose belongs to today). */
  function dayForTap(slot,tapMs){
    const d=new Date(tapMs),sm=+slot.slice(0,2)*60+ +slot.slice(3,5);
    return sm>d.getHours()*60+d.getMinutes()?addDay(key(d),-1):key(d);
  }
  /* The screen-waking alarm covers main doses only: main dose ids are in [1e6, 2e6), repeats start at 2e6. */
  const wakeMain=list=>list.filter(n=>n.extra&&n.extra.act==="med"&&n.id>=NID_BASE&&n.id<2*NID_BASE);
  const wakeTimes=list=>wakeMain(list).map(n=>+n.schedule.at);
  /* Dose details drawn by the native alarm screen; b is the notification body (generic text when the name is hidden). */
  const wakeDoses=list=>wakeMain(list).map(n=>({at:+n.schedule.at,nid:n.id,m:n.extra.m,s:n.extra.s,b:n.body}));

  /* Turns the MedWake diagnostic log (MedWakeReceiver.java) into plain Turkish lines. The log holds no personal data. */
  const hms=ms=>{const d=new Date(ms);return `${hm(d)}:${p2(d.getSeconds())}`};
  const dhm=ms=>{const d=new Date(ms);return `${p2(d.getDate())}.${p2(d.getMonth()+1)} ${hm(d)}`};
  const stamp=ms=>`${dhm(ms)}:${p2(new Date(ms).getSeconds())}`;
  const span=ms=>{const a=Math.abs(ms),s=ms<0?"-":"+";return a<60000?`${s}${Math.round(a/1000)} sn`:`${s}${Math.round(a/60000)} dk`};
  const CAUSE={APP:"uygulama alarmları kurdu",AFTER:"alarm sonrası yeniden kuruldu",BOOT:"telefon açıldı, alarmlar kuruldu",UPDATE:"uygulama güncellendi, alarmlar kuruldu",TIME:"saat değişti, alarmlar kuruldu",TZ:"saat dilimi değişti, alarmlar kuruldu",EXACT:"tam alarm izni değişti, alarmlar kuruldu"};
  const RING=a=>a==="WAKE"||a==="AS"||a==="AE";
  function wakeLine(e){
    const ts=stamp(e.t);
    if(e.a==="AS")return `${ts} alarm ekranı açıldı${e.kl?" (ekran kilitliydi)":""}`;
    if(e.a==="AE")return `${ts} alarm ekranı kapandı (${e.ms>=1000?Math.round(e.ms/1000)+" sn":(e.ms||0)+" ms"} açık kaldı)`;
    if(e.a!=="WAKE"&&e.a!=="NOW"){
      const nx=(e.nx||[]).map(dhm).join(", ");
      return `${ts} ${CAUSE[e.a]||e.a}: ${e.n} alarm${e.in!==e.n?` (gelen ${e.in} zaman)`:""}${nx?`, ilk: ${nx}`:""}`;
    }
    const out=e.a==="NOW"?[`${ts} şu anki durum`]:[`${ts} ${e.k==="T"?"test alarmı":"alarm"} çaldı${e.p?` (planlanan ${hms(e.p)}, ${span(e.t-e.p)})`:""}`,e.kl?"ekran kilitli":"kilit açık",e.ia===false?"ekran kapalıydı":"ekran açıktı"];
    if(e.wl===false)out.push("ekran kilidi alınamadı");
    if(e.fs==="ok")out.push("tam ekran bildirimi gönderildi");
    else if(e.fs==="skip")out.push("tam ekran bildirimi gerekmedi");
    else if(e.fs)out.push("tam ekran bildirimi gönderilemedi");
    if(e.ne===false)out.push("bildirimler kapalı");
    if(e.fsi===false)out.push("tam ekran izni yok");
    if(e.ci!=null&&e.ci>=0&&e.ci<4)out.push(e.ci===0?"ekran kanalı engelli":"ekran kanalı düşük önemde");
    if(e.bo===false)out.push("pil kısıtı var");
    if(e.err)out.push("alarm kurulurken bir sorun çıktı");
    return out.join(", ");
  }
  /* Likely problems: st is the current state, items the log rows. `to` is the settings screen to open (MedWake.settings); autostart is Xiaomi's autostart screen. */
  function wakeIssues(st,items){
    const out=[],add=(t,to,id)=>out.push({t,to,id}),low=(i,ad)=>i===0?`${ad} kanalı engelli.`:i>0&&i<4?`${ad} kanalı düşük önemde.`:"";
    if(st.ne===false)add("Bildirimler kapalı: ilaç saatinde ne ses ne ekran gelir.","notif");
    const lw=low(st.ci,"Ekran uyandırma");if(lw)add(lw+" Önemi en yükseğe çıkar, kilit ekranında göster ve yüzen bildirimi aç.","channel");
    const lm=low(st.mi,"İlaç bildirimi");if(lm)add(lm+" Önemi en yükseğe çıkar, sesi aç.","channel","nw_med");
    if(st.fsi===false)add("Tam ekran bildirim izni yok: alarm kilitli ekranı açamaz.","fsi");
    if(st.xl>0)add("Xiaomi: 'Kilit ekranında göster' izni kapalı. Uygulama izinlerinde aç, yoksa alarm ekranı açılmaz.","miui");
    if(st.xp>0)add("Xiaomi: 'Arka planda açılan pencereler' izni kapalı. Uygulama izinlerinde aç, yoksa kilitli telefonda alarm ekranı açılmaz.","miui");
    if(st.bo===false)add("Pil kısıtı var: telefon uygulamayı arka planda durdurabilir, alarm geç gelebilir. Pil ayarını 'Kısıtlama yok' yap.","battery");
    if(st.ex===false)add("Tam saat alarm izni yok: ilaç bildirimi ve ekran alarmı birkaç dakika gecikebilir.","exact");
    const w=items.filter(e=>e.a==="WAKE"),arm=items.filter(e=>!RING(e.a)).pop();
    /* If the next setup log comes more than a minute after the first scheduled alarm time and no ring log lies between, that alarm did not ring. */
    const miss=items.filter((e,i)=>!RING(e.a)&&e.nx&&e.nx[0]&&items[i+1]&&!RING(items[i+1].a)&&items[i+1].t>e.nx[0]+60000).pop();
    if(miss)add(`Planlanan ${dhm(miss.nx[0])} alarmı çalmadı: telefon uygulamayı arka planda engellemiş olabilir. Otomatik başlatmayı aç, pil kısıtını kaldır.`,"autostart");
    if(arm&&arm.n===0)add("Kurulu ekran alarmı yok: ilaç saatleri telefona iletilmemiş. Uygulamayı güncelle, sonra İlaçlar ekranını bir kez aç.");
    if(!w.length)add("Kayıtlarda çalan alarm yok: alarm hiç çalmadı. Xiaomi'de otomatik başlatmayı aç.","autostart");
    const late=Math.max(0,...w.filter(e=>e.p).map(e=>e.t-e.p));
    if(late>60000)add(`Alarm planlanandan geç çaldı (en çok ${span(late)}): pil kısıtı ya da otomatik başlatma kapalı olabilir.`,"autostart");
    /* The full-screen notification went out but no alarm screen opened within 20 s: the phone showed only a banner (Samsung/One UI demotes it when notifications are not allowed over the lock screen or full-screen notifications are off). */
    const lastW=w[w.length-1];
    if(lastW&&lastW.v===2&&lastW.fs==="ok"&&!items.some(e=>e.a==="AS"&&e.t>=lastW.t-1000&&e.t<=lastW.t+20000))add("Son alarmda tam ekran bildirimi gönderildi ama alarm ekranı açılmadı, telefon yalnız bildirim gösterdi. Ekran alarmı kanalında 'Kilit ekranında göster' ve 'Açılır pencere'yi aç; Samsung'ta ayrıca Ayarlar > Uygulamalar > NeoWell > Bildirimler'de tam ekran bildirimini izin ver.","channel");
    const quick=items.filter(e=>e.a==="AE"&&e.ms<1500).pop();
    if(quick)add("Alarm ekranı açıldı ve hemen kapandı: başka bir uygulama ya da ekran kilidi üstüne geçmiş olabilir.");
    const bad=w.filter(e=>e.fs&&/^err/.test(e.fs)).pop();
    if(bad)add("Tam ekran bildirimi gönderilemedi: "+bad.fs.replace(/^err:/,""));
    return out;
  }
  return {sinceDose,recentTaken,recentText,NOT_SAVED,wakeTimes,wakeDoses,wakeLine,wakeIssues,sinceFor,doseOfId,freeId,doseKey,MAXM,MAXT,BUDGET,TITLE,GENERIC_BODY,cleanMeds,cleanLog,dosesOn,statusOf,logIndex,mark,adherence,adherenceDays,sumAdherence,stockLeft,notifications,dayForTap,revise,addDay,slotAt,hm,timeOk,key};
})();
if(typeof module!=="undefined")module.exports=MedLib;
