# HumanRig çekirdeği — teknik sonuç

## Sonuç

`www/modules/gym/human-rig.js` oluşturuldu. Başka ürün dosyası değiştirilmedi. Renderer, HTML, exui, ekipman, model ve kalibrasyon kopyalama üst ajanın alanında kaldı. Commit yapılmadı.

Senkron sözleşme: `HumanRig.create(THREE, root, handSupport)` → `{root, body, bones, rest, pose(J, def, phase), snapshot(), metrics(), status}`. CommonJS ve tarayıcı lexical `const HumanRig` mevcut; Three.js import edilmez. Root fiziksel ölçeği 1 olmalı; eski 1.5 ölçek açık hata üretir. `CONTRACT.md` entegrasyon ayrıntılarını içerir.

## TDD / gerçek çalıştırma

Komut: `node scripts/gym-human-rig.test.js`.

- `01-red-factory.log`: gerçek onaylı GLB, Three GLTFLoader ile başarıyla parse edildikten sonra eksik çekirdek assertion'ı RED oldu.
- `02-green-factory.log`: minimum factory GREEN.
- `03-red-pushup.log` → `04-green-pushup.log`: onaylı şınav dispatch/temas/hareket davranışı RED → GREEN.
- `05-red-generic.log` → `07-green-generic.log`: generic retarget RED → GREEN. Ara koşuda gerçek rig baş kemiğinin `Head` değil `head` olduğu ortaya çıktı; yalnız yeni çekirdekte düzeltildi.
- `08-red-floor.log`, `09-floor-progress.log` → `11-green-floor.log`: yanıltıcı generic pushup temas metriği ve bridge zemin penetrasyonu düzeltildi. Hip destekli pozlarda yalnız root kaldırılır; `status.floorCorrection` bildirir. Ara hanging assertion'ında frame dönüşümünden tekrar hesaplanan uzunluk yerine bind uzunluğu kullanılacak şekilde test düzeltildi.
- `12-red-guards.log` → `13-green-all.log`: sonlu torso girdisi ve fiziksel ölçek guard'ları.
- `14-red-frozen-mutation.log`: bellek içi donmuş şınav mutation'ı gerçek dirsek-alt-nokta assertion'ını kırdı.
- `15-red-foot-mutation.log`: yalnız generic ayak yönlendirmesini kaldıran bellek içi mutation gerçek `squat source foot orientation l` assertion'ını kırdı. Ürün dosyası mutation için yazılmadı.
- `16-red-runtime-override.log` → `17-green-final.log`: değişen runtime J'nin onaylı plain şınava zorlanmaması.
- `18-green-pinned.log`: tüm son testler GREEN; referans pilot kaynak hash'i de assertion ile sabit.
- `19-green-product-assets.log`: üst ajanın kopyaladığı gerçek `www/models/athletic-human.glb` ve `www/modules/gym/human-hand-support.json` üzerinden aynı tam test tekrar GREEN.

Node testinde yalnız texture bitmap decode stub'ı kullanıldı. Gerçek geometri, skin ağırlıkları, iskelet, bind matrisleri ve deforme vertex hesapları GLTFLoader/Three.js üzerinden çalıştı. Görsel doku, GPU, UI, telefon performansı bu testin kapsamı değil.

## Onaylı şınav

Pilot `viewer/pilot.js` içindeki rotation-only solver doğrudan çıkarıldı: foot 60°, ball world 8°, ball hedef Y=0.0158m, el hedef Y=0.0225m, diz 3°, dirsek üst/alt 172°/95°, aynı bodyPath ve kalibre el/parmak quaternion'ları. Yeni test gerçek pilot kaynak satırlarını ayrı VM'de ayrı klon GLB'ye çalıştırır; altı fazda tüm kemik dünya matrisleri + örneklenmiş deforme vertex snapshot farkı `<1e-12`.

25 faz sonucu:

- Dirsek üst: 172.000000375°; alt: 94.999995682°.
- Pelvis Y: 0.399898705m → 0.307509342m; iniş 0.092389364m.
- Maksimum kemik temas hatası: 1.656166e-7m.
- El skin minimumu yaklaşık 0.0000387m; toe ağırlıklı skin minimumu yaklaşık 0.0001319m.
- Bind-space bağımsız distal plantar/heel bölgeleri: ayak penetrasyonu ≥ -0.00001m; plantar minimumu 0–0.003m; heel yüksekliği >0.08m.
- Her faz tekrarında idempotent; tüm root dışı nesnelerde bind-local translation ve tüm nesnelerde scale değişimi <1e-12.

Bu ölçümler mühendislik regresyon sınırlarıdır; yeni anatomik onay iddiası değildir.

## Generic kapsam

Gerçek `FigTpl` şu anda 60 template içeriyor. Her biri gerçek FigLib örneklerinden 9 fazda yürütüldü; toplam 540 frame, her frame ikinci kez idempotency için uygulandı. Her template sonlu ve ölçülebilir hareketli; kaynakta küçük hareketli tandem/onefoot/shrug da dahil. Yakın/uzak kol ve bacak bağımsız; bind omuz/kalça genişliği korunur. Normalize source yönleri gerçek bind zincirlerini döndürür; 2D mutlak kol/bacak uzunluğu rig'e kopyalanmaz. Sagittal source X→world Z; front source X→world X. Ayak-toe yönü J'den gelir; generic pozlara şınav ayak/el kalibrasyonu sızmaz. Shrug clavicle rotasyonudur, omuz translation'ı değil.

Stand/floor destekli pozlarda gerçek deforme body minimumu kullanılarak root yerleştirilir. Hanging'de gerçek sol el yüksekliği sahne bar yüksekliğine sabitlenir. Hip/bench/seat/supine pozları source sahne yüksekliğini izler; zemin altına inen skin varsa root collision lift uygulanır. One-shot endpoint çekirdek tarafından döngüye çevrilmez; FigLib frame ve playback üst katmanda kalır. Def override ve runtime J override testleri generic dalını doğrular.

## Açık sınırlar — rollout onayı değildir

- Generic çözüm yön retarget'idir; tam 3D hedef/ekipman IK çözümü değildir. Source foot/feet/hand override etkisi J yönlerine yansır, fakat gerçek bind uzunlukları farklı olduğundan absolute temas noktaları bire bir garanti edilmez.
- Floor minimumu body-skin temellidir; bütün aksesuarlar için collision garantisi değildir. Minimumun zeminde olması doğru anatomik destek bölgesinin zeminde olduğunu kanıtlamaz. Generic destek patch'lerinin kaymaması garanti edilmez.
- Bench/seat çarpışmaları, iki elin aynı bara eşzamanlı temas etmesi, yük tutuşu, twist/joint limitleri, supine/sitting ergonomisi ve her ailenin görsel doğallığı ayrıca çözülmeli/doğrulanmalı. `status.limitations` bunları açıkça bildirir. Collision lift sahne hip desteğini değiştirebilir.
- Her template'in sonlu/hareketli olması katalogdaki her egzersiz varyantının biyomekanik olarak doğru olduğunu kanıtlamaz. 60 template testi exercise-ID kapsamı değildir.
- Bu ajan renderer/ürün bundle'ını veya eski medya dosyalarını değiştirmedi; gerçek yeni renderer/browser/telefon kabulü üst ajana ait.
- Generic floor örneklemesi CPU skin hesaplaması içerir; mobil performans henüz profillenmedi.

## Pins / artefaktlar

Onaylı GLB SHA-256: `947f9b100d6fc5130ad264b895d3b824a2bc5a917ba271cf0a51a41133c63b21`.

Pilot SHA-256: `f51a86e680fcd145c7acdd41525d0212200213e27e447204a7ae9b3e7cb3d44d`.

`source-pins.json` çekirdek/template/normalize kalibrasyon hash'lerini; `pushup-frames.json`, `template-coverage.json`, `floor-family-frames.json` gerçek ölçümleri içerir. RED/GREEN logları aynı klasördedir. Test GLB/kalibrasyon yolları `HUMAN_RIG_MODEL` ve `HUMAN_RIG_SUPPORT` ortam değişkenleriyle değiştirilebilir; pilot kaynak karşılaştırması onaylı yerel pilot yolunu gerektirir.
