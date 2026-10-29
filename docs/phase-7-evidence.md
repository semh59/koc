# Faz 7 kanıt defteri — Health Connect ve opt-in backend

## Durum

Faz 7 yerel entegrasyon kapısı tamamlandı. Yerel Health Connect entegrasyonu mevcut ve host/browser testleriyle doğrulandı. Opt-in senkron adaptörü, remote backend, kimlik doğrulama ve uzak silme servisi mevcut değil; bu yüzden backend uygulanmış gibi gösterilmedi. Faz 7’nin backend bölümü tehdit modeli, DPA/vendor, veri konumu, API sözleşmesi, silme tatbikatı ve ihlal runbook'u olmadan kapatılmayacaktır.

Çalışma alanı: `D:/PROJECT/NeoWell`
Branch: `main`
Keşif HEAD'i: `b249550` (Faz 6 `CLOSE` sonrası; çalışma ağacındaki Faz 7 belgesi bu commit'e hazırlanıyor)

## Mevcut yerel akış

- `www/modules/pulse/hcui.js`: Health Connect kartı, izin ve ayar akışı.
- `www/modules/motion/stepsui.js`: telefon/saat adım değerlerini ayrı tutar; toplam yerine büyük değeri kullanır.
- `assets/android/HealthPlugin.java`: Android 14/API 34 üzerinde salt-okunur adım, uyku ve nabız toplama.
- `assets/android/MainActivity.java`: `Health` eklentisi kaydı.
- `www/main/01-core.js`: sağlık kayıtlarının temizlenmesi ve yedek dönüşü.
- Coach bağlamı Health Connect adım/uyku verisini dışarıda bırakır.
- Gizlilik silme akışları Health Connect kaynak işaretlerini sınırlar.

## Doğrulanan komutlar

- `node scripts/hc.test.js`: geçti.
- `node scripts/hc-card.test.js`: geçti.
- `node scripts/android.test.js`: geçti.
- `node scripts/verify-android-sync.test.js`: geçti.
- `npm run android:sync:verify`: `28 Java files, 44 source resources`.
- `node scripts/coach2.test.js`: geçti.
- `node scripts/coach.test.js`: geçti.
- `node scripts/autosend.test.js`: geçti.
- `node scripts/privacy3.test.js`: geçti.
- `node scripts/pii-coach-2-0.test.js`: geçti.
- `npm test`: `123 test files, 0 failed`.
- `git diff --check`: geçti.

Bu kanıtlar host, static ve fake-plugin katmanındadır. Java/Gradle, emulator, gerçek Android cihaz ve gerçek Health Connect sağlayıcısı doğrulanmadı; ortamda `JAVA_HOME`/Java yok.

## Faz 7 yerel sözleşmesi — tamamlanan bounded pull

Yerel Health Connect entegrasyonu için mevcut ve test edilen sözleşme:

- Kaynak alanları: telefon adımı `ph`, Health Connect adımı `hc`; birleşik günlük değer `max(ph, hc)`, toplama yapılmaz.
- Kayıt kimliği: mevcut yerel günlük kayıt kimliği `type=steps + day`; aynı gün için tek otomatik adım kaydı tutulur. Health Connect uyku kaydı `day + src:"hc"` ile işaretlenir; nabız günlük özet olarak tutulur.
- Okuma penceresi: son `HC_DAYS=8` takvim günü; kalıcı provider cursor kullanılmaz. Her yenileme bu sınırlı pencereyi deterministik biçimde yeniden okur.
- Silme sınırı: kullanıcı Health Connect kaynaklı kategoriyi sildiğinde `hcFrom` tarihi yazılır; daha eski provider verisi tekrar yerel kayda alınmaz.
- İzin ve varsayılan: `hcOn` kapalıysa plugin çağrılmaz; izin yoksa veri okunmaz; Android 14/API 34 uygunluk kapısı vardır.
- Coach sınırı: `hc` adım/uyku ve Health Connect nabız verisi Coach context/payload’ına girmez.

Bu sözleşme local-first bounded pull için tamamdır ve `hc.test.js`, `hc-card.test.js`, `android.test.js` ile doğrulanmıştır. Provider record ID, cursor, tombstone ve conflict ledger **yerel sözleşmenin değil**, gelecekteki opt-in sync adapter sözleşmesinin açık kapılarıdır; backend uygulanmadan eklenmeyecektir.

## Yerel entegrasyon açık doğrulamaları

- Java/Gradle, emulator, gerçek Android cihaz ve gerçek Health Connect sağlayıcısı doğrulanmadı; host/static/fake-plugin kanıtı olarak kalıyor.
- Gerçek provider record ID/cursor/tombstone davranışı, sync adapter tasarlanmadığı için yoktur.


## Backend/sync açık kapıları

1. **Sync adapter:** ayrı opt-in rıza, outbox/inbox, idempotency, retry/backoff, cursor, conflict ve uzak silme onayı.
2. **Threat model:** cihaz/WebView, KeyVault, gelecekteki backend, kimlik sağlayıcı, veritabanı/KMS, log/backup, destek erişimi ve dış sağlayıcı trust boundary'leri.
3. **DPA/vendor/residency:** sağlayıcılar, ülkeler, replikasyon, destek erişimi, saklama ve KVKK/GDPR aktarım kararı seçilmeden backend yok.
4. **API contract:** OpenAPI; auth/scopes, consent version, sync changes/cursor, export, delete request/status, pagination, limits, errors ve optimistic concurrency.
5. **Deletion drill:** uygulama, veritabanı, cache, log, backup, tombstone ve dış sağlayıcı kopyalarının kontrollü silinmesi ve kanıtı.
6. **Breach runbook:** algılama, containment, token/key rotation, delil koruma, vendor escalation ve bildirim karar ağacı.
`local contract → threat model → vendor/residency/DPA → API contract → sync adapter → backend`

Remote backend, bu kapılar ve gerçek deployment seçimi olmadan yazılmayacak. Faz 6 bağımsız `CLOSE` aldı ve `b249550` ile pushlandı; Faz 7 belgeleri ayrı commit'te tutulacak.

## Açık riskler

- Gerçek Android/Health Connect runtime testi yok.
- Health Connect refresh son okuma cursor'ı yerine sınırlı pencereyi yeniden okuyor.
- Yerel kayıt modelinde provider record ID, conflict ledger ve tombstone yok.
- Mevcut local-first depolama runtime at-rest encryption sağlamıyor.
- Mevcut dış AI sağlayıcılarına daha önce gönderilmiş veriler yerel silme ile geri alınamaz.
