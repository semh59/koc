"use strict";
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const sourceDir = path.join(root, "assets", "android");
const targetDir = path.join(root, "android", "app", "src", "main", "java", "com", "neowell", "app");
const java = dir => fs.readdirSync(dir).filter(f => f.endsWith(".java")).sort();
const tree = dir => {
  const out=[];
  for (const name of fs.readdirSync(dir)) {
    const p=path.join(dir,name);
    if (fs.statSync(p).isDirectory()) for (const child of tree(p)) out.push(path.join(name,child));
    else out.push(name);
  }
  return out.sort();
};

if (!fs.existsSync(targetDir)) throw new Error(`generated Android source directory is missing: ${targetDir}`);
if (!fs.existsSync(path.join(root,"android","app","src","main","AndroidManifest.xml"))) throw new Error("generated Android manifest is missing");
const sources = java(sourceDir), targets = java(targetDir);
if (sources.length !== targets.length || sources.some((f, i) => f !== targets[i])) {
  throw new Error(`native source inventory mismatch\nassets: ${sources.join(", ")}\ngenerated: ${targets.join(", ")}`);
}
for (const name of sources) {
  const a = fs.readFileSync(path.join(sourceDir, name));
  const b = fs.readFileSync(path.join(targetDir, name));
  if (!a.equals(b)) throw new Error(`native source differs: ${name}`);
}
const publicSource=path.join(root,"www"),publicTarget=path.join(root,"android","app","src","main","assets","public"),webFiles=["main/01-core.js","modules/coach/coach.js"];
const resourceSource=path.join(root,"assets","android","res"),resourceTarget=path.join(root,"android","app","src","main","res");
if (!fs.existsSync(resourceSource)||!fs.existsSync(resourceTarget)) throw new Error("native resource directory missing");
  const a=tree(resourceSource),b=tree(resourceTarget);
          const norm=p=>p.split(path.sep).join("/");
          const aNorm=a.map(norm),bNorm=b.map(norm);
          for (const name of aNorm) {
            if (!bNorm.includes(name)) throw new Error(`native resource missing: ${name}`);
            const src=path.join(resourceSource,name.split("/").join(path.sep));
            const tgt=path.join(resourceTarget,name.split("/").join(path.sep));
            if (!fs.readFileSync(src).equals(fs.readFileSync(tgt))) throw new Error(`native resource differs: ${name}`);
          }
          const patchOwned=new Set(fs.readdirSync(resourceSource).flatMap(f=>{const p=path.join(resourceSource,f);return fs.statSync(p).isDirectory()?tree(p).map(c=>norm(f+"/"+c)):norm(f)}));
          const capacitorDefaults=new Set(["drawable-v24/ic_launcher_foreground.xml","mipmap-anydpi-v26/ic_launcher.xml","mipmap-anydpi-v26/ic_launcher_round.xml","drawable/ic_launcher_background.xml","layout/activity_main.xml","values/strings.xml","values/styles.xml","xml/config.xml","xml/file_paths.xml"]);
          for (const name of bNorm) if (!patchOwned.has(name) && !capacitorDefaults.has(name)) throw new Error(`native target-only orphan resource: ${name}`);
  for (const name of webFiles) {
    const a=fs.readFileSync(path.join(publicSource,name)),b=fs.readFileSync(path.join(publicTarget,name));
    if (!a.equals(b)) throw new Error(`web asset differs: ${name}`);
  }
  console.log(`Native source/resource/web sync verified: ${sources.length} Java files, ${a.length} source resources, ${webFiles.length} web assets.`);
