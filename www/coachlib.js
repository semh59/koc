"use strict";
/* Koç: saf mantık (DOM ve depolama yok). Tarayıcıda global CoachLib, Node'da module.exports. */
const CoachLib=(()=>{
  const low=s=>String(s||"").replace(/İ/g,"i").replace(/I/g,"ı").toLowerCase();

  /* Uygulama tarafı güvenlik taraması: model yanıtından bağımsız çalışır. */
  const FLAGS=[
    ["mind",/intihar|kendime zarar|kendimi öldür|ölmek istiyorum|yaşamak istemiyorum|kendimi kes/],
    ["emergency",/bayıl|göğüs(üm)? ağr|göğsüm sıkış|nefes darl|nefes alam|nefesim daral|felç|kan kus|kanlı kus|kolum uyuş|konuşam[ıi]yor|yüzüm kay/],
    ["ed",/yedikten sonra kus|kusmaya çalış|kusuyorum|tıkınıyorum|tıkınma|laksatif|yemek yemekten kork|günlerce aç|hiçbir şey yemiyorum/],
    ["check",/baş(ım)? dön|başım dönüyor|çarpıntı|gözüm(ün önü)? karar|gözlerim karar|titreme|aşırı halsiz|çok halsiz/]
  ];
  function redFlag(text){
    const t=low(text);
    for(const [lv,re] of FLAGS)if(re.test(t))return lv;
    return null;
  }

  /* Model çıktısını toleranslı ayrıştır. */
  function parse(text){
    let s=String(text==null?"":text).trim();
    s=s.replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
    const a=s.indexOf("{"),b=s.lastIndexOf("}");
    if(a>=0&&b>a){
      try{
        const o=JSON.parse(s.slice(a,b+1));
        if(o&&typeof o==="object"&&typeof o.reply==="string"){
          return {reply:o.reply.trim().slice(0,1500),log:Array.isArray(o.log)?o.log:[],propose:o.propose&&typeof o.propose==="object"?o.propose:null,flag:typeof o.flag==="string"?o.flag:null,notif:o.notif&&typeof o.notif==="object"?o.notif:null};
        }
      }catch(e){}
    }
    return {reply:s.replace(/[{}]/g,"").slice(0,1500),log:[],propose:null,flag:null,notif:null};
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

ÇIKTI: Yalnızca tek bir JSON nesnesi, başka hiçbir metin yok:
{"reply":"kullanıcıya metin","log":[],"propose":null,"flag":null,"notif":null}
log öğeleri: {"type":"yemek","text":"2 haşlanmış yumurta","kcal":140,"protein":12} | {"type":"su","ml":250} | {"type":"kilo","kg":83.7} | {"type":"spor","min":30,"name":"Yürüyüş"} | {"type":"not","text":"..."}. Dünkü kayıt için "day":"yesterday" ekle.
propose: {"kcal":1900,"why":"kısa neden"} ya da null.
Sabah planı istenirse "notif" alanına {"morning":"...","afternoon":"...","evening":"..."} ekle: her biri en fazla 110 karakter, bildirim metni, rakam uydurma.`;

  const f1=x=>x==null?"–":String(Math.round(x*10)/10).replace(".",",");
  /* Bağlam metni. d: uygulamanın hesapladığı veri. */
  function contextText(d){
    const L=[];
    L.push("PROFİL: "+[d.profile.cm?d.profile.cm+" cm":null,d.profile.age?d.profile.age+" yaş":null,d.profile.sex==="m"?"erkek":d.profile.sex==="f"?"kadın":null,d.profile.act!=null?"hareket düzeyi "+["az","orta","çok"][d.profile.act]:null].filter(Boolean).join(", ")||"girilmemiş");
    if(d.profile.note)L.push("SAĞLIK NOTU (kullanıcı yazdı): "+d.profile.note);
    L.push(`HEDEFLER: kilo ${d.goals.kg||"yok"}, kalori ${d.goals.kcal||"yok"}, su ${d.goals.water} ml, spor ${d.goals.sport} dk/hafta`);
    const c=d.calc;
    L.push(`HESAPLANAN: trend kilo ${f1(c.trendKg)} kg, hız ${c.slope==null?"yetersiz veri":f1(c.slope)+" kg/hafta"}, tahmini harcama ${c.tdee?Math.round(c.tdee/10)*10+" kcal ("+c.source+")":"hesaplanamadı"}, önerilen hedef ${c.target||"–"} kcal, protein aralığı ${c.protein?c.protein[0]+"-"+c.protein[1]+" g":"–"}`);
    L.push("SON 14 GÜN (gün | kilo | kcal | protein g | su ml | spor dk):");
    for(const r of d.days)L.push(`${r.d} | ${f1(r.kg)} | ${r.kcal||"–"} | ${r.p||"–"} | ${r.su||"–"} | ${r.sport||"–"}`);
    L.push("BUGÜN: "+(d.today.length?d.today.join("; "):"kayıt yok")+` (saat ${d.now})`);
    if(d.workouts.length)L.push("SON ANTRENMANLAR: "+d.workouts.join(" | "));
    if(d.notes.length)L.push("SON NOTLAR: "+d.notes.join(" | "));
    return L.join("\n");
  }
  return {low,redFlag,parse,cleanItems,clampKcal,SYSTEM,contextText};
})();
if(typeof module!=="undefined")module.exports=CoachLib;
