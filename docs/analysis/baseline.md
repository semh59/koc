# Faz 0 — baseline

## Repository durumu

- Branch: `anasayfa-b`
- HEAD: `854b41f69f3553ab6c4b6e8d613c90bd8541221b`
- Son commit: `854b41f 2026-10-18T12:17:26+03:00 Today: quick chip labels stay 15 px (the elderly reader's size)`
- Çalışma ağacı: `git status --short --branch` yalnızca branch satırı verdi; görünen yerel değişiklik yok.

## Kapsam ölçümü

- Git takipli dosya: `1129`
- Ana analiz kapsamındaki takipli dosya: `994`
- `www` + `assets/android` + `scripts` + `e2e` içindeki JS/Java/CSS/HTML toplamı: `31820` satır
- `www` JavaScript toplamı: `13480` satır

## Büyük JavaScript dosyaları

| Dosya | Satır |
|---|---:|
| `www/modules/gym/gym.js` | 943 |
| `www/modules/coach/coach.js` | 937 |
| `www/modules/nutrition/foods.js` | 867 |
| `www/modules/meds/medui.js` | 534 |
| `www/main/04-sheets.js` | 435 |
| `www/modules/meds/medlib.js` | 406 |
| `www/kernel/algo.js` | 354 |
| `www/main/03-screens.js` | 343 |
| `www/main/01-core.js` | 340 |

## İlk risk sinyalleri

1. Uygulama JS tarafı klasik import/export yerine büyük ölçüde global namespace ve script sırasına dayanıyor.
2. `www/index.html` 104 script kaynağı yükledi; bunların 15'i domain modülü klasörlerinde.
3. Ana scriptler `text/x-main` bloklarında tutuluyor ve fetch edilip tek script olarak çalıştırılıyor (`www/index.html:153-154`).
4. Action registry kullanımı şu an sınırlı görünür: `Act.on` 3, `Act.run` 1; bu, iletişimin önemli bölümünün başka kanallarda olabileceğini gösterir.
5. `localStorage` güvenli yardımcılar üzerinden ve store katmanı üzerinden kullanılıyor; anahtar sahipliği Faz 3-4'te çıkarılmalı.
6. Sağlık verisi içeren uygulamada native plugin ve network log akışları ayrı güvenlik incelemesi gerektiriyor.

## Bu fazın sonucu

Kapsam sabitlendi. Analizin referans noktası HEAD commit'tir. `docs/analysis/` çıktıları çalışma ağacına yeni analiz artefaktları olarak eklenmiştir; bunlar üretim kodu değildir.
