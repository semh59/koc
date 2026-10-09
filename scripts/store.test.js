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
  ok("temiz başlangıç: kayıt yok, kip idb",a.St.mode==="idb"&&a.St.get("koc_v1")===null);
  a.St.set("koc_v1",J(1));await a.St.whenIdle();
  ok("yazım hem IndexedDB'ye hem localStorage aynasına gider, sıra numarası 1",a.disk.get("koc_v1").v===J(1)&&a.disk.get("koc_v1").rev===1&&a.ls.getItem("koc_v1")===J(1)&&a.ls.getItem("koc_v1_rev")==="1");
  a=await boot({disk:a.disk,ls:Object.fromEntries(a.ls.m)});
  ok("yeniden açılış: IndexedDB'den okunur, kayıp yok",a.St.get("koc_v1")===J(1)&&a.St.rev===1);

  a=await boot({ls:{koc_v1:J("eski")}});await a.St.whenIdle();
  ok("taşıma: yalnız localStorage'da olan kayıt IndexedDB'ye geçer, localStorage'da kalır",a.St.get("koc_v1")===J("eski")&&a.disk.get("koc_v1").v===J("eski")&&a.ls.getItem("koc_v1")===J("eski"));
  a=await boot({ls:{koc_v1:J("x"),koc_v1_onceki:"kopya",koc_v1_bozuk:"bozuk"}});await a.St.whenIdle();await tick();
  ok("taşıma: güvenlik ve bozuk kopyalar IndexedDB'ye geçer, localStorage'dan silinir (kota açılır)",a.disk.get("koc_v1_onceki").v==="kopya"&&a.disk.get("koc_v1_bozuk").v==="bozuk"&&a.ls.getItem("koc_v1_onceki")===null&&a.St.get("koc_v1_onceki")==="kopya");

  /* çakışma: IndexedDB açılamayan oturumda localStorage'a yazıldı */
  {const disk=new Map([["koc_v1",{v:J("idb"),rev:5}]]);
   const lsx={koc_v1:J("ls-yeni"),koc_v1_rev:"6",koc_v1_sum:require(path).sum(J("ls-yeni"))};
   const b=await boot({disk,ls:lsx});await b.St.whenIdle();
   ok("localStorage'ın sıra numarası yüksekse o kazanır (IndexedDB yazılamamıştı)",b.St.get("koc_v1")===J("ls-yeni")&&b.disk.get("koc_v1").v===J("ls-yeni")&&b.disk.get("koc_v1").rev>6,[b.St.rev]);
   ok("IndexedDB'nin yazılamamış eski hali kopya olarak saklanmaz (özet tutuyor)",!b.disk.has("koc_v1_catisma"));}
  {const disk=new Map([["koc_v1",{v:J("idb"),rev:5}]]);
   const b=await boot({disk,ls:{koc_v1:J("eski-surum-yazdi"),koc_v1_rev:"5",koc_v1_sum:"baska"}});await b.St.whenIdle();
   ok("başkası (eski sürüm) localStorage'a yazdıysa o kazanır, IndexedDB'deki hal çakışma kopyasında kalır",b.St.get("koc_v1")===J("eski-surum-yazdi")&&b.disk.get("koc_v1_catisma").v===J("idb")&&b.St.get("koc_v1_catisma")===J("idb"));}
  {const disk=new Map([["koc_v1",{v:J("idb"),rev:9}]]);
   const old=J("ayna-eski"),b=await boot({disk,ls:{koc_v1:old,koc_v1_rev:"8",koc_v1_sum:require(path).sum(old)}});
   ok("ayna yazılamamışsa (özet eşleşiyor, sıra düşük) IndexedDB kazanır",b.St.get("koc_v1")===J("idb")&&b.St.rev===9);}

  /* IndexedDB açılamıyorsa localStorage kipi, veri korunur */
  {const b=await boot({ls:{koc_v1:J("ls")},idb:{openFail:true}});
   ok("IndexedDB açılamazsa localStorage kipi: okur ve yazar",b.St.mode==="ls"&&b.St.get("koc_v1")===J("ls")&&b.St.set("koc_v1",J("yeni"))===true&&b.ls.getItem("koc_v1")===J("yeni"));}

  /* yazma hatası */
  {const b=await boot();const st=[];b.St.onState(f=>st.push(f));b.idb.failWrites=true;
   const r=b.St.set("koc_v1",J("a"));await b.St.whenIdle();
   ok("IndexedDB yazamazsa: durum 'başarısız' bildirilir, kayıt bellekte ve localStorage aynasında durur",r===true&&b.St.failed&&st.join()==="true"&&b.St.get("koc_v1")===J("a")&&b.ls.getItem("koc_v1")===J("a"));
   b.idb.failWrites=false;b.St.set("koc_v1",J("b"));await b.St.whenIdle();
   ok("sonraki kayıtta yeniden denenir, başarıyla 'başarısız' kalkar, en yeni hali yazılır",!b.St.failed&&st.join()==="true,false"&&b.disk.get("koc_v1").v===J("b"));}
  {const b=await boot();for(let i=0;i<20;i++)b.St.set("koc_v1",J(i));await b.St.whenIdle();
   ok("art arda yazımda son hal kalır, sıra numarası 20",b.disk.get("koc_v1").v===J(19)&&b.disk.get("koc_v1").rev===20);}

  /* ayna kotası dolu: kayıt başarısız sayılmaz */
  {const b=await boot({lsLimit:200});b.St.set("koc_v1",J("x".repeat(1000)));await b.St.whenIdle();
   ok("localStorage aynası dolsa da kayıt IndexedDB'ye yazılır, hata yok",!b.St.failed&&b.disk.get("koc_v1").v===J("x".repeat(1000)));}

  /* silme */
  {const b=await boot();b.St.set("koc_v1",J(1));b.St.set("koc_v1_onceki","k");await b.St.whenIdle();b.St.del("koc_v1");b.St.del("koc_v1_onceki");await b.St.whenIdle();
   ok("silme: IndexedDB ve localStorage aynası temizlenir",!b.disk.has("koc_v1")&&!b.disk.has("koc_v1_onceki")&&b.ls.getItem("koc_v1")===null&&b.ls.getItem("koc_v1_rev")===null&&b.St.get("koc_v1")===null);}

  /* parçalı düzen */
  {const b=await boot({ls:{koc_v1:J("eski")}});await b.St.whenIdle();
   const ok1=b.St.putShards({a:"{\"x\":1}",b:"{\"y\":2}"},["a","b"]);await b.St.whenIdle();
   ok("parçalı: tek işlemde parçalar ve m:meta yazılır, sıra numarası artar",ok1===true&&b.St.sharded&&b.disk.get("m:a").v==="{\"x\":1}"&&b.disk.get("m:b").rev===b.disk.get("m:meta").rev&&JSON.parse(b.disk.get("m:meta").v).ids.join()==="a,b");
   ok("parçalı: eski tek metin ilk oturumda yedek kalır",b.disk.get("koc_v1").v===J("eski"));
   const r=await boot({disk:b.disk,ls:Object.fromEntries(b.ls.m)});
   ok("parçalı: yeniden açılışta parçalar okunur, localStorage aynasındaki eski metne bakılmaz",r.St.sharded&&r.St.getShards().a==="{\"x\":1}"&&r.St.get("koc_v1")===J("eski")&&r.St.rev===b.St.rev);
   r.St.putShards({b:"{\"y\":3}"},["a","b"]);await r.St.whenIdle();
   ok("parçalı: yalnız verilen parça yazılır, ötekinin sıra numarası değişmez",r.disk.get("m:b").v==="{\"y\":3}"&&r.disk.get("m:a").rev===b.disk.get("m:a").rev);}
  {const b=await boot();b.St.putShards({a:"{}"},["a"]);b.idb.failWrites=true;b.St.putShards({a:"{\"z\":1}"},["a"]);await b.St.whenIdle();
   ok("parçalı: yazılamayan parça bellekte kalır, başarısız bildirilir",b.St.failed&&b.St.getShards().a==="{\"z\":1}");
   b.idb.failWrites=false;b.St.putShards({a:"{\"z\":2}"},["a"]);await b.St.whenIdle();
   ok("parçalı: sonraki yazımda düzelir, son hal diskte",!b.St.failed&&b.disk.get("m:a").v==="{\"z\":2}");}
  {const disk=new Map([["m:meta",{v:JSON.stringify({v:2,rev:4,ids:["a","b"]}),rev:4}],["m:a",{v:"{}",rev:4}]]); // b parçası kayıp
   const b=await boot({disk});
   ok("parçalı: kayıp parça varsa eldeki parçalar yine okunur (uygulama tamamlar), hata bayrağı yok",b.St.sharded&&!b.St.shardError&&b.St.getShards().a==="{}"&&b.St.getShards().b===undefined);}
  {const disk=new Map([["m:meta",{v:"{bozuk",rev:4}]]);const b=await boot({disk,ls:{koc_v1:J("stale")}});
   ok("parçalı: m:meta okunamazsa eski localStorage metnine DÜŞÜLMEZ, hata bayrağı kalkar",b.St.sharded&&b.St.shardError&&b.St.get("koc_v1")===null);}

  /* localStorage kipi (IndexedDB yok): eski davranış */
  {delete require.cache[path];globalThis.localStorage=mkLs({koc_v1:"z"});delete globalThis.indexedDB;const St=require(path);const r=St.init();
   ok("IndexedDB yoksa senkron localStorage",r===undefined&&St.mode==="ls"&&St.get("koc_v1")==="z"&&St.set("koc_v1_onceki","q")&&globalThis.localStorage.getItem("koc_v1_onceki")==="q");}
  console.log(bad?bad+" başarısız":"Tüm depo testleri geçti");process.exit(bad?1:0);
})();
