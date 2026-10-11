const {ok,finish}=require("./ok");
const Q=require("../www/modules/nutrition/quicklib.js"),{FOODS}=require("../www/modules/nutrition/foods.js");
const L=[
  {n:"Beyaz ekmek",k:266,p:8.85,u:[["1 dilim (30 g)",30],["1/4 somun (50 g)",50]]},
  {n:"Simit",k:307,lo:261,hi:353,u:[["1 adet (120 g)",120]]},
  {n:"Simit ve beyaz peynir",k:282,u:[["1 porsiyon (160 g)",160]]},
  {n:"Pirinç pilavı",k:148,u:[["1 porsiyon (150 g)",150]]},
  {n:"Izgara tavuk göğsü",k:160,u:[["100 g",100]]},
  {n:"Haşlanmış yumurta",k:155,u:[["1 adet (50 g)",50]]}
];
const one=t=>Q.parse(t,L)[0],g=r=>Q.calc(L[r.f],r,["p"]);

ok("number + measure + name: 2 dilim ekmek is 2 x the slice (60 g)",(r=>L[r.f].n==="Beyaz ekmek"&&r.por===0&&r.q===2&&g(r).g===60&&!r.flag)(one("2 dilim ekmek")));
ok("word quantities: yarım, bir buçuk, 1/2, ½, 1,5",[["yarım simit",0.5],["bir buçuk dilim ekmek",1.5],["1/2 simit",0.5],["½ simit",0.5],["1,5 dilim ekmek",1.5]].every(([t,q])=>one(t).q===q));
ok("grams: 200 g tavuk uses the written grams, not a portion",(r=>r.grams===200&&g(r).g===200&&Math.round(g(r).k)===320&&Q.label(L[r.f],r)==="Izgara tavuk göğsü, 200 g")(one("200 g tavuk")));
ok("no measure: one default portion; 2 yumurta is 2 portions",one("yumurta").q===1&&one("2 yumurta").q===2&&!one("2 yumurta").flag);
ok("a measure the food does not have is flagged, falls back to one first portion and never multiplies",(r=>r.flag==="unit"&&r.por===0&&r.q===1&&g(r).g===150)(one("3 yemek kaşığı pilav")));
ok("the measure is matched to the second label of the food (somun)",(r=>r.por===1&&!r.flag)(one("1 somun ekmek")));
ok("a food name with 've' stays one item when it is a whole name; otherwise split",Q.parse("Simit ve beyaz peynir",L).length===1&&Q.parse("2 dilim ekmek ve yarım simit",L).length===2);
ok("comma, semicolon and new lines separate items; empty pieces vanish",Q.parse("simit,, ekmek; yumurta\n\n pilav",L).length===4);
ok("an unknown food is reported as missing, never guessed",(r=>r.miss===true&&r.f===undefined)(one("xyzqq")));
ok("a quantity above 20 is reset to 1 and flagged",(r=>r.q===1&&r.flag==="qty")(one("50 dilim ekmek")));
ok("at most 15 rows",Q.parse(Array(40).fill("simit").join(","),L).length===15);
ok("range and nutrients scale with the grams",(r=>Math.round(g(r).lo)===157&&Math.round(g(r).hi)===212&&g(r).p===null)(one("0,5 simit")));
ok("a decimal comma is not a separator",Q.parse("1,5 dilim ekmek, 2,5 simit",L).length===2);
ok("the entry label reads like a hand-added food",Q.label(L[0],one("2 dilim ekmek"))==="Beyaz ekmek, 2 × 1 dilim (30 g)"&&Q.label(L[1],one("yarım simit"))==="Simit, 0,5 × 1 adet (120 g)"&&Q.label(L[5],one("yumurta"))==="Haşlanmış yumurta, 1 adet (50 g)");
ok("alternatives: picking another hit keeps the written quantity",(r=>{const a=Q.pick(r.text,r.p,r.hits,1,L);return a.q===r.q&&a.f===r.hits[1]})(Q.parse("2 simit",L)[0]));
ok("real food list: common sentences resolve without throwing",(rows=>rows.length===3&&rows.every(r=>!r.miss))(Q.parse("2 dilim ekmek, yarım simit, 200 g tavuk",FOODS)));
ok("garbage and empty input do not throw",Q.parse("",L).length===0&&Q.parse(null,L).length===0&&Q.parse("%%% ,,, ;;",L).length<=3);
ok("quick: a thousands dot before grams means thousands (1.500 g = 1500 g), a decimal stays a decimal",require("../www/modules/nutrition/quicklib.js").piece("1.500 g pilav").grams===1500&&require("../www/modules/nutrition/quicklib.js").piece("2.5 g tuz").grams===2.5);
finish();
