"use strict";
/* İlaç hatırlatıcı mantığı: doğrulama, günün dozları, alındı/atlandı kaydı, uyum, stok, bildirim listesi (DOM yok).
   Doz önerisi, etkileşim kontrolü ya da tıbbi yorum yapmaz; yalnızca kullanıcının girdiği programı hatırlatır ve kaydeder. */
const MedLib=(()=>{
  const MAXM=20,MAXT=6,MAXLOG=5000,BUDGET=440;
  const dayOk=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!isNaN(Date.parse(d));
  const timeOk=t=>typeof t==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  const p2=n=>String(n).padStart(2,"0");
  const key=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
  const parseDay=k=>new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10));
  const addDay=(k,n)=>{const d=parseDay(k);d.setDate(d.getDate()+n);return key(d)};
  const dayDiff=(a,b)=>Math.round((Date.UTC(+a.slice(0,4),+a.slice(5,7)-1,+a.slice(8,10))-Date.UTC(+b.slice(0,4),+b.slice(5,7)-1,+b.slice(8,10)))/864e5);
  const fin=x=>typeof x==="number"&&Number.isFinite(x);

  /* Saklanan ilaç listesini temizler. Kimlikler kayıtlarla bağlı olduğundan korunur (1-999, benzersiz). */
  function cleanMeds(arr){
    const out=[],ids=new Set();
    for(const x of (Array.isArray(arr)?arr:[]).slice(0,MAXM)){
      if(!x||typeof x.n!=="string"||!x.n.trim())continue;
      const times=[...new Set((Array.isArray(x.t)?x.t:[]).filter(timeOk))].sort().slice(0,MAXT);
      if(!times.length)continue;
      let id=Number.isInteger(x.id)&&x.id>=1&&x.id<=999&&!ids.has(x.id)?x.id:0;
      if(!id){for(let i=1;i<=999;i++)if(!ids.has(i)&&!out.some(m=>m.id===i)){id=i;break}}
      ids.add(id);
      const o={id,n:x.n.trim().slice(0,40),t:times,on:x.on!==false};
      if(typeof x.d==="string"&&x.d.trim())o.d=x.d.trim().slice(0,30);
      const w=[...new Set((Array.isArray(x.w)?x.w:[]).filter(v=>Number.isInteger(v)&&v>=0&&v<=6))].sort();
      if(w.length&&w.length<7)o.w=w;
      if(dayOk(x.s))o.s=x.s;
      if(dayOk(x.e)&&(!o.s||x.e>=o.s))o.e=x.e;
      if(fin(x.k)&&x.k>=0&&x.k<=99999)o.k=Math.round(x.k*10)/10;
      if(fin(x.p)&&x.p>0&&x.p<=100)o.p=Math.round(x.p*100)/100;
      out.push(o);
    }
    return out;
  }
  /* Kayıtlar: yalnızca var olan ilaçlara ait, (ilaç, gün, saat) başına tek kayıt, en son yazılan geçerli. */
  function cleanLog(arr,meds){
    const ok=new Set(meds.map(m=>m.id)),m=new Map();
    for(const x of (Array.isArray(arr)?arr:[]).slice(-MAXLOG*2)){
      if(!x||!ok.has(x.m)||!dayOk(x.day)||!timeOk(x.slot)||(x.st!=="t"&&x.st!=="s"))continue;
      const o={m:x.m,day:x.day,slot:x.slot,st:x.st};
      if(timeOk(x.at))o.at=x.at;
      const k=`${o.m}|${o.day}|${o.slot}`;m.delete(k);m.set(k,o);
    }
    return [...m.values()].slice(-MAXLOG).map((o,i)=>Object.assign({id:i+1},o));
  }
  const active=(m,day)=>m.on&&(!m.s||day>=m.s)&&(!m.e||day<=m.e)&&(!m.w||m.w.includes(parseDay(day).getDay()));
  /* Günün dozları: saate göre sıralı. */
  function dosesOn(meds,day){
    const out=[];
    for(const m of meds)if(active(m,day))for(const slot of m.t)out.push({m,slot});
    return out.sort((a,b)=>a.slot<b.slot?-1:a.slot>b.slot?1:a.m.id-b.m.id);
  }
  const statusOf=(log,mid,day,slot)=>{const r=log.find(x=>x.m===mid&&x.day===day&&x.slot===slot);return r?r.st:null};

  /* Kayıt işaretleme: S.medLog ve (alındıysa) stok güncellenir. Geri almak için önceki durumu döndürür. */
  function mark(S,mid,day,slot,st,at){
    const med=S.meds.find(m=>m.id===mid);if(!med)return null;
    const prev=S.medLog.find(x=>x.m===mid&&x.day===day&&x.slot===slot),prevSt=prev?prev.st:null,prevK=med.k;
    S.medLog=S.medLog.filter(x=>x!==prev);
    if(st){S.medLog.push(Object.assign({id:Math.max(0,...S.medLog.map(x=>x.id))+1,m:mid,day,slot,st},timeOk(at)?{at}:{}))}
    if(med.k!=null){
      if(st==="t"&&prevSt!=="t")med.k=Math.max(0,Math.round((med.k-(med.p||1))*100)/100);
      else if(st!=="t"&&prevSt==="t")med.k=Math.min(99999,Math.round((med.k+(med.p||1))*100)/100);
    }
    return {undo:()=>{
      S.medLog=S.medLog.filter(x=>!(x.m===mid&&x.day===day&&x.slot===slot));
      if(prev)S.medLog.push(prev);
      if(med.k!=null)med.k=prevK;
    }};
  }

  /* Uyum: [from,to] arasında vakti geçmiş dozlar. Kayıtsız geçmiş doz "kaçırılan" sayılır. */
  function adherence(meds,log,from,to,nowDay,nowTime){
    let t=0,s=0,miss=0,total=0;
    for(let d=from;d<=to&&d<=nowDay;d=addDay(d,1)){
      for(const {m,slot} of dosesOn(meds,d)){
        if(d===nowDay&&slot>nowTime)continue;
        total++;
        const st=statusOf(log,m.id,d,slot);
        if(st==="t")t++;else if(st==="s")s++;else miss++;
      }
    }
    return {total,taken:t,skipped:s,missed:miss,pct:total?Math.round(100*t/total):null};
  }
  /* Kalan doz sayısı (stok girildiyse). */
  const stockLeft=m=>m.k==null?null:Math.floor((m.k+1e-9)/(m.p||1));

  const nid=(m,ti,off)=>1000000+m.id*1000+ti*40+off;
  /* Bildirim listesi: önümüzdeki `days` gün, kaydı girilmiş dozlar atlanır. title/body gösterim ayarına göre. */
  function notifications(meds,log,now,days,showName){
    const out=[],today=key(now),nowT=now.getTime()+5000;
    for(let off=0;off<days&&off<40;off++){
      const day=addDay(today,off);
      for(const m of meds){
        if(!active(m,day))continue;
        m.t.forEach((slot,ti)=>{
          if(statusOf(log,m.id,day,slot))return;
          const at=parseDay(day);at.setHours(+slot.slice(0,2),+slot.slice(3,5),0,0);
          if(at.getTime()<=nowT)return;
          out.push({id:nid(m,ti,off),title:"💊 İlaç zamanı",body:showName?`${m.n}${m.d?" · "+m.d:""}`:"İlaç saatin geldi.",at,actionTypeId:"med",extra:{act:"med",m:m.id,s:slot}});
        });
      }
    }
    return out;
  }
  /* Tüm bildirimleri zamana göre sırala, Android'in uygulama başına alarm sınırına (500) karşı en yakın BUDGET tanesini al. */
  const budget=(list)=>list.slice().sort((a,b)=>a.at-b.at).slice(0,BUDGET);

  /* Bildirim düğmesinden gelen "alındı"nın günü: doz saati, düğmeye basılan andan 6 saatten fazla ilerideyse (gece yarısını aşmış) önceki gündür. */
  function dayForTap(slot,tapMs){
    const d=new Date(tapMs),tm=d.getHours()*60+d.getMinutes(),sm=+slot.slice(0,2)*60+ +slot.slice(3,5);
    return sm-tm>360?addDay(key(d),-1):key(d);
  }
  return {MAXM,MAXT,BUDGET,cleanMeds,cleanLog,dosesOn,statusOf,mark,adherence,stockLeft,notifications,budget,dayForTap,addDay,dayDiff,dayOk,timeOk,key};
})();
if(typeof module!=="undefined")module.exports=MedLib;
