"use strict";
/* Extracts per-100 g calories and macros from the lines read off a nutrition label photo (no DOM).
   The numbers go through the same consistency check as OffLib. */
const LabelLib=(()=>{
  const {fold}=typeof LabLib!=="undefined"?LabLib:require("../labs/lablib.js"),OL=typeof OffLib!=="undefined"?OffLib:require("./offlib.js");
  const NUM="(?:[<>]\\s*)?(\\d+(?:[.,]\\d+)?)";
  const toN=s=>Number(s.replace(",","."));
  // All "<number> <unit>" pairs in a line.
  function pairs(line,unit){
    const re=new RegExp(NUM+"\\s*"+unit+"(?![a-zA-Z])","gi");
    return [...line.matchAll(re)].map(m=>toN(m[1]));
  }
  // Which comes first in a header line, "100 g" or "portion"? 0 = the 100 g column is first, 1 = the second.
  function col100(lines){
    for(const l of lines){
      const f=fold(l),a=f.search(/100\s*(g|ml)\b/),b=f.search(/porsiyon|serving|portion|dilim|adet/);
      if(a>=0&&b>=0)return a<b?0:1;
    }
    return 0;
  }
  /* [field, row-start pattern, [unit, multiplier] options, multiplier for a bare number]. Fibre, sugar and sodium require a unit,
     so a "%12" in the ingredients line or a "%30 less sugar" on the package is not taken as a number. */
  const ROWS=[
    ["k",/^(enerji|energy|kalori|energie)\b/],
    ["f",/^(toplam\s+)?(yag|yaglar|fat)\b/,[["g",1]],1],
    ["c",/^(toplam\s+)?(karbonhidrat|karbonhidratlar|carbohydrate|carbohydrates)\b/,[["g",1]],1],
    ["p",/^(protein|proteinler)\b/,[["g",1]],1],
    ["fb",/^(diyet\s+lifi|lif|lifler|posa|dietary\s+fib(?:re|er)|fib(?:re|er))\b/,[["g",1]],null],
    ["sg",/^(toplam\s+)?(seker\w*|sugars?)\b/,[["g",1]],null],
    ["na",/^(tuz|salt)\b/,[["mg",0.4],["g",400]],400],
    ["na",/^(sodyum|sodium)\b/,[["mg",1],["g",1000]],null]
  ];
  const SKIP={f:/doymus|saturated|trans|tekli|coklu|mono|poli/,sg:/alkol|poliol|polyol/};
  // "Karbonhidrat 12 g, bunun şekere 4 g": the sub-item is read as its own line, otherwise on a two-column label the sugar value would be taken as carbs.
  const SUB=/\s*[,;(]?\s*\b(?:bunun|bunlardan|of which)\s+/i;
  const split=l=>{const m=SUB.exec(l);return m?[l.slice(0,m.index),l.slice(m.index+m[0].length)].filter(Boolean):[l]};
  const pick=(arr,i)=>arr.length?arr[i]??arr[0]:null;
  const numbers=s=>[...s.matchAll(new RegExp(NUM,"g"))].map(m=>toN(m[1]));
  // lines: grouped line texts. Returns {food:{k,p,c,f,fb,sg,na}}; fields not found are undefined.
  function parse(lines){
    const ci=col100(lines),res={};
    for(const raw of lines.flatMap(split)){
      const f=fold(raw).replace(/^[\s\-–•*:]+/,"");
      for(const [key,re,units,bare] of ROWS){
        if(res[key]!=null||!re.test(f)||(SKIP[key]&&SKIP[key].test(f)))continue;
        let v=null;
        if(key==="k"){
          const kc=pairs(raw,"kcal"),kj=pairs(raw,"kj");
          v=kc.length?pick(kc,ci):kj.length?pick(kj,ci)/4.184:null;
          if(v==null){// unit in the heading: "Enerji (kcal) 440"
            const n=pick(numbers(raw.replace(/^\D*/,"")),ci);
            if(n!=null)v=/kj/i.test(raw)&&!/kcal/i.test(raw)?n/4.184:n;
          }
        }else{
          for(const [u,mul] of units){const g=pick(pairs(raw,u),ci);if(g!=null){v=g*mul;break}}
          if(v==null&&bare!=null){// bare number, "Protein 8,5"; a percentage like "(%1,5)" is not a value
            const n=pick(numbers(raw.replace(/%\s*\d+(?:[.,]\d+)?/g,"").replace(/^\D*/,"")),ci);
            if(n!=null)v=n*bare;
          }
        }
        if(v!=null)res[key]=Math.round(v*10)/10;
      }
    }
    return {food:{k:res.k,p:res.p,c:res.c,f:res.f,fb:res.fb,sg:res.sg,na:res.na}};
  }
  // OffLib consistency check: {status:ok|partial|bad|none, why}.
  function check(name,food){
    const nut={};
    if(food.k!=null)nut["energy-kcal_100g"]=food.k;
    if(food.p!=null)nut.proteins_100g=food.p;
    if(food.c!=null)nut.carbohydrates_100g=food.c;
    if(food.f!=null)nut.fat_100g=food.f;
    if(food.fb!=null)nut.fiber_100g=food.fb;
    if(food.sg!=null)nut.sugars_100g=food.sg;
    if(food.na!=null)nut.sodium_100g=food.na/1000;
    return OL.parse({status:1,product:{product_name:name||"Etiketten ürün",nutriments:nut}});
  }
  return {parse,check};
})();
if(typeof module!=="undefined")module.exports=LabelLib;
