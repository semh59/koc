"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),{boot,flush}=require("./html");
function checkRackCue(text){
  assert.ok(text.includes("yükseltilmiş desteklerden")&&text.includes("Çizim şematik bir yükseklik örneğidir; kişisel ayar önerisi değildir"),"rack pull must distinguish raised support and schematic height limitation");
  assert.ok(text.includes("kontrollü kaldır")&&text.includes("kalça ve dizlerini açarak doğrul")&&text.includes("desteklere kontrollü geri bırak"),"rack pull first cue must include controlled lift, hip/knee extension and return to supports");
}
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
  ev("exSheet('heeltoe')");
  assert.ok(q("#sheet .cues").textContent.includes("İki ileri adım gösterilir, sonra durur"),"heeltoe detail must explain one-shot playback");
  assert.ok(q("#sheet .cues").textContent.includes("topuğunu diğerinin parmak ucuna"));
  ev("closeSheet();S.templates=[{id:906,name:'Temas testi',ex:['heeltoe'],tg:{heeltoe:{sets:1,reps:5}}}];gdStart('t:906')");await flush();
  assert.ok(q("#guide .gdc").textContent.includes("İki ileri adım gösterilir, sonra durur"),"heeltoe guide must explain one-shot playback");
  ev("gdEnd();gdClose()");console.log("PASS heeltoe detail and guide explain forward demonstration stops after two steps");
  assert.equal(ev("exCues({id:'custom_walk',tp:'walk'})[0]"),ev("EXCUE.walk[0]"));
  console.log("PASS custom walking retains general template cue");
  ev("exSheet('rackpull')");
  const rackText=q("#sheet .cues").textContent;
  checkRackCue(rackText);
  ev("closeSheet();S.templates=[{id:907,name:'Destekli çekiş testi',ex:['rackpull'],tg:{rackpull:{sets:1,reps:5}}}];gdStart('t:907')");await flush();
  const rackGuide=q("#guide .gdc").textContent;
  checkRackCue(rackGuide);
  ev("gdEnd();gdClose()");console.log("PASS rack pull detail and guide describe raised support and schematic height");
  const checkDeadlift=text=>{for(const clause of ["Ayaklarını yere sağlam bas","barı zeminden kontrollü kaldır","kalça ve dizlerini açarak doğrul","barı kontrollü zemine geri indir","Çizim şematiktir","kişisel kurulum önerisi değildir"])assert.ok(text.includes(clause),`deadlift cue requires ${clause}`)};
  ev("exSheet('deadlift')");checkDeadlift(q("#sheet .cues").textContent);
  ev("closeSheet();S.templates=[{id:911,name:'Zemin çekiş testi',ex:['deadlift'],tg:{deadlift:{sets:1,reps:5}}}];gdStart('t:911')");await flush();
  const deadliftGuide=q("#guide .gdc").textContent;checkDeadlift(deadliftGuide);
  for(const clause of ["Ayaklarını yere sağlam bas","barı zeminden kontrollü kaldır","kalça ve dizlerini açarak doğrul","barı kontrollü zemine geri indir","Çizim şematiktir","kişisel kurulum önerisi değildir"])assert.throws(()=>checkDeadlift(deadliftGuide.replace(clause,"")),assert.AssertionError);
  ev("gdEnd();gdClose()");console.log("PASS deadlift detail and guide floor pull sequence with six negative cue mutations");
  assert.equal(ev("exCues(gEx('squat'))[0]"),ev("EXCUE.squat[0]"));
  assert.equal(ev("exCues({id:'custom_stance',tp:'squat'})[0]"),ev("EXCUE.squat[0]"));
  console.log("PASS ordinary and custom squat retain template cues");
  checkInheritedCues(e=>ev(`exCues(${JSON.stringify(e)})`));
  console.log("PASS inherited IDs and templates return arrays with correct fallback");
  const source=fs.readFileSync(require.resolve("../www/modules/gym/excues.js"),"utf8");
  const missingRack=vm.runInNewContext(source+"\ndelete EXCUE_BY_ID.rackpull; exCues");
  assert.throws(()=>checkRackCue(Array.from(missingRack({id:"rackpull",tp:"hinge"})).join(" ")),assert.AssertionError);
  for(const clause of ["Çizim şematik bir yükseklik örneğidir; kişisel ayar önerisi değildir","kontrollü kaldır","kalça ve dizlerini açarak doğrul","desteklere kontrollü geri bırak"]){
    assert.throws(()=>checkRackCue(rackGuide.replace(clause,"")),assert.AssertionError);
  }
  assert.equal(ev("exCues({id:'custom_hinge',tp:'hinge'})[0]"),ev("EXCUE.hinge[0]"));
  const checkRdl=text=>{for(const clause of ["Ayakta üst konumda","dizlerini hafif bükük tut","kalçanı geriye it","kontrollü indir","kalçanı açarak üst konuma dön","ilk yerden alış kurulumunu göstermez","zemine temas şart değildir","açık izdüşüm","kişisel kurulum önerisi değildir"])assert.ok(text.includes(clause),`rdl cue requires ${clause}`)};
  ev("exSheet('rdl')");checkRdl(q("#sheet .cues").textContent);
  ev("closeSheet();S.templates=[{id:912,name:'RDL testi',ex:['rdl'],tg:{rdl:{sets:1,reps:5}}}];gdStart('t:912')");await flush();
  const rdlGuide=q("#guide .gdc").textContent;checkRdl(rdlGuide);
  for(const clause of ["Ayakta üst konumda","dizlerini hafif bükük tut","kalçanı geriye it","kontrollü indir","kalçanı açarak üst konuma dön","ilk yerden alış kurulumunu göstermez","zemine temas şart değildir","açık izdüşüm","kişisel kurulum önerisi değildir"])assert.throws(()=>checkRdl(rdlGuide.replace(clause,"")),assert.AssertionError);
  ev("gdEnd();gdClose()");console.log("PASS rdl detail and guide top-down cycle and nine cue-removal mutants");
  const checkDeficit=text=>{for(const clause of ["yükseltilmiş platform","zeminden kontrollü kaldır","kalça ve dizlerini açarak doğrul","kontrollü zemine indir","platform yüksekliği kişisel ayar önerisi değildir","açık bir izdüşüm"])assert.ok(text.includes(clause),`deficit first cue requires ${clause}`)};
  ev("exSheet('defdl')");checkDeficit(q("#sheet .cues").textContent);
  ev("closeSheet();S.templates=[{id:909,name:'Platform testi',ex:['defdl'],tg:{defdl:{sets:1,reps:5}}}];gdStart('t:909')");await flush();
  const deficitGuide=q("#guide .gdc").textContent;checkDeficit(deficitGuide);
  for(const clause of ["yükseltilmiş platform","zeminden kontrollü kaldır","kalça ve dizlerini açarak doğrul","kontrollü zemine indir","platform yüksekliği kişisel ayar önerisi değildir","açık bir izdüşüm"])assert.throws(()=>checkDeficit(deficitGuide.replace(clause,"")),assert.AssertionError);
  ev("gdEnd();gdClose()");console.log("PASS deficit first cue in detail and guide and six clause-removal mutants");
  console.log("PASS rack pull guards reject missing override and missing limitation; other hinge cues remain unchanged");
  for(const table of ["EXCUE_BY_ID","EXCUE"]){
    const guard=`Object.hasOwn(${table},e.${table==="EXCUE_BY_ID"?"id":"tp"})`;
    assert.ok(source.includes(guard),"mutation must replace existing guard");
    const mutant=vm.runInNewContext(source.replace(guard,`${table}[e.${table==="EXCUE_BY_ID"?"id":"tp"}]`)+"\nexCues");
    assert.throws(()=>checkInheritedCues(mutant),assert.AssertionError);
    console.log(`PASS inherited cue guard detects missing ${table} own-property check`);
  }
  }finally{w.close();}
}).catch(e=>{console.error(e);process.exitCode=1});
