"use strict";
const assert=require("node:assert/strict"),F=require("../www/modules/gym/figlib"),T=require("../www/modules/gym/figtpl");
function checkSidestep(def){
  assert.notEqual(def,T.legspread,"side step must not alias simultaneous leg spreading");
  assert.equal(def.view,"f");
  const frames=F.sample(def,64).map(p=>F.frame(def,p).J),leg=(i,k)=>frames[i].limbs[k];
  const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<.02,message);
  near(leg(0,"nL")[2][0],85,"initial right foot");near(leg(0,"fL")[2][0],75,"initial left foot");
  near(leg(16,"nL")[2][0],95,"leading foot steps outward first");near(leg(16,"fL")[2][0],75,"following foot waits");
  near(leg(32,"nL")[2][0],95,"leading foot waits");near(leg(32,"fL")[2][0],85,"following foot closes step");
  near(frames[32].hip[0]-frames[0].hip[0],10,"hip travels with the step");
  for(const [start,end,support,swing] of [[0,16,"fL","nL"],[16,32,"nL","fL"],[32,48,"nL","fL"],[48,64,"fL","nL"]]){
    const anchor=leg(start,support)[2];
    for(let i=start;i<=end;i++){
      for(const point of [2,3]){
        near(leg(i,support)[point][0],leg(start,support)[point][0],"stance foot stays fixed");
        near(leg(i,support)[point][1],F.FLOOR,"stance ankle and toe stay grounded");
      }
      near(leg(i,support)[2][0],anchor[0],"support does not slide");
    }
    for(const point of [2,3])assert.ok(leg((start+end)/2,swing)[point][1]<F.FLOOR-3,"swing foot clears ground");
  }
  for(const J of frames){
    assert.ok([J.hip,J.neck,J.head,...Object.values(J.limbs).flat()].every(p=>p.every(Number.isFinite)&&p[0]>=3&&p[0]<=157&&p[1]>=3&&p[1]<=147));
    assert.ok(J.limbs.nL[1][0]>J.limbs.fL[1][0],"knees do not cross in front view");
    for(const l of [J.limbs.nL,J.limbs.fL])for(const [a,b] of [[0,1],[1,2]])near(Math.hypot(l[a][0]-l[b][0],l[a][1]-l[b][1]),24,"leg bone length");
  }
  for(const k of ["nL","fL"])for(let p=0;p<4;p++)for(let axis=0;axis<2;axis++)near(leg(0,k)[p][axis],leg(64,k)[p][axis],"loop closes");
}
function checkRenderedContact(def){
  const paths=[...F.svg(def).matchAll(/<path class="fg-(near|far)"[^>]*>[\s\S]*?<\/path>/g)];
  const values=path=>path[0].match(/values="([^"]+)"/)[1].split(";").map(d=>d.match(/-?\d+(?:\.\d+)?/g).map(Number));
  const n=values(paths.find(p=>p[1]==="near")),f=values(paths.filter(p=>p[1]==="far")[1]);
  for(let i=0;i<=128;i++){
    const u=i/128*(n.length-1),a=Math.min(n.length-2,Math.floor(u)),t=u-a;
    const point=v=>[v[a][4]+(v[a+1][4]-v[a][4])*t,v[a][5]+(v[a+1][5]-v[a][5])*t];
    const near=point(n),far=point(f),phase=Math.min(3,Math.floor(i/32)),support=[far,near,near,far][phase];
    assert.ok(Math.abs(support[1]-136)<.02,"rendered support stays grounded across contact transitions");
    assert.ok(Math.abs(support[0]-[75,95,95,75][phase])<.02,"rendered support stays fixed");
  }
}
checkSidestep(T.sidestep);
checkRenderedContact(T.sidestep);
assert.throws(()=>checkRenderedContact({...T.sidestep,samples:14}),assert.AssertionError);
console.log("PASS side step SVG guard rejects sampling that skips contact phases");
console.log("PASS side step SVG retains fixed grounded support between sampled poses");
console.log("PASS side step leads then follows with fixed support and lifted swing in both directions");
for(const [name,mutate] of [
  ["simultaneous spreading",d=>Object.assign(d,structuredClone(T.legspread))],
  ["sliding support",d=>{d.frames[1].feet[1][0]-=3}],
  ["no swing clearance",d=>{for(const f of d.frames)for(const foot of f.feet)foot[1]=0}],
  ["stationary hip",d=>{for(const f of d.frames)f.dx=0}],
  ["missing follow step",d=>{for(const f of d.frames)f.feet[1]=[-5,0]}]
]){
  const def=structuredClone(T.sidestep);mutate(def);assert.throws(()=>checkSidestep(def),assert.AssertionError);console.log(`PASS side step guard detects ${name}`);
}
