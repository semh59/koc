/* Depo: IndexedDB (sahte) + localStorage aynası, sıra numarası, açılışta yeni olanın seçilmesi, yazma hatası. */
globalThis.BroadcastChannel=undefined;
let bad=0;const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const path=require.resolve("../www/kernel/storelib.js");
function mkLs(init={},limit=Infinity){const m=new Map(Object.entries(init));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>{if([...m].reduce((s,[a,b])=>s+(a===k?0:a.length+b.length),0)+k.length+v.length>limit)throw new Error("quota");m.set(k,String(v))},removeItem:k=>{m.delete(k)},m}}
/* Sahte IndexedDB: veri nesnesi (disk) test dışından verilir; her işlem ayrı tick'te tamamlanır. */
function mkIdb(disk,o={}){
  return {open(){const r={};setTimeout(()=>{if(o.openFail){r.error=new Error("x");return r.onerror&&r.onerror()}
    const db={objectStoreNames:{contains:()=>true},transaction(_,mode){
      const tx={},ops=[],st={get(k){const q={};ops.push(()=>{q.result=disk.has(k)?structuredClone(disk.get(k)):undefined;q.onsuccess&&q.onsuccess()});return q},put(v,k){ops.push(()=>{tx._w=tx._w||[];tx._w.push(()=>disk.set(k,structuredClone(v)))})},delete(k){ops.push(()=>{tx._w=tx._w||[];tx._w.push(()=>disk.delete(k))})}};
      tx.objectStore=()=>st;
      setTimeout(()=>{ops.forEach(f=>f());if(mode==="readwrite"&&o.failWrites){tx.error=new Error("QuotaExceededError");return tx.onabort&&tx.onabort()}(tx._w||[]).forEach(f=>f());tx.oncomplete&&tx.oncomplete()},0);
      return tx}};
    r.result=db;r.onupgradeneeded&&r.onupgradeneeded();r.onsuccess&&r.onsuccess()},0);return r}};
}
const tick=()=>new Promise(r=>setTimeout(r,5));
async function boot({ls={},disk=new Map(),lsLimit,idb={}}={}){
  delete require.cache[path];
  globalThis.localStorage=mkLs(ls,lsLimit);globalThis.indexedDB=mkIdb(disk,idb);
  const St=require(path);await St.init();return {St,disk,ls:globalThis.localStorage,idb};
}
(async()=>{
  const J=v=>JSON.stringify({entries:[],v});
  let a=await boot();
  ok("temiz başlangıç: kayıt yok, kip idb",a.St.mode==="idb"&&a.St.get("nw_state")===null);
  a.St.set("nw_state",J(1));await a.St.whenIdle();
  ok("yazım hem IndexedDB'ye hem localStorage aynasına gider, sıra numarası 1",a.disk.get("nw_state").v===J(1)&&a.disk.get("nw_state").rev===1&&a.ls.getItem("nw_state")===J(1)&&a.ls.getItem("nw_state_rev")==="1");
  a=await boot({disk:a.disk,ls:Object.fromEntries(a.ls.m)});
  ok("yeniden açılış: IndexedDB'den okunur, kayıp yok",a.St.get("nw_state")===J(1)&&a.St.rev===1);

  a=await boot({ls:{nw_state:J("eski")}});await a.St.whenIdle();
  ok("taşıma: yalnız localStorage'da olan kayıt IndexedDB'ye geçer, localStorage'da kalır",a.St.get("nw_state")===J("eski")&&a.disk.get("nw_state").v===J("eski")&&a.ls.getItem("nw_state")===J("eski"));
  a=await boot({ls:{nw_state:J("x"),nw_state_previous:"copy",nw_state_corrupt:"bozuk"}});await a.St.whenIdle();await tick();
  ok("taşıma: güvenlik ve bozuk kopyalar IndexedDB'ye geçer, localStorage'dan silinir (kota açılır)",a.disk.get("nw_state_previous").v==="copy"&&a.disk.get("nw_state_corrupt").v==="bozuk"&&a.ls.getItem("nw_state_previous")===null&&a.St.get("nw_state_previous")==="copy");

  /* çakışma: IndexedDB açılamayan oturumda localStorage'a yazıldı */
  {const disk=new Map([["nw_state",{v:J("idb"),rev:5}]]);
   const lsx={nw_state:J("ls-yeni"),nw_state_rev:"6",nw_state_sum:require(path).sum(J("ls-yeni"))};
   const b=await boot({disk,ls:lsx});await b.St.whenIdle();
   ok("localStorage'ın sıra numarası yüksekse o kazanır (IndexedDB yazılamamıştı)",b.St.get("nw_state")===J("ls-yeni")&&b.disk.get("nw_state").v===J("ls-yeni")&&b.disk.get("nw_state").rev>6,[b.St.rev]);
   ok("IndexedDB'nin yazılamamış eski hali kopya olarak saklanmaz (özet tutuyor)",!b.disk.has("nw_state_conflict"));}
  {const disk=new Map([["nw_state",{v:J("idb"),rev:5}]]);
   const b=await boot({disk,ls:{nw_state:J("eski-surum-yazdi"),nw_state_rev:"5",nw_state_sum:"baska"}});await b.St.whenIdle();
   ok("başkası (eski sürüm) localStorage'a yazdıysa o kazanır, IndexedDB'deki hal çakışma kopyasında kalır",b.St.get("nw_state")===J("eski-surum-yazdi")&&b.disk.get("nw_state_conflict").v===J("idb")&&b.St.get("nw_state_conflict")===J("idb"));}
  {const disk=new Map([["nw_state",{v:J("idb"),rev:9}]]);
   const old=J("ayna-eski"),b=await boot({disk,ls:{nw_state:old,nw_state_rev:"8",nw_state_sum:require(path).sum(old)}});
   ok("ayna yazılamamışsa (özet eşleşiyor, sıra düşük) IndexedDB kazanır",b.St.get("nw_state")===J("idb")&&b.St.rev===9);}

  /* IndexedDB açılamıyorsa localStorage kipi, veri korunur */
  {const b=await boot({ls:{nw_state:J("ls")},idb:{openFail:true}});
   ok("IndexedDB açılamazsa localStorage kipi: okur ve yazar",b.St.mode==="ls"&&b.St.get("nw_state")===J("ls")&&b.St.set("nw_state",J("yeni"))===true&&b.ls.getItem("nw_state")===J("yeni"));}

  /* yazma hatası */
  {const b=await boot();const st=[];b.St.onState(f=>st.push(f));b.idb.failWrites=true;
   const r=b.St.set("nw_state",J("a"));await b.St.whenIdle();
   ok("IndexedDB yazamazsa: durum 'başarısız' bildirilir, kayıt bellekte ve localStorage aynasında durur",r===true&&b.St.failed&&st.join()==="true"&&b.St.get("nw_state")===J("a")&&b.ls.getItem("nw_state")===J("a"));
   b.idb.failWrites=false;b.St.set("nw_state",J("b"));await b.St.whenIdle();
   ok("sonraki kayıtta yeniden denenir, başarıyla 'başarısız' kalkar, en yeni hali yazılır",!b.St.failed&&st.join()==="true,false"&&b.disk.get("nw_state").v===J("b"));}
  {const b=await boot();for(let i=0;i<20;i++)b.St.set("nw_state",J(i));await b.St.whenIdle();
   ok("art arda yazımda son hal kalır, sıra numarası 20",b.disk.get("nw_state").v===J(19)&&b.disk.get("nw_state").rev===20);}

  /* ayna kotası dolu: kayıt başarısız sayılmaz */
  {const b=await boot({lsLimit:200});b.St.set("nw_state",J("x".repeat(1000)));await b.St.whenIdle();
   ok("localStorage aynası dolsa da kayıt IndexedDB'ye yazılır, hata yok",!b.St.failed&&b.disk.get("nw_state").v===J("x".repeat(1000)));}

  /* silme */
  {const b=await boot();b.St.set("nw_state",J(1));b.St.set("nw_state_previous","k");await b.St.whenIdle();b.St.del("nw_state");b.St.del("nw_state_previous");await b.St.whenIdle();
   ok("silme: IndexedDB ve localStorage aynası temizlenir",!b.disk.has("nw_state")&&!b.disk.has("nw_state_previous")&&b.ls.getItem("nw_state")===null&&b.ls.getItem("nw_state_rev")===null&&b.St.get("nw_state")===null);}

  /* parçalı düzen */
  {const b=await boot({ls:{nw_state:J("eski")}});await b.St.whenIdle();
   const ok1=b.St.putShards({a:"{\"x\":1}",b:"{\"y\":2}"},["a","b"]);await b.St.whenIdle();
   ok("parçalı: tek işlemde parçalar ve m:meta yazılır, sıra numarası artar",ok1===true&&b.St.sharded&&b.disk.get("m:a").v==="{\"x\":1}"&&b.disk.get("m:b").rev===b.disk.get("m:meta").rev&&JSON.parse(b.disk.get("m:meta").v).ids.join()==="a,b");
   ok("parçalı: eski tek metin ilk oturumda yedek kalır",b.disk.get("nw_state").v===J("eski"));
   const r=await boot({disk:b.disk,ls:Object.fromEntries(b.ls.m)});
   ok("parçalı: yeniden açılışta parçalar okunur, localStorage aynasındaki eski metne bakılmaz",r.St.sharded&&r.St.getShards().a==="{\"x\":1}"&&r.St.get("nw_state")===J("eski")&&r.St.rev===b.St.rev);
   r.St.putShards({b:"{\"y\":3}"},["a","b"]);await r.St.whenIdle();
   ok("parçalı: yalnız verilen parça yazılır, ötekinin sıra numarası değişmez",r.disk.get("m:b").v==="{\"y\":3}"&&r.disk.get("m:a").rev===b.disk.get("m:a").rev);}
  {const b=await boot();b.St.putShards({a:"{}"},["a"]);b.idb.failWrites=true;b.St.putShards({a:"{\"z\":1}"},["a"]);await b.St.whenIdle();
   ok("parçalı: yazılamayan parça bellekte kalır, başarısız bildirilir",b.St.failed&&b.St.getShards().a==="{\"z\":1}");
   b.idb.failWrites=false;b.St.putShards({a:"{\"z\":2}"},["a"]);await b.St.whenIdle();
   ok("parçalı: sonraki yazımda düzelir, son hal diskte",!b.St.failed&&b.disk.get("m:a").v==="{\"z\":2}");}
  {const disk=new Map([["m:meta",{v:JSON.stringify({v:2,rev:4,ids:["a","b"]}),rev:4}],["m:a",{v:"{}",rev:4}]]); // b parçası kayıp
   const b=await boot({disk});
   ok("parçalı: kayıp parça varsa eldeki parçalar yine okunur (uygulama tamamlar), hata bayrağı yok",b.St.sharded&&!b.St.shardError&&b.St.getShards().a==="{}"&&b.St.getShards().b===undefined);}
  {const disk=new Map([["m:meta",{v:"{bozuk",rev:4}]]);const b=await boot({disk,ls:{nw_state:J("stale")}});
   ok("parçalı: m:meta okunamazsa eski localStorage metnine DÜŞÜLMEZ, hata bayrağı kalkar",b.St.sharded&&b.St.shardError&&b.St.get("nw_state")===null);}

  /* localStorage kipi (IndexedDB yok): eski davranış */
  {delete require.cache[path];globalThis.localStorage=mkLs({nw_state:"z"});delete globalThis.indexedDB;const St=require(path);const r=St.init();
   ok("IndexedDB yoksa senkron localStorage",r===undefined&&St.mode==="ls"&&St.get("nw_state")==="z"&&St.set("nw_state_previous","q")&&globalThis.localStorage.getItem("nw_state_previous")==="q");}
  console.log(bad?bad+" başarısız":"Tüm depo testleri geçti");process.exit(bad?1:0);
})();
