# İnceleme bulguları

Plan: `docs/inceleme-plani.md`. Ciddiyet: K kritik, Y yüksek, O orta, D düşük. Durum: Düzeltildi, Açık, Karar (senin kararın), Bilgi.

## Faz 1: Veri bütünlüğü ve kayıp

Bakılanlar: kaydetme ve yükleme zinciri, tüm `clean*` işlevleri, yedek (elle, Drive, otomatik klasör) ve geri yükleme, silme, saat ve gün sınırları, bildirimden gelen kayıtlar.

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 1-1 | Y | `www/index.html` `setSteps`, `setHc` | Sayaç sıfırlanınca gün kaydı `v=0` olarak kalıyordu. Kayıt temizliği sıfır adımı geçersiz saydığı için bir sonraki açılışta "1 geçersiz kayıt atıldı" uyarısı çıkıyor, tüm veri gereksiz yere "okunamayan kayıt kopyası" olarak ikinci kez saklanıyordu (depolama kotası). | Düzeltildi: 0'a inen gün kaydı silinir. Test: `app.test.js` (0 sonrası yeniden yüklemede atılan kayıt 0). |
| 1-2 | O | `www/quickui.js` | Bildirimden gelen su/ilaç kaydı yerel kuyruktan `take()` ile alınır ve ardından kaydedilir. Bu iki adım arasında süreç öldürülürse (çok dar pencere) o kayıtlar kaybolur. Kurtarma modunda kayıtlar yalnız bellekte tutulur. | Düzeltildi: yerel taraf alınan kayıtları "yolda" tutar, JS kalıcı yazdıktan sonra `ack` ile siler; süreç araya ölürse kayıt yeniden gelir, su kaydı `qt` (bildirim zamanı) taşıdığı için çift eklenmez. Testler: `app.test.js`, `android.test.js`. |
| 1-3 | D | `www/gym.js` `cleanGym` | Kütüphaneden ileride çıkarılan bir egzersiz kimliği, eski antrenmanlardaki o kalemi geri yükleme/açılışta atar. Atılan sayı uyarıyla gösterilir ve ham kopya saklanır. | Düzeltildi: kütüphanede olmayan kimlik artık atılmaz, geçmişte "Silinmiş egzersiz" olarak durur; yalnız bozuk biçimli kimlik atılır. |
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
| 2-8 | D | yedek paylaşımı | Paylaşılan şifreli yedek dosyası uygulama önbelleğinde kalıyor (şifreli, sistem temizler). | Düzeltildi: paylaşım için yazılan `neowell-*` dosyaları bir sonraki yazımdan önce ve her açılışta önbellekten silinir (`cacheClean`). |
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

## Faz 4: Sağlık doğruluğu ve ürün güvenliği

Bakılanlar: `algo.js` formüllerinin tamamı, risk işaretleri, kalori tabanları, protein, 1TM ve ilerleme, döngü tahmini, vurgusuz dil (yorum, eşik, etiket), kriz kutusu.

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 4-1 | Bilgi | `algo.js` | Mifflin-St Jeor katsayıları, cinsiyet belirtilmeyende −78, uyarlanabilir harcama işareti (alım − eğim × 7700), %70-130 sınırı, kilo verme hızı (%0,5/hafta, en çok 0,75 kg), %25 açık sınırı, protein (BMI 30+ ayarlı ağırlık, üst 200 g), Epley 1TM, MET tabloları ve adım uzunluğu modeli kontrol edildi: hata yok. | Doğrulandı. |
| 4-2 | Bilgi | `riskFlags` | 31 örnek cümleyle sınandı (hamilelik, emzirme, yeme bozukluğu, böbrek, olumsuz kalıplar "değilim", "yok", "emzirmiyorum"). Olumsuzlar doğru ayrışıyor. Hata yönü hep güvenli taraf: "eşim hamile" bile engel sayar. | Doğrulandı. |
| 4-3 | Bilgi | tansiyon, şeker, tahlil, nabız, uyku | Yorum, eşik, etiket ve renk yok. Tek sabit eşik: bugün girilen tansiyon ≥180/120 ya da şeker <54 / >400 için "112'yi ara" penceresi. Bu bilinçli bir güvenlik kararı. | Doğrulandı. |
| 4-4 | Bilgi | döngü | Takvim yöntemi (yumurtlama sonraki başlangıçtan 14 gün önce), düzensizde tarih verilmiyor, her ekranda "gebelik/korunma aracı değildir" notu var. | Doğrulandı. |
| 4-5 | D | `ACT` çarpanları | Hareket düzeyi çarpanları 1,3 / 1,45 / 1,6: yaygın tablolardan (1,375 / 1,55 / 1,725) biraz düşük. Hedefler muhafazakâr çıkar; 28 gün veri olunca gerçek harcamadan öğrenilir. | Bilgi, değişiklik gerekmez. |

## Faz 5: Android yerel katman

Bakılanlar: 26 Java dosyasının tamamı en az bir kez satır satır okundu (bu inceleme ve önceki oturumlar): alarm, kilit, kasa, yedek klasörü, GPS, Health Connect, adım, hareket, widget, hızlı kayıt, OCR, ses.

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 5-1 | O | `NeoWidget.setSteps` | Widget'ın kendi yenilemesi telefon sensörünü okuyup uygulamanın gönderdiği adımı eziyordu. Saat adımı (Health Connect) ve elle eklenen adım açıkken widget uygulamadan düşük gösterebilirdi; uygulama aynı sayıyı tekrar göndermediği için düzelmezdi. | Düzeltildi: bugünkü gönderilmiş değer ile sensör değerinin büyüğü alınır. Test: `android.test.js`. |
| 5-2 | D | `BackupFolderPlugin.write` | Aynı günün eski otomatik yedeği, yeni dosya yeniden adlandırılmadan önce silinir. Yeniden adlandırma hata verirse o günün yedeği geçici adla kalır ve ertesi yazmada silinir. Kullanıcıya "otomatik yedek alınamadı" gösterilir. | Düzeltildi: yeniden adlandırma istisna verirse yedek yol yeni içeriği yazar, günün yedeği kaybolmaz. |
| 5-3 | Bilgi | derleme | Java yerelde derlenemiyor (SDK yok), derleme CI'da. Health Connect çağrıları belgelere göre yazıldı ve CI'da derlendi. | Bilgi. |
| 5-4 | Bilgi | izinler | Hareket algılama yalnız fiziksel aktivite iznini ister; konum yalnız elle yürüyüşte, ön planda. Arka plan konumu yok. | Doğrulandı. |

## Faz 6-9: Koç, arayüz, dayanıklılık, test kalitesi

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 6-1 | Bilgi | Koç | İstem, sağlayıcı zinciri, eylem kartı onayı, maliyet gözden geçirildi: hata yok. | Doğrulandı. |
| 7-1 | O | `www/pulseui.js` | Ölçüm geri sayımı ekran okuyucuda her saniye okunuyordu. | Düzeltildi: `role=timer`, yönerge yalnız değişince. |
| 7-2 | Bilgi | yeni ekranlar | Yeni e2e dosyası (`e2e/yeni-ekranlar.spec.js`): nabız, saat kartı, uyku; 28 test geçiyor. ASCII-Türkçe (aksansız) metin taraması temiz. | Doğrulandı. |
| 8-1 | Bilgi | performans | Büyük veriyle ölçüm: sorun yok. | Doğrulandı. |
| 9-1 | Bilgi | testler | Mutasyon taramasıyla test boşlukları arandı; sınır değer testleri eklendi (`scripts/sinir.test.js`). `pulselib` eşikleri (CV 0,15, özilinti gücü 0,3, tutulan atım oranı) için ayrı ret testi hâlâ yok. | Düzeltildi: `pulselib` eşikleri için mutasyon taraması, 13 eşik değişikliğinin hepsi testlerce yakalandı. |
| 9-2 | O | `www/pulselib.js` | Sentetik tarama (600 sinyal, 45-109 atım/dk, gürültü genliğe yakın veya büyük): kabul edilenlerin ~%8'i 5-9 atım/dk sapıyor. Gürültüsüz/hafif gürültüde sapma yok. Gerçek parmak verisi ölçülmeden eşik sıkılaştırılmadı. | Düzeltildi: sayı artık atım noktalarının ortalamasından değil özilintiden (parabolla inceltilmiş) alınıyor; sentetik taramada 45-110 atım/dk için yanlış oranı %8 → %0,5 (en çok 5 atım sapma). 130+ atım/dk için sapma 5-20 kalıyor (dinlenme nabzı için sorun değil). Telefonda saatle karşılaştır. |

## Faz 14: Telefon bulguları (kullanıcıdan)

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 14-1 | Y | Bugün, geçmiş | Geçmiş tek gün gösteriliyor, 365 günle sınırlı, bulunması zor; takvim ve tüm zaman görünümü yok. | Düzeltildi: Geçmiş ekranı (takvim, aylar, ara), Gün ekranı, 365 gün sınırı kalktı, Trend'e 1 yıl ve Tümü (uzun aralıkta haftalık/aylık çubuk). Testler: `history.test.js`, `app.test.js`, `e2e/gecmis.spec.js` (3 yıllık veri, 360/412 px, koyu tema, %200 yazı). Telefonda dene. |
| 14-2 | Y | depolama | Tek `localStorage` anahtarı, ~5 MB kota; 3+ yılda sınıra yaklaşır. | Düzeltildi: asıl depo IndexedDB (`www/storelib.js`), localStorage her kayıtta aynalanır (eski sürüme dönüş ve IndexedDB açılamama güvenli); sıra numarası ve özetle açılışta yeni olan seçilir, çakışan eski hal ayrı kopyada kalır. IndexedDB yoksa eski davranış. Testler: `store.test.js` (sahte IndexedDB, 9 mutasyon öldü), `e2e/depo.spec.js`, 254 mevcut e2e yeni depoyla geçti. Telefonda dene. |
| 14-3 | Y | `www/gym.js` `gTodayCard` | Bitirilmeyen antrenman (t1 boş) günler sonra da "Devam ediyor" diye Bugün'de kalıyordu; bitirilince süre 600 dk üst sınırına yapışıp sahte spor kaydı yazardı. | Düzeltildi: dünden kalan kart "bitirilmedi" der, Bitir (süre sorulur) ya da Sil sunar. Test: `app.test.js`. Telefonda dene. |
| 14-4 | Y | `pulselib.js`, `pulseui.js` | Kamerayla nabız ölçümü telefonda başarısız (neden bulunmadı). | Açık |
| 14-5 | Y | `pulselib`, `habitlib`, `algo`, `motionlib`, `vitalslib`, `medlib` | Eski kayıtlar sessizce siliniyordu: uyku ve ruh hali 400 gün, saatten nabız 400 gün, vücut ölçüleri 400 kayıt, kamera nabzı 500, oruç günlüğü 200, yürüyüş/hareket 400, tansiyon-şeker 5000, ilaç alındı kaydı 5000 (kayıtlar yüklenirken ve kaydedilirken kırpılıyordu). "Veri sonsuza kadar tutuluyor" doğru değildi. | Düzeltildi: sınırlar 20.000-50.000'e çıkarıldı, testler "kaybolmaz" olarak güncellendi. |
| 14-6 | Y | `www/pulselib.js` | Telefonda (17 kare/sn) kamera nabzı reddediliyordu: atımlar düzenli (cv 0,06) ama özilinti gücü 0,2 < 0,3; ayrıca özilinti çoğu sinyalde periyodun iki katını (yarım atım sayısı) seçiyordu. | Düzeltildi: en kısa güçlü periyot alınır (oktav düzeltmesi); atımlar çok düzenliyse (cv ≤ 0,10, ≥ %85 tutarlı, ≥ 20 aralık) güç eşiği 0,15. Başarı sonucunda da teknik ayrıntı döner. Telefonda yeniden dene; sapma >5 ise eşik sıkılaşır. |
| 14-7 | K | `AppLockPlugin.java`, `scripts/patch-android.js` | Uygulama kilidini açınca/uygulama açılışta doğrulama penceresi `SecurityException: Must have USE_BIOMETRIC permission` ile çöküyordu (telefonda görüldü, 1.0.232). Manifestte `USE_BIOMETRIC` yoktu; CI emülatöründe ekran kilidi tanımlı olmadığı için pencere hiç açılmamış, test yakalamamıştı. | Düzeltildi: `USE_BIOMETRIC` izni eklendi (normal izin, kullanıcıya sorulmaz); istem açılırken RuntimeException yakalanır, çökmez, "doğrulanamadı" denir. Test: `android.test.js`. Telefonda dene. |

## Faz 10-13: Kod kalitesi, CI, dokümantasyon, ürün

| No | Ciddiyet | Yer | Bulgu | Durum |
|---|---|---|---|---|
| 10-1 | Bilgi | `www/` | Kullanılmayan üst düzey işlev ve sabit taraması (64 dosya + index.html): tek aday vardı (yeni `HG_TYPE`), silindi. | Düzeltildi. |
| 10-2 | O | `www/index.html` | 180 KB tek dosya; ana betik hâlâ tek parça (ekran çizimi, kayıt, yedek, bildirim). Yeni ekranlar ayrı dosyada (historyui, pulseui, hcui). Bölme riski/getirisi: çalışıyor, test kapsamı geniş; yeni özellikler dışarıda yazılıyor. | Karar: şimdi bölünmüyor, yeni kod ayrı dosyaya. |
| 10-3 | D | bağımlılıklar | Yalnız yama farkı: Capacitor 8.5.2 → 8.5.3, local-notifications 8.2.1 → 8.3.1, Playwright 1.63 → 1.64. jsdom 24 → 30 ve pdfjs-dist 4 → 6 büyük sürüm (yalnız test/ayrı), acele yok. Dependabot izliyor. | Bilgi. |
| 11-1 | Y | CI | Emülatörde ekran kilidi tanımlı olmadığı için uygulama kilidi doğrulama penceresi hiç açılmıyordu; `USE_BIOMETRIC` eksikliği çökmeye yol açtı (bulgu 14-7). | Düzeltildi: CI APK manifestinde `USE_BIOMETRIC` yoksa derleme durur. |
| 11-2 | O | CI smoke | Su ve widget adımları arada bir (yaklaşık 3 derlemede 1) emülatörde zamanlamaya takılıyor; yeniden çalıştırınca geçiyor. Başarısızlıkta kuyruk içeriği artık loga yazılıyor. | Düzeltildi (izleniyor): su/widget adımı yeniden çalıştırmada geçiyor (kod yolu aynı); başarısızlıkta kuyruk içeriği ve süreç durumu loga yazılıyor. Ayrıca "Releases'e yükle" adımı geçici GitHub 403 hatasında (236. derleme) 3 deneme yapıyor. |
| 11-3 | Karar | imza | APK, depodaki sabit anahtarla imzalı (kendi telefonun için yeterli). Play'e çıkılırsa gerçek yükleme anahtarı ve yedeği gerekir. | Karar (yayın kararına bağlı). |
| 12-1 | D | `docs/` | minSdk anlatımı: güncel değer 24 (dagitim.md, yapilacaklar.md); `plan-6-ozellik.md` içindeki "mevcut 23" tarihi plan notu. | Bilgi, değişiklik gerekmez. |
| 12-2 | O | `docs/telefon-testi-kisa.md` | Güncel: A-G bölümleri, madde 1-30. | Güncel. |
| 13-1 | Bilgi | ürün | Geçmiş, takvim, arama, uzun aralıkta Trend, günlük halkalar bu turda yapıldı. Kalan başlıca eksikler: kamerayla nabız doğruluğunun telefonda doğrulanması, Health Connect verilerinin telefonda doğrulanması, Play yayın kararı (avukat, Sağlık Bağlantısı beyanı). | Açık (telefon + karar). |
