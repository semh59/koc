"use strict";
const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path"),cp=require("child_process");
const root=path.join(__dirname,".."),target=path.join(root,"android","app","src","main","java","com","neowell","app","MainActivity.java"),resource=path.join(root,"android","app","src","main","res","drawable","nw_btn_food.xml");
const run=()=>cp.spawnSync(process.execPath,[path.join(__dirname,"verify-android-sync.js")],{cwd:root,encoding:"utf8"});
if(!fs.existsSync(target)||!fs.existsSync(resource)){
  const r=cp.spawnSync(process.platform==="win32"?"npx.cmd":"npx",["cap","add","android"],{cwd:root,encoding:"utf8"});
  if(r.status) throw new Error(r.stderr||r.stdout);
}
function altered(file,fn){const old=fs.readFileSync(file);try{fs.writeFileSync(file,Buffer.concat([old,Buffer.from("\n<!-- verifier-test -->\n")]));return fn()}finally{fs.writeFileSync(file,old)}}
ok("sync verifier rejects changed Java",altered(target,()=>run().status!==0));
ok("sync verifier rejects changed resource",altered(resource,()=>run().status!==0));
const manifest=path.join(root,"android","app","src","main","AndroidManifest.xml");
ok("generated manifest carries backup postcondition",(()=>{const s=fs.readFileSync(manifest,"utf8");return /android:allowBackup="false"/.test(s)&&/fullBackupContent="@xml\/nw_backup_rules"/.test(s)&&/dataExtractionRules="@xml\/nw_data_rules"/.test(s)})());
finish();
