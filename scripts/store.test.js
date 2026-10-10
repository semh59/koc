/* Store: fake IndexedDB, shard transaction and revision, retry after a failed write, localStorage fallback. */
const {ok,finish}=require("./ok");
globalThis.BroadcastChannel=undefined;
const path=require.resolve("../www/kernel/storelib.js");
function mkLs(init={}){const m=new Map(Object.entries(init));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{m.set(k,String(v))},removeItem:k=>{m.delete(k)},m}}
/* Fake IndexedDB: the data (disk) is supplied by the test; every transaction completes in its own tick. */
function mkIdb(disk,o={}){
  return {open(){const r={};setTimeout(()=>{if(o.openFail){r.error=new Error("x");return r.onerror&&r.onerror()}
    const db={objectStoreNames:{contains:()=>true},transaction(_,mode){
      const tx={},ops=[],st={get(k){const q={};ops.push(()=>{q.result=disk.has(k)?structuredClone(disk.get(k)):undefined;q.onsuccess&&q.onsuccess()});return q},put(v,k){ops.push(()=>{tx._w=tx._w||[];tx._w.push(()=>disk.set(k,structuredClone(v)))})},delete(k){ops.push(()=>{tx._w=tx._w||[];tx._w.push(()=>disk.delete(k))})}};
      tx.objectStore=()=>st;
      setTimeout(()=>{ops.forEach(f=>f());if(mode==="readwrite"&&o.failWrites){tx.error=new Error("QuotaExceededError");return tx.onabort&&tx.onabort()}(tx._w||[]).forEach(f=>f());tx.oncomplete&&tx.oncomplete()},0);
      return tx}};
    r.result=db;r.onupgradeneeded&&r.onupgradeneeded();r.onsuccess&&r.onsuccess()},0);return r}};
}
async function boot({ls={},disk=new Map(),idb={}}={}){
  delete require.cache[path];
  globalThis.localStorage=mkLs(ls);globalThis.indexedDB=mkIdb(disk,idb);
  const St=require(path);await St.init();return {St,disk,ls:globalThis.localStorage,idb};
}
(async()=>{
  let a=await boot();
  ok("clean start: IndexedDB mode, no shards",a.St.mode==="idb"&&!a.St.sharded&&a.St.get("nw_state")===null&&a.St.rev===0);
  ok("putShards: shards and m:meta go in one write with one new revision",a.St.putShards({a:"{\"x\":1}",b:"{\"y\":2}"},["a","b"])===true&&a.St.sharded&&a.St.rev===1);
  await a.St.whenIdle();
  ok("putShards: the records are on disk with the same revision",a.disk.get("m:a").v==="{\"x\":1}"&&a.disk.get("m:b").rev===a.disk.get("m:meta").rev&&JSON.parse(a.disk.get("m:meta").v).ids.join()==="a,b");
  ok("putShards: nothing reaches localStorage",a.ls.m.size===0);
  a.St.putShards({b:"{\"y\":3}"},["a","b"]);await a.St.whenIdle();
  ok("putShards: only the given shard is rewritten, the other keeps its revision",a.disk.get("m:b").v==="{\"y\":3}"&&a.disk.get("m:a").rev===1&&a.disk.get("m:b").rev===2);
  a.St.putShards({},["a"]);await a.St.whenIdle();
  ok("putShards: a shard missing from the id list is deleted",!a.disk.has("m:b")&&a.St.getShards().b===undefined);

  const r=await boot({disk:a.disk});
  ok("reopen: shards are read back with the revision",r.St.sharded&&r.St.getShards().a==="{\"x\":1}"&&r.St.rev===3);

  {const disk=new Map([["m:meta",{v:JSON.stringify({v:2,rev:4,ids:["a","b"]}),rev:4}],["m:a",{v:"{}",rev:4}]]); // shard b is missing
   const b=await boot({disk});
   ok("a missing shard does not hide the others and sets no error flag",b.St.sharded&&!b.St.shardError&&b.St.getShards().a==="{}"&&b.St.getShards().b===undefined);}
  {const disk=new Map([["m:meta",{v:"{broken",rev:4}]]);const b=await boot({disk,ls:{nw_state:"{\"entries\":[]}"}});
   ok("unreadable m:meta raises the error flag and does not fall back to the localStorage text",b.St.sharded&&b.St.shardError&&b.St.getShards().a===undefined);}

  {const b=await boot({ls:{nw_state:"ls-text"}});
   ok("the main state key never goes to IndexedDB: reads and writes stay in localStorage",b.St.get("nw_state")==="ls-text"&&b.St.set("nw_state","new")===true&&b.ls.getItem("nw_state")==="new"&&!b.disk.has("nw_state"));
   b.St.del("nw_state");ok("deleting the main state key clears localStorage",b.ls.getItem("nw_state")===null);}
  {const b=await boot();b.St.set("nw_state_previous","copy");b.St.set("nw_state_corrupt","bad");await b.St.whenIdle();
   ok("safety copies live in IndexedDB, not localStorage",b.disk.get("nw_state_previous").v==="copy"&&b.St.get("nw_state_corrupt")==="bad"&&b.ls.getItem("nw_state_previous")===null);
   const c=await boot({disk:b.disk});ok("safety copies survive a reopen",c.St.get("nw_state_previous")==="copy");
   c.St.del("nw_state_previous");await c.St.whenIdle();ok("deleting a safety copy removes it from disk",!c.disk.has("nw_state_previous")&&c.St.get("nw_state_previous")===null);}

  {const b=await boot();b.St.putShards({a:"{}"},["a"]);await b.St.whenIdle();const st=[];b.St.onState(f=>st.push(f));b.idb.failWrites=true;
   b.St.putShards({a:"{\"z\":1}"},["a"]);await b.St.whenIdle();
   ok("a failed write is reported and the shard stays in memory",b.St.failed&&st.join()==="true"&&b.St.getShards().a==="{\"z\":1}");
   b.idb.failWrites=false;b.St.putShards({a:"{\"z\":2}"},["a"]);await b.St.whenIdle();
   ok("the next write retries, clears the failure and puts the newest text on disk",!b.St.failed&&st.join()==="true,false"&&b.disk.get("m:a").v==="{\"z\":2}");}
  {const b=await boot();b.St.putShards({a:"{}"},["a"]);for(let i=0;i<20;i++)b.St.putShards({a:JSON.stringify({i})},["a"]);await b.St.whenIdle();
   ok("rapid writes end with the last text and revision 21",b.disk.get("m:a").v==="{\"i\":19}"&&b.disk.get("m:a").rev===21);}

  {const b=await boot({ls:{nw_state:"ls"},idb:{openFail:true}});
   ok("IndexedDB that cannot be opened falls back to localStorage mode: reads and writes",b.St.mode==="ls"&&b.St.get("nw_state")==="ls"&&b.St.set("nw_state","new")===true&&b.ls.getItem("nw_state")==="new");}
  {delete require.cache[path];globalThis.localStorage=mkLs({nw_state:"z"});delete globalThis.indexedDB;const St=require(path);const res=St.init();
   ok("without IndexedDB it is synchronous localStorage",res===undefined&&St.mode==="ls"&&St.get("nw_state")==="z"&&St.set("nw_state_previous","q")&&globalThis.localStorage.getItem("nw_state_previous")==="q");}
  finish();
})();
