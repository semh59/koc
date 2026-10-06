# NeoWell Gizlilik Politikası ve KVKK Aydınlatma Metni

> **Bu metin hukuki danışmanlık değildir.** Uygulamanın gerçek davranışından (kod ve izin listesi) çıkarılmış bir taslaktır. Yayınlamadan önce bir hukukçuya gösterilmesi önerilir (açık karar: G7, `docs/yol-haritasi.md`). Köşeli parantezli `[DOLDURULACAK: ...]` alanları yayın öncesi **mutlaka** doldurulmalıdır; hiçbiri uydurulmamıştır.

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
| Sağlık verisi (özel nitelikli) | kilo, vücut ölçüleri (bel, kalça vb.), yemek ve su kayıtları, spor ve antrenman setleri, adım ve hareket, tahlil sonuçları, tansiyon ve şeker ölçümleri, ilaç adı-doz-saat-alım kaydı ve stok, uyku, ruh hali, oruç, kullanıcının yazdığı sağlık notu |
| Kullanıcı içeriği | kendi tarifleri, besinleri, favorileri, öğün ve antrenman şablonları |
| Notlar ve Koç sohbeti | kullanıcının yazdığı notlar, Koç ile mesajlar |
| Cihaz | bildirim izni durumu; yalnız elle başlattığın yürüyüşte, uygulama açıkken başlayan kısa konum ölçümü (iyi sinyalde yaklaşık 1 dakika, en çok 10 dakika; sürerken bildirim görünür; yalnız öğrenilen adım uzunluğu saklanır, konum noktası ve rota saklanmaz; arka planda konum istenmez); kamera (etiket ve tahlil fotoğrafı telefonda okunur, fotoğraf saklanmaz ve gönderilmez) |
| Koç anahtarı | kullanıcının kendi API anahtarı; yalnız telefonda, Android Keystore ile şifreli saklanır, yedeğe yalnız yedek parolayla şifrelenirse girer |

## 3. İşleme amaçları
Kişisel sağlık günlüğü, hedef ve kalori hesabı, hatırlatma bildirimleri, grafik ve raporlar (PDF/CSV), kullanıcı isterse yapay zekâ destekli Koç sohbeti. Veri reklam, profilleme ya da satış için kullanılmaz.

## 4. Hukuki sebep
- Uygulamanın temel işlevleri (kayıt, grafik, hatırlatma): veri yalnızca kullanıcının cihazında, kullanıcının kendi eylemiyle işlenir.
- **Koç ile veri paylaşımı ve yurt dışına aktarım: kullanıcının açık rızası.** Rıza uygulama içinde, ne gönderileceği, kime gideceği ve yurt dışına aktarım olduğu açıkça yazılarak sorulur; her an geri alınabilir; verilmezse uygulama tam çalışır. Rıza metni sürümlenir; metin değişirse rıza yeniden istenir.
- [DOLDURULACAK: hukukçu onayı: özel nitelikli veri ve yurt dışı aktarım için hukuki sebep ifadesi]

## 5. Alıcılar ve yurt dışına aktarım
Kullanıcının telefonundan internete çıkan tek veri akışları:

| Hizmet | Ne gider | Ne zaman |
|---|---|---|
| Open Food Facts (açık veri tabanı) | Yalnızca barkod numarası (ve her internet isteğinde olduğu gibi IP adresi) | Kullanıcı barkod okutursa |
| Koç sağlayıcısı: NVIDIA Build, Groq, OpenRouter, Google Gemini, OpenAI, Anthropic Claude ya da kullanıcının kendi eklediği OpenAI uyumlu servis (OpenAI ve Anthropic ücretlidir, ücreti kullanıcı sağlayıcıya öder) | Aşağıdaki "Koç'a gönderilenler" listesi; ayrıca kullanıcının API anahtarı (yalnızca kimlik doğrulama). Kurulumda, onaydan önce de, yalnız anahtar ve sabit bir deneme cümlesi gider (model listesi ve bağlantı denemesi); sağlık verisi gitmez | Yalnızca açık rıza verilmişse ve kullanıcı Koç'u kullandığında (otomatik günlük/haftalık yorumlar dahil). 18 yaş altında hiç gönderilmez. Sağlayıcıların sunucuları yurt dışındadır; bu bir yurt dışına aktarımdır. Gemini'de her gönderimden önce ayrıca onay sorulur. |
| Google barkod tarayıcı (Google Play hizmetleri, ML Kit) | NeoWell görüntüyü almaz; görüntü telefonda işlenir. Google kendi koşullarına göre kullanım ve tanılama bilgisi toplayabilir. | Barkod okutulurken |
| Google Drive ya da başka paylaşım hedefi | Kullanıcının kendi seçtiği dosya (yedek parolayla şifrelenir; PDF/CSV şifresizdir) | Yalnızca kullanıcı "paylaş" derse |

**Koç'a gönderilenler** (uygulama içindeki onay metniyle aynıdır): yazdığın mesajlar ve son 10 sohbet mesajı (Koç yanıtları dahil); profilin (boy, yaş, cinsiyet, hareket düzeyi); sağlık notun; hedeflerin ve hesaplanan değerler (trend kilo, tahmini harcama, protein aralığı); son 14 günün kilo, yemek (kcal ve protein), su, spor ve adım özeti (varsa uyku ve ruh hali); bugünkü kayıtların (yemek adları, su, tartı, spor ve not metinleri); son 3 antrenman (hareket adları, en iyi set) ve bu haftaki bölge başına set sayıları; son 7 günün en çok 3 notu; ilaç modülü açıksa ilaç adı, doz, saatler, haftanın günleri, son 7 günün uyumu ve stok; menü ya da program istersen yazdığın istek notu ve menü kataloğunda kendi besin, favori ve şablon adların (kalori ve protein değerleriyle).

**Koç'a gönderilmeyenler:** Tahlil, tansiyon, şeker, vücut ölçüleri, tarifler, oruç kayıtları, fotoğraf, konum ve yedek gönderilmez.

Her sağlayıcı kendi gizlilik politikasından sorumludur; kullanıcı kendi hesabıyla ve kendi anahtarıyla bağlandığından o sağlayıcıyla ilişki kullanıcıdadır. [DOLDURULACAK: sağlayıcı politikalarına bağlantılar]

## 6. Saklama süresi
Veriler telefonda, kullanıcı silene ya da uygulamayı kaldırana kadar durur. Ayarlar > Gizlilik ve veri'den kategori bazında, Ayarlar > Veriler'den tamamen silinebilir. Koç sağlayıcısına gönderilmiş veriye o sağlayıcının saklama politikası uygulanır; NeoWell bunu silemez. Yedek ve dışa aktarılan dosyalar kullanıcının seçtiği yerde durur ve oradan silinmesi kullanıcıya aittir. Veriler Android otomatik yedeğine ve cihazlar arası aktarıma bilerek dahil edilmez.

## 7. İlgili kişinin hakları (KVKK md. 11)
Kişisel verilerinizin işlenip işlenmediğini öğrenme, bilgi talep etme, amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde/dışında aktarıldığı kişileri bilme, düzeltme, silme/yok etme, bunların aktarıldığı kişilere bildirilmesini isteme, otomatik analiz sonucuna itiraz etme ve zarar halinde giderim talep etme haklarına sahipsiniz.

Pratikte: veriler cihazınızdadır; **tablo (CSV) dışa aktarma ile kopyasını alabilir**, **kategori bazlı silme ile verinizi silebilir**, **Koç rızasını Ayarlar'dan geri alabilirsiniz**. Bunun dışındaki talepler için: [DOLDURULACAK: BAŞVURU YOLU, ör. e-posta, yanıt süresi].

## 8. Çocuklar
NeoWell 18 yaş altına yönelik değildir. Profilde 18 yaş altı bir yaş girilirse Koç veri paylaşımı (yurt dışı aktarım) uygulamada kapalı tutulur. [DOLDURULACAK: 18 yaş altı kullanıcı politikası, Play Aile politikası beyanı]

## 9. Güvenlik
Veriler yalnız uygulamanın özel depolamasındadır; API anahtarları Android Keystore ile şifrelenir; Google Drive'a gönderilen ve otomatik yedek her zaman parolayla şifrelenir (parola zorunlu, en az 6 karakter); paylaş/kopyala yedeğinde parola isteğe bağlıdır ve boş bırakılırsa dosya düz metindir. Cihazınızı ekran kilidiyle korumanız önerilir.

## 10. Tıbbi uyarı
NeoWell tıbbi cihaz değildir, tanı koymaz ve tedavi önermez; hekim yerine geçmez. Sağlık kararları için hekiminize danışın. Koç yanıtları genel bilgidir.

## 11. Değişiklikler
Metin değişirse uygulama içinde duyurulur; Koç onay metni değişirse (sürüm 2: gönderilen verilerin tam listesi) eski onay düşer ve yeniden istenir. Güncel metin: [DOLDURULACAK: yayın URL'si]

---

# NeoWell Privacy Policy (short English version)

> Not legal advice. Fields marked `[TO BE FILLED]` must be completed before publication.

**Controller:** [TO BE FILLED: NAME / ADDRESS / CONTACT E-MAIL]. NeoWell has no servers, accounts, ads or analytics.

**Where data lives:** all entries (profile, weight, food, water, workouts, steps, lab results, blood pressure and glucose, medication log, sleep, mood, fasting, notes, coach chat) stay only on your phone. Location is used only during a walk you start yourself, for a short GPS measurement that begins while the app is open (a notification is shown while it runs, at most 10 minutes); only the learned step length is kept, no location points or routes. Background location is not requested. Backups, PDF and CSV files go only where you choose to share them. They are excluded from Android auto-backup.

**What goes online:** (1) Open Food Facts: only the barcode number you scan. (2) The AI Coach, only if you give explicit consent and add your own API key: your chat messages, profile, health note, goals, the last 10 chat messages, a 14-day summary of weight/food/water/sport/steps (and sleep/mood if present), today's entries (including meal names), recent workouts and weekly set counts, recent notes, medication names, doses, times, weekdays, 7-day adherence and stock if that module is on, and, when you ask for a menu or program, your request note plus the names of your own foods, favourites and templates in the menu catalogue, to the provider you selected (NVIDIA Build, Groq, OpenRouter, Google Gemini, OpenAI, Anthropic Claude or a custom one; OpenAI and Anthropic are paid services billed to you by the provider). During setup, even before consent, only your key and a fixed test sentence are sent (model list and connection test); no health data. These servers are outside Turkey; this is a cross-border transfer based on your consent. Lab results, blood pressure, glucose, body measurements, recipes, fasting records, photos, location and backups are never sent. You can withdraw consent at any time (Settings > Privacy and data) and the app works fully without it. (3) Google's barcode scanner (Play services): NeoWell never receives the image; Google may collect usage and diagnostics under its own terms. (4) Google Drive only if you share a backup there.

**Your rights (KVKK art. 11):** export your data as CSV, delete it by category in the app, withdraw consent; other requests: [TO BE FILLED: CONTACT].

**Children:** not intended for users under 18; Coach data sharing is disabled for ages under 18.

**Medical:** NeoWell is not a medical device, does not diagnose or recommend treatment.
