# NeoWell no-Coach güvenlik red-team kaydı

## Durum

- Tarih: 2026-11-05
- Repo: `D:/PROJECT/NeoWell`
- Dal: `release/no-coach`
- HEAD: `572acf4eb70ac2732b887de3ef42ffa5c7d79620`
- Hedef: yayımlanan no-Coach uygulamasının backup restore → XSS/native bridge zinciri
- Karar: **Doğrulanmış açık yok; bu saldırı zinciri test edilen browser/native-shim kapsamı için kapatıldı. Fiziksel Android WebView kapsamı açık.**

## Saldırı ve ön koşul

Yetkili yerel Playwright hedefinde AES-GCM ile gerçek uygulama akışının kabul ettiği şifreli backup üretildi. Kullanıcı arayüzünden `Yedekten geri yükle` açıldı, saldırgan metni ve parola girildi, gerçek restore onayı verildi ve yedek yüklendi.

Payload, `note` ve `food` kayıtlarının `text` alanlarına şu tür çalıştırılabilir HTML koydu:

```html
<img src=x onerror=window.__probe='NW_SECURITY_PROBE_7f3c'>
```

## Gerçek kanıt

Komut:

```text
NO_COACH_E2E=0 npx playwright test e2e/security-redteam-backup.spec.js -c e2e/playwright.config.js --project=phone-360 --workers=1 --reporter=line
```

Sonuç: **1 test geçti**, exit code `0`.

Gözlemlenenler:

- Restore onayı gerçek uygulama metniyle görüntülendi: `Yedekten 2 kayıt yüklenecek`.
- Saldırı metni restore sonrası gerçek `S.entries` state’ine girdi.
- Gün ekranı: `dangerous=0`, `marker=null`, payload HTML olarak değil escaped metin olarak render edildi.
- Geçmiş arama: `dangerous=0`, `marker=null`, payload escaped metin olarak render edildi.
- Kayıt düzenleme: `dangerous=0`, `marker=null`; saldırı metni yalnız `textarea.value` içinde kaldı.
- Native bridge etkisi gözlenmedi; test tarayıcı hedefinde Capacitor plugin listesi boştu.
- Native shim çağrıları ayrıca kaydedildi: yalnız `App.addListener("backButton", ...)` görüldü; hiçbir çağrı argümanında probe marker'ı bulunmadı.

Kalıcı test: `e2e/security-redteam-backup.spec.js`

## Kaynak kanıtı

- `www/main/01-core.js:150-169` — `cleanEntries` kayıt metnini string olarak sınırlar ve state’e alır; HTML çalıştırmaz.
- `www/main/01-core.js:15` — `esc` HTML özel karakterlerini kaçışlar.
- `www/main/03-screens.js:21-25` — gün ekranındaki kayıt metni `esc(e.text)` ile render edilir.
- `www/modules/history/historyui.js:50-56` — geçmiş arama sonucu `esc(x.text||x.kind)` ile render edilir.
- `www/main/04-sheets.js:177-190` — düzenleme ekranında not metni `esc(e.text)` ile textarea içine alınır.
- `www/main/04-sheets.js:385-397` — restore önce decrypt eder, `buildState` ile temizler ve geçerli kayıt yoksa yüklemeyi durdurur.

## CWE/CVSS

Bu test edilen zincir için CWE/CVSS atanmadı; çalıştırılabilir etki oluşmadığı için doğrulanmış güvenlik bulgusu değildir.

- Saldırgan ön koşulu: geçerli backup parolası veya kullanıcının restore sırasında dosyayı/parolayı kabul etmesi.
- Gözlemlenen etki: kötü amaçlı metin state’e alınabiliyor, ancak test edilen ekranlarda HTML/JS çalışmıyor.
- Doğrulanmayan iddia: tüm gelecekteki/harici render noktalarının güvenli olduğu. Bu kayıt yalnız test edilen ekranları kapatır.

## Açık kapsam riski

- Fiziksel Android WebView ve gerçek Capacitor bridge üzerinde aynı payload’ın native WebView davranışı ayrıca test edilmedi; yerel Android SDK/ADB/JAVA_HOME mevcut değil.
- Restore sonrası tüm modül ekranları, PDF/export üretimi ve bildirim gövdeleri bu testte çalıştırılmadı.
- Bu nedenle sonuç `tüm uygulamada XSS imkânsız` değil, `test edilen restore → gün/geçmiş/düzenleme zincirinde açık doğrulanmadı` anlamındadır.

## Sonraki saldırı yüzeyi

Sıradaki yetkili hedef: import/restore alanlarının geri kalanı ve Android intent/SAF dosya sınırı. Aynı standart korunacak: gerçek payload, gözlemlenebilir etki, yanlış pozitif elemesi ve gerekiyorsa düzeltme sonrası tekrar saldırısı.
