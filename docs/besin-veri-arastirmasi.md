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
| **TürKomp** (TAGEM ve TÜBİTAK MAM; veri girişini Gıda ve Yem Kontrol Merkez Araştırma Enstitüsü, Bursa koordine ediyor) | 500'den fazla gıda, 100 bileşen, yaklaşık 63.000 veri [Ö: TÜBİTAK MAM]. Türk analiz verisi | "İzinsiz kopyalama ve dağıtım yasak". Bilgisayar programında ticari kullanım için **sözleşme ve yıllık ücret** gerekiyor [Ö: arama özeti; sayfa otomatik erişimde açılmadı] | **2** (izin alınırsa 5) | **Mevcut risk:** `www/modules/nutrition/foods.js` başlığında "TürKomp ve USDA'dan derlenmiş" yazıyor. Hangi değerlerin TürKomp'tan geldiği belirlenmeli: ya izin alınmalı ya o değerler USDA ya da tarif hesabıyla değiştirilmeli. Ücretsiz olmasa da uygulama ücretsiz ve reklamsız olduğundan izin istenebilir |
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
- **`www/modules/nutrition/foods.js`:** 106 satır, 9,4 KB, satır başına yaklaşık 89 bayt. Satır yapısı: `[ad, kcal, p, c, f, [[porsiyon, gram]…], usdaBayrağı]`.
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

`www/modules/nutrition/foods.js` elle değil `node tools/besin/uret.js` ile üretilir; `scripts/foods.test.js` üretilen çıktıyla dosyanın aynı olduğunu denetler.

- **Kaynak dosyalar (`tools/besin/`):** `genel.tsv` (Türkçe ad, USDA anahtarı, porsiyon, eş ad), `malzeme.tsv` (yalnız tarifte geçen USDA malzemeleri), `tarif.txt` (tarifler), `esad.tsv` (eski satırlar için eş adlar), `mevcut.txt` (ilk 106 kayıt, değişmedi), `usda-altkume.json` (kullanılan USDA kayıtları: fdc_id, açıklama, enerji, protein, karbonhidrat, yağ, lif, porsiyon ağırlıkları), `cikar.py` (USDA CSV'den alt küme çıkarır), `uret.js`.
- **Genel besinler:** değerler SR Legacy'den birebir (kcal 1008, protein 1003, karbonhidrat 1005 "by difference", yağ 1004). Anahtar, en kısa eşleşen açıklamayı seçer; sonuç `usda-altkume.json` içindedir. Alkollü ve lif ağırlıklı (kakao, kepek, limon) kayıtlar Atwater testine uymadığı için genel listeye alınmadı.
- **Tarifler:** her satırda çiğ malzeme gramı (ya da adında "haşlanmış/fırında" geçen pişmiş USDA kaydı), pişme verimi ve porsiyon vardır. 100 g değeri = malzeme USDA değerlerinin toplamı / pişmiş ağırlık. Verim tablosu ve yağ emilimi varsayımları `tarif.txt` başındadır; bunlar ölçüm değil belgelenmiş varsayımdır. Tuz ve baharat hesaba katılmadı (%1'in altında). `lo/hi`: eklenen yağ x0,6 ve x1,5 ile hesaplanan 100 g kcal değeri; yağ eklenmeyen yemekte aralık yoktur.
- **Karbonhidrat:** tüm satırlarda USDA toplam karbonhidrat (lif dahil). İlk 106 satırın tamamı belgelidir (bölüm G): `1` işaretliler USDA birebir, diğerleri tarif/vekil hesabı ya da çapraz kontrol notlu tahmindir. Open Food Facts barkod değerleri etiket tanımıyla (lifsiz) gelir ve ayrı gösterilir.
- **Arama:** ç, ğ, ı, ö, ş, ü katlanır; eş adlar (potato, doner, hummus, feta, fileto vb.) ad eşleşmesinden sonra sıralanır.
- **Vekil kuralı (4 Ekim 2026):** tam karşılığı olmayan yaygın Türk besini, vekil ya da bileşen hesabıyla ve geniş `lo/hi` aralığıyla eklenir; "USDA'da yok" tek başına eklememe nedeni değildir. Uydurma sayı yasaktır: her değerin dayanağı USDA vekili, CIQUAL/CoFID kaydı, tarif hesabı ya da tarif oranıdır ve `vekil.txt`/`harici.tsv` içinde yazılıdır. Arayüz "Tahmini değer." notunun ardından `vekil.tsv` nedenini gösterir ("Vekil: ..."; eski elle girilmiş satırlarda "Çapraz kontrol: ..." kaynak aralığı). Kaşar (provolone), beyaz peynir (feta) ve yufka (phyllo) vekilleri CoFID/CIQUAL kayıtlarıyla karşılaştırıldı; fark %8'in altında (feta 264 ve 250, filo 299 ve 278) ya da Türk ürününe daha yakın kayıt yok olduğundan değerler değişmedi, karşılaştırma notu eklendi.
- **Kısa liste, eklenen (vekil.txt, 24 kayıt):** sucuklu, pastırmalı, kavurmalı ve kaşarlı sahanda yumurta; sucuklu kaşarlı tost; sucuk ekmek; sucuk (çiğ); pastırma; hellim; kuru tarhana; tahin pekmez; nar ekşisi; leblebi; protein bar (jenerik); şalgam suyu; boza; salep; Türk kahvesi (sade, az, orta, çok şekerli); çay (1, 2, 3 kesme şekerli). Eski listede zaten vardı, dayanağı yoktu (yalnız çapraz kontrol notu): sucuk (pişmiş), pekmez, ayran, simit, tarhana çorbası, beyaz peynir, lor, yufka, baklava, lokum, helva, et döner. Taranıp yeni kayıt gerekmeyenler: menemen, börek, gözleme, mantı, çiğ köfte, lahmacun, kuruyemiş karışımları, sütlaç, kazandibi, İskender, kumpir, balık ekmek, pestil. Bu turda eklenmeyen çökelek, tulum, pide peyniri, kokoreç, tantuni, midye dolma ve kaymak ikinci turda eklendi (aşağıda).
- **İkinci tur (4 Ekim 2026, `vekil.txt` ve `vekil-ogun.txt`, 32 kayıt, 768-799):** çökelek, tulum peyniri, pide peyniri, kaymak, salam (dana, pişmiş), kokoreç, tantuni, ciğer şiş, midye dolma (varsayılan 4 adet; 1 ve 10 adet porsiyonu da var), etli yaprak sarma, çiğ börek, şakşuka, muhammara, etli ekmek, kuşbaşılı pide, sucuklu pide, sade/patatesli/zeytinli/kıymalı poğaça, işkembe çorbası, tel kadayıf, güllaç, hoşaf, limonlu şerbet, meyve dondurması (sorbe), kaymaklı dondurma (Maraş tipi); öğün: kokoreç ekmek arası, tantuni dürüm, kaymak-bal-ekmek, simit ve beyaz peynir, kaymaklı ekmek kadayıfı. Kaynak türü: 12 kayıt CIQUAL/CoFID bileşeni içerir (çökelek, tulum, kaymak, kokoreç, ciğer şiş, işkembe çorbası, sucuklu pide, sorbe, kaymaklı dondurma ve üç öğün), 20 kayıt yalnız USDA ve tarif hesabıdır. Aralıklar ±%25-40. Her kaydın dayanağı `vekil.tsv` notundadır; en belirsiz olanlar kokoreç (bağırsak yağı hesapta yok), kaymak (yağ oranı markaya göre 40-65 g), çökelek ve tulum (peynir türü vekil).
- **Eş ad ile karşılanan (yeni kayıt açılmadı):** urfa kebap (Adana kebap), tahin helvası (Helva (tahin)), siyah zeytin (Zeytin), örgü peyniri/çeçil (Dil peyniri). Taramada zaten listede olduğu için eklenmeyenler: İskender, şiş çeşitleri, pirzola, karnıyarık, imam bayıldı, zeytinyağlı dolma ve yaprak sarma, kısır, çiğ köfte, mücver, haydari, cacık, ezme, hünkar beğendi, gözleme çeşitleri, açma, irmik helvası, aşure, künefe, tulumba, revani, sütlaç, kazandibi, keşkül, lokma, dondurma, tüm tek tek kuruyemişler ve kuru meyveler, kola, gazoz, meyve suyu, limonata, ezogelin/yayla/domates çorbası, pilav ve makarna çeşitleri, tahin-pekmez, sucuk, sosis.
- **Üçüncü tur (`vekil.txt`, 19 kayıt, 800-818 arası; öğünler 819-823):** kavrulmuş badem, fındık, kaju, antep fıstığı, yer fıstığı (tuzsuz), ay çekirdeği, kabak çekirdeği (USDA kuru kavrulmuş, birebir; çiğleri ayrı kayıt), şekersiz fındık ezmesi, labne, vişne suyu, 3'ü 1 arada kahve, kuzu incik, paça çorbası, beyti, kemalpaşa, kalburabastı, şöbiyet, zerde, tavuk göğsü tatlısı. Hepsi USDA/tarif hesabıdır (yeni harici kayıt yok); nedenleri `vekil.tsv`'de.
- **Kalan eksikler:** yoğurtlu mantı (sosuyla), cevizli sucuk, çiroz ve lakerda, kuru dut ve kuru vişne (açık lisanslı kuru meyve kaydı bulunamadı), biber salçası (USDA çiğ biberin kcal-makro tutarsızlığı nedeniyle hesap %10 kuralını geçemedi), eski kaşar (CIQUAL/CoFID olgunlaşmış kaşar karşılığı yok). Kaynak bulununca aynı yöntemle eklenir.
- **Harici kaynaklar (`harici.tsv` → `harici.json`, `harici.py`):** CIQUAL 2025 (ANSES, Etalab Açık Lisans 2.0; yalnız atıf) ve UK CoFID 2021 (Public Health England, OGL v3; yalnız atıf). Kullanılan kayıtlar: CIQUAL "Dry sausage" (sucuk vekili, 418 kcal), CIQUAL "Viande des Grisons" (pastırma vekili, 207 kcal), CoFID "Cheese, Halloumi" (hellim, 313 kcal). İkinci tur: CIQUAL quark %2-3 yağlı, koyun pecorino, kutu dondurma ve kutu sorbe; CoFID cottage, feta, clotted cream, işkembe (çiğ) ve kuzu ciğeri (kızartılmış). `harici.py` enerji ile 4p+4c+9f arasında %15'ten fazla fark bulursa durur (CIQUAL'da enerji eksik kaydı sessizce 0 kcal olmasın). Değerler dosyadan okunur; karbonhidrat USDA tanımına çevrilir (CIQUAL 31000 + lif 34100; CoFID karbonhidrat + AOAC lifi), protein CIQUAL 25000 (Jones faktörlü), enerji kcal. Ekranda `s` işareti yalnız USDA içindir; bu kayıtlar `s` almaz.
- **Kalite kontrolü:** vekil kayıtlarında 4p+4c+9f ile kcal sapması en çok %10 (`scripts/foods.test.js`); en büyük sapma %8 (şekerli çay, küçük değer).
- **Koç menü kataloğu** yalnız ilk 106 satırdan örneklenir (`FOOD_CORE`); ham besin ve tarif satırları istek boyutunu şişirmesin.
- **Öğün kayıtları (`ogun.txt`, `ek.tsv`):** tek dokunuşla eklenen tabak, sandviç ve menüler; arayüzde "Öğün" etiketi taşır (`o:true`), aramada aynı eşleşmedeki ham besinden sonra gelir. Satırların porsiyon gramı bileşen gramlarının toplamıdır (`uret.js` hesaplar, elle yazılmaz). Bileşenler USDA kayıtları, `tarif.txt` yemekleri ya da USDA ile doğrulanmış (`1` işaretli) eski satırlardır; elle girilmiş eski satırlar malzeme olamaz. Tarif bileşeninin az/bol yağlı aralığı öğüne taşınır.
- **Restoran öğünleri:** hamburger, pizza dilimi, tavuk şerit, taco gibi kalemler USDA'nın markasız "Fast food" kayıtlarından birebir (`ek.tsv`, marka adlı kayıt alınmaz); menüler bunların toplamıdır. Döner, köfte, kebap ve pide için USDA karşılığı yoktur: ızgara dana kıyma (%15/%20 yağlı) ve tavuk (fırında) vekil alındı, lahmacun tarif hesaplıdır. Bunlarda ve tüm restoran menülerinde kcal aralığı sabit ±%30'dur (porsiyon ve yağ miktarı yere göre değişir; eski ev yemeği kuralıyla aynı).
- **Hazır ürün kategorileri:** pretzel, granola bar çeşitleri, bisküvi, gofret, mısır cipsi, kuruyemiş karışımı vb. USDA SR Legacy genel (markasız) kayıtlarıdır. Protein bar, sucuk ve pekmez için markasız USDA karşılığı yoktur; vekil olarak ayrı bölümde (`vekil.txt`) eklendi.
- **Değişmezlik:** ilk 513, 743, 767 ve 818 kaydın adı ve sırası `scripts/foods.test.js` içinde sha1 ile kilitlidir; yeni kayıtlar yalnız sona eklenir (`vekil.txt`, 744-767; `vekil.txt` sonu ve `vekil-ogun.txt`, 768-799).

## G) İlk 106 satırın yeniden üretimi (6 Ekim 2026)

TürKomp izni beklenmedi; ilk 106 satırdan USDA ile işaretli olmayan 61 satırın değerleri kendi hesabımızla yeniden üretildi (ad, sıra ve porsiyonlar sha1 kilidi nedeniyle aynı). Kaynaklar: `tools/besin/eski.tsv` (USDA SR Legacy kaydı birebir, `1` işareti, 20 satır), `tools/besin/eski.txt` (tarif hesabı ya da vekil, `Tahmini` + `Hesap:`/`Vekil:` notu ve lo/hi, 39 satır; nedenler `vekil.tsv`), bilinçli korunan 2 satır (Et döner, Sucuk (pişmiş): değer ve çapraz kontrol notu aynı). Dayanaksız sayı kalmadı. Hesap girdileri (gram, su, buharlaşma) kaynak değil varsayımdır, notta yazılıdır. Kullanıcıların günlük girişleri kendi kcal değerini sakladığı için geçmiş kayıtlar etkilenmez. `(!)` değer %15'ten fazla kaydı demektir. Mısır gevreği USDA kaydı markalıdır (RALSTON Corn Flakes; SR Legacy hazır tahılları markalıdır). Eski "USDA tahin helvası 469 kcal" notu SR Legacy'de kayıt bulunamadığı için kaldırıldı; helva artık tahin ve şeker hesabıdır.

| # | Besin | Eski (kcal/p/k/y) | Yeni | Değişim | Dayanak |
|---|---|---|---|---|---|
| 4 | Menemen | 132/6.5/4/10 | 97/4.4/4.1/7.2 | -27% (!) | Hesap/vekil, aralık 58-136 |
| 5 | Beyaz peynir | 264/17/1.5/21 | 265/14.2/3.9/21.5 | 0% | Hesap/vekil, aralık 225-305 |
| 7 | Lor peyniri | 94/11/3.5/4 | 103/9.4/3.1/6 | +10% | Hesap/vekil, aralık 72-134 |
| 8 | Zeytin | 146/1/4/14 | 145/1.03/3.84/15.32 | -1% | USDA |
| 10 | Reçel | 250/0.4/65/0.1 | 278/0.37/68.86/0.07 | +11% | USDA |
| 11 | Pekmez | 293/1/73/0.1 | 290/0/74.7/0.1 | -1% | Hesap/vekil, aralık 267-313 |
| 15 | Yulaf ezmesi (kuru) | 389/17/66/7 | 379/13.15/67.7/6.52 | -3% | USDA |
| 16 | Mısır gevreği | 375/7/84/0.9 | 384/5.9/88.01/0.91 | +2% | USDA |
| 17 | Beyaz ekmek | 261/9/49/3.2 | 266/8.85/49.42/3.33 | +2% | USDA |
| 18 | Tam buğday ekmeği | 244/10/43/3.5 | 252/12.45/42.71/3.5 | +3% | USDA |
| 19 | Simit | 287/9/55/3.5 | 307/11.6/55/4.8 | +7% | Hesap/vekil, aralık 261-353 |
| 20 | Lavaş | 300/8/50/7 | 275/9.1/55.7/1.2 | -8% | Hesap/vekil, aralık 234-316 |
| 21 | Tost (kaşarlı) | 268/12/28/12 | 315/13.4/35.8/13 | +18% (!) | Hesap/vekil, aralık 236-394 |
| 22 | Gözleme (peynirli) | 242/8/30/10 | 295/9.1/38/11.5 | +22% (!) | Hesap/vekil, aralık 221-369 |
| 23 | Su böreği (peynirli) | 262/9/25/14 | 248/7.8/25.9/12.4 | -5% | Hesap/vekil, aralık 186-310 |
| 24 | Lahmacun | 232/12/28/8 | 230/8.6/32.5/7 | -1% | Hesap/vekil, aralık 161-299 |
| 25 | Pizza | 266/11/33/10 | 266/11.39/33.33/9.69 | 0% | USDA |
| 26 | Hamburger | 251/13/25/11 | 263/13.3/29.57/10.18 | +5% | USDA |
| 27 | Mercimek çorbası | 61/3.5/8.5/1.5 | 63/3.1/9.3/1.8 | +3% | Hesap/vekil, aralık 59-69 |
| 28 | Ezogelin çorbası | 62/2.5/9/1.8 | 58/2.4/8.9/1.7 | -6% | Hesap/vekil, aralık 53-64 |
| 29 | Domates çorbası | 50/1.2/8/1.5 | 44/1.1/4.6/2.6 | -12% | Hesap/vekil, aralık 37-53 |
| 30 | Tarhana çorbası | 55/2.5/8/1.5 | 50/1.1/7.2/1.8 | -9% | Hesap/vekil, aralık 36-65 |
| 31 | Yayla çorbası | 61/2.5/6/3 | 55/1.6/6.2/2.6 | -10% | Hesap/vekil, aralık 50-62 |
| 32 | Pirinç pilavı | 150/2.8/28/3 | 148/2.5/28.1/2.5 | -1% | Hesap/vekil, aralık 142-156 |
| 33 | Bulgur pilavı | 120/3.5/22/2 | 139/4/24.5/3.7 | +16% (!) | Hesap/vekil, aralık 104-174 |
| 35 | Mantı (haşlanmış) | 170/7/22/6 | 175/7.4/28/3.3 | +3% | Hesap/vekil, aralık 131-219 |
| 36 | Kuru fasulye yemeği | 112/6/13/4 | 114/7.6/14.6/3.1 | +2% | Hesap/vekil, aralık 108-122 |
| 37 | Nohut yemeği | 140/7/18/4.5 | 118/6.2/13.2/4.8 | -16% (!) | Hesap/vekil, aralık 89-148 |
| 40 | Humus | 178/8/14/10 | 177/4.86/20.12/8.59 | -1% | USDA |
| 42 | Fırın tavuk but | 205/26/0/11 | 184/24.03/0/8.99 | -10% | USDA |
| 43 | Tavuk döner | 190/24/1/10 | 179/24.8/0/8.2 | -6% | Hesap/vekil, aralık 134-224 |
| 45 | Adana kebap | 247/17/2/19 | 270/25.8/0/17.8 | +9% | Hesap/vekil, aralık 189-351 |
| 46 | Izgara köfte | 236/18/5/16 | 237/22.8/4.6/13.4 | 0% | Hesap/vekil, aralık 166-308 |
| 47 | İçli köfte | 240/8/25/12 | 274/10.7/33.2/11.7 | +14% | Hesap/vekil, aralık 192-356 |
| 48 | Izgara et (biftek) | 248/26/0/16 | 257/26.8/0/15.75 | +4% | USDA |
| 49 | Pişmiş kıyma | 239/26/0/15 | 232/24.62/0/14.02 | -3% | USDA |
| 50 | Izgara balık (levrek, çipura) | 138/22/0/5.5 | 124/23.63/0/2.56 | -10% | USDA |
| 54 | Hindi salam | 108/16/2/4 | 106/14.81/2.2/3.77 | -2% | USDA |
| 55 | Etli sebze yemeği | 97/7/6/5 | 70/4.2/6.2/3.2 | -28% (!) | Hesap/vekil, aralık 42-98 |
| 56 | Karnıyarık | 133/6/7/9 | 132/3.3/4.7/11.5 | -1% | Hesap/vekil, aralık 106-163 |
| 57 | İmam bayıldı | 110/1.5/8/8 | 104/1.1/6.4/8.8 | -5% | Hesap/vekil, aralık 76-136 |
| 58 | Zeytinyağlı taze fasulye | 94/2/8/6 | 68/1.2/5.3/5.2 | -28% (!) | Hesap/vekil, aralık 41-95 |
| 59 | Zeytinyağlı yaprak sarma | 188/3/25/8.5 | 198/3/24.9/10 | +5% | Hesap/vekil, aralık 174-225 |
| 60 | Çoban salatası | 60/1/5/4 | 44/0.8/4.1/3.1 | -27% (!) | Hesap/vekil, aralık 26-62 |
| 67 | Patates kızartması | 312/3.4/41/15 | 312/3.43/41.44/14.73 | 0% | USDA |
| 71 | Ayran | 34/1.7/2.4/1.9 | 31/1.7/2.3/1.6 | -9% | Hesap/vekil, aralık 25-37 |
| 72 | Kefir | 60/3.4/4.5/3.3 | 61/3.2/4.8/3.3 | +2% | Hesap/vekil, aralık 46-76 |
| 73 | Kola | 42/0/10.6/0 | 42/0/10.36/0.25 | 0% | USDA |
| 74 | Meyve suyu | 46/0.5/11/0.1 | 46/0.1/11.3/0.13 | 0% | USDA |
| 90 | Kuru üzüm | 299/3/79/0.5 | 299/3.3/79.32/0.25 | 0% | USDA |
| 95 | Baklava | 431/6/50/23 | 456/6.2/42.1/30.9 | +6% | Hesap/vekil, aralık 388-524 |
| 96 | Sütlaç | 128/3.2/21/3.5 | 118/3/20.7/2.6 | -8% | Hesap/vekil, aralık 94-142 |
| 97 | Kazandibi | 140/4/22/4 | 133/3.1/21.4/4 | -5% | Hesap/vekil, aralık 106-160 |
| 98 | Künefe | 324/7/38/16 | 335/8.9/36.9/17.2 | +3% | Hesap/vekil, aralık 251-419 |
| 99 | Aşure | 142/3/28/2 | 133/2.3/26.7/2.6 | -6% | Hesap/vekil, aralık 93-173 |
| 100 | Helva (tahin) | 509/12/50/29 | 479/8.9/63.1/24 | -6% | Hesap/vekil, aralık 407-551 |
| 101 | Lokum | 345/0.5/85/0.3 | 317/0/80.9/0 | -8% | Hesap/vekil, aralık 269-365 |
| 103 | Bisküvi (petibör) | 436/7/75/12 | 406/7.05/70.54/10.58 | -7% | USDA |
| 104 | Kek (sade) | 382/5/50/18 | 389/5.2/52.5/17.9 | +2% | USDA |
