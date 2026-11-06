# Semantic karar kapısı — B-3 sonrası onarım

## Karar

Otomatik şema doğrulaması hareketin gerçekliğini veya benzersizliğini kanıtlamaz. `compare()` yalnız geçerli ve eşit canonical signature için `duplicate` üretir; diğer tüm çiftler `review`. Otomatik `distinct` yolu kaldırıldı. Gerçekten farklı egzersizlerin kabulü engellenmiş sayılmaz: bu karar artık kanıtlı içerik/kabul aşamasında verilecektir; mevcut araç bu aşamayı yapmaz.

## Düzeltmeler

- String veya string-array canonical API korunur; string küme elemanları sıralanır/tekilleştirilir. Eklem sırası artık ayrı hareket yaratmaz.
- Boolean, sayı, object ve null token string'e dönüştürülmez; tanımsız/çok değerli enum, bilinmeyen canonical alan, uppercase slug strict modda reddedilir. Bozuk kök/null canonical ve shadowed token yöntemleri crash yerine review/strict ret üretir.
- ROM/tempo/ekipman/unilateral/pattern farkı tek başına biomekanik distinct kanıtı değildir.
- `audit().duplicates`: yalnız tam geçerli canonical eşitlik grupları.
- `audit().observedGroups`: eksik legacy gözlem anahtarı grupları; kesin duplicate değildir.
- `candidateSignatureCount`: tam canonical imza adaylarının ayrı sayısı; kabul veya doğrulanmış gerçek hareket sayısı değildir.
- `semanticUniqueCount=0`: kabul katmanı bu araçta yoktur. Tam metadata kayıtları bile inceleme listesinde kalır; manifestte `candidate` yalnız şema yeterliliğidir ve `movement-evidence-and-admission-required` nedeni taşır.
- `nameAudit().near`: en az beş karakterli normalize adlarda tek insertion/deletion/substitution adayları; yazım yakınlığı gerçek eşitlik değildir, synonym/çeviri çözümü değildir. Ad veya coarse alan grupları hiçbir zaman kabul sayısına eklenmez.

## Artifact ve uyumluluk

İki semantic writer yeni `observedGroups` kanalını kullanır. Eski JSON alan adı `legacyObservedDuplicateGroups` uyumluluk için korunur, anlamı yalnız gözlem grubudur. B-1 raporunda zaten bu sınır belirtilmiştir. Runtime `332`, ID/ad/sıra/alanlar ve uygulama dosyaları değişmez; `324` source, `332` review, semantic unique `0`, canonical aday imza `0`, canonical duplicate grup `0`, legacy gözlem grubu `78`, exact ad aday grubu `7`.

Önceki B-3b raporundaki comparator risk paragrafı tarihsel snapshot'tır; bu rapor o sıradaki dizi/tip/ROMtempo/coarse karar kusurlarının onarımını kaydeder. B-3b kabul engelleri, B-4 görsel pilotu ve tüm katalog incelemesi açık kalır.

## Doğrulama

- Önce kırmızı çalıştırıldı: sıra farkı ayrı signature; invalid tipler; ROM farkının distinct olması; null root hatası.
- `node scripts/gym-semantic-guards.test.js`: `19` PASS, exit `0`; sentetik kimlik varyantları ve iki writer'ın yazmasız tam artifact eşitliği.
- Mevcut semantic `12`, preflight `52`, üretici `23` PASS.
- Final no-Coach runner: `86` dosya, `2280` PASS, `0` başarısız; Coach-only `8` skip, mixed `18` ayrı kapsam. Tam mixed `npm test` yeşil iddiası yok.
- Browser E2E `16/16`; sync `28` Java, `44` resource, `758` web asset, exit `0`. Bunlar Android cihaz/emülatör çalıştırma kanıtı değildir.
- Yerel loglar: `C:/Users/semih/AppData/Local/hermes/cache/scratch/gym-semantic-repair-host.log` ve `gym-semantic-repair-e2e.log`. Final snapshot bağımsız denetimi ve commit açık.
- Güncelleme: Kullanıcı onayıyla 644 fotoğraf kaynak ve Android public paketinden kaldırıldı; bkz. `gym-legacy-media-removal.md`. Eski kanonik içerik incelemesi, CI/APK/fiziksel cihaz/hukuk kapıları açık.
