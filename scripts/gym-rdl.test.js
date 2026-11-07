"use strict";
const assert=require("node:assert/strict"),{boot}=require("./html");
const angle=(a,b,c)=>{const u=a.map((v,i)=>v-b[i]),v=c.map((n,i)=>n-b[i]);return Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/Math.hypot(...u)/Math.hypot(...v))))*180/Math.PI};
boot().then(w=>{try{
  const ev=s=>w.eval(s),frames=ev("FigLib.sample(exDef(gEx('rdl')),128).map(p=>FigLib.frame(exDef(gEx('rdl')),p))");
  const ground=f=>{const p=f.parts.find(p=>p.c==='floor');return p.pts[0][1]-p.w/2},plate=f=>f.parts.find(p=>p.c==='plate'),gap=f=>ground(f)-plate(f).p[1]-plate(f).r-.8;
  function check(fs){
    const first=fs[0],mid=(fs.length-1)/2,last=fs.at(-1);
    assert.equal(first.J.pose.t,0,'standing-top start');assert.ok(fs[mid].J.pose.t>20,'torso hinges forward');
    assert.ok(fs[mid].J.hip[0]<first.J.hip[0]-3,'hips move backward');assert.ok(gap(fs[mid])<gap(first)-10,'load lowers from top');
    for(const [i,f] of fs.entries()){
      const p=plate(f),shaft=f.parts.find(p=>p.c==='barshaft'),wr=f.J.limbs.nA[2];
      assert.deepEqual(f.parts.find(p=>p.c==='floor'),first.parts.find(p=>p.c==='floor'),'fixed floor');assert.ok(!f.parts.some(p=>p.k==='rect'),'no mandatory deficit platform');
      for(const k of ['nL','fL']){
        const leg=f.J.limbs[k],flex=180-angle(...leg.slice(0,3));
        assert.ok(flex>1&&flex<35,'slightly bent schematic knees, never straight or deep squat');
        for(const n of [2,3]){assert.ok(Math.hypot(...leg[n].map((v,a)=>v-first.J.limbs[k][n][a]))<.001,'both feet fixed');assert.ok(Math.abs(leg[n][1]+1.7-ground(f))<.001,'both painted feet on floor')}
      }
      for(const part of f.parts.filter(p=>p.k==='line'&&p.c!=='floor'))for(const q of part.pts)assert.ok(q[1]+part.w/2<=ground(f)+.001,'whole painted chain includes calf round caps');
      assert.ok(gap(f)>-.001,'no floor penetration; no floor-touch required');
      assert.ok(shaft&&shaft.k==='line'&&shaft.w>0&&Number.isFinite(shaft.w)&&shaft.pts.length===2&&shaft.pts.flat().every(Number.isFinite),'finite visible shaft');
      assert.ok(Math.abs(shaft.pts[1][0]-shaft.pts[0][0]-31)<.001&&Math.abs(shaft.pts[1][1]-shaft.pts[0][1])<.001,'rigid horizontal shaft');
      assert.ok(Math.hypot(...p.p.map((v,a)=>v-shaft.pts[1][a]))<.001,'plate attached');
      assert.ok(Math.abs(wr[1]-shaft.pts[0][1])<.001&&wr[0]>=shaft.pts[0][0]&&wr[0]<=shaft.pts[1][0],'wrist holds shaft');
      const hip=f=>angle(f.J.neck,f.J.hip,f.J.limbs.nL[1]);
      assert.ok(hip(first)-hip(fs[mid])>20,'hip closes into hinge');
      if(i&&i<=mid){assert.ok(gap(f)<=gap(fs[i-1])+.001,'monotonic lower');assert.ok(hip(f)<=hip(fs[i-1])+.001,'hip closes during lower')}
      if(i>mid){assert.ok(gap(f)>=gap(fs[i-1])-.001,'monotonic return');assert.ok(hip(f)>=hip(fs[i-1])-.001,'hip opens during return')}
    }
    assert.deepEqual(first.parts,last.parts,'top return');
  }
  check(frames);console.log('PASS rdl top hinge and return with bent knees and full painted-ground support');
  for(const [name,mutate] of [['far calf width',fs=>fs[16].parts.filter(p=>p.k==='line'&&p.c==='far')[1].w=4.6],['near calf width',fs=>fs[16].parts.filter(p=>p.k==='line'&&p.c==='near')[0].w=4.2],['locked knee',fs=>fs[0].J.limbs.nL[1]=fs[0].J.limbs.nL[0].map((v,i)=>(v+fs[0].J.limbs.nL[2][i])/2)],['moving toe',fs=>fs[16].J.limbs.fL[3][0]+=2],['detached plate',fs=>plate(fs[16]).p[0]+=2],['detached wrist',fs=>fs[16].J.limbs.nA[2][1]+=2],['no lower',fs=>fs[64]=structuredClone(fs[0])],['no return',fs=>fs[128]=structuredClone(fs[64])],['moving floor',fs=>fs[16].parts.find(p=>p.c==='floor').pts[0][1]+=1],['short shaft',fs=>fs[16].parts.find(p=>p.c==='barshaft').pts[1][0]-=2],['tilted shaft',fs=>fs[16].parts.find(p=>p.c==='barshaft').pts[1][1]+=2]]){const f=JSON.parse(JSON.stringify(frames));mutate(f);assert.throws(()=>check(f),assert.AssertionError);console.log(`PASS rdl guard rejects ${name}`)}
  ev('S=structuredClone(DEF)');assert.equal(ev("gRestDef('rdl')"),150);for(const r of [0,123,600]){ev(`S.exCfg.rdl={rest:${r}}`);assert.equal(ev("gRestSec('rdl')"),r)}console.log('PASS rdl default150 and configured0/123/600 preserved');
  ev("S.workouts=[{id:11,day:'2026-11-01',t0:100,t1:200,name:'Geçmiş',tpl:null,ex:[{id:'rdl',note:'',sets:[{kg:40,reps:5,done:true}]}]}];S.templates=[{id:12,name:'Korunan',ex:['rdl'],tg:{rdl:{sets:3,reps:5}}}]");
  const stored=ev('JSON.stringify(cleanGym(S))');ev('Object.assign(S,cleanGym(S))');assert.equal(ev('JSON.stringify(cleanGym(S))'),stored);assert.equal(ev("gHistory('rdl')[0].sets[0].kg"),40);assert.equal(ev("S.templates[0].ex[0]"),'rdl');assert.equal(ev("gRestSec('rdl')"),600);console.log('PASS rdl history/template/config cleaner roundtrip');
}finally{w.close()}}).catch(e=>{console.error(e);process.exitCode=1});
