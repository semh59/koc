# Existing Kettlebell One-Legged Deadlift: isolated single-leg hinge repair

## Status

Implementation, host and real-browser tests complete; independent final snapshot review pending. No closure or commit yet.

Baseline: `dc207bdabd703bcaac9e6da29c07265057baaa82`, `release/no-coach`, `D:/PROJECT/NeoWell`.

## Source and observed RED

Mapping: `scripts/exlib-src.txt:44`:
`Kettlebell One-Legged Deadlift|kbdl1|Tek bacak kettlebell deadlift|Arka bacak|hinge|kb`

Pinned source record:
https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/Kettlebell_One-Legged_Deadlift.json

Source instructions require:
1. Standing on one leg on the same side holding kettlebell.
2. Keeping that knee slightly bent, bending at hip, extending free leg behind for balance.
3. Lowering until torso is parallel to ground, then returning to upright position.

Permanent `scripts/gym-kbdl1.test.js` failed before implementation with `free ankle separate from support ankle at start` (exit 1). Old actual runtime resolved generic `hinge`, where both feet were planted identically at Y136, knee was locked straight (0°), free leg did not raise or extend backward, round caps penetrated painted ground by 1.0 unit, and double-leg cue was displayed.

## Scope

- New isolated `FigTpl.kbdl1` with `scene: kbdl1`; common `hinge`, `deadlift`, `defdl`, and `rdl` untouched.
- Support leg (`nL`): foot planted at Y135.6, painted bottom Y137.3 matches ground top. Support knee flexion maintained between 1° and 35° (neither locked straight nor in a deep squat).
- Free leg (`fL`): starts raised at Y130, extends backward to X40 and raises to Y94 at peak hinge, acting as a counterbalance. Ankle remains raised off the ground throughout the loop.
- Only `kbdl1`, `rdl`, and `floorpull` use 3.4 leg strokes; existing scenes unchanged. All painted lines and round caps stay above ground.
- Kettlebell prop (`k: kb`): circular body (r=5.5) and handle line attached at wrist, lowers during hinge, maintains positive clearance from ground, returns to starting height.
- First cue includes single-leg stance, holding kettlebell on the same side, slightly bent support knee, natural back, free leg extended backward for balance, controlled hip hinge and return, and schematic/non-prescriptive limitations. Detail and guide checked; seven independent clause-removal mutations rejected.
- Retained in heavy-rest class: default 150 seconds, configured 0/123/600, same-ID history/templates/config cleaner roundtrip tested.
- Catalog batch `kbdl1` updated (`tp: kbdl1`, `figure_template: kbdl1`, `cue_ids: ["kbdl1"]`). Compiler regenerated runtime and metadata; semantic writers regenerated observations. 332 review, zero new, zero semantic unique. Historical integrity hashes preserved by normalizing only approved template changes and asserting new mapping separately.

## Evidence

- `gym-kbdl1.test.js`: 13 PASS, 129 engine frames; planted support foot, raised free counterbalance leg, slightly bent support knee, whole-chain ground clearance, rigid kettlebell attachment. Eleven mutants: two feet planted, locked support knee, moving support foot, free leg not raising, free leg not extending back, detached kb, no lower, no return, far calf width, near calf width, moving floor.
- `gym-stance-cues.test.js`: 24 PASS including detail/guide first cue and seven clause-removal mutants.
- `gym-catalog-build.test.js`: 23 PASS; `gym-no-photos.test.js`: 4 PASS.
- Full supported runner: 101 files, 2415 PASS, 0 failures, 8 Coach-only skipped, 18 mixed scoped. Log: `C:/Users/semih/AppData/Local/hermes/cache/scratch/kbdl1-final-full.log`.
- Capacitor copy/patch and sync: 28 Java, 44 resources, 115 web assets verified.
- Real Chrome full serial release suite: 68/68 PASS, exit 0, 360/412px. Single-leg kettlebell deadlift includes 4 parameterized geometry tests (motion x mode) plus first-cue test: 10 focused browser cases. Each geometry case measures 129 times, exact path getBBox plus computed half stroke (all <= ground + .02), planted support foot (Y 135.6, bottom 137.3), support knee flex (1-35 deg), raised and backward extending free leg (ankle + width/2 < ground - 2, extension > 15), kettlebell attached at wrist (r=5.5 at wrist+4) with positive clearance throughout, static frame values on reduced motion. Log: `C:/Users/semih/AppData/Local/hermes/cache/scratch/kbdl1-final-e2e.log`. Focused log `kbdl1-e2e.log` passed 10/10. Independent final snapshot review pending.

## Open limits

Line-mode schematic only. Side-view limbs overlap. 2D balance is illustrative; no anatomical, clinical, subjective visual or 3D physical balance/collision approval. Optional volume pilot contact unverified. CI, APK, emulator, physical device unverified. Other old-record defects and 332 canonical reviews remain open.
