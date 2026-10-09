/* Saat adımları (Health Connect): gün değeri telefon ile saatin büyüğüdür, toplamı değil; sahte Health eklentisiyle okuma, izin ve kapalı durum. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const www=f=>path.join(__dirname,"../www",f);
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function open(seed,fake){
  const calls=[];
  return new Promise(r=>{
    const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://localhost/",beforeParse(w){
      Object.assign(w,{structuredClone,TextEncoder,TextDecoder});w.scrollTo=()=>{};
      if(fake)w.Capacitor={isNativePlatform:()=>true,Plugins:{Health:{
        status:async()=>({available:fake.available!==false,granted:fake.granted}),
        request:async()=>{calls.push("request");fake.granted=fake.grantOnRequest===true;return {}},
        manage:async()=>{calls.push("manage")},
        steps:async o=>{calls.push("steps:"+o.days.length);return {days:fake.days(o.days)}}}}};
      if(seed)w.localStorage.setItem("koc_v1",JSON.stringify(seed));
    }});
    setTimeout(()=>r({w:dom.window,calls}),200);
  });
}
(async()=>{
  let {w}=await open({entries:[],settings:{}}),ev=s=>w.eval(s);
  const d=ev("dayKey()");
  ev(`setSteps("${d}",100)`);ev(`setHc("${d}",500)`);
  let e=ev(`JSON.stringify(S.entries.find(x=>x.type==="adim"))`);e=JSON.parse(e);
  ok("saat telefondan büyükse gün değeri saatin; toplanmaz (100 + 500 değil 500)",e.v===500&&e.ph===100&&e.hc===500,e);
  ev(`setSteps("${d}",700)`);
  ok("telefon saatten büyükse telefonun değeri",ev(`S.entries.find(x=>x.type==="adim").v`)===700);
  ev(`setSteps("${d}",0)`);
  ok("telefon sayacı sıfırlanınca (sensör sıfırı) saatin değeri kalır",ev(`S.entries.find(x=>x.type==="adim").v`)===500);
  ev(`setHc("${d}",200)`);
  ok("saatin değeri düşerse gün değeri de düşer (kaynak düzeltmesi)",ev(`S.entries.find(x=>x.type==="adim").v`)===200);
  ok("aynı değer ikinci kez yazılınca değişiklik yok",ev(`setHc("${d}",200)`)===false&&ev(`setSteps("${d}",0)`)===false);

  ({w}=await open({entries:[],settings:{}}));ev=s=>w.eval(s);
  ev(`S.entries.push({id:S.nextId++,day:"${d}",time:"00:00",type:"adim",v:300,text:""})`);
  ev(`setHc("${d}",100)`);
  e=JSON.parse(ev(`JSON.stringify(S.entries.find(x=>x.type==="adim"))`));
  ok("eski kayıtta ph yoksa v telefon değeri sayılır (300, saat 100 küçük)",e.v===300&&e.ph===300&&e.hc===100,e);
  ev(`S.entries=[]`);
  ok("saat sıfırsa ve kayıt yoksa kayıt açılmaz",ev(`setHc("${d}",0)`)===false&&ev(`S.entries.length`)===0);
  ok("saatsiz kullanımda kayıt hc taşımaz (eski davranış)",(ev(`setSteps("${d}",50)`),JSON.parse(ev(`JSON.stringify(S.entries[0])`)).hc===undefined));
  ev(`stepToday=100;hcToday=400`);
  ok("bugünkü gösterim telefon ve saatin büyüğü; elle eklenen üstüne",ev(`stepsShown()`)===400);
  ev(`stepToday=900`);ok("telefon büyükse telefon",ev(`stepsShown()`)===900);
  ev(`stepToday=null;hcToday=null`);ok("ikisi de yoksa null",ev(`stepsShown()`)===null);
  const cl=ev(`JSON.stringify(cleanEntries([{id:1,day:"${d}",time:"00:00",type:"adim",v:500,ph:100,hc:500,text:""},{id:2,day:"${d}",time:"00:00",type:"adim",v:5,ph:-3,hc:"x",text:""}]).out)`);
  const co=JSON.parse(cl);
  ok("yedekten okurken ph ve hc korunur, bozuk değer atılır",co[0].ph===100&&co[0].hc===500&&co[1].ph===undefined&&co[1].hc===undefined,co);

  // eklenti: açıkken okur, kapalıyken dokunmaz
  const days=ds=>Object.fromEntries(ds.map((k,i)=>[k,i===0?4321:i===2?900:undefined]).filter(x=>x[1]!==undefined));
  let fake={granted:true,days};
  let o=await open({entries:[],settings:{hcOn:true}},fake);w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("açıkken 8 günlük adım okunur",o.calls.includes("steps:8"),o.calls);
  ok("bugünün saat değeri gösterime girer, geçmiş gün kaydedilir",ev(`hcToday`)===4321&&ev(`S.entries.filter(x=>x.type==="adim").length`)===2,ev(`JSON.stringify(S.entries)`));
  ok("yalnız bugünü değil, saat kaydı olan günleri de yazar",ev(`S.entries.some(x=>x.type==="adim"&&x.day===keyOff(-2)&&x.v===900)`));
  const n=o.calls.length;await ev(`hcSync()`);
  ok("60 sn içinde yeniden okumaz",o.calls.length===n);

  o=await open({entries:[],settings:{hcOn:false}},{granted:true,days});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("ayar kapalıyken eklentiye dokunulmaz",o.calls.length===0,o.calls);

  o=await open({entries:[],settings:{hcOn:true}},{granted:false,days});w=o.w;ev=s=>w.eval(s);
  await ev(`hcSync(true)`);
  ok("izin yokken okuma yapılmaz",!o.calls.some(c=>c.startsWith("steps")),o.calls);

  o=await open({entries:[],settings:{}},{granted:false,grantOnRequest:true,days});w=o.w;ev=s=>w.eval(s);
  ev(`tab="adim";S.entries.push({id:S.nextId++,day:dayKey(),time:"00:00",type:"adim",v:10,text:""});render()`);await sleep(50);
  const t=w.document.querySelector("[data-hc=toggle]");t.checked=true;t.dispatchEvent(new w.Event("change",{bubbles:true}));await sleep(100);
  ok("anahtar açılınca izin istenir, verilince ayar açık kalır ve okunur",o.calls.includes("request")&&ev(`S.settings.hcOn`)===true&&o.calls.includes("steps:8"),o.calls);

  o=await open({entries:[],settings:{}},{available:false,granted:false,days});w=o.w;ev=s=>w.eval(s);
  ev(`tab="adim";S.entries.push({id:S.nextId++,day:dayKey(),time:"00:00",type:"adim",v:10,text:""});render()`);await sleep(80);
  ok("Health Connect yoksa (Android 13 altı) anahtar yerine açıklama gösterilir",!w.document.querySelector("[data-hc=toggle]")&&/Android 14/.test(w.document.body.textContent),0);

  const hp=fs.readFileSync(path.join(__dirname,"../assets/android/HealthPlugin.java"),"utf8"),pa=fs.readFileSync(path.join(__dirname,"patch-android.js"),"utf8");
  ok("Android: yalnız okuma izni (yazma yok), izin kullanım ekranı bildirilir, eklenti kopyalanır ve kaydedilir",/android\.permission\.health\.READ_STEPS/.test(hp)&&!/WRITE_/.test(hp+pa)&&/"health\.READ_STEPS"/.test(pa)&&/HEALTH_PERMISSIONS/.test(pa)&&/"HealthPlugin"\]\)fs\.copyFileSync/.test(pa)&&/registerPlugin\(HealthPlugin\.class\)/.test(pa));
  ok("Android: sürüm 34 altında yönetici alınmaz, günler sınırlı ve geçersiz gün reddedilir",/SDK_INT >= 34/.test(hp)&&/in\.length\(\) > 40/.test(hp)&&/geçersiz gün/.test(hp));
  console.log(bad?"Başarısız: "+bad:"Tüm saat adımı testleri geçti");process.exit(bad?1:0);
})();
