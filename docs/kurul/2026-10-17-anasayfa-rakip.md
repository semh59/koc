# Ana ekran rakip araştırması ve iki öneri (2026-10-17)

Kapsam: web araştırması + `docs/design-language.md` + `www/main/03-screens.js` `viewToday` (yalnız yapı). Kod değiştirilmedi. Her hücrede kaynak yılı yazılı; kaynak bulunamayan yer "bulunamadı" yazıldı, bellekten doldurulmadı. Hiçbir kaynak kaydırma uzunluğu vermiyor: sütun her satırda "bilinmiyor".

## 1. Rakip tablosu

| Uygulama | İlk ekran blokları | Kaydırma | Hızlı eylem | İlaç / yapılacak |
|---|---|---|---|---|
| Yazio | Günlük (Diary): tüketilen, kalan, yakılan kalori; su, aktivite, kilo günlükte (yardım sayfası, 2026 incelemeleri). Blok sırası bilinmiyor. Alt bölümler: Günlük, Tarifler, Oruç, Analiz, Profil | bilinmiyor | Arama çubuğu ve barkod (inceleme). Düğme biçimi bilinmiyor | İlaç yok (kaynakta geçmiyor) |
| Samsung Health | Home sekmesi: izleyiciler (tracker) kategorilere ayrılmış; "Favorite" kategorisi ilk, adım sayacı Favorite'in en üstünde ve kaldırılamaz (Samsung ABD destek, ANS10001351). Listede Food, Medications, Water, Sleep... var | bilinmiyor | Bulunamadı. Düzenleme: aşağı kaydır > "Edit home", kategori sırası ve içerik değiştirilir | İlaç ayrı bir izleyici kutusu (Medications); Home'da kart mı satır mı bilinmiyor. Öneri kartlarla dolduğuna dair kullanıcı şikâyetleri (topluluk, 2024) |
| Fitbit / Google Health | 2023: üstte 4 ana istatistik (özelleştirilebilir), altında 5 grup (Etkinlik, Sağlık, Beslenme, Uyku, Stres) (9to5google 2023). 2026: Today üstünde kaydırılır karusel, 4 alt sekme: Today, Fitness, Sleep, Health (Google destek 2026; basın) | bilinmiyor. Nitel not: 2026'da "uzun kart akışından" karusele geçildi, Koç metni ekranı bastı (Android Authority 2026, aramadan; sayfa açılamadı) | FAB: "Track a session" ve "Log an entry" (etkinlik, kilo, su) paneli (9to5google 2023) | Kaynak bulunamadı |
| Apple Fitness / Sağlık | Fitness Özet (iOS 17, 2023): halkalar, adım/mesafe, Geçmiş, Antrenör ipuçları, Trendler, Ödüller. Sağlık Özet: Sabitlenenler (iOS 18), Öne çıkanlar; "Düzenle" ile seçilir (üçüncü taraf kılavuzlar) | bilinmiyor | Bulunamadı | Kaynak bulunamadı |
| Medisafe | 2021 incelemesi (Android 11): üstte takvim (bugün işaretli), ortada o günün dozları, altta 4 ikon (Ana sayfa, Güncellemeler, İlaçlar, Daha fazla). Açılışta vakti gelen hatırlatmalar ortada (techenhancedlife, eski sürüm). Yardım merkezinde "Timeline" ana ekran stili geçiyor | bilinmiyor | Android: pembe "+" (Doz, ilaç, sağlık takibi ekle); iOS: sağ üstte "+" (orientatech, 2021) | Ana ekranın merkezi: günün dozları, dokununca eylem. Ayrı sekme yok, ana sayfa doz listesi |
| MyTherapy | Bulunamadı (mağaza metinleri ekranı anlatmıyor). Bilinen: ilaç, ölçüm, belirti hatırlatmaları tek "günlük rapor"da (healthify.nz) | bilinmiyor | Bildirimden "Alındı, atla, 30 dk ertele" | Günlük raporda birleşik liste (düzen ayrıntısı bilinmiyor). Parkinson's UK paneli (55-76 yaş) kurulumu "kolay" buldu, ana ekranı değerlendirmedi |
| MyFitnessPal | 2025: günlüğü öne alan "Today" sekmesi denemesi (topluluk duyurusu). 2023: Premium'a özel düzenlenebilir pano, "edit" ile 16 besin hedefi kartı (athletechnews). Blok sırası bulunamadı | bilinmiyor | Bulunamadı | Bulunamadı |
| Cronometer | Kaynak yalnız forum: yeni Home panosu varsayılan açılış, günlüğe gitmek için ek dokunuş gerekiyor; eski günlük ekranı "dağınık" bulunmuş (forum, 2021 ve sonrası) | bilinmiyor | Bulunamadı | Bulunamadı |
| Lifesum | Günlükte su bardak simgeleri; altta "+" (öğün seçtirir) (yardım sayfaları). Ana ekran blokları bulunamadı | bilinmiyor | Altta "+" düğmesi | Bulunamadı |
| Noom | Bulunamadı. Yalnız "günlük kontrol listesi" ifadesi (blog) | bilinmiyor | Bulunamadı | Bulunamadı |

Yaşlı dostu ilke: hiçbir uygulamanın kendi sayfasında açık yaşlı ilkesi bulunamadı. Tersi kanıt var: Medisafe'de metin boyutu ve kontrast ayarı yok, TalkBack'te "+" düğmesi tıklanamadı, bazı düğmeler etiketsiz (orientatech, 2021).

## 2. Kanıtlı ortak kalıplar

1. **Özet ve ayrıntı farklı yerde.** Google Health 4 sekme, Samsung kategoriler, Apple Özet ve Paylaşım, Yazio 6 bölüm: ana ekran özet, ayrıntı ayrı sekmede.
2. **Ana ekranı kullanıcı sadeleştirebiliyor.** Fitbit "Customize", Samsung "Edit home", Apple "Düzenle", MyFitnessPal "edit", Google Health 5.02 ve sonrası. Beş uygulamada aynı kalıp. Varsayılan ekran sade değil: Samsung'da öneri kalabalığı, Google Health'te Koç metni şikâyet konusu ve Google 5.06'da "Koç içgörüsü yok" seçeneğini ekledi (Droid Life, Android Authority 2026).
3. **Sık eylem ana ekranın ikinci dokunuşu değil.** Fitbit FAB paneli, Lifesum "+", Medisafe "+". Cronometer forumu tersini gösteriyor: panoyu açılışa koymak günlüğe girmeyi uzattı ve kullanıcılar başlangıç sekmesini seçmek istedi.
4. **İlaç uygulamalarında günün dozları ana ekranın merkezi.** Medisafe (2021) ve gelen hatırlatmanın açılışta öne çıkması; Samsung ise ilacı bir izleyici kutusuna indiriyor. İlaç ana ekranı olan uygulamada "yapılacaklar" özetlenmiyor, liste kalıyor (Medisafe). Samsung/Fitbit için ilaç satırının davranışı bulunamadı.
5. **Büyük yazı ve etiket desteği uygulama düzeyinde zayıf** (Medisafe örneği). Genel yaşlı rehberi kaynakları:
   - Doğrulandı: WCAG 2.5.8, AA, hedef en az 24x24 CSS px (W3C).
   - Doğrulandı: PMC10557006 (2023 sistematik inceleme, 60+ kullanıcı testleri): "Simplify the navigation, reduce the number of alternative paths", "Maintain focus on the current action", "Reduce the number of available elements and options in the screen", "Every element placed on a screen needs to have a clear purpose and be relevant to most users".
   - NN/g yaşlı sayfası (açıldı) yalnız küçük hedef, hata mesajı sadeliği, giriş esnekliği söylüyor; gezinme ve kaydırma hakkında bir şey demiyor, "özet + yönlendirme" kalıbı NN/g'ye atfedilmiyor.
   - Doğrulanamadı: Apple HIG 44 pt, Material 48 dp, WCAG 2.5.5 44 px (sayfa gövdesi gelmedi ya da 404). NeoWell zaten `--hit` 48 px kullanıyor, bu rakamlar bu rapora bağlı değil.

## 3. NeoWell farkları

- NeoWell ana ekranı tek uzun sayfa: sıra (viewToday, 03-screens.js:131) halkalar, hızlı ekleme, yapılacaklar, alışkanlık, kilo, kayıt listesi; saati gelmiş doz varsa yapılacaklar en üste çıkıyor (todoTopLock, Kurul 16 Ekim kararı 1). Tipik gün 3,8 ekran (360 px, sizin verdiğiniz sayı, ben ölçmedim).
- Rakiplerde ana ekran özet, günün tam kayıt listesi ayrı yerde (Yazio'da günlük ana ekranın kendisi, Medisafe'de doz listesi). NeoWell kayıt listesini ana ekranın sonuna koyuyor ve bu liste gün boyu uzuyor.
- İlaçlar rakiplerde ya ana listenin merkezi (Medisafe) ya ayrı kutu (Samsung). NeoWell'de ilaç, kurulum ve izin uyarılarıyla aynı kartta; "yapılacaklar" bu yüzden yaklaşık 1,5 ekran.
- NeoWell'in rakiplerde bulunamayan güçlü yanı: Konfor modu (büyük yazı, 52 px hedef), 48 px hedef kuralı, kart içi `details.acc` ile katlama. Yaşlı için ana ekran sadeliği ise rakip kanıtıyla değil PMC incelemesiyle desteklenir.
- Kanıtın söylemediği: "en çok 1,5 ekran" kuralı hiçbir kaynakta yok. Bu bir hedef, kanıtlı eşik değil.

## 4. Kodda şimdi yapılabilir iki öneri

Ortak kısıt (karar Semih'te): vakti gelmiş ya da gecikmiş doz, "Aldım/Atla", "Şimdi aldım" (gerektiğinde) ve "ikiye katlama" uyarısı ana ekranda kalır. Gerekçe: Medisafe ana ekranı doz listesi, Kurul 16 Ekim kararı 1 (360x640'ta "Aldım" y≈958, alt menü y≈551) ve app.test.js:2316-2320. Her iki öneride de ilaç satırı katlanmaz. Tek istisna A'da: vakti gelmemiş sonraki dozlar tek satıra iner, bu design-language ve 03-screens.js:117'deki "ilaç ve ölçüm işleri asla katlanmaz" kuralını bilerek değiştirir.

Ekran sayıları tahmindir, ölçülmedi. Kaynak: Kurul ölçümleri ve sizin 3,8 / 1,5 sayılarınız.

### Öneri A: özet + hızlı yönlendirme (hedef: ≤1,5 ekran, tahmin)

```
┌ Üst çubuk ───────────────┐
│ [vakti gelen doz satırları] │  <- yalnız Gecikti/şimdi; Aldım · Atla
│ ┌ Halkalar ─────────────┐ │
│ │ kalori   su  spor     │ │
│ └ Ayrıntı ▸ ────────────┘ │
│ [ + Yemek ekle ]          │
│ Su+  İçecek  Kilo Spor ...│  <- çipler (aynı)
│ ┌ Özet satırları ───────┐ │
│ │ İlaç: sonraki 14:00  › │ │ -> İlaçlar
│ │ Kilo 83,6 kg         › │ │ -> Trend (zaten stepcard)
│ │ Bugün: 5 kayıt       › │ │ -> Geçmiş/gün ekranı
│ │ 2 iş daha            › │ │ -> açılır (acc)
│ └───────────────────────┘ │
└ Alt menü ────────────────┘
```

Değişenler (A):
- Yapılacaklar kartı yalnız vakti gelen/gecikmiş doz, çalışan yürüyüş/oruç, kayıt-hata uyarılarını gösterir; geri kalan satırlar (kurulum, izin, yedek, ileri saatli dozlar) tek "N iş daha" `details.acc` satırında. Kod: `vis` hesabı (03-screens.js:127) ve medui.js `medTodo`; sonraki dozun tek satırı yeni.
- Günün kayıt listesi ana ekrandan çıkar, "Bugün: N kayıt ›" navRow ile gün ekranına gider (veya son 3 kayıt kalır). Bugün'ün kayıt silme/geri alma/düzenleme işi gün ekranında da çalışmalı: kontrol edilmedi.
- Alışkanlık, Rehber (`gTodayCard`) ve ölçüm kartları tek "Diğer" satırlarına iner.
- Yatayda (800x360) iki sütun düzeni korunur: sol halkalar, sağ yapılacaklar (access.spec.js:179-184).

Çakışan kasıtlı testler (arama sonucu; gerçek koşu yapılmadı):
- app.test.js:2289 ("ilk 3 öğe görünür, geri kalan `iş daha`"; `.todo>.row` sayısı 3, özet "1 iş daha") bozulur; ilaç satırı sayısı da değişir.
- app.test.js:2288 (ilaç, oruç, ölçüm tek `.todo` kartında), :2263, :2338.
- app.test.js:2314 ("özet, kayıt, yapılacak, Trend kısayolu" sırası) ve :2322 (`hbt` yapılacaktan sonra): sıra değişirse güncellenir.
- app.test.js:2107 (`tplnew` günün listesinde) ve :2323 (kopyala/şablon `Daha fazla` altında, DOM'da).
- Kayıt listesi taşınırsa e2e: today.spec.js:88-128 (`.log` içeriği), food.spec.js:38-120 (`.log`, `.log li`, silme), gym.spec.js:115 (`.log`) hepsi güncellenir. Bu A'nın en pahalı kalemi.
- meds3.test.js:57,87; medclean.test.js:35,51; medfix4.test.js:20,80-85,106-113 (`.todo` içinde "Şimdi aldım", CSV uyarısı): satırlar kartta kaldıkça geçer, katlanırsa bozulur. Bu yüzden ilaç satırları korunur.
- today-quick.test.js:24-59 (`.todo [data-act=...]` kurulum satırları, ilk su, modül seçimi, Hedefini hesapla): kurulum satırları katlanırsa kırılır; e2e onboarding.spec.js:59 aynı. Kurulum satırlarını ilk ekranda tutmak gerekir (veya testi katlamaya uyarlamak).
- today-quick.test.js:9,15 (çip sırası) ve ui-f-today.test.js:8-9 (`.rings` tek, tek "Ayrıntı"): değişmez.
- e2e senior.spec.js: `controls<=45`, `water<=1 tıklama` gibi sınırlar; A bunları iyileştirir, bozmaz. Aynı dosya "pages=" (yükseklik/ekran) satırını zaten günlüğe yazıyor: A'nın etkisi ölçülebilir.
- access.spec.js:159 (`.todo .row>span` genişlik >=100), :181 (yatay: `.rings` ile `.todo` yan yana).

Maliyet (A): 03-screens.js, medui.js (sonraki doz özeti), app.css (özet satırı), design-language.md (:34 ve :117 kuralları), 03-screens.js:117 yorumu; güncellenecek test dosyaları: app.test.js (7+ noktada), today-quick, today.spec, food.spec, gym.spec, onboarding.spec; yeni testler: sonraki doz satırı, özet satırı gezintisi, ilaç satırı hiç katlanmıyor. Risk: kayıt listesi ana ekrandan çıkarsa "ilk su", silme ve geri alma akışı bir dokunuş uzar; Cronometer örneği tam bu şikâyeti gösteriyor. "Yemek ekle" ve çipler ilk ekranda kalmalı.

### Öneri B: küçük değişiklik (hedef: ~2,5 ekran, tahmin)

```
│ [doz satırları, yapılacaklar kartı: DEĞİŞMEZ]
│ Halkalar
│ + Yemek ekle, çipler          <- değişmez
│ Kilo (stepcard)               <- değişmez
│ ┌ Bugünün kayıtları ───────┐
│ │ son 3 kayıt              │
│ │ ▸ Tümü (N)               │   <- details.acc, aynı kayıt satırları
│ └──────────────────────────┘
│ ▸ Diğer (alışkanlık, Rehber)   <- tek acc, kapalı
│ Geçmiş ve takvim ›
```

Değişenler (B):
- İlaç ve yapılacaklar kartına dokunulmaz, güvenlik riski yok.
- Kayıt listesi son 3 satır görünür, kalanı mevcut `details.acc` ile katlanır (keepOpen("tlog") deseni var).
- Alışkanlık satırı ve `gTodayCard` tek katlanır "Diğer" bölümüne (kapalı). Kilo kartı yerinde.

Çakışan testler: kayıt listesi 4+ öğe içeren testler (e2e today.spec.js:88-128, food.spec.js:53-120 "Menemen/Yulaf/Annemin böreği" satırları gün sonuna düşerse `.log li` yine DOM'da kalır ama görünmeyebilir: `toBeVisible/click` kullanan yerler kırılır; `toContainText` geçer). app.test.js:2322 (`hbt`) ve :2314 (sıra) için `Diğer` katlanınca `hbt` DOM'da kalırsa geçer. Diğer ilaç, kurulum ve çip testleri değişmez.

Maliyet (B): 03-screens.js (dayLogHtml çıktısı ve `todoCard` sonrası bloklar), app.css'e gerekmez (`details.acc` var), design-language.md'ye 1 cümle; 3-4 test güncellemesi, 2 yeni test (son 3 satır, "Diğer" kapalı). Tahmini kazanç tipik günde kayıt sayısına bağlı: sayısı az günde ≈0, çok kayıtlı günde büyük.

### Öneri

B'den başlamak: ilaç akışı ve testleri bozulmaz, sonuç ölçülür (senior.spec "pages=" çıktısı, Kurul'un 360x640 konumları). A'nın ilaç satırı katlama kuralı ve kayıt listesinin ana ekrandan çıkması Semih kararı gerektirir.

Not: "Ayrıntı" ve "iş daha" gibi mevcut katlar korunur. "1,5 ekran" yalnız yapılacaklar kartı ≈1,5 ekranken tek başına ulaşılmaz; A bunu ancak kartı vakti gelen satırlara indirerek sağlar.

## Kaynaklar

- https://9to5google.com/2023/09/19/fitbit-app-redesign-rolling-out/ (Fitbit 2023)
- https://support.google.com/googlehealth/answer/17068213 (Google Health 4 sekme)
- https://www.androidauthority.com/i-used-new-google-health-app-for-week-and-hate-it-3670318/ (yalnız arama özeti, sayfa 403)
- https://www.samsung.com/us/support/answer/ANS10001351/ (Samsung Health Home)
- https://us.community.samsung.com/t5/Suggestions/Would-like-an-option-to-remove-the-new-insight-and-interest/m-p/3069065 (kullanıcı şikâyeti, arama özeti)
- https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app (yalnız arama özeti, sayfa 403), https://www.darwin-nutrition.fr/en/brand-tests/yazio-review/
- https://www.orientatech.es/en/?p=7936 (Medisafe 2021), https://www.techenhancedlife.com/citizen-research/how-use-medisafe-app, https://help-center.medisafe.com/en/articles/8097988-how-can-i-change-my-home-screen-style
- https://healthify.nz/mytherapy-meds-pill-reminder-app, https://techguide.parkinsons.org.uk/catalogue/my-therapy/review
- https://forums.cronometer.com/discussion/comment/18439, https://forums.cronometer.com/discussion/4280/clearer-main-page-of-diary
- https://help.lifesum.com/en/article/how-to-track-your-water-intake-with-lifesum-ios-77uljh/
- Apple Fitness/Sağlık: https://9to5mac.com/2023/09/27/iphone-fitness-app-whats-new-ios-17/ , https://www.igeeksblog.com/how-to-use-health-app-on-iphone/ (üçüncü taraf)
- https://athletechnews.com/myfitnesspal-adds-feature-for-personalized-nutrition-tracking/ (MFP 2023, arama özeti)
- https://pmc.ncbi.nlm.nih.gov/articles/PMC10557006/ (Gomez-Hernandez ve ark., 2023)
- https://www.nngroup.com/articles/usability-for-senior-citizens/
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Yerel: docs/design-language.md, www/main/03-screens.js:40-132, docs/kurul/2026-10-16-bugun-karar-turu.md
