"use strict";
const assert=require("node:assert/strict"),{boot}=require("./html");
const angle=(a,b,c)=>{const u=a.map((v,i)=>v-b[i]),v=c.map((n,i)=>n-b[i]);return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI};
boot().then(w=>{try{
  const ev=s=>w.eval(s),frames=ev("FigLib.sample(exDef(gEx('deadlift')),128).map(p=>FigLib.frame(exDef(gEx('deadlift')),p))");
  function check(fs){
    const floor=f=>f.parts.find(p=>p.c==="floor"),plate=f=>f.parts.find(p=>p.c==="plate"),shaft=f=>f.parts.find(p=>p.c==="barshaft");
    const ground=f=>floor(f).pts[0][1]-floor(f).w/2,gap=f=>ground(f)-plate(f).p[1]-plate(f).r-.8;
    for(const f of [fs[0],fs[128]])assert.ok(Math.abs(gap(f))<.02,"deadlift load starts and returns on painted ground");
    assert.ok(gap(fs[64])>15,"deadlift load rises from floor");
    for(const k of ["nL","fL"]){assert.ok(angle(fs[64].J.neck,fs[64].J.hip,fs[64].J.limbs[k][1])-angle(fs[0].J.neck,fs[0].J.hip,fs[0].J.limbs[k][1])>20,"net hip extension");assert.ok(angle(...fs[64].J.limbs[k].slice(0,3))-angle(...fs[0].J.limbs[k].slice(0,3))>10,"net knee extension")}
    for(let i=0;i<fs.length;i++){
      const f=fs[i],J=f.J,p=plate(f),bar=shaft(f),wrist=J.limbs.nA[2];
      assert.deepEqual(floor(f),floor(fs[0]),"floor fixed");assert.ok(!f.parts.some(p=>p.k==="rect"),"ordinary deadlift has no foot platform");
      assert.ok(bar&&bar.k==="line"&&Number.isFinite(bar.w)&&bar.w>0&&bar.pts.length===2&&bar.pts.flat().every(Number.isFinite),"finite shaft");
      assert.ok(Math.abs(bar.pts[0][1]-bar.pts[1][1])<.001&&Math.abs(bar.pts[1][0]-bar.pts[0][0]-31)<.001,"horizontal rigid shaft");
      assert.ok(Math.hypot(p.p[0]-bar.pts[1][0],p.p[1]-bar.pts[1][1])<.001,"plate linked to shaft");
      assert.ok(Math.abs(wrist[1]-bar.pts[0][1])<.001&&wrist[0]>=bar.pts[0][0]&&wrist[0]<=bar.pts[1][0],"hand holds shaft");
      assert.ok(gap(f)>-.02,"load above floor");
      for(const part of f.parts.filter(p=>p.k==="line"&&p.c!=="floor"))assert.ok(part.pts.every(q=>q[1]+part.w/2<=ground(f)+.02),"every painted limb and shaft stays above floor, including round caps");
      for(const k of ["nL","fL"])for(const n of [2,3]){const foot=J.limbs[k][n],start=fs[0].J.limbs[k][n];assert.ok(Math.hypot(...foot.map((v,a)=>v-start[a]))<.02&&Math.abs(foot[1]+1.7-ground(f))<.02,"both full feet planted on painted ground")}
      if(i>0&&i<=64){const prev=fs[i-1].J;assert.ok(gap(f)>=gap(fs[i-1])-.001,"load rises monotonically");for(const k of ["nL","fL"]){assert.ok(angle(J.neck,J.hip,J.limbs[k][1])>=angle(prev.neck,prev.hip,prev.limbs[k][1])-.001,"hip opens throughout lift");assert.ok(angle(...J.limbs[k].slice(0,3))>=angle(...prev.limbs[k].slice(0,3))-.001,"knee opens throughout lift")}}
      if(i>64)assert.ok(gap(f)<=gap(fs[i-1])+.001,"load lowers monotonically");
    }
    assert.deepEqual(fs[0].parts,fs[128].parts,"floor pull returns to start");
  }
  check(frames);console.log("PASS deadlift grounded start and return with fixed feet and extending hip/knees");
  for(const [name,mutate] of [["floating start",fs=>fs[0].parts.find(p=>p.c==="plate").p[1]-=3],["no lift",fs=>fs[64]=structuredClone(fs[0])],["moving foot",fs=>fs[16].J.limbs.fL[3][0]+=3],["detached plate",fs=>fs[16].parts.find(p=>p.c==="plate").p[0]+=4],["short shaft",fs=>fs[16].parts.find(p=>p.c==="barshaft").pts[0][0]+=3],["tilted shaft",fs=>fs[16].parts.find(p=>p.c==="barshaft").pts[1][1]+=3],["missing return",fs=>fs[128]=structuredClone(fs[64])],["moving floor",fs=>fs[16].parts.find(p=>p.c==="floor").pts[0][1]+=1],["detached hand",fs=>fs[16].J.limbs.nA[2][1]-=3],["far calf round cap",fs=>fs[16].parts.filter(p=>p.k==="line"&&p.c==="far")[1].w=4.6],["near calf round cap",fs=>fs[16].parts.filter(p=>p.k==="line"&&p.c==="near")[0].w=4.2]]){const fs=JSON.parse(JSON.stringify(frames));mutate(fs);assert.throws(()=>check(fs),assert.AssertionError);console.log(`PASS deadlift guard rejects ${name}`)}
  ev("S=structuredClone(DEF)");assert.equal(ev("gRestDef('deadlift')"),150);for(const rest of [0,123,600]){ev(`S.exCfg.deadlift={rest:${rest}}`);assert.equal(ev("gRestSec('deadlift')"),rest)}console.log("PASS deadlift default and configured rest preserved");
  ev("S.workouts=[{id:11,day:'2026-11-01',t0:100,t1:200,name:'Geçmiş',tpl:null,ex:[{id:'deadlift',note:'',sets:[{kg:40,reps:5,done:true}]}]}];S.templates=[{id:12,name:'Korunan',ex:['deadlift'],tg:{deadlift:{sets:3,reps:5}}}]");
  const stored=ev("JSON.stringify(cleanGym(S))");ev("Object.assign(S,cleanGym(S))");assert.equal(ev("JSON.stringify(cleanGym(S))"),stored);assert.equal(ev("gHistory('deadlift')[0].sets[0].kg"),40);assert.equal(ev("S.templates[0].ex[0]"),"deadlift");assert.equal(ev("gRestSec('deadlift')"),600);console.log("PASS deadlift history templates configuration cleaner roundtrip");
}finally{w.close()}}).catch(e=>{console.error(e);process.exitCode=1});
