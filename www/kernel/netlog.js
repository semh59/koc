"use strict";
/* What NeoWell itself sent to the internet: time, kind, host, body size and result. Content is never stored, and the log stays on this phone (not in the backup). */
const NetLog=(()=>{
  const KEY="nw_netlog",MAX=100,DAYS=30,TIMEOUT_MS=1e4;
  const read=()=>{
    try{const a=JSON.parse(localStorage.getItem(KEY));return Array.isArray(a)?a.filter(x=>x&&Number.isFinite(x.t)&&typeof x.kind==="string"&&typeof x.host==="string"):[]}catch{return []}
  };
  function add(row){
    const cut=Date.now()-DAYS*864e5;
    try{localStorage.setItem(KEY,JSON.stringify(read().filter(x=>x.t>=cut).concat(row).slice(-MAX)))}catch{}
  }
  /* window.fetch is looked up at call time so a replaced fetch (tests, polyfills) is used. A caller that brings its own signal (Coach) keeps its own time limit; every other request stops after 10 s, body read included. */
  async function fetchLogged(kind,url,init){
    const row={t:Date.now(),kind,host:new URL(url).host,out:init&&typeof init.body==="string"?new TextEncoder().encode(init.body).length:0};
    try{const r=await window.fetch(url,init?.signal?init:{...init,signal:AbortSignal.timeout(TIMEOUT_MS)});add({...row,ok:r.ok});return r}
    catch(e){add({...row,ok:false});throw e}
  }
  const clear=()=>{try{localStorage.removeItem(KEY)}catch{}};
  return {KEY,fetch:fetchLogged,read,clear,recent:()=>{const cut=Date.now()-DAYS*864e5;return read().filter(x=>x.t>=cut)}};
})();
if(typeof module!=="undefined")module.exports=NetLog;
