# İmza ve yayın akışı

## Anahtarlar
| Anahtar | Nerede | Ne imzalar |
|---|---|---|
| `neowell-upload` (RSA 4096, PKCS12, 10000 gün) | Repo dışında: `D:\PROJECT\koc-release-key\neowell-upload.jks`, parolalar yanındaki `ANAHTAR-BILGISI.txt`; CI'da gizli değişkenler | Yayınlanan APK ve AAB. Play'de upload key. |
| `signing/known-debug-smoke-only.keystore` (parola `android`, depoda açık) | Depo | Yalnız CI içi smoke derlemesi. Yayınlanmaz. |

Release sertifikası SHA-256: `89:A6:ED:7D:72:F2:75:25:FC:74:A3:52:3F:99:86:8E:89:0B:5A:3F:0C:70:DE:2A:84:5E:A5:42:62:F1:43:EE` (apk.yml'de `RELEASE_SHA256`).

Debug anahtarı herkesçe bilindiği için onunla imzalı bir APK'yı herkes "güncelleme" diye üretebilir; bu yüzden yayınlanan hiçbir şeyi imzalamaz. Ekim 2026'ya kadar yayınlanan APK'lar eski adıyla (`signing/koc-debug.keystore`) bu anahtarla imzalıydı; dosya depo geçmişinde kalır.

Release anahtarı kaybolursa bu paket adına güncelleme çıkarılamaz (Play App Signing kullanılıyorsa upload key Play Console'dan sıfırlatılabilir). Anahtar dosyasını ve bilgi dosyasını en az iki ayrı güvenli yerde tut.

## GitHub gizli değişkenleri (semh59/koc)
`RELEASE_KEYSTORE_B64` (jks'in base64'ü), `RELEASE_KEYSTORE_PASSWORD`, `RELEASE_KEY_ALIAS` (`neowell-upload`), `RELEASE_KEY_PASSWORD`. Yeniden kurmak için (Git Bash, anahtar dizininde):
```
base64 -w0 neowell-upload.jks | gh secret set RELEASE_KEYSTORE_B64 -R semh59/koc
gh secret set RELEASE_KEYSTORE_PASSWORD -R semh59/koc   # parolayı yapıştır
gh secret set RELEASE_KEY_PASSWORD -R semh59/koc        # aynı parola
printf neowell-upload | gh secret set RELEASE_KEY_ALIAS -R semh59/koc
```

## CI (`.github/workflows/apk.yml`)
1. `scripts/patch-android.js` build.gradle'a iki imza yapılandırması ekler: debug (bilinen anahtar) ve release (anahtar `RELEASE_KEYSTORE_FILE` ortam değişkeninden).
2. Gizli değişken yoksa CI durur; debug imzaya düşmez. İş akışında PR tetikleyicisi yok, eksik değişken yalnız yanlış yapılandırma anlamına gelir.
3. `assembleDebug assembleRelease bundleRelease`: release buildType (debuggable=false, R8/minify kapalı).
4. apksigner (APK) ve `keytool -printcert -jarfile` (AAB) parmak izi `RELEASE_SHA256`'ya eşit ve debug anahtarınınkinden farklı olmalı; manifestte `debuggable` olmamalı.
5. Smoke (yalnız elle çalıştırmada, API 36 google_apis emülatör): `smoke.sh` debug derlemede (run-as gerekir), ardından `smoke-release.sh` release APK'yı kaldır-kur-aç, çökme, widget verisi (root ile) ve alarm sayısıyla denetler.
6. Releases'e (`son-surum`) `neowell.apk` + `neowell.aab` yalnız `main` dalında yüklenir.

7. Hedef API ve 16 KB: release ve debug APK'da `aapt2 dump badging` `targetSdkVersion:'36'` göstermeli, `zipalign -c -P 16` geçmeli; arm64-v8a ve x86_64 `.so` dosyalarının her LOAD bölümü `readelf` ile en az 0x4000 hizalı olmalı. Biri tutmazsa CI durur.

## API 36 (B10, Ekim 2026)
- Play şartı: 31 Ağustos 2026'dan beri yeni uygulama ve güncellemeler API 36 hedeflemeli (kurulu uygulamalar için alt sınır API 35). Kaynak: developer.android.com/google/play/requirements/target-sdk.
- Capacitor 8 şablonu compileSdk/targetSdk 36, minSdk 24 verir (`variables.gradle`, `npx cap add android`); patch-android SDK değerine dokunmaz. AGP 8.13, Gradle 8.14.3, JDK 21, Node 22 gerekir.
- Yerel bildirim eklentisi `~8.2` sabit: 8.3 Kotlin ile yeniden yazıldı ve yeni depoya taşındı; hatırlatma alarmları uygulamanın çekirdeği olduğu için olgunlaşınca ayrı denenmeli.
- Kenardan kenara (API 35+ zorunlu): içerik sistem çubuklarının altına çizilir. Capacitor SystemBars (`insetsHandling: css`) `--safe-area-inset-*` yazar, CSS `--sat`/`--sab` bunları (yoksa `env()`) kullanır. `initialViewportFitValueHint: cover` açılıştaki kaymayı önler. Durum çubuğu simge rengi uygulama temasından `SystemBars.setStyle` ile ayarlanır.
- Geri tuşu: Android 16'da öngörülü geri varsayılan açık; App eklentisi `OnBackPressedDispatcher` kullandığı için `backButton` dinleyicisi çalışmaya devam eder. Manifestte `screenOrientation` yok (büyük ekranda yön kilidi zaten yok sayılır).
- 16 KB sayfa: ML Kit yazı tanıma 16.0.1 ve barkod 17.3.0 16 KB destekli (Ağustos 2024 sürüm notu); CI her derlemede doğrular.

## Play
Play App Signing açık olmalı; ilk AAB yüklemesi `neowell-upload`'ı upload key yapar. Her yeni yüklemede `versionCode` artmalı: `scripts/patch-android.js` CI'da `GITHUB_RUN_NUMBER` (çalışma numarası) değerini `versionCode` yapar, yani her derlemede kendiliğinden artar. Yerel derlemede (GITHUB_RUN_NUMBER yok) Capacitor şablonundaki 1 kalır; Play'e yalnız CI çıktısı yüklenir. `versionName`'e kod dokunmaz, şablon değeri kalır.
