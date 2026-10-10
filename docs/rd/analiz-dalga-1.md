# Dalga 1 uygulama analizi (kod düzeyi)

Kapsam: `oncelik.md` Dalga 1'in 7 maddesi. Yöntem: ilgili kod gerçekten okundu (dosya:satır aşağıda), önerilerin dayandığı iddialar yeniden sınandı. Web kaynağı bu analizde kullanılmadı; rakip ve bilimsel iddialar ilgili takım raporlarından alınmadı, yeniden doğrulanmadı. Kod değişmedi, commit yok.

İki hesap kendi yaptığım denemedir, kullanıcı verisi veya ölçüm değildir; parametreleri varsayımdır ve betikler depoya eklenmedi (geçici klasörde): madde 4'teki ETA simülasyonu (`sim4.js`) ve madde 5'teki ayrıştırıcı prototipi (`proto5.js`). Madde 3'teki sayımlar `foods.js` üzerinde doğrudan çalıştırıldı.

## Karar özeti

| # | Madde | Karar | Tek cümle |
|---|---|---|---|
| 1 | Telefondan çıkanlar defteri | UYGULA | Doğrulandı (3 ağ noktası). Kapsamı "NeoWell'in kendi gönderdikleri" ile sınırla; sarmalayıcı `window.fetch`'i çağrı anında aramalı. |
| 2 | Karşılamada "Yedeğim var" + "Yedeği doğrula" | DEĞİŞTİR | Karşılama kısmı UYGULA; "yazıldıktan sonra doğrula" RED (zaten doğrulanıyor), yerine dosyadan "Yalnız denetle". |
| 3 | Günlük toplamda tahmin payı | DEĞİŞTİR | Gösterim UYGULA; ama `lo/hi` tekrar/favori/şablon yolunda kayboluyor, önce o taşınmalı; üç düğme ve TDEE bandı çıkar. |
| 4 | Trend: aralıklı hedef tarihi | DEĞİŞTİR | Dürüst ama gerçekçi gürültüde çoğu kez "kestirilemiyor" çıkar; pencere 21 gün kalmalı; hızlı uç güvenli hızla sınırlanmalı. |
| 5 | Hızlı metin kaydı | DEĞİŞTİR | Değer yüksek ama "küçük" değil (orta); Dalga 2'ye al, ölçü eşlemesi yalnız besinin kendi porsiyonlarıyla. |
| 6 | Spor: RPE + uzun ara | DEĞİŞTİR | İkiye böl: "uzun ara" (RPE'den bağımsız) önce; RPE yalnız "tut" yönünde ve yalnız `rpeOn` iken; ayar yardım metni değişmeli. |
| 7 | Rahat mod + kilit bekleme | DEĞİŞTİR | Kilit bekleme küçük, hemen yapılır ama "hemen" seçeneği RED; Rahat mod "küçük" değil, ayrı iş (Dalga 2), hedef 52 px. |

## Ortak bulgular (tüm maddeleri etkiler)

- Yeni kalıcı alan kuralı: açılışta ve geri yüklemede durum `buildState` ile varsayılandan yeniden kurulur (`01-core.js:154-165`). `cleanSettings` yalnız DEF'te boolean olan, `RANGES`'te sayı olan ve elle sayılan anahtarları (`sex`, `act`, `theme`...) taşır (`01-core.js:75-98`). Yeni bir ayar anahtarı bu listeye eklenmezse açılışta ve geri yüklemede sessizce düşer. Yeni S alanı ayrıca `DEF`, bir `clean*` ve `Modules` kaydı ister (`modules.js:4-17`, yoksa "other" parçasına gider).
- Göç kodu gerekmez: `code-conventions.md` "kullanıcı ve korunacak veri yok" der. İsteğe bağlı yeni alanlar eski yedeklerde yoksa varsayılan alınır.
- Sınır testi yalnız modül S alanlarına doğrudan erişimi denetler (`boundary.test.js:6-13`); lib'ler arası çağrı ve global yardımcılar serbest. `settings` modül alanı değil, çekirdektir. Sınır haritası otomatik üretilir (`node scripts/boundary-map.js`), yeni dosyalardan sonra yenilenir. `paths.test.js` her yeni betiğin `index.html`'de yüklenmesini şart koşar.
- Test altyapısı: birim testler `scripts/*.test.js` (jsdom ile tüm uygulamayı `boot` eder, `run-tests.js` hepsini koşar); e2e `e2e/*.spec.js` (Playwright). Testler `w.fetch`'i açılıştan sonra değiştirir (`app.test.js:228,1621,2041`).
- Erişilebilirlik testleri hazır: `access.spec.js` ekran listesi (`:6`) ve sayfa listesi (`:7`, yalnız 3 sayfa) üzerinde axe, 43,5 px hedef, %200 yazı ve 320 px taşma koşar; `senior.spec.js` ekran başına en çok 45 kontrol ve en az 14 px yazı ister. Yeni sayfalar `SHEETS` listesine eklenmeli (gizlilik ve yedek sayfaları şu an listede yok).
- Telefonda doğrulanamayanlar (yalnız jsdom/Playwright var): gerçek dosya seçici, Drive paylaşımı, WebView yazı ölçeği.

---

## 1. Telefondan çıkanlar defteri — UYGULA

**1. İddia doğrulaması.** Doğru. `fetch(` yalnız `04-sheets.js:167` (Open Food Facts), `coach.js:246` (sohbet) ve `coach.js:261` (model listesi); `index.html:130` yerel dosya okur (aynı kaynak). `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource`, `new Image(src=https)`, `window.open`, `https://` bağlantısı için ayrı arama yaptım: uygulama kodunda yok (`coach.js:898` yalnız bir placeholder). CSP `connect-src 'self' https:` (`index.html:10`). Java tarafında `HttpURLConnection/OkHttp/openConnection` yok. Ancak ağ trafiği olabilecek ama WebView'den görünmeyenler var: Google barkod modülü indirmesi ve ML Kit/Play hizmetleri (`patch-android.js:33-34`, `play-data-safety.md:30` "doğrulanmadı"). Bu yüzden başlık "Telefondan çıkan her şey" olamaz; "NeoWell'in kendi gönderdikleri".
Raporun iki ek önerisi için not: Rehber isteklerinin sayısı zaten tutuluyor (`nw_state_usage`, `coach.js:228-237`, gösterim `privacyui.js:30`) ama zaman damgası, hedef ve OFF aramaları yok; yeni değer budur.

**2. Dosyalar ve sınır.**
- Yeni `www/kernel/netlog.js` (çekirdek, modül bilmez): `NetLog.fetch(kind,url,init)`. İçeride `window.fetch(...)` **çağrı anında** aranmalı; yüklenirken bir değişkene alınırsa tüm testler (`w.fetch=` ile değiştirir) kırılır.
- Değişen çağrı noktaları: `main/04-sheets.js:167`, `modules/coach/coach.js:246,261` (3 satır).
- Gösterim: `modules/data/privacyui.js:22-30` "İnternete çıkanlar" açılırının altına bölüm.
- `main/07-actions.js:50` sabit silme listesine yeni anahtar (şu an `nw_state_usage` orada elle yazılı).
- `index.html` betik satırı (kernel bölümü); `paths.test.js` zorlar. Belgeler: `docs/privacy-policy.md`, `docs/play-data-safety.md:5` ("ağ çağrıları... başka yok" cümlesi sarmalayıcıya atıf alır).
- Sınır haritası etkilenmez (S alanı yok).

**3. Şema / yedek.** S'e girmez. `Store.set("nw_netlog",...)`: IndexedDB modunda `ALL` listesinde olmayan anahtarlar localStorage'a gider (`storelib.js:75-84`), yani durum yedeğine (`{S,keys}`, `backupui.js:7`) ve parçalara girmez. İstenen davranış bu: defter başka telefona taşınmaz. `Tüm verileri sil` listesine eklenmezse silme sonrası kalır (kesin eklenmeli). Biçim: en çok 100 satır, 30 günden eskiler atılır; satır `{t,kind:"off"|"chat"|"models",host,out,ok}`. İçerik (barkod, mesaj) saklanmaz.
`clean*` doğrulayıcı: defteri okurken `JSON.parse` + alan tipi denetimi (bozuksa boş liste), S'e dokunmaz.

**4. Kullanıcı akışı ve metin.** Ayarlar > Veri > Gizlilik ve veri > "İnternete çıkanlar" açılırı. Üstte tek cümle:
- Satır yoksa: "Son 30 günde NeoWell kendi başına internete hiçbir şey göndermedi."
- Varsa: "Son 30 günde NeoWell kendi başına 7 istek gönderdi." + "Ayrıntı" açılırı. Satırlar: "12 Eki 14:32 · world.openfoodfacts.org · barkod numarası" ; "12 Eki 14:40 · api.groq.com · Rehber mesajı (onayladığın metin), 2 340 bayt" ; "12 Eki 14:41 · api.groq.com · model listesi (anahtarın istek başlığında gider)". Başarısız satır: "ulaşılamadı".
- Alt not: "Google barkod okuyucu ve metin tanıma (Play hizmetleri) burada görünmez." + "Defteri temizle" düğmesi.
60 yaş: yalnız tek cümle görünür, ayrıntı katlı; yeni düğme sayısı 1 (açılır) + 1 (temizle).

**5. Kenar durumlar.** (a) Bir gönderim iki istek olabilir: `callProvider` uzunluk kesilince üç katı limitle kendini yeniden çağırır (`coach.js:252`) ve kurulum yoklaması da istek sayılır; her `fetch` bir satır, sarmalayıcı bunu doğal sayar. (b) Çevrimdışı/iptal edilen istek: `try/finally` ile `ok:false` yazılır, çıkmamış isteği "gitti" diye göstermemek için başlıkta "gönderildi/denendi" ayrımı yap. (c) Gövde baytı `TextEncoder` ile UTF-8; başlık baytları sayılmaz (nota yaz). (d) localStorage dolu/yazılamaz: sessizce geç, uygulama akışını bozma. (e) Özel sağlayıcı adresi: host olduğu gibi gösterilir. (f) Defterin kendisi barkod tarama zamanlarını tutar; hassas ama yerel ve silinebilir.

**6. Testler (kabul koşulu = test).**
| Koşul | Dosya |
|---|---|
| `barcodeFind` bir satır ekler, ikinci tarama (yerel eşleşme) eklemez | `scripts/app.test.js` (~2040 bloğu) |
| Rehber gönderimi: onay/izin yoksa satır yok; gönderimde satır; uzunluk yeniden çağrısı 2 satır | `scripts/app.test.js` (~1620-1700) |
| Kaynak taraması: `fetch(`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`, `EventSource` yalnız `kernel/netlog.js` ve `index.html:130`'da | yeni `scripts/netlog.test.js` |
| Budama (100 satır, 30 gün), bozuk JSON, yazma hatası | `scripts/netlog.test.js` |
| Tüm verileri sil defteri temizler; yedek metni defteri içermez | `scripts/data.test.js` / `backup.test.js` |
| Gizlilik sayfası: sıfır istekte "hiçbir şey göndermedi"; axe, 44 px, %200 yazı | `e2e/access.spec.js` (SHEETS'e gizlilik), `e2e/coach.spec.js` (sohbet sonrası host görünür) |

**7. Büyüklük.** Küçük: ~35 satır kernel, 3 çağrı değişikliği, ~30 satır arayüz, ~80 satır test. Belirsizlik: Android'de WebView isteği "ulaşılamadı" durumlarının ayrımı telefonda doğrulanmadı.

**8. Yapılmama nedeni?** Ciddi neden yok. Zayıf nokta: tek kullanıcı için değer "güven kanıtı"; Play incelemesi bunu istemiyor. Yanlış güvence riski (Google trafiği görünmez) metinle kapatılıyor. Düşük öncelikli ama ucuz ve düşük riskli.

---

## 2. Karşılamada "Yedeğim var" ve "Yedeği doğrula" — DEĞİŞTİR

Bu madde iki ayrı iş; karar farklı.

### 2a. Karşılamada "Yedeğim var" — UYGULA (değişikliklerle)

**1. İddia doğrulaması.** Doğru: karşılamada yalnız Başla ve Şimdilik geç var (`onboardui.js:52-53`). `docs/todo.md:68` (B9, imza değişikliği, eski sürümü kaldırıp yedekle yeniden kurma) bu yolun gerçek bir ihtiyacı olduğunu gösteriyor. Ancak "mantık hazır" iddiası eksik: `goRestore` DOM'a bağlı (`#bk` ve `#bkpw` okur, `04-sheets.js:239,241`); dosya okuma `change` olayında `#bk`'ye yazıyor (`06-events.js:54-57`). Karşılama ekranının kullanabilmesi için `(text,pw)` alan bir çekirdeğe ayrılmalı (`restoreFrom`), `goRestore` onu DOM'dan beslemeye devam eder (`scripts/bkhelp.js` ve mevcut testler `goRestore()`'a dayanıyor).

**2. Dosyalar ve sınır.** `main/04-sheets.js` (`goRestore` ayrıştırma), `modules/data/onboardui.js` (düğme + yeni sayfa), `main/06-events.js` (yeni dosya girişi), `e2e/onboarding.spec.js:17` (`.btn` listesi ["Başla"] bekliyor; "Yedeğim var" `btn ghost` ise güncellenmeli). Sınır: onboardui yalnız `S.settings` ve global `goRestore/buildState` çağırır; ihlal yok.

**3. Şema / yedek.** Yeni alan yok. Geri yüklemede davranış (`04-sheets.js:251`): `noticeOk`, paylaşım anahtarları, `consent*`, `autoBk/lastAutoBk` mevcut (boş) telefondan kalır. Sonuçlar: (i) `noticeOk=false` kalır, bir sonraki açılışta "Önemli uyarı" sayfası çıkar (`06-events.js:108`); karşılama zaten `NOTICE`'i gösterdiği için restore yolunda `noticeOk=true` ve `obDone=true` açıkça yazılmalı; (ii) Rehber rızası yeniden verilir; (iii) otomatik klasör yedeği kapalı gelir; (iv) fotoğraflar yedekte yok (`privacyui.js:20`). Bunlar ekranda söylenmeli. `clean*` zinciri aynı (`buildState`), ek doğrulayıcı gerekmez; eski sürüm yedeğindeki bilinmeyen alanlar sessizce düşer, `b.lost`/`drop` toast'ta zaten bildirilir (`:267`).

**4. Akış ve metin.**
Karşılama: [Başla] [Yedeğim var] ["Şimdilik geç" bağlantısı]. "Yedeğim var" sayfası:
- Başlık "Yedeğini geri yükle"; metin "Daha önce aldığın NeoWell yedek dosyasını seç ve yedek parolanı yaz."
- [Yedek dosyasını seç] (`input[type=file]` etiketi) → seçilince "Seçilen: neowell-yedek-2026-10-01.json".
- Parola alanı "Yedek parolası"; [Geri yükle]; [Vazgeç].
- Alt not: "Parolayı unuttuysan yedek açılamaz. Fotoğraflar yedeğe girmez. Rehber izni ve otomatik yedek bu telefonda yeniden ayarlanır."
- Onay (boş telefonda): "Yedekte 1 240 günlük kayıt, 38 antrenman, 3 ilaç, 120 ölçüm var. Yüklensin mi?" (mevcut metin "Mevcut veriler değişecek" boş telefonda yanlış ve ürkütücü; `04-sheets.js:247`). Sayımlar `buildState` çıktısından (`entries/workouts/meds/vitals`) alınır; mevcut "N kayıt" yalnız `entries`'i sayıyor, yalnız ilaç/antrenman taşıyan yedekte yanıltıcı.
- Başarı: Bugün ekranı + toast "Yedek yüklendi". 
Dokunma sayısı: raporun "3 dokunuş" kabulü gerçekçi değil: Yedeğim var, dosya seç (sistem seçicide ≥2 dokunuş), parolayı yaz, Geri yükle, onay = en az 6. Kabulü "karşılama ekranından, hiçbir Ayarlar ekranına gitmeden" diye yeniden yaz.

**5. Kenar durumlar.** Yanlış parola/bozuk/parolasız dosya: mevcut toast'lar ve veri değişmez (`:240-243`). >5 MB dosya reddi (`06-events.js:56`). PBKDF2 600 000 yineleme (`backuplib.js:4`) bir süre sürer: düğmeyi devre dışı bırakıp "Açılıyor…" göster (çift dokunma iki kez çözer). Boş telefonda "güvenlik kopyası" (`nw_state_previous`) gereksiz: önceki durum boşsa kopya alma (depolama dolu uyarısı da çıkmasın). Yedekte `obDone:false` ve kayıt yoksa karşılama yeniden çıkar: restore sonrası `obDone=true` zorla. Yeni telefonda bildirim/pil izinleri yeniden gerekir (`todo.md:68`); `scheduleReminders` çağrılıyor ama izin akışı telefonda doğrulanmadı.

**6. Testler.**
| Koşul | Dosya |
|---|---|
| Karşılamada iki düğme (Başla, Yedeğim var); yedek yüklenince Bugün açılır, kayıtlar gelir | `e2e/onboarding.spec.js` (+ `e2e/backup.spec.js` mevcut yedek üretimi yeniden kullanılır) |
| Yanlış parolada veri/karşılama değişmez; yüklemeden sonra `noticeOk` ve `obDone` true, uyarı sayfası çıkmaz | aynı |
| `restoreFrom(text,pw)` DOM'suz çağrılır; `goRestore()` eski davranışı korur | `scripts/app.test.js` (~821,876), `data.test.js:83` |
| Boş telefonda onay metni "değişecek" içermez, kopya alınmaz | `scripts/app.test.js` |
| Karşılama sayfası axe/hedef/%200 | `e2e/access.spec.js` |

**7. Büyüklük.** Küçük-orta: çekirdek ayrıştırma ~25 satır, sayfa ~40 satır, test ~80 satır. Belirsizlik: sistem dosya seçicisinden Drive dosyası seçmek ve `f.text()` telefonda denenmedi (mevcut "Dosyadan oku" aynı yolu kullanıyor).

**8. Yapılmama nedeni?** Yok; B9 göçü bunu gerektiriyor.

### 2b. "Yedeği doğrula" — RED (olduğu gibi), DEĞİŞTİR (yerine dosyadan denetle)

**İddia yanlış/eksik.** Rapor "yedek yazıldıktan sonra doğrulanmıyor" diyor. Otomatik klasör yedeğinde doğrulanıyor: `BackupFolderPlugin.java:135-175` yeni dosyayı geçici adla yazar, `same()` ile baytları karşılaştırır (`:206-215`), tutmazsa eskisini silmez ve hata verir (JS tarafında `backupui.js:108-111`). Elle paylaşımda dosya Drive'a paylaşım ekranından gider; uygulama dosyayı geri okuyamaz. Bellekteki metni aynı parolayla çözmek yalnız WebCrypto gidiş-dönüşünü sınar, gerçek riski (parolanın yanlış yazılması/unutulması, Drive'a ulaşmaması) sınamaz. Ek olarak "Yedek doğrulandı" yazısı yanlış güvence verir.

**Önerilen yerine:** yedek sayfasında "Yalnız denetle": dosyayı seç, parolayı yaz, hiçbir şey yüklemeden "Parola doğru. Yedekte 1 240 günlük kayıt, 38 antrenman... var; son kayıt 3 Eki." göster. `todo.md:68` (1) adımı ("açılabildiğini kontrol et") tam bunu ister. Çekirdek `restoreFrom`'un ilk yarısı (çöz + `buildState`); yeni kod ~20 satır. Metin değişikliği: `backupui.js:45` toast'ı "Drive'da dosyanın göründüğünü kontrol et" yerine "Dosyayı Drive'dan seçip Yedekle veya geri yükle > Yalnız denetle ile açılabildiğini görebilirsin". Not: yedekte tarih alanı yok (`lastBackup` önceki değeri taşır); "son kayıt günü" (`max entries.day`) kullan, "yedek tarihi" yazma.
Testler: `scripts/app.test.js` (yanlış parola/bozuk dosya "Doğrulanamadı", doğruda sayılar `buildState` ile eşit, S değişmez), `e2e/backup.spec.js`. Büyüklük: küçük. Not: yeni telefondaki sayım için `Data.privacy` sayaçları global `S`'ye bağlı (`privacyui.js:3`, `gym/index.js` örneği); yedekten kategori sayısı için refactor gerekir, ilk sürüm yalnız `buildState` sonucundaki dizi uzunluklarını göstersin.

---

## 3. Günlük toplamda tahmin payı — DEĞİŞTİR

**1. İddia doğrulaması.** Kısmen doğru. `lo/hi` kayıt başına saklanıyor ve gösteriliyor (`01-core.js:146`, `03-screens.js:18`), toplamda yok (`03-screens.js:44,60`). Ama iki eksik: (a) `foods.js` üzerinde saydım: 818 besinin 412'sinde aralık var (%50); aralığı olan besinlerde yarı genişliğin medyanı kcal'in %12'si (min %2, maks %44); çekirdek 106 yemeğin yalnız 39'unda. (b) **`lo/hi` tekrar yollarında kayboluyor:** `copyNutr` yalnız `p,c,f,fb,sg,na` kopyalar (`loglib.js:6`); `item()` (favori, şablon, "son yediklerin") yalnız onu kullanır (`:9-14`); `addFoods` ("Dünkünü tekrarla", favori, şablon) yalnız `copyNutr` ile ekler (`04-sheets.js:82`). Sık yenen yemekler en çok bu yollardan girdiği için toplam payı eksik kalır ve "dar aralık" yalan olur. Ayrıca `lo/hi` anlamı satıra göre değişiyor: tarif satırlarında az/çok yağlı varyant, öğün kayıtlarında bileşen aralığı, vekil satırlarda ±%15-45, restoran ±%30 (`foods.js:3-7` başlık yorumu). İstatistiksel güven aralığı değildir.

**2. Dosyalar ve sınır.** `modules/log/loglib.js` (yeni saf `dayRange(meals)`, `item()` ve yeni küçük `copyRange` ile `lo/hi` taşıma), `main/04-sheets.js:82` (`addFoods`), `main/03-screens.js` `viewToday` (satır ~54-57 yanına), isteğe bağlı `viewDay`. Sınır: `Log`/`Nutrition` global lib çağrısı serbest; yeni S alanı yok.

**3. Şema / yedek.** `favFoods[]`, `mealTpl[].items[]` ve türetilen "recents" öğelerine isteğe bağlı `lo,hi` (tam sayı, `0<=lo<=v<=hi<=20000`, `01-core.js:146` ile aynı koşul). `LogLib.item()` içinde doğrulanır (hem `cleanFav` hem `cleanTpl` onu kullanır). Eski yedekler/öğeler alanı taşımaz: aralıksız sayılır, hata yok. Yedek biçimi değişmez.

**4. Akış ve metin.** Bugün halkasının altında (makro satırları bölgesi) tek `hint` satırı, yalnız koşul sağlanınca:
"Tarif farkına göre bugün ~1 020–1 350 kcal olabilir."
Koşul önerisi: aralığı bilinen yemekler toplam kcal'in en az %50'sini oluşturuyor ve (hi−lo)/toplam ≥ 0,10. Yöntem: uç toplamı (aralığı olan yemekte `lo/hi`, olmayanda `v`); karekök-toplam gibi bağımsızlık varsayan hesap kullanma, çünkü `lo/hi` istatistik değil senaryo (örnek 8 yemeklik gün: uç toplamı ±%14, karekök yöntemi ±%8; fark yöntem seçiminin sonucu etkilediğini gösterir, hangisi "doğru" diye kanıt yok). Satır halkaya ek kontrol getirmez (60 yaş için sade).

**5. Kenar durumlar.** Hiç aralıklı yemek yok: satır yok. Elle yazılan kalori ("Ne yedin?") aralıksız=kesin sayılır: bu yüzden %50 kapsam koşulu şart. Rehber kartından gelen yemekler (`portion:true`) aralık taşımaz. Aynı gün birden çok kayıt silinirse yeniden hesap (saf fonksiyon). Hedef yokken (`kgl=0`) satır yine görünebilir. Aralık düşük ucu negatif olamaz.

**6. Testler.**
| Koşul | Dosya |
|---|---|
| `dayRange`: karışık gün, yalnız aralıksız gün (satır yok), kapsam %50 altı, dar aralık (<%10) | `scripts/log.test.js` |
| `item/cleanFav/cleanTpl` geçerli `lo/hi`'yi korur, `lo>v` olanı atar | `scripts/log.test.js` |
| `repeatYesterday` ve favori eklemesi `lo/hi`'yi taşır | `scripts/app.test.js` (~1992 bloğu) |
| Bugün ekranında satır görünür/görünmez | `scripts/app.test.js` + `e2e/today.spec.js` |
| Kontrol sayısı artmaz (≤45), 14 px, axe | `e2e/senior.spec.js`, `access.spec.js` |

**7. Büyüklük.** Küçük (~40 satır kod, ~50 satır test); `lo/hi` taşıma ek ~10 satır. Belirsizlik: eşikler (%50 kapsam, %10 genişlik) kaynaklı değil, sabit olarak yazılmalı.

**8. Yapılmama nedeni?** Gösterim zararsız. Kapsam dışı bırakılacaklar: "Az yağlı/Orta/Yağlı" üç düğmesi (anlamı satıra göre değişiyor, yukarıda) ve TDEE güven bandı (ikinci adım, ayrı iş).

---

## 4. Trend: aralıklı hedef tarihi — DEĞİŞTİR

**1. İddia doğrulaması.** Kısmen yanlış. (a) "`se` zaten hesaplanıyor": `se` yalnız `InsightLib.fit` içinde (`coach/insightlib.js:20-27`); ETA yolu `Algo.ols` kullanır ve `se` döndürmez (`algo.js:27-31`). Çekirdek (`kernel/`) `coach/` altındaki dosyayı kullanamaz, yani `se` kernel'de yeniden yazılmalı (~8 satır). (b) "Hafta-hizalı pencere" önerisi gereksiz: ETA zaten 21 gün = 3 tam hafta (`algo.js:97`) ve Bugün/Trend'deki "Kilo hızı" da aynı pencereyi kullanıyor (`03-screens.js:41,105`); pencereyi değiştirmek iki ekranı birbiriyle çelişir. Pencere 21 gün kalmalı. (c) Mevcut gösterim tek sayı: "Son 3 haftanın eğimi sürerse ~N hafta" (`03-screens.js:109`), `etaWeeks` 104 hafta üstünde null (`algo.js:171`), yön uyuşmazlığı/eğim ~0 null (`:170`).

**2. Simülasyonla gerçekçilik (kendi hesabım; varsayımlar: normal gürültü, %80 iki yönlü t aralığı, 21 gün pencere, gerçek eğim −0,4 kg/hf, hedefe 10 kg; 4000 deneme).** "Kestirilemiyor" oranı ve aralığın genişliği (yavaş uç/hızlı uç):
| Günlük dalgalanma SD | günlük tartı (22 nokta) | haftada 2-3 (8) | haftalık (4) |
|---|---|---|---|
| 0,3 kg | %0, ~1,6x | %4, ~2,1x | %24, ~2,6x |
| 0,5 kg | %5, ~2,2x | %31, ~3,0x | %51, ~3,1x |
| 0,8 kg | %28, ~3,1x | %56, ~3,8x | %69, ~3,4x |
Yorum: haftalık tartanlarda ve gürültülü günlerde çoğu zaman tarih kestirilemez; kestirilebildiğinde bile aralık 2-3 kat geniş (ör. 14–30 hafta). Güven düzeyi (%80) benim seçimim, raporda belirtilmemiş; SD değerleri varsayım, kullanıcı verisi değil.

**3. Dosyalar ve sınır.** `kernel/algo.js` (`ols`'a `se`, `goalEta`'ya `range`), `main/03-screens.js:108-109` (metin), `scripts/app.test.js:1643` (şu an tam olarak bir `~N hafta` ve "Son 3 haftanın eği…" ibaresini bekliyor; güncellenir). `InsightLib.fit` kopyası `Algo`'ya bağlanabilir (tekrarı azaltır) ama zorunlu değil. Sınır: `boundary.test.js` etkilenmez.

**4. Şema / yedek.** Yok (türetilmiş değer).

**5. Kullanıcı akışı ve metin (kural, karar noktası burası).**
- Aralık = hedef farkı / (eğim ± t·se), kilo verirken hızlı uç, güvenli hızla sınırlanmalı: uygulamanın kendi kuralı haftada `min(0,005·kg; 0,75)` kg (`algo.js:154`); hızlı uç bundan hızlı olamaz. Aksi halde "6 hafta" gibi uygulamanın kendi önerdiği hızın dışında bir beklenti doğar.
- Gösterim: aralık varsa "Hedefe yaklaşık 14–30 hafta (son 3 haftanın hızı sürerse)". İki uç aynı tam sayıya düşerse tek sayı.
- Aralık yoksa (eğim aralığı sıfırı/yanlış yönü içeriyor, yavaş uç 104 haftayı aşıyor, ya da yavaş/hızlı oranı belirlenen eşiği (öneri 2,5x) aşıyor): "Hızın değişken olduğu için hedef tarihi kestirilemiyor." Eski tek sayıya geri düşme yapma: belirsizliğin en büyük olduğu yerde sahte kesinlik göstermek önerinin amacına ters.
- Mevcut koşullar korunur: kalori freni varsa ETA gösterilmez (`03-screens.js:108`), hedef ulaşıldıysa yok.
60 yaş: tek cümle, grafik/yeni kontrol yok. Beklenen yan etki: bugün "~N hafta" gören haftalık tartan kullanıcıların çoğu artık "kestirilemiyor" görür; bu dürüst ama özelliğin görünür değerini düşürür.

**6. Kenar durumlar.** Tüm tartılar aynı değer (se=0): aralık dar, ama eğim ~0 olduğundan zaten null. n=4 iken df=2, t büyük, çoğunlukla null. Hedef yönü yanlış (kilo alırken hedef düşük): null. Son tartı 7 günden eski: eğim null (`algo.js:39`). `trend(w)` (EWMA) güncel kilo olarak kullanılıyor; bu değerin belirsizliği aralığa katılmıyor (nota yaz; küçük etki). lb birimi: aralık hafta cinsinden, birimden bağımsız.

**7. Testler.**
| Koşul | Dosya |
|---|---|
| `ols.se` bilinen seride el hesabıyla eşit; `goalEta.range` sentetik seride gerçek tarihi kapsar (sabit tohum) | `scripts/algo.test.js` (~31-35 yakını) |
| Eğim 0 / haftalık 4 nokta / ters yön / 104 hafta üstü: `range=null`, metin "kestirilemiyor" | `scripts/algo.test.js` |
| Hızlı uç güvenli hızla sınırlı | `scripts/algo.test.js` |
| Trend ekranı: aralık metni, kalori freninde yok | `scripts/app.test.js:1643` güncelle |

**8. Büyüklük ve yapılmama nedeni.** Küçük (~25 satır algo, ~10 satır arayüz, ~60 satır test). Yapılmama lehine: gerçekçi gürültüde sık sık "kestirilemiyor" çıkacak ve kullanıcı bugünkü tek sayıdan daha az bilgi görecek; yine de yanlış kesinlik yerine dürüstlük. Önceliği Dalga 1'in sonuna koy; gerçek tartı sıklığı bilinmeden (tek kullanıcı: ürün sahibi) değeri tahmin edilemez.

---

## 5. Hızlı metin kaydı — DEĞİŞTİR (Dalga 2'ye taşı)

**1. İddia doğrulaması.** Boşluk gerçek: tek yol ara-seç-porsiyon (`04-sheets.js:100-103`, `129-137`). Ama büyüklük iddiası çelişiyor: `beslenme.md:86` "orta" diyor, Dalga 1 "küçük". Ayrıca iki varsayım zayıf:
- Ölçü eşleme: 818 besinin yalnız 31'inde birden çok porsiyon var; porsiyon etiketi dağılımı (851 etiket, 47 farklı ölçü adı): "porsiyon" 228, "adet" 153, "tabak" 97, "kase" 78, "yemek kaşığı" 57, "dilim" 54, "çay bardağı" 5. Yani "3 yemek kaşığı pilav" gibi yazılanların çoğu o besinin kendi etiketleriyle eşleşmez. Ölçü dönüşümü uydurmak (ör. "tabak"="porsiyon") sessiz hata üretir; yalnız besinin kendi `u` listesi kullanılmalı.
- Ad ayrıştırma: 182/818 besin adı ayraç içeriyor (virgül, " ve ", "+", " ile"; ör. "Simit ve beyaz peynir", "Kaymak, bal ve ekmek"). Önce tüm parçayı ara, ad tam eşleşirse bölme; bölme ancak sonra.
Kendi prototipim (`proto5.js`, benim yazdığım 30 cümle, kullanıcı verisi değil, ayrıştırıcı basit: "kaşık" tek başına ve ayraçsız "domates salatalık" çözülmedi): 22 cümle sorusuz çözüldü, 6'sında ölçü besinin etiketleriyle uyuşmadı ("1 tabak kuru fasulye", "3 yemek kaşığı pilav", "1 avuç ceviz", "1 dürüm döner"...), 2'sinde besin bulunamadı. Bu doğruluk ölçümü değildir; yalnız ölçü uyuşmazlığının sık olduğunu gösterir. "2 yumurta" gibi girdilerde ilk arama sonucu "Haşlanmış yumurta" seçiliyor: sessiz varsayım, önizlemede görünmeli.

**2. Dosyalar ve sınır.** Yeni saf `modules/nutrition/quicklib.js` (index.html'de `foods.js` sonrası); arayüz `main/04-sheets.js` (`sheetFood`'a düğme + önizleme sayfası) veya yeni `nutrition/quickfoodui.js`. Kayıt: mevcut `addFoods(items,day,msg,undo)` (`04-sheets.js:81-84`) tek geri al ile birden çok yemek ekler; ancak `foodCalc` DOM'a bağlı (`$("#fqty")`, `curFood`, `curPor`, `:141-144`) ve `lo/hi` yalnız `goNutrition`'da set ediliyor (`:187`): hesap `foodAmount(food,por,q)` saf fonksiyonuna ayrılmalı ve `addFoods` `lo/hi` taşımalı (madde 3 ile ortak iş). Sınır: nutrition modülü içinde; `S.entries` yazımı `add()`/`addFoods` (çekirdek) üzerinden.

**3. Şema / yedek.** Yeni alan yok; kayıtlar mevcut yemek kaydı biçiminde (`text` = `"<ad>, <miktar> × <etiket>"`, `04-sheets.js:184`). Miktar `foodCalc` sınırı 0,1–20.

**4. Akış ve metin.** "Yemek ekle" > [Birden çok yemek yaz] > tek metin kutusu, örnek yer tutucu "2 dilim ekmek, 1 çay bardağı çay, yarım simit". [Hazırla] → önizleme listesi: her satır "Beyaz ekmek · 1 dilim (30 g) × 2 · 160 kcal" ve satır başına [değiştir] (en çok 3 alternatif çip + ölçü çipleri). Anlaşılamayan satır: "Ölçü anlaşılmadı, 1 porsiyon (150 g) varsayıldı" (turuncu, dokunulmadan kaydedilemez). Altta toplam ve [Hepsini ekle]; öğün çipleri mevcut (`mealChips`). Onaysız hiçbir kayıt yazılmaz. 60 yaş: tek kutu + tek düğme; ayrıntılar önizlemede. Klavye mikrofonu OS'ye ait; sesin buluta gidip gitmeyeceği NeoWell'in kontrolünde değil, gizlilik metnine tek cümle eklenmeli (rapor da "telefonda doğrulanmadı" diyor).

**5. Kenar durumlar.** Tırnaklı/yinelenen virgül, boş parça, çok uzun metin (sınır koy, ör. 15 satır = şablon sınırı `goTpl`), "yarım/bir buçuk/1,5/½", gram ("200 g tavuk"; her besinde `g/100·kcal` geçerli, etiket "200 g"), alt satırdaki aynı besin, 20'den büyük miktar, aralık (`lo/hi`) ve lif/şeker/sodyum alanlarının taşınması, `myFoods` ve tariflerin aranması (`allFoods()`), tarih seçici (`dayOptions`).

**6. Testler.** Parametrik tablo testi `scripts/quick.test.js` (yeni): ad+ölçü+miktar eşleme, ayraçlı ad (tam eşleşme önce), ölçü uyuşmazlığı → varsayılan porsiyon + bayrak, gram, bilinmeyen kelime → eşleşmedi, hiçbir girdi onaydan önce kayıt yazmaz. `scripts/app.test.js`: toplu ekleme tek geri al ile geri alınır; `lo/hi` ve besin alanları kaydedilir. `e2e/food.spec.js`: metin → önizleme → ekle; `access.spec.js` SHEETS. `senior.spec.js` dokunma sayıları (yemek 3 dokunuş korunur).

**7. Büyüklük.** Orta (`quicklib` ~120 satır, arayüz ~80, `foodCalc` ayrıştırma ~20, test ~120). Belirsizlik: Türkçe sayı sözcükleri ve ek durumları (ör. "ekmeği") için kural kapsamı, ölçü eşleme başarısı gerçek yazımlarla ölçülmedi.

**8. Yapılmama nedeni?** Değerli (ücretsiz, çevrimdışı); ama Dalga 1 ölçütü "küçük, düşük riskli" ile uyuşmuyor ve sessiz yanlış eşleşme riski yüksek. Öneri: Dalga 2'de, madde 3'teki `lo/hi` taşıma işi bittikten sonra.

---

## 6. Spor: RPE'ye duyarlı ilerleme + uzun aradan sonra hafif dönüş — DEĞİŞTİR (ikiye böl)

**1. İddia doğrulaması.** Doğru: `nextTarget` RPE ve tarih görmüyor (`algo.js:283-300`, `rpe` yok), tek çağrı `gym.js:144`, RPE set başına 6–10 / 0,5 adım saklanıyor (`gym.js:98`). Eksikler: (a) RPE yalnız `settings.rpeOn` iken girilir ve varsayılan **kapalı** (`01-core.js:47`, `gym.js:307`); erişim sınırlı. (b) Ama Strong/Hevy içe aktarma RPE'yi `rpeOn` kapalıyken de yazar (`importlib.js:99,181`): mantık `rpeOn`'a bağlanmalı. (c) **Ürün sözü ile çelişki:** ayar yardım metni "Yalnız kayıt içindir, önerileri ve hesapları değiştirmez" (`03-screens.js:207`); özellik gelince bu metin değişmeli. (d) Rapor kendi içinde tutarsız: "Ne yapar" RPE ≤7'de artışı önerir, "Risk" yalnız "tut" yönünü istiyor, test (c) "RPE 7 → mevcut artış". Burada yalnız "tut" yönü ele alınır.
Uzun ara: `gSuggest` tarihe bakmıyor (`gym.js:141-149`); son seans günü `h.w.day` mevcut (`gym.js:401`). `gSuggest` sonucu yalnız gösterilmiyor, **yeni antrenman setlerini ön dolduruyor** (`gAddEx`, `gym.js:163`) ve plaka/ısınma sayfasını besliyor (`exui.js:181`): düşürülmüş öneri bu üçüne de akar, ek düğme gerekmez, ama ön dolum sessizce değişir (kullanıcı görünür satırdan haberdar olmalı).

**2. Dosyalar ve sınır.** `kernel/algo.js` `nextTarget` (yeni girdiler `gapDays`, `rpeTop`), `modules/gym/gym.js` `gSuggest` (gün farkı ve yalnız `rpeOn` iken RPE geçirir), `main/03-screens.js:207` (yardım metni), `scripts/algo.test.js`, `gym2.test.js`. Sınır: gym kendi `S.workouts` verisini okur; kernel saf kalır.

**3. Şema / yedek.** Değişiklik yok (RPE zaten set alanı, `cleanGym` doğruluyor). Ayar eklenmiyor (14 gün ve 9,5 sabit).

**4. Kural ve metin.**
- Uzun ara (`gapDays>=14`, sabit; kaynaklı eşik değil): artış ve "aynı ağırlıkta +1 tekrar" kuralları yerine son çalışma ağırlığının %10 hafifi (`roundTo(kg*0.9,inc)`, 0'ın altına inmez; bar/dambıl yuvarlaması `gym.js:145-146` zaten sonra uygulanır). Mevcut "2 seans altında %10 düşür" kuralı zaten düşürüyorsa ikinci kez düşürme. Satır: "Öneri: 54 kg × 8. Uzun ara verdin (21 gün), ilk setlerde %10 hafif başla." (mevcut `sug` satırı, `gym.js:321`).
- RPE tut (yalnız `rpeOn`): son seansta en ağır çalışma setlerinden biri `rpe>=9,5` ve üst tekrara ulaşıldıysa artış verme: "Üst tekrara ulaştın ama zorlandın, bu sefer aynı ağırlıkta kal." (kg aynı, reps=üst). RPE yoksa eski davranış. Eşik 9,5 kaynaksız bir sabit (rapor yalnız RIR kavramına atıf yapıyor; o makale bu analizde açılmadı). "Artır" yönü (RPE ≤7 → erken artış) bu sürümde yok.
- Ayar yardım metni: "Zorluk yazarsan, çok zorlandığın seanslarda öneri ağırlığı artırmaz."
60 yaş: yeni kontrol yok; tek ek cümle.

**5. Kenar durumlar.** İlk kez yapılan egzersiz (geçmiş yok): `gSuggest` null. İçe aktarılmış eski geçmiş (ör. 1 yıl önce) uzun ara sayılır: doğru davranış. Vücut ağırlığı hareketi (kg=0): %10 anlamsız, uzun ara kuralı kg>0 için. Ters sistem saati/gelecekteki tarih: gün farkı negatif → kural uygulanmaz. Isınma ve drop setleri RPE'ye ve son ağırlığa katılmaz (`gRecOk`, `gym.js:27-28`). Zamanlı/kardiyo egzersizler `gKind!=="w"` ile zaten dışarıda.

**6. Testler.**
| Koşul | Dosya |
|---|---|
| `nextTarget`: RPE yoksa çıktı birebir eski; üst tekrar + RPE 9,5 → kg aynı; RPE 7 → mevcut artış; ısınma/drop RPE'yi etkilemez | `scripts/algo.test.js` (~36-68 bloğuna) |
| Uzun ara: 5 gün → eski çıktı; 20 gün → kg %10 düşük, `why` metni; bar yuvarlaması korunur; çift düşürme yok | `scripts/algo.test.js`, `gym2.test.js` |
| `rpeOn=false` iken geçmişte RPE olsa da yok sayılır | `scripts/gym2.test.js` |
| `gAddEx` ön dolumu hafif ağırlıkla gelir | `scripts/gym2.test.js` |
| Ayar yardım metni ve anahtar | `scripts/app.test.js:1429` çevresi |
| Salon ekranında "Uzun ara verdin" satırı (eski tarihli tohum antrenman) | `e2e/gym.spec.js` |

**7. Büyüklük.** Küçük: uzun ara ~15 satır algo + ~8 satır gym; RPE ~10 satır; testler ~70 satır. Belirsizlik: 14 gün ve 9,5 eşikleri sezgisel.

**8. Yapılmama nedeni?** RPE parçasının erişimi düşük (varsayılan kapalı, 60 yaş kullanıcı açmaz) ve yalnız "tut" yönü kazanç sınırlı; istenirse RPE parçası ertelenip yalnız "uzun ara" yapılabilir. Uzun ara parçası RPE'den bağımsız ve güvenlik yönünde: yapılmamasına gerekçe yok.

---

## 7. Rahat mod ve kilit bekleme süresi — DEĞİŞTİR (ikiye böl)

### 7a. Kilit bekleme süresi — UYGULA, "hemen" seçeneği RED

**1. İddia doğrulaması.** `LOCK_GRACE=30000` sabit (`lockui.js:4`, kullanım `:56`); Ayarlar metni "30 saniyeden uzun" de sabit yazılı (`03-screens.js:216`). Ancak "hemen" seçeneği güvenli değil: `document.hidden` değişen her akış kilidi tetikler, yalnız doğrulama penceresi `lockBusy` ile korunuyor (`lockui.js:54`). Paylaşım ekranı (`shareFile`, `shareui.js:23`; Drive'a yedek), dosya seçici ("Dosyadan oku"), barkod tarayıcı (`04-sheets.js:155`), OCR kamerası, izin pencereleri uygulamayı arka plana alır; 0 sn beklemede her dönüşte kilit çıkar, akış yarıda kesilir. 30 sn bile uzun Drive paylaşımlarında tetiklenebilir (telefonda denenmedi).

**2. Dosyalar.** `modules/data/lockui.js`, `main/01-core.js` (DEF + `cleanSettings`), `main/03-screens.js:216` (seçici + metin). Sınır: lockui zaten `S.settings` kullanıyor.

**3. Şema / yedek.** Yeni ayar `lockGrace` (saniye: 30 | 120 | 300). `cleanSettings`'te `act` gibi açık sıralı listeyle doğrulanmalı, yoksa her açılışta ve geri yüklemede düşer (`01-core.js:75-98`); geçersiz değerde 30. Yedekle birlikte taşınır (ayarlar S içinde); `nw_lockon` bayrağı (`01-core.js:227`) değişmez.

**4. Akış ve metin.** Ayarlar > Veri ve yedek > Uygulama kilidi kartında (kilit açıkken) üç seçenekli seçici: "Kilit ne zaman yeniden sorulsun?" [30 saniye (önerilen)] [2 dakika] [5 dakika]. Açıklama: "Uygulamadan çıkıp bu süre içinde dönersen kilit yeniden sorulmaz." Satır 216 metni seçime göre: "Açarken ve 2 dakikadan uzun aradan dönünce...". 5 dk seçeneğine kısa uyarı: "Telefonu başkası alırsa 5 dakika boyunca açık kalabilir."

**5. Kenar durumlar.** Kilit kapalıyken seçici görünmez. Telefonda ekran kilidi kalmayınca kilit kapanır (`lockui.js:35-37`); `lockGrace` korunur. Yeniden başlatmada kilit her zaman sorulur (süre yalnız arka plan dönüşü için).

**6. Testler.** `scripts/lock.test.js`: sahte saat ile 30/120/300 sn eşikleri (süre dolmadan dönüş kilit açmaz, sonra açar); geçersiz `lockGrace` 30'a düşer; yedek-geri yüklemede korunur (`data.test.js`/`backup.test.js`); `scripts/app.test.js`: Ayarlar metni seçime uyar. `e2e/access.spec.js` zaten `settings-data` ekranını tarar.

**7. Büyüklük ve yapılmama nedeni.** Küçük (~15 satır, ~40 satır test). Yapılmama nedeni yok, ama gerçek ihtiyaç kanıtı da yok (rapor "rakip kıyası yok, kanıt toplamadım" diyor): düşük öncelik.

### 7b. Rahat mod (büyük yazı, 56 px hedef) — DEĞİŞTİR: "küçük" değil, hedef 52 px, Dalga 2'ye al

**1. İddia doğrulaması.** Hedef 44 px alt sınırında: doğru (`a11y.js:9` eşiği 43,5). Ama "küçük, bir `data-comfy` kökü ve değişken değerleri" iddiası yanlış: dokunma hedefleri değişkenle yönetilmiyor; `app.css`'te `min-height:44px` 26 yerde, `width:44px;height:44px` 8 yerde, 48 px 9 yerde, 56 px 6 yerde ayrı ayrı yazılı (sayım `grep -o`). Antrenman set satırı ızgarası sabit sütunlarla (`.srow` `28px ... 44px`, `app.css:222-225`; `.sn.tb`, `.ok` 44 px) 360 px ekranda 56 px'e büyütülemez. Yazı yarısı ise mevcut ölçekleyiciyle zaten yapılabilir: tüm yazı boyutları `--fs-*` değişkenlerinde (107 `font-size:var(...)`, `app.css:17`) ve %200 testleri (`access.spec.js:96-142`) var. Ancak Ayarlar zaten "Yazı boyutu telefonun yazı boyutu ayarını izler" diyor (`03-screens.js:182`): yazı yarısı çoğunlukla işletim sistemi ayarının tekrarı; özgün değer dokunma hedefi yarısı ve ayarı bilmeyen kullanıcıya uygulama içinden erişim.

**2. Dosyalar.** `www/app.css` (yeni `--tap` değişkeni; ~35 bildirim `var(--tap)` olur; `:root[data-comfy]{--tap:52px;--fs-*...}`), `main/03-screens.js` (`render`'da `de.dataset.comfy`, tema gibi `:232`; Görünüm kartına anahtar `:182`), `main/01-core.js` (DEF `comfy:false`, boolean olduğu için `cleanSettings` kendiliğinden korur, `:82`). `scripts/design.test.js`: yazı ölçeği testi yalnız ilk `:root{}` bloğunu ve `font-size:` bildirimlerini okuyor (`:12-20`); override bloğu ayrı kuralda olduğundan geçer, yine de doğrulanmalı. Karşılama ekranına "büyük olsun mu?" sorusu ekleme: karşılama ekranı en az kontrollü kalmalı (`onboarding.spec.js:17`).

**3. Şema / yedek.** Tek boolean `comfy`. Yedeğe girer, `cleanSettings` korur. Başka şey yok.

**4. Akış ve metin.** Ayarlar > Görünüm ve erişilebilirlik: "Büyük yazı ve düğmeler" anahtarı, alt metin "Yazıları ve düğmeleri büyütür. Telefonun yazı boyutu ayarı da ayrıca çalışır." Mevcut "Yazı boyutu telefonun yazı boyutu ayarını izler." cümlesi buna göre güncellenir. Anahtar anında uygulanır (sayfa yeniden çizilir).

**5. Kenar durumlar ve risk.** Telefon yazı ölçeği %200 + rahat mod birleşimi 320 px'te taşabilir (testte `scaleText(2)` + `comfy` birlikte). Antrenman set ızgarası, takvim hücreleri, grafik dokunma alanları ve alt menü muaf tutulur; muafiyet testte açıkça yazılmalı (kabul koşulu "hiçbir hedef 55,5 px altında değil" gerçekleşemez). Yatay mod (`landscape.spec.js`) ayrı denenmeli. PDF/CSV/widget etkilenmez.

**6. Testler.**
| Koşul | Dosya |
|---|---|
| Açıkken `targets()` tüm `SCREENS`'te ≥51,5 px (muaf liste açık) ve `overflow()` 320 px'te boş; `scaleText(2)` + comfy birlikte | `e2e/access.spec.js` |
| En küçük yazı ≥16 px, kontrol sayısı ≤45 | `e2e/senior.spec.js` |
| Yatay mod taşma | `e2e/landscape.spec.js` |
| `comfy` yedekten geri yüklenince korunur; tasarım testleri (ölçek, yarıçap, koyu tema) geçer | `scripts/data.test.js`, `scripts/design.test.js` |

**7. Büyüklük.** Orta: CSS değişkene çevirme ~35 yer + ekranların elle gözden geçirilmesi + e2e kapsamı; ~1-2 iş günü eşdeğeri, yaklaşık 100 satır CSS/JS ve 80 satır test. Belirsizlik: gerçek telefonda 52 px'in rahatlığı ve düzen kayması denenmedi.

**8. Yapılmama nedeni?** Yazı yarısı işletim sistemi ayarını tekrarlıyor; ölçülen bir kullanılabilirlik hatası yok (`senior.spec.js` geçiyor, `kullanilabilirlik-gizlilik.md:55`). Değer gerçek 60 yaş kullanıcıyla denenmeden kanıtsız. Dalga 1 yerine Dalga 2'ye ve telefon testi sonrası karar.

---

## Çelişkiler ve belge düzeltmeleri

1. **Madde 2b:** `kullanilabilirlik-gizlilik.md` Ö5 "yedek doğrulanmıyor" der; otomatik yedek zaten bayt bayt doğrulanıyor (`BackupFolderPlugin.java:135-215`). `dogrulama.md` bunu KABUL etmiş.
2. **Madde 2a:** "mantık hazır" ve "3 dokunuş" kabulü yanlış: `goRestore` DOM'a bağlı; dokunuş ≥6; "Mevcut veriler değişecek" metni boş telefonda yanlış.
3. **Madde 3:** `beslenme.md` Ö3 "veri hazır, gösterim eksik" der; veri tekrar/favori/şablon yolunda kaybolur (`loglib.js:6,9-14`, `04-sheets.js:82`). "Az yağlı/Orta/Yağlı" düğmeleri `foods.js:3-7`'deki `lo/hi` anlamlarıyla çelişir.
4. **Madde 4:** `rehber-analiz.md` Ö3 "`se` zaten hesaplanıyor" ve "hafta-hizalı pencere": `se` kernel'de yok (`coach/` altında), pencere zaten 3 hafta ve "Kilo hızı" ile aynı olmak zorunda.
5. **Madde 5:** `beslenme.md:86` "orta" ile Dalga 1 "küçük" çelişir.
6. **Madde 6:** `hareket-spor.md` Ö1 "artır" ve "yalnız tut" iki yönde tutarsız; `03-screens.js:207` "önerileri değiştirmez" sözü ile çelişir; `rpeOn` varsayılan kapalı.
7. **Madde 7:** `kullanilabilirlik-gizlilik.md` Ö7 "küçük" ve "hiçbir hedef 55,5 px altında olmasın" ölçütü ızgara düzeniyle bağdaşmaz; Ö8 "hemen" seçeneği paylaşım/seçici/tarayıcı akışlarını bozar.
8. `oncelik.md` "RED çıkan olmadı" cümlesi, bu analizden sonra güncellenmeli: kısmi RED'ler var (yazıldıktan sonra doğrula, "hemen", üç düğme, hafta-hizalı pencere).

## Önerilen uygulama sırası

1. Madde 2a + 2b (yeniden tanımlı): B9 imza göçü için gerekli, `restoreFrom` çekirdeği ortak.
2. Madde 3 (önce `lo/hi` taşıma, sonra gösterim) ve madde 6 (uzun ara parçası).
3. Madde 1, madde 7a.
4. Madde 4 (gerçek tartı sıklığı görüldükten sonra), madde 5 ve 7b'yi Dalga 2'ye taşı.
