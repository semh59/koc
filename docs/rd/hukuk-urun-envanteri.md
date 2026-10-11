# NeoWell: hukuki analiz için ürün olgu envanteri

Kapsam: yalnız olgu; yorum ve mevzuat değerlendirmesi yok. Kaynak: kod (`www/`, `assets/android/`, `scripts/patch-android.js`, `.github/workflows/apk.yml`) ve `docs/`. Dosya yolları `D:\PROJECT\koc` köküne göredir; kısaltma: `coach.js` = `www/modules/coach/coach.js`, `coachlib.js` = `www/modules/coach/coachlib.js`.
Doğrulama: `node scripts/autosend.test.js` bu oturumda "All passed" verdi. `node` ile `Algo.riskFlags` + `CoachLib.contextText` ve `PiiLib.mask` örnek girdilerle çalıştırıldı (bölüm 1.4 ve 3'te sonuçlar).
`android/` klasörü git'te yok (`.gitignore:2`), yerel kopya eski üretimdir. Yayınlanan APK `scripts/patch-android.js` ile yamalanır ve CI denetler. Bu yüzden Android olguları yama ve CI dosyasından alındı.

## 1. Veri akışı

### 1.1 Rehber'e giden her alan
Tek çıkış: `cAsk` (`coach.js:328`) → `callProvider` (`coach.js:241`). Gövde `cMessages` (`coach.js:214`) ile kurulur. Her istek `gate` (`coach.js:213`, `piilib.js:115`) ile maskelenir. Sabit kural metni (SYSTEM) maskelenmez.

| Parça | İçerik | Kanıt |
|---|---|---|
| Sistem istemi | Sabit SYSTEM + `NOT:` (varsa) + `contextText(cData())` | `coach.js:219`, `coachlib.js:273-294` |
| Mesaj geçmişi | Açık sohbetin son `HIST_N=10` mesajı (`role!=="sys"`). Kullanıcı metni ilk 300 karakter. Rehber yanıtı ilk 260 karakter + onaylanmış log kartı (en çok 4 kalem) JSON olarak. Menü, program, "neden" istekleri geçmişsiz (`noHist`) | `coach.js:6,220,206-209`, `coach.js:481,565,463` |
| Mevcut kullanıcı mesajı | Geçmişin içinde (son mesaj olarak), ayrı eklenmez. Girdi alanı 600 karakter (`index.html:29`, `coach.js:349`) | `coach.js:218-222` |
| Profil | boy, yaş (5 yıllık aralık, alt sınır 18), cinsiyet, hareket düzeyi | `coachlib.js:297,313` |
| Sağlık notu | `healthNote`, 500 karakter, tek satıra indirgenir. Onboarding'de işaretlenen "hamilelik/emzirme/yeme bozukluğu geçmişi" ve "hekim kontrolü/düzenli ilaç" cümleleri bu nota yazılır | `coachlib.js:314`, `onboardui.js:54-55,105` |
| Hedefler | hedef kilo, kalori, su, haftalık spor | `coachlib.js:315` |
| Hesaplanan | trend kilo, kilo hızı, tahmini harcama, önerilen hedef, protein aralığı | `coachlib.js:317`, `coach.js:149-166` |
| Güvenlik freni satırı | `KISIT: <neden>` (bkz. 1.4, türetilmiş bayraklar) | `coachlib.js:318`, `coach.js:154` |
| Son 14 gün tablosu | gün, kilo, kcal, protein, su, spor dk, adım (+ uyku saat, ruh hali 1-5 varsa) | `coachlib.js:319-328`, `coach.js:179-182` |
| Bugünkü kayıtlar | en çok 12 yemek (ad 40 karakter, kcal, protein), su toplamı, son tartı, en çok 5 spor (ad 30 karakter, dk), en çok 3 not (100 karakter) | `coach.js:185-186` |
| Antrenman | son 3 antrenman (hareket adları, en iyi set), bu haftaki bölge başına set sayısı | `coach.js:187,189`, `coachlib.js:331-332` |
| Notlar | son 7 günün en çok 3 notu | `coach.js:188`, `coachlib.js:333` |
| İlaçlar | `medOn` açıksa: ad (30), doz (20), saatler, haftanın günleri, 7 günlük uyum, stok, en çok 8 ilaç | `coach.js:200-204`, `coachlib.js:329,334-337` |
| Menü/program isteği | istek metni, menü notu (200 karakter, alerji/kısıt), katalog: kendi besinler (20), favoriler (10), şablonlar (8) + yerleşik liste; program için egzersiz kataloğu (en çok 60) | `coach.js:494-503,559-565,470` |
| Kapalı kategori listesi | Kapatılan kategorilerin adları ("paylaşılmıyor") | `coachlib.js:312` |
| Anahtar | İstek başlığında (bkz. 1.5) | `coach.js:80,246` |

Sistem istemindeki kullanıcı metni `oneLine` ile satır sonu ve bölüm başlığı kelimeleri etkisizleştirilerek veri olarak girer (`coachlib.js:36-38`).

### 1.2 Kategori anahtarları gerçekten uygulanıyor mu
Evet. Sekiz anahtar: Profile, Weight, Food, Water, Activity, Sleep, Notes, Meds (`coach.js:168-169`). Hepsi `cData` içinde filtre olarak kullanılır (`coach.js:176-189`). Test: `scripts/coach2.test.js:118-127` ("sharing off: food, weight, note, exercise and sleep never reach the context"; profil kapalıyken sağlık notu ve hedefler gider, kalori açığı/oruç önerilmez).
Sınırlar (kodda):
- Profil açık, Kilo kapalıyken `cCalc()` yine çalışır, yalnız sayısal alanlar sıfırlanır; `block` ve `why` (KISIT satırı) kalır (`coach.js:189`).
- Profil kapalıyken KISIT satırı gönderilmez (`block:""`), model "profil paylaşılmadığı için kalori açığı ve oruç önerme" diye uyarılır (`coachlib.js:312`).
- Varsayılanlar: `shareProfile/Weight/Food/Water/Activity/Sleep/Notes/Meds: true` (`01-core.js:47`). Yani sekizi de varsayılan AÇIK. Rıza ekranında anahtarlar "Açık rızamı veriyorum" düğmesinin hemen üstünde, açık halde görünür (`coach.js:731`).
- Gizlilik sayfasındaki rıza düğmesi (`privacyui.js:43`) anahtarları göstermez. Rıza metni "aşağıdan her veri türünü tek tek kapatabilirsin" der (`coach.js:687`). Anahtarlar o sayfada yok; Ayarlar > Rehber (`coach.js:771`) ve Rehber sekmesindeki rıza kartında.
- Anahtar değişimi anında kaydedilir ve toast verir (`coach.js:171-174`).

### 1.3 Gönderim hangi koşulda olur
`cAsk` çağıranlar (statik çağrı grafiği testiyle sabit, `autosend.test.js:29`): `cFlush`, `cComment`, `cMenu`, `cProgram`, `cWhyAsk`.

| Yol | Tetikleyici | Kanıt |
|---|---|---|
| Sohbet mesajı | Gönder düğmesi (`data-c="send"`); örnek soru çipleri; "Bu kaç kalori?" sayfası | `coach.js:929,998,928`, `coach.js:348-358` |
| Bekleyen mesaj | "Şimdi gönder / Tekrar dene" düğmesi. Açılışta kendiliğinden gitmez | `coach.js:736,930`, `autosend.test.js:46,52,54` |
| Gün/hafta yorumu | Düğme | `coach.js:606-620` |
| Menü, program | Düğme | `coach.js:476,559` |
| "Rehber'e yorumlat" | Düğme (kartta) | `coach.js:458,647` |
| Kurulum doğrulama / model listesi | Düğme; yalnız anahtar + sabit "Sadece 'tamam' yaz." cümlesi. Rıza olmadan da çalışır; yaş kapısından (≥18) geçer | `coach.js:825-833,834-851`, `coach.js:906,913` |

Aynı kullanıcı eyleminde ek otomatik istekler (kullanıcı onayı yeniden istenmez):
- JSON kuralına uymayan veya kayıt cümlesinde kayıt çıkarmayan yanıt için ikinci istek ("Önceki yanıt kurala uymadı...") (`coach.js:381-386`).
- Uzunluk sınırında kesilen yanıt için 3 kat jetonla yeniden deneme (`coach.js:252`).
- Kuyrukta başka bekleyen mesaj varsa `cFlush` kendini yeniden çağırır (`coach.js:394`).
- Zincir: `usable()` listesindeki her sağlayıcı sırayla denenir; biri hata verirse aynı veri sıradaki sağlayıcıya gider (`coach.js:334-343`). Sağlayıcıya özgü onay (Gemini her seferinde, özel sağlayıcı oturumda bir kez) `sendOk` ile sorulur (`coach.js:300-314`).

Kapı koşulları: `coachOn()` = `consent && yaş≥18 && provOk()` (`coach.js:681`). Aksi hâlde `cAsk` hata verir (`coach.js:329`). Rıza yokken yazılan mesaj telefonda "Gönderilmedi" olarak kalır (`coach.js:373,736`).
Acil/kendine zarar bayrağı (`emergency`, `mind`) olan mesaj sağlayıcıya GİTMEZ: `m.pend=false`, yalnız güvenlik kartı (`coach.js:353-356`). `check` ve `ed` mesajlar gider ve istemin `NOT` bölümüne ihtiyatlı yanıt talimatı eklenir (`coach.js:377`).
Ekranda ve ayarlarda "Rehber bağlıysa sabah, öğleden sonra ve akşam bildirim metinlerini her gün yeniden yazar" cümlesi var (`03-screens.js:216`). Arama: `cAsk`/`callProvider` çağıranları yalnız `coach.js` içinde (grep `cAsk\(|cFlush\(|callProvider\(` `www/`, `www/main/05-notifications.js` dahil). Bildirim yazan bir Rehber çağrısı bulunamadı. Cümle koddaki gerçek davranışla uyuşmuyor ve "otomatik gönderim yok" beyanıyla çelişiyor görünür.

### 1.4 Rehber'e ASLA gitmeyenler (kanıt) ve istisna
`cData` yalnız `Log` (yemek, su, tartı, spor, not, adım), `Habits` (uyku, ruh hali), `Gym`, `Meds`, ayarlar kullanır (`coach.js:175-204`). Arama: `Labs.|Vitals.|Pulse.|Cycle.|Measures.|Photo|Fast.` `coach.js` ve `coachlib.js` içinde sonuç yok.

| Veri | Durum | Kanıt |
|---|---|---|
| Tahlil, tansiyon, şeker ölçüm DEĞERLERİ | Gitmez | Yukarıdaki arama; `CONSENT_NOT` `coach.js:686` |
| Nabız (kamera/saat), Health Connect nabzı | Gitmez | aynı |
| Health Connect adımı | Gitmez: HC kaynaklı günlerde yalnız telefon sensörü adımı (`e.ph`) | `coach.js:141` |
| Health Connect uykusu | Gitmez: günün ilk kaydı HC ise `undefined` | `coach.js:143` |
| Vücut ölçüleri, oruç, döngü, tarifler, ilerleme fotoğrafı, konum, yedek | Gitmez (kod yolu yok) | arama; `coach.js:686` |

İSTİSNA (türetilmiş bayrak): güvenlik freni `Algo.riskFlags` `soft` listesine "Son 90 günde şeker ölçümün var", "Son 90 günde tansiyon ölçümün var", "İlaç kaydın var" ve sağlık notundan "Sağlık notunda hekim takibi gerektiren bir durum geçiyor" cümlelerini koyar (`algo.js:117-132`). `cCalc` bunları `out.why` içine yazar (`coach.js:154`), `contextText` de `KISIT: <why>` olarak sağlayıcıya gönderir (`coachlib.js:318`). Koşul: Profil kategorisi açık, bir blok var, kullanıcı "Hekimime danıştım" demedi. Örnek çıktı (node ile üretildi): `KISIT: Son 90 günde şeker ölçümün var; Son 90 günde tansiyon ölçümün var. Kalori açığı ve oruç önerme, hekime yönlendir.` Değerler gitmez; ölçüm yapıldığı bilgisi gider. İlaç modülü kapalıyken bile "İlaç kaydın var" gidebilir (Meds anahtarına bağlı değil). Bu bilgi `CONSENT_SENT` listesinde (`coach.js:684`) yazmıyor.
Not: kullanıcı serbest metne (not, sağlık notu, yemek adı, mesaj) ne yazarsa gider; metin süzgeci kimlik bilgisini maskeler, sağlık içeriğini maskelemez.

### 1.5 Giden isteğin biçimi
- URL: `taban + "/chat/completions"` (Anthropic: `taban + "/messages"`); yöntem POST (`coach.js:246`). Model listesi: GET `taban + "/models"` (Anthropic `?limit=1000`) (`coach.js:261`).
- Tabanlar (yerleşik, `https://`): `integrate.api.nvidia.com/v1`, `api.groq.com/openai/v1`, `openrouter.ai/api/v1`, `generativelanguage.googleapis.com/v1beta/openai`, `api.openai.com/v1`, `api.anthropic.com/v1` (`coach.js:67-72`). Özel sağlayıcı: kullanıcının yazdığı `https://` adres (`coach.js:888,901`). Yerleşik sağlayıcıların adresi yedek/bozuk kayıttan değiştirilemez (`coach.js:90-91`, `04-sheets.js:270`).
- Başlıklar: `Content-Type: application/json` + `Authorization: Bearer <anahtar>`; Anthropic: `x-api-key`, `anthropic-version: 2023-06-01`, `anthropic-dangerous-direct-browser-access: true` (`coach.js:80,246`). Anahtar URL'de ve gövdede değil, yalnız başlıkta.
- Gövde: `model`, `messages` (veya Anthropic'te ayrı `system`), `temperature:0.3`, `max_tokens` (OpenAI: `max_completion_tokens`, `reasoning_effort:"low"`) (`coach.js:270-282`). Anthropic'te sabit kural bloğuna `cache_control: ephemeral` eklenir (`coach.js:269`). Kullanıcı kimliği, cihaz kimliği, uygulama sürümü alanı yok.
- Taşıma: `CapacitorHttp` etkin (`capacitor.config.json`), yani `fetch` yerel HTTP ile gider. CSP `connect-src 'self' https:` (`index.html:10`). OFF isteği özel `User-Agent: NeoWell/1.0 (kisisel kullanim)` ekler (`04-sheets.js:167`).
- Ağ günlüğü: `NetLog` (`netlog.js`): satır = zaman, tür (`chat`/`models`/`off`), host, gövde bayt sayısı, başarı. İçerik tutulmaz. En çok 100 satır, 30 gün, `localStorage` anahtarı `nw_netlog`; yedeğe girmez (yorum `netlog.js:2`; yedek `{S,keys}` taşır, `backupui.js:7`). Gizlilik ekranında listelenir, "Defteri temizle" ve "Tüm verileri sil" siler (`privacyui.js:12-20,64`, `07-actions.js:50`). Google barkod/OCR trafiği listede yok (`privacyui.js:13,19`). `fetch(` çağrıları: Rehber, model listesi, OFF hepsi `NetLog.fetch` üzerinden; tek istisna aynı kaynaktan betik okuma (`index.html:131`, `autosend.test.js:25`).
- Önizleme: "Rehber'e giden metni önizle" anahtarı (`piiPrev`, varsayılan KAPALI, `01-core.js:47`, `privacyui.js:41`) açıksa her gönderimden önce tam maskelenmiş metin gösterilir, Gönder/İptal (`coach.js:303-321`).

## 2. Rıza akışı

| Olgu | Durum | Kanıt |
|---|---|---|
| Rıza metni | `consentBody()`: gönderilenler (`CONSENT_SENT`), gönderilmeyenler (`CONSENT_NOT`), ne zaman (`CONSENT_WHEN`), kime (etkin ve sağlık verisi açık sağlayıcı adları), "yurt dışı aktarım" ifadesi, seçim, geri alma, "Onay vermezsen uygulama tam çalışır" | `coach.js:684-687` |
| Metin nerede | Rehber sekmesi: kart + "Detaylar" akordeonu; Gizlilik ve veri sayfası: "Rehber açık rıza metni" akordeonu | `coach.js:730-731`, `privacyui.js:40` |
| Rıza düğmesi | Tek düğme "Açık rızamı veriyorum"; onay kutusu yok. Yalnız yaş ≥18 ise görünür | `coach.js:731`, `privacyui.js:43`, `coach.js:714-715` |
| Önceden işaretli | Rıza kendisi işaretli değil (`consent:false`). Veri kategorisi anahtarlarının sekizi varsayılan AÇIK (1.2) | `01-core.js:47` |
| Rıza kaydı | `consent` (bool), `consentV` (sayı, şu an 2), `consentAt` (yalnız gün `YYYY-AA-GG`), `consentP` (rıza anındaki etkin sağlayıcı id listesi). Rıza metni sürümü yalnız numara; metnin kendisi saklanmaz. Geri almada tarih silinir (`consentAt:""`), geri alma kaydı tutulmaz | `coach.js:714-717`, `01-core.js:47,90-91` |
| Sürümleme | `CONSENT_V=2`. Yüklemede `consentV!==CONSENT_V` ise rıza düşer (`cleanSettings`). Testler: `CONSENT_V===2` ve v1 düşer; metin ile politika eşitliği. Metin değişince sürümün otomatik artmasını zorlayan test yok (kod yorumu elle artırma ister, `coach.js:674,683`). Sürüm nedeniyle düşen rıza için özel bildirim bulunamadı (`consentWarn` yalnız sağlayıcı ve yaş durumlarını yazar, `coach.js:689`) | `01-core.js:72,90`, `app.test.js:2789` |
| Sağlayıcı değişince | `provOk()`: anahtarı olan ve etkin her sağlayıcı `consentP` içinde değilse `coachOn()` yanlış; kart "Sağlayıcı listen değişti... yeniden onay ver" der. Yeni anahtar kaydedilince toast. `consentP` yoksa (eski kayıt) da yeniden sorulur | `coach.js:677-681,689,852` |
| Rıza metnindeki sağlayıcı listesi | Anahtarı olmasa da `on && health` olan tüm sağlayıcıları sayar (varsayılan: NVIDIA Build, Groq, OpenRouter) | `coach.js:687`, `coach.js:66-74` |
| Geri alma | Rehber sekmesi/Ayarlar > Rehber "Geri al" ve Gizlilik "Rızamı geri al": `cConsent(false)` yalnız `consent/consentV/consentAt/consentP` sıfırlar. Sohbet, anahtar, kategori anahtarları silinmez | `coach.js:716,770,933-934`, `privacyui.js:43,67` |
| Yaş kapısı | `consentOk()` = `age>=18`. Yaş ayarlanınca/değişince `cAgeGuard` rızayı düşürür. Yaş girilmemişse de Rehber kapalı | `coach.js:675-676,682`, `06-events.js:71` |
| Rızasız Rehber | Çalışmaz: `cAsk` ilk satırda `coachOn()` ister; `cFlush` rızasızken çıkar; düğme tabanlı işler `coachBlocked()` ile durur (menü/yorum). Yerel menü ("Cihazda oluştur") ağ kullanmaz | `coach.js:329,373,531-535,550-558`, `autosend.test.js` ("without consent the button is disabled") |
| "Rıza vermezsen uygulama çalışır" | Çekirdek modüller `coach.js` dışında, `cAsk`'a bağımlı değil. Rehber olmadan çalışan yerel özellikler: kayıt, hesap, yerel menü, plato kartı | `coach.js:550,589`, `autosend.test.js:29` |
| Rıza öncesi ağ | Kurulumda (anahtar + sabit cümle, model listesi) rıza olmadan istek gider; yaş ≥18 şart | `coach.js:825-851` |
| Yedekten geri yükleme | Rıza, kategori anahtarları ve `noticeOk` bu telefondakiler korunur, yedektekiler alınmaz. Yedekteki sağlayıcı listesi gelir; yeni etkin/anahtarlı sağlayıcı `consentP`'de yoksa yeniden onay gerekir. `cAgeGuard` yaş 18 altıysa düşürür | `04-sheets.js:264-266`, `coach.js:679` |
| Yedek dosyasındaki rıza alanı | Yedek `S` içinde `consent*` alanlarını taşır ama `cleanSettings` sürüm eşleşirse kabul eder; ardından `goRestore` mevcut telefondaki değerlerle ezer | `backupui.js:7`, `01-core.js:90`, `04-sheets.js:266` |
| Açılış uyarısı | Hoş geldin ekranında NOTICE + "Başla/Yedeğim var/Şimdilik geç" | `onboardui.js:70` |

## 3. Maskeleme (PII)
Mekanizma: `PiiLib.mask` kural listesi (`piilib.js:56-81`), son kapı `maskMsgs` (`piilib.js:115`, `coach.js:213,246`). Geri çevirme: `unmask` (`piilib.js:119`). Aynı değer aynı etiketi alır. Yakalanan türler: e-posta, URL/alan adı, @hesap, TR IBAN, Luhn geçen kart, 11 haneli sayı (TC; sağlama aranmaz), telefon, plaka, "hasta adı/ad soyad:" etiketli alan, hasta/protokol/dosya/kimlik/SGK/barkod no etiketli alan, doğum tarihi/yılı (anahtar sözcükle), adres kalıpları (mah/sok/cad/apt/bulvar, no/kat/daire bağlamlı, posta kodu), unvanlı ad (Dr., Doktor...), "ben/annem/..." + ad, "Benim adım X", ad listesi (285 ad, ek ve ASCII yazım dahil), "X Hanım/Bey", kurum (… Hastanesi/Okulu/Bankası...), il (85) ve ilçe (51) listesi (ek veya "yaşıyorum" bağlamıyla).
Kodun kendi beyanı (başlık `piilib.js:3`): nadir ad, düzyazı adres/yol tarifi, tek başına il adı, sıradan sözcük gibi yazılan küçük harfli ad yakalanmaz; tam garanti yok. Aynı beyan: `privacyui.js:38`, `privacy-policy.md:51`.
Örnek çalıştırma (node): "Adım John Smith" → "Adım [AD1]"; "Muhammed Ali Kaya" → "[AD1] Kaya" (soyadı kalır); "pasaport U12345678 ve ssk 1234567890" → değişmedi; "tansiyon 120/80 şeker 95 diyabetim var" → değişmedi (sağlık içeriği maskelenmez, tasarım gereği); "Kızım Zeynep ile Kadıköy Moda Mah. Bahariye Cad. No:5 de yaşıyorum" → ad ve adres etiketlendi.
Serbest metin/sağlık notu: aynı süzgeçten geçer (`coach.js:219-220`; `contextText` çıktısı `mk(...)` ile). Sağlık notu için ayrı bir temizleme veya uyarı yok; not düzenleme ekranında yalnız `cNoteCheck` (kendine zarar/acil/yeme bozukluğu/hamilelik işareti) çalışır (`06-events.js:40`, `coach.js:363-369`). Telefonda toast: "Kimlik bilgisi gibi duran N parça maskelendi" (`coach.js:323-327`). Günlük kayıt metinleri (yemek adı, spor adı) süzgeçten geçer; yemek adları ad listesinden muaf (`piilib.js:21-22`, `coach.js:213`).

## 4. Güvenlik ve içerik

### 4.1 Sistem istemi (SYSTEM, `coachlib.js:273-294`)
Kimlik: "Hekim değilsin ve tanı koymazsın" (satır 273). Yasak/yönlendirme:

| Kural | Madde |
|---|---|
| İlaç, doz, takviye tedavisi önerme | 5 |
| İlaç/takviye sorularında (doz, etkileşim, başlama, bırakma) yorum yok; hekim/eczacıya yönlendir | 11 |
| Çok düşük kalori/hızlı kilo kaybı önerme; hamilelik, emzirme, 18 yaş altı, yeme bozukluğu geçmişi, ciddi hastalık, ilaç varsa kalori açığı önerme, hekime yönlendir; "KISIT" varken açık/oruç/yüksek protein yok | 3 |
| Baş dönmesi, bayılma, göğüs ağrısı, nefes darlığı, çarpıntıda önce hekim; acilde 112 ve `flag:"safety"` | 4 |
| Yeme bozukluğu işaretinde kısıtlama önerme, uzmana yönlendir | 6 |
| Kas/eklem/sırt ağrısı ve sakatlıkta tanı, tedavi, egzersiz reçetesi yok | 10 |
| Program verirken hekim uyarısı; hamilelik/ameliyat/ciddi hastalık/18 yaş altı ve yeme bozukluğunda sınırlar | 12 |
| Sayıları yalnız HESAPLANAN ve SON 14 GÜN'den al; kalori hedefini kendin değiştirme (`propose`, kullanıcı onaylar) | 1, 2 |
| Veride olmayanı sor, tahmin yürütme; log değerleri tahmin | 7, 8, 9 |
| Çıktı: tek JSON `{reply,log,propose,flag,food}`; yanıt ~90 kelime; Türkçe | 273, 289-294 |

Yanıt dili: SYSTEM Türkçe konuşmayı ister (`coachlib.js:273`); koda gömülü dil zorlaması yok. Arayüz yalnız Türkçe (`index.html:2` `lang="tr"`; dil seçeneği/çeviri katmanı bulunamadı; arama: `i18n|navigator.language` sonuç yok). Hata metinleri Türkçe sabit (`coachlib.js:270`, `coach.js:528`); sağlayıcının ham hata gövdesi (ilk 600 karakter) bellekte tutulur, kullanıcıya sınıflandırılmış Türkçe metin gösterilir (`coach.js:238,283`).

### 4.2 Yerel güvenlik katmanı (modelden bağımsız)
- `redFlag` (`coachlib.js:11-33`): dört seviye `mind` (intihar/kendine zarar), `emergency` (bayılma, göğüs ağrısı, nefes darlığı, felç, zehirlenme/aşırı doz...), `ed` (kusma, tıkınma, laksatif, günlerce aç...), `check` (baş dönmesi, çarpıntı, titreme...). "Baklavaya bayılıyorum" gibi deyimler ayıklanır (`coachlib.js:17-20`). Test: `scripts/coach.test.js:11-17`.
- Kart metinleri: acil → "112'yi ara"; kendine zarar → "112'yi ara ya da yanındaki birine söyle"; `ed` → hekim/psikolog/diyetisyen; `check` → hekim (`coach.js:624-632`). Kartın altında "Yapay zekâ rehberi hekim değildir, tanı koymaz." (`coach.js:631`). Kart `mind`/`emergency` için mesajı sağlayıcıya göndermeden gösterir (1.3).
- Modelden gelen `flag:"safety"` → `check` kartı (`coach.js:405`).
- Kalıcı fren: sohbette `ed`/hamilelik işareti `chatRisk` olarak kalır, yeni sohbet veya sohbet silme kaldırmaz (`coach.js:359-361`, `01-core.js:93,299-305`, `03-screens.js:195`).
- Sağlık notu ve menü notu da taranır; `mind`/`emergency` kart, hamilelik/emzirmede menü yapılmaz (`coach.js:363-369,544-548`).
- Kalori/oruç freni: `Algo.riskFlags` (`algo.js:117-132`): sert (18 yaş altı, yeme bozukluğu işareti, hamilelik/emzirme, BMI<18,5, hedef BMI<18,5) kullanıcı kaldıramaz; yumuşak (sağlık notu, ilaç kaydı, şeker/tansiyon ölçümü) 30 gün "Hekimime danıştım" ile kalkar (`01-core.js:314`). Uygulandığı yerler: kalori önerisi `clampKcal` (taban max(1200, BMR, %75 TDEE)) (`coachlib.js:211-216`), `kcalBlocked` (`coach.js:397,408,996`), program (`coach.js:478-479`), menü (`coach.js:506-518`), oruç (`habitui.js:25,36-37`, bilgi sayfası + kutu `habitui.js:31-32`), el ile kalori (`01-core.js:309-312`).
- Yanıt ayrıştırma/doğrulama: tolerant JSON ayrıştırma, yanıt en çok 1500 karakter (`coachlib.js:66-82`); `cleanItems` (en çok 12 kalem, aralık sınırları, günlük kcal 6000 üstü atılır), `cleanFood`, `cleanProgram` (yalnız kütüphane id'leri), `cleanMenu` (yalnız katalog id'leri) (`coachlib.js:89-168`). Kayıt ve hedef önerileri kullanıcı onayı ister (kart: "Günlüğe ekle/Onayla", "Uygula") (`coach.js:414-428,650,996`). Yanıt METNİNİN içeriğini (ilaç, doz, teşhis sözcükleri) denetleyen bir çıkış süzgeci bulunamadı (arama: `reply` işleyen kod `coachlib.js:66-82` ve `coach.js:398-411`; yalnız kırpma ve ayrıştırma).

### 4.3 "Yapay zekâ üretti / hekim değildir" etiketi
| Yer | Metin | Kanıt |
|---|---|---|
| Rehber ilk ekran (yalnız anahtarsız ve boş sohbette) "Verin nereye gider?" | "Rehber yapay zekâ kullanır..." | `coach.js:723-725` |
| Rıza kartı | "Rehber" + sağlayıcıya gider; kart yapay zekâ sözcüğü geçmez, madde metinleri | `coach.js:730` |
| Güvenlik kartı (her seviye) | "Yapay zekâ rehberi hekim değildir, tanı koymaz." | `coach.js:631` |
| Açılış (hoş geldin ve mevcut kurulum için bir kez) | NOTICE: "Rehber yapay zekâ kullanır ve yanılabilir..." | `onboardui.js:4-5,70`, `06-events.js:108` |
| Program kartı | "Genel bilgidir, kişisel antrenman ya da tıbbi tavsiye değildir..." | `coach.js:637`, `gym.js:426` |
| Menü kartı | "Tahmin" rozeti + "Tıbbi diyet ya da hastalık menüsü değildir" | `coach.js:641` |
| Yemek/kayıt kartı | "Tahmin" rozeti | `coach.js:653,665` |
| Normal sohbet balonu (Rehber yanıtı) | Etiket yok. Yanıt balonunda yalnız metin; gün/hafta yorumunda "Günün yorumu / Haftanın yorumu, saat" etiketi | `coach.js:737-740` |
| Giriş alanı | "Rehbere yaz" (yapay zekâ ibaresi yok) | `index.html:29` |
| Gizlilik, Hakkında, Oruç, Onboarding son adım | MED_NOTE: "NeoWell tıbbi cihaz değildir, tanı koymaz ve tedavi önermez; hekim yerine geçmez. Sağlık kararların için hekimine danış." | `01-core.js:73`, `privacyui.js:27`, `03-screens.js:225`, `habitui.js:32`, `onboardui.js:91` |
| Tansiyon/şeker/tahlil ekranları | "Bu değerleri hekiminle değerlendir." | `app.test.js:2216` |

Yanıtı bildirme/geri bildirim: mekanizma bulunamadı. Arama (`www/`, vendor hariç): `geri bildirim|şikayet|sikayet|feedback|report|mailto:` sonuç yalnız PDF "rapor" ve kod yorumları; beğeni/bildir düğmesi yok. Yalnız kullanıcı kartı/mesajı silebilir (`dismiss`, `delchat`, `clearchat`).

## 5. Kullanıcıya gösterilen hukuki/uyarı metinleri

| Metin | Yer | Tam içerik (kısaltmasız anahtar cümleler) |
|---|---|---|
| NOTICE | `onboardui.js:4` | "NeoWell bir tıbbi cihaz değildir ve hekim yerine geçmez. Rehber yapay zekâ kullanır ve yanılabilir; sağlıkla ilgili kararları hekiminle ver. Acil bir durumda 112'yi ara." Hoş geldin ekranında; mevcut kurulumda `noticeOk` onaylanana kadar bir sheet ("Anladım") (`onboardui.js:5,23`) |
| MED_NOTE | `01-core.js:73` | Bkz. 4.3 |
| Gizlilik ve veri sayfası | `privacyui.js:22-48` | Verin nerede; İnternete çıkanlar (OFF, Rehber, Google barkod tarayıcı, Drive); maskeleme beyanı; kullanım sayacı; ağ günlüğü; rıza metni; silme kategorileri |
| Rıza metni | `coach.js:684-690` | Bölüm 2 |
| Onboarding son adım özeti | `onboardui.js:91` | "Verilerin yalnızca telefonunda durur. Rehber'i açarsan, yalnızca onayınla, seçtiğin yapay zekâ sağlayıcısına (yurt dışı) gider..." + MED_NOTE |
| Besin kaynakları ve lisanslar | `03-screens.js:227` | USDA (CC0), ANSES Ciqual (Etalab 2.0), CoFID (OGL v3.0), Open Food Facts (ODbL) |
| Politika | `docs/privacy-policy.md` | Gizlilik politikası + KVKK aydınlatma (TR) ve kısa İngilizce sürüm. `[DOLDURULACAK]` alanları duruyor: veri sorumlusu adı/adres/e-posta, yayın tarihi, hukuki sebep onayı, başvuru yolu, yayın URL'si (satır 3-11, 33, 59, 67, 79) |
| Mağaza metni | `docs/store-listing.md` | TR/EN; Rehber paragrafı satır 48-51 ve 99-102; "ÖNEMLİ" tıbbi uyarı satır 58 ve 109 |
| Veri güvenliği formu | `docs/play-data-safety.md` | Rehber "paylaşılıyor: evet" (satır 10, 21-26) |
| Eski sürüm metin hatası | `03-screens.js:216` | Bildirim yeniden yazma cümlesi (bölüm 1.3) |

Uygulama içi ve belge tutarlılığı (testler):
- `app.test.js:2788-2790`: `CONSENT_SENT` (nokta ile), `CONSENT_WHEN`, `CONSENT_NOT` cümleleri `privacy-policy.md` bölüm 5'teki üç kalın başlıklı paragrafla birebir eşit olmalı ve rıza HTML'inde bulunmalı.
- `app.test.js:2789`: `CONSENT_V===2`; v1 rızası düşer.
- `app.test.js:2793-2794`: bağlamda gerçekten bulunan alanlar `CONSENT_SENT` ile eşleşir (doz, haftanın günleri, uyum, stok, bugünkü kayıtlar, kendi besin adı); politikada parola kuralı ve vücut ölçüsü/tarif cümleleri.
- `app.test.js:314`: altı sağlayıcı adı gizlilik ekranı, politika, veri güvenliği ve mağaza metninde geçer.
- `app.test.js:2210,2216,2218`: gizlilik sayfası rıza metnini ve MED_NOTE'u içerir; Hakkında MED_NOTE; onboarding son adım özeti ve bağlantı.
- Test EŞİTLEMEYEN: NOTICE'in belgelerde bulunması, mağaza metnindeki Rehber paragrafı (yalnız sağlayıcı adları), "Verilerin telefonunda kalır" gibi cümleler, İngilizce politika, `03-screens.js:216` cümlesi. Arama: `scripts/*.js`, `e2e/*.js` içinde `NOTICE` yalnız `alarm.test.js`, `autosend.test.js`, `data.test.js`, `e2e/fixtures.js`, `onboarding.spec.js` (davranış testleri).
- Belge ile kod farkı: politika "WAKE_LOCK izni" ve "Rehber anahtarı yedeğe parolayla şifrelenmiş girer" der (`privacy-policy.md:24-25`); `WAKE_LOCK` `patch-android.js` izin listesinde yok; `MedWakeReceiver.java:65` WakeLock kullanır. İznin son APK'ya hangi kitaplıktan birleştiği doğrulanmadı (CI izin listesi `apk-perms.txt`, `apk.yml:112`). Anahtarın yedeğe girişi doğru (`backupui.js:7`).

## 6. Saklama

| Konu | Olgu | Kanıt |
|---|---|---|
| Sohbet nerede | `S.chat` (açık) ve `S.chats` (arşiv), "coach" shard'ı; yerel IndexedDB (yoksa localStorage), şifresiz uygulama özel alanı | `modules.js:16`, `storelib.js:1-5,75` |
| Süre sınırı | Zaman bazlı silme yok. Boyut sınırları: açık sohbet 150 mesaj, mesaj 1500 karakter, arşiv en çok 20 sohbet / 600 mesaj / 250 000 karakter; ayrıca depolama dolunca eski arşiv atılır | `coach.js:102-114`, `01-core.js:224,246-247` |
| Sohbeti temizle | `S.chat=[]; S.chats=[]` (açık + arşiv). Rıza, anahtar, `chatRisk` değişmez | `coach.js:692,1007` |
| "Rehber sohbeti" silme kategorisi | Aynı fonksiyon | `coach/index.js:2`, `privacyui.js:9-10` |
| Tek sohbet silme | Geçmiş listesinde "Sil", geri alınabilir toast | `coach.js:1002-1006` |
| Tüm verileri sil | `nw_state`, güvenlik kopyaları, `nw_state_usage`, `nw_netlog`, `nw_keys`, `nw_keys_enc` silinir; `S` varsayılana döner (rıza dahil); fotoğraflar temizlenir. Silinmeyenler (kodda listede yok): `nw_bkpw_enc` (hatırlanan yedek parolası, Keystore şifreli), `nw_keys_plain` bayrağı | `07-actions.js:50`, `backupui.js:4` |
| Rızayı geri al ne siler | Yalnız rıza alanları; sohbet ve anahtar durur | `coach.js:716` |
| Sağlayıcıdaki veri | NeoWell silemez; politika sağlayıcıya yönlendirir | `privacy-policy.md:62`, `coach.js:687` |
| Yedeğe girenler | Tüm `S` (sohbet ve arşiv, sağlık notu, tahlil, tansiyon-şeker, nabız, ilaç, döngü, ayarlar) + sağlayıcı anahtarları; parola zorunlu (≥10 karakter), AES-GCM + PBKDF2 600 000. Fotoğraflar, `nw_netlog`, kullanım sayacı yok | `backupui.js:7`, `backuplib.js:4-16,33-34`, `privacyui.js:29` |
| Yedek parolasını hatırla | Keystore ile şifreli `nw_bkpw_enc` | `backupui.js:13-16` |
| Sağlayıcı anahtarı | `KeyVault` (Android Keystore) ile `nw_keys_enc`; kasa yoksa/arızalıysa kullanıcı izniyle düz `nw_keys`, yoksa yalnız bellekte; kasa başarısızsa uyarı toast'u | `coach.js:4-64` |
| Google yedeği/cihaz aktarımı | Yayın yaması `allowBackup=false` + `fullBackupContent` + `dataExtractionRules` (tüm alanlar hariç). CI APK'da `allowBackup=false`'u doğrular | `patch-android.js:41-45`, `nw_data_rules.xml`, `nw_backup_rules.xml`, `apk.yml:108-110` |
| Kullanım sayacı | `nw_state_usage`: gün > sağlayıcı|model > [istek, giriş, çıkış jetonu]; metin yok; 30 gün | `coach.js:228-237`, `coachlib.js:340-362` |
| Güvenlik kopyaları | `nw_state_previous` (geri yükleme öncesi), `nw_state_corrupt`; kullanıcı dışa aktarır/siler | `04-sheets.js:276-279`, `03-screens.js:221,230` |

## 7. Yaş
- Beyan: kullanıcı yazar; doğrulama yok (politika `privacy-policy.md:70`). Alan aralığı 10-100 (`01-core.js:64`).
- Onboarding: yaş <18 → "NeoWell 18 yaş ve üzeri için" ekranı, devam yok, "Girdiğin bilgiler kaydedilmedi", yalnız "Yaşımı yanlış girdim" ile yeniden giriş (`onboardui.js:40,72,114`). "Şimdilik geç" yaş girmeden uygulamaya girer (`onboardui.js:116`).
- Sonradan: Ayarlar > Profil'de yaş girilir/değişir; <18 ise `cAgeGuard` rızayı düşürür; Bugün ekranında banner "Kalori açığı, oruç önerisi ve Rehber kapalı" (`06-events.js:71`, `03-screens.js:89`). Sert fren: "18 yaş altındasın" (`algo.js:120`).
- 18 altı için Rehber kapısı: rıza düğmesi gizli (`coach.js:731`), `cConsent` reddeder (`coach.js:715`), kurulum doğrulama/model listesi de durur (`coach.js:827,906,913`), kayıttan geri yüklemede yaş kapısı çalışır (`04-sheets.js:266`).
- Yaş girilmezse (0) Rehber kapalı (`coach.js:675-676`).
- Rehber'e giden yaş 5 yıllık aralık, alt sınır 18 (`coachlib.js:297`).

## 8. Üçüncü taraf bileşenler ve ağ yolları
Uygulamanın kendi `fetch` yolları yalnız üç tane (`autosend.test.js:25-26`):

| Yol | Ne gider | Kanıt |
|---|---|---|
| Rehber sohbet/yorum/menü/program | Bölüm 1 | `coach.js:246` |
| Model listesi / kurulum | Anahtar (başlık) + sabit deneme cümlesi | `coach.js:261,833` |
| Open Food Facts | `GET world.openfoodfacts.org/api/v2/product/<barkod>.json?fields=code,product_name,product_name_tr,brands,nutriments,serving_quantity,product_quantity`; IP görünür; özel User-Agent | `04-sheets.js:167`, `offlib.js:8` |

Diğer: Google ML Kit barkod tarayıcı (Play hizmetleri, görüntü cihazda; modül indirme ve Google'ın tanılama verisi NeoWell dışı) (`patch-android.js:33-34`); ML Kit metin tanıma (model uygulamada, çevrimdışı) (`patch-android.js:110-111`); Google Play hizmetleri konum kitaplığı (etkinlik algılama) (`patch-android.js:112-113`); Health Connect (yalnız okuma: adım, uyku, nabız) (`patch-android.js:9`); Drive: yalnız kullanıcı paylaşım ekranından gönderirse (`backupui.js:33-46`); yerel TTS (`SpeechPlugin.java:8,39`); `assets/android/*.java` içinde HTTP istemcisi yok (grep `HttpURLConnection|OkHttp|java.net.URL|loadUrl`: sonuç yok; `SpeechPlugin.java:17` yalnız yorumda "WebView" geçer). CSP: `img-src 'self' data: blob:`, `connect-src 'self' https:` (`index.html:10`). Reklam/analitik SDK'sı yok (`package.json` bağımlılıkları: Capacitor, ML Kit barkod, jsdom/playwright dev).
İzin denetimi: CI APK'da `USE_EXACT_ALARM`, `FLASHLIGHT`, `ACCESS_BACKGROUND_LOCATION` bulunursa derleme durur (`apk.yml:113`); yama arka plan konumu eklemez (`patch-android.js:8`). Yerel `android/AndroidManifest.xml` eski üretimdir ve bu üç izni ile `allowBackup="true"` içerir (satır 5, 49-54); `.gitignore` ile izlenmez.
Lisans/atıf uygulamada:
- Open Food Facts ODbL: Ayarlar > Hakkında akordeonu ve besin kartı kaynak satırı (`03-screens.js:227`, `04-sheets.js:135`). OFF'den gelen kayıt yerel besin listesine `src:"off"` ile yazılır (`04-sheets.js:174-175`, `01-core.js:124`).
- USDA CC0, Ciqual Etalab 2.0, CoFID OGL v3.0: aynı metin (`03-screens.js:227`).
- pdf.js (Apache-2.0): lisans dosyası `www/vendor/pdfjs/LICENSE` pakette; uygulama içinde gösteren ekran yok (arama: `Apache|pdf.js|pdfjs` `www/main`, `www/modules` içinde yalnız kod yorumları).
- Egzersiz verisi `free-exercise-db` (Unlicense): yalnız `exlib.js:2` yorumu; uygulama içi atıf yok.
- Açık kaynak lisansları ekranı (Capacitor, ML Kit, AndroidX vb.) bulunamadı (arama: `lisans|license|Apache|MIT` `www/` vendor hariç).

## 9. Çeviri/dil
- Arayüz, hata ve güvenlik metinleri yalnız Türkçe; `lang="tr"`.
- Rehber yanıt dili: sistem istemi "Türkçe" der; kod zorlamaz.
- Hukuki belgeler: politika TR + kısa EN, mağaza metni TR + EN; uygulama içi metinlerin İngilizce karşılığı yok.
- Sağlayıcı hata sınıfı: `errKind` (`coachlib.js:254-269`) → sabit Türkçe metin (`coachlib.js:270`).

## 10. Belge/kod uyumsuzluk listesi (olgu)
1. `03-screens.js:216` ("Rehber ... bildirim metinlerini her gün yeniden yazar"): kodda karşılığı yok; "otomatik gönderim yok" beyanıyla çelişir görünür.
2. KISIT satırı şeker/tansiyon ölçümü ve ilaç kaydı varlığını sağlayıcıya taşıyabilir; `CONSENT_SENT`/`CONSENT_NOT` ve politika "tansiyon, şeker ... gönderilmez" der (1.4).
3. Rıza metni "aşağıdan her veri türünü tek tek kapatabilirsin" der; Gizlilik sayfasındaki rıza bölümünde anahtarlar yok (`coach.js:687`, `privacyui.js:40-43`).
4. Sekiz paylaşım anahtarı varsayılan açık (`01-core.js:47`).
5. `CONSENT_V` artışını zorlayan test yok; sürüm nedeniyle düşen rıza için bildirim yok.
6. Politikada `[DOLDURULACAK]` alanları dolmamış (`privacy-policy.md`).
7. Rıza metni sağlayıcı listesi anahtarı olmayan etkin sağlayıcıları da sayar (`coach.js:687`).
8. Çok sağlayıcılı zincirde bir eylem birden fazla sağlayıcıya veri taşıyabilir (`coach.js:334-343`); rıza metni "seçtiğin sağlayıcıya" der.
9. "Tüm verileri sil" yedek parolası kaydını (`nw_bkpw_enc`) silmez (`07-actions.js:50`).
10. Yanıtı bildirme mekanizması yok; sohbet balonunda kalıcı "yapay zekâ" etiketi yok (4.3).
