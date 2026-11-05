# Security red-team: restore modülleri, bildirim metni ve kaynak tüketimi

## Durum

**Sonuç: doğrulanmış güvenlik açığı yok.** İnceleme `release/no-coach` dalında, önceki medication düzeltmesini içeren temiz çalışma ağacında yapıldı. Browser/native-shim kanıtı gerçek Android cihaz kanıtı değildir.

## 1. Restore sonrası modül render sınırı

Tek bir gerçek şifreli backup payload’ı UI üzerinden geri yüklendi. Payload şu alanlarda aynı saldırı metnini taşıdı:

- tahlil adı: `labs[].n`
- vital notu: `vitals[].note`
- tarif adı ve malzeme adı: `recipes[]`
- favori ve öğün şablonu metni: `favFoods[]`, `mealTpl[]`
- Gym özel egzersiz, antrenman ve set notu: `customEx[]`, `workouts[]`, `templates[]`
- günlük not kaydı

Gerçek restore confirmation onaylandı ve ardından şu ekranlar açıldı:

- `labs`
- `bp`
- `history` araması
- `gym`
- yemek/favori paneli

Sonuç: geçici browser replay `1 passed`, exit `0`.

Gözlemler:

```text
dangerous DOM nodes: 0
window marker: null
```

Payload state içinde kaldı; HTML olarak çalışmadı. `mealTpl` adı beklenen 40 karakterlik ürün sınırına kırpıldı. Bu normalizasyon davranışı güvenlik sonucunu değiştirmedi.

## 2. Backup hatırlatıcı metni → native bildirim

Backup içindeki su hatırlatıcısının `title` ve `body` alanları saldırı metniyle değiştirildi. Gerçek restore sonrası `scheduleReminders()` çağrıldı ve `LocalNotifications.schedule` argümanları native shim sınırında yakalandı.

Gözlenen payload:

- başlık ürünün sabit `💧 Su molası` başlığı olarak kaldı
- saldırı metni native notification `body` alanına literal taşındı
- `window.__probe`: `null`
- browser dangerous node: `0`
- native payload içinde marker bulundu (`raw=true`)

Bu, browser XSS veya native code execution kanıtı değildir. Hatırlatıcı başlık/gövdesi zaten kullanıcının kendi yerel hatırlatıcı metnidir; bu nedenle ayrı doğrulanmış güvenlik açığı olarak sınıflandırılmadı. Gerçek Android NotificationManager/renderer davranışı ayrıca doğrulanmalıdır.

## 3. Büyük şifreli backup kaynak tüketimi

Paste edilen gerçek AES-GCM backup:

```text
entries: 60.000
şifreli envelope: 6.465.482 byte
```

Gerçek restore UI confirmation ve yükleme akışında ölçüm:

```text
confirmation: 1.370 ms
restore toplamı: 1.566 ms
state entries: 60.000
```

60.000 kayıtla kaynak tüketimi/DoS gözlenmedi. Bu tek browser/Chromium koşusudur; düşük bellekli gerçek Android cihazda aynı sonuç garanti edilmez. Dosya restore yolu için mevcut 20 MB dosya sınırı vardır; paste yolunun ayrı boyut sınırı bulunmadığı statik olarak not edilmiştir, fakat bu probe’da doğrulanmış DoS oluşmadı.

## Komşu regression kapıları

Son temizlik sonrası:

- modül render replay: `1/1`
- notification native-shim replay: `1/1`
- büyük backup replay: `1/1`
- backup XSS ve medication komşu regression: `4/4` — phone-360 ve phone-412
- tam karma E2E: çalıştırıldı, `248 passed`, exit `1`; kalan 26 testte ortak hata `page.goto("/index.html") → Protocol error: Cannot navigate to invalid URL` oldu. Bu ürün assertion’ı değildir; suite temiz kapanmadığı için tam karma E2E yeşil sayılmamıştır.
- no-Coach scoped host: `80 executed, 0 failed`
- native static: geçti
- Android sync: `28 Java / 44 kaynak / 758 web asset`

Geçici probe dosyaları commit edilmeden silindi. Üretim kodu bu fazda değiştirilmedi.

## Kanıt sınırı ve açık risk

- Browser escaped DOM sonucu gerçek Android WebView/renderer sonucu değildir.
- Native-shim notification payload’ı gerçek Android NotificationManager veya OEM lock-screen sonucu değildir.
- Fiziksel Android’de hatırlatıcı metni, Android 13+ bildirim izinleri, OEM renderer ve düşük bellek davranışı açık doğrulama kapsamıdır.
- Paste yolunda statik 20 MB sınırı yoktur; 6,4 MB/60.000 kayıt probe’u hızlı geçtiği için doğrulanmış DoS bulgusu açılmadı.
- PDF/CSV/SAF fazında raporlanan fiziksel cihaz riskleri de devam eder.
