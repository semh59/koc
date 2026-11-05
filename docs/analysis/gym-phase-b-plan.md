# Faz B — Egzersiz kataloğu genişletme planı

## Ön koşul

Faz A bağımsız `CLOSE` almadan katalog genişletme başlamaz. Faz B, figür altyapısı ve güvenlik düzeltmelerinden ayrı yürütülür.

## Hedef

NeoWell’in yerleşik kataloğunu mevcut 332 egzersizden önce 500+ seviyesine çıkarmak; sayı artışı kalite ve aranabilirlikten ödün vermeyecek.

## Sıra ve kapılar

1. Mevcut 332 kaydı benzersizlik, kas bölgesi, tür, ekipman, seviye ve figür kapsamına göre envanterle.
2. Eksik aileleri belirle: ev tipi, makine, serbest ağırlık, vücut ağırlığı, kardiyo, mobilite ve denge.
3. Lisans/attribution uygun veri kaynağını kesinleştir; doğrulanmamış görsel veya metin ekleme.
4. Kaynak verisini `exlib.js` üretim hattına uygun girdiye dönüştür; generated dosyayı elle düzenleme.
5. Her yeni kaydı zorunlu alanlarla doğrula: benzersiz id, ad, bölge, tür, ekipman, seviye, figür/fallback.
6. Arama, filtre, detay, geçmiş, import matcher, backup/restore ve CSV kapsamını test et.
7. Yinelenen/çakışan isim, yanlış eşleşme ve figürsüz kayıt oranını raporla.
8. Browser performansı ve düşük bellekli cihaz riskini ölç; fiziksel Android kanıtını ayrı tut.
9. Bağımsız veri/UX/security denetimi ve release sync kapısı.

## Başarı ölçütleri

- Katalog sayısı ve kategori dağılımı ölçülmüş.
- Yeni kayıtların tamamı üretim hattından geliyor.
- Test edilen her yeni ailede detay ekranı ve arama çalışıyor.
- Lisans/attribution kaydı mevcut.
- Faz raporu bağımsız `CLOSE` alıyor.
