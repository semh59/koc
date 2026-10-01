# Tansiyon ve şeker takibi: plan (1 Ekim 2026)

Durum: plan, kod yazılmadı. Semih'in kararları (1 Ekim 2026):
- Ön ayarlar **iki alanda da var**. Şeker düğmesi kapsamı açıkça yazar ("diyabetli yetişkinler için ADA hedefi"), tansiyon düğmesi "eşik" der.
- Uç değer kutusu **olacak** (yalnızca bugün tarihli kayıtta, teşhissiz).
- Uygulama **yalnızca Semih için**: KVKK metni şimdilik gerekmez (dağıtım olursa şart).
- mmol/L ilk sürümde yok.

## Amaç ve sınır
Kullanıcının evde kendi cihazıyla ölçtüğü tansiyon ve kan şekerini kaydetmek, ortalama ve eğilimi göstermek, doktora PDF vermek. Uygulama **kayıt ve grafik** tutar. Teşhis, yorum, ilaç/insülin dozu, "hastasınız / sağlıklısınız" demek yok.

Neden bu sınır: FDA'nın 6 Ocak 2026 genel sağlık (wellness) rehberi, elle girilen tansiyon ve şeker kaydı yapan yazılımı şu şartlarla düşük riskli sayıyor: teşhis/tedavi amacı yok, belirli klinik eylemi yönlendirmiyor, klinik eşikleri taklit eden etiketler üretmiyor. Türkiye'de de aynı mantıkla (tıbbi cihaz sınıflaması) ilerlemek güvenli. Sağlık verisi KVKK'da özel nitelikli veridir: veri yalnızca telefonda kalır (mevcut vaat), sağlayıcıya (Koç) gönderilmez.

## Araştırma özeti (kaynaklar sonda)
- **Ev tansiyonu protokolü (ESC 2024):** Oturur, dinlenmiş, kol kalp hizasında. Her seansta 1-2 dk arayla **2 ölçüm**. Günde 2 seans (sabah, akşam), **en az 3 gün, tercihen 7 gün**, sonunda hepsinin ortalaması. Sabah ölçümü kahvaltıdan ve ilaçtan önce, uyanır uyanmaz değil. Ev ortalaması: <120/70 yükselmemiş, 120/70-<135/85 yüksek, ≥135/85 hipertansiyon eşiği.
- **Glukoz hedefleri (ADA 2026, diyabetli yetişkin):** yemek öncesi 80-130 mg/dL, yemekten sonra tepe <180. Hipoglisemi: seviye 1 = 54-69, seviye 2 = <54, seviye 3 = başkasının yardımı gereken. Hedefler kişiye göre değişir (yaş, ilaç, doktor).
- **Ölçüm bağlamı şart:** Aynı şeker değeri açlıkta ve yemekten sonra farklı anlam taşır. Kayıtta bağlam (açlık / yemek öncesi / yemekten 2 saat sonra / yatmadan önce / rastgele) olmalı.
- **Birim:** Türkiye'de mg/dL. mmol/L (÷18,016) ilk sürümde yok, istenirse eklenir.

## Tasarım kararları
1. **"Hedef aralığı" var, tanı eşiği yok.** Kullanıcı kendi (doktorunun verdiği) aralığı girer. Boşsa grafik bant çizmez. Etiketler yalnızca "aralığın üstünde / altında". "Hipertansiyon", "diyabet", "normal", "anormal" kelimeleri uygulamada geçmez (ön ayar açıklamasındaki kaynak satırı hariç). Tahlildeki "laboratuvarın referans aralığı" mantığının aynısı.
   - **Şeker aralığı bağlam başınadır:** açlık / yemek öncesi için bir aralık, yemekten 2 saat sonrası için ayrı aralık. Yatmadan önce ve rastgele için varsayılan bant yok. Bağlam başına ortalama ve "hedefte %" her ölçümün **kendi bağlamının** aralığıyla hesaplanır (160 mg/dL yemekten sonra aralıkta, açlıkta değil).
   - **Ön ayarlar (kullanıcı isterse doldurur):** Tansiyon: "ESC 2024 ev ölçümü eşiği 135/85" ve "yükselmemiş 120/70'in altı", **eşik** olarak etiketlenir, hedef diye değil. Şeker: ADA 80-130 ve <180 değerleri **yalnızca diyabetli yetişkinlerin tedavi hedefidir**; diyabeti olmayan biri için yanıltıcı olur. Bu yüzden şekerde ön ayar önerilmez (karar Semih'te), ya da düğme kapsamını açıkça yazar.
2. **Açık/kapalı özellik.** Ayarlar'da "Tansiyon takibi" ve "Şeker takibi" anahtarı (varsayılan kapalı). Açılınca Bugün'de **tek bir kompakt "Ölçüm" kartı** çıkar (Adım kartı gibi; hızlı düğme satırı 360 px'te dolu, yeni düğme eklenmez). Karta dokununca "Tansiyon / Şeker" seçimi ve son değerler. Trend'de de kart olur.
3. **Ayrı veri tablosu:** `S.vitals`, yeni listeleme ve temizleme (`cleanVitals`) iki yükleme yolunda (yerel açılış ve yedekten yükleme) da çalışır, şifreli yedeğe otomatik girer, sıfırlamada silinir. Tahlildeki `S.labs` ile aynı kalıp.
4. **Alanlar:** `{id, day, time, k:"tansiyon"|"seker", ses?:"sabah"|"aksam"|"diger", sid? (seans kimliği), sys, dia, nabiz?, g? (mg/dL), ctx?, not?}`. Tansiyon seansı = aynı `sid` taşıyan iki satır (r1, r2). Geçerlilik: sistolik 50-300, diyastolik 30-200 ve sistolik > diyastolik, nabız 25-250, glukoz 20-800 mg/dL. Notlar 80 karakter.
5. **Yazım hatası koruması:** Mutlak sınırların dışı hiç kaydedilmez. Ek olarak "emin misin" (tekrar dokunmayla kaydet) yalnızca **aynı türdeki ve aynı bağlamdaki** önceki ölçümle karşılaştırılır (tansiyon: sistolik ±60; şeker: aynı bağlamda ±150). Farklı bağlamlar arası fark (açlık ve yemek sonrası) normaldir, uyarı üretmez.
6. **Acil durum notu (tek istisna):** Yalnızca **bugün tarihli** kayıtta, sistolik ≥180 **veya** diyastolik ≥120, ya da glukoz <54 veya >400 mg/dL ise (geriye dönük girilen eski ölçümde çıkmaz) kayıttan sonra sade bir kutu: "Bu değer çok uç. Cihazı kontrol edip ölçümü tekrarla. Belirtin varsa ya da değer doğruysa 112'yi ara." Teşhis ya da tedavi tavsiyesi vermez. Karar sende: ister bu kutu olmasın, ister eşik değerleri doktora sorulsun.
7. **Tansiyon seans mantığı:** Giriş ekranında seans seçici (Sabah / Akşam / Diğer) ve "2 ölçüm" alanı (1-2 dk arayla). Seans, saatten bağımsız seçilir (geriye dönük girişte yanlış seansa düşmesin). **Ham ölçümler (r1, r2) ayrı saklanır**, seans ortalaması türetilir; doktor PDF'i iki ham değeri de gösterir. "7 gün ev ortalaması" kartı: ESC protokolüne göre sabah/akşam ortalamaları ve kaç ölçüm olduğu ("3 günden az: ortalama için yetersiz" notu).
8. **Şeker özeti:** son değer, 7/14/30 gün ortalaması, hedef aralığında geçen ölçüm yüzdesi, en yüksek/en düşük, bağlama göre ayrı ortalama. **Yapmadığımız:** tahmini HbA1c (GMI), doz önerisi, "kontrol altında" gibi yorumlar.
9. **Grafikler (SVG, uygulamada):** Tansiyon: sistolik ve diyastolik çizgi, bant, sabah/akşam işaretleri. Şeker: bağlama göre renkli noktalar, günlük ortalama çizgisi, bant. Mevcut Trend altyapısı ve tahlil grafik koduyla aynı geometri.
10. **Hatırlatma:** Mevcut hatırlatma sistemine "Tansiyon ölç" (sabah, akşam) ve "Şeker ölç" eklenir, varsayılan kapalı, özellik açılınca önerilir. **Alarm bütçesi:** her hatırlatma 30 tek seferlik alarm tutar (şu an 6 hatırlatma = 180, +3 yeni = 270, + adım alarmı). Android'de uygulama başına eşzamanlı alarm sınırı vardır (500 civarı, doğrulanacak). İlaç hatırlatıcısı da eklenince bu şemanın sınırı aşılır: o zaman gün sayısı 30'dan 14'e indirilir ya da kurulum "sonraki N alarm" ile sınırlanır. Uygulanmadan önce ölçülecek.
11. **Doktor raporu PDF:** 7/14/30/90 gün seçilir. İçerik: ortalamalar, grafik, tüm ölçümlerin tablosu (tarih, saat, bağlam, değer). Tahlil PDF'indeki tuval → JPEG → PDF hattı yeniden kullanılır. Alt bilgi: "Kullanıcının girdiği ölçümlerdir, tıbbi yorum içermez."
12. **Koç'a gitmez.** Bu veriler yapay zekâ sağlayıcısına gönderilmez (Koç'un bağlam metnine eklenmez). İleride istenirse ayrı açık onayla.
13. **Tahlille ilişki:** Tahlil kayıtlarındaki HbA1c ve açlık glukozu şeker ekranında "Tahlil sonuçların" satırı olarak bilgi amaçlı gösterilir, ölçümlerle karıştırılmaz.

## Kapsam dışı (ilk sürüm)
Bluetooth cihaz bağlantısı, Health Connect'ten otomatik aktarım, insülin/ilaç dozu, karbonhidrat sayımı, CGM verisi, mmol/L, cihaz ekranı fotoğrafından okuma (ML Kit 7 segment ekranlarda zayıf, sonra deneriz).

## Aşamalar
1. **Çekirdek + testler:** `www/vitalslib.js` (doğrulama, ortalama, aralık, süre filtreleri, temizleme). Tablo tabanlı testler.
2. **Arayüz:** Ayarlar anahtarları, Bugün hızlı düğmeleri, giriş ekranları, görünüm ve grafikler, acil durum kutusu, silme/geri al.
3. **Hatırlatmalar.**
4. **Doktor raporu PDF.**
5. (Sonra) cihaz ekranı OCR denemesi, Health Connect.

## Test planı (ben, otomatik)
- Doğrulama sınırları ve imkânsız değerler, sistolik > diyastolik, tür karışması.
- Ortalamalar: seans ortalaması, 7 gün ev ortalaması (tek ölçümlü günler, eksik günler, 3 günden az uyarısı), bağlama göre ortalama, hedefte yüzde (sınır değerler dahil).
- `cleanVitals`: bozuk satırlar, yinelenenler, sınır (5000 satır), iki yükleme yolu, yedek gidiş-dönüş, sıfırlama.
- Arayüz akışı (jsdom): anahtar kapalıyken hiçbir yerde görünmez, açılınca düğme ve kart; giriş, aykırı değer onayı, uç değerde acil kutusu, silme ve geri alma; yasak kelimeler hiçbir ekranda ve PDF metninde geçmez.
- Hatırlatma kurulumu (kimlikler çakışmaz, kapalıyken kurulmaz).
- PDF: sayfa bölme, metinler (kayıt dışı veri yok), pdf.js ile geri açma.
- Telefonda Semih'in deneyeceği maddeler `docs/yapilacaklar.md` içine eklenir.

## Karar bekleyenler (Semih'e)
1. Aralıklar: "Genel kılavuz değerlerini kullan" düğmesi olsun mu (öneri: evet, kullanıcı isterse doldurur)?
2. Uç değerde acil durum kutusu olsun mu (öneri: evet, sade ve teşhissiz)?
3. mmol/L ilk sürümde gerekli mi (öneri: hayır)?
4. Bu özellik yalnızca kendin için mi, başkalarına da dağıtılacak mı? Dağıtılacaksa KVKK aydınlatma/açık rıza metni ve gizlilik politikası şart.

## Kaynaklar
- ESC 2024 hipertansiyon rehberi: https://academic.oup.com/eurheartj/article/45/38/3912/7741010
- 722 ev tansiyonu protokolü: https://pmc.ncbi.nlm.nih.gov/articles/PMC9532917/
- ADA Standards of Care 2026, bölüm 6: https://diabetesjournals.org/care/article/49/Supplement_1/S132/163927/6-Glycemic-Goals-Hypoglycemia-and-Hyperglycemic
- FDA 2026 genel sağlık rehberi özeti: https://www.troutman.com/insights/fdas-2026-guidance-on-general-wellness-devices-policy-for-low-risk-devices/
