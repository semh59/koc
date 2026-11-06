"use strict";
const assert=require("node:assert/strict"),F=require("../www/modules/gym/figlib"),T=require("../www/modules/gym/figtpl");
function checkOnefoot(def){
  const frames=F.sample(def,48).map(p=>F.frame(def,p).J),anchor=frames[0].limbs.nL[2];
  for(const J of frames){
    const support=J.limbs.nL,free=J.limbs.fL;
    assert.ok(Math.hypot(support[2][0]-anchor[0],support[2][1]-anchor[1])<1e-6,"support ankle must stay fixed");
    assert.ok(Math.abs(support[2][1]-F.FLOOR)<1e-6&&Math.abs(support[3][1]-F.FLOOR)<1e-6,"support foot stays on floor");
    assert.ok(support.every((p,i)=>Math.hypot(p[0]-frames[0].limbs.nL[i][0],p[1]-frames[0].limbs.nL[i][1])<1e-6),"support leg remains still during hold");
    assert.ok(free[2][1]<F.FLOOR-8&&free[3][1]<F.FLOOR-8,"free foot stays raised throughout hold");
    const points=[J.hip,J.neck,J.head,...Object.values(J.limbs).flat()];
    assert.ok(points.every(p=>p.every(Number.isFinite)&&p[0]>=3&&p[0]<=157&&p[1]>=3&&p[1]<=147));
  }
}
function checkArmswalk(def){
  const poses=F.sample(def,48),frames=poses.map(p=>F.frame(def,p).J),half=24;
  const phase=J=>J.limbs.nL[2][0]-J.limbs.fL[2][0];
  assert.ok(phase(frames[0])*phase(frames[half])<0,"walking feet must exchange front/back order");
  for(const J of frames){
    for(const arm of [J.limbs.nA,J.limbs.fA])assert.ok(arm[2][1]>arm[0][1]+30&&Math.abs(arm[2][0]-arm[0][0])<4,"arms stay down beside torso");
    const points=[J.hip,J.neck,J.head,...Object.values(J.limbs).flat()];
    assert.ok(points.every(p=>p.every(Number.isFinite)&&p[0]>=3&&p[0]<=157&&p[1]>=3&&p[1]<=147));
    assert.ok(Math.abs(Math.max(...J.limbs.nL.concat(J.limbs.fL).map(p=>p[1]))-F.FLOOR)<.01,"walking maintains ground reference");
  }
}
function checkTandem(def){
  const frames=F.sample(def,48).map(p=>F.frame(def,p).J),start=frames[0];
  assert.equal(def.view||"s","s","tandem uses side view to show heel-to-toe contact");
  for(const J of frames){
    const front=J.limbs.nL,rear=J.limbs.fL;
    assert.ok(front[2][0]>rear[2][0]+8,"tandem ankles are in front/back order");
    assert.ok(Math.hypot(front[2][0]-rear[3][0],front[2][1]-rear[3][1])<.1,"front heel meets rear toe");
    for(const k of ["nL","fL"])for(const i of [2,3]){
      assert.ok(Math.abs(J.limbs[k][i][1]-F.FLOOR)<.01,"tandem feet remain grounded");
      assert.ok(Math.hypot(J.limbs[k][i][0]-start.limbs[k][i][0],J.limbs[k][i][1]-start.limbs[k][i][1])<1e-6,"tandem feet remain still");
    }
  }
}
checkTandem(T.tandem);
console.log("PASS tandem holds heel-to-toe stance with stationary grounded feet");
for(const [name,mutate] of [["side-by-side feet",d=>{for(const f of d.frames){f.m1=f.l1;f.m2=f.l2}}],["moving feet",d=>{d.frames[1].l1=20}],["front view",d=>{d.view="f"}]]){
  const def=structuredClone(T.tandem);mutate(def);assert.throws(()=>checkTandem(def),assert.AssertionError);console.log(`PASS tandem guard detects ${name}`);
}
checkArmswalk(T.balwalk2);
console.log("PASS armswalk alternates legs while keeping arms at sides");
for(const [name,mutate] of [["coincident legs",d=>{for(const f of d.frames){f.m1=f.l1;f.m2=f.l2;f.m3=f.l3}}],["swinging arms",d=>{d.frames[0].a1=90;d.frames[0].a2=90}]]){
  const def=structuredClone(T.balwalk2);mutate(def);assert.throws(()=>checkArmswalk(def),assert.AssertionError);console.log(`PASS armswalk guard detects ${name}`);
}
checkOnefoot(T.onefoot);
console.log("PASS onefoot keeps support foot planted and free foot raised for whole hold loop");
for(const [name,mutate] of [["two feet down",d=>{for(const f of d.frames){f.m1=f.l1;f.m2=f.l2}}],["moving support",d=>{d.frames[1].l1=35}],["old lifting anchor",d=>{d.frames=[{t:0,a1:30,a2:30},{t:0,a1:30,a2:30,l1:80,m1:0}] }]]){
  const def=structuredClone(T.onefoot);mutate(def);assert.throws(()=>checkOnefoot(def),assert.AssertionError);console.log(`PASS balance guard detects ${name}`);
}
