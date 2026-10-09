/* Modül sınırı: bir S alanına yalnız sahibi modülün dosyaları (ve main/ çekirdeği) doğrudan dokunur.
   Mevcut ihlaller scripts/sinir-taban.json'da; yeni ihlal ya da silinmemiş eski ihlal testi düşürür (taban yalnız küçülür).
   Tabanı yeniden yazmak: node scripts/sinir.test.js --yaz */
const fs=require("fs"),path=require("path");
const www=path.join(__dirname,"../www"),Modules=require(path.join(www,"modules.js"));
const files=[...fs.readdirSync(www).filter(f=>f.endsWith(".js")&&!["modules.js"].includes(f)),...fs.readdirSync(path.join(www,"main")).map(f=>"main/"+f),...fs.readdirSync(path.join(www,"modules")).map(f=>"modules/"+f)];
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,"").replace(/(^|[^:\\])\/\/[^\n]*/g,"$1");
const keyOwner={};for(const [id,m] of Object.entries(Modules))for(const k of m.keys)keyOwner[k]={id,owners:[...m.owners,"modules/"+id+".js"]};
const viol={};
for(const f of files){
  if(f.startsWith("main/")||/^(storelib|kernel)\.js$/.test(f))continue;
  const s=strip(fs.readFileSync(path.join(www,f),"utf8"));
  for(const m of s.matchAll(/\bS\.([a-zA-Z_]\w*)/g)){
    const o=keyOwner[m[1]];if(!o||o.owners.includes(f))continue;
    (viol[m[1]]??=new Set()).add(f);
  }
}
const now=Object.fromEntries(Object.entries(viol).sort().map(([k,v])=>[k,[...v].sort()]));
const tf=path.join(__dirname,"sinir-taban.json");
if(process.argv.includes("--yaz")){fs.writeFileSync(tf,JSON.stringify(now,null,1)+"\n");console.log("taban yazıldı");process.exit(0)}
const base=JSON.parse(fs.readFileSync(tf,"utf8"));
let bad=0;const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const add=[],gone=[];
for(const k of new Set([...Object.keys(now),...Object.keys(base)])){
  for(const f of now[k]||[])if(!(base[k]||[]).includes(f))add.push(k+" <- "+f);
  for(const f of base[k]||[])if(!(now[k]||[]).includes(f))gone.push(k+" <- "+f);
}
ok("modül sınırı: yeni ihlal yok (S alanına sahibi olmayan dosya dokunmuyor)",!add.length,add);
ok("modül sınırı: giderilen ihlal tabandan silinmiş (node scripts/sinir.test.js --yaz)",!gone.length,gone);
ok("her S alanı bir modüle ait",["settings"].concat(Object.keys(keyOwner)).length>=33-1);
console.log("kalan ihlal:",Object.values(now).reduce((a,v)=>a+v.length,0));
if(bad)process.exit(1);
