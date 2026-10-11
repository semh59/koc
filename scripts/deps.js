/* Cross-module reference scan shared by boundary.test.js and boundary-map.js.
   A module file may use another module's top-level name only if that name is public: defined in the owner's index.js, or an XxxLib namespace.
   Code is stripped of comments and string text first, so words inside messages do not count as references. */
const {listJs,read,www}=require("./html");
const Modules=require(www("kernel/modules.js"));

/* Removes comments, string and regex-free template text; keeps ${...} expressions. Not a full parser: enough for this code base's style. */
function code(src){
  let o="",i=0;const n=src.length,st=[{m:"c",d:0}];
  while(i<n){
    const t=st[st.length-1],c=src[i],d=src[i+1];
    if(t.m==="t"){
      if(c==="\\"){i+=2;continue}
      if(c==="`"){st.pop();i++;continue}
      if(c==="$"&&d==="{"){st.push({m:"c",d:0});i+=2;o+=" ";continue}
      i++;continue;
    }
    if(c==="/"&&d==="*"){const j=src.indexOf("*/",i+2);i=j<0?n:j+2;o+=" ";continue}
    if(c==="/"&&d==="/"&&src[i-1]!==":"){const j=src.indexOf("\n",i);i=j<0?n:j;continue}
    if(c==="'"||c==='"'){let j=i+1;while(j<n&&src[j]!==c&&src[j]!=="\n"){if(src[j]==="\\")j++;j++}i=j+1;o+=" ";continue}
    if(c==="`"){st.push({m:"t"});i++;o+=" ";continue}
    if(c==="{")t.d++;
    else if(c==="}"){if(!t.d&&st.length>1){st.pop();i++;o+=" ";continue}t.d--}
    o+=c;i++;
  }
  return o;
}
const owner=f=>f.startsWith("modules/")?f.split("/")[1]:f.startsWith("main/")?"main":"kernel";
const idents=s=>new Set(s.match(/[A-Za-z_$][\w$]*/g)||[]);

function scan(){
  const files=listJs(),src={},defs=Object.create(null);
  for(const f of files){
    src[f]=code(read(f));
    for(const m of src[f].matchAll(/^(?:async\s+)?(?:function\s*\*?\s*([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*))/gm)){const n=m[1]||m[2];(defs[n]=defs[n]||[]).push(f)}
  }
  const isPublic=(n,f)=>/Lib$/.test(n)||f.endsWith("/index.js")||((Modules[owner(f)]||{}).api||[]).includes(n);
  const out=[];
  for(const f of files){
    const o=owner(f);if(o==="main"||o==="kernel")continue;
    for(const id of idents(src[f])){
      const d=defs[id];if(!d||d.includes(f)||d.some(x=>owner(x)===o))continue;
      const mods=d.filter(x=>owner(x)!=="main"&&owner(x)!=="kernel");if(!mods.length||mods.every(x=>isPublic(id,x)))continue;
      const q=id.replace(/\$/g,"\\$");
      if(new RegExp("(?:const|let|var|function)\\s+"+q+"\\b|[(,]\\s*"+q+"\\s*[,)=]|\\{[^}]*\\b"+q+"\\b[^}]*\\}\\s*=").test(src[f]))continue;
      out.push(f+" -> "+id+" ("+mods.map(owner).join(",")+")");
    }
  }
  return out.sort();
}
module.exports={code,scan,owner};
