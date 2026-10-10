// Generates www/modules/nutrition/foods.js: node tools/nutrition/generate.js [--check]. Sources: generic.tsv, ingredients.tsv, recipes.txt, extra.tsv, meals.txt, proxies.txt, proxy-meals.txt, aliases.tsv, proxy-notes.tsv, core-rows.txt, core-usda.tsv, core-computed.txt, as-is.tsv, usda-subset.json, external.json.
const fs=require("fs"),path=require("path");
const H=__dirname+"/",OUT=path.join(H,"../../www/modules/nutrition/foods.js");
const rf=f=>fs.readFileSync(H+f,"utf8").replace(/\r/g,"");
const rd=f=>rf(f).split("\n").filter(l=>l.trim()&&!l.startsWith("#"));
const USDA={...JSON.parse(rd("usda-subset.json").join("")),...JSON.parse(rd("external.json").join(""))};
const FATS=new Set(["Zeytinyağı","Tereyağı","Ayçiçek yağı","Margarin","Mısırözü yağı"]);
const YIELD={raw:1,soup:.9,stew:.85,pilaf:.94,bake:.8,fry:.85,dough:.88,dessert:.9};
const r1=x=>Math.round(x*10)/10,q=x=>JSON.stringify(x);
const portions=s=>s.split(";").map(x=>{const[l,g]=x.split("=");return[l.trim(),parseFloat(g)]});
const rows=[],aliases={},data={};
const fail=m=>{console.error("ERROR: "+m);process.exit(2)};
const usda=(kw)=>USDA[kw]||fail("not in the USDA subset: "+kw);
for(const l of rd("generic.tsv")){
  const[n,kw,p,a]=l.split("\t"),u=usda(kw);
  data[n]=u;rows.push([n,u.k,u.p,u.c,u.f,portions(p),1]);if(a)aliases[n]=a.trim();
}
for(const l of rd("ingredients.tsv")){const[n,kw]=l.split("\t");data[n]=usda(kw)}
for(const l of rd("aliases.tsv"))aliases[l.split("\t")[0]]=l.split("\t")[1].trim();
let existing=rf("core-rows.txt").replace(/\s+$/,"");
// Only old rows verified against USDA (flag 1) may serve as ingredients; hand-entered ones may not.
for(const r of new Function("return ["+existing+"]")())if(r[6]===1&&!data[r[0]])data[r[0]]={k:r[1],p:r[2],c:r[3],f:r[4]};
const extra=[];
for(const l of rd("extra.tsv")){
  const[n,kw,p,a,meal]=l.split("\t"),u=usda(kw);
  data[n]=u;extra.push([n,u.k,u.p,u.c,u.f,portions(p),1,0,...(meal==="1"?[1]:[])]);if(a)aliases[n]=a.trim();
}
const range={};// the low/high-fat kcal of a recipe ingredient carries into the meal
// Recipe and meal components (name, raw grams per 100 g cooked): the shopping list splits a dish into products.
const PARTS={};
// Dishes that are bought as the product itself: their proxy ingredients (quark, feta, clotted cream...) are not shopping items.
const AS_IS=new Set(rd("as-is.tsv").map(l=>l.trim()));
const build=(file,isMeal)=>rd(file).map(l=>{
  const[n,method,port,mat,alias,spread]=l.split(" | ").map(s=>s.trim()),yv=YIELD[method]??parseFloat(method);
  if(!(yv>0))fail("yield: "+n);
  const ing=mat.split(";").map(s=>{const i=s.lastIndexOf(" ");return[s.slice(0,i).trim(),+s.slice(i+1)]});
  ing.forEach(([a])=>{if(!data[a]&&a!=="Su")fail(n+": unknown ingredient: "+a)});
  const calc=sc=>{
    let fat=0,plain=0;const t={k:0,p:0,c:0,f:0};
    for(const[a,g]of ing){const v=data[a],m=FATS.has(a)?sc:1;if(FATS.has(a))fat+=g*m;else plain+=g;for(const k in t)t[k]+=g*m*v[k]/100;if(range[a]&&sc!==1)t.k+=g*(range[a][sc<1?0:1]-v.k)/100}
    const w=plain*yv+fat;return{w,...Object.fromEntries(Object.entries(t).map(([k,x])=>[k,x*100/w]))};
  };
  const b=calc(1),k=Math.round(b.k),ss=spread&&parseFloat(spread.slice(1))/100;
  const lo=ss?Math.round(k*(1-ss)):Math.round(calc(.6).k),hi=ss?Math.round(k*(1+ss)):Math.round(calc(1.5).k);
  if(b.k>900)fail(n+": kcal>900");
  const g=Math.round(b.w),u=isMeal?[[port+" ("+g+" g)",g]]:portions(port),r=lo<k&&k<hi?[lo,hi]:0;
  data[n]={k:b.k,p:b.p,c:b.c,f:b.f};if(r)range[n]=r;
  if(!AS_IS.has(n))PARTS[n]=ing.filter(([a])=>a!=="Su").map(([a,x])=>[a,r1(x*100/b.w)]);
  if(alias&&alias!=="-")aliases[n]=alias;
  return [n,k,r1(b.p),r1(b.c),r1(b.f),u,0,...(isMeal?[r,1]:r?[r]:[])];
});
const recipes=build("recipes.txt"),meals=build("meals.txt",true),proxies=build("proxies.txt"),proxyMeals=build("proxy-meals.txt",true);
const names=[...existing.matchAll(/^\s*\["([^"]+)"/gm)].map(m=>m[1]).concat(rows.map(r=>r[0]),recipes.map(r=>r[0]),extra.map(r=>r[0]),meals.map(r=>r[0]),proxies.map(r=>r[0]),proxyMeals.map(r=>r[0]));
const seen=new Set();names.forEach(a=>{const k=a.toLowerCase();if(seen.has(k))fail("duplicate name: "+a);seen.add(k)});
const line=a=>"    ["+a.map(x=>q(x)).join(",")+"]";
// Values of the first 106 rows: core-usda.tsv (USDA verbatim, 1) and core-computed.txt (recipe/proxy computation, 0). Name, order and portions stay in core-rows.txt. build() mutates `data`, so it runs last.
const OLD=new Map([...rd("core-usda.tsv").map(l=>{const[n,kw]=l.split("\t"),u=usda(kw);return[n,{k:u.k,p:u.p,c:u.c,f:u.f,s:1}]}),...build("core-computed.txt").map(r=>[r[0],{k:r[1],p:r[2],c:r[3],f:r[4],s:0,r:r[7]}])]);
existing=existing.split("\n").map(l=>{const m=l.match(/^\s*\["([^"]+)"/),e=m&&OLD.get(m[1]);if(!e)return l;OLD.delete(m[1]);
  return line([m[1],e.k,e.p,e.c,e.f,new Function("return "+l.trim().replace(/,$/,""))()[5],e.s,...(e.r?[e.r]:[])])+(l.trimEnd().endsWith(",")?",":"")}).join("\n");
if(OLD.size)fail("core rows missing from core-rows.txt: "+[...OLD.keys()]);
const aliasNames=Object.keys(aliases).filter(n=>seen.has(n.toLowerCase()));
Object.keys(aliases).forEach(n=>{if(!seen.has(n.toLowerCase()))fail("alias for an unknown row: "+n)});
const sections=[["USDA SR Legacy generic foods (values verbatim)",rows],["Turkish home dishes (computed from recipes)",recipes],["Packaged products and restaurant items (USDA SR Legacy, verbatim)",extra],["Meal records (component grams x values, meals.txt)",meals],["Proxy and component-computed common Turkish foods (proxies.txt; proxy reasons in proxy-notes.tsv)",proxies.concat(proxyMeals)]];
const body=existing+sections.map(([title,list])=>",\n    /* "+title+" */\n"+list.map(line).join(",\n")).join("");
const NOTES=Object.fromEntries(rd("proxy-notes.tsv").map(l=>l.split("\t")));Object.keys(NOTES).forEach(n=>{if(!seen.has(n.toLowerCase()))fail("note for an unknown row: "+n)});
const tablesJs="const ALIASES="+q(Object.fromEntries(aliasNames.map(n=>[n,aliases[n]])))+";const PROXY_NOTES="+q(NOTES)+";const PARTS_BY_FOOD="+q(PARTS)+";";
const out=rf("template.js").replace("/*ROWS*/",()=>body).replace("/*CORE*/",()=>(existing.match(/^\s*\["/gm)||[]).length).replace("/*ALIASES*/",()=>"  "+tablesJs);
if(process.argv[2]==="--check"){if(fs.readFileSync(OUT,"utf8").replace(/\r/g,"")!==out){console.error("foods.js does not match the generated output: node tools/nutrition/generate.js");process.exit(1)}process.exit(0)}
fs.writeFileSync(OUT,out);console.log(names.length+" rows ("+rows.length+" USDA, "+recipes.length+" recipes, "+(proxies.length+proxyMeals.length)+" proxies, "+extra.length+" packaged, "+meals.length+" meals), "+Buffer.byteLength(out)+" bytes");
