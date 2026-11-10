# İnsan ekipmanı — bağımsız kapsam raporu

## Sonuç / sözleşme

- Yalnız yeni `www/modules/gym/human-equipment.js` ve `scripts/gym-human-equipment.test.js` ürün/test dosyaları yazıldı. Fig3D, human-rig.js, human-muscles.js ve katalog değiştirilmedi. Commit/silme yok.
- Browser UMD `HumanEquipment` + CommonJS: `HumanEquipment.create(THREE) → {group, update(J, def, rig), dispose}`.
- Parent `group` nesnesini scene'e, rig.root ile aynı identity koordinat alanına eklemeli; her karede önce `rig.pose(J,def,phase)`, sonra `equipment.update(J,def,rig)` çağırmalı. Grup rig.root altına eklenmemeli: kemik konumları dünya/metre alanındadır.
- Renderer, model, rig veya muscle ownership yok. FigLib global bağımlılığı yok. J destek kararları için zorunlu değil; tanım + gerçek kemik boyları kullanılır.
- `bar`, `db`, `kb`, `ball` gerçek Mesh geometrisi içerir. `prop.at==='shoulder'` omuz kemiklerini, diğer değerler el kemiklerini seçer. `pr` string çözümlemesi mevcut gerçek `exDef` fonksiyonunun işi; bu modül efektif `def.prop` tüketir.
- Bar iki kemik arasındaki doğru boyunca, ortalamaya merkezlenir. Şaft çapı .028 m; uzunluğu en az 1.6 m veya el açıklığı + .65 m. Plakalar el aralığının dışında. Dambıllar iki elde ayrı; kb/ball ortak el ortasında aday gösterimdir.
- `bench/incbench/pullbar/dipbar/box/seat/cable/rack/deficit` görünür geometri içerir. `floorpull/rdl/kbdl1` ekstra boş dekor üretmez; ilgili yük prop üzerinden görünür.
- Sabit sahne boyutu gerçek thigh→calf→foot uzunluğu / 48 ile normalize edilir; eski `0.045` yok. Gerçek rig ~.8 m bacak → ~.017 m/native-unit. Bench/seat yükseklikleri `fix.y`, rack `rackY`, cable `cableY`, deficit ilk frame `feet` hedefinden gelir.
- Incline backrest pelvis arkasında -Z yönüne yükselir. Destekler animasyon boyunca pelvisle yüzmez. Pull/dip desteği tanımın ilk update'inde gerçek el yüksekliğinde sabitlenir; tanım/override/fix değişiminde yeniden kurulur. Cable sabit ankrajdan gerçek el ortalamasına uzanır.
- Tanım değişiminde eski geometriler dispose edilir. Son dispose geometrileri ve paylaşılan materyalleri serbest bırakır; tekrar çağrı güvenli, sonraki update inert. Eksik rig/kemik ekipmanı gizler.

## Gerçek yürütüm

`node scripts/gym-human-equipment.test.js` → **exit 0**. Tam stdout: `final-green.log`.

1. Test önce yazıldı; eksik production modülü `HumanEquipment production module exists` ile RED.
2. Bar görünür geometry / gerçek THREE world anchor / dış plakalar / metre bounds GREEN.
3. DB/KB/ball testi önce `visible db geometry` ile RED; implementasyon sonrası GREEN.
4. Destek testi önce `support bench contains geometry` ile RED; dokuz destek implementasyonu sonrası GREEN.
5. Fixture: hareketli kemik, shoulder/wrist ayrımı, static desteğin pelvisle gitmemesi, per-definition fix/override reset, cable endpoint, switch/dispose event'leri, eksik rig/kemik hide kontrolü GREEN.
6. Gerçek model: `D:/PROJECT/NeoWell-exercise-pilot/neutral/neutral-human-viewer.glb`; SHA256 `947f9b100d6fc5130ad264b895d3b824a2bc5a917ba271cf0a51a41133c63b21`. GLTFLoader + gerçek HumanRig; yalnız image bitmap çözümü stub, skin/geometri gerçek.
7. Shipping browser yük sırasındaki gerçek `exDef` yürütüldü; CommonJS + balance append eşitliği kontrol edildi. **332/332 benzersiz ID × 3 faz = 996 gerçek rig/equipment örneği**; finite matrices/bounds ve bar bone anchor kontrolü GREEN. Veriler `catalog-review.json`.
8. Browser UMD export GREEN. Bellekte eski .045 ölçek mutasyonu gerçek bench üst yüzeyini beklenen metrik değerden >.5 m uzaklaştırır; mutasyon yakalandı. Bu test mutasyonu kontrollü yakalar; ayrı süreç RED log'u değildir.
9. `gym-figure-families.test.js` ve `gym-figure-matrix.test.js` exit 0.
10. `gym-3d.test.js` yeni parent Fig3D çalışma ağacıyla exit 1: `TypeError: Cannot read properties of undefined (reading 'pose')`, `fig3d.js:6`, eski mock fixture `_humanRig` sağlamıyor. Bu modül dosyalarına dokunulmadı; parent'a iletilecek fixture uyumsuzluğu.

İlk RED/GREEN log'ları üst dizinde `equipment-red-01.log`…`equipment-green-04.log`; son güncel log burada `final-green.log`.

## Bağımsız ekipman semantik incelemesi — kabul değil

Efektif prop toplamları: bar@shoulder 13; bar@wrist 41; db@wrist 56; kb@wrist 10; ball@wrist 2; none 210. Toplam 332.

Her ID için isim, template, ham/effective prop, scene, faz bounds, rig floorCorrection ve inceleme nedenleri `catalog-review.json` içinde saklandı. Tüm 332 kayıt `candidate-not-anatomical-acceptance`; kesin ekipman/grip/varyant metadatası yok. İsim heuristikleri garanti veya katalog düzeltmesi değildir.

- 47 isim özel makine/cable/bant/bisiklet mekanizması adayı: primitive template ekipmanı tam cihaz değildir.
- 46 kayıt statik bench/seat/box/rack/deficit desteğiyle skin temas incelemesi gerektirir.
- 14 pullbar/dipbar kaydı ilk frame grip ankrajına rağmen tüm fazlarda avuç temas çözümü gerektirir.
- 12 kb/ball kaydında tek ortak nesne: iki avuç aralığı/yönü doğrulanmadı.
- 11 dambıl kaydında unilateral/alternating isim adayı: iki dambıl üretimi kesin ekipman sayısı onayı değildir.
- Ön squat/arka rack ayrımı shoulder midpoint sözleşmesinde açık değil. Floorpress/decline bench, cablepress/bandbench, pulldown cihazları gibi mevcut template kimlikleri ayrıca incelenmeli; bu iş katalog dosyalarını değiştirmedi.

## Açık skin/destek riski — gizlenmedi

Gerçek rig mevcut floorCorrection ile bazı seated/bench modellerini zeminden korumak için yükseltiyor; sabit ekipman buna göre her kare yukarı taşınmadı. Örnek maksimum düzeltmeler: bench .075843 m; incbench .081161 m; legext .047988 m; pulldown .048026 m; seatedgm .084664 m; cycle .067442 m. Bunlar **ölçülen rig root correction**, ölçülen oturma yüzeyi boşluğu değildir. Destek/deri temasının doğru olduğunu iddia etmek için kullanılamaz. Tüm örnekler JSON'da mevcut. Rig çocuğunun dosyası bu paralel çalışma sırasında değişti; son log güncel ortak çalışma ağacında alındı.

Testler rendered screenshot, deforme avuç grip yüzeyi, bench/seat deri temas/penetrasyonu, tüm egzersizlerin biyomekaniği veya mobil performans onayı vermez. Browser görsel kabul ve family-specific skin/contact IK hâlâ açık. Bu ekipman modülü bağımsız işlevsel geometri katmanıdır, tüm hareketlerin gerçekçi olduğuna dair onay değildir.
