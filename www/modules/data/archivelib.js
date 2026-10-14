"use strict";
/* Full data archive: everything the user has entered, as one readable JSON file (no DOM). Separate from the encrypted backup; it has no API keys, no photos, no provider list and no cycle record. */
const ArchiveLib=(()=>{
  const SKIP=new Set(["providers","cycle","cycleSym"]); // the cycle record stays in the encrypted backup only, like the CSV files
  const mod=typeof Modules!=="undefined"?Modules:require("../../kernel/modules.js");
  /* What the file leaves out, in words for the screen that offers it. */
  const LEFT_OUT="API anahtarları ve sağlayıcı listesi, fotoğraflar, döngü kaydı ve döngü ayarları, hamilelik ve emzirme bilgisi, sağlık notu, yakının telefonu, konum, güvenlik uyarısı tercihleri ve rıza kayıtları";
  /* S: the state; date: "YYYY-MM-DD"; tables: optional {csv key: csv text}, added as they are. Returns {json, counts} where counts is the number of records per module (arrays only). */
  /* Settings that stay on the phone: the policy says they are not sent or shared anywhere. */
  const PRIVATE=new Set(["medNear","healthNote","ramLat","ramLon","ramName","ramMedsRef","pregnant","pregAt","nursing","edFlag","riskOff","riskClearedAt","consentAt","consentP","cycleOn","cycleRem"]);
  function build(S,date,tables){
    const modules={},counts={};
    for(const [id,m] of Object.entries(mod)){
      const o={};let n=0;
      for(const k of m.keys){if(SKIP.has(k)||S[k]===undefined)continue;o[k]=S[k];if(Array.isArray(S[k]))n+=S[k].length}
      modules[id]=o;counts[id]=n;
    }
    return {json:JSON.stringify({schema:1,app:"NeoWell",exportedAt:date,settings:Object.fromEntries(Object.entries(S.settings||{}).filter(([k])=>!PRIVATE.has(k))),modules,...tables&&{tables}}),counts,total:Object.values(counts).reduce((a,b)=>a+b,0)};
  }
  return {build,LEFT_OUT};
})();
if(typeof module!=="undefined")module.exports=ArchiveLib;
