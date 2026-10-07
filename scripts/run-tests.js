// npm test: tüm scripts/*.test.js dosyalarını sırayla çalıştırır; ilk hatada durmaz, sonda toplu özet ve çıkış kodu verir.
const {spawnSync} = require("child_process"), fs = require("fs"), path = require("path");
const dir = __dirname, failed = [];
const syntax = spawnSync(process.execPath, ["--check", path.join(dir, "patch-android.js")], {stdio: "inherit"});
if (syntax.status) failed.push("patch-android.js (sözdizimi)");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".test.js")).sort();
for (const f of files) {
  console.log(`\n=== ${f}`);
  if (spawnSync(process.execPath, [path.join(dir, f)], {stdio: "inherit"}).status) failed.push(f);
}
console.log(`\n${files.length} test dosyası, ${failed.length} başarısız${failed.length ? ": " + failed.join(", ") : ""}`);
process.exit(failed.length ? 1 : 0);
