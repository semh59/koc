# Tüm proje inceleme planı

Amaç: NeoWell'i her açıdan sırayla gözden geçirmek, bulguları ciddiyetle kaydetmek, düzeltmeleri ayrı ayrı yapmak. Bulgular `docs/bulgular.md` dosyasına tek tabloda yazılır (no, açı, dosya:satır, ne, ciddiyet, durum).

Boyut: web tarafı 64 JS dosyası + index.html (~10 bin uzun satır), Java 26 dosya (~3,4 bin satır), 44 birim test dosyası, 16 e2e dosyası, 1 CI iş akışı.

## Kurallar
- **Ciddiyet:** K (kritik: veri kaybı, güvenlik, yanlış sağlık bilgisi, çökme), Y (yüksek: sık görülen yanlış davranış), O (orta), D (düşük: kozmetik, bakım).
- **Kanıt şartı:** Bulgu ya dosya:satır ya da yeniden üretilebilir adım taşır. "Olabilir" diye yazılan şey doğrulanana kadar bulgu sayılmaz.
- **Düzeltme:** K ve Y hemen düzeltilir (test ile). O ve D toplanır, topluca yapılır. Karar gerektiren şey sana sorulur.
- **Her faz sonunda:** tek sayfa özet (ne bakıldı, ne bulundu, ne düzeltildi, ne açık), `npm test` ve CI yeşil.
- **Telefon gerektiren maddeler** (kamera, parmak izi, alarm, saat) senin test listene gider, kodla kanıtlanmış sayılmaz.

## Sıra (risk öncelikli)

### Faz 1. Veri bütünlüğü ve kayıp (K)
- Kaydetme/okuma zinciri: `save`, `load`, `cleanEntries`, `buildState`, her `clean*`. Alan atılıyor mu, sessiz kayıp var mı.
- Yedek ve geri yükleme: şifreli yedek, otomatik yedek klasörü, eski sürümden gelen yedek, yarım kalan yazma, kota dolu.
- Silme: Gizlilik kategorileri tam siliyor mu, geri dönen veri var mı (saatten, sensörden).
- Zaman: gece yarısı, saat dilimi, yaz saati, saat değişimi; gün anahtarı (`dayKey`) her yerde aynı mı.
- Sürüm geçişi: eski depolama biçimi, yeni alan eklenince eski kayıt.
- Yöntem: kod okuma + sahte bozuk veriyle (fuzz) birim test.

### Faz 2. Güvenlik
- WebView: izinli köprüler, dışarıdan gelen intent'ler, `exported` bileşenler, düz metin trafik, dosya erişimi.
- İçerik enjeksiyonu: `innerHTML` kullanan her yer kaçışlı mı (`esc`), kullanıcı verisi, Koç yanıtı, içe aktarılan dosya, barkod/OFF verisi.
- Sırlar: API anahtar kasası, yedek parolası, uygulama kilidi, günlükler, CI sırları, imza anahtarı.
- Bağımlılıklar: npm ve Gradle sürümleri, bilinen açıklar, CDN/dış istek var mı (olmamalı).
- Yöntem: satır satır okuma (`innerHTML`, `Intent`, `exported`, `eval`, `fetch` taraması) + `npm audit`.

### Faz 3. Gizlilik, KVKK ve yasal
- Veri akış haritası: hangi veri nereye çıkıyor (Koç sağlayıcıları, OFF barkod, yedek). Her çıkış onay metni ve politikayla birebir mi.
- Maskeleme (PII) testi: gerçekten ad/telefon/adres gidiyor mu.
- Politika, onay metni, Play veri güvenliği formu, izin beyanları birbiriyle tutarlı mı (`docs/`).
- Sağlık verisi sınıflaması, silme hakkı, açık rıza, çocuk kullanıcı, hekim raporu (PDF) dili.
- Çıktı: avukata gidecek güncel soru listesi (`docs/hukukcuya-sorular.md`).

### Faz 4. Sağlık doğruluğu ve ürün güvenliği
- Formüller: kalori hedefi, harcama tahmini, kilo trendi, adım mesafe/enerji, su, oruç süresi, döngü tahmini, tansiyon/şeker ortalamaları. Her biri kaynağıyla ve uç değerle test edilir.
- "Yorumlamaz" kuralı: tansiyon, şeker, nabız, tahlil ekranlarında eşik/etiket/renk sızmış mı.
- Kriz kutusu, uyarı metinleri, yeme bozukluğu riski (aşırı düşük kalori hedefi, hızlı kilo kaybı), hamilelik/çocuk durumu.
- Kamerayla nabız ve saat verisi: "sağlık cihazı değildir" notları, belirsizde sayı vermeme.
- İlaç: doz saati, erteleme, tekrar, "aldım" sonrası tekrar yok; çoklu ilaç aynı saat.

### Faz 5. Android yerel katman
- 26 Java dosyası satır satır: yaşam döngüsü, iş parçacığı, çökme noktaları, null, izin reddi, hizmet sınırları (Android 12-16 kısıtları).
- Alarm ve bildirim: tam alarm izni, yeniden başlatma, saat/saat dilimi değişimi, pil optimizasyonu, Xiaomi ve Samsung farkları.
- Adım sayacı, GPS penceresi, Health Connect, kilit, kasa, yedek klasörü.
- Android sürüm matrisi: minSdk 24 → hedef 36; `Build.VERSION` korumaları gerçekten doğru mu.
- Yöntem: kod okuma + CI derleme uyarıları + Android lint çıktısı.

### Faz 6. Koç (yapay zekâ)
- İstem güvenliği: sistem metni, bağlam seçimi, enjeksiyon (kullanıcı/yanıt içindeki talimat), tıbbi tavsiye sınırı.
- Sağlayıcı zinciri: hata türleri, bekleme, zaman aşımı, kota, boş yanıt, yarım JSON.
- Eylem kartları (kayıt ekleme): yanlış kaydı geri alma, çift kayıt, onaysız yazma yok mu.
- Maliyet: istek boyutu, önbellek, gereksiz çağrı.

### Faz 7. Arayüz, erişilebilirlik, yerelleştirme
- Tüm akışlar boş/yüklü/hatalı üç durumda: ilk açılış, her sekme, her sayfa/sheet.
- Erişilebilirlik: ekran okuyucu adları, odak sırası ve tuzağı, kontrast (açık/koyu), dokunma hedefi, büyük yazı, hareket azaltma, geri tuşu.
- Metin: Türkçe imla ve ton, birim tutarlılığı (kg/lb, mg/dL), sayı ve tarih biçimi, kesilen/taşan metin.
- Cihaz çeşitliliği: küçük/büyük ekran, yatay, katlanabilir, koyu tema, sistem yazı boyutu.
- Yöntem: mevcut e2e + `docs/ui-audit` ile karşılaştırma, ek ekran görüntüsü taraması.

### Faz 8. Dayanıklılık, performans, pil
- Çevrimdışı, depolama dolu, izin reddi, yarım işlem, çift tıklama, arka plana alınma, süreç öldürülmesi.
- Büyük veriyle (yıllarca kayıt, 5 bin ölçüm, 1000 yemek) render süresi ve bellek.
- Soğuk açılış süresi, APK boyutu, WebView başlatma, arka plan çalışması ve pil etkisi (adım, alarm, GPS, kamera).
- Yöntem: sentetik büyük veriyle jsdom/playwright ölçümü, telefonda pil ekranı kontrolü.

### Faz 9. Test kalitesi
- Her kabul koşulunun testi var mı (`docs/yapilacaklar.md` ile eşle).
- Sahte pozitif: hiçbir şeyi doğrulamayan ya da kendini doğrulayan testler.
- Boşluklar: yalnız telefonda görülebilenler (listeye taşınır), e2e kapsamayan ekranlar.
- Kararsız (flaky) testler ve emülatör smoke testindeki zamanlama kırılganlığı (alarm sayısı, ilaç kanalı).

### Faz 10. Kod kalitesi ve bakım
- Ölü kod, kullanılmayan yardımcılar, tekrar eden mantık, isimlendirme tutarlılığı.
- `index.html` tek dosya monoliti: bölünmesi gereken yerler, global durum (`S`) erişimi, yarış koşulları.
- Yorumlar: yalnız "neden" mi, eskimiş yorum var mı.
- Bağımlılık yaşı ve bakım riski: Capacitor, ML Kit, Gradle/AGP.

### Faz 11. Derleme, CI, yayın
- İş akışı: imza doğrulama, sürümleme (`1.0.<run>`), release süreci, geri alma, anahtar yedeği, sırların kapsamı.
- Denetim kapıları gerçekten yakalıyor mu (izin listesi, dışa açık bileşen, debug imzası).
- Dependabot ve güvenlik güncellemesi akışı.

### Faz 12. Dokümantasyon ve mağaza uyumu
- README, `docs/` içindeki çelişkiler (örnek: minSdk anlatımı), eskimiş plan dosyaları arşivi.
- Play: izin beyanları (tam ekran bildirimi, ön plan servisi, sağlık), hedef SDK, veri güvenliği formu, mağaza metni.
- Yayın öncesi kontrol listesi güncel mi.

### Faz 13. Ürün ve rekabet
- Eksik özellik ve öncelik: `docs/rekabet-*.md` ile kıyas, gerçek kullanımdan çıkan sürtünme (senin notların).
- Kaldırılacak/sadeleşecek şeyler (karmaşıklık yükü), varsayılan ayarların doğruluğu.

### Faz 14. Telefon bulguları, geçmiş ve depolama (kullanıcı notlarından, öncelikli)
- **Geçmiş:** Veri sonsuza kadar tutuluyor ama Bugün tek gün gösteriyor, geriye en çok 365 gün gidiyor (`logOff` sınırı), takvim/arama/tüm zaman görünümü yok. Hedef: 3+ yıl kullanıcı her günü görebilsin.
- **Depolama mimarisi:** Tüm kayıt tek `localStorage` JSON'u (kota ~5 MB, uyarı 3,5 MB, her kayıtta tamamı yeniden yazılır). IndexedDB'ye geçiş, yedekli ve doğrulamalı.
- **Dünkü egzersiz hâlâ ana ekranda:** Bugün sekmesinde geçmiş günün antrenman kartı/kaydı kalıyor (telefonda görüldü). Neden bulunacak: Salon kartı, `logOff`, gün dönüşü.
- **Kamerayla nabız ölçülemedi (telefonda):** Parmak algılama eşiği, flaş (torch) açılması, WebView kamera izni, kare hızı, sonuç reddi nedeni ayrı ayrı ayıklanacak. Ret nedeni ekranda daha açık gösterilecek; gerekirse gerçek kayıtlarla eşik ayarı.

## Çalışma biçimi
- Her faz ayrı oturumda ya da yarım gün işi; faz başına sonuç raporu 10 satırı geçmez, ayrıntı `docs/bulgular.md`'de.
- Büyük okuma işi (faz 2, 5, 10) alt ajanla paralel yapılabilir; haftalık limit nedeniyle şu an kod okumayı ben yaparım. Ajan şartı sende.
- Yalnız telefonla doğrulanacak maddeler faz sonunda tek test listesine toplanır (`docs/telefon-testi-kisa.md` formatında).
- Karar gerektiren her şey (şifreleme, avukat, mağaza) faz raporunda "Senin kararın" başlığında toplanır; beklemeden devam edilir.

## Önerilen başlangıç
Faz 1 → 2 → 3 → 4 sırasıyla. Çünkü veri kaybı ve gizlilik geri dönüşü en zor, en pahalı hatalardır; arayüz ve bakım sonradan düzeltilebilir.
