"use strict";
const fs=require("fs"),path=require("path");
const Semantic=require("./gym-catalog-semantic.js");
const root=path.join(__dirname,"..");
const ex=require(path.join(root,"www/modules/gym/exlib.js"));
require(path.join(root,"www/modules/gym/balance.js"));
const source=fs.readFileSync(path.join(__dirname,"exlib-src.txt"),"utf8").split(/\r?\n/)
  .filter(x=>x&&!x.startsWith("#")&&x.includes("|"))
  .map((line,i)=>{const p=line.split("|");return {sourceLine:i+1,id:p[1],n:p[2],source:"scripts/exlib-src.txt"}});
const name=Semantic.nameAudit(ex);
const semantic=Semantic.audit(ex,{sourceRecords:source,strict:false});
const legacy=semantic.duplicates;
const out={
  generatedAt:"B-1 candidate audit snapshot",
  sourceCount:semantic.sourceCount,
  runtimeCount:semantic.runtimeCount,
  semanticUniqueCount:semantic.semanticUniqueCount,
  reviewCount:semantic.review.length,
  nameExactCandidateGroups:name.exact,
  legacyObservedDuplicateGroups:legacy.length,
  legacyObservedGroups:legacy,
  decision:"No automatic merge or unique-count increase; all records require canonical metadata review"
};
fs.writeFileSync(path.join(root,"docs/analysis/gym-phase-b-semantic-audit.json"),JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify({sourceCount:out.sourceCount,runtimeCount:out.runtimeCount,semanticUniqueCount:out.semanticUniqueCount,reviewCount:out.reviewCount,nameExactCandidateGroups:out.nameExactCandidateGroups.length,legacyObservedDuplicateGroups:out.legacyObservedDuplicateGroups},null,2));
