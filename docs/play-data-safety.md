# Play Data safety (Veri güvenliği) formu cevapları

Kaynak: kod (`www/coach.js`, `www/index.html` barkod, `scripts/patch-android.js`), `docs/gizlilik-politikasi.md` bölüm 2 ve 5, `docs/play-izin-beyanlari.md`. Son gözden geçirme: 3 Ekim 2026. Hukukçu/hekim onayı gerektiren noktalar en altta.

Ağ çağrıları (kodda tek tek doğrulandı, başka yok): (1) Koç: `www/coach.js` `fetch` ile NVIDIA Build, Groq, OpenRouter, Google Gemini ya da kullanıcının eklediği https servis; yalnız açık rızayla. (2) Open Food Facts: `www/index.html` barkod araması, yalnız barkod numarası. USDA FoodData Central çalışma anında çağrılmaz, veri uygulamaya gömülüdür. Reklam, analitik, kilit açma/hesap, çökme raporu SDK'sı yok.

## Genel sorular
| Soru | Cevap |
|---|---|
| Uygulama kullanıcı verisi topluyor mu veya paylaşıyor mu? | Evet (Koç özelliği yüzünden, isteğe bağlı) |
| Tüm veri iletim sırasında şifreleniyor mu? | Evet (yalnız https çağrıları; Koç adresi `https://` olmak zorunda) |
| Kullanıcı verinin silinmesini isteyebilir mi? | Evet: uygulama içinde kategori bazlı silme ve Ayarlar > Veriler. Koç sağlayıcısına gönderilmiş veri için NeoWell silme sağlayamaz (sağlayıcının politikası). |
| Gizlilik politikası URL'si | [DOLDURULACAK: yayın URL'si, `gizlilik-politikasi.md` yayınlanınca] |
| Hesap oluşturma yöntemi | Hesap yok ("Uygulama hesap oluşturmaya izin vermez") |

## Veri türü bazında
"Toplanır" = geliştiriciye ya da cihaz dışına gider. Cihazda kalan, hiçbir yere gönderilmeyen veri toplanmış sayılmaz (Play tanımı: yalnız cihazda işlenen ve gönderilmeyen veri bildirilmez).

| Play veri türü | Toplanıyor | Paylaşılıyor | Amaç | İsteğe bağlı mı | Not |
|---|---|---|---|---|---|
| Sağlık bilgisi (kilo, yemek/kalori, su, adım, uyku, ruh hali, ilaç adı-doz-saat ve uyum, sağlık notu) | Evet | Evet (Koç sağlayıcısı) | Uygulama işlevselliği (kullanıcının istediği Koç sohbeti) | Evet, açık rıza; verilmezse hiçbir şey gitmez | Tahlil, tansiyon, şeker, vücut ölçüsü, tarif, oruç Koç'a GİTMEZ |
| Fitness bilgisi (antrenman: son 3 antrenman, hareket adları, set sayıları, spor özeti) | Evet | Evet (Koç sağlayıcısı) | Uygulama işlevselliği | Evet | Aynı rıza |
| Kişisel bilgi: yaş, cinsiyet, boy (profil) | Evet | Evet (Koç sağlayıcısı) | Uygulama işlevselliği | Evet | Play'de "Diğer bilgiler"/ilgili tür altında; boy ve yaş sağlık/fitness altında da beyan edilebilir |
| Mesajlar: diğer uygulama içi mesajlar (Koç sohbeti ve not metinleri) | Evet | Evet (Koç sağlayıcısı) | Uygulama işlevselliği | Evet | Son 10 mesaj + yazılan istek |
| Diğer: API anahtarı | Hayır (geliştiriciye gitmez) | Hayır | n/a | n/a | Anahtar yalnız kimlik doğrulama için seçilen sağlayıcıya gider, Keystore'da saklanır. Play'de kimlik bilgisi türü yok; Koç paylaşımının parçası sayılır |
| Konum (yaklaşık/kesin) | Hayır | Hayır | n/a | n/a | Yalnız elle başlatılan yürüyüşte cihazda işlenir; yalnız adım uzunluğu saklanır, nokta/rota saklanmaz, hiçbir yere gönderilmez |
| Fotoğraf ve video (kamera) | Hayır | Hayır | n/a | n/a | Etiket/tahlil fotoğrafı telefonda yazı tanımayla okunur, saklanmaz ve gönderilmez. Barkod görüntüsünü Google Play hizmetleri işler, NeoWell almaz |
| Bildirimler | Hayır | Hayır | n/a | n/a | Yalnızca yerel hatırlatma; sunucu push yok |
| Uygulama etkinliği, cihaz kimliği, finansal bilgi, kişiler, takvim, dosyalar | Hayır | Hayır | n/a | n/a | Dosya: yedek/PDF/CSV yalnız kullanıcının seçtiği yere yazılır |
| Barkod araması (Open Food Facts) | Barkod numarası kişisel veri değil. Hizmet IP adresini görür | Bkz. karar 3 | Uygulama işlevselliği | Evet (kullanıcı okutursa) | |

## Güvenlik uygulamaları
- Veri iletimde şifreli: evet (https).
- Silme talebi mekanizması: uygulama içi (kategori bazlı silme, Koç rızasını geri alma). Geliştiricinin sunucusunda veri olmadığı için ayrıca web silme formu gerekmez.
- Bağımsız güvenlik incelemesi: yok, işaretleme.
- Aile politikası: 18 yaş altına yönelik değil; Koç 18 yaş altında kapalı. Hedef kitle: yetişkin (18+).

## Sağlık uygulaması beyanı (Play Console > Uygulama içeriği > Sağlık)
- Uygulama kategorisi: sağlık/fitness takibi. "Tıbbi cihaz ya da klinik karar desteği değildir".
- Beyan işaretleri: "Aktivite ve fitness takibi" ve "Beslenme ve kilo yönetimi"; "Tıbbi", "Klinik" ve "Hastalık yönetimi" olarak değil.
- Tansiyon, kan şekeri, tahlil, ilaç takibi: kullanıcının girdiği kayıtları gösteren günlük; ölçüm cihazı değildir, tanı ya da tedavi önerisi yok. Play bu kayıtların kategorisi için "Diğer sağlık ve tıp bilgileri"/ölçüm kaydı beyanı isteyebilir; formda cevap Evet ve açıklama: "yalnız kullanıcı kaydı, yorum yok".
- Zorunlu uyarı uygulamada: `MED_NOTE` (Hakkında, Gizlilik ve veri, ilk açılış).

## Mağaza metninde kaçınılacak ifadeler (Play Sağlık/Yanıltıcı İçerik politikası)
tedavi, iyileştirir, teşhis, tanı, garanti, "X kilo ver", "yağ yakar", "hekim yerine", "klinik olarak kanıtlanmış", "doğrulanmış sağlık verisi", "veriler asla telefondan çıkmaz" (mutlak). Kullanılan kalıp: "tıbbi cihaz değildir, tanı koymaz, tedavi önermez". Ayrıntı: `docs/magaza-metni.md`.

## Kullanıcının karar vermesi gerekenler
1. **Koç = "paylaşım" mı?** Play'e göre kullanıcı talimatıyla, kullanıcının kendi anahtarıyla bir hizmet sağlayıcıya aktarım "paylaşım" sayılmayabilir, ama sağlayıcı kendi amacıyla (ücretsiz katman, Gemini istemleri ürün geliştirmede kullanabilir) işleyebildiği için bu belgede temkinli olarak "paylaşılıyor: evet" yazıldı. Hukukçu teyidi gerekir.
2. **Özel nitelikli veri ve yurt dışı aktarım (KVKK md. 6, 9):** açık rıza ifadesi ve veri sorumlusu bilgileri `gizlilik-politikasi.md` içinde `[DOLDURULACAK]` duruyor; hukukçu doldurmadan yayın yapılmamalı.
3. **Open Food Facts IP adresi:** IP "cihaz veya diğer kimlikler/ağ verisi" sayılabilir mi? Önerilen: bildirme (uygulama işlevi için zorunlu teknik istek). Hukukçu isterse "Cihaz veya diğer kimlikler: paylaşılıyor" işaretlenir.
4. **Tansiyon/şeker hedef değerleri (ev tansiyonu 135/85 genel referans ve ADA şeker hedefleri, `www/vitalslib.js`):** metin "yalnızca diyabetli yetişkinlerin tedavi hedefi, kendi hedefini hekiminle belirle" diyor. Bu eşiklerin uygulamada kalması ve "ilaç takibi" Play'de "tıbbi" kategoriye girer mi sorusu hekim ve Play yardımıyla netleşmeli.
