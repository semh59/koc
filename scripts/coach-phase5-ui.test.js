const {ok,finish}=require("./ok");
const {boot}=require("./html");

boot().then(w=>{
  w.eval("S=structuredClone(DEF);S.settings.obDone=true;tab='coach';render();");
  ok("coach shows local experiments entry",w.document.body.textContent.includes("Küçük deneyler")&&w.document.querySelector('[data-c="experimentnew"]'));
  w.document.querySelector('[data-c="experimentnew"]').click();
  ok("experiment form has accessible protocol fields",["experiment-hypothesis","experiment-baseline","experiment-target","experiment-start","experiment-end"].every(id=>w.document.getElementById(id)?.labels?.length));
  w.document.getElementById("experiment-hypothesis").value="Akşam yürüyüşü adımı artırır";
  w.document.getElementById("experiment-baseline").value="5000";
  w.document.getElementById("experiment-target").value="6000";
  w.document.getElementById("experiment-start").value="2026-10-01";
  w.document.getElementById("experiment-end").value="2026-10-07";
  w.document.querySelector('[data-c="experimentsave"]').click();
  ok("saved experiment is local and visible",w.document.body.textContent.includes("Akşam yürüyüşü adımı artır")&&w.eval("Coach.experimentList().length")===1);
  w.document.querySelector('[data-c^="experimentstart:"]').click();
  ok("explicit start enables local check-in",w.document.querySelector('[data-c^="experimentcheckin:"]')!==null&&w.eval("Coach.experimentList()[0].status") === "active");
  w.document.querySelector('[data-c^="experimentcheckin:"]').click();
  ok("check-in captures local measurement",w.document.querySelector("#experiment-checkin-value")!==null);
  ok("result copy rejects causal and medical claims",/nedensellik|nedensel/i.test(w.document.body.textContent)&&/tıbbi|hekim/i.test(w.document.body.textContent));
  w.document.querySelector('[data-c^="experimentdelete:"]').click();
  ok("delete requires export-safe confirmation",w.document.body.textContent.includes("dışa aktarma")&&w.eval("Coach.experimentList().length")===1);
  w.eval("window.__confirmAuto=()=>false");
  w.document.querySelector('[data-c^="experimentdelete:"]').click();
  ok("delete cancel preserves experiment",w.eval("Coach.experimentList().length")===1);
  finish();
}).catch(e=>{console.error(e);process.exitCode=1});
