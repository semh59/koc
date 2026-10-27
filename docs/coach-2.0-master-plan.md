# NeoWell Coach 2.0 — Ana Plan

> Durum: Planlama ve mimari dondurma
> Kapsam: Yalnız `www/modules/coach` ve doğrudan bağlı sözleşmeler
> İlke: Kanıt yoksa tamamlanmış sayılmaz. Teknik kontroller hukuki danışmanlık veya yasal uygunluk garantisi değildir.

## 1. Ürün kararı

NeoWell Coach, genel amaçlı sağlık chatbotu olmayacak. Ana ürün vaadi:

> Kullanıcının verisini cihazda mümkün olduğunca tutan, her gün en önemli tek önceliği seçen, önerisinin nedenini ve güvenini gösteren, kullanıcı onayı olmadan yan etki oluşturmayan Türkçe adaptif günlük koç.

Rakiplerden alınacak yetenekler:

- WHOOP/Oura: uzun dönem trend, kişiselleştirme, adaptif yönlendirme.
- Fitbit: hedefe göre egzersiz planı ve günlük duruma göre plan ayarı.
- Noom: davranış değişikliği, küçük adımlar, suçlamayan geri bildirim.
- MyFitnessPal: düşük sürtünmeli yemek kaydı.
- ChatGPT Health: kullanıcının farklı sağlık verilerini tek bağlamda açıklama.

NeoWell’in farkı:

1. Türkçe ve Türkiye yaşam bağlamına uygun koçluk.
2. Sağlık verisi için local-first ve açıklanabilir bağlam.
3. Her öneride kaynak, dönem, güven ve eksik veri gösterimi.
4. Plan → uygulama → ölçüm → düzeltme döngüsü.
5. Hafıza, paylaşım ve silme üzerinde gerçek kullanıcı kontrolü.
6. Serbest model cevabının doğrudan kayıt veya sağlık kararı oluşturamaması.

## 2. Mevcut sistem — kanıtlı başlangıç noktası

Mevcut Coach dört dosyadır:

- `www/modules/coach/coach.js`: 965 satır; UI, provider, rıza, sohbet, storage, menü, program ve log akışı.
- `www/modules/coach/coachlib.js`: 335 satır; saf parse, doğrulama ve safety taraması.
- `www/modules/coach/insightlib.js`: 82 satır; plato ve haftalık neden analizi.
- `www/modules/coach/index.js`: public namespace ve gizlilik entegrasyonu.

Mevcut doğrulanmış akış:

```text
UI → cClick/cSend → PII maskesi ve consent → provider → parse → sohbet/kart
→ kullanıcı onayı → Log/Gym yazımı
```

Mevcut sınırlar:

- Browser script/global sözleşmeleri ve yükleme sırası `www/index.html` ile kuruluyor.
- Coach sözleşmesi `www/kernel/modules.js` içinde tanımlı.
- State `S.chat`, `S.chats`, `S.cid`, `S.providers` alanlarında tutuluyor.
- Proje içinde doğrulanmış bir backend/API server veya remote database yok.
- Provider çağrıları mevcutte browser’dan doğrudan yapılıyor.
- Sohbet state’i Store/localStorage’da şifreli değil.
- PII maskeleme örnek tabanlı; tam anonimleştirme garantisi değil.
- Gerçek Android/WebView/Keystore yaşam döngüsü test kapsamı sınırlı.

Bu bölüm yalnızca mevcut kaynak ve test kanıtıdır; hedef mimari aşağıdaki bölümlerde ayrıca etiketlenmiştir.

## 3. Güvenlik ve hukukta kırmızı çizgiler

Aşağıdakiler olmadan Coach 2.0 üretim özelliği kapatılmayacak:

1. Ham sağlık verisi ve sohbet provider’a varsayılan olarak gönderilmeyecek.
2. Her veri kategorisi ayrı amaç ve paylaşım kapsamına sahip olacak.
3. Provider çağrısı açık, geçerli ve versiyonlu rıza olmadan çalışmayacak.
4. Model çıktısı schema, safety ve policy katmanlarından geçmeden kullanıcıya aksiyon olarak sunulmayacak.
5. Model doğrudan Log/Gym/Meds/Health kayıtlarına yazamayacak.
6. İlaç dozu, teşhis, acil durum veya tıbbi tedavi kararı üretilmeyecek.
7. Acil/self-harm/gebelik/yeme bozukluğu sinyalleri deterministic safety katmanında durdurulacak.
8. Secrets, provider body, sağlık metni ve PII loglanmayacak.
9. Silme ve dışa aktarma; sohbet, hafıza, plan, consent, provider metadata ve network metadata’yı kapsayacak.
10. Şifreleme anahtarları uygulama state’ine veya normal yedeğe girmeyecek.
11. Backend/sync varsayılan olarak kapalı olacak; remote özellikler açık opt-in olacak.
12. Hukuk danışmanı, veri sorumlusu/işleyen rolü, aktarım, saklama, aydınlatma ve DPIA kararlarını onaylamadan “uyumlu” iddiası kurulmayacak.

KVKK/GDPR, özel nitelikli sağlık verisi, çocuk verisi, elektronik ileti, veri aktarımı, ihlal bildirimi, saklama ve olası tıbbi cihaz sınıflandırması için hukuk/mimari onayı ayrı kapı olacaktır. Kod tek başına “yasa önünde koruma” sağlayamaz; kod, süreç ve sözleşme birlikte gerekir.

## 4. Hedef mimari

### 4.1 Frontend katmanları

`coach.js` tek orchestrator olmaktan çıkarılacak. Yeni sınırlar:

```text
www/modules/coach/
  index.js          public module contract
  coach.js          thin orchestration and UI routing
  safety.js         deterministic risk policy
  context.js        local context compiler
  memory.js         profile/plan/chat memory policy
  planner.js        goals, plans, check-ins, experiments
  actions.js        preview, confirm, undo, idempotency
  provider.js       provider policy, payload builder, retry/cooldown
  schema.js         model response validation
  insight.js        local trend and explanation adapters
  coachlib.js       existing pure helpers, gradually reduced
  insightlib.js     existing pure math helpers
  ui.js             Today/Plan/Progress/Ask/Memory/Privacy views
  storage.js        repository interfaces, no direct S writes
  events.js         versioned boundary events
```

İlk adımda dosyalar gereksiz yere bölünmeyecek. Her yeni dosya önce failing test ile açılacak; ortak sorumluluk gerçekten ayrışmıyorsa mevcut dosyada kalacak.

### 4.2 Domain state ownership

Coach state aşağıdaki bounded alanlara ayrılacak:

- `coach_conversations`: geçici sohbet ve mesajlar.
- `coach_memories`: kullanıcı tarafından görülebilen, kaynaklı bilgiler.
- `coach_goals`: hedefler ve öncelikler.
- `coach_plans`: versiyonlu planlar.
- `coach_checkins`: uygulama/erteleme/ret nedenleri.
- `coach_experiments`: hipotez, deney, ölçüm ve sonuç.
- `coach_consents`: amaç, provider, veri kategorisi, versiyon, timestamp, withdrawal.
- `coach_provider_configs`: endpoint/model/health metadata; secret ayrı vault.
- `coach_actions`: preview/confirm/undo durum makinesi.
- `coach_safety_events`: ham metin değil, minimum sınıflandırılmış güvenlik metadata’sı.
- `coach_audit`: payload içermeyen güvenlik ve kullanıcı eylemi audit kaydı.

Diğer modüller Coach’un iç state’ine dokunmayacak. `www/kernel/modules.js` içindeki API sözleşmesi genişletilecek; `scripts/boundary.test.js` her yeni sınırı zorlayacak.

### 4.3 Database kararı

Mevcut `localStorage`/Store yolu kısa vadede korunarak migration adapter arkasına alınacak. Üretim hedefi:

- Android’de şifreli app-local database adapter.
- Browser testte in-memory adapter.
- Gerekirse platform plugin üzerinden encrypted SQLite/SQLCipher; paket/driver seçimi spike ile doğrulanmadan varsayılmayacak.
- Master key Android Keystore/KeyVault’ta; database key normal state/backup içine girmeyecek.
- Remote sync ayrı adapter; local database olmadan çalışmayacak.

Mantıksal şema:

```sql
coach_conversations(id, created_at, updated_at, archived_at, retention_until, version)
coach_messages(id, conversation_id, role, content_ciphertext, created_at, safety_level, status)
coach_memories(id, kind, value_ciphertext, source, confidence, confirmed_at, expires_at, deleted_at, version)
coach_goals(id, kind, target_ciphertext, priority, status, started_at, ended_at, version)
coach_plans(id, goal_id, plan_ciphertext, status, valid_from, valid_until, version)
coach_checkins(id, plan_id, outcome, reason_code, occurred_at, version)
coach_experiments(id, hypothesis_ciphertext, protocol_ciphertext, status, started_at, ended_at, result_ciphertext)
coach_consents(id, purpose, data_categories, provider_id, policy_version, granted_at, withdrawn_at)
coach_provider_configs(id, provider_id, endpoint_hash, model, enabled, health, updated_at)
coach_actions(id, kind, payload_ciphertext, state, idempotency_key, created_at, confirmed_at, undone_at)
coach_audit(id, event_type, actor, object_type, object_id, metadata_minimal, occurred_at)
```

Kurallar:

- Sağlık/sohbet içerikleri `*_ciphertext` olarak saklanacak.
- Arama için plaintext index tutulmayacak; gerekirse kullanıcı onaylı, minimum, hash’lenmiş index kullanılacak.
- `deleted_at` yalnız kısa süreli, silme işinin tamamlandığını doğrulamak için tutulacak; retention sonunda metadata da silinecek.
- Her tablo için retention/purpose tanımı olacak.
- Migration forward-only, versiyonlu ve rollback riskleri belgeli olacak.
- Eski `S.chat/S.chats` verisi migration öncesi export fixture ile korunacak; başarısız migration orijinali silmeyecek.

### 4.4 Context Compiler

Provider’a ham uygulama state’i değil, göreve özel minimum context gönderilecek:

```json
{
  "purpose": "sleep_advice",
  "facts": [
    {"name":"sleep_average","value":"5h40m","period":"3d","confidence":"medium","source":"sleep"}
  ],
  "constraints": [],
  "missing_data": ["no_weight_measurement_4d"],
  "user_message": "...masked locally..."
}
```

Compiler her field için:

- kaynak,
- dönem,
- güven,
- amaç,
- paylaşılabilirlik,
- kullanıcı izni

tutacak. Compiler çıktısı testte serialize edilerek gerçek gönderim body’si üzerinden doğrulanacak.

### 4.5 Model response contract

Serbest metin birincil sözleşme olmayacak:

```json
{
  "intent": "sleep_advice",
  "answer": "...",
  "facts_used": [],
  "assumptions": [],
  "recommendations": [],
  "warnings": [],
  "actions": [],
  "follow_up": null,
  "confidence": "medium"
}
```

Şema reddeder:

- bilinmeyen action,
- kaynaklanmamış fact,
- izin dışı data category,
- ilaç dozu/teşhis/tıbbi karar,
- güvenlik uyarısını atlayan cevap,
- limit dışı kalori veya egzersiz,
- action idempotency alanı olmayan yan etki.

## 5. Boundary event sözleşmesi

Event bus internal ve typed olacak; global string çağrıları yerine versioned envelope kullanılacak:

```json
{
  "id":"uuid",
  "type":"coach.plan.proposed",
  "version":1,
  "occurredAt":"...",
  "actor":"user|coach|system",
  "aggregateId":"...",
  "purpose":"planning",
  "containsHealthData":false,
  "payload":{}
}
```

İlk event listesi:

- `coach.message.submitted`
- `coach.safety.blocked`
- `coach.context.compiled`
- `coach.provider.requested`
- `coach.provider.completed`
- `coach.provider.failed`
- `coach.response.rejected`
- `coach.memory.proposed`
- `coach.memory.confirmed`
- `coach.memory.deleted`
- `coach.plan.proposed`
- `coach.plan.accepted`
- `coach.plan.adjusted`
- `coach.checkin.completed`
- `coach.experiment.started`
- `coach.action.previewed`
- `coach.action.confirmed`
- `coach.action.undone`
- `coach.consent.granted`
- `coach.consent.withdrawn`
- `coach.data.exported`
- `coach.data.deleted`

Event kuralları:

- Event payload’ında ham sohbet, API key, provider body veya PII yok.
- Consumer idempotent olacak; `event.id` inbox’ta tutulacak.
- Module boundary test event type/version/payload allowlist doğrulayacak.
- Event’ler domain state’in yerine geçmeyecek; state transaction ile event/outbox atomik yazılacak.
- UI event’i ile security audit event’i ayrılacak.

## 6. Backend ve API kararı

Mevcut projede backend yok. İlk üretim sürümünde remote backend zorunlu yapılmayacak. Böylece sağlık verisini yeni bir merkezi database’e taşımadan değer üretilecek.

Opt-in sync/backend gerekirse ayrı servis olarak tasarlanacak:

```text
POST   /v1/coach/sync/changes
GET    /v1/coach/sync/cursor
POST   /v1/coach/consents
GET    /v1/coach/export
POST   /v1/coach/delete-request
GET    /v1/coach/delete-request/{id}
POST   /v1/coach/provider-proxy/inference   # default kapalı, ayrı risk kapısı
```

API ortak kuralları:

- OIDC/PKCE veya platformun doğrulanmış auth mekanizması; kimlik bilgisi tahmini yok.
- Scope: `coach.read`, `coach.write`, `coach.export`, `coach.delete`; provider proxy ayrı scope.
- `Idempotency-Key` tüm write endpoint’lerinde zorunlu.
- `If-Match`/version conflict kontrolü.
- Request size/rate limit/timeout.
- Sağlık payload’ı server loglarına girmeyecek.
- TLS, key rotation, envelope encryption, tenant isolation.
- Dış provider’a aktarım backend’de de aynı purpose/consent policy’den geçecek.
- Silme endpoint’i 202 döner; iş tamamlanmadan “silindi” denmez.
- Export formatı makinece okunabilir JSON + insan okunabilir özet; zip şifreli.
- OpenAPI sözleşmesi ve contract test olmadan endpoint açılmayacak.

Remote database için hedef:

- Plaintext health database yok.
- Pseudonymous account id.
- Encrypted blobs; server-side KMS envelope key.
- Immutable minimal audit; içerik değil event metadata.
- Retention job ve silme doğrulama raporu.
- Processor listesi, DPA/SCC ve veri lokasyonu hukuk kapısından geçecek.

## 7. Frontend ürün yüzeyleri

### Today

- Günün tek önceliği.
- Kaynak, dönem ve güven.
- `Uygula`, `Değiştir`, `Ertele`, `Neden?` ve `Bunu önerme`.
- Bildirim bütçesi: varsayılan en fazla 1 proaktif öneri/gün.

### Planım

- Hedef → plan → minimum uygulanabilir adım.
- Kabul/ertele/değiştir/iptal/undo.
- Plan versiyonları ve değişiklik nedeni.

### İlerleme

- Trend, veri sayısı, eksik günler, güven.
- Nedensellik iddiası yok; “veri destekli olasılık” dili.

### Coach’a sor

- Bilgi, kayıt, plan, motivasyon, safety ve check-in intent ayrımı.
- Kullanıcıya gönderilecek context preview.

### Hafızam

- Coach’un bildiği bilgi, kaynak, tarih, güven.
- Düzelt, doğrula, sil, bir daha kullanma.

### Gizlilik

- Veri kategorisi izinleri.
- Aktif provider ve gönderilecek alanlar.
- Export/delete.
- Consent version ve geri alma sonucu.

Accessibility gate:

- Keyboard/focus/TalkBack.
- Renk tek anlam taşımaz.
- Safety/action kartlarında açık metin.
- 200% text ve kısa ekran testleri.

## 8. Fazlar ve bitiş kapıları

### Faz 0 — Dondurma, envanter, hukuk paketi

Çıktı:

- Data inventory.
- Threat model.
- Controller/processor ve amaç matrisi.
- Provider/vendor listesi.
- Privacy notice/consent metni taslakları.
- Tıbbi iddia sınırları.
- Current-to-target migration map.

Gate: hukuk danışmanı kararı gerekenler açık; teknik kapsam imzalı; mevcut test baseline yeşil.

### Faz 1 — Güvenilir domain çekirdeği

Önce failing test:

- response schema validator,
- ContextCompiler,
- Safety pre/post gate,
- action state machine,
- consent/provider policy.

Gate:

- her yeni acceptance criterion için test,
- raw provider body testte maskeli,
- consent off’ta network çağrısı yok,
- model action’ı doğrudan state değiştiremiyor.

### Faz 2 — Şifreli storage ve migration

- repository interface,
- in-memory adapter,
- encrypted mobile adapter spike,
- S.chat migration,
- export-before-delete,
- crash-safe migration.

Gate:

- migration fixture round-trip,
- interrupted migration original data’yı korur,
- key invalidation davranışı tanımlı,
- backup’ta key/plaintext yok.

### Faz 3 — Today + Plan + Check-in

- günlük öncelik,
- plan CRUD,
- check-in,
- adaptasyon,
- undo ve kullanıcı nedenleri.

Gate:

- tüm yazma işlemleri preview/confirm/idempotency/undo,
- duplicate event duplicate action üretmez,
- offline davranış belirli.

### Faz 4 — Memory + explainability

- kaynaklı hafıza,
- güven ve son doğrulama,
- “neden bu öneri?”
- eksik veri ve belirsizlik.

Gate: kullanıcı her memory’yi bulur/siler/düzeltir; silinen memory context’e giremez.

### Faz 5 — Local insights ve davranış deneyleri

- plateau/trend,
- hipotez/deney,
- ölçüm penceresi,
- sonuç: desteklendi/desteklenmedi/veri yetersiz.

Gate: nedensellik iddiası yok; minimum veri ve güven gösteriliyor.

### Faz 6 — Düşük sürtünmeli giriş

- Türkçe sesle kayıt,
- fotoğraf/meal scan yalnız açık izinle,
- yerel yemek/porsiyon.

Gate: image/audio retention, provider transfer, delete/export ve PII testleri.

### Faz 7 — Health Connect ve opt-in backend

- önce local integration,
- sonra sync adapter,
- remote backend en son.

Gate: threat model, DPA/vendor, API contract, data residency, deletion drill, breach runbook.

### Faz 8 — Release ve saha doğrulaması

- emulator,
- gerçek Android cihaz,
- gerçek Keystore,
- gerçek provider sandbox,
- network failure/rate limit,
- staged release.

Gate: test tier’ları ayrı raporlanır; gerçek cihaz/provider kanıtı yoksa bu alanlar “doğrulanmadı” yazılır.

## 9. Test ve doğrulama matrisi

### Host/unit

- `node scripts/coach.test.js`
- `node scripts/coach2.test.js`
- `node scripts/insight.test.js`
- `node scripts/boundary.test.js`
- yeni schema/context/safety/storage/migration/event testleri
- property/fuzz: Türkçe safety ve PII varyantları

### Browser fake provider

- `npx playwright test e2e/coach.spec.js -c e2e/playwright.config.js`
- consent off → zero network
- payload snapshot → only approved fields
- model malformed/timeout/429/500
- memory/plan/action/undo/export/delete
- offline/retry/idempotency
- focus, small viewport, TalkBack-equivalent DOM assertions

### Static/security

- raw secrets/PII grep gate
- dependency audit
- boundary contract
- generated Android asset equality
- OpenAPI schema/contract
- migration checksum

### Emulator/instrumentation

- encrypted database open/close
- key invalidation
- backup/restore does not include keys/plaintext
- notification/schedule
- app kill during transaction

### Real device

- at least supported Android matrix
- real KeyStore
- low storage, offline, clock change, locale Turkish
- release APK, not debug only

### Real provider

- only explicitly approved sandbox/test account
- no real health data
- request/response retention disabled
- rate limit, TLS, model discovery, provider deletion/contract evidence

## 10. Measurable product acceptance criteria

- İlk değer: kullanıcı 60 saniye içinde ilk uygulanabilir öneriyi görür.
- Her öneride source/period/confidence görünür.
- Kullanıcı öneriyi tek dokunuşla uygular, değiştirir, erteler veya reddeder.
- Reddedilen öneri aynı koşulda tekrar spam edilmez.
- Plan completion değil, geri dönme süresi ve sürdürülebilirlik ölçülür.
- Raw health data provider body’ye yalnız field-level consent ile girebilir.
- PII test corpus’unda ham kimlik sızıntısı sıfır.
- Silinen memory sonraki serialized context’te sıfır görünür.
- Aynı action/event iki kez uygulanmaz.
- Export tüm Coach data categories’i içerir.
- Delete sonrası doğrulanabilir şekilde local/remote data temizlenir.
- Safety false-negative/false-positive seti versiyonlanır; “klinik güvenlik garantisi” iddia edilmez.

## 11. Değişiklik disiplini

1. Her faz için önce Markdown evidence ledger güncellenecek.
2. Her bulgu için kırmızı test yazılacak ve gerçekten fail görülecek.
3. En küçük production değişikliği yapılacak.
4. Focused test + bağımsız test + ilgili E2E çalıştırılacak.
5. İkinci bağımsız inceleme yapılacak.
6. Gate geçmeden sonraki faza geçilmeyecek.
7. Her aşamada `git diff --check`, status, test exit code ve evidence dosyaya yazılacak.
8. Gerçek cihaz/provider/backend çalışmadıysa tamamlandı denmeyecek.
9. Tek `main` branch üzerinde ilerlenebilir; her anlamlı gate ayrı commit olacak.
10. Public repository yalnız zorunlu dış doğrulama için açılacak; işlem sonrası private kontrolü kanıtlanacak.

## 12. Açık kararlar — kod başlamadan kapanması gerekenler

- Hedef platform: yalnız Android mi, iOS/Web de var mı?
- Encrypted database adapter’ın teknik seçimi.
- Remote sync gerçekten gerekli mi; gerekli ise hangi bölgede tutulacak?
- Provider listesi, DPA ve veri aktarım ülkeleri.
- Yaş sınırı ve çocuk/ergen akışı.
- Wellness ürünü sınırı ve tıbbi cihaz/ürün iddiaları.
- Veri saklama süreleri.
- İnsan/profesyonel eskalasyon sorumluluğu.
- İhlal tespit/bildirim sorumluları.
- Kullanıcı hesabı ve kimlik doğrulama modeli.

Bu kararlar bilinmeden “tüm sistemi hukuken koruduk” denmeyecek. Bunlar kullanıcıdan tekrar tekrar soru istemek için değil; ürün sahibi, hukuk ve teknik sorumluların yazılı karar kaydı için listelenmiştir.

## 13. İlk uygulanacak dikey dilim

İlk gerçek feature şu olacak:

```text
sleep signal → local ContextCompiler → consent/policy gate
→ structured recommendation → source/confidence card
→ preview → user confirm → local Plan/check-in record
→ event/audit without health payload → undo
```

Bu dilim tamamlanmadan fotoğraf, ses, backend, çoklu provider veya geniş hafıza eklenmeyecek. Çünkü temel veri, güvenlik, action ve silme sözleşmeleri doğrulanmadan üstüne özellik koymak riski büyütür.

## Kaynaklar

- WHOOP AI kişiselleştirme: https://www.whoop.com/us/en/thelocker/inside-look-whats-next-for-whoop-in-2025/
- Oura Advisor: https://ouraring.com/blog/oura-advisor/
- Fitbit Personal Health Coach: https://blog.google/products-and-platforms/devices/fitbit/fitbit-ai-personal-health-coach-preview/
- Noom Welli ve AI özellikleri: https://www.noom.com/blog/weight-management/your-guide-to-weight-loss-in-2025-trends-tips-and-timeless-strategies/
- MyFitnessPal Meal Scan: https://support.myfitnesspal.com/hc/en-us/articles/360045761612-Meal-Scan-FAQ
- ChatGPT Health: https://openai.com/index/introducing-chatgpt-health/
- Fitness uygulamalarının kullanıcı etkileri ve sınırlılıkları: https://pmc.ncbi.nlm.nih.gov/articles/PMC12541294/
