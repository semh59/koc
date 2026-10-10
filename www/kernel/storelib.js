"use strict";
/* Main store. With IndexedDB (quota bound by disk, not 5-10 MB) the state lives in one record per module/month shard plus "m:meta" (shard ids and revision),
   written in one transaction. Without it (jsdom, some private windows) everything is the single localStorage text "nw_state" and the calls are synchronous.
   A failed write stays in memory and is retried with the next one. */
const Store=(()=>{
  const META="m:meta",COPY=["nw_state_previous","nw_state_corrupt"],ALL=[...COPY,META];
  const ls={
    get:k=>{try{return localStorage.getItem(k)}catch{return null}},
    set:(k,v)=>{try{localStorage.setItem(k,v);return true}catch{return false}},
    del:k=>{try{localStorage.removeItem(k)}catch{}}
  };
  const S={mode:"ls",failed:false,rev:0,sharded:false};
  let db=null,cache={},pending=new Map(),busy=false,idleCbs=[],stateCb=null;

  const open=()=>new Promise((res,rej)=>{
    let done=false;const fin=(f,v)=>{if(!done){done=true;f(v)}};
    setTimeout(()=>fin(rej,new Error("timeout")),5000);
    try{
      const r=indexedDB.open("neowell",1);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains("kv"))r.result.createObjectStore("kv")};
      r.onsuccess=()=>fin(res,r.result);r.onerror=()=>fin(rej,r.error);r.onblocked=()=>fin(rej,new Error("blocked"));
    }catch(e){fin(rej,e)}
  });
  const readAll=(extra=[])=>new Promise((res,rej)=>{
    const out={},tx=db.transaction("kv","readonly"),st=tx.objectStore("kv");
    for(const k of [...ALL,...extra]){const q=st.get(k);q.onsuccess=()=>{if(q.result&&typeof q.result.v==="string")out[k]=q.result}}
    tx.oncomplete=()=>res(out);tx.onerror=tx.onabort=()=>rej(tx.error);
  });
  const setFailed=f=>{if(S.failed!==f){S.failed=f;if(stateCb)stateCb(f)}};
  const idle=()=>{if(!busy&&(!pending.size||S.failed))for(const c of idleCbs.splice(0))c()};

  function flush(){
    if(busy||!pending.size||!db)return idle();
    busy=true;const batch=[...pending];pending.clear();
    let tx;
    try{
      tx=db.transaction("kv","readwrite",{durability:"strict"});
      const st=tx.objectStore("kv");
      for(const [k,rec] of batch)rec===null?st.delete(k):st.put(rec,k);
    }catch{return failBatch(batch)}
    tx.oncomplete=()=>{busy=false;setFailed(false);flush()};
    tx.onabort=tx.onerror=()=>failBatch(batch);
  }
  /* Not written: nothing is lost, the batch stays pending for the next write; a newer value queued meanwhile wins. */
  function failBatch(batch){
    busy=false;for(const [k,rec] of batch)if(!pending.has(k))pending.set(k,rec);
    setFailed(true);idle();
  }

  /* localStorage mode returns undefined at once, IndexedDB mode a promise. Never rejects: if IndexedDB cannot be opened it falls back to localStorage. */
  S.init=function(){
    if(typeof indexedDB==="undefined"||!indexedDB)return;
    return open().then(async d=>{
      db=d;
      const recs=await readAll();
      if(recs[META]){
        S.sharded=true;
        try{const m=JSON.parse(recs[META].v);Object.assign(recs,await readAll(m.ids.map(i=>"m:"+i)));S.rev=m.rev||0;S.ids=m.ids}
        catch{S.shardError=true;S.ids=[]}
      }
      for(const k in recs)cache[k]=recs[k].v;
      S.mode="idb";
    }).catch(()=>{db=null;S.mode="ls";cache={}});
  };
  /* {shard id: text}. putShards writes only the given shards plus m:meta in one transaction (all or nothing). */
  S.getShards=()=>{const o={};for(const i of S.ids||[]){const v=cache["m:"+i];if(v!=null)o[i]=v}return o};
  S.putShards=(map,ids)=>{
    S.rev++;
    for(const [i,v] of Object.entries(map)){cache["m:"+i]=v;pending.set("m:"+i,{v,rev:S.rev})}
    for(const i of S.ids||[])if(!ids.includes(i)){delete cache["m:"+i];pending.set("m:"+i,null)} // a shard that emptied (a month with no entries) is deleted
    S.ids=ids;S.sharded=true;
    const meta=JSON.stringify({v:2,rev:S.rev,ids});cache[META]=meta;pending.set(META,{v:meta,rev:S.rev});
    flush();return !S.failed;
  };
  /* Only the shards, m:meta and the two safety copies live in IndexedDB; every other key stays in localStorage. */
  S.get=k=>S.mode==="idb"&&ALL.includes(k)?(cache[k]!==undefined?cache[k]:null):ls.get(k);
  S.set=(k,v)=>{
    if(S.mode!=="idb"||!ALL.includes(k))return ls.set(k,v);
    cache[k]=v;pending.set(k,{v,rev:S.rev});flush();return !S.failed;
  };
  S.del=k=>{
    if(S.mode!=="idb"||!ALL.includes(k)){ls.del(k);return}
    delete cache[k];pending.set(k,null);flush();
  };
  /* Resolves once pending writes are done (tests, before exit). */
  S.whenIdle=()=>new Promise(r=>{idleCbs.push(r);idle()});
  S.onState=f=>{stateCb=f};
  return S;
})();
if(typeof module!=="undefined")module.exports=Store;
