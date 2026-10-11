# Hukuk ekibi: AB hukuku (Play'de AB ülkelerine dağıtım)

Tarih: 2026-10-10. Konu: NeoWell "Rehber" (BYOK yapay zekâ sohbeti) ve sağlık günlüğü; AB'de dağıtılırsa uygulanabilecek kurallar.

**Bu belge hukuki tavsiye değildir; mevzuat analizidir.** Avukat/uzman görüşü gereken noktalar bölüm 5'te toplanmıştır. Uyum sütunu bir hukuki sonuç değil, metin ile kod arasındaki karşılaştırmadır.

## 1. Kapsam ve kaynaklar

Hepsi 2026-10-10 tarihinde açıldı. EUR-Lex metinleri resmi URL'den tam metin indirilip yerelde arandı (WebFetch sayfa başına yalnız ilk 100 bin karakteri okuduğu için); alıntılar bu yerel kopyalardan.

| # | Kaynak | URL | Sürüm / tarih |
|---|---|---|---|
| K1 | AI Act, Regulation (EU) 2024/1689 (OJ L, 12.7.2024) | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202401689 | Yayımlanan özgün metin |
| K2 | Digital Omnibus on AI, Regulation (EU) 2026/1744 (OJ 24.7.2026, 8 Temmuz 2026 tarihli) | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202601744 | Yürürlük: yayımdan sonraki 3. gün (m.4), yani 27.7.2026; AI Office sayfası da "Entered into force on 27 July 2026" diyor |
| K3 | Komisyon, m.50 Rehberi, C(2026) 5054 final, 20.7.2026 | https://ec.europa.eu/newsroom/dae/redirection/document/131215 (sayfa: https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems) | 51 sayfa, bağlayıcı değil |
| K4 | Komisyon, işaretleme/etiketleme Uygulama Kuralları sayfası | https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content | Son hali 10.6.2026; sayfa 31.7.2026 güncel |
| K5 | GDPR, Regulation (EU) 2016/679 | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679 | OJ L 119, 4.5.2016 |
| K6 | EDPB Guidelines 07/2020 (controller/processor) v2.1 | https://www.edpb.europa.eu/system/files/documents/2023-10/EDPB_guidelines_202007_controllerprocessor_final_en.pdf | 7.7.2021 / düzeltme 20.9.2022 |
| K7 | EDPB Guidelines 05/2020 (consent) | https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf | 4.5.2020 |
| K8 | EDPB Guidelines 2/2018 (m.49 istisnaları) | https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_2_2018_derogations_en.pdf | 25.5.2018 |
| K9 | EDPB Guidelines 05/2021 (m.3 ve Bölüm V) v2.0 | https://www.edpb.europa.eu/system/files/documents/2023-02/edpb_guidelines_05-2021_interplay_between_the_application_of_art3-chapter_v_of_the_gdpr_v2_en_0.pdf | 14.2.2023 |
| K10 | Komisyon Uygulama Kararı (AB) 2023/1795 (AB-ABD DPF) | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32023D1795 | OJ 20.9.2023, yürürlükte |
| K11 | Genel Mahkeme, T-553/23 Latombe/Komisyon | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:62023TJ0553 | 3.9.2025 |
| K12 | Komisyon yeterlilik kararları listesi | https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en | 2026-10-10 |
| K13 | MDR, Regulation (EU) 2017/745, konsolide metin | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02017R0745-20250110 | Konsolide 10.01.2025 (en yeni olduğu DOĞRULANAMADI, bkz. bölüm 6) |
| K14 | MDCG 2019-11 rev.1 (yazılımın nitelendirilmesi) | https://health.ec.europa.eu/document/download/b45335c5-1679-4c71-a91c-fc7a4d37f12b_en?filename=mdcg_2019_11_en.pdf | Haziran 2025 rev.1 |
| K15 | MDCG 2025-6 / AIB 2025-1 (MDR ve AI Act ilişkisi) | https://health.ec.europa.eu/document/download/b78a17d7-e3cd-4943-851d-e02a2f22bbb4_en?filename=mdcg_2025-6_en.pdf | Haziran 2025 |
| K16 | ePrivacy Direktifi 2002/58/EC konsolide | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219 | 19.12.2009 konsolide |
| K17 | UCPD 2005/29/EC konsolide | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02005L0029-20220528 | 28.5.2022 konsolide |
| K18 | Dijital İçerik Direktifi (AB) 2019/770 | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32019L0770 | OJ 22.5.2019 |
| K19 | Gemini API Ek Şartları | https://ai.google.dev/gemini-api/terms | "Last updated 2026-04-28" |
| K20 | Teklifler: Digital Omnibus (veri/GDPR) COM(2025) 837; MDR/IVDR revizyonu COM(2025) 1023 | https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:52025PC0837 ve ...:52025PC1023 | 19.11.2025 ve 16.12.2025; teklif metni |

İkincil kaynak (yalnız ipucu, işaretli): hukuk büroları ve haber siteleri; hiçbir sonuç yalnız onlara dayandırılmadı.

Not: EUR-Lex'in "konsolide AI Act (2026/1744 işlenmiş)" sayfası bu oturumda açılamadı (bot koruması, HTTP 202, boş gövde). AI Act için özgün metin (K1) ile değiştiren tüzük (K2) birlikte okundu; bu yüzden aşağıdaki "güncel metin" K1 + K2'nin birleşimidir, resmi konsolide sürüm değildir.

## 2. Gereklilik tablosu

Uyum: UYUMLU / KISMEN / EKSİK / BELİRSİZ. Kanıtlar `dosya:satır`.

| # | Gereklilik | Kaynak / madde | Bizim durumumuz | Uyum |
|---|---|---|---|---|
| A1 | Yasak uygulama olmamak | AI Act m.5(1)(a)(b); 2.2.2025'ten beri uygulanır (m.113 ve K2) | Rehber manipülasyon, kırılganlık sömürüsü, sosyal puanlama yapmıyor. Yeme bozukluğu ve 18 yaş altı için kısıt kuralları var: `coachlib.js:278,281,287`; 18 altı kapalı: `01-core.js:90`, `onboardui.js:40` | UYUMLU |
| A2 | Yüksek riskli olmamak | AI Act m.6(1)(2), Ek III; m.113(c) (K2: Ek III için 2.12.2027, Ek I için 2.8.2028) | Ek III'te sağlık/beslenme koçluğu kalemi yok (Ek III sağlıkta yalnız acil çağrı/triyaj sistemleri, sigorta fiyatlama, kamu yardımı uygunluğu). m.6(1) yolu yalnız uygulama MDR kapsamında tıbbi cihaz yazılımı olursa açılır (bkz. C1, D) | UYUMLU (koşullu) |
| A3 | Kullanıcıya yapay zekâ ile konuştuğunu bildirmek | m.50(1), m.50(5) | Hoş geldin ekranında görünür uyarı "Rehber yapay zekâ kullanır ve yanılabilir": `onboardui.js:4,70`. Rehber sekmesinde "yapay zekâ" ifadesi yalnız kapalı "Verin nereye gider?" akordeonunda: `coach.js:723-724`; sohbet balonlarında etiket yok, "Rehber yazıyor": `coach.js:733-742`; model "yapay zekâyım" demeye yönlendirilmiyor: `coachlib.js:273` | KISMEN |
| A4 | Üretilen metnin makine okunur işaretlenmesi | m.50(2); K2 ile m.111'e eklenen 4. fıkra (2.8.2026 öncesi piyasadaki sistemlere 2.12.2026) | Uygulamada hiçbir işaretleme yok (aranan: `metadata`, `watermark`, `ai:` alanı yok; sohbet kayıtları düz metin). Üst model sağlayıcılarının metin işareti taşıyıp taşımadığı bilinmiyor | BELİRSİZ |
| A5 | AI okuryazarlığı | m.4 (K2 ile değişti) | Tek geliştirici; "personel" yok. Kullanıcıya uyarı metni var (`onboardui.js:4`) | UYUMLU (yük fiilen hafif) |
| A6 | Genel amaçlı model sağlayıcısı yükümlülükleri | m.53 vd. | Bizde yok: modeli NVIDIA, Groq, OpenRouter, Google, OpenAI, Anthropic sağlıyor | Geçerli değil |
| B1 | GDPR kapsamı ve rol | GDPR m.3(2), m.4(7), res.18, res.23; K6 §56 | Geliştirici veri almıyor, sunucu yok. Yine de gönderimin kapsamını, alıcıları ve zamanı kod belirliyor (`coach.js:684-687`) | BELİRSİZ |
| B2 | Sağlık verisi için açık rıza | m.9(1), 9(2)(a), m.4(11), m.7, res.42 | Açık rıza düğmesi, sürüm, tarih, sağlayıcı kümesi, veri türü bazında kapatma, geri alma, rızasız tam çalışma: `coach.js:675-690,714-717,731`; `privacyui.js:40-43`. Eksik: veri sorumlusu kimliği (`privacy-policy.md:8-11` boş), sağlayıcının ücretsiz katmanda içeriği eğitim/insan incelemesi için kullanabileceği bilgisi, AB'de yeterlilik/güvence yokluğu riski | KISMEN |
| B3 | Bilgilendirme (m.13) | m.13(1)(a)(c)(e)(f), 13(2)(b)(d) | Politika KVKK md.10-11'e göre yazılmış: `privacy-policy.md:7,65`. GDPR'ın istediği şikâyet hakkı, erişim/taşınabilirlik/itiraz, hukuki dayanağın madde olarak adı, yeterlilik kararı var/yok ifadesi yok. Kimlik/iletişim alanları boş (`:8-11`) | EKSİK |
| B4 | Üçüncü ülkeye aktarım | m.44-49; K8, K9, K10 | Önce "aktarım var mı" sorusu (bkz. 3.3). Varsa m.49(1)(a) için "yeterlilik ve güvence yokluğundan doğan riskler" bildirilmeli; rıza metni yalnız "yurt dışına aktarımdır" diyor: `coach.js:687` | EKSİK (aktarım varsa) / BELİRSİZ |
| B5 | Otomatik karar (m.22) | m.22(1) | Rehber karar vermiyor; log, besin ve kalori önerisi kartları "pending" bekler, kullanıcı onaylar: `coach.js:402-410`, `coachlib.js:277` | UYUMLU |
| B6 | Çocuk rızası (m.8) | m.8(1)(2) | 18 altı kurulum ilerlemez, Rehber rızası düşer: `onboardui.js:40,72`, `01-core.js:90`, `coach.js:682`. Yaş beyandır, doğrulama yok | UYUMLU (beyan düzeyi) |
| B7 | DPIA (m.35) | m.35(1)(3)(b) | Belge yok | BELİRSİZ |
| B8 | AB temsilcisi / işlem kaydı | m.27(1)(2)(a); m.30(5) | Geliştirici denetleyici sayılırsa, istisnalar sağlık verisi ve "occasional" olmama nedeniyle zor | BELİRSİZ |
| B9 | Tasarımda gizlilik | m.25(1)(2) | Yerel depolama, veri türü anahtarları, PII maskeleme, önizleme: `piilib.js`, `privacyui.js:41`, `coach.js:169` | UYUMLU |
| B10 | Sağlayıcı şartları (AB) | K19 | Gemini şartı "makes API Clients available to users in the EEA... only Paid Services" ve "Do not submit sensitive... personal information to the Unpaid Services". Uygulama ücretsiz anahtarı öneriyor: `coach-provider-analysis.md:78-81` | BELİRSİZ |
| C1 | Tıbbi cihaz niteliği | MDR m.2(1), m.2(12); MDCG 2019-11 | Beyan edilen amaç: kayıt/günlük, tanı ve tedavi yok (`privacy-policy.md:76`, `play-data-safety.md:41-44`). Tartışmalı özellikler bölüm 3.6'da | KISMEN |
| C2 | Yanıltıcı iddia yasağı | MDR m.7; UCPD m.6, Ek I md.17 | Mağaza metni kuralı: tedavi/tanı iddiası yok (`play-data-safety.md:46-47`) | UYUMLU |
| D1 | Cihaz depolamasına erişim (ePrivacy) | 2002/58 m.5(3) | Yerel depolama kullanıcının istediği hizmet için zorunlu; Google ML Kit telemetri kapsamı belirsiz (`privacy-policy.md:42`) | UYUMLU / BELİRSİZ (ML Kit) |
| D2 | Dijital İçerik Direktifi | 2019/770 m.3(1) | Fiyat ve veri durumuna bağlı (3.7) | BELİRSİZ |

Sayım: EKSİK 2 (B3, B4), KISMEN 3 (A3, B2, C1), BELİRSİZ 7 (A4, B1, B7, B8, B10, D2, D1 ML Kit kısmı); geri kalanı UYUMLU veya geçerli değil.

## 3. Detaylı analiz

### 3.1 AI Act: roller, kapsam ve takvim

**Yürürlük takvimi (K1 m.113, K2 Art.1 nokta 40):**

| Hüküm | Tarih | Kaynak |
|---|---|---|
| Bölüm I-II (yasaklar m.5, AI okuryazarlığı m.4) | 2.2.2025 | K1 m.113(a) |
| Yeni yasak m.5(1)(ba)(bb), (1a)(1b) (çıplaklaştırma/CSAM) | 2.12.2026 | K2 m.113(a) yeni metni |
| Genel uygulama, m.50 dahil | 2.8.2026 | K1 m.113 "It shall apply from 2 August 2026" |
| m.50(2) işaretleme, 2.8.2026 öncesi piyasadaki üretici sistemler için | 2.12.2026 | K2 m.111(4) |
| Yüksek risk, Ek III (m.6(2)) | 2.12.2027 | K2 m.113(c)(i) |
| Yüksek risk, Ek I ürünler (m.6(1)) | 2.8.2028 | K2 m.113(c)(ii) |
| Omnibus yürürlük | 27.7.2026 | K2 m.4 |

Bugün (10.10.2026) m.50 uygulanıyor. NeoWell henüz Play'de AB'de yok; 2.12.2026 geçiş yalnız 2.8.2026 öncesi piyasaya sürülmüş sistemlere tanınır, yani NeoWell için m.50(2) AB dağıtımının ilk gününden geçerli olur (karşı yorum: K2 res.96 "providers who have already placed their systems on the market before 2 August 2026" der; yeni sistem bu istisnanın dışındadır).

**Digital Omnibus ne değiştirdi (birincil, K2):**
- m.4 (okuryazarlık) tümüyle değişti: "shall take measures to support the development of AI literacy"; ek cümle: "This obligation does not require providers or deployers to guarantee any specific level of AI literacy of any individual." Yani sonuç yükümlülüğü, çaba yükümlülüğüne döndü.
- Yüksek riskli yükümlülükler ertelendi (tablo).
- m.50(1) ve m.50(2) metni DEĞİŞMEDİ; yalnız m.50(7) (uygulama kuralları değerlendirmesi) ve m.111'e geçiş fıkrası eklendi.
- Bizim açımızdan "Omnibus ertelemesi" m.50'yi ertelemiyor. Erteleme yalnız yüksek riskli sistemleri kapsar.

**Roller (BYOK):**
- m.3(3) "provider": AI sistemi geliştiren veya geliştirten ve "under its own name or trademark" piyasaya süren/hizmete alan kişi, "whether for payment or free of charge". K3 §(10)-(11) aynı mantıkla: bir uygulamayı kendi adıyla sunan, "regardless of whether the AI system is provided for free", sağlayıcıdır. NeoWell/Rehber büyük olasılıkla m.3(3) anlamında AI sistemi sağlayıcısıdır (downstream provider: m.3(68) "integrates an AI model... provided by another entity").
- NVIDIA, Groq, OpenRouter, Google, OpenAI, Anthropic: model sağlayıcısı (m.53 vd.). m.50 modele değil sisteme uygulanır (K3 §(27)).
- Kullanıcı "deployer" değil: m.3(4) "except where the AI system is used in the course of a personal non-professional activity"; m.2(10); K3 §(19)-(20): bireyin kişisel kullanımı kapsam dışıdır, "The system as such remains within the scope... as regards the obligations of providers". Sonuç: m.50(1)(2) sağlayıcı yükümlülüğüdür ve geliştiriciye düşer; kullanıcıya devredilemez.
- Karşı görüş 1 (ticari faaliyet): m.3(10) "making available on the market" tanımı "in the course of a commercial activity, whether in return for payment or free of charge" der. Ücretsiz, reklamsız bir hobi uygulamasının "ticari faaliyet" sayılıp sayılmayacağı yoruma açık. Play dağıtımı + mağaza hesabı + olası ücret bunu "ticari" yöne çeker. Kesin değil.
- Karşı görüş 2 (BYOK): Uygulamanın kendisi model sağlamıyor; "AI sistemi" tanımı (m.3(1)) çıkarım yapan makine tabanlı sistemi arar. Rehber'in sistem istemi, bağlam derleme ve JSON ayrıştırma katmanı ile birlikte bir sistem oluşturduğu, yalnız API istemcisi olmadığı sonucu daha güçlü.
- Açık kaynak istisnası (m.2(12)) m.50 için işlemez: "unless... an AI system that falls under Article 5 or 50".

**Risk sınıfı:** Yasak (m.5) değil. Ek III'te Rehber'e uyan kalem yok. m.6(1) için iki koşul gerekir: Ek I ürünüyle ilgili olmak ve üçüncü taraf uygunluk değerlendirmesine tabi olmak. MDR Ek I Bölüm A'dadır. MDCG 2025-6 tablosu: MDR sınıf IIa/IIb/III yazılım "Yes/Yes" (yüksek risk). Bu nedenle: Rehber MDR anlamında cihaz yazılımı olursa (3.6), Kural 11 en az sınıf IIa verir (MDR Ek VIII 6.3), bu da üçüncü taraf değerlendirmesi ve dolayısıyla 2.8.2028'den itibaren AI Act yüksek risk anlamına gelir. Yani MDR'den kaçınmak, AI Act yüksek riskinden de kaçınmaktır. Duygu tanıma (m.3(39)) değil: biyometrik veriye dayanmıyor, ruh hali kullanıcı beyanı.

**Sınırlı risk / şeffaflık (m.50):**
- 50(1): sağlayıcı, kullanıcıların etkileştiklerinin AI sistemi olduğunu bilmesini sağlayacak şekilde tasarlar; istisna: "obvious from the point of view of a natural person who is reasonably well-informed, observant and circumspect". K3 §(42)-(45): istisna "interpreted restrictively", "limited to cases where there is almost no doubt"; genel kamuya açık, kırılgan kişilere de ulaşabilen sistemlerde kullanılamaz. K3 §(37): "Prominent, plain-language labels... persistent badges or labels visible throughout the interaction", "near the input/output field". K3 §(40): tek bildirim çoğu durumda yeter, ancak "health advice" gibi yanıltma riski yüksek bağlamlarda "periodic reminders" gerekebilir; sistem kendi doğası sorulduğunda da bildirimde bulunacak şekilde tasarlanmalı.
- Karşı görüş: BYOK kullanıcısı kendi API anahtarını bir yapay zekâ sağlayıcısından alıp giriyor ve kurulum ekranları "yapay zekâ sağlayıcısı" diyor (`coach.js:768`). Bu, "makul ölçüde bilgili" kullanıcı için yapay zekâ olduğunun açık olduğu savını güçlendirir. Ama K3'ün "almost no doubt" ölçütü ve tüketici kitlesi karşısında bu sav tek başına güvenli değil. Kod kanıtı: durum KISMEN.
- 50(2): "Providers of AI systems, including general-purpose AI systems, generating synthetic audio, image, video or text content, shall ensure that the outputs... are marked in a machine-readable format and detectable". İstisnalar: standart düzenleme yardımı; girdiyi anlamca değiştirmeyen sistemler; ceza hukuku. Rehber'in sohbet yanıtı yeni metin üretiyor, istisnalara girmiyor. K3 §(68): "short sequence of numbers, symbols or letters (e.g. single words, ... UI labels)" kapsam dışıdır; yaklaşık 90 kelimelik yanıt (`coachlib.js:273`) kısa dizi değil, cümle ve paragraf. K3 §(74): sağlayıcı "may rely on the marking solution implemented by an upstream model provider... Such reliance is without prejudice to the responsibility of the provider of the AI system". K3 §(86)-(88): teknik olarak mümkün olmadığında ve kapalı ortamda esnek çözümler dar tanımlanmış. Rehber metni uygulama içinde kalıyor (arama: `S.chat` yalnız `coach.js`, `01-core.js`, `coach/index.js`'te geçiyor; `csvlib.js` içinde `chat` yok; yalnız parolalı yedekte), yani yayımlanmıyor. Bu yönde bir "kapalı ortam" savı kurulabilir ama K3 §(86) sadece araç içi gibi, çıktıyı dışarı çıkarmayan fiziksel ürünleri örnekliyor; mobil uygulamaya genişletilebilir mi belirsiz. Sonuç: BELİRSİZ; kesin EKSİK diyemiyorum, kesin UYUMLU da değil.
- 50(4) ikinci fıkra (kamu yararı konulu yayımlanan metin): uygulama içeriği yayımlamıyor, geçerli değil.
- 50(3) (duygu tanıma/biyometrik kategorilendirme bildirimi): geçerli değil.
- Uygulama Kuralları (K4): gönüllü; imza yapmak uyum varsayımı sağlar, imzalamamak ayrı kanıt yükü getirir ("will have to demonstrate compliance... through alternative adequate means").

### 3.2 Kapsam sorusu: GDPR geliştiriciye uygulanır mı?

Zincir:
1. **Ev içi istisna kullanıcı içindir, geliştirici için değil.** m.2(2)(c) "by a natural person in the course of a purely personal or household activity". Res.18'in son cümlesi: "this Regulation applies to controllers or processors which provide the means for processing personal data for such personal or household activities". Yani kullanıcı kendi sağlık günlüğünü tutarken GDPR dışındadır ama araç sağlayıcı, kendisi denetleyen veya işleyen ise dışarıda değildir. Bu cümle tek başına geliştiriciyi denetleyen yapmaz; "eğer" koşulu rol analizidir.
2. **Rol (denetleyen mi?):** m.4(7): "determines the purposes and means of the processing". K6 §56: "The fact that one of the parties does not have access to personal data processed is not sufficient to exclude joint controllership"; Fashion ID (C-40/17) dipnot 16: yalnız "operations involving the processing... for which it determines jointly the purposes and means". Yani veriyi hiç görmemek tek başına savunma değil.
   - Denetleyen yönünde: hangi verinin (profil, kayıtlar, sağlık notu), hangi alıcılara (altı sağlayıcı), hangi koşulda (düğme) gideceğini uygulama kodu belirliyor; kullanıcı yalnız aç/kapat yapıyor (`coach.js:169,684-687`).
   - Denetleyen değil yönünde: amaç kullanıcının (kendi sağlık takibi); geliştiricinin kendi amacı veya geliri yok; anahtar ve sağlayıcı hesabı kullanıcıda; kullanıcı her gönderimi başlatıyor; Fashion ID'deki gibi ticari menfaat yok.
   - Sonuç: BELİRSİZ. Temkinli tutum (bu belgenin varsayımı): denetleyen gibi davranmak; çünkü yanlışsa maliyeti küçük (metin, kayıt), doğruysa ihmal maliyeti yüksek.
3. **Coğrafi kapsam (m.3(2)(a)):** Türkiye'de yerleşik geliştirici, AB'deki kişilere hizmet "offering goods or services... irrespective of whether a payment". Res.23: "mere accessibility... or the use of a language generally used in the third country" yetmez; "use of a language... generally used in one or more Member States" ve "mentioning of customers or users who are in the Union" gösterge. Play Console'da AB ülkelerini seçmek açık bir niyet göstergesidir; arayüzün yalnız Türkçe olması karşı argümandır ama Türkçe konuşan AB sakinleri de vardır (dil tek başına belirleyici değildir). Kesin sonuç yok.
4. **AB temsilcisi:** Denetleyen sayılırsa m.27(1) temsilci; m.27(2)(a) istisna için işlem "occasional", büyük ölçekli özel veri içermemeli ve risk olasılığı düşük olmalı. Sağlık verisi düzenli gönderimi "occasional" değil; istisna zayıf.
5. **İşlem kaydı:** m.30(5) küçük işletme istisnası, işleme "special categories" içeriyorsa veya "not occasional" ise geçmez.

### 3.3 Aktarım (m.44-49): gerçekten "aktarım" mı?

EDPB 05/2021 (K9) üç ölçüt: ihracatçı GDPR'a tabi bir denetleyen/işleyen; ihracatçı veriyi başka denetleyene/işleyene iletiyor veya erişilebilir kılıyor; alıcı üçüncü ülkede. Ayrıca: "this second criterion cannot be considered as fulfilled when there is no controller or processor sending or making the data available... such as when data are disclosed directly by the data subject to the recipient". Dipnot 15: çerezlerle iletilen veri "not considered as being disclosed directly by the data subject, but rather as a transmission by the operator".
- Aktarım yok yönünde: kullanıcı kendi anahtarı ve hesabıyla, kendi tuşuyla veriyi doğrudan sağlayıcıya yolluyor; geliştirici ara sunucu değil.
- Aktarım var yönünde: istek gövdesini geliştiricinin kodu derliyor (profil, 14 gün özeti, ilaçlar); çerez dipnotundaki mantıkla bu "operatör tarafından iletim" sayılabilir. Geliştirici denetleyen sayılırsa (3.2) ihracatçı olur.
- Sonuç: BELİRSİZ ve 3.2'ye bağlı.

Aktarım var kabul edilirse:
- Yeterlilik (m.45): ABD için yalnız DPF listesindeki kuruluşlara (K10 m.1: "organisations in the United States that are included in the 'Data Privacy Framework List'"). Karar yürürlükte. Genel Mahkeme 3.9.2025'te Latombe davasını reddetti (K11: "the action must be dismissed in its entirety"). Temyiz C-703/25 P görülüyor (yalnız ikincil kaynak: DOĞRULANAMADI), karar yürürlükte kalıyor. Altı sağlayıcının DPF listesinde olup olmadığı DOĞRULANAMADI (dataprivacyframework.gov arama sayfası otomatik okunamadı). Kullanıcının eklediği "özel" OpenAI uyumlu servis herhangi bir ülkede olabilir. Türkiye listede yok (K12). OpenRouter yönlendirme yapar, nihai model sunucusu değişebilir.
- Yeterlilik yoksa m.49(1)(a): açık rıza, "after having been informed of the possible risks of such transfers... due to the absence of an adequacy decision and appropriate safeguards". K8 §2.1.3: bu bilgi verilmezse "the derogation will not apply". K8 s.4-5: aktarımlar "occasional" olmalıdır diye açık istisna yalnız m.49(1)(b)(c)(e) için yazılı, ama "even those derogations which are not expressly limited... have to be interpreted in a way which does not contradict the very nature of the derogations as being exceptions"; ayrıca "a data transfer that occurs regularly within a stable relationship... can be deemed as systematic and repeated". Günlük Rehber kullanımı düzenli ilişkidir. Bu, m.49(1)(a)'ya güvenmeyi zayıflatır; standart sözleşme (m.46) ücretsiz katmanda pratikte mümkün değil. Bu nedenle bölüm 5'te avukata soruldu.
- Gemini (K19): "You may use only Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom" ve EEA/CH/UK'de "the terms under 'How Google uses Your Data' in 'Paid Services' apply to all Services... even though they are offered free of charge". Bu, ücretsiz katmanda eğitim kullanımı riskini AB'de büyük ölçüde kapatıyor (Paid veri kullanım şartları ücretsiz katmana da uygulanıyor). Ancak "API Client" kim? Geliştirici mi, anahtar sahibi kullanıcı mı belirsiz. Dahili belgemiz (`coach-provider-analysis.md:12`) "ücretsiz katmanda istemler eğitimde kullanılır" diyor; AB için K19 ile çelişiyor, yani belgenin AB'ye uyarlanması gerek. Rıza metninde ve politikada eğitim/insan inceleme uyarısı hiç yok (arama: `eğitim` ifadesi `coach.js` ve `privacy-policy.md`'de bulunamadı). K19 ayrıca "Use... is for developers... for professional or business purposes, not for consumer use" der: tüketici BYOK akışının Google şartlarıyla uyumu ayrı bir sözleşme sorusu.

### 3.4 Açık rıza ve bilgilendirme

- m.9(1) sağlık verisini yasaklar; m.9(2)(a) açık rıza kaldırır. Res.35 sağlık verisi tanımı "independent of its source, for example from... a medical device": kilo, ilaç, ruh hali, sağlık notu bu kapsamda.
- K7: açık rıza "express statement"; bilgilendirilmiş rıza için en az "controller's identity" (res.42), veri türü, amaç, geri alma hakkı, m.22 kullanımı varsa, ve aktarım riskleri (K7 §64(vi)). Sağlayıcıların ayrı denetleyen olarak adlandırılması gerekir (K7 §65: rızaya dayanacak diğer denetleyenler "should all be named"); uygulama sağlayıcıları ada göre sayıyor: `coach.js:687` iyi.
- Güçlü yanlar: ayrık ve veri türü bazlı (`coach.js:169-170,731`), rıza sürümü ve sağlayıcı kümesi değişince düşmesi (`coach.js:677-681`), rızasız tam çalışma (m.7(4) bağlama yasağına uygun), geri alma kolay (m.7(3)): `privacyui.js:42-43`, `coach.js:770`.
- Zayıf yanlar: (a) veri sorumlusu kimliği boş (`privacy-policy.md:8-11`); (b) sağlayıcının kendi amaçlarıyla işlemesi/insan incelemesi ve AB'de güvence yokluğu bilgisi yok; (c) rıza metni "yurt dışına aktarım" diyor, ama risk açıklaması yok; (d) Rıza yalnız cihazda (`consentAt`); geliştirici "demonstrate" yükümlülüğünü (m.7(1)) cihazdaki kayıtla nasıl karşılar sorusu açık; denetleyen sayılsa bile veriyi görmeyen biri için cihaz kaydı mantıklı bir kanıt olabilir, karşı yorum: sunucu tarafı ispat gerekir.
- m.8: 18+ ile sınırlı olduğundan fiilen devreye girmiyor; AB üye devletleri dijital rıza yaşını 13-16 arasında belirler (m.8(1)). Beyan dışında doğrulama yapılmıyor; 16-17 yaş bir kullanıcı yalan yaşla girerse çocuk verisi işlenir. m.8(2) "reasonable efforts" yalnız hizmet çocuğa doğrudan sunulursa; hedef kitle yetişkin olduğundan beyan yeterli olabilir, bu avukat sorusu.
- m.13: aydınlatma metni KVKK şablonunda; GDPR eksikleri B3'te.

### 3.5 m.22 ve DPIA

- m.22: hukuki ya da benzer ölçüde önemli etki doğuran, yalnızca otomatik karar. Rehber öneri sunuyor; kalori hedefi değişimi ve kayıtlar kullanıcı onayıyla (`coach.js:402-410`, `coachlib.js:277` kural 2). Kullanıcıya hukuki/ekonomik etki yok. Uygulanmaz.
- m.35(1): yüksek risk olasılığı olan işleme için DPIA; m.35(3)(b): özel veri kategorilerinin "large scale" işlenmesi. Tek geliştirici, kullanıcı başına yerel işleme: büyük ölçek ilk bakışta zayıf. Karşı yön: yeni teknoloji (LLM) + sağlık verisi + kırılgan gruplar (yeme bozukluğu). Ulusal denetim otoritesi DPIA listeleri (m.35(4)) bakılmadı: DOĞRULANAMADI. Sonuç belirsiz; hafif bir DPIA belgesi düşük maliyetli ve savunmayı güçlendirir.

### 3.6 MDR: Rehber ve kayıt özellikleri tıbbi amaç doğurur mu?

Ölçüt (K13 m.2(1)): cihaz, "software... intended by the manufacturer to be used... for... diagnosis, prevention, monitoring, prediction, prognosis, treatment or alleviation of disease". Amaçlanan kullanım (m.2(12)): "the use for which a device is intended according to the data supplied by the manufacturer on the label, in the instructions for use or in promotional or sales materials or statements". Yani belirleyici olan üreticinin beyanıdır (etiket, uygulama içi metin, mağaza metni, tanıtım).

MDCG 2019-11 rev.1 (K14):
- "Software must have a medical purpose on its own to be qualified as a MDSW"; "the intended purpose, as described by the manufacturer... is relevant".
- "software only intended for non-medical purposes... such as... back-up, wellness or fitness apps, do not qualify as MDSW."
- Saklama, arşiv, iletişim, basit arama dışında veri üzerinde işlem yapan yazılım MDSW olabilir (adım 3); "processing, analysing, interpreting, calculating... medical information" tıbbi amaç varsa MDSW.
- Ek: yazılım "can provide immediate decision-triggering information (e.g. blood glucose meter software)".
- Yeme bozukluğu belirtilerini hafifletmek amaçlı yazılım örnek MDSW (diyet, fiziksel aktivite girdileriyle). Yani yeme bozukluğuna yönelik terapötik iddia tıbbi amaç doğurur.

Rehber/NeoWell özellikleri ve değerlendirme:

| Özellik | Kanıt | Risk yorumu |
|---|---|---|
| Kalori/protein hedefi, tahmini harcama | `algo.js:117-148` | Beslenme/fitness (wellness); BMI<18.5, hamilelik gibi "sert" frenler var. Frenler güvenlik önlemi; hastalık adı koymuyor. Düşük risk |
| Tansiyon, şeker, tahlil kaydı; PDF "doktor raporu" | `03-screens.js:97`, `vitalslib.js:164`, `lablib.js:328` | Kayıt/saklama/iletişim: MDCG'ye göre MDSW değil. Ad "rapor" belge sanılabilir; "yorumlanmamıştır" notu var. Düşük-orta |
| 180/120 üstü, 54 altı/400 üstü kayıtta "112'yi ara" | `vitalslib.js:100`, `vitalsui.js:75` | Sabit eşikte uyarı = izleme ve karar tetikleme (kan şekeri ölçer yazılımı "immediate decision-triggering"). Bu dosyadaki en güçlü tıbbi-amaç göstergesi. Orta |
| Kamerayla nabız ölçümü | `play-data-safety.md:22` | Fizyolojik parametre ölçümü; "tıbbi ölçüm değildir" beyanı var, ama ölçüm işlevi cihaz benzeri. Orta (inceleme gerekir) |
| Bel/boy oranı "sık anılan referans" | `measureui.js:34` | Genel bilgi, eşik yargısı yok. Düşük |
| Rehber yorumları | `coachlib.js:273-287` | Tanı, ilaç, doz yasak; hekime yönlendirir. Tansiyon/şeker/tahlil Rehber'e gitmiyor (`coach.js:686`). Düşük, ancak kullanıcı sohbette serbest metinle yazarsa model yorum üretebilir |
| İlaç hatırlatıcı | `privacy-policy.md:21,76` | Hatırlatma; tedavi önerisi yok. Düşük-orta (hastalık yönetimi iddiasıyla birleşirse yükselir) |

Hangi ifadeler tıbbi amaç doğurur (mağaza metni, uygulama içi metin, ad): "tansiyonunu kontrol altında tut", "diyabet yönetimi", "hastalığını izle", "riskini hesaplar", "anormal değer uyarısı", "yüksek/düşük/normal" etiketleri, hedef aralık ve renk bantları, "doktor raporu" (belge niteliği), hekimin kararına destek iddiası, "tedaviye uyum", yeme bozukluğu "tedavisi/hafifletmesi". Güvenli tarafta kalan kalıp: "kayıt tutma günlüğü", "ölçümlerini kendin girersin, yorum yok", "tıbbi cihaz değildir, tanı koymaz, tedavi önermez".

Sınıflandırma sonucu (cihaz sayılırsa): Kural 11 (Ek VIII 6.3): "Software intended to provide information which is used to take decisions with diagnosis or therapeutic purposes is classified as class IIa" ve izleme yazılımı için IIa/IIb; en az IIa, yani CE için onaylı kuruluş, kalite yönetimi, klinik değerlendirme. Tek geliştirici için fiilen yapılamaz; bu yüzden amaçlanan kullanım beyanını wellness/kayıt düzeyinde tutmak tek gerçekçi yol. Bekleyen MDR revizyon teklifi (K20, COM(2025)1023) Kural 11'i "clinical benefit" temelli yeniden yazıyor ve yazılımı "lower risk classes" ile anıyor; teklif kabul edilmedi, durumu DOĞRULANAMADI; bugünkü hukuk K13.

### 3.7 ePrivacy ve tüketici hukuku (yalnız ilgili kısım)

- 2002/58 m.5(3): terminal cihazda bilgi saklama/erişim rıza gerektirir; istisna: "strictly necessary in order for the provider of an information society service explicitly requested by the subscriber or user to provide the service". Uygulamanın yerel depolaması kullanıcının istediği hizmettir: istisna. Ulusal uyarlamalar farklı olabilir. Google ML Kit/Play hizmeti telemetrisi (`privacy-policy.md:42`, `play-data-safety.md:30`) fiilen çalışıp çalışmadığı doğrulanmadı; çalışıyorsa m.5(3) açısından geliştirici mi Google mı sorumlu belirsiz.
- UCPD m.6 ve Ek I md.17 ("Falsely claiming that a product is able to cure illnesses, dysfunction or malformations"): mağaza metni kuralları bu riski karşılıyor (`play-data-safety.md:46-47`). Geliştirici "trader" sayılır mı sorusu açık (ücretsiz hobi uygulaması).
- 2019/770 m.3(1): fiyat ödenirse veya tüketici kişisel veri sağlarsa uygulanır; istisna: veri yalnız hizmeti sunmak için işleniyorsa. Uygulama ücretsiz ve veri geliştiriciye gitmiyorsa muhtemelen kapsam dışı; ücretli yapılırsa uygunluk ve güncelleme yükümlülükleri doğar. Fiyat kararı bilinmiyor.

## 4. Somut öneriler (öncelik sırasıyla)

| # | Öneri | Gereklilik | Maliyet | Yapılmazsa risk |
|---|---|---|---|---|
| 1 | Karar: AB ülkelerini Play'de seçmeden önce bu listeyi bitir; geçici seçenek "AB ülkelerini dışarıda bırak" | GDPR m.3(2) (res.23), AI Act m.2(1)(a) | Küçük (Play ayarı) | AB'de dağıtım niyeti = kapsam; B3/B4 açıkken yaptırım ve itibar riski |
| 2 | Rehber sekmesinde kalıcı "Yapay zekâ" etiketi (sohbet başlığı veya giriş alanı yanında); ilk mesajda tek cümlelik bildirim ("Ben yapay zekâyım, hekim değilim"); introdaki "yapay zekâ" cümlesini kapalı akordeondan görünür metne taşı | AI Act m.50(1)(5); K3 §(37)(40) | Küçük | m.50(1) ihlali; uygulama 2.8.2026'dan beri uygulanır |
| 3 | `SYSTEM` istemine kural ekle: kullanıcı "insan mısın / yapay zekâ mısın" diye sorarsa yapay zekâ olduğunu söyle | K3 §(40) | Küçük (bir satır) | Sorulduğunda bildirmeme |
| 4 | m.50(2) için yaz-ve-sakla analiz notu (neden uygulandığı/uygulanmadığı, üst sağlayıcı işaretine dayanma, kapalı ortam savı) ve avukata sor; ucuz tedbir: kayıtlı Rehber mesajlarına `ai:true` alanı (yedekte makine okunur kalır) | m.50(2); K3 §(74)(86) | Küçük | İşaretleme yükümlülüğü yorumunun aleyhine çıkması |
| 5 | Rıza metnine ekle: veri sorumlusu adı/iletişim (boş alanlar), sağlayıcıların kendi koşullarıyla (ör. kullanım/insan incelemesi) işleyebileceği, AB'de yeterlilik/güvence yokluğu riski (yeterlilik yoksa), sağlayıcı bazında kısa not; `CONSENT_V` artırılır, politika §5 ile birlikte güncellenir (test eşleşmesi var) | GDPR m.4(11), 7, 9(2)(a), 49(1)(a); K7 §64; K8 §2.1.3 | Küçük-orta | Rıza geçersiz sayılabilir; m.9 ihlali |
| 6 | Politikaya "AB/EEA kullanıcıları için GDPR bilgi notu" bölümü: denetleyen kimliği, hukuki dayanak (m.6(1)(a), 9(2)(a)), alıcılar, aktarım ve yeterlilik durumu, saklama, erişim/silme/taşınabilirlik/itiraz hakları, geri alma, denetim otoritesine şikâyet hakkı | GDPR m.13(1)(2) | Küçük | m.13 ihlali |
| 7 | Gemini ücretsiz anahtarı için AB uyarısı veya AB'de yalnız ücretli anahtara yönlendirme; `coach-provider-analysis.md` AB için güncellenir | K19; B10 | Küçük | Sağlayıcı şartı ihlali; kullanıcı hesabının kapanması |
| 8 | Hafif DPIA belgesi (veri akışı, riskler, önlemler: yerel depolama, PII maskeleme, veri türü anahtarı, 18+ kapısı) ve işlem kaydı | GDPR m.35, 30 | Orta (belge) | Denetleyen sayılırsa hesap verebilirlik eksikliği |
| 9 | Geliştirici denetleyen sayılırsa AB temsilcisi (üçüncü taraf hizmeti) araştır; yoksa (1)'deki gibi AB dışı bırak | GDPR m.27 | Orta (aylık ücret) | m.27 ihlali |
| 10 | MDR sertleştirme: "doktor raporu" adını "Hekim için ölçüm kaydı"; 112 eşik penceresini sadeleştir veya hekime danış (avukat+hekim); kamerayla nabız ekranında "ölçüm değil, tahmini" vurgusu; uygulama içi tek bir "amaçlanan kullanım" metni (kayıt/günlük, tıbbi amaç yok) ve mağaza metniyle tutarlılık kontrolü | MDR m.2(1)(12), m.7; MDCG 2019-11 | Küçük | Cihaz yazılımı olarak nitelendirilme, AI Act yüksek risk zinciri |
| 11 | Yeme bozukluğu/hastalık yönetimi iddiası içeren hiçbir ifade yazma; Rehber istemini koru | MDCG 2019-11 (yeme bozukluğu MDSW örneği) | Yok | Tıbbi amaç doğurma |
| 12 | Aktarım rolü ve DPF listesi için sağlayıcı başına denetim kaydı (DPF listesi durumu, adres, sözleşme sayfası); özel servis seçeneği için AB'de "güvenilir servis" uyarısı | GDPR m.44-46 | Orta | Aktarım dayanağı eksikliği |

## 5. Avukata sorulacaklar

1. **Rol:** Kod hangi verinin hangi sağlayıcıya gideceğini belirliyor, ama kullanıcı kendi anahtarıyla gönderiyor. Geliştirici GDPR m.4(7) anlamında (ortak) denetleyen mi, yoksa yalnız yazılım sağlayıcı mı? Neden gerek: tüm Bölüm V, m.13, m.27, m.30, m.35 bu cevaba bağlı. (K6 §56, Fashion ID, res.18.)
2. **Aktarım var mı:** İstek metnini uygulama koduyla derlenip kullanıcının telefonundan sağlayıcıya gittiğinde "aktarım" (EDPB 05/2021 dipnot 15 mantığı) sayılır mı? Sayılırsa m.49(1)(a) günlük kullanımı taşır mı (K8 "systematic and repeated")?
3. **m.3(2) hedefleme:** Yalnız Türkçe arayüz ve AB ülkelerinin Play'de seçilmesi "AB'de hizmet sunma niyeti" sayılır mı?
4. **m.50(1):** BYOK kullanıcısı için "açıkça belli" istisnası savunulabilir mi, yoksa kalıcı etiket zorunlu mu? Sağlık bağlamında periyodik hatırlatma gerekir mi (K3 §(40))?
5. **m.50(2):** Uygulama içinde kalan, yayımlanmayan sohbet metni için makine okunur işaretleme yükümlülüğü var mı? Üst sağlayıcının işaretine dayanmak yeterli mi? Geliştirici "ticari faaliyet" kapsamında sayılır mı (m.3(10))?
6. **MDR sınırı:** 112 uyarı eşiği, kamerayla nabız ölçümü ve PDF "doktor raporu" birlikte amaçlanan kullanımı tıbbi yöne çeker mi? Hekim/düzenleyici uzman görüşü de gerekir.
7. **Gemini şartı:** "API Client" kimdir; ücretsiz anahtarı öneren bir BYOK uygulaması AB'de şartı ihlal eder mi? Google'ın "professional or business purposes" şartı tüketici BYOK akışıyla uyumlu mu?
8. **DPIA zorunluluğu** ve ulusal denetim otoritesi listeleri (hedef üye devlet başına).
9. **Yaş:** Yalnız beyanla 18+ kapısı AB'de (m.8, ulusal rıza yaşı) yeterli mi?
10. **Tüketici hukuku:** Ücretsiz hobi geliştirici UCPD "trader" sayılır mı? Ücretli sürümde 2019/770 yükümlülükleri.

## 6. DOĞRULANAMADI listesi (bu iddialara öneri dayandırılmadı)

| # | Konu | Neden |
|---|---|---|
| 1 | AI Act'in resmi konsolide sürümü (2026/1744 işlenmiş) | EUR-Lex konsolide sayfası HTTP 202/boş döndü; K1 + K2 birlikte okundu |
| 2 | Latombe temyizi C-703/25 P'nin güncel durumu | Yalnız ikincil kaynak (hukuk sitesi özetleri); Genel Mahkeme kararı K11 birincil |
| 3 | Digital Omnibus (veri/GDPR/ePrivacy) COM(2025) 837'nin yasama aşaması | Teklif metni birincil (K20); aşama bilgisi yalnız ikincil. Bugün yürürlükte olmadığı doğrulandı (yürürlük tarihi bulunmadı) |
| 4 | MDR revizyon teklifi COM(2025) 1023'ün aşaması | Teklif metni birincil; aşama ikincil |
| 5 | Altı sağlayıcının DPF listesindeki durumu | dataprivacyframework.gov sayfaları otomatik okunamadı |
| 6 | AI Act m.6(5) yüksek risk sınıflandırma rehberinin yayım durumu | Komisyon sayfasında bağlantı bulunamadı |
| 7 | Ulusal DPIA listeleri (m.35(4)) | Üye devlet başına bakılmadı |
| 8 | ML Kit/Play hizmeti telemetrisinin NeoWell'de fiilen çalışması | Dahili belge de "doğrulanmadı" diyor (`play-data-safety.md:5`); ağ trafiği ölçülmedi |
| 9 | Üst model sağlayıcılarının API metin çıktılarını işaretleyip işaretlemediği | Sağlayıcı belgelerine bakılmadı |
| 10 | MDR konsolide 10.01.2025'in en güncel konsolide olduğu | Daha yeni konsolide sürüm araması EUR-Lex'ten yapılamadı |
| 11 | Komisyon m.50 Rehberi'nin resmî kabul aşaması | Belge C(2026) 5054, 20.7.2026 tarihli "Approval of the content of the draft Communication" ekidir; Komisyon sayfası yayımlandığını gösteriyor, resmî Bildirim olarak kabul durumu ikincil kaynaklarda farklı anlatılıyor |

Özet sayı: tabloda EKSİK 2, KISMEN 3, BELİRSİZ 7 (A4, B1, B7, B8, B10, D2, D1 ML Kit kısmı); DOĞRULANAMADI 11.
