/* Coach behavior (coach.js): health note scan, provider chain, cooldown record, log card paths, chat archive. */
const {ok,finish}=require("./ok");
const {boot,until}=require("./html");
let w,ev;
const reply=o=>({ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify(o)},finish_reason:"stop"}]})});
const fail=s=>({ok:false,status:s,text:async()=>"",json:async()=>({})});
let urls=[];const fetchWith=f=>{urls=[];w.fetch=async(u,o)=>{urls.push(u);return f(u,o,urls.length)}};
const reset=()=>ev(`closeSheet();S=structuredClone(DEF);S.settings.obDone=true;S.settings.age=30;S.settings.heightCm=175;tab='coach';cool={};pstat={};offline=null;busy=false;typing=false;
  KEYS={nvidia:'k1',groq:'k2'};S.providers.forEach(p=>{p.on=p.health=p.id==='nvidia'||p.id==='groq';p.confirm=false});cConsent(true);render()`);
boot().then(async win=>{
  w=win;ev=s=>w.eval(s);
  const chatRisk=()=>ev("[S.settings.edFlag&&'ed',S.settings.pregnant&&'preg',S.settings.nursing&&'nurs'].filter(Boolean).join()"),cards=k=>ev(`S.chat.filter(m=>m.card&&m.card.kind==='${k}').length`);
  ev("toast=(m,u)=>{globalThis.__t=m;globalThis.__u=u}");
  {
    reset();
    ev("S.settings.healthNote='yedikten sonra kusuyorum';cNoteCheck()");
    ok("cNoteCheck: an eating-disorder note writes ed to chatRisk",chatRisk().includes("ed"),chatRisk());
    ev("S.settings.healthNote='hamileyim';cNoteCheck()");
    ok("cNoteCheck: a pregnancy note writes preg, ed is kept",chatRisk()==="ed,preg",chatRisk());
    ev("S.settings.healthNote='göğsüm ağrıyor';cNoteCheck()");
    ok("cNoteCheck: an emergency symptom note adds a safety card to the chat",ev("S.chat.some(m=>m.card&&m.card.kind==='safety'&&m.card.level==='emergency')"));
    reset();ev("S.settings.healthNote='iyi durumdayım';cNoteCheck()");
    ok("cNoteCheck: a clean note produces no risk and no card",chatRisk()===""&&cards("safety")===0);
    ok("saving the health note calls cNoteCheck",/async function goHealth[\s\S]*?healthNote=note;if\(note!==old\)cNoteCheck\(\)/.test(require("./html").full()));
  }
  {
    reset();let n=0;fetchWith(()=>{n++;return reply({reply:"x"})});
    ev("S.settings.kcal=2000;menuNote='hamileyim, fıstık alerjisi'");await ev("cMenu()");
    ok("pregnancy in the menu note: no request is sent, chatRisk preg, no unanswered user message is left",n===0&&chatRisk().includes("preg")&&ev("S.chat.length")===0,[n,chatRisk()]);
    ev("menuNote='yedikten sonra kusuyorum'");await ev("cMenu()");
    ok("eating disorder in the menu note: no request is sent, chatRisk ed",n===0&&chatRisk().includes("ed"));
  }
  {
    reset();fetchWith((u,o,i)=>i===1?fail(500):reply({reply:"merhaba",log:[]}));
    let r=await ev("cAsk([{role:'user',content:'x'}],50)");
    ok("chain: if the 1st provider fails it moves to the 2nd",r.provider.id==="groq"&&urls.length===2&&/nvidia/.test(urls[0])&&/groq/.test(urls[1]),urls);
    ok("chain: a provider with a 500 gets a short cooldown record, a successful one does not",ev("cool.nvidia>Date.now()&&cool.nvidia<Date.now()+60000&&!cool.groq"));
    ev("cool={};S.providers[0].confirm=S.providers[1].confirm=true;");w.confirm=()=>false;fetchWith(()=>reply({reply:"x"}));
    let e=await ev("cAsk([{role:'user',content:'x'}],50).catch(e=>e.message)");
    ok("chain: if every confirmation is declined the result is declined and no request is sent",e==="declined"&&urls.length===0,[e,urls]);
    w.confirm=()=>true;ev("S.providers.forEach(p=>p.confirm=false);cool={}");
    fetchWith(()=>{throw new TypeError("Failed to fetch")});
    e=await ev("cAsk([{role:'user',content:'x'}],50).catch(e=>e.message)");
    ok("chain: if all fail the result is fail; a network error records a cooldown",e==="fail"&&urls.length===2&&ev("cool.nvidia>Date.now()&&cool.groq>Date.now()"),[e,urls]);
    ev("cSend('merhaba')");
    ok("all failed: the chat goes offline, the message stays pending",await until(()=>ev("offline")==="none"||ev("offline")==="fail"));
    reset();fetchWith(()=>fail(404));await ev("cAsk([{role:'user',content:'x'}],50).catch(()=>0)");
    ok("a cooldown record for a model error (404)",ev("cool.nvidia>Date.now()+60000"));
    reset();fetchWith(()=>reply({reply:"x"}));ev("cool.nvidia=Date.now()+1e6");
    await ev("cAsk([{role:'user',content:'x'}],50)");
    ok("a provider in cooldown is skipped",urls.length===1&&/groq/.test(urls[0]));
  }
  {
    reset();ev("cool.groq=Date.now()+1e6;cSheetProv('groq');document.querySelector('#pk').value='gsk_yeni_anahtar'");ev("pRead('groq')");
    ok("pRead clears the cooldown when a new key is saved",ev("cool.groq")===undefined&&ev("KEYS.groq")==="gsk_yeni_anahtar");
  }
  {
    reset();let n=0;fetchWith(()=>{n++;return reply({reply:"Tamam",menu:{days:[]},program:{days:[]}})});
    ev("cSend('2 yumurta yedim')");
    ok("when the user reports food and only a program/menu field comes back it does not count as a log: asked again once",await until(()=>n>=2)&&(await new Promise(r=>setTimeout(r,50)),n===2),n);
    reset();fetchWith(()=>{throw new TypeError("x")});
    await ev("cProgram({d:3,q:'Salon',m:45,l:'Başlangıç'})");
    ok("if a program request fails no unanswered user message is left",ev("S.chat.length")===0&&ev("busy")===false);
    reset();let sent;fetchWith((u,o)=>{sent=JSON.parse(o.body);return reply({reply:"Bugün iyi"})});
    await ev("cProgram({d:3,q:'Salon',m:45,l:'Başlangıç'})");
    ok("the user text of a program request is not sent twice",sent.messages.filter(m=>m.role==="user").length===1,sent.messages.map(m=>m.role));
    reset();let direct=0;fetchWith(()=>{direct++;return reply({reply:"Tamam"})});
    const before=direct;ev("S.settings.consent=false");await ev("callProvider(S.providers.find(p=>p.id==='nvidia'),'k1',[{role:'user',content:'x'}],20)").catch(()=>0);
    ok("direct provider calls are blocked without consent",direct===before);
    await ev("S.settings.consent=true;S.settings.consentP='nvidia,groq,anthropic,openai';S.providers.find(p=>p.id==='nvidia').on=false;callProvider(S.providers.find(p=>p.id==='nvidia'),'k1',[{role:'user',content:'x'}],20)").catch(()=>0);
    ok("direct provider calls reject disabled provider",direct===before);
    await ev("callProvider(S.providers.find(p=>p.id==='nvidia'),'k1',[{role:'user',content:'secret'}],20,{probe:true})").catch(()=>0);
    ok("probe rejects user payload",direct===before);

  }
  {
    reset();ev("for(let i=0;i<15;i++)cPush({role:i%2?'coach':'user',text:'m'+i})");
    ok("the cMessages history is HIST_N messages and the consent text says the same number",ev("cMessages(null).length")===1+ev("HIST_N")&&ev("CONSENT_SENT").includes(`son ${ev("HIST_N")} sohbet mesajı`)&&ev("HIST_N")===10);
  }
  {
    reset();ev("cPush({role:'user',text:'a'});busy=true");ev("cClearChat()");
    ok("the chat is not cleared while busy",ev("S.chat.length")===1);
    ev("busy=false;S.chat.forEach(m=>m.pend=false)");ev("cClearChat()");
    ok("it is cleared when idle",ev("S.chat.length")===0);
    ev("cPush({role:'coach',text:'',card:{kind:'safety',level:'emergency'}});cNewChat()");
    ok("a chat with only a safety card is archived too",ev("S.chats.length")===1&&ev("S.chat.length")===0);
    ev("S.chats=[];for(let i=0;i<2;i++){cPush({role:'user',text:'k'+i});S.chat.forEach(m=>m.pend=false);cNewChat()}");
    ok("archive ids do not collide in the same millisecond",ev("new Set(S.chats.map(c=>c.id)).size")===2);
    ev("S.chats=[];globalThis.__t='';for(let i=0;i<21;i++){cPush({role:'user',text:'s'+i});S.chat.forEach(m=>m.pend=false);cNewChat()}");
    ok("when the archive limit is exceeded the oldest chat is dropped and the user is warned",ev("S.chats.length")===20&&/Arşiv sınırı/.test(ev("__t")),ev("__t"));
    reset();ev("busy=false;typing=false;cPush({role:'user',text:'gönderilemeyen',pend:true})");
    ok("an unsent message (\"Gönderilmedi\") does not block New chat, it enters the archive without the pending flag",ev("S.chat.some(m=>m.pend)")===true&&(ev("cNewChat()"),ev("S.chat.length")===0&&ev("S.chats.length")===1&&!ev("S.chats[0].msgs.some(m=>m.pend)")));
    reset();ev("cPush({role:'user',text:'x'});busy=true");ev("cNewChat()");
    ok("the chat does not change while the Coach is really answering (busy)",ev("S.chat.length")===1);ev("busy=false");
  }
  {
    reset();ev("add('weight',80,'',dayKey())");
    const card=items=>{ev(`S.chat=[];cPush({role:'coach',text:'x',card:{kind:'log',state:'pending',items:${JSON.stringify(items)}}})`);return ev("S.chat[0].id")};
    const el=ev("(()=>{const b=document.createElement('div');b.className='lcard';b.innerHTML='<input data-ck=\"0\" value=\"\">';document.body.appendChild(b);return b.firstChild})()");
    const apply=(id,e)=>{w.__el=e;ev(`cApplyLog(${id},__el)`)};
    let id=card([{type:"food",text:"dünkü pilav",kcal:300,day:"yesterday"}]);apply(id,el);
    ok("cApplyLog: yesterday's food is written to yesterday, not today",ev("S.entries.filter(e=>e.type==='food'&&e.day===keyOff(-1)).length")===1&&ev("S.entries.filter(e=>e.type==='food'&&e.day===dayKey()).length")===0);
    ok("cApplyLog: the card becomes ok",ev("S.chat[0].card.state")==="ok");
    ev("__u()");
    ok("cApplyLog: Undo deletes the entry and reopens the card",ev("S.entries.filter(e=>e.type==='food').length")===0&&ev("S.chat[0].card.state")==="pending");
    ev("S.entries=S.entries.filter(e=>e.type==='weight')");
    id=card([{type:"food",text:"çorba",kcal:200}]);apply(id,el);
    ok("cApplyLog: an emptied calorie box saves kcal as null",ev("S.chat[0].card.items[0].kcal")===null);
    ev("S.entries=S.entries.filter(e=>e.type==='weight')");
    id=card([{type:"exercise",min:30,name:"Koşu",kcal:5000}]);apply(id,el);
    const sp=ev("S.entries.find(e=>e.type==='exercise')");
    ok("cApplyLog: the Coach's exaggerated exercise calories are replaced by the app's MET calculation",sp&&sp.kcal>0&&sp.kcal<500&&ev("spKcal({name:'Koşu',min:30,kcal:5000}).off")===true,sp);
    ev("__u()");
    ok("cApplyLog: the exercise entry is undone",ev("S.entries.filter(e=>e.type==='exercise').length")===0&&ev("S.chat[0].card.state")==="pending");
  }
  {
    reset();
    ev(`S.settings.healthNote="tansiyon";S.settings.heightCm=170;S.settings.age=34;S.settings.sex='m';S.settings.act=1;S.settings.kcal=1900;S.settings.goalKg=70;S.entries=[{id:1,day:dayKey(),time:'08:00',type:'food',v:300,p:20,text:'çorba'},{id:2,day:dayKey(),time:'09:00',type:'weight',v:80,text:''},{id:3,day:dayKey(),time:'10:00',type:'note',v:0,text:'gizli not'}]`);
    const d=ev("cData()"),ctx=ev("CoachLib.contextText(cData())");
    ok("cData: only the profile and the calorie goal are sent; records, weight, notes, health note and goals stay on the phone",JSON.stringify(Object.keys(d).sort())==='["goalKcal","profile"]'&&d.profile.cm===170&&d.goalKcal===1900&&!/çorba|gizli not|tansiyon/.test(JSON.stringify(d)),d);
    ok("the context is the single profile line",ctx==="PROFİL: 170 cm, 30-34 yaş, erkek, hareket düzeyi orta, günlük kalori hedefi 1900",ctx);
    ev("S.settings.shareProfile=false");
    const c2=ev("CoachLib.contextText(cData())");
    ok("profile sharing off: nothing personal is sent and the model is told so",c2.includes("paylaşmadı")&&!/170|1900/.test(c2)&&ev("cData().profile")===null,c2);
  }
  {
    reset();const st=w.setTimeout;w.setTimeout=(f,ms,...a)=>st(f,ms===15000?5:ms,...a);
    fetchWith((u,o)=>new Promise((_,rej)=>o.signal.addEventListener("abort",()=>rej(Object.assign(new Error("aborted"),{name:"AbortError"})))));
    const r=await ev("fetchModels(S.providers[0],'k').then(()=>'ok',e=>errOf(e).kind)");
    w.setTimeout=st;
    ok("fetchModels: a model list request that never answers is aborted and classified as a timeout",r==="time",r);
  }
  { // provider terms warnings and defaults
    reset();
    ok("a keyed NVIDIA provider shows its trial-terms warning in the consent area, Groq shows none",ev("consentWarn()").includes("NVIDIA Build:")&&!ev("consentWarn()").includes("Groq:"));
    ev("S.providers.find(p=>p.id==='gemini').on=true;S.providers.find(p=>p.id==='gemini').health=true;KEYS.gemini='g'");
    ok("a keyed Gemini provider shows the free-tier review warning",ev("consentWarn()").includes("Google Gemini:</b> Gemini ücretsiz katmanında"));
    ok("NVIDIA is off by default",ev("defProviders().find(p=>p.id==='nvidia').on")===false&&ev("defProviders().filter(p=>p.on).map(p=>p.id).join()")==="groq,openrouter");
  }
  { // revoking the consent offers to delete the chat too
    reset();ev("S.chat=[{id:1,role:'user',text:'merhaba',t:1}];S.cid=2");
    w.confirm=()=>false;ev("cConsent(false)");await new Promise(r=>setTimeout(r,10));
    ok("revoking the consent: declining the offer keeps the chat",ev("S.settings.consent")===false&&ev("S.chat.length")===1);
    reset();ev("S.chat=[{id:1,role:'user',text:'merhaba',t:1}];S.cid=2");
    w.confirm=()=>true;ev("cConsent(false)");await new Promise(r=>setTimeout(r,10));
    ok("revoking the consent: accepting the offer deletes the chat and its archive",ev("S.chat.length")===0&&ev("S.chats.length")===0);
    reset();w.confirm=()=>{throw new Error("asked")};ev("S.chat=[];S.chats=[]");let asked=false;try{ev("cConsent(false)")}catch{asked=true}
    ok("revoking the consent with no chat asks nothing",!asked);
    w.confirm=()=>true;
  }
  finish();
});
