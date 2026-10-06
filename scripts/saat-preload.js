// Saat matrisi: SAAT_SAHTE (yerel ISO, ör. 2026-12-31T23:55:00) ile hem Node hem jsdom penceresinin Date'ini kaydırır; saat akmaya devam eder.
const s = process.env.SAAT_SAHTE;
if (s) {
  const fark = new Date(s).getTime() - Date.now();
  const yama = `{const o=${fark};const D=Date;Date=class extends D{constructor(...a){super(...(a.length?a:[D.now()+o]))}static now(){return D.now()+o}}}`;
  eval(yama);
  const Module = require("module");
  const yukle = Module._load;
  Module._load = function (ad, ...r) {
    const m = yukle.call(this, ad, ...r);
    if (ad === "jsdom" && !m.__saat) {
      const J = m.JSDOM;
      m.JSDOM = class extends J {
        constructor(h, o = {}) {
          const bp = o.beforeParse;
          super(h, { ...o, beforeParse(w) { w.eval(yama); if (bp) bp(w); } });
        }
      };
      m.__saat = true;
    }
    return m;
  };
}
