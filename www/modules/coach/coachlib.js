"use strict";
/* Coach: pure logic (no DOM, no storage). Global CoachLib in the browser, module.exports in Node. */
const CoachLib=(()=>{
  const low=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();
  const FOLD={ç:"c",ğ:"g",ı:"i",ö:"o",ş:"s",ü:"u"};
  const fold=s=>s.replace(/[çğıöşü]/g,c=>FOLD[c]);
  const REPLY_MAX=1500;
  const r1=x=>Math.round(x*10)/10,comma=x=>String(x).replace(".",",");

  /* App-side safety scan: it runs regardless of the model reply. */
  const FLAGS=[
    ["mind",/intihar|kendime zarar|kendimi öldür|ölmek istiyorum|yaşamak istemiyorum|kendimi kes|hayatıma son|ölsem iyi|canıma kıy|kendimi as(?:mak|ıcam|acağım)|kendimi yok et|yaşamak istemiyor/],
    ["emergency",/bayılacak|bayılma|bayıldı(?!m)|göğüs(üm)? ağr|göğsüm sıkış|nefes darl|nefes alam|nefesim daral|felç|kan kus|kanlı kus|kolum uyuş|konuşam[ıi]yor|yüzüm kay/],
    ["ed",/yedikten sonra kus|kusmaya çalış|kusuyorum|tıkınıyorum|tıkınma|laksatif|yemek yemekten kork|günlerce aç|hiçbir şey yemiyorum|hiç yemiyorum|kilo vermek için kus|yemeyi bırak/],
    ["check",/baş(ım)? dön|başım dönüyor|çarpıntı|gözüm(ün önü)? karar|gözlerim karar|titreme|aşırı halsiz|çok halsiz/]
  ];
  /* "baklavaya bayılıyorum" is an idiom; "bayıldım/bayılıyorum" counts as an emergency only without a food or affection context. */
  const FAINT=/bayıl(?:ıyorum|ıyoruz|ırım|dım)/;
  /* The idiom is a "bayıl" word right after the liked thing; it is cut out of the text and the rest is searched for real fainting or other symptoms. */
  const IDIOM=/(?:yemek\w*|yemeğ\w*|baklava\w*|pizza\w*|çikolata\w*|tatlı\w*|börek\w*|kebap\w*|dondurma\w*|makarna\w*|kahve\w*|lezzet\w*|müzi[kğ]\w*|film\w*|dizi\w*|şarkı\w*|kitab\w*|kitap\w*|seni|sana|ona|buna|harika|güzel|muhteşem|[a-zçğıöşü]{3,}(?:ya|ye))\s+(?:çok\s+|gerçekten\s+)?bayıl\S*/g;
  /* Patterns that also catch spellings without Turkish letters (the text is folded); capitals are handled by low(). */
  const FOLDED={
    mind:/intihar|kendime zarar|kendimi oldur|olmek istiyorum|yasamak istemiyor|kendimi kes|hayatima son|olsem iyi|canima kiy|kendimi as(?:mak|icam|acagim)|kendimi yok et/,
    check:/bas(?:im)?\s+donu|carpinti|gozum(?:un onu)?\s+karar|gozlerim karar|titreme|asiri halsiz|cok halsiz/,
    emergency:/bayilacag|bayilacak|bayilma(?![a-z])|gog(?:u|)s\w*\s+(?:\w+\s+)?(?:agri(?!mi)|sikis)|kal(?:b\w*|p)\s+(?:\w+\s+)?agri(?!mi)|nefes\w*\s+(?:\w+\s+)?kesil|kalp kriz|zehirlen(?:d|iyor|mis)|asiri\s+doz|overdo|fazla\s+(?:ilac|hap)\s+(?:ic|al)|(?:ilac|hap)\w*\s+fazla\s+(?:ic|al)/,
    ed:/anoreksi|bulimi|yeme bozuklu|tikin(?:iyorum|ma)|kusmaya calis|kustum|kusuyorum|yedikten sonra kus|laksatif|yemeyi birak|ac kalmaya calis|kilo vermek icin (?:hic )?(?:yemiyorum|kus)|yediklerimi cikar|(?:\d+\s*gundur|gunlerdir|haftalardir|gunlerce)\s+(?:hic\s+)?(?:ac\b|bir sey yem|yemek yem)|hic\s*bir sey yemiyorum|yemek yemiyorum|kendimi ac birak|yemeyi reddet/
  };
  function redFlag(text){
    const t=low(text).replace(IDIOM,""),f=fold(t);
    for(const [lv,re] of FLAGS){
      if(re.test(t)||(FOLDED[lv]&&FOLDED[lv].test(f)))return lv;
      if(lv==="emergency"&&FAINT.test(t))return lv;
    }
    return null;
  }
  /* Only first-person statements count: a question about pregnancy ("hamilelikte spor olur mu?") is not a sign. */
  const PREG=/hamileyim|gebeyim|(?:hamile|gebe) kald[ıi]m|bebek bekliyorum/;
  /* "preg", "nurs" or null: pregnancy and nursing are separate signs. */
  const pregnant=t=>{const x=low(t).replace(/(?:hamilelik|gebelik)\s+(?:yok|de[gğ]il)\w*/g,"");return PREG.test(x)?"preg":/emziriyorum/.test(x)?"nurs":null};
  /* Line breaks and section headings are neutralized: user text enters the system prompt as data, not as instructions. */
  const HEAD=/KURALLAR|ÇIKTI|KISIT|HESAPLANAN|PROFİL|HEDEFLER|BUGÜN|İLAÇLAR|KATALOG|SON \d+ GÜN|SON ANTRENMANLAR|SON NOTLAR|SAĞLIK NOTU|MENÜ İSTEĞİ|NOT(?=\s*:)/g;
  const oneLine=(x,n)=>String(x==null?"":x).replace(/[\r\n\u2028\u2029\t]+/g," ").replace(HEAD,m=>low(m)).replace(/\s+/g," ").trim().slice(0,n);
  /* Index of the "}" that balances the "{" at a, so a "}" in text after the JSON does not break parsing. */
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
  /* Did the user say they ate/drank/exercised/weighed in: if the model returned no log list, it is asked once more.
     \b does not work with Turkish letters, so a non-letter neighbor marks the word boundary. */
  const QUESTION=/\?|(?<!\p{L})(?:nasıl|ne yesem|ne yemeli|ne yapmalı|olmalı|kaç|hangi|neden|niçin|m[ıiuü](?:yim|yız|sın)?)(?!\p{L})/u;
  const REPORT=/yedim|yedik|yiyorum|yiyoruz|içtim|ictim|içiyorum|atıştırdım|atıştırıyorum|koştum|kostum|yürüdüm|yurudum|tarttım|tarttim|oynadım|oynadim|yüzdüm|bisiklete bindim|\d\s*(?:kg|kilo)\b|\d[\d.,]*\s*çektim|(?:spor|antrenman|egzersiz|idman|cross|yoga|pilates|kahvaltı|yemek|ağırlık|salon) (?:yaptım|yaptim|çalıştım)|(?:bacak|kol|sırt|göğüs|omuz|karın) (?:günü )?(?:yaptım|çalıştım)/;
  const reported=t=>{t=low(t);return !QUESTION.test(t)&&REPORT.test(t)};
  const BROKEN="Yanıt eksik geldi, lütfen tekrar dene.";
  /* From truncated JSON only a closed reply field is taken, so raw JSON text never reaches the chat. */
  function partialReply(s){
    const m=/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/.exec(s);
    if(!m)return null;
    try{return JSON.parse('"'+m[1]+'"').trim()}catch(e){return null}
  }
  const obj=x=>x&&typeof x==="object"&&!Array.isArray(x)?x:null;
  const open=(s,i)=>s.indexOf("{",i);
  /* Tolerant parse of model output: the first balanced object with a string reply wins. */
  function parse(text){
    const s=String(text??"").trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
    for(let a=open(s,0);a>=0;a=open(s,a+1)){
      const b=end(s,a);
      if(b<0)break;
      try{
        const o=JSON.parse(s.slice(a,b+1));
        if(o&&typeof o==="object"&&typeof o.reply==="string"){
          return {reply:o.reply.trim().slice(0,REPLY_MAX),log:Array.isArray(o.log)?o.log:[],propose:obj(o.propose),flag:typeof o.flag==="string"?o.flag:null,food:obj(o.food),program:obj(o.program),menu:obj(o.menu)};
        }
      }catch(e){}
      a=b;
    }
    const none={log:[],propose:null,flag:null,food:null,program:null,menu:null,plain:true};
    if(/"reply"\s*:/.test(s)||open(s,0)===0)return {...none,reply:partialReply(s)||BROKEN,broken:true};
    return {...none,reply:s.replace(/[{}]/g,"").slice(0,REPLY_MAX)};
  }

  const num=(x,lo,hi)=>{const v=typeof x==="string"?parseFloat(x.replace(",",".")):x;return Number.isFinite(v)&&v>=lo&&v<=hi?v:null};
  const trimmed=(v,max)=>String(v||"").trim().slice(0,max);
  /* A model-supplied label, or the fallback when it is missing. */
  const label=(v,fallback,max)=>(typeof v==="string"&&v.trim()?v.trim():fallback).slice(0,max);
  /* Validates log suggestions: invalid ones are dropped, at most 12 items. Grams, carbs, fat and meal are optional for food. */
  function cleanItems(items){
    const out=[];let kc=0,sum=0;
    for(const it of (Array.isArray(items)?items:[]).slice(0,12)){
      if(!it||typeof it!=="object")continue;
      const day=it.day==="yesterday"?"yesterday":"today";
      if(it.type==="food"){
        const kcal=num(it.kcal,0,5000),text=trimmed(it.text,120);
        if(!text&&kcal==null||kc+(kcal||0)>6000)continue;
        kc+=kcal||0;
        const o={type:"food",text,kcal,p:num(it.protein!=null?it.protein:it.p,0,300),day},g=num(it.g,1,5000),c=num(it.carbs!=null?it.carbs:it.c,0,2000),f=num(it.fat!=null?it.fat:it.f,0,1000);
        if(g!=null)o.g=Math.round(g);if(c!=null)o.c=r1(c);if(f!=null)o.f=r1(f);if(MEAL_KEYS.includes(it.meal))o.meal=it.meal;
        out.push(o);
      }else if(it.type==="water"){const ml=num(it.ml,50,2000);if(ml!=null&&sum+ml<=5000){sum+=ml;out.push({type:"water",ml:Math.round(ml),day})}}
      else if(it.type==="weight"){const kg=num(it.kg,20,400);if(kg!=null)out.push({type:"weight",kg:r1(kg),day})}
      else if(it.type==="exercise"){const min=num(it.min,1,600),k=num(it.kcal,0,3000);if(min!=null){const o={type:"exercise",min:Math.round(min),name:trimmed(it.name,40)||"Spor",day};if(k!=null)o.kcal=Math.round(k);out.push(o)}}
      else if(it.type==="note"){const text=trimmed(it.text,300);if(text)out.push({type:"note",text,day})}
    }
    return out;
  }
  /* MET from the exercise name in the chat (approximate Compendium values, the same base values as the quick-log EXERCISE_MET). An unknown name is "Diğer", 4. */
  const SPORT_MET=[[/cross|hiit|tabata|bootcamp/,8],[/koş|kos|run|jog/,8.3],[/yürü|yuru|walk/,3.5],[/bisiklet|spinning|bike/,6.8],[/yüz|yuz|swim/,6],[/yoga|esneme|pilates/,2.5],[/ağırlık|agirlik|fitness|salon|kuvvet/,5],[/futbol|basketbol|voleybol|tenis|squash/,7],[/ip atla/,11],[/dans|zumba|aerobik/,5.5],[/merdiven|step/,8],[/kürek|kurek|row/,7]];
  const sportMet=name=>{const t=low(name);const m=SPORT_MET.find(([re])=>re.test(t));return m?m[1]:4};
  /* With all macros present and kcal more than 25% off 4p+4c+9f the estimate is inconsistent and the card warns. */
  const macroOff=it=>it.kcal>0&&it.p!=null&&it.c!=null&&it.f!=null&&Math.abs(it.kcal-(4*it.p+4*it.c+9*it.f))>it.kcal*0.25;
  /* The model estimate for the food the user asked about: values for one portion. */
  function cleanFood(x){
    if(!x||typeof x!=="object")return null;
    const n=trimmed(x.name,60),k=num(x.kcal,1,5000);
    if(!n||k==null)return null;
    const p=num(x.protein,0,300);
    return {n,k:Math.round(k),p:p==null?null:r1(p)};
  }
  /* Model program: known ids only, 2-8 exercises per day, at most 6 days. */
  function cleanProgram(p,known,want){
    if(!p||typeof p!=="object"||!Array.isArray(p.days))return null;
    const ok=new Set(known),days=[],max=Number.isInteger(want)&&want>=2&&want<=6?want:6;
    for(const d of p.days){
      if(days.length>=max)break;
      if(!d||typeof d!=="object"||!Array.isArray(d.ex))continue;
      const ex=[...new Set(d.ex.filter(i=>typeof i==="string"&&ok.has(i)))].slice(0,8);
      if(ex.length>=2)days.push({n:label(d.n,"Gün "+(days.length+1),40),ex});
    }
    return days.length?{name:label(p.name,"Rehber programı",60),days}:null;
  }
  /* Weekly menu. The model gives only catalog ids and a portion multiplier: {days:[{n,meals:[{m,i:[[id,q]]}]}]}.
     With cat the model output is resolved; without cat a stored card (item values already multiplied) is validated again.
     3-6 meals per day; a day whose total is more than 15% off the target is marked off, not dropped. */
  const MEAL_KEYS=["breakfast","lunch","dinner","snack"];
  const MENU_DAYS_MAX=7,MENU_MEALS_MIN=3,MENU_MEALS_MAX=6,MENU_ITEMS_MAX=8;
  function cleanMenu(m,cat,kcal){
    if(!m||typeof m!=="object"||!Array.isArray(m.days))return null;
    const target=num(kcal,800,5000),days=[];
    for(const d of m.days){
      if(days.length>=MENU_DAYS_MAX)break;
      const meals=[];
      for(const b of Array.isArray(d&&d.meals)?d.meals:[]){
        if(meals.length>=MENU_MEALS_MAX)break;
        const items=[],rows=b&&(cat?b.i:b.items);
        for(const x of Array.isArray(rows)?rows:[]){
          if(items.length>=MENU_ITEMS_MAX)break;
          let it=null;
          if(cat){
            const [id,q0]=Array.isArray(x)?x:[x&&x.id,x&&x.q],c=typeof id==="string"&&Object.hasOwn(cat,id)?cat[id]:null;
            if(!c)continue;
            const qv=typeof q0==="string"?parseFloat(q0.replace(",",".")):q0,q=Number.isFinite(qv)?Math.round(Math.min(4,Math.max(0.25,qv))*4)/4:1,sc=v=>v==null?null:r1(v*q);
            it={n:c.n,q,k:Math.round(c.k*q),p:sc(c.p),c:sc(c.c),f:sc(c.f),g:c.g?Math.round(c.g*q):null,a:c.a?r1(c.a*q):null};
          }else if(x&&typeof x.n==="string"&&x.n.trim()&&num(x.k,0,5000)!=null){
            const o=(v,hi)=>num(v,0,hi);
            it={n:x.n.trim().slice(0,60),q:o(x.q,4)||1,k:Math.round(o(x.k,5000)),p:o(x.p,1000),c:o(x.c,1000),f:o(x.f,1000),g:o(x.g,20000),a:o(x.a,500)};
          }
          if(it)items.push(it);
        }
        if(items.length)meals.push({m:MEAL_KEYS.includes(b.m)?b.m:"snack",items});
      }
      if(meals.length<MENU_MEALS_MIN)continue;
      const k=meals.reduce((s,b)=>s+b.items.reduce((t,i)=>t+i.k,0),0);
      days.push({n:label(d.n,"Gün "+(days.length+1),30),meals,k,off:target!=null&&Math.abs(k-target)>target*0.15});
    }
    return days.length?{kcal:target,days}:null;
  }
  /* Product name: cooking words and parentheses are dropped, "X pilavı" becomes X, every cooked form of egg is "Yumurta". */
  const asc=s=>fold(low(s));
  function product(n){
    let s=n.replace(/\s*\([^)]*\)/g,"").replace(/^(haşlanmış|sahanda|çırpılmış|ızgara|Izgara|fırında|fırın|kızarmış)\s+/i,"").replace(/^(\S+) pilavı$/i,"$1").trim()||n;
    if(/yumurta/.test(asc(s))&&!/omlet|menemen/.test(asc(s)))s="Yumurta";
    return s.charAt(0).toLocaleUpperCase("tr")+s.slice(1);
  }
  const SHOP_CAT=[["Baklagil",/mercimek|nohut|kuru fasulye|barbunya|humus|pilaki|falafel/],["Et, tavuk, balık",/\bet\b|kiyma|kofte|tavuk|hindi|somon|levrek|balik|\bton\b|karides|kuzu|dana|sucuk|kebab/],
    ["Süt ürünleri ve yumurta",/sut|yogurt|peynir|ayran|kefir|kasar|\blor\b|tereyag|kaymak|yumurta|cacik|haydari|omlet|menemen/],["Sebze",/domates|salatalik|biber|marul|roka|ispanak|brokoli|havuc|sogan|sarimsak|patlican|kabak|lahana|fasulye|bezelye|mantar|patates|maydanoz|dereotu|tursu|salata|bamya|turlu|kereviz/],
    ["Meyve",/elma|muz|portakal|mandalina|armut|kivi|cilek|seftali|uzum|\bnar\b|kayisi|erik|ananas|greyfurt|limon|hurma|incir|meyve/],["Kuruyemiş",/badem|ceviz|findik|fistik|kaju|kuruyemis/],
    ["Tahıl ve ekmek",/ekmek|bulgur|pirinc|makarna|spagetti|yulaf|\bun\b|kraker|lavas|tost|simit|musli|granola|kinoa|eriste|pilav/]];
  const shopCat=n=>(SHOP_CAT.find(c=>c[1].test(asc(n)))||["Diğer"])[0],CATS=SHOP_CAT.map(c=>c[0]).concat("Diğer");
  /* Shopping list: a dish with known grams is split into its parts (parts(name) -> [[name, raw grams per 100 g cooked]]) up to three levels deep and equal products are summed.
     Grams and counts are used where known, unknown items by portion count; products under 5 g that came from a split (salt, spice) are not listed.
     Order is category, then name; the grouped list and the check-mark index in the UI rely on this order. */
  function shopList(menu,parts=()=>null){
    const m=new Map(),put=(n,g,a,q,sp,dep)=>{
      const ps=g>0&&dep<3&&parts(n);
      if(ps&&ps.length){for(const [x,pg] of ps)put(x,pg*g/100,0,q,true,dep+1);return}
      const p=product(n),k=low(p),x=m.get(k)||{n:p,g:0,a:0,q:0,sp:true};x.g+=g||0;x.a+=a||0;x.q+=q;x.sp=x.sp&&sp;m.set(k,x);
    };
    for(const d of menu.days)for(const b of d.meals)for(const i of b.items)put(i.n,i.g,i.a,i.q,false,0);
    return [...m.values()].filter(x=>!x.sp||x.g>=5).map(x=>({n:x.n,c:shopCat(x.n),g:Math.round(x.g),a:r1(x.a),q:x.q,t:[x.g?Math.round(x.g)+" g":"",x.a?comma(r1(x.a))+" adet":""].filter(Boolean).join(" · ")||comma(x.q)+" porsiyon"})).sort((a,b)=>CATS.indexOf(a.c)-CATS.indexOf(b.c)||a.n.localeCompare(b.n,"tr"));
  }
  const LV=["Başlangıç","Orta","İleri"],EQ={"Salon":["Salon","Ev tipi","Ağırlıksız"],"Ev tipi":["Ev tipi","Ağırlıksız"],"Ağırlıksız":["Ağırlıksız"]};
  const CATALOG_PER_REGION=4,CATALOG_MAX=60;
  /* The program catalog goes only with a program request; to keep the context small it holds at most 4 exercises per region and 60 in total, classics and the chosen level first. */
  function catalog(list,o,prio){
    const eq=Object.hasOwn(EQ,o.q)?EQ[o.q]:EQ.Salon,lv=Math.max(0,LV.indexOf(o.l)),pr=new Set(prio),rank=e=>(pr.has(e.id)?0:2)+(e.l===o.l?0:1),n={},out=[];
    for(const e of list.filter(e=>(e.k==="w"||e.k==="b")&&eq.includes(e.q)&&LV.indexOf(e.l)<=lv).sort((a,b)=>rank(a)-rank(b))){
      const r=e.r||e.g;n[r]=(n[r]||0)+1;
      if(n[r]<=CATALOG_PER_REGION&&out.length<CATALOG_MAX)out.push(e);
    }
    return out;
  }
  /* Catalog text: "id|name" under a region heading (the region is not repeated on every line). */
  function catalogText(list){
    const g=new Map();
    for(const e of list){const r=e.r||e.g;if(!g.has(r))g.set(r,[]);g.get(r).push(e.id+"|"+e.n)}
    return [...g].map(([r,a])=>r+": "+a.join(", ")).join("\n");
  }
  /* If the model proposes a calorie target, pull it up to the safe floor. */
  function clampKcal(k,{tdee,bmr,sex}={}){
    const v=num(k,800,5000);if(v==null)return null;
    const floor=Math.max(sex==="f"?1200:1500,bmr||0,(tdee||0)*0.75);
    if(v<floor)return {kcal:Math.round(floor/10)*10,limited:true};
    return {kcal:Math.round(v/10)*10,limited:false};
  }

  /* ---- provider setup ---- */
  /* Only the nvapi- prefix is confirmed by documentation; the UI shows the guess as changeable. sk-ant-/sk-or- come before the generic sk-. */
  const KEY_PREFIX=[["sk-ant-","anthropic"],["sk-or-","openrouter"],["nvapi-","nvidia"],["gsk_","groq"],["AIza","gemini"],["sk-","openai"]];
  const keyProvider=k=>{k=String(k||"").trim();const m=KEY_PREFIX.find(([p])=>k.startsWith(p));return m?m[1]:null};
  /* The recommended model is picked from the live list: the first listed id wins. A hard-coded model is a last resort because fixed names get retired. */
  const MODEL_PREF={
    groq:["llama-3.3-70b-versatile","openai/gpt-oss-120b","llama-3.1-8b-instant"],
    nvidia:["nvidia/nemotron-3-super-120b-a12b","google/gemma-4-31b-it","moonshotai/kimi-k2.6","deepseek-ai/deepseek-v4.1-flash"],
    openrouter:["google/gemma-4-31b-it:free","nvidia/nemotron-3-super-120b-a12b:free"],
    gemini:["gemini-3.5-flash-lite","gemini-3.1-flash-lite","gemini-3.5-flash"],
    openai:["gpt-6-luna"],
    anthropic:["claude-haiku-4-5","claude-haiku-4-5-20251001","claude-sonnet-5-5"]
  };
  /* When the preference list goes stale, fall back to a cheap and fast member of the family. */
  const FAMILY={gemini:/^gemini-[\d.]+-flash(-lite)?$/,openai:/^gpt-[\d.]+-luna$/,anthropic:/haiku|sonnet/};
  const NONCHAT=/embed|whisper|tts|guard|safety|reward|parse|rerank|retriev|clip|vision|vlm|image|video|audio|transcri|live|translate|detector|calibration|deplot|kosmos|fuyu|code|orpheus|omni|diffusion|moderation|vila|neva|cosmos|dall-e|davinci|babbage|realtime|search|sora|computer/i;
  /* /models response: non-chat models are dropped; free models are flagged when prices are present (OpenRouter). A "models/" prefix on Gemini ids is trimmed. */
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
  /* Being listed does not mean usable (closed to the account, retired or unresponsive model); the UI tries the candidates in order. */
  function candidates(pid,list){
    const ids=new Set(list.map(m=>m.id)),out=(MODEL_PREF[pid]||[]).filter(x=>ids.has(x));
    for(const m of list)if(m.free===true&&!/reason|think/i.test(m.id))out.push(m.id);
    if(FAMILY[pid])for(const m of list)if(FAMILY[pid].test(m.id))out.push(m.id);
    return [...new Set(out)];
  }
  const pickModel=(pid,list)=>candidates(pid,list)[0]||null;
  /* Error class: the status code alone is not enough (Gemini answers a wrong key with 400, quota and rate limit are both 429, a missing model is 400 or 404). */
  function errKind(status,body,name){
    const b=String(body||"");
    if(name==="AbortError")return "time";
    if(!status)return "net";
    if(status===401||status===403||(status===400&&/api[ _-]?key|unauthori|credential/i.test(b)))return "key";
    /* Gemini and OpenAI return both the per-minute rate limit and the quota as 429: a day/balance word means quota, a per-minute word means a temporary limit. */
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

  const SYSTEM=`Sen "Rehber"sun: NeoWell'in yapay zekâ yardımcısı. Hekim, diyetisyen ya da antrenör değilsin; tanı koymaz, tedavi ve sağlık yorumu yapmazsın. Türkçe, sıcak, kısa ve net konuş. Cevap en fazla yaklaşık 90 kelime.

YAPABİLDİKLERİN (yalnız bunlar)
A. Haftalık yemek menüsü önermek (istek MENÜ İSTEĞİ olarak gelir).
B. Egzersiz programı önermek (istek program olarak gelir).
C. Bir yemeğin kalorisini ve proteinini tahmin etmek.
D. Bir egzersizin yaktığı kaloriyi tahmin etmek.

KURALLAR
1. Bunların dışındaki her konuda (sağlık durumu, belirti, hastalık, ilaç, takviye, tahlil, kilo yorumu, ağrı, hamilelik, ruh sağlığı, oruç, diyet ya da kalori hedefi tavsiyesi) yardım etme; tek cümleyle bu konuyu yapamadığını söyle ve uygunsa bir hekime ya da uzmana danışmasını öner. Hâlâ yalnızca A-D'yi önerebileceğini belirt.
2. Kalori ve protein değerleri tahmindir; kesin deme, reply'da tahmin olduğunu belirt. Porsiyonu adda yaz (ör. "1 dilim pizza").
3. Kalori hedefi, kilo verme ya da alma hızı, açık ya da fazla önerme. Çok düşük kalorili beslenme önerme.
4. Menüde ve programda hastalığa özel plan yapma. Program önerirken reply'da "ağrın, sakatlığın ya da sağlık sorunun varsa başlamadan hekime danış" uyarısını kısaca ver.
5. Kullanıcı bir belirti (baş dönmesi, bayılma, göğüs ağrısı, nefes darlığı, çarpıntı), kendine zarar verme ya da yeme bozukluğu işareti yazarsa başka bir şey önermeden hekime başvurmasını söyle, acil durumda 112; "flag" alanına "safety" yaz.
6. Veride olmayan şeyi uydurma, bilmediğini söyle.
7. Kullanıcı yediği ya da yaptığı egzersizi yazarsa "log" listesine ekle (yemek ve egzersiz; her yemek ayrı, değerler tahmin). Yemeğin kalorisi soruluyor ve yenmediyse "log" kullanma, "food" alanına yaz.

ÇIKTI: Yalnızca tek bir JSON nesnesi, başka hiçbir metin yok:
{"reply":"kullanıcıya metin","log":[],"flag":null,"food":null}
log öğeleri: {"type":"food","text":"pilav","g":100,"kcal":130,"protein":3,"carbs":28,"fat":1,"meal":"breakfast"} (meal breakfast/lunch/dinner/snack) | {"type":"exercise","min":30,"name":"Koşu","kcal":250}. Dünkü kayıt için "day":"yesterday" ekle.
food: {"name":"1 dilim pizza","kcal":280,"protein":12} ya da null.
Program istenirse "program" alanına {"name":"...","days":[{"n":"Gün adı","ex":["kimlik"]}]} yaz: yalnız KATALOG'daki kimlikler, gün başına 3-8 egzersiz.`;

  /* An exact age approaches an identifier, so the model gets a 5-year band (the Coach is open from 18). The energy calculation uses the exact age locally. */
  const ageBand=a=>{const l=a-a%5;return Math.max(l,18)+"-"+(l+4)};
  const f1=x=>x==null?"–":comma(r1(x));
  /* Context text: only the profile (when its switch is on) and the calorie goal; nothing else about the user goes to the model. */
  function contextText(d){
    const p=d.profile;
    if(!p)return "Kullanıcı profilini paylaşmadı; kişisel miktar tahmin etme.";
    const parts=[p.cm?p.cm+" cm":null,p.age?ageBand(p.age)+" yaş":null,p.sex==="m"?"erkek":p.sex==="f"?"kadın":null,p.act!=null?"hareket düzeyi "+["az","orta","çok"][p.act]:null,d.goalKcal?"günlük kalori hedefi "+d.goalKcal:null].filter(Boolean);
    return "PROFİL: "+(parts.join(", ")||"girilmemiş");
  }
  /* Local token counter: numbers only (day > provider|model > [requests, input, output]); text and identifiers never enter it. */
  const USAGE_DAYS=30,USAGE_KEYS=12;
  const usageOf=(j,ant)=>{
    const u=j&&j.usage;if(!u||typeof u!=="object")return null;
    const n=v=>Number.isFinite(v)&&v>0?Math.min(Math.round(v),1e7):0;
    const i=ant?n(u.input_tokens)+n(u.cache_read_input_tokens)+n(u.cache_creation_input_tokens):n(u.prompt_tokens),o=ant?n(u.output_tokens):n(u.completion_tokens);
    return i||o?{i,o}:null;
  };
  const dayShift=(day,k)=>{const d=new Date(day+"T12:00:00");d.setDate(d.getDate()+k);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
  function usageAdd(store,day,pm,u){
    const s=store&&typeof store==="object"&&!Array.isArray(store)?store:{},old=dayShift(day,1-USAGE_DAYS),out={};
    for(const d of Object.keys(s).sort().slice(-USAGE_DAYS*2))if(/^\d{4}-\d\d-\d\d$/.test(d)&&d>=old&&s[d]&&typeof s[d]==="object")out[d]=s[d];
    const t=out[day]||(out[day]={}),k=String(pm).slice(0,60);
    if(!t[k]&&Object.keys(t).length>=USAGE_KEYS)return out;
    const r=Array.isArray(t[k])?t[k]:(t[k]=[0,0,0]);
    r[0]=(+r[0]||0)+1;r[1]=(+r[1]||0)+u.i;r[2]=(+r[2]||0)+u.o;
    return out;
  }
  function usageSum(store,day){
    const old=dayShift(day,1-USAGE_DAYS);let n=0,tok=0;
    if(store&&typeof store==="object")for(const d of Object.keys(store))if(d>=old&&store[d]&&typeof store[d]==="object")for(const r of Object.values(store[d]))if(Array.isArray(r)){n+=+r[0]||0;tok+=(+r[1]||0)+(+r[2]||0)}
    return {n,tok};
  }
  return {usageOf,usageAdd,usageSum,REPLY_MAX,oneLine,pregnant,BROKEN,redFlag,parse,reported,cleanItems,cleanFood,cleanProgram,cleanMenu,shopList,MEAL_KEYS,catalog,catalogText,clampKcal,SYSTEM,contextText,macroOff,sportMet,keyProvider,MODEL_PREF,parseModels,candidates,pickModel,errKind,errText};
})();
if(typeof module!=="undefined")module.exports=CoachLib;
