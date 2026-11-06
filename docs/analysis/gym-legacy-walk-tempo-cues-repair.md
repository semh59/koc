# Eski egzersiz düzeltmeleri — 8: hızlı/yavaş yürüyüş talimatları

`fastwalk` ve `slowwalk` aynı `walk` şablonunu ve aynı genel cue'yu kullanıyordu. Mevcut ID çözümleyicisine iki özel talimat eklendi: hızlı kayıtta tempolu fakat koşmadan, yavaş kayıtta yavaş ve rahat yürüyüş. Her ikisinin ilk cue'sunda `Animasyon hız hedefi göstermez.` açıklaması bulunur; ilk cue'yu gösteren rehberli modda da sınır görünür. Genel/custom walk cue'su değişmez.

Bu düzeltme yalnız talimat ayrımıdır. İki SVG'nin ortak 2.6 s döngüsü değiştirilmedi, görsel hız ayrımı veya doğrulanmış kadans sağlanmadı. Sayısal hız, klinik tempo veya yeni canonical hareket iddiası yok. Veri/ID/template/geometri/antrenman geçmişi aynı; katalog 332 runtime / 332 review / 0 yeni kabul.

## Kanıt
- RED: gerçek boot/exSheet testi eski metinde `fastwalk detail needs tempo cue and animation limitation` assertion'ıyla exit 1.
- GREEN: `gym-stance-cues.test.js` 18 PASS; her iki ID detay ve rehberde tempo+açıklama, custom walking fallback ve önceki squat/good morning korumaları. Bağımsız denetimde bulunan zayıf `.length===0` prototype assertion'ı array-tip/içerik kontrolleriyle değiştirildi: `toString`, `constructor`, `__proto__` hem ID hem template lookup için sınanır; her iki own-property guard'ı kaldıran bellek mutasyonları reddedilir.
- Son test değişikliğinden sonra tam No-Coach runner: 94 dosya / 2328 PASS / 0 hata; 8 Coach-only skip, 18 mixed scoped. `walktempo-final-full.log` scratch altında.
- Son test değişikliğinden sonra tam Chrome E2E, aynı release config ile `--workers=1`: 34/34 PASS, 360/412 px (`walktempo-final-e2e.log`). Yeni test iki ID'nin detay ve rehberli metinlerini doğrular.
- Önceki varsayılan paralel E2E denemeleri yeşil değildir: ilkinde 33 PASS/1 açılış hatası, ikincisinde 32 PASS/2 açılış hatası; boş #view/fixtures.js:44, ilkinde ERR_NO_BUFFER_SPACE/Failed to fetch gözlendi. Bu kanıt paralel koşu kararlılığını kapatmaz. Ürün assertion'ları ve timeout'lar gevşetilmedi; tek işçili tam koşu temiz exit 0 verdi.
- Android copy/patch/sync ve final katalog --check exit 0: 28 Java / 44 resource / 115 web asset.

Bağımsız denetim bekleniyor. Paralel tarayıcı açılış kararlılığı artık risk olarak açık. CI/APK/emülatör/fiziksel cihaz veya klinik/subjektif görsel onay yok. `heeltoe`, `sidestep`, squat duruşunun görsel ayrımı ve diğer dış katalog kusurları açık.
