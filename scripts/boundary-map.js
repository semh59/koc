/* Developer tool: which file touches which data field (S.*) and which names of other files. Writes docs/boundary-map.md. */
const fs=require("fs"),path=require("path");
const {read,listJs,stripComments}=require("./html");
const files=listJs();
const src=Object.fromEntries(files.map(f=>[f,stripComments(read(f))]));
const defs=Object.create(null);
for(const [f,s] of Object.entries(src))for(const m of s.matchAll(/^(?:async\s+)?(?:function\s*\*?\s*|const\s+|let\s+|var\s+)([A-Za-z_$][\w$]*)/gm))(defs[m[1]]??=new Set()).add(f);
const fields=Object.create(null);
for(const [f,s] of Object.entries(src))for(const m of s.matchAll(/\bS\.([a-zA-Z_]\w*)/g))(fields[m[1]]??={})[f]=(fields[m[1]][f]||0)+1;
const own=Object.fromEntries(files.map(f=>[f,new Set()]));
for(const [n,owners] of Object.entries(defs))for(const f of owners)own[f].add(n);
let out="# Sınır haritası (otomatik: node scripts/boundary-map.js)\n\n## Veri alanı -> dokunan dosyalar\n| S alanı | dosya sayısı | dosyalar |\n|---|---|---|\n";
for(const [k,v] of Object.entries(fields).sort((a,b)=>Object.keys(b[1]).length-Object.keys(a[1]).length))out+=`| ${k} | ${Object.keys(v).length} | ${Object.keys(v).join(", ")} |\n`;
out+="\n## Dosya -> başka dosyalardan kullandığı adlar (sayı)\n| dosya | dışa bağımlı ad | tanımladığı ad |\n|---|---|---|\n";
for(const f of files){
  const used=new Set();
  for(const w of new Set(src[f].match(/[A-Za-z_$][\w$]*/g)))if(defs[w]&&!defs[w].has(f))used.add(w);
  out+=`| ${f} | ${used.size} | ${own[f].size} |\n`;
}
fs.writeFileSync(path.join(__dirname,"../docs/boundary-map.md"),out);
console.log(out.split("\n").slice(0,40).join("\n"));
