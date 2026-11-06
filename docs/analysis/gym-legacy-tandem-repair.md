# Eski egzersiz düzeltmeleri — 3: tandem duruş

Eski `tandem` ön görünüşte yan yana ayaklar ve oynayan gövde gösteriyordu; cue art arda topuk-parmak temaslı sabit duruş tarif ediyor. Yeni şablon yandan, iki ayak zeminde ve sabit. Simetrik ±5,3794° bacak açısı, 48 birim bacak ve 9 birim ayak uzunluğunda öndeki topuk–arkadaki parmak ucunu buluşturur. Kollar küçük hareket yapar; ayaklar/gövde kaymaz.

- RED: eski şablon `tandem uses side view to show heel-to-toe contact` assertion'ında exit 1.
- GREEN: 49 örnekte art arda ayaklar, <0,1 birim topuk-parmak aralığı, sabit zemin teması; yan yana ayak, oynayan ayak ve ön görünüş mutasyonları reddedilir.
- `gym-legacy-balance.test.js`: önceki tek ayak ve kollar yanda yürüyüş korumaları dahil 11 PASS.
- Gerçek tarayıcı detayında SMIL 0/0,65/1,3/1,95/2,6 sn örneklerinde sabit temas; reduced-motion statik, animate=0. E2E 24/24 PASS, 360/412 px.
- Tam No-Coach release runner: 92 dosya, 2.299 PASS, 0 hata; 8 Coach-only skip, 18 mixed scoped.
- Katalog `--check` ve Android copy/patch/sync: 28 Java, 44 resource, 115 web asset, exit 0.

Yalnız `tandem` figür şablonu değişti; ID, veri, cue ve geçmiş korunur. Biyomekanik veya klinik onay değildir. Katalog 332, canonical review 332, yeni kabul 0. Bağımsız denetim bekleniyor; CI/emülatör/fiziksel cihaz/subjektif görsel onay yok. `heeltoe`, `chairstand`, `sidestep` ve dış katalog kusurları açık.
