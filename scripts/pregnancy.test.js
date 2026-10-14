/* Pregnancy, nursing and eating-disorder signs are separate flags: migration of the old single "preg", lifting by confirmation, restore never brings a lifted brake back. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(w=>Object.defineProperty(w,"crypto",{value:require("node:crypto").webcrypto})),ev=s=>w.eval(s),q=s=>w.document.querySelector(s),txt=()=>q("#view").textContent;
  const fresh=(x="")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.kcal=2000;S.settings.heightCm=170;S.settings.age=30;tab='today';${x};render()`);
  const cl=o=>JSON.parse(ev(`JSON.stringify((({pregnant,nursing,edFlag,riskOff,chatRisk})=>({pregnant,nursing,edFlag,riskOff,chatRisk}))(cleanSettings(${JSON.stringify(o)})))`));

  let c=cl({chatRisk:"preg"});
  ok("migration: the old single 'preg' becomes the pregnancy flag, no eating-disorder flag, old key gone",c.pregnant===true&&c.edFlag===false&&c.nursing===false&&c.chatRisk===undefined,c);
  c=cl({chatRisk:"ed,preg"});
  ok("migration: 'ed,preg' keeps both signs",c.pregnant&&c.edFlag,c);
  c=cl({pregnant:true,riskOff:"nurs,x"});
  ok("new keys are kept, unknown riskOff entries dropped",c.pregnant&&c.riskOff==="nurs",c);

  fresh("S.settings.pregnant=true;add('weight',80);S.settings.goalKg=70;add('weight',79,'',keyOff(-1))");
  ok("pregnancy: no goal line on Today and no weigh-in/movement reminder rows",!/hedefe/.test(txt())&&!/Haftalık tartı|Hareket/.test(ev("S.settings.reminders.filter(remShown).map(r=>r.name).join()")));
  ev("tab='settings-reminders';render()");
  ok("pregnancy: the reminders screen does not list the weigh-in and movement reminders",!/Haftalık tartı/.test(txt())&&!/>Hareket</.test(q("#view").innerHTML));
  fresh("S.settings.nursing=true;add('weight',80);S.settings.goalKg=70;add('weight',79,'',keyOff(-1))");
  ok("nursing: the goal line and reminders stay",/hedefe/.test(txt())&&ev("S.settings.reminders.filter(remShown).some(r=>r.id===1&&r.on)"));

  fresh("S.settings.cycleOn=true;S.cycle=[{id:1,s:'2026-07-15'},{id:2,s:'2026-08-12'},{id:3,s:'2026-09-09'}];S.settings.nursing=true;tab='cycle'");
  ok("nursing: the forecast is shown with an 'unreliable' note",!!q(".cypr")&&/tahmin güvenilmez olabilir/.test(txt()));
  ev("S.settings.nursing=false;S.settings.pregnant=true;render()");
  ok("pregnancy: no forecast, own note text",!q(".cypr")&&/Hamilelik işareti olduğu için/.test(txt()));

  ok("the brake texts are separate",ev("(S.settings.pregnant=true,risk().hard.join())").includes("Hamilelik işareti var")&&!ev("risk().hard.join()").includes("Emzirme")
    &&ev("(S.settings.pregnant=false,S.settings.nursing=true,risk().hard.join())").includes("Emzirme işareti var"));

  // Health sheet: lifting needs the user's confirmation, ed has no switch to lift
  fresh("S.settings.pregnant=true");
  const health=async(on)=>{
    const b=w.document.createElement("button");b.dataset.act="health";w.document.body.appendChild(b);b.click();
    q("#hpg").checked=on.pg;q("#hnu").checked=on.nu;
    q('[data-go="health"]').click();
    await new Promise(r=>setTimeout(r,30));
  };
  w.__confirmAuto=()=>false;
  await health({pg:false,nu:false});
  ok("declining the 'Artık hamile değil misin?' question keeps the flag",ev("S.settings.pregnant")===true);
  w.__confirmAuto=()=>true;
  await health({pg:false,nu:true});
  ok("confirming lifts pregnancy (flag off, remembered as lifted); switching nursing on sets it",ev("S.settings.pregnant")===false&&ev("S.settings.riskOff")==="preg"&&ev("S.settings.nursing")===true&&ev("risk().pregnant")===false);
  ok("after the lift the note text 'hamileyim' no longer brings the brake back",(ev("S.settings.healthNote='hamileyim'"),ev("risk().pregnant")===false));
  ev("S.settings.healthNote='';S.settings.edFlag=true");
  const b=w.document.createElement("button");b.dataset.act="health";w.document.body.appendChild(b);b.click();
  ok("eating-disorder sign: no switch to lift it, an explanation instead",!q("#hed")&&/kaldıramazsın/.test(q("#sheet").textContent));
  ev("closeSheet()");
  fresh("S.settings.pregnant=true;S.settings.healthNote='Notum'");
  w.__confirmAuto=()=>true;await health({pg:false,nu:false});
  ok("saving the sheet after a lift does not re-flag from the old note",ev("S.settings.pregnant")===false);

  // Chat statement: nursing is its own flag
  fresh();
  ev("setRisk(CoachLib.pregnant('emziriyorum'))");
  ok("a chat sentence about nursing sets only the nursing flag",ev("S.settings.nursing")===true&&ev("S.settings.pregnant")===false);
  ok("setRisk('preg') clears the lifted memory",(ev("liftRisk('preg')"),ev("S.settings.riskOff")==="preg")&&(ev("setRisk('preg')"),ev("S.settings.riskOff")===""&&ev("S.settings.pregnant")===true));

  // Restore through the real goRestore: (a) lifted on this phone, the backup carries the sign; (b) lifted before the backup, fresh phone; (c) sign on this phone stays; (d) backup sign comes to a clean phone
  const PW="mavi bulut 7";w.__confirmAuto=()=>true;
  const backupOf=async x=>{fresh(x);return ev(`backupJson("${PW}")`)};
  const restoreInto=async(text,dev)=>{fresh(dev);await ev(`goRestore(${JSON.stringify(text)},"${PW}")`);await new Promise(r=>setTimeout(r,50));return ev("[S.settings.pregnant,S.settings.riskOff,risk().pregnant]")};
  const withSign=await backupOf("S.settings.pregnant=true;add('weight',80)");
  ok("(a) lifted on this phone: restoring an older backup with the sign does not bring the brake back",String(await restoreInto(withSign,"add('weight',70);S.settings.riskOff='preg'"))==="false,preg,false");
  const lifted=await backupOf("S.settings.riskOff='preg';S.settings.healthNote='hamileyim';add('weight',80)");
  ok("(b) lifted before the backup: a fresh phone keeps it lifted, the old note text does not re-flag",String(await restoreInto(lifted,"add('weight',70)"))==="false,preg,false");
  const clean=await backupOf("add('weight',80)");
  ok("(c) a sign set on this phone stays after restoring a clean backup",String(await restoreInto(clean,"S.settings.pregnant=true;add('weight',70)"))==="true,,true");
  ok("(d) a backup's sign comes to a phone that never lifted it",String(await restoreInto(withSign,"add('weight',70)"))==="true,,true");

  // Setup: the three answers are separate flags
  fresh();
  ev("Object.assign(ob,obFresh(),{step:0,cm:'170',kg:'80',age:'30',nu:true});obFinish()");
  ok("setup: 'Emziriyorum' sets only the nursing flag, no health note text is written",ev("S.settings.nursing")===true&&ev("S.settings.pregnant")===false&&ev("S.settings.edFlag")===false&&ev("S.settings.healthNote")==="");
  ev("S=structuredClone(DEF);Object.assign(ob,obFresh(),{step:0});render()");
  ok("setup health card has three separate answers",!!q("#obpg")&&!!q("#obnu")&&!!q("#obed"));
  // Chat and note: only first-person statements, said aloud, never silently re-opened from a note
  ok("a question about pregnancy is not a sign, a first-person statement is",!ev("CoachLib.pregnant('hamilelikte spor olur mu?')")&&!ev("CoachLib.pregnant('hamilelik beslenmesi')")&&ev("CoachLib.pregnant('hamile kaldım')")==="preg"&&ev("CoachLib.pregnant('Gebeyim')")==="preg");
  fresh("S.settings.riskOff='preg';S.settings.pregnant=false");
  ev("cSend('hamilelikte spor olur mu?')");
  ok("a question in the chat does not re-open a lifted flag",ev("S.settings.pregnant")===false&&ev("S.settings.riskOff")==="preg");
  ev("S.settings.healthNote='hamileyim';cNoteCheck()");
  ok("note text does not re-open a lifted flag",ev("S.settings.pregnant")===false);
  fresh();
  ev("cSend('hamileyim ve spor yapmak istiyorum')");
  ok("a first-person chat statement opens the flag and tells the user",ev("S.settings.pregnant")===true&&/hamilelik işareti gördüm/.test(q("#tmsg").textContent)&&/Sağlık notların/.test(q("#tmsg").textContent),q("#tmsg").textContent);
  // Restore: the side whose pregnancy flag changed last wins
  const lifted2=await backupOf("S.settings.pregnant=false;S.settings.riskOff='preg';S.settings.pregAt='2026-10-01T10:00:00.000Z';add('weight',80)");
  ok("a sign opened on this phone after the backup's lift is kept",String(await restoreInto(lifted2,"S.settings.pregnant=true;S.settings.riskOff='';S.settings.pregAt='2026-10-05T10:00:00.000Z';add('weight',70)"))==="true,,true");
  const opened2=await backupOf("S.settings.pregnant=true;S.settings.riskOff='';S.settings.pregAt='2026-10-10T10:00:00.000Z';add('weight',80)");
  ok("a lift on this phone before the backup's newer sign lets the sign in",String(await restoreInto(opened2,"S.settings.pregnant=false;S.settings.riskOff='preg';S.settings.pregAt='2026-10-02T10:00:00.000Z';add('weight',70)"))==="true,,true");
  finish();
})();
