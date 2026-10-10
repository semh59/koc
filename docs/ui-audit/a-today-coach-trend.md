# Tasarım denetimi A: Bugün, Koç, Trend
Görüntüler: scratchpad `ab/` (360 ve 412, açık/koyu), `ab2/` (kaydırma şeritleri), `ab3/` (%200 yazı). Ad: `ekran-durum-genişlik-tema-bölüm.png`. %200, tüm yazıyı 2 ile çarpan yaklaşım (textZoom benzeri). Toast'ın görüntülerde kalması sahte saat kaynaklı, ürün hatası değil.
Biçim: no. ekran | sorun | kanıt | öneri | öncelik (Y/O/D)
1. Bugün | Üç halka eşit değil (Kalori 100 px, Su/Spor 72 px), başlık satırları farklı yükseklikte | bugun-dolu-360-light-s0 (ab: -ust) | halkaları tek boyut yap, başlık+alt satırı `align-items:start` ile aynı çizgiye | O
2. Bugün | Birincil eylem belirsiz: 5 eşit hızlı düğme, "+250" mavi çerçeveli (seçili gibi) | bugun-bos-360-light-ust | "Yemek" dolgu marka rengi, diğerleri nötr; +250 çerçevesini kaldır | Y
3. Bugün | "Daha fazla" sağa yaslı yetim hap | bugun-dolu-360-light-ust | halka kartının altına metin düğmesi ya da `navRow`; ayrı hap kalksın | O
4. Bugün | Yapılacaklar satırında saat ve ad aynı akışta, "09:00 D / vitamini" ortadan bölünüyor | bugun-dolu-360-light-ust, -orta | iki sütun: saat `min-width:48px`, ad ayrı blok `overflow-wrap:anywhere`; "Gecikti" `.tag` | Y
5. Bugün | Yapılacaklar kartı ilk ekranı dolduruyor, günlüğü 1,5 ekran aşağı itiyor; ilaç, oruç, tansiyon, yedek tek listede | bugun-dolu-360-light-orta | ilk 3 öğe + "Tümü (5)"; Yedekle/Tansiyon kart dışına | O
6. Bugün | Beyaz kart yığını (Kilo, motivasyon, yorum, gün gezgini, günlük), hiyerarşi yok | bugun-dolu-360-light-orta | motivasyon kartsız ikincil metin; Kilo tek satır; gün gezgini başlığa | O
7. Bugün | Boş durum: soluk devre dışı "Koç'tan yorum iste", açıklaması 80 px aşağıda sol hizalı | bugun-bos-360-light-ust | devre dışı düğme yerine "Veri paylaşımını aç" eylemi, açıklama hemen altında | O
8. Bugün | Günlükte her satırda ×, "Su" satırında › (tutarsız); silme hedefi başparmak yolunda | bugun-dolu-360-light-alt | silme uzun basma/düzenleme sayfasında; satırda tek › | O
9. Bugün | İkonlar karışık renkli (turuncu, yeşil, mor), sistem "tek renk çizgi" diyor | bugun-bos-360-light-ust | ikon `--ink`, renk yalnız halkada | D
10. Bugün %200 | "570" halkayı taşıyor, "kcal kaldı" çizgiye biniyor; hızlı düğme yazıları kenara değiyor; alt menü "Bugü/n"; ilaç satırı harf harf dikey sütun | bugun-dolu-360-light-y200-s0, -s2 (ab3) | halka içi `font-size:min(1em,22px)`, hızlı satır `flex-wrap`; nav etiketi `white-space:nowrap`+11 px; satır `flex-wrap`, ad `flex:1 1 100%` | Y
11. Koç | Boş durum = ≈20 satır rıza duvarı; yazı alanı ve çipler altta etkin görünüyor | koc-bos-360-light-ust | 3 maddelik özet + katlanır ayrıntı; "Kabul ediyorum" ilk ekranda birincil; rıza yokken çip ve yazı alanı gizli | Y
12. Koç | "Yeni sohbet" çipi yapışkan; içerik altından kesik şerit (y112) çiziyor | koc-dolu-360-light-orta (ab), -s1 (ab2) | üst çubukta sağda ikon düğmesi (Geçmiş ile), `position:sticky` kalksın | O
13. Koç | Kart içinde kart: balon içinde ikinci yüzey (kayıt, program, menü) | koc-dolu-360-light-ust | kart balonsuz tam genişlik tek yüzey, balonda yalnız metin | O
14. Koç | Kayıt kartında kcal alanı ayrı satırda sağa itilmiş; yuvarlak gri "×" başka yerde yok | koc-dolu-360-light-ust | ad solda, `~230 kcal` + × aynı satırda; tek silme biçimi | O
15. Koç | Haftalık menü 7 gün açık ≈2500 px, her günde aynı iki düğme (7 kez) | koc-dolu-360-light-orta, -alt | günler `<details>`, yalnız bugün açık; eylemler başlıkta tek menü | Y
16. Koç | Program kartında birincil eylem en altta; egzersiz adları karışık dil ("Good morning", "Düz bacak deadlift") | koc-dolu-360-light-s1 (ab2) | düğmeyi başlığa sabitle; adları tek kaynaktan Türkçeleştir | O
17. Koç | Hata: sarı kutu "Yeniden dene" + balon altında "Şimdi gönder" (iki aynı eylem); "Groq: İnternet yok ya da sağlayıcıya ulaşılamadı" teknik | koc-hata-360-light-ust | tek eylem; metin "Bağlantı yok. Mesajın kayıtlı, bağlanınca gönderilir."; sağlayıcı adı gösterme | Y
18. Koç | Zaman damgası yalnız koç balonunda | koc-dolu-360-light-ust | iki tarafta gizle ya da balon dışı küçük | D
19. Koç | Hızlı çipler (+250 Yemek Kilo Spor) Bugün ile aynı, 4 çip sürekli açık | koc-dolu-360-light-ust | yazı kutusu solunda tek "+" menüsü | D
20. Koç %200 | Hızlı çipler ikon-metin çakışıyor, yazı alanı kısılıyor, balonlar dar sütun | koc-dolu-360-light-y200-s0, -s3 | çip satırı `overflow-x:auto`, composer `min-height`, balon `max-width:92%` korunur ama `min-width:0` | Y
21. Trend | Tek grafik kilo; su/kcal/spor yalnız tablo; eksen yazısı ≈11 px %200'de ölçeklenmiyor | trend-dolu-360-light-ust, -y200-s0 | eksen ≥12 px, SVG `text` CSS değişkeninden; kcal/su için çubuk grafik | O
22. Trend | 3500 px, 8 bölüm eşit ağırlıkta (kilo, enerji, ölçü, kardiyo, fotoğraf, bağlantılar, tablo, ölçümler) | trend-dolu-360-light-s0..s4 (ab2) | "Özet" üstte; kardiyo/ölçü/fotoğraf `navRow` ile alt ekran ya da sekme; Bağlantılar Enerji'den sonra | Y
23. Trend | Enerji dengesi: uyarı kutusu ana veriyi bastırıyor; "Hedefi 2100 kcal yap" ikincil görünümlü | trend-dolu-360-light-s1 | uyarı üstte ince bant; "Hedefi yap" birincil `.btn`; "Hekimime danıştım" metin düğmesi | O
24. Trend | Bağlantılar: 16 px madde işaretli gövde, altında 13 px gri; veri dil olarak cümle | trend-dolu-360-light-s3 | madde işareti yok, iki istatistik (≥7 sa: 4,0 | <7 sa: 2,0), uyarı `.hint` | O
25. Trend | Boş durumlar farklı: grafik kartı ortalı, ölçü/kardiyo sola yaslı; hepsinde büyük "ekle" | trend-bos-360-light-ust | tek boş durum bileşeni (ikon, başlık, tek cümle, düğme); boş Ölçü/Kardiyo tek satır | O
26. Trend | Fotoğraf: tek küçük kare solda, sağ boş; 6 satır gizlilik metni | trend-dolu-360-light-s3 (ab2) | 3 sütun grid `aspect-ratio:3/4`, boşluk 8; gizlilik 1 satır + "Ayrıntı" | O
27. Trend | Kardiyoda "Koşu" üç kez (özet, tür, satırlar); 5 satır × ile kalabalık | trend-dolu-360-light-s2 (ab2) | tür özetini kaldır, 3 satır | D
28. Trend %200 | Lejant ve "Hedef 78,0 kg" grafiğe biniyor | trend-dolu-360-light-y200-s0 | lejant `flex-wrap`, hedef etiketi grafik dışına | O
29. Trend | Tablo başlıkları ayrı birim ("Su (L)", "Spor (dk)"), gün kısaltması "Çar 30 / Per 1" | trend-dolu-360-light-s4 | birim başlıkta, hücrede sayı; "Çar 30 Eyl" tek biçim | D
30. Tümü | Açıkta gölge, koyuda çizgi: iki derinlik dili; koyu balon farkı | koc-dolu-360-dark-ust | kart = `--card` + 1 px `--line`; gölge yalnız yüzen öğede | D
31. Tümü | 6, 10, 14 px rastgele boşluklar (todo 6, balon 10x14) | bugun-dolu-360-light-orta | 8/12/16/24 ızgarası | D
Taşma/biner: yalnız %200'de (madde 10, 20, 28); 360 ve 412'de yatay taşma görülmedi. Koyu tema kontrastı iyi.
## Tasarım dili önerisi
1. Renk: marka yeşili yalnız birincil eylem ve seçili durum; ikon `--ink` tek renk; veri renkleri (turuncu, mavi, mor) yalnız halka/grafik; sarı yalnız hekim/güvenlik uyarısı.
2. Tip: 24 ekran, 17 bölüm, 15 gövde, 13 ikincil, 12 etiket; büyük sayı 28/700 tabular; ağırlık yalnız 400/600; halka ve grafik yazısı `clamp()` ile %200'ü taşmadan taşır.
3. Yüzey: tek seviye `--card` r16 padding 16 boşluk 12; kartta kart yok, uyarı = ince bant; ekran başına ilk 3 öğe + "Tümü"; tek boş durum bileşeni.
4. İkon: 24 px, 1,75 çizgi, tek renk; tek silme biçimi (uzun basma/menü); emoji yok.
5. Hareket: 160 ms `--ease`; geri bildirim = toast + Geri al; satır ekle/sil 120 ms yükseklik geçişi; halka/grafikte iskelet; reduced-motion'da kapalı.
