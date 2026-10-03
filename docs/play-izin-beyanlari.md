# Play izin beyanları

Son gözden geçirme: 3 Ekim 2026. Kaynak: `scripts/patch-android.js`, eklenti manifestleri ve son APK'nın birleşik manifesti. CI her derlemede APK'nın izin listesini yazdırır. `USE_EXACT_ALARM`, `FLASHLIGHT` ya da `ACCESS_BACKGROUND_LOCATION` görürse, ya da `FOREGROUND_SERVICE_LOCATION` yoksa durur.

## Kaldırılan izinler
| İzin | Neden kaldırıldı |
|---|---|
| `USE_EXACT_ALARM` | Play bu izni yalnız "alarm veya zamanlayıcı uygulaması" ile "etkinlik bildirimi gösteren takvim uygulaması" için kabul ediyor, diğer uygulamalara `SCHEDULE_EXACT_ALARM` diyor. NeoWell'in ana işlevi bunlardan biri değil, ilaç hatırlatıcı bu tanıma girmiyor. |
| `FLASHLIGHT` | Fener hiçbir yerde açılmıyor. Barkod Google'ın tarayıcı ekranıyla (`scan()`) okunuyor, `enableTorch` çağrılmıyor. |
| `ACCESS_BACKGROUND_LOCATION` | 3 Ekim 2026'da kaldırıldı. Otomatik algılanan yürüyüşte GPS açmak arka plan konumu gerektiriyordu, beslenme uygulamasında bu iznin gerekçesi zayıf. Otomatik algılama artık GPS açmıyor; konum yalnız kullanıcının uygulama içinden başlattığı yürüyüşte kullanılıyor. Eski sürümde izni vermiş kullanıcı için: uygulama bu izni artık bildirmediği için Android onu uygulamaya vermez, uygulama da kullanmaz. |

## Kalan izinler
| İzin | Hangi özellik | Kullanıcı nasıl görüyor | Play Console |
|---|---|---|---|
| `INTERNET`, `ACCESS_NETWORK_STATE` | Koç (kullanıcının kendi API anahtarıyla dil modeli), Open Food Facts barkod araması. `ACCESS_NETWORK_STATE` Google Play hizmetleri kitaplığından geliyor. | Sistem penceresi yok (normal izin). | Beyan gerekmez. Veri güvenliği formunda Koç'a giden veri yazılmalı: kaynak `docs/gizlilik-politikasi.md` bölüm 5. |
| `POST_NOTIFICATIONS` | Su, tartı, ilaç, oruç ve yedek hatırlatmaları. | Android 13+ sistem penceresi, ilk hatırlatma kurulurken. Ayarlar > Hatırlatmalar durumu gösterir. | Beyan gerekmez. |
| `SCHEDULE_EXACT_ALARM` | İlaç alarmı ve hatırlatmaların tam saatinde çalması. | Android 13+ yeni kurulumda izin verilmiş gelmez. İzin yoksa eklenti alarmı yaklaşık saate kurar (çökme yok). Bugün > yapılacaklar listesinde (ilaç varsa) ve Ayarlar > Hatırlatmalar'da uyarı çıkar. "İzin ver" düğmesi sistem ekranını açar, dönünce hatırlatmalar yeniden kurulur. | Beyan formu yok. Kullanıcı izni sistem ekranından verir. |
| `RECEIVE_BOOT_COMPLETED` | Telefon yeniden açılınca alarmları, adım anlık görüntüsünü ve hareket algılamayı yeniden kurmak. | Sistem penceresi yok. | Beyan gerekmez. |
| `WAKE_LOCK` | Bildirim eklentisi ve Play hizmetleri, alarm teslimi sırasında. | Sistem penceresi yok. | Beyan gerekmez. |
| `VIBRATE` | Dinlenme süresi bitti titreşimi, rekor titreşimi, ilaç alarm kanalı. | Sistem penceresi yok. | Beyan gerekmez. |
| `CAMERA` | Besin etiketi ve tahlil fotoğrafı (ML Kit yazı tanıma, telefonda). Fotoğraf alanı kamerayı açtığında Capacitor izni sorar. | Fotoğraf çekmek istendiğinde sistem penceresi. | Beyan gerekmez. |
| `ACTIVITY_RECOGNITION` | Adım sayar ve yürüyüş/koşu algılama. | "Adım sayarı aç" ya da "Hareket algılamayı aç" sırasında sistem penceresi. Hareket algılama yalnız bu izni ister. | Beyan gerekmez. Sağlık uygulaması beyanında adım/aktivite verisi yazılmalı. |
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | Ön plan konumu. Kullanıcının Adım ekranında "Yürüyüş başlat" ile başlattığı yürüyüşte kısa GPS ölçümü: Doppler hızı ÷ adım ritmi ile adım uzunluğu öğrenilir. Yalnız adım sayar ve hareket algılama açıkken. Rota ve konum noktası saklanmaz. | İzin yalnız "Yürüyüş başlat"ta istenir: önce uygulama içi "Yürüyüşte konum" açıklaması (`motionui.js`, `motionDisclose`; İzin ver / Konumsuz devam), sonra sistem penceresi ("Uygulamayı kullanırken"). Ret ya da Konumsuz devam: yürüyüş boy tahminiyle sürer, bir daha sorulmaz; Ayarlar > Hareket algılama'dan yeniden istenebilir. | Arka plan konum beyanı ve videosu gerekmez. Veri güvenliği formunda konum "cihazda işlenir, toplanmaz/paylaşılmaz". |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION` | `MotionGpsService`: elle yürüyüşteki GPS ölçümü için konum türünde ön plan servisi. Uygulama görünürken, kullanıcının dokunuşuyla başlar; uygulama arka plana geçse ya da ekran kapansa da "kullanırken" izniyle sürer (Android'e göre ön plan konumu). İyi sinyalde ≈ 45 sn, ilk iyi nokta için en çok 10 dk; yürüyüş bitince kapanır. | Ölçüm boyunca kalıcı bildirim: "Yürüyüşte adım uzunluğu ölçülüyor". | Android 14+ hedefinde ön plan servisi türü beyanı gerekir. Play yardım sayfası (13392821) her ön plan servisi özelliği için tetikleme adımlarını gösteren video bağlantısı istiyor. Kısa açıklama ve video adımları aşağıda. |

## Beyan metni taslakları

**Ön plan servisi, konum türü (FOREGROUND_SERVICE_LOCATION)**
> İşlev: Kullanıcı uygulamada "Yürüyüş başlat"a dokunduğunda, yürüyüş sırasında hız ve adım ritmini ölçerek adım uzunluğunu öğrenmek için kısa GPS penceresi açılır. Servis uygulama ekrandayken, kullanıcının eylemiyle başlar; ölçüm (iyi sinyalde yaklaşık 1 dakika, en çok 10 dakika) bitince ya da kullanıcı yürüyüşü bitirince kapanır ve bildirim kalkar. Arka plan konum izni kullanılmaz. Konum noktası ve rota saklanmaz, telefondan çıkmaz. Ertelenir ya da kesilirse: o yürüyüşün mesafesi boy ve adım ritminden tahmin edilir, veri kaybı olmaz.

Video (kısa): Adım ekranı > Yürüyüş başlat > "Yürüyüşte konum" açıklaması > İzin ver > sistem izni ("Uygulamayı kullanırken") > bildirimde "Yürüyüşte adım uzunluğu ölçülüyor" > Bitir > bildirim kalkar.

**Sağlık uygulaması beyanı:** "Tıbbi cihaz değildir; tanı ve tedavi önermez" (uygulamada `MED_NOTE`, Gizlilik ve veri ekranında ve Hakkında bölümünde görünür).

## Açık risk
- Konum türü ön plan servisinin hazır kullanım durumları (konum paylaşımı, navigasyon) birebir uymayabilir; "kullanıcının başlattığı yürüyüş takibi" olarak elle yazılmalı. Servis artık yalnız kullanıcı eylemiyle ve uygulama görünürken başlıyor, arka plandan başlatılmıyor. Ret gelirse seçenek: GPS penceresini tümden kaldırmak (yalnız boy tahmini; konum izinleri ve `FOREGROUND_SERVICE_LOCATION` da kalkar).
- `SCHEDULE_EXACT_ALARM` izni Android 14'te yedekten geri yüklenen kurulumda da kapalı gelir. Uyarı satırı bu durumu da kapsıyor.

## Kaynaklar
- Exact alarm politikası: https://support.google.com/googleplay/android-developer/answer/13161072
- Exact alarm izni ve davranış: https://developer.android.com/develop/background-work/services/alarms/schedule
- Arka plan konumu (artık kullanılmıyor): https://support.google.com/googleplay/android-developer/answer/9799150
- Ön plan konumu (servis ön planda başlarsa arka plana geçince erişim sürer): https://developer.android.com/develop/sensors-and-location/location/permissions
- Konum türü servis şartları: https://developer.android.com/develop/background-work/services/fgs/service-types
- Ön plan servisi beyanı: https://support.google.com/googleplay/android-developer/answer/13392821
