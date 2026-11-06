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
checkOnefoot(T.onefoot);
console.log("PASS onefoot keeps support foot planted and free foot raised for whole hold loop");
for(const [name,mutate] of [["two feet down",d=>{for(const f of d.frames){f.m1=f.l1;f.m2=f.l2}}],["moving support",d=>{d.frames[1].l1=35}],["old lifting anchor",d=>{d.frames=[{t:0,a1:30,a2:30},{t:0,a1:30,a2:30,l1:80,m1:0}] }]]){
  const def=structuredClone(T.onefoot);mutate(def);assert.throws(()=>checkOnefoot(def),assert.AssertionError);console.log(`PASS balance guard detects ${name}`);
}
