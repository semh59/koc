# Faz B — Dürüst egzersiz kataloğu genişletme planı

## Karar ve kapsam

Faz B hedefi, yerleşik kataloğu mevcut `332` runtime kaydından yaklaşık `1200` gerçek, kullanılabilir ve semantik olarak ayrı egzersize çıkarmaktır. `1200` bir rapor hilesiyle doldurulacak sayı değildir. Bir kayıt duplicate/near-duplicate kapısından geçmiyorsa kataloga giremez; sonuç `1200` altındaysa gerçek sayı raporlanır.

Faz A teknik altyapısı önceki `no-coach` release commitinde kapanmıştı. Bu B-0 değişiklikleri için no-Coach runner yeniden doğrulanmadı; tam `npm test` no-Coach/mixed kapsam nedeniyle kırmızı ve ayrı no-Coach runner sonucu timeout/unknown durumundadır.

1. **Görsel hat:** çöp adamı rekabet edebilir kaliteye taşıyan 2.5D figür pilotları.
2. **Katalog hattı:** kaynak veriden üretilen, canonical movement identity ile doğrulanan batch kayıtları.

Görsel pilot kapısı geçmeden geniş katalog üretimi başlamaz. Yeni kayıtların mevcut template ile gösterilebilmesi motor, UI veya Android katmanının her batch'te yeniden geliştirilmesini gerektirmemelidir.

## Değişmez kurallar

- Aynı biomekanik hareket farklı ad, dil, alias veya yazımla tekrar sayılamaz.
- Sol/sağ taraf, tempo, tekrar, set, süre veya yalnızca ROM etiketi ayrı egzersiz değildir; bunlar metadata/cue olur.
- Yalnız küçük ekipman veya makine markası değişimi otomatik olarak yeni egzersiz değildir.
- Ekipman değişimi ancak gerçek uygulama mekaniğini, direnç yönünü, dengeyi veya hareket yolunu anlamlı biçimde değiştiriyorsa ayrı kayıt olabilir; gerekçe imzada yazılır.
- Başlangıç/bitiş pozisyonu, tutuş, yön, destek, unilateral/bilateral durum veya hareket paterni uygulamayı gerçekten değiştiriyorsa ayrı kayıt olabilir.
- Her kayıt form cue, bilinen `FigTpl` ve source/license manifest girdisi olmadan kabul edilmez.
- `www/modules/gym/exlib.js` elle düzenlenmez; generated çıktı kaynak girdiden üretilir.
- Eski egzersiz ID'leri korunur; workout geçmişi, import ve backup uyumluluğu bozulmaz.
- Kullanıcı tarafından oluşturulan `c*` kayıtları yerleşik katalog sayısına dahil edilmez.
- Raw pagination gözlemi katalog sayısı değildir; sayım ID bazında tekilleştirilmiş source/runtime kayıtları üzerinden yapılır.

## Mevcut baseline

- Generated ana katalog: `324` — `www/modules/gym/exlib.js`.
- Runtime ekleri: `balance.js` içinde `6` denge ve `2` yürüyüş.
- Yerleşik runtime toplamı: `332`.
- Baseline testi: `node scripts/gym-catalog-baseline.test.js` — `8/8`.
- Baseline yalnız alan, enum, template ve cue bağlantısını doğrular; semantik duplicate ve provenance kapısı henüz yoktur.

## Faz sırası ve kapanış kapıları

### B-0 — Katalog dürüstlük sözleşmesi ve ölçüm

**Amaç:** `332` kaydın gerçek semantik kimliğini ölçülebilir hale getirmek.

**Yapılacaklar:**

1. Kaynak katmanında her yerleşik kayıt için canonical movement identity tanımla.
2. Aşağıdaki alanları normalize eden signature üret:
   - `pattern`: squat, hinge, lunge, push, pull, carry, cardio, mobility, balance ve gerektiğinde alt patern.
   - `primary_joints` ve `rom`: ana eklem/eklem zinciri ve anlamlı hareket aralığı.
   - `unilateral`: bilateral, alternating, unilateral.
   - `stance`: ayakta, dizüstü, oturarak, yatarak, asılı, destekli ve benzeri.
   - `load_mode`: external, bodyweight, assisted, isometric, locomotion.
   - `equipment_role`: ekipmanın direnç yönünü veya temasını değiştiren rolü; yalnız marka adı değil.
   - `direction`: vertical, horizontal, sagittal, frontal, transverse veya çok düzlemli.
   - `tempo_mode`: dynamic, hold, interval; süre/tempo değeri değil hareket sınıfı.
   - `target_region`: birincil bölge ve gerekirse ikincil bölge.
   - `start_end`: hareketi tanımlayan başlangıç/bitiş konfigürasyonu.
   - `figure_template`: gösterim bağlantısı; identity'nin parçası değil, doğrulama alanı.
3. Signature kanonik JSON biçiminde deterministik hash veya karşılaştırılabilir anahtar üret.
4. Her runtime kaydı için `id`, source/runtime provenance, status, reason ve signature içeren `docs/analysis/gym-phase-b-semantic-manifest.json` üret.
5. `332` kaydı otomatik eşleşme, yakın eşleşme ve insan incelemesi listelerine ayır.
6. Sayım raporu şu üç değeri ayrı verir: `sourceCount`, `runtimeCount`, `semanticUniqueCount`.

**Kabul kapısı:** Signature üretimi deterministik; aynı girdide aynı sonuç; eksik alan sessizce varsayılanla doldurulmuyor; belirsiz kayıt `review` durumuna düşüyor.

**Çıktılar:**

- `docs/analysis/gym-phase-b-catalog-contract.md`
- kaynak signature manifesti
- `scripts/gym-catalog-semantic.test.js`
- `docs/analysis/gym-phase-b-semantic-audit-b1.md`
- `docs/analysis/gym-phase-b-semantic-audit.json`

### B-1 — Mevcut 332 duplicate/near-duplicate denetimi

**Amaç:** Yeni kayıt eklemeden önce mevcut baseline'ın ne kadarının gerçekten ayrı olduğunu bilmek.

**Denetim sırası:**

1. Exact ID/ad duplicate.
2. Normalize edilmiş ad duplicate: dil, noktalama, alias, ekipman suffix'i ve yazım farkları.
3. Exact canonical signature duplicate.
4. Near-duplicate: aynı pattern, eklem zinciri, yön, stance ve hareket modu; yalnız ekipman veya isim değişmiş kayıtlar.
5. İnsan incelemesi: otomatik araç `accept`, `merge-review` veya `distinct` önerir; kayıt silmez ve ID değiştirmez.

**Karar kuralları:**

- Aynı hareket: tek canonical identity, tek sayım.
- Gerçek fark: fark alanları ve kullanıcıya etkisi yazılır.
- Kararsız: yeni batch'e alınmaz; `review` kuyruğunda kalır.
- Mevcut kayıtlar bu fazda silinmez. Birleştirme gerekirse ayrı migration, geriye dönük ID alias'ı ve backup/import testi açılır.

**Kabul kapısı:** Tüm `332` kayıt için karar veya açık `review` durumu vardır; bilinmeyen kayıtlar unique sayıya eklenmez.

### B-2 — Kaynak, lisans ve attribution kapısı

Her yeni kayıt için source manifest zorunludur:

```text
record_id
source_name
source_url_or_commit
license
attribution_text
retrieved_at
transformation_note
image_or_figure_provenance
review_status
```

Kurallar:

- Rakip uygulamalardan ad, açıklama, video, GIF veya görsel kopyalanmaz.
- Dış dataset kullanımı lisans metni ve sabit commit/version ile pinlenir.
- Lisans belirsizse kayıt üretime girmez.
- Kaynak açıklama yalnız dönüştürme girdisidir; NeoWell cue metni ayrıca gözden geçirilir.
- Figür çizimi NeoWell üretimidir veya açıkça lisanslanmış asset'e bağlanır.
- Her batch kendi manifest ve attribution kaydıyla birlikte commitlenir.

**Kabul kapısı:** Manifesti veya lisans kararı olmayan kayıt sayılmaz; attribution çıktısı uygulama/dağıtım gereğine göre ayrıca doğrulanır.

### B-3 — Kaynak veri modeli ve üretim hattı

Mevcut generated alanlar korunur: `id`, `n`, `r`, `g`, `k`, `q`, `l`, `c`, `tp`, ayrıca mevcut `inc`, `pr`, `o`, `im` davranışları.

Kaynak katmanına şu alanlar eklenir:

```text
canonical_id
signature
family
primary_joints
stance
unilateral
load_mode
equipment_role
direction
tempo_mode
start_end
cue_ids
figure_template
source_ref
license_ref
status
```

Üretim kuralları:

- Kaynak dosyaları insan tarafından okunabilir ve batch bazında ayrılabilir.
- `build_exlib.py` pinned `free-exercise-db` JSON verisini kullanır; veri lisansı `LICENSE.md` üzerinden Unlicense olarak doğrulanmıştır.
- Dataset fotoğraflarının lisansı doğrulanmadığı için fotoğraf asset'i provenance'ta `unverified/blocked` kalır; bu görselleri kamu malı diye sunma.
- Generated dosyaya elle patch yasaktır; test bunu header ve source/output karşılaştırmasıyla korur.
- `balance.js` gibi runtime ekleri için aynı semantic/provenance manifest sözleşmesi uygulanır; uzun vadede generated katalogla aynı üretim yoluna alınması planlanır.
- Eski ID'ler değişmez; workout geçmişi, import matcher ve backup verisi bu anahtarları kullanır. Birleştirme veya yeniden adlandırma gerekirse ayrı migration ve açık alias map olmadan yapılmaz.
- Yeni ID'ler deterministik ve çakışmasızdır.
- Yeni alanlar runtime'da kullanılmıyorsa bile kaybolmayacak biçimde generated çıktıda veya doğrulanmış sidecar manifestte tutulur.

**Kabul kapısı:** Temiz checkout'ta kaynak → generated → runtime sayımı yeniden üretilebilir; elle düzenlenmiş generated çıktı reddedilir.

### B-4 — 2.5D çöp adam görsel pilotu

Katalog artışından önce aşağıdaki referans hareketler çizilir:

- squat
- bench/press
- Romanian deadlift/hinge
- lunge
- row/pull
- carry
- cardio
- mobility
- balance

Pilot kalite sözleşmesi:

- Hacimli ama sade uzuvler; eklem, pelvis, gövde ve baş ayrı okunur.
- Anatomik yön ve omurga/pelvis ilişkisi hareket boyunca tutarlı kalır.
- El-ayak ve ekipman teması doğru görünür.
- Başlangıç/bitiş ghost overlay hareket farkını açıklar.
- Zemin teması ve gölge kaymaz.
- Kas vurgusu ölçülü ve aynı görsel dilde olur.
- Sabit `viewBox`, `preserveAspectRatio`, ARIA, reduced-motion ve finite geometry sözleşmeleri korunur.
- Browser ve Android API 31/API 36 kanıtları ayrı tutulur; fiziksel cihaz sonucu yoksa iddia edilmez.

**Kabul kapısı:** Her ana aileden pilot için teknik testler yeşil, gerçek browser görüntü incelemesi kayıtlı, görsel dil tutarlı ve bağımsız denetim `CLOSE` olur. Pilot geçmeden büyük batch eklenmez.

### B-5 — 50–100 kayıtlık batch üretimi

Her batch şu sırayla ilerler:

1. Aday hareket listesi ve source manifest hazırlanır.
2. B-0 signature üretimi yapılır.
3. Existing catalog ile exact/near duplicate taranır.
4. İnsan incelemesi yalnız `distinct` adaylara yapılır.
5. Cue, bölge, seviye, ekipman ve template atanır.
6. Mevcut template yeterliyse yalnız kaynak veri eklenir.
7. Yeni geometri gerekiyorsa batch durur ve ayrı visual-template gate açılır.
8. Kaynak → generated üretimi çalışır.
9. Batch testleri ve komşu katalog testleri çalışır.
10. Bağımsız denetim, commit ve CI yapılır.

Batch hedefi 50–100 aday değil, 50–100 **kapıları geçmiş gerçek kayıt** olabilir. Duplicate, lisans, cue veya figür başarısızları bu sayıya dahil edilmez.

### B-6 — Otomatik batch kalite kapısı

Her batch için zorunlu kontroller:

- ID, ad ve canonical identity uniqueness.
- Exact duplicate ve near-duplicate raporu.
- Zorunlu alanlar ve enum değerleri.
- Bilinen `FigTpl`, `EXCUE` cue ve finite geometry.
- Figure bbox/path/head, ARIA, focusable ve reduced-motion.
- Arama, bölge/tür/ekipman filtreleri ve detay ekranı.
- Workout'a ekleme, set kaydı, geçmiş, template ve custom exercise ayrımı.
- Backup/import/export backward compatibility.
- Source manifest, lisans ve attribution.
- Generated Android asset sync ve native/static ayrımı.
- Pagination gözlemlerinin dedup edilmesi.
- Katalog dağılımı ve yeni kayıtların batch sayımı.

Bir kapı çalışmıyorsa batch release edilmez. Test atlamak batch'i tamamlamaz.

### B-7 — Dağılım ve hedef planı

Önce baseline dağılımı ölçülür; hedefler sonradan belirlenir. Aşağıdaki boyutlarda boşluk raporu çıkarılır:

- 9 hareket ailesi.
- Bölge/kas grubu.
- Ekipman rolü ve ev/salon erişimi.
- Başlangıç, orta, ileri seviye.
- Dinamik, izometrik, kardiyo ve mobilite.
- Kullanım senaryosu: güç, genel fitness, ev, salon, rehabilitasyon dışı genel mobilite.

Bir kategori yalnız toplamı doldurmak için yeni kayıt alamaz. Her kayıt hem kendi signature'ı hem de dağılım katkısı ile gerekçelendirilir.

### B-8 — Kademeli rollout ve nihai hedef

Önerilen sıra:

1. B-0: signature sözleşmesi ve ölçüm.
2. B-1: `332` semantik audit.
3. B-2/B-3: provenance ve üretim hattı.
4. B-4: 9 ailelik 2.5D pilot.
5. Batch 1: 50–100 kayıt, dar kapsamlı gerçek içerik.
6. Batch 2: 50–100 kayıt, farklı aile/ekipman dengesi.
7. Sonraki batch'ler: her biri bağımsız kapı, commit, CI ve audit.
8. Dağılım yeniden ölçümü ve eksik alanlara yönlendirme.
9. `semanticUniqueCount` yaklaşık `1200` olduğunda son katalog denetimi.

`1200` hedefi yalnız şu durumda tamamlanmış sayılır:

- Gerçek source/runtime sayımı doğrulanmış.
- Semantic duplicate listesinde kabul edilmemiş kayıt yok.
- `review` kayıtları sayıya eklenmemiş.
- Her kayıt cue, template ve provenance ile bağlı.
- Tüm batch'ler aynı kalite kapısından geçmiş.
- Browser, generated Android ve mevcut no-Coach kapıları yeşil.
- Fiziksel cihaz doğrulanmadıysa bu açık risk olarak raporda kalmış.

## Batch rapor formatı

Her batch raporu en az şunları içerir:

```text
batch_id
source_count
candidate_count
accepted_count
rejected_duplicate_count
rejected_license_count
rejected_missing_cue_or_figure_count
review_count
semantic_unique_total
families_added
source_manifest
commands_and_exit_codes
browser_or_native_evidence_tier
open_risks
```

`accepted_count` yalnız tüm kapıları geçen kayıtları ifade eder. `candidate_count` veya raw pagination sayısı hedefe eklenmez.

## Açık riskler

- Mevcut `332` kaydın semantic duplicate sonucu henüz ölçülmedi.
- Yeni kaynakların lisans/attribution kararı henüz verilmedi.
- 2.5D pilot geometrisi henüz üretilmedi.
- Fiziksel Android/WebView/OEM görsel performansı doğrulanmadı.
- Eski `scripts/gym2.test.js:121` keyboard assertion failure'ı Faz B kataloğundan bağımsız olarak açıktır.
- `1200` sayısına ulaşmak, yeterli lisanslı ve gerçek hareket bulunamazsa zorunlu başarı gibi raporlanmayacaktır.

## İlk uygulanacak iş

B-0 için önce canonical signature şeması, `332` kayıt okuyucusu ve kırmızı semantic duplicate testi yazılacak. Test, yalnız ID/ad benzersizliğine dayanan sahte bir kataloğu kabul etmeyecek; aynı signature veya near-signature çakışmasını raporlayacak. Bu kapı yeşile gelmeden yeni egzersiz batch'i eklenmeyecek.
