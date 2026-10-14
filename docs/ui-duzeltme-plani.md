# Arayüz düzeltme planı

Kaynak: `docs/ui-denetim-2026-10.md` (bölüm 1-5 = rol uzmanları, bölüm 6 = 14 kullanıcı profili). Kural: hiçbir bulgu "küçük" diye atlanmaz; sıra yalnız risk ve bağımlılıkla belirlenir. Her paket sonunda `npm test` ve ilgili e2e geçmeden sonraki pakete geçilmez. Her kabul koşuluna bir test yazılır.

## Önce karar gerektirenler (varsayılan = önerim)
| # | Karar | Varsayılan |
|---|---|---|
| K1 | Hamilelik/emzirme/yeme bozukluğu ayrı anahtarlar; "hamile değilim" ile frenin kaldırılması | Evet, kullanıcı onayıyla kalkar |
| K2 | Ramazan'da su hedefi ve ilaç saatleri | Öner, kullanıcı onaylasın; otomatik değiştirme yok |
| K3 | Yüksek değer (tansiyon 140-179, şeker 250-400) | "Hekimine danış, tanı değildir" satırı; eşiği kullanıcı hekim değeriyle özelleştirebilir (kapalı varsayılan) |
| K4 | Uygulama kilidi varsayılanı | Kurulum sonunda sor; önizleme gizleme kilitten bağımsız seçenek |
| K5 | Bildirimde ilaç adı | Kurulumda zorunlu soru (varsayılan kapalı kalır, seçim görünür) |

**Karar (2026-10-14): K1-K5 hepsi varsayılan (önerilen) seçildi.** K5 = ilaç eklerken 'bildirimde adı görünsün mü' sorulur. Çalışma: Faz 0'dan sırayla, pakete bir commit, push yok, hepsi bitince tek rapor.

## Faz 0: Zemin (önce, diğerlerini kolaylaştırır)
- **P0.1 Kayıt düzenleme çatısı:** tek "kayıt düzenle sheet" bileşeni (gün, saat, değer, not). Yemek, su, kilo, spor, tansiyon, şeker, tahlil, döngü, ölçü, uyku/ruh hali, antrenman setleri hepsi bunu kullanır. Kapatır: #12, #36 (kısmen), veri titizi 1, tek el 3, hastalar 9.
- **P0.2 Geri al yığını:** tek seviyeli `lastUndo` yerine yığın; süre 10 sn; ✕ silmede onay yerine uzun süreli geri al. Kapatır: #28, #5, tek el 2-3, geçmişten su geri al.
- **P0.3 `save()` başarı denetimi:** tek yardımcı; başarısızsa eski değer geri yüklenir ve "Kaydedilemedi; yedek al" tek metin. Kapatır: #4, #5, #37, depolama dolu metin üçlüsü.
- **P0.4 Ortak bileşenler:** `emptyCard()`, satır içi stil sınıfları, `--hit` 48 token, düğme ailesi birleştirme. Kapatır: #32-35, #26, #27, #30, başlık etiketi.
- **P0.5 Test altyapısı:** her paket için jsdom testi + gerekirse e2e; sinir testi (`scripts/sinir.test.js`) korunur.

## Faz 1: Güvenlik ve veri doğruluğu (en yüksek)
- **P1.1 Gerçek silme:** `wipe()` yerel tarafta StepStore, MotionStore (cm/kg, model), nw_widget, nw_quick, nw_medwake `doses/log`; kategori silme de çağırır; fotoğraf deposu hatası "silindi" demez. Kapatır: #3, silme şüpheci 1,3. **Java değişir → emülatör smoke.**
- **P1.2 Acil metinler:** baş dönmesi talimatını çıkar, "112" ve hangi değer yazılı; yüksek tansiyon/şeker diyaloğu başlığı ve değeri. K3 ile 140-179/250-400 satırı. Kapatır: #1, #2, tansiyon hastası 1-2.
- **P1.3 Hata metni sızıntısı:** barkod, hareket, salon içe aktarma, CSV `e.message` yerine sabit Türkçe. Kapatır: #6.
- **P1.4 Hedef güvenliği (K1):** boy yoksa BMI kontrolü için boy iste; bloklu hedef kaydedilmez ve "hedefe kalan"/hedef çizgisi gizlenir; alt kcal sınırı belirsiz cinsiyette 1500; haftalık hızlı kayıpta hekim uyarısı; çok düşük alım günü nötr not; seri gizle; sayıları gizle modu; tartı önerisi haftada bir; oruç açarken ED/kısıtlama açık sorusu.
- **P1.5 Hamilelik/emzirme/ED ayrımı (K1):** üç ayrı alan, ayrı not metni, "artık hamile değilim" kaldırma yolu, yedekten geri gelmez; emzirmede döngü tahmini gizlenmez; hamilelikte tartı/hareket hatırlatması ve hedef kilo satırı kapanır; harcama kartı "hekiminle belirle".
- **P1.6 Önizleme ve Rehber gizliliği (K4):** FLAG_SECURE ayrı seçenek; Rehber önizleme ilk rızada açık; API anahtarını yedekten hariç tutma anahtarı; arşivlere parola seçeneği; galeri fotoğrafı notu.

## Faz 2: İlaç
- **P2.1 Doz modeli:** saat başına doz/adet, "her N günde bir", aç/tok/yemekle, ara verme bitiş tarihi, stok için "kalan gün" eşiği ve bildirim, "+kutu ekle", 60 karakter ad. Kapatır: ilaç 4-6,8-10,13,15. **Migrasyon: eski ilaçlar bozulmaz, test şart.**
- **P2.2 Geçmiş doz ve düzeltme:** geçmiş gün seçip doz işaretle, atlananı "şimdi aldım" yap, alınan saati düzenle. Kapatır: ilaç 3,11,14.
- **P2.3 Bildirim:** aynı dakika gruplama, kurulumda ilaç adı seçimi (K5), bütçe (440) dolunca kullanıcıya haber ve ilaç önceliği. Kapatır: ilaç 2,7,12.
- **P2.4 Doktor raporu:** "Kullandığım ilaçlar" tablosu (ad, doz, saatler, günler); Tansiyon/Şeker ekranından "Doktora PDF"; 7/14 gün seçeneği; döngü bölümü isteğe bağlı. Kapatır: ilaç 1, hasta 5-6, döngü 8.
- **P2.5 Düğme güvenliği:** "Aldım" ile "Atla" ayrı ve Atla ikincil. Kapatır: tek el 8, hasta 11.

## Faz 3: Alarm ve bildirim güvenilirliği
- **P3.1 Saat dilimi:** dilim ofseti değişince yeniden kur (6 saat şartı atlanır); native alıcı slot saatini duvar saatinden yeniden hesaplar; elle saat değişimi aynı yoldan. **Java; emülatörde TZ değiştirme testi.** Kapatır: gezgin 1,2,7.
- **P3.2 Gerçek durum:** pil kısıtı `st.bo` ve son alarm kaydından türetilir; kaçan alarm Bugün'de uyarı satırı; yeniden başlatma sonrası kurulum bilgisi; otomatik başlatma ekranı açılmadıysa yol metni. Kapatır: Xiaomi 1,2,4,5.
- **P3.3 Sihirbaz ve metin:** "son uygulamalarda kilitle" ilk sıraya; tek metin kaynağı (3 yer); Rahatsız Etme notu; "Rehber" yerine uygulama adı; "denied" Türkçe; Xiaomi iki girişi tek. Kapatır: Xiaomi 3,6-10.
- **P3.4 Bildirim eylemleri:** kilo bildirimi kilo sayfasını açar; dinlenme bildirimi Salon'a götürür ve doğru hareketi söyler. Kapatır: sabırsız 11, salon 7-8.

## Faz 4: Yedek ve taşıma
- **P4.1 Yedek ekranları:** "Fotoğraflar yedeğe girmez" iki sayfada ve onayda; paylaşım sonrası "Yalnız denetle" yönlendirmesi, manuel yola toast; geri yükleme onayında yedek tarihi + mevcut kayıt sayısı; format/sürüm hatası ayrı mesaj; 5 MB metni; ayrı Geri yükle sayfası; geri yükleme sonrası "Rehber izni ve otomatik yedek yeniden kurulur"; parola saklama önerisi; "Parolayı unut" onayı; Drive ekranında API anahtarı notu.
- **P4.2 Atomik geri yükleme:** güvenlik kopyası önce, anahtar yazımı başarısızsa kalıcı uyarı; yarım kalma testi.
- **P4.3 Silme güvenliği:** "Tüm verileri sil"de son yedek tarihi ve "önce yedek al"; uygulama silinirse her şey gider uyarısı Yedek sayfasının başında kalıcı.
- **P4.4 Fotoğraf:** meşgul bayrağı (çift seçim yarışı).

## Faz 5: Ramazan, döngü, saat
- **P5.1 Ramazan (K2):** açıkken gündüz su hatırlatması susar ve iftar-sahur penceresine kayar; su halkasına oruç saati notu; hareket 19:30 iftar sonrasına; ilaç "sahur/iftar saatine kaydır" önerisi ve kapanınca "eski saatlere dön"; oruçlu antrenman tek satır bilgi; tablo bitiş uyarısı; doğrulanmamış saat için karşılaştırma notu; sahur/iftar bildirimi temizlikten muaf; bayram sonrası otomatik kapanma; widget'a "iftara X sa".
- **P5.2 Döngü:** günlük belirti (hamilelik belirtileri dahil), açık dönemi her zaman kapatma, gecikme bilgisi nötr dille, ayar satırında "durduruldu" nedeni, 60 günden uzun aralık uyarısı.
- **P5.3 Gün sınırı:** "gün başlangıcı" ayarı ve 00:00-04:00 kaydında "Dün gibi say"; gün anahtarı öne gelişte güncellenir; geçmiş gün görünümü atılmaz.

## Faz 6: Akış ve hız
- **P6.1 Bugün:** Tansiyon/Şeker çipi (modül açıksa); onboarding sonrası "ilk suyunu ekle"; "Şimdilik geç" sonrası "Hedefini hesapla" satırı; ilaç ve ölçüm satırları her zaman ilk; Rehber ipucu ve lif notları Trend/ⓘ'ye.
- **P6.2 Girişler:** tansiyon tek ölçümle açılır (2. ölçüm katlı); şeker bağlamı son kullanılan; besin "+" varsayılan porsiyonla ekler; spor son tür/süre; gün seçici "Başka güne" katlı; kilo uyarısı 14 günden eski kayıtta çıkmaz; su etiketi bardak ayarından; yarım yazılmış sayfa kapatmada sor; su listesinde kaydırma konumu korunur; yürüyüş Başlat çift basma; yürüyüş hızlı çubukta.
- **P6.3 Onboarding kısaltma:** hedef adımı tek ekrana, modül seçimi ilk haftaya.
- **P6.4 Eksik özellik:** makro gram hedefi (K3 benzeri "öneri" etiketi), öğün/gün kopyalama, kafein ve yağ oranı, Health Connect bağımsız ayar + antrenman oturumu okuma, widget'a yemek/kilo, launcher kısayolları (4), tarif içe aktarma (metin yapıştır), hafta karşılaştırması, kcal formülü açıklaması (Mifflin-St Jeor, çarpan, 7700), yemek satırında makro dökümü.
- **P6.5 Geçmiş ve veri:** eski yürüyüş/koşular gün ekranı, CSV, silme; tahlil gün ekranı/arama/CSV; arama kapsamı (tansiyon, şeker, ruh hali, tahlil notu) + tür/tarih süzgeci; nabız listesi tümü; barkod zaman aşımı 10 sn ve elle yaz; çevrimdışı mesaj.

## Faz 7: Salon
- **P7.1** Set silme, "işaretsizleri at, bitir", biten antrenmanı düzenleme, hareket başına kg×tekrar dökümü, geçmişe antrenman ekleme, hareket bazlı rekor listesi, süreli sette süre kopyası, dinlenme bitişi kalıcı ve son sette kurulmaz, sticky Bitir/sayaç, "Vazgeç" → "Antrenmanı sil", şablon tek dokunuşla başlat, kg/lb birimi.

## Faz 8: Dışa aktarma
- **P8.1** "Hepsini tek paket", CSV'de tür başına sütun/dosya, nokta-ondalık seçeneği, "Tüm verim" başlığı dürüst (neler dışarıda), birim giriş sayfasında çevrilebilir, "Raporlar ve dışa aktarma" tek satır, antrenman CSV birimi.

## Faz 9: Erişilebilirlik, görsel, metin
- **P9.1 Erişilebilirlik:** hedefler 48dp (geri, gezgin, kapat, adım, anahtar, gün göstergesi, yatay menü); toast 6/10 sn; `--kcal`/`--water` metin tonu ≥4,5:1 ve kontrast testi 4,5 eşiği; kas haritası etiket 12 birim; Salon'da 48dp+ ve alt "Kapat"; konfor modu; ilk kurulumda "yazıyı büyüt?"; grafik yazısı üst sınırı.
- **P9.2 Görsel:** `design-language.md` koda göre güncelle, `app.css:1` ölü atıf; 6/10/14 px → token; ✓/✔ tek; canvas renkleri tek sabit nesne; `sheetDrive` ve geri yükleme metinleri 1 cümle + ⓘ.
- **P9.3 Metin:** Kapat/Vazgeç/İptal kuralı; kilo/ağırlık, antrenman/egzersiz sözlüğü; apostrof; başarısızlık tonu nötr; depolama dolu tek biçim.
- **P9.4 Grafik:** balonda saat; "tüm noktalar" tablosu; ekran okuyucu değeri.

## Kapsam dışı kalanlar (ikinci tur denetim)
Rehber sohbeti gövdesi, barkod/OCR derin akış, Health Connect akışı, TalkBack sırası, yaz saati geçişi (23/25 saatlik gün), adım sayacı gün sınırı, modül ekranlarında `aria-label`, native bildirim kanalları, FHIR çıktısı, tahlil grafiği. Faz 9 sonunda bu alanlar için yeni tur profil/uzman çalıştırılır.

## Doğrulama
1. Her pakette jsdom testi (kabul koşulu başına bir), sinir testi.
2. Faz sonunda e2e (312 test) + emülatör smoke; Java değişen paketlerde (P1.1, P3.1, P6.4) manifest denetimi.
3. Telefon testi listesi `docs/phone-test-short.md`'ye eklenir: alarm kaydırma/yeniden başlatma, saat dilimi, geri yükleme, widget/kısayol, Ramazan.
4. Fazlar bitince ilgili profil ajanı yeniden çalıştırılır; puan ≥8 ve "senaryo tamamlandı" beklenir.

## Sıra ve tahmini iş
P0 → P1 → P2 → P3 → P4 → (P5 ∥ P6) → P7 → P8 → P9. Her faz ayrı commit dizisi; her commit tek paket. Yaklaşık 40 paket, en büyükleri P2.1, P3.1, P5.1, P6.4.
