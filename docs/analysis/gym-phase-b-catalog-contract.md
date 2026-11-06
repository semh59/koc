# Faz B — Canonical movement identity sözleşmesi

## Amaç

Egzersiz sayısını ID, isim veya ekipman etiketiyle yapay biçimde artırmayı engellemek. Tam canonical metadata yalnız `candidateSignatureCount` üretir. `semanticUniqueCount` otomatik şema denetiminde `0` kalır; gerçek hareket farkı, provenance ve bağımsız kabul ayrı kanıtlanmalıdır.

## Canonical alanlar

Signature şu alanları zorunlu kabul eder:

- `pattern`: squat, hinge, lunge, push, pull, carry, cardio, mobility, balance veya doğrulanmış alt patern.
- `primary_joints`: ana eklem veya eklem zinciri.
- `rom`: hareketin anlamlı hareket aralığı.
- `unilateral`: `bilateral`, `alternating` veya `unilateral`.
- `stance`: ayakta, dizüstü, oturarak, yatarak, asılı, destekli vb.
- `load_mode`: external, bodyweight, assisted, isometric veya locomotion.
- `equipment_role`: ekipmanın hareket mekaniğindeki rolü; yalnız marka/ad değil.
- `direction`: sagittal, frontal, transverse, vertical, horizontal veya çok düzlemli.
- `tempo_mode`: dynamic, hold veya interval; süre/tempo değeri değil sınıf.
- `target_region`: birincil hedef bölge.
- `start_end`: hareketi ayırt eden başlangıç/bitiş konfigürasyonu.

`figure_template`, `cue_ids`, source ve license alanları signature'ın kimliği değildir; fakat katalog kabulü için zorunlu doğrulama alanlarıdır.

## Karar sınıfları

- `duplicate`: yalnız tüm alanları geçerli aynı canonical signature; bu, metadatanın eşitliğidir, lisans/form doğruluğu onayı değildir.
- `distinct`: kanıtlı insan/bağımsız kabul kararı gerektirir; otomatik karşılaştırıcı bu kararı üretmez.
- `review`: farklı signature (ROM/tempo/ekipman/unilateral dahil), eksik veya geçersiz metadata. Eksik legacy anahtar eşitliği yalnız `observedGroups` inceleme sinyalidir.

`review` kayıtları semantic unique sayıya dahil edilmez. Otomatik denetim mevcut kayıtları silmez, yeniden adlandırmaz veya ID değiştirmez.

## ID sözleşmesi

Yerleşik egzersiz ID'leri kalıcı katalog anahtarıdır. Workout geçmişi, import matcher ve backup verisi ID kullanır. Birleştirme veya yeniden adlandırma gerekirse ayrı migration ve açık alias map gerekir; normal batch üretimi mevcut ID'lere dokunamaz.

## Üretim davranışı

- Signature kanonik nesne anahtarlarını ve string küme alanlarını sıralar; tekrarlı küme elemanı tekilleştirilir. Enum alanları tek değer, diğer alanlar string veya string dizisidir; boolean/object/number token dönüştürülmez.
- Display name signature kimliğine dahil edilmez.
- Eksik canonical alanlar varsayımla doldurulmaz.
- Legacy kayıtlarda yalnız mevcut `tp`, bölge, tür ve ekipman ile yapılan gözlem ön taramadır; kesin biomekanik doğrulama değildir.
- Strict mod eksik canonical metadata ile üretimi durdurur.
- Canonical enum alanları yalnız izinli sözlükleri kabul eder; diğer alanlar düşük harfli slug biçiminde doğrulanır.
- Audit çıktısı her runtime kayıt için `id`, provenance, `status`, `reason` ve signature içeren manifest satırı üretir.

## Kanıt sınırı

Bu sözleşme şu anda B-0 doğrulama katmanını sağlar. Mevcut 332 kaydın canonical metadata ile elle/kanıta dayalı eşlenmesi henüz yapılmadı. Dolayısıyla bu aşama yeni katalog kaydı veya 1200 hedefi tamamlandığı anlamına gelmez.
