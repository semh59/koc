# Faz B — B-2 kaynak ve lisans provenance

## Doğrulanmış kaynaklar

- Veri kaynağı: `yuhonas/free-exercise-db`.
- Pinned commit: `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`.
- Veri yolu: `dist/exercises.json`.
- Lisans dosyası: `LICENSE.md`.
- Veri lisansı: Unlicense/public-domain dedication metni pinned committe doğrulandı.
- `docs/analysis/gym-phase-b-provenance.json`: baseline source/lisans/asset karar manifesti.
- `scripts/gym-provenance.js`: kod tarafı provenance sözleşmesi.

## Fotoğraf ayrımı

Dataset JSON/metin lisansı, dataset fotoğraflarının lisansını otomatik olarak kanıtlamaz. Upstream issue #2'de bakımcı, görsellerin kökeni ve royalty-free durumunun bilinmediğini açıkça belirtiyor. Bu nedenle:

- `free-exercise-db-data`: `verified`.
- `free-exercise-db-images`: `unverified`, `blocked`.
- Fotoğraflar uygulama metninde kamu malı diye sunulmaz.
- NeoWell çöp adamı `neowell-figure` ayrı, dahili provenance olarak tutulur.
- Fotoğraf lisansı kesinleşmeden yeni fotoğraf asset'i batch'e kabul edilmez.

- Test: `scripts/gym-provenance.test.js` — `9` kontrol: kaynak veri/asset ayrımı, bilinmeyen kayıt reddi, gerçek `exSheet` HTML çıktısı ve manifest eşitliği.
- `324` kayıt `scripts/exlib-src.txt` üzerinden dış dataset'e; `6` denge + `2` yürüyüş kaydı `neowell-data` dahili kaynağına bağlanır. Tanınmayan kayıt `unknown/unverified/review` olur.
- Dahili figür kaydı B-4 görsel kalite veya 2.5D pilot onayı değildir.

## Runtime manifest

Her yerleşik runtime kaydı için data kaynağı, data lisans durumu, asset kaynağı, asset lisans durumu ve karar üretilir. `332` kayıt için provenance satırı vardır.

`decision=review` olan fotoğraf kayıtları semantic veya katalog hedef sayısına katkı vermez; mevcut kayıtlar bu aşamada silinmez. Bu yalnız kabul kapısıdır.

## Test kanıtı

```text
node scripts/gym-provenance.test.js
9 kontrol geçti, 0 hata
```

- Önceki callback kaynaklı sahte yeşil ve `evidenceUrl` alan hatası düzeltildi. Önceki `6/6` iddiası kapanış kanıtı değildir.
- Bellek içi `13` mutation: kaynak yolu/commit/lisans yolu/lisans/durum, fotoğraf durumu/kullanımı/kanıtı, yerel kaynak, bilinmeyen karar, eksik satır, yanlış ID ve fotoğraf render geri dönüşü. Bozuk örnekler assertion ile `exit 1`; normal kaynak `exit 0`; dosyalar değişmedi.
- Yerel/geçici mutation kanıtı: `C:/Users/semih/AppData/Local/hermes/cache/scratch/check-gym-b2-mutations.js` ve `gym-b2-mutation-result.json`.
- Komşu testler: semantic `12/12`, baseline `8/8`, balance `7/7`, import `38/38`, figür `17/17`.
- No-Coach release runner: `83` dosya, `2186` PASS, `0` başarısız; Coach-only `8` skip ve mixed `18` ayrı kapsam. Tam mixed `npm test` yeşil iddiası yok.
- No-Coach browser E2E: `16/16`, iki viewport (`360`, `412`); fotoğrafsız figür detayını çalıştırır. Android WebView veya fiziksel cihaz kanıtı değildir.
- Capacitor copy + Android patch + sync verifier: `28` Java dosyası, `44` kaynak resource, `758` web asset'i eşleşti. APK/AAB build veya emülatör çalıştırılmadı.
- Üretim: `node scripts/write-gym-provenance.js`. Test manifesti registry ve runtime çıktısıyla birebir karşılaştırır. `eligible` yalnız provenance kararıdır, semantik kabul değildir.

## Açık iş

1. Son snapshot için bağımsız denetim, commit ve CI açık.
2. Fotoğraflar ana detaydan çıkarıldı; dosyalar silinmedi ve pakette kalır. `blocked`, paket içinde bulunmadıkları anlamına gelmez. Lisans/paketleme riski yeni yayın öncesi ayrı kaldırma veya lisans kararı gerektirir.
3. B-3 yeni batch modeli için kayıt bazlı kaynak URL/commit, lisans, edinim tarihi, attribution ve dönüşüm notu; baseline mevcut olmayan tarihleri uydurmaz.
4. Attribution metnini dağıtım gereğine göre hukuk/ürün incelemesinden geçirmek. APK/emülatör/fiziksel cihaz doğrulaması yerel kapılarla kapanmaz.
