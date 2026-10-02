# Play izin beyanları

Son gözden geçirme: 2 Ekim 2026. Kaynak: `scripts/patch-android.js`, eklenti manifestleri ve son APK'nın birleşik manifesti. CI her derlemede APK'nın izin listesini yazdırır ve `USE_EXACT_ALARM` ya da `FLASHLIGHT` görürse durur.

## Kaldırılan izinler
| İzin | Neden kaldırıldı |
|---|---|
| `USE_EXACT_ALARM` | Play bu izni yalnız "alarm veya zamanlayıcı uygulaması" ile "etkinlik bildirimi gösteren takvim uygulaması" için kabul ediyor, diğer uygulamalara `SCHEDULE_EXACT_ALARM` diyor. NeoWell'in ana işlevi bunlardan biri değil, ilaç hatırlatıcı bu tanıma girmiyor. |
| `FLASHLIGHT` | Fener hiçbir yerde açılmıyor. Barkod Google'ın tarayıcı ekranıyla (`scan()`) okunuyor, `enableTorch` çağrılmıyor. |

## Kalan izinler
| İzin | Hangi özellik | Kullanıcı nasıl görüyor | Play Console |
|---|---|---|---|
| `INTERNET`, `ACCESS_NETWORK_STATE` | Koç (kullanıcının kendi API anahtarıyla dil modeli), Open Food Facts barkod araması. `ACCESS_NETWORK_STATE` Google Play hizmetleri kitaplığından geliyor. | Sistem penceresi yok (normal izin). | Beyan gerekmez. Veri güvenliği formunda Koç'a giden veri yazılmalı (B6). |
| `POST_NOTIFICATIONS` | Su, tartı, ilaç, oruç ve yedek hatırlatmaları. | Android 13+ sistem penceresi, ilk hatırlatma kurulurken. Ayarlar > Hatırlatmalar durumu gösterir. | Beyan gerekmez. |
| `SCHEDULE_EXACT_ALARM` | İlaç alarmı ve hatırlatmaların tam saatinde çalması. | Android 13+ yeni kurulumda izin verilmiş gelmez. İzin yoksa eklenti alarmı yaklaşık saate kurar (çökme yok). Bugün > yapılacaklar listesinde (ilaç varsa) ve Ayarlar > Hatırlatmalar'da uyarı çıkar. "İzin ver" düğmesi sistem ekranını açar, dönünce hatırlatmalar yeniden kurulur. | Beyan formu yok. Kullanıcı izni sistem ekranından verir. |
| `RECEIVE_BOOT_COMPLETED` | Telefon yeniden açılınca alarmları, adım anlık görüntüsünü ve hareket algılamayı yeniden kurmak. | Sistem penceresi yok. | Beyan gerekmez. |
| `WAKE_LOCK` | Bildirim eklentisi ve Play hizmetleri, alarm teslimi sırasında. | Sistem penceresi yok. | Beyan gerekmez. |
| `VIBRATE` | Dinlenme süresi bitti titreşimi, rekor titreşimi, ilaç alarm kanalı. | Sistem penceresi yok. | Beyan gerekmez. |
| `CAMERA` | Besin etiketi ve tahlil fotoğrafı (ML Kit yazı tanıma, telefonda). Fotoğraf alanı kamerayı açtığında Capacitor izni sorar. | Fotoğraf çekmek istendiğinde sistem penceresi. | Beyan gerekmez. |
| `ACTIVITY_RECOGNITION` | Adım sayar ve yürüyüş/koşu algılama. | "Adım sayarı aç" ya da "Hareket algılamayı aç" sırasında sistem penceresi. | Beyan gerekmez. Sağlık uygulaması beyanında adım/aktivite verisi yazılmalı. |
| `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` | Hareket algılamada yürüyüş/koşu sırasında yaklaşık 1 dakikalık GPS ölçümü (adım uzunluğu, mesafe). Rota ve konum noktası saklanmaz. | Önce uygulama içi "Konum izni hakkında" açıklaması, sonra sistem penceresi. | Konum verisi veri güvenliği formunda "toplanmaz/cihazda işlenir" olarak doğru işaretlenmeli. |
| `ACCESS_BACKGROUND_LOCATION` | Aynı GPS ölçümünün uygulama kapalıyken de yapılması. | Açıklama ekranı kodda var (`motionui.js`, `motionDisclose`): "konum", "uygulama kapalıyken ya da kullanılmıyorken", özellik adı ve reklam yok bilgisi, Devam/Vazgeç. Vazgeç izin istemez. Ardından "Her zaman izin ver" sistem ekranı. | İzin beyan formu ve en fazla 30 saniyelik video gerekir (özellik açılışı, açıklama ekranı, sistem izni). Taslak aşağıda. |
| `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION` | `MotionGpsService`: GPS ölçümü sürerken görünen bildirimli konum servisi (Android 14 türlü servis kuralı). | Ölçüm boyunca kalıcı bildirim. | Ön plan servisi beyanı: işlev açıklaması, ertelenirse etkisi, video. Taslak aşağıda. |

## Beyan metni taslakları

**Arka plan konumu (ACCESS_BACKGROUND_LOCATION)**
> NeoWell'in hareket algılama özelliği, kullanıcı açtığında yürüyüş ve koşuyu kendisi algılar. Bir yürüyüş başladığında adım uzunluğunu ve mesafeyi ölçmek için GPS'i yaklaşık 1 dakika açar. Yürüyüş çoğu zaman uygulama kapalıyken başladığı için bu ölçüm arka planda konum gerektirir. Konum noktaları ve rota saklanmaz, yalnız mesafe ve hız sonucu telefonda kaydedilir; veri sunucuya gönderilmez ve reklam için kullanılmaz. İzin verilmezse hız adım ritminden hesaplanır, özellik çalışmaya devam eder.

Video: Ayarlar > Hareket algılama > Aç > "Konum izni hakkında" ekranı > Devam > sistem izinleri ("Her zaman izin ver") > Adım ekranında Hareketler kartı.

**Ön plan servisi, konum türü (FOREGROUND_SERVICE_LOCATION)**
> İşlev: Algılanan yürüyüş veya koşu sırasında mesafe ölçümü için yaklaşık 1 dakikalık GPS penceresi; ölçüm bitince servis kendini kapatır ve bildirim kalkar. Ertelenir ya da kesilirse: o yürüyüşün mesafesi GPS yerine adım ritminden tahmin edilir; veri kaybı olmaz.

**Sağlık uygulaması beyanı:** "Tıbbi cihaz değildir; tanı ve tedavi önermez" (B6/B10 ile birlikte).

## Açık risk
- Konum servisi kullanıcı o anda dokunmadan, yürüyüş algılanınca başlıyor. Play'in ön plan servisi sayfası bunu "arka plan konumuna eşdeğer" sayıyor ve tam arka plan konum şartlarını uyguluyor. Listedeki hazır kullanım durumları (konum paylaşımı, navigasyon, coğrafi sınır) birebir uymuyor, durumu elle yazmak gerekecek. Ret gelirse seçenek: GPS ölçümünü kaldırıp yalnız adım ritmiyle hız (izin listesi kısalır).
- `SCHEDULE_EXACT_ALARM` izni Android 14'te yedekten geri yüklenen kurulumda da kapalı gelir. Uyarı satırı bu durumu da kapsıyor.

## Kaynaklar
- Exact alarm politikası: https://support.google.com/googleplay/android-developer/answer/13161072
- Exact alarm izni ve davranış: https://developer.android.com/develop/background-work/services/alarms/schedule
- Arka plan konumu: https://support.google.com/googleplay/android-developer/answer/9799150
- Ön plan servisi beyanı: https://support.google.com/googleplay/android-developer/answer/13392821
