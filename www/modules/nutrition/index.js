"use strict";
Data.privacy.push(["Tariflerim",()=>S.recipes.length,()=>{S.recipes=[]},12]);
Data.csv.push(["tarifler","Tarifler (malzemeler, 100 g başına değerler)",()=>["tarif","porsiyon_sayısı","malzeme","gram","kcal_100g","protein_100g","karbonhidrat_100g","yağ_100g","lif_100g","şeker_100g","sodyum_100g","pişmiş_gram"],({S})=>(S.recipes||[]).flatMap(r=>r.items.map(i=>[r.n,r.s,i.n,i.g,i.k,i.p,i.c,i.f,i.fb,i.sg,i.na,r.cw])),3]);
const Nutrition={
  my:()=>S.myFoods,fav:()=>S.favFoods,tpl:()=>S.mealTpl,recipes:()=>S.recipes,
  setFav:l=>{S.favFoods=l},setMy:l=>{S.myFoods=l},
  addTpl:t=>{S.mealTpl=LogLib.cleanTpl([...S.mealTpl,t])},
  removeTpl:id=>{S.mealTpl=S.mealTpl.filter(t=>t.id!==id)},
  /* My foods: an AI estimate, a scanned barcode or a saved meal enters the searchable list with its one-portion values. A food with the same barcode or name is replaced; false when the list is full. */
  putMy(f){
    /* The same name replaces an entry only when it is not a different barcoded product; a different product with a clashing name gets a (2) suffix. */
    const my=S.myFoods,i=my.findIndex(x=>(f.b&&x.b===f.b)||(tr(x.n)===tr(f.n)&&!(f.b&&x.b&&f.b!==x.b)));
    if(i<0&&my.some(x=>tr(x.n)===tr(f.n)))f={...f,n:f.n.slice(0,55)+" (2)"};
    if(i>=0)my[i]=f;else if(my.length<MYFOODS_MAX)my.unshift(f);else return false;
    return true;
  },
  addMy(n,kcal,p,b){
    const f={n:n.slice(0,60),k:Math.round(kcal),portion:true};if(p!=null&&p>=0)f.p=Math.round(p*10)/10;if(b)f.b=b;
    return Nutrition.putMy(f);
  },
  // Label fields for nutrition label OCR review (shared with coach module)
  LABEL_FIELDS:[["k","Kalori","kcal",900],["p","Protein","g",100],["c","Karbonhidrat","g",100],["f","Yağ","g",100],["fb","Lif","g",100],["sg","Şeker","g",100],["na","Sodyum","mg",40000]]
};
