# Dış değerlendirme: 36 maddenin doğrulaması (6 Ekim 2026)

Kod durumu `b247735`. Her madde repo, git geçmişi, CI ve resmi kaynakla kontrol edildi, sayılar bugün yeniden ölçüldü. Ölçüm betikleri depoya eklenmedi.

**Sonuç:** 20 DOĞRU, 5 KISMEN, 3 ESKİ (yalnız sayı değişmiş), 3 YANLIŞ, 1 DOĞRULANAMADI. G bölümündeki 4 düzeltmeden 2'si kararlarımızı etkiliyor (#34, #36).

Ciddiyet: **P** Play'i engeller · **Z** kullanıcıya zarar · **K** kalite · **k** bilgi.

| # | Durum | Kanıt | C | Aksiyon |
|---|---|---|---|---|
| 1 | DOĞRU | `gizlilik-politikasi.md` Türkçe bölümünde 11 boş alan (5-11, 33, 49, 57, 60, 69) | P | Semih ve hukukçu doldurur |
| 2 | DOĞRU | §4:32 Koç aktarımını yalnız açık rızaya dayandırıyor. m.9 (7499 s.K., 1.6.2024) sırası: önce yeterlilik kararı, sonra uygun güvence (standart sözleşme + 5 iş günü içinde Kurul'a bildirim, BCR, taahhütname). Açık rıza yalnız arızi aktarımda geçerli. Günlük otomatik gönderimin (#3) arızi sayılması zor görünüyor. | P | Hukukçu soruları aşağıda |
| 3 | DOĞRU | Giden alanlar `coachlib.js` `contextText`: profil, sağlık notu, 14 gün özeti, notlar, ilaç adı/doz/uyum. Liste onay metniyle aynı (`coach.js:478`, testle sınanıyor). **Açık nokta:** `cAuto` (`coach.js:401`) uygulama her açıldığında (`index.html:1354`, `1363`) günde bir plan, haftada bir rapor gönderiyor. Politika §5 bunu yazıyor, uygulama içi onay metni yazmıyor. | P | Otomatik gönderimi kaldır ya da onay metnine ekleyip `CONSENT_V`'yi artır |
| 4 | DOĞRU | İlk 106 satır: 45 işaretli (USDA'yla yeniden karşılaştırıldı, 45/45 tutuyor), 61 işaretsiz. İlk sürümün başlığı "TürKomp ve USDA'dan derlenmiş" diyordu (`e5226d8`); `f06e0fa` yalnız bu cümleyi sildi, değerler aynı kaldı. 61 satırın yaklaşık 28'inin doğrudan USDA karşılığı var (kola, kuru üzüm, ekmek, peynir vb.), kalanı tarif hesabı istiyor. Tarif ikizi olan yalnız 3 satır. | P (lisans) | Yeniden hesapla ya da TürKomp'tan izin iste (G13) |
| 5 | DOĞRU | Eski APK'lar herkesin bildiği debug anahtarıyla imzalı (`dagitim.md:11`). Yedekle geri yükleme denenmedi. | Z | Telefonda yedek, kaldır, kur, geri yükle |
| 6 | DOĞRU | 13.11.2023 sonrası açılan kişisel hesapta 12 testçi ve kesintisiz 14 gün ([14151465](https://support.google.com/googleplay/android-developer/answer/14151465)). Ek risk: "Medical" sağlık uygulamaları kurumsal hesap istiyor ([13634885](https://support.google.com/googleplay/android-developer/answer/13634885)). | P | G3 kararı, testçileri erken bul |
| 7 | KISMEN | FGS beyan metni ve video adımları hazır (`play-izin-beyanlari.md:28-31`), sağlık beyanı taslağı da var (`play-data-safety.md`). Video ve Play hesabı yok. | P | Semih videoyu çeker |
| 8 | DOĞRU | 4 açık karar (`play-data-safety.md` "karar vermesi gerekenler"): Koç paylaşım mı, m.6/m.9 metni, Open Food Facts IP adresi, tıbbi beyan | P | Hukukçu ve hekim paketine |
| 9 | ESKİ | Bugün: 79 `[ ]`, 40 `[~]`, 2 `[x]`, 1 iptal | k | – |
| 10 | KISMEN | Telefonda geri tuşu Capacitor `backButton`'a bağlı (`index.html:1375`); `popstate` yalnız tarayıcı yedeği. Smoke API 36 emülatörde kurma ve açmayı kanıtlıyor (koşu 128). | K | Telefonda dene |
| 11 | DOĞRU | Smoke kanıtlıyor: 100'den fazla alarm kuruluyor, bildirim düğmeleri çalışıyor, süreç ölünce kayıt yinelenmiyor (`smoke.sh`). Kanıtlamıyor: alarmın zamanında çalması, Doze ve MIUI. | Z | Xiaomi'de gece testi |
| 12 | DOĞRU | `[~]`; şifreleme birim testli, gerçek Drive denenmedi | Z | Telefonda dene |
| 13 | DOĞRU | Ölçüm yok (A3) | K | Bilinen mesafeyi yürü |
| 14 | DOĞRULANAMADI | 3993/4150 repoda yok. Kontrollü test yapılmadığı doğru. | K | 500 adımı elle say |
| 15 | ESKİ | 818 kayıttan 394'ünde aralık var; 186'sında %30'dan, 100'ünde %80'den geniş. Asıl sorun aynı yemeğin iki satırı: Lahmacun 162-302 ve 225-236. | K | #4 ile birleştir |
| 16 | YANLIŞ | Kaynak bulundu: 132, ilk elle girilen satırdan (`e5226d8`, `mevcut.txt:5`). Tarif hesabı 110 (`tarif.txt:185`). | K | #4 ile kalkar |
| 17 | ESKİ | 75 vekil satırı (`vekil.txt` 70 + `vekil-ogun.txt` 5) | k | – |
| 18 | YANLIŞ | Kaynak dosyalar indirildi: USDA 329/329 kayıt birebir; CIQUAL 2025 + CoFID 2021 `harici.py` ile yeniden üretildi, 12/12 aynı; `uret.js --kontrol` geçti | k | Yaklaşık 30 ad ↔ açıklama eşlemesine elle bak |
| 19 | DOĞRU | `FOODS` = ad, kcal, P, K, Y. Lif, şeker, sodyum yalnız etiket ve barkodda (`index.html:422`). | K | USDA'dan eklenebilir |
| 20 | YANLIŞ | 43 dosyanın hepsi testte çalışıyor. Sayılan 11 dosyada fonksiyon kapsamı %86-100, bayt kapsamı yaklaşık %72-100. JSDOM betikleri gömdüğü için kapsama aracı dosya adını göremiyordu. | k | – |
| 21 | DOĞRU | 130 KB: 32 KB CSS + tek betikte 93 KB; 9 test bu dosyayı okuyor | K | CSS ayrılabilir (M) |
| 22 | KISMEN | 1804 şablon yeri, 143'ünde `esc()`. Tüm kullanıcı alanlarına `"'><b>` yükü kondu, 13 sekme ve sekme başına 80'e kadar düğme tarandı: **0 enjeksiyon**. Koç metni kaçışlı. Tahlildeki `q` alanı kaçışsız ama `cleanLabs` onu yalnız `<`/`>` bırakıyor, ulaşılamıyor. | k | Ek savunma: `esc(q)` |
| 23 | DOĞRU | Planda (D-Adım1-2, G1) | özellik | G1 |
| 24 | KISMEN | Tarihli sonuç listesi var (`labui.js`), değişim sütunu yok | özellik | Sütun ekle (S) |
| 25-28 | DOĞRU | Plan kütüphanesi, ilerleme fotoğrafı, iOS ve çok dil yok; minSdk 24; fotoğraf, ses ve topluluk bilinçli kararla yok (`yol-haritasi.md` F) | özellik | Karar |
| 29 | DOĞRU | 30.9.2026 yalnız BR/ID/SG/TH, 2027'de dünya geneli. 20 cihazlık sınırlı hesap ve ileri kurulum akışı var ([kaynak](https://developer.android.com/developer-verification)). | P (2027) | Play yolu doğrulamayı zaten kapsıyor |
| 30 | DOĞRU | Sağlayıcı akışı başka ajanda yeniden tasarlanıyor (`a9df691`) | ürün | Not alındı |
| 31 | KISMEN | Repoda yerel model izi yok. 388 kcal doğru (301 kcal × 129 g). Kural tabanlı yazıyla kayıt yok. | ürün | Karar |
| 32 | DOĞRU | Pazar verisi yok | ürün | – |
| 33, 35 | Etkisiz | Belgelerimizde bu iddialar yok | – | – |
| 34 | **Etkiliyor** | Kullanıcı eylemi istisnası var ([10787469](https://support.google.com/googleplay/android-developer/answer/10787469)), ama `cAuto` eylemsiz gönderiyor, istisna kapsamıyor. "Paylaşılıyor: Evet" kalmalı. | P | – |
| 36 | **Etkiliyor** | Health Connect verisi Koç'a giderse Data safety, onay metni, Health Connect izin beyanı ve politika kontrolü gerekir | P (gelecek) | D-Adım1 notu |

**Kaçırılanlar:**
- Kurulum 10-17 yaşı kabul ediyor (`index.html:418`), ama hedef kitle 18+ yazıyor (P/Z).
- Debug imzalı eski kurulumlara herkes sahte "güncelleme" kurdurabilir (Z).
- Paylaş/kopyala yedeği parolasız çıkabiliyor, yani sağlık verisi düz metin (Z).
- Mağaza varlıkları yok: öne çıkan grafik, ekran görüntüleri, IARC ve hedef kitle anketleri. Simge yalnız 192 px, mağaza 512 px istiyor (P).
- Kurumsal hesap riski (#6).
- `dagitim.md:43` "versionCode 1" diyor ama CI çalışma numarasını kullanıyor (k).

**Zaten çözülmüş:** 16 KB hizası ve API 36 CI'da denetleniyor; otomatik yedek kapalı; tam alarm, arka plan konumu ve fener izinleri kaldırıldı; depolama izni yok; hesap olmadığı için silme şartı yok; Xiaomi çözümü kodda (telefon testi bekliyor).

**Hukukçuya sorular** (hukuki tavsiye değildir):
1. Kullanıcı kendi anahtarıyla sağlayıcıya bağlanıyor. Veri sorumlusu ve aktaran kim?
2. Otomatik gönderim arızi sayılabilir mi? Ücretsiz katman sağlayıcılarıyla standart sözleşme pratikte mümkün mü?
3. Sağlık verisi için m.6 kapsamında ayrı rıza gerekir mi?
4. Play Data safety'de Koç "paylaşım" mı? Open Food Facts'e giden IP adresi beyan edilmeli mi?
5. 18 yaş altına ne yapılmalı?

Risk yönü: otomatik gönderim kaldırılırsa hem m.9 hem Play açısından durum iyileşir.

## Yol haritası (öncelik sırasıyla)
Sahip: C = Claude, S = Semih, H = hukukçu, D = hekim. Emek: S ≤ yarım gün, M ≈ 1 gün, L > 1 gün. ★ = Claude hemen yapabilir, karar gerekmez.

| # | İş | Sahip | Emek | Model | Bağımlılık |
|---|---|---|---|---|---|
| 1 | Hesap türü, Play Console, kurumsalsa D-U-N-S | S | S | – | – |
| 2 | 12 testçi, 14 gün kapalı test | S | 14 gün | – | 1 |
| 3 | Politika alanları, m.9 çerçevesi, yaş politikası | S+H | M | – | sorular |
| 4 | Otomatik Koç gönderimini kaldır ya da onay metnine ekle, `CONSENT_V` artır | C | S | sonnet | 3, Koç ajanı |
| 5 | 61 işaretsiz satır: yaklaşık 28'ine USDA karşılığı, kalanına tarif hesabı; ikizleri birleştir | C | M | sonnet | G13 |
| 6 | Mağaza görselleri (512 px simge, grafik, ekran görüntüleri) | C+S | M | sonnet | – |
| 7 | FGS videosu, sağlık, Data safety ve IARC formları | S | S | – | 1, 3 |
| 8 | Debug imzasından geçiş: duyuru metni ve telefon denemesi | C+S | S | sonnet | – |
| 9 | Yedek parolası zorunlu | C | S | sonnet | Semih kararı |
| 10 | 18 yaş altı kuralı | D+S→C | S | sonnet | 3 |
| 11 | Telefon testleri: Xiaomi alarmı, geri tuşu, Drive, imza geçişi, adım ve GPS | S | M | – | 8 |
| 12 | ★ `esc(q)`, `dagitim.md` versionCode düzeltmesi, USDA eşleme denetimi | C | S | sonnet | – |
| 13 | ★ Tahlil değişim sütunu | C | S | sonnet | – |
| 14 | CSS'i ayırmak | C | M | sonnet | diğer ajanlar bitince |
| 15 | Lif, şeker, sodyum; yazıyla kayıt; Health Connect | C | M-L | opus | karar, G1 |

**Semih'in kararları:** hesap türü (G3), TürKomp izni mi yeniden hesap mı (G13), otomatik Koç gönderimi, yedek parolası, 18 yaş altı, hukukçu ve hekim seçimi (G7).
