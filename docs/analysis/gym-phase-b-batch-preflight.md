# B-3b — Aday batch ön denetimi

## Karar ve sınır

Bu araç **kabul/üretime alma aracı değildir**. B-3b'nin kaynak şeması ve salt-okunur ön denetim dilimidir. B-4 görsel pilotu, 332 eski kaydın canonical incelemesi ve bağımsız içerik/lisans değerlendirmesi tamamlanmadan `acceptedNewRecords=0` kalır. B-3a üreticisi yeni batch'i reddetmeye devam eder. Bu çalışma gerçek yeni egzersiz veya katalog artışı içermez.

## Çalıştırma

`npm run gym:preflight -- <candidate.json>` veya `node scripts/gym-batch-preflight.js <candidate.json>`.

- JSON rapor stdout'a yazılır; kaynak/çıktı/katalog dosyası değişmez, ağ isteği yapılmaz.
- Exit `1`: metadata biçimi geçerli olsa da kabul kapıları açık, `review`.
- Exit `2`: şema/kayıt reddi veya okunamayan girdi. Başarılı kabul için exit `0` yolu yoktur.
- En fazla `100` aday; alt sınır `1` yalnız küçük ön incelemeleri destekler, üretim batch kabulü değildir.

## Girdi sözleşmesi

- Kök: `schemaVersion:1`, dolu `batch`, `sources` nesnesi, `records` dizisi.
- Her kayıt `runtime` ve `metadata` içerir. Runtime mevcut katalog alanlarını taşır: ID, ad, bölge/grup, tür, ekipman/seviye/kategori, pozitif yük adımı, mevcut template. Yeni fotoğraf (`im>0`) reddedilir.
- `metadata`: `canonical_id`, `canonical`, `signature`, `family`, `cue_ids`, `figure_template`, `source_ref`, `license_ref`, `source_name`, `retrieved_at`, `transformation_note`, `status:"review"`.
- Canonical alanlar semantic sözleşmedeki tüm 11 alandır: pattern, primary_joints, rom, unilateral, stance, load_mode, equipment_role, direction, tempo_mode, target_region, start_end. Değerler dolu string dizileri; enum alanları tek değer; bilinmeyen alan veya tekrar token reddedilir. Küme değerleri imza için sıralanır. Boş/yanlış vocabulary kabul edilmez.
- İmza `Semantic.key(Semantic.signature({canonical}))` ile üretilir; çoklu küme alanları önceden sıralanmalıdır. `family` pattern ile eşleşir. Signature/canonical bilgisi girdinin beyanıdır; biomekanik doğruluk kanıtı değildir.
- `sources[source_ref]`: temiz HTTPS `url`, 40 haneli commit SHA, dolu `license`, `license_status:"verified"` beyanı, HTTPS `evidence_url`, dolu `attribution`. URL içinde kullanıcı/parola, query veya fragment kabul edilmez. `license_ref` aynı kaynağa bağlanır.
- Edinim zamanı tam ISO UTC anı (`YYYY-MM-DDTHH:mm:ss.sssZ`); geçersiz takvim günü reddedilir. Dönüşüm ve kaynak adı boş olamaz. Tarih/kaynak doğruluğu ayrıca insan incelemesi gerektirir.

`license_status:"verified"` **adayın beyanıdır**; araç URL'yi indirmez, lisans onayı vermez. Raporda `sourceEvidenceVerification:"not-independently-verified"` ve bağımsız içerik incelemesi engeli bulunur. Sentetik testte example.invalid URL ve uydurma test SHA kullanımı yalnız negatif/şema fixture'ıdır; gerçek provenance değildir, üretim kataloğuna yazılmaz.

## Eşleşme ve sayım

- Mevcut 332 ID ile çakışma ve aday içi tekrar ID/canonical ID reddedilir.
- Aynı canonical imza farklı adla gelse de iki yönde `duplicate-signature` raporu çıkar; iki aday ayrı kabul sayılmaz.
- Aynı pattern'de farklı imza `near-duplicate-review` adayıdır; otomatik distinct veya duplicate hükmü değildir. Ekipman değişimi benzersizlik gerekçesi sayılmaz.
- Baseline normalize ad eşleşmeleri yalnız `baselineNameCandidates` olarak listelenir. 332 baseline canonical eksik olduğundan her aday için `unresolvedBaselineComparisons:332` ve global engel raporlanır. Kaba template/ad eşleşmesi semantik hükme çevrilmez.
- `metadataValidCount` yalnız biçimsel doğrulamadır; `reviewCount`, `rejectedCount`, `acceptedNewRecords` ayrı raporlanır. Review, geçici kabul değildir.

## Kanıt ve açık işler

- `scripts/gym-batch-preflight.test.js`: `52` PASS, exit `0`; tamamı açıkça sentetik fixture, gerçek katalog artışı yok.
- Gerçek CLI başka cwd'den çalışır, girdiyi değiştirmez; bloke ve reddedilen JSON için exit `1/2` sınanır. Salt-okunur olması source ve CLI sözleşmesidir; dış lisansların canlı doğruluğu kanıtlanmadı.
- Final no-Coach runner: `85` dosya, `2261` PASS, `0` başarısız; `8` Coach-only skip ve `18` mixed ayrı kapsam. Tam mixed `npm test` yeşil iddiası yok.
- Browser E2E `16/16` (`360/412` viewport), generated Android sync `28` Java / `44` resource / `758` web asset, exit `0`. Bunlar APK/emülatör/fiziksel cihaz kanıtı değildir.
- Yerel loglar: `C:/Users/semih/AppData/Local/hermes/cache/scratch/gym-b3b-host.log` ve `gym-b3b-e2e.log`; bağımsız final snapshot denetimi ve commit açık.
- Ön incelemede yeniden üretilen üretici template-prototype boşluğu kapatıldı: `constructor` artık gerçek template sayılmaz; template own-property ve frames, cue string dizisi, `pr`/`o` tür/sınır ve bilinmeyen batch/record alanları kontrol edilir. `gym-catalog-build.test.js` güncel `23` PASS.
- Eski `gym-catalog-semantic.js` karşılaştırıcısında dizi sırası, ROM/tempo-only distinct ve coarse legacy duplicate kararı sınırlamaları açık kalır. Bu ön denetim `compare()`/`nameAudit()` sonucunu admission olarak kullanmaz: canonical setleri kendisi sıralar, aynı pattern'i yalnız near-review yapar, tüm baseline karşılaştırmalarını çözülmemiş bırakır. Tam kabulden önce comparator ayrı düzeltilmelidir.
- Tam B-3 kabul/üretim entegrasyonu B-4 ve canonical/provenance incelemesine bağlı; bu dilimle tam B-3 kapanmaz.
- B-2'den kalan 644 belirsiz lisanslı fotoğraf hâlâ pakettedir; bu araç indirmez/silmez. CI, yayın, hukuk ve gerçek cihaz onayı verilmez.
