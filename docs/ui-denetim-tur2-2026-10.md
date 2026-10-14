# Arayüz denetimi, 2. tur (2026-10-14)

14 kullanıcı profili düzeltmelerden sonra (71b3492..HEAD, 53 commit) yeniden yürütüldü. Kanıtlar kod okumasıdır, telefonda doğrulanmadı. Ciddiyet: Y yüksek, O orta, D düşük.

## Puanlar (1. tur → 2. tur)
Tansiyon hastası 4→7, çok ilaç 4→7, diyet hassas 6→7, Xiaomi 5→6, telefon değiştiren 5→8, gizlilik 7→8, sabırsız 6→8, tek el 5→7, rakip göçmeni 6→7, salon 6→8, kadın/döngü 5→8, Ramazan 5→7, gezgin 5→6, veri titizi 5→7. Ortalama 5,3 → 7,2. Hedef ≥8 ve senaryo tamamlandı.

## A. Sağlık güvenliği (karar gerektirir)
| Ç | Bulgu | Kanıt |
|---|---|---|
| O | Şeker 54-69 sessiz (ilaç kullanan için düşük şeker); düşük tansiyon (ör. 80/50) için uyarı yok | `vitalslib.js:13,111` |
| O | Sohbette "hamilelikte spor olur mu?" kaldırılmış hamilelik bayrağını sessizce geri açar | `coach.js:320`, `coachlib.js:36-38` |
| O | Not metni düzenlenince kaldırılan hamilelik bayrağı geri gelir | `07-actions.js:67-69`, `coach.js:333` |
| O | Yedek birleştirmede telefonda sonradan açılan hamilelik bayrağı düşebilir | `04-sheets.js:393-394` |
| D | 1 gün gecikmede "hekimine danış" (eşik 7 gün olmalı) | `cycleui.js:70` |
| Y | Ramazan: iki doz aynı hedef saate düşünce biri siliniyor, stok şişiyor, geri alma getirmiyor | `medui.js:115-117,138`, `ramadanlib.js:122`, `medlib.js:192` |
| O | Ramazan: o gün alınmış doz kaydırılınca yeni slot bekliyor görünür (çift doz riski) | `medlib.js:109`, `medui.js:128` |
| O | Ramazan: kaydırma yalnız ilk günün imsağına sabit, ay boyunca ~30 dk kayar | `medui.js:93-96` |

**Durum:** yapıldı (önceki commit'ler).

## B. Veri bütünlüğü
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Barkod: bulunamayan barkod bekleyen değişkende kalır, sonraki etiket yanlış barkoda yapışır | `04-sheets.js:265,312`, `ocrui.js:82-97` |
| Y | Batıya uçunca gün anahtarı geri döner, adım geçmişi dünün toplamını ezer | `StepMath.java:67-72`, `StepStore.java:33-35` |
| Y | Şeker düzenlemede dokunmadan Kaydet: 126 mg/dL 126,1 olur (mmol modu) | `vitalsui.js:131,137-158`, `unitui.js:15` |
| O | Kilo düzenlemede 84,35 → 84,4 | `04-sheets.js:162,180` |
| O | Tahlil düzenleme ve CSV 0,012 → 0,01 (2 ondalık kesme) | `lablib.js:301`, `labui.js:90`, `csvlib.js:186` |
| O | Yağ oranı CSV'de "cm" yazıyor | `log/index.js:21`, `measures/index.js:5` |
| O | Gün başlangıcı ≠ 0: CSV sıralaması ve tarih tutarsızlığı, widget ve adım takvim gününde kalıyor, su hedefi dünün toplamına bakıyor | `log/index.js:21`, `NeoWidget.java:47-54,98-99`, `05-notifications.js:45,50` |
| O | Kiloyu başka güne taşıyınca aynı güne iki kilo kalır, hangisi sayılır belirsiz | `entries.js:22`, `02-state-components.js:65` |
| D | Ölçü başka güne taşınınca eski ölçüm sessizce ezilir; uyku/ruh hali taşınmıyor kopyalanıyor; uyku dk yuvarlama; `bt` bayrağı kalır | `algo.js:225`, `habitui.js:73,92,109`, `04-sheets.js:202` |
| D | Doz metni değişince eski günler yeni dozla raporlanır | `medlib.js:100` |
| O | Kür bitiş tarihi düzenlemede silinemez/uzatılamaz | `medui.js:213,238` |
| O | Dünkü kaçan doz Bugün'de çıkmaz, uyum sessizce düşer | `medui.js:85-87` |
| O | Saat değişince bugünkü doz ve hatırlatma kaybolur (uyarı yok) | `medlib.js:99-109`, `medui.js:119,239` |

**Durum:** yapıldı (önceki commit'ler).

## C. Mahremiyet
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Şifreli paylaşılan `.enc.json` dosyasını açan ekran yok | `share.js:29,47`, `BackupLib.decrypt` |
| O | Arşiv yasak listesi Ramazan ayarları (ramMeds dahil) ve fastEdOk'u dışarıda bırakmıyor | `archivelib.js:9` |
| O | Arşiv/paket satırı "geri yüklenmez, yedek yerine geçmez" demiyor (yalnız CSV başlığında) | `privacyui.js:63,69-70` |
| O | Kilitli kullanıcıya hideRecents göçle açılmıyor | `01-core.js:53`, `onboardui.js:99` |
| O | "Tüm verileri sil" Drive ve otomatik yedek klasöründeki dosyaları silmiyor, onay söylemiyor | `BackupFolderPlugin.java:113-118`, `07-actions.js:76` |
| O | PDF/haftalık/tahlil/alışveriş şifreleme seçeneği yok, dosya adı hastalığı açık eder | `vitalsui.js:281`, `weeklyui.js:8`, `labui.js:200`, `coach.js:898` |
| O | Widget kcal/su/adım kilitte de görünür, gizleme yok | `03-screens.js:293-298`, `NeoWidget.java:109-120` |
| O | Kilit ekranında "Tansiyon ölçümü", "Şeker ölçümü", "İlaç zamanı" (VISIBILITY_PUBLIC) | `MainActivity.java:67`, `MedWakeReceiver.java:130,144` |
| O | "Sayıları gizle" sözünü tutmuyor: kcal aralığı, hareket bonusu, makrolar, tartı toast'ı, adım serisi/en iyi gün, halka yayı | `03-screens.js:57,60,65,68,71`, `04-sheets.js:95-97`, `stepsui.js:84` |
| D | Ramazan konum tablosu doğrulama durumu yedeğe girmez; hideRecents geri yüklemede düşer; `nw_ocrok` silinmez; repodaki manifest `allowBackup=true` | `ramadanui.js:6-9`, `04-sheets.js:391`, `07-actions.js:80`, `AndroidManifest.xml:5` |

**Durum:** yapıldı (önceki commit'ler).

## D. Alarm ve bildirim
| Ç | Bulgu | Kanıt |
|---|---|---|
| Y | Otomatik başlatma okunamıyor; "Kontrol edilemiyor" kalır, sihirbaz göstermez | `05-permissions.js:27,67` |
| Y | Saat dilimi değişince alarm ekranı kayar, bildirimler uygulama açılana kadar eski saatte | `MedWakeReceiver.java:46-47`, `05-notifications.js:12-14` |
| O | "Yeniden başlatınca alarmlar kurulur" metni koşulsuz (Xiaomi'de yanlış) | `05-permissions.js:52` |
| O | Geç çalan alarm hem "geç" hem "çalmadı" sayılır | `MedWakeReceiver.java:43-45`, `medlib.js:300` |
| O | Yeniden kurma kilitsiz; cancel sonrası schedule hata verirse 6 saat bildirim yok; clockMoved her ön plana gelişte yeniden kurabilir | `05-notifications.js:41,57,70,74`, `medlib.js:308-311` |
| O | Widget +su saat dilimi değişince yeni bölgenin gününe yazılır; widget +250 çift dokunuşta çift kayıt, geri alma yok | `quickui.js:19-20`, `NeoWidget.java:44-56` |
| O | Tansiyon/şeker bildirimine dokununca ölçüm sayfası açılmıyor | `05-notifications.js:54,77-81` |
| O | Kilo bildirimi Trend'e düşer, "Kilo ekle" düğmesi yok | `05-notifications.js:54,80`, `03-screens.js:135,138` |
| O | Hatırlatmalar varsayılan kapalı; takibi açınca kendisi açılmaz | `01-core.js:60-62`, `vitalsui.js:24` |
| D | Telefon kapalıyken geçen doz "NeoWell durdurulmuş" der; erteleme alarmı TZ/boot sonrası kurulmaz; erken alarm iki kez çalabilir | `05-permissions.js:57`, `MedWakePlugin.java:138-146`, `MedWakeReceiver.java:29,193` |

**Durum:** yapıldı (önceki commit'ler).

## E. Ramazan
| Ç | Bulgu | Kanıt |
|---|---|---|
| O | Sahur/iftar hatırlatması varsayılan kapalı, mod açılışında önerilmiyor | `01-core.js:53`, `ramadanui.js:109` |
| O | "Bugün tutmuyorum" mazeret düğmesi yok | `ramadanui.js:18` |
| O | Widget iftar satırı yalnız uygulama imsaktan sonra açılırsa yazılır | `03-screens.js:295-296`, `NeoWidget.java:116` |
| O | Su halkası ve hedef oruçtan bağımsız, "yay" anahtarı yalnız metin | `ramadanui.js:24-28` |
| D | Bayram önerisi bir gün sapabilir; kısmi geri alma "döndü" der; ramMeds ertesi yıl sessiz | `ramadanlib.js:126-129`, `medui.js:138-143`, `ramadanui.js:103` |

**Durum:** yapıldı (önceki commit'ler).

## F. Kullanım ve kalabalık
| Ç | Bulgu | Kanıt |
|---|---|---|
| O | Bugün'ün ilk yarım ekranı 8 nota kadar doluyor (Ramazan, protein, eksik, lif, mikro, tarif, hareket) | `03-screens.js:71` |
| O | Çipler kullanıma göre yer değiştirir (+250 yerine Kilo'ya basma riski); "İçecek türü" ve "+250" ikisi su | `03-screens.js:70-75`, `06-events.js:57` |
| O | Geri al sonrası aynı yerde yeni "Geri al" çıkar, çift dokunuş iki kaydı siler | `04-sheets.js:56-57` |
| O | Widget düğmeleri 36dp ve yapışık | `nw_widget.xml`, `NeoWidget.java:129-133` |
| O | Barkod elle yazılan ürün barkoda bağlanmıyor; kcal formülü onboarding/ayar alanında bağlantısız; kafein günlük toplamı yok | `04-sheets.js:312-318`, `03-screens.js:220`, `onboardui.js:94`, `drinkui.js:7` |
| D | Aynı güne kopyalama çift kayıt; hafta karşılaştırması kilo/spor/protein yok; Enter tansiyonda Kaydet'i çalıştırmaz; launcher Su sayfa açar, widget doğrudan kaydeder; toast kcal söylemez | `04-sheets.js:141-144`, `weeklylib.js:72`, `06-events.js:98` |
| O | Salon: geçmiş güne kayıtta her ✓ gerçek dinlenme sayacı başlatır; düzenlemede boş kg 0 olur | `gym.js:54-55,757,505-506` |
| D | Salon: başka egzersizde set silinince süreli zamanlayıcı durur; bildirim eski "Sıradaki" der; Geri al bitmiş antrenmana set ekler; ısınma satırı etiketsiz; lb sapması | `gym.js:711,713,791,795,493,679,752` |
| D | Seti sil "Başarısızlığa kadar"ın altında onaysız; antrenmanda üç katman yapışkan | `gym.js:730-731`, `app.css:191,216` |
| D | Döngü: günlük belirti yalnız bugün; kaldırma yolu ekranda söylenmiyor; gün başlangıcı 3'te gece "bugün" dünün tarihi | `cycleui.js:62,94-95,134` |
| D | Gün ekranında tansiyon/şeker/tahlil satırı düzenlenemez; tarih aralığı hata mesajı yok; ölçü listesi son 5; adım düzenlenemez; geçmiş aramada kilo/su/uyku yok | `vitals/index.js:8`, `historyui.js:4,129`, `measureui.js:42`, `stepsui.js:75` |

**Durum (F):** tüm maddeler yapıldı; yapılmayan yok.
- Bugün: notlar tek katlı "Ayrıntı" satırında (protein satırı ve kafein toplamı açıkta); çip sırası sabit, su ve "İçecek türü" yan yana ilk; kullanım sayacı (`chipUse`) kaldırıldı. Geri al sonrası zincirdeki ikinci "Geri al" 1,2 sn pasif. "Nasıl hesaplandı" kalori alanında ve onboarding hedef kartında, kilo kaydı beklemeden (boy/yaş/kilo yoksa yalnız formül adı). Aynı güne kopyalamada onay penceresi. Hafta karşılaştırmasında hafta toplamı spor dakikası ve "tam kayıtlı günler" notu (kilo ve protein karşılaştırmaya eklenmedi: tek ölçümlü değerler, ortalama anlamsız). Enter tansiyon/şeker sheet'inde Kaydet. Hızlı ekleme toast'ı kcal söyler (sayılar gizliyse söylemez).
- Launcher "Su": tek davranış seçildi: kısayol içecek sayfasını bardak boyutu hazır açar, kaydetmek bir dokunuş; widget "+bardak" doğrudan kaydeder. Fark kısayol etiketinde söylenir ("Su ekle: bardak boyutu hazır"). Kısayol hiçbir şey kaydetmez (yanlışlıkla uzun basış).
- Salon: geçmiş gün kaydında dinlenme sayacı ve bildirimi kurulmaz; başka egzersizde set silme/taşıma süreli zamanlayıcıyı korur (zamanlayıcı kendi setini izler); silme/taşıma sonrası dinlenme bildirimi sıradaki adı günceller; Geri al bitmiş/atılmış antrenmana set ya da egzersiz eklemez; düzenleme sheet'i ısınma/drop etiketli, ağırlıklı harekette boş kg hata, ad/gün değiştirme, egzersiz ekleme/çıkarma ve set ekleme; lb "Bu değerle tamamla" kg'yi birebir saklar; "Seti sil" ayraç altında ayrı ve onaylı; rekor toast'ı egzersiz başına bir kez ve bayrak antrenmanla saklanır (yeniden başlatma tekrar etmez); kısa ekranda (<=640 px yükseklik) yapışkan üst çubuk ve dinlenme çubuğu daha az yer tutar (üst çubuk yapışkan kalır: Bitir görünür kalmalı); egzersiz geçmişinde "Daha fazla göster".
- Döngü: günlük belirti seçilen güne (son 90 gün) yazılır, tek gün silinir (Geri al'lı); hamilelik bayrağı varken "Sağlık notların" bağlantısı; gün başlangıcı > 0 ise açıklama.
- Geçmiş/gün: tansiyon, şeker, tahlil ve elle adım satırları düzenlenir; tarih aralığı ters ise hata metni; ölçü listesinde "Tümünü göster"; arama tür çiplerinde Kilo, Su, Uyku (arama metni: değer, içecek adı, süre; kilo kg olarak aranır). Rahatsız Etme notu izin merkezinde ve Hatırlatmalar'da zaten vardı (doğrulandı, test eklendi).

## Kabul edilen sınırlar (bilinçli)
Döngü dışa aktarma yok (yalnız şifreli yedek), yeme bozukluğu bayrağı uygulamadan kaldırılamaz, Health Connect antrenman okuma izin gerektirir, gizlilik politikası adresi ve "Yanıtı bildir" e-postası kullanıcıdan bekleniyor, doz tavsiyesi/telafi yok.
