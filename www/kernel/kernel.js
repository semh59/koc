"use strict";
/* Core: the data-act action registry. Each module registers its own actions; the dispatcher knows no module. */
const Act=(()=>{
  const exact=new Map(),pre=[];
  return {
    on:(name,fn)=>{exact.set(name,fn)},
    onPre:(prefix,fn)=>{pre.push([prefix,fn])},
    run:a=>{const f=exact.get(a);if(f)return void f(a);const p=pre.find(([x])=>a.startsWith(x));if(p)p[1](a)}
  };
})();
/* Data modules register their hooks here; consumers (privacy, CSV, history, Coach) know no module fields and only walk the lists. */
const Data={privacy:[],csv:[],csvEntries:[],hist:[],histSearch:[],dayRows:[],dayWork:[]}; // privacy row: [label, count, clear, order]
if(typeof document!=="undefined")document.addEventListener("nw:boot",()=>Data.privacy.sort((a,b)=>a[3]-b[3]));
if(typeof module!=="undefined")module.exports={Act,Data};
