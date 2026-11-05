"use strict";
const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path");
const Semantic=require("./gym-catalog-semantic.js");
const EXDB=require("../www/modules/gym/exlib.js");
const BAL=require("../www/modules/gym/balance.js");
const all=EXDB.slice();
const balance=require("../www/modules/gym/balance.js");
const runtime=all.slice();
const source=fs.readFileSync(path.join(__dirname,"exlib-src.txt"),"utf8").split(/\r?\n/)
  .filter(x=>x&&!x.startsWith("#")&&x.includes("|"))
  .map((line,i)=>{const p=line.split("|");return {sourceLine:i+1,id:p[1],n:p[2],tp:p[4],pr:p[5]||"",k:p[6]||"",r:p[3],source:"exlib-src.txt"}});

const squat=runtime.find(e=>e.id==="squat");
const full=runtime.find(e=>e.id==="fullsquat");
const unknown={id:"x",n:"Bilinmeyen",tp:"squat",r:"Ön bacak",k:"w",c:"g"};
const invalidCanonical={id:"bad",n:"Geçersiz",canonical:{pattern:"not-a-valid-value",primary_joints:"not-a-valid-value",rom:"not-a-valid-value",unilateral:"not-a-valid-value",stance:"not-a-valid-value",load_mode:"not-a-valid-value",equipment_role:"not-a-valid-value",direction:"not-a-valid-value",tempo_mode:"not-a-valid-value",target_region:"not-a-valid-value",start_end:"not-a-valid-value"}};

ok("canonical signature is deterministic and excludes display name",(()=>{
  const a=Semantic.signature({id:"a",n:"Barbell Squat",tp:"squat",r:"Ön bacak",k:"w",c:"g",pr:"bar@sh"});
  const b=Semantic.signature({id:"b",n:"Başka ad",tp:"squat",r:"Ön bacak",k:"w",c:"g",pr:"bar@sh"});
  return JSON.stringify(a)===JSON.stringify(b)&&Semantic.key(a)===Semantic.key(b);
})());

ok("same observed movement is reported as duplicate, not a new exercise",(()=>{
  const clone={...squat,id:"clone",n:"Başka görünen ad"};
  const r=Semantic.audit([squat,clone],{strict:false});
  return r.duplicates.some(x=>x.ids.includes("squat")&&x.ids.includes("clone"));
})());

ok("complete canonical metadata can prove a real movement difference",(()=>{
  const base={id:"a",n:"Squat",canonical:{pattern:"squat",primary_joints:["knee","hip"],rom:"parallel",unilateral:"bilateral",stance:"standing",load_mode:"external",equipment_role:"bar_on_shoulders",direction:"sagittal",tempo_mode:"dynamic",target_region:"quadriceps",start_end:"standing_to_standing"}};
  const variant={...base,id:"b",n:"Tek bacak squat",canonical:{...base.canonical,unilateral:"unilateral"}};
  const r=Semantic.compare(base,variant);
  return r.status==="distinct"&&r.distinct===true;
})());

ok("equipment-only or incomplete difference is review, not distinct",(()=>{
  const r=Semantic.compare(
    {id:"a",n:"Squat",tp:"squat",r:"Ön bacak",k:"w",c:"g",pr:"bar@sh"},
    {id:"b",n:"Squat dumbbell",tp:"squat",r:"Ön bacak",k:"w",c:"g",pr:"db"}
  );
  return r.status==="review"&&!r.distinct;
})());

ok("unknown canonical fields never enter semantic unique count",(()=>{
  const r=Semantic.audit([unknown],{strict:false});
  return r.runtimeCount===1&&r.semanticUniqueCount===0&&r.review.length===1;
})());

ok("current source and runtime inventories are both read without claiming semantic uniqueness",(()=>{
  const r=Semantic.audit(runtime,{sourceRecords:source,strict:false});
  return r.runtimeCount===332&&r.sourceCount===324&&r.review.length>0&&r.semanticUniqueCount<332;
})());

ok("invalid canonical vocabulary never enters semantic unique count",(()=>{
  const r=Semantic.audit([invalidCanonical],{strict:false});
  return r.semanticUniqueCount===0&&r.review.length===1&&r.review[0].reason==="invalid-canonical-metadata";
})());

ok("semantic audit emits one manifest row per runtime record",(()=>{
  const r=Semantic.audit(runtime,{sourceRecords:source,strict:false});
  return Array.isArray(r.manifest)&&r.manifest.length===332&&r.manifest.every(x=>x.id&&x.status&&x.signature);
})());

ok("strict mode rejects a record without complete canonical metadata",()=>{
  let threw=false;try{Semantic.audit([unknown],{strict:true})}catch(e){threw=/canonical metadata/i.test(e.message)}
  return threw;
});

finish();
