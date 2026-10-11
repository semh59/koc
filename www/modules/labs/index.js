"use strict";
Data.privacy.push(["Tahlil",()=>S.labs.length,()=>{S.labs=[]},6]);
const Labs={count:()=>S.labs.length,pages:()=>labPdfPages(),all:()=>S.labs,latest:k=>S.labs.reduce((b,l)=>l.k===k&&(!b||l.day>b.day)?l:b,undefined)};
