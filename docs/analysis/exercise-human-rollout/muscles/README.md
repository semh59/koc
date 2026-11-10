# HumanMuscles — isolated surface-mask contract

## Scope / pins

- Repo `D:/PROJECT/NeoWell`, branch `release/no-coach`, baseline `bfdd8394459a1b29981cb7e7bd36b08a79459b2f`.
- Created only product module `www/modules/gym/human-muscles.js`, test `scripts/gym-human-muscles.test.js`, and this evidence directory. No integration/rig edits or commit.
- Approved neutral GLB SHA-256 `947f9b100d6fc5130ad264b895d3b824a2bc5a917ba271cf0a51a41133c63b21`; actual `AthleticMaleBody` has **14,517** vertices.
- Test first uses `HUMAN_MUSCLES_MODEL`, then `www/models/athletic-human.glb`, then original `D:/PROJECT/NeoWell-exercise-pilot/neutral/neutral-human-viewer.glb`. Hash is mandatory, never a synthetic geometry substitute.

## API for parent integration

UMD browser global `HumanMuscles`, CommonJS `module.exports`, no imported dependencies:

```js
const stats = HumanMuscles.apply(THREE, rig.body, exercise);
const description = HumanMuscles.describe(exercise);
HumanMuscles.reset(THREE, rig.body); // off: restore original color accessor/material flags
```

- Pass original catalog exercise, **not exDef alone**. `exDef` preserves motion template, but omits region/ID metadata.
- `describe` returns `primary`, `secondary` (region identifiers), `warnings`, `illustrative:true`, `validatedAnatomy:false`, `source`.
- `apply` adds `counts`, `sides[region].left/right`, `total`. Left means positive local X on this asset, right negative X. Counts are exclusive painted vertices (primary wins overlap), not triangle areas or physiological recruitment.
- `apply` rewrites one reused vertex-color attribute. Untouched vertices are linear RGB white, so original baseColor + texture appear exactly once. Primary `#ff202d`, secondary `#ff8a16` converted by Three.Color to linear values.
- Original position, normal, UV, skinIndex, skinWeight and other attribute objects/bytes stay untouched. Material object, baseColor, texture, roughness, metalness, normalMap, emissive remain untouched. Only body vertexColors/transparent/opacity/depthWrite/needsUpdate change. Body forced opaque (`false/1/true`); accessories never traversed or modified.
- `reset` restores original color accessor (or its absence), vertexColors, opacity/transparency/depthWrite. Returns false if already reset. Call before disposing/replacing model. Geometry/material must be owned by passed body; do not share them across independent instances.
- Unknown/missing metadata clears highlights, never paints whole body. Warnings: `MISSING_MUSCLE_METADATA`, `UNSUPPORTED_REGION:<text>`, `UNSUPPORTED_BODY`, `EMPTY_MASK:<region>`.
- `r` takes precedence; explicit region-valued legacy `g` fallback only when `r` absent. Group names such as `Bacak`, `İtiş`, `Çekiş`, `Kol` are NOT converted into invented muscles. Composite `r` parses every comma/semicolon/plus/slash/pipe/ampersand component, deduplicated. Existing `İç-dış bacak` stays one supported metadata token.

## Roles / source honesty

Current runtime scripts `exlib → balance → figtpl → exui` executed in VM, actual `exDef` called on every record: **332 records**, **15 named muscle-region labels + Tüm vücut**. **296 records** have named illustrative surface masks. **36 Tüm vücut records explicitly unsupported**, no blanket default. Broad full-body metadata cannot establish precise per-muscle roles; adding those requires separately sourced exercise-specific metadata, not guessing.

Only exact approved `{id:'pushup',tp:'pushup',r:'Göğüs'}` has explicit secondary-role exception, sourced from approved pilot: chest primary, triceps/frontDeltoid secondary. All other named-region records show metadata target red, no invented orange secondary. Same template does not justify copying pilot secondary claims to nine distinct pushup variants, especially triceps-targeted `pushuptri`.

This is **illustrative, unvalidated surface masking**, not anatomical segmentation, clinical validation, EMG, medical guidance, or proof every highlighted muscle contracts. For stretches it depicts catalog target region, not an assertion of active contraction. `İç-dış bacak` cannot separate adduction/abduction by existing region metadata and therefore depicts both coarse surfaces.

### Range derivation

Exact chest/triceps/frontDeltoid predicates and precedence copied unchanged from approved pilot `D:/PROJECT/NeoWell-exercise-pilot/viewer/pilot.js:18-31`: chest **350**, triceps **278**, frontDeltoid **118** selected vertices. `278` was triceps only, not total.

Remaining masks hand-authored against actual neutral GLB position/normal distributions in **mesh-local metres**, not skin weights or bones. Bind bone positions were read only as independent limb-boundary diagnostics (elbow about X=.352/Y=1.222, wrist X=.479/Y=1.096); masks do not read skeleton. Front = positive Z, back = negative Z, bilateral = absolute X, lateral-normal sign mirrored per side. Predicates live explicitly in `human-muscles.js`; no hidden generated atlas.

| Surface | ellipse center absX,Y | radii X,Y | extra restriction |
|---|---|---|---|
| deltoids | .218,1.405 | .072,.105 | bounded Z; front/back/lateral normal |
| biceps | diagonal .22+(1.34-Y)*.72,1.265 | .065,.105 | X>.245, front normal |
| forearms | .425,1.16 | .065,.065 | .37<X<.465,Y>1.12,.07<Z<.195; exclude wrist/hand |
| quadriceps | .128,.655 | .089,.185 | front normal, X>.035 |
| hamstrings | .128,.675 | .084,.165 | back normal, X>.035 |
| glutes | .103,.895 | .105,.108 | back normal |
| calves | .17,.345 | .069,.145 | back normal, X>.095 |
| adductors | .06,.745 | .045,.12 | bounded Z, inward/front normal |
| abductors | .18,.845 | .045,.105 | bounded Z, outward normal |
| abdominals | .035,1.14 | .085,.14 | X<.10, front normal |
| lats | .115,1.24 | .065,.145 | X>.065, back normal |
| upperBack | .065,1.37 | .09,.105 | back normal |
| lowerBack | .05,1.08 | .075,.12 | X<.115, back normal |
| trapezius | .055,1.46 | .105,.085 | back normal |
| neck | .025,1.515 | .04,.047 | X<.06, front normal |

These engineering ranges are asset-specific and require human visual/anatomical review. Another GLB, bind pose, scale, or axis convention is unsupported without recalibration.

## Executed evidence

`node scripts/gym-human-muscles.test.js` exit **0**: real GLTFLoader parses approved bytes; only image bitmap decoding stubbed (1x1 bitmap metadata). No mocked geometry or invented catalog. Original actual GLB map reference is preserved; test does not validate bitmap pixels, WebGL output, mobile speed, or visual anatomy.

Sequential behavioral TDD logs retained: pilot missing-module RED→GREEN; catalog squat empty-mask RED→GREEN; color-attribute/reset RED→GREEN; independent forearm envelope caught hand leak RED→GREEN; shifted actual geometry EMPTY_MASK warning RED→GREEN. First envelope RED for triceps was test-bound typo (.16 instead of approved .158 min), corrected without altering approved pilot mask. Forearm range then tightened against independently defined wrist exclusion.

- Every catalog record resolves actual exDef and is classified supported/explicitly unsupported.
- Independent coarse envelopes inspect actual painted vertices for all 15 named regions; each bilateral and nonzero. No chest-red biceps, arm/leg cross-region leaks within these engineering envelopes.
- Exact pilot per-vertex colors, counts, original attribute object identities and byte hashes, original map/baseColor/material properties.
- Reset, unknown clearing, stable repeated apply, composites, prototype-key safety, standalone UMD global, invalid body and shifted-asset warning.
- Six exact-seam in-memory mutations all exit **1**, reach intended assertions (not loader errors): pilot bounds, biceps→chest, first-component-only composites, whole-body fallback, no reset, forearm wrist/hand leak. `mutation-*.log`.
- Neighbor `node scripts/gym-catalog-baseline.test.js` exit **0** (8 checks).
- Neighbor `node scripts/gym-3d.test.js` exit **1** during concurrent parent integration: legacy fixture lacks `_humanRig`; `fig3d.js:6` reads undefined `.pose`. Outside this isolated module; parent must update fixture/integration. See `neighbor-3d.log`. Not represented as a green broader suite.

`catalog-coverage.json`: every ID with metadata, regions, counts and side counts. `result.json`: aggregate count/model hash. `final-green.log`: final focused output.

**Open:** parent Fig3D integration/toggle/browser render and independent visual review; no whole-catalog anatomical-accuracy or all-exercise secondary-role claim. Full application suite not run by isolated child.
