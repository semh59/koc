"use strict";
Data.privacy.push(["Tahlil",()=>S.labs.length,()=>{S.labs=[]},6]);
const Tahlil={latest:k=>S.labs.filter(l=>l.k===k&&l.v!=null).sort((x,y)=>x.day<y.day?1:-1)[0]};
