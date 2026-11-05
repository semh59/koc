# Faz B — B-1 mevcut katalog duplicate aday denetimi

## Karar

Bu rapor otomatik silme, birleştirme veya semantic unique sayısını artırma raporu değildir. `332` kaydın tamamı canonical metadata incelemesi tamamlanana kadar `review` durumundadır.

## Ölçüm

- Source kayıt: `324`
- Runtime kayıt: `332`
- Semantic unique: `0`
- Review: `332`
- Normalize ad aday grubu: `7`
- Legacy gözlem duplicate grubu: `78`
- Makine raporu: `docs/analysis/gym-phase-b-semantic-audit.json`
- Üretim script'i: `scripts/write-gym-semantic-audit.js`

## Normalize ad adayları

Ad normalizasyonu küçük/büyük harf, aksan, noktalama ve bilinen ekipman sözcüklerini ayırır. Bu yalnız aday bulma filtresidir; aynı kelime kümesi aynı biomekanik hareket anlamına gelmez.

Örnek adaylar:

- `squat`: `squat`, `dbsquat`, `smithsquat`
- `leg press`: `legpress`, `smithpress`
- `duz bacak deadlift`: `stiffdl`, `dbstiffdl`
- `calf raise`: `calf`, `dbcalf`, `smithcalf`
- `bench press`: `bench`, `dbbench`, `smithbench`
- `dik cekis`: `dbupright`, `smithupright`
- `kurek`: `smithrow`, `kbrow`

Bu gruplar ekipman, makine, tutuş, duruş veya hareket yolu farkı içerebilir. İnsan incelemesi olmadan duplicate kararı verilmez.

## Legacy ön-gözlem sınırı

`78` grup yalnız şu eksik gözlem anahtarına dayanır:

```text
tp + bölge + tür + equipment property
```

Bu anahtar ROM, stance, unilateral/bilateral, eklem zinciri, direnç yönü ve başlangıç/bitiş durumunu içermez. Bu nedenle `78` kesin duplicate sayısı değildir; yalnız inceleme önceliği listesidir.

## Kabul edilen davranış

- Aynı adın yazım/dil/ekipman gürültüsü normalize edilmiş adayları raporlanır.
- Romanian deadlift ve stiff-legged deadlift gibi gerçek hareket sözcüğü farkları birleştirilmez.
- Eksik canonical metadata semantic unique sayıya girmez.
- Hiçbir mevcut ID değiştirilmez.
- `1200` hedefine hiçbir aday grubu eklenmez.

## Açık iş

1. Aday gruplarını kanıtla tek tek incelemek.
2. Her kayıt için canonical alanları doldurmak.
3. Gerçek farkları `distinct`, aynı hareketleri `duplicate`, belirsizleri `review` olarak işaretlemek.
4. Ancak bu işlemden sonra semantic unique toplamını güncellemek.
