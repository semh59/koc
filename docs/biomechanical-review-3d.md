# Biyomekanik Doğruluk İncelemesi — 3D Manken (Fig3D)

Tarih: 2026-11-08 · Kapsam: `www/modules/gym/fig3d.js`, `www/modules/gym/figlib.js`, `www/modules/gym/figtpl.js`  
Odak: eklem pozisyonları, uzuv oranları, şınav/squat/deadlift kinematiği, 2D→3D köprü.

## 1. Özet

- 2D→3D köprü (`to3D`, `applyPose`) geometrik olarak tutarlı: X/Y eksen dönüşümü ve Z-derinlik ofseti doğru. Ancak 3D mankenin **ölçek/oranları anatomik referanslardan uzak** (geniş omuz/kalça, aşırı kalın uzuvlar, büyük kafa).
- `applyPose` içinde ayak mesh'i zemine sabitlenirken **ayak bileği (ankle) ile ayak mesh'i kopuyor**; shin ve foot segmentleri anatomik sürekliliği kaybediyor.
- Squat şablonundaki bacak açıları (`l1=92°`, `l2=-12°`) biyomekanik olarak şüpheli: dizin kalçanın önünde ve aşağıda olması gereken pozisyonda uyluk neredeyse yatay/geriye dönük görünüyor.
- Deadlift şablonunda kalça yükselme miktarı (≈28.9 birim ≈1.30 m) ve bar yatay kayması (dx −8 → +5) aşırı; bar yolu dikey değil.
- Mevcut testler (`gym-3d.test.js`) kinematik “smoke” (iniş/çıkış, sabit ayak) doğruluyor; anatomik oran, eklem açısı, ayak-ayakbileği sürekliliği ve bar yolu doğrulaması yok.

## 2. Ölçek ve oran analizi (S_SCALE = 0.045 m/birim)

| 3D eleman | Kod değeri | Metrik | Anatomik referans (yetişkin) | Değerlendirme |
|---|---:|---:|---:|---|
| Kafa yarıçapı | 7 | 31.5 cm (çap 63 cm) | ~22 cm çap | Çok büyük |
| Omuz genişliği (tam) | shw=8 → ±8 | 72 cm | 38–45 cm | Çok geniş |
| Kalça genişliği (tam) | hpw=5 → ±5 | 45 cm | 28–35 cm | Geniş |
| Üst kol yarıçapı | 2.5 | 22.5 cm çap | ~10–12 cm | Çok kalın |
| Uyluk yarıçapı | 3.8 | 34.2 cm çap | ~18–20 cm | Çok kalın |
| Baldır yarıçapı | 2.8 | 25.2 cm çap | ~12 cm | Çok kalın |
| Eklemler yarıçapı | 2.0 | 18 cm çap | ~6 cm | Çok büyük |
| Ayak uzunluğu | 9 | 40.5 cm | ~26–28 cm | Uzun |
| Ayak genişliği | 4 | 18 cm | ~9–10 cm | Geniş |
| Boyun (neck+head merkez) | 3+7 | 45 cm | ~20–30 cm | Uzun |
| Göğüs silindiri | r=8, h=18 | çap 72 cm, boy 81 cm | göğüs ~40 cm, gövde ~50 cm | Aşırı geniş |
| Pelvis silindiri | r=6.5, h=12 | çap 58.5 cm, boy 54 cm | pelvis ~35 cm | Geniş |
| Halter uzunluğu | 44 | 1.98 m | 2.20 m | Yakın |
| Disk yarıçapı | 9.5 | 85.5 cm çap | 45 cm çap | 2x büyük |
| Bench pad uzunluğu | 48 | 2.16 m | ~1.20 m | Çok uzun |

> Not: 2D birimlerin tamamı aynı oranda büyütülürse oranlar korunur; sorun 3D mesh yarıçap/boy sabitlerinin 2D iskelet oranlarıyla uyumsuz olması.

## 3. 2D→3D köprü (applyPose) bulguları

### 3.1 Doğru kısımlar
- `to3D`: X = (pt2d[0]-80)*S, Y = (136-pt2d[1])*S, Z = zOffset*S. Eksen dönüşümü ve taban referansı doğru.
- Yan görünümde near/far uzuvlar Z ofsetiyle ayrılıyor (`shR z=+8`, `shL z=-8`; `hpR z=+5`, `hpL z=-5`). Bu, 2D yan görünümün 3D derinlik yorumu için makul.
- Boyun, baş, hip ve uzuv segmentleri `setLimbBetween` ile uç noktalara bağlanıyor.

### 3.2 Anatomik/kinematik hatalar

1. **Ayak mesh kopması (kritik)**  
   `footMidR.y = 1.1*S_SCALE` ile ayak zemine sabitleniyor, ancak ayak bileği (ankle) 2D veride ayaktan yukarıda olabiliyor (şınavda `l3=20°`, ayak bileği ≈8.45 birim ≈38 cm yukarıda). Sonuç: shin segmenti ayak bileğine, foot segmenti zemine bağlanıyor; arada boşluk/kesik oluşuyor.  
   Öneri: foot mesh'ini `ankle→toe` vektörü üzerinde ortalamak; Z/Y override yapmamak veya ayak bileği yüksekliğini foot top hizasına getirmek.

2. **Omuz/kalça genişliği 2D ile çelişiyor**  
   2D front view'da `B.shw=8`, `B.hpw=5`. 3D'de aynı değerler Z ofseti olarak kullanılıyor. Tam omuz genişliği 72 cm, anatomik 40 cm civarı.  
   Öneri: 3D için ayrı çarpan (`shw3d ≈ 5`, `hpw3d ≈ 4`) veya 2D sabitlerini revize et.

3. **Gövde yönelimi doğrulanmalı**  
   `chestMesh.lookAt(pHead)` + `rotateX(π/2)` ile silindir ekseni hedefe hizalanıyor. Bu yaklaşım burkulma (twist) üretebilir. Omurga vektörü (`pHip → pNeck`) üzerinden quaternion/basis hesaplanmalı.

4. **Barbell hizalama**  
   `barbell.lookAt(wrR.x, wrR.y, wrR.z+1)` barı bilekler arasında değil, rastgele Z ekseni boyunca döndürür. Bar, `wrR→wrL` vektörüne hizalanmalı.

5. **Baş yönelimi**  
   `headGroup` pozisyonu doğru, ancak rotasyon atanmıyor; visör sabit yönde kalıyor. Baş, boyun vektörüne hizalanmalı.

## 4. Egzersiz kinematiği

### 4.1 Şınav (pushup)
Şablon: `t:74→84`, `l1/l2:-74→-84`, `l3:20`, `hand:[21,0]`, `fix: toe`  
- Toe ve wrist zeminde sabit (testte doğrulandı) — iyi.  
- Göğüs/boyun iniyor (testte doğrulandı) — iyi.  
- Ancak dirsek fleksiyonu `a1=a2=0` ile IK'dan geliyor; dirsek açısı test edilmiyor.  
- Vücut hattı (plank) 74–84° ile hafif “kambur/çökük” görünüyor; ideal plank için gövde ≈90° (yatay) olmalı.  
- Ayak bileği-ayak kopması (3.2.1) şınavda en belirgin hata.  
Öneri: plank açısını 85–90°'ye çek; ayak mesh'ini bilek hattına bağla; dirsek fleksiyon açısı (≈70–90°) için test ekle.

### 4.2 Squat
Şablon: `t:2→40`, `l1:92→92`, `l2:-12→-12`, `a1/a2:90`  
- `l1=92°`: uyluk vektörü `dn(92,24)` ≈ (23.9, −0.8) birim → kalçadan dize gidiş neredeyse yatay ve hafif yukarı; anatomik olarak diz kalçanın altında ve önünde olmalı (≈60–70°).  
- `l2=-12°`: baldır vektörü hafif geriye; squat'ta baldır genellikle dikey veya hafif öne (≈10–20°) olmalı.  
- Gövde öne eğimi 40° kabul edilebilir (high-bar squat), ancak uyluk/baldır açıları ile çelişiyor.  
Öneri: `l1` ≈ 60–70°, `l2` ≈ 10–20°, `t` ≈ 35–45°; derinlik testini mevcut “hip descent >0.4” ile değil, eklem açısı aralıklarıyla doğrula.

### 4.3 Deadlift
Şablon: `t:45→0`, `dx:-8→5`, `hh:0→28.856`, `feet:[[0,.4],[0,.4]]`  
- Kalça yükselmesi 28.856 birim ≈1.30 m; gerçek deadlift'te kalça dikey yer değişimi ~0.35–0.45 m.  
- `dx` −8 → +5 barı yatayda 13 birim (≈58 cm) kaydırıyor; bar yolu dikey olmalı.  
- Başlangıç pozisyonu (t=45, hh=0) ile bitiş (t=0, hh=28.856) arasında kalça hem yükseliyor hem öne geliyor; bu “hip thrust” değil, deadlift için kabul edilebilir ama miktar aşırı.  
Öneri: `hh` değişimini ≈8–10 birime indir; `dx` değişimini ≤2 birim yap; bar X'ini sabit tut (`feet`/`hand` hedefleriyle IK).

## 5. Düzeltme önerileri (öncelik sırası)

1. **Ayak-ayakbileği sürekliliği**: `applyPose` foot hesaplamasını yeniden yaz.  
2. **Oran sabitleri**: 3D mesh yarıçap/boyutlarını anatomik referansa çek (baş r≈2.5, omuz tam≈10–11, kalça tam≈8, uyluk r≈2, baldır r≈1.5, eklem r≈1, ayak 6×2).  
3. **Squat açıları**: `l1/l2` değerlerini düzelt ve test ekle.  
4. **Deadlift**: kalça yükselme ve bar yatay kaymasını azalt.  
5. **Gövde/bar/baş yönelimi**: `lookAt+rotateX` yerine vektör tabanlı hizalama.  
6. **Test kapsamı**: segment uzunluk oranları, eklem açısı aralıkları, foot-ankle mesafesi, bar X sabitliği için regresyon testleri.

## 6. Mevcut test durumu

`node scripts/gym-3d.test.js` → tüm testler geçiyor. Ancak testler anatomik doğruluğu değil, kinematik smoke (iniş/çıkış, sabit ayak, bar elde) doğruluyor. Bu inceleme, testlerin “geçiyor” olmasının biyomekanik doğruluğu garanti etmediğini gösteriyor.
