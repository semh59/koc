# Kurul karar turu: Bugün, testle sabitlenmiş 7 ret (2026-10-16)

Kapsam: HEAD 2241ee2 ve çalışma ağacı. Tur sırasında medui, vitalsui ve app.test.js değişiyordu; satırlar birkaç satır kayabilir, bu yüzden test adı da yazıldı. Ölçümler headless Chrome'da Windows yazı tipiyle yapıldı, yaklaşıktır. Kod değiştirilmedi.

## 1. Saati gelmiş doz halkaların üstünde: ORTA-YOL (koşullu değiştir)
- **Gerekçe:** Sıra 03-screens.js:117'de sabit: halkalar ve eylemler önce, yapılacaklar sonra. 360×640'ta alt menü y≈551'de başlıyor, saati gelmiş dozun "Aldım" düğmesi y≈958'de (büyük yazıda ≈1028). 412×915'te menü 842'de, "Aldım" 918'de. Yani doz hiçbir telefonda ilk ekranda görünmüyor; ONAY 20 (alışkanlık satırını aşağı almak) yalnız ≈61 px kazandırıyor. "Information hierarchy" testi (app.test.js ≈:2299, görevdeki :2296) genel kural olarak doğru, ama saati gelmiş ilacın önceliğini görmüyor.
- **Değişiklik ve test:** Yapılacaklar kartı yalnız medTodo'da "Gecikti" ya da "Dün kaçırıldı" satırı varken (medui.js:98-99) `.bgL`'nin başına geçer. "Henüz ilaç eklemedin", ölçüm ve oruç satırları bu koşula girmez. Böylece hiyerarşi testi değişmez, çünkü o noktada S.meds boş. `first` grubunun tamamı taşınırsa test bozulur (bpOn ve fastOn açık). Yeni test: açık bir 00:00 dozu varken `.todo` `.rings`'ten önce gelir, doz işaretlenince eski sıra döner.
- **Risk:** Kart ekran açıkken belirirse "Aldım" parmağın altına kayar ve doz yanlışlıkla "alındı" işaretlenebilir. Bu yüzden yer yalnız ekran açılışında ve sekme dönüşünde değişir, dakikalık yenilemede (ONAY 25) değişmez; Aldım ile Atla arasındaki aralık (app.css:357) korunur. Yatay Bugün ölçülmedi; orada kart zaten sağ sütunun başında.

## 2. Hızlı çip sayısı: ORTA-YOL (sayı ve sıra kalsın, "Diğer" yok, konum sabitlensin)
- **Gerekçe:** 360 px'te 6 çip de 8 çip de 3 satır tutuyor; su ve içecek çifti tek başına bir satırı dolduruyor. Sayıyı 6'ya indirmek satır kazandırmaz, yalnız Not ve Yürüyüş'ü bir dokunuş arkasına saklar ve bulunmalarını zorlaştırır. Tansiyon ve Şeker çipleri zaten yalnız modül açıksa çıkıyor. Asıl sorun ölçüldü: sabah 128/82 girilince "Tansiyon 128/82" çipi genişliyor (app.css:96 `flex:1 1 auto`); Tansiyon, Şeker, Not ve Yürüyüş birer satır aşağı iniyor ve eski "Not" yerinde artık "Tansiyon" duruyor. Yani 03-screens.js:81'deki "başparmak başka çipe düşmez" amacı bugün de karşılanmıyor. today-quick:15 ve :17 konumu değil, yalnız DOM sırasını koruyor.
- **"Diğer" testi bozar mı:** Sabit bir katlamada çipler DOM'da aynı sırada kalırsa ve katlamanın başlığı `.chip` değilse :15 ile :17 olduğu gibi geçer, ilke bozulmaz. Yine de önerilmez.
- **Değişiklik ve test:** `.qa` eşit sütunlu bir ızgara olur (360 px'te 3 sütun); değer çipin içinde 2. satıra sarılır, çipin genişliğini değiştirmez. Bu, ONAY 26'dan ("Şeker 95 mg/dL") önce yapılmalı, yoksa kayma artar. Test: Chrome düzen testi (chrome-lib) 360×640'ta çip kutularını ölçüm öncesi ve sonrası, yürüyüş açık ve kapalıyken aynı bulur. jsdom bunu ölçemez. design-language.md:43'e "konum da sabit" eklenir.

## 3. Yürüyüş çipi: ORTA-YOL (hakemin gerekçesi yanlış)
- **Gerekçe:** entry-quick:63 bozulmaz. walkStart önce stepsSync'i bekliyor, sonra çiziyor (walkui.js:12-18); iki eşzamanlı tıklama aynı başlat düğmesine düşüyor, çip "Bitir" olsa da test geçer. Gerçek risk testin görmediği yerde: çizimden sonra gelen ikinci dokunuş "Bitir"e basar, walkStop bitiş saatini (t1) onaysız ve hemen yazar (walkui.js:23), yürüyüş 0 sn'de durur. Kayma da ölçüldü: modüller açıkken çip kalkınca aynı satırdaki Şeker 102 px'ten 166 px'e genişliyor, Not x=126'dan 190'a kayıyor. Modülsüz 360 px'te alttaki her şey 56 px yukarı çıkıyor.
- **Değişiklik ve test:** Çip yerinde kalır, "Yürüyüş sürüyor" yazar ve walkgo ile Adım ekranını açar; Bitir yalnız o ekranda kalır. Başlattıktan sonraki ≈1 sn içindeki dokunuş yok sayılabilir. today-quick:9 ve :15 değişmez. Yeni test: S.walk açıkken son çip hâlâ walk; tıklanınca tab=steps olur ve t1 boş kalır. app.test.js ≈:2715 ("Yürüyüş sürüyor") geçer.

## 4. ✓ yerine SVG: KORU (en düşük öncelik)
- **Gerekçe:** Halka düğmesinin adı aria-label'dan geliyor (03-screens.js:35); içerikteki ✓ ya da SVG ekran okuyucuya ulaşmıyor. Görsel kazanç yalnız tutarlılık: ikon kuralı (design-language.md:49) ve "Aldım"daki Icons.svg("check") (medui.js:76). design-language.md:48 ✓'yi açıkça yazıyor.
- **Yapılırsa:** :2269 bozulur, çünkü textContent'te "✓Hedef tamam" sayıyor. Test "Hedef tamam" 2 kez ve `.done .rc svg` 2 adet olarak güncellenir, design-language.md:48 de güncellenir. ONAY 31'e eklenebilir.

## 5. Halkada "kcal": KORU (görünen metin)
- **Gerekçe:** "kcal"ın anlaşılmadığına dair kanıt yok. Rakamın altında "Kalori" etiketi zaten var (03-screens.js:77). UI kodunda "kcal" ≈457 kez geçiyor (günlük, öğün, besin arama); yalnız halkayı değiştirmek tutarsızlık yaratır. Uzun ifade de büyük yazıda ≈111 px'lik halka merkezinde sarılabilir.
- **Tek düşük riskli adım:** Ekran okuyucu adında (aria-label) "kalori" yazmak. :2267 textContent'e baktığı için bozulmaz; hideNums ve "ring buttons name" testleri de geçer. Önce TalkBack'in "kcal"ı nasıl okuduğu telefonda dinlenmeli; bu doğrulanmadı.

## 6. Su çipinde 3 dokunuş = 3 kayıt: KORU (koruma isteğe bağlı)
- **Gerekçe:** Test today-quick'te değil, undo.test.js:9'da ve bilinçli: geri al yığını çift dokunuşa göre kurulmuş (04-sheets.js:38). Bildirim günün toplamını yazıyor ve 10 sn kalıyor (07-actions.js:7, 04-sheets.js:39). Fazladan bardak bir veri doğruluğu sorunu, ilaçtaki gibi bir güvenlik sorunu değil; ilaçta çift doz kontrolü var (recentTaken, medlib.js:173). Tek yan etki: hayalî bardak hedefi tamamlarsa o günün su hatırlatmaları kalkar (07-actions.js:5-6); ONAY 9 uygulanınca geri alma bunları geri getirecek. 400 ms için depoda bir kaynak yok.
- **Yapılırsa:** Zaman koruması undo.test.js:8-14'ü bozar, çünkü 3 eşzamanlı tıklama 1 kayıt olur. Tıklamalar sahte saatle aralıklandırılır ve "100 ms içinde 2 dokunuş = 1 kayıt" testi eklenir. Risk: bilerek hızlı basan kullanıcının ikinci bardağı sessizce sayılmaz.

## 7. Büyük yazı varsayılanı ve yatay test: KORU (varsayılan kapalı) + yatay hatasını DEĞİŞTİR
- **Gerekçe:** Varsayılan açık olursa "comfortable mode: off by default" testi (≈:2989) bozulur; e2e onboarding:15 `check()` kullandığı için geçer. Android sistem yazı ölçeği WebView'e zaten yansıyor (docs/rd/kullanilabilirlik-gizlilik.md:57); telefonunda yazıyı büyütmüş bir yaşlıda büyük yazı modu bunun üstüne biner, %200 yazıyla taşma riski var (docs/rd/analiz-dalga-1.md:266). Ölçüm: büyük yazı açıkken 360×640'ta "Aldım" 958'den 1028'e iniyor, çipler 4 satıra çıkıyor. Karşılama ekranı her yeni kullanıcıya "Yazıyı büyüt?" diye soruyor (onboardui.js:81), ama bu ekran yaş alanından önce geliyor (today-quick:47). Bu yüzden "65+ ise ilk açılışta öner" ancak ONAY 24'teki Bugün önerisiyle ya da yaş girildikten sonra sorulan ikinci bir soruyla olur.
- **Yatay test neden kırılıyordu:** Şu anki ağaçta 3 koşunun 3'ünde geçti. Geçmişteki kırılma test yardımcısındaki bir yarıştı (sayfa açılır açılmaz, belge yokken değerlendirme); b3ee02a ile düzeldi. Büyük yazı açıkken ise 800×360 ve 640×360'ta "guide-summary" kalıyor: yapışkan alt çubuk `.gdfoot` (app.css:336) kilo kutusunu (.w-kg) örtüyor. Bu, büyük yazıyı bugün açan herkeste görülen gerçek bir hata ve ONAY 24 bu kullanıcıların sayısını artıracak.
- **Değişiklik ve test:** Yatay blokta `#guide,.gdB{scroll-padding-bottom:72px}`. Stil sayfaya eklenerek denendi, iki durum da geçti; telefonda denenmedi. landscape-chrome.test.js yatay boyutları büyük yazı kapalı ve açık olarak iki kez koşar.

## Öncelik
1. Konu 1: saati gelmiş doz üstte. Sağlık konusu; doz ilk ekranda hiç görünmüyor.
2. Konu 2: çip ızgarası. Tansiyon ölçen her kullanıcıda her gün kayma oluyor; ONAY 26'dan önce yapılmalı.
3. Konu 3: yürüyüş çipi yerinde kalsın, Adım ekranına götürsün.
4. Konu 7: yatay CSS düzeltmesi. Tek satır, ONAY 24'ten önce yapılmalı; varsayılan kapalı kalsın.
5. Konu 6, 5 (yalnız aria-label) ve 4: isteğe bağlı, düşük değer.
