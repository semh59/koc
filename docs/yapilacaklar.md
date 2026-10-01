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
- [ ] Öğün şablonları (şimdilik "Dünkünü tekrarla" yeterli görüldü).
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
- [ ] Sığma kontrolü: Bugün ekranı küçük ekranda taşmıyor.
