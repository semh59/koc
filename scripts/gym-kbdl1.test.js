"use strict";
const assert=require("node:assert/strict"),{boot}=require("./html");
const angle=(a,b,c)=>{const u=a.map((v,i)=>v-b[i]),v=c.map((n,i)=>n-b[i]);return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI};
boot().then(w=>{try{
  const ev=s=>w.eval(s),frames=ev("FigLib.sample(exDef(gEx('kbdl1')),128).map(p=>FigLib.frame(exDef(gEx('kbdl1')),p))");
  const ground=f=>{const p=f.parts.find(p=>p.c==='floor');return p.pts[0][1]-p.w/2},plate=f=>f.parts.find(p=>p.c==='plate'),gap=f=>ground(f)-plate(f).p[1]-plate(f).r-.8;
  function check(fs){
    const first=fs[0],mid=(fs.length-1)/2,last=fs.at(-1);
    assert.equal(first.J.pose.t,0,'standing-top start');assert.ok(fs[mid].J.pose.t>20,'torso hinges forward');
    assert.ok(fs[mid].J.hip[0]<first.J.hip[0]-3,'hips move backward');assert.ok(gap(fs[mid])<gap(first)-10,'load lowers from top');
    const sup=first.J.limbs.nL,free=first.J.limbs.fL;
    assert.ok(Math.hypot(sup[2][0]-free[2][0],sup[2][1]-free[2][1])>2,'free ankle separate from support ankle at start');
    assert.ok(fs[mid].J.limbs.fL[2][0]<first.J.limbs.fL[2][0]-15,'free leg extends backward at peak hinge');
    assert.ok(fs[mid].J.limbs.fL[2][1]<first.J.limbs.fL[2][1]-15,'free leg raises upward as counterbalance');
    for(const [i,f] of fs.entries()){
      const p=plate(f),wr=f.J.limbs.nA[2],legN=f.J.limbs.nL,legF=f.J.limbs.fL;
      assert.deepEqual(f.parts.find(p=>p.c==='floor'),first.parts.find(p=>p.c==='floor'),'fixed floor');
      assert.ok(!f.parts.some(p=>p.k==='rect'),'no deficit platform');
      const flex=180-angle(...legN.slice(0,3));
      assert.ok(flex>1&&flex<35,'support knee slightly bent, neither locked nor deep squat');
      for(const n of [2,3]){
        assert.ok(Math.hypot(...legN[n].map((v,a)=>v-first.J.limbs.nL[n][a]))<.001,'support foot fixed on floor');
        assert.ok(Math.abs(legN[n][1]+1.7-ground(f))<.001,'support painted foot on floor');
      }
      assert.ok(legF[2][1]+1.7<ground(f)-2,'free ankle remains raised off ground throughout loop');
      for(const part of f.parts.filter(p=>p.k==='line'&&p.c!=='floor'))for(const q of part.pts)assert.ok(q[1]+part.w/2<=ground(f)+.001,'whole painted chain stays above ground');
      assert.ok(gap(f)>-.001,'kettlebell above ground');
      assert.equal(f.parts.filter(p=>p.k==='line'&&p.c==='near')[0].w,3.4,'support leg width is 3.4');
      assert.equal(f.parts.filter(p=>p.k==='line'&&p.c==='far')[1].w,3.4,'free leg width is 3.4');
      assert.ok(p&&p.k==='circle'&&Math.abs(p.p[0]-wr[0])<.001&&Math.abs(p.p[1]-(wr[1]+4))<.001,'kettlebell attached to wrist');
      const hip=f=>angle(f.J.neck,f.J.hip,f.J.limbs.nL[1]);
      if(i&&i<=mid){assert.ok(gap(f)<=gap(fs[i-1])+.001,'monotonic lower');assert.ok(hip(f)<=hip(fs[i-1])+.001,'hip closes into hinge')}
      if(i>mid){assert.ok(gap(f)>=gap(fs[i-1])-.001,'monotonic return');assert.ok(hip(f)>=hip(fs[i-1])-.001,'hip opens on return')}
    }
    assert.deepEqual(first.parts,last.parts,'top return');
  }
  check(frames);console.log('PASS kbdl1 single-leg hinge with planted support foot and raised counterbalance leg');
  for(const [name,mutate] of [
    ['two feet planted',fs=>fs.forEach(f=>{f.J.limbs.fL[2]=[...f.J.limbs.nL[2]];f.J.limbs.fL[3]=[...f.J.limbs.nL[3]]})],
    ['locked support knee',fs=>fs[0].J.limbs.nL[1]=fs[0].J.limbs.nL[0].map((v,i)=>(v+fs[0].J.limbs.nL[2][i])/2)],
    ['moving support foot',fs=>fs[16].J.limbs.nL[3][0]+=2],
    ['free leg not raising',fs=>fs[64].J.limbs.fL[2][1]=fs[0].J.limbs.fL[2][1]],
    ['free leg not extending back',fs=>fs[64].J.limbs.fL[2][0]=fs[0].J.limbs.fL[2][0]],
    ['detached kb',fs=>plate(fs[16]).p[0]+=3],
    ['no lower',fs=>fs[64]=structuredClone(fs[0])],
    ['no return',fs=>fs[128]=structuredClone(fs[64])],
    ['far calf width',fs=>fs[16].parts.filter(p=>p.k==='line'&&p.c==='far')[1].w=4.6],
    ['near calf width',fs=>fs[16].parts.filter(p=>p.k==='line'&&p.c==='near')[0].w=4.2],
    ['moving floor',fs=>fs[16].parts.find(p=>p.c==='floor').pts[0][1]+=1]
  ]){const f=JSON.parse(JSON.stringify(frames));mutate(f);assert.throws(()=>check(f),assert.AssertionError);console.log(`PASS kbdl1 guard rejects ${name}`)}
  ev('S=structuredClone(DEF)');assert.equal(ev("gRestDef('kbdl1')"),150);for(const r of [0,123,600]){ev(`S.exCfg.kbdl1={rest:${r}}`);assert.equal(ev("gRestSec('kbdl1')"),r)}console.log('PASS kbdl1 default150 and configured0/123/600 preserved');
  ev("S.workouts=[{id:11,day:'2026-11-01',t0:100,t1:200,name:'Geçmiş',tpl:null,ex:[{id:'kbdl1',note:'',sets:[{kg:16,reps:8,done:true}]}]}];S.templates=[{id:12,name:'Korunan',ex:['kbdl1'],tg:{kbdl1:{sets:3,reps:8}}}]");
  const stored=ev('JSON.stringify(cleanGym(S))');ev('Object.assign(S,cleanGym(S))');assert.equal(ev('JSON.stringify(cleanGym(S))'),stored);assert.equal(ev("gHistory('kbdl1')[0].sets[0].kg"),16);assert.equal(ev("S.templates[0].ex[0]"),'kbdl1');assert.equal(ev("gRestSec('kbdl1')"),600);console.log('PASS kbdl1 history/template/config cleaner roundtrip');
}finally{w.close()}}).catch(e=>{console.error(e);process.exitCode=1});
