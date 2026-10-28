/* Dead code gate: every function or arrow function defined under www/ must be referenced somewhere else in www/. www/ files share one global scope, so a per-file linter cannot see this. */
const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path");

function walk(dir,out=[]){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    if(e.name==="vendor")continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p,out);else if(/\.(js|html)$/.test(e.name))out.push(p);
  }
  return out;
}
const FN=/(?:^|[;\s}])(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g;
const ARROW=/(?:^|[;\s{}])(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g;
const count=(text,name)=>text.match(new RegExp(`(?<![\\w$])${name.replace(/\$/g,"\\$")}(?![\\w$])`,"g"))?.length||0;

function findUnused(sources,testText,allowed=new Set()){
  const all=sources.join("\n"),names=new Set();
  for(const re of [FN,ARROW])for(const src of sources)for(const m of src.matchAll(re))names.add(m[1]);
  const bad=[];
  for(const n of names){
    if(count(all,n)>1)continue;
    if(allowed.has(n)&&count(testText,n)>0)continue;
    bad.push(n);
  }
  return bad.sort();
}

const root=path.join(__dirname,"..");
const read=f=>fs.readFileSync(f,"utf8");
const tests=fs.readdirSync(__dirname).filter(f=>/\.js$/.test(f)).map(f=>read(path.join(__dirname,f))).join("\n");
const unused=findUnused(walk(path.join(root,"www")).map(read),tests);
ok("every function under www/ is used by something other than its own definition"+(unused.length?`: ${unused.join(", ")}`:""),unused.length===0);
ok("an unused function is detected",findUnused(["function used(){}\nfunction unused(){}\nused();"],"").join()==="unused");
ok("an unused arrow function is detected",findUnused(["const gone=()=>1;\nconst kept=()=>2;\nkept();"],"").join()==="gone");
ok("a function only called from tests is detected unless allowed",findUnused(["function onlyTest(){}"],"onlyTest()",new Set()).join()==="onlyTest");
finish();
