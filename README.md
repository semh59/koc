# NeoWell: sağlığın yeni kaynağı

![NeoWell](assets/logo.png)

Kişisel diyet, spor ve sağlık günlüğü.

Hesapsız, reklamsız, kayıtları sadece senin telefonunda duran Android uygulaması (Android 7 / API 24 ve üstü). Çekirdek özellikler internetsiz çalışır; Koç ve barkod araması internet ister. Alt menüde beş sabit sekme var: Bugün, Salon, Trend, Koç, Daha fazla.

- **Bugün:** kalan kalori ve su halkaları, hızlı kayıt (su, yemek, kilo, spor, not), uyku, ruh hali, oruç, vücut ölçüleri, bekleyen işler listesi.
- **Yemek:** 700'den fazla Türk yemeği ve besin, barkod, etiket fotoğrafından okuma, kendi besinin, tarifin, favorin ve öğün şablonların.
- **Salon:** set, tekrar ve ağırlık takibi, rekorlar, bir sonraki antrenman için ağırlık önerisi, 324 hareketlik kütüphane, hazır programlar, şablonlar, sesli rehberli antrenman.
- **Trend:** kilo trendi, gerçek verinden harcama ve kalori hedefi önerisi, haftalık rapor, PDF ve CSV dışa aktarma.
- **Daha fazla:** adım sayar ve yürüyüş/koşu algılama, ilaç hatırlatıcı, tansiyon ve şeker kaydı, tahlil takibi, ayarlar, gizlilik. Kapalı modüller listede gri durur, Ayarlar > Modüller'den açılır.
- **Koç:** isteğe bağlı yapay zekâ sohbeti (aşağıda).
- Hatırlatma bildirimleri ve ana ekran widget'ı (kalan kalori, su, adım, "+250 ml").

NeoWell tıbbi cihaz değildir, tanı koymaz ve tedavi önermez; hekim yerine geçmez.

## APK'yı almak (yaklaşık 10 dakika, ücretsiz)

1. https://github.com adresinde hesabın yoksa aç.
2. Sağ üstteki **+** ile **New repository** de. İsim olarak `koc` yaz, **Private** seç ve oluştur.
3. Açılan boş depoda **uploading an existing file** bağlantısına tıkla. Bu klasörün **içindekileri** sürükle: `www`, `scripts`, `assets`, `tools`, `docs`, `e2e`, `signing`, `.github`, `package.json`, `package-lock.json`, `capacitor.config.json`, `.gitignore`, `.gitattributes`. `node_modules`, `android` ve `test-results` klasörlerini yükleme. Klasörün kendisini değil, içindekileri yükle. Depo mutlaka **Private** kalmalı. **Commit changes** de.
   - `.github` gizli klasör olduğu için dosya yöneticisinde görünmeyebilir. Mac'te Cmd+Shift+. ile, Windows'ta Görünüm > Gizli öğeler ile göster. Telefondan yüklüyorsan bunu bilgisayardan yapmak daha rahat.
   - `tools` ve `docs` da gerekli: testler besin listesini ve belge metinlerini bunlarla karşılaştırır, eksikse derleme durur.
4. **Release imza anahtarını** GitHub'a gizli değişken olarak ekle: derleme bu anahtar yoksa bilerek durur (herkesçe bilinen debug anahtarıyla imzalı APK yayınlanmasın diye). Hangi dört değişken ve nasıl ekleneceği: [docs/dagitim.md](docs/dagitim.md). Anahtar depoda değil, senin yedeğinde durur; `signing` klasöründe yalnız CI içi deneme için herkesçe bilinen bir debug anahtarı vardır, güncelleme imzası değildir.
5. Depoda **Actions** sekmesine geç. "APK derle" çalışmaya başlamış olmalı. Başlamadıysa soldan **APK derle**, sonra **Run workflow** de. Testler, derleme ve denetimler dahil birkaç dakika sürer; yanında yeşil tik çıkınca bitmiştir.
6. Telefonunun tarayıcısında deponun ana sayfasına git, sağdaki **Releases** bölümünden **NeoWell (son sürüm)** e gir ve `neowell.apk` dosyasını indir. (Depo Private olduğu için GitHub'a giriş yapman istenir.) `neowell.aab` dosyası Google Play yüklemesi içindir, telefona kurulmaz.
7. İndirilen dosyaya dokun. Android "bilinmeyen kaynaklardan yükleme" izni isteyecek, bu uygulama için izin ver ve kur. Google Play Protect "uygulama taranmadı" uyarısı gösterirse **Yine de yükle** de, uygulamayı sen derledin.
8. İlk açılışta kısa kurulum (boy, kilo, yaş, hedef) çıkar. NeoWell 18 yaş ve üzeri içindir: 18'den küçük yaş girilirse kurulum ilerlemez ve bilgi kaydedilmez. Bildirim iznini onayla.

## Yemek eklemek

Yemek ekle penceresinde besin adını yazarak ara (mercimek çorbası, simit, baklava…). Besini seçince porsiyonu ve kaç porsiyon olduğunu belirle, kalori, protein, karbonhidrat ve yağ otomatik hesaplanır. Bugün ekranında günün makroları ve protein aralığın görünür. Listede 700'den fazla yaygın Türk yemeği, öğün ve besin var. Değerler yaklaşıktır (100 g başına yuvarlak sayılar), kesin ölçüm yerine geçmez; bazı yemeklerde (mantı, pilav gibi) tek sayı yerine aralık gösterilir. Listede olmayanı kendin yazabilir, tarif oluşturabilir ya da paket etiketini fotoğraflayıp değerleri okutabilirsin (yazı tanıma telefonda yapılır, fotoğraf saklanmaz). Koç'a "pizza kaç kalori" gibi bir besin sorarsan altında **Listeme ekle** düğmesi çıkar, böylece besin bir sonraki sefer aramada "Benim besinim" olarak, diğerlerinden önce görünür. Koç'un kayıt önerisini onayladıktan sonra **Yemeği listeme kaydet** ile de aynısı yapılır. Bu değerler yapay zekâ tahminidir, bir porsiyon için yaklaşık sayıdır. İstemediğin besini porsiyon penceresinden silebilirsin.

## Barkod okutmak

Yemek ekle penceresinde **Barkod okut**'a dokun, paketin barkodunu göster. Ürün [Open Food Facts](https://world.openfoodfacts.org) (topluluk veritabanı, ODbL lisansı) üzerinden aranır; internete yalnız barkod numarası çıkar. Kalori, protein, karbonhidrat ve yağ değerleri birbiriyle tutarlıysa ürün otomatik olarak listene kaydolur ve bir dahaki sefer internetsiz bulunur. Değerler eksikse ürün yalnızca o seferlik kullanılır, tutarsızsa ya da ürün bulunamazsa etiketteki değerleri elle yazman, etiketi fotoğraflaman ya da Koç'a sorman istenir. Türkiye'deki ürünlerin hepsi veritabanında yok, kapsam Eti gibi büyük markalarda daha iyi. Gerekli Google barkod modülü kurulumda iner, ilk kullanımda indirilmediyse bir dakika sonra tekrar dene.

## Koçu açmak (API anahtarı girmek)

Koç, kullanıcının kendi anahtarıyla bir yapay zekâ servisine bağlanır. Hazır gelenler: NVIDIA Build, Groq, OpenRouter, Google Gemini (ücretsiz katmanlı), OpenAI ve Anthropic Claude (ücretli: kullandıkça sağlayıcı sana ücret yazar). Koç yalnız yaşını girip 18 yaş ve üzerinde olduğunu belirttiysen (Ayarlar > Profil), senin açık rızanla ve yalnız sen bir düğmeye bastığında (mesaj gönder, günlük ya da haftalık yorum iste, menü ya da program iste) veri gönderir. Uygulama açılırken ya da arka planda kendiliğinden hiçbir şey gönderilmez.

1. Anahtar al: Koç sekmesinde ya da Ayarlar > **Yapay zekâ koç** altında **Anahtar ekle** (ya da **Koçu etkinleştir**) de, listeden sağlayıcını seç; **"… anahtarı nereden alınır?"** rehberi adımları gösterir. Adresler: NVIDIA Build https://build.nvidia.com (**Get API Key**), Groq https://console.groq.com (**API Keys**), OpenRouter https://openrouter.ai (**Keys**). Bu üçü ücretsiz hesapla anahtar verir; OpenAI ve Anthropic ücretlidir.
2. Anahtarı yapıştır, sağlayıcı tanınır. **Doğrula ve modelleri getir** ile önerilen modeli seç (bu adımda yalnız anahtarın ve sabit bir deneme cümlesi sağlayıcıya gider, sağlık verin gitmez), **Test et ve kaydet** de.
3. Test "Çalışıyor" derse Koç sekmesine geç. İlk seferde **Açık rızamı veriyorum** onayı çıkar: neyin kime gideceği ve yurt dışına aktarım olduğu orada yazar. Rızayı Ayarlar > Gizlilik ve veri'den istediğin an geri alabilirsin; vermezsen uygulama tam çalışır, yalnız Koç kapalı kalır.

Notlar:
- Anahtarlar telefonda durur ve Android Keystore'daki, telefondan çıkarılamayan bir anahtarla şifrelenir. Yedek dosyasına yalnız yedek parolasıyla şifrelenmiş olarak girer. Telefon değiştirirsen ya da Android bulut yedeğinden geri yüklersen Keystore anahtarı taşınmaz; yedek dosyasını parolayla geri yüklersen anahtarlar da gelir, yoksa yeniden girmen istenir.
- Model adları ve ücretsiz limitler zamanla değişir. Test hata verirse **Modelleri getir** ile listeden güncel bir model seç.
- Google Gemini kapalı gelir, çünkü ücretsiz katmanda istemler ürün geliştirmek için kullanılabilir. Açarsan her göndermeden önce onay ister.
- Sohbetler ayrıdır: **Yeni sohbet** açık sohbeti geçmişe arşivler, **Geçmiş** listesinden eski sohbeti açabilir ya da silebilirsin. Modele yalnız açık sohbet gider.
- 18 yaş altı, sağlık notu girilmiş ya da BMI'si düşük kullanıcılara kalori açığı önerilmez; öneri bakım düzeyinde kalır.
- Koç hekim değildir. Baş dönmesi, göğüs ağrısı gibi belirtilerde uygulama kendi güvenlik kartını gösterir ve 112'yi önerir. Tansiyon ve şeker kaydında bugün tarihli çok uç bir değer girersen de cihazı kontrol etmen ve belirtin varsa 112'yi araman söylenir; bu bir tanı değil, uyarıdır.
- Su, kilo, yemek, spor ve salon kayıtları internet ve anahtar olmadan çalışmaya devam eder.

## Güncelleme

Depoya (`main` dalına) her değişiklik yüklediğinde (örneğin GitHub'da `www/index.html` dosyasını düzenleyip kaydettiğinde) APK kendiliğinden yeniden derlenir. Her derleme aynı release anahtarıyla imzalandığı için yeni APK'yı eskisinin üstüne kurabilirsin, veriler silinmez. Yine de güncellemeden önce Ayarlar'dan yedek al. İmza ve yayın akışı: [docs/dagitim.md](docs/dagitim.md).

**Önemli:** Release imzasından (Ekim 2026) önce kurduğun sürüm debug anahtarıyla imzalıdır, Android yenisini üstüne kurmaz. Bir kereliğine yedek al, eski uygulamayı sil, yenisini kur, yedeği geri yükle.

## Bilmen gerekenler

- Veriler yalnızca telefonda durur. Uygulamayı silersen kaybolur. Android'in otomatik yedeği ve telefondan telefona aktarım NeoWell verisini bilerek içermez. Ayarlar > **Yedekle veya geri yükle** ile yedeği dosya olarak paylaş (Drive, WhatsApp, e-posta) ya da metni kopyala. Yedek parolası zorunludur ve her yedek bu parolayla şifrelenir; API anahtarların da içine girer (telefon değiştirirken işe yarar). Parolayı unutursan yedek açılmaz, kurtarma yolu yoktur. Geri yüklerken **Dosyadan oku** ile dosyayı seçebilirsin. İstersen **Otomatik yedek** ile seçtiğin bir klasöre haftalık yedek yazılır. 14 günden uzun süredir yedek dosyası almadıysan Bugün ekranında hatırlatma çıkar.
- Ayarlar > Gizlilik ve veri'den kategori kategori silebilirsin; profil, kendi besinlerin, favorilerin ve şablonların yalnız Ayarlar > Veri ve yedek > **Tüm verileri sil** ile gider.
- Su ve diğer hatırlatmalar sabit metinlidir ve uygulama kapalıyken de gelir. İlaç bildirimi ve alarm ekranı varsayılan olarak ilaç adını ve dozunu göstermez ("İlaç saatin geldi."); Ayarlar > İlaç hatırlatıcı > "İlaç adı bildirimde görünsün" ile açarsan kilit ekranında da görünür. Saatleri ve hangilerinin açık olacağını Ayarlar'dan değiştirebilirsin.
- Bildirimler hiç gelmiyorsa telefon ayarlarında NeoWell için bildirim iznini ve pil ayarlarında "kısıtlama yok" seçeneğini kontrol et. Bazı telefonlar (Xiaomi, Huawei, Samsung) arka plan bildirimlerini agresif keser.
- Hatırlatmaların tam saatinde gelmesi için uygulama "Alarmlar ve hatırlatıcılar" iznini kullanır. Android 14 ve üstünde yeni kurulumda bu izin kapalı gelir: ilaç eklediysen Bugün listesinde ve Ayarlar > Hatırlatmalar'da çıkan **İzin ver** düğmesi sistem ekranını açar. İzin verilmezse hatırlatmalar yaklaşık saatte, birkaç dakika sapmayla gelir.
- İlaç alarmı dozda alarm sesiyle çalar ve telefon kilitliyken ekranı birkaç saniye yakar (bunun için ekran uyandırma izni kullanılır, veri toplamaz). Xiaomi'de "Kilit ekranında göster", Otomatik başlat ve Pil: Kısıtlama yok açık olmalı.
- Adım sayar için fiziksel aktivite izni gerekir. Yürüyüş başlatınca adım uzunluğunu öğrenmek için kısa süreli konum ölçümü yapılabilir (yalnız uygulama açıkken başlatılan yürüyüşte, arka planda konum istenmez, rota saklanmaz).
- Uygulama adı ve paket adı NeoWell (`com.neowell.app`) olarak değişti. Eski "Koç" uygulaması ayrı bir uygulama sayılır: önce eskisinden yedek al, NeoWell'i kur, yedeği geri yükle, sonra eskisini sil. (Yapay zekâ sohbet sekmesinin adı Koç olarak kaldı.)
- APK ve Play'e yüklenecek AAB release (Play upload) anahtarıyla imzalıdır; anahtar depoda değil, GitHub gizli değişkenlerinde ve sahibinin yedeğindedir.
- Gizlilik politikası taslağı: [docs/gizlilik-politikasi.md](docs/gizlilik-politikasi.md). Yayın öncesi doldurulacak alanlar ve bekleyen işler: [docs/yapilacaklar.md](docs/yapilacaklar.md).

## Geliştirme ve testler

```
npm ci
npm test              # birim ve arayüz testleri (jsdom); CI'da her derlemede çalışır
npm run test:e2e      # Playwright ile tarayıcıda uçtan uca senaryolar (ilk seferde: npx playwright install chromium)
npm run test:saat     # testleri farklı sahte saat ve saat dilimleriyle yeniden çalıştırır
```

CI (`.github/workflows/apk.yml`) önce `npm test` ve adım sayacı Java testlerini çalıştırır, sonra Android projesini oluşturup APK ve AAB derler, imzayı, manifest izinlerini, hedef API 36'yı ve 16 KB hizasını denetler. Elle çalıştırmada (Run workflow) emülatörde açılış denemesi (smoke) de koşar. Ayrıntı: [docs/dagitim.md](docs/dagitim.md).

## Bilgisayarda hızlı deneme

`www/index.html` dosyasını tarayıcıda açman yeterli. Kayıt, grafik, Salon ve Koç arayüzü çalışır; barkod, etiket okuma, adım sayar, bildirim ve ilaç alarmı, widget ve Keystore gibi Android'e özgü özellikler yalnız telefonda çalışır.
