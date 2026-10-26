# Faz 6 — dış servisler, veri aktarımı, güvenlik ve gizlilik

## Dış endpoint envanteri

| Servis | Dosya | Veri/amaç | Ağ katmanı |
|---|---|---|---|
| Open Food Facts | `www/main/04-sheets.js:294` | Barkod ürün bilgisi; yalnız barkod ve sabit fields sorgusu | `NetLog.fetch("off", ...)` |
| Ezan Vakti | `www/modules/habits/ramadanui.js:42` | Seçilen şehir için Ramazan vakitleri | `NetLog.fetch("ram", ...)` |
| NVIDIA | `www/modules/coach/coach.js:63` | Coach chat/models | Provider zinciri + rıza |
| Groq | `www/modules/coach/coach.js:64` | Coach chat/models | Provider zinciri + rıza |
| OpenRouter | `www/modules/coach/coach.js:65` | Coach chat/models | Provider zinciri + rıza |
| Gemini OpenAI-compatible | `www/modules/coach/coach.js:66` | Coach chat/models | Provider zinciri + rıza |
| OpenAI | `www/modules/coach/coach.js:67` | Coach chat/models | Provider zinciri + rıza |
| Anthropic | `www/modules/coach/coach.js:68` | Coach chat/models | Provider zinciri + rıza |
| Custom provider | `www/modules/coach/coach.js:813-829` | Kullanıcının seçtiği HTTPS OpenAI-compatible endpoint | Kullanıcı seçimi + rıza |

## Network wrapper

`www/kernel/netlog.js:15` doğrudan `window.fetch` çağrısını sarıyor:

- 10 saniye timeout
- `ok` durumu loglanıyor
- `kind`, `host`, `t` tutuluyor
- Son 100 kayıt ve 30 günlük retention
- Log `nw_netlog` anahtarında tutuluyor

## Coach veri sınırı

Provider isteği `www/modules/coach/coach.js:214` civarında hazırlanıyor. İstekten önce `gate(messages)` çağrılıyor; `www/kernel/piilib.js:114` her provider gövdesinin PII maskeleme kapısından geçmesini amaçlıyor.

Uygulama ayrıca:

- Provider URL'lerini allowlist ile normalize ediyor (`coach.js:82-96`)
- API key'i memory'de tutuyor; Android'de KeyVault ile şifreli saklamayı deniyor (`coach.js:3`, `17-55`)
- Sağlık verisi paylaşımı için açık rıza ve provider set kontrolü kullanıyor (`coach.js:601-614`)
- 18 yaş altı için rıza zincirini kapatıyor (`coach.js:614`, `751`)
- Kullanıcının paylaşacağı profil alanlarını ayrı ayrı kapatmasına izin veriyor (`coach.js:163-172`)

## Yedek ve export

- İnsan tarafından okunabilir archive bilerek API key, provider listesi, cycle ve bazı özel sağlık alanlarını dışarıda bırakıyor (`www/modules/data/archivelib.js:2-18`).
- Ana yedek PBKDF2-SHA256 + AES-GCM kullanıyor (`www/modules/data/backuplib.js:2-22`).
- Her encryption için yeni salt ve IV üretiliyor.
- Paylaşım dosyaları native cihazda `CACHE` içine yazılıyor ve sonraki yazma/boot öncesi temizleniyor (`www/kernel/share.js:12-23`, `50-52`).
- Kullanıcı isteğiyle şifreli export ayrıca yapılabiliyor (`share.js:29-50`).

## Web güvenliği

CSP `www/index.html:11`:

```text
default-src 'self'
script-src 'self' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
connect-src 'self' https:
object-src 'none'
base-uri 'none'
form-action 'none'
```

Kodda çok sayıda `innerHTML`/template string kullanımı var. Güvenli kullanım için `esc()` ve sabit UI parçaları sıkça kullanılıyor; ancak `innerHTML` yüzeyi geniş olduğu için bu fazda otomatik sink-source taint analizi yapılmadı. Özellikle fotoğraf URL'leri, provider/model adları ve kullanıcı girdiğinin HTML'e girdiği noktalar ayrıca doğrulanmalı.

## Android yedekleme

`android/app/src/main/AndroidManifest.xml` mevcut generated dosyada `android:allowBackup="true"` gösteriyor. Buna karşılık `scripts/patch-android.js:41-44` release patch'i bunu `false` yapıyor ve backup/data extraction kuralları ekliyor. Bu iki durum arasında şu risk vardır:

- Patch scripti çalışmadan local/generated Android build alınırsa sistem yedeklemesi açık kalabilir.
- CI patch sırasına bağlı release güvenliği vardır.

Bu, release build'de patch sonrası manifest çıktısı ile doğrulanmalıdır.

## Güvenlik/gizlilik bulguları

### Yüksek doğrulama gerektiren

1. Generated manifest ile patch scripti farklı: mevcut manifest backup'ı açık gösteriyor, patch hedefi kapatıyor.
2. Coach provider'larına sağlık verisi gönderimi teknik olarak rıza ve PII gate ile korunuyor; gerçek gönderilen body'nin tüm alanları runtime fixture ile doğrulanmalı.

### Orta

1. Browser fallback'te KeyVault yoksa API key plain text saklanıyor (`coach.js:3`).
2. `connect-src 'self' https:` tüm HTTPS hedeflerine izin veriyor; provider allowlist coach kodunda var, fakat diğer endpoint'lerde CSP geniş.
3. `nw_netlog` host/zaman/kind metadata'sını localStorage'da tutuyor; privacy temizliğinde network log temizliği bu taramada doğrulanmadı.
4. Çok geniş `innerHTML` yüzeyi manuel güvenlik denetimi gerektiriyor.

### Tasarım korumaları

- Backup AES-GCM authenticated encryption kullanıyor.
- Android kaynakları için backup exclusion kuralları tanımlı.
- İlaç ve motion privacy temizliği native wipe çağrısını bekliyor.
- Lock screen notification ayrıntısı JS/native kanal seçimiyle azaltılmaya çalışılıyor.
