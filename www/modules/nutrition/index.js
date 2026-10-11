"use strict";
Data.privacy.push(["Tariflerim",()=>S.recipes.length,()=>{S.recipes=[]},12]);
Data.csv.push(["tarifler","Tarifler (malzemeler, 100 g başına değerler)",()=>["tarif","porsiyon_sayısı","malzeme","gram","kcal_100g","protein_100g","karbonhidrat_100g","yağ_100g","lif_100g","şeker_100g","sodyum_100g"],({S})=>(S.recipes||[]).flatMap(r=>r.items.map(i=>[r.n,r.s,i.n,i.g,i.k,i.p,i.c,i.f,i.fb,i.sg,i.na])),3]);
const Nutrition={
  my:()=>S.myFoods,fav:()=>S.favFoods,tpl:()=>S.mealTpl,recipes:()=>S.recipes,
  setFav:l=>{S.favFoods=l},setMy:l=>{S.myFoods=l},
  addTpl:t=>{S.mealTpl=LogLib.cleanTpl([...S.mealTpl,t])},
  removeTpl:id=>{S.mealTpl=S.mealTpl.filter(t=>t.id!==id)},
  /* My foods: an AI estimate, a scanned barcode or a saved meal enters the searchable list with its one-portion values. A food with the same barcode or name is replaced; false when the list is full. */
  putMy(f){
    const my=S.myFoods,i=my.findIndex(x=>(f.b&&x.b===f.b)||tr(x.n)===tr(f.n));
    if(i>=0)my[i]=f;else if(my.length<MYFOODS_MAX)my.unshift(f);else return false;
    return true;
  },
  addMy(n,kcal,p){
    const f={n:n.slice(0,60),k:Math.round(kcal),portion:true};if(p!=null&&p>=0)f.p=Math.round(p*10)/10;
    return Nutrition.putMy(f);
  }
};
