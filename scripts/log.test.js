const {ok,finish}=require("./ok");
const L=require("../www/modules/log/loglib.js");
ok("copyNutr carries only numeric macros",JSON.stringify(L.copyNutr({p:5,c:null,f:0,text:"x"},{}))==='{"p":5,"f":0}');
ok("dayRange: foods with a range cover at least half of the calories and the range is 10% wide or more",JSON.stringify(L.dayRange([{v:600,lo:500,hi:800},{v:400}]))==='{"lo":900,"hi":1200}');
ok("dayRange: no range when no food has one, coverage is under half, or the range is narrow",L.dayRange([{v:500},{v:300}])===null&&L.dayRange([{v:200,lo:150,hi:300},{v:800}])===null&&L.dayRange([{v:1000,lo:980,hi:1020}])===null);
ok("item keeps a valid lo/hi and drops a range that does not contain v",JSON.stringify(L.cleanFav([{text:"A",v:100,lo:80,hi:140},{text:"B",v:100,lo:120,hi:140}]))==='[{"text":"A","v":100,"lo":80,"hi":140},{"text":"B","v":100}]');
ok("copyNutr: per-meal sodium is kept up to the 100,000 mg limit (the 40,000 per 100 g limit is separate)",L.copyNutr({na:60000},{}).na===60000&&L.copyNutr({na:100001},{}).na===undefined);
const e=(day,id,text,v,x)=>Object.assign({type:"food",day,id,text,v},x);
let r=L.recents([e("2026-10-01",1,"Menemen",200),e("2026-10-01",2,"menemen",210,{p:9}),e("2026-09-30",3,"Ekmek",90),e("2026-08-01",4,"Eski",50),e("2026-10-03",5,"Gelecek",5),{type:"water",day:"2026-10-01",id:6,text:"x",v:250}],"2026-10-02");
ok("recents dedupes by text, keeps the newest, sorts, drops entries older than 30 days and future ones",JSON.stringify(r.map(x=>[x.text,x.v]))==='[["menemen",210],["Ekmek",90]]'&&r[0].p===9,r);
ok("recents returns at most 8 rows",L.recents(Array.from({length:12},(_,i)=>e("2026-10-01",i+1,"y"+i,10)),"2026-10-02").length===8);
r=L.cleanFav([{text:"A",v:100,p:5},{text:"a",v:1},{text:"B",v:-3},{text:"C",v:"abc"},{text:"  "},null,{text:"D",v:null,c:9999}]);
ok("cleanFav drops invalid kcal and duplicates, bounds macros",JSON.stringify(r)==='[{"text":"A","v":100,"p":5},{"text":"D","v":null}]',r);
ok("cleanFav keeps at most 20 and gives empty for non-array input",L.cleanFav(Array.from({length:30},(_,i)=>({text:"f"+i,v:1}))).length===20&&L.cleanFav("x").length===0);
const it=n=>({text:"y"+n,v:1});
r=L.cleanTpl([{id:1,n:"A",items:[it(1)]},{id:1,n:"B",items:[it(2),{text:"",v:1},{text:"x",v:-5}]},{id:5,n:"Boş",items:[{text:""}]},{id:9,n:" ",items:[it(3)]},{n:"C",items:"x"},null,{id:"z",n:"D",items:[it(4)]}]);
ok("cleanTpl drops templates with empty items or no name and renumbers clashing ids",JSON.stringify(r.map(t=>[t.id,t.n,t.items.length]))==='[[1,"A",1],[2,"B",1],[3,"D",1]]',r);
r=L.cleanTpl(Array.from({length:25},(_,i)=>({id:i+1,n:"s"+i,items:Array.from({length:20},(_,j)=>it(j))})));
ok("cleanTpl keeps at most 20 templates and 15 items per template",r.length===20&&r.every(t=>t.items.length===15));
ok("cleanTpl gives empty for non-array input and cuts long names",L.cleanTpl({}).length===0&&L.cleanTpl([{n:"x".repeat(80),items:[it(1)]}])[0].n.length===40);
const H=36e5,now=1e12;
ok("stalled: warns when not closed for over 26 h, not under 26 h or with snapAt 0",L.stalled(now-27*H,now,100,0)&&!L.stalled(now-25*H,now,100,0)&&!L.stalled(0,now,100,0));
ok("stalled: warns when yesterday is 0 and the earlier average is above 1000, not at the limit or when yesterday has steps",L.stalled(0,now,0,1001)&&!L.stalled(0,now,0,1000)&&!L.stalled(0,now,10,5000));
{
  const y=(id,time,v,meal)=>({id,type:"food",time,v,text:"x",...(meal?{meal}:{})});
  ok("mealOf: without meal it follows the time (05-11 breakfast, 11-16 lunch, 16-21 dinner, rest snack); an invalid meal is ignored",["04:59","05:00","10:59","11:00","15:59","16:00","20:59","21:00","00:00"].map(t=>L.mealOf({time:t})).join()==="snack,breakfast,breakfast,lunch,lunch,dinner,dinner,snack,snack"&&L.mealOf({time:"08:00",meal:"zz"})==="breakfast");
  ok("mealOf: the meal chosen by the user beats the time",L.mealOf({time:"08:00",meal:"dinner"})==="dinner");
  const d=L.dayLog([y(1,"13:00",300),y(2,"08:30",200),y(3,"08:10",50),y(4,"19:00",null,"snack"),{id:5,type:"water",time:"09:00",v:250},{id:6,type:"water",time:"10:00",v:250},{id:7,type:"weight",time:"07:00",v:80}]);
  ok("dayLog: no empty group, time order inside a group, subtotal kcal (0 without kcal)",d.groups.map(g=>g.k+":"+g.kcal+":"+g.items.map(e=>e.id)).join()==="breakfast:250:3,2,lunch:300:1,snack:0:4");
  ok("dayLog: water merges into one total, weight does not enter a meal group",d.water.length===2&&d.waterTotal===500&&d.rest.length===1&&d.rest[0].id===7);
}
{
  const it=(n,g,k,x)=>Object.assign({n,g,k},x),R=(n,items,x)=>Object.assign({id:1,n,s:2,items},x);
  const rc=L.cleanRecipes([R("Mercimek köftesi",[it("Mercimek",200,119,{p:9,c:20,f:0.4}),it("Zeytinyağı",20,884,{p:0,c:0,f:100})])])[0];
  const c=L.recipeCalc(rc);
  ok("recipe total: grams and kcal are computed from the ingredients",c.g===220&&Math.round(c.tot.k)===415&&Math.round(c.tot.p)===18&&c.part.length===0,c);
  const f=L.recipeFood(rc);
  ok("recipe in the food list: per-100 g values, grams per serving (total grams / servings), source recipe",Math.round(f.k)===189&&f.u[0][1]===110&&f.u[0][0]==="1 porsiyon (110 g)"&&f.src==="recipe"&&f.rec===1&&Math.round(f.k*f.u[0][1]/100)===207);
  const part=L.cleanRecipes([R("Eksik",[it("A",100,100,{p:10,fb:5}),it("B",100,200,{p:4})])])[0],pc=L.recipeCalc(part),pf=L.recipeFood(part);
  ok("an ingredient with missing data gives no partial total: fiber noted as 1/2, calories and protein complete",pc.tot.fb===undefined&&pc.tot.p===14&&pc.tot.c===undefined&&pf.fb===null&&pf.p!==null&&pc.part.some(x=>x[0]==="fb"&&x[1]===1)&&L.recipeNote(pc).includes("Lif: 1/2 malzemede veri var"),[pc,pf]);
  ok("the cooking note is on every recipe",L.recipeNote(c).includes("Çiğ ağırlıklarla hesaplandı, pişince değişir; tahmindir."));
  const bad=L.cleanRecipes([null,{n:"",items:[it("A",1,1)]},R("A",[]),R("B",[it("x",0,5),it("y",5001,5),it("z",5,-1),{n:" ",g:5,k:5}]),R("Ç",[it("a",5,5,{p:301,c:-1,fb:50})],{s:99,id:"x"}),R("ç",[it("a",5,5)]),R("D",[it("a",5,5)],{id:3}),R("E",[it("a",5,5)],{id:3})]);
  ok("cleaner: drops invalid ingredient/name/empty recipe, dedupes by name (İ/I insensitive), servings 1-50, unique id, drops out-of-range values",bad.length===3&&bad[0].n==="Ç"&&bad[0].s===1&&bad[0].items[0].p===undefined&&bad[0].items[0].c===undefined&&bad[0].items[0].fb===50&&new Set(bad.map(x=>x.id)).size===3,bad);
  ok("at most 50 recipes, at most 30 ingredients per recipe",L.cleanRecipes(Array.from({length:60},(_,i)=>R("t"+i,[it("a",1,1)],{id:i+1}))).length===50&&L.cleanRecipes([R("U",Array.from({length:40},(_,i)=>it("m"+i,1,1)))])[0].items.length===30);
  const tiny=L.cleanRecipes([R("T",[it("a",0.04,5),it("b",0.05,5)])])[0];
  ok("ingredient grams round to 0.1: 0.04 g is dropped (never stored as 0 g), 0.05 g becomes 0.1",tiny.items.length===1&&tiny.items[0].n==="b"&&tiny.items[0].g===0.1,tiny);
  const src=[R("Z",[it("a",5,5)])];L.cleanRecipes(src);
  ok("cleaner leaves the input untouched; undefined and non-array input give empty",src[0].items[0].g===5&&L.cleanRecipes(undefined).length===0&&L.cleanRecipes("x").length===0);
}
{ // cooked pot weight on a recipe
  const mk=(x={})=>({id:1,n:"Tencere",s:4,items:[{n:"Pirinç",g:500,k:360},{n:"Su ve sebze",g:500,k:40}],...x});
  const base=L.recipeFood(L.cleanRecipes([mk()])[0]),cw=L.recipeFood(L.cleanRecipes([mk({cw:850})])[0]);
  ok("cw: 1000 g raw with 850 g cooked gives a denser 100 g value (the raw total is 2000 kcal)",Math.round(base.k)===200&&Math.round(cw.k*10)/10===235.3,[base.k,cw.k]);
  ok("cw: the per-portion kcal does not change, only the portion grams do",Math.round(base.u[0][1]*base.k/100)===Math.round(cw.u[0][1]*cw.k/100)&&Math.round(cw.u[0][1])===213);
  ok("cw: without it the recipe equals today's behaviour and has no cw key",!("cw" in L.cleanRecipes([mk()])[0]));
  ok("cw: out of range (below 0.2x or above 5x the raw total) is dropped, the recipe stays",!("cw" in L.cleanRecipes([mk({cw:5})])[0])&&!("cw" in L.cleanRecipes([mk({cw:5001})])[0])&&L.cleanRecipes([mk({cw:5000})])[0].cw===5000);
  ok("cw: a recipe with a portion-based ingredient drops it",!("cw" in L.cleanRecipes([mk({cw:800,items:[{n:"Lahmacun",g:100,k:300,portion:true},{n:"Su",g:100,k:0}]})])[0]));
  ok("cw: the note says it was calculated on the cooked weight",/Pişmiş ağırlığa göre/.test(cw.hint)&&/Pişmiş ağırlık: 850 g/.test(cw.hint)&&/Çiğ ağırlıklarla/.test(base.hint));
}
finish();
