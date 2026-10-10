# Bağımsız doğrulama: docs/rd Ar-Ge raporları

Tarih: 2026-10-10. Yöntem: her rapordan rastgele rakip/kaynak iddiası WebFetch ile açıldı; `dosya:satır` iddiaları D:\PROJECT\koc içinde açıldı, "X yok" iddiaları ayrı grep/rg ile sınandı. Raporlardaki beyanlara güvenilmedi. WebFetch küçük bir model özeti döndürür; "doğrulandı" = sayfa özeti alıntıyı/iddiayı doğruladı. e2e testlerini (senior/access) yeniden koşmadım.

## 1. Özet sayılar

| Rapor | Web doğrulanan | Web çürüyen | Web doğrulanamayan | Kod doğrulanan | Kod çürüyen | Kod doğrulanamayan |
|---|---|---|---|---|---|---|
| hareket-spor | 6 | 0 | 0 | 14 | 0 | 0 |
| saglik | 6 | 0 | 1 (NormIQ, HTTP 429) | 12 | 1 (satır kayması) | 0 |
| beslenme | 5 | 1 (tırnak) | 0 | 17 | 0 | 0 |
| rehber-analiz | 5 | 1 (kısmi) | 0 | 17 | 0 | 0 |
| kullanilabilirlik-gizlilik | 7 | 0 | 0 | 17 | 0 | 2 (roadmap:34 kapsamı; e2e sonuçları yeniden koşulmadı) |

Seçilen web iddiaları her raporda en az 6 ve en güçlü iki öneriyi (ilk iki) besleyen kaynakları içerir.

## 2. Çürüyen / düzeltilmesi gereken iddialar

1. beslenme.md, MacroFactor satırı: `"accurate, consistent logging"` tırnak içinde verilmiş; sayfada bu ifade yok. Sayfa (macrofactor.com/macrofactors-algorithms-and-core-philosophy/): "accurately and consistently" ve "The most common systematic food logging error people make is under-counting." Anlam aynı, tırnak birebir değil; ayrıca sayfa yemek kaydı belirsizliğini modellemediğini doğruluyor (öneri 3 dayanağı ayakta).
2. rehber-analiz.md, "Welltory sayfası da kendi skorunun stresi tek başına ölçmediğini söylüyor" (satır: Reddedilen fikirler, HRV/stres): sayfa (welltory.com/stress-and-hrv/) bunu HRV için söylüyor ("HRV does not directly measure stress", "does not by itself measure stress, diagnose any condition"); Welltory'nin kendi stres skoru için ayrı uyarı yok. Reddetme kararı etkilenmez.
3. saglik.md, `medlib.js:59` ("Aldım kaydı ve alınma saati `at`"): satır 59 başka şey (`const o={m,day,slot,st}`); `at` alanı `mark()` içinde, yaklaşık `medlib.js:101-106`. Aynı raporda verilen `102-116` doğru. Bulgu (alınma saati kayıtlı) doğru.
4. saglik.md, `linkslib.js:12-16` için "MIN_PAIRS=14": `MIN_PAIRS` satır 10'da, `split` 12-16'da. Küçük satır kayması.
5. saglik.md, "Risk notu: `CRISIS` eşikleri ve 112 kutusu ürün kararıyla (`roadmap.md:76`) çelişiyor": bkz. bölüm 4. Çelişki var ama rapor "tek istisna" olarak belgelenmiş olduğunu atlamış; "açık çelişki" yerine "belgelenmiş istisna, roadmap metni eksik" demek gerekir.
6. beslenme.md Öneri 1: "mevcut güvenlik freni dini bir orucu sert engelleyebilir; bu modda fren başlatmayı engellemez" tıbbi frenle çelişiyor, bkz. bölüm 4 ve karar tablosu.
7. kullanilabilirlik-gizlilik.md: "İlaç uyumu yalnız haftalık rapora girer (`docs/roadmap.md:34`)": satır 34 yalnız doz pay süresini (B1) anlatıyor, "yalnız haftalık" kısmını doğrulamıyor. DOĞRULANAMADI sayılır.
8. kullanilabilirlik-gizlilik.md, "mySugr: PDF ve Excel yalnız PRO": sayfa PDF/Excel'i PRO seçenekleri olarak listeliyor ama "yalnız PRO" demiyor (çıkarım). CSV'nin Basic'te olması doğru.
9. Kapsam tutarsızlığı: kullanilabilirlik-gizlilik.md giriş bölümü "6 uygulama yeter" diyor, aynı raporun gövdesi 8 sayfa sayıyor; tüm "yok" iddiaları "incelenen sayfalarda" diye yumuşatılmış, bu yeterli.

## 3. Doğrulanan örnekler (özet, kanıtlı)

Hareket-spor: Hevy Trainer sayfası dört alıntıyı da içeriyor ("automatically adjusts your working weights", "You must hit the upper end of the rep range...", "account for injuries", "not medical advice"); sayfa ayrıca RPE kaydını anıyor (rapordaki "RPE'nin öneriyi değiştirmesi söylenmiyor" doğru). Google Fit "One Heart Point" ve AHA 150 dk; WHO Tablo 4 (150-300, 2+ gün, 65+ multicomponent 3+ gün); PMC7654058 kadans eşikleri yalnız 41-60 yaş; Fitbod "training history and recovery" ve RPE yok; JEFIT "muscle recovery breakdown" ve RPE yok. Kod: `algo.js:283-300` nextTarget rpe görmüyor (`grep rpe algo.js` boş), tek çağrı `gym.js:144`, `gym.js:98` rpe saklanıyor, 324 egzersiz sayımı (41+257+11+15) tam tutuyor, `guidelib.js:71-77` akışlar, `algo.js:224`, `gym/index.js:2` süzgeç, `linkslib.js:2`, "güç gün" grep boş.

Saglik: Medisafe "visual informative PDF", MyTherapy "clear reports", Bearable Factor Effect (mood/symptoms/sleep, tansiyon yok), Play 16679511 disclaimer cümlesi, Play 13392821 alarm izni, Medical Records "Play Policy ... still being developed". Kod: `HealthPlugin.java:38` üç izin, `play-permission-declarations.md:26`, `vitalsui.js:54`, `vitalslib.js:77-82`, `linksui.js:5` üç çift, çift doz/`az önce` grep boş, labs->vitals grep boş.

Beslenme: WHO tuz <5 g (2 g sodyum), lif >=25 g (10 yaş üstü; rapor "18 yaş altında göstermez" diyor, ihtiyatlı); YAZIO App Store dört alıntı; Simple iki alıntı; Cronometer "84 other nutrients" ve fasting/Ramazan yok; MFP Premium'da sesli kayıt, barkod/Meal Scan, makro hedef, oruç. Kod: 818 satır, `fb` yok, Ramazan/Speech/glisemik/alerjen grep boş, `RECORD_AUDIO` manifestte yok, `algo.js:71` adaptiveTdee var ve `b-food-nutrition.md:13` bayat (rapor doğru söylüyor), `ocrui.js:77` barkod taşımıyor, `habitlib.js:4,12`, `habitui.js:25`, `loglib.js:74`.

Rehber-analiz: Bearable 3+3 gün ve 1-7 gün etki; Oura "stored in Oura's cloud" ve "view and delete memories"; MacroFactor "purely deterministic", "inherently imprecise", güven aralığı yok; Ada "Class IIa" (Ada Assess, AB MDR) ve AB bulutu; Play AI-Generated Content uygulama içi bildirim şartı (rapor "birebir okunmadı" demişti, doğru çıktı). Kod: `coachlib.js` FLAGS ve kural 1, `coach.js` SHARE/gate, `algo.js:27-31` ols m,b döner, `insightlib.js:20-27` se var (dosya `coach/` altında), `bildir` grep yalnız `coach.js:377`.

Kullanilabilirlik: mySugr CSV/import yok, Simple yerel + Firebase, Medisafe 1 yıl, Android 7-10 mm, FHIR LOINC 85354-9, Daylio PDF cümlesi, Play "collect" tanımı. Kod: onboarding'de restore yok, `LOCK_GRACE=30000`, `backupui.js:45` uyarı, `app.css:17` 14 px, `Data.csv.push` toplam 9, ağ çağrısı 3 yer (`04-sheets.js:167`, `coach.js:246,261`), `a11y.js:9` 43,5 px, `canvasPdf` JPEG, `patch-android.js:42-44` allowBackup=false, FHIR/mHealth kodda yok.

## 4. Ek kontroller

**(1) "Hiçbir rakipte yok" gücü.** Raporların çoğu bilinçli olarak "incelenen N sayfada görülmedi" diyor; bu dürüst. Zayıf kalanlar:
- saglik Ö4 (çift doz + hesapsız "yakınıma haber ver"): dayanak yalnız MyTherapy ve Medisafe App Store sayfaları (2 uygulama); "sayfalarda geçmiyor" sonucu "yok"a çevrilemez, rapor da Medfriend'i DOĞRULANAMADI yazmış. Yenilik iddiası kullanılmamalı, öneri güvenlik değeriyle savunulmalı.
- saglik Ö2 (tansiyon x uyku x ilaç x ruh hali): 12 sayfa, iç ekranlar görülmemiş; rapor "kesin yok değil" diyor, yeterli.
- beslenme Ö1 (Ramazan): 8 uygulama sayfası, Zero/Fastic/HealthifyMe yalnız arama özeti; rapor "8'inde rastlanmadı" diyor. Ancak Ramazan'a özel Türkçe/İslami uygulamalar hiç taranmadı; "büyük fark, Türkiye'ye özgü" cümlesi kanıtlanmamış, kanıt: yalnız genel kalori uygulamaları.
- hareket-spor Ö3/Ö4: "incelenen 8/5 sayfada görülmedi", kesinlik iddiası yok; yeterli.
- kullanilabilirlik Ö2 (FHIR/arşiv): 8 yardım sayfası, çoğu dışa aktarma sayfası; biçim adı vermeyen sayfalar "yok" kanıtı değil. Rapor bunu 12. maddede kabul ediyor.

**(2) Tıbbi/hukuki işaretler ve tansiyon eşiği.** Kendim okudum:
- `vitalslib.js:13` `CRISIS={sys:180,dia:120,gLow:54,gHigh:400}`; `vitalslib.js:100` `crisis()` yalnız bugün tarihli kayıtta; `vitalsui.js:74-75` 112 kutusu. `roadmap.md:76`: "tansiyon/şeker ölçümleri yorumlanmaz (eşik, hedef alanı, ... kırmızı işaret ... kaldırıldı)".
- Sonuç: metin düzeyinde roadmap satırı eşiksizlik ilkesini mutlak söylüyor, kod ise tek bir sabit eşik taşıyor; bu açıdan çelişki gerçek. Fakat kasıtlı ve belgeli: `docs/bp-glucose-plan.md:28` ("Acil durum notu (tek istisna)", karar sahibe bırakılmış), `docs/findings.md:56` ("bilinçli bir güvenlik kararı. Doğrulandı"), `docs/legal-questions.md:22` (hukuki soru olarak açıkça işaretli), `docs/competition-features.md:174`. Saglik raporu bu üç belgeyi anmamış; "çelişiyor" cümlesi doğru ama eksik. Yapılacak: roadmap.md:76 satırına "tek istisna: acil kutusu (bp-glucose-plan.md:28)" notu; karar hukuk sorusu yanıtına bağlı.
- Atlanan risk: beslenme Ö1 Ramazan modunun `riskFlags` sert frenini (18 yaş altı, yeme bozukluğu, hamilelik/emzirme, BMI<18,5) "başlatmayı engellemez" diye gevşetmesi. `roadmap.md:72` ve C maddesi sert engelin onayla kalkmadığını, oruçta sert engelde başlatmanın kapalı olduğunu söylüyor. Ramazan modu yeme/su zamanlaması ve sayaç olarak yapılabilir ama sert bayrakta oruç sayacı/bildirimi kurulmamalı; en fazla "hekimine danış" bilgi satırı.
- Diğer riskler işaretlenmiş: Play 12991134/16679511 tıbbi cihaz sınırı, "tıbbi cihaz değildir" beyanı, FDA özeti (ikincil kaynak, rapor dürüstçe belirtmiş), TİTCK görüşü yok (saglik #8), N-of-1 ve düşme/denge önerilerinde iddia yasağı. Türkiye tıbbi cihaz mevzuatı ve KVKK (sağlık verisi özel nitelikli) hiçbir raporda birincil kaynakla doğrulanmadı; hukukçu görüşü gerekir.

**(3) Sınır haritası ve "veri telefonda kalır".** `scripts/boundary.test.js:1-14`: yalnız `S.<alan>` doğrudan erişimi denetliyor; lib'ler arası çağrı serbest (`weeklylib.js:5` VitalsLib/MedLib kullanıyor). Sonuçlar:
- saglik Ö6 (labs -> vitals) raporun "sınır testi belirsiz" çekincesi gereksiz: lib çağrısı serbest, `S.vitals` yalnız `vitals/` + main/kernel'da kalmalı.
- saglik Ö7 (cycle -> Bağlantılar): `cyclelib.js:2-3` "veri Coach'a gitmez"; Bağlantılar da Rehber'e gönderilmiyor (`linksui.js:6`), uyumlu. Yeni bağ boundary-map'te cycle yalnız `cycleui`, `index` ile geçiyor; `cycle/index.js` API'si üzerinden olmalı.
- hareket-spor Ö3 `Gym.workouts()`/`Motion.moves()` API'si, rehber-analiz Ö4/Ö6/Ö8 saf lib: uyumlu. rehber-analiz Ö6 `commentlib.js`'i insights'a koyup coach verisini (`insightlib` coach/ altında) kullanacağı için bağımlılık yönü insights -> coach olur; coach -> insights yönü (mevcut) korunmalı.
- Veri telefonda: ağ noktası yalnız 3 (`fetch(` yalnız `04-sheets.js`, `coach.js`). Çıkış yaratan öneriler: saglik Ö4 paylaşım ekranı (kullanıcı eylemiyle, ilaç adı yok: uyumlu), kullanilabilirlik Ö2 şifresiz tam arşiv (kullanıcı eylemiyle, CSV emsali var; kabul edilebilir ama uyarı şart), beslenme Ö2 klavye dikte (cihaz/klavye sağlayıcısı sese bağlı olabilir; rapor "telefonda doğrulanmadı" demiş). Hiçbir öneri sunucu/hesap/yeni bulut istemiyor.
- Yeni izin: yalnız saglik Ö3 (Health Connect tansiyon okuma, Play beyanı + `play-permission-declarations.md` güncellemesi gerekir; rapor bunu söylüyor).
- Kopya öneri: saglik Ö1 ("Hekim görüşmesi paketi") ile kullanilabilirlik Ö3 ("Hekim için tek rapor") aynı özelliği iki kez öneriyor; tek iş olarak birleştirilmeli (kapsam: dönem seçici + sayfalar; yorum/eşik yok).

## 5. Öneri kararları

### hareket-spor
| # | Öneri | Karar | Neden |
|---|---|---|---|
| 1 | RPE'ye duyarlı ilerleme | KABUL | Kod boşluğu doğrulandı (`algo.js` rpe yok); yalnız "tut" yönü ve 3 seans şartı riskli yönü sınırlıyor. |
| 2 | Uzun aradan sonra hafif dönüş | KABUL | `gSuggest` tarihe bakmıyor (doğrulandı); 14 gün eşiği sezgisel ve ayarlanabilir diye işaretli. |
| 3 | Haftalık kılavuz kartı | KABUL | WHO sayıları birebir doğrulandı; "yeni değil" dürüstçe yazılmış; çift sayım kuralı gerekli ve tanımlı. |
| 4 | Denge/işlevsel güç içeriği | KABUL | Düşme riski notu ve "düşmeyi önler" iddiasının yasağı yerinde; yalnız içerik emeği büyük. |
| 5 | Kuvvet x kilo/kalori satırı | KABUL | `linkslib.js:2` nedensellik iddiası yok kalıbını izliyor; Murphy/Koehler alıntısı tam metne bağlanmadı, satır nedensellik kurmadığı için sorun değil. |
| 6 | Rahatsızlık işareti | KABUL | Yalnız eleme/alternatif, serbest metin yok; `cleanGym` ve yedek uyumu test listesinde. |
| 7 | Sesli aralıklı yürüyüş | KABUL | Küçük iş; Nemoto sağlık bulgusu kullanılmıyor. Tam metinden okunmamış kaynağa dayanak yapılmaması doğru. |

### saglik
| # | Öneri | Karar | Neden |
|---|---|---|---|
| Ö1 | Hekim görüşmesi paketi | DÜZELTMELİ | Doğru ve düşük riskli, ama kullanilabilirlik Ö3 ile aynı iş; tek öneriye birleştir. |
| Ö2 | Bağlantılar'a tansiyon/ilaç/nabız | DÜZELTMELİ | Tansiyon x ilaç çiftini rapor kendisi dışarıda bırakmalı (en güvenli); yalnız uyku/adım/ruh hali ile eşle, "ilacı hekime sormadan değiştirme" notu kalsın. |
| Ö3 | Health Connect'ten tansiyon | KABUL | Yeni izin ve Play beyanı maliyeti açıkça yazılmış; OMRON Japonya kanıtı Türkiye için sınırlı, "şartlı" ifadesi doğru. |
| Ö4 | Çift doz koruması + haber ver | DÜZELTMELİ | Yenilik iddiası 2 uygulama sayfasına dayanıyor, kaldırılmalı; özellik güvenlik değeri için savunulur. 60 dk kuralı yalnız olgu olarak kalmalı (doz hesabı yok). |
| Ö5 | Son dozdan beri etiketi | KABUL | `at` kayıtlı (doğrulandı), etiket yorumsuz, `at` yoksa tahmin yok. |
| Ö6 | Tahlil + ev ölçümü bağlamı | KABUL | Lib çağrısı sınır testine takılmıyor; yorum/eAG yok. |
| Ö7 | Döngü x ruh hali/uyku | KABUL | Veri cihazda kalıyor, doğurganlık kullanılmıyor; döngü modülü API'si üzerinden. |

### beslenme
| # | Öneri | Karar | Neden |
|---|---|---|---|
| 1 | Ramazan modu | DÜZELTMELİ | Sert risk bayrağında (`roadmap.md:72`) sayaç/bildirim kurulmamalı; "fren engellemez" ifadesi kaldırılsın; "büyük fark" iddiası yalnız genel uygulamalara dayanıyor. |
| 2 | Hızlı metin kaydı | KABUL | Rakip (YAZIO/MFP/Lifesum) sunuyor, fark çevrimdışı+ücretsiz+Türkçe ölçü; onay ekranı sessiz hatayı önlüyor. |
| 3 | Günlük toplamda tahmin payı | KABUL | Veri (`lo/hi`) kodda var, gösterim eksik (doğrulandı: `03-screens.js:18`). |
| 4 | Lif/sodyum + WHO eşikleri | KABUL | WHO eşikleri birebir doğrulandı; 18 yaş altı/böbrek-tansiyon notunda gizleme koşulu doğru. |
| 5 | Tarifte pişirme verimi | KABUL | `loglib.js:74` uyarısı + `recipes.txt` katsayıları doğrulandı; rakip üstünlüğü iddia edilmiyor. |
| 6 | Bulunamayan barkodu etikete bağla | KABUL | `ocrui.js:77` barkod taşımıyor (doğrulandı); küçük ve yerel. |

### rehber-analiz
| # | Öneri | Karar | Neden |
|---|---|---|---|
| 1 | Rakam doğrulama | DÜZELTMELİ | İzinli sayı kümesine modelin yasal olarak tahmin edebildiği yemek kcal/protein değerleri de girmeli (`coachlib.js:276` buna izin veriyor), aksi halde sürekli yanlış alarm. |
| 2 | "Yanıtı bildir" | DÜZELTMELİ | Play şartı doğrulandı ("uygulamadan çıkmadan bildirme"); yerel işaret tek başına yetmeyebilir, Play yorumuna sorulana kadar "uyumlu" denmemeli. |
| 3 | Aralıklı hedef tarihi | KABUL | `algo.js` ETA'da aralık yok (doğrulandı), `se` zaten `insightlib.fit`'te; küçük. |
| 4 | Bağlantılar v2 | DÜZELTMELİ | Bootstrap/Newey-West/BH 60 günlük veri ve 3 çift için fazla; 3 kademeli "kanıt" etiketi basit bir eşik+etki büyüklüğü kuralıyla başlamalı, dayanak kitabı kısaltılmalı. |
| 5 | "Rehber'e ne gitti" defteri | KABUL | Metin saklanmıyor, yedeğe girmiyor, tek kapı (`gate`) doğrulandı. |
| 6 | Yerel yorum | KABUL | Ağ/izin yok, tıbbi yorum yok; bağımlılık yönü (insights -> coach lib) dikkat gerektirir. |
| 7 | N-of-1 deneme | DÜZELTMELİ | Büyük kapsam ve sağlık-iddia riski; ilk sürüm tek sabit kart ile sınırlanmalı, "uykuyu düzeltir" gibi sonuç dili yasak. |
| 8 | Kişisel normal bandı | KABUL | Kilo/tansiyon/şeker dışlanmış; yalnız adım/kalori/su, 14 gün şartı. |

### kullanilabilirlik-gizlilik
| # | Öneri | Karar | Neden |
|---|---|---|---|
| 1 | Çıkış defteri | KABUL | Ağ noktası 3 (doğrulandı), başlık "uygulamanın kendi gönderdikleri" ile sınırlı iddia doğru. |
| 2 | Tam arşiv + FHIR Bundle | DÜZELTMELİ | Şifresiz sağlık verisi dosyası; paylaşım uyarısı ve "kilo/şeker FHIR kodları doğrulanmadı" şartıyla; ilk adım yalnız JSON arşiv olsun, FHIR sonra. |
| 3 | Hekim için tek rapor | DÜZELTMELİ | Saglik Ö1 ile aynı iş; birleştir. JPEG PDF erişilebilirlik sınırı raporda dürüstçe yazılı. |
| 4 | Karşılamada "Yedeğim var" | KABUL | Karşılamada geri yükleme yolu gerçekten yok (doğrulandı); mantık hazır. |
| 5 | Yedeği doğrula | KABUL | `backupui.js:45` kullanıcıya bırakıyor (doğrulandı); küçük iş. |
| 6 | Genel CSV içe aktarma | KABUL | Önizleme+geri al şartı var; yanlış eşleme riski ele alınmış. |
| 7 | Rahat mod | KABUL | Hedefler alt sınırda (43,5 px eşiği doğrulandı); 200% yazı taşma testi planlı. |
| 8 | Kilit bekleme seçeneği | KABUL | Küçük, düşük risk; varsayılan 30 sn korunuyor. |

## 6. Doğrulanamayan / yapılmayan

- NormIQ App Store sayfası iki denemede HTTP 429 verdi (saglik tabloları); alıntı doğrulanamadı, sonuca dayanak yapılmadı.
- Europe PMC kayıtları (Nemoto, Murphy-Koehler, Foster), Hall/Orsama/CENT/Künsch künyeleri ve Hardian/FDA ikincil kaynağı açılmadı.
- `e2e/senior.spec.js` ve `access.spec.js` sonuçları (4/4, 30/30) yeniden koşulmadı.
- Raporlardaki tüm `dosya:satır` iddialarının tamamı açılmadı; rapor başına en az 12 örnek açıldı.
