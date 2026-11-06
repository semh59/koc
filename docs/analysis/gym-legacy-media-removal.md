# Eski katalog: görsel temizliği ve içerik düzeltme durumu

## Kapsam
Kullanıcı onayıyla `release/no-coach` dalındaki `www/ex/` fotoğrafları kaldırıldı. Bu işlem Git geçmişini veya `main` dalını silmez; yeni APK/yayın yapılmış sayılmaz.

- Silinen kaynak: 644 WebP, 7.630.566 bayt. Kaynakta GIF yoktu.
- Capacitor copy sonrası Android public/ex içindeki aynı 644 kopya da kaldırıldı.
- 324 dış kaynak kaydında `im: 0`; 8 dahili kayıt ve tüm 332 ID/sıra/antrenman alanı korundu.
- Fotoğraf yuvası ve CSS kare değiştirme animasyonu kaldırıldı; SVG hareket animasyonu korunur.
- Derleyici dış kayıtlarda yalnız `im: 0` kabul eder. Fotoğrafı geri getiren 1, 2, string ve null değerleri reddedilir.
- `free-exercise-db-images` lisansı hâlâ bilinmiyor ve kullanımı engelli; dosyayı kaldırmak lisans onayı değildir.

## Bütünlük
Önceki tüm runtime SHA256 `4f0ef49b6de8e7f4fb082b4147f77116a06a775d2e701a8ee64387ac38628342` artık güncel hash değildir: onaylı `im` değişikliği onu değiştirir. Silmeden önceki `7c174ef` snapshot'ından yalnız `im` çıkarılarak ölçülen 332 kaydın antrenman projeksiyonu SHA256:
`e89af76060e7a21b90b60ebf353495d91da95ad9e5a86768747f7df235080830`.
Derleme regresyonu aynı projeksiyonu doğrular; katalog sayısı artırılmaz.

## Eski egzersiz içerikleri — açık
Görsellerin temizlenmesi, 332 egzersizin form/geometri/kanonik kimlik düzeltmesinin tamamlandığı anlamına gelmez. Hepsi kanonik incelemede kalır; `acceptedNewRecords: 0`, semantik onaylı benzersiz sayısı 0. Yeni kayıt ekleme bekletilir. Önce eski hareketlerin ad–figür–ekipman–cue uyumsuzlukları somut testlerle ele alınacak; otomatik olarak `accepted` yapılmayacak.

## Kanıt
Odak testleri: `gym-no-photos.test.js`, `fig.test.js`, `gym-provenance.test.js`, `gym-catalog-build.test.js`.
Android kaynak/resource/web eşleşmesi: 28 Java, 44 resource, 115 web asset (önce 759); fiziksel cihaz veya APK kanıtı değildir.
Tam No-Coach release runner: 91 dosya, 2.288 PASS, 0 başarısız; 8 Coach-only skip, 18 mixed scoped. Tarayıcı E2E: 18/18 PASS (360 ve 412 px). Bağımsız denetim bekleniyor; CI, APK, emülatör ve fiziksel cihaz çalıştırılmadı.
