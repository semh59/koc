# Ar-Ge raporu: saglik takımı (vitals, labs, meds, cycle, pulse, habits, measures, Health Connect)

Erişim tarihi (tüm URL'ler): 2026-10-10. Rakip sayfaları uygulamanın mağaza/resmi sayfasıdır; "sayfada geçmiyor" uygulama içinde olmadığı anlamına gelmez.

## 1. Kapsam ve baktığım rakipler

Sayfasını gerçekten açıp okuduklarım (12): Medisafe (App Store 9.52.2), MyTherapy (App Store 4.8.4), Bearable (bearable.app + Factor Effect sayfası), Daylio (App Store 1.76.0), Sleep Cycle (App Store 6.26.391), Welltory (App Store 4.62.0), OMRON connect (App Store, sürüm 2026.09.03 + Japonya basın bülteni), Clue (App Store 297.0), Flo (App Store 10.8.0), Natural Cycles (naturalcycles.com), BioMap (App Store 1.5.0), NormIQ (App Store 3.2). Resmî dokümanlar: Google Play "Health Content and Services", Android Health Connect veri türleri ve Medical Records sayfaları, Android alarm sayfası. Yalnız arama özeti görebildiklerim (Withings, Cardiogram, Apple Health, Instant Pulse/Azumio, e-Nabız) öneriye dayanak yapılmadı, bkz. bölüm 6.

## 2. Bizim mevcut durumumuz (kanıtlı)

- **vitals:** Tansiyon (1-2 ölçüm, seans, nabız) ve şeker (bağlam) kaydı; yorumlama yok, yalnız kayıt, ortalama, grafik (`www/modules/vitals/vitalslib.js:2-3`). Seans = aynı `sid`'li ölçümler (`vitalslib.js:61-75`); son 7 gün ev ortalaması, sabah/akşam ayrı, 3 günden azsa "yetersiz" (`vitalslib.js:77-82`, `vitalsui.js:140-141`). Hekim PDF'i: tablo + grafik + "yorumlanmamıştır" notu (`vitalslib.js:109-181`). Dikkat: acil kutusu eşikleri var (180/120, 54/400) (`vitalslib.js:13`, `vitalsui.js:74-75`); bu, `docs/roadmap.md:76` ("tansiyon/şeker yorumlanmaz, eşik kaldırıldı") kararıyla çelişiyor (bkz. risk notu, bölüm 4).
- **labs:** PDF/OCR içe aktarma, 45 testlik sözlük, laboratuvarın kendi aralığı (`lablib.js:10-55`, `:128-134`); aralık dışı işareti yalnız raporda yazan aralıkla (`lablib.js:254-259`); test başına seri/grafik, PDF (`lablib.js:261-293`). Tahlil, başka modülün verisiyle (ev şekeri, tansiyon) ilişkilendirilmiyor (arama: `grep -n "VitalsLib\|vitals" www/modules/labs/*.js` sonuçsuz).
- **meds:** Çok saatli program, gün seçimi, program geçmişi (`medlib.js:20-86`), Aldım/Atla kaydı ve alınma saati `at` (`medlib.js:59,102-116`), uyum hesabı tek tanım (`medlib.js:118-141`), stok (`medlib.js:143`, düşük stok uyarısı `medui.js:78`), +10/+20 dk tekrar bildirimi (`medlib.js:147,166-169`), kilit ekranını açan alarm, 10 dk erteleme (`alarmlib.js:5-33`, `alarmui.js:33,75-78`), alarm tanı günlüğü ve sorun listesi, Xiaomi dâhil (`medlib.js:188-234`). Çift doz koruması yok (arama: `grep -rn "az önce\|çift doz\|zaten aldın" www/modules/meds` sonuçsuz).
- **cycle:** Son 6 döngüden ortalama tahmin, takvim yöntemli doğurgan pencere (bilgi amaçlı), yalnız cihazda, Coach'a gitmez (`cyclelib.js:2-3,44-65`). Belirti listesi yalnız kramp, baş ağrısı, "ruh hali" etiketi (`cyclelib.js:6`); ruh hali/uyku ile ilişkilendirme yok.
- **pulse:** Kamera PPG, otokorelasyon, başarısızlıkta teknik ayrıntı (`pulselib.js:2,33-90`); saatten günlük nabız `{day,a,m}` (`pulselib.js:101`).
- **habits:** Gün başına uyku süresi (+kalite 1-5, kaynak `hc`) ve ruh hali 1-5 (`habitlib.js:14-21`). Yatış/kalkış saati saklanmıyor, yalnız süre (`habitlib.js:16`).
- **measures:** Bel/kalça/göğüs/kol/uyluk, bel/boy oranı (`measureui.js:29-37`, `kernel/algo.js:183`).
- **Health Connect:** Yalnız adım, uyku, nabız OKUMA (`assets/android/HealthPlugin.java:38`, `hcui.js:2,36-49`); Android 14+ (`hcui.js:55`); Play izin beyanı bu üç izni listeliyor (`docs/play-permission-declarations.md:26`).
- **Çapraz bağ:** Trend > Bağlantılar yalnız uyku-ruh hali, adım-ruh hali, kalori-kilo (`insights/linkslib.js:18-43`); tansiyon, ilaç uyumu, nabız, tahlil girdi olarak yok (`linksui.js:5`). Haftalık rapor tansiyon/şeker/ilaç uyumunu özet satırı olarak koyuyor ama ilişkilendirmiyor (`insights/weeklylib.js:49-55`). Coach'a tansiyon, şeker, döngü gönderilmiyor; ilaç ve uyku/ruh hali kategori onayıyla gidiyor (`coach/coach.js:168`).

## 3. Boşluk tablosu

| Özellik | Rakipte durum (kaynak) | Bizde | Fark |
|---|---|---|---|
| Hekime özet raporu | Medisafe: "send it to the doctor or nurse as a visual informative PDF" ([App Store](https://apps.apple.com/app/id573916946)). MyTherapy: "clear reports to support better conversations with your doctor" ([App Store](https://apps.apple.com/us/app/mytherapy-medication-reminder/id662170995)). OMRON: premium "detailed premium reports to share with your healthcare provider" ([App Store](https://apps.apple.com/app/id1166317885)). NormIQ: "clean PDF summary of your lab history, formatted for a 15-minute appointment" ([App Store](https://apps.apple.com/app/id6761650352)). | Tansiyon PDF, şeker PDF, tahlil PDF, haftalık PDF ayrı ayrı (`vitalslib.js:157`, `lablib.js:273`, `weeklylib.js:75`) | Tek bir görüşme paketi, soru listesi ve "son görüşmeden beri" farkı yok; rakip sayfalarında da alan başına rapor var (benzer, birleşik paket sayfalarda geçmiyor). |
| Çapraz korelasyon | Bearable: Factor Effect raporu sonuç olarak Mood, semptom, uyku ([destek sayfası](https://bearable.app/support/howto/the-factor-effect-report/)); sayfa tansiyonu sonuç/etken olarak anmıyor; "Correlation reports" abonelikte ([bearable.app](https://bearable.app/): "Subscription ... adds unlimited Goals, custom Experiments, Correlation reports"). Welltory: "find correlations between how you feel and what's going on around you" (v4.46.0, [App Store](https://apps.apple.com/app/welltory-heart-rate-monitor/id1074367771)). Sleep Cycle: "Log sleep notes to understand how caffeine, stress, or exercise affect your rest" ([App Store](https://apps.apple.com/us/app/sleep-cycle-sleep-tracker/id320606217)). Daylio: adlandırılmış korelasyon özelliği sayfada yok ([App Store](https://apps.apple.com/us/app/daylio-journal-mood-tracker/id1194023242)). | Uyku-ruh, adım-ruh, kalori-kilo (`linkslib.js:18-43`) | Tansiyon x uyku x ilaç uyumu x ruh hali tek yerde, ücretsiz ve cihazda: baktığım 12 sayfanın hiçbirinde geçmiyor (kesin "yok" değil: iç ekranlar görülmedi). |
| İlaç alarmı | MyTherapy: "customizable alerts ... with dose confirmation and several snooze options"; Medisafe: "Rx refill reminds you when you need to restock" (yukarıdaki sayfalar). Android: tam ekran niyet izni yalnız arama/alarm çekirdek işlevi için otomatik verilir ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/13392821): "only apps that have calling or alarm functionalities will have this permission enabled by default"). | Kilit ekranı alarmı, tanı günlüğü, stok (`alarmlib.js`, `medlib.js:188-234`) | Çift doz koruması ve hesapsız "yakınıma haber ver" sayfalarda geçmiyor; bizde de yok. |
| Cihazdan tansiyon alma | OMRON connect Japonya: "血圧値・心拍数・体重・体脂肪率・基礎代謝量のデータを連携できるようになります" (Health Connect'e aktarım, 1 Ekim 2024, [bülten](https://kyodonewsprwire.jp/release/202409257000)). Health Connect'te `BloodPressureRecord` ve `BloodGlucoseRecord` var ([veri türleri](https://developer.android.com/health-and-fitness/health-connect/data-types)). | HC'den yalnız adım/uyku/nabız (`HealthPlugin.java:38`); tansiyon elle | Cihaz uygulamalarından gelen ölçüm elle yeniden yazılıyor. |
| Tahlil + ev ölçümü | BioMap: PDF içe aktarma, "Built-in reference ranges show where each value sits" ([App Store](https://apps.apple.com/app/6780337778)); NormIQ: Apple Health senkronu ve "flag clinically relevant drug-lab interactions" (aynı NormIQ sayfası). İkisi de ev şekeri/tansiyonu tahlil yanına koyduğunu söylemiyor. | Tahlil izole (`lablib.js`) | Fark küçük ama tahlilin bağlamı yok. NormIQ'nun ilaç-tahlil etkileşim iddiası tıbbi cihaz riski taşır, reddedildi. |
| Döngü + ruh/uyku | Clue Plus: "deeper analysis, advanced predictions, and personalized insights" ([App Store](https://apps.apple.com/app/id657189652)); Flo Premium: "24/7 virtual Health Assistant" ([App Store](https://apps.apple.com/app/id1038369065)); Flo'nun gizlilik etiketi sağlık verisinin bir kısmının izleme/reklamda kullanıldığını bildiriyor (geliştirici beyanı, aynı sayfa). | Döngü ayrı, cihazda (`cyclelib.js:2`) | Yerel döngü x uyku/ruh hali ilişkisi yok. Gizlilik farkı gerçek ama pazarlama iddiası olarak doğrulanmış sayılmaz. |
| Kamera tansiyon/ölçüm | Welltory: "It cannot measure blood pressure or other vital signs via phone camera or Apple Watch" (Welltory sayfası, "Notice" bölümü). Natural Cycles: "regulated medical device" (kendi sitesi). | Kamera yalnız nabız (`pulselib.js:2`) | Kamerayla tansiyon yapmıyoruz; doğru. |

## 4. Öneriler (öncelik sırasıyla)

Genel güvenlik kuralı hepsi için: çıktı hiçbir zaman eşik, renk, "yüksek/düşük" veya yorum içermez; yalnız kullanıcının kendi ortalamaları yan yana verilir. Play için uygulama açıklamasında "tıbbi cihaz değildir, tanı koymaz, tedavi etmez..." beyanı gerekir ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/16679511): "must include a clear disclaimer in their app description ... 'not a medical device and does not diagnose, treat, cure, or prevent any medical condition.'").

**Risk notu (mevcut kod):** `CRISIS` eşikleri ve "112'yi ara" kutusu (`vitalslib.js:13`, `vitalsui.js:74-75`) ürün kararıyla (`docs/roadmap.md:76`) çelişiyor. FDA'nın revize genel sağlık politikası, "klinik eylemi yönlendiren çıktı" içeren ürünleri kapsam dışı sayıyor (ikincil özet: [Hardian Health](https://www.hardianhealth.com/insights/fda-wearables-guidelines-update-2026), birincil FDA metni okunmadı). Bu bir Play/yasal karar noktasıdır; sahibine bırakılır, öneri değildir.

### Ö1. "Hekim görüşmesi paketi" (tek PDF + sorularım)
- **Ne yapar:** Kullanıcı "Hekime hazırlan" der; son görüşme tarihini seçer, uygulama o tarihten beri tansiyon/şeker ortalamasını, ilaç uyumunu, uyku ve ruh hali ortalamasını ve son tahlilleri (laboratuvarın kendi aralığıyla) tek PDF'e koyar. Kullanıcı "hekime soracaklarım" için en fazla 5 kısa soru yazar, PDF'in ilk sayfasında çıkar.
- **Neden ileride:** Rakipler alan başına rapor veriyor (Medisafe, MyTherapy, OMRON, NormIQ; bölüm 3). Birleşik, "son görüşmeden beri" farklı ve soru listeli paket sayfalarında geçmiyor; hepsi hesap/abonelik veya bulut yedeği içeriyor, bizimki sunucusuz.
- **Dayanak:** `vitalslib.js:112-181` (satır/grafik çizimi), `weeklylib.js:18-72` (çok modüllü özet), `lablib.js:261-293`, `medlib.js:141`, `shareui.js`.
- **Kapsam: orta.** Çizim ve özet parçaları var; yeni olan seçim ekranı, tek sayfa düzeni ve soru alanı. Tahlil sayfası eklenirse sayfalama (`vitalslib.js:120-125`) ortak kullanılmalı.
- **Risk:** Yasal düşük (yorum yok, yalnız kullanıcı verisi); 60 yaş: tek büyük "Hekime hazırlan" düğmesi, varsayılan "son 30 gün", ayrıntı yok. Yanlış veri hekime gidebilir: PDF'te kapsam ve eksik gün sayısı yazılmalı.
- **Test:** (a) 30 günlük örnek veriyle PDF'te tansiyon ortalaması, uyum %, uyku ortalaması `weeklylib`/`vitalslib` çıktılarıyla birebir eşit; (b) veri olmayan modül bölümü "kayıt yok" yazar, boş sayfa çıkmaz; (c) PDF'te hiçbir eşik/renk işareti yok; (d) 5 sorudan fazlası alınmaz.

### Ö2. Bağlantılar'a tansiyon, ilaç uyumu ve nabız ekle (yorumsuz, cihazda)
- **Ne yapar:** Trend > Bağlantılar'da şu tür cümleler çıkar: "7 saatten az uyuduğun gecelerin ertesi sabahı ev tansiyon ortalaman 128/82, uzun uyuduğun gecelerde 124/80" ve "ilaçlarını tam aldığın günlerde ruh halin ortalama 3,9, kaçırdığın günlerde 3,4". Veri azsa hiç çıkmaz.
- **Neden ileride:** Bearable'ın korelasyon raporları abonelikte ve Factor Effect sayfası sonuç olarak Mood/semptom/uyku sayıyor, tansiyonu anmıyor; Daylio'da adlandırılmış korelasyon yok; Welltory ve Sleep Cycle bulut/abonelik tarafında. Ücretsiz, hesapsız, tansiyon+ilaç+uyku+ruh hali birlikte olan örnek bulamadım.
- **Dayanak:** `linkslib.js:12-16` (`split`, `MIN_PAIRS=14`, ortak "neden-sonuç değildir" metni), `linksui.js:5-6`, `vitalslib.js:77-82` (günlük ortalama), `medlib.js:120-141` (gün bazlı uyum), `habitlib.js:14-21`.
- **Kapsam: orta.** `analyze` girdisi genişler (tansiyon günleri, `adherenceDays`); `insights` zaten `vitals` ve `meds` kütüphanesini kullanıyor (`weeklylib.js:5`), yeni sınır ihlali yok. Mantık küçük, ama birim testler çok.
- **Risk:** "İlaç aldığımda tansiyonum düşüyor" okunabilir. Önlem: ilaç-tansiyon cümlesi çıkarılmaz; ilaç uyumu yalnız ruh hali/uyku ile eşlenir, tansiyon yalnız uyku/adım/ruh hali ile. Altına sabit not: "İlacını hekime sormadan değiştirme." 60 yaş: kartta en fazla 3 cümle. Ek karar: tansiyon x ilaç hiç yapılmasın (en güvenli).
- **Test:** (a) 14 çiftten azında cümle yok; (b) iki grup da 4 gün altındaysa cümle yok; (c) elle hesaplanmış 20 günlük veride grup ortalamaları eşit; (d) hiçbir cümlede "yüksek/düşük/normal" yok (regex testi).

### Ö3. Health Connect'ten tansiyon (ve şeker) okuma
- **Ne yapar:** Kullanıcı OMRON gibi bir cihaz uygulamasının Health Connect'e yazdığı tansiyonu NeoWell'de otomatik görür; elle yazmaz. İsteğe bağlı ve kapalı başlar.
- **Neden ileride:** OMRON Japonya uygulaması tansiyonu Health Connect'e aktarıyor ([bülten](https://kyodonewsprwire.jp/release/202409257000)); bizim uygulama bunu bulutsuz okuyup hekim PDF'ine ve Ö2'ye katabilir. Bu yalnız Japonya sürümü için doğrulandı; Türkiye sürümü DOĞRULANAMADI, bu yüzden "kullanıcının cihaz uygulaması yazıyorsa" şartlı.
- **Dayanak:** `HealthPlugin.java:38` (izin listesi), `hcui.js:25-49` (okuma döngüsü, `hcFrom` silinen günleri geri yazmıyor), `vitalslib.js:33,50-59` (`sid` ile tekilleştirme).
- **Kapsam: orta-büyük.** Java tarafı `READ_BLOOD_PRESSURE` kaydı okuma (toplama değil ham kayıt), sid için kayıt kimliği, tekrar eşzamanlamada çift kayıt olmaması.
- **Risk:** Yeni izin ve Play beyanı: Health apps formu her izin için gerekçe ister; `docs/play-permission-declarations.md:26` ve gizlilik politikası güncellenmeli. Medical Records API'si hâlâ deneysel ve Play politikası taslak ([Android](https://developer.android.com/health-and-fitness/health-connect/medical-records): "The Play Policy for Medical Records access is still being developed"), bu yüzden tahlil/ilaç için kullanılmaz, yalnız tansiyon/şeker. Kaynak etiketi ("Health Connect'ten") satırda görünmeli.
- **Test:** Aynı kayıt iki kez eşzamanlanınca tek satır; kullanıcı sildiği gün geri gelmez; izin yokken ekran "izin ver" gösterir ve elle giriş çalışır; örnek HC kaydı sistol/diyastol birimini doğru eşler.

### Ö4. İlaçta çift doz koruması + hesapsız "yakınıma haber ver"
- **Ne yapar:** Aynı ilacı kısa süre önce "aldım" işaretlediysen ikinci kez işaretlerken "Bu ilacı 25 dk önce aldım olarak işaretledin, yine de eklensin mi?" diye sorar. İstenirse alarmda "yakınıma haber ver" ile hazır, ilaç adı içermeyen kısa mesaj Android paylaşım ekranından seçilen kişiye gider.
- **Neden ileride:** MyTherapy ve Medisafe sayfaları hatırlatma, erteleme, yenileme ve aile profili sunuyor; çift doz uyarısı ve hesapsız paylaşım sayfalarında geçmiyor. Medisafe'nin "Medfriend"i uygulama sayfasında geçmiyor (DOĞRULANAMADI, bölüm 6); ikincil bir incelemede karşı tarafın uygulama+hesap+internet gerektirdiği yazıyor.
- **Dayanak:** `medlib.js:59,102-116` (`at` zaten kayıtlı), `alarmui.js:33,75-78`, `@capacitor/share` kurulu (`package.json`, `data/shareui.js`).
- **Kapsam: küçük** (çift doz sorusu) + **küçük-orta** (paylaşım). Yeni izin yok.
- **Risk:** Eşik (kaç dk "çok yakın") bir tıbbi kural gibi görünebilir. Önlem: doz aralığı hesaplama yok; yalnız "son 60 dk içinde aynı ilaç alındı işaretlendi" olgusu. Mesajda ilaç adı ve doz yok. 60 yaş: soru tek cümle, iki büyük düğme.
- **Test:** 60 dk içinde ikinci "aldım"da soru çıkar, "Hayır" kaydı değiştirmez; 61. dakikada çıkmaz; gizli ad modunda mesaj ilaç adı içermez; geri al stoğu doğru geri verir (`medlib.js:107-115` mevcut davranış).

### Ö5. Ölçümün "son dozdan kaç saat sonra" etiketi
- **Ne yapar:** Her tansiyon seansında kısa etiket: "ilaçtan önce" ya da "sabah dozundan 2 sa sonra". Hekim PDF'inde ayrı sütun olur; bunu ölçüm kılavuzu zaten sabah ölçümü için istiyor ("Sabah ölçümü kahvaltı ve ilaçtan önce", `vitalsui.js:54`).
- **Neden ileride:** Baktığım sayfalarda ölçüm-doz zaman etiketi geçmiyor (Medisafe, MyTherapy, OMRON, Bearable sayfaları). Zayıf/az rastlanan; kesin değil.
- **Dayanak:** `medlib.js:59` (`at`), `vitalslib.js:112-118` (rapor satırı), `vitalsui.js:93`.
- **Kapsam: küçük.** Hesap iki zaman damgasının farkı; kayıt şeması değişmez, hesap sonradan yapılır.
- **Risk:** Etiket yorumsuz kalmalı (renk/uyarı yok). Alınma saati girilmemişse (`at` yok) etiket çıkmaz, tahmin yapılmaz.
- **Test:** `at` varsa fark dakikası doğru; `at` yoksa etiket yok; gece yarısını geçen dozda doğru gün eşlenir (`dayForTap`, `medlib.js:178` mantığı).

### Ö6. Tahlilin yanında "o dönemin ev ölçümü" bağlamı
- **Ne yapar:** Tahlil satırında kullanıcı "ev ölçümü" açınca, tahlil tarihinden önceki 30 günün ev şeker ve tansiyon ortalaması yan yana görünür; hiçbiri karşılaştırılıp yorumlanmaz.
- **Neden ileride:** BioMap ve NormIQ aralık işareti ve trend sunuyor, ev ölçümü bağlamı sunmuyor (sayfa metinleri). NormIQ ilaç-tahlil etkileşimi iddia ediyor, biz ediyoruz: o iddia reddedildi (bölüm 5).
- **Dayanak:** `lablib.js:261-272` (seri), `vitalslib.js:85-98` (`gStats`), `vitalslib.js:77-82` (`homeAvg`).
- **Kapsam: küçük.** Yalnız UI'da iki mevcut hesabı çağırır; modül sınırı: `labs` -> `vitals` bağımlılığı, `scripts/boundary.test.js` kuralına göre `insights` üzerinden ya da uyumlu bir köprüyle yapılmalı (bu raporda doğrulanmadı).
- **Risk:** "HbA1c ile şeker uyumlu mu?" gibi bir sonuç çıkarmaya kayma riski; eAG çevirisi yapılmaz.
- **Test:** 30 günde ölçüm yoksa satır çıkmaz; ölçüm varsa ortalama `gStats` ile eşit; metinde karşılaştırma/yorum kelimesi yok.

### Ö7. Döngü evresi x ruh hali/uyku (yalnız cihazda)
- **Ne yapar:** Döngü açıksa "Son 3 dönemde dönem başlamadan önceki 5 günde ruh halin ortalama 3,2, diğer günlerde 3,8" gibi bir cümle gösterir; veri azsa göstermez.
- **Neden ileride:** Clue Plus analizi abonelik; Flo premium asistanı abonelik ve Flo sağlık verisinin bir kısmı reklam/izlemede (geliştirici beyanı). Bizde döngü verisi cihazdan çıkmaz ve Coach'a gitmez (`cyclelib.js:2`).
- **Dayanak:** `cyclelib.js:44-65`, `habitlib.js:18-21`, `linkslib.js:12-16`.
- **Kapsam: orta.** Eklenti yok; döngü modülünün Bağlantılar'a veri vermesi sınır haritasında yeni bağ (`cycle` yalnız `cycleui`'dan okunuyor).
- **Risk:** Doğurganlık/hamilelik çağrışımı: kapsam yalnız ruh hali/uyku, doğurganlık günü kullanılmaz. Natural Cycles gibi "düzenlenmiş tıbbi cihaz" hattına girmemek için yazıda "tahmin değildir" notu. 60 yaş: menopozdaki kullanıcıya gösterilmez (döngü yoksa kart yok).
- **Test:** 3'ten az dönemde cümle yok; döngü kapalıysa kart yok; hiçbir metinde "doğurgan/ovülasyon" yok.

## 5. Reddettiğim fikirler

- **Kamerayla tansiyon/şeker:** FDA özet kaynaklarına göre yeni politika bile doğrulanmamış klinik-benzeri değeri kapsam dışı bırakıyor; birincil FDA metni okunmadı. Welltory kendisi kameradan tansiyon ölçemediğini yazıyor. Reddedildi.
- **İlaç-ilaç/ilaç-tahlil etkileşim uyarısı (Medisafe ABD'de var, NormIQ iddia ediyor):** Tıbbi karar desteği; tıbbi cihaz sınıfına girer ve Play'de kanıt ister ("regulated as a medical device must provide proof of approval, clearance or certification", Play Console Help). Reddedildi.
- **Eşikli renk/"normal aralık" etiketi (Withings, OMRON ESH/AHA aralığı):** ESH/AHA aralığı OMRON sayfasında doğrulanmadı; ürün kararı da yorumsuz (`roadmap.md:76`). Reddedildi.
- **Doğurganlık/doğum kontrol iddiası (Natural Cycles):** FDA "cleared as birth control" sınıfı; bizim `cyclelib.js:3` bilgi amaçlı. Reddedildi.
- **Medical Records (FHIR) ile tahlil/ilaç alma:** API deneysel, Play politikası geliştiriliyor (kaynak Ö3'te). Beklenmeli.
- **Uyku düzenlilik skoru:** Yatış/kalkış saati saklanmıyor (`habitlib.js:16`), şema değişikliği ve "skor" iddiası. Şimdilik reddedildi.
- **Sunucu tabanlı bakıcı/aile senkronu:** Kısıtla çelişiyor (hesap/sunucu yok).

## 6. DOĞRULANAMADI listesi

1. Withings Hy-Result protokolü ve rapor içeriği: yalnız arama özeti, Withings sayfası 403 verdi.
2. Medfriend (Medisafe) ayrıntıları: yalnız ikincil inceleme; App Store sayfası anmıyor.
3. Apple Health ilaç/tahlil özellikleri ve etkileşim uyarısı: Apple destek sayfası yalnız içindekiler listesi verdi.
4. ESH ev tansiyonu protokolü (7 gün, sabah/akşam 2 ölçüm): PMC ve ESC sayfaları açılamadı; öneri bu protokole dayandırılmadı.
5. Cardiogram'ın güncel özellikleri: yalnız 2017 çalışma haberleri.
6. Instant Heart Rate/Azumio güncel uyarı metni: sayfa bulunamadı; Instant Pulse yalnız arama özeti.
7. e-Nabız tahlil PDF indirme: yalnız üçüncü taraf özeti.
8. Türkiye'de yazılımın tıbbi cihaz sayılması (Tıbbi Cihaz Yönetmeliği md. 3 ve TİTCK MDCG 2019-11 Türkçesi): TİTCK PDF'i okunamadı, ikincil özetler; hukuki görüş gerekir. MDCG 2019-11 "yalnız depolama/gösterim" istisnası da ikincil kaynaklardan.
9. OMRON connect Türkiye sürümünün Health Connect desteği: yalnız Japonya bülteni doğrulandı.
10. FDA revize genel sağlık politikasının birincil metni: yalnız hukuk bürosu özetleri.
11. Clue destek sayfasındaki Plus özellik listesi (403): yalnız App Store alıntıları kullanıldı.
12. Natural Cycles için CE/UKCA durumu: sitede anılmıyor.
