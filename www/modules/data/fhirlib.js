"use strict";
/* FHIR R4 export: blood pressure (LOINC 85354-9 panel with 8480-6 / 8462-4 components), body weight (29463-7) and home glucose (41653-7, capillary blood by glucometer) as one Bundle of Observations (no DOM).
   A format conversion of the person's own entries: no interpretation, no name, no identifier. The codes were looked up on the HL7 terminology server and the blood pressure and weight observations carry the standard profiles; the bundle passed the public HAPI R4 validator without errors. */
const FhirLib=(()=>{
  const LOINC="http://loinc.org",UCUM="http://unitsofmeasure.org",CAT="http://terminology.hl7.org/CodeSystem/observation-category";
  const category=[{coding:[{system:CAT,code:"vital-signs"}]}],lab=[{coding:[{system:CAT,code:"laboratory"}]}];
  const uuid=n=>"urn:uuid:00000000-0000-4000-8000-"+String(n).padStart(12,"0");
  const pad=n=>String(n).padStart(2,"0");
  /* offMin: minutes east of UTC at that moment (Turkey: 180); FHIR requires the offset when a time is given. */
  const when=(day,time,offMin)=>{const a=Math.abs(offMin);return `${day}T${time}:00${offMin<0?"-":"+"}${pad(Math.floor(a/60))}:${pad(a%60)}`};
  const q=(value,unit,code)=>({value,unit,system:UCUM,code});
  /* vitals: S.vitals rows; weights: {day: kg}; off(day,time): offset minutes; ctxName(row): the measurement moment text of a glucose row (optional). */
  function build(vitals,weights,off,ctxName){
    const subject={reference:uuid(1)},entry=[{fullUrl:uuid(1),resource:{resourceType:"Patient",id:"p1"}}];
    let n=1,bp=0,wt=0,gl=0;
    const add=r=>{n++;entry.push({fullUrl:uuid(n),resource:{resourceType:"Observation",id:"o"+n,status:"final",category,subject,...r}})};
    for(const v of (vitals||[]).filter(x=>x.k==="t").sort((a,b)=>(a.day+a.time<b.day+b.time?-1:1))){
      add({meta:{profile:["http://hl7.org/fhir/StructureDefinition/bp"]},code:{coding:[{system:LOINC,code:"85354-9"}],text:"Kan basıncı"},effectiveDateTime:when(v.day,v.time,off(v.day,v.time)),component:[
        {code:{coding:[{system:LOINC,code:"8480-6"}],text:"Sistolik"},valueQuantity:q(v.sys,"mmHg","mm[Hg]")},
        {code:{coding:[{system:LOINC,code:"8462-4"}],text:"Diyastolik"},valueQuantity:q(v.dia,"mmHg","mm[Hg]")}]});
      bp++;
    }
    for(const d of Object.keys(weights||{}).sort()){
      add({meta:{profile:["http://hl7.org/fhir/StructureDefinition/bodyweight"]},code:{coding:[{system:LOINC,code:"29463-7"}],text:"Vücut ağırlığı"},effectiveDateTime:d,valueQuantity:q(weights[d],"kg","kg")});
      wt++;
    }
    for(const v of (vitals||[]).filter(x=>x.k==="s").sort((a,b)=>(a.day+a.time<b.day+b.time?-1:1))){
      const c=ctxName&&ctxName(v);
      add({category:lab,code:{coding:[{system:LOINC,code:"41653-7"}],text:"Kan şekeri"},effectiveDateTime:when(v.day,v.time,off(v.day,v.time)),valueQuantity:q(v.g,"mg/dL","mg/dL"),...(c?{note:[{text:c}]}:{})});
      gl++;
    }
    return {json:JSON.stringify({resourceType:"Bundle",type:"collection",entry}),bp,weight:wt,glucose:gl,total:bp+wt+gl};
  }
  return {build};
})();
if(typeof module!=="undefined")module.exports=FhirLib;
