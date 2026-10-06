// Testte saati bugünün verilen saatine sabitler (saat akmaya devam eder); Node ve jsdom penceresi aynı saati görür. Dönen işlev eski saati geri getirir.
module.exports.at = (w, saat) => {
  const t = new Date(); t.setHours(saat, 0, 0, 0);
  const yama = o => `{const D=globalThis.__D0||Date;globalThis.__D0=D;const o=${o};Date=class extends D{constructor(...a){super(...(a.length?a:[D.now()+o]))}static now(){return D.now()+o}}}`;
  const fark = t - Date.now(), onceki = Date;
  global.__D0 = global.__D0 || Date;
  eval(yama(fark)); w.eval(yama(fark));
  return () => { Date = onceki; w.eval("Date=globalThis.__D0"); };
};
