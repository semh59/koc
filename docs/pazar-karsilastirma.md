# Piyasa karşılaştırması (2026-10-07)

Her bölümde kalite olarak en iyi ve en çok tercih edilen uygulama NeoWell ile karşılaştırılır. Ayrıntı, kaynak ve tablolar:
- [Hareket, spor, su, kilo](pazar/a-hareket-spor.md)
- [Yemek, besin, tarif, oruç](pazar/b-yemek-besin.md)
- [İlaç, tansiyon, tahlil, döngü, uyku](pazar/c-saglik.md)
- [Koç, gizlilik, entegrasyon, arayüz, fiyat, Türkiye](pazar/d-koc-gizlilik-arayuz.md)

**Kaynak sınırı:** Google Play, chrome-stats ve AppBrain sayfaları okunamadı. İndirme sayıları ikincil kaynaklardan; doğrulanamayanlar dosyalarda işaretli. Kalite bulgularının bir kısmı rakiplerin kendi blog yazılarına dayanır. "Var" ifadesi kodda var demektir, telefonda denendi demek değildir.

## Öncelikli boşluklar
| Öncelik | İş | Boyut | Not |
|---|---|---|---|
| Yüksek | KVKK: Koç yurt dışı aktarımında açık rıza dayanağı tekrarlayan kullanımda yetmeyebilir | S | Hukukçuya sorulacak |
| Yüksek | Health Connect (adım, kilo, tansiyon, uyku) | L | Karar bekliyor; Google Fit kapanıyor |
| Yüksek | Barkod ve oruç telefonda gerçek test | S | |
| Orta | Anahtarsız yerel kurallı menü | M | Yapıldı (www/menulocal.js): Koç tab'ında "Menü oluştur (cihazda)"; besin veritabanındaki hazır öğünlerden, gün ±%7 kcal, protein aralığı, aynı yemek haftada en çok 2, fren/bakım düzeyi Koç menüsüyle aynı, kısıt notu (fıstık, süt, yumurta, gluten, balık, vejetaryen); hiçbir şey gönderilmez |
| Orta | Kilo trendine göre otomatik hedef | M | Yapıldı (www/goallib.js, Trend ekranı kartı): en az 14 gün/3 tartı, tam kayıtlı günler, haftalık en çok ±250 kcal ÖNERİ; onaylamadan uygulanmaz, "Şimdi değil" 7 gün susturur, fren/18 yaş/taban/tavan korunur |
| Orta | TalkBack ve büyük yazı testi | M | Kod tarafı yapıldı: axe (WCAG 2.1 AA, açık/koyu), 44 px hedef, %200 yazı ve 320 px taşma e2e'de yeşil; menü büyük yazıda uzuyor. Gerçek cihaz testi `yapilacaklar.md`'de |
| Orta | Ayrı kardiyo kaydı, ilerleme fotoğrafı | M | Yapıldı. Kardiyo (www/cardiolib.js, cardioui.js, Trend kartı): koşu/yürüyüş/bisiklet/yüzme/eliptik, süre, km, tempo, MET kcal, not, geçmiş, haftalık özet; sıradan spor kaydıdır, çift sayım yok. Fotoğraf (www/photoui.js): IndexedDB, en çok 24, 900 px JPEG, karşılaştırma, silme onaylı, yedeğe/Koç'a girmez, Android ekran görüntüsü kilidi |
| Orta | Uyku ve ruh hali korelasyonu | M | Yapıldı (Trend > Bağlantılar): uyku/adım ↔ ruh hali, kalori ↔ kilo trendi; en az 14 çift gün, skor/teşhis iddiası yok, Koç'a gitmez |
| Düşük | İçecek türü, mmol/L, lb birimi | S | Yapıldı. Ayarlar > Profil: kg/lb, mg/dL / mmol/L (depolama kg ve mg/dL, Koç değişmez); su türü etiketi (hepsi su hedefine sayılır). Tahlil değerleri laboratuvarın yazdığı birimde kalır |

## Bilerek yapılmayanlar
Fotoğraftan kalori (iptal edildi), oruç evre iddiaları (tıbbi iddia riski), depresyon/uyku skoru, sosyal özellikler, Wear OS.

**Çok dil (şimdilik yapılmıyor):** Metinler tek yerde toplanmamış; Türkçe metin `www/*.js` ve `index.html` şablonlarının içine dağınık gömülü. İngilizce için önce metinlerin bir sözlüğe çıkarılması (M-L iş) ve tüm testlerin buna uyarlanması gerekir.
