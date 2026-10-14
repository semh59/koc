/* Copy a meal or a whole day to another day. */
const {ok,finish}=require("./ok");
const {boot}=require("./html");
(async()=>{
  const w=await boot(),ev=s=>w.eval(s),q=s=>w.document.querySelector(s);
  ev(`S=structuredClone(DEF);S.settings.obDone=true;S.settings.noticeOk=true;
    for(const [t,m,n,v] of [["08:00","breakfast","Yumurta",150],["09:00","breakfast","Peynir",100],["13:00","lunch","Çorba",200]]){const e=add("food",v,n);e.time=t;e.meal=m;e.p=5}
    tab="today";logOff=0;render()`);
  const foods=d=>ev(`S.entries.filter(e=>e.type==="food"&&e.day===keyOff(${d})).map(e=>e.text+":"+e.meal)`);
  ok("every meal header has a Kopyala button",q('[data-act="cp:breakfast"]')&&q('[data-act="cp:lunch"]'));
  q('[data-act="cp:breakfast"]').click();
  ok("the meal copy sheet defaults to yesterday",q("#fday").value===ev("keyOff(-1)"));
  q('[data-go="cp"]').click();
  ok("only that meal lands on the chosen day, nutrition travels with it",foods(-1).join()==="Yumurta:breakfast,Peynir:breakfast"&&ev("S.entries.find(e=>e.day===keyOff(-1)).p")===5,foods(-1));
  ev("closeSheet()");
  q('[data-act="cp:lunch"]').click();
  w.document.querySelector('[data-ml="dinner"]').click();
  q("#fday").value=ev("keyOff(-2)");
  q('[data-go="cp"]').click();
  ok("a meal can be copied into another meal slot on another day",foods(-2).join()==="Çorba:dinner",foods(-2));
  ev("closeSheet()");
  q('[data-act="cp:day"]').click();
  q('[data-go="cp"]').click();
  ok("the day copy keeps each food's own meal",foods(-1).filter(x=>x.startsWith("Çorba")).join()==="Çorba:lunch"&&foods(-1).length===5,foods(-1));
  ev("closeSheet();logOff=1;render()");
  q('[data-act="cp:day"]').click();
  ok("from a past day the target defaults to today",q("#fday").value===ev("dayKey()"));
  finish();
})();
