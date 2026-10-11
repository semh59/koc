const {ok,finish}=require("./ok");
const fs=require("fs"),path=require("path");
const EXDB=require("../www/modules/gym/exlib.js"),BAL=require("../www/modules/gym/balance.js"),G=require("../www/modules/gym/guidelib.js");
const load=(f,name)=>{const m=new module.constructor();m._compile(fs.readFileSync(path.join(__dirname,"../www",f),"utf8")+`;module.exports=${name}`,f);return m.exports};
const FigTpl=load("modules/gym/figtpl.js","FigTpl"),EXCUE=load("modules/gym/excues.js","EXCUE");

ok("six balance exercises with valid fields, unique ids and an existing figure template",BAL.length===6&&BAL.every(e=>e.id&&e.n&&e.r&&e.g&&"tb".includes(e.k)&&e.c==="d"&&FigTpl[e.tp])&&new Set(EXDB.map(e=>e.id)).size===EXDB.length);
ok("every balance exercise opens with the wall-or-chair safety line",BAL.every(e=>/Duvara ya da sağlam|sağlam, kaymayan bir sandalye/i.test(EXCUE[e.tp][0])));
ok("no text claims a health effect (falls, risk, prevention, treatment)",!/düş(me|er|ük)|önler|azaltır|risk|tedavi|iyileş|koru(r|ma)/i.test(JSON.stringify([BAL.map(e=>e.n),BAL.map(e=>EXCUE[e.tp]),G.FLOWS.find(f=>f.id==="balance10")])));
{
  const f=G.FLOWS.find(x=>x.id==="balance10"),total=f.steps.reduce((a,s)=>a+s.sec+(s.rest||0),0);
  ok("balance flow: about 10 minutes, only balance exercises, logged as exercise (not a warm-up)",total>=540&&total<=660&&f.steps.every(s=>BAL.some(e=>e.id===s.ex))&&!f.warm,total);
  ok("the flow starts through the same phases engine",G.phases(f.steps).length>10);
}
finish();
