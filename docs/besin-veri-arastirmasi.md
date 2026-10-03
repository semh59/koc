# Kalori verisi: nereden gelir, ne kadar doğrudur, NeoWell ne yapmalı (3 Ekim 2026)

`docs/besin-arastirmasi.md` dosyasının devamıdır. O dosyadaki USDA karşılaştırması ve kaynak tablosu burada tekrarlanmadı.

**Kaynak etiketleri:**
- **[O]** Birincil kaynak doğrudan okundu.
- **[Ö]** Yalnızca arama motoru özeti görüldü, sayfa açılmadı.
- **[İK]** İkincil kaynak: rakip uygulama veya SEO blogu, bağımsız olarak doğrulanmadı.
- **[Ş]** Şirketin kendi iddiası.

**Erişilemeyen kaynaklar:**
- turkomp.tarimorman.gov.tr: otomatik erişimde yönlendirme döngüsüne giriyor.
- world.openfoodfacts.org/country/turkey: 503 hatası verdi.
- mdpi.com: 403 hatası verdi. Aynı makaleler PMC'den okundu.
- pubmed.ncbi.nlm.nih.gov: çerez veya reCAPTCHA engeli var.

---

## A) Kalori nasıl bulunuyor?

### A1. Ölçüm değil, çoğunlukla hesap
- **Bomba kalorimetre**, yiyeceği yakarak brüt enerjiyi ölçer. Bu değer vücudun kullandığı enerjiden yüksektir, çünkü sindirilemeyen kısım ve idrarla atılan azot da yanar. Atwater bu kayıpları düşerek ortalama faktörler türetti. Brüt değerler proteinde 5,65, yağda 9,3, karbonhidratta 4,1 kcal/g'dır [Ö: USDA SR13 belgesi, FAO 2003 Food Energy raporu].
- **Genel Atwater faktörleri** şunlardır: protein 4, karbonhidrat 4, yağ 9 kcal/g. AB 1169/2011 Ek XIV ve Türk Gıda Kodeksi Etiketleme Yönetmeliği Ek-10 bunlara ek faktörler de tanımlar [Ö: EUR-Lex/lexparency özeti]:

  | Bileşen | kcal/g |
  |---|---|
  | Alkol | 7 |
  | Lif | 2 |
  | Poliol | 2,4 |
  | Organik asit | 3 |
  | Eritritol | 0 |

  Etiketteki kalori de neredeyse her zaman bu formülle hesaplanır, laboratuvarda yakılarak ölçülmez.
- **USDA'nın özel Atwater faktörleri** besin grubuna göre değişir (Merrill ve Watt, Agriculture Handbook 74, 1955/1973) [Ö]. Bu yüzden USDA'nın kcal değeri, aynı besin için 4/4/9 formülüyle bulunan değere tam eşit çıkmaz.
- **Formül her besinde aynı başarıyı göstermez.** Bademde insanlarla yapılan ölçümde 28 g'lık porsiyon 129 kcal çıktı, Atwater'a göre 168-170 kcal olmalıydı. Fark %32'dir, çünkü hücre duvarı yağın bir kısmının emilmesini engelliyor (Novotny, Gebauer, Baer, AJCN 2012) [Ö: PubMed ve USDA ARS özeti].
- **Pişirme ve işleme alınan enerjiyi değiştirir.** Farelerde pişmiş et ve tatlı patates, çiğ hallerinden daha fazla net enerji sağladı (Carmody ve ark., PNAS 2011) [Ö]. Tablolar bu farkı çoğunlukla göstermez.

### A2. Yasal tolerans: etiket bile "yaklaşık"
- **AB, 2012 tarihli tolerans kılavuzu [O]:** Enerji için ayrı bir tolerans yok, enerji makro besin toleranslarından türetiliyor. Makro besin toleransları şöyle:

  | Besin (100 g'da) | <10 g | 10-40 g | >40 g |
  |---|---|---|---|
  | Karbonhidrat, şeker, protein, lif | ±2 g | ±%20 | ±8 g |
  | Yağ | ±1,5 g | ±%20 | ±8 g |

  - Doymuş yağ: 4 g'ın altında ±0,8 g, 4 g ve üstünde ±%20.
  - Tuz: 1,25 g'ın altında ±0,375 g, 1,25 g ve üstünde ±%20.
  - Düşük değerlerde mutlak gram toleransı uygulandığı için düşük kalorili ürünlerde göreli hata %20'yi aşabilir.
- **Türkiye [O]:** Tarım ve Orman Bakanlığı'nın TGK Etiketleme Kılavuzu (26/11/2024) Tablo 1'in okunabilen satırları AB ile aynı: karbonhidrat, şeker, protein ve lif ile yağ satırları. Kalan satırlar metin çıkarımında kesildi.
- **ABD, 21 CFR 101.9(g) [Ö]:**
  - Kalori, şeker ve yağ, etiketteki değeri **%20'den fazla aşarsa** ürün "yanlış etiketlenmiş" sayılır. Kural tek yönlüdür: daha az kalori için alt sınır yoktur.
  - Protein ve lif gibi "Sınıf II" besinler etiketteki değerin en az %80'i kadar olmalıdır.
  - Kalori 50'nin üstünde en yakın 5'e, altında en yakın 1'e yuvarlanır. 5 kcal altı "0" yazılabilir.
- **Gerçekte ölçülen sapma:** Restoran yemeklerinde ölçülen enerji beyan edilenden ortalama %18 fazla çıktı, bazı tabaklarda %200'e ulaştı. Market donuk yemeklerinde fark %8 fazlaydı (Urban ve ark., J Am Diet Assoc 2010) [Ö].

### A3. Tarif hesabı ve pişme kaybı
- Ev yemeğinde kalori şöyle hesaplanır: çiğ malzemelerin toplamı alınır, pişince değişen ağırlık (verim veya yield) hesaba katılır, sonra 100 g'a bölünür. Vitamin ve mineral kaybı için **USDA Nutrient Retention Factors Release 6 (2007)** kullanılır. Bu tablo yaklaşık 290 besin için 16 vitamin, 8 mineral ve alkol kaybını verir, CSV olarak indirilebilir, kamu malıdır [Ö]. EuroFIR'in tarif hesaplama kılavuzu da aynı yöntemi anlatır [Ö].
- **Tarif hesabında en büyük belirsizlik su ve yağdır.** Örneğin "1 porsiyon kuru fasulye" ne kadar sulu ve ne kadar yağlı? Aynı ad için ±%20-40 sapmanın kaynağı budur (bkz. `besin-arastirmasi.md`).

### A4. Veri tabanı ve porsiyon hataları
- **Kitle kaynaklı kayıtlar:** MyFitnessPal, Belçika'nın NUBEL veri tabanıyla karşılaştırıldığında toplam enerjide yalnızca %1,3 fazla tahmin verdi. Protein %7,8, karbonhidrat %6,4 eksik çıktı. Kolesterol ve sodyumda güvenilmez bulundu (Evenepoel ve ark., JMIR 2020) [Ö]. Yorumumuz: tek tek kayıtlardaki hatalar günlük toplamda birbirini kısmen dengeliyor olabilir.
- **Open Food Facts denetimi:** Kayıtların %5,5'i tutarlılık testinden geçemedi. Etiketlerin bir kısmında %50'yi aşan fark vardı. En sık nedenler kJ'nin kcal yerine girilmesi ve porsiyon değerinin 100 g yerine yazılmasıydı [İK: dev.to bloğu, hakemli değil].
- **Porsiyon, tablodan daha büyük hata kaynağıdır.** Diyete dirençli kişiler aldıkları yemeği ortalama %47 eksik bildirdi (Lichtman ve ark., NEJM 1992) [Ö]. Yani kullanıcının "1 kase" demesi, kalori tablosundaki herhangi bir hatadan daha büyük belirsizlik yaratır.

---

## B) Açık ve lisanslı veri setleri

Uygunluk puanı 1-5 arasıdır (5 = NeoWell'e APK içinde gömülebilir, ticari kullanım serbest, emeği düşük).

| Kaynak | Kapsam ve biçim | Lisans ve şart | Uygunluk | Risk ve emek |
|---|---|---|---|---|
| **USDA FDC SR Legacy** | Yaklaşık 7.800 genel besin (sık anılan sayı 7.793 [Ö]). CSV 6,7 MB zip. Son sürüm Nisan 2018, artık güncellenmiyor [O] | CC0, atıf istenir ama zorunlu değil [Ö] | **5** | Türk yemeği yok. Karbonhidrat "farkla" hesaplanmış, lifi içeriyor (D3'te düzeltme gerekiyor). Emek düşük |
| **USDA Foundation Foods** | Analizle ölçülmüş az sayıda temel besin, sürekli güncelleniyor (Nisan 2026). CSV 3,4 MB zip [O] | CC0 | **4** | Kapsamı dar, SR Legacy'yi tamamlar |
| **USDA FNDDS 2021-23** | ABD'de tüketilen yemekler ve **porsiyon ağırlıkları** (Ekim 2024). JSON 3,7 MB zip [O] | CC0 | **3** | Amerikan yemekleri. Porsiyon gramajları ("1 cup" = x g) için faydalı |
| **USDA Branded** | ABD markalı ürünleri, 3 GB [O] | CC0 [Ö] | **1** | Türkiye ürünü yok |
| **Open Food Facts** | Dünyada 4 milyondan fazla ürün. Parquet yaklaşık 8 GB, JSONL açılınca 43 GB [Ö: Hugging Face]. Türkiye: 11.464 ürün (1 Ekim 2026 ölçümü, bugün sayfa 503 verdi) | Veri tabanı **ODbL**, tek kayıtlar DbCL, görseller CC-BY-SA. Uygulama arayüzünde tıklanabilir atıf zorunlu. Türetilmiş veri tabanı herkese açık kullanılırsa ODbL ile paylaşılmalı [Ö: OFF veri sayfası ve kullanım şartları] | **3** (çevrimiçi barkod için 5) | Veri kalitesi değişken (A4). APK'ya gömülen alt küme "türetilmiş veri tabanı" sayılır. Emek orta |
| **TürKomp** (TAGEM ve TÜBİTAK MAM; veri girişini Gıda ve Yem Kontrol Merkez Araştırma Enstitüsü, Bursa koordine ediyor) | 500'den fazla gıda, 100 bileşen, yaklaşık 63.000 veri [Ö: TÜBİTAK MAM]. Türk analiz verisi | "İzinsiz kopyalama ve dağıtım yasak". Bilgisayar programında ticari kullanım için **sözleşme ve yıllık ücret** gerekiyor [Ö: arama özeti; sayfa otomatik erişimde açılmadı] | **2** (izin alınırsa 5) | **Mevcut risk:** `www/foods.js` başlığında "TürKomp ve USDA'dan derlenmiş" yazıyor. Hangi değerlerin TürKomp'tan geldiği belirlenmeli: ya izin alınmalı ya o değerler USDA ya da tarif hesabıyla değiştirilmeli. Ücretsiz olmasa da uygulama ücretsiz ve reklamsız olduğundan izin istenebilir |
| **CIQUAL** (Fransa, ANSES) | 2025 sürümünde 3.484 besin, 2020 sürümünde 3.185 besin ve 67 bileşen. Excel ve XML [Ö] | **Etalab Açık Lisans 2.0** (CC-BY uyumlu), atıf yeterli [Ö] | **4** | Akdeniz besinleri ve bazı yemekler var. Emek orta (Fransızca adlar) |
| **UK CoFID 2021** | Yaklaşık 3.000-3.300 besin ve tarif [Ö] | **Open Government Licence v3**, atıf zorunlu [Ö] | **4** | İngiliz yemekleri. Pişmiş yemek kayıtları var |
| **Kanada CNF 2015** | 5.690 besin, 152'ye kadar bileşen. CSV [Ö] | **Open Government Licence – Canada**, atıf zorunlu [Ö] | **3** | Büyük kısmı USDA kökenli, katkısı az |
| **Avustralya AFCD Release 3** | 1.588 besin, 58 besin öğesi. Excel [Ö] | CC BY-SA 3.0 AU tabanlı lisans: **paylaş-aynı-şekilde** [Ö] | **2** | Paylaş-aynı-şekilde şartı ODbL gibi ayrı dosya ister |
| **Japonya STFCJ 2020 (8. baskı)** | 2.478 besin [Ö] | Açık erişimli yayın. Yeniden dağıtım şartı net değil [Ö] | **1** | Mutfağı uzak, dili zor |
| **BEDCA** (İspanya) | Yaklaşık 969 besin [Ö] | Ticari olmayan kullanım şartı bildiriliyor [Ö, çelişkili] | **1** | Lisans belirsiz |
| **FAO/INFOODS** | Bölgesel tablolar (Batı Afrika, balık için uFiSh vb.) [Ö] | Tabloya göre değişiyor | **1** | Türkiye tablosu yok, yalnızca TürKomp'a bağlantı veriyor |
| **BeBiS** (Türk ticari yazılımı) | 20.000'den fazla besin. Alman BLS 11.3 ve USDA 15 tabanlı, Türk yemekleri eklenmiş [Ö] | Ticari lisans | **1** | Veri satın alınmadan kullanılamaz |
| **Merdol, *Standart Yemek Tarifeleri*** (Hatiboğlu, 8. baskı 2020) | Hacettepe yemekhanesinde standartlaştırılmış Türk yemeği tarifleri ve gramajları [Ö] | Telifli kitap | **3** (yöntem kaynağı olarak) | Değerler kopyalanmamalı. Ancak "kuru fasulye 1 porsiyonda ne kadar yağ olur" gibi tarif oranları için referans alınabilir, gerçek ve oran bilgisi telif kapsamında değil (bu bir yorumdur, hukuki görüş değil) |

**Kitle kaynaklı ve ticari API'ler.** Hepsi çevrimdışı, hesapsız bir APK için uygun değil:

| API | Şart |
|---|---|
| MyFitnessPal | API kapalı, yeni geliştirici kabul etmiyor [Ö] |
| FatSecret | Kullanıcı verisini 24 saatten uzun önbellekte tutmak yasak, yalnızca ID'ler kalıcı saklanabilir. Ücretsiz "Premier Free" katmanı yalnızca ABD verisini kapsıyor ve atıf istiyor [Ö] |
| Nutritionix | Ücretsiz katman kaldırıldı. Ücretli planlar 499 $/ay ve üzeri [Ö/İK] |
| Edamam | Önbelleğe yalnızca 4 makro, ad ve ID alınabilir, yalnızca şifreli kullanıcı hesabında tutulabilir. Planlar 14-299 $/ay [Ö] |
| Spoonacular | Önbellek yalnızca yazılı izinle ve en fazla 1 saat. Rakip ürün yapmak yasak [Ö] |

---

## C) Yapay zekâ neyle eğitildi?

### C1. Fotoğraftan yemek tanıma veri setleri
| Veri seti | Ne içeriyor | Kalori etiketi var mı | Lisans |
|---|---|---|---|
| Food-101 (ETH Zürih, 2014) | 101 sınıf, 101.000 fotoğraf | Yok, yalnızca yemek adı | Fotoğraflar Foodspotting'den alınmış. Bilimsel kullanım dışı için fotoğraf sahiplerinden izin gerekiyor [Ö] |
| UEC-Food100/256 (Japonya) | 256 sınıf, yaklaşık 25.000 fotoğraf | Yok | Lisans doğrulanmadı |
| VireoFood-172 | 172 Çin yemeği, 110.241 fotoğraf | Yok, malzeme etiketleri var | Lisans doğrulanmadı |
| ISIA Food-500 | 500 sınıf, yaklaşık 400.000 fotoğraf | Yok | Lisans doğrulanmadı |
| MAFood-121 | 11 mutfaktan 121 yemek, 21.175 fotoğraf | Yok | Lisans doğrulanmadı |
| FoodSeg103 | 7.118 fotoğraf, 103 malzeme sınıfı, piksel düzeyinde bölütleme | Yok | Recipe1M'den türetilmiş [Ö] |
| Recipe1M+ (MIT) | 1 milyondan fazla tarif, 13 milyon fotoğraf. Yalnızca 50.637 tarifte besin değeri var | Kısmen, hesaplanmış | CC BY-NC-SA, ticari kullanım yok [Ö] |
| **Nutrition5k** (Google, CVPR 2021) | Yaklaşık 5.000 tabak, video ve derinlik görüntüsü, **her malzeme tartılmış** | Var. Ancak besin değerleri **laboratuvarda ölçülmedi**: tartılan malzemelerden USDA verisiyle hesaplandı. Tabaklar Google'ın ABD'deki kafeteryalarından [Ö] | CC BY 4.0 [Ö] |
| TurkishFoods-15 | 15 Türk yemeği, 7.411 fotoğraf (Google Görseller'den toplanmış) | Yok | Hugging Face'te. Fotoğraf telifi belirsiz [Ö] |

- **Ders 1:** Fotoğraf veri setlerinin neredeyse hiçbirinde ölçülmüş kalori yok. Model yemeğin adını tahmin ediyor, kaloriyi o adın tablodaki değerinden alıyor.
- **Ders 2:** Porsiyon tahmini için derinlik verisi gerekiyor. Nutrition5k'da derinlik eklenince kalori hatası azaldı. Makalede kalori hatası yaklaşık %16-26 arasında veriliyor, ancak arama özetlerindeki sayılar koşula göre karışık geldi ve tek bir değer doğrulanamadı [Ö].
- **Ders 3:** Türk mutfağında kalori etiketli bir fotoğraf veri seti bulunamadı.

### C2. Ticari uygulamalar: iddia ve bağımsız ölçüm
- **SnapCalorie:**
  - Kurucularından Wade Norris, Nutrition5k makalesinin yazarları arasında [O: arXiv yazar listesi].
  - Şirketin iddiası: 500 kcal'lik tabakta iPhone Pro'da ±80, normal iPhone'da ±130 kcal hata [Ş].
  - Bağımsız bir "6 uygulama karşılaştırması" ±%19,8 MAPE bildiriyor [İK, doğrulanmadı].
- **Cal AI:**
  - Fotoğraf ve derinlik sensörüyle çalışıyor. İlk sürüm arka uçta OpenAI GPT modellerine dayanıyordu [Ö: CNBC ve İK].
  - Kurucunun iddiası "%90 doğruluk" [Ş]. Hakemli bir doğrulama yok.
  - Aralık 2025'te MyFitnessPal tarafından satın alındı [Ö: Inc.].
- **MyFitnessPal Meal Scan:** Passio AI ile yapıldı. Tanınan yemeği MFP'nin 14 milyon kayıtlık veri tabanında eşliyor [Ö].
- **Foodvisor:**
  - Şirketin iddiası: 10 milyon fotoğrafla eğitildi, %95 isabet [Ş].
  - Bağımsız çalışmada tanıma isabeti ilk tahminde %46, ilk 5 tahminde %72 çıktı. Aynı çalışmada en iyi platform Calorie Mama oldu (ilk tahminde %63). İncelenen platformların **hiçbiri porsiyon miktarını tahmin edemiyordu** (JMIR Formative Research 2020, 185 fotoğraf) [Ö].
- **Lose It Snap It:**
  - Şirketin 2016 iddiası: ilk tahminde %87,3, ilk 5 tahminde %97,1 [Ş].
  - 2026 tarihli bir blog testi tanımayı %68,7 buldu [İK].

**Özet:** Hiçbir uygulamanın kalori doğruluğu bağımsız ve hakemli bir çalışmayla gösterilmedi. Tanıma oranları iyi olsa da porsiyon tahmini zayıf.

### C3. ChatGPT, Claude ve Gemini kalori bilgisini nereden biliyor?
- **Sağlayıcıların hiçbiri** eğitim verisinde hangi besin tablolarını kullandığını açıklamıyor. Model, web metinlerinden (USDA kopyaları, etiketler, tarif siteleri, MFP benzeri sayfalar) öğrendiği tipik değerleri hatırlıyor. Bu bir çıkarımdır: model ölçüm yapmıyor ve belirli bir tabloya bakmıyor.
- **Yalnızca metinle yapılan tahminler** (NeoWell Koç'u bu şekilde çalışıyor):
  - **Hoang ve ark., *JAMA Network Open* 2023:** 222 besinin enerji değeri soruldu. İki sohbet botunun cevaplarının yaklaşık %35-48'i ±%10 içinde doğruydu. 8 menüde enerji tahmini diyetisyenden anlamlı farklı çıkmadı, protein tahmini çıktı [Ö].
  - **Haman, Školník ve Lošťák, *Nutrition* 119, 2024:** ChatGPT'nin enerji değerlerinin %97'si USDA'dan en fazla %40 farklıydı [Ö]. İlk aramada bu çalışmaya atfedilen "%66,4'ü %10, %80,2'si %20 içinde" rakamları da görüldü, ancak hangi çalışmaya ait oldukları doğrulanamadı.
  - **Rodríguez-Jiménez ve ark., 2025, ChatGPT-5, 195 tabak [O, PMC]:**

    | Model ne aldı | Enerji MAPE |
    |---|---|
    | Yalnızca fotoğraf | %30,5 |
    | Fotoğraf ve açıklama | %24,4 |
    | Fotoğraf ve malzeme listesi | %13,9 |
    | **Yalnızca malzeme listesi, fotoğraf yok** | %18,1 |

  - **NutriBench (2024):** 11.857 öğün tarifinde karbonhidrat tahmini yapıldı. En iyi sonucu adım adım düşünme talimatıyla GPT-4o verdi: cevapların %66,8'inde hata 7,5 g karbonhidratı geçmedi. 72 soruluk alt kümede bazı modeller diyetisyenlerden daha isabetliydi [Ö].
- **Fotoğrafla yapılan tahminler:** O'Hara ve ark. (Nutrients 2025) 114 fotoğrafla çalıştı. ChatGPT ağırlığı fotoğrafların %76'sında **eksik** tahmin etti, ortalama mutlak fark %27,8 oldu. Orta ve büyük porsiyonlarda eksik tahmin anlamlıydı [O, PMC]. Yazarlara göre model rehberlerdeki küçük porsiyonlara yöneliyor.
- **Tipik yanılma örnekleri:**
  - Görünmeyen yağın atlanması (kızartma, tereyağlı pilav).
  - Büyük porsiyonların küçük tahmin edilmesi.
  - Proteinde büyük sapma.
  - Aynı soruya farklı cevaplar verilmesi.

### C4. NeoWell Koç'unun yemek kalorisi tahmini: dürüst yorum
- Koç ada göre tahmin yapıyor, fotoğrafla tanıma iptal edilmişti. Literatüre göre "yemek adı ve porsiyon" sorusunda tipik hata **±%20-40** arası. Türk ev yemeklerinde bu aralığın üst ucu beklenmeli, çünkü tarif değişkenliği yüksek ve İngilizce web verisi az. Bu bir çıkarımdır, Türk yemekleriyle ölçülmedi.
- **Doğruluğu artıranlar:**
  - Kullanıcıdan malzeme ve gram istemek (MAPE yaklaşık %30'dan yaklaşık %14-18'e iniyor).
  - Modelden malzemeleri tek tek yazıp toplamasını istemek.
  - Sonucu tek sayı yerine aralık olarak göstermek.
- **Koç'un rolü:** Tablo değerinin yerine geçmemeli. Tabloda olmayan yemekler için "tahmini" etiketli bir yedek olmalı. Bu mevcut tasarımla uyumlu.

---

## D) NeoWell için somut öneri

### D1. Mevcut durum (kod okunarak)
- **`www/foods.js`:** 106 satır, 9,4 KB, satır başına yaklaşık 89 bayt. Satır yapısı: `[ad, kcal, p, c, f, [[porsiyon, gram]…], usdaBayrağı]`.
- **Eksik alanlar:** **lif, şeker ve sodyum alanı yok.** `lo`/`hi` saklanmıyor, yemek sınıfına (s/y) göre sabit bir yayılımla hesaplanıyor.
- **`foodSearch`:** Yalnızca İ/I harflerini katlıyor. "sut" yazınca "süt" bulunmuyor, "yogurt" yazınca "yoğurt" bulunmuyor. Eş anlamlı ad alanı yok (ör. "köfte"/"ızgara köfte", "cacık"/"tzatziki", "tavuk göğsü"/"tavuk fileto").

### D2. En hızlı ve lisans açısından güvenli yol: yaklaşık 500 kayıt
1. **TürKomp riskini kapat (önce).** `foods.js` içinde TürKomp'tan alınmış olabilecek değerleri işaretle. Bunları USDA veya tarif hesabıyla yeniden üret, ya da Gıda ve Yem Kontrol Merkez Araştırma Enstitüsü'ne yazıp izin ve ücret bilgisi iste. Emek: 0,5 gün ve yazışma süresi.
2. **Genel besinler, yaklaşık 250 kayıt.** Kaynak USDA SR Legacy ve Foundation (CC0). Türkiye'de sık tüketilen çiğ ve basit pişmiş besinler seçilir: sebze, meyve, et, balık, tahıl, baklagil, süt ürünleri. Türkçe adı elle verilir. Emek: 1-1,5 gün (seçim listesi ve betik).
3. **Türk ev yemekleri, yaklaşık 150-200 kayıt, tarif tabanlı hesap.**
   - Her yemek için malzeme gramajı, pişme verimi ve porsiyon gramı yazılır.
   - Malzemelerin besin değeri USDA'dan alınır, betik 100 g değerini ve porsiyonu hesaplar.
   - `lo`/`hi`, sabit yayılım yerine "az yağlı" ve "bol yağlı" iki tarif varyantından hesaplanır.
   - Tarif oranları için Merdol'ün *Standart Yemek Tarifeleri* ve TÜBER/Hacettepe rehberleri **yöntem referansı** olarak kullanılır, değerleri kopyalanmaz.
   - Emek: 3-5 gün. En büyük iş budur ve bu iş TürKomp izni olsa bile gerekir, çünkü TürKomp'ta hazır yemek az.
   - **Eksik malzemeler:** USDA'da Türkiye'ye özgü bazı malzemeler yok ya da karşılığı zayıf (beyaz peynir, Türk loru, tarhana, yufka, sucuk, pekmez). Paketli olanlar için üretici etiketi veya OFF, diğerleri için TürKomp izni gerekir. Bu yüzden TürKomp izni "isteğe bağlı" değil, değerli.
4. **Açık tamamlayıcılar (gerekirse).** USDA'da olmayan Akdeniz besinleri CIQUAL'dan (Etalab 2.0), pişmiş tarifler CoFID'den (OGL v3) alınabilir. İkisinde de yalnızca atıf yeter, paylaş-aynı-şekilde şartı yok. Emek: 1 gün.
5. **Open Food Facts Türkiye ürünleri: APK'ya gömme, ya da ayrı dosyada göm.**
   - Önerilen: barkod çevrimiçi kalsın (bugünkü gibi).
   - Çevrimdışı istenirse, en sık 300-500 Türk markalı ürün **ayrı bir `off-tr.json`** dosyasına konur. Bu dosya `foods.js` ile birleştirilmez, böylece CC0 ve kendi verimiz paylaş-aynı-şekilde şartının dışında kalır.
   - Dosya ODbL ile GitHub'da yayımlanır, arayüzde bağlantılı atıf gösterilir.
   - AFCD'ye de aynı kural uygulanır (gerekirse).
   - Emek: 1 gün.

### D3. Normalizasyon ve kalite kontrol
- **Karbonhidrat tanımı:** USDA "farkla karbonhidrat" verir, lif dahildir. AB, Türkiye etiketleri ve OFF lifsiz verir. USDA satırlarında `c = karbonhidrat − lif` yapılır.
  - **Mevcut veride bu karışıklık zaten var.** Örnekler: `foods.js` içinde haşlanmış mercimek (c 20), haşlanmış nohut (c 27) ve yulaf (c 66). Bunlar USDA'nın lif dahil değerleriyle uyumlu görünüyor, ama USDA değerleri hafızadan alındı, yeniden doğrulanmalı. Barkoddan gelen OFF değerleri ise lifsiz. Mevcut satırlara da aynı düzeltme uygulanmalı.
- **Birimler:**
  - kJ ise kcal'e çevrilir (÷4,184).
  - Tuz verilmişse sodyum = tuz ÷ 2,5.
  - Porsiyon başına verilmiş değerler 100 g'a çevrilir.
- **Atwater kontrolü:** `4p + 4c + 2·lif + 9f` hesaplanan değer, kcal'in **±%10-15** aralığında olmalı. Bu, USDA'nın özel faktörleri yüzünden tam eşitlik beklenmediği için seçilen bir pay. Dışında kalan kayıt elle incelenir.
- **Aralık kontrolleri:**
  - kcal 0-900 arasında olmalı.
  - p + c + f + lif toplamı 100 g'ı aşmamalı.
  - Sodyum 0-40 g/100 g arasında olmalı.
  - Porsiyon gramı 1-1000 arasında olmalı.
  - Kurallar betik testi olarak yazılır, CI'da koşar.
- **Çift kaynak çapraz kontrol:** Genel besinlerde USDA ile CIQUAL veya CoFID karşılaştırılır, %15'ten büyük fark elle incelenir (mevcut `tools/usda-karsilastir.py` genişletilir). Türk yemeklerinde tarif hesabı Koç tahmini ve bir yayımlanmış değerle karşılaştırılır.
- **Kaynak alanı:** Her kayıt `src` taşır: `usda:<fdcId>`, `ciqual:<kod>`, `cofid:<kod>`, `tarif`, `off:<barkod>`. Arayüzdeki "USDA/tahmini" etiketi bu alandan türetilir.

### D4. Önerilen kayıt şeması (mevcut yapıya eklenen alanlar)
`[ad, kcal, p, c, f, porsiyonlar, kaynak, lif, şeker, sodyum_mg, lo, hi, eşAdlar]`
- Sondaki alanlar isteğe bağlı olur, böylece eski satırlar bozulmaz.
- **Uyumluluk tuzağı:** 7. konumda bugün `s===1` (USDA bayrağı) okunuyor. Buraya kaynak metni gelince okuyucu kodu da güncellenmeli ve USDA bayrağını kaynak metninden türetmeli. Yoksa bütün "USDA" etiketleri sessizce kaybolur.
- `lo`/`hi` yalnızca tarif tabanlı kayıtlarda saklanır.
- `eşAdlar` arama dizinine eklenir.
- `foodLow` tam Türkçe katlama yapacak şekilde genişletilir: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u.

### D5. APK boyutu
- Yaklaşık 500 kayıt, yeni alanlarla birlikte satır başına 120-150 bayt, toplam **60-75 KB**. Sıkıştırılmış APK'da 20-25 KB civarı. Önemsiz.
- `off-tr.json` 500 ürünle 50-80 KB ekler.
- Tam OFF veya FDC dökümü gömülemez: GB düzeyinde.

### D6. Atıf ekranı metni (Ayarlar → Hakkında → Veri kaynakları)
> **Besin verileri:**
> - ABD Tarım Bakanlığı, FoodData Central (SR Legacy, Foundation Foods), CC0 1.0 kamu malı. fdc.nal.usda.gov
> - Open Food Facts verisi içerir, Open Database License (ODbL) ile sunulmuştur. world.openfoodfacts.org · opendatacommons.org/licenses/odbl. Ürün görselleri CC BY-SA.
> - *(kullanılırsa)* ANSES, Table de composition nutritionnelle des aliments Ciqual, Licence Ouverte / Etalab 2.0.
> - *(kullanılırsa)* "Contains public sector information licensed under the Open Government Licence v3.0." McCance and Widdowson's Composition of Foods Integrated Dataset (CoFID).
> - *(kullanılırsa)* "Contains information licensed under the Open Government Licence – Canada." Health Canada, Canadian Nutrient File 2015.
> - *(izin alınırsa)* TürKomp – Ulusal Gıda Kompozisyon Veri Tabanı, T.C. Tarım ve Orman Bakanlığı.
>
> Türk yemeklerinin değerleri tarif üzerinden hesaplanmış tahminlerdir. Tablo değerleri ortalamadır. Paket etiketlerindeki besin değerleri yasal olarak yaklaşık ±%20 sapabilir.

### D7. Plan ve emek (toplam yaklaşık 8-11 iş günü)
| Adım | İş | Emek |
|---|---|---|
| 1 | TürKomp kökenini ayıklama ve izin yazışması | 0,5 gün |
| 2 | Şema genişletme, tam Türkçe katlama, eş adlar | 1 gün |
| 3 | USDA içe aktarma betiği, karbonhidrat ve birim normalizasyonu, kontroller | 1,5 gün |
| 4 | 250 genel besin seçimi ve Türkçe adlandırma | 1 gün |
| 5 | Tarif hesaplayıcı betik ve 150-200 Türk yemeği tarifi | 3-5 gün |
| 6 | Çift kaynak kontrolü, aykırı değer incelemesi, testler | 1 gün |
| 7 | Atıf ekranı ve (isteğe bağlı) `off-tr.json` | 0,5-1 gün |

---

## E) Kullanıcıya 10 satırlık dürüst özet
1. Kaloriler ölçülmez, çoğunlukla protein×4, karbonhidrat×4, yağ×9 formülüyle hesaplanır.
2. Paket etiketindeki besin değerleri yasal olarak yaklaşık ±%20 sapabilir, düşük değerlerde daha fazla (Türkiye ve AB kuralları aynı).
3. Restoran yemekleri ölçümde beyan edilenden ortalama %18 fazla çıktı.
4. Tek malzemeli besinlerde (meyve, yumurta, süt, yağ) tablo değerleri çok yakındır.
5. Ev yemeklerinde aynı ad için tarif farkı yüzünden ±%20-40 değişim beklenir.
6. Kuruyemiş gibi bazı besinlerde vücudun aldığı enerji tablodakinden az olabilir (bademde %20-30).
7. En büyük hata porsiyondadır: insanlar yediklerini genellikle eksik tahmin eder.
8. Yapay zekâ tahmini ortalama %20-35 yanılabilir, büyük porsiyonları küçük tahmin etme eğilimindedir.
9. Malzemeyi ve gramı yazarsanız yapay zekâ tahmini belirgin şekilde iyileşir.
10. Önemli olan tek günün kesin sayısı değil, haftalık eğilimdir. Tutarlı kayıt, kesin sayıdan daha değerlidir.

---

## Kaynaklar
- AB tolerans kılavuzu (2012) [O]: https://food.ec.europa.eu/system/files/2016-10/labelling_nutrition-vitamins_minerals-guidance_tolerances_1212_en.pdf
- TGK Etiketleme Kılavuzu, Tarım ve Orman Bakanlığı (2024) [O]: https://www.rok.org.tr/wp-content/uploads/2024/12/TGK-Gida-Kodeksi-Etiketleme-ve-Tuketici-Bilgilendirme-Yonetmeligi-Kilavuzu.pdf
- 21 CFR 101.9: https://www.ecfr.gov/current/title-21/chapter-I/subchapter-B/part-101/subpart-A/section-101.9
- AB 1169/2011 Ek XIV: https://lexparency.org/eu/32011R1169/ANX_XIV/
- Merrill ve Watt, AH-74 (USDA SR13 belgesinde anılıyor): https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/sr13/sr13_doc.pdf
- Badem, Novotny ve ark. 2012: https://pubmed.ncbi.nlm.nih.gov/22760558/
- Carmody ve ark. 2011: https://www.pnas.org/doi/10.1073/pnas.1112128108
- Urban ve ark. 2010: https://www.sciencedaily.com/releases/2010/01/100105100021.htm
- USDA Retention Factors R6: https://www.ars.usda.gov/arsuserfiles/80400530/pdf/retn06.pdf
- EuroFIR tarif kılavuzu: https://www.eurofir.org/wp-admin/wp-content/uploads/2015/12/EUROFIR-RECIPE-GUIDELINE_FINAL.pdf
- Evenepoel ve ark. 2020 (MFP ve NUBEL): https://doi.org/10.2196/18237
- Lichtman ve ark. 1992: https://pubmed.ncbi.nlm.nih.gov/1454084/
- OFF denetim bloğu [İK]: https://dev.to/leanapp/auditing-857655-open-food-facts-labels-with-pandas-how-many-nutrition-facts-contradict-themselves-4cen
- FDC indirmeler [O]: https://fdc.nal.usda.gov/download-datasets/
- OFF veri ve lisans: https://world.openfoodfacts.org/data · https://world.openfoodfacts.org/terms-of-use · https://huggingface.co/datasets/openfoodfacts/product-database
- TürKomp: https://turkomp.tarimorman.gov.tr/useofdata (açılmadı) · https://mam.tubitak.gov.tr/en/turkeys-national-food-composition-database/ · https://arastirma.tarimorman.gov.tr/bursagida/Menu/71/Turkomp
- CIQUAL: https://www.data.gouv.fr/datasets/table-de-composition-nutritionnelle-des-aliments-ciqual-2020 · https://entrepot.recherche.data.gouv.fr/dataset.xhtml?persistentId=doi%3A10.57745%2FRDMHWY
- CoFID: https://www.fao.org/food-composition/tables-and-databases/detail/(united-kingdom--2021)-mccance-and-widdowson-s-the-composition-of-foods-integrated-dataset/en
- CNF: https://open.canada.ca/data/en/dataset/089885f9-ed53-44e6-854a-14d21a1ec2e0
- AFCD: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/about-afcd
- STFCJ: https://www.mext.go.jp/content/20201225-mxt_kagsei-mext_01110_011.pdf
- BEDCA: https://datos.gob.es/en/solicitud-de-datos/base-de-datos-bedca
- FAO/INFOODS: https://www.fao.org/infoods/infoods/tables-and-databases/faoinfoods-databases/en/
- BeBiS: https://bebis.com.tr/bebis-1
- Merdol, Standart Yemek Tarifeleri: https://www.seckin.com.tr/kitap/toplu-beslenme-yapilan-kurumlar-icin-standart-yemek-tarifeleri-turkan-kutluay-merdol-s-p-821932233
- FatSecret: https://platform.fatsecret.com/docs/guides/storable-data · Edamam: https://developer.edamam.com/food-database-api · Spoonacular: https://spoonacular.com/food-api/terms · Nutritionix: https://www.nutritionix.com/api · MFP: https://www.myfitnesspal.com/api_inquiries/new
- Food-101: https://data.vision.ee.ethz.ch/cvl/datasets_extra/food-101/ · Recipe1M+: https://arxiv.org/pdf/1810.06553 · FoodSeg103: https://arxiv.org/pdf/2105.05409 · TurkishFoods-15: https://huggingface.co/datasets/yunusserhat/TurkishFoods-15 · Diğerleri: https://arxiv.org/pdf/2303.05073
- Nutrition5k: https://arxiv.org/abs/2103.03375
- SnapCalorie (kurucu yorumu): https://news.ycombinator.com/item?id=44225734 · Cal AI: https://www.cnbc.com/2025/09/06/cal-ai-how-a-teenage-ceo-built-a-fast-growing-calorie-tracking-app.html · https://www.inc.com/ben-sherry/he-built-an-ai-app-in-high-school-made-40m-and-sold-to-myfitnesspal-now-hes-aiming-even-bigger/91307748
- MFP Meal Scan ve Passio: https://www.passio.ai/case-studies/myfitnesspal
- Tanıma platformları karşılaştırması (JMIR FR 2020): https://pmc.ncbi.nlm.nih.gov/articles/PMC7752530/
- Snap It (2016): https://techcrunch.com/2016/09/29/lose-it-launches-snap-it-to-let-users-count-calories-in-food-photos/
- 6 uygulama karşılaştırması [İK]: https://clinicalnutritionreport.com/research/ai-photo-calorie-benchmark-2026/
- Hoang ve ark. (JAMA Netw Open 2023): https://doi.org/10.1001/jamanetworkopen.2023.50367
- Haman ve ark. (Nutrition 2024): https://www.sciencedirect.com/science/article/abs/pii/S0899900723003532
- OGL-Canada atıf metni: https://spdx.org/licenses/OGL-Canada-2.0.html
- Rodríguez-Jiménez ve ark. 2025 [O]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12655113/
- O'Hara ve ark. 2025 [O]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11858203/
- NutriBench: https://arxiv.org/pdf/2407.12843

---

## F) Uygulama (3 Ekim 2026)

`www/foods.js` elle değil `node tools/besin/uret.js` ile üretilir; `scripts/foods.test.js` üretilen çıktıyla dosyanın aynı olduğunu denetler.

- **Kaynak dosyalar (`tools/besin/`):** `genel.tsv` (Türkçe ad, USDA anahtarı, porsiyon, eş ad), `malzeme.tsv` (yalnız tarifte geçen USDA malzemeleri), `tarif.txt` (tarifler), `esad.tsv` (eski satırlar için eş adlar), `mevcut.txt` (ilk 106 kayıt, değişmedi), `usda-altkume.json` (kullanılan USDA kayıtları: fdc_id, açıklama, enerji, protein, karbonhidrat, yağ, lif, porsiyon ağırlıkları), `cikar.py` (USDA CSV'den alt küme çıkarır), `uret.js`.
- **Genel besinler:** değerler SR Legacy'den birebir (kcal 1008, protein 1003, karbonhidrat 1005 "by difference", yağ 1004). Anahtar, en kısa eşleşen açıklamayı seçer; sonuç `usda-altkume.json` içindedir. Alkollü ve lif ağırlıklı (kakao, kepek, limon) kayıtlar Atwater testine uymadığı için genel listeye alınmadı.
- **Tarifler:** her satırda çiğ malzeme gramı (ya da adında "haşlanmış/fırında" geçen pişmiş USDA kaydı), pişme verimi ve porsiyon vardır. 100 g değeri = malzeme USDA değerlerinin toplamı / pişmiş ağırlık. Verim tablosu ve yağ emilimi varsayımları `tarif.txt` başındadır; bunlar ölçüm değil belgelenmiş varsayımdır. Tuz ve baharat hesaba katılmadı (%1'in altında). `lo/hi`: eklenen yağ x0,6 ve x1,5 ile hesaplanan 100 g kcal değeri; yağ eklenmeyen yemekte aralık yoktur.
- **Karbonhidrat:** tüm satırlarda USDA toplam karbonhidrat (lif dahil). İlk 106 satırdan yalnız `1` işaretliler USDA ile karşılaştırıldı; işaretsiz elle girilmiş satırlar doğrulanmamış tahmindir. Open Food Facts barkod değerleri etiket tanımıyla (lifsiz) gelir ve ayrı gösterilir.
- **Arama:** ç, ğ, ı, ö, ş, ü katlanır; eş adlar (potato, doner, hummus, feta, fileto vb.) ad eşleşmesinden sonra sıralanır.
- **Vekil kuralı (4 Ekim 2026):** tam karşılığı olmayan yaygın Türk besini, vekil ya da bileşen hesabıyla ve geniş `lo/hi` aralığıyla eklenir; "USDA'da yok" tek başına eklememe nedeni değildir. Uydurma sayı yasaktır: her değerin dayanağı USDA vekili, CIQUAL/CoFID kaydı, tarif hesabı ya da tarif oranıdır ve `vekil.txt`/`harici.tsv` içinde yazılıdır. Arayüz "Tahmini değer." notunun ardından `vekil.tsv` nedenini gösterir ("Vekil: ..."; eski elle girilmiş satırlarda "Çapraz kontrol: ..." kaynak aralığı). Kaşar (provolone), beyaz peynir (feta) ve yufka (phyllo) vekilleri CoFID/CIQUAL kayıtlarıyla karşılaştırıldı; fark %8'in altında (feta 264 ve 250, filo 299 ve 278) ya da Türk ürününe daha yakın kayıt yok olduğundan değerler değişmedi, karşılaştırma notu eklendi.
- **Kısa liste, eklenen (vekil.txt, 24 kayıt):** sucuklu, pastırmalı, kavurmalı ve kaşarlı sahanda yumurta; sucuklu kaşarlı tost; sucuk ekmek; sucuk (çiğ); pastırma; hellim; kuru tarhana; tahin pekmez; nar ekşisi; leblebi; protein bar (jenerik); şalgam suyu; boza; salep; Türk kahvesi (sade, az, orta, çok şekerli); çay (1, 2, 3 kesme şekerli). Eski listede zaten vardı, dayanağı yoktu (yalnız çapraz kontrol notu): sucuk (pişmiş), pekmez, ayran, simit, tarhana çorbası, beyaz peynir, lor, yufka, baklava, lokum, helva, et döner. Taranıp yeni kayıt gerekmeyenler: menemen, börek, gözleme, mantı, çiğ köfte, lahmacun, kuruyemiş karışımları, sütlaç, kazandibi, İskender, kumpir, balık ekmek, pestil. Eklenmeyenler: çökelek, tulum ve pide peyniri, kokoreç, tantuni, midye dolma, kaymak (güvenilir vekil yok: protein ve yağ düzeyi tutmuyor ya da sakatat/işleme farkı büyük).
- **Harici kaynaklar (`harici.tsv` → `harici.json`, `harici.py`):** CIQUAL 2025 (ANSES, Etalab Açık Lisans 2.0; yalnız atıf) ve UK CoFID 2021 (Public Health England, OGL v3; yalnız atıf). Kullanılan kayıtlar: CIQUAL "Dry sausage" (sucuk vekili, 418 kcal), CIQUAL "Viande des Grisons" (pastırma vekili, 207 kcal), CoFID "Cheese, Halloumi" (hellim, 313 kcal). Değerler dosyadan okunur; karbonhidrat USDA tanımına çevrilir (CIQUAL 31000 + lif 34100; CoFID karbonhidrat + AOAC lifi), protein CIQUAL 25000 (Jones faktörlü), enerji kcal. Ekranda `s` işareti yalnız USDA içindir; bu kayıtlar `s` almaz.
- **Kalite kontrolü:** vekil kayıtlarında 4p+4c+9f ile kcal sapması en çok %10 (`scripts/foods.test.js`); en büyük sapma %8 (şekerli çay, küçük değer).
- **Koç menü kataloğu** yalnız ilk 106 satırdan örneklenir (`FOOD_CORE`); ham besin ve tarif satırları istek boyutunu şişirmesin.
- **Öğün kayıtları (`ogun.txt`, `ek.tsv`):** tek dokunuşla eklenen tabak, sandviç ve menüler; arayüzde "Öğün" etiketi taşır (`o:true`), aramada aynı eşleşmedeki ham besinden sonra gelir. Satırların porsiyon gramı bileşen gramlarının toplamıdır (`uret.js` hesaplar, elle yazılmaz). Bileşenler USDA kayıtları, `tarif.txt` yemekleri ya da USDA ile doğrulanmış (`1` işaretli) eski satırlardır; elle girilmiş eski satırlar malzeme olamaz. Tarif bileşeninin az/bol yağlı aralığı öğüne taşınır.
- **Restoran öğünleri:** hamburger, pizza dilimi, tavuk şerit, taco gibi kalemler USDA'nın markasız "Fast food" kayıtlarından birebir (`ek.tsv`, marka adlı kayıt alınmaz); menüler bunların toplamıdır. Döner, köfte, kebap ve pide için USDA karşılığı yoktur: ızgara dana kıyma (%15/%20 yağlı) ve tavuk (fırında) vekil alındı, lahmacun tarif hesaplıdır. Bunlarda ve tüm restoran menülerinde kcal aralığı sabit ±%30'dur (porsiyon ve yağ miktarı yere göre değişir; eski ev yemeği kuralıyla aynı).
- **Hazır ürün kategorileri:** pretzel, granola bar çeşitleri, bisküvi, gofret, mısır cipsi, kuruyemiş karışımı vb. USDA SR Legacy genel (markasız) kayıtlarıdır. Protein bar, sucuk ve pekmez için markasız USDA karşılığı yoktur; vekil olarak ayrı bölümde (`vekil.txt`) eklendi.
- **Değişmezlik:** ilk 513 ve ilk 743 kaydın adı ve sırası `scripts/foods.test.js` içinde sha1 ile kilitlidir; yeni kayıtlar yalnız sona eklenir (`vekil.txt`, 744-767).
