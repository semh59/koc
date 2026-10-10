# Rehber, içgörü, geçmiş ve Trend: Ar-Ge raporu (takım rehber-analiz)

Erişim tarihi (tüm URL'ler): 2026-10-10. Kod tabanı: ana dal, 4f27ce2.

## 1. Kapsam ve bakılan rakipler

Kapsam: `www/modules/coach/*` (Rehber), `www/modules/insights/*` (Bağlantılar, hedef önerisi, haftalık rapor), `www/modules/history/*`, Trend ekranı (`www/main/03-screens.js:98`), `www/kernel/algo.js`, `www/kernel/piilib.js`.

Gerçekten okunan sayfalar (WebFetch ile içerik alındı):

| Rakip | Okunan sayfa | Not |
|---|---|---|
| MacroFactor | https://macrofactor.com/macrofactors-algorithms/ | Birinci el, resmi site |
| Bearable | https://bearable.app/support/howto/how-to-find-correlations/ ve https://bearable.app/support/troubleshooting/my-correlations-are-wrong-dont-make-sense/ | Birinci el, destek sayfası |
| Oura Advisor | https://support.ouraring.com/hc/en-us/articles/39512345699219/ | Birinci el |
| Welltory | https://welltory.com/stress-and-hrv/ | Birinci el, yalnız HRV makalesi |
| Fitbod | https://www.fitbod.me/ | Birinci el, ana sayfa |
| Ada | https://ada.com/ ve https://ada.com/privacy-policy/ | Birinci el |
| Google Health (Fitbit) koçu | https://apps.apple.com/gh/app/id462638897 (App Store sayfası) | Birinci el mağaza sayfası |
| Google koçu önizleme ayrıntıları | https://the-decoder.com/with-its-new-ai-health-coach-google-leverages-its-platform-advantage/ | İKİNCİL (haber); Google blogu 404 verdi |
| Samsung Health Assistant | https://www.thestar.com.my/tech/tech-news/2026/07/22/samsung-debuts-ai-powered-health-assistant-joining-packed-market/ | İKİNCİL (haber); Samsung haber odası zaman aşımı |
| ChatGPT Health | https://www.foxnews.com/tech/chatgpt-health-promises-privacy-health-conversations.amp | İKİNCİL (haber); openai.com 403 |
| WHOOP Coach | https://apps.apple.com/se/app/whoop/id933944389 (App Store) | Birinci el mağaza sayfası; ek: maginative haberi (ikincil), whoop.com 403 |
| Noom | https://apps.apple.com/us/app/noom-weight-loss-food-tracker/id634598719 (App Store) | Birinci el mağaza sayfası |
| ChatGPT uygulaması | https://apps.apple.com/us/app/chatgpt/id6448311069 (App Store) | Birinci el; listede "ChatGPT Health" geçmiyor |
| Apple Sağlık | https://9to5mac.com/?p=1039743 (iOS 26.4 beta 1) | İKİNCİL |

Birinci el kaynakla bakılan 10 uygulama: MacroFactor, Bearable, Oura, Welltory, Fitbod, Ada, Google Health, WHOOP, Noom, ChatGPT (mağaza). İkincil kaynakla kalanlar: Samsung Health Assistant, ChatGPT Health, Apple Sağlık; satırlarda "ikincil" etiketli. Okunamayan ayrıntılar bölüm 6'dadır ve öneriye dayanak olmadı.

Mimari belgeler okundu: `docs/boundary-map.md`, `scripts/boundary.test.js` (kural: bir `S` alanına yalnız sahibi modül ve `main/`, `kernel/` doğrudan dokunur; modüller arası `*lib.js` çağrısı serbest, örnek `weeklylib.js:5` VitalsLib/MedLib kullanır). `docs/roadmap.md`, `docs/ideas.md`, `docs/todo.md` içinde bu raporun önerilerinin eşdeğeri aranıp bulunmadı (grep: rehber|coach|korelasyon|halüsin|bağlant).

Politika/yöntem kaynakları (okundu): Google Play Health Content (https://support.google.com/googleplay/android-developer/answer/12261419), Play AI-Generated Content (https://support.google.com/googleplay/android-developer/answer/13985936). İstatistik künyeleri Crossref/Europe PMC üzerinden doğrulandı (bölüm 4'te).

## 2. Bizim mevcut durumumuz (kanıtlı)

**Rehber, güvenlik ve gizlilik**
- Uygulama tarafı kırmızı bayrak taraması model yanıtından bağımsız çalışır: intihar, acil, yeme bozukluğu, kontrol et; deyim ("baklavaya bayılıyorum") ayıklanır (`coachlib.js:11-33`). Sağlık notu da taranır (`coach.js:362-365`).
- Sistem istemi 12 kural içerir: sayıyı yalnız HESAPLANAN ve SON 14 GÜN'den al, kalori hedefini kendin değiştirme, ilaç/doz/tanı yok (`coachlib.js:273-294`).
- Model çıktısı doğrulanır: JSON tolerant ayrıştırma (`coachlib.js:66-82`), kayıt önerileri sınırlı (`coachlib.js:89-107`), program yalnız bilinen kimliklerle (`coachlib.js:122-132`), menü yalnız katalog kimlikleriyle ve porsiyon çarpanıyla (`coachlib.js:138-168`), kalori önerisi güvenli tabana çekilir (`coachlib.js:211-216`).
- Veri paylaşım anahtarları: 8 kategori ayrı ayrı kapatılır (`coach.js:167-173`); kapalı olanlar modele "paylaşılmadı, tahmin yürütme" diye bildirilir (`coachlib.js:312`). Bağlam anahtar sözcüğe göre daraltılır (`coachlib.js:303-311`). Sağlayıcı kümesi değişince rıza yenilenir (`coach.js:679`). 18 yaş altı kapalı (`coach.js:675-682`).
- PII maskeleme: e-posta, IBAN, kart (Luhn), TC, telefon, plaka, ad/soyad, adres, kurum (`piilib.js:56-81`); her gönderim tek kapıdan geçer (`coach.js:210-213`); yanıttaki etiketler yerelde geri açılır (`piilib.js:119`). Kapsam dışı sızıntılar dosya başında dürüstçe yazılı (`piilib.js:3`).
- İsteğe bağlı "giden metni önizle" (`coach.js:303-320`, ayar `privacyui.js:32`); jeton sayacı yalnız sayı tutar (`coachlib.js:340-362`).
- Günlük/haftalık yorum, "neden kilo vermedim" yorumu yalnız uygulamanın hesapladığı özetle istenir (`coach.js:454-465`, `coach.js:606-619`). Yorum için rıza ve anahtar gerekir (`coach.js:609`).
- Yanıttaki rakamların doğruluğu kodla denetlenmez: `cReply` model metnini olduğu gibi gösterir (`coach.js:398-399`), `parse` yalnız uzunluk kırpar (`coachlib.js:74`). Arama: `grep "bildir|sentLog|grounding"` coach.js/main içinde ilgili özellik bulmadı.
- Yanıtı bildirme düğmesi yok (aynı arama; `bildir` yalnız bir istem metninde geçiyor, `coach.js:377`).

**İçgörü (insights)**
- Bağlantılar: yalnız 3 çift (uyku→ruh hali, adım→ruh hali, haftalık kalori→kilo trendi), iki grubun ortalaması karşılaştırılır; eşik 7 sa ya da ortanca; en az 14 çift, grup başı 4 (`linkslib.js:10-45`). Güven aralığı, gecikme, çoklu karşılaştırma yok; "fark yok" yalnız |fark|<0,2 ise yazılır (`linkslib.js:16`). Arayüz notu nedensellik olmadığını söyler ve Rehber'e gönderilmediğini belirtir (`linksui.js:6`).
- Plato: eğimin iki yanlı güven aralığı ±0,3 kg/hafta içindeyse (`insightlib.js:36-53`); gürültü SD'si (`insightlib.js:29`); "tartı oynaması içinde" uyarısı (`insightlib.js:76`).
- Haftalık "neden" etmenleri: tam kayıtlı gün kuralı (`insightlib.js:55-66`). Hedef önerisi: uyum ve sessizlik kapıları (`goallib.js:9-29`). Haftalık rapor yorum yapmaz (`weeklylib.js:1-3`).

**Trend ve Geçmiş**
- Trend: üstel ortalama trend (alfa 0,1) (`algo.js:14-25`), 21 gün OLS eğimi, hedef ETA tek sayı (`algo.js:94-101`, `algo.js:166-172`), arayüz "Son 3 haftanın eğimi sürerse ~N hafta" (`03-screens.js:104-109`). ETA'da aralık yok; eğim standart hatası bu yolda hesaplanmıyor (`algo.js:27-31` yalnız m,b döner).
- Uyarlanır harcama (TDEE): 28 gün, en az 10 tam gün, formülle güvene göre harmanlama (`algo.js:68-92`).
- Geçmiş: günlük sayaç dizini, ay özeti, arama; veriyi değiştirmez (`historylib.js:1-52`). Ay özeti yalnız ortalama verir; önceki aya veya kişisel normale kıyas yok (`historylib.js:20-33`).

## 3. Boşluk tablosu

| Özellik | Rakipte durumu (kaynaklı) | Bizde | Fark |
|---|---|---|---|
| Trend kilo + harcama algoritması | MacroFactor: "purely deterministic", uzun pencerede ağırlıklı ortalama, harcamayı haftalık yeniden çözer, ilk tahmin "inherently imprecise" (macrofactor.com/macrofactors-algorithms/) | Aynı aileden: EWMA + OLS + uyarlanır TDEE (`algo.js:14-92`) | Eşit; MacroFactor sayfasında sayısal güven aralığı anlatılmıyor, bizde de yok |
| Belirsizliği gösteren hedef tarihi | MacroFactor sayfası sayısal güven/aralık anlatmıyor (aynı sayfa); diğer bakılanlarda tarih tahmini bulunamadı | Tek sayı ETA (`algo.js:96-101`) | Fırsat: aralıklı ETA |
| Korelasyon içgörüsü | Bearable: faktör günleri vs olmayan günler, en az 3+3 gün, 1-7 gün gecikmeli "Factor Effect"; yöntem ve anlamlılık açıklanmıyor (bearable.app how-to-find-correlations). Sorun giderme sayfası "causation" olmadığını ve ters yönü söylüyor (bearable.app my-correlations-are-wrong) | 3 sabit çift, ortalama farkı, gecikme yok (`linkslib.js:18-45`) | Bearable gecikme sunuyor, biz sunmuyoruz; ikimiz de belirsizlik göstermiyoruz |
| Yapay zekâ yanıtında rakam doğrulama | Google Health mağaza sayfası: "Check responses for accuracy; results may vary" (apps.apple.com/gh/app/id462638897); Samsung (ikincil): NIH/CDC/MIT ile yanlış yanıtları azaltma çalışması (thestar). Yanıt başına rakam denetimi bakılan kaynaklarda anlatılmıyor | Yok; yalnız istem kuralı (`coachlib.js:276`) | Az rastlanan alan |
| Veri yerelliği | Oura: veri "processed and stored in Oura's cloud" (support.ouraring.com); Ada: veri AB'de AWS/Google bulutunda (ada.com/privacy-policy); ChatGPT Health: "additional encryption and isolation" (foxnews, ikincil) | Veri telefonda; yalnız onaylı gönderim, PII maskesi (`piilib.js`) | Yapısal üstünlük; ürün özelliği olarak sunulmuyor |
| Hafıza/silme denetimi | Oura: "view and delete memories via Advisor's Settings" (support.ouraring.com) | Sohbet silinir (`coach.js:691`), gönderim geçmişi yok | Gönderilenin dökümü yok |
| Gönderim öncesi tam metin | ChatGPT Health, Oura, Whoop, Google, Samsung kaynaklarında anlatılmıyor | Var (isteğe bağlı) (`coach.js:317`) | Az rastlanan; varsayılan kapalı |
| Yorum/haftalık özet | Samsung Health Assistant opt-in beta (thestar, ikincil); Google Health koçu "built with Gemini", Premium (App Store sayfası); Oura Advisor bulutta (support.ouraring.com); WHOOP: kullanıcı yorumu "doesn't remember our previous chats" (App Store sayfası) | Yorum yalnız LLM ile (`coach.js:606-619`) | Bulutsuz yerel yorum boş alan |
| Kişisel taban çizgisinden sapma | Apple iOS 26.4 beta: ortalama yatış saati ile dünkü kıyas (9to5mac, ikincil) | Ay özeti ortalama, kıyas yok (`historylib.js:20-33`) | Küçük fark |
| Tıbbi cihaz sınıfı | Ada: Class IIa (ada.com/privacy-policy) | Tanı koymaz, yönlendirir (`coachlib.js:273-286`) | Bilinçli sınır |
| Egzersiz seçimi gerekçesi | Fitbod: sayfa neden bu hareketin seçildiğini açıklamıyor (fitbod.me) | Rehber programı katalogdan, tek cümlelik uyarıyla (`coachlib.js:196-208`) | Bu raporun odağı dışı |

"Hiçbir rakipte yok" denmedi: bakılan 11 uygulamadan hangisinin neyi anlattığı yukarıdadır; sayfada anlatılmaması, özelliğin yokluğu demek değildir.

## 4. Öneriler (öncelik sırasıyla)

### 1. Rehber yanıtında rakam doğrulama ("Rakamları kontrol ettim")
- Ne yapar: Rehber bir yanıt verince uygulama, yanıttaki her sayıyı modele giden verilerle karşılaştırır. Eşleşmeyen sayı varsa yanıtın altında "Bu yanıttaki 2 rakam kayıtlarında yok; kesin sayma" yazar, bir kez otomatik düzeltme ister.
- Rakiplerden ileride çünkü: bakılan kaynaklarda halüsinasyon endişesi anılıyor (the-decoder, thestar) ama yanıt başına rakam denetimi anlatılmıyor. Halüsinasyonun türleri ve sağlık alanındaki riski için: Ji ve ark., "Survey of Hallucination in Natural Language Generation", ACM Computing Surveys 2022 (arXiv:2202.03629, başlık ve künye okundu).
- Dayanak: izinli sayı kümesi `contextText` çıktısından (`coachlib.js:309-339`) ve kullanıcı mesajından çıkar; yeniden isteme kalıbı hazır (`coach.js:378-388`); kural zaten "sayı yalnız HESAPLANAN'dan" (`coachlib.js:276`). Yemek tahmini `food`/`log` alanlarında olduğu için `reply` metninden ayrı tutulur.
- Kapsam: küçük-orta. Saf fonksiyon `CoachLib.numsOk(reply, allowed)` ve `cReply` çağrısında bir bayrak (~40 satır); yanlış alarm listesi (112, tarih, saat, 1-10 arası sayılar, yuvarlama toleransı %1) en çok emek isteyen kısım.
- Risk: yanlış alarm kullanıcıyı yorar (60 yaş: tek cümle, teknik terim yok, düğme yok). Yeniden istemek jeton maliyetini artırır (en çok 1 ek çağrı). Hukuki risk yok; güvenliği artırır.
- Test: (a) bağlamda 1850 kcal varsa "ortalama 1850" geçen yanıt işaretlenmez; (b) "ortalama 2100" geçen yanıt işaretlenir; (c) "112" ve saat "08:30" işaretlenmez; (d) `scripts/coach.test.js` içinde en az 12 örnek tablo testi.

### 2. "Yanıtı bildir" düğmesi (Play AI-Generated Content uyumu)
- Ne yapar: Her Rehber yanıtında küçük "Bildir" bağlantısı; kullanıcı seçer (yanlış / tehlikeli / uygunsuz), yanıt yerelde işaretlenir ve işaretli yanıtlar listesinde tutulur.
- Neden önemli: Play AI-Generated Content sayfasının (support.google.com/googleplay/android-developer/answer/13985936) okunan özetine göre sohbet botu merkezli uygulamalar, kullanıcının saldırgan içeriği uygulamadan çıkmadan geliştiriciye bildirmesini sağlayan uygulama içi özellik taşımalı (birebir metin okunmadı, özet). Bu rakip özelliği değil, mağaza koşulu. Açık risk: sunucusuz mimaride bildirimi geliştiriciye ulaştırmanın uyumlu bir yolu yok; `mailto:` uygulamadan çıkar. Yerel işaretleme tek başına koşulu karşılamayabilir; bu soru Play incelemesine açıkça sorulmalı (`docs/legal-questions.md`).
- Dayanak: şu an böyle bir özellik yok (bölüm 2 arama sonucu); sohbet mesajı kartları `cCard` (`coach.js:634`), mesaj yapısı `coach.js:121-126`.
- Kapsam: küçük (yerel işaret), uyumluluk kısmı çözümsüz. Modül: `www/modules/coach/` (`S.chat` coach'un, sınır testi etkilenmez).
- Risk: risk: hukuki/Play politikası (yukarıdaki açık soru). İşaretli metin PII maskeli saklanır.
- Test: her `coach` kökenli mesajda "Bildir" erişilebilir (TalkBack etiketi); işaret kalıcı; `app.test.js`'e görünürlük testi.

### 3. Aralıklı hedef tarihi ve hafta-hizalı eğim (Trend)
- Ne yapar: "Hedefe ~8 hafta" yerine "Hedefe 6 ile 12 hafta arası" gösterir; veri yetersizse "Henüz kestiremiyorum" der. Hesap, haftanın günü etkisini azaltmak için tam hafta pencereleri kullanır.
- Neden ileride: MacroFactor sayfası sayısal belirsizlik anlatmıyor; bakılan diğer uygulamalarda hedef tarihi aralığı bulunamadı (DOĞRULANAMADI değil, "bulunamadı"). Bilimsel dayanak: hafta sonu kilonun arttığı hafta içi azaldığı bulgusu, Orsama ve ark., Obesity Facts 2014, PMID 24504358 (başlık/künye Europe PMC'den okundu). Kilo kaybında enerji harcamasının uyum gösterdiğini simüle eden model: Hall ve ark., Lancet 2011;378:826-837, PMID 21872751 (yalnız künye ve özet okundu; bu öneri 7700 kuralı hakkında iddia taşımaz).
- Dayanak: eğim standart hatası `InsightLib.fit` içinde var (`insightlib.js:20-27`) ama ETA yolu `Algo.ols` kullanır (`algo.js:27-31`, `algo.js:96-101`). Tek hesap yeri olsun diye eğim+se hesabı `www/kernel/algo.js` içinde olur; insights ve Trend zaten `Algo` kullanıyor (`linkslib.js:4`, `goallib.js:4`); `boundary.test.js` yalnız `S` alanı erişimini denetler, bu değişiklik ona dokunmaz.
- Yöntem: OLS eğim ± t·se, ETA = (hedef − trend) / (eğim ∓ t·se); aralık sıfırı içerirse tarih yazılmaz. 21 gün yerine en yakın tam hafta sayısına (14/21/28 gün) yuvarlanan pencere.
- Kapsam: küçük. Hesap ~25 satır, arayüz cümlesi `03-screens.js:109`.
- Risk: kilo kaybı hızının sağlık sınırlarını aşan "hızlı bitirme" izlenimi; mevcut kalori freni korunur (`03-screens.js:108`). 60 yaş: tek cümle, "6-12 hafta" yeterli, grafik eklenmez.
- Test: sabit tohumlu sentetik seri (eğim −0,4, gürültü SD 0,5) için gerçek tarih aralığın içinde kalır; eğim 0 serisinde "kestiremiyorum"; haftalık tartanlarda (4 nokta) aralık genişler (`scripts/algo.test.js`).

### 4. Bağlantılar v2: gecikme, etki büyüklüğü, güven aralığı, "kanıt yetersiz" dürüstlüğü
- Ne yapar: Her örüntünün yanında "kanıt: zayıf / orta / güçlü" ve kaç gün veri olduğu görünür; kanıt yoksa ekran "Henüz belirgin bir bağ yok" der ve yanlış umut vermez. Ertesi güne gecikmeli bağlar (örn. akşam geç yemek → ertesi uyku) eklenir.
- Neden ileride: Bearable 1-7 gün gecikme sunuyor ama anlamlılık/yöntem açıklamıyor (bearable.app/support/howto/how-to-find-correlations/) ve ters yön ile karıştırıcı değişkeni kendi sorun giderme sayfasında kabul ediyor (my-correlations-are-wrong). Biz yöntemi açık ve yerel gösterebiliriz.
- Dayanak: `linkslib.js:12-45` ortalama farkı hesaplar; güven aralığı yok. Yöntem: fark için hareketli-blok bootstrap güven aralığı (Künsch 1989, Ann. Statist. 17(3); Efron 1979, Ann. Statist. 7(1), künyeler Crossref'ten okundu); özerk ilişkili serilerde klasik t-testi yanıltır, alternatif olarak Newey-West sağlam standart hata (Econometrica 55(3), 1987). Aday çift sayısı artarsa yanlış keşif oranı kontrolü: Benjamini-Hochberg, JRSS-B 57(1):289-300, 1995. Gösterim kuralı: aralık sıfırı içermiyor VE fark pratik eşiği (örn. ruh hali ≥0,3/5; uyku ≥20 dk) aşıyor.
- Kapsam: orta. Modül: `www/modules/insights/linkslib.js` (saf, `S` erişimi yok). Mevcut girdi biçimi korunur; 2000 yeniden örnekleme 60 günlük veride birkaç ms'dir (tarayıcıda ölçülmeli). Karıştırıcı kontrolü: haftanın günü etkisi için hafta içi/sonu ayrı karşılaştırma.
- Risk: yanlış keşif (az veride sahte bağ) ana risk; çözüm "kanıt yetersiz" varsayılanı. Tıbbi cihaz sınıfı riski düşük: yaşam tarzı örüntüsü, tanı yok; metinde "neden-sonuç değildir" kalır (`linksui.js:6`). 60 yaş: aralık/istatistik terimi gösterilmez, yalnız üç kademeli etiket.
- Test: (a) bağımsız rastgele iki seri 1000 denemede <%5 oranda "güçlü" etiketi alır; (b) enjekte edilmiş 0,6 puanlık fark ≥%80 yakalanır; (c) 14 çiftten azında hiçbir şey çıkmaz (`scripts/` altına yeni test).

### 5. "Rehber'e ne gitti" defteri ve soru başına veri çipleri
- Ne yapar: Ayarlar'da her gönderimin tarihini, hangi veri türlerinin gittiğini ve kaç kimlik parçasının maskelendiğini listeler; tek dokunuşla siler. Soru yazarken altında "Bu soruya gidecek: Kilo, Yemek" çipleri görünür, dokununca o seferlik kapanır.
- Neden ileride: Oura yalnız "memories" görüntüleme/silme sunuyor (support.ouraring.com); ChatGPT Health bağlantıyı kesmeyi sunuyor (foxnews, ikincil). Bakılan kaynaklarda gönderim başına döküm anlatılmıyor ("az rastlanan"). Bizde veri zaten yerelde ve tek kapıdan çıkıyor (`coach.js:210-213`, `coach.js:337-340`).
- Dayanak: kategori anahtarları `SHARE` (`coach.js:167-173`), bağlam daraltma anahtar sözcüğü (`coachlib.js:303-311`), jeton sayacı (`coachlib.js:340-362`) bu defterin yanına doğal biçimde oturur.
- Kapsam: orta. Modül: `www/modules/coach/` (kayıt coach'un kendi alanında). Metnin kendisi saklanmaz (gizlilik): yalnız kategori, karakter sayısı, maske sayısı, sağlayıcı, saat; en çok 100 kayıt.
- Risk: izin yok; yedeğe girmemeli (gizlilik politikası güncellenmeli: `docs/privacy-policy.md`). 60 yaş: çipler en çok 8, "Gizlilik ve veri" altında tek liste.
- Test: gönderim sonrası kayıt oluşur ve metin içermez; kategori kapalıyken kayıtta o kategori yok; silme tüm kayıtları temizler (`scripts/coach2.test.js` veya `app.test.js`).

### 6. Rehber'siz yerel yorum: günlük ve haftalık değerlendirme cihazda
- Ne yapar: "Haftamı yorumla" düğmesi anahtar ve rıza olmadan da çalışır; yorum yerel kurallarla üretilir (örn. "5 gün tam kayıt, ortalama 1850 kcal, hedefin 1900; en büyük sapma: hafta sonu"). İsteyen sonra Rehber'den yazılı yorum ister.
- Neden ileride: Oura Advisor verisi "Oura's cloud"da işleniyor (support.ouraring.com); Google Health koçu "built with Gemini" ve Premium (App Store sayfası); Samsung (ikincil, thestar) opt-in beta. Bulutsuz, açıklanabilir yorum bakılan kaynaklarda anlatılmıyor.
- Dayanak: `weekWhy` (`insightlib.js:55-79`), `weekSummary` (`coach.js:598-604`), `LinksLib` sonuçları, hedef önerisi (`goallib.js`), plato (`insightlib.js:41-53`). Haftalık rapor "yorum yapmaz" (`weeklylib.js:1-3`); bu öneri yerel yorumu ayrı, kısa bir şablon katmanı olarak ekler. Rehber yorumu istemi aynı sayıları kullanır (`coach.js:615-617`).
- Kapsam: orta. Modül: `www/modules/insights/` altında yeni saf `commentlib.js`; coach çağırır (modüller arası lib çağrısı serbest, bkz. `weeklylib.js:5`; `S`'ye yalnız coach.js dokunur). Şablon cümleler sınırlı (≈12), her cümle bir koşula bağlı; hepsi Türkçe ve yerel.
- Risk: şablon kalitesi; "tıbbi yorum yok" ilkesi korunur. Yeni ağ/izin yok. Google Play: tıbbi iddia yok (support.google.com/googleplay/android-developer/answer/12261419).
- Test: her şablon için tablo testi (girdi → tam cümle); tam kayıtlı gün sayısı <3 iken ortalama cümlesi çıkmaz (`insightlib.js:60`).

### 7. "Kendi deneyin": 2 haftalık kişisel A/B denemesi (N-of-1)
- Ne yapar: Kullanıcı "Akşam yürüyüşü uykumu düzeltir mi?" gibi hazır kartlardan birini seçer; uygulama 3-4 günlük blokları rastgele sıralar, günü hatırlatır, sonunda "belirgin fark çıkmadı" ya da "ortalama +25 dk uyku" der.
- Neden ileride: Bearable yalnız gözlemsel karşılaştırma yapıyor (faktörlü gün vs olmayan gün, bearable.app how-to-find-correlations) ve nedensellik iddiasını reddediyor (my-correlations-are-wrong); rastgele sıralı yerel deneme bakılan kaynaklarda anlatılmıyor. Yöntem bilimsel: N-of-1 çalışmalarının raporlama standardı CENT 2015 (BMJ 2015, PMID 25976398; Kravitz'in yazar listesindeki Europe PMC kaydından okundu).
- Dayanak: uyku/ruh hali/adım verisi zaten günlük giriliyor (`linkslib.js:17-28`); hatırlatma altyapısı mevcut (`main/05-notifications.js`).
- Kapsam: büyük. Yeni ekran, durum makinesi, bildirim; en az 3 ekran. İlk sürüm tek kart ("22:00 sonrası ekran yok") ile sınırlanabilir.
- Risk: risk: hukuki/Play politikası (sağlık iddiası). Yalnız yaşam tarzı kaldıraçları (yürüyüş, ekran, kafein saati), ilaç/diyet/oruç YOK; kaldıraç listesi sabit ve elle yazılı. Play: tıbbi cihaz beyanı gerektirecek tanı/tedavi dili kullanılmaz (Play Health Content, yukarıdaki URL). 60 yaş: tek soru, tek düğme, sonuç iki cümle.
- Test: rastgele sıra her blokta en çok 2 ardışık aynı koşul üretir; veri eksikse "sonuç yok" döner; fark yokken (aynı dağılımlı sentetik) yanlış pozitif <%5.

### 8. Geçmiş ve Trend'de kişisel normal bandı (sağlam medyan/MAD)
- Ne yapar: Geçmiş aylık özetinde ve Trend'de adım, kalori, su gibi değerler için "senin normalin" bandı gösterilir; dışına çıkan gün işaretlenir ("normalinden belirgin düşük"). Tıbbi anlam yüklenmez.
- Neden ileride: Apple iOS 26.4'te "ortalama yatış saati ile dünkü" kıyası var (9to5mac, ikincil); tüm modülleri kapsayan, yerel normal bandı bakılan kaynaklarda anlatılmıyor. Yöntem: ortanca ve mutlak sapma, Leys ve ark., J. Exp. Soc. Psychol. 49(4):764-766, 2013 (künye Crossref'ten okundu).
- Dayanak: `historylib.js:20-33` yalnız ortalama alır, kıyas yok; günlük sayaç dizini hazır (`historylib.js:7-11`).
- Kapsam: küçük-orta. Modül: saf hesap `www/modules/history/historylib.js` içinde, girdi `Data.hist` sayaç dizisi (`historylib.js:7-11`), yeni `S` erişimi yok. En az 14 gün veri olmadan band yok.
- Risk: risk: hukuki/Play politikası. Sağlık dışı alanlara sınırlı tutulmalı (kilo, tansiyon, şeker bandı YOK: uyarı niteliği tıbbi cihaza kayabilir, Play Health Content). 60 yaş: tek renk işaret + kelime, renk tek başına anlam taşımaz.
- Test: sabit seride +4 MAD sapma işaretlenir, 14 günden az veride band üretilmez, tek uç değer bandı bozmaz.

## 5. Reddedilen fikirler

- Belirti değerlendirme / "olası hastalık" (Ada tarzı), risk: hukuki/Play politikası: Ada AB'de Class IIa tıbbi cihaz (ada.com/privacy-policy); bizim için sertifikasyon yükü ve Play tıbbi cihaz beyanı (Play Health Content). Reddedildi.
- İkinci bir model ile "yargıç" doğrulaması: ek PII gönderimi ve maliyet; kod tabanlı rakam denetimi (öneri 1) aynı işi veri çıkarmadan yapar.
- Cihaz üstü dil modeli: Chrome 60 uyumlu WebView ve APK boyutu kısıtı; ağırlık dosyası yükü gerçekçi değil.
- Diğer kullanıcılarla kıyas (Google koçunda var denildi, yalnız arama özetinden, bölüm 6 madde 4): sunucu ve hesap gerektirir, kısıtla çelişir; rakip iddiası dayanak değil.
- HRV/stres skoru (Welltory): sensör ve tıbbi iddia riski; Welltory sayfası da kendi skorunun stresi tek başına ölçmediğini söylüyor (welltory.com/stress-and-hrv/).
- Kullanıcıya p-değeri göstermek: 60 yaş için karışık; kademeli etiket yeterli.
- GLP-1 eşlikçisi (Noom): ilaç alanı, Play Health ve KVKK riski, ayrıca Noom kaynağı doğrulanamadı.

## 6. DOĞRULANAMADI listesi (öneriye dayanak olmadı)

1. Noom'un GLP-1 programı, "Welli" asistanı ve hedef tahmini (App Store sayfası yalnız AI yemek kaydı, koçluk, vücut taraması ve uyarıları doğruladı; kalan yalnız arama özeti).
2. Apple Sağlık "Trends/Highlights" hesap yöntemi ve cihaz içi işleme (resmi destek sayfası içerik vermedi).
3. WHOOP Coach veri akışı ve OpenAI'a ne gittiği (App Store ve haber gizliliği anlatmıyor).
4. Google koçunun önizleme ayrıntıları ve "diğer kullanıcılarla kıyas" özelliği (blog.google 404; the-decoder ikincil, kıyas yalnız arama özeti).
5. Samsung Health Assistant birinci el sayfası (haber odası zaman aşımı, mağaza 404); tüm Samsung bilgisi ikincil.
6. ChatGPT Health OpenAI duyurusu (openai.com ve help.openai.com 403); yalnız Fox haberi (ikincil).
7. Welltory "Quantified Self Dashboard" korelasyon özelliği (yalnız arama özeti; fetch edilen sayfa yalnız HRV makalesi).
8. Oura'nın "kendi modeli / üçüncü taraf LLM kullanmıyor" iddiası (Oura sayfasında doğrulanmadı).
9. Bearable'ın anlamlılık/yöntem ayrıntısı (sayfalarda anlatılmıyor; "kullanmıyor" denemez).
10. Hall 2011 ve Orsama 2014 için yalnız künye/özet okundu, tam metin okunmadı.
