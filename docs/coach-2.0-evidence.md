# Coach 2.0 — Kanıt ve Faz Günlüğü

## Başlangıç baseline

- Repo: `D:/PROJECT/NeoWell`
- Branch: `main`
- Faz 4 çalışma başlangıcı: `d8fb3d7`
- Mevcut Coach kaynakları: 4 dosya, 1.385 satır.
- Mevcut Coach unit davranış testleri: 78 PASS (`scripts/coach.test.js`), 45 PASS (`scripts/coach2.test.js`), Insight 29 PASS, boundary 3 PASS.
- Mevcut Coach browser E2E: 68 passed.
- Mevcut genel test: `npm test` — 108 test files, 0 failed.
- Mevcut Android sync: `npm run android:sync:verify` — 28 Java dosyası, 44 kaynak doğrulandı.
- Çalışma alanı başlangıçta temizdi.

## Faz 1 sonrası doğrulama


- Host/unit: doğrulandı.
- Browser/fake provider: doğrulandı.
- Emulator/gerçek Android: bu fazda henüz doğrulanmadı.
- Gerçek cihaz/Keystore: bu fazda henüz doğrulanmadı.
- Gerçek provider/backend: bu projede backend yok; canlı provider testi yapılmadı.

- ContextCompiler gerçek Coach system body akışına bağlandı.
- Sayısal `S.settings.act` değerleri (`0/1/2`) güvenli activity metnine çevriliyor.
- Structured parser `answer` çıktısını tanıyor.
- Structured response validator gerçek `cReply` akışında çalışıyor.
- Legacy `log`, `food` ve `flag` alanları structured cevaplarda korunuyor.
- Intent/purpose, fact kaynağı, unsafe text ve idempotency kontrolleri eklendi.
- Consent kapalıyken probe/model discovery dış çağrısı engelleniyor.
- PII test kapsamına küçük harfli isim ve serbest adres örneği eklendi.

## Faz 3 — yerel Plan / Bugün / Check-in UI

- Bugün ekranına tek yerel günlük öncelik kartı eklendi; plan yokken oluşturma ve check-in girişleri görünür.
- Plan yazma akışı önizleme → açık onay → yerel kaydetme şeklinde; düzenleme ve vazgeçme mevcut.
- Check-in enerji/neden akışı önizleme → açık onay şeklinde; idempotency anahtarı ile tekrarlı olay tek kayıt üretir.
- Düşük enerji uyarlaması önce önizleniyor; onay planı duraklatıyor, `Geri al` eski planı geri yüklüyor.
- Tüm Planner işlemleri `online:false` ile yerel; arayüz ağ isteği yapmıyor ve çevrimdışı metnini gösteriyor.
- Kanıt: `node scripts/coach-planner.test.js`, `node scripts/coach-planner-production.test.js`, `node scripts/coach-planner-closures.test.js`, `node scripts/coach-planner-ui.test.js` geçti.
- Kanıt: `CI=1 E2E_PORT=4474 npx playwright test e2e/coach-planner.spec.js -c e2e/playwright.config.js` — 4 geçti.
- `npm test` — 115 test files, 0 failed; `npm run android:sync:verify` — 28 Java files, 44 source resources; `git diff --check` — geçti.

## Faz 4 — local memory / explainability / retention slice

- `CoachLib.createMemoryRepository` keeps only source-backed records with strict provenance/date validation; malformed `deletedAt` values are rejected and reported through `rejected()`, never retained in snapshots or exports.
- `Coach.memoryList`, `memoryEdit`, `memoryDelete`, `memoryExport`, and async `memoryDeleteAll` are exposed through production Coach contract; deletion awaits successful share handoff and rolls back on share or durable-save failure.
- `compileContext` accepts active memories only and emits provenance (`source`, `period`, `confidence`, `last_verified`, `reason`) plus `missing_data`; deleted memories remain absent from provider context.
- `CoachLib.explainSuggestion` validates untrusted reasons, rejects HTML/injection, diagnosis, treatment, and causal overclaims, and returns safe low-uncertainty fallback text.
- Memory UI retains explicit create/edit preview and cancel flows, delete confirmation, export controls, escaped values, and accessibility labels.
- RED→GREEN evidence: `node scripts/coach-phase4.test.js` — 11 passed; `node scripts/coach-phase4-production.test.js` — all passed.
- Full verification: `npm test` — 117 test files, 0 failed; `CI=1 E2E_PORT=4531 npx playwright test -c e2e/playwright.config.js e2e/coach.spec.js e2e/access.spec.js` — 108 passed; focused memory E2E `CI=1 E2E_PORT=4486 npx playwright test e2e/coach.spec.js --grep 'Coach memory controls' -c e2e/playwright.config.js` — 2 passed; `npm run android:sync:verify` — 28 Java files, 44 source resources; `git diff --check` — passed.

## Faz 4 kalan riskler

- Memory kayıtları yerel uygulama depolamasında tutulur; runtime şifreleme bu fazın kapsamında değildir.
- Android WebView/Keystore, fiziksel cihaz ve canlı provider davranışı bu slice için doğrulanmadı.
- E2E artifact üretimi için kapanış koşusu `workers=1`, retries kapalı, trace/screenshot kapalı olarak ayrıca yürütülecek.

## Faz 3 blocker evidence

- `energy_ok` check-ins record successfully but return preview-only no-op; UI shows local confirmation, never pause/apply action.
- All planner write mutators require allowlisted 8–100 character `idempotencyKey`; missing/invalid keys return `{ok:false}` without mutation; duplicate valid keys stay idempotent.
- `undoAction(id, idempotencyKey)` now rejects missing/invalid keys before mutation; UI generates and passes unique undo keys.
- `checkSafe` now validates real Gregorian month/day boundaries, including leap years; malformed planner records remain filtered through `buildState` recovery reporting.
- IndexedDB planner writes use async-aware `saveDurable()`; wrapper returns Promise until `Store.whenIdle()` settles, rolls back on abort, and retries on next mutation. Deterministic fake-IDB failure is covered by `scripts/store.test.js`.
- Focused planner core, production, UI, closure, and store tests pass; module syntax and `git diff --check` pass.

## Faz 3 kalan riskler

- Gerçek Android WebView/cihazda Planner etkileşimi ayrıca doğrulanmadı; E2E yerel Playwright sunucusudur.
- Plan/check-in verileri mevcut uygulama depolama modelinde tutulur; runtime şifreleme yok.

- Gerçek cihaz/Keystore: bu fazda henüz doğrulanmadı.
- Gerçek provider/backend: bu projede backend yok; canlı provider testi yapılmayacak.

## Kritik mevcut riskler

1. Coach sohbet state'i IndexedDB/localStorage'da runtime olarak şifreli değil.
2. PII maskeleme sezgisel; tam anonimleştirme garantisi değil.
3. Provider model/probe çağrısı geçmişte rıza dışı dış ağ yolu açabiliyor.
4. Privacy policy ile gerçek gönderilen alanlar arasında tutarsızlık bulundu.
5. Coach için ayrı memory/plan/action repository ve typed event sözleşmesi yok.
6. Gerçek Android WebView/KeyStore yaşam döngüsü doğrulaması yok.


## Faz 5 — yerel içgörüler ve davranış deneyleri

- `www/modules/coach/insightlib.js`: `trend()` yerel kayıtları ölçüm penceresinde toplar; minimum kayıt/span eşiği altında `insufficient_data`, yeterli veride eğim ve görünür güven aralığı döndürür. Mevcut `plateau()` korunur; sonuç nedensellik veya tıbbi iddia değildir.
- `www/modules/coach/coachlib.js`: `createExperimentRepository()` hipotez, açık ölçüm penceresi, baseline ve hedef davranışı doğrular. Sonuçlar yalnız `supported`, `not_supported`, `insufficient_data`; ölçüm yetersizliği görünür. Gregoryen takvim kontrolü, start tarihi pencere kontrolü, idempotencyKey ve ID tekilliği ile yetim olay reddi eklendi.
- Deney tanımları ve check-in olayları local state'e eklenir. Tekrarlar tek kayıt yapar. Export önce gelir; export olmadan silme reddedilir.
- `www/modules/coach/coach.js`: Rehber ekranına Türkçe, erişilebilir `Küçük deneyler` alanı eklendi. Kullanıcı hipotez, baseline, hedef ve ölçüm penceresi oluşturabilir (taslak), deneyi başlatabilir (aktif), yerel check-in kaydedebilir; sonuç ve belirsizlik durumunu görebilir; JSON dışa aktarabilir ve güvenle silebilir. UI açıkça ağ/provider kullanmadığını, nedensellik göstermediğini ve tıbbi öneri olmadığını söyler. Rıza paneli HTML yapısı ve mükerrer fonksiyon düzeltildi.
- `scripts/coach-phase5-ui.test.js`: RED→GREEN üretim sınır testi; form etiketleri, yerel kaydetme, check-in, sonuç metni ve silme doğrulanıyor (8 PASS).
- `scripts/coach-phase5.test.js`: Çekirdek veri bütünlüğü, takvim, aralık, id/idempotency tekilliği ve sonuç durumları (16 PASS).
- `e2e/coach-experiments.spec.js`: Yaşam döngüsü, klavye/ekran okuyucu erişilebilirliği, sıfır ağ çağrısı ve export hatasında silme iptali E2E testleri (6 PASS).
- `www/modules/coach/index.js`, `www/main/01-core.js`, `www/kernel/modules.js`: deney storage, temizleme, public API, export/delete sınırı bağlandı. Provider veya network yolu değişmedi; ham sağlık verisi gönderilmez.
- Test kanıtları: `node scripts/coach-phase5.test.js` — 16 PASS; `node scripts/coach-phase5-ui.test.js` — 8 PASS; `node scripts/run-tests.js` — 119 test dosyası, 0 hata; `e2e/coach-experiments.spec.js` — 6 PASS; `e2e/coach.spec.js e2e/access.spec.js e2e/coach-planner.spec.js` — 112 PASS; `npm run android:sync:verify` — 28 Java, 44 kaynak PASS.
- Full-suite timeout: `scripts/run-tests.js` içine 120s child process timeout kontrolü eklendi.
- Whitespace ve `git diff --check` temiz.

## Faz 5 kalan riskleri

- Deney değerlendirmesi hedef karşılaştırmasıdır; davranışın nedensel etkisini göstermez.
- Runtime storage şifreli değildir; yerel IndexedDB/Store üzerinde tutulur.
- Gerçek Android WebView/cihaz doğrulaması henüz yapılmadı.


İlk üretim değişikliği şu sözleşmeyi kurar:

```text
local input
→ purpose/category consent gate
→ allowlisted context projection
→ deterministic safety/policy
→ structured response validation
→ typed action proposal
→ explicit user confirmation before mutation
```

Bu fazda backend, remote database, fotoğraf, ses ve canlı provider eklenmeyecek.

## Faz 1 kapatma koşulları

- Rıza yoksa context boş/blocked ve dış çağrı yapılmıyor.
- Context yalnız amaç için allowlist edilmiş alanları içeriyor.
- Secret, PII, raw app state ve seçilmeyen sağlık kategorileri serialized body'ye girmiyor.
- Structured response bilinmeyen action, kaynaklanmamış fact, tıbbi karar ve limit dışı öneriyi reddediyor.
- Model çıktısı doğrudan Log/Gym/state mutation yapamıyor.
- Yeni unit ve browser tests RED→GREEN kanıtı var.
- Eski Coach testleri, boundary testi ve Android sync korunuyor.
- Değişiklikten sonra bağımsız inceleme ve tam test raporu yazılmadan faz kapanmıyor.

## Karar kayıtları

- Remote backend: bu fazda reddedildi; mevcut repoda backend/auth/database bulunmadığı için önce local güvenlik çekirdeği.
- Encrypted database: bu fazda spike/karar aşamasında; mevcut IndexedDB state'ini şifreli ilan etmiyoruz.
- Hukuk: teknik kontroller uygulanacak; KVKK/GDPR/ürün sınıflandırması için hukuki uyum iddiası kurulmayacak.
