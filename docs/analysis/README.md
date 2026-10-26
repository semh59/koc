# NeoWell derin modül ve haberleşme analizi

Bu klasör, `D:/PROJECT/koc` kod tabanının fazlara bölünmüş, kanıt-temelli mimari analizini içerir.

## Faz durumu

- [x] Faz 0 — kapsam ve baseline
- [x] Faz 1 — fiziksel yükleme/boot haritası
- [x] Faz 2 — modül envanteri ve ilk iletişim yüzeyi
- [x] Faz 3 — action/event/global state/storage ayrıntı haritası
- [x] Faz 4 — veri yaşam döngüsü ve sahiplik
- [x] Faz 5 — native Android köprüleri
- [x] Faz 6 — dış servisler, güvenlik ve gizlilik
- [x] Faz 7 — test ağı, runtime doğrulama ve bulgular

## Kanıt kuralı

Sonuçlar üretim kodundan veya komut çıktısından türetilir. Önemli iddialar `dosya:satır` ile gösterilir. Bu ilk belgeler statik tarama sonuçlarıdır; runtime davranışı henüz doğrulanmış sayılmaz.

## Kapsam

Ana üretim kapsamı: `www/`, `assets/android/`, `scripts/`, `e2e/`, `android/`, yapılandırma ve ilgili dokümantasyon. `node_modules/`, `scratch/` ve rapor çıktıları ayrı tutulur.

## Çıktılar

- `baseline.md` — repository durumu ve ölçümler
- `boot-sequence.md` — HTML/script yükleme ve boot akışı
- `module-inventory.md` — modül envanteri ve sınırları
- `communication-surface.md` — ilk iletişim yüzeyi bulguları
- `diagrams/boot-flow.mmd` — boot diyagramı
- `diagrams/module-load-order.mmd` — modül yükleme sırası

## 4. Release guard

CI runs `npx cap add android`, `node scripts/patch-android.js`, `npx cap sync android`, then `npm run android:sync:verify` before Gradle. Local verification is available with `npm run android:sync:verify`; it fails closed if generated sources are missing, stale, or different from `assets/android/`.
