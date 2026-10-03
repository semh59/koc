# Hareket algılama ve adım uzunluğu (tasarım, 2026-10-01; arka plan GPS'i 2026-10-03'te kaldırıldı)

Amaç: yürüyüş/koşuyu otomatik algıla, hız ve kaloriyi bul. Harita ve rota yok, konum noktası saklanmaz.

## Karar: arka planda GPS yok (2026-10-03)
Otomatik algılanan aralıkta GPS açmak, uygulama arka plandayken konum ön plan servisi başlatmak demekti; bu `ACCESS_BACKGROUND_LOCATION` ("Her zaman izin ver") ister. Beslenme uygulamasında bu iznin Play gerekçesi zayıf, inceleme riski yüksek. Bu yüzden:
- Etkinlik Tanıma ile otomatik algılama, adım sayacı farkıyla adım, dilim dilim mesafe ve MET kalorisi aynen sürer. Alıcı (`MotionReceiver`) GPS servisine hiç dokunmaz.
- Otomatik aralıkta adım uzunluğu: öğrenilmiş kişisel ölçek varsa `priorStride × f`, yoksa boy önseli `priorStride` (cinsiyet kullanılmaz) (boy × (a + b·ritim)).
- Ölçeği öğrenmenin tek yolu: kullanıcının elle başlattığı yürüyüş (Adım ekranı > Yürüyüş başlat). Uygulama görünürken, kullanıcının dokunuşuyla konum türünde ön plan servisi (`MotionGpsService`) açılır. Ön planda başlatıldığı için yalnız "uygulama kullanılırken" konum izni yeter.
- Silinen mantık: GPS kararı (`gpsWanted`: pil < %20, tasarruf modu, günde en çok 6 pencere, ritim aralığı sayaçları, 14 günlük tazeleme), yorulma ile tetiklenen pencere (`cadenceShift`, 10 dk aralık) ve erken kapanma. Kişisel ölçek modeli (`Model.f`, `n`) ve `addSample` kalır. Model eski 30 alanlı kayıttan da okunur, öğrenilmiş ölçek kaybolmaz.

## Ön plan konumu kuralı (resmi doküman, 2026-10-03'te kontrol edildi)
- Konum türünde ön plan servisi için manifestte `foregroundServiceType="location"` ve `FOREGROUND_SERVICE_LOCATION`, çalışma anında `ACCESS_COARSE_LOCATION` ya da `ACCESS_FINE_LOCATION` gerekir. Uygulama arka plandayken bu servis başlatılamaz (arka plan izni yoksa). Kaynak: developer.android.com/develop/background-work/services/fgs/service-types (location).
- Uygulama ön plandayken başlatılan servis sürerken uygulama "Ana ekran"a alınsa ya da ekran kapansa da erişim devam eder ve bu ön plan konumu sayılır. Sistem kalıcı bildirim gösterir. Kaynak: developer.android.com/develop/sensors-and-location/location/permissions.
- Servis `startService` ile başlatılır ve hemen `startForeground(..., TYPE_LOCATION)` çağırır. `startForegroundService`'in 5 sn kuralı yoktur, konum kapalıysa ya da izin yoksa servis sessizce kapanır.

## Elle yürüyüşte GPS penceresi
- Koşul: telefonda adım sayar ve hareket algılama açık. Ritim adım sayacından gelir, öğrenilen ölçeği otomatik aralıklar kullanır. Bisiklette adım olmadığı için örnek alınmaz.
- İzin yalnız "Yürüyüş başlat"ta istenir: önce "neden" ekranı, sonra sistem penceresi (COARSE+FINE). "Konumsuz devam" ya da ret: yürüyüş boya dayalı adım uzunluğuyla sürer, kısa not çıkar ve bir daha sorulmaz (telefona özel bayrak, yedeğe girmez). Ayarlar > Hareket algılama'dan yeniden istenebilir.
- Pencere: iyi GPS noktası gelince ≈ 45 sn Doppler hızı + adım ritmi, tek örnek, servis kendini kapatır. İlk iyi nokta için en çok 10 dk beklenir (evden çıkış). Yürüyüş durdurulunca servis kapatılır.
- Sistem bildirimi ölçüm boyunca görünür. Ekran kapansa da en çok bu süre kadar sürer.

## Akıllı kullanım ilkeleri (geçerli)
- **Konum farkı değil GNSS hızı:** `Location.getSpeed()` ve `getSpeedAccuracyMetersPerSecond()` Doppler'den gelir, konum 10+ m zıplasa da doğrudur. Adım uzunluğu = hız ÷ ritim. Kısa pencere yeter.
- **Adım uzunluğu ritmin fonksiyonu:** yürüme ve koşu için ayrı doğru, uzunluk = boy × (a + b·ritim) × kişisel ölçek.
- **GPS doğrulayıcı:** yüksek hız + düşük ritim = araç; açık otomatik aralık atılır. GPS hızı yürü/koş ayrımını doğrular.
- **Koordinat saklama yok:** anlık hesapla; yalnızca model parametreleri ve aralık özetleri kalır.
- Bağımlılık: `play-services-location` (yalnız Etkinlik Tanıma için; konum `LocationManager` ile).

## Test planı
Saf mantık `MotionMath` (MotionMathTest): önsel adım, örnek kabulü, ölçek sınırı, eski model kaydı, nokta süzme, araç ayıklama, yürü/koş sınıflama, kısa aralık atma, MET kalori, gece yarısı bölme. Kaynak kuralları `android.test.js`: alıcı GPS servisine dokunmaz, GPS karar mantığı yok, izin listesinde arka plan konumu yok. CI APK manifestinde `ACCESS_BACKGROUND_LOCATION` görürse durur. Etkinlik Tanıma ve GPS penceresi telefon testi.

## Yorulma ve tempo değişimi
Açık aralık sürerken her ~2,5 dk adım sayacından kontrol noktası alınır (yalnızca hareket sürerken). Aralık kapanınca özet dilim dilim hesaplanır: her dilimin kendi ritminden adım uzunluğu, hız ve kalori bulunur; ritmi 50'nin altı dilimler duraklama sayılır (kalori yok). Ritim değişimi artık GPS açmaz.

## Bilinen sınırlar
- Otomatik aralığın mesafesi, kullanıcı elle GPS'li yürüyüş yapmadıkça boy önseline dayanır (kişiden kişiye ±%10-15). Boy girilmemişse 170 cm varsayılır.
- Kişisel ölçek yalnız elle yürüyüşlerden öğrenilir, her yürüyüşte en çok bir örnek. Ölçülen ritim aralığı kullanıcının elle yürüdüğü tempoyla sınırlı; koşu ölçeği kullanıcı koşuyu elle başlatmadıkça öğrenilmez.
- Elle yürüyüş kaydının km'si (`Algo.moveSummary`) aynı modeli kullanır: boy önseli × öğrenilmiş ölçek (`MotionPlugin.status` `fw`/`fr`, Bitir'de ve Kaydet sayfası açılırken tazelenir; o yürüyüşte öğrenilen ölçek de girer). Ölçek yoksa ya da 0,7-1,3 dışındaysa boy önseli. Boy girilmemişse elle kayıtta km yok (otomatik aralık 170 cm varsayar).
- Hareket algılama kapalıyken öğrenilen ölçeği kullanan bir yer olmadığı için GPS açılmaz ve izin istenmez.
- Eski sürümde "Her zaman" konum izni vermiş kullanıcı: uygulama bu izni artık istemez, manifestte bildirmez ve kullanmaz; Android bildirilmeyen izni uygulamaya vermez, izin ekranında "Her zaman" seçeneği görünmemeli (telefon testi `yapilacaklar.md`).
- Eski sürümün GPS sayaçları (`gpsDay`, `gpsN`, `gpsT`, `bRef`) SharedPreferences'ta okunmadan kalır, zararsız.
- Uzun aralık parça parça kaydedilir: açık aralık 3 saatte bir ve gün dönünce ilk kontrol noktasında kapatılıp aynı türle yeniden açılır (kayıt ≤ 4 saat kuralı korunur). Gece yarısını geçen aralıkta her günün adımı o günün sayaç farkından gelir; günler arasındaki dilim (~2,5 dk) atılır, orantıyla paylaştırılmaz. Yeni günde kontrol noktası yoksa o kısım atılır, önceki gün korunur. Parçalar zamanda ayrık, kalori iki kez sayılmaz.
- 3 saatlik parça geçersizse (ortalama ritim < 50: çıkış olayı kaçmış, kullanıcı duruyor) aralık yeniden açılmaz, kontrol noktası alarmı durur. Bu parçada yürüyüş de varsa o kısım kaybolur.
- Doze'da toplu gelen geçiş olayları (giriş+çıkış aynı pakette, >90 sn gecikme) atılır.
- Yeniden başlatma/güncelleme ve 30 dk kontrol noktası gelmeyen açık aralık güvenilmez sayılıp atılır.
- Uygulama yedeği (allowBackup) kapalı; boy/kilo ve öğrenilmiş model telefonda kalır. Konum noktası hiçbir yerde saklanmaz.
