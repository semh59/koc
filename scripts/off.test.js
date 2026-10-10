const {ok,finish}=require("./ok");
const O=require("../www/modules/nutrition/offlib.js");
const prod=(o)=>({status:1,product:Object.assign({code:"8690526010113",product_name:"Crax sticks",brands:"Eti,Crax",serving_quantity:"",product_quantity:40,nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13}},o)});
// real Eti products (Open Food Facts, 2026-10-01)
const real=[["8690526010113","Crax sticks",440,8.5,70,13],["8690526062990","ETi Whola Digestive Cookies",509,8,52.63,27.7],["8690526090344","Tutku",509,4.9,60,27]];
for(const [code,name,k,p,c,f] of real){
  const r=O.parse({status:1,product:{code,product_name:name,brands:"Eti",nutriments:{"energy-kcal_100g":k,proteins_100g:p,carbohydrates_100g:c,fat_100g:f}}});
  ok("gerçek ürün tutarlı: "+name,r.status==="ok"&&r.food.k===k,r);
}
let r=O.parse(prod({}));
ok("name and brand are joined, the package serving is added",r.status==="ok"&&r.food.n==="Crax sticks (Eti)"&&r.food.u[0][0]==="1 paket (40 g)"&&r.food.u.at(-1)[1]===100,r);
r=O.parse(prod({serving_quantity:"25",product_quantity:"50"}));
ok("serving first, then package, then 100 g",r.food.u.map(x=>x[1]).join()==="25,50,100",r.food&&r.food.u);
r=O.parse(prod({nutriments:{"energy-kj_100g":1841,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13}}));
ok("with only kJ, it is converted to kcal",r.status==="ok"&&Math.abs(r.food.k-440)<1,r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70}}));
ok("missing macro: usable but not saved (partial)",r.status==="partial"&&r.food.f===null,r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":150,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13}}));
ok("inconsistent calories are rejected (bad)",r.status==="bad",r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":4400,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13}}));
ok("impossible calories are rejected",r.status==="bad");
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:60,carbohydrates_100g:60,fat_100g:13}}));
ok("rejected when the macros add up to more than 100 g",r.status==="bad");
ok("no product",O.parse({status:0,status_verbose:"product not found"}).status==="none"&&O.parse(null).status==="none");
ok("none when there are no calories",O.parse(prod({nutriments:{proteins_100g:1}})).status==="none");
ok("numbers with a decimal comma are accepted",O.parse(prod({nutriments:{"energy-kcal_100g":"440,0",proteins_100g:"8,5",carbohydrates_100g:"70",fat_100g:"13"}})).status==="ok");
// real Nutella response (Open Food Facts, 2026-10-02): sodium_100g is in grams, same as salt_100g/2.5
r=O.parse({status:1,product:{code:"3017620422003",product_name:"Nutella",brands:"Nutella, Ferrero",nutriments:{"energy-kcal_100g":539,proteins_100g:6.3,carbohydrates_100g:57.5,fat_100g:30.9,fiber_100g:0,sugars_100g:56.3,sodium_100g:0.0428,salt_100g:0.107}}});
ok("real product: sodium_100g (grams) is converted to mg; fiber 0 is kept",r.status==="ok"&&r.food.na===42.8&&r.food.sg===56.3&&r.food.fb===0,r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,salt_100g:1.2}}));
ok("sodium is computed from salt (1.2 g salt = 480 mg)",r.food.na===480,r.food);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,sodium_100g:0.2,salt_100g:1.2}}));
ok("salt is ignored when sodium is present",r.food.na===200,r.food);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,sugars_100g:75,fiber_100g:3}}));
ok("sugar above carbohydrate is dropped, the product stays ok",r.status==="ok"&&r.food.sg===undefined&&r.food.fb===3,r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,fiber_100g:250,sodium_100g:"x"}}));
ok("impossible fiber and non-numeric sodium are dropped",r.status==="ok"&&r.food.fb===undefined&&r.food.na===undefined,r);
const na=o=>O.parse(prod({nutriments:Object.assign({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13},o)})).food.na;
ok("sodium text with a decimal comma is parsed, an empty sodium text falls back to salt",na({sodium_100g:"0,4"})===400&&na({sodium_100g:"",salt_100g:1})===400&&na({salt_100g:"1,0"})===400,[na({sodium_100g:"0,4"}),na({sodium_100g:"",salt_100g:1}),na({salt_100g:"1,0"})]);
ok("no fiber, sugar or sodium in the input gives none in the result",(f=>f.fb===undefined&&f.sg===undefined&&f.na===undefined)(O.parse(prod({})).food));
finish();
