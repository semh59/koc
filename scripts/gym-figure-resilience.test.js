"use strict";
const {ok,finish}=require("./ok");
const F=require("../www/modules/gym/figlib.js");
const safeSvg=def=>F.svg(def,{label:"Probe"});
const malformed=[{}, {frames:[]}, {frames:[{}]}, {frames:[{t:0},{t:0}],view:"f"}];
for(const [i,def] of malformed.entries()){
  let result="";try{result=safeSvg(def)}catch(e){result="THREW:"+e.message}
  ok(`malformed figure ${i} returns controlled output`,!result.startsWith("THREW:")&&!/NaN|undefined/.test(result),result.slice(0,80));
}
const unreachable={frames:[{t:0,hand:[10000,0]},{t:0,hand:[10000,0]}]};
let out="";try{out=safeSvg(unreachable)}catch(e){out="THREW:"+e.message}
ok("unreachable IK target stays finite and inside SVG output",!out.startsWith("THREW:")&&!/NaN|undefined/.test(out));
finish();
