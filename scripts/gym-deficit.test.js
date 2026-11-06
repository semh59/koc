"use strict";
const assert=require("node:assert/strict"),{boot}=require("./html");
const angle=(a,b,c)=>{const u=a.map((v,i)=>v-b[i]),v=c.map((n,i)=>n-b[i]);return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI};
boot().then(w=>{try{
  const ev=s=>w.eval(s),def=ev("exDef(gEx('defdl'))");
  assert.equal(def.scene,"deficit","defdl must show platform, not generic hinge");
  const frames=ev("FigLib.sample(exDef(gEx('defdl')),128).map(p=>FigLib.frame(exDef(gEx('defdl')),p))");
  function check(fs){
    const platform=fs[0].parts.find(p=>p.k==="rect"&&p.c==="prop");assert.ok(platform,"platform exists");
    const floor=fs[0].parts.find(p=>p.c==="floor"),ground=floor.pts[0][1]-floor.w/2,top=platform.y-1;
    const plate=f=>f.parts.find(p=>p.c==="plate"),shaft=f=>f.parts.find(p=>p.c==="barshaft"),gap=f=>ground-plate(f).p[1]-plate(f).r-.8;
    for(const f of [fs[0],fs[128]]){
      assert.ok(Math.abs(gap(f))<.02,"load starts and returns on painted ground");
      assert.ok(shaft(f).pts[0][1]>top+1,"starting bar lies below elevated foot support");
    }
    assert.ok(gap(fs[64])>15,"load lifts from ground");
    for(const k of ["nL","fL"]){
      assert.ok(angle(fs[64].J.neck,fs[64].J.hip,fs[64].J.limbs[k][1])-angle(fs[0].J.neck,fs[0].J.hip,fs[0].J.limbs[k][1])>20,"net hip extension");
      assert.ok(angle(...fs[64].J.limbs[k].slice(0,3))-angle(...fs[0].J.limbs[k].slice(0,3))>20,"net knee extension");
    }
    for(let i=0;i<fs.length;i++){
      const f=fs[i],p=plate(f),bar=shaft(f),J=f.J;
      assert.deepEqual(f.parts.find(p=>p.k==="rect"),platform,"platform fixed");
      assert.ok(gap(f)>-.02,"load never sinks under ground");
      assert.ok(bar&&bar.k==="line"&&bar.w>0&&bar.pts.flat().every(Number.isFinite)&&Math.abs(bar.pts[0][1]-bar.pts[1][1])<.001,"shaft finite horizontal");
      for(const k of ["nL","fL"]){
        const l=J.limbs[k];
        for(const n of [2,3]){
          assert.ok(Math.abs(l[n][1]+1.7-top)<.02&&l[n][0]-1.7>=platform.x+2&&l[n][0]+1.7<=platform.x+platform.w-2,"feet rest on platform surface");
          assert.ok(Math.hypot(...l[n].map((v,a)=>v-fs[0].J.limbs[k][n][a]))<.02,"feet fixed on platform");
        }
      }
      assert.deepEqual(f.parts.find(p=>p.c==="floor"),floor,"floor fixed");
      assert.ok(Math.abs(bar.pts[1][0]-bar.pts[0][0]-31)<.001,"shaft rigid length");
      assert.ok(Math.hypot(p.p[0]-bar.pts[1][0],p.p[1]-bar.pts[1][1])<.001,"plate attached to outer shaft");
      const wrist=J.limbs.nA[2];assert.ok(Math.abs(bar.pts[0][1]-wrist[1])<.02&&bar.pts[0][0]<=wrist[0]&&bar.pts[1][0]>=wrist[0],"hand holds shaft");
      const x=Math.max(platform.x-1,Math.min(platform.x+platform.w+1,p.p[0])),y=Math.max(platform.y-1,Math.min(platform.y+platform.h+1,p.p[1]));
      assert.ok(Math.hypot(p.p[0]-x,p.p[1]-y)-p.r-.8>0,"plate clears platform");
      if(bar.pts[0][1]+bar.w/2>top)assert.ok(Math.min(...bar.pts.map(p=>p[0]))-bar.w/2>platform.x+platform.w+1,"lower shaft clears platform");
      if(i>0&&i<=64){
        const prev=fs[i-1].J;
        for(const k of ["nL","fL"]){
          assert.ok(angle(J.neck,J.hip,J.limbs[k][1])>=angle(prev.neck,prev.hip,prev.limbs[k][1])-.001,"hip opens throughout lift");
          assert.ok(angle(...J.limbs[k].slice(0,3))>=angle(...prev.limbs[k].slice(0,3))-.001,"knee opens throughout lift");
        }
        assert.ok(gap(f)>=gap(fs[i-1])-.001,"load rises without initial drop");
      }
    }
    for(let i=65;i<fs.length;i++)assert.ok(gap(fs[i])<=gap(fs[i-1])+.001,"load lowers back to ground");
    assert.deepEqual(fs[0].parts,fs[128].parts,"loop returns to grounded start");
  }
  check(frames);console.log("PASS deficit lift has elevated planted feet, grounded load and opening hip/knees");
  for(const [name,mutate] of [["missing platform",fs=>fs.forEach(f=>f.parts=f.parts.filter(p=>p.k!=="rect"))],["floating load",fs=>fs[0].parts.find(p=>p.c==="plate").p[1]-=3],["moving foot",fs=>fs[16].J.limbs.fL[3][0]+=3],["no lift",fs=>fs[64]=structuredClone(fs[0])],["detached plate",fs=>fs[16].parts.find(p=>p.c==="plate").p[0]+=4],["short shaft",fs=>fs[16].parts.find(p=>p.c==="barshaft").pts[0][0]+=3],["tilted shaft",fs=>fs[16].parts.find(p=>p.c==="barshaft").pts[1][1]+=3],["decorative platform",fs=>fs.forEach(f=>f.parts.find(p=>p.k==="rect").y+=3)],["load on platform",fs=>fs[0].parts.find(p=>p.c==="plate").p[1]-=12.3],["missing return",fs=>fs[128]=structuredClone(fs[64])],["moving floor",fs=>fs[16].parts.find(p=>p.c==="floor").pts[0][1]+=1]]){const fs=JSON.parse(JSON.stringify(frames));mutate(fs);assert.throws(()=>check(fs),assert.AssertionError);console.log(`PASS deficit guard rejects ${name}`)}
  ev("S=structuredClone(DEF)");assert.equal(ev("gRestDef('defdl')"),150);
  for(const rest of [0,123,600]){ev(`S.exCfg.defdl={rest:${rest}}`);assert.equal(ev("gRestSec('defdl')"),rest)}
  console.log("PASS deficit default and configured rest preserved");
  ev("S.workouts=[{id:11,day:'2026-11-01',t0:100,t1:200,name:'Geçmiş',tpl:null,ex:[{id:'defdl',note:'',sets:[{kg:40,reps:5,done:true}]}]}];S.templates=[{id:12,name:'Korunan',ex:['defdl'],tg:{defdl:{sets:3,reps:5}}}]");
  const stored=ev("JSON.stringify(cleanGym(S))");ev("Object.assign(S,cleanGym(S))");assert.equal(ev("JSON.stringify(cleanGym(S))"),stored);
  assert.equal(ev("gHistory('defdl')[0].sets[0].kg"),40);assert.equal(ev("S.templates[0].ex[0]"),"defdl");assert.equal(ev("gRestSec('defdl')"),600);
  console.log("PASS deficit ID history, templates and configuration survive cleaner roundtrip");
}finally{w.close()}}).catch(e=>{console.error(e);process.exitCode=1});
