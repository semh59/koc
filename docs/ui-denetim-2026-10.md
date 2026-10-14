# Arayüz denetimi (2026-10-14)

7 rol ajanı (`.claude/agents/nw-*.md`) salt okunur taradı. Kanıtlar koddan; telefonda doğrulanmadı. Ciddiyet: Y yüksek, O orta, D düşük.

## Kapsam dışı kalanlar (ikinci tur gerekir)
Salon/antrenman akışı, barkod/OCR, Health Connect akışı, modül ekranlarındaki `aria-label` ve yalnız-renk anlamı, TalkBack sırası, tek el erişimi, gün sınırı/saat dilimi, uzun liste, native widget ve bildirim düğmeleri, ekran render'ı (tüm bulgular kod okumasıdır).

## 1. Güvenlik ve veri doğruluğu
| # | Ç | Bulgu | Kanıt |
|---|---|---|---|
| 1 | Y | Baş dönmesi akışında yeme/içme talimatı ve neden tahmini | `modules/coach/coach.js:549` |
| 2 | O | Yüksek ölçüm uyarısı aciliyet vermiyor, değer belirtmiyor, 112 yok | `modules/vitals/vitalsui.js:75` |
| 3 | O | "Tüm verileri sil", fotoğraf deposu silinemese de "silindi" diyor | `main/07-actions.js:50` |
| 4 | O | Uyku/ruh hali/oruç silmede `save()` sonucu denetlenmiyor | `modules/habits/habitui.js:11-14` |
| 5 | D | Günlük kayıt silme ve su sayfası `save()` sonucunu denetlemiyor | `main/06-events.js:20-24` |
| 6 | O | Ham `e.message` kullanıcıya sızıyor | `main/04-sheets.js:157`, `modules/motion/motionui.js:38`, `modules/gym/importui.js:16`, `modules/data/csvreadlib.js:48` |
| 7 | D | Fotoğraf eklerken çift seçim yarışı | `modules/data/photoui.js:78-87` |
| 8 | D | Konum ve kamera hatalarında izin/geçici sorun ayrılmıyor | `modules/habits/ramadanui.js:41`, `modules/pulse/pulseui.js:59` |

## 2. Akış ve eksik özellik
| # | Ç | Bulgu | Kanıt |
|---|---|---|---|
| 9 | Y | Tansiyon/şeker Bugün'de kalıcı değil (3 ekran) | `modules/vitals/vitalsui.js:29-35,126`, `main/03-screens.js:170` |
| 10 | Y | Tansiyon sayfası tek seferde 6 sayı alanı + seans/gün/saat/not | `vitalsui.js:46-56` |
| 11 | Y | Health Connect yalnız "Adım sayar" açıkken ulaşılabilir | `main/03-screens.js:171,46,66`, `modules/pulse/hcui.js:59` |
| 12 | O | Kayıt düzenleme yok (yemek, su, kilo, spor, tansiyon, şeker, tahlil, döngü, ölçü, uyku) | `main/04-sheets.js:112`, `06-events.js:18-20`, `vitalsui.js:127`, `labui.js:52`, `cycleui.js:65`, `measureui.js:35` |
| 13 | O | Besin aramada porsiyon sayfası zorunlu, varsayılanla tek dokunuş yok | `04-sheets.js:130-137`, `06-events.js:27` |
| 14 | O | Şeker sayfası "ne zaman" varsayılanı saate göre tahmin | `vitalsui.js:57-65` |
| 15 | O | Onboarding sonrası Bugün boş | `modules/data/onboardui.js:63-110` |
| 16 | O | Widget var (yama derleme anında: `scripts/patch-android.js:36,69`); yalnız kalan kcal/su/adım ve +bardak. Yemek ve kilo kısayolu yok | `assets/android/NeoWidget.java:90-113` |
| 17 | O | Launcher uzun-basış kısayolu yok | `res/xml` |
| 18 | O | Karbonhidrat/yağ kişisel hedefi yok (doğrulanmadı) | `main/03-screens.js:45-46` |
| 19 | O | Algılanan yürüyüş/koşu yalnız bugün/dün listelenir, kaloriye girer | `modules/motion/motionui.js:69`, `log/entries.js:19` |
| 20 | O | Tahlil gün ekranı, arama ve CSV'de yok | `modules/labs/index.js:2-3` |
| 21 | O | Gizlilik politikası bağlantısı ve "Yanıtı bildir" yok | `docs/privacy-policy.md:8-10`, `docs/kalan-isler.md:6-7` |
| 22 | O | Dışa aktarma seçenekleri dağınık | `main/03-screens.js:96-100,172` |
| 23 | D | Rehber menü önerisi gömülü; "Başka içecek" etiketi kafa karıştırıcı | `coach.js:515`, `03-screens.js:66` |
| 24 | D | Kamera nabzı son 8; geçmiş arama tansiyon/şeker/tahlil/ruh hali notunu taramıyor | `pulseui.js:26`, `log/index.js:31` |
| 25 | D | Başka güne kopyalama yok; kafein ve yağ oranı yok | `04-sheets.js:85` |

## 3. Erişilebilirlik
| # | Ç | Bulgu | Kanıt |
|---|---|---|---|
| 26 | O | Hedefler 44dp (kural 48): geri, gezgin, sheet kapat, adım | `www/app.css:60,119,291,227,228` |
| 27 | O | Anahtar dar | `app.css:257-258` |
| 28 | O | Toast 3,8 sn, geri al 6 sn | `main/04-sheets.js:42` |
| 29 | O | `--kcal`/`--water` metin kontrastı 3,75-4,14 (<4,5); testler yalnız 3:1 | `app.css:5`, `scripts/contrast.test.js:16` |
| 30 | D | Gün göstergesi 32px, yatay modda menü 44, kas haritası 9px | `app.css:124,320,231` |

## 4. Görsel tutarlılık
| # | Ç | Bulgu | Kanıt |
|---|---|---|---|
| 31 | O | `design-language.md` koddan sapmış (yazı ölçeği 12/13 vs 14, token adları, konum); `app.css:1` ölü atıf | `docs/design-language.md:3,15-18`, `app.css:1,18` |
| 32 | O | Sabit değerli satır içi stil (14 yer) | `coach.js:286,632,708`, `motionui.js:68,73`, `guideui.js:15,95,97`, `exui.js:22,82`, `onboardui.js:85`, `privacyui.js:32,46`, `walkui.js:44`, `stepsui.js:66` |
| 33 | O | Boş durum elle yazılmış | `coach.js:654`, `history/historyui.js:53` (kural: `emptyCard()`, `04-sheets.js:59`) |
| 34 | D | Aralık ölçek dışı (6/10/14), düğme sınıfı çoğalması, başlık etiketi karışık, ✓/✔, sabit height | `app.css` genel, `:104,180,236,269,387` |
| 35 | D | Doktor PDF/haftalık tuvalde ham hex (muhtemelen bilinçli) | `insights/doctorlib.js:29-59`, `weeklylib.js:58-88` |

## 5. Türkçe ve ton
| # | Ç | Bulgu | Kanıt |
|---|---|---|---|
| 36 | D | "Kapat/Vazgeç/İptal" karışık; gym'de aynı eylem iki ad | `gym.js:332,497,557`, `medui.js:135`, `labui.js:70`, `index.html:34` |
| 37 | D | Depolama dolu mesajı üç biçim, yalnız birinde "yedek al" | `01-core.js:236,263`, `cycleui.js:92,119` |
| 38 | D | Apostrof biçimi, "kilo/ağırlık", "egzersiz/antrenman/hareket" | `07-actions.js:47`, `03-screens.js:171` |
| 39 | D | Başarısızlık çerçeveli ton | `coach.js:543`, `03-screens.js:137` |

## Olumlu (koru)
Çevrimdışı ve hesapsız çalışma, Türkçe besin, ilaç/tansiyon/şeker/tahlil bir arada, bildirimden tek dokunuş kayıt, geri al yaygın, kilo sayfası son değeri getiriyor, büyük yazı ve reduced-motion destekli, tıbbi cihaz uyarıları açık.

## Eskimiş belge
`docs/competition-ui.md` (2 Eki) güncel değil: kalan kcal, öğün gruplama, tema seçici, "Bugün yapılacaklar", arama kutusu artık var.

## 6. Kullanıcı profilleri turu (14 persona, `nw-kisi-*`)
Puan ve senaryo sonucu: tansiyon hastası 4, çok ilaç 4, diyet hassas 6, Xiaomi 5, telefon değiştiren 5, gizlilik 7, sabırsız 6, tek el 5, rakip göçmeni 6, salon 6, kadın/döngü 5, Ramazan 5, gezgin 5, veri titizi 5. Hiçbiri senaryoyu sorunsuz bitirmedi (diyet hassas ve gizlilik hariç tamamı "Hayır"). Önceki bölümlerdeki bulguları pekiştirenler (düzenleme yok, tansiyon sayfası, geri al süresi, Health Connect kapısı) tekrar edilmedi.

### Güvenlik / sağlık davranışı (karar gerektirir)
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Şeker 250-400 ve tansiyon 140-179 sessiz; kriz kutusu değer söylemiyor, 112 yok | `vitalslib.js:13,106`, `vitalsui.js:75` |
| Y | Hamilelik/emzirme/yeme bozukluğu tek anahtar; "hamilelik" kelimesi kalıcı fren, kaldırılamaz, yedek geri getirir | `onboardui.js:54,86`, `algo.js:140-143`, `coach.js:327-330`, `03-screens.js:199` |
| Y | Boy yoksa BMI kontrolü yok; hedef kilo 25 kabul; bloklu hedef kaydediliyor ve "hedefe kalan" gösteriliyor | `algo.js:144-145`, `onboardui.js:103`, `03-screens.js:41,111` |
| Y | Hiç yemeyen güne "1850 kcal kaldı" | `03-screens.js:48-50` |
| Y | "Tüm verileri sil" yerel tarafı (adım geçmişi, boy/kilo, hareket modeli) silmiyor | `07-actions.js:50`, `StepStore.java:162-164`, `MotionStore.java:27,47` |
| Y | Son uygulamalar önizlemesinde sağlık verisi; engel yalnız kilit açıkken, kilit varsayılan kapalı | `lockui.js:9,54-55` |
| O | Hamilelikte tartı/hareket hatırlatması, hedef kilo, uyarlanabilir harcama değişmiyor | `01-core.js:48-52`, `gym.js:771` |
| O | Haftalık hızlı kilo kaybı uyarısı yok; her sabah tartı önerisi; seri gizlenemiyor; "sayıları gizle" yok | `04-sheets.js:76`, `02-state-components.js:21`, `03-screens.js:248` |
| O | Oruç tek onay kutusuyla açılıyor | `habitui.js:32` |

### İlaç
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Doktor raporunda ilaç listesi yok (yalnız uyum %) | `doctorlib.js:11-17` |
| Y | Bildirimde ilaç adı varsayılan kapalı; 8 ilaç aynı metin | `medlib.js:6,186` |
| Y | Kaçırılan dünkü doz sonradan işaretlenemiyor, uyumu düşürüyor | `medui.js:64,169` |
| Y | Gün aşırı/ayda bir yok; saat başına farklı doz yok | `medlib.js:24-25,39-45` |
| Y | Stok uyarısı yalnız ekranda kart, eşik sabit 5 doz | `medui.js:8,95`, `05-notifications.js:50-53` |
| O | Aç/tok/yemekle yok; aynı saat gruplanmıyor; "ara ver" süresiz; atlanan doz telafi yok; bildirim bütçesi 440 ~18 günde doluyor | `medui.js:124,133`, `medlib.js:5,189-201` |
| O | Aldım/Atla 8px arayla yan yana, Atla onaysız | `medui.js:73,82` |

### Bildirim / alarm güvenilirliği
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Pil/otomatik başlatma "Tamam" öz beyan; `st.bo` okunabiliyor ama kullanılmıyor | `07-actions.js:45`, `05-permissions.js:18`, `medlib.js:254` |
| Y | Kaçan alarm Bugün'de/bildirimde görünmüyor; yeniden başlatma sonrası kurulum bilgisi yok | `medui.js:53` |
| Y | Saat dilimi değişince su/özet bildirimleri eski saatte; ilaç alarmı aynı mutlak ms ile kuruluyor | `05-notifications.js:3,44`, `MedWakeReceiver.java:45,53` |
| O | Rahatsız Etme/sessiz mod davranışı hiçbir yerde yazmıyor; aynı uyarı 3 yerde 3 metin | `MainActivity.java:62`, `03-screens.js:85-87,218` |
| O | Gün sınırı sabit 00:00, ayar yok | `entries.js:6` |

### Ramazan
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Ramazan açıkken su hatırlatması gündüz de geliyor; su hedefi/halka oruçtan bağımsız | `01-core.js:49-51`, `05-notifications.js:40-47`, `03-screens.js:44` |
| Y | İlaç saatleri Ramazan'a bağlı değil (elle) | `ramadanui.js:4`, `medui.js:122-127` |
| O | Hareket 19:30 iftara denk; oruçlu antrenman uyarısı yok; tablo bitince hatırlatmalar sessizce kesilir | `01-core.js:52-53`, `ramadanlib.js:76-78,99-100` |

### Yedek / taşıma
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Fotoğraflar yedeğe girmiyor, yedek ekranlarında yazmıyor | `04-sheets.js:221-227`, `backupui.js:24-30` |
| Y | "Paylaşıldı/Son yedek" paylaşım penceresi açılınca başarılı sayılıyor; geri yükleme onayında tarih ve mevcut kayıt sayısı yok; sürüm uyuşmazlığı "Parola yanlış" der | `share.js:23`, `04-sheets.js:263`, `backuplib.js:19` |
| O | Yarım kalan geri yüklemede anahtarlar eksik kalabilir; rıza/otomatik yedek sıfırlanması söylenmiyor; 5 MB üstü gerçek yedek reddi; "Tüm verileri sil" son yedek tarihi göstermiyor | `04-sheets.js:274-285`, `06-events.js:56`, `07-actions.js:50` |

### Kullanım ve eksik özellik
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Su çift dokunuş iki kayıt, geri al yalnız sonuncuyu siler (tek seviye); ✕ onaysız siler | `07-actions.js:3-8`, `04-sheets.js:41`, `06-events.js:20-24` |
| Y | Salon: yapılmayan set silinemiyor; biten antrenman düzenlenemiyor; hareket başına kg×tekrar dökümü yok | `gym.js:537,559,417-429,272` |
| Y | Makro (protein/karbonhidrat/yağ) gram hedefi girilemiyor; Health Connect antrenman oturumu gelmiyor | `03-screens.js:201-206`, `hcui.js:2,59` |
| Y | Onboarding ilk kayda 4 ekran; "Şimdilik geç" sonrası Bugün'de hedef yok uyarısı yok | `onboardui.js:69-130` |
| Y | Kalori hedefi formülü hiçbir ekranda görünmüyor (Mifflin-St Jeor, çarpan, 7700 kcal/kg) | `gym.js:771-773`, `algo.js:4,60-67` |
| O | Salon: geçmişe antrenman eklenemiyor, rekorlar akordeonda, dinlenme sayacı kalıcı değil, bildirim yanlış hareket adı söylüyor ve Salon'a götürmüyor | `gym.js:530,239,9,53`, `exui.js:111` |
| O | Döngü: günlük belirti yok, dışa aktarma yok, 14 gün sonra açık dönem kapatılamıyor, gecikme bilgisi yok | `cyclelib.js:67-77`, `archivelib.js:4` |
| O | CSV tek sütun karışık birim, 9 ayrı paylaşım, nokta/virgül seçeneği yok, tahlil CSV'de yok, arama kapsamı dar | `log/index.js:20,31`, `privacyui.js:58`, `csvlib.js:2-9` |
| O | Yemek öğün/gün kopyalama yok; tarif içe aktarma yok; hafta karşılaştırması yok | `04-sheets.js:85-88`, `recipeui.js:2,9-12` |
| O | Gizlilik: Rehber önizleme varsayılan kapalı; API anahtarı yedeğe giriyor; arşivler şifresiz | `01-core.js:47`, `backupui.js:7`, `doctorui.js:7` |
| O | Kilo hatırlatma bildirimi kilo sayfasını açmıyor; spor sayfası son tür/süreyi hatırlamıyor | `05-notifications.js:37,47`, `04-sheets.js:206-207` |

## Durum (14 Ekim 2026, kod ve testle; telefonda doğrulanmadı)
Kapandı = kodda yapıldı; testle ya da kod incelemesiyle doğrulandı, ad commit konusudur (#23 ve #35 test dışı). Açık = neden yazılı. Hiçbir madde atlanmadı.

### Bölüm 1-5
| # | Durum | Commit konusu / neden |
|---|---|---|
| 1, 2 | Kapandı | f8109b1 Urgent texts: baş dönmesi kartı yeme talimatı vermez, değer ve 112 yazılı |
| 3 | Kapandı | 1902edb Real delete: yerel adım/hareket/widget/doz verisi silinir, hata "silindi" demez |
| 4, 5 | Kapandı | d01085f One commit() helper for saves: başarısız yazma eski değeri geri koyar |
| 6 | Kapandı | 47c0910 Error text: sabit Türkçe cümle, ham `e.message` yok |
| 7 | Kapandı | 245de78 photo add busy flag |
| 8 | Kapandı | 96c90ee Wording: konum ve kamera hatasında izin reddi ile geçici sorun ayrı metin (wording.test.js) |
| 9 | Kapandı | 7c68086 Today: tansiyon ve şeker çipleri |
| 10 | Kapandı | ee35e8f Entry sheets: tek ölçümlü tansiyon, 2. ölçüm katlı |
| 11, 16, 17 | Kapandı | 8895642 Health Connect kartı adım sayarsız açılır; widget Yemek/Kilo düğmeleri; launcher kısayolları. İftar satırı 7ff2019 |
| 12 | Kapandı | bbc95b4 Edit existing records |
| 13, 14 | Kapandı | ee35e8f tek dokunuş besin ekleme, hatırlanan şeker bağlamı |
| 15 | Kapandı | 7c68086 ilk su ve "hedefini hesapla" satırı, 97c1636 Onboarding tek form |
| 18 | Kapandı | e4f8b68 Macro gram goals (öneri etiketli) |
| 19, 20, 24 | Kapandı | 0674d01 History data: eski yürüyüş/koşu, tahlil, geniş arama; nabız listesi tümünü gösterir |
| 21 | Açık | Gizlilik politikası adresi ve "Yanıtı bildir" e-postası Semih'ten gelmeli (`docs/kalan-isler.md` bölüm 1) |
| 22 | Kapandı | 9483607 Export: tek "Raporlar ve dışa aktarma" sayfası |
| 23 | Kapandı | "Başka içecek" etiketi 7c68086 ile kalktı; menü isteği ayrı sayfada açık düğmedir |
| 25 | Kapandı | 4d8b179 gün/öğün kopyalama; ae40067 kafein ve yağ oranı |
| 26, 30 | Kapandı | e9a01f2 `--hit` 48 token; 3baa579 12 birim kas haritası etiketi |
| 27, 28, 29 | Kapandı | 3baa579 48 px anahtar, 6 s toast (geri al 10 s: 776afae), metin tonları 4,5:1 ve kontrast testi |
| 31 | Kapandı | bee5d07 Design language doc follows the code |
| 32, 33, 34 | Kapandı | e9a01f2 Shared components; 0fd757e tek düğme ailesi, h2/h4 etiket, min-height |
| 35 | Kapandı | 0fd757e canvas renkleri tek nesnede (`Algo.PAGE.c`); beyaz kâğıt için ham hex bilinçli |
| 36 | Kapandı | 96c90ee Wording: onay penceresinde Vazgeç/Tamam, form Vazgeç, yalnız bilgi Kapat; "iptal" sözcüğü kalmadı |
| 37 | Kapandı | 96c90ee Wording: "depolama dolu" geçen her metin yedek almayı söyler (testle taranır) |
| 38 | Kapandı | 96c90ee Wording: tek apostrof (Rehber'i dahil), egzersiz/antrenman/kilo sözlüğü; "ağırlık" yalnız kaldırılan yük ve besin tartısında |
| 39 | Kapandı | 2c5b271 nötr plato tonu; 96c90ee ve devamı: su ve hareket ipucu hüküm vermez |

### Bölüm 6
| Grup | Durum | Commit konusu / neden |
|---|---|---|
| Sağlık: yüksek şeker/tansiyon | Kapandı | f8109b1 |
| Hamilelik/emzirme/ED | Kapandı | f06e7a8 ayrı bayraklar, kullanıcı onayıyla kalkar, yedek geri getirmez |
| BMI, hedef kilo, boş gün, hızlı kayıp, seri/sayı gizleme, oruç sorusu | Kapandı | 2c5b271 Goal safety |
| Tüm verileri sil yerel taraf | Kapandı | 1902edb |
| Son uygulamalar önizlemesi, kilit | Kapandı | 245de78 hide-recents ayrı ayar, kurulumda kilit sorusu |
| İlaç: doz modeli, stok, geçmiş doz, düğmeler, bildirim | Kapandı | 80ac7cf, 02b77b4, d66c2e1; doktor raporu ilaç tablosu 626f7f8 |
| Bildirim ve alarm: saat dilimi, gerçek durum, sihirbaz, dokunuşlar, gün sınırı | Kapandı | 7875a87, d5f5fbe, d3a56d7, 3ef9d92, 5a3e6fe |
| Ramazan | Kapandı | f64e3e2, 1b1e1e8, 7ff2019 |
| Yedek ve taşıma | Kapandı | e9995a0 (20 MB üstü dosya "yedek olmayabilir" iletisiyle reddedilir), 4c7e683 |
| Su, silme, geri al | Kapandı | 776afae Undo stack |
| Salon | Kapandı | be01d44, 9deb3c1, 1840a05, 9cac556, b89fcd4 |
| Makro hedefi, onboarding, kcal formülü | Kapandı | e4f8b68, 97c1636, 4d8b179 |
| Health Connect antrenman oturumu | Açık | Yeni okuma izni Play beyanını değiştirir ve Java yalnız CI'da derlenir (`docs/kalan-isler.md` bölüm 5) |
| Döngü: günlük belirti, açık dönem, gecikme | Kapandı | 364cb9b |
| Döngü dışa aktarma | Açık (bilinçli) | Döngü kaydı yalnız şifreli yedekte; CSV ve arşive girmez, testi var |
| CSV, kopyalama, tarif, hafta karşılaştırma | Kapandı | 9483607, 4d8b179, ae40067 |
| Gizlilik: önizleme, API anahtarı yedeği, arşiv parolası | Kapandı | 245de78 |
| Kilo bildirimi, spor sayfası hatırlaması | Kapandı | 3ef9d92, ee35e8f |

### Grafikler (plan P9.4)
Kapandı: d4edf76 kilo, çubuk, tansiyon/şeker ve ölçü grafiği; egzersiz ve adım grafiği bu turda (balonda gün, "tüm değerler" tablosu, ekran okuyucu değeri; chart-table.test.js). Tahlil grafiği plan gereği ikinci tur kapsamında (açık).
