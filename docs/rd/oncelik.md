# Ar-Ge birleşik öncelik listesi

Kaynak: `docs/rd/` altındaki 5 takım raporu ve bağımsız denetim (`dogrulama.md`). Denetimde KABUL veya DÜZELTMELİ alan öneriler listelendi; RED çıkan olmadı. Düzeltmeli olanlar notuyla yazıldı.

## Dalga 1: küçük, düşük riskli, hemen yapılabilir
1. Telefondan çıkanlar defteri (kodda yalnız 3 ağ noktası var).
2. Karşılamada "Yedeğim var" ile geri yükleme, ardından "Yedeği doğrula".
3. Günlük toplamda tahmin payı (`lo/hi` verisi var, gösterim yok).
4. Trend: aralıklı hedef tarihi (`se` zaten hesaplanıyor).
5. Hızlı metin kaydı (tek satırda çok yemek; onay ekranı şart).
6. Spor: RPE'ye duyarlı ilerleme önerisi; uzun aradan sonra hafif dönüş.
7. Rahat mod (büyük yazı, 56 px hedef) ve kilit bekleme süresi seçeneği.

## Dalga 2: orta kapsam
8. Birleşik hekim raporu (saglik Ö1 ile kullanilabilirlik Ö3 tek iş).
9. Rehber rakam doğrulama (izinli kümeye modelin tahmin edebildiği yemek değerleri eklenmeli).
10. "Rehber'e ne gitti" defteri.
11. Ramazan modu (sert risk bayrağında sayaç ve bildirim kurulmaz; `roadmap.md:72`).
12. Haftalık hareket kılavuzu kartı (WHO sayıları doğrulandı).
13. Lif ve sodyum çubukları; tarifte pişirme verimi; bulunamayan barkodu etiketle bağlama.
14. İlaçta çift doz koruması; tansiyonda "son dozdan beri" etiketi.
15. Bağlantılar'a uyku, adım, ruh hali eşleşmeleri (tansiyon x ilaç çifti yok); kanıt etiketi basit eşik kuralıyla.
16. Genel CSV içe aktarma (önizleme ve geri alma şartıyla).

## Dalga 3: karar veya dış onay bekleyen
- Health Connect'ten tansiyon/şeker okuma: yeni izin ve Play beyanı gerekir.
- Tam arşiv: önce yalnız JSON; FHIR sonra, kodları doğrulandıktan sonra.
- "Yanıtı bildir": sunucusuz mimaride Play şartına uyum belirsiz, Play incelemesine sorulmalı.
- N-of-1 deneme: ilk sürüm tek sabit kart, sonuç dili yasak.
- Denge ve işlevsel güç içeriği: içerik emeği büyük.

## Belge düzeltmeleri
- `docs/roadmap.md:76` "yorumlanmaz" ifadesi, kodda belgelenmiş tek istisnayı (180/120 ve 54/400 acil kutusu; `bp-glucose-plan.md:28`, `findings.md:56`, `legal-questions.md:22`) anmıyor.
- `docs/market/b-food-nutrition.md` "adaptif hedef yok" diyor; `algo.js:71`'de var.
