# Faz 5 — native risk ve doğrulama planı

## Kaynak senkronizasyonu riski

Projede iki native kaynak alanı var:

```text
assets/android/*.java
android/app/src/main/java/com/neowell/app/*.java
```

CI akışı `npx cap add android`, `scripts/patch-android.js` ve `npx cap sync android` çalıştırıyor (`.github/workflows/apk.yml:56-59`). Bu nedenle `assets/android` kaynakları şablon/patch girdisi, `android/app/src` ise üretilmiş veya CI sonrası çalışma alanı olabilir. İki alanın checksum ve diff karşılaştırması ayrıca yapılmadan hangi dosyanın release'e girdiği kesinleştirilmemeli.

## Native hata sınırı

Capacitor pluginleri `PluginCall.resolve/reject` ile JS Promise sonucunu taşıyor. Her plugin için kontrol listesi:

- Eksik parametre `reject` ediyor mu?
- Android izin reddi `reject` ediyor mu?
- Activity yokken çağrı güvenli mi?
- Background callback JS yokken veri kaybediyor mu?
- Native exception catch ediliyor mu?
- JS tarafı `catch` veya rejection handler koyuyor mu?

## Background riskleri

Öncelikli senaryolar:

1. İlaç alarmı uygulama kapalıyken çalar.
2. QuickLog bildirimi uygulama açık değilken su/ilaç kaydeder.
3. `MotionGpsService` uygulama arka plandayken yürüyüşü sürdürür.
4. Step receiver process ölümünden sonra snapshot üretir.
5. Widget eski state ile açılır.
6. AppLock activity yeniden oluşturulur.

## Güvenlik kontrolleri

- KeyVault yokken coach/provider anahtarlarının nerede tutulduğu.
- `BackupFolder.write` ile yazılan yedeklerin şifreli olup olmadığı.
- Bildirim lock screen gövdesinde ilaç/ölçüm bilgisinin görünmesi.
- `FileProvider` URI izinlerinin yalnız paylaşım hedefiyle sınırlı olması.
- `android:allowBackup` açıkken hassas state'in sistem yedeğine girip girmediği.
- Widget'ın kişisel/sağlık verisini lock screen'e taşıyıp taşımadığı.

## Test gereksinimleri

Native bridge fazı için minimum test matrisi:

| Alan | Başarı | Reddetme/hata | Process death |
|---|---|---|---|
| Health | veri okuma | Health Connect izni yok | yeniden açılış |
| StepCounter | adım okuma | sensör/izin yok | receiver snapshot |
| Motion | yürüyüş başlat/durdur | GPS kapalı | servis restart |
| MedWake | alarm kur/sil | exact alarm yok | alarm activity |
| BackupFolder | yedek yaz/oku | klasör iptal/kota | yeniden açılış |
| AppLock | biyometrik başarı | iptal/lockout | activity recreate |
| KeyVault | encrypt/decrypt | vault yok | anahtar kaybı |
| Widget | state güncelle | plugin yok | widget refresh |

## Geçici bulgu sınıflandırması

- **Yüksek doğrulama ihtiyacı:** `android:allowBackup="true"` ile sağlık state'i ve yedekleme politikası.
- **Orta:** assets/android ile generated android source ayrışma ihtimali.
- **Orta:** Native plugin method eşleşmelerinin tümü henüz otomatik doğrulanmadı.
- **Belirsiz:** Gerçek key vault fallback güvenlik seviyesi ve export şifreleme durumu.
