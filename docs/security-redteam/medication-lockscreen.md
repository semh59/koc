# NeoWell no-Coach güvenlik bulgusu: restore ile lock-screen gizlilik ayarının düşürülmesi

## Karar

- Repo: `D:/PROJECT/NeoWell`
- Dal: `release/no-coach`
- Bulgunun bulunduğu temel commit: `6d67084`
- Durum: **Düzeltildi; aynı exploit düzeltme sonrası başarısız.**
- Hedef: kötü amaçlı backup → restore → ilaç bildirimi/lock-screen native payload

## Saldırı ön koşulu

Saldırganın geçerli NeoWell backup parolasına sahip olması veya kullanıcıyı dosyayı ve parolayı restore etmeye ikna etmesi gerekir. Saldırgan backup içine:

- `medShowName: true`
- `lockOn: false`
- `lockDetail: true`
- kötü amaçlı ilaç adı

yazdı. Hedef cihazda başlangıç durumu `lockOn: true`, `lockDetail: false`, `medShowName: false` idi.

## Düzeltme öncesi kırmızı kanıt

Düzeltme öncesi kırmızı kanıt, düzeltme uygulanmadan önce çalıştırılan geçici harness'in canlı çıktısından alındı (harness commit'e alınmadı; aşağıdaki kalıcı test düzeltme sonrası regresyon kapısıdır). Aynı gerçek browser restore akışında şifreli payload üretildi, UI üzerinden onaylandı ve native çağrı argümanları gözlendi.

Sonuç: test beklenen güvenlik koşulunda başarısız oldu.

Gözlenen gerçek etki:

- Restore sonrası cihaz ayarları: `lockOn=false`, `lockDetail=true`, `medShowName=true`.
- `LN.schedule` payload’ı ilaç adını ve saldırı HTML metnini taşıdı.
- `MedWake.set` payload’ı aynı metni native alarm dozuna taşıdı.
- Bildirim kanalı `nw_med` oldu; gizli kanal `nw_medp` kullanılmadı.

Bu, yalnız static grep değildir; şifreli payload üretildi, gerçek restore UI’sinden yüklendi, onay verildi ve native plugin çağrı argümanları gözlendi.

## Kök neden

`www/main/04-sheets.js:417` restore sırasında yalnız `noticeOk` ve `hideRecents` gibi bazı cihaz-tercihlerini koruyor, fakat `lockOn`, `lockDetail`, `lockGrace`, `widgetHide` ve `medShowName` alanlarını yedek state’inden alıyordu. Bildirim sınırı `www/main/05-notifications.js:7-15,73-75,94` bu ayarlara göre kanal ve metin seçiyor; `www/modules/meds/medlib.js:254-280,321-328` ilaç adını notification ve wake payload’ına koyuyor.

## Düzeltme

`www/main/04-sheets.js:417` restore sonrasında şu cihaz-gizlilik ayarları önceki cihaz state’inden korunuyor:

- `lockOn`
- `lockGrace`
- `lockDetail`
- `widgetHide`
- `medShowName`

Yedek hâlâ ilaç kayıtlarını ve `medOn` gibi uygulama verilerini taşıyabilir; ancak yeni cihazın mevcut kilit ekranı gizlilik politikasını düşüremez.

## Düzeltme sonrası tekrar saldırısı

Kalıcı test:

- `e2e/security-redteam-medication.spec.js`

Komut:

```text
NO_COACH_E2E=0 npx playwright test e2e/security-redteam-medication.spec.js -c e2e/playwright.config.js --project=phone-360 --workers=1 --reporter=line --trace=off
```

Sonuç: **1 test geçti, exit code 0.**

Gözlenen sonuç:

- Ayarlar: `medOn=true`, `medShowName=false`, `lockOn=true`, `lockDetail=false`.
- Notification: başlık `NeoWell: hatırlatma`, gövde `Açmak için dokun`, kanal `nw_medp`.
- Native wake dozu: `İlaç saatin geldi.`; ilaç adı yok.
- `leaked=0`; probe marker hiçbir native çağrı argümanına girmedi.

## Sınıflandırma

- CWE: **CWE-359 — Exposure of Private Personal Information to an Unauthorized Actor**
- Etki: ilaç adı ve kullanıcı tarafından yazılabilen ilaç metni, cihazın mevcut lock-screen gizlilik tercihi kapalıyken bildirim/native alarm payload’ına çıkabiliyordu.
- CVSS 3.1: **3.3 Low** — `CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:L/I:N/A:N`. Yerel backup dosyası/parola ve kullanıcı restore onayı gerekir; etki gizlilikle sınırlıdır.
- Bu bulgu XSS veya native code execution değildir; doğrulanmış etki gizlilik ayarının düşürülmesi ve hassas metnin native bildirim sınırına taşınmasıdır.

## Açık kalan üst seviye riskler

- Gerçek Android WebView, gerçek notification renderer ve lock-screen fiziksel cihazda çalıştırılmadı; test browser + native shim seviyesindedir.
- `www/main/05-notifications.js:94` native `MedWake.set` hatasını yutuyor. Bu nedenle native taraf daha önce kaydedilmiş ayrıntılı `detail` veya doz metnini korursa, browser düzeltmesi tek başına stale native state'i temizlediğini kanıtlamıyor. Bu statik/native failure-path riskidir; fiziksel cihazda yeniden üretilemedi ve doğrulanmış ikinci açık olarak sınıflandırılmadı.
- PDF/CSV export, Android intent/SAF ve diğer restore sonrası modüller ayrı saldırı yüzeyleridir.
- Fiziksel cihaz testinde notification gövdesinin gerçekten lock-screen’de nasıl göründüğü ayrıca doğrulanmalıdır.
