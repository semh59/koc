# Gerçekçi insan modeli — katalog yayılım envanteri

## Doğrulanan temel

- Kök: `D:/PROJECT/NeoWell`
- Dal: `release/no-coach`
- HEAD: `bfdd8394459a1b29981cb7e7bd36b08a79459b2f`
- Worktree: `D:/PROJECT/NeoWell bfdd839 [release/no-coach]`
- VM yürütümü: exlib → balance append → FigLib → FigTpl → excues → gym → exui. DOM/WebGL yok; zamanlayıcı kapalı; özel egzersiz listesi boş.
- CommonJS ve kaynak batch kayıtlarıyla tam, sıralı nesne eşitliği doğrulandı.
- Runtime katalog: **332** = 324 dış kaynak + 6 denge + 2 yürüyüş. `gExAll()` ayrıca kullanıcıya bağlı `S.customEx` ekler; gerçek kullanıcı deposu okunmadı.

```json
{
  "sourceExternal": 324,
  "supplementBalance": 6,
  "supplementWalk": 2,
  "runtime": 332,
  "sourceBatches": 332,
  "templatesDefined": 60,
  "templatesUsed": 60,
  "customTemplateChoices": 48,
  "resolved": 332,
  "finite": 332,
  "frozen": 9,
  "explicitPrimaryMissing": 332,
  "explicitSecondaryMissing": 332,
  "canonicalReview": 332,
  "semanticUniqueCount": 0,
  "distinctSampledJointPaths": 76
}
```

## Eksik kas / varyant verisi

Tüm 332 ID için açık primary/secondary muscle listeleri yok. `r` kaba bölge, `g` antrenman grubu; anatomik birincil/ikincil veri değildir. Eksik ID listeleri inventory.json `missing` altında; tam liste aşağıda da aynı kapsamdadır. Kaynak batch canonical alanları null, canonical_id/signature/family null ve status review. SemanticUniqueCount=0 veri/evidence eksikliği; hareketlerin hepsinin aynı olduğuna kanıt değil. Ekipman `q` yalnız Salon/Ev tipi/Ağırlıksız filtre sınıfı; kesin ekipman/ankraj/destek bilgisi sayılmaz. `pr`, efektif prop ve sahne ayrı saklandı.

## Yürütülen kontroller

### `node scripts/build-gym-catalog.js --check` — exit 0

```text
Catalog verified: 324 external + 8 local = 332 runtime; 0 new; 332 review; no network or image writes

```

### `node scripts/gym-3d.test.js` — exit 1

```text
PASS 3D Three.js bundle integrity and OrbitControls verified
D:\PROJECT\NeoWell\www\modules\gym\fig3d.js:6
function applyPose(m,J,def,phase=0){m._humanRig.pose(J,def,phase);if(m._equipment)m._equipment.update(J,def,m._humanRig);}
                                                ^

TypeError: Cannot read properties of undefined (reading 'pose')
    at Object.applyPose (D:\PROJECT\NeoWell\www\modules\gym\fig3d.js:6:49)
    at Object.<anonymous> (D:\PROJECT\NeoWell\scripts\gym-3d.test.js:65:7)
    at Module._compile (node:internal/modules/cjs/loader:1872:14)
    at Object..js (node:internal/modules/cjs/loader:2003:10)
    at Module.load (node:internal/modules/cjs/loader:1594:32)
    at Module._load (node:internal/modules/cjs/loader:1396:12)
    at wrapModuleLoad (node:internal/modules/cjs/loader:255:19)
    at Module.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:154:5)
    at node:internal/main/run_main_module:33:47

Node.js v24.19.0

```

### `node scripts/gym-figure-families.test.js` — exit 0

```text
PASS figure family squat has representative templates
PASS figure family squat has moving poses
PASS figure family hinge has representative templates
PASS figure family hinge has moving poses
PASS figure family lunge has representative templates
PASS figure family lunge has moving poses
PASS figure family push has representative templates
PASS figure family push has moving poses
PASS figure family pull has representative templates
PASS figure family pull has moving poses
PASS figure family carry has representative templates
PASS figure family carry has moving poses
PASS figure family cardio has representative templates
PASS figure family cardio has moving poses
PASS figure family mobility has representative templates
PASS figure family mobility has moving poses
PASS figure family balance has representative templates
PASS figure family balance has moving poses
PASS figure families cover core movement groups
PASS every library exercise resolves to a known figure template
All passed

```

### `node scripts/gym-figure-matrix.test.js` — exit 0

```text
PASS gym-figure-matrix: 9 aile, geriye dönük uyumluluk, 2.5D hacim ve ghost doğrulaması tamamlandı

```

Host sonuçları gerçek skin/GLB, tüm hareketlerin anatomisi veya cihaz performansını doğrulamaz. `gym-3d.test.js` `_isGLTF` içermeyen mock mannequin kullanır. E2E bu envanterde çalıştırılmadı.

## template grupları (tam ID üyeliği)

- **armstretch (7)**: `chestshoulder`, `behindchest`, `shoulderstretch`, `armcircles`, `upstretch`, `upperback`, `overheadlat`
- **backext (6)**: `ghr`, `revhyper`, `backext`, `backextfloor`, `ballhyper`, `superman`
- **balwalk (1)**: `heeltoe`
- **balwalk2 (1)**: `armswalk`
- **bench (15)**: `bench`, `decbench`, `dbbench`, `decdb`, `dbbenchn`, `dbbench1`, `smithbench`, `machbench`, `levchest`, `cablepress`, `bandbench`, `floorpress`, `pullover`, `closebench`, `closedbpress`
- **bridge (6)**: `hipthrust`, `glutebridge`, `bridge`, `bridge1`, `ballbridge`, `bandbridge`
- **calf (8)**: `calf`, `dbcalf`, `bbcalf`, `smithcalf`, `presscalf`, `bandcalf`, `seatedcalf`, `calf1`
- **chairstand (1)**: `chairstand`
- **climber (1)**: `climber`
- **crunch (9)**: `crunch`, `cablecrunch`, `deccrunch`, `ballcrunch`, `crunchoverhead`, `obliquecrunch`, `crosscrunch`, `heeltouch`, `lowerbackcurl`
- **curl (29)**: `bandupright`, `dbupright`, `dbupright1`, `extrot`, `smithupright`, `curl`, `bbcurl`, `ezcurl`, `hammer`, `althammer`, `altcurl`, `inccurl`, `seatedcurl2`, `concurl`, `preacher`, `machpreacher`, `preacher1`, `cablecurl`, `cablehammer`, `machcurl`, `revcurl`, `zottman`, `crosshammer`, `spider`, `widecurl`, `closecurl`, `wristcurl`, `wristrev`, `wristcurlbar`
- **cycle (4)**: `airbike`, `bike`, `statbike`, `recbike`
- **deadlift (1)**: `deadlift`
- **defdl (1)**: `defdl`
- **dips (5)**: `dipschest`, `dipstri`, `paralleldip`, `benchdips`, `dipmachine`
- **fly (9)**: `dbfly`, `incfly`, `decfly`, `crossover`, `lowcross`, `butterfly`, `cablefly`, `chestsqueeze`, `dynchest`
- **frontraise (8)**: `altraise`, `frontraise`, `frontraise2`, `cablefront`, `plateraise`, `scaption`, `wristroller`, `bistretch`
- **hamstretch (8)**: `hamstretch`, `seatedhamstretch`, `hamcalfstretch`, `kneeacross`, `kneechest`, `seatedglute`, `seatedcalfstretch`, `childpose`
- **hangraise (3)**: `hangingraise`, `hangpike`, `dipraise`
- **highknees (3)**: `skipping`, `buttkick`, `buttkick1`
- **hinge (13)**: `stiffdl`, `dbstiffdl`, `goodmorning`, `kbswing`, `sumodl`, `cleandl`, `widestiff`, `bandgm`, `cabledl`, `trapdl`, `pullthrough`, `stiffgm`, `toetouch`
- **incline (5)**: `incbench`, `incdb`, `incdbin`, `smithinc`, `levincchest`
- **jack (2)**: `jumpingjack`, `scissorjump`
- **jumprope (1)**: `jumprope`
- **kbdl1 (1)**: `kbdl1`
- **kickback (2)**: `kickback`, `kickback1`
- **latraise (5)**: `lat`, `bandlat`, `cablelat`, `cablerear`, `pullapart`
- **legcurl (7)**: `legcurl`, `seatedcurl`, `standcurl`, `ballcurl`, `kickbackglute`, `cablekick`, `bandhipext`
- **legext (2)**: `legext`, `legext1`
- **legpress (3)**: `legpress`, `narrowpress`, `smithpress`
- **legraise (7)**: `revcrunch`, `deadbug`, `benchlegraise`, `kneehipraise`, `legpullin`, `flutter`, `scissor`
- **legspread (7)**: `monsterwalk`, `abductor`, `adductor`, `bandadd`, `sideleg`, `latbound`, `cableadd`
- **lunge (12)**: `bblunge`, `dblunge`, `walklunge`, `rearlunge`, `splitsquat`, `splitjump`, `hipflexor`, `standhipflexor`, `calfstretch`, `wallcalf`, `wgstretch`, `groiners`
- **neckstretch (5)**: `neckfb`, `neckharness`, `chinchest`, `sideneck`, `neckiso`
- **ohp (11)**: `ohp`, `bbohp`, `arnold`, `dbohp1`, `cableohp`, `levohp`, `pushpress`, `kbpress`, `kbhalo`, `handstand`, `cleanpress`
- **onefoot (1)**: `onefoot`
- **overheadext (8)**: `ropeoverhead`, `cableoverhead`, `dboverhead`, `dboverhead1`, `bboverhead`, `seatedtri`, `kboverhead`, `tristretch`
- **plank (5)**: `plank`, `abroller`, `rollout`, `inchworm`, `catstretch`
- **pulldown (6)**: `pulldown`, `closepulldown`, `vbarpulldown`, `underpulldown`, `pulldown1`, `straightarm`
- **pullup (6)**: `scappull`, `pullup`, `chinup`, `vbarpull`, `widepull`, `bandpullup`
- **pushdown (6)**: `tri`, `ropepushdown`, `vbarpushdown`, `revpushdown`, `lowtri`, `cabletri1`
- **pushup (9)**: `pushup`, `pushupwide`, `pushupclose`, `pushupinc`, `pushupfeet`, `pushupdec`, `pushup1`, `plyopushup`, `pushuptri`
- **qstretch (3)**: `quadstretch`, `elevquad`, `sidequad`
- **rackpull (1)**: `rackpull`
- **rdl (1)**: `rdl`
- **row (10)**: `reardelt`, `row`, `dbrow`, `dbrow1`, `longrow1`, `tbar`, `revrow`, `smithrow`, `kbrow`, `incrow`
- **run (3)**: `treadjog`, `treadrun`, `trail`
- **seatedhinge (1)**: `seatedgm`
- **seatedrow (7)**: `facepull`, `seatedrow`, `levrow`, `seatedrow1`, `invrow`, `susprow`, `rower`
- **shrug (6)**: `bbshrug`, `shrug`, `cableshrug`, `levshrug`, `platepinch`, `shouldercircles`
- **sidebend (4)**: `sidebendbar`, `sidebend`, `cablesidebend`, `latstretch`
- **sidestep (1)**: `sidestep`
- **situp (4)**: `sit34`, `jackknife`, `janda`, `getup`
- **skull (4)**: `skull`, `dbskull`, `decskull`, `bandskull`
- **squat (18)**: `squat`, `fullsquat`, `frontsquat`, `bwsquat`, `goblet`, `dbsquat`, `widesquat`, `narrowsquat`, `smithsquat`, `boxsquat`, `ohsquat`, `pliesquat`, `chairsquat`, `jumpsquat`, `hacksquat`, `longjump`, `rocketjump`, `thruster`
- **stepup (6)**: `dbstepup`, `bbstepup`, `stepupknee`, `stairs`, `boxjump`, `benchjump`
- **tandem (1)**: `tandem`
- **twiststretch (3)**: `torsotwist`, `midback`, `windmills`
- **walk (5)**: `farmer`, `treadwalk`, `elliptical`, `fastwalk`, `slowwalk`
- **woodchop (4)**: `russiantwist`, `pallof`, `ballwoodchop`, `battleropes`

## equipmentFilter grupları (tam ID üyeliği)

- **Ağırlıksız (101)**: `bwsquat`, `jumpsquat`, `walklunge`, `bridge`, `bridge1`, `kickbackglute`, `stepupknee`, `sideleg`, `latbound`, `pushup`, `pushupwide`, `pushupclose`, `pushupinc`, `pushupfeet`, `pushupdec`, `pushup1`, `plyopushup`, `chestsqueeze`, `handstand`, `scappull`, `pullup`, `chinup`, `vbarpull`, `widepull`, `invrow`, `backextfloor`, `superman`, `dipstri`, `benchdips`, `pushuptri`, `neckfb`, `crunch`, `deccrunch`, `crunchoverhead`, `obliquecrunch`, `crosscrunch`, `revcrunch`, `sit34`, `jackknife`, `janda`, `deadbug`, `benchlegraise`, `kneehipraise`, `legpullin`, `flutter`, `scissor`, `hangingraise`, `hangpike`, `plank`, `climber`, `latstretch`, `airbike`, `heeltouch`, `trail`, `jumpingjack`, `scissorjump`, `skipping`, `buttkick`, `buttkick1`, `splitjump`, `longjump`, `rocketjump`, `benchjump`, `inchworm`, `hamstretch`, `seatedhamstretch`, `toetouch`, `sidequad`, `hipflexor`, `standhipflexor`, `kneeacross`, `kneechest`, `seatedglute`, `calfstretch`, `wallcalf`, `seatedcalfstretch`, `dynchest`, `shoulderstretch`, `armcircles`, `shouldercircles`, `upstretch`, `tristretch`, `chinchest`, `sideneck`, `neckiso`, `childpose`, `catstretch`, `midback`, `upperback`, `lowerbackcurl`, `windmills`, `wgstretch`, `groiners`, `onefoot`, `heeltoe`, `chairstand`, `sidestep`, `tandem`, `armswalk`, `fastwalk`, `slowwalk`
- **Ev tipi (106)**: `goblet`, `dbsquat`, `pliesquat`, `dblunge`, `rearlunge`, `splitsquat`, `dbstepup`, `dbstiffdl`, `ballcurl`, `kbdl1`, `kbswing`, `bandgm`, `trapdl`, `ballbridge`, `bandbridge`, `monsterwalk`, `bandhipext`, `dbcalf`, `bandcalf`, `calf1`, `bandadd`, `dbbench`, `incdb`, `decdb`, `incdbin`, `dbbenchn`, `dbbench1`, `dbfly`, `incfly`, `decfly`, `dipschest`, `bandbench`, `floorpress`, `pullover`, `ohp`, `arnold`, `dbohp1`, `kbpress`, `lat`, `bandlat`, `altraise`, `frontraise`, `frontraise2`, `plateraise`, `scaption`, `reardelt`, `pullapart`, `bandupright`, `dbupright`, `dbupright1`, `kbhalo`, `extrot`, `shrug`, `bandpullup`, `dbrow`, `dbrow1`, `kbrow`, `susprow`, `incrow`, `backext`, `ballhyper`, `curl`, `hammer`, `althammer`, `altcurl`, `inccurl`, `seatedcurl2`, `concurl`, `preacher1`, `zottman`, `crosshammer`, `dboverhead`, `dboverhead1`, `seatedtri`, `kboverhead`, `dbskull`, `bandskull`, `kickback`, `kickback1`, `closedbpress`, `paralleldip`, `neckharness`, `wristcurl`, `wristrev`, `wristroller`, `farmer`, `platepinch`, `ballcrunch`, `dipraise`, `abroller`, `sidebend`, `ballwoodchop`, `bike`, `jumprope`, `boxjump`, `battleropes`, `thruster`, `getup`, `hamcalfstretch`, `quadstretch`, `elevquad`, `chestshoulder`, `behindchest`, `bistretch`, `torsotwist`, `overheadlat`
- **Salon (125)**: `squat`, `fullsquat`, `frontsquat`, `widesquat`, `narrowsquat`, `smithsquat`, `boxsquat`, `ohsquat`, `chairsquat`, `hacksquat`, `bblunge`, `bbstepup`, `legpress`, `narrowpress`, `smithpress`, `legext`, `legext1`, `rdl`, `stiffdl`, `goodmorning`, `legcurl`, `seatedcurl`, `standcurl`, `ghr`, `revhyper`, `sumodl`, `cleandl`, `widestiff`, `cabledl`, `hipthrust`, `glutebridge`, `pullthrough`, `cablekick`, `calf`, `bbcalf`, `smithcalf`, `presscalf`, `seatedcalf`, `abductor`, `adductor`, `cableadd`, `bench`, `incbench`, `decbench`, `smithbench`, `smithinc`, `machbench`, `levchest`, `levincchest`, `cablepress`, `crossover`, `lowcross`, `butterfly`, `cablefly`, `bbohp`, `cableohp`, `levohp`, `pushpress`, `cablelat`, `cablefront`, `cablerear`, `facepull`, `bbshrug`, `cableshrug`, `levshrug`, `smithupright`, `pulldown`, `closepulldown`, `vbarpulldown`, `underpulldown`, `pulldown1`, `straightarm`, `row`, `longrow1`, `tbar`, `revrow`, `smithrow`, `seatedrow`, `levrow`, `seatedrow1`, `deadlift`, `rackpull`, `defdl`, `stiffgm`, `seatedgm`, `bbcurl`, `ezcurl`, `preacher`, `machpreacher`, `cablecurl`, `cablehammer`, `machcurl`, `revcurl`, `spider`, `widecurl`, `closecurl`, `tri`, `ropepushdown`, `vbarpushdown`, `revpushdown`, `lowtri`, `cabletri1`, `ropeoverhead`, `cableoverhead`, `bboverhead`, `skull`, `decskull`, `closebench`, `dipmachine`, `wristcurlbar`, `cablecrunch`, `rollout`, `sidebendbar`, `cablesidebend`, `russiantwist`, `pallof`, `treadjog`, `treadrun`, `treadwalk`, `statbike`, `recbike`, `elliptical`, `stairs`, `rower`, `cleanpress`

## rawProp grupları (tam ID üyeliği)

- **- (210)**: `bwsquat`, `chairsquat`, `jumpsquat`, `hacksquat`, `walklunge`, `legpress`, `narrowpress`, `smithpress`, `legext`, `legext1`, `legcurl`, `seatedcurl`, `standcurl`, `ballcurl`, `ghr`, `revhyper`, `bandgm`, `cabledl`, `bridge`, `bridge1`, `ballbridge`, `bandbridge`, `pullthrough`, `kickbackglute`, `cablekick`, `stepupknee`, `monsterwalk`, `bandhipext`, `calf`, `smithcalf`, `presscalf`, `bandcalf`, `seatedcalf`, `abductor`, `adductor`, `bandadd`, `sideleg`, `latbound`, `cableadd`, `machbench`, `levchest`, `levincchest`, `cablepress`, `crossover`, `lowcross`, `butterfly`, `cablefly`, `pushup`, `pushupwide`, `pushupclose`, `pushupinc`, `pushupfeet`, `pushupdec`, `pushup1`, `plyopushup`, `dipschest`, `bandbench`, `chestsqueeze`, `cableohp`, `levohp`, `bandlat`, `cablelat`, `cablefront`, `cablerear`, `facepull`, `pullapart`, `bandupright`, `handstand`, `cableshrug`, `levshrug`, `scappull`, `pullup`, `chinup`, `vbarpull`, `widepull`, `bandpullup`, `pulldown`, `closepulldown`, `vbarpulldown`, `underpulldown`, `pulldown1`, `straightarm`, `seatedrow`, `levrow`, `seatedrow1`, `invrow`, `susprow`, `backext`, `backextfloor`, `ballhyper`, `superman`, `machpreacher`, `cablecurl`, `cablehammer`, `machcurl`, `tri`, `ropepushdown`, `vbarpushdown`, `revpushdown`, `lowtri`, `cabletri1`, `ropeoverhead`, `cableoverhead`, `bandskull`, `dipstri`, `paralleldip`, `benchdips`, `dipmachine`, `pushuptri`, `neckfb`, `neckharness`, `wristroller`, `platepinch`, `crunch`, `cablecrunch`, `deccrunch`, `ballcrunch`, `crunchoverhead`, `obliquecrunch`, `crosscrunch`, `revcrunch`, `sit34`, `jackknife`, `janda`, `deadbug`, `benchlegraise`, `kneehipraise`, `legpullin`, `flutter`, `scissor`, `hangingraise`, `hangpike`, `dipraise`, `plank`, `abroller`, `climber`, `cablesidebend`, `russiantwist`, `pallof`, `latstretch`, `airbike`, `heeltouch`, `treadjog`, `treadrun`, `trail`, `treadwalk`, `bike`, `statbike`, `recbike`, `elliptical`, `stairs`, `jumprope`, `jumpingjack`, `scissorjump`, `skipping`, `buttkick`, `buttkick1`, `splitjump`, `longjump`, `rocketjump`, `boxjump`, `benchjump`, `rower`, `battleropes`, `inchworm`, `hamstretch`, `seatedhamstretch`, `toetouch`, `hamcalfstretch`, `quadstretch`, `elevquad`, `sidequad`, `hipflexor`, `standhipflexor`, `kneeacross`, `kneechest`, `seatedglute`, `calfstretch`, `wallcalf`, `seatedcalfstretch`, `chestshoulder`, `dynchest`, `behindchest`, `shoulderstretch`, `armcircles`, `shouldercircles`, `upstretch`, `tristretch`, `bistretch`, `chinchest`, `sideneck`, `neckiso`, `childpose`, `catstretch`, `torsotwist`, `midback`, `upperback`, `overheadlat`, `lowerbackcurl`, `windmills`, `wgstretch`, `groiners`, `onefoot`, `heeltoe`, `chairstand`, `sidestep`, `tandem`, `armswalk`, `fastwalk`, `slowwalk`
- **ball (2)**: `plateraise`, `ballwoodchop`
- **bar (41)**: `ohsquat`, `rdl`, `stiffdl`, `sumodl`, `cleandl`, `widestiff`, `trapdl`, `hipthrust`, `glutebridge`, `bench`, `incbench`, `decbench`, `smithbench`, `smithinc`, `bbohp`, `pushpress`, `bbshrug`, `smithupright`, `row`, `longrow1`, `tbar`, `revrow`, `smithrow`, `deadlift`, `rackpull`, `defdl`, `bbcurl`, `ezcurl`, `preacher`, `revcurl`, `spider`, `widecurl`, `closecurl`, `bboverhead`, `skull`, `decskull`, `closebench`, `wristcurlbar`, `rollout`, `sidebendbar`, `cleanpress`
- **bar@sh (13)**: `squat`, `fullsquat`, `frontsquat`, `widesquat`, `narrowsquat`, `smithsquat`, `boxsquat`, `bblunge`, `bbstepup`, `goodmorning`, `bbcalf`, `stiffgm`, `seatedgm`
- **db (56)**: `dbsquat`, `pliesquat`, `dblunge`, `rearlunge`, `splitsquat`, `dbstepup`, `dbstiffdl`, `dbcalf`, `calf1`, `dbbench`, `incdb`, `decdb`, `incdbin`, `dbbenchn`, `dbbench1`, `dbfly`, `incfly`, `decfly`, `pullover`, `ohp`, `arnold`, `dbohp1`, `lat`, `altraise`, `frontraise`, `frontraise2`, `scaption`, `reardelt`, `dbupright`, `dbupright1`, `extrot`, `shrug`, `dbrow`, `dbrow1`, `incrow`, `curl`, `hammer`, `althammer`, `altcurl`, `inccurl`, `seatedcurl2`, `concurl`, `preacher1`, `zottman`, `crosshammer`, `dboverhead`, `dboverhead1`, `seatedtri`, `dbskull`, `kickback`, `kickback1`, `closedbpress`, `wristcurl`, `wristrev`, `farmer`, `sidebend`
- **kb (10)**: `goblet`, `kbdl1`, `kbswing`, `floorpress`, `kbpress`, `kbhalo`, `kbrow`, `kboverhead`, `thruster`, `getup`

## effectiveProp grupları (tam ID üyeliği)

- **ball@wrist (2)**: `plateraise`, `ballwoodchop`
- **bar@shoulder (13)**: `squat`, `fullsquat`, `frontsquat`, `widesquat`, `narrowsquat`, `smithsquat`, `boxsquat`, `bblunge`, `bbstepup`, `goodmorning`, `bbcalf`, `stiffgm`, `seatedgm`
- **bar@wrist (41)**: `ohsquat`, `rdl`, `stiffdl`, `sumodl`, `cleandl`, `widestiff`, `trapdl`, `hipthrust`, `glutebridge`, `bench`, `incbench`, `decbench`, `smithbench`, `smithinc`, `bbohp`, `pushpress`, `bbshrug`, `smithupright`, `row`, `longrow1`, `tbar`, `revrow`, `smithrow`, `deadlift`, `rackpull`, `defdl`, `bbcurl`, `ezcurl`, `preacher`, `revcurl`, `spider`, `widecurl`, `closecurl`, `bboverhead`, `skull`, `decskull`, `closebench`, `wristcurlbar`, `rollout`, `sidebendbar`, `cleanpress`
- **db@wrist (56)**: `dbsquat`, `pliesquat`, `dblunge`, `rearlunge`, `splitsquat`, `dbstepup`, `dbstiffdl`, `dbcalf`, `calf1`, `dbbench`, `incdb`, `decdb`, `incdbin`, `dbbenchn`, `dbbench1`, `dbfly`, `incfly`, `decfly`, `pullover`, `ohp`, `arnold`, `dbohp1`, `lat`, `altraise`, `frontraise`, `frontraise2`, `scaption`, `reardelt`, `dbupright`, `dbupright1`, `extrot`, `shrug`, `dbrow`, `dbrow1`, `incrow`, `curl`, `hammer`, `althammer`, `altcurl`, `inccurl`, `seatedcurl2`, `concurl`, `preacher1`, `zottman`, `crosshammer`, `dboverhead`, `dboverhead1`, `seatedtri`, `dbskull`, `kickback`, `kickback1`, `closedbpress`, `wristcurl`, `wristrev`, `farmer`, `sidebend`
- **kb@wrist (10)**: `goblet`, `kbdl1`, `kbswing`, `floorpress`, `kbpress`, `kbhalo`, `kbrow`, `kboverhead`, `thruster`, `getup`
- **none (210)**: `bwsquat`, `chairsquat`, `jumpsquat`, `hacksquat`, `walklunge`, `legpress`, `narrowpress`, `smithpress`, `legext`, `legext1`, `legcurl`, `seatedcurl`, `standcurl`, `ballcurl`, `ghr`, `revhyper`, `bandgm`, `cabledl`, `bridge`, `bridge1`, `ballbridge`, `bandbridge`, `pullthrough`, `kickbackglute`, `cablekick`, `stepupknee`, `monsterwalk`, `bandhipext`, `calf`, `smithcalf`, `presscalf`, `bandcalf`, `seatedcalf`, `abductor`, `adductor`, `bandadd`, `sideleg`, `latbound`, `cableadd`, `machbench`, `levchest`, `levincchest`, `cablepress`, `crossover`, `lowcross`, `butterfly`, `cablefly`, `pushup`, `pushupwide`, `pushupclose`, `pushupinc`, `pushupfeet`, `pushupdec`, `pushup1`, `plyopushup`, `dipschest`, `bandbench`, `chestsqueeze`, `cableohp`, `levohp`, `bandlat`, `cablelat`, `cablefront`, `cablerear`, `facepull`, `pullapart`, `bandupright`, `handstand`, `cableshrug`, `levshrug`, `scappull`, `pullup`, `chinup`, `vbarpull`, `widepull`, `bandpullup`, `pulldown`, `closepulldown`, `vbarpulldown`, `underpulldown`, `pulldown1`, `straightarm`, `seatedrow`, `levrow`, `seatedrow1`, `invrow`, `susprow`, `backext`, `backextfloor`, `ballhyper`, `superman`, `machpreacher`, `cablecurl`, `cablehammer`, `machcurl`, `tri`, `ropepushdown`, `vbarpushdown`, `revpushdown`, `lowtri`, `cabletri1`, `ropeoverhead`, `cableoverhead`, `bandskull`, `dipstri`, `paralleldip`, `benchdips`, `dipmachine`, `pushuptri`, `neckfb`, `neckharness`, `wristroller`, `platepinch`, `crunch`, `cablecrunch`, `deccrunch`, `ballcrunch`, `crunchoverhead`, `obliquecrunch`, `crosscrunch`, `revcrunch`, `sit34`, `jackknife`, `janda`, `deadbug`, `benchlegraise`, `kneehipraise`, `legpullin`, `flutter`, `scissor`, `hangingraise`, `hangpike`, `dipraise`, `plank`, `abroller`, `climber`, `cablesidebend`, `russiantwist`, `pallof`, `latstretch`, `airbike`, `heeltouch`, `treadjog`, `treadrun`, `trail`, `treadwalk`, `bike`, `statbike`, `recbike`, `elliptical`, `stairs`, `jumprope`, `jumpingjack`, `scissorjump`, `skipping`, `buttkick`, `buttkick1`, `splitjump`, `longjump`, `rocketjump`, `boxjump`, `benchjump`, `rower`, `battleropes`, `inchworm`, `hamstretch`, `seatedhamstretch`, `toetouch`, `hamcalfstretch`, `quadstretch`, `elevquad`, `sidequad`, `hipflexor`, `standhipflexor`, `kneeacross`, `kneechest`, `seatedglute`, `calfstretch`, `wallcalf`, `seatedcalfstretch`, `chestshoulder`, `dynchest`, `behindchest`, `shoulderstretch`, `armcircles`, `shouldercircles`, `upstretch`, `tristretch`, `bistretch`, `chinchest`, `sideneck`, `neckiso`, `childpose`, `catstretch`, `torsotwist`, `midback`, `upperback`, `overheadlat`, `lowerbackcurl`, `windmills`, `wgstretch`, `groiners`, `onefoot`, `heeltoe`, `chairstand`, `sidestep`, `tandem`, `armswalk`, `fastwalk`, `slowwalk`

## scene grupları (tam ID üyeliği)

- **bench (19)**: `bench`, `decbench`, `dbbench`, `decdb`, `dbbenchn`, `dbbench1`, `smithbench`, `machbench`, `levchest`, `cablepress`, `bandbench`, `floorpress`, `pullover`, `skull`, `dbskull`, `decskull`, `bandskull`, `closebench`, `closedbpress`
- **box (6)**: `dbstepup`, `bbstepup`, `stepupknee`, `stairs`, `boxjump`, `benchjump`
- **cable (6)**: `tri`, `ropepushdown`, `vbarpushdown`, `revpushdown`, `lowtri`, `cabletri1`
- **deficit (1)**: `defdl`
- **dipbar (5)**: `dipschest`, `dipstri`, `paralleldip`, `benchdips`, `dipmachine`
- **floorpull (1)**: `deadlift`
- **incbench (5)**: `incbench`, `incdb`, `incdbin`, `smithinc`, `levincchest`
- **kbdl1 (1)**: `kbdl1`
- **none (263)**: `squat`, `fullsquat`, `frontsquat`, `bwsquat`, `goblet`, `dbsquat`, `widesquat`, `narrowsquat`, `smithsquat`, `boxsquat`, `ohsquat`, `pliesquat`, `chairsquat`, `jumpsquat`, `hacksquat`, `bblunge`, `dblunge`, `walklunge`, `rearlunge`, `splitsquat`, `legpress`, `narrowpress`, `smithpress`, `stiffdl`, `dbstiffdl`, `goodmorning`, `legcurl`, `seatedcurl`, `standcurl`, `ballcurl`, `ghr`, `revhyper`, `kbswing`, `sumodl`, `cleandl`, `widestiff`, `bandgm`, `cabledl`, `trapdl`, `hipthrust`, `glutebridge`, `bridge`, `bridge1`, `ballbridge`, `bandbridge`, `pullthrough`, `kickbackglute`, `cablekick`, `monsterwalk`, `bandhipext`, `calf`, `dbcalf`, `bbcalf`, `smithcalf`, `presscalf`, `bandcalf`, `seatedcalf`, `calf1`, `abductor`, `adductor`, `bandadd`, `sideleg`, `latbound`, `cableadd`, `dbfly`, `incfly`, `decfly`, `crossover`, `lowcross`, `butterfly`, `cablefly`, `pushup`, `pushupwide`, `pushupclose`, `pushupinc`, `pushupfeet`, `pushupdec`, `pushup1`, `plyopushup`, `chestsqueeze`, `ohp`, `bbohp`, `arnold`, `dbohp1`, `cableohp`, `levohp`, `pushpress`, `kbpress`, `lat`, `bandlat`, `cablelat`, `altraise`, `frontraise`, `frontraise2`, `cablefront`, `plateraise`, `scaption`, `reardelt`, `cablerear`, `facepull`, `pullapart`, `bandupright`, `dbupright`, `dbupright1`, `kbhalo`, `handstand`, `extrot`, `bbshrug`, `shrug`, `cableshrug`, `levshrug`, `smithupright`, `row`, `dbrow`, `dbrow1`, `longrow1`, `tbar`, `revrow`, `smithrow`, `kbrow`, `seatedrow`, `levrow`, `seatedrow1`, `invrow`, `susprow`, `incrow`, `backext`, `backextfloor`, `ballhyper`, `stiffgm`, `superman`, `curl`, `bbcurl`, `ezcurl`, `hammer`, `althammer`, `altcurl`, `inccurl`, `seatedcurl2`, `concurl`, `preacher`, `machpreacher`, `preacher1`, `cablecurl`, `cablehammer`, `machcurl`, `revcurl`, `zottman`, `crosshammer`, `spider`, `widecurl`, `closecurl`, `ropeoverhead`, `cableoverhead`, `dboverhead`, `dboverhead1`, `bboverhead`, `seatedtri`, `kboverhead`, `kickback`, `kickback1`, `pushuptri`, `neckfb`, `neckharness`, `wristcurl`, `wristrev`, `wristcurlbar`, `wristroller`, `farmer`, `platepinch`, `crunch`, `cablecrunch`, `deccrunch`, `ballcrunch`, `crunchoverhead`, `obliquecrunch`, `crosscrunch`, `revcrunch`, `sit34`, `jackknife`, `janda`, `deadbug`, `benchlegraise`, `kneehipraise`, `legpullin`, `flutter`, `scissor`, `plank`, `abroller`, `rollout`, `climber`, `sidebendbar`, `sidebend`, `cablesidebend`, `russiantwist`, `pallof`, `ballwoodchop`, `latstretch`, `heeltouch`, `treadjog`, `treadrun`, `trail`, `treadwalk`, `elliptical`, `jumprope`, `jumpingjack`, `scissorjump`, `skipping`, `buttkick`, `buttkick1`, `splitjump`, `longjump`, `rocketjump`, `rower`, `battleropes`, `thruster`, `cleanpress`, `getup`, `inchworm`, `hamstretch`, `seatedhamstretch`, `toetouch`, `hamcalfstretch`, `quadstretch`, `elevquad`, `sidequad`, `hipflexor`, `standhipflexor`, `kneeacross`, `kneechest`, `seatedglute`, `calfstretch`, `wallcalf`, `seatedcalfstretch`, `chestshoulder`, `dynchest`, `behindchest`, `shoulderstretch`, `armcircles`, `shouldercircles`, `upstretch`, `tristretch`, `bistretch`, `chinchest`, `sideneck`, `neckiso`, `childpose`, `catstretch`, `torsotwist`, `midback`, `upperback`, `overheadlat`, `lowerbackcurl`, `windmills`, `wgstretch`, `groiners`, `onefoot`, `heeltoe`, `sidestep`, `tandem`, `armswalk`, `fastwalk`, `slowwalk`
- **pullbar (9)**: `scappull`, `pullup`, `chinup`, `vbarpull`, `widepull`, `bandpullup`, `hangingraise`, `hangpike`, `dipraise`
- **rack (1)**: `rackpull`
- **rdl (1)**: `rdl`
- **seat (14)**: `legext`, `legext1`, `pulldown`, `closepulldown`, `vbarpulldown`, `underpulldown`, `pulldown1`, `straightarm`, `seatedgm`, `airbike`, `bike`, `statbike`, `recbike`, `chairstand`

## planningFamily grupları (tam ID üyeliği)

- **arm_isolation (62)**: `lat`, `bandlat`, `cablelat`, `altraise`, `frontraise`, `frontraise2`, `cablefront`, `plateraise`, `scaption`, `cablerear`, `pullapart`, `bandupright`, `dbupright`, `dbupright1`, `extrot`, `smithupright`, `curl`, `bbcurl`, `ezcurl`, `hammer`, `althammer`, `altcurl`, `inccurl`, `seatedcurl2`, `concurl`, `preacher`, `machpreacher`, `preacher1`, `cablecurl`, `cablehammer`, `machcurl`, `revcurl`, `zottman`, `crosshammer`, `spider`, `widecurl`, `closecurl`, `tri`, `ropepushdown`, `vbarpushdown`, `revpushdown`, `lowtri`, `cabletri1`, `ropeoverhead`, `cableoverhead`, `dboverhead`, `dboverhead1`, `bboverhead`, `seatedtri`, `kboverhead`, `skull`, `dbskull`, `decskull`, `bandskull`, `kickback`, `kickback1`, `wristcurl`, `wristrev`, `wristcurlbar`, `wristroller`, `tristretch`, `bistretch`
- **balance (5)**: `onefoot`, `heeltoe`, `sidestep`, `tandem`, `armswalk`
- **hinge_pull_from_support (25)**: `rdl`, `stiffdl`, `dbstiffdl`, `goodmorning`, `ghr`, `revhyper`, `kbdl1`, `kbswing`, `sumodl`, `cleandl`, `widestiff`, `bandgm`, `cabledl`, `trapdl`, `pullthrough`, `deadlift`, `rackpull`, `defdl`, `backext`, `backextfloor`, `ballhyper`, `stiffgm`, `superman`, `seatedgm`, `toetouch`
- **horizontal_push (38)**: `bench`, `incbench`, `decbench`, `dbbench`, `incdb`, `decdb`, `incdbin`, `dbbenchn`, `dbbench1`, `smithbench`, `smithinc`, `machbench`, `levchest`, `levincchest`, `cablepress`, `dbfly`, `incfly`, `decfly`, `crossover`, `lowcross`, `butterfly`, `cablefly`, `pushup`, `pushupwide`, `pushupclose`, `pushupinc`, `pushupfeet`, `pushupdec`, `pushup1`, `plyopushup`, `bandbench`, `floorpress`, `pullover`, `chestsqueeze`, `closebench`, `closedbpress`, `pushuptri`, `dynchest`
- **locomotion_cardio (18)**: `farmer`, `airbike`, `treadjog`, `treadrun`, `trail`, `treadwalk`, `bike`, `statbike`, `recbike`, `elliptical`, `jumprope`, `jumpingjack`, `scissorjump`, `skipping`, `buttkick`, `buttkick1`, `fastwalk`, `slowwalk`
- **lower_isolation (33)**: `legpress`, `narrowpress`, `smithpress`, `legext`, `legext1`, `legcurl`, `seatedcurl`, `standcurl`, `ballcurl`, `hipthrust`, `glutebridge`, `bridge`, `bridge1`, `ballbridge`, `bandbridge`, `kickbackglute`, `cablekick`, `monsterwalk`, `bandhipext`, `calf`, `dbcalf`, `bbcalf`, `smithcalf`, `presscalf`, `bandcalf`, `seatedcalf`, `calf1`, `abductor`, `adductor`, `bandadd`, `sideleg`, `latbound`, `cableadd`
- **lower_squat_lunge (37)**: `squat`, `fullsquat`, `frontsquat`, `bwsquat`, `goblet`, `dbsquat`, `widesquat`, `narrowsquat`, `smithsquat`, `boxsquat`, `ohsquat`, `pliesquat`, `chairsquat`, `jumpsquat`, `hacksquat`, `bblunge`, `dblunge`, `walklunge`, `rearlunge`, `splitsquat`, `dbstepup`, `bbstepup`, `stepupknee`, `stairs`, `splitjump`, `longjump`, `rocketjump`, `boxjump`, `benchjump`, `thruster`, `hipflexor`, `standhipflexor`, `calfstretch`, `wallcalf`, `wgstretch`, `groiners`, `chairstand`
- **mobility (26)**: `neckfb`, `neckharness`, `hamstretch`, `seatedhamstretch`, `hamcalfstretch`, `quadstretch`, `elevquad`, `sidequad`, `kneeacross`, `kneechest`, `seatedglute`, `seatedcalfstretch`, `chestshoulder`, `behindchest`, `shoulderstretch`, `armcircles`, `upstretch`, `chinchest`, `sideneck`, `neckiso`, `childpose`, `torsotwist`, `midback`, `upperback`, `overheadlat`, `windmills`
- **pull (35)**: `reardelt`, `facepull`, `bbshrug`, `shrug`, `cableshrug`, `levshrug`, `scappull`, `pullup`, `chinup`, `vbarpull`, `widepull`, `bandpullup`, `pulldown`, `closepulldown`, `vbarpulldown`, `underpulldown`, `pulldown1`, `straightarm`, `row`, `dbrow`, `dbrow1`, `longrow1`, `tbar`, `revrow`, `smithrow`, `kbrow`, `seatedrow`, `levrow`, `seatedrow1`, `invrow`, `susprow`, `incrow`, `platepinch`, `rower`, `shouldercircles`
- **trunk (37)**: `crunch`, `cablecrunch`, `deccrunch`, `ballcrunch`, `crunchoverhead`, `obliquecrunch`, `crosscrunch`, `revcrunch`, `sit34`, `jackknife`, `janda`, `deadbug`, `benchlegraise`, `kneehipraise`, `legpullin`, `flutter`, `scissor`, `hangingraise`, `hangpike`, `dipraise`, `plank`, `abroller`, `rollout`, `climber`, `sidebendbar`, `sidebend`, `cablesidebend`, `russiantwist`, `pallof`, `ballwoodchop`, `latstretch`, `heeltouch`, `battleropes`, `getup`, `inchworm`, `catstretch`, `lowerbackcurl`
- **vertical_push (16)**: `dipschest`, `ohp`, `bbohp`, `arnold`, `dbohp1`, `cableohp`, `levohp`, `pushpress`, `kbpress`, `kbhalo`, `handstand`, `dipstri`, `paralleldip`, `benchdips`, `dipmachine`, `cleanpress`

## templateEquipment grupları (tam ID üyeliği)

- **armstretch | Ağırlıksız (4)**: `shoulderstretch`, `armcircles`, `upstretch`, `upperback`
- **armstretch | Ev tipi (3)**: `chestshoulder`, `behindchest`, `overheadlat`
- **backext | Ağırlıksız (2)**: `backextfloor`, `superman`
- **backext | Ev tipi (2)**: `backext`, `ballhyper`
- **backext | Salon (2)**: `ghr`, `revhyper`
- **balwalk | Ağırlıksız (1)**: `heeltoe`
- **balwalk2 | Ağırlıksız (1)**: `armswalk`
- **bench | Ev tipi (8)**: `dbbench`, `decdb`, `dbbenchn`, `dbbench1`, `bandbench`, `floorpress`, `pullover`, `closedbpress`
- **bench | Salon (7)**: `bench`, `decbench`, `smithbench`, `machbench`, `levchest`, `cablepress`, `closebench`
- **bridge | Ağırlıksız (2)**: `bridge`, `bridge1`
- **bridge | Ev tipi (2)**: `ballbridge`, `bandbridge`
- **bridge | Salon (2)**: `hipthrust`, `glutebridge`
- **calf | Ev tipi (3)**: `dbcalf`, `bandcalf`, `calf1`
- **calf | Salon (5)**: `calf`, `bbcalf`, `smithcalf`, `presscalf`, `seatedcalf`
- **chairstand | Ağırlıksız (1)**: `chairstand`
- **climber | Ağırlıksız (1)**: `climber`
- **crunch | Ağırlıksız (7)**: `crunch`, `deccrunch`, `crunchoverhead`, `obliquecrunch`, `crosscrunch`, `heeltouch`, `lowerbackcurl`
- **crunch | Ev tipi (1)**: `ballcrunch`
- **crunch | Salon (1)**: `cablecrunch`
- **curl | Ev tipi (16)**: `bandupright`, `dbupright`, `dbupright1`, `extrot`, `curl`, `hammer`, `althammer`, `altcurl`, `inccurl`, `seatedcurl2`, `concurl`, `preacher1`, `zottman`, `crosshammer`, `wristcurl`, `wristrev`
- **curl | Salon (13)**: `smithupright`, `bbcurl`, `ezcurl`, `preacher`, `machpreacher`, `cablecurl`, `cablehammer`, `machcurl`, `revcurl`, `spider`, `widecurl`, `closecurl`, `wristcurlbar`
- **cycle | Ağırlıksız (1)**: `airbike`
- **cycle | Ev tipi (1)**: `bike`
- **cycle | Salon (2)**: `statbike`, `recbike`
- **deadlift | Salon (1)**: `deadlift`
- **defdl | Salon (1)**: `defdl`
- **dips | Ağırlıksız (2)**: `dipstri`, `benchdips`
- **dips | Ev tipi (2)**: `dipschest`, `paralleldip`
- **dips | Salon (1)**: `dipmachine`
- **fly | Ağırlıksız (2)**: `chestsqueeze`, `dynchest`
- **fly | Ev tipi (3)**: `dbfly`, `incfly`, `decfly`
- **fly | Salon (4)**: `crossover`, `lowcross`, `butterfly`, `cablefly`
- **frontraise | Ev tipi (7)**: `altraise`, `frontraise`, `frontraise2`, `plateraise`, `scaption`, `wristroller`, `bistretch`
- **frontraise | Salon (1)**: `cablefront`
- **hamstretch | Ağırlıksız (7)**: `hamstretch`, `seatedhamstretch`, `kneeacross`, `kneechest`, `seatedglute`, `seatedcalfstretch`, `childpose`
- **hamstretch | Ev tipi (1)**: `hamcalfstretch`
- **hangraise | Ağırlıksız (2)**: `hangingraise`, `hangpike`
- **hangraise | Ev tipi (1)**: `dipraise`
- **highknees | Ağırlıksız (3)**: `skipping`, `buttkick`, `buttkick1`
- **hinge | Ağırlıksız (1)**: `toetouch`
- **hinge | Ev tipi (4)**: `dbstiffdl`, `kbswing`, `bandgm`, `trapdl`
- **hinge | Salon (8)**: `stiffdl`, `goodmorning`, `sumodl`, `cleandl`, `widestiff`, `cabledl`, `pullthrough`, `stiffgm`
- **incline | Ev tipi (2)**: `incdb`, `incdbin`
- **incline | Salon (3)**: `incbench`, `smithinc`, `levincchest`
- **jack | Ağırlıksız (2)**: `jumpingjack`, `scissorjump`
- **jumprope | Ev tipi (1)**: `jumprope`
- **kbdl1 | Ev tipi (1)**: `kbdl1`
- **kickback | Ev tipi (2)**: `kickback`, `kickback1`
- **latraise | Ev tipi (3)**: `lat`, `bandlat`, `pullapart`
- **latraise | Salon (2)**: `cablelat`, `cablerear`
- **legcurl | Ağırlıksız (1)**: `kickbackglute`
- **legcurl | Ev tipi (2)**: `ballcurl`, `bandhipext`
- **legcurl | Salon (4)**: `legcurl`, `seatedcurl`, `standcurl`, `cablekick`
- **legext | Salon (2)**: `legext`, `legext1`
- **legpress | Salon (3)**: `legpress`, `narrowpress`, `smithpress`
- **legraise | Ağırlıksız (7)**: `revcrunch`, `deadbug`, `benchlegraise`, `kneehipraise`, `legpullin`, `flutter`, `scissor`
- **legspread | Ağırlıksız (2)**: `sideleg`, `latbound`
- **legspread | Ev tipi (2)**: `monsterwalk`, `bandadd`
- **legspread | Salon (3)**: `abductor`, `adductor`, `cableadd`
- **lunge | Ağırlıksız (8)**: `walklunge`, `splitjump`, `hipflexor`, `standhipflexor`, `calfstretch`, `wallcalf`, `wgstretch`, `groiners`
- **lunge | Ev tipi (3)**: `dblunge`, `rearlunge`, `splitsquat`
- **lunge | Salon (1)**: `bblunge`
- **neckstretch | Ağırlıksız (4)**: `neckfb`, `chinchest`, `sideneck`, `neckiso`
- **neckstretch | Ev tipi (1)**: `neckharness`
- **ohp | Ağırlıksız (1)**: `handstand`
- **ohp | Ev tipi (5)**: `ohp`, `arnold`, `dbohp1`, `kbpress`, `kbhalo`
- **ohp | Salon (5)**: `bbohp`, `cableohp`, `levohp`, `pushpress`, `cleanpress`
- **onefoot | Ağırlıksız (1)**: `onefoot`
- **overheadext | Ağırlıksız (1)**: `tristretch`
- **overheadext | Ev tipi (4)**: `dboverhead`, `dboverhead1`, `seatedtri`, `kboverhead`
- **overheadext | Salon (3)**: `ropeoverhead`, `cableoverhead`, `bboverhead`
- **plank | Ağırlıksız (3)**: `plank`, `inchworm`, `catstretch`
- **plank | Ev tipi (1)**: `abroller`
- **plank | Salon (1)**: `rollout`
- **pulldown | Salon (6)**: `pulldown`, `closepulldown`, `vbarpulldown`, `underpulldown`, `pulldown1`, `straightarm`
- **pullup | Ağırlıksız (5)**: `scappull`, `pullup`, `chinup`, `vbarpull`, `widepull`
- **pullup | Ev tipi (1)**: `bandpullup`
- **pushdown | Salon (6)**: `tri`, `ropepushdown`, `vbarpushdown`, `revpushdown`, `lowtri`, `cabletri1`
- **pushup | Ağırlıksız (9)**: `pushup`, `pushupwide`, `pushupclose`, `pushupinc`, `pushupfeet`, `pushupdec`, `pushup1`, `plyopushup`, `pushuptri`
- **qstretch | Ağırlıksız (1)**: `sidequad`
- **qstretch | Ev tipi (2)**: `quadstretch`, `elevquad`
- **rackpull | Salon (1)**: `rackpull`
- **rdl | Salon (1)**: `rdl`
- **row | Ev tipi (5)**: `reardelt`, `dbrow`, `dbrow1`, `kbrow`, `incrow`
- **row | Salon (5)**: `row`, `longrow1`, `tbar`, `revrow`, `smithrow`
- **run | Ağırlıksız (1)**: `trail`
- **run | Salon (2)**: `treadjog`, `treadrun`
- **seatedhinge | Salon (1)**: `seatedgm`
- **seatedrow | Ağırlıksız (1)**: `invrow`
- **seatedrow | Ev tipi (1)**: `susprow`
- **seatedrow | Salon (5)**: `facepull`, `seatedrow`, `levrow`, `seatedrow1`, `rower`
- **shrug | Ağırlıksız (1)**: `shouldercircles`
- **shrug | Ev tipi (2)**: `shrug`, `platepinch`
- **shrug | Salon (3)**: `bbshrug`, `cableshrug`, `levshrug`
- **sidebend | Ağırlıksız (1)**: `latstretch`
- **sidebend | Ev tipi (1)**: `sidebend`
- **sidebend | Salon (2)**: `sidebendbar`, `cablesidebend`
- **sidestep | Ağırlıksız (1)**: `sidestep`
- **situp | Ağırlıksız (3)**: `sit34`, `jackknife`, `janda`
- **situp | Ev tipi (1)**: `getup`
- **skull | Ev tipi (2)**: `dbskull`, `bandskull`
- **skull | Salon (2)**: `skull`, `decskull`
- **squat | Ağırlıksız (4)**: `bwsquat`, `jumpsquat`, `longjump`, `rocketjump`
- **squat | Ev tipi (4)**: `goblet`, `dbsquat`, `pliesquat`, `thruster`
- **squat | Salon (10)**: `squat`, `fullsquat`, `frontsquat`, `widesquat`, `narrowsquat`, `smithsquat`, `boxsquat`, `ohsquat`, `chairsquat`, `hacksquat`
- **stepup | Ağırlıksız (2)**: `stepupknee`, `benchjump`
- **stepup | Ev tipi (2)**: `dbstepup`, `boxjump`
- **stepup | Salon (2)**: `bbstepup`, `stairs`
- **tandem | Ağırlıksız (1)**: `tandem`
- **twiststretch | Ağırlıksız (2)**: `midback`, `windmills`
- **twiststretch | Ev tipi (1)**: `torsotwist`
- **walk | Ağırlıksız (2)**: `fastwalk`, `slowwalk`
- **walk | Ev tipi (1)**: `farmer`
- **walk | Salon (2)**: `treadwalk`, `elliptical`
- **woodchop | Ev tipi (2)**: `ballwoodchop`, `battleropes`
- **woodchop | Salon (2)**: `russiantwist`, `pallof`

## Bütün ID’ler (runtime sırası; 332)

1. `squat` — Squat — `squat` — Salon — raw prop `bar@sh`
2. `fullsquat` — Derin halterli squat — `squat` — Salon — raw prop `bar@sh`
3. `frontsquat` — Ön squat — `squat` — Salon — raw prop `bar@sh`
4. `bwsquat` — Vücut ağırlığı squat — `squat` — Ağırlıksız — raw prop `-`
5. `goblet` — Goblet squat — `squat` — Ev tipi — raw prop `kb`
6. `dbsquat` — Dumbbell squat — `squat` — Ev tipi — raw prop `db`
7. `widesquat` — Geniş duruş squat — `squat` — Salon — raw prop `bar@sh`
8. `narrowsquat` — Dar duruş squat — `squat` — Salon — raw prop `bar@sh`
9. `smithsquat` — Smith squat — `squat` — Salon — raw prop `bar@sh`
10. `boxsquat` — Kutuya squat — `squat` — Salon — raw prop `bar@sh`
11. `ohsquat` — Baş üstü squat — `squat` — Salon — raw prop `bar`
12. `pliesquat` — Plie squat — `squat` — Ev tipi — raw prop `db`
13. `chairsquat` — Sandalye squat — `squat` — Salon — raw prop `-`
14. `jumpsquat` — Sıçrama squat — `squat` — Ağırlıksız — raw prop `-`
15. `hacksquat` — Hack squat — `squat` — Salon — raw prop `-`
16. `bblunge` — Halterli hamle — `lunge` — Salon — raw prop `bar@sh`
17. `dblunge` — Dumbbell hamle — `lunge` — Ev tipi — raw prop `db`
18. `walklunge` — Yürüyüş hamlesi — `lunge` — Ağırlıksız — raw prop `-`
19. `rearlunge` — Geri hamle — `lunge` — Ev tipi — raw prop `db`
20. `splitsquat` — Bölünmüş squat — `lunge` — Ev tipi — raw prop `db`
21. `dbstepup` — Basamağa çıkış (dumbbell) — `stepup` — Ev tipi — raw prop `db`
22. `bbstepup` — Basamağa çıkış (halter) — `stepup` — Salon — raw prop `bar@sh`
23. `legpress` — Leg press — `legpress` — Salon — raw prop `-`
24. `narrowpress` — Dar duruş leg press — `legpress` — Salon — raw prop `-`
25. `smithpress` — Smith leg press — `legpress` — Salon — raw prop `-`
26. `legext` — Leg extension — `legext` — Salon — raw prop `-`
27. `legext1` — Tek bacak leg extension — `legext` — Salon — raw prop `-`
28. `rdl` — Romanian deadlift — `rdl` — Salon — raw prop `bar`
29. `stiffdl` — Düz bacak deadlift — `hinge` — Salon — raw prop `bar`
30. `dbstiffdl` — Düz bacak deadlift (dumbbell) — `hinge` — Ev tipi — raw prop `db`
31. `goodmorning` — Good morning — `hinge` — Salon — raw prop `bar@sh`
32. `legcurl` — Leg curl — `legcurl` — Salon — raw prop `-`
33. `seatedcurl` — Oturarak leg curl — `legcurl` — Salon — raw prop `-`
34. `standcurl` — Ayakta leg curl — `legcurl` — Salon — raw prop `-`
35. `ballcurl` — Top ile leg curl — `legcurl` — Ev tipi — raw prop `-`
36. `ghr` — Glute-ham raise — `backext` — Salon — raw prop `-`
37. `revhyper` — Ters hiperekstansiyon — `backext` — Salon — raw prop `-`
38. `kbdl1` — Tek bacak kettlebell deadlift — `kbdl1` — Ev tipi — raw prop `kb`
39. `kbswing` — Kettlebell sallama — `hinge` — Ev tipi — raw prop `kb`
40. `sumodl` — Sumo deadlift — `hinge` — Salon — raw prop `bar`
41. `cleandl` — Clean deadlift — `hinge` — Salon — raw prop `bar`
42. `widestiff` — Geniş duruş düz bacak — `hinge` — Salon — raw prop `bar`
43. `bandgm` — Lastikle good morning — `hinge` — Ev tipi — raw prop `-`
44. `cabledl` — Kablo deadlift — `hinge` — Salon — raw prop `-`
45. `trapdl` — Trap bar deadlift — `hinge` — Ev tipi — raw prop `bar`
46. `hipthrust` — Hip thrust — `bridge` — Salon — raw prop `bar`
47. `glutebridge` — Halterli kalça köprüsü — `bridge` — Salon — raw prop `bar`
48. `bridge` — Kalça köprüsü — `bridge` — Ağırlıksız — raw prop `-`
49. `bridge1` — Tek bacak köprü — `bridge` — Ağırlıksız — raw prop `-`
50. `ballbridge` — Top ile köprü — `bridge` — Ev tipi — raw prop `-`
51. `bandbridge` — Lastikle kalça kaldırma — `bridge` — Ev tipi — raw prop `-`
52. `pullthrough` — Kablo pull-through — `hinge` — Salon — raw prop `-`
53. `kickbackglute` — Kalça geri tekme — `legcurl` — Ağırlıksız — raw prop `-`
54. `cablekick` — Kablo geri tekme — `legcurl` — Salon — raw prop `-`
55. `stepupknee` — Diz kaldırmalı basamak — `stepup` — Ağırlıksız — raw prop `-`
56. `monsterwalk` — Canavar yürüyüşü — `legspread` — Ev tipi — raw prop `-`
57. `bandhipext` — Lastikle kalça ekstansiyonu — `legcurl` — Ev tipi — raw prop `-`
58. `calf` — Calf raise — `calf` — Salon — raw prop `-`
59. `dbcalf` — Dumbbell calf raise — `calf` — Ev tipi — raw prop `db`
60. `bbcalf` — Halterli calf raise — `calf` — Salon — raw prop `bar@sh`
61. `smithcalf` — Smith calf raise — `calf` — Salon — raw prop `-`
62. `presscalf` — Leg press'te calf — `calf` — Salon — raw prop `-`
63. `bandcalf` — Lastikle calf raise — `calf` — Ev tipi — raw prop `-`
64. `seatedcalf` — Oturarak calf raise — `calf` — Salon — raw prop `-`
65. `calf1` — Tek bacak calf raise — `calf` — Ev tipi — raw prop `db`
66. `abductor` — Dış bacak makinesi — `legspread` — Salon — raw prop `-`
67. `adductor` — İç bacak makinesi — `legspread` — Salon — raw prop `-`
68. `bandadd` — Lastikle iç bacak — `legspread` — Ev tipi — raw prop `-`
69. `sideleg` — Yana bacak kaldırma — `legspread` — Ağırlıksız — raw prop `-`
70. `latbound` — Yana sıçrama — `legspread` — Ağırlıksız — raw prop `-`
71. `cableadd` — Kablo iç bacak — `legspread` — Salon — raw prop `-`
72. `bench` — Bench press — `bench` — Salon — raw prop `bar`
73. `incbench` — Eğimli bench press — `incline` — Salon — raw prop `bar`
74. `decbench` — Ters eğimli bench press — `bench` — Salon — raw prop `bar`
75. `dbbench` — Dumbbell bench press — `bench` — Ev tipi — raw prop `db`
76. `incdb` — Incline dumbbell press — `incline` — Ev tipi — raw prop `db`
77. `decdb` — Ters eğimli dumbbell press — `bench` — Ev tipi — raw prop `db`
78. `incdbin` — Eğimli dumbbell press (nötr tutuş) — `incline` — Ev tipi — raw prop `db`
79. `dbbenchn` — Nötr tutuşlu dumbbell press — `bench` — Ev tipi — raw prop `db`
80. `dbbench1` — Tek kol dumbbell press — `bench` — Ev tipi — raw prop `db`
81. `smithbench` — Smith bench press — `bench` — Salon — raw prop `bar`
82. `smithinc` — Smith eğimli press — `incline` — Salon — raw prop `bar`
83. `machbench` — Makinede göğüs press — `bench` — Salon — raw prop `-`
84. `levchest` — Kaldıraçlı göğüs press — `bench` — Salon — raw prop `-`
85. `levincchest` — Kaldıraçlı eğimli press — `incline` — Salon — raw prop `-`
86. `cablepress` — Kablo göğüs press — `bench` — Salon — raw prop `-`
87. `dbfly` — Dumbbell fly — `fly` — Ev tipi — raw prop `db`
88. `incfly` — Eğimli dumbbell fly — `fly` — Ev tipi — raw prop `db`
89. `decfly` — Ters eğimli dumbbell fly — `fly` — Ev tipi — raw prop `db`
90. `crossover` — Kablo crossover — `fly` — Salon — raw prop `-`
91. `lowcross` — Alt kablo crossover — `fly` — Salon — raw prop `-`
92. `butterfly` — Pec deck (kelebek) — `fly` — Salon — raw prop `-`
93. `cablefly` — Kablo fly — `fly` — Salon — raw prop `-`
94. `pushup` — Şınav — `pushup` — Ağırlıksız — raw prop `-`
95. `pushupwide` — Geniş şınav — `pushup` — Ağırlıksız — raw prop `-`
96. `pushupclose` — Dar şınav — `pushup` — Ağırlıksız — raw prop `-`
97. `pushupinc` — Eğimli şınav — `pushup` — Ağırlıksız — raw prop `-`
98. `pushupfeet` — Ayaklar yüksekte şınav — `pushup` — Ağırlıksız — raw prop `-`
99. `pushupdec` — Ters eğimli şınav — `pushup` — Ağırlıksız — raw prop `-`
100. `pushup1` — Tek kol şınav — `pushup` — Ağırlıksız — raw prop `-`
101. `plyopushup` — Sıçramalı şınav — `pushup` — Ağırlıksız — raw prop `-`
102. `dipschest` — Paralel bar dips (göğüs) — `dips` — Ev tipi — raw prop `-`
103. `bandbench` — Lastikli bench press — `bench` — Ev tipi — raw prop `-`
104. `floorpress` — Yerde dumbbell press — `bench` — Ev tipi — raw prop `kb`
105. `pullover` — Pullover — `bench` — Ev tipi — raw prop `db`
106. `chestsqueeze` — Göğüs sıkma — `fly` — Ağırlıksız — raw prop `-`
107. `ohp` — Omuz press — `ohp` — Ev tipi — raw prop `db`
108. `bbohp` — Halterli omuz press — `ohp` — Salon — raw prop `bar`
109. `arnold` — Arnold press — `ohp` — Ev tipi — raw prop `db`
110. `dbohp1` — Tek kol omuz press — `ohp` — Ev tipi — raw prop `db`
111. `cableohp` — Kablo omuz press — `ohp` — Salon — raw prop `-`
112. `levohp` — Makinede omuz press — `ohp` — Salon — raw prop `-`
113. `pushpress` — Push press — `ohp` — Salon — raw prop `bar`
114. `kbpress` — Kettlebell press — `ohp` — Ev tipi — raw prop `kb`
115. `lat` — Lateral raise — `latraise` — Ev tipi — raw prop `db`
116. `bandlat` — Lastikle lateral raise — `latraise` — Ev tipi — raw prop `-`
117. `cablelat` — Kablo lateral raise — `latraise` — Salon — raw prop `-`
118. `altraise` — Dönüşümlü omuz kaldırma — `frontraise` — Ev tipi — raw prop `db`
119. `frontraise` — Ön omuz kaldırma — `frontraise` — Ev tipi — raw prop `db`
120. `frontraise2` — İki dumbbell ön kaldırma — `frontraise` — Ev tipi — raw prop `db`
121. `cablefront` — Kablo ön kaldırma — `frontraise` — Salon — raw prop `-`
122. `plateraise` — Plaka ön kaldırma — `frontraise` — Ev tipi — raw prop `ball`
123. `scaption` — Scaption — `frontraise` — Ev tipi — raw prop `db`
124. `reardelt` — Arka omuz kaldırma — `row` — Ev tipi — raw prop `db`
125. `cablerear` — Kablo arka omuz fly — `latraise` — Salon — raw prop `-`
126. `facepull` — Face pull — `seatedrow` — Salon — raw prop `-`
127. `pullapart` — Lastik açma — `latraise` — Ev tipi — raw prop `-`
128. `bandupright` — Lastikle dik çekiş — `curl` — Ev tipi — raw prop `-`
129. `dbupright` — Dik çekiş (dumbbell) — `curl` — Ev tipi — raw prop `db`
130. `dbupright1` — Tek kol dik çekiş — `curl` — Ev tipi — raw prop `db`
131. `kbhalo` — Kettlebell halo — `ohp` — Ev tipi — raw prop `kb`
132. `handstand` — Amudiye şınav — `ohp` — Ağırlıksız — raw prop `-`
133. `extrot` — Dış rotasyon — `curl` — Ev tipi — raw prop `db`
134. `bbshrug` — Halterli omuz silkme — `shrug` — Salon — raw prop `bar`
135. `shrug` — Dumbbell omuz silkme — `shrug` — Ev tipi — raw prop `db`
136. `cableshrug` — Kablo omuz silkme — `shrug` — Salon — raw prop `-`
137. `levshrug` — Makinede omuz silkme — `shrug` — Salon — raw prop `-`
138. `smithupright` — Smith dik çekiş — `curl` — Salon — raw prop `bar`
139. `scappull` — Kürek kemiği barfiks — `pullup` — Ağırlıksız — raw prop `-`
140. `pullup` — Barfiks — `pullup` — Ağırlıksız — raw prop `-`
141. `chinup` — Chin-up — `pullup` — Ağırlıksız — raw prop `-`
142. `vbarpull` — V-bar barfiks — `pullup` — Ağırlıksız — raw prop `-`
143. `widepull` — Geniş tutuş barfiks — `pullup` — Ağırlıksız — raw prop `-`
144. `bandpullup` — Lastik destekli barfiks — `pullup` — Ev tipi — raw prop `-`
145. `pulldown` — Lat pulldown — `pulldown` — Salon — raw prop `-`
146. `closepulldown` — Dar tutuş lat pulldown — `pulldown` — Salon — raw prop `-`
147. `vbarpulldown` — V-bar pulldown — `pulldown` — Salon — raw prop `-`
148. `underpulldown` — Ters tutuş pulldown — `pulldown` — Salon — raw prop `-`
149. `pulldown1` — Tek kol pulldown — `pulldown` — Salon — raw prop `-`
150. `straightarm` — Düz kol pulldown — `pulldown` — Salon — raw prop `-`
151. `row` — Kürek çekme — `row` — Salon — raw prop `bar`
152. `dbrow` — İki dumbbell kürek — `row` — Ev tipi — raw prop `db`
153. `dbrow1` — Tek kol dumbbell kürek — `row` — Ev tipi — raw prop `db`
154. `longrow1` — Tek kol uzun bar kürek — `row` — Salon — raw prop `bar`
155. `tbar` — T-bar kürek — `row` — Salon — raw prop `bar`
156. `revrow` — Ters tutuş kürek — `row` — Salon — raw prop `bar`
157. `smithrow` — Smith kürek — `row` — Salon — raw prop `bar`
158. `kbrow` — Kettlebell kürek — `row` — Ev tipi — raw prop `kb`
159. `seatedrow` — Oturarak kablo kürek — `seatedrow` — Salon — raw prop `-`
160. `levrow` — Makinede yüksek kürek — `seatedrow` — Salon — raw prop `-`
161. `seatedrow1` — Tek kol kablo kürek — `seatedrow` — Salon — raw prop `-`
162. `invrow` — Ters kürek — `seatedrow` — Ağırlıksız — raw prop `-`
163. `susprow` — Askıda kürek — `seatedrow` — Ev tipi — raw prop `-`
164. `incrow` — Eğimli dumbbell kürek — `row` — Ev tipi — raw prop `db`
165. `deadlift` — Deadlift — `deadlift` — Salon — raw prop `bar`
166. `rackpull` — Rack pull — `rackpull` — Salon — raw prop `bar`
167. `defdl` — Deficit deadlift — `defdl` — Salon — raw prop `bar`
168. `backext` — Sırt ekstansiyonu — `backext` — Ev tipi — raw prop `-`
169. `backextfloor` — Yerde sırt ekstansiyonu — `backext` — Ağırlıksız — raw prop `-`
170. `ballhyper` — Top ile sırt ekstansiyonu — `backext` — Ev tipi — raw prop `-`
171. `stiffgm` — Düz bacak good morning — `hinge` — Salon — raw prop `bar@sh`
172. `superman` — Superman — `backext` — Ağırlıksız — raw prop `-`
173. `seatedgm` — Oturarak good morning — `seatedhinge` — Salon — raw prop `bar@sh`
174. `curl` — Biceps curl — `curl` — Ev tipi — raw prop `db`
175. `bbcurl` — Halter curl — `curl` — Salon — raw prop `bar`
176. `ezcurl` — EZ bar curl — `curl` — Salon — raw prop `bar`
177. `hammer` — Çekiç curl — `curl` — Ev tipi — raw prop `db`
178. `althammer` — Dönüşümlü çekiç curl — `curl` — Ev tipi — raw prop `db`
179. `altcurl` — Dönüşümlü biceps curl — `curl` — Ev tipi — raw prop `db`
180. `inccurl` — Eğimli dumbbell curl — `curl` — Ev tipi — raw prop `db`
181. `seatedcurl2` — Oturarak dumbbell curl — `curl` — Ev tipi — raw prop `db`
182. `concurl` — Konsantre curl — `curl` — Ev tipi — raw prop `db`
183. `preacher` — Preacher curl — `curl` — Salon — raw prop `bar`
184. `machpreacher` — Makinede preacher curl — `curl` — Salon — raw prop `-`
185. `preacher1` — Tek kol preacher curl — `curl` — Ev tipi — raw prop `db`
186. `cablecurl` — Kablo curl — `curl` — Salon — raw prop `-`
187. `cablehammer` — Kablo çekiç curl — `curl` — Salon — raw prop `-`
188. `machcurl` — Makinede biceps curl — `curl` — Salon — raw prop `-`
189. `revcurl` — Ters tutuş curl — `curl` — Salon — raw prop `bar`
190. `zottman` — Zottman curl — `curl` — Ev tipi — raw prop `db`
191. `crosshammer` — Çapraz çekiç curl — `curl` — Ev tipi — raw prop `db`
192. `spider` — Spider curl — `curl` — Salon — raw prop `bar`
193. `widecurl` — Geniş tutuş halter curl — `curl` — Salon — raw prop `bar`
194. `closecurl` — Dar tutuş halter curl — `curl` — Salon — raw prop `bar`
195. `tri` — Triceps pushdown — `pushdown` — Salon — raw prop `-`
196. `ropepushdown` — İp ile pushdown — `pushdown` — Salon — raw prop `-`
197. `vbarpushdown` — V-bar pushdown — `pushdown` — Salon — raw prop `-`
198. `revpushdown` — Ters tutuş pushdown — `pushdown` — Salon — raw prop `-`
199. `lowtri` — Alt kablo triceps — `pushdown` — Salon — raw prop `-`
200. `cabletri1` — Tek kol kablo triceps — `pushdown` — Salon — raw prop `-`
201. `ropeoverhead` — İple baş üstü triceps — `overheadext` — Salon — raw prop `-`
202. `cableoverhead` — Kablo baş üstü triceps — `overheadext` — Salon — raw prop `-`
203. `dboverhead` — Ayakta dumbbell triceps — `overheadext` — Ev tipi — raw prop `db`
204. `dboverhead1` — Tek kol baş üstü triceps — `overheadext` — Ev tipi — raw prop `db`
205. `bboverhead` — Halterle baş üstü triceps — `overheadext` — Salon — raw prop `bar`
206. `seatedtri` — Oturarak triceps press — `overheadext` — Ev tipi — raw prop `db`
207. `kboverhead` — Kettlebell baş üstü triceps — `overheadext` — Ev tipi — raw prop `kb`
208. `skull` — Skull crusher — `skull` — Salon — raw prop `bar`
209. `dbskull` — Yatarak dumbbell triceps — `skull` — Ev tipi — raw prop `db`
210. `decskull` — Ters eğimli skull crusher — `skull` — Salon — raw prop `bar`
211. `bandskull` — Lastikle skull crusher — `skull` — Ev tipi — raw prop `-`
212. `kickback` — Triceps kickback — `kickback` — Ev tipi — raw prop `db`
213. `kickback1` — Eğilerek tek kol triceps — `kickback` — Ev tipi — raw prop `db`
214. `closebench` — Dar tutuş bench press — `bench` — Salon — raw prop `bar`
215. `closedbpress` — Dar tutuş dumbbell press — `bench` — Ev tipi — raw prop `db`
216. `dipstri` — Paralel bar dips (triceps) — `dips` — Ağırlıksız — raw prop `-`
217. `paralleldip` — Paralel bar dips — `dips` — Ev tipi — raw prop `-`
218. `benchdips` — Bench dips — `dips` — Ağırlıksız — raw prop `-`
219. `dipmachine` — Dips makinesi — `dips` — Salon — raw prop `-`
220. `pushuptri` — Triceps şınavı — `pushup` — Ağırlıksız — raw prop `-`
221. `neckfb` — Boyun izometrik (ön-arka) — `neckstretch` — Ağırlıksız — raw prop `-`
222. `neckharness` — Boyun direnç (koşumlu) — `neckstretch` — Ev tipi — raw prop `-`
223. `wristcurl` — Bilek curl — `curl` — Ev tipi — raw prop `db`
224. `wristrev` — Ters bilek curl — `curl` — Ev tipi — raw prop `db`
225. `wristcurlbar` — Halterle bilek curl — `curl` — Salon — raw prop `bar`
226. `wristroller` — Bilek makarası — `frontraise` — Ev tipi — raw prop `-`
227. `farmer` — Çiftçi yürüyüşü — `walk` — Ev tipi — raw prop `db`
228. `platepinch` — Plaka tutma — `shrug` — Ev tipi — raw prop `-`
229. `crunch` — Crunch — `crunch` — Ağırlıksız — raw prop `-`
230. `cablecrunch` — Kablo crunch — `crunch` — Salon — raw prop `-`
231. `deccrunch` — Ters eğimli crunch — `crunch` — Ağırlıksız — raw prop `-`
232. `ballcrunch` — Top ile crunch — `crunch` — Ev tipi — raw prop `-`
233. `crunchoverhead` — Eller yukarıda crunch — `crunch` — Ağırlıksız — raw prop `-`
234. `obliquecrunch` — Yan crunch — `crunch` — Ağırlıksız — raw prop `-`
235. `crosscrunch` — Çapraz crunch — `crunch` — Ağırlıksız — raw prop `-`
236. `revcrunch` — Ters crunch — `legraise` — Ağırlıksız — raw prop `-`
237. `sit34` — Üç çeyrek mekik — `situp` — Ağırlıksız — raw prop `-`
238. `jackknife` — Çakı mekik — `situp` — Ağırlıksız — raw prop `-`
239. `janda` — Janda mekik — `situp` — Ağırlıksız — raw prop `-`
240. `deadbug` — Dead bug — `legraise` — Ağırlıksız — raw prop `-`
241. `benchlegraise` — Sırada bacak kaldırma — `legraise` — Ağırlıksız — raw prop `-`
242. `kneehipraise` — Bükük diz kalça kaldırma — `legraise` — Ağırlıksız — raw prop `-`
243. `legpullin` — Bacak çekme — `legraise` — Ağırlıksız — raw prop `-`
244. `flutter` — Makas bacak — `legraise` — Ağırlıksız — raw prop `-`
245. `scissor` — Makas tekme — `legraise` — Ağırlıksız — raw prop `-`
246. `hangingraise` — Asılı bacak kaldırma — `hangraise` — Ağırlıksız — raw prop `-`
247. `hangpike` — Asılı pike — `hangraise` — Ağırlıksız — raw prop `-`
248. `dipraise` — Paralel barda diz kaldırma — `hangraise` — Ev tipi — raw prop `-`
249. `plank` — Plank — `plank` — Ağırlıksız — raw prop `-`
250. `abroller` — Karın tekerleği — `plank` — Ev tipi — raw prop `-`
251. `rollout` — Halterle rollout — `plank` — Salon — raw prop `bar`
252. `climber` — Dağcı — `climber` — Ağırlıksız — raw prop `-`
253. `sidebendbar` — Halterle yan eğilme — `sidebend` — Salon — raw prop `bar`
254. `sidebend` — Yan eğilme — `sidebend` — Ev tipi — raw prop `db`
255. `cablesidebend` — Kablo yan eğilme — `sidebend` — Salon — raw prop `-`
256. `russiantwist` — Rus bükülmesi — `woodchop` — Salon — raw prop `-`
257. `pallof` — Pallof press — `woodchop` — Salon — raw prop `-`
258. `ballwoodchop` — Top ile bükülme — `woodchop` — Ev tipi — raw prop `ball`
259. `latstretch` — Ayakta yan esneme — `sidebend` — Ağırlıksız — raw prop `-`
260. `airbike` — Hava bisikleti — `cycle` — Ağırlıksız — raw prop `-`
261. `heeltouch` — Topuk dokunma — `crunch` — Ağırlıksız — raw prop `-`
262. `treadjog` — Koşu bandında jog — `run` — Salon — raw prop `-`
263. `treadrun` — Koşu bandı — `run` — Salon — raw prop `-`
264. `trail` — Doğada koşu/yürüyüş — `run` — Ağırlıksız — raw prop `-`
265. `treadwalk` — Bantta yürüyüş — `walk` — Salon — raw prop `-`
266. `bike` — Bisiklet — `cycle` — Ev tipi — raw prop `-`
267. `statbike` — Sabit bisiklet — `cycle` — Salon — raw prop `-`
268. `recbike` — Yatay bisiklet — `cycle` — Salon — raw prop `-`
269. `elliptical` — Eliptik — `walk` — Salon — raw prop `-`
270. `stairs` — Merdiven makinesi — `stepup` — Salon — raw prop `-`
271. `jumprope` — İp atlama — `jumprope` — Ev tipi — raw prop `-`
272. `jumpingjack` — Açılıp kapanma sıçraması — `jack` — Ağırlıksız — raw prop `-`
273. `scissorjump` — Makas sıçrama — `jack` — Ağırlıksız — raw prop `-`
274. `skipping` — Hızlı sekme — `highknees` — Ağırlıksız — raw prop `-`
275. `buttkick` — Topuk kalçaya — `highknees` — Ağırlıksız — raw prop `-`
276. `buttkick1` — Tek bacak topuk kalçaya — `highknees` — Ağırlıksız — raw prop `-`
277. `splitjump` — Bölünmüş sıçrama — `lunge` — Ağırlıksız — raw prop `-`
278. `longjump` — Durarak uzun atlama — `squat` — Ağırlıksız — raw prop `-`
279. `rocketjump` — Roket sıçrama — `squat` — Ağırlıksız — raw prop `-`
280. `boxjump` — Kutuya sıçrama — `stepup` — Ev tipi — raw prop `-`
281. `benchjump` — Sıraya sıçrama — `stepup` — Ağırlıksız — raw prop `-`
282. `rower` — Kürek makinesi — `seatedrow` — Salon — raw prop `-`
283. `battleropes` — Savaş halatı — `woodchop` — Ev tipi — raw prop `-`
284. `thruster` — Thruster — `squat` — Ev tipi — raw prop `kb`
285. `cleanpress` — Clean ve press — `ohp` — Salon — raw prop `bar`
286. `getup` — Turkish get-up — `situp` — Ev tipi — raw prop `kb`
287. `inchworm` — Tırtıl — `plank` — Ağırlıksız — raw prop `-`
288. `hamstretch` — Arka bacak esnetme — `hamstretch` — Ağırlıksız — raw prop `-`
289. `seatedhamstretch` — Oturarak arka bacak esnetme — `hamstretch` — Ağırlıksız — raw prop `-`
290. `toetouch` — Ayakta parmak ucu uzanma — `hinge` — Ağırlıksız — raw prop `-`
291. `hamcalfstretch` — Arka bacak ve baldır esnetme — `hamstretch` — Ev tipi — raw prop `-`
292. `quadstretch` — Ön bacak esnetme — `qstretch` — Ev tipi — raw prop `-`
293. `elevquad` — Yüksekte ön bacak esnetme — `qstretch` — Ev tipi — raw prop `-`
294. `sidequad` — Yanda ön bacak esnetme — `qstretch` — Ağırlıksız — raw prop `-`
295. `hipflexor` — Kalça fleksörü esnetme — `lunge` — Ağırlıksız — raw prop `-`
296. `standhipflexor` — Ayakta kalça fleksörü — `lunge` — Ağırlıksız — raw prop `-`
297. `kneeacross` — Dizi çapraz çekme — `hamstretch` — Ağırlıksız — raw prop `-`
298. `kneechest` — Dizi göğse çekme — `hamstretch` — Ağırlıksız — raw prop `-`
299. `seatedglute` — Oturarak kalça esnetme — `hamstretch` — Ağırlıksız — raw prop `-`
300. `calfstretch` — Baldır esnetme — `lunge` — Ağırlıksız — raw prop `-`
301. `wallcalf` — Duvarda baldır esnetme — `lunge` — Ağırlıksız — raw prop `-`
302. `seatedcalfstretch` — Oturarak baldır esnetme — `hamstretch` — Ağırlıksız — raw prop `-`
303. `chestshoulder` — Göğüs ve ön omuz esnetme — `armstretch` — Ev tipi — raw prop `-`
304. `dynchest` — Dinamik göğüs esnetme — `fly` — Ağırlıksız — raw prop `-`
305. `behindchest` — Baş arkası göğüs esnetme — `armstretch` — Ev tipi — raw prop `-`
306. `shoulderstretch` — Omuz esnetme — `armstretch` — Ağırlıksız — raw prop `-`
307. `armcircles` — Kol daireleri — `armstretch` — Ağırlıksız — raw prop `-`
308. `shouldercircles` — Omuz daireleri — `shrug` — Ağırlıksız — raw prop `-`
309. `upstretch` — Yukarı esneme — `armstretch` — Ağırlıksız — raw prop `-`
310. `tristretch` — Triceps esnetme — `overheadext` — Ağırlıksız — raw prop `-`
311. `bistretch` — Biceps esnetme — `frontraise` — Ev tipi — raw prop `-`
312. `chinchest` — Çene göğüse esneme — `neckstretch` — Ağırlıksız — raw prop `-`
313. `sideneck` — Yan boyun esnetme — `neckstretch` — Ağırlıksız — raw prop `-`
314. `neckiso` — Boyun izometrik (yan) — `neckstretch` — Ağırlıksız — raw prop `-`
315. `childpose` — Çocuk pozu — `hamstretch` — Ağırlıksız — raw prop `-`
316. `catstretch` — Kedi esnemesi — `plank` — Ağırlıksız — raw prop `-`
317. `torsotwist` — Gövde döndürme — `twiststretch` — Ev tipi — raw prop `-`
318. `midback` — Orta sırt esnetme — `twiststretch` — Ağırlıksız — raw prop `-`
319. `upperback` — Üst sırt esnetme — `armstretch` — Ağırlıksız — raw prop `-`
320. `overheadlat` — Baş üstü kanat esnetme — `armstretch` — Ev tipi — raw prop `-`
321. `lowerbackcurl` — Bel kıvırma — `crunch` — Ağırlıksız — raw prop `-`
322. `windmills` — Yel değirmeni — `twiststretch` — Ağırlıksız — raw prop `-`
323. `wgstretch` — Dünyanın en iyi esnemesi — `lunge` — Ağırlıksız — raw prop `-`
324. `groiners` — Kasık esnetme — `lunge` — Ağırlıksız — raw prop `-`
325. `onefoot` — Tek ayak üstünde duruş — `onefoot` — Ağırlıksız — raw prop `-`
326. `heeltoe` — Topuk-parmak yürüyüşü — `balwalk` — Ağırlıksız — raw prop `-`
327. `chairstand` — Sandalyeden kalkma (süreli) — `chairstand` — Ağırlıksız — raw prop `-`
328. `sidestep` — Yan adım — `sidestep` — Ağırlıksız — raw prop `-`
329. `tandem` — Tandem duruş (ayaklar art arda) — `tandem` — Ağırlıksız — raw prop `-`
330. `armswalk` — Kollar yanda yürüyüş — `balwalk2` — Ağırlıksız — raw prop `-`
331. `fastwalk` — Hızlı yürüyüş — `walk` — Ağırlıksız — raw prop `-`
332. `slowwalk` — Yavaş yürüyüş — `walk` — Ağırlıksız — raw prop `-`

## Aynı örneklenmiş eklem yolu (kimlik birleştirme kanıtı DEĞİL)

65 fazdaki efektif 2D joint koordinatlarının birebir JSON hash gruplaması; yük/sahne/kas/cue/nitelik farklarını yok sayar. Aynı animasyon farklı hareketlerin destek/grip/ROM/tempo kimliğini korumuyor olabilir.

- 4: `sit34`, `jackknife`, `janda`, `getup`
- 3: `skipping`, `buttkick`, `buttkick1`
- 8: `ropeoverhead`, `cableoverhead`, `dboverhead`, `dboverhead1`, `bboverhead`, `seatedtri`, `kboverhead`, `tristretch`
- 4: `sidebendbar`, `sidebend`, `cablesidebend`, `latstretch`
- 4: `bandupright`, `dbupright`, `dbupright1`, `smithupright`
- 4: `skull`, `dbskull`, `decskull`, `bandskull`
- 6: `scappull`, `pullup`, `chinup`, `vbarpull`, `widepull`, `bandpullup`
- 15: `bench`, `decbench`, `dbbench`, `decdb`, `dbbenchn`, `dbbench1`, `smithbench`, `machbench`, `levchest`, `cablepress`, `bandbench`, `floorpress`, `pullover`, `closebench`, `closedbpress`
- 2: `dbcalf`, `calf1`
- 6: `bwsquat`, `chairsquat`, `jumpsquat`, `longjump`, `rocketjump`, `thruster`
- 2: `goodmorning`, `stiffgm`
- 6: `bbshrug`, `shrug`, `cableshrug`, `levshrug`, `platepinch`, `shouldercircles`
- 21: `curl`, `bbcurl`, `ezcurl`, `hammer`, `althammer`, `altcurl`, `inccurl`, `seatedcurl2`, `concurl`, `preacher`, `machpreacher`, `preacher1`, `cablecurl`, `cablehammer`, `machcurl`, `revcurl`, `zottman`, `crosshammer`, `spider`, `widecurl`, `closecurl`
- 9: `row`, `dbrow`, `dbrow1`, `longrow1`, `tbar`, `revrow`, `smithrow`, `kbrow`, `incrow`
- 5: `incbench`, `incdb`, `incdbin`, `smithinc`, `levincchest`
- 3: `quadstretch`, `elevquad`, `sidequad`
- 2: `legext`, `legext1`
- 9: `dbfly`, `incfly`, `decfly`, `crossover`, `lowcross`, `butterfly`, `cablefly`, `chestsqueeze`, `dynchest`
- 5: `farmer`, `treadwalk`, `elliptical`, `fastwalk`, `slowwalk`
- 5: `dipschest`, `dipstri`, `paralleldip`, `benchdips`, `dipmachine`
- 5: `lat`, `bandlat`, `cablelat`, `cablerear`, `pullapart`
- 4: `stepupknee`, `stairs`, `boxjump`, `benchjump`
- 7: `monsterwalk`, `abductor`, `adductor`, `bandadd`, `sideleg`, `latbound`, `cableadd`
- 9: `crunch`, `cablecrunch`, `deccrunch`, `ballcrunch`, `crunchoverhead`, `obliquecrunch`, `crosscrunch`, `heeltouch`, `lowerbackcurl`
- 6: `pulldown`, `closepulldown`, `vbarpulldown`, `underpulldown`, `pulldown1`, `straightarm`
- 6: `hipthrust`, `glutebridge`, `bridge`, `bridge1`, `ballbridge`, `bandbridge`
- 2: `jumpingjack`, `scissorjump`
- 6: `squat`, `fullsquat`, `widesquat`, `narrowsquat`, `smithsquat`, `boxsquat`
- 7: `facepull`, `seatedrow`, `levrow`, `seatedrow1`, `invrow`, `susprow`, `rower`
- 3: `wristcurl`, `wristrev`, `wristcurlbar`
- 4: `airbike`, `bike`, `statbike`, `recbike`
- 4: `russiantwist`, `pallof`, `ballwoodchop`, `battleropes`
- 11: `stiffdl`, `dbstiffdl`, `kbswing`, `sumodl`, `cleandl`, `widestiff`, `bandgm`, `cabledl`, `trapdl`, `pullthrough`, `toetouch`
- 8: `hamstretch`, `seatedhamstretch`, `hamcalfstretch`, `kneeacross`, `kneechest`, `seatedglute`, `seatedcalfstretch`, `childpose`
- 3: `treadjog`, `treadrun`, `trail`
- 3: `torsotwist`, `midback`, `windmills`
- 3: `hangingraise`, `hangpike`, `dipraise`
- 3: `legpress`, `narrowpress`, `smithpress`
- 5: `calf`, `smithcalf`, `presscalf`, `bandcalf`, `seatedcalf`
- 5: `neckfb`, `neckharness`, `chinchest`, `sideneck`, `neckiso`
- 7: `legcurl`, `seatedcurl`, `standcurl`, `ballcurl`, `kickbackglute`, `cablekick`, `bandhipext`
- 9: `pushup`, `pushupwide`, `pushupclose`, `pushupinc`, `pushupfeet`, `pushupdec`, `pushup1`, `plyopushup`, `pushuptri`
- 2: `kickback`, `kickback1`
- 3: `dbsquat`, `pliesquat`, `hacksquat`
- 5: `plank`, `abroller`, `rollout`, `inchworm`, `catstretch`
- 6: `tri`, `ropepushdown`, `vbarpushdown`, `revpushdown`, `lowtri`, `cabletri1`
- 8: `walklunge`, `splitjump`, `hipflexor`, `standhipflexor`, `calfstretch`, `wallcalf`, `wgstretch`, `groiners`
- 7: `chestshoulder`, `behindchest`, `shoulderstretch`, `armcircles`, `upstretch`, `upperback`, `overheadlat`
- 8: `altraise`, `frontraise`, `frontraise2`, `cablefront`, `plateraise`, `scaption`, `wristroller`, `bistretch`
- 3: `dblunge`, `rearlunge`, `splitsquat`
- 7: `revcrunch`, `deadbug`, `benchlegraise`, `kneehipraise`, `legpullin`, `flutter`, `scissor`
- 11: `ohp`, `bbohp`, `arnold`, `dbohp1`, `cableohp`, `levohp`, `pushpress`, `kbpress`, `kbhalo`, `handstand`, `cleanpress`
- 6: `ghr`, `revhyper`, `backext`, `backextfloor`, `ballhyper`, `superman`
