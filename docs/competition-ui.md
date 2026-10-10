# NeoWell arayüz ve tasarım denetimi (rakiplere göre)

Tarih: 2 Ekim 2026. Yöntem: `www/` yerel sunucudan headless Chrome 154 ile açıldı. Native eklentiler için sahte `window.Capacitor` kullanıldı. 30 günlük örnek veri yüklendi: kilo, yemek ve makro, su, adım, spor, salon antrenmanı, ilaç ve doz kaydı, tansiyon, şeker, tahlil, uyku, ruh hali, oruç, koç sohbeti. 360×780 ve 412×915 boyutlarında, açık ve koyu temada 107 ekran görüntüsü alındı. Ek çekimlerin (02-bos, 14b, 16–19, 33b/c, 40b) adında "light" yazsa da sistem teması nedeniyle koyu temada çekildiler. Ekranlar tek tek incelendi. Kontrast WCAG 2.1 formülüyle, dokunma hedefleri ise tarayıcıda ölçüldü.

**Sınırlar:** Windows'ta Segoe UI yazı tipi ve Windows emojisi kullanıldı, telefonda Roboto/Noto olacak. Bu yüzden satır kırılmaları biraz değişebilir. Barkod, OCR, adım sensörü ve bildirimler gerçek cihazda denenmedi. Adım sayısı (7.340) sahte değer. Tam sayfa görüntülerde alt menü sayfanın ortasında görünüyor, bu çekim yönteminden kaynaklanıyor, gerçek bir hata değil.

---

## a) Ekran ekran bulgular

Önem dereceleri: **K** kritik, **Y** yüksek, **O** orta, **D** düşük.

### Genel (tüm ekranlar)
| Önem | Bulgu | Neden önemli | Düzeltme |
|---|---|---|---|
| K | Koyu temada bildirimdeki "Geri al" düğmesinin kontrastı 1,98:1. Bildirim zemini açık renk (`--ink`), düğme rengi açık mavi (`--su`). | Silme ve ekleme işlemlerini geri almanın tek yolu bu düğme, koyu temada neredeyse görünmüyor. | Düğme rengini temaya göre ayarla: açık zeminde koyu mavi, örneğin `#14557d` (≥4,5:1). |
| Y | Açık temada küçük metinlerin kontrastı sınırda veya altında. Gri metin zemin üzerinde 4,37, pasif segment 4,08, açık temada "Geri al" 4,04, uyarı rengi 4,45. | 13–15 px metinde AA için 4,5:1 gerekir. İpuçları ve alt etiketler güneşte okunmuyor. | `--mut` rengini `#56666d` civarına koyulaştır, `--warn` rengini `#b03a24` yap. |
| Y | Alt menü ve hızlı kayıt düğmeleri ikon olarak emoji kullanıyor (💬🏠🏋️📈💊⚙️). İkonların `aria-hidden` özelliği yok. | Emoji her üreticide farklı çiziliyor (Samsung, MIUI, Noto). Etkin sekmede renklendirilemiyor. TalkBack her etiketten önce emojinin adını okuyor ("konuşma balonu Koç"). | Tek renkli SVG ikon seti kullan (Material Symbols tarzı), `aria-hidden="true"` ekle, etkin sekmede `--prim` rengini ver. |
| Y | Bazı silme düğmeleri 13×22 px: oruç geçmişi ✕, salon şablonu ✕, elle girilen adım ✕, yemek şablonu ✕. `.del` stili yalnız Bugün listesinde 44 px. | Yanlış dokunma riski yüksek ve hedef 44 px altında. | `.del` için genel bir 44×44 kuralı tanımla. |
| O | Seçili olmayan kenarlıklar ve grafik öğelerinin kontrastı 3:1 altında: kart kenarlığı 1,32, turuncu hedef çizgisi ve kalori halkası 2,93. | WCAG 1.4.11'e göre grafik öğeleri en az 3:1 olmalı. Hedef çizgisi zor seçiliyor. | Kalori turuncusunu `#b8691a` yap, giriş alanlarının kenarlığını `--mut` rengiyle çiz. |
| O | Tarihler her ekranda farklı biçimde: "28 Eyl", "Cmt 26", "26.09", "02.10 08:05", "22.09.2026", "1 Eki". | Tutarsız görünüyor ve gün ile ayın karışma riski var. | Tek bir kural koy: listelerde "28 Eyl", ayrıntıda "28 Eylül 2026". |
| O | Alt sayfalarda geri dönüş, tam genişlikte birincil renkli büyük bir düğmeyle yapılıyor ("‹ Bugün", "‹ Trend", "‹ Salon"). | Ekranın en güçlü görsel öğesi bir geri düğmesi oluyor, asıl eylemle (Ölçüm ekle) yarışıyor. | Başlığın soluna küçük bir "‹" ikonu koy. Android geri hareketi zaten var. |
| O | Hatalar bildirim balonu olarak gösteriliyor ("Kiloyu kg olarak yaz…") ve alt sayfadaki alanların üstüne biniyor. | Hata, alanın yanında görünmüyor ve kısa süre sonra kayboluyor. | Hatayı alanın altında, kırmızı metin ve `aria-invalid` ile göster. |
| D | Uygulama içinde tema seçici yok. `theme-color` hep açık renk (`#eef2f0`). | Koyu temada durum çubuğu açık kalıyor. | Ayarlar'a "Tema: Sistem / Açık / Koyu" seçeneği ekle, `theme-color` değerini temaya göre değiştir. |

### İlk açılış ve onboarding (`00`, `01`, `02-bos-*`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| Y | Onboarding yok. Yeni kullanıcı doğrudan Bugün ekranına düşüyor, ekranda boş halkalar ve "hedef yok" yazıyor. Oruç kartı ve 4 plan düğmesi hemen ilk ekranda. | Rakiplerin hepsi ilk açılışta hedef, boy, kilo ve aktivite seviyesini 4–6 adımda soruyor, kullanıcı hemen kişisel bir sayı görüyor. | 3 adımlı bir giriş akışı ekle (kilo ve hedef, boy ve yaş, hangi modüller kullanılacak). Oruç ve uyku kartlarını yalnız açıldığında göster. |
| Y | Menünün ilk sekmesi Koç. İlk açılışta bu sekme yalnız "API anahtarı gerekli" ve "Verilerin sağlayıcıya gönderilir" uyarılarını gösteriyor. | Teknik bir duvar güveni ve ilk izlenimi zayıflatıyor. "API anahtarı" ifadesi sıradan kullanıcıya bir şey anlatmıyor. | Anahtar yoksa Koç sekmesini sona taşı ya da tanıtım ekranı göster ("Koçu etkinleştir: 2 dakika"). Bu dilde "API" yazma. |
| O | Trend ekranı boşken 7 satırlık tamamen "–" dolu bir tablo gösteriliyor. | Boş tablo bilgi vermiyor, ekranı bozuk gibi gösteriyor. | Tek bir boş durum kartı göster: "İlk tartını gir, grafik 2. günde başlar" ve [Kilo ekle] düğmesi. |

### Bugün (`10-bugun`, `10-bugun-tam`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| Y | Hızlı kayıt satırı (Su, Kilo, Yemek, Spor, Not) 360 px ekranda yaklaşık 1.390 px aşağıda, yani ilk ekranın neredeyse iki katı aşağıda. Üstünde kilo kartı, halkalar, adım, ölçümler, ilaçlar, oruç, uyku ve ruh hali kartları var. | Uygulamanın asıl işi olan kayıt, kaydırmadan yapılamıyor. "Tek bakışta ne yapmalıyım" netliği kayboluyor. | Kayıt düğmelerini halkaların hemen altına al ya da sağ altta sabit bir "+" düğmesi koy. İlaç, oruç ve ölçüm kartlarını tek satırlık "Bugün yapılacaklar" listesine indir. |
| Y | Kilo kartı ilk ekranın yaklaşık %60'ını kaplıyor: 76 px rakam ve 4 satır istatistik. Koyu temada da parlak nane yeşili dolu bir blok. | Hiyerarşi kiloya kilitli. Kilo hedefi olmayan (ilaç, tansiyon, salon) kullanıcıya uymuyor. Koyu temada göz alıyor. | Kartı yarı yüksekliğe indir (rakam 48 px, tek satır özet). Koyu temada koyu kart ve renkli rakam kullan. |
| O | Halkalarda birim yok: "1,0", "1380", "159". Spor halkası haftalık, diğer ikisi günlük. | "159" ne demek, anlamak için halkanın altına bakmak gerekiyor. Haftalık ve günlük değerlerin karışması yanlış okumaya yol açıyor. | Birimi yaz ("1,0 L", "1380 kcal") ve spor halkasının etiketini "Bu hafta" yap. |
| O | Kalori halkası tüketileni gösteriyor, kalanı göstermiyor. | MFP, Yazio ve Samsung Health'in ana sayısı "kalan". Kullanıcı karar vermek için kalanı bilmek istiyor. | Ortaya "520 kaldı", altına "1380 / 1900" yaz. |
| O | Koç cümlesi gri ve küçük ("Mükemmel gün yok…"), eyleme bağlı değil. | Kişisel öneri en az fark edilen öğe olmuş. | Öneri bir eylem içeriyorsa düğmeyle göster ("Su geride → +250"). |
| O | Günlük liste öğüne göre gruplanmamış (kahvaltı, öğle, akşam). Su kayıtları tek tek satır olarak listeleniyor (4 × "Su 250 ml"). | Liste gereksiz uzuyor, öğün yapısı görünmüyor. | Su kayıtlarını tek satırda birleştir ("Su · 4 bardak · 1 L"). Yemekleri saat dilimine göre grupla. |
| D | "30 günlük seri" yazısı başlıkta gri ve her ekranda tekrar ediyor. | Motivasyon öğesi değerlendirilmiyor, yalnızca kalabalık yaratıyor. | Yalnızca Bugün ekranında, küçük bir rozetle göster. |

### Kayıt akışları (`11`–`19`)
Dokunma sayıları ölçüldü:

| Kayıt | Bugün ekranından | Not |
|---|---|---|
| Su | 1 dokunma (önce kaydırma gerekir). Koç ekranında 1 dokunma. | Geri alma bildirimi çıkıyor, iyi. |
| Kilo | 2 dokunma ve yazma | Son tartı alana önceden yazılmıyor. 5 kg'dan büyük farkta uyarı var, iyi. |
| Yemek (son yenenler) | 2 dokunma | Son yenene dokununca hemen ekleniyor. |
| Yemek (arama) | 2 dokunma, yazma, porsiyon seçimi ve 1 dokunma daha | Porsiyon ekranı iyi (kase/kepçe, makrolar). |

| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| Y | Yemek ekle sayfasında arama kutusu, 3 büyük düğmenin (Dünkünü tekrarla, Barkod, Etiket) altında kalıyor. Klavye açılınca son yenenler listesi de ekrandan çıkıyor. | En sık kullanılan yol arama ve en üstte olmalı. | Arama kutusunu başlığın altına koy. Barkod ve etiket düğmelerini arama kutusunun içine ikon olarak al, "Dünkünü tekrarla"yı küçük bir çipe dönüştür. |
| O | Kilo uyarısı ("−7,0 kg fark var…") gri ipucu metni olarak gösteriliyor. | Uyarı gibi görünmüyor, kullanıcı fark etmeden tekrar Kaydet'e basabilir. | Turuncu bir uyarı kutusu ve ikon kullan, düğmeyi "Yine de kaydet" olarak değiştir. |
| O | Kilo alanı boş açılıyor ve yalnızca "84,3" örneğini gösteriyor. | Rakipler son değeri önceden yazıyor ya da ± düğmesi sunuyor, bu daha hızlı. | Son kiloyu önceden yaz ve ±0,1 düğmeleri ekle. |
| D | Silindikten sonra "Geri al" düğmesi var, Bugün ve Tansiyon ekranlarında doğrulandı. | Güçlü yön. | Koru. Koyu temadaki kontrast sorunu çözülmeli (yukarıda). |

### Adım raporu (`20-adim`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| O | Çubuk grafiğin gün etiketleri tek harf: "C P P S Ç P C C…". Cuma ile Cumartesi ve Pazar ile Pazartesi aynı harfle gösteriliyor. | Hangi günün hangisi olduğu okunmuyor. | "Cu, Ct, Pz, Pt" kısaltmalarını ya da tarih numarasını kullan. |
| O | Adım halkası mavi (su rengi), Bugün ekranındaki adım çubuğu mor (spor rengi). | Renkler artık bir anlam taşımıyor. | Adıma kendi rengini ver ya da hep aynı rengi kullan. |
| D | Kaynakla ilgili açıklama iyi ve dürüst ("sapma %5-10"). | Güven veriyor. | Koru. |

### Salon, egzersiz kütüphanesi ve canlı antrenman (`30`–`33c`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| O | Kütüphanede 3 filtre çipi satırı var (kas, tür, ekipman), ilk egzersiz yaklaşık 520 px aşağıda başlıyor. Üç satırda da etiketsiz bir "Tümü" çipi var. | Hevy ve Strong'da liste ilk ekranda başlıyor, filtreler tek satırda ya da bir alt sayfada. | Filtreleri tek bir "Filtre" alt sayfasına topla. Ekranda yalnız arama ve kas grubu satırını bırak. |
| O | "Egzersiz ara" kutusu stilsiz: tarayıcının varsayılan kare kutusu. | Uygulamanın geri kalanıyla tutarsız, özensiz görünüyor. | `.in` sınıfını uygula. |
| O | Canlı antrenman başlığında "00:01 süre, 0 kg hacim" metni dar sütunda 3 satıra kırılıyor. Set alanlarının yer tutucusu "tek" yazıyor. | Okunması zor. "tek" kısaltması "tekrar" olarak anlaşılmıyor. | Süreyi büyük bir sayaç olarak göster, hacmi alta küçük yaz. Yer tutucuyu "tekrar" yap. |
| O | Boş bir setin onay düğmesine dokununca "Önce tekrar sayısını yaz" hatası çıkıyor. | Strong ve Hevy, önceki değeri onayda otomatik dolduruyor. | Set boşsa "Önceki" değeri kopyalayıp onayla. |
| D | Önceki set değerleri satır içinde gösteriliyor ve ilerleme önerisi var ("Öneri: 30 kg × 9…"). | Strong ve Hevy düzeyinde güçlü bir yön. | Koru. |
| D | Şablon kartının tamamına dokunmak antrenmanı hemen başlatıyor. | Yanlışlıkla başlatma oluyor (iptal için onay penceresi var). | Önce bir önizleme göster, ardından "Başlat" düğmesi. |

### Trend (`40-trend`, `40-trend-tam`, `40b`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| Y | "Bu hafta neden kilo vermedim?" düğmesi, kullanıcı haftada 0,6–0,8 kg verirken de gösteriliyor. Düğme yalnızca "hedef, trendin altında mı" koşuluna bakıyor. Aynı çip Koç ekranında da duruyor. | Kilo veren kullanıcıya "kilo vermedin" demek güveni ve motivasyonu bozar. | Düğmeyi yalnızca son 14 günde trend düz ya da yukarı giderken göster. |
| Y | Aynı ekranda iki farklı tahmin var: istatistikte "Kaba tahmin ~11 hafta", enerji kartında "Hedefe tahmini ~9 hafta". Ayrıca iki farklı hız var: "Haftalık ortalama farkı −0,6" ve "Kilo hızı −0,80 kg/hafta". | Çelişkili görünüyor, sağlık verisinde güveni zedeliyor. "Hedefe tahmini" ifadesi de dilbilgisi açısından bozuk. | Tek bir tahmin göster. İkincisi gerekiyorsa "1820 kcal ile ~9 hafta" diye koşulunu açıkça yaz. Hız için tek bir tanım kullan. |
| O | Grafiğin y ekseni hedefi (80 kg) içerecek şekilde genişliyor, 30 günlük veri grafiğin üst üçte birine sıkışıyor. Eksen yazıları yaklaşık 10 px. | Trendin eğimi okunmuyor. | Hedef uzaksa hedefi bir okla ve kenar etiketiyle göster, ekseni veriye göre ölçekle. Yazıları 12 px yap. |
| O | Grafik yalnız SVG, dokununca değer göstermiyor. | MacroFactor ve Samsung Health'te dokununca o günün değeri görünüyor. | Dokunma ve sürükleme ile değer balonu ekle. |
| O | "Son 7 gün" tablosu 6 sütun ve 360 px'te sıkışık ("Spor (dk)" başlığı kırılmaya yakın). | Küçük ekranda zor taranıyor. | Adım sütununu kaldır (zaten Adım raporunda var) ya da tabloyu yatay kaydırılabilir yap. |
| D | Haftalık spor ve PDF paylaşımı en altta. | Rapor özelliği gözden kaçıyor. | "Raporlar" bölümünde topla (bkz. d). |

### Tansiyon, Şeker, Tahlil (`41`–`43`, `19`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| O | Her ölçüm satırında büyük, dolu bir ✕ silme düğmesi var (14 satırda 14 tane). | Silme en belirgin eylem haline gelmiş. Geri alma olsa da gürültü yaratıyor. | Silmeyi kaydırma hareketine ya da satır ayrıntısına taşı. |
| O | Grafik açıklaması renk adına dayanıyor ("Yeşil: büyük tansiyon, mavi: küçük"), y ekseninde yalnız en büyük ve en küçük değer var. | Renk körü kullanıcı ayırt edemiyor, eşik çizgileri görünmüyor. | Çizgileri doğrudan etiketle ("Sistolik"), 130/80 eşik bandını göster. |
| D | Ev ortalaması büyük ve net, Doktor raporu (PDF) düğmesi var. | Güçlü yön, rakiplerin çoğunda bu yok. | Koru. |

### İlaç (`60-ilac`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| K | Saati geçen ve henüz işaretlenmemiş bir doz anında "kaçırılan" sayılıyor. Örnekte 09:00 dozu saat 09:11'de "kaçırılan 1" olarak görünüyor ve doktor için hazırlanan haftalık PDF'e de "1 kaçırılan" olarak yazılıyor. | Doktora yanlış uyum bilgisi gidiyor. Kullanıcı ilacı alıp henüz işaretlememiş olabilir. | Bir pay süresi (örneğin 2 saat ya da gün sonu) uygula. O zamana kadar dozu "bekliyor" olarak göster, PDF'te bugünü sayma ya da ayrı yaz. |
| O | "Aldım" ve "Atla" düğmeleri 36 px yüksekliğinde, "Tümü ›" düğmesi 36 px. | 44 px altında ve sık kullanılan bir eylem. | En az 44 px yap. |
| O | "İlaç ekle" düğmesindeki ➕ emojisi mor, birincil zemin üzerinde düşük kontrastlı. | Emoji renkleri temayla uyuşmuyor. | SVG "+" ikonu kullan, rengi `--prim-ink` olsun. |
| D | Uyarı metni açık ve dürüst ("doz önermez…"). | Güven veriyor. | Koru. |

### Koç (`50-koc`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| O | Koç mesajları balonsuz düz metin, kullanıcı mesajları balon içinde. Mesaj saati küçük gri metin. | Okunabilir, ama koçun kayıt kartları (onay ve ret) metinden yeterince ayrışmıyor olabilir. | Koç mesajlarına hafif bir kart zemini ver, kayıt kartlarını birincil kenarlıkla vurgula. |
| O | Mesaj kutusunun üstündeki hızlı kayıt çiplerinin kenarlığı `--mut` renginde ve kalın, sayfa üzerinde baskın. Metin kutusu 24 px yüksekliğinde ölçüldü (kapsayıcısı 50 px). | Görsel ağırlık sohbetten fazla. | Çipleri `--soft` dolgulu ve kenarlıksız yap. |

### Ayarlar (`70-ayarlar`, `70-ayarlar-tam`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| Y | Tek sayfa yaklaşık 5.000 px uzunlukta, 360 px ekranda yaklaşık 6,5 ekran: profil, hedefler, hareket algılama, tansiyon ve şeker eşikleri (8 alan), ilaç, 12 hatırlatma, yapay zekâ sağlayıcıları, veriler. | Ayar bulmak zor. Önemli olanlar (yedek) en dipte. Rakiplerde Ayarlar gruplanmış bir liste ve alt sayfalardan oluşuyor. | Ayarlar'ı alt sayfalı bir listeye dönüştür: Profil ve hedefler · Modüller · Hatırlatmalar · Koç (yapay zekâ) · Veri ve yedek · Hakkında. |
| O | Sayısal alanlar 42 px yüksekliğinde, anahtarlar 46×28 px. | 44 px altında. | Alanları 44 px, anahtarların dokunma alanını satır boyu yap. |
| O | "135/85 eşiğini doldur (ESC 2024, ev ölçümü eşiği)" gibi teknik etiketler kullanılıyor. | Uzman dili, sıradan kullanıcıya bir şey anlatmıyor. | "Önerilen sınırları kullan" yaz, kaynağı alta küçük not olarak ekle. |

### Haftalık rapor PDF (`80-haftalik-rapor`)
| Önem | Bulgu | Neden | Düzeltme |
|---|---|---|---|
| O | Yalnızca metin ve tablodan oluşuyor, grafik yok. Sayfanın yarısı boş. | Doktora göstermek için kilo ve tansiyon eğilimini gösteren küçük grafikler çok daha etkili olur. | Boş alana iki küçük grafik ekle (kilo trendi, tansiyon). |
| D | Uyarı metni ve dönem bilgisi net. | Güven veriyor. | Koru. |

---

## b) Rakiplere göre güçlü ve zayıf yönler

**Güçlü yönler**
- **Gizlilik ve çevrimdışı çalışma:** veri telefonda kalıyor, şifreli yedek var, hesap gerekmiyor. MFP, Yazio ve Samsung Health bulut ve hesap istiyor. Bu fark ekranda daha görünür olmalı.
- **Kapsam bir arada:** beslenme, salon, adım, ilaç, tansiyon, şeker, tahlil ve oruç tek uygulamada. Rakiplerde bunlar için 3–4 ayrı uygulama gerekiyor.
- **Türkçe besin veritabanı ve porsiyon birimleri** (kase, kepçe): MFP ve Cronometer'in Türkçe içeriği zayıf.
- **Trend kilo ve enerji tahmini:** MacroFactor'ün temel fikrine benziyor, Yazio ve MFP'de yok.
- **Salon akışı:** önceki set satır içinde, ilerleme önerisi, 324 egzersiz ve animasyon. Strong ve Hevy düzeyine yakın.
- **Klinik dürüstlük:** ilaç ve tansiyon uyarıları, doktor PDF'i, tahminlerin "kaba" olduğunun yazılması.
- **Silme işlemlerinde geri alma** ve 5 kg'dan büyük farkta tartı doğrulaması.

**Zayıf yönler**
- **İlk açılış:** onboarding yok, kişisel hedef hesabı otomatik değil. Rakiplerin hepsi ilk dakikada kişisel bir kalori hedefi veriyor.
- **Ana ekran yükü:** Samsung Health düzenlenebilir kutucuklar sunuyor, MFP ve Yazio "kalan kalori" ve öğün listesine odaklanıyor. NeoWell Bugün ekranında 9 kart üst üste diziliyor.
- **Yemek günlüğü öğüne göre gruplanmamış:** Yazio ve MFP'nin temel kalıbı kahvaltı/öğle/akşam/ara.
- **Görsel dil:** emoji ikonlar ve bazı stilsiz alanlar, Yazio ve Hevy'nin cilalı görünümünün gerisinde.
- **Etkileşimli grafik yok:** dokunarak değer okuma, aralık seçme, kıyaslama yok.
- **Ayarlar dağınık:** tek uzun sayfa, rakiplerde gruplanmış alt sayfalar var.
- **Koç bir API anahtarına bağlı:** sıradan kullanıcı için kurulum engeli. Rakiplerin yapay zekâ özellikleri hazır geliyor.

---

## c) Etkisi en yüksek 10 tasarım iyileştirmesi (sıralı)

| # | İyileştirme | Etki | Emek |
|---|---|---|---|
| 1 | Bugün'de kayıt düğmelerini ilk ekrana al (halkaların altına ya da sabit "+" düğmesi) | Çok yüksek | Düşük |
| 2 | İlaç dozuna pay süresi ekle, PDF'te bugünkü bekleyen dozları "kaçırılan" sayma | Yüksek (doğruluk) | Düşük |
| 3 | Koyu temada "Geri al" kontrastını düzelt, `--mut`, `--warn` ve turuncuyu AA düzeyine çek | Yüksek | Çok düşük |
| 4 | "Neden kilo vermedim" koşulunu düzelt, Trend'de tek tahmin ve tek hız tanımı kullan | Yüksek (güven) | Düşük |
| 5 | Bugün'ü sadeleştir: kilo kartını küçült, ilaç, oruç ve ölçümleri tek bir "Bugün yapılacaklar" listesinde birleştir | Yüksek | Orta |
| 6 | 3 adımlı onboarding ve otomatik kalori ve protein hedefi | Yüksek | Orta |
| 7 | Yemek sayfasında aramayı üste al, günlüğü öğüne göre grupla, su kayıtlarını tek satırda birleştir | Yüksek | Orta |
| 8 | Emoji yerine SVG ikon seti, `aria-hidden`, etkin sekmede renk | Orta-yüksek | Orta |
| 9 | Ayarlar'ı alt sayfalara böl, yedeği "Veri ve yedek" bölümünde öne çıkar | Orta | Orta |
| 10 | Tüm dokunma hedeflerini 44 px'e çıkar (`.del`, ilaç düğmeleri, alanlar), hataları alanın yanında göster | Orta | Düşük |

---

## d) Bilgi mimarisi önerisi

**Şu anki yapı:** Koç · Bugün · Salon · Trend · (İlaç) · Ayarlar. Bu 5 ya da 6 sekme demek. Adım raporu Bugün'ün altında, Tansiyon, Şeker ve Tahlil Trend'in altında, ilk açılış sekmesi koşula göre değişiyor.

**Önerilen yapı (5 sabit sekme):**
1. **Bugün** (her zaman ilk açılan sekme)
   - Üst kısım: kalan kalori ve su halkası, küçük kilo trendi (tek satır).
   - Sabit "+" düğmesi: Su (tek dokunuş) · Yemek · Kilo · Spor · Ölçüm · Not.
   - "Bugün yapılacaklar" listesi: ilaç dozları, ölçüm hatırlatması, oruç durumu. Her öğe tek satır ve tek dokunuşla işaretleniyor.
   - Öğüne göre gruplanmış günlük.
2. **Günlük ve Trend**: kilo grafiği (etkileşimli), Beslenme, Adım, Uyku ve ruh hali sekmeleri. Ölçümler (tansiyon, şeker) ve Tahlil burada alt başlık olarak yer alıyor.
3. **Salon**: şablonlar, canlı antrenman, kütüphane (filtreler alt sayfada), geçmiş.
4. **Koç**: anahtar yoksa tanıtım ekranı. Hızlı kayıt çipleri kalabilir.
5. **Daha fazla**: İlaçlar · Raporlar (haftalık PDF, doktor raporu, tahlil PDF'i tek yerde) · Oruç · Ayarlar (alt sayfalı) · Yedek · Hakkında.

**İlkeler:**
- Modüller (ilaç, tansiyon, şeker, oruç, adım, hareket) onboarding'de ya da Ayarlar'dan açılıyor. Kapalı bir modül Bugün ekranında hiç görünmüyor.
- Alt menüde koşula göre görünen bir sekme olmuyor (şu an İlaç sekmesi görünüp kayboluyor, bu menünün yerini değiştiriyor).
- Alt sayfalarda geri dönüş başlıktaki "‹" ikonuyla yapılıyor.

---

## e) Ekran görüntüleri

Klasör: `C:\Users\semih\AppData\Local\Temp\claude\D--PROJECT-koc\6ab8ec33-ef03-43ba-b9b4-053410a7fde5\scratchpad\shots\`

Dosya adı düzeni: `{genişlik}-{tema}-{no}-{ekran}.png`. Genişlik 360 ya da 412, tema `light` ya da `dark`. `-tam` ekiyle biten dosyalar tam sayfa görüntüsü.

| No | Ekran |
|---|---|
| 00, 01, 02-bos-* | İlk açılış (Bugün, Koç), boş Trend, Salon ve İlaç |
| 10, 11 | Bugün, su eklendikten sonraki geri alma bildirimi |
| 12–17 | Kilo ve yemek ekleme sayfaları, arama, porsiyon, spor, hata mesajı, kilo farkı uyarısı |
| 18, 19 | Silme ve geri alma (Bugün, Tansiyon) |
| 20 | Adım raporu |
| 30–33c | Salon, egzersiz kütüphanesi, egzersiz ayrıntısı, canlı antrenman (boş ve dolu) |
| 40–43 | Trend, enerji kartı, Tahlil, Tansiyon, Şeker |
| 50 | Koç |
| 60 | İlaçlar |
| 70 | Ayarlar |
| 80 | Haftalık rapor PDF sayfası |

Ölçüm dosyaları: `metrics-360.json` ve `metrics-412.json` (44 px altındaki hedefler ve taşma kontrolü). Bugün, Salon, Trend, Ayarlar, İlaç, Adım ve Koç ekranları 360 ve 412 px'te ölçüldü, hiçbirinde yatay taşma yok. Çekim betikleri: `shoot.js` ve `shoot2.js` (aynı klasörde).
