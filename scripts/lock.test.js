/* Uygulama kilidi: sahte AppLock eklentisiyle açılışta kilit, doğrulama sonuçları, ayar açma ve arka plan dönüşü. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const www=f=>path.join(__dirname,"../www",f);
const html=require("./html").build();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function open(lockOn,plugin){
  const calls=[],res={auth:{ok:true},secure:true};
  return new Promise(r=>{
    const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://localhost/",beforeParse(w){
      Object.assign(w,{structuredClone,TextEncoder,TextDecoder});w.scrollTo=()=>{};
      if(plugin)w.Capacitor={isNativePlatform:()=>true,Plugins:{AppLock:{status:async()=>({secure:res.secure}),authenticate:async o=>{calls.push("auth:"+o.title);return res.auth},setSecure:async o=>{calls.push("secure:"+o.on)}}}};
      if(lockOn){w.localStorage.setItem("nw_lockon","1");w.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{lockOn:true}}))}
    }});
    setTimeout(()=>r({w:dom.window,calls,res}),200);
  });
}
(async()=>{
  let {w,calls,res}=await open(true,true);
  const $=s=>w.document.querySelector(s),root=w.document.documentElement,ev=s=>w.eval(s);
  ok("kilit açıkken açılışta doğrulama istenir; başarılıysa kilit ekranı kalkar ve içerik görünür",calls.includes("auth:NeoWell kilidi")&&$("#lock").hidden&&!root.classList.contains("locked"),calls);
  ok("kilit açıkken son uygulamalar önizlemesi kapatılır (FLAG_SECURE)",calls.includes("secure:true"),calls);
  ({w,calls,res}=await open(true,false));
  ok("eklenti yoksa (tarayıcı) kilit uygulanmaz, içerik gizli kalmaz",!w.document.documentElement.classList.contains("locked"));
  // vazgeçme: kilit kalır; tekrar dene düğmesi doğrular
  const o=await new Promise(r=>{const calls2=[],res2={auth:{ok:false,cancelled:true},secure:true};const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://localhost/",beforeParse(x){Object.assign(x,{structuredClone,TextEncoder,TextDecoder});x.scrollTo=()=>{};x.Capacitor={isNativePlatform:()=>true,Plugins:{AppLock:{status:async()=>({secure:true}),authenticate:async()=>{calls2.push("a");return res2.auth},setSecure:async()=>{}}}};x.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{lockOn:true}}))}});setTimeout(()=>r({w:dom.window,calls2,res2}),200)});
  const d=o.w.document;
  ok("doğrulama iptal edilirse kilit ekranı kalır, içerik gizli, mesaj görünür",!d.querySelector("#lock").hidden&&d.documentElement.classList.contains("locked")&&/doğrula/i.test(d.querySelector("#lkm").textContent));
  o.res2.auth={ok:true};d.querySelector("[data-lk=ask]").click();await sleep(30);
  ok("Kilidi aç düğmesi yeniden doğrular ve açar",d.querySelector("#lock").hidden&&!d.documentElement.classList.contains("locked")&&o.calls2.length===2);
  // telefonda ekran kilidi kalmadı
  const p=await open(true,true);
  p.res.auth={ok:false,none:true};
  p.w.document.documentElement.classList.add("locked");
  p.w.eval("lockAsk()");await sleep(30);
  ok("telefonda ekran kilidi kalmamışsa kullanıcı kilitlenmez: uygulama kilidi kapanır ve kaydedilir",p.w.eval("S.settings.lockOn")===false&&!p.w.document.documentElement.classList.contains("locked")&&JSON.parse(p.w.localStorage.getItem("nw_state")).settings.lockOn!==true);
  // ayar açma
  const t=await open(false,true);
  const tg=()=>{const el=t.w.document.createElement("input");el.type="checkbox";el.checked=true;el.setAttribute("data-lk","toggle");t.w.document.body.append(el);return el};
  t.res.secure=false;let el=tg();el.dispatchEvent(new t.w.Event("change",{bubbles:true}));await sleep(30);
  ok("telefonda ekran kilidi yoksa uygulama kilidi açılmaz",t.w.eval("S.settings.lockOn")===false&&el.checked===false);
  t.res.secure=true;t.res.auth={ok:false,cancelled:true};el=tg();el.dispatchEvent(new t.w.Event("change",{bubbles:true}));await sleep(30);
  ok("doğrulama başarısızsa uygulama kilidi açılmaz",t.w.eval("S.settings.lockOn")===false&&el.checked===false);
  t.res.auth={ok:true};el=tg();el.dispatchEvent(new t.w.Event("change",{bubbles:true}));await sleep(30);
  ok("doğrulama başarılıysa uygulama kilidi açılır ve kaydedilir",t.w.eval("S.settings.lockOn")===true&&JSON.parse(t.w.localStorage.getItem("nw_state")).settings.lockOn===true);
  // arka plan dönüşü
  const g=await open(true,true);
  const vis=(hidden)=>{Object.defineProperty(g.w.document,"hidden",{configurable:true,get:()=>hidden});g.w.document.dispatchEvent(new g.w.Event("visibilitychange"))};
  const realNow=g.w.Date.now;let clock=realNow();g.w.Date.now=()=>clock;
  vis(true);clock+=10000;vis(false);await sleep(30);
  ok("10 sn'lik aradan dönünce kilit sorulmaz",g.w.document.querySelector("#lock").hidden);
  vis(true);clock+=40000;vis(false);await sleep(30);
  ok("30 sn'den uzun aradan dönünce kilit yeniden sorulur",g.calls.filter(c=>c.startsWith("auth")).length===2);
  process.exit(bad?1:0);
})();
