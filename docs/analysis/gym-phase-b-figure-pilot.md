# B-4 Görsel Kalite Pilot Raporu (2.5D Çöp Adam & 9 Aile Matrisi)

## 1. Amaç ve Kapsam
NeoWell'in hafif, anlaşılır çöp adam (stick-figure) görsel dilini koruyarak, hareket formunu daha anlaşılır kılan 2.5D hacim (volume), eklem derinliği (pelvis, diz, dirsek eklemleri), hareketin uç noktalarını gösteren soluk başlangıç/bitiş katmanları (ghost) ve zemin referansı (fixed ground shadow) pilotu oluşturulmuştur.

**Katalog Genişletilmemiştir:** Bu pilot aşamasında kataloğa hiçbir yeni hareket eklenmemiş, runtime 332 kaydı ve SHA-256 bütünlüğü tamamen korunmuştur.

## 2. 9 Hareket Ailesi Matrisi
Görsel dilin tüm kinetik zincirlerde (itme, çekme, bacak, gövde, denge, kardiyo) çalıştığını doğrulamak üzere 9 temel aile belirlenmiş ve pilot galeriye (`www/figure-pilot.html`) yerleştirilmiştir:

1. **Squat** (`squat`): Diz ve kalça fleksiyonu, gövde açısı.
2. **Bench / Push-up** (`pushup`): Üst gövde itişi, dirsek açısı ve zemin teması.
3. **Hinge** (`hinge`): Kalça menteşesi, sırt düzlüğü ve bar çizgisi.
4. **Lunge** (`lunge`): Adımlama derinliği ve çift bacak eklem ayrımı.
5. **Row** (`row`): Çekiş ekseni, dirsek geriye çekilme derinliği.
6. **Carry** (`carry / farmer walk`): Ayrı deneysel prototip, dik duruş ve iki elde yük taşıma.
7. **Cardio** (`highknees`): Dinamik tempo, bacak kaldırma açısı.
8. **Mobility** (`hamstretch`): Esneme menzili ve statik form.
9. **Balance** (`onefoot`): Tek ayak zemin basışı ve ağırlık merkezi dengesi.

## 3. Geriye Dönük Uyumluluk ve Görsel Sözleşme
- **Varsayılan Davranış Korundu:** `FigLib.svg(def)` çağrısı parametresiz yapıldığında birebir eski klasik çizgiyi (`data-fig-style="line"`) üretir.
- **Opt-in Pilot Parametreleri:** `FigLib.svg(def, { style: "volume", ghost: true })` opsiyonu ile 2.5D hacim ve uç nokta ghost katmanları açılır.
- **Görsel Bütünlük:**
  - `viewBox="0 0 160 150"` boyutu ve koordinat sistemi değiştirilmemiştir.
  - CSS sınıfları (`fg-far`, `fg-near`, `fg-body`, `fg-joint`, `fg-pelvis`, `fg-highlight`, `fg-shadow`, `fg-ghost`) ile tema değişkenlerine (`var(--prim)`, `var(--mut)`, `var(--card)`) tam uyumludur.
  - SVG içi tekil ID (`id="..."`) kullanılmayarak DOM/bileşen çoğaltmalarında kimlik çakışması riski sıfırlanmıştır.
  - `aria-label` attribute kaçışları ve `prefers-reduced-motion` SMIL durdurma desteği tamdır.

## 4. Test ve Doğrulama
- `scripts/gym-figure-pilot.test.js` (1 PASS): Opt-in hacim, eklem, gölge ve varsayılan uyumluluk testleri.
- `scripts/gym-figure-matrix.test.js` (1 PASS): 9 hareket ailesinin eksiksiz SVG ve matris üretimi doğrulaması.
- `scripts/fig.test.js` (17 PASS): Mevcut figür regresyon testleri tam yeşil.
- `scripts/design.test.js` (36 PASS): Tasarım tokenları, CSS değişkenleri ve inline style testleri yeşil.
- `scripts/run-no-coach-tests.js` (88 dosya): Tüm testler başarıyla geçti (0 FAIL, 8 Coach-only skipped, 18 mixed scoped).
- Playwright E2E (`npx playwright test -c e2e/playwright.config.js`): 18/18 PASS (phone-360 ve phone-412 üzerinde figure pilot ve no-coach akışları tam yeşil).
- Android kaynak senkronizasyonu (`scripts/verify-android-sync.js`): 28 Java, 44 resource, 759 web asset tam eşleşti (exit 0).
