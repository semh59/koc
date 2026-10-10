# Besin verisi araştırması (1 Ekim 2026)

## Ölçüm: mevcut listemiz USDA ile karşılaştırıldı
USDA FoodData Central SR Legacy (CC0, kamu malı) veri setiyle 60 eşleşebilen besin karşılaştırıldı.
- Tek malzemeli besinlerde (meyve, sebze, yumurta, süt, kuruyemiş, yağ, bal) sapma yok denecek kadar az (medyan %0,3).
- 10 besinde %15'ten fazla sapma vardı. Üç gerçek hata düzeltildi: ton balığı (113 → 86 kcal, protein 26 → 19,4 g), yeşil salata (19 → 15), haşlanmış mısır (111 → 96).
- Kalan sapmalar tarif farkından: patates kızartması (restoran 312 / fırın 158), bulgur pilavı (yağlı), kuru fasulye yemeği (sulu), lor (Türk lor peyniri yağsız), zeytin (salamura ve yağlı), humus.
- 45 besin USDA ile uyumlu bulundu ve "Kaynak: USDA" etiketi aldı. Kalan ~65'in büyük kısmı Türk yemekleri (menemen, çorbalar, börek, lahmacun, döner, köfte, mantı, baklava…) ve bunların USDA karşılığı yok. Bu değerler tahmindir, tarife göre ±%20-40 değişir.

## Kaynaklar
| Kaynak | Kapsam | Lisans / erişim | Sonuç |
|---|---|---|---|
| TürKomp (TAGEM, turkomp.gov.tr) | ~645 besin, 100 bileşen, Türk analizleri | Web ve mobil uygulama ücretsiz. İndirme, API ve lisans metni bulunamadı. Site otomatik erişimde yönlendirme döngüsüne giriyor. | Toptan kopyalamak için izin gerekir. Yapay zekâ tahmini için gerekmez |
| USDA FoodData Central | Binlerce temel besin | CC0, toplu indirme var | Temel malzemeler için güvenilir. Türk yemeği yok |
| Open Food Facts | 11.464 Türkiye etiketli ürün. Örnekte kcal'i olan oran: Ülker %84, Eti %77, Knorr %56 | ODbL (kaynak göster, türev veritabanı aynı lisansla paylaşılır). Anahtarsız API | Barkodlu paketli ürünler için uygun. Kapsam eksik, yedek yol şart |
| `@capacitor-mlkit/barcode-scanning` 6.2 | Barkod okuma | Capacitor 6 ile uyumlu (peer ^6) | Kullanılabilir |

## Öneri sırası
1. Kaynak etiketleri (yapıldı): her besinde "USDA" ya da "tahmini" yazıyor.
2. Barkod okut, Open Food Facts'ten bul, bulunamazsa etiketten elle girip "Benim besinim"e kaydet. Arayüzde Open Food Facts kaynak gösterimi şart.
3. Listede olmayan yemekler için yapay zekâ tahmini (yapıldı: aramada "Koç'a sor"). TürKomp verisini toptan kopyalamak gerekirse Tarım Bakanlığı'ndan izin gerekir, ama zorunlu değil.
4. Yemek türü besinlerde tek sayı yerine aralık göstermek (ör. 180-260 kcal).
