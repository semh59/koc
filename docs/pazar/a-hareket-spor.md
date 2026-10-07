# Pazar karşılaştırması A: hareket, spor, su, kilo (2026-10-07)

**Kaynak notu:** Google Play sayfaları otomatik okumaya kapalı (boş döndü); indirme sayıları arama özetlerinden ve üçüncü taraf sitelerden alındı, güncel olmayabilir. "Blog" kaynaklar çoğu zaman uygulama sahibinin kendi yazısıdır (çıkar çatışması). Türkiye'ye özel kullanım payı hiçbir bölümde bulunamadı: **doğrulanamadı**. NeoWell "var" = kodda var, telefonda denenmemiş olabilir (yalnız barkod telefonda denendi, bkz. `docs/rekabet-ozellik.md`).

## 1. Adım sayar / hareket takibi
- **Kalite olarak en iyi:** Samsung Health (Android'de ücretsiz, bağımsız, en kapsamlı; blog görüşü, [vantagefit](https://www.vantagefit.io/blog/step-tracker/)). Doğruluk için bilek cihazları öne çıkıyor (ücretli donanım). Google Fit kapanıyor, yerine Google Health geliyor ([9to5google](https://9to5google.com/2026/05/07/google-fit-shut-down-health-replacement-migration-tool-coming/)). Bağımsız puan veya uzman testi bulunamadı: **doğrulanamadı**.
- **En çok tercih edilen:** Samsung Health 500 M+ yükleme (Ağustos 2018 verisi, güncel değil; [SamMobile](https://www.sammobile.com/2018/08/02/samsung-health-500-million-installs-google-play-store/)), Samsung telefonlarda hazır geldiği için. Pacer: 10 M+ indirme, 4,8 puan, ~972 bin yorum, ücretsiz + reklam + abonelik ([apppricinglab](https://apppricinglab.com/app/google_play/cc.pacer.androidapp)). Türkiye'de en çok kullanılan: **doğrulanamadı**.
- **NeoWell:** Adım sayar (Bugün'de kart ve halka, Adım raporu, hedef, elle adım, gece alarmıyla gün kapanışı, "sayım durdu" uyarısı, Xiaomi pil yönlendirmesi); hareket algılama (yürüyüş/koşu otomatik; süre, mesafe, hız, kalori); elle "Yürüyüş başlat" sırasında adım uzunluğu için GPS (rota/harita yok, nokta saklanmaz); ana ekran widget'ı. Health Connect **yok** (`docs/yapilacaklar.md:41`, karar bekliyor). Çoğu telefon testi bekliyor.

| Özellik | En iyi (Samsung Health) | En çok tercih (Pacer/Samsung) | NeoWell |
|---|---|---|---|
| Telefon sensörü adım | var | var | var |
| Saat/bileklik verisi | var (Samsung) | var (Fitbit/Garmin) | yok |
| Çift sayım koruması | kısmen (bilinen şikâyet, `docs/adim-arastirma.md`) | kısmen | kısmen (tek kaynak) |
| Rota/harita, sosyal yarış | var | var | yok (bilerek) |
| Hareket kaydı (yürüyüş/koşu) | var | var | var (rotasız) |
| Widget | var | var | var |
| Hesapsız/yerel veri | hesap ister | bulut + hesap | var |

**Eksikler ve öneri**
- Health Connect adım okuma: **orta**, **L** (izin, Play beyanı, çift sayım). Önce Mi Band/saat kullanımı netleşmeli (`docs/adim-arastirma.md:42`); Google Fit'in kapanması ihtiyacı büyütür.
- Mevcut özelliklerin telefon testi: **yüksek**, **S**.
- Bilerek yapılmaması: sosyal yarış/sıralama (hesap, bulut, gizlilik), rota/harita ve arka plan GPS (karar: `docs/akilli-gps-tasarim.md`).

## 2. Spor ve antrenman kaydı (salon + kardiyo)
- **Kalite olarak en iyi:** Tek "en iyi" yok. Hevy: Play 4,9 puan, ~200 bin yorum ([apppricinglab](https://apppricinglab.com/app/google_play/com.hevy)). Strong en hızlı sade kayıt, Hevy en ucuz yükseltme ve sosyal akış, Jefit en derin analiz ([Jefit blogu](https://www.jefit.com/blog/fitbod-vs-strong-vs-jefit-vs-hevy), rakip yazısı, tarafsız değil). Bağımsız test: **doğrulanamadı**.
- **En çok tercih edilen:** JEFIT 20 M+ (Play + App Store toplamı, şirket iddiası; [Jefit](https://www.jefit.com/blog/10-best-workout-tracker-apps-in-2026-complete-comparison-guide)). Hevy 5 M+ Play ([AppBrain](https://www.appbrain.com/dev/Hevy+Gym+Workout+Tracker/)). Strong indirme sayısı **doğrulanamadı**. Fiyat: Strong ücretsiz (rutin sınırlı) + PRO 4,99 $/ay veya 29,99 $/yıl; Hevy 23,99 $/yıl ([sensai blog](https://www.sensai.fit/blog/hevy-vs-strong-vs-fitbod-vs-jefit), ikincil). Türkiye'de en çok kullanılan: **doğrulanamadı** (ev antrenmanında Leap Fitness 10 M+ iddiası var, `docs/rekabet-egzersiz.md:67`, ikincil).
- **NeoWell:** Salon: şablon editörü, hızlı set girişi, "önceki seansla aynı", dinlenme sayacı (bildirimli), süperset, ısınma/plaka hesabı, isteğe bağlı RPE, 1TM, rekor bildirimi, akıllı ilerleme ve deload notu, egzersiz grafikleri, haftalık kas grubu notu, kendi egzersizi, Koç'tan program, süreli (kardiyo benzeri) set, geçmiş, CSV içe/dışa aktarma (`www/gym.js`, `exui.js`, `csvlib.js`, `importlib.js`). Sürekli koşu/bisiklet için ayrı kardiyo ekranı yok; yalnız süreli set ve hareket algılama.

| Özellik | En iyi (Hevy/Strong/Jefit) | En çok tercih (Jefit/Hevy) | NeoWell |
|---|---|---|---|
| Set/tekrar/kg kaydı, şablon | var | var | var |
| Dinlenme sayacı, süperset | var | var | var |
| Rekor, 1TM, grafik | var | var | var |
| Hazır program/plan üretimi | var (Jefit 12 hafta) | var | kısmen (Koç, kullanıcı anahtarı ister) |
| Egzersiz görseli | var | var | kısmen (çizgi-adam/foto) |
| Saat uygulaması, sosyal akış | var | var | yok |
| Bulut yedek, çok cihaz | var | var | kısmen (şifreli yerel yedek) |

**Eksikler ve öneri**
- Telefon testi (hızlı set, ekran açık kalma, rekor): **yüksek**, **S**.
- Gerçek kardiyo kaydı (süre/mesafe/tempo, ayrı tür): **orta**, **M**.
- Antrenman verisi localStorage sınırı riski (`docs/rekabet-egzersiz.md:165`): **orta**, **M**.
- Bilerek yapılmaması: sosyal akış/takip, Wear OS (kapsam), bulut hesabı.

## 3. Su takibi
- **Kalite olarak en iyi:** WaterMinder (sağlık platformu entegrasyonu, çevrimdışı çalışır; [WaterMinder blogu](https://blog.waterminder.com/?p=1029), kendi sitesi). Waterllama oyunlaştırma, Hydro Coach hava durumuna göre hedef ([educationalappstore](https://www.educationalappstore.com/blog/best-hydration-apps/)). Bağımsız puan karşılaştırması: **doğrulanamadı**.
- **En çok tercih edilen:** İndirme sayıları **doğrulanamadı**. Türkiye'de Tamindir listesi "Water Drink Reminder", "Drink Water Reminder", "Water Time" adlarını öne çıkarıyor ([Tamindir](https://www.tamindir.com/indir/drink-water-reminder/)); sayı yok. Hepsi ücretsiz (reklamlı) + premium.
- **NeoWell:** Günlük hedef (varsayılan 2500 ml, ayarlanır), bardak boyu ayarı, hızlı ekleme, geri alma, halka ve "kaldı" yazısı, gün içi hatırlatmalar, hedef dolunca kalan bildirimler susar, bildirimden ve widget'tan tek dokunuş "+250 ml" (`www/index.html:427,1419`; `yapilacaklar.md:38,83`). İçecek türü, hava veya spora göre hedef için kodda iz bulunamadı.

| Özellik | En iyi (WaterMinder) | En çok tercih | NeoWell |
|---|---|---|---|
| Hedef + hızlı ekleme | var | var | var |
| Akıllı hatırlatma | var | doğrulanamadı | var (sabit saat mantığı) |
| Bildirim/widget'tan ekleme | var | doğrulanamadı | var |
| İçecek türleri | var | doğrulanamadı | yok |
| Sağlık platformu eşitleme | var | doğrulanamadı | yok |
| Hava/aktiviteye göre hedef | kısmen (Hydro Coach) | doğrulanamadı | yok |

**Eksikler ve öneri**
- Widget/bildirim çift sayım testi (MIUI): **yüksek**, **S**.
- Spor yapılan güne hedef ekleme: **düşük**, **S**.
- İçecek türü (çay/kahve): **düşük**, **S**; hedefi karıştırma riski var.
- Bilerek yapılmaması: tıbbi "ideal su miktarı" iddiası, yarış/sosyal özellik.

## 4. Kilo ve vücut ölçüsü takibi
- **Kalite olarak en iyi:** Trend için Happy Scale ("tartı kaygısı"nı azaltan trend ve tahmin; [AlternativeTo](https://www.alternativeto.net/software/happy-scale/)); uyarlanabilir hedef için MacroFactor (haftalık kilo trendine göre kalori ayarı, ücretli; [Fortune](https://www.fortune.com/article/best-macro-tracking-apps/)); akıllı tartıyla Withings Health Mate ([AlternativeTo](https://alternativeto.net/software/withings-health-mate)). Happy Scale ağırlıklı iOS, Android karşılığı Libra. Puanlar ve fiyat: **doğrulanamadı**.
- **En çok tercih edilen:** Saf kilo uygulamalarının indirme sayısı **doğrulanamadı**. Türkiye payı **doğrulanamadı**. Kilo takibi çoğunlukla kalori uygulamaları ve sağlık platformları içinde yapılıyor (yorum, kanıt yok).
- **NeoWell:** Üstel ortalamalı trend kilo, aykırı tartı uyarısı, kg/hafta ve hedefe tahmini süre, plato uyarısı, "Bu hafta neden kilo vermedim" kartı, 3 kg ve üstü sıçramada onay (`www/algo.js:11`; `yapilacaklar.md:109,123-128`). Ölçüler: bel, kalça, göğüs, kol, uyluk, grafik, bel/boy oranı (`www/measureui.js`); Koç'a gönderilmez. İlerleme fotoğrafı, yağ oranı, akıllı tartı eşitleme ve lb birimi yok (kodda iz bulunamadı).

| Özellik | En iyi (Happy Scale/MacroFactor) | En çok tercih | NeoWell |
|---|---|---|---|
| Trend kilo + hedef tahmini | var | doğrulanamadı | var |
| Plato/neden analizi | kısmen (MacroFactor) | doğrulanamadı | var |
| Uyarlanabilir kalori hedefi | var (MacroFactor) | doğrulanamadı | var (`algo.js:44`) |
| Çevre ölçüleri | kısmen | doğrulanamadı | var |
| İlerleme fotoğrafı | kısmen | doğrulanamadı | yok |
| Akıllı tartı / Health Connect | var | doğrulanamadı | yok |
| Yağ oranı, lb birimi | var | doğrulanamadı | yok |

**Eksikler ve öneri**
- Health Connect'ten kilo okuma (adımla birlikte yapılırsa ek maliyet küçük): **orta**, **M**.
- Yerel ilerleme fotoğrafı: **orta**, **M**; mahrem veri, Koç'a ve buluta hiç gitmemeli.
- lb/in birimi: **düşük** (Türkiye odaklı), **S**.
- Bilerek yapılmaması: sensörsüz yağ oranı tahmini (yanıltıcı), "ideal kilo" hükmü, agresif hedefler (mevcut BMI 18,5 freni korunmalı, `algo.js:112`).
