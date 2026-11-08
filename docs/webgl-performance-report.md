# WebGL Performans ve Mobil Optimizasyon İncelemesi (Fig3D)

Tarih: 2026-11-08 · Kapsam: `www/modules/gym/fig3d.js`, `www/modules/gym/exui.js`, `scripts/build-three-bundle.js`, `www/vendor/three/three.bundle.js`, `www/figure-3d.html`, Android varlıkları.

## 1. Mevcut durum özeti

| Metrik | Değer | Kaynak |
|---|---:|---|
| Three.js bundle | 770.339 bayt (~752 KB) | `www/vendor/three/three.bundle.js` |
| Bundle hedefi | `chrome80`, `es2018`, IIFE, minify | `scripts/build-three-bundle.js` |
| Render döngüsü | Sürekli `requestAnimationFrame` | `fig3d.js` `renderLoop` |
| Gölge haritası | `PCFSoftShadowMap`, 1024×1024 | `createViewer` |
| Zemin geometrisi | `CircleGeometry(2.4, 32)` | `createViewer` |
| Halka geometrisi | `RingGeometry(1.6, 1.62, 48)` | `createViewer` |
| Mannequin segmentleri | 14–24 (silindir/küre) | `createMannequin` |
| Android smoke | API 31/36 geçti | mevcut test raporu |

## 2. Bulgular

### 2.1 Bundle boyutu (752 KB)

- `export * from "three"` + `OrbitControls` entry'si tüm Three.js API'sini tek IIFE olarak paketliyor. Minify yapılmış, ancak tree-shaking etkisiz çünkü tüm export'lar yeniden dışa açılıyor.
- Hedef cihazlar (Android WebView, eski Chrome) için 752 KB tek parça indirme/pars etme maliyeti yüksek; ilk açılışta ana thread bloklanabilir.
- Öneri: yalnız kullanılan sınıfları (`Scene`, `PerspectiveCamera`, `WebGLRenderer`, `OrbitControls`, geometriler, materyaller, ışıklar) içe aktaran dar entry; veya lazy-load (3D modal açıldığında bundle yükle).

### 2.2 Render döngüsü

- `renderLoop()` her karede `controls.update()` + `renderer.render()` çağırıyor. `enableDamping=true` nedeniyle sürekli animasyon gerekli görünüyor, ancak kullanıcı etkileşimi yokken de 60 FPS çalışıyor.
- Sayfa arka planda bile (modal kapalıysa viewer dispose ediliyor) döngü devam ederse pil/CPU tüketimi artar.
- Öneri: `controls` `change` olayında render tetikle; damping bittikten sonra döngüyü durdur. `document.visibilitychange` ile sekme gizliyken `isRunning=false`.

### 2.3 Gölge haritası

- `PCFSoftShadowMap` + 1024×1024 tek ışık. Yumuşak gölge kalitesi yüksek ama mobil GPU'da fill-rate maliyeti büyük.
- Sadece zemin `receiveShadow=true`; mannequin gölgesi tek platforma düşüyor.
- Öneri: mobilde `BasicShadowMap` veya `PCFShadowMap` + 512×512; düşük kalite modunda gölgeleri tamamen kapat (`shadowMap.enabled=false`).

### 2.4 Geometri segment sayıları

- `CylinderGeometry(..., 16)`, `SphereGeometry(…, 20, 16)`, `CircleGeometry(2.4, 32)`, `RingGeometry(…, 48)`, barbell/disk 16–24 segment.
- Mobilde vertex sayısı × transform maliyeti gereksiz. Görsel fark küçük.
- Öneri: silindir 12, küre 12×10, zemin 24, halka 32; düşük kalite modunda 8/8/16/24.

### 2.5 Bellek yönetimi

- `dispose()` sadece `controls`, `renderer` ve DOM'u temizliyor; sahne geometri/materyal/texture dispose edilmiyor. `play()` tarafından oluşturulan `_playTimer` interval'i temizlenmiyor.
- `createMannequin` içinde birçok geometri tek kullanımlık oluşturuluyor (chest, pelvis, head, visor, foot box); paylaşım yok.
- Öneri: `dispose()` içinde `scene.traverse` ile geometry/material dispose; `_playTimer` clearInterval; renderer context loss dinle. Geometrileri paylaşılabilir sabitler olarak çıkar.

### 2.6 Android WebView uyumluluğu

- Manifest'te `hardwareAccelerated` açıkça yazılmamış; tema varsayılanı genellikle açık. WebGL context loss durumunda yeniden oluşturma kodu yok.
- `powerPreference: "high-performance"` pil tüketimini artırabilir; mobilde `"default"`/`"low-power"` daha uygun olabilir.
- `setPixelRatio(Math.min(dpr, 2))` yüksek DPR cihazlarda (3x) bile 2x'e sınırlıyor; iyi, ancak 1.5x mobilde yeterli olabilir.
- Öneri: context loss/restored handler'ları ekle; cihaz sınıfına göre DPR ve gölge kalitesini ayarla; Android sync doğrulamasını (`scripts/verify-android-sync.js`) bundle değişikliğinde çalıştır.

### 2.7 Pil tüketimi

- Sürekli RAF + 4 ışık + PBR materyaller (`MeshStandardMaterial`) + antialias + alpha + backdrop-filter blur (CSS) birlikte mobilde pil tüketimini artırır.
- Modal açıldığında animasyon (64 kare, ~40 ms aralık) sürekli pose güncellemesi yapar; gereksiz yeniden hesaplama.
- Öneri: pose güncellemesini `requestAnimationFrame` ile hizala; görünür değilken duraklat; düşük güç modunda ışık sayısını azalt (ambient + tek directional), antialias'ı kapat.

## 3. Öncelikli öneriler

### P0 (hemen, düşük risk)

1. `dispose()` tam temizlik: `_playTimer` clearInterval, `scene.traverse` geometry/material dispose, renderer forceContextLoss.
2. `visibilitychange` ile görünür değilken render döngüsünü durdur.
3. Mobil tespiti: `powerPreference` ve DPR'yi cihaza göre seç (`navigator.userAgent`/`deviceMemory`).

### P1 (kısa vadede)

4. Gölge haritasını 512 + `PCFShadowMap`; mobilde gölgeyi kapatma seçeneği.
5. Segment sayılarını azalt (silindir 12, küre 12×10, zemin 24, halka 32).
6. Render on-demand: damping bittikten sonra RAF durdur; `change` olayında tek kare render.
7. Bundle'ı dar entry ile küçült veya lazy-load.

### P2 (orta vadede)

8. Düşük güç modu: ışık sayısını azalt, antialias kapalı, `MeshLambertMaterial` seçeneği.
9. WebGL context loss/restored handling.
10. Android WebView performans smoke testi (FPS/pil) e2e'e eklenmesi.

## 4. Doğrulama

- `node scripts/gym-3d.test.js` → PASS (4/4) (mevcut).
- Değişiklik sonrası: bundle boyutu, `node scripts/verify-android-sync.js`, `npm run test:e2e` (varsa 3D smoke).

## 5. Riskler / notlar

- Bundle daraltma testleri (`gym-3d.test.js`) sadece `Scene`, `PerspectiveCamera`, `OrbitControls`, `WebGLRenderer` kontrol eder; dar entry'de bu sınıflar korunmalı.
- Görsel kalite düşüşü kullanıcı algısını etkileyebilir; ayarlarla kapatılabilir "yüksek kalite" seçeneği önerilir.
- Bu rapor incelemedir; kod değişikliği yapılmamıştır.
