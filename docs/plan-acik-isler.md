# Açık işler ve uygulama planı (2026-10-11)

Kaynaklar: `docs/rd/oncelik.md`, `docs/rd/analiz-dalga-1.md`, `-2a`, `-2b`, `-3`, `docs/rd/hukuk-*.md`, bu oturumdaki kararlar. Her faz ayrı commit; her fazın sonunda `npm test` ve tam e2e yeşil olmadan sonraki faza geçilmez. Sürüm çıkarma kuralı: depo geçici public, CI, sonra private (kullanıcı bunu daha önce kabul etti). Depoyu kalıcı public yapmak ve karar isteyen işler "Karar bekleyen" altında.

## A. Bitti, yayına girmedi
1. Dalga 1 (m1, m2, m3 gösterim, m6 uzun ara, kilit bekleme).
2. Rehber daraltması: yalnız menü, program, yemek ve egzersiz kalorisi; veri yalnız profil ve kalori hedefi (`a8a653d`).
3. Sınır sıkılaştırma: `main/` modül API'si üzerinden, modüller arası açık `api` listesi, test (`15a6764`, `e5dc3dc`).
4. Samsung ilaç alarmı düzeltmesi (`43345bf`): tam ekran bildirim önce, ekran kilidi 1,2 sn sonra; tanıya "alarm ekranı açıldı/kapandı" kaydı. Telefonda doğrulanması gerek.

## B. Açık işler

### Faz 1: Yayın
- 1.1 Tam e2e, sürüm 1.0.N (public, CI, private). Çıktı: Samsung'ta test edilecek APK.

### Faz 2: Rehber ve hukuk artıkları (kullanıcı hukuki süreç istemiyor: kaldır, daralt, açıkla)
- 2.1 `03-screens.js` içindeki yanlış cümle kontrolü (kayıt görünümü metni).
- 2.2 "Tüm verileri sil" yedek parolası kaydını da silsin.
- 2.3 Rıza geri alınırken sohbeti de silme seçeneği.
- 2.4 Gemini ücretsiz katman uyarısı (ücretsiz katmanda veri sağlayıcı tarafından model eğitiminde kullanılabilir).
- 2.5 "Yanıtı bildir": yerel işaret ve e-posta taslağı (sunucusuz); "Play uyumlu" iddiası yok.
- 2.6 targetSdk 36 (`android/variables.gradle`), CI derleme ve smoke ile.
- 2.7 Politika yer tutucuları (ad, adres, e-posta, yayın tarihi): kullanıcı bilgisi gerekir.
- 2.8 Belge düzeltmeleri (Dalga 3 m6): `roadmap.md:76` acil kutusu istisnası, `market/b-food-nutrition.md` adaptif hedef.
- 2.9 Türkiye hukuku raporu (KVKK) yarım kaldı; ajan çalıştırmadan, mevcut `hukuk-*.md` ve kodla kapsanamayanlar listelenir.

### Faz 3: Dalga 1 artıkları
- 3.1 Trend: aralıklı hedef tarihi (m4): pencere 21 gün, "kestirilemiyor" dürüst durumu, güvenli hız sınırı.
- 3.2 Spor: RPE'ye duyarlı ilerleme (m6, yalnız "tut" yönünde ve `rpeOn` iken).
- 3.3 Hızlı metin kaydı (m5): tek satırda çok yemek, onay ekranı şart, ölçü eşlemesi yalnız besinin kendi porsiyonlarıyla.
- 3.4 Rahat mod (m7): büyük yazı, 52 px hedef.

### Faz 4: Dalga 2
- 4.1 İlaçta çift doz koruması (14a): uygulama içi onay; bildirim düğmesi ve alarm ekranı yolunda soru yok, kapsam dar.
- 4.2 Tansiyonda "son dozdan beri" etiketi (14b): ilaç başına "tansiyon ilacı" işareti.
- 4.3 Bulunamayan barkodu etiketle bağla (13c).
- 4.4 Lif çubuğu (13a); sodyum çubuğu yapılmaz (veri yok).
- 4.5 Tarifte pişmiş toplam ağırlık (13b).
- 4.6 Bağlantılar: adım (D-1) → uyku çifti ve kanıt etiketi (15); tansiyon ve ilaç uyumu çiftleri yapılmaz.
- 4.7 Genel CSV içe aktarma (16): yalnız kilo, tansiyon, şeker; önizleme ve geri alma.
- 4.8 Birleşik hekim raporu (8): 30/90 gün sayfa düzeni; tahlil oku ile "yorum yok" çelişkisi çözülür (öneri: okları kaldır, yalnız değer ve tarih).
- 4.9 Ramazan modu (11): imsak/iskan saatleri internetten tablo + cihazda hesap yedeği, başlangıç tarihi elle, sert bayrakta kapalı, ilaç saatine dokunmaz.
- 4.10 Haftalık hareket kılavuzu kartı (12): mevcut spor dakikası + kuvvet günü ile sınırlı.
- Yapılmayanlar: 9 (Rehber rakam doğrulama; Rehber artık sayı hesaplamıyor), 10 ("Rehber'e ne gitti" defteri; Dalga 1 çıkış defteri bunu kapsıyor).

### Faz 5: Dalga 3
- 5.1 Tam arşiv JSON dışa aktarma.
- 5.2 Denge ve işlevsel güç içeriği: 6 hareket + 1 akış, "düşmeyi önler" iddiası yok.
- Ertelendi (dış onay ya da karar): Health Connect'ten tansiyon/şeker (Play beyanı), FHIR (şeker kodu doğrulanamadı), N-of-1 deneme.

### Faz 6: Mimari artıklar (isteğe bağlı, davranış değiştirmez)
- 6.1 `settings` modül başına bölme; 6.2 modül → çekirdek bağımlılıkları (~650) ve `api` listelerini daraltma; 6.3 `kernel/` için de sınır testi.

## C. Karar bekleyen (kullanıcıya sorulacak, işi durdurmaz)
- Tansiyon acil kutusu (180/120, 54/400 "112") nötr nota çevrilsin mi; "Doktor raporu" adı değişsin mi.
- Depoyu kalıcı public yapmak (gizlilik politikası adresi için GitHub Pages).
- Politika yer tutucuları için ad, adres, e-posta.
- 4.8 için "oklar kalksın" önerisi.

## D. Kabul ölçütü (her faz)
`npm test` 0 hata, tam e2e 0 hata, yeni davranış için test, boundary testi yeşil, `docs/` güncel, commit mesajı İngilizce, kullanıcı metni Türkçe ve tam diyakritik.
