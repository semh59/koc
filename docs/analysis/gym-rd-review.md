# Egzersiz Modülü — bağımsız AR-GE incelemesi

## Kapsam ve sınır

İnceleme yalnızca `release/no-coach` dalındaki egzersiz modülünü kapsar. Geliştirme işi bu incelemeden ayrı tutulmuştur; bu rapor hazırlanırken üretim kodu değiştirilmemiştir.

- İncelenen üretim alanı: `www/modules/gym/`
- Bağlı çekirdekler: `www/kernel/modules.js`, `www/main/01-core.js`, `www/main/05-notifications.js`, `www/main/06-events.js`, `www/app.css`
- Test alanı: `e2e/gym.spec.js`, `scripts/gym2.test.js`, `scripts/gym3.test.js`, `scripts/ui-f-gym.test.js`
- Kanıt katmanları: kaynak incelemesi, host/jsdom testleri ve gerçek browser UI. Fiziksel Android kanıtı değildir.

## Yürütülen kapılar

- Gerçek Gym Playwright UI: `8/8` — phone-360 ve phone-412
- `node scripts/gym3.test.js`: geçti
- `node scripts/ui-f-gym.test.js`: geçti
- `node scripts/gym2.test.js`: bir hata — keyboard layout assertion
- `node scripts/boundary.test.js`: geçti
- `npm test`: exit `1`, toplam `26` başarısız dosya; no-Coach dalıyla uyumsuz eski Coach sözleşmelerinin yanında Gym içindeki `scripts/gym2.test.js` keyboard assertion’ı da başarısız. Bu karma runner no-Coach release kapısı değildir.

## Doğrulanmış bulgular

### GYM-SEC-001 — Özel egzersiz adı SVG ARIA özniteliğinden HTML enjeksiyonu

- **Seviye:** Orta
- **Güven:** Yüksek
- **Katman:** Gerçek browser UI, iki viewport
- **Kaynak:** `www/modules/gym/exui.js:13,96`; `www/modules/gym/figlib.js:181-186`
- **Mekanizma:** Kullanıcının oluşturduğu egzersiz adı `FigLib.svg(...,{label:e.n})` ile SVG `aria-label` içine doğrudan yazılıyor. Bu yol `esc()` kullanmıyor.
- **Payload:** Özel egzersiz adı olarak `"/><img src=x onerror="window.__gymProbe=1">`.
- **Gözlem:** Gerçek Playwright restore/boot sonrası kütüphane → egzersiz detay ekranında `dangerous=1`, `marker=1` görüldü; iki viewport’ta da tekrarlandı.
- **Etki:** Saklanan özel egzersiz adı, egzersiz detayında aktif HTML/event-handler çalıştırabiliyor. Bu testte kod köprüsü veya native çağrı etkisi aranmadı; doğrulanan etki browser XSS/DOM execution’dır.
- **Önerilen düzeltme:** SVG attribute üretiminde label’ı güvenli attribute escape ile serialize et; aynı sink için regresyon testi ekle. Sadece `textContent` ile yapılan ekranların güvenli olması bu SVG sink’ini kapatmaz.

### GYM-INT-001 — Workout tamamlanması depolama hatasında atomik değil

- **Seviye:** Orta
- **Güven:** Yüksek
- **Katman:** Host/runtime quota probe
- **Kaynak:** `www/modules/gym/gym.js:684-691`; `www/main/01-core.js:251-288`
- **Mekanizma:** `gFinishSave` setleri filtreliyor, workout’u tamamlıyor, log ekliyor ve `save()` çağırıyor. `save()` başarısız olduğunda bu mutasyonları geri almıyor; `commit()` kullanan güvenli geri alma yolu burada kullanılmıyor.
- **Gözlem:** Depolama kotası zorlanınca canlı bellekte workout tamamlanmış ve set/log değişmiş görünürken kalıcı `nw_state` eski aktif workout’u korudu.
- **Etki:** Uygulama kapatılırsa tamamlanan antrenman, set budaması ve spor log’u kaybolabilir; kullanıcı canlı ekranda başarı görmüş olabilir.
- **Önerilen düzeltme:** Finish işlemini snapshot + `commit()` veya eşdeğer transaction ile atomic yap; yazma başarısızlığında workout, log ve setleri birlikte geri yükle ve başarı özeti açma.

### GYM-IMP-001 — Import timestamp saniyesi doğrulanmıyor

- **Seviye:** Orta
- **Güven:** Yüksek
- **Kaynak:** `www/modules/gym/importlib.js:43-51`
- **Mekanizma:** `stamp()` saniyeyi parse ediyor ancak yalnız yıl/ay/gün/saat/dakika doğruluyor; saniye `0-59` aralığında kontrol edilmiyor.
- **Gözlem:** `2024-01-01 00:00:60` reddedilmedi; JavaScript Date normalizasyonuyla farklı bir timestamp döndü.
- **Etki:** Strong/Hevy import’unda antrenman sırası, gün sınırı ve önceki seans seçimi sessizce değişebilir.
- **Önerilen düzeltme:** Saniye için `S>=0 && S<=59` kontrolü ekle; `60`, `99`, leap-day ve timezone/day-boundary regression testleri yaz.

### GYM-UX-001 — Keyboard state hesaplanıyor, layout sözleşmesi eksik

- **Seviye:** Orta
- **Güven:** Yüksek
- **Kaynak:** `www/main/06-events.js:160-163`; `scripts/gym2.test.js:121`
- **Mekanizma:** JS `body.kb` ve `--kb` ayarlıyor; beklenen `body.kb nav`, sheet ve composer yerleşim kuralları CSS’te yok.
- **Gözlem:** `node scripts/gym2.test.js` bir failure verdi: keyboard açıkken alt bar/sheet/composer davranışını doğrulayan assertion geçmedi.
- **Etki:** Kısa ekran ve mobil klavyede set alanları veya sheet kontrolleri klavye altında kalabilir.
- **Önerilen düzeltme:** Gereksinim doğruysa CSS kontratını gerçek ölçümlü viewport testleriyle uygula; değilse JS/CSS sözleşmesini sadeleştirip testi güncelle. Testi regex yerine browser geometry ile doğrula.

### GYM-UX-002 — Isınma seti “sonraki set” ve dinlenme akışına girebiliyor

- **Seviye:** Orta
- **Güven:** Yüksek
- **Kaynak:** `www/modules/gym/gym.js:21-24,334-336,54-55`
- **Mekanizma:** `gSetOk` ısınmayı hesaplardan çıkarıyor; ancak `gNext()` ilk `!done` seti seçerken `gSetOk` uygulamıyor. `gRestStart/gRestGo` da bu seçimin sonucuna göre davranıyor.
- **Etki:** Kullanıcıya hesaplarda yok sayılan ısınma seti aksiyon seti gibi gösterilebilir; yanlış rest davranışı ve bitirme akışı oluşabilir.
- **Önerilen düzeltme:** Aksiyon seti seçimini `gSetOk` ile ortaklaştır; ısınma için next/highlight/rest/finish acceptance testleri ekle.

## Statik ve cihaz doğrulaması bekleyen riskler

- `www/modules/gym/gym.js:57-69` ve `www/modules/gym/exui.js:110-116` rest/timer bildirim gövdesine egzersiz adını taşıyor. Gerçek Android lock-screen maskesi ve OEM renderer test edilmedi.
- Native LocalNotifications kimlikleri `9001`, `9002`, `9003` için process kill, Doze, Android 13+ izin reddi, exact-alarm reddi ve yeniden başlatma testi yok.
- `DeviceHelp.keepAwake` gerçek Android cihazda doğrulanmadı.
- Workout/template/custom exercise shard’larının IndexedDB restart, failed transaction ve yeniden kurulum testi eksik.
- 20 MB backup sınırı dışarıdan restore girdisini sınırlar; modül içindeki geçerli ama çok derin workout/set yapılarının render/CPU etkisi fiziksel düşük bellekli cihazda ölçülmedi.
- Gerçek APK/AAB, WebView ve OEM davranışı bu raporun kanıtı değildir.

## Kapsam dışında bırakılan ve şu an açık bulgu sayılmayanlar

- CSV’de `kg=0` veya boş opsiyonel alanlarda kolon kayması olasılığı statik risk olarak incelenmelidir; bu turda strict CSV parser ile runtime bulgusu açılmadı.
- Privacy category deletion’ın custom exercise/template tanımlarını silmemesi ürün-politika kararıyla netleştirilmelidir; bu turda beklenen saklama politikası tanımlı olmadığı için güvenlik açığı ilan edilmedi.
- Prototype pollution ve path traversal için bu turda doğrulanmış exploit bulunmadı.

## Geliştirme ve doğrulama sırası

1. `GYM-SEC-001`: SVG attribute escape + gerçek browser red/green regression.
2. `GYM-INT-001`: atomic finish/rollback + storage-failure integration test.
3. `GYM-IMP-001`: strict timestamp validation + import boundary corpus.
4. `GYM-UX-001`: keyboard CSS/geometry contract.
5. `GYM-UX-002`: warm-up action-set semantics.
6. CSV column alignment, privacy deletion policy, deep valid-state resource limits.
7. Emulator/device notification, lock-screen, restart, permission and keep-awake contract.

Bu liste geliştirme işidir; AR-GE incelemesiyle karıştırılmamalıdır. Her madde için önce kırmızı test, sonra en küçük düzeltme, komşu testler ve bağımsız kapanış denetimi gerekir.
