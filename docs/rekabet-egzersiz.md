# Egzersiz ve antrenman: rakip analizi

Tarih: 2 Ekim 2026. Kod durumu: `9953416`.

İşaretler:
- **K**: kaynak URL'si açılıp doğrulandı.
- **İK**: ikincil kaynak (blog, karşılaştırma sitesi, arama özeti). Bağımsız doğrulanmadı.
- **D**: NeoWell'de kodda var, telefonda denenmedi.

## 1. NeoWell'in gerçek egzersiz envanteri (koddan)

Salon tarafının tamamı telefonda denenmedi. `docs/yapilacaklar.md` içinde salonla ilgili maddelerin hepsi `[ ]` (satır 39, 40, 46, 55, 56); hareket algılama `[~]` (satır 34). Kütüphane, animasyon ve zamanlayıcı için test maddesi bile yok.

| Alan | Gerçek durum | Kanıt |
|---|---|---|
| Kütüphane | 324 egzersiz. 16 bölge (Göğüs 38, Karın 34, Omuz 31, Sırt 31, Ön bacak 30 ...). Tür: güç 257, esneme 41, pliyometrik 15, kardiyo 11. Ekipman: Salon 125, Ev tipi 106, Ağırlıksız 93. Seviye: başlangıç 246, orta 69, ileri 9. | `www/modules/gym/exlib.js` |
| Kayıt türü | Ağırlık×tekrar 208, vücut ağırlığı (ek kg) 50, süreli tutuş 45, kardiyo dakika 12, aralıklı tur 9. | `exlib.js` alan `k` |
| Görsel | Her egzersizde animasyonlu SVG çizgi-adam. Fotoğraf (2 kare, free-exercise-db, kamu malı) 322 egzersizde. Toplam görsel boyutu 8,6 MB. | `figlib.js`, `www/ex/` |
| Animasyon çeşitliliği | 48 hareket şablonu (commit mesajı 49 diyor, kodda 48). Bir şablon ortalama 6 egzersizde kullanılıyor, `curl` şablonu 29 egzersizde, `hinge` 19, `squat` 18. Aynı şablondaki varyantlar küçük açı farkıyla birbirine benziyor. | `figtpl.js` |
| Form ipuçları | Şablon başına 2 kısa Türkçe ipucu, 48 şablonun hepsinde. Egzersize özel değil, şablona özel. | `excues.js` |
| Süzgeç ve arama | Bölge, tür, ekipman çipleri ve Türkçe karaktere duyarsız arama. | `exui.js:17-39` |
| Set kaydı | "Önceki" sütunu son seansın aynı sırasındaki seti gösterir. Setler öneriyle önceden dolu gelir, ✓ ile 1 dokunuşta bitirilir. "Set ekle" son seti kopyalar. | `gym.js:182-200, 335` |
| İlerleme önerisi | Çift ilerleme: tüm setler üst tekrara ulaşınca +artış kg ve alt tekrara dön, yoksa +1 tekrar. Yalnız son seansa bakar; başarısızlıkta düşürme ya da deload yok. Egzersiz başına tekrar aralığı 5-8, 8-12, 12-15. | `algo.js:131-138`, `exui.js:143-153` |
| Plaka ve ısınma | Bar başına plaka, en yakın yapılabilir ağırlık, ısınma setleri. Isınma setleri hacme ve rekora girmez. Bar ağırlığı ayarlanır. **D** | `exui.js:123-162` |
| Rekor | Epley tahmini 1TM ile set anında "Yeni rekor" bildirimi ve titreşim, egzersiz başına bir kez. Özet ekranında rekor listesi. **D** | `gym.js:106-120` |
| Süreli, aralıklı, kardiyo set | Set başına ▶ zamanlayıcı, ±10 sn, aralıklı türde turlar arası 20 sn dinlenme. Süre bitince yerel bildirim (kilit ekranında da gelir). **D** | `exui.js:64-121` |
| Dinlenme sayacı (ağırlık) | Sabit 90 sn, ±15 sn ve Atla. **Yalnız Salon sekmesi açıkken** sayar ve titreşir; set ✓ olunca bildirim kurulmaz. Egzersiz başına süre ayarı yok. Ekranı açık tutma yok. | `gym.js:14, 209-219, 347` |
| Şablonlar | Yalnız bitmiş antrenmandan "Şablon olarak kaydet". Şablon yalnız egzersiz listesi tutar (set/tekrar hedefi yok). Düzenleme yok, yalnız silme. Sayı sınırı yok. | `gym.js:363-367` |
| Kendi egzersizi | Ad + eski 6 gruptan biri. Hep ağırlık×tekrar; süreli tür, bölge, ekipman, görsel yok. | `gym.js:322-329` |
| Analitik | Egzersiz başına son 12 seansın 1TM çizgisi, en iyi set, son 6 seans tablosu. Haftalık kas grubu başına set çubukları (6 grup). 16 bölgelik haftalık set verisi var ama yalnız Koç'a gidiyor, vücut haritası yok. | `gym.js:123-136, 254-266` |
| Antrenman geçmişi | Ay başlıklı liste, 20'şer "Daha fazla göster", özet ekranı, Bugün'de "Devam et" ve biten antrenman kartı. İşaretsiz setler Bitir'de sorulur, veri kaybolmaz. **D** | `gym.js:151-181`, commit `dc738b2`, `9953416` |
| Koç'tan program | Gün, ekipman, süre, seviye seçilir; dil modeli yalnız kütüphaneden seçer; her gün şablon olarak eklenir. **İnternet, kullanıcının kendi Groq/OpenRouter/Gemini anahtarı ve veri paylaşım onayı gerekir.** Çevrimdışı değil. **D** | `coach.js:31-35, 251-275` |
| Hareket algılama | Etkinlik tanıma ile otomatik yürüyüş/koşu, kısa GPS penceresiyle adım uzunluğu öğrenme, tempoya göre kalori. **D** (`[~]`) | `motionlib.js`, commit `d705170`, `369ad1d` |
| Antrenman kalorisi | Yok. Bitirilen antrenman yalnız dakika olarak "spor" kaydı olur. Kalori yalnız algılanan yürüyüş/koşuda. | `gym.js:300` |
| Süperset, drop set, RPE/RIR | Yok. Set türü olarak yalnız ısınma var. Not egzersiz başına (set başına değil). | `gym.js:59-63` |
| İçe/dışa aktarma | CSV yok. Tüm veri (antrenmanlar dahil) JSON yedek metni ve şifreli Drive yedeğiyle taşınır. Veri WebView localStorage'da. | `index.html:420, 820` |
| Saat, giyilebilir | Yok. Health Connect bekliyor. | `yapilacaklar.md:14` |
| Sosyal | Yok (bilinçli: hesapsız). | |

**Dokunuş sayısı:** Rakiplerde ölçülmedi (elle kullanım gerekir). NeoWell'de koddan: şablondan başlatma 1, önceden dolu set 1 (✓), değeri değişen set 2 giriş + ✓, "Set ekle" 1 dokunuş; süperset yok.

## 2. Rakipler: fiyat, ücretsiz katman, öne çıkan

Erişim tarihi 2 Ekim 2026. Fiyatlar USD; yalnız K işaretli olanlar App Store'dan, diğerleri ikincil bloglardan. TL fiyatı ve Play Store puanı çoğu uygulamada alınamadı: Play Store sayfaları WebFetch'te kesik geldi, App Store'un bir kısmı 429 (çok istek) döndü.

| Uygulama | Fiyat | Ücretsiz katman | Öne çıkan | Puan |
|---|---|---|---|---|
| **Hevy** | 2,99-3,99 $/ay, 23,99 $/yıl, ömür boyu 74,99 $ (K: App Store) | Sınırsız kayıt; 4 rutin, 7 özel egzersiz, 3 aylık grafik geçmişi (İK: sensai, push-pull; App Store özeti 5 özel egzersiz dedi, çelişkili) | Videolu kütüphane, egzersiz başına otomatik dinlenme sayacı, set türleri (ısınma, drop, başarısızlık, süperset), kas grubu grafikleri, kilit ekranı canlı etkinlik, Apple Watch, sosyal akış (K: App Store) | App Store 4,9 (96 bin) (K) |
| **Strong** | 4,99 $/ay, 29,99 $/yıl, ömür boyu 99,99 $ (İK) | 3 özel rutin (İK: push-pull, aitoolsbakery) | Sade ve hızlı kayıt, plaka ve ısınma hesabı, CSV dışa aktarma (İK) | Alınamadı (429) |
| **Fitbod** | 15,99 $/ay, 95,99 $/yıl (İK) | Yok; 7 gün ya da 3 antrenman deneme, kaynaklar çelişiyor (İK) | Yapay zekâ ile günlük antrenman, kas toparlanmasına göre seçim (İK) | Alınamadı |
| **JEFIT** | Elite 12,99 $/ay, 69,99 $/yıl (İK) | 1.400+ egzersiz, kayıt, planlayıcı; reklamlı (İK: gymbird, sensai) | Büyük kütüphane; video ve saat Elite'te (İK) | Alınamadı |
| **Boostcamp** | Pro 14,99 $/ay, 59,99 $/yıl (İK: barbend, boostcamp.app) | Çok geniş: hazır programlar, RPE/RIR, plaka hesabı, dinlenme sayacı, 1TM, haftalık rapor (İK, kendi sitesi) | Koçların hazır programları; kas ısı haritası Pro'da (İK) | Alınamadı |
| **Liftosaur** | Fiyat sayfada yok, mağaza ülkeye göre (K); 4,99 $/ay'dan (İK) | Program editörü, Liftoscript, kayıt, geçmiş, içe/dışa aktarma ve çevrimdışı ücretsiz. **Plaka hesabı, grafikler, kas görünümü, dinlenme bildirimi ve saat ücretli** (K: liftosaur.com/features/premium) | Açık kaynak (AGPL), programlanabilir ilerleme | Alınamadı |
| **StrongLifts 5x5** | 11,99 $/ay, 59,99 $/yıl, 5 yıl 199,99 $ (K: App Store) | Pratikte yok: "indirme ücretsiz, kullanmak abonelik ister" (K: App Store yorumu); geçmişin de kilitlendiği iddiası (İK) | Tek program, otomatik ağırlık artışı | App Store 4,9 (77 bin) (K) |
| **Nike Training Club** | Ücretsiz, reklamsız (İK: garagegymreviews, whistleout) | Tamamı ücretsiz, 200+ videolu antrenman (İK: nike.com) | Videolu rehberli antrenman; serbest set kaydı yok (İK) | Alınamadı |
| **Fitify** | 39,99-69,99 $/yıl, kaynaklar çelişiyor (İK) | Seçili antrenmanlar; 900+ vücut ağırlığı/küçük ekipman egzersizi, çevrimdışı çalışır (İK) | Sesli rehberli ev antrenmanı | Play 4,7 (555 bin) (İK, arama özeti) |
| **Freeletics** | Koç 34,99 $/3 ay, 89,99 $/yıl (İK; başka kaynakta 39,99 $/yıl) | ~20 antrenman, 25 egzersiz (İK) | Vücut ağırlığı, yapay zekâ koç | Alınamadı |
| **Gymshark Training** | Çekirdek ücretsiz, reklamsız (İK) | 450+ antrenman, videolu esneme/mobilite (İK) | Takip edilen video antrenman | Alınamadı |
| **Cali Move** | Program başına 19,99 $/ay ya da 119,99 $/yıl (İK) | Uygulama ücretsiz, içerik ücretli (İK) | Seviyeli kalisthenik programı | Alınamadı |
| **Setgraph** | 4,99 $/ay, 29,99 $/yıl, ömür boyu 199,99 $ (İK) | Bilinmiyor | Grafik odaklı kayıt | Alınamadı |
| **Gravl** | 14,99 $/ay, yıllık 59,99-89,99 $ (İK) | Bilinmiyor | Yapay zekâ program | Alınamadı |
| **Samsung Health** | Ücretsiz, uygulama içi satın alma yok (İK) | Programlar (koşu, esneme, güç), Les Mills sınıfları (İK) | Saat entegrasyonu; ağırlıkta set/tekrar kaydı zayıf, çoğunlukla süre ve kalori (İK) | Alınamadı |
| **Strava** | 11,99 $/ay, 79,99 $/yıl (İK) | GPS kayıt, sosyal, temel rota (İK) | Koşu/bisiklet; salon kaydı yok | Alınamadı |
| **adidas Running** | Ücretsiz + Premium (İK) | Koşu takibi, 90+ etkinlik, Wear OS (İK) | Koşu planları | Alınamadı |
| **Decathlon Coach** | Ücretsiz (İK) | Etkinlik kaydı, 157 ülke (İK) | Mesafe/tempo hatası ve duraklatma sorunları şikâyeti (İK: justuseapp, kimola) | Alınamadı |
| **MAC+ (MACFit, Türkiye)** | Ücretsiz (İK: macfit.com) | Yüzlerce eğitmen antrenmanı, egzersiz kütüphanesi, kendi programını oluşturma ve ağırlık kaydı, dış antrenman haritası, yapay zekâ FitBot, liderlik tablosu (İK, kendi sayfası) | Türkçe, en güçlü yerli rakip; hesap gerekip gerekmediği doğrulanmadı (?) | Alınamadı |
| **Ev Egzersizleri / Fitness Coach (Leap Fitness)** | Ücretsiz + reklam/abonelik (İK) | Türkçe, ekipmansız 30 günlük programlar ("30 Günde Baklava Karın Kası") (İK) | TR Play'de ev antrenmanında yaygın | Fitness Coach Play 4,9 (306 bin, 10 M+ indirme) (İK, arama özeti) |

Apple Fitness+, Caliverse ve Mynet için güvenilir veri bulunamadı, tabloya alınmadı.

## 3. a) Özellik matrisi

✔ var, ~ kısmi, ✘ yok, ? doğrulanamadı. NeoWell sütununda **D** = kodda var, telefonda denenmedi (salon tarafının tamamı D). Yalnız Hevy (App Store) ve Liftosaur (premium sayfası) hücreleri K; diğerleri İK ya da doğrulanmamış genel bilgi.

| Özellik | NeoWell | Hevy | Strong | Fitbod | JEFIT | Boostcamp | Liftosaur | NTC | Fitify | MAC+ | Leap Ev |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Ücretsiz, sınırsız rutin | ✔ D | ✘ (4) | ✘ (3) | ✘ | ✔ reklamlı | ~ | ✔ | ✔ | ~ | ✔ | ~ |
| Reklamsız | ✔ | ✔ | ✔ | ✔ | ✘ | ? | ✔ | ✔ | ✘ | ? | ✘ |
| Hesapsız, tam çevrimdışı | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ | ~ (çevrimdışı var) | ✘ | ~ | ✘ | ~ |
| Set kaydı + önceki set | ✔ D | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✘ | ✘ | ✔ | ✘ |
| Dinlenme sayacı | ~ D (sabit 90 sn, yalnız uygulama içi) | ✔ egzersiz başına | ✔ | ✔ | ✔ | ✔ | ~ (bildirim ücretli) | — | ✔ | ? | ✔ |
| Kilit ekranı/bildirimde sayaç | ~ D (yalnız süreli setlerde) | ✔ iOS canlı etkinlik; Android ? | ? | ? | ? | ? | ✔ ücretli (Android Live Update dahil, K) | — | ? | ? | ? |
| Süperset, drop set | ✘ | ✔ | ✔ (İK) | ✔ (İK) | ? | ? | ✔ | — | — | ? | — |
| RPE/RIR | ✘ | ✔ | ✔ (CSV'de sütun) | ? | ? | ✔ | ✔ | — | — | ? | — |
| Süreli/aralıklı/kardiyo set | ✔ D | ✔ | ✔ | ✔ | ✔ | ? | ✔ | ✔ | ✔ | ? | ✔ |
| Kütüphane boyutu | 324 | "yüzlerce" | ? | ? | 1.400+ | ? | ? | 200+ antrenman | 900+ | "geniş" | ? |
| Medya | animasyon çizgi-adam + 2 kare foto | video | ? | video | video (Elite) | ? | ? | video | video + ses | video | animasyon |
| Türkçe | ✔ | ? | ? | ? | ? | ? | ? | ? | ✔ (TR Play adı) | ✔ | ✔ |
| Otomatik ilerleme önerisi | ✔ D (çift ilerleme) | ~ | ✘ | ✔ | ? | ✔ | ✔ | ✘ | ✔ | ? | ~ |
| Deload / geri düşürme | ✘ | ✘ | ✘ | ✔ toparlanma | ? | ~ programda | ✔ betikle | — | ? | ? | — |
| Hazır programlar | ~ D (Koç, internet + anahtar) | ~ | ✘ | ✔ | ✔ Elite | ✔ çok | ✔ | ✔ | ✔ | ✔ | ✔ |
| Plaka/ısınma hesabı | ✔ D | ? | ✔ | ? | ? | ✔ | ✔ ücretli | — | — | ? | — |
| Rekor ve 1TM | ✔ D | ✔ | ✔ | ? | ? | ✔ | ✔ | ✘ | ✘ | ? | ✘ |
| Egzersiz ilerleme grafiği | ~ D (12 seans 1TM) | ✔ (ücretsizde 3 ay) | ✔ | ✔ | ✔ | ✔ | ✔ ücretli | ✘ | ~ | ? | ~ |
| Kas haritası | ~ (veri var, şekil yok) | ✔ | ? | ✔ | ? | ✔ Pro | ✔ ücretli | ✘ | ? | ? | ✘ |
| CSV içe aktarma | ✘ | ? | ? | ? | ? | ? | ✔ | ✘ | ✘ | ? | ✘ |
| CSV dışa aktarma | ✘ (JSON yedek ✔) | ✔ | ✔ | ? | ? | ? | ✔ | ✘ | ✘ | ? | ✘ |
| Saat | ✘ | ✔ | ✔ (İK) | ✔ | ✔ Elite | ? | ✔ ücretli | ? | ? | ? | ? |
| Sosyal | ✘ (bilinçli) | ✔ | ✘ | ✘ | ✔ | ✔ | ~ | ✘ | ✘ | ✔ | ✘ |
| Otomatik yürüyüş/koşu algılama | ✔ D | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ~ (elle GPS) | ✘ |
| Beslenme ile birlikte | ✔ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ✘ | ~ (öneri) | ✘ |

## 4. b) NeoWell'in gerçekten iyi olduğu yerler

1. **Ücretsiz ve sınırsız**: Hevy 4, Strong 3 rutinle sınırlıyor; Liftosaur plaka hesabını, grafikleri ve dinlenme bildirimini ücretli tutuyor (K). NeoWell'de bunların hepsi ücretsiz ve reklamsız.
2. **Hesapsız ve çevrimdışı salon kaydı**: Kayıt, kütüphane, animasyon, öneri, plaka hesabı, rekor ve zamanlayıcı internetsiz çalışıyor. Hevy ve Strong hesap istiyor (İK).
3. **324 animasyonlu egzersiz, Türkçe, ev/salon/ağırlıksız süzgeciyle**: Leap ve Fitify ev tarafında, Hevy ve Strong salon tarafında. İkisini Türkçe ve ücretsiz birleştiren, incelenenler arasında tek rakip MAC+.
4. **Otomatik yürüyüş/koşu algılama**: İncelenen salon uygulamalarının hiçbirinde yok. Strava ve adidas elle başlatma istiyor.
5. **Salon, beslenme ve sağlık tek uygulamada**: Antrenman günü kaloriyle, kilo trendiyle ve Koç'la aynı yerde.
6. **Koç'tan program**: Ücretsiz sağlayıcıyla yapay zekâ programı. **Uyarı:** internet, kullanıcının kendi API anahtarı ve veri paylaşım onayı gerekir; "çevrimdışı Koç" denemez.

Hepsi telefonda denenmedi. Pazarlamadan önce `yapilacaklar.md` 39, 40, 46, 55, 56 ve kütüphane/zamanlayıcı testleri yapılmalı.

## 5. c) Geride olduğumuz yerler (önem sırasıyla)

1. **Dinlenme sayacı uygulama dışında çalışmıyor.** Ekran kilitlenince ya da başka sekmeye geçince sayaç sessiz kalıyor. Bildirim yok, ekranı açık tutma yok, egzersiz başına süre yok (`gym.js:209-219, 347`). Salonda telefon cepteyken temel beklenti bu. Hevy bunu iOS'ta canlı etkinlikle çözüyor (K), Android'de uygulama dışında ses olmadığı şikâyeti var (İK); Liftosaur Android bildirim çipini para karşılığı satıyor (K).
2. **Şablonlar zayıf.** Elle oluşturulamıyor, düzenlenemiyor, set/tekrar hedefi tutmuyor. Rakiplerin hepsinde rutin editörü var.
3. **Çevrimdışı hazır program yok.** Program yalnız Koç'la, internet ve anahtarla alınıyor. Boostcamp, Liftosaur, Leap ve NTC hazır programla açılıyor.
4. **Süperset, drop set, RPE/RIR yok.** Hevy bunları ücretsizde veriyor (K).
5. **Veri taşıma yok.** Strong ya da Hevy'den gelen kullanıcının geçmişi getirilemiyor, CSV dışa aktarma yok. Reddit'te en çok vurgulanan konu veri sahipliği (İK: setgraph özeti).
6. **İlerleme önerisi kör.** Yalnız son seansa bakıyor. Başarısızlıkta düşürme ya da deload yok; takılınca hep "+1 tekrar" diyor.
7. **Analitik dar.** Grafik yalnız 1TM ve son 12 seans. Hacim grafiği, haftalık/aylık hacim ve vücut haritası yok.
8. **Kendi egzersizi kısıtlı.** Süreli tür, bölge ve ekipman seçilemiyor.
9. **Antrenman kalorisi yok.** Salon seansı yalnız dakika olarak kaydoluyor; enerji dengesi bunu kaloriye çevirmiyor.
10. **Görseller video değil.** 48 şablon var ve `curl` şablonu 29 egzersizde ortak, bu yüzden varyantlar birbirine benziyor. 2 karelik fotoğraf bunu kısmen kapatıyor.
11. **Saat ve Health Connect yok.**

## 6. d) Rakiplerde para ödenen ya da şikâyet edilen, bizim kolay çözebileceğimiz noktalar

| Şikâyet / ücretli duvar | Kanıt | Bizde çözüm | Emek |
|---|---|---|---|
| Rutin sınırı (Hevy 4, Strong 3) | İK: push-pull, sensai | Zaten sınırsız; şablon editörüyle öne çıkar | S |
| Dinlenme bildirimi ücretli (Liftosaur), Hevy'de uygulama dışında ses yok | K: liftosaur premium; İK: justuseapp Hevy yorumları | Mevcut 9001 bildirim yolunu ağırlık setlerine de bağla | S |
| Plaka hesabı ve grafikler ücretli (Liftosaur), grafik geçmişi 3 ay (Hevy) | K, İK | Zaten ücretsiz ve süresiz | — |
| StrongLifts'i kullanmak için abonelik; geçmişin kilitlendiği iddiası | K: App Store yorumu; geçmiş kilidi İK | Hazır 5×5 tarzı program, sınırsız geçmiş | M |
| Veriyi götürememe, yılların kaydını kaybetme | İK: setgraph Reddit özeti | CSV dışa aktarma ve Strong/Hevy CSV içe aktarma | S/M |
| Hevy'de antrenman ortasında rutini güncelleyememe | İK: justuseapp | Bitişte "Şablonu bu antrenmanla güncelle" | S |
| Fitbod ev ekipmanında zayıf ve pahalı | İK: techradar/saashub özeti | Ekipman süzgeci var; hazır ev programı | M |
| Decathlon Coach mesafe/duraklatma hatası | İK: justuseapp, kimola | Hareket algılama otomatik; telefonda doğrulanmalı | — |

## 7. e) Özellik fikirleri

Değer 1-5, emek S/M/L.

| # | Fikir | Değer | Emek | Kanıt | Bağımlılık | Risk |
|---|---|---|---|---|---|---|
| 1 | **Dinlenme bildirimi + ekranı açık tut + egzersiz başına süre** | 5 | S | Hevy canlı etkinlik (K); Liftosaur ücretli (K); Hevy'de uygulama dışında ses yok şikâyeti (İK) | `gNotify` (id 9001) zaten var; ekranı açık tutmak için Capacitor keep-awake eklentisi | Xiaomi'de bildirim gecikmesi; mevcut Xiaomi düzeni kullanılmalı |
| 2 | **Şablon editörü** (elle oluştur, düzenle, set/tekrar hedefi, bitişte güncelle) | 5 | M | Tüm rakiplerde var; Hevy güncelleme şikâyeti (İK) | `S.templates` şeması genişler, `cleanGym` | Eski şablonların geçişi |
| 3 | **Çevrimdışı hazır programlar** (tam vücut 3 gün, üst/alt 4 gün, itiş/çekiş/bacak, ev ekipmansız, 5×5 tarzı başlangıç) | 5 | M | Boostcamp, Liftosaur, Leap; StrongLifts ücretli | Şablon editörü (2) | Marka adı kullanmamalı ("StrongLifts" değil "5×5 başlangıç") |
| 4 | **CSV dışa aktarma** | 4 | S | Reddit veri sahipliği (İK); Strong ve Hevy'de var | Yok | — |
| 5 | **Strong/Hevy CSV içe aktarma** | 4 | M | Strong sütunları: `Date, Workout Name, Duration, Exercise Name, Set Order, Weight, Reps, Distance, Seconds, Notes, Workout Notes, RPE` (İK: thetaperapp, griptapp). Hevy sütunları: `title, start_time, end_time, exercise_title, superset_id, set_index, set_type, weight_kg/lbs, reps, duration_seconds, rpe` (İK: griptapp, openweight) | Ad eşleme: İngilizce adlar → 324 Türkçe kimlik; eşleşmeyen kendi egzersizi olur | lbs/kg ve tarih biçimi; büyük dosyada localStorage sınırı |
| 6 | **Akıllı ilerleme: başarısızlıkta düşürme, takılınca deload önerisi** | 4 | S | Fitbod toparlanma (İK), Liftosaur betik (K) | `Algo.nextTarget` son 2-3 seansa bakar | Yanlış öneri sakatlık algısı yaratır; dil "öneri" kalmalı |
| 7 | **Süperset ve drop set** | 3 | M | Hevy'de ücretsiz (K) | Set modeli, dinlenme mantığı | Arayüz kalabalığı |
| 8 | **RPE/RIR (isteğe bağlı alan)** | 3 | S | Boostcamp ücretsiz, Hevy, Strong CSV | Set modeli; öneri RIR'e göre ayarlanabilir | Yeni kullanıcıya karmaşık; varsayılan gizli |
| 9 | **Egzersiz ilerleme grafikleri** (1TM, en ağır set, hacim; tüm geçmiş) | 4 | S | Hevy ücretsizde 3 ay sınırı (İK) | Mevcut `spark` | — |
| 10 | **Kas haritası** (haftalık 16 bölge, önden/arkadan SVG) | 3 | M | Hevy, Fitbod; Boostcamp Pro ve Liftosaur'da ücretli | `gWeekRegions` hazır | Çizim emeği |
| 11 | **Antrenman kalorisi (MET)** | 3 | S | Samsung süre+kalori (İK) | Kilo trendi var; tür başına MET tablosu | Kaba tahmin; "tahmini" etiketi, enerji dengesine katmak isteğe bağlı |
| 12 | **Rehberli mod** (animasyon + sayaç + sesli komut; ev ve esneme için) | 4 | M/L | NTC, Fitify ve Leap'in ana akışı | Android WebView'de `speechSynthesis` sessiz, yerel TTS eklentisi gerekir (İK: caniwebview, GitHub issue'ları); cihazda Türkçe ses paketi olmayabilir | Ses yoksa titreşim ve metin yedeği |
| 13 | **Isınma/esneme akışları** (5-10 dk, 41 esneme egzersizinden) | 3 | S | Gymshark, NTC mobilite | Rehberli mod (12) ya da süreli şablon | Ağrı/tedavi iddiası olmamalı |
| 14 | **Kendi egzersizi: tür, bölge, ekipman, figür şablonu seçimi** | 3 | S | Hevy ücretsizde 7 ile sınırlı (İK) | `cleanGym` | — |
| 15 | **Hızlı set girişi** (kg/tekrar ± düğmesi, ✓ sonrası sıradaki sete odak) | 3 | S | Strong ve Hevy'nin hızı övülüyor (İK) | Set zaten ~1 dokunuş; kazanç değer değiştirmede | Düşük |
| 16 | **Video yerine animasyon yeterli mi** | — | — | Animasyon ve 2 karelik foto, kayıt sırasında hatırlatma için çoğu kullanıcıya yeter; NTC/Fitify tarzı takip edilen video akışı için yetmez | — | Video üretimi önceki kararla reddedildi (`rekabet-ozellik.md:162`) |
| 17 | *Ek:* **Yerel haftalık antrenman notu** ("bu hafta göğüs 6 set, aralığın altında"), yapay zekâsız | 3 | S | Boostcamp haftalık rapor (İK) | `gWeekRegions` | — |
| 18 | *Ek:* **Ev ekipmanı profili** (eldeki dambıl/plaka ağırlıkları) → öneri ve plaka bu ağırlıklara yuvarlanır | 3 | S | TR'de ev kullanıcısı yaygın (Leap) | `Algo.plates` envanter parametresi zaten var | — |
| 19 | *Ek:* **Antrenman verisini localStorage'dan dosyaya/SQLite'a taşıma** | 3 | M | Uzun geçmişte localStorage 5-10 MB sınırı veri kaybı riski | Yedek yapısı | Göç hatası |

## 8. f) Önerilen ilk 5 ve sıra

Önce mevcut salon özellikleri telefonda denenmeli (yapilacaklar 39, 40, 46, 55, 56).

1. **Dinlenme bildirimi + ekranı açık tut + egzersiz başına süre** (S). En büyük günlük sorun; kod yolu hazır.
2. **Şablon editörü** (M). Hazır programların ön koşulu.
3. **Çevrimdışı hazır programlar** (M). Koç'a ve API anahtarına bağımlılığı kaldırır. Ev ekipmansız program TR'de Leap kitlesine hitap eder.
4. **CSV dışa aktarma + Strong/Hevy içe aktarma** (S+M). Rakipten geçişin kapısı.
5. **Akıllı ilerleme + tüm geçmiş grafikleri** (S+S).

**Vazgeçilecekler:** video üretimi, sosyal akış, saat uygulaması (Health Connect gelene kadar), Fitbod tarzı yapay zekâyla günlük antrenman üretimi (internet ve anahtar ister, hatalı yük önerisi riski taşır).

## 9. g) Sağlık ve hukuk riski

- **Ağrı/sakatlık tavsiyesi verme.** Egzersiz notu yer tutucusu "ağrı" örneği veriyor (`gym.js:242`); egzersiz notları Koç'a gitmiyor, yalnız günlük notlar ve sağlık notu gidiyor (`coach.js:97-98`). Bu metinlerde ağrı geçerse Koç tanı ya da "şu hareketi yap" dememeli. Koç kuralı baş dönmesi, göğüs ağrısı gibi belirtilerde hekime yönlendiriyor (`coachlib.js:109`); kas-eklem ağrısı için de "hareketi bırak, sürerse hekime ya da fizyoterapiste" kuralı eklenmeli.
- **Form iddiası.** İpuçları genel ve şablona özel. "Doğru formu garanti eder" ya da "sakatlığı önler" denmemeli. Kütüphanedeki uyarı (`exui.js:34`) korunmalı, rehberli moda da konmalı.
- **Otomatik ağırlık artışı.** Öneri dili korunmalı. Deload ve düşürme eklenince "zorlanıyorsan düşür" dili güvenliği artırır.
- **Hazır programlar.** Başlangıçta "Sağlık sorunun, gebeliğin ya da yakın zamanda ameliyatın varsa önce hekimine danış" uyarısı olmalı. Program adlarında marka (StrongLifts, Nike vb.) kullanılmamalı.
- **Kalori (MET).** "Tahmini" etiketi taşımalı.
- **Fotoğraflar.** free-exercise-db kamu malı (Unlicense); kaynak notu kalmalı.
- **Koç'tan program ve KVKK.** İstek, profil ve kayıtlarla birlikte yurt dışındaki dil modeli sağlayıcısına (Groq, OpenRouter, Gemini) gider (`coach.js:257`); sağlıkla ilgili verinin yurt dışına aktarımıdır. Veri paylaşım onayına (`settings.consent`) bağlı; onay metni bunu açık yazmalı.
- **Hareket algılama.** Konum izni istiyor; verinin cihazda kaldığı açıkça yazılmalı (KVKK açısından olumlu).

## 10. h) Pazarlama cümlesi

"324 animasyonlu egzersiz, sınırsız şablon, plaka hesabı ve rekor takibi. Hesap yok, reklam yok, ücret yok, salonda internet gerekmez. Yürüyüşünü kendisi algılar, antrenmanını yemeğinle aynı yerde tutar."

Not: "internet gerekmez" kayıt ve kütüphane için doğru; Koç'tan program internet ister.

## Kaynaklar

- Hevy App Store (K): https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350
- Hevy limitleri (İK): https://www.sensai.fit/blog/hevy-review-2026 , https://push-pull.app/blog/push-pull-vs-hevy
- Hevy şikâyetleri (İK): https://justuseapp.com/en/app/1458862350/hevy-workout-tracker-gym-log/reviews
- Strong (İK): https://push-pull.app/blog/push-pull-vs-strong , https://aitoolsbakery.com/blog/strong-app-review/
- Strong CSV (İK): https://thetaperapp.com/articles/how-to-export-strong-data/ , https://griptapp.com/help/import-from-strong
- Hevy CSV (İK): https://griptapp.com/help/export-workouts-from-hevy , https://openweight.dev/migrate/hevy.html
- Fitbod (İK): https://www.sensai.fit/blog/fitbod-review-2026 , https://push-pull.app/blog/push-pull-vs-fitbod
- JEFIT (İK): https://www.gymbird.com/fitness-apps/jefit-app-review , https://www.sensai.fit/blog/hevy-vs-strong-vs-fitbod-vs-jefit
- Boostcamp (İK): https://barbend.com/boostcamp-review/ , https://www.boostcamp.app/pro
- Liftosaur (K): https://www.liftosaur.com/features/premium
- StrongLifts (K): https://apps.apple.com/us/app/stronglifts-5x5-workout-plan/id488580022
- NTC (İK): https://www.garagegymreviews.com/nike-training-club-review
- Fitify (İK): https://play.google.com/store/apps/details?id=com.fitifyworkouts.bodyweight.workoutapp , https://www.sensai.fit/blog/freeletics-vs-betterme-vs-fitify-2026
- Freeletics (İK): https://www.sensai.fit/blog/best-freeletics-alternatives-2026
- Gymshark (İK): https://fitnesstoolsreviewed.com/app-reviews/gymshark-training-review-worth-the-hype-after-testing/
- Cali Move (İK): https://calisthenicsworldwide.com/apps/cali-move-app-review/
- Setgraph, Gravl (İK): https://appllama.io/apps/1209781676/setgraph-gym-workout-tracker , https://www.sensai.fit/blog/gravl-app-review-2026
- Samsung Health (İK): https://setgraph.app/ai-blog/best-free-apps-for-tracking-workouts
- Strava, adidas, Decathlon (İK): https://biketips.com/strava-free-vs-paid/ , https://apps.apple.com/us/app/adidas-running-run-tracker/id336599882 , https://kimola.com/reports/decathlon-coach-app-review-analysis-insights-for-enhancement-app-store-us-146662
- MAC+ (İK): https://www.macfit.com/mac-plus-mobil/ozellikler
- Leap Fitness (İK): https://play.google.com/store/apps/details?id=fitnesscoach.workoutplanner.weightloss
- Reddit özeti (İK): https://setgraph.app/ai-blog/best-workout-tracker-app-reddit
- WebView TTS (İK): https://caniwebview.com/features/web-feature-speech-synthesis/

**Erişilemeyenler:** reddit.com ve old.reddit.com (WebFetch engelli; Reddit şikâyetleri yalnız ikincil özetlerden), Google Play sayfaları (içerik kesik geldi, puanlar alınamadı), Strong App Store sayfası (429), hevyapp.com/pricing ve fitbod.me/pricing (404), Hevy'nin resmî öneri panosu (bulunamadı).
