"use strict";
const assert=require("node:assert/strict");
const fs=require("fs"),path=require("path");
const {preflight}=require("../scripts/gym-batch-preflight");
const {compile}=require("../scripts/build-gym-catalog");

// TDD: B-5 Candidate Batch Admission Gate
// Rule 1: A candidate batch with status='review' cannot be directly built into exlib.js by build-gym-catalog.js.
// Rule 2: build-gym-catalog.js must only compile batches where every record has passed independent admission gate with status='accepted'.
// Rule 3: Any batch containing 'review' or 'rejected' records must be rejected by compiler.

const sampleCandidateBatch={
  schemaVersion: 1,
  batch: "candidate-batch-01",
  records: [
    {
      runtime: {
        id: "probe_unadmitted",
        n: "Unadmitted Probe",
        r: "Ön bacak",
        g: "Bacak",
        k: "w",
        q: "Salon",
        l: "Başlangıç",
        c: "g",
        inc: 2.5,
        tp: "squat"
      },
      metadata: {
        canonical_id: "probe_unadmitted",
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
        source_ref: "neowell-data",
        license_ref: "neowell-data",
        source_name: "Test source",
        retrieved_at: "2026-01-01T00:00:00.000Z",
        transformation_note: "Test note",
        status: "review"
      }
    }
  ]
};

// Trying to compile a batch outside legacy batches must throw
assert.throws(()=>compile([sampleCandidateBatch]), /new batches blocked until B-4 visual pilot and admission gate/);

console.log("PASS unadmitted candidate batch cannot be compiled into production catalog");
