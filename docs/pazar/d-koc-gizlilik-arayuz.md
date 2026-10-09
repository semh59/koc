# Pazar karşılaştırması D: Yapay zekâ Koç, gizlilik, entegrasyon, arayüz, fiyat, Türkiye

Tarih: 7 Ekim 2026. Yalnız araştırma; kod değişmedi. "Doğrulanamadı" = güvenilir kaynak bulunamadı. Not: bazı karşılaştırma blogları (nutrola, welling) rakip uygulama sahibi olduğundan doğruluk yüzdeleri tarafsız sayılmaz. Google Play sayfaları okunamadı; güncel indirme aralıkları bu yüzden çoğunlukla doğrulanamadı.

## 1. Yapay zekâ beslenme/spor koçu
- **Kalite olarak en iyi:** Tek kazanan yok. Fotoğraftan kalori için hızda Cal AI, veritabanı genişliğinde MyFitnessPal (20 milyon besin, 380+ restoran zinciri; ücretli). Cal AI'nin "%90 doğruluk" iddiası kaynaksız bulunmuş, karışık yemekte tüm uygulamalar yanılıyor ([eesel](https://www.eesel.ai/en/blog/cal-ai-pricing), [welling](https://www.welling.ai/articles/cal-ai-vs-myfitnesspal-2026)). Giyilebilirli koçta Google Health Koçu (Gemini, eski Fitbit uygulaması, 19 Mayıs 2026; [wareable](https://www.wareable.com/fitbit/fitbit-air-official-announcement-price-features-release-date)). Tarafsız puan/uzman testi bulunamadı.
- **En çok tercih edilen:** MyFitnessPal (şirket beyanı 280 milyon kullanıcı, doğrulanamadı; [stork](https://www.stork.ai/en/myfitnesspal)). Cal AI 15 milyon indirme, 40 milyon dolar+ gelir; Mart 2026'da MyFitnessPal satın aldı ([pulse2](https://pulse2.com/myfitnesspal-acquires-cal-ai-to-expand-ai-powered-nutrition-tracking-portfolio)). Türkiye: YAZIO 10M+ (tarih belirsiz), Diyetkolik, bidiyet (App Store Sağlık'ta ikinci; [tamindir](https://www.tamindir.com/liste/en-iyi-diyet-uygulamalari/)).
- **Diğerleri:** ChatGPT Health (Ocak 2026; Apple Health ve tıbbi kayıt bağlanır, eğitimde kullanılmaz; tıbbi kayıt yalnız ABD; AB/İngiltere/İsviçre dışında kalır; Türkiye'de durumu doğrulanamadı; [OpenAI](https://openai.com/index/introducing-chatgpt-health/)). Whoop koçunu 199 dolar/yıl üyeliğe katıyor ([trackervs](https://trackervs.com/pricing/whoop-pricing/)). Noom: davranış dersi + GLP-1 + fotoğraflı öğün, yıllık plan 17,42 dolar/ay ([bestguide](https://bestguide.com/review/noom/)).
- **NeoWell:** Koç var (`www/modules/coach/coach.js`): kullanıcının kendi anahtarı, 6 sağlayıcı + özel OpenAI uyumlu servis; Keystore; yalnız düğmeye basınca gider; kimlik maskeleme (`www/kernel/piilib.js`); ilaç satırı her istekte. Fotoğraftan yemek tanıma 1 Ekim'de iptal edildi (`docs/yol-haritasi.md:181`). Giyilebilir veri Koç'a girmiyor.

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Fotoğraftan kalori | Cal AI (ücretli) | MyFitnessPal Meal Scan (ücretli) | Yok (bilerek iptal) |
| Sohbet koçu | Google Health Koçu (Premium) | ChatGPT (genel) | Var (kendi anahtarınla) |
| Nabız/uyku verisiyle koç | Google Health, Whoop | Aynı | Yok |
| Göndermeden önce kimlik maskeleme | Bulunamadı | Bulunamadı | Var |
| Türkçe yemek verisi | Yerel uygulamalar | YAZIO | Kısmen (kendi besin listesi) |

- **Eksik/öneri:** (a) Koç'a Health Connect verisi (adım/uyku): orta, M, Health Connect'e bağlı. (b) Koç yanıt kalitesi için küçük sabit test seti: düşük, S. **Yapılmamalı:** fotoğraf tanıma (karar verildi); NeoWell'in kendi sunucusu ya da ortak anahtar (yerel-öncelik vaadini bozar).

## 2. Gizlilik, veri güvenliği, yedekleme
- **Kalite olarak en iyi:** Bağımsız genel sıralama yok. Mozilla incelemesinde (üreme sağlığı odaklı, 2022) 25 üründen 18'i uyarı aldı; Garmin, Fitbit, Apple Watch, Oura, Whoop almadı ([Mozilla](https://www.mozillafoundation.org/blog/in-post-roe-v-wade-era-mozilla-labels-18-of-25-popular-period-and-pregnancy-tracking-tech-with-privacy-not-included-warning/)). Yerel-öncelikli, ücretsiz: OpenNutriTracker (GPL, çevrimdışı; [brightcoding](https://www.blog.brightcoding.dev/2026/09/29/simonoppowaopennutritracker-open-source-calorie-tracker-with-barcode-scanning)), Chompass (hesapsız, analitiksiz, anahtar cihazda şifreli; [F-Droid](https://f-droid.org/packages/app.chompass/)). Bunların indirme sayısı doğrulanamadı.
- **En çok tercih edilen:** Bulutlu, hesaplı olanlar (MyFitnessPal, Google Health). Sektör olayları: FTC, sağlık verisini reklam/analitik SDK'larına veren uygulamaları cezalandırdı: Premom 200 bin dolar, GoodRx 1,5 milyon dolar, BetterHelp 7,8 milyon dolar ([Arnold & Porter](https://arnoldporter.com/en/perspectives/blogs/enforcement-edge/2023/06/ftc-settles-with-premom-app-developer), [Fierce Healthcare](https://www.fiercehealthcare.com/health-tech/ftc-finalizes-changes-data-privacy-rule-step-scrutiny-digital-health-apps)). 2026 olayı aranmadı/bulunamadı.
- **NeoWell:** Hesap, sunucu, reklam, analitik yok; yedek her zaman AES-GCM + PBKDF2 ile parolalı (`www/modules/data/backuplib.js`); kategori bazlı silme, "tüm verileri sil", CSV dışa aktarma; Data Safety ve Sağlık beyanı taslağı hazır (`docs/play-data-safety.md`). Politikada doldurulacak alanlar duruyor (ad, adres, URL, tarih; `docs/gizlilik-politikasi.md`). Bağımsız güvenlik incelemesi yok. Cihaz içi veritabanının ayrıca şifreli olup olmadığı bu araştırmada doğrulanmadı.

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Hesapsız, sunucusuz | OpenNutriTracker, Chompass | Hayır (hesap şart) | Var |
| Şifreli yedek | Bulunamadı | Bulut hesabı | Var (parola zorunlu) |
| Kategori bazlı silme | Hesap silme | Hesap silme | Var |
| Bağımsız güvenlik denetimi | Büyük firmalar | Büyük firmalar | Yok |
| Veri reklam SDK'sına gitmez | Yerel uygulamalar | Sorunlu örnekler var | Var (kodda başka ağ çağrısı yok) |

- **Eksik/öneri:** (a) Politika boşluklarını doldurmak ve yayın URL'si: yüksek, S (Semih kararı). (b) Cihaz içi veri şifrelemesinin durumunu netleştirmek: orta, S; gerekirse M. (c) Yedek hatırlatması: düşük, S. **Yapılmamalı:** bulut hesabı/senkron, analitik SDK.

## 3. Bildirim, widget, giyilebilir, sağlık platformu
- **Kalite olarak en iyi:** Google Health + Pixel Watch / Fitbit Air (99,99 dolar, ekransız, 7 gün pil, Gemini koç; [tbreak](https://tbreak.com/google-fitbit-air-100-screenless-tracker/)) ve Whoop. Android'de ortak kapı Health Connect: Android 14'ten beri sistemin parçası ([XDA](https://xda-developers.com/android-14-health-connect-built-in/)); Google Fit API'leri kapanıyor ([9to5Google](https://9to5google.com/2024/05/04/google-fit-api-shutdown/)).
- **En çok tercih edilen:** Samsung Health (2018'de 500M kurulum; [SamMobile](https://www.sammobile.com/2018/08/02/samsung-health-500-million-installs-google-play-store/)), Google Fit 100M+ ([PhoneArena](https://phonearena.com/news/working-out-google-fit-app-100-million-downloads-android_id134822)), Mi Fit/Zepp 50M+ (eski veri). Güncel Play sayıları doğrulanamadı. Türkiye'de Mi Band kullanıcısı olup olmadığı NeoWell belgelerinde açık soru (G1).
- **NeoWell:** Ana ekran widget'ı (`assets/android/NeoWidget.java`), hızlı kayıt, su bildirimi, tam saatli ilaç alarmı, kendi adım sensörü ve gece anlık görüntüsü var. Health Connect ve Wear OS yok (`docs/yapilacaklar.md:41`, karar bekliyor); yol haritasında D-Adım1 (S) ve D-Adım2 (L) planlı.

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Health Connect okuma | Samsung Health, Google Health | Aynı | Yok |
| Wear OS uygulaması | Google Health | Aynı | Yok (bilerek) |
| Ana ekran widget'ı | Doğrulanmadı | Doğrulanmadı | Var |
| İlaç/su tam saatli hatırlatma | Özel ilaç uygulamaları | Doğrulanmadı | Var |
| Mi Band/Zepp verisi | Mi Fitness/Zepp | Aynı | Yok |

- **Eksik/öneri:** Health Connect okuma (adım/uyku/nabız, çift sayım korumalı): yüksek, L (keşif S ile başla; önce G1 sorusunu yanıtla). Play'e koymadan önce Health Connect veri türü beyanı gerekir ([Android Developers](https://developer.android.com/health-and-fitness/health-connect/publish)). **Yapılmamalı:** Wear OS uygulaması (Health Connect yeter), Google Fit API.

## 4. Arayüz, erişilebilirlik, onboarding
- **Kalite olarak en iyi:** Tarafsız sıralama bulunamadı. Google kendi uygulamasının TalkBack desteğini yayımlıyor ([Google](https://support.google.com/fitbit/answer/14237214)); ölçüt: 48dp dokunma hedefi, anlamlı etiketler. Perfect Gym Go WCAG 2.2 AA uyguluyor ([örnek](https://help.perfectgym.com/hc/en-001/articles/39873851788689-WCAG-2-2-AA-in-Perfect-Gym-Go-How-It-Works)).
- **En çok tercih edilen:** MyFitnessPal, YAZIO (sayılar bölüm 1'de); ilk dakikada kişisel kalori hedefi veriyorlar (`docs/rekabet-arayuz.md:136`, kendi önceki analizimiz).
- **NeoWell:** Açık/koyu/sistem teması, `prefers-reduced-motion`, `color-scheme` (`www/index.html`); kodda yaklaşık 92 `aria-label`; kurulum sihirbazı (`www/modules/data/onboardui.js`, 18 yaş kontrolü); SVG ikon geçişi yapıldı (C5). Otomatik erişilebilirlik denetimi var (`e2e/access.spec.js`: axe WCAG 2.1 AA açık/koyu, 44 px hedef, %200 yazı ve 320 px taşma yok; alt menü büyük yazıda uzar). TalkBack ile gerçek cihaz testi ve büyük yazı testi `yapilacaklar.md`'de bekliyor. Yalnız Türkçe (`docs/yol-haritasi.md:195`).

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Karanlık tema | Hepsi | Hepsi | Var |
| Kişisel hedefli onboarding | MyFitnessPal, YAZIO | Aynı | Var (kurulum sihirbazı) |
| TalkBack doğrulaması | Google Health | Doğrulanamadı | Kısmen (etiket var, test kaydı yok) |
| Hareket azaltma / büyük yazı | Doğrulanmadı | Doğrulanmadı | Kısmen (hareket azaltma var) |
| Çok dil | Hepsi | Hepsi | Yok |

- **Eksik/öneri:** TalkBack + %200 yazı: kod tarafı yapıldı, cihaz testi bekliyor. 44 px hedef taraması e2e'de. İngilizce: düşük (önce Türkiye). **Yapılmamalı:** sosyal akış, rozet/oyunlaştırma.

## 5. Fiyat, iş modeli, Türkiye pazarı
- **Kalite olarak en iyi (değer):** Cal AI 9,99 dolar/ay veya 29,99 dolar/yıl ([eesel](https://www.eesel.ai/en/blog/cal-ai-pricing)); MyFitnessPal Premium 79,99 dolar/yıl, Premium+ 99,99 dolar/yıl (ikincil kaynak: [nutrola](https://nutrola.app/en/blog/is-myfitnesspal-still-good-2026) / [fitbudd](https://content.fitbudd.com/post/myfitnesspal-app-cost)); Google Health Premium 9,99 dolar/ay ([sensai](https://www.sensai.fit/blog/google-health-premium-fitbit-ai-coach-2026)); Whoop 199-359 dolar/yıl donanımla. Ücretsiz ve yerel: OpenNutriTracker, Chompass.
- **En çok tercih edilen model:** Freemium + abonelik (MyFitnessPal, YAZIO, Noom). Türkiye'de Play TL fiyatı düşük: YAZIO Pro yıllık 299 TL (2025, indirimli) ve 384 TL (Haziran 2026) ([mydealz](https://www.mydealz.de/deals/yazio-pro-jahresabo-fur-721eur-384-try-uber-turkei-vpn-weiterhin-moglich-2793760); fırsat sitesi, resmî liste değil). Google, Ağustos 2026'da Türkiye'de Google AI/depolama aboneliklerine %75'e kadar zam yaptı (uygulama abonelikleri için genel kural değil; [Oksijen](https://gazeteoksijen.com/bilim-ve-teknoloji/googledan-turkiyedeki-abonelik-ucretlerine-yuzde-75e-varan-zam-285498)). Türkiye'de ödeme isteği anketi bulunamadı: doğrulanamadı.
- **Mevzuat:** KVKK değişikliği (7499, yürürlük 1 Haziran 2024): 1 Eylül 2024'ten sonra yurt dışı aktarımda açık rıza yalnız arızi ve tekrarlanmayan durumlarda dayanak; yeterlilik kararı ya da uygun güvence aranıyor. Sağlık verisi özel nitelikli ([Erdem&Erdem](https://www.erdem-erdem.av.tr/bilgi-bankasi/kisisel-verilerin-korunmasi-kanununda-neler-degisti)). Play: Sağlık uygulaması beyanı ve Veri güvenliği formu zorunlu ([Android Developers](https://developer.android.com/health-and-fitness/health-connect/publish)). Hukuki yorum bana ait değil; hukukçuya sorulmalı.
- **NeoWell:** Ücretsiz, reklamsız, hesapsız (`docs/magaza-metni.md`); faturalama/abonelik kodu yok; tek maliyet kullanıcının sağlayıcı API ücreti (bazı sağlayıcılar ücretsiz katmanlı, OpenAI/Anthropic ücretli). Gelir modeli kararı yok. Play beyanları taslakta (`docs/play-izin-beyanlari.md`). Politika yurt dışı aktarımı açık rızaya dayandırıyor; hukukçu onayı `[DOLDURULACAK]` (`docs/gizlilik-politikasi.md` bölüm 4).

| Özellik | En iyi | En çok tercih edilen | NeoWell |
|---|---|---|---|
| Ücretsiz katman | OpenNutriTracker | MyFitnessPal (sınırlı) | Var (tamamı) |
| Abonelik | Cal AI 29,99 dolar/yıl | MyFitnessPal 79,99 dolar/yıl | Yok |
| Reklam | Yok (yerel uygulamalar) | Doğrulanmadı | Yok |
| TL fiyat | YAZIO ~300-400 TL/yıl | Aynı | Yok |
| Yurt dışı aktarım dayanağı net | Doğrulanmadı | Doğrulanmadı | Kısmen (taslak, açık rıza) |

- **Eksik/öneri:** (a) **Yurt dışı aktarım dayanağı:** Koç her kullanımda tekrarlanan aktarım; açık rıza "arızi" sayılmayabilir. Hukukçuya sorulacak (`docs/hukukcuya-sorular.md`): yüksek, S. (b) Veri sorumlusu, VERBİS ve yayın URL'sini doldurmak: yüksek, S. (c) Gelir modeli (bağış, tek seferlik destek ya da hiç): düşük, S; Semih kararı. **Yapılmamalı:** reklam, veri satışı, ortak API anahtarı (maliyet ve KVKK sorumluluğu NeoWell'e geçer).
