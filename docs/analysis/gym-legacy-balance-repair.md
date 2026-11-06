# Eski egzersiz düzeltmeleri — 1: tek ayak duruşu

## Somut hata ve düzeltme
`onefoot` eski şablonunda kalkık yakın bacak yatay yerleştirme çıpasıydı. Yerdeki uzak ayağın X konumu döngü boyunca 23,635386 çizim birimi kayıyordu. Başlangıçta iki ayak zemindeydi; tutuş cue'su ile örtüşmüyordu.

Yeni şablonda yakın bacak destek, uzak bacak kalkık; destek dizi hafif bükük (4/-4), kalça/destek bacak döngü boyunca sabit. Koldaki küçük değişim tutuşu bozmadan animasyon sağlar. Motor, veri modeli, ID, cue ve antrenman geçmişi değişmedi. Diğer 331 kaydın düzeldiği iddia edilmez.

## Gerçek yürütme
- RED: `gym-legacy-balance.test.js`, eski şablonda `free foot stays raised throughout hold` assertion ile exit 1.
- GREEN: aynı test 49 örnek boyunca sabit destek ayak/bacak, zemin teması, kalkık serbest ayak, finite/viewBox geometriyi doğrular. 4 PASS; iki ayak yerde, oynayan destek ve eski şablon mutasyonları reddedilir.
- Tarayıcıda gerçek `exSheet("onefoot")` SVG SMIL zaman çizgisinde 13 nokta örneklenir. Destek ayak kayması <0,01; zemin Y=136; serbest ayak Y<128. Reduced-motion'da animate yok.
- No-Coach release runner: 92 dosya, 2.292 PASS, 0 hata; 8 Coach-only skip, 18 mixed scoped.
- Tam release E2E: 20/20 PASS, 360 ve 412 px.
- Pilot galeri aynı şablondan tekrar üretildi. Capacitor copy/patch sonrası 28 Java, 44 resource, 115 web asset eşleşti.
- Ekran görüntüleri test çıktılarına `onefoot.png` olarak kaydedildi. Görsel inceleme aracı resmi göremediğini bildirdi; subjektif görsel onay verilmez. DOM/geometri kanıtı gerçek tarayıcıda elde edilmiştir.

## Açık işler
Bağımsız denetim bekleniyor. CI, API31/API36 WebView, fiziksel cihaz ve klinik/biyomekanik onay yok. Katalog 332, canonical review 332, yeni kabul 0. `heeltoe`, `armswalk`, `chairstand`, `sidestep`, `tandem` ve dış katalog varyant uyumsuzlukları hâlâ açık; sıradaki düzeltmeler ayrı RED/GREEN ve bağımsız denetimle ele alınacak.
