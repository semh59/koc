/* Entry sheets: a tap on the unit label converts the typed number and flips the unit for this entry only. */
const {ok,finish}=require("./ok");
const {boot,flush}=require("./html");
(async()=>{
  const w=await boot(w=>{w.localStorage.setItem("nw_state",JSON.stringify({entries:[],settings:{obDone:true,noticeOk:true,age:30,bpOn:true,bsOn:true}}))});
  const ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  ev("sheetWeight()");
  q("#fv").value="100";
  q('[data-tu="w"]').click();
  ok("weight: the label flips to lb and the typed number converts",q('[data-tu="w"]').textContent==="lb"&&q("#fv").value==="220,5",q("#fv").value);
  q('[data-go="weight"]').click();await flush();
  ok("the entry is stored in kg and the setting is untouched",Math.abs(ev("S.entries.find(e=>e.type==='weight').v")-100)<0.1&&!ev("S.settings.wUnit")&&ev("Units.wu()")==="kg");
  ev("sheetWeight()");
  ok("a new sheet starts in the setting unit again",q('[data-tu="w"]').textContent==="kg");
  q('[data-tu="w"]').click();q('[data-tu="w"]').click();
  ok("tapping twice returns to kg",q('[data-tu="w"]').textContent==="kg");
  ev("closeSheet();sheetBs()");
  q("#gv").value="126";
  q('[data-tu="g"]').click();
  ok("glucose: mg/dL flips to mmol/L and the number converts",q('[data-tu="g"]').textContent==="mmol/L"&&q("#gv").value==="7,0",q("#gv").value);
  q('[data-vt="savebs"]').click();await flush();
  ok("the reading is stored in mg/dL and the setting is untouched",Math.abs(ev("S.vitals.at(-1).g")-126)<1&&!ev("S.settings.gUnit")&&ev("Units.gu()")==="mgdl",ev("JSON.stringify(S.vitals)"));
  finish();
})();
