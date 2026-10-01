# Fikir listesi (yol haritası adayları)

Durum: bekliyor. Sıralama değer ve emek tahminidir, karar değildir.

## D:\PROJECT\NeowellAI vizyon belgesinden (1 Ekim 2026'da seçildi)
Hepsi yerel kalır, sunucu gerektirmez.
1. Uyku ve ruh hali kaydı.
2. İlaç hatırlatıcı: doz ve stok kaydı, mevcut yerel bildirim altyapısıyla.
3. Gizlilik paneli ve kategori bazlı silme (yalnızca su, yalnızca not vb.).
4. Seri ve uyum skoru (yerel, basit).
5. Doktora paylaşılacak PDF ve haftalık rapor. Sonra Play Store için release imzası ve gizlilik politikası.

## Yeni fikirler
| Fikir | Değer | Emek | Not |
|---|---|---|---|
| Tartı aykırı değer uyarısı | Yüksek | Çok düşük | Son tartıdan 5 kg'dan fazla farkta "emin misin?" sorar. Trend ve harcama hesabını yanlış girişten korur |
| Öğün şablonları ve "dünkünü tekrarla" | Yüksek | Düşük | "Kahvaltım" gibi bir kombinasyon tek dokunuşla eklenir. Çoğu insan aynı şeyleri yer |
| Hedefe ulaşınca hatırlatmayı sustur | Yüksek | Düşük | Su hedefi dolduysa o günkü su bildirimleri iptal edilir. 30 günlük alarm düzeni buna uygun (id = hatırlatma*100 + gün) |
| Bildirimden tek dokunuşla kayıt | Yüksek | Orta | Bildirimdeki "+250 ml" düğmesi uygulamayı açmadan su ekler |
| Fotoğraftan yemek tahmini | Çok yüksek | Orta | Koç'a tabak fotoğrafı gönderilir, görsel modelle tahmin gelir, "Listeme ekle" kartı çıkar. Tahmin olduğu açıkça yazılır, veri paylaşım onayı gerekir |
| Health Connect'ten adım, uyku ve kilo okuma | Yüksek | Orta/yüksek | Elle girişi azaltır, harcama tahminini iyileştirir. Eklentinin Capacitor 6 uyumu önce kontrol edilmeli |
| Otomatik Drive yedeği | Orta | Orta | Parolalı yedeğin düzenli olarak Drive'a gitmesi. Telefon kaybında veri kurtarır |
| Haftalık menü ve alışveriş listesi | Orta | Orta | Koç, "Benim besinlerim" ve hedef kaloriye göre menü önerir |
| Bel çevresi ve ölçü takibi | Orta | Düşük | Kilo sabitken ilerlemeyi gösterir |
| Aralıklı oruç zamanlayıcı | Düşük/orta | Düşük | Yemek penceresi ve geri sayım. Yeme bozukluğu riski nedeniyle dikkatli ve isteğe bağlı olmalı |

## Seçim notları
- Öncelik: aykırı değer uyarısı, öğün şablonları, hedefte sustur. Üçü de küçük ve günlük kullanımı doğrudan rahatlatır.
- Fotoğraftan tahmin en büyük "vay" etkisi olan özellik, ama doğruluğu sınırlı. Önce uyarı ve porsiyon düzenleme arayüzü tasarlanmalı.
- Sunucu gerektiren her şey (hesap, aile, bulut senkron) şimdilik dışarıda: uygulamanın gizlilik vaadi "veri yalnızca telefonda".

## Eski NeoWell projelerinden alınacak iyi özellikler (1 Ekim 2026 incelemesi)
Eski projeler çalışan ürün değil, ama şu fikirler `koc` için uygun ve yerel kalır.
- **Besin etiketi OCR:** Barkodu olmayan ya da veritabanında bulunmayan ürünün etiketini fotoğrafla, besin değerleri otomatik dolsun (ML Kit metin tanıma). Barkodun "bulunamadı" boşluğunu kapatır.
- **Adet döngüsü takibi:** Yerel, gizli, bildirimle birlikte.
- **Tansiyon ve glukoz günlüğü:** Yalnızca kayıt ve grafik, tanı ya da uyarı yok (tıbbi cihaz sınıflaması riskinden kaçınmak için).
- **Seri rozetleri ve sağlık skoru:** Basit, yerel, abartısız.
- **Kriz kaynakları ve yapay zekâ uyarı metni şablonları:** Koç'un güvenlik kartlarını güçlendirmek için eski projelerdeki hukuki metinlerden uyarlanabilir (`D:\proje\NeoWellAI\docs\legal`).
- **Hukuki not:** Sağlık verisi özel nitelikli kişisel veridir. Uygulama başkalarına dağıtılacaksa KVKK aydınlatma ve açık rıza metni şart.

## Yapıldı
- Aykırı tartı uyarısı, "Dünkünü tekrarla", su hedefi dolunca günün su bildirimlerini susturma.
- Barkod okutma (Open Food Facts).
- Adım sayar (telefonun adım sensörü, hesap gerektirmez): geç alarm/açılışta gün atfı düzeltildi, Adım ayrıntı ekranı (7 gün grafiği).

## Karar
- Health Connect telefon adımını daha doğru yapmaz (aynı sensör), yalnızca eksiksiz yapar. Mi Band/saat kullanımı netleşince ele alınacak.
