# Dış değerlendirme: 36 maddenin doğrulaması (6 Ekim 2026)

Kod durumu `0310001`. Her madde repo, git geçmişi, CI ve resmi kaynakla tek tek kontrol edildi. Sayılar bugün yeniden ölçüldü. Ölçüm betikleri depoya girmedi.

**Özet:** 20 DOĞRU, 5 KISMEN, 3 ESKİ (yalnız sayı değişmiş), 3 YANLIŞ, 1 DOĞRULANAMADI. G bölümündeki 4 düzeltmeden 2'si bizim kararları etkiliyor (#34 ve #36).

Ciddiyet: **P** Play'i engeller · **Z** kullanıcıya zarar · **K** kalite · **k** kozmetik/bilgi.

| # | Durum | Kanıt | C | Aksiyon |
|---|---|---|---|---|
| 1 | DOĞRU | `gizlilik-politikasi.md`'de 14 `[DOLDURULACAK]` alanı var: ad, adres, e-posta, tarih, URL, 18 yaş altı, hukukçu (satır 5-11, 33, 49, 57, 60, 69). | P | Semih kimlik ve iletişim bilgisini verir, hukukçu onaylar. |
| 2 | DOĞRU | §4 (satır 32) Koç aktarımını yalnız açık rızaya dayandırıyor. 7499 s. Kanun ile değişen m.9 (1.6.2024) sırası: önce yeterlilik kararı, sonra uygun güvence (standart sözleşme, imzadan sonra 5 iş günü içinde Kurul'a bildirim; BCR; taahhütname). Açık rıza yalnız **arızi** aktarımda geçerli. Koç ise her gün kendiliğinden gönderiyor (bkz. #3), bu arızi değil. | P | Hukukçu soruları aşağıda. |
| 3 | DOĞRU | Giden alanlar `coachlib.js:217-236` `contextText`: profil, sağlık notu, hedefler, 14 gün özeti, bugünkü kayıtlar, antrenman, notlar, ilaç adı/doz/uyum. Liste politika §5 ve onay metniyle aynı (`coach.js:454`, eşitliği `app.test.js` sınıyor). **Açık nokta:** `cAuto` (`coach.js:377-401`) uygulama her açıldığında (`index.html:1354`, `1363`) günde bir sabah planı, haftada bir rapor gönderiyor. Politika §5 bunu yazıyor, uygulama içi onay metni "kendiliğinden gönderilir" demiyor. | P | Onay metnine otomatik gönderim cümlesi eklenip `CONSENT_V` artırılır, ya da otomatik gönderim düğmeye bağlanır. `coach.js` başka ajanda olduğu için onun işi bitince yapılır. |
| 4 | DOĞRU | İlk 106 satırda 45 işaretli, 61 işaretsiz. İşaretli 45'i USDA'yla yeniden karşılaştırdık, 45/45 tutuyor. İlk sürümün başlığı (`e5226d8`) "TürKomp ve USDA'dan derlenmiş" diyordu. `f06e0fa` yalnız bu cümleyi sildi, değerler aynı kaldı. 61 satırdan 46'sının USDA karşılığı yok (Türk yemekleri), yalnız 3'ünün tarif hesaplı ikizi var (Menemen, Lahmacun, Sucuk). | P (lisans) | 61 satır tarif ya da USDA hesabıyla yeniden üretilir ya da TürKomp'tan izin istenir (G13). |
| 5 | DOĞRU | Ekim 2026'ya kadar dağıtılan APK'lar herkesin bildiği debug anahtarıyla imzalı (`dagitim.md:11`). Yeni release anahtarıyla güncelleme üstüne kurulmuyor. Yedekle geri yükleme telefonda denenmedi (`yapilacaklar.md` API 36 maddesi). | Z | Telefonda yedek al, kaldır, kur, geri yükle. Eski kurulumlar ayrıca risk taşıyor (bkz. kaçırılanlar). |
| 6 | DOĞRU | 13.11.2023'ten sonra açılan kişisel hesapta: en az 12 testçi, kesintisiz 14 gün kapalı test, sonra üretim başvurusu ([Play 14151465](https://support.google.com/googleplay/android-developer/answer/14151465)). Ek risk: Play, "Medical" gibi sağlık uygulamaları için kurumsal hesap istiyor ([13634885](https://support.google.com/googleplay/android-developer/answer/13634885)). İlaç hatırlatıcı ve tansiyon/şeker kaydı bu tanıma itilebilir. | P | G3: hesap türü kararı. Kişiselse testçileri şimdiden bul. |
| 7 | KISMEN | Ön plan servisi (FGS) beyan metni ve video adımları hazır (`play-izin-beyanlari.md:28-31`). Sağlık beyanı taslağı da hazır (`play-data-safety.md:38-42`). Video çekilmedi, Play hesabı yok. | P | Semih videoyu çeker. Hesap açılınca formlar doldurulur. |
| 8 | DOĞRU | Hukukçu ya da hekim onayı bekleyen 4 karar var (`play-data-safety.md:47-51`): Koç "paylaşım" mı, m.6/m.9 metni, Open Food Facts IP adresi, ölçüm kaydının "tıbbi" sayılıp sayılmaması. | P | Hukukçu ve hekim paketine konur. |
| 9 | ESKİ (sayı) | Bugün: 79 `[ ]`, 40 `[~]`, 2 `[x]`, 1 iptal (`yapilacaklar.md`). | k | Yok. |
| 10 | KISMEN | Telefonda geri tuşu `popstate`'e değil Capacitor `backButton` dinleyicisine bağlı (`index.html:1375`). `popstate` yalnız tarayıcı yedeği. Android 16 telefonda denenmedi. CI smoke API 36 emülatörde kurma, açma ve çökme yokluğunu kanıtlıyor (koşu 128). | K | Telefonda dene (A maddesi). |
| 11 | DOĞRU | Smoke şunları kanıtlıyor: 100'den fazla uyandıran alarm kuruluyor, bildirim düğmeleri (Aldım/Atla/+250) çalışıyor, süreç ölünce kayıt yinelenmiyor, ilaç kanalı yüksek önemde (`smoke.sh:21-157`). Kanıtlamadığı: alarmın gerçekten zamanında çalması, Doze ve MIUI davranışı. | Z | Xiaomi'de bir gece testi (A4, A7). |
| 12 | DOĞRU | `[~]` durumda (`yapilacaklar.md`). Şifreleme birim testli (`backup.test.js`), gerçek Drive'a gönderim denenmedi. | Z | Telefonda yedek gönder ve geri yükle. |
| 13 | DOĞRU | Ölçüm yok (A3). | K | Bilinen bir mesafeyi yürüyerek karşılaştır. |
| 14 | DOĞRULANAMADI | 3993/4150 sayıları repoda ve belgelerde yok (sohbetten gelmiş olmalı). Kontrollü test yapılmadığı doğru. | K | 500 adımı elle sayarak test et. |
| 15 | ESKİ (sayı) | Bugün 818 kayıttan 394'ünde aralık var. hi/lo oranı %30'dan büyük olan 186, %80'den büyük olan 100 kayıt. Asıl sorun aralıkların genişliği değil, aynı yemeğin iki satırı: eski Lahmacun 162-302, tarif hesaplı Lahmacun 225-236. | K | Eski satır tarif ikiziyle birleştirilir (#4 ile birlikte). |
| 16 | YANLIŞ | Kaynağı belli: 132 kcal ilk elle girilen satırdan geliyor (`e5226d8`, `tools/besin/mevcut.txt:5`). Tarif hesabı 110 veriyor ("Menemen (2 yumurtalı)", `tarif.txt:185`). | K | #4'le birlikte eski satır kalkar. |
| 17 | ESKİ (sayı) | Bugün 75 vekil satırı var (`vekil.txt` 70 + `vekil-ogun.txt` 5). `vekil.tsv`'deki 88 not çapraz kontrol notlarını da içeriyor. | k | Yok. Vekil nedeni arayüzde zaten gösteriliyor. |
| 18 | YANLIŞ | Kaynak dosyalar indirilip karşılaştırıldı. USDA SR Legacy: `usda-altkume.json`'daki 329 kaydın 329'u ad ve değerle birebir aynı. CIQUAL 2025 ve CoFID 2021: `harici.py` kaynaktan yeniden çalıştırıldı, 12 kaydın 12'si aynı çıktı. `uret.js --kontrol` geçiyor, yani `foods.js` = kaynaklar. İndirme adresleri `cikar.py` ve `harici.py`'de yazılı. | k | Kalan tek şey anlam eşlemesi: yaklaşık 30 "ad ↔ USDA açıklaması" çiftine elle bakılır. |
| 19 | DOĞRU | `FOODS` alanları: ad, kcal, protein, karbonhidrat, yağ (n,k,p,c,f). Lif, şeker ve sodyum yalnız etiket ve barkod kaydında var (`index.html:422` NLBL). | K | Özellik (USDA'da var, eklenebilir). |
| 20 | YANLIŞ | 43 dosyanın hepsi testte çalışıyor. JSDOM testleri betikleri HTML'e gömdüğü için kapsama aracı onları dosya adıyla göremiyordu; dosya adı eklenerek ölçüldü. Sayılan 11 dosyada fonksiyon kapsamı %86-100, yaklaşık bayt kapsamı %72-100 (en düşük `importui` %72, `ocrui` %82). | k | Yok. |
| 21 | DOĞRU | `index.html` 130 KB, 1398 satır: 32 KB CSS ve tek gömülü betikte 93 KB. 9 test dosyası `index.html`'i doğrudan okuyor. | K | CSS ayrı dosyaya alınabilir, testler birlikte uyarlanır (M). |
| 22 | KISMEN → büyük ölçüde kapandı | Taramada 1804 şablon yeri var, 143'ünde `esc()` çağrısı var. Dinamik denemede tüm kullanıcı alanlarına `"'><b>` yükü kondu: 13 sekme, her sekmede 80'e kadar düğme ve Yemek ekle penceresi tarandı. Sonuç: **0 enjeksiyon**. Koç sohbet metni de kaçışlı (`coach.js:475-478`). Tek bulgu tahlildeki `q` alanı (`labui.js:23`, `42`). Ulaşılamıyor, çünkü her yükleme yolunda `cleanLabs` bu alanı yalnız `<` ya da `>` olarak bırakıyor (`lablib.js:228`). | k | Ek savunma olarak `esc(q)` eklenir (S). |
| 23 | DOĞRU | Planda var (D-Adım1-2), G1 kararına bağlı. | özellik | G1. |
| 24 | KISMEN | Test ayrıntısında tarihli sonuç listesi var (`labui.js:42`), değişim sütunu yok. | özellik | Değişim sütunu eklenir (S). |
| 25 | DOĞRU | Öğün şablonları var, haftalık plan kütüphanesi yok. | özellik | Karar. |
| 26 | DOĞRU | Yok. | özellik | Karar (fotoğraf yerel kalmalı). |
| 27 | DOĞRU | minSdk 24 (Android 7.0). iOS ve çok dil bilinçli olarak sonraya bırakıldı (`yol-haritasi.md` F). | k | Yok. |
| 28 | DOĞRU | Bilinçli karar (F bölümü). Sesli komut yalnız rehberli antrenmanda konuşma çıkışı olarak var. | k | Yok. |
| 29 | DOĞRU (eksik bilgiyle) | Takvim: 30.9.2026'da yalnız BR/ID/SG/TH, 2027'de dünya geneli. Öğrenci ve hobi için 20 cihaza kadar "sınırlı dağıtım" hesabı ve imzasız kurulum için ileri akış var ([developer.android.com](https://developer.android.com/developer-verification)). Türkiye'de APK dağıtımı 2027'ye kadar etkilenmiyor. | P (2027) | Play yolu zaten doğrulamayı kapsıyor. |
| 30 | DOĞRU | Sıradan kullanıcı anahtar alamaz. Sağlayıcı akışı başka ajanda yeniden tasarlanıyor (`ddb96bc`, `0310001`). | ürün | Not alındı, o işe bırakıldı. |
| 31 | KISMEN | Repoda yerel yapay zekâ denemesine ait iz yok. Sucuklu yumurta listede 301 kcal/100 g × 129 g = **388 kcal**, değerlendiricinin sayısı doğru. Kural tabanlı yazıyla kayıt da yok. | ürün | Karar: "2 simit 1 ayran" gibi kural tabanlı ayrıştırıcı yazılsın mı (M). |
| 32 | DOĞRU | Pazar verisi yok. | ürün | G1 ile birlikte değerlendir. |
| 33 | Bizi etkilemiyor | Belgelerimiz Snap It için "ücretsiz" demiyor (`rekabet-ozellik.md:50`). | – | – |
| 34 | **Etkiliyor** | Kullanıcı eylemi istisnası gerçekten var ([Play 10787469](https://support.google.com/googleplay/android-developer/answer/10787469)). Ama `cAuto` kullanıcı eylemi olmadan gönderiyor, bu yüzden istisna o gönderimleri kapsamaz. "Paylaşılıyor: Evet" kalmalı (`play-data-safety.md:48` doğru). | P | Otomatik gönderim düğmeye bağlanırsa "Hayır" seçeneği tartışılabilir (hukukçu). |
| 35 | Bizi etkilemiyor | Belgelerde böyle bir iddia yok. | – | – |
| 36 | **Etkiliyor (plan)** | Health Connect verisi telefonda okunursa "toplanmış" sayılmaz. Bu veri Koç'a giderse Data safety, onay metni ve Health Connect izin beyanı değişir, Play'in Health Connect politikası ayrıca kontrol edilmeli. | P (gelecek) | D-Adım1'e not olarak eklenir. |

## Değerlendiricinin kaçırdıkları
- **Yaş:** Kurulum 10-17 yaşı kabul ediyor (`index.html:418` age [10,100]), ama Data safety hedef kitleyi 18+ yazıyor. 18 yaş altında yalnız Koç kapalı, kalori hedefi açık. Play hedef kitle beyanı ve hekim kararı gerekli. **P/Z**
- **Eski kurulumlar:** Debug anahtarı herkesçe bilindiği için eski APK'yı kurmuş birine herkes "güncelleme" kurdurabilir. Kullanıcıları yeni imzaya taşımak acil. **Z**
- **Şifresiz yedek:** Paylaş/kopyala yedeğinde parola isteğe bağlı, boş bırakılırsa sağlık verisi düz metin olarak çıkıyor (`gizlilik-politikasi.md:63`). **Z**
- **Mağaza varlıkları:** Simge (512 px), öne çıkan grafik, ekran görüntüleri, IARC içerik derecelendirme ve hedef kitle anketleri hazır değil. `magaza-metni.md` yalnız metin içeriyor. **P**
- **Kurumsal hesap riski:** Bkz. #6. **P**
- **Gemini ücretsiz katmanı:** İstemler ürün geliştirmede kullanılabiliyor. Gönderim başına onay var, ama hukukçu sorusu.
- **Eski belge:** `dagitim.md:43` "versionCode 1" diyor. Oysa `patch-android.js:179-181` CI çalışma numarasını kullanıyor. **k**
- **Zaten çözülmüş olanlar** (listede yok ama sorulabilir): 16 KB hizası ve targetSdk 36 her derlemede CI'da denetleniyor (`dagitim.md:32`). Android otomatik yedeği kapalı (`patch-android.js:35`). `USE_EXACT_ALARM`, arka plan konumu ve fener izinleri kaldırıldı. Depolama izni yok. Hesap olmadığı için hesap silme şartı yok. Xiaomi bildirim çözümü kodda (telefon testi A4 bekliyor). Kontrast testleri var (`contrast.test.js`).

## Hukukçuya sorulacaklar (#2, #3, #8, #34)
Bu bölüm hukuki tavsiye değildir, yalnız soruları ve riskin yönünü gösterir.
1. Kullanıcı kendi hesabı ve kendi anahtarıyla sağlayıcıya bağlanıyor, veri geliştiriciye hiç uğramıyor. Bu durumda **veri sorumlusu** kim: NeoWell mi, kullanıcı mı, sağlayıcı mı? Aktarımı yapan uygulama mı, kullanıcının kendisi mi (kişisel faaliyet istisnası)?
2. NeoWell aktaran sayılırsa: günlük otomatik gönderim m.9/6 anlamında "arızi" olamaz. Ücretsiz katman sağlayıcılarıyla standart sözleşme imzalamak pratikte mümkün mü? Mümkün değilse otomatik gönderimi kaldırıp her gönderimi kullanıcı eylemine bağlamak riski düşürür mü?
3. Özel nitelikli sağlık verisi (m.6) için açık rıza metni yeterli mi? İlaç adı ve sağlık notu ayrı bir onay ister mi?
4. Play Data safety'de Koç "paylaşım" mı, "toplama" mı? Open Food Facts'e giden IP adresi beyan edilmeli mi?
5. 18 yaş altı politikası ne olmalı: kurulumda engellemek mi, yalnız Koç'u kapatmak mı?

Riskin yönü: kod tarafındaki en ucuz azaltma otomatik gönderimi kaldırmak. O zaman her gönderim kullanıcının dokunuşuyla olur, hem m.9 hem Play istisnası için durum iyileşir.

## Öncelik sıralı yol haritası
Sahip: **C** Claude yapar · **S** Semih yapar · **H** hukukçu · **D** hekim. Emek: S ≤ yarım gün, M ≈ 1 gün, L > 1 gün. ★ = Claude hemen yapabilir, karar gerekmez.

| Sıra | İş | Sahip | Emek | Model | Bağımlılık |
|---|---|---|---|---|---|
| **Play'i engelleyenler** |||||
| 1 | Hesap türü kararı (kişisel/kurumsal), Play Console hesabı ve D-U-N-S numarası (kurumsalsa) | S | S | – | – |
| 2 | Kişisel hesapsa 12 testçi bulunur, kapalı test erken başlar (14 gün) | S | 14+ gün | – | 1 |
| 3 | Politika alanlarını doldurmak, m.9 çerçevesi, yaş politikası | S+H | M | – | soru listesi |
| 4 | Otomatik Koç gönderimini kaldırmak ya da onay metnine eklemek, `CONSENT_V` artırmak | C | S | sonnet | 3 (yön), Koç sağlayıcı ajanının işi |
| 5 | İlk 106 satırdaki 61 işaretsiz satırı tarif ve USDA hesabıyla yeniden üretmek, ikizleri birleştirmek (#4, #15, #16) | C | L | sonnet | G13 (izin yolu seçilmezse) |
| 6 | Mağaza varlıkları: ekran görüntüleri emülatörden, öne çıkan grafik | C (görüntü) + S (onay) | M | sonnet | – |
| 7 | FGS videosu, sağlık beyanı, Data safety ve IARC formları | S | S | – | 1, 3 |
| **Kullanıcıya zarar** |||||
| 8 | Eski debug imzalı kullanıcılar: yedek al, kaldır, kur, geri yükle akışı ve kısa duyuru metni | C (metin) + S (telefon) | S | sonnet | – |
| 9 | Paylaş/kopyala yedeğinde parolayı zorunlu yapmak (karar: Semih) | C | S | sonnet | Semih kararı |
| 10 | 18 yaş altında kalori hedefi ve açık kalan modüller | D+S → C | S | sonnet | 3 |
| **Telefonda doğrulama** |||||
| 11 | Xiaomi'de gece ilaç alarmı ve bildirim, geri tuşu, Drive yedeği, imza geçişi (#5, #10, #11, #12) | S | M | – | 8 |
| 12 | 500 adım elle sayım ve bilinen bir mesafede yürüyüş (#13, #14) | S | S | – | – |
| **Kalite** |||||
| 13 | ★ Tahlilde `esc(q)` ek savunması | C | S | sonnet | – |
| 14 | ★ `dagitim.md` versionCode satırını düzeltmek | C | S | sonnet | – |
| 15 | ★ USDA anlam eşlemesi denetimi (yaklaşık 30 çift) ve `usda-karsilastir.py` çıktısının belgeye işlenmesi | C | S | sonnet | – |
| 16 | CSS'i `index.html` dışına almak, testleri uyarlamak | C | M | sonnet | başka ajanlar boşalınca |
| **Özellik** |||||
| 17 | ★ Tahlil değişim sütunu (#24) | C | S | sonnet | – |
| 18 | Lif, şeker ve sodyumu USDA satırlarına eklemek (#19) | C | M | sonnet | – |
| 19 | Kural tabanlı yazıyla kayıt (#31) | C | M | opus | Semih kararı |
| 20 | Health Connect (#23, #36) | C | L | opus | G1, Data safety güncellemesi |

**Semih'in karar vermesi gerekenler:** hesap türü (G3), TürKomp izni mi yoksa yeniden hesap mı (G13), otomatik Koç gönderimi kalsın mı, yedek parolası zorunlu olsun mu, 18 yaş altı politikası, hukukçu ve hekim seçimi (G7).
