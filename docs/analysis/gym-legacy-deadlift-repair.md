# Existing ordinary deadlift: isolated floor-pull repair

## Status

Implementation, host and real-browser tests complete; independent final snapshot review pending. No closure or commit yet.

Baseline `0de3d906cdca4a58fce5357e06218ab79846e6da`, `release/no-coach`, `D:/PROJECT/NeoWell`.

## Source and RED

Mapping: `scripts/exlib-src.txt`, Barbell Deadlift → deadlift. Pinned source read successfully:
https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/Barbell_Deadlift.json

Source explicitly describes lifting by legs while bringing torso upright, then bending knees/torso to return until weights touch floor. No universal joint-angle prescription is inferred.

Permanent `scripts/gym-deadlift.test.js` executed before implementation: exit1, `deadlift load starts and returns on painted ground`. Old actual runtime resolved common hinge; its plate never reached ground.

## Repair scope

New `FigTpl.deadlift` with `scene: floorpull`; only ordinary deadlift runtime template, metadata figure_template and cue_ids changed. Common hinge and RDL untouched. No raised foot platform.

Ground painted top Y137.3. Both foot centers Y135.6, painted bottom Y137.3. Plate center Y128 at start/return, painted radius9.3 reaches ground. Top center Y88.6 gives39.4 lift. Fixed31-unit visible horizontal shaft with attached wrist and outer plate. Figure uses an open projection, explicitly non-prescriptive in first cue. Chosen angles are schematic, not clinical or setup recommendations.

First cue includes planted feet, controlled ground lift, hip/knee extension and controlled ground return, natural back position and schematic/open-projection limits. Guide shows first cue; six independent clause-removal mutations rejected by cue test.

New key retained in heavy-rest class. ID/history/templates unchanged; default150 seconds and configured0/123/600 tested. Cleaner/history/template roundtrip verified. Historical projection hashes retained; only explicitly approved template fields normalized and new template mapping separately asserted.

Compiler and semantic writers regenerated runtime/metadata/observations. Runtime332/review332, new0, semanticUnique0; figure separation is not canonical acceptance.

## Evidence

- `gym-deadlift.test.js`:14 PASS, 129 sampled engine frames; fixed painted-ground feet, grounded plate start/return, monotonic and net hip/knee extension, rising/lowering load, rigid attached shaft/plate/wrist, fixed ground. Eleven mutants reject floating start, absent lift, moving foot, detached plate, shortened/elevated second shaft end, missing return, moving floor, detached hand and independently widened near/far calf round caps. All painted line points plus half stroke must stay above painted ground.
- `gym-stance-cues.test.js`:22 PASS including detail/guide and clause-removal mutations.
- `gym-catalog-build.test.js`:23 PASS; `gym-no-photos.test.js`:4 PASS.
- `node scripts/run-no-coach-tests.js`:99 files/2385 PASS/zero failure,8 Coach-only skipped/18 mixed scoped. Log `C:/Users/semih/AppData/Local/hermes/cache/scratch/deadlift-capfix-full.log`.
- Capacitor copy plus patch and sync:28 Java/44 resource/115 web assets verified.
- Real Chrome full serial release suite:48/48 PASS, exit0,360/412px; actual detail/guide129 SMIL times, reduced-motion/static contact, first cue and computed strokes. Log `C:/Users/semih/AppData/Local/hermes/cache/scratch/deadlift-capfix-e2e.log`. Initial full run had46 passed/2 failed: existing shoulder-vs-handheld cue regression caught the omitted near-leg warning. Warning restored; tests were not weakened. Earlier failure log `deadlift-final-e2e.log` retained. Independent final snapshot review pending.

## Independent rejection and corrective RED/GREEN

First figure snapshot `33ba7b25a2ca2a31c0e1aa801bf3573f72d7645e` received geometry REJECT despite2383 host checks and48 browser passes: far/near calf round caps extended0.6/0.4 below painted ground. Preservation audit passed, but did not close geometry.

A new whole-line painted-bound assertion failed with `every painted limb and shaft stays above floor, including round caps` (exit1), archived in `deadlift-roundcap-red.log`. Only floorpull leg strokes now use3.4, matching feet; other scenes preserve their old widths. Ankle/IK poses and plate contact unchanged. Two independent width mutants restore4.6/4.2 and are rejected. Browser measures all drawn path bounds at33 points per path, half computed stroke included, at every129 SMIL time and static/reduced detail/guide. Final99files2385PASS and48/48 browser logs above supersede pre-cap-fix greens. Re-audit of final staged snapshot pending.

## Open limits

Line-mode schematic only; no physical bar-over-foot, anatomical, clinical, subjective visual or3D collision approval. Side-view feet overlap. Optional volume pilot uses wider strokes and is not qualified by line contact tests. CI/APK/emulator/physical device untested. Parallel browser host instability remains separate from serial runs. Other old records and332 canonical reviews remain open.
