"use strict";
const {ok,finish}=require("./ok");
const T=require("../www/modules/gym/figtpl.js"),X=require("../www/modules/gym/exlib.js");
const families={
  squat:["squat"],hinge:["hinge"],lunge:["lunge"],push:["bench","incline","ohp"],pull:["row","pullup","pulldown"],
  carry:["farmer"],cardio:["jumprope","jack"],mobility:["qstretch","hamstretch","armstretch"],balance:["onefoot","tandem","balwalk"]
};
const actual=id=>T[id]||(()=>{const e=X.find(x=>x.id===id);return e&&T[e.tp]})();
for(const [family,ids] of Object.entries(families)){
  ok(`figure family ${family} has representative templates`,ids.every(id=>actual(id)),ids.filter(id=>!actual(id)));
  ok(`figure family ${family} has moving poses`,ids.every(id=>{const d=actual(id);return d.frames.length>=2&&JSON.stringify(d.frames[0])!==JSON.stringify(d.frames[1])}),ids.filter(id=>{const d=actual(id);return !d||d.frames.length<2||JSON.stringify(d.frames[0])===JSON.stringify(d.frames[1])}));
}
ok("figure families cover core movement groups",Object.values(families).every(ids=>ids.some(id=>actual(id))));
ok("every library exercise resolves to a known figure template",X.every(e=>!!T[e.tp]),X.filter(e=>!T[e.tp]).map(e=>e.id));
finish();
