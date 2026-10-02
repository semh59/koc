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
// lif, şeker, sodyum
// gerçek Nutella yanıtı (Open Food Facts, 2026-10-02): sodium_100g gram cinsinden, salt_100g/2.5 ile aynı
r=O.parse({status:1,product:{code:"3017620422003",product_name:"Nutella",brands:"Nutella, Ferrero",nutriments:{"energy-kcal_100g":539,proteins_100g:6.3,carbohydrates_100g:57.5,fat_100g:30.9,fiber_100g:0,sugars_100g:56.3,sodium_100g:0.0428,salt_100g:0.107}}});
ok("gerçek ürün: sodium_100g gram, mg'a çevrilir; lif 0 korunur",r.status==="ok"&&r.food.na===42.8&&r.food.sg===56.3&&r.food.fb===0,r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,salt_100g:1.2}}));
ok("tuzdan sodyum hesaplanır (1,2 g tuz = 480 mg)",r.food.na===480,r.food);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,sodium_100g:0.2,salt_100g:1.2}}));
ok("sodyum varsa tuz yok sayılır",r.food.na===200,r.food);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,sugars_100g:75,fiber_100g:3}}));
ok("şeker karbonhidrattan büyükse şeker atılır, ürün ok kalır",r.status==="ok"&&r.food.sg===undefined&&r.food.fb===3,r);
r=O.parse(prod({nutriments:{"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13,fiber_100g:250,sodium_100g:"x"}}));
ok("imkânsız lif ve sayı olmayan sodyum atılır",r.status==="ok"&&r.food.fb===undefined&&r.food.na===undefined,r);
const na=o=>O.parse(prod({nutriments:Object.assign({"energy-kcal_100g":440,proteins_100g:8.5,carbohydrates_100g:70,fat_100g:13},o)})).food.na;
ok("virgüllü sodyum metni işlenir, boş sodyum metni tuza düşer",na({sodium_100g:"0,4"})===400&&na({sodium_100g:"",salt_100g:1})===400&&na({salt_100g:"1,0"})===400,[na({sodium_100g:"0,4"}),na({sodium_100g:"",salt_100g:1}),na({salt_100g:"1,0"})]);
ok("lif, şeker, sodyum yoksa alanlar da yok",(f=>f.fb===undefined&&f.sg===undefined&&f.na===undefined)(O.parse(prod({})).food));
process.exit(bad?1:0);
