"use strict";
const assert=require("node:assert/strict"),{boot}=require("./html");
boot().then(w=>{try{
  const ev=s=>w.eval(s),d=ev("exDef(gEx('rackpull'))");
  assert.equal(d.scene,"rack","rack pull must show real rack pins, not unsupported generic hinge");
  const frames=ev("FigLib.sample(exDef(gEx('rackpull')),64).map(p=>FigLib.frame(exDef(gEx('rackpull')),p))");
  function check(fs){
    const pin=fs[0].parts.find(p=>p.c==="prop"&&p.k==="line"&&p.w===2.4&&p.pts[0][1]===p.pts[1][1]);
    assert.ok(pin,"horizontal rack pin must exist");
    const shaft=f=>f.parts.find(p=>p.c==="barshaft");
    assert.ok(shaft(fs[0]),"visible shaft must contact pin, not plate bottom");
    for(const f of fs){
      const bar=shaft(f);
      assert.ok(bar&&bar.k==="line"&&Number.isFinite(bar.w)&&bar.w>0&&bar.pts.length===2&&bar.pts.flat().every(Number.isFinite),"shaft is a finite line with positive width");
      assert.ok(Math.abs(bar.pts[0][1]-bar.pts[1][1])<.001,"both shaft endpoints must be horizontal");
    }
    for(const f of [fs[0],fs[64]]){
      const bar=shaft(f),plate=f.parts.find(p=>p.c==="plate"),innerEnd=plate.p[0]-plate.r-.8;
      assert.ok(Math.min(bar.pts[1][0],pin.pts[1][0],innerEnd)-Math.max(bar.pts[0][0],pin.pts[0][0])>3,"rack pin must support exposed inner shaft outside plate footprint");
      assert.ok(pin.pts[1][0]+pin.w/2<innerEnd,"pin must not intersect projected plate footprint");
    }
    const gap=f=>pin.pts[0][1]-pin.w/2-shaft(f).pts[0][1]-shaft(f).w/2;
    assert.ok(Math.abs(gap(fs[0]))<.02&&Math.abs(gap(fs[64]))<.02,"shaft starts and returns on pin");
    assert.ok(gap(fs[32])>8,"shaft lifts clear of pin");
    const props=f=>JSON.stringify(f.parts.filter(p=>p.c==="prop"));
    for(const f of fs){
      assert.equal(props(f),props(fs[0]),"rack stays fixed");assert.ok(gap(f)>-.02,"shaft never sinks below support");
      const bar=shaft(f),wrist=f.J.limbs.nA[2],plate=f.parts.find(p=>p.c==="plate");
      assert.ok(Math.abs(bar.pts[1][0]-bar.pts[0][0]-31)<.02&&Math.hypot(plate.p[0]-bar.pts[1][0],plate.p[1]-bar.pts[1][1])<.02,"rigid shaft connects hand to outer plate");
      const px=Math.max(pin.pts[0][0],Math.min(pin.pts[1][0],plate.p[0]));
      assert.ok(Math.hypot(plate.p[0]-px,plate.p[1]-pin.pts[0][1])-plate.r-.8-pin.w/2>0,"plate clears pin throughout movement");
      assert.ok(Math.abs(bar.pts[0][1]-wrist[1])<.02&&wrist[0]>=bar.pts[0][0]&&wrist[0]<=bar.pts[1][0],"hand holds visible shaft");
      for(const k of ["nL","fL"])for(const i of [2,3])assert.ok(Math.hypot(...f.J.limbs[k][i].map((v,a)=>v-fs[0].J.limbs[k][i][a]))<.02&&Math.abs(f.J.limbs[k][i][1]-136)<.02,"feet stay planted on ground");
    }
    assert.ok(fs[32].J.neck[1]<fs[0].J.neck[1]-5,"torso rises during pull");
    assert.deepEqual(fs[64].parts,fs[0].parts,"rack pull loop closes");
  }
  check(frames);console.log("PASS rack pull shaft lifts from fixed pins and returns with grounded feet");
  for(const [name,mutate] of [["missing pins",fs=>fs.forEach(f=>f.parts=f.parts.filter(p=>p.c!=="prop"))],["floating start",fs=>fs[0].parts.find(p=>p.c==="barshaft").pts.forEach(p=>p[1]-=4)],["no lift",fs=>fs[32]=structuredClone(fs[0])],["moving feet",fs=>fs[16].J.limbs.fL[3][0]+=4],["moving pin",fs=>fs[16].parts.find(p=>p.c==="prop").pts[0][1]+=3],["detached hand",fs=>fs[16].J.limbs.nA[2][1]-=3],["tilted shaft",fs=>fs.forEach(f=>f.parts.find(p=>p.c==="barshaft").pts[1][1]+=20)],["plate on pin",fs=>fs.forEach(f=>f.parts.find(p=>p.c==="plate").p[0]-=28)]]){const fs=JSON.parse(JSON.stringify(frames));mutate(fs);assert.throws(()=>check(fs),assert.AssertionError);console.log(`PASS rack pull guard rejects ${name}`)}
  ev("S=structuredClone(DEF)");assert.equal(ev("gRestDef('rackpull')"),150);ev("S.exCfg.rackpull={rest:123}");assert.equal(ev("gRestSec('rackpull')"),123);
  console.log("PASS rack pull preserves default and configured rest");
}finally{w.close()}}).catch(e=>{console.error(e);process.exitCode=1});
