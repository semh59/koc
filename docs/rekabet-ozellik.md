# Rekabet ve özellik karşılaştırması (2 Ekim 2026)

Amaç: NeoWell'i gerçek rakiplerle dürüstçe karşılaştırmak. NeoWell bilgisi koddan (`www/*.js`, `www/index.html`, `android/.../AndroidManifest.xml`), `docs/*.md` dosyalarından ve git geçmişinden alındı. Rakip bilgisi internetten toplandı, kaynak URL'leri en altta.

**Kaynakla ilgili uyarılar**
- **Birincil kaynak:** App Store TR sayfaları, resmî siteler, developer.android.com ve support.google.com. TL fiyatlar 2 Ekim 2026'da App Store TR'den okundu. Fiyatlar bölgeye ve kampanyaya göre değişir.
- **İkincil kaynak (İK):** Fiyat ve şikâyet bilgisinin çoğu, rakip uygulamaların yayımladığı SEO bloglarından geliyor (nutrola, nutriscan, sensai, prpath, aitoolsbakery vb.). Bu kaynaklar kendi aralarında çelişiyor, bu yüzden fiyatlar aralık olarak verildi. Bağımsız olarak doğrulanmadı.
- **Ekşi Sözlük:** Sayfalar otomatik erişime 403 döndü. Ekşi'den aktarılanlar yalnızca arama özetidir.
- **Alıntılar:** Bazı yorum alıntıları okuma aracı tarafından çevrildi ya da özetlendi. Bunlar "(özet)" diye işaretli, birebir alıntı değildir.

## 1. NeoWell'in gerçek özellik envanteri

**Durum işaretleri**
- **K:** Kodda var, telefonda henüz denenmedi (`docs/yapilacaklar.md` içinde `[~]` ya da `[ ]`).
- **T:** Telefonda denendi (`[x]`). Bugün bu durumda yalnızca barkod okutma var.

Aşağıdaki her özellik, aksi yazmadıkça **K** durumundadır.

| Alan | NeoWell'de olan | Sınır / not |
|---|---|---|
| Yemek, kalori, makro | Yerleşik besin listesinde yaklaşık 818 besin var (`www/modules/nutrition/foods.js`; `scripts/foods.test.js` ilk 818 kaydı kilitler). USDA SR Legacy satırları "Kaynak: USDA" etiketli, tarif hesaplı Türk yemekleri aralıkla ve "tahmini" diye işaretli. Porsiyon seçimi, "Kendi besinlerim", favoriler, son yenilenler, öğün şablonları ve "Dünkünü tekrarla" var. | Veritabanı hâlâ küçük: MFP 14 milyondan fazla kayıt iddia ediyor, markalı ürün kapsamı yok. "Kendi tarifim" malzemeden tarif hesaplıyor; Koç'tan haftalık menü ve alışveriş listesi var. |
| Mikro besin | Lif, şeker ve sodyum. | Kısmi. Cronometer ücretsiz katmanda 84 besin öğesi izliyor. |
| Barkod | ML Kit ile okuma ve Open Food Facts araması (Türkiye etiketli 11.464 ürün). Okunan değerler tutarlılık denetiminden geçiyor. **T** | İnternet gerektirir. Bulunamayan ürünlerde etiket okuma ya da elle giriş yedek yol. |
| Etiket OCR | ML Kit ile cihaz içinde besin tablosu okuma. Tuz değerinden sodyum hesaplanıyor. | Doğruluğu gerçek paketlerle henüz ölçülmedi. |
| Koç (yapay zekâ) | Kullanıcı kendi API anahtarını giriyor (Groq, Gemini, OpenAI veya OpenRouter). Anahtar Android Keystore ile şifreli saklanıyor. Veri paylaşımı için ayrıca onay isteniyor. Özellikler: "Bu hafta neden kilo vermedim?" kartı (yerel hesap, Koç'a yorumlatma isteğe bağlı), plato uyarısı, program isteme ve şablona ekleme, listede olmayan yemek için tahmin. | İnternet gerektirir. Onay verilirse veri yurt dışındaki bir sağlayıcıya gider. Ücretsiz anahtar edinmek teknik bilmeyen kullanıcı için zor. |
| Kilo trendi ve harcama | Trend kilo, aykırı tartı uyarısı ve uyarlanabilir harcama tahmini var. Uyarlanabilir harcama, alınan kalori ve trend değişiminden hesaplanıyor; veri yetersizse Mifflin formülüyle karıştırılıyor (`www/kernel/algo.js:44`). Hedef kaloriye taban konuyor (1200 / BMR / harcamanın %75'i). Plato için güven aralığı var. | MacroFactor'ın ücretli ana özelliğine benzer. Bilimsel doğrulaması yapılmadı. |
| Adım ve hareket | Telefonun adım sensörü, gece kapanışı ve 23:58 örneklemesi, elle adım ekleme ve "sayım durdu" uyarısı. Etkinlik tanımayla otomatik yürüyüş/koşu algılanıyor, adım uzunluğu kısa GPS pencereleriyle öğreniliyor, kalori tempoya göre hesaplanıyor. | Health Connect ve saat/bant entegrasyonu yok. Hareket algılama Google Play hizmetlerine ve konum iznine dayanıyor. Xiaomi pil kısıtlamasına duyarlı. |
| Egzersiz kütüphanesi | 324 egzersiz. Animasyonlar 49 şablonlu bir çizgi-adam motoruyla üretiliyor. Bölge, tür ve ekipman süzgeci, süreli, aralıklı ve kardiyo setleri, zamanlayıcı var. | Video ya da gerçek insan gösterimi değil. Hevy ve JEFIT'te video var. |
| Salon kaydı | Antrenman şablonları, tahmini 1RM, hacim, sonraki seans için yük önerisi, egzersiz başına tekrar aralığı, plaka ve ısınma hesabı (ısınma setleri hacme ve rekora sayılmıyor), set anında rekor bildirimi, dinlenme sayacı. | Sosyal akış ve paylaşım yok. |
| İlaç | Program (saat, gün, kür süresi), alarm kanalı, kalıcı bildirim, bildirimden "Aldım" ve "Atla", 10 ve 20 dakika sonra tekrar, uyum yüzdesi, stok uyarısı, haftalık rapora ilaç uyumu. | Etkileşim denetimi yok (doğru bir karar, aşağıda). |
| Tansiyon ve şeker | İki ölçümlü seans, şeker için bağlam (açlık/tokluk vb.), hedef aralığı, grafik, hatırlatma, doktor raporu PDF'i. Uç değer bugün tarihliyse 112 kutusu gösteriliyor. | Yalnızca kayıt, tanı koymuyor. |
| Tahlil | PDF'ten okuma (pdf.js) ve fotoğraftan okuma (OCR), onay ekranı, test başına grafik, PDF dışa aktarma. | Gerçek laboratuvar PDF'leriyle sağlamlaştırılmadı. Taranmış PDF desteği sınırlı. |
| Oruç, uyku, ruh hali | Oruç planı, bitiş bildirimi ve hekim notu. Uyku süresi kaydı, ruh hali (emoji ve not). | Uyku elle giriliyor, sensör yok. Adet döngüsü takibi yok (karar bekliyor). |
| Su ve widget | Su hedefi, hatırlatmalar (hedef dolunca susuyor), bildirimden ve widget'tan "+250 ml". Ana ekran widget'ında kalan kalori, su ve adım görünüyor. | |
| Yedek | Parolalı şifreli yedek dosyası (parola zorunlu), paylaşım menüsüyle Drive'a gönderme (hesap bağlamadan), dosyadan geri yükleme, Pazar hatırlatması; otomatik yedek: seçilen klasöre, son yedek 7 günden eskiyse (`www/modules/data/backupui.js`). | Bulut eşitleme ve cihazlar arası senkron yok. |
| Raporlar | Haftalık rapor PDF'i (yorumsuz), Pazar akşamı haftalık özet bildirimi, tahlil PDF'i, tansiyon/şeker doktor raporu. | |
| Gizlilik ve model | Hesap yok, reklam yok, abonelik yok. Veriler telefonda kalıyor. | İnternet izni var: barkod ve Koç için gerekiyor. Uygulama yalnızca Android'de ve yalnızca Türkçe. Dağıtım GitHub Releases'ten APK ile yapılıyor, Play Store'da yok (yayın engelleri `docs/yapilacaklar.md` başında). Sürüm Ayarlar > Hakkında'da görünür (1.0.<derleme numarası>). |
| Olmayanlar | Health Connect (karar bekliyor), giyilebilir cihaz, fotoğraftan yemek tanıma (iptal edildi), sosyal özellikler, diyetisyen, adet döngüsü (karar bekliyor), iOS, web. Eskiden eksikti, artık kodda var: tarif, Koç'tan haftalık menü, alışveriş listesi, bel ve vücut ölçüleri. | |

## 2. Rakip özetleri

Fiyatlar ABD dolarıyla İK kaynaklardan, TL fiyatlar App Store TR'den alındı.

| Rakip | Fiyat | Ücretsiz katman | Öne çıkan 3 özellik | En sık 3 şikâyet |
|---|---|---|---|---|
| **MyFitnessPal** | Premium 79,99 $/yıl, Premium+ 99,99 $/yıl (İK). TR: aylık 26,99-134,99 ₺, yıllık 529,99-2.499,99 ₺. | Elle kayıt var. Barkod 2022'den beri ücretli. Reklam var. | 14 milyondan fazla besin, 50'den fazla uygulama ve cihaz entegrasyonu, topluluk. | Barkodun ücretli hale gelmesi. Türk yemeklerinde aynı yemek için onlarca çelişkili kayıt (Ekşi, arama özeti; App Store TR: "bulgur pilavı yok", özet). Fiyat artışı. Ayrıca 2018'de 150 milyon hesap sızdı (CNBC). |
| **Cronometer** | Gold yaklaşık 40-60 $/yıl. Kaynaklar 39,99, 49,99 ve 59,99 $ diyor (İK, çelişkili). | Geniş: 84 besin öğesi, reklam yok (İK). | Mikro besin derinliği, doğrulanmış veritabanı (USDA/NCC), diyet paylaşımı (Gold). | Restoran ve markalı ürün kapsamı dar. Bölgesel mutfak eksik. Yemek arama zor (İK). |
| **MacroFactor** | 71,99 $/yıl ya da 11,99 $/ay. Workouts paketiyle 89,99 $/yıl (İK). | Yok, yalnızca 7 gün deneme. | Uyarlanabilir harcama ve haftalık hedef güncellemesi, doğrulanmış besin veritabanı, reklamsız. | Ücretsiz katmanın olmaması. Yıllık ödemeye girmeden önce algoritmayı deneyememek. Kadın kullanıcılardan hedef kalori önerilerine itiraz (İK, Reddit özeti). |
| **Yazio** | TR: PRO aylık 44,99 ₺, 3 aylık 299,99 ₺, yıllık 359,90-959,99 ₺. Dolar fiyatı yaklaşık 30-48 $/yıl (İK). | Kalori günlüğü, barkod ve basit oruç var. Reklam var. | Oruç programları, 2.900'den fazla tarif ve menü, Fitbit/Garmin entegrasyonu. | Sık reklam. Türk mutfağı tarifleri gerçekçi değil ya da Türkçe değil. İlaç ve kafein takibi isteniyor (App Store TR, özet). |
| **Lose It!** | Premium yaklaşık 80 $/yıl (2026'da 39,99 $'dan artış), ömür boyu 299,99 $ (İK). | Dar: makro ve barkod ücretli (İK). | Hızlı kayıt, fotoğraf ve sesle kayıt (Snap It), basit arayüz. | Ücretsiz katmanın sürekli daralması. Fiyatın ikiye katlanması. İzinsiz yenileme ve iade sorunları (BBB şikâyetleri). |
| **FatSecret** | Premium 2,99-14,99 $/ay. Kaynaklar çelişiyor (İK). | Çok geniş: barkod, makro, topluluk. Reklam var. | Gerçekten ücretsiz çekirdek, Türkçe arayüz, tarif ve topluluk. | Reklam. Kullanıcı girdili veride tutarsızlık. Premium'un neyi açtığının belirsiz olması (İK). |
| **Diyetkolik** (Türk) | TR: aylık 89,99 ₺, 3 aylık 199,99 ₺, yıllık 250-499,99 ₺. Diyet planları 45-90 ₺. | Kalori sayacı, barkod, adım, su. Reklam var. | Türk ve markalı ürün veritabanı, diyetisyene ayda 5 soru (Premium), 20'den fazla diyet listesi, fotoğrafla yapay zekâ kaydı. | "çok kasıyor", "arayüz çok karışık ve yavaş", "internet bağlantınızı kontrol edin" hatası, 1,5 kaşık gibi kesirli miktarın girilememesi (App Store TR, puan 3,6, 925 değerlendirme; alıntılar okuma aracı özetinden). Gizlilik etiketinde hassas konum "izleme" amacıyla kullanılıyor. |
| **Lifie** (Türk) | TR: 29,99-879 ₺ arası çeşitli paketler. | Belirsiz. | Kişisel menü, diyetisyen onaylı besin değerleri, Apple Health ile adım. | Görünen yorumlarda şikâyet yok (4,9 puan, 16 binden fazla değerlendirme). Bağımsız şikâyet verisi bulunamadı. |
| **Hevy** | Pro 2,99 $/ay, 23,99 $/yıl, ömür boyu 74,99 $ (İK). | Sınırsız antrenman kaydı. 4 rutin, 7 özel egzersiz, 3 aylık grafik geçmişi sınırı. Reklam yok. | Hızlı set kaydı, sosyal akış, video egzersiz kütüphanesi. | Beslenme takibi yok. Bulut ve internet bağımlılığı. Isınma ve çalışma setleri için ayrı dinlenme sayacı yok (İK). |
| **Strong** | Pro 4,99 $/ay, 29,99 $/yıl, ömür boyu 99,99 $ (İK). | 3 özel rutin. | Sade ve hızlı kayıt, grafikler, dışa aktarma. | Ücretsiz katmanın 3 rutinle sınırlı olması. Beslenme yok. Az yenilik (İK). |
| **Fitbod / JEFIT** | Fitbod 95,99 $/yıl, ücretsiz katman yok. JEFIT Elite 69,99 $/yıl, ücretsiz sürümde reklam var (İK, JEFIT resmî sayfası). | Fitbod: yok. JEFIT: reklamlı. | Yapay zekâ ile program ve yük ayarı (Fitbod), büyük video kütüphanesi (JEFIT). | Fiyat (Fitbod). Reklam ve kalabalık arayüz (JEFIT) (İK). |
| **Samsung Health** | Ücretsiz. | Tümü ücretsiz. | Adım ve saat verisi, ilaç hatırlatıcı, yemek ve su kaydı. ABD'de sağlık kayıtları da var (Samsung basın sayfası). | Besin veritabanı zayıf, Türk yemeği kapsamı belirsiz. Cihaz ekosistemine bağlı (İK). |
| **Mi Fitness / Zepp Life** | Ücretsiz, bant ya da saat gerektirir. | Ücretsiz. | Bant ve saat verisi, uyku, nabız. | Adımı eksik sayma (%20-30 eksik sayım iddiası, tek kullanıcı yorumu, doğrulanmadı). Senkron sorunları (App Store yorumları). |
| **Pacer / StepsApp** | Pacer Premium yaklaşık 50 $/yıl. StepsApp 29,99 $/yıl (İK, StepsApp resmî destek sayfası). | Pacer reklamlı. | Adım, GPS yürüyüş, gruplar ve meydan okumalar. | Reklam. Adımların kaybolması ya da araçta çift sayım (İK). |

Not: Google Fit API'leri 2026 sonunda kapanıyor, yerine Health Connect geliyor (developer.android.com). Bundan sonra Android'de saat ve bant verisinin ortak kapısı Health Connect olacak.

## 3. a) Özellik matrisi

✔ = var, ~ = kısmi, ✘ = yok, ? = doğrulanmadı.

NeoWell sütunu: **K** = kodda var ama telefonda denenmedi, **T** = telefonda denendi.

Rakip sütunlarında hücre değerlerinin çoğu İK kaynaklardan geliyor.

| Özellik | NeoWell | MFP | Cronometer | MacroFactor | Yazio | FatSecret | Diyetkolik | Hevy | Samsung Health |
|---|---|---|---|---|---|---|---|---|---|
| Ücretsiz ve reklamsız çekirdek | ✔ | ✘ | ✔ | ✘ (ücretli) | ✘ | ✘ (reklam) | ✘ | ✔ | ✔ |
| Hesapsız, veri cihazda | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ (Samsung hesabı?) |
| Türk yemeği veritabanı derinliği | ~ (~818 besin, tarifli) | ~ (çok ama tutarsız) | ✘ | ✘ | ~ | ~ | ✔ | — | ? |
| Barkod | ✔ T | ✔ (ücretli) | ✔ | ✔ | ✔ | ✔ | ✔ | — | ? |
| Etiket OCR | ✔ K | ? | ~ | ✔ | ? | ? | ? | — | ? |
| Fotoğraftan yemek tanıma | ✘ (iptal) | ✔ (ücretli) | ~ (Gold) | ? | ✔ | ✔ | ✔ | — | ? |
| Mikro besin | ~ (lif, şeker, sodyum) | ~ | ✔ (84) | ✔ | ~ (PRO) | ~ | ~ (Premium) | — | ~ |
| Uyarlanabilir harcama | ✔ K | ✘ | ✘ | ✔ | ✘ | ✘ | ✘ | — | ✘ |
| Yapay zekâ koç / asistan | ✔ K (kendi anahtarı) | ✔ (Premium+) | ~ | ✘ | ✔ | ✔ (Premium) | ~ (insan diyetisyen) | ✔ (Pro) | ? |
| Tarif ve menü planı | ~ K (Kendi tarifim, Koç menüsü, alışveriş listesi) | ✔ | ~ | ✘ | ✔ | ✔ | ✔ | — | ✘ |
| Adım (telefon sensörü) | ✔ K | ~ (entegrasyonla) | ~ | ~ | ~ | ~ | ✔ | ✘ | ✔ |
| Saat ve bant entegrasyonu | ✘ | ✔ | ✔ | ✔ | ✔ | ✔ | ? | ✔ | ✔ |
| Otomatik yürüyüş/koşu algılama | ✔ K | ✘ | ✘ | ✘ | ✘ | ✘ | ? | ✘ | ✔ |
| Salon kaydı (1RM, plaka, ısınma, rekor) | ✔ K | ✘ | ✘ | ✘ (ayrı uygulama) | ✘ | ~ | ~ | ✔ | ~ |
| Egzersiz görseli | ~ (324 çizgi-adam) | ✘ | ✘ | — | ~ | ✘ | ~ | ✔ (video) | ✔ (video) |
| İlaç hatırlatıcı (alarm, stok) | ✔ K | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ |
| Tansiyon ve şeker (doktor PDF'i) | ✔ K | ✘ | ~ (kayıt) | ✘ | ✘ | ✘ | ✘ | ✘ | ~ (?) |
| Tahlil PDF/OCR içe aktarma | ✔ K | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ~ (yalnızca ABD) |
| Oruç | ✔ K | ✔ | ✔ (Gold) | ✘ | ✔ | ? | ✔ | ✘ | ✘ |
| Uyku ve ruh hali | ~ K (elle) | ✘ | ~ | ✘ | ✘ | ✘ | ✘ | ✘ | ✔ (uyku, sensörle) |
| Widget ve bildirimden kayıt | ✔ K | ✔ | ? | ✔ | ? | ? | ? | ✔ | ✔ |
| Sosyal / topluluk | ✘ | ✔ | ~ | ✘ | ✘ | ✔ | ~ | ✔ | ~ |
| Cihazlar arası eşitleme | ✘ (şifreli yedek, otomatik klasöre) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| iOS ve Play Store'da olmak | ✘ (yalnızca APK) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ~ (Samsung odaklı) |

## 4. b) NeoWell'in gerçekten iyi olduğu yerler

1. **Gizlilik modeli.** Hesap yok, sunucu yok, reklam izleyicisi yok. Bu bir rakip kategorisinin tamamına karşı fark yaratıyor:
   - MFP'de 2018'de 150 milyon hesap sızdı.
   - Diyetkolik App Store etiketinde hassas konumu "izleme" amacıyla kullanıyor.
   - Hevy ve diğerleri bulutta tutuyor.

   Dürüst ifade şu olmalı: **çekirdek takip çevrimdışı çalışır**. Barkod ve Koç internet ister. Koç'a onay verilirse veri seçilen yapay zekâ sağlayıcısına gider.
2. **Ücretsiz katmanda paywall yok.** Rakiplerde ücretli olan şu özellikler NeoWell'de ücretsiz:
   - Uyarlanabilir harcama: MacroFactor'da yaklaşık 72 $/yıl.
   - Barkod: MFP'de ücretli.
   - Makrolar: Lose It'te ücretli.
   - Salonda sınırsız rutin ve ısınma hesabı: Hevy ve Strong'da Pro.
3. **Sağlık kayıtlarının tek yerde olması.** Tahlil PDF ve OCR içe aktarma, tansiyon ve şeker için doktor raporu PDF'i ve alarm tipi ilaç hatırlatıcı aynı uygulamada. Bu birleşim incelenen diyet ve spor uygulamalarının hiçbirinde yok. Samsung Health ilaç, yemek ve adımı ücretsiz veriyor, yani "her şey tek yerde" iddiası tek başına ayırt edici değil. Ayırt edici olan **tahlil, tansiyon ve şeker raporu ile salon ve diyetin birlikte olması**.
4. **Salon ve beslenme birlikte.** Hevy ve Strong'da beslenme yok. MFP, Yazio ve Cronometer'da ciddi salon kaydı yok. MacroFactor bunu ayrı bir ücretli uygulamayla çözüyor.
5. **Kendi anahtarınla Koç.** Abonelik yok, sağlayıcıyı kullanıcı seçiyor, paylaşım onaya bağlı. "Neden kilo vermedim" kartı Koç'a gönderilmeden yerelde de çalışıyor.
6. **Adım algoritması.** Otomatik yürüyüş ve koşu algılanıyor, adım uzunluğu öğreniliyor, gece kapanışı sağlam. Adım saymanın kendisi rakiplerden daha doğru değil, çünkü aynı sensörü kullanıyor (`docs/fikirler.md` kararı). Fark kayıt düzeninde ve sağlamlıkta.
7. **Dürüst veri etiketi.** Her besinde "USDA" ya da "tahmini" kaynağı yazıyor. Rakiplerin kullanıcı girdili kayıtlarındaki tutarsızlık Türk kullanıcıların en sık şikâyeti.

## 5. c) NeoWell'in geride olduğu yerler (önem sırasıyla)

1. **Dağıtım ve platform.** Play Store'da yok, yalnızca APK. iOS yok, yalnızca Türkçe. Kullanıcı uygulamayı bulamıyor ve güvenmiyor; bu her eksikten büyük. Play'e çıkmak sağlık uygulaması beyanı ve gizlilik politikası gerektiriyor (Play Console Help).
2. **Türk yemeği veritabanı derinliği.** Yaklaşık 818 besin var; açık artık sayıdan çok markalı ürün ve kapsam. Diyetkolik'te markalı ürünler ve binlerce kayıt var, MFP'de kalabalık ama tutarsız veri var. Kullanıcının günde birkaç kez "bulamadım" demesi uygulamayı bıraktırır. Türk yemeklerinin değerleri tahmini ve tarife göre ±%20-40 değişiyor (`docs/besin-arastirmasi.md`).
3. **Veri tutarlılığı ve doğrulama.** Neredeyse tüm özellikler telefonda denenmedi (K durumunda). Adım, ilaç alarmı, widget ve Xiaomi pil davranışında bir hata, güveni hemen bitirir.
4. **Giyilebilir cihaz ve Health Connect yok.** Saat ya da bant kullananların adım, uyku ve nabız verisi gelmiyor. Google Fit kapanınca Health Connect bu verinin tek kapısı olacak.
5. **Tarif ve menü planı sınırlı.** Tarif hesaplama, Koç'tan haftalık menü ve alışveriş listesi var (telefonda denenmedi); hazır tarif kütüphanesi yok. Yazio, Diyetkolik ve FatSecret bunun için para alıyor.
6. **Fotoğraftan kayıt yok.** Rakiplerde hızla standart hale geliyor (Yazio, Diyetkolik, Lose It).
7. **Cihazlar arası eşitleme yok.** Otomatik yedek klasöre yazılıyor, senkron yok. Telefon değişince ya da kaybolunca risk var.
8. **Koç'un kurulumu zor.** API anahtarı almak sıradan kullanıcıya göre değil.
9. **Sosyal ve topluluk yok.** Önemi düşük; NeoWell'in gizlilik vaadiyle çelişir (aşağıya bakın).
10. **Egzersiz görselleri çizgi-adam.** Video gösterimin gerisinde.

## 6. d) Kullanıcının para verdiği ama bizde olmayan özellikler

| Özellik | Kim para alıyor | NeoWell'e uygun mu? |
|---|---|---|
| İnsan diyetisyen ve hazır diyet listeleri | Diyetkolik (ayda 5 soru, planlar 45-90 ₺), Lifie | Hayır. Sunucu ve sorumluluk gerektirir. |
| Tarif kütüphanesi, menü ve alışveriş listesi | Yazio PRO, MFP, FatSecret | Kısmen. Yerel tarif oluşturucu ve Koç ile menü önerisi yapılabilir. |
| Fotoğraftan yemek tanıma | MFP, Lose It, Yazio, Diyetkolik | Ancak Koç'un kendi anahtarıyla, onaylı ve aralık tahminiyle. |
| Geniş mikro besin raporu | Cronometer Gold, Diyetkolik Premium | Kısmen. USDA CC0 verisiyle temel besinler için yapılabilir. |
| Cihazlar arası eşitleme ve web erişimi | Hemen hepsi | Hayır, gizlilik vaadiyle çelişir. Otomatik şifreli Drive yedeği yeterli. |
| Video egzersiz ve uyarlanabilir program | Fitbod, JEFIT Elite, Hevy Pro | Kısmen. Program isteme zaten Koç'ta var. |
| Diyet paylaşımı (diyetisyen ya da hekimle) | Cronometer Gold | Var: PDF raporlar bunun yerel karşılığı. |

## 7. e) Kazan-kazan önerisi

**Rekabet gücünü en çok artıracak 5 özellik**
1. **Play Store'a çıkış ve doğrulama turu.** Önce K durumundaki maddeleri telefonda T durumuna getirmek, sonra release imzası, gizlilik politikası, KVKK metni ve sağlık uygulaması beyanı. Kullanıcıya hiçbir özellik bu adım kadar ulaşmaz.
2. **Türk yemeği veritabanını yaklaşık 500 kayda çıkarmak.** Malzemeden yerel tarif hesaplayıcı ("Kendi tarifim") eklemek ve Türk yemeklerinde tek sayı yerine aralık göstermek (`docs/besin-arastirmasi.md` madde 4).
   - Kaynak: USDA CC0 temel malzemeleri ve tarif hesabı.
   - TürKomp toptan kopyalanamaz, izin gerekir.
   - Open Food Facts ODbL lisanslı: kaynak gösterilmeli ve türev veritabanı aynı lisansla paylaşılmalı.
3. **Health Connect okuma.** Adım, uyku, kilo ve nabız verisi alınır, çift sayım engellenir. Saat ya da bant kullananları kazandırır, Google Fit kapanışıyla zamanlaması doğru.
4. **Otomatik şifreli yedek.** Haftalık olarak Drive'a ya da seçilen klasöre gider, cihaz değiştirmede tek dokunuşla geri yüklenir. Hesap olmadan "verim kaybolur mu?" korkusunu giderir.
5. **Koç ile fotoğraftan yemek ve menü önerisi.** Kullanıcının kendi anahtarıyla, açık onayla, "tahmindir" etiketi ve porsiyon düzeltme ekranıyla. Rakiplerin ücretli yaptığı özellik abonelik olmadan sunulmuş olur. Koç kurulumunu kolaylaştıran adım adım bir anahtar rehberiyle birlikte yapılmalı.

**Öne çıkarılacak mevcut özellikler:** tahlil, tansiyon ve şeker doktor raporları; uyarlanabilir harcama; salon ve beslenmenin birlikte olması; hesapsız ve reklamsız olması.

**Vazgeçilmesi ya da yapılmaması önerilenler**
- **Sosyal akış ve topluluk:** sunucu gerektirir, gizlilik vaadini bozar, moderasyon yükü getirir.
- **İnsan diyetisyen ve hazır diyet listeleri:** sorumluluk riski yüksek, Diyetkolik'in alanı.
- **İlaç etkileşimi ya da tahlil yorumu:** tıbbi cihaz sınıflaması riski. Şu anki "yalnızca kayıt" kararı doğru.
- **Oyunlaştırma ve rozet yarışı:** düşük değerli, yeme bozukluğu riski taşıyan kullanıcılar için zararlı olabilir.
- **Kendi adım sensörü algoritmasını daha da inceltmek:** aynı sensör kullanıldığı için doğruluk tavanı var. Emek Health Connect'e gitmeli.
- **Egzersizler için video üretmek:** maliyeti yüksek. Çizgi-adam animasyon ve açıklama yeterli.

## 8. f) Pazarlama için tek cümle

> "Hesap yok, reklam yok, abonelik yok: yemeğin, sporun, ilacın ve tahlillerin tek uygulamada, yalnızca senin telefonunda."

Bu cümlede "kilo verdirir" gibi bir sonuç vaadi yok. "Çevrimdışı" kelimesi de yok, çünkü barkod ve Koç internet ister.

## 9. Hukuki ve sağlık riskleri

- ⚠ **KVKK:** Sağlık verisi özel nitelikli kişisel veridir. Koç'a onay verildiğinde veri yurt dışındaki bir yapay zekâ sağlayıcısına gider; bu yurt dışına aktarım sayılır. Aydınlatma metni ve açık rıza gerekir. Mevcut onay ekranı bu metinle güçlendirilmeli.
- ⚠ **Google Play:** Sağlık uygulaması beyan formu zorunlu. Tıbbi işlev için ya düzenleyici onay ya da "tıbbi cihaz değildir" uyarısı gerekiyor (Play Console Help).
- ⚠ **Tansiyon, şeker ve tahlil:** Yalnızca kayıt ve grafik, tanı ya da yorum yok. 112 kutusu ve hedef aralığı metinleri "hekiminize danışın" diliyle kalmalı. Pazarlamada "şekerini kontrol eder" gibi bir ifade kullanılmamalı.
- ⚠ **Oruç ve kalori hedefi:** Yeme bozukluğu riski var. Kalori tabanı (1200 / BMR) korunmalı. Oruç isteğe bağlı kalmalı ve bir uyarı metni taşımalı.
- ⚠ **Koç:** Yapay zekâ önerisi tıbbi tavsiye değildir. İlaç sorularında "hekim ya da eczacına sor" uyarısı gösterilmeli. Program önerilerinde sakatlık uyarısı olmalı.
- ⚠ **Pazarlama iddiaları:** "Rakiplerden daha doğru adım", "bilimsel olarak doğrulanmış harcama" ve "kilo verdirir" ifadeleri kanıtsız; kullanılmamalı. Bu belgedeki ikincil kaynaklı yüzde ve fiyatlar reklam metnine taşınmamalı.
- ⚠ **Lisanslar:** Open Food Facts ODbL lisanslı, kaynak gösterilmeli. TürKomp verisi izinsiz toplu kopyalanmamalı.

## Kaynaklar

**Birincil**
- MyFitnessPal App Store TR: https://apps.apple.com/tr/app/myfitnesspal-kalori-sayac%C4%B1/id341232718?l=tr
- Yazio App Store TR: https://apps.apple.com/tr/app/yazio-ai-kalori-hesaplama/id946099227?l=tr
- Diyetkolik App Store TR: https://apps.apple.com/tr/app/diyetkolik-kalori-hesaplama/id558076089 ve yorumlar: https://apps.apple.com/tr/app/diyetkolik-kalori-hesaplama/id558076089?see-all=reviews&platform=iphone
- Lifie App Store TR: https://apps.apple.com/tr/app/lifie-diyet-kalori-hesaplama/id1526363832?l=tr
- Fitwell App Store TR (yeterli değerlendirme yok): https://apps.apple.com/tr/app/fitwell/id1585813475?l=tr
- MFP 2018 veri sızıntısı: https://www.cnbc.com/2018/03/29/under-armour-stock-falls-after-company-admits-data-breach.html
- Samsung Health ilaç ve yemek güncellemesi: https://www.samsungmobilepress.com/articles/samsung-health-app-update-makes-accessing-health-records-managing-medications-and-food-tracking-easier
- Google Fit'ten Health Connect'e geçiş: https://developer.android.com/health-and-fitness/health-connect/migration/fit
- Google Play sağlık uygulaması beyanı: https://support.google.com/googleplay/android-developer/answer/14738291?hl=en ve sağlık içerik politikası: https://support.google.com/googleplay/android-developer/answer/16679511?hl=en
- JEFIT Elite: https://cdn.jefit.com/elite
- StepsApp Pro: https://steps.app/support/pedometer/android/purchase/which-extra-features-are-included-in-the-pro-version
- Lose It BBB şikâyetleri: https://www.bbb.org/us/ma/boston/profile/mobile-apps/lose-it-0021-188207/complaints
- Zepp Life yorumları: https://apps.apple.com/us/app/zepp-life-formerly-mifit/id938688461?see-all=reviews&platform=iphone

**İkincil (rakip ya da SEO blogları, bağımsız olarak doğrulanmadı)**
- MFP fiyatı: https://www.fitbudd.com/post/myfitnesspal-app-cost , barkodun ücretli olması: https://nutrola.app/en/blog/why-did-myfitnesspal-remove-barcode-scanning
- MacroFactor: https://www.bentobunny.app/guides/macrofactor-cost , https://nutrola.app/en/blog/what-do-reddit-users-say-about-macrofactor-2026
- Cronometer: https://nutriscan.app/blog/posts/cronometer-pricing-2026-basic-vs-gold-vs-pro-b28e621201 , https://calorie-trackers.com/reviews/cronometer/
- Yazio: https://www.bentobunny.app/reviews/yazio-review
- Lose It: https://nutrola.app/en/blog/why-is-lose-it-so-expensive-now
- FatSecret: https://calorierankings.com/reviews/fatsecret/ , https://nutriscan.app/blog/posts/fatsecret-premium-pricing-2026-monthly-yearly-eb76d29acc
- Hevy ve Strong: https://www.sensai.fit/blog/hevy-review-2026 , https://www.sensai.fit/blog/hevy-vs-strong-2026 , https://prpath.app/blog/strong-vs-hevy-2026.html
- Fitbod: https://www.sensai.fit/blog/fitbod-review-2026
- Pacer: https://motion-app.com/compare/pacer-alternatives/
- Ekşi Sözlük (yalnızca arama özeti, sayfa 403 döndü): https://eksisozluk.com/myfitnesspal--2763729
