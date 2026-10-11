"use strict";
/* FHIR R4 export: blood pressure (LOINC 85354-9 panel with 8480-6 / 8462-4 components) and body weight (29463-7) as one Bundle of Observations (no DOM).
   A format conversion of the person's own entries: no interpretation, no name, no identifier. Glucose is left out (its code is not confirmed against the vital-signs profile). */
const FhirLib=(()=>{
  const LOINC="http://loinc.org",UCUM="http://unitsofmeasure.org",CAT="http://terminology.hl7.org/CodeSystem/observation-category";
  const category=[{coding:[{system:CAT,code:"vital-signs"}]}];
  const uuid=n=>"urn:uuid:00000000-0000-4000-8000-"+String(n).padStart(12,"0");
  const pad=n=>String(n).padStart(2,"0");
  /* offMin: minutes east of UTC at that moment (Turkey: 180); FHIR requires the offset when a time is given. */
  const when=(day,time,offMin)=>{const a=Math.abs(offMin);return `${day}T${time}:00${offMin<0?"-":"+"}${pad(Math.floor(a/60))}:${pad(a%60)}`};
  const q=(value,unit,code)=>({value,unit,system:UCUM,code});
  /* vitals: S.vitals rows; weights: {day: kg}; off(day,time): offset minutes. */
  function build(vitals,weights,off){
    const subject={reference:uuid(1)},entry=[{fullUrl:uuid(1),resource:{resourceType:"Patient",id:"p1"}}];
    let n=1,bp=0,wt=0;
    const add=r=>{n++;entry.push({fullUrl:uuid(n),resource:{resourceType:"Observation",id:"o"+n,status:"final",category,subject,...r}})};
    for(const v of (vitals||[]).filter(x=>x.k==="t").sort((a,b)=>(a.day+a.time<b.day+b.time?-1:1))){
      add({code:{coding:[{system:LOINC,code:"85354-9"}],text:"Kan basıncı"},effectiveDateTime:when(v.day,v.time,off(v.day,v.time)),component:[
        {code:{coding:[{system:LOINC,code:"8480-6"}],text:"Sistolik"},valueQuantity:q(v.sys,"mmHg","mm[Hg]")},
        {code:{coding:[{system:LOINC,code:"8462-4"}],text:"Diyastolik"},valueQuantity:q(v.dia,"mmHg","mm[Hg]")}]});
      bp++;
    }
    for(const d of Object.keys(weights||{}).sort()){
      add({code:{coding:[{system:LOINC,code:"29463-7"}],text:"Vücut ağırlığı"},effectiveDateTime:d,valueQuantity:q(weights[d],"kg","kg")});
      wt++;
    }
    return {json:JSON.stringify({resourceType:"Bundle",type:"collection",entry}),bp,weight:wt,total:bp+wt};
  }
  return {build};
})();
if(typeof module!=="undefined")module.exports=FhirLib;
