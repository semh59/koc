# Yapılacaklar ve test listesi

Durum: [ ] bekliyor, [~] yapıldı ama telefonda denenmedi, [x] telefonda denendi.

## Yapılacak özellikler (sırayla)
- [iptal] Fotoğraftan yemek tahmini: ücretsiz görsel model seçimi güvenilmez ve sağlayıcıya veri gönderir, Semih şimdilik istemedi (1 Ekim 2026). Fikir: sağlayıcı başına "fotoğraf okuyor mu" testi, onay, aralıklı tahmin.
- [~] Besin etiketi okuma (ML Kit, telefonda, ücretsiz): Yemek ekle > Etiketi fotoğrafla oku. Aynı okuma tahlil fotoğrafı için de var (Tahlil takibi > Fotoğraftan oku).
- [~] **Tahlil takibi + PDF** (yapıldı, telefonda denenmedi; taranmış PDF/fotoğraf için OCR sonraki adım): tahlil sonuçlarını (kan değerleri vb.) tarihli kaydet, zaman içinde grafik göster, PDF olarak dışa aktar (doktora paylaşım). Karar bekleyen soru: PDF'ten sonuç okuma (içe aktarma) de istenir mi? Tanı ya da yorum yok, yalnızca kayıt ve grafik.
- [~] Tansiyon ve şeker takibi (yapıldı, telefonda denenmedi, plan: docs/tansiyon-seker-plani.md).
- [~] Haftalık rapor PDF'i yapıldı (Trend > Haftalık raporu paylaş; kilo, kalori, su, spor, adım, açıksa tansiyon/şeker; yorumsuz). Kalan: Koç'un "bu hafta neden kilo vermedin" analizi. Tahlil PDF'iyle aynı PDF altyapısı kullanılır.
- [~] Bildirimden tek dokunuşla "+250 ml" (yapıldı: su bildirimindeki düğme, ekran açılmadan kayıt, uygulama bir sonraki açılışta alır).
- [~] Drive yedeği paylaş yöntemiyle (hesap bağlamadan): Ayarlar > Yedeği Drive'a gönder, parolalı şifreli dosya, parola isteğe bağlı Keystore'da saklanır, Pazar akşamı hatırlatma (yedek yeniyse atlanır).
- [ ] Health Connect (Mi Band/saat kullanımı netleşince).
- [~] Öğün şablonları, favoriler, son yenilenler, elle adım, "sayım durdu" uyarısı yapıldı (telefon test maddeleri aşağıda).
- Diğer fikirler: `docs/fikirler.md`.

## Telefonda tek tek test edilecekler
Sürüm: son APK (GitHub Releases, `neowell.apk`).
- [~] Adım sayar: Bugün'de adım kartı, karta dokununca Adım raporu. 100 adım yürüyüp sayıyı kontrol et. Geceyi geçince önceki günün adımı doğru güne yazılıyor mu.
- [~] Aykırı tartı uyarısı: son tartından 5 kg'dan fazla farklı değer gir, uyarı çıkmalı, tekrar Kaydet ile kaydolmalı.
- [~] Dünkünü tekrarla: dünkü yemekler bugüne kopyalanıyor, "Geri al" çalışıyor.
- [~] Su hedefi dolunca o günün kalan su bildirimleri gelmiyor.
- [~] Bildirimler uygulama kapalıyken geliyor (Xiaomi ayarları yapılmış halde).
- [x] Barkod okutma.
- [~] Tahlil: Trend sekmesi > Tahlil takibi > PDF'ten oku. Gerçek bir laboratuvar PDF'i okut (satırlar doğru mu, tarih, birim, referans), kaydet, test detayında grafik, "PDF olarak paylaş" ile çıkan PDF'i aç (Türkçe karakterler, grafik), korumalı PDF parolası, taranmış PDF mesajı.
- [~] Etiket okuma: gerçek bir paketin besin tablosunu çek (kalori ve makrolar doğru mu, ad yazıp kaydet, porsiyon ekranı). Tahlil fotoğrafı: rapor fotoğrafını okut, satırları kontrol et.
- [~] Tansiyon ve şeker (Ayarlar > Sağlık ölçümleri'nden aç): tansiyon girişi (2 ölçüm, seans), şeker girişi (bağlam), hedef aralığı ön ayarları, Bugün'de Ölçümler kartı, Trend'de kartlar, grafikler, uç değerde 112 kutusu (yalnızca bugün tarihli), "emin misin" uyarısı, silme/geri al, hatırlatmalar (Ayarlar'da aç), Doktor raporu PDF (Türkçe karakter, grafik, tablo).
- [~] Haftalık rapor: Trend sekmesi altındaki düğmeyle PDF üret, aç (Türkçe karakterler, tablo, kilo farkı doğru mu, kayıtsız gün '–').
- [~] Bildirim düğmesi: su bildirimi geldiğinde "+250 ml" düğmesine dokun; ekran çok kısa yanıp sönmeli, sonra uygulamayı açınca su eklenmiş olmalı (bugün toplamı artmış, bildirim kaybolmuş). Uygulama tamamen kapalıyken de dene.
- [~] Drive yedeği: Ayarlar > Yedeği Drive'a gönder > parola > paylaşım ekranında Drive'ı seç; Drive'da dosya var mı; başka telefonda/yeniden kurulumda Dosyadan oku ile geri yükle. Pazar 20:00 hatırlatması geliyor mu.
- [~] İlaç hatırlatıcı (Ayarlar > İlaç hatırlatıcı > aç): ilaç ekle (saatler, günler, kür, stok), Bugün kartında Aldım/Atla, bildirimde "✔ Aldım" düğmesi (ekran açılmadan), uyum yüzdesi, stok azalınca uyarı, haftalık rapora ilaç uyumu. Uygulama kapalıyken bildirim geliyor mu, Xiaomi'de de.
- [~] İlaç alarmı: dozda alarm sesiyle çalmalı, bildirim silinememeli (kalıcı), "Atla" ve "Aldım" düğmesi kapatmalı; dokunmazsan 10 ve 20 dk sonra "İlacını aldın mı?" tekrarı gelmeli; alt menüde 💊 İlaç sekmesi (6 sekme 360px'te sığıyor mu); Koç'a "ilaçlarımı düzenli alıyor muyum?" sor (önce veri paylaşımını kabul et). Xiaomi'de İlaç alarmı kanalının sesi ve "kilit ekranında göster" açık olmalı.
- [~] Hareket algılama (Ayarlar > Hareket algılama, adım sayar açıkken): aç, fiziksel aktivite + konum + "Her zaman izin ver" izinlerini ver; 10+ dk yürü ve bir de koş; telefonu cebinde tut ve ekranı kapat; Adım ekranındaki Hareketler kartında süre, mesafe, hız, kalori makul mü (çok kısa aralıklar listelenmez). GPS'in yalnızca ilk yürüyüşlerde kısa süre açılması, 'Hareket ölçülüyor' bildiriminin ~1 dk içinde kapanması, pil tüketimi. Xiaomi'de uygulamaya Pil: Kısıtlama yok ve Otomatik başlat açık olmalı. Araçta (otobüs/araba) kayıt oluşmamalı.
- [ ] Favori/şablon: Yemek ekle'de "Son yediklerin" satırına dokun (anında eklenmeli, makrolar dahil, Geri al çalışmalı); ☆ ile favori yap, favori en üstte; Bugün'de "Bu günün yemeklerinden şablon yap", Yemek ekle'de şablon çipi tüm kalemleri tek seferde ekler ve tek Geri al siler; Dünkünü tekrarla artık protein/karbonhidrat/yağı da taşıyor.
- [ ] Elle adım: Adım ekranı > Adım ekle (elle); Bugün kartı ve halka sensör + elle gösteriyor, bir süre sonra sensör yenilenince elle eklenen kaybolmuyor, listeden silinebiliyor.
- [ ] "Sayım durdu" kartı: adım sayar açıkken telefonu bir gün cebinde taşımadan ertesi gün Bugün'de kart çıkıyor mu; Ayarla (Xiaomi'de ayar sayfası, diğerlerinde pil ayarı) açılıyor mu, Kapat o gün gizliyor mu. Gece alarmı Doze'da geç kalırsa yanlış uyarı çıkabilir (eşik 26 saat), sık oluyorsa kaydır.
- [ ] Sığma kontrolü: Bugün ekranı küçük ekranda taşmıyor.
- [ ] Salon plaka/ısınma: ağırlıklı egzersizde ⋮ > Plaka ve ısınma; hedef kg gir, bir taraf plakaları ve "en yakın" notu doğru mu, "Isınmayı antrenmana ekle" ısınma setlerini başa koyuyor mu, ısınma setleri hacim ve rekora girmiyor mu. ⋮ > Tekrar aralığı (5-8) ile öneri değişiyor mu.
- [ ] Set anında rekor: eski en iyiden ağır bir seti ✓ ile bitir; "Yeni rekor" bildirimi + titreşim bir kez gelmeli, aynı egzersizde ikinci kez gelmemeli.
- [ ] Lif/şeker/sodyum: gerçek bir ürünün barkodunu okut (Yemek ekle > barkod); porsiyon önizlemesinde lif, şeker, sodyum çıkıyor mu, eklenince Bugün'da "Lif · Şeker · Sodyum (n/m öğünde veri var)" satırı görünüyor mu. Etiket oku: Lif/Şeker/Sodyum kutuları (tuz yazan etikette sodyum = tuz x 400 mg) dolu geliyor mu.
