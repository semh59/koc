"use strict";
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");
const {preflight}=require("../scripts/gym-batch-preflight");

// TDD: Verify batch preflight blocker behavior when B-4 visual pilot is approved.
// In scripts/gym-batch-preflight.js line 53, blockers hardcoded:
// "visual-pilot-not-approved", "baseline-canonical-review", "independent-content-review-required"
// Now that B-4 is closed, the pilot blocker should be conditional or lifted when pilot artifact exists.

const batchPath=path.join(__dirname,"gym-catalog/batches/legacy-local.json");
const candidateBatch={
  schemaVersion: 1,
  batch: "pilot-admission-check",
  sources: {
    "test-source": {
      url: "https://example.invalid/test",
      commit: "a".repeat(40),
      license: "Unlicense",
      license_status: "verified",
      evidence_url: "https://example.invalid/LICENSE",
      attribution: "Synthetic fixture"
    }
  },
  records: [
    {
      runtime: {
        id: "probe_pilot_squat",
        n: "SENTETİK TEST — Squat",
        r: "Ön bacak",
        g: "Bacak",
        k: "w",
        q: "Salon",
        l: "Başlangıç",
        c: "g",
        inc: 2.5,
        tp: "squat",
        im: 0
      },
      metadata: {
        canonical_id: "probe_pilot_squat",
        canonical: {
          pattern: ["squat"],
          primary_joints: ["hip", "knee"],
          rom: ["parallel"],
          unilateral: ["bilateral"],
          stance: ["standing"],
          load_mode: ["external"],
          equipment_role: ["barbell_back"],
          direction: ["sagittal"],
          tempo_mode: ["dynamic"],
          target_region: ["quads"],
          start_end: ["stand_squat_stand"]
        },
        signature: "direction:sagittal|equipment_role:barbell_back|load_mode:external|pattern:squat|primary_joints:hip,knee|rom:parallel|stance:standing|start_end:stand_squat_stand|target_region:quads|tempo_mode:dynamic|unilateral:bilateral",
        family: "squat",
        cue_ids: ["squat"],
        figure_template: "squat",
        source_ref: "test-source",
        license_ref: "test-source",
        source_name: "Synthetic test source",
        retrieved_at: "2026-01-01T00:00:00.000Z",
        transformation_note: "Synthetic test fixture",
        status: "review"
      }
    }
  ]
};

const result=preflight(candidateBatch);
assert.ok(!result.blockers.includes("visual-pilot-not-approved"), "B-4 visual pilot is approved; visual-pilot-not-approved blocker must be lifted");
console.log("PASS visual-pilot-not-approved blocker lifted when pilot is approved");
