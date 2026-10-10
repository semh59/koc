/* File paths: script and style paths in index.html and relative import()/require() paths in code point to existing files (a moved file must not break silently). */
const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path");
const {listJs,www,read}=require("./html");
const idx=read("index.html");
const refs=[...idx.matchAll(/(?:src|href|data-src)="([^"#:]+\.(?:js|css|png|svg))"/g)].map(m=>m[1]);
ok("index.html: every script, style and image path exists",refs.length>50&&refs.every(r=>fs.existsSync(www(r))),refs.filter(r=>!fs.existsSync(www(r))));
const miss=[];
for(const f of listJs()){
  const s=read(f);
  for(const m of s.matchAll(/import\(\s*["'](\.[^"']+)["']\s*\)/g))if(!fs.existsSync(path.join(path.dirname(www(f)),m[1])))miss.push(f+" -> "+m[1]);
  for(const m of s.matchAll(/require\(\s*["'](\.[^"']+)["']\s*\)/g))if(!fs.existsSync(path.join(path.dirname(www(f)),m[1])))miss.push(f+" -> "+m[1]);
}
ok("relative import() and require() paths in code exist",!miss.length,miss);
const listed=new Set(refs);
const unlisted=listJs().filter(f=>!listed.has(f));
ok("every app script is loaded by index.html",!unlisted.length,unlisted);
finish();
