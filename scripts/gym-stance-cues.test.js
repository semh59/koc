"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),{boot,flush}=require("./html");
function checkInheritedCues(resolve){
  const general=Array.from(resolve({id:"custom_walk",tp:"walk"}));
  for(const id of ["toString","constructor","__proto__"]){
    const fallback=resolve({id,tp:"walk"}),empty=resolve({id,tp:"missing"}),template=resolve({id:"custom_walk",tp:id});
    assert.ok(Array.isArray(fallback)&&Array.isArray(empty)&&Array.isArray(template),"cue resolver must return arrays, never inherited functions or objects");
    assert.deepEqual(Array.from(fallback),general,"inherited ID must retain template fallback");
    assert.deepEqual(Array.from(empty),[]);assert.deepEqual(Array.from(template),[]);
  }
}
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
  for(const [id,phrase] of [["fastwalk","Tempolu yürü"],["slowwalk","Yavaş ve rahat yürü"]]){
    ev(`exSheet('${id}')`);
    const text=q("#sheet .cues").textContent;
    assert.ok(text.includes(phrase)&&text.includes("Animasyon hız hedefi göstermez"),`${id} detail needs tempo cue and animation limitation`);
    console.log(`PASS ${id} detail explains tempo and animation limitation`);
    ev(`closeSheet();S.templates=[{id:904,name:'Yürüyüş testi',ex:['${id}'],tg:{${id}:{sets:1,reps:5}}}];gdStart('t:904')`);await flush();
    const guided=q("#guide .gdc").textContent;
    assert.ok(guided.includes(phrase)&&guided.includes("Animasyon hız hedefi göstermez"),`${id} guided needs same tempo and limitation`);
    ev("gdEnd();gdClose()");console.log(`PASS ${id} guided mode explains tempo and animation limitation`);
  }
  assert.equal(ev("exCues({id:'custom_walk',tp:'walk'})[0]"),ev("EXCUE.walk[0]"));
  console.log("PASS custom walking retains general template cue");
  assert.equal(ev("exCues(gEx('deadlift'))[0]"),ev("EXCUE.hinge[0]"));
  console.log("PASS hand-held deadlift retains hinge cue");
  assert.equal(ev("exCues(gEx('squat'))[0]"),ev("EXCUE.squat[0]"));
  assert.equal(ev("exCues({id:'custom_stance',tp:'squat'})[0]"),ev("EXCUE.squat[0]"));
  console.log("PASS ordinary and custom squat retain template cues");
  checkInheritedCues(e=>ev(`exCues(${JSON.stringify(e)})`));
  console.log("PASS inherited IDs and templates return arrays with correct fallback");
  const source=fs.readFileSync(require.resolve("../www/modules/gym/excues.js"),"utf8");
  for(const table of ["EXCUE_BY_ID","EXCUE"]){
    const guard=`Object.hasOwn(${table},e.${table==="EXCUE_BY_ID"?"id":"tp"})`;
    assert.ok(source.includes(guard),"mutation must replace existing guard");
    const mutant=vm.runInNewContext(source.replace(guard,`${table}[e.${table==="EXCUE_BY_ID"?"id":"tp"}]`)+"\nexCues");
    assert.throws(()=>checkInheritedCues(mutant),assert.AssertionError);
    console.log(`PASS inherited cue guard detects missing ${table} own-property check`);
  }
  }finally{w.close();}
}).catch(e=>{console.error(e);process.exitCode=1});
