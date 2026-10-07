"use strict";
/* Koç: saf mantık (DOM ve depolama yok). Tarayıcıda global CoachLib, Node'da module.exports. */
const CoachLib=(()=>{
  const low=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();

  /* Uygulama tarafı güvenlik taraması: model yanıtından bağımsız çalışır. */
  const FLAGS=[
    ["mind",/intihar|kendime zarar|kendimi öldür|ölmek istiyorum|yaşamak istemiyorum|kendimi kes|hayatıma son|ölsem iyi|canıma kıy|kendimi as(?:mak|ıcam|acağım)|kendimi yok et|yaşamak istemiyor/],
    ["emergency",/bayılacak|bayılma|bayıldı(?!m)|göğüs(üm)? ağr|göğsüm sıkış|nefes darl|nefes alam|nefesim daral|felç|kan kus|kanlı kus|kolum uyuş|konuşam[ıi]yor|yüzüm kay/],
    ["ed",/yedikten sonra kus|kusmaya çalış|kusuyorum|tıkınıyorum|tıkınma|laksatif|yemek yemekten kork|günlerce aç|hiçbir şey yemiyorum|hiç yemiyorum|kilo vermek için kus|yemeyi bırak/],
    ["check",/baş(ım)? dön|başım dönüyor|çarpıntı|gözüm(ün önü)? karar|gözlerim karar|titreme|aşırı halsiz|çok halsiz/]
  ];
  /* "baklavaya bayılıyorum" deyimdir; "bayıldım/bayılıyorum" yalnız yiyecek ya da sevgi bağlamı yoksa acil sayılır. */
  const FAINT=/bayıl(?:ıyorum|ıyoruz|ırım|dım)/;
  /* Deyim yalnız sevilen şeyin hemen ardından gelen "bayıl" sözüdür ve metinden çıkarılır; kalan metinde gerçek bayılma ya da başka belirti aranır. */
  const IDIOM=/(?:yemek\w*|yemeğ\w*|baklava\w*|pizza\w*|çikolata\w*|tatlı\w*|börek\w*|kebap\w*|dondurma\w*|makarna\w*|kahve\w*|lezzet\w*|müzi[kğ]\w*|film\w*|dizi\w*|şarkı\w*|kitab\w*|kitap\w*|seni|sana|ona|buna|harika|güzel|muhteşem|[a-zçğıöşü]{3,}(?:ya|ye))\s+(?:çok\s+|gerçekten\s+)?bayıl\S*/g;
  const fold=s=>s.replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u");
  /* Türkçe harfsiz yazımı da yakalayan desenler (metin fold'lanmış); büyük harf low() ile gelir. */
  const FOLDED={
    emergency:/gog(?:u|)s\w*\s+(?:\w+\s+)?(?:agri(?!mi)|sikis)|kal(?:b\w*|p)\s+(?:\w+\s+)?agri(?!mi)|nefes\w*\s+(?:\w+\s+)?kesil|kalp kriz|zehirlen(?:d|iyor|mis)|asiri\s+doz|overdo|fazla\s+(?:ilac|hap)\s+(?:ic|al)|(?:ilac|hap)\w*\s+fazla\s+(?:ic|al)/,
    ed:/(?:\d+\s*gundur|gunlerdir|haftalardir|gunlerce)\s+(?:hic\s+)?(?:ac\b|bir sey yem|yemek yem)|hic\s*bir sey yemiyorum|yemek yemiyorum|kendimi ac birak|yemeyi reddet/
  };
  function redFlag(text){
    const t=low(text).replace(IDIOM,""),f=fold(t);
    for(const [lv,re] of FLAGS){
      if(re.test(t)||(FOLDED[lv]&&FOLDED[lv].test(f)))return lv;
      if(lv==="emergency"&&FAINT.test(t))return lv;
    }
    return null;
  }
  const PREG=/hamileyim|hamile kal|hamilelik|gebeyim|gebe kal|emziriyorum|bebek bekliyorum/;
  const pregnant=t=>PREG.test(low(t));
  /* Satır sonu ve bölüm başlıkları etkisizleştirilir: kullanıcı metni sistem istemine veri olarak girer, talimat olarak değil. */
  const HEAD=/KURALLAR|ÇIKTI|KISIT|HESAPLANAN|PROFİL|HEDEFLER|BUGÜN|İLAÇLAR|KATALOG|SON \d+ GÜN|SON ANTRENMANLAR|SON NOTLAR|SAĞLIK NOTU|MENÜ İSTEĞİ|NOT(?=\s*:)/g;
  const oneLine=(x,n)=>String(x==null?"":x).replace(/[\r\n\u2028\u2029\t]+/g," ").replace(HEAD,m=>low(m)).replace(/\s+/g," ").trim().slice(0,n);
  /* Model çıktısını toleranslı ayrıştır. */
  /* İlk "{" ile dengelenen "}"; JSON'dan sonra gelen metindeki "}" ayrıştırmayı bozmasın. */
  function end(s,a){
    let d=0,q=false;
    for(let i=a;i<s.length;i++){
      const c=s[i];
      if(q){if(c==="\\")i++;else if(c==='"')q=false}
      else if(c==='"')q=true;
      else if(c==="{")d++;
      else if(c==="}"&&--d===0)return i;
    }
    return -1;
  }
  /* Kullanıcı yedi/içti/spor yaptı/tarttı dedi mi: model kayıt listesi döndürmediyse bir kez daha sorulur. */
  /* \b Türkçe harflerde çalışmaz; sözcük sınırı için harf olmayan komşu aranır. */
  const QUESTION=/\?|(?<!\p{L})(?:nasıl|ne yesem|ne yemeli|ne yapmalı|olmalı|kaç|hangi|neden|niçin|m[ıiuü](?:yim|yız|sın)?)(?!\p{L})/u;
  const REPORT=/yedim|yedik|yiyorum|yiyoruz|içtim|ictim|içiyorum|atıştırdım|atıştırıyorum|koştum|kostum|yürüdüm|yurudum|tarttım|tarttim|oynadım|oynadim|yüzdüm|bisiklete bindim|\d\s*(?:kg|kilo)\b|\d[\d.,]*\s*çektim|(?:spor|antrenman|egzersiz|idman|cross|yoga|pilates|kahvaltı|yemek|ağırlık|salon) (?:yaptım|yaptim|çalıştım)|(?:bacak|kol|sırt|göğüs|omuz|karın) (?:günü )?(?:yaptım|çalıştım)/;
  const reported=t=>{t=low(t);return !QUESTION.test(t)&&REPORT.test(t)};
  const BROKEN="Yanıt eksik geldi, lütfen tekrar dene.";
  /* Kırpılmış JSON'dan yalnız kapanmış reply alanı çıkarılır; çıkmazsa ham metin sızmaz. */
  const ob=(s,i)=>s.indexOf("{",i);
  function partialReply(s){
    const m=/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(s);
    if(!m)return null;
    try{return JSON.parse('"'+m[1]+'"').trim()}catch(e){return null}
  }
  const obj=x=>x&&typeof x==="object"&&!Array.isArray(x)?x:null;
  function parse(text){
    let s=String(text==null?"":text).trim();
    s=s.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
    for(let a=ob(s,0);a>=0;a=ob(s,a+1)){
      const b=end(s,a);
      if(b<0)break;
      try{
        const o=JSON.parse(s.slice(a,b+1));
        if(o&&typeof o==="object"&&typeof o.reply==="string"){
          return {reply:o.reply.trim().slice(0,1500),log:Array.isArray(o.log)?o.log:[],propose:obj(o.propose),flag:typeof o.flag==="string"?o.flag:null,food:obj(o.food),program:obj(o.program),menu:obj(o.menu)};
        }
      }catch(e){}
      a=b;
    }
    const none={log:[],propose:null,flag:null,food:null,program:null,menu:null,plain:true};
    if(/"reply"\s*:/.test(s)||ob(s,0)===0)return {...none,reply:partialReply(s)||BROKEN,broken:true};
    return {...none,reply:s.replace(/[{}]/g,"").slice(0,1500)};
  }

  const num=(x,lo,hi)=>{const v=typeof x==="string"?parseFloat(x.replace(",",".")):x;return Number.isFinite(v)&&v>=lo&&v<=hi?v:null};
  /* Kayıt önerilerini doğrula. Geçersiz olanlar atılır, en fazla 12 kayıt. Yemekte gram, karbonhidrat, yağ ve öğün isteğe bağlı. */
  function cleanItems(items){
    const out=[];let kc=0,sum=0;
    for(const it of (Array.isArray(items)?items:[]).slice(0,12)){
      if(!it||typeof it!=="object")continue;
      const day=it.day==="yesterday"?"yesterday":"today";
      if(it.type==="yemek"){
        const kcal=num(it.kcal,0,5000),text=String(it.text||"").trim().slice(0,120);
        if(!text&&kcal==null||kc+(kcal||0)>6000)continue;
        kc+=kcal||0;
        const o={type:"yemek",text,kcal,p:num(it.protein!=null?it.protein:it.p,0,300),day},g=num(it.g,1,5000),c=num(it.carbs!=null?it.carbs:it.c,0,2000),f=num(it.fat!=null?it.fat:it.f,0,1000);
        if(g!=null)o.g=Math.round(g);if(c!=null)o.c=Math.round(c*10)/10;if(f!=null)o.f=Math.round(f*10)/10;if(MEAL_KEYS.includes(it.meal))o.meal=it.meal;
        out.push(o);
      }else if(it.type==="su"){const ml=num(it.ml,50,2000);if(ml!=null&&sum+ml<=5000){sum+=ml;out.push({type:"su",ml:Math.round(ml),day})}}
      else if(it.type==="kilo"){const kg=num(it.kg,20,400);if(kg!=null)out.push({type:"kilo",kg:Math.round(kg*10)/10,day})}
      else if(it.type==="spor"){const min=num(it.min,1,600),k=num(it.kcal,0,3000);if(min!=null){const o={type:"spor",min:Math.round(min),name:String(it.name||"Spor").trim().slice(0,40)||"Spor",day};if(k!=null)o.kcal=Math.round(k);out.push(o)}}
      else if(it.type==="not"){const text=String(it.text||"").trim().slice(0,300);if(text)out.push({type:"not",text,day})}
    }
    return out;
  }
  /* Sohbetteki egzersiz adından MET (Compendium yaklaşık değerleri; hızlı kayıttaki SPORMET ile aynı temel değerler). Bilinmeyen ad "Diğer" 4. */
  const SPORT_MET=[[/cross|hiit|tabata|bootcamp/,8],[/koş|kos|run|jog/,8.3],[/yürü|yuru|walk/,3.5],[/bisiklet|spinning|bike/,6.8],[/yüz|yuz|swim/,6],[/yoga|esneme|pilates/,2.5],[/ağırlık|agirlik|fitness|salon|kuvvet/,5],[/futbol|basketbol|voleybol|tenis|squash/,7],[/ip atla/,11],[/dans|zumba|aerobik/,5.5],[/merdiven|step/,8],[/kürek|kurek|row/,7]];
  const sportMet=name=>{const t=low(name);const m=SPORT_MET.find(([re])=>re.test(t));return m?m[1]:4};
  /* Makrolar tam ve kalori 4p+4k+9y'den %25'ten fazla sapıyorsa tahmin tutarsız: kart uyarır. */
  const macroOff=it=>it.kcal>0&&it.p!=null&&it.c!=null&&it.f!=null&&Math.abs(it.kcal-(4*it.p+4*it.c+9*it.f))>it.kcal*0.25;
  /* Kullanıcının sorduğu besin için modelin tahmini: bir porsiyonluk değerler. */
  function cleanFood(x){
    if(!x||typeof x!=="object")return null;
    const n=String(x.name||x.n||"").trim().slice(0,60),k=num(x.kcal,1,5000);
    if(!n||k==null)return null;
    const p=num(x.protein!=null?x.protein:x.p,0,300);
    return {n,k:Math.round(k),p:p==null?null:Math.round(p*10)/10};
  }
  /* Model programı: yalnız bilinen kimlikler, gün başına 2-8 egzersiz, en fazla 6 gün. */
  function cleanProgram(p,known,want){
    if(!p||typeof p!=="object"||!Array.isArray(p.days))return null;
    const ok=new Set(known),days=[],max=Number.isInteger(want)&&want>=2&&want<=6?want:6;
    for(const d of p.days){
      if(days.length>=max)break;
      if(!d||typeof d!=="object"||!Array.isArray(d.ex))continue;
      const ex=[...new Set(d.ex.filter(i=>typeof i==="string"&&ok.has(i)))].slice(0,8);
      if(ex.length>=2)days.push({n:(typeof d.n==="string"&&d.n.trim()?d.n.trim():"Gün "+(days.length+1)).slice(0,40),ex});
    }
    return days.length?{name:(typeof p.name==="string"&&p.name.trim()?p.name.trim():"Koç programı").slice(0,60),days}:null;
  }
  /* Haftalık menü. Model yalnız katalog kimliği ve porsiyon çarpanı verir: {days:[{n,meals:[{m,i:[[kimlik,q]]}]}]}.
     cat verilirse model çıktısı çözülür; cat yoksa kayıtlı kart (kalem değerleri zaten çarpılmış) yeniden doğrulanır.
     Günde 3-6 öğün; gün toplamı hedefin %15'inden fazla sapıyorsa off işaretlenir, gün atılmaz. */
  const MEAL_KEYS=["kah","ogl","aks","atis"],r1=x=>Math.round(x*10)/10;
  function cleanMenu(m,cat,kcal){
    if(!m||typeof m!=="object"||!Array.isArray(m.days))return null;
    const target=num(kcal,800,5000),days=[];
    for(const d of m.days){
      if(days.length>=7)break;
      const meals=[];
      for(const b of Array.isArray(d&&d.meals)?d.meals:[]){
        if(meals.length>=6)break;
        const items=[];
        for(const x of Array.isArray(b&&(cat?b.i:b.items))?(cat?b.i:b.items):[]){
          if(items.length>=8)break;
          let it=null;
          if(cat){
            const [id,q0]=Array.isArray(x)?x:[x&&x.id,x&&x.q],c=typeof id==="string"&&Object.hasOwn(cat,id)?cat[id]:null;
            if(!c)continue;
            const qv=typeof q0==='string'?parseFloat(q0.replace(',','.')):q0,q=Number.isFinite(qv)?Math.round(Math.min(4,Math.max(0.25,qv))*4)/4:1,sc=v=>v==null?null:r1(v*q);
            it={n:c.n,q,k:Math.round(c.k*q),p:sc(c.p),c:sc(c.c),f:sc(c.f),g:c.g?Math.round(c.g*q):null,a:c.a?r1(c.a*q):null};
          }else if(x&&typeof x.n==="string"&&x.n.trim()&&num(x.k,0,5000)!=null){
            const o=(v,hi)=>num(v,0,hi);
            it={n:x.n.trim().slice(0,60),q:o(x.q,4)||1,k:Math.round(x.k),p:o(x.p,1000),c:o(x.c,1000),f:o(x.f,1000),g:o(x.g,20000),a:o(x.a,500)};
          }
          if(it)items.push(it);
        }
        if(items.length)meals.push({m:MEAL_KEYS.includes(b.m)?b.m:"atis",items});
      }
      if(meals.length<3)continue;
      const k=meals.reduce((s,b)=>s+b.items.reduce((t,i)=>t+i.k,0),0);
      days.push({n:(typeof d.n==="string"&&d.n.trim()?d.n.trim():"Gün "+(days.length+1)).slice(0,30),meals,k,off:target!=null&&Math.abs(k-target)>target*0.15});
    }
    return days.length?{kcal:target,days}:null;
  }
  /* Alışveriş listesi: aynı besin adı toplanır; gram ve adet bilinenden, bilinmeyen kalem porsiyon sayısıyla. */
  function shopList(menu){
    const m=new Map();
    for(const d of menu.days)for(const b of d.meals)for(const i of b.items){
      const k=low(i.n),x=m.get(k)||{n:i.n,g:0,a:0,q:0};
      x.g+=i.g||0;x.a+=i.a||0;x.q+=i.q;m.set(k,x);
    }
    return [...m.values()].map(x=>({n:x.n,g:Math.round(x.g),a:r1(x.a),q:x.q,t:[x.g?Math.round(x.g)+" g":"",x.a?String(r1(x.a)).replace(".",",")+" adet":""].filter(Boolean).join(" · ")||String(x.q).replace(".",",")+" porsiyon"})).sort((a,b)=>a.n.localeCompare(b.n,"tr"));
  }
  const LV=["Başlangıç","Orta","İleri"],EQ={"Salon":["Salon","Ev tipi","Ağırlıksız"],"Ev tipi":["Ev tipi","Ağırlıksız"],"Ağırlıksız":["Ağırlıksız"]};
  /* Program kataloğu yalnız program isteğinde gider: bağlam küçük kalsın diye bölge başına 4, en fazla 60 egzersiz; önce klasikler ve seçilen seviye. */
  function catalog(list,o,prio){
    const eq=Object.hasOwn(EQ,o.q)?EQ[o.q]:EQ.Salon,lv=Math.max(0,LV.indexOf(o.l)),pr=new Set(prio),rank=e=>(pr.has(e.id)?0:2)+(e.l===o.l?0:1),n={},out=[];
    for(const e of list.filter(e=>(e.k==="w"||e.k==="b")&&eq.includes(e.q)&&LV.indexOf(e.l)<=lv).sort((a,b)=>rank(a)-rank(b))){
      const r=e.r||e.g;n[r]=(n[r]||0)+1;
      if(n[r]<=4&&out.length<60)out.push(e);
    }
    return out;
  }
  /* Model kalori hedefi önerirse güvenli alt sınıra çek. */
  function clampKcal(k,{tdee,bmr}={}){
    const v=num(k,800,5000);if(v==null)return null;
    const floor=Math.max(1200,bmr||0,(tdee||0)*0.75);
    if(v<floor)return {kcal:Math.round(floor/10)*10,limited:true};
    return {kcal:Math.round(v/10)*10,limited:false};
  }

  /* ---- sağlayıcı kurulumu ---- */
  /* Önekler belgeyle yalnız nvapi- için doğrulandı; arayüz tahmini değiştirilebilir gösterir. sk-ant-/sk-or- genel sk-'den önce. */
  const KEY_PREFIX=[["sk-ant-","anthropic"],["sk-or-","openrouter"],["nvapi-","nvidia"],["gsk_","groq"],["AIza","gemini"],["sk-","openai"]];
  const keyProvider=k=>{k=String(k||"").trim();const m=KEY_PREFIX.find(([p])=>k.startsWith(p));return m?m[1]:null};
  /* Önerilen model canlı listeden seçilir: sıradaki ilk mevcut kimlik. Kodda sabit model yalnız son çare; sabit adlar zamanla kalkıyor. */
  const MODEL_PREF={
    groq:["llama-3.3-70b-versatile","openai/gpt-oss-120b","llama-3.1-8b-instant"],
    nvidia:["nvidia/nemotron-3-super-120b-a12b","google/gemma-4-31b-it","moonshotai/kimi-k2.6","deepseek-ai/deepseek-v4.1-flash"],
    openrouter:["google/gemma-4-31b-it:free","nvidia/nemotron-3-super-120b-a12b:free"],
    gemini:["gemini-3.5-flash-lite","gemini-3.1-flash-lite","gemini-3.5-flash"],
    openai:["gpt-6-luna"],
    anthropic:["claude-haiku-4-5","claude-haiku-4-5-20251001","claude-sonnet-5-5"]
  };
  /* Tercih listesi eskiyince ailenin ucuz ve hızlı üyesine düşülür. */
  const FAMILY={gemini:/^gemini-[\d.]+-flash(-lite)?$/,openai:/^gpt-[\d.]+-luna$/,anthropic:/haiku|sonnet/};
  const NONCHAT=/embed|whisper|tts|guard|safety|reward|parse|rerank|retriev|clip|vision|vlm|image|video|audio|transcri|live|translate|detector|calibration|deplot|kosmos|fuyu|code|orpheus|omni|diffusion|moderation|vila|neva|cosmos|dall-e|davinci|babbage|realtime|search|sora|computer/i;
  /* /models yanıtı: konuşma dışı modeller atılır; fiyat varsa (OpenRouter) ücretsizlik işaretlenir. Gemini kimliklerinde olası "models/" öneki kırpılır. */
  function parseModels(j){
    const out=[],seen=new Set();
    for(const m of (j&&Array.isArray(j.data)?j.data:[])){
      const id=m&&typeof m.id==="string"?m.id.replace(/^models\//,"").slice(0,100):"";
      if(!id||seen.has(id)||NONCHAT.test(id))continue;
      seen.add(id);const pr=m.pricing;
      out.push({id,free:pr&&typeof pr==="object"?+pr.prompt===0&&+pr.completion===0:null});
    }
    return out.sort((a,b)=>a.id.localeCompare(b.id));
  }
  /* Listede olmak kullanılabilir olmak demek değil (hesaba kapalı, emekli ya da yanıt vermeyen model); arayüz adayları sırayla dener. */
  function candidates(pid,list){
    const ids=new Set(list.map(m=>m.id)),out=(MODEL_PREF[pid]||[]).filter(x=>ids.has(x));
    for(const m of list)if(m.free===true&&!/reason|think/i.test(m.id))out.push(m.id);
    if(FAMILY[pid])for(const m of list)if(FAMILY[pid].test(m.id))out.push(m.id);
    return [...new Set(out)];
  }
  const pickModel=(pid,list)=>candidates(pid,list)[0]||null;
  /* Hata sınıfı: durum kodu tek başına yetmez (Gemini yanlış anahtara 400, kota ve hız limiti ikisi de 429, eksik model 400 ya da 404). */
  function errKind(status,body,name){
    const b=String(body||"");
    if(name==="AbortError")return "time";
    if(!status)return "net";
    if(status===401||status===403||(status===400&&/api[ _-]?key|unauthori|credential/i.test(b)))return "key";
    /* Gemini ve OpenAI hem dakikalık hız sınırını hem kotayı 429 ile döner: gün/bakiye sözcüğü kota, dakikalık sözcük geçici limit. */
    if(status===402||(status===400&&/credit balance|billing|insufficient/i.test(b)))return "quota";
    if(status===429){
      if(/per ?day|daily|billing|credit|insufficient/i.test(b))return "quota";
      if(/per ?minute|retry in|retrydelay|rate.?limit|too many/i.test(b))return "limit";
      return /quota/i.test(b)?"quota":"limit";
    }
    if(status===404||status===410||((status===400||status===422)&&/model/i.test(b)&&/not.?found|not exist|invalid|unknown|not supported|decommission|no endpoints/i.test(b)))return "model";
    if(status>=500)return "down";
    return "err";
  }
  const ERR_TXT={key:"Anahtar kabul edilmedi. Doğru sağlayıcıyı seçtiğinden ve anahtarı eksiksiz yapıştırdığından emin ol.",quota:"Hesabının kotası ya da bakiyesi bitmiş. Sağlayıcının sitesinde kullanımına bak.",limit:"Kısa süreli kullanım sınırı doldu, bir dakika sonra yeniden dene.",model:"Bu model bulunamadı ya da hesabında kullanılamıyor. Başka model seç.",net:"İnternet yok ya da sağlayıcıya ulaşılamadı.",time:"Model zamanında yanıt vermedi. Yeniden dene ya da başka model seç.",down:"Sağlayıcıda geçici bir sorun var, sonra yeniden dene.",empty:"Bağlantı çalışıyor ama model boş yanıt verdi. Önerilen modeli seç."};
  const errText=(kind,status)=>ERR_TXT[kind]||`Beklenmeyen bir hata oldu${status?" (kod "+status+")":""}.`;

  const SYSTEM=`Sen "Koç"sun: tek bir kişiye özel beslenme, spor ve yaşam koçu. Hekim değilsin ve tanı koymazsın. Türkçe, sıcak, kısa ve net konuş, suçlama. Cevap en fazla yaklaşık 90 kelime, kullanıcı detay istemedikçe.

KURALLAR
1. Sayıları yalnızca "HESAPLANAN" ve "SON 14 GÜN" bölümlerinden al. Kilo, harcama, hız gibi sayıları kendin hesaplama ya da uydurma; yalnız yemek için kalori ve protein tahmin edebilirsin.
2. Kalori hedefini kendin değiştirme. Değişiklik gerekirse "propose" alanında öner, kullanıcı onaylar.
3. Çok düşük kalori veya hızlı kilo kaybı önerme. Hamilelik, emzirme, 18 yaş altı, yeme bozukluğu geçmişi, ciddi hastalık veya ilaç kullanımı varsa kalori açığı önerme, hekime yönlendir. "KISIT" satırı uygulamanın güvenlik frenidir: varken kalori açığı, oruç ya da yüksek protein önerme.
4. Baş dönmesi, bayılma, göğüs ağrısı, nefes darlığı, çarpıntı gibi belirtilerde önce hekime başvurmasını söyle. Acil belirtilerde 112. "flag" alanına "safety" yaz.
5. İlaç, doz, takviye tedavisi önerme.
6. Yeme bozukluğu işareti görürsen kısıtlama önerme, yargılamadan bir uzmana yönlendir.
7. Bilmediğin veya veride olmayan şeyi sor, tahmin yürütme.
8. Kullanıcı bir şey yediğini, içtiğini, tartıldığını veya spor yaptığını yazarsa "log" listesine ekle. Her yemek ayrı; değerler tahmin, kesin deme.
9. Yemeğin kalorisi soruluyor ve yenmediyse "log" kullanma; "food" alanına tek porsiyonluk tahmin yaz, porsiyonu adda belirt (ör. "1 dilim pizza"), reply'da tahmin olduğunu söyle.
10. Kas, eklem ya da sırt ağrısında ve sakatlıkta tanı koyma, tedavi ya da egzersiz reçetesi verme: ağrıyı yapan hareketi ve antrenmanı bırakmasını, ağrı sürer ya da artarsa hekime veya fizyoterapiste başvurmasını söyle.
11. İlaç ve takviye sorularında (doz, etkileşim, başlama, bırakma) yorum yapma, hekime ya da eczacıya yönlendir.
12. Program önerirken reply'da "ağrın, sakatlığın ya da sağlık sorunun varsa başlamadan hekime danış" uyarısını kısaca ver. Hamilelik veya emzirmede, yakın zamanda ameliyatta ya da ciddi hastalıkta önce hekime yönlendir. 18 yaş altında ağır yük ve kalori açığı içeren program önerme, ailesi ve hekimiyle planlamasını söyle. Yeme bozukluğu işaretinde kalori yakmak için spor önerme.

ÇIKTI: Yalnızca tek bir JSON nesnesi, başka hiçbir metin yok:
{"reply":"kullanıcıya metin","log":[],"propose":null,"flag":null,"food":null}
log öğeleri: {"type":"yemek","text":"pilav","g":100,"kcal":130,"protein":3,"carbs":28,"fat":1,"meal":"kah"} (meal kah/ogl/aks/atis) | {"type":"su","ml":250} | {"type":"kilo","kg":83.7} | {"type":"spor","min":30,"name":"Koşu","kcal":250} | {"type":"not","text":"..."}. Dünkü kayıt için "day":"yesterday" ekle.
propose: {"kcal":1900,"why":"kısa neden"} ya da null.
food: {"name":"1 dilim pizza","kcal":280,"protein":12} ya da null.
Program istenirse "program" alanına {"name":"...","days":[{"n":"Gün adı","ex":["kimlik"]}]} yaz: yalnız KATALOG'daki kimlikler, gün başına 3-8 egzersiz.`;

  /* Kesin yaş kimliğe yaklaşır; modele 5 yıllık aralık gider (Koç 18+ için açık). Enerji hesabı yerelde kesin yaşla yapılır. */
  const ageBand=a=>{const l=a-a%5;return Math.max(l,18)+"-"+(l+4)};
  const f1=x=>x==null?"–":String(Math.round(x*10)/10).replace(".",",");
  /* Bağlam metni. d: uygulamanın hesapladığı veri; q: soru metni. Güvenlik/doğruluk bölümleri hep gider; ilaç, antrenman ve not
     bölümleri yalnız soruda ilgili anahtar kelime varsa. Soru ne ilgili ne bilinen başka bir konuya (su, yemek, kilo...) değiyorsa (belirsiz) hepsi gider. */
  const K={
    med:/ilaç|ilac|doz|(^|[^a-zçğıöşü])hap|tablet|hatırlat|eczane|eczacı|ağrı ?kesici|vitamin|takviye|reçete|kapsül|şurup|antibiyotik|insülin|tansiyon/,
    spor:/spor|antrenman|egzersiz|set|setler|program|salon|kas|kaslar|koş|yürü|ağırlık|tekrar|bench|squat|hareket|kardiyo|cardio|pilates|yüz|bisiklet/,
    diger:/(^|[^a-zçğıöşü])su(yu|ya|da|dan)?([^a-zçğıöşü]|$)|içtim|yemek|yedim|kalori|kcal|kilo|protein|karbonhidrat|öğün|kahvaltı|diyet|menü|tarif|tartı/,
    not:/(^|[^a-zçğıöşü])not|ruh|uyku|uyu|stres|yazdım|yorgun|moral|mutlu|kaygı/
  };
  function contextText(d,q){
    const ql=low(q),medHit=!!(d.meds||[]).some(m=>ql.includes(low(m.n).slice(0,30))&&m.n),hit={med:K.med.test(ql)||medHit,spor:K.spor.test(ql),not:K.not.test(ql)};
    const all=!hit.med&&!hit.spor&&!hit.not&&!K.diger.test(ql),L=[];
    L.push("PROFİL: "+[d.profile.cm?d.profile.cm+" cm":null,d.profile.age?ageBand(d.profile.age)+" yaş":null,d.profile.sex==="m"?"erkek":d.profile.sex==="f"?"kadın":null,d.profile.act!=null?"hareket düzeyi "+["az","orta","çok"][d.profile.act]:null].filter(Boolean).join(", ")||"girilmemiş");
    if(d.profile.note)L.push("SAĞLIK NOTU (kullanıcı yazdı): "+oneLine(d.profile.note,500));
    L.push(`HEDEFLER: kilo ${d.goals.kg||"yok"}, kalori ${d.goals.kcal||"yok"}, su ${d.goals.water} ml, spor ${d.goals.sport} dk/hafta`);
    const c=d.calc;
    L.push(`HESAPLANAN: trend kilo ${f1(c.trendKg)} kg, hız ${c.slope==null?"yetersiz veri":f1(c.slope)+" kg/hafta"}, tahmini harcama ${c.tdee?Math.round(c.tdee/10)*10+" kcal ("+c.source+")":"hesaplanamadı"}, önerilen hedef ${c.target||"–"} kcal, protein aralığı ${c.protein?c.protein[0]+"-"+c.protein[1]+" g":c.proteinDoc?"hekimle belirlenmeli (yüksek protein önerme)":"–"}`);
    if(c.block)L.push("KISIT: "+c.why+". Kalori açığı ve oruç önerme, hekime yönlendir.");
    const hs=d.days.some(r=>r.sl),hm=d.days.some(r=>r.mo),cells=r=>[r.kg,r.kcal,r.p,r.su,r.sport,r.ad,r.sl,r.mo],empty=[];
    L.push("SON 14 GÜN (gün | kilo | kcal | protein g | su ml | spor dk | adım"+(hs?" | uyku sa":"")+(hm?" | ruh hali 1-5":"")+"):");
    for(const r of d.days){
      if(cells(r).every(v=>!v)){empty.push(+r.d.slice(-2));continue}
      L.push(`${r.d} | ${f1(r.kg)} | ${r.kcal||"–"} | ${r.p||"–"} | ${r.su||"–"} | ${r.sport||"–"} | ${r.ad||"–"}`+(hs?` | ${r.sl?f1(r.sl/60):"–"}`:"")+(hm?` | ${r.mo||"–"}`:""));
    }
    if(empty.length)L.push("boş günler (ayın günü, hiç veri yok): "+empty.join(", "));
    L.push("BUGÜN: "+(d.today.length?d.today.map(x=>oneLine(x,160)).join("; "):"kayıt yok")+` (saat ${d.now})`);
    if(d.meds&&d.meds.length)L.push("KULLANDIĞI İLAÇLAR (yalnız ad ve doz; etkileşim/doz değişikliği önerme, hekime/eczacıya yönlendir): "+d.meds.map(m=>oneLine(m.n,24)+(m.d?" "+oneLine(m.d,12):"")).join(", "));
    if((all||hit.spor)&&d.workouts.length)L.push("SON ANTRENMANLAR: "+d.workouts.map(x=>oneLine(x,300)).join(" | "));
    if((all||hit.spor)&&d.weekSets&&Object.keys(d.weekSets).length)L.push("BU HAFTA TAMAMLANAN SET (bölgeye göre): "+Object.keys(d.weekSets).map(k=>k+" "+d.weekSets[k]).join(", "));
    if((all||hit.not)&&d.notes.length)L.push("SON NOTLAR: "+d.notes.map(x=>oneLine(x,100)).join(" | "));
    if((all||hit.med)&&d.meds&&d.meds.length){
      L.push("İLAÇLAR (kullanıcının kendi girdiği hatırlatıcı kaydı; doz veya ilaç değişikliği önerme, ilaçla ilgili soruları hekime/eczacıya yönlendir; doz sayıları son 7 gün"+(d.meds.some(m=>m.a&&m.a.late)?"; 'bugün bekleyen' doz gün bitene kadar eklenebilir, kaçırılan değil":"")+"):");
      for(const m of d.meds)L.push(`${oneLine(m.n,30)}${m.d?" "+oneLine(m.d,20):""} | saatler ${m.t.join(", ")}${m.w?" | haftanın günleri "+m.w.join(","):""} | ${m.a?`${m.a.taken}/${m.a.total} alındı, ${m.a.missed} kaçırılan${m.a.late?`, ${m.a.late} bugün bekleyen`:""}${m.a.skipped?`, ${m.a.skipped} atlanan`:""}`:"doz yok"}${m.left!=null?` | stok ~${m.left} doz`:""}`);
    }
    return L.join("\n");
  }
  return {low,oneLine,pregnant,BROKEN,redFlag,parse,reported,cleanItems,cleanFood,cleanProgram,cleanMenu,shopList,MEAL_KEYS,catalog,clampKcal,SYSTEM,contextText,macroOff,sportMet,keyProvider,MODEL_PREF,parseModels,candidates,pickModel,errKind,errText};
})();
if(typeof module!=="undefined")module.exports=CoachLib;
