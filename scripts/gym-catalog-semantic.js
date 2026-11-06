"use strict";

const CANONICAL_FIELDS=[
  "pattern","primary_joints","rom","unilateral","stance","load_mode",
  "equipment_role","direction","tempo_mode","target_region","start_end"
];

const text=v=>String(v==null?"":v).trim().toLowerCase();
const EQUIPMENT_WORDS=new Set(["barbell","dumbbell","kettlebell","medicine","ball","cable","machine","smith","band","bands","ez","plate","plates","bodyweight","body","kg","lbs","lb"]);
const normalizeName=v=>text(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(x=>!EQUIPMENT_WORDS.has(x)).join(" ");
const list=v=>Array.isArray(v)?(v.every(x=>typeof x==="string")?[...new Set(v)].sort():[null]):v==null?[]:[v];
const canon=v=>{
  const raw=v&&typeof v==="object"&&Object.hasOwn(v,"canonical")?v.canonical:v;
  const c=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{};
  const out={};
  for(const k of CANONICAL_FIELDS)out[k]=list(c[k]);
  return out;
};
const ENUMS={
  pattern:new Set(["squat","hinge","lunge","push","pull","carry","cardio","mobility","balance"]),
  unilateral:new Set(["bilateral","alternating","unilateral"]),
  load_mode:new Set(["external","bodyweight","assisted","isometric","locomotion"]),
  direction:new Set(["sagittal","frontal","transverse","vertical","horizontal","multiplanar"]),
  tempo_mode:new Set(["dynamic","hold","interval"])
};
const SLUG=/^[a-z][a-z0-9_]*$/;
const validToken=(k,v)=>typeof v==="string"&&(Object.hasOwn(ENUMS,k)?ENUMS[k].has(v):SLUG.test(v));
const validCanonical=c=>CANONICAL_FIELDS.every(k=>c[k].length>0&&(!Object.hasOwn(ENUMS,k)||c[k].length===1)&&c[k].every(v=>validToken(k,v)));
const present=c=>CANONICAL_FIELDS.every(k=>c[k].length>0);
const complete=c=>present(c)&&validCanonical(c);
const sorted=o=>Object.fromEntries(Object.keys(o).sort().map(k=>[k,o[k]]));

/* Legacy keys only group observations; they never prove movement identity. */
function observed(e){
  const c=canon(e);
  const raw=e&&Object.hasOwn(e,"canonical")?e.canonical:e;
  const shape=raw&&typeof raw==="object"&&!Array.isArray(raw)&&(!e?.canonical||Object.keys(raw).every(k=>CANONICAL_FIELDS.includes(k)));
  const hasCanonical=!!shape&&complete(c),valid=hasCanonical;
  const pattern=c.pattern[0]||text(e?.tp);
  const region=c.target_region[0]||text(e?.r);
  const equipment=text(e?.pr);
  const key=hasCanonical?JSON.stringify(sorted(c)):JSON.stringify(sorted({pattern,region,kind:text(e?.k),equipment}));
  return {key,hasCanonical,validCanonical:valid,presentCanonical:present(c),c};
}

function signature(e){
  const o=observed(e);
  return o.hasCanonical?sorted(o.c):JSON.parse(o.key);
}
function key(sig){return JSON.stringify(sorted(sig||{}));}

function compare(a,b){
  const aa=observed(a),bb=observed(b);
  if(aa.hasCanonical&&bb.hasCanonical&&aa.key===bb.key)return {status:"duplicate",distinct:false,key:aa.key};
  return {status:"review",distinct:false,key:aa.key,reason:aa.hasCanonical&&bb.hasCanonical?"movement-difference-needs-evidence":"incomplete-or-invalid-canonical-metadata"};
}

function nameAudit(records){
  const groups=new Map(),listRecords=Array.isArray(records)?records:[];
  for(const e of listRecords){const n=normalizeName(e&&e.n);if(!groups.has(n))groups.set(n,[]);groups.get(n).push(e&&e.id||"")}
  const exact=[...groups.entries()].filter(([name,ids])=>name&&ids.length>1).map(([name,ids])=>({name,ids}));
  const near=[],entries=[...groups.entries()];
  for(let i=0;i<entries.length;i++)for(let j=0;j<i;j++){
    const [a,aa]=entries[i],[b,bb]=entries[j];
    if(!a||!b||Math.min(a.length,b.length)<5||Math.abs(a.length-b.length)>1)continue;
    const short=a.length<=b.length?a:b,long=a.length<=b.length?b:a;
    let x=0,y=0,edits=0;
    while(x<short.length&&y<long.length){if(short[x]===long[y]){x++;y++}else{edits++;if(short.length===long.length)x++;y++}if(edits>1)break}
    edits+=long.length-y+short.length-x;
    if(edits===1)near.push({names:[b,a],ids:[...bb,...aa],reason:"one-edit-name-candidate"});
  }
  return {exact,near,semanticUniqueCount:0,review:listRecords.map(e=>({id:e&&e.id||"",status:"review",reason:"canonical-metadata-required"}))};
}

function audit(records,{sourceRecords=records,strict=false}={}){
  const listRecords=Array.isArray(records)?records:[];
  const sourceById=new Map((Array.isArray(sourceRecords)?sourceRecords:[]).filter(x=>x&&typeof x==="object").map(x=>[x.id,x]));
  const groups=new Map(),observations=new Map(),review=[],completeKeys=new Set(),manifest=[];
  for(const e of listRecords){
    const o=observed(e),valid=o.presentCanonical&&o.validCanonical;
    const status=valid?"candidate":"review",reason=!o.presentCanonical?"incomplete-canonical-metadata":"invalid-canonical-metadata";
    review.push({id:e&&e.id||"",status:"review",reason:valid?"movement-evidence-and-admission-required":reason});
    if(valid)completeKeys.add(o.key);
    const bucket=valid?groups:observations;
    if(!bucket.has(o.key))bucket.set(o.key,[]);
    bucket.get(o.key).push(e&&e.id||"");
    manifest.push({id:e&&e.id||"",source:sourceById.has(e&&e.id)?sourceById.get(e.id).source||"":"runtime-only",status,reason:valid?"movement-evidence-and-admission-required":reason,signature:o.key});
    if(strict&&!valid)throw new Error(`canonical metadata missing or invalid: ${e&&e.id||"unknown"}`);
  }
  const duplicates=[...groups.entries()].filter(([,ids])=>ids.length>1).map(([signature,ids])=>({signature,ids}));
  return {sourceCount:Array.isArray(sourceRecords)?sourceRecords.length:listRecords.length,runtimeCount:listRecords.length,semanticUniqueCount:0,candidateSignatureCount:completeKeys.size,duplicates,observedGroups:[...observations.entries()].filter(([,ids])=>ids.length>1).map(([signature,ids])=>({signature,ids})),review,manifest};
}

module.exports={CANONICAL_FIELDS,signature,key,compare,audit,normalizeName,nameAudit};
