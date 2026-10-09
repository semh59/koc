# Pazar karşılaştırması B: Yemek ve besin (7 Ekim 2026)

Yöntem notu: Google Play sayfaları ve istatistik siteleri (chrome-stats, AppBrain) otomatik erişime 403/boş döndü. İndirme sayıları bu yüzden çoğunlukla "doğrulanamadı". "Kalite" bulguları büyük ölçüde rakip uygulamaların kendi blog yazılarına (Nutrola, Welling, Fitia) dayanır; bunlar tarafsız değildir, yalnız yön göstergesi sayılmalı.

## 1. Kalori ve yemek günlüğü
- **Kalite olarak en iyi:** Cronometer (doğrulanmış veri, mikro besin; bir derlemede kalori hatası ±%3,9, MyFitnessPal ±%18) ve MacroFactor (kilo trendine göre hedef güncelleme). Kaynak: [Welling derlemesi](https://www.welling.ai/articles/best-calorie-tracker-apps-expert-reviews-rankings), [Fitia 2026](https://fitia.app/learn/article/best-daily-calorie-tracking-apps-2026/). Hata yüzdeleri rakip yayınından, bağımsız doğrulanamadı. Cronometer ve MacroFactor ücretli katmanlıdır.
- **En çok tercih edilen:** MyFitnessPal (bir kaynakta Google Play'de 127 milyon indirme; [MixRank](https://mixrank.com/playstore/apps/com.myfitnesspal.android), Play sayfasından doğrulanamadı). YAZIO: "10 milyondan fazla" ([Tamindir](https://www.tamindir.com/indir/yazio/)); başka kaynakta 50-80 milyon, tutarsız, doğrulanamadı. Türkiye'de: Diyetkolik "en çok kullanılan diyet platformu" (2020'de ~1,5 milyon kullanıcı; [akademik çalışma](https://uhra.herts.ac.uk/handle/2299/23265)), Play puanı 3,3 ([arama özeti](https://www.tamindir.com/indir/diyetkolikcom/amp/)); güncel indirme doğrulanamadı. İkisi de temel kullanımı ücretsiz, gelişmiş özellik ücretli.
- **NeoWell:** Yemek günlüğü, öğün, favori, şablon, "Benim besinlerim", kendi tarifim, makro ve mikro (lif/şeker/sodyum) var (www/index.html, www/modules/besin/recipeui.js). Yerleşik 818 kayıt (docs/besin-veri-arastirmasi.md), her birinde "USDA" ya da "tahmini" etiketi ve aralık gösterimi (docs/besin-arastirmasi.md). Ücretsiz, yerel. Adaptif hedef yok; fotoğrafla yemek tanıma yok (fotoğraf yalnız etiket/tahlil okur, www/modules/besin/ocrui.js).

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Doğrulanmış veri ve mikro besin | Cronometer | MFP (kısmen, kullanıcı girişli) | Kısmen (USDA ~45 besin, kalan tahmin) |
| Kilo trendine göre adaptif hedef | MacroFactor | Yok/kısmen | Kısmen (Trend ekranında haftalık hedef ÖNERİSİ, kullanıcı onaylar; otomatik uygulama yok) |
| Öğün şablonu, favori | Hepsi | Var | Var |
| Türk yemekleri | Diyetkolik (iddia) | Diyetkolik | Var (818 kayıt, ±%20-40 belirsizlik) |

- **Eksikler ve öneri:** (a) Tahmini Türk yemekleri için kaynak güveni: TürKomp izinli kullanımı araştır, Orta, S (hukuki yazışma). (b) Adaptif hedef önerisi, Düşük, M; yeme bozukluğu freniyle (algo.js güvenlik freni) uyumlu olmalı. Yapılmamalı: fotoğrafla bulut yemek tanıma (gizlilik beyanıyla ve "fotoğraf gönderilmez" taahhüdüyle çelişir), sosyal akış.

## 2. Barkod ve besin veritabanı
- **Kalite olarak en iyi:** Doğrulanmış verisiyle Cronometer; barkodda MyFitnessPal bir testte %96 doğru bulma ([Nutrola, 100 barkod testi](https://nutrola.app/en/blog/we-scanned-100-barcodes-in-8-calorie-apps-accuracy-results), rakip yayını, yöntem doğrulanamadı). Kapsam: MFP 19M+ kayıt (kalabalık kaynaklı), YAZIO 4M+, Open Food Facts 3,5M+ ([Nutrola](https://nutrola.app/en/blog/best-free-app-to-scan-barcodes-for-nutrition-2026)). Türk ürünlerinde karşılaştırma bulunamadı: doğrulanamadı.
- **En çok tercih edilen:** MyFitnessPal (yukarıdaki kaynaklar). Türkiye için barkodda lider: doğrulanamadı.
- **NeoWell:** Google ML Kit barkod (EAN/UPC), Open Food Facts API, bulunamazsa etiketi elle girme veya Koç'a sorma, eksik değerli ürün kaydedilmez (www/index.html:1080-1110). Etiket fotoğrafından okuma var (www/modules/besin/ocrui.js). OFF Türkiye: 11.464 ürün, kcal'i dolu oranı markaya göre %56-84 (docs/besin-arastirmasi.md, 1 Ekim 2026 ölçümü). Telefonda doğrulama bekliyor (docs/yapilacaklar.md:72, 105).

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Barkod tarama | MFP/Cronometer | MFP | Var (OFF kaynaklı) |
| Çevrimdışı barkod | Doğrulanamadı | Yok (çevrimiçi) | Yok (internet gerekir, hata mesajı var) |
| Bulunamazsa etiket OCR | Kısmen | Kısmen | Var |
| Türk ürün kapsamı | Doğrulanamadı | Doğrulanamadı | Kısmen (OFF %56-84) |

- **Eksikler ve öneri:** (a) Telefonda gerçek ürünle barkod testini kapat, Yüksek, S. (b) Bulunamayan barkodu OFF'a katkı olarak göndermek: Düşük, M; veri paylaşımı izin ister. Yapılmamalı: kendi bulut barkod veritabanı (yerel-veri ilkesi, KVKK yükü), ODbL şartını (kaynak göster) atlamak.

## 3. Tarif, haftalık menü ve alışveriş listesi
- **Kalite olarak en iyi:** Mealime (en akıcı alışveriş listesi), Eat This Much (en otomatik plan) ([Nutrola derlemesi](https://nutrola.app/tr/blog/best-recipe-apps-meal-prep-grocery-lists-2026), rakip yayını). Hepsi ağırlıklı ücretli. Bağımsız uzman karşılaştırması bulunamadı.
- **En çok tercih edilen:** Doğrulanamadı. Türkçe tarif yönünde Yemek.com, Nefis Yemek Tarifleri ve Tariflerim (menü + alışveriş listesi; [kaynak](https://mwm.ai/apps/tariflerim/6760238613)) bilinir; indirme sayıları doğrulanamadı.
- **NeoWell:** Kendi tarifim (gram, porsiyon başı makro, www/modules/besin/recipeui.js). Koç'tan 7 günlük menü (yapay zekâ, yalnız kullanıcının besinlerinden, hamilelik/yeme bozukluğu işaretinde reddeder) ve menüden alışveriş listesi (telefonda hesaplanır, paylaşılır) (www/modules/koc/coach.js:475-540, www/modules/koc/coachlib.js:164). Koç için kullanıcının kendi API anahtarı ve onay gerekir. Hazır tarif kitabı yok.

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Hazır tarif kütüphanesi | Mealime / Yemek.com | Doğrulanamadı | Yok |
| Kendi tarifini makroyla kaydetme | Cronometer, MFP | MFP | Var |
| Otomatik haftalık menü | Eat This Much | Doğrulanamadı | Var (cihazda kurallı, anahtarsız; Koç menüsü ayrıca) |
| Alışveriş listesi | Mealime | Doğrulanamadı | Var (menüden) |

- **Eksikler ve öneri:** (a) Koçsuz menü: yapıldı (www/modules/besin/menulocal.js; kullanıcının şablonlarından değil, yerleşik hazır öğünlerden). (b) Elle yazılan tarife kendi alışveriş listesi eklemek, Düşük, S. Yapılmamalı: telifli tarif metni kopyalamak; yüzlerce tarif içeriği (kapsam dışı, içerik şirketi işi).

## 4. Aralıklı oruç takibi
- **Kalite olarak en iyi:** Zero (en iyi ücretsiz katman, araştırma ilişkisi) ve Simple (davranış koçluğu, beslenme günlüğü); Fastic Avrupa'da güçlü ([Fortune](https://fortune.com/article/best-intermittent-fasting-apps), [Nutrola karşılaştırma](https://nutrola.app/en/blog/simple-vs-zero-vs-fastic-fasting-apps-2026)). Zero, Simple, Fastic ücretsiz katmanlı, gelişmiş içerik abonelik.
- **En çok tercih edilen:** Zero "15 milyon+ indirme" ([Appetiser](https://appetiser.com.au/blog/best-intermittent-fasting-app/), Play sayfasından doğrulanamadı). Türkiye'de lider: doğrulanamadı.
- **NeoWell:** Zamanlayıcı, planlar 14/16/18/20 saat, geçmiş, tıbbi uyarı onayı, güvenlik freni (yeme bozukluğu/hamilelik/ilaç), hatırlatma bildirimi, CSV dışa aktarma (www/modules/aliskanlik/habitui.js, www/modules/aliskanlik/habitlib.js, www/modules/veri/csvlib.js). Ücretsiz. Telefonda test bekliyor (docs/yapilacaklar.md:106).

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Zamanlayıcı ve planlar | Zero | Zero | Var |
| Metabolik evre göstergesi | Zero/Fastic | Zero | Yok |
| Hatırlatma | Hepsi | Hepsi | Var |
| Güvenlik uyarısı/engel | Kısmen | Kısmen | Var (güçlü) |
| Oruç + yemek günlüğü birlikte | Simple | Yok | Var (aynı uygulama) |

- **Eksikler ve öneri:** (a) Telefon testi, Yüksek, S. (b) 12:12 ve 5:2 planları, Düşük, S. Yapılmamalı: "yağ yakım/otofaji evresi" iddiaları (kanıtı zayıf, tıbbi iddia riski), 24 saat üstü oruç teşviki.
