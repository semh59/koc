/* Recipe ingredients from pasted text. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.recipes=[];tab='today';render();sheetRecipe()");
  q("#rpt").value="200 g mercimek\n2 yumurta\nzzqq bilinmeyen malzeme";
  q('[data-rp="paste"]').click();
  const items=ev("recipeDraft.items");
  ok("found lines become recipe rows, written grams are used",items.length===2&&items[0].g===200&&/mercimek/i.test(items[0].n),items);
  ok("a line with no match is listed by name, not dropped silently",q("#rimp").textContent.includes("zzqq bilinmeyen malzeme")&&q("#rimp").textContent.includes("2 malzeme eklendi"),q("#rimp").textContent);
  ok("the totals update and the recipe can be saved",q("#rsum").textContent.includes("kcal"));
  q("#rn").value="Test tarifi";q('[data-rp="save"]').click();
  ok("the imported recipe saves",ev("S.recipes.length")===1&&ev("S.recipes[0].items.length")===2);
  ev("sheetRecipe()");q('[data-rp="paste"]').click();
  ok("an empty paste asks for text",q("#rimp").textContent.includes("Önce malzemeleri yaz"));
  finish();
})();
