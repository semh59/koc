"use strict";
/* NeoWell Full 3D Exercise Mannequin Engine (Three.js / WebGL)
   Renders articulated 3D athletic mannequin with dynamic equipment, lighting, shadow plane and orbit controls. */
const Fig3D = (() => {
  const S_SCALE = 0.045; // converts 2D scene units to 3D world meters
  const FLOOR_Y = 136;
  const X0 = 80;

  function isSupported() {
    try {
      const canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch {
      return false;
    }
  }

  // Helper to create a stylized capsule/cylinder connecting two 3D points
  function createLimbMesh(THREE, radiusTop, radiusBottom, mat) {
    const geom = new THREE.CylinderGeometry(radiusTop, radiusBottom, 1, 16);
    geom.translate(0, 0.5, 0); // pivot at base
    geom.rotateX(Math.PI / 2); // align along +Z
    return new THREE.Mesh(geom, mat);
  }

  function setLimbBetween(mesh, p1, p2, thickness = 1) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
    const len = Math.hypot(dx, dy, dz);
    mesh.position.set(p1.x, p1.y, p1.z);
    mesh.scale.set(thickness, thickness, Math.max(0.001, len));
    mesh.lookAt(p2.x, p2.y, p2.z);
    mesh.visible = len > 0.001;
  }

  function createMannequin(THREE) {
    const group = new THREE.Group();

    // High quality athletic materials (matte, non-metallic skin; bright accent joints)
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xb8c4d4,
      roughness: 0.68,
      metalness: 0.02
    });
    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.35,
      metalness: 0.55
    });
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x273449,
      roughness: 0.58,
      metalness: 0.04
    });
    const headMat = new THREE.MeshStandardMaterial({
      color: 0x2a3441,
      roughness: 0.55,
      metalness: 0.03
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.25,
      roughness: 0.15,
      metalness: 0.75
    });
    const footMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.62,
      metalness: 0.08
    });

    // Head & Neck
    const headGroup = new THREE.Group();
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(7 * S_SCALE, 20, 16), headMat);
    headMesh.scale.set(0.9, 1.15, 1.0);
    headGroup.add(headMesh);

    // Visor accent
    const visorMesh = new THREE.Mesh(new THREE.BoxGeometry(7 * S_SCALE * 0.95, 2.5 * S_SCALE, 6 * S_SCALE), visorMat);
    visorMesh.position.set(2 * S_SCALE, 0.5 * S_SCALE, 0);
    headGroup.add(visorMesh);

    const neckMesh = createLimbMesh(THREE, 2.4 * S_SCALE, 2.8 * S_SCALE, skinMat);
    group.add(headGroup);
    group.add(neckMesh);

    // Torso (chest & abdomen & pelvis)
    const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(8 * S_SCALE, 6.5 * S_SCALE, 18 * S_SCALE, 16), torsoMat);
    chestMesh.scale.set(1.0, 1.0, 1.35); // wider across shoulders
    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(6.5 * S_SCALE, 5.5 * S_SCALE, 12 * S_SCALE, 16), torsoMat);
    pelvisMesh.scale.set(0.95, 1.0, 1.25);
    group.add(chestMesh);
    group.add(pelvisMesh);

    // Joint Spheres
    const jointGeom = new THREE.SphereGeometry(2.0 * S_SCALE, 14, 12);
    const joints = {};
    for (const name of ["neck", "shR", "shL", "elR", "elL", "wrR", "wrL", "hipR", "hipL", "knR", "knL", "akR", "akL"]) {
      const jm = new THREE.Mesh(jointGeom, jointMat);
      joints[name] = jm;
      group.add(jm);
    }

    // Limb segments
    const limbs = {
      armUpperR: createLimbMesh(THREE, 2.5 * S_SCALE, 2.1 * S_SCALE, skinMat),
      armUpperL: createLimbMesh(THREE, 2.5 * S_SCALE, 2.1 * S_SCALE, skinMat),
      armLowerR: createLimbMesh(THREE, 2.0 * S_SCALE, 1.6 * S_SCALE, skinMat),
      armLowerL: createLimbMesh(THREE, 2.0 * S_SCALE, 1.6 * S_SCALE, skinMat),
      thighR: createLimbMesh(THREE, 3.8 * S_SCALE, 2.9 * S_SCALE, skinMat),
      thighL: createLimbMesh(THREE, 3.8 * S_SCALE, 2.9 * S_SCALE, skinMat),
      shinR: createLimbMesh(THREE, 2.8 * S_SCALE, 2.0 * S_SCALE, skinMat),
      shinL: createLimbMesh(THREE, 2.8 * S_SCALE, 2.0 * S_SCALE, skinMat),
      footR: new THREE.Mesh(new THREE.BoxGeometry(9 * S_SCALE, 2.2 * S_SCALE, 4 * S_SCALE), footMat),
      footL: new THREE.Mesh(new THREE.BoxGeometry(9 * S_SCALE, 2.2 * S_SCALE, 4 * S_SCALE), footMat)
    };

    for (const k in limbs) group.add(limbs[k]);

    // Equipment group
    const equipGroup = new THREE.Group();
    const barMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.15, metalness: 0.85 });
    const plateMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.45, metalness: 0.3 });
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6, metalness: 0.1 });
    const benchFrameMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.2, metalness: 0.8 });

    // Barbell
    const barMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.2 * S_SCALE, 1.2 * S_SCALE, 44 * S_SCALE, 16), barMat);
    barMesh.rotateX(Math.PI / 2);
    const plateR = new THREE.Mesh(new THREE.CylinderGeometry(9.5 * S_SCALE, 9.5 * S_SCALE, 2.2 * S_SCALE, 24), plateMat);
    plateR.rotateX(Math.PI / 2);
    plateR.position.z = 18 * S_SCALE;
    const plateL = new THREE.Mesh(new THREE.CylinderGeometry(9.5 * S_SCALE, 9.5 * S_SCALE, 2.2 * S_SCALE, 24), plateMat);
    plateL.rotateX(Math.PI / 2);
    plateL.position.z = -18 * S_SCALE;
    const barbell = new THREE.Group();
    barbell.add(barMesh, plateR, plateL);
    barbell.visible = false;
    equipGroup.add(barbell);

    // Bench
    const bench = new THREE.Group();
    const pad = new THREE.Mesh(new THREE.BoxGeometry(48 * S_SCALE, 3.5 * S_SCALE, 14 * S_SCALE), benchMat);
    pad.position.y = 18 * S_SCALE;
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(3 * S_SCALE, 18 * S_SCALE, 10 * S_SCALE), benchFrameMat);
    leg1.position.set(-18 * S_SCALE, 9 * S_SCALE, 0);
    const leg2 = new THREE.Mesh(new THREE.BoxGeometry(3 * S_SCALE, 18 * S_SCALE, 10 * S_SCALE), benchFrameMat);
    leg2.position.set(18 * S_SCALE, 9 * S_SCALE, 0);
    bench.add(pad, leg1, leg2);
    bench.visible = false;
    equipGroup.add(bench);

    group.add(equipGroup);

    return {
      group,
      headGroup,
      neckMesh,
      chestMesh,
      pelvisMesh,
      joints,
      limbs,
      equipment: { barbell, bench }
    };
  }

  function to3D(pt2d, zOffset = 0) {
    // 2D: X0=80 center, Y goes down, FLOOR=136
    // 3D: X right, Y up (0=floor), Z depth
    const x = (pt2d[0] - X0) * S_SCALE;
    const y = Math.max(0, (FLOOR_Y - pt2d[1]) * S_SCALE);
    const z = zOffset * S_SCALE;
    return new THREE.Vector3(x, y, z);
  }

  function applyPose(mannequin, J, def) {
    const isFront = def && def.view === "f";
    const shw = isFront ? 0 : 8; // lateral shoulder offset
    const hpw = isFront ? 0 : 5; // lateral hip offset

    // Neck, Head, Hip
    const pNeck = to3D(J.neck, 0);
    const pHead = to3D(J.head, 0);
    const pHip = to3D(J.hip, 0);

    mannequin.headGroup.position.copy(pHead);
    mannequin.joints.neck.position.copy(pNeck);
    setLimbBetween(mannequin.neckMesh, pNeck, pHead, 1);

    // Torso positioning
    const chestPos = pNeck.clone().lerp(pHip, 0.4);
    mannequin.chestMesh.position.copy(chestPos);
    mannequin.chestMesh.lookAt(pHead.x, pHead.y, pHead.z);
    mannequin.chestMesh.rotateX(Math.PI / 2);

    const pelvisPos = pNeck.clone().lerp(pHip, 0.85);
    mannequin.pelvisMesh.position.copy(pelvisPos);
    mannequin.pelvisMesh.lookAt(pHead.x, pHead.y, pHead.z);
    mannequin.pelvisMesh.rotateX(Math.PI / 2);

    // Limbs: near (R) and far (L)
    const nA = J.limbs.nA, fA = J.limbs.fA;
    const nL = J.limbs.nL, fL = J.limbs.fL;

    const shR = to3D(nA[0], shw);
    const shL = to3D(fA[0], -shw);
    const elR = to3D(nA[1], shw);
    const elL = to3D(fA[1], -shw);
    const wrR = to3D(nA[2], shw);
    const wrL = to3D(fA[2], -shw);

    const hpR = to3D(nL[0], hpw);
    const hpL = to3D(fL[0], -hpw);
    const knR = to3D(nL[1], hpw);
    const knL = to3D(fL[1], -hpw);
    const akR = to3D(nL[2], hpw);
    const akL = to3D(fL[2], -hpw);
    const toeR = to3D(nL[3], hpw);
    const toeL = to3D(fL[3], -hpw);

    // Update joint positions
    mannequin.joints.shR.position.copy(shR);
    mannequin.joints.shL.position.copy(shL);
    mannequin.joints.elR.position.copy(elR);
    mannequin.joints.elL.position.copy(elL);
    mannequin.joints.wrR.position.copy(wrR);
    mannequin.joints.wrL.position.copy(wrL);

    mannequin.joints.hipR.position.copy(hpR);
    mannequin.joints.hipL.position.copy(hpL);
    mannequin.joints.knR.position.copy(knR);
    mannequin.joints.knL.position.copy(knL);
    mannequin.joints.akR.position.copy(akR);
    mannequin.joints.akL.position.copy(akL);

    // Update limb meshes
    setLimbBetween(mannequin.limbs.armUpperR, shR, elR, 1);
    setLimbBetween(mannequin.limbs.armUpperL, shL, elL, 1);
    setLimbBetween(mannequin.limbs.armLowerR, elR, wrR, 1);
    setLimbBetween(mannequin.limbs.armLowerL, elL, wrL, 1);

    setLimbBetween(mannequin.limbs.thighR, hpR, knR, 1);
    setLimbBetween(mannequin.limbs.thighL, hpL, knL, 1);
    setLimbBetween(mannequin.limbs.shinR, knR, akR, 1);
    setLimbBetween(mannequin.limbs.shinL, knL, akL, 1);

    // Planted feet positioning
    const footMidR = akR.clone().lerp(toeR, 0.5);
    footMidR.y = 1.1 * S_SCALE; // ground baseline
    mannequin.limbs.footR.position.copy(footMidR);
    mannequin.limbs.footR.lookAt(toeR.x, 1.1 * S_SCALE, toeR.z);

    const footMidL = akL.clone().lerp(toeL, 0.5);
    footMidL.y = 1.1 * S_SCALE;
    mannequin.limbs.footL.position.copy(footMidL);
    mannequin.limbs.footL.lookAt(toeL.x, 1.1 * S_SCALE, toeL.z);

    // Equipment updates
    const barbell = mannequin.equipment.barbell;
    const bench = mannequin.equipment.bench;

    if (def && (def.prop && def.prop.k === "bar" || def.scene === "floorpull" || def.scene === "rdl")) {
      barbell.visible = true;
      const barMid = wrR.clone().lerp(wrL, 0.5);
      barbell.position.copy(barMid);
      barbell.lookAt(wrR.x, wrR.y, wrR.z + 1);
    } else {
      barbell.visible = false;
    }

    if (def && (def.scene === "bench" || def.scene === "incbench")) {
      bench.visible = true;
      bench.position.set(0, 0, 0);
    } else {
      bench.visible = false;
    }
  }

  function createViewer(container, options = {}) {
    if (!window.THREE) throw new Error("Three.js bundle not loaded");
    const THREE = window.THREE;

    const width = options.width || container.clientWidth || 340;
    const height = options.height || container.clientHeight || 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // darker canvas for contrast

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    // 3/4 athletic perspective: angled slightly from front-right
    camera.position.set(2.8, 2.2, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (THREE.ACESFilmicToneMapping !== undefined) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    if ("outputColorSpace" in renderer && THREE.SRGBColorSpace !== undefined) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if (THREE.sRGBEncoding !== undefined) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Accessibility & touch handling
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "3D mannequin görünümü");
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.tabIndex = 0;

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 1.1, 0);
    controls.minDistance = 1.5;
    controls.maxDistance = 8.0;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01; // don't go below ground

    // Lighting (3-point + hemisphere, softer ambient for depth)
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambLight);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.35);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
    sunLight.position.set(5, 8, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Front fill light
    const fillLight = new THREE.DirectionalLight(0xcbd5e1, 0.5);
    fillLight.position.set(-3, 3, 4);
    scene.add(fillLight);

    // Cyan athletic rim light
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.85);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Floor Platform & Grid
    const floorGeo = new THREE.CircleGeometry(2.4, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.05
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Concentric training rings
    const ringGeo = new THREE.RingGeometry(1.6, 1.62, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, opacity: 0.35, transparent: true });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.002;
    scene.add(ringMesh);

    // Mannequin
    const mannequin = createMannequin(THREE);
    mannequin.group.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    scene.add(mannequin.group);

    let animId = null;
    let isRunning = true;

    // Auto-resize on container size changes (orientation, modal layout)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(1, Math.round(entry.contentRect.width));
        const h = Math.max(1, Math.round(entry.contentRect.height));
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    function renderLoop() {
      if (!isRunning) return;
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(renderLoop);
    }
    renderLoop();

    return {
      scene,
      camera,
      renderer,
      controls,
      mannequin,
      _resizeObserver: resizeObserver,
      animState: { def: null, frames: [], t: 0, dur: 2.6 },
      pause() {
        if (this._playTimer) { clearInterval(this._playTimer); this._playTimer = null; }
        this._paused = true;
      },
      resume(def) {
        this._paused = false;
        const d = def || this._def;
        if (d) Fig3D.play(this, d);
      },
      resetView() {
        camera.position.set(2.8, 2.2, 4.2);
        controls.target.set(0, 1.1, 0);
        camera.lookAt(controls.target);
        controls.update();
      },
      resize(w, h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      },
      dispose() {
        isRunning = false;
        if (this._playTimer) { clearInterval(this._playTimer); this._playTimer = null; }
        if (animId) cancelAnimationFrame(animId);
        if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }

  function play(viewer, def) {
    if (!viewer || !def) return;
    viewer._def = def;
    const N = 64;
    const poses = FigLib.sample(def, N);
    const frames = poses.map(p => FigLib.frame(def, p).J);

    let idx = 0;
    let forward = true;
    const speed = viewer._speed || 1;
    const interval = Math.round((2600 / N) / speed);

    if (viewer._playTimer) clearInterval(viewer._playTimer);

    viewer._playTimer = setInterval(() => {
      if (!frames.length) return;
      applyPose(viewer.mannequin, frames[idx], def);
      if (forward) {
        idx++;
        if (idx >= frames.length) {
          if (def.playback === "once") {
            clearInterval(viewer._playTimer);
            viewer._playTimer = null;
            return;
          }
          idx = 0;
        }
      }
    }, interval);

    // Apply first frame immediately
    if (frames.length) applyPose(viewer.mannequin, frames[0], def);
  }

  function setViewAngle(viewer, view) {
    if (!viewer) return;
    const c = viewer.camera, t = viewer.controls.target;
    if (view === "front") {
      c.position.set(0, 1.4, 4.5);
    } else if (view === "side") {
      c.position.set(4.5, 1.4, 0);
    } else if (view === "top") {
      c.position.set(0.01, 5.0, 0.01);
    } else {
      // 3/4 athletic
      c.position.set(2.8, 2.2, 4.2);
    }
    c.lookAt(t);
  }

  return {
    isSupported,
    createViewer,
    applyPose,
    play,
    setViewAngle
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Fig3D;
}
