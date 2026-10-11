/* Module boundary: only files in the owning module's folder (www/modules/<module>/) and the core (main/, kernel/) touch an S field directly.
   Other files get that data through the module's API. */
const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path");
const {www,listJs,read,stripComments}=require("./html");
const {scan}=require("./deps");
const Modules=require(www("kernel/modules.js"));
const keyOwner={};for(const [id,m] of Object.entries(Modules))for(const k of m.keys)keyOwner[k]={id,owners:m.owners||[]};
const violations=new Set();
for(const f of listJs()){
  if(f.startsWith("kernel/"))continue;
  for(const [,key] of stripComments(read(f)).matchAll(/(?<![.\w])S\.([a-zA-Z_]\w*)/g)){
    const o=keyOwner[key];
    if(o&&!f.startsWith("modules/"+o.id+"/")&&!o.owners.includes(f))violations.add(key+" <- "+f);
  }
}
ok("no file outside the owning module touches its S field (the core in main/ goes through the module api too)",!violations.size,[...violations]);
const cross=scan();
ok("no module uses another module's internal name: only its index.js names, XxxLib namespaces and the api list in kernel/modules.js",!cross.length,cross);
ok("every module has an index.js",Object.keys(Modules).every(id=>fs.existsSync(www("modules/"+id+"/index.js"))));
finish();
