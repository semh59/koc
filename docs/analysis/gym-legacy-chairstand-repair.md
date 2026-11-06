# Eski egzersiz düzeltmeleri — 4: sandalyeden kalkış

Eski `chairstand`, `squat` alias'ıydı: sandalye yoktu, kollar öne uzanıyordu. Yeni bağımsız şablon mevcut sabit `seat` sahnesini kullanır. Başlangıçta kalça oturak üzerinde Y=112; kalkışta Y=88. Ayak bilekleri X=104/Y=136 sabit, parmaklar zeminde. İki el göğüs yakınında; sandalyeye tutunma gösterilmez. Yan görünüş ellerin göğüste çapraz olduğunun subjektif onayı değildir.

- RED: eski şablon `chair stand must not alias squat` assertion ile exit 1.
- GREEN: 49 örnek boyunca sabit sandalye, oturuşta kalça-oturak teması, yükselen kalça, sabit iki ayak ve göğse yakın eller. Sandalyesiz/no-rise mutasyonları reddedilir. Önceki korumalar dahil `gym-legacy-balance.test.js` 14 PASS.
- Gerçek tarayıcıda detay SVG SMIL beş zamanda örneklenir; oturuş teması, yükseliş, sabit sandalye/ayak ve reduced-motion doğrulanır. Tam release E2E: 26/26 PASS, 360/412 px.
- Tam release runner: 92 dosya, 2.302 PASS, 0 hata; 8 Coach-only skip, 18 mixed scoped.
- Katalog `--check`, Capacitor copy/patch ve Android sync: 28 Java, 44 resource, 115 web asset, exit 0.

Yalnız `chairstand` şablonu değişti; squat ve önceki onefoot/armswalk/tandem düzeltmeleri, runtime ID/veri/cue/geçmiş korunur. Kanonik onay verilmedi: 332 review, yeni kabul 0. Bağımsız denetim bekleniyor. CI, emülatör, fiziksel cihaz, klinik veya subjektif görsel onay yok. `heeltoe`, `sidestep` ve dış katalog varyant kusurları açık.
