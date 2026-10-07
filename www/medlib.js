"use strict";
/* İlaç hatırlatıcı mantığı: doğrulama, günün dozları, alındı/atlandı kaydı, uyum, stok, bildirim listesi (DOM yok).
   Doz önerisi, etkileşim kontrolü ya da tıbbi yorum yapmaz; yalnızca kullanıcının girdiği programı hatırlatır ve kaydeder. */
const MedLib=(()=>{
  const MAXM=20,MAXT=6,MAXLOG=5000,BUDGET=440,MAXH=24;
  const dayOk=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d+"T00:00Z").toJSON()?.slice(0,10)===d;
  const timeOk=t=>typeof t==="string"&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
  const p2=n=>String(n).padStart(2,"0");
  const key=d=>`${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`;
  const parseDay=k=>new Date(+k.slice(0,4),+k.slice(5,7)-1,+k.slice(8,10));
  const addDay=(k,n)=>{const d=parseDay(k);d.setDate(d.getDate()+n);return key(d)};
  const dayDiff=(a,b)=>Math.round((Date.UTC(+a.slice(0,4),+a.slice(5,7)-1,+a.slice(8,10))-Date.UTC(+b.slice(0,4),+b.slice(5,7)-1,+b.slice(8,10)))/864e5);
  const fin=x=>typeof x==="number"&&Number.isFinite(x);

  /* Program: saatler (t), günler (w), açık/kapalı (on), saat başına başlangıç (ts). Ana kayıt ve geçmiş sürümler aynı biçimde temizlenir. */
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
  /* Saklanan ilaç listesini temizler. Kimlikler kayıtlarla bağlı olduğundan korunur (1-999, benzersiz). */
  function cleanMeds(arr){
    const out=[],ids=new Set();
    for(const x of (Array.isArray(arr)?arr:[]).slice(0,MAXM)){
      if(!x||typeof x.n!=="string"||!x.n.trim())continue;
      const c=cleanSched(x);
      if(!c)continue;
      let id=Number.isInteger(x.id)&&x.id>=1&&x.id<=999&&!ids.has(x.id)?x.id:0;
      if(!id){for(let i=1;i<=999;i++)if(!ids.has(i)&&!out.some(m=>m.id===i)){id=i;break}}
      ids.add(id);
      const o={id,n:x.n.trim().slice(0,40),t:c.t,on:c.on};
      if(typeof x.d==="string"&&x.d.trim())o.d=x.d.trim().slice(0,30);
      if(c.w)o.w=c.w;
      if(dayOk(x.s))o.s=x.s;
      if(dayOk(x.e)&&(!o.s||x.e>=o.s))o.e=x.e;
      if(c.ts)o.ts=c.ts;
      const h=(Array.isArray(x.h)?x.h:[]).filter(q=>q&&dayOk(q.u)).sort((a,b)=>a.u<b.u?-1:a.u>b.u?1:0).slice(-MAXH).map(q=>{const s=cleanSched(q);return s&&{u:q.u,...s}}).filter(Boolean);
      if(h.length)o.h=h;
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
  /* Geçmiş günler o günkü programla değerlendirilir: saat, gün ya da açık/kapalı değişince eski sürüm h'ye (u: bu günden önce geçerliydi) eklenir (revise),
     böylece ilacı kapatmak ya da saatini silmek eski dozları uyum paydasından silmez. h u'ya göre artan; ilk eşleşen en eski geçerli sürümdür. */
  const sched=(m,day)=>(m.h||[]).find(q=>day<q.u)||m;
  const active=(m,day)=>{const c=sched(m,day);return c.on&&(!m.s||day>=m.s)&&(!m.e||day<=m.e)&&(!c.w||c.w.includes(parseDay(day).getDay()))};
  /* Saat başına başlangıç (ts): sonradan eklenen ya da bugün vakti geçmiş saat, önceki günlerde "kaçırılmış" sayılmaz.
     Alanı olmayan (eski) kayıt ve saat eskisi gibi davranır. */
  const slotOn=(m,day,slot)=>{const c=sched(m,day);return c.t.includes(slot)&&!(c.ts&&c.ts[slot]&&day<c.ts[slot])};
  /* Kaydederken: program değiştiyse önceki sürüm geçmişe eklenir (aynı gün ikinci değişiklikte ilk sürüm kalır, o gün öncesini o anlatır). */
  function revise(prev,o,today){
    const key=a=>JSON.stringify([[...a.t].sort(),a.w||null,a.on]),h=prev&&prev.h?prev.h.slice():[];
    if(prev&&key(prev)!==key(o)&&!(h.length&&h[h.length-1].u===today)){const {t,w,ts,on}=prev;h.push({u:today,t,on,...(w&&{w}),...(ts&&{ts})})}
    if(h.length)o.h=h;
    return o;
  }
  /* Kaydedilirken: ilaçta olmayan her saat bugünden, bugünkü vakti geçmişse yarından başlar. */
  function sinceFor(prevT,t,ts,today,nowT){
    const o={};
    for(const sl of t)o[sl]=prevT.includes(sl)?(ts&&ts[sl])||undefined:(sl<=nowT?addDay(today,1):today);
    for(const sl in o)if(o[sl]===undefined)delete o[sl];
    return Object.keys(o).length?o:undefined;
  }
  /* Günün dozları: saate göre sıralı. */
  function dosesOn(meds,day){
    const out=[];
    for(const m of meds)if(active(m,day))for(const slot of sched(m,day).t)if(slotOn(m,day,slot))out.push({m,slot});
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

  /* Uyum: tek tanım (PDF, haftalık rapor, Koç ve ekranlar buna bağlı). Kullanıcı bugünün dozuna gün bitene kadar geç kayıt
     ekleyebildiği için bugünün kayıtsız, vakti geçmiş dozu "late" (gecikti) olur; ne "missed" ne de payda sayılır.
     "Kaçırılan" yalnız günü bitmiş ve kaydı olmayan dozdur. */
  function adherence(meds,log,from,to,nowDay,nowTime){
    let t=0,s=0,miss=0,total=0,late=0;
    for(let d=from;d<=to&&d<=nowDay;d=addDay(d,1)){
      for(const {m,slot} of dosesOn(meds,d)){
        if(d===nowDay&&slot>nowTime)continue;
        const st=statusOf(log,m.id,d,slot);
        if(!st&&d===nowDay){late++;continue}
        total++;
        if(st==="t")t++;else if(st==="s")s++;else miss++;
      }
    }
    return {total,taken:t,skipped:s,missed:miss,late,pct:total?Math.round(100*t/total):null};
  }
  /* Kalan doz sayısı (stok girildiyse). */
  const stockLeft=m=>m.k==null?null:Math.floor((m.k+1e-9)/(m.p||1));

  const nid=(m,ti,off)=>1000000+m.id*1000+ti*40+off;
  /* Bildirim listesi: önümüzdeki `days` gün, kaydı girilmiş dozlar atlanır. title/body gösterim ayarına göre. */
  const NAGS=[10,20];
  /* Bildirim kimliğinden (ana ya da tekrar) ilacı ve doz saatini bulur. */
  function doseOfId(meds,id){
    const b=(id-1000000)%1000000;if(!(b>=0))return null;
    const m=meds.find(x=>x.id===Math.floor(b/1000)),slot=m&&m.t[Math.floor((b%1000)/40)];
    return slot?{m,slot}:null;
  }
  function notifications(meds,log,now,days,showName){
    const out=[],today=key(now),nowT=now.getTime()+5000,body=m=>showName?`${m.n}${m.d?" · "+m.d:""}`:"İlaç saatin geldi.";
    for(let off=-1;off<days&&off<40;off++){
      const day=addDay(today,off);
      for(const m of meds){
        if(!m.on||!active(m,day))continue;
        m.t.forEach((slot,ti)=>{
          if(statusOf(log,m.id,day,slot)||!slotOn(m,day,slot))return;
          const at=parseDay(day);at.setHours(+slot.slice(0,2),+slot.slice(3,5),0,0);
          const id=nid(m,ti,off<0?39:off),extra={act:"med",m:m.id,s:slot};
          if(at.getTime()>nowT)out.push({id,title:"💊 İlaç zamanı",body:body(m),at,extra:{...extra,at:at.getTime()}});
          NAGS.forEach((min,k)=>{
            const t=new Date(at.getTime()+min*60000);
            if(t.getTime()>nowT)out.push({id:id+1000000*(k+1),title:"💊 İlacını aldın mı?",body:body(m),at:t,extra:{...extra,at:t.getTime()}});
          });
        });
      }
    }
    return out.map(n=>Object.assign(n,{actionTypeId:"med",channelId:"nw_med",ongoing:true}));
  }
  /* Tüm bildirimleri zamana göre sırala, Android'in uygulama başına alarm sınırına (500) karşı en yakın BUDGET tanesini al. */
  const budget=(list)=>list.slice().sort((a,b)=>a.at-b.at).slice(0,BUDGET);

  /* Bildirim düğmesinden gelen "alındı"nın günü: bildirim doz saatinde çıkar, bu yüzden doz, basıştan önceki en son doz saatinin günüdür
     (08:00 basışı 15:00 dozuna: dünün, bildirim sabaha kadar durmuştur; 15:00 dozuna 16:00 basışı: bugünün). */
  function dayForTap(slot,tapMs){
    const d=new Date(tapMs),tm=d.getHours()*60+d.getMinutes(),sm=+slot.slice(0,2)*60+ +slot.slice(3,5);
    return sm>tm?addDay(key(d),-1):key(d);
  }
  return {sinceFor,doseOfId,MAXM,MAXT,BUDGET,cleanMeds,cleanLog,dosesOn,statusOf,mark,adherence,stockLeft,notifications,budget,dayForTap,revise,addDay,dayDiff,dayOk,timeOk,key};
})();
if(typeof module!=="undefined")module.exports=MedLib;
