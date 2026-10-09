// Testte saati bugünün verilen saatine sabitler (saat akmaya devam eder); Node ve jsdom penceresi aynı saati görür. Dönen işlev eski saati geri getirir.
module.exports.at = (w, hour) => {
  const t = new Date(); t.setHours(hour, 0, 0, 0);
  const patchSrc = o => `{const D=globalThis.__D0||Date;globalThis.__D0=D;const o=${o};Date=class extends D{constructor(...a){super(...(a.length?a:[D.now()+o]))}static now(){return D.now()+o}}}`;
  const offset = t - Date.now(), prevDate = Date;
  global.__D0 = global.__D0 || Date;
  eval(patchSrc(offset)); w.eval(patchSrc(offset));
  return () => { Date = prevDate; w.eval("Date=globalThis.__D0"); };
};
