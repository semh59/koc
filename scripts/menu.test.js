const {JSDOM}=require("jsdom"),fs=require("fs"),path=require("path");let bad=0;
const www=f=>path.join(__dirname,"../www",f);
/* D-Koç1: menü ve alışveriş listesi. app.test.js'in uzun eşzamanlı zincirleriyle çakışmasın diye ayrı süreçte. */
const html=fs.readFileSync(www("index.html"),"utf8").replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>"<script>"+fs.readFileSync(www(f),"utf8")+"</script>");
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const errs=[];
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://localhost/",
  beforeParse(w){w.eval(`{const o=Date.parse("2026-10-06T22:00")-Date.now();Date=class extends Date{constructor(...a){super(...(a.length?a:[Date.now()]))}static now(){return super.now()+o}}}`); // en kötü durum: hafta içi, bugünün ilaç dozları vakti geçmiş ve kayıtsız (hafta sonu bağlam 200+ karakter kısa)
  Object.assign(w,{structuredClone,TextEncoder,TextDecoder,__noSelfTest:true});Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto});w.confirm=()=>true;w.scrollTo=()=>{};w.addEventListener("error",e=>errs.push(e.message))}
});
setTimeout(async()=>{
  const w=dom.window,ev=s=>w.eval(s),$q=s=>w.document.querySelector(s);
  w.HTMLElement.prototype.scrollIntoView=function(){};
  { // D-Koç1: haftalık menü ve alışveriş listesi
    const doc=w.document,q=s=>doc.querySelector(s),sh=()=>q("#sheet").textContent,wait=ms=>new Promise(r=>setTimeout(r,ms)),click=s=>q(s).click();
    let sent=null,reply={reply:"Menün hazır",menu:null},fetched=0;
    w.fetch=async(u,o)=>{fetched++;sent=JSON.parse(o.body);return {ok:true,json:async()=>({choices:[{message:{content:JSON.stringify(reply)}}]})}};
    const base=`S=structuredClone(DEF);S.settings.obDone=true;Object.assign(S.settings,{kcal:2000,heightCm:175,age:30,goalKg:0,healthNote:''});S.providers.forEach(p=>p.on=p.health=true);setKey('nvidia','K1');S.settings.consent=true;S.settings.consentP="gemini,groq,nvidia,openrouter,openai,anthropic";S.settings.consentV=CONSENT_V;tab='koc';render()`;
    ev(base.replace("S.settings.consent=true;","S.settings.consent=false;").replace("setKey('nvidia','K1');","KEYS={};"));
    ok("izin yokken Koç menüsü nedeni yazılı, düğme cihazda oluşturmaya açık",!q('[data-c="menu"]').disabled&&q('[data-c="menu"]').textContent.includes("cihazda")&&q("#view").textContent.includes("veri paylaşımını kabul et"));
    ev(base.replace("setKey('nvidia','K1');","KEYS={};"));
    ok("anahtar yokken Koç menüsü nedeni: anahtar yok, düğme açık",!q('[data-c="menu"]').disabled&&q("#view").textContent.includes("Koç anahtarı gerekli"));
    ev(base);
    ok("izin ve anahtar varken menü düğmesi Koç menüsü, neden yazısı yok",!q('[data-c="menu"]').disabled&&!q("#view").textContent.includes("Koç menüsü için"));
    // en kötü durum: 30 besin (60 karakter ad), 20 favori, 20 şablon, 14 dolu gün, uzun sağlık notu ve sohbet geçmişi
    ev(`S.myFoods=Array.from({length:30},(_,i)=>({n:'Besin '+i+' '+'a'.repeat(50),k:200+i,p:5,c:20,f:5,...(i%3?{u:[['1 adet (50 g)',50]]}:{})}));S.favFoods=Array.from({length:20},(_,i)=>({text:'Favori '+i+'|'+'b'.repeat(80),v:300,p:10}));S.mealTpl=Array.from({length:20},(_,i)=>({id:i+1,n:'Şablon '+i,items:[{text:'x',v:100,p:3},{text:'y',v:200,p:4}]}));S.recipes=[{id:1,n:'GizliTarifAdi',s:2,items:[{n:'GizliMalzeme',g:100,k:100}]}];S.settings.healthNote='x'.repeat(300);for(let i=0;i<14;i++){const k=keyOff(-i);add('kilo',80,'',k);for(let j=0;j<4;j++){const e=add('yemek',650,'öğün',k);e.p=35}add('su',2500,'',k);add('spor',45,'Yürüyüş',k);add('adim',12345,'',k);add('not',null,'n'.repeat(100),k);S.sleep.push({day:k,min:450});S.mood.push({day:k,v:4})}S.chat=[{id:1,role:'user',text:'z'.repeat(600),t:1},{id:2,role:'coach',text:'y'.repeat(1500),t:2}];S.cid=3`);
    const cc=ev("(()=>{const c=cMenuCat();return {n:c.text.split('\\n').length,first:c.text.split('\\n')[0],ids:Object.keys(c.cat),text:c.text}})()");
    ok("katalog en çok 60 satır, benim besinlerim önce, satır biçimi id|ad|kcal|protein, '|' temizlenir, tarif gitmez",cc.n===60&&/^m0\|Besin 0 a+( 50 g)?\|\d+\|\d+$/.test(cc.first)&&cc.text.split("\n").every(l=>l.split("|").length===4)&&cc.ids.some(i=>i[0]==="f")&&cc.ids.some(i=>i[0]==="t")&&cc.ids.some(i=>i[0]==="b")&&!cc.text.includes("Gizli"),cc.first);
    await ev("(()=>{menuNote='n'.repeat(200);S.settings.kcal=2000;S.settings.healthNote='';return cMenu()})()");
    const tot=sent.messages.reduce((a,m)=>a+m.content.length,0);
    console.log(`  menü isteği toplam bağlam ${tot} karakter`);
    {const sys0=sent.messages[0].content,full=ev("CoachLib.contextText(cData())").length,lean=ev("CoachLib.contextText(cData(),'x','menu')").length;
    console.log(`  menü bağlamı: tam ${full}, kısa ${lean} karakter`);
    ok("menü isteği: 14 gün tablosu, BUGÜN ve notlar yok; KISIT/profil/kalori hedefi var; bağlam tamdan en az 2 kat kısa",!/SON 14 GÜN|BUGÜN:|SON NOTLAR/.test(sys0.slice(sys0.indexOf("PROFİL:")))&&sys0.includes("PROFİL:")&&sys0.includes("HESAPLANAN:")&&sys0.includes("Hedef günlük 2000 kcal")&&lean*2<full,[lean,full]);}
    ok("en kötü durumda (60 satır katalog, 14 gün, 200 karakter kısıt notu) gerçek istek toplam bağlamı < 9000 karakter",tot<9000&&sent.messages.length===2,tot);
    // Dalga 11: gerçekçi en kötü durum: 12 ilaç (6 saat), bugün 10 uzun yemek, 12 uzun sohbet mesajı, 500 karakter sağlık notu, 3 antrenman
    ev(base+";S.settings.healthNote='h'.repeat(500);S.entries=[];S.meds=Array.from({length:12},(_,i)=>({id:i+1,n:'İlaç '+i+' '+'a'.repeat(34),d:'d'.repeat(30),t:['06:00','09:00','12:00','15:00','18:00','21:00'],w:[1,2,3,4,5],on:true,k:50}));S.settings.medOn=true;for(let i=0;i<14;i++){add('kilo',80,'',keyOff(-i));add('yemek',500,'y',keyOff(-i))}for(let i=0;i<10;i++)add('yemek',500,'Uzun yemek adı '+'b'.repeat(80));for(let i=0;i<9;i++)add('su',250,'');for(let i=0;i<8;i++)add('spor',30,'s'.repeat(60));for(let i=0;i<6;i++)add('not',null,'n'.repeat(300));add('adim',500,'');S.chat=Array.from({length:12},(_,i)=>({id:i+1,role:i%2?'coach':'user',text:'m'.repeat(1500),t:i+1}));S.cid=13;S.workouts=Array.from({length:3},(_,i)=>({id:i+1,day:keyOff(-i),t0:Date.now()-i*1e6-1e5,t1:Date.now()-i*1e6,name:'Antrenman '+i,ex:EXLIB.slice(0,12).map(e=>({id:e.id,note:'',sets:[{kg:100,reps:10,done:true}]}))}))");
    const ctx=ev("CoachLib.contextText(cData())");
    ok("bağlam: ilaç en çok 8 satır, yemek en çok 12 satır ve ad 40 karakter, su tek satır, boş 'not:' satırı yok",(ctx.match(/\| saatler /g)||[]).length===8&&(ctx.match(/yemek: /g)||[]).length===11&&!ctx.includes("b".repeat(41))&&(ctx.match(/; su \d+ ml/g)||[]).length===1&&!/^BUGÜN:.*not: (;|\()/m.test(ctx)&&ctx.includes("not: "+"n".repeat(100))&&!ctx.includes("n".repeat(101)),ctx.length);
    ok("sohbet geçmişi son 10 mesaj, her biri en çok 300 karakter",ev("cMessages('x').length")===12&&ev("cMessages('x').slice(1,11).every(m=>m.role==='user'?m.content.length===300:JSON.parse(m.content).reply.length===260)"));
    const size=()=>sent.messages.reduce((a,m)=>a+m.content.length,0),LIM={chat:11800,menu:11300,program:13000},got={};
    sent=null;ev("cSend('merhaba')");await wait(50);got.chat=size();
    sent=null;ev("menuNote='n'.repeat(200)");await ev("cMenu()");got.menu=size();
    sent=null;ev("progOpt={d:6,q:'Salon',m:60,l:'İleri'}");await ev("cProgram(progOpt)");got.program=size();
    console.log("  en kötü durum bağlam (karakter):",JSON.stringify(got));
    ok("en kötü durumda sohbet, menü ve program isteği toplam bağlamı sınırın altında (docs/plan-6-ozellik.md)",Object.keys(LIM).every(k=>got[k]>0&&got[k]<LIM[k]),got);
    ev(base.replace("S.settings.consent=true;","S.settings.consent=true;S.settings.kcal=0;"));
    click('[data-c="menu"]');
    ok("kalori hedefi ve profil yoksa menü sayfası nedenini yazar, İste kapalı",sh().includes("kalori hedefi belirle")&&q('[data-c="menuask"]').disabled);
    ev(base);click('[data-c="menu"]');
    ok("menü sayfası: hedef, kısıt alanı, tıbbi diyet notu, gönderim uyarısı",sh().includes("~2000 kcal")&&!!q("#mnote")&&sh().includes("Tıbbi diyet ya da hastalık menüsü değildir")&&sh().includes("sağlayıcıya gönderilir")&&!q('[data-c="menuask"]').disabled);
    ev("S.myFoods=[{n:'Evin bulguru',k:340,p:11,u:[['1 porsiyon (100 g)',100]]},{n:'Yumurtam',k:140,p:12,u:[['1 adet (50 g)',50]]}];S.favFoods=[{text:'Ayran favorim',v:100,p:5}];S.recipes=[{id:1,n:'GizliTarifAdi',s:2,items:[{n:'GizliMalzeme',g:100,k:100}]}]");
    q("#mnote").value="fıstık alerjisi,   domuz yemem";click('[data-c="menuask"]');await wait(30);
    ok("istek: geçmişsiz (sistem + istek), 2400 token, kısıt notu, KATALOG ve yalnız izinli veri, tıbbi diyet yasağı",sent&&sent.messages.length===2&&sent.max_tokens===2400&&sent.messages[0].content.includes("fıstık alerjisi, domuz yemem")&&sent.messages[0].content.includes("KATALOG (kimlik|ad|kcal|protein):\nm0|Evin bulguru 100 g|340|11")&&sent.messages[0].content.includes("Yumurtam 50 g")&&sent.messages[0].content.includes("Ayran favorim")&&!JSON.stringify(sent).includes("Gizli")&&sent.messages[0].content.includes("Tıbbi diyet"),sent&&sent.messages[0].content.slice(-700));
    ok("bozuk (menü alanı yok) yanıtta kart yok, uyarı",!ev("S.chat.some(m=>m.card&&m.card.kind==='menu')")&&q("#tmsg").textContent.includes("Menü okunamadı"));
    const day=(n,x)=>({n,meals:[{m:"kah",i:[["m1",2],["m0",1]]},{m:"ogl",i:[["m0",1.5],["b999",1],["zzz",1]]},{m:"aks",i:[["f0",1],["m1",0.1]]},...(x||[])]});
    reply={reply:"Menün hazır",menu:{days:[day("Pazartesi"),day("Salı",[{m:"atis",i:[["m1",3]]}]),{n:"Kısa",meals:[{m:"kah",i:[["m0",1]]},{m:"ogl",i:[["m0",1]]}]},day("U".repeat(80))]}};
    await ev("(()=>{menuNote='';return cMenu()})()");
    const mc=ev("S.chat.find(m=>m.card&&m.card.kind==='menu')");
    ok("menü kartı: bilinmeyen kimlik atıldı, 3 öğünden azı olan gün atıldı, uzun ad kesildi, JSON metne yazılmadı",mc&&mc.text==="Menün hazır"&&mc.card.days.length===3&&mc.card.days[0].meals[0].items.length===2&&mc.card.days[0].meals[1].items.length===1&&mc.card.days[2].n.length===30&&mc.card.kcal===2000,mc);
    const d0=mc.card.days[0];
    ok("kalem değerleri porsiyon çarpanıyla: Yumurtam ×2 = 140 kcal, 100 g, 2 adet; bulgur ×1 = 340; gün toplamı doğru",d0.meals[0].items[0].k===140&&d0.meals[0].items[0].g===100&&d0.meals[0].items[0].a===2&&d0.meals[0].items[1].k===340&&d0.k===d0.meals.reduce((a,b)=>a+b.items.reduce((t,i)=>t+i.k,0),0)&&d0.meals[2].items[1].q===0.25,d0);
    ok("gün toplamı hedefin ±%15'i dışındaysa işaretlenir (off) ve kartta yazar",d0.off===true&&q(`[data-mid="${mc.id}"]`).textContent.includes("Hedefin %15'inden fazla sapıyor"));
    ok("±%15 sınırı: 1920 kcal / hedef 1900 işaretsiz; 500×3=1500 / hedef 2000 işaretli",ev("CoachLib.cleanMenu({days:[{meals:[{m:'kah',i:[['a',1]]},{m:'ogl',i:[['a',1]]},{m:'aks',i:[['a',1]]}]}]},{a:{n:'A',k:640}},1900).days[0].off")===false&&ev("CoachLib.cleanMenu({days:[{meals:[{m:'kah',i:[['a',1]]},{m:'ogl',i:[['a',1]]},{m:'aks',i:[['a',1]]}]}]},{a:{n:'A',k:500}},2000).days[0].off")===true);
    ok("menü kartı: tahmin etiketi, tıbbi diyet notu, gün başına Bugüne ekle, Alışveriş listesi",q(`[data-mid="${mc.id}"]`).textContent.includes("Tıbbi diyet ya da hastalık menüsü değildir")&&!!q(`[data-mid="${mc.id}"] .tahmin`)&&doc.querySelectorAll(`[data-c^="menuadd:${mc.id}"]`).length===3&&!!q(`[data-c="shop:${mc.id}"]`));
    const rt=JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.find(m=>m.card&&m.card.kind==="menu");
    ok("menü kartı yeniden yüklemede kalır (kimliksiz doğrulama)",rt&&rt.card.days.length===3&&rt.card.days[0].k===d0.k&&rt.card.days[0].off===true&&rt.card.kcal===2000&&Array.isArray(rt.card.chk));
    const gr=JSON.parse(ev(`JSON.stringify(cleanCoach({chat:[{id:1,role:'coach',text:'a',t:1,card:{kind:'menu',days:'x'}},{id:2,role:'coach',text:'b',t:1,card:{kind:'menu',kcal:99999,chk:[1,'a'],days:[{n:'G',meals:[{m:'zz',items:[{n:'A',q:1,k:100},{n:'',k:5},{n:'B',k:-1}]},{m:'ogl',items:[{n:'A',k:50}]},{m:'aks',items:[{n:'C',k:70,p:'x',g:5}]}]}]}},{id:3,role:'coach',text:'c',t:1}]}))`));
    ok("temizleyici: çöp kart atılır diğer mesajlar kalır; geçersiz kalem, öğün anahtarı, hedef ve işaret çöpü ayıklanır; eski yedekte menü kartı yok",gr.chat.length===3&&!gr.chat[0].card&&gr.chat[1].card.kcal===null&&gr.chat[1].card.chk.join()==="a"&&gr.chat[1].card.days[0].meals[0].m==="atis"&&gr.chat[1].card.days[0].meals[0].items.length===1&&gr.chat[1].card.days[0].meals[2].items[0].p===null&&ev("cleanCoach({}).chat.length")===0,gr);
    // günlüğe ve şablona
    ev("S.entries=[];S.mealTpl=[];S.nextId=1");
    click(`[data-c="menuadd:${mc.id}:0"]`);
    const ents=ev("S.entries.filter(e=>e.type==='yemek').map(e=>[e.meal,e.v,e.text])");
    ok("Bugüne ekle: günün yemekleri entry.meal ile (kah/ogl/aks), porsiyon çarpanı metinde, değerler kopyalanır",ents.length===5&&ents.filter(e=>e[0]==="kah").length===2&&ents.filter(e=>e[0]==="ogl").length===1&&ents.filter(e=>e[0]==="aks").length===2&&ents[0][2]==="Yumurtam × 2"&&ents[0][1]===140&&ev("S.entries[0].p")===12&&ev("S.entries[0].day")===ev("dayKey()"),ents);
    ev("lastUndo()");
    ok("Geri al: eklenen yemekler gider",ev("S.entries.filter(e=>e.type==='yemek').length")===0);
    { // hedeften %15'ten fazla sapan gün ve kalori açığı engeli onay ister
      let msg="";w.confirm=m=>{msg=m;return false};const card=ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card"),n=()=>ev("S.entries.filter(e=>e.type==='yemek').length");
      click(`[data-c="menuadd:${mc.id}:0"]`);
      ok("sapan gün (off) onaysız eklenmez, onay metni %15'i söyler",n()===0&&msg.includes("%15"),msg);
      msg="";ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card.days[1].off=false");click(`[data-c="menuadd:${mc.id}:1"]`);
      ok("hedefe yakın gün onay sormadan eklenir",msg===""&&n()>0);ev("lastUndo()");
      ev("S.settings.healthNote='tansiyon'");ev(`{const c=S.chat.find(m=>m.card&&m.card.kind==='menu').card;c.days[1].off=false;c.days[1].k=c.kcal-100}`);msg="";
      click(`[data-c="menuadd:${mc.id}:1"]`);
      ok("kalori açığı engelinde hedefin altındaki gün onaysız eklenmez",n()===0&&msg.includes("Kalori açığı önerilmiyor"),msg);
      ev("S.settings.healthNote=''");w.confirm=()=>true;ev("S.entries=[]");
    }
    ev("{const c=S.chat.find(m=>m.card&&m.card.kind==='menu').card,L=Array.from({length:8},(_,i)=>({n:'K'+i,q:1,k:10,p:null,c:null,f:null,g:null,a:null}));c.days[0].meals[0].items=L;c.days[0].meals[1].items=L.slice()}");
    click(`[data-c="menutpl:${mc.id}:0"]`);
    ok("Şablon yap: ad 'Menü: gün', en çok 15 yemek, uyarı",ev("S.mealTpl.length")===1&&ev("S.mealTpl[0].n")==="Menü: Pazartesi"&&ev("S.mealTpl[0].items.length")===15&&q("#toast").textContent.includes("ilk 15"));
    ev("lastUndo()");ok("şablon geri alınır",ev("S.mealTpl.length")===0);
    // alışveriş listesi
    const shr=[],wr=[];w.Capacitor={Plugins:{Filesystem:{writeFile:async o=>{wr.push(o);return {uri:"file:///cache/"+o.path}}},Share:{share:async o=>{shr.push(o)}}}};
    ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card.days=[{n:'A',k:0,off:false,meals:[{m:'kah',items:[{n:'Yumurta',q:2,k:140,g:100,a:2,p:null,c:null,f:null},{n:'Süt',q:1,k:120,g:200,a:null,p:null,c:null,f:null}]},{m:'ogl',items:[{n:'yumurta',q:1,k:70,g:50,a:1,p:null,c:null,f:null},{n:'Ayran favorim',q:2,k:200,g:null,a:null,p:null,c:null,f:null}]},{m:'aks',items:[{n:'Süt',q:1,k:120,g:200,a:null,p:null,c:null,f:null}]}]}];render()");
    click(`[data-c="shop:${mc.id}"]`);
    ok("alışveriş listesi: aynı besin toplanır (Yumurta 150 g · 3 adet, Süt 400 g), gramsız kalem porsiyonla, yerel notu",sh().includes("Yumurta150 g · 3 adet")&&sh().includes("Süt400 g")&&sh().includes("Ayran favorim2 porsiyon")&&sh().includes("hiçbir yere gönderilmedi"),sh());
    click(`[data-c="shopchk:${mc.id}:0"]`);
    ok("işaretle: görünür ve kayıtlı (yeniden yüklemede kalır)",q('[data-c^="shopchk"]').getAttribute("aria-pressed")==="true"&&ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card.chk.length")===1&&JSON.parse(ev("JSON.stringify(cleanCoach(JSON.parse(JSON.stringify(S))))")).chat.find(m=>m.card&&m.card.kind==="menu").card.chk.length===1);
    click(`[data-c="shopchk:${mc.id}:0"]`);
    ok("işareti kaldırınca kayıt da gider",ev("S.chat.find(m=>m.card&&m.card.kind==='menu').card.chk.length")===0);
    click(`[data-c="shopchk:${mc.id}:1"]`);
    let clip="";Object.defineProperty(w.navigator,"clipboard",{value:{writeText:async t=>{clip=t}},configurable:true});
    click(`[data-c="shopcopy:${mc.id}"]`);await wait(20);
    ok("kopyala: başlık ve satırlar, işaretli [x]",clip.startsWith("Alışveriş listesi\n")&&clip.includes("[ ] Ayran favorim: 2 porsiyon")&&clip.includes("[x] Süt: 400 g")&&clip.includes("[ ] Yumurta: 150 g · 3 adet"),clip);
    click(`[data-c="shopshare:${mc.id}"]`);await wait(20);
    ok("paylaş: tek .txt dosyası, UTF-8, paylaşım ekranına gider",wr.length===1&&/^neowell-alisveris-\d{4}-\d\d-\d\d\.txt$/.test(wr[0].path)&&wr[0].encoding==="utf8"&&wr[0].data===clip&&shr.length===1&&shr[0].files[0]==="file:///cache/"+wr[0].path);
    // güvenlik kapıları
    ev("closeSheet()");
    ev(base+";S.chat=[];S.settings.healthNote='tansiyon';S.settings.kcal=1500;for(let i=1;i<=7;i++)add('kilo',70,'',keyOff(-i))");
    const hp=ev("cMenuPlan()");
    ok("kalori açığı engeli (sağlık notu) + hedef bakımın altında: menü bakım düzeyinde, hekim notu",hp.held===true&&hp.kcal>1500&&hp.block.includes("Sağlık notun"),hp);
    ev("menuNote=''");reply={reply:"x",menu:null};
    await ev("cMenu()");
    ok("engelde istek KISIT satırı taşır ve açık kurmamasını söyler",sent.messages[0].content.includes("KISIT var: Sağlık notunda hekim takibi")&&sent.messages[0].content.includes("kalori açığı kurma"));
    ev(base+";S.chat=[];S.settings.healthNote='tansiyon';S.settings.kcal=1500;S.entries=[]");
    ok("engel var ama bakım hesaplanamıyorsa (kilo kaydı yok) menü yok, nedeni yazar",ev("cMenuPlan().why").includes("hekimine ya da diyetisyene danış"));
    ev(base+";S.chat=[{id:1,role:'user',text:'x',t:1,fl:'ed'}]");
    ok("yeme düzeni işareti varsa menü yok",ev("cMenuPlan().why").includes("kısıtlayıcı menü önermiyorum"));
    const f2=fetched;
    ev(base+";S.chat=[]");ev("menuNote='yediklerimi kusuyorum'");await ev("cMenu()");
    ok("kısıt notunda sağlık uyarısı işareti varsa istek gitmez",fetched===f2&&q("#toast").textContent.includes("sağlık uyarısı"));
    ev(base.replace("S.settings.consent=true;","S.settings.consent=false;")+";S.chat=[]");ev("menuNote=''");await ev("cMenu()");
    ok("izin yokken cMenu çağrı yapmaz",fetched===f2);
    // Anahtarsız yerel menü: ağ yok, anahtar yok; fren Koç menüsüyle aynı cMenuPlan'dan
    const f3=fetched,noKey=base.replace("setKey('nvidia','K1');","KEYS={};").replace("S.settings.consent=true;","S.settings.consent=false;");
    ev(noKey+";S.chat=[]");ev("menuNote='fıstık alerjisi'");ev("cMenuLocal()");
    const lm=ev("S.chat.find(m=>m.card&&m.card.kind==='menu')");
    ok("anahtar ve izin yokken yerel menü kartı çıkar, ağ çağrısı yok, kısıt uygulanır",!!lm&&lm.card.days.length===7&&fetched===f3&&!JSON.stringify(lm.card).includes("ıstık"));
    ev("menuNote='';S.chat=[]");ev("S.chat=[{id:1,role:'user',text:'x',t:1,fl:'ed'}]");ev("cMenuLocal()");
    ok("yeme düzeni işaretinde yerel menü de yok",!ev("S.chat.some(m=>m.card&&m.card.kind==='menu')")&&fetched===f3);
    ev(noKey+";S.chat=[];S.settings.healthNote='tansiyon';S.settings.kcal=1500;for(let i=1;i<=7;i++)add('kilo',70,'',keyOff(-i))");ev("cMenuLocal()");
    const hk=ev("S.chat.find(m=>m.card&&m.card.kind==='menu')");
    ok("fren varken yerel menü yalnız bakım düzeyinde",!!hk&&hk.card.kcal>1500&&hk.card.days.every(d=>!d.off));
    ev(noKey+";S.chat=[];S.settings.healthNote='tansiyon';S.settings.kcal=1500;S.entries=[]");ev("cMenuLocal()");
    ok("fren var, bakım bilinmiyorsa yerel menü yok",!ev("S.chat.some(m=>m.card&&m.card.kind==='menu')"));
    ev("S=structuredClone(DEF);S.settings.obDone=true;closeSheet();tab='bugun';render()");
  }
  ok("sayfa hatasız çalıştı",errs.length===0,errs);
  console.log(bad?bad+" test başarısız":"TAMAM");process.exit(bad?1:0);
},100);
