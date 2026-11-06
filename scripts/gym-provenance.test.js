"use strict";
const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path");
const Provenance=require("./gym-provenance.js");
const EXDB=require("../www/modules/gym/exlib.js");
const BAL=require("../www/modules/gym/balance.js");
const root=path.join(__dirname,"..");
const runtime=EXDB.slice();
const localIds=[...BAL.map(e=>e.id),"fastwalk","slowwalk"];

ok("local supplemental records keep NeoWell data provenance",(()=>{
  const rows=Provenance.recordManifest(runtime);
  return rows.filter(x=>localIds.includes(x.id)).length===8&&rows.every(x=>
    x.dataSource===(localIds.includes(x.id)?"neowell-data":"free-exercise-db-data")&&
    x.dataLicenseStatus===(localIds.includes(x.id)?"internal":"verified"));
})());

ok("unknown records cannot borrow verified dataset provenance",(()=>{
  const row=Provenance.recordManifest([{id:"unreviewed-new-record",im:0}])[0];
  return row.dataSource==="unknown"&&row.dataLicenseStatus==="unverified"&&row.decision==="review";
})());

ok("pinned dataset provenance identifies exact commit and license file",(()=>{
  const s=Provenance.SOURCES["free-exercise-db-data"];
  return !!(s&&s.commit==="f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5"&&s.sourcePath==="dist/exercises.json"&&s.license==="Unlicense"&&s.licensePath==="LICENSE.md"&&s.licenseStatus==="verified");
})());

ok("exercise image provenance stays unverified and blocked",(()=>{
  const s=Provenance.SOURCES["free-exercise-db-images"];
  return !!(s&&s.licenseStatus==="unverified"&&s.useStatus==="blocked"&&s.licenseUrl.includes("issues/2"));
})());

ok("every runtime record receives data and asset provenance",(()=>{
  const rows=Provenance.recordManifest(runtime);
  return rows.length===332&&new Set(rows.map(x=>x.id)).size===332&&rows.every((x,i)=>x.id===runtime[i].id&&x.dataSource&&x.dataLicenseStatus&&x.assetStatus&&x.decision);
})());

ok("unverified external photos cannot be accepted into a batch",(()=>{
  const rows=Provenance.recordManifest([{id:"squat",im:2},{id:"fastwalk",im:0}]);
  const photo=rows.find(x=>x.id==="squat"),figure=rows.find(x=>x.id==="fastwalk");
  return photo.assetStatus==="unverified"&&photo.decision==="review"&&figure.assetStatus==="not_applicable"&&figure.decision==="eligible";
})());

ok("source manifest contains no live credential or invented license claim",(()=>{
  const text=JSON.stringify(Provenance.SOURCES);
  return !/(api[_-]?key|token|password|secret|connectionstring)/i.test(text)&&!/public domain.*images/i.test(text);
})());

ok("uncertain source photos are not rendered in exercise detail",(()=>{
  const context={gEx:id=>runtime.find(e=>e.id===id),exDef:()=>({frames:[]}),EXCUE:{},gActive:()=>null,esc:s=>s,exLv:s=>s,exHistLine:()=>"",exCharts:()=>"",FigLib:{svg:()=>'<svg data-neowell-figure="true"></svg>'},setInterval:()=>0};
  require("vm").createContext(context);
  require("vm").runInContext(fs.readFileSync(path.join(root,"www/modules/gym/exui.js"),"utf8"),context);
  let html="";Object.assign(context,{openSheet:s=>{html=s},exDef:()=>({frames:[]}),exHistLine:()=>"",exCharts:()=>""});
  context.exSheet("squat");
  return html.includes('data-neowell-figure="true"')&&!/<img\b|exph|kamu malı/.test(html);
})());

ok("committed provenance manifest matches runtime and source registry",(()=>{
  const m=JSON.parse(fs.readFileSync(path.join(root,"docs/analysis/gym-phase-b-provenance.json"),"utf8"));
  return JSON.stringify(m.sources)===JSON.stringify(Provenance.SOURCES)&&
    JSON.stringify(m.records)===JSON.stringify(Provenance.recordManifest(runtime))&&
    m.counts.source===324&&m.counts.local===8&&m.counts.runtime===runtime.length&&m.counts.accepted_new_records===0;
})());

finish();
