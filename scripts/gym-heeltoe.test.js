"use strict";
const assert=require("node:assert/strict"),F=require("../www/modules/gym/figlib"),T=require("../www/modules/gym/figtpl");
function checkHeeltoe(def){
  assert.equal(def.playback,"once","heeltoe must show forward steps once, not reverse walking");
  const js=F.sample(def,128).map(p=>F.frame(def,p).J),near=(a,b,msg)=>assert.ok(Math.abs(a-b)<.02,msg);
  const contact=J=>{
    const [rear,front]=[J.limbs.nL,J.limbs.fL].sort((a,b)=>a[2][0]-b[2][0]);
    near(front[2][0],rear[3][0],"front heel meets rear toe");
    for(const l of [rear,front])for(const i of [2,3])near(l[i][1],136,"contact feet grounded");
  };
  for(const i of [0,64,128])contact(js[i]);
  near(js[64].limbs.nL[2][0],93.5,"first foot lands ahead");near(js[128].limbs.fL[2][0],102.5,"second foot lands ahead");
  near(js[128].hip[0]-js[0].hip[0],18,"pelvis travels forward with two steps");
  for(const [start,end,support,swing] of [[0,64,"fL","nL"],[64,128,"nL","fL"]]){
    for(let i=start;i<=end;i++)for(const p of [2,3]){
      near(js[i].limbs[support][p][0],js[start].limbs[support][p][0],"stance foot does not slide");
      near(js[i].limbs[support][p][1],136,"stance foot stays on floor");
    }
    for(const p of [2,3])assert.ok(js[(start+end)/2].limbs[swing][p][1]<129,"swing clears support foot");
    for(let i=start+1;i<=end;i++)assert.ok(js[i].limbs[swing][2][0]>=js[i-1].limbs[swing][2][0]-.001,"swing never steps backwards");
  }
  for(const J of js){
    assert.ok([J.hip,J.neck,J.head,...Object.values(J.limbs).flat()].every(p=>p.every(Number.isFinite)&&p[0]>=3&&p[0]<=157&&p[1]>=3&&p[1]<=147),"finite in viewBox");
    for(const l of [J.limbs.nL,J.limbs.fL])for(const [a,b] of [[0,1],[1,2]])near(Math.hypot(l[a][0]-l[b][0],l[a][1]-l[b][1]),24,"leg bone length");
  }
  const svg=F.svg(def),animations=[...svg.matchAll(/<animate\b[^>]*>/g)].map(m=>m[0]);
  assert.ok(animations.length>0&&animations.every(s=>s.includes('repeatCount="1"')&&s.includes('fill="freeze"')),"all SVG channels finish and hold without rewind");
  assert.ok(!F.svg(def,{anim:false}).includes("<animate"));
}
checkHeeltoe(T.balwalk);console.log("PASS heeltoe takes two forward steps with planted support and heel-to-toe contacts then holds");
for(const [name,mutate] of [
  ["reverse loop",d=>{delete d.playback}],
  ["overlapping feet",d=>{for(const f of d.frames)f.feet[0]=f.feet[1].slice()}],
  ["sliding support",d=>{d.frames[1].feet[1][0]+=2}],
  ["missing swing clearance",d=>{for(const f of d.frames)for(const foot of f.feet)foot[1]=0}],
  ["wrong contact spacing",d=>{d.frames[4].feet[0][0]+=2}],
  ["no forward pelvis",d=>{for(const f of d.frames)f.dx=0}]
]){const d=structuredClone(T.balwalk);mutate(d);assert.throws(()=>checkHeeltoe(d),assert.AssertionError);console.log(`PASS heeltoe guard detects ${name}`)}
