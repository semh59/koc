# Dalga 2 (madde 8-12): kod düzeyinde uygulama analizi

Tarih: 2026-10-10. Kod: `main`, c65da87. Yöntem: kod gerçekten okundu (`dosya:satır`), "yok" iddiaları grep ile sınandı, dış kaynaklar bu oturumda açıldı. Kod değiştirilmedi, commit atılmadı.

## 0. Karar özeti

| # | Madde | Karar | Tek satır neden |
|---|---|---|---|
| 8 | Birleşik hekim raporu | DEĞİŞTİR | Fikir doğru; mevcut haftalık çizici 30/90 gün için taşar, yeni sayfa düzeni gerekir; PDF'te "yorum yok" ilkesi tahlil okunun işaretiyle çelişir (karar gerekir). |
| 9 | Rehber rakam doğrulama | DEĞİŞTİR | Izinli küme "modelin gördüğü metin + aynı yanıttaki kart alanları" olmalı; ifade "yanlış" değil "kayıtlarında bulamadım"; otomatik yeniden sorma v1'de yok. |
| 10 | "Rehber'e ne gitti" defteri | DEĞİŞTİR | Dalga 1 madde 1 (çıkış defteri) ile aynı depo ve sarmalayıcı; ayrı yapılırsa iki defter çıkar. Soru başı veri çipleri ayrı iş, ertele. |
| 11 | Ramazan modu | DEĞİŞTİR | Saat hesabı cihazda mümkün ve ölçüldü (±1 dk); ama başlangıç tarihi otomatik olamaz, sert bayrakta mod kapalı, ilaç saati dokunulmaz, S.fast kullanılmaz. |
| 12 | Haftalık hareket kılavuzu kartı | DEĞİŞTİR | "Tempolu dakika" ayrımı kodda yok ve kadans eşiği 60+ için doğrulanmamış; kart mevcut spor dakikası + kuvvet günü ile sınırlanmalı; denge satırı içerik olmadan eklenmez. |

RED çıkan madde yok; alt özellik RED'leri ilgili bölümlerde (11: ilaç saati kaydırma, otomatik Hicri başlangıç; 10: soru başı çipler ertelendi).

## 0.1 Çelişkiler (rapor ve kod arasında)

1. **Madde 12 / hareket-spor Ö3**: raporda "salon süresi tempolu dakikaya girmez". Kodda haftalık spor toplamı `sum("exercise",...)` salon antrenmanını da sayıyor (`main/03-screens.js:118`; salon bitince `gLogExercise` bir `exercise` kaydı yazıyor, `gym.js:557-559`). Aynı ekranda iki farklı "haftalık dakika" çıkardı. Ayrıca raporun önerdiği `Motion.moves()` API'si yok: `modules/motion/index.js` yalnız `Data.privacy.push` içeriyor (1 satır).
2. **Madde 8 / saglik Ö1 test (c) "PDF'te hiçbir eşik/renk işareti yok"**: mevcut tahlil PDF'i "▲ Raporda yazan aralığın üstünde" yazıyor (`labs/lablib.js:342`, `drawPage`). Birleşik rapora aynı çizim alınırsa test kırılır. Bkz. 8.5.
3. **Madde 8 / kullanilabilirlik Ö3**: "ilaç uyumu zaten rapora girer (`roadmap.md:34`)". Doğrulanamadı (`dogrulama.md` 2.7); gerçek kaynak `weeklylib.js:52-55`, yalnız 7 gün.
4. **Madde 11 / beslenme Ö1**: "fren başlatmayı engellemez" ifadesi `roadmap.md` C maddesiyle çelişiyor; `dogrulama.md` aynı sonuca vardı. Bu analizde çelişki giderildi (11.3).
5. **Madde 10 / Dalga 1 madde 1**: iki ayrı defter önerisi (kullanilabilirlik Ö1 ve rehber-analiz Ö5); depo ve kod noktası aynı.
6. **Madde 9**: `coachlib.js:276` kural 1 yemek kcal/protein tahminini serbest bırakıyor; öte yandan `coach.js:616` haftalık yorum istemi "bu sayılar dışında rakam kullanma" diyor. Yani doğrulama iki farklı sıkılıkta olmalı (9.2).
7. Satır kayması: beslenme.md `habitlib.js:28` `fastState` diyor; fiilen `habitlib.js:24-27`. Önemsiz.

---

## Madde 8: Birleşik hekim raporu

### 8.1 İddianın yeniden doğrulanması
- Bugün dört ayrı giriş: `main/03-screens.js:96` (`reportRows`): Son 7 gün, Tansiyon, Şeker, Tahlil. Doğrulandı.
- Yedi gün raporu `WeeklyLib.build(D,endDay,days=7,...)` zaten `days` parametresi alıyor (`weeklylib.js:19`), ama `drawPage` tek sayfa ve her gün için 52 px'lik satır çiziyor (`weeklylib.js:80-90`, `ROW=52`, sayfa yüksekliği `Algo.PAGE.h=1754`, `algo.js:303`). 30 gün = 1560 px tablo; başlık+özet (~190+7*44) ile sığmaz. Yani "dönem seçici" yalnız parametre değil, yeni yerleşim ister.
- Tansiyon/şeker raporu çok sayfalı ve dönem seçmeli (7/14/30/90, `vitalsui.js:166-168`); sayfalama `VitalsLib.paginate` (`vitalslib.js:120-125`). Tahlil raporu dönem seçmez, son değer + grafik bloğu (`lablib.js:~310`, BLOCK=250).
- PDF = canvas JPEG'leri (`shareui.js:5-11`, `LabLib.buildPdf`): metin seçilemez. Bu sınır kalır (rapor altına CSV önerisi zaten var: `privacyui.js:41`).
- Ek bulgu: `homeAvg(rows,endDay,days)` pencere parametresi alır (`vitalslib.js:78`), 90 gün de çalışır.

### 8.2 Değişecek dosyalar ve modül sınırı
- Yeni `www/modules/insights/doctorlib.js` (saf, DOM yok, `WeeklyLib` kalıbı): `build(D,{from,to,questions,sections})` + `plan(data)` (sayfa dağılımı) + `drawPage(ctx,page,info)`. Mevcut `VitalsLib.reportRows/homeAvg/gStats/drawChart`, `MedLib.adherence`, `LabLib.series/rangeText/fmtN` çağrılır; lib-lib çağrısı serbest (`weeklylib.js:5`, `boundary.test.js:1-14` yalnız `S.<alan>` yakalar).
- Yeni `www/modules/insights/doctorui.js` (sheet + `canvasPdf` + `sharePdf`; `weeklyui.js` kalıbı). Veri yalnız API'den: `Log.all()`, `Vitals.all()`, `Meds.meds()/log()`, `Habits.sleep()/mood()` hazır; **eksik:** tahlil için `Labs.all()` (şimdi yalnız `Labs.latest`, `labs/index.js:3`). `S.labs` doğrudan okunursa `boundary.test.js` kırılır (insights, labs'ın sahibi değil).
- `www/index.html`: iki `<script>` satırı (weekly satırlarının yanına, 64 ve 77 civarı). `main/03-screens.js:96`: dört satırın yerine/yanına tek "Hekime hazırlan" satırı (eski dört satır "Ayrı raporlar" altında kalabilir; silmek mevcut e2e/app testlerini kırar: `app.test.js:689,2435`).
- `docs/boundary-map.md` otomatik üretilir: `node scripts/boundary-map.js` (insights dosya sayısı artar, S alanı tablosu değişmez).

### 8.3 Şema, kalıcı anahtar, yedek, `clean*`
- Zorunlu kalıcı veri yok. İsteğe bağlı: `settings.lastVisit` (gün, "son görüşme"): `DEF.settings` (`01-core.js:47`) + `DAY_KEYS` (`01-core.js:74`) satırına eklenir; `cleanSettings` (`01-core.js:75-84`) `dayOk` ile temizler, yedeğe `S` içinde girer (`backupui.js:7` tüm `S`'yi şifreler), geri yüklemede `buildState` aynı temizleyiciyi çalıştırır. Başka `clean*` değişmez.
- "Sorularım" metni kalıcı saklanmaz (PDF üretilince biter); aksi halde yeni alan + `cleanSettings` uzunluk sınırı + yedek testi gerekir. Önerilen: saklama yok.
- Yeni ağ yok, yeni izin yok.

### 8.4 Kullanıcı akışı (60 yaş)
1. Trend > "Daha fazla ölçüm" > **Hekime hazırlan** (tek satır, alt yazı "Tek PDF, yorum içermez").
2. Sayfa açılır: "Hangi dönem?" iki büyük düğme: **Son 30 gün** (seçili) / **Son 90 gün**. Altında "Son görüşmemden beri" (yalnız `lastVisit` varsa).
3. "Hekime sormak istediklerin" 5 kutu, hepsi boş ve isteğe bağlı, 140 karakter sınırı; ayrıntılı bölüm seçimi "Gelişmiş" katlanır bölümünde (tansiyon, şeker, ilaç uyumu, uyku/ruh hali, tahlil; kapalı modüller zaten yok sayılır).
4. **PDF hazırla** > paylaşım ekranı. Bitince "Görüşme tarihi bugün olsun mu?" evet/hayır (yalnız `lastVisit`).
- Metin taslağı: Başlık "Hekime hazırlan". Gövde: "Seçtiğin dönemdeki kayıtların tek PDF'te toplanır. Kayıtlar olduğu gibi yazılır; yorum ve değerlendirme yoktur. PDF şifresizdir, paylaştığın yere gider." PDF alt notu: "Kullanıcının kendi kayıtlarından derlenmiştir. Yorum içermez, tanı ve tedavi yerine geçmez. Bu değerleri hekiminle değerlendir." (mevcut `vitalslib.js:164` cümlesiyle aynı).
- Sayfa 1 başlığında **eksik gün sayısı**: "Tansiyon: 21 günün 9'unda ölçüm var" (saglik Ö1 riski: yanlış/eksik veri hekime gider).

### 8.5 Kenar durumlar ve risk
- Boş modül: bölüm "kayıt yok" yazar (sayfa boş çıkmaz). Tüm bölümler boşsa mevcut kalıp: toast "Bu dönemde rapor için kayıt yok" (`weeklyui.js:5`).
- Büyük veri: 90 gün tansiyon ~360 satır ≈ 8-9 sayfa canvas JPEG; her sayfa 1240x1754. Bellek: `canvasPdf` tüm sayfaları aynı anda tutar (`shareui.js:6`). Ölçüm gerekir; öneri: en çok 12 sayfa, aşılırsa yalnız günlük ortalama tablosu, ham satırlar kırpılır ve PDF'te yazılır.
- Tahlil bölümü kararı (SAHİBİNE KALAN): (a) yalnız değer + "Raporda yazan aralık: 70 - 100" metni, ▲/▼ yok (öneri; "yorum yok" ilkesiyle ve `legal-questions.md` §5 ile tutarlı) ya da (b) mevcut işaretli çizim. (a) seçilirse tahlil PDF'iyle tutarsız olur ama risk azalır.
- Hukuk/Play: `legal-questions.md` §5 "doktor raporu" adlandırmasını zaten soru olarak işaretlemiş; yeni düğme adı "Hekime hazırlan" bu soruyu büyütmez ama yanıt gelmeden "rapor" kelimesi artırılmamalı. Play: yorum yok, eşik yok (`play-data-safety.md` karar 4). Kaynak: Google Play Health Content politikası (`support.google.com/googleplay/android-developer/answer/16679511`, saglik.md alıntısı; dogrulama.md doğruladı).
- İlaç adları PDF'e yazılmaz (yalnız uyum %, `weeklylib.js:52-55` kalıbı); `medShowName` gizliliğiyle uyumlu. Ad listesi isteniyorsa "Gelişmiş" altında açık seçenek ve ad gizliyse çıkmaz.
- JPEG PDF erişilebilir değil (ekran okuyucu okuyamaz); ilk sürümde CSV yolu mevcut.

### 8.6 Kabul koşulları = testler
- `scripts/doctor.test.js` (yeni, saf lib): (a) 30 günlük sentetik veride tansiyon ortalaması `VitalsLib.homeAvg` ile, ilaç uyumu `MedLib.adherence` ile birebir; (b) bölüm boşsa "kayıt yok" satırı ve sayfa sayısı; (c) PDF metin kaynağında yasaklı sözcük taraması ("yüksek", "düşük", "normal", "risk", "iyi", "kötü") ve renk işareti çağrısı yok; (d) 5'ten fazla soru kırpılır; (e) `plan()` hiçbir satırı sayfa dışına koymaz (satır başı y <= RH-FOOT).
- `scripts/app.test.js` eklemesi (`app.test.js:689-696` kalıbı): düğme görünür, PDF `%PDF-` ile başlar, `numPages` beklenen, dosya adı `neowell-hekim-YYYY-MM-DD.pdf` (not: `cacheClean` regex'i `neowell-.+\.pdf` ile kapsıyor, `shareui.js:16`), kapalı modül bölümü yok.
- `scripts/boundary.test.js` değişmeden geçer; `scripts/data.test.js`'e `lastVisit` yedek tur testi (yalnız bu alan eklenirse).
- e2e: `senior.spec.js` kontrol sayısı eşiği (Daha fazla: 16, `kullanilabilirlik-gizlilik.md` tablosu) aşılmamalı; yeni satır katlanır bölüm içinde.

### 8.7 İş büyüklüğü
Orta. Gerekçe: çizim parçaları hazır ama sayfa yerleşimi (bölüm başına yükseklik hesabı) ve çok bölümlü sayfalama yeni; tahmini 300-400 satır kod + 120 satır test. En riskli kısım bellek ve sayfa taşması.

### 8.8 Yapılmaması için neden
Yok. Düşük risk, yüksek değer. Şart: "doktor raporu" adlandırma sorusu hukukçuya gitmeden yeni metin eklenmemeli; tahlil işareti kararı verilmeli.

---

## Madde 9: Rehber rakam doğrulama

### 9.1 İddianın yeniden doğrulanması
- Model yanıtı doğrulanmıyor: `cReply` metni olduğu gibi kaydediyor (`coach.js:398-399`: `text:o.reply||"Tamam."`); `CoachLib.parse` yalnız uzunluk kırpıyor (`coachlib.js:74`). `grep -n "numsOk\|rakam" coach*.js` yok; doğrulandı.
- Tek yanıt hunisi: `cReply` üç yerden çağrılıyor (`coach.js:388` sohbet, `:464` plato, `:619` yorum). Burası tek nokta.
- Modelin gördüğü metin tek yerde derleniyor: `cMessages` (`coach.js:214-225`), bağlam `CoachLib.contextText` (`coachlib.js:309-339`). Gönderilen mesajlar `msgs.pii` ile birlikte `cAsk`'a gidiyor.
- Yasal tahmin alanları: kural 1 yemek kcal/protein (`coachlib.js:276`), kural 9 `food` kartı (`:284,293`), `log[]` içinde kcal/protein/karb/yağ/ml/dk/kg (`:291`, temizleyici `cleanItems` `coachlib.js:89-107`), `propose.kcal`. Bunlar bağlamda yok ve yanıt metninde geçebilir: `dogrulama.md` "yanlış alarm" uyarısı yerinde.
- Ek bulgu: kural 8-9 gereği model yemek için "yaklaşık 280 kcal" yazar ve ayrıca kart koyar. Kart sayısı yanıt JSON'unda (`o.food`, `o.log`) hazır.

### 9.2 Tasarım (değişen kısım)
- İzinli sayı kümesi = (a) giden mesajların `user` ve `system` içeriği (asistan geçmişi HARİÇ: model eski yanlışını "kaynak" yapmasın), (b) `Object.values(messages.pii)` (maskelenmiş özgün metinler; yanıt yerelde unmask edildiği için), (c) aynı yanıtın `log/food/propose/program/menu` alanlarındaki sayılar.
- Kontrol edilen sayılar: yanıt metnindeki ondalıklı ya da >=11 değerler. Muaf: 1-10 arası tam sayılar, saat (`\d{1,2}:\d{2}`), "112", yıl (`19xx|20xx`), ay adının yanındaki gün, madde numaraları. Türkçe biçim: `1.850` binlik, `82,4` ondalık normalize edilir.
- Eşleşme: yanıttaki sayının son hanesi kadar tolerans (82 ile 82,4 eşleşir; 82,4 ile 82,9 eşleşmez); tam sayılarda %1.
- Katı mod: `kind` dolu yorumlarda (`weekly/plan/plateau`), çünkü istem zaten "bu sayılar dışında rakam kullanma" diyor (`coach.js:616`). Sohbette gevşek mod: `kcal|g|protein` birimli sayılar yalnızca aynı yanıtta yemek kartı yoksa ve kullanıcı mesajında yemek yoksa işaretlenir; yoksa muaf. Yani mümkün yanlış alarmı azaltır, kaçırma olasılığını artırır; bu bilinçli taviz yazılmalı.
- Yeniden sorma v1'de YOK (jeton ve süre bütçesi `BUDGET=60000`, `coach.js:295`); yalnız etiket.
- Sonuç mesaja yazılır: `msg.nx=<sayı adedi>` (1-9). `cleanChat` (`coach.js:115-123`) yeni alanı tamsayı 1..9 olarak tutmalı; eski yedeklerde alan yok = sorun yok.

### 9.3 Değişecek dosyalar ve sınır
- `www/modules/coach/coachlib.js`: saf `numCheck(reply,allowedText,strict)` ve `export` listesine ekleme (`coachlib.js:363`). Dosya zaten 365 satır; ~40 satır eklenir.
- `www/modules/coach/coach.js`: `cReply(o,kind)` imzasına `ctx` (gönderilen mesajlar) taşımak gerekir; `cAsk` dönüşünde `r.msgs` döndürülür (şimdi `{text,provider}` döner, `coach.js:341`). 3 çağrı yeri güncellenir. Mesaj kartı çizimine tek satır: `coach.js:739` civarı (`m.nx` varsa `<p class="mut sm">`).
- Sınır: yalnız coach modülü; `S.chat` coach'un. `boundary.test.js` etkilenmez. Yeni bağımlılık yok.

### 9.4 Şema ve yedek
`S.chat[].nx` (coach'un alanı): `cleanChat` içinde `Number.isInteger(m.nx)&&m.nx>=1&&m.nx<=9`. Arşiv (`chats[].msgs`) aynı `cleanChat`'ten geçiyor (`coach.js:97-100`), ek iş yok. Yedek: `S` içinde, otomatik.

### 9.5 Kullanıcı akışı ve metin
Kullanıcı hiçbir şey yapmaz. Yanıt balonunun altında, yalnız işaret varsa, tek satır soluk yazı: "Bu yanıttaki 2 rakamı kayıtlarında bulamadım; kesin sayma." (tek rakam: "Bu yanıttaki 1 rakamı kayıtlarında bulamadım; kesin sayma."). Teknik terim, düğme, renk yok. Yorum kartlarında (katı mod) aynı cümle.
- Kaçınılacak ifade: "yanlış", "hata". Model türetilmiş sayı (iki kilonun farkı) üretebilir; bu yüzden cümle "bulamadım".

### 9.6 Kenar durumlar ve risk
- Türetilmiş sayılar (fark, toplam) bu tasarımda işaretlenir; kabul edilen yanlış alarm sınıfı. Fark/toplam izni (çift farkı) eklemek izinli kümeyi şişirip gerçek halüsinasyonu kaçırır; önerilmez.
- PII: kimlik etiketi sayı içerebilir (tel, TC): kontrol maskelenmemiş metinle (`msgs.pii` değerleri) yapılır.
- Güvenlik: doğrulama yalnız ek bilgi; güvenlik kartları (`cSafety`) ve KISIT satırı ayrı kalır, dokunulmaz.
- Tıbbi/hukuki risk yok; Play AI-Generated Content uyumuna yardımcı olur ama "bildir" gereksinimini karşılamaz (Ö2 ayrı; rehber-analiz Ö2 açık soru).
- Yanlış güven riski: işaret yokken kullanıcı "doğrulandı" sanabilir. Bu yüzden olumlu bir "doğrulandı" rozeti KONMAZ; yalnız uyarı gösterilir.

### 9.7 Kabul koşulları = testler
- `scripts/coachnum.test.js` (yeni, saf): en az 14 satırlık tablo. Beklenen: bağlamda 1850 varsa "ortalama 1850" geçen yanıt işaretsiz; "ortalama 2100" işaretli; "1.850" ile "1850" aynı; "82" ile bağlamdaki 82,4 eşleşir; "08:30", "112", "3 öğün", "2026" muaf; asistan geçmişindeki sayı izinli sayılmaz; kullanıcı mesajındaki sayı izinli; `food.kcal=280` ve yanıtta "280 kcal" işaretsiz; sohbet modunda kartsız "280 kcal" gevşek modda işaretsiz, katı modda işaretli.
- `scripts/coach2.test.js`'e: `cReply` sonrası `msg.nx` ve `cleanChat` turu (alan korunur, 0 ve 10 atılır).
- `scripts/app.test.js`: işaretli mesajda cümle görünür, işaretsizde görünmez.
- Yayından önce ölçüm (test dışı): gerçek yanıtlarla yanlış alarm oranı; hedef <%10. Elde gerçek yanıt külliyatı yok (arama: `scripts/` içinde örnek yanıt dosyası yok), bu yüzden eşik telefonda deneme sürecinde ayarlanır; bu bir açık risk.

### 9.8 İş büyüklüğü
Küçük-orta. Lib ~40 satır, `cReply`/`cAsk` imza değişikliği ~15 satır, test ~80 satır; asıl emek yanlış alarm listesi ve telefonda ayar. rehber-analiz'in "~40 satır" tahmini lib için doğru, test ve imza işini atlamış.

### 9.9 Yapılmaması için neden
Yok. Koşul: "doğrulandı" rozeti yok, yeniden sorma yok, gevşek/katı iki mod yazılı.

---

## Madde 10: "Rehber'e ne gitti" defteri

### 10.1 İddianın yeniden doğrulanması
- Gönderim tek kapıdan: `gate` (`coach.js:213`) ve `callProvider` `fetch` (`coach.js:246`). Metin saklanmıyor: sohbet S.chat'te kalır ama giden bağlam (14 gün tablo, ilaçlar) hiçbir yerde tutulmuyor; yalnız jeton sayacı localStorage'da (`coach.js:228-237`, `coachlib.js:341-362`). Doğrulandı.
- Uzunluk/kategori bilgisi mevcut: `d.off` (kapalı kategoriler, `coach.js:189`), `SHARE` 8 kategori (`coach.js:168`), `msgs.pii` maskeleme sayısı (`coach.js:316-317`).
- Önemli bulgu (rehber-analiz'de yok): her `cAsk` zincirde başarısız sağlayıcıdan sonra başka sağlayıcıya aynı istemi yeniden gönderiyor (`coach.js:334-343`) ve `callProvider` uzunluk kesilince 3 kat jetonla ikinci kez gönderiyor (`coach.js:251-252`). Defter "kullanıcı bir kez bastı" değil, **her HTTP isteğini** kaydetmeli; aksi halde defter eksik anlatır.
- Bağlamda ilaç adı/doz, "KULLANDIĞI İLAÇLAR" satırı anahtar sözcük aramasından bağımsız hep gidiyor (`coachlib.js:329`, `meds.length` doluysa); ayrıca "SAĞLIK NOTU" (`:314`). Defter bu satırları "İlaç adı ve doz" olarak yazmalı; kullanıcı için en değerli bilgi bu.

### 10.2 Dalga 1 madde 1 ile birleşme
Dalga 1 #1 (kullanilabilirlik Ö1) üç ağ noktasını (`04-sheets.js:167`, `coach.js:246`, `coach.js:261`) tek kernel sarmalayıcıyla kaydediyor. Madde 10 bunun **Rehber satırı için ayrıntı alanları**dır. İki ayrı depo yapmak çift bakım ve tutarsız silme demektir. Öneri: tek anahtar `nw_state_sent` (localStorage), kayıt şeması:
`{t:ms, h:"coach"|"off"|"models", p:"anthropic|model", w:"chat"|"yorum"|"program"|"menu"|"deneme", k:["Profil","Kilo",...,"Mesajın"], c:<karakter>, m:<maske sayısı>, s:"ok"|"err"}`; `h:"off"` satırında yalnız `p:"openfoodfacts"`, barkod numarası değil.

### 10.3 Değişecek dosyalar ve sınır
- Çekirdek: yeni `www/kernel/egress.js` (`add(rec)`, `list()`, `clear()`; `usageAdd` kalıbı: 90 gün/100 kayıt halka tampon, her okumada şekil temizliği). `kernel/` modül tanımaz; modüller çağırır (`docs/boundary-map.md`, kernel/kernel.js:12 kalıbı).
- `modules/coach/coachlib.js`: saf `sentKinds(ctxText,d)` bağlam metninden bölüm başlıklarına bakarak kategori listesi çıkarır ("PROFİL", "HESAPLANAN", "SON 14 GÜN", "KULLANDIĞI İLAÇLAR", "SON ANTRENMANLAR", "SON NOTLAR"). Metinden türetmek, `contextText`'in gerçekte ne ürettiğiyle defterin ayrışmasını engeller.
- `modules/coach/coach.js` `callProvider` içinde `fetch`ten hemen önce `Egress.add(...)`; sonuç `s` fetch sonrası güncellenir. `callProvider`a `o.why` (amaç) parametresi: çağrı yerleri `cAsk(msgs,mt,{why:"chat"})` (3-6 yer).
- `modules/data/privacyui.js`: "İnternete çıkanlar" bölümüne liste (`privacyui.js:22-30` yazısı kalır); `main/07-actions.js:50` reset listesine `nw_state_sent`; `Data.privacy` kategorisi (localStorage olduğu için S sayısı değil `Egress.list().length`, `privacyui.js:4` kalıbı).
- `docs/privacy-policy.md` §6 (saklama) ve `play-data-safety.md`: yerel üst veri notu. Yeni izin/ağ yok.

### 10.4 Şema, yedek, `clean*`
- `S`'e girmez: yedeğe girmez (cihaz-yerel kayıt; `nw_state_usage` ile aynı, `cycle.test.js:96-98` silme testi emsali). Gerekçe: yeni telefona geçince eski telefonun giden listesi anlamsız. Ödünleşim: yedekten dönen kullanıcı geçmişi kaybeder; kabul edilebilir.
- `clean*` yok; okuma tarafı `Egress.list()` şekil/boyut temizler (bozuk JSON = boş liste). Alan sınırları: `k` en çok 10 etiket, `p` 60 karakter, `c` 0..1e6.

### 10.5 Kullanıcı akışı ve metin
1. Ayarlar > Gizlilik ve veri > "İnternete çıkanlar".
2. Tek cümle: "Son 30 günde Rehber'e 7 istek gitti. Metinlerin kendisi saklanmaz."
3. "Ayrıntı" katlanır: satır başına "12 Eki 14:32 · Anthropic · Sohbet · Kilo, Yemek, İlaç adı ve doz · 3 kimlik parçası maskelendi". Altta **Listeyi sil**.
4. Hiç gönderim yoksa: "Hiçbir şey gitmedi."
- Başlık dürüstlüğü: "NeoWell'in kendi gönderdikleri". Google ML Kit/Play hizmetleri trafiği WebView'den görünmez; `play-data-safety.md` bunu "doğrulanmadı" diye işaretlemiş. Ekran "telefondan çıkan her şey" demez.
- Soru başı veri çipleri ("Bu soruya gidecek: Kilo, Yemek"): `contextText` anahtar sözcükle zaten daraltıyor ve ilaç satırı koşulsuz gidiyor (10.1); çip göstermek kullanıcıya vaat verir, sonra kapatma mantığı (seferlik anahtar) `cData` + `contextText`'i değiştirir. Ayrı iş, ertelendi; RED değil.

### 10.6 Kenar durumlar ve risk
- Silme sırası: kullanıcı "Rehber sohbetini sil" derse defter silinmez (ayrı kategori); aksi halde "ne gitti" kanıtı kaybolur. Metin zaten tutulmadığı için silinmemesi gizlilik riski değil.
- Saat dilimi/tarih: `t` ms; gösterim `fd`.
- `h:"models"` satırı yalnız anahtarın başlıkta gittiğini gösterir; sağlık verisi gitmedi diye yazılmalı (`privacyui.js` mevcut cümlesi aynı: "Kurulumda yalnız anahtarın ve bir deneme cümlesi gider").
- Hukuk: KVKK açısından ek veri üretmez (yerel üst veri). `legal-questions.md` §2 (yurt dışı aktarım) sorusunu etkilemez.
- Doğruluk: halka tampon taşınca eski satır silinir; "Son 30 günde N istek" cümlesi tampon 100 kaydı aşarsa eksik sayar; cümle "son N kayıt" diye yazılmalı ya da sayaç ayrı tutulmalı.

### 10.7 Kabul koşulları = testler
- `scripts/egress.test.js` (yeni; Dalga 1 #1 ile ortak): gönderim sonrası kayıt oluşur ve **hiçbir alanda mesaj metni geçmez** (sentinel kelimeyle tara); kategori kapalıyken kayıtta o kategori yok; sağlayıcı zinciri 2 sağlayıcıyı denerse 2 kayıt; uzunluk yeniden denemesi ek kayıt; kaynak taraması: `fetch(` içeren her dosya `Egress.add` çağırıyor (yeni `fetch` eklenirse test kırılır; `04-sheets.js:167` dahil).
- `scripts/coach.test.js`: `sentKinds` tablo testi (ilaç bağlamda varsa "İlaç adı ve doz"; anahtar sözcüksüz soruda "SON NOTLAR" yok).
- `scripts/cycle.test.js:96` kalıbında: "Tüm verileri sil" `nw_state_sent`'i temizler; kategori silme.
- `app.test.js`: liste boşken "Hiçbir şey gitmedi".

### 10.8 İş büyüklüğü
Orta, ama Dalga 1 #1 ile birlikte yapılırsa +küçük (Rehber ayrıntı alanları ~50 satır). Tek başına yapılırsa orta (kernel sarmalayıcı dahil ~150 satır + test).

### 10.9 Yapılmaması için neden
Yok. Koşul: Dalga 1 #1 ile birleştirilsin; soru başı çipler ayrı karar.

---

## Madde 11: Ramazan modu

### 11.1 İddianın yeniden doğrulanması
- Kodda Ramazan/imsak/iftar yok: `rg -i "ramazan|iftar|sahur|imsak" www` boş (beslenme.md aynı sonuç).
- Mevcut oruç: sabit planlar 14/16/18/20 (`habitlib.js:4`), `S.fast={plan,t0,log}` (`habitlib.js:9-13`); başlatma `fastGo` (`habitui.js:34-43`). Kural: sert bayrakta başlatma kapalı (`habitui.js:25,37`), 18+ saatlik planlarda tek seferlik ek onay (`LONG_PLAN=18`).
- Bildirim: hatırlatma 11 `fastBlock` ile kurulmuyor (`05-notifications.js:44` `r.id===11&&fastBlock`), süren orucun bitiş bildirimi 9100 de (`:54`). Her bildirim günü tek tek "one-shot" alarm olarak 30 gün ileri kuruluyor (`:44-52`, `SCHED_DAYS=30`), dolayısıyla her gün için farklı saat verilebilir.
- Risk freni `Algo.riskFlags` (`algo.js:117-130`): **sert** = 18 yaş altı, yeme bozukluğu işareti, hamilelik/emzirme, BMI<18,5 ya da hedef BMI<18,5; **yumuşak** = sağlık notu, ilaç kaydı, son 90 günde şeker/tansiyon ölçümü (30 gün "Hekimime danıştım" ile kalkar). `roadmap.md:72` bunları belgeliyor.
- Pratik sonuç (rapora girmemiş): ilaç kullanan ya da tansiyon ölçümü kayıtlı bir 60 yaşındaki kullanıcıda **yumuşak** frende `block` dolu; yani Ramazan modunda geri sayım ve bildirim "Hekimime danıştım" onayı olmadan açılmamalı. Bu çoğu hedef kullanıcıyı kapsar.

### 11.2 Saat hesabı: cihazda, ağsız, ölçüldü
**Algoritma**: Güneşin konumu için düşük duyarlıklı (NOAA/Meeus tipi) denklemler: günün juliyen gününden boylam, eğim (declination) ve zaman denklemi; her vakit için saat açısı `H = acos((sin(-h) - sin(lat) sin(dec)) / (cos(lat) cos(dec)))`, 5 tekrar yineleme. İmsak = güneş ufkun 18° altında (sabah), yatsı 17° (gerekmez). Akşam/iftar = gün batımı (h=0,833°) + 8 dk.
**Kaynak/doğrulama**: Diyanet'in açıları 18° imsak ve 17° yatsı (Diyanet'e atfedilen açıklama, `praytimes.net` ve `takvim.com.tr` sonuçları ikincil; Adhan kütüphanesi `Turkey` yöntemi: `CalculationParameters('Turkey',18,17)` ve `sunrise:-7, dhuhr:5, asr:4, maghrib:7`, `github.com/batoulapps/adhan-js/src/CalculationMethod.ts`, 2026-10-10). Bu oturumda kendi hesabımı Diyanet verisinin kamusal aynasıyla (`ezanvakti.emushaf.net/vakitler/{ilceId}`, Diyanet verisi; resmi sayfa değil) karşılaştırdım: 6 il merkezi (Ankara, İstanbul, İzmir, Erzurum, Kars, Edirne), her biri 32 gün (6 Ekim - 6 Kasım 2026 dönemi): **imsak farkı -1..+1 dk** (Ankara ve Erzurum 0..0), **akşam = hesaplanan gün batımı + 7..8 dk** (sonra +8 ile fark -1..0 dk), yatsı -2..0 dk. Betik: oturum kapsamında yazıldı, repoda yok.
**Sınırlar (dürüst)**:
1. Yalnız Ekim-Kasım 2026 ölçüldü. Ramazan 2027 (Şubat-Mart civarı) için Diyanet verisi bu oturumda yoktu; mevsim bağımlılığı **doğrulanmadı**. Uygulama öncesi Diyanet'in yayımlanmış Ramazan imsakiyesiyle ±2 dk testi zorunlu.
2. Koordinat tablosu (81 il merkezi enlem/boylam) repoda yok; kaynak gerekir (ör. TÜİK/Wikipedia/GeoNames, lisansı kontrol). İlçe farkı Diyanet'te ayrı satır; il merkeziyle ilçe arasındaki dakika farkı ölçülemedi (API oturum içinde sınırladı), DOĞRULANAMADI. Doğu-batı geniş illerde (Erzurum, Van) birkaç dk bekleniyor; çözüm: kullanıcıya -5..+5 dk "düzeltme" alanı ve metinde "yaklaşık".
3. Rakım/refraksiyon farkı Diyanet'in kendi tablosundan farklı olabilir; "camide ya da Diyanet takviminde yazanla karşılaştır" uyarısı şart.
4. Dini bir vakit ilanı değil, hesaplanmış yaklaşık değer: uygulama "imsak/iftar vakti budur" hükmü vermez.

**Başlangıç tarihi otomatik olamaz**: Aynı gün için `Intl.DateTimeFormat('en-u-ca-<takvim>')` takvimleri 1 gün farklı çıktı (Node/ICU, 2027-02-07: `islamic-umalqura` 8/30/1448, `islamic-civil` 8/29/1448, `islamic` 9/1/1448; 2027-02-08'de üçü de 9/1). Diyanet kendi takvimini ilan eder (beslenme.md: 8 Şubat 2027, haber siteleri, DOĞRULANAMADI) ve Chrome 60 WebView'de bu takvimlerin bulunup bulunmadığı cihazda sınanmadı. Sonuç: mod kullanıcı tarafından elle açılır ve kapatılır; "otomatik başla/bitir" YOK.

### 11.3 Orucun risk freniyle etkileşimi (kural)
- **Sert bayrak**: Ramazan modu açılamaz. Ayarda satır pasif; açıklama: "Bu mod, oruç tutmanın sana uygun olmayabileceği bir işaret (yaş, hamilelik, yeme düzeni, düşük kilo) olduğu için kapalı. Oruç tutmayı düşünüyorsan önce hekimine danış." İmsak/iftar saatleri de gösterilmez (geri sayım ve hatırlatma yok; en fazla bu bilgi satırı). Gerekçe: `roadmap.md:72` ve `dogrulama.md` 4.2 sonucu; yeme bozukluğunda sayaç/geri sayım tetikleyici olabilir (kaynak: Play Health Content "hekime danış" şartı, `support.google.com/googleplay/android-developer/answer/16679511`; uygulamanın kendi `Algo.riskFlags` gerekçesi).
- **Yumuşak bayrak** (ilaç, tansiyon/şeker kaydı, sağlık notu): `riskok` ("Hekimime danıştım", 30 gün, `main/07-actions.js:46`) olmadan geri sayım ve bildirimler kurulmaz; mod açılabilir ama imsak/iftar satırı da onaydan önce gösterilmez (tutarlılık için karar; istenirse yalnız satır serbest bırakılabilir). Onay sonrası geri sayım+bildirim açılır. `risk().block` zaten kaynak (`habitui.js:25`, `05-notifications.js:42`); yeni mantık yazılmaz.
- İlk açılışta mevcut `fastInfo` bilgilendirmesi (`habitui.js:48-52`, diyabet/insülin/hamilelik/18 altı) gösterilir ve `fastInfoOk` onayı ister; Ramazan'da aynı kapıdan geçer, onay yeniden yazılmaz.
- Diyabet ve ilaç: IDF-DAR Ramazan kılavuzu, oruç öncesi değerlendirme önerir (6-8 hafta önce) ve yüksek riskli grupları sınıflar (Diabetes Res Clin Pract 2017;126:303-316, PubMed 28347497; özet düzeyinde okundu, tam metin okunmadı). Uygulama bu sınıflamayı YAPMAZ; yalnız metinde "hekimine danış" der. Şeker/tansiyon kaydı olan kullanıcı zaten yumuşak bayrakla onay kapısından geçer.
- **RED alt özellik**: ilaç hatırlatma saatlerini sahur/iftara kaydırma ya da önerme. Doz zamanı tıbbi karardır (`coachlib.js:280,286` kuralları ile aynı çizgi); ilaç alarmlarına dokunulmaz. Metne tek cümle: "İlaç saatlerini hekimine sormadan değiştirme."
- Mevcut `S.fast` ile ilişki: Ramazan modu `S.fast`'i KULLANMAZ. `cleanFast` 14/16/18/20 dışını 16'ya çeviriyor (`habitlib.js:12`); beslenme.md'nin `fast.mode:"ramazan"` önerisi gereksiz ve `fast.log` geçmişini kirletir. Ramazan günlük geri sayımı kalıcı veri değil, anlık hesap.

### 11.4 Değişecek dosyalar ve modül sınırı
- Yeni `www/modules/habits/ramadanlib.js` (saf: güneş hesabı, `times(day,lat,lon,adjMin)`, koordinat tablosu `CITIES` 81 satır ≈ 3 KB) ve `ramadanui.js` (Bugün satırı, ayar satırı, sheet). Oruç `habits` modülünde olduğundan aynı klasör doğal; `S.settings` çekirdeğin.
- `main/01-core.js`: `DEF.settings` + `ramOn` (bool), `ramCity` (RANGES `[0,81,true]`, 0 = seçilmedi), `ramAdj` (`[-9,9,true]`; `ZEROOK`'a 0 için), `ramFrom` (`DAY_KEYS`'e, otomatik kapanma için). `cleanSettings` bool/aralık/gün döngüleri (`01-core.js:76-83`) bunları otomatik temizler; ek `clean*` yazılmaz.
- `main/05-notifications.js`: `scheduleReminders` içinde `if(ramOn&&!fastBlock)` ile imsak-45 dk (sahur) ve iftar-5 dk bildirimi; yeni kimlikler 9200+gün; `keep` kümesine alınmaz (her seferinde iptal-yeniden kurma mevcut akışta). Alarm bütçesi `MedLib.BUDGET` ortak; 30 gün x 2 = 60 ek alarm, ilaç ağırlıklı kullanıcıda en uzak gün düşer (kabul, kod zaten nearest-first).
- `main/03-screens.js` Bugün: `habitRow`/`fastTodo` yanına tek satır; `modules.js` değişmez (yeni S anahtarı yok, hepsi `settings`).
- Su bölme: yalnız metin ("Su hedefini iftar ile sahur arasında içebilirsin"); hedefi değiştirmez (`waterMl` aynı). Öğün etiketi (Kahvaltı/Akşam yerine Sahur/İftar) v1'de YOK: `LogLib.mealOf` saat aralığına bağlı (`loglib.js:85`: 05-11 kahvaltı, 16-21 akşam; sahur 04:00 civarı "atıştırmalık" çıkar), anahtar eklemek `MEALS`, `cleanEntries`, `MEAL_KEYS`, CSV'yi etkiler. İstenirse v2: etiket yeniden adlandırma yalnız görünümde.
- Yeni izin yok: konum izni gereksiz (il listesi). Manifestte `ACCESS_FINE_LOCATION` var ama kullanılmaz (beslenme.md doğru).
- Play: bu mod sağlık uygulaması beyanını değiştirmez; "hekime danış" metni uygulama içinde mevcut. Dini içerik beyanı Data safety'yi etkilemez (yeni veri yok).

### 11.5 Kullanıcı akışı (60 yaş) ve metin
1. Ayarlar > Modüller > **Ramazan modu** anahtarı (kapalı başlar). Sert bayrakta satır pasif, açıklama yukarıdaki.
2. Açınca (yumuşak bayrakta önce mevcut "Hekimime danıştım" kapısı): "Hangi ildesin?" tek liste (arama kutusu, 81 il); sonra isteğe bağlı "Saat farkı" (-9..+9 dk, varsayılan 0, "Camideki saatle uyuşmuyorsa ayarla").
3. Bugün ekranında tek kart, büyük yazı: **"İftara 2 sa 10 dk"** (gündüz), **"Sahura 1 sa 20 dk"** (geceleyin, imsaktan önce); altında soluk: "İmsak 05:32 · İftar 18:50 · yaklaşık".
4. İsteğe bağlı iki hatırlatma anahtarı: "Sahur hatırlat (imsaktan 45 dk önce)", "İftar hatırlat". Varsayılan kapalı.
5. Kapatma: aynı anahtar. Otomatik kapanma: açıldıktan 31 gün sonra "Ramazan bitti mi? Modu kapatalım mı?" sorusu (`ramFrom`).
- Metinler: Anahtar altı "İmsak ve iftar saatlerini ilin için hesaplar. Yaklaşık değerdir, resmî takvimle karşılaştır." Bilgi kutusu: "Oruç tutmak sana uygun olmayabilir: hamilelik, emzirme, diyabet, ilaç kullanımı, yeme düzeni sorunu ya da düşük kilo varsa önce hekimine danış. Baş dönmesi, halsizlik ya da çarpıntı olursa orucu bırak ve hekimine danış. İlaç saatlerini hekimine sormadan değiştirme." Uygulama oruç tutmayı teşvik etmez ifadesi bilgi satırına: "NeoWell oruç tutmayı önermez; tutan kişi için saat bilgisi verir."

### 11.6 Kenar durumlar
- Gece yarısını aşan geri sayım ("iftara" -> "sahura"): imsak ile iftar arası gündüz = oruç penceresi; iftar-imsak arası gece. Yarın imsakı için ertesi günün hesabı gerekir.
- Yaz saati: Türkiye 2016'dan beri kalıcı UTC+3. Saat dilimi telefondan değil sabit +3 ile hesaplanmalı; kullanıcı yurt dışındaysa (il listesi yalnız TR) saatler yanlış. Telefon saat dilimi +3 değilse karta "Bu hesap Türkiye saatine göredir" notu (`Intl.DateTimeFormat().resolvedOptions().timeZone` Chrome 60'ta var; cihazda doğrulanmadı).
- Saat/tarih elle değişirse hesap yeniden yapılır (anlık).
- Kutup/yüksek enlem: gerekmez (TR enlemlerinde `|c|<=1` hep sağlanır; test ile 36-42° için doğrulanır).
- Ramazan günü aşırı uzun/kısa: Türkiye'de Şubat 2027 gündüz yaklaşık 12,5-13,5 saat; yaz Ramazanlarında 16-17 saate çıkar. Bu yüzden `LONG_PLAN` mantığı (18 saat) burada işlemez; yaz Ramazanı için ek uyarı: gündüz süresi 16 saati aşarsa "Gündüz bu yıl uzun; hekimine danış" satırı (eşik sezgisel, kaynaksız, ayarlanabilir sabit).
- Süren normal oruç (S.fast.t0) varken Ramazan modu açılırsa: önce biten, çakışma yok (`fastToggle` kalıbı: "Önce orucu bitir").

### 11.7 Kabul koşulları = testler
- `scripts/prayer.test.js` (yeni, saf): (a) 6 il x 31 gün Diyanet fixture'ı (bu oturumda alınan veri JSON olarak `scripts/fixtures/` altına konur; kaynak URL ve erişim tarihi dosya başında): imsak |fark| <= 2 dk, iftar <= 2 dk; (b) **Ramazan 2027 imsakiyesi** yayımlandığında 3 il için aynı test (mevsim doğrulaması; bu olmadan mod yayımlanmaz); (c) `ramAdj` toplanır; (d) 36-42° enlemde NaN yok.
- `scripts/risk.test.js` eklemesi: sert bayrakta `ramOn` temizleyiciden sonra bile bildirim listesi boş ve satır pasif; yumuşak bayrakta onay yokken bildirim yok, onaydan sonra var; `riskClearedAt` 30 gün sonunda tekrar kapanır.
- `scripts/data.test.js`/`backup.test.js`: yeni 4 ayar yedek turundan geçer; aralık dışı `ramCity` 0'a düşer; `S.fast` değişmez.
- `scripts/habit.test.js`: 14/16/18/20 planları ve `cleanFast` aynen (mod kapalıyken regresyon yok).
- `app.test.js`: kart metni biçimi, mod kapanınca kart yok; `scripts/android.test.js`: yeni izin eklenmedi.
- Telefonda (kullanıcı): bildirim saatleri il takvimiyle uyuşuyor mu.

### 11.8 İş büyüklüğü
Orta-büyük. Gerekçe: saf hesap ~60 satır ve ölçüldü; asıl iş koordinat tablosunun kaynaklı hazırlanması, bildirim kurulumu, iki ekran, risk freni testleri, mevsim doğrulaması (dış veri beklemeli). Tahmini 350-450 satır + 150 satır test + fixture.

### 11.9 Yapılmaması için neden / RED önerisi
Mod kendisi RED değil; ama **şart bağlı**: (1) Ramazan 2027 Diyanet imsakiyesiyle ±2 dk doğrulama yapılmadan yayınlanmaz, (2) sert bayrakta kapalı, (3) hekime-danış metni hukukçu/hekim gözünden geçmeden (roadmap'te "oruç bilgilendirmesi hekim/hukukçu gözünden geçmedi" açık maddesi, `roadmap.md` Güvenlik freni "Açık" satırı) yayına çıkmaz. Rakip kıyasına dayanan "büyük fark" iddiası kullanılmaz (dogrulama.md 4.1: Türkçe/İslami uygulamalar taranmadı). Yapılmayacaklar: otomatik Hicri başlangıç, ilaç saati kaydırma, "oruç açma/iftar menüsü kalori hedefi", kilo-oruç ilişkisi gösterimi.

---

## Madde 12: Haftalık hareket kılavuzu kartı

### 12.1 İddianın yeniden doğrulanması
- WHO sayıları: yetişkin "at least 150-300 min of moderate-intensity aerobic physical activity" ya da "75-150 min vigorous" ya da eşdeğer birleşim; kas güçlendirme "2 or more days a week"; 65+ için "varied multicomponent physical activity that emphasises functional balance and strength training ... 3 or more days a week"; kısıtlı kişi için "according to their abilities" (Bull ve ark., Br J Sports Med 2020, `pmc.ncbi.nlm.nih.gov/articles/PMC7719906/`, 2026-10-10, metin ilk 100.000 karakter okundu). Kaynak üzerinden doğrulandı. WHO bilgi notu sayfası bu ayrıntıları vermiyor (aynı gün denendi); kart kaynağı olarak PMC makalesi gösterilmeli.
- Mevcut hareket verisi: haftalık spor dakikası `sum("exercise",...)` (`03-screens.js:118`), `sportWeek` hedef (`01-core.js:47`, aralık 10-3000). **Bu toplam salon antrenmanını da içeriyor** (`gym.js:557-559`) ve yoğunluk ayrımı yok. Algılanan yürüyüş/koşu (`S.moves`) bu toplama girmiyor, yalnız kcal'e (`algo.js:224-235`).
- Kuvvet günü sayacı yok: `grep -rn "strengthDays|kuvvet gün" www` boş (hareket-spor ile aynı).
- Kardiyo kayıtları `ck` alanlı `exercise` girişleri (`cardiolib.js:3-4,32`); kadans eşiği 100 adım/dk kaynağı CADENCE-Adults yalnız 41-60 yaş (hareket-spor DOĞRULANAMADI 8, dogrulama.md 3). Hedef kullanıcımız 60+ olduğundan yoğunluk sınıflaması kanıtsız.
- Ek bulgu: rehberli akışlar da `gLogExercise` ile `exercise` kaydı yazıyor (`guideui.js:120`, ısınma hariç `!gd.meta.warm`); yani Esneme/Tabata akışı "spor dakikası"na giriyor. "Kuvvet günü" tanımı bu yüzden egzersiz kategorisine (`c:"g"`, `exlib.js:3`) bakmalı, her antrenmana değil.

### 12.2 Değişen kapsam
Kart yalnız: (1) **Spor süresi** `X / sportWeek dk` (mevcut sayı, aynı kaynak; yeni "tempolu" iddiası yok), (2) **Kuvvet günü** `Y / 2` (S.workouts'tan). 65 yaş ve üstü için üçüncü "denge ve kuvvet" satırı **eklenmez** (kütüphanede denge içeriği yok, hareket-spor Ö4 yapılmadı; kullanıcıya takip edemeyeceği hedef vermek 60+ için yanıltıcı). Bunun yerine 65+ için bilgi cümlesi: "65 yaş üstü için kılavuz, haftada 3 gün denge ve kuvvet çalışmasını da önerir." (kaynaklı, hedef çubuğu değil.)
WHO 150-300 aralığı ile `sportWeek` (varsayılan 150) uyumlu; kullanıcı hedefi değiştirmişse (ör. 90 dk) kart kendi hedefini gösterir, "kılavuz 150" ayrı gösterilmez.

### 12.3 Değişecek dosyalar ve sınır
- Yeni `www/modules/insights/activitylib.js` (saf): `weekMove({entries,workouts,from,to,exCat})` -> `{min, days, strengthDays}`. Kuvvet günü = `w.t1!=null`, gün `from..to` içinde, ve o antrenmanda `c==="g"` olan egzersizlerde toplam >= 3 çalışma seti (`gSetOk`, ısınma hariç; eşik sezgisel, kaynaksız, ayarlanabilir sabit). Egzersiz kategorisi `gEx(id).c` salon modülünde; saf lib'e `exCat` fonksiyonu enjekte edilir (`Gym` API'si).
- `modules/gym/index.js`: `Gym.workouts()` zaten var (`index.js:12-14`); kategori için `Gym.cat(id)` eklenir (1 satır). `S.moves` gerekmediği için `Motion` API'si yok.
- Kart çizimi: `main/03-screens.js` Trend "Hareket" sekmesi (`:125`, `cardioCard()` yanına) ve "Daha fazla ölçüm" içindeki haftalık spor satırı (`:135`) bu kartı gösterir. Bugün'e eklenmez (ekran kalabalığı; `senior.spec.js` kontrol sayısı).
- Sınır haritası: `S.workouts` yalnız `Gym` API'siyle okunur; `boundary.test.js` geçer.

### 12.4 Şema, yedek
Yeni veri yok, yeni ayar yok (kuvvet gün hedefi 2 sabit; kullanıcı ayarı gerekmez). Hesap her çizimde yeniden yapılır. Yedek/`clean*` etkilenmez.

### 12.5 Kullanıcı akışı ve metin
Trend > Hareket sekmesinde iki satırlı kart, ilerleme çubuğu ve sayı birlikte (renk tek başına anlam taşımaz):
- "Bu hafta spor: **95 / 150 dk**"
- "Kuvvet çalışması: **1 / 2 gün**"
- Soluk alt not: "Genel kılavuz (WHO): haftada 150-300 dk orta tempolu hareket ve 2 gün kuvvet çalışması. Kişisel tavsiye değil; bir rahatsızlığın varsa hekimine danış." 65+ ise ek cümle (12.2).
- Hiç kayıt yoksa: "Bu hafta henüz spor kaydı yok." (davet cümlesi, ilerleme çubuğu yok.)
- Hedef dolunca tebrik yazısı konmaz (yargı yok); yalnız çubuk dolar.
- Yargı kelimesi yasak: "yeterli", "yetersiz", "riskli".

### 12.6 Kenar durumlar ve risk
- Çift sayım: yok (tek `exercise` toplamı). Algılanan `moves` v1'de hesaba girmez; kartta "Telefonun algıladığı yürüyüşler bu süreye eklenmez" cümlesi YAZILMALI, yoksa kullanıcı 10.000 adım atıp "0 dk" görür ve şaşırır. Adım kartı ayrıdır (Trend Hareket sekmesi `miniBars`).
- Yoğunluk bilgisi yok: metin "orta tempolu" demez; "bu hafta spor" der ve WHO alt notu "orta tempolu" kavramını kullanıcıya bırakır. Bu bilinçli taviz: kılavuz ile kart birebir eşleşmez (yoğun egzersiz yarım sayılır, gerçekte 75-150).
- Salon süresi: antrenman süresi dinlenme dahil; "dk" şişkin olabilir. Kabul edilen yaklaşıklık; metin "yaklaşık".
- Hukuk/Play: genel kılavuz karşılaştırması, tanı/tedavi yok; Play Health Content / izin politikası (`support.google.com/googleplay/android-developer/answer/12991134`, hareket-spor bölüm 1) tıbbi cihaz sınırı uyarısı: "yeterli/yetersiz sağlık hükmü yok", yukarıdaki not. Kronik hastalıkta WHO "abilities" cümlesi nedeniyle kart zorlayıcı dil kullanmaz.
- Yeni izin yok.

### 12.7 Kabul koşulları = testler
- `scripts/activity.test.js` (yeni, saf): (a) 3 antrenman günü, biri yalnız esneme (c:"s") ve biri 2 çalışma seti -> kuvvet günü 1; (b) iki antrenman aynı gün -> 1 gün; (c) ısınma setleri sayılmaz; (d) `exercise` kayıtları toplamı `sum("exercise")` ile birebir (salon dahil); (e) hafta penceresi son 7 gün, bugün dahil (`weeklylib` ile aynı); (f) boş hafta -> davet cümlesi.
- `app.test.js` (`:2435` kalıbı): kart Trend Hareket sekmesinde görünür; yasaklı sözcük taraması; 65+ ayarlıyken ek cümle, 50'de yok; yaş girilmemişse 65+ cümlesi yok.
- `e2e/senior.spec.js` ve `access.spec.js`: ek sayfa kontrol sayısı eşiği aşmaz, 44 px ve axe temiz.

### 12.8 İş büyüklüğü
Küçük-orta (lib ~40 satır, kart ~30 satır, test ~70 satır). hareket-spor "orta" demişti; tempolu/çift sayım/yaş satırları çıkınca küçülüyor.

### 12.9 Yapılmaması için neden
Raporun orijinal biçimiyle (tempolu dakika + denge satırı) YAPILMAMALI: sayısal doğruluk iddiası kodla desteklenmiyor ve 60+ için kadans eşiği kanıtsız. Daraltılmış biçimiyle UYGULA. Yenilik iddiası kullanılmaz (aerobik hedef Google Fit/Garmin'de var, hareket-spor tablosu).

---

## Ek: çapraz bağımlılıklar ve sıralama önerisi
1. Madde 10, Dalga 1 #1 ile aynı PR'da (ortak `Egress`).
2. Madde 9 ile 10 aynı dosyada (`coach.js`) imza değişikliği yapar (`cAsk` dönüşü, `callProvider` parametresi): ardışık yapılmalı, çakışma önlenir.
3. Madde 8 ve 12 `insights/` klasöründe bağımsız; madde 12 için `Gym.cat` tek ortak dokunuş.
4. Madde 11 en son (dış veri beklemeli: Ramazan 2027 imsakiyesi, koordinat kaynağı, hekim/hukukçu metni).

## DOĞRULANAMADI (bu raporda)
1. Ramazan 2027 için hesabın Diyanet imsakiyesiyle uyumu (yalnız Ekim-Kasım 2026 ölçüldü).
2. İl merkezi ile ilçe arasındaki dakika farkı (API oturum içinde sınırladı).
3. Chrome 60 WebView'de `Intl` İslam takvimleri (kullanılmıyor, yalnız kararı destekledi).
4. Diyanet 1 Ramazan 2027 tarihi (yalnız ikincil).
5. Rehber gerçek yanıtlarında yanlış alarm oranı (külliyat yok).
6. 90 günlük çok sayfalı canvas PDF'in cihazdaki bellek davranışı.
7. IDF-DAR kılavuzunun tam metni (özet düzeyinde okundu; sınıflama uygulamaya alınmadı).
8. Yerleşik Diyanet açıklamalarının birincil kaynağı (praytimes.net/takvim.com.tr ikincil); açı değerleri ayrıca Adhan kütüphanesi ve ölçümle desteklendi.
