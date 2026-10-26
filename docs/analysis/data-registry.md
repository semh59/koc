# Faz 3 — Data registry ağı

## Registry tanımı

`www/kernel/kernel.js:10` şu registry listelerini tanımlar:

```text
privacy, csv, csvEntries, hist, histSearch, dayRows, dayWork
```

`www/kernel/kernel.js:13` boot sırasında yalnız `privacy` listesini `order` alanına göre sıralar.

## Üretici envanteri

| Registry | Üretici modüller | Tüketim/aggregation |
|---|---|---|
| `privacy` | `log`, `gym`, `habits`, `meds`, `motion`, `labs`, `vitals`, `measures`, `nutrition`, `coach`, `cycle`, `pulse`, `data/photoui` | `data/privacyui.js` |
| `csv` | `log`, `gym`, `habits`, `meds`, `motion`, `labs`, `vitals`, `nutrition`, `pulse` | `data/csvlib.js` |
| `csvEntries` | `log`, `measures` | `data/csvlib.js` üzerinden birleşik kayıt akışı |
| `hist` | `log`, `gym`, `habits`, `meds`, `motion`, `labs`, `vitals`, `measures`, `pulse` | `history/historylib.js:9` |
| `histSearch` | `log`, `gym`, `habits`, `motion`, `labs`, `vitals` | `history/historylib.js:63` |
| `dayRows` | `log`, `motion`, `pulse`, `vitals`, `labs`, `measures`, `meds`, `habits` | `history/historyui.js:70-71` |
| `dayWork` | `gym` | `history/historyui.js:70-71` |

## Callback sözleşmeleri

### `privacy`

Kayıt biçimi genel olarak:

```text
[label, countFn, clearFn, order, optionalNote]
```

Örnek: `www/modules/meds/index.js:2`. `privacyui.js` bu kayıtları kullanıcıya veri temizleme seçenekleri olarak sunar. `clearFn` bazı modüllerde yalnız JS state'i, bazı modüllerde native wipe + JS state'i temizler (`meds`, `motion`). Bu fark güvenlik açısından önemlidir.

### `csv`

Kayıt biçimi:

```text
[key, label, headerFn, rowsFn, order, optionalKindColumn]
```

Tüketim ve sıralama: `www/modules/data/csvlib.js:13-17`. `rowsFn` ortak bir context alır; bu context birim, tarih, isim ve formatlama yardımcılarını taşır.

### `hist`

Her callback `S` ve `{add,get,dk}` context'i alır. `www/modules/history/historylib.js:9` tüm callback'leri sırayla çalıştırır. Bu, history görünümünün domain modüllerini doğrudan bilmeden veri toplamasını sağlar.

### `histSearch`

Her callback arama context'i `{n,norm,out,wname}` alır (`www/modules/history/historylib.js:63`). Callback sonuçları ortak `out` listesine ekler.

### `dayRows` / `dayWork`

- `dayRows`: `[order, rowFn]` biçimindedir.
- `dayWork`: doğrudan gün anahtarından HTML döndüren callback'lerdir.
- Tüketim: `www/modules/history/historyui.js:70-71`.

## Kanıtlanmış mimari özellik

History, CSV, privacy ve day summary modülleri plugin/registry benzeri bir toplama mimarisi kullanıyor. Domain modülleri ortak listelere callback ekliyor; tüketici katmanı bu callback'leri sırayla çalıştırıyor. Bu, doğrudan import bağımlılığını azaltıyor ancak callback sözleşmelerini örtük hale getiriyor.

## Riskler

1. **Tip sözleşmesi runtime'da:** Registry callback'leri için statik tip veya merkezi validation görünmüyor.
2. **Sıra bağımlılığı:** `privacy` ve `csv` için `order` alanı var; diğer registry'lerde kayıt sırası HTML script sırasına bağlı olabilir.
3. **Ortak mutable çıktı:** `histSearch` callback'leri ortak `out` listesine yazıyor; bir callback'in hatası tüm aramayı etkileyebilir.
4. **HTML üretimi:** `dayRows` ve `dayWork` callback'leri HTML string üretir. Kullanıcı verisinin `esc` ile kaçırılması her üreticide ayrıca doğrulanmalı.
5. **Silme yan etkileri:** Privacy temizleme callback'leri JS state, log ve native depolamayı farklı kombinasyonlarda temizliyor.

## Sonraki kontrol

- Her registry tüketicisinde exception isolation var mı?
- Callback return değerleri doğrulanıyor mu?
- `Data.csvEntries` kullanıcı verisi ile domain export verisini nasıl birleştiriyor?
- Registry kayıtları boot sonrasında değişiyor mu?
