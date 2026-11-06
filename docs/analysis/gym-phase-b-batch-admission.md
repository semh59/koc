# B-5 Aday Batch ve Kabul Kapısı Doğrulama Raporu

## 1. Amaç ve Kapsam
B-4 görsel kalite pilotunun tamamlanmasının ardından, B-5 aşamasının ilk adımı olarak aday egzersiz batch'lerinin derleme (compile) ve kabul (admission) kapıları TDD ile sıkılaştırılmıştır.

**Sıfır Sahte Çoğaltma Prensibi:**
- Kataloğa hiçbir aday kayıt doğrudan veya otomatik kabul ile eklenemez.
- `acceptedNewRecords: 0` durumu ve runtime `332` egzersiz bütünlüğü korunmaktadır.

## 2. Uygulanan Kabul Kapısı Sözleşmesi
1. **Pilot Blocker'ının Dinamik Doğrulaması:**
   - `scripts/gym-batch-preflight.js`: B-4 görsel pilotu (`docs/analysis/gym-phase-b-figure-pilot.md` ve `www/figure-pilot.html`) onaylandığında `visual-pilot-not-approved` engelleyicisi kalkar.
   - Ancak `baseline-canonical-review` ve `independent-content-review-required` kapıları istisnasız aktif kalmaya devam eder.
   - Doğrulama testi: `scripts/gym-pilot-blocker.test.js` (1 PASS).

2. **Aday Batch Derleme Engeli (Compile-Time Guard):**
   - `scripts/build-gym-catalog.js`: Yalnızca `legacy-external` ve `legacy-local` batch'lerinin derlenmesine izin verilir.
   - Henüz bağımsız kabul almamış, `status: "review"` durumundaki hiçbir aday batch derleyici tarafından `exlib.js` veya `balance.js` içine derlenemez; işlem anında hata ile durdurulur (`Error: new batches blocked until B-4 visual pilot and admission gate`).
   - Doğrulama testi: `scripts/gym-batch-admission.test.js` (1 PASS).

## 3. Test ve Doğrulama Kanıtları
- `scripts/gym-pilot-blocker.test.js`: PASS (exit 0)
- `scripts/gym-batch-admission.test.js`: PASS (exit 0)
- `scripts/gym-batch-preflight.test.js`: 52 PASS (exit 0)
- `scripts/gym-catalog-build.test.js`: 23 PASS (exit 0)
- `scripts/gym-catalog-baseline.test.js`: 8 PASS (exit 0)
- `scripts/run-no-coach-tests.js`: 90 test dosyası (0 FAIL, 8 Coach-only skipped, 18 mixed scoped)
- `scripts/verify-android-sync.js`: 28 Java, 44 kaynak resource, 759 web asset tam eşleşme (exit 0)
- Playwright E2E (`npx playwright test -c e2e/playwright.config.js`): 18/18 PASS (exit 0)
