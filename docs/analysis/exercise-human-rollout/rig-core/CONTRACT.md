# HumanRig integration contract

Load UMD-style `human-rig.js` after Three.js and before Fig3D. Global lexical `HumanRig` and CommonJS `module.exports` expose `create(THREE, root, handSupport)`; factory synchronous after GLTFLoader completes. Pass untouched approved GLB scene at physical scale 1 (height approximately 1.7m), not old 1.5 scale. Scene parent should have identity transform.

Return: `{root, body, bones, rest, pose(J, def, phase), snapshot(), metrics(), status}`. `rest` records bind local transforms. `snapshot` returns bone world matrices and sampled deformed body vertices. `metrics` returns finite/contact/skin bounds measurements. `status` describes solver and remaining constraints; measurements do not imply anatomical approval.

`pose` resets bind transforms every call. Only root translation/rotation and child rotations change. Generic J supplied by actual `FigLib.frame(def, sampledPose).J` (includes `pose`, `view`, `limbs`). Factory does not sample or loop phases; renderer retains FigLib playback including one-shot semantics. Pass phase in cycles for approved pushup (0 top, .5 bottom, 1 top).

Set `def._template` to resolved template key. Approved pushup uses `_template === 'pushup'` only when effective definition matches original plain pushup, no pose/frame overrides, front view, alternate support/scene or playback. Every variant uses J-driven generic retarget rather than silently substituting approved plain motion. Generic solver uses original bone offsets/lengths, normalized frame directions, independent near/far limbs and source foot directions.

Parent owns renderer, highlights, equipment, UI, model/JSON copy, script loading and bundle. Core does not fetch, import Three.js, edit materials/geometry, create RAF, or own disposal.
