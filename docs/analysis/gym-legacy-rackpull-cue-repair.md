# Eski egzersiz düzeltmeleri — 11: rack pull talimatı ve görsel sınırı

## Karar / kapsam
Yalnız `EXCUE_BY_ID.rackpull` eklendi. İlk cue yükseltilmiş desteklerden kontrollü kaldırışı, kalça/dizleri açarak doğrulmayı, barı desteklere kontrollü geri bırakmayı ve ortak çizimin destekleri/başlangıç yüksekliğini göstermediğini açıklar. Detay ve yalnız ilk cue'yu gösteren rehber aynı açıklamayı alır. Diğer iki cue kontrollü menteşe/elde yük talimatlarını korur. Sayısal destek yüksekliği, doğrulanmamış açı veya klinik uygunluk uydurulmadı.

**Rack pull figürü düzeltilmedi.** Bu yalnız eksik talimat ve açıklama onarımıdır. Rack geometrisi ve yük–destek teması açık kalır; `defdl` platformu ve diğer varyantlar da tamamlanmış değildir.

## Kusur kanıtı
`rdl`, `deadlift`, `rackpull`, `defdl`: `tp:hinge`, `pr:bar`, override yok, scene yok; ortak çizim parçaları aynı. 49 örnekte plakanın en aşağı sınırı Y=121.1467535656422; ayak Y=136, çizilen zemin Y=138. Bu yüzden çizime “yerden çekiş” denemez. Ortak hinge 18 kaydı etkilediği için template değiştirilmedi. ID/tp/veri/dinlenme/geçmiş korunur; canonical 332 review, yeni kabul 0.

## Doğrulama
- RED: `gym-stance-cues.test.js` eski cue ile `rack pull detail must distinguish raised support from generic hinge figure`, exit1.
- GREEN: cue testi **21 PASS**. Gerçek boot/exSheet/gdStart üzerinden detay+rehber açıklaması; ID override'ını kaldıran ve sınırlama/kaldırış/kalça-diz açılması/geri bırakma cümlelerini tek tek çıkaran bellek negatifleri reddedilir. Deadlift, RDL, deficit ve custom hinge fallback'i değişmedi; önceki prototype guard mutasyonları korunur.
- Son test değişikliğinden sonra tam No-Coach runner: **96 dosya / 2346 PASS / 0 hata**, 8 Coach-only skip, 18 mixed scoped (`rackpull-cue-final-full.log`, Hermes scratch).
- Tam Chrome release E2E **40/40 PASS**, `--workers=1`, 360/412px (`rackpull-cue-final-e2e.log`). Yeni test detay ve rehberde yükseltilmiş destek + çizimin sınırını doğrular. Chrome geçici dizinleri Hermes scratch kullanır. Bu koşu önceki paralel kaynak kararlılığı riskini kapatmaz.
- Katalog `--check` exit0: **332 runtime / 332 review / 0 yeni**. Capacitor copy/patch/sync: **28 Java / 44 resource / 115 web asset**, exit0. Motor/template/katalog verisi değişmedi.

İlk bağımsız denetim `3bedf12439d3b8f47130e28b75b64254b6c20862` snapshot'ını REJECT etti: ilk cue'da kaldırış/geri bırakma yoktu. Güçlendirilmiş test eski metinde `rack pull first cue must include controlled lift, hip/knee extension and return to supports` ile exit1 verdi; ilk cue ve kalıcı negatifler düzeltildikten sonra yukarıdaki tam koşular tekrarlandı. Hareket sırası [sabit upstream Rack_Pulls.json](https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/Rack_Pulls.json) üzerinden doğrulandı; evrensel destek yüksekliği atanmadı. Final bağımsız yeniden denetim bekleniyor. CI/APK/emülatör/fiziksel cihaz/klinik ve subjektif görsel onay yok. Platform/rack sahnesi, varyant form farkları ve katalogdaki diğer somut kusurlar açık.
