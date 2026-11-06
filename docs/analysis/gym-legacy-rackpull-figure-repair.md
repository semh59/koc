# Eski egzersiz düzeltmeleri — 12: rack pull destekli figür

## Kapsam
Önceki talimat düzeltmesi `9305283` üzerinde tamamlanmıştı; bu adım yalnız `rackpull` için bağımsız şablon ve sabit rack/pin sahnesi ekler. Başlangıçta görünür bar şaftının alt kenarı pinin üst kenarına değer; bar yükselir ve aynı desteğe döner. Plakanın altına çizgi koymak rack teması olarak kabul edilmez. Bar şaftı bileğe bağlıdır; ayak bileği/parmakları sahnede sabit ve zemindedir. Yandan izdüşüm şematik olup derinliği/anatomik çarpışmasızlığı kanıtlamaz.

Açı, mesafe ve yükseklikler çizimin geometrik örneğidir; klinik optimum ya da kişisel rack ayarı değildir. İlk cue mevcut kaldırış–doğrulma–geri bırakma talimatını korur; artık destekleri göstermediği iddiası yerine şematik yükseklik/kişisel ayar uyarısını içerir. Destekli çekiş sırası [sabit upstream Rack_Pulls.json](https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/Rack_Pulls.json) ile tutarlıdır; kaynak tek evrensel pin yüksekliği vermez.

## Veri ve davranış korunumu
- Kaynak batch'te yalnız rackpull runtime.tp `hinge→rackpull`, metadata.figure_template ve cue_ids birlikte güncellendi; katalog yeniden üretildi. ID, diğer antrenman değerleri ve geçmiş değişmedi.
- `GREST_BIG` yeni template'i içerir: eski varsayılan **150 saniye** ve kullanıcıya özel rest korunur. Template değişikliğinin sessizce 75 saniyeye düşürmesi engellendi.
- Katalog/projeksiyon testleri yalnız onaylı rackpull ve önceki seatedgm template değişimini normalize eder; eski bütünlük hash'leri körlemesine değiştirilmedi. Yeni template değeri ayrıca assert edilir.
- Semantic audit/manifest tekrar üretildi; coarse gözlem grubu değişimi benzersiz hareket kabulü değildir: **332 runtime / 332 review / 0 yeni / 0 semanticUnique**.
- HEAD ile **55 mevcut şablon ×65 parts karesi ve SVG** karşılaştırmasında fark yok; yalnız yeni `rackpull` tanımı eklendi. Diğer hinge tüketicileri aynı kalır.

## Test kanıtı
- RED `gym-rackpull.test.js`: gerçek boot→gEx→exDef yolu `rack pull must show real rack pins, not unsupported generic hinge`, exit1.
- GREEN **10 PASS**: 65 karede şaft–pin başlangıç/dönüş teması, yatay örtüşme, yükselişte ayrılma, penetrasyon olmaması, sabit rack/iki ayak, bilek–şaft bağı ve loop. Eksik pin, havada başlangıç, kaldırış yokluğu, kayan ayak/pin, kopuk el, eğik şaft ve pin üstüne taşınmış plaka mutasyonları reddedilir. Şaftın iki ucu sonlu/yatay, genişliği pozitif ve uzunluğu sabit olmalıdır; temas pinin plaka dışındaki iç şaft bölümünde ölçülür. Default/configured rest sınanır.
- Cue **21 PASS**, fig **17 PASS**, katalog/build ve medya bütünlük testleri geçer. Önce yeni şematik açıklamayı bekleyen cue testi eski metinde başarısız oldu; ardından metin güncellendi. Kaldırış/dönüş ve her cue ibaresinin negatif testleri korunur.
- Gerçek Chrome detay+rehberde 65 zaman: pin sabit, şaft görünür, başlangıç/dönüş teması ve yükseliş, sabit yakın ayak. Reduced-motion detay static/0 animate. 360/412px rack odak koşusu **4/4 PASS**.
- Son test değişikliklerinden sonra tam No-Coach runner **97 dosya / 2356 PASS / 0 hata**, 8 skip/18 scoped (`rackpull-repair-full.log`, Hermes scratch).
- Son tam Chrome release E2E **42/42 PASS**, `--workers=1` (`rackpull-repair-e2e.log`). Önceki paralel Chrome kaynak kararlılığı riski kapanmaz.
- Katalog --check ve Android copy/patch/sync exit0: **28 Java / 44 resource / 115 web asset**.

## Açık sınırlar
İlk snapshot `75bbb6ad4f166c8a5b694a318376c12c8608e077` iki bağımsız REJECT aldı: plaka dışındaki iç şaft desteği yoktu; yalnız ilk şaft ucunu ölçen test eğik-şaft mutantını kaçırıyordu. Güçlendirilmiş test eski çizimde `rack pin must support exposed inner shaft outside plate footprint` ile exit1 verdi. Düzeltmede şaft bilekten dış plakaya uzatıldı (31 birim), plaka merkezi bilek+28, pin X112–118 oldu. Pin plaka izdüşümüne girmiyor; E2E iki şaft ucunu ve gerçek stroke genişliklerini ölçüyor, plaka–pin açıklığını tüm örneklerde pozitif ister. Yukarıdaki tam testler bu değişikliklerden sonra tekrarlandı. Final bağımsız yeniden denetim bekleniyor. Sabit pin Y=103.744156, şaft width2 ve pin width2.4 ile motor temas hatası 0.02, yuvarlanmış tarayıcı geometrisi 0.06 toleransla sınanır; tam fizik simülasyonu değildir. El/ayak/sahne ilişki kontrolleri klinik/anatomik doğruluk veya subjektif kalite onayı sayılmaz. Tarayıcı kalıcı E2E yalnız yakın ayağı ölçer, iki ayak kanıtı motor kontrolündedir. CI/APK/emülatör/fiziksel cihaz çalıştırılmadı. Deficit platformu, diğer deadlift varyantları ve tüm katalog içerik incelemesi açık.
