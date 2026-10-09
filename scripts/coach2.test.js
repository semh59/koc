/* Koç davranışı (coach.js): sağlık notu taraması, sağlayıcı zinciri, bekleme kaydı, kayıt kartı yolları, sohbet arşivi. */
const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const www=f=>path.join(__dirname,"../www",f);
const html=require("./html").build();
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",beforeParse(w){Object.assign(w,{structuredClone,TextEncoder,TextDecoder});w.scrollTo=()=>{};w.confirm=()=>true}});
const w=dom.window,ev=s=>w.eval(s),wait=ms=>new Promise(r=>setTimeout(r,ms));
const reply=o=>({ok:true,status:200,json:async()=>({choices:[{message:{content:JSON.stringify(o)},finish_reason:"stop"}]})});
const fail=s=>({ok:false,status:s,text:async()=>"",json:async()=>({})});
let urls=[];const fetchWith=f=>{urls=[];w.fetch=async(u,o)=>{urls.push(u);return f(u,o,urls.length)}};
const reset=()=>ev(`closeSheet();S=structuredClone(DEF);S.settings.obDone=true;S.settings.age=30;S.settings.heightCm=175;tab='coach';cool={};pstat={};offline=null;busy=false;typing=false;
  KEYS={nvidia:'k1',groq:'k2'};S.providers.forEach(p=>{p.on=p.health=p.id==='nvidia'||p.id==='groq';p.confirm=false});cConsent(true);render()`);
setTimeout(async()=>{
  const chatRisk=()=>ev("S.settings.chatRisk"),cards=k=>ev(`S.chat.filter(m=>m.card&&m.card.kind==='${k}').length`);
  w.toast=()=>{};ev("toast=(m,u)=>{globalThis.__t=m;globalThis.__u=u}");
  { // sağlık notu taraması
    reset();
    ev("S.settings.healthNote='yedikten sonra kusuyorum';cNoteCheck()");
    ok("cNoteCheck: yeme bozukluğu notu chatRisk'e ed yazar",chatRisk().includes("ed"),chatRisk());
    ev("S.settings.healthNote='hamileyim';cNoteCheck()");
    ok("cNoteCheck: hamilelik notu preg yazar, ed korunur",chatRisk()==="ed,preg"||chatRisk()==="preg,ed",chatRisk());
    ev("S.settings.healthNote='göğsüm ağrıyor';cNoteCheck()");
    ok("cNoteCheck: acil belirti notu sohbete güvenlik kartı ekler",ev("S.chat.some(m=>m.card&&m.card.kind==='safety'&&m.card.level==='emergency')"));
    reset();ev("S.settings.healthNote='iyi durumdayım';cNoteCheck()");
    ok("cNoteCheck: temiz not risk ve kart üretmez",chatRisk()===""&&cards("safety")===0);
    ok("sağlık notu kaydı cNoteCheck'i çağırır",/health:\(\)=>\{S\.settings\.healthNote=[^}]*cNoteCheck\(\)/.test(require("./html").full()));
  }
  { // menü notu hamilelik ve yeme bozukluğu
    reset();let n=0;fetchWith(()=>{n++;return reply({reply:"x"})});
    ev("S.settings.kcal=2000;menuNote='hamileyim, fıstık alerjisi'");await ev("cMenu()");
    ok("menü notunda hamilelik: istek gitmez, chatRisk preg, yanıtsız kullanıcı mesajı kalmaz",n===0&&chatRisk().includes("preg")&&ev("S.chat.length")===0,[n,chatRisk()]);
    ev("menuNote='yedikten sonra kusuyorum'");await ev("cMenu()");
    ok("menü notunda yeme bozukluğu: istek gitmez, chatRisk ed",n===0&&chatRisk().includes("ed"));
  }
  { // sağlayıcı zinciri
    reset();fetchWith((u,o,i)=>i===1?fail(500):reply({reply:"merhaba",log:[]}));
    let r=await ev("cAsk([{role:'user',content:'x'}],50)");
    ok("zincir: 1. sağlayıcı hata verirse 2.'ye geçer",r.provider.id==="groq"&&urls.length===2&&/nvidia/.test(urls[0])&&/groq/.test(urls[1]),urls);
    ok("zincir: 500 hatalı sağlayıcıya kısa bekleme kaydı düşer, başarılıya düşmez",ev("cool.nvidia>Date.now()&&cool.nvidia<Date.now()+60000&&!cool.groq"));
    ev("cool={};S.providers[0].confirm=S.providers[1].confirm=true;w=0");w.confirm=()=>false;fetchWith(()=>reply({reply:"x"}));
    let e=await ev("cAsk([{role:'user',content:'x'}],50).catch(e=>e.message)");
    ok("zincir: tüm onaylar reddedilirse declined, istek gitmez",e==="declined"&&urls.length===0,[e,urls]);
    w.confirm=()=>true;ev("S.providers.forEach(p=>p.confirm=false);cool={}");
    fetchWith(()=>{throw new TypeError("Failed to fetch")});
    e=await ev("cAsk([{role:'user',content:'x'}],50).catch(e=>e.message)");
    ok("zincir: hepsi başarısızsa fail; ağ hatası için bekleme kaydı",e==="fail"&&urls.length===2&&ev("cool.nvidia>Date.now()&&cool.groq>Date.now()"),[e,urls]);
    ev("cSend('merhaba')");await wait(100);
    ok("hepsi başarısız: sohbet çevrimdışı durumuna geçer, mesaj bekleyen kalır",ev("offline")==="none"||ev("offline")==="fail");
    reset();fetchWith(()=>fail(404));await ev("cAsk([{role:'user',content:'x'}],50).catch(()=>0)");
    ok("model hatası (404) için bekleme kaydı",ev("cool.nvidia>Date.now()+60000"));
    reset();fetchWith(()=>reply({reply:"x"}));ev("cool.nvidia=Date.now()+1e6");
    await ev("cAsk([{role:'user',content:'x'}],50)");
    ok("beklemedeki sağlayıcı atlanır",urls.length===1&&/groq/.test(urls[0]));
  }
  { // anahtar kaydedilince bekleme silinir
    reset();ev("cool.groq=Date.now()+1e6;cSheetProv('groq');document.querySelector('#pk').value='gsk_yeni_anahtar'");ev("pRead('groq')");
    ok("pRead yeni anahtar kaydedince cool siler",ev("cool.groq")===undefined&&ev("KEYS.groq")==="gsk_yeni_anahtar");
  }
  { // act: program/menü alanı yeniden sorma tetiklemez; istek başarısız olunca yanıtsız mesaj kalmaz
    reset();let n=0;fetchWith(()=>{n++;return reply({reply:"Tamam",menu:{days:[]},program:{days:[]}})});
    ev("cSend('2 yumurta yedim')");await wait(150);
    ok("yediğini yazıp yalnız program/menü alanı gelirse log sayılmaz: bir kez yeniden sorulur",n===2,n);
    reset();fetchWith(()=>{throw new TypeError("x")});
    await ev("cComment('plan')");
    ok("yorum isteği hata verirse yanıtsız kullanıcı mesajı kalmaz",ev("S.chat.length")===0&&ev("busy")===false);
    reset();let sent;fetchWith((u,o)=>{sent=JSON.parse(o.body);return reply({reply:"Bugün iyi"})});
    await ev("cComment('plan')");
    ok("yorum isteği kullanıcı metni çift gitmez",sent.messages.filter(m=>m.role==="user").length===1,sent.messages.map(m=>m.role));
    reset();fetchWith(()=>reply({reply:"Program yok"}));await ev("cProgram({d:3,q:'Salon',m:45,l:'Başlangıç'})");
    ok("program okunamazsa kullanıcı isteği sohbette yanıtsız kalmaz",ev("S.chat.length")===0);
    fetchWith(()=>{throw new TypeError("x")});ev("cool={}");await ev("cMenu()").catch(()=>0);
  }
  { // sohbet geçmişi sabiti ve rıza metni
    reset();ev("for(let i=0;i<15;i++)cPush({role:i%2?'coach':'user',text:'m'+i})");
    ok("cMessages geçmişi HIST_N mesajdır ve rıza metni aynı sayıyı söyler",ev("cMessages(null).length")===1+ev("HIST_N")&&ev("CONSENT_SENT").includes(`son ${ev("HIST_N")} sohbet mesajı`)&&ev("HIST_N")===10);
  }
  { // sohbet yönetimi
    reset();ev("cPush({role:'user',text:'a'});busy=true");ev("cClearChat()");
    ok("meşgulken sohbet temizlenmez",ev("S.chat.length")===1);
    ev("busy=false;S.chat.forEach(m=>m.pend=false)");ev("cClearChat()");
    ok("boştayken temizlenir",ev("S.chat.length")===0);
    ev("cPush({role:'coach',text:'',card:{kind:'safety',level:'emergency'}});cNewChat()");
    ok("yalnız güvenlik kartı olan sohbet de arşivlenir",ev("S.chats.length")===1&&ev("S.chat.length")===0);
    ev("S.chats=[];for(let i=0;i<2;i++){cPush({role:'user',text:'k'+i});S.chat.forEach(m=>m.pend=false);cNewChat()}");
    ok("arşiv kimlikleri aynı milisaniyede çakışmaz",ev("new Set(S.chats.map(c=>c.id)).size")===2);
    ev("S.chats=[];globalThis.__t='';for(let i=0;i<21;i++){cPush({role:'user',text:'s'+i});S.chat.forEach(m=>m.pend=false);cNewChat()}");
    ok("arşiv sınırı aşılınca en eski sohbet atılır ve kullanıcı uyarılır",ev("S.chats.length")===20&&/Arşiv sınırı/.test(ev("__t")),ev("__t"));
    reset();ev("busy=false;typing=false;cPush({role:'user',text:'gönderilemeyen',pend:true})");
    ok("gönderilememiş (Gönderilmedi) mesaj Yeni sohbeti engellemez, arşive bekleyen bayrağı olmadan girer",ev("S.chat.some(m=>m.pend)")===true&&(ev("cNewChat()"),ev("S.chat.length")===0&&ev("S.chats.length")===1&&!ev("S.chats[0].msgs.some(m=>m.pend)")));
    reset();ev("cPush({role:'user',text:'x'});busy=true");ev("cNewChat()");
    ok("Koç gerçekten yanıt verirken (busy) sohbet değişmez",ev("S.chat.length")===1);ev("busy=false");
  }
  { // cApplyLog yolları
    reset();ev("add('weight',80,'',dayKey())");
    const card=items=>{ev(`S.chat=[];cPush({role:'coach',text:'x',card:{kind:'log',state:'pending',items:${JSON.stringify(items)}}})`);return ev("S.chat[0].id")};
    const el=ev("(()=>{const b=document.createElement('div');b.className='lcard';b.innerHTML='<input data-ck=\"0\" value=\"\">';document.body.appendChild(b);return b.firstChild})()");
    const apply=(id,e)=>{w.__el=e;ev(`cApplyLog(${id},__el)`)};
    let id=card([{type:"food",text:"dünkü pilav",kcal:300,day:"yesterday"}]);apply(id,el);
    ok("cApplyLog: dünkü yemek dün gününe yazılır, bugüne değil",ev("S.entries.filter(e=>e.type==='food'&&e.day===keyOff(-1)).length")===1&&ev("S.entries.filter(e=>e.type==='food'&&e.day===dayKey()).length")===0);
    ok("cApplyLog: kart ok olur",ev("S.chat[0].card.state")==="ok");
    ev("__u()");ev("S.entries.length");
    ok("cApplyLog: Geri al kaydı siler ve kartı yeniden açar",ev("S.entries.filter(e=>e.type==='food').length")===0&&ev("S.chat[0].card.state")==="pending");
    ev("S.entries=S.entries.filter(e=>e.type==='weight')");
    id=card([{type:"food",text:"çorba",kcal:200}]);apply(id,el);
    ok("cApplyLog: kalori kutusu boşaltılırsa kcal null kaydedilir, 5000 üstü kırpılır",ev("S.chat[0].card.items[0].kcal")===null);
    ev("S.entries=S.entries.filter(e=>e.type==='weight')");
    id=card([{type:"exercise",min:30,name:"Koşu",kcal:5000}]);apply(id,el);
    const sp=ev("S.entries.find(e=>e.type==='exercise')");
    ok("cApplyLog: Koç'un abartılı spor kalorisi uygulamanın MET hesabıyla değiştirilir",sp&&sp.kcal>0&&sp.kcal<500&&ev("spKcal({name:'Koşu',min:30,kcal:5000}).off")===true,sp);
    ev("__u()");
    ok("cApplyLog: spor kaydı geri alınır",ev("S.entries.filter(e=>e.type==='exercise').length")===0&&ev("S.chat[0].card.state")==="pending");
  }
  { // context rows are per-day totals
    reset();
    ev(`const y=keyOff(-1);S.entries=[{id:1,day:y,time:'08:00',type:'food',v:300,p:20,text:'a'},{id:2,day:y,time:'12:00',type:'food',v:200,p:5,text:'b'},{id:3,day:y,time:'09:00',type:'water',v:250,text:''},{id:4,day:y,time:'09:00',type:'exercise',v:30,text:'x'},{id:5,day:y,time:'10:00',type:'steps',v:9000,hc:1,ph:4000,text:''},{id:6,day:keyOff(-2),time:'08:00',type:'food',v:111,text:'c'}];S.mood=[{day:y,v:4},{day:y,v:2}]`);
    const row=ev("cData().days.find(r=>r.d===keyOff(-1).slice(5))");
    ok("cData: a day row sums food, protein, water, exercise and phone steps (watch steps excluded); the first mood of the day wins",row.kcal===500&&row.p===25&&row.water===250&&row.sport===30&&row.ad===4000&&row.mo===4,row);
    ok("cData: another day's entries stay in their own row",ev("cData().days.find(r=>r.d===keyOff(-2).slice(5)).kcal")===111);
  }
  { // the model list request has its own timeout
    reset();const st=w.setTimeout;w.setTimeout=(f,ms,...a)=>st(f,ms===15000?5:ms,...a);
    fetchWith((u,o)=>new Promise((_,rej)=>o.signal.addEventListener("abort",()=>rej(Object.assign(new Error("aborted"),{name:"AbortError"})))));
    const r=await ev("fetchModels(S.providers[0],'k').then(()=>'ok',e=>errOf(e).kind)");
    w.setTimeout=st;
    ok("fetchModels: a model list request that never answers is aborted and classified as a timeout",r==="time",r);
  }
  console.log(bad?`${bad} başarısız`:"Koç davranış testleri geçti");
  process.exit(bad?1:0);
},300);
