/* Macro gram goals with suggestion labels, the missing-nutrition list and the meal detail sheet. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  const fire=(sel,v)=>{q(sel).value=v;q(sel).dispatchEvent(new w.Event("change",{bubbles:true}))};
  const fresh=(extra="",t="settings-profile")=>ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.settings.kcal=2000;${extra};tab='${t}';render()`);
  fresh();
  const hint=id=>q(`label[for="${id}"] small`).textContent;
  ok("carbohydrate and fat goal fields carry a suggestion range from the kcal target",hint("macroC").includes("Öneri: 225–300 g")&&hint("macroF").includes("Öneri: 44–78 g"),[hint("macroC"),hint("macroF")]);
  ok("the goals are marked optional and not medical advice",q("#view").textContent.includes("tıbbi tavsiye değildir"));
  fire("#macroC","150");fire("#macroP","120");
  ok("the macro goals are saved",ev("S.settings.macroC")===150&&ev("S.settings.macroP")===120);
  fire("#macroC","5");
  ok("an out-of-range macro goal is refused",ev("S.settings.macroC")===150);
  fire("#macroC","");
  ok("an empty field turns the goal off",ev("S.settings.macroC")===0);
  fresh("S.settings.pregnant=true;add('weight',70)");
  fire("#macroP","150");
  ok("the protein goal is left to the doctor under a hard block",ev("S.settings.macroP")===0);
  /* Today */
  fresh("S.settings.macroC=150;S.settings.macroF=60;S.settings.macroP=100;const a=add('food',300,'Yoğurt');a.p=20;a.c=10;a.f=5;const b=add('food',200,'Ekmek');b.c=40","today");
  const m=q(".macro").textContent;
  ok("Today shows each goal beside the day's grams",m.includes("/ 100 g")&&m.includes("150 g")&&m.includes("60 g"),m);
  ok("a meal with missing nutrition makes a one-tap list available",!!q('[data-act="missmacro"]'));
  q('[data-act="missmacro"]').click();
  const rows=[...w.document.querySelectorAll("#sheet [data-edit]")];
  ok("the list holds only the meals with missing values",rows.length===1&&rows[0].textContent.includes("Eksik"),rows.length);
  const id=ev("S.entries.find(e=>e.text==='Ekmek').id");
  w.document.querySelector(`#sheet [data-edit="${id}"]`).click();
  ok("the meal sheet shows calories and the macros it has",q("#sheet .nkc").textContent.includes("200")&&q("#sheet .ngrid").textContent.includes("40"));
  q("#epr").value="6";q("#efa").value="2,5";
  q('[data-go="entry"]').click();
  ok("typed macros are saved on the entry",ev("S.entries.find(e=>e.text==='Ekmek').p")===6&&ev("S.entries.find(e=>e.text==='Ekmek').f")===2.5);
  ok("a completed meal leaves the missing list",!ev("S.entries.some(e=>e.text==='Ekmek'&&(e.p==null||e.c==null||e.f==null))"));
  finish();
})();
