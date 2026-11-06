"use strict";
const assert=require("node:assert/strict"),S=require("./gym-catalog-semantic");
const c={pattern:"squat",primary_joints:["hip","knee"],rom:"parallel",unilateral:"bilateral",stance:"standing",load_mode:"external",equipment_role:"bar_on_shoulders",direction:"sagittal",tempo_mode:"dynamic",target_region:"quadriceps",start_end:"standing_to_standing"};
const a={id:"synthetic_a",n:"Synthetic squat",canonical:c};
const b={...a,id:"synthetic_b",canonical:{...c,primary_joints:["knee","hip"]}};
assert.equal(S.key(S.signature(a)),S.key(S.signature(b)));
assert.equal(S.compare(a,b).status,"duplicate");
console.log("PASS set ordering never creates a new movement signature");
for(const [name,change] of [
  ["boolean",{stance:[true]}],["number",{rom:42}],["object",{rom:{label:"parallel"}}],
  ["null token",{rom:[null]}],["extra enum values",{unilateral:["bilateral","unilateral"]}],
  ["unknown field",{extra:"invented"}],["uppercase token",{stance:"STANDING"}]
]){
  const row={...a,canonical:{...c,...change}};
  assert.throws(()=>S.audit([row],{strict:true}),/canonical metadata/);
  assert.equal(S.audit([row]).semanticUniqueCount,0);
  assert.notEqual(S.compare(row,a).status,"duplicate");
  console.log(`PASS invalid ${name} canonical metadata fails closed`);
}
for(const [name,delta] of [["ROM",{rom:"deep"}],["tempo",{tempo_mode:"hold"}],["equipment",{equipment_role:"dumbbell_front"}],["unilateral",{unilateral:"unilateral"}],["pattern",{pattern:"hinge"}]]){
  const row={...a,id:"synthetic_variant",canonical:{...c,...delta}};
  const r=S.compare(a,row);assert.equal(r.status,"review");assert.equal(r.distinct,false);
  const audit=S.audit([a,row]);assert.equal(audit.semanticUniqueCount,0);assert.equal(audit.candidateSignatureCount,2);assert.equal(audit.review.length,2);
  console.log(`PASS ${name} difference is review, not automatic distinct or accepted count`);
}
const coarse=[{id:"legacy_a",tp:"squat",r:"Ön bacak",k:"w"},{id:"legacy_b",tp:"squat",r:"Ön bacak",k:"w"}];
assert.equal(S.compare(...coarse).status,"review");assert.equal(S.audit(coarse).duplicates.length,0);assert.equal(S.audit(coarse).observedGroups.length,1);
console.log("PASS incomplete legacy key produces observation group, never canonical duplicate");
const validRoot={...c,id:"flat"};
assert.throws(()=>S.audit([{...validRoot,canonical:null}],{strict:true}),/canonical metadata/);
for(const bad of [null,{},[],{canonical:[]},{canonical:{...c,rom:[{toString:null},"parallel"]}}]){
  assert.throws(()=>S.audit([bad],{strict:true}),/canonical metadata/);
  assert.equal(S.compare(bad,a).status,"review");
}
console.log("PASS malformed roots and shadowed token methods cannot bypass or crash review");
const exact=S.audit([a,b]);assert.equal(exact.duplicates.length,1);assert.equal(exact.candidateSignatureCount,1);assert.equal(exact.semanticUniqueCount,0);
console.log("PASS exact canonical duplicates are reported without admission");
const names=S.nameAudit([{id:"press_a",n:"Bench press"},{id:"press_b",n:"Bench pres"}]);assert.equal(names.near.length,1);assert.equal(names.semanticUniqueCount,0);
console.log("PASS one-edit name typo is a candidate only and contributes zero accepted records");
const fs=require("fs"),path=require("path"),cp=require("child_process");
for(const [writer,file] of [["write-gym-semantic-audit","gym-phase-b-semantic-audit.json"],["write-gym-semantic-manifest","gym-phase-b-semantic-manifest.json"]]){
  const script=`const fs=require('fs');let out;fs.writeFileSync=(p,t)=>{if(!String(p).endsWith(${JSON.stringify(file)}))throw Error('unexpected write');out=t};require(${JSON.stringify(path.join(__dirname,writer+'.js'))});console.log('ARTIFACT:'+JSON.stringify(out));`;
  const r=cp.spawnSync(process.execPath,["-e",script],{encoding:"utf8"});assert.equal(r.status,0,r.stderr);
  const captured=JSON.parse(r.stdout.split('\n').find(x=>x.startsWith('ARTIFACT:')).slice(9));
  assert.equal(captured,fs.readFileSync(path.join(__dirname,"../docs/analysis",file),"utf8").replace(/\r\n/g,"\n"));
  console.log(`PASS ${writer} reproduces committed report without writing it`);
}
