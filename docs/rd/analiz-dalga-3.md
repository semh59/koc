# Ar-Ge analizi: Dalga 3 ve belge düzeltmeleri

Tarih: 2026-10-10. Kapsam: `oncelik.md` "Dalga 3" beş maddesi ve "Belge düzeltmeleri". Yöntem: kod `D:\PROJECT\koc` içinde açıldı; dış koşullar resmi sayfalardan WebFetch ile okundu. WebFetch küçük bir modelin özetini döndürür; aşağıda tırnak içindeki cümleler o özetin sayfadan aldığı alıntılardır, sayfanın tamamı gözle okunmadı. Okunamayan her şey "DOĞRULANAMADI" diye işaretli.

## Karar özeti

| # | Madde | Karar |
|---|---|---|
| 1 | Health Connect'ten tansiyon/şeker okuma | ERTELE (Play'e ilk çıkış onaylandıktan sonra; ilk sürüm yalnız tansiyon) |
| 2 | Tam arşiv JSON | UYGULA (izinsiz, küçük) |
| 2b | FHIR Bundle | ERTELE (önce JSON; tansiyon+kilo kodları doğrulandı, şeker kodu DOĞRULANAMADI) |
| 3 | "Yanıtı bildir" | UYGULA yerel işaret + Play'e sor; "uyumlu" deme (uyumlu yol DOĞRULANAMADI) |
| 4 | N-of-1 deneme | ERTELE (Dalga 3 sonu; ilk sürüm tek sabit kart, sonuç cümlesi yok) |
| 5 | Denge ve işlevsel güç içeriği | UYGULA küçük sürüm (6 hareket + 1 akış), "düşmeyi önler" iddiası yasak |
| 6 | Belge düzeltmeleri | UYGULA (iki düzeltme, tam metin en altta) |

Çelişkiler (ayrıntı ilgili bölümlerde): (a) `roadmap.md:76` ile acil kutusu; (b) Play AI içerik politikası "yalnız sohbet botu" değil, "yapay zekâyla içerik üreten uygulamalar" diyor, `rehber-analiz.md` daraltmıştı; (c) HC'den gelen tansiyon sessizce `riskFlags` yumuşak freni açar (`01-core.js:301`); (d) `play-data-safety.md:53` acil kutusunu anıyor, `roadmap.md:76` anmıyor: aynı belge setinde iki farklı anlatım; (e) `b-food-nutrition.md:8` ile `:13` ve `algo.js:71`.

---

## 1. Health Connect'ten tansiyon/şeker okuma

**Güncel kod.** `HealthPlugin.java:38` yalnız `READ_STEPS`, `READ_SLEEP`, `READ_HEART_RATE` bildiriyor; `patch-android.js:9` manifeste aynı üçünü ekliyor; `HealthPlugin.java:34-36` "never writes". İzin gerekçesi etkinliği (Android 14 alias) `patch-android.js:32`'de var. Okuma döngüsü `hcui.js:14-34`; silinen günler tarih eşiğiyle (`hcFrom`) geri yazılmıyor (`hcui.js:37-41`). Tansiyon kaydı `vitalslib.js:28-45` `check()`: `sid` yalnız `/^[a-z0-9]{1,12}$/` kabul eder; bilinmeyen alanları atar. Yani HC kayıt kimliğini saklamak için yeni alan (`hid`) ve `check()`/`clean()` değişikliği şart; yoksa yedekten/temizlikten sonra kimlik kaybolur ve çift kayıt oluşur. `saglik.md` Ö3'ün dayanağı (`vitalslib.js:33,50-59` "sid ile tekilleştirme") bu yüzden yetersiz: sid HC UUID'sini taşıyamaz.

**Dış koşul (birincil).**
- Android veri türleri sayfası (developer.android.com/health-and-fitness/health-connect/data-types, 2026-10-10): `BloodPressureRecord` izinleri `android.permission.health.READ_BLOOD_PRESSURE`/`WRITE_...`; zorunlu alanlar `systolic, diastolic, bodyPosition, measurementLocation, metadata, time`. `BloodGlucoseRecord`: `READ_BLOOD_GLUCOSE`; alanlar `level, specimenSource, mealType, relationToMeal, metadata, time`. Birim sayfada yok.
- Okuma sayfası (.../read-data): "By default, all applications can read data from Health Connect for up to 30 days prior to when any permission was first granted."; Android 14+ için "30-day limit on an app reading other data." Daha eskisi `READ_HEALTH_DATA_HISTORY` ister (ek izin; kullanılmamalı). Sayfalama `pageToken`, sayfa 1000, bitişi `isNullOrEmpty()` ile denetle.
- Play politikası (support.google.com/googleplay/android-developer/answer/12991134): "Access and use of health permissions is strictly limited to apps providing clear user benefit"; "For each permission requested, provide a clear and detailed justification"; "Request the minimum data types needed"; yüksek hassasiyetli türler için "heightened scrutiny"; "Apps performing diagnosis, treatment recommendations, or clinical monitoring may qualify as Software as a Medical Device"; "Compliance ... is solely the developer's responsibility." Beyan formunun kendisi bu sayfada yok (ayrı sayfa; okunamadı).
- Get-started sayfası: Android 14+ HC çerçeve modülü; manifest izinleri "should match the ones you declared access to in the Play Console"; sonraki istekte "include both new and existing data types".
- Framework sınıfı `android.health.connect.datatypes.BloodPressureRecord` API düzeyi ve `readRecords` imzası: sayfa içeriği WebFetch'e gelmedi. **DOĞRULANAMADI** (Java uygulaması başlamadan resmi referanstan okunmalı).
- OMRON Türkiye sürümünün HC yazdığı: **DOĞRULANAMADI** (`saglik.md` 9. madde); yalnız Japonya.

**Değişecek dosyalar.** `assets/android/HealthPlugin.java` (izin dizisi, `bp` durumu, kayıt okuma), `scripts/patch-android.js:9` (2 izin), `www/modules/pulse/hcui.js` (yeni okuma, üçüncü izin düğmesi), `vitalslib.js check/clean` (`hid`, `src:"hc"`), `vitalsui.js` (satırda "Health Connect'ten" etiketi, silme mezarlığı), `scripts/android.test.js` izin listesi testi, CI izin yazdırma. Docs: `play-permission-declarations.md:26` satırı ve `play-data-safety.md` tablosu (bugün tansiyon/şeker satırı yok; nabız satırı `:22` emsal: "yalnız telefonda"), `privacy-policy.md`, `store-listing.md`. Yedek: `S.vitals` zaten yedekte (`01-core.js:158`), `hid` alanı eklenirse eski yedek bozulmaz; yeni alan eski sürümde atılır. Şema sürümü gerekmez ama mezarlık listesi (`hcDel`) ayarlara girer.

**Yeni bulgu (davranış riski).** `riskInput` (`01-core.js:300-301`) son 90 gündeki tansiyon/şeker sayısını `bpCount90d/glucoseCount90d` olarak freni besliyor; `roadmap.md:72` yumuşak engeli "son 90 gün şeker/tansiyon ölçümü" ile tanımlıyor. HC'den sessiz içe aktarma, kullanıcı hiçbir şey yazmadan kalori açığı frenini "Hekimime danıştım" onayına bağlar. Güvenli yönde ama kullanıcıya sürpriz: ilk sürümde bunun metni gerekir. Ayrıca `crisis()` (`vitalslib.js:100`) bugün tarihli içe aktarılan 180/120 için kutuyu açmaz (kutu yalnız `vFinish` içinde, `vitalsui.js:74`); bu doğru, ama otomatik gelen uç değer sessiz kalır. Karar gerekir; önerim: içe aktarma kutuyu açmaz, kayıt satırında etiket yok (yorum yok ilkesi).

**En küçük güvenli ilk sürüm.** Yalnız `READ_BLOOD_PRESSURE` (şeker yok: `BloodGlucoseRecord` mealType/specimen eşlemesi ctx listesine uymuyor, `vitalslib.js:5`); varsayılan kapalı, mevcut "Saat verilerini al" kartında ayrı anahtar; son 30 gün; kayıt başına sistolik/diastolik/zaman, `src:"hc"`, `hid`=Metadata id (okuma tarafı alanı DOĞRULANAMADI: metadata sayfası yalnız yazma tarafını anlatıyor); silinen satır `hid` mezarlığına; nabız alanı yok. Aynı anda değişen sıra: önce Play ilk onay, sonra bu izin (izin eklemek mevcut sürümün beyanını değiştirir, "include both new and existing").

**Hukuki/tıbbi.** `legal-questions.md:22` (madde 5) tıbbi cihaz sorusunu "kullanıcı kaydı, yorum yok" üzerine kurmuş; cihazdan otomatik gelen tansiyon, kaynağı "cihaz" yapar ve "klinik izleme" izlenimini güçlendirir (Play: "clinical monitoring may qualify as SaMD"). Çelişki sayılmaz ama soru 5'e eklenmeli: "başka uygulamanın yazdığı ölçümü okuyup gösteriyoruz". KVKK: veri yine cihazda; Coach'a gitmez (`play-data-safety.md:21` tansiyon Rehber'e gitmez; içe aktarılan satır aynı `S.vitals` olduğundan aynı kapıdan geçer).

**Kabul/test.** Aynı kayıt iki kez eşzamanlanınca tek satır; silinen `hid` geri gelmez; izin yokken ekran izin satırı gösterir, elle giriş çalışır; eski yedek açılır; APK izin listesi tam 2 yeni izin; `riskFlags` etkisi metinle bildirilmiş; ilk kullanımda kaynak etiketi görünür.

**YAPILMALI MI: ERTELE.** Gerekçe: (1) tek geliştirici + henüz Play incelemesi görmemiş uygulamada iki ek hassas izin, ilk onayı riske atar; (2) kazanç yalnız OMRON benzeri bir cihaz yazıyorsa var, Türkiye'de doğrulanmadı; (3) üç tasarım kararı açık (risk freni, kriz kutusu, kimlik). Şeker için RED eğilimi: eşleme ve yorum riski, tansiyondan sonra ayrı karar.

---

## 2. Tam arşiv ve FHIR

**Güncel kod.** 9 ayrı CSV (`Data.csv.push`, `csvlib.js:2`), `;` ayırıcı; yedek yalnız parolalı JSON (`backuplib.js:11-16`, `{neowell:1,enc:...}`); şifresiz tam dışa aktarma ve şemalı JSON yok (grep `fhir|openmhealth` www'de yok). Paylaşım uyarısı kalıbı `privacyui.js:41-46`.

**Dış koşul.**
- FHIR R4 kan basıncı profili (hl7.org/fhir/R4/bp.html): panel `Observation.code` = LOINC `85354-9`; bileşenler `8480-6` (sistolik) ve `8462-4` (diyastolik); birim UCUM `mm[Hg]`; kategori `vital-signs` (sistem `http://terminology.hl7.org/CodeSystem/observation-category`); sayfa 292 bin karakter, ilk 100 bin okundu. Doğrulandı.
- FHIR R4 vital signs (hl7.org/fhir/R4/observation-vitalsigns.html): vücut ağırlığı LOINC `29463-7` (UCUM g, kg, [lb_av]); boy `8302-2`; nabız `8867-4` (`/min`); her Observation'da status, kategori, LOINC kodu, hasta, zaman, UCUM'lu sayı. Kan şekeri bu tabloda yok; şeker LOINC kodu **DOĞRULANAMADI**, eklenmez.
- Android: Health Connect Medical Records sayfası (.../medical-records): FHIR tanımı var, ama "Play Policy for Medical Records access is still being developed" ve API `ExperimentalPersonalHealthRecordApi`. Bu madde HC'ye yazmıyor; sayfa yalnız FHIR'in ekosistemle ilişkisini gösteriyor. "R4/R4B" ifadesi sayfada yok (`kullanilabilirlik-gizlilik.md`'deki iddia bu sayfadan doğrulanamadı: **DOĞRULANAMADI**).
- Rakip "FHIR yok" iddiası 8 yardım sayfasına dayanıyor; "yenilik" diye sunulmaz.

**Değişecek dosyalar.** JSON arşiv: yeni `www/modules/data/archivelib.js` (saf, `Data.csv` benzeri `Data.archive` kaydı) + `privacyui.js` bir satır + `index.html` script. Her modül kendi alanını `Data.archive.push` ile verir (sınır kuralı `boundary.test.js`; `S.<alan>` yalnız sahibi). İzin yok, Play etkisi yok, manifest değişmez. Yedek/şema: arşiv ayrı bir dışa aktarım; `neowell:1` yedek biçimine dokunmaz; arşivde `schema:1`, tarih, modül başına sayı. Fotoğraf ve API anahtarı girmez (`backupui.js:7` anahtar yedekte var; arşivde yok olmalı). Data Safety: yeni satır gerekmez (kullanıcının seçtiği yere yazılan dosya, `play-data-safety.md:31`); `privacy-policy.md`'ye "şifresiz dışa aktarma" cümlesi.

**Ilk sürüm.** "Veri ve yedek" altında "Tüm verimi dosya olarak ver (şifresiz)": tek JSON, modül başına dizi, kayıt sayıları ekranda, şifresizlik uyarısı. FHIR yok. Ardından (ikinci adım) yalnız tansiyon (`85354-9`) ve kilo (`29463-7`) Bundle'ı, "Gelişmiş" altında.

**Hukuki.** `legal-questions.md:22` ile çelişki yok; FHIR "Observation" yalnız biçim dönüşümü. TİTCK/MDCG 2019-11 "yalnız depolama/gösterim" yorumu birincil kaynaktan okunamadı (`saglik.md` madde 8): **DOĞRULANAMADI**. Şifresiz sağlık dosyası KVKK açısından kullanıcının eylemi; uyarı şart.

**Kabul.** JSON.parse okunur; kayıt sayıları ekrandaki sayılarla eşit; foto/anahtar yok; FHIR çıktısı yerel şema kontrolünden geçer (resmi HL7 doğrulayıcı çalıştırılmadı, DOĞRULANAMADI); 44 px/axe testi.

**YAPILMALI MI.** JSON arşiv: UYGULA (küçük, izinsiz, kullanıcı hakkı). FHIR: ERTELE (talep kanıtı yok, rakip yok iddiası zayıf, doğrulayıcı yok).

---

## 3. "Yanıtı bildir"

**Güncel kod.** Düğme yok: `grep bildir` yalnız `coach.js:377` (istem metni). Mesaj temizleyici `cleanChat` (`coach.js:115-137`) bilinmeyen alanı atar: yeni `flag` alanı eklenirse burada da whitelisted olmalı, yoksa yedek/yeniden yüklemede kaybolur. `S.chat` yedeğe giriyor; işaretli metin zaten sohbette (PII maskeli gönderilir, yerelde geri açılır, `piilib.js:119`).

**Dış koşul (birincil).** support.google.com/googleplay/android-developer/answer/13985936 (2026-10-10): "Apps that generate content using AI must contain in-app user reporting or flagging features that allow users to report or flag offensive content to developers without needing to exit the app." ve "Developers should utilize user reports to inform content filtering and moderation in their apps." Sayfa, kapsamı iki örnekle tanımlıyor: merkezi özelliği sohbet olan metinden-metne sohbet botları ve metin/görsel/ses isteminden üretilen görüntü-video. Rehber (kullanıcının anahtarıyla LLM) birinci tanıma uyuyor: merkezi özellik. Çelişki: `rehber-analiz.md` kapsamı "sohbet botu merkezli" diye daraltıyordu; sayfa özeti kapsamı "AI ile içerik üreten uygulamalar" diye veriyor, yani sınırlama olabilir ya da olmayabilir. Hangisinin doğru olduğu: **DOĞRULANAMADI**; güvenli kabul: kapsam içinde.
- "developers'a bildirme" sunucusuz mimaride nasıl karşılanır: sayfada kanal tarifi yok, arama bir SSS veya `mailto:` kuralı bulmadı. **DOĞRULANAMADI**. `mailto:`/paylaşım ekranı uygulamayı terk eder ("without needing to exit the app" ile çelişir olabilir); yerel işaret geliştiriciye ulaşmaz. Sunucu/hesap kısıtla (`rd-brief`) bağdaşmayan tek yol uygulama içi form + ağ çağrısı; yeni uç nokta kısıtı bozar (yalnız açık, anahtarsız, ücretsiz kaynak).

**Değişecek dosyalar.** `coach/coach.js` (`cCard`, olay işleyici, `cleanChat` whitelist), `coachlib.js` (etiket listesi), `privacy-policy.md`, `store-listing.md`/Play beyan notu; ağ çağrısı eklenmez; `play-data-safety.md` değişmez (yerel). Yedek: `fl` benzeri küçük alan, eski yedekte yok = işaretsiz.

**İlk sürüm.** Her `coach` mesajında "Yanıt sorunlu mu?" bağlantısı; 3 seçenek (yanlış / tehlikeli / uygunsuz); mesaj yerelde işaretlenir, "İşaretli yanıtlar" listesinde görünür, bildirimin kullanıcıya hiçbir yere gönderilmediği açıkça yazılır ("Bu işaret yalnız telefonunda kalır"). Sonra `mailto:` yedek seçeneği isteğe bağlı: kullanıcı kendisi gönderir, ilaç/sağlık metni içerebileceği için önizleme ve uyarı. Store notunda "uyumlu" demeyin; Play incelemesine/geliştirici desteğine soru: "Hesapsız, sunucusuz uygulamada uygulama içi işaret + kullanıcı onaylı e-posta kabul mü?"

**Hukuki.** `legal-questions.md`'de bu soru yok; ekle (madde 6). Tıbbi/yasal: bildirilen metin sağlık verisi içerebilir (gönderim onayı şart).

**Kabul.** Her `coach` mesajında erişilebilir bağlantı (TalkBack etiketi); işaret yedeğe dayanır (`cleanChat` testi); ağ çağrısı sayısı değişmez (kaynak taraması 3 nokta); metin "geliştiriciye gitmedi" der.

**YAPILMALI MI: UYGULA (yerel işaret) ve Play'e sor.** Gerekçe: Rehber açık olarak AI içerik üreten özellik; politikayı hiç karşılamamak reddedilme nedeni olabilir, yerel işaret tek başına yeterli sayılabilir ya da sayılmayabilir (DOĞRULANAMADI). Mağaza notlarında uyum iddiası yok.

---

## 4. N-of-1 deneme ("Kendi deneyin")

**Güncel kod.** Dayanak veri günlük uyku/ruh hali/adım (`linkslib.js:17-28`); hatırlatma `main/05-notifications.js`. Ağrı/yaşam tarzı karar kuralı yok; `linkslib.js:2` "Makes no claim of causation". Deney durum makinesi, randomizasyon, ekran yok (grep `n-of-1|deney` yok).

**Dış koşul.** CENT 2015 (BMJ, PMID 25976398) N-of-1 raporlama standardı: `rehber-analiz.md` Europe PMC kaydından okundu; ben yeniden açmadım: **DOĞRULANAMADI** (kullanılabilir ama dayanak olarak ikinci elden). Play sağlık içeriği: tanı/tedavi dili yasak (`16679511` disclaimer cümlesi `saglik.md` üzerinden, ben açmadım; `12991134` "diagnosis, treatment recommendations, clinical monitoring may qualify as SaMD" okundu).

**Risk.** Sonuç cümlesi ("uykuyu düzeltir") tıbbi iddiaya yaklaşır; 2 haftalık, 3-4 günlük bloklarda istatistiksel güç yok (14 çift altı bile `linkslib.js:10`'da yetersiz sayılıyor). Sabit kaldıraç listesi dışında kullanıcı kendi "deneyini" yazarsa ilaç/diyet/oruç riski (`roadmap.md:72` oruç freni).

**Değişecek dosyalar (ilk sürüm).** Yeni `www/modules/insights/trialui.js` + `triallib.js` (saf), ayarlara `trial` nesnesi, yedek whitelist, `05-notifications.js` bildirim. İzin yok. Data Safety etkisi yok (yerel).

**İlk sürüm.** Tek sabit kart: "Akşam 22:00'den sonra ekranı kapatmayı 7 gün dene". 7 gün A (kontrol), 7 gün B; sıra rastgele; her gün tek soru. Sonuç: iki ortalama yan yana ve "Bu iki hafta için, kesin bir sonuç değil". "Düzeltir/etkiler" yok. Veri yoksa "sonuç yok".

**Kabul.** Rastgele sıra ardışık aynı koşulu 2'den fazla üretmez; <10 gün veride sonuç yok; yasak sözcük taraması (düzeltir, tedavi, iyileştirir); sentetik aynı dağılımda sonuç cümlesi yok.

**YAPILMALI MI: ERTELE.** Gerekçe: büyük kapsam (ekran+durum+bildirim), küçük veride bilgi değeri düşük, hukuki yüzey (sağlık iddiası) en geniş madde; `oncelik.md` Dalga 2 maddeleri ve Bağlantılar v2 (kanıt etiketi) önce. Yapılırsa yukarıdaki ilk sürüm.

---

## 5. Denge ve işlevsel güç içeriği

**Güncel kod.** Kütüphane 324 egzersiz (`exlib.js:3`); denge odaklı hareket yok: "Sandalye squat", "Tek bacak leg extension/köprü/calf raise" güç hareketi; "Topuk dokunma/kalçaya" esneme (grep `denge|balance|tek ayak` yok). Akışlar `guidelib.js:70-74` (`stretch(ids)`, `FLOWS`); ağrı notu `gym.js:330, 425` (`gPainNote`). Şekil şablonları `figlib.js`/`figtpl.js` (`hareket-spor.md:101`, ben açmadım).

**Dış koşul.** WHO 2020 Tablo 4: 65+ için "varied multicomponent physical activity that emphasises functional balance and strength training" (`hareket-spor.md` + `dogrulama.md` doğruladı; ben yeniden açmadım). Play `12991134`: tanı/tedavi/klinik izleme tıbbi cihaz sayılabilir; "düşmeyi önler" iddiası bu sınıfa yaklaşır (okundu).

**Değişecek dosyalar.** `exlib.js` (yeni kayıtlar), `excues.js` (ipuçları), `guidelib.js` `FLOWS` (1 akış), şekil şablonu kullanımı; testler `gym` kütüphane testi (her kaydın `id/n/r/tp` alanı, akış süresi 10 dk ±1). İzin yok, Play/Data Safety etkisi yok. Yedek/şema yok (içerik, kullanıcı verisi değil; özel egzersiz `customEx` etkilenmez).

**İlk sürüm.** 6 hareket (tek ayak duruş, topuk-parmak yürüyüşü, sandalyeden kalkma, yan adım, tandem duruş, kollar yanda yürüyüş) + `FLOWS` içinde "10 dk denge ve kuvvet" (hareket 30-45 sn). Her hareket başında "duvar veya sağlam sandalye yanında yap" notu ve `gPainNote`. Haftalık kılavuz kartı (hareket-spor Ö3) ayrı iş; bu yalnız içerik.

**Hukuki.** `legal-questions.md`'de çelişki yok; "genel bilgi, tavsiye değil" notu + MED_NOTE (`01-core.js:73`). Metinde "düşme riskini azaltır" yasak.

**Kabul.** Yeni egzersizlerin alanları geçerli; `GuideLib.phases` akışı üretir; metin taraması "düşmeyi önler/azaltır" geçmez; yazı >=14 px; 65+ kullanıcı tek dokunuşla akışı başlatır.

**YAPILMALI MI: UYGULA (küçük sürüm).** Gerekçe: kod hemen hemen yok (veri), izin yok, risk yazıyla yönetilir; emek figür/ipucu üretiminde, o yüzden 6 hareketle sınırla.

---

## 6. Belge düzeltmeleri

### 6.1 Acil kutusu ve `roadmap.md:76`

Kanıt: `vitalslib.js:13` `CRISIS={sys:180,dia:120,gLow:54,gHigh:400}`, `:100` `crisis()` yalnız `r.day===today`, `vitalsui.js:74-75` kutu ("Cihazı kontrol edip ölçümü tekrarla. Belirtin varsa ya da değer doğruysa 112'yi ara."). Belgeli istisna: `bp-glucose-plan.md:28` ("tek istisna", karar sahibe bırakılmış), `findings.md:56` ("bilinçli bir güvenlik kararı. Doğrulandı."), `legal-questions.md:22` (hukuki soru), `play-data-safety.md:53` (karar 4 içinde "korunur"; aynı dosya `:55`'te "bir eşikte uyarı vermek de yorum sayılabilir" diye dürüst not düşmüş). Tek eksik: `roadmap.md:76`.

`vitalslib.js:3` üst yorumu ("no thresholds ... it only records, averages and plots") ve `vitalsui.js` üst yorumu da mutlak; kod yorumu düzeltmesi bu görevin dışı (kod değişmez), ama aynı çelişki: bir sonraki kod dokunuşunda `vitalslib.js:2-3` yorumuna "tek istisna: `CRISIS`" eklensin.

**Düzeltme: `docs/roadmap.md`, satır 76.** `Play tıbbi kategori riski azaldı` cümlesinden hemen önce şu cümle eklensin (mevcut metin korunur):

> Tek istisna: bugün tarihli kayıtta tansiyon 180/120 ve üstü ya da şeker 54 altı / 400 üstü ise kayıttan sonra yorumsuz bir acil kutusu çıkar ("Cihazı kontrol edip ölçümü tekrarla. Belirtin varsa ya da değer doğruysa 112'yi ara."); eşik `vitalslib.js` `CRISIS` sabitidir, geriye dönük girilen ve içe aktarılan kayıtta çıkmaz, karar `bp-glucose-plan.md:28`, doğrulama `findings.md:56`, hukuki soru `legal-questions.md` madde 5.

Not: "içe aktarılan kayıtta çıkmaz" şu an doğru (kutu `vFinish`'te, `vitalsui.js:74`); tek elle giriş yolu. HC içe aktarma gelirse bu cümle yeniden okunmalı (Bölüm 1).

### 6.2 `docs/market/b-food-nutrition.md`

Satır 8 sonu "Adaptif hedef yok;" ifadesi satır 13 ("Kısmen ... haftalık hedef ÖNERİSİ") ve kodla çelişir: `algo.js:71-91` `adaptiveTdee` (28 gün, en az 10 tam gün ve 4 tartı, harcama kilo trendinden öğrenilir), hedef önerisi `suggestTarget` (kullanıcı onaylar).

**Düzeltme: `docs/market/b-food-nutrition.md`, satır 8.** "Adaptif hedef yok;" yerine:

> Adaptif harcama var (`www/kernel/algo.js:71`, 28 gün, en az 10 tam gün; hedefe yalnız öneri olarak yansır, kullanıcı onaylar);

Tablo satırı 13 doğru, dokunulmaz.

---

## DOĞRULANAMADI listesi

1. `BloodPressureRecord` platform sınıfının (Java, API 34) imzası ve `readRecords` kullanımı: resmi referans sayfası içeriği alınamadı.
2. HC okuma tarafında kayıt kimliği (`Metadata.id`) ve `dataOrigin` alanı: metadata sayfası yalnız yazmayı anlatıyor, read-data sayfası tanımlamıyor.
3. OMRON Türkiye sürümünün HC'ye tansiyon yazdığı.
4. Play Health Connect beyan formunun kendi sayfası (12991134 yalnız ilke ve gerekçe şartını veriyor).
5. Kan şekeri için FHIR/LOINC kodu (vital-signs tablosunda yok, doğrulanmadı).
6. HC Medical Records sayfasında "R4/R4B" ifadesi.
7. AI-Generated Content politikasının kapsamının sohbet botuyla sınırlı olup olmadığı (özet "AI ile içerik üreten uygulamalar" diyor; sohbet botu iki örnekten biri).
8. Sunucusuz/hesapsız uygulamada "geliştiriciye bildirme" şartının nasıl karşılanacağı (Play'in bir kanal tarifi bulunamadı).
9. CENT 2015 künyesi bu oturumda açılmadı.
10. Türkiye tıbbi cihaz mevzuatı / TİTCK görüşü; FHIR dışa aktarmanın SaMD sayılmayacağı.
11. WHO 2020 Tablo 4, hareket-spor/dogrulama raporlarından alındı, bu oturumda yeniden açılmadı.
12. Resmi HL7 doğrulayıcıyla FHIR çıktı doğrulaması (çalıştırılmadı, çünkü uygulama yok).
