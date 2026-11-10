# İnsan renderer/UI bağımsız sınır incelemesi

Tarih: 2026-11-09. Ürün dosyası değiştirilmedi. Yeni test: `scripts/gym-human-ui.test.cjs`.

## Gerçek yürütme

- `node scripts/gym-human-ui.test.cjs`: **10 PASS / 5 FAIL, exit 1**. Ayrıntı: `ui-test-output.log`, `ui-test-results.json`.
- Generation guard yalnız bellekte kaldırıldı: **MUTATION RED (expected): late viewer must be disposed after real app close; 0 !== 1**. App boot ve loader girişine ulaşılıyor; beklenen davranış assertion'ı kırılıyor. Orijinal kod test yazılmadan önce RED görüldü iddiası yok.
- `node scripts/paths.test.js`: **3 PASS, exit 0**.
- `node --check scripts/gym-human-ui.test.cjs`: **exit 0**.
- `node scripts/gym-3d.test.js`: bundle bütünlük assertion'ı PASS, ardından `fig3d.js:6` → `TypeError: Cannot read properties of undefined (reading 'pose')`, exit 1. Eski test insan rig'i olmayan sahte mannequin ile `applyPose()` çağırıyor.

## Kanıt sınırı

UI testleri `scripts/html.js` ile gerçek `www/index.html` ve bütün app scriptlerini jsdom'da boot eder; `data-g` click yönlendirmesi, gerçek `gClick`, `exSheet`, `exSheet3D`, `openSheet`, `closeSheet` çalışır. Ağır Fig3D sadece kontrollü async promise ile değiştirilir. RAF kümesi test doubles'ına aittir; gerçek GPU/RAF testi değildir. Ayrı iki test gerçek `fig3d.js` ve gerçek Three.js bundle çalıştırır, WebGLRenderer/OrbitControls/GLTFLoader enstrümante edilir. Parent'ın gerçek tarayıcı/model testinden bağımsız caller kanıtıdır; onun yerine geçmez. Anatomi doğrulaması yapılmadı.

## Doğrulananlar

- `gym.js:701,719-720` üzerinden render edilmiş 3D düğmesi gerçek caller'ı açıyor. `exui.js:115` hareket tanımına `_template:e.tp` ekliyor; `:116` highlight'a bütün katalog egzersiz nesnesini veriyor, sadece bölge string'i değil.
- Gerçek renderer GLTFLoader URL'si `fig3d.js:4` → `models/athletic-human.glb`. UI caller ve gerçek renderer ayrı test katmanlarında doğrulandı; tek uçtan uca gerçek GLB browser testi diye sunulmuyor.
- Reduced-motion başlangıç pause ve düğme resume/pause senkronu geçti (`exui.js:121,125-130`).
- Gerçek `openSheet` ve `closeSheet`, `g3DStop` çağırıyor (`main/04-sheets.js:9,21`). Close DOM'u kaldırmıyor, sınıfını kapatıyor (`:23-24`); container hâlâ `isConnected===true`. Generation guard bu yüzden zorunlu.
- Aktif viewer close ile dispose oluyor; load devam ederken close sonrası dönen viewer dispose oluyor; loader başladıktan sonraki egzersiz değişiminde sadece son viewer oynuyor/canvas bağlı kalıyor (`exui.js:90-93,113`).
- GLB yükleme rejection yolunda gerçek renderer/controls/floor-grid kaynakları temizleniyor, canvas kaldırılıyor (`fig3d.js:17-18`). UI hata mesajından kapatıp detayı tekrar açınca kullanılabilir 2D SVG var.
- Normal app egzersiz detayı/3D'de pilot/debug/geliştirici etiketi yok; kas alanları şematik deniyor (`exui.js:119,137`). “Serbest Açı” kamera işlev adı; tek başına dev etiketi sayılmadı.

## Parent için açık bulgular

### 1. [P1] 60 ms başlamadan hızlı değişimde eski timer yeni kutuda ikinci loader açıyor — RED

`exui.js:107-113`: generation ancak `await createViewer` sonrasında kontrol ediliyor. Timer başladığında `document.getElementById` yeni sheet'in kutusunu getiriyor. İki egzersizi timer'lar çalışmadan açan gerçek caller testi `pending.length===1` beklerken **2** görüyor. Eski sonuç sonradan dispose edilse de gereksiz ikinci renderer/load başlıyor; sonuç sırası ve gerçek canvas `replaceChildren()` etkileşimi ayrıca risk. Timer başında generation/bağlılık kontrolü ya da timer iptali gerekli. Bu test sonsuz RAF sızıntısı var iddiası değil, gözlenen iki loader çağrısının kanıtı.

### 2. [P1] Viewer alındıktan sonraki play/highlight hatasında hemen dispose yok — RED

`exui.js:114-122`: viewer global atanıyor, `play` veya highlight fırlayınca catch sadece yazı basıyor. Kontrollü `play` hatasında dispose sayısı **0**; global viewer tutuluyor. Sonraki sheet close cleanup yapabilir, fakat hata anında renderer/controls/observer kalıyor. Catch acquired viewer'ı dispose edip global'i temizlemeli. UI hata mesajı tek başına kaynak temizliği değildir.

### 3. [P1/P2] Kalibrasyon hatasında yüklenmiş GLB sahnesi cleanup dışında kalıyor — RED

`fig3d.js:4`: GLB ve kalibrasyon aynı Promise.all içinde; kalibrasyon HTTP başarısız olduğunda `gltf.scene` hiçbir zaman viewer scene'ine eklenmiyor. `:17-18` yalnız viewer scene'ini geziyor. Başarıyla dönen GLB geometry/material dispose sayısı **0**, beklenen **1**. Renderer/controls/floor temizliği aynı testte geçti. Bu dosya dışı GLB kaynak ömrü kusuru; kaynakların bu aşamada GPU'ya yüklenmiş olduğunu iddia etmiyoruz. Bir promise erken reject olurken diğeri geç resolve yolu da ayrıca tasarlanmalı.

### 4. [P2] Primary/secondary kas adları ekranda yok — RED

`exui.js:116` dönen `muscles` kullanmıyor. `:119` yalnız genel renk açıklaması yazıyor. Testte dönen primary `chest`, secondary `triceps/frontDeltoid` için okunabilir adlar görünmüyor. Renk tek başına bilgi taşıyor; primary/secondary listesini kullanıcı dilinde metinle gösterin. İsimlerin anatomik doğruluğu bu incelemenin iddiası değil.

### 5. [P2] Paketlenen standalone sayfa eski playback API'sini kullanıyor — RED

`figure-3d.html:93-100` `_playTimer` clearInterval yoluna bağlı; yeni viewer `fig3d.js:19-23` RAF/pause/resume kullanıyor. Standalone düğmesine gerçek click sonrası `_paused` hâlâ **false**. Ayrıca `figure-3d.html:82-83` `_template` eklemiyor, highlight çağırmıyor, reduced-motion kontrolü yok; `:6,30` “Pilotu” etiketi kalmış. Normal app etiketi testi bunu gizlemiyor: standalone ayrı giriş. Standalone kaldırılacaksa dağıtımdan açıkça çıkarılmalı; tutulacaksa yeni sözleşmeye geçirilmeli.

### 6. [P1] Yeni .cjs testleri standart gate dışında; eski gym-3d gate artık kırılıyor

`package.json:29` → `scripts/run-tests.js:13` sadece `.test.js` toplar; yeni `gym-human-ui.test.cjs` ve parent `gym-human-viewer.test.cjs` bulunmaz. `scripts/run-no-coach-tests.js:6` açık dosya listesinde bu ikisi ve human rig/muscle/equipment testleri yok (inceleme anı). `.github/workflows/apk.yml:46-49` release/no-coach için bu listeyi kullanır. Aynı listede `gym-3d.test.js` var ve bugün gerçek yürütmede eski mannequin sözleşmesiyle kırıldı. Parent test seçimini ve eski fixture'ı düzeltmeli; bunu geçer gate saymayın.

## Build / HTML / SW / dağıtım

- `index.html:63-74` ve `figure-3d.html:62-68`: Three bundle → FigLib/FigTpl → human-rig/muscles/equipment → Fig3D sırası doğru; referans dosyalar mevcut.
- `scripts/build-three-bundle.js:13-16`: Three, OrbitControls, GLTFLoader, CCDIKSolver export eder; IIFE/global THREE ve chrome80/es2018 hedefi `:27-34`. Bu incelemede bundle yeniden üretilmedi.
- `package.json` prebuild/build/postinstall adımı tanımlamıyor. `.github/workflows/apk.yml` npm ci ardından test ve Capacitor workflow kullanıyor; Three bundle yeniden üretimi çağrısı yok. Dağıtım checked-in bundle'a dayanıyor; regeneration drift ayrı gate ile korunmalı.
- `capacitor.config.json:4` `webDir:"www"`. CI `.github/workflows/apk.yml:62-65` android platformunu üretip `cap sync android` çalıştırıyor.
- Yüklü Capacitor CLI `node_modules/@capacitor/cli/dist/tasks/copy.js:93,134-146` bütün webDir'i `fs-extra.copy` ile taşır; human dosyalarını eleyen allowlist yok. Bu nedenle `www/models/athletic-human.glb`, `www/modules/gym/human-hand-support.json` ve standalone pilot sayfası da kaynakta bulunduğunda copy kapsamındadır. APK/zip açılarak byte-hash doğrulaması bu görevde yapılmadı.
- `www` JS/HTML içinde `serviceWorker`, `caches.open`, `precache` araması eşleşmedi. Ayrı SW asset allowlist sözleşmesi tespit edilmedi; offline APK davranışını SW varmış gibi iddia etmeyin.

## Değişen dosyalar

Yalnız `scripts/gym-human-ui.test.cjs` ile bu klasörün rapor/log/JSON dosyaları oluşturuldu. Ürün dosyası, mevcut test, runner, package, CI veya Android ağacı değiştirilmedi. Parent düzeltmelerinden sonra aynı testi yeniden çalıştırmalı; JSON/log her yürütmede son sonucu yazar.
