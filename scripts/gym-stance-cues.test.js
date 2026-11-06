"use strict";
const assert=require("node:assert/strict"),{boot,flush}=require("./html");
boot().then(async w=>{
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  try{
  ev("S=structuredClone(DEF);S.settings.obDone=true;tab='gym';render()");
  for(const [id,expected] of [["widesquat","omuz genişliğinden daha geniş"],["narrowsquat","omuz genişliğinden daha dar"]]){
    ev(`exSheet('${id}')`);
    assert.ok(q("#sheet .cues").textContent.includes(expected),`${id} detail needs stance-specific cue`);
    assert.ok(q("#sheet .cues").textContent.includes("genel squat"),"shared side figure must not claim to show stance width");
    console.log(`PASS ${id} detail explains stance and general figure limitation`);
    ev(`closeSheet();S.templates=[{id:901,name:'Duruş testi',ex:['${id}'],tg:{${id}:{sets:1,reps:5}}}];gdStart('t:901')`);await flush();
    assert.ok(q("#guide .gdc").textContent.includes(expected),`${id} guided cue must match detail`);
    ev("gdEnd();gdClose()");
    console.log(`PASS ${id} guided mode uses same stance-specific cue`);
  }
  for(const id of ["goodmorning","stiffgm"]){
    assert.equal(ev(`gEx('${id}').pr`),"bar@sh");ev(`exSheet('${id}')`);
    const text=q("#sheet .cues").textContent;
    assert.ok(text.includes("Barı üst sırtta")&&!text.includes("ağırlığı bacaklara yakın"),`${id} shoulder bar must not receive hand-held load cue`);
    console.log(`PASS ${id} detail matches shoulder-loaded bar`);
    ev(`closeSheet();S.templates=[{id:902,name:'Menteşe testi',ex:['${id}'],tg:{${id}:{sets:1,reps:5}}}];gdStart('t:902')`);await flush();
    assert.ok(q("#guide .gdc").textContent.includes("Barı üst sırtta"));ev("gdEnd();gdClose()");
    console.log(`PASS ${id} guided cue matches shoulder-loaded detail`);
  }
  assert.equal(ev("exCues(gEx('deadlift'))[0]"),ev("EXCUE.hinge[0]"));
  console.log("PASS hand-held deadlift retains hinge cue");
  assert.equal(ev("exCues(gEx('squat'))[0]"),ev("EXCUE.squat[0]"));
  assert.equal(ev("exCues({id:'custom_stance',tp:'squat'})[0]"),ev("EXCUE.squat[0]"));
  assert.equal(ev("exCues({id:'toString',tp:'missing'}).length"),0);
  console.log("PASS ordinary and custom squat retain template cues; inherited IDs cannot select override");
  }finally{w.close();}
}).catch(e=>{console.error(e);process.exitCode=1});
