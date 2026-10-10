/* Saat adımları (Health Connect): gün değeri telefon ile saatin büyüğüdür, toplamı değil; sahte Health eklentisiyle okuma, izin ve kapalı durum. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const www=f=>path.join(__dirname,"../www",f);
const html=require("./html").build();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function open(seed,fake){
  const calls=[];
  return new Promise(r=>{
    const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://localhost/",beforeParse(w){
      Object.assign(w,{structuredClone,TextEncoder,TextDecoder});w.scrollTo=()=>{};
      if(fake)w.Capacitor={isNativePlatform:()=>true,Plugins:{Health:{
        status:async()=>({available:fake.available!==false,granted:fake.granted,sleep:fake.granted&&!fake.noSleep,hr:fake.granted&&!fake.noHr}),
        daily:async o=>{calls.push("daily:"+o.days.length);return fake.daily?fake.daily(o.days):{sleep:{},hrAvg:{},hrMin:{}}},
        request:async()=>{calls.push("request");fake.granted=fake.grantOnRequest===true;return {}},
        manage:async()=>{calls.push("manage")},
        steps:async o=>{calls.push("steps:"+o.days.length);return {days:fake.days(o.days)}}}}};
      if(seed)w.localStorage.setItem("nw_state",JSON.stringify(seed));
    }});
    setTimeout(()=>r({w:dom.window,calls}),200);
  });
}
(async()=>{
  let {w}=await open({entries:[],settings:{}}),ev=s=>w.eval(s);
  const d=ev("dayKey()");
  ev(`setSteps("${d}",100)`);ev(`setHc("${d}",500)`);
  let e=ev(`JSON.stringify(S.entries.find(x=>x.type==="steps"))`);e=JSON.parse(e);
  ok("saat telefondan büyükse gün değeri saatin; toplanmaz (100 + 500 değil 500)",e.v===500&&e.ph===100&&e.hc===500,e);
  ev(`setSteps("${d}",700)`);
  ok("telefon saatten büyükse telefonun değeri",ev(`S.entries.find(x=>x.type==="steps").v`)===700);
  ev(`setSteps("${d}",0)`);
  ok("telefon sayacı sıfırlanınca (sensör sıfırı) saatin değeri kalır",ev(`S.entries.find(x=>x.type==="steps").v`)===500);
  ev(`setHc("${d}",200)`);
  ok("saatin değeri düşerse gün değeri de düşer (kaynak düzeltmesi)",ev(`S.entries.find(x=>x.type==="steps").v`)===200);
  ok("aynı değer ikinci kez yazılınca değişiklik yok",ev(`setHc("${d}",200)`)===false&&ev(`setSteps("${d}",0)`)===false);

  ({w}=await open({entries:[],settings:{}}));ev=s=>w.eval(s);
  ev(`S.entries.push({id:S.nextId++,day:"${d}",time:"00:00",type:"steps",v:300,text:""})`);
  ev(`setHc("${d}",100)`);
  e=JSON.parse(ev(`JSON.stringify(S.entries.find(x=>x.type==="steps"))`));
  ok("eski kayıtta ph yoksa v telefon değeri sayılır (300, saat 100 küçük)",e.v===300&&e.ph===300&&e.hc===100,e);
  ev(`S.entries=[]`);
  ok("saat sıfırsa ve kayıt yoksa kayıt açılmaz",ev(`setHc("${d}",0)`)===false&&ev(`S.entries.length`)===0);
  ok("saatsiz kullanımda kayıt hc taşımaz (eski davranış)",(ev(`setSteps("${d}",50)`),JSON.parse(ev(`JSON.stringify(S.entries[0])`)).hc===undefined));
  ev(`stepToday=100;hcToday=400;hcDay=dayKey()`);
  ok("bugünkü gösterim telefon ve saatin büyüğü; elle eklenen üstüne",ev(`stepsShown()`)===400);
  ev(`stepToday=900`);ok("telefon büyükse telefon",ev(`stepsShown()`)===900);
  ev(`stepToday=null;hcToday=null`);ok("ikisi de yoksa null",ev(`stepsShown()`)===null);
  const cl=ev(`JSON.stringify(cleanEntries([{id:1,day:"${d}",time:"00:00",type:"steps",v:500,ph:100,hc:500,text:""},{id:2,day:"${d}",time:"00:00",type:"steps",v:5,ph:-3,hc:"x",text:""}]).out)`);
  const co=JSON.parse(cl);
  ok("yedekten okurken ph ve hc korunur, bozuk değer atılır",co[0].ph===100&&co[0].hc===500&&co[1].ph===undefined&&co[1].hc===undefined,co);

  // eklenti: açıkken okur, kapalıyken dokunmaz
  const days=ds=>Object.fromEntries(ds.map((k,i)=>[k,i===0?4321:i===2?900:undefined]).filter(x=>x[1]!==undefined));
  let fake={granted:true,days};
  let o=await open({entries:[],settings:{hcOn:true}},fake);w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("açıkken 8 günlük adım okunur",o.calls.includes("steps:8"),o.calls);
  ok("bugünün saat değeri gösterime girer, geçmiş gün kaydedilir",ev(`hcToday`)===4321&&ev(`S.entries.filter(x=>x.type==="steps").length`)===2,ev(`JSON.stringify(S.entries)`));
  ok("yalnız bugünü değil, saat kaydı olan günleri de yazar",ev(`S.entries.some(x=>x.type==="steps"&&x.day===keyOff(-2)&&x.v===900)`));
  const n=o.calls.length;await ev(`hcSync()`);
  ok("60 sn içinde yeniden okumaz",o.calls.length===n);

  o=await open({entries:[],settings:{hcOn:false}},{granted:true,days});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("ayar kapalıyken eklentiye dokunulmaz",o.calls.length===0,o.calls);

  o=await open({entries:[],settings:{hcOn:true}},{granted:false,days});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("izin yokken okuma yapılmaz",!o.calls.some(c=>c.startsWith("steps")),o.calls);

  o=await open({entries:[],settings:{}},{granted:false,grantOnRequest:true,days});w=o.w;ev=s=>w.eval(s);
  ev(`tab="steps";S.entries.push({id:S.nextId++,day:dayKey(),time:"00:00",type:"steps",v:10,text:""});render()`);await sleep(50);
  const t=w.document.querySelector("[data-hc=toggle]");t.checked=true;t.dispatchEvent(new w.Event("change",{bubbles:true}));await sleep(100);
  ok("anahtar açılınca izin istenir, verilince ayar açık kalır ve okunur",o.calls.includes("request")&&ev(`S.settings.hcOn`)===true&&o.calls.includes("steps:8"),o.calls);

  o=await open({entries:[],settings:{}},{available:false,granted:false,days});w=o.w;ev=s=>w.eval(s);
  ev(`tab="steps";S.entries.push({id:S.nextId++,day:dayKey(),time:"00:00",type:"steps",v:10,text:""});render()`);await sleep(80);
  ok("Health Connect yoksa (Android 13 altı) anahtar yerine açıklama gösterilir",!w.document.querySelector("[data-hc=toggle]")&&/Android 14/.test(w.document.body.textContent),0);

  o=await open({entries:[],settings:{hcOn:true}},{granted:true,days});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);ev(`hcDay="2000-01-01"`);
  ok("gece yarısından sonra dünün saat değeri bugün sayılmaz",ev(`hcNow()`)===null&&ev(`stepsShown()`)===null);
  const fk={granted:true,days};o=await open({entries:[],settings:{hcOn:true}},fk);w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);ok("izinliyken değer var",ev(`hcNow()`)===4321);
  fk.granted=false;await ev(`hcSync(true)`);
  ok("izin geri alınırsa saat değeri gösterimden kalkar",ev(`hcNow()`)===null);
  fk.granted=true;await ev(`hcSync()`);
  ok("izin yokken 5 sn'den sık denenmez, 60 sn beklemez",ev(`hcNow()`)===null);
  ev(`hcAt=0`);await ev(`hcSync()`);
  ok("izin geri gelince okuma sürer",ev(`hcNow()`)===4321);

  // uyku ve nabız
  const dl=ds=>({sleep:{[ds[0]]:431,[ds[1]]:30,[ds[2]]:455},hrAvg:{[ds[0]]:68,[ds[1]]:70},hrMin:{[ds[0]]:51}});
  o=await open({entries:[],settings:{hcOn:true},sleep:[{day:new Date(Date.now()-2*864e5).toLocaleDateString("sv"),min:300,q:4}]},{granted:true,days,daily:dl});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  const d0=ev(`keyOff(0)`),d2=ev(`keyOff(-2)`);
  ok("saatten uyku yazılır (src hc), 60 dakikadan kısası atlanır",ev(`S.sleep.find(x=>x.day==="${d0}").min`)===431&&ev(`S.sleep.find(x=>x.day==="${d0}").src`)==="hc"&&!ev(`S.sleep.some(x=>x.day===keyOff(-1))`),ev(`JSON.stringify(S.sleep)`));
  ok("elle girilen uyku kaydı saatinkini ezmez",ev(`S.sleep.find(x=>x.day==="${d2}").min`)===300&&ev(`S.sleep.find(x=>x.day==="${d2}").src`)===undefined);
  ok("günlük nabız: ortalama ve en düşük kaydedilir, en düşük yoksa boş",ev(`S.hr.find(x=>x.day==="${d0}").a`)===68&&ev(`S.hr.find(x=>x.day==="${d0}").m`)===51&&ev(`S.hr.find(x=>x.day===keyOff(-1)).m`)===undefined);
  ev(`S.sleep=[];S.hr=[];S.settings.hcFrom=keyOff(1);hcAt=0`);await ev(`hcSync(true)`);
  ok("silinen veri (hcFrom) saatten geri yazılmaz",ev(`S.sleep.length`)===0&&ev(`S.hr.length`)===0);
  o=await open({entries:[],settings:{hcOn:true}},{granted:true,noSleep:true,noHr:true,days,daily:dl});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("uyku ve nabız izni yoksa günlük veri istenmez, adım yine okunur",!o.calls.some(c=>c.startsWith("daily"))&&o.calls.includes("steps:8"),o.calls);
  ev(`S.sleep=HabitLib.cleanSleep([{day:keyOff(-3),min:400,src:"hc"}]);hcApplyDaily({sleep:{[keyOff(-3)]:410}},[keyOff(-3)])`);
  ok("saatin uykusu değişirse güncellenir",ev(`S.sleep[0].min`)===410);
  // kamera ölçümü kaydı ve silme
  ev(`plBpm=71;plSave()`);
  ok("kamera ölçümü kaydedilir (gün, saat, atım)",ev(`S.pulse.length`)===1&&ev(`S.pulse[0].bpm`)===71&&/^\d\d:\d\d$/.test(ev(`S.pulse[0].time`)),ev(`JSON.stringify(S.pulse)`));
  Object.defineProperty(w.navigator,"mediaDevices",{value:{getUserMedia:async()=>{throw new Error("izin yok")}},configurable:true});
  ev(`plSheet()`);
  ok("Nabız ekranı kamera ölçümlerini ve saatten gelen günlük nabzı listeler",/71/.test(w.document.querySelector("#sheet").textContent)&&/Kamerayla ölç/.test(w.document.querySelector("#sheet").textContent));
  await ev(`plStart()`);
  ok("kamera izni verilmezse ölçüm başlamaz, Nabız ekranına dönülür ve kamera kapalı kalır",ev(`pl`)===null&&/Kamerayla ölç/.test(w.document.querySelector("#sheet").textContent));
  w.document.querySelector('[data-pl^="del:"]').click();
  ok("kamera ölçümü silinir",ev(`S.pulse.length`)===0);
  const bs=ev(`JSON.stringify(buildState({entries:[],settings:{},pulse:[{day:"2026-10-01",time:"07:30",bpm:64}],hr:[{day:"2026-10-01",a:62,m:48}]}).S)`);
  const bo=JSON.parse(bs);
  ok("yedekten dönünce nabız ve saat nabzı korunur",bo.pulse.length===1&&bo.pulse[0].bpm===64&&bo.hr[0].a===62&&bo.hr[0].m===48,[bo.pulse,bo.hr]);
  ev(`S.pulse=PulseLib.clean([{day:"2026-10-01",time:"07:30",bpm:64}]);S.hr=PulseLib.cleanHr([{day:"2026-10-01",a:62}])`);
  const pc=ev(`PV_CATS.find(c=>/Nabız/.test(c[0]))`);
  ok("gizlilik: Nabız kategorisi sayılır ve silince saatten geri gelmez",pc&&ev(`PV_CATS.find(c=>/Nabız/.test(c[0]))[1]()`)===2&&(ev(`PV_CATS.find(c=>/Nabız/.test(c[0]))[2]()`),ev(`S.pulse.length+S.hr.length`)===0&&ev(`S.settings.hcFrom`)===ev(`keyOff(1)`)));
  const csv=ev(`JSON.stringify(CsvLib.files(Object.assign({},S,{pulse:[{day:"2026-10-01",time:"07:30",bpm:64}],hr:[{day:"2026-10-01",a:62,m:48}]}),{exName:()=>"",vctx:()=>""}).find(f=>f.key==="nabiz").n)`);
  ok("tabloya aktarma: nabız dosyası kamera ve saat satırlarını içerir",csv==="2");

  const hp=fs.readFileSync(path.join(__dirname,"../assets/android/HealthPlugin.java"),"utf8"),pa=fs.readFileSync(path.join(__dirname,"patch-android.js"),"utf8");
  ok("Android: yalnız okuma izni (yazma yok), izin kullanım ekranı bildirilir, eklenti kopyalanır ve kaydedilir",/android\.permission\.health\.READ_STEPS/.test(hp)&&!/WRITE_/.test(hp+pa)&&/"health\.READ_STEPS", "health\.READ_SLEEP", "health\.READ_HEART_RATE"/.test(pa)&&/READ_SLEEP/.test(hp)&&/READ_HEART_RATE/.test(hp)&&/BPM_AVG/.test(hp)&&/HEALTH_PERMISSIONS/.test(pa)&&/"HealthPlugin"/.test(pa)&&/registerPlugin\(HealthPlugin\.class\)/.test(fs.readFileSync(path.join(__dirname,"../assets/android/MainActivity.java"),"utf8")));
  ok("Android: sürüm 34 altında yönetici alınmaz, günler sınırlı ve geçersiz gün reddedilir",/SDK_INT >= 34/.test(hp)&&/MAX_DAYS = 40/.test(hp)&&/in\.length\(\) > MAX_DAYS/.test(hp)&&/LocalDate\.parse\(in\.getString\(k\)\)/.test(hp)&&/days == null\) \{\s*call\.reject/.test(hp));
  console.log(bad?"Başarısız: "+bad:"Tüm saat adımı testleri geçti");process.exit(bad?1:0);
})();
