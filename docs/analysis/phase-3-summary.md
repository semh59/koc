# Faz 3 — özet ve açık riskler

## Tamamlanan tarama

- `Data` registry üretici ve tüketici yüzeyi çıkarıldı.
- Document click delegation selector ağı çıkarıldı.
- `nw:boot` event yayın/dinleyici yüzeyi çıkarıldı.
- Action registry kayıtları ve DOM `data-*` mekanizması ayrıştırıldı.
- Storage anahtarları ve store fallback modeli çıkarıldı.
- `S` global state için ilk doğrudan erişim noktaları kaydedildi.

## Öncelikli açık analizler

1. `S` alan bazında tüm yazıcı/okuyucu matrisi
2. `Log` veri katmanı ve `save()` çağrı zinciri
3. Native plugin JS çağrıları ↔ Java method eşleşmesi
4. Network endpoint ve provider veri akışı
5. Privacy temizleme ile store/network/native verilerinin gerçek kapsamı
6. Registry callback hata izolasyonu
7. Event selector'larının handler coverage testi

## Geçici risk sıralaması

### Yüksek

- Global `S` state'inin domain modüllerince doğrudan okunup yazılması
- Script sırasına dayalı global çalışma modeli
- Privacy temizleme davranışlarının modüle göre farklı olması

### Orta

- Registry callback sözleşmelerinin örtük olması
- Document-level event handler sayısının yüksek olması
- Storage yazma hatalarının yardımcı katmanda bastırılması
- `Act` dispatcher'ın async sonuç sözleşmesinin görünmemesi

### Henüz karar verilemez

- Gerçek veri kaybı
- Native güvenlik açığı
- Network'e hassas veri gönderimi
- Runtime race condition

Bu maddeler kodun ilgili çağrı zincirleri ve test/runtime doğrulaması tamamlanmadan kesin bulgu olarak sınıflandırılmamalıdır.
