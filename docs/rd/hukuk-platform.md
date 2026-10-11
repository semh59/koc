# Platform ve sağlayıcı sözleşmeleri uyum analizi (NeoWell / Rehber)

**Bu belge hukuki tavsiye değildir.** Google Play politikaları, yapay zekâ sağlayıcılarının kullanım şartları ve Open Food Facts şartları üzerinden yapılmış mevzuat/sözleşme analizidir. Avukat veya uzman görüşü gereken noktalar bölüm 5'te ayrıca toplandı. Erişim tarihi: 2026-10-10 (tüm bağlantılar bu tarihte açıldı). Bu belgede "uyumsuzluk" = Play'de yayından kaldırılma, hesap kapanması veya sağlayıcı sözleşmesi ihlali riski.

Kaynak notu: Google yardım sayfalarında madde numarası yoktur; atıf "yardım makale numarası + başlık" biçimindedir. "Sayfada tarih yok" yazılan yerde sayfa yalnızca "©2026 Google" gösteriyor. Tırnak içindeki kısa parçalar sayfa okuyucusunun döndürdüğü ifadelerdir (özet katmanından geçtiği için uzun alıntı yapılmadı). Sağlayıcı sözleşmelerinde gerçek bölüm numarası var ve kullanıldı.

## 1. Kapsam ve kaynak listesi

| # | Kaynak | URL | Sayfadaki tarih |
|---|---|---|---|
| G1 | Play: AI-Generated Content | support.google.com/googleplay/android-developer/answer/13985936 | sayfada tarih yok |
| G2 | Play: Health Content and Services (aynı metin 16555673 ve 16679511 adreslerinde) | .../answer/16679511 | sayfada tarih yok |
| G3 | Play: User Data | .../answer/9888076 | sayfada tarih yok |
| G4 | Play: Data safety bölümü bilgi formu | .../answer/10787469 | sayfada tarih yok; son değişiklik girişi 5 Aralık 2023 (UPI) |
| G5 | Play: Permissions and APIs that Access Sensitive Information (Health Connect bölümü) | .../answer/9888170 | Health Connect bölümünde yürürlük tarihi yok; sayfada 27 Ocak 2027 tarihli iki değişiklik (konum düğmesi, Contacts) |
| G6 | Play: Prepare your app for review (hedef kitle) | .../answer/9859455 | sayfada tarih yok |
| G7 | Play: Policy Deadlines | .../answer/9876714 | girişler 2026-08-26 ile 2027-01-27 arası |
| G8 | Play: Policy announcement 30 Ekim 2025 | .../answer/16550159 | 2025-10-30 |
| G9 | Play: Target API level | .../answer/11926878 | 2026-08-31 |
| G10 | Play: Policy announcements listesi | .../announcements/13412212 | 2026-01-28, 2026-04-15, 2026-07-15 girişleri |
| P1 | Gemini API Additional Terms | ai.google.dev/gemini-api/terms | Effective 23 Mart 2026; Last modified 2026-04-28 |
| P2 | Anthropic Usage Policy (yeni sürüm) | anthropic.com/legal/aup ; duyuru anthropic.com/news/2026-usage-policy-update | "Effective November 12, 2026"; duyuru 8 Ekim 2026 |
| P3 | Anthropic Usage Policy (şu an geçerli önceki sürüm) | anthropic.com/legal/archive/22742366-2ef0-4c7a-a833-6523f10d3944 | Effective 15 Eylül 2025 |
| P4 | Anthropic Commercial Terms | anthropic.com/legal/commercial-terms | "Effective June 17, 2025" |
| P5 | OpenAI API: Safety best practices, Your data, Under-18 guidance | developers.openai.com/api/docs/guides/safety-best-practices , .../your-data , .../safety-checks/under-18-api-guidance | sayfada tarih yok |
| P6 | Groq Services Agreement, Your Data | console.groq.com/docs/legal/services-agreement , .../docs/your-data | "Last Modified: June 22, 2026"; arşiv sürümü 15 Ekim 2025 |
| P7 | NVIDIA API Trial Terms of Service (PDF) | assets.ngc.nvidia.com/products/api-catalog/legal/NVIDIA%20API%20Trial%20Terms%20of%20Service.pdf | "v. September 19, 2025" |
| P8 | OpenRouter Terms / Privacy / Privacy and Logging | openrouter.ai/terms , /privacy , /docs/features/privacy-and-logging | Terms: "Last Updated: August 31, 2026" |
| O1 | Open Food Facts Terms of use | world.openfoodfacts.org/terms-of-use | sayfada tarih yok |
| O2 | Open Food Facts API belgesi | openfoodfacts.github.io/openfoodfacts-server/api/ | sayfada tarih yok (API v3.6) |

Açılamayan birincil kaynaklar (DOĞRULANAMADI, bölüm 6): OpenAI Usage Policies, OpenAI Services Agreement ve Business Terms (HTTP 403 veya betik ile oluşan boş sayfa).

## 2. Gereklilik tablosu

Durum sütunu: UYUMLU / KISMEN / EKSİK / BELİRSİZ.

### 2.1 Google Play

| # | Gereklilik | Kaynak | Bizim durumumuz (kanıt) | Uyum |
|---|---|---|---|---|
| A1 | Üretken yapay zekâ içeriği üreten uygulamada uygulama içi bildirme/işaretleme özelliği: "must contain in-app user reporting or flagging features", kullanıcı uygunsuz içeriği uygulamadan çıkmadan geliştiriciye bildirebilmeli | G1, "AI-Generated Content" | Rehber mesajında bildir düğmesi yok. `coach.js` `data-c` eylem listesi (addprov, chats, clearchat, consent, dismiss, guide, menu, menuask, menulocal, mkprov, newchat, progask, pvno, pvok, retry, revoke, sadv, setup, sfetch, ssave, stest, why) içinde bildirme yok; `coach.js:737-739` mesaj şablonunda yok. Arama: `grep -iE "bildir\|şikayet\|uygunsuz\|flag\|report"` coach klasörü ve main/0*.js | EKSİK |
| A2 | Üretilen içerik Play politikalarına uymalı; kısıtlı içerik (çocuk istismarı, aldatıcı davranış) üretimi engellenmeli | G1 | Sistem istemi güvenlik kuralları var (`coachlib.js:278-286`: ilaç/doz önerme, hekime yönlendirme, kırmızı bayrak `coachlib.js:11-28`). Çıktı filtresi yok; ancak konu sağlık/beslenme sohbeti, çocuk içeriği riski düşük. | KISMEN |
| A3 | Health apps declaration formu (Console > Uygulama içeriği) | G2, "Health and Medical Apps": "All developers must complete the Health apps declaration form" | Cevaplar `docs/play-data-safety.md` "Sağlık uygulaması beyanı" bölümünde taslak halinde. Console'da doldurulduğu doğrulanamaz. | KISMEN |
| A4 | Tıbbi cihaz olmayan sağlık uygulaması mağaza açıklamasında net uyarı içermeli ve kullanıcıyı sağlık uzmanına danışmaya yönlendirmeli | G2: "must include a clear disclaimer in their app description"; "Apps must also remind users to consult a healthcare professional" ; sayfa özetinde beklenen ifade "not a medical device and does not diagnose, treat, cure, or prevent any medical condition" | `docs/store-listing.md:58` ve `MED_NOTE` (`www/main/01-core.js:73`): "tıbbi cihaz değildir, tanı koymaz ve tedavi önermez; hekim yerine geçmez... hekimine danış". "Tedavi etmez/önlemez" (cure/prevent) karşılığı yok. | KISMEN |
| A5 | Yanıltıcı sağlık iddiası yasağı | G2: "We don't allow apps containing misleading health claims that contradict existing medical consensus" | `docs/play-data-safety.md` yasaklı ifade listesi; `store-listing.md:5` yazım kuralı. Son metin denetimi bu raporda yapılmadı. | UYUMLU (kural var, denetim bekliyor) |
| A6 | Tıbbi cihaz sayılan uygulamalar onay kanıtı sunmalı; AB için 30 Ekim 2025 duyurusu "Medical Device" etiketi ve MDCG kılavuzunu getirdi | G2: "must provide proof of approval, clearance or certification"; G8 | Uygulama "tanı koymaz" konumunda. Tansiyon/şeker kaydı ve 112 eşiği (`vitalslib.js crisis`) sınırda; `play-data-safety.md` karar 4 bunu zaten işaretliyor. AB'de bu işlevin "tıbbi yazılım" sayılıp sayılmayacağı bu raporda ölçülemedi. | BELİRSİZ |
| A7 | Gizlilik politikası: Console'da bağlantı + uygulama içinde bağlantı veya metin; herkese açık, değiştirilemez, PDF olmaz | G3: "a privacy policy link in the designated field within Play Console" ve "a privacy policy link or text within the app itself" | Uygulama içi metin var (`privacyui.js`). Yayın URL'si yok: `play-data-safety.md` "[DOLDURULACAK]"; `privacy-policy.md:5` "Son güncelleme: [DOLDURULACAK]" ve veri sorumlusu alanları `[DOLDURULACAK]` | EKSİK |
| A8 | Politika içeriği: verinin nasıl erişildiği/toplandığı/kullanıldığı/paylaşıldığı, paylaşılan taraflar, saklama ve silme politikası | G3: "any parties with which any personal or sensitive user data is shared"; "The developer's data retention and deletion policy" | `privacy-policy.md:40` sağlayıcı tablosu; bölüm 6 saklama süresi (`:61-62`); silme (`:67`). Yer tutucular dolana kadar tamamlanmış sayılmaz. | KISMEN |
| A9 | Data safety formu politika metniyle tutarlı olmalı | G3/G4: "must consistently match your app's privacy policy disclosures" | Çelişki: `play-data-safety.md` nabız satırı "Toplanıyor: Evet (yalnız telefonda)"; aynı dosyanın kendi kuralı ve Play tanımı ("Collect" = "transmitting data from your app off a user's device") cihazda kalan veriyi toplama saymıyor. ML Kit/Play hizmetleri telemetrisi ölçülmedi (dosya kendisi "doğrulanmadı" diyor). | KISMEN |
| A10 | Belirgin uygulama içi açıklama + açık rıza; üçüncü taraf yapay zekâ entegrasyonları da kapsamda | G3: "These requirements also apply to third-party AI integrations (such as products, services, code)" | Rıza metni tek kaynakta: `coach.js:684-687` (ne gider, ne zaman, kime, geri alma), yaş kontrolü `coach.js:675-682`, sağlayıcı değişince yeniden onay `coach.js:689`. Veri türü bazında kapatma var. | UYUMLU |
| A11 | BYOK aktarımı "sharing" mi? | G4: sharing = "Transfers to any organization other than the developer or its service providers"; istisna: "based on a specific user-initiated action, where the user reasonably expects the data to be shared" veya "prominent in-app disclosure and consent"; "collect" = cihaz dışına her aktarım | Form temkinli: topluyor Evet, paylaşıyor Evet (`play-data-safety.md` karar 1). Gönderim yalnız düğmeyle (`coach.js:685`). Bölüm 3.2'de karşı görüşler. | BELİRSİZ (mevcut beyan güvenli taraf) |
| A12 | Health Connect: onaylı kullanım durumu, yalnızca gerekli izinler, veriyi reklam/satış için aktarmama, üçüncü tarafa yalnız açık izinle aktarım | G5: "User data may only be transferred to third parties with explicit user consent"; "Transferring or selling user data to third parties like advertising platforms, data brokers..."; onaylı durumlar arasında "fitness and wellness, rewards, fitness coaching" | HC adım/uyku/nabız Rehber'e gitmiyor: `coach.js:140-143` (`cStep` yalnız telefon adımı `e.ph`; uyku `src==="hc"` ise undefined), `CONSENT_NOT` `coach.js:686`; nabız alanı `coach.js` içinde hiç geçmiyor (grep: `hc\|pulse\|hr` yalnız bu satırlar). İzinler READ_STEPS/READ_SLEEP/READ_HEART_RATE salt okuma (`play-permission-declarations.md:26`). Sayfa yapay zekâ kullanımından söz etmiyor; bu "AI serbest" demek değil (bölüm 3.3). | UYUMLU |
| A13 | Hedef kitle bildirimi; çocuk içerirse Families | G6: "You must declare your app's target age group" | Yalnız 18+ (`play-data-safety.md` "Aile politikası"); kurulumda 18 altı kabul edilmez. Yaş kendi beyanıdır. | UYUMLU |
| A14 | Hedef API seviyesi | G9: "New apps and app updates must target Android 16 (API level 36) or higher" (31 Ağustos 2026'dan beri); mevcut uygulamalar için API 35; uzatma talebi "November 1, 2026" a kadar | `android/variables.gradle:3-4`: `compileSdkVersion = 34`, `targetSdkVersion = 34`. Yeni uygulama olarak yüklenemez. | EKSİK |
| A15 | Konum izni değişikliği (27 Ocak 2027): kesin konum için "location button" önerilen asgari kapsam | G5, G7 | Yürüyüş ölçümü konum kullanıyor (`privacy-policy.md:24`). İzin akışının yeni politikaya uygunluğu bu raporda incelenmedi. | BELİRSİZ |

### 2.2 Sağlayıcı sözleşmeleri ve Open Food Facts

| # | Sağlayıcı / konu | Sözleşme ne diyor | Bizim durumumuz | Uyum |
|---|---|---|---|---|
| B1 | NVIDIA Build (Rehber'de varsayılan açık, sağlık açık, onaysız: `coach.js:67`) | P7 §1.2: "limited trial purposes only and without use of the API Service or Generated Content in production"; §1.4: aboneliksiz yalnız "internal testing and evaluation purposes, not in production"; §2.6(a): "protected health information, personal data" içermeme; §4.3: "you will not upload any personal information relating to an identifiable individual, financial, health or governmental information"; §3.3(iv): "User Content and Generated Content to improve NVIDIA products and services, including AI models"; §2.3 ise oturum sonunda saklanmayacağını söylüyor (iki madde birbiriyle çelişkili, ikisi de alıntılandı); 18+ ("adult of legal age of majority") | Uygulama bu sağlayıcıya sağlık verisi göndermek üzere varsayılan açık. Ücretsiz katman uyarısı yalnız `confirm` açık sağlayıcılar için çıkar (`coach.js:302`; yalnız Gemini). NVIDIA için kullanıcıya hiçbir uyarı yok. | EKSİK |
| B2 | Groq | P6 §4.3: "The AI Model Services should not be used for medical, legal, financial, or other professional advice"; §6.3(d)(vi) PHI yalnız BAA ile; "You must be 18 years of age or older"; hizmet tüketici kullanımı için değil; §4.2: Inputs/Outputs ile eğitim yok; Your Data: "retained for up to 30 days" (kötüye kullanım günlüğü); §3.1: son kullanıcıya kendi "Customer Applications" üzerinden sunulabilir, §6.3(c) yeniden satış yok | Yaş kontrolü var, eğitim riski yok. "Tıbbi tavsiye değildir" ilkesi uygulama çizgisiyle uyumlu (ilaç/doz önerisi yok, `coachlib.js:280,286`), ama sohbet "sağlık yorumu" üretiyor. | KISMEN |
| B3 | OpenRouter | P8 Terms §2: "You must be at least 18 years of age to use the Service."; §16.1 tıbbi/hukuki/finansal çıktıya garanti yok, insan denetimi kullanıcıda; §16.2: "OPENROUTER MAKES NO REPRESENTATION OR WARRANTY REGARDING ANY MODEL PROVIDER'S DATA HANDLING, RETENTION, TRAINING"; Privacy: "Some Model Providers may use your Inputs and Outputs for model training or improvement"; "OpenRouter cannot control Model Provider-side training once user data is transmitted to a training-permitted Model Provider"; ücretli/ücretsiz modeller için ayrı eğitim ayarı (Privacy and Logging) | Varsayılan modeller `:free` (`coachlib.js:226`). Rıza metni "kime" satırında sağlayıcı adı var ama ücretsiz modelde alt sağlayıcının eğitimde kullanabileceği yazmıyor. | KISMEN |
| B4 | Google Gemini | P1: "You must be 18 years of age or older to use the APIs."; ücretsiz (Unpaid) hizmette: "human reviewers may read, annotate, and process your API input and output"; "Do not submit sensitive, confidential, or personal information to the Unpaid Services."; "You may not use the Services in clinical practice, to provide medical advice"; AEA/İsviçre/Birleşik Krallık: "You may use only Paid Services when making API Clients available to users" | Gemini kapalı gelir ve her gönderimde onay ister (`coach.js:70,302`). Uyarı yalnız "ürün geliştirmek için kullanılabilir" diyor; sağlık verisi göndermenin ücretsiz katmanda şartlara aykırı olduğunu ve AB/UK/İsviçre'de ücretsiz anahtarın kullanılamayacağını söylemiyor. Bölge/yaş denetimi yok (yaş 18+ var). | KISMEN |
| B5 | Anthropic | P3 (şu an geçerli, 15 Eylül 2025): sağlık/tıbbi tanı/hasta bakımı yüksek riskli kullanım; "a qualified professional in that field must review the content or decision prior to dissemination or finalization"; "you must disclose to them that you are using AI"; tüketiciye dönük sohbet botu "must disclose to users that they are interacting with AI". P2 (12 Kasım 2026'da yürürlüğe girer): yüksek riskli öneri için "A qualified person must meaningfully review a High-risk AI Recommendation" ve bireye "clearly told that AI was used"; "Medical" alanı "diagnosing a condition; recommending, starting, stopping, or adjusting a treatment or medication, including dose"; genel bilgi ("how a condition or treatment works") hariç. P4: hizmet "not for consumer use"; Anthropic Customer Content ile eğitim yapmaz; müşteri çıktının yanlış olabileceğini kullanıcıya bildirmeli. 18 yaş alt sınırı P4'te belirtilmiyor | Uygulama tanı/tedavi/doz önermiyor (`coachlib.js:280,286`); "yapay zekâ rehberi hekim değildir" kartı var (`coach.js:631`). Sohbet balonlarında kalıcı "yapay zekâ" etiketi yok; yalnız ekran/rıza metinlerinde. | KISMEN |
| B6 | OpenAI | DOĞRULANAMADI: Usage Policies ve Services Agreement açılamadı. Açılabilen API belgeleri: "data sent to the OpenAI API is not used to train or improve OpenAI models"; kötüye kullanım günlüğü "up to 30 days"; "Users should generally have an easily-available method for reporting improper functionality or other concerns about application behavior"; küçükler (18 altı) için ek rehber | Eğitim riski yok (belgeye göre). Bildirme yolu eksikliği A1 ile aynı. | BELİRSİZ |
| B7 | Open Food Facts atıf | O1: "attribute the authorship to Open Food Facts with a link to https://openfoodfacts.org"; ürüne özel veride bağlantı o ürünün sayfasına olmalı; "Contributors agree to be credited by re-user by a link to the product"; türev çalışmalar aynı koşullarla paylaşılmalı | Atıf var: `www/main/03-screens.js:227` ("Barkoddan gelen ürünler Open Food Facts verisini içerir, Open Database License (ODbL) ile sunulur: world.openfoodfacts.org") ve `04-sheets.js:135` ("Kaynak: Open Food Facts (topluluk verisi, ODbL)"). Tıklanır bağlantı ve ürün sayfası bağlantısı yok. Görsel (CC BY-SA) alınmıyor: `offlib.js:8` alan listesinde resim yok. | KISMEN |
| B8 | OFF API kullanımı | O2: "always use a custom User-Agent"; biçim `AppName/Version (ContactEmail)`; ürün okuma "15 req/min/IP" | `04-sheets.js:167`: `"NeoWell/1.0 (kisisel kullanim)"`, e-posta yok. `capacitor.config.json:9-10` CapacitorHttp açık olduğundan başlığın gönderilmesi muhtemel (tarayıcı fetch'inde yok sayılabilir; doğrulanmadı). Sorgu yalnız kullanıcı okutunca (düşük hız). | KISMEN |

Sayımlar bölüm 7'de.

## 3. Detaylı analiz

### 3.1 AI-Generated Content ve bildirme zorunluluğu (A1)
G1 şu iki şeyi söylüyor: bu politika "text-to-text conversational generative AI chatbots" gibi sohbet botlarını örnek sayıyor ve uygulama içi bildirme/işaretleme istiyor. Rehber doğrudan bu kategoride: kullanıcı mesajına üretken model yanıt veriyor.
- Karşı görüş: G1'in örnek listesi sohbet botunu "where interacting with the chatbot is a central feature of the app" koşuluyla anıyor. Rehber isteğe bağlı bir özellik; ana özellik takip/kayıt. Dar yorumla politika uygulanmayabilir. Bu yoruma güvenilmemeli: Play inceleme ekibi Rehber'i ana sayfada ve gizlilik metninde belirgin bir yapay zekâ özelliği olarak görecektir; ucuz çözüm var (öneri O1).
- Yürürlük: G1 sayfasında tarih yok. Temmuz 2025 duyurusu (G10 çevresi) AI içeriğini "clarification" olarak anıyor; gerçek yürürlük tarihi birincil kaynakta bulunamadı (bölüm 6).
- OpenAI güvenlik belgesi (P5) aynı yönde: "easily-available method for reporting improper functionality". Bildirme yolu birden fazla sağlayıcıya karşı da savunma sağlar.

### 3.2 Data safety ve BYOK "sharing" sorusu (A11)
- G4'e göre "collect" cihazdan dışarı her iletim; geliştiriciye gitmemesi toplama olmasını engellemez. Rehber aktarımı bu yüzden "toplanıyor" sayılır. İstisna listesi yalnız "sharing" için geçerli ve metin istisnayı toplamaya genişletmiyor.
- "Paylaşım" için iki istisna uyabilir: kullanıcı eylemi + makul beklenti, veya belirgin uygulama içi açıklama + rıza (rıza ekranı mevcut). Hizmet sağlayıcı istisnası uymaz: sağlayıcı geliştiricinin talimatıyla değil kullanıcının kendi hesabıyla çalışıyor ("processes user data on behalf of the developer and based on the developer's instructions" tanımı).
- Bir yorum: istisnalar sağlandığı için "paylaşılıyor: hayır" demek mümkündür. Karşı yorum: sağlayıcı (özellikle NVIDIA §3.3(iv), Gemini ücretsiz katman, OpenRouter alt sağlayıcı) kendi amacıyla veri kullanabildiği için kullanıcının "makul beklentisi" tartışmalı olur. Mevcut taslak ("paylaşılıyor: evet") ret riskini azaltır; ürün sayfasında "veri paylaşılıyor" etiketi çıkar. Karar `play-data-safety.md` karar 1'de zaten açık; hukukçuya sorulacak (bölüm 5).
- Tutarsızlık (A9): nabız satırı "Toplanıyor: Evet" yazıyor, tanımla çelişiyor. Fazladan beyan Play'de ret sebebi olmaz ama kullanıcıya yanlış etiket gösterir. Bu raporda dosyaya dokunulmadı.

### 3.3 Health Connect ve yapay zekâ (A12)
G5 Health Connect verisini "personal and sensitive user data" sayıyor; üçüncü tarafa aktarım için açık izin, insan erişimi için açık izin, reklam/satış/kredi için yasak istiyor. Sayfada "yapay zekâ" sözcüğü geçmiyor; bu AI'ya açıkça izin olduğu anlamına gelmiyor, G3'teki genel kural (üçüncü taraf AI entegrasyonları dahil) HC verisine de uygulanır. Uygulama HC verisini Rehber'e hiç göndermediği için bu kısıtlar fiilen devreye girmiyor. Kanıt: `coach.js:140-143`, `CONSENT_NOT` `coach.js:686`. Bu "doğru ve yeterli": bir gün eklenirse (örneğin adım/uyku Rehber bağlamına girerse) ayrı, açık rıza gerekir; kod `cStep` tasarımı bunu şu an dışarıda tutuyor. İki küçük risk: (1) birleştirilmiş adım değeri `e.v` ise ve `e.hc` yoksa gider; HC kaydı sonradan gelirse eski gönderimler geri alınamaz. (2) Uyku günü ilk kayıt HC ise manuel ikinci kayıt da gitmez (güvenli taraf).

### 3.4 Sağlık içeriği, tıbbi cihaz ve MDCG (A4, A6)
G2 uygulamanın "regulated medical device" olmadığını açıklamada açıkça yazmasını ve uzmana yönlendirmeyi istiyor. 30 Ekim 2025 duyurusu (G8) "incorporate elements of the Medical Device Coordination Group (MDCG) guidance", AB'yi hedefleyen tıbbi cihaz uygulamaları için bilgi ve "Medical Device" etiketini getirdi. 28 Ocak 2026 yürürlük tarihi yalnız ikincil kaynakta (arama özeti) görüldü; birincil sayfa yalnız "at least 30 days from October 30, 2025" diyor (bölüm 6). Rehber ve ölçüm kaydı için: "tanı koymaz" konumu korunuyorsa tıbbi cihaz beyanı gerekmez; ancak kayıt anındaki 112 eşiği ve doktor raporu PDF'i (play-data-safety karar 4) işlevi tıbbi karar desteğine yaklaştırabilir. AB'de bu işlev yazılım "tıbbi cihaz" olabilir mi? Bu bir MDR sorusu ve sağlık mevzuatı ekibinin konusu; bu belgede yorumlanmadı.

### 3.5 Sağlayıcı şartları: BYOK kimi bağlar?
- Sözleşmeyi kullanıcı yapıyor: anahtar kullanıcının hesabına ait, şartları o kabul ediyor (OpenRouter §3.2 anahtarın gizliliği kullanıcıda; Groq §3.2 aynı; NVIDIA tarafı da kullanıcıya "you"). Uygulama geliştiricisi çoğu zaman "Customer Application" konumunda (Groq §3.1 buna açıkça izin veriyor).
- Karşı görüş: bazı şartlar geliştiriciyi doğrudan bağlar. Gemini şartları "API Client" tanımıyla uygulamayı kapsıyor ("as part of a website, application, or other service (collectively, API Clients)"); AEA/UK/İsviçre'de ücretsiz hizmet yasağı ve 18 yaş altı erişim yasağı "making API Clients available to users" ifadesine bağlı. Uygulama Gemini'yi hazır sağlayıcı olarak sunduğundan bu sorumluluk geliştiriciye de uzanabilir.
- Play ise farklı: G3 "third-party AI integrations" için kullanıcı verisi kurallarını geliştiriciye yüklüyor; BYOK burada kalkan sağlamaz.
- NVIDIA'da risk kullanıcıya dönük ve somut: ücretsiz deneme hesabıyla "üretim" kullanımı yasak, sağlık verisi yasak (§1.2, §1.4, §2.6(a), §4.3) ve uygulama bu sağlayıcıyı varsayılan açık getiriyor. Kullanıcı hesap kapatma riskiyle karşılaşır; "kişisel kullanım üretim sayılmaz" yorumu mümkün, ancak §2.6(a) ve §4.3 yoruma açık değil. Rıza ekranında ve `docs/coach-provider-analysis.md`'de bu uyarı yok.
- Anthropic: yürürlükteki sürüm (15 Eylül 2025) sağlık alanında "qualified professional" incelemesi istiyor. Rehber kendi başına kişiye özel sağlık kararı verdiğini iddia etmiyor; genel beslenme/aktivite yorumu "yüksek riskli öneri" tanımına girmeyebilir (12 Kasım sürümü genel bilgiyi hariç tutuyor), ama bireyin verisine uygulanan öneri bu çizgiye yaklaşır. Gün gelip uygulama ilaç/dozla ilgili öneri yapmaya başlarsa doğrudan "Medical" alanına girer. Şu an kodda bu açıkça yasak (`coachlib.js:280,286`). Yeni sürümün 12 Kasım 2026 tarihli olduğu, şu an yürürlükte olmadığı unutulmamalı.
- Groq §4.3 ve Gemini "medical advice" cümleleri geniş: "tıbbi tavsiye" tanımı sağlayıcıya göre değişir. Rehber "tanı koymaz/tedavi önermez" konumunda; bu konum şartlarla uyumlu okunabilir ama sağlayıcının kendi yorumu bilinmiyor.

### 3.6 Yaş şartı
Tüm sağlayıcılar 18 yaş istiyor: Gemini ("18 years of age or older"), Groq (aynı), OpenRouter §2, NVIDIA ("adult of legal age of majority"). Rehber 18 altında kapalı (`coach.js:675-682`). Yaş kullanıcı beyanıdır (`S.settings.age`); beyanı yanlış girerse sistem engelleyemez. Bu Play'in hedef kitle beyanıyla (A13) tutarlı. Daha fazla önlem makul görünmüyor.

### 3.7 Veri sağlayıcıda nasıl işlenir (kullanıcıya söylenmesi gereken)
| Sağlayıcı | Ücretsiz/standart katmanda eğitim | Saklama | Not |
|---|---|---|---|
| NVIDIA Build | §3.3(iv) ürün/AI model geliştirme için içerik toplayabilir; §2.3 oturum sonunda saklamaz; çelişkili | oturum + güvenlik günlüğü | sağlık verisi şartlarla yasak |
| Groq | Eğitim yok (§4.2) | varsayılan saklamaz; kötüye kullanım günlüğü 30 güne kadar | ZDR açılabilir |
| OpenRouter | OpenRouter eğitmez; alt sağlayıcı eğitebilir; ücretsiz/ücretli için ayrı ayar | OpenRouter günlükleme ayarına bağlı | alt sağlayıcı seçimi kullanıcıya ait |
| Gemini | Ücretsiz katmanda ürün geliştirme + insan incelemesi; ücretli katmanda yok | - | AEA/UK/CH'de yalnız ücretli |
| OpenAI | Belgeye göre eğitim yok | 30 güne kadar | birincil şartlar DOĞRULANAMADI |
| Anthropic | Eğitim yok (P4) | - | ticari şartlar; ücretli API |

### 3.8 Open Food Facts (B7, B8)
- Atıf var ama zayıf: düz metin, tıklanamaz, ürün sayfasına bağlantı yok. O1 ürüne özel veride ürün sayfası bağlantısı istiyor. Uygulamada ürün kaydı `foods` listesine yazılıp yerelde saklanıyor.
- ODbL paylaş-aynı-koşullarla: uygulama OFF veritabanını yeniden dağıtmıyor; yalnız tek barkod sorguluyor ve kullanıcı cihazında kayıt tutuyor. Karşı görüş: yerel önbellek "türev veritabanı" sayılabilir; ancak kamuya sunulmadığı sürece paylaşım yükümlülüğü doğmaz (yorum, hukukçu görüşü gerekir). Beslenme verilerinin başka kullanıcılara dağıtılacağı bir sürümde (ör. yedeği paylaşan, toplu dışa aktaran) bu soru yeniden açılmalı.
- Kullanıcı arayüzü metinleri ODbL ve OFF'u doğru anıyor; `README.md:38` bağlantı veriyor.

## 4. Somut öneriler (öncelik sırasıyla)

| # | Öneri | Gereklilik | Maliyet | Yapılmazsa risk |
|---|---|---|---|---|
| O1 | Target SDK 36'ya yükselt (`android/variables.gradle`), Android 16 davranış değişikliklerini sına | A14 (G9) | Orta | Yeni sürüm/uygulama yüklenemez; uzatma 1 Kasım 2026'ya kadar |
| O2 | Her Rehber yanıt balonuna "Bildir" düğmesi: `mailto:` ile yanıt metni + sağlayıcı adı hazır gelir (sunucu gerekmez) | A1 (G1) | Küçük | İnceleme reddi veya yayından kaldırma |
| O3 | Gizlilik politikasını yayınla (URL), `[DOLDURULACAK]` alanlarını doldur, Console'da bağla | A7, A8 (G3) | Küçük (içerik avukatta) | Yayın reddi |
| O4 | NVIDIA Build'i varsayılan kapalı ve sağlık kapalı yap veya ekranında uyarı göster: "Bu sağlayıcının ücretsiz deneme şartları sağlık/kişisel veri göndermeyi ve üretim kullanımını yasaklıyor." | B1 (P7 §1.2, §2.6(a), §4.3) | Küçük | Kullanıcı hesabı kapanabilir, şikayet |
| O5 | Ücretsiz katman uyarısını Gemini dışındaki sağlayıcılara da genişlet: OpenRouter `:free` modelleri alt sağlayıcı eğitimi; NVIDIA §3.3(iv). Gemini için: "sağlık verisi ücretsiz katmanda gönderilmemeli; AB/UK/İsviçre'de ücretsiz anahtar kullanılamaz" | B3, B4 (P1, P8) | Küçük | Yanlış bilgilendirme, sözleşme ihlali |
| O6 | Hedef kitle/bölge: Gemini için AEA/UK/CH kullanıcılarına ücretli anahtar uyarısı (cihaz bölgesine göre isteğe bağlı) | B4 | Küçük-orta | Gemini şartları ihlali (geliştirici sorumluluğu tartışmalı) |
| O7 | Mağaza açıklamasına "tanı koymaz, tedavi etmez, hastalığı önlemez" kalıbı ekle; İngilizce "does not diagnose, treat, cure, or prevent" karşılığı | A4 (G2) | Küçük | Sağlık politikası ret/uyarı |
| O8 | Rehber balonlarına küçük, kalıcı "Yapay zekâ" etiketi | Anthropic P3 tüketiciye dönük sohbet botu açıklaması; A1'i güçlendirir | Küçük | Sağlayıcı şartı ihlali (Anthropic anahtarlı kullanıcı) |
| O9 | Open Food Facts atıfını tıklanabilir yap (openfoodfacts.org) ve barkodlu ürün kartına ürün sayfası bağlantısı koy; User-Agent'a iletişim e-postası ekle: `NeoWell/<sürüm> (<e-posta>)` | B7, B8 (O1, O2) | Küçük | OFF lisans/API kullanım ihlali, engellenme |
| O10 | `play-data-safety.md` nabız satırını düzelt (cihazda kalan veri toplanmış sayılmaz) | A9 (G3/G4) | Küçük | Etiketin gereksiz şişmesi; tutarsızlık |
| O11 | Rıza ekranına sağlayıcı bazlı tek satır: "ücretsiz katmanda içerik eğitimde veya insan incelemesinde kullanılabilir" (yalnız ilgili sağlayıcı açıksa) | A10, B1-B4 | Küçük | Kullanıcı yanıltılması, KVKK rıza geçerliliği tartışması |
| O12 | 27 Ocak 2027 konum izni değişikliğine karşı mevcut konum akışını incele | A15 (G5, G7) | Küçük-orta | O tarihten sonra güncelleme reddi |
| O13 | 12 Kasım 2026 Anthropic sürümü için: ilaç/doz önermeyen çizgiyi koru; Anthropic kullanıcılarına ek metin gerekirse hukukçuyla netleştir | B5 (P2) | Küçük | Sağlayıcı şartı ihlali |

## 5. Avukata sorulacaklar

| # | Soru | Neden avukat gerekiyor |
|---|---|---|
| Q1 | BYOK aktarımı Data safety'de "sharing" mi? Hizmet sağlayıcı istisnası, kullanıcı eylemi istisnası, rıza istisnası bu mimaride birlikte nasıl okunur? | Play politikası yorumu; yanlış beyan yayından kaldırma sebebi olabilir |
| Q2 | NVIDIA Trial Terms §1.2/§1.4/§2.6(a)/§4.3: kullanıcı kendi deneme hesabıyla kişisel sağlık verisi gönderirse ve uygulama bunu varsayılan sunarsa geliştirici (teşvik/yönlendirme) açısından sorumluluk doğar mı? | Üçüncü kişi sözleşmesi ve hukuki yönlendirme sorusu |
| Q3 | Gemini şartlarındaki "API Client" ve AEA/UK/CH "Paid Services only" yükümü, kullanıcının kendi anahtarıyla bağlanan bir uygulamayı da bağlar mı? | Sözleşme yorumu; sonucu yayın bölgesini (TR dışı) belirler |
| Q4 | Tansiyon/şeker kaydı, 112 eşiği ve doktor raporu PDF'i AB'de MDR kapsamında "tıbbi yazılım" sayılır mı; Play'in 30 Ekim 2025 MDCG güncellemesi bunu etkiler mi? | Düzenleyici yorum, üretici sorumluluğu |
| Q5 | OFF ODbL: yerelde saklanan barkod kayıtları "türev veritabanı" mı? Ürün sayfası bağlantısı zorunluluğu kullanıcıya gösterilen kartlarla nasıl karşılanır? | Lisans yorumu |
| Q6 | A1'in "central feature" ifadesi Rehber'i kapsıyor mu, yoksa bildirme düğmesi gönüllü mü? | Play yorumu; yine de düğme önerilir |
| Q7 | OpenAI Usage Policies ve Services Agreement metinlerinin (bu raporda açılamadı) BYOK uygulaması için incelenmesi | Birincil kaynak açılamadı |

## 6. DOĞRULANAMADI listesi

1. OpenAI Usage Policies (openai.com/policies/usage-policies): HTTP 403; arama özeti "Effective: October 29, 2025" ve "tailored advice that requires a license" ibaresini gösterdi, birincil metin açılamadı. Dayanılarak öneri yapılmadı.
2. OpenAI Services Agreement / Business Terms (yaş şartı, müşteri içeriği, son kullanıcı yükümlülükleri): sayfa boş döndü (403 veya betikle oluşturulan içerik).
3. Play "Medical Device" etiketi ve MDCG değişikliğinin 28 Ocak 2026 yürürlük tarihi: birincil sayfa (G8) yalnız "at least 30 days from October 30, 2025" diyor; Policy Deadlines sayfası (G7) bu girişi göstermedi.
4. AI-Generated Content bildirme zorunluluğunun resmî yürürlük tarihi: G1'de tarih yok, G10 listesi 2026 girişlerinde yok; 2025 duyurusunu birincil kaynakta bulamadım.
5. G3'teki "third-party AI integrations" cümlesinin eklenme tarihi: 2026 duyuruları (G10) bu konuyu anmıyor; ikincil kaynak Temmuz 2026 diyor, birincil kaynakta doğrulanamadı.
6. Anthropic Commercial Terms'te alt yaş sınırı: metinde belirtilmiyor.
7. Google ML Kit ve Play hizmetleri telemetrisinin NeoWell'de fiilen çalışıp çalışmadığı (ağ trafiği ölçülmedi; `play-data-safety.md` de "doğrulanmadı" diyor).
8. Play "Health Connect permissions declaration" formunun içeriği ve Console'daki mevcut durum (sayfa kod/belgeden görülemez).

## 7. Özet sayım
UYUMLU 4 (A5, A10, A12, A13). KISMEN 11 (A2, A3, A4, A8, A9, B2, B3, B4, B5, B7, B8). EKSİK 4 (A1, A7, A14, B1). BELİRSİZ 4 (A6, A11, A15, B6). Toplam 23 satır. DOĞRULANAMADI 8.
