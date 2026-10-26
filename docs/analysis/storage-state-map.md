# Faz 3 — storage ve global state ön haritası

## Store katmanı

`www/kernel/storelib.js:3-10` ana kalıcılık katmanını tanımlar:

- IndexedDB varsa `neowell` veritabanı ve `kv` object store
- Fallback olarak `localStorage`
- Ana metadata anahtarı: `m:meta`
- Güvenlik kopyaları: `nw_state_previous`, `nw_state_corrupt`
- Fallback ana state: `nw_state`

Store yorumuna göre IndexedDB modunda state shard'lara ayrılabilir; localStorage modunda tek metin state kullanılır. Yazma başarısızlığı memory'de tutulur ve sonraki yazmayla tekrar denenir.

## Ayrı localStorage kanalları

| Anahtar | Dosya | Amaç |
|---|---|---|
| `nw_netlog` | `www/kernel/netlog.js:4-18` | Son 100 network log, 30 günlük temizlik |
| `nw_state` | `www/kernel/storelib.js` | IndexedDB fallback ana state |
| `nw_state_previous` | `www/kernel/storelib.js` | Önceki state kopyası |
| `nw_state_corrupt` | `www/kernel/storelib.js` | Bozuk state kopyası |
| `m:meta` | `www/kernel/storelib.js` | Store metadata; IndexedDB ile de kullanılır |

## Güvenli yardımcılar

`www/kernel/ls.js:3-5` `lsGet`, `lsSet`, `lsDel` fonksiyonlarını tanımlar. Hatalar null/false/ignore ile bastırılır. Bu, private mode veya quota hatasında uygulamanın exception ile durmasını önler; ancak çağıran katman yazma başarısızlığını ayrıca takip etmiyorsa sessiz veri kaybı riski doğurur.

## Global state

Kodun ana state nesnesi `S` olarak çok sayıda modülde kullanılıyor. İlk doğrudan kanıtlar:

- `www/modules/coach/index.js:2` — `S.chat`, `S.chats`, `S.providers`, `S.keys`, `S.settings`
- `www/modules/cycle/index.js:2` — `S.cycle`, `S.cycleSym`, `S.settings.cycleOn`
- `www/modules/gym/index.js:2-11` — `S.workouts`
- `www/modules/coach/index.js:2` — `S.providers`, `S.chats`

Bu modüller `S`'yi doğrudan okuyor; bazıları privacy temizleme callback'lerinde doğrudan alan yazıyor. State sahipliği merkezi görünmüyor ve Faz 4'te alan bazlı yazıcı/okuyucu matrisi çıkarılmalı.

## Network log

`www/kernel/netlog.js:15` fetch'i timeout ile sarıyor:

- Timeout: `1e4` ms
- Başarılı/başarısız response `ok` alanıyla loglanıyor
- Host ve kind kaydediliyor
- Kayıtlar `nw_netlog` içine yazılıyor
- Maksimum 100 kayıt ve 30 gün saklama var

Burada request body'nin kaydedilip kaydedilmediği statik kodla kontrol edilmeli; mevcut ilk satırlarda host/kind/ok/timestamp filtresi görüldü.

## İlk riskler

1. Store yazma başarısızlığı ile kullanıcıya gösterilen durumun eşleşmesi doğrulanmalı.
2. `S` alanlarının çok sayıda domain modülünden doğrudan değiştirilmesi veri sahipliğini zayıflatabilir.
3. Network log sağlık verisi içermese bile host ve zaman bilgisi metadata oluşturur; privacy temizleme kapsamı kontrol edilmeli.
4. `nw_state_corrupt` ve `nw_state_previous` temizleme/erişim yolları backup/privacy akışıyla eşleştirilmeli.
