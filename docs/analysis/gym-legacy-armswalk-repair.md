# Eski egzersiz düzeltmeleri — 2: kollar yanda yürüyüş

## Doğrulanan hata
`armswalk` kaydının `balwalk2` şablonunda iki bacak tüm döngü boyunca aynı koordinattaydı. Birlikte bükülme gösteriliyor, yürüyüşteki karşı faz yoktu. `EXCUE.balwalk2` kollar yanda, eşit kontrollü adım tarif eder.

## Değişiklik
Yalnız `balwalk2` şablonu: mevcut `walk` bacak açıları karşı fazla kullanıldı; gövde dik, iki kol 4° ile yanda sabit. Kalça yatay referans seçildi. Bu yerinde, genel yürüyüş temsili; fiziksel destek ayağı kaymazlığı veya klinik yürüyüş analizi iddiası değildir. Runtime ID, veri, cue, kayıt/geçmiş ve önceki `onefoot` düzeltmesi korunur. `heeltoe` için gereken topuk-parmak temaslı yürüyüşün düzeldiği iddia edilmez.

## Kanıt
- RED: `gym-legacy-balance.test.js` eski şablonda `walking feet must exchange front/back order` assertion ile exit 1.
- GREEN: 49 örnekte ayak sırası değişimi, kolların yanda kalması, zemin referansı, finite/viewBox kontrolü; çakışan bacak ve sallanan kol mutasyonları reddedilir. Önceki tek ayak korumalarıyla toplam 7 PASS.
- Gerçek tarayıcı `exSheet("armswalk")`: SVG SMIL 0/1,3/2,6 sn örneklerinde ön/arka ayak sırası tersine döner, döngü kapanır, kollar yanda; reduced-motion statik ve sıfır animate.
- Tam release runner: 92 dosya, 2.295 PASS, 0 hata; 8 Coach-only skip, 18 mixed scoped.
- Tam release E2E: 22/22 PASS, 360/412 px.
- Katalog `--check` ve Android copy/patch/sync: 28 Java, 44 resource, 115 web asset, exit 0.

Bağımsız denetim bekleniyor. CI, API31/API36, fiziksel cihaz, subjektif görsel/klinik onay yok. Katalog 332, canonical review 332, yeni kabul 0. Diğer yerel şablonlar ve dış katalog varyantları açık; yeni egzersiz ekleme bekletiliyor.
