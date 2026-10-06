// Kullanım: npm run test:saat [dosya.test.js ...]. Her test dosyasını farklı sahte saat/saat dilimiyle çalıştırır.
const { execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const SAATLER = [
  "2026-10-06T10:00:00", "2026-10-06T00:10:00", "2026-10-06T23:55:00", "2026-12-31T23:55:00",
  "2027-01-01T00:05:00", "2028-02-29T12:00:00", "2026-10-31T23:58:00", "2026-10-10T12:00:00", // Cmt
  "2026-10-11T12:00:00", "2026-10-12T00:03:00", "2027-03-28T01:30:00", "2026-10-25T01:30:00", // Pzr, Pzt gece, DST
];
const DST = ["2027-03-28T01:30:00", "2026-10-25T01:30:00"];
const kombi = [];
for (const s of SAATLER) for (const tz of ["Europe/Istanbul", "UTC", ...(DST.includes(s) ? ["Europe/Berlin"] : [])]) kombi.push([tz, s]);
const dosyalar = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(__dirname).filter(f => f.endsWith(".test.js"));
const calis = (tz, s, f) => new Promise(res => execFile(process.execPath, ["-r", path.join(__dirname, "saat-preload.js"), path.join(__dirname, path.basename(f))], { env: { ...process.env, TZ: tz, SAAT_SAHTE: s }, maxBuffer: 1e8, timeout: 300000 }, (e, o, er) => {
  if (e) fs.writeFileSync(path.join(require("os").tmpdir(), `saat-${path.basename(f)}-${tz.replace("/", "_")}-${s.replace(/:/g, "")}.log`), o + er);
  res(e ? f : null);
}));
(async () => {
  let hata = 0;
  for (let i = 0; i < kombi.length; i += 4) {
    await Promise.all(kombi.slice(i, i + 4).map(async ([tz, s]) => {
      const bad = (await Promise.all(dosyalar.map(f => calis(tz, s, f)))).filter(Boolean);
      hata += bad.length;
      console.log(`${bad.length ? "KIRIK" : "ok   "} TZ=${tz} ${s} ${bad.join(" ")}`);
    }));
  }
  process.exit(hata ? 1 : 0);
})();
