# Adım sayar pazar araştırması (2026-10-01)

Kaynak: mağaza/forum/blog taramaları (Pacer destek ve yorumlar, Samsung Community, Xiaomi.eu forum, Android geliştirici belgesi, karşılaştırma blogları). Binlerce yorum tek tek taranmadı; örüntüler tekrar eden şikâyetlerdir.

## Rakipler
| Uygulama | Güçlü | Zayıf |
|---|---|---|
| Pacer | Ücretsiz katmanı geniş, sosyal yarışma, rotalar | Reklam artıyor, hedef değiştirme gibi şeyler Premium'a kilitli, veriye erişimi paywall'a bağlama şikâyeti, ~6 €/ay, bulutta veri |
| StepsApp | Sade, güzel arayüz, veri cihazda | Reklam, GPS ve ayrıntılı istatistik ~4 $/ay |
| Samsung Health | Ücretsiz, uyku/yemek/ilaç hatırlatma dahil | Saat + telefon çift sayım (%20-40 şişme), yalnız Samsung ekosistemi |
| Google Fit | Kalp puanı, entegrasyonlar | Kapatıldı, Google Health'e taşınıyor |
| Apple Fitness | Kaynak önceliği ile çift sayımı önler | Yalnız iOS |
| Gizlilik odaklı (PFA, F-Droid) | Reklamsız, çevrimdışı | Sade, az özellik |

## Kullanıcı şikâyetleri (sıklık sırasıyla)
1. **Arka planda sayım duruyor / gün kaçıyor.** Xiaomi/HyperOS gibi markalarda pil optimizasyonu ve "arka planda otomatik başlat" ayrı izin; ekran kilitliyken sayım durma, hedefin kaybolması, günün iki güne yazılması.
2. **Yanlış sayım.** Yavaş yürümede eksik, kol hareketi/sallanmada fazla; kaynaklar arası çift sayım (saat + telefon).
3. **Reklam ve paywall.** Tam ekran reklam, kendi verine erişimi kilitleme, temel ayarlar için abonelik.
4. **Pil.** GPS'i arka planda açık tutan uygulamalar günde %10 yer; doğru yöntem donanım adım sayacı (<%2).
5. **Gereksiz karmaşa.** Bir grup "sadece adım saysın, hedef/uyarı/kilo takibi olmasın" istiyor.

## Kullanıcı istekleri
- Yürüyüş başlat/durdur (tek yürüyüşün mesafe ve süresi, günlük sayım sürerken).
- Reklamsız ve çevrimdışı, verinin dışarı çıkmaması.
- Kaynak önceliği (saat varsa telefonu saymama).
- Boş durumda sensörün uykuya alınması, pil dostu.
- Ekran kilitliyken ve telefon yeniden başlayınca kesintisiz sayım.
- Haftalık/aylık rapor, seri, hedef (çoğu uygulamada Premium).

## NeoWell için çıkarımlar
Zaten avantajlı: reklamsız, çevrimdışı, donanım adım sayacı, yeniden başlatma ve geç alarm hataları giderildi, ayrı rapor ekranı, Xiaomi bildirim yardımı, adımlar haftalık PDF'te.

Eksik / yapılabilir (öncelik önerisi):
1. **Sayım durdu uyarısı:** gün içinde (örn. 12:00'den sonra) sensör verisi hiç ilerlemediyse "Xiaomi'de pil kısıtlaması sayımı durdurmuş olabilir" kartı + ayara kısayol. En sık şikâyete doğrudan çözüm.
2. **Yürüyüş başlat/durdur:** mesafe, süre, adım, kalori; günlük sayıma karışmadan. En çok istenen özellik.
3. **Kalibrasyon:** adım uzunluğu (boy/cinsiyetten başlangıç, 20 adımlık dene-ölç ile düzeltme) ve doğru kalori/mesafe.
4. **Çift sayım koruması:** Health Connect eklenirse (Mi Band varsa) tek kaynak seçimi.
5. **Rapor:** haftalık/aylık adım grafiği, en iyi gün, seri (Premium'a kilitlenmeden, ücretsiz).

Yapılmaması gerekenler: GPS'i sürekli açık tutmak, reklam, hesap/bulut zorunluluğu, kullanıcıyı abonelik ekranına yönlendirmek.

Açık soru: Semih'te Mi Band/saat var mı? Varsa Health Connect (madde 4) öne çıkar.

---
# Adım dışı özellikler (2026-10-01, ikinci tarama)

Kaynaklar: kalori/makro, antrenman ve sağlık uygulaması karşılaştırmaları, MyFitnessPal şikâyet derlemeleri. Doğruluk yüzdeleri sitelerin kendi testleridir, bağımsız doğrulanmadı.

## Yemek/kalori (MyFitnessPal, Cronometer, MacroFactor, Yazio, Lose It)
- Barkod ve büyük besin veritabanı temel. MyFitnessPal'in şikâyetleri: barkod okuyucunun paralı yapılması (negatif yorumların en çok geçen tek konusu), kitle kaynaklı hatalı veri, reklam, çökme.
- MacroFactor (~72 $/yıl, ücretsizi yok): kilo trendi ile gerçek harcamayı hesaplayıp hedefi haftalık güncelliyor; kullanıcıların ödeme sebebi bu. Cronometer: 80+ mikro besin, doğrulanmış veri. Yazio: aralıklı oruç zamanlayıcısı. Lose It: yeni başlayana sade arayüz.
- Ortak istekler: hızlı kayıt (son yenilenler, favoriler, öğün şablonu), doğru veri, reklamsız.

## Antrenman (Strong, Hevy, Fitbod, JEFIT)
- Ücretsiz katmanda bile: sınırsız kayıt, egzersiz kütüphanesi, otomatik dinlenme sayacı, önceki set değerini gösterme, 1RM, plaka ve ısınma hesaplayıcı, süperset/drop set.
- Hevy Trainer (Pro): rep aralığının üstüne çıkınca ertesi seans yük artışı öneriyor. Fitbod: toparlanmaya göre seansı kendisi kuruyor.

## Genel sağlık
- Su, uyku, ruh hali, semptom, ilaç zamanı, aralıklı oruç zamanlayıcısı, alışkanlık serisi, ana ekran widget'ı, Wear OS/Health Connect, yapay zekâ koç.

## NeoWell ile karşılaştırma
Var: barkod ve etiket OCR, Koç, kilo trendinden harcama tahmini, 1RM, su, tansiyon/şeker/tahlil/ilaç, PDF raporlar, reklamsız ve çevrimdışı.
Piyasada olup bende olmayan, kullanıcı değeri yüksek olanlar:
1. Uyku ve ruh hali kaydı (backlog'da).
2. Aralıklı oruç zamanlayıcısı (küçük iş, Yazio'nun öne çıkan özelliği).
3. Ana ekran widget'ı (su +250, adım, kalori kalan).
4. Antrenmanda otomatik dinlenme sayacı, plaka ve ısınma hesaplayıcı, bir sonraki seans için yük önerisi (varsa eksik olanlar kontrol edilecek).
5. Mikro besin ve lif/şeker/sodyum gösterimi (veri kaynağı Open Food Facts'te çoğu ürün için var).
6. Health Connect (saat/bant varsa).
