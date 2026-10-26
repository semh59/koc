# Faz 4 — load/save ve veri yaşam döngüsü

## Açılış

`www/main/01-core.js:222-246`:

1. `S=load()` ile state yüklenir.
2. IndexedDB/sharded modda `Store.getShards()` çağrılır ve `assemble()` ile state birleştirilir.
3. Fallback modda `nw_state` okunur ve JSON parse edilir.
4. Veri yoksa `DEF` varsayılanı kullanılır.
5. `entries` array değilse recovery state oluşturulur; varsayılan state döner.
6. `buildState()` alanları normalize eder ve geçersiz kayıtları ayırır.
7. Atılan/geçersiz alanlar varsa ham içerik `nw_state_corrupt` kopyasına yazılmaya çalışılır.

## Recovery yaklaşımı

Kod yorumu ve akışa göre okunamayan kayıt otomatik silinmiyor; `recovery` tutuluyor ve kullanıcıya ham veriyi dışa aktarma/boş başlama seçeneği sunuluyor. Bu, veri kaybını gizlemek yerine kurtarma yolunu öne çıkaran bir tasarım.

## Kaydetme

`save()` state'i shard'lara ayırır. IndexedDB/sharded modda yalnız değişen shard'ların yazılması hedeflenmiş; localStorage fallback'te tek `nw_state` metni kullanılır. Store yazma başarısızlığı `Store.failed`/`saveFail` ile izlenir ve UI'da durum mesajı üretmek için kullanılır (`www/main/01-core.js:262-293`).

## Güvenlik kopyaları

Restore öncesinde `nw_state_previous` yazılabilir (`www/main/04-sheets.js:401`). Kopya, kullanıcı gördüğünü işaretleyene veya 7 gün geçene kadar korunmaya çalışılır. `nw_state_corrupt` ise okunamayan ham state içindir.

## Veri yaşam döngüsü

```text
UI event
→ module API veya doğrudan domain handler
→ S alanı / Log API mutasyonu
→ save()
→ shardOf(S)
→ Store.putShards veya localStorage nw_state
→ Store.whenIdle
→ sonraki load/assemble
→ render
```

Bu akışta render çoğunlukla save çağrısının hemen ardından yapılır; kalıcı yazmanın gerçekten başarılı olduğu her UI yolu için ayrı doğrulanmalıdır.

## Doğrulama noktaları

- `buildState()` geçersiz kayıtları temizler.
- `load()` okunamayan state için recovery oluşturur.
- `shardOf()` sahiplik listelerine göre veriyi ayırır.
- `assemble()` chunk'ları birleştirip id sırasına koyar.
- `Log.put/remove/restore/drop` entries mutation API'sini merkezileştirir.

## Açık riskler

1. Render'ın yazma tamamlanmadan yapılması kullanıcıya kalıcı olmayan başarı görüntüsü verebilir.
2. `localStorage` fallback tek metin ve kota sınırına bağlıdır; büyük coach chat veya backup kopyaları kritik olabilir.
3. Shard listesinde olmayan alanlar `other` içine düşer; migration görünürlüğü azalır.
4. `entries` ay shard'ı `day` string formatına güvenir.
5. Privacy temizliği sonrası `save()` başarısız olursa kullanıcı verisinin gerçekten silinip silinmediği UI tarafından açıkça gösterilmeli.

## Faz 4 sonucu

Veri sahibi → shard → storage → load/recovery zinciri belgelenmiştir. `Modules` sözleşmesi uygulamada gerçek bir boundary testiyle destekleniyor; sıradaki iş bu testi çalıştırmak ve ardından native bridge analizine geçmektir.
