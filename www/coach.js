"use strict";
/* Koç: durum, sağlayıcı zinciri, sohbet ekranı ve ayarlar. coachlib.js ve algo.js'e dayanır. */
/* API anahtarları: bellekte KEYS; telefonda Keystore kasası (KeyVault) ile şifreli, kasa yoksa (tarayıcı) düz metin. */
const KEYS_LS="koc_keys",KEYS_ENC="koc_keys_enc";
let KEYS={},vaultOn=false;
const KV=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.KeyVault;
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};
const getKeys=()=>KEYS;
const keysStored=()=>!!(lsGet(KEYS_ENC)||lsGet(KEYS_LS));
const VAULT_WARN="Anahtarlar bu telefonda şifrelenemedi, düz saklanır";
/* Telefonda kasa çalışmazsa düz metne kullanıcı izniyle düşülür; izin yoksa anahtar yalnız bu oturumda bellekte kalır. */
let plainOk=lsGet("koc_keys_plain")==="1",plainNo=false,vaultWarned=false;
const plainHas=()=>{try{return Object.keys(JSON.parse(lsGet(KEYS_LS)||"{}")).length>0}catch(e){return false}};
async function persistKeys(){
  const j=JSON.stringify(KEYS);
  if(KV()){try{lsSet(KEYS_ENC,(await KV().encrypt({text:j})).data);lsDel(KEYS_LS);vaultOn=true;return}catch(e){vaultOn=false}}
  if(KV()&&Object.keys(KEYS).length){
    if(!plainOk&&!plainHas()){
      if(plainNo||!confirm(VAULT_WARN+". Tamam: düz saklansın. İptal: anahtar yalnız bu oturumda kalır, uygulamayı kapatınca yeniden girersin."))return void(plainNo=true);
      plainOk=true;lsSet("koc_keys_plain","1");
    }else if(!vaultWarned){vaultWarned=true;toast(VAULT_WARN)}
  }
  lsSet(KEYS_LS,j);
}
function setKey(id,k){if(k)KEYS[id]=k;else delete KEYS[id];return persistKeys()}
async function keysInit(){
  const kv=KV(),enc=lsGet(KEYS_ENC);let lost=false;
  const readPlain=()=>{try{KEYS=JSON.parse(lsGet(KEYS_LS))||{}}catch(e){KEYS={}}};
  if(!kv){readPlain();return}
  try{
    if(enc){try{KEYS=JSON.parse((await kv.decrypt({data:enc})).text)||{}}catch(e){KEYS={};lost=true;lsDel(KEYS_ENC)}}
    else readPlain();
    vaultOn=true;await persistKeys();
    if(vaultOn&&(await kv.decrypt({data:lsGet(KEYS_ENC)})).text!==JSON.stringify(KEYS)){vaultOn=false;lsSet(KEYS_LS,JSON.stringify(KEYS))}
  }catch(e){vaultOn=false;if(!Object.keys(KEYS).length)readPlain();lsSet(KEYS_LS,JSON.stringify(KEYS))}
  console.log("NW-VAULT "+(vaultOn?"ok":"fail"));
  if(lost)toast("Koç anahtarları bu telefonda okunamadı (kasa anahtarı geçersiz olmuş olabilir), yeniden gir");
  else if(kv&&!vaultOn&&Object.keys(KEYS).length){vaultWarned=true;toast(VAULT_WARN)}
}
const defProviders=()=>[
  {id:"nvidia",name:"NVIDIA Build",base:"https://integrate.api.nvidia.com/v1",model:"nvidia/nemotron-3-super-120b-a12b",on:true,health:true,confirm:false},
  {id:"groq",name:"Groq",base:"https://api.groq.com/openai/v1",model:"llama-3.3-70b-versatile",on:true,health:true,confirm:false},
  {id:"openrouter",name:"OpenRouter",base:"https://openrouter.ai/api/v1",model:"google/gemma-4-31b-it:free",on:true,health:true,confirm:false},
  {id:"gemini",name:"Google Gemini",base:"https://generativelanguage.googleapis.com/v1beta/openai",model:"gemini-3.5-flash-lite",on:false,health:false,confirm:true},
  {id:"openai",name:"OpenAI",base:"https://api.openai.com/v1",model:"gpt-6-luna",on:false,health:false,confirm:false},
  {id:"anthropic",name:"Anthropic Claude",base:"https://api.anthropic.com/v1",model:"claude-haiku-4-5",on:false,health:false,confirm:false}
];
/* Ücretli hazır sağlayıcılar: kurulumda ücret notu gösterilir. */
const PAID=["openai","anthropic"];
/* Sağlayıcı adları tek kaynaktan: gizlilik ekranı ve belgeler (app.test.js) bu listeyi kullanır. */
const provNames=()=>defProviders().map(p=>p.name).join(", ");
/* Anthropic yerel Messages API: x-api-key + sürüm başlığı; WebView'da CORS ön kontrolü yalnız direct-browser başlığıyla geçer. */
const pHeaders=(p,key)=>p.id==="anthropic"?{"x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"}:{Authorization:"Bearer "+key};
/* Sağlayıcının kaldırdığı eski hazır modeller: kayıtta tam bu değer duruyorsa yenisine geçilir, kullanıcının seçtiği model korunur. */
const DEAD_MODEL={nvidia:"meta/llama-3.3-70b-instruct",openrouter:"meta-llama/llama-3.3-70b-instruct:free",gemini:"gemini-2.0-flash"};
let pstat={},cool={},busy=false,typing=false,offline=null;

/* ---- doğrulama ---- */
function cleanCoach(r){
  const provs=[],known=EXMERGED.map(e=>e.id).concat((Array.isArray(r.customEx)?r.customEx:[]).map(e=>e&&e.id).filter(i=>typeof i==="string"&&/^c\d+$/.test(i)));
  for(const p of (Array.isArray(r.providers)?r.providers:[])){
    if(!p||typeof p.id!=="string"||!/^[a-z0-9]{1,16}$/.test(p.id)||p.id in Object.prototype||typeof p.name!=="string"||typeof p.base!=="string"||!/^https:\/\/[^\s]+$/.test(p.base)||typeof p.model!=="string")continue;
    if(provs.some(x=>x.id===p.id))continue;
    const def=defProviders().find(d=>d.id===p.id),model=DEAD_MODEL[p.id]===p.model?def.model:p.model.slice(0,100);
    /* Hazır sağlayıcının adresi ana makine beyaz listesidir: yedek ya da bozuk kayıt anahtarı başka sunucuya yönlendiremez. */
    provs.push({id:p.id,name:p.name.slice(0,40),base:def?def.base:p.base.slice(0,200),model,on:p.on===true,health:p.health===true,confirm:p.confirm===true});
  }
  /* Sonradan eklenen hazır sağlayıcılar eski kayda kapalı olarak eklenir. */
  if(provs.length)for(const d of defProviders())if(!provs.some(x=>x.id===d.id))provs.push(d);
  const chat=cleanChat(r.chat,known),chats=[];
  for(const x of (Array.isArray(r.chats)?r.chats:[]).slice(0,CHATS_MAX)){
    if(!x||!Number.isInteger(x.id)||!Number.isFinite(x.t)||chats.some(c=>c.id===x.id))continue;
    const msgs=cleanChat(x.msgs,known);
    if(msgs.length)chats.push({id:x.id,t:x.t,title:typeof x.title==="string"?x.title.slice(0,60):"Sohbet",msgs});
  }
  const top=Math.max(...chat.map(m=>m.id),...chats.flatMap(c=>c.msgs.map(m=>m.id)),0);
  return {providers:provs.length?provs:defProviders(),chat,chats:trimChats(chats),cid:Math.max(1,top+1,Number.isInteger(r.cid)?r.cid:1)};
}
const CHATS_MAX=20,ARCH_MSGS=600,ARCH_CHARS=250000;
/* Arşiv depolama kotasını doldurmasın: en yeni sohbetler kalır, toplam mesaj ve boyut sınırı aşılınca eskiler atılır (en yeni her zaman kalır). */
function trimChats(list){
  let n=0,ch=0;const out=[];
  for(const c of list){
    n+=c.msgs.length;ch+=JSON.stringify(c.msgs).length;
    if(out.length&&(n>ARCH_MSGS||ch>ARCH_CHARS))break;
    out.push(c);
  }
  return out.slice(0,CHATS_MAX);
}
function cleanChat(arr,known){
  const chat=[];
  for(const m of (Array.isArray(arr)?arr:[]).slice(-150)){
    if(!m||!Number.isInteger(m.id)||!["user","coach","sys"].includes(m.role)||!Number.isFinite(m.t))continue;
    const o={id:m.id,role:m.role,text:typeof m.text==="string"?m.text.slice(0,1500):"",t:m.t};
    if(m.pend===true)o.pend=true;
    if(["plan","weekly","plateau"].includes(m.kind))o.kind=m.kind;
    if(["check","ed"].includes(m.fl))o.fl=m.fl;
    const c=m.card;
    if(c&&c.kind==="log"&&Array.isArray(c.items)){const items=CoachLib.cleanItems(c.items);if(items.length)o.card=Object.assign({kind:"log",items,state:["pending","ok","no"].includes(c.state)?c.state:"pending",saved:c.saved===true},CoachLib.MEAL_KEYS.includes(c.meal)?{meal:c.meal}:{})}
    else if(c&&c.kind==="food"){const f=CoachLib.cleanFood(c.f&&typeof c.f==="object"?{name:c.f.n,kcal:c.f.k,protein:c.f.p}:{name:c.n,kcal:c.k,protein:c.p});if(f)o.card=Object.assign({kind:"food",f,state:["pending","ok","no"].includes(c.state)?c.state:"pending"},c.logged===true?{logged:true}:{})}
    else if(c&&c.kind==="safety"&&["emergency","check","mind","ed"].includes(c.level))o.card={kind:"safety",level:c.level};
    else if(c&&c.kind==="why"&&Array.isArray(c.items)){
      const items=c.items.filter(x=>x&&typeof x.k==="string"&&/^[a-z]{1,8}$/.test(x.k)&&typeof x.t==="string"&&x.t.trim()).slice(0,6).map(x=>({k:x.k,t:x.t.slice(0,160)}));
      if(items.length)o.card=Object.assign({kind:"why",items},c.asked===true?{asked:true}:{});
    }
    else if(c&&c.kind==="program"){const pg=CoachLib.cleanProgram(c,known);if(pg)o.card=Object.assign({kind:"program",state:c.state==="ok"?"ok":"pending"},pg)}
    else if(c&&c.kind==="menu"){const mn=CoachLib.cleanMenu({days:c.days},null,c.kcal);if(mn)o.card=Object.assign({kind:"menu",chk:(Array.isArray(c.chk)?c.chk:[]).filter(x=>typeof x==="string").map(x=>x.slice(0,60)).slice(0,100)},mn)}
    else if(c&&c.kind==="propose"&&Number.isFinite(c.kcal))o.card={kind:"propose",kcal:Math.round(c.kcal),why:String(c.why||"").slice(0,160),limited:c.limited===true,state:["pending","ok","no"].includes(c.state)?c.state:"pending"};
    chat.push(o);
  }
  return chat;
}
function cPush(m){const o=Object.assign({id:S.cid++,t:Date.now()},m);S.chat.push(o);if(S.chat.length>150)S.chat.splice(0,S.chat.length-150);return o}

/* ---- bağlam ---- */
function cCalc(){
  const st=S.settings,w=weights(),days=Object.keys(w).sort();
  const out={trendKg:null,slope:null,tdee:null,source:"",target:null,protein:null,bmr:null,block:""};
  /* Fren boy, yaş ve tartıdan bağımsız: hamilelik ya da ed işareti tartısız da bağlama gider. */
  const rk=risk(days.length?Algo.trend(w)[days[days.length-1]]:0);out.block=rk.block;out.why=[...rk.hard,...(rk.cleared?[]:rk.soft)].join("; ");
  if(!days.length)return out;
  out.trendKg=Algo.trend(w)[days[days.length-1]];out.slope=Algo.slopePerWeek(w);
  const pt=Algo.protein(riskInput(out.trendKg));out.protein=pt.range;out.proteinDoc=pt.doc;
  if(st.heightCm>0&&st.age>0){
    const profile={kg:out.trendKg,cm:st.heightCm,age:st.age,sex:st.sex||"",act:st.act};
    const intake={};for(const e of S.entries)if(e.type==="yemek"&&e.v)intake[e.day]=(intake[e.day]||0)+e.v;
    const r=Algo.adaptiveTdee({weights:w,intake,profile});out.tdee=r.tdee;out.source=r.source;
    out.bmr=Algo.bmrMifflin(profile);
    const sg=Algo.suggestTarget({...riskInput(out.trendKg),tdee:r.tdee,bmr:out.bmr});out.target=sg?sg.kcal:null;
  }
  return out;
}
function cData(){
  const st=S.settings,w=weights(),d=[];
  for(let i=13;i>=0;i--){
    const k=keyOff(-i),ents=S.entries.filter(e=>e.day===k);
    d.push({d:k.slice(5),kg:w[k],kcal:Math.round(ents.filter(e=>e.type==="yemek").reduce((s,e)=>s+(e.v||0),0)),p:Math.round(ents.filter(e=>e.type==="yemek").reduce((s,e)=>s+(e.p||0),0)),su:Math.round(ents.filter(e=>e.type==="su").reduce((s,e)=>s+e.v,0)),sport:Math.round(ents.filter(e=>e.type==="spor").reduce((s,e)=>s+e.v,0)),ad:Math.round(ents.filter(e=>e.type==="adim").reduce((s,e)=>s+e.v,0)),sl:(S.sleep.find(x=>x.day===k)||{}).min,mo:(S.mood.find(x=>x.day===k)||{}).v});
  }
  const t=dayKey(),now=new Date();
  /* Bağlam boyutu için üst sınırlar (en kötü durum menu.test.js'te ölçülür): yemek 12 satır/ad 40, spor 5, not 3, su tek toplam. */
  const ent=S.entries.filter(e=>e.day===t),lastOf=(type,n)=>ent.filter(e=>e.type===type).slice(-n),suMl=Math.round(ent.filter(e=>e.type==="su").reduce((a,e)=>a+e.v,0));
  const today=[...lastOf("yemek",12).map(e=>`yemek: ${(e.text||"öğün").slice(0,40)}${e.v?" ~"+Math.round(e.v)+" kcal":""}${e.p?", "+Math.round(e.p)+" g protein":""}`),...(suMl?[`su ${suMl} ml`]:[]),...lastOf("kilo",1).map(e=>`tartı ${fmt(e.v)} kg`),...lastOf("spor",5).map(e=>`spor ${(e.text||"").slice(0,30)} ${Math.round(e.v)} dk`),...lastOf("not",3).map(e=>`not: ${e.text.slice(0,100)}`)];
  const workouts=S.workouts.filter(x=>x.t1!=null).sort((a,b)=>b.t0-a.t0).slice(0,3).map(x=>`${x.day.slice(5)} ${x.name}: ${x.ex.map(cWorkoutEx).filter(Boolean).join(", ")}`.slice(0,300));
  const from=keyOff(-7),notes=S.entries.filter(e=>e.type==="not"&&e.day>=from).slice(-3).map(e=>e.text.slice(0,100));
  return {profile:{cm:st.heightCm,age:st.age,sex:st.sex,act:st.act,note:st.healthNote},goals:{kg:st.goalKg,kcal:st.kcal,water:st.waterMl,sport:st.sportWeek},calc:cCalc(),days:d,today,now:`${pad(now.getHours())}:${pad(now.getMinutes())}`,workouts,notes,meds:cMeds(t,now),weekSets:gWeekRegions()};
}
/* Antrenman satırı: ağırlıklıda en iyi set, vücut ağırlığında tekrar, süreli/kardiyoda süre. */
function cWorkoutEx(e){
  const ok=e.sets.filter(q=>q.done&&gSetOk(q));if(!ok.length)return "";
  const n=gEx(e.id).n,k=gKind(e.id);
  if(k==="t"||k==="i")return `${n} ${ok.length}x${ok[0].sec} sn`;
  if(k==="c")return `${n} ${Math.round(ok.reduce((a,q)=>a+q.sec,0)/60)} dk`;
  const s=ok.slice().sort((a,b)=>Algo.est1RM(b.kg,b.reps)-Algo.est1RM(a.kg,a.reps))[0];
  return k==="b"&&!s.kg?`${n} ${ok.length}x${s.reps}`:`${n} ${fmt(s.kg||0,s.kg%1?1:0)}x${s.reps}`;
}
function cMeds(t,now){
  if(!S.settings.medOn||!S.meds.length)return [];
  const nt=`${pad(now.getHours())}:${pad(now.getMinutes())}`,f=keyOff(-6);
  return S.meds.filter(m=>m.on).slice(0,8).map(m=>{const a=MedLib.adherence([m],S.medLog,f,t,t,nt),left=MedLib.stockLeft(m);return {n:m.n.slice(0,30),d:m.d&&m.d.slice(0,20),t:m.t,w:m.w,a:a.total||a.late?a:null,left}});
}
/* Geçmişe yalnız uygulanan kayıt kartı girer (reddedilen ya da bekleyen "yapıldı" gibi görünmesin); makro ve öğünle birlikte. */
function cHistLog(m){
  const c=m.card;
  return c&&c.kind==="log"&&c.state==="ok"?c.items.slice(0,4).map(i=>({type:i.type,text:i.text,name:i.name,kcal:i.kcal,p:i.p,c:i.c,f:i.f,meal:i.meal||c.meal,min:i.min,ml:i.ml,kg:i.kg})):[];
}
function cMessages(extraUser,extraSys,noHist){
  const sys=CoachLib.SYSTEM+(extraSys?"\n\nNOT: "+extraSys:"")+"\n\n"+CoachLib.contextText(cData());
  const hist=noHist?[]:S.chat.filter(m=>m.role!=="sys"&&m.text).slice(-10).map(m=>({role:m.role==="user"?"user":"assistant",content:m.role==="user"?m.text.slice(0,300):JSON.stringify({reply:m.text.slice(0,260),log:cHistLog(m)})}));
  const msgs=[{role:"system",content:sys}].concat(hist);
  if(extraUser)msgs.push({role:"user",content:extraUser});
  return msgs;
}

/* ---- sağlayıcı zinciri ---- */
/* probe: kurulum denemesi. HTTP 200 ve geçerli yanıt gövdesi yeter; düşünen model sınırda metinsiz dönebilir (content null, reasoning_content dolu).
   Sohbette metin boş ve sınır dolduysa (düşünme bütçeyi yedi) bir kez üç katı sınırla yeniden sorulur. */
async function callProvider(p,key,messages,maxTokens=700,o={}){
  const ms=Math.min(o.ms||40000,o.until?o.until-Date.now():Infinity);
  if(ms<=0){const e=new Error("Süre doldu");e.kind="time";throw e}
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),ms);
  try{
    const ant=p.id==="anthropic",r=await fetch(p.base.replace(/\/+$/,"")+(ant?"/messages":"/chat/completions"),{method:"POST",signal:ctl.signal,headers:Object.assign({"Content-Type":"application/json"},pHeaders(p,key)),body:JSON.stringify(pBody(p,messages,maxTokens))});
    if(!r.ok){const e=new Error("HTTP "+r.status);e.status=r.status;try{e.body=(await r.text()).slice(0,600)}catch(x){}throw e}
    const j=await r.json(),c=j&&j.choices&&j.choices[0],t=ant?(j&&Array.isArray(j.content)?j.content.filter(b=>b&&b.type==="text").map(b=>b.text).join(""):""):c&&c.message&&c.message.content;
    if(o.probe&&(ant?Array.isArray(j&&j.content):!!c))return "";
    const has=typeof t==="string"&&!!t.trim(),cut=ant?j&&j.stop_reason==="max_tokens":c&&c.finish_reason==="length";
    if(has&&!(cut&&!o.retried&&CoachLib.parse(t).broken))return t;
    if(!o.retried&&cut){clearTimeout(to);try{return await callProvider(p,key,messages,maxTokens*3,Object.assign({},o,{retried:true}))}catch(e){if(has)return t;throw e}}
    const e=new Error("Boş yanıt");e.kind="empty";throw e;
  }finally{clearTimeout(to)}
}
const pModelsUrl=p=>p.base.replace(/\/+$/,"")+"/models"+(p.id==="anthropic"?"?limit=1000":"");
/* İstek gövdesi sağlayıcıya göre. Düşünen modellerde düşünme jetonu yanıt sınırından yer; düşük çaba ve pay verilir.
   OpenAI güncel modelleri max_tokens kabul etmez. Anthropic: sistem metni ayrı alan, ilk mesaj kullanıcı; Haiku 4.5 sıcaklık alır, Sonnet/Opus 5.x almaz (çaba alır). */
function pBody(p,messages,maxTokens){
  if(p.id==="openai")return {model:p.model,messages,max_completion_tokens:maxTokens*3,reasoning_effort:"low"};
  if(p.id==="anthropic"){
    const sys=messages.filter(m=>m.role==="system").map(m=>m.content).join("\n\n"),ms=messages.filter(m=>m.role!=="system");
    while(ms.length&&ms[0].role!=="user")ms.shift();
    const b={model:p.model,max_tokens:maxTokens,messages:ms.length?ms:[{role:"user",content:"Merhaba"}]};if(sys)b.system=sys;
    if(/haiku/.test(p.model))b.temperature=0.3;else{b.output_config={effort:"low"};b.max_tokens=maxTokens+2000}
    return b;
  }
  const b={model:p.model,messages,temperature:0.3,max_tokens:maxTokens};
  if(p.id==="gemini")b.reasoning_effort="low"; // Gemini 3 düşünmeyi kapatamıyor
  return b;
}
const errOf=e=>{const kind=(e&&e.kind)||CoachLib.errKind(e&&e.status,e&&e.body,e&&e.name);return {kind,text:CoachLib.errText(kind,e&&e.status)}};
function pFail(id,e){
  const {kind,text}=errOf(e);
  if(kind==="limit")cool[id]=Date.now()+60000;else if(kind==="time")cool[id]=Date.now()+30000;else if(kind==="key"||kind==="quota")cool[id]=Date.now()+600000;
  pstat[id]={s:kind==="limit"?"limit":kind==="key"?"key":"err",t:Date.now(),m:text};
  return text;
}
const usable=()=>{const k=getKeys();return S.providers.filter(p=>p.on&&p.health&&k[p.id]&&(!cool[p.id]||cool[p.id]<Date.now()))};
const hasKey=()=>{const k=getKeys();return S.providers.some(p=>p.on&&p.health&&k[p.id])};
/* İstek başına toplam süre bütçesi: zincir, uzunluk yeniden denemesi ve yeniden sorma bu süreyi paylaşır. */
const BUDGET=60000,custAsked=new Set();
const isCustom=p=>!defProviders().some(d=>d.id===p.id);
const hostOf=p=>{try{return new URL(p.base).host}catch(e){return p.base}};
/* Ücretsiz katman (Gemini) her gönderimde, özel sağlayıcı oturumda bir kez sorar; aynı gönderimin yeniden sorması tekrar sormaz (conf). */
function sendOk(p,conf){
  const cust=isCustom(p),k=p.id+"|"+p.base;
  if(!p.confirm&&!(cust&&!custAsked.has(k)))return true;
  if(conf[p.id]===undefined){
    conf[p.id]=confirm(cust?`${p.name} senin eklediğin özel bir sağlayıcı (${hostOf(p)}). Sağlık verilerin ve anahtarın bu sunucuya gider; güvenmediğin bir adrese gönderme. Göndermeyi onaylıyor musun?`:`${p.name} ücretsiz katmanında istemler ürün geliştirmek için kullanılabilir. Sunucuları yurt dışında olan bu sağlayıcıya sağlık verilerini göndermeyi onaylıyor musun?`);
    if(conf[p.id]&&cust)custAsked.add(k);
  }
  return conf[p.id];
}
async function cAsk(messages,maxTokens,o={}){
  if(!coachOn())throw new Error("consent");
  const keys=getKeys(),list=usable(),until=o.until||Date.now()+BUDGET,conf=o.conf||{};
  if(!list.length)throw new Error(hasKey()?"fail":"none");
  let declined=false,tried=false;
  for(const p of list){
    if(Date.now()>=until)break;
    if(!sendOk(p,conf)){declined=true;continue}
    tried=true;const t0=Date.now();
    try{
      const text=await callProvider(p,keys[p.id],messages,maxTokens,{until});
      pstat[p.id]={s:"ok",t:Date.now(),ms:Date.now()-t0};return {text,provider:p};
    }catch(e){pFail(p.id,e)}
  }
  throw new Error(declined&&!tried?"declined":"fail");
}

/* ---- sohbet akışı ---- */
function cSend(text){
  text=String(text||"").trim().slice(0,600);if(!text)return;
  const fl=CoachLib.redFlag(text),m=cPush({role:"user",text,pend:true});
  if(fl==="ed")cRisk("ed");
  if(CoachLib.pregnant(text))cRisk("preg");
  if(fl){
    cPush({role:"coach",text:"",card:{kind:"safety",level:fl}});
    if(fl==="emergency"||fl==="mind")m.pend=false;else m.fl=fl;
  }
  save();render();cFlush();
}
/* Sohbette görülen yeme düzeni ya da hamilelik işareti kalıcı frendir: yeni sohbet ya da silme kaldırmaz (riskInput okur). */
const riskMerge=(a,b)=>[...new Set(((a||"")+","+(b||"")).split(",").filter(Boolean))].sort().join(",");
function cRisk(k){S.settings.chatRisk=riskMerge(S.settings.chatRisk,k)}
/* Sağlık notu kaydında ağır işaret (kendine zarar, acil belirti) varsa sohbette güvenlik kartı gösterilir. */
function cNoteCheck(){
  const f=CoachLib.redFlag(S.settings.healthNote);
  if(f==="mind"||f==="emergency"){cPush({role:"coach",text:"",card:{kind:"safety",level:f}});toast("Notunda bir sağlık uyarısı işareti var, Koç sekmesine bak")}
  if(f==="ed")cRisk("ed");
  if(CoachLib.pregnant(S.settings.healthNote))cRisk("preg");
}
async function cFlush(){
  if(busy)return;
  const pend=S.chat.filter(m=>m.role==="user"&&m.pend);if(!pend.length)return;
  if(!coachOn()){render();return}
  busy=true;typing=true;render();
  const fl=pend.map(m=>m.fl).find(Boolean),ask={until:Date.now()+BUDGET,conf:{}};
  try{
    const r=await cAsk(cMessages(null,fl?"Kullanıcı bir belirti ya da yeme zorluğu bildirdi ve güvenlik kartı gösterildi. Kısa, ihtiyatlı yanıt ver, kalori kısıtlaması önerme.":""),undefined,ask);
    let o=CoachLib.parse(r.text);
    const said=pend[pend.length-1].text,act=x=>CoachLib.cleanItems(x.log).length||x.food||x.propose||x.program||x.menu;
    /* Tek yeniden sorma: doğru JSON her zaman kabul edilir; ikisi de bozuksa eksiksiz görünen ilk yanıt (ya da "yanıt eksik" iletisi) gösterilir. */
    if(!fl&&(o.plain||(CoachLib.reported(said)&&!act(o)))&&ask.until-Date.now()>8000){
      try{
        const r2=await cAsk(cMessages(null,"Önceki yanıt kurala uymadı. Yalnızca tek bir JSON nesnesi ver. Kullanıcı yediğini, içtiğini, tartıldığını ya da spor yaptığını yazdıysa bunu log listesine ekle (yemek: kcal ve makrolar, spor: min, name, kcal)."),undefined,ask),o2=CoachLib.parse(r2.text);
        if(o2.plain?o.broken&&!o2.broken:o.plain||act(o2))o=o2;
      }catch(e2){}
    }
    pend.forEach(m=>{m.pend=false});offline=null;
    cReply(o);
  }catch(e){
    if(e.message==="declined"){pend.forEach(m=>{m.pend=false});offline=null;toast("Gönderim onaylanmadı, mesaj yalnızca bu telefonda kaldı")}
    else offline=e.message==="none"?"none":"fail";
  }
  busy=false;typing=false;save();render();
  if(!offline&&S.chat.some(m=>m.role==="user"&&m.pend))cFlush();
}
/* Fren varken bakımın altındaki ya da bakımı bilinmeyen hedef açık olabilir; öneri de uygulama da durur. */
const kcalBlocked=(k,c=cCalc())=>!!c.block&&!(c.tdee&&k>=c.tdee-50);
function cReply(o,kind){
  const items=CoachLib.cleanItems(o.log),msg={role:"coach",text:o.reply||"Tamam."};
  if(kind)msg.kind=kind;
  if(items.length)msg.card={kind:"log",items,state:"pending"};
  cPush(msg);
  const fd=CoachLib.cleanFood(o.food);
  if(fd&&!items.length)cPush({role:"coach",text:"",card:{kind:"food",f:fd,state:"pending"}});
  if(o.flag==="safety")cPush({role:"coach",text:"",card:{kind:"safety",level:"check"}});
  if(o.propose){
    const c=cCalc(),cl=CoachLib.clampKcal(o.propose.kcal,{tdee:c.tdee,bmr:c.bmr});
    if(cl&&kcalBlocked(cl.kcal,c))return;
    if(cl&&cl.kcal!==S.settings.kcal)cPush({role:"coach",text:"",card:{kind:"propose",kcal:cl.kcal,why:String(o.propose.why||"").slice(0,160),limited:cl.limited,state:"pending"}});
  }
}
/* Kendi besinlerim: yapay zekâ tahmini ya da kaydedilen yemek, tek porsiyonluk değerle aranabilir listeye girer. */
function myFoodPut(f){
  const i=S.myFoods.findIndex(x=>(f.b&&x.b===f.b)||tr(x.n)===tr(f.n));
  if(i>=0)S.myFoods[i]=f;else if(S.myFoods.length<200)S.myFoods.unshift(f);else return false;
  return true;
}
function myFoodAdd(n,kcal,p){
  const f={n:n.slice(0,60),k:Math.round(kcal),por:true};if(p!=null&&p>=0)f.p=Math.round(p*10)/10;
  return myFoodPut(f);
}
function cApplyLog(id,el){
  const m=S.chat.find(x=>x.id===id);if(!m||!m.card||m.card.kind!=="log"||m.card.state!=="pending")return;
  lReadK(m.card,el);
  /* Bugünkü yemekler menüdeki "Bugüne ekle" yoluyla (addFoods: besin değerleri, öğün, Geri al); dünkü yemek ve diğer kayıtlar doğrudan. Geri al kartı yeniden açar. */
  const c=m.card,ml=c.meal||(c.items.find(i=>i.meal)||{}).meal||LogLib.mealOf({time:cTime(Date.now())}),ids=[],foods=[];
  for(const it of c.items){
    const day=it.day==="yesterday"?keyOff(-1):dayKey(),y=it.type==="yemek";
    if(y&&day===dayKey()){foods.push(LogLib.copyNutr(it,{text:it.text||"Öğün",v:it.kcal,meal:ml}));continue}
    const e=y?LogLib.copyNutr(it,add("yemek",it.kcal,it.text||"Öğün",day)):it.type==="su"?add("su",it.ml,"",day):it.type==="kilo"?add("kilo",it.kg,"",day):it.type==="spor"?add("spor",it.min,it.name,day):add("not",null,it.text,day);
    if(y)e.meal=ml;if(it.type==="spor"){const k=spKcal(it).k;if(k!=null)e.kcal=k}ids.push(e.id);
  }
  c.state="ok";const n=foods.length+ids.length,undo=()=>{S.entries=S.entries.filter(e=>!ids.includes(e.id));c.state="pending"};
  if(foods.length)return addFoods(foods,dayKey(),`${n} kayıt günlüğe eklendi`,undo);
  save();render();toast(`${n} kayıt eklendi`,()=>{undo();save();render()});
}
/* Egzersiz kalorisi uygulamanın MET hesabıyla (net, dinlenme hariç; hızlı spor kaydıyla aynı formül). Koç'un tahmini yarıdan fazla saparsa uyarılır.
   Kilo yoksa Koç'un tahmini dakikada en çok 15 kcal ile sınırlanır. */
function spKcal(it){
  const app=Algo.netKcal(CoachLib.sportMet(it.name),motionKg(),it.min);
  if(app!=null)return {k:app,off:it.kcal!=null&&Math.abs(it.kcal-app)>app*0.5};
  return {k:it.kcal!=null?Math.min(it.kcal,it.min*15):null,off:false};
}
/* Kalori kutusundaki düzeltmeler karta yazılır (çıkarma ve ekleme öncesi). */
function lReadK(c,el){
  const box=el.closest(".lcard");if(!box)return;
  c.items.forEach((it,i)=>{if(it.type==="yemek"){const inp=box.querySelector(`[data-ck="${i}"]`);if(inp){const v=num(inp.value,true);it.kcal=isNaN(v)||v<0?null:Math.min(v,5000)}}});
}

/* ---- "bu hafta neden kilo vermedim": yerel etmenler, isteğe bağlı Koç yorumu ---- */
/* Soru ve plato yalnız kilo verme hedefi olan, son 28 günde yeterli tartıda (en az 3, 14 gün yayılım) kilo vermeyen, kalori açığı engeli (yaş, düşük kilo, sağlık notu, yeme bozukluğu işareti) olmayan kullanıcıya. */
function lossAsk(){
  const st=S.settings,w=weights(),days=Object.keys(w).sort();
  if(!(st.goalKg>0)||!days.length)return false;
  const tk=Algo.trend(w)[days[days.length-1]];
  return st.goalKg<tk-0.5&&Algo.lossKnown(w)&&!Algo.isLosing(w)&&!risk(tk).block;
}
function cWhy(){
  if(!lossAsk())return;
  const days=[];
  for(let i=21;i>=0;i--){const k=keyOff(-i);days.push({kcal:sum("yemek",k,k),su:sum("su",k,k),ad:sum("adim",k,k),sl:(S.sleep.find(x=>x.day===k)||{}).min})}
  const items=InsightLib.weekWhy({days,goalKcal:S.settings.kcal,goalWater:S.settings.waterMl,weights:weights(),today:dayKey()});
  cPush({role:"user",text:"Bu hafta neden kilo vermedim?"});cPush({role:"coach",text:"",card:{kind:"why",items}});
  tab="koc";save();render();
}
async function cWhyAsk(id){
  const m=S.chat.find(x=>x.id===id);
  if(busy||!m||!m.card||m.card.kind!=="why"||m.card.asked||!coachOn()||!usable().length)return;
  m.card.asked=true;busy=true;typing=true;render();
  try{
    const r=await cAsk(cMessages("Bu sorumu yalnız NOT'taki etmenlerle 4-5 cümlede yorumla. Bu sayılar dışında rakam kullanma, suçlama, tıbbi yorum yapma.","Uygulamanın son 7 gün için yerel hesabı:\n"+m.card.items.map(x=>"- "+x.t).join("\n")));
    cReply(Object.assign(CoachLib.parse(r.text),{log:[]}));offline=null;
  }catch(e){m.card.asked=false;toast(e.message==="declined"?"Gönderim onaylanmadı":"Koç şu an ulaşılamıyor, sonra tekrar dene")}
  finally{busy=false;typing=false;save();render()}
}

/* ---- Koç'tan program ---- */
let progOpt={d:3,q:"Salon",m:45,l:"Başlangıç"};
function cCatalog(o){const c=CoachLib.catalog(EXMERGED,o,EXLIB.map(e=>e.id));return {ids:c.map(e=>e.id),text:c.map(e=>`${e.id}|${e.n}|${e.r||e.g}`).join("\n")}}
function cProgSheet(){
  const o=progOpt,g=(k,vals,lbl=v=>v)=>`<div class="chips">${vals.map(v=>`<button class="chip" data-c="po:${k}:${v}" aria-pressed="${o[k]===v}">${lbl(v)}</button>`).join("")}</div>`;
  openSheet(`<h3>Koç'tan program iste</h3><div class="lbl">Haftada gün</div>${g("d",[2,3,4,5,6])}<div class="lbl">Ekipman</div>${g("q",["Salon","Ev tipi","Ağırlıksız"])}<div class="lbl">Seans süresi</div>${g("m",[30,45,60],v=>v+" dk")}<div class="lbl">Seviye</div>${g("l",["Başlangıç","Orta","İleri"])}
  <p class="hint">Koç yalnız kütüphanedeki egzersizlerden seçer. İstek, profil ve kayıtlarınla birlikte sağlayıcıya gönderilir.</p><button class="btn" data-c="progask">İste</button>`);
}
async function cProgram(o){
  if(busy)return;
  if(!coachOn()){tab="koc";render();return toast("Önce Koç'ta veri paylaşımını kabul et")}
  if(!usable().length)return toast("Koç için anahtar gerekli: Ayarlar > Koç");
  const rk=risk();
  if(rk.ed||rk.pregnant)return toast((rk.ed?"Yeme düzeniyle ilgili işaret gördüm":"Hamilelik ya da emzirme işareti var")+"; program önermiyorum, hekimine danış");
  const {ids,text}=cCatalog(o);
  cPush({role:"user",text:`Program iste: haftada ${o.d} gün, ${o.m} dk, ${o.q}, ${o.l}`});
  tab="koc";busy=true;typing=true;render();
  try{
    const r=await cAsk(cMessages(`Haftada ${o.d} gün, seans ${o.m} dakika, ekipman ${o.q}, seviye ${o.l} için antrenman programı hazırla. "program" alanını doldur, reply'da kısaca anlat.`,"KATALOG (kimlik|ad|bölge):\n"+text),900);
    const p=CoachLib.parse(r.text),pg=CoachLib.cleanProgram(p.program,ids,o.d);offline=null;
    if(pg)cPush({role:"coach",text:p.reply,card:Object.assign({kind:"program",state:"pending"},pg)});
    else toast("Program okunamadı, tekrar dene");
  }catch(e){toast(e.message==="declined"?"Gönderim onaylanmadı":"Koç şu an ulaşılamıyor, sonra tekrar dene")}
  finally{busy=false;typing=false;save();render()}
}

/* ---- Koç'tan haftalık menü ---- */
let menuNote="";
/* Katalog: önce benim besinlerim, favoriler, şablonlar, kalan yer yerleşik listeden (kategorilere yayılmış). Toplam en çok 60 satır. */
function cMenuCat(){
  const cat={},lines=[],clean=t=>CoachLib.oneLine(String(t).replace(/[|]/g," "),30),nn=v=>v==null?null:v;
  const add=(id,n,k,p,c,f,g,a)=>{cat[id]={n:clean(n),k,p,c,f,g,a};lines.push(`${id}|${cat[id].n}${g?" "+g+" g":""}|${Math.round(k)}|${p==null?"?":Math.round(p)}`)};
  const per=(id,f,g)=>{const x=v=>v==null?null:v*g/100,m=f.u&&f.u[0][0].match(/^(\d+(?:[.,]\d+)?)\s*adet/);add(id,f.n,f.k*g/100,x(f.p),x(f.c),x(f.f),Math.round(g),m?+m[1].replace(",","."):null)};
  S.myFoods.slice(0,20).forEach((f,i)=>f.u?per("m"+i,f,f.u[0][1]):add("m"+i,f.n,f.k,nn(f.p),nn(f.c),nn(f.f),null,null));
  S.favFoods.slice(0,10).forEach((x,i)=>{if(x.v!=null)add("f"+i,x.text,x.v,nn(x.p),nn(x.c),nn(x.f),null,null)});
  S.mealTpl.slice(0,8).forEach((t,i)=>{if(t.items.every(x=>x.v!=null))add("t"+i,"Şablon: "+t.n,t.items.reduce((a,x)=>a+x.v,0),t.items.every(x=>x.p!=null)?t.items.reduce((a,x)=>a+x.p,0):null,null,null,null,null)});
  const ok=FOODS.slice(0,FOOD_CORE).map((f,i)=>i).filter(i=>FOODS[i].k<450&&!["Şeker","Kola","Meyve suyu"].includes(FOODS[i].n)),n=Math.min(Math.max(0,60-lines.length),ok.length);
  for(let j=0;j<n;j++){const i=ok[Math.floor(j*ok.length/n)];per("b"+i,FOODS[i],FOODS[i].u[0][1])}
  return {cat,text:lines.join("\n")};
}
/* Hedef: kalori açığı engeli varsa ve hedef bakımın altındaysa bakım düzeyi (cReply'daki kuralın aynısı); yeme düzeni işareti ya da bakım hesaplanamıyorsa menü yok. */
const menuBlock=(c=cCalc())=>c.block;
function cMenuPlan(){
  const st=S.settings,c=cCalc(),goal=st.kcal>0?st.kcal:c.target;
  if(!(goal>0))return {why:"Önce Ayarlar > Profil ve hedefler'den günlük kalori hedefi belirle"};
  if(risk(c.trendKg).ed)return {why:"Yeme düzeniyle ilgili işaret gördüm; kısıtlayıcı menü önermiyorum, bir uzmana danış"};
  const block=menuBlock(c);
  let kcal=goal,held=false;
  if(block){
    if(!c.tdee)return {why:block+". Menü hedefi hesaplanamadı; hekimine ya da diyetisyene danış"};
    if(goal<c.tdee-50){kcal=Math.round(c.tdee/10)*10;held=true}
  }
  const cl=CoachLib.clampKcal(kcal,{tdee:c.tdee,bmr:c.bmr});
  return {kcal:cl?cl.kcal:kcal,protein:c.protein,pdoc:c.proteinDoc,held,block};
}
function cMenuSheet(){
  const pl=cMenuPlan();
  openSheet(`<h3>Haftalık menü öner</h3>${pl.why?`<p class="mut">${esc(pl.why)}</p>`:`<p class="mut sm">Hedef: günde ~${pl.kcal} kcal${pl.protein?`, protein ${pl.protein[0]}-${pl.protein[1]} g`:pl.pdoc?", protein hedefini hekiminle belirle":""}. ${Algo.PROTEIN_NOTE}${pl.held?` ${esc(pl.block)}; menü bakım düzeyinde hazırlanır, hekimine danış.`:""}</p>`}
  <label class="lbl" for="mnote">Kısıt ya da alerji (isteğe bağlı)</label><textarea class="in" id="mnote" maxlength="200" placeholder="Örneğin: fıstık alerjisi, domuz eti yemem">${esc(menuNote)}</textarea>
  <p class="hint">Koç yalnız Benim besinlerim, favorilerin, şablonların ve yerleşik listeden seçer. Tıbbi diyet ya da hastalık menüsü değildir; hastalığın varsa diyetisyenine danış. Yazdığın not, profilin ve kayıtlarınla birlikte sağlayıcıya gönderilir.</p>
  <button class="btn" data-c="menuask"${pl.why?" disabled":""}>İste</button>`);
}
async function cMenu(){
  if(busy)return;
  if(!coachOn()){tab="koc";render();return toast("Önce Koç'ta veri paylaşımını kabul et")}
  if(!usable().length)return toast("Koç için anahtar gerekli: Ayarlar > Koç");
  const pl=cMenuPlan(),note=CoachLib.oneLine(menuNote,200);
  if(pl.why)return toast(pl.why);
  if(CoachLib.redFlag(note))return toast("Notunda sağlık uyarısı işareti var, menü hazırlamıyorum; hekimine danış");
  const {cat,text}=cMenuCat(),p=pl.protein;
  cPush({role:"user",text:`Haftalık menü iste: günde ~${pl.kcal} kcal${note?`, not: ${note}`:""}`});
  tab="koc";busy=true;typing=true;render();
  try{
    const r=await cAsk(cMessages(`7 günlük menü hazırla. "menu" alanını doldur, reply'da en fazla 2 cümle yaz.`,`MENÜ İSTEĞİ. Hedef günlük ${pl.kcal} kcal (gün toplamı ±%10), ${p?`protein ${p[0]}-${p[1]} g/gün`:pl.pdoc?"protein hedefi hekimle belirlenmeli, yüksek proteinli menü kurma":"protein yeterli olsun"}. YALNIZ KATALOG kimliklerini kullan, listede olmayan besin ekleme. Günde 3-6 öğün, öğün anahtarı: kah, ogl, aks, atis. Katalogdaki kcal ve protein BİR porsiyon içindir; q porsiyon çarpanıdır (0.25-4).${note?`\nKullanıcının kısıt/alerji notu (uy): ${note}`:""}\nTıbbi diyet ya da hastalık menüsü yazma.${pl.block?` KISIT var: ${pl.block}; kalori açığı kurma.`:""}\nÇıktı JSON: {"reply":"...","menu":{"days":[{"n":"Pazartesi","meals":[{"m":"kah","i":[["kimlik",1]]}]}]}}\nKATALOG (kimlik|ad|kcal|protein):\n${text}`,true),2400);
    const o=CoachLib.parse(r.text),mn=CoachLib.cleanMenu(o.menu,cat,pl.kcal);offline=null;
    if(mn)cPush({role:"coach",text:o.reply,card:Object.assign({kind:"menu",chk:[]},mn)});
    else toast("Menü okunamadı, tekrar dene");
  }catch(e){toast(e.message==="declined"?"Gönderim onaylanmadı":"Koç şu an ulaşılamıyor, sonra tekrar dene")}
  finally{busy=false;typing=false;save();render()}
}
const menuCard=id=>{const m=S.chat.find(x=>x.id===id);return m&&m.card&&m.card.kind==="menu"?m.card:null};
const mealLbl=k=>(LogLib.MEALS.find(x=>x[0]===k)||[0,"Öğün"])[1];
const qTxt=q=>q===1?"":" × "+String(q).replace(".",",");
function menuEntries(d){return d.meals.flatMap(b=>b.items.map(i=>LogLib.copyNutr(i,{text:i.n+qTxt(i.q),v:i.k,meal:b.m})))}
function cShopText(c){const ch=new Set(c.chk);return "Alışveriş listesi\n"+CoachLib.shopList(c).map(x=>`${ch.has(x.n)?"[x]":"[ ]"} ${x.n}: ${x.t}`).join("\n")}
function cShop(id){
  const c=menuCard(id);if(!c)return;
  const L=CoachLib.shopList(c),ch=new Set(c.chk);
  openSheet(`<h3>Alışveriş listesi</h3><p class="mut sm">Menüden bu telefonda hesaplandı, hiçbir yere gönderilmedi. Miktarlar menüdeki porsiyonlara göredir.</p>${L.map((x,i)=>`<button class="prow" data-c="shopchk:${id}:${i}" aria-pressed="${ch.has(x.n)}"><span><b${ch.has(x.n)?' style="text-decoration:line-through"':""}>${esc(x.n)}</b><span class="mut sm">${esc(x.t)}</span></span><span class="plus" aria-hidden="true">${ch.has(x.n)?Icons.svg("check"):""}</span></button>`).join("")}
  <div class="two" style="margin-top:10px"><button class="btn ghost" data-c="shopcopy:${id}">Kopyala</button><button class="btn ghost" data-c="shopshare:${id}">Paylaş</button></div>`);
}

/* Plato sorusu yereldir: consent ve sağlayıcıdan bağımsız, AI çağrısı yapmaz; kullanıcı "Bak"a dokunursa yerel kart açılır. */
function cPlateauCheck(){
  const st=S.settings,t=dayKey();
  if((st.lastPlateau&&Algo.dayNum(t)-Algo.dayNum(st.lastPlateau)<14)||!lossAsk())return;
  const p=InsightLib.plateau(weights(),t);if(!p.ok)return;
  st.lastPlateau=t;cPush({role:"coach",kind:"plateau",text:`Son ${Math.round(p.days/7)} haftadır kilon düşmüyor. Birlikte bakalım mı?`});save();render();
}

/* ---- günün ve haftanın yorumu: yalnız kullanıcı düğmeye basınca (sağlayıcıya otomatik gönderim yoktur) ---- */
function weekSummary(endKey){
  const e=new Date(+endKey.slice(0,4),+endKey.slice(5,7)-1,+endKey.slice(8)),ks=[];
  for(let i=6;i>=0;i--)ks.push(dayKey(addDays(-i,e)));
  const w=weights(),ws=ks.filter(k=>w[k]!=null).map(k=>w[k]);
  const td=cCalc().tdee,kc0=ks.map(k=>sum("yemek",k,k)).filter(x=>Algo.fullKcal(x,td)),kc=kc0.length>=Algo.MIN_AVG_DAYS?kc0:[],su=ks.map(k=>sum("su",k,k)).filter(x=>x>0);
  const logged=ks.filter(k=>S.entries.some(x=>x.day===k)).length,sp=sum("spor",ks[0],ks[6]);
  return {logged,n:ks.length,ws,avgKcal:kc.length?Math.round(kc.reduce((a,b)=>a+b,0)/kc.length):null,avgSu:su.length?Math.round(su.reduce((a,b)=>a+b,0)/su.length):null,sport:Math.round(sp),first:ws[0],last:ws[ws.length-1]};
}
/* Bugün alınmış yorum yeniden istenmez, sohbetteki yanıta gidilir. */
const cmtToday=kind=>S.chat.find(m=>m.role==="coach"&&m.kind===kind&&dayKey(new Date(m.t))===dayKey());
function cCommentBtn(kind){
  const lbl=kind==="plan"?"bugünkü":"haftalık";
  if(cmtToday(kind))return `<button class="btn ghost" data-c="cmt:${kind}">Koç'un ${lbl} yorumunu gör</button>`;
  const why=!coachOn()?"Yorum için önce Koç'ta veri paylaşımını kabul et":!usable().length?"Yorum için Koç anahtarı gerekli (Ayarlar > Koç)":"";
  return `<button class="btn ghost" data-c="cmt:${kind}"${why?' disabled aria-disabled="true"':""}>Koç'tan ${lbl} yorum iste</button>${why?`<p class="hint">${why}</p>`:""}`;
}
async function cComment(kind){
  if(cmtToday(kind)){tab="koc";return render()}
  if(busy)return;
  if(!coachOn()){tab="koc";render();return toast("Önce Koç'ta veri paylaşımını kabul et")}
  if(!usable().length)return toast("Koç için anahtar gerekli: Ayarlar > Koç");
  const s=weekSummary(dayKey()),user=kind==="weekly"
    ?`Son 7 günümün yorumunu yaz, 5-6 cümle. Uygulamanın hesapladığı özet: kayıt ${s.logged}/${s.n} gün, tartılar ${s.ws.map(x=>fmt(x)).join(", ")||"yok"}, ortalama kalori ${s.avgKcal||"veri yok"}, ortalama su ${s.avgSu||"veri yok"} ml, spor ${s.sport} dk. Hedefe uyumu değerlendir ve gelecek hafta için tek bir odak öner. Bu sayılar dışında rakam kullanma.`
    :"Bugünkü kayıtlarıma kısaca yorum yap ve bugün için 3 kısa hedef öner.";
  cPush({role:"user",text:kind==="weekly"?"Haftamı yorumlar mısın?":"Bugünümü yorumlar mısın?"});
  tab="koc";busy=true;typing=true;render();
  try{const r=await cAsk(cMessages(user));cReply(Object.assign(CoachLib.parse(r.text),{log:[]}),kind);offline=null}
  catch(e){toast(e.message==="declined"?"Gönderim onaylanmadı":"Koç şu an ulaşılamıyor, sonra tekrar dene")}
  finally{busy=false;typing=false;save();render()}
}

/* ---- ekran ---- */
function cTime(t){const d=new Date(t);return `${pad(d.getHours())}:${pad(d.getMinutes())}`}
function cSafety(level){
  const T={
    emergency:["Hemen yardım al","Bu belirtiler acil olabilir. Beklemeden 112'yi ara ya da en yakın acile git.",true],
    check:["Bunu bir doktora danış","Baş dönmesinin nedeni az yemek olabilir ama başka nedenleri de var. Önce bir şeyler yiyip su iç. Geçmezse ya da çarpıntı olursa bugün bir hekime başvur. Bayılma, nefes darlığı veya göğüs ağrısında hemen 112.",true],
    mind:["Yalnız değilsin","Kendine zarar vermeyi düşünüyorsan şimdi 112'yi ara ya da yanındaki birine söyle. Güvende olman her şeyden önemli.",true],
    ed:["Bunu konuşmak iyi bir adım","Yemekle ilgili zorlanmalar için bir hekim, psikolog ya da diyetisyen desteği çok değerli. Bu konuda kalori kısıtlaması önermem.",false]
  }[level];
  return `<div class="scard"><b>${T[0]}</b><p>${T[1]}</p><div class="srow2">${T[2]?`<a class="sbtn" href="tel:112">112'yi ara</a>`:""}<button class="sbtn ghost" data-c="dismiss">Anladım</button></div><div class="mut sm">Yapay zekâ koçu hekim değildir, tanı koymaz.</div></div>`;
}
function cCard(m){
  const c=m.card;if(!c)return "";
  if(c.kind==="safety")return cSafety(c.level);
  if(c.kind==="program")return `<div class="card lcard"><b>${esc(c.name)}</b>${c.days.map(d=>`<div class="lrow"><div><b>${esc(d.n)}</b><div class="mut sm">${esc(d.ex.map(i=>gEx(i).n).join(", "))}</div></div></div>`).join("")}
    ${c.state==="pending"?`<div class="lbtns"><button class="btn" data-c="progadd:${m.id}">Şablon olarak ekle</button></div>`:`<div class="mut sm">${c.days.length} şablon Salon'a eklendi</div>`}<p class="hint">${gPgNote}</p></div>`;
  if(c.kind==="menu")return `<div class="card lcard"><div class="lhead"><b>Haftalık menü</b><span class="tahmin">Tahmin</span></div><div class="mut sm">Hedef ${c.kcal?"~"+c.kcal+" kcal/gün":"belirtilmedi"}. Tıbbi diyet ya da hastalık menüsü değildir.</div>
    ${c.days.map((d,di)=>`<div style="padding:8px 0;border-top:1px solid var(--line)"><div class="lhead"><b>${esc(d.n)}</b><span class="num">~${d.k} kcal</span></div>${d.off?`<div class="mut sm">Hedefin %15'inden fazla sapıyor</div>`:""}${d.meals.map(b=>`<div class="mut sm"><b>${mealLbl(b.m)}:</b> ${esc(b.items.map(i=>i.n+qTxt(i.q)).join(", "))}</div>`).join("")}
    <div class="lbtns"><button class="chip" data-c="menuadd:${m.id}:${di}">Bugüne ekle</button><button class="chip" data-c="menutpl:${m.id}:${di}">Şablon yap</button></div></div>`).join("")}
    <div class="lbtns"><button class="btn" data-c="shop:${m.id}">Alışveriş listesi</button></div></div>`;
  if(c.kind==="why")return `<div class="card lcard"><b>Son 7 gün</b>${c.items.map(x=>`<p class="sm">${esc(x.t)}</p>`).join("")}<div class="mut sm">${c.asked?"Telefonda hesaplandı; yorum için Koç'a gönderildi.":"Telefonda hesaplandı, hiçbir yere gönderilmedi."}</div>
    ${!c.asked&&coachOn()&&usable().length?`<div class="lbtns"><button class="btn ghost" data-c="whyai:${m.id}">Koç'a yorumlat</button></div>`:""}</div>`;
  if(c.kind==="propose"){
    return `<div class="card lcard"><b>Kalori hedefi önerisi: ${c.kcal} kcal</b>${c.why?`<div class="mut sm">${esc(c.why)}</div>`:""}${c.limited?`<div class="mut sm">Güvenli alt sınıra çekildi.</div>`:""}
    ${c.state==="pending"?`<div class="lbtns"><button class="btn" data-c="applyk:${m.id}">Uygula</button><button class="btn ghost" data-c="nok:${m.id}">Şimdi değil</button></div>`:`<div class="mut sm">${c.state==="ok"?"Uygulandı":"Atlandı"}</div>`}</div>`;
  }
  if(c.kind==="food"){
    return `<div class="card lcard"><div class="lhead"><b>${esc(c.f.n)}</b><span class="tahmin">Tahmin</span></div><div class="mut sm">~${c.f.k} kcal${c.f.p!=null?`, protein ~${Math.round(c.f.p)} g`:""}</div>
    ${c.logged?`<div class="mut sm">Günlüğe eklendi</div>`:`<div class="lbtns"><button class="btn" data-c="fooddiary:${m.id}">Günlüğe ekle</button></div>`}
    ${c.state==="pending"?`<div class="lbtns"><button class="btn ghost" data-c="addfood:${m.id}">Listeme ekle</button><button class="btn ghost" data-c="nofood:${m.id}">Şimdi değil</button></div>`:`<div class="mut sm">${c.state==="ok"?"Besin listene eklendi":"Atlandı"}</div>`}</div>`;
  }
  const rows=c.items.map((it,i)=>{
    const lbl=it.type==="yemek"?esc(it.text||"Öğün"):it.type==="su"?"Su":it.type==="kilo"?"Tartı":it.type==="spor"?esc(it.name):"Not";
    const val=it.type==="yemek"?(c.state==="pending"?`<span class="num">~<input class="kin num" data-ck="${i}" inputmode="numeric" aria-label="${esc(it.text)} kcal" value="${it.kcal==null?"":Math.round(it.kcal)}" placeholder="kcal"> kcal</span>`:`<span class="num">${it.kcal==null?"":"~"+Math.round(it.kcal)+" kcal"}</span>`)
      :it.type==="su"?`<span class="num">${it.ml} ml</span>`:it.type==="kilo"?`<span class="num">${fmt(it.kg)} kg</span>`:it.type==="spor"?`<span class="num">${it.min} dk${spKcal(it).k!=null?` · ~${spKcal(it).k} kcal`:""}</span>`:`<span class="mut sm">${esc(it.text.slice(0,40))}</span>`;
    const y=it.type==="yemek",mac=y?[it.g?it.g+" g":"",it.p!=null?`P ${Math.round(it.p)}`:"",it.c!=null?`K ${Math.round(it.c)}`:"",it.f!=null?`Y ${Math.round(it.f)}`:""].filter(Boolean).join(" · "):"";
    return `<div class="lrow" style="flex-wrap:wrap"><div style="min-width:0;flex:1 1 150px"><span style="overflow-wrap:break-word">${lbl}</span>${mac?`<div class="mut sm">${mac}</div>`:""}${y&&CoachLib.macroOff(it)?`<div class="mut sm">Kalori makrolarla tutmuyor, kontrol et</div>`:""}${it.type==="spor"&&spKcal(it).off?`<div class="mut sm">Koç ~${it.kcal} kcal dedi; kilona göre hesap kullanılır</div>`:""}${it.day==="yesterday"?`<div class="mut sm">Dün</div>`:""}</div><span style="display:flex;align-items:center;gap:6px;margin-left:auto">${val}${c.state==="pending"&&c.items.length>1?`<button class="chip" data-c="lrm:${m.id}:${i}" aria-label="${lbl} çıkar">×</button>`:""}</span></div>`;
  }).join("");
  const est=c.items.some(i=>i.type==="yemek"),onlySp=c.items.every(i=>i.type==="spor"),ml=c.meal||(c.items.find(i=>i.meal)||{}).meal||LogLib.mealOf({time:cTime(Date.now())}),tot=c.items.reduce((a,i)=>a+(i.type==="yemek"&&i.kcal?i.kcal:0),0);
  return `<div class="card lcard"><div class="lhead"><b>${est?"Öğüne ekle":onlySp?"Egzersizi ekle":"Kayıt önerisi"}</b>${est?`<span class="tahmin">Tahmin</span>`:""}</div>${rows}
  ${est?`<div class="mut sm" style="padding-top:6px">Toplam ~${Math.round(tot)} kcal</div>${c.state==="pending"?`<div class="chips" style="margin:8px 0 0">${LogLib.MEALS.map(([k,n])=>`<button class="chip" data-c="lml:${m.id}:${k}" aria-pressed="${ml===k}">${n}</button>`).join("")}</div>`:""}`:""}
  ${c.state==="pending"?`<div class="lbtns"><button class="btn" data-c="ok:${m.id}">${est?"Günlüğe ekle":onlySp?"Egzersizi ekle":"Onayla"}</button><button class="btn ghost" data-c="no:${m.id}">Vazgeç</button></div>`:`<div class="mut sm">${c.state==="ok"?"Kaydedildi":"Vazgeçildi"}</div>${c.state==="ok"&&est&&!c.saved?`<div class="lbtns"><button class="btn ghost" data-c="savefood:${m.id}">Yemeği listeme kaydet</button></div>`:""}`}</div>`;
}
/* Onay metni tek yerde: Koç ekranı ve Gizlilik ve veri aynı metni gösterir. Gönderilen alanlar değişirse CONSENT_V'yi artır. */
const consentOk=()=>S.settings.age>=18;
const ageMsg=()=>S.settings.age>0?"18 yaş altında Koç kapalı":"Koç için önce yaşını gir (Ayarlar > Profil)";
/* Rıza, verinin gideceği sağlayıcı kümesine bağlıdır: anahtarı olan ve açık bir sağlayıcı rıza anındaki kümede değilse (ücretli ya da özel sağlayıcı sonradan açıldı) yeniden onay istenir. consentP yoksa eski rıza dört eski hazır sağlayıcıyı kapsar. */
const LEGACY_P="gemini,groq,nvidia,openrouter";
const provSet=()=>S.providers.filter(p=>p.on&&p.health).map(p=>p.id).sort().join(",");
const provOk=()=>{const c=(S.settings.consentP==null?LEGACY_P:S.settings.consentP).split(","),k=getKeys();return S.providers.every(p=>!(p.on&&p.health&&k[p.id])||c.includes(p.id))};
/* Yaş sonradan 18'in altına inerse (ayar, yedek) verilmiş onay da düşer; gönderim yolları coachOn'dan geçer. */
const coachOn=()=>S.settings.consent&&consentOk()&&provOk();
function cAgeGuard(){if(S.settings.consent&&!consentOk()){Object.assign(S.settings,{consent:false,consentV:0,consentAt:""});toast(S.settings.age>0?"18 yaş altında Koç veri paylaşımı kapatıldı":"Yaş girilmediği için Koç veri paylaşımı kapatıldı")}}
/* Tek metin kaynağı: uygulama içi onay ve docs/gizlilik-politikasi.md §5 aynı iki cümleyi taşır (app.test.js eşitliği sınar). Değişirse ikisini birlikte güncelle; gönderilen alanlar değiştiyse CONSENT_V'yi artır. */
const CONSENT_SENT="yazdığın mesajlar ve son 10 sohbet mesajı (Koç yanıtları dahil); profilin (boy, yaş, cinsiyet, hareket düzeyi); sağlık notun; hedeflerin ve hesaplanan değerler (trend kilo, tahmini harcama, protein aralığı); son 14 günün kilo, yemek (kcal ve protein), su, spor ve adım özeti (varsa uyku ve ruh hali); bugünkü kayıtların (yemek adları, su, tartı, spor ve not metinleri); son 3 antrenman (hareket adları, en iyi set) ve bu haftaki bölge başına set sayıları; son 7 günün en çok 3 notu; ilaç modülü açıksa ilaç adı, doz, saatler, haftanın günleri, son 7 günün uyumu ve stok; menü ya da program istersen yazdığın istek notu ve menü kataloğunda kendi besin, favori ve şablon adların (kalori ve protein değerleriyle)";
const CONSENT_WHEN="Yalnız sen bir düğmeye bastığında gönderilir (mesaj gönder, yorum, menü ya da program iste); uygulama açılırken ya da arka planda kendiliğinden hiçbir şey gönderilmez.";
const CONSENT_NOT="Tahlil, tansiyon, şeker, vücut ölçüleri, tarifler, oruç kayıtları, fotoğraf, konum ve yedek gönderilmez.";
const consentHtml=()=>`<b>Koç ile veri paylaşımına açık rızan</b><ul style="margin:6px 0;padding-left:18px"><li><b>Ne gönderilir:</b> ${CONSENT_SENT}. ${CONSENT_NOT}</li><li><b>Ne zaman:</b> ${CONSENT_WHEN}</li><li><b>Kime:</b> seçtiğin sağlayıcıya (${esc(S.providers.filter(p=>p.on&&p.health).map(p=>p.name).join(", ")||"hiçbiri seçili değil")}), kendi anahtarınla. Sunucuları yurt dışındadır; bu bir yurt dışına aktarımdır.</li><li><b>Geri alma:</b> istediğin an Ayarlar > Gizlilik ve veri ya da Yapay zekâ koç bölümünden. Geri alınca yeni veri gitmez; önceden gönderilene sağlayıcının kendi politikası uygulanır.</li><li><b>Onay vermezsen</b> uygulama tam çalışır, yalnız Koç konuşmaz.</li></ul>${S.settings.consent&&consentOk()&&!provOk()?`<p><b>Sağlayıcı listen değişti.</b> Onayını verdiğinde bu sağlayıcılar yoktu; devam için yeniden onay ver.</p>`:""}${S.providers.some(p=>p.on&&p.health&&isCustom(p))?`<p><b>Özel sağlayıcı:</b> kendi eklediğin sunucuya (${esc(S.providers.filter(p=>p.on&&p.health&&isCustom(p)).map(p=>hostOf(p)).join(", "))}) verilerin ve anahtarın doğrudan gider; yalnız güvendiğin bir servis kullan.</p>`:""}${consentOk()?"":S.settings.age>0?`<p><b>18 yaş altı için Koç veri paylaşımı kapalıdır.</b></p>`:`<p><b>Koç için önce yaşını gir</b> (Ayarlar > Profil ve hedefler). Yaş bilinmeden Koç açılmaz.</p>`}`;
/* Sohbeti siler, onaya dokunmaz. */
function cClearChat(){S.chat=[];S.chats=[];save()}
/* Ayrı sohbetler: açık sohbet geçmişe arşivlenir, yeni sohbet boş başlar; modele yalnız açık sohbet gider. */
const chatTitle=a=>{const u=a.find(m=>m.role==="user");return (u?u.text:"Sohbet").slice(0,60)};
function cArchive(){
  if(!S.chat.some(m=>m.role==="user"))return;
  S.chats.unshift({id:Date.now(),t:S.chat[S.chat.length-1].t,title:chatTitle(S.chat),msgs:S.chat});
  S.chats=trimChats(S.chats);
}
function cSwitchOk(){if(busy||typing||S.chat.some(m=>m.pend)){toast("Koç yanıt verirken sohbet değişmez");return false}return true}
function cNewChat(){if(!cSwitchOk())return;cArchive();S.chat=[];save();render()}
function cOpenChat(id){
  if(!cSwitchOk())return;
  const x=S.chats.find(c=>c.id===id);if(!x)return;
  S.chats=S.chats.filter(c=>c!==x);cArchive();S.chat=x.msgs;
  S.cid=Math.max(S.cid,...x.msgs.map(m=>m.id+1));
  save();closeSheet();render();cScroll();
}
function cChatList(){
  openSheet(`<h3>Sohbet geçmişi</h3>${S.chats.length?S.chats.map(c=>`<div class="prow"><button class="lnk" style="flex:1;text-align:left" data-c="openchat:${c.id}"><b>${esc(c.title)}</b><span class="mut sm">${fd(dayKey(new Date(c.t)))}, ${c.msgs.filter(m=>m.role==="user").length} mesaj</span></button><button class="lnk" style="width:auto" data-c="delchat:${c.id}" aria-label="Sohbeti sil: ${esc(c.title)}">Sil</button></div>`).join(""):`<p class="hint">Geçmiş sohbet yok. Yeni sohbet başlatınca eskisi burada saklanır.</p>`}<button class="btn ghost" data-g="closesheet">Kapat</button>`);
}
function cConsent(on){
  const s=S.settings;if(on&&!consentOk())return;
  Object.assign(s,{consent:on,consentV:on?CONSENT_V:0,consentAt:on?dayKey():"",consentP:on?provSet():null});save();render();
}
function viewKoc(){
  let h="";
  const intro=offline==="none"||(!hasKey()&&!S.chat.length);
  if(intro)h+=`<div class="banner info"><b>Koç ne yapar?</b><p>Yazdıklarından yemek, su ve kilo kaydı önerir, istersen günü ve haftayı yorumlar, hedefini ayarlamana yardım eder.</p><b>Verin nereye gider?</b><p>Koç yapay zekâ kullanır: internet ister, çevrimdışı çalışmaz. Yalnızca sen onay verirsen ve kendi hesabından alacağın bir anahtarla çalışır (ücretsiz seçenekler var). Onay verirsen profilin, kayıtların ve yazdıkların seçtiğin sağlayıcıya gider; sağlayıcının sunucuları yurt dışındadır. İstediğin an geri alırsın (Ayarlar > Gizlilik ve veri).</p><p><b>Koç olmadan da uygulama tam çalışır.</b></p><button class="btn" data-c="guide">Koçu etkinleştir, yaklaşık 2 dakika</button></div>`;
  else if(offline==="fail"){
    const x=S.providers.filter(p=>pstat[p.id]&&pstat[p.id].s!=="ok").sort((a,b)=>pstat[b.id].t-pstat[a.id].t)[0];
    h+=`<div class="banner"><b>Koç şu an ulaşılamıyor</b>${x&&pstat[x.id].m?`<p>${esc(x.name)}: ${esc(pstat[x.id].m)}</p>`:""}<p>Su, kilo ve spor kaydı çalışıyor. Yemek tahmini bağlantı gelince yapılır.</p><button class="btn" data-c="retry">Yeniden dene</button></div>`;
  }
  if(!coachOn()&&!intro)h+=`<div class="banner info">${consentHtml()}${consentOk()?`<button class="btn" data-c="consent">Açık rızamı veriyorum</button>`:""}<button class="lnk" data-pv="open">Gizlilik ve veri</button></div>`;
  if(S.chat.length||S.chats.length)h+=`<div class="chips">${S.chat.length?`<button class="chip" data-c="newchat">Yeni sohbet</button>`:""}${S.chats.length?`<button class="chip" data-c="chats">Geçmiş (${S.chats.length})</button>`:""}</div>`;
  if(!S.chat.length&&hasKey())h+=`<p class="hint">Bir şey yaz: "2 yumurta ve ekmek yedim", "83,7 çektim" ya da "bugün ne yapmalıyım?"</p>`;
  for(const m of S.chat){
    if(m.role==="user")h+=`<div class="ub">${esc(m.text)}</div>${m.pend?`<div class="pendl">Gönderilmedi${coachOn()&&!typing?`<button class="lnk" style="display:inline;width:auto;min-height:44px;margin-left:6px" data-c="retry">Şimdi gönder</button>`:""}</div>`:""}`;
    else if(m.role==="coach"){
      const lab=m.kind==="plan"?`Günün yorumu, ${cTime(m.t)}`:m.kind==="weekly"?`Haftanın yorumu, ${cTime(m.t)}`:cTime(m.t);
      h+=`<div class="cm" data-mid="${m.id}">${m.text?`<div class="mut sm">${lab}</div><p>${esc(m.text)}</p>`:""}${m.kind==="plateau"&&lossAsk()?`<div class="lbtns"><button class="btn" data-c="why">Bak</button></div>`:""}${cCard(m)}</div>`;
    }
  }
  if(typing)h+=`<div class="cm"><div class="mut sm">Koç yazıyor</div><p class="dots">• • •</p></div>`;
  else if(lossAsk())h+=`<div class="chips"><button class="chip" data-c="why">Bu hafta neden kilo vermedim?</button></div>`;
  if(!typing){
    const why=!S.settings.consent?"Menü için önce yukarıdaki veri paylaşımını kabul et":!usable().length?"Menü için Koç anahtarı gerekli (Ayarlar > Koç)":"";
    h+=`<div class="chips"><button class="chip" data-c="menu"${why?' disabled aria-disabled="true"':""}>Haftalık menü öner</button></div>${why?`<p class="hint">${why}</p>`:""}`;
  }
  return `<div class="chat">${h}</div>`;
}
function cScroll(){if(tab==="koc")setTimeout(()=>window.scrollTo(0,document.body.scrollHeight),30)}

/* ---- ayarlar: sağlayıcılar ---- */
function pStatus(p){
  const k=getKeys()[p.id],s=pstat[p.id];
  if(!p.on)return ["Kapalı",""];
  if(!p.health)return ["Sağlık verisi kapalı",""];
  if(!k)return ["Anahtar yok",""];
  if(s&&s.s==="ok")return ["Çalışıyor",`Son başarılı ${cTime(s.t)}, ${fmt(s.ms/1000,1)} sn`];
  if(s&&s.s==="limit")return ["Limit doldu","1 dakika sonra yeniden denenebilir"];
  if(s&&s.s==="key")return ["Anahtar geçersiz",""];
  if(s&&s.s==="err")return ["Hata",s.m||""];
  return ["Hazır","Henüz denenmedi"];
}
function viewProviders(){
  const rows=S.providers.map((p,i)=>{const [a,b]=pStatus(p);return `<button class="prow" data-c="prov:${p.id}"><span style="min-width:0"><b>${esc(p.name)}</b><span class="mut sm">${esc(p.model)}${b?", "+esc(b):""}</span></span><span class="tag">${a}</span></button>`}).join("");
  return `<h2>Yapay zekâ koç</h2><div class="card"><button class="btn" data-c="setup">Anahtar ekle</button><p class="hint" style="padding:8px 0">Sırayla denenir. Limite takılırsa sıradaki devreye girer. Anahtarlar bu telefonda şifreli durur; yalnız parolalı yedeğe şifreli girer, düz hiçbir yere yazılmaz.</p>${rows}
  <div class="btns"><button class="btn ghost" data-c="addprov">Sağlayıcı ekle</button></div>
  <p class="hint">Veri paylaşımı: ${S.settings.consent?`kabul edildi (${fd(S.settings.consentAt)})`:"kabul edilmedi"}. ${S.settings.consent?`<button class="lnk" style="display:inline-block;width:auto" data-c="revoke">Geri al</button>`:""}</p>
  <div class="btns"><button class="btn danger" data-c="clearchat">Sohbeti temizle</button></div></div>`;
}
/* Adresler yalnız yaygın bilinen anahtar sayfaları; panel düğme adları değişebilir. */
const GUIDE={
  nvidia:{site:"build.nvidia.com",steps:["Tarayıcında build.nvidia.com adresini aç, hesap oluştur ya da giriş yap.","Bir model sayfası aç (örneğin llama).","Sayfadaki anahtar oluşturma düğmesine bas. Düğme adı değişebilir, geliştirici panelinden anahtar oluştur.","Çıkan anahtarı kopyala ve aşağıya yapıştır."]},
  groq:{site:"console.groq.com/keys",steps:["Tarayıcında console.groq.com adresini aç, hesap oluştur ya da giriş yap.","Menüden anahtarlar bölümüne (API Keys) gir.","Anahtar oluştur düğmesine (Create API Key) bas, bir ad ver.","Anahtarı kopyala, bir daha gösterilmeyebilir. Aşağıya yapıştır."]},
  openrouter:{site:"openrouter.ai/keys",steps:["Tarayıcında openrouter.ai adresini aç, hesap oluştur ya da giriş yap.","Hesap menüsünden anahtarlar sayfasına (Keys) gir.","Anahtar oluştur düğmesine (Create Key) bas, bir ad ver.","Anahtarı kopyala ve aşağıya yapıştır."]},
  gemini:{site:"aistudio.google.com/apikey",steps:["Tarayıcında aistudio.google.com adresini aç ve Google hesabınla giriş yap.","Anahtar sayfasına (Get API key) gir.","Yeni anahtar oluştur düğmesine bas.","Anahtarı kopyala ve aşağıya yapıştır. Ücretsiz katmanda istemler ürün geliştirmek için kullanılabilir, bu yüzden her göndermeden önce sorulur."]},
  openai:{site:"platform.openai.com/api-keys",steps:["Tarayıcında platform.openai.com adresini aç, hesap oluştur ya da giriş yap.","Faturalandırma (Billing) bölümünden ödeme yöntemi ve harcama sınırı belirle; ücretli bir servistir.","Anahtarlar sayfasında (API keys) yeni anahtar oluştur (Create new secret key).","Anahtarı kopyala, bir daha gösterilmez. Aşağıya yapıştır."]},
  anthropic:{site:"platform.claude.com/settings/keys",steps:["Tarayıcında platform.claude.com adresini aç, hesap oluştur ya da giriş yap.","Faturalandırma (Billing) bölümünden kredi yükle ya da harcama sınırı belirle; ücretli bir servistir.","Anahtarlar sayfasında (API keys) yeni anahtar oluştur (Create Key).","Anahtarı kopyala, bir daha gösterilmez. Aşağıya yapıştır."]}
};
function cGuide(id){
  const p=S.providers.find(x=>x.id===id),g=GUIDE[id];if(!p||!g)return cSetup(true);
  su.id=id;
  openSheet(`<h3>${esc(p.name)} anahtarı nasıl alınır?</h3><div class="mut sm" style="margin-bottom:6px">${esc(g.site)}</div><ol class="cues">${g.steps.map(t=>`<li>${esc(t)}</li>`).join("")}</ol>
  <button class="btn" data-c="setup">‹ Anahtarı yapıştır</button>`);
}
/* ---- kurulum: 1 anahtar (sağlayıcı önekten tahmin), 2 doğrula ve modelleri getir (Önerilen hazır seçili), 3 test et ve kaydet.
   Ağ çağrısı yalnız düğmeye basınca ve yalnız seçilen sağlayıcıya gider; giden yalnız anahtar ve sabit test cümlesi. Model listesi bellekte kalır, yedeğe girmez. */
const PNOTE={nvidia:"Ücretsiz deneme kredisi",groq:"Ücretsiz, çok hızlı",openrouter:"Ücretsiz modeller var",gemini:"Ücretsiz katman, her gönderimde sorulur",openai:"Ücretli, ucuz model önerilir",anthropic:"Ücretli, ucuz model önerilir"};
const suNew=()=>({k:"",id:null,models:null,rec:"",model:"",adv:false,msg:"",fail:"",ok:"",busy:false});
let su=suNew();
const suProv=()=>GUIDE[su.id]?S.providers.find(p=>p.id===su.id):null;
function cSetup(fresh){
  if(fresh)su=suNew();
  openSheet(`<h3>Koçu bağla</h3><label class="lbl" for="sk">1. Anahtarını yapıştır</label>
  <input class="in" id="sk" type="password" value="${esc(su.k)}" placeholder="Anahtarı yapıştır" autocomplete="off" spellcheck="false">
  <div id="sbody">${suBody()}</div>`);
}
function suBody(){
  const g=CoachLib.keyProvider(su.k),p=suProv();
  let h=p&&g===su.id?`<p class="hint">${esc(p.name)} anahtarı olarak tanındı. Yanlışsa aşağıdan değiştir.</p>`
    :su.k&&!p?`<p class="hint">Sağlayıcı tanınmadı. Anahtarı hangi siteden aldıysan onu seç.</p>`:`<p class="hint">Anahtarı hangi siteden aldın? Yoksa birini seç, nasıl alınacağını gösteririz.</p>`;
  h+=S.providers.filter(x=>GUIDE[x.id]).map(x=>`<button class="prow" data-c="sp:${x.id}" aria-pressed="${su.id===x.id}"><span><b>${esc(x.name)}</b><span class="mut sm">${PNOTE[x.id]}</span></span><span class="tag">${su.id===x.id?"Seçili":"Seç"}</span></button>`).join("");
  if(!p)return h;
  h+=`<button class="lnk" data-c="guide:${p.id}">${esc(p.name)} anahtarı nereden alınır?</button>${PAID.includes(p.id)?`<p class="hint">${esc(p.name)} ücretli bir servistir: kullandıkça ücret çıkabilir; kotayı sağlayıcı sitende sen belirlersin.</p>`:""}
  <div class="lbl">2. Modeli seç</div><p class="hint">Anahtarını ve bir deneme cümlesini sağlayıcıya göndeririz; sağlık verin gitmez.</p><button class="btn ghost" data-c="sfetch"${su.busy?" disabled":""}>Doğrula ve modelleri getir</button>`;
  if(su.models){
    const m=su.models.find(x=>x.id===su.model),tag=[su.model===su.rec?"Önerilen":"",m&&m.free?"ücretsiz":"",su.model===su.ok?"denendi":""].filter(Boolean).join(", ");
    h+=`<p style="margin:10px 0 4px;overflow-wrap:anywhere"><b>${esc(su.model)}</b>${tag?` <span class="tag">${tag}</span>`:""}</p>`;
    h+=su.adv?`<label class="lbl" for="smsel">Başka model</label><select class="in" id="smsel">${su.models.map(x=>`<option value="${esc(x.id)}"${x.id===su.model?" selected":""}>${esc(x.id)}${x.id===su.rec?" (önerilen)":x.free?" (ücretsiz)":""}</option>`).join("")}</select>
      <label class="lbl" for="smfree">Ya da model kimliğini yaz</label><input class="in" id="smfree" autocomplete="off" spellcheck="false" placeholder="ör. ${esc(p.model)}">`
      :`<button class="lnk" data-c="sadv">Başka model seç</button>`;
  }
  h+=`<div class="lbl">3. Dene</div><button class="btn" data-c="stest"${su.busy?" disabled":""}>Test et ve kaydet</button>
  <p class="hint" id="smsg" role="status">${esc(su.msg)}</p>${su.fail&&!["key","model","empty"].includes(su.fail)?`<button class="btn ghost" data-c="ssave">Denemeden kaydet</button>`:""}`;
  return h;
}
function suRender(){const b=$("#sbody");if(b)b.innerHTML=suBody()}
/* 18 yaş altında kurulum da ağ çağrısı yapmaz; consent zinciri ayrıca sağlık verisini korur. */
function suCheck(){
  const k=su.k.trim();
  if(!consentOk())su.msg=ageMsg()+".";
  else if(k.length<8||/\s/.test(k))su.msg="Anahtar eksik ya da yanlış yapıştırılmış görünüyor.";
  else if(PAID.includes(CoachLib.keyProvider(k))&&CoachLib.keyProvider(k)!==su.id)su.msg="Bu anahtar seçili sağlayıcıya ait değil, gönderilmedi.";
  else return k;
  suRender();return null;
}
const probe=(p,k,model,ms)=>callProvider(Object.assign({},p,{model}),k,[{role:"user",content:"Sadece 'tamam' yaz."}],200,{ms,probe:true});
async function suFetch(){
  const p=suProv(),k=p&&!su.busy&&suCheck();if(!k)return;
  su.busy=true;su.msg="Modeller getiriliyor…";su.fail="";suRender();
  try{
    const r=await fetch(pModelsUrl(p),{headers:pHeaders(p,k)});
    if(!r.ok){const e=new Error("HTTP "+r.status);e.status=r.status;try{e.body=await r.text()}catch(x){}throw e}
    su.models=CoachLib.parseModels(await r.json());su.adv=false;su.ok="";
    /* Liste bazı sağlayıcılarda anahtarsız da gelir ve listedeki model hesapta çalışmayabilir: adaylar kısa sürede gerçek istekle denenir, ilk yanıt veren önerilir. */
    const cands=CoachLib.candidates(p.id,su.models).slice(0,4),stop=["key","quota","net","limit"];let last=null;
    if(!cands.length)cands.push(p.model);
    for(const m of cands){
      su.msg=`${m} deneniyor…`;suRender();
      try{await probe(p,k,m,15000);su.ok=m;break}catch(e){last=errOf(e);if(stop.includes(last.kind))break}
    }
    su.rec=su.model=su.ok||cands[0];
    if(su.ok)su.msg="Anahtar çalışıyor, önerilen model denendi ve yanıt verdi. Kaydedebilirsin.";
    else{su.fail=last.kind;su.msg=last.text+(stop.includes(last.kind)?"":" Önerilen modeller yanıt vermedi; başka model seçip dene.")}
  }catch(e){su.models=null;su.msg=errOf(e).text}
  su.busy=false;suRender();
}
function suSave(p,k,model){p.model=model;p.on=p.health=true;setKey(p.id,k);delete cool[p.id];save();closeSheet();render();if(S.settings.consent&&!provOk())toast("Yeni sağlayıcı için Koç ekranında veri paylaşımını yeniden onayla")}
async function suTest(){
  const p=suProv(),k=p&&!su.busy&&suCheck();if(!k)return;
  const model=(su.model||p.model).trim().slice(0,100),t0=Date.now();
  if(model===su.ok){suSave(p,k,model);return toast(`${p.name} çalışıyor, kaydedildi`)}
  su.busy=true;su.msg="Deneniyor…";su.fail="";suRender();
  try{
    await probe(p,k,model);
    pstat[p.id]={s:"ok",t:Date.now(),ms:Date.now()-t0};su.busy=false;suSave(p,k,model);toast(`${p.name} çalışıyor, kaydedildi`);
  }catch(e){const x=errOf(e);su.busy=false;su.fail=x.kind;su.msg=x.text;suRender()}
}
document.addEventListener("input",ev=>{
  const t=ev.target;
  if(t.id==="sk"){su.k=t.value;su.ok="";const g=CoachLib.keyProvider(su.k);if(GUIDE[g]&&g!==su.id){su.id=g;su.models=null}su.msg=su.fail="";suRender()}
  else if(t.id==="smfree"&&t.value.trim())su.model=t.value.trim();
});
document.addEventListener("change",ev=>{const t=ev.target;if(t.id==="smsel"){su.model=t.value;suRender()}else if(t.id==="pmsel")$("#pm").value=t.value});
function cSheetProv(id){
  const p=S.providers.find(x=>x.id===id);if(!p)return;
  const k=getKeys()[id],builtin=defProviders().some(d=>d.id===id);
  const i=S.providers.indexOf(p);
  openSheet(`<h3>${esc(p.name)}</h3>
  <div class="lbl">Adres</div><input class="in" id="pb" value="${esc(p.base)}" autocomplete="off" spellcheck="false" style="font-size:14px"${builtin?" readonly":""}>
  <div class="lbl">Model</div><input class="in" id="pm" value="${esc(p.model)}" autocomplete="off" spellcheck="false" style="font-size:14px"><div id="pmlist"></div>
  <div class="lbl">Anahtar</div><input class="in" id="pk" type="password" placeholder="${k?"••••"+esc(k.slice(-4)):"yapıştır"}" autocomplete="off" spellcheck="false" style="font-size:14px">
  <label class="chkrow"><input type="checkbox" id="pon" ${p.on?"checked":""}> Bu sağlayıcıyı kullan</label>
  <label class="chkrow"><input type="checkbox" id="ph" ${p.health?"checked":""}> Sağlık verisi gönder</label>
  <div class="mut sm" style="margin:2px 0 10px">${p.confirm?"Bu sağlayıcıda ücretsiz katman istemleri ürün geliştirmek için kullanabilir. Açarsan her göndermeden önce onay istenir.":"Kapalıysa bu sağlayıcıya hiçbir şey gönderilmez."}</div>
  <div class="two"><button class="btn ghost" data-c="ptest:${id}">Bağlantıyı test et</button><button class="btn ghost" data-c="pmodels:${id}">Modelleri getir</button></div>
  <div class="two" style="margin-top:8px"><button class="btn ghost" data-c="pmove:${id}:-1"${i===0?" disabled":""}>Yukarı taşı</button><button class="btn ghost" data-c="pmove:${id}:1"${i===S.providers.length-1?" disabled":""}>Aşağı taşı</button></div>
  <div class="btns"><button class="btn" data-c="psave:${id}">Kaydet</button>${k?`<button class="btn danger" data-c="pkeydel:${id}">Anahtarı sil</button>`:""}${builtin?"":`<button class="btn danger" data-c="pdel:${id}">Sağlayıcıyı kaldır</button>`}</div>`);
}
function pRead(id){
  const p=S.providers.find(x=>x.id===id);
  const def=defProviders().find(d=>d.id===id),base=def?def.base:$("#pb").value.trim(),model=$("#pm").value.trim();
  if(!/^https:\/\/[^\s]+$/.test(base)){toast("Adres https:// ile başlamalı");return null}
  if(!model){toast("Model adı yaz");return null}
  p.base=base.slice(0,200);p.model=model.slice(0,100);p.on=$("#pon").checked;p.health=$("#ph").checked;
  const key=$("#pk").value.trim();if(key)setKey(id,key);
  save();return p;
}
async function cProvClick(a,p1,p2){
  switch(a){
    case "prov":return cSheetProv(p1);
    case "addprov":
      return openSheet(`<h3>Sağlayıcı ekle</h3><div class="lbl">OpenAI uyumlu bir servis (adres /chat/completions'ın bir üstü olmalı)</div><p class="hint">Dikkat: eklediğin sunucuya sağlık verilerin ve anahtarın gider. Yalnız güvendiğin bir servis ekle.</p><input class="in" id="an" placeholder="Ad" maxlength="40"><input class="in" id="ab" placeholder="https://.../v1" style="font-size:14px"><input class="in" id="am" placeholder="Model adı" style="font-size:14px"><button class="btn" data-c="mkprov">Ekle</button>`);
    case "mkprov":{
      const n=$("#an").value.trim(),b=$("#ab").value.trim(),m=$("#am").value.trim();
      if(!n||!m||!/^https:\/\/[^\s]+$/.test(b))return toast("Ad, https adres ve model gerekli");
      const id="u"+(S.cid++);S.providers.push({id,name:n.slice(0,40),base:b.slice(0,200),model:m.slice(0,100),on:true,health:true,confirm:false});save();render();return cSheetProv(id);
    }
    case "psave":{const p=pRead(p1);if(!p)return;closeSheet();render();return toast("Kaydedildi")}
    case "ptest":{
      const p=pRead(p1);if(!p)return;const key=getKeys()[p1];if(!key)return toast("Önce anahtarı ekle");if(!consentOk())return toast(ageMsg());
      toast("Deneniyor…");const t0=Date.now();
      try{await probe(p,key,p.model);pstat[p1]={s:"ok",t:Date.now(),ms:Date.now()-t0};delete cool[p1];toast(`Çalışıyor, ${fmt((Date.now()-t0)/1000,1)} sn`)}
      catch(e){toast(pFail(p1,e))}
      render();return;
    }
    case "pmodels":{
      const p=pRead(p1);if(!p)return;const key=getKeys()[p1];if(!key)return toast("Önce anahtarı ekle");if(!consentOk())return toast(ageMsg());
      try{
        const r=await fetch(pModelsUrl(p),{headers:pHeaders(p,key)});
        if(!r.ok){const e=new Error("HTTP "+r.status);e.status=r.status;try{e.body=await r.text()}catch(x){}throw e}
        const ms=CoachLib.parseModels(await r.json()),rec=CoachLib.pickModel(p1,ms),box=$("#pmlist");
        if(box)box.innerHTML=`<label class="lbl" for="pmsel">${ms.length} model bulundu</label><select class="in" id="pmsel">${ms.map(x=>`<option value="${esc(x.id)}"${x.id===p.model?" selected":""}>${esc(x.id)}${x.id===rec?" (önerilen)":x.free?" (ücretsiz)":""}</option>`).join("")}</select>`;
      }catch(e){toast(errOf(e).text)}
      return;
    }
    case "pmove":{const i=S.providers.findIndex(x=>x.id===p1),j=i+(+p2);if(i<0||j<0||j>=S.providers.length)return;[S.providers[i],S.providers[j]]=[S.providers[j],S.providers[i]];save();render();return cSheetProv(p1)}
    case "pkeydel":setKey(p1,"");closeSheet();render();return toast("Anahtar silindi");
    case "pdel":S.providers=S.providers.filter(x=>x.id!==p1);setKey(p1,"");save();closeSheet();render();return;
  }
}
function cClick(v,el){
  const [a,p1,p2]=v.split(":");
  switch(a){
    case "askfood":{const q=foodAskQ.trim();if(q){closeSheet();tab="koc";render();cSend(`${q} kaç kalori? Bir porsiyon için tahmin et.`)}return}
    case "send":{const i=$("#cmsg");const t=i.value;i.value="";return cSend(t)}
    case "retry":offline=null;cFlush();return render();
    case "cmt":return cComment(p1);
    case "consent":return cConsent(true);
    case "revoke":return cConsent(false);
    case "guide":return p1?cGuide(p1):cSetup(true);
    case "setup":return cSetup(!$("#sheet").classList.contains("on"));
    case "sp":if(su.id!==p1){su.id=p1;su.models=null;su.msg=su.fail=su.ok=""}return suRender();
    case "sadv":su.adv=true;return suRender();
    case "sfetch":return suFetch();
    case "stest":return suTest();
    case "ssave":{const p=suProv(),k=p&&suCheck();if(k){suSave(p,k,(su.model||p.model).slice(0,100));toast(`${p.name} anahtarı kaydedildi, denenmedi`)}return}
    case "why":return cWhy();
    case "prog":return cProgSheet();
    case "po":if(p1 in progOpt){progOpt[p1]=p1==="d"||p1==="m"?+p2:p2;cProgSheet()}return;
    case "progask":closeSheet();return cProgram(progOpt);
    case "progadd":{
      const m=S.chat.find(x=>x.id===+p1);if(!m||!m.card||m.card.kind!=="program"||m.card.state!=="pending")return;
      gTplAdd(m.card.name,m.card.days);
      m.card.state="ok";save();render();return toast(`${m.card.days.length} şablon eklendi`);
    }
    case "whyai":return cWhyAsk(+p1);
    case "menu":return cMenuSheet();
    case "menuask":{menuNote=($("#mnote").value||"").replace(/\s+/g," ").trim().slice(0,200);closeSheet();return cMenu()}
    case "menuadd":{
      const c=menuCard(+p1),d=c&&c.days[+p2];if(!d)return;
      const bl=menuBlock(),why=d.off?`Bu günün toplamı ${d.k} kcal, hedefin (${c.kcal}) %15'inden fazla sapıyor.`:bl&&c.kcal&&d.k<c.kcal-50?`Kalori açığı önerilmiyor (${bl}); bu gün hedefin altında (${d.k} kcal).`:"";
      if(why&&!confirm(why+" Yine de bugüne eklensin mi?"))return;
      const it=menuEntries(d);return addFoods(it,dayKey(),`${d.n}: ${it.length} yemek bugüne eklendi`);
    }
    case "menutpl":{
      const c=menuCard(+p1),d=c&&c.days[+p2];if(!d)return;
      if(S.mealTpl.length>=20)return toast("En fazla 20 şablon");
      const all=menuEntries(d),id=Math.max(0,...S.mealTpl.map(t=>t.id))+1;
      S.mealTpl=LogLib.cleanTpl([...S.mealTpl,{id,n:("Menü: "+d.n).slice(0,40),items:all.slice(0,15).map(x=>LogLib.copyNutr(x,{text:x.text,v:x.v}))}]);save();
      return toast(`Şablon kaydedildi${all.length>15?" (ilk 15 yemek)":""}`,()=>{S.mealTpl=S.mealTpl.filter(t=>t.id!==id);save()});
    }
    case "shop":return cShop(+p1);
    case "shopchk":{
      const c=menuCard(+p1),x=c&&CoachLib.shopList(c)[+p2];if(!x)return;
      const on=!c.chk.includes(x.n);c.chk=on?[...c.chk,x.n].slice(-100):c.chk.filter(n=>n!==x.n);save();
      el.setAttribute("aria-pressed",on);el.querySelector(".plus").innerHTML=on?Icons.svg("check"):"";el.querySelector("b").style.textDecoration=on?"line-through":"";return;
    }
    case "shopcopy":{const c=menuCard(+p1);if(!c)return;const t=cShopText(c);(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Liste panoya kopyalandı"),()=>toast("Kopyalanamadı, Paylaş'ı kullan"));return}
    case "shopshare":{const c=menuCard(+p1);if(c)shareFile(`neowell-alisveris-${dayKey()}.txt`,"Alışveriş listesi","text/plain",cShopText(c),true);return}
    case "ok":return cApplyLog(+p1,el);
    case "lml":case "lrm":{
      const m=S.chat.find(x=>x.id===+p1),c=m&&m.card;if(!c||c.kind!=="log"||c.state!=="pending")return;
      if(a==="lml"){if(CoachLib.MEAL_KEYS.includes(p2))c.meal=p2}else{lReadK(c,el);c.items.splice(+p2,1)}
      save();return render();
    }
    case "fooddiary":{
      const m=S.chat.find(x=>x.id===+p1),c=m&&m.card;if(!c||c.kind!=="food"||c.logged)return;
      c.logged=true;return addFoods([{text:c.f.n,v:c.f.k,p:c.f.p==null?undefined:c.f.p,meal:LogLib.mealOf({time:cTime(Date.now())})}],dayKey(),`${c.f.n} günlüğe eklendi`,()=>{c.logged=false});
    }
    case "addfood":{const m=S.chat.find(x=>x.id===+p1);if(m&&m.card&&m.card.kind==="food"&&m.card.state==="pending"){if(myFoodAdd(m.card.f.n,m.card.f.k,m.card.f.p)){m.card.state="ok";save();render();toast("Besin listene eklendi")}else toast("Listen dolu (en fazla 200 besin)")}return}
    case "nofood":{const m=S.chat.find(x=>x.id===+p1);if(m&&m.card){m.card.state="no";save();render()}return}
    case "savefood":{
      const m=S.chat.find(x=>x.id===+p1);if(!m||!m.card||m.card.kind!=="log"||m.card.saved)return;
      let n=0;for(const it of m.card.items)if(it.type==="yemek"&&it.text&&it.kcal!=null&&myFoodAdd(it.text,it.kcal,it.p))n++;
      m.card.saved=true;save();render();toast(n?`${n} besin listene eklendi`:"Eklenecek besin yok");return;
    }
    case "no":{const m=S.chat.find(x=>x.id===+p1);if(m&&m.card){m.card.state="no";save();render()}return}
    case "applyk":{const m=S.chat.find(x=>x.id===+p1);if(m&&m.card&&m.card.state==="pending"){if(kcalBlocked(m.card.kcal)){m.card.state="no";save();render();return toast(cCalc().block)}S.settings.kcal=m.card.kcal;m.card.state="ok";save();render();toast(`Kalori hedefi ${m.card.kcal} kcal oldu`)}return}
    case "nok":{const m=S.chat.find(x=>x.id===+p1);if(m&&m.card){m.card.state="no";save();render()}return}
    case "dismiss":{const b=el.closest(".cm");if(b){S.chat=S.chat.filter(x=>x.id!==+b.dataset.mid);save();render()}return}
    case "newchat":return cNewChat();
    case "chats":return cChatList();
    case "openchat":return cOpenChat(+p1);
    case "delchat":{
      const i=S.chats.findIndex(c=>c.id===+p1);if(i<0)return;
      const [x]=S.chats.splice(i,1);save();render();cChatList();
      return toast("Sohbet silindi",()=>{if(!S.chats.some(c=>c.id===x.id)){S.chats.splice(Math.min(i,S.chats.length),0,x);S.chats=trimChats(S.chats);save();render();cChatList()}});
    }
    case "clearchat":if(confirm("Sohbet geçmişi silinsin mi? Kayıtların silinmez.")){cClearChat();render()}return;
    default:return cProvClick(a,p1,p2);
  }
}
