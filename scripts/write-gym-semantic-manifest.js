"use strict";
const fs=require("fs"),path=require("path");
const Semantic=require("./gym-catalog-semantic.js");
const root=path.join(__dirname,"..");
const ex=require(path.join(root,"www/modules/gym/exlib.js"));
require(path.join(root,"www/modules/gym/balance.js"));
const source=fs.readFileSync(path.join(__dirname,"exlib-src.txt"),"utf8").split(/\r?\n/)
  .filter(x=>x&&!x.startsWith("#")&&x.includes("|"))
  .map((line,i)=>{const p=line.split("|");return {sourceLine:i+1,id:p[1],n:p[2],source:"scripts/exlib-src.txt"}});
const report=Semantic.audit(ex,{sourceRecords:source,strict:false});
const out={generatedAt:"B-0 audit snapshot",sourceCount:report.sourceCount,runtimeCount:report.runtimeCount,semanticUniqueCount:report.semanticUniqueCount,reviewCount:report.review.length,legacyObservedDuplicateGroups:report.duplicates.length,records:report.manifest};
fs.writeFileSync(path.join(root,"docs/analysis/gym-phase-b-semantic-manifest.json"),JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({sourceCount:out.sourceCount,runtimeCount:out.runtimeCount,semanticUniqueCount:out.semanticUniqueCount,reviewCount:out.reviewCount,records:out.records.length},null,2));
