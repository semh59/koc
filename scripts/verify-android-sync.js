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
const resourceSource=path.join(root,"assets","android","res"),resourceTarget=path.join(root,"android","app","src","main","res");
if (!fs.existsSync(resourceSource)||!fs.existsSync(resourceTarget)) throw new Error("native resource directory missing");
  const a=tree(resourceSource),b=tree(resourceTarget);
  for (const name of a) {
    if (!b.includes(name)) throw new Error(`native resource missing: ${name}`);
    if (!fs.readFileSync(path.join(resourceSource,name)).equals(fs.readFileSync(path.join(resourceTarget,name)))) throw new Error(`native resource differs: ${name}`);
  }
  for (const name of b) if (!a.includes(name) && name!=="values\\styles.xml") throw new Error(`unexpected generated resource: ${name}`);
  console.log(`Native source/resource sync verified: ${sources.length} Java files, ${a.length} source resources.`);
