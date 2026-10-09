# İnceleme bulguları

Plan: `docs/inceleme-plani.md`. Ciddiyet: K kritik, Y yüksek, O orta, D düşük. Durum: Düzeltildi, Açık, Karar (senin kararın), Bilgi.

## Faz 1: Veri bütünlüğü ve kayıp

Bakılanlar: kaydetme ve yükleme zinciri, tüm `clean*` işlevleri, yedek (elle, Drive, otomatik klasör) ve geri yükleme, silme, saat ve gün sınırları, bildirimden gelen kayıtlar.

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 1-1 | Y | `www/index.html` `setSteps`, `setHc` | Sayaç sıfırlanınca gün kaydı `v=0` olarak kalıyordu. Kayıt temizliği sıfır adımı geçersiz saydığı için bir sonraki açılışta "1 geçersiz kayıt atıldı" uyarısı çıkıyor, tüm veri gereksiz yere "okunamayan kayıt kopyası" olarak ikinci kez saklanıyordu (depolama kotası). | Düzeltildi: 0'a inen gün kaydı silinir. Test: `app.test.js` (0 sonrası yeniden yüklemede atılan kayıt 0). |
| 1-2 | O | `www/quickui.js` | Bildirimden gelen su/ilaç kaydı yerel kuyruktan `take()` ile alınır ve ardından kaydedilir. Bu iki adım arasında süreç öldürülürse (çok dar pencere) o kayıtlar kaybolur. Kurtarma modunda kayıtlar yalnız bellekte tutulur. | Açık, düşük olasılık. Çözüm: yerel tarafta alındı onayıyla silme. Ayrı iş. |
| 1-3 | D | `www/gym.js` `cleanGym` | Kütüphaneden ileride çıkarılan bir egzersiz kimliği, eski antrenmanlardaki o kalemi geri yükleme/açılışta atar. Atılan sayı uyarıyla gösterilir ve ham kopya saklanır. | Bilgi. Egzersiz kimliklerini silmeme kuralı ileride önemli. |
| 1-4 | Bilgi | `cleanSettings` | Her ayar anahtarı varsayılandan farklı bir değerle gidiş-dönüş denendi: kayıp yok. | Doğrulandı. |
| 1-5 | Bilgi | tüm `clean*` | `app.test.js`'in 865'ten fazla ara durumunda `S` ile `buildState(S)` karşılaştırıldı. Alan kaybı çıkmadı; farklar test verisi yapaylıkları (geçersiz test tohumları) ve yeniden numaralanan kimliklerdi. | Doğrulandı. |
| 1-6 | Bilgi | gün anahtarı | Tarih farkları UTC günleriyle (yaz saatinden etkilenmez), gün anahtarı yerel saatle. Java tarafı da cihaz saat dilimini kullanıyor. Tutarlı. | Doğrulandı. |
| 1-7 | Bilgi | yedek | Şifreli yedek (PBKDF2 600 bin tur, AES-GCM), restore sırasında onay ve güvenlik kopyası, yazma başarısızsa eski veriye dönüş, başka yedekten anahtar adresi değiştirilemez. | Doğrulandı. |

## Faz 2: Güvenlik

Bakılanlar: HTML üretimi ve kaçış, dışa açık bileşenler, WebView ayarları, Koç sağlayıcı adresi, günlükler, içe aktarma sınırları, bağımlılıklar, kasa.

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 2-1 | Bilgi | tüm arayüz | Her serbest metin alanına HTML yükü yazılıp 16 sekme ve 21 pencere çizildi: çalışabilir öğe yok. Kalıcı test eklendi. | Doğrulandı. Test: `scripts/xss.test.js`. |
| 2-2 | Bilgi | `toast`, `confirmSheet` | Mesajlar `textContent` ile yazılıyor. | Doğrulandı. |
| 2-3 | Bilgi | CI | Dışa açık bileşen kapısı çalışıyor: yalnız `MainActivity`, `NeoWidget`, profileinstaller ve sistemin tutabildiği iznin korumasındaki Health Connect izin ekranı takma adı. | Doğrulandı. |
| 2-4 | Bilgi | Koç | Sağlayıcı adresi `https://` zorunlu (kayıt ve yedekten dönüşte), yedek bu adresi değiştiremez. | Doğrulandı. |
| 2-5 | Bilgi | günlük | Konsola ve logcat'e anahtar ya da sağlık verisi yazılmıyor (tek `Log.w` ilaç kaydı atlandı mesajı, veri taşımıyor). | Doğrulandı. |
| 2-6 | Bilgi | içe aktarma | CSV içe aktarma 8 MB, 200 bin satır ve 100 yeni egzersiz ile sınırlı; değerler aralık denetimli. | Doğrulandı. |
| 2-7 | Bilgi | bağımlılık | `npm audit --omit=dev`: 0 açık. Geliştirme aracında (`@capacitor/cli` > `uuid`) 3 orta bulgu var, uygulamaya girmiyor. | Bilgi, Dependabot izliyor. |
| 2-8 | D | yedek paylaşımı | Paylaşılan şifreli yedek dosyası uygulama önbelleğinde kalıyor (şifreli, sistem temizler). | Açık, düşük. |
| 2-9 | Karar | sağlık verisi | Veri telefonda düz metin (uygulama alanında). Android dosya tabanlı şifrelemesi kilitliyken korur, uygulama kilidi girişi korur. Ek şifreleme önerilmiyor. | Karar verildi: yapılmayacak. |

## Faz 3: Gizlilik, KVKK ve yasal

Bakılanlar: ağ çağrıları, Koç'a giden veri, onay metni ve politika eşleşmesi, Play formları, yeni özellikler (Health Connect, kamerayla nabız).

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 3-1 | Bilgi | ağ | Uygulama yalnız iki yere bağlanır: Koç sağlayıcıları (onayla, kullanıcı anahtarıyla) ve Open Food Facts (yalnız barkod numarası). Başka `fetch`, izleme ya da analiz kütüphanesi yok. | Doğrulandı. |
| 3-2 | Y | `docs/gizlilik-politikasi.md`, `docs/play-izin-beyanlari.md`, `docs/play-data-safety.md` | Kamerayla nabız, Health Connect okuma (adım, uyku, nabız) ve nabız verisi politika ve Play belgelerinde yoktu. | Düzeltildi: üçü de güncellendi (nabız Koç'a gönderilmez, görüntü saklanmaz, yalnız okuma). |
| 3-3 | O | `www/coach.js` `CONSENT_NOT`, politika §5 | "Gönderilmeyenler" listesinde nabız yoktu. | Düzeltildi: iki metin birlikte güncellendi, eşleşme testi geçiyor. Gönderilenler listesi genişlemediği için rıza sürümü artırılmadı. |
| 3-4 | O | Koç bağlamı | Saatten otomatik gelen adım ve uyku, Koç'a giden "son 14 gün özeti"ne girer (elle girilenle aynı kategori, rıza metni "adım ve varsa uyku" diyor). Nabız girmez. | Bilgi. Avukat sorusuna eklenecek: otomatik gelen sağlık verisinin rızası ayrı mı olmalı. |
| 3-5 | Karar | hukuk | Politika metni değişti (nabız, Health Connect). Yayına çıkılacaksa avukata yeniden gösterilmeli. Şu an yalnız kendi telefonun olduğundan bekliyor. | Karar (yayın kararına bağlı). |
| 3-6 | Karar | Play | Health Connect kullanımı için Play Console'da Sağlık Bağlantısı beyanı gerekir (yayına çıkılırsa). | Karar (yayın kararına bağlı). |
