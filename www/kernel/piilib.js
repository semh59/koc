"use strict";
/* Koç'a giden metinde kimlik bilgisini telefonda etiketle değiştirir ve yanıtta geri çevirir: saf mantık. Tarayıcıda global PiiLib, Node'da module.exports.
   Kapsam dışı (sızabilir): listede olmayan nadir ad, serbest anlatılan adres/tarif, bağlamsız şehir adı ("Ankara" tek başına), sıradan sözcükle aynı yazılan küçük harfli ad. Tam garanti değildir. */
const PiiLib=(()=>{
  const NAMES=`Abdullah Abdurrahman Adem Adnan Ahmet Akın Alican Ali Alparslan Alper Altan Anıl Arda Arif Aykut Bahadır Batuhan Bayram Bekir Berk Berkay Bilal Bülent Burak Cafer Caner Celal Cem Cengiz Cihan Cüneyt Davut Durmuş Efe Ekrem Emir Emrah Emre Engin Enes Eren Ercan Erdem Erhan Erkan Erol Ersin Ertuğrul Eyüp Faruk Ferhat Fatih Furkan Gökhan Gürkan Hakan Halil Hamdi Hamza Harun Hasan Hayati Hikmet Hilmi Hüseyin Hüsnü İbrahim İlhan İlker İlyas İsa İsmail Kaan Kadir Kazım Kemal Kenan Kerem Koray Kürşat Levent Lütfi Mahmut Mehmet Melih Mesut Metehan Metin Mert Muharrem Muhammed Murat Mustafa Nail Namık Necati Nedim Nihat Nuri Oğuz Okan Oktay Onur Orhan Orkun Osman Oytun Ömer Özcan Özgür Rasim Recep Remzi Rıdvan Rıza Sabri Sait Salih Samet Sedat Selçuk Selim Semih Sercan Serdar Serkan Server Sezer Sinan Soner Süleyman Şaban Tahsin Talha Tamer Taner Tarık Taylan Tayfun Teoman Timur Tolga Tunç Tuncay Turan Turgut Uğur Utku Vahit Vedat Veli Volkan Yasin Yaşar Yavuz Yiğit Yunus Yusuf Zafer Zekeriya Ziya
Asuman Aslı Aylin Ayla Aysel Ayşe Ayten Banu Beyza Buse Burcu Büşra Canan Cansu Cemile Damla Derya Dilara Dilan Duygu Ebru Ebrar Eda Edanur Elçin Elif Emine Esma Esra Evren Fadime Fatma Figen Filiz Fulya Gamze Gizem Gonca Gülay Gülşen Hacer Halime Handan Hande Hatice Havva Hayriye Hazal Hilal Hülya Işıl İlknur İrem Jale Kadriye Kevser Kezban Kübra Leyla Lütfiye Mediha Melek Melike Meltem Merve Meryem Müge Müjde Münevver Nalan Nazan Nazlı Nermin Nesrin Neslihan Nihal Nilay Nilüfer Nuray Nurcan Özge Özlem Pelin Perihan Rabia Rana Remziye Rukiye Sabiha Safiye Saliha Seda Selin Selma Sema Semra Serap Sevda Sevil Sevim Sevinç Sibel Sinem Songül Sümeyye Şengül Şerife Şeyma Şule Tuba Tuğba Tülay Tülin Türkan Ülkü Ümran Vildan Yasemin Yeliz Zehra Zeliha Zerrin Zeynep Zübeyde`.split(/\s+/);
  const STOP=new Set(`bugün dün yarın sabah akşam öğle gece ben biz sen bu şu o bir her koç neowell merhaba selam sayın teşekkürler günaydın tamam evet hayır pazartesi salı çarşamba perşembe cuma cumartesi pazar ocak şubat mart nisan mayıs haziran temmuz ağustos eylül ekim kasım aralık hanım bey hanımefendi beyefendi hoca doktor hemşire hasta kilo kahvaltı yemek spor türkiye türk ve ile de da mı mi için şimdi sonra önce hafta ay yıl gün saat dr doç prof uzm yok ne nedir sayım sayısı`.split(/\s+/));
  const low=s=>s.toLocaleLowerCase("tr");
  /* Katlama: tr küçük harf + ASCII ikizi (İ/I/ı, ş/s...); uzunluk korunur. */
  const fold=s=>low(s).replace(/[çğıöşü]/g,c=>({ç:"c",ğ:"g",ı:"i",ö:"o",ş:"s",ü:"u"})[c]);
  const NSET=new Set(NAMES.map(fold));
  /* Sıradan sözcükle aynı yazılan adlar: yalnız Büyük harfle ya da kesmeyle maskelenir. */
  const AMB=new Set(`metin bayram hayati rıza zafer yaşar duygu damla sema melek hilal pelin derya evren rana berk arda emir ebru aslı ayla burcu canan filiz gamze gizem gonca hande hazal jale meltem nazlı özlem sevda sevinç ülkü yasemin tayfun tunç uğur volkan erdem engin cihan kadir kerem mesut nuri serap akın anıl durmuş onur özgür salih levent işıl server veli`.split(" ").map(fold));
  const SUFS=new Set("in un nin nun e a ye ya i u yi yu de da te ta den dan ten tan le la yle yla im um ler lar cim cigim gil".split(" "));
  const IL=`Adana Adıyaman Afyonkarahisar Ağrı Aksaray Amasya Ankara Antalya Ardahan Artvin Aydın Balıkesir Bartın Batman Bayburt Bilecik Bingöl Bitlis Bolu Burdur Bursa Çanakkale Çankırı Çorum Denizli Diyarbakır Düzce Edirne Elazığ Erzincan Erzurum Eskişehir Gaziantep Giresun Gümüşhane Hakkari Hatay Iğdır Isparta İstanbul İzmir Kahramanmaraş Karabük Karaman Kars Kastamonu Kayseri Kırıkkale Kırklareli Kırşehir Kilis Kocaeli Konya Kütahya Malatya Manisa Mardin Mersin Muğla Muş Nevşehir Niğde Ordu Osmaniye Rize Sakarya Samsun Siirt Sinop Sivas Şanlıurfa Şırnak Tekirdağ Tokat Trabzon Tunceli Uşak Van Yalova Yozgat Zonguldak Antep Urfa Maraş Afyon`.split(/\s+/);
  const ILCE=`Kadıköy Beşiktaş Üsküdar Çankaya Keçiören Karşıyaka Bornova Konak Bakırköy Şişli Beyoğlu Maltepe Kartal Pendik Ümraniye Esenyurt Başakşehir Bahçelievler Avcılar Sarıyer Etimesgut Mamak Yenimahalle Altındağ Nilüfer Osmangazi Seyhan Muratpaşa Konyaaltı Selçuklu Meram Melikgazi Şahinbey Şehitkamil Tepebaşı Odunpazarı Çiğli Buca Bayraklı Gaziemir Kağıthane Zeytinburnu Esenler Bağcılar Küçükçekmece Sultanbeyli Tuzla Beykoz Çekmeköy Sancaktepe Ataşehir`.split(/\s+/);
  const PSET=new Set(IL.concat(ILCE).map(fold)),PAMB=new Set("van ordu batman aydın muş bolu konak tuzla buca meram seyhan".split(" ").map(fold));
  const PSUF=new Set("da de ta te dan den tan ten li liyim luyum".split(" "));
  const PCTX=/^(?:['’]\p{L}+)?(?:\s+\p{L}+){0,2}?\s+(?:yaşıyorum|oturuyorum|çalışıyorum|doğdum|doğumluyum|büyüdüm|taşındım|mahalle(?:si|sinde)?)(?![\p{L}])/u;
  /* Yemek/besin sözlüğü: uygulama foods.js adlarını deny() ile verir; il adı ve bu sözcükler "ben X" / "annem X" kalıbında ad sayılmaz. */
  const DENY=new Set();
  const deny=ws=>{for(const w of ws)for(const t of String(w).split(/[^\p{L}]+/u))if(t.length>=2)DENY.add(fold(t))};
  /* Sözcük: ad listesi (büyük/küçük, ASCII, ekli/eksiz) ya da il/ilçe (yalnız da/de/dan/den/li ekiyle ya da yaşam bağlamında). Dönüş [tür, kök] ya da null. */
  function tok(v,off,str){
    const ap=v.search(/['’]/),w=ap<0?v:v.slice(0,ap),f=fold(w),title=/^\p{Lu}[^\p{Lu}]*$/u.test(w),after=str.slice(off+v.length);
    const stem=(set,sfx)=>{
      if(ap>=0)return set.has(f)?{i:w.length}:null;
      for(let i=f.length;i>=3;i--)if(set.has(f.slice(0,i))&&(i===f.length||sfx.has(f.slice(i))))return {i,k:i<f.length};
      return null;
    };
    const n=stem(NSET,SUFS);
    if(n){
      const s=f.slice(0,n.i);
      if(/Sütlü\s$/.test(str.slice(Math.max(0,off-6),off))||/^\s+(?:Nazik|Kadın|Paşa|Hanım\s+(?:eli|göbeği))/.test(after)||DENY.has(s)&&!title&&ap<0)return null;
      return AMB.has(s)&&ap<0&&!title?null:["AD",w.slice(0,n.i)];
    }
    const p=stem(PSET,PSUF);
    if(!p||PAMB.has(f.slice(0,p.i))&&!title)return null;
    return ap>=0?(PSUF.has(fold(v.slice(ap+1)))?["YER",w]:null):p.k||PCTX.test(after)?["YER",w.slice(0,p.i)]:null;
  }
  const CAP="\\p{Lu}\\p{L}+",NAME=`${CAP}(?:\\s+${CAP})?`;
  const LIST=NAMES.concat(NAMES.map(n=>n.toLocaleUpperCase("tr"))).join("|");
  const SUF="(?:in|ın|un|ün|e|a|i|ı|u|ü|le|la|de|da|den|dan|nin|nın|ye|ya|yi|yı)";
  const FOOD="(?!\\s+(?:Nazik|Kadın|Paşa|Hanım\\s+(?:eli|göbeği)))";
  const ci=w=>`[${w[0].toLocaleUpperCase("tr")}${w[0]}]${w.slice(1)}`;
  const KIN="ben|adım|ismim|eşim|annem|babam|kardeşim|abim|ablam|kızım|oğlum|arkadaşım|sevgilim|kuzenim|patronum|komşum|hocam|doktorum|adı|ismi|yeğenim|dayım|teyzem|halam|amcam|torunum|dedem|ninem|anneannem|babaannem|öğretmenim|diyetisyenim|eczacım|müdürüm".split("|");
  const TITLE=["dr","doç","prof","uzm","op","yrd","arş","dt","ecz","av"].map(w=>`${ci(w)}\\.?|${w.toUpperCase()}\\.?`).join("|")+"|"+["doktor","hemşire","hekim","ebe","diyetisyen","eczacı","psikolog","fizyoterapist","avukat","öğretmen","hoca"].map(ci).join("|");
  const DATE="(?:\\d{1,2}[./-]\\d{1,2}[./-](?:19|20)?\\d{2}|\\d{1,2}\\s+(?:ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)(?:\\s+(?:19|20)\\d{2})?)";
  const KW="(?:[Mm]ah(?:allesi)?|[Ss]ok(?:ak|ağı)?|[Cc]ad(?:desi)?|[Bb]ulvarı|[Aa]pt|[Aa]partmanı)\\.?";
  const TAIL="(?:[\\s,]*(?:[Nn]o|[Dd]aire|[Dd]|[Kk]at)\\s*[:.]?\\s*\\d+[A-Za-z]?(?:\\s*/\\s*\\d+)?)*";
  const NOT="(?!(?:[Bb]u|[Şş]u|[Bb]ir|[Hh]er|[Vv]e|[Ii]le|[Aa]na|[Bb]izim)\\s)";
  const LBL="(?:hasta\\s*ad[ıi](?:\\s*soyad[ıi])?|ad[ıi]\\s*soyad[ıi]|ad\\s*soyad)";
  const NUM="(?:hasta\\s*(?:no|numaras[ıi])|protokol(?:\\s*(?:no|numaras[ıi]))?|dosya\\s*no|kimlik\\s*(?:no|numaras[ıi])|sigorta\\s*no|sgk\\s*no|barkod\\s*no)";
  const ORG="(?:A\\.?Ş\\.?|Ltd\\.?(?:\\s*Şti\\.?)?|[Hh]olding|[Üü]niversitesi|[Oo]kulu|[Ll]isesi|[Kk]oleji|[Ff]akültesi|[Şş]irketi|[Bb]ankası|[Bb]ank|[Hh]astanesi|[Hh]astane|[Kk]linik|[Kk]liniği|[Pp]oliklinik|[Pp]oliklniği|[Ee]czanesi|[Tt]ıp [Mm]erkezi|[Ss]ağlık [Oo]cağı|[Dd]ispanseri)";
  /* [etiket türü, desen, mod]. Desen: 1. grup korunan önek, 2. grup maskelenen değer. Sıra önemli: kesin biçimler önce, adlar en sonda. */
  const RULES=[
    ["EPOSTA",/()([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/gu],
    ["URL",/()((?:https?:\/\/|www\.)[^\s"'<>()]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|edu|gov)(?:\.tr)?\b(?:\/[^\s"'<>()]*)?)/giu],
    ["HESAP",/(?<![\w.])()(@[\w.]{3,})/gu],
    ["IBAN",/\b()(TR\d{2}(?: ?\d){22})(?!\d)/giu],
    ["KART",/(?<![\d.,])()(\d{4}([ -]?)\d{4}\3\d{4}\3\d{1,7}|\d{13,19})(?!\d)/gu,"luhn"],
    ["TC",/(?<![\d.,])()([1-9]\d{10})(?!\d)/gu],
    ["TELEFON",/(?<![\d.,])()(\(?(?:(?:\+|00)?90[ .-]?|0)?\(?5\d{2}\)?[ .-]?\d{3}[ .-]?\d{2}[ .-]?\d{2}|\(?0[ ]?\(?[2-4]\d{2}\)?[ .-]?\d{3}[ .-]?\d{2}[ .-]?\d{2}|\+\d{1,3}(?:[ .-]?\d{2,4}){3,4})(?!\d)/gu],
    ["PLAKA",/(?<![\p{L}\d])()((?:0[1-9]|[1-7]\d|8[01]) ?(?!(?:KG|GR|DK|SN|ML|CM|MG|DL|SA|MM|KCAL|PLT|ALT|AST|GGT|TSH|CRP|LDL|HDL|HGB|HCT|MCV|MCH|RBC|WBC|INR|ESR|ALP|BUN|CPK|LDH) ?\d)[A-ZÇĞİÖŞÜ]{1,3} ?\d{2,4})(?![\p{L}\d])/gu],
    ["AD",RegExp(`(?<![\\p{L}])(${LBL}\\s*[:.](?![ \\t]*\\[)\\s*)([^\\n,;|]{1,40})`,"giu")],
    ["NO",RegExp(`(?<![\\p{L}])(${NUM}\\s*[:.](?![ \\t]*\\[)\\s*)([^\\n,;|]{1,40})`,"giu")],
    ["DOGUM",RegExp(`(doğum(?:\\s+tarih|\\s+gün)?\\p{L}*[^\\d\\n]{0,15})(${DATE})`,"giu")],
    ["DOGUM",/(doğum\s+yıl\p{L}*[^\d\n]{0,15})((?:19|20)\d{2})/giu],
    ["DOGUM",RegExp(`()(${DATE}|(?:19|20)\\d{2})(?=[\\p{L}'’]*\\s*(?:tarihinde\\s+|yılında\\s+)?doğ(?:um|du))`,"giu")],
    ["ADRES",RegExp(`()((?:${NOT}(?:\\p{Lu}[\\p{L}'’]+|\\d{1,4})\\s+){1,3}${KW}(?![\\p{L}])${TAIL}|(?:${NOT}[\\p{L}'’]{2,}\\s+){1,3}(?:mah|sok|cad|apt|bulv)\\.${TAIL}|${NOT}[\\p{L}'’]{2,}\\s+mahallesi(?![\\p{L}])${TAIL})`,"gu")],
    ["ADRES",/(?<![\p{L}])()((?:[Nn]o|[Kk]at|D)\s*:\s*\d+[A-Za-z]?(?:\s*\/\s*\d+)?|[Dd]aire\s*[:.]?\s*\d+)/gu,"ctx"],
    ["ADRES",/((?:posta\s*kodu|\bPK)\s*[:.]?\s*)(\d{5})(?!\d)/giu],
    ["AD",RegExp(`((?:(?:${TITLE})\\s+)+)(${NAME})`,"gu"),"name"],
    ["AD",RegExp(`(?<![\\p{L}])((?:${KIN.map(ci).join("|")})\\s+)(${NAME})`,"gu"),"kin"],
    ["AD",RegExp(`(?<![\\p{L}])((?:[Bb]enim\\s+ad[ıi]m|[İi]smim)\\s+)(\\p{L}{3,})(?![\\p{L}'’])`,"gu"),"kin"],
    ["AD",RegExp(`(?<![\\p{L}])((?:${KIN.join("|")})\\s+)(${low(NAMES.join("|"))})(?![\\p{L}])`,"giu")],
    ["AD",RegExp(`()(${NAME})(?=\\s+(?:[Hh]anım|[Bb]ey|[Hh]anımefendi|[Bb]eyefendi)(?![\\p{L}]))`,"gu"),"name"],
    ["KURUM",RegExp(`()(${CAP}(?:\\s+${CAP}){0,2})(?=\\s+${ORG}(?![\\p{L}]))`,"gu"),"name"],
    ["AD",RegExp(`(?<![\\p{L}\\d]|Sütlü\\s)()((?:${LIST})(?=${SUF}?(?![\\p{L}])|['’])${FOOD}(?:\\s+${CAP})?)`,"gu"),"name"],
    ["AD",/(?<![\p{L}\d[])()(\p{L}+(?:['’]\p{L}+)?)/gu,"tok"]
  ];
  const luhn=s=>{const d=s.replace(/\D/g,"");let t=0;for(let i=0;i<d.length;i++){let n=+d[d.length-1-i];if(i%2){n*=2;if(n>9)n-=9}t+=n}return d.length>=13&&t%10===0};
  /* TC sağlama toplamı: maskeleme sağlaması olmayan 11 haneyi de maskeler; bu yalnız testte "kesin" ayrımı için. */
  const tcOk=s=>{if(!/^[1-9]\d{10}$/.test(s))return false;const d=[...s].map(Number),a=(d[0]+d[2]+d[4]+d[6]+d[8])*7-(d[1]+d[3]+d[5]+d[7]);return ((a%10)+10)%10===d[9]&&d.slice(0,10).reduce((x,y)=>x+y)%10===d[10]};
  const ADRCTX=/\b(?:mah|mh|sok|sk|cad|cd|bulv|apt)\b|mahalle|sokak|sokağı|cadde|bulvar|apartman|adres|posta kodu|\bPK\b|\bsite(?:si)?\b|\[ADRES\d+\]/i;
  const lab=l=>l.slice(1,l.search(/\d/));
  /* map: {"[AD1]":"Ahmet"}; verilirse aynı değer aynı etiketi alır ve yeni etiketler eklenir (tek istekteki tüm metinler için ortak). */
  function mask(text,map={}){
    const found=[];
    const tag=(kind,v)=>{
      found.push({kind,orig:v});
      const mine=Object.keys(map).filter(l=>lab(l)===kind),k=low(v);
      return mine.find(l=>low(map[l])===k)||(map[`[${kind}${mine.length+1}]`]=v,`[${kind}${mine.length+1}]`);
    };
    for(const [kind,re,mode] of RULES)text=text.replace(re,(m,p,v,...a)=>{
      let pre="",post="";const rest=m.slice(p.length+v.length),off=a[a.length-2],str=a[a.length-1];
      if(mode==="luhn"&&!luhn(v))return m;
      if(mode==="ctx"&&!ADRCTX.test(str.slice(Math.max(0,off-70),off+m.length+70)))return m;
      if(mode==="tok"){
        const r=tok(v,off,str);
        return r?p+tag(r[0],r[1])+v.slice(r[1].length)+rest:m;
      }
      if(mode==="name"||mode==="kin"){
        const t=v.split(/\s+/);
        while(t.length&&STOP.has(low(t[0])))pre+=t.shift()+" ";
        while(t.length&&STOP.has(low(t[t.length-1])))post=" "+t.pop()+post;
        if(!t.length||mode==="kin"&&(DENY.has(fold(t[0]))||PSET.has(fold(t[0]))))return m;
        v=t.join(" ");
      }
      return p+pre+tag(kind,v)+post+rest;
    });
    return {text,found,map};
  }
  /* Son kapı: sağlayıcıya giden tüm iletiler. keep (sabit kural metni) maskelenmez; etiketler idempotenttir, tablo msgs.pii'de ortaktır. */
  function maskMsgs(msgs,keep=""){
    const map=msgs.pii||{},out=msgs.map(m=>{const c=String(m.content),k=keep&&c.startsWith(keep)?keep:"";return {...m,content:k+mask(c.slice(k.length),map).text}});
    out.pii=map;return out;
  }
  const unmask=(text,map)=>map?String(text).replace(/\[([A-Za-z]+\d+)\]/g,(m,k)=>map[`[${k.toUpperCase()}]`]??m):text;
  return {mask,maskMsgs,deny,unmask,tcOk,NAMES};
})();
if(typeof module!=="undefined")module.exports=PiiLib;
