# Gerçekçi insan modeli — yayılım kararı

## Son kontrol: eşzamanlı çalışma ağacı değişikliği

**Önemli:** İnceleme sırasında başka bir süreç/çalışan `fig3d.js`, `index.html`, `figure-3d.html` dosyalarını değiştirdi ve human-rig/equipment/muscles modüllerini ekledi. Bu görev bunları yazmadı. Aşağıdaki eski 3D satır referansları **HEAD `bfdd839` tabanını** tarif eder; son dirty çalışma ağacını değil. Katalog girdileri ve 332 sayımı değişmedi.

Son gerçek tekrar çalıştırmada **3 test geçti, `gym-3d.test.js` kaldı**: `fig3d.js:6`, `m._humanRig.pose` için `TypeError: Cannot read properties of undefined (reading 'pose')`. Yeni renderer eski mock test fixture'ıyla uyumsuz; bu test başarısızlığı gerçek kullanıcı görünümünün bozuk olduğunu tek başına kanıtlamaz. Önceki 4/4 çıktısı güncel ağacın sonucu olarak kullanılmamalı. `inventory.json.tests` son komut çıktısını içerir.

Son dirty kaynak statik kontrolü: `fig3d.js:4` artık `models/athletic-human.glb` + `human-hand-support.json` yükler; `:5` HumanMuscles, `:6` HumanRig, `:18` HumanEquipment; `:26` 120 örnek ve skin motion-sphere kadrajı; `:28` public API'ye createMannequin eklenmiş. `index.html:66-68` ve `figure-3d.html:65-67` yeni modülleri yükler. Bu yeni modüllerin bütün davranışı bu salt okunur katalog görevinin kapsamında doğrulanmadı.

`exui.js:112` hâlâ yalnız `e.r` string gönderir. Yeni `human-muscles.js:59` pushup özel secondary rolü için id+tp+r ister; bu çağrı özel dalı tetiklemez. `human-muscles.js:69` çıktısı illustrative=true, validatedAnatomy=false. Katalogdaki açık primary/secondary eksikliği halen **332/332**; kaba bölgeden türetilmiş runtime renkler bu veri boşluğunu kapatmaz.

## Kapsam ve kanıt düzeyi

- Salt okunur üretim incelemesi. Üretim JS/HTML/veri/model değiştirilmedi; commit/silme/build/sync yapılmadı. Yalnız bu analiz klasörüne çıktı ve tekrar üretilebilir analiz betiği yazıldı.
- `inventory.json`: 332 kaydın tam runtime nesnesi, ID, ad, şablon, o/pr override, çözümlenen tanım, cue, dinlenme, kaynak metaverisi, 65 faz ölçümü, eksik kas listeleri, bütün grup üyelikleri ve gerçek test stdout/exit değerleri.
- `inventory.md`: tam 332 ID listesi ve şablon/ekipman/prop/sahne/öneri ailesi kırılımları.
- `inventory.cjs`: `node docs/analysis/exercise-human-rollout/inventory.cjs`; kök/dal/HEAD yanlışsa durur. Node VM gerçek `gym.js` ve `exui.js` tanımlarını yürütür; zamanlayıcı ve görünürlük event kaydı etkisizdir; DOM/WebGL ve kullanıcı deposu yoktur. Sayım regex ile yapılmadı.
- Kabul girdisi: kullanıcı düzeltilmiş bağımsız şınav görünümünü/hareketini onayladı, tüm egzersizlere yayılmasını istedi. Bu kabul diğer 331 ID için hareket/temas/anatomi kabulü değildir.

## Doğrulanan sayılar

| Ölçü | Sonuç |
|---|---:|
| Dış kaynak runtime | 324 |
| Yerel ek | 8 = 6 denge + 2 yürüyüş |
| Yerleşik runtime toplam | **332 benzersiz ID** |
| Tanımlı/kullanılan FigTpl | **60 / 60** |
| Kullanıcı özel egzersiz şablon seçenekleri `GFIG` | 48 |
| `exDef` çözümlenen / sonlu koordinat | 332 / 332 |
| Farklı örneklenmiş eklem yolu | 76 |
| Örneklerde tamamen sabit eklem yolu | 9 |
| Açık primary muscle eksik | 332 |
| Açık secondary muscle eksik | 332 |
| Canonical kimlik incelemede | 332 |
| Anatomik/semantik tekillik kanıtıyla kabul edilmiş | 0; eksik kanıt, tümü kopya demek değil |

Ekipman filtreleri: **Salon 125, Ev tipi 106, Ağırlıksız 101**. Bunlar gerçek alet listesi değildir. `pr` model prop seçimi; default, `-` (prop kaldır), `bar`, `bar@sh`, `db`, `db@sh`, `kb`, `ball`; efektif prop ve sabit sahne JSON'da ayrı tutuldu. Kablo ankrajı, makine mekanizması, yük yönü, tutuş ve destekler tam veri değil.

`gExAll()` = `EXDB.concat(S.customEx)` (`www/modules/gym/gym.js:18`). Kullanıcıya göre toplam `332 + customEx.length`; özel egzersiz şablonsuz olabilir, 3D sözleşmesinde dürüst fallback gerektirir. Gerçek kullanıcı custom kaydı okunmadı. `EXBY` balance append sonrasında oluşturulur (`gym.js:12`; `www/index.html:61-71`).

### Sabit çıkan 9 ID — VM ile ölçüldü

`reardelt`, `bandupright`, `dbupright`, `dbupright1`, `extrot`, `smithupright`, `wristcurl`, `wristrev`, `wristcurlbar`.

Hepsi `k:w`; 65 fazda ölçülen joint koordinat farkı sıfır. Efektif override hareketi bastırıyor; bu bir gerçekçi model hareketi değildir. Parmak/bilek ekseni gibi mevcut 2D joint modelinde temsil edilmeyen hareket ayrıca tanımlanmalı. Örneklenmiş koordinat eşitliği klinik teşhis veya kayıtların semantik aynı olduğuna kanıt değildir.

## Runtime girişleri ve tüm doğrudan çağıranlar — statik iz

### Üretim 2D / 2.5D SVG

1. `www/index.html:61-73`: exlib → balance → Three bundle → FigLib → FigTpl → Fig3D → excues → programs → musclemap → gym → exui → guidelib → guideui.
2. `www/modules/gym/exui.js:6-11` `exDef(e)`: FigTpl kopyası, `e.o` override, `e.pr` prop değişimi; şablon eksikse null. Bütün çözümlenen 332 tanım kaydedildi. `d.o=e.o` şablon override'ını **değiştirir**, merge etmez; yeni adaptör mevcut anlamı sessizce değiştirmemeli.
3. `exui.js:13` `exFig(e,anim,ghost=false)` → `FigLib.svg(...variant:'volume')`. Doğrudan çağıranlar **yalnız** `exListHtml` (`exui.js:22`, statik küçük resim) ve `gdRender` (`guideui.js:73`, rehberli animasyon).
4. `exSheet` (`exui.js:123-133`) `FigLib.svg`'yi doğrudan çağırır (`:128`, animasyonlu volume, ghost false). Doğrudan çağıran `exClick` `exinfo` (`:281`). Event üreticileri katalog satırı (`:22`) ve aktif antrenman bilgi düğmesi (`gym.js:386`). Shell `www/main/06-events.js:14` → `gClick`; `gym.js:903` default → `exClick`.
5. FigLib public yüzeyi: `B,FLOOR,W,H,KEYS,full,frame,sample,svg` (`figlib.js:243`). Üretim `svg`: yukarıdaki iki exui yolu. Üretim `sample/frame`: `fig3d.js:553-554`; motor kendi iç çağrıları ayrıca var. Üretim ağacında `FigEngine2D` sembolü **yok**; doğru motor adı `FigLib`.
6. `www/figure-pilot.html`: `scripts/render-figure-pilot.js` ile önceden oluşturulmuş SVG galerisi; yeni 3D runtime çağıranı değil. 9 temsilci aile, tüm katalog değil (`render-figure-pilot.js:3-12`). Carry örneği elle kurulmuş pilot tanımı; canonical carry kapsamı kanıtı değil.

### Üretim 3D (şu an eski model)

- UI: `exSheet` `open3d:<id>` düğmesi (`exui.js:129`) → shell `data-g` → `gClick` `open3d` (`gym.js:719`) → **tek üretim çağıran** `exSheet3D` (`exui.js:92-115`).
- `exSheet3D` → `g3DStop`, `exDef`, `Fig3D.isSupported`, `openSheet`; 60 ms async callback → `Fig3D.createViewer`, `Fig3D.play`, `Fig3D.highlightRegions(e.r)`, doğrudan render; reduced motion → viewer.pause.
- `g3DTogglePlay` (`exui.js:117-121`) inline `onclick` düğmesinden (`:104`) → viewer.pause/resume. `g3DStop` (`:91`) → viewer.dispose; çağıranları `exSheet3D` ve `www/main/04-sheets.js:9,21` openSheet/closeSheet. Yeni renderer bu yaşam döngüsünü korumalı.
- `Fig3D` public: `isSupported,createViewer,applyPose,play,setViewAngle,highlightRegions` (`fig3d.js:603-610`). `applyPose` üretimde `play` içinden çağrılır (`:565,581`); `play` ayrıca viewer.resume (`:520`) içinden çağrılır. `setViewAngle` normal uygulama UI'sından çağrılmaz.
- Ek bağımsız sayfa **`www/figure-3d.html:69-88`**: createViewer, viewer.resize, play; dört kamera düğmesi setViewAngle. Kendi şablon seçicisi var; normal exSheet yolu değil. Yayılımda unutulmamalı.
- Şu an loader **`models/mannequin_f.glb`** (`fig3d.js:30`), kabul edilmiş neutral GLB değil. `_isGLTF` dalı (`:150-224`) 2D hedefleri kemik dönüşlerine taşır; primitive dalından ayrı. Eski kinematiği yeni skin'e aynen takmak kabul edilmiş şınavı korumaz.
- `highlightRegions` (`:101-139`) kaba `r` seçer; primary/secondary listesi yok. `chestMesh` vb gerçek mesh yerine bone referansları (`:60-89`), renk kodu `.material.emissive` gerektiriyor. Bu nedenle GLTF'de anatomik kas maskesi sağladığı **statik olarak desteklenmiyor**; burada browser görsel testi yapılmadı.
- Async yüklemenin sheet kapatıldıktan sonra tamamlanması için generation/cancel guard ve catch görünmüyor (`exui.js:107-115`); entegrasyonda sınanacak statik risk, burada yeniden üretilmiş bug değil.

### Onaylanmış bağımsız pilot — uygulamayla karıştırma

`D:/PROJECT/NeoWell-exercise-pilot/viewer/pilot.js` satır 7: `../neutral/neutral-human-viewer.glb`; `:16` mesh adı `AthleticMaleBody`; `:21-32` chest/triceps/frontDeltoid maskeleri; `:36-52` şınava özel target/bodyPath/IK/handSupport; `:57` Play/Pause tek RAF; `:58` `window.pilot` debug API.

Genel egzersiz resolver/ID/family adaptörü yok. Sabit el/ayak target'ları ve şınav kalibrasyonu tüm katalog için kullanılamaz. Pilot incelendi, değiştirilmedi/yeniden onaylanmadı. Mevcut onayı bu dosya/GLB ve ilgili kalibrasyon pinleriyle koru; yeni aile geliştirirken pushup regresyonunu çalıştır.

## Öneri: paylaşılan skin + aile çözücü + ID sözleşmesi

Aşağıdaki mühendislik partileri bütün 60 şablonu ayrık olarak kapsar; canonical biyomekanik aile doğrulaması değildir. Tam ID üyelikleri JSON/MD'de var:

| Adaptör partisi | ID | Zorunlu özel kurallar |
|---|---:|---|
| lower_squat_lunge | 37 | stance, tek/çift taraf, ayak düzlemi, basamak/sandalye teması |
| hinge_pull_from_support | 25 | floor/deficit/rack/rdl ayrımı, bar başlangıç yüksekliği, tek ayak/oturur destek |
| lower_isolation | 33 | kalça/diz/ayak bileği ekseni, makine/bench/zemin desteği |
| horizontal_push | 38 | pushup el-parmak/ayak ucu teması; bench/eğim/decline/grip ayrı |
| vertical_push | 16 | baş üstü ROM; dips bar desteği; omuz-dirsek kutupları |
| pull | 35 | dikey/yatay çekiş, grip, cable ankrajı, oturma/asılma |
| arm_isolation | 62 | bilek/önkol rotasyonu, curl vs upright/reardelt ayrımı; 9 sabit kayıt önce çözülmeli |
| trunk | 37 | plank hold vs crunch, asılı destek, eksen ve yan ayrımı |
| locomotion_cardio | 18 | yürüyüş/koşu döngüsü, carry yük rolü, pedal/halat temasları |
| mobility | 26 | giriş/tutuş/çıkış ve hareket aralığı; zorlama yok |
| balance | 5 | tek destek, tandem/heel-toe; once/root displacement koru |

Önerilen veri/API sözleşmesi (uygulanmadı):

```text
resolveExercise(id, catalog, overrides) -> ExerciseRenderSpec
ExerciseRenderSpec = {
  id, name, sourceRef, persistedSemantics: {kind, increment, restSec},
  templateKey, originalOverrides, rawProp, scene,
  canonical: {pattern, primary_joints, rom, unilateral, stance,
              load_mode, equipment_role, direction, tempo_mode,
              target_region, start_end},
  variant: {grip, support, side, benchAngle, loadAnchor, contactPlanes},
  muscles: {primary: [muscleId], secondary: [muscleId], evidenceRefs},
  motion: {familyAdapter, durationSec, playback: loop|once|hold, phases},
  reviewStatus, modelVersion, rigVersion, calibrationVersion
}
familyAdapter.prepare(spec, rigRest) -> immutable calibrated solver
familyAdapter.pose(phase, side) -> root transform + bone rotations + contact/load targets
viewer.load(spec, {signal, reducedMotion}) / play / pause / resize / dispose
```

- ID/ad/kayıt türü/inc/dinlenme/history/template/backup bağlantıları değişmez. Şablon benzer diye ID birleştirme/yeniden adlandırma yok. `o`, `pr`, scene, playback once ve root displacement korunur. `gRestDef` şablona bağlı; şablon değiştirmek dinlenmeyi de etkileyebilir (`gym.js:43-45`).
- Canonical/variant/muscle eksikse `review`; addan primary/secondary uydurma. Kanıtlı per-ID kas atlası, metin adları, primary kırmızı/secondary turuncu, önceki highlight reset gerekir. Haftalık `MuscleMap` (`musclemap.js:1-3`) kaba set-bölge SVG'sidir; kas atlası kaynağı değildir.
- Aynı solver paylaşılabilir, ID semantiği silinemez. Aynı hash'li 76 eklem yolu yalnız mevcut çizimin sıkışmasını gösterir, 76 gerçek egzersiz demek değildir.
- `pose` bind-local reset ile idempotent; çocuk konum/scale/geometri düzeltmesi yok; rig boyu ve gerçek deforme skin üzerinden IK/contact kalibrasyonu. Kamera hareket sınırlarından desktop/portrait ayarlanır.
- Her ailede bir temsilci + semantik uç varyantlar → gerçek GLB temas/ROM/skin/renk testleri → her ID için sözleşme ölçümleri → browser gerçek Play/Pause/exercise switch/dispose/reduced-motion → Android performans → görsel onay. 'Hepsine uygula' ortak görünüm hedefidir, tek şınav hareketini 332 ID'ye yapıştırma izni değil.
- Liste küçük resimlerini SVG/sabit preview tutmak WebGL instance patlamasını önler; detay ve rehberli görünüm için aynı resolver, paylaşılan cache ve tek etkin viewer düşün. Bu tasarım önerisidir, ölçülmüş cihaz performansı değil.

## Test ve asset üretim zinciri

Son çalıştırılan **4 komut: 3 exit 0, 1 exit 1**; stdout `inventory.json.tests` / `inventory.md` içinde:

1. `node scripts/build-gym-catalog.js --check`: tam 324+8=332 ve üretilmiş çıktılar eşit.
2. `node scripts/gym-3d.test.js`: **exit 1**, mock mannequin `_humanRig` taşımadığı için güncel renderer `applyPose` çağrısında durdu. Bundle export kontrolü geçti; hareket kontrolleri tamamlanmadı. Fixture gerçek skin/GLB kanıtı değil.
3. `node scripts/gym-figure-families.test.js`: 9 temsilci grup + exlib template varlığı; per-ID efektif override hareketini test etmiyor (`:9-14`). Bu nedenle 9 sabit kayıt varken geçebiliyor.
4. `node scripts/gym-figure-matrix.test.js`: 9 temsilci SVG/volume/ghost/finite çıktı; tam 332 hareket değil.

Mevcut ek kapsam: `scripts/gym-pushup.test.js`, `gym-kbdl1.test.js`, `gym-rdl.test.js`, `gym-deadlift.test.js`, `gym-deficit.test.js`, `gym-rackpull.test.js`, `gym-heeltoe.test.js`, `gym-sidestep.test.js`, `gym-seated-goodmorning.test.js`, `gym-stance-cues.test.js`, `gym-legacy-balance.test.js`, `fig.test.js`, `guide.test.js`, `guideui.test.js`, katalog build/baseline/provenance/semantic/preflight testleri. Bunların varlığı statik; bu çalışmada ek testleri çalıştırmadık. Mevcut `scripts/gym-human-rig.test.js` ve `www/modules/gym/human-rig.js` untracked; bu görevde oluşturulmadı. Son eşzamanlı değişiklik sonrası human-rig shipping HTML entry'lerine eklendi; üstteki dirty-tree notu geçerli.

`e2e/no-coach-release.spec.js:616-625` reduced-motion ve rehberli pushup SVG; `:628-640` 9 kartlık galeri. Browser/E2E/device çalıştırılmadı. Full suite/CI yeşil iddiası yok.

- `scripts/build-gym-catalog.js:11-48`: JSON batch → `exlib.js`, `balance.js`, `docs/analysis/gym-catalog-metadata.json`. `--check` yazmaz; yeni alanlar whitelist dışında reddedilir (`:21`); kas/canonical eklenecekse generator sözleşmesini de bilinçli güncellemek gerekir. Legacy canonical null/review zorunlu (`:28`); envanter bunu değiştirmedi.
- `scripts/build-three-bundle.js:12-35`: Three, OrbitControls, GLTFLoader, CCDIKSolver → yerel IIFE `www/vendor/three/three.bundle.js`, chrome80/es2018. Solver export'u kullanılıyor kanıtı değil. Üretim fig3d bu solver'ı çağırmıyor; kendi rotateBone yolu var. Build çalıştırılmadı; mevcut bundle export testi geçti.
- `scripts/render-figure-pilot.js:72-78` çalıştırılırsa www ve Android galeri dosyalarını yazar; salt okunur görevde çalıştırılmadı.
- `.github/workflows/apk.yml:39-68`: npm ci → no-coach test runner → platform oluşturma/patch → cap sync → sync verify. Mevcut workflow'da Three build çağrısı yok; shipping bundle dosyası kullanılıyor. İleride yeni model ve bundle'ın www → Android bytes/hash eşitliği doğrulanmalı; bu görev Android dosyalarını üretmedi.

## Açık kalan

332 ID'nin gerçekçi insan animasyonuna uygulanması bu görevde yapılmadı. Per-ID canonical ve primary/secondary kas metaverisi, 9 statik hareket, genel aile adaptörleri, 3D/rehber UI entegrasyonu, gerçek skin/browser/device kalite kapıları sonraki geliştirme işi. Statik riskler doğrulanmış üretim kusuru diye sunulmadı.
