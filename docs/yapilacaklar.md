# Yapılacaklar ve test listesi

Durum: [ ] bekliyor, [~] yapıldı ama telefonda denenmedi, [x] telefonda denendi.

## Yapılacak özellikler (sırayla)
- [ ] Fotoğraftan yemek tahmini (Koç'a tabak fotoğrafı, "Listeme ekle" kartı, tahmin olduğu yazılı).
- [ ] Besin etiketi okuma (ML Kit metin tanıma): barkodsuz ürünün değerleri otomatik dolar.
- [ ] **Tahlil takibi + PDF:** tahlil sonuçlarını (kan değerleri vb.) tarihli kaydet, zaman içinde grafik göster, PDF olarak dışa aktar (doktora paylaşım). Karar bekleyen soru: PDF'ten sonuç okuma (içe aktarma) de istenir mi? Tanı ya da yorum yok, yalnızca kayıt ve grafik.
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
- [ ] Sığma kontrolü: Bugün ekranı küçük ekranda taşmıyor.
