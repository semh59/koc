const O=require("../www/offlib.js");let bad=0;
const ok=(n,c,x)=>{console.log((c?"PASS ":"FAIL ")+n+(c?"":" -> "+JSON.stringify(x)));if(!c)bad++};
const prod=(o)=>({status:1,product:Object.assign({code:"8690526010113",product_name:"Crax sticks",brands:"Eti,Crax",serving_quantity:"",product_quantity:40,nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13}},o)});
// gerçek Eti ürünleri (Open Food Facts, 2026-10-01)
const real=[["8690526010113","Crax sticks",440,8.5,70,13],["8690526062990","ETi Whola Digestive Cookies",509,8,52.63,27.7],["8690526090344","Tutku",509,4.9,60,27]];
for(const [code,name,k,p,c,f] of real){
  const r=O.parse({status:1,product:{code,product_name:name,brands:"Eti",nutriments:{"energy-kcal_100g":k,proteins_100g:p,carbohydrates_100g:c,fat_100g:f}}});
  ok("gerçek ürün tutarlı: "+name,r.status==="ok"&&r.food.k===k,r);
}
let r=O.parse(prod({}));
ok("ad ve marka birleşir, paket porsiyonu eklenir",r.status==="ok"&&r.food.n==="Crax sticks (Eti)"&&r.food.u[0][0]==="1 paket (40 g)"&&r.food.u.at(-1)[1]===100,r);
r=O.parse(prod({serving_quantity:"25",product_quantity:"50"}));
ok("porsiyon önce, sonra paket, sonra 100 g",r.food.u.map(x=>x[1]).join()==="25,50,100",r.food&&r.food.u);
r=O.parse(prod({nutriments:{"energy-kj_100g":1841,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13}}));
ok("yalnızca kJ varsa kcal'e çevrilir",r.status==="ok"&&Math.abs(r.food.k-440)<1,r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70}}));
ok("eksik makro: kullanılır ama kaydedilmez (partial)",r.status==="partial"&&r.food.f===null,r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":150,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13}}));
ok("tutarsız kalori reddedilir (bad)",r.status==="bad",r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":4400,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13}}));
ok("imkânsız kalori reddedilir",r.status==="bad");
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:60,carbohydrates_100g:60,fat_100g:13}}));
ok("makroların toplamı 100 g'ı aşarsa reddedilir",r.status==="bad");
ok("ürün yok",O.parse({status:0,status_verbose:"product not found"}).status==="none"&&O.parse(null).status==="none");
ok("kalori yoksa none",O.parse(prod({nutriments:{proteins_100g:1}})).status==="none");
ok("virgüllü sayı metni kabul edilir",O.parse(prod({nutriments:{"energy-kcal_100g":"440,0",proteins_100g:"8,5",carbohydrates_100g:"70",fat_100g:"13"}})).status==="ok");
process.exit(bad?1:0);
