# Eski egzersiz düzeltmeleri — 6: omuzda barla good morning talimatı

`goodmorning` ve `stiffgm` kaynakta `hinge` şablonunu ve `bar@sh` omuz barını kullanıyor (`scripts/exlib-src.txt`). Ortak hinge cue'su ağırlığı bacaklara yakın tut diyordu; omuzda barla çelişiyordu. İki ID için mevcut `exCues` çözümleyicisine özel talimat eklendi: bar üst sırtta, boyna dayanmadan ve ellerle dengede; kalçadan kontrollü eğilme. Düz bacak varyantında diz kilitlememe belirtilir. Deadlift ve genel hinge cue'su korunur.

## Kanıt
- RED: gerçek boot/detail testi eski metinde `goodmorning shoulder bar must not receive hand-held load cue` assertion'ıyla exit 1.
- GREEN: `gym-stance-cues.test.js` 10 PASS; iki good morning detay/rehberli kontrolü ve deadlift fallback dahil önceki duruş/prototype korumaları.
- Gerçek Chrome tam E2E: 30/30 PASS, 360/412 px. İki ID detay/rehberli modunda omuz barı metni ve detayda eski yanlış metnin yokluğu; deadlift eski doğru cue'sunu korur.
- Tam No-Coach runner: 93 dosya / 2312 PASS / 0 hata; 8 Coach-only skip, 18 mixed scoped.
- Android copy/patch/sync: 28 Java / 44 resource / 115 web asset. Katalog --check: 332 runtime / 332 review / yeni 0; exit 0.

Yalnız iki ID'nin cue'su değişti; template/geometri, veri/ID, antrenman geçmişi ve genel hinge talimatı değişmedi. Bu, hareket figürlerinin veya klinik uygunluğun onayı değildir. `seatedgm` oturarak varyantının sahne ve cue kusurları bu küçük düzeltmeye dahil değildir; açık kalır. `heeltoe`, `sidestep` ve diğer dış katalog figür/cue kusurları açık. Bağımsız denetim bekleniyor. CI/emülatör/fiziksel cihaz/klinik onay yok.
