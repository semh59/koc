/* Undo stack: each "Geri al" takes back one recent action; the toast lasts 10 s; deleting from the water list can be undone there. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s),undo=()=>q("#tundo").click();
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.waterMl=2000;tab='today';render()");
  const water=()=>ev("of('water',dayKey()).length");
  q('[data-act="water"]').click();q('[data-act="water"]').click();q('[data-act="water"]').click();
  ok("three taps add three records",water()===3);
  undo();
  ok("the first undo removes only the last record and offers the previous one",water()===2&&!q("#tundo").hidden&&q("#tmsg").textContent.includes("Bir önceki"),q("#tmsg").textContent);
  undo();undo();
  ok("undoing three times empties the list and hides the button",water()===0&&!q("#toast").classList.contains("on"));
  ok("the undo toast stays 10 seconds",ev("UNDO_MS")===10000);
  ev("for(let i=0;i<14;i++)toast('x'+i,()=>{})");
  ok("the stack keeps the last 10 actions",ev("undoStack.length")===10);
  ev("undoStack.length=0;S.entries=[];add('water',200);add('water',300);tab='today';render();sheetWater()");
  const id=ev("S.entries[0].id");
  q(`#sheet [data-del="${id}"]`).click();
  ok("deleting from the water list shows the list without the record",ev("S.entries.length")===1&&q("#sheet h3").textContent==="Su kayıtları"&&q("#sheet").querySelectorAll("[data-del]").length===1);
  undo();
  ok("undoing from the water list brings the record back into the open list",ev("S.entries.length")===2&&q("#sheet").querySelectorAll("[data-del]").length===2);
  finish();
})();
