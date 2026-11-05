# Faz B — B-0 semantic audit başlangıç ölçümü

## Ölçüm kapsamı

- Source inventory: `scripts/exlib-src.txt` — `324` generated source satırı.
- Generated inventory: `www/modules/gym/exlib.js` — `324` kayıt.
- Runtime inventory: generated `324` + `balance.js` içindeki `6` denge + `2` yürüyüş = `332` kayıt.
- `scripts/gym-catalog-semantic.js`: canonical signature ve audit.
- `scripts/write-gym-semantic-manifest.js`: manifest üretimi.
- `docs/analysis/gym-phase-b-semantic-manifest.json`: `332` runtime satırlık B-0 snapshot.
- Test: `scripts/gym-catalog-semantic.test.js`.

## Sonuç

```text
sourceCount=324
runtimeCount=332
semanticUniqueCount=0
reviewCount=332
legacyObservedDuplicateGroups=78
```

`semanticUniqueCount=0` bir katalog silme veya mevcut kayıtların aynı olduğu iddiası değildir. Mevcut 332 kaydın hiçbirinde zorunlu canonical movement metadata bulunmadığı için strict olmayan audit bunların tamamını `review` durumunda tutmuştur. Bu, sayı hilesini engelleyen muhafazakâr sonuçtur.

`legacyObservedDuplicateGroups=78`, yalnız `tp + bölge + tür + ekipman` ön gözlem anahtarıyla oluşan gruplardır. Bu gruplar kesin duplicate kabul edilmez; örneğin squat varyantları, unilateral farklar, ROM, stance veya makine/direnç yönü bilgisi mevcut generated kayıtta ayrı alanlar olarak bulunmadığından insan/kanıt incelemesi gerekir.

## Ne kanıtlandı

- Aynı display name değişse bile aynı signature aynı kalır.
- Aynı gözlenen hareket kopyası duplicate olarak raporlanır.
- Tam canonical metadata olmadan kayıt `distinct` sayılamaz.
- Yalnız ekipman veya eksik fark `review` durumunda kalır.
- Strict mod eksik canonical metadata ile durur.
- ID/ad benzersizliği ile semantic uniqueness birbirinden ayrıdır.

## Açık iş

1. Mevcut 332 kayıt için canonical alanları kaynak/provenance kanıtıyla doldurmak.
2. Her kaydı `distinct`, `duplicate` veya `review` olarak insan incelemesinden geçirmek.
3. Near-duplicate karşılaştırmasını alan bazlı raporlamak.
4. `semanticUniqueCount` ancak bu inceleme sonrasında güncellemek.
5. Yeni batch eklememek; B-0/B-1 kapanmadan sayı hedefi raporlamamak.
