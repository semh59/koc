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

  function setLimbBetween(mesh, p1, p2, thickness = 1) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y, dz = p2.z - p1.z;
    const len = Math.hypot(dx, dy, dz);
    mesh.position.set(p1.x, p1.y, p1.z);
    mesh.scale.set(thickness, thickness, Math.max(0.001, len));
    mesh.lookAt(p2.x, p2.y, p2.z);
    mesh.visible = len > 0.001;
  }

  async function createMannequin(THREE) {
    const loader = new THREE.GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load("models/knight.glb", resolve, undefined, reject);
    });
    const model = gltf.scene;
    // Scale and center
    model.scale.set(1.5, 1.5, 1.5);
    
    // Find bones
    const bones = {};
    model.traverse((node) => {
      if (node.isBone) bones[node.name] = node;
    });
    
    const mannequin = {
      group: model,
      headGroup: bones.head || model,
      neckMesh: bones.spine || model,
      chestMesh: bones.chest || model,
      pelvisMesh: bones.hips || model,
      joints: {
        neck: bones.spine,
        shR: bones.upperarm_r,
        shL: bones.upperarm_l,
        elR: bones.lowerarm_r,
        elL: bones.lowerarm_l,
        wrR: bones.hand_r,
        wrL: bones.hand_l,
        hipR: bones.upperleg_r,
        hipL: bones.upperleg_l,
        knR: bones.lowerleg_r,
        knL: bones.lowerleg_l,
        akR: bones.foot_r,
        akL: bones.foot_l
      },
      limbs: {
        armUpperR: bones.upperarm_r,
        armUpperL: bones.upperarm_l,
        armLowerR: bones.lowerarm_r,
        armLowerL: bones.lowerarm_l,
        thighR: bones.upperleg_r,
        thighL: bones.upperleg_l,
        shinR: bones.lowerleg_r,
        shinL: bones.lowerleg_l,
        footR: bones.foot_r,
        footL: bones.foot_l
      },
      equipment: { barbell: new THREE.Group(), bench: new THREE.Group() },
      _bones: bones,
      _isGLTF: true
    };
    
    return mannequin;
  }

  function highlightRegions(mannequin, region) {
    // Reset all emissive
    const reset = (mesh) => {
      if (mesh && mesh.material && mesh.material.emissive) {
        mesh.material.emissive.setHex(0x000000);
        mesh.material.emissiveIntensity = 0;
      }
    };
    // Reset all meshes
    const allMeshes = [mannequin.neckMesh, mannequin.chestMesh, mannequin.pelvisMesh,
      mannequin.limbs.armUpperR, mannequin.limbs.armUpperL,
      mannequin.limbs.armLowerR, mannequin.limbs.armLowerL,
      mannequin.limbs.thighR, mannequin.limbs.thighL,
      mannequin.limbs.shinR, mannequin.limbs.shinL];
    allMeshes.forEach(reset);

    // Map region to meshes
    const r = (region || "").toLowerCase();
    const glow = (meshes) => {
      meshes.forEach(m => {
        if (m && m.material && m.material.emissive) {
          m.material.emissive.setHex(0xff7a2e);
          m.material.emissiveIntensity = 1.5;
        }
      });
    };

    if (r.includes("göğüs") || r.includes("gogus")) glow([mannequin.chestMesh]);
    else if (r.includes("sırt") || r.includes("sirt") || r.includes("trapez")) glow([mannequin.chestMesh]);
    else if (r.includes("omuz")) glow([mannequin.joints.shR, mannequin.joints.shL, mannequin.limbs.armUpperR, mannequin.limbs.armUpperL]);
    else if (r.includes("biseps")) glow([mannequin.limbs.armUpperR, mannequin.limbs.armUpperL]);
    else if (r.includes("triseps")) glow([mannequin.limbs.armUpperR, mannequin.limbs.armUpperL]);
    else if (r.includes("ön kol") || r.includes("on kol")) glow([mannequin.limbs.armLowerR, mannequin.limbs.armLowerL]);
    else if (r.includes("karın") || r.includes("karin") || r.includes("bel")) glow([mannequin.chestMesh, mannequin.pelvisMesh]);
    else if (r.includes("kalça") || r.includes("kalca")) glow([mannequin.pelvisMesh]);
    else if (r.includes("baldır") || r.includes("baldır")) glow([mannequin.limbs.shinR, mannequin.limbs.shinL]);
    else if (r.includes("bacak") || r.includes("baldır")) glow([mannequin.limbs.thighR, mannequin.limbs.thighL, mannequin.limbs.shinR, mannequin.limbs.shinL]);
    else if (r.includes("boyun")) glow([mannequin.neckMesh]);
    else glow([mannequin.chestMesh, mannequin.pelvisMesh, mannequin.limbs.armUpperR, mannequin.limbs.armUpperL, mannequin.limbs.thighR, mannequin.limbs.thighL]);
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
    if (mannequin._isGLTF) {
      // GLTF model: set bone positions from 2D->3D mapping
      const S = S_SCALE;
      const to3 = (pt, z) => new THREE.Vector3((pt[0]-80)*S, (136-pt[1])*S, z*S);
      // Update world matrices
      mannequin.group.updateMatrixWorld(true);
      const bones = mannequin._bones;
      const setBoneWorldPos = (bone, worldPos) => {
        if (!bone || !bone.parent) return;
        bone.parent.updateMatrixWorld(true);
        const local = bone.parent.worldToLocal(worldPos.clone());
        bone.position.copy(local);
      };
      // Torso
      if (J.neck && bones.spine) setBoneWorldPos(bones.spine, to3(J.neck, 0));
      if (J.hip && bones.hips) setBoneWorldPos(bones.hips, to3(J.hip, 0));
      // Arms
      const nA = J.limbs?.nA, fA = J.limbs?.fA;
      if (nA) {
        if (bones.upperarm_r) setBoneWorldPos(bones.upperarm_r, to3(nA[0], 8));
        if (bones.lowerarm_r) setBoneWorldPos(bones.lowerarm_r, to3(nA[1], 8));
        if (bones.hand_r) setBoneWorldPos(bones.hand_r, to3(nA[2], 8));
      }
      if (fA) {
        if (bones.upperarm_l) setBoneWorldPos(bones.upperarm_l, to3(fA[0], -8));
        if (bones.lowerarm_l) setBoneWorldPos(bones.lowerarm_l, to3(fA[1], -8));
        if (bones.hand_l) setBoneWorldPos(bones.hand_l, to3(fA[2], -8));
      }
      // Legs
      const nL = J.limbs?.nL, fL = J.limbs?.fL;
      if (nL) {
        if (bones.upperleg_r) setBoneWorldPos(bones.upperleg_r, to3(nL[0], 5));
        if (bones.lowerleg_r) setBoneWorldPos(bones.lowerleg_r, to3(nL[1], 5));
        if (bones.foot_r) setBoneWorldPos(bones.foot_r, to3(nL[2], 5));
      }
      if (fL) {
        if (bones.upperleg_l) setBoneWorldPos(bones.upperleg_l, to3(fL[0], -5));
        if (bones.lowerleg_l) setBoneWorldPos(bones.lowerleg_l, to3(fL[1], -5));
        if (bones.foot_l) setBoneWorldPos(bones.foot_l, to3(fL[2], -5));
      }
      // Neck
      if (J.head && bones.head) setBoneWorldPos(bones.head, to3(J.head, 0));
      // Update skeleton
      if (mannequin.group.skeleton) mannequin.group.skeleton.update();
      mannequin.group.updateMatrixWorld(true);
      return;
    }
    const isFront = def && def.view === "f";
    const shw = isFront ? 0 : 5; // lateral shoulder offset
    const hpw = isFront ? 0 : 4; // lateral hip offset

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

    // Planted feet positioning (ankle-to-toe continuity)
    const footMidR = akR.clone().lerp(toeR, 0.5);
    mannequin.limbs.footR.position.copy(footMidR);
    mannequin.limbs.footR.lookAt(toeR.x, toeR.y, toeR.z);

    const footMidL = akL.clone().lerp(toeL, 0.5);
    mannequin.limbs.footL.position.copy(footMidL);
    mannequin.limbs.footL.lookAt(toeL.x, toeL.y, toeL.z);

    // Equipment updates
    const barbell = mannequin.equipment.barbell;
    const bench = mannequin.equipment.bench;

    if (def && (def.prop && def.prop.k === "bar" || def.scene === "floorpull" || def.scene === "rdl")) {
      barbell.visible = true;
      const barMid = wrR.clone().lerp(wrL, 0.5);
      barbell.position.copy(barMid);
      barbell.lookAt(wrL.x, wrL.y, wrL.z);
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

  async function createViewer(container, options = {}) {
    if (!window.THREE) throw new Error("Three.js bundle not loaded");
    const THREE = window.THREE;

    const width = options.width || container.clientWidth || 340;
    const height = options.height || container.clientHeight || 260;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

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

    // Keyboard controls for accessibility
    const keyHandler = (ev) => {
      const step = 0.15;
      const t = controls.target;
      switch (ev.key) {
        case "ArrowLeft": camera.position.x -= step; ev.preventDefault(); break;
        case "ArrowRight": camera.position.x += step; ev.preventDefault(); break;
        case "ArrowUp": camera.position.y += step; ev.preventDefault(); break;
        case "ArrowDown": camera.position.y -= step; ev.preventDefault(); break;
        case "+": case "=": camera.position.multiplyScalar(0.9); ev.preventDefault(); break;
        case "-": case "_": camera.position.multiplyScalar(1.1); ev.preventDefault(); break;
        case "r": case "R":
          camera.position.set(2.8, 2.2, 4.2);
          controls.target.set(0, 1.1, 0);
          camera.lookAt(controls.target);
          controls.update();
          ev.preventDefault();
          break;
        default: return;
      }
      camera.lookAt(controls.target);
      controls.update();
      render();
    };
    // (keyboard handled by activate above)

    // Lighting (3-point + hemisphere, softer ambient for depth)
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambLight);

    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.35);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.35);
    sunLight.position.set(5, 8, 6);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Front fill light
    const fillLight = new THREE.DirectionalLight(0xcbd5e1, 0.5);
    fillLight.position.set(-3, 3, 4);
    scene.add(fillLight);

    // Cyan athletic rim light
    const rimLight = new THREE.DirectionalLight(0x4fc2a8, 0.85);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    // Floor Platform & Grid
    const floorGeo = new THREE.CircleGeometry(2.4, 24);
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
    const ringGeo = new THREE.RingGeometry(1.6, 1.62, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x4fc2a8, opacity: 0.35, transparent: true });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.002;
    scene.add(ringMesh);

    // Mannequin
    const mannequin = await createMannequin(THREE);
    mannequin.group.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    scene.add(mannequin.group);

    let animId = null;
    let isRunning = true;

    function render() {
      renderer.render(scene, camera);
    }

    let rafId = null;
    function startRAF() {
      if (rafId) return;
      function loop() {
        controls.update();
        render();
        rafId = requestAnimationFrame(loop);
      }
      rafId = requestAnimationFrame(loop);
    }
    function stopRAF() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }

    // Stop RAF after 1.5s of inactivity
    let idleTimer = null;
    function scheduleIdle() {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(stopRAF, 1500);
    }

    // Start RAF on any interaction
    const activate = () => { startRAF(); scheduleIdle(); };
    renderer.domElement.addEventListener("mousedown", activate);
    renderer.domElement.addEventListener("touchstart", activate);
    renderer.domElement.addEventListener("wheel", activate);
    renderer.domElement.addEventListener("keydown", (e) => { activate(); keyHandler(e); });

    // Initial
    startRAF();
    scheduleIdle();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(1, Math.round(entry.contentRect.width));
        const h = Math.max(1, Math.round(entry.contentRect.height));
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          render();
        }
      }
    });
    resizeObserver.observe(container);

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
        render();
      },
      resize(w, h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      },
      dispose() {
        if (this._playTimer) { clearInterval(this._playTimer); this._playTimer = null; }
        if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
        renderer.domElement.removeEventListener("keydown", keyHandler);
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
      if (viewer.renderer && viewer.scene) viewer.renderer.render(viewer.scene, viewer.camera);
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
    if (frames.length) { applyPose(viewer.mannequin, frames[0], def); if (viewer.renderer && viewer.scene) viewer.renderer.render(viewer.scene, viewer.camera); }
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
    } else if (view === "back") {
      c.position.set(0, 1.4, -4.5);
    } else {
      // 3/4 athletic
      c.position.set(2.8, 2.2, 4.2);
    }
    c.lookAt(t);
    if (viewer.renderer && viewer.scene) viewer.renderer.render(viewer.scene, viewer.camera);
  }

  return {
    isSupported,
    createViewer,
    applyPose,
    play,
    setViewAngle,
    highlightRegions
  };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Fig3D;
}
