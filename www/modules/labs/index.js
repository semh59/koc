"use strict";
Data.privacy.push(["Tahlil",()=>S.labs.length,()=>{S.labs=[]},6]);
const Labs={latest:k=>S.labs.reduce((b,l)=>l.k===k&&(!b||l.day>b.day)?l:b,undefined)};
