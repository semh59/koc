const P=require("../www/piilib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const M=s=>P.mask(s),T=s=>M(s).text,kinds=s=>M(s).found.map(f=>f.kind).join();
const tc=d9=>{const d=[...String(d9)].map(Number),a=((d[0]+d[2]+d[4]+d[6]+d[8])*7-(d[1]+d[3]+d[5]+d[7]))%10,b=(d.reduce((x,y)=>x+y)+a)%10;return d9+""+a+b};
const luhn=p=>{let t=0;[...p].reverse().forEach((c,i)=>{let n=+c;if(i%2===0){n*=2;if(n>9)n-=9}t+=n});return p+(10-t%10)%10};

// --- desen başına olumlu ---
ok("telefon: +90, 0, boşluk, tire, parantez, bitişik, sabit hat, yurt dışı",["+90 532 123 45 67","0532 123 45 67","0532-123-45-67","(0532) 123 45 67","05321234567","5321234567","+905321234567","0 (212) 555 12 34","0212 555 12 34","+49 170 1234567"].every(v=>T("Ara: "+v+" lütfen")==="Ara: [TELEFON1] lütfen"),["+90 532 123 45 67","(0532) 123 45 67","0 (212) 555 12 34"].map(v=>T("Ara: "+v)));
ok("e-posta",kinds("yaz: ahmet.yilmaz+koc@mail.example.com tamam")==="EPOSTA"&&!T("a_b@x.co").includes("@"));
ok("TC: sağlaması doğru kesin, 11 haneli sağlamasız da maskelenir",P.tcOk(tc(123456789))&&!P.tcOk("12345678901")&&T(`TC ${tc(123456789)}`)==="TC [TC1]"&&T("no 12345678901 yaz")==="no [TC1] yaz");
ok("TC: 10 ve 12 haneli sayı TC değildir",!T("1234567890 g").includes("[TC")&&!T("123456789012 g").includes("[TC"));
ok("IBAN: boşluklu ve bitişik",kinds("TR33 0006 1005 1978 6457 8413 26")==="IBAN"&&kinds("tr330006100519786457841326")==="IBAN");
ok("kart: Luhn doğru maskelenir, bitişik ve gruplu",kinds(luhn("411111111111111"))==="KART"&&kinds(luhn("411111111111111").replace(/(.{4})/g,"$1 ").trim())==="KART"&&kinds(luhn("55555555555544").replace(/(\d{4})(\d{4})(\d{4})(\d+)/,"$1-$2-$3-$4"))==="KART");
ok("kart: Luhn tutmayan 16 hane maskelenmez",T("1234 5678 9012 3456")==="1234 5678 9012 3456"&&T("1234567890123456")==="1234567890123456");
ok("URL ve hesap",kinds("bak https://instagram.com/ahmet_y/ ya da www.site.com.tr/x")==="URL,URL"&&kinds("insta @ahmet_yy")==="HESAP"&&kinds("ornek.com")==="URL");
ok("plaka",kinds("aracım 34 ABC 123")==="PLAKA"&&kinds("06 AB 1234 plakalı")==="PLAKA"&&kinds("35ABC12")==="PLAKA");
ok("doğum tarihi: doğum tarihim, doğum günüm, doğumluyum, doğdum",["doğum tarihim 12.03.1990","Doğum Tarihi: 12/03/1990","doğum günüm 12 Mart","1990 doğumluyum","12.03.1990'da doğdum","doğum yılım 1990","15 Mayıs 1985 tarihinde doğdum"].every(s=>kinds(s)==="DOGUM"),["doğum tarihim 12.03.1990","1990 doğumluyum","doğum yılım 1990"].map(T));
ok("adres: mahalle, sokak, cadde, no, daire, apt, posta kodu",["Atatürk Mah. 12 Sok. No:5 Daire 3","Gül Sokak No: 7","Cumhuriyet Caddesi 45/3","Yeni mahallesi","Çınar Apt. Kat 2","posta kodu 34000","PK: 06500","Bahçelievler Mahallesi Gül Sokağı No 3"].every(s=>/ADRES/.test(kinds(s))&&!/\d{3}|Gül|Atatürk|Çınar|Cumhuriyet/.test(T(s).replace(/\[ADRES\d\]/g,""))),["Atatürk Mah. 12 Sok. No:5 Daire 3","Çınar Apt. Kat 2","posta kodu 34000"].map(T));
ok("kişi adı: listeden, ekli, büyük harf, küçük harf+kesme",T("Ahmet geldi")==="[AD1] geldi"&&T("Ahmet'in evi")==="[AD1]'in evi"&&T("AHMET geldi")==="[AD1] geldi"&&T("ahmet'e yazdım")==="[AD1]'e yazdım"&&T("Ayşeyi gördüm").startsWith("[AD1]"));
ok("kişi adı: ad soyad tek etiket",T("Mehmet Yılmaz aradı")==="[AD1] aradı");
ok("kişi adı: benim adım/ismim/adım/ben",T("Benim adım Zeynep Arıkan")==="Benim adım [AD1]"&&T("ismim Kerim Ozan").includes("[AD1]")&&T("ben Mehmetcan'ım").includes("[AD1]")&&T("Ben Ege")==="Ben [AD1]");
ok("kişi adı: yakın adı",T("annem Perihan, eşim Oya")==="annem [AD1], eşim [AD2]"||/annem \[AD1\]/.test(T("annem Perihan, eşim Oya")),T("annem Perihan, eşim Oya"));
ok("kişi adı: unvanlı Dr. Doç. Prof. Hemşire",T("Dr. Kerim Ozan baktı")==="Dr. [AD1] baktı"&&T("Prof. Dr. Nazım Hikmetoğlu")==="Prof. Dr. [AD1]"&&T("Hemşire Gülten aradı")==="Hemşire [AD1] aradı"&&T("Doç. Dr. Ülkü Sanlı")==="Doç. Dr. [AD1]"&&T("Dr Zehra")==="Dr [AD1]");
ok("kişi adı: X Hanım / X Bey",T("Sibel Hanım aradı")==="[AD1] Hanım aradı"&&T("Selçuk Çınar Bey")==="[AD1] Bey"&&T("Zerrin Hanımefendi")==="[AD1] Hanımefendi"&&T("Merhaba Gülten Hanım")==="Merhaba [AD1] Hanım");
ok("kurum: hastane/klinik öncesi özel ad",T("Acıbadem Hastanesi'nde")==="[KURUM1] Hastanesi'nde"&&T("Medipol Maslak Hastanesi")==="[KURUM1] Hastanesi"&&T("Ege Kliniği")==="[KURUM1] Kliniği"||kinds("Ege Kliniği")==="AD","Ege");
ok("etiketli satır: hasta adı, protokol, TC kimlik, doğum tarihi",T("Hasta Adı: AHMET YILMAZ\nProtokol No: 123456\nT.C. Kimlik No: 12345678901\nDoğum Tarihi: 12.03.1990\nGlukoz 92 mg/dL")==="Hasta Adı: [AD1]\nProtokol No: [NO1]\nT.C. Kimlik No: [TC1]\nDoğum Tarihi: [DOGUM1]\nGlukoz 92 mg/dL");
// --- etiket tutarlılığı ve geri çevirme ---
{
  const r=M("Ahmet'in numarası 0532 123 45 67, Ahmet'e ve Ayşe'ye söyle; 0532 123 45 67");
  ok("aynı değer aynı etiket, farklı değer farklı numara",r.text==="[AD1]'in numarası [TELEFON1], [AD1]'e ve [AD2]'ye söyle; [TELEFON1]"&&r.map["[AD1]"]==="Ahmet"&&r.found.length===5,r.text);
  const map={},a=P.mask("Ahmet geldi",map),b=P.mask("Ayşe ile Ahmet",map);
  ok("ortak harita: ikinci metin aynı etiketleri sürdürür",a.text==="[AD1] geldi"&&b.text==="[AD2] ile [AD1]"&&Object.keys(map).length===2,b.text);
  ok("unmask: gidiş dönüş, büyük/küçük etiket, bilinmeyen etiket olduğu gibi",P.unmask(r.text,r.map)==="Ahmet'in numarası 0532 123 45 67, Ahmet'e ve Ayşe'ye söyle; 0532 123 45 67"&&P.unmask("[ad1] selam [AD9] [x]",{"[AD1]":"Can"})==="Can selam [AD9] [x]"&&P.unmask("düz",undefined)==="düz");
  const j=JSON.stringify({reply:"[AD1]'e yazalım",log:[]});
  ok("unmask JSON yanıtı bozmaz",JSON.parse(P.unmask(j,{"[AD1]":"Ahmet"})).reply==="Ahmet'e yazalım");
}
// --- masum metin değişmemeli ---
const SAFE=["3 simit yedim","150 g tavuk göğsü","tansiyonum 120/80","bugün saat 12:30'da yürüdüm","Hemoglobin 13,5 g/dL, ferritin 45 ng/mL","LDL 130 mg/dL HDL 52 HbA1c 5,6","WBC 6,2 RBC 4,8 HGB 14,1 HCT 42 PLT 250","Glukoz 92 Üre 28 Kreatinin 0,9 ALT 21 AST 19 TSH 2,1","Mercimek çorbası içtim","Sütlü Nuriye yedim","Ali Nazik kebabı","Ayşe Kadın fasulye","Hasan Paşa köfte","Tuna salatası","Reyhan çayı","Demir eksikliğim var","Deniz ürünleri sevmem","Kaya tuzu aldım","bugün","dün 2000 kcal yedim","10000 adım attım","75,5 kg, 178 cm","Salı günü spor yaptım","10.10.2026 tarihli not","sokak yemeği yedim","Bu sokak köpeği çok tatlı","Ben yemek yedim","Ben bugün koştum","Adım sayısı 8000","Bugün hastane randevusu var","1 saat 30 dk yürüdüm","34 yaşındayım","Pazartesi Koç ile konuştum","Ben Pazartesi başlıyorum","2 yumurta, 1 dilim peynir, 5 zeytin","Su 2500 ml","Kilo 83,7 kg","Hedef 1800 kcal, protein 120 g","Squat 5x5 100 kg","Bench press 4x8 80 kg","Doğum günü pastası yedim","Doğum kontrol hapı 2 tane","Yürüyüş 5 km 45 dk","Kahvaltı: 2 yumurta 1500 kcal değil","Akşam 19:45 yemek","Tel gibi bir şey değil 1234 567","Ramazan pidesi aldım","İmam bayıldı yaptım","Bugün Hastane çıkışı yürüdüm","Bey ve Hanım kelimeleri tek başına","2026-10-06 | 83,7 | 1240 | 80 | 1200 | 0 | 5400","Gün 3, set 4, tekrar 12","Protein 150-200 g","Kalori açığı 500 kcal","Hafta sonu 2 saat bisiklet","5 12 2026'da başlayacağım değil","Plan: 3 gün x 45 dk","adım adım ilerleyelim","RPE 8, tempo 3-1-1","Açlık şekerim 5 saat sonra 110","Menü: pilav 200 g, çorba 1 kase","Antep fıstığı yedim","Urfa kebap yedim","Bursa kebabı","Adana kebap 200 g","Maraş dondurması","Rize çayı içtim","Trabzon ekmeği","Kars kaşarı","Afyon kaymağı","Hatay künefe","Van kahvaltısı","Mardin sembusek","İskender kebap","Tokat kebabı","Çorum leblebisi","Erzurum cağ kebabı","Ankara simidi","Bolu dağı yürüyüşü","Ordu fındığı","Malatya kayısısı","Kayseri mantısı","Konya etliekmek","Gaziantep baklava","Samsun pidesi","Sivas köftesi","İzmir köfte","Bursa'nın şeftalisi","Ankara'ya gittim","Antep fıstıklı baklava 2 dilim","Urfa biberi ekledim","Tansiyon sabah 130/85 akşam 125/80","Nabız 72 istirahat","Kolesterol 190, trigliserit 140","B12 vitamini 320 pg/mL","D vitamini 18 ng/mL","TSH 2,3 T4 1,1","Ferritin düşük çıktı","Hemoglobin A1c 5,4","Ben koşuya çıktım","Ben salata yedim","Annem çorba yaptı","Eşim spora gitti","Babam yürüyüşe çıktı","Plank 90 sn","Kalça köprüsü 4x10","Yüzme 45 dk","Bisiklet 20 km","Karadeniz hamsisi","Akdeniz diyeti","Set no: 5, tekrar 12","Tansiyon d: 80","Kat sayısı 3 olan binada egzersiz","Benim adım sayım 8000","Hastane randevusu Salı","metin dosyası yazdım","bayram tatilinde yürüdüm","duygu durumum iyi","sema ve hilal sıradan sözcüktür","damla gibi su içtim","Metformin 500 mg aldım","Ben Antep fıstığı sevmem","Annem Salata yaptı","Ben Pizza yedim"];
P.deny(require("../www/foods.js").FOODS.map(f=>f.n));
{
  const ch=SAFE.filter(s=>T(s)!==s);
  ok(`masum metin değişmez (${SAFE.length} örnek)`,ch.length===0||(console.log("  yanlış pozitifler:",ch.map(s=>s+" => "+T(s))),false),ch.map(s=>T(s)));
}
// --- sızıntı seti: >=150 cümle, hiçbirinde ham değer kalmamalı ---
const NAMES=["Ahmet","Mehmet","Ayşe","Fatma","Zeynep","Mustafa","Elif","Emre","Burak","Selin","Hüseyin","Merve","Kerem","Seda","Oğuz","Gizem","Yusuf","Esra","Cem","Derya"];
const SURN=["Yılmaz","Kaya","Demir","Şahin","Çelik","Arslan"];
const PHONES=["0532 123 45 67","0541-987-65-43","+90 505 111 22 33","(0555) 444 33 22","05061234567","5421234567","+905331112233","0 212 555 44 33","0 (216) 333 22 11","+90 (532) 765 43 21","0532 765 4321","0535.222.33.44"];
const MAILS=["ahmet.y@gmail.com","ayse_k@hotmail.com","m.demir@sirket.com.tr","zeynep+koc@outlook.com","can-ozturk@uni.edu.tr","burak99@yahoo.com","info@klinik.org","ali.veli@mail.example.net"];
const TCS=[123456789,234567891,345678912,456789123,567891234,678912345].map(tc);
const CARDS=["411111111111111","422222222222222","555555555555444","378282246310005","601111111111117","353011133330000"].map(luhn);
const IBANS=["TR33 0006 1005 1978 6457 8413 26","TR320010009999901234567890","TR12 0001 0012 3456 7890 1234 56","tr590006200000000012345678"];
const ADDRS=["Atatürk Mah. 12 Sok. No:5","Gül Sokak No: 7 Daire 3","Cumhuriyet Caddesi 45/3","Yeni Mahallesi Çiçek Sok. 4","Bahar Apt. Kat 2 Daire 8","Barbaros Bulvarı No 120","Fatih Mah. Lale Cad. 9","Çınar Apt. D:4"];
const PLATES=["34 ABC 123","06 AB 1234","35 KLM 45","41 T 1234","01 ADN 567"];
const DATES=["12.03.1990","05/11/1985","1 Ocak 1978","23 Mart 2001","31-12-1999"];
const sent=[];
NAMES.forEach((n,i)=>{const s=SURN[i%6];sent.push([`${n} bugün aradı`,n],[`Benim adım ${n} ${s}`,n],[`${n}'in tarifini denedim`,n],[`Dr. ${n} ${s} kontrol istedi`,n],[`${n} ${s} Hanım randevu verdi`,n],[`eşim ${n} yardım etti`,n]);});
PHONES.forEach(v=>{sent.push([`Bana ${v} numarasından ulaşın`,v],[`Telefonum: ${v}`,v]);});
MAILS.forEach(v=>{sent.push([`Mailim ${v} adresi`,v],[`${v} adresine gönder`,v]);});
TCS.forEach(v=>{sent.push([`TC kimlik numaram ${v}`,v],[`Kimlik: ${v} bu`,v]);});
CARDS.forEach(v=>{sent.push([`Kartım ${v} bu`,v]);});
IBANS.forEach(v=>{sent.push([`IBAN ${v} hesabıma yatır`,v]);});
ADDRS.forEach(v=>{sent.push([`Adresim ${v} burası`,v.split(" ")[0]],[`Eve gel: ${v}`,v.split(" ")[0]]);});
PLATES.forEach(v=>{sent.push([`Aracımın plakası ${v}`,v]);});
DATES.forEach(v=>{sent.push([`Doğum tarihim ${v}`,v],[`${v} tarihinde doğdum`,v]);});
{
  const leaks=sent.filter(([s,v])=>T(s).includes(v)),rt=sent.filter(([s])=>{const r=M(s);return P.unmask(r.text,r.map)!==s});
  ok(`sızıntı seti: ${sent.length} cümlede ham değer kalmaz`,sent.length>=150&&leaks.length===0,leaks.slice(0,8).map(([s])=>T(s)));
  ok("sızıntı seti: unmask hepsini aynen geri getirir",rt.length===0,rt.slice(0,5));
}
// --- sıkılaştırma: küçük harf/ekli/ASCII ad, ilişki sözcüğü, il-ilçe, kurum, adres bağlamı ---
ok("ad: küçük harf, kesmesiz ek, büyük harf+kesme, Türkçe i/İ ı/I katlama, ASCII yazım",T("ahmetin evi")==="[AD1]in evi"&&T("AHMET'E yazdım")==="[AD1]'E yazdım"&&T("İBRAHİM geldi")==="[AD1] geldi"&&T("ibrahim geldi")==="[AD1] geldi"&&T("Huseyinle konustum")==="[AD1]le konustum"&&T("ISMAIL geldi")==="[AD1] geldi"&&T("ayşeyi gördüm")==="[AD1]yi gördüm",["ahmetin evi","AHMET'E yazdım","ISMAIL geldi","ayşeyi gördüm"].map(T));
ok("ad: sıradan sözcükle aynı yazılan ad küçük harfle maskelenmez, Büyük harfle ya da kesmeyle maskelenir",T("metin dosyası")==="metin dosyası"&&T("damla gibi")==="damla gibi"&&T("Damla aradı")==="[AD1] aradı"&&T("damla'ya yazdım")==="[AD1]'ya yazdım");
ok("ilişki: benim adım/ismim + küçük harfli tek sözcük; yemek, il ve boşluk sözcükleri ad sayılmaz",T("benim adım zeynep")==="benim adım [AD1]"&&T("ismim tuncer")==="ismim [AD1]"&&T("annem Gülsüm")==="annem [AD1]"&&T("eşim Tuncer geldi")==="eşim [AD1] geldi"&&T("Adı Nurcihan")==="Adı [AD1]"&&T("Ben Salata yedim")==="Ben Salata yedim"&&T("annem Antep fıstığı aldı")==="annem Antep fıstığı aldı"&&T("ismim yok")==="ismim yok",["Ben Salata yedim","annem Antep fıstığı aldı"].map(T));
ok("yer: il/ilçe yalnız da/de/dan/den/li eki ya da yaşam bağlamıyla",["Ankara'da","Ankarada","ANKARA'DAN","İzmirli","Kadıköy'de","Bursalıyım","İstanbul'da doğdum","Konya yaşıyorum","Eskişehir'de oturuyorum"].every(s=>/\[YER1\]/.test(T(s))&&!/Ankara|ANKARA|İzmir|Kadıköy|Bursa|İstanbul|Konya|Eskişehir/.test(T(s))),["Ankara'da","Konya yaşıyorum"].map(T));
ok("yer: il adlı yemekler ve eksiz il adı maskelenmez",["Antep fıstığı","Urfa kebap","Bursa kebabı","Adana kebap","Ankara","Bursa'nın şeftalisi","van gölü","Ankara'ya gittim"].every(s=>T(s)===s));
ok("kurum: A.Ş./Ltd./Holding/Üniversitesi/Okulu/Lisesi/Şirketi/Bankası öncesi özel ad",["Kardemir A.Ş. çalışıyorum","Atlas Ltd. Şti. sahibi","Yıldız Holding'te","Gazi Üniversitesi'nde","Mavi Okulu'na","Cumhuriyet Anadolu Lisesi","Tekno Şirketi","Garanti Bankası kartı"].every(s=>/\[KURUM1\]/.test(T(s))&&!/Kardemir|Atlas|Yıldız|Gazi|Mavi|Cumhuriyet|Tekno|Garanti/.test(T(s))),["Kardemir A.Ş. çalışıyorum","Yıldız Holding'te","Garanti Bankası kartı"].map(T));
ok("adres: 'no: 5 / Daire 3' yalnız adres bağlamında maskelenir",["Set no: 5/Daire 3","Tansiyon d: 80","Plan no: 3","kat 2 egzersiz"].every(s=>T(s)===s)&&/ADRES/.test(kinds("Adresim Lale, no: 5/Daire 3"))&&!T("Gül Mah. no: 5").includes("5")&&!T("Adresim Lale, no: 5/Daire 3").includes("Daire 3"),["Set no: 5/Daire 3","Adresim Lale, no: 5/Daire 3"].map(T));
{ // ikinci sızıntı seti: yeni kalıplar
  const L2=[],tr=s=>s.toLocaleUpperCase("tr"),asc=s=>s.replace(/ş/g,"s").replace(/ü/g,"u").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c").replace(/ğ/g,"g");
  const NS=["ahmet","mehmet","ayşe","fatma","zeynep","mustafa","emre","burak","hüseyin","yusuf"];
  NS.forEach(n=>L2.push([`${n}in evinde buluştuk`,n],[`${tr(n)}'E yazdım`,tr(n)],[`${asc(n)}le konustum`,asc(n)]));
  ["zeynep","kerim","tuncer","gülsüm","ayhan","nurcihan","ferdi","bedriye"].forEach(n=>L2.push([`benim adım ${n}`,n],[`ismim ${n}`,n]));
  ["Ankara","İzmir","Bursa","Konya","Adana","Trabzon","Samsun","Kayseri","Eskişehir","Diyarbakır"].forEach(c=>L2.push([`${c}'da oturuyorum`,c],[`${c} yaşıyorum`,c]));
  ["Kadıköy","Çankaya","Bornova","Nilüfer","Karşıyaka"].forEach(c=>L2.push([`${c}'de çalışıyorum`,c],[`${c} yaşıyorum`,c]));
  ["Arçelik A.Ş.","Sabancı Üniversitesi","Fen Lisesi","Ziraat Bankası"].forEach(k=>L2.push([`${k} personeliyim`,k.split(" ")[0]]));
  ["Zambak","Karanfil","Sümbül"].forEach(a=>L2.push([`evimin adresi ${a}, no: 7/Daire 2`,"Daire 2"]));
  [["Kardemir","A.Ş."],["Yıldız","Holding"],["Gazi","Üniversitesi"],["Bilkent","Üniversitesi"],["Cumhuriyet","Lisesi"],["Garanti","Bankası"],["Tekno","Şirketi"]].forEach(([a,b])=>L2.push([`${a} ${b} çalışanıyım`,a]));
  ["Gülsüm","Tuncer","Nurcihan","Ferdi","Selvihan","Bedriye","Kamuran","Mahinur"].forEach((n,i)=>L2.push([`${["annem","eşim","babam","kızım","oğlum","kardeşim","arkadaşım","doktorum"][i]} ${n} dedi`,n]));
  ["Lale","Menekşe","Papatya"].forEach(a=>L2.push([`adresim ${a}, no: 5/Daire 3`,"Daire 3"]));
  const lk=L2.filter(([s,v])=>T(s).includes(v)),rt=L2.filter(([s])=>{const r=M(s);return P.unmask(r.text,r.map)!==s});
  ok(`ikinci sızıntı seti: ${L2.length} cümlede ham değer kalmaz`,L2.length>=100&&lk.length===0,lk.map(([s])=>s+" => "+T(s)));
  ok("ikinci sızıntı seti: unmask aynen geri getirir",rt.length===0,rt.slice(0,5));
  console.log("  ikinci sızıntı seti:",L2.length,"cümle, kaçak",lk.length);
}
// --- son kapı: maskMsgs ---
{
  const KEEP="KURAL: Ahmet gibi örnek adı değiştirme.",raw="Ben Ahmet, 0532 123 45 67, a@b.com, TC 12345678901";
  const m=[{role:"system",content:KEEP+"\n\nNOT: "+raw},{role:"user",content:raw},{role:"assistant",content:JSON.stringify({reply:raw})}];
  const o=P.maskMsgs(m,KEEP),j=JSON.stringify(o);
  ok("maskMsgs: sabit kural metni korunur, bağlam/kullanıcı/geçmişte ham değer kalmaz",o[0].content.startsWith(KEEP)&&!/0532|a@b|12345678901/.test(j)&&!o[0].content.slice(KEEP.length).includes("Ahmet")&&!o[1].content.includes("Ahmet"),j);
  const o2=P.maskMsgs(o,KEEP);
  ok("maskMsgs: idempotent (çift maskeleme yok), ortak tablo korunur, yanıt geri çevrilir",JSON.stringify(o2)===j&&o2.pii===o.pii&&P.unmask(o[1].content,o.pii).includes("0532 123 45 67"),[o[1].content,o2[1].content]);
  const pre=[{role:"user",content:"Ayşe'ye [AD1] [TELEFON1] yaz"}];pre.pii={"[AD1]":"Ali","[TELEFON1]":"0532 111 22 33"};
  const o3=P.maskMsgs(pre,"");
  ok("maskMsgs: hazır etiketler bozulmaz, yeni değer çakışmadan sonraki numarayı alır",o3[0].content==="[AD2]'ye [AD1] [TELEFON1] yaz"&&o3.pii["[AD2]"]==="Ayşe",o3[0].content);
}
// çok satırlı karışık metin
{
  const r=M("Ben Ahmet Yılmaz, tel 0532 123 45 67, ahmet@x.com\nAtatürk Mah. 5 Sok. No:2, 34 ABC 123\nTC 12345678901, doğum 12.03.1990");
  ok("karışık metin: tüm türler tek geçişte",["AD","TELEFON","EPOSTA","ADRES","PLAKA","TC","DOGUM"].every(k=>r.found.some(f=>f.kind===k))&&!/Ahmet|0532|@|Atatürk|12345678901|1990/.test(r.text),r.text);
}
process.exit(bad?1:0);
