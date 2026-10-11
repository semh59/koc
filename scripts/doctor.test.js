const {ok,finish}=require("./ok");
const D=require("../www/modules/insights/doctorlib.js");

ok("questions: at most 5, 140 characters, blanks and control characters dropped",(q=>q.length===5&&q.every(x=>x.length<=140)&&!/[\n\t]/.test(q.join("")))(D.cleanQuestions(["a\nb","","  ","x".repeat(300),"c\td","d","e","f","g"])));
ok("questions: garbage input gives an empty list",D.cleanQuestions(null).length===0&&D.cleanQuestions("x").length===0);
{
  const v=[{k:"t",day:"2026-09-01"},{k:"t",day:"2026-09-01"},{k:"t",day:"2026-09-05"},{k:"s",day:"2026-09-02"},{k:"t",day:"2026-08-01"}];
  const c=Object.fromEntries(D.coverage({settings:{bpOn:true,bsOn:true},vitals:v,entries:[{type:"weight",day:"2026-09-03"},{type:"food",day:"2026-09-04"}]},"2026-09-01","2026-09-30",30));
  ok("coverage: counts days (not readings) inside the period, weight only from weight entries",c["Tansiyon ölçümü olan gün"]==="2 / 30"&&c["Şeker ölçümü olan gün"]==="1 / 30"&&c["Tartı kaydı olan gün"]==="1 / 30",c);
  ok("coverage: a closed module has no line",!("Tansiyon ölçümü olan gün" in Object.fromEntries(D.coverage({settings:{},vitals:v,entries:[]},"2026-09-01","2026-09-30",30))));
}
{
  const ctx={measureText:t=>({width:t.length*10})};
  const l=D.wrap(ctx,"bir iki üç dört beş altı yedi",80);
  ok("wrap: no line is wider than the limit and no word is lost",l.every(x=>x.length*10<=80||!x.includes(" "))&&l.join(" ")==="bir iki üç dört beş altı yedi",l);
}
finish();
