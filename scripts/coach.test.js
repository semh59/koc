const C=require("../www/coachlib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
{ // B7: güvenlik kuralları; eski 3-6 aynen kalır
  const S=C.SYSTEM;
  ok("SYSTEM: eski kural 3-6 değişmedi",["3. Çok düşük kalori veya hızlı kilo kaybı önerme. Hamilelik, emzirme, 18 yaş altı, yeme bozukluğu geçmişi, ciddi hastalık veya ilaç kullanımı varsa kalori açığı önerme, hekime yönlendir.","4. Baş dönmesi, bayılma, göğüs ağrısı, nefes darlığı, çarpıntı gibi belirtilerde önce hekime başvurmasını söyle. Acil belirtilerde 112. \"flag\" alanına \"safety\" yaz.","5. İlaç, doz, takviye tedavisi önerme.","6. Yeme bozukluğu işareti görürsen kısıtlama önerme, yargılamadan bir uzmana yönlendir."].every(r=>S.includes(r)));
  const R=n=>S.split("\n").find(l=>l.startsWith(n+". "))||"",has=(l,...w)=>w.every(x=>l.includes(x));
  ok("SYSTEM: ağrı/sakatlıkta tanı-tedavi yok, hareketi bırak, hekim veya fizyoterapist",has(R(10),"ağrı","sakatlık","tanı koyma","tedavi","bırakmasını","hekime","fizyoterapist"));
  ok("SYSTEM: ilaç ve takviyede doz yorumu yok, hekim veya eczacı",has(R(11),"İlaç ve takviye","doz","hekime","eczacıya"));
  ok("SYSTEM: programda uyarı; hamilelik, 18 yaş altı, yeme bozukluğu kuralı",has(R(12),"Program önerirken","hekime danış","Hamilelik","18 yaş altında","Yeme bozukluğu"));
}
ok("baş dönmesi",C.redFlag("Bu sabah başım döndü")==="check");
ok("bayılma acil",C.redFlag("Bayılacak gibiyim")==="emergency");
ok("göğüs ağrısı",C.redFlag("göğsümde sıkışma var, nefes darlığı")==="emergency");
ok("büyük harf",C.redFlag("BAŞIM DÖNÜYOR")==="check");
ok("yeme bozukluğu",C.redFlag("yedikten sonra kusuyorum")==="ed");
ok("intihar",C.redFlag("yaşamak istemiyorum")==="mind");
ok("normal mesaj",C.redFlag("2 yumurta yedim")===null);
const p=C.parse('```json\n{"reply":"Merhaba","log":[{"type":"su","ml":250}],"propose":null,"flag":null}\n```');
ok("fence ayrıştır",p.reply==="Merhaba"&&p.log.length===1);
ok("metin içinde json",C.parse('Tabii: {"reply":"ok","log":[]} bitti').reply==="ok");
ok("JSON'dan sonra '}' içeren metin ayrıştırmayı bozmaz",(r=>r.reply==="ok"&&r.log.length===1)(C.parse('{"reply":"ok","log":[{"type":"su","ml":250}]} Not: {x} ve } işareti')));
ok("tırnak içindeki '}' dengelemeyi bozmaz",C.parse('Yanıt: {"reply":"a } b \\" c","log":[]} son}').reply==='a } b " c');
ok("json değilse düz metin",C.parse("Sadece metin").reply==="Sadece metin");
ok("bozuk json düz metne düşer",C.parse('{"reply":"x",').reply.length>0);
const it=C.cleanItems([{type:"yemek",text:"yumurta",kcal:140,protein:"12"},{type:"yemek",kcal:99999},{type:"su",ml:"250"},{type:"su",ml:5},{type:"kilo",kg:"83,7"},{type:"kilo",kg:5},{type:"spor",min:30},{type:"x"},null,{type:"not",text:" "}]);
ok("öğe doğrulama",it.length===4&&it[0].p===12&&it[2].kg===83.7&&it[3].name==="Spor",it);
ok("en fazla 12",C.cleanItems(Array(20).fill({type:"su",ml:250})).length===12);
ok("kcal alt sınır",C.clampKcal(900,{tdee:2400,bmr:1800}).kcal===1800&&C.clampKcal(900,{tdee:2400,bmr:1800}).limited);
ok("kcal geçerli",C.clampKcal(2000,{tdee:2400,bmr:1700}).kcal===2000&&C.clampKcal("abc")===null&&C.clampKcal(100)===null);
const t=C.contextText({profile:{cm:175,age:34,sex:"m",act:1,note:""},goals:{kg:75,kcal:1800,water:2500,sport:150},calc:{trendKg:84.1,slope:-0.6,tdee:2420,source:"veri",target:2110,protein:[136,187]},days:[{d:"2026-10-01",kg:83.7,kcal:1240,p:80,su:1200,sport:0}],today:["yemek ~220 kcal"],now:"12:42",workouts:[],notes:[]});
ok("bağlam kısa ve sayılı",t.includes("2420")&&t.includes("83,7")&&t.length<1200,t.length);
ok("hiç yemiyorum",C.redFlag("kilo için hiç yemiyorum")==="ed");
ok("hayatıma son",C.redFlag("hayatıma son vermek istiyorum")==="mind");
const fd=C.cleanFood({name:" 1 dilim pizza ",kcal:"280",protein:"12,5"});
ok("besin tahmini doğrulanır",fd&&fd.n==="1 dilim pizza"&&fd.k===280&&fd.p===12.5,fd);
ok("geçersiz besin atılır",C.cleanFood({name:"",kcal:200})===null&&C.cleanFood({name:"x",kcal:99999})===null&&C.cleanFood(null)===null);
ok("protein yoksa null",C.cleanFood({name:"çay",kcal:5}).p===null);
ok("yanıttaki food ayrıştırılır",C.parse('{"reply":"~280 kcal","food":{"name":"1 dilim pizza","kcal":280}}').food.kcal===280);

const K=["squat","bench","row","curl","ohp"],day=ex=>({n:"G",ex});
const pg=C.cleanProgram({name:"P",days:[day(["squat","uydurma","bench"]),day(["row","yok"]),day(["curl","ohp"]),day(K),day(K),day(K),day(K)]},K);
ok("cleanProgram: bilinmeyen kimlik ve 1 egzersizli gün atılır, 6 günde kesilir",pg.days.length===6&&pg.days[0].ex.join()==="squat,bench"&&pg.days[1].ex.join()==="curl,ohp",pg);
ok("cleanProgram: istenen gün sayısından fazlası kesilir, geçersiz istek 6'ya düşer",C.cleanProgram({days:[day(K),day(K),day(K),day(K)]},K,3).days.length===3&&C.cleanProgram({days:Array(7).fill(day(K))},K,9).days.length===6);
ok("cleanProgram: hepsi geçersizse ya da çöp girdide null, hata yok",C.cleanProgram({days:[day(["x","y"])]},K)===null&&C.cleanProgram("x",K)===null&&C.cleanProgram({days:"x"},K)===null&&C.cleanProgram({days:[null,{ex:[1,{}]}]},K)===null&&C.cleanProgram(null)===null);
ok("cleanProgram: en fazla 8 egzersiz, tekrar eden kimlik tekilleşir, ad varsayılanı",C.cleanProgram({days:[{ex:["squat","squat","bench"]}]},K).days[0].ex.length===2&&C.cleanProgram({days:[{ex:["squat","bench"]}]},K).name==="Koç programı");
ok("parse program anahtarını döndürür",C.parse('{"reply":"ok","program":{"name":"P","days":[]}}').program.name==="P"&&C.parse('{"reply":"ok"}').program===null&&C.parse("düz").program===null);
const EX=require("../www/exlib.js"),cat=o=>C.catalog(EX,o,["squat","bench","pullup","crunch"]);
const c1=cat({q:"Salon",l:"İleri"}),reg={};c1.forEach(e=>reg[e.r]=(reg[e.r]||0)+1);
ok("katalog: en fazla 60 satır, bölge başına 4, yalnız w/b, klasikler önce",c1.length<=60&&Object.values(reg).every(n=>n<=4)&&c1.every(e=>e.k==="w"||e.k==="b")&&c1[0].id==="squat",[c1.length,reg]);
const c2=cat({q:"Ev tipi",l:"Başlangıç"});
ok("katalog: ekipman ve seviye süzülür",c2.length>0&&c2.every(e=>e.q!=="Salon"&&e.l==="Başlangıç")&&cat({q:"Ağırlıksız",l:"Orta"}).every(e=>e.q==="Ağırlıksız"));
{ // D-Koç1: cleanMenu ve alışveriş listesi
  const mcat={a:{n:"A",k:100,p:5,g:50,a:1}},meal=(m,n=1)=>({m,i:Array.from({length:n},()=>["a",1])}),day=x=>({meals:x});
  const big=C.cleanMenu({days:Array.from({length:9},(_,i)=>day(["kah","ogl","aks","atis","atis","atis","atis","bilinmez"].map(m=>meal(m,10))))},mcat,2000);
  ok("cleanMenu: en çok 7 gün, günde 6 öğün, öğünde 8 kalem, bilinmeyen öğün anahtarı 'atis'",big.days.length===7&&big.days.every(d=>d.meals.length===6&&d.meals.every(b=>b.items.length===8)),big.days.map(d=>d.meals.length));
  ok("cleanMenu: kimliksiz/kataloğa olmayan besin atılır, boş öğün ve 3 öğünden az gün düşer, JSON dışı girdide null",C.cleanMenu({days:[day([meal("kah"),meal("ogl"),{m:"aks",i:[["x",1],"y",null]}])]},mcat,2000)===null&&C.cleanMenu(null,mcat)===null&&C.cleanMenu({days:"x"},mcat)===null&&C.cleanMenu({days:[]},mcat)===null);
  ok("cleanMenu: porsiyon çarpanı 0,25-4 aralığına kenetlenir, çöp 1 olur, virgüllü metin kabul",(r=>r.days[0].meals.map(b=>b.items[0].q).join()==="0.25,4,1,1.5")(C.cleanMenu({days:[day([{m:"kah",i:[["a",0.01]]},{m:"ogl",i:[["a",99]]},{m:"aks",i:[["a","x"]]},{m:"atis",i:[["a","1,5"]]}])]},mcat,2000)));
  ok("cleanMenu: id'siz kayıtlı kalem biçimi de doğrulanır, hedef 800-5000 dışında null",C.cleanMenu({days:[day(["kah","ogl","aks"].map(m=>({m,items:[{n:"A",q:1,k:700}]})))]},null,99999).kcal===null);
  ok("parse: menu anahtarı döner, yoksa null",C.parse('{"reply":"ok","menu":{"days":[]}}').menu.days.length===0&&C.parse('{"reply":"ok"}').menu===null&&C.parse("düz").menu===null);
  const sl=C.shopList({days:[{meals:[{m:"kah",items:[{n:"Yumurta",q:2,g:100,a:2},{n:"Süt",q:1,g:200,a:null}]}]},{meals:[{m:"kah",items:[{n:"yumurta",q:1,g:50,a:1},{n:"Ayran",q:1.5,g:null,a:null}]}]}]});
  ok("shopList: ad İ/I duyarsız toplanır, gram ve adet toplamı, gramsız kalem porsiyonla, Türkçe sıralı",sl.map(x=>x.n+":"+x.t).join("|")==="Ayran:1,5 porsiyon|Süt:200 g|Yumurta:150 g · 3 adet",sl);
}
ok("kural 3 KISIT satırına (riskFlags) bağlı: kalori açığı, oruç, yüksek protein",/3\.[^\n]*"KISIT"[^\n]*oruç[^\n]*protein/.test(C.SYSTEM)&&C.contextText({profile:{},goals:{},calc:{block:"x",why:"İlaç kaydın var"},days:[],today:[],now:"",workouts:[],notes:[]}).includes("KISIT: İlaç kaydın var"));
{ // sağlayıcı kurulumu
  const kp=["nvapi-x","gsk_x","sk-or-v1-x","AIzaSyx","sk-ant-api03-x","sk-proj-x","sk-x","abc"].map(C.keyProvider).join();
  ok("anahtar öneki sağlayıcıyı tahmin eder; sk-ant/sk-or genel sk'den önce",kp==="nvidia,groq,openrouter,gemini,anthropic,openai,openai,",kp);
  const ms=C.parseModels({data:[{id:"whisper-large-v3"},{id:"llama-3.3-70b-versatile"},{id:"models/gemini-3.5-flash-lite"},{id:"nvidia/nv-embedqa-mistral-7b-v2"},{id:"x/y:free",pricing:{prompt:"0",completion:"0"}},{id:"x/z",pricing:{prompt:"0.0000002",completion:"0.0000005"}},{id:"x/y:free"},null,{id:5}]});
  ok("model listesi: konuşma dışı modeller atılır, models/ öneki kırpılır, fiyat 0 ise ücretsiz",JSON.stringify(ms)==='[{"id":"gemini-3.5-flash-lite","free":null},{"id":"llama-3.3-70b-versatile","free":null},{"id":"x/y:free","free":true},{"id":"x/z","free":false}]',ms);
  ok("öneri canlı listedeki ilk tercih; tercih yoksa ücretsiz düşünmeyen model, o da yoksa null",C.pickModel("groq",[{id:"llama-3.1-8b-instant"},{id:"llama-3.3-70b-versatile"}])==="llama-3.3-70b-versatile"&&C.pickModel("openrouter",[{id:"a/r1-reasoning:free",free:true},{id:"b/c:free",free:true},{id:"d",free:false}])==="b/c:free"&&C.pickModel("nvidia",[{id:"q/w"}])===null);
  ok("OpenAI/Anthropic: listede konuşma dışı modeller atılır; tercih yoksa luna/haiku ailesi",C.parseModels({data:[{id:"dall-e-3"},{id:"gpt-realtime"},{id:"text-embedding-3-small"},{id:"gpt-7-luna"}]}).map(m=>m.id).join()==="gpt-7-luna"&&C.pickModel("openai",[{id:"gpt-6.1-sol"},{id:"gpt-7-luna"}])==="gpt-7-luna"&&C.pickModel("anthropic",[{id:"claude-opus-5-5"},{id:"claude-sonnet-5-5"}])==="claude-sonnet-5-5");
  ok("Gemini'de tercih yoksa en yakın flash modeli",C.pickModel("gemini",[{id:"gemini-9-pro"},{id:"gemini-4.1-flash"}])==="gemini-4.1-flash");
  const E=[[401,""],[400,'{"error":{"message":"Please pass a valid API key"}}'],[402,""],[429,'{"error":{"code":"insufficient_quota"}}'],[429,"Rate limit reached"],[404,""],[400,'{"error":{"message":"The model `x` does not exist"}}'],[503,""],[0,""],[418,""]].map(([s,b])=>C.errKind(s,b));
  ok("hata sınıfı: anahtar (401, Gemini 400), kota (402, insufficient_quota), hız limiti, model (404, 400 gövde), sunucu, ağ, diğer",E.join()==="key,key,quota,quota,limit,model,model,down,net,err",E);
  const N=[[404,'{"detail":"Function \'abc\': Not found for account \'xyz\'"}'],[410,'{"detail":"end of life 2026-08-26"}'],[404,"404 page not found"],[403,'{"detail":"Authorization failed"}']].map(([s,b])=>C.errKind(s,b));
  ok("NVIDIA yanıt şekilleri: hesapta yok (404 Function), emekli (410), düz metin 404 → model; 403 → anahtar",N.join()==="model,model,model,key",N);
  ok("adaylar: tercih sırası, sonra ücretsiz, sonra aile; listede olmayan tercih atlanır, emekli llama tercihte yok",JSON.stringify(C.candidates("nvidia",[{id:"google/gemma-4-31b-it"},{id:"nvidia/nemotron-3-super-120b-a12b"},{id:"meta/llama-3.3-70b-instruct"}]))==='["nvidia/nemotron-3-super-120b-a12b","google/gemma-4-31b-it"]'&&!C.MODEL_PREF.nvidia.includes("meta/llama-3.3-70b-instruct"));
  ok("zaman aşımı ayrı; her sınıfın Türkçe metni var, bilinmeyende kod yazılır",C.errKind(undefined,"","AbortError")==="time"&&["key","quota","limit","model","net","time","down","empty"].every(k=>C.errText(k).length>20&&!/HTTP/.test(C.errText(k)))&&C.errText("err",418).includes("418"));
}
{ // sohbetten öğüne ekle
  const good=C.parse('{"reply":"Afiyet olsun","log":[{"type":"yemek","text":"Menemen","g":250,"kcal":300,"protein":15,"carbs":10,"fat":22,"meal":"kah"},{"type":"yemek","text":"Simit","g":100,"kcal":280,"protein":9,"carbs":55,"fat":4}]}');
  const it=C.cleanItems(good.log);
  ok("iyi yanıt: her yemek ayrı, gram/makro/öğün alınır, öğün yoksa boş",it.length===2&&it[0].g===250&&it[0].c===10&&it[0].f===22&&it[0].meal==="kah"&&it[1].meal===undefined,it);
  ok("bozuk ya da yarım JSON: kart yok, düz metin kalır",C.parse('Afiyet olsun {"reply":"x","log":[{"type":"yemek"').log.length===0&&C.parse('Afiyet olsun {"reply":"x","log":[{"type":"yemek"').reply.startsWith("Afiyet olsun"));
  const evil=C.cleanItems([{type:"yemek",text:"<img src=x onerror=alert(1)>",kcal:-50,g:-5,carbs:99999,fat:"abc",meal:"gece<script>"},{type:"yemek",text:"x".repeat(500),kcal:"250"},{type:"yemek",text:"Çorba",kcal:1e9},...Array(20).fill({type:"yemek",text:"elma",kcal:52})]);
  ok("kötü niyetli/aşırı değer: negatif ve aşırı atılır, ad 120 karakter, öğün beyaz listede, en çok 12 satır",evil.length===12&&evil[0].kcal===null&&evil[0].g===undefined&&evil[0].c===undefined&&evil[0].f===undefined&&evil[0].meal===undefined&&evil[1].text.length===120&&evil[1].kcal===250&&evil[2].kcal===null);
  ok("kalori-makro tutarlılığı: ±%25 dışında uyarı, makro eksikse uyarı yok",!C.macroOff({kcal:300,p:15,c:10,f:22})&&C.macroOff({kcal:900,p:15,c:10,f:22})&&!C.macroOff({kcal:900,p:15,c:null,f:22}));
}
process.exit(bad?1:0);
