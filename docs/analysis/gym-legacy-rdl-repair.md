# Existing Romanian deadlift: isolated top-down hinge repair

## Status

Local engine, supported host and real-browser checks passed; independent final-snapshot review pending. No commit/closure yet.

Baseline `ee6354e0d9affc6a818acad4dbcf245faa5e2387`, `release/no-coach`, `D:/PROJECT/NeoWell`.

## Source and observed RED

`scripts/exlib-src.txt` maps Romanian Deadlift to `rdl`. Pinned upstream `dist/exercises.json` yielded one exact source record before reading:
https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/Romanian_Deadlift.json

Source describes initial pickup and then standing-top hip-back lowering/repetition with slightly bent knees. It does not require floor contact on every repetition. Animation intentionally demonstrates the standing repetition, not the initial pickup; first cue states this.

Permanent `scripts/gym-rdl.test.js` ran before implementation and failed with `slightly bent schematic knees, never straight or deep squat`, exit1. Old generic hinge locked knees at top and painted feet/calf round caps crossed painted ground. Lack of repeated plate-floor contact was not classified as a defect.

## Scope

New `FigTpl.rdl` isolated from common hinge. Only rdl source runtime.tp and metadata figure_template/cue_ids changed; compiler regenerated runtime/metadata. Explicit remap chosen rather than a hidden ID-only resolver exception, preserving metadata/runtime agreement and canonical review. Heavy-rest classification explicitly retains150 seconds.

Standing top→hip-back hinge/lowering→top loop. Feet fixed at Y135.6; painted foot/calf bottom Y137.3 matches ground top. Only rdl/floorpull use3.4 leg strokes; existing scenes unchanged. Visible31-unit shaft connects wrist to outer plate; open side projection disclosed as schematic, not a personal bar placement or angle recommendation. First cue includes planted feet, slightly bent knees, natural back, hip-back controlled lowering, upper return, initial-pickup omission, no mandatory repeated floor contact and projection limits.

The test's1–35-degree schematic knee-flexion envelope distinguishes locked/deep-squat mutations; it is not a clinical range or prescribed technique. Candidate independently measured flexion13.629–18.678 degrees. Load has positive ground clearance throughout; no forced floor touch.

## Evidence

- `gym-rdl.test.js`:14 PASS,129 engine frames through actual gEx→exDef; standing start, backwards hip travel, controlled lower/return, fixed painted feet/floor and whole-chain round-cap bounds, no mandatory platform, rigid attached shaft/plate/wrist. Eleven mutants: far/near calf widths, locked knee, moving toe, detached plate/wrist, no lower/return, moving floor, short/tilted shaft.
- Default150 and configured0/123/600, same-ID history/templates/config cleaner roundtrip passed.
- `gym-stance-cues.test.js`:23 PASS, real detail/guide first cue and nine clause-removal mutants. Ordinary/custom hinge fallback preserved.
- Full supported runner:100 files/2400 PASS/zero failure,8 Coach-only skipped/18 mixed scoped. Log `C:/Users/semih/AppData/Local/hermes/cache/scratch/rdl-final-full.log`.
- Capacitor copy/patch and generated sync:28 Java/44 resources/115 web assets verified.
- Runtime332/review332, new0, semanticUnique0. Historical unaffected-field hashes preserved, only explicitly approved template values normalized and all repaired mappings separately asserted.
- Real Chrome full serial release suite:58/58 PASS, exit0,360/412px. RDL detail/guide × animated/reduced are four parameterized geometry tests plus first-cue test:10 focused browser cases. Each geometry case measures129 times, exact path getBBox plus computed half stroke, complete contacts/chain, bent knees and hip-back load lowering/return; static modes remain unchanged across times. Log `C:/Users/semih/AppData/Local/hermes/cache/scratch/rdl-final-e2e.log`. Focused log `rdl-e2e-4203/chrome-focused-verified.log` passed10/10. Earlier combined browser prototype timed out45s; cases split by mode without weakening contacts or knee bounds. SMIL loop float residue (~8e-6) uses0.0005 coordinate tolerance. No physical-device inference. Independent final snapshot review pending.

## Open limits

Line-mode schematic only. Side-view feet overlap; open bar projection is not physical bar-over-foot or3D collision validation. Optional volume pilot contact, anatomical/clinical/subjective approval, CI/APK/emulator/real device unverified. Other old-record defects and332 canonical reviews remain open. Prior repaired records remain separate accepted snapshots, not evidence that all legacy content is fixed.
