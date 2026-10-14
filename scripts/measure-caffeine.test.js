/* Body fat percent in measures, caffeine estimate by drink kind. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  ev("S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;S.entries=[];tab='trend';tSec='weight';render()");
  ok("body fat is one of the measures, named Yağ oranı",ev("Algo.MEASURES.includes('fat')&&MNAME.fat")==="Yağ oranı");
  ev("sheetMeasures()");
  w.document.querySelector('[data-ms="k:fat"]').click();
  ok("the sheet asks for a percent",q('label[for="fv"]').textContent.includes("%"));
  q("#fv").value="30,5";q('[data-ms="go"]').click();
  ok("a body fat value is saved as a percent",JSON.stringify(ev("S.measures"))===JSON.stringify([{day:ev("dayKey()"),k:"fat",v:30.5}]),ev("S.measures"));
  ok("the toast and the card use %, not cm",q("#tmsg").textContent.includes("30,5 %")&&!q("#tmsg").textContent.includes("cm"),q("#tmsg").textContent);
  ev("sheetMeasures()");
  w.document.querySelector('[data-ms="k:fat"]').click();
  q("#fv").value="120";q('[data-ms="go"]').click();
  ok("a value outside 3-70 is refused",q("#merr").textContent.includes("yüzde")&&ev("S.measures.length")===1);
  ok("waist still takes centimetres 20-250",ev("Algo.cleanMeasures([{day:dayKey(),k:'waist',v:2}]).length")===0&&ev("Algo.cleanMeasures([{day:dayKey(),k:'fat',v:2}]).length")===0&&ev("Algo.cleanMeasures([{day:dayKey(),k:'waist',v:90}]).length")===1);
  ev("closeSheet();S.entries=[];tab='today';logOff=0;render()");
  q('[data-chip="drink"]').click();
  w.document.querySelector('[data-dr="coffee"]').click();q("#fv").value="250";q('[data-dk="go"]').click();
  ok("a coffee shows a caffeine estimate in the toast and on the day's drink row",q("#tmsg").textContent.includes("~100 mg kafein")&&q(".log").textContent.includes("~100 mg kafein"),q("#tmsg").textContent);
  ev("S.entries=[];add('water',250);render()");
  ok("plain water adds no caffeine text",!q("#view").textContent.includes("kafein"));
  finish();
})();
