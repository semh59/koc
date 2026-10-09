"use strict";
/* Besin etiketi fotoğrafından okunan satırlardan 100 g başına kalori ve makroları çıkarır (DOM yok).
   Okunan sayılar OffLib ile aynı tutarlılık denetiminden geçer. */
const LabelLib=(()=>{
  const LL=typeof LabLib!=="undefined"?LabLib:require("../tahlil/lablib.js"),OL=typeof OffLib!=="undefined"?OffLib:require("./offlib.js");
  const fold=s=>LL.fold(s);
  const NUM="(?:[<>]\\s*)?(\\d+(?:[.,]\\d+)?)";
  const toN=s=>{const v=Number(String(s).replace(",","."));return Number.isFinite(v)?v:null};
  /* Satırdaki "<sayı> <birim>" çiftleri. */
  function pairs(line,unit){
    const re=new RegExp(NUM+"\\s*"+unit+"(?![a-zA-Z])","gi"),out=[];let m;
    while((m=re.exec(line)))out.push(toN(m[1]));
    return out.filter(x=>x!=null);
  }
  /* Üst başlıkta "100 g" mı "porsiyon" mu önce geliyor? 0 = 100 g ilk sütun, 1 = ikinci sütun. */
  function col100(lines){
    for(const l of lines){
      const f=fold(l),a=f.search(/100\s*(g|ml)\b/),b=f.search(/porsiyon|serving|portion|dilim|adet/);
      if(a>=0&&b>=0)return a<b?0:1;
    }
    return 0;
  }
  /* [alan, satır başı, [birim, çarpan] seçenekleri, birimsiz sayının çarpanı]. Lif, şeker ve sodyumda birim zorunlu:
     içindekiler satırındaki "%12" ya da ambalajdaki "%30 daha az şeker" sayı sayılmasın. */
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
  /* "Karbonhidrat 12 g, bunun şekere 4 g": alt kalem ayrı satır okunur, yoksa iki sütunlu etikette şeker değeri karbonhidrat sanılır. */
  const SUB=/\s*[,;(]?\s*\b(?:bunun|bunlardan|of which)\s+/i;
  const split=l=>{const m=SUB.exec(l);return m?[l.slice(0,m.index),l.slice(m.index+m[0].length)].filter(Boolean):[l]};
  function pick(arr,i){return arr.length?(arr[i]!=null?arr[i]:arr[0]):null}
  /* lines: gruplanmış satır metinleri. Döner {food:{k,p,c,f}, found:[...], note}. */
  function parse(lines){
    const ci=col100(lines),res={},found=[];
    for(const raw of lines.flatMap(split)){
      const f=fold(raw).replace(/^[\s\-–•*:]+/,"");
      for(const [key,re,units,bare] of ROWS){
        if(res[key]!=null||!re.test(f)||(SKIP[key]&&SKIP[key].test(f)))continue;
        let v=null;
        if(key==="k"){
          const kc=pairs(raw,"kcal"),kj=pairs(raw,"kj");
          v=kc.length?pick(kc,ci):kj.length?pick(kj,ci)/4.184:null;
          if(v==null){// "Enerji (kcal) 440" gibi birim başlıkta
            const ns=[...raw.replace(/^\D*/,"").matchAll(new RegExp(NUM,"g"))].map(x=>toN(x[1])),n=pick(ns,ci);
            if(n!=null)v=/kj/i.test(raw)&&!/kcal/i.test(raw)?n/4.184:n;
          }
        }else{
          for(const [u,mul] of units){const g=pick(pairs(raw,u),ci);if(g!=null){v=g*mul;break}}
          if(v==null&&bare!=null){// "Protein 8,5" gibi birimsiz sayı; "(%1,5)" gibi yüzde sayılmaz
            const rest=raw.replace(/%\s*\d+(?:[.,]\d+)?/g,"").replace(/^\D*/,""),n=pick([...rest.matchAll(new RegExp(NUM,"g"))].map(x=>toN(x[1])),ci);
            if(n!=null)v=n*bare;
          }
        }
        if(v!=null){res[key]=Math.round(v*10)/10;found.push(key)}
      }
    }
    return {food:{k:res.k,p:res.p,c:res.c,f:res.f,fb:res.fb,sg:res.sg,na:res.na},found,col:ci};
  }
  /* OffLib tutarlılık denetimi: {status:ok|partial|bad|none, why}. */
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
  return {parse,check,col100};
})();
if(typeof module!=="undefined")module.exports=LabelLib;
