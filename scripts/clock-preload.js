// Saat matrisi: FAKE_CLOCK (yerel ISO, ör. 2026-12-31T23:55:00) ile hem Node hem jsdom penceresinin Date'ini kaydırır; saat akmaya devam eder.
const s = process.env.FAKE_CLOCK;
if (s) {
  const offset = new Date(s).getTime() - Date.now();
  const patchSrc = `{const o=${offset};const D=Date;Date=class extends D{constructor(...a){super(...(a.length?a:[D.now()+o]))}static now(){return D.now()+o}}}`;
  eval(patchSrc);
  const Module = require("module");
  const origLoad = Module._load;
  Module._load = function (name, ...r) {
    const m = origLoad.call(this, name, ...r);
    if (name === "jsdom" && !m.__clockPatched) {
      const J = m.JSDOM;
      m.JSDOM = class extends J {
        constructor(h, o = {}) {
          const bp = o.beforeParse;
          super(h, { ...o, beforeParse(w) { w.eval(patchSrc); if (bp) bp(w); } });
        }
      };
      m.__clockPatched = true;
    }
    return m;
  };
}
