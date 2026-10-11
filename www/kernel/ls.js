"use strict";
/* Safe localStorage access and the native key vault, shared by every module (a failed read is null, a failed write is ignored). */
const lsGet=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}};
const lsDel=k=>{try{localStorage.removeItem(k)}catch(e){}};
const KV=()=>plugin("KeyVault");
