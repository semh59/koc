"use strict";
/* Ana kayıt deposu. IndexedDB varsa asıl depo odur (kota diskle sınırlı); localStorage'a her kayıtta aynı metin kopya yazılır:
   eski sürüme dönülürse ya da IndexedDB açılamazsa veri orada durur. Her yazıma sıra numarası (rev) verilir, açılışta ikisinden yeni olan alınır.
   IndexedDB yoksa (jsdom, bazı gizli pencereler) her şey eskisi gibi senkron localStorage'dır. */
const Store=(()=>{
  const MAIN="koc_v1",REV="koc_v1_rev",SUM="koc_v1_sum",CONF="koc_v1_catisma",COPY=["koc_v1_onceki","koc_v1_bozuk"],ALL=[MAIN,...COPY,CONF];
  const ls={
    get:k=>{try{return localStorage.getItem(k)}catch(e){return null}},
    set:(k,v)=>{try{localStorage.setItem(k,v);return true}catch(e){return false}},
    del:k=>{try{localStorage.removeItem(k)}catch(e){}}
  };
  /* Metnin değişip değişmediğini anlamak için hızlı özet (güvenlik değil): FNV-1a. */
  const sum=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)+":"+s.length};
  const S={mode:"ls",failed:false,rev:0};
  let db=null,cache={},pending=new Map(),busy=false,idleCbs=[],stateCb=null,extCb=null,chan=null,mirrorOff=false;
  const tabId=Math.random().toString(36).slice(2);

  const open=()=>new Promise((res,rej)=>{
    let done=false;const fin=(f,v)=>{if(!done){done=true;f(v)}};
    setTimeout(()=>fin(rej,new Error("zaman aşımı")),5000);
    try{
      const r=indexedDB.open("neowell",1);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("kv"))r.result.createObjectStore("kv")};
      r.onsuccess=()=>fin(res,r.result);r.onerror=()=>fin(rej,r.error);r.onblocked=()=>fin(rej,new Error("engelli"));
    }catch(e){fin(rej,e)}
  });
  const readAll=()=>new Promise((res,rej)=>{
    const out={},tx=db.transaction("kv","readonly"),st=tx.objectStore("kv");
    for(const k of ALL){const q=st.get(k);q.onsuccess=()=>{if(q.result&&typeof q.result.v==="string")out[k]=q.result}}
    tx.oncomplete=()=>res(out);tx.onerror=tx.onabort=()=>rej(tx.error);
  });
  const setFailed=f=>{if(S.failed!==f){S.failed=f;if(stateCb)stateCb(f)}};
  const idle=()=>{if(!busy&&(!pending.size||S.failed))for(const c of idleCbs.splice(0))c()};

  function flush(){
    if(busy||!pending.size||!db)return idle();
    busy=true;const batch=[...pending];pending.clear();
    let tx;
    try{
      try{tx=db.transaction("kv","readwrite",{durability:"strict"})}catch(e){tx=db.transaction("kv","readwrite")}
      const st=tx.objectStore("kv");
      for(const [k,rec] of batch)rec===null?st.delete(k):st.put(rec,k);
    }catch(e){return failBatch(batch)}
    tx.oncomplete=()=>{busy=false;setFailed(false);if(chan&&batch.some(([k])=>k===MAIN))try{chan.postMessage({rev:S.rev,id:tabId})}catch(e){}flush()};
    tx.onabort=tx.onerror=()=>failBatch(batch);
  }
  /* Yazılamadı: kayıt kaybolmaz, bellekte durur; sonraki kayıtta yeniden denenir. Aradan yenisi geldiyse eskisi atılır. */
  function failBatch(batch){
    busy=false;for(const [k,rec] of batch)if(!pending.has(k))pending.set(k,rec);
    setFailed(true);idle();
  }
  function mirror(v,rev){
    if(mirrorOff)return;
    if(ls.set(MAIN,v)){ls.set(REV,String(rev));ls.set(SUM,sum(v))}else mirrorOff=true; // dolu: bu oturumda bırakılır, asıl depo IndexedDB
  }

  /* Başlatma: localStorage kipinde hemen biter (undefined), IndexedDB kipinde söz döner. Reddetmez: açılamazsa localStorage'a düşer. */
  S.init=function(){
    if(typeof indexedDB==="undefined"||!indexedDB)return;
    return open().then(async d=>{
      db=d;
      const recs=await readAll();
      const lsRaw=ls.get(MAIN),lsRev=+ls.get(REV)||0,idb=recs[MAIN];
      let main=null,rev=0,fromLs=false;
      if(idb&&(lsRaw==null||lsRaw===idb.v)){main=idb.v;rev=Math.max(idb.rev||0,lsRev)}
      else if(!idb&&lsRaw!=null){main=lsRaw;rev=lsRev+1;fromLs=true}
      else if(idb){
        /* İkisi farklı: localStorage'a başka biri yazdıysa (eski sürüm) ya da IndexedDB yazılamamışsa localStorage yeni sayılır. */
        const changed=ls.get(SUM)!==sum(lsRaw),lsNewer=changed||lsRev>(idb.rev||0);
        if(lsNewer){main=lsRaw;rev=Math.max(lsRev,idb.rev||0)+1;fromLs=true;if(changed){cache[CONF]=idb.v;pending.set(CONF,{v:idb.v,rev:idb.rev||0})}} // yalnız başkası yazdıysa eski hali saklanır
        else{main=idb.v;rev=idb.rev||0}
      }
      if(main!=null)cache[MAIN]=main;
      S.rev=rev;
      for(const k of COPY){
        if(recs[k])cache[k]=recs[k].v;
        else{const v=ls.get(k);if(v!=null){cache[k]=v;pending.set(k,{v,rev:0})}} // eski kopyalar localStorage kotasından çıkar
      }
      if(recs[CONF]&&cache[CONF]==null)cache[CONF]=recs[CONF].v;
      if(fromLs)pending.set(MAIN,{v:main,rev});
      if(main!=null)ls.get(MAIN)===main?(ls.set(REV,String(rev)),ls.set(SUM,sum(main))):mirror(main,rev); // ayna her açılışta asıl depoyla eşitlenir (eski sürüme dönüş güvenli)
      S.mode="idb";
      flush();
      if(typeof BroadcastChannel!=="undefined"){
        chan=new BroadcastChannel("neowell_store");
        chan.onmessage=async ev=>{
          if(!ev.data||ev.data.id===tabId||!(ev.data.rev>S.rev))return;
          try{const r=await readAll();if(r[MAIN]&&r[MAIN].rev>S.rev&&r[MAIN].v!==cache[MAIN]){cache[MAIN]=r[MAIN].v;S.rev=r[MAIN].rev;if(extCb)extCb(r[MAIN].v)}}catch(e){}
        };
      }
      /* Taşıma doğrulandıktan sonra eski localStorage kopyaları (güvenlik/bozuk) silinir; ana anahtar ayna olarak kalır. */
      S.whenIdle().then(()=>{if(!S.failed)for(const k of COPY)if(cache[k]!=null)ls.del(k)});
    }).catch(()=>{db=null;S.mode="ls";cache={}});
  };
  S.get=k=>S.mode==="idb"&&ALL.includes(k)?(cache[k]!==undefined?cache[k]:null):ls.get(k);
  S.set=(k,v)=>{
    if(S.mode!=="idb"||!ALL.includes(k))return ls.set(k,v);
    cache[k]=v;
    if(k===MAIN){S.rev++;mirror(v,S.rev)}
    pending.set(k,{v,rev:S.rev});flush();return !S.failed;
  };
  S.del=k=>{
    if(S.mode!=="idb"||!ALL.includes(k)){ls.del(k);return}
    delete cache[k];pending.set(k,null);
    if(k===MAIN){ls.del(MAIN);ls.del(REV);ls.del(SUM)}
    flush();
  };
  /* Bekleyen yazımlar bitince çağrılır (testler ve çıkış öncesi). */
  S.whenIdle=()=>new Promise(r=>{idleCbs.push(r);idle()});
  S.onState=f=>{stateCb=f};
  S.onExternal=f=>{extCb=f};
  S.sum=sum;S.KEYS={MAIN,REV,SUM,CONF,COPY};
  return S;
})();
if(typeof module!=="undefined")module.exports=Store;
