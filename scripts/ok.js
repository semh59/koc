let failed = 0;
exports.ok = (name, cond, detail) => {
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${cond ? "" : " -> " + JSON.stringify(detail)}`);
  if (!cond) failed++;
};
exports.finish = () => {
  console.log(failed ? `${failed} failed` : "All passed");
  process.exit(failed ? 1 : 0);
};
