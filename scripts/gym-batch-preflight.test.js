"use strict";
const assert=require("node:assert/strict"),fs=require("fs"),path=require("path"),cp=require("child_process");
const {preflight}=require("./gym-batch-preflight");
const Semantic=require("./gym-catalog-semantic");
// Synthetic test input only; no exercise is added or approved.
const canonical={pattern:["squat"],primary_joints:["hip","knee"],rom:["parallel"],unilateral:["bilateral"],stance:["standing"],load_mode:["external"],equipment_role:["barbell_back"],direction:["sagittal"],tempo_mode:["dynamic"],target_region:["quads"],start_end:["stand_squat_stand"]};
const runtime={id:"probe_squat",n:"SENTETİK TEST — Squat",r:"Ön bacak",g:"Bacak",k:"w",q:"Salon",l:"Başlangıç",c:"g",inc:2.5,tp:"squat",im:0};
const record={runtime,metadata:{canonical_id:"probe_squat",canonical,signature:Semantic.key(Semantic.signature({canonical})),family:"squat",cue_ids:["squat"],figure_template:"squat",source_ref:"test-source",license_ref:"test-source",source_name:"Synthetic test source",retrieved_at:"2026-01-01T00:00:00.000Z",transformation_note:"Synthetic test fixture, not production content.",status:"review"}};
const batch={schemaVersion:1,batch:"synthetic-test",sources:{"test-source":{url:"https://example.invalid/test",commit:"a".repeat(40),license:"Unlicense",license_status:"verified",evidence_url:"https://example.invalid/LICENSE",attribution:"Synthetic fixture only"}},records:[record]};
const result=preflight(batch);
assert.equal(result.acceptedNewRecords,0);
assert.equal(result.metadataValidCount,1);
assert.equal(result.reviewCount,1);
assert.ok(result.blockers.includes("visual-pilot-not-approved"));
assert.ok(result.blockers.includes("baseline-canonical-review"));
assert.equal(result.baselineCount,332);
assert.equal(result.baselineCanonicalReviewCount,332);
assert.equal(result.records[0].status,"review");
console.log("PASS complete synthetic metadata stays review and never enters accepted count");
for(const [name,mutate,error] of [
  ["existing id",b=>b.records[0].runtime.id="squat","invalid-or-existing-id"],
  ["duplicate id",b=>b.records.push(structuredClone(b.records[0])),"invalid-or-existing-id"],
  ["absent runtime",b=>delete b.records[0].runtime,"missing-record"],
  ["absent metadata",b=>delete b.records[0].metadata,"missing-record"],
  ["inherited template",b=>{b.records[0].runtime.tp="constructor";b.records[0].metadata.figure_template="constructor";b.records[0].metadata.cue_ids=["constructor"]},"missing-figure-or-cue"],
  ["unknown runtime field",b=>b.records[0].runtime.unexpected=true,"unknown-record-field"],
  ["unknown metadata field",b=>b.records[0].metadata.accepted=true,"unknown-record-field"],
  ["invalid enum",b=>b.records[0].runtime.k="wrong","invalid-runtime-value"],
  ["missing figure",b=>b.records[0].runtime.tp="unknown","missing-figure-or-cue"],
  ["missing cue",b=>b.records[0].metadata.cue_ids=[],"missing-figure-or-cue"],
  ["new photo",b=>b.records[0].runtime.im=1,"unverified-new-photo"],
  ["accepted status",b=>b.records[0].metadata.status="accepted","candidate-must-start-in-review"],
  ["missing identity",b=>b.records[0].metadata.canonical_id=null,"invalid-or-repeated-canonical-id"],
  ["incomplete canonical",b=>b.records[0].metadata.canonical.rom=null,"incomplete-or-invalid-canonical"],
  ["bad vocabulary",b=>b.records[0].metadata.canonical.pattern=["unknown"],"incomplete-or-invalid-canonical"],
  ["forged signature",b=>b.records[0].metadata.signature="forged","signature-mismatch"],
  ["wrong family",b=>b.records[0].metadata.family="hinge","family-mismatch"],
  ["unknown source",b=>b.records[0].metadata.source_ref="unknown","missing-source-license-evidence"],
  ["prototype source",b=>b.records[0].metadata.source_ref="toString","missing-source-license-evidence"],
  ["unknown license",b=>b.sources["test-source"].license="unknown","missing-source-license-evidence"],
  ["unverified license",b=>b.sources["test-source"].license_status="unverified","missing-source-license-evidence"],
  ["missing commit",b=>b.sources["test-source"].commit="main","missing-source-license-evidence"],
  ["array source URL",b=>b.sources["test-source"].url=[b.sources["test-source"].url],"missing-source-license-evidence"],
  ["array evidence URL",b=>b.sources["test-source"].evidence_url=[b.sources["test-source"].evidence_url],"missing-source-license-evidence"],
  ["array commit",b=>b.sources["test-source"].commit=[b.sources["test-source"].commit],"missing-source-license-evidence"],
  ["unknown source field",b=>b.sources["test-source"].accepted=true,"missing-source-license-evidence"],
  ["URL credentials",b=>b.sources["test-source"].url="https://user:password@example.invalid","missing-source-license-evidence"],
  ["missing attribution",b=>b.sources["test-source"].attribution="","missing-source-license-evidence"],
  ["missing transformation",b=>b.records[0].metadata.transformation_note="","missing-source-transformation"],
  ["missing date",b=>b.records[0].metadata.retrieved_at=null,"invalid-retrieval-instant"],
  ["impossible date",b=>b.records[0].metadata.retrieved_at="2026-02-30T00:00:00.000Z","invalid-retrieval-instant"]
]){
  const b=structuredClone(batch);mutate(b);const r=preflight(b);
  assert.ok(r.records.some(x=>x.status==="rejected"&&x.errors.includes(error)),name);assert.equal(r.acceptedNewRecords,0);
  console.log(`PASS rejects ${name}`);
}
for(const ref of [42,null,["test-source"]]){
  const b=structuredClone(batch);b.records[0].metadata.source_ref=ref;b.records[0].metadata.license_ref=ref;b.sources[String(ref)]=b.sources["test-source"];
  assert.ok(preflight(b).records[0].errors.includes("missing-source-license-evidence"));
}
console.log("PASS numeric null and array references cannot borrow source registry entries");
const named=structuredClone(batch);named.records[0].runtime.n="Squat";
assert.ok(preflight(named).records[0].baselineNameCandidates.includes("squat"));
console.log("PASS matching legacy name is review evidence, never a uniqueness verdict");
const malformed=structuredClone(batch);malformed.records=[null];assert.equal(preflight(malformed).rejectedCount,1);
console.log("PASS null record yields explicit rejection rather than hidden acceptance");
const shuffled=structuredClone(batch);shuffled.records[0].metadata.canonical.primary_joints.reverse();
assert.deepEqual(preflight(shuffled),preflight(batch));
console.log("PASS unordered joint set does not change signature or report");
for(const [name,mutate] of [
  ["scalar canonical",b=>b.records[0].metadata.canonical.rom="parallel"],
  ["unknown canonical field",b=>b.records[0].metadata.canonical.extra=["invented"]],
  ["multiple patterns",b=>b.records[0].metadata.canonical.pattern=["squat","hinge"]]
]){const b=structuredClone(batch);mutate(b);assert.ok(preflight(b).records[0].errors.includes("invalid-canonical-shape"),name);console.log(`PASS rejects ${name}`)}
assert.equal(result.records[0].sourceEvidenceVerification,"not-independently-verified");
assert.equal(result.records[0].source_ref,"test-source");
assert.equal(result.records[0].signature,record.metadata.signature);
console.log("PASS report retains source and signature without endorsing self-declared license");
const malformedShape=structuredClone(batch);malformedShape.records[0].metadata.canonical={...canonical,primary_joints:["hip",8]};assert.ok(preflight(malformedShape).records[0].errors.includes("invalid-canonical-shape"));
console.log("PASS non-string canonical token is rejected");
for(const [name,mutate,error] of [
  ["unnormalized token",b=>b.records[0].metadata.canonical.stance=["STANDING"],"invalid-canonical-shape"],
  ["overflow pose",b=>b.records[0].runtime.o={a1:1e308},"invalid-figure-override"],
  ["invalid pose",b=>b.records[0].runtime.o={a1:"invalid"},"invalid-figure-override"],
  ["unsupported prop",b=>b.records[0].runtime.pr="unknown-prop","invalid-figure-override"],
  ["repeated canonical token",b=>b.records[0].metadata.canonical.primary_joints=["hip","knee","hip"],"invalid-canonical-shape"]
]){const b=structuredClone(batch);mutate(b);assert.ok(preflight(b).records[0].errors.includes(error),name);console.log(`PASS rejects ${name}`)}
assert.throws(()=>preflight({...batch,records:Array(101).fill(record)}),/invalid candidate batch schema/);
console.log("PASS candidate batch is bounded to 100 rows");
const copy=structuredClone(record);copy.runtime.id="probe_copy";copy.runtime.n="SENTETİK TEST — başka isim";copy.metadata.canonical_id="probe_copy";
let r=preflight({...batch,records:[record,copy]});
assert.ok(r.records.every(x=>x.reasons.some(s=>s.startsWith("duplicate-signature:"))));assert.equal(r.acceptedNewRecords,0);
console.log("PASS renamed copy is duplicate evidence in both directions without inflation");
copy.metadata.canonical.equipment_role=["dumbbell_front"];copy.metadata.signature=Semantic.key(Semantic.signature({canonical:copy.metadata.canonical}));
r=preflight({...batch,records:[record,copy]});assert.ok(r.records.every(x=>x.reasons.some(s=>s.startsWith("near-duplicate-review:"))));
console.log("PASS equipment-only variant stays near-duplicate review");
for(const bad of [null,{},[],{...batch,records:[]},{...batch,sources:[]}])assert.throws(()=>preflight(bad),/invalid candidate batch schema/);
console.log("PASS malformed batch fails closed");
assert.deepEqual(preflight(batch),preflight(structuredClone(batch)));
console.log("PASS same candidate produces deterministic report");
const tmp=fs.mkdtempSync(path.join(process.env.TMPDIR||require("os").tmpdir(),"gym-preflight-"));
try{
  const file=path.join(tmp,"synthetic.json");fs.writeFileSync(file,JSON.stringify(batch));
  const before=fs.readFileSync(file);const cli=path.join(__dirname,"gym-batch-preflight.js");
  const run=cp.spawnSync(process.execPath,[cli,file],{cwd:tmp,encoding:"utf8"});assert.equal(run.status,1);assert.equal(JSON.parse(run.stdout).acceptedNewRecords,0);assert.deepEqual(fs.readFileSync(file),before);
  const invalid=cp.spawnSync(process.execPath,[cli],{cwd:tmp,encoding:"utf8"});assert.equal(invalid.status,2);
  const rejected=structuredClone(batch);rejected.records[0].runtime.im=1;fs.writeFileSync(file,JSON.stringify(rejected));
  const negative=cp.spawnSync(process.execPath,[cli,file],{cwd:tmp,encoding:"utf8"});assert.equal(negative.status,2);assert.equal(JSON.parse(negative.stdout).rejectedCount,1);
  console.log("PASS real CLI emits read-only report and blocked/rejected exit codes from other cwd");
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
