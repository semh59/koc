# NeoWell Gizlilik Politikası ve KVKK Aydınlatma Metni

> **Bu metin hukuki danışmanlık değildir.** Uygulamanın gerçek davranışından (kod ve izin listesi) çıkarılmış bir taslaktır. Yayınlamadan önce bir hukukçuya gösterilmesi önerilir (açık karar: G7, `docs/roadmap.md`). Köşeli parantezli `[DOLDURULACAK: ...]` alanları yayın öncesi **mutlaka** doldurulmalıdır; hiçbiri uydurulmamıştır. Her alanın kimden hangi bilgiyle doldurulacağı: `docs/todo.md` > "Doldurulacaklar".

Son güncelleme: [DOLDURULACAK: yayın tarihi] · Uygulama sürümü: [DOLDURULACAK]

## 1. Veri sorumlusu (6698 sayılı KVKK md. 10)
- Ad / unvan: [DOLDURULACAK: AD]
- Adres: [DOLDURULACAK: ADRES]
- İletişim (e-posta): [DOLDURULACAK: İLETİŞİM E-POSTASI]
- KEP / VERBİS bilgisi (varsa): [DOLDURULACAK]

NeoWell'in kendi sunucusu, kullanıcı hesabı ya da reklam/analitik altyapısı yoktur. Verilerin büyük bölümü yalnızca kullanıcının telefonunda işlenir ve geliştiriciye ulaşmaz (bkz. bölüm 5 ve 6).

## 2. İşlenen veri kategorileri
Hepsini kullanıcı kendisi girer ya da telefon sensörlerinden, kullanıcının verdiği izinle alınır:

| Kategori | İçerik |
|---|---|
| Profil | boy, yaş, cinsiyet (isteğe bağlı), hareket düzeyi, hedefler |
| Yakın kişi numarası | isteğe bağlı; "Yakınıma haber ver" için girilen telefon numarası yalnız telefonda durur, hiçbir yere gönderilmez; uygulama mesaj göndermez, mesaj uygulamasını numara ve metinle açar, göndermek kullanıcıya kalır |
| Sağlık verisi (özel nitelikli) | kilo, vücut ölçüleri (bel, kalça vb.), yemek ve su kayıtları, spor ve antrenman setleri, adım ve hareket, tahlil sonuçları, tansiyon ve şeker ölçümleri, nabız (kamerayla ölçtüğün ya da saatinden gelen), ilaç adı-doz-saat-alım kaydı ve stok, uyku, ruh hali, oruç, isteğe bağlı döngü (dönem günleri, akış, belirti, kısa not) kaydı, kullanıcının yazdığı sağlık notu |
| Kullanıcı içeriği | kendi tarifleri, besinleri, favorileri, öğün ve antrenman şablonları |
| Notlar ve Rehber sohbeti | kullanıcının yazdığı notlar, Rehber ile mesajlar (açık sohbet ve geçmişe arşivlenmiş ayrı sohbetler; modele yalnız açık sohbet gider) |
| Cihaz | bildirim izni durumu; yalnız elle başlattığın yürüyüşte ya da Ramazan modunda "Konumumu kullan"a dokunduğunda, uygulama açıkken kısa konum ölçümü (Ramazan modunda konum yaklaşık 1 km'ye yuvarlanıp yalnız telefonda saklanır ve gönderilmez, "Konumu sil" ile silinir; iyi sinyalde yaklaşık 1 dakika, en çok 10 dakika; sürerken bildirim görünür; yalnız öğrenilen adım uzunluğu saklanır, konum noktası ve rota saklanmaz; arka planda konum istenmez); kamera ve flaş (etiket ve tahlil fotoğrafı ile parmakla nabız ölçümü telefonda işlenir; görüntü saklanmaz ve gönderilmez, nabız ölçümünde yalnız atım sayısı kaydedilir); Health Connect (isteğe bağlı: saatinin adım, uyku ve nabız verisi Samsung Health gibi uygulamalar üzerinden okunur; NeoWell Health Connect'e hiçbir şey yazmaz); ilaç alarmı saatinde ekranı birkaç saniye uyandıran ekran uyandırma (WAKE_LOCK) izni, hiçbir veri toplamaz ve göndermez |
| Rehber anahtarı | kullanıcının kendi API anahtarı; yalnız telefonda, Android Keystore ile şifreli saklanır, yedeğe yalnız yedek parolayla şifrelenmiş olarak girer |

## 3. İşleme amaçları
Kişisel sağlık günlüğü, hedef ve kalori hesabı, hatırlatma bildirimleri, grafik ve raporlar (PDF/CSV), kullanıcı isterse yapay zekâ destekli Rehber sohbeti. Veri reklam, profilleme ya da satış için kullanılmaz.

## 4. Hukuki sebep
- Uygulamanın temel işlevleri (kayıt, grafik, hatırlatma): veri yalnızca kullanıcının cihazında, kullanıcının kendi eylemiyle işlenir.
- **Rehber ile veri paylaşımı ve yurt dışına aktarım: kullanıcının açık rızası.** Rıza uygulama içinde, ne gönderileceği, kime gideceği ve yurt dışına aktarım olduğu açıkça yazılarak sorulur; her an geri alınabilir; verilmezse uygulama tam çalışır. Rıza metni sürümlenir; metin değişirse rıza yeniden istenir.
- [DOLDURULACAK: hukukçu onayı: özel nitelikli veri ve yurt dışı aktarım için hukuki sebep ifadesi]

## 5. Alıcılar ve yurt dışına aktarım
Kullanıcının telefonundan internete çıkan tek veri akışları:

| Hizmet | Ne gider | Ne zaman |
|---|---|---|
| Open Food Facts (açık veri tabanı) | Yalnızca barkod numarası (ve her internet isteğinde olduğu gibi IP adresi) | Kullanıcı barkod okutursa |
| Ezan vakitleri (ezanvakti.emushaf.net, Diyanet vakit tablosunun internetteki bir kopyası) | En yakın il merkezinin ilçe numarası (yaklaşık bölgeyi gösterir) ve her internet isteğinde olduğu gibi IP adresi; konumun gönderilmez. Tablo yalnız telefondaki hesapla karşılaştırmak için alınır ve telefonda saklanır | Yalnız kullanıcı Ramazan modunda konumunu belirleyip ya da "Doğrula"ya dokunursa |
| Rehber sağlayıcısı: NVIDIA Build, Groq, OpenRouter, Google Gemini, OpenAI, Anthropic Claude ya da kullanıcının kendi eklediği OpenAI uyumlu servis (OpenAI ve Anthropic ücretlidir, ücreti kullanıcı sağlayıcıya öder) | Aşağıdaki "Rehber'e gönderilenler" listesi; ayrıca kullanıcının API anahtarı (yalnızca kimlik doğrulama). Kurulumda, onaydan önce de, yalnız anahtar ve sabit bir deneme cümlesi gider (model listesi ve bağlantı denemesi); sağlık verisi gitmez | Yalnızca açık rıza verilmişse ve yalnız kullanıcı bir düğmeye bastığında (mesaj, yorum, menü, program isteği); otomatik, açılışta ya da arka planda gönderim yoktur. 18 yaş altında hiç gönderilmez. Sağlayıcıların sunucuları yurt dışındadır; bu bir yurt dışına aktarımdır. Gemini'de her gönderimden önce ayrıca onay sorulur. |
| Google barkod tarayıcı (Google Play hizmetleri, ML Kit) | NeoWell görüntüyü almaz; görüntü telefonda işlenir. Google kendi koşullarına göre kullanım ve tanılama bilgisi toplayabilir: ML Kit'in yayımladığı açıklamaya göre cihaz bilgisi (üretici, model, sürüm) ve kuruluma özel, kullanıcıyı ya da cihazı tek başına tanımlamayı amaçlamayan bir tanımlayıcı ([kaynak](https://developers.google.com/ml-kit/android-data-disclosure)). NeoWell'in bu veriye erişimi ve denetimi yoktur. | Barkod okutulurken; benzer tanılama Google Play hizmetleri bileşenlerinde (etkinlik tanıma, yazı tanıma) de olabilir (doğrulanmadı) |
| Google Drive ya da başka paylaşım hedefi | Kullanıcının kendi seçtiği dosya (yedek parolayla şifrelenir; PDF/CSV/JSON arşiv şifresizdir; döngü kaydı bu dosyalara girmez) | Yalnızca kullanıcı "paylaş" derse |

Uygulamanın kendi gönderdiği her internet isteği (zaman, tür, adres, gövde boyutu; içerik değil) son 30 gün için Gizlilik ve veri ekranında listelenir ve silinebilir. Defter yalnız bu telefonda kalır, yedeğe girmez. Google hizmetlerinin (barkod okuyucu, metin tanıma) trafiği bu listede görünmez.

**Rehber'e gönderilenler** (uygulama içindeki onay metniyle aynıdır): yazdığın mesajlar ve son 10 sohbet mesajı (Rehber yanıtları dahil); profil anahtarı açıksa boyun, 5 yıllık yaş aralığın, cinsiyetin, hareket düzeyin ve günlük kalori hedefin; menü ya da program istersen yazdığın istek notu, program için seçtiğin gün, süre, ekipman ve seviye, menü için hesaplanan protein aralığın ve menü kataloğunda kendi besin, favori ve şablon adların (kalori ve protein değerleriyle).

**Rehber'e ne zaman gider:** Yalnız sen bir düğmeye bastığında gönderilir (mesaj gönder, menü ya da program iste); uygulama açılırken ya da arka planda kendiliğinden hiçbir şey gönderilmez.

**Kimlik maskeleme:** Rehber sağlayıcısı IP adresini görür; kimlik bilgileri (ad, telefon, e-posta, TC kimlik no, IBAN, kart, adres, doğum tarihi, il/ilçe, kurum adı gibi) göndermeden önce telefonda maskelenir ve yanıt yine telefonda geri çevrilir. Maskeleme sağlayıcıya giden her isteğin tek çıkış noktasında yapılır; sabit kural metni dışındaki bütün içerik (profil, kayıtlar, sohbet geçmişi, menü/program isteği) süzülür. Filtre %100 garanti değildir (tam garanti yoktur). Yakalanmayanlar: serbest cümleyle anlatılan adres ya da tarif ("markete yakın mavi kapılı apartman" gibi), ad listesinde olmayan nadir adlar (listede olmayan bir ad "Ben/annem" gibi kalıp olmadan küçük harfle yazılırsa), tek başına yazılmış il adı, sıradan sözcükle aynı yazılan küçük harfli adlar, görsel ya da yalnızca bağlamdan tanınabilen bilgi. Sağlık notuna ve besin adına yazdığın metin de aynı filtreden geçer ama aynı sınırlara tabidir. İstenirse Ayarlar > Gizlilik ve veri'deki "Rehber'e giden metni önizle" anahtarıyla gönderimden önce giden tam metin görülür.

**Rehber'e gönderilmeyenler:** Kilo, yemek, su, spor ve antrenman kayıtların, sağlık notun, ilaçların, uyku ve ruh halin, tahlil, tansiyon, şeker, nabız, saatten (Health Connect) gelen veriler, fotoğraf, konum ve yedek gönderilmez.

**İlerleme fotoğrafları:** Eklediğin ilerleme fotoğrafları yalnız telefondaki uygulamanın özel alanında durur; Rehber'e ya da herhangi bir sunucuya gönderilmez, paylaşma seçeneği yoktur, **yedeğe girmez** (telefon değiştirirsen fotoğraflar yeni telefona taşınmaz) ve "İlerleme fotoğrafları" kategorisiyle ya da "Tüm verileri sil" ile silinir.

**Döngü kaydı (isteğe bağlı, varsayılan kapalı):** Yalnız cihazda durur. Rehber'e, bildirim metnine, widget'a ve CSV dışa aktarımına girmez; yalnız parolayla şifrelenen yedeğe dahildir ve Gizlilik ve veri ekranından silinebilir.

Her sağlayıcı kendi gizlilik politikasından sorumludur; kullanıcı kendi hesabıyla ve kendi anahtarıyla bağlandığından o sağlayıcıyla ilişki kullanıcıdadır. [DOLDURULACAK: sağlayıcı politikalarına bağlantılar]

## 6. Saklama süresi
Veriler telefonda, kullanıcı silene ya da uygulamayı kaldırana kadar durur. Ayarlar > Gizlilik ve veri'den kategori bazında (yemek ve su, kilo, spor, adım, ilaç, sağlık ölçümleri, tahlil, uyku/ruh hali/oruç, Rehber sohbeti, notlar, vücut ölçüleri, ilerleme fotoğrafları, tarifler, döngü kayıtları), Ayarlar > Veri ve yedek > Tüm verileri sil ile tamamen silinebilir. Profil (boy, yaş, cinsiyet, hedefler), sağlık notu, kendi besinler, favoriler ve şablonlar kategori listesinde yoktur; bunlar yalnız Tüm verileri sil ile gider (kayıtlı Rehber anahtarları ve güvenlik kopyası da gider). "Rehber sohbeti" kategorisi hem açık sohbeti hem geçmişteki tüm arşivlenmiş sohbetleri siler. Rehber sağlayıcısına gönderilmiş veriye o sağlayıcının saklama politikası uygulanır; NeoWell bunu silemez. Yedek ve dışa aktarılan dosyalar kullanıcının seçtiği yerde durur ve oradan silinmesi kullanıcıya aittir. Veriler Android otomatik yedeğine ve cihazlar arası aktarıma bilerek dahil edilmez.

## 7. İlgili kişinin hakları (KVKK md. 11)
Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/dışında aktarıldığı kişileri bilme, düzeltme, silme/yok etme, bunların aktarıldığı kişilere bildirilmesini isteme, otomatik analiz sonucuna itiraz etme ve zarar halinde giderim talep etme haklarına sahipsiniz.

Pratikte: veriler cihazınızdadır; **tablo (CSV) dışa aktarma ile kopyasını alabilir**, **kategori bazlı silme ya da Tüm verileri sil ile verinizi silebilir**, **Rehber rızasını Ayarlar'dan geri alabilirsiniz**. Bunun dışındaki talepler için: [DOLDURULACAK: BAŞVURU YOLU, ör. e-posta, yanıt süresi].

## 8. Çocuklar
NeoWell 18 yaş ve üzeri içindir; hedef kitle yetişkinlerdir, uygulama çocuklara yönelik değildir ve Play Aile programında yer almaz. İlk kurulumda 18 yaşından küçük bir yaş girilirse kurulum ilerlemez, girilen bilgiler kaydedilmez ve kullanıcı bir yetişkinle ve hekimiyle ya da diyetisyeniyle konuşmaya yönlendirilir. Önceki sürümden kalan ya da sonradan girilen 18 yaş altı profilde Rehber veri paylaşımı (yurt dışı aktarım), kalori açığı ve oruç önerisi kapalı tutulur ve uygulama açılışta bunu bildirir. Yaş hiç girilmemişse de Rehber kapalıdır: kullanıcı yaşını (en az 18) girene kadar Rehber'e veri gitmez. Yaş yalnız kullanıcının beyanıdır, doğrulanmaz.

## 9. Güvenlik
Veriler yalnız uygulamanın özel depolamasındadır; API anahtarları Android Keystore ile şifrelenir; tüm yedekler (Drive'a gönderilen, paylaş/kopyala/indir ve otomatik yedek) her zaman parolayla şifrelenir; parola zorunludur, en az 10 karakterdir ve çok kolay parolalar kabul edilmez. Parola unutulursa yedek açılamaz, kurtarma yolu yoktur. Eski sürümlerden kalmış şifresiz yedekler yalnız geri yüklenebilir. Cihazınızı ekran kilidiyle korumanız önerilir.

## 10. Tıbbi uyarı
NeoWell tıbbi cihaz değildir, tanı koymaz ve tedavi önermez; hekim yerine geçmez. Sağlık kararları için hekiminize danışın. Rehber yanıtları genel bilgidir.

## 11. Değişiklikler
Metin değişirse uygulama içinde duyurulur; Rehber onay metni değişirse (sürüm 3: Rehber yalnız menü, egzersiz programı ve kalori tahmini yapar; gönderilen veri profil ve kalori hedefiyle sınırlandı) eski onay düşer ve yeniden istenir. Güncel metin: [DOLDURULACAK: yayın URL'si]

---

# NeoWell Privacy Policy (short English version)

> Not legal advice. Fields marked `[TO BE FILLED]` must be completed before publication.

**Controller:** [TO BE FILLED: NAME / ADDRESS / CONTACT E-MAIL]. NeoWell has no servers, accounts, ads or analytics.

**Where data lives:** all entries (profile, weight, food, water, workouts, steps, lab results, blood pressure and glucose, medication log, sleep, mood, fasting, notes, coach chat) stay only on your phone. Location is used only during a walk you start yourself, for a short GPS measurement that begins while the app is open (a notification is shown while it runs, at most 10 minutes); only the learned step length is kept, no location points or routes. Background location is not requested. Backups, PDF and CSV files go only where you choose to share them. They are excluded from Android auto-backup. The medication alarm briefly wakes the screen (wake lock, a few seconds); it collects and sends no data.

**What goes online:** (1) Open Food Facts: only the barcode number you scan. (2) The AI Coach, only if you give explicit consent and add your own API key: your chat messages, profile, health note, goals, the last 10 chat messages, a 14-day summary of weight/food/water/sport/steps (and sleep/mood if present), today's entries (including meal names), recent workouts and weekly set counts, recent notes, medication names, doses, times, weekdays, 7-day adherence and stock if that module is on, and, when you ask for a menu or program, your request note plus the names of your own foods, favourites and templates in the menu catalogue, to the provider you selected (NVIDIA Build, Groq, OpenRouter, Google Gemini, OpenAI, Anthropic Claude or a custom one; OpenAI and Anthropic are paid services billed to you by the provider). During setup, even before consent, only your key and a fixed test sentence are sent (model list and connection test); no health data. These servers are outside Turkey; this is a cross-border transfer based on your consent. Lab results, blood pressure, glucose, waist, hip and other body measurements (your height is part of the profile that is sent), recipes, fasting records, photos, location and backups are never sent. Data is sent only when you tap a button (send a message, ask for a comment, menu or program); nothing is sent automatically, at app start or in the background. You can withdraw consent at any time (Settings > Privacy and data) and the app works fully without it. (3) Google's barcode scanner (Play services): NeoWell never receives the image; Google may collect usage and diagnostics under its own terms. (4) Google Drive only if you share a backup there.

**Your rights (KVKK art. 11):** export your data as CSV, delete it by category in the app (the Coach chat category removes the open chat and all archived chats) or everything at once with Settings > Data and backup > Delete all data (profile, health note, own foods and templates go only this way), withdraw consent; other requests: [TO BE FILLED: CONTACT].

**Children:** NeoWell is for adults (18+) and is not directed at children. Setup does not continue when an age under 18 is entered and nothing is saved. For an existing profile under 18, Coach data sharing, calorie deficits and fasting suggestions stay off. The Coach is also off while no age is entered. Age is self-declared and not verified.

**Progress photos and units:** progress photos you add stay in the app's private storage on your phone only (never sent to the Coach or any server, no share option, excluded from backups, deleted with the "Progress photos" category or "Delete all data"); on Android the screen blocks screenshots while the photo section is open. The kg/lb and mg/dL / mmol/L settings only change display and entry; records are stored in kg and mg/dL.

**Watch data and pulse:** optionally NeoWell reads steps, sleep and heart rate from Health Connect (for example from a smartwatch via Samsung Health); it only reads and never writes. The camera pulse measurement uses the camera and flash on your finger; the image is not stored or sent, only the beats-per-minute number is saved on the phone. Pulse is not sent to the Coach or any server. The pulse measurement is not a medical measurement.

**Medical:** NeoWell is not a medical device, does not diagnose or recommend treatment.
