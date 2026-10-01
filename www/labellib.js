"use strict";
/* Besin etiketi fotoğrafından okunan satırlardan 100 g başına kalori ve makroları çıkarır (DOM yok).
   Okunan sayılar OffLib ile aynı tutarlılık denetiminden geçer. */
const LabelLib=(()=>{
  const LL=typeof LabLib!=="undefined"?LabLib:require("./lablib.js"),OL=typeof OffLib!=="undefined"?OffLib:require("./offlib.js");
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
  const ROWS=[
    ["k",/^(enerji|energy|kalori|energie)\b/],
    ["f",/^(toplam\s+)?(yag|yaglar|fat)\b/],
    ["c",/^(toplam\s+)?(karbonhidrat|karbonhidratlar|carbohydrate|carbohydrates)\b/],
    ["p",/^(protein|proteinler)\b/]
  ];
  const SKIPF=/doymus|saturated|trans|tekli|coklu|mono|poli/;
  function pick(arr,i){return arr.length?(arr[i]!=null?arr[i]:arr[0]):null}
  /* lines: gruplanmış satır metinleri. Döner {food:{k,p,c,f}, found:[...], note}. */
  function parse(lines){
    const ci=col100(lines),res={},found=[];
    for(const raw of lines){
      const f=fold(raw).replace(/^[\s\-–•*:]+/,"");
      for(const [key,re] of ROWS){
        if(res[key]!=null||!re.test(f))continue;
        if(key==="f"&&SKIPF.test(f))continue;
        let v=null;
        if(key==="k"){
          const kc=pairs(raw,"kcal"),kj=pairs(raw,"kj");
          v=kc.length?pick(kc,ci):kj.length?pick(kj,ci)/4.184:null;
          if(v==null){// "Enerji (kcal) 440" gibi birim başlıkta
            const ns=[...raw.replace(/^\D*/,"").matchAll(new RegExp(NUM,"g"))].map(x=>toN(x[1])),n=pick(ns,ci);
            if(n!=null)v=/kj/i.test(raw)&&!/kcal/i.test(raw)?n/4.184:n;
          }
        }else{
          const g=pairs(raw,"g");
          v=pick(g,ci);
          if(v==null){// "Protein 8,5" gibi birimsiz sayı
            const rest=raw.replace(/^\D*/,""),m=[...rest.matchAll(new RegExp(NUM,"g"))].map(x=>toN(x[1]));
            v=pick(m,ci);
          }
        }
        if(v!=null){res[key]=Math.round(v*10)/10;found.push(key)}
      }
    }
    return {food:{k:res.k,p:res.p,c:res.c,f:res.f},found,col:ci};
  }
  /* OffLib tutarlılık denetimi: {status:ok|partial|bad|none, why}. */
  function check(name,food){
    const nut={};
    if(food.k!=null)nut["energy-kcal_100g"]=food.k;
    if(food.p!=null)nut.proteins_100g=food.p;
    if(food.c!=null)nut.carbohydrates_100g=food.c;
    if(food.f!=null)nut.fat_100g=food.f;
    return OL.parse({status:1,product:{product_name:name||"Etiketten ürün",nutriments:nut}});
  }
  return {parse,check,col100};
})();
if(typeof module!=="undefined")module.exports=LabelLib;
