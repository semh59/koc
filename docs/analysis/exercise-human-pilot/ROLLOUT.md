# Onaylı insan modelinin tüm egzersizlere yayılması

## Kullanıcı kararı
Semih yeni `feet-corrected.mp4` ve `full-corrected.mp4` sunumundan sonra: **“Güzel beğendim şimdi tüm egzersizlerde uygulamalıyız”** dedi. Bu, sunulan pilot görünüm/hareketinin beğenilmesi ve tüm mevcut egzersizlere uygulama yetkisidir. Klinik doğruluk, fiziksel cihaz performansı veya henüz uygulanmamış egzersizlerin onayı değildir.

## Sabit başlangıç
- Repo `D:/PROJECT/NeoWell`, dal `release/no-coach`, HEAD `bfdd8394459a1b29981cb7e7bd36b08a79459b2f`.
- Onaylı model `D:/PROJECT/NeoWell-exercise-pilot/neutral/neutral-human-viewer.glb`, SHA256 `947f9b100d6fc5130ad264b895d3b824a2bc5a917ba271cf0a51a41133c63b21`.
- Sunulan kaynak pilot SHA256 `f51a86e680fcd145c7acdd41525d0212200213e27e447204a7ae9b3e7cb3d44d`; bundle `8833c87be39ec8fb5ce40b3c69219041f850e01395c35456c91c8e3fdec9dd20`.
- Birincil kas kırmızı `0xff202d`, yardımcı kas turuncu `0xff8a16`; doğal cilt korunur. Pilotun yalnız göğüs/triseps/ön omuz maskeleri mevcut; diğer kaslar uygulanmış sayılmaz.
- Ücretsiz/ticari kullanımı doğrulanmış CC0 asset yolu korunur; satın alma yok.
- Başlangıç worktree yalnız analiz klasörü ve önceki ilişkisiz untracked model/raporlar içeriyor; bunlar silinmez veya değiştirilmez. Commit, uzak yayın, APK dağıtımı yapılmayacak.

## Uygulama kapıları
1. Gerçek runtime katalog/supplemental kayıtları ve hareket şablonlarını makineyle say, kimlikleri koru; mevcut kas metadata boşluklarını kaydet.
2. Mevcut çağrı/lifecycle sözleşmesine onaylı modeli entegre et; yükleme, hata, kapatma/dispose, Play/Pause ve kas resetini gerçek GLB ile RED→GREEN doğrula.
3. Hareket ailelerini ayrı uygula. Şınav kalibrasyonu her egzersize kopyalanmaz; ayakta, oturarak, yatarak, tek taraflı ve ekipmanlı hareketlerde temas/yön/ROM kontrolü gerekir.
4. Birincil/yardımcı kasları egzersiz verisinden açık eşle, eksik eşlemeyi tahmin edilmiş aktivasyon gibi sunma; maskeleri gerçek yüzeyde doğrula.
5. Her parti için gerçek skin hareket/temas/kadraj, bağımsız inceleme ve komşu regresyon testleri. Kapsam sayacı `katalog toplamı / doğrulanmış / açık` ayrı tutulur; fallback model veya yükleme başarısı hareket kabulü değildir.
6. Gerçek uygulama ekranında mobil tarayıcı ve erişilebilirlik kontrolü; fiziksel Android performansı ayrı kapı.

## Durum
- [x] Yeni pilot görünüm/hareketi kullanıcı tarafından beğenildi; tüm egzersizlere uygulama talebi alındı.
- [x] Güncel repo/branch/HEAD/worktree başlangıcı doğrulandı.
- [ ] Gerçek katalog ve hareket/kas kapsamı envanteri (bağımsız çalışma sürüyor).
- [ ] En kısa uyumlu entegrasyon tasarımı (bağımsız çalışma sürüyor).
- [ ] Gerçek uygulama entegrasyonu ve ilk parti.
- [ ] Kalan hareket aileleri ve kas maskeleri.
- [ ] Tüm katalog kapsam kontrolü, bağımsız denetim ve cihaz kabulü.

Pilotun son bağımsız denetimi mevcut ayak postürünü doğruladı; test hash etiketi/yön koruması test-only düzeltmeyle kapandı. Parent `pins.test.cjs` ve `direction.test.cjs` benzersiz `parent-*` kanıt koşumları exit0; mevcut121faz/0hata, eski replay1210hata, ters-yön mutasyonu1694hata ile beklenen RED. Kanıt `D:/PROJECT/NeoWell-exercise-pilot/foot-test-closure/REPORT-TR.md`. Kullanıcının gördüğü model/medya bu test-only işte değiştirilmiyor. Ana güncel kanıtlar: `D:/PROJECT/NeoWell-exercise-pilot/foot-final-review/REPORT-TR.md` ve `foot-parent-check/results.json`.
