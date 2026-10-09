"use strict";
/* Çekirdek: data-act eylem kaydı. Her modül kendi eylemini kaydeder; dağıtıcı hiçbir modülü tanımaz. */
const Act=(()=>{
  const exact=new Map(),pre=[];
  return {
    on:(name,fn)=>{exact.set(name,fn)},
    onPre:(prefix,fn)=>{pre.push([prefix,fn])},
    run:a=>{const f=exact.get(a);if(f)return void f(a);const p=pre.find(([x])=>a.startsWith(x));if(p)p[1](a)}
  };
})();
if(typeof module!=="undefined")module.exports=Act;
