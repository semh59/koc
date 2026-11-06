# Eski egzersiz düzeltmeleri — 10: topuk-parmak yürüyüşü

## Kusur ve karar
`heeltoe` kaydının `balwalk` şablonunda iki bacak üst üsteydi; ayak bileklerinin ayrımı 0, topuk–diğer parmak aralığı 9 birimdi. Tek runtime tüketici `heeltoe`; ID/veri/geçmiş değişmedi.

Sabit destek ayağıyla ileri ilerlemeyi aynı dünya koordinatlarında kapalı döngüye zorlamak geri adımlama ya da reset doğurur. Bu nedenle yalnız `balwalk` için `playback:"once"` seçildi: dokuz pozla iki ileri adım, ardından son pozda duruş. `sample()` bu modda yalnız ileri yolu örnekler; bütün SVG `d/cx/cy` kanalları `repeatCount="1" fill="freeze"` kullanır. Diğer şablonların ping-pong döngüsü değişmedi. `samples:32` sekiz faz sınırını içerir.

Kalça Y=90; X=80→98. Başlangıç bilekleri X=75.5/84.5; ilk temas X=93.5/84.5, final X=93.5/102.5. Ayak uzunluğu 9, temas anlarında öndeki topuk arkadaki parmakla buluşur. Her adımda diğer ayak bileği/parmağı dünya koordinatlarında sabit ve Y=136; swing geçiş yüksekliği 8 birim. Bacaklar mevcut bağımsız `feet` IK'siyle çözülür.

İlk cue güvenlik uyarısını korur, görselin iki ileri adım gösterip durduğunu ve görsel yeniden yüklendiğinde başladığını açıklar; antrenman süresini belirlemediğini belirtir. Rehber görseli hazırlık/dinlenmede de oluşturur, faz değişimi veya duraklat/devam sırasında yeniden oluşturabilir. Garanti **SVG eklenmesi başına tek gösterimdir**, oturum başına tek gösterim veya çalışma fazıyla senkron oynatma değildir. Rehber yaşam döngüsü değiştirilmedi.

## Kanıt
- RED: yeni `gym-heeltoe.test.js` eski şablonda `heeltoe must show forward steps once, not reverse walking` assertion'ıyla exit 1. Cue boundary testi eski metinde `heeltoe detail must explain one-shot playback` assertion'ında başarısızdı.
- GREEN: heeltoe 7 PASS; 129 motor pozu, üç topuk-parmak teması, destek bileği/parmağı sabitliği, swing, ileri sıra, kalça18, sonluluk/viewBox/kemik24 ve tüm SVG kanallarında son pozda donma. Altı negatif mutasyon reddedilir.
- `fig.test.js` 17 PASS: genel geometri kontrolleri korunur; yalnız explicit once modunda loop-start yerine son pozun sayısal alanları, feet hedefleri ve oluşan parts karşılaştırılır. Cue testi 19 PASS; detay/rehber açıklaması ve önceki korumalar geçer.
- Gerçek Chrome detay ve rehber: 360/412px, 129 zaman; sabit destek, temaslar, swing ve kalça18. 2.7/5.2/7.8sn'de final korunur; tüm kanallar repeat1/freeze. Reduced-motion detay static/0 animate, tekrar açma başlangıç pozu. Odak 2/2 PASS.
- Son üretim/test değişikliğinden sonra tam No-Coach runner **96 dosya / 2344 PASS / 0 hata**, 8 skip/18 scoped (`heeltoe-full-final.log`). İlk önceki koşu 25 dosyadan sonra kesildi; tamamlanmış sonuç sayılmadı.
- Son tam release E2E **38/38 PASS**, tek worker (`heeltoe-e2e-final-retry.log`). Önceki son koşu **37 PASS/1 Chrome launch hatası** (`Target page, context or browser has been closed`), ürün assertion hatası değildi. Tekrarda Chrome geçici dizinleri Hermes scratch'e yönlendirildi; assertion/timeout değiştirilmedi. Önceki paralel kaynak kararlılığı açık kalır.
- HEAD karşılaştırması: diğer **54 şablonun 129'ar parts karesi ve animated/static/volume+ghost SVG çıktıları aynı**, yalnız balwalk farklı. Katalog --check **332 runtime / 332 review / 0 yeni**. Android copy/patch/sync exit0: **28 Java / 44 resource / 115 web asset**.

## Açık sınırlar
İki bağımsız ön inceleme kusuru ve tek-yön oynatmanın kapsamını değerlendirdi; final snapshot bağımsız denetimi bekleniyor. Yan görünüşte salınan ayağın destek kavalıyla izdüşümsel örtüşmesi olabilir; üç boyutlu çarpışmasızlık, anatomik/klinik veya subjektif kalite onayı verilmez. SMIL eklem interpolasyonu ve 0.1 yuvarlama ara çizimlerde tam sabit kemik uzunluğu sağlamaz. 2.6sn görsel süresi kadans reçetesi değildir. CI/APK/emülatör/fiziksel cihaz doğrulanmadı; dış katalog varyant kusurları açık.
