# Ar-Ge raporu: kullanılabilirlik, gizlilik, veri taşınabilirliği (uygulama geneli)

Takım: kullanilabilirlik-gizlilik. Tarih: 2026-10-10 (tüm "erişim tarihi" bu gündür). Kod incelemesi: `main` @ 4f27ce2. Kod değiştirilmedi, commit atılmadı.

## 1. Kapsam ve baktığım rakipler

Kapsam: onboarding, Bugün, Daha fazla, Ayarlar, widget, hatırlatmalar, yedek/dışa aktarma (CSV, PDF, parolalı yedek, otomatik klasör yedeği), uygulama kilidi, gizlilik ekranı, erişilebilirlik, 60+ kullanılabilirliği, Play veri güvenliği.

Rakiplerde **sayfası doğrudan okunanlar** (WebFetch ile içerik alındı):

| Uygulama | Sayfa | Not |
|---|---|---|
| Medisafe | help-center.medisafe.com/en/articles/8103174 | rapor/paylaşım |
| mySugr | mysugr.com/support/en/can-i-import-and-export-data | dışa/içe aktarma |
| Bearable | bearable.app/?p=18810 | dışa aktarma |
| Simple (BP Passport) | simple.org/patient-privacy | gizlilik politikası |
| Daylio | daylio.net/faq/docs/daylio-faq/tutorials/pdf-export/ ve daylio.net/faq/backup-file-manual-import-and-export/ | PDF ve yedek |
| Fitbit / Google Health | support.google.com/fitbit/answer/14236615 | dışa aktarma |
| Google Fit | support.google.com/fit/answer/3024190 | Takeout |
| Samsung Health | samsung.com/us/support/answer/ANS10001379/ | yalnız kısmen (aşağıda) |

Standart/rehber kaynakları (doğrudan okundu): W3C WCAG 2.2 Understanding 2.5.8; Android Erişilebilirlik Yardımı "Touch target size"; Android Health Connect Medical Records (2 sayfa); HL7 FHIR R4 Blood Pressure profili; Play Console "Data safety" tanım sayfası; GDPR m.20.

Doğrudan okunamayanlar (MyFitnessPal ve Yazio yardım sayfaları 403 verdi; Apple Health sayfasının gövdesi gelmedi) 6. bölümde. "Hiçbir rakipte yok" diyebilmek için 6 uygulama yeter; bu rapor yalnızca **yardım/gizlilik sayfalarına** baktı, uygulamanın kendisini kurup denemedi. Bu yüzden aşağıda "incelenen sayfalarda rastlanmadı" ifadesi kullanılır, "hiçbirinde yok" denmez.

### Rakiplerden doğrulanan olgular (URL, 2026-10-10, alıntı/özet)
- Medisafe: "All reports are limited to one year back" ve iOS'ta kullanıcı biçim ve tarih aralığı seçip e-postayla gönderir. https://help-center.medisafe.com/en/articles/8103174-how-can-i-share-a-report-of-my-medication-history
- mySugr: "mySugr Basic and PRO users can export their data as a CSV report"; PDF ve Excel yalnız PRO; "Unfortunately, we do not have an option to import data from Excel or CSV files." https://www.mysugr.com/support/en/can-i-import-and-export-data
- Bearable: Ayarlar > Data + Security > My Data > Export My Data, dönem 3 ay / 6 ay / tümü; sayfa dosya biçimini adlandırmıyor ("data file"). https://bearable.app/?p=18810
- Simple (BP Passport): "All data you input into the app (blood pressures, reminders, and other records) are stored locally on your device"; ama "Resolve to Save Lives collects analytical data about your use of the BP Passport App using Google Firebase." https://simple.org/patient-privacy
- Daylio: "The PDF file is best for sharing with friends, family or consultants, and doctors." https://daylio.net/faq/docs/daylio-faq/tutorials/pdf-export/ ; "The Backup File contains all your entries, moods, activities, and settings." (elle dışa/içe aktarılır) https://daylio.net/faq/backup-file-manual-import-and-export/
- Fitbit/Google Health: Google hesabı ile girenler için "follow the instructions for How to download your Google data"; yalnız GPS antrenmanı TCX olarak adlandırılıyor, diğer biçimler adlandırılmıyor. https://support.google.com/fitbit/answer/14236615?hl=en
- Google Fit: "We recommend downloading and viewing Takeout exports from a desktop computer, not a mobile device." (CSV/JSON dosyaları) https://support.google.com/fit/answer/3024190?hl=en
- Samsung Health: sayfa yalnızca "you can download and view the data" diyor; biçim ve geri yükleme sayfada yok. https://www.samsung.com/us/support/answer/ANS10001379/
- Health Connect: "Medical Records extends this capability to include basic medical data in Fast Healthcare Interoperability Resources (FHIR) format"; FHIR R4 (4.0.1) ve R4B (4.3.0), Observation ve MedicationStatement dahil; Jetpack sürümü Android 16 SDK ile derlemeyi gerektiriyor. https://developer.android.com/health-and-fitness/health-connect/medical-records ve .../medical-records/data-format
- FHIR: "This profile defines how to represent Blood Pressure observations in FHIR using a standard LOINC code" (85354-9; sistolik/diyastolik bileşen). https://hl7.org/fhir/R4/bp.html
- WCAG 2.2 SC 2.5.8 (AA): "The size of the target for pointer inputs is at least 24 by 24 CSS pixels". https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Android Erişilebilirlik Yardımı: "The recommended target size for touchscreen objects is 7-10mm." https://support.google.com/accessibility/android/answer/7101858?hl=en
- Play: "'Collect' means transmitting data from your app off a user's device"; yalnız cihazda işlenip gönderilmeyen veri bildirim dışı. https://support.google.com/googleplay/android-developer/answer/10787469
- GDPR m.20: veri "a structured, commonly used and machine-readable format" ile alınabilir. https://gdpr-info.eu/art-20-gdpr/ (NeoWell veri toplamadığı için yasal yükümlülük değil; yalnızca ölçüt olarak.)

## 2. Bizim mevcut durumumuz (kanıtlı)

**Ölçüm (e2e/senior.spec.js, bu oturumda koşuldu, 4/4 geçti; e2e/access.spec.js 30/30 geçti, axe WCAG 2.1 AA ihlalsiz):**

| Ekran | Kontrol sayısı | En küçük yazı | Kaydırma (ekran) |
|---|---|---|---|
| Bugün | 22 | 14 px | 2,2 |
| Rehber | 3 | 14 px | 1,2 |
| Salon | 37 | 14 px | 1,7 |
| Trend | 14 | 14 px | 2,3 |
| Daha fazla | 16 | 14 px | 2,4 |
| Ayarlar | 9 | 14 px | 1,4 |

Dokunma sayısı: su 1, kilo 2, yemek 3, uyku sayfasını açma 2 (`e2e/senior.spec.js:37-45`). Sonuç: ölçülen bir kullanılabilirlik **hatası yok**; erişilebilirlik tabanı güçlü. Aşağıdaki bulgular ölçüm hatası değil, kod okumasından çıkan akış boşluklarıdır ve öyle işaretlidir.

**Dokunma hedefi eşiği:** testler 43,5 px altını hata sayar (`e2e/a11y.js:9,11`, `e2e/access.spec.js:31,90`). Android 1 CSS px = 1 dp = 1/160 inç = 0,159 mm olduğundan Google'ın 7-10 mm önerisi 44-63 dp eder (hesap: 7/0,15875 = 44,1; 10/0,15875 = 63). Yani hedeflerimiz önerilen aralığın **alt sınırında**. En küçük yazı sabit 14 px (`www/app.css:17`); uygulama içinde yazı/hedef büyütme ayarı yok (`grep textScale|fontScale|bigText` boş; yalnız Android sistem yazı ölçeği WebView'e yansır).

**Onboarding** (`www/modules/data/onboardui.js`): hoş geldin + 3 adım, "Şimdilik geç" her yerde (`:53,:78`), 18 yaş altı durdurulur (`:23,:55`). Karşılama ekranında **yedekten geri yükleme yolu yok** (`:52-53` yalnız Başla / Şimdilik geç); yeni telefonda kullanıcı atlayıp Ayarlar > Veri ve yedek'e gitmek zorunda. Arama: `grep "restore|geri yükle" onboardui.js` sonuç yok.

**Yedek (üç ayrı giriş, farklı parola akışı):** (a) Ayarlar > Veri: "Yedeği Drive'a gönder" (`www/main/03-screens.js:216`, `backupui.js:22-46`); (b) "Yedekle veya geri yükle" sayfası: yedek metni için büyük metin alanı, iki parola alanı, Kopyala / Paylaş / Dosyadan oku / Bu metinden geri yükle birlikte (`www/main/04-sheets.js:220-226`; ikinci parola alanı yalnız yedek içindir ama geri yüklemede de görünür); (c) Otomatik klasör yedeği (`backupui.js:59-121`). Şifreleme sağlam: PBKDF2 600 000 yineleme + AES-GCM, parola kuralı 10 karakter (`backupui.js` ve `backuplib.js:4,32-35`). Yedek, Rehber API anahtarlarını da içerir (`backupui.js:7`) ve bu sayfada belirtilir (`04-sheets.js:222`). Fotoğraflar yedeğe girmez (`www/modules/data/photolib.js:2`, `privacyui.js:20`). Yedeğin açılabildiğini doğrulayan adım yok: gönderim sonrası "Drive'da dosyanın göründüğünü kontrol et" (`backupui.js:45`), otomatik yedek yazılınca yalnız tarih güncellenir (`:104-107`). Geri yüklemede önizleme var ("N kayıt yüklenecek", `04-sheets.js:247`).

**CSV:** 9 ayrı tablo (`grep -c "Data.csv.push" www/modules` = 9), her biri tek tek paylaşılır ("zincirleme paylaşım ekranı açılmayabilir", `privacyui.js:41-46`); `;` ayırıcı, ondalık virgül, UTF-8 BOM (Türkçe Excel için, `csvlib.js:2`). Tek dosyada tam dışa aktarma ve genel (şemalı) JSON yok; `fhir|openmhealth` araması www ve docs'ta yalnız Health Connect'le ilgisiz eşleşmeler verdi (kodda FHIR/Open mHealth yok). İçe aktarma yalnız Strong/Hevy antrenman CSV'si (`www/modules/gym/importui.js:2`); kilo/tansiyon/şeker içe aktarma yok. Health Connect yalnız **okur**: adım, uyku, nabız (`www/modules/pulse/hcui.js:2`, `docs/play-permission-declarations.md:26`).

**Hekim raporu:** dört ayrı giriş: Son 7 gün (`weeklyui.js:3`), Tansiyon, Şeker (dönem seç, `vitalsui.js:166-192`), Tahlil (`www/main/03-screens.js:96`). Birleşik tek rapor yok; ilaç uyumu yalnız haftalık rapora girer (`docs/roadmap.md:34`). PDF sayfaları canvas'tan JPEG olarak üretilir (`www/modules/data/shareui.js:5-11`, `lablib.js:273`): metin seçilemez/aranamaz, ekran okuyucu içeriği okuyamaz (kod okumasından çıkarım, PDF'i açıp denemedim).

**Gizlilik:** tek uzun sayfa: 3 özet satır + tıbbi uyarı + 3 açılır bölüm + rıza metni + önizleme anahtarı + rıza durumu + 12 kategori silme satırı (`www/modules/data/privacyui.js:13-39`). "İnternete çıkanlar" **yazıyla** anlatılır (`:22-30`); kullanıcının gerçekte ne zaman ne gönderildiğini gösteren kayıt yok. Tek sayaç Rehber jeton kullanımıdır (`coach.js:234-237`). Kodda ağ çağrısı yeri üç tane: Open Food Facts (`www/main/04-sheets.js:167`), Rehber sohbeti (`coach.js:246`), Rehber model listesi (`coach.js:261`); `index.html:130` yerel dosya okur. Android yedeği kapalı: `scripts/patch-android.js:42-44`, test `scripts/android.test.js:36`; arka plan konumu derlemede çıkarılır (`patch-android.js:8`, `android.test.js:44`). Çekilen ham şablon manifesti (`AndroidManifest.xml:5,54`) bunlardan önceki halidir; hata sayılmadı.

**Kilit** (`www/modules/data/lockui.js`): telefonun ekran kilidi, parola saklanmaz; 30 sn sabit bekleme (`:4`), ayarlanamaz; telefonda kilit kalmazsa uygulama kilidi kendiliğinden kapanır (`:35-36`), kullanıcı kilitli kalmaz. **Bildirim:** ilaç adı bildirimde varsayılan kapalı (`01-core.js` `medShowName:false`, `medui.js:14`). **Widget:** su, kalan kcal, adım (`03-screens.js:263-266`). Bildirim kanalı `nw_med` kilit ekranında görünür (`MainActivity.java:38`), ama içerik adı gizlidir.

## 3. Boşluk tablosu

| Özellik | Rakipte durum (kaynaklı, bölüm 1) | Bizde (kanıtlı) | Fark |
|---|---|---|---|
| Veri cihazda mı kanıtı | Simple: politika sözü + Firebase analitiği (simple.org). Diğer incelenen sayfalarda kullanıcıya gösterilen ağ kaydı rastlanmadı | Yazıyla anlatım, ağ kaydı yok (`privacyui.js:22-30`); ağ noktası 3 | Fırsat: denetlenebilir "çıkış defteri" |
| Biçim: tek dosyada tam dışa aktarma | Daylio: tek yedek dosyası (elle dışa/içe); Bearable: tek "data file", biçim adsız | 9 ayrı CSV; yedek yalnız parolalı JSON, uygulama dışında okunmaz; foto yedekte yok | Fırsat: açık, şemalı tam arşiv |
| Standart biçim (FHIR/Open mHealth) | İncelenen 8 sayfada rastlanmadı; Health Connect FHIR tıbbi kaydı destekliyor (Android 16 SDK) | Yok | Fırsat: izinsiz FHIR R4 Bundle dosyası |
| İçe aktarma | mySugr: CSV/Excel içe aktarma yok | Yalnız antrenman CSV'si | Fırsat: genel kilo/tansiyon/şeker CSV |
| Hekim raporu | Medisafe: e-posta, en çok 1 yıl; mySugr: PDF yalnız PRO; Daylio: doktorlar için PDF | 4 ayrı rapor, haftalık 7 gün; JPEG sayfalar | Fark: birleşik rapor ve metin katmanı |
| Yeni telefona geçiş | Daylio: yedek dosyasını içe aktarma menüsü (karşılama ekranında olup olmadığı DOĞRULANAMADI) | Karşılamada yok, 3 yedek girişi | Sadelik fırsatı |
| Dokunma hedefi | WCAG 24 px asgari; Google 7-10 mm öneri | 44 px = alt sınır, yazı 14 px sabit | Küçük açık: "Rahat mod" |
| Yedeğin doğrulanması | Doğrulanamadı | Yok | Fırsat |

## 4. Öneriler (öncelik sırasıyla)

### 1. "Telefondan çıkanlar" çıkış defteri (denetlenebilir yerel-öncelikli kanıt)
- **Ne yapar:** Gizlilik'te "Son 30 gün: telefondan N istek çıktı" listesi. Her satır: zaman, hedef (Open Food Facts / Rehber sağlayıcı adı), ne tür veri (barkod numarası / kullanıcı onaylı metin), boyut (bayt). Sıfır istekte "Hiçbir şey çıkmadı" yazar.
- **Neden ileride:** İncelenen 8 sayfada kullanıcıya gösterilen ağ kaydı rastlanmadı; Simple veriyi yerelde tutar ama Firebase analitiği toplar (simple.org). Play "collect"u cihaz dışına gönderim sayar (support.google.com/googleplay/android-developer/answer/10787469); defter bu tanımın uygulama içi kanıtıdır.
- **Dayanak:** üç ağ noktası `04-sheets.js:167`, `coach.js:246`, `coach.js:261`; Rehber gidenin önizlemesi zaten var (`privacyui.js:32`), sayaç `coach.js:229-237`; kayıt `Data` kaydı gibi çekirdekte ortak yardımcı olmalı (`www/kernel/kernel.js:12`; sınır kuralı: çekirdek modülü tanımaz, modüller çekirdeği çağırır, `docs/boundary-map.md`). Defter `localStorage` benzeri küçük halka tampon; içerik değil yalnız üst veri.
- **Kapsam:** küçük-orta. 3 çağrı noktası + bir kernel sarmalayıcı + gizlilik sayfasında bir bölüm.
- **Risk:** (1) Ekran "telefondan çıkan her şey" iddia edemez: ML Kit/Play hizmetleri trafiği WebView'den görünmez, `docs/play-data-safety.md` bunu zaten "doğrulanmadı" diye işaretliyor; başlık "Uygulamanın kendi gönderdikleri" olmalı. (2) 60 yaş: ham liste yerine tek cümlelik özet ve "Ayrıntı" açılır bölümü. Yeni izin yok.
- **Kabul:** barkod okutunca defterde bir satır çıkar; Rehber gönderimi onaysız satır eklemez; yeni `fetch(` ekleyen kod defter sarmalayıcısını kullanmazsa birim testi (kaynak taraması) kırılır; axe ve 44 px testi geçer.

### 2. Tek dosyada tam arşiv + FHIR R4 tansiyon Bundle (şifresiz, okunabilir)
- **Ne yapar:** "Tüm verimi dışa aktar" tek düğme: açık şemalı JSON (tüm modüller) tek dosya olarak paylaşılır; parolalı yedeğin yerine geçmez, dosya şifresizdir ve ekranda bu söylenir. Tansiyon için ayrıca FHIR R4 Observation (LOINC 85354-9, sistolik/diyastolik bileşen) içeren Bundle seçeneği.
- **Neden ileride:** İncelenen 8 sayfada FHIR/Open mHealth dışa aktarması rastlanmadı; biçim adı bile verilmeyen örnekler var (Bearable, Fitbit). Health Connect tıbbi kayıt için FHIR R4/R4B kabul eder (developer.android.com, yukarıda), yani biçim Android ekosistemiyle uyumlu; fakat Health Connect'e yazmak ayrı, riskli bir iştir (aşağıda reddedilenler).
- **Dayanak:** modüller `Data.csv` satırlarıyla dışa veri veriyor (`csvlib.js:13-19`, `kernel.js:12`); aynı kayıt kalıbıyla `Data.archive` eklenir (modül sınırı korunur, her modül kendi alanını yazar). Tansiyon kaydı `S.vitals` (`vitalsui.js`, `vitalslib.js`), birim dönüşümü `unitlib.js`.
- **Kapsam:** orta. JSON arşiv küçük; her modülün satırını eklemek ve birim/şema sürümü yazmak işin çoğu. FHIR yalnız tansiyon için başlar.
- **Risk:** Doğruluk: FHIR için yalnız LOINC 85354-9 doğrulandı; kilo ve şeker kodları uygulama sırasında HL7 vital-signs profilinden okunup teyit edilmeden eklenmez (DOĞRULANAMADI listesinde). Hukuk: tıbbi cihaz iddiası yok, yalnız kullanıcının girdiği değerin biçim dönüşümü ("Observation" ölçüm kaydı, yorum yok). Gizlilik: şifresiz dosya paylaşım yerine gider (CSV ile aynı uyarı, `privacyui.js:44`). İzin yok. 60 yaş: yalnız "Veri ve yedek" altında tek satır; FHIR "Hekim/uzman için" altında gelişmiş bölümde.
- **Kabul:** arşiv dosyası JSON.parse ile okunur, kayıt sayıları ekrandaki sayılarla eşit; FHIR Bundle resmi HL7 doğrulayıcısından (ya da şema kontrolünden) geçer; fotoğraf ve API anahtarı arşive girmez; şifresizlik uyarısı sayfada.

### 3. Hekim için tek rapor (birleşik, dönem seçmeli)
- **Ne yapar:** Tek "Hekim raporu" girişi: son 30/90 gün seçilir; kilo, tansiyon, şeker, ilaç uyumu, varsa tahlil tek PDF'te yorumsuz tablo olarak çıkar. İsteğe bağlı büyük punto (yazdırma için).
- **Neden ileride:** Medisafe raporu 1 yılla sınırlı ve e-postayla gider; mySugr PDF yalnız PRO; Daylio PDF "doktorlar için" ama günlük girişleri sıralar (kaynaklar yukarıda). Ücretsiz, hesapsız ve cihazdan çıkmadan hazırlanan birleşik hekim PDF'ini incelenen sayfalarda göremedim.
- **Dayanak:** haftalık (`weeklyui.js:3`, `weeklylib.js`), tansiyon/şeker (`vitalsui.js:166-192`), tahlil (`lablib.js:273`), PDF yardımcısı `canvasPdf` (`shareui.js:5`). İlaç uyumu zaten rapora girer (`roadmap.md:34`).
- **Kapsam:** orta. Sayfalar mevcut çizicilerden toplanır; yeni iş: dönem seçici ve sayfalama. Metin katmanlı PDF (seçilebilir/ekran okuyucu) font gömme gerektirir: ayrı büyük iş, ilk sürümde yok.
- **Risk:** hukuki/Play: rapor yorum, eşik, "normal/yüksek" etiketi içermez (`play-data-safety.md` karar 4 ile tutarlı). JPEG sayfa erişilebilir değil: ilk sürümde rapor altına aynı verinin CSV'si paylaşılabilir. 60 yaş: tek düğme, iki seçenek (30/90 gün).
- **Kabul:** 90 günlük sahte veriyle üretilen PDF modülsüz kapalıyken ilgili bölümü atlar (tansiyon kapalıysa tansiyon yok); sayfa taşması yok (`overflow` testi); "yorum yok" metin taraması (yasaklı sözcükler) geçer.

### 4. Yeni telefonda geri yükleme: karşılamada "Yedeğim var" + tek "Yedek" ekranı
- **Ne yapar:** Karşılama ekranında "Yedeğim var" düğmesi: dosyayı seç, parolayı yaz, "N kayıt yüklenecek" onayı. Ayarlar'da üç yedek girişi tek "Yedek" ekranında birleşir: Şimdi yedekle / Otomatik / Geri yükle. Metin alanı ve "Kopyala" gelişmiş bölüme iner.
- **Neden ileride:** Daylio'da yedek dosyası elle içe aktarılır (daylio.net); karşılama ekranında olup olmadığı doğrulanamadı. Biz için kanıt: karşılamada hiç yol yok (`onboardui.js:52-53`).
- **Dayanak:** geri yükleme mantığı `goRestore` (`04-sheets.js:238-260`), önizleme onayı (`:247`), `obNeeded` (`onboardui.js:12`), yedek ekranı (`04-sheets.js:220-226`, `03-screens.js:216-218`).
- **Kapsam:** küçük-orta. Mantık hazır; iş ekranları düzenlemek. Ek olarak mevcut e2e (`backup.spec.js`, `onboarding.spec.js`) güncellenir.
- **Risk:** geri yükleme yanlış telefonda mevcut veriyi ezmesin: boş telefonda sorun yok, doluysa mevcut onay metni korunur (`:247`). 60 yaş: karşılama ekranına tek düğme eklenir, adım sayısı artmaz.
- **Kabul:** yeni kurulumda karşılamadan, 3 dokunuş içinde (Yedeğim var, dosyayı seç, Yükle) önceki verilerle Bugün ekranı açılır; yanlış parolada mesaj ve veri değişmez; kontrol sayısı Ayarlar'da artmaz (`senior.spec.js` ≤45).

### 5. "Yedeği doğrula" ve yedek sağlığı satırı
- **Ne yapar:** Yedek yazıldıktan sonra uygulama dosyayı aynı parolayla açıp kayıt sayısını okur ve "Yedek doğrulandı: 1 240 kayıt" der; otomatik yedekte son yedek satırı aynı şekilde sayı gösterir.
- **Neden ileride:** İncelenen sayfalarda yedeğin yazıldıktan sonra doğrulandığına dair ifade rastlanmadı (DOĞRULANAMADI sayılmaz, yalnızca bulunmadı). Bizim akış doğrulamayı kullanıcıya bırakıyor: "Drive'da dosyanın göründüğünü kontrol et" (`backupui.js:45`).
- **Dayanak:** `BackupLib.decrypt` (`backuplib.js:18-22`), `backupJson` (`backupui.js:7`), `abRun` (`:96-113`).
- **Kapsam:** küçük (≈30 satır).
- **Risk:** parola bellekte kısa süre tutulur (zaten `backupui.js:34-40` öyle); ek maliyet 600 000 yineleme ≈ saniyeler, ilerleme göstergesi gerekir. 60 yaş: tek cümlelik sonuç, ek ayar yok.
- **Kabul:** bozuk dosya ya da yanlış parola "Doğrulanamadı" gösterir; doğru dosyada kayıt sayısı `S.entries` ile eşit; otomatik yedek başarısızsa mevcut hata akışı (`:108-111`) çalışır.

### 6. Genel CSV içe aktarma (kilo, tansiyon, şeker) önizlemeli
- **Ne yapar:** Başka uygulamadan alınan tablo (tarih + değer sütunları) seçilir; uygulama sütunları tahmin eder, ilk 5 satırı gösterir, kullanıcı onaylayınca kayıtlar eklenir; tekrar eden günler atlanır.
- **Neden ileride:** mySugr CSV/Excel içe aktarmayı açıkça desteklemiyor (mysugr.com yukarıda). Samsung Health biçimi ve dışa aktarılan dosyanın geri alınıp alınamayacağı doğrulanamadı; bu yüzden hedef biçim "genel", belirli bir rakibe bağlı değil.
- **Dayanak:** antrenman içe aktarma kalıbı ve önizleme/onayı (`importui.js:2-12`, `importlib.js`), temizleyiciler (`buildState`, `04-sheets.js:244`), birim ve doğrulama aralıkları (`RANGES`, `onboardui.js:21`).
- **Kapsam:** orta. Sütun eşleme ve tarih biçimi tahmini işin çoğu (Türkçe ondalık virgül, `csvlib.js`).
- **Risk:** yanlış eşleme sağlık kaydı kirletir: her zaman önizleme ve geri alma ("N kayıt eklendi, Geri al") şart. Tıbbi iddia yok. 60 yaş: gelişmiş menüde, varsayılan görünür değil.
- **Kabul:** `;` ve `,` ayırıcılı örnek dosya doğru okunur; aralık dışı satırlar listelenip atlanır; tekrar içe aktarma çift kayıt oluşturmaz.

### 7. "Rahat mod": büyük yazı ve 56 px hedef, tek anahtar
- **Ne yapar:** Ayarlar'da (ve karşılamada tek soru: "Yazılar ve düğmeler büyük olsun mu?") yazıyı 16-18 px'e, dokunma hedefini 56 px'e çıkarır.
- **Neden ileride:** Google 7-10 mm önerir (44-63 dp); biz alt uçtayız. İncelenen sayfalarda uygulama içi yazı/hedef boyutu anahtarı rastlanmadı (yalnız yardım sayfası kapsamı; uygulamaları denemedim).
- **Dayanak:** tüm yazı boyutları CSS değişkenlerinden gelir (`www/app.css:17`); testler için ölçeği zorlayan `scaleText` hazır (`e2e/a11y.js:14-20`); `a11y.js:9` eşiği.
- **Kapsam:** küçük. Bir `data-comfy` kökü ve değişken değerleri; ekranların taşmama testi mevcut (`access.spec.js:100`).
- **Risk:** büyütme, 360 px ekranda taşma yapabilir; 200 % yazı testleri yeniden koşturulmalı. İzin yok.
- **Kabul:** açıkken `targets()` hiçbir hedefin 55,5 px altında olmadığını bildirir; `overflow()` 320 px'te boş; `senior.spec.js` eşikleri (yazı ≥14 px) geçer.

### 8. Kilit bekleme süresi seçeneği (hemen / 30 sn / 5 dk)
- **Ne yapar:** Uygulama kilidi açıkken, arka plandan dönünce ne kadar sonra tekrar sorulacağı seçilir. Sık uygulama değiştiren kullanıcıda kilit sürekli çıkmaz.
- **Neden ileride:** Rakip kıyası yok (kanıt toplamadım); salt kullanılabilirlik iyileştirmesi, diğer önerilerden düşük öncelik.
- **Dayanak:** `LOCK_GRACE=30000` sabit (`lockui.js:4`, `:56`).
- **Kapsam:** küçük.
- **Risk:** "hemen" seçeneği 60+ kullanıcıyı sık doğrulamaya iter; varsayılan 30 sn kalır.
- **Kabul:** seçilen süreden önce dönüşte kilit çıkmaz, sonra çıkar; ayar yedekten geri yüklenince korunur.

## 5. Reddettiğim fikirler

- **Apple Health export.xml içe aktarma:** biçim ve zip yapısı doğrulanamadı, `www/vendor` içinde zip kütüphanesi yok; ek kütüphane ve doğrulanmamış şema riski.
- **Health Connect'e tıbbi kayıt yazma (FHIR):** Android 16 SDK ile derleme, deneysel API, yeni izin ve Play Sağlık beyanı gerekir; risk: Play politikası. Dosya tabanlı FHIR (öneri 2) aynı değeri izinsiz verir.
- **Bulut hesabı / sunucu yedeği, otomatik arka plan yedeği:** hesap yok kuralı; ayrıca veri WebView'de, native taraf okuyamaz (`backupui.js:55-57`).
- **Hekimle canlı paylaşım bağlantısı (QR/URL):** sunucu gerektirir.
- **Genel tema/animasyon cilası, yeni onboarding adımları:** ölçülen sorun yok (`senior.spec.js` geçti); adım eklemek 60+ için yük.
- **Bildirim içeriğini kilit ekranından tümüyle kaldırma:** zaten varsayılan gizli (`medui.js:14`).

## 6. DOĞRULANAMADI listesi (öneriye dayanak değildir)

1. MyFitnessPal: dışa aktarmanın yalnız Premium olduğu, üç CSV'nin e-postayla geldiği (yardım sayfası 403; yalnız arama özeti).
2. Yazio: dışa aktarmanın yalnız PRO ve CSV olduğu (yardım sayfası 403; yalnız arama özeti).
3. Apple Health: "Export All Health Data" XML dışa aktarması (sayfa gövdesi alınamadı; yalnız arama özeti).
4. Samsung Health: JSON/CSV biçimi, dışa aktarılan dosyanın geri yüklenemediği (resmi sayfa bunları içermiyor; yalnız topluluk/arama özeti).
5. Google Fit'in kapanış tarihi ve veri taşıma ayrıntıları (yalnız üçüncü taraf blog).
6. Daylio'da PDF'in Premium şartı (resmi PDF sayfası belirtmiyor); Daylio karşılama ekranında yedekten geri yükleme olup olmadığı.
7. Material 3'ün 48 dp önerisi (m3.material.io sayfasını okumadım); raporda yerine Google Erişilebilirlik Yardımı'nın 7-10 mm ifadesi kullanıldı.
8. Open mHealth şema listesi ve lisansı (okunan sayfada şema adları ve lisans yoktu).
9. FHIR'da kilo ve kan şekeri için kod listesi (yalnız 85354-9 doğrulandı).
10. Bearable'ın dışa aktarma biçimi (resmi sayfa "data file" diyor).
11. Medisafe raporunun PDF olup olmadığı ve "izleyicileri (tansiyon, nabız) dahil etme" (resmi sayfada yalnız biçim/tarih ve 1 yıl sınırı okundu).
12. Uygulamaların kendisi kurulup denenmedi: "yardım/gizlilik sayfalarında rastlanmadı" ifadeleri uygulama içi varlığı dışlamaz.
