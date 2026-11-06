"use strict";
const fs=require("fs"),path=require("path"),Semantic=require("./gym-catalog-semantic");
const templates=require("../www/modules/gym/figtpl"),vm=require("vm"),context={};
vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,"../www/modules/gym/excues.js"),"utf8")+";this.cues=EXCUE",context);
const baseline=JSON.parse(fs.readFileSync(path.join(__dirname,"../docs/analysis/gym-catalog-metadata.json"),"utf8")).records;
const baselineNames=fs.readdirSync(path.join(__dirname,"gym-catalog/batches")).filter(f=>f.endsWith(".json")).flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,"gym-catalog/batches",f),"utf8")).records).map(x=>({id:x.runtime.id,name:Semantic.normalizeName(x.runtime.n)}));
const https=value=>{if(typeof value!=="string")return false;try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash}catch{return false}};
const nonempty=value=>typeof value==="string"&&value.trim().length>0;
const canonical=c=>Object.fromEntries(Semantic.CANONICAL_FIELDS.map(k=>[k,Array.isArray(c?.[k])?[...new Set(c[k])].sort():c?.[k]]));
function preflight(batch){
  if(batch?.schemaVersion!==1||Object.keys(batch).some(k=>!["schemaVersion","batch","sources","records"].includes(k))||!nonempty(batch.batch)||!Array.isArray(batch.records)||!batch.records.length||batch.records.length>100||!batch.sources||typeof batch.sources!=="object"||Array.isArray(batch.sources))throw Error("invalid candidate batch schema");
  const ids=new Set(),identities=new Set(),records=[],signatures=new Map();
  for(const item of batch.records){
    const e=item?.runtime,m=item?.metadata,errors=[],reasons=[];
    const fail=(condition,reason)=>{if(!condition)errors.push(reason)};
    fail(e&&typeof e==="object"&&m&&typeof m==="object","missing-record");
    fail(e&&m&&Object.keys(e).every(k=>["id","n","r","g","k","q","l","c","inc","tp","im","pr","o"].includes(k))&&Object.keys(m).every(k=>["canonical_id","canonical","signature","family","cue_ids","figure_template","source_ref","license_ref","source_name","retrieved_at","transformation_note","status"].includes(k))&&Object.keys(item).every(k=>["runtime","metadata"].includes(k)),"unknown-record-field");
    const id=e?.id;
    fail(typeof id==="string"&&/^[a-z][a-z0-9_]{1,63}$/.test(id)&&!ids.has(id)&&!baseline.some(x=>x.id===id),"invalid-or-existing-id");ids.add(id);
    fail(e&&["n","r","g","k","q","l","c","tp"].every(k=>nonempty(e[k])),"missing-runtime-field");
    fail(e&&["w","b","t","i","c"].includes(e.k)&&["g","e","k","p","d"].includes(e.c)&&["Ağırlıksız","Ev tipi","Salon"].includes(e.q)&&["Başlangıç","Orta","İleri"].includes(e.l)&&Number.isFinite(e.inc)&&e.inc>0,"invalid-runtime-value");
    fail(e&&(e.im===0||e.im===undefined),"unverified-new-photo");
    fail(e&&Object.hasOwn(templates,e.tp)&&Array.isArray(templates[e.tp].frames)&&Object.hasOwn(context.cues,e.tp)&&Array.isArray(context.cues[e.tp])&&context.cues[e.tp].length>0&&context.cues[e.tp].every(c=>typeof c==="string"&&c.trim())&&m?.figure_template===e.tp&&JSON.stringify(m.cue_ids)===JSON.stringify([e.tp]),"missing-figure-or-cue");
    fail(e&&(e.o===undefined||(e.o&&typeof e.o==="object"&&!Array.isArray(e.o)&&Object.entries(e.o).every(([k,v])=>require("../www/modules/gym/figlib").KEYS.includes(k)&&Number.isFinite(v)&&Math.abs(v)<=360)))&&(e.pr===undefined||["-","bar","bar@sh","db","db@sh","kb","ball"].includes(e.pr)),"invalid-figure-override");
    fail(m?.status==="review","candidate-must-start-in-review");
    fail(nonempty(m?.canonical_id)&&/^[a-z][a-z0-9_]{1,63}$/.test(m.canonical_id)&&!identities.has(m.canonical_id),"invalid-or-repeated-canonical-id");identities.add(m?.canonical_id);
    const shape=m?.canonical&&typeof m.canonical==="object"&&!Array.isArray(m.canonical)&&Object.keys(m.canonical).length===Semantic.CANONICAL_FIELDS.length&&Semantic.CANONICAL_FIELDS.every(k=>Array.isArray(m.canonical[k])&&m.canonical[k].length>0&&m.canonical[k].every(v=>typeof v==="string"&&/^[a-z][a-z0-9_]*$/.test(v))&&new Set(m.canonical[k]).size===m.canonical[k].length)&&["pattern","unilateral","load_mode","direction","tempo_mode"].every(k=>m.canonical[k].length===1);
    fail(shape,"invalid-canonical-shape");
    const c=canonical(m?.canonical);let validCanonical=!!shape;
    try{Semantic.audit([{id,canonical:c}],{strict:true})}catch{validCanonical=false}
    fail(validCanonical,"incomplete-or-invalid-canonical");
    const signature=validCanonical?Semantic.key(Semantic.signature({canonical:c})):null;
    fail(signature!==null&&m?.signature===signature,"signature-mismatch");
    fail(validCanonical&&m?.family===c.pattern?.[0],"family-mismatch");
    const s=nonempty(m?.source_ref)&&nonempty(m?.license_ref)&&Object.hasOwn(batch.sources,m.source_ref)?batch.sources[m.source_ref]:null;
    fail(s&&typeof s==="object"&&!Array.isArray(s)&&Object.keys(s).every(k=>["url","commit","license","license_status","evidence_url","attribution"].includes(k))&&m.license_ref===m.source_ref&&https(s.url)&&typeof s.commit==="string"&&/^[a-f0-9]{40}$/.test(s.commit)&&nonempty(s.license)&&s.license!=="unknown"&&s.license_status==="verified"&&https(s.evidence_url)&&nonempty(s.attribution),"missing-source-license-evidence");
    fail(nonempty(m?.source_name)&&nonempty(m?.transformation_note),"missing-source-transformation");
    fail(typeof m?.retrieved_at==="string"&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(m.retrieved_at)&&Number.isFinite(Date.parse(m.retrieved_at))&&new Date(m.retrieved_at).toISOString()===m.retrieved_at,"invalid-retrieval-instant");
    if(signature){
      if(signatures.has(signature))reasons.push(`duplicate-signature:${signatures.get(signature)}`);
      else signatures.set(signature,id);
    }
    records.push({id:id||null,status:errors.length?"rejected":"review",metadataValid:errors.length===0,errors,reasons,canonical:c,signature,canonical_id:m?.canonical_id||null,source_ref:m?.source_ref||null,license_ref:m?.license_ref||null,sourceEvidenceVerification:"not-independently-verified",baselineNameCandidates:baselineNames.filter(x=>x.name&&x.name===Semantic.normalizeName(e?.n)).map(x=>x.id)});
  }
  for(let i=0;i<records.length;i++)for(let j=0;j<i;j++){
    const a=records[i],b=records[j];
    if(a.signature&&a.signature===b.signature){b.reasons.push(`duplicate-signature:${a.id}`);continue}
    if(a.signature&&b.signature&&a.canonical.pattern[0]===b.canonical.pattern[0]){
      a.reasons.push(`near-duplicate-review:${b.id}`);b.reasons.push(`near-duplicate-review:${a.id}`);
    }
  }
  const output=records.map(({canonical,...r})=>({...r,unresolvedBaselineComparisons:baseline.length}));
  return {schemaVersion:1,batch:batch.batch,baselineCount:baseline.length,baselineCanonicalReviewCount:baseline.filter(e=>e.status==="review").length,candidateCount:records.length,metadataValidCount:records.filter(x=>x.metadataValid).length,reviewCount:records.filter(x=>x.status==="review").length,rejectedCount:records.filter(x=>x.status==="rejected").length,acceptedNewRecords:0,blockers:["visual-pilot-not-approved","baseline-canonical-review","independent-content-review-required"],records:output};
}
if(require.main===module){
  try{
    if(process.argv.length!==3)throw Error("usage: node scripts/gym-batch-preflight.js <candidate.json>");
    const report=preflight(JSON.parse(fs.readFileSync(path.resolve(process.argv[2]),"utf8")));
    console.log(JSON.stringify(report,null,2));process.exitCode=report.rejectedCount?2:1;
  }catch(e){console.error(e.message);process.exitCode=2}
}
module.exports={preflight};
