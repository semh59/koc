# Faz 4 — veri sahipliği ve modül sınırları

## Merkezi sözleşme

`www/kernel/modules.js:3-18` modül sınırlarını açıkça tanımlıyor. Yorumda iki kural var:

- Bir modül başka modülün üst seviye adını yalnızca o modülün `index.js` içinde tanımlanan ad, `XxxLib` namespace'i veya `api` listesinde yer alan sembol ise kullanabilir.
- Her `S` alanının sahibi ve doğrudan dokunabilecek dosyaları modül sözleşmesi belirler; `main/*` çekirdek olduğu için tüm alanlara erişebilir.

Bu, global `S` kullanılmasına rağmen doğrudan erişimi sınırlandırmayı amaçlayan bir mimari sözleşmedir. `scripts/boundary.test.js` bu sözleşmeyi denetlemek için vardır.

## S alanı sahiplik tablosu

| Modül | Sahip olduğu `S` alanları | Açık API örnekleri |
|---|---|---|
| `log` | `entries`, `nextId` | `add`, `of`, `sum`, `dayTotal`, `weights`, `streak`, `kcalGoal` |
| `nutrition` | `myFoods`, `favFoods`, `mealTpl`, `recipes` | `FOODS`, `MenuLocal`, `ocrBtn` |
| `gym` | `workouts`, `templates`, `customEx`, `gid`, `bar`, `dbStep`, `plates`, `exCfg` | `gEx`, `gPgNote`, `gTplAdd`, `gNames`, `gStats` |
| `meds` | `meds`, `medLog` | `medNowHM`, `medIngest` |
| `habits` | `sleep`, `mood`, `fast` | — |
| `pulse` | `pulse`, `hr` | `hcCard`, `hcNow`, `hcSync` |
| `vitals` | `vitals` | — |
| `labs` | `labs` | `labReview` |
| `measures` | `measures` | — |
| `cycle` | `cycle`, `cycleSym` | — |
| `motion` | `walk`, `moves` | `motionKg`, `setHc` |
| `coach` | `chat`, `chats`, `cid`, `providers` | `cNoteCheck`, `cConsent`, `consentHtml`, `consentOk`, `provNames`, `usageText`, `cCalc` |

`settings` çekirdek shard'ına aittir. `Modules` listesinde olmayan state alanları `other` shard'ına düşer (`www/main/01-core.js:193-218`).

## Kalıcılık shard modeli

`www/kernel/modules.js:20-24` ve `www/main/01-core.js:193-218` birlikte şu modeli oluşturur:

```text
S
├── settings        → settings shard
├── entries         → log shard + ay bazlı log/YYYY-MM shard'ları
├── workouts        → gym shard
├── meds/medLog     → meds shard
├── chat/chats/...  → coach shard
└── tanımsız alanlar → other shard
```

`Chunks.entries=e=>e.day.slice(0,7)` olduğu için yalnız `entries` ay bazında parçalanır. `shardOf()` sahip modüllerin alanlarını JSON'a ayırır; `assemble()` shard'ları birleştirir ve chunk'lı array'leri `id` ile sıralar.

## Log modülü veri sahipliği

`www/modules/log/index.js:5-21` `Log` API'sini tanımlar:

- Okuma: `where`, `find`, `all`, `byDay`, `count`
- Yazma: `put`, `swap`, `remove`, `restore`, `drop`
- `put` yeni `id` üretir ve `S.entries` içine ekler
- `remove` filtreleyerek yeni entries array'i üretir
- `restore` kayıtları ekleyip id sırasına göre sıralar

Domain modüllerinin food/water/weight/exercise/note/steps kayıtlarını doğrudan array işlemleriyle değil `Log` API'siyle kullanması amaçlanmış. `Data.privacy` de log türlerini `Log.count` ve `Log.drop` ile temizliyor (`www/modules/log/index.js:20-21`).

## Sahiplik ihlali kontrolü

İlk taramada `coach.js` içinde `Log.remove` kullanımı ve `S.chat` üzerinde doğrudan yazma görüldü. Bunlar sözleşmeyle uyumlu olabilir: `coach` `chat/chats` sahibi, `log` ise Log API sahibi. Kesin ihlal kararı için `scripts/boundary.test.js` çalıştırılmalı ve tüm doğrudan erişimler parser çıktısıyla eşleştirilmelidir.

## Sahiplik riskleri

1. **`other` shard:** `Modules` içinde unutulan yeni bir state alanı sessizce `other` shard'ına alınır. Veri kaybolmaz; fakat sahibi ve migration kapsamı görünmez kalır.
2. **Ana çekirdek istisnası:** `main/*` tüm alanlara dokunabildiği için en yüksek coupling çekirdektedir.
3. **Mutable state:** API sözleşmesi olmasına rağmen API dönüşleri array/object referansı veriyorsa çağıran doğrudan mutasyon yapabilir; bu ayrıca test edilmelidir.
4. **Ay shard'ı:** `entries` kaydı `day` alanı bekler. Eksik/bozuk day değerleri chunk üretiminde veri yerleşimini bozabilir; `buildState` temizliği bunu önlemeye çalışıyor, fakat sınır testi gerekli.
