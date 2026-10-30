/* Menu and shopping list. */
const {ok,finish}=require("./ok");
const {boot,until,flush}=require("./html");
const errs=[];
(async()=>{
  const w=await boot(w=>{
    // worst case: weekday, today's medication doses past due and unlogged (on a weekend the context is 200+ characters shorter)
    w.eval(`{const o=Date.parse("2026-10-06T22:00")-Date.now();Date=class extends Date{constructor(...a){super(...(a.length?a:[Date.now()]))}static now(){return super.now()+o}}}`);
    Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.addEventListener("error",e=>errs.push(e.message));
  });
  const ev=s=>w.eval(s);
  {
    const doc=w.document,q=s=>doc.querySelector(s),sh=()=>q("#sheet").textContent,click=s=>q(s).click();
    let sent=null,reply={reply:"Menün hazır",menu:null},fetched=0;
    w.fetch=async(u,o)=>{fetched++;sent=JSON.parse(o.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}};
    const base=`S=structuredClone(DEF);S.settings.obDone=true;Object.assign(S.settings,{kcal:2000,heightCm:175,age:30,goalKg:0,healthNote:''});S.providers.forEach(p=>p.on=p.health=true);setKey('groq','K1');S.settings.consent=true;S.settings.consentP="gemini,groq,openrouter,openai,anthropic";S.settings.consentV=CONSENT_V;tab='coach';render()`;
        ev(base.replace("S.settings.consent=true;","S.settings.consent=false;").replace("setKey('groq','K1');","KEYS={};"));
        ok("without consent the Coach menu button states the reason and stays enabled for on-device generation",!q('[data-c="menu"]').disabled&&q('[data-c="menu"]').textContent.includes("cihazda")&&q("#view").textContent.includes("veri paylaşımını kabul et"));
        ev(base.replace("setKey('groq','K1');","KEYS={};"));
        ok("without a key the Coach menu states the reason (key needed) and the button is enabled",!q('[data-c="menu"]').disabled&&q("#view").textContent.includes("Rehber anahtarı gerekli"));
    ev(base);
    ok("with consent and a key the menu button is the Coach menu, with no reason text",!q('[data-c="menu"]').disabled&&!q("#view").textContent.includes("Rehber menüsü için"));
    // worst case: 30 foods (60-character names), 20 favorites, 20 templates, 14 filled days, a long health note and chat history
    ev(`S.myFoods=Array.from({length:30},(_,i)=>({n:'Besin '+i+' '+'a'.repeat(50),k:200+i,p:5,c:20,f:5,...(i%3?{u:[['1 adet (50 g)',50]]}:{})}));S.favFoods=Array.from({length:20},(_,i)=>({text:'Favori '+i+'|'+'b'.repeat(80),v:300,p:10}));S.mealTpl=Array.from({length:20},(_,i)=>({id:i+1,n:'Şablon '+i,items:[{text:'x',v:100,p:3},{text:'y',v:200,p:4}]}));S.recipes=[{id:1,n:'GizliTarifAdi',s:2,items:[{n:'GizliMalzeme',g:100,k:100}]}];S.settings.healthNote='x'.repeat(300);for(let i=0;i<14;i++){const k=keyOff(-i);add('weight',80,'',k);for(let j=0;j<4;j++){const e=add('food',650,'öğün',k);e.p=35}add('water',2500,'',k);add('exercise',45,'Yürüyüş',k);add('steps',12345,'',k);add('note',null,'n'.repeat(100),k);S.sleep.push({day:k,min:450});S.mood.push({day:k,v:4})}S.chat=[{id:1,role:'user',text:'z'.repeat(600),t:1},{id:2,role:'coach',text:'y'.repeat(1500),t:2}];S.cid=3`);
    const cc=ev("(()=>{const c=cMenuCat();return {n:c.text.split('\\n').length,first:c.text.split('\\n')[0],ids:Object.keys(c.cat),text:c.text}})()");
    ok("the catalog has at most 60 lines, my foods first, line format id|name|kcal|protein, '|' is stripped, recipes are not sent",cc.n===60&&/^m0\|Besin 0 a+( 50 g)?\|\d+\|\d+$/.test(cc.first)&&cc.text.split("\n").every(l=>l.split("|").length===4)&&cc.ids.some(i=>i[0]==="f")&&cc.ids.some(i=>i[0]==="t")&&cc.ids.some(i=>i[0]==="b")&&!cc.text.includes("Gizli"),cc.first);
    await ev("(()=>{menuNote='n'.repeat(200);S.settings.kcal=2000;S.settings.healthNote='';return cMenu()})()");
    const tot=sent.messages.reduce((a,m)=>a+m.content.length,0);
    {const sys0=sent.messages[0].content;ok("menu request: only the profile line and the calorie target reach the model, no records, notes or medication",sys0.includes("PROFİL:")&&sys0.includes("Hedef günlük 2000 kcal")&&!/SON 14 GÜN|BUGÜN:|SON NOTLAR|İLAÇ|HESAPLANAN|SAĞLIK NOTU/.test(sys0));}
    ok("in the worst case (60-line catalog, 14 days, 200-character restriction note) the real request's total context is < 9000 characters",tot<9000&&sent.messages.length===2,tot);
    // realistic worst case: 12 medications (6 times), 10 long meals today, 12 long chat messages, 500-character health note, 3 workouts
    ev(base+";S.settings.healthNote='h'.repeat(500);S.entries=[];S.meds=Array.from({length:12},(_,i)=>({id:i+1,n:'İlaç '+i+' '+'a'.repeat(34),d:'d'.repeat(30),t:['06:00','09:00','12:00','15:00','18:00','21:00'],w:[1,2,3,4,5],on:true,k:50}));S.settings.medOn=true;for(let i=0;i<14;i++){add('weight',80,'',keyOff(-i));add('food',500,'y',keyOff(-i))}for(let i=0;i<10;i++)add('food',500,'Uzun yemek adı '+'b'.repeat(80));for(let i=0;i<9;i++)add('water',250,'');for(let i=0;i<8;i++)add('exercise',30,'s'.repeat(60));for(let i=0;i<6;i++)add('note',null,'n'.repeat(300));add('steps',500,'');S.chat=Array.from({length:12},(_,i)=>({id:i+1,role:i%2?'coach':'user',text:'m'.repeat(1500),t:i+1}));S.cid=13;S.workouts=Array.from({length:3},(_,i)=>({id:i+1,day:keyOff(-i),t0:Date.now()-i*1e6-1e5,t1:Date.now()-i*1e6,name:'Antrenman '+i,ex:CORE_EX.slice(0,12).map(id=>({id,note:'',sets:[{kg:100,reps:10,done:true}]}))}))");
    ok("chat history is the last 10 messages, each at most 300 characters",ev("cMessages('x').length")===12&&ev("cMessages('x').slice(1,11).every(m=>m.role==='user'?m.content.length===300:JSON.parse(m.content).reply.length===260)"));
    const size=()=>sent.messages.reduce((a,m)=>a+m.content.length,0),LIM={chat:11800,menu:11300,program:13000},got={};
    sent=null;ev("cSend('merhaba')");await until(()=>sent);got.chat=size();
    sent=null;ev("menuNote='n'.repeat(200)");await ev("cMenu()");got.menu=size();
    sent=null;ev("progOpt={d:6,q:'Salon',m:60,l:'İleri'}");await ev("cProgram(progOpt)");got.program=size();
    ok("in the worst case the chat, menu and program requests stay under their total context limits",Object.keys(LIM).every(k=>got[k]>0&&got[k]<LIM[k]),got);
    ev(base.replace("S.settings.consent=true;","S.settings.consent=true;S.settings.kcal=0;"));
    click('[data-c="menu"]');
    ok("without a calorie target and profile the menu page states the reason and Ask is disabled",sh().includes("kalori hedefi belirle")&&q('[data-c="menuask"]').disabled);
    ev(base);click('[data-c="menu"]');
    ok("menu page: target, restriction field, medical diet note, sending warning",sh().includes("~2000 kcal")&&!!q("#mnote")&&sh().includes("Tıbbi diyet ya da hastalık menüsü değildir")&&sh().includes("sağlayıcıya gönderilir")&&!q('[data-c="menuask"]').disabled);
    ev("S.myFoods=[{n:'Evin bulguru',k:340,p:11,u:[['1 porsiyon (100 g)',100]]},{n:'Yumurtam',k:140,p:12,u:[['1 adet (50 g)',50]]}];S.favFoods=[{text:'Ayran favorim',v:100,p:5}];S.recipes=[{id:1,n:'GizliTarifAdi',s:2,items:[{n:'GizliMalzeme',g:100,k:100}]}]");
    q("#mnote").value="fıstık alerjisi,   domuz yemem";sent=null;click('[data-c="menuask"]');await until(()=>sent);await flush();
    ok("request: no history (system + request), 2400 tokens, restriction note, CATALOG and only permitted data, medical diet ban",sent&&sent.messages.length===2&&sent.max_tokens===2400&&sent.messages[0].content.includes("fıstık alerjisi, domuz yemem")&&sent.messages[0].content.includes("KATALOG (kimlik|ad|kcal|protein):\nm0|Evin bulguru 100 g|340|11")&&sent.messages[0].content.includes("Yumurtam 50 g")&&sent.messages[0].content.includes("Ayran favorim")&&!JSON.stringify(sent).includes("Gizli")&&sent.messages[0].content.includes("Tıbbi diyet"),sent&&sent.messages[0].content.slice(-700));
    ok("a malformed reply (no menu field) gives no card and a warning",!ev("S.chat.some(m=>m.card&&m.card.kind==='menu')")&&q("#tmsg").textContent.includes("Menü okunamadı"));
    const day=(n,x)=>({n,meals:[{m:"breakfast",i:[["m1",2],["m0",1]]},{m:"lunch",i:[["m0",1.5],["b999",1],["zzz",1]]},{m:"dinner",i:[["f0",1],["m1",0.1]]},...(x||[])]});
    reply={reply:"Menün hazır",menu:{days:[day("Pazartesi"),day("Salı",[{m:"snack",i:[["m1",3]]}]),{n:"Kısa",meals:[{m:"breakfast",i:[["m0",1]]},{m:"lunch",i:[["m0",1]]}]},day("U".repeat(80))]}};
    await ev("(()=>{menuNote='';return cMenu()})()");
    const mc=ev("S.chat.find(m=>m.card&&m.card.kind==='menu')");
    ok("menu card: unknown ids dropped, days with fewer than 3 meals dropped, long name truncated, JSON not written into the text",mc&&mc.text==="Menün hazır"&&mc.card.days.length===3&&mc.card.days[0].meals[0].items.length===2&&mc.card.days[0].meals[1].items.length===1&&mc.card.days[2].n.length===30&&mc.card.kcal===2000,mc);
    const d0=mc.card.days[0];
    ok("item values scale with the portion multiplier: Yumurtam x2 = 140 kcal, 100 g, 2 pieces; bulgur x1 = 340; day total correct",d0.meals[0].items[0].k===140&&d0.meals[0].items[0].g===100&&d0.meals[0].items[0].a===2&&d0.meals[0].items[1].k===340&&d0.k===d0.meals.reduce((a,b)=>a+b.items.reduce((t,i)=>t+i.k,0),0)&&d0.meals[2].items[1].q===0.25,d0);
    ok("a day total outside +/-15% of the target is flagged (off) and shown on the card",d0.off===true&&q(`[data-mid="${mc.id}"]`).textContent.includes("Hedefin %15'inden fazla sapıyor"));
    ok("+/-15% bound: 1920 kcal / target 1900 unflagged; 500x3=1500 / target 2000 flagged",ev("CoachLib.cleanMenu({days:[{meals:[{m:'breakfast',i:[['a',1]]},{m:'lunch',i:[['a',1]]},{m:'dinner',i:[['a',1]]}]}]},{a:{n:'A',k:640}},1900).days[0].off")===false&&ev("CoachLib.cleanMenu({days:[{meals:[{m:'breakfast',i:[['a',1]]},{m:'lunch',i:[['a',1]]},{m:'dinner',i:[['a',1]]}]}]},{a:{n:'A',k:500}},2000).days[0].off")===true);
    ok("menu card: estimate label, medical diet note, Add to today per day, Shopping list",q(`[data-mid="${mc.id}"]`).textContent.includes("Tıbbi diyet ya da hastalık menüsü değildir")&&!!q(`[data-mid="${mc.id}"] .forecast`)&&doc.querySelectorAll(`[data-c^="menuday:${mc.id}"]`).length===3&&!!q(`[data-c="shop:${mc.id}"]`));
    const rt=JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.find(m=>m.card&&m.card.kind==="menu");
    ok("the menu card survives a reload (validated without ids)",rt&&rt.card.days.length===3&&rt.card.days[0].k===d0.k&&rt.card.days[0].off===true&&rt.card.kcal===2000&&Array.isArray(rt.card.chk));
    const gr=JSON.parse(ev(`JSON.stringify(cleanCoach({chat:[{id:1,role:'coach',text:'a',t:1,card:{kind:'menu',days:'x'}},{id:2,role:'coach',text:'b',t:1,card:{kind:'menu',kcal:99999,chk:[1,'a'],days:[{n:'G',meals:[{m:'zz',items:[{n:'A',q:1,k:100},{n:'',k:5},{n:'B',k:-1}]},{m:'lunch',items:[{n:'A',k:50}]},{m:'dinner',items:[{n:'C',k:70,p:'x',g:5}]}]}]}},{id:3,role:'coach',text:'c',t:1}]}))`));
    ok("cleaner: a junk card is dropped and other messages stay; invalid items, meal keys, target and checks are cleaned; old backups have no menu card",gr.chat.length===3&&!gr.chat[0].card&&gr.chat[1].card.kcal===null&&gr.chat[1].card.chk.join()==="a"&&gr.chat[1].card.days[0].meals[0].m==="snack"&&gr.chat[1].card.days[0].meals[0].items.length===1&&gr.chat[1].card.days[0].meals[2].items[0].p===null&&ev("cleanCoach({}).chat.length")===0,gr);
    ev("S.entries=[];S.mealTpl=[];S.nextId=1");
    click(`[data-c="menuday:${mc.id}:0"]`);click(`[data-c="menuadd:${mc.id}:0"]`);
    const ents=ev("S.entries.filter(e=>e.type==='food').map(e=>[e.meal,e.v,e.text])");
    ok("Add to today: the day's meals go in with entry.meal (breakfast/lunch/dinner), the portion multiplier in the text, values copied",ents.length===5&&ents.filter(e=>e[0]==="breakfast").length===2&&ents.filter(e=>e[0]==="lunch").length===1&&ents.filter(e=>e[0]==="dinner").length===2&&ents[0][2]==="Yumurtam × 2"&&ents[0][1]===140&&ev("S.entries[0].p")===12&&ev("S.entries[0].day")===ev("dayKey()"),ents);
    ev("undoLast()");
    ok("Undo: the added meals are removed",ev("S.entries.filter(e=>e.type==='food').length")===0);
    { // a day more than 15% off target and the calorie-deficit block need confirmation
      let msg="";w.confirm=m=>{msg=m;return false};const card=ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card"),n=()=>ev("S.entries.filter(e=>e.type==='food').length");
      click(`[data-c="menuday:${mc.id}:0"]`);click(`[data-c="menuadd:${mc.id}:0"]`);
      ok("an off-target day is not added without confirmation, the confirm text mentions 15%",n()===0&&msg.includes("%15"),msg);
      msg="";ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card.days[1].off=false");click(`[data-c="menuday:${mc.id}:1"]`);click(`[data-c="menuadd:${mc.id}:1"]`);
      ok("a day near the target is added without asking",msg===""&&n()>0);ev("undoLast()");
      ev("S.settings.healthNote='tansiyon'");ev(`{const c=S.chat.find(m=>m.card&&m.card.kind==='menu').card;c.days[1].off=false;c.days[1].k=c.kcal-100}`);msg="";
      click(`[data-c="menuday:${mc.id}:1"]`);click(`[data-c="menuadd:${mc.id}:1"]`);
      ok("under the calorie-deficit block a day below the target is not added without confirmation",n()===0&&msg.includes("Kalori açığı önerilmiyor"),msg);
      ev("S.settings.healthNote=''");w.confirm=()=>true;ev("S.entries=[]");
    }
    ev("{const c=S.chat.find(m=>m.card&&m.card.kind==='menu').card,L=Array.from({length:8},(_,i)=>({n:'K'+i,q:1,k:10,p:null,c:null,f:null,g:null,a:null}));c.days[0].meals[0].items=L;c.days[0].meals[1].items=L.slice()}");
    click(`[data-c="menuday:${mc.id}:0"]`);click(`[data-c="menutpl:${mc.id}:0"]`);
    ok("Make template: name 'Menü: day', at most 15 meals, warning",ev("S.mealTpl.length")===1&&ev("S.mealTpl[0].n")==="Menü: Pazartesi"&&ev("S.mealTpl[0].items.length")===15&&q("#toast").textContent.includes("ilk 15"));
    ev("undoLast()");ok("the template can be undone",ev("S.mealTpl.length")===0);
    const shr=[],wr=[];w.Capacitor={Plugins:{Filesystem:{writeFile:async o=>{wr.push(o);return {uri:"file:///cache/"+o.path}}},Share:{share:async o=>{shr.push(o)}}}};
    ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card.days=[{n:'A',k:0,off:false,meals:[{m:'breakfast',items:[{n:'Yumurta',q:2,k:140,g:100,a:2,p:null,c:null,f:null},{n:'Süt',q:1,k:120,g:200,a:null,p:null,c:null,f:null}]},{m:'lunch',items:[{n:'yumurta',q:1,k:70,g:50,a:1,p:null,c:null,f:null},{n:'Ayran favorim',q:2,k:200,g:null,a:null,p:null,c:null,f:null}]},{m:'dinner',items:[{n:'Süt',q:1,k:120,g:200,a:null,p:null,c:null,f:null}]}]}];render()");
    click(`[data-c="shop:${mc.id}"]`);
    ok("shopping list: the same food is summed (Yumurta 150 g · 3 adet, Süt 400 g), an item without grams shows the portion, local-only note",sh().includes("Yumurta150 g · 3 adet")&&sh().includes("Süt400 g")&&sh().includes("Ayran favorim2 porsiyon")&&sh().includes("hiçbir yere gönderilmedi"),sh());
    click(`[data-c="shopchk:${mc.id}:0"]`);
    ok("check off: visible and saved (survives a reload)",q('[data-c^="shopchk"]').getAttribute("aria-pressed")==="true"&&ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card.chk.length")===1&&JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.find(m=>m.card&&m.card.kind==="menu").card.chk.length===1);
    click(`[data-c="shopchk:${mc.id}:0"]`);
    ok("unchecking also removes the saved mark",ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card.chk.length")===0);
    click(`[data-c="shopchk:${mc.id}:1"]`);
    let clip="";Object.defineProperty(w.navigator,"clipboard",{value:{writeText:async t=>{clip=t}},configurable:true});
    click(`[data-c="shopcopy:${mc.id}"]`);await flush();
    ok("copy: title and lines, checked ones [x]",clip.startsWith("Alışveriş listesi\n")&&clip.includes("[ ] Ayran favorim: 2 porsiyon")&&clip.includes("[x] Süt: 400 g")&&clip.includes("[ ] Yumurta: 150 g · 3 adet"),clip);
    click(`[data-c="shopshare:${mc.id}"]`);await flush();
    ok("share: a single UTF-8 .txt file goes to the share sheet",wr.length===1&&/^neowell-liste-\d{4}-\d\d-\d\d\.txt$/.test(wr[0].path)&&wr[0].encoding==="utf8"&&wr[0].data===clip&&shr.length===1&&shr[0].files[0]==="file:///cache/"+wr[0].path);
    ev("closeSheet()");
    ev(base+";S.chat=[];S.settings.healthNote='tansiyon';S.settings.kcal=1500;for(let i=1;i<=7;i++)add('weight',70,'',keyOff(-i))");
    const hp=ev("cMenuPlan()");
    ok("calorie-deficit block (health note) + target below maintenance: the menu is at maintenance level, with a physician note",hp.held===true&&hp.kcal>1500&&hp.block.includes("Sağlık notun"),hp);
    ev("menuNote=''");reply={reply:"x",menu:null};
    await ev("cMenu()");
    ok("under the block the request says not to build a deficit without naming the reason",!sent.messages[0].content.includes("KISIT")&&!sent.messages[0].content.includes("Sağlık notunda")&&sent.messages[0].content.includes("Kalori açığı kurma"));
    ev(base+";S.chat=[];S.settings.healthNote='tansiyon';S.settings.kcal=1500;S.entries=[]");
    ok("block present but maintenance not computable (no weight records): no menu, the reason is stated",ev("cMenuPlan().why").includes("hekimine ya da diyetisyene danış"));
    ev(base+";S.chat=[{id:1,role:'user',text:'x',t:1,fl:'ed'}]");
    ok("an eating-pattern flag means no menu",ev("cMenuPlan().why").includes("kısıtlayıcı menü önermiyorum"));
    const f2=fetched;
    ev(base+";S.chat=[]");ev("menuNote='yediklerimi kusuyorum'");await ev("cMenu()");
    ok("a health-warning flag in the restriction note stops the request",fetched===f2&&q("#toast").textContent.includes("sağlık uyarısı"));
    ev(base.replace("S.settings.consent=true;","S.settings.consent=false;")+";S.chat=[]");ev("menuNote=''");await ev("cMenu()");
    ok("without consent cMenu makes no call",fetched===f2);
    // keyless local menu: no network, no key; the brake comes from the same cMenuPlan as the Coach menu
    const f3=fetched,noKey=base.replace("setKey('groq','K1');","KEYS={};").replace("S.settings.consent=true;","S.settings.consent=false;");
    ev(noKey+";S.chat=[]");ev("menuNote='fıstık alerjisi'");ev("cMenuLocal()");
    const lm=ev("S.chat.find(m=>m.card&&m.card.kind==='menu')");
    ok("without key and consent a local menu card appears, no network call, the restriction is applied",!!lm&&lm.card.days.length===7&&fetched===f3&&!JSON.stringify(lm.card).includes("ıstık"));
    ev("menuNote='';S.chat=[]");ev("S.chat=[{id:1,role:'user',text:'x',t:1,fl:'ed'}]");ev("cMenuLocal()");
    ok("an eating-pattern flag blocks the local menu too",!ev("S.chat.some(m=>m.card&&m.card.kind==='menu')")&&fetched===f3);
    ev(noKey+";S.chat=[];S.settings.healthNote='tansiyon';S.settings.kcal=1500;for(let i=1;i<=7;i++)add('weight',70,'',keyOff(-i))");ev("cMenuLocal()");
    const hk=ev("S.chat.find(m=>m.card&&m.card.kind==='menu')");
    ok("with the brake the local menu is at maintenance level only",!!hk&&hk.card.kcal>1500&&hk.card.days.every(d=>!d.off));
    ev(noKey+";S.chat=[];S.settings.healthNote='tansiyon';S.settings.kcal=1500;S.entries=[]");ev("cMenuLocal()");
    ok("brake present and maintenance unknown: no local menu",!ev("S.chat.some(m=>m.card&&m.card.kind==='menu')"));
    ev("S=structuredClone(DEF);S.settings.obDone=true;closeSheet();tab='today';render()");
  }
  ok("the page ran without errors",errs.length===0,errs);
  finish();
})();
