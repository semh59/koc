# Ar-Ge: Beslenme takımı (nutrition, log, oruç)

Erişim tarihi: tüm URL'ler 2026-10-10. "Sayfa" = WebFetch ile açılıp okundu (özetleyici model üzerinden, alıntılar kısa özettir). "Arama özeti" = yalnız WebSearch özeti görüldü, sayfa açılmadı; bu tür bilgi öneriye dayanak yapılmadı, bölüm 6'ya gitti.

## 1. Kapsam ve baktığım rakipler

Kapsam: `www/modules/nutrition/`, `www/modules/log/`, `www/modules/habits/` (oruç) ve bunların bağlı olduğu `www/main/03-screens.js`, `www/main/04-sheets.js`, `www/kernel/algo.js`.

| Rakip | Sürüm / tarih | Nereden baktım |
|---|---|---|
| Cronometer | tarihsiz | https://www.cronometer.com/features/ (sayfa) |
| MacroFactor | iOS 5.8.9 (Eyl) | https://apps.apple.com/app/id1553503471 (sayfa), https://macrofactor.com/macrofactors-algorithms-and-core-philosophy/ (sayfa) |
| YAZIO | iOS 26.40.1 | https://apps.apple.com/us/app/yazio-calorie-counter-diet/id946099227 (sayfa), https://www.yazio.com/en (sayfa) |
| Lifesum | tarihsiz | https://www.lifesum.com/ (sayfa) |
| Fooducate | tarihsiz | https://www.fooducate.com/ (sayfa) |
| Noom | iOS 14.38.0 | https://apps.apple.com/us/app/noom-healthy-weight-loss/id634598719 (sayfa) |
| MyFitnessPal | iOS 26.40.0 | https://www.myfitnesspal.com/premium (sayfa), https://apps.apple.com/us/app/calorie-counter-by-myfitnesspal/id341232718 (sayfa) |
| Lose It! | iOS 18.5.402 | https://apps.apple.com/us/app/lose-it-calorie-counter/id297368629 (sayfa) |
| Diyetkolik (TR) | iOS 9.6.1 | https://apps.apple.com/us/app/-/id558076089 (sayfa) |
| Simple (oruç) | tarihsiz | https://intercom.help/simple-life/en/articles/9887903-how-to-log-and-edit-fasts (sayfa) |
| FatSecret | - | https://foods.fatsecret.com/calories-nutrition/ (sayfa; barkod/ülke bilgisi yok), App Store 404, ana sayfa 403 |
| Bitesnap | - | yalnız arama özeti; sayfa açılamadı (App Store 404) |
| Zero, Fastic, HealthifyMe | - | yalnız arama özeti ve https://gulfnews.com/lifestyle/ramadan-2026-10-best-health-apps-to-track-calories-sleep-and-workouts-in-the-uae-1.500442153 (sayfa, üçüncü taraf) |

Tam okunan uygulama sayfası: 9 (Cronometer, MacroFactor, YAZIO, Lifesum, Fooducate, Noom, MFP, Lose It!, Diyetkolik) + Simple. Türkiye'de yaygın başka uygulamalar (Fit365, Diyet 365, GetFit, Askipo, Happy Diet, Lifie) yalnızca WebTekno listesinden (23 Nisan 2021, https://www.webtekno.com/kalori-hesaplama-uygulamalari-h107846.html, sayfa) biliniyor; kendi sayfalarına bakmadım.

Birinci elden kaynaklar: WHO sağlıklı beslenme bilgi notu (https://www.who.int/news-room/fact-sheets/detail/healthy-diet, sayfa), Google Play "Health Content and Services" politikası (https://support.google.com/googleplay/android-developer/answer/16679511, sayfa).

Rakip sayfalarından okunan temel bulgular:
- Cronometer: "up to 84 other nutrients"; "Photo & Voice Logging" gezinti başlığında var, nasıl çalıştığı yazmıyor; özel hedef ve oruç bu sayfada geçmiyor.
- MacroFactor: harcamayı kilo trendi ve alınan kaliteden geri hesaplıyor, hedefi haftalık güncelliyor; makale yiyecek kaydındaki belirsizliği modellediğini söylemiyor ("accurate, consistent logging" şartı koşuyor). App Store: v5.8.3 "AI custom food creation and label scanning", v5.7.6 "ai photo and/or text recipe import"; sesle kayıt geçmiyor.
- YAZIO: "Just say out loud what you had to eat, or write a short text, and we'll track it", "Optional fasting tracker" (16:8, 5:2), "2,900+ ... recipes", "English and 19 more" dil. Ramazan geçmiyor.
- MyFitnessPal: Barkod/Meal Scan, Voice Log, özel makro hedefleri ve aralıklı oruç Premium'da (premium sayfası tablosu); "20.5M+ foods" (App Store).
- Lose It!: foto, sesle kayıt, barkod, oruç ve vitamin/mineral Premium; "plan to eat more on the weekends" (hafta sonu programı).
- Lifesum: foto, sesle, yazarak, barkod ile kayıt; oruç yalnız diyet seçeneği olarak anılıyor.
- Noom: "AI food logging with 1M+ food items"; renk sistemi sayfada açıklanmıyor.
- Fooducate: "Food Grades"; katkı/alerjen uyarısı sayfada geçmiyor.
- Diyetkolik (TR): barkod okuyucu, aralıklı oruç sayacı ("Premium adds all timer periods"), su takibi, makro takibi (v9.4.8, 05/19/2025). Ramazan, Türk yemeği kapsamı ya da mikro besin sayfada geçmiyor.
- Simple: "every fast begins and ends with a meal"; "Simple will then start counting your fasting period from the latest meal you log".

## 2. Bizim mevcut durumumuz

**Yemek veritabanı ve kayıt.** 818 yerleşik satır (`rg -c '^    \["' www/modules/nutrition/foods.js` = 818). Her satır yalnız kcal/protein/karbonhidrat/yağ taşır; kaynak etiketi (`s`), tahmin aralığı (`lo/hi`), ev yemeği için çiğ-malzeme parçaları (`parts`) var (`foods.js:845` eşleme satırı). Lif, şeker ve sodyum yerleşik satırlarda yok: `rg 'fb:|"fb"' foods.js` eşleşme vermedi. Bu üç değer yalnız barkod (`offlib.js`), etiket okuma (`labellib.js`, `ocrui.js:77`) ve kendi besinlerde dolu.
**Arama.** Aksan ve büyük/küçük harf duyarsız, iyelik ekli kelimeleri bulan Türkçe arama: `foods.js:857` (`foodSearch`). Son yenenler `loglib.js:36`, "Dün"ü kopyala `04-sheets.js:87`, sık kullanılanlar/şablonlar `04-sheets.js:95`.
**Porsiyon ve belirsizlik.** Aralıklı satırlarda tek kayıt ortalamayı saklar, aralık kayıtta `lo/hi` olarak durur (`04-sheets.js:139,187`) ve günlük listede kayıt başına "1850-2100" gibi gösterilir (`03-screens.js:18`). Günün toplamı (halka, `03-screens.js:44,59`) tek sayıdır; aralık toplanmıyor (`rg 'lo|hi' 03-screens.js` yalnız satır 18'i buluyor).
**Mikro besin gösterimi.** `03-screens.js:54,57`: lif/şeker/sodyum toplamı "n/m öğünde veri var" notuyla gösterilir; hedef ya da uyarı yok. Demir, kalsiyum, vitamin vb. hiçbir yerde yok (`rg -i 'demir|kalsiyum|vitamin|potasyum|magnezyum' www -g '!foods.js'` yalnız `coachlib.js` ve `lablib.js` (tahlil) verdi).
**Barkod.** ML Kit tarayıcı + Open Food Facts (anahtarsız), tutarlılık denetimli: `04-sheets.js:150-181`, `offlib.js`. Ürün bulunamazsa kullanıcı elle yazma ekranına düşer (`04-sheets.js:172`); barkod bu ekrana taşınmaz, sonraki taramada yine "bulunamadı" olur. Etiket okuma kaydı barkod taşımaz (`ocrui.js:77`: `{n:name,u:[...]}`).
**Tarif.** Kendi tarifim: malzeme gramları, porsiyon başı değer (`loglib.js:55-72`, `recipeui.js`). Not: "Çiğ ağırlıklarla hesaplandı, pişince değişir; tahmindir" (`loglib.js:74`). Pişirme verimi yalnız yerleşik yemeklerin hesaplandığı araçta var (`tools/nutrition/recipes.txt:3-6`: çorba 0,90, güveç 0,85, pilav 0,94, fırın 0,80...). Uygulamadaki tarif ekranında verim girişi yok (`rg -i 'verim|yield|pişmiş ağırlık' www/modules/nutrition/recipeui.js www/modules/log/loglib.js` boş).
**Menü.** Anahtarsız, cihazda kurallı haftalık menü: `menulocal.js:28` (`make`); alerji/vejetaryen notu kuralları; Rehber menüsü ayrı (`coach.js`).
**Adaptif hedef.** Var: `algo.js:71` `adaptiveTdee` (28 gün pencere, en az 10 tam gün, formülle karışım, kullanıcı onayı olmadan uygulanmaz); `coach.js:161` çağırır. `docs/market/b-food-nutrition.md:13` "adaptif hedef yok" diyor, bu eskimiş.
**Su.** `drinkui.js` (içecek türü; yalnız su ve sade maden suyu hedefe sayılır), bildirimden +250 ml (`quickui.js`), hedef `settings.waterMl` (`01-core.js:47`).
**Oruç.** Sabit planlar 14/16/18/20 (`habitlib.js:4`); bilinmeyen plan 16'ya düşer (`habitlib.js:12`); 72 saat sınırı; güvenlik freni (`algo.js` `riskFlags`): sert bayrakta başlatma kapalı (`habitui.js:25`). Oruç yemek kaydından bağımsız (`rg 'Log\.|S\.entries' www/modules/habits` boş).
**Ramazan/sahur/iftar.** `rg -i 'ramazan|iftar|sahur' www` hiç eşleşme vermedi. Ses tanıma: `rg -i 'SpeechRecognition' www -g '!vendor'` boş. Glisemik indeks ve alerjen: `rg -i 'glisemik|alerjen' www -g '!vendor'` boş.
**İzinler.** Manifestte `ACCESS_FINE_LOCATION` zaten var (`android/app/src/main/AndroidManifest.xml:53`, adım/GPS için); `RECORD_AUDIO` yok.
**Mimari kuralı.** Başka modülün `S` alanına yalnız o modülün API'si ile erişilir (`scripts/boundary.test.js:1-14`); `Log.where` bu API'dir (`log/index.js:5`). `algo.js` çekirdektir (kernel), kural dışıdır.

## 3. Boşluk tablosu

| Özellik | Rakipte durum | Bizde durum | Fark |
|---|---|---|---|
| Serbest metinle tek seferde çok yemek kaydı | YAZIO: yazı/sesle, "we'll track it" (App Store, sayfa); Lose It!, MFP: sesle, Premium (sayfa); Lifesum: yazarak/sesle (sayfa). Hepsinde çevrimdışı çalışıp çalışmadığı yazmıyor | Yok; tek tek ara-seç-porsiyon (`04-sheets.js:100`) | Fark var; çevrimdışı, ücretsiz, Türkçe ek/ölçü bilen ayrıştırıcı rakip sayfalarında bulunamadı |
| Mikro besin | Cronometer 84 besin (sayfa); MacroFactor "micronutrients" (sayfa); Lose It! Premium vitamin/mineral (sayfa) | Yalnız lif/şeker/sodyum, yerleşik yemeklerde hiç yok (`foods.js:845`) | Büyük; rakipler Türk yemeği kapsamını göstermiyor (okunan sayfalarda yok) |
| Günlük toplamda belirsizlik | Fotoğraf uygulamalarında aralık var (arama özeti, DOĞRULANAMADI); MacroFactor makalesi modellemiyor (sayfa) | Kayıt başına aralık var, toplamda yok | Bizde veri hazır, gösterim eksik |
| Ramazan'a uygun kayıt/oruç | Okunan sayfalarda yok: YAZIO, MFP, Lose It!, Lifesum, Noom, Cronometer, Diyetkolik. Gulf News (üçüncü taraf) yalnız HealthifyMe, YAZIO, MFP, Cronometer için genel yorum yapıyor | Yok (`rg` boş) | Büyük fark, Türkiye'ye özgü |
| Oruç penceresi yemek kaydından | Simple: son kayıtlı öğünden başlatır (sayfa) | Yok | Rakipte var; eşitlik |
| Tarifte pişmiş ağırlık/verim | Cronometer'da var gibi (arama özeti; kılavuz 403) | Yok (not var) | DOĞRULANAMADI |
| Bilinmeyen barkodu etiketle kaydetme | MacroFactor: "label scanning" (App Store, sayfa) | Etiket okuma var, barkoda bağlanmıyor (`ocrui.js:77`) | Küçük kayıp |
| Adaptif TDEE/hedef | MacroFactor (sayfa) | Var (`algo.js:71`), onaylı öneri | Eşit; güvenlik freni bizde ek |
| Hafta sonu esnek bütçe | Lose It! (sayfa) | Yok | Reddedildi (bölüm 5) |
| Barkod, oruç sayacı, su, makro | Diyetkolik, YAZIO, MFP (sayfalar); MFP'de barkod, sesle ve oruç Premium | Hepsi ücretsiz var | Üstünlük: ücretsiz ve yerel |

## 4. Öneriler (öncelik sırasıyla)

### 1. Ramazan modu: sahur/iftar öğünleri, imsak-iftar sayacı, bölünmüş su
**Ne yapar.** Ayarlardan "Ramazan modu" açılır; Bugün ekranı imsaka ve iftara kalan süreyi gösterir, öğünler Kahvaltı/Öğle/Akşam yerine Sahur/İftar/Ara öğün olur, su hedefi iftar ile sahur arasına bardak bardak bölünür ve bildirimle hatırlatılır. Uygulama oruç tutmayı teşvik etmez; yalnız tutan kişi için yemek ve su zamanlamasını kolaylaştırır.
**Neden ileride.** Okunan sayfalarda hiçbir kalori uygulamasında Ramazan modu yok (YAZIO, MFP, Lose It!, Lifesum, Noom, Cronometer, Diyetkolik: sayfa); Gulf News yalnız genel yorum veriyor (sayfa); Zero/Fastic/HealthifyMe için yalnız arama özeti var, bu yüzden "hiçbirinde yok" demiyorum: "baktığım 8 uygulamada rastlanmadı". Ramazan 2027 Diyanet takvimine göre 8 Şubat 2027'de başlıyor (haber siteleri; resmi sayfayı açmadım, DOĞRULANAMADI), yani ilk sürüm için yaklaşık 4 ay var.
**Dayandığı kod.** `loglib.js:81` `MEALS` ve `mealOf` (saate göre öğün atama); `menulocal.js:28` `make` (sahur/iftar için öğün dilimi eklenebilir); `habitlib.js:28` `fastState` (bitiş = plan saati; Ramazan'da bitiş mutlak saat olacak); bildirimler `05-notifications.js` (su hatırlatması); manifestte konum izni zaten var, ama gerek yok.
**Kapsam: orta-büyük.** Saatler için konum izni gerekmesin diye il seçimi veya elle imsak/iftar girişi (aralarında günlük kayma otomatik) önerilir. Şemada değişiklik gerekir: `cleanFast` 14/16/18/20 dışını 16'ya çeviriyor (`habitlib.js:4,12`), sabit saatli pencere için `fast.mode:"ramazan"` ve `t0/t1` mutlak alanı eklenmeli. Saat hesabı Diyanet imsakiyesinden dakikalar farklı çıkabilir (doğruluğu DOĞRULANAMADI).
**Risk.** Play: sağlık uygulaması beyanı ve "uygulama içinde hekime danış" hatırlatması gerekir (Google Play Health Content and Services, sayfa: "must also remind users to consult a healthcare professional"); tıbbi iddia yok. Mevcut güvenlik freni (`habitui.js:25`) dini bir orucu sert engelleyebilir; bu modda fren başlatmayı engellemez, yalnız bilgi uyarısı gösterir (diyabet/ilaç/hamilelik notu varsa "hekimine danış" satırı). Oruç tutma kararı kullanıcıya aittir. 60 yaş: tek anahtar + "İftara 2 sa 10 dk" büyük metin; ayrıntılar katlanır.
**Test.** (a) Mod açıkken öğün çipleri Sahur/İftar/Ara öğün; kayıt saati sahur-imsak arasındaysa Sahur atanır (birim test `mealOf` benzeri). (b) 3 ilde hesaplanan imsak/iftar Diyanet imsakiyesiyle ±2 dk uyuşur ya da kullanıcı elle düzeltebilir. (c) Mod kapanınca eski öğünler ve 14/16/18/20 planları bozulmaz (`habit.test`). (d) Sert risk bayrağı olan profilde zamanlayıcı engellenmez, uyarı görünür. Telefonda: bildirim saatleri doğru.

### 2. Hızlı metin kaydı: "2 dilim ekmek, 1 çay bardağı çay, yarım simit"
**Ne yapar.** Yemek ekle ekranında tek satıra tüm öğünü yazarsın (klavyenin kendi mikrofonuyla da söyleyebilirsin); uygulama virgül/"ve" ile ayırır, miktar ve ölçüyü (dilim, çay bardağı, yarım, 1,5, kaşık) okur, besini listeden eşler ve önizleme verir; sen onaylarsın, hepsi tek dokunuşla kaydolur. Eşleşmeyen parça kırmızı kalır, elle seçilir.
**Neden ileride.** YAZIO, Lose It!, MFP ve Lifesum yazı/sesle kayıt sunuyor (sayfalar), ancak MFP ve Lose It!'te Premium; sayfalar çevrimdışı çalıştığını ya da Türkçe ölçü birimlerini bildiğini yazmıyor (bulunamadı, kanıt değil). Biz ücretsiz, ağsız, hesap açmadan yaparız; sonuçta 818 satırlık kaynaklı veri ve aralıklar kullanılır, yapay zekâ tahmini değil.
**Dayandığı kod.** `foods.js:857` `foodSearch` (aksan/ek duyarsız); her satırda `u` porsiyon listesi (`[["1 dilim (30 g)",30]...]`, `foods.js:29` vb.); `04-sheets.js:182` `goNutrition` kayıt yolu; "Rehber'e sor" yedeği zaten var (`04-sheets.js:129`).
**Kapsam: orta.** Saf bir `quicklib.js` (nutrition modülü): bölme, sayı/kesir ("yarım", "bir buçuk"), ölçü eşleme (porsiyon etiketlerinden), `foodSearch`. Ses tanıma API'si yok, yeni izin yok.
**Risk.** Yanlış eşleşme sessiz hata olur: bu yüzden her satırın eşleşen adı ve kcal'i onay ekranında görünür, güven düşükse "seç" ister. Doğruluk riski: "ekmek" genel eşleşmesi. 60 yaş: tek metin kutusu ve "Ekle" düğmesi; ayrıntılar onay listesinde. Klavye mikrofonunun dikte çalışması cihaza bağlı, telefonda doğrulanmadı.
**Test.** Tablo testi (parametrik): "2 dilim beyaz ekmek" -> Beyaz ekmek 60 g; "yarım simit" -> 60 g; "1 çay bardağı çay" -> Çay 100 ml; "mercimek çorbası ve pilav" -> 2 kayıt; bilinmeyen kelime -> eşleşmedi satırı; hiçbir dizgi için kayıt onaydan önce yazılmaz.

### 3. Tahmin payı: günün toplamını aralık olarak göster, harcama tahmininde kullan
**Ne yapar.** Halkanın altında "Bugün ~1850 kcal (1700-2050)" satırı: aralığı olan yemeklerin toplam alt/üst değeri. Porsiyon ekranında "Az yağlı / Orta / Yağlı" üç düğme ortalama yerine seçilen uca yakın değeri kaydeder. Aralık dar kalıyorsa hiçbir şey eklenmez (ekran sade kalır).
**Neden ileride.** MacroFactor makalesi yemek tahminindeki belirsizliği modellediğini söylemiyor ("accurate, consistent logging" şartı, sayfa); bu, ürününde olmadığının kanıtı değil. Fotoğraf uygulamalarında aralık örnekleri arama özetinde (DOĞRULANAMADI). Elimizde veri var: kayıt başına `lo/hi` zaten tutuluyor; Türk ev yemeğinde yağ ve su belirsizliği ±%20-40 (`docs/nutrition-data-research.md:58`).
**Dayandığı kod.** `04-sheets.js:139,187` (aralık, `e.lo/e.hi`); `03-screens.js:18` (kayıt başına gösterim), `03-screens.js:44` (toplam); `algo.js:71` (`adaptiveTdee` kernel'de; kernel çekirdektir, sınır kuralı dışı, `boundary.test.js:1-14`).
**Kapsam: küçük (gösterim + üç düğme), ikinci adım orta** (TDEE güven bandı: `adaptiveTdee` çıktısına ±kcal eklemek).
**Risk.** Kullanıcıyı korkutmamak: aralık yalnız ≥%10 genişse görünür. Tıbbi iddia yok. 60 yaş: tek satır ek, üç düğme önceden "Orta" seçili.
**Test.** Aralıklı ve aralıksız karışık günde toplam alt/üst doğru; yalnız aralıksız günde satır görünmez; "Yağlı" seçimi `hi` değerini kaydeder, `lo<=v<=hi` korunur (`01-core.js:146` doğrulaması geçer).

### 4. Yerleşik Türk yemeklerine lif ve sodyum, sonra Dünya Sağlık Örgütü eşikli sade gösterge
**Ne yapar.** Ev yemeklerinin ve genel besinlerin lif ve sodyum değerleri USDA'dan tariflerle hesaplanır; Bugün ekranında "Lif 18 / 25 g, Tuz tahmini 4,1 / 5 g" gibi iki sade çubuk görünür. Veri eksikse "7/9 öğünde veri var" notu sürer.
**Neden ileride.** Cronometer 84 besin, MacroFactor ve Lose It! mikro besin sunuyor (sayfalar); bunlardan hiçbiri Türk ev yemeği kapsamını göstermiyor (sayfalarda yok). Bizde tarif parçaları USDA'dan hesaplandığı için (`foods.js:2-8`, `tools/nutrition/recipes.txt`) lif/sodyum aynı yöntemle çıkarılabilir; tarif dosyası yaklaşık 180 satır.
**Dayandığı kod.** `foods.js:845` (şu an `fb/sg/na` taşımıyor); `generate.js` + `extract_usda.py` (USDA SR Legacy, CC0, `docs/nutrition-data-research.md:73`); `03-screens.js:54-57` (gösterim); `LogLib.NUTR` alanları zaten var (`loglib.js:5`).
**Kapsam: orta.** `usda-subset.json` yalnız kcal/makro içeriyor (şu an `{id,d,p,c,k,l,por}`), sodyum/lif sütunları eklenip yeniden üretilmeli; yerleşik APK büyür. Şeker eşiği bu işe dahil değil: WHO %10 eşiği "free sugars" için, veride ise toplam şeker (`sg`) var; karşılaştırılamaz, hedef konmaz.
**Eşikler (WHO, sayfa).** Tuz "less than 5 grams per day (2 grams per day sodium)"; lif "at least 25 grams of naturally-occurring dietary fibre" (yetişkin). Çocuklar için eşik farklı, bu yüzden 18 yaş altı profilde gösterilmez.
**Risk.** Sodyum tarifte tuz miktarına bağlı ve ±%40 belirsiz: "tahmin" etiketi şart. Tıbbi tavsiye değil; Play politikası gereği "hekime danış" metni (sayfa). Böbrek/tansiyon notu olan kullanıcıya hedef yerine yalnız toplam gösterilir. 60 yaş: en çok iki çubuk, renkli kırmızı alarm yok.
**Test.** Üretilen satırlarda 50 rastgele satır USDA ile ±%1 uyuşur (mevcut `generate` doğrulamasına eklenir); "Mercimek çorbası" sodyumu < "Salatalık turşusu"; 18 yaş altında çubuk yok; veri olmayan öğünde not görünür.

### 5. Tarifte pişirme verimi: "tencere ağırlığı" ve yöntem seçimi
**Ne yapar.** Kendi tarifini kaydederken "Nasıl pişti?" (çorba, güveç, pilav, fırın, kızartma) seçersin ya da tencerenin pişmiş ağırlığını yazarsın; porsiyon başı değerler 100 g başına doğru çıkar ve kâsene koyduğun gramla kaydedersin.
**Neden ileride.** Bizim kodumuzdaki boşluk açık: tarif notu "pişince değişir; tahmindir" (`loglib.js:74`). Yöntem katsayıları yerleşik yemeklerde zaten kullanılıyor (`recipes.txt:3-6`). Cronometer'ın benzer "cooked weight" özelliği yalnız arama özetinde (kılavuz 403 verdi), bu yüzden rakibe üstünlük iddiası yok, bu bir doğruluk iyileştirmesidir.
**Dayandığı kod.** `loglib.js:55-74` (`recipeCalc`, `recipeFood`), `recipeui.js:20`, `tools/nutrition/recipes.txt:3-6` (katsayılar).
**Kapsam: küçük-orta.** Tarif kaydına isteğe bağlı `cooked` (g) alanı; `recipeFood` porsiyon gramını buna göre ölçekler; yöntem seçilirse katsayı çarpanı.
**Risk.** Yanlış girilen pişmiş ağırlık değeri bozar: makul aralık denetimi (çiğ toplamın %50-%150'si). 60 yaş: alan isteğe bağlı, varsayılan "bilmiyorum".
**Test.** 1000 g çiğ malzemeli tarif, 850 g pişmiş girilince 100 g başına kcal ×1000/850 artar; boş bırakınca bugünkü sonuç aynı; %50 dışı değer reddedilir.

### 6. Bulunamayan barkodu etiket okumayla ürüne bağla
**Ne yapar.** Barkod Open Food Facts'te yoksa "Etiketi fotoğrafla" düğmesi çıkar; okunan değerler kaydedilirken barkod da saklanır, bir sonraki taramada ürün anında gelir. Fotoğraf hiçbir yere gitmez.
**Neden ileride/fark.** Etiket okuma MacroFactor'da da var ("label scanning", App Store sayfası); fark: bizde çevrimdışı ve barkoda bağlanıyor. Türkiye'de OFF'ta kcal'i dolu ürün oranı markaya göre %56-84 (`docs/market/b-food-nutrition.md:22`, 1 Ekim 2026 ölçümü; yeniden doğrulamadım).
**Dayandığı kod.** `04-sheets.js:159-181` (`barcodeFind`, bulunamazsa elle ekran), `ocrui.js:77` (kayıtta `b` yok), `Nutrition.putMy` aynı barkodu eşleştirir (`nutrition/index.js` `putMy`).
**Kapsam: küçük.** `barcodeFind` bulunamayınca barkodu bir değişkene tutar, `labelSave` `food.b` olarak ekler.
**Risk.** Yanlış okunan etiket kalıcı olur: mevcut tutarlılık denetimi (`LabelLib.check`) ve "etiketle karşılaştır" uyarısı zaten var. 60 yaş: tek ek düğme, mevcut akış.
**Test.** Bulunamayan barkod -> etiket -> kayıt; aynı barkod ikinci kez taranınca ağ çağrısı olmadan eşleşir (`allFoods().findIndex(f=>f.b===code)`, `04-sheets.js:162`).

## 5. Reddettiğim fikirler

- **Sesle kayıt (ses tanıma API'si):** `RECORD_AUDIO` izni + Play beyanı, Android tanıyıcı sesi buluta gönderebilir; "veri telefonda kalır" ilkesiyle çelişir. Öneri 2'deki klavye dikte yolu izinsiz.
- **Fotoğrafla yemek tanıma (bulut):** MFP, Lifesum, Zero, Lose It! sunuyor (sayfalar); gizlilik taahhüdümüzle çelişir (`docs/market/b-food-nutrition.md:17`). Cihaz içi model APK'yı büyütür ve porsiyon tahmini zayıf (Bitesnap: arama özeti, DOĞRULANAMADI).
- **Hafta sonu esnek bütçe:** Lose It! var (sayfa); eşitlik özelliği, Türkiye'ye özgü fark yok.
- **Oruçta yemek kaydından otomatik başlangıç:** Simple'da var (sayfa); Cronometer isteğe "New Fast" düğmesiyle yanıt vermiş (forum, sayfa). "Rakipte yok" denemez; yalnız Ramazan modunun (öneri 1) mutlak-saat altyapısı yapılırken ucuz eklenebilir.
- **Kendi bulut barkod veritabanı, sosyal akış:** yerel-veri ilkesi ve KVKK yükü.
- **Metabolik evre/otofaji göstergesi:** tıbbi iddia riski (Google Play Health Content politikası, sayfa).
- **Tuzlu yemek ertesi kilo sıçraması açıklaması:** arama sonuçları yalnız ticari bloglar; hakemli kaynak bulunamadı.
- **Glisemik indeks/Nutri-Score/katkı uyarısı:** Fooducate sayfasında katkı/alerjen geçmiyor; veri kaynağı ve lisans çözülmedi, kapsam dışı.

## 6. DOĞRULANAMADI listesi (öneriye dayanak yapılmadı)

1. Cronometer "Set Cooked Recipe Weight" özelliği (yalnız arama özeti; support.cronometer.com sayfası 403).
2. Fotoğraf uygulamalarında kalori aralığı gösterimi (GPT Food Cam, AskFork; arama özeti).
3. MacroFactor "yanlış kayıt 500 kcal -> harcamaya 25-30 kcal etki" iddiası (yardım makalesinin gövdesi yüklenmedi).
4. Zero'nun gün batımı saatini göstermesi (2017 blog, arama özeti); Zero/Fastic/HealthifyMe'de Ramazan modu varlığı veya yokluğu (resmi sayfa açılmadı).
5. 1 Ramazan 2027 = 8 Şubat 2027 (haber siteleri; Diyanet sayfası açılmadı).
6. Lifesum "Same as Yesterday" (yardım sayfası açılmadı).
7. Bitesnap ve FatSecret özellikleri (App Store 404/403; FatSecret'te barkod ve Türkiye veritabanı bilgisi sayfada yok).
8. Diyetkolik'in Türk yemeği kapsamı, barkod kapsamı ve Ramazan desteği (App Store sayfasında yok; "yok" kanıtı değil).
9. Rakiplerin yazı/sesle kayıtta çevrimdışı çalışıp çalışmadığı ve Türkçe ölçü bilip bilmediği (sayfalar yazmıyor).
10. OFF Türkiye kcal doluluk oranı %56-84 ve 11.464 ürün (`docs/nutrition-research.md`; yeniden ölçmedim).
11. İmsak/iftar hesabının Diyanet imsakiyesiyle dakika farkı (hesap yöntemi seçilmedi).
12. Android klavye dikte (mikrofon) düğmesinin hedef cihazlarda WebView metin kutusunda çalışması (telefonda test edilmedi).
