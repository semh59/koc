// Generates www/modules/nutrition/foods.js: node tools/besin/uret.js [--kontrol]. Sources: genel.tsv, malzeme.tsv, tarif.txt, ek.tsv, ogun.txt, vekil.txt, vekil-ogun.txt, esad.tsv, vekil.tsv, mevcut.txt, eski.tsv, eski.txt, usda-altkume.json, harici.json.
const fs=require("fs"),path=require("path");
const H=__dirname+"/",OUT=path.join(H,"../../www/modules/nutrition/foods.js");
const rf=f=>fs.readFileSync(H+f,"utf8").replace(/\r/g,"");
const rd=f=>rf(f).split("\n").filter(l=>l.trim()&&!l.startsWith("#"));
const U={...JSON.parse(rd("usda-altkume.json").join("")),...JSON.parse(rd("harici.json").join(""))};
const YAG=new Set(["Zeytinyağı","Tereyağı","Ayçiçek yağı","Margarin","Mısırözü yağı"]);
const VERIM={cig:1,corba:.9,yemek:.85,pilav:.94,firin:.8,kizart:.85,hamur:.88,tatli:.9};
const r1=x=>Math.round(x*10)/10,q=x=>JSON.stringify(x);
const por=s=>s.split(";").map(x=>{const[l,g]=x.split("=");return[l.trim(),parseFloat(g)]});
const rows=[],alt={};const veri={};
const hata=m=>{console.error("HATA: "+m);process.exit(2)};
for(const l of rd("genel.tsv")){
  const[n,kw,p,e]=l.split("\t"),u=U[kw];if(!u)hata("altkümede yok: "+kw);
  veri[n]=u;rows.push([n,u.k,u.p,u.c,u.f,por(p),1]);if(e)alt[n]=e.trim();
}
for(const l of rd("malzeme.tsv")){const[n,kw]=l.split("\t");if(!U[kw])hata("altkümede yok: "+kw);veri[n]=U[kw]}
for(const l of rd("esad.tsv"))alt[l.split("\t")[0]]=l.split("\t")[1].trim();
let mevcut=rf("mevcut.txt").replace(/\s+$/,"");
// Yalnız USDA ile doğrulanmış (1 işaretli) eski satırlar malzeme olabilir; elle girilmişler olamaz.
for(const r of new Function("return ["+mevcut+"]")())if(r[6]===1&&!veri[r[0]])veri[r[0]]={k:r[1],p:r[2],c:r[3],f:r[4]};
const ek=[];
for(const l of rd("ek.tsv")){
  const[n,kw,p,e,o]=l.split("	"),u=U[kw];if(!u)hata("altkümede yok: "+kw);
  veri[n]=u;ek.push([n,u.k,u.p,u.c,u.f,por(p),1,0,...(o==="1"?[1]:[])]);if(e)alt[n]=e.trim();
}
const rng={};// tarif malzemesinin az/bol yağlı kcal değeri öğüne taşınır
// Tarif ve öğün bileşenleri (ad, pişmiş 100 g başına çiğ gram): alışveriş listesi yemeği ürünlere böler.
const PARCA={};
const isle=(dosya,ogun)=>rd(dosya).map(l=>{
  const[n,y,p,m,e,sp]=l.split(" | ").map(s=>s.trim()),yv=VERIM[y]??parseFloat(y);
  if(!(yv>0))hata("verim: "+n);
  const ing=m.split(";").map(s=>{const i=s.lastIndexOf(" ");return[s.slice(0,i).trim(),+s.slice(i+1)]});
  ing.forEach(([a])=>{if(!veri[a]&&a!=="Su")hata(n+": malzeme yok: "+a)});
  const hesap=sc=>{
    let yag=0,sade=0;const t={k:0,p:0,c:0,f:0};
    for(const[a,g]of ing){const v=veri[a],m=YAG.has(a)?sc:1;if(YAG.has(a))yag+=g*m;else sade+=g;for(const k in t)t[k]+=g*m*v[k]/100;if(rng[a]&&sc!==1)t.k+=g*(rng[a][sc<1?0:1]-v.k)/100}
    const w=sade*yv+yag;return{w,...Object.fromEntries(Object.entries(t).map(([k,x])=>[k,x*100/w]))};
  };
  const b=hesap(1),k=Math.round(b.k),ss=sp&&parseFloat(sp.slice(1))/100;
  const lo=ss?Math.round(k*(1-ss)):Math.round(hesap(.6).k),hi=ss?Math.round(k*(1+ss)):Math.round(hesap(1.5).k);
  if(b.k>900)hata(n+": kcal>900");
  const g=Math.round(b.w),u=ogun?[[p+" ("+g+" g)",g]]:por(p),r=lo<k&&k<hi?[lo,hi]:0;
  veri[n]={k:b.k,p:b.p,c:b.c,f:b.f};if(r)rng[n]=r;
  PARCA[n]=ing.filter(([a])=>a!=="Su").map(([a,x])=>[a,r1(x*100/b.w)]);
  if(e&&e!=="-")alt[n]=e;
  return [n,k,r1(b.p),r1(b.c),r1(b.f),u,0,...(ogun?[r,1]:r?[r]:[])];
});
const tarif=isle("tarif.txt"),ogun=isle("ogun.txt",true),vekil=isle("vekil.txt"),vekilO=isle("vekil-ogun.txt",true);
const adlar=[...mevcut.matchAll(/^\s*\["([^"]+)"/gm)].map(m=>m[1]).concat(rows.map(r=>r[0]),tarif.map(r=>r[0]),ek.map(r=>r[0]),ogun.map(r=>r[0]),vekil.map(r=>r[0]),vekilO.map(r=>r[0]));
const t=new Set();adlar.forEach(a=>{const k=a.toLowerCase();if(t.has(k))hata("yinelenen ad: "+a);t.add(k)});
const satir=a=>"    ["+a.map(x=>q(x)).join(",")+"]";
// İlk 106 satırın değerleri: eski.tsv (USDA birebir, 1) ve eski.txt (tarif/vekil hesabı, 0). Ad, sıra ve porsiyon mevcut.txt'te kalır. isle() veri'yi değiştirir, bu yüzden en son çağrılır.
const E=new Map([...rd("eski.tsv").map(l=>{const[n,kw]=l.split("	"),u=U[kw];if(!u)hata("altkümede yok: "+kw);return[n,{k:u.k,p:u.p,c:u.c,f:u.f,s:1}]}),...isle("eski.txt").map(r=>[r[0],{k:r[1],p:r[2],c:r[3],f:r[4],s:0,r:r[7]}])]);
mevcut=mevcut.split("\n").map(l=>{const m=l.match(/^\s*\["([^"]+)"/),e=m&&E.get(m[1]);if(!e)return l;E.delete(m[1]);
  return satir([m[1],e.k,e.p,e.c,e.f,new Function("return "+l.trim().replace(/,$/,""))()[5],e.s,...(e.r?[e.r]:[])])+(l.trimEnd().endsWith(",")?",":"")}).join("\n");
if(E.size)hata("eski: mevcut.txt'te yok: "+[...E.keys()]);
const esad=Object.keys(alt).filter(n=>t.has(n.toLowerCase()));
Object.keys(alt).forEach(n=>{if(!t.has(n.toLowerCase()))hata("eş ad için kayıt yok: "+n)});
const body=mevcut+",\n    /* USDA SR Legacy genel besinler (değerler birebir) */\n"+rows.map(satir).join(",\n")+",\n    /* Türk ev yemekleri (tarif hesaplı) */\n"+tarif.map(satir).join(",\n")+",\n    /* Hazır ürün ve restoran (USDA SR Legacy, birebir) */\n"+ek.map(satir).join(",\n")+",\n    /* Öğün kayıtları (bileşen gramı x değer, ogun.txt) */\n"+ogun.map(satir).join(",\n")+",\n    /* Vekil ve bileşenden hesaplı yaygın Türk besinleri (vekil.txt; vekil nedeni vekil.tsv) */\n"+vekil.concat(vekilO).map(satir).join(",\n");
const VEK=Object.fromEntries(rd("vekil.tsv").map(l=>l.split("\t")));Object.keys(VEK).forEach(n=>{if(!t.has(n.toLowerCase()))hata("vekil notu için kayıt yok: "+n)});
const altS="const ALT="+q(Object.fromEntries(esad.map(n=>[n,alt[n]])))+";const VEK="+q(VEK)+";const PARCA="+q(PARCA)+";";
const out=rf("sablon.js").replace("/*SATIRLAR*/",()=>body).replace("/*CORE*/",()=>(mevcut.match(/^\s*\["/gm)||[]).length).replace("/*ALT*/",()=>"  "+altS);
if(process.argv[2]==="--kontrol"){if(fs.readFileSync(OUT,"utf8").replace(/\r/g,"")!==out){console.error("foods.js üretilen çıktıyla uyuşmuyor: node tools/besin/uret.js");process.exit(1)}process.exit(0)}
fs.writeFileSync(OUT,out);console.log(adlar.length+" kayıt ("+rows.length+" USDA, "+tarif.length+" tarif, "+(vekil.length+vekilO.length)+" vekil, "+ek.length+" hazır, "+ogun.length+" öğün), "+Buffer.byteLength(out)+" bayt");
