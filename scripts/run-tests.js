/* npm test: runs every scripts/*.test.js (a few in parallel). Full output goes to a file; the console gets one line per file and the output of failed files only (a multi-MB write to a CI pipe killed the runner before it printed its verdict). */
const {spawn, spawnSync} = require("child_process"), fs = require("fs"), os = require("os"), path = require("path");
const dir = __dirname, failed = [];
if (spawnSync(process.execPath, ["--check", path.join(dir, "patch-android.js")], {stdio: "inherit"}).status) failed.push("patch-android.js (syntax)");
process.on("unhandledRejection", e => {console.error("FAIL unhandledRejection in test runner:", e); failed.push("unhandledRejection");});
const runFile = file => new Promise(resolve => {
  let out = "";
  const p = spawn(process.execPath, [path.join(dir, file)], {env: process.env});
  p.stdout.on("data", d => out += d); p.stderr.on("data", d => out += d);
  const timer = setTimeout(() => {p.kill(); resolve({out: `${out}\nTIMEOUT after 120000ms`, code: 124})}, 120000);
  p.on("close", code => {clearTimeout(timer); resolve({out, code})});
});
const files = fs.readdirSync(dir).filter(f => f.endsWith(".test.js")).sort();
const results = new Array(files.length);
const worker = (() => {let next = 0; return async () => {while (next < files.length) {const i = next++; results[i] = await runFile(files[i]);}}})();
Promise.all(Array.from({length: process.env.NW_TEST_SEQUENTIAL ? 1 : Math.min(4, os.cpus().length)}, worker)).then(() => {
  const log = path.join(process.env.NW_TEST_LOG_DIR || os.tmpdir(), "neowell-test-output.log");
  fs.writeFileSync(log, files.map((f, i) => `\n=== ${f}\n${results[i].out}`).join(""));
  files.forEach((f, i) => {
    const pass = (results[i].out.match(/^PASS /gm) || []).length, fail = (results[i].out.match(/^FAIL /gm) || []).length;
    if (results[i].code) failed.push(f);
    console.log(`${results[i].code ? "FAILED" : "ok    "} ${f} (PASS ${pass}, FAIL ${fail}, exit ${results[i].code})`);
  });
  for (const f of failed) {const r = results[files.indexOf(f)]; if (r) console.log(`\n=== ${f}\n${r.out.split("\n").filter(l => !l.startsWith("PASS ")).join("\n").slice(-4000)}`);}
  console.log(`\nFull output: ${log}\nRunner finished. Failed count: ${failed.length}`);
  if (failed.length) console.log("Failed files:", failed.join(", "));
  process.exitCode = failed.length ? 1 : 0;
});
