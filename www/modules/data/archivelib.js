"use strict";
/* Full data archive: everything the user has entered, as one readable JSON file (no DOM). Separate from the encrypted backup; it has no API keys, no photos, no provider list and no cycle record. */
const ArchiveLib=(()=>{
  const SKIP=new Set(["providers","cycle"]); // the cycle record stays in the encrypted backup only, like the CSV files
  const mod=typeof Modules!=="undefined"?Modules:require("../../kernel/modules.js");
  /* S: the state; date: "YYYY-MM-DD". Returns {json, counts} where counts is the number of records per module (arrays only). */
  function build(S,date){
    const modules={},counts={};
    for(const [id,m] of Object.entries(mod)){
      const o={};let n=0;
      for(const k of m.keys){if(SKIP.has(k)||S[k]===undefined)continue;o[k]=S[k];if(Array.isArray(S[k]))n+=S[k].length}
      modules[id]=o;counts[id]=n;
    }
    return {json:JSON.stringify({schema:1,app:"NeoWell",exportedAt:date,settings:S.settings,modules}),counts,total:Object.values(counts).reduce((a,b)=>a+b,0)};
  }
  return {build};
})();
if(typeof module!=="undefined")module.exports=ArchiveLib;
