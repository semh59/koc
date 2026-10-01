# Yapılacaklar ve test listesi

Durum: [ ] bekliyor, [~] yapıldı ama telefonda denenmedi, [x] telefonda denendi.

## Yapılacak özellikler (sırayla)
- [iptal] Fotoğraftan yemek tahmini: ücretsiz görsel model seçimi güvenilmez ve sağlayıcıya veri gönderir, Semih şimdilik istemedi (1 Ekim 2026). Fikir: sağlayıcı başına "fotoğraf okuyor mu" testi, onay, aralıklı tahmin.
- [~] Besin etiketi okuma (ML Kit, telefonda, ücretsiz): Yemek ekle > Etiketi fotoğrafla oku. Aynı okuma tahlil fotoğrafı için de var (Tahlil takibi > Fotoğraftan oku).
- [~] **Tahlil takibi + PDF** (yapıldı, telefonda denenmedi; taranmış PDF/fotoğraf için OCR sonraki adım): tahlil sonuçlarını (kan değerleri vb.) tarihli kaydet, zaman içinde grafik göster, PDF olarak dışa aktar (doktora paylaşım). Karar bekleyen soru: PDF'ten sonuç okuma (içe aktarma) de istenir mi? Tanı ya da yorum yok, yalnızca kayıt ve grafik.
- [x] Tansiyon ve şeker takibi (yapıldı, plan: docs/tansiyon-seker-plani.md).
- [ ] Haftalık rapor PDF'i (doktor/diyetisyen paylaşımı) ve Koç'un "bu hafta neden kilo vermedin" analizi. Tahlil PDF'iyle aynı PDF altyapısı kullanılır.
- [ ] Bildirimden tek dokunuşla "+250 ml".
- [ ] Otomatik Drive yedeği.
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
- [ ] Sığma kontrolü: Bugün ekranı küçük ekranda taşmıyor.
