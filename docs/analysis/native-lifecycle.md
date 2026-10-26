# Faz 5 — native lifecycle ve kaynak üretim zinciri

## Release kaynak zinciri

Native Java kaynakları `assets/android/` altında tutuluyor. `scripts/patch-android.js` bunları `android/app/src/main/java/com/neowell/app/` içine kopyalıyor; CI bu scripti `npx cap add android` sonrasında çalıştırıyor (`.github/workflows/apk.yml:56-59`). Bu nedenle mevcut generated Android klasörü ile kaynak şablonunu doğrudan karşılaştırmak release davranışını tek başına göstermez; release öncesi patch scriptinin çalışması gerekir.

## Gerçek karşılaştırma

Mevcut çalışma ağacında karşılaştırma sonucu:

- `assets/android` içinde 29 Java dosyası var.
- Generated source altında bunların bir bölümü yok, bir bölümü farklı.
- Bu durum beklenen olabilir; patch scripti henüz çalıştırılmamış veya generated proje eski olabilir.
- `scripts/patch-android.js` Java kaynak listesini açıkça tanımlar ve tüm release native dosyalarını kopyalar.

Sonuç: `android/app/src` mevcut hali release kaynağı olarak değil, patch sonrası üretilen çalışma alanı olarak değerlendirilmelidir.

## Manifest patch davranışı

`patch-android.js` şunları ekliyor:

- Notification, boot, vibration, exact alarm, full-screen intent izinleri
- Camera, activity recognition, location, foreground service izinleri
- Health Connect read izinleri
- Biometric izni
- Step snapshot ve motion receiver'ları
- GPS foreground service
- Medication alarm activity/receiver
- Health permission usage alias
- Widget receiver
- Water receiver
- `android:allowBackup="false"`
- TTS package visibility
- `adjustResize`
- Launcher shortcuts

Bu davranış `android/app/src/main/AndroidManifest.xml` dosyasına bakarak değil, patch scriptinden kanıtlanmıştır; script çalıştırılmadan generated manifest eksik görünebilir.

## Lifecycle olayları

| Olay | Native bileşen | Beklenen işlem |
|---|---|---|
| Boot completed | `StepSnapshotReceiver`, `MotionReceiver`, `MedWakeReceiver` | state/snapshot/alarm yenileme |
| App update | aynı receiver'lar | kayıtları yeniden kurma |
| Saat değişimi | `StepSnapshotReceiver`, `MedWakeReceiver` | gün/alarm zamanlarını düzeltme |
| Timezone değişimi | aynı receiver'lar | alarm ve gün sınırı düzeltme |
| Exact alarm permission değişimi | `MedWakeReceiver` | ilaç alarm planını yenileme |
| Widget update | `NeoWidget` | widget görünümünü güncelleme |
| Activity recreation | `MainActivity`, `AlarmActivity` | eski intent tekrarını önleme |

## Doğrulama sonucu

Native mantık testlerini CI'daki komutla çalıştırma denendi:

```text
javac ...
```

Bu Windows/bash ortamında `javac` bulunamadı:

```text
/usr/bin/bash: line 5: javac: command not found
```

Bu nedenle native test sonucu üretilmiş değildir. Eksik araç kurulmadan native testler geçmiştir denilemez.

## Faz 5 sonucu

JS plugin kayıtları, native sınıflar/metotlar, lifecycle receiver'ları, izinler ve release kaynak üretim zinciri belgelendi. Native mantık testleri Java JDK eksikliği nedeniyle doğrulanamadı. Sonraki faz dış servis/network, güvenlik ve gizlilik akışıdır.
