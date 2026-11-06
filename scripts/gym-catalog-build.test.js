"use strict";
const assert=require("node:assert/strict"),fs=require("fs"),path=require("path"),cp=require("child_process");
const root=path.join(__dirname,".."),builder=path.join(__dirname,"build-gym-catalog.js");
const r=cp.spawnSync(process.execPath,[builder,"--check"],{cwd:require("os").homedir(),encoding:"utf8"});
assert.equal(r.status,0,`offline source → generated check failed: ${r.stdout}${r.stderr}`);
const metadata=JSON.parse(fs.readFileSync(path.join(root,"docs/analysis/gym-catalog-metadata.json"),"utf8"));
const runtime=require("../www/modules/gym/exlib.js");
require("../www/modules/gym/balance.js");
assert.deepEqual(metadata.records.map(e=>e.id),runtime.map(e=>e.id));
assert.equal(metadata.records.length,332);
assert.equal(metadata.records.filter(e=>e.status==="review").length,332);
assert.equal(metadata.acceptedNewRecords,0);
console.log("PASS offline source reproduces generated catalog and all 332 review metadata rows from another cwd");
const {compile,readBatches}=require("./build-gym-catalog");
const batches=readBatches(),outputs=compile(batches);
assert.equal(runtime.find(e=>e.id==="seatedgm").tp,"seatedhinge");
assert.equal(runtime.find(e=>e.id==="rackpull").tp,"rackpull");
const training=runtime.map(({im,...e})=>["seatedgm","rackpull"].includes(e.id)?{...e,tp:"hinge"}:e);
assert.equal(require("crypto").createHash("sha256").update(JSON.stringify(training)).digest("hex"),"e89af76060e7a21b90b60ebf353495d91da95ad9e5a86768747f7df235080830");
console.log("PASS runtime training fields and legacy IDs preserved; approved photo count and seatedgm/rackpull template changes excluded");
for(const [name,mutate,pattern] of [
  ["unknown wrapper field",b=>b[0].records[0].accepted=true,/unknown record field/],
  ["inherited template",b=>{const x=b[0].records[0];x.runtime.tp="constructor";x.metadata.figure_template="constructor";x.metadata.cue_ids=["constructor"]},/figure or cue/],
  ["invalid prop",b=>b[0].records[0].runtime.pr=123,/invalid figure override/],
  ["invalid pose",b=>b[0].records[0].runtime.o={t:"bad"},/invalid figure override/],
  ["unknown batch field",b=>b[0].unexpected=true,/invalid batch schema/],
  ["wrong legacy id",b=>b[0].records[0].runtime.id="renamed-squat",/legacy source mapping/],
  ["wrong legacy source name",b=>b[0].records[0].metadata.source_name="unverified name",/legacy source mapping/],
  ["duplicate id",b=>b[0].records[1].runtime.id=b[0].records[0].runtime.id,/duplicate id/],
  ["missing figure",b=>b[0].records[0].runtime.tp="missing-template",/figure or cue/],
  ["missing cue",b=>b[0].records[0].metadata.cue_ids=[],/figure or cue/],
  ["invalid enum",b=>b[0].records[0].runtime.k="invalid",/invalid runtime/],
  ["unknown license",b=>b[0].records[0].metadata.license_ref="unknown",/source or license/],
  ["unknown data",b=>b[0].records[0].metadata.source_ref="unknown",/source or license/],
  ["fabricated identity",b=>b[0].records[0].metadata.canonical_id="unverified-squat",/explicit review/],
  ["accepted without review",b=>b[0].records[0].metadata.status="accepted",/explicit review/],
  ["missing inventory",b=>b[0].records.pop(),/inventory changed/],
  ["new batch bypass",b=>b.push({schemaVersion:1,batch:"new",records:[{runtime:{...b[0].records[0].runtime,id:"new-id"},metadata:b[0].records[0].metadata}]}),/new batches blocked/]
]){
  const copy=JSON.parse(JSON.stringify(batches));mutate(copy);assert.throws(()=>compile(copy),pattern);console.log(`PASS rejects ${name}`);
}
const scratch=fs.mkdtempSync(path.join(process.env.TMPDIR||require("os").tmpdir(),"gym-build-"));
try{
  for(const file of ["scripts/build-gym-catalog.js","scripts/gym-catalog-semantic.js","scripts/gym-provenance.js","scripts/exlib-src.txt","www/modules/gym/figtpl.js","www/modules/gym/figlib.js","www/modules/gym/excues.js",...Object.keys(outputs)]){
    const target=path.join(scratch,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,file),target);
  }
  fs.cpSync(path.join(__dirname,"gym-catalog/batches"),path.join(scratch,"scripts/gym-catalog/batches"),{recursive:true});
  const invoke=()=>cp.spawnSync(process.execPath,[path.join(scratch,"scripts/build-gym-catalog.js"),"--check"],{cwd:require("os").homedir(),encoding:"utf8"});
  assert.equal(invoke().status,0);
  for(const file of Object.keys(outputs)){
    const target=path.join(scratch,file),before=fs.readFileSync(target);
    fs.appendFileSync(target,"\nmanual mutation\n");
    const result=invoke();assert.equal(result.status,1);assert.ok(result.stderr.includes(`generated output differs: ${file}`));
    assert.ok(fs.readFileSync(target,"utf8").endsWith("manual mutation\n"));
    fs.writeFileSync(target,before);console.log(`PASS clean checkout rejects edited ${file} without repairing it`);
  }
}finally{fs.rmSync(scratch,{recursive:true,force:true})}
assert.deepEqual(compile(batches),outputs);
assert.ok(Object.values(outputs).every(t=>!t.includes("NaN")));
console.log("PASS repeat generation is deterministic and only returns declared outputs");
