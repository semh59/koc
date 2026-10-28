/* npm test: runs every scripts/*.test.js (a few in parallel), prints each file's output in order and exits non-zero if any failed. */
const {spawn, spawnSync} = require("child_process"), fs = require("fs"), os = require("os"), path = require("path");
const dir = __dirname, failed = [];
if (spawnSync(process.execPath, ["--check", path.join(dir, "patch-android.js")], {stdio: "inherit"}).status) failed.push("patch-android.js (syntax)");
const runFile=(file)=>new Promise(resolve=>{
      let out="";
      const p=spawn(process.execPath,[path.join(dir,file)]);
      p.stdout.on("data",d=>out+=d);p.stderr.on("data",d=>out+=d);
      const timer=setTimeout(()=>{p.kill();resolve({out:`${out}\nTIMEOUT after 120000ms`,code:124,timeout:true})},120000);
      p.on("close",code=>{clearTimeout(timer);resolve({out,code,timeout:false})});
    });

const files = fs.readdirSync(dir).filter(f => f.endsWith(".test.js")).sort();
const results = new Array(files.length);
let next = 0;
const worker = async () => {
  while (next < files.length) {
    const i = next++;
    results[i] = await runFile(files[i]);
  }
};
(async () => {
  await Promise.all(Array.from({length: Math.min(4, os.cpus().length)}, worker));
  files.forEach((f, i) => {
    console.log(`\n=== ${f}\n${results[i].out}`);
    if (results[i].code) failed.push(f);
  });
  console.log(`\n${files.length} test files, ${failed.length} failed${failed.length ? ": " + failed.join(", ") : ""}`);
  process.exit(failed.length ? 1 : 0);
})();
