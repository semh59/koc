# Eski egzersiz düzeltmeleri — 7: oturarak good morning

`seatedgm` ayakta `hinge` şablonunu kullanıyordu; sandalye yoktu ve ortak talimat ağırlığı bacaklara yakın tut diyordu. Kayıt şimdi bağımsız `seatedhinge` şablonunu kullanır: sabit oturak, kalça [80,112], ayak bilekleri [104,136], ayak parmakları [113,136]. Gövde 0–40° öne eğilir; bar `bar@sh` ile omuzda kalır. Bu açı görsel gösterim içindir, klinik hareket aralığı önerisi değildir. Oturak arkalıklı mevcut `seat` sahnesidir; klinik ekipman onayı yok.

## Değişiklik sınırı
- Yalnız `seatedgm.tp` hinge → seatedhinge; kaynak metadata `figure_template` ve `cue_ids` aynı anda değişti. ID, isim, antrenman alanları, bar ve kol override'ları korunur. Genel hinge ve diğer 54 şablon değişmedi.
- `seatedhinge` cue'su hem detay hem rehberli modda oturmayı ve omuzdaki barı açıklar. Eski ayakta good morning onarımından ayrı düzeltmedir.
- Katalog ve metadata yeniden derlendi. Semantic audit/manifest yenilendi; gözlemsel grup sayısı 78 → 77, çünkü eski ortak şablon grubu ayrıldı. Bu kanonik tekillik kanıtı değildir: 332 runtime, 332 review, semantic unique 0, yeni kabul 0.
- Eski medya-temizliği bütünlük hash'leri değiştirilmedi: yalnız seatedgm.tp eski hinge değerine normalize edilerek aynı projeksiyon korunur, yeni gerçek tp ayrıca seatedhinge olarak doğrulanır. Diğer alan değişiklikleri hash testini bozar.

## Kanıt
- RED: gerçek boot/exDef eski kayıtta `seated good morning must show actual seat, not standing hinge` assertion'ıyla exit 1.
- GREEN: `gym-seated-goodmorning.test.js` 8 PASS. Gerçek runtime exDef ile 49 örnek: sabit kalça/oturak teması, iki ayak/toe sabitliği, öne eğilen gövde ve omuz barı. Sandalyesiz, kayan kalça, kayan ayak, hareketsiz gövde ve bilekte yük mutasyonları reddedilir. Detay ve rehberli metin, metadata eşleşmesi test edilir.
- Gerçek Chrome: SVG/SMIL 0/.65/1.3/1.95/2.6 s'de kalça teması, sandalye, iki ayak/toe ve omuz yükü; reduced-motion'da static/0 animate. Detay/rehberli metin doğrulandı. Tam release E2E 32/32 PASS, 360/412 px.
- İlk geniş runner eski semantic raporların artık kaynakla eşleşmediğini yakaladı (94 dosyada 1 hata); assertion değiştirilmeden iki rapor kendi writer'larıyla yenilendi. Son runner 94 dosya / 2320 PASS / 0 hata, 8 Coach-only skip, 18 mixed scoped.
- Final katalog --check ve Android byte/envanter sync exit 0: 28 Java / 44 resource / 115 web asset. Loglar repository dışında scratch/seatedgm-full-final.log ve seatedgm-e2e-final.log.

Bağımsız denetim bekleniyor. Yeni APK/CI/emülatör/fiziksel cihaz, subjektif görsel veya klinik onay yok. `heeltoe`, `sidestep`, geniş/dar squat'ın görsel duruş ayrımı ve dış katalogdaki diğer kusurlar açık; tüm katalog düzeltilmiş değildir.
