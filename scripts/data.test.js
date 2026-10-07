/* Veri bütünlüğü: bozuk kayıt kurtarma, alan yalıtımı, atılan öğe bildirimi, kota, arşiv sınırı, çok sekme, anahtar kasası düşüşü. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const www=f=>path.join(__dirname,"../www",f);
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const open=(seed,o={})=>new Promise(res=>{
  const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://localhost/",beforeParse(w){
    Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});w.scrollTo=()=>{};w.confirm=()=>o.confirm!==false;
    if(o.vault)w.Capacitor={Plugins:{KeyVault:o.vault}};
    for(const k in seed)w.localStorage.setItem(k,seed[k]);
    if(o.quota){
      const set=w.Storage.prototype.setItem,used=(s,skip)=>{let n=0;for(let i=0;i<s.length;i++){const k=s.key(i);if(k!==skip)n+=k.length+s.getItem(k).length}return n};
      w.Storage.prototype.setItem=function(k,v){if(used(this,k)+k.length+String(v).length>o.quota)throw new Error("QuotaExceededError");return set.call(this,k,v)};
    }
  }});
  setTimeout(()=>res(dom.window),150);
});
const E=(day,type,v,x={})=>({id:0,day,time:"08:00",type,v,text:"",...x});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  // ---- bozuk kayıt: kurtarma ekranı, save kilitli ----
  let w=await open({koc_v1:'{"entries":[{"id":1,'});
  let ev=s=>w.eval(s),q=s=>w.document.querySelector(s),ls=k=>w.localStorage.getItem(k);
  ok("bozuk JSON: 'Kayıtların okunamadı' ekranı, ham veri yerinde durur",q("#view").textContent.includes("Kayıtların okunamadı")&&ls("koc_v1")==='{"entries":[{"id":1,');
  ev("S.settings.kcal=2000");ev("save()");
  ok("kurtarma ekranında save yazmaz (ham veri ezilmez)",ls("koc_v1")==='{"entries":[{"id":1,');
  q('[data-act="rectry"]').click();
  ok("yeniden dene: hâlâ bozuksa ekran kalır",q("#view").textContent.includes("Kayıtların okunamadı"));
  w.localStorage.setItem("koc_v1",JSON.stringify({entries:[E("2026-09-01","kilo",80)],settings:{obDone:true}}));
  q('[data-act="rectry"]').click();
  ok("yeniden dene: kayıt düzelince yüklenir",ev("S.entries.length")===1&&!q("#view").textContent.includes("Kayıtların okunamadı"));
  w=await open({koc_v1:"bozuk{"});ev=s=>w.eval(s);q=s=>w.document.querySelector(s);
  q('[data-act="recnew"]').click();
  ok("boş başla: ham kopya koc_v1_bozuk'ta saklanır, uygulama açılır, kayıt yazılır",w.localStorage.getItem("koc_v1_bozuk")==="bozuk{"&&w.localStorage.getItem("koc_v1")!=="bozuk{"&&!q("#view").textContent.includes("Kayıtların okunamadı"));
  ev("S.settings.obDone=true;tab='ayar-veri';render()");
  ok("Veri ve yedek: okunamayan kopya satırı, dışa aktar ve sil düğmeleri",q('[data-act="kopya:koc_v1_bozuk"]')&&q('[data-act="kopyasil:koc_v1_bozuk"]'));
  q('[data-act="kopyasil:koc_v1_bozuk"]').click();
  ok("kopya silinir",w.localStorage.getItem("koc_v1_bozuk")===null&&!q('[data-act="kopya:koc_v1_bozuk"]'));

  // ---- alan yalıtımı, atılan öğe sayısı, id'ler, yetim wid ----
  w=await open({});ev=s=>w.eval(s);
  const raw={entries:[E("2026-09-01","kilo",80,{id:7}),E("2026-09-02","kilo",81,{id:7}),E("2026-09-03","spor",30,{id:3,wid:5}),E("2026-09-03","spor",20,{id:4,wid:99}),{type:"x"},E("2026-09-04","su",-5)],
    settings:{obDone:true,kcal:2000},meds:[{id:1,n:"A",t:["08:00"]}],medLog:[{m:1,day:"2026-09-01",slot:"08:00",st:"t"}],
    workouts:[{id:5,day:"2026-09-03",t0:1e12,t1:1e12+6e5,name:"A",ex:[{id:"squat",sets:[{kg:100,reps:5,done:true},{kg:5000,reps:5,done:true}]}]},{id:"x"}]};
  ev(`window.__b=buildState(${JSON.stringify(raw)})`);
  ok("id korunur, çakışan id yeniden verilir, nextId en büyük+1",ev("__b.S.entries.map(e=>e.id).join()")==="7,8,3,4"&&ev("__b.S.nextId")===9,ev("__b.S.entries.map(e=>e.id).join()"));
  ok("yetim wid temizlenir, bağlı olan kalır; ilaç, ilaç kaydı ve antrenman kimlikleri bozulmaz",ev("__b.S.entries.map(e=>e.wid).join()")===",,5,"&&ev("__b.S.medLog.length")===1&&ev("__b.S.meds[0].id")===1&&ev("__b.S.workouts[0].id")===5,ev("__b.S.entries.map(e=>e.wid).join()"));
  ok("atılan öğe sayısı: 2 geçersiz kayıt + 1 bozuk antrenman + 1 aralık dışı set",ev("__b.drop")===4,ev("__b.drop"));
  ev("MedLib.cleanMeds=()=>{throw new Error('x')}");
  ev(`window.__b=buildState(${JSON.stringify(raw)})`);
  ok("tek alan bozuksa yalnız o alan varsayılana döner: kayıtlar, ayarlar, antrenman korunur",ev("__b.lost.join()")==="meds"&&ev("__b.S.meds.length")===0&&ev("__b.S.medLog.length")===0&&ev("__b.S.entries.length")===4&&ev("__b.S.settings.kcal")===2000&&ev("__b.S.workouts.length")===1,ev("__b.lost.join()"));
  w=await open({koc_v1:JSON.stringify(raw)});ev=s=>w.eval(s);
  ok("açılışta atılanlar bildirilir ve ham kopya saklanır",ev("loadNote").includes("4 geçersiz kayıt")&&JSON.parse(w.localStorage.getItem("koc_v1_bozuk")).entries.length===6&&w.document.querySelector("#tmsg").textContent.includes("4 geçersiz"),ev("loadNote"));
  w=await open({koc_v1:JSON.stringify({entries:[E("2026-09-01","kilo",80,{id:3})],settings:{obDone:true}})});ev=s=>w.eval(s);
  ok("temiz kayıtta not ve kopya yok; id turdan sonra aynı",ev("loadNote")===""&&w.localStorage.getItem("koc_v1_bozuk")===null&&ev("S.entries[0].id")===3&&ev("S.nextId")===4);

  // ---- kota: güvenlik kopyaları önce gider; arşiv sınırı ----
  const big="x".repeat(300000);
  w=await open({koc_v1:JSON.stringify({entries:[E("2026-09-01","kilo",80)],settings:{obDone:true}}),koc_v1_onceki:big,koc_v1_bozuk:big},{quota:900000});ev=s=>w.eval(s);
  ev("S.entries.push(...Array.from({length:3000},(_,i)=>({id:i+10,day:'2026-09-01',time:'08:00',type:'not',v:null,text:'n'.repeat(60)})));save()");
  ok("depo dolunca önce güvenlik kopyası silinir, kayıt yazılır, kullanıcı verisine dokunulmaz",ev("saveFail")===false&&JSON.parse(w.localStorage.getItem("koc_v1")).entries.length===3001&&w.localStorage.getItem("koc_v1_onceki")===null&&w.localStorage.getItem("koc_v1_bozuk")!==null);
  w=await open({koc_v1_onceki:"y".repeat(2e6)});ev=s=>w.eval(s);
  ok("kopyalar boyut uyarısına dahil",ev("storeBytes")>4e6&&ev("storeMsg()")!==null,ev("storeBytes"));
  w=await open({});ev=s=>w.eval(s);
  const msg=i=>({id:i,role:"user",text:"a".repeat(1500),t:i}),arc=n=>Array.from({length:n},(_,c)=>({id:1000+c,t:c,title:"S"+c,msgs:Array.from({length:150},(_,i)=>msg(c*1000+i+1))}));
  ev(`S.chats=${JSON.stringify(arc(20))};save()`);
  ok("arşiv sohbetleri toplam boyut sınırını aşmaz (en eskiler gider, yeniler kalır)",JSON.stringify(ev("S.chats")).length<=1.5e6&&ev("S.chats.length")<20&&ev("S.chats[0].id")===1000&&w.localStorage.getItem("koc_v1").length<2e6,ev("S.chats.length"));

  // ---- çok sekme ----
  w=await open({koc_v1:JSON.stringify({entries:[E("2026-09-01","kilo",80)],settings:{obDone:true}})});ev=s=>w.eval(s);
  const other=JSON.stringify({entries:[E("2026-09-01","kilo",80),E("2026-09-02","kilo",79)],settings:{obDone:true,kcal:1900}});
  w.dispatchEvent(new w.StorageEvent("storage",{key:"koc_v1",newValue:other,storageArea:w.localStorage}));
  ok("başka sekmenin kaydı alınır, bu sekme eski veriyle ezmez",ev("S.entries.length")===2&&ev("S.settings.kcal")===1900&&w.document.querySelector("#tmsg").textContent.includes("sekme"));
  w.dispatchEvent(new w.StorageEvent("storage",{key:"koc_v1",newValue:"bozuk{",storageArea:w.localStorage}));
  ok("bozuk uzak değer yok sayılır",ev("S.entries.length")===2);

  // ---- geri yükleme: güvenlik kopyası ----
  w=await open({koc_v1:JSON.stringify({entries:[E("2026-09-01","kilo",80)],settings:{obDone:true}})});ev=s=>w.eval(s);
  ev("sheetYedek()");w.document.querySelector("#bk").value=JSON.stringify({entries:[E("2026-09-05","kilo",70),E("2026-09-06","kilo",69)],settings:{obDone:true}});
  await ev("goYukle()");
  ok("düz (eski) yedek hâlâ yüklenir; önceki veri güvenlik kopyasında",ev("S.entries.length")===2&&JSON.parse(w.localStorage.getItem("koc_v1_onceki")).entries[0].v===80);
  ev("sheetPrivacy();pvDelete(1)");
  ok("kategori silinince güvenlik kopyası da silinir",w.localStorage.getItem("koc_v1_onceki")===null);

  // ---- anahtar kasası ----
  const vault=b=>({encrypt:async({text})=>{if(b)throw new Error("keystore");return {data:Buffer.from("ENC:"+text).toString("base64")}},decrypt:async({data})=>{const t=Buffer.from(data,"base64").toString();if(b||!t.startsWith("ENC:"))throw new Error("bad");return {text:t.slice(4)}}});
  w=await open({},{vault:vault(true),confirm:false});ev=s=>w.eval(s);await wait(100);
  await ev("setKey('groq','SIRRI-9')");
  ok("kasa çalışmıyor, kullanıcı düz saklamayı reddetti: anahtar diske yazılmaz, oturumda kalır",(w.localStorage.getItem("koc_keys")||"{}")==="{}"&&!Object.keys(w.localStorage).some(k=>String(w.localStorage.getItem(k)).includes("SIRRI-9"))&&ev("getKeys().groq")==="SIRRI-9");
  w=await open({},{vault:vault(true),confirm:true});ev=s=>w.eval(s);await wait(100);
  await ev("setKey('groq','SIRRI-9')");
  ok("kullanıcı onaylarsa düz saklanır ve seçim hatırlanır",JSON.parse(w.localStorage.getItem("koc_keys")).groq==="SIRRI-9"&&w.localStorage.getItem("koc_keys_plain")==="1");
  w=await open({koc_keys:JSON.stringify({groq:"SIRRI-3"})},{vault:vault(true)});ev=s=>w.eval(s);await wait(100);
  ok("mevcut düz anahtar kasa bozukken kaybolmaz ve kullanıcıya söylenir",ev("getKeys().groq")==="SIRRI-3"&&w.document.querySelector("#tmsg").textContent.includes("şifrelenemedi"));
  w=await open({},{vault:vault(false)});ev=s=>w.eval(s);await wait(100);
  await ev("setKey('groq','SIRRI-5')");
  ok("kasa sağlamken şifreli saklanır, düz metin sorulmaz",w.localStorage.getItem("koc_keys")===null&&!!w.localStorage.getItem("koc_keys_enc"));
  process.exit(bad?1:0);
})();
