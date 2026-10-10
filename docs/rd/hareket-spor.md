# Ar-Ge: hareket-spor (gym, motion, adım, kardiyo, Health Connect adımları)

Erişim tarihi (tüm dış kaynaklar): 2026-10-10. Tırnak içindeki metin yalnız araç çıktısının kendisinin tırnakladığı cümledir; tırnaksız olanlar özettir. Not: WebFetch küçük bir model özeti döndürür, sayfanın ham metni değildir.

## 1. Kapsam ve baktığım rakipler

Kaynak katmanları: **[A]** sayfa açıldı ve içerik görüldü. **[B]** yalnız arama sonucu özeti (sayfa açılamadı); bu katman bir önerinin dayanağı olmaz, yalnız "yeni değil" demek için kullanıldı.

| Uygulama | Katman | Baktığım sayfa |
|---|---|---|
| Hevy | A | hevyapp.com/features/ ; hevyapp.com/features/workout-plan-generator/ (Hevy Trainer) |
| Strong | A | strong.app |
| Fitbod | A (ana sayfa) / B (yardım) | fitbod.me ; help.fitbod.me "Injuries and Limitations" (403, yalnız arama özeti) |
| JEFIT | A | jefit.com |
| Gentler Streak | A | gentlerstories.com/gentlerstreak/ |
| Strava | A | support.strava.com/en-us/articles/15401767-perceived-exertion |
| Nike Run Club | A | nike.com/nrc-app |
| Samsung Health | A (otomatik antrenman algılama) / B (Energy score) | samsung.com/us/support/answer/ANS10003306/ |
| Google Fit | A | support.google.com/fit/answer/7619539 |
| Garmin Connect / saat kılavuzu | A (Training Readiness) / B (Intensity Minutes) | www8.garmin.com/manuals/webhelp/GUID-C001C335-.../GUID-C21BE0C8-... |
| Fitbit / Google Health | B | support.google.com/fitbit/answer/14236509 (Active Zone Minutes) |
| Zing Coach | DOĞRULANAMADI | partner.zing.coach yalnız başlık verdi; Play sayfası kesik geldi |

Sürüm: hiçbir uygulamanın sürüm numarası alınamadı (Play sayfaları kesik/engelli geldi, web sayfaları sürüm vermiyor); yalnız erişim tarihi 2026-10-10 kayıtlıdır.
| Aralıklı yürüyüş uygulamaları (IWT, IntervalWalk Pro, Aruki, Japanese Walking) | B | Play arama sonuçları |

Birinci elden bilimsel/resmi kaynaklar (açıldı): Tudor-Locke ve ark. CADENCE-Adults 41-60 yaş (PMC7654058); WHO 2020 kılavuzu (Bull ve ark., Br J Sports Med 2020, PMC7719906, Tablo 4); Helms ve ark. RPE/RIR uygulaması (PMC4961270); Foster ve ark. 2001 oturum RPE'si (Europe PMC kaydı, PMID 11708692); Murphy ve Koehler 2022 (Europe PMC, DOI 10.1111/sms.14075); Nemoto ve ark. 2007 (Europe PMC, DOI 10.4065/82.7.803); Google Play Health Connect izin politikası (support.google.com/googleplay/android-developer/answer/12991134) ve Play geliştirici politikası Health Connect bölümü (answer/9888170).

Not: `docs/competition-exercise.md` (2 Ekim) eskidir; "geride olduğumuz yerler" listesindeki RPE, süperset, drop set, şablon editörü, CSV içe aktarma, hazır program, kas haritası, rehberli mod, dinlenme bildirimi artık kodda var (aşağıda). O belgeden hiçbir rakip iddiası alınmadı.

## 2. Bizim mevcut durumumuz (kodda doğrulandı)

**gym (antrenman, şablon, kütüphane, harita, rehber):**
- Set kaydı, ısınma/normal/drop/başarısızlık set türü, süperset: `www/modules/gym/gym.js:21-30`. İsteğe bağlı RPE (6-10, 0,5 adım) saklanır: `gym.js:98`, girişi `gym.js:739-741`, ayar anahtarı `rpeOn` (`www/main/06-events.js:51`), sütun `gym.js:307`.
- İlerleme önerisi: `Algo.nextTarget` çift ilerleme, 2 seans altında %10 düşürme, 3 seansta 1TM düzelmezse deload notu: `www/kernel/algo.js:280-300`. Çağrı yeri `gym.js:144`.
- Rekor/1TM (Epley): `gym.js:168-190`. Plaka ve ısınma hesabı: `algo.js:260-278`, kullanımı `exui.js:175`. Dinlenme bildirimi (id 9002): `gym.js:56`; ekranı açık tut: `gym.js:332-337`.
- Kütüphane 324 egzersiz (`exlib.js:3`, `c` alanı: güç 257, esneme 41, pliyometrik 15, kardiyo 11 sayımı `grep -o '"c":"."'`). Hazır programlar: `programs.js:6-41`. İçe aktarma Strong/Hevy CSV: `importlib.js:2,68`. CSV dışa aktarma: `gym/index.js:3`.
- Kas haritası, haftalık bölge seti, 10-20 set kılavuz aralığı: `musclemap.js:1-56`, `gym.js:191-206`.
- Rehberli antrenman motoru (saf, sesli komut, bildirim): `guidelib.js:1-100`; hazır akışlar `guidelib.js:71-77` (5 dk ısınma, 10 dk esneme, Tabata, HIIT).
- Ağrı: yalnız sabit uyarı metni `gym.js:425` ve not örneği `gym.js:383`; ağrıya göre davranan kod yok.

**motion / adım / kardiyo:**
- Otomatik yürüyüş/koşu aralığı doğrulama ve toplam: `www/modules/motion/motionlib.js:15-52`; kayıt alanları `day,t0,min,k,steps,km,kmh,kcal`. Adım ekranı kartı `motionui.js:66-76`, adım ekranı çizimi `www/main/05-notifications.js:150-158`. GPS yalnız elle başlatılan yürüyüşte, kısa pencere: `motionui.js:78-110`, `docs/smart-gps-design.md`.
- Elle yürüyüş/koşu/bisiklet: `walkui.js:1-75`. Kardiyo girişi (tür, süre, km, tempo, MET): `cardiolib.js:1-46`, `cardioui.js`.
- Health Connect: adım, uyku, nabız (günlük ort./en düşük) yalnız okunur: `assets/android/HealthPlugin.java:10-12,171-226`; gün değeri telefon ile saatin büyüğü: `05-notifications.js:92`.
- Haftalık hedef yalnız dakika: `settings.sportWeek` (`01-core.js:47`), rapor `www/modules/insights/weeklylib.js:45-46`.

**Yapılan aramalar ("yok" iddiaları):**
- `grep -n "rpe" www/kernel/algo.js` -> 0 satır; `grep -rn "nextTarget(" www` -> tek çağrı `gym.js:144`, RPE ve tarih geçmiyor: öneri RPE'yi ve seanslar arası günü bilmiyor.
- `grep -rn -i "güç gün\|strengthDays\|kuvvet gün" www` -> 0 sonuç: haftalık kuvvet günü sayacı yok.
- Egzersiz adlarında `denge|tek ayak|balance|stand` taraması: yalnız "Sandalye squat" ve tek bacak güç hareketleri; denge odaklı hareket/akış yok (`exlib.js`, `guidelib.js:71-77`).
- `grep -n -i "ağrı\|rahats\|pain\|injur" www/modules/gym/*.js` -> yalnız `gym.js:383,425,426` ve `guideui.js:85` (sabit metin).
- `grep -n "Gym\|gym\|workout" www/modules/insights/*.js` -> yalnız `weeklylib.js` spor dakikası; kuvvet/1TM ile kilo trendi ya da kalori arasında bağ yok.

## 3. Boşluk tablosu

| Özellik | Rakipte durum | Bizde | Fark |
|---|---|---|---|
| RPE kaydı | Hevy: ayar olarak açılır, rutin hedefi yok (B, Hevy yardım). Strong: "Dark Mode, RPE, Advanced Charts" listede (A). Fitbod: ana sayfada RPE geçmiyor (A). JEFIT: geçmiyor (A) | var (`gym.js:98`) | eşit |
| RPE'nin ilerleme önerisini değiştirmesi | Hevy Trainer: ağırlığı "automatically adjusts your working weights", artış için "You must hit the upper end of the rep range with a specific weight on all prescribed sets"; sayfa RPE'nin kullanılıp kullanılmadığını söylemiyor (A). Strong/JEFIT/Fitbod sayfalarında görülmedi | yok (`algo.js:283-300`) | **kapatılabilir; incelenen 4 sayfada görülmedi** |
| Uzun aradan sonra yük önerisi | Hevy Trainer, Fitbod, Strong, JEFIT sayfalarında ara-sonrası kuralı görülmedi | yok (`gym.js:143-144` tarih geçirmiyor) | kapatılabilir, güvenlik |
| Haftalık aerobik dakika hedefi | Google Fit: "One minute of brisk walking (100 steps or more per minute) = One Heart Point" (A) ve AHA 150 dk atfı. Garmin Intensity Minutes: HR yoksa adım/dk (B). Fitbit AZM 150 dk (B) | yalnız toplam dk (`weeklylib.js:46`) | rakipte var; yeni değil |
| Haftalık kuvvet günü + aerobik dakika tek kartta | Hevy: haftalık set/kas grubu ve seri; kuvvet günü hedefi araması sonuç vermedi (B). Strong, Fitbod, JEFIT, Strava, NRC sayfalarında görülmedi (A) | yok | incelenen 8 sayfada görülmedi; "hiçbir rakipte yok" denemez |
| Denge/işlevsel güç akışı (65+) | NRC, Hevy, Strong, Fitbod, JEFIT sayfalarında görülmedi (A) | yok | incelenen sayfalarda görülmedi |
| Kas toparlanma görünümü | Fitbod: "uses your training history and recovery to recommend the right muscles for each session" (A); JEFIT: "muscle recovery breakdown" (A) | yok (yalnız haftalık set haritası) | rakipte var; **öneri yapılmadı** (bkz. 5) |
| Sakatlık/kısıt bilgisine göre egzersiz eleme | Hevy Trainer: "Trainer now builds programs that account for injuries", yüksek riskli hareketi değiştirir, "this is not medical advice" (A). Fitbod yardım: kısıt tanımlayınca hareketleri eler (B) | yok | rakipte var, ama Pro/hesap; bizde ücretsiz-yerel olabilir |
| Hazır olma skoru | Garmin: "how ready you are for training each day" (uyku, HRV, akut yük...) (A); Samsung Energy score (B); Gentler Streak "adapts your daily goals to how your body actually feels" (A, yalnız Apple Health) | yok | rakipte var, giyilebilir ister; **öneri yapılmadı** |
| Algılanan yürüyüş/koşunun otomatik kaydı | Samsung: otomatik algılama saatte, en az 10 dk (A). Strava, NRC elle başlatır (NRC sayfası otomatik algılamadan söz etmiyor, A) | var (`motionlib.js`) | önde (telefonla) |
| Kuvvet seviyesi ile kilo/kalori ilişkisi | Hevy/Strong/Fitbod/JEFIT sayfalarında beslenme veya kalori bağı görülmedi (A). Hevy Trainer yalnız vücut ağırlığı ölçümünü başlangıç ağırlığı için kullanıyor (A) | veri aynı yerde, bağ yok | birleşik veri avantajı kullanılmıyor |
| Sesli aralıklı yürüyüş | IWT, IntervalWalk Pro, Aruki: sesli ipucu (B); "Japanese Walking" yorumlarında sessiz uyarı şikâyeti (B) | rehber motoru var, yürüyüş akışı yok (`guidelib.js:71-77`) | rakipte var (ayrı uygulama); yeni değil |

## 4. Öneriler (öncelik sırasıyla)

### 1. RPE'ye duyarlı ilerleme önerisi
- **Ne yapar:** RPE yazdıysan, öneri son setinin zorluğuna bakar: hedef tekrara ulaştın ama "10"a yakın zorlandıysan "aynı ağırlıkta kal", rahat (RPE 7 ve altı) bitirdiysen ağırlığı bir adım artırmayı önerir. RPE yazmadıysan eski kural aynen çalışır.
- **Neden ileride:** Hevy Trainer sayfasında artış yalnızca "upper end of the rep range" kuralına bağlı, RPE kullanımı belirtilmemiş (A). Strong'da RPE yalnız kayıt alanı olarak listeli (A); Fitbod ve JEFIT sayfalarında RPE yok (A). Dayanak: Helms ve ark. (PMC4961270) RIR tabanlı RPE ile yükün ayarlanmasını anlatır; hedef "0-1 RIR" iken "are able to complete sets with more than 1 RIR" ise yük artırılır. Aynı makale yeni başlayanların önce kendi RIR doğruluğunu sınaması gerektiğini söyler.
- **Dayandığı kod:** RPE zaten saklanıyor (`gym.js:98`), `nextTarget` onu hiç görmüyor (`algo.js:283-300`, grep 0), çağrı `gym.js:144`. `Algo.nextTarget` girdisine `rpe` (son çalışma setlerinin en yükseği) eklemek yeterli.
- **Kapsam:** Küçük. Tek saf fonksiyon + `gym.js:144` çağrısına alan geçirmek; arayüze yeni alan yok (RPE sütunu zaten ayara bağlı).
- **Risk:** Doğruluk: RPE tahmini deneyimsizde sapar (makale uyarısı); bu yüzden yalnız "tut" yönünde (yük artırmayı erteleme) kesin davran, "artır" yönünü RPE'yi son 3 seansta düzenli yazanlara bırak. Hukuk: öneri dili korunur ("istersen"), tıbbi iddia yok. 60 yaş: ekranda yeni kontrol yok, aynı "Önerilen" satırına tek ek cümle ("Son set zordu, bu sefer aynı ağırlık").
- **Test:** `algo` birim testleri: (a) RPE yoksa çıktı bugünküyle birebir; (b) üst tekrara ulaşıldı + son set RPE 9,5 -> kg artmaz, `why` metni "aynı ağırlık"; (c) RPE 7 -> mevcut artış; (d) ısınma/drop set RPE'yi etkilemez.

### 2. Uzun aradan sonra "hafif dönüş" önerisi
- **Ne yapar:** Bir egzersizi son yapışından 14 günden uzun süre geçtiyse, öneri satırı eski ağırlığı olduğu gibi dayatmaz; "Uzun ara verdin, ilk sette %10 hafif başlayabilirsin" diye ağırlığı bir seçenek olarak sunar ve tek dokunuşla uygular.
- **Neden ileride:** Hevy Trainer sayfasında ilerleme "stalls" durumunda hatırlatma yapar, ara sonrası kural belirtilmez (A); Strong, Fitbod, JEFIT sayfalarında görülmedi (A). "Hiçbir rakipte yok" denemez (4 sayfa).
- **Dayandığı kod:** `gSuggest` tarihe bakmıyor (`gym.js:141-149`); geçmiş kayıtta gün var (`gHistory` öğesi `.w.day`, kullanım `gym.js:401`). %10 düşürme oranı zaten `algo.js:293`'te kullanılan kural; yeni sayı uydurulmuyor. Eşik (14 gün) bir sezgisel değerdir, kaynaklı değildir; ayarlanabilir sabit olarak yazılmalı.
- **Kapsam:** Küçük. `gSuggest` içinde gün farkı + bir cümle; veri modeli değişmez.
- **Risk:** Doğruluk: 14 gün keyfi eşik, bu yüzden zorlayıcı değil öneri olarak sunulur. Hukuk: tıbbi iddia yok ("hafif başla" genel antrenman dilidir). 60 yaş: tek cümle, mevcut öneri kutusunda.
- **Test:** `gSuggest` testi: son seans 20 gün önce -> `why` "Uzun ara" ve kg %10 düşük; 5 gün önce -> bugünkü çıktı; plaka/dambıl yuvarlaması korunur (`gym.js:145-146`).

### 3. Haftalık hareket kılavuzu kartı: tempolu dakika + kuvvet günü (+ 65 yaş ve üstü için denge günü)
- **Ne yapar:** Bugün/Trend'de tek küçük kart: "Bu hafta tempolu hareket 95 / 150 dk; kuvvet günü 1 / 2". Tempolu dakika kardiyo girişlerinden ve algılanan hızlı yürüyüşten, kuvvet günü yalnız salon antrenmanından gelir (salon süresi tempolu dakikaya eklenmez); yaşın 65 veya üstüyse üçüncü satır "denge ve kuvvet günü 1 / 3" eklenir.
- **Neden ileride (sınırlı):** Aerobik kısım yeni değil: Google Fit adım/dk ile puan veriyor (A), Garmin HR yoksa adım/dk kullanıyor (B). Farkı: rakiplerde aerobik dakika ile kuvvet günü tek yerde görülmedi (Hevy, Strong, Fitbod, JEFIT, Strava, NRC, Samsung, Gentler sayfaları, A) ve bizde hepsi tek yerel veride. Dayanak WHO 2020 (PMC7719906, Tablo 4): yetişkin "at least 150-300 min" orta şiddet aerobik, kas güçlendirme "2 or more days a week", 65+ için "multicomponent ... 3 or more days a week".
- **Dayandığı kod:** Antrenmanlar `S.workouts` (`gym.js:191-196` kalıbı: `gDone`, `gDoneSets`); kardiyo `CardioLib.week` (`cardiolib.js:35-45`); algılanan aralıklar `MotionLib.totals`, kadans `m.steps/m.min` (`motionlib.js:15-30`); yaş `settings.age` (`01-core.js:47`); mevcut hedef `sportWeek` (`01-core.js:47`). Modül sınırı: yeni `www/modules/insights/activitylib.js` (`ActivityLib`, saf; `gym/guidelib.js` ile ad çakışmasın), gym ve motion verisini `Gym.workouts()` ve yeni küçük `Motion.moves()` API'siyle alır (`coach.js:187` aynı kalıp); `boundary.test.js` `S.*` doğrudan erişimi yakalar.
- **Kapsam:** Orta. Sayma kuralları: tempolu dakika = kardiyo girişi (`wid==null` olan `exercise` kayıtları, `gym/index.js:2` aynı süzgeci kullanıyor) + kadansı >=100 olan algılanan aralık; salon antrenmanları (`wid` dolu kayıtlar) tempolu dakikaya girmez, yalnız kuvvet gününe sayılır. Çift sayım: elle yürüyüş `exercise` kaydı ile algılanan `moves` aralığı çakışırsa tek sayılır; yeniden kullanılacak yer `Algo.exerciseKcal` çakışma koruması (`algo.js:224`, `cardiolib.js:3-4`). "Kuvvet günü" eşiği (en az 3 çalışma seti, `gDoneSets`) kaynaksız bir sezgiseldir, ayarlanabilir sabit olmalı. Kadans eşiği: CADENCE-Adults (41-60 yaş) sonucu "Cadences of 100 steps/min and 130 steps/min are appropriate heuristic cadence thresholds" (PMC7654058, A); bu sezgisel bir eşiktir ve 60 yaş üstü için kanıtım yok (arama özeti yaşlılarda değişkenlik bildiriyor, B), kartta "yaklaşık" yazılmalı.
- **Risk: hukuki/Play politikası.** Genel kılavuz karşılaştırması, tanı/tedavi yok; Play Health Connect izin politikası tanı, tedavi önerisi veya klinik izleme yapan uygulamaların tıbbi cihaz kurallarına girebileceğini söylüyor (support.google.com/googleplay/android-developer/answer/12991134, A): kart "genel bilgi, kişisel tavsiye değil" notu taşımalı, "yeterli/yetersiz sağlık" hükmü vermemeli. İzin: yeni izin yok. 60 yaş: en çok iki satır, büyük yazı, ilerleme çubuğu ve sayı birlikte (renk körlüğü, `musclemap.js` kalıbı); yaş girilmemişse 65+ satırı hiç görünmez.
- **Test:** Birim: (a) 30 dk kardiyo girişi + 20 dk 110 adım/dk algılanan yürüyüş + 20 dk 80 adım/dk yürüyüş -> tempolu toplam 50 dk; (b) 2 antrenman günü -> "2/2"; (c) 70 yaş -> üçüncü satır, 50 yaş -> yok; (e) elle yürüyüş kaydı + çakışan algılanan aralık -> tek sayım; salon antrenmanı tempolu dakikayı artırmaz; (d) boş hafta -> kart sadece davet cümlesi. Kabul: kart 2 satırı geçmez.

### 4. Denge ve işlevsel güç içeriği (egzersiz + 10 dk akış)
- **Ne yapar:** Kütüphaneye denge ve günlük hayat gücü hareketleri (tek ayak duruş, topuk-parmak yürüyüşü, sandalyeden kalkma, yan adım) ve rehberli antrenmanda "10 dk denge ve kuvvet" akışı eklenir; sesli komut ve bildirim mevcut motorla gelir.
- **Neden ileride (sınırlı):** NRC, Hevy, Strong, Fitbod, JEFIT sayfalarında denge akışı görülmedi (A); bu bir yokluk kanıtı değil, sayfada yazmama kanıtıdır. Dayanak: WHO 2020 65+ için "varied multicomponent physical activity that emphasises functional balance and strength training" (PMC7719906, Tablo 4, A).
- **Dayandığı kod:** `EXDB` alanları (`exlib.js`), şekil şablonları `figlib.js`/`figtpl.js`, ipuçları `excues.js`; akışlar `guidelib.js:71-77` (`stretch`, `FLOWS`). Yeni kod neredeyse yalnız veri: egzersiz kayıtları + bir `FLOWS` girdisi. Öneri 3'ün 65+ satırıyla birlikte anlam kazanır.
- **Kapsam:** Orta (kod küçük; hareket başına figür/ipucu üretimi emek). Fotoğraf yoksa mevcut çizgi-adam şablonu kullanılabilir.
- **Risk: hukuki/Play politikası** (answer/12991134, A: tanı/tedavi/klinik izleme tıbbi cihaz kuralına girebilir): "düşmeyi önler" gibi iddia yazılmaz, genel bilgi notu eklenir. Güvenlik: denge hareketi düşme riskidir; her hareketin başında "duvar/sandalye yanında yap" notu ve `gPainNote` (`gym.js:425`) şart. 60 yaş: akış tek dokunuşla başlar, hareket başı süre uzun (30-45 sn), yazı >=14 px.
- **Test:** Kütüphane testi: her yeni egzersizin `id`, `n`, `r`, `tp` alanı geçerli ve `GuideLib.phases` bu akışı sorunsuz üretir (`guidelib` mevcut testlerinin kalıbı); `FLOWS` toplam süresi 10 dk +-1.

### 5. Kuvvet ve kilo/kalori için "Bağlantılar" satırı (tanımlayıcı)
- **Ne yapar:** Trend > Bağlantılar'a salon verisi eklenir: "Son 4 haftada kilo trendin -1,1 kg, ana hareketlerde tahmini 1TM değişimi +%2" gibi tek satır. Nedensellik iddiası olmadan yan yana gösterir.
- **Neden ileride:** İncelenen 4 salon uygulamasının sayfasında beslenme/kalori bağı görülmedi (A); bizde kilo trendi, kalori hedefi ve antrenman aynı yerel veride. Dayanak: Murphy ve Koehler 2022 meta-analizi: enerji açığı altında "strength gains" kontrolle "comparable between conditions" (Europe PMC özeti, A); sonuç bölümü yalnız yağsız kütle için "avoid energy deficits" diyor. Yani kuvvet izlemek anlamlı bir göstergedir; satır yalnız değişimi gösterir, nedenini söylemez.
- **Dayandığı kod:** `LinksLib` zaten "descriptive patterns ... Makes no claim of causation" (`linkslib.js:2`), pencere ve asgari çift kuralları `linkslib.js:10`; 1TM `Algo.est1RM` (`gym.js:171-178`); kilo trendi `Algo.trend`. Salon verisi API ile (`Gym.workouts()`).
- **Kapsam:** Orta (1TM'i hareketler arası normalize edip en az 3 ana hareketin ortalamasını almak ve en az seans eşiği koymak gerekir).
- **Risk:** Doğruluk: 1TM tahmini yüksek tekrarda sapar; kayıt sayısı azsa satır gösterilmez. Hukuk: beslenme/kilo hükmü yok; "kalori azalt/artır" tavsiyesi verilmez (Rehber'e bırakılır). 60 yaş: tek cümle, grafik yok.
- **Test:** Birim: 3 seanslı tek hareket -> satır yok; 4 haftada 6+ seans, 3 hareket -> ortalama değişim yüzdesi doğru; kilo verisi yoksa satır yok.

### 6. Egzersiz için "rahatsızlık işareti": ilerleme duraklar, aynı bölgeden alternatif önerilir
- **Ne yapar:** Egzersiz menüsünde tek dokunuşla "Bu hareket rahatsız etti" işareti. İşaretli harekette ağırlık artırma önerisi kapanır, bölgesi aynı ve ekipmanı uyumlu başka hareketler listelenir; 14 gün sonra işaret sorulup silinir.
- **Neden ileride (sınırlı, yeni değil):** Hevy Trainer sakatlığa göre yüksek riskli hareketi değiştirir ve "not medical advice" der (A); Fitbod'da benzeri var (B). İkisi de ücretli/hesaplı; bizde ücretsiz ve cihaz içi olabilir. Burada yenilik değil, boşluk kapatma.
- **Dayandığı kod:** Bugün yalnız sabit metin ve not örneği (`gym.js:383,425`); egzersiz alanları `r` (bölge), `q` (ekipman), `l` seviye (`exlib.js`) alternatif bulmaya yeter; ilerleme kapısı `gSuggest` (`gym.js:141`).
- **Kapsam:** Orta (yeni küçük alan `S.exCfg[id].flag` -> `cleanGym`, geçiş + yedek alanı, öneri filtresi).
- **Risk: hukuki/Play politikası.** Play Health Connect izin politikası, tanı, tedavi önerisi veya klinik izleme yapan özelliklerin tıbbi cihaz kurallarına girebileceğini belirtiyor (support.google.com/googleplay/android-developer/answer/12991134, A). Bu yüzden özellik yalnız egzersiz **eleme/alternatif** yapar; "ne olduğunu" veya "nasıl iyileşirsin"i söylemez, serbest metin ağrı tanımı almaz. 60 yaş: tek buton + net cümle; işaret kaldırma tek dokunuş.
- **Test:** Birim: işaretli hareket için `gSuggest` kg artırmaz; alternatif listesi aynı bölgeden, işaretlinin kendisi hariç; işaret 14 gün sonra düşer; yedekten geri yüklemede korunur.

### 7. Sesli aralıklı yürüyüş akışı, adım/dk doğrulamalı
- **Ne yapar:** Rehberli antrenmanda "Aralıklı yürüyüş" akışı: 3 dk hızlı, 3 dk yavaş, 5 tur. Her hızlı fazın sonunda ortalama adım/dk gösterilir ("hızlı fazda 112 adım/dk").
- **Neden (yeni değil):** Aralıklı yürüyüş için ayrı sesli uygulamalar var (B). Bizim farkımız yeni değil, mevcut motoru ve adım sayacını yeniden kullanmak. Protokol dayanağı: Nemoto ve ark. 2007: 3 dk düşük + 3 dk yüksek yoğunluk, günde 5+ set, haftada 4+ gün (Europe PMC, A); sonuçta diz ekstansiyon kuvveti %13 ve sistolik kan basıncı düşüşü sürekli yürüyüşten fazla bildirilmiş. Sonuçlar sağlık iddiası olarak kullanılmaz.
- **Dayandığı kod:** `GuideLib.FLOWS` ve `rounds()` (`guidelib.js:67-77`); adım sayacı eklentisi `assets/android/StepCounterPlugin.java:20`; algılanan aralık mantığı `motionlib.js`. Adım/dk için faz bitiminde sayaç farkı gerekir (şu an yalnız elle yürüyüş bunu yapıyor, `walkui.js:11-30`).
- **Kapsam:** Küçük (yalnız akış) / orta (adım/dk geri bildirimi; akış ekranı sayaca bağlanır).
- **Risk:** Güvenlik: yürüyüş ekranı bakmadan kullanılabilmeli; sesli komutla yön verilir. Tansiyon vb. sağlık sonucu yazılmaz (Nemoto bulguları klinik iddia olurdu). Konum izni gerekmez (adım sayacı). 60 yaş: 2 buton ("Başla/Durdur"), hız ipuçları sözlü.
- **Test:** `GuideLib.phases(FLOWS.iwt)` toplam 30 dk; faz sınırlarında ipucu metni; adım/dk hesabı: 3 dk, 330 adım -> 110.

## 5. Reddedilen fikirler

- **Kas toparlanma ısı haritası:** Fitbod ve JEFIT'te var (A); bizde giriş verisi (set) de toparlanma ölçmeye yetmez; sahte kesinlik riski.
- **Hazır olma/HRV skoru:** Garmin, Samsung, Gentler Streak'te var (A/B); giyilebilir ve HRV ister, telefon-yerel kapsamımızı aşar; Play politikası klinik izleme/hastalık işareti çıkarımını tıbbi cihaz sınırına yaklaştırır (answer/12991134, A). Reddedildi.
- **Akut/kronik yük oranı (ACWR) ve "sakatlık riski" uyarısı:** Arama özetlerine göre yöntem literatürde tartışmalı (Impellizzeri 2020 eleştirisi, B) ve tıbbi iddia olur. Oturum RPE'si geçerli bir yük ölçüsüdür (Foster ve ark. 2001: "the session RPE method is a valid method of quantitating exercise training", A) ama oranla uyarı vermek reddedildi.
- **Health Connect'ten antrenman/egzersiz oturumu okuma (yeni izin):** Play, "minimum data types" ve her tür için geçerli kullanım şartı koyuyor (answer/12991134, A). Mi Band/saat kullanımı belirsiz (`docs/steps-research.md:42`); önce ihtiyaç doğrulanmalı. Reddedildi (şimdilik).
- **Kamera tabanlı form kontrolü:** Kamera izni, Play beyanı, hata durumunda yanlış yönlendirme riski; reddedildi.
- **Fonksiyonel fitness testi (30 sn sandalyeden kalkma, norm tablosu):** Düşme riski taraması niteliği taşır (tıbbi); CDC kesme değerlerini doğrulayamadım (bkz. 6). Test-yalnızca kendi geçmişiyle karşılaştırma bile Play beyanı gerektirebilir. Reddedildi.
- **Sosyal akış, sıralama, bulut:** Mimari kararla dışarıda (`docs/market/a-motion-sport.md`).
- **Arka plan GPS / rota:** Karar `docs/smart-gps-design.md`; reddedildi.

## 6. DOĞRULANAMADI (öneriye dayanak yapılmadı)

1. Zing Coach: `partner.zing.coach` yalnız başlık döndü; Play sayfası kesik geldi. Hiçbir özellik iddiası yazılmadı.
2. CDC STEADI "30-Second Chair Stand" sayfası/PDF'i okunamadı; norm tablosunu doğrulayamadım, kullanılmadı.
3. Hevy yardım merkezindeki RPE ve zamanlayıcı ayrıntıları yalnız arama özeti (B); Hevy "Health Connect" için sayfa bulunamadı.
4. Fitbod "Injuries and Limitations" ve "Muscle Recovery" yardım sayfaları 403 verdi; yalnız arama özeti (B).
5. Garmin Intensity Minutes, Fitbit Active Zone Minutes, Samsung Energy score: yalnız arama özeti (B).
6. Google Fit uygulamasının kapanma tarihi için resmi kaynak bulunamadı (Fit API için 30 Haziran 2025 tarihi arama özetinde, uygulama için kanıtsız).
7. Strava Relative Effort resmi sayfası açılamadı; yalnız Perceived Exertion sayfası açıldı ve o sayfa güç antrenmanı (ağırlık) hakkında bir şey söylemiyor.
8. 60 yaş üstü için adım/dk eşiği: açılan kaynak (PMC7654058) yalnız 41-60 yaşı kapsıyor; yaşlı eşiği doğrulanamadı.
9. Hevy "Sets Per Muscle Group Per Week" vb. özellik adları yalnız özellik başlığı (sayfada açıklama yok).
10. Hevy, Strong, Fitbod, JEFIT, Strava, NRC için "yokluk" iddiaları yalnız açılan sayfada yazmamaktır; uygulama içinde bulunmadığının kanıtı değil.
