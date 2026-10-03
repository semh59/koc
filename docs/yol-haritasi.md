# Yol haritası: eksikler (2 Ekim 2026)

Kod durumu `9953416`. Kaynaklar: oneri-listesi, plan-6-ozellik, rekabet-ozellik, rekabet-arayuz, rekabet-egzersiz, yapilacaklar, adim-arastirma, akilli-gps-tasarim, fikirler, besin-arastirmasi, git log ve kod denetimi. Yapılmış özellikler listelenmez. Her madde tek yerde durur; E ve G bölümleri yalnızca kimlik verir.

Emek: S ≤ yarım gün, M ≈ 1 gün, L > 1 gün. "Bağımlılık / karar" sütunu önce gelmesi gereken maddeyi ya da G'deki kararı gösterir.

## A) Telefonda doğrulama bekleyenler
Ayrıntı ve test adımları `yapilacaklar.md`'de. Telefonda denenen tek özellik barkod okutma.

- A1 Adım sayar: gece kapanışı, 23:58 örneği, geç alarm
- A2 Elle adım ve "sayım durdu" kartı
- A3 Hareket algılama (GPS'siz) ve elle yürüyüşte ön plan GPS penceresi
- A4 Bildirimler uygulama kapalıyken (Xiaomi), su hedefi dolunca susma
- A5 Su bildirimindeki "+250 ml" düğmesi ve MIUI'de tekrar teslim
- A6 Widget: ekleme, +250, dokunma, gün değişimi, dar boyut, çift su
- A7 İlaç hatırlatıcı ve alarm, 6 sekmenin 360 px'e sığması
- A8 Tansiyon ve şeker, doktor raporu PDF'i
- A9 Tahlil: PDF'ten ve fotoğraftan okuma
- A10 Etiket okuma ile lif, şeker ve sodyum
- A11 Aykırı tartı, Dünkünü tekrarla, son yenilenler, favoriler, öğün şablonları
- A12 Haftalık rapor PDF'i ve Pazar özet bildirimi (soğuk açılış dahil)
- A13 Drive yedeği, geri yükleme, Pazar hatırlatması
- A14 Oruç, uyku, ruh hali
- A15 "Neden" kartı, plato sorusu, Koç program kartı
- A16 Salon: plaka ve ısınma, tekrar aralığı, set anında rekor, geçmiş ve Bugün kartı, işaretsiz setler, süreli ve kardiyo gösterimi
- A17 Egzersiz kütüphanesi, animasyon, süreli set zamanlayıcısı (test maddesi yok, yapilacaklar'a eklenmeli)
- A18 Bugün ekranının küçük ekrana sığması

## B) Hatalar ve güvenlik/uyum borçları (kritik önce)
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| B1 (yapıldı) | İlaç dozuna pay süresi | Birkaç dakika geciken doz "kaçırılan" sayılıp doktor PDF'ine yazılmaz (`medlib.js:74`, `weeklylib.js:43`). | S | rekabet-arayuz | G6 |
| B2 (yapıldı) | Kontrast düzeltmesi | Koyu temadaki 1,98:1 "Geri al" ile `--mut`, `--warn`, turuncu ve grafik çizgileri AA düzeyine çıkar. | S | rekabet-arayuz | – |
| B3 (yapıldı) | "Neden kilo vermedim" koşulu | Düğme ve Koç çipi yalnız son 14 günde trend düz ya da artarken görünür, kilo verene çıkmaz. | S | rekabet-arayuz | – |
| B4 (yapıldı) | Trend'de tek tahmin, tek hız | "~11 hafta / ~9 hafta" ve iki hız tanımı yerine tek, koşulu yazılı tahmin gösterilir. | S | rekabet-arayuz | – |
| B5 (yapıldı) | `allowBackup` kapatma | Sağlık verisinin Google otomatik yedeğine gitmesi engellenir, "veri telefonda" vaadi doğru olur. `allowBackup="false"` + `dataExtractionRules`/`fullBackupContent` ile bulut yedeği ve cihaz aktarımı kapalı; CI APK manifestini denetler. Şifreli yedek dosyası etkilenmez. | S | akilli-gps, AndroidManifest.xml:5 | G8 |
| B6 (yapıldı) | KVKK aydınlatma, açık rıza, gizlilik politikası | Koç'a onayın yurt dışı aktarım olduğu açıkça yazılır, Play şartı karşılanır. | M | rekabet-ozellik §9 | G7 |
| B7 (yapıldı) | Koç ve program güvenlik metinleri | Ağrı, ilaç ve programlarda "hekime / eczacıya / fizyoterapiste danış" kuralları eklenir. SYSTEM'e kural 10-12 (ağrı/sakatlık, ilaç/takviye, program: gebelik, 18 yaş altı, yeme bozukluğu); Koç program kartı ve hazır programlar aynı notu (`gPgNote`) gösterir. | S | rekabet-egzersiz §9, rekabet-ozellik §9 | – |
| B8 (yapıldı) | Depolama sınırı uyarısı | localStorage (5-10 MB) dolmadan boyut ölçülüp uyarılır, uzun geçmişte sessiz veri kaybı önlenir. Tüm anahtarlar ölçülür, 3,5 MB üstünde Bugün ve Ayarlar > Veriler'de uyarı; kota hatasında her seferinde mesaj ve kalıcı uyarı, değişiklik bellekte kalır, yedek ekranı onu alır. Toplu "eski kayıtları temizle" aracı yok (ayrı iş). | S | rekabet-egzersiz #19 | – |
| B9 | Release imzası | Debug anahtarı yerine saklanan bir release anahtarıyla imzalanır. | S | android/app/build.gradle:9 | G3; imza değişince yerinde güncelleme olmaz: önce şifreli yedek, sonra yeniden kurulum |
| B10 | targetSdk 34 yükseltmesi | Play'in güncel hedef API şartı karşılanır (değer doğrulanacak). | L | android/variables.gradle | G12; Capacitor sürüm atlaması gerekebilir |
| B11 (yapıldı) | Play izin uyumu | Arka plan konumu, `USE_EXACT_ALARM` ve konum servisi için beyan hazırlanır ya da gereksiz izin kaldırılır. `USE_EXACT_ALARM` ve `FLASHLIGHT` kaldırıldı; tam saat izni yoksa uyarı + yeniden kurulum; konum izninden önce açıklama ekranı; beyanlar `docs/play-izin-beyanlari.md`. 3 Ekim 2026: `ACCESS_BACKGROUND_LOCATION` ve otomatik GPS kaldırıldı; konum yalnız elle başlatılan yürüyüşte, uygulama görünürken başlayan konum servisiyle; CI APK'da arka plan konumunu görürse durur. Kalan: ön plan servisi beyanı (kısa video). | S | AndroidManifest.xml | – |

### İnceleme düzeltmeleri (Dalga 11)
Android yerel katman ve veri bütünlüğü incelemesi (3 Ekim 2026):
- **A1 (ertelendi, kritik): bildirim düğmesi sahteciliği.** `MainActivity` exported; herhangi bir uygulama `am start … --es LocalNotificationUserAction su|med|medskip` ile sahte su/ilaç kaydı yazdırabilir. Tasarım: `nw_quick`'te rastgele token (SecureRandom, 128 bit), `QuickLog.getToken`; `scheduleReminders` (`index.html`) su ve ilaç (`medlib.js` extra) bildirimlerinin `extra.k`'sına koyar; `handle` token'ı yalnız MainActivity yolunda denetler (WaterReceiver widget yolu token'sız kalır, exported=false). Geçiş: açılışta `scheduleReminders` 9001-9003 dışındaki tüm bekleyenleri iptal edip yeniden kurduğu için bekleyenler ilk açılışta token alır; yalnız güncellemeden önce teslim edilmiş bildirimin düğmesi sessizce yoksayılır (dokunma uygulamayı açar), kabul edilebilir. smoke.sh token'ı `run-as … cat shared_prefs/nw_quick.xml` ile okuyup kullanmalı, token'sız/yanlış token'la `nw_quick.xml` değişmemeli. Ertelenme nedeni: JS tarafı `index.html` ve `medlib.js`'te, o dosyalar bu dalgada başka işte; yalnız Java denetimi tüm su/Aldım/Atla düğmelerini öldürürdü.
- **A2 (kısmen): otomatik yedek.** Yapıldı: budama az önce yazılanı hariç tutar (saat geri alınınca yeni dosya silinmez), `wt` desteklemeyen sağlayıcıda sil-oluştur-`w`, klasör değişince/kapatınca yalnız eski klasörün izni bırakılır. Ertelendi: otomatik yedeğe ayrı önek (`neowell-oto-YYYY-MM-DD.json`) ve elle yedeğe hiç dokunmama; `app.test.js` (D-Veri2 bloğu) otomatik yedeğin `neowell-yedek-` adını sınıyor, değişiklik o testle birlikte yapılmalı.
- **A3 (yapıldı): sesli komut kesilmesi.** Kısa komut (≤20 karakter) sıraya eklenir, uzun evre cümlesi eskisini keser; 10 sn'den kısa dinlenme ve hazırlıkta yalnız "Sıradaki: <ad>".
- **A4 (yapıldı): smoke çökme denetimi.** crash tamponunda uygulamanın Java/yerel çökmesi her logcat temizliğinden önce ve sonda aranır. Emülatör API 33'te kaldı (API 34 riski yapılacaklar'da).
- **A5 (yapıldı): gece yarısı adım yarışı.** Adım değeri, gün anahtarı ve zaman aynı sayaç örneğinden; geçiş olayı ile okuma gece yarısının iki yanındaysa zaman sayacın gününe çekilir.
- **A6 (yapıldı): yanıltıcı güvenlik notu** (`patch-android.js`, `plan-6-ozellik.md` 10.1 tuzak 4).

Uygulama katmanı incelemesi (5 Opus incelemesi, 3 Ekim 2026). İşaret: [x] yapıldı, testli.
- [x] **1 test güvenilirliği:** `app.test.js` tek sıralı zincir (yedek şifreleme bloğu await), ortak başlangıç ve `reset()`, `notifTest` await, son satır sayacı (en az 856 test) ve unhandledRejection çıkış 1; kasıtlı FAIL çıkış 1 verir. Diğer test dosyalarında eşzamanlı zincir yok.
- [x] **2 Tüm verileri sil:** güvenlik kopyası, bozuk kopya ve API anahtarları da silinir (onay metni söyler); kategori silme güvenlik kopyasını da siler.
- [x] **3 Adım silme:** `stepsFrom` (silme günü sonrası) ile sensör geçmişi geri yazılmaz, süren yürüyüş (`S.walk`) silinir. Silinen gün ve bugün için sensör değeri yeniden yazılmaz.
- [x] **4 Geri yükleme depolaması:** önce yeni veri, sonra güvenlik kopyası (sığmazsa atlanır); depolama ölçüsü kopya ve bozuk kopyayı saymaz.
- [x] **5 Koç besin kartı:** temizleyici `card.f` biçimini okur, kart yeniden yüklemede kalır.
- [x] **6 18 yaş altı:** tek kapı `coachOn` (onay ve yaş); `cAsk` dahil tüm gönderim yolları, yaş ayarı, yedekten dönüş ve açılış temizleyicisi onayı düşürür.
- [x] **7 İlaç başlangıcı:** ilaca `s`, saate `ts` yazılır; uyum, günün dozları ve bildirimler bunlardan öncesini saymaz (eski kayıt eskisi gibi, düzenlenince geçmişi bozulmaz). İlaçlar satırı 360 px'te ad geniş, durum alt satır.
- [x] **8 İlaç bildirimine dokunma:** gerçek `act:"med"` extra'sı İlaçlar'ı (kapalıysa Daha fazla) açar.
- [x] **9 Onay metni:** `CONSENT_SENT` ve `CONSENT_NOT` tek kaynak, politika §5 aynı metin (testle eşit), `CONSENT_V=2`. Politika §9: parola Drive ve otomatik yedekte zorunlu (en az 6), paylaş/kopyada isteğe bağlı; yani "isteğe bağlı" yalnız o yolda doğru kalır. §2 tabloya vücut ölçüleri ve tarifler eklendi.
- [x] **10 isLosing:** 28 gün, en az 3 tartı ve 14 gün yayılım; veri yetersizse "neden" sorusu ve plato çıkmaz.
- [x] **11 Bağlam boyutu:** ilaç 8 satır, yemek 12 satır, geçmiş 300 karakter üst sınırları; gerçek sınır ve ölçüm `plan-6-ozellik.md` 2.2 notunda.
- [x] **12 Küçükler:** boş "not:" satırı, tansiyon bandı 135/85 ve metin, karbonhidrat/yağ eksik öğün notu, menü %15 sapma ve kalori açığı onayı, Koç porsiyon besini tarifte porsiyon olarak, rehberli süre tavanı 7200 sn.

## C) Arayüz ve tasarım
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| C1 (yapıldı) | Bugün'ü sadeleştir | Kayıt düğmeleri ilk ekrana gelir, kilo kartı küçülür, ilaç/oruç/ölçüm tek "Bugün yapılacaklar" listesinde, halkalarda birim ve "kalan". | M | rekabet-arayuz | – |
| C2 (yapıldı) | Onboarding | 3 adımda kilo, hedef, boy, yaş ve modüller sorulur, kişisel kalori ve protein hedefi hemen çıkar. | M | rekabet-arayuz | – |
| C3 (yapıldı) | Ayarlar alt sayfaları | ~5.000 px'lik tek sayfa Profil · Modüller · Hatırlatmalar · Koç · Veri ve yedek · Hakkında olarak bölünür. | M | rekabet-arayuz | – |
| C4 (yapıldı) | Yemek ekle ve günlük | Arama en üste çıkar, günlük öğüne göre gruplanır, su tek satırda birleşir. | M | rekabet-arayuz | – |
| C5 (yapıldı) | SVG ikon seti | Emoji yerine tek renkli, `aria-hidden` ikonlar ve etkin sekmede renk kullanılır. | M | rekabet-arayuz | – |
| C6 (yapıldı) | Dokunma hedefleri ve hata yeri | Tüm hedefler 44 px olur, hata mesajı balon yerine alanın altında çıkar. | S | rekabet-arayuz | – |
| C7 (yapıldı) | Koç ilk izlenimi | Anahtar yokken "API" demeyen tanıtım ekranı ve adım adım anahtar rehberi gösterilir. | M | rekabet-arayuz, rekabet-ozellik | – |
| C8 (yapıldı) | Trend ekranı | Boş durum kartı, veriye göre eksen, dokununca değer balonu ve tek "Raporlar" bölümü eklenir. | M | rekabet-arayuz | – |
| C9 (yapıldı) | Salon ekranı | Filtreler alt sayfaya, boş set önceki değerle onaylanır, şablon önce önizlenir, "tek" yerine "tekrar" yazılır. | M | rekabet-arayuz | – |
| C10 (yapıldı) | Kilo girişi | Son kilo önceden yazılı gelir, ±0,1 düğmesi ve turuncu "Yine de kaydet" uyarısı eklenir. | S | rekabet-arayuz | – |
| C11 (yapıldı) | Grafik okunurluğu | Tansiyon çizgileri etiketli ve eşik bandlı, adım grafiğinde "Cu/Ct/Pz/Pt", renkler tutarlı olur. | S | rekabet-arayuz | – |
| C12 (yapıldı) | Tutarlılık paketi | Tek tarih biçimi, başlıkta küçük "‹" geri ve Sistem/Açık/Koyu tema seçici gelir. | S | rekabet-arayuz | – |
| C13 (yapıldı) | Haftalık PDF'e grafik | Boş yarım sayfaya kilo ve tansiyon grafikleri eklenir. | S | rekabet-arayuz | – |
| C14 (yapıldı) | 5 sabit sekme | Bugün ilk sekme olur, koşullu sekmeler kalkar, "Daha fazla" sekmesi gelir. | L | rekabet-arayuz §d | G9 |

## D) Yeni özellikler

### Beslenme
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| D-Bes1 | Besin veritabanı ~106 → ~500 | Kullanıcının "bulamadım" demesi azalır (150'lik partilerle). | L | rekabet-ozellik, besin-arastirmasi | G13 |
| D-Bes2 (yapıldı) | Kendi tarifim | Malzemeden tarif hesaplanır, Türk mutfağındaki tarif farkını kullanıcı kapatır. | M | rekabet-ozellik | – |
| D-Bes3 (yapıldı) | Yemeklerde aralık | Türk yemeklerinde tek sayı yerine aralık gösterilir (180-260 kcal). | S | besin-arastirmasi | – |

### Antrenman
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| D-Ant1 (yapıldı) | Dinlenme bildirimi | Sabit 90 sn ve yalnız Salon açıkken çalışan sayaç bildirimli, ekranı açık tutan ve egzersiz başına ayarlı olur. | S | rekabet-egzersiz #1 | – (DeviceHelp.keepAwake, eklentisiz) |
| D-Ant2 (yapıldı) | Şablon editörü | Şablon elle oluşturulur, düzenlenir, set/tekrar hedefi tutar, bitişte güncellenir. | M | rekabet-egzersiz #2 | – |
| D-Ant3 (yapıldı) | Çevrimdışı hazır programlar | Koç ve anahtar olmadan 5 hazır program (ev ekipmansız dahil) sunulur. | M | rekabet-egzersiz #3 | D-Ant2 |
| D-Ant4 (yapıldı) | Strong/Hevy CSV içe aktarma | Rakipten gelen kullanıcının geçmişi taşınır. | M | rekabet-egzersiz #5 | – |
| D-Ant5 (yapıldı) | Akıllı ilerleme | Son 2-3 seansa bakılır, başarısızlıkta düşürme ve deload önerilir. | S | rekabet-egzersiz #6 | – |
| D-Ant6 (yapıldı) | Tüm geçmiş grafikleri | 1TM, en ağır set ve hacim tüm geçmişte çizilir. | S | rekabet-egzersiz #9 | – |
| D-Ant7 (yapıldı) | Süperset ve drop set | Rakiplerin ücretsiz verdiği set türleri eklenir. | M | rekabet-egzersiz #7 | – |
| D-Ant8 (yapıldı) | RPE/RIR | Varsayılan gizli, isteğe bağlı zorluk alanı eklenir. | S | rekabet-egzersiz #8 | – |
| D-Ant9 (yapıldı) | Kas haritası | Hazır 16 bölgelik haftalık set verisi önden/arkadan SVG ile gösterilir. | M | rekabet-egzersiz #10 | – |
| D-Ant10 (yapıldı) | Antrenman kalorisi (MET) | Salon seansı "tahmini" etiketli kaloriye çevrilir. | S | rekabet-egzersiz #11 | G11 |
| D-Ant11 (yapıldı) | Kendi egzersizi genişletme | Kendi egzersizine tür, bölge, ekipman ve figür seçilebilir. | S | rekabet-egzersiz #14 | – |
| D-Ant12 (yapıldı) | Hızlı set girişi | kg/tekrar ± düğmeleri ve ✓ sonrası sıradaki sete odak eklenir. | S | rekabet-egzersiz #15 | – |
| D-Ant13 (yapıldı) | Yerel haftalık antrenman notu | Yapay zekâsız "bu hafta göğüs 6 set, aralığın altında" notu çıkar. | S | rekabet-egzersiz #17 | – |
| D-Ant14 (yapıldı) | Ev ekipmanı profili | Öneri ve plaka hesabı eldeki dambıl ve plakalara yuvarlanır. | S | rekabet-egzersiz #18 | – |
| D-Ant15 (yapıldı) | Rehberli mod ve esneme akışları | Animasyon, sayaç ve sesli komutla takip edilen ev ve esneme antrenmanı sunulur. | L | rekabet-egzersiz #12, #13 | yerel TTS eklentisi |

### Adım ve hareket
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| D-Adım1 | Health Connect keşfi | Kitaplık, minSdk, Kotlin köprüsü ve manifest öğeleri doğrulanıp boş eklentiyle CI yeşil alınır. | S | plan-6 §9 (6.0) | G1 |
| D-Adım2 | Health Connect okuma | Saat/bant adımı (telefonla max, asla toplam), uyku ve nabız uygulamaya gelir. | L | plan-6 §9 (6.1-6.2) | D-Adım1, G1 |
| D-Adım3 (yapıldı) | Elle yürüyüş başlat/durdur | Tek yürüyüşün mesafe, süre ve kalorisi elle ölçülür. | M | oneri #3, adim-arastirma | – |
| D-Adım4 (yapıldı) | Hareket kalorisini hedefe ekleme | Varsayılan kapalı bir ayarla yakılan kalori günlük hedefe eklenir. | S | oneri #5 | G11 |
| D-Adım5 (yapıldı) | Aylık adım grafiği ve adım serisi | 14 günlük grafiğe aylık görünüm ve adım hedefi serisi eklenir. | S | oneri #6 | – |
| D-Adım6 (yapıldı) | Uzun hareket aralığını bölme | 4 saati ya da gece yarısını aşan aralık atılmak yerine gün sınırında bölünür. Gece yarısında ve 3 saatte bir açık aralık kontrol noktasında kapatılıp yeniden açılır; günler arası dilim (adımı bilinmez) atılır, orantıyla paylaştırılmaz. | S | akilli-gps "Bilinen sınırlar" | – |

### Sağlık kayıtları
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| D-Sağ1 (yapıldı) | Bel çevresi ve vücut ölçüleri | Kilo sabitken ilerleme görünür. | S | oneri #14, fikirler | – |
| D-Sağ2 | Adet döngüsü | Yerel, gizli ve bildirimli döngü takibi eklenir. | M | fikirler, rekabet-ozellik | G10 |
| D-Sağ3 | Tahlil okuyucuyu sağlamlaştırma | Gerçek laboratuvar PDF'leriyle ayrıştırıcı düzeltilir, taranmış PDF için OCR eklenir. | M | yapilacaklar, oneri | G4 |

### Koç ve yapay zekâ
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| D-Koç1 (yapıldı) | Menü önerisi ve alışveriş listesi | Koç hedef kaloriye ve "Benim besinlerim"e göre haftalık menü önerir. | M | rekabet-ozellik, fikirler | kullanıcının anahtarı ve onayı |

Koç kurulum rehberi C7'de, güvenlik metinleri B7'de.

### Veri, yedek, dağıtım
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| D-Veri1 (yapıldı) | CSV dışa aktarma | Antrenman ve kayıtlar tablo olarak dışa aktarılır. | S | rekabet-egzersiz #4 | – |
| D-Veri2 (yapıldı) | Otomatik şifreli yedek | Yedek haftalık olarak seçilen klasöre ya da Drive'a kendiliğinden gider. Ayarlar > Veri ve yedek > Otomatik yedek (varsayılan kapalı): SAF ile seçilen klasöre (kalıcı izin yalnız ona, `BackupFolderPlugin`) uygulama açılışında ve dönüşünde son otomatik yedek 7 günden eskiyse aynı şifreli biçimde `neowell-yedek-YYYY-MM-DD.json` yazılır, en yeni 4 kalır. Parola Drive yedeğindeki gibi Keystore ile şifreli saklanır; yalnız Keystore anahtarı kullanılmadı çünkü dışarı çıkarılamaz, telefon kaybolunca yedek açılamazdı. Arka plan işi yok (veri WebView'da). Yazma hatası Bugün'de ve Veri ve yedek'te görünür, kapatma önerilir. | M | rekabet-ozellik §7 | – |
| D-Veri3 (yapıldı) | APK boyutu (76 MB) | APK analiz edilip küçültülür. Ölçüm (son sürüm, sıkıştırılmış): ML Kit yazı tanıma .so 41 MB (4 ABI), gömülü barkod .so 18 MB, `lib/x86` 17 MB, `www/ex` 7,6 MB, dex 4,5 MB. Yapılan: 32 bit x86 çıkarıldı, kullanılmayan gömülü barkod motoru paketlenmiyor; tahmini 76,3 → ~46,6 MB (CI her derlemede bileşen dökümü yazar). Yapılmayan: R8/shrinkResources (debug derleme, Capacitor yansıma riski, cihaz testi yok, kazanç ≤4 MB), yazı tanımayı Play hizmetlerinden indirmek (çevrimdışı vaadi ve smoke OCR testi bozulur, ~29 MB), webp zaten kalite 55. | S | kullanıcı notu, ölçüm | – |
| D-Veri4 (yapıldı) | Gizlilik paneli, kategori bazlı silme | Yalnız su ya da yalnız not gibi seçerek silme ve verinin nerede durduğu gösterilir. | M | fikirler | – |

### Pazarlama ve mağaza
| # | Ad | Değer | Emek | Kaynak | Bağımlılık / karar |
|---|---|---|---|---|---|
| D-Paz1 | Play Store yayını | Uygulama bulunur ve güvenilir hale gelir; en büyük tek rekabet açığı kapanır. | L | rekabet-ozellik §5, §7 | B5, B6, B9, B10, B11, G3; kapalı test süresi (doğrulanacak) takvim beklemesi getirir |
| D-Paz2 | Mağaza metni ve iddia denetimi | Kanıtsız iddia ("kilo verdirir", "daha doğru adım", "çevrimdışı Koç") olmadan metin ve kaynak notları hazırlanır. | S | rekabet-ozellik §8-9, rekabet-egzersiz §10 | – |

## E) Önerilen uygulama sırası
Her dalga bir M ya da iki S (~1 gün). Semih A listesini Dalga 1'le paralel yürütür; bulunan hatalar sıradaki dalgaya girer.

1. **Güven düzeltmeleri:** B1, B2. Doktora yanlış veri gitmesi ve görünmeyen "Geri al" en kritik iki sorun.
2. **Trend tutarlılığı:** B3, B4. Kilo verene "vermedin" demek ve çelişen tahminler güveni bozuyor.
3. **Bugün ekranı:** C1. Asıl iş olan kayıt kaydırmadan yapılabilir hale gelir.
4. **Onboarding:** C2. Yeni kullanıcı ilk dakikada kişisel hedef görür.
5. **Salonda dinlenme ve ilerleme:** D-Ant1, D-Ant5. Telefon cepteyken çalışan dinlenme sayacı salondaki en büyük günlük eksik.
6. **Şablon editörü:** D-Ant2. Hazır programların ön koşulu.
7. **Hazır programlar:** D-Ant3. Salon tarafı Koç'a ve API anahtarına bağımlı olmaktan çıkar.
8. **Gizlilik borçları:** B5, B7. Kod küçük; mağaza ve KVKK işinin teknik zemini.

Sıradaki adaylar (dalga dışı, sırayla): C6, D-Veri1, B11, D-Veri3, B6 (G7), B9 (G3), C3, C5, C12, D-Bes1-3. Play yayını (B10, D-Paz1) G3 ve G12'ye bağlı, kapalı test beklemesi nedeniyle erken başlatılmalı. Health Connect (D-Adım1-2) G1'e bağlı.

## F) Vazgeçilenler
- **Fotoğraftan yemek tahmini (Koç ile dahil):** Semih 1 Ekim'de iptal etti; görsel model güvenilmez ve veriyi sağlayıcıya gönderir.
- **Sosyal akış ve topluluk:** sunucu ve moderasyon gerektirir, gizlilik vaadini bozar.
- **Hesap, bulut eşitleme, web:** "veri telefonda" vaadiyle çelişir; otomatik şifreli yedek (D-Veri2) yeterli.
- **İnsan diyetisyen ve hazır diyet listeleri:** sorumluluk riski.
- **İlaç etkileşimi, tahlil yorumu, tanı:** tıbbi cihaz sınıflaması riski; "yalnızca kayıt" kararı korunur.
- **Oyunlaştırma ve rozet yarışı:** değeri düşük, yeme bozukluğu riski; basit günlük seri zaten var.
- **Vitamin ve mineral takibi:** Türk ürünlerinde veri yok, yanıltıcı kısmi toplam üretir (plan-6 kapsam kararı).
- **Adım algoritmasını daha da inceltmek:** aynı sensörün doğruluk tavanı var; emek Health Connect'e gider.
- **Video egzersiz üretimi:** maliyet yüksek, animasyon ve fotoğraf yeterli.
- **Saat uygulaması (Wear OS):** Health Connect okuması yeterli.
- **Yapay zekâyla günlük antrenman üretimi (Fitbod tarzı):** internet ve anahtar ister, hatalı yük riski taşır.
- **Sürekli GPS ve rota haritası:** pil yer; konum noktası saklanmaz.
- **Doze'da toplu gelen ve yeniden başlatmada yarım kalan hareket aralıklarını atmak:** bilinçli kabul, yanlış kayıttan iyidir.
- **TürKomp verisini toplu kopyalamak:** izin olmadan yapılmaz.
- **iOS ve çok dil:** önce Türkiye'de Play yayını.

## G) Kullanıcıdan gereken kararlar ve girdiler
| # | Soru | Etkilediği |
|---|---|---|
| G1 | Mi Band ya da saat var mı, verisi Health Connect'e yazılıyor mu (Mi Fitness/Zepp)? | D-Adım1, D-Adım2 |
| G2 | Pazar 20:30 haftalık özet bildirimi varsayılan açık kalsın mı? (Şu an açık, `index.html:333`.) | A12 |
| G3 | Play Console geliştirici hesabı açılacak mı (bireysel mi kurumsal mı, ücret ve kimlik doğrulama)? Release anahtarı nerede saklanacak? | B9, D-Paz1 |
| G4 | Kişisel bilgileri karartılmış gerçek bir tahlil PDF'i | A9, D-Sağ3 |
| G5 | D: sürücüsündeki eski NeoWell klasörleri silinsin mi, arşivlensin mi? Olası sızmış token'lar iptal edilip yenilensin mi? | güvenlik |
| G6 | İlaç pay süresi: 2 saat mi, gün sonu mu? | B1 |
| G7 | KVKK metni eski NeoWellAI hukuki şablonlarından uyarlansın mı, hukukçuya gösterilecek mi? | B6 |
| G8 | Google otomatik yedeği kapatılsın mı? (Öneri: kapat; şifreli yedek kalır.) | B5 |
| G9 | 5 sabit sekmeye geçilsin mi (Koç ilk sekme olmaktan çıkar, İlaç "Daha fazla"ya taşınır)? | C14 |
| G10 | Adet döngüsü takibi istenir mi? | D-Sağ2 |
| G11 | Antrenman ve hareket kalorisi kalori hedefine eklenebilsin mi (varsayılan kapalı)? | D-Ant10, D-Adım4 |
| G12 | targetSdk yükseltmesi için Capacitor sürüm atlaması kabul mü? (Derlemeyi kırma riski var.) | B10 |
| G13 | Besin verisi için TürKomp'tan izin istensin mi, yoksa yalnız USDA ve tahmin mi kullanılsın? | D-Bes1 |
