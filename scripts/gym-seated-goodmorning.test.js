"use strict";
const assert=require("node:assert/strict"),{boot,flush}=require("./html");
boot().then(async w=>{
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  try{
    ev("S=structuredClone(DEF);S.settings.obDone=true;tab='gym';render()");
    const record=ev("JSON.parse(JSON.stringify(gEx('seatedgm')))"),def=ev("exDef(gEx('seatedgm'))");
    assert.equal(def.scene,"seat","seated good morning must show actual seat, not standing hinge");
    const frames=ev("FigLib.sample(exDef(gEx('seatedgm')),48).map(p=>FigLib.frame(exDef(gEx('seatedgm')),p))");
    function check(fs){
      const first=fs[0],seat=first.parts.find(p=>p.k==='line'&&p.c==='prop'&&p.w===4);
      assert.ok(seat,"seat must exist");
      const scene=f=>JSON.stringify(f.parts.filter(p=>p.c==='prop'));
      assert.ok(fs[24].J.neck[0]>first.J.neck[0]+15&&fs[24].J.neck[1]>first.J.neck[1]+5,"torso hinges forward while seated");
      for(const f of fs){
        assert.equal(scene(f),scene(first),"seat geometry remains fixed");
        assert.ok(Math.hypot(f.J.hip[0]-first.J.hip[0],f.J.hip[1]-first.J.hip[1])<.01,"hip stays on seat");
        assert.ok(Math.abs(f.J.hip[1]-seat.pts[0][1])<.01&&f.J.hip[0]>=seat.pts[0][0]&&f.J.hip[0]<=seat.pts[1][0],"hip touches seat throughout hinge");
        for(const k of ['nL','fL'])for(const i of [2,3]){
          assert.ok(Math.abs(f.J.limbs[k][i][1]-136)<.01,"feet stay grounded");
          assert.ok(Math.hypot(...f.J.limbs[k][i].map((v,j)=>v-first.J.limbs[k][i][j]))<.01,"feet stay planted");
        }
        const plate=f.parts.find(p=>p.c==='plate');
        assert.ok(plate&&Math.hypot(plate.p[0]-f.J.neck[0],plate.p[1]-f.J.neck[1]-1)<.01,"load stays at shoulder, not wrist");
      }
    }
    check(frames);console.log("PASS seated good morning hinges with fixed seat contact, feet and shoulder load over 49 samples");
    for(const [name,change] of [['missing seat',fs=>fs.forEach(f=>f.parts=f.parts.filter(p=>p.c!=='prop'))],['moving hip',fs=>fs[12].J.hip[0]+=5],['moving foot',fs=>fs[12].J.limbs.fL[3][0]+=5],['no hinge',fs=>fs[24]=structuredClone(fs[0])],['wrist load',fs=>fs[12].parts.find(p=>p.c==='plate').p=[0,0]]]){
      const fs=JSON.parse(JSON.stringify(frames));change(fs);assert.throws(()=>check(fs),assert.AssertionError);console.log(`PASS seated good morning rejects ${name}`);
    }
    ev("exSheet('seatedgm')");const text=q('#sheet .cues').textContent;
    assert.ok(text.includes('Oturarak')&&text.includes('Barı üst sırtta')&&!text.includes('ağırlığı bacaklara yakın'));
    console.log("PASS seated good morning detail has seated shoulder-bar instructions");
    ev("closeSheet();S.templates=[{id:903,name:'Oturarak menteşe',ex:['seatedgm'],tg:{seatedgm:{sets:1,reps:5}}}];gdStart('t:903')");await flush();
    assert.ok(q('#guide .gdc').textContent.includes('Oturarak'));ev('gdEnd();gdClose()');
    console.log("PASS seated good morning guided mode receives seated instructions");
    assert.equal(record.tp,'seatedhinge');
    const metadata=require('../docs/analysis/gym-catalog-metadata.json').records.find(e=>e.id==='seatedgm');
    assert.deepEqual(metadata.cue_ids,['seatedhinge']);assert.equal(metadata.figure_template,record.tp);
    assert.equal(record.id,'seatedgm');assert.equal(record.pr,'bar@sh');
  }finally{w.close();}
}).catch(e=>{console.error(e);process.exitCode=1});
