"use strict";

const CANONICAL_FIELDS=[
  "pattern","primary_joints","rom","unilateral","stance","load_mode",
  "equipment_role","direction","tempo_mode","target_region","start_end"
];

const text=v=>String(v==null?"":v).trim().toLowerCase();
const EQUIPMENT_WORDS=new Set(["barbell","dumbbell","kettlebell","medicine","ball","cable","machine","smith","band","bands","ez","plate","plates","bodyweight","body","kg","lbs","lb"]);
const normalizeName=v=>text(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]+/g," ").trim().split(/\s+/).filter(x=>!EQUIPMENT_WORDS.has(x)).join(" ");
const list=v=>Array.isArray(v)?v.map(text).filter(Boolean):v==null?[]:[text(v)].filter(Boolean);
const canon=v=>{
  const c=v&&typeof v==="object"&&v.canonical&&typeof v.canonical==="object"?v.canonical:v||{};
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
const validToken=(k,v)=>ENUMS[k]?ENUMS[k].has(v):SLUG.test(v);
const validCanonical=c=>CANONICAL_FIELDS.every(k=>c[k].length>0&&c[k].every(v=>validToken(k,v)));
const present=c=>CANONICAL_FIELDS.every(k=>c[k].length>0);
const complete=c=>present(c)&&validCanonical(c);
const sorted=o=>Object.fromEntries(Object.keys(o).sort().map(k=>[k,o[k]]));

/* Conservative observable fallback: enough to find exact duplicates in the legacy
   catalog, never enough to declare an incomplete record semantically distinct. */
function observed(e){
  const c=canon(e),hasCanonical=complete(c),valid=present(c)&&validCanonical(c);
  const pattern=c.pattern[0]||text(e.tp);
  const region=c.target_region[0]||text(e.r);
  const equipment=text(e.pr);
  const key=hasCanonical?JSON.stringify(sorted(c)):JSON.stringify(sorted({pattern,region,kind:text(e.k),equipment}));
  return {key,hasCanonical,validCanonical:valid,presentCanonical:present(c),c};
}

function signature(e){
  const o=observed(e);
  return o.hasCanonical?sorted(o.c):JSON.parse(o.key);
}
function key(sig){return JSON.stringify(sorted(sig||{}));}

function compare(a,b){
  const aa=observed(a),bb=observed(b);
  if(aa.key===bb.key)return {status:"duplicate",distinct:false,key:aa.key};
  const ac=aa.c,bc=bb.c;
  if(aa.hasCanonical&&bb.hasCanonical&&aa.validCanonical&&bb.validCanonical){
    const sameCore=["pattern","primary_joints","rom","stance","load_mode","direction","tempo_mode","target_region","start_end"]
      .every(k=>JSON.stringify(ac[k])===JSON.stringify(bc[k]));
    if(!sameCore)return {status:"distinct",distinct:true,key:aa.key};
    return ac.unilateral[0]===bc.unilateral[0]?{status:"review",distinct:false,key:aa.key,reason:"equipment-only-or-insufficient-difference"}:{status:"distinct",distinct:true,key:aa.key};
  }
  const sameObserved=ac.pattern[0]===bc.pattern[0]&&ac.target_region[0]===bc.target_region[0]&&text(a.k)===text(b.k);
  return sameObserved?{status:"review",distinct:false,key:aa.key,reason:"incomplete-canonical-metadata"}:{status:"review",distinct:false,key:aa.key,reason:"incomplete-canonical-metadata"};
}

function nameAudit(records){
  const groups=new Map(),listRecords=Array.isArray(records)?records:[];
  for(const e of listRecords){const n=normalizeName(e&&e.n);if(!groups.has(n))groups.set(n,[]);groups.get(n).push(e&&e.id||"")}
  const exact=[...groups.entries()].filter(([name,ids])=>name&&ids.length>1).map(([name,ids])=>({name,ids}));
  return {exact,near:[],semanticUniqueCount:0,review:listRecords.map(e=>({id:e&&e.id||"",status:"review",reason:"canonical-metadata-required"}))};
}

function audit(records,{sourceRecords=records,strict=false}={}){
  const listRecords=Array.isArray(records)?records:[];
  const sourceById=new Map((Array.isArray(sourceRecords)?sourceRecords:[]).map(x=>[x.id,x]));
  const groups=new Map(),review=[],completeKeys=new Set(),manifest=[];
  for(const e of listRecords){
    const o=observed(e),valid=o.presentCanonical&&o.validCanonical;
    const status=valid?"candidate":"review",reason=!o.presentCanonical?"incomplete-canonical-metadata":"invalid-canonical-metadata";
    if(!valid)review.push({id:e&&e.id||"",status:"review",reason});
    else completeKeys.add(o.key);
    if(!groups.has(o.key))groups.set(o.key,[]);
    groups.get(o.key).push(e&&e.id||"");
    manifest.push({id:e&&e.id||"",source:sourceById.has(e&&e.id)?sourceById.get(e.id).source||"":"runtime-only",status,reason:valid?"":reason,signature:o.key});
    if(strict&&!valid)throw new Error(`canonical metadata missing or invalid: ${e&&e.id||"unknown"}`);
  }
  const duplicates=[...groups.entries()].filter(([,ids])=>ids.length>1).map(([signature,ids])=>({signature,ids}));
  return {sourceCount:Array.isArray(sourceRecords)?sourceRecords.length:listRecords.length,runtimeCount:listRecords.length,semanticUniqueCount:completeKeys.size,duplicates,review,manifest};
}

module.exports={CANONICAL_FIELDS,signature,key,compare,audit,normalizeName,nameAudit};
