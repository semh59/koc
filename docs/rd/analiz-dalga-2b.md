# Dalga 2 uygulama analizi (B): maddeler 13, 14, 15, 16

Tarih: 2026-10-10. Kaynak planlar: `oncelik.md`, `dogrulama.md`, `beslenme.md`, `saglik.md`, `rehber-analiz.md`, `kullanilabilirlik-gizlilik.md`. Kod okundu; her `dosya:satır` bu oturumda açıldı. Web: yalnız istatistik eşikleri ve içe aktarma biçimleri için 4 arama (bölüm 7). Hiçbir kod değiştirilmedi.

## Karar özeti

| # | Madde | Karar | Tek cümle gerekçe |
|---|---|---|---|
| 13a | Lif çubuğu | DEĞİŞTİR | Yalnız lif; veri `usda-subset.json`'da zaten var. |
| 13a | Sodyum çubuğu | RED (şimdilik) | Tarifler tuzu saymıyor, USDA sodyumu hiç çıkarılmamış: çubuk "az tuz" yalanı söyler. |
| 13b | Tarifte pişirme verimi | DEĞİŞTİR | Yalnız "pişmiş toplam ağırlık" alanı, yöntem seçici yok; aralık denetimi %50-150 değil %20-500. |
| 13c | Barkodu etiketle bağla | UYGULA | Küçük, yerel, tutarlılık denetimi hazır. |
| 14a | Çift doz koruması | DEĞİŞTİR | Bildirim düğmesi yolu soru soramaz; alarm ekranında `confirmSheet` görünmez; kapsam ve dil daraltılmalı. |
| 14b | "Son dozdan beri" etiketi | DEĞİŞTİR | Uygulama hangi ilacın tansiyon ilacı olduğunu bilmiyor; ilaç başına işaret şart. |
| 15 | Bağlantılar | DEĞİŞTİR | Uyku/adım/ruh hali çiftleri zaten var; yeni olan kanıt etiketi (Welch t + Cohen d). Tansiyon ve ilaç uyumu çiftleri RED. |
| 16 | Genel CSV içe aktarma | DEĞİŞTİR | Evet, ama yalnız kilo/tansiyon/şeker, başlıktan otomatik tanıma, günde tek kilo kuralı, toleranslı mükerrer denetimi. |

## Çelişkiler ve düzeltilen önceki iddialar

1. **`oncelik.md` 15 "uyku, adım, ruh hali eşleşmeleri" diyor; bunlar zaten var.** `linkslib.js:22-29` uyku→ruh hali ve adım→ruh hali çiftlerini üretiyor, `linksui.js:5` üç çifti (üçüncü: kalori→kilo) çağırıyor. `saglik.md` Ö2'nin "tansiyon/ilaç/nabız ekle" önerisi dogrulama.md'de düzeltilip "uyku/adım/ruh hali ile eşle" biçimine daraltılmış; o ifade yanlış okunmuş. Gerçek yeni iş: kanıt etiketi (+ en çok 1-2 yeni çift).
2. **`beslenme.md` Ö4: "usda-subset.json yalnız kcal/makro içeriyor".** Yanlış: `extract_usda.py:6` besin kimliği 1079'u (lif) `l` alanı olarak zaten çıkarıyor; 338 kayıttan 334'ünde `l` var (ölçüldü). Sodyum (1093) çıkarılmıyor: 0/338.
3. **`beslenme.md` Ö5 "çiğ toplamın %50-%150'si" denetimi.** Kuru pirinç/makarna/bakliyat tarifte su malzeme olarak girilmezse pişmiş ağırlık çiğin 2-3 katıdır; bu denetim doğru girişi reddeder.
4. **`beslenme.md` Ö4 "18 yaş altı, böbrek/tansiyon notunda gizle".** Kodda böbrek bayrağı var (`algo.js:130` `kidney`), "tansiyon notu" diye ayrı bayrak yok; `bpCount90d` (ölçüm sayısı) kullanılabilir.
5. **`saglik.md` Ö4/Ö5 "alınma saati `at` var" doğru ama eksik:** `at` yalnız "SS:DD" ve dokunma anıdır, ilacın gerçek alım anı değildir (`medui.js:149`, `medlib.js:106`). Gün atlaması (gece yarısı sonrası dokunma) `dayForTap` ile `day`'i dünkü doza bağlar, `at` bugünün saatidir (`medlib.js:178-181`).
6. **`dogrulama.md` 16 "KABUL", 14 "KABUL/DÜZELTMELİ":** 16 için bu analiz DEĞİŞTİR diyor (aşağıda iki ek güvenlik kuralı); 14b için KABUL'ün dayandığı "etiket yorumsuz" doğru ama ilaç ayrımı eksikti.

---

## Madde 13: Lif/sodyum çubukları, pişirme verimi, barkod-etiket

### 13a. Lif ve sodyum çubukları

**(1) Güncel durum, iddia doğrulama.** Bugün ekranında lif/şeker/sodyum toplamı zaten var, "n/m öğünde veri var" notuyla (`03-screens.js:54,57`); hedef/çubuk yok. Yerleşik 818 satırda yalnız `[ad,kcal,p,c,f,porsiyon,s,aralık,o]` var (`foods.js:11-30`; `foods.js:845` eşleme); lif/sodyum yalnız barkod (`offlib.js:25`), etiket (`ocrui.js:47`) ve kendi besinlerde dolu. Sonuç: bugünkü toplam çoğunlukla "1/6 öğünde veri var" olur; çubuk bu haliyle eksik toplamı gerçek diye gösterirdi. Önerinin dayandığı "USDA'dan hesaplanır" iddiası lif için doğru (`usda-subset.json` `l`), sodyum için yanlış (alan yok). Ayrıca `recipes.txt:7` "tuz ve baharat sayılmaz" diyor: hesaplanan sodyum ev yemeğinde sistematik düşük çıkar (tuz Türk yemeğinde sodyumun ana kaynağı). Bu, güvenlik yönünden kötü hata türüdür (yanlış güven).

**(2) Dosyalar ve sınır.**
- `tools/nutrition/generate.js` (lif toplamı: `data[n]` kaydına `l`, `build()` içinde `t` toplamına `l`; tek bir bileşende `l` yoksa satırda lif yok), `tools/nutrition/template.js` (satır tuple'ına dokunmamak için `ALIASES` gibi ayrı bir `FIBER={ad:g}` tablosu; `tablesJs` `generate.js:44`), `www/modules/nutrition/foods.js` (üretilir, elle düzenlenmez), `core-computed.txt` ve `core-rows.txt`'teki 106 eski satır (USDA anahtarı olanlar `core-usda.tsv` ile lif alır).
- UI: `03-screens.js:54-57` (`viewToday`) çubuk; `04-sheets.js:139` `nutrBlock` zaten `fb` gösteriyor, `allFoods` (`04-sheets.js:128`) yerleşik besine `fb` aktarmalı (`FOODS` satırına `fb` özelliği).
- Sınır: `FOODS` global veri, `S` alanı değil; `boundary.test.js` etkilenmez. Boyut: `foods.js` 155 KB, lif tablosu ~10-15 KB.

**(3) Şema.** Yeni kalıcı anahtar yok. Yemek kaydında `fb` zaten `copyNutr` ile saklanıyor (`loglib.js:4,6`, `01-core.js:146`), `cleanEntries` değişmez. Eski kayıtlar lifsiz kalır (geriye dönük doldurma yok). `generate.js --check` CI'da `foods.js` eşleşmesini zorluyor olmalı; çalıştırılmadan commit edilmez.

**(4) Akış (60 yaş).** Bugün ekranında halkaların altında, yalnız o gün yenen tüm yemeklerde lif verisi varsa (n=m, m>=1) tek satır çubuk: "Lif 14 / en az 25 g". Kırmızı/uyarı yok; renk nötr. Veri eksikse bugünkü satır kalır ("Lif 6 g (2/5 öğünde veri var)"), çubuk çizilmez. Altında tek ek cümle, ayrıntı katlanır: "Yetişkinler için Dünya Sağlık Örgütü önerisi günde en az 25 g. Gün bitmeden düşük görünmesi normaldir. Hedefin farklıysa hekiminin söylediğine uy."
Sodyum (ertelenen sürüm, yalnız barkod/etiket verisi tam günlerde): "Sodyum 1.800 mg (tuz karşılığı yaklaşık 4,5 g)" ve WHO "tuz günde 5 g'ın altı (2 g sodyum)" referans satırı; çubuk yok, yalnız sayı.

**(5) Kenar durum ve risk.** Gün ortasında "eksik" görünme (n=m koşulu ve metin). Yaş bilinmiyorsa (`settings.age` 0) veya <18 ise gösterilmez (`01-core.js:64` RANGES yaş 10-100; WHO 25 g yetişkin). Böbrek/hekim hedefi: `risk().kidney` veya sağlık notu varsa sodyum referansı hiç gösterilmez, yalnız toplam. Tıbbi iddia yok; Play 16679511 gereği "hekimine danış" cümlesi mevcut `MED_NOTE` ile (`01-core.js:73`). WHO sayıları: `dogrulama.md` bölüm 3 birebir doğruladı; bu oturumda yeniden açılmadı. Lif tanımı: USDA "Fiber, total dietary" (1079); karbonhidrat bu değeri İÇERİR (`foods.js:5`), barkod/etiket ise lifi ayrı sayar: aynı gün iki tanımın toplamı karışmasın diye çubukta yalnız lif gösterilir, net karbonhidrat hesaplanmaz.

**(6) Kabul testleri.**
- `scripts/foods.test.js`: 20 rastgele USDA-kaynaklı satırda `fb` USDA `l` ile ±%1; bileşenlerinden biri lifsiz satırda `fb` yok; "Mercimek çorbası" lifi > "Beyaz ekmek" lifi (ekmek 100 g başına ~2,7 g; çorba hesaplanır).
- `scripts/foods.test.js`: kapsam eşiği: lif sayılan satır oranı >= %60 (şimdilik ölçülmedi; üretimden sonra gerçek oran test eşiği olur, düşükse çubuk eklenmez).
- `scripts/screens.test.js`: n=m ise çubuk, n<m ise çubuk yok; yaş 17 ve yaş 0 ile yok; hiçbir metinde "yetersiz/düşük/yüksek" kelimesi yok.
- `scripts/app.test.js` (tarif): lifsiz malzemeli tarifte lif toplamı yazılmaz (mevcut tüm-ya-hiç kuralı, `loglib.js:64`).
- `node tools/nutrition/generate.js --check` temiz.

**(7) Büyüklük.** Lif: orta (üretim hattı + şablon + UI + 4 test, ~1,5 gün). Sodyum çubuğu: büyük ve şimdilik yapılmamalı.

**(8) RED gerekçesi (sodyum çubuğu).** (i) Veri yok: yerleşik satırda 0/818; (ii) tarif hesabı tuzu saymaz (`recipes.txt:7`), eklense bile tuz miktarı ±%40 belirsiz (`beslenme.md:104`); (iii) tansiyon/böbrek hastası kullanıcı için yanlış "az tuz" güvencesi en zararlı hata. Yeniden değerlendirme koşulu: yerleşik tarife "tuz: yok/az/orta/çok" katsayısı ve hekim onaylı metin.

### 13b. Tarifte pişirme verimi

**(1) Doğrulama.** Tarif toplamı çiğ gram üzerinden (`loglib.js:66-73` `recipeCalc`); `recipeFood` `pg=c.g/r.s` ve `k=tot.k*100/c.g` (`loglib.js:77`). Porsiyon başı kcal zaten `tot/s` olduğundan doğru; fark yalnız "100 g" seçeneği ve gram cinsinden tartıp kaydeden kullanıcıda: çiğ ağırlık tabanlı yoğunluk pişmişten düşük (buharlaşma) ya da yüksek (su emen pirinç). Not metni "pişince değişir; tahmindir" (`loglib.js:74`). Rapordaki iddia doğru; ek bulgu: `portion` işaretli malzemelerde `g` 100 g sahte tabandır (`loglib.js:48`), bu tariflerde pişmiş ağırlık anlamsızdır.

**(2) Dosyalar.** `loglib.js` (`recipeItem` yanı: `cleanRecipes` `cw`; `recipeFood`), `recipeui.js` (`sheetRecipe` alan, `rpSum`, `rpSave`, `rpRead`), `nutrition/index.js:3` (CSV `tarifler` sütunu), `scripts/log.test.js`, `scripts/app.test.js`. Sınır etkisi yok (`recipes` nutrition'ın).

**(3) Şema.** Tarife isteğe bağlı `cw` (pişmiş toplam gram, 1-50000, kısmen yuvarlanmış). `cleanRecipes` (`loglib.js:51-63`) şu an alanları tek tek kuruyor: `cw` eklenmezse yedekten silinir. Doğrulayıcı kuralı: yalnız tüm malzemeler gram tabanlı (`portion` yok) ve `0.2*c.g <= cw <= 5*c.g`; aksi halde alan atılır (tarif kalır). Yöntem seçici (`soup/stew` katsayıları, `generate.js:7 YIELD`) eklenmez: kullanıcı katsayı bilmez, yanlış seçim sessiz hata olur; kullanıcı tartmıyorsa alan boş kalır ve bugünkü davranış sürer. CSV `tarifler` dosyasına `pişmiş_gram` sütunu (satır başına tekrar eder; sütun sonuna eklenir).

**(4) Akış.** Tarif ekranı: "Kaç porsiyon çıkar" altında, isteğe bağlı: "Pişmiş tencerenin ağırlığı (g), tarttıysan" + ipucu "Boş bırakırsan çiğ ağırlıklar kullanılır." Porsiyon ekranı "Kaynak ve hesap" bölümü: "Tarifim, 4 porsiyon. Pişmiş ağırlık: 1.480 g (senin girdiğin)." Not cümlesi `cw` varsa: "Pişmiş ağırlığa göre hesaplandı; tahmindir."

**(5) Kenar.** `cw` girilir sonra malzeme değişir: eski `cw` yeni malzemeyle uyumsuz; düzenlemede malzeme gramı değişince `cw` korunur ama aralık dışına çıkarsa atılır ve "Pişmiş ağırlığı yeniden yaz" notu. Çoğaltma (`dup`) `cw` kopyalar. Porsiyon sayısı değişince `cw` korunur. Risk: kullanıcı kabın darasını da yazarsa kcal/100 g düşer; ipucu: "Boş tencere hariç, yalnız yemek."

**(6) Testler.** `scripts/log.test.js`: (a) 1000 g çiğ, 850 g pişmiş, toplam 1200 kcal: 100 g = 141,2 kcal (bugün 120); porsiyon başı kcal değişmez. (b) `cw` yok: sonuç bugünkü ile birebir. (c) kuru pirinç 200 g + `cw` 600 geçerli; `cw` 5 g ve 5000 g (1000 g çiğ için) reddedilir. (d) `portion` malzemeli tarifte `cw` atılır. `scripts/app.test.js`: yedek-geri yükleme `cw` korur; alan boşsa `cw` anahtarı yok.

**(7) Büyüklük.** Küçük-orta (~yarım gün). **(8) RED nedeni yok;** yalnız yöntem seçici RED.

### 13c. Bulunamayan barkodu etiketle bağla

**(1) Doğrulama.** `barcodeFind` bulunamazsa `sheetFood();ownOpen()` ve toast (`04-sheets.js:171-173`); barkod unutulur. `labelSave` kaydı `{n,u,...}` kurar, `b` yok (`ocrui.js:77-79`). `allFoods` `b` alanını aktarıyor (`04-sheets.js:128`), `cleanMyFoods` `b`'yi `^\d{8,14}$` ile koruyor (`01-core.js:120`), `putMy` aynı `b`'yi eşler (`nutrition/index.js:10`), yani altyapı hazır. İddia doğru.

**(2) Dosyalar.** `04-sheets.js` (`barcodeFind`: `pendingBarcode=code`; bulunamayan dalda "Etiketi oku" düğmesi), `ocrui.js` (`labelSave`: `if(pendingBarcode)food.b=pendingBarcode`; `labelReview` başlığı), testler. Sınır etkisi yok (`myFoods` nutrition'ın; ikisi de `main/` ve nutrition dosyaları).

**(3) Şema.** Yeni anahtar yok; `b` zaten desteklenir. Önemli: `putMy` ad VEYA barkod eşleşmesinde ESKİYİ DEĞİŞTİRİR (`nutrition/index.js:10-11`): aynı adlı başka ürünü (örn. iki markanın "Süt") ezer. Etiket ürün adı kullanıcıdan alınır; barkodlu kayıtta ad çakışması varsa ekleme reddedilmeli ya da "(2)" eki. Bu mevcut davranışın riski, 13c onu görünür kılar.

**(4) Akış.** Barkod okut -> "Ürün bulunamadı" -> iki büyük düğme: "Etiketi fotoğrafla" / "Elle yaz". Etiket okunur -> doğrulama ekranı (mevcut) -> "Kaydet ve ekle" -> sonraki taramada ağ çağrısı olmadan gelir (`allFoods().findIndex(f=>f.b===code)`, `04-sheets.js:162`). Metin: "Bu barkod Open Food Facts'te yok. Paketin arkasındaki besin tablosunu fotoğraflarsan bu ürünü telefonuna kaydederim; sonraki okutmada kendiliğinden gelir."

**(5) Kenar.** Kullanıcı etiket ekranından vazgeçerse `pendingBarcode` sıfırlanır (yoksa sonraki alakasız etiket yanlış barkoda bağlanır). 200 besin sınırı dolu (`MYFOODS_MAX`): mevcut mesaj. Kamera yok/OCR eklentisi yok: `ocrBtn` zaten düğmeyi gizler, elle yazma kalır. Hukuki: besin değeri verisi kullanıcının kendi paketinden; ağ yok.

**(6) Testler.** `scripts/label.test.js`/`scripts/app.test.js`: bulunamayan barkod -> etiket kaydı `b` taşır; aynı barkod ikinci taramada `fetch` çağrılmadan eşleşir; vazgeçince bekleyen barkod temizlenir; aynı ad farklı barkod mevcut kaydı ezmez. `e2e/food.spec.js`: akış (OCR eklentisi sahte).

**(7) Büyüklük.** Küçük (~2-3 saat + test). **(8) RED nedeni yok.**

---

## Madde 14: İlaçta çift doz koruması; tansiyonda "son dozdan beri"

### 14a. Çift doz koruması

**(1) Doğrulama.** Kayıt anahtarı (ilaç, gün, saat dilimi) tektir; aynı dilimi iki kez işaretlemek kaydı yerine koyar, mükerrer üretmez (`medlib.js:104-106`, `cleanLog` `medlib.js:55-63`). Çift doz bu yüzden yalnız FARKLI dilimler yakın işaretlendiğinde görünür olur (örn. 08:00 ve 08:30 dilimi ya da iki farklı dilimin art arda "Aldım"ı). `mark` ve `grep "az önce|çift doz"` hiçbir koruma bulmadı (`medlib.js`, `medui.js`, `alarmui.js`). Dokunma yolları dört: (a) kart/ekran `medMark` (`medui.js:148-155`); (b) alarm ekranı `alarmMark` ("Hepsini aldım" dahil) (`alarmui.js:59-70`); (c) bildirim düğmesi `medIngest` (`medui.js:158-168`, arka planda, arayüz yok); (d) `alarmOpen` içi `due()` penceresi [-3 sa, +5 dk] (`alarmlib.js:5-15`).

Önemli bulgular:
- **Alarm ekranında `confirmSheet` kullanılamaz:** `#cfm` z-index 30, `#alarm` 40 (`app.css:382,384`) ve `topLayer()` alarmı önce seçip diğerlerini `inert` yapıyor (`04-sheets.js:3-4`). Alarm içi soru, alarm ekranına gömülü satır/durum olmalı (`alarm.say` kalıbı `alarmui.js:64-66`).
- **Bildirim düğmesi yolu sorulamaz** (`medIngest` ekransız). Koruma bu yolu kapsayamaz; açıkça "kısmi koruma" denmeli.
- **`at` dokunma anıdır, alım anı değil** (bölüm Çelişkiler 5). Geç toplu kayıt (akşam 21:00'de sabah ve öğle dozlarını art arda işaretlemek) iki kaydı da aynı dakikaya yazar: yanlış uyarı üretir.

**(2) Dosyalar.** `medlib.js` (saf `recentTaken(log,meds,mid,day,slot,nowMs)`), `medui.js` (`medMark`), `alarmui.js` (`alarmMark`, `alarmDraw`), `scripts/med.test.js`, `e2e/meds.spec.js`, `e2e/alarm.spec.js`. Sınır: tamamı `meds` modülü içinde.

**(3) Şema.** Yok; `at` ve `slot` yeter. Mutlak zaman: `slotAt(day,slot)`; `at` slot saatinden 60 dakikadan fazla küçükse ertesi güne say (geç gece dokunması, `dayForTap` ters mantığı). `cleanLog` değişmez.

**(4) Kural ve akış.** Kural: aynı ilacın, BAŞKA bir diliminde, son 60 dakika içinde "alındı" kaydı varsa VE iki dilimin planlı saat farkı 60 dakikadan büyükse sor. Neden ikinci koşul: 08:00/08:30 gibi yakın dilimleri bilerek planlayan kullanıcıya her gün soru çıkmasın. 60 dk: tıbbi eşik değil, ürün sabiti; dayanağı yok, bu nedenle doz aralığı yorumu yapılmaz (`dogrulama.md` kararıyla uyumlu). Soru metni: "Bu ilaç için 25 dakika önce de 'Aldım' kaydı var. Yine de kaydedilsin mi?" Düğmeler: "Hayır, kaydetme" (varsayılan odak, `confirmSheet` `no` düğmesine odaklanıyor: `04-sheets.js:35`) / "Evet, kaydet". "Hayır"da doz işaretsiz kalır, ertelenen hatırlatma sürer (bildirim `NAGS` 10/20 dk, `medlib.js:147`); bu kullanıcıya belirtilmeli: "Kaydedilmedi. Hatırlatma, aldığını işaretleyene kadar sürebilir." "Hepsini aldım" toplu işleminde aynı toplu işlemdeki dozlar birbirini tetiklemez; yalnız toplu işlemden ÖNCE var olan kayıtlarla karşılaştırılır ve tek soru sorulur.
Yasak/gerekmez: "güvenli", "aşırı doz", "yutma" dili; yalnız kayıt olgusu.

**(5) Risk.** Yanlış güven: soru çıkmaması "güvenli" demek değildir; metinde ve Ayarlar yardımında "Bu yalnız kendi kayıtlarını karşılaştırır, alım kararını değiştirmez" yazılmalı. Tıbbi cihaz sınırı: etkileşim/doz hesabı yok; `medlib.js:2-3` sözleşmesiyle uyumlu (öneri yapmaz). Kaynak: doğrudan "çift doz uygulama uyarısı" kanıtı bulunamadı; WHO Medication Without Harm çerçevesi yaşlıları yüksek riskli grup sayıyor (who.int, 16.09.2022) ama çift doz özelinde doğrulanamadı. Gerekçe güvenlik sezgisi; yenilik iddiası yok (`dogrulama.md` bölüm 4).

**(6) Testler.** `scripts/med.test.js`: (a) farklı dilim, 25 dk önce `at`: uyarı; 61 dk: yok; (b) aynı dilim yeniden işaret: uyarı yok (yerine koyma); (c) planlı fark 30 dk olan iki dilim: yok; (d) `at` gece yarısı kaymalı (dilim 23:50, `at` 00:05 dünün kaydı): doğru mutlak zaman; (e) `st:"s"` (atla) satırları sayılmaz; (f) `at` olmayan satır sayılmaz. `e2e/meds.spec.js`: soru çıkar, "Hayır" kaydı ve stoku değiştirmez, "Evet" kaydeder, stok bir kez düşer. `e2e/alarm.spec.js`: alarm içinde satır içi soru görünür, odak tuzağı bozulmaz, 56 px dokunma hedefi (mevcut test `alarm.spec.js:39-50`) korunur.

**(7) Büyüklük.** Orta: mantık küçük (~40 satır) ama alarm içi satır içi onay ve iki e2e senaryosu iş yükünü belirler (~1-1,5 gün).

**(8) RED mi?** Tamamen RED gerekmiyor, ama bildirim yolunun kapsanmaması ve geç-toplu-kayıt yanlış uyarıları nedeniyle "kısmi koruma" olarak ve "yakınıma haber ver" olmadan yapılmalı.

### 14b. Tansiyonda "son dozdan beri" etiketi

**(1) Doğrulama.** Tansiyon satırı: gün, saat, seans (sabah/akşam/diğer), `sid` (`vitalslib.js:28-45`); oturumlar (`vitalslib.js:62-75`); liste satırı `vitalsui.js:138`; PDF `reportRows` (`vitalslib.js:112-119`). Ölçüm yönergesi "sabah ölçümü kahvaltı ve ilaçtan önce" (`vitalsui.js:54`). İlaç kaydında hangi ilacın tansiyon ilacı olduğu bilgisi YOK: `cleanMeds` yalnız `n,d,t,w,s,e,k,p,on` (`medlib.js:31-53`). Rapordaki "son dozdan" varsayımı çok ilaç kullanan 60 yaş kullanıcıda her ölçüme rastgele bir ilaç etiketi yapıştırır (vitamin, mide ilacı). İddia kısmen yanlış: etiket ilaç seçimi olmadan anlamsız.

**(2) Dosyalar.** `medlib.js` (`cleanMeds`: `bp:true` alanı; saf `lastTaken(...)`), `medui.js` (ilaç düzenleme formu: onay kutusu), `vitalslib.js`/`vitalsui.js` (etiket hesabı `Meds.log()`/`Meds.meds()` API'si ile; `meds/index.js:10`), `vitalslib.js:112-119` PDF sütunu, testler. Sınır: vitals `S.medLog`/`S.meds`'e doğrudan değil, `Meds` API'siyle erişir (`boundary.test.js:11-14` yalnız `S.` erişimini yakalar); saf hesap `vitals` içinde olursa `MedLib` çağrısı lib-lib olduğundan serbest (`dogrulama.md:57`).

**(3) Şema.** İlaç kaydına `bp` (boolean). `cleanMeds` yeni alanı kopyalamazsa yedekte kaybolur: eklenmeli (`medlib.js:39-49` kalıbı). Seri verisi için Android/alarm tarafı etkilenmez (`bp` bildirime girmez). Geri yükleme testi şart.

**(4) Akış.** İlaç düzenle: yeni kutu "Tansiyon ilacı (ölçüm raporunda göster)". Hiçbir ilaç işaretli değilse etiket yok, ekran bugünkü gibi. İşaretliyse tansiyon seansı satırında küçük gri satır: "Sabah ilacı kaydından 2 sa 20 dk sonra" ya da "O gün ilaç kaydı yok" ya da hiç yazma (kayıt yok = almadı değildir). PDF'te "Son ilaç kaydından beri" sütunu. Yorum/renk yok.

**(5) Kenar/risk.** `at` yoksa etiket yok. Aynı gün birden fazla işaretli ilaç: en yakın önceki kayıt. Ölçüm ilaç kaydından ÖNCE yapılmışsa "ilaçtan önce" yazılır (`ölçüm zamanı < en erken kayıt`) ve yalnız aynı gün; önceki günün dozundan süre yazılmaz (24+ saat anlamsız). Kullanıcı ilacı aldığı halde işaretlemediyse etiket yanıltır: bu yüzden "kayıtlı" kelimesi şart ve "alım saati" demek yasak (dokunma anı). `roadmap.md:76` yorumlamama ilkesiyle uyumlu (olgu, eşik yok). Hukuki: tıbbi cihaz sınırına girmez (hesap iki zaman farkı), ancak hekim raporunda yanlış sağlık izlenimi riski için PDF notu: "Süreler uygulamaya yazılan kayıtlara göredir."

**(6) Testler.** `scripts/vitals.test.js` + `scripts/med.test.js`: `at` var/yok; ilaç işaretsiz iken etiket yok; gece yarısı geçen doz doğru güne; ölçüm ilaçtan önce; `cleanMeds` `bp` korur; PDF satırı sütunu. `e2e/measurements.spec.js` ve `e2e/meds.spec.js`: kutu işaretlenince etiket görünür, işaretsiz görünmez.

**(7) Büyüklük.** Orta-küçük (~1 gün). **(8) RED nedeni yok;** bağımlılık: ilaç işareti olmadan yapılmamalı.

---

## Madde 15: Bağlantılar'a eşleşmeler ve kanıt etiketi

### (1) Güncel kod ve iddia doğrulama
`linkslib.js` saf, `S`'siz; `analyze` üç çift üretir: uyku (419,5 dk eşik) -> ruh hali; adım (ortanca) -> ruh hali; haftalık kalori (ortanca) -> kilo trendi değişimi (`linkslib.js:18-43`). Eşikler: 60 gün pencere, en az 14 çift, grup başı en az 4 (`linkslib.js:10-15`; kalori çifti grup başı 2, `:40`). "Fark yok" cümlesi yalnız `|fark|<0,2` iken (`linkslib.js:16`). Yani bugün, 14 çift varsa HER ZAMAN bir cümle gösterilir: rastgele veride bile (aşağıdaki simülasyon). Kullanıcı arayüzü sabit uyarı taşıyor ve Rehber'e göndermiyor (`linksui.js:6`). Test: `scripts/links.test.js`, `e2e/links.spec.js`.

Önerinin iki parçası: (a) "uyku/adım/ruh hali eşleşmeleri" zaten var; (b) tansiyon ve ilaç uyumu çiftleri (saglik Ö2) yeni.

### (2) Yöntem seçimi (kaynak ve ölçüm)
Mevcut kod grup ortalaması farkı kullanıyor; hesap kütüphanesi ihtiyacı yok. Eklenecek tek şey: iki grup için örnek standart sapma ve iki sayı:
- **Welch t** (eşit olmayan varyans/grup boyu): `t = (m1-m2) / sqrt(s1²/n1 + s2²/n2)`. Kaynak: Ruxton G.D. (2006) "The unequal variance t-test is an underused alternative to Student's t-test and the Mann-Whitney U test", Behavioral Ecology 17(4):688-690; Student testi varyans eşit değil ve grup boyları farklıyken I/II tip hata yönünden kötü (arama özeti, tam metin okunmadı). Grup boyları zaten dengesiz (4 vs 10).
- **Etki büyüklüğü Cohen d** (ortak SD ile): Cohen J. (1988) Statistical Power Analysis for the Behavioral Sciences, 2. baskı: küçük 0,2 / orta 0,5 / büyük 0,8; Cohen bunları "başka dayanak yokken kullanılacak operasyonel ölçüt" olarak sunmuş (arama özetleri; kitap açılmadı).
- Kullanılmayacaklar: bootstrap/blok bootstrap, Newey-West, Benjamini-Hochberg (`rehber-analiz.md:105`). 60 günde 3-5 çift için gereksiz; `dogrulama.md:104` ile uyumlu.

**Eşik kuralı (öneri):**
- Gösterim: grup başı >= 4 (mevcut) ve toplam >= 14 (mevcut), SD ve t hesaplanabilir (SD=0 ise etiket yok).
- "Zayıf ipucu": |d| >= 0,5 ve |t| >= 2,0.
- "Belirgin ipucu": |d| >= 0,8 ve |t| >= 2,8 ve her grup >= 6.
- Aksi halde çift CÜMLE GÖSTERMEZ; kartta tek satır: "Henüz belirgin bir bağ görünmüyor." (kart tamamen boşsa bugünkü gibi hiç çıkmaz).

**Bu eşiklerin ölçülmüş davranışı** (`scratchpad/sim.js`, 20 000 deneme/n, ruh hali 1-5 sabit dağılımlı, uyku/adım bağımsız rastgele, ortanca bölme): hiçbir bağ yokken "zayıf ipucu" oranı n=14: %6,5; n=20: %5,7; n=30: %5,5; n=45: %5,3; n=60: %5,0. "Belirgin ipucu" oranı n=14: %1,5; n=30: %0,9; n=60: %0,3. Beş bağımsız çift için en az bir "zayıf" çıkma olasılığı (n=45): %23. Bugünkü kod aynı koşulda %100 cümle gösteriyor. Güç: gerçek fark ~0,5 puan ruh hali olduğunda zayıf ipucu yakalama n=30'da %18, n=60'ta %33. Sonuç: etiket gürültüyü büyük ölçüde azaltır ama "zayıf ipucu" yaklaşık 20 durumdan birinde tesadüftür; bu nedenle zayıf için metin "tesadüf olabilir" demeli, ayrıca çift sayısı artırılırsa (5 çift: %23) bu oran kötüleşir: çift ekleme sınırlı tutulmalı.

### (3) Çiftler ve karar
| Çift | Karar | Neden |
|---|---|---|
| uyku->ruh hali, adım->ruh hali, kalori->kilo | var; etiket eklenecek | `linkslib.js:22-42`. |
| adım (D-1) -> gece uykusu (D uyanış günü) | UYGULA (en çok bu bir yeni çift) | Her ikisi günlük ve yoğun (adım sensörü/HC, uyku). Sağlık ölçümü değil. |
| tansiyon ev günlük ort. -> uyku/adım/ruh hali | RED | (i) Veri seyrek: tansiyon genelde 7 günlük kampanyalarla ölçülür; 14 çift günlük ölçüm ister. (ii) "Belirgin fark yok" satırı "tansiyonun uykudan etkilenmiyor" diye okunur: yanlış güven; ayrıca bu satırı hiç yazmamak bu çifte ancak kuralsız tutarsızlık. (iii) `roadmap.md:76` tansiyon yorumlamama ilkesi; grup karşılaştırması örtük yorumdur. (iv) Play 16679511 sınırı. |
| ilaç uyumu -> ruh hali/uyku | RED | "Kaçırılan gün" tanımı kullanıcının işaretlemeyi unutmasını da içerir: günü bitmiş işaretsiz doz "missed" sayılır (`medlib.js:120-134`); "kayıt yok" "almadı" değildir. Ters nedensellik (ruh hali düşünce ilacı unutma) ve "ilaç ruh halimi düşürüyor" okuması; hekime sormadan ilaç bırakma riski. |
| döngü evresi -> ruh hali (saglik Ö7) | kapsam dışı | bu madde değil. |

### (4) Dosyalar ve modül sınırı
`linkslib.js` (sd, `grade`, metin), `linksui.js:6` (açıklama + kanıt etiketi çıktısı), `scripts/links.test.js`, `e2e/links.spec.js`, yeni çift için `analyze` girdisi (`linksui.js:5` çağrısı yeni alan `stepsPrev` gerekmez: aynı `steps` ve `sleep`). Sınır: `insights` modülü `Habits.sleep()/mood()`, `Log.byDay` API'leriyle okuyor (`linksui.js:5`), `S.` erişimi yok; `boundary.test.js` etkilenmez. Tansiyon/ilaç çifti yapılsaydı `Vitals.all()`/`Meds.log()` API'leri kullanılırdı (mevcut: `vitals/index.js:5`, `meds/index.js:10`).

### (5) Şema
Yok (hesap anlık, saklanmaz). Yedek/`clean*` etkilenmez.

### (6) Kullanıcı akışı ve Türkçe taslak (60 yaş)
Trend > Bağlantılar kartı. Her cümle satırında sondaki küçük etiket: "(zayıf ipucu, tesadüf olabilir)" veya "(belirgin ipucu)"; terimler (t, d, SD) ekranda yok. Gün sayısı gösterilir: "34 günlük kayıttan". Cümle örnekleri:
- "7 saat ve üstü uyuduğun gecelerin ertesi günü ruh halin ortalama 4,0, daha kısa uyuduğun gecelerin ertesi günü 3,2 (5 üzerinden). Zayıf ipucu, tesadüf olabilir. 34 günlük kayıttan."
- Yeni çift: "Adımının ortancanın (6.200) üstünde olduğu günlerin gecesinde ortalama 7 sa 20 dk, altında olduğu günlerin gecesinde 6 sa 50 dk uyumuşsun. Zayıf ipucu, tesadüf olabilir."
- Hiçbiri eşiği geçmezse: "Henüz belirgin bir bağ görünmüyor. Kayıt tuttukça bu kart güncellenir."
Mevcut sabit not korunur (`linksui.js:6`) ve eklenir: "Bunlar neden-sonuç göstermez; tesadüf de olabilir."

### (7) Kenar durum ve risk
Ruh hali 1-5 tam sayı: SD küçük, çok sayıda eşit değer; SD=0 -> etiket yok. Adım sensörü kapalı gün sıfır sayılmıyor (`linkslib.js:25` `>0` süzgeci). Hafta içi/sonu karıştırıcısı yönetilmez (`rehber-analiz.md:106` önerisi bu analizde reddedilir: 60 günde 8-9 hafta sonu). "Neden olur/sebep/skor/teşhis" yasağı korunur (`links.test.js` wording testi). Çift sayısı 3'ten 4'e çıkar; 5. çift eklenmemeli (çoklu karşılaştırma: %23).

### (8) Kabul testleri
- `scripts/links.test.js`: (a) sahte iki eşit grup ortalaması -> "Henüz belirgin bir bağ görünmüyor" (bugün cümle çıkıyor, mevcut test "belirgin fark görünmüyor" `links.test.js:13` güncellenir); (b) d=1,2 enjekte edilmiş seride "belirgin ipucu"; d~0,5, t~2 serisinde "zayıf"; (c) tohumlu 2000 denemelik boş veri: zayıf oranı <= %8, belirgin oranı <= %2 (sim sonuçlarına eşik payı); (d) SD=0 grubunda etiket yok; (e) yeni çift: adım-uyku 14 çiftten azında yok; (f) wording regex (`/depresyon|bozukluk|skor|tedavi|teşhis|neden olur|sebep|yüksek|düşük|normal/`).
- `e2e/links.spec.js`: etiket metni görünür; "Rehber'e gönderilmez" korunur; 14 çift altında kart yok.

### (9) Büyüklük
Küçük-orta (~1-1,5 gün): saf kod ~40 satır, test çoğunluk.

### (10) RED özeti
Tansiyon ve ilaç uyumu çiftleri RED (nedenler tablo satırlarında). Bootstrap/Newey-West/BH RED (karmaşık).

---

## Madde 16: Genel CSV içe aktarma (kilo, tansiyon, şeker)

### (1) Güncel kod ve iddia doğrulama
İçe aktarma yalnız antrenman için (`gym/importlib.js`, `importui.js`; önizleme + onay + geri alma toast'ı: `importui.js:30-37,45-48`). Dışa aktarma `CsvLib`: ayırıcı `;`, UTF-8 BOM, ondalık virgül, ISO tarih (`csvlib.js:1-9`). Dosya şeması: `kayitlar` (`log/index.js:19`: tarih, saat, tür [yemek/su/kilo/spor/adım/not], değer, birim, açıklama, protein_g...), `saglik` (`vitals/index.js:3`: tarih, saat, tür [tansiyon/şeker], sistolik, diyastolik, nabız, şeker_mgdl|şeker_mmoll, ölçüm_zamanı, not). Kilo CSV'si kullanıcının birimiyle yazılır (`wu`, `log/index.js:19`), şeker başlıkta birimi söyler.

Yeniden kullanılabilir ama dışarıya kapalı: `ImportLib.parse` (tırnak/ayırıcı otomatik, `importlib.js:8-27`) dışa aktarılmıyor (`return {read,num,matcher,plan,...}`), `num` (ondalık/binlik, `:29-37`) ve `stamp` (yalnız ISO ve "15 Mar 2024" kalıbı, `:39-47`; `15.03.2024` ve `15/03/2024` TANINMAZ, saat dilimi `Z` yok sayılır).

Önerinin diğer dayanağı: `04-sheets.js:244` `buildState` ve `onboardui.js:21` `RANGES`. Kullanılacak temizleyici: kilo `cleanEntries` (20-400 kg, `01-core.js:134`), tansiyon/şeker `VitalsLib.check` (`vitalslib.js:28-45`: sys 50-300, dia 30-200, nabız 25-250, şeker 20-800).

### (2) Dosyalar, modül sınırı
- Yeni saf `www/modules/data/csvreadlib.js` (okuma, başlık tanıma, birim/tarih çıkarımı, plan); `parse/num/stamp` `ImportLib`'ten buraya taşınıp `importlib.js` bunu çağırır (kopya olmasın; `data` modülü `gym`'e bağımlı olmasın). UI: `www/modules/data/csvimportui.js` (sayfa: Veri ve yedek). Kayıt yazımı: kilo için `Log` API'si (`S.entries` `log` modülünün; yazım `add`-benzeri, `nextId` `log`'un), tansiyon/şeker için `Vitals` API'sine yeni `Vitals.addAll(rows)`/`remove(ids)` (şu an yalnız `all`, `vitals/index.js:5`): `data` modülü `S.entries`/`S.vitals`'e doğrudan dokunamaz (`boundary.test.js:11-14`).
- `index.html` (betik etiketi), `scripts/paths.test.js` (yeni dosya yolları), `docs/boundary-map.md` otomatik üretilir (`scripts/boundary-map.js`).

### (3) Şema ve kalıcı anahtar
Yeni `S` anahtarı YOK. İçe aktarılan kayıtlar mevcut tipler: kilo `{type:"weight",v:kg}`, tansiyon `{k:"t",...}`, şeker `{k:"s",...}`. `cleanEntries` yalnız bilinen alanları kopyalıyor (`01-core.js:139`), `VitalsLib.clean` de (`vitalslib.js:50-59`); bu nedenle "kayıt içe aktarıldı" etiketi (kalıcı geri alma kimliği) eklemek iki temizleyiciyi ve yedeği değiştirir. Önerilen: kalıcı etiket EKLEME; geri alma yalnız o oturumda sayfa açıkken ve toast'ta (mevcut gym kalıbı). Gerekçe: şema değişikliği + yedek uyumu maliyeti, kalıcı geri alma ihtiyacı belirsiz. Ek güvence: içe aktarmadan hemen önce otomatik güvenlik yedeği önerilmez (parolalı yedek karmaşık); yerine "Önce yedek al" bağlantısı (`privacyui.js:34` kalıbı) önizlemede gösterilir.

### (4) Kullanıcı akışı (60 yaş), Türkçe
Ayarlar > Veri ve yedek > "Tablodan kayıt ekle (CSV)" (gelişmiş bölümde, varsayılan görünmez).
1. "Dosya seç". 8 MB sınırı ve metin denetimi (`importui.js:2,50-54` kalıbı).
2. Uygulama başlığa bakar: tarih + kilo ya da sistolik/diyastolik ya da şeker sütunu bulursa "Bu dosyada 212 kilo ölçümü, 96 tansiyon ölçümü bulundu" der. Bulamazsa tek ekran: "Hangi sütun tarih? Hangi sütun kilo?" (en çok 4 seçim kutusu, ilk 3 satır örnek).
3. Birim sorusu yalnız belirsizse: "Kilolar kg mı, lb mı?" "Şeker mg/dL mi, mmol/L mi?" Tarih sırası belirsizse: "Dosyada 03/04/2024 var: 3 Nisan mı, 4 Mart mı?" (örnek satırla).
4. Önizleme: ilk 5 satır uygulamanın göstereceği biçimde ("15 Mart 2024, 82,4 kg"), sayılar: "Eklenecek: 205 · Zaten kayıtlı, atlanacak: 7 · Okunamadı/sınır dışı: 3 (listeyi gör)".
5. "Onayla ve ekle" -> "205 kayıt eklendi. [Geri al]" (sayfa açıkken). Geri al bu içe aktarmanın kayıtlarını siler.
Metin: "Bu dosyadaki ölçümleri telefondaki kayıtlarına ekler. Aynı güne ait kendi kilon varsa dosyadaki atlanır. Dosya hiçbir yere gönderilmez."

### (5) Yanlış eşleme ve çift kayıt: somut senaryolar ve kural
| # | Senaryo | Sonuç (kuralsız) | Kural |
|---|---|---|---|
| S1 | Aynı dosya iki kez seçilir | Her satır ikilenir | Mükerrer anahtarı: tansiyon `gün|saat|sys|dia`; şeker `gün|saat|g` (<=1 mg/dL tolerans); kilo bölümü S4. Eşleşen atlanır, önizlemede sayılır. |
| S2 | Uygulamanın kendi `saglik` dosyası mmol/L olarak dışa aktarılmış, sonra geri yüklenir | mmol -> mg/dL dönüşümü yuvarlama farkı (`UN.fg` görüntü yuvarlaması) nedeniyle tam eşleşmez, çift kayıt | S1'deki ±1 mg/dL toleransı; test bu yolu içerir. |
| S3 | `03/04/2024` (ay/gün mü gün/ay mı) | Tüm tarihler 1 ay kayık | Hücrelerin ikisi de <=12 olan satır varsa sor; yalnız biri 12'den büyükse otomatik çöz; hem tarihler gelecek hem >2100 reddedilir (`importlib.js:44` kalıbı). |
| S4 | Kullanıcı bugün kendi kilosunu girdi, dosyada da aynı gün kilo var | `weights()` günlük haritası dizideki SON kaydı seçer (`01-core.js:312`, sırasız `S.entries`); içe aktarılan kayıt yeni `id` alıp kullanıcının kaydını ezer | Günde tek kilo kuralı: o güne ait mevcut kilo varsa dosyadaki satır atlanır; dosyada aynı gün birden çok kilo varsa ilk. Önizlemede sayılır. (Bu sorun mevcut kodda zaten var: dizi sırası zaman sırası sayılıyor; içe aktarım bunu kolayca tetikler.) |
| S5 | Kilo `lb` ama kg sanıldı (180 -> 180 kg) | Trend bozulur | Başlıkta "lb/lbs/pound" varsa lb; yoksa tüm değerler > 120 ve ortanca < 400 ise "lb olabilir mi?" sorusu (`Algo.lbSuspect` kalıbı `04-sheets.js:73`). Aralık dışı (20-400 kg) satır atılır ve sayılır. |
| S6 | Şeker mmol/L (5,6) mg/dL sanılır | 5,6 mg/dL `check` 20-800 dışında -> reddedilir | Başlıkta birim varsa kullan; yoksa değerlerin ortancası < 35 ise mmol sor. 20-33 örtüşmesinde kullanıcıya sor. |
| S7 | Sistolik/diyastolik sütunları ters seçilmiş | Hepsi `sys<=dia` hatasıyla reddedilir (`vitalslib.js:36`) | Önizleme "Okunamadı 400" der; sütun eşleme ekranına geri dön butonu. |
| S8 | `120/80` tek hücrede | Sütun bulunamaz | `^\d{2,3}\s*[/-]\s*\d{2,3}$` hücresi sys/dia diye bölünür. |
| S9 | Saat yok | `timeOk` hatası | Saat sütunu yoksa tansiyon/şeker için "12:00, seans Diğer" varsayımını açıkça yazarak sor; sabah/akşam seansı UYDURULMAZ (ev ortalaması sabah/akşam ayırıyor: `vitalslib.js:81`). |
| S10 | Saat dilimli zaman damgası (`...Z`, epoch ms) | Gün 1 kayabilir | `Z`/ofset varsa `new Date()` yerel gün; epoch ms 13 haneli sayıysa tarih sayılır; yoksa yerel okuma (`importlib.js:stamp` zone yok sayıyor, bu nedenle `Z` ayrıca ele alınmalı). |
| S11 | Excel tarih seri sayısı (45123) | Sayı tarih sanılmaz | 30000-60000 aralığındaki tam sayı tarih sütunu ise 1899-12-30 + gün; belirsizse sor ya da atla. |
| S12 | Formül enjeksiyonu / HTML | Ad/not içinde `=...` | Not alanı `NOTE_MAX=80` ve `esc()`; kontrol karakterleri temizlenir (`importlib.js:6` kalıbı). Not sütunu v1'de alınmaz. |
| S13 | Sütun adı eşleştirmesi yanlış (örn. "Nabız" diyastolik sanılır) | Yanlış kayıt | Otomatik tanıma yalnız tam/kök eşleşme (tarih, date, kilo, weight, sistolik, systolic, diastolic, şeker, glucose); emin değilse eşleme ekranı. Önizleme her zaman. |
| S14 | Binlik/ondalık ("1.234,5" vs "1,234.5", "82.4" kilo) | Yanlış sayı | `ImportLib.num` mantığı (`:29-37`) yeniden kullanılır; tek `.` veya tek `,` ondalık sayılır (kilo/tansiyon için doğru; "1.234" tek noktalı değerler aralık denetiminden geçemez). |

Üst sınırlar: 5000 satır/içe aktarma, 8 MB dosya, `STORE_WARN` bütçesi (`importui.js:7-9` kalıbı), kilo için `nextId`, tansiyon için `MAX_ROWS=50000` (`vitalslib.js:11`).

### (6) Güvenlik, tıbbi, hukuki
Tıbbi iddia yok; veri doğrudan kullanıcı dosyası. Kaydın "Dışarıdan" olduğunu anlatan etiket yok (şema değişmediği için); bu bir kayıp. Risk: yanlış eşlemeyle sağlık kaydı kirlenir -> önizleme + geri alma + aralık denetimi; ayrıca kullanıcıya "Hekim raporunda bu değerler görünecek" notu verilebilir. KVKK: veri cihazda kalıyor (`dogrulama.md:60`). Samsung Health/Withings/Omron dosya şemaları BU analizde doğrulanamadı: yalnız bir Samsung forum kaydında zaman damgalarının epoch ms olduğu, Samsung dosya adlarının `com.samsung.health.<kategori>` kalıbında olduğu görüldü; weight sütun listesi bulunamadı. Bu yüzden "belirli rakip biçimi" VAAT EDİLMEZ; ilke "başlıktan tanı, emin değilsen sor".

### (7) Kabul testleri (dosya adıyla)
- `scripts/csvread.test.js` (yeni): `;` ve `,` ayırıcı; ondalık virgül/nokta; `dd.mm.yyyy`, `dd/mm/yyyy`, ISO, ISO+`Z`, epoch ms, Excel serisi; belirsiz gün/ay sorusu; BOM; kapanmayan tırnak hatası; 5000 satır sınırı.
- `scripts/csvread.test.js`: S1-S4, S6, S8 mükerrer ve birim senaryoları; kendi `saglik`/`kayitlar` çıktısını (`CsvLib.files`) geri okuyup tam eşleşme: 0 yeni kayıt (round trip).
- `scripts/csvread.test.js`: aralık dışı kilo/tansiyon/şeker satırları atılır ve sayılır; `check` hata kodları Türkçe nedenle gösterilir.
- `scripts/app.test.js`: onayla -> `S.entries`/`S.vitals` doğru sayı; geri al -> eski durum (id, `nextId` tutarlı); aynı gün kendi kilosu varsa dosyanınki yazılmaz; yedek -> geri yükleme sonrası kayıtlar kalır.
- `scripts/boundary.test.js`: `data/` dosyaları `S.entries|S.vitals` kullanmaz.
- `e2e/backup.spec.js` veya yeni `e2e/csvimport.spec.js`: dosya seç, önizleme, onay, geri al; 200% yazı ve dar ekranda taşma yok (`e2e/senior.spec.js`, `e2e/access.spec.js` kalıbı).

### (8) Büyüklük
Büyük-orta (~3-4 gün): okuma/tanıma lib'i + taşıma, iki modül API ucu, UI (eşleme + önizleme + birim/tarih soruları), 6-8 test. Yalnız "kendi dışa aktarımını geri oku + basit başlık tanıma" ile (eşleme ekranı olmadan) ~2 gün.

### (9) RED mi?
Genel eşleme ekranı (v1'de) RED ağırlıklı: 60 yaş için karmaşık ve yanlış eşleme riskinin ana kaynağı. Öneri: v1'de yalnız başlıktan tam tanınan dosyalar (kendi dışa aktarımı + "tarih,kilo", "tarih,sistolik,diyastolik" gibi yaygın başlıklar); tanınmayan dosyada "Bu dosyayı tanıyamadım" ve CSV'yi paylaşma yolu. Eşleme ekranı kullanıcı geri bildirimi gelirse v2.

---

## 7. Kaynaklar ve doğrulanamayanlar

Doğrulanan (bu oturumda, 2026-10-10, WebSearch özeti; tam metin açılmadı):
- Cohen (1988) d eşikleri 0,2/0,5/0,8 ve "operasyonel ölçüt" uyarısı: https://metricgate.com/blogs/small-medium-large-effect-size-cohen/ , https://www.rdocumentation.org/packages/effectsize/versions/0.7.0/topics/interpret_cohens_d
- Ruxton (2006) Behav Ecol 17(4):688-690, eşit olmayan varyanslı t testi: https://eprints.gla.ac.uk/9777 ; GraphPad: https://www.graphpad.com/support/faq/the-unequal-variance-welch-t-test/
- Samsung Health dışa aktarım adlandırması/epoch ms: https://takeoutday.org/guides/how-to-export-samsung-health-data , https://forum.developer.samsung.com/t/samsung-health-export-files-field-descriptions/1727 (weight sütunları yok)
- WHO ilaç güvenliği çerçevesi, yaşlılar riskli grup: https://who.int/news/item/16-09-2022-who-calls-for-urgent-action-by-countries-for-achieving-medication-without-harm
- WHO lif >=25 g, tuz <5 g (2 g sodyum): `dogrulama.md` bölüm 3 (önceki denetim); bu oturumda yeniden açılmadı.

DOĞRULANAMADI (öneriye dayanak yapılmadı):
1. Çift doz uyarısının yaygınlığı/etkisi (WHO belgesi çift dozu adıyla anmıyor); 60 dk eşiği ürün sabitidir.
2. Welch t ve Cohen d eşiklerinin tam metinleri (kitap/makale açılmadı); |t|>=2,0/2,8 eşikleri yazarın seçimidir, kaynak değil simülasyonla (bu rapor, `sim.js`) gerekçelendirildi; ruh hali dağılımı varsayımsaldır (gerçek kullanıcı verisinde SD farklı olabilir), test eşiği buna göre kalibre edilmeli.
3. Withings/Omron/Samsung weight/BP/glucose CSV sütun şemaları.
4. Yerleşik satırlarda lif kapsam oranı (üretimden önce ölçülemez; test eşiği %60 öneridir).
5. Tuzun Türk ev yemeği sodyumundaki payı için hakemli kaynak aranmadı; `recipes.txt:7` kod olgusu, tuz payı iddiası değil.

## 8. Önerilen uygulama sırası
13c -> 13b -> 15 (kanıt etiketi + adım->uyku) -> 14b -> 14a -> 13a (lif) -> 16. Gerekçe: küçük ve bağımsızlar önce; 14a ancak alarm içi satır içi onay tasarımı kararlaştırılınca; 16 en büyük ve en riskli olduğundan son.
