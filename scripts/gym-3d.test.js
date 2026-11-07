"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const threePath = path.join(root, "www", "vendor", "three", "three.bundle.js");

// 1. Verify Three.js bundle exists and exports necessary primitives
assert.ok(fs.existsSync(threePath), "Three.js bundle must exist at www/vendor/three/three.bundle.js");
const bundleCode = fs.readFileSync(threePath, "utf8");
assert.ok(bundleCode.length > 300000, "Three.js bundle must be complete (>300KB)");

const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(bundleCode, sandbox);
const THREE = sandbox.window.THREE;
assert.ok(THREE, "THREE must be on window");
assert.ok(typeof THREE.Scene === "function", "THREE.Scene must be exported");
assert.ok(typeof THREE.PerspectiveCamera === "function", "THREE.PerspectiveCamera must be exported");
assert.ok(typeof THREE.OrbitControls === "function", "THREE.OrbitControls must be exported");
assert.ok(typeof THREE.WebGLRenderer === "function", "THREE.WebGLRenderer must be exported");

console.log("PASS 3D Three.js bundle integrity and OrbitControls verified");

// 2. Kinematics & Mannequin mathematical mapping
global.THREE = THREE;
const FigLib = require("../www/modules/gym/figlib.js");
const FigTpl = require("../www/modules/gym/figtpl.js");
const Fig3D = require("../www/modules/gym/fig3d.js");

assert.ok(typeof Fig3D.applyPose === "function", "Fig3D.applyPose must be a function");

// Verify Push-up 3D Kinematics
const sPush = FigLib.sample(FigTpl.pushup, 14);
const f0 = FigLib.frame(FigTpl.pushup, sPush[0]).J;
const fMid = FigLib.frame(FigTpl.pushup, sPush[7]).J;

// Create mock mannequin structure
const mockMannequin = {
  headGroup: new THREE.Group(),
  neckMesh: new THREE.Mesh(),
  chestMesh: new THREE.Mesh(),
  pelvisMesh: new THREE.Mesh(),
  joints: {
    neck: new THREE.Mesh(), shR: new THREE.Mesh(), shL: new THREE.Mesh(),
    elR: new THREE.Mesh(), elL: new THREE.Mesh(), wrR: new THREE.Mesh(), wrL: new THREE.Mesh(),
    hipR: new THREE.Mesh(), hipL: new THREE.Mesh(), knR: new THREE.Mesh(), knL: new THREE.Mesh(),
    akR: new THREE.Mesh(), akL: new THREE.Mesh()
  },
  limbs: {
    armUpperR: new THREE.Mesh(), armUpperL: new THREE.Mesh(),
    armLowerR: new THREE.Mesh(), armLowerL: new THREE.Mesh(),
    thighR: new THREE.Mesh(), thighL: new THREE.Mesh(),
    shinR: new THREE.Mesh(), shinL: new THREE.Mesh(),
    footR: new THREE.Mesh(), footL: new THREE.Mesh()
  },
  equipment: {
    barbell: new THREE.Group(),
    bench: new THREE.Group()
  }
};

Fig3D.applyPose(mockMannequin, f0, FigTpl.pushup);
const neckY0 = mockMannequin.joints.neck.position.y;
const footY0 = mockMannequin.limbs.footR.position.y;

Fig3D.applyPose(mockMannequin, fMid, FigTpl.pushup);
const neckYMid = mockMannequin.joints.neck.position.y;
const footYMid = mockMannequin.limbs.footR.position.y;

assert.ok(neckY0 > neckYMid + 0.3, "Chest/neck must descend in 3D during pushup descent");
assert.ok(Math.abs(footY0 - footYMid) < 0.001, "Feet must remain rigidly planted in 3D space throughout pushup");
assert.ok(footY0 >= 0, "Feet must not penetrate below 3D floor");

console.log("PASS 3D pushup kinematics: planted feet and descending chest verified in 3D space");

// 3. Squat 3D Kinematics
const sSquat = FigLib.sample(FigTpl.squat, 14);
const sq0 = FigLib.frame(FigTpl.squat, sSquat[0]).J;
const sqMid = FigLib.frame(FigTpl.squat, sSquat[7]).J;

Fig3D.applyPose(mockMannequin, sq0, FigTpl.squat);
const hipY0 = mockMannequin.joints.hipR.position.y;

Fig3D.applyPose(mockMannequin, sqMid, FigTpl.squat);
const hipYMid = mockMannequin.joints.hipR.position.y;

assert.ok(hipY0 > hipYMid + 0.4, "Hips must descend during 3D squat descent");

console.log("PASS 3D squat kinematics: deep hip descent verified in 3D space");

// 4. Deadlift 3D Kinematics and Equipment Tracking
const sDl = FigLib.sample(FigTpl.deadlift, 14);
const dl0 = FigLib.frame(FigTpl.deadlift, sDl[0]).J;
Fig3D.applyPose(mockMannequin, dl0, FigTpl.deadlift);

assert.ok(mockMannequin.equipment.barbell.visible, "Barbell must be visible in deadlift");
const barPos = mockMannequin.equipment.barbell.position;
const wrPos = mockMannequin.joints.wrR.position;
assert.ok(Math.abs(barPos.y - wrPos.y) < 0.1, "Barbell in 3D must be held in lifter's hands");

console.log("PASS 3D deadlift kinematics and barbell attachment verified");
