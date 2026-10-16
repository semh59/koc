# NeoWell Uzman Kurulu

İlke: **arayüz basit ve hızlı, zekâ arka planda.** Kurul her sayfayı üç katmanda inceler; bulgular hakemden geçmeden kimseye sunulmaz.

## Katmanlar (`.claude/agents/`)

| Katman | Ajanlar | Soru |
|---|---|---|
| 1. Uzman görüşü (doğruluk) | `nw-uzman-enerji-metabolizma`, `-beslenme-veri`, `-vital-klinik`, `-ilac-guvenlik`, `-egzersiz-fizyoloji`, `-veri-dogrulugu`, `-mimari-performans`, `-gizlilik-guvenlik` | Hesap doğru mu, daha doğru yöntem var mı? |
| 2. Arayüz | `nw-uzman-sadelik-hiz`, `nw-uzman-yasli-erisim` + eski 7 rol (`nw-akis`, `-durum-ve-hata`, `-eksik-avcisi`, `-erisilebilirlik-dokunma`, `-gorsel-tutarlilik`, `-pazar`, `-turkce-ve-guvenlik-dili`) | Basit ve hızlı mı, kimse dışarıda kalıyor mu? |
| 3. Kıl kullanıcı | 14 `nw-kisi-*` profili | Gerçek biri bunu kullanabilir mi? |
| Süzgeç | `nw-hakem` | Bulgu gerçek mi, kasıtlı bir kararla çakışıyor mu? |

## Sayfa × uzman matrisi (● zorunlu, ○ bakabilir)

| Sayfa | Enerji | Besin | Vital | İlaç | Egz. | Veri | Perf | Gizl. | Sade | Yaşlı |
|---|---|---|---|---|---|---|---|---|---|---|
| Bugün | ● | ○ | ● | ● | ○ | ● | ● | ○ | ● | ● |
| Gün / Geçmiş | ○ | ○ | ○ | ○ | ○ | ● | ● | | ● | ● |
| Yemek ekle (pencere) | ● | ● | | | | ● | ● | | ● | ● |
| Salon, Egzersiz kütüphanesi | ○ | | | | ● | ● | ● | | ● | ○ |
| Adım raporu | ○ | | | | ● | ● | ○ | ○ | ● | ● |
| Trend | ● | ○ | ● | | ○ | ● | ● | | ● | ● |
| Rehber (Coach) | ● | ● | ○ | ○ | ○ | ○ | ○ | ● | ● | ● |
| İlaçlar | | | | ● | | ● | ○ | ● | ● | ● |
| Tansiyon, Şeker | | | ● | ○ | | ● | ○ | ○ | ● | ● |
| Tahlil takibi | | | ● | | | ● | | ● | ● | ● |
| Döngü | | | ○ | | | ● | | ● | ● | ○ |
| Ayarlar (6 alt sayfa) | ○ | | | ○ | | ● | ○ | ● | ● | ● |
| Onboarding | ● | | | | | ● | ○ | ● | ● | ● |
| Bildirim, alarm, widget (Android) | | | ○ | ● | ○ | ● | ● | ● | ○ | ● |
| Veri ve yedek | | | | | | ● | ● | ● | ● | ● |

Her sayfada **ek olarak** 7 rol ajanının tamamı ve en az 4 kişi profili (sabırsız, tek el, tansiyon hastası, veri titizi sabit; sayfaya göre diğerleri) çalışır.

## Akış (sayfa başına)

1. **Tur 1, paralel:** matristeki ● uzmanlar + 7 rol + 4 profil. Çıktı: tek satırlık bulgu listesi (K1, önem, kanıt, öneri, test).
2. **Tur 2, hakem:** tüm bulgular `nw-hakem`e verilir. ONAY / REDDET / KARAR-GEREKİR.
3. **Tur 3, rapor:** `docs/kurul/<tarih>-<sayfa>.md` dosyasına yalnız ONAY ve KARAR-GEREKİR yazılır. Kullanıcıya en fazla 10 satır özet.
4. **Uygulama:** kullanıcı kararlarından sonra düzeltme, her bulgu için bir test, `scripts/run-tests.js` yeşil, ayrı commit.
5. **Tur 4, doğrulama:** düzeltmeden sonra aynı uzman bir kez daha bakar; puan önceki turla kıyaslanır.

## Maliyet

Bir sayfa tam kurulla yaklaşık 15-20 ajan. 15 sayfa için bu 250 ajan eder. Bu yüzden sırayla gidilir: önce **Bugün, İlaçlar, Tansiyon/Şeker, Yemek ekle, Trend**; sonuç beğenilirse kalan sayfalar.

## Bilinen tuzaklar (bu oturumdan)

- Ajan bulguları testlerdeki kasıtlı kararlarla çakışabiliyor (hızlı çip sırası, 3 hızlı su dokunuşu, Aldım/Atla boşluğu, varsayılan yazı boyutu). Hakem bunu `scripts/*.test.js` ile kontrol eder.
- Ajanlar yalnız kod okur; telefonda görmez. Ekran görüntüsü olan bulgu daha değerlidir.
- Yeni ajan dosyaları oturum başında yüklenir; aynı oturumda `general-purpose` ajana dosyayı okutarak çalıştırılır.
