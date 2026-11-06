# Eski egzersiz düzeltmeleri — 5: geniş/dar squat talimatları

`widesquat` ve `narrowsquat` aynı `squat` şablonunu kullanıyor, eski ortak cue ikisine de omuz genişliğinde duruş söylüyordu. Kaynak `scripts/exlib-src.txt` bunları açıkça Wide Stance Barbell Squat / Narrow Stance Squats olarak ayırır.

İki ID için duruşa özel Türkçe cue eklendi; `exCues` hem detay hem rehberli modda aynı kaydı seçer. Diğer egzersizler ve özel hareketler template cue'suna devam eder; kalıtılmış ID/template alanları override seçemez. Varsayılan squat cue'su değişmedi. Detayda mevcut yan figürün genel squat temsili olduğu, duruş genişliğini göstermediği açıkça belirtilir. Figürün geniş/dar duruş ayrımını çizdiği iddia edilmez; görsel düzeltme hâlâ açık.

## Kanıt
- RED: gerçek boot ve `exSheet` üzerinden eski metin `widesquat detail needs stance-specific cue` assertion'ında exit 1. İlk hata koşusunda pencere kapatılmadığı için timeout oluştu; finally cleanup sonrası aynı assertion exit 1 ile tekrarlandı.
- GREEN `gym-stance-cues.test.js`: 5 PASS; her iki ID detay/rehberli mod, ortak template fallback, özel kayıt ve kalıtım kontrolü.
- Gerçek Chrome E2E: detayda doğru geniş/dar cue ve genel figür notu, rehberli modda aynı cue. 360/412 px; tam release E2E 28/28 PASS.
- Tam No-Coach runner: 93 dosya, 2.307 PASS, 0 hata; 8 Coach-only skip, 18 mixed scoped.
- `build-gym-catalog.js --check` ve Android copy/patch/sync: 28 Java, 44 resource, 115 web asset, exit 0.

Yalnız cue seçimi ve iki metin değişti; figürler, runtime ID/antrenman alanları ve geçmiş korunur. Bağımsız denetim bekleniyor. 332 canonical review, yeni kabul 0. CI/API31/API36/fiziksel cihaz/klinik onay yok. `heeltoe`, `sidestep` ve dış katalog varyant figürlerinin tam düzeltmesi açık.
