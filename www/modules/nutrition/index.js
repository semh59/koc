"use strict";
Data.privacy.push(["Tariflerim",()=>S.recipes.length,()=>{S.recipes=[]},12]);
Data.csv.push(["tarifler","Tarifler (malzemeler, 100 g başına değerler)",()=>["tarif","porsiyon_sayısı","malzeme","gram","kcal_100g","protein_100g","karbonhidrat_100g","yağ_100g","lif_100g","şeker_100g","sodyum_100g"],({S})=>(S.recipes||[]).flatMap(r=>r.items.map(i=>[r.n,r.s,i.n,i.g,i.k,i.p,i.c,i.f,i.fb,i.sg,i.na])),3]);
const Nutrition={
  my:()=>S.myFoods,fav:()=>S.favFoods,tpl:()=>S.mealTpl,
  addTpl:t=>{S.mealTpl=LogLib.cleanTpl([...S.mealTpl,t])},
  removeTpl:id=>{S.mealTpl=S.mealTpl.filter(t=>t.id!==id)}
};
