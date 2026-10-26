# Faz 5 — JavaScript ↔ Android native köprüleri

## Native plugin kayıt noktası

`assets/android/MainActivity.java:21-34` şu özel Capacitor pluginlerini kaydediyor:

```text
Health
MedWake
AppLock
KeyVault
DeviceHelp
StepCounter
Ocr
QuickLog
Motion
Widget
Speech
BackupFolder
```

`android/app/src/main/assets/capacitor.plugins.json` ise paket tarafından sağlanan pluginleri listeliyor:

```text
BarcodeScanner
App
Filesystem
LocalNotifications
Share
```

JS tarafında plugin erişiminin ortak noktası `www/main/01-core.js:300-301`:

```text
isNative() → window.Capacitor.isNativePlatform()
plugin(name) → window.Capacitor.Plugins[name]
```

## Köprü envanteri

| Plugin | Native sınıf/metotlar | JS çağrı yüzeyi | Alan |
|---|---|---|---|
| `Health` | `status`, `request`, `manage`, `steps`, `daily` | `www/modules/pulse/hcui.js` | Health Connect adım/uyku/nabız |
| `MedWake` | `set`, `fsi`, `fsiSettings`, `settings`, `test`, `log`, `wipe`, `clearLog`, `snooze` | `www/main/05-notifications.js`, `modules/meds/*` | ilaç alarmı, fullscreen, alarm logu |
| `AppLock` | `status`, `authenticate`, `setSecure` | `modules/data/lockui.js` | biyometrik uygulama kilidi |
| `KeyVault` | plugin kayıtlı; encrypt/decrypt/wipe çağrıları | `www/kernel/ls.js`, `modules/coach/coach.js`, `backupui.js` | API anahtarları/yedek parolası |
| `DeviceHelp` | `info`, `openDetails`, `sms`, `openAutostart`, `openBattery`, `keepAwake`, `secure` | bildirim, ilaç, gym, fotoğraf UI | cihaz/üretici ayarları |
| `StepCounter` | `status`, `requestAccess`, `start`, `read` | `modules/motion/stepsui.js`, `main/05-permissions.js` | cihaz adım sensörü |
| `Ocr` | `scan`/native OCR yüzeyi ayrıca doğrulanmalı | `modules/nutrition/ocrui.js`, `main/04-sheets.js` | besin etiketi OCR |
| `QuickLog` | native quick action / intent işleme | `MainActivity`, `QuickLogPlugin` | bildirimden su/ilaç kaydı |
| `Motion` | `status`, `requestAccess`, `walkGps`, `configure`, `start`, `stop` | `modules/motion/motionui.js` | hareket/GPS yürüyüşü |
| `Widget` | `update`, `open` listener | `main/03-screens.js`, `main/06-events.js` | ana ekran widget’ı |
| `Speech` | native sınıf kayıtlı; JS çağrısı ayrıca doğrulanmalı | henüz tam eşleşme çıkarılmadı | sesli giriş |
| `BackupFolder` | `status`, `pick`, `clear`, `write`, `remove` | `modules/data/backupui.js` | seçilmiş klasöre yedek |
| `BarcodeScanner` | üçüncü taraf Capacitor plugin | `main/04-sheets.js` | barkod tarama |
| `Filesystem` | üçüncü taraf plugin | `kernel/share.js` | geçici export dosyaları |
| `Share` | üçüncü taraf plugin | `kernel/share.js` | dosya paylaşımı |
| `LocalNotifications` | üçüncü taraf plugin | `main/05-notifications.js`, `meds/alarmui.js` | bildirim planlama/izin |

## Önemli çağrı zincirleri

### İlaç alarmı

```text
meds UI / notification scheduler
→ plugin("MedWake")
→ MedWake.set / fsi / settings / log
→ MedWakeReceiver + Alarms
→ lock-screen notification/alarm activity
```

`www/main/05-notifications.js:95` ilaç saatlerini ve dozlarını `MW().set(...)` ile native katmana aktarır. Native tarafta `MedWakePlugin` alarm ayarı ve log metodlarını sağlar.

### Adım sayacı

```text
permissions UI
→ StepCounter.requestAccess
→ StepCounter.start
→ StepCounter.read
→ stepsui state/update
→ S / render / save
```

`www/main/06-events.js:121` uygulama başlangıcında `SC().start()` ve `stepsSync()` çağırır. `www/modules/motion/stepsui.js:31` cihazdan `read()` ile veriyi alır.

### Motion/GPS

```text
motionui
→ Motion.configure(height, weight)
→ Motion.start/stop veya walkGps(on)
→ MotionGpsService / MotionReceiver
→ native result
→ S.walk / S.moves
```

### Coach anahtar kasası

```text
coach key state
→ KeyVault.encrypt/decrypt/wipe
→ localStorage encrypted payload
```

`www/modules/coach/coach.js:17-42` KeyVault varsa anahtarları şifreleyerek localStorage'a koyuyor; native vault yoksa fallback davranışı ayrıca güvenlik incelemesi gerektiriyor.

### Export/share

```text
export bytes
→ Filesystem.writeFile(CACHE)
→ Share.share(uri)
→ nw:boot/cacheClean ile geçici dosya temizliği
```

`www/kernel/share.js:15-23`, export dosyalarının CACHE altında tutulup paylaşım sonrası temizlendiğini gösteriyor.

## Android lifecycle bulguları

- `MainActivity` `singleTask` olarak manifestte tanımlı (`android/app/src/main/AndroidManifest.xml`).
- `MainActivity.onCreate` içinde pluginler `super.onCreate` öncesi kaydediliyor (`assets/android/MainActivity.java:21-34`).
- Quick action intent'i process recreation durumunda eski action'ın tekrar işlenmesini önlemek için temizleniyor (`MainActivity.java` yorum ve ilk blok).
- `Widget` ve `LocalNotifications` JS listener'ları `main/06-events.js:134-141` içinde bağlanıyor.
- Native alarm, receiver ve activity akışı JS UI mevcut olmasa da çalışabilecek şekilde tasarlanmış; bu nedenle background/process-death testleri kritik.

## Native izin yüzeyi

- `HealthPlugin` Health Connect read permissions tanımlıyor: steps, sleep, heart rate (`assets/android/HealthPlugin.java:39`).
- `MotionPlugin` ve `StepCounterPlugin` hareket/sensör erişimi istiyor.
- `LocalNotifications` exact alarm/notification permission UI akışı JS tarafında ele alınıyor.
- `BackupFolder` dosya seçimi ve yazma izinlerini native Storage Access Framework üzerinden yönetiyor.

## Faz 5 açık kontrolleri

1. `assets/android` ile `android/app/src/main/java` kaynaklarının gerçekten aynı sürüm olup olmadığı.
2. Ocr/Speech/Backup/Widget JS method isimlerinin native methodlarla eksiksiz eşleşmesi.
3. Her native error callback'inin JS tarafında kullanıcıya/telemetry'ye ulaşması.
4. Process death sonrası alarm, step ve motion state tutarlılığı.
5. Android manifest permission/service/receiver deklarasyonlarının tüm native sınıflarla eşleşmesi.
