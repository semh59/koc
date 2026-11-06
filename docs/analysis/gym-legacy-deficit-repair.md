# Existing deficit deadlift: isolated figure repair

## Status

Local implementation under verification; independent final-snapshot review and commit pending. This is one existing-record repair, not catalog completion or canonical acceptance.

Baseline: `d3118dabb08585dae7c5b71529f1c112f2a5935d`, `release/no-coach`, `D:/PROJECT/NeoWell`.

## Source and observed RED

Pinned source: https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5/exercises/Deficit_Deadlift.json

The source describes an elevated foot platform, lifting from the floor and returning the weight to the floor. Its numeric setup height is not treated as a personal or universal prescription.

Original production `gEx('defdl')` resolved generic `hinge` without platform. The permanent `scripts/gym-deficit.test.js` failed with `defdl must show platform, not generic hinge` (actual undefined, expected deficit, exit 1) before production edits.

## Scope

- New isolated `FigTpl.defdl`, `scene: deficit`; common hinge unchanged.
- Fixed elevated feet at Y123.3. Platform rect X75/Y126/W18/H10.3, painted top Y125, painted base Y137.3. Both feet's full painted footprint lies on the straight top away from rounded corners.
- Plate center starts at Y128, radius8.5 plus stroke half-width0.8: painted bottom Y137.3 meets painted ground top. Load rises then returns; shaft stays rigid length31 with wrist and outer-plate attachment.
- Explicit open schematic load projection separates load from platform. First cue explains setup, controlled lift, hip/knee opening, controlled ground return, illustrative platform height and non-prescriptive horizontal projection.
- Only defdl's source runtime template, figure_template and cue_ids remapped. Compiler regenerates runtime and metadata; semantic writers regenerate observations. 332 review, zero newly accepted, zero semantic unique. Coarse observed groups 77→76 is not canonical deduplication.
- New template stays in heavy-rest category: default150 seconds; configured0/123/600, same-ID history, templates and cleaner roundtrip tested.
- Historical integrity hashes retained. Only explicit approved seatedgm/rackpull/defdl template fields normalized, each repaired mapping separately asserted.

## Tests and evidence

`gym-deficit.test.js`: 129 engine frames, grounded start/return, net and monotonic hip/knee opening, monotonic lift/lower, full-foot support, fixed floor/platform, no load/platform penetration, rigid shaft and plate/hand attachment. Eleven mutants: missing/decorative platform, floating load, moving foot, no lift, detached plate, short shaft, tilted shaft, load on platform, missing return, moving floor. Fourteen PASS including rest and history roundtrip.

`gym-stance-cues.test.js`: detail and guide first cue checked; six individual required-clause removal mutants rejected; ordinary hinge and existing cue behavior retained.

Final supported runner: 98 files, 2371 PASS, zero failures, exit0. Log: `C:/Users/semih/AppData/Local/hermes/cache/scratch/deficit-final-full.log`. Eight Coach-only skips and18 mixed scopes explicitly retained. Earlier pre-history run had2370 checks and is not final evidence.

Generated sync verified28 Java /44 resource /115 web assets after Capacitor copy and tracked patch step. Real Chrome full serial release suite:46/46 PASS, exit0, 360px and412px, detail and guide. New tests measure129 actual SMIL times per screen and reduced-motion static geometry, visible computed strokes, shaft/plate/hand linkage, foot footprints away from rounded corners, platform/load clearance, opening joints, grounded start/return and first cue including open-projection limitation. Log: `C:/Users/semih/AppData/Local/hermes/cache/scratch/deficit-final-e2e.log`. Focused predecessor4/4 is recorded in `neowell-deficit-e2e.log`; final full run supersedes it. Independent final-snapshot review remains pending.

## Limits and remaining risks

This is schematic line-variant geometry, not anatomical/clinical approval or a recommended setup height. Both feet overlap in side projection; open bar projection does not establish source-described physical bar-over-feet placement or three-dimensional collision clearance. No subjective visual approval, CI, APK, emulator or physical-device evidence. Volume is an opt-in pilot with wider strokes; line-mode contact does not prove volume support contact. Parallel browser host instability remains distinct from serial verification. Other old-record defects and all332 canonical reviews remain open.
