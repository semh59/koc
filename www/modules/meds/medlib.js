"use strict";
/* Medication reminder logic (no DOM): validation, the doses of a day, taken/skipped log, adherence, stock, notification list.
   It gives no dose advice, checks no interactions and makes no medical comment: it only reminds the user's own schedule and records it. */
const MedLib=(()=>{
  const MAXM=20,MAXT=6,MAXLOG=50000,BUDGET=440,MAXH=24,MAXID=999,STOCK_MAX=99999,LEAD_MS=5000,NID_BASE=1e6,NID_DAYS=40,NID_SLOTS=22,STOCK_DAYS=7,FED=["empty","full","with"],FED_TEXT={empty:"Aç karnına",full:"Tok karnına",with:"Yemekle"},NAME_MAX=60;
  const TITLE="💊 İlaç zamanı",GENERIC_BODY="İlaç saatin geldi.";
  const {dayOk,timeOk,dayNum}=typeof Algo!=="undefined"?Algo:require("../../kernel/algo.js");
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

  /* Schedule: times (t), weekdays (w) or every iv days counted from the fixed day ia, on/off (on), per-time start day (ts), dose text d, amount p and per-time doses q.
     The record and its history versions are cleaned the same way; a version always carries d, p, q and e (a version without q is an older one: its days show the current dose, amount and course end). */
  function cleanSched(x){
    const t=[...new Set((Array.isArray(x.t)?x.t:[]).filter(timeOk))].sort().slice(0,MAXT);
    if(!t.length)return null;
    const o={t,on:x.on!==false};
    const w=[...new Set((Array.isArray(x.w)?x.w:[]).filter(v=>Number.isInteger(v)&&v>=0&&v<=6))].sort();
    if(Number.isInteger(x.iv)&&x.iv>=2&&x.iv<=60&&dayOk(x.ia)){o.iv=x.iv;o.ia=x.ia}
    else if(w.length&&w.length<7)o.w=w;
    const ts={};for(const sl of t)if(x.ts&&dayOk(x.ts[sl]))ts[sl]=x.ts[sl];
    if(Object.keys(ts).length)o.ts=ts;
    const q={};
    for(const sl of t){
      const e=x.q&&x.q[sl];if(!e)continue;
      const r={},d=typeof e.d==="string"?e.d.trim().slice(0,30):"",p=fin(e.p)?r2(e.p):0;
      if(d)r.d=d;if(p>0&&p<=100)r.p=p;
      if(d||r.p)q[sl]=r;
    }
    const aware=!!x.q&&typeof x.q==="object",d=typeof x.d==="string"?x.d.trim().slice(0,30):"",p=fin(x.p)&&x.p>0&&x.p<=100?r2(x.p):0;
    if(d||aware)o.d=d;
    if(p||aware)o.p=p;
    if(aware)o.q=q;
    if(dayOk(x.e)||(aware&&x.e===""))o.e=x.e;
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
      const o={id,n:x.n.trim().slice(0,NAME_MAX),t:c.t,on:c.on};
      if(c.d)o.d=c.d;
      if(c.w)o.w=c.w;
      if(c.iv){o.iv=c.iv;o.ia=c.ia}
      if(Object.keys(c.q||{}).length)o.q=c.q;
      if(FED.includes(x.fed))o.fed=x.fed;
      if(Number.isInteger(x.sd)&&x.sd>=1&&x.sd<=90)o.sd=x.sd;
      if(fin(x.kb)&&x.kb>0&&x.kb<=STOCK_MAX)o.kb=r2(x.kb);
      if(!c.on&&dayOk(x.ou))o.ou=x.ou;
      if(dayOk(x.s))o.s=x.s;
      if(dayOk(x.e)&&(!o.s||x.e>=o.s))o.e=x.e;
      if(c.ts)o.ts=c.ts;
      if(x.bp===true)o.bp=true;
      const h=(Array.isArray(x.h)?x.h:[]).filter(q=>q&&dayOk(q.u)).sort((a,b)=>a.u.localeCompare(b.u)).slice(-MAXH).map(q=>{const s=cleanSched(q);return s&&{u:q.u,...s}}).filter(Boolean);
      if(h.length)o.h=h;
      if(fin(x.k)&&x.k>=0&&x.k<=STOCK_MAX)o.k=r2(x.k);
      if(c.p)o.p=c.p;
      out.push(o);
    }
    return out;
  }
  /* Blood-pressure label: time between the nearest earlier recorded dose of a medication marked bp on the measurement's app day and the measurement. Records are tap times, so the wording says "kayıt".
     The measurement has an app day (it starts at dayStart), the record a calendar day: both are turned into moments before they are compared. */
  function sinceDose(meds,log,day,time,dayStart=0){
    const bp=new Set(meds.filter(m=>m.bp).map(m=>m.id));
    if(!bp.size||!timeOk(time))return "";
    const H=dayStart*36e5,now=slotMs(day,time)+(+time.slice(0,2)<dayStart?864e5:0);
    const at=log.filter(x=>bp.has(x.m)&&x.st==="t"&&timeOk(x.at)).map(tapMs).filter(t=>key(new Date(t-H))===day).sort((a,b)=>a-b);
    if(!at.length)return "";
    const prev=at.filter(t=>t<=now).pop();
    if(prev==null)return "İlaç kaydından önce";
    const d=Math.round((now-prev)/60000),h=Math.floor(d/60),m=d%60;
    return `Son ilaç kaydından ${d<1?"az":h?`${h} sa${m?` ${m} dk`:""}`:`${m} dk`} sonra`;
  }
  /* Log: only rows of existing medications, one row per (medication, day, time); the last one written wins. */
  function cleanLog(arr,meds){
    const ok=new Set(meds.map(m=>m.id)),rows=new Map();
    for(const x of (Array.isArray(arr)?arr:[]).slice(-MAXLOG*2)){
      if(!x||!ok.has(x.m)||!dayOk(x.day)||!timeOk(x.slot)||(x.st!=="t"&&x.st!=="s"))continue;
      const o={m:x.m,day:x.day,slot:x.slot,st:x.st};
      if(timeOk(x.at)){o.at=x.at;if(dayOk(x.ad))o.ad=x.ad}
      if(o.st==="t"&&fin(x.kd)&&x.kd>=0&&x.kd<=100)o.kd=x.kd;
      const k=doseKey(o.m,o.day,o.slot);rows.delete(k);rows.set(k,o);
    }
    return [...rows.values()].slice(-MAXLOG).map((o,i)=>Object.assign({id:i+1},o));
  }
  /* Past days are judged by the schedule of that day: when times, weekdays or on/off change, the old version is pushed to h (u: valid before this day),
     so switching a medication off or deleting a time does not remove old doses from the adherence denominator. h is ascending by u; the first match is the oldest version that applies. */
  const sched=(m,day)=>(m.h||[]).find(q=>day<q.u)||m;
  const everyN=(c,day)=>!c.iv||(((dayNum(day)-dayNum(c.ia))%c.iv)+c.iv)%c.iv===0;
  const active=(m,day)=>{const c=sched(m,day),e=c.e===undefined?m.e:c.e;return c.on&&(!m.s||day>=m.s)&&(!e||day<=e)&&(!c.w||c.w.includes(parseDay(day).getDay()))&&everyN(c,day)};
  /* A time added later, or one already past today, is not counted as missed on earlier days (ts: first day the time applies). */
  const slotOn=(m,day,slot)=>{const c=sched(m,day);return c.t.includes(slot)&&!(c.ts&&c.ts[slot]&&day<c.ts[slot])};
  /* On save, a changed schedule pushes the previous version to history; a second change on the same day keeps the first version, which describes the days before today. */
  function revise(prev,o,today){
    const sig=a=>JSON.stringify([[...a.t].sort(),a.w||null,a.on,a.iv||null,a.ia||null,a.e||null,a.d||"",a.p||0,Object.entries(a.q||{}).sort().map(([s,v])=>[s,v.d||"",v.p||0])]),h=prev&&prev.h?prev.h.slice():[];
    if(prev&&sig(prev)!==sig(o)&&!h.some(v=>v.u===today)){const {t,w,ts,on,iv,ia}=prev;h.push({u:today,t,on,...(w&&{w}),...(ts&&{ts}),...(iv&&{iv,ia}),d:prev.d||"",p:prev.p||0,q:prev.q||{},e:prev.e||""})}
    if(h.length)o.h=h;
    return o;
  }
  /* A time dropped or moved on save stays valid for the rest of today (a bridge version valid before tomorrow), so today's pending dose and its reminder do not vanish.
     Returns the dropped times (a time added earlier today is not one). `o` is already revised; a second edit on the same day rebuilds the bridge from the first. */
  function keepToday(prev,o,today){
    const tomorrow=addDay(today,1),h=(o.h||[]).slice(),i=h.findIndex(v=>v.u===tomorrow),b=i>=0?h.splice(i,1)[0]:prev,old=b.t.filter(s=>!(b.ts?.[s]>=today)),dropped=old.filter(s=>!o.t.includes(s));
    if(dropped.length){
      const t=[...new Set([...old,...o.t])].sort(),ts={};
      for(const s of t){const v=o.t.includes(s)?o.ts?.[s]:b.ts?.[s];if(v)ts[s]=v}
      const {w,iv,ia,on}=b;
      h.push({u:tomorrow,t,on,...(w&&{w}),...(Object.keys(ts).length&&{ts}),...(iv&&{iv,ia}),d:b.d||"",p:b.p||0,q:{...o.q,...b.q},e:b.e||""});
    }
    if(h.length)o.h=h;else delete o.h;
    return dropped;
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
  /* Amount and text of one time: its own value, else the medication's default. */
  const dose=(m,day)=>{const c=day?sched(m,day):m;return c.q?c:m};
  const amt=(m,slot,day)=>{const c=dose(m,day);return c.q?.[slot]?.p??(c.p>0?c.p:1)};
  const doseText=(m,slot,day)=>{const c=dose(m,day);return c.q?.[slot]?.d||c.d||""};
  /* Every time a medication has or had (current ones first): the notification ids index into it, so a bridged or recently dropped time keeps its reminder. */
  const allSlots=m=>{const x=[...m.t];for(const s of [...new Set((m.h||[]).flatMap(v=>v.t))].sort())if(!x.includes(s))x.push(s);return x.slice(0,NID_SLOTS)};
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

  /* Mark a dose: updates S.medLog and (when taken) the stock. Returns the undo handle. ad: the calendar day of the tap, so the double-dose guard need not guess it. */
  function mark(S,mid,day,slot,st,at,ad){
    const med=S.meds.find(m=>m.id===mid);if(!med)return null;
    const prev=S.medLog.find(x=>x.m===mid&&x.day===day&&x.slot===slot),prevSt=prev?prev.st:null,prevK=med.k;
    S.medLog=S.medLog.filter(x=>x!==prev);
    /* kd: what was really taken off the stock (less than the amount when it hit 0), so taking the record back adds exactly that. */
    let kd=prevSt==="t"?prev.kd:undefined;
    if(med.k!=null){
      if(st==="t"&&prevSt!=="t"){const k=Math.max(0,r2(med.k-amt(med,slot,day)));kd=r2(med.k-k);med.k=k}
      else if(st!=="t"&&prevSt==="t")med.k=Math.min(STOCK_MAX,r2(med.k+(prev.kd??amt(med,slot,day))));
    }
    if(st)S.medLog.push(Object.assign({id:S.medLog.reduce((a,x)=>Math.max(a,x.id),0)+1,m:mid,day,slot,st},timeOk(at)?{at,...(dayOk(ad)&&{ad})}:{},st==="t"&&fin(kd)?{kd}:{}));
    return {undo:()=>{
      S.medLog=S.medLog.filter(x=>!(x.m===mid&&x.day===day&&x.slot===slot));
      if(prev)S.medLog.push(prev);
      if(med.k!=null)med.k=prevK;
    }};
  }

  /* Double-dose guard (records only, no dose advice): the same medication has a taken record for a DIFFERENT slot, the two slots are planned more than an hour apart,
     and the record is younger than half the planned gap between the two doses (at least 1 h, at most 6 h): a fixed hour missed a once-a-day dose marked twice.
     `at` is the moment of the tap on the day `ad`; an older row without `ad` that is more than an hour before its slot counts as the next day. Returns {min, slot} of the most recent such record or null. */
  const WIN=3600000,WIN_MAX=6*WIN;
  const slotMs=(day,t)=>{const [y,m,d]=day.split("-").map(Number),[h,mi]=t.split(":").map(Number);return new Date(y,m-1,d,h,mi).getTime()};
  const tapMs=x=>{if(x.ad)return slotMs(x.ad,x.at);const am=slotMs(x.day,x.at);return am<slotMs(x.day,x.slot)-WIN?am+864e5:am};
  function recentTaken(log,mid,day,slot,nowMs){
    let best=null;
    for(const x of log){
      if(x.m!==mid||x.st!=="t"||!timeOk(x.at)||(x.day===day&&x.slot===slot))continue;
      const gap=Math.abs(slotMs(day,slot)-slotMs(x.day,x.slot)),age=nowMs-tapMs(x);
      if(age<0||gap<=WIN||age>Math.min(WIN_MAX,Math.max(WIN,gap/2)))continue;
      if(!best||age<best.age)best={age,min:Math.max(1,Math.round(age/60000)),slot:x.slot};
    }
    return best;
  }
  /* States the record only (which dose, how long ago); the question is the sheet title, so the body asks nothing. */
  const recentText=(r,name)=>`${name?name+" için ":""}${r.slot} dozuna ${r.min<60?r.min+" dakika":Math.floor(r.min/60)+" saat"+(r.min%60?" "+r.min%60+" dakika":"")} önce "Aldım" kaydı var. Bu yalnız kendi kayıtlarını karşılaştırır.`;
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
  /* Whole days the stock lasts at the current schedule, null without a stock or an active schedule. */
  function stockDays(m){
    const f=m.iv?1/m.iv:m.w?m.w.length/7:1,per=f*m.t.reduce((a,s)=>a+amt(m,s),0);
    return m.k==null||!m.on||!per?null:Math.floor((m.k+1e-9)/per);
  }
  /* A finished course warns no more; a running one only when the stock does not cover its remaining unmarked doses. */
  function stockLow(m,today,log=[]){
    const d=stockDays(m);
    if(d==null||d>(m.sd||STOCK_DAYS)||m.e&&m.e<today)return false;
    if(!m.e)return true;
    const rec=logIndex(log,today);let need=0;
    for(let x=today;x<=m.e;x=addDay(x,1))for(const {slot} of dosesOn([m],x))if(!rec(m.id,x,slot))need+=amt(m,slot,x);
    return m.k+1e-9<need;
  }

  /* Notification id: 1e6 + med id * 1000 + time index * 40 + day offset (yesterday takes the last slot). Reminder repeats add 1e6 per repeat.
     22 times keep the largest dose id at 879, below the 09:00 notices (900, 901). */
  const nid=(m,ti,off)=>NID_BASE+m.id*1000+ti*NID_DAYS+off;
  const NAGS=[10,20];
  /* Finds the medication and the dose time from a notification id (main or repeat). */
  function doseOfId(meds,id){
    const b=(id-NID_BASE)%NID_BASE;if(!(b>=0))return null;
    const m=meds.find(x=>x.id===Math.floor(b/1000)),slot=m&&allSlots(m)[Math.floor((b%1000)/NID_DAYS)];
    return slot?{m,slot}:null;
  }
  /* Notifications for the next `days` days; doses already logged are skipped. Title and body follow the display setting.
     Doses of the same minute (and the same repeat step) are one notification: the id and the Aldım button of the first, the others listed in extra.g ("12_0800,13_0800"). */
  function notifications(meds,log,now,days,showName){
    const today=key(now),nowT=now.getTime()+LEAD_MS,rec=logIndex(log,addDay(today,-1)),body=(m,slot,day)=>showName?`${m.n}${doseText(m,slot,day)?" · "+doseText(m,slot,day):""}`:GENERIC_BODY,groups=new Map();
    const add=(step,at,id,m,slot,day)=>{const k=step+"|"+at.getTime();if(!groups.has(k))groups.set(k,[]);groups.get(k).push({step,at,id,m,slot,day})};
    for(let off=-1;off<days&&off<NID_DAYS-1;off++){
      const day=addDay(today,off);
      for(const m of meds){
        if(!m.on||!active(m,day))continue;
        allSlots(m).forEach((slot,ti)=>{
          if(rec(m.id,day,slot)||!slotOn(m,day,slot))return;
          const at=slotAt(day,slot),id=nid(m,ti,off<0?NID_DAYS-1:off);
          if(at.getTime()>nowT)add(0,at,id,m,slot,day);
          NAGS.forEach((min,k)=>{
            const t=new Date(at.getTime()+min*60000);
            if(t.getTime()>nowT)add(k+1,t,id+NID_BASE*(k+1),m,slot,day);
          });
        });
      }
    }
    return [...groups.values()].map(g=>{
      g.sort((a,b)=>a.m.id-b.m.id);
      const {step,at,id,m,slot,day}=g[0],ms=at.getTime(),one=g.length===1,names=g.map(x=>x.m.n).join(", ");
      return {id,title:step?"💊 İlacını aldın mı?":TITLE,at,actionTypeId:one?"med":"medgrp",channelId:"nw_med",ongoing:true,
        body:one?body(m,slot,day):showName?`${g.length} ilaç: ${names}`:`${g.length} ilaç saati geldi.`,
        extra:{act:"med",m:m.id,s:slot,at:ms,...(one?{}:{g:g.map(x=>x.m.id+"_"+x.slot.replace(":","")).join(",")})}};
    }).sort((a,b)=>a.at-b.at);
  }
  /* Phone limit on pending alarms: medication doses and notices are kept first, the other reminders next, the repeat reminders last; inside a group the nearest are kept.
     mainCut and nagCut count what did not fit; days is how many days ahead the kept doses reach. */
  function fit(med,others,budget,now){
    const byAt=(a,b)=>a.schedule.at-b.schedule.at,rep=n=>n.id>=2*NID_BASE;
    const main=med.filter(n=>!rep(n)).sort(byAt),nag=med.filter(rep).sort(byAt),rest=others.slice().sort(byAt);
    const km=main.slice(0,budget),kr=rest.slice(0,budget-km.length),kn=nag.slice(0,budget-km.length-kr.length),last=km[km.length-1];
    return {list:[...km,...kr,...kn].sort(byAt),mainCut:main.length-km.length,nagCut:nag.length-kn.length,days:last?Math.max(0,Math.floor((last.schedule.at-now)/864e5)):0};
  }
  const budgetText=f=>f.mainCut?`Telefon bildirim sınırı doldu: ilaç hatırlatmaların yaklaşık ${f.days} gün ilerisine kadar kuruldu. Uygulamayı açtıkça yenilenir.`:f.nagCut?"Telefon bildirim sınırı doldu: bazı tekrar hatırlatmaları kurulmadı. İlaç saatlerin korunuyor.":"";

  /* One-off 09:00 notices: low stock (days left within the medication's threshold) and the end of a pause. Both open the Meds screen. */
  function notices(meds,now,showName,log){
    const out=[],today=key(now),nowT=now.getTime()+LEAD_MS;
    const at=day=>{const a=slotAt(day,"09:00");return a.getTime()>nowT?a:slotAt(addDay(day,1),"09:00")};
    const add=(m,n,title,body,when)=>out.push({id:NID_BASE+m.id*1000+n,title,body:showName?`${m.n}: ${body}`:"Bir ilacınla ilgili hatırlatma var. Uygulamayı aç.",at:when,extra:{act:"open",tab:"meds"}});
    for(const m of meds){
      if(m.on&&stockLow(m,today,log))add(m,900,"💊 İlaç stoğu azalıyor",m.k?`yaklaşık ${stockDays(m)} günlük stok kaldı.`:"stok bitti, yenisini al.",at(today));
      if(!m.on&&m.ou)add(m,901,"💊 Ara verme süresi doldu","tekrar açabilirsin.",m.ou>today?slotAt(m.ou,"09:00"):at(today));
    }
    return out.filter(n=>n.at.getTime()>nowT);
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
  /* Main notification id of a dose of today or yesterday (0 for a time past the id range: the phone side drops it). */
  const doseNid=(m,slot,today)=>{const ti=allSlots(m).indexOf(slot);return ti<0?0:nid(m,ti,today?0:NID_DAYS-1)};
  /* Dose details drawn by the native alarm screen over the lock screen; b is generic unless `show` (the caller decides whether a name may appear there).
     past: unmarked doses whose time has passed ({at, nid, m, slot, day}), so a snoozed or partly marked minute still shows its open doses there. Sorted: the phone keeps the first 200. */
  const wakeDoses=(list,meds,show,past=[])=>{
    const b=(id,s,day)=>{const m=show&&meds.find(x=>x.id===id);return m?m.n+(doseText(m,s,day)?" · "+doseText(m,s,day):""):GENERIC_BODY};
    return wakeMain(list).flatMap(n=>{
      const at=+n.schedule.at,ks=n.extra.g?n.extra.g.split(",").map(k=>{const [id,h]=k.split("_");return [+id,h.slice(0,2)+":"+h.slice(2)]}):[[n.extra.m,n.extra.s]];
      return ks.map(([id,s])=>({at,nid:n.id,m:id,s,b:b(id,s,key(new Date(at)))}));
    }).concat(past.map(i=>({at:i.at,nid:i.nid,m:i.m,s:i.slot,b:b(i.m,i.slot,i.day)}))).sort((x,y)=>x.at-y.at);
  };

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
    if(e.bo===false)out.push("pil kısıtlaması var");
    if(e.err)out.push("alarm kurulurken bir sorun çıktı");
    return out.join(", ");
  }
  /* If the next setup log comes more than a minute after the first scheduled alarm time and no ring of that alarm lies after it, that alarm did not ring:
     {at: planned time, off: the next setup was a boot, so the phone was off} or null. */
  const lastMiss=items=>{
    let r=null;
    items.forEach((e,i)=>{
      const at=e.nx&&e.nx[0],nx=items[i+1];
      if(!RING(e.a)&&at&&nx&&!RING(nx.a)&&nx.t>at+60000&&!items.some((x,j)=>j>i&&x.a==="WAKE"&&x.p===at))r={at,off:nx.a==="BOOT"};
    });
    return r;
  };
  /* What the alarm log says about background limits, for the permissions list and Today. bo: battery unrestricted (null unknown); slow: the last ring came more than a minute late;
     miss: a planned alarm of the last 2 days that never rang and no on-time ring came after it; off: the same while the phone was off (a restart followed); boot: the last setup after a phone restart.
     xl, xp: Xiaomi's lock-screen and background-window permissions (0 allowed, 1+ denied, -1 unreadable; null on other phones). */
  function bgState(st,items,now){
    const last=items.filter(e=>e.a==="WAKE"&&e.p).pop(),late=!!last&&last.t-last.p>60000,m=lastMiss(items),at=m&&now-m.at<2*864e5?m.at:0;
    const op=v=>typeof v==="number"?v:null;
    return {xl:op(st.xl),xp:op(st.xp),bo:typeof st.bo==="boolean"?st.bo:null,ontime:!!last&&!late,slow:late,miss:at&&!m.off&&!(last&&!late&&last.t>at)?at:0,off:at&&m.off?at:0,boot:items.filter(e=>e.a==="BOOT").pop()||null};
  }
  /* Whether the phone moved the alarms by itself (reboot, clock or time zone change) after the app's last setup at `since` (ms). */
  const clockMoved=(items,since)=>items.some(e=>(e.a==="TIME"||e.a==="TZ"||e.a==="BOOT")&&e.t>since);
  /* Likely problems: st is the current state, items the log rows. `to` is the settings screen to open (MedWake.settings); autostart is Xiaomi's autostart screen. */
  function wakeIssues(st,items){
    const out=[],add=(t,to,id)=>out.push({t,to,id}),low=(i,ad)=>i===0?`${ad} kanalı engelli.`:i>0&&i<4?`${ad} kanalı düşük önemde.`:"";
    if(st.ne===false)add("Bildirimler kapalı: ilaç saatinde ne ses ne ekran gelir.","notif");
    const lw=low(st.ci,"Ekran uyandırma");if(lw)add(lw+" Önemi en yükseğe çıkar, kilit ekranında göster ve yüzen bildirimi aç.","channel");
    const lm=low(st.mi,"İlaç bildirimi");if(lm)add(lm+" Önemi en yükseğe çıkar, sesi aç.","channel","nw_med");
    if(st.fsi===false)add("Tam ekran bildirim izni yok: alarm kilitli ekranı açamaz.","fsi");
    if(st.xl>0)add("Xiaomi: 'Kilit ekranında göster' izni kapalı. Uygulama izinlerinde aç, yoksa alarm ekranı açılmaz.","miui");
    if(st.xp>0)add("Xiaomi: 'Arka planda açılan pencereler' izni kapalı. Uygulama izinlerinde aç, yoksa kilitli telefonda alarm ekranı açılmaz.","miui");
    if(st.bo===false)add("Pil kısıtlaması var: telefon uygulamayı arka planda durdurabilir, alarm geç gelebilir. Pil ayarını 'Kısıtlama yok' yap.","battery");
    if(st.ex===false)add("Tam saat alarm izni yok: ilaç bildirimi ve ekran alarmı birkaç dakika gecikebilir.","exact");
    const w=items.filter(e=>e.a==="WAKE"),arm=items.filter(e=>!RING(e.a)).pop(),miss=lastMiss(items);
    if(miss&&!miss.off)add(`Planlanan ${dhm(miss.at)} alarmı çalmadı: telefon uygulamayı arka planda engellemiş olabilir. Otomatik başlatmayı aç, pil kısıtlamasını kaldır.`,"autostart");
    if(arm&&arm.n===0)add("Kurulu ekran alarmı yok: ilaç saatleri telefona iletilmemiş. Uygulamayı güncelle, sonra İlaçlar ekranını bir kez aç.");
    if(!w.length)add("Kayıtlarda çalan alarm yok: alarm hiç çalmadı. Xiaomi'de otomatik başlatmayı aç.","autostart");
    const late=Math.max(0,...w.filter(e=>e.p).map(e=>e.t-e.p));
    if(late>60000)add(`Alarm planlanandan geç çaldı (en çok ${span(late)}): pil kısıtlaması ya da otomatik başlatma kapalı olabilir.`,"autostart");
    /* The full-screen notification went out but no alarm screen opened within 20 s: the phone showed only a banner (Samsung/One UI demotes it when notifications are not allowed over the lock screen or full-screen notifications are off). */
    const lastW=w[w.length-1];
    if(lastW&&lastW.v===2&&lastW.fs==="ok"&&!items.some(e=>e.a==="AS"&&e.t>=lastW.t-1000&&e.t<=lastW.t+20000))add("Son alarmda tam ekran bildirimi gönderildi ama alarm ekranı açılmadı, telefon yalnız bildirim gösterdi. Ekran alarmı kanalında 'Kilit ekranında göster' ve 'Açılır pencere'yi aç; Samsung'ta ayrıca Ayarlar > Uygulamalar > NeoWell > Bildirimler'de tam ekran bildirimini izin ver.","channel");
    const quick=items.filter(e=>e.a==="AE"&&e.ms<1500).pop();
    if(quick)add("Alarm ekranı açıldı ve hemen kapandı: başka bir uygulama ya da ekran kilidi üstüne geçmiş olabilir.");
    const bad=w.filter(e=>e.fs&&/^err/.test(e.fs)).pop();
    if(bad)add("Tam ekran bildirimi gönderilemedi: "+bad.fs.replace(/^err:/,""));
    return out;
  }
  return {clockMoved,bgState,dhm,doseNid,sinceDose,recentTaken,recentText,NOT_SAVED,wakeTimes,wakeDoses,wakeLine,wakeIssues,sinceFor,keepToday,doseOfId,amt,doseText,stockDays,stockLow,notices,STOCK_DAYS,FED,FED_TEXT,NAME_MAX,freeId,doseKey,MAXM,MAXT,BUDGET,TITLE,GENERIC_BODY,cleanMeds,cleanLog,dosesOn,statusOf,logIndex,mark,adherence,adherenceDays,sumAdherence,notifications,fit,budgetText,dayForTap,revise,addDay,slotAt,hm,timeOk,key};
})();
if(typeof module!=="undefined")module.exports=MedLib;
