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
/* Veri modülleri kendi hook'larını buraya kaydeder; tüketiciler (gizlilik, CSV, geçmiş, Koç) modül alanlarını bilmez, yalnız listeyi gezer. */
const Data={privacy:[],csv:[],csvEntries:[],hist:[],histSearch:[],dayRows:[],dayWork:[]}; // privacy satırı: [ad, say, sil, sıra]
if(typeof document!=="undefined")document.addEventListener("nw:boot",()=>Data.privacy.sort((a,b)=>(a[3]??99)-(b[3]??99)));
if(typeof module!=="undefined")module.exports={Act,Data};
