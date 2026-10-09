# Pazar karşılaştırması C: sağlık bölümleri (7 Ekim 2026)

Yöntem notu: Google Play sayfaları araçla okunamadı; indirme sayıları ikincil kaynaklardan ve tarihleri belirsiz. Doğrulanamayan her sayı işaretli. NeoWell durumu koddan (www/*.js, assets/android, docs/); telefonda denenmemiş maddeler docs/yapilacaklar.md içinde açık. Puanlar tek kaynaktan, kesin değil. Çoğu kaynak ticari blog veya firmanın kendi sayfası; bağımsız hakemli karşılaştırma yalnız belirtilen yerde var.

## 1. İlaç hatırlatma ve doz takibi
- **Kalite olarak en iyi:** Medisafe (ilaç etkileşimi veri tabanı en derin; 1 Ocak 2026'dan beri ücretsiz katman 2 ilaçla sınırlı, Premium 4,99 $/ay) ve MyTherapy (tamamen ücretsiz, doktora verilebilir günlük). Bir kalite analizinde MyTherapy 3,79/5, Medisafe 3,72/5. Kaynak: [Folio3](https://digitalhealth.folio3.com/blog/?p=15182), [Pillo (rakip uygulama, taraflı)](https://pillo.care/blog/medisafe-no-longer-free-best-free-alternatives), [kalite analizi](https://riull.ull.es/xmlui/handle/915/34816).
- **En çok tercih edilen:** Medisafe "13 milyon+ kişi" (firma iddiası, 2026; [medisafe.com](https://medisafe.com/download)). MyTherapy 10 milyon+ indirme, puan 4,54 ([AppBrain](https://www.appbrain.com/dev/MyTherapy/), tarih doğrulanamadı). Türkiye'de en çok kullanılan ilaç hatırlatıcı: doğrulanamadı. Resmî e-Nabız 78,5 milyon kullanıcı, reçete, ilaç ve tahlil görüntüler ([haber](https://www.istiklal.com.tr/saglik/e-nabiz-kullanicisi-9-milyona-ulasti-422050h), Haziran 2025 verisi olarak aktarılmış); alarm tipi hatırlatıcısı olduğu doğrulanamadı.
- **NeoWell:** www/modules/meds/medlib.js, medui.js, assets/android/MedWakeReceiver.java, Alarms.java. Saat, gün ve kür süresi; setAlarmClock ile tam zamanlı alarm; kilitli ekranı uyandıran alarm ekranı (tam ekran bildirim izni, SCREEN_BRIGHT wake lock); bildirimden Aldım/Atla; stok takibi (kutu, doz başı adet, düşük stok kartı); uyum yüzdesi; program geçmişi. 10 ve 20 dk tekrar docs/rekabet-ozellik.md'de yazılı. Telefon testi bekliyor (yapilacaklar.md). Etkileşim denetimi yok.

| Özellik | En iyi (Medisafe/MyTherapy) | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Saatli, ısrarlı alarm | var | var | var (test bekliyor) |
| Stok ve yenileme uyarısı | var (Medisafe) | var | var |
| Uyum raporu / doktora çıktı | var | var | kısmen (haftalık rapora giriyor; ilaca özel PDF doğrulanamadı) |
| İlaç etkileşimi | var (Medisafe) | var | yok (bilerek) |
| Aile/bakıcı paylaşımı | var (ücretli) | var | yok (yerel veri ilkesi) |
| Sınırsız ilaç, ücretsiz | MyTherapy evet | Medisafe hayır | var |

- **Eksikler ve öneri:** (a) Alarm bütçesi: tansiyon planı Android'in ~500 eşzamanlı alarm sınırını "doğrulanacak" diye bırakmış; ölçülmeli. Yüksek, S. (b) Gerçek telefonda (Xiaomi dahil) alarm ve ekran uyandırma testi. Yüksek, S. (c) İlaç uyum PDF'i doktora, mevcut PDF hattıyla. Orta, S. Yapılmayacak: etkileşim denetimi, doz önerisi (tıbbi cihaz sınırı, aşağıdaki mevzuat notu).

## 2. Tansiyon ve kan şekeri
- **Kalite olarak en iyi:** Şeker için mySugr (Roche; karbonhidrat ve bolus tahmini var, ama doz hesabı onu tıbbi cihaz alanına sokar) ve Glucose Buddy (ADA'dan olumlu not alan kayıt uygulaması). Tansiyon için MedM (çok sayıda cihaza bağlanır) ve SmartBP (klinisyen raporu). Kaynak: [Gluroo](https://gluroo.com/?p=2638), [Gitnux](https://gitnux.org/best/blood-pressure-tracking-software/), [MedM](https://www.medm.com/company/press/2026/best-blood-pressure-tracker-app-for-india-2026.html). Hepsi ticari blog; bağımsız karşılaştırma bulunamadı.
- **En çok tercih edilen:** Güvenilir indirme sayısı bulunamadı: doğrulanamadı. Türkiye'de en çok kullanılan: doğrulanamadı.
- **NeoWell:** www/modules/vitals/vitalslib.js, vitalsui.js, docs/tansiyon-seker-plani.md (aşama 1-4 uygulandı, telefonda denenmedi). İki ölçümlü seans (sabah/akşam, ESC ev protokolü), şekerde bağlam (açlık/tokluk vb.) ve bağlam başına hedef aralığı, hedefte %, SVG grafik, hatırlatma, doktor raporu PDF'i, bugün tarihli uç değerde 112 kutusu. Yok: mmol/L, Bluetooth cihaz, Health Connect, CGM, ekrandan OCR, HbA1c tahmini (bilerek).

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Elle kayıt + bağlam | var | doğrulanamadı | var |
| Cihazdan otomatik aktarım | var (MedM) | doğrulanamadı | yok |
| Grafik / hedef aralığı | var | doğrulanamadı | var |
| Doktor raporu PDF | var (SmartBP) | doğrulanamadı | var |
| Doz / karbonhidrat hesabı | var (mySugr) | doğrulanamadı | yok (bilerek) |
| mmol/L | var | doğrulanamadı | yok (TR'de mg/dL) |

- **Eksikler ve öneri:** Telefon testi, alarm sınırı ölçümü. Yüksek, S. Health Connect'ten tansiyon/şeker/kilo okuma. Orta, M. mmol/L (yapıldı, Ayarlar > Profil). Düşük, S. Yapılmayacak: doz/insülin önerisi, "kontrol altında" gibi yorum, GMI/HbA1c tahmini, cihaz ekranından ML Kit okuma (7 segment zayıf, plan "sonra" diyor).

## 3. Tahlil takibi ve okuma (PDF/OCR)
- **Kalite olarak en iyi:** Tüketici tarafında bağımsız kaynakla belirlenmiş bir "en iyi" bulunamadı. Wizey: PDF/fotoğrafı yapay zekâyla açıklıyor, 500+ test, ilk analiz ücretsiz (sonrası ücret yapısı doğrulanamadı); 51 bin+ kullanıcı, 700 bin+ analiz (firma iddiası). Veri işleme yeri doğrulanamadı. Kaynak: [App Store](https://apps.apple.com/us/app/-/id6744994210), [AlternativeTo](https://alternativeto.net/software/wizey/about).
- **En çok tercih edilen:** Pazar payı doğrulanamadı. Türkiye'de fiili standart e-Nabız (tahlil sonuçlarını gösterir; 78,5 milyon kullanıcı, [kaynak](https://www.istiklal.com.tr/saglik/e-nabiz-kullanicisi-9-milyona-ulasti-422050h)) ve laboratuvar/hastanelerin kendi uygulamaları.
- **NeoWell:** www/modules/labs/lablib.js, labui.js, ocrui.js, assets/android/OcrPlugin.java. pdf.js ile metin çıkarma; metin katmanı yoksa sayfa görüntüsü + ML Kit OCR (6 sayfa sınırı, cihazda, internetsiz); parolalı PDF; laboratuvarın kendi referans aralığı; (test, birim) başına ayrı grafik; tahlil PDF'i; fotoğraftan okuma. Yorum/tanı yok. Yalnız sonuç satırı saklanır, PDF metni ve kimlik bilgisi saklanmaz.

| Özellik | En iyi (Wizey) | En çok tercih edilen (e-Nabız) | NeoWell |
|---|---|---|---|
| PDF içe aktarma | var | otomatik (kurum verisi) | var |
| Taranmış belge / fotoğraf OCR | var | yok | var (cihazda) |
| Zaman içinde grafik | doğrulanamadı | doğrulanamadı | var |
| Yapay zekâ yorumu | var | yok | yok (bilerek) |
| Veri yalnız cihazda | doğrulanamadı | hayır (devlet sistemi) | var |

- **Eksikler ve öneri:** Türkçe laboratuvar biçimleri için ayrıştırıcı kapsamı gerçek raporlarla ölçülmeli (bilinmeyen adda birim/aralık yoksa satır atılıyor, lablib.js). Yüksek, M. e-Nabız PDF/çıktı biçimi desteği ayrıca denenmeli. Orta, S. Yapılmayacak: yapay zekâ yorumu, tanı (tıbbi cihaz riski; rekabet-ozellik.md aynı kararı yazıyor).

## 4. Adet döngüsü takibi
- **Kalite olarak en iyi:** Clue, Obstetrics & Gynecology çalışmasında en iyi ücretsiz uygulama (13/15) ve 1.000+ uygulamadan yalnız 20'si doğruluk ölçütünü karşıladı ([Clue sayfası, kendi anlatımı](https://helloclue.com/fr/articles/about-clue/clue-rated-top-menstrual-tracking-app)). Doğum kontrolü iddiasıyla FDA onaylı tek uygulama Natural Cycles (ücretli; 27 Temmuz 2026'da altıncı onay; etkinlik %98 doğru, %93 tipik kullanım, firma verisi; [FemTech Insider](https://femtechinsider.com/natural-cycles-receives-sixth-fda-clearance-for-ai-powered-fertility-algorithm/)).
- **En çok tercih edilen:** Flo: Google Play 50 milyon+ indirme, 4,8 puan; Clue 10 milyon+, 4,7 ([Flo newsroom aktarımı](https://flo.health/newsroom/most-installed-app), tarih doğrulanamadı). Flo aylık aktif kullanıcı 70 milyon+ (Kasım 2024); 2026'da "80 milyon" iddiası tek ikincil kaynakta, doğrulanamadı ([Wikipedia](https://en.wikipedia.org/wiki/Flo_(app))). Türkiye'de en çok kullanılan: doğrulanamadı.
- **Doğruluk:** Yalnız %13 kadın 14. gün yumurtlar, %13-16'sı 28 günlük döngüye sahip, yarıdan fazlasında döngü ayda 5+ gün oynar; uygulamalarla doğum kontrolünde başarısızlık %7,2-8,3 ([Sydney Üniv. 2024](https://sydney.edu.au/news-opinion/news/2024/10/02/can-you-trust-your-period-tracking-app-.html)). Düzensiz döngülerde tahmin zayıf (Washington Üniv. çalışması, [STAT](https://www.statnews.com/?p=241107)).
- **Gizlilik olayları:** FTC, Flo'nun sağlık verisini Facebook, Google, AppsFlyer, Flurry ile paylaşırken gizli tuttuğunu söylemesini suçladı; 2021 uzlaşması ([Healthcare IT Today](https://www.healthcareittoday.com/2021/01/14/ftc-settlement-with-fertility-tracking-app-maker-flo-health-over-data-disclosure-allegations/)). 4 Ağustos 2025: San Francisco federal jürisi Meta'yı Flo verisini toplayarak California gizlilik yasasını (CIPA) ihlalden sorumlu buldu, ihlal başına 5.000 $ ([Bloomberg Law](https://news.bloomberglaw.com/litigation/metas-health-privacy-trial-loss-spotlights-power-of-wiretapping)). AB tarafındaki olaylar bu araştırmada doğrulanamadı.
- **NeoWell:** www/modules/cycle/cyclelib.js, cycleui.js. Yerel, gizli, varsayılan kapalı. Başlangıç/bitiş, akış, belirti; son 6 döngünün ortalaması ve sapmasıyla tahmin penceresi (en az 2 döngü), düzensizse işaret; takvim yöntemiyle yumurtlama ve doğurgan pencere (bilgi amaçlı); hatırlatma. Koç'a, bildirim metnine, widget'a, CSV'ye girmez; yalnız parolalı yedekte (gizlilik-politikasi.md). Tahmin doğruluğu ölçülmemiş.

| Özellik | En iyi (Clue / Natural Cycles) | En çok tercih edilen (Flo) | NeoWell |
|---|---|---|---|
| Dönem günlüğü + belirti | var | var | var |
| Tahmin + düzensizlik uyarısı | var | var | kısmen (basit ortalama) |
| Doğum kontrolü (FDA) | Natural Cycles | yok | yok (bilerek) |
| Sıcaklık/LH ile yumurtlama | var | kısmen | yok |
| Hesapsız, veri yalnız cihazda | kısmen | hayır | var |

- **Eksikler ve öneri:** Tahminin geçmiş veriyle geriye dönük testi (ortalama kaç gün sapıyor). Orta, S. Doktora dönem özeti PDF'i. Düşük, S. Gebelik/menopoz modu. Düşük, M. Yapılmayacak: "güvenli gün" veya korunma dili, tıbbi yorum, veriyi bulut/analitik SDK'ya göndermek (rakiplerin yaşadığı dava konusu tam bu). Bildirimde döngü ifadesi yazmamak doğru.

## 5. Uyku ve ruh hali
- **Kalite olarak en iyi:** Uyku için Sleep Cycle (ses analizi, akıllı alarm, 2024'te iki ödül, firma anlatımı). Ruh hali için Daylio (basit, emoji) ve Bearable (mood, uyku, ilaç, belirti korelasyonu). Kaynak: [Bearable karşılaştırması](https://bearable.app/?p=3082) (Bearable'ın kendi blogu, taraflı), [Choosing Therapy](https://www.choosingtherapy.com/?p=17773). Sleep Cycle ve Bearable kısmen ücretli (fiyat doğrulanamadı).
- **En çok tercih edilen:** Sleep Cycle Android'de 19 milyon indirme, 4,34 puan; firma toplam "40 milyon+" diyor ([AppBrain](https://www.appbrain.com/app/com.northcube.sleepcycle), tarih belirsiz). Daylio indirme sayısı doğrulanamadı. Türkiye'de en çok kullanılan: doğrulanamadı; cihaz uygulamaları (Samsung Health, Mi Fitness) sensörle uyku verir (docs/rekabet-ozellik.md).
- **NeoWell:** www/modules/habits/habitlib.js (cleanSleep, cleanMood, sleepMin), habitui.js, insightlib.js. Uyku elle (yatış/kalkış saati), ruh hali emoji + not, haftalık içgörüde uyku ortalaması. Sensör, ses analizi, Health Connect yok.

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Elle uyku / ruh hali | var | var | var |
| Otomatik uyku (sensör/ses) | var | var | yok |
| Korelasyon (uyku-ruh-ilaç) | var (Bearable) | doğrulanamadı | kısmen (uyku özeti) |
| Akıllı alarm | var (Sleep Cycle) | var | yok |

- **Eksikler ve öneri:** Health Connect'ten uyku okuma (saat/bant kullananları kazandırır). Orta, M. Uyku-ruh hali-spor/yemek birlikte görülme özeti, tanısız dil: YAPILDI (Trend > Bağlantılar, `www/modules/insights/linkslib.js`; uyku ↔ ertesi gün ruh hali, adım ↔ ruh hali, kalori ↔ kilo trendi; en az 14 çift gün; Koç'a gitmez). Yapılmayacak: depresyon/uyku bozukluğu skoru, anksiyete taraması (tıbbi cihaz alanı), ruh hali notunu Koç'a göndermek.

## Mevzuat ve politika notu (ortak)
- **Play:** Sağlık uygulaması beyanı zorunlu; tıbbi cihaz değilse "tıbbi cihaz değildir, tanı koymaz, hekime danışın" türü uyarı gerekir; sağlık verisi için gizlilik politikası şart ([Play Health Content](https://support.google.com/googleplay/android-developer/answer/16679511?hl=en)). Mevcut taslaklar: docs/play-data-safety.md, play-izin-beyanlari.md.
- **Türkiye:** Yazılımın tıbbi cihaz sayılması üreticinin belirttiği kullanım amacına ve reklam ifadelerine bağlı; TİTCK MDCG 2019-11 rehberini Türkçe yayımladı ([Hukukçu Alemi](https://hukukcularevi.com/tibbi-cihaz-yazilimlari-ne-zaman-tibbi-cihaz-sayilir/)). Sağlık verisi KVKK'da özel nitelikli veridir; başkalarına dağıtımda aydınlatma ve açık rıza metni şart (tansiyon planında da not). KVKK madde numarası bu araştırmada doğrulanamadı. Bu belge hukuki görüş değildir; sorular docs/hukukcuya-sorular.md içinde.
