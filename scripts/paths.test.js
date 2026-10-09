/* Dosya yolları: index.html'deki betik ve stil yolları ile kod içindeki göreli import() yolları var olan dosyaya çıkar (dosya taşıyınca sessizce kırılmasın). */
const fs=require("fs"),path=require("path");
const {listJs,www,read}=require("./html");
let bad=0;const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const idx=read("index.html");
const refs=[...idx.matchAll(/(?:src|href|data-src)="([^"#:]+\.(?:js|css|png|svg))"/g)].map(m=>m[1]);
ok("index.html: tüm betik, stil ve görsel yolları var",refs.length>50&&refs.every(r=>fs.existsSync(www(r))),refs.filter(r=>!fs.existsSync(www(r))));
const miss=[];
for(const f of listJs()){
  const s=read(f);
  for(const m of s.matchAll(/import\(\s*["'](\.[^"']+)["']\s*\)/g))if(!fs.existsSync(path.join(path.dirname(www(f)),m[1])))miss.push(f+" -> "+m[1]);
  for(const m of s.matchAll(/require\(\s*["'](\.[^"']+)["']\s*\)/g))if(!fs.existsSync(path.join(path.dirname(www(f)),m[1])))miss.push(f+" -> "+m[1]);
}
ok("kod içi göreli import() ve require() yolları var",!miss.length,miss);
const listed=new Set(refs);
const unlisted=listJs().filter(f=>!f.startsWith("main/")&&!listed.has(f));
ok("her uygulama betiği index.html'de yüklenir",unlisted.every(f=>/^kernel\/modules\.js$/.test(f)===false||true)&&unlisted.length===0,unlisted);
console.log(bad?bad+" başarısız":"Tüm yol testleri geçti");process.exit(bad?1:0);
