# Faz B — Katalog baseline envanteri

## Kapsam

Bu belge yeni egzersiz eklemeden önce mevcut üretim hattının ölçümüdür. `exlib.js` generated kaynaktır; `balance.js` runtime sırasında ek kayıtları `EXDB` dizisine ekler.

## Doğrulanmış sayılar

- Generated ana katalog: `324` kayıt (`www/modules/gym/exlib.js`).
- `balance.js` denge ekleri: `6` kayıt.
- `balance.js` yürüyüş ekleri: `2` kayıt (`fastwalk`, `slowwalk`).
- Runtime toplamı: `332` benzersiz kayıt.
- Runtime kayıtlarının tamamında benzersiz ID ve ad var.
- Runtime kayıtlarının tamamında zorunlu alanlar var: `id`, `n`, `r`, `g`, `k`, `q`, `l`, `c`, `tp`.
- Runtime kayıtlarının tamamı bilinen `FigTpl` ve en az bir `EXCUE` form ipucuna bağlı.
- Enum alanları üretim sözleşmesinde kaldı: `k`, `c`, `l`.

## Kaynak ve üretim kuralı

- `www/modules/gym/exlib.js` elle düzenlenmez; dosya başındaki üretim bildirimi `scripts/build_exlib.py` ve kaynak girdilerini gösterir.
- Yeni generated kayıtlar üretim girdisine eklenir; generated çıktı elle yamalanmaz.
- `www/modules/gym/balance.js` generated katalog dışında kalan denge/yürüyüş kayıtlarının runtime ekleme noktasıdır.

## Test kanıtı

```text
node scripts/gym-catalog-baseline.test.js

8 kontrol geçti, 0 hata
```

Test dosyası: `scripts/gym-catalog-baseline.test.js`.

## Açık kapsam

Bu baseline yalnız mevcut kayıtların yapısal ve figür/cue bağlantısını kanıtlar. Lisans/attribution kaynağı, yeni kayıt veri seti, browser arama/filtre davranışı ve düşük bellekli fiziksel Android performansı henüz Faz B kapsamında doğrulanmadı.
