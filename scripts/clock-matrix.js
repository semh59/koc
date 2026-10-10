/* Usage: npm run test:clock [file.test.js ...]. Runs each test file under several fake clocks and time zones. */
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const TIMES = [
  "2026-10-06T10:00:00", "2026-10-06T00:10:00", "2026-10-06T23:55:00", "2026-12-31T23:55:00",
  "2027-01-01T00:05:00", "2028-02-29T12:00:00", "2026-10-31T23:58:00", "2026-10-10T12:00:00", // Sat
  "2026-10-11T12:00:00", "2026-10-12T00:03:00", "2027-03-28T01:30:00", "2026-10-25T01:30:00", // Sun, Mon night, DST
];
const DST = ["2027-03-28T01:30:00", "2026-10-25T01:30:00"];
const combos = [];
for (const s of TIMES) for (const tz of ["Europe/Istanbul", "UTC", ...(DST.includes(s) ? ["Europe/Berlin"] : [])]) combos.push([tz, s]);
const testFiles = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(__dirname).filter(f => f.endsWith(".test.js"));
const runOne = (tz, s, f) => new Promise(res => execFile(process.execPath, ["-r", path.join(__dirname, "clock-preload.js"), path.join(__dirname, path.basename(f))], { env: { ...process.env, TZ: tz, FAKE_CLOCK: s }, maxBuffer: 1e8, timeout: 300000 }, (e, o, er) => {
  if (e) fs.writeFileSync(path.join(require("os").tmpdir(), `clock-${path.basename(f)}-${tz.replace("/", "_")}-${s.replace(/:/g, "")}.log`), o + er);
  res(e ? f : null);
}));
(async () => {
  let errors = 0;
  for (let i = 0; i < combos.length; i += 4) {
    await Promise.all(combos.slice(i, i + 4).map(async ([tz, s]) => {
      const bad = (await Promise.all(testFiles.map(f => runOne(tz, s, f)))).filter(Boolean);
      errors += bad.length;
      console.log(`${bad.length ? "FAIL" : "ok  "} TZ=${tz} ${s} ${bad.join(" ")}`);
    }));
  }
  process.exit(errors ? 1 : 0);
})();
