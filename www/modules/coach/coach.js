"use strict";
/* Coach: state, provider chain, chat screen and settings. Depends on coachlib.js and algo.js. */
/* API keys: kept in memory in KEYS; on the phone they are encrypted with the Keystore vault (KeyVault), in a browser without a vault they are plain text. */
const KEYS_LS="nw_keys",KEYS_ENC="nw_keys_enc";
/* Number of chat messages sent to the model; the consent text (CONSENT_SENT) is built from the same constant. */
const HIST_N=10;
let KEYS={},vaultOn=false;
const getKeys=()=>KEYS;
const keysStored=()=>!!(lsGet(KEYS_ENC)||lsGet(KEYS_LS));
const VAULT_WARN="Anahtarlar bu telefonda şifrelenemedi, düz saklanır";
/* If the vault fails on the phone, plain text is used only with the user's permission; without it the key stays in memory for this session only. */
let plainOk=lsGet("nw_keys_plain")==="1",plainNo=false,vaultWarned=false,locked=false;
/* KeyVaultPlugin contract: only "KEY_INVALIDATED" is a permanently invalid Keystore key; any other error is temporary and the encrypted record is kept. */
const invalid=e=>!!e&&e.code==="KEY_INVALIDATED";
const VAULT_RETRY="Rehber anahtarları şu an okunamadı, kayıtları silinmedi. Biraz sonra uygulamayı yeniden açıp tekrar dene";
const plainHas=()=>{try{return Object.keys(JSON.parse(lsGet(KEYS_LS)||"{}")).length>0}catch(e){return false}};
async function persistKeys(){
  const j=JSON.stringify(KEYS);
  if(locked){
    /* The encrypted record could not be read because of a temporary error: it is re-read before being overwritten; if that fails the old keys are kept and nothing is written. */
    try{KEYS={...JSON.parse((await KV().decrypt({data:lsGet(KEYS_ENC)})).text),...KEYS};locked=false}catch(e){if(invalid(e)){locked=false}else return void toast(VAULT_RETRY)}
  }
  if(KV()){
    try{
      let r;
      try{r=await KV().encrypt({text:j})}catch(e){if(!invalid(e))throw e;r=await KV().encrypt({text:j,reset:true})}
      lsSet(KEYS_ENC,r.data);lsDel(KEYS_LS);vaultOn=true;return;
    }catch(e){vaultOn=false}
  }
  if(KV()&&Object.keys(KEYS).length){
    if(!plainOk&&!plainHas()){
      if(plainNo||!await confirmSheet({title:"Anahtar düz saklansın mı?",body:VAULT_WARN+". Düz saklarsan uygulama kapanınca da kalır. Vazgeçersen anahtar yalnız bu oturumda kalır, uygulamayı kapatınca yeniden girersin.",ok:"Düz sakla",no:"Yalnız bu oturum"}))return void(plainNo=true);
      plainOk=true;lsSet("nw_keys_plain","1");
    }else if(!vaultWarned){vaultWarned=true;toast(VAULT_WARN)}
  }
  lsSet(KEYS_LS,j);
}
/* A plain copy is written only if the user agreed to plain storage or one already exists; if vault verification fails the key stays in memory for this session. */
const plainSave=()=>{if(plainOk||plainHas())lsSet(KEYS_LS,JSON.stringify(KEYS))};
function setKey(id,k){if(k)KEYS[id]=k;else delete KEYS[id];return persistKeys()}
async function keysInit(){
  const kv=KV(),enc=lsGet(KEYS_ENC);let lost=false;
  const readPlain=()=>{try{KEYS=JSON.parse(lsGet(KEYS_LS))||{}}catch(e){KEYS={}}};
  if(!kv){readPlain();return}
  try{
    if(enc){
      try{KEYS=JSON.parse((await kv.decrypt({data:enc})).text)||{}}
      catch(e){
        KEYS={};
        if(!invalid(e)){locked=true;console.log("NW-VAULT fail");return void toast(VAULT_RETRY)}
        lost=true;lsDel(KEYS_ENC);try{await kv.resetKey()}catch(x){}
      }
    }else readPlain();
    vaultOn=true;await persistKeys();
    if(vaultOn&&(await kv.decrypt({data:lsGet(KEYS_ENC)})).text!==JSON.stringify(KEYS)){vaultOn=false;plainSave()}
  }catch(e){vaultOn=false;if(!Object.keys(KEYS).length)readPlain();plainSave()}
  console.log("NW-VAULT "+(vaultOn?"ok":"fail"));
  if(lost)toast("Rehber anahtarları bu telefonda okunamadı (kasa anahtarı geçersiz olmuş olabilir), yeniden gir");
  else if(kv&&!vaultOn&&Object.keys(KEYS).length){vaultWarned=true;toast(VAULT_WARN)}
}
/* [id, name, base, on and health by default, asks before every send]; the default model is the first preference in CoachLib.MODEL_PREF. */
const BUILTIN=[
  ["nvidia","NVIDIA Build","https://integrate.api.nvidia.com/v1",false,false],
  ["groq","Groq","https://api.groq.com/openai/v1",true,false],
  ["openrouter","OpenRouter","https://openrouter.ai/api/v1",true,false],
  ["gemini","Google Gemini","https://generativelanguage.googleapis.com/v1beta/openai",false,true],
  ["openai","OpenAI","https://api.openai.com/v1",false,false],
  ["anthropic","Anthropic Claude","https://api.anthropic.com/v1",false,false]
];
const defProviders=()=>BUILTIN.map(([id,name,base,on,confirm])=>({id,name,base,model:CoachLib.MODEL_PREF[id][0],on,health:on,confirm}));
/* Paid built-in providers: setup shows a cost note. */
const PAID=["openai","anthropic"];
/* Provider names from one source: the privacy screen and the docs (app.test.js) use this list. */
const provNames=()=>defProviders().map(p=>p.name).join(", ");
/* Anthropic native Messages API: x-api-key plus the version header; in a WebView the CORS preflight passes only with the direct-browser header. */
const pHeaders=(p,key)=>p.id==="anthropic"?{"x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"}:{Authorization:"Bearer "+key};
let pstat={},cool={},busy=false,typing=false,offline=null;

/* ---- validation ---- */
function cleanCoach(r){
  const provs=[],defs=defProviders(),known=EXDB.map(e=>e.id).concat((Array.isArray(r.customEx)?r.customEx:[]).map(e=>e&&e.id).filter(i=>typeof i==="string"&&/^c\d+$/.test(i)));
  for(const p of (Array.isArray(r.providers)?r.providers:[])){
    if(!p||typeof p.id!=="string"||!/^[a-z0-9]{1,16}$/.test(p.id)||p.id in Object.prototype||typeof p.name!=="string"||typeof p.base!=="string"||!/^https:\/\/[^\s]+$/.test(p.base)||typeof p.model!=="string")continue;
    if(provs.some(x=>x.id===p.id))continue;
    const def=defs.find(d=>d.id===p.id),model=p.model.slice(0,100);
    /* The address of a built-in provider is the host allowlist: a backup or damaged record cannot send the key to another server. */
    provs.push({id:p.id,name:p.name.slice(0,40),base:def?def.base:p.base.slice(0,200),model,on:p.on===true,health:p.health===true,confirm:p.confirm===true});
  }
  const chat=cleanChat(r.chat,known),chats=[];
  for(const x of (Array.isArray(r.chats)?r.chats:[]).slice(0,CHATS_MAX)){
    if(!x||!Number.isInteger(x.id)||!Number.isFinite(x.t)||chats.some(c=>c.id===x.id))continue;
    const msgs=cleanChat(x.msgs,known);
    if(msgs.length)chats.push({id:x.id,t:x.t,title:typeof x.title==="string"?x.title.slice(0,60):"Sohbet",msgs});
  }
  const top=Math.max(...chat.map(m=>m.id),...chats.flatMap(c=>c.msgs.map(m=>m.id)),0);
  return {providers:provs.length?provs:defs,chat,chats:trimChats(chats),cid:Math.max(1,top+1,Number.isInteger(r.cid)?r.cid:1)};
}
const CHATS_MAX=20,ARCH_MSGS=600,ARCH_CHARS=250000,CHAT_MAX=150;
/* The archive must not fill the storage quota: the newest chats stay and older ones are dropped once the total message or size limit is exceeded (the newest always stays). */
function trimChats(list,warn){
  let n=0,ch=0;const out=[];
  for(const c of list){
    n+=c.msgs.length;ch+=JSON.stringify(c.msgs).length;
    if(out.length&&(n>ARCH_MSGS||ch>ARCH_CHARS))break;
    out.push(c);
  }
  const kept=out.slice(0,CHATS_MAX);
  if(warn&&kept.length<list.length)toast("Arşiv sınırı doldu, en eski sohbet silindi");
  return kept;
}
function cleanChat(arr,known){
  const chat=[];
  for(const m of (Array.isArray(arr)?arr:[]).slice(-CHAT_MAX)){
    if(!m||!Number.isInteger(m.id)||!["user","coach","sys"].includes(m.role)||!Number.isFinite(m.t))continue;
    const o={id:m.id,role:m.role,text:typeof m.text==="string"?m.text.slice(0,CoachLib.REPLY_MAX):"",t:m.t};
    if(m.pend===true)o.pend=true;
    if(m.kind==="plateau")o.kind=m.kind;
    if(["check","ed"].includes(m.fl))o.fl=m.fl;
    const c=m.card,state=["pending","ok","no"].includes(c&&c.state)?c.state:"pending";
    if(c&&c.kind==="log"&&Array.isArray(c.items)){const items=CoachLib.cleanItems(c.items);if(items.length)o.card=Object.assign({kind:"log",items,state,saved:c.saved===true},CoachLib.MEAL_KEYS.includes(c.meal)?{meal:c.meal}:{})}
    else if(c&&c.kind==="food"){const f=CoachLib.cleanFood({name:c.f?.n,kcal:c.f?.k,protein:c.f?.p});if(f)o.card=Object.assign({kind:"food",f,state},c.logged===true?{logged:true}:{})}
    else if(c&&c.kind==="safety"&&["emergency","check","mind","ed"].includes(c.level))o.card={kind:"safety",level:c.level};
    else if(c&&c.kind==="why"&&Array.isArray(c.items)){
      const items=c.items.filter(x=>x&&typeof x.k==="string"&&/^[a-z]{1,8}$/.test(x.k)&&typeof x.t==="string"&&x.t.trim()).slice(0,6).map(x=>({k:x.k,t:x.t.slice(0,160)}));
      if(items.length)o.card=Object.assign({kind:"why",items},c.asked===true?{asked:true}:{});
    }
    else if(c&&c.kind==="program"){const pg=CoachLib.cleanProgram(c,known);if(pg)o.card=Object.assign({kind:"program",state:c.state==="ok"?"ok":"pending"},pg)}
    else if(c&&c.kind==="menu"){const mn=CoachLib.cleanMenu({days:c.days},null,c.kcal);if(mn)o.card=Object.assign({kind:"menu",chk:(Array.isArray(c.chk)?c.chk:[]).filter(x=>typeof x==="string").map(x=>x.slice(0,60)).slice(0,100)},mn)}

    chat.push(o);
  }
  return chat;
}
/* If a button-requested menu, program or comment fails, the user message is taken back instead of staying unanswered, and it is not resent like a pending chat message. */
const cDrop=m=>{S.chat=S.chat.filter(x=>x!==m)};
/* Steps and sleep that arrive automatically from the watch (Health Connect) are not sent to the Coach: the consent text promises only steps the user entered or the phone sensor counted, and sleep when present. */
const cStep=e=>e.hc>0?(e.ph||0):(e.v||0);
/* day -> sleep minutes of the first record, undefined when that record came from Health Connect. */
const cSleepOf=()=>{const m=new Map();for(const x of Habits.sleep())if(!m.has(x.day))m.set(x.day,x.src!=="hc"?x.min:undefined);return k=>m.get(k)};
/* day -> total of val(entry) for one entry type, in a single pass (dayTotal covers plain e.v totals). */
const cDayMap=(type,val)=>{const m=new Map();for(const e of Log.all())if(e.type===type)m.set(e.day,(m.get(e.day)||0)+val(e));return k=>m.get(k)||0};
function cPush(m){const o=Object.assign({id:S.cid++,t:Date.now()},m);S.chat.push(o);if(S.chat.length>CHAT_MAX)S.chat.splice(0,S.chat.length-CHAT_MAX);return o}

/* ---- context ---- */
function cCalc(){
  const st=S.settings,w=weights(),days=Object.keys(w).sort();
  const out={trendKg:null,slope:null,tdee:null,source:"",target:null,protein:null,bmr:null,block:""};
  const trendKg=days.length?Algo.trend(w)[days[days.length-1]]:null;
  /* The brake does not depend on height, age or weigh-ins: a pregnancy or ed flag reaches the context even without a weigh-in. */
  const rk=risk(trendKg??0);out.block=rk.block;out.why=[...rk.hard,...(rk.cleared?[]:rk.soft)].join("; ");
  if(!days.length)return out;
  out.trendKg=trendKg;out.slope=Algo.slopePerWeek(w);
  const pt=Algo.protein(riskInput(out.trendKg));out.protein=pt.range;out.proteinDoc=pt.doc;
  if(st.heightCm>0&&st.age>0){
    const profile={kg:out.trendKg,cm:st.heightCm,age:st.age,sex:st.sex||"",act:st.act};
    const intake={};for(const e of Log.all())if(e.type==="food"&&e.v)intake[e.day]=(intake[e.day]||0)+e.v;
    const r=Algo.adaptiveTdee({weights:w,intake,profile});out.tdee=r.tdee;out.source=r.source;
    out.bmr=Algo.bmrMifflin(profile);
    const sg=Algo.suggestTarget({...riskInput(out.trendKg),tdee:r.tdee,bmr:out.bmr});out.target=sg?sg.kcal:null;
  }
  return out;
}
/* Coach data categories the user can switch off one by one: [key, label, detail]. The setting is "share" + key. */
const SHARE=[["Profile","Profil ve kalori hedefi","Boy, yaş aralığı, cinsiyet, hareket düzeyi ve günlük kalori hedefi"]];
const SHARE_KEYS=SHARE.map(([k])=>"share"+k),shared=k=>S.settings["share"+k]!==false;
const shareRows=()=>SHARE.map(([k,t,sub])=>swRow(`data-csh="${k}"`,shared(k),t,sub)).join("");
document.addEventListener("change",ev=>{
  const k=ev.target.dataset?.csh;if(!k)return;
  S.settings["share"+k]=ev.target.checked;save();toast(`${SHARE.find(x=>x[0]===k)[1]}: Rehber'e ${ev.target.checked?"gönderilecek":"gönderilmeyecek"}`);
});
function cData(){
  const st=S.settings,on=shared("Profile");
  return {profile:on?{cm:st.heightCm,age:st.age,sex:st.sex,act:st.act}:null,goalKcal:on&&st.kcal>0?st.kcal:null};
}
/* Only an applied log card enters the history (a rejected or pending one must not look "done"), with macros and meal. */
function cHistLog(m){
  const c=m.card;
  return c&&c.kind==="log"&&c.state==="ok"?c.items.slice(0,4).map(i=>({type:i.type,text:i.text,name:i.name,kcal:i.kcal,p:i.p,c:i.c,f:i.f,meal:i.meal||c.meal,min:i.min,ml:i.ml,kg:i.kg})):[];
}
/* Only masked text goes to the model; the tag table stays in the array's .pii field and the reply is unmasked locally in cAsk.
   Last gate: every body sent to a provider passes here; everything except the fixed rules text is masked (idempotent). Food names are exempt from the name filter ("annem Salata"). */
let piiInit=false;
const gate=m=>{if(!piiInit){PiiLib.deny(FOODS.map(f=>f.n));piiInit=true}return PiiLib.maskMsgs(m,CoachLib.SYSTEM)};
function cMessages(extraUser,extraSys,noHist){
  gate([]);
  const map={},mk=s=>PiiLib.mask(s,map).text;
  const sys=CoachLib.SYSTEM+mk((extraSys?"\n\nNOT: "+extraSys:"")+"\n\n"+CoachLib.contextText(cData()));
  const hist=noHist?[]:S.chat.filter(m=>m.role!=="sys"&&m.text).slice(-HIST_N).map(m=>({role:m.role==="user"?"user":"assistant",content:m.role==="user"?mk(m.text).slice(0,300):JSON.stringify({reply:mk(m.text).slice(0,260),log:cHistLog(m).map(i=>({...i,text:i.text&&mk(i.text),name:i.name&&mk(i.name)}))})}));
  const msgs=[{role:"system",content:sys}].concat(hist);
  if(extraUser)msgs.push({role:"user",content:mk(extraUser)});
  msgs.pii=map;
  return msgs;
}

/* ---- provider chain ---- */
const USAGE_KEY="nw_state_usage";
const usageStore=()=>{try{return JSON.parse(lsGet(USAGE_KEY))}catch(e){return null}};
function trackUsage(p,j,ant){
  const u=CoachLib.usageOf(j,ant);
  if(u)lsSet(USAGE_KEY,JSON.stringify(CoachLib.usageAdd(usageStore(),dayKey(),p.id+"|"+p.model,u)));
}
function usageText(){
  const {n,tok}=CoachLib.usageSum(usageStore(),dayKey());
  return `Rehber kullanımı (son 30 gün): ${n} istek, ~${fint(tok)} jeton`;
}
const httpError=async r=>{const e=new Error("HTTP "+r.status);e.status=r.status;try{e.body=(await r.text()).slice(0,600)}catch(x){}return e};
/* o.probe: setup check. HTTP 200 with a valid body is enough; a thinking model may return without text at the limit (content null, reasoning_content set).
   In a chat, if the text is empty and the limit was hit (thinking ate the budget), it is asked once more with three times the limit. */
async function callProvider(p,key,messages,maxTokens=700,o={}){
  const ms=Math.min(o.ms||40000,o.until?o.until-Date.now():Infinity);
  if(ms<=0){const e=new Error("Süre doldu");e.kind="time";throw e}
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),ms);
  try{
    const ant=p.id==="anthropic",r=await NetLog.fetch("chat",p.base.replace(/\/+$/,"")+(ant?"/messages":"/chat/completions"),{method:"POST",signal:ctl.signal,headers:{"Content-Type":"application/json",...pHeaders(p,key)},body:JSON.stringify(pBody(p,gate(messages),maxTokens))});
    if(!r.ok)throw await httpError(r);
    const j=await r.json();trackUsage(p,j,ant);const c=j&&j.choices&&j.choices[0],t=ant?(j&&Array.isArray(j.content)?j.content.filter(b=>b&&b.type==="text").map(b=>b.text).join(""):""):c&&c.message&&c.message.content;
    if(o.probe&&(ant?Array.isArray(j&&j.content):!!c))return "";
    const has=typeof t==="string"&&!!t.trim(),cut=ant?j&&j.stop_reason==="max_tokens":c&&c.finish_reason==="length";
    if(has&&!(cut&&!o.retried&&CoachLib.parse(t).broken))return t;
    if(!o.retried&&cut){clearTimeout(to);try{return await callProvider(p,key,messages,maxTokens*3,Object.assign({},o,{retried:true}))}catch(e){if(has)return t;throw e}}
    const e=new Error("Boş yanıt");e.kind="empty";throw e;
  }finally{clearTimeout(to)}
}
const MODELS_MS=15000;
/* The model list can hang like any request: it gets its own timeout so the setup sheet never stays busy. */
async function fetchModels(p,key){
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),MODELS_MS);
  try{
    const r=await NetLog.fetch("models",p.base.replace(/\/+$/,"")+"/models"+(p.id==="anthropic"?"?limit=1000":""),{headers:pHeaders(p,key),signal:ctl.signal});
    if(!r.ok)throw await httpError(r);
    return CoachLib.parseModels(await r.json());
  }finally{clearTimeout(to)}
}
/* Request body per provider. With thinking models the thinking tokens eat from the reply limit, so low effort and extra room are given.
   Current OpenAI models do not accept max_tokens. Anthropic: the system text is a separate field and the first message must be the user's; Haiku 4.5 takes temperature, Sonnet/Opus 5.x do not (they take effort). */
/* The fixed rules text is cached (a block separate from the variable context); below the size threshold caching is harmless. */
const cacheSys=sys=>sys.startsWith(CoachLib.SYSTEM)&&sys.length>CoachLib.SYSTEM.length?[{type:"text",text:CoachLib.SYSTEM,cache_control:{type:"ephemeral"}},{type:"text",text:sys.slice(CoachLib.SYSTEM.length)}]:sys;
function pBody(p,messages,maxTokens){
  if(p.id==="openai")return {model:p.model,messages,max_completion_tokens:maxTokens*3,reasoning_effort:"low"};
  if(p.id==="anthropic"){
    const sys=messages.filter(m=>m.role==="system").map(m=>m.content).join("\n\n"),ms=messages.filter(m=>m.role!=="system");
    while(ms.length&&ms[0].role!=="user")ms.shift();
    const b={model:p.model,max_tokens:maxTokens,messages:ms.length?ms:[{role:"user",content:"Merhaba"}]};if(sys)b.system=cacheSys(sys);
    if(/haiku/.test(p.model))b.temperature=0.3;else{b.output_config={effort:"low"};b.max_tokens=maxTokens+2000}
    return b;
  }
  const b={model:p.model,messages,temperature:0.3,max_tokens:maxTokens};
  if(p.id==="gemini")b.reasoning_effort="low"; // Gemini 3 cannot turn thinking off
  return b;
}
const errOf=e=>{const kind=(e&&e.kind)||CoachLib.errKind(e&&e.status,e&&e.body,e&&e.name);return {kind,text:CoachLib.errText(kind,e&&e.status)}};
const COOL_MS={limit:60000,time:30000,key:600000,quota:600000,model:120000,down:10000,net:10000,empty:10000};
function pFail(id,e){
  const {kind,text}=errOf(e);
  if(COOL_MS[kind])cool[id]=Date.now()+COOL_MS[kind];
  pstat[id]={s:kind==="limit"?"limit":kind==="key"?"key":"err",t:Date.now(),m:text};
  return text;
}
const keyed=()=>S.providers.filter(p=>p.on&&p.health&&getKeys()[p.id]);
const usable=()=>keyed().filter(p=>!(cool[p.id]>=Date.now()));
const hasKey=()=>keyed().length>0;
/* Total time budget per request: the chain, the length retry and the re-ask share it. */
const BUDGET=60000,custAsked=new Set();
const isCustom=p=>!defProviders().some(d=>d.id===p.id);
const hostOf=p=>{try{return new URL(p.base).host}catch(e){return p.base}};
/* The free tier (Gemini) asks on every send, a custom provider once per session; a re-ask of the same send does not ask again (conf).
   With the preview on, the first send shows the outgoing text and this warning in one window, and one approval covers both (conf.prev). */
async function sendOk(p,conf,msgs){
  const cust=isCustom(p),k=p.id+"|"+p.base,need=p.confirm||(cust&&!custAsked.has(k));
  const warn=need?(cust?`${p.name} senin eklediğin özel bir sağlayıcı (${hostOf(p)}). Sağlık verilerin ve anahtarın bu sunucuya gider; güvenmediğin bir adrese gönderme.`:`${p.name} ücretsiz katmanında istemler ürün geliştirmek için kullanılabilir. Sunucuları yurt dışında olan bu sağlayıcıya sağlık verileri gider.`):"";
  if(conf.prev===undefined&&S.settings.piiPrev){
    conf.prev=await cPreview(msgs,p,warn);
    if(conf.prev&&need){conf[p.id]=true;if(cust)custAsked.add(k)}
  }
  if(conf.prev===false)return false;
  if(!need)return true;
  if(conf[p.id]===undefined){
    conf[p.id]=await confirmSheet({title:"Gönderilsin mi?",body:warn+" Göndermeyi onaylıyor musun?",ok:"Gönder"});
    if(conf[p.id]&&cust)custAsked.add(k);
  }
  return conf[p.id];
}
function cPreview(msgs,p,warn){
  return new Promise(res=>{
    const n=Object.keys(msgs.pii||{}).length;
    openSheet(`<h3>Rehber'e giden metin</h3><p class="mut sm">${esc(p.name)} sağlayıcısına tam olarak aşağıdaki metin gider.${n?` Kimlik bilgisi gibi duran ${n} parça maskelendi.`:""}</p>${warn?`<div class="banner"><p class="m0">${esc(warn)}</p></div>`:""}<pre class="outbox" tabindex="0" role="region" aria-label="Giden metin">${esc(msgs.map(m=>`[${m.role==="user"?"sen":m.role==="system"?"sistem":"rehber"}]\n${m.content}`).join("\n\n"))}</pre><div class="two"><button class="btn" data-c="pvok">Gönder</button><button class="btn ghost" data-c="pvno">İptal</button></div>`);
    sheetEnd=res;
  });
}
const piiTold=new Set();
function piiToast(msgs){
  const nw=Object.values(msgs.pii||{}).filter(v=>!piiTold.has(v.toLowerCase()));
  nw.forEach(v=>piiTold.add(v.toLowerCase()));
  if(nw.length)toast(`Kimlik bilgisi gibi duran ${nw.length} parça maskelendi`);
}
async function cAsk(messages,maxTokens,o={}){
  if(!coachOn())throw new Error("consent");
  messages=gate(messages);
  const keys=getKeys(),list=usable(),until=o.until||Date.now()+BUDGET,conf=o.conf||{};
  if(!list.length)throw new Error(hasKey()?"fail":"none");
  let declined=false,tried=false;
  for(const p of list){
    if(Date.now()>=until)break;
    if(!await sendOk(p,conf,messages)){declined=true;continue}
    piiToast(messages);
    tried=true;const t0=Date.now();
    try{
      const text=PiiLib.unmask(await callProvider(p,keys[p.id],messages,maxTokens,{until}),messages.pii);
      pstat[p.id]={s:"ok",t:Date.now(),ms:Date.now()-t0};return {text,provider:p};
    }catch(e){pFail(p.id,e)}
  }
  throw new Error(declined&&!tried?"declined":"fail");
}

/* ---- chat flow ---- */
function cSend(text){
  text=String(text||"").trim().slice(0,600);if(!text)return;
  const fl=CoachLib.redFlag(text),m=cPush({role:"user",text,pend:true});
  if(fl==="ed")setRisk("ed");
  {const pg=CoachLib.pregnant(text);if(pg)setRisk(pg)}
  if(fl){
    cPush({role:"coach",text:"",card:{kind:"safety",level:fl}});
    if(fl==="emergency"||fl==="mind")m.pend=false;else m.fl=fl;
  }
  save();render();cFlush();
}
/* An eating-disorder or pregnancy sign seen in a chat is a permanent brake: a new chat or a deletion does not lift it (riskInput reads it). */
/* If the health note holds a severe sign (self-harm, emergency symptom), a safety card is shown in the chat. */
function cNoteCheck(t=S.settings.healthNote){
  const f=CoachLib.redFlag(t),preg=CoachLib.pregnant(t);
  if(f==="mind"||f==="emergency"){cPush({role:"coach",text:"",card:{kind:"safety",level:f}});toast("Notunda bir sağlık uyarısı işareti var, Rehber sekmesine bak")}
  if(f==="ed")setRisk("ed");
  if(preg)setRisk(preg);
  return f||preg;
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
    const said=pend[pend.length-1].text,act=x=>CoachLib.cleanItems(x.log).length||x.food;
    /* A single re-ask: a correct JSON is always accepted; if both are broken, the first reply that looks complete (or the "reply incomplete" message) is shown. */
    if(!fl&&(o.plain||(CoachLib.reported(said)&&!act(o)))&&ask.until-Date.now()>8000){
      try{
        const r2=await cAsk(cMessages(null,"Önceki yanıt kurala uymadı. Yalnızca tek bir JSON nesnesi ver. Kullanıcı yediğini, içtiğini, tartıldığını ya da spor yaptığını yazdıysa bunu log listesine ekle (food: kcal ve makrolar, exercise: min, name, kcal)."),undefined,ask),o2=CoachLib.parse(r2.text);
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
function cReply(o){
  const items=CoachLib.cleanItems(o.log),msg={role:"coach",text:o.reply||"Tamam."};
  if(items.length)msg.card={kind:"log",items,state:"pending"};
  cPush(msg);
  const fd=CoachLib.cleanFood(o.food);
  if(fd&&!items.length)cPush({role:"coach",text:"",card:{kind:"food",f:fd,state:"pending"}});
  if(o.flag==="safety")cPush({role:"coach",text:"",card:{kind:"safety",level:"check"}});
}
const mealNow=()=>LogLib.mealOf({time:cTime(Date.now())});
const cardMeal=c=>c.meal||(c.items.find(i=>i.meal)||{}).meal||mealNow();
function cApplyLog(id,el){
  const m=S.chat.find(x=>x.id===id);if(!m||!m.card||m.card.kind!=="log"||m.card.state!=="pending")return;
  lReadK(m.card,el);
  /* Today's foods go through the menu's "add to today" path (addFoods: nutrition values, meal, Undo); yesterday's food and other records are added directly. Undo reopens the card. */
  const c=m.card,ml=cardMeal(c),ids=[],foods=[];
  for(const it of c.items){
    const day=it.day==="yesterday"?keyOff(-1):dayKey(),y=it.type==="food";
    if(y&&day===dayKey()){foods.push(LogLib.copyNutr(it,{text:it.text||"Öğün",v:it.kcal,meal:ml}));continue}
    const e=y?LogLib.copyNutr(it,add("food",it.kcal,it.text||"Öğün",day)):it.type==="water"?add("water",it.ml,"",day):it.type==="weight"?add("weight",it.kg,"",day):it.type==="exercise"?add("exercise",it.min,it.name,day):add("note",null,it.text,day);
    if(y)e.meal=ml;if(it.type==="exercise"){const k=spKcal(it).k;if(k!=null)e.kcal=k}ids.push(e.id);
  }
  c.state="ok";const n=foods.length+ids.length,undo=()=>{Log.remove(e=>ids.includes(e.id));c.state="pending"};
  if(foods.length)return addFoods(foods,dayKey(),`${n} kayıt günlüğe eklendi`,undo);
  save();render();toast(`${n} kayıt eklendi`,()=>{undo();save();render()});
}
/* Exercise calories use the app's MET calculation (net of resting, the same formula as the quick exercise log). A Coach estimate more than half off triggers a warning.
   Without a weight, the Coach estimate is capped at 15 kcal per minute. */
function spKcal(it){
  const app=Algo.netKcal(CoachLib.sportMet(it.name),motionKg(),it.min);
  if(app!=null)return {k:app,off:it.kcal!=null&&Math.abs(it.kcal-app)>app*0.5};
  return {k:it.kcal!=null?Math.min(it.kcal,it.min*15):null,off:false};
}
/* Corrections typed in the calorie boxes are written to the card (before removing an item or adding the card). */
function lReadK(c,el){
  const box=el.closest(".lcard");if(!box)return;
  c.items.forEach((it,i)=>{if(it.type==="food"){const inp=box.querySelector(`[data-ck="${i}"]`);if(inp){const v=num(inp.value,true);it.kcal=isNaN(v)||v<0?null:Math.min(v,5000)}}});
}

/* ---- "why did I not lose weight this week": local factors, optional Coach comment ---- */
/* The question and the plateau go only to a user who has a weight-loss goal, is not losing weight with enough weigh-ins in the last 28 days (at least 3, spread over 14 days) and has no calorie-deficit block (age, low weight, health note, eating-disorder sign). */
function lossAsk(){
  const st=S.settings,w=weights(),days=Object.keys(w).sort();
  if(!days.length)return false;
  const tk=Algo.trend(w)[days[days.length-1]],g=goalWeight(tk);
  return g>0&&g<tk-0.5&&Algo.lossKnown(w)&&!Algo.isLosing(w)&&!risk(tk).block;
}
function cWhy(){
  if(!lossAsk())return;
  const kcalOf=dayTotal("food"),waterOf=dayTotal("water"),stepsOf=cDayMap("steps",cStep),sleepOf=cSleepOf(),days=[];
  for(let i=21;i>=0;i--){const k=keyOff(-i);days.push({kcal:kcalOf(k),water:waterOf(k),ad:stepsOf(k),sl:sleepOf(k)})}
  const items=InsightLib.weekWhy({days,goalKcal:S.settings.kcal,goalWater:S.settings.waterMl,weights:weights(),today:dayKey()});
  cPush({role:"user",text:"Bu haftaya birlikte bakalım"});cPush({role:"coach",text:"",card:{kind:"why",items}});
  tab="coach";save();render();
}
/* ---- program from the Coach ---- */
let progOpt={d:3,q:"Salon",m:45,l:"Başlangıç"};
function cCatalog(o){const c=CoachLib.catalog(EXDB,o,CORE_EX);return {ids:c.map(e=>e.id),text:CoachLib.catalogText(c)}}
function cProgSheet(){
  const o=progOpt,g=(k,vals,lbl=v=>v)=>`<div class="chips">${vals.map(v=>`<button class="chip" data-c="po:${k}:${v}" aria-pressed="${o[k]===v}">${lbl(v)}</button>`).join("")}</div>`;
  openSheet(`<h3>Rehber'den program iste</h3><div class="lbl">Haftada gün</div>${g("d",[2,3,4,5,6])}<div class="lbl">Ekipman</div>${g("q",["Salon","Ev tipi","Ağırlıksız"])}<div class="lbl">Seans süresi</div>${g("m",[30,45,60],v=>v+" dk")}<div class="lbl">Seviye</div>${g("l",["Başlangıç","Orta","İleri"])}
  <p class="hint">Rehber yalnız kütüphanedeki egzersizlerden seçer. İstek ve profil bilgin sağlayıcıya gönderilir.</p><button class="btn" data-c="progask">İste</button>`);
}
async function cProgram(o){
  if(busy||coachBlocked())return;
  const rk=risk();
  if(rk.ed||rk.pregnant||rk.nursing)return toast((rk.ed?"Yeme düzeniyle ilgili işaret gördüm":rk.pregnant?"Hamilelik işareti var":"Emzirme işareti var")+"; program önermiyorum, hekimine danış");
  const {ids,text}=cCatalog(o);
  const msgs=cMessages(`Haftada ${o.d} gün, seans ${o.m} dakika, ekipman ${o.q}, seviye ${o.l} için antrenman programı hazırla. "program" alanını doldur, reply'da kısaca anlat.`,"KATALOG (bölge: kimlik|ad, ...):\n"+text,true),um=cPush({role:"user",text:`Program iste: haftada ${o.d} gün, ${o.m} dk, ${o.q}, ${o.l}`});
  return cRun(async()=>{
    const r=await cAsk(msgs,900);
    const p=CoachLib.parse(r.text),pg=CoachLib.cleanProgram(p.program,ids,o.d);
    if(pg)cPush({role:"coach",text:p.reply,card:Object.assign({kind:"program",state:"pending"},pg)});
    else{cDrop(um);toast("Program okunamadı, tekrar dene")}
  },()=>cDrop(um));
}

/* ---- weekly menu from the Coach ---- */
let menuNote="";
const MENU_CAT_MAX=60,MENU_CAT_MY=20,MENU_CAT_FAV=10,MENU_CAT_TPL=8;
/* Catalog: my foods first, then favorites, templates, and the remaining room from the built-in list (spread over the categories). At most 60 lines in total. */
function cMenuCat(){
  const cat={},lines=[],clean=t=>CoachLib.oneLine(String(t).replace(/[|]/g," "),30),nn=v=>v==null?null:v;
  const add=(id,n,k,p,c,f,g,a)=>{cat[id]={n:clean(n),k,p,c,f,g,a};lines.push(`${id}|${cat[id].n}${g?" "+g+" g":""}|${Math.round(k)}|${p==null?"?":Math.round(p)}`)};
  const per=(id,f,g)=>{const x=v=>v==null?null:v*g/100,m=f.u&&f.u[0][0].match(/^(\d+(?:[.,]\d+)?)\s*adet/);add(id,f.n,f.k*g/100,x(f.p),x(f.c),x(f.f),Math.round(g),m?+m[1].replace(",","."):null)};
  Nutrition.my().slice(0,MENU_CAT_MY).forEach((f,i)=>f.u?per("m"+i,f,f.u[0][1]):add("m"+i,f.n,f.k,nn(f.p),nn(f.c),nn(f.f),null,null));
  Nutrition.fav().slice(0,MENU_CAT_FAV).forEach((x,i)=>{if(x.v!=null)add("f"+i,x.text,x.v,nn(x.p),nn(x.c),nn(x.f),null,null)});
  Nutrition.tpl().slice(0,MENU_CAT_TPL).forEach((t,i)=>{if(t.items.every(x=>x.v!=null))add("t"+i,"Şablon: "+t.n,t.items.reduce((a,x)=>a+x.v,0),t.items.every(x=>x.p!=null)?t.items.reduce((a,x)=>a+x.p,0):null,null,null,null,null)});
  const ok=[...FOODS.slice(0,FOOD_CORE).keys()].filter(i=>FOODS[i].k<450&&!["Şeker","Kola","Meyve suyu"].includes(FOODS[i].n)),n=Math.min(Math.max(0,MENU_CAT_MAX-lines.length),ok.length);
  for(let j=0;j<n;j++){const i=ok[Math.floor(j*ok.length/n)];per("b"+i,FOODS[i],FOODS[i].u[0][1])}
  return {cat,text:lines.join("\n")};
}
/* Target: with a calorie-deficit block and a target below maintenance, maintenance is used (the rule of cReply); with an eating-disorder sign or unknown maintenance there is no menu. */
function cMenuPlan(){
  const st=S.settings,c=cCalc(),goal=st.kcal>0?st.kcal:c.target;
  if(!(goal>0))return {why:"Önce Ayarlar > Profil ve hedefler'den günlük kalori hedefi belirle"};
  if(risk(c.trendKg).ed)return {why:"Yeme düzeniyle ilgili işaret gördüm; kısıtlayıcı menü önermiyorum, bir uzmana danış"};
  const block=c.block;
  let kcal=goal,held=false;
  if(block){
    if(!c.tdee)return {why:block+". Menü hedefi hesaplanamadı; hekimine ya da diyetisyene danış"};
    if(goal<c.tdee-50){kcal=Math.round(c.tdee/10)*10;held=true}
  }
  const cl=CoachLib.clampKcal(kcal,{tdee:c.tdee,bmr:c.bmr,sex:S.settings.sex});
  return {kcal:cl?cl.kcal:kcal,protein:c.protein,pdoc:c.proteinDoc,held,block};
}
function cMenuSheet(){
  const pl=cMenuPlan();
  openSheet(`<h3>Haftalık menü öner</h3>${pl.why?`<p class="mut">${esc(pl.why)}</p>`:`<p class="mut sm">Hedef: günde ~${pl.kcal} kcal${pl.protein?`, protein ${pl.protein[0]}-${pl.protein[1]} g`:pl.pdoc?", protein hedefini hekiminle belirle":""}. ${Algo.PROTEIN_NOTE}${pl.held?` ${esc(pl.block)}; menü bakım düzeyinde hazırlanır, hekimine danış.`:""}</p>`}
  <label class="lbl" for="mnote">Kısıt ya da alerji (isteğe bağlı)</label><textarea class="in" id="mnote" maxlength="200" placeholder="Örneğin: fıstık alerjisi, domuz eti yemem">${esc(menuNote)}</textarea>
  <p class="hint">Rehber yalnız Benim besinlerim, favorilerin, şablonların ve yerleşik listeden seçer. Tıbbi diyet ya da hastalık menüsü değildir; hastalığın varsa diyetisyenine danış. Yazdığın not, profilin ve bilgin sağlayıcıya gönderilir.</p>
  <div class="two"><button class="btn" data-c="menuask"${pl.why||!coachReady()?" disabled":""}>Rehber'den iste</button><button class="btn ghost" data-c="menulocal"${pl.why?" disabled":""}>Cihazda oluştur</button></div>
  <p class="hint">Cihazda oluştur: anahtar ve izin gerekmez, hiçbir şey gönderilmez. Notta yalnız fıstık, fındık, ceviz, badem, süt, yumurta, gluten, balık ve vejetaryen tanınır; içerikleri yine de kendin kontrol et.</p>`);
}
/* A connection error is one sentence; provider detail only inside the ⓘ on the Coach screen. */
const CNET="Rehber'e şu an ulaşılamıyor. Bağlantını kontrol et.";
const coachReady=()=>S.settings.consent&&usable().length>0;
/* A button-requested Coach job: refuse when consent or a key is missing. Returns true when blocked. */
function coachBlocked(){
  if(!coachOn()){tab="coach";render();toast("Önce Rehber'de veri paylaşımını kabul et");return true}
  if(!usable().length){toast("Rehber için anahtar gerekli: Ayarlar > Rehber");return true}
  return false;
}
/* Runs a button-requested Coach job with the busy flags; when it fails, undo() takes back the optimistic user message or card state. */
async function cRun(job,undo){
  tab="coach";busy=typing=true;render();
  try{await job();offline=null}
  catch(e){undo();toast(e.message==="declined"?"Gönderim onaylanmadı":CNET)}
  finally{busy=typing=false;save();render()}
}
/* If the note holds a pregnancy or health sign, no menu is made (shared by the Coach request and on-device creation). */
function menuNoteStop(note){
  const nf=cNoteCheck(note);
  if(nf){save();render();toast(nf==="preg"||nf==="nurs"?`Notunda ${nf==="preg"?"hamilelik":"emzirme"} işareti var, menü hazırlamıyorum; hekimine ya da diyetisyenine danış`:"Notunda sağlık uyarısı işareti var, menü hazırlamıyorum; hekimine danış")}
  return !!nf;
}
/* Key-free menu: rule-based, on the device; the plan (brake, maintenance level) is the same cMenuPlan as the Coach menu. */
function cMenuLocal(){
  const pl=cMenuPlan(),note=CoachLib.oneLine(menuNote,200);
  if(menuNoteStop(note))return;
  if(pl.why)return toast(pl.why);
  const r=MenuLocal.make({kcal:pl.kcal,protein:pl.protein,note}),mn=r&&CoachLib.cleanMenu({days:r.days},null,pl.kcal);
  if(!mn)return toast("Kısıtlarına uyan yeterince yemek bulamadım, notu sadeleştir");
  tab="coach";cPush({role:"coach",text:"",card:Object.assign({kind:"menu",chk:[]},mn)});save();render();
  toast(r.unk?"Notundaki kısıtı tanımadım, menüye uygulanmadı":"Menü cihazda hazırlandı");
}
async function cMenu(){
  if(busy||coachBlocked())return;
  const pl=cMenuPlan(),note=CoachLib.oneLine(menuNote,200);
  if(menuNoteStop(note))return;
  if(pl.why)return toast(pl.why);
  const {cat,text}=cMenuCat(),p=pl.protein;
  const msgs=cMessages(`7 günlük menü hazırla. "menu" alanını doldur, reply'da en fazla 2 cümle yaz.`,`MENÜ İSTEĞİ. Hedef günlük ${pl.kcal} kcal (gün toplamı ±%10), ${p?`protein ${p[0]}-${p[1]} g/gün`:pl.pdoc?"protein hedefi hekimle belirlenmeli, yüksek proteinli menü kurma":"protein yeterli olsun"}. YALNIZ KATALOG kimliklerini kullan, listede olmayan besin ekleme. Günde 3-6 öğün, öğün anahtarı: kah, ogl, aks, atis. Katalogdaki kcal ve protein BİR porsiyon içindir; q porsiyon çarpanıdır (0.25-4).${note?`\nKullanıcının kısıt/alerji notu (uy): ${note}`:""}\nTıbbi diyet ya da hastalık menüsü yazma.${pl.block?` Kalori açığı kurma.`:""}\nÇıktı JSON: {"reply":"...","menu":{"days":[{"n":"Pazartesi","meals":[{"m":"breakfast","i":[["kimlik",1]]}]}]}}\nKATALOG (kimlik|ad|kcal|protein):\n${text}`,true),um=cPush({role:"user",text:`Haftalık menü iste: günde ~${pl.kcal} kcal${note?`, not: ${note}`:""}`});
  return cRun(async()=>{
    const r=await cAsk(msgs,2400);
    const o=CoachLib.parse(r.text),mn=CoachLib.cleanMenu(o.menu,cat,pl.kcal);
    if(mn)cPush({role:"coach",text:o.reply,card:Object.assign({kind:"menu",chk:[]},mn)});
    else{cDrop(um);toast("Menü okunamadı, tekrar dene")}
  },()=>cDrop(um));
}
const menuCard=id=>{const m=S.chat.find(x=>x.id===id);return m&&m.card&&m.card.kind==="menu"?m.card:null};
const mealLbl=k=>(LogLib.MEALS.find(x=>x[0]===k)||[0,"Öğün"])[1];
const qTxt=q=>q===1?"":" × "+String(q).replace(".",",");
function menuEntries(d){return d.meals.flatMap(b=>b.items.map(i=>LogLib.copyNutr(i,{text:i.n+qTxt(i.q),v:i.k,meal:b.m})))}
/* Dishes are split into the recipe and meal parts of the food list (FOODS[].parts). */
let foodParts=null;
const shopOf=c=>{if(!foodParts)foodParts=new Map(FOODS.filter(f=>f.parts).map(f=>[f.n,f.parts]));return CoachLib.shopList(c,n=>foodParts.get(n))};
function cShopText(c){const ch=new Set(c.chk);let g="";return "Alışveriş listesi"+shopOf(c).map(x=>`${x.c!==g?`\n\n${g=x.c}`:""}\n${ch.has(x.n)?"[x]":"[ ]"} ${x.n}: ${x.t}`).join("")}
function cShop(id){
  const c=menuCard(id);if(!c)return;
  const L=shopOf(c),ch=new Set(c.chk);
  openSheet(`<h3>Alışveriş listesi</h3><p class="mut sm">Menüdeki yemekler ürünlere bölündü; miktarlar porsiyonlara göre yaklaşıktır. Liste bu telefonda hesaplandı, hiçbir yere gönderilmedi.</p>${L.map((x,i)=>`${x.c!==(L[i-1]||{}).c?`<h4 class="grp">${x.c}</h4>`:""}<button class="prow shop" data-c="shopchk:${id}:${i}" aria-pressed="${ch.has(x.n)}"><span class="ck" aria-hidden="true">${Icons.svg("check")}</span><span class="grow"><b>${esc(x.n)}</b><span class="mut sm num">${esc(x.t)}</span></span></button>`).join("")}
  <div class="mt-3 two"><button class="btn ghost" data-c="shopcopy:${id}">Kopyala</button><button class="btn ghost" data-c="shopshare:${id}">Paylaş</button></div>`);
}

/* The plateau question is local: independent of consent and providers, it makes no AI call; "Bak" opens the local card. */
function cPlateauCheck(){
  const st=S.settings,t=dayKey();
  if((st.lastPlateau&&Algo.dayNum(t)-Algo.dayNum(st.lastPlateau)<14)||!lossAsk())return;
  const p=InsightLib.plateau(weights(),t);if(!p.ok)return;
  st.lastPlateau=t;cPush({role:"coach",kind:"plateau",text:`Son ${Math.round(p.days/7)} haftadır kilon yerinde duruyor. İstersen birlikte bakabiliriz.`});save();render();
}

/* ---- screen ---- */
function cTime(t){const d=new Date(t);return `${pad(d.getHours())}:${pad(d.getMinutes())}`}
function cSafety(level){
  const T={
    emergency:["Hemen yardım al","Bu belirtiler acil olabilir. Beklemeden 112'yi ara ya da en yakın acile git.",true],
    check:["Bunu bir doktora danış","Bu belirti hekime danışılması gereken bir konu; nedenini tahmin edemem. Geçmezse ya da çarpıntı olursa bugün bir hekime başvur. Bayılma, göğüs ağrısı veya nefes darlığında hemen 112'yi ara.",true],
    mind:["Yalnız değilsin","Kendine zarar vermeyi düşünüyorsan şimdi 112'yi ara ya da yanındaki birine söyle. Güvende olman her şeyden önemli.",true],
    ed:["Bunu konuşmak iyi bir adım","Yemekle ilgili zorlanmalar için bir hekim, psikolog ya da diyetisyen desteği çok değerli. Bu konuda kalori kısıtlaması önermem.",false]
  }[level];
  return `<div class="scard"><b>${T[0]}</b><p>${T[1]}</p><div class="srow2">${T[2]?`<a class="btn info" href="tel:112">112'yi ara</a>`:""}<button class="btn ghost" data-c="dismiss">Anladım</button></div><div class="mut sm">Yapay zekâ rehberi hekim değildir, tanı koymaz.</div></div>`;
}
function cCard(m){
  const c=m.card;if(!c)return "";
  if(c.kind==="safety")return cSafety(c.level);
  if(c.kind==="program")return `<div class="card lcard"><div class="lhead"><b>${esc(c.name)}</b><span class="tag">${c.days.length} gün</span></div>${c.days.map(d=>`<div class="lrow"><span class="grow"><b>${esc(d.n)}</b><span class="mut sm">${esc(d.ex.map(i=>gEx(i).n).join(", "))}</span></span></div>`).join("")}
    ${c.state==="pending"?`<div class="bgrid mt-3"><button class="btn" data-c="progadd:${m.id}">Şablon olarak ekle</button></div>`:`<p class="mut sm">${c.days.length} şablon Salon'a eklendi</p>`}<p class="hint">${gPgNote}</p></div>`;
  if(c.kind==="menu"){
    /* Only today's day (the first day if no name matches) starts open; one action per day, the options are in a separate sheet. */
    const td=WEEKDAYS[new Date().getDay()],open=Math.max(0,c.days.findIndex(d=>d.n===td));
    return `<div class="card lcard"><div class="lhead"><b>Haftalık menü</b><span class="forecast">Tahmin</span></div><p class="mut sm">Hedef ${c.kcal?"~"+c.kcal+" kcal/gün":"belirtilmedi"}. Tıbbi diyet ya da hastalık menüsü değildir.</p>
    ${c.days.map((d,di)=>`<details class="acc mday"${di===open?" open":""}><summary class="lhead"><b class="grow">${esc(d.n)}</b><span class="num mut">~${d.k} kcal</span></summary>${d.off?`<p class="mut sm">Hedefin %15'inden fazla sapıyor</p>`:""}${d.meals.map(b=>`<div class="lrow"><span class="grow"><b>${mealLbl(b.m)}</b><span class="mut sm">${esc(b.items.map(i=>i.n+(i.q===1?"":` (${String(i.q).replace(".",",")} porsiyon)`)).join(", "))}</span></span><span class="num mut sm nw">~${b.items.reduce((s,i)=>s+i.k,0)} kcal</span></div>`).join("")}
    <button class="mt-2 btn ghost" data-c="menuday:${m.id}:${di}">Bu günü kullan</button></details>`).join("")}
    <div class="bgrid mt-3"><button class="btn" data-c="shop:${m.id}">Alışveriş listesi</button></div></div>`;
  }
  if(c.kind==="why")return `<div class="card lcard"><b>Son 7 gün</b>${c.items.map(x=>`<p class="sm">${esc(x.t)}</p>`).join("")}<p class="mut sm">Telefonda hesaplandı, hiçbir yere gönderilmedi.</p></div>`;
  if(c.kind==="food"){
    return `<div class="card lcard"><div class="lhead"><b>${esc(c.f.n)}</b><span class="forecast">Tahmin</span></div><div class="lrow"><span class="grow mut sm">${c.f.p!=null?`Protein ~${Math.round(c.f.p)} g`:"1 porsiyon"}</span><span class="num b7">~${c.f.k} kcal</span></div>
    ${c.logged?`<p class="mut sm">Günlüğe eklendi</p>`:`<div class="bgrid mt-3"><button class="btn" data-c="fooddiary:${m.id}">Günlüğe ekle</button></div>`}
    ${c.state==="pending"?`<div class="bgrid mt-3"><button class="btn ghost" data-c="addfood:${m.id}">Listeme ekle</button><button class="btn ghost" data-c="nofood:${m.id}">Şimdi değil</button></div>`:`<p class="mut sm">${c.state==="ok"?"Besin listene eklendi":"Atlandı"}</p>`}</div>`;
  }
  const rows=c.items.map((it,i)=>{
    const lbl=(it.type==="food"?esc(it.text||"Öğün"):it.type==="water"?"Su":it.type==="weight"?"Tartı":it.type==="exercise"?esc(it.name):"Not")+(it.day==="yesterday"?" · dün":"");
    const val=it.type==="food"?(c.state==="pending"?`<span class="num">~<input class="kin num" data-ck="${i}" inputmode="numeric" aria-label="${esc(it.text)} kcal" value="${it.kcal==null?"":Math.round(it.kcal)}" placeholder="kcal"> kcal</span>`:`<span class="num">${it.kcal==null?"":"~"+Math.round(it.kcal)+" kcal"}</span>`)
      :it.type==="water"?`<span class="num">${it.ml} ml</span>`:it.type==="weight"?`<span class="num">${dw(it.kg)} ${wlab()}</span>`:it.type==="exercise"?`<span class="num">${it.min} dk${spKcal(it).k!=null?` · ~${spKcal(it).k} kcal`:""}</span>`:`<span class="mut sm">${esc(it.text.slice(0,40))}</span>`;
    const y=it.type==="food",mac=y?[it.g?it.g+" g":"",it.p!=null?`P ${Math.round(it.p)}`:"",it.c!=null?`K ${Math.round(it.c)}`:"",it.f!=null?`Y ${Math.round(it.f)}`:""].filter(Boolean).join(" · "):"";
    return `<div class="lrow"><span class="grow"><b>${lbl}</b>${mac?`<span class="mut sm">${mac}</span>`:""}${y&&CoachLib.macroOff(it)?`<span class="mut sm">Kalori makrolarla tutmuyor, kontrol et</span>`:""}${it.type==="exercise"&&spKcal(it).off?`<span class="mut sm">Rehber ~${it.kcal} kcal dedi; kilona göre hesap kullanılır</span>`:""}${it.day==="yesterday"?`<span class="mut sm">Dün</span>`:""}</span><span class="lval">${val}${c.state==="pending"&&c.items.length>1?`<button class="del" data-c="lrm:${m.id}:${i}" aria-label="${lbl} çıkar">✕</button>`:""}</span></div>`;
  }).join("");
  const est=c.items.some(i=>i.type==="food"),onlySp=c.items.every(i=>i.type==="exercise"),ml=cardMeal(c),tot=c.items.reduce((a,i)=>a+(i.type==="food"&&i.kcal?i.kcal:0),0);
  return `<div class="card lcard"><div class="lhead"><b>${est?"Öğüne ekle":onlySp?"Egzersizi ekle":"Kayıt önerisi"}</b>${est?`<span class="forecast">Tahmin</span>`:""}</div>${rows}
  ${est?`<p class="mt-2 mut sm num">Toplam ~${Math.round(tot)} kcal</p>${c.state==="pending"?`<div class="mt-2 chips" role="group" aria-label="Öğün">${LogLib.MEALS.map(([k,n])=>`<button class="chip" data-c="lml:${m.id}:${k}" aria-pressed="${ml===k}">${n}</button>`).join("")}</div>`:""}`:""}
  ${c.state==="pending"?`<div class="bgrid mt-3"><button class="btn" data-c="ok:${m.id}">${est?"Günlüğe ekle":onlySp?"Egzersizi ekle":"Onayla"}</button><button class="btn ghost" data-c="no:${m.id}">Vazgeç</button></div>`:`<p class="mut sm">${c.state==="ok"?"Kaydedildi":"Vazgeçildi"}</p>${c.state==="ok"&&est&&!c.saved?`<div class="bgrid mt-3"><button class="btn ghost" data-c="savefood:${m.id}">Yemeği listeme kaydet</button></div>`:""}`}</div>`;
}
/* Menu day options: add to today or make a meal template (one button per day on the card). */
function cMenuDay(id,di){
  const c=menuCard(id),d=c&&c.days[di];if(!d)return;
  openSheet(`<h3>${esc(d.n)}</h3><p class="mut sm num">~${d.k} kcal, ${d.meals.length} öğün</p><div class="plist">${navRow(`data-c="menuadd:${id}:${di}"`,"plus","Bugüne ekle","Bu günün yemekleri bugünkü günlüğe eklenir")}${navRow(`data-c="menutpl:${id}:${di}"`,"note","Öğün şablonu yap","Yemek eklerken tek dokunuşla eklersin")}</div>`);
}
/* The consent text lives in one place: the Coach screen and Privacy and data show the same text. If the fields sent change, raise CONSENT_V. */
const consentOk=()=>S.settings.age>=18;
const ageMsg=()=>S.settings.age>0?"18 yaş altında Rehber kapalı":"Rehber için önce yaşını gir (Ayarlar > Profil)";
/* Consent depends on the set of providers the data will go to: if a keyed, enabled provider was not in the set at consent time (a paid or custom provider was enabled later), consent is asked again. Without consentP it is asked again too. */
const provSet=()=>S.providers.filter(p=>p.on&&p.health).map(p=>p.id).sort().join(",");
const provOk=()=>{const c=(S.settings.consentP||"").split(",");return keyed().every(p=>c.includes(p.id))};
/* If the age later drops below 18 (settings, backup), the given consent lapses too; every send path goes through coachOn. */
const coachOn=()=>S.settings.consent&&consentOk()&&provOk();
function cAgeGuard(){if(S.settings.consent&&!consentOk()){Object.assign(S.settings,{consent:false,consentV:0,consentAt:""});toast(S.settings.age>0?"18 yaş altında Rehber veri paylaşımı kapatıldı":"Yaş girilmediği için Rehber veri paylaşımı kapatıldı")}}
/* One text source: the in-app consent and docs/privacy-policy.md section 5 carry the same two sentences (app.test.js checks they match). Update both together; if the fields sent changed, raise CONSENT_V. */
const CONSENT_SENT=`yazdığın mesajlar ve son ${HIST_N} sohbet mesajı (Rehber yanıtları dahil); profil anahtarı açıksa boyun, 5 yıllık yaş aralığın, cinsiyetin, hareket düzeyin ve günlük kalori hedefin; menü ya da program istersen yazdığın istek notu, program için seçtiğin gün, süre, ekipman ve seviye, menü için hesaplanan protein aralığın ve menü kataloğunda kendi besin, favori ve şablon adların (kalori ve protein değerleriyle)`;
const CONSENT_WHEN="Yalnız sen bir düğmeye bastığında gönderilir (mesaj gönder, menü ya da program iste); uygulama açılırken ya da arka planda kendiliğinden hiçbir şey gönderilmez.";
const CONSENT_NOT="Kilo, yemek, su, spor ve antrenman kayıtların, sağlık notun, ilaçların, uyku ve ruh halin, tahlil, tansiyon, şeker, nabız, saatten (Health Connect) gelen veriler, fotoğraf, konum ve yedek gönderilmez.";
const consentBody=()=>`<b>Rehber ile veri paylaşımına açık rızan</b><ul class="cul"><li><b>Rehber yalnızca:</b> menü ve egzersiz programı önerir, yemek ve egzersizin kalorisini tahmin eder. Tıbbi tavsiye vermez; yanıtlarını yapay zekâ üretir, hata içerebilir ve hekim görüşü yerine geçmez.</li><li><b>Ne gönderilir:</b> ${CONSENT_SENT}. ${CONSENT_NOT}</li><li><b>Ne zaman:</b> ${CONSENT_WHEN}</li><li><b>Kime:</b> seçtiğin sağlayıcıya (${esc(S.providers.filter(p=>p.on&&p.health).map(p=>p.name).join(", ")||"hiçbiri seçili değil")}), kendi anahtarınla. Sunucuları yurt dışındadır; bu bir yurt dışına aktarımdır.</li><li><b>Seçim:</b> aşağıdan profil verisini kapatabilirsin; kapattığın hiç gönderilmez.</li><li><b>Geri alma:</b> istediğin an Ayarlar > Gizlilik ve veri ya da Yapay zekâ rehber bölümünden. Geri alınca yeni veri gitmez; önceden gönderilene sağlayıcının kendi politikası uygulanır.</li><li><b>Onay vermezsen</b> uygulama tam çalışır, yalnız Rehber konuşmaz.</li></ul>`;
/* Status warnings are always visible on the consent card, even when the details accordion is closed. */
const PWARN={nvidia:"NVIDIA Build deneme koşulları kişisel ve sağlık verisi göndermeyi yasaklıyor; yalnız deneme için kullan.",gemini:"Gemini ücretsiz katmanında Google içeriği insan incelemesi ve ürün geliştirme için kullanabilir; ücretli hesap kullanmıyorsan kişisel bir şey yazma."};
const consentWarn=()=>`${keyed().filter(p=>PWARN[p.id]).map(p=>`<p><b>${esc(p.name)}:</b> ${PWARN[p.id]}</p>`).join("")}${S.settings.consent&&consentOk()&&!provOk()?`<p><b>Sağlayıcı listen değişti.</b> Onayını verdiğinde bu sağlayıcılar yoktu; devam için yeniden onay ver.</p>`:""}${S.providers.some(p=>p.on&&p.health&&isCustom(p))?`<p><b>Özel sağlayıcı:</b> kendi eklediğin sunucuya (${esc(S.providers.filter(p=>p.on&&p.health&&isCustom(p)).map(p=>hostOf(p)).join(", "))}) verilerin ve anahtarın doğrudan gider; yalnız güvendiğin bir servis kullan.</p>`:""}${consentOk()?"":S.settings.age>0?`<p><b>18 yaş altı için Rehber veri paylaşımı kapalıdır.</b></p>`:`<p><b>Rehber için önce yaşını gir</b> (Ayarlar > Profil ve hedefler). Yaş bilinmeden Rehber açılmaz.</p>`}`;
const consentHtml=()=>consentBody()+consentWarn();
/* Deletes the chat and leaves the consent alone. */
function cClearChat(){if(!cSwitchOk())return false;S.chat=[];S.chats=[];save();return true}
/* Separate chats: the open chat is archived to the history and a new one starts empty; only the open chat goes to the model. */
const chatTitle=a=>{const u=a.find(m=>m.role==="user");return (u?u.text:"Sohbet").slice(0,60)};
function cArchive(){
  if(!S.chat.some(m=>m.role==="user"||(m.card&&m.card.kind==="safety")))return;
  let id=Date.now();while(S.chats.some(c=>c.id===id))id++;
  S.chat.forEach(m=>{delete m.pend;delete m.fl});
  S.chats.unshift({id,t:S.chat[S.chat.length-1].t,title:chatTitle(S.chat),msgs:S.chat});
  S.chats=trimChats(S.chats,true);
}
function cSwitchOk(){if(busy||typing){toast("Rehber yanıt verirken sohbet değişmez");return false}return true}
function cNewChat(){if(!cSwitchOk())return;cArchive();S.chat=[];save();render()}
function cOpenChat(id){
  if(!cSwitchOk())return;
  const x=S.chats.find(c=>c.id===id);if(!x)return;
  S.chats=S.chats.filter(c=>c!==x);cArchive();S.chat=x.msgs;
  S.cid=Math.max(S.cid,...x.msgs.map(m=>m.id+1));
  save();closeSheet();render();cScroll();
}
function cChatList(){
  openSheet(`<h3>Sohbet geçmişi</h3>${S.chats.length?S.chats.map(c=>`<div class="prow"><button class="lnk grow tl" data-c="openchat:${c.id}"><b>${esc(c.title)}</b><span class="mut sm">${fd(dayKey(new Date(c.t)))}, ${cTime(c.t)}</span></button><button class="lnk w-hit" data-c="delchat:${c.id}" aria-label="Sohbeti sil: ${esc(c.title)}">Sil</button></div>`).join(""):`<p class="hint">Geçmiş sohbet yok. Yeni sohbet başlatınca eskisi burada saklanır.</p>`}<button class="btn ghost" data-g="closesheet">Kapat</button>`);
}
/* `tap`: the user pressed the consent button; the first consent then also turns the text preview on until they choose otherwise. */
function cConsent(on,tap){
  const s=S.settings;if(on&&!consentOk())return;
  if(on&&tap&&!s.piiPrevOwn)s.piiPrev=true;
  Object.assign(s,{consent:on,consentV:on?CONSENT_V:0,consentAt:on?dayKey():"",consentP:on?provSet():null});save();render();
  if(!on&&(S.chat.length||S.chats.length))confirmSheet({title:"Rehber sohbeti silinsin mi?",body:"Rıza geri alındı, yeni veri gitmez. İstersen yazışmaları da bu telefondan sil.",ok:"Sohbeti sil"}).then(yes=>{if(yes&&cClearChat())render()});
}
/* Empty-chat examples: [label, message, true if it only fills the input box]. */
const CASK=[["Bu yemek kaç kalori?","Kaç kalori: ",true],["Bu egzersiz kaç kalori yakar?","Kaç kalori yakar: ",true]];
function viewCoach(){
  let h="";
  const intro=offline==="none"||(!hasKey()&&!S.chat.length),li=a=>`<ul class="cul">${a.map(t=>`<li>${t}</li>`).join("")}</ul>`;
  if(intro)h+=`<div class="card"><h2 class="m0 t-h2">Rehber ne yapar?</h2>${li(["Haftalık menü ve egzersiz programı önerir.","Yazdığın yemeğin ya da egzersizin kalorisini tahmin eder.","<b>Rehber olmadan da uygulama tam çalışır.</b>"])}
  <details class="acc"><summary>Verin nereye gider?</summary><p class="sm mut">Rehber yapay zekâ kullanır: internet ister, çevrimdışı çalışmaz. Yalnızca sen onay verirsen ve kendi hesabından alacağın bir anahtarla çalışır (ücretsiz seçenekler var). Onay verirsen yazdıkların ve profilin seçtiğin sağlayıcıya gider; sağlayıcının sunucuları yurt dışındadır. İstediğin an geri alırsın (Ayarlar > Gizlilik ve veri).</p></details>
  <button class="btn" data-c="guide">Rehberi etkinleştir</button><p class="hint tc">Yaklaşık 2 dakika sürer.</p></div>`;
  else if(offline==="fail"){
    const x=S.providers.filter(p=>pstat[p.id]&&pstat[p.id].s!=="ok").sort((a,b)=>pstat[b.id].t-pstat[a.id].t)[0],dt=x&&pstat[x.id].m;
    h+=`<div class="banner"><div class="lhead"><b>Rehber'e şu an ulaşılamıyor</b>${dt?`<button class="help" data-c="hx:kerr" aria-expanded="false" aria-controls="kerr" aria-label="Hata ayrıntısı">${Icons.svg("info")}</button>`:""}</div>${dt?`<p class="helpx" id="kerr" hidden>${esc(x.name)}: ${esc(dt)}</p>`:""}<p>Bağlantını kontrol et. Mesajın bu telefonda duruyor; su, kilo ve spor kaydı çalışmaya devam ediyor.</p><button class="btn" data-c="retry">Tekrar dene</button></div>`;
  }
  if(!coachOn()&&!intro)h+=`<div class="card"><h2 class="m0 t-h2">Rehber ile veri paylaşımı</h2>${li(["Mesajların ve istersen profilin (boy, yaş aralığı, cinsiyet, hareket, kalori hedefi) seçtiğin sağlayıcıya gider.","Yalnız sen bir düğmeye bastığında gönderilir.","İstediğin an geri alırsın; onay vermezsen uygulama tam çalışır."])}${consentWarn()}
  <details class="acc"><summary>Detaylar</summary><div class="sm">${consentBody()}</div></details>${consentOk()?`<div class="lbl">Rehber'e hangi veriler gitsin?</div>${shareRows()}${swRow('data-pv="prev"',!S.settings.piiPrevOwn||S.settings.piiPrev,"Gönderimden önce metni göster","Her gönderimden önce giden tam metni görür, Gönder ya da İptal dersin. İstersen kapat.")}<button class="btn" data-c="consent">Açık rızamı veriyorum</button>`:""}<button class="lnk" data-pv="open">Gizlilik ve veri</button></div>`;
  if(S.chat.length||S.chats.length)h+=`<div class="chips cbar">${S.chat.length?`<button class="chip" data-c="newchat">Yeni sohbet</button>`:""}${S.chats.length?`<button class="chip" data-c="chats">Geçmiş</button>`:""}</div>`;
  if(!S.chat.length&&hasKey()&&coachOn())h+=emptyCard("coach","Bugün neyle başlayalım?","Bir yemeğin ya da egzersizin adını yaz, kalorisini tahmin edeyim. Menü ve program da isteyebilirsin.",`<div class="chips">${CASK.map((x,i)=>`<button class="chip" data-c="ask:${i}">${x[0]}</button>`).join("")}</div>`);
  /* The bubble carries only text; the card is a separate full-width surface outside the bubble. */
  for(const m of S.chat){
    if(m.role==="user")h+=`<div class="ub">${esc(m.text)}</div>${m.pend?`<div class="pendl">Gönderilmedi${coachOn()&&!typing&&offline!=="fail"?`<button class="lnk wa ib" data-c="retry">Şimdi gönder</button>`:""}</div>`:""}`;
    else if(m.role==="coach"){
      h+=`<div class="msg" data-mid="${m.id}">${m.text||m.kind==="plateau"?`<div class="cm">${m.text&&m.kind!=="plateau"?`<div class="mut sm">Yapay zekâ üretti, hekim değildir · ${cTime(m.t)}</div>`:""}<p>${esc(m.text)}</p>${m.kind==="plateau"&&lossAsk()?`<div class="bgrid mt-3"><button class="btn" data-c="why">Bak</button></div>`:""}</div>`:""}${cCard(m)}</div>`;
    }
  }
  if(typing)h+=`<div class="cm"><div class="mut sm">Rehber yazıyor</div><p class="dots">• • •</p></div>`;
  else if(lossAsk())h+=`<div class="chips"><button class="chip" data-c="why">Bu haftaya birlikte bakalım</button></div>`;
  if(!typing){
    const why=!S.settings.consent?"Rehber menüsü için önce yukarıdaki veri paylaşımını kabul et":!usable().length?"Rehber menüsü için Rehber anahtarı gerekli (Ayarlar > Rehber)":"";
    h+=`<div class="chips"><button class="chip" data-c="menu">${why?"Menü oluştur (cihazda)":"Haftalık menü öner"}</button></div>${why?`<p class="hint">${why}. Cihazda oluşturma anahtarsız çalışır, hiçbir şey gönderilmez.</p>`:""}`;
  }
  return `<div class="chat">${h}</div>`;
}
function cScroll(){if(tab==="coach")setTimeout(()=>window.scrollTo(0,document.body.scrollHeight),30)}

/* ---- settings: providers ---- */
function pStatus(p){
  const k=getKeys()[p.id],s=pstat[p.id];
  if(!p.on)return ["Kapalı",""];
  if(!p.health)return ["Sağlık verisi kapalı",""];
  if(!k)return ["Anahtar yok",""];
  if(s&&s.s==="ok")return ["Çalışıyor",`Son başarılı ${cTime(s.t)}, ${fmt(s.ms/1000,1)} sn`];
  if(s&&s.s==="limit")return ["Limit doldu","1 dakika sonra yeniden denenebilir"];
  if(s&&s.s==="key")return ["Anahtar geçersiz",""];
  if(s&&s.s==="err")return ["Hata",s.m||""];
  return ["Hazır",""];
}
/* The user sees the provider name and status; the model id only in the Advanced section of the provider sheet. */
function viewProviders(){
  const k=getKeys(),on=S.providers.filter(p=>p.on&&p.health&&k[p.id]),ready=on.length>0;
  const rows=S.providers.map(p=>{const [a,b]=pStatus(p);return `<button class="prow" data-c="prov:${p.id}"><span class="grow"><b>${esc(p.name)}</b>${b?`<span class="mut sm">${esc(b)}</span>`:""}</span><span class="tag">${a}</span></button>`}).join("");
  return `<div class="card"><h2 class="m0">${ready?"Rehber hazır":"Rehber bağlı değil"}</h2><p class="hint">${ready?`${esc(on.map(p=>p.name).join(", "))} ile çalışıyor.`:"Rehber için bir yapay zekâ sağlayıcısından ücretsiz ya da ücretli bir anahtar gerekir. Rehber olmadan da uygulama tam çalışır."}</p>
  <button class="btn${ready?" ghost":""}" data-c="setup">${ready?"Başka anahtar ekle":"Rehberi bağla"}</button>
  <p class="hint">Veri paylaşımı: ${S.settings.consent?`kabul edildi (${fd(S.settings.consentAt)})`:"kabul edilmedi"}. ${S.settings.consent?`<button class="wa ib lnk" data-c="revoke">Geri al</button>`:""}</p></div>
  <h2 class="grp">Rehber'e giden veriler</h2><div class="card"><p class="hint">Kapattığın veri Rehber'e hiç gönderilmez. İstediğin an değiştirirsin.</p>${shareRows()}</div>
  <h2 class="grp">Sağlayıcılar</h2><div class="card">${rows}<p class="hint">Birden çok sağlayıcı açıksa sırayla denenir; biri meşgulse sıradaki devreye girer. Anahtarlar bu telefonda şifreli durur, yalnız parolalı yedeğe şifreli girer.</p>
  <details class="acc"><summary>Gelişmiş</summary><p class="m0 hint">Kendi OpenAI uyumlu servisini ekleyebilirsin. Sağlık verilerin ve anahtarın o sunucuya gider.</p><div class="btns"><button class="btn ghost" data-c="addprov">Sağlayıcı ekle</button></div></details></div>
  <h2 class="grp">Sohbet</h2><div class="card"><button class="btn danger" data-c="clearchat">Sohbeti temizle</button></div>`;
}
/* The addresses are only well-known key pages; panel button names may change. */
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
  openSheet(`<h3>${esc(p.name)} anahtarı nasıl alınır?</h3><div class="mut sm mb-2">${esc(g.site)}</div><ol class="cues">${g.steps.map(t=>`<li>${esc(t)}</li>`).join("")}</ol>
  <button class="btn" data-c="setup">‹ Anahtarı yapıştır</button>`);
}
/* ---- setup: 1 key (provider guessed from the prefix), 2 verify and fetch the models (the recommended one preselected), 3 test and save.
   Network calls happen only on a button press and only to the chosen provider; only the key and a fixed test sentence go out. The model list stays in memory and does not enter the backup. */
const PNOTE={nvidia:"Deneme koşulları kişisel ve sağlık verisine izin vermiyor, varsayılan kapalı",groq:"Ücretsiz, çok hızlı",openrouter:"Ücretsiz modeller var",gemini:"Ücretsiz katmanda Google insan incelemesi yapabilir, her gönderimde sorulur",openai:"Ücretli, ucuz model önerilir",anthropic:"Ücretli, ucuz model önerilir"};
const suNew=()=>({k:"",id:null,models:null,rec:"",model:"",adv:false,msg:"",fail:"",ok:"",busy:false});
let su=suNew();
const suProv=()=>GUIDE[su.id]?S.providers.find(p=>p.id===su.id):null;
function cSetup(fresh){
  if(fresh)su=suNew();
  openSheet(`<h3>Rehberi bağla</h3><label class="lbl" for="sk">1. Anahtarını yapıştır</label>
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
  <div class="lbl">2. Anahtarı doğrula</div><p class="hint">Anahtarını ve bir deneme cümlesini sağlayıcıya göndeririz; sağlık verin gitmez.</p><button class="btn ghost" data-c="sfetch"${su.busy?" disabled":""}>Doğrula</button>`;
  if(su.models){
    const m=su.models.find(x=>x.id===su.model),tag=[su.model===su.rec?"Önerilen model":"Seçtiğin model",m&&m.free?"ücretsiz":"",su.model===su.ok?"denendi":""].filter(Boolean).join(", ");
    h+=`<p class="my-2"><span class="tag">${tag}</span></p><details class="acc"${su.adv?" open":""}><summary>Gelişmiş: model</summary><p class="m0 url"><b>${esc(su.model)}</b></p>`;
    h+=su.adv?`<label class="lbl" for="smsel">Başka model</label><select class="in" id="smsel">${su.models.map(x=>`<option value="${esc(x.id)}"${x.id===su.model?" selected":""}>${esc(x.id)}${x.id===su.rec?" (önerilen)":x.free?" (ücretsiz)":""}</option>`).join("")}</select>
      <label class="lbl" for="smfree">Ya da model kimliğini yaz</label><input class="in" id="smfree" autocomplete="off" spellcheck="false" placeholder="ör. ${esc(p.model)}">`
      :`<button class="lnk" data-c="sadv">Başka model seç</button>`;
    h+=`</details>`;
  }
  h+=`<div class="lbl">3. Dene</div><button class="btn" data-c="stest"${su.busy?" disabled":""}>Test et ve kaydet</button>
  <p class="hint" id="smsg" role="status">${esc(su.msg)}</p>${su.fail&&!["key","model","empty"].includes(su.fail)?`<button class="btn ghost" data-c="ssave">Denemeden kaydet</button>`:""}`;
  return h;
}
function suRender(){const b=$("#sbody");if(b)b.innerHTML=suBody()}
/* Under 18, setup makes no network call either; the consent chain protects health data separately. */
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
    su.models=await fetchModels(p,k);su.adv=false;su.ok="";
    /* Some providers return the list without a key, and a listed model may not work on the account: candidates are tried with a real request in a short time and the first that answers is recommended. */
    const cands=CoachLib.candidates(p.id,su.models).slice(0,4),stop=["key","quota","net","limit"];let last=null;
    if(!cands.length)cands.push(p.model);
    for(const m of cands){
      su.msg=`Model deneniyor (${cands.indexOf(m)+1}/${cands.length})…`;suRender();
      try{await probe(p,k,m,15000);su.ok=m;break}catch(e){last=errOf(e);if(stop.includes(last.kind))break}
    }
    su.rec=su.model=su.ok||cands[0];
    if(su.ok)su.msg="Anahtar çalışıyor, önerilen model denendi ve yanıt verdi. Kaydedebilirsin.";
    else{su.fail=last.kind;su.msg=last.text+(stop.includes(last.kind)?"":" Önerilen modeller yanıt vermedi; başka model seçip dene.")}
  }catch(e){su.models=null;su.msg=errOf(e).text}
  su.busy=false;suRender();
}
function suSave(p,k,model){p.model=model;p.on=p.health=true;setKey(p.id,k);delete cool[p.id];save();closeSheet();render();if(S.settings.consent&&!provOk())toast("Yeni sağlayıcı için Rehber ekranında veri paylaşımını yeniden onayla")}
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
  <label class="lbl" for="pk">Anahtar</label><input class="url in" id="pk" type="password" placeholder="${k?"••••"+esc(k.slice(-4)):"yapıştır"}" autocomplete="off" spellcheck="false">
  ${swRow('id="pon"',p.on,"Bu sağlayıcıyı kullan")}
  ${swRow('id="ph"',p.health,"Sağlık verisi gönder",p.confirm?"Bu sağlayıcıda ücretsiz katman istemleri ürün geliştirmek için kullanabilir. Açarsan her göndermeden önce onay istenir.":"Kapalıysa bu sağlayıcıya hiçbir şey gönderilmez.")}
  <button class="mt-2 btn ghost" data-c="ptest:${id}">Bağlantıyı test et</button>
  <details class="acc"><summary>Gelişmiş</summary>
  <label class="lbl" for="pb">Adres</label><input class="url in" id="pb" value="${esc(p.base)}" autocomplete="off" spellcheck="false"${builtin?" readonly":""}>
  <label class="lbl" for="pm">Model</label><input class="url in" id="pm" value="${esc(p.model)}" autocomplete="off" spellcheck="false"><div id="pmlist"></div>
  <button class="mt-2 btn ghost" data-c="pmodels:${id}">Modelleri getir</button>
  <div class="mt-2 two"><button class="btn ghost" data-c="pmove:${id}:-1"${i===0?" disabled":""}>Sırada yukarı</button><button class="btn ghost" data-c="pmove:${id}:1"${i===S.providers.length-1?" disabled":""}>Sırada aşağı</button></div></details>
  <div class="btns"><button class="btn" data-c="psave:${id}">Kaydet</button>${k?`<button class="btn danger" data-c="pkeydel:${id}">Anahtarı sil</button>`:""}${builtin?"":`<button class="btn danger" data-c="pdel:${id}">Sağlayıcıyı kaldır</button>`}</div>`);
}
function pRead(id){
  const p=S.providers.find(x=>x.id===id);
  const def=defProviders().find(d=>d.id===id),base=def?def.base:$("#pb").value.trim(),model=$("#pm").value.trim();
  if(!/^https:\/\/[^\s]+$/.test(base)){toast("Adres https:// ile başlamalı");return null}
  if(!model){toast("Model adı yaz");return null}
  p.base=base.slice(0,200);p.model=model.slice(0,100);p.on=$("#pon").checked;p.health=$("#ph").checked;
  const key=$("#pk").value.trim();if(key){setKey(id,key);delete cool[id]}
  save();return p;
}
async function cProvClick(a,p1,p2){
  switch(a){
    case "prov":return cSheetProv(p1);
    case "addprov":
      return openSheet(`<h3>Sağlayıcı ekle</h3><div class="lbl">OpenAI uyumlu bir servis (adres /chat/completions'ın bir üstü olmalı)</div><p class="hint">Dikkat: eklediğin sunucuya sağlık verilerin ve anahtarın gider. Yalnız güvendiğin bir servis ekle.</p><input class="in" id="an" placeholder="Ad" maxlength="40"><input class="url in" id="ab" placeholder="https://.../v1"><input class="url in" id="am" placeholder="Model adı"><button class="btn" data-c="mkprov">Ekle</button>`);
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
        const ms=await fetchModels(p,key),rec=CoachLib.pickModel(p1,ms),box=$("#pmlist");
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
    case "askfood":{const q=foodAskQ.trim();if(q){closeSheet();tab="coach";render();cSend(`${q} kaç kalori? Bir porsiyon için tahmin et.`)}return}
    case "send":{const i=$("#cmsg");const t=i.value;i.value="";return cSend(t)}
    case "retry":offline=null;cFlush();return render();
    case "pvok":case "pvno":sheetDone(a==="pvok");return closeSheet();

    case "consent":return cConsent(true,true);
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

    case "menu":return cMenuSheet();
    case "menulocal":{menuNote=($("#mnote").value||"").replace(/\s+/g," ").trim().slice(0,200);closeSheet();return cMenuLocal()}
    case "menuask":{menuNote=($("#mnote").value||"").replace(/\s+/g," ").trim().slice(0,200);closeSheet();return cMenu()}
    case "menuadd":{
      const c=menuCard(+p1),d=c&&c.days[+p2];if(!d)return;
      const bl=cCalc().block,why=d.off?`Bu günün toplamı ${d.k} kcal, hedefin (${c.kcal}) %15'inden fazla sapıyor.`:bl&&c.kcal&&d.k<c.kcal-50?`Kalori açığı önerilmiyor (${bl}); bu gün hedefin altında (${d.k} kcal).`:"";
      const go=()=>{const it=menuEntries(d);addFoods(it,dayKey(),`${d.n}: ${it.length} yemek bugüne eklendi`)};
      if(why)return void confirmSheet({title:"Bugüne eklensin mi?",body:why+" Yine de bugüne eklensin mi?",ok:"Ekle"}).then(ok=>{if(ok)go()});
      return go();
    }
    case "menuday":return cMenuDay(+p1,+p2);
    case "hx":{const x=document.getElementById(p1),on=!!x&&x.hidden;if(x){x.hidden=!on;el.setAttribute("aria-expanded",on)}return}
    case "menutpl":{closeSheet();
      const c=menuCard(+p1),d=c&&c.days[+p2];if(!d)return;
      if(Nutrition.tpl().length>=20)return toast("En fazla 20 şablon");
      const all=menuEntries(d),id=Math.max(0,...Nutrition.tpl().map(t=>t.id))+1;
      Nutrition.addTpl({id,n:("Menü: "+d.n).slice(0,40),items:all.slice(0,15).map(x=>LogLib.copyNutr(x,{text:x.text,v:x.v}))});save();
      return toast(`Şablon kaydedildi${all.length>15?" (ilk 15 yemek)":""}`,()=>{Nutrition.removeTpl(id);save()});
    }
    case "shop":return cShop(+p1);
    case "shopchk":{
      const c=menuCard(+p1),x=c&&shopOf(c)[+p2];if(!x)return;
      const on=!c.chk.includes(x.n);c.chk=on?[...c.chk,x.n].slice(-100):c.chk.filter(n=>n!==x.n);save();
      el.setAttribute("aria-pressed",on);return;
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
      c.logged=true;return addFoods([{text:c.f.n,v:c.f.k,p:c.f.p==null?undefined:c.f.p,meal:mealNow()}],dayKey(),`${c.f.n} günlüğe eklendi`,()=>{c.logged=false});
    }
    case "addfood":{const m=S.chat.find(x=>x.id===+p1);if(m&&m.card&&m.card.kind==="food"&&m.card.state==="pending"){if(Nutrition.addMy(m.card.f.n,m.card.f.k,m.card.f.p)){m.card.state="ok";save();render();toast("Besin listene eklendi")}else toast(`Listen dolu (en fazla ${MYFOODS_MAX} besin)`)}return}
    case "no":case "nofood":{const m=S.chat.find(x=>x.id===+p1);if(m&&m.card){m.card.state="no";save();render()}return}
    case "savefood":{
      const m=S.chat.find(x=>x.id===+p1);if(!m||!m.card||m.card.kind!=="log"||m.card.saved)return;
      let n=0;for(const it of m.card.items)if(it.type==="food"&&it.text&&it.kcal!=null&&Nutrition.addMy(it.text,it.kcal,it.p))n++;
      m.card.saved=true;save();render();toast(n?`${n} besin listene eklendi`:"Eklenecek besin yok");return;
    }

    case "dismiss":{const b=el.closest("[data-mid]");if(b){S.chat=S.chat.filter(x=>x.id!==+b.dataset.mid);save();render()}return}
    case "ask":{const x=CASK[+p1];if(!x)return;if(x[2]){const i=$("#cmsg");i.value=x[1];i.focus()}else cSend(x[1]);return}
    case "newchat":return cNewChat();
    case "chats":return cChatList();
    case "openchat":return cOpenChat(+p1);
    case "delchat":{
      const i=S.chats.findIndex(c=>c.id===+p1);if(i<0)return;
      const [x]=S.chats.splice(i,1);save();render();cChatList();
      return toast("Sohbet silindi",()=>{if(!S.chats.some(c=>c.id===x.id)){S.chats.splice(Math.min(i,S.chats.length),0,x);S.chats=trimChats(S.chats,true);save();render();cChatList()}});
    }
    case "clearchat":if(cSwitchOk())confirmSheet({title:"Sohbet geçmişi silinsin mi?",body:"Kayıtların silinmez.",ok:"Sil",danger:true}).then(ok=>{if(ok){cClearChat();render()}});return;
    default:return cProvClick(a,p1,p2);
  }
}
