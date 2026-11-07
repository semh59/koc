"use strict";
const assert=require("node:assert/strict"),{boot}=require("./html");

boot().then(w=>{try{
  const ev=s=>w.eval(s);
  const frames=ev("FigLib.sample(exDef(gEx('pushup')),128).map(p=>FigLib.frame(exDef(gEx('pushup')),p))");

  function check(fs){
    const floor=f=>f.parts.find(p=>p.c==="floor");
    const ground=f=>floor(f).pts[0][1]-floor(f).w/2; // 138 - 0.7 = 137.3

    for(let i=0;i<fs.length;i++){
      const f=fs[i],J=f.J,wrist=J.limbs.nA[2],toe=J.limbs.nL[3],ankle=J.limbs.nL[2];

      // Feet must stay planted on the floor (Y = 136, near ground)
      assert.ok(Math.abs(toe[1]-136)<0.05,`pushup toe must stay planted on floor, saw Y=${toe[1]} at frame ${i}`);
      assert.ok(Math.abs(toe[0]-fs[0].J.limbs.nL[3][0])<0.05,`pushup toe X must stay stationary, saw X=${toe[0]} at frame ${i}`);
      assert.ok(Math.abs(ankle[0]-fs[0].J.limbs.nL[2][0])<0.05,`pushup ankle X must stay stationary`);

      // Wrists must stay on the floor (Y = 136)
      assert.ok(Math.abs(wrist[1]-136)<0.05,`pushup wrist must stay on floor, saw Y=${wrist[1]} at frame ${i}`);
      assert.ok(Math.abs(wrist[0]-fs[0].J.limbs.nA[2][0])<0.05,`pushup wrist X must stay stationary`);

      // Limbs stay above floor line bottom (138.7)
      const floorBottom=floor(f).pts[0][1]+floor(f).w/2;
      for(const part of f.parts.filter(p=>p.k==="line"&&p.c!=="floor")){
        assert.ok(part.pts.every(q=>q[1]+part.w/2<=floorBottom+0.05),`part ${part.c} penetrates below floor bottom`);
      }

      // Torso lowers towards the floor in eccentric descent (frames 0 to 64)
      if(i>0&&i<=64){
        assert.ok(J.neck[1]>=fs[i-1].J.neck[1]-0.001,"chest/neck descends monotonically");
        assert.ok(J.hip[1]>=fs[i-1].J.hip[1]-0.001,"hip descends monotonically");
      }
      if(i>64){
        assert.ok(J.neck[1]<=fs[i-1].J.neck[1]+0.001,"chest/neck ascends monotonically");
        assert.ok(J.hip[1]<=fs[i-1].J.hip[1]+0.001,"hip ascends monotonically");
      }
    }

    // Depth check: chest descends at least 12 units
    assert.ok(fs[64].J.neck[1]-fs[0].J.neck[1]>12,"chest has real pushup descent depth");
    // Elbow bends back
    assert.ok(fs[64].J.limbs.nA[1][0]-fs[0].J.limbs.nA[1][0]>5,"elbows flex backward");
    // Return to start
    assert.deepEqual(fs[0].parts,fs[128].parts,"pushup returns to starting position");
  }

  check(frames);
  console.log("PASS pushup feet stay planted on floor with chest descending");

  // Negative mutation guards: ensure test catches regressions
  for(const [name,mutate] of [
    ["floating toe",fs=>fs[32].J.limbs.nL[3][1]-=5],
    ["shifting toe",fs=>fs[32].J.limbs.nL[3][0]+=5],
    ["floating wrist",fs=>fs[32].J.limbs.nA[2][1]-=5],
    ["no chest descent",fs=>fs[64].J.neck[1]=fs[0].J.neck[1]],
    ["no elbow flex",fs=>fs[64].J.limbs.nA[1][0]=fs[0].J.limbs.nA[1][0]],
    ["limb below floor",fs=>fs[32].parts.filter(p=>p.k==="line"&&p.c!=="floor")[0].pts[2][1]+=10]
  ]){
    const mutated=JSON.parse(JSON.stringify(frames));
    mutate(mutated);
    assert.throws(()=>check(mutated),assert.AssertionError);
    console.log(`PASS pushup guard rejects ${name}`);
  }

  // Verify 2.5D rendering in UI
  const thumbSvg=ev("exFig(gEx('pushup'),false)");
  assert.ok(thumbSvg.includes('data-fig-variant="volume"'),"thumbnail must render in 2.5d volume mode");
  assert.ok(thumbSvg.includes('data-ground-shadow="fixed"'),"thumbnail must include ground shadow");

  const guideSvg=ev("exFig(gEx('pushup'),true)");
  assert.ok(guideSvg.includes('data-fig-variant="volume"'),"guide figure must render in 2.5d volume mode");

  ev("exSheet('pushup')");
  const sheetSvg=ev("document.querySelector('#sheet .exfig svg').outerHTML");
  assert.ok(sheetSvg.includes('data-fig-variant="volume"'),"detail sheet must render in 2.5d volume mode");
  assert.ok(sheetSvg.includes('data-ground-shadow="fixed"'),"detail sheet must include ground shadow");
  assert.ok(sheetSvg.includes('fg-joint'),"detail sheet must include joint depth");
  assert.ok(sheetSvg.includes('fg-pelvis'),"detail sheet must include pelvis depth");
  assert.ok(sheetSvg.includes('fg-highlight'),"detail sheet must include highlight reflection");
  console.log("PASS 2.5D stick figure rendering verified in library, guide, and detail sheet");

}finally{w.close()}}).catch(e=>{console.error(e);process.exitCode=1});
