"use strict";
/* Koç: saf mantık (DOM ve depolama yok). Tarayıcıda global CoachLib, Node'da module.exports. */
const CoachLib=(()=>{
  const low=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();

  /* Uygulama tarafı güvenlik taraması: model yanıtından bağımsız çalışır. */
  const FLAGS=[
    ["mind",/intihar|kendime zarar|kendimi öldür|ölmek istiyorum|yaşamak istemiyorum|kendimi kes|hayatıma son|ölsem iyi/],
    ["emergency",/bayıl|göğüs(üm)? ağr|göğsüm sıkış|nefes darl|nefes alam|nefesim daral|felç|kan kus|kanlı kus|kolum uyuş|konuşam[ıi]yor|yüzüm kay/],
    ["ed",/yedikten sonra kus|kusmaya çalış|kusuyorum|tıkınıyorum|tıkınma|laksatif|yemek yemekten kork|günlerce aç|hiçbir şey yemiyorum|hiç yemiyorum|kilo vermek için kus|yemeyi bırak/],
    ["check",/baş(ım)? dön|başım dönüyor|çarpıntı|gözüm(ün önü)? karar|gözlerim karar|titreme|aşırı halsiz|çok halsiz/]
  ];
  function redFlag(text){
    const t=low(text);
    for(const [lv,re] of FLAGS)if(re.test(t))return lv;
    return null;
  }

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
  function parse(text){
    let s=String(text==null?"":text).trim();
    s=s.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
    const a=s.indexOf("{"),b=a<0?-1:end(s,a);
    if(b>a){
      try{
        const o=JSON.parse(s.slice(a,b+1));
        if(o&&typeof o==="object"&&typeof o.reply==="string"){
          return {reply:o.reply.trim().slice(0,1500),log:Array.isArray(o.log)?o.log:[],propose:o.propose&&typeof o.propose==="object"?o.propose:null,flag:typeof o.flag==="string"?o.flag:null,food:o.food&&typeof o.food==="object"?o.food:null,notif:o.notif&&typeof o.notif==="object"?o.notif:null,program:o.program&&typeof o.program==="object"?o.program:null,menu:o.menu&&typeof o.menu==="object"?o.menu:null};
        }
      }catch(e){}
    }
    return {reply:s.replace(/[{}]/g,"").slice(0,1500),log:[],propose:null,flag:null,food:null,notif:null,program:null,menu:null};
  }

  const num=(x,lo,hi)=>{const v=typeof x==="string"?parseFloat(x.replace(",",".")):x;return Number.isFinite(v)&&v>=lo&&v<=hi?v:null};
  /* Kayıt önerilerini doğrula. Geçersiz olanlar atılır, en fazla 8 kayıt. */
  function cleanItems(items){
    const out=[];
    for(const it of (Array.isArray(items)?items:[]).slice(0,8)){
      if(!it||typeof it!=="object")continue;
      const day=it.day==="yesterday"?"yesterday":"today";
      if(it.type==="yemek"){
        const kcal=num(it.kcal,0,5000),text=String(it.text||"").trim().slice(0,120);
        if(!text&&kcal==null)continue;
        out.push({type:"yemek",text,kcal,p:num(it.protein!=null?it.protein:it.p,0,300),day});
      }else if(it.type==="su"){const ml=num(it.ml,50,2000);if(ml!=null)out.push({type:"su",ml:Math.round(ml),day})}
      else if(it.type==="kilo"){const kg=num(it.kg,20,400);if(kg!=null)out.push({type:"kilo",kg:Math.round(kg*10)/10,day})}
      else if(it.type==="spor"){const min=num(it.min,1,600);if(min!=null)out.push({type:"spor",min:Math.round(min),name:String(it.name||"Spor").trim().slice(0,40)||"Spor",day})}
      else if(it.type==="not"){const text=String(it.text||"").trim().slice(0,300);if(text)out.push({type:"not",text,day})}
    }
    return out;
  }
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
            const [id,q0]=Array.isArray(x)?x:[x&&x.id,x&&x.q],c=typeof id==="string"?cat[id]:null;
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
    const eq=EQ[o.q]||EQ.Salon,lv=Math.max(0,LV.indexOf(o.l)),pr=new Set(prio),rank=e=>(pr.has(e.id)?0:2)+(e.l===o.l?0:1),n={},out=[];
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

  const SYSTEM=`Sen "Koç"sun: tek bir kişiye özel beslenme, spor ve yaşam koçu. Hekim değilsin ve tanı koymazsın. Türkçe, sıcak, kısa ve net konuş. Suçlayıcı olma. Cevabın en fazla yaklaşık 90 kelime olsun, kullanıcı detay istemedikçe.

KURALLAR
1. Sayıları yalnızca "HESAPLANAN" ve "SON 14 GÜN" bölümlerinden al. Kilo, harcama, hız gibi sayıları kendin hesaplama veya uydurma. Sadece yemek için kalori ve protein tahmini yapabilirsin.
2. Kalori hedefini kendin değiştirme. Değişiklik gerekirse "propose" alanında öner, kullanıcı onaylar.
3. Çok düşük kalori veya hızlı kilo kaybı önerme. Hamilelik, emzirme, 18 yaş altı, yeme bozukluğu geçmişi, ciddi hastalık veya ilaç kullanımı varsa kalori açığı önerme, hekime yönlendir.
4. Baş dönmesi, bayılma, göğüs ağrısı, nefes darlığı, çarpıntı gibi belirtilerde önce hekime başvurmasını söyle. Acil belirtilerde 112. "flag" alanına "safety" yaz.
5. İlaç, doz, takviye tedavisi önerme.
6. Yeme bozukluğu işareti görürsen kısıtlama önerme, yargılamadan bir uzmana yönlendir.
7. Bilmediğin veya veride olmayan şeyi sor, tahmin yürütme.
8. Kullanıcı bir şey yediğini, içtiğini, tartıldığını veya spor yaptığını yazarsa "log" listesine ekle. Kalori ve protein değerlerini makul bir tahmin olarak ver, kesinmiş gibi söyleme.
9. Kullanıcı bir yemeğin ya da besinin kalorisini sorarsa ve yediğini söylemiyorsa "log" kullanma; "food" alanına tek porsiyonluk makul bir tahmin yaz. Porsiyonu adda belirt (ör. "1 dilim pizza"). Tahmin olduğunu reply'da söyle.
10. Kas, eklem ya da sırt ağrısında ve sakatlıkta tanı koyma, tedavi ya da egzersiz reçetesi verme: ağrıyı yapan hareketi ve antrenmanı bırakmasını, ağrı sürer ya da artarsa hekime veya fizyoterapiste başvurmasını söyle.
11. İlaç ve takviye sorularında (doz, etkileşim, başlama, bırakma) yorum yapma, hekime ya da eczacıya yönlendir.
12. Program önerirken reply'da "ağrın, sakatlığın ya da sağlık sorunun varsa başlamadan hekime danış" uyarısını kısaca ver. Hamilelik veya emzirmede, yakın zamanda ameliyatta ya da ciddi hastalıkta önce hekime yönlendir. 18 yaş altında ağır yük ve kalori açığı içeren program önerme, ailesi ve hekimiyle planlamasını söyle. Yeme bozukluğu işaretinde kalori yakmak için spor önerme.

ÇIKTI: Yalnızca tek bir JSON nesnesi, başka hiçbir metin yok:
{"reply":"kullanıcıya metin","log":[],"propose":null,"flag":null,"notif":null,"food":null}
log öğeleri: {"type":"yemek","text":"2 haşlanmış yumurta","kcal":140,"protein":12} | {"type":"su","ml":250} | {"type":"kilo","kg":83.7} | {"type":"spor","min":30,"name":"Yürüyüş"} | {"type":"not","text":"..."}. Dünkü kayıt için "day":"yesterday" ekle.
propose: {"kcal":1900,"why":"kısa neden"} ya da null.
food: {"name":"1 dilim pizza","kcal":280,"protein":12} ya da null.
Program istenirse "program" alanına {"name":"...","days":[{"n":"Gün adı","ex":["kimlik"]}]} yaz: yalnız KATALOG'daki kimlikler, gün başına 3-8 egzersiz.
Sabah planı istenirse "notif" alanına {"morning":"...","afternoon":"...","evening":"..."} ekle: her biri en fazla 110 karakter, bildirim metni, rakam uydurma.`;

  const f1=x=>x==null?"–":String(Math.round(x*10)/10).replace(".",",");
  /* Bağlam metni. d: uygulamanın hesapladığı veri. */
  function contextText(d){
    const L=[];
    L.push("PROFİL: "+[d.profile.cm?d.profile.cm+" cm":null,d.profile.age?d.profile.age+" yaş":null,d.profile.sex==="m"?"erkek":d.profile.sex==="f"?"kadın":null,d.profile.act!=null?"hareket düzeyi "+["az","orta","çok"][d.profile.act]:null].filter(Boolean).join(", ")||"girilmemiş");
    if(d.profile.note)L.push("SAĞLIK NOTU (kullanıcı yazdı): "+d.profile.note);
    L.push(`HEDEFLER: kilo ${d.goals.kg||"yok"}, kalori ${d.goals.kcal||"yok"}, su ${d.goals.water} ml, spor ${d.goals.sport} dk/hafta`);
    const c=d.calc;
    L.push(`HESAPLANAN: trend kilo ${f1(c.trendKg)} kg, hız ${c.slope==null?"yetersiz veri":f1(c.slope)+" kg/hafta"}, tahmini harcama ${c.tdee?Math.round(c.tdee/10)*10+" kcal ("+c.source+")":"hesaplanamadı"}, önerilen hedef ${c.target||"–"} kcal, protein aralığı ${c.protein?c.protein[0]+"-"+c.protein[1]+" g":c.proteinDoc?"hekimle belirlenmeli (yüksek protein önerme)":"–"}`);
    if(c.block)L.push("KISIT: "+c.why+". Kalori açığı ve oruç önerme, hekime yönlendir.");
    const hs=d.days.some(r=>r.sl),hm=d.days.some(r=>r.mo);
    L.push("SON 14 GÜN (gün | kilo | kcal | protein g | su ml | spor dk | adım"+(hs?" | uyku sa":"")+(hm?" | ruh hali 1-5":"")+"):");
    for(const r of d.days)L.push(`${r.d} | ${f1(r.kg)} | ${r.kcal||"–"} | ${r.p||"–"} | ${r.su||"–"} | ${r.sport||"–"} | ${r.ad||"–"}`+(hs?` | ${r.sl?f1(r.sl/60):"–"}`:"")+(hm?` | ${r.mo||"–"}`:""));
    L.push("BUGÜN: "+(d.today.length?d.today.join("; "):"kayıt yok")+` (saat ${d.now})`);
    if(d.workouts.length)L.push("SON ANTRENMANLAR: "+d.workouts.join(" | "));
    if(d.weekSets&&Object.keys(d.weekSets).length)L.push("BU HAFTA TAMAMLANAN SET (bölgeye göre): "+Object.keys(d.weekSets).map(k=>k+" "+d.weekSets[k]).join(", "));
    if(d.notes.length)L.push("SON NOTLAR: "+d.notes.join(" | "));
    if(d.meds&&d.meds.length){
      L.push("İLAÇLAR (kullanıcının kendi girdiği hatırlatıcı kaydı; doz veya ilaç değişikliği önerme, ilaçla ilgili soruları hekime/eczacıya yönlendir):");
      for(const m of d.meds)L.push(`${m.n}${m.d?" "+m.d:""} | saatler ${m.t.join(", ")}${m.w?" | haftanın günleri "+m.w.join(","):""} | son 7 gün: ${m.a?`${m.a.taken}/${m.a.total} alındı, ${m.a.missed} kaçırılan${m.a.late?`, ${m.a.late} bugün gecikti (gün bitene kadar eklenebilir, kaçırılan değil)`:""}, ${m.a.skipped} atlanan`:"doz yok"}${m.left!=null?` | stok ~${m.left} doz`:""}`);
    }
    return L.join("\n");
  }
  return {low,redFlag,parse,cleanItems,cleanFood,cleanProgram,cleanMenu,shopList,MEAL_KEYS,catalog,clampKcal,SYSTEM,contextText};
})();
if(typeof module!=="undefined")module.exports=CoachLib;
